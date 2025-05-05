import fs from 'node:fs/promises';

export const deleteFile = async filePath => {
    await fs.unlink(filePath);
};
