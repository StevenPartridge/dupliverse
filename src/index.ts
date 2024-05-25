import { INPUT_FOLDER, OUTPUT_FOLDER, TARGET_FORMAT, BITRATE } from './config';
import FFmpegUtil from './utils/ffmpegUtil';
import FSUtil from './utils/fsUtil';
import path from 'path';
import fs from 'fs/promises';

const supportedFormats = ['mp3', 'aac', 'm4a', 'wav', 'aiff'];

async function processFiles() {
  for await (const filePath of FSUtil.getFilesRecursively(INPUT_FOLDER)) {
    const relativePath = path.relative(INPUT_FOLDER, filePath);
    const outputDir = path.dirname(path.join(OUTPUT_FOLDER, relativePath));
    let outputFilePath = path.join(outputDir, `${path.basename(relativePath, path.extname(relativePath))}.${TARGET_FORMAT}`);

    const ext = path.extname(filePath).toLowerCase().slice(1);

    // Skip conversion for supported formats and simply copy the file
    if (supportedFormats.includes(ext)) {
      outputFilePath = path.join(outputDir, path.basename(filePath));
      if (await FSUtil.fileExists(outputFilePath)) {
        console.log(`Skipping existing file: ${outputFilePath}`);
        continue;
      }

      await FSUtil.ensureDirectoryExists(outputDir);

      try {
        console.log(`Copying ${filePath} to ${outputFilePath}`);
        await fs.copyFile(filePath, outputFilePath);
        console.log(`Copied ${filePath} to ${outputFilePath}`);
      } catch (error) {
        console.error(`Error copying ${filePath}:`, error);
      }
      continue;
    }

    // Adjust extension for ALAC
    if (TARGET_FORMAT === 'alac') {
      outputFilePath = path.join(path.dirname(outputFilePath), `${path.basename(outputFilePath, path.extname(outputFilePath))}.m4a`);
    }

    if (await FSUtil.fileExists(outputFilePath)) {
      console.log(`Skipping existing file: ${outputFilePath}`);
      continue;
    }

    await FSUtil.ensureDirectoryExists(outputDir);

    try {
      console.log(`Converting ${filePath} to ${outputFilePath}`);
      await FFmpegUtil.convertFile(filePath, outputFilePath, TARGET_FORMAT, BITRATE);
      console.log(`Converted ${filePath} to ${outputFilePath}`);
    } catch (error) {
      console.error(`Error converting ${filePath}:`, error);
    }
  }
}

processFiles();
