import { createBrotliCompress } from 'node:zlib';
import fs from 'node:fs/promises';
import path from 'node:path';

export const compressFile = async (filePath, targetPath) => {
    const sourceFile = path.basename(filePath);
    const compressedFilePath = path.join(targetPath, `${sourceFile}.br`);
    
    const fileToCompress = await fs.open(filePath);
    const compressedFile = await fs.open(compressedFilePath, 'w');

    return new Promise((resolve, reject) => {
        const readable = fileToCompress.createReadStream();
        const writeable = compressedFile.createWriteStream();
        const brotliCompress = createBrotliCompress();

        const closeFiles = error => {
            fileToCompress.close();
            compressedFile.close();

            if (error) {
                reject(error);
            } else {
                resolve();
            }
        }
    
        readable.on('error', error => closeFiles(error));
        writeable.on('error', error => closeFiles(error));
        brotliCompress.on('error', error => closeFiles(error));
        writeable.on('finish', () => closeFiles());
    
        readable.pipe(brotliCompress).pipe(writeable);
    });
};
