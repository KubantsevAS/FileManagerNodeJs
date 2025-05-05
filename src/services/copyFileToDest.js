import fs from 'node:fs/promises';
import path from 'node:path';

export const copyFileToDest = async (fileName, targetDest) => {
    const copiedFilePath = path.join(targetDest, fileName);
    const fileToRead = await fs.open(fileName);
    const fileToWrite = await fs.open(copiedFilePath, 'w');

    await new Promise((resolve, reject) => {
        const readable = fileToRead.createReadStream();
        const writable = fileToWrite.createWriteStream();

        const closeFiles = error => {
            fileToRead.close();
            fileToWrite.close();

            if (error) {
                reject(error);
            } else {
                resolve();
            }
        }

        readable.on('error', error => closeFiles(error));
        writable.on('error', error => closeFiles(error));
        writable.on('finish', () => closeFiles());
    
        readable.pipe(writable);
    });
};
