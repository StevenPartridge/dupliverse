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

  static async countFiles(directory: string): Promise<number> {
    let count = 0;
    for await (const _ of FSUtil.getFilesRecursively(directory)) {
      count++;
    }
    return count;
  }

  static async countFilesByExtensions(
    directory: string,
    extensions: string[],
  ): Promise<number> {
    let count = 0;
    const extensionsSet = new Set(extensions.map((ext) => ext.toLowerCase()));
    for await (const filePath of FSUtil.getFilesRecursively(directory)) {
      // slice(1) here assumes the extension starts with a dot
      if (extensionsSet.has(path.extname(filePath).toLowerCase().slice(1))) {
        count++;
      }
    }
    return count;
  }
}

export default FSUtil;
