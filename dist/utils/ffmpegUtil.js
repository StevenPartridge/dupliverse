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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
class FFmpegUtil {
    static convertFile(inputPath, outputPath, format, bitrate) {
        // Adjust extension for ALAC
        if (format === 'alac') {
            outputPath = path_1.default.join(path_1.default.dirname(outputPath), `${path_1.default.basename(outputPath, path_1.default.extname(outputPath))}.m4a`);
        }
        return new Promise((resolve, reject) => {
            const command = (0, fluent_ffmpeg_1.default)(inputPath)
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
                .on('end', () => __awaiter(this, void 0, void 0, function* () {
                try {
                    const coverArtPath = yield FFmpegUtil.extractCoverArt(inputPath);
                    if (coverArtPath) {
                        yield FFmpegUtil.injectMetadata(outputPath, coverArtPath);
                        fs_1.default.unlinkSync(coverArtPath); // Clean up temporary cover art file
                    }
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            }))
                .on('error', (err, stdout, stderr) => {
                console.error(`Error: ${err.message}`);
                console.error(`FFmpeg stdout: ${stdout}`);
                console.error(`FFmpeg stderr: ${stderr}`);
                reject(err);
            })
                .run();
        });
    }
    static extractCoverArt(inputPath) {
        const coverArtPath = path_1.default.join(path_1.default.dirname(inputPath), `${path_1.default.basename(inputPath, path_1.default.extname(inputPath))}_cover.jpg`);
        return new Promise((resolve, reject) => {
            const command = (0, fluent_ffmpeg_1.default)(inputPath)
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
    static injectMetadata(outputPath, coverArtPath) {
        return new Promise((resolve, reject) => {
            const command = `atomicparsley "${outputPath}" --artwork "${coverArtPath}" --overWrite`;
            (0, child_process_1.exec)(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error injecting metadata: ${error.message}`);
                    console.error(`AtomicParsley stdout: ${stdout}`);
                    console.error(`AtomicParsley stderr: ${stderr}`);
                    reject(error);
                }
                else {
                    console.log(`Metadata injected for ${outputPath}`);
                    resolve();
                }
            });
        });
    }
}
exports.default = FFmpegUtil;
