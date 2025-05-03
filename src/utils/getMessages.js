export const getMessages = () => {
    const INTRO = 'Welcome to the File Manager, {username}!';
    const OUTRO = 'Thank you for using File Manager, {username}, goodbye!';
    const CURRENT_DIR_MESSAGE = 'You are currently in {directory}';
    const OPERATION_FAILED = 'Operation failed';
    const INVALID_INPUT = 'Invalid input';

    const formMessage = (message, textToReplace) => message.replace(/\{[^}]*\}/g, textToReplace);

    return {
        getIntro(username) {
            return formMessage(INTRO, username);
        },
        getOutro(username) {
            return formMessage(OUTRO, username);
        },
        getCurrentDir(currentDir) {
            return formMessage(CURRENT_DIR_MESSAGE, currentDir);
        },
        getOperationFailed: () => OPERATION_FAILED,
        getInvalidInput: () => INVALID_INPUT,
    };
};
