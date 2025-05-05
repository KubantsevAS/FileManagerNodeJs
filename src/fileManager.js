import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

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
    copyFileToDest,
    decompressFile,
    calculateHash,
    compressFile,
    createFile,
    renameFile,
    deleteFile,
    getOsInfo,
} from './services/index.js';

/**
 * FileManager class provides a command-line interface for file system operations.
 * It allows users to navigate directories, view and manipulate files, and perform various system operations.
 * 
 * @class
 * @property {Object} #messages - Messages for user interaction
 * @property {Object} #cliArguments - Command line arguments
 * @property {readline.Interface} readline - Interface for reading user input
 * @property {string} currentDir - Current working directory
 * 
 * @example
 * const fileManager = new FileManager();
 * await fileManager.initialize();
 */
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
            cat: filePath => this.printFileContent(filePath),
            add: fileName => this.createNewFile(fileName),
            mkdir: directoryPath => this.createNewDirectory(directoryPath),
            rn: fileNames => this.renameFileName(fileNames),
            cp: params => this.copyFileToNewDirectory(params),
            mv: params => this.moveFileToNewDirectory(params),
            rm: filePath => this.deleteTargetFile(filePath),
            os: parameter => this.printOsInfo(parameter),
            hash: filePath => this.printCalculatedHash(filePath),
            compress: params => this.compressFileToDirectory(params),
            decompress: params => this.decompressFileToDirectory(params),
        }

        const spaceIdx = input.indexOf(' ');
        const parsedInput = spaceIdx !== -1 
            ? [input.slice(0, spaceIdx), input.slice(spaceIdx + 1)]
            : [input];
        const [inputCommand, parameter] = parsedInput;

        if (inputCommand === '.exit') {
            this.readline.close();

            return;
        }

        if (!commandMap.hasOwnProperty(inputCommand)) {
            this.#throwInputError(`${this.#messages.getUnknownCommand()} '${inputCommand}'`);
        };

        if (!['up', 'ls', 'cd'].includes(inputCommand)) {
            this.#checkIsParameterExist(parameter);
        }

        try {
            await commandMap[inputCommand](parameter);
            this.printCurrentDirPath();
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
        const validatedPath = await this.#getValidatedPath(filePath);
        await this.#launchOperation(readFileContent, [validatedPath]);
    }

    async createNewFile(fileName) {
        await this.#launchOperation(createFile, [fileName]);
    }

    async createNewDirectory(directoryPath) {
        await this.#launchOperation(createDirectory, [directoryPath]);
    }

    async renameFileName(params) {
        const filePaths = params.split(' ');
        this.#checkIsArgsCountMatchLimit(filePaths.length, 2);

        const [oldPath, newPath] = filePaths;
        const validatedPath = await this.#getValidatedPath(oldPath);
        await this.#launchOperation(renameFile, [validatedPath, path.join(newPath)]);
    }

    async copyFileToNewDirectory(params) {
        const validatedPaths = await this.#getValidatedPaths(params);
        await this.#launchOperation(copyFileToDest, validatedPaths);
    }

    async moveFileToNewDirectory(params) {
        const validatedPaths = await this.#getValidatedPaths(params);
        const [fileName] = validatedPaths;
        
        await this.#launchOperation(copyFileToDest, validatedPaths);
        await this.#launchOperation(deleteFile, [fileName]);
    }

    async deleteTargetFile(filePath) {
        const validatedPath = await this.#getValidatedPath(filePath);
        await this.#launchOperation(deleteFile, [validatedPath]);
    }

    printOsInfo(params) {
        const parametersArray = Object.keys(getCliArguments(params.split(' ')));
        this.#checkIsArgsCountMatchLimit(parametersArray.length, 1);

        try {
            const [parameter] = parametersArray;
            const osInfo = getOsInfo(parameter)
            console.log(osInfo);
        } catch (error) {
            this.#throwOperationError(error.message);
        }
    }

    async printCalculatedHash(filePath) {
        const validatedPath = await this.#getValidatedPath(filePath);
        await this.#launchOperation(async filepath => {
            const hash = await calculateHash(filepath);
            console.log(hash);
        }, [validatedPath]);
    }

    async compressFileToDirectory(params) {
        const validatedPaths = await this.#getValidatedPaths(params);
        await this.#launchOperation(compressFile, validatedPaths);
    }

    async decompressFileToDirectory(params) {
        const validatedPaths = await this.#getValidatedPaths(params);
        await this.#launchOperation(decompressFile, validatedPaths);
    }
    
    #throwInputError(errorMessage) {
        throw new Error(`${this.#messages.getInvalidInput()} - ${errorMessage}`);
    }

    #throwOperationError(errorMessage) {
        throw new Error(`${this.#messages.getOperationFailed()} - ${errorMessage}`);
    }

    async #launchOperation(callback, params) {
        try {
            await callback(...params);
        } catch (error) {
            this.#throwOperationError(error.message);
        }
    }

    async #getValidatedPaths(specifiedPaths) {
        const paths = specifiedPaths.split(' ');
        this.#checkIsArgsCountMatchLimit(paths.length, 2);

        const validatedPaths = await Promise.all(paths.map(async path => {
            const validPath = await this.#getValidatedPath(path);

            return validPath
        }));

        return validatedPaths;
    }

    async #getValidatedPath(specifiedPath) {
        const normalizedPath = path.join(specifiedPath);

        try {
            await fs.access(normalizedPath);

            return normalizedPath;
        } catch (error) {
            this.#throwInputError(error.message);
        }
    }

    #checkIsArgsCountMatchLimit(argsCount, limit) {
        if (argsCount < limit) {
            this.#throwInputError(this.#messages.getMissingOperand());
        }

        if (argsCount > limit) {
            this.#throwInputError(this.#messages.getTooManyArguments());
        }
    }

    #checkIsParameterExist(parameter) {
        if (!parameter) {
            this.#throwInputError(this.#messages.getMissingOperand());
        }
    }
};
