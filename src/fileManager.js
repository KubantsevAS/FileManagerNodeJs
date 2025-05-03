import { stdin as input, stdout as output } from 'node:process';
import { getUpperDirectory, getChangedDirectory } from './services/index.js'
import path from 'path';
import { getCliArguments, getMessages } from './utils/index.js';
import * as readline from 'node:readline/promises';
import os from 'os';

export class FileManager {
    constructor () {
        this.readline = readline.createInterface({ input, output });
        this.cliArguments = getCliArguments();
        this.messages = getMessages();
        this.currentDir = os.homedir();
    }

    async initialize() {
        const ANONYMOUS = 'Anonymous';
        const username = this.cliArguments.username ?? ANONYMOUS;
        const introMessage = this.messages.getIntro(username);
        const outroMessage = this.messages.getOutro(username);

        console.log(introMessage);

        process.chdir(this.currentDir);

        process.nextTick(() => this.#printCurrentDirectory());
    
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
            ls: () => console.log('ListDir'), // TODO
            '.exit': () => this.readline.close(),
        }

        const [inputCommand, param1, param2] = input.split(' ');

        if (!commandMap.hasOwnProperty(inputCommand)) {
            this.#throwInputError()
        };

        try {
            await commandMap[inputCommand](param1, param2);
            this.#printCurrentDirectory();
        } catch {
            this.#throwOperationError()
        }
    }

    #throwInputError() {
        throw new Error(this.messages.getInvalidInput());
    }

    #throwOperationError() {
        throw new Error(this.messages.getOperationFailed());
    }

    #goToUpperDirectory() {
        const upperDirectory = getUpperDirectory(this.currentDir);

        if (upperDirectory) {
            this.currentDir = upperDirectory;
        }
    }

    async #changeDirectory(targetDirectory) {
        const changedDirectory = await getChangedDirectory(targetDirectory);
        
        if (changedDirectory) {
            this.currentDir = changedDirectory;
        }
    }

    #printCurrentDirectory() {
        console.log(this.messages.getCurrentDir(this.currentDir));
    };
};
