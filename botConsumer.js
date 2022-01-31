require('./server/utils/globalConfig');
require('./server/vodafone/utils/vodafoneConfig');
const logger = require('./server/logger/winstonLogger');
let Logger = require('./server/utils/logger.js');
const AWS = require('aws-sdk');
const redis = require('redis'); // using elasticache as redis
const kafka = require('kafka-node');
const { serializeError } = require('serialize-error');
const KafkaProducer = kafka.Producer;

const forEachAsync = require('forEachAsync').forEachAsync;
const { Consumer } = require('sqs-consumer');

const Util = require('./server/utils/util');
const AwsSns = require('./server/utils/snsWrapper');
const CacheWrapper = require('./server/utils/cacheWrapper');
const QueueWrapper = require('./server/queue/queueWrapper');
const ActivityPushService = require("./server/services/activityPushService");
const ActivityCommonService = require("./server/services/activityCommonService");
const db = require("./server/utils/dbWrapper");
const BotService = require("./server/botEngine/services/botService");

let processingMessageCount = 0;
let sqsConsumerOne = null;
let cacheWrapper = null;
async function SetMessageHandlerForConsumer() {

    cacheWrapper = await GetCacheWrapper();
    const kafkaProducer = await GetKafkaProducer();

    const objectCollection = await GetObjectCollection(kafkaProducer, cacheWrapper);

    global.logger = new Logger(objectCollection.queueWrapper);

    const serviceObjectCollection = {
        util: objectCollection.util,
        db: objectCollection.db,
        cacheWrapper: cacheWrapper,
        queueWrapper: objectCollection.queueWrapper,
        activityCommonService: objectCollection.activityCommonService,
        forEachAsync: objectCollection.forEachAsync
    }

    const activityCommonService = objectCollection.activityCommonService;

    const botService = new BotService(serviceObjectCollection);

    AWS.config.update({
        "accessKeyId": "AKIAWIPBVOFRSFSVJZMF",
        "secretAccessKey": "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",
        "region": "ap-south-1"
    });

    sqsConsumerOne = Consumer.create({
        queueUrl: global.config.sqsConsumerSQSQueue,
        handleMessage: async (message) => {

            try {
                processingMessageCount++;
                console.log("message", message);

                const messageBody = JSON.parse(message.Body);
                const messageID = message.MessageId;

                let request = {};
                request.message_id = messageID;
                request.topic_id = global.config.sqsConsumerSQSQueueId;
                request.asset_id = messageBody.asset_id || 0;
                request.activity_id = messageBody.workflow_activity_id || 0;
                request.form_activity_id = messageBody.form_activity_id || 0;
                request.form_transaction_id = messageBody.form_transaction_id || 0;
                request.sqs_bot_transaction_id = messageBody.sqs_bot_transaction_id || 0;

                let requestForBotEngine = messageBody.message_body;
                requestForBotEngine.message_id = messageID;
                requestForBotEngine.sqs_bot_transaction_id = messageBody.sqs_bot_transaction_id || 0;

                const [errorTwo, _] = await activityCommonService.SQSMessageIdInsertAsync(request);
                if (errorTwo) {
                    logger.error(`Error recording the message ID`, { type: "bot_consumer", error: serializeError(errorTwo) });
                    return;
                }

                logger.info(`[${request.activity_id}][${request.sqs_bot_transaction_id || 0}] consuming bot engine message`, { type: "bot_consumer", messageBody })

                request.status_id = 2;
                request.log_asset_id = messageBody.asset_id || 0;
                request.consumed_datetime = objectCollection.util.getCurrentUTCTime();
                request.processed_datetime = null;
                request.failed_datetime = null;
                request.log_datetime = objectCollection.util.getCurrentUTCTime();

                const [errorThree, __] = await activityCommonService.BOTMessageTransactionUpdateStatusAsync(request);

                botService.initBotEngine(requestForBotEngine).then(botResponse => {
                    processingMessageCount--;
                }).catch(err => {
                    processingMessageCount--;
                });

                return;
            } catch (e) {
                logger.error('Bot Consumer Error', { type: 'bot_consumer', error: serializeError(e) });
            }

        },
        visibilityTimeout: 120,
        handleMessageTimeout: 240000,
        sqs: new AWS.SQS(),
        messageAttributeNames: ['Environment']
    });

    sqsConsumerOne.on('error', (error) => {
        console.log("[error]: %j", error);
    });

    sqsConsumerOne.on('processing_error', (error) => {
        console.log("[processing_error]:", error);
    });

    sqsConsumerOne.on('timeout_error', (error) => {
        console.log("[timeout_error]: %j", error);
    });

    sqsConsumerOne.start();
    console.log("sqsConsumerOne started " + global.config.sqsConsumerSQSQueue);
}


