export const getCliArguments = cliArguments => {
    const PREFIX = '--';
    const parsedArguments = {};

    cliArguments.forEach(argument => {
        if (!argument.startsWith(PREFIX) || argument === PREFIX) {
            return;
        }

        const argEntries = argument.split('=');
        parsedArguments[argEntries[0].replace(PREFIX, '')] = argEntries[1];
    });

    return parsedArguments;
};
