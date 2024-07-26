import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';
import { Logger } from './logger.js';
import smb2 from 'smb2';
import { promisify } from 'util';

const smb2Client = new smb2({
  share: '\\\\192.168.1.20\\server4tb',
  domain: '',
  username: '',
  password: '',
});

const smbReadFile = promisify(smb2Client.readFile.bind(smb2Client));

interface FileInfo {
  format: string;
  bitrate: number;
  isLossy: boolean;
}

class FFmpegUtil {
  static async updateFileInPlace(
    inputPath: string,
    format: string,
    targetBitrate: string,
  ): Promise<void> {
    const tempOutputPath = `${inputPath}.tmp`;

    try {
      await this.convertFile(inputPath, tempOutputPath, format, targetBitrate);
      fs.renameSync(tempOutputPath, inputPath);
      Logger.info(`Updated file in place: ${inputPath}`);
    } catch (error) {
      Logger.error(`Error updating file in place: ${error}`);
      throw error;
    }
  }

  static async convertFile(
    inputPath: string,
    outputPath: string,
    format: string,
    bitrate: string,
  ): Promise<void> {
    const codec = this.getCodecForFormat(format);

    if (format.toLowerCase() === 'alac') {
      outputPath = path.join(
        path.dirname(outputPath),
        `${path.basename(outputPath, path.extname(outputPath))}.m4a`,
      );
    }

    let tempInputPath: string | null = null;
    if (inputPath.startsWith('smb://')) {
      tempInputPath = await this.downloadFromSMB(inputPath);
      inputPath = tempInputPath;
    }

    return new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec(codec)
        .audioBitrate(bitrate)
        .noVideo()
        .output(outputPath)
        .on('start', (commandLine) => {
          Logger.debug(`Spawned FFmpeg with command: ${commandLine}`);
        })
        .on('stderr', (stderrLine) => {
          Logger.debug(`FFmpeg stderr: ${stderrLine}`);
        })
        .on('end', async () => {
          try {
            const coverArtPath = await FFmpegUtil.extractCoverArt(inputPath);
            if (coverArtPath) {
              await FFmpegUtil.injectMetadata(outputPath, coverArtPath);
              fs.unlinkSync(coverArtPath);
            }
            if (tempInputPath) {
              fs.unlinkSync(tempInputPath); // Clean up temporary input file
            }
            resolve();
          } catch (error) {
            Logger.debug('Missing cover art');
            if (tempInputPath) {
              fs.unlinkSync(tempInputPath); // Clean up temporary input file
            }
            resolve();
          }
        })
        .on('error', (err, stdout, stderr) => {
          Logger.error(`Error: ${err.message}`);
          Logger.error(`FFmpeg stdout: ${stdout}`);
          Logger.error(`FFmpeg stderr: ${stderr}`);
          if (tempInputPath) {
            fs.unlinkSync(tempInputPath); // Clean up temporary input file
          }
          reject(err);
        })
        .run();
    }).catch((error) => {
      Logger.error(`Conversion failed: ${error.message}`);
      throw error;
    });
  }

  static getCodecForFormat(format: string): string {
    switch (format.toLowerCase()) {
      case 'mp3':
        return 'libmp3lame';
      case 'aac':
        return 'aac';
      case 'flac':
        return 'flac';
      case 'alac':
        return 'alac';
      case 'wav':
        return 'pcm_s16le';
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  static extractCoverArt(inputPath: string): Promise<string | null> {
    const coverArtPath = path.join(
      path.dirname(inputPath),
      `${path.basename(inputPath, path.extname(inputPath))}_cover.jpg`,
    );

    return new Promise((resolve, _) => {
      ffmpeg(inputPath)
        .outputOptions('-map', '0:v?', '-c', 'copy')
        .output(coverArtPath)
        .on('end', () => {
          resolve(coverArtPath);
        })
        .on('error', (err) => {
          Logger.debug(`Error extracting cover art: ${err.message}`);
          resolve(null);
        })
        .run();
    });
  }

  static async injectMetadata(
    outputPath: string,
    coverArtPath: string,
  ): Promise<void> {
    const fileInfo = await this.getFileInformation(outputPath);

    if (fileInfo && this.isAtomicParsleySupported(fileInfo.format)) {
      return new Promise((resolve, reject) => {
        const command = `atomicparsley "${outputPath}" --artwork "${coverArtPath}" --overWrite`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            Logger.error(`Error injecting metadata: ${error.message}`);
            Logger.error(`AtomicParsley stdout: ${stdout}`);
            Logger.error(`AtomicParsley stderr: ${stderr}`);
            reject(error);
          } else {
            Logger.info(`Metadata injected for ${outputPath}`);
            resolve();
          }
        });
      });
    } else {
      Logger.info(
        `Skipping metadata injection for unsupported format: ${fileInfo?.format}`,
      );
      return Promise.resolve();
    }
  }

  static isAtomicParsleySupported(format: string): boolean {
    return (
      format.toLowerCase().includes('mp4') ||
      format.toLowerCase().includes('m4a')
    );
  }

  static getFileInformation(filePath: string): Promise<FileInfo | null> {
    return new Promise<FileInfo | null>((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const format = metadata.format.format_name;
          const bitrate = (metadata.format.bit_rate || 0) / 1000; // Convert to kbps
          const isLossy =
            !format?.includes('flac') &&
            !format?.includes('alac') &&
            !format?.includes('mp4');

          resolve({
            format: format || 'unknown',
            bitrate,
            isLossy,
          });
        }
      });
    }).catch((error) => {
      if (!String(error).includes('No such file or directory')) {
        Logger.error(`Failed to get file information: ${error.message}`);
      }
      return null;
    });
  }

  static async downloadFromSMB(smbPath: string): Promise<string> {
    const localTempPath = path.join('/tmp', path.basename(smbPath));
    const fileBuffer = await smbReadFile(smbPath);

    await fs.promises.writeFile(localTempPath, fileBuffer);

    return localTempPath;
  }
}

export default FFmpegUtil;
