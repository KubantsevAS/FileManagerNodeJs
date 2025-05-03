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
        process.nextTick(() => this.#printCurrentDirectory());
    
        this.readline.on('line', input => {
            // console.log(`INPUT: ${input}\n`);
            try {
                this.#handleInput(input);
            } catch (error) {
                console.error(error.message);
            }
        });

        this.readline.on('close', () => {
            console.log(outroMessage);
        });
    }

    #handleInput(input) {
        const commandMap = {
            up: () => this.#goToUpperDirectory(), // TODO
            cd: () => console.log('changeDir'), // TODO
            ls: () => console.log('ListDir'), // TODO
            '.exit': () => this.readline.close(),
        }

        const [inputCommand] = input.split(' ');
        if (!commandMap.hasOwnProperty(inputCommand)) {
            this.#throwInputError()
        };

        try {
            commandMap[inputCommand]();
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

    #changeDirectory(currentDir) {
        const newDirectory = getChangedDirectory();
    }

    #printCurrentDirectory() {
        console.log(this.messages.getCurrentDir(this.currentDir));
    };
};
