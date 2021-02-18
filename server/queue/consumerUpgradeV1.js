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
const VodafoneService = require("../vodafone/services/vodafoneService");

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

        if (kafkaProducer.ready) { resolve(kafkaProducer); }
        kafkaProducer.on('ready', () => { resolve(kafkaProducer); })

        kafkaProducer.on('error', (error) => { reject(error); })
    });
}

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

        console.log("objectCollection: ", objectCollection)
        const serviceObjectCollection = {
            activityService: new ActivityService(objectCollection),
            activityTimelineService: new ActivityTimelineService(objectCollection),
            vodafoneService: new VodafoneService(objectCollection),
            activityUpdateService: new ActivityUpdateService(objectCollection),
            activityParticipantService: new ActivityParticipantService(objectCollection)
        }

        // Set the message handler for the incoming messages
        await SetMessageHandlerForConsumer(consumerGroup, eventMessageRouter, serviceObjectCollection)

        return `Consumer group started!`
    } catch (error) {
        logger.error("[error]: ", { error: serializeError(error) })
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
    await consumerGroup.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log({
                key: message.key.toString(),
                value: message.value.toString(),
                headers: message.headers,
            })
            try {
                const key = message.key.toString();
                const value = message.value.toString();
                const { timestamp, size, attributes, offset, headers } = message;

                const kafkaMessageID = `${topic}_${partition}_${offset}`;
                logger.debug(`topic ${topic} partition ${partition} offset ${offset} kafkaMessageID ${kafkaMessageID}`, { type: "kafka_consumer" })
                logger.debug(`getting this key from Redis ${topic}_${partition}`, { type: "kafka_consumer" })

                const messageJSON = JSON.parse(value);

                if (!messageJSON.hasOwnProperty("payload")) {
                    throw new Error("NoPayloadFoundInKafkaMessage");
                }

                let request = messageJSON['payload'];
                request.partition = message.partition;
                request.offset = message.offset;

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

                tracerScope.activate(span, () => {

                    const [errorZero, partitionOffsetData] = await activityCommonService.checkingPartitionOffsetAsync(request);
                    if (errorZero || Number(partitionOffsetData.length) > 0) {
                        // Don't know why we need this call here
                        // I haven't handled the error here, please do if you need to
                        const [errorOne, _] = await activityCommonService.duplicateMsgUniqueIdInsertAsync(request);
                        if (errorOne) { logger.error(`Error recording the duplicate transaction`, { type: "kafka_consumer", error: serializeError(errorOne) }) }
                        throw new Error("PartitionOffsetEntryAlreadyExists");
                    }
                    const [errorTwo, _] = await activityCommonService.partitionOffsetInsertAsync(request);
                    if (errorOne) { logger.error(`Error recording the partition offset`, { type: "kafka_consumer", error: serializeError(errorTwo) }) }

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

            }



        },
    })
}

async function eventMessageRouter(messageJSON, kafkaMessageID, serviceObjectCollection) {
    
}

async function GetCacheWrapper() {
    // Cache
    let redisClient;
    if (global.mode === 'local') {
        redisClient = redis.createClient(global.config.redisConfig);
    } else {
        redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
    }
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
    const consumerGroupID = `${global.config.CONSUMER_GROUP_ID}-1`;

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

    return consumerGroup;
}

