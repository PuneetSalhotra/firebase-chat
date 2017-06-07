/* 
 * author: A SRI SAI VENKATESH
 */
var globalConfig = require('./server/utils/globalConfig');
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

//var morgan = require('morgan');
//app.use(morgan("combined"));

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var Util = require('./server/utils/util');
var db = require("./server/utils/dbWrapper");
var ResponseWrapper = require('./server/utils/responseWrapper');
//var CassandraWrapper = require('./server/utils/cassandraWrapper');
var EncTokenInterceptor = require('./server/interceptors/encTokenInterceptor');
var ControlInterceptor = require('./server/interceptors/controlInterceptor');
var kafka = require('kafka-node');
var KafkaProducer = kafka.Producer;
var kafkaClient = new kafka.Client(global.config.kafkaIP);


var redis = require('redis');   //using elasticache as redis
var redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
var CacheWrapper = require('./server/utils/cacheWrapper');
var cacheWrapper = new CacheWrapper(redisClient);
var QueueWrapper = require('./server/queue/queueWrapper');

redisClient.on('connect', function () {
    var kafkaProducer = new KafkaProducer(kafkaClient);
    console.log("redis is connected");
    kafkaProducer.on('ready', function () {
        console.log('Kafka Producer ready!!');
        var queueWrapper = new QueueWrapper(kafkaProducer);

        var util = new Util();
        var responseWrapper = new ResponseWrapper(util);

        var objCollection = {
            app: app,
            util: util,
            db: db,
            responseWrapper: responseWrapper,
            cacheWrapper: cacheWrapper,
            queueWrapper: queueWrapper
        };
        new EncTokenInterceptor(app, cacheWrapper, responseWrapper, util);
        new ControlInterceptor(objCollection);
        server.listen(global.config.servicePort);
        console.log('server running at port ' + global.config.servicePort);
    });

    kafkaProducer.on('error', function (error) {
        console.log(error);
    });



});

redisClient.on('error', function (error) {
    console.log(error);
});


