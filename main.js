/* 
 * author: V Nani Kalyan
 */
var globalConfig = require('./server/utils/globalConfig');

// This line must come before importing any instrumented module.
const tracer = require('dd-trace').init({
    service: `${process.env.mode}_desker_api`,
    env: process.env.mode,
    logInjection: true
});
const { serializeError } = require('serialize-error')
var vodafoneConfig = require('./server/vodafone/utils/vodafoneConfig');
var Logger = require('./server/utils/logger.js');
var express = require('express');
var app = express();
var server = require('http').createServer(app);//.listen(global.config.servicePort);

var cors = require('cors');
var corsOptions = {
    origin: function (origin, callback) {
        var originIsWhitelisted = global.config.whitelist.indexOf(origin) !== -1;
        callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
    }
};
app.use(cors());
var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '500kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500kb' }));

var Util = require('./server/utils/util');
var db = require("./server/utils/dbWrapper");
var ResponseWrapper = require('./server/utils/responseWrapper');
var EncTokenInterceptor = require('./server/interceptors/encTokenInterceptor');
var ControlInterceptor = require('./server/interceptors/controlInterceptor');

var kafka = require('kafka-node');
var KafkaProducer = kafka.Producer;
var KeyedMessage = kafka.KeyedMessage;

var redis = require('redis');   //using elasticache as redis
var redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
var CacheWrapper = require('./server/utils/cacheWrapper');
var cacheWrapper = new CacheWrapper(redisClient);
var QueueWrapper = require('./server/queue/queueWrapper');
var forEachAsync = require('forEachAsync').forEachAsync;
var ActivityCommonService = require("./server/services/activityCommonService");
redisClient.on('connect', function (response) {
    logger.info('Redis Client Connected', { type: 'redis', response });
    connectToKafkaBroker();
});

redisClient.on('error', function (error) {
    logger.error('Redis Error', { type: 'redis', error: serializeError(error) });
    // console.log(error);
});

// Handling null/empty message_unique_ids
// 
app.use(function (req, res, next) {
    // Check whether asset_message_counter exists:
    if (req.body.hasOwnProperty('asset_message_counter')) {
        // Then, check if a valid message_unique_id exists:
        if (!req.body.hasOwnProperty('message_unique_id') ||
            req.body.message_unique_id === undefined ||
            req.body.message_unique_id === null ||
            req.body.message_unique_id === '') {
            // Let the client know that they have goofed up.
            res.send({
                status: -3206,
                service_id: 0,
                gmt_time: (new Util()).getCurrentUTCTime(),
                response: 'Empty/No message_unique_id request parameter found.'
            });
            return;
        }
    }

    // Move on the next middleware
    next();
});

// Targetted logging:
// For every incoming request, check in Redis whether
// the asset_id is included in the targeted_logging_asset_ids set 
// for targetted logging or not.
app.use(function (req, res, next) {
    // Initialize. Default to false.
    req.body.isTargeted = false;
    req.isTargeted = false;

    // For requests which use asset_id for authentication
    if (req.body.hasOwnProperty('asset_id')) {
        cacheWrapper.IsAssetIDTargeted(req.body.asset_id, function (err, reply) {
            if (err) {
                // Ignore if there's an error
                next();
            } else if (reply == 1) {
                req.body.isTargeted = true;
                req.isTargeted = true;
            }
        });
    }

    // For requests which use auth_asset_id for authentication
    if (req.body.hasOwnProperty('auth_asset_id')) {
        cacheWrapper.IsAssetIDTargeted(req.body.auth_asset_id, function (err, reply) {
            if (err) {
                // Ignore if there's an error
                next();
            } else if (reply == 1) {
                req.body.isTargeted = true;
                req.isTargeted = true;
            }
        });
    }

    next();
});

