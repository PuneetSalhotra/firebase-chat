/**
 * author Nani Kalyan V
 */

require('../utils/globalConfig');
var kafka = require('kafka-node');
var kafkaConsumer = kafka.Consumer;
var KafkaProducer = kafka.Producer;
var Util = require('../utils/util');
var db = require("../utils/dbWrapper");
var redis = require('redis'); //using elasticache as redis
var CacheWrapper = require('../utils/cacheWrapper');
var QueueWrapper = require('./queueWrapper');
var AwsSns = require('../utils/snsWrapper');
var forEachAsync = require('forEachAsync').forEachAsync;
var ActivityCommonService = require("../services/activityCommonService");
var ActivityPushService = require("../services/activityPushService");

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

    var consumer =
        new kafkaConsumer(
            kfkClient,
            [{
                topic: global.config.TOPIC_NAME,
                //partition: parseInt(process.env.partition)
                partition: parseInt(1)
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

    global.logger.write('debug', 'global.config.BROKER_HOST : ' + global.config.BROKER_HOST, {}, {});
    global.logger.write('debug', global.config.TOPIC_NAME, {}, {});

    new Promise((resolve, reject) => {
        if (kafkaProducer.ready)
            return resolve();
        kafkaProducer.on('ready', resolve);
    }).then(() => {
        global.logger.write('debug', 'Kafka Producer ready!!', {}, {});

        var queueWrapper = new QueueWrapper(kafkaProducer);
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

        consumer.on('message', function (message) {

            global.logger.write('debug', `topic ${message.topic} partition ${message.partition} offset ${message.offset}`, {}, {});
            var kafkaMsgId = message.topic + '_' + message.partition + '_' + message.offset;
            global.logger.write('debug', 'kafkaMsgId : ' + kafkaMsgId, {}, {});
            global.logger.write('debug', 'getting this key from Redis : ' + message.topic + '_' + message.partition, {}, {});

            var messageJson = JSON.parse(message.value);
            var request = messageJson['payload'];

            activityCommonService.checkingMSgUniqueId(request, (err, data) => {
                global.logger.write('debug', 'err from checkingMSgUniqueId : ' + err, {}, request);
                if (err === false) {
                    global.logger.write('debug', 'Consuming the message', {}, request);
                    activityCommonService.msgUniqueIdInsert(request, (err, data) => {});
                    consumingMsg(message, kafkaMsgId, objCollection).then(() => {});
                } else {
                    global.logger.write('debug', 'Before calling this duplicateMsgUniqueIdInsert', {}, request);
                    activityCommonService.duplicateMsgUniqueIdInsert(request, (err, data) => {});
                }
            });

        });

        consumer.on('connect', function (err, data) {
            global.logger.write('debug', "Connected to Kafka Host", {}, {});
        });

        consumer.on('error', function (err) {
            global.logger.write('debug', 'err => ' + JSON.stringify(err), {}, {});
        });

        consumer.on('offsetOutOfRange', function (err) {
            global.logger.write('debug', 'offsetOutOfRange => ' + JSON.stringify(err), {}, {});
        });

        kafkaProducer.on('error', function (error) {
            global.logger.write('debug', error, {}, {});
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
                    global.logger.write('debug', "err:" + JSON.stringify(err), {}, {});
                    reject(err);
                } else {
                    global.logger.write('debug', 'successfully offset ' + message.offset + ' is committed', {}, {});
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
                    global.logger.write('debug', 'Successfully set the Kafka message Unique Id in Redis', {}, {});
                    resolve();
                } else {
                    global.logger.write('debug', 'Unable to set the Kafka message Unique Id in the Redis : ' + JSON.stringify(err), {}, {});
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
            global.logger.write('debug', 'kafkaMsgId : ' + kafkaMsgId, {}, {});
            global.logger.write('debug', 'Received message.offset : ' + message.offset, {}, {});

            //if(data < message.offset) { //I think this should be greater than to current offset                                
            global.logger.write('debug', message.value, {}, {});

            try {
                var messageJson = JSON.parse(message.value);
                var serviceFile = messageJson.service;
                var serviceName = messageJson.service;
                var method = messageJson['method'];

                if (!serviceObjectCollection.hasOwnProperty(messageJson['service'])) {
                    var jsFile = "../services/" + serviceFile;
                    var newClass;

                    global.logger.write('debug', 'jsFile : ' + jsFile, {}, {});
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
                    global.logger.write('debug', 'serviceObj : ', serviceObj, {}, {});
                    serviceObjectCollection[serviceFile] = serviceObj;
                    serviceObj[method](messageJson['payload'], function (err, data) {
                        if (err) {
                            global.logger.write('debug', err, {}, {});
                            resolve();
                        } else {
                            global.logger.write('debug', data, {}, {});

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
                            global.logger.write('debug', err, {}, {});
                            resolve();
                        } else {
                            global.logger.write('debug', data, {}, {});

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