var Consumer = function () {

    var serviceObjectCollection = {};

    // for a single topic pass in a string
    // var consumerGroup = new kafkaConsumerGroup(optionsConsumerGroup, global.config.TOPIC_NAME);

    new Promise((resolve, reject) => {
        if (kafkaProducer.ready)
            return resolve();
        kafkaProducer.on('ready', resolve);
    }).then(() => {

        var queueWrapper = new QueueWrapper(kafkaProducer, cacheWrapper);
        global.logger = new Logger(queueWrapper);

        global.logger.write('conLog', 'global.config.BROKER_HOST : ' + global.config.BROKER_HOST, {}, {});
        global.logger.write('conLog', global.config.TOPIC_NAME, {}, {});
        global.logger.write('conLog', 'Kafka Producer ready!!', {}, {});

        var objCollection = {
            util: util,
            db: db,
            cacheWrapper: cacheWrapper,
            activityCommonService: activityCommonService,
            sns: sns,
            forEachAsync: forEachAsync,
            queueWrapper: queueWrapper,
            activityPushService: activityPushService
        };

        // /*
        consumer.on('message', function (message) {

            tracerScope.activate(span, () => {

                activityCommonService.checkingPartitionOffset(request, (err, data) => {
                    global.logger.write('conLog', 'err from checkingPartitionOffset : ' + err, {}, request);
                    if (err === false) {
                        global.logger.write('conLog', 'Consuming the message', {}, request);
                        activityCommonService.partitionOffsetInsert(request, (err, data) => { });
                        consumingMsg(message, kafkaMsgId, objCollection).then(async () => {
                            if (Number(request.pubnub_push) === 1) {
                                //pubnubWrapper.publish(kafkaMsgId, { "status": 200 });
                                await cacheWrapper.setOffset(global.config.TOPIC_NAME, kafkaMsgId, 0); // 1 Means Open; 0 means read
                            }
                        }).catch(async (err) => {
                            if (Number(request.pubnub_push) === 1) {
                                //pubnubWrapper.publish(kafkaMsgId, { "status": err });
                                await cacheWrapper.setOffset(global.config.TOPIC_NAME, kafkaMsgId, 0); // 1 Means Open; 0 means read
                            }
                        });

                    } else {
                        global.logger.write('conLog', 'Before calling this duplicateMsgUniqueIdInsert', {}, request);
                        activityCommonService.duplicateMsgUniqueIdInsert(request, (err, data) => { });
                    }
                });

            });
        });

        consumer.on('connect', function (err, data) {
            logger.info('Connected To Kafka Host', { type: 'kafka', data, error: err });
            // global.logger.write('conLog', "Connected to Kafka Host", {}, {});
        });

        consumer.on('error', function (err) {
            logger.error('Kafka Consumer Error', { type: 'kafka', error: err });
            // global.logger.write('conLog', 'err => ' + JSON.stringify(err), {}, {});
        });

        consumer.on('offsetOutOfRange', function (err) {
            logger.error('Kafka Consumer offsetOutOfRange Error', { type: 'kafka', error: err });
            // global.logger.write('conLog', 'offsetOutOfRange => ' + JSON.stringify(err), {}, {});
        });

        kafkaProducer.on('error', function (error) {
            logger.error('Kafka Producer Error', { type: 'kafka', error: error });
            // global.logger.write('conLog', error, {}, {});
        });
    });

    function commitingOffset(message) {
        return new Promise((resolve, reject) => {
            consumer.sendOffsetCommitRequest([{
                topic: message.topic,
                partition: message.partition, //default 0
                offset: message.offset + 1,
                metadata: 'm', //default 'm'
            }], (err, data) => {
                if (err) {
                    global.logger.write('conLog', "err:" + JSON.stringify(err), {}, {});
                    reject(err);
                } else {
                    global.logger.write('conLog', 'successfully offset ' + message.offset + ' is committed', {}, {});
                    resolve();
                }
            });
        });
    };

    function setkafkaMsgId(message) {
        return new Promise((resolve, reject) => {
            //Setting the processed KafkaMessageUniqueId in the Redis
            cacheWrapper.setKafkaMessageUniqueId(message.topic + '_' + message.partition, message.offset, (err, data) => {
                if (err === false) {
                    global.logger.write('conLog', 'Successfully set the Kafka message Unique Id in Redis', {}, {});
                    resolve();
                } else {
                    global.logger.write('conLog', 'Unable to set the Kafka message Unique Id in the Redis : ' + JSON.stringify(err), {}, {});
                    reject(err);
                }
            });
        });
    }

    function consumingMsg(message, kafkaMsgId, objCollection) {
        return new Promise(async (resolve, reject) => {
            global.logger.write('conLog', 'kafkaMsgId : ' + kafkaMsgId, {}, {});
            global.logger.write('conLog', 'Received message.offset : ' + message.offset, {}, {});

            //if(data < message.offset) { //I think this should be greater than to current offset                                
            // global.logger.write('debug', message.value, {}, JSON.parse(message.value)['payload']);
            logger.info(`${message.topic} ${message.key} | Kafka Consuming Message`, { type: 'kafka', ...message });

            try {
                var messageJson = JSON.parse(message.value);
                var serviceFile = messageJson.service;
                var serviceName = messageJson.service;
                var method = messageJson['method'];

                let asyncFlag = 0;
                //console.log('METHOD : ', method);
                let tempString = method.split('').reverse().join('');
                //console.log(tempString.substring(0,5));
                let isAsyncMethod = tempString.substring(0, 5);
                if (isAsyncMethod == 'cnysA') {
                    asyncFlag = 1;
                }

                if (!serviceObjectCollection.hasOwnProperty(messageJson['service'])) {
                    var jsFile = "../services/" + serviceFile;
                    var newClass;

                    global.logger.write('conLog', 'jsFile : ' + jsFile, {}, {});
                    try {
                        newClass = require(jsFile);
                    } catch (e) {
                        if (e.code === 'MODULE_NOT_FOUND') {
                            console.log('In Catch Block');
                            jsFile = "../vodafone/services/" + serviceFile;
                            newClass = require(jsFile);
                        }
                    }

                    var serviceObj = eval("new " + newClass + "(objCollection)");
                    global.logger.write('conLog', 'serviceObj : ', serviceObj, {}, {});
                    serviceObjectCollection[serviceFile] = serviceObj;

                    if (asyncFlag === 1) {
                        //Function with Async/Await
                        let [err, resp] = await serviceObj[method](messageJson['payload']);
                        resolve();
                    } else {
                        //Function with Callback
                        serviceObj[method](messageJson['payload'], function (err, data) {
                            if (err) {
                                global.logger.write('debug', err, {}, messageJson['payload']);
                                resolve();
                            } else {
                                global.logger.write('debug', data, {}, messageJson['payload']);

                                //Commit the offset
                                //commitingOffset(message).then(()=>{}).catch((err)=>{ console.log(err);});

                                //Store the read kafak message ID in the redis
                                //setkafkaMsgId(message).then(()=>{}).catch((err)=>{ console.log(err);});
                                resolve();
                            }
                        });
                    }
                } else {
                    console.log('In Consumer - In ELSE');
                    console.log('serviceName', serviceName);
                    console.log('Method : ', method);
                    if (asyncFlag === 1) {
                        //Function with Async/Await
                        let [err, resp] = await serviceObjectCollection[serviceName][method](messageJson['payload']);
                        resolve();
                    } else {
                        serviceObjectCollection[serviceName][method](messageJson['payload'], function (err, data) {
                            if (err) {
                                global.logger.write('debug', err, {}, messageJson['payload']);
                                resolve();
                            } else {
                                global.logger.write('debug', data, {}, messageJson['payload']);

                                //Commit the offset
                                //commitingOffset(message).then(()=>{}).catch((err)=>{ console.log(err);});

                                //Store the read kafak message ID in the redis
                                //setkafkaMsgId(message).then(()=>{}).catch((err)=>{ console.log(err);});
                                resolve();
                            }
                        });
                    }
                }

            } catch (exception) {
                console.log(exception);
                resolve();
            }
        });
    }

};
module.exports = { SetupAndStartConsumerGroup };
