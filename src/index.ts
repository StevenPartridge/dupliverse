import { INPUT_FOLDER, OUTPUT_FOLDER, TARGET_FORMAT, BITRATE } from './config';
import FFmpegUtil from './utils/ffmpegUtil';
import FSUtil from './utils/fsUtil';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';

const supportedFormats = ['mp3', 'aac', 'm4a', 'wav', 'aiff'];
const audioExtensions = ['flac', 'wav', 'aiff', 'ogg', 'wma', 'alac', 'aac', 'mp3'];

function checkToolInstalled(tool: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`${tool} -version`, (error) => {
      resolve(!error);
    });
  });
}

async function checkRequiredTools(): Promise<void> {
  const tools = ['ffmpeg', 'atomicparsley'];
  const missingTools: string[] = [];

  for (const tool of tools) {
    const isInstalled = await checkToolInstalled(tool);
    if (!isInstalled) {
      missingTools.push(tool);
    }
  }

  if (missingTools.length > 0) {
    console.error(`Missing required tools: ${missingTools.join(', ')}`);
    process.exit(1);
  }
}

async function processFiles() {
  await checkRequiredTools();

  const allFiles: string[] = [];
  const existingFiles: string[] = [];
  const filesToConvertOrCopy: string[] = [];

  for await (const filePath of FSUtil.getFilesRecursively(INPUT_FOLDER)) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    if (!audioExtensions.includes(ext)) {
      console.log(`Skipping non-audio file: ${filePath}`);
      continue;
    }

    allFiles.push(filePath);
    const relativePath = path.relative(INPUT_FOLDER, filePath);
    const outputDir = path.dirname(path.join(OUTPUT_FOLDER, relativePath));
    let outputFilePath = path.join(outputDir, `${path.basename(relativePath, path.extname(relativePath))}.${TARGET_FORMAT}`);

    // Skip conversion for supported formats and simply copy the file
    if (supportedFormats.includes(ext)) {
      outputFilePath = path.join(outputDir, path.basename(filePath));
      if (await FSUtil.fileExists(outputFilePath)) {
        existingFiles.push(outputFilePath);
        console.log(`Skipping existing file: ${outputFilePath}`);
        continue;
      }
      filesToConvertOrCopy.push(filePath);

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
      existingFiles.push(outputFilePath);
      console.log(`Skipping existing file: ${outputFilePath}`);
      continue;
    }
    filesToConvertOrCopy.push(filePath);

    await FSUtil.ensureDirectoryExists(outputDir);

    try {
      console.log(`Converting ${filePath} to ${outputFilePath}`);
      await FFmpegUtil.convertFile(filePath, outputFilePath, TARGET_FORMAT, BITRATE);
      console.log(`Converted ${filePath} to ${outputFilePath}`);
    } catch (error) {
      console.error(`Error converting ${filePath}:`, error);
    }
  }

  console.log(`Total files found: ${allFiles.length}`);
  console.log(`Files already exist: ${existingFiles.length}`);
  console.log(`Files to convert or copy: ${filesToConvertOrCopy.length}`);
}

processFiles();
