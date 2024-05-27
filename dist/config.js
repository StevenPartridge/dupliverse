"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_LEVEL = exports.BITRATE = exports.TARGET_FORMAT = exports.OUTPUT_FOLDER = exports.INPUT_FOLDER = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.INPUT_FOLDER = process.env.INPUT_FOLDER || './input';
exports.OUTPUT_FOLDER = process.env.OUTPUT_FOLDER || './output';
exports.TARGET_FORMAT = process.env.TARGET_FORMAT || 'alac';
exports.BITRATE = process.env.BITRATE || '256k';
exports.LOG_LEVEL = process.env.OUTPUT_LEVEL || 'INFO';
