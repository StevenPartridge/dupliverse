import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';
import { Logger } from './logger';

class FFmpegUtil {
  static convertFile(
    inputPath: string,
    outputPath: string,
    format: string,
  ): Promise<void> {
    // Adjust extension for ALAC
    if (format.toLowerCase() === 'alac') {
      outputPath = path.join(
        path.dirname(outputPath),
        `${path.basename(outputPath, path.extname(outputPath))}.m4a`,
      );
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec(format)
        .noVideo() // Disable video altogether
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
              fs.unlinkSync(coverArtPath); // Clean up temporary cover art file
            }
            resolve();
          } catch (error) {
            Logger.debug('Missing cover art');
            resolve();
          }
        })
        .on('error', (err, stdout, stderr) => {
          Logger.error(`Error: ${err.message}`);
          Logger.error(`FFmpeg stdout: ${stdout}`);
          Logger.error(`FFmpeg stderr: ${stderr}`);
          reject(err);
        })
        .run();
    });
  }

  static extractCoverArt(inputPath: string): Promise<string | null> {
    const coverArtPath = path.join(
      path.dirname(inputPath),
      `${path.basename(inputPath, path.extname(inputPath))}_cover.jpg`,
    );

    return new Promise((resolve) => {
      ffmpeg(inputPath)
        .outputOptions('-map', '0:v?', '-c', 'copy')
        .output(coverArtPath)
        .on('end', () => {
          resolve(coverArtPath);
        })
        .on('error', (err) => {
          Logger.debug(`Error extracting cover art: ${err.message}`);
          resolve(null); // Resolve with null if extraction fails
        })
        .run();
    });
  }

  static injectMetadata(
    outputPath: string,
    coverArtPath: string,
  ): Promise<void> {
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
  }
}

export default FFmpegUtil;
