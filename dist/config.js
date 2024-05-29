import dotenv from 'dotenv';
dotenv.config();
export const INPUT_FOLDER = process.env.INPUT_FOLDER || './input';
export const OUTPUT_FOLDER = process.env.OUTPUT_FOLDER || './output';
export const TARGET_FORMAT = process.env.TARGET_FORMAT || 'alac';
export const BITRATE = process.env.BITRATE || '256k';
export const LOG_LEVEL = process.env.OUTPUT_LEVEL || 'INFO';
