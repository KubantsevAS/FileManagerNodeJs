import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';
import fs from 'node:fs/promises';
import os from 'os';

import {
    getCliArguments,
    getMessages,
} from './utils/index.js';
import {
    getUpperDirectory,
    getChangedDirectory,
    getDirectoryContent,
    readFileContent,
    createDirectory,
    createFile,
    renameFile,
    getOsInfo,
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

        process.chdir(this.currentDir);
        console.log(introMessage);
        this.printCurrentDirPath();
    
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

    printCurrentDirPath() {
        console.log(this.#messages.getCurrentDir(this.currentDir));
    };

    async #handleInput(input) {
        const commandMap = {
            up: () => this.goToUpperDirectory(),
            cd: targetDirectory => this.changeDirectory(targetDirectory),
            ls: () => this.printDirectoryList(),
            cat: async filePath => {
                await this.#validatePath(filePath);
                await this.printFileContent(filePath);
            },
            add: async fileName => {
                this.#checkIsParameterExist(fileName);
                await this.createNewFile(fileName);
            },
            mkdir: async directoryPath => {
                this.#checkIsParameterExist(directoryPath);
                await this.createNewDirectory(directoryPath);
            },
            rn: async fileNames => {
                this.#checkIsParameterExist(fileNames);
                await this.renameFileName(fileNames);
            },
            // cp:
            // mv:
            // rm:
            os: parameter => {
                this.#checkIsParameterExist(parameter);
                this.printOsInfo(parameter);
            },
            '.exit': () => this.readline.close(),
        }

        const spaceIdx = input.indexOf(' ');
        const parsedInput = spaceIdx !== -1 
            ? [input.slice(0, spaceIdx), input.slice(spaceIdx + 1)]
            : [input];
        const [inputCommand, parameter] = parsedInput;

        if (!commandMap.hasOwnProperty(inputCommand)) {
            this.#throwInputError(`${this.#messages.getUnknownCommand()} '${inputCommand}'`);
        };

        try {
            await commandMap[inputCommand](parameter);

            if (inputCommand !== '.exit') {
                this.printCurrentDirPath();
            }
        } catch (error) {
            throw new Error(`${inputCommand}: ${error.message}`);
        }
    }

    goToUpperDirectory() {
        const upperDirectory = getUpperDirectory(this.currentDir);

        if (upperDirectory) {
            this.currentDir = upperDirectory;
        }
    }

    async changeDirectory(targetDirectory) {
        try {
            const changedDirectory = await getChangedDirectory(targetDirectory);
            this.currentDir = changedDirectory;
        } catch (error) {
            throw this.#throwInputError(error.message);
        }
    }

    async printDirectoryList() {
        const dirContent = await getDirectoryContent(this.currentDir);
        console.table(dirContent);
    }

    async printFileContent(filePath) {
        try {
            await readFileContent(filePath);
        } catch (error) {
            this.#throwOperationError(error.message);
        }
    }

    async createNewFile(filename) {
        try {
            await createFile(filename);
        } catch (error) {
            this.#throwOperationError(error.message);
        }
    }

    async createNewDirectory(directoryPath) {
        try {
            await createDirectory(directoryPath);
        } catch (error) {
            this.#throwOperationError(error.message);
        }
    }

    async renameFileName(fileNames) {
        const { oldPath, newPath } = await this.#getValidatedPaths(fileNames);

        try {
            await renameFile(oldPath, newPath);
        } catch (error) {
            this.#throwOperationError(error.message);
        }
    }

    printOsInfo(params) {
        const parametersArray = Object.keys(getCliArguments(params.split(' ')));

        if (!parametersArray.length) {
            this.#throwInputError(this.#messages.getMissingOperand());
        }

        if (parametersArray.length > 1) {
            this.#throwInputError(this.#messages.getTooManyArguments());
        }

        try {
            const [parameter] = parametersArray;
            const osInfo = getOsInfo(parameter)
            console.log(osInfo);
        } catch (error) {
            this.#throwOperationError(error.message);
        }
    }
    
    #throwInputError(errorMessage) {
        throw new Error(`${this.#messages.getInvalidInput()} - ${errorMessage}`);
    }

    #throwOperationError(errorMessage) {
        throw new Error(`${this.#messages.getOperationFailed()} - ${errorMessage}`);
    }

    async #getValidatedPaths(specifiedPaths) {
        const paths = specifiedPaths.split(' ');

        if (paths.length < 2) {
            this.#throwInputError(this.#messages.getMissingOperand());
        }

        if (paths.length > 2) {
            this.#throwInputError(this.#messages.getTooManyArguments());
        }

        const [oldPath, newPath] = paths;
        await this.#validatePath(oldPath);

        return { oldPath, newPath };
    }

    async #validatePath(path) {
        try {
            await fs.access(path);
        } catch (error) {
            this.#throwInputError(error.message);
        }
    }

    #checkIsParameterExist(parameter) {
        if (!parameter) {
            this.#throwInputError(this.#messages.getMissingOperand());
        }
    }
};
