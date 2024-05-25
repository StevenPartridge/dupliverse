import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';

class FFmpegUtil {
  static convertFile(inputPath: string, outputPath: string, format: string, bitrate: string): Promise<void> {
    // Adjust extension for ALAC
    if (format === 'alac') {
      outputPath = path.join(path.dirname(outputPath), `${path.basename(outputPath, path.extname(outputPath))}.m4a`);
    }

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .audioCodec(format)
        .audioBitrate(bitrate)
        .noVideo() // Disable video altogether
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log(`Spawned FFmpeg with command: ${commandLine}`);
        })
        .on('stderr', (stderrLine) => {
          console.log(`FFmpeg stderr: ${stderrLine}`);
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
            reject(error);
          }
        })
        .on('error', (err, stdout, stderr) => {
          console.error(`Error: ${err.message}`);
          console.error(`FFmpeg stdout: ${stdout}`);
          console.error(`FFmpeg stderr: ${stderr}`);
          reject(err);
        })
        .run();
    });
  }

  static extractCoverArt(inputPath: string): Promise<string | null> {
    const coverArtPath = path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}_cover.jpg`);

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .outputOptions('-map', '0:v', '-c', 'copy')
        .output(coverArtPath)
        .on('end', () => {
          resolve(coverArtPath);
        })
        .on('error', (err) => {
          console.error(`Error extracting cover art: ${err.message}`);
          resolve(null); // Resolve with null if extraction fails
        })
        .run();
    });
  }

  static injectMetadata(outputPath: string, coverArtPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = `atomicparsley "${outputPath}" --artwork "${coverArtPath}" --overWrite`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error injecting metadata: ${error.message}`);
          console.error(`AtomicParsley stdout: ${stdout}`);
          console.error(`AtomicParsley stderr: ${stderr}`);
          reject(error);
        } else {
          console.log(`Metadata injected for ${outputPath}`);
          resolve();
        }
      });
    });
  }
}

export default FFmpegUtil;
