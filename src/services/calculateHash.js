import fs from 'node:fs/promises';
import crypto from 'node:crypto';

export const calculateHash = async filePath => {
    const calcHashFile = await fs.open(filePath);
    const readStream = calcHashFile.createReadStream();
    const hash = crypto.createHash('sha256');

    return new Promise((resolve, reject) => {
        readStream.on('data', chunk => hash.update(chunk));
        readStream.on('end', () => {
            calcHashFile.close();
            resolve(hash.digest('hex'));
        });
        readStream.on('error', error => {
            calcHashFile.close();
            reject(error);
        });
    });
};
