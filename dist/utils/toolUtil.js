import { exec } from 'child_process';
import { Logger } from './logger.js';
class ToolUtil {
    static checkToolInstalled(tool) {
        return new Promise((resolve) => {
            exec(`${tool} -version`, (error) => {
                resolve(!error);
            });
        });
    }
    static async checkRequiredTools(tools) {
        const missingTools = [];
        for (const tool of tools) {
            const isInstalled = await this.checkToolInstalled(tool);
            if (!isInstalled) {
                missingTools.push(tool);
            }
        }
        if (missingTools.length > 0) {
            Logger.error(`Missing required tools: ${missingTools.join(', ')}`);
            process.exit(1);
        }
    }
}
export default ToolUtil;
