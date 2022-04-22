/* 
 * author: V Nani Kalyan
 */
var globalConfig = require('./server/utils/globalConfigV1');
const tracer = require('dd-trace').init({
    service: `${process.env.NODE_ENV}_desker_api`,
    env: process.env.NODE_ENV,
    logInjection: true
});
const redis = require('redis');   //using elasticache as redis
const express = require('express');
let app = express();
const server = require('http').createServer(app);//.listen(global.config.servicePort);
const AWS_Cognito = require('aws-sdk');
// This line must come before importing any instrumented module.

const { serializeError } = require('serialize-error');
const cors = require('cors');
const bodyParser = require('body-parser');
const kafka = require('kafka-node');
const forEachAsync = require('forEachAsync').forEachAsync;
const helmet = require('helmet');
const logger = require('./server/logger/winstonLogger');

let redisClient;
//console.log('global.mode - ', global.mode);
if (global.mode === 'local') {
    redisClient = redis.createClient(global.config.redisConfig);
} else {
    redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
}

redisClient.config('set', 'notify-keyspace-events', 'KEA');

let isFirstTime = true;
let cognitoidentityserviceprovider = null;
redisClient.on('connect', async function (response) {
    logger.info('Redis Client Connected', { type: 'redis', response });

    if (isFirstTime) {
        isFirstTime = false;
        const config = await new Promise((resolve, reject) => {
            //To handle the first time reading case - Key will be missing then we are sending 0
            redisClient.get(global.config.globalConfigKey, (err, reply) => {
                if (err) {
                    reject(err);
                }
                if (reply === null) {
                    resolve(null);
                } else {
                    resolve(reply);

                }
            });

        });
        logger.info(`[globalConfigFetched]`);
        global.config = { ...global.config, ...JSON.parse(config) };

        handleImports();
    }
});

redisClient.on('error', function (error) {
    logger.error('Redis Error', { type: 'redis', error: serializeError(error) });
    // console.log(error);
});

//const io = require('socket.io')(server); //To use socket instead of Pubnub

/*io.on('connection', socket => {   
     //console.log('connection'); 
     /*socket.on('failedmessage', (channelID, message) => {
     
        console.log('######################')
            console.log('In failedmessage');
            console.log('######################')
        console.log(channelID);
        console.log(message);

        io.emit(channelID, message);
        console.log(`Emitted the message- ${message} to channel id - ${channelID}`);
    });
 });*/

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

/*[`SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`, `SIGHUP`, `SIGUSR1`, `SIGUSR2`, `SIGABRT`, `SIGQUIT`].forEach((eventType) => {
    process.on(eventType, (signal) => {
        logger.debug("Process signalled: %j", signal);
    });
})*/

process.on('unhandledRejection', (reason, promise) => {
    logger.error("Unhandled Promise Rejection", { type: 'unhandled_rejection', promise_at: promise, error: serializeError(reason) });
});

let cnt = 0;
async function listUsers(paginationToken = null) {
    let params = {
        UserPoolId: global.config.user_pool_id,
        Limit: 60
    };

    //console.log('paginationToken : ', paginationToken);
    if (paginationToken != null) {
        params = {
            UserPoolId: global.config.user_pool_id,
            Limit: 60,
            PaginationToken: paginationToken
        };
    }

    await new Promise((resolve, reject) => {
        cognitoidentityserviceprovider.listUsers(params, async (err, data) => {
            if (err) {
                console.log(err);
            } else {
                //console.log(data);
                let users = data.Users;
                //console.log(users[0])
                console.log(users.length, ' - ', cnt++);

                //console.log(users[0].Username);
                //console.log(users[0].Attributes[1].Value);

                for (const i of users) {
                    for (const j of i.Attributes) {
                        if (j.Name === 'phone_number') {
                            cacheWrapper.setUserNameFromAccessToken(i.Username, j.Value);
                            //cacheWrapper.delUserNameCognito(i.Username);
                            //map.set(i.Username, j.Value);
                        }
                    }
                }

                if (data.PaginationToken != "" && Number(users.length) === 60 && cnt < 30) {
                    await new Promise((resolve, reject) => {
                        setTimeout(() => {
                            resolve();
                        }, 2000);
                    });
                    await listUsers(data.PaginationToken);
                }

                resolve();
            }
        });
    });

}