// Basic HTTP logging using morgan
const logger = require('./server/logger/winstonLogger');
loggerstream = {
    write: function (message, encoding) {
        message = JSON.parse(message);
        logger.info(`${message.method} ${message.url}`, { type: 'http_log', ...message });
    }
};
app.use(require("morgan")('{"remote_addr": ":remote-addr", "remote_user": ":remote-user", "date": ":date[clf]", "method": ":method", "url": ":url", "http_version": ":http-version", "status": ":status", "result_length": ":res[content-length]", "referrer": ":referrer", "user_agent": ":user-agent", "response_time": ":response-time"}', { stream: loggerstream }));

function connectToKafkaBroker(){
    console.log("redis is connected");
    
    var kafkaClient = new kafka.KafkaClient({   
        kafkaHost: global.config.BROKER_HOST,
        connectTimeout: global.config.BROKER_CONNECT_TIMEOUT,
        requestTimeout: global.config.BROKER_REQUEST_TIMEOUT,
        autoConnect: global.config.BROKER_AUTO_CONNECT,
        maxAsyncRequests: global.config.BROKER_MAX_ASYNC_REQUESTS
    });
    
    let producerOptions = {
        requireAcks: global.config.PRODUCER_REQUIRE_ACKS,
        ackTimeoutMs: global.config.PRODUCER_ACKS_TIMEOUT,
        partitionerType: global.config.PRODUCER_PARTITONER_TYPE,
    }

    var kafkaProducer = new KafkaProducer(kafkaClient, producerOptions);
    
    //console.log('kafkaProducer : ' , kafkaProducer);
    
    new Promise((resolve, reject) => {
        if (kafkaProducer.ready)
            return resolve();
        kafkaProducer.on('ready', resolve);
    }).then(() => {  
             
        var queueWrapper = new QueueWrapper(kafkaProducer);
        //global.logger = new Logger();
        global.logger = new Logger(queueWrapper);
        
        global.logger.write('conLog', 'Kafka Producer is ready', {}, {});
        global.logger.write('conLog', 'BROKER_HOST : ' + global.config.BROKER_HOST, {}, {});

        var util = new Util({
            cacheWrapper
        });
        var responseWrapper = new ResponseWrapper(util);
        var activityCommonService = new ActivityCommonService(db, util, forEachAsync);      

        var objCollection = {
            app: app,
            util: util,
            db: db,
            responseWrapper: responseWrapper,
            cacheWrapper: cacheWrapper,
            queueWrapper: queueWrapper,
            activityCommonService: activityCommonService,
            forEachAsync: forEachAsync
        };
        new EncTokenInterceptor(app, cacheWrapper, responseWrapper, util);
        new ControlInterceptor(objCollection);
        server.listen(global.config.servicePort);        
        console.log('server running at port ' + global.config.servicePort);
    });

    kafkaProducer.on('error', function (error) {
        logger.error('Kafka Producer Error', { type: 'kafka', error: serializeError(error) });
        connectToKafkaBroker();        
    });
    
    kafkaProducer.on('brokersChanged', function (error) {
        logger.error('Kafka Producer brokersChanged', { type: 'kafka', error: serializeError(error) });
        // console.log('brokersChanged: ', error);
    });
    
};

process.on('uncaughtException', (error, origin) => {
    logger.error("Uncaught Exception", { type: 'uncaught_exception', origin, error: serializeError(error) });
});

process.on('error', (error) => {
    logger.error("Process Error", { type: 'process_error', error: serializeError(error) });
});

process.on('beforeExit', (code) => {
    logger.debug("Process beforeExit event with code: %j", code);
});

process.on('exit', (code) => {
    logger.debug("Process exit event with code: %j", code);
});

process.on('warning', (warning) => {
    logger.error("Process Warning", { type: 'process_warning', error: serializeError(warning) });
});

[`SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`, `SIGHUP`, `SIGUSR1`, `SIGUSR2`, `SIGABRT`, `SIGQUIT`].forEach((eventType) => {
    process.on(eventType, (signal) => {
        logger.debug("Process signalled: %j", signal);
    });
})

process.on('unhandledRejection', (reason, promise) => {
    logger.error("Unhandled Promise Rejection", { type: 'unhandled_rejection', promise_at: promise, error: serializeError(reason) });
});