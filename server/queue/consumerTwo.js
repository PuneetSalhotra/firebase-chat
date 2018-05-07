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

var Consumer = function () {

    var serviceObjectCollection = {};
    var util = new Util();
    var redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
    var cacheWrapper = new CacheWrapper(redisClient);
    var sns = new AwsSns();
    var activityCommonService = new ActivityCommonService(db, util, forEachAsync);
    var activityPushService = new ActivityPushService();
    
    console.log('global.config.kafkaIPOne : ', global.config.kafkaIPTwo.kafkaHost);
    
    const options = {
      groupId: 'desker-activities-consumer-group',
      autoCommit: false,      
      kafkaHost: global.config.kafkaIPTwo.kafkaHost,
      sessionTimeout: 15000,
      protocol: ['roundrobin'],
      fromOffset: 'earliest'  
    };

    const client = new kafka.Client();
    const offset = new kafka.Offset(client);

    const ConsumerGroup = kafka.ConsumerGroup;
    const consumerGroup1 = new ConsumerGroup(options, [global.config.kafkaActivitiesTopic]);

    console.log(global.config.kafkaActivitiesTopic);

    var cli = new kafka.KafkaClient(global.config.kafkaIPOne,global.config.kafkaIPTwo,global.config.kafkaIPThree);
    var kafkaProducer = new KafkaProducer(cli);

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
            var kafkaMsgId = message.topic + '_' + message.partition + '_' + message.offset;
            console.log('kafkaMsgId : ' + kafkaMsgId);
            
            //Checking the kafkaMessage is already processed or not by looking into Redis
            cacheWrapper.getKafkaMessageUniqueId(message.partition, function(err, data){
                 if(err === false) {
                        if(data != kafkaMsgId) {
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
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log(data);
                                                
                                                //Commit the offset
                                                commitingOffset(message).then(()=>{}).catch((err)=>{ console.log(err);});
                                                //Store the read kafak message ID in the redis
                                                setkafkaMsgId(message, kafkaMsgId).then(()=>{}).catch((err)=>{ console.log(err);});
                                            }
                                            });                                             
                                    } else {
                                        serviceObjectCollection[serviceName][method](messageJson['payload'], function (err, data) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log(data);
                                                //Commit the offset
                                                commitingOffset(message).then(()=>{}).catch((err)=>{ console.log(err);});
                                                
                                                //Store the read kafak message ID in the redis
                                                setkafkaMsgId(message, kafkaMsgId).then(()=>{}).catch((err)=>{ console.log(err);});
                                            }
                                        });                    
                                    }
                                        
                                    } catch (exception) {
                                            console.log(exception);
                                        }            
                        } else {
                            console.log('Message Already Read!');
                        }
                        } else {
                            console.log('Error in checking kafkaMessageUniqueID : ' + err);
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
    
    function commitingOffset(message) {
        return new Promise((resolve, reject)=>{
            consumerGroup1.sendOffsetCommitRequest([{
                                topic: message.topic,
                                partition: message.partition, //default 0
                                offset: message.offset + 1,
                                metadata: 'm', //default 'm'
                                }], (err, data) => {
                                     if(err) {
                                        console.log("err:" + err);
                                        reject(err);
                                     } else {
                                        console.log('successfully offset '+ message.offset +' is committed');
                                        resolve();
                                     }  
                                });
        });
    };
    
    function setkafkaMsgId(message, kafkaMsgId) {
        return new Promise((resolve, reject)=>{            
            //Setting the processed KafkaMessageUniqueId in the Redis
            cacheWrapper.setKafkaMessageUniqueId(message.partition, kafkaMsgId, (err, data)=>{
                if(err === false) {
                    console.log('Successfully set the Kafka message Unique Id in Redis');
                    resolve();
                } else {
                    console.log('Unable to set the Kafka message Unique Id in the Redis : ' + err);
                    reject(err);
                }
            });
        });
    }
};
module.exports = Consumer;
