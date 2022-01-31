const tracer = require('dd-trace').init({
    service: `${process.env.NODE_ENV}_desker_api`,
    env: process.env.NODE_ENV,
    logInjection: true
});
const tracerScope = tracer.scope();
const tracerFormats = require('dd-trace/ext/formats')
require('./server/utils/globalConfig');
require('./server/vodafone/utils/vodafoneConfig');

const logger = require('./server/logger/winstonLogger');
const redis = require('redis'); // using elasticache as redis
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
        let Logger = require('./server/utils/logger.js');
        const AWS = require('aws-sdk');

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

        async function SetMessageHandlerForConsumer() {

            const cacheWrapper = new CacheWrapper(redisClient);
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

            const sqsConsumerOne = Consumer.create({
                queueUrl: global.config.sqsConsumerSQSQueue,
                handleMessage: async (message) => {

                    try {
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

                        // [START] Tracer Span Extract-Inject Logic
                        // Get the Span Context sent by the Kafka producer
                        let logTraceHeaders = {};
                        try {
                            logTraceHeaders = requestForBotEngine['log_trace_headers'];
                            logger.silly('trace headers received at kafka consumer: %j', logTraceHeaders, { type: 'trace_span' });
                        } catch (error) {
                            logger.silly('[ERROR] trace headers received at kafka consumer: %j', logTraceHeaders, { type: 'trace_span' });
                        }
                        // Parent span, in this case is the span in which the Kafka producer sent the 
                        // message to the Kafka consumer here...
                        const sqsProducerEventSpan = tracer.extract(tracerFormats.LOG, logTraceHeaders)
                        const span = tracer.startSpan('kafka_consumer', {
                            childOf: sqsProducerEventSpan
                        })

                        tracerScope.activate(span, async () => {
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

                            botService.initBotEngine(requestForBotEngine);
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
    }
});

redisClient.on('error', function (error) {
    logger.error('Redis Error', { type: 'redis', error: serializeError(error) });
    // console.log(error);
});