const { serializeError } = require('serialize-error');

require('./server/utils/globalConfig');
const logger = require('./server/logger/winstonLogger');
const redis = require('redis');

let consumerGroup;
let redisClient;

if (global.mode === 'local') {
    redisClient = redis.createClient(global.config.redisConfig);
} else {
    redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
}

let isFirstTime = true;
redisClient.on('connect', async function (response) {
    logger.info('Redis Client Connected', { type: 'redis', response });

    if (isFirstTime) {
        isFirstTime = false;
        const config = await new Promise((resolve, reject) => {
            redisClient.get(global.config.globalConfigKey, (err, reply) => {
                if (err) {
                    reject(err);
                }
                if (reply === null) {
                    resolve(null);
                } else {
                    resolve(reply);

                }
            });

        });

        logger.info(`[globalConfigFetched]`);
        global.config = { ...global.config, ...JSON.parse(config) };

        global.config.TOPIC_ID = 66;
        const { SetupAndStartConsumerGroup } = require("./server/queue/consumerUpgradeV1");
        SetupAndStartConsumerGroup()
            .then(cg => { consumerGroup = cg })
            .catch(error => { console.log("[START SetupAndStartConsumerGroup] Error: ", error) })
    }


});

redisClient.on('error', function (error) {
    logger.error('Redis Error', { type: 'redis', error: serializeError(error) });
    // console.log(error);
});

const signalsForGracefulShutdown = [
    'SIGTERM', 'SIGINT',
    'SIGABRT', 'SIGALRM',
    'SIGHUP', 'SIGPWR',
    'SIGUNUSED', 'SIGKILL'
]


for (const signal of signalsForGracefulShutdown) {
    process.on(signal, (signalName) => {
        logger.error(`${signalName} signal received`, { type: `${signalName}` });
        try {
            // Disconnecting the consumer
            consumerGroup
                .disconnect()
                .then(() => {
                    logger.info(`${signalName} Consumer shut down`, { type: `${signalName}` });
                    process.exit(0)
                })
                .catch((error) => {
                    logger.error(`${signalName} Error Shutting down the consumer`, { type: `${signalName}`, error: serializeError(error) });
                    process.exit(1)
                });
        } catch (error) {
            logger.error(`${signalName} Error running chores before exit`, { type: `${signalName}`, error: serializeError(error) });
            process.exit(1)
        }
    });
}

process.on('message', (message) => {
    logger.silly("[PROCESS MESSAGE] %j", message, { type: 'message_message' });
});

process.on('uncaughtException', (error, origin) => {
    logger.error("Uncaught Exception", { type: 'uncaught_exception', origin, error: serializeError(error) });
    // console.log(`process.on(uncaughtException): ${err}\n`);
    // throw new Error('uncaughtException');
});

process.on('error', (error) => {
    // console.log(`process.on(error): ${err}\n`);
    logger.error("Process Error", { type: 'process_error', error: serializeError(error) });
    throw new Error('error');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error("Unhandled Promise Rejection", { type: 'unhandled_rejection', promise_at: promise, error: serializeError(reason) });
});
