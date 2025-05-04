import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';
import fs from 'node:fs/promises';
import path from 'path';
import os from 'os';

import {
    getCliArguments,
    getMessages,
} from './utils/index.js';
import {
    getUpperDirectory,
    getChangedDirectory,
    getDirectoryContent,
} from './services/index.js';

export class FileManager {
    #messages = getMessages();
    #cliArguments = getCliArguments(process.argv);

    constructor () {
        this.readline = readline.createInterface({ input, output });
        this.currentDir = os.homedir();
    }

    async initialize() {
        const ANONYMOUS = 'Anonymous';
        const username = this.#cliArguments.username ?? ANONYMOUS;
        const introMessage = this.#messages.getIntro(username);
        const outroMessage = this.#messages.getOutro(username);

        console.log(introMessage);

        process.chdir(this.currentDir);

        process.nextTick(() => this.#printCurrentDirPath());
    
        this.readline.on('line', async input => {
            try {
                console.log();
                await this.#handleInput(input);
            } catch (error) {
                console.error(error.message);
            }
        });

        this.readline.on('close', () => {
            console.log(outroMessage);
        });
    }

    async #handleInput(input) {
        const commandMap = {
            up: () => this.#goToUpperDirectory(),
            cd: targetDirectory => this.#changeDirectory(targetDirectory),
            ls: () => this.#printDirectoryList(),
            cat: filePath => this.#printFileContent(filePath),
            add: fileName => this.#createNewFile(fileName),
            // mkdir: filePath => this.#printFileContent(filePath),
            '.exit': () => this.readline.close(),
        }

        const spaceIdx = input.indexOf(' ');
        const parsedInput = spaceIdx !== -1 
            ? [input.slice(0, spaceIdx), input.slice(spaceIdx + 1)]
            : [input];
        const [inputCommand, parameter] = parsedInput;

        if (!commandMap.hasOwnProperty(inputCommand)) {
            this.#throwInputError();
        };

        try {
            await commandMap[inputCommand](parameter);

            if (inputCommand !== '.exit') {
                this.#printCurrentDirPath();
            }
        } catch (error) {
            this.#throwOperationError(error.message);
        }
    }

    #throwInputError(errorMessage) {
        if (!errorMessage) {
            throw new Error(this.#messages.getInvalidInput());
        } else {
            throw new Error(`${this.#messages.getInvalidInput()} - ${errorMessage}`);
        }
    }

    #throwOperationError(errorMessage) {
        throw new Error(`${this.#messages.getOperationFailed()} - ${errorMessage}`);
    }

    #goToUpperDirectory() {
        const upperDirectory = getUpperDirectory(this.currentDir);

        if (upperDirectory) {
            this.currentDir = upperDirectory;
        }
    }

    async #changeDirectory(targetDirectory) {
        const changedDirectory = await getChangedDirectory(targetDirectory);
        this.currentDir = changedDirectory;
    }

    async #printDirectoryList() {
        const dirContent = await getDirectoryContent(this.currentDir);
        console.table(dirContent);
    }

    async #printFileContent(filePath) {
        const fileToRead = await fs.open(filePath);
        const readStream = fileToRead.createReadStream();

        await new Promise((resolve, reject) => {
            readStream.on('data', chunk => {
                process.stdout.write(chunk);
            });
            
            readStream.on('end', () => {
                console.log('\n');
                fileToRead.close();
                resolve();
            });
            
            readStream.on('error', error => {
                fileToRead.close();
                reject(error);
            });
        });
    }

    async #createNewFile(filename) {
        const filePath = path.join(this.currentDir, filename);

        try {
            const fileToCreate = await fs.open(filePath, 'wx');
            await fileToCreate.writeFile('');
            await fileToCreate.close();
          } catch (error) {
            throw new Error(error);
        }
    }

    #printCurrentDirPath() {
        console.log(this.#messages.getCurrentDir(this.currentDir));
    };
};
