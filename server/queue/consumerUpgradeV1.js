const tracer = require('dd-trace').init({
    service: `${process.env.NODE_ENV}_desker_api`,
    env: process.env.NODE_ENV,
    logInjection: true
});
const tracerScope = tracer.scope();
const tracerFormats = require('dd-trace/ext/formats')

require('../utils/globalConfig');
require('../vodafone/utils/vodafoneConfig');
var forEachAsync = require('forEachAsync').forEachAsync;
const { serializeError } = require('serialize-error');

let Logger = require('../utils/logger.js');
const logger = require('../logger/winstonLogger');

const kafka = require('kafka-node');
const kafkaConsumer = kafka.Consumer;
const KafkaProducer = kafka.Producer;
const kafkaConsumerGroup = kafka.ConsumerGroup;
const {
    Kafka: Kafkajs,
    logLevel: KafkajsLogLevel,
    KafkaJSBrokerNotFound,
    Kafka,
} = require('kafkajs');
const { nanoid } = require('nanoid')
const onExit = require('signal-exit');

const Util = require('../utils/util');

const db = require("../utils/dbWrapper");
const redis = require('redis'); // using elasticache as redis

const QueueWrapper = require('./queueWrapper');
const CacheWrapper = require('../utils/cacheWrapper');

const AwsSns = require('../utils/snsWrapper');
const ActivityCommonService = require("../services/activityCommonService");
const ActivityPushService = require("../services/activityPushService");
const pubnubWrapper = new (require('../utils/pubnubWrapper'))();

// Importing all the relevant service files
const ActivityService = require("../services/activityService");
const ActivityTimelineService = require("../services/activityTimelineService");
const ActivityParticipantService = require("../services/activityParticipantService");
const ActivityUpdateService = require("../services/activityUpdateService");
const FormConfigService = require("../services/formConfigService");
const VodafoneService = require("../vodafone/services/vodafoneService");
const PamUpdateService = require("../services/pamUpdateService");
const PamService = require("../services/pamService");

async function SetupAndStartConsumerGroup() {
    try {
        // Kafka Producer
        const kafkaProducer = await GetKafkaProducer();
        logger.info(`Kafka producer started`, { type: "consumer_group_startup" })

        // Kafka Consumer
        const consumerGroup = await GetConsumerGroup();

        // Cache Wrapper
        const cacheWrapper = await GetCacheWrapper()

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
                    consumer_message : JSON.stringify(message),
                    consumer_error   : JSON.stringify({ error : error, e_stack : error.stack})
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
                        const [error, response] = await serviceObjectCollection[service][method](payload);
                        if (error) { reject(error) }
                        else { resolve() };
                    } else {
                        serviceObjectCollection[service][method](payload, function (error, data) {
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
    // Cache
    let redisClient;
    if (global.mode === 'local') {
        redisClient = redis.createClient(global.config.redisConfig);
    } else {
        redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
    }
    redisClient.config('set','notify-keyspace-events','KEA');

    redisClient.on('connect',async function (response) {
        logger.info('Redis Client Connected',{type: 'redis',response});
    });
    
    redisClient.on('error',function (error) {
        logger.error('Redis Error',{type: 'redis',error: serializeError(error)});
        // console.log(error);
    });

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

module.exports = { SetupAndStartConsumerGroup };