enum OUTPUT_LEVEL {
  NONE,
  ERROR,
  INFO,
  DEBUG,
}

class Logger {
  private static currentLevel: OUTPUT_LEVEL = OUTPUT_LEVEL.INFO;

  static setLevel(level: OUTPUT_LEVEL): void {
    Logger.currentLevel = level;
  }

  static error(message: string, ...optionalParams: unknown[]): void {
    if (Logger.currentLevel >= OUTPUT_LEVEL.ERROR) {
      console.error(`[ERROR]: ${message}`, ...optionalParams);
    }
  }

  static info(message: string, ...optionalParams: unknown[]): void {
    if (Logger.currentLevel >= OUTPUT_LEVEL.INFO) {
      console.info(`[INFO]: ${message}`, ...optionalParams);
    }
  }

  static debug(message: string, ...optionalParams: unknown[]): void {
    if (Logger.currentLevel >= OUTPUT_LEVEL.DEBUG) {
      console.debug(`[DEBUG]: ${message}`, ...optionalParams);
    }
  }

  static log(message: string, ...optionalParams: unknown[]): void {
    console.log(message, ...optionalParams);
  }
}

export { Logger, OUTPUT_LEVEL };
