/* 
 * author: Sri Sai Venkatesh
 */

mode = 'dev';
var Logger = require("./logger");
logger = new Logger();

config = {};
config.version = 'r1';
config.servicePort = 3000;

config.consumerOne = 3200;
config.consumerTwo = 3201;
config.consumerThree = 3202;

config.sqsConsumer = 3300;
        
config.sms_mode = 1;    //  2: bulkSMS  |   3: Sinfini
config.whitelist = ['http://mydesk.desker.co', 'https://mydesk.desker.co', 'http://127.0.0.1','http://localhost'];

if (mode === 'dev') {
    config.masterIp = 'deskermysql.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave1Ip = 'readreplica1.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave2Ip = 'readreplica2.citeodhwc7z9.us-east-1.rds.amazonaws.com';

    config.dbUser = 'apiuser';
    config.database = 'desker';// desker_staging
    config.dbPassword = 'apidbuser';
    config.conLimit = 10;

    config.redisIp = '127.0.0.1';
    config.redisPort = 6379;
    
    config.kafkaMsgUniqueIdValue = 'read';

    config.kafkaIPOne = {kafkaHost: 'kafka1:9092'};
    config.kafkaIPTwo = {kafkaHost: 'kafka1:9093'};
    config.kafkaIPThree = {kafkaHost: 'kafka1:9094'};
    config.kafkaActivitiesTopic = 'desker-activities';
    //config.kafkaActivitiesTopic = 'desker-test';
    config.kafkaFormWidgetTopic = 'desker-form-widgets';
    config.iosPushMode = 'dev';
}

if (mode === 'prod') {
    config.masterIp = 'deskermysql.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave1Ip = 'readreplica1.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave2Ip = 'readreplica2.citeodhwc7z9.us-east-1.rds.amazonaws.com';

    config.dbUser = 'apiuser';
    config.database = 'desker';
    config.dbPassword = 'apidbuser';

    config.conLimit = 10;

    config.redisIp = 'rediscluster1.apppnf.ng.0001.use1.cache.amazonaws.com';
    config.redisPort = 6379;

    config.kafkaIPOne = {kafkaHost: 'kafka1:9092'};
    config.kafkaIPTwo = {kafkaHost: 'kafka2:9092'};
    config.kafkaIPThree = {kafkaHost: 'kafka3:9092'};
    config.kafkaActivitiesTopic = 'desker-activities';
    //config.kafkaActivitiesTopic = 'desker-test';
    config.kafkaFormWidgetTopic = 'desker-form-widgets';
    config.iosPushMode = 'prod';    // currently shouuld be in dev
}

config.platformApplicationIosDev = 'arn:aws:sns:us-east-1:430506864995:app/APNS_VOIP_SANDBOX/VOIPios';
config.platformApplicationIosProd = "arn:aws:sns:us-east-1:430506864995:app/APNS_VOIP/VOIPiosProd";
config.platformApplicationAndroid = "arn:aws:sns:us-east-1:430506864995:app/GCM/DeskerCoAndroid";
//config.platformApplicationAndroid = "arn:aws:sns:us-east-1:430506864995:app/GCM/deskerAndroid";
config.platformApplicationWindows = 'arn:aws:sns:us-east-1:430506864995:app/WNS/deskerWindows';
config.twilioAccountSid = "AC66cabb9ae7db92bbf7e6113ff2eeabad";
config.twilioAuthToken = "7d4f9ee9f8122d2a7129e13fdaefd919";
config.nexmoAPIKey = "533696c3";
config.nexmoSecretKey = "0c8aa63d";

config.smtp_host = 'retail.smtp.com';
config.smtp_port = '2525';
config.smtp_user = 'donotreply@blueflock.com';
config.smtp_pass = '%*^$#r@@t';

config.cassandraCredentialsDev = {
    ip: '192.168.7.120',
    user: 'aamir',
    pwd: 'foxtrot88',
    log_keyspace: 'deskerlog_staging',
    session_keyspace: 'deskersession_staging'
};

config.cassandraCredentialsProd = {
    ip: '192.168.7.120',
    user: 'aamir',
    pwd: 'foxtrot88',
    log_keyspace: 'deskerlogv2',
    session_keyspace: 'deskersession'
};

config.SQSqueueUrl = "https://sqs.us-east-1.amazonaws.com/430506864995/desker-logging-staging";
