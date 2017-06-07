/**
 * author Sri Sai Venkatesh.
 */
console.log("running consumer partition number: " + process.argv[2]);

var globalConfig = require('../utils/globalConfig');
var kafka = require('kafka-node'),
        KafkaConsumer = kafka.Consumer,
        kafkaClient = new kafka.Client(global.config.kafkaIP),
        kafkaConsumer = new KafkaConsumer(
                kafkaClient,
                [
                    {topic: 'desker-activities', partition: Number(process.argv[2])}
                ],
                {
                    groupId: 'consumerOne',
                    autoCommit: true,
                    fromOffset: false
                });

var serviceObjectCollection = {};
var Util = require('../utils/util');
var db = require("../utils/dbWrapper");
var util = new Util();
var redis = require('redis');   //using elasticache as redis
var redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
var CacheWrapper = require('../utils/cacheWrapper');
var cacheWrapper = new CacheWrapper(redisClient);

var ActivityCommonService = require("../services/activityCommonService");
var activityCommonService = new ActivityCommonService(db, util);

var objCollection = {    
    util: util,
    db: db,
    //cassandraWrapper: cassandraWrapper,
    cacheWrapper: cacheWrapper,
    activityCommonService: activityCommonService
};
kafkaConsumer.on('message', function (message) {

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

});

kafkaConsumer.on('error', function (err) {
    console.log('err => ' + err);
});

kafkaConsumer.on('offsetOutOfRange', function (err) {
    console.log('offsetOutOfRange => ' + JSON.stringify(err));
});

