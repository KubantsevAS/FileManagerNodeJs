import fs from 'node:fs/promises';

export const createFile = async (filePath, content = '') => {
    try {
        const fileToCreate = await fs.open(filePath, 'wx');
        await fileToCreate.writeFile(content);
        await fileToCreate.close();
      } catch (error) {
        throw new Error(error.message);
    }
};