async function handleImports() {
    AWS_Cognito.config.update({
        "accessKeyId": global.config.access_key_id,
        "secretAccessKey": global.config.secret_access_key,
        "region": global.config.cognito_region
    });
    cognitoidentityserviceprovider = new AWS_Cognito.CognitoIdentityServiceProvider();

    let corsOptions = {
        origin: function (origin, callback) {
            if (origin == undefined || global.config.whitelist.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log(global.config.whitelist.indexOf(origin) + ' == Rejected origin =>', origin);
                callback(null, true);
                // TODO: just to avoid the CORS origin
                //callback(new Error('Not allowed by CORS'))
            }
        }
    };
    app.use(cors(corsOptions));
    const vodafoneConfig = require('./server/vodafone/utils/vodafoneConfig');
    const Logger = require('./server/utils/logger.js');

    app.use(bodyParser.json({ limit: '500kb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '500kb' }));

    const Util = require('./server/utils/util');
    const db = require("./server/utils/dbWrapper");
    const pgdb = require("./server/utils/postgresDbWrapper");
    const ResponseWrapper = require('./server/utils/responseWrapper');
    const EncTokenInterceptor = require('./server/interceptors/encTokenInterceptor');
    const AccessTokenInterceptor = require('./server/interceptors/accessTokenInterceptor');
    const ControlInterceptor = require('./server/interceptors/controlInterceptor');

    const KafkaProducer = kafka.Producer;
    const KeyedMessage = kafka.KeyedMessage;

    const CacheWrapper = require('./server/utils/cacheWrapper');
    const cacheWrapper = new CacheWrapper(redisClient);
    const QueueWrapper = require('./server/queue/queueWrapper');
    const ActivityCommonService = require("./server/services/activityCommonService");

    let map = new Map();

    const {
        requestParamsValidator, requestMethodValidator, requestContentTypeValidator,
        setResponseContentType
    } = require('./server/utils/requestValidator');

    app.disable('x-powered-by')

    // Disallow non-POST requests
    app.use(requestMethodValidator)

    // Requests must contain Content-Type header
    app.use(requestContentTypeValidator)

    // Validate the request parameters:
    app.use(requestParamsValidator);

    // Enforce response Content-Type header
    app.use(setResponseContentType);


    // Sets "Strict-Transport-Security: max-age=5184000; includeSubDomains".
    const sixtyDaysInSeconds = 5184000
    app.use(helmet.hsts({ maxAge: sixtyDaysInSeconds }))
    app.use(helmet.frameguard({ action: 'sameorigin' }))
    app.use(helmet.noSniff())

    // Handling null/empty message_unique_ids
    app.use(function (req, res, next) {
        // Check whether asset_message_counter exists:
        if (req.body.hasOwnProperty('asset_message_counter')) {
            // Then, check if a valid message_unique_id exists:
            if (!req.body.hasOwnProperty('message_unique_id') ||
                req.body.message_unique_id === undefined ||
                req.body.message_unique_id === null ||
                req.body.message_unique_id === '') {
                // Let the client know that they have goofed up.
                res.json({
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

    loggerstream = {
        write: function (message, encoding) {
            try {
                message = JSON.parse(message);
            } catch (err) {
                console.log('Unable to parse the message');
            }

            logger.info(`${message.method} ${message.url}`, { type: 'http_log', ...message });
        }
    };
    app.use(require("morgan")('{"remote_addr": ":remote-addr", "remote_user": ":remote-user", "date": ":date[clf]", "method": ":method", "url": ":url", "http_version": ":http-version", "status": ":status", "result_length": ":res[content-length]", "referrer": ":referrer", "user_agent": ":user-agent", "response_time": ":response-time"}', { stream: loggerstream }));

    /** Global Error handler */
    app.use((err, req, res, next) => {
        let util = new Util({
            cacheWrapper
        });

        let responseWrapper = new ResponseWrapper(util);
        res.json(responseWrapper.getResponse(err, {
            message: 'CORS - origin access not allowed!'
        }, 401, req.body))
    });

    app.use(helmet.frameguard({ action: 'SAMEORIGIN' }));

    console.log("redis is connected");

    let kafkaClient = new kafka.KafkaClient({
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

    let kafkaProducer = new KafkaProducer(kafkaClient, producerOptions);

    //console.log('kafkaProducer : ' , kafkaProducer);

    new Promise((resolve, reject) => {
        if (kafkaProducer.ready)
            return resolve();
        kafkaProducer.on('ready', resolve);
    }).then(async () => {

        //Load the userData from the Cognito
        //await listUsers()
        console.log('Cognito Users loaded successfully : ', map.size);
        //console.log(map);

        let queueWrapper = new QueueWrapper(kafkaProducer, cacheWrapper);
        //global.logger = new Logger();
        global.logger = new Logger(queueWrapper);

        //global.logger.write('conLog', 'Kafka Producer is ready', {}, {});
        console.log(`conLog Kafka Producer is ready`);
        //global.logger.write('conLog', 'BROKER_HOST : ' + global.config.BROKER_HOST, {}, {});
        console.log(`conLog BROKER_HOST: %j`, { BROKER_HOST: global.config.BROKER_HOST });

        let util = new Util({
            cacheWrapper
        });
        let responseWrapper = new ResponseWrapper(util);
        let activityCommonService = new ActivityCommonService(db, util, forEachAsync);

        let objCollection = {
            app: app,
            util: util,
            db: db,
            pgdb: pgdb,
            responseWrapper: responseWrapper,
            cacheWrapper: cacheWrapper,
            queueWrapper: queueWrapper,
            activityCommonService: activityCommonService,
            forEachAsync: forEachAsync
            //io:io
        };
        new AccessTokenInterceptor(app, responseWrapper, map, cacheWrapper);
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


}