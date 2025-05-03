import path from 'node:path';

export const getUpperDirectory = currentDirectory => {
    const newDirectory = path.dirname(currentDirectory);

    if (newDirectory === currentDirectory) {
        return '';
    }

    try {
        process.chdir(newDirectory);
        return path.dirname(currentDirectory);
    } catch {
        throw new Error();
    }
};
