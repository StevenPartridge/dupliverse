import fs from 'fs';
import path from 'path';
import smb2 from 'smb2';
import { promisify } from 'util';

const smb2Client = new smb2({
  share: '\\\\192.168.1.20\\server4tb',
  domain: '',
  username: '',
  password: '',
});

class FSUtil {
  static async ensureDirectoryExists(directoryPath: string): Promise<void> {
    await fs.promises.mkdir(directoryPath, { recursive: true });
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
    if (directory.startsWith('smb://')) {
      yield* FSUtil.getFilesRecursivelyFromSMB(directory);
    } else {
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

  static async *getFilesRecursivelyFromSMB(
    directory: string,
  ): AsyncGenerator<string> {
    const smbPath = directory.replace('smb://', '').replace(/\//g, '\\');
    console.log(`Accessing SMB Path: ${smbPath}`); // Debugging output
    const smbList = promisify(smb2Client.readdir.bind(smb2Client));
    try {
      const dirEntries = await smbList(smbPath);
      for (const dirEntry of dirEntries) {
        const res = path.join(directory, dirEntry).replace('smb:/', '');
        if (await FSUtil.isDirectorySMB(res)) {
          yield* FSUtil.getFilesRecursivelyFromSMB(res);
        } else {
          yield res;
        }
      }
    } catch (error) {
      console.error(`Error accessing SMB path: ${smbPath}`, error); // Debugging output
      throw error;
    }
  }

  static async isDirectorySMB(smbPath: string): Promise<boolean> {
    const smbList = promisify(smb2Client.readdir.bind(smb2Client));
    try {
      await smbList(smbPath.replace('smb://', '').replace(/\//g, '\\'));
      return true;
    } catch {
      return false;
    }
  }

  static async countFiles(directory: string): Promise<number> {
    let count = 0;
    for await (const filePath of FSUtil.getFilesRecursively(directory)) {
      console.log(`Counting file: ${filePath}`); // Debugging output
      count++;
    }
    return count;
  }
}

export default FSUtil;
