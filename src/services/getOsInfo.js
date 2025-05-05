import os from 'node:os';
import util from 'node:util';

export const getOsInfo = parameter => {
    const UNKNOWN_PARAMETER = 'Unknown parameter';

    const paramsMap = {
        EOL: () => util.inspect(os.EOL),
        cpus: () => {
            const cpus = os.cpus();
            const cpusInfo = cpus
                .map((cpu, index) => `CPU ${index + 1}: Model: ${cpu.model}, Clock Rate: ${convertMHzToGHz(cpu.speed)} GHz`)
                .join('\n');

            return `Total number of CPUs: ${cpus.length}\n${cpusInfo}\n`;
        },
        homedir: () => os.homedir(),
        username: () => os.userInfo().username,
        architecture: () => os.arch(),
    };

    if (!paramsMap.hasOwnProperty(parameter)) {
        throw new Error(`${UNKNOWN_PARAMETER} ${parameter}`);
    };

    return paramsMap[parameter]();
};

function convertMHzToGHz(speed) {
    return (speed / 1000).toFixed(2);
}
