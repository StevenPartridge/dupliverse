import fs from 'fs';
import path from 'path';

class FSUtil {
  static async ensureDirectoryExists(
    directoryPath: string,
  ): Promise<string | undefined> {
    return fs.promises.mkdir(directoryPath, { recursive: true });
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async *getFilesRecursively(directory: string): AsyncGenerator<string> {
    const dirEntries = await fs.promises.readdir(directory, {
      withFileTypes: true,
    });
    for (const dirEntry of dirEntries) {
      const res = path.resolve(directory, dirEntry.name);
      if (dirEntry.isDirectory()) {
        yield* FSUtil.getFilesRecursively(res);
      } else {
        yield res;
      }
    }
  }
}

export default FSUtil;
