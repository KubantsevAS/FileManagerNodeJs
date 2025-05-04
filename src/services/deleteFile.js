import fs from 'node:fs/promises';
import path from 'node:path';

export const deleteFile = async filePath => {
    await fs.unlink(path.join(filePath));
};
