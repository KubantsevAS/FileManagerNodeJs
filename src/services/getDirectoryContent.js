import { access, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';

export const getDirectoryContent = async currentDirectory => {
    try {
        const files = await readdir(currentDirectory);
        const items = await Promise.all(files.map(async entry => {
            const fullPath = path.join(currentDirectory, entry);
            const stat = await lstat(fullPath);

            if (stat.isDirectory()) {
                return { Name: entry, Type: 'directory' };
            }

            if (stat.isFile()) {
                return { Name: entry, Type: 'file' };
            }

            return null;
        }));
        
        const filteredItems = items.filter(Boolean);
        filteredItems.sort((previous, next) => sortByTypeAndName(previous, next));

        return filteredItems;
    } catch (error) {
        throw new Error(error.message);
    }
}

function sortByTypeAndName(previous, next) {
    if (previous.Type === next.Type) {
        return previous.Name.localeCompare(next.Name);
    }

    return previous.Type === 'directory' ? -1 : 1;
}
