/**
 * author Nani Kalyan V
 */

require('../utils/globalConfig');
let Logger = require('../utils/logger.js');
let kafka = require('kafka-node');
let kafkaConsumer = kafka.Consumer;
let KafkaProducer = kafka.Producer;
let Util = require('../utils/util');
let db = require("../utils/logDbWrapper");
let QueueWrapper = require('./queueWrapper');
let uuid = require('uuid');

let Consumer = function () {

    let util = new Util();

    let kfkClient =
        new kafka.KafkaClient({
            kafkaHost: global.config.BROKER_HOST,
            connectTimeout: global.config.BROKER_CONNECT_TIMEOUT,
            requestTimeout: global.config.BROKER_REQUEST_TIMEOUT,
            autoConnect: global.config.BROKER_AUTO_CONNECT,
            maxAsyncRequests: global.config.BROKER_MAX_ASYNC_REQUESTS
        });
    let kafkaProducer = new KafkaProducer(kfkClient);

    let consumer =
        new kafkaConsumer(
            kfkClient,
            [{
                topic: global.config.LOGS_TOPIC_NAME,
                partition: parseInt(process.env.partition)
                // partition: parseInt(0)
            }], {
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

    new Promise((resolve, reject) => {
        if (kafkaProducer.ready)
            return resolve();
        kafkaProducer.on('ready', resolve);
    }).then(() => {

        let queueWrapper = new QueueWrapper(kafkaProducer);
        global.logger = new Logger(queueWrapper);

        console.log('global.config.BROKER_HOST : ' + global.config.BROKER_HOST);
        console.log(global.config.LOGS_TOPIC_NAME);
        console.log('Kafka Producer ready!!');

        consumer.on('message', function (message) {

            let kafkaMsgId = message.topic + '_' + message.partition + '_' + message.offset;

            console.log(`topic ${message.topic} partition ${message.partition} offset ${message.offset}`);
            console.log('kafkaMsgId : ' + kafkaMsgId);
            console.log('getting this key from Redis : ' + message.topic + '_' + message.partition);

            let messageJson = JSON.parse(message.value);

            // console.log('messageJson : ', messageJson);            
            let request = messageJson.request;
            //request.partition = message.partition;
            //request.offset = message.offset;          

            insertIntoDB(request, messageJson).then(() => {});
        });

        consumer.on('connect', function (err, data) {
            console.log("Connected to Kafka Host");
        });

        consumer.on('error', function (err) {
            console.log('debug', 'err => ' + JSON.stringify(err), {}, {});
        });

        consumer.on('offsetOutOfRange', function (err) {
            console.log('debug', 'offsetOutOfRange => ' + JSON.stringify(err), {}, {});
        });

        kafkaProducer.on('error', function (error) {
            console.log('debug', error, {}, {});
        });

    });


    async function insertIntoDB(request, messageJson) {

        console.log("[insertIntoDB] messageJson: ", messageJson)

        let response = {};
        let responseCode = "";
        let dbCall = '{}';
        let dbResponse = '{}';

        if (messageJson.object !== null && Object.keys(messageJson.object).length > 0) {
            response = messageJson.object.response || {};
            responseCode = messageJson.object.status || "";
        }

        // For MySQL Query and Response
        if (String(messageJson.message).includes('CALL ')) {
            dbCall = messageJson.message;
            dbResponse = messageJson.object;
            // console.log("dbCall: ", dbCall);
            // console.log("dbResponse: ", dbResponse);
        }

        // For Redis Cache Query and Response
        if (messageJson.level === "cacheResponse") {
            dbCall = messageJson.message;
            dbResponse = messageJson.object || {};
            // console.log("dbCall: ", dbCall);
            // console.log("dbResponse: ", dbResponse);
        }

        // SOME CLEANING
        if ((typeof request === 'object')) {

            if (request.hasOwnProperty('activity_inline_data') && (typeof request.activity_inline_data === 'string')) {
                request.activity_inline_data = JSON.parse(request.activity_inline_data);
            }
        }

        let logMessage = messageJson.message || '{}';
        try {
            JSON.parse(logMessage);
        } catch (error) {
            // console.log("[insertIntoDB | logMessage] Error: ", error);
            logMessage = JSON.stringify({
                message: messageJson.message
            }) || '{}';
        }

        let paramsArr = new Array(
            uuid.v1(),
            request.bundle_transaction_id, //Bundle Transaction Id
            messageJson.levelId, // Level Id
            messageJson.level, //level Name
            request.url, //Service URL
            JSON.stringify(request), //request Data
            JSON.stringify(response), //Log Response Data
            JSON.stringify(dbCall),
            JSON.stringify(dbResponse),
            responseCode || '', //Log Response Code
            logMessage, //Log Message
            request.datetime_log || '',
            request.log_response_datetime || util.getCurrentUTCTime(),
            request.log_stack_trace_data || '{}',
            request.datetime_log || util.getCurrentUTCTime(),
            request.activity_id || 0,
            request.activity_title || "",
            request.asset_id || 0,
            request.asset_first_name || "",
            request.device_phone_country_code || 0,
            request.device_phone_number || 0,
            request.device_os_id || 0
        );

        // console.log("\n\n[insertIntoDB] paramsArr: ", paramsArr)

        let queryString = util.getQueryString('ds_p1_log_transaction_insert', paramsArr);
        if (queryString != '') {
            db.logExecuteQuery(0, queryString, request, function (err, data) {});
        }
    }

};
module.exports = Consumer;
