import { INPUT_FOLDER, OUTPUT_FOLDER } from './config.js';
import FSUtil from './utils/fsUtil.js';
import path from 'path';
import { Logger, OUTPUT_LEVEL } from './utils/logger.js';
import UserInteractionUtil from './utils/userInput.js';
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
// Add dry run mode
const DRY_RUN = false;
async function processFiles() {
    let originCount = 0;
    const targetCount = await FSUtil.countFiles(OUTPUT_FOLDER);
    let existingCount = 0;
    let filesToCopyCount = 0;
    UserInteractionUtil.logInfo(`Counting and categorizing files...`);
    const filesToCopy = [];
    for await (const filePath of FSUtil.getFilesRecursively(INPUT_FOLDER)) {
        const ext = path.extname(filePath).toLowerCase().slice(1);
        if (!audioExtensions.includes(ext)) {
            UserInteractionUtil.logDebug(`Skipping non-audio file: ${filePath}`);
            continue;
        }
        originCount++;
        const relativePath = path.relative(INPUT_FOLDER, filePath);
        const outputDir = path.join(OUTPUT_FOLDER, path.dirname(relativePath));
        const outputFilePath = path.join(outputDir, path.basename(filePath));
        if (await FSUtil.fileExists(outputFilePath)) {
            existingCount++;
            UserInteractionUtil.logDebug(`Skipping already processed file: ${outputFilePath}`);
            continue;
        }
        filesToCopy.push(filePath);
        filesToCopyCount++;
    }
    UserInteractionUtil.logInfo(`Origin has ${originCount} files.`);
    UserInteractionUtil.logInfo(`Target already has ${targetCount} files.`);
    UserInteractionUtil.logInfo(`Files that already existed: ${existingCount}`);
    UserInteractionUtil.logInfo(`Files to copy: ${filesToCopyCount}`);
    if (DRY_RUN) {
        UserInteractionUtil.logInfo('Dry run mode enabled. No files will be processed.');
        return;
    }
    const totalFiles = filesToCopy.length;
    UserInteractionUtil.startProgressBar(totalFiles);
    let processedCount = 0;
    for (const filePath of filesToCopy) {
        const relativePath = path.relative(INPUT_FOLDER, filePath);
        const outputDir = path.join(OUTPUT_FOLDER, path.dirname(relativePath));
        const outputFilePath = path.join(outputDir, path.basename(filePath));
        console.log(OUTPUT_FOLDER, relativePath);
        console.log(outputDir);
        console.log(outputFilePath);
        // To update the progress bar
        processedCount++;
        await FSUtil.ensureDirectoryExists(outputDir);
        try {
            UserInteractionUtil.logInfo(`Copying ${filePath} to ${outputFilePath} (${processedCount}/${totalFiles})`);
            await FSUtil.copyFile(filePath, outputFilePath);
            UserInteractionUtil.logInfo(`Copied ${filePath} to ${outputFilePath}`);
        }
        catch (error) {
            UserInteractionUtil.logError(`Error processing ${filePath}: ${error}`);
        }
        UserInteractionUtil.updateProgressBar(processedCount);
    }
    UserInteractionUtil.stopProgressBar();
    UserInteractionUtil.clearOutput();
    UserInteractionUtil.printLogs();
}
processFiles();
//# sourceMappingURL=index.js.map