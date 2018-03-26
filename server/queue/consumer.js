/**
 * author Sri Sai Venkatesh.
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
    var kafkaClient = new kafka.Client(global.config.kafkaIP);
    var kafkaConsumer = new KafkaConsumer(
            kafkaClient,
            [
                {topic: global.config.kafkaActivitiesTopic, partition: partitionId}
            ],
            {
                groupId: 'test-node-group',
                autoCommit: true,
                fromOffset: false
            });
    var kafkaProducer = new KafkaProducer(kafkaClient);
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
            //cassandraWrapper: cassandraWrapper,
            cacheWrapper: cacheWrapper,
            activityCommonService: activityCommonService,
            sns: sns,
            forEachAsync: forEachAsync,
            queueWrapper: queueWrapper,
            activityPushService: activityPushService
        };
        kafkaConsumer.on('message', function (message) {
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

        kafkaConsumer.on('connect', function (err, data) {
            console.log("running consumer partition number: " + partitionId);
        });

        kafkaConsumer.on('error', function (err) {
            console.log('err => ' + err);
        });

        kafkaConsumer.on('offsetOutOfRange', function (err) {
            console.log('offsetOutOfRange => ' + JSON.stringify(err));
        });

        kafkaProducer.on('error', function (error) {
            console.log(error);
        });

    });
};
module.exports = Consumer;
