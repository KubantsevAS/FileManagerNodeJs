import { createBrotliDecompress } from 'node:zlib';
import fs from 'node:fs/promises';
import path from 'node:path';

export const decompressFile = async (filePath, targetPath) => {
    const sourcePath = path.join(filePath);
    const sourceFile = path.basename(sourcePath, '.br');
    const decompressedFilePath = path.join(targetPath, sourceFile);
    
    const fileToDecompress = await fs.open(sourcePath);
    const decompressedFile = await fs.open(decompressedFilePath, 'w');

    return new Promise((resolve, reject) => {
        const readable = fileToDecompress.createReadStream();
        const writeable = decompressedFile.createWriteStream();
        const brotliDecompress = createBrotliDecompress();

        const closeFiles = error => {
            fileToDecompress.close();
            decompressedFile.close();

            if (error) {
                reject(error);
            } else {
                resolve();
            }
        }
    
        readable.on('error', error => closeFiles(error));
        writeable.on('error', error => closeFiles(error));
        brotliDecompress.on('error', error => closeFiles(error));  
        writeable.on('finish', () => closeFiles());
    
        readable.pipe(brotliDecompress).pipe(writeable);
    });
};
