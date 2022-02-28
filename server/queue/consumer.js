/**
 * author Nani Kalyan V
 */
const tracer = require('dd-trace').init({
    service: `${process.env.NODE_ENV}_desker_api`,
    env: process.env.NODE_ENV,
    logInjection: true
});
const tracerScope = tracer.scope();
const tracerFormats = require('dd-trace/ext/formats')

require('../utils/globalConfigV1');
require('../vodafone/utils/vodafoneConfig');
let Logger = require('../utils/logger.js');
let kafka = require('kafka-node');
let kafkaConsumer = kafka.Consumer;
let KafkaProducer = kafka.Producer;
let kafkaConsumerGroup = kafka.ConsumerGroup;
let Util = require('../utils/util');
let db = require("../utils/dbWrapper");
let redis = require('redis'); //using elasticache as redis
let CacheWrapper = require('../utils/cacheWrapper');
let QueueWrapper = require('./queueWrapper');
let AwsSns = require('../utils/snsWrapper');
let forEachAsync = require('forEachAsync').forEachAsync;
let ActivityCommonService = require("../services/activityCommonService");
let ActivityPushService = require("../services/activityPushService");
const pubnubWrapper = new(require('../utils/pubnubWrapper'))();
const logger = require('../logger/winstonLogger');

let Consumer = function () {

    let serviceObjectCollection = {};
    let redisClient;
    if(global.mode === 'local') {
        redisClient = redis.createClient(global.config.redisConfig);
    } else {
        redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
    }
    
    let cacheWrapper = new CacheWrapper(redisClient);
    let util = new Util({
        cacheWrapper
    });
    let sns = new AwsSns();
    let activityCommonService = new ActivityCommonService(db, util, forEachAsync);
    let activityPushService = new ActivityPushService({
        cacheWrapper,
    });

    let kfkClient =
        new kafka.KafkaClient({
            kafkaHost: global.config.BROKER_HOST,
            connectTimeout: global.config.BROKER_CONNECT_TIMEOUT,
            requestTimeout: global.config.BROKER_REQUEST_TIMEOUT,
            autoConnect: global.config.BROKER_AUTO_CONNECT,
            maxAsyncRequests: global.config.BROKER_MAX_ASYNC_REQUESTS
        });
    let kafkaProducer = new KafkaProducer(kfkClient);

    // /*
    let consumer =
        new kafkaConsumer(
            kfkClient,
            [{
                topic: global.config.TOPIC_NAME,
                partition: parseInt(process.env.partition)
                //partition: parseInt(0)
            }], {
                groupId: global.config.CONSUMER_GROUP_ID,
                autoCommit: global.config.CONSUMER_AUTO_COMMIT,
                autoCommitIntervalMs: global.config.CONSUMER_AUTO_COMMIT_INTERVAL,
                fetchMaxWaitMs: global.config.CONSUMER_FETCH_MAX_WAIT,
                fetchMinBytes: global.config.CONSUMER_FETCH_MIN_BYTES,
                fetchMaxBytes: global.config.CONSUMER_FETCH_MAX_BYTES,
                //fromOffset: false,
                encoding: global.config.CONSUMER_ENCODING,
                keyEncoding: global.config.CONSUMER_KEY_ENCODING
            }
        );
    // */

    let optionsConsumerGroup = 
    {
        // Connect directly to kafka broker (instantiates a KafkaClient)
        kafkaHost: global.config.BROKER_HOST, 
        
        // Put client batch settings if you need them
        batch: global.config.CONSUMER_GROUP_BATCH, 
        
        // Optional (defaults to false) or tls options hash
        ssl: global.config.CONSUMER_GROUP_SSL, 
        
        // Consumer group name
        groupId: global.config.CONSUMER_GROUP_ID,
        
        // Consumer group session timeout
        sessionTimeout: global.config.CONSUMER_GROUP_SESSION_TIMEOUT,

        // An array of partition assignment protocols ordered by preference.
        // 'roundrobin' or 'range' string for built ins (see below to pass in custom assignment protocol)
        protocol: global.config.CONSUMER_GROUP_PARTITION_ASSIGNMENT_PROTOCOL,

        // default is utf8, use 'buffer' for binary data
        encoding: global.config.CONSUMER_ENCODING, 
        
        // Offsets to use for new groups other options could be 'earliest' or 'none' (none will emit an error if no offsets were saved)
        // equivalent to Java client's auto.offset.reset
        // default
        fromOffset: global.config.CONSUMER_GROUP_FROM_OFFSET, 
        
        // on the very first time this consumer group subscribes to a topic, record the offset returned in fromOffset (latest/earliest)
        commitOffsetsOnFirstJoin: global.config.CONSUMER_GROUP_COMMIT_OFFSET_ONFIRSTJOIN, 

        // how to recover from OutOfRangeOffset error (where save offset is past server retention) accepts same value as fromOffset
        // default
        outOfRangeOffset: global.config.CONSUMER_GROUP_OUTOFRANGE_OFFSET, 

        // for details please see Migration section below
        migrateHLC: global.config.CONSUMER_GROUP_MIGRATE_HLC,    
        migrateRolling: global.config.CONSUMER_GROUP_MIGRATE_ROLLING,

        // Callback to allow consumers with autoCommit false a chance to commit before a rebalance finishes
        // isAlreadyMember will be false on the first connection, and true on rebalances triggered after that
        onRebalance: (isAlreadyMember, callback) => { callback(); } // or null
    };
        
    // for a single topic pass in a string
    // var consumerGroup = new kafkaConsumerGroup(optionsConsumerGroup, global.config.TOPIC_NAME);

    new Promise((resolve, reject) => {
        if (kafkaProducer.ready)
            return resolve();
        kafkaProducer.on('ready', resolve);
    }).then(() => {       

        let queueWrapper = new QueueWrapper(kafkaProducer, cacheWrapper);
        global.logger = new Logger(queueWrapper);
        
        //global.logger.write('conLog', 'global.config.BROKER_HOST : ' + global.config.BROKER_HOST, {}, {});
        util.logInfo({},`conLog global.config.BROKER_HOST %j`,{global_config_BROKER_HOST : global.config.BROKER_HOST});
        //global.logger.write('conLog', global.config.TOPIC_NAME, {}, {});
        util.logInfo({},`conLog global.config.TOPIC_NAME %j`,{global_config_TOPIC_NAME : global.config.TOPIC_NAME});
        //global.logger.write('conLog', 'Kafka Producer ready!!', {}, {});
        util.logInfo({},`conLog Kafka Producer ready!!`,{});
        
        let objCollection = {
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

            try {

                //global.logger.write('conLog', `topic ${message.topic} partition ${message.partition} offset ${message.offset}`, {}, {});
                util.logInfo({},`consumer.on message conLog `,{topic : message.topic, partition : message.partition, offset : message.offset});
                let kafkaMsgId = message.topic + '_' + message.partition + '_' + message.offset;
                //global.logger.write('conLog', 'kafkaMsgId : ' + kafkaMsgId, {}, {});
                util.logInfo({},`consumer.on message conLog `,{kafkaMsgId : kafkaMsgId});
                //global.logger.write('conLog', 'getting this key from Redis : ' + message.topic + '_' + message.partition, {}, {});
                util.logInfo({},`consumer.on message conLog getting this key from Redis`,{topic : message.topic, partition : message.partition});

                let messageJson = JSON.parse(message.value || '{}');

                if (!messageJson.hasOwnProperty("payload")) {
                    return;
                }

                let request = messageJson['payload'];
                request.partition = message.partition;
                request.offset = message.offset;

                // [START] Tracer Span Extract-Inject Logic
                // Get the Span Context sent by the Kafka producer
                let logTraceHeaders = {};
                try {
                    logTraceHeaders = messageJson['log_trace_headers'];
                    logger.silly('trace headers received at kafka consumer: %j', logTraceHeaders, {type: 'trace_span'});
                } catch (error) {
                    logger.silly('[ERROR] trace headers received at kafka consumer: %j', logTraceHeaders, {type: 'trace_span'});
                }
                // Parent span, in this case is the span in which the Kafka producer sent the 
                // message to the Kafka consumer here...
                const kafkaProduceEventSpan = tracer.extract(tracerFormats.LOG, logTraceHeaders)
                const span = tracer.startSpan('kafka_consumer', {
                    childOf: kafkaProduceEventSpan
                })

                tracerScope.activate(span, () => {

                    activityCommonService.checkingPartitionOffset(request, (err, data) => {
                        //global.logger.write('conLog', 'err from checkingPartitionOffset : ' + err, {}, request);
                        util.logError(request,`checkingPartitionOffset err from checkingPartitionOffset Error %j`, { err,request });
                        if (err === false) {
                            //global.logger.write('conLog', 'Consuming the message', {}, request);
                            util.logInfo(request,`checkingPartitionOffset Consuming the message %j`,{request});
                            activityCommonService.partitionOffsetInsert(request, (err, data) => {});                        
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
                            //global.logger.write('conLog', 'Before calling this duplicateMsgUniqueIdInsert', {}, request);
                            util.logInfo(request,`checkingPartitionOffset Before calling this duplicateMsgUniqueIdInsert %j`,{request});
                            activityCommonService.duplicateMsgUniqueIdInsert(request, (err, data) => { });
                        }
                    });
                    
                });
                // [END] Tracer Span Extract-Inject Logic

                // Backup
                // activityCommonService.checkingPartitionOffset(request, (err, data) => {
                //     global.logger.write('conLog', 'err from checkingPartitionOffset : ' + err, {}, request);
                //     if (err === false) {
                //         global.logger.write('conLog', 'Consuming the message', {}, request);
                //         activityCommonService.partitionOffsetInsert(request, (err, data) => {});
                //         consumingMsg(message, kafkaMsgId, objCollection).then(() => {                        
                //             if(Number(request.pubnub_push) === 1) {
                //                 pubnubWrapper.publish(kafkaMsgId, {"status": 200});
                //             }
                //         }).catch((err)=>{
                //             if(Number(request.pubnub_push) === 1) {
                //                 pubnubWrapper.publish(kafkaMsgId, {"status": err});
                //             }
                //         });
                        
                //     } else {
                //         global.logger.write('conLog', 'Before calling this duplicateMsgUniqueIdInsert', {}, request);
                //         activityCommonService.duplicateMsgUniqueIdInsert(request, (err, data) => {});
                //     }
                // });
            } catch(e) {
                logger.info("Consumer Error ", {error :  e, stack : e.stack});
                activityCommonService.insertConsumerError({
                    consumer_message : JSON.stringify(message),
                    consumer_error   : JSON.stringify({ error : e, e_stack : e.stack})
                })
            }
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
        // */
/*        
        consumerGroup.on('message', function (message) {

            global.logger.write('conLog', `topic ${message.topic} partition ${message.partition} offset ${message.offset}`, {}, {});
            var kafkaMsgId = message.topic + '_' + message.partition + '_' + message.offset;
            global.logger.write('conLog', 'kafkaMsgId : ' + kafkaMsgId, {}, {});
            global.logger.write('conLog', 'getting this key from Redis : ' + message.topic + '_' + message.partition, {}, {});

            var messageJson = JSON.parse(message.value);
            var request = messageJson['payload'];
            request.partition = message.partition;
            request.offset = message.offset;

            activityCommonService.checkingPartitionOffset(request, (err, data) => {
                global.logger.write('conLog', 'err from checkingPartitionOffset : ' + err, {}, request);
                if (err === false) {
                    global.logger.write('conLog', 'Consuming the message', {}, request);
                    activityCommonService.partitionOffsetInsert(request, (err, data) => {});
                    
                    consumingMsg(message, kafkaMsgId, objCollection).then(() => {                        
                        if(Number(request.pubnub_push) === 1) {
                            pubnubWrapper.publish(kafkaMsgId, {"status": 200});
                        }
                    }).catch((err)=>{
                        if(Number(request.pubnub_push) === 1) {
                            pubnubWrapper.publish(kafkaMsgId, {"status": err});
                        }
                    });
                    
                } else {
                    global.logger.write('conLog', 'Before calling this duplicateMsgUniqueIdInsert', {}, request);
                    activityCommonService.duplicateMsgUniqueIdInsert(request, (err, data) => {});
                }
            });
        });

        consumerGroup.on('connect', function (err, data) {
            global.logger.write('conLog', "Connected to Kafka Host", {}, {});
        });

        consumerGroup.on('error', function (err) {
            global.logger.write('conLog', 'err => ' + JSON.stringify(err), {}, {});
        });

        consumerGroup.on('offsetOutOfRange', function (err) {
            global.logger.write('conLog', 'offsetOutOfRange => ' + JSON.stringify(err), {}, {});
        });

        kafkaProducer.on('error', function (error) {
            global.logger.write('conLog', error, {}, {});
        });
*/
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
                    //global.logger.write('conLog', "err:" + JSON.stringify(err), {}, {});
                    util.logError({},`sendOffsetCommitRequest  Error %j`, { err: JSON.stringify(err)});
                    reject(err);
                } else {
                    //global.logger.write('conLog', 'successfully offset ' + message.offset + ' is committed', {}, {});
                    util.logInfo({},`sendOffsetCommitRequest successfully offset is committed %j`,{message_offset : message.offset});
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
                    //global.logger.write('conLog', 'Successfully set the Kafka message Unique Id in Redis', {}, {});
                    util.logInfo({},`setKafkaMessageUniqueId Successfully set the Kafka message Unique Id in Redis`,{});
                    resolve();
                } else {
                    //global.logger.write('conLog', 'Unable to set the Kafka message Unique Id in the Redis : ' + JSON.stringify(err), {}, {});
                    util.logError({},`setKafkaMessageUniqueId Unable to set the Kafka message Unique Id in the Redis %j`, { err : JSON.stringify(err)});
                    reject(err);
                }
            });
        });
    }

    function consumingMsg(message, kafkaMsgId, objCollection) {
        return new Promise(async (resolve, reject) => {
            //cacheWrapper.getKafkaMessageUniqueId(message.topic + '_' + message.partition, function(err, data){
            //  if(err === false) {
            //console.log('data : ' + data);
            //console.log('kafkaMsgId : ' + kafkaMsgId);
            //console.log('Received message.offset : ' + message.offset);
            //global.logger.write('debug', 'data : ' + JSON.stringify(data), {}, {});
            //global.logger.write('conLog', 'kafkaMsgId : ' + kafkaMsgId, {}, {});
            util.logInfo({},`consumingMsg kafkaMsgId %j`,{kafkaMsgId : kafkaMsgId});
            //global.logger.write('conLog', 'Received message.offset : ' + message.offset, {}, {});
            util.logInfo({},`consumingMsg Received message.offset %j`,{message_offset : message.offset});

            //if(data < message.offset) { //I think this should be greater than to current offset                                
            // global.logger.write('debug', message.value, {}, JSON.parse(message.value)['payload']);
            logger.info(`${message.topic} ${message.key} | Kafka Consuming Message`, { type: 'kafka', ...message });

            try {
                //set current UTC datetime into redis cache.
                logger.info(`${message.topic} ${message.key} | Setting last_consumed_datetime in cache`, { type: 'kafka', ...message });
                cacheWrapper.setLastConsumedDateTime(util.getCurrentUTCTime());

                let messageJson = JSON.parse(message.value);
                let serviceFile = messageJson.service;
                let serviceName = messageJson.service;
                let method = messageJson['method'];

                let asyncFlag = 0;
                //console.log('METHOD : ', method);
                let tempString = method.split('').reverse().join('');
                //console.log(tempString.substring(0,5));
                let isAsyncMethod = tempString.substring(0,5);
                if(isAsyncMethod == 'cnysA') {
                    asyncFlag = 1;
                }

                if (!serviceObjectCollection.hasOwnProperty(messageJson['service'])) {
                    let jsFile = "../services/" + serviceFile;
                    let newClass;

                    //global.logger.write('conLog', 'jsFile : ' + jsFile, {}, {});
                    util.logInfo({},`consumingMsg jsFile %j`,{jsFile : jsFile});
                    try {
                        newClass = require(jsFile);
                    } catch (e) {
                        if (e.code === 'MODULE_NOT_FOUND') {
                            console.log('In Catch Block');
                            jsFile = "../vodafone/services/" + serviceFile;
                            newClass = require(jsFile);
                        }
                    }

                    let serviceObj = eval("new " + newClass + "(objCollection)");
                    //global.logger.write('conLog', 'serviceObj : ', serviceObj, {}, {});
                    util.logInfo({},`consumingMsg serviceObj %j`,{serviceObj : serviceObj});
                    serviceObjectCollection[serviceFile] = serviceObj;

                    if(asyncFlag === 1) {
                        //Function with Async/Await
                        let [err, resp] = await serviceObj[method](messageJson['payload']);
                            resolve();
                    } else {
                        //Function with Callback
                        serviceObj[method](messageJson['payload'], function (err, data) {
                            if (err) {
                                //global.logger.write('debug', err, {}, messageJson['payload']);
                                util.logError({},`consumingMsg debug Error %j`, {payload : messageJson['payload'], err : err});
                                resolve();
                            } else {
                                //global.logger.write('debug', data, {}, messageJson['payload']);
                                util.logInfo({},`consumingMsg debug data %j`,{payload : messageJson['payload'], data });
    
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
                    if(asyncFlag === 1) {
                        //Function with Async/Await
                        let [err, resp] = await serviceObjectCollection[serviceName][method](messageJson['payload']);
                            resolve();
                    } else {
                        serviceObjectCollection[serviceName][method](messageJson['payload'], function (err, data) {
                            if (err) {
                                //global.logger.write('debug', err, {}, messageJson['payload']);
                                util.logError({},`consumingMsg debug Error %j`, {payload : messageJson['payload'], err : err});
                                resolve();
                            } else {
                                //global.logger.write('debug', data, {}, messageJson['payload']);
                                util.logInfo({},`consumingMsg debug data %j`,{payload : messageJson['payload'], data });
    
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
            /* } else {                            
                 global.logger.write('debug', 'Message Already Read!', {}, {});
                 resolve();
             }
            /* } else {                            
                 global.logger.write('debug', 'Error in checking kafkaMessageUniqueID : ' + JSON.stringify(err), {}, {});
                 resolve();
             }*/
            // });                
        });
    }

};
module.exports = Consumer;
