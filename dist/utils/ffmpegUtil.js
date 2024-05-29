import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';
import { Logger } from './logger.js';
class FFmpegUtil {
    static async updateFileInPlace(inputPath, format, targetBitrate) {
        const tempOutputPath = `${inputPath}.tmp`;
        try {
            await this.convertFile(inputPath, tempOutputPath, format, targetBitrate);
            fs.renameSync(tempOutputPath, inputPath);
            Logger.info(`Updated file in place: ${inputPath}`);
        }
        catch (error) {
            Logger.error(`Error updating file in place: ${error}`);
            throw error;
        }
    }
    static convertFile(inputPath, outputPath, format, bitrate) {
        const codec = this.getCodecForFormat(format);
        if (format.toLowerCase() === 'alac') {
            outputPath = path.join(path.dirname(outputPath), `${path.basename(outputPath, path.extname(outputPath))}.m4a`);
        }
        return new Promise((resolve, reject) => {
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
                    resolve();
                }
                catch (error) {
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
        }).catch((error) => {
            Logger.error(`Conversion failed: ${error.message}`);
            throw error;
        });
    }
    static getCodecForFormat(format) {
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
    static extractCoverArt(inputPath) {
        const coverArtPath = path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}_cover.jpg`);
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
    static async injectMetadata(outputPath, coverArtPath) {
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
                    }
                    else {
                        Logger.info(`Metadata injected for ${outputPath}`);
                        resolve();
                    }
                });
            });
        }
        else {
            Logger.info(`Skipping metadata injection for unsupported format: ${fileInfo?.format}`);
            return Promise.resolve();
        }
    }
    static isAtomicParsleySupported(format) {
        const supportedFormats = ['mp4', 'm4a'];
        return supportedFormats.includes(format.toLowerCase());
    }
    static getFileInformation(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    reject(err);
                }
                else {
                    const format = metadata.format.format_name;
                    const bitrate = (metadata.format.bit_rate || 0) / 1000; // Convert to kbps
                    const isLossy = !format?.includes('flac') && !format?.includes('alac');
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
}
export default FFmpegUtil;
