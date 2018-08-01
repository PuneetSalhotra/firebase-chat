/**
 * author: V Nani Kalyan
 */
const globalConfig = require('../utils/globalConfig');
const kafka = require('kafka-node');
const db = require("../utils/dbWrapper");
const util = new (require('../utils/util'))();
const redis = require('redis');   //using elasticache as redis
const AwsSns = require('../utils/snsWrapper');
const _ = require('lodash');

const KafkaConsumer = kafka.Consumer;
//const kafkaClient = new kafka.Client(global.config.kafkaIP);
const kafkaClient = new kafka.KafkaClient(global.config.kafkaIPOne,global.config.kafkaIPTwo,global.config.kafkaIPThree);
const redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
const cacheWrapper = new (require('../utils/cacheWrapper'))(redisClient);
const sns = new AwsSns(); 
const pubnubWrapper = new (require('../utils/pubnubWrapper'))(); //BETA

var kafkaProducer;

const ConsumerGroup = kafka.ConsumerGroup;
const consumerGroup1 = new ConsumerGroup(options, [global.config.kafkaActivitiesTopic]);

class ConsumerBaseOne {
    constructor(opts) {
        this.topic = opts.topic;
        
        console.log('Nani kalyan');
        
        this.offset = new kafka.Offset(new kafka.Client());
        this.consumerGroup1 = new ConsumerGroup(opts, [opts.topic]);
        
        kafkaProducer = new KafkaProducer(kafkaClient);
        
        new Promise((resolve, reject) => {
        if (kafkaProducer.ready)
            return resolve();
        kafkaProducer.on('ready', resolve);
        }).then(() => {
            this.objCollection = _.merge(opts.objCollection || {}, {
                util,
                db,
                cacheWrapper,
                sns,
                pubnubWrapper
            });
        
            this.consumerGroup1.on('connect', this.onConnect.bind(this));
            this.consumerGroup1.on('message', this.processMessage.bind(this));
            this.consumerGroup1.on('error', this.onError.bind(this));
            this.consumerGroup1.on('offsetOutOfRange', this.onOffsetOutOfRange.bind(this));
            this.kafkaProducer.on('error', this.onkafkaProducerError.bind(this));
        });
        
        
    }

    onConnect(err, data) {        
        console.log('global.config.kafkaIPOne : ', global.config.kafkaIPOne.kafkaHost, err, data);
        console.log("running consumer partition number: ", this.partition);
    }

    onError(err) {
        console.log('err => ', err);
    }

    onOffsetOutOfRange(err) {
        console.log('offsetOutOfRange => ', JSON.stringify(err));
    }
    
    onkafkaProducerError(err){
        console.log('err => ', err);
    }

    processMessage(message) {
        console.log(`topic ${message.topic} partition ${message.partition} offset ${message.offset}`);
        return this.parseMessage(message)
        .then((parsedMessage) => this.validateMessage(parsedMessage))
        .then((validatedMessage) => this.actOnMessage(validatedMessage))
        .catch((err) => console.log("Error processing message:", err));
    }

    parseMessage(message) {
        return Promise.resolve(JSON.parse(message.value));
    }

    validateMessage(message) {
        return Promise.resolve(message);
    }

    actOnMessage(message) {
        return Promise.resolve(message);
    }
}
module.exports = ConsumerBaseOne;
