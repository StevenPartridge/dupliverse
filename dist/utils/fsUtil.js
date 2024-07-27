import fs from 'fs';
import path from 'path';
class FSUtil {
    static async ensureDirectoryExists(directoryPath) {
        await fs.promises.mkdir(directoryPath, { recursive: true });
    }
    static async fileExists(filePath) {
        try {
            await fs.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    static async *getFilesRecursively(directory) {
        const dirEntries = await fs.promises.readdir(directory, {
            withFileTypes: true,
        });
        for (const dirEntry of dirEntries) {
            const res = path.resolve(directory, dirEntry.name);
            if (dirEntry.isDirectory()) {
                yield* FSUtil.getFilesRecursively(res);
            }
            else {
                yield res;
            }
        }
    }
    static async countFiles(directory) {
        let count = 0;
        for await (const filePath of FSUtil.getFilesRecursively(directory)) {
            console.log(`Counting file: ${filePath}`); // Debugging output
            count++;
        }
        return count;
    }
    static async copyFile(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            fs.copyFile(inputPath, outputPath, (err) => {
                if (err) {
                    console.error(`Error copying file: ${err.message}`);
                    reject(err);
                }
                else {
                    console.log(`Copied file from ${inputPath} to ${outputPath}`);
                    resolve();
                }
            });
        });
    }
}
export default FSUtil;
//# sourceMappingURL=fsUtil.js.map