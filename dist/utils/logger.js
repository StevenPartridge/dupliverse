var OUTPUT_LEVEL;
(function (OUTPUT_LEVEL) {
    OUTPUT_LEVEL[OUTPUT_LEVEL["NONE"] = 0] = "NONE";
    OUTPUT_LEVEL[OUTPUT_LEVEL["ERROR"] = 1] = "ERROR";
    OUTPUT_LEVEL[OUTPUT_LEVEL["INFO"] = 2] = "INFO";
    OUTPUT_LEVEL[OUTPUT_LEVEL["DEBUG"] = 3] = "DEBUG";
})(OUTPUT_LEVEL || (OUTPUT_LEVEL = {}));
class Logger {
    static currentLevel = OUTPUT_LEVEL.INFO;
    static setLevel(level) {
        Logger.currentLevel = level;
    }
    static error(message, ...optionalParams) {
        if (Logger.currentLevel >= OUTPUT_LEVEL.ERROR) {
            console.error(`[ERROR]: ${message}`, ...optionalParams);
        }
    }
    static info(message, ...optionalParams) {
        if (Logger.currentLevel >= OUTPUT_LEVEL.INFO) {
            console.info(`[INFO]: ${message}`, ...optionalParams);
        }
    }
    static debug(message, ...optionalParams) {
        if (Logger.currentLevel >= OUTPUT_LEVEL.DEBUG) {
            console.debug(`[DEBUG]: ${message}`, ...optionalParams);
        }
    }
    static log(message, ...optionalParams) {
        console.log(message, ...optionalParams);
    }
}
export { Logger, OUTPUT_LEVEL };
//# sourceMappingURL=logger.js.map