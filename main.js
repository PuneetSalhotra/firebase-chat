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
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var kafkaIps = [global.config.kafkaIPOne,global.config.kafkaIPTwo,global.config.kafkaIPThree];
var cnt = 0;
var Util = require('./server/utils/util');
var db = require("./server/utils/dbWrapper");
var ResponseWrapper = require('./server/utils/responseWrapper');
//var CassandraWrapper = require('./server/utils/cassandraWrapper');
var EncTokenInterceptor = require('./server/interceptors/encTokenInterceptor');
var ControlInterceptor = require('./server/interceptors/controlInterceptor');
var kafka = require('kafka-node');
var KafkaProducer = kafka.Producer;
//var kafkaClient = new kafka.Client(global.config.kafkaIP);
//var kafkaClient = new kafka.KafkaClient(global.config.kafkaIPOne,global.config.kafkaIPTwo,global.config.kafkaIPThree);
var redis = require('redis');   //using elasticache as redis
var redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
var CacheWrapper = require('./server/utils/cacheWrapper');
var cacheWrapper = new CacheWrapper(redisClient);
var QueueWrapper = require('./server/queue/queueWrapper');
var forEachAsync = require('forEachAsync').forEachAsync;
var ActivityCommonService = require("./server/services/activityCommonService");
redisClient.on('connect', function () {
    connectToKafkaBroker(cnt);
});

redisClient.on('error', function (error) {
    console.log(error);
});

function connectToKafkaBroker(cnt){
    console.log("redis is connected");
    var kafkaClient = new kafka.KafkaClient(kafkaIps[cnt]);
    var kafkaProducer = new KafkaProducer(kafkaClient);
    
    new Promise((resolve, reject) => {
        if (kafkaProducer.ready)
            return resolve();
        kafkaProducer.on('ready', resolve);
    }).then(() => {
        console.log('Kafka Producer ready!!');
        var queueWrapper = new QueueWrapper(kafkaProducer);

        var util = new Util();
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
        console.log(error);        
        if(error.code === 'ECONNREFUSED') {            
            (cnt == 2) ? cnt = 0: cnt++;
            console.log('cnt : ', cnt);
            connectToKafkaBroker(cnt);
        }
    });
    
    kafkaProducer.on('brokersChanged', function (error) {
        console.log('brokersChanged : ', error);
    });
    
    
}
