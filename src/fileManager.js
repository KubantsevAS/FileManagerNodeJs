import { stdin as input, stdout as output } from 'node:process';
import { getCliArguments, getMessages } from './utils/index.js';
import * as readline from 'node:readline/promises';
import { fileURLToPath } from 'url';
import path from 'path';

export class FileManager {
    constructor () {
        this.readline = readline.createInterface({ input, output });
        this.cliArguments = getCliArguments();
        this.messages = getMessages();
    }

    async initialize() {
        const { username } = this.cliArguments;
        const introMessage = this.messages.getIntroMessage(username);
        const outroMessage = this.messages.getOutroMessage(username);

        console.log(introMessage);
        process.nextTick(() => this.#printCurrentDirectory());
    
        // await this.readline.question('What do you think of Node.js?\n');
    
        this.readline.on('close', () => {
            console.log(outroMessage);
        });
        
        // this.readline.close();
    }

    #printCurrentDirectory() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
    
        console.log(this.messages.gerCurrentDirMessage(path.join(__dirname)));
    };
};
