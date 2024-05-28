"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const ffmpegUtil_1 = __importDefault(require("./utils/ffmpegUtil"));
const fsUtil_1 = __importDefault(require("./utils/fsUtil"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const child_process_1 = require("child_process");
const logger_1 = require("./utils/logger");
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
logger_1.Logger.setLevel(logger_1.OUTPUT_LEVEL.INFO);
function checkToolInstalled(tool) {
    return new Promise((resolve) => {
        (0, child_process_1.exec)(`${tool} -version`, (error) => {
            resolve(!error);
        });
    });
}
function checkRequiredTools() {
    return __awaiter(this, void 0, void 0, function* () {
        const tools = ['ffmpeg', 'atomicparsley'];
        const missingTools = [];
        for (const tool of tools) {
            const isInstalled = yield checkToolInstalled(tool);
            if (!isInstalled) {
                missingTools.push(tool);
            }
        }
        if (missingTools.length > 0) {
            logger_1.Logger.error(`Missing required tools: ${missingTools.join(', ')}`);
            process.exit(1);
        }
    });
}
function processFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        yield checkRequiredTools();
        const originCount = yield fsUtil_1.default.countFiles(config_1.INPUT_FOLDER);
        const targetCount = yield fsUtil_1.default.countFiles(config_1.OUTPUT_FOLDER);
        const flacCount = yield fsUtil_1.default.countFilesByExtensions(config_1.INPUT_FOLDER, audioExtensions.filter((ext) => !supportedFormats.includes(ext)));
        const mp3Count = yield fsUtil_1.default.countFilesByExtensions(config_1.INPUT_FOLDER, supportedFormats);
        logger_1.Logger.info(`Origin has ${originCount} files.`);
        logger_1.Logger.info(`Target already has ${targetCount} files.`);
        logger_1.Logger.info(`Origin has ${flacCount} unsupported files to convert.`);
        logger_1.Logger.info(`Origin has ${mp3Count} supported files to copy.`);
        logger_1.Logger.info('Press Enter to continue or Ctrl+C to exit.');
        yield new Promise((resolve) => {
            process.stdin.once('data', () => {
                process.stdin.pause();
                resolve();
            });
        });
        const allFiles = [];
        const existingFiles = [];
        const filesToConvertOrCopy = [];
        try {
            for (var _d = true, _e = __asyncValues(fsUtil_1.default.getFilesRecursively(config_1.INPUT_FOLDER)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const filePath = _c;
                const ext = path_1.default.extname(filePath).toLowerCase().slice(1);
                if (!audioExtensions.includes(ext)) {
                    logger_1.Logger.debug(`Skipping non-audio file: ${filePath}`);
                    continue;
                }
                allFiles.push(filePath);
                const relativePath = path_1.default.relative(config_1.INPUT_FOLDER, filePath);
                const outputDir = path_1.default.dirname(path_1.default.join(config_1.OUTPUT_FOLDER, relativePath));
                let outputFilePath = path_1.default.join(outputDir, `${path_1.default.basename(relativePath, path_1.default.extname(relativePath))}.${config_1.TARGET_FORMAT}`);
                if (supportedFormats.includes(ext)) {
                    outputFilePath = path_1.default.join(outputDir, path_1.default.basename(filePath));
                }
                if (yield fsUtil_1.default.fileExists(outputFilePath)) {
                    existingFiles.push(outputFilePath);
                    logger_1.Logger.debug(`Skipping already processed file: ${outputFilePath}`);
                    continue;
                }
                filesToConvertOrCopy.push(filePath);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const totalFiles = filesToConvertOrCopy.length;
        let processedCount = 0;
        for (const filePath of filesToConvertOrCopy) {
            const ext = path_1.default.extname(filePath).toLowerCase().slice(1);
            const relativePath = path_1.default.relative(config_1.INPUT_FOLDER, filePath);
            const outputDir = path_1.default.dirname(path_1.default.join(config_1.OUTPUT_FOLDER, relativePath));
            let outputFilePath = path_1.default.join(outputDir, `${path_1.default.basename(relativePath, path_1.default.extname(relativePath))}.${config_1.TARGET_FORMAT}`);
            if (supportedFormats.includes(ext)) {
                outputFilePath = path_1.default.join(outputDir, path_1.default.basename(filePath));
            }
            else if (config_1.TARGET_FORMAT === 'alac') {
                outputFilePath = path_1.default.join(path_1.default.dirname(outputFilePath), `${path_1.default.basename(outputFilePath, path_1.default.extname(outputFilePath))}.m4a`);
            }
            processedCount++;
            if (yield fsUtil_1.default.fileExists(outputFilePath)) {
                existingFiles.push(outputFilePath);
                logger_1.Logger.info(`Skipping existing file: ${outputFilePath} (${processedCount}/${totalFiles})`);
                continue;
            }
            yield fsUtil_1.default.ensureDirectoryExists(outputDir);
            try {
                logger_1.Logger.info(`Processing ${filePath} (${processedCount}/${totalFiles})`);
                if (supportedFormats.includes(ext)) {
                    logger_1.Logger.info(`Copying ${filePath} to ${outputFilePath}`);
                    yield promises_1.default.copyFile(filePath, outputFilePath);
                    logger_1.Logger.info(`Copied ${filePath} to ${outputFilePath}`);
                }
                else {
                    logger_1.Logger.info(`Converting ${filePath} to ${outputFilePath}`);
                    yield ffmpegUtil_1.default.convertFile(filePath, outputFilePath, config_1.TARGET_FORMAT);
                    logger_1.Logger.info(`Converted ${filePath} to ${outputFilePath}`);
                }
            }
            catch (error) {
                logger_1.Logger.error(`Error processing ${filePath}:`, error);
            }
        }
        logger_1.Logger.info(`Total files found: ${allFiles.length}`);
        logger_1.Logger.info(`Files already exist: ${existingFiles.length}`);
        logger_1.Logger.info(`Files to convert or copy: ${filesToConvertOrCopy.length}`);
        logger_1.Logger.info(`Processed files: ${processedCount}`);
    });
}
processFiles();
