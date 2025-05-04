import path from 'node:path';

export const getUpperDirectory = currentDirectory => {
    const newDirectory = path.dirname(currentDirectory);

    if (newDirectory === currentDirectory) {
        return '';
    }

    try {
        process.chdir(newDirectory);

        return newDirectory;
    } catch (error) {
        throw new Error(error);
    }
};
