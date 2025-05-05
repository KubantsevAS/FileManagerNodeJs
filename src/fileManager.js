import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';
import { access } from 'node:fs/promises';
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
 * @class FileManager
 * @property {Object} #messages - Messages for user interaction
 * @property {Object} #cliArguments - Command line arguments
 * @property {readline.Interface} readline - Interface for reading user input
 * @property {string} currentDir - Current working directory
 * 
 * @method initialize - Initializes the file manager and sets up event listeners
 * @method printCurrentDirPath - Prints the current directory path
 * @method goToUpperDirectory - Navigates to the parent directory
 * @method changeDirectory - Changes the current directory
 * @method printDirectoryList - Lists contents of the current directory
 * @method printFileContent - Displays content of a specified file
 * @method createNewFile - Creates a new file
 * @method createNewDirectory - Creates a new directory
 * @method renameFileName - Renames a file
 * @method copyFileToNewDirectory - Copies a file to a new location
 * @method moveFileToNewDirectory - Moves a file to a new location
 * @method deleteTargetFile - Deletes a specified file
 * @method printOsInfo - Displays operating system information
 * @method printCalculatedHash - Calculates and displays file hash
 * @method compressFileToDirectory - Compresses a file
 * @method decompressFileToDirectory - Decompresses a file
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

    /**
     * Initializes the file manager and sets up event listeners for user input.
     * Sets the current directory to user's home directory and displays welcome message.
     * 
     * @async
     * @returns {Promise<void>}
     */
    async initialize() {
        const ANONYMOUS = 'Anonymous';
        const username = this.#cliArguments.username ?? ANONYMOUS;
        const introMessage = this.#messages.getIntro(username);
        const outroMessage = this.#messages.getOutro(username);

        process.chdir(this.currentDir);
        console.log(introMessage);
        this.printCurrentDirPath();
        this.#showPrompt();
    
        this.readline.on('line', async input => {
            try {
                console.log();
                await this.#handleInput(input);
            } catch (error) {
                console.error(error.message);
                this.#showPrompt();
            }
        });

        this.readline.on('close', () => {
            console.log(outroMessage);
        });
    }

    /**
     * Prints the current directory path to the console.
     * 
     * @returns {void}
     */
    printCurrentDirPath() {
        console.log(this.#messages.getCurrentDir(this.currentDir));
    };

    /**
     * Handles user input and executes corresponding commands.
     * 
     * @private
     * @async
     * @param {string} input - User input command
     * @returns {Promise<void>}
     */
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
            this.#showPrompt();
        } catch (error) {
            throw new Error(`${inputCommand}: ${error.message}`);
        }
    }

    /**
     * Navigates to the parent directory of the current directory.
     * 
     * @returns {void}
     */
    goToUpperDirectory() {
        const upperDirectory = getUpperDirectory(this.currentDir);

        if (upperDirectory) {
            this.currentDir = upperDirectory;
        }
    }

    /**
     * Changes the current directory to the specified target directory.
     * 
     * @async
     * @param {string} targetDirectory - Path to the target directory
     * @returns {Promise<void>}
     * @throws {Error} If the target directory doesn't exist or is inaccessible
     */
    async changeDirectory(targetDirectory) {
        try {
            const changedDirectory = await getChangedDirectory(targetDirectory);
            this.currentDir = changedDirectory;
        } catch (error) {
            throw this.#throwInputError(error.message);
        }
    }

    /**
     * Lists the contents of the current directory in a table format.
     * 
     * @async
     * @returns {Promise<void>}
     */
    async printDirectoryList() {
        const dirContent = await getDirectoryContent(this.currentDir);
        console.table(dirContent);
    }

    /**
     * Displays the content of a specified file.
     * 
     * @async
     * @param {string} filePath - Path to the file to read
     * @returns {Promise<void>}
     * @throws {Error} If the file doesn't exist or is inaccessible
     */
    async printFileContent(filePath) {
        const validatedPath = await this.#getValidatedPath(filePath);
        await this.#launchOperation(readFileContent, [validatedPath]);
    }

    /**
     * Creates a new file with the specified name.
     * 
     * @async
     * @param {string} fileName - Name of the file to create
     * @returns {Promise<void>}
     * @throws {Error} If file creation fails
     */
    async createNewFile(fileName) {
        await this.#launchOperation(createFile, [fileName]);
    }

    /**
     * Creates a new directory at the specified path.
     * 
     * @async
     * @param {string} directoryPath - Path where the directory should be created
     * @returns {Promise<void>}
     * @throws {Error} If directory creation fails
     */
    async createNewDirectory(directoryPath) {
        await this.#launchOperation(createDirectory, [directoryPath]);
    }

    /**
     * Renames a file from old path to new path.
     * 
     * @async
     * @param {string} params - Space-separated old and new file paths
     * @returns {Promise<void>}
     * @throws {Error} If renaming fails or paths are invalid
     */
    async renameFileName(params) {
        const filePaths = params.split(' ');
        this.#checkIsArgsCountMatchLimit(filePaths.length, 2);

        const [oldPath, newPath] = filePaths;
        const validatedPath = await this.#getValidatedPath(oldPath);
        await this.#launchOperation(renameFile, [validatedPath, path.join(newPath)]);
    }

    /**
     * Copies a file to a new location.
     * 
     * @async
     * @param {string} params - Space-separated source and destination paths
     * @returns {Promise<void>}
     * @throws {Error} If copying fails or paths are invalid
     */
    async copyFileToNewDirectory(params) {
        const validatedPaths = await this.#getValidatedPaths(params);
        await this.#launchOperation(copyFileToDest, validatedPaths);
    }

    /**
     * Moves a file to a new location by copying and then deleting the original.
     * 
     * @async
     * @param {string} params - Space-separated source and destination paths
     * @returns {Promise<void>}
     * @throws {Error} If moving fails or paths are invalid
     */
    async moveFileToNewDirectory(params) {
        const validatedPaths = await this.#getValidatedPaths(params);
        const [fileName] = validatedPaths;
        
        await this.#launchOperation(copyFileToDest, validatedPaths);
        await this.#launchOperation(deleteFile, [fileName]);
    }

    /**
     * Deletes a specified file.
     * 
     * @async
     * @param {string} filePath - Path to the file to delete
     * @returns {Promise<void>}
     * @throws {Error} If deletion fails or file doesn't exist
     */
    async deleteTargetFile(filePath) {
        const validatedPath = await this.#getValidatedPath(filePath);
        await this.#launchOperation(deleteFile, [validatedPath]);
    }

    /**
     * Displays operating system information based on the specified parameter.
     * 
     * @param {string} params - Parameter specifying which OS info to display
     * @returns {void}
     * @throws {Error} If the parameter is invalid
     */
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

    /**
     * Calculates and displays the hash of a specified file.
     * 
     * @async
     * @param {string} filePath - Path to the file to hash
     * @returns {Promise<void>}
     * @throws {Error} If hashing fails or file doesn't exist
     */
    async printCalculatedHash(filePath) {
        const validatedPath = await this.#getValidatedPath(filePath);
        await this.#launchOperation(async filepath => {
            const hash = await calculateHash(filepath);
            console.log(hash);
        }, [validatedPath]);
    }

    /**
     * Compresses a file to a specified directory.
     * 
     * @async
     * @param {string} params - Space-separated source and destination paths
     * @returns {Promise<void>}
     * @throws {Error} If compression fails or paths are invalid
     */
    async compressFileToDirectory(params) {
        const validatedPaths = await this.#getValidatedPaths(params);
        await this.#launchOperation(compressFile, validatedPaths);
    }

    /**
     * Decompresses a file to a specified directory.
     * 
     * @async
     * @param {string} params - Space-separated source and destination paths
     * @returns {Promise<void>}
     * @throws {Error} If decompression fails or paths are invalid
     */
    async decompressFileToDirectory(params) {
        const validatedPaths = await this.#getValidatedPaths(params);
        await this.#launchOperation(decompressFile, validatedPaths);
    }
    
    /**
     * Throws an input error with a custom message.
     * 
     * @private
     * @param {string} errorMessage - Error message to display
     * @throws {Error} Always throws an error
     */
    #throwInputError(errorMessage) {
        throw new Error(`${this.#messages.getInvalidInput()} - ${errorMessage}`);
    }

    /**
     * Throws an operation error with a custom message.
     * 
     * @private
     * @param {string} errorMessage - Error message to display
     * @throws {Error} Always throws an error
     */
    #throwOperationError(errorMessage) {
        throw new Error(`${this.#messages.getOperationFailed()} - ${errorMessage}`);
    }

    /**
     * Launches an operation with error handling.
     * 
     * @private
     * @async
     * @param {Function} callback - Function to execute
     * @param {Array} params - Parameters to pass to the callback
     * @returns {Promise<void>}
     * @throws {Error} If the operation fails
     */
    async #launchOperation(callback, params) {
        try {
            await callback(...params);
        } catch (error) {
            this.#throwOperationError(error.message);
        }
    }

    /**
     * Validates multiple file paths.
     * 
     * @private
     * @async
     * @param {string} specifiedPaths - Space-separated paths to validate
     * @returns {Promise<string[]>} Array of validated paths
     * @throws {Error} If any path is invalid
     */
    async #getValidatedPaths(specifiedPaths) {
        const paths = specifiedPaths.split(' ');
        this.#checkIsArgsCountMatchLimit(paths.length, 2);

        const validatedPaths = await Promise.all(paths.map(async path => {
            const validPath = await this.#getValidatedPath(path);

            return validPath
        }));

        return validatedPaths;
    }

    /**
     * Validates a single file path.
     * 
     * @private
     * @async
     * @param {string} specifiedPath - Path to validate
     * @returns {Promise<string>} Validated path
     * @throws {Error} If the path is invalid
     */
    async #getValidatedPath(specifiedPath) {
        const normalizedPath = path.join(specifiedPath);

        try {
            await access(normalizedPath);

            return normalizedPath;
        } catch (error) {
            this.#throwInputError(error.message);
        }
    }

    /**
     * Checks if the number of arguments matches the expected limit.
     * 
     * @private
     * @param {number} argsCount - Number of arguments
     * @param {number} limit - Expected number of arguments
     * @throws {Error} If argument count doesn't match limit
     */
    #checkIsArgsCountMatchLimit(argsCount, limit) {
        if (argsCount < limit) {
            this.#throwInputError(this.#messages.getMissingOperand());
        }

        if (argsCount > limit) {
            this.#throwInputError(this.#messages.getTooManyArguments());
        }
    }

    /**
     * Checks if a parameter exists.
     * 
     * @private
     * @param {string} parameter - Parameter to check
     * @throws {Error} If parameter is missing
     */
    #checkIsParameterExist(parameter) {
        if (!parameter) {
            this.#throwInputError(this.#messages.getMissingOperand());
        }
    }

    /**
     * Shows the command prompt to the user.
     * This method is called after command execution to indicate that the system is ready for the next input.
     * 
     * @private
     * @returns {void}
     */
    #showPrompt() {
        this.readline.prompt();
    }
};
