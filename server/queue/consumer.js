/**
 * author Nani Kalyan V
 */

require('../utils/globalConfig');
require('../vodafone/utils/vodafoneConfig');
let Logger = require('../utils/logger.js');
var kafka = require('kafka-node');
var kafkaConsumer = kafka.Consumer;
var KafkaProducer = kafka.Producer;
var kafkaConsumerGroup = kafka.ConsumerGroup;
var Util = require('../utils/util');
var db = require("../utils/dbWrapper");
var redis = require('redis'); //using elasticache as redis
var CacheWrapper = require('../utils/cacheWrapper');
var QueueWrapper = require('./queueWrapper');
var AwsSns = require('../utils/snsWrapper');
var forEachAsync = require('forEachAsync').forEachAsync;
var ActivityCommonService = require("../services/activityCommonService");
var ActivityPushService = require("../services/activityPushService");
const pubnubWrapper = new(require('../utils/pubnubWrapper'))();

var Consumer = function () {

    var serviceObjectCollection = {};
    var util = new Util();
    var redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
    var cacheWrapper = new CacheWrapper(redisClient);
    var sns = new AwsSns();
    var activityCommonService = new ActivityCommonService(db, util, forEachAsync);
    var activityPushService = new ActivityPushService();

    var kfkClient =
        new kafka.KafkaClient({
            kafkaHost: global.config.BROKER_HOST,
            connectTimeout: global.config.BROKER_CONNECT_TIMEOUT,
            requestTimeout: global.config.BROKER_REQUEST_TIMEOUT,
            autoConnect: global.config.BROKER_AUTO_CONNECT,
            maxAsyncRequests: global.config.BROKER_MAX_ASYNC_REQUESTS
        });
    var kafkaProducer = new KafkaProducer(kfkClient);

    // /*
    var consumer =
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

        var queueWrapper = new QueueWrapper(kafkaProducer);
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

        consumer.on('connect', function (err, data) {
            global.logger.write('conLog', "Connected to Kafka Host", {}, {});
        });

        consumer.on('error', function (err) {
            global.logger.write('conLog', 'err => ' + JSON.stringify(err), {}, {});
        });

        consumer.on('offsetOutOfRange', function (err) {
            global.logger.write('conLog', 'offsetOutOfRange => ' + JSON.stringify(err), {}, {});
        });

        kafkaProducer.on('error', function (error) {
            global.logger.write('conLog', error, {}, {});
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
        return new Promise((resolve, reject) => {
            //cacheWrapper.getKafkaMessageUniqueId(message.topic + '_' + message.partition, function(err, data){
            //  if(err === false) {
            //console.log('data : ' + data);
            //console.log('kafkaMsgId : ' + kafkaMsgId);
            //console.log('Received message.offset : ' + message.offset);
            //global.logger.write('debug', 'data : ' + JSON.stringify(data), {}, {});
            global.logger.write('conLog', 'kafkaMsgId : ' + kafkaMsgId, {}, {});
            global.logger.write('conLog', 'Received message.offset : ' + message.offset, {}, {});

            //if(data < message.offset) { //I think this should be greater than to current offset                                
            global.logger.write('debug', message.value, {}, JSON.parse(message.value)['payload']);

            try {
                var messageJson = JSON.parse(message.value);
                var serviceFile = messageJson.service;
                var serviceName = messageJson.service;
                var method = messageJson['method'];

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
