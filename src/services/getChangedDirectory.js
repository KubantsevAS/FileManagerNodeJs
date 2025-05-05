import { access } from 'node:fs/promises';
import path from 'node:path';

export const getChangedDirectory = async targetDirectory => {
    const resolvedPath = path.resolve(process.cwd(), targetDirectory);

    try {
        await access(resolvedPath);
        process.chdir(targetDirectory);

        return process.cwd();
    } catch (error) {
        throw new Error(error.message);
    }
};
