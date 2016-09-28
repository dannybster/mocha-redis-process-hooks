const ps = require('ps-node');
const should = require('should');

const customRedisQuery = {
    command: `${process.env.REDIS_PATH}/redis-server`,
    // The port is not actually an arg it is part of the command
    // however ps-node only uses the text upto the first space as 
    // the command and the rest is used as args e.g.
    // /Applications/redis/src/redis-server *:1234 is interpreted as
    // command: /Applications/redis/src/redis-server
    // args: [*:1234] 
    arguments: `\\*:${process.env.REDIS_PORT}`,
    psargs: 'aux'
};

const defaultRedisQuery = {
    command: 'redis-server',
    arguments: `\\*:6379`,
    psargs: 'aux'
};

function testProcessIsRunning(psQuery) {
    return function isProcessRunning(done) {
        ps.lookup(psQuery, (err, result) => {
            should.not.exist(err);
            result.length.should.eql(1);
            done();
        });
    };
}

function testProcessIsNotRunning(psQuery) {
    return function isProcessNotRunning(done) {
        ps.lookup(psQuery, (err, result) => {
            should.not.exist(err);
            result.length.should.eql(0);
            done();
        });
    }
}

function runTestsWithRedisOptions(description, redisOptions, psQuery) {
    const sut = require('../src/redis-process-hooks')(redisOptions);
    sut.debugLog(`Query: ${JSON.stringify(psQuery)}`);
    sut.debugLog(`Redis options: ${JSON.stringify(redisOptions)}`);

    describe(`=== The process hooks ${description}. ===`, function () {
        describe('Before requiring the process hooks', function () {
            it('the process should not be running.', testProcessIsNotRunning(psQuery));
        });

        describe('After requiring the process hooks with all the options', function () {
            // Add the after each here so that it runs after the hooks inside
            // require('../src/process-hooks')(program).start() that way we can
            // be sure that we are testing that the process is still running 
            // after the hooks under test.
            // In summary mocha before hooks are FIFO and mocha after hooks are
            // FILO so adding this as the first means it will run last. Phew!
            afterEach('the process should be running.', testProcessIsRunning(psQuery));

            sut.start();
            it('the process should be running.', testProcessIsRunning(psQuery));
        });

        describe('After all the tests have run', function () {
            it('the process should not be running.', testProcessIsNotRunning(psQuery));
        });
    });
};

const customOptions = {
    redisBinPath: process.env.REDIS_PATH,
    redisPort: process.env.REDIS_PORT,
    timeout: process.env.PROGRAM_TIMEOUT,
    logLevel: process.env.LOG_LEVEL
};

const defaultOptions = {
    timeout: process.env.PROGRAM_TIMEOUT,
    logLevel: process.env.LOG_LEVEL
};

runTestsWithRedisOptions('with custom options', customOptions, customRedisQuery);
if (!process.env.DEFAULT_REDIS_IS_RUNNING) {
    runTestsWithRedisOptions('with default options', defaultOptions, defaultRedisQuery);
}
