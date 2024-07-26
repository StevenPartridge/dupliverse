import { INPUT_FOLDER, OUTPUT_FOLDER } from './config.js';
import FFmpegUtil from './utils/ffmpegUtil.js';
import FSUtil from './utils/fsUtil.js';
import path from 'path';
import fs from 'fs/promises';
import { Logger, OUTPUT_LEVEL } from './utils/logger.js';
import UserInteractionUtil from './utils/userInput.js';
import ToolUtil from './utils/toolUtil.js';
const MAX_LOSSLESS_BITRATE = 1411;
const MAX_LOSSY_BITRATE = 320;
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
async function processFiles() {
    await ToolUtil.checkRequiredTools(['ffmpeg', 'atomicparsley']);
    const originCount = await FSUtil.countFiles(INPUT_FOLDER);
    const targetCount = await FSUtil.countFiles(OUTPUT_FOLDER);
    const flacCount = await FSUtil.countFilesByExtensions(INPUT_FOLDER, audioExtensions.filter((ext) => !supportedFormats.includes(ext)));
    const mp3Count = await FSUtil.countFilesByExtensions(INPUT_FOLDER, supportedFormats);
    UserInteractionUtil.logInfo(`Origin has ${originCount} files.`);
    UserInteractionUtil.logInfo(`Target already has ${targetCount} files.`);
    UserInteractionUtil.logInfo(`Origin has ${flacCount} unsupported files to convert.`);
    UserInteractionUtil.logInfo(`Origin has ${mp3Count} supported files to copy.`);
    UserInteractionUtil.logInfo('Press Enter to continue or Ctrl+C to exit.');
    await UserInteractionUtil.waitForEnter();
    const allFiles = [];
    const existingFiles = [];
    const filesToConvertOrCopy = [];
    for await (const filePath of FSUtil.getFilesRecursively(INPUT_FOLDER)) {
        const ext = path.extname(filePath).toLowerCase().slice(1);
        if (!audioExtensions.includes(ext)) {
            UserInteractionUtil.logDebug(`Skipping non-audio file: ${filePath}`);
            continue;
        }
        allFiles.push(filePath);
        const relativePath = path.relative(INPUT_FOLDER, filePath);
        const outputDir = path.dirname(path.join(OUTPUT_FOLDER, relativePath));
        let outputFilePath = path.join(outputDir, path.basename(filePath));
        if (!supportedFormats.includes(ext)) {
            outputFilePath = path.join(outputDir, `${path.basename(filePath, path.extname(filePath))}.m4a`);
        }
        if (await FSUtil.fileExists(outputFilePath)) {
            existingFiles.push(outputFilePath);
            UserInteractionUtil.logDebug(`Skipping already processed file: ${outputFilePath}`);
            continue;
        }
        filesToConvertOrCopy.push(filePath);
    }
    const totalFiles = filesToConvertOrCopy.length;
    UserInteractionUtil.startProgressBar(totalFiles);
    let processedCount = 0;
    for (const filePath of filesToConvertOrCopy) {
        const ext = path.extname(filePath).toLowerCase().slice(1);
        const relativePath = path.relative(INPUT_FOLDER, filePath);
        const outputDir = path.dirname(path.join(OUTPUT_FOLDER, relativePath));
        let outputFilePath = path.join(outputDir, path.basename(filePath));
        const inputFileInformation = await FFmpegUtil.getFileInformation(filePath);
        const outputFileInformation = await FFmpegUtil.getFileInformation(outputFilePath);
        if (!inputFileInformation) {
            UserInteractionUtil.logError(`Could not get information for ${filePath}`);
            continue;
        }
        console.log(ext);
        console.log(inputFileInformation);
        if (!supportedFormats.includes(ext)) {
            if (!inputFileInformation.isLossy) {
                outputFilePath = path.join(outputDir, `${path.basename(filePath, path.extname(filePath))}.m4a`);
            }
            else {
                outputFilePath = path.join(outputDir, `${path.basename(filePath, path.extname(filePath))}.mp3`);
            }
        }
        // To update the progress bar
        processedCount++;
        // Update the file in place if it already exists and exceeds the maximum bitrate
        if (outputFileInformation) {
            let didUpdate = false;
            if (outputFileInformation.isLossy &&
                outputFileInformation.bitrate > MAX_LOSSY_BITRATE) {
                await FFmpegUtil.updateFileInPlace(outputFilePath, 'mp3', '320k');
                didUpdate = true;
            }
            else if (!outputFileInformation.isLossy &&
                outputFileInformation.bitrate > MAX_LOSSLESS_BITRATE) {
                await FFmpegUtil.updateFileInPlace(outputFilePath, 'm4a', '320k');
                didUpdate = true;
            }
            existingFiles.push(outputFilePath);
            if (didUpdate) {
                UserInteractionUtil.logInfo(`Updated file in place: ${outputFilePath} (${processedCount}/${totalFiles})`);
            }
            else {
                UserInteractionUtil.logInfo(`Skipping existing file: ${outputFilePath} (${processedCount}/${totalFiles})`);
            }
            continue;
        }
        await FSUtil.ensureDirectoryExists(outputDir);
        try {
            UserInteractionUtil.logInfo(`Processing ${filePath} (${processedCount}/${totalFiles})`);
            if (supportedFormats.includes(ext)) {
                if (inputFileInformation.isLossy &&
                    inputFileInformation.bitrate > MAX_LOSSY_BITRATE) {
                    await FFmpegUtil.convertFile(filePath, outputFilePath, 'mp3', '320k');
                }
                else if (!inputFileInformation.isLossy &&
                    inputFileInformation.bitrate > MAX_LOSSLESS_BITRATE) {
                    await FFmpegUtil.convertFile(filePath, outputFilePath, 'alac', '1411k');
                }
                else {
                    UserInteractionUtil.logInfo(`Copying ${filePath} to ${outputFilePath}`);
                    await fs.copyFile(filePath, outputFilePath);
                    UserInteractionUtil.logInfo(`Copied ${filePath} to ${outputFilePath}`);
                }
            }
        }
        catch (error) {
            UserInteractionUtil.logError(`Error processing ${filePath}: ${error}`);
        }
        UserInteractionUtil.updateProgressBar(processedCount);
    }
    UserInteractionUtil.stopProgressBar();
    UserInteractionUtil.logInfo(`Total files found: ${allFiles.length}`);
    UserInteractionUtil.logInfo(`Files that already existed: ${existingFiles.length}`);
    UserInteractionUtil.clearOutput();
    UserInteractionUtil.printLogs();
}
processFiles();