SetMessageHandlerForConsumer();

async function GetObjectCollection(kafkaProducer, cacheWrapper) {
    // Initialize fellows!
    const queueWrapper = new QueueWrapper(kafkaProducer, cacheWrapper);
    // AWS SNS
    const sns = new AwsSns();
    // Utilities
    const util = new Util({ cacheWrapper });
    const activityCommonService = new ActivityCommonService(db, util, forEachAsync);
    const activityPushService = new ActivityPushService({ cacheWrapper });

    const objectCollection = {
        util: util,
        db: db,
        cacheWrapper: cacheWrapper,
        activityCommonService: activityCommonService,
        sns: sns,
        forEachAsync: forEachAsync,
        queueWrapper: queueWrapper,
        activityPushService: activityPushService
    };
    return objectCollection;
}



async function GetCacheWrapper() {
    // Cache
    let redisClient;
    if (global.mode === 'local') {
        redisClient = redis.createClient(global.config.redisConfig);
    } else {
        redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
    }
    redisClient.config('set', 'notify-keyspace-events', 'KEA');

    redisClient.on('connect', async function (response) {
        logger.info('Redis Client Connected', { type: 'redis', response });
    });

    redisClient.on('error', function (error) {
        logger.error('Redis Error', { type: 'redis', error: serializeError(error) });
        // console.log(error);
    });

    const cacheWrapper = new CacheWrapper(redisClient);
    return cacheWrapper;
}

function GetKafkaProducer() {
    return new Promise((resolve, reject) => {
        const kafkaClient = new kafka.KafkaClient({
            kafkaHost: global.config.BROKER_HOST,
            connectTimeout: global.config.BROKER_CONNECT_TIMEOUT,
            requestTimeout: global.config.BROKER_REQUEST_TIMEOUT,
            autoConnect: global.config.BROKER_AUTO_CONNECT,
            maxAsyncRequests: global.config.BROKER_MAX_ASYNC_REQUESTS
        });
        const kafkaProducer = new KafkaProducer(kafkaClient);

        if (kafkaProducer.ready) {
            logger.info(`[0] Kafka producer is ready`, { type: "kafka_producer_startup" });
            resolve(kafkaProducer);
        }
        kafkaProducer.on('ready', () => {
            logger.info(`[1] Kafka producer is ready`, { type: "kafka_producer_startup" });
            resolve(kafkaProducer);
        })

        kafkaProducer.on('error', (error) => {
            logger.error(`Kafka producer error`, { type: "kafka_producer_startup", error: serializeError(error) });
            reject(error);
        })
    });
}


const signalsForGracefulShutdown = [
    'SIGTERM', 'SIGINT',
    'SIGABRT', 'SIGALRM',
    'SIGHUP', 'SIGPWR',
    'SIGUNUSED', 'SIGKILL'
]

for (const signal of signalsForGracefulShutdown) {
    process.on(signal, async (signalName) => {
        logger.error(`${signalName} signal received ak ak ak `, { type: `${signalName}` });
        try {
            // Disconnecting the consumer
            sqsConsumerOne.stop();
            let isGracefullShutdownRequired = await cacheWrapper.getKeyValueFromCache('BOT_CONSUMER_GRACEFULL_SHUTDOWN')
            while (processingMessageCount > 0 && isGracefullShutdownRequired == 1) {
                await new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 2000);
                });
            }
            process.exit(0);
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