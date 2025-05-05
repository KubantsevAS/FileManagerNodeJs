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
        await this.#validatePath(filePath);
        await this.#launchOperation(readFileContent, [filePath]);
    }

    async createNewFile(fileName) {
        this.#checkIsParameterExist(fileName);
        await this.#launchOperation(createFile, [fileName]);
    }

    async createNewDirectory(directoryPath) {
        this.#checkIsParameterExist(directoryPath);
        await this.#launchOperation(createDirectory, [directoryPath]);
    }

    async renameFileName(fileNames) {
        this.#checkIsParameterExist(fileNames);
        const { oldPath, newPath } = await this.#getValidatedPaths(fileNames);
        await this.#launchOperation(renameFile, [oldPath, newPath]);
    }

    async copyFileToNewDirectory(params) {
        this.#checkIsParameterExist(params);
        const { oldPath: fileName, newPath: targetPath } = await this.#getValidatedPaths(params);
        await this.#validatePath(targetPath);
        await this.#launchOperation(copyFileToDest, [fileName, targetPath]);
    }

    async moveFileToNewDirectory(params) {
        this.#checkIsParameterExist(params);
        const { oldPath: filePath, newPath: targetPath } = await this.#getValidatedPaths(params);
        await this.#validatePath(targetPath);
        await this.#launchOperation(copyFileToDest, [filePath, targetPath]);
        await this.#launchOperation(deleteFile, [filePath]);
    }

    async deleteTargetFile(filePath) {
        await this.#validatePath(filePath);
        await this.#launchOperation(deleteFile, [filePath]);
    }

    printOsInfo(params) {
        this.#checkIsParameterExist(params);
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

    async printCalculatedHash(filePath) {
        await this.#validatePath(filePath);
        await this.#launchOperation(async filepath => {
            const hash = await calculateHash(filepath);
            console.log(hash);
        }, [filePath]);
    }

    async compressFileToDirectory(params) {
        this.#checkIsParameterExist(params);
        const { oldPath: filePath, newPath: targetPath } = await this.#getValidatedPaths(params);
        await this.#validatePath(targetPath);
        await this.#launchOperation(compressFile, [filePath, targetPath]);
    }

    async decompressFileToDirectory(params) {
        this.#checkIsParameterExist(params);
        const { oldPath: filePath, newPath: targetPath } = await this.#getValidatedPaths(params);
        await this.#validatePath(targetPath);
        await this.#launchOperation(decompressFile, [filePath, targetPath]);
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

        if (paths.length < 2) {
            this.#throwInputError(this.#messages.getMissingOperand());
        }

        if (paths.length > 2) {
            this.#throwInputError(this.#messages.getTooManyArguments());
        }

        const [oldPath, newPath] = paths;
        await this.#validatePath(oldPath);

        return { oldPath: path.join(oldPath), newPath: path.join(newPath) };
    }

    async #validatePath(specifiedPath) {
        try {
            await fs.access(path.join(specifiedPath));
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
