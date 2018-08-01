/**
 * author Nani Kalyan V
 */

require('../utils/globalConfig');
var kafka = require('kafka-node');
var KafkaConsumer = kafka.Consumer;
var KafkaProducer = kafka.Producer;
var Util = require('../utils/util');
var db = require("../utils/dbWrapper");
var redis = require('redis');   //using elasticache as redis
var CacheWrapper = require('../utils/cacheWrapper');
var QueueWrapper = require('./queueWrapper');
var AwsSns = require('../utils/snsWrapper');
var forEachAsync = require('forEachAsync').forEachAsync;
var ActivityCommonService = require("../services/activityCommonService");
var ActivityPushService = require("../services/activityPushService");

var Consumer = function (partitionId) {

    var serviceObjectCollection = {};
    var util = new Util();
    var redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
    var cacheWrapper = new CacheWrapper(redisClient);
    var sns = new AwsSns();
    var activityCommonService = new ActivityCommonService(db, util, forEachAsync);
    var activityPushService = new ActivityPushService();
    
    const options = {
      groupId: 'test-node-group',
      autoCommit: true,      
      kafkaHost: '192.168.43.11:9092',
      sessionTimeout: 15000,
      protocol: ['roundrobin'],
      fromOffset: 'earliest'  
    };

    const client = new kafka.Client();
    const offset = new kafka.Offset(client);

    const ConsumerGroup = kafka.ConsumerGroup;
    const consumerGroup1 = new ConsumerGroup(options, [global.config.kafkaActivitiesTopic]);

    console.log(global.config.kafkaActivitiesTopic);

    var nani = new kafka.KafkaClient(global.config.kafkaIPOne,global.config.kafkaIPTwo,global.config.kafkaIPThree);
    var kafkaProducer = new KafkaProducer(nani);

    new Promise((resolve, reject) => {
        if (kafkaProducer.ready)
            return resolve();
        kafkaProducer.on('ready', resolve);
    }).then(() => {
        console.log('Kafka Producer ready!!');

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

        consumerGroup1.on('message', function (message) {
            console.log(`topic ${message.topic} partition ${message.partition} offset ${message.offset}`);
            consumerGroup1.sendOffsetCommitRequest([{
                                        topic: message.topic,
                                        partition: message.partition, //default 0
                                        offset: message.offset,
                                        metadata: 'm', //default 'm'
                                     }], (err, data) => {
                                     if(err) {
                                        console.log("err:" + err);
                                     }
                                     //console.log("data: " + JSON.stringify(data));
                                     console.log(message.value);

                                     try {
                                            var messageJson = JSON.parse(message.value);
                                            var serviceFile = messageJson.service;
                                            var serviceName = messageJson.service;
                                            var method = messageJson['method'];

                                            if (!serviceObjectCollection.hasOwnProperty(messageJson['service'])) {
                                                var jsFile = "../services/" + serviceFile;
                                                var newClass = require(jsFile);
                                                var serviceObj = eval("new " + newClass + "(objCollection)");
                                                serviceObjectCollection[serviceFile] = serviceObj;
                                                serviceObj[method](messageJson['payload'], function (err, data) {
                                                    console.log(data);
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                });
                                                //console.log(serviceObjectCollection);
                                            } else {
                                                serviceObjectCollection[serviceName][method](messageJson['payload'], function (err, data) {
                                                    console.log(data);
                                                    console.log(err);
                                                });                    
                                            }
                                        } catch (exception) {
                                            console.log(exception);
                                        }
                                     });
            
        });

        consumerGroup1.on('connect', function (err, data) {
            //console.log("running consumer partition number: " + partitionId);
            console.log("Connected to Kafka Host");
        });

        consumerGroup1.on('error', function (err) {
            console.log('err => ' + err);
        });

        consumerGroup1.on('offsetOutOfRange', function (err) {
            console.log('offsetOutOfRange => ' + JSON.stringify(err));
        });

        kafkaProducer.on('error', function (error) {
            console.log(error);
        });

    });
};
module.exports = Consumer;
