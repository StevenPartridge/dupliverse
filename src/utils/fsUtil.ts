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

  static async copyFile(inputPath: string, outputPath: string): Promise<void> {
    let tempInputPath: string | null = null;
    if (inputPath.startsWith('TestMusic/')) {
      tempInputPath = await this.downloadFromSMB(inputPath);
      inputPath = tempInputPath;
    }

    return new Promise<void>((resolve, reject) => {
      fs.copyFile(inputPath, outputPath, (err) => {
        if (tempInputPath) {
          fs.unlinkSync(tempInputPath); // Clean up temporary input file
        }
        if (err) {
          console.error(`Error copying file: ${err.message}`);
          reject(err);
        } else {
          console.log(`Copied file from ${inputPath} to ${outputPath}`);
          resolve();
        }
      });
    });
  }

  static async downloadFromSMB(smbPath: string): Promise<string> {
    const smbDownload = promisify(smb2Client.readFile.bind(smb2Client));
    const localTempPath = path.join('/tmp', path.basename(smbPath));
    try {
      const data = await smbDownload(
        smbPath.replace('smb://', '').replace(/\//g, '\\'),
      );
      await fs.promises.writeFile(localTempPath, data);
      return localTempPath;
    } catch (error: any) {
      console.error(`Error downloading SMB file: ${error.message}`);
      throw error;
    }
  }
}

export default FSUtil;
