/* 
 * author: Sri Sai Venkatesh
 */

mode = 'dev';
var Logger = require("./logger");
logger = new Logger();

config = {};
config.version = '0.1';
config.servicePort = 3000;
config.sms_mode = 1;    //  2: bulkSMS  |   3: Sinfini
config.whitelist = ['http://mydesk.desker.co', 'https://mydesk.desker.co', 'http://127.0.0.1'];

if (mode === 'dev') {
    config.masterIp = 'deskermysql.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave1Ip = 'readreplica1.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave2Ip = 'readreplica2.citeodhwc7z9.us-east-1.rds.amazonaws.com';

    config.dbUser = 'apiuser';
    config.database = 'desker';
    config.dbPassword = 'apidbuser';
    config.conLimit = 10;

    config.redisIp = '127.0.0.1';
    config.redisPort = 6379;

    //config.kafkaIP = "34.192.228.175:2181";
    config.kafkaIP = 'localhost:2181';
    config.kafkaActivitiesTopic = 'desker-activities';
    config.kafkaFormWidgetTopic = 'desker-form-widgets';
    config.iosPushMode = 'dev';
}

if (mode === 'prod') {
    config.masterIp = 'deskermysql.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave1Ip = 'readreplica1.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave2Ip = 'readreplica2.citeodhwc7z9.us-east-1.rds.amazonaws.com';

    config.dbUser = 'sravan';
    config.database = 'desker';
    config.dbPassword = 'sravandbaccess2';

    config.conLimit = 10;

    config.redisIp = 'rediscluster1.apppnf.ng.0001.use1.cache.amazonaws.com';
    config.redisPort = 6379;

    config.kafkaIP = 'localhost:2181';
    config.kafkaActivitiesTopic = 'desker-activities';
    config.kafkaFormWidgetTopic = 'desker-form-widgets';
    config.iosPushMode = 'prod';    // currently shouuld be in dev
}

config.platformApplicationIosDev = 'arn:aws:sns:us-east-1:430506864995:app/APNS_SANDBOX/deskerIOS';
config.platformApplicationIosProd = "AC66cabb9ae7db92bbf7e6113ff2eeabad";
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
