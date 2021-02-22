const { serializeError } = require('serialize-error')
// var Consumer = require("./server/queue/consumer.js");
// new Consumer();
const logger = require('./server/logger/winstonLogger');
const { SetupAndStartConsumerGroup } = require("./server/queue/consumerUpgradeV1");

const signalsForGracefulShutdown = [
    'SIGTERM', 'SIGINT',
    'SIGABRT', 'SIGALRM',
    'SIGHUP', 'SIGPWR',
    'SIGUNUSED'
]

let consumerGroup;
SetupAndStartConsumerGroup()
    .then(cg => { consumerGroup = cg })
    .catch(error => { console.log("[START SetupAndStartConsumerGroup] Error: ", error) })

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
