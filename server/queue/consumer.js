/**
 * author Sri Sai Venkatesh.
 */

require('../utils/globalConfig');
var kafka = require('kafka-node');
var KafkaConsumer = kafka.Consumer;


var Consumer = function (partitionId) {

    var kafkaClient = new kafka.Client(global.config.kafkaIP);
    var kafkaConsumer = new KafkaConsumer(
            kafkaClient,
            [
                {topic: global.config.kafkaTopic, partition: partitionId}
            ],
            {
                groupId: 'test-node-group',
                autoCommit: true,
                fromOffset: false
            });

    console.log("running consumer partition number: " + partitionId);

    var serviceObjectCollection = {};
    var Util = require('../utils/util');
    var db = require("../utils/dbWrapper");
    var util = new Util();
    var redis = require('redis');   //using elasticache as redis
    var redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
    var CacheWrapper = require('../utils/cacheWrapper');
    var cacheWrapper = new CacheWrapper(redisClient);
    var AwsSns = require('../utils/snsWrapper');
    var sns = new AwsSns();

    var ActivityCommonService = require("../services/activityCommonService");
    var activityCommonService = new ActivityCommonService(db, util);
    var forEachAsync = require('forEachAsync').forEachAsync;
    var objCollection = {
        util: util,
        db: db,
        //cassandraWrapper: cassandraWrapper,
        cacheWrapper: cacheWrapper,
        activityCommonService: activityCommonService,
        sns: sns,
        forEachAsync: forEachAsync
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

        //console.log(message);
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

};


module.exports = Consumer;