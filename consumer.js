var Consumer = require("./server/queue/consumer.js");
new Consumer();

const logger = require('./server/logger/winstonLogger');

process.on('uncaughtException', (error, origin) => {
    logger.error("Uncaught Exception", { type: 'uncaught_exception', origin, error: error });
    // console.log(`process.on(uncaughtException): ${err}\n`);
    // throw new Error('uncaughtException');
});

process.on('error', (error) => {
    // console.log(`process.on(error): ${err}\n`);
    logger.error("Process Error", { type: 'process_error', error: error });
    throw new Error('error');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error("Unhandled Promise Rejection", { type: 'unhandled_rejection', promise_at: promise, error: reason });
});

/*var http = require('http');
http.createServer((req, res)=>{
    res.write('I am Alive');
    res.end();
}).listen(global.config.consumerZero);*/