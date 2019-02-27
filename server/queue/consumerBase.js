/**
 * author: SBK
 */
const globalConfig = require('../utils/globalConfig');
let Logger = require('../utils/logger.js');
const kafka = require('kafka-node');
var QueueWrapper = require('./queueWrapper');
const db = require("../utils/dbWrapper");
const util = new (require('../utils/util'))();
const redis = require('redis');   //using elasticache as redis
const AwsSns = require('../utils/snsWrapper');
const _ = require('lodash');

const KafkaConsumer = kafka.Consumer;
const KafkaConsumerGroup = kafka.ConsumerGroup;
var KafkaProducer = kafka.Producer;
const kafkaClient =
        new kafka.KafkaClient({
            kafkaHost: global.config.BROKER_HOST,
            connectTimeout: global.config.BROKER_CONNECT_TIMEOUT,
            requestTimeout: global.config.BROKER_REQUEST_TIMEOUT,
            autoConnect: global.config.BROKER_AUTO_CONNECT,
            maxAsyncRequests: global.config.BROKER_MAX_ASYNC_REQUESTS
        });
const redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
const cacheWrapper = new (require('../utils/cacheWrapper'))(redisClient);
const sns = new AwsSns(); 
const pubnubWrapper = new (require('../utils/pubnubWrapper'))(); //BETA

var kafkaProducer = new KafkaProducer(kafkaClient);
var queueWrapper = new QueueWrapper(kafkaProducer);
global.logger = new Logger(queueWrapper);

class ConsumerBase {
    constructor(opts) {
        this.partition = opts.partition || 0;
        this.topic = opts.topic;
        
        // /*
        this.kafkaConsumer 
                = new KafkaConsumer(
                    kafkaClient,
                    [{
                            topic: this.topic, 
                            partition: this.partition
                    }],{
                        groupId: global.config.WIDGET_CONSUMER_GROUP_ID,
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
        // this.consumerGroup = new KafkaConsumerGroup(optionsConsumerGroup, this.topic);

        this.objCollection = _.merge(opts.objCollection || {}, {
            util,
            db,
            cacheWrapper,
            sns,
            pubnubWrapper
        });
        
        // /*
        this.kafkaConsumer.on('connect', this.onConnect.bind(this));
        this.kafkaConsumer.on('message', this.processMessage.bind(this));
        this.kafkaConsumer.on('error', this.onError.bind(this));
        this.kafkaConsumer.on('offsetOutOfRange', this.onOffsetOutOfRange.bind(this));
        // */

       /*
       this.consumerGroup.on('connect', this.onConnect.bind(this));
       this.consumerGroup.on('message', this.processMessage.bind(this));
       this.consumerGroup.on('error', this.onError.bind(this));
       this.consumerGroup.on('offsetOutOfRange', this.onOffsetOutOfRange.bind(this));
       */
    }

    onConnect(err, data) {
        console.log('global.config.BROKER_HOST : ', global.config.BROKER_HOST, err, data);
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
