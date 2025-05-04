import fs from 'node:fs/promises';
import path from 'node:path';

export const readFileContent = async filePath => {
    const fileToRead = await fs.open(path.join(filePath));
    const readStream = fileToRead.createReadStream();

    await new Promise((resolve, reject) => {
        readStream.on('data', chunk => {
            process.stdout.write(chunk);
        });
        
        readStream.on('end', () => {
            console.log('\n');
            fileToRead.close();
            resolve();
        });
        
        readStream.on('error', error => {
            fileToRead.close();
            reject(error);
        });
    });
};
