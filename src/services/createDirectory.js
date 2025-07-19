import fs from 'node:fs/promises';

export const createDirectory = async directoryPath => {
    const DIRECTORY_ALREADY_EXISTS = 'Directory already exists';

    try {
        await fs.access(directoryPath);
        throw new Error(DIRECTORY_ALREADY_EXISTS);
    } catch (error) {
        if (error.message === DIRECTORY_ALREADY_EXISTS) {
            throw error;
        }

        await fs.mkdir(directoryPath, { recursive: true });
    }
};
