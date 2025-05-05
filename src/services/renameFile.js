import { rename } from 'node:fs/promises';

export const renameFile = async (prevName, newName) => {
    try {
        await rename(prevName, newName);
    } catch (error) {
        throw new Error(error);
    }
};
