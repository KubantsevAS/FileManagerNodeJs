export const getMessages = () => {
    const INTRO = 'Welcome to the File Manager, {username}!';
    const OUTRO = 'Thank you for using File Manager, {username}, goodbye!';
    const CURRENT_DIR_MESSAGE = 'You are currently in {directory}';
    const TOO_MANY_ARGUMENTS = 'Too many arguments';
    const OPERATION_FAILED = 'Operation failed';
    const MISSING_OPERAND = 'Missing operand';
    const UNKNOWN_COMMAND = 'Unknown command';
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
        getTooManyArguments: () => TOO_MANY_ARGUMENTS,
        getOperationFailed: () => OPERATION_FAILED,
        getMissingOperand: () => MISSING_OPERAND,
        getUnknownCommand: () => UNKNOWN_COMMAND,
        getInvalidInput: () => INVALID_INPUT,
    };
};
