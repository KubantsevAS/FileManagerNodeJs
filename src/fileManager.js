import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';
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
    #cliArguments = getCliArguments();

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
            '.exit': () => this.readline.close(),
        }

        const [inputCommand, param1, param2] = input.split(' ');

        if (!commandMap.hasOwnProperty(inputCommand)) {
            this.#throwInputError()
        };

        try {
            await commandMap[inputCommand](param1, param2);
            this.#printCurrentDirPath();
        } catch (error) {
            this.#throwOperationError(error.message)
        }
    }

    #throwInputError() {
        throw new Error(this.#messages.getInvalidInput());
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

    #printCurrentDirPath() {
        console.log(this.#messages.getCurrentDir(this.currentDir));
    };
};
