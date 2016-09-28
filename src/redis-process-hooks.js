'use strict';

const path = require('path');

module.exports = ({ redisBinPath = '', logLevel = '20', timeout = 10000, redisPort = 6379 } = {}) => {
    const processOptions = {
        logLevel,
        timeout,
        command: path.join(redisBinPath, 'redis-server'),
        successOutput: `The server is now ready to accept connections on port ${redisPort}`,
        errorOutput: `Creating Server TCP listening socket *:${redisPort}: bind: Address already in use`,
        args: ['--port', redisPort]
    };

    return require('mocha-process-hooks')(processOptions);
}