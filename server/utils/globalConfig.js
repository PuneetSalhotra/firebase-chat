/* 
 * author: V Nani Kalyan
 */

mode = process.env.mode;
var Logger = require(`${__dirname}/logger.js`);
logger = new Logger();

config = {};
        
config.domestic_sms_mode = 3;    //  Domestic - 1: Mvaayo | 2: bulkSMS  |   3: Sinfini
config.international_sms_mode = 1;    //  1: Twilio | 2: Nexmo
config.phone_call = 1; // both Domestic and International 1: Nexmo | 2: Twilio

config.whitelist = ['http://mydesk.desker.co', 'https://mydesk.desker.co', 'http://127.0.0.1','http://localhost'];

if (mode === 'dev') {
    
    //Ports Config
    config.version = 'r1';
    config.servicePort = 3000;
    config.standAlonePamServicePort = 3100;

    config.consumerOne = 3200;
    config.consumerTwo = 3201;
    config.consumerThree = 3202;

    config.sqsConsumer = 3300;

    //Mysql Config
    config.masterIp = 'deskermysql.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave1Ip = 'readreplica1.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave2Ip = 'readreplica2.citeodhwc7z9.us-east-1.rds.amazonaws.com';

    config.dbUser = 'apiuser';
    //config.database = 'desker';// desker_staging
    config.database = 'desker_staging';
    config.dbPassword = 'apidbuser';
    config.conLimit = 10;

    //Redis Config
    config.redisIp = '127.0.0.1';
    config.redisPort = 6379;   
   
    config.kafkaMsgUniqueIdValue = 'read';

    //Kafka Brokers Config
    config.kafkaIPOne = {kafkaHost: 'kafka1:9092'};
    config.kafkaIPTwo = {kafkaHost: 'kafka1:9093'};
    config.kafkaIPThree = {kafkaHost: 'kafka1:9094'};
    
    //Kafka Topics
    config.kafkaActivitiesTopic = 'desker-activities';
    //config.kafkaActivitiesTopic = 'desker-test';
    config.kafkaFormWidgetTopic = 'desker-form-widgets';
    config.consumerGroup = "desker-activities-consumer-group-v2";
    
    //IOS Push
    config.iosPushMode = 'dev';
    
    //SQS Queue
    config.SQSqueueUrl = "https://sqs.us-east-1.amazonaws.com/430506864995/Desker-staging"; //Staging SQS QUEUE
    
    //Portal Service URL
    config.portalBaseUrl = "http://staging.portal.desker.cloud/r0";
}

if (mode === 'staging') {
    
    //Ports Config
    config.version = 'r0';
    config.servicePort = 4000;
    config.standAlonePamServicePort = 4100;

    config.consumerOne = 4200;
    config.consumerTwo = 4201;
    config.consumerThree = 4202;
    
    //Mysql Config
    config.masterIp = 'deskermysql.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave1Ip = 'readreplica1.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave2Ip = 'readreplica2.citeodhwc7z9.us-east-1.rds.amazonaws.com';

    config.dbUser = 'apiuser';
    config.database = 'desker_staging';
    config.dbPassword = 'apidbuser';

    config.conLimit = 10;

    //Redis Config
    config.redisIp = 'dev-redis.apppnf.0001.use1.cache.amazonaws.com';
    config.redisPort = 6379;    

    //Kafka Brokers Config
    config.kafkaIPOne = {kafkaHost: 'kafka1:9092'};
    config.kafkaIPTwo = {kafkaHost: 'kafka2:9092'};
    config.kafkaIPThree = {kafkaHost: 'kafka3:9092'};
    
    //Kafka Topics
    config.kafkaActivitiesTopic = 'staging-desker-activities';
    //config.kafkaFormWidgetTopic = 'desker-form-widgets';
    config.consumerGroup = "desker-activities-consumer-group-v2";
    
    //IOS Push
    config.iosPushMode = 'dev';    // currently shouuld be in dev
    
    //SQS Queue
    config.SQSqueueUrl = "https://sqs.us-east-1.amazonaws.com/430506864995/Desker-staging"; //Staging SQS QUEUE
    
    //Portal Service URL
    config.portalBaseUrl = "http://staging.portal.desker.cloud/r0";
}

if (mode === 'prod') {
    
    //Ports config
    config.version = 'r1';
    config.servicePort = 3000;
    config.standAlonePamServicePort = 3100;

    config.consumerOne = 3200;
    config.consumerTwo = 3201;
    config.consumerThree = 3202;

    config.sqsConsumer = 3300;
    
    //Mysql Config
    config.masterIp = 'deskermysql.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave1Ip = 'readreplica1.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    config.slave2Ip = 'readreplica2.citeodhwc7z9.us-east-1.rds.amazonaws.com';
    
    config.dbUser = 'apiuser';
    config.database = 'desker_staging';
    //config.database = 'desker';
    config.dbPassword = 'apidbuser';

    config.conLimit = 10;

    //Redis
    config.redisIp = 'dev-redis.apppnf.0001.use1.cache.amazonaws.com';
    //config.redisIp = 'rediscluster1.apppnf.ng.0001.use1.cache.amazonaws.com';
    config.redisPort = 6379;

    //Kafka Brokers Config
    config.kafkaIPOne = {kafkaHost: 'kafka1:9092'};
    config.kafkaIPTwo = {kafkaHost: 'kafka2:9092'};
    config.kafkaIPThree = {kafkaHost: 'kafka3:9092'};
    
    //Kafka Topics
    //config.kafkaActivitiesTopic = 'desker-activities';    
    //config.kafkaFormWidgetTopic = 'desker-form-widgets';
    config.kafkaActivitiesTopic = 'desker-test';
    
    config.consumerGroup = "desker-activities-consumer-group-v2";
    
    //IOS PUSH
    //config.iosPushMode = 'prod';
    config.iosPushMode = 'dev';
    
    //SQS QUEUE
    config.SQSqueueUrl = "https://sqs.us-east-1.amazonaws.com/430506864995/desker-logging-staging"; //Prod SQS QUEUE - DONT confuse with the naming Convention
    
    //Portal Service URL
    config.portalBaseUrl = "https://portal.desker.cloud/r1";
}

config.platformApplicationIosDev = 'arn:aws:sns:us-east-1:430506864995:app/APNS_VOIP_SANDBOX/VOIPios';
config.platformApplicationIosProd = "arn:aws:sns:us-east-1:430506864995:app/APNS_VOIP/VOIPiosProd";
config.platformApplicationIosDevGR = 'arn:aws:sns:us-east-1:430506864995:app/APNS_VOIP_SANDBOX/GRVOIPiosDev';
config.platformApplicationIosProdGR = "arn:aws:sns:us-east-1:430506864995:app/APNS_VOIP/GRVOIPiosProd";
//config.platformApplicationAndroid = "arn:aws:sns:us-east-1:430506864995:app/GCM/DeskerCoAndroid";
config.platformApplicationAndroid = "arn:aws:sns:us-east-1:430506864995:app/GCM/deskerAndroid";
config.platformApplicationWindows = 'arn:aws:sns:us-east-1:430506864995:app/WNS/deskerWindows';
config.twilioAccountSid = "AC66cabb9ae7db92bbf7e6113ff2eeabad";
config.twilioAuthToken = "7d4f9ee9f8122d2a7129e13fdaefd919";
config.nexmoAPIKey = "533696c3";
config.nexmoSecretKey = "0c8aa63d";
config.nexmpAppliationId = "33635cb2-5497-4d69-831e-dcb533449e84";

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
