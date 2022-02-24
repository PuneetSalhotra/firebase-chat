const tracer = require('dd-trace').init({
    service: `${process.env.NODE_ENV}_desker_api`,
    env: process.env.NODE_ENV,
    logInjection: true
});
const tracerScope = tracer.scope();
const tracerFormats = require('dd-trace/ext/formats')

require('./server/vodafone/utils/vodafoneConfig');
var forEachAsync = require('forEachAsync').forEachAsync;

const { serializeError } = require('serialize-error');

require('./server/utils/globalConfigV1');
const logger = require('./server/logger/winstonLogger');
const redis = require('redis');
const kafka = require('kafka-node');

const {
    Kafka: Kafkajs,
    logLevel: KafkajsLogLevel
} = require('kafkajs');

const KafkaProducer = kafka.Producer;

const { nanoid } = require('nanoid')

let consumerGroup;
let redisClient;
let cacheWrapper;
if (global.mode === 'local') {
    redisClient = redis.createClient(global.config.redisConfig);
} else {
    redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
}

let processingMessageCount = 0;

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

        const Util = require('./server/utils/util');
        let Logger = require('./server/utils/logger.js');
        const db = require("./server/utils/dbWrapper");

        const QueueWrapper = require('./server/queue/queueWrapper');
        const CacheWrapper = require('./server/utils/cacheWrapper');

        const AwsSns = require('./server/utils/snsWrapper');
        const ActivityCommonService = require("./server/services/activityCommonService");
        const ActivityPushService = require("./server/services/activityPushService");
        const pubnubWrapper = new (require('./server/utils/pubnubWrapper'))();

        // Importing all the relevant service files
        const ActivityService = require("./server/services/activityService");
        const ActivityTimelineService = require("./server/services/activityTimelineService");
        const ActivityParticipantService = require("./server/services/activityParticipantService");
        const ActivityUpdateService = require("./server/services/activityUpdateService");
        const FormConfigService = require("./server/services/formConfigService");
        const VodafoneService = require("./server/vodafone/services/vodafoneService");
        const PamUpdateService = require("./server/services/pamUpdateService");
        const PamService = require("./server/services/pamService");

        SetupAndStartConsumerGroup()
            .then(cg => { consumerGroup = cg })
            .catch(error => { console.log("[START SetupAndStartConsumerGroup] Error: ", error) })


        async function SetupAndStartConsumerGroup() {
            try {
                // Kafka Producer
                const kafkaProducer = await GetKafkaProducer();
                logger.info(`Kafka producer started`, { type: "consumer_group_startup" })

                // Kafka Consumer
                const consumerGroup = await GetConsumerGroup();

                // Cache Wrapper
                cacheWrapper = await GetCacheWrapper()

                // Object Collection
                const objectCollection = await GetObjectCollection(kafkaProducer, cacheWrapper);

                // Set the legacy logger | Technical debt
                global.logger = new Logger(objectCollection.queueWrapper);

                const serviceObjectCollection = {
                    activityService: new ActivityService(objectCollection),
                    activityTimelineService: new ActivityTimelineService(objectCollection),
                    vodafoneService: new VodafoneService(objectCollection),
                    activityUpdateService: new ActivityUpdateService(objectCollection),
                    activityParticipantService: new ActivityParticipantService(objectCollection),
                    formConfigService: new FormConfigService(objectCollection),
                    pamService: new PamService(objectCollection),
                    pamUpdateService: new PamUpdateService(objectCollection),
                    activityCommonService: objectCollection.activityCommonService,
                    cacheWrapper: cacheWrapper
                }

                // Set the message handler for the incoming messages
                await SetMessageHandlerForConsumer(consumerGroup, eventMessageRouter, serviceObjectCollection)

                return consumerGroup
            } catch (error) {
                logger.error("[SetupAndStartConsumerGroup] Error: ", { error: serializeError(error), type: "consumer_group_startup" })
                throw new Error(error)
            }
        }

        async function SetMessageHandlerForConsumer(consumerGroup, eventMessageRouter, serviceObjectCollection) {
            // type KafkaMessage = {
            //     key: Buffer
            //     value: Buffer | null
            //     timestamp: string
            //     size: number
            //     attributes: number
            //     offset: string
            //     headers?: IHeaders
            // }
            const { activityCommonService, cacheWrapper } = serviceObjectCollection;
            await consumerGroup.run({
                eachMessage: async ({ topic, partition, message }) => {
                    // console.log("message: ", message)
                    // console.log({
                    //     key: message.key.toString(),
                    //     value: message.value.toString(),
                    //     headers: message.headers,
                    //     partition: partition
                    // })
                    try {
                        const key = message.key.toString();
                        const value = message.value.toString();
                        const { timestamp, size, attributes, offset, headers } = message;

                        const kafkaMessageID = `${topic}_${partition}_${offset}`;
                        logger.debug(`topic ${topic} partition ${partition} offset ${offset} kafkaMessageID ${kafkaMessageID}`, { type: "kafka_consumer" })
                        logger.debug(`getting this key from Redis ${topic}_${partition}`, { type: "kafka_consumer" })

                        const messageJSON = JSON.parse(value || "{}");

                        if (!messageJSON.hasOwnProperty("payload")) {
                            throw new Error("NoPayloadFoundInKafkaMessage");
                        }

                        let request = messageJSON['payload'];
                        request.partition = partition;
                        request.offset = offset;

                        // [START] Tracer Span Extract-Inject Logic
                        // Get the Span Context sent by the Kafka producer
                        let logTraceHeaders = {};
                        try {
                            logTraceHeaders = messageJSON['log_trace_headers'];
                            logger.silly('trace headers received at kafka consumer: %j', logTraceHeaders, { type: 'trace_span' });
                        } catch (error) {
                            logger.silly('[ERROR] trace headers received at kafka consumer: %j', logTraceHeaders, { type: 'trace_span' });
                        }
                        // Parent span, in this case is the span in which the Kafka producer sent the 
                        // message to the Kafka consumer here...
                        const kafkaProduceEventSpan = tracer.extract(tracerFormats.LOG, logTraceHeaders)
                        const span = tracer.startSpan('kafka_consumer', {
                            childOf: kafkaProduceEventSpan
                        })

                        tracerScope.activate(span, async () => {

                            const [errorZero, partitionOffsetData] = await activityCommonService.checkingPartitionOffsetAsync(request);
                            if (errorZero || Number(partitionOffsetData.length) > 0) {
                                // Don't know why we need this call here
                                // I haven't handled the error here, please do if you need to
                                const [errorOne, _] = await activityCommonService.duplicateMsgUniqueIdInsertAsync(request);
                                if (errorOne) { logger.error(`Error recording the duplicate transaction`, { type: "kafka_consumer", error: serializeError(errorOne) }) }
                                throw new Error("PartitionOffsetEntryAlreadyExists");
                            }
                            const [errorTwo, _] = await activityCommonService.partitionOffsetInsertAsync(request);
                            if (errorTwo) { logger.error(`Error recording the partition offset`, { type: "kafka_consumer", error: serializeError(errorTwo) }) }

                            logger.info(`[${kafkaMessageID}] consuming message`, { type: "kafka_consumer", request })

                            // Core!
                            await eventMessageRouter(messageJSON, kafkaMessageID, serviceObjectCollection)

                            // Re-visit this if there's any trouble with identify whether
                            // a message has been read or not
                            if (Number(request.pubnub_push) === 1) {
                                await cacheWrapper.setOffset(global.config.TOPIC_NAME, kafkaMessageID, 0); // 1 Means Open; 0 means read
                            }

                        });

                    } catch (error) {
                        logger.error(`SetMessageHandlerForConsumer] Error: `, { type: "kafka_consumer", error: serializeError(error) })
                        activityCommonService.insertConsumerError({
                            consumer_message: JSON.stringify(message),
                            consumer_error: JSON.stringify({ error: error, e_stack: error.stack })
                        })
                    }
                },
            })
        }

        async function eventMessageRouter(messageJSON, kafkaMessageID, serviceObjectCollection) {
            return new Promise(async (resolve, reject) => {
                try {
                    const { service, method, payload } = messageJSON;

                    let asyncFlag = 0;
                    let reversedMethodName = String(method).split('').reverse().join('');
                    let isAsyncMethod = reversedMethodName.substring(0, 5);
                    if (isAsyncMethod === "cnysA") { asyncFlag = 1; }

                    switch (service) {
                        case "activityService":
                        case "activityTimelineService":
                        case "vodafoneService":
                        case "activityUpdateService":
                        case "activityParticipantService":
                        case "formConfigService":
                        case "pamUpdateService":
                        case "pamService":
                            if (asyncFlag) {
                                processingMessageCount++;
                                const [error, response] = await serviceObjectCollection[service][method](payload);
                                processingMessageCount--;
                                if (error) { reject(error) }
                                else { resolve() };
                            } else {
                                processingMessageCount++;
                                serviceObjectCollection[service][method](payload, function (error, data) {
                                    processingMessageCount--;
                                    if (error) {
                                        logger.error(`Error executing ${service}.${method}`, { type: "kafka_consumer", ...messageJSON, error: serializeError(error) })
                                        resolve();
                                    } else {
                                        logger.info(`Executed ${service}.${method}`, { type: "kafka_consumer", ...messageJSON })
                                        resolve();
                                    }
                                });
                            }
                            break;

                        default:
                            throw new Error(`ServiceNotFound::${service}.${method}`)
                    }
                } catch (error) {
                    logger.error(`[eventMessageRouter] error: `, { type: "kafka_consumer", error: serializeError(error) })
                    reject(error);
                }
            });
        }

        async function GetCacheWrapper() {
            const cacheWrapper = new CacheWrapper(redisClient);
            return cacheWrapper;
        }

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

            // Instantiate all the services
            // const activityTimelineService = new ActivityTimelineService(objectCollection);
        }

        async function GetConsumerGroup() {
            const kafkaClientID = `${global.mode}-kafkajs-consumergroup-client-${nanoid()}`;
            // const consumerGroupID = `${global.config.CONSUMER_GROUP_ID}-1`; // For local testing
            const consumerGroupID = `${global.config.CONSUMER_GROUP_ID}`;

            const kafkaClient = new Kafkajs({
                clientId: kafkaClientID,
                brokers: String(global.config.BROKER_HOST).split(","),
                connectionTimeout: 5000,
                logLevel: KafkajsLogLevel.INFO
            })

            const consumerGroup = kafkaClient.consumer({ groupId: consumerGroupID })
            await consumerGroup.connect()
            await consumerGroup.subscribe({ topic: global.config.TOPIC_NAME, fromBeginning: false })

            // Setup Instrumentation Events
            // Documentation: https://github.com/tulios/kafkajs/blob/master/docs/InstrumentationEvents.md
            const {
                HEARTBEAT, CONNECT, GROUP_JOIN,
                STOP, DISCONNECT, CRASH, REQUEST_TIMEOUT
            } = consumerGroup.events;

            consumerGroup.on(CONNECT, () => { logger.info(`consumer with client ID ${kafkaClientID} has connected`, { type: "consumer_group_startup", kafkaClientID }) })
            consumerGroup.on(HEARTBEAT, e => logger.silly(`${kafkaClientID} heartbeat at ${e.timestamp}`, { type: "consumer_group_startup", kafkaClientID, e }))
            consumerGroup.on(GROUP_JOIN, e => logger.info(`${kafkaClientID} has joined ${consumerGroupID}`, { type: "consumer_group_startup", kafkaClientID, e }))

            consumerGroup.on(STOP, () => { logger.error(`consumer with client ID ${kafkaClientID} has stopped`, { type: "consumer_group_startup", kafkaClientID }) })
            consumerGroup.on(DISCONNECT, e => logger.error(`consumer with client ID ${kafkaClientID} has disconnected`, { type: "consumer_group_startup", kafkaClientID, e }))
            consumerGroup.on(CRASH, e => logger.error(`consumer with client ID ${kafkaClientID} has crashed`, { type: "consumer_group_startup", kafkaClientID, e }))
            consumerGroup.on(REQUEST_TIMEOUT, e => logger.error(`request timeout for ${kafkaClientID}`, { type: "consumer_group_startup", kafkaClientID, e }))

            return consumerGroup;
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
                .then(async () => {
                    logger.info(`${signalName} Consumer shut down`, { type: `${signalName}` });
                    await handleGracefullShutdown(signalName);
                    process.exit(0)
                })
                .catch(async (error) => {
                    logger.error(`${signalName} Error Shutting down the consumer`, { type: `${signalName}`, error: serializeError(error) });
                    await handleGracefullShutdown(signalName);
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


async function handleGracefullShutdown(signalName) {

    try {
        let isGracefullShutdownRequired = await cacheWrapper.getKeyValueFromCache('API_CONSUMER_GRACEFULL_SHUTDOWN');
        isGracefullShutdownRequired = Number(isGracefullShutdownRequired);
        logger.error(`[WaitingToShutdown] *&*&*&*&*&*&*&*&*&*&*&*&`, { type: `${signalName}` });
        logger.error(`[WaitingToShutdown] processing message count before while ${processingMessageCount} remaining waiting time to shutdown ${isGracefullShutdownRequired}`, { type: `${signalName}` });
        while (processingMessageCount > 0 && isGracefullShutdownRequired > 0) {
            await new Promise((resolve) => {
                setTimeout(() => {
                    logger.error(`[WaitingToShutdown] *&*&*&*&*&*&*&*&*&*&*&*&`, { type: `${signalName}` });
                    logger.error(`[WaitingToShutdown] processing message count ${processingMessageCount} remaining waiting time to shutdown ${isGracefullShutdownRequired}`, { type: `${signalName}` });
                    isGracefullShutdownRequired -= 2;
                    resolve();
                }, 2000);
            });
        }
        logger.error(`[StoppingProcess] *&*&*&*&*&*&*&*&*&*&*&*&`, { type: `${signalName}` });
        return;
    } catch (e) {
        logger.error(`[ErrorInSuttingDown] *&*&*&*&*&*&*&*&*&*&*&*&`, { type: `${signalName}` });
        return;
    }
}