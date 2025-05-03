export const getMessages = () => {
    const INTRO = 'Welcome to the File Manager, {username}!';
    const OUTRO = 'Thank you for using File Manager, {username}, goodbye!';
    const CURRENT_DIR_MESSAGE = 'You are currently in {dir}';
    const ERROR_MESSAGE = 'Operation failed';

    const formMessage = (message, textToReplace) => message.replace(/\{[^}]*\}/g, textToReplace);

    return {
        getIntroMessage(username) {
            return formMessage(INTRO, username);
        },
        getOutroMessage(username) {
            return formMessage(OUTRO, username);
        },
        gerCurrentDirMessage(currentDir) {
            return formMessage(CURRENT_DIR_MESSAGE, currentDir);
        },
    };
};
