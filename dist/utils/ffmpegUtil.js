import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import smb2 from 'smb2';
import { Logger } from './logger.js';
const smb2Client = new smb2({
    share: '\\\\192.168.1.20\\server4tb',
    domain: '',
    username: '',
    password: '',
});
class FFmpegUtil {
    static async copyFile(inputPath, outputPath) {
        let tempInputPath = null;
        if (inputPath.startsWith('TestMusic/')) {
            tempInputPath = await this.downloadFromSMB(inputPath);
            inputPath = tempInputPath;
        }
        return new Promise((resolve, reject) => {
            fs.copyFile(inputPath, outputPath, (err) => {
                if (tempInputPath) {
                    fs.unlinkSync(tempInputPath); // Clean up temporary input file
                }
                if (err) {
                    Logger.error(`Error copying file: ${err.message}`);
                    reject(err);
                }
                else {
                    Logger.info(`Copied file from ${inputPath} to ${outputPath}`);
                    resolve();
                }
            });
        });
    }
    static async downloadFromSMB(smbPath) {
        const smbDownload = promisify(smb2Client.readFile.bind(smb2Client));
        const localTempPath = path.join('/tmp', path.basename(smbPath));
        const data = await smbDownload(smbPath.replace('smb://', ''));
        await fs.promises.writeFile(localTempPath, data);
        return localTempPath;
    }
}
export default FFmpegUtil;
//# sourceMappingURL=ffmpegUtil.js.map