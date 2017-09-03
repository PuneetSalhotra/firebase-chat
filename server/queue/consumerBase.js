/**
 * author: SBK
 */
const globalConfig = require('../utils/globalConfig');
const kafka = require('kafka-node');
const db = require("../utils/dbWrapper");
const util = new (require('../utils/util'))();
const redis = require('redis');   //using elasticache as redis
const AwsSns = require('../utils/snsWrapper');
const _ = require('lodash');

const KafkaConsumer = kafka.Consumer;
const kafkaClient = new kafka.Client(global.config.kafkaIP);
const redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
const cacheWrapper = new (require('../utils/cacheWrapper'))(redisClient);
const sns = new AwsSns(); 

class ConsumerBase {
    constructor(opts) {
        this.partition = opts.partition || 0;
        this.kafkaConsumer = new KafkaConsumer(kafkaClient,
            [{topic: global.config.kafkaTopic, partition: this.partition}],
            {
                groupId: 'test-node-group',
                autoCommit: true,
                fromOffset: false
            }
        );

        this.objCollection = _.merge(opts.objCollection || {}, {
            util,
            db,
            cacheWrapper,
            sns
        });
        this.kafkaConsumer.on('connect', this.onConnect.bind(this));
        this.kafkaConsumer.on('message', this.processMessage.bind(this));
        this.kafkaConsumer.on('error', this.onError.bind(this));
        this.kafkaConsumer.on('offsetOutOfRange', this.onOffsetOutOfRange.bind(this));
    }

    onConnect(err, data) {
        console.log("running consumer partition number: ", this.partition);
    }

    onError(err) {
        console.log('err => ', err);
    }

    onOffsetOutOfRange(err) {
        console.log('offsetOutOfRange => ', JSON.stringify(err));
    }

    processMessage(message) {
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
module.exports = ConsumerBase;