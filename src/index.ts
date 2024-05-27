import { INPUT_FOLDER, OUTPUT_FOLDER, TARGET_FORMAT } from './config';
import FFmpegUtil from './utils/ffmpegUtil';
import FSUtil from './utils/fsUtil';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { Logger, OUTPUT_LEVEL } from './utils/logger';

const supportedFormats = ['mp3', 'aac', 'm4a', 'aiff', 'wav'];
const audioExtensions = [
  'flac',
  'wav',
  'aiff',
  'ogg',
  'wma',
  'alac',
  'aac',
  'mp3',
  'm4a',
];

// Set the desired log level
Logger.setLevel(OUTPUT_LEVEL.INFO);

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
    Logger.error(`Missing required tools: ${missingTools.join(', ')}`);
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
      Logger.debug(`Skipping non-audio file: ${filePath}`);
      continue;
    }

    allFiles.push(filePath);
    const relativePath = path.relative(INPUT_FOLDER, filePath);
    const outputDir = path.dirname(path.join(OUTPUT_FOLDER, relativePath));
    let outputFilePath = path.join(
      outputDir,
      `${path.basename(relativePath, path.extname(relativePath))}.${TARGET_FORMAT}`,
    );

    if (supportedFormats.includes(ext)) {
      outputFilePath = path.join(outputDir, path.basename(filePath));
    }

    if (await FSUtil.fileExists(outputFilePath)) {
      existingFiles.push(outputFilePath);
      Logger.debug(`Skipping already processed file: ${outputFilePath}`);
      continue;
    }

    filesToConvertOrCopy.push(filePath);
  }

  const totalFiles = filesToConvertOrCopy.length;
  let processedCount = 0;

  for (const filePath of filesToConvertOrCopy) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const relativePath = path.relative(INPUT_FOLDER, filePath);
    const outputDir = path.dirname(path.join(OUTPUT_FOLDER, relativePath));
    let outputFilePath = path.join(
      outputDir,
      `${path.basename(relativePath, path.extname(relativePath))}.${TARGET_FORMAT}`,
    );

    if (supportedFormats.includes(ext)) {
      outputFilePath = path.join(outputDir, path.basename(filePath));
    } else if (TARGET_FORMAT === 'alac') {
      outputFilePath = path.join(
        path.dirname(outputFilePath),
        `${path.basename(outputFilePath, path.extname(outputFilePath))}.m4a`,
      );
    }
    processedCount++;
    if (await FSUtil.fileExists(outputFilePath)) {
      existingFiles.push(outputFilePath);
      Logger.info(
        `Skipping existing file: ${outputFilePath} (${processedCount}/${totalFiles})`,
      );
      continue;
    }

    await FSUtil.ensureDirectoryExists(outputDir);

    try {
      Logger.info(`Processing ${filePath} (${processedCount}/${totalFiles})`);
      if (supportedFormats.includes(ext)) {
        Logger.info(`Copying ${filePath} to ${outputFilePath}`);
        await fs.copyFile(filePath, outputFilePath);
        Logger.info(`Copied ${filePath} to ${outputFilePath}`);
      } else {
        Logger.info(`Converting ${filePath} to ${outputFilePath}`);
        await FFmpegUtil.convertFile(filePath, outputFilePath, TARGET_FORMAT);
        Logger.info(`Converted ${filePath} to ${outputFilePath}`);
      }
    } catch (error) {
      Logger.error(`Error processing ${filePath}:`, error);
    }
  }

  Logger.info(`Total files found: ${allFiles.length}`);
  Logger.info(`Files already exist: ${existingFiles.length}`);
  Logger.info(`Files to convert or copy: ${filesToConvertOrCopy.length}`);
  Logger.info(`Processed files: ${processedCount}`);
}

processFiles();
