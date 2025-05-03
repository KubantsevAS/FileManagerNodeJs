export const getCliArguments = () => {
    const PREFIX = '--';
    const parsedArguments = {};

    process.argv
        .forEach((argument, index, array) => {
            if (!argument.startsWith(PREFIX) || argument === PREFIX) {
                return;
            }

            const argEntries = argument.split('=');
            parsedArguments[argEntries[0].replace(PREFIX, '')] = argEntries[1];
        });

    return parsedArguments;
};
