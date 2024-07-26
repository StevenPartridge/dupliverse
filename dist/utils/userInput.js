import readline from 'readline';
import cliProgress from 'cli-progress';
import Chalk from 'chalk';
class UserInteractionUtil {
    static progressBar;
    static logs = [];
    static async presentOptions(options) {
        console.log('Please choose an option:');
        options.forEach((option, index) => {
            console.log(`${index + 1}. ${option}`);
        });
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise((resolve) => {
            rl.question('Enter the number of your choice: ', (answer) => {
                rl.close();
                const choice = parseInt(answer, 10);
                if (isNaN(choice) || choice < 1 || choice > options.length) {
                    console.log('Invalid choice, please try again.');
                    resolve(this.presentOptions(options));
                }
                else {
                    resolve(choice);
                }
            });
        });
    }
    static startProgressBar(total) {
        this.progressBar = new cliProgress.SingleBar({
            format: 'Progress |' +
                Chalk.cyan('{bar}') +
                '| {percentage}% || {value}/{total} files',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
        });
        this.progressBar.start(total, 0);
    }
    static updateProgressBar(current) {
        if (this.progressBar) {
            this.progressBar.update(current);
        }
    }
    static stopProgressBar() {
        if (this.progressBar) {
            this.progressBar.stop();
        }
    }
    static logInfo(message) {
        console.log(Chalk.green(`[INFO]: ${message}`));
        this.logs.push(`[INFO]: ${message}`);
    }
    static logWarning(message) {
        console.log(Chalk.yellow(`[WARNING]: ${message}`));
        this.logs.push(`[WARNING]: ${message}`);
    }
    static logError(message) {
        console.log(Chalk.red(`[ERROR]: ${message}`));
        this.logs.push(`[ERROR]: ${message}`);
    }
    static logDebug(message) {
        console.log(Chalk.blue(`[DEBUG]: ${message}`));
        this.logs.push(`[DEBUG]: ${message}`);
    }
    static printLogs() {
        console.log('\nLog Summary:');
        this.logs.forEach((log) => {
            console.log(log);
        });
    }
    static clearOutput() {
        console.clear();
    }
    static waitForEnter() {
        return new Promise((resolve) => {
            process.stdin.once('data', () => {
                process.stdin.pause();
                resolve();
            });
        });
    }
}
export default UserInteractionUtil;
//# sourceMappingURL=userInput.js.map