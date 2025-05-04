import fs from 'node:fs/promises';
import path from 'path';

export const copyFileToDest = async (fileName, targetDest) => {
    const copiedFilePath = path.join(targetDest, fileName);

    await new Promise(async (resolve, reject) => {
        const fileToRead = await fs.open(fileName);
        const readable = fileToRead.createReadStream();

        const fileToWrite = await fs.open(copiedFilePath, 'w');
        const writable = fileToWrite.createWriteStream();

        readable.on('error', reject);
        writable.on('error', reject);
    
        writable.on('finish', resolve);
    
        readable.pipe(writable);
    });
};
