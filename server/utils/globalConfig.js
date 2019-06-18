/* 
 * author: V Nani Kalyan
 */

mode = process.env.mode;
//var Logger = require(`${__dirname}/logger.js`);
//logger = new Logger();

config = {};

config.domestic_sms_mode = 3; //  Domestic - 1: Mvaayo | 2: bulkSMS  |   3: Sinfini
config.international_sms_mode = 1; //  1: Twilio | 2: Nexmo
config.phone_call = 1; // both Domestic and International 1: Nexmo | 2: Twilio

//config.whitelist = ['http://mydesk.desker.co', 'https://mydesk.desker.co', 'http://127.0.0.1', 'http://localhost'];
config.whitelist = ['http://officedesk.app', 'http://preprod.officedesk.app', 'http://staging.officedesk.app', 'http://127.0.0.1', 'http://localhost'];

if (mode === 'masimukku') {

    //Ports Config
    config.version = 'r0';
    config.servicePort = 4000;
    config.standAlonePamServicePort = 4100;

    config.consumerSix = 4200;
    config.consumerOne = 4201;
    config.consumerTwo = 4202;
    config.consumerThree = 4203;
    config.consumerFour = 4204;
    config.consumerFive = 4205;

    config.sqsConsumer = 4300;

    //Mysql Config
    config.masterIp = 'worlddesk-r1-master.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.slave1Ip = 'worlddesk-r1-slave1.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';    

    config.dbUser = 'apiuser';
    config.database = 'desker_staging';
    config.dbPassword = 'apidbuser';
    config.conLimit = 2;

    //Redis Config    
    config.redisIp = 'cache-staging.7otgcu.0001.aps1.cache.amazonaws.com';
    config.redisPort = 6379;

    //IOS Push
    config.iosPushMode = 'dev'; // currently shouuld be in dev

    //SQS Queue
    config.SQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/logs-staging"; //Staging SQS QUEUE

    //Portal Service URL & Mobile Service URL
    config.portalBaseUrl = "https://stagingportal.worlddesk.cloud/";
    config.mobileBaseUrl = "https://stagingapi.worldesk.cloud/";

    //making twilio, Nexmo Calls
    config.efsPath = "/Users/masimukku/Downloads/worlddesk/";
    
    //Kafka Configuration
    config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
    config.BROKER_CONNECT_TIMEOUT = 10000;
    config.BROKER_REQUEST_TIMEOUT = 60000;
    config.BROKER_AUTO_CONNECT = true;
    config.BROKER_MAX_ASYNC_REQUESTS = 10;

    config.PRODUCER_REQUIRE_ACKS = 1;
    config.PRODUCER_ACKS_TIMEOUT = 100;
    config.PRODUCER_PARTITONER_TYPE = 3;

    //Configs for Consumer Group
    config.CONSUMER_GROUP_BATCH = undefined;
    config.CONSUMER_GROUP_SSL = false;
    config.CONSUMER_GROUP_SESSION_TIMEOUT = 15000;
    config.CONSUMER_GROUP_PARTITION_ASSIGNMENT_PROTOCOL = ['roundrobin'];
    config.CONSUMER_GROUP_FROM_OFFSET = 'latest';
    config.CONSUMER_GROUP_COMMIT_OFFSET_ONFIRSTJOIN = true;
    config.CONSUMER_GROUP_OUTOFRANGE_OFFSET = 'earliest';
    config.CONSUMER_GROUP_MIGRATE_HLC = false;
    config.CONSUMER_GROUP_MIGRATE_ROLLING = true;

    //Desker
    config.TOPIC_ID = 14; //Take from Sai
    config.TOPIC_NAME = 'masimukku-desker-activities';
    config.CONSUMER_GROUP_ID = 'masimukku-desker-activities-cg';    
    
    //Widget
    config.WIDGET_TOPIC_NAME = 'masimukku-desker-widgets';    
    config.WIDGET_CONSUMER_GROUP_ID = 'masimukku-desker-widgets-cg';
    
    //LOGS
    config.LOGS_TOPIC_NAME = 'masimukku-desker-logs';
    config.LOGS_CONSUMER_GROUP_ID = 'masimukku-desker-logs-cg';

    config.CONSUMER_AUTO_COMMIT = true;
    config.CONSUMER_AUTO_COMMIT_INTERVAL = 1000;
    config.CONSUMER_FETCH_MAX_WAIT = 10;
    config.CONSUMER_FETCH_MIN_BYTES = 1;
    config.CONSUMER_FETCH_MAX_BYTES = 1048576;
    config.CONSUMER_ENCODING = "utf8";
    config.CONSUMER_KEY_ENCODING = "utf8";
    ///////////////////////////////
    
    config.emailbaseUrlApprove = "https://stagingmydesk.desker.co"; 
    config.emailbaseUrlUpload = "https://stagingmydesk.desker.co";    
    
}

if (mode === 'local') {

    //Ports Config
    config.version = 'r1';
    config.servicePort = 7000;
    config.standAlonePamServicePort = 7100;

    config.consumerZero = 7200;
    config.consumerOne = 7201;
    config.consumerTwo = 7202;
    config.consumerThree = 7203;
    config.consumerFour = 7204;
    config.consumerFive = 7205;    

    config.sqsConsumer = 7300;

    //Mysql Config
    config.masterIp = 'worlddesk-r1-master.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.slave1Ip = 'worlddesk-r1-slave1.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    // config.masterIp = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    // config.slave1Ip = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    
    config.dbUser = 'apiuser';
    config.database = 'desker'; // desker_staging
    // config.database = 'desker_staging';
    // config.database = 'worlddesk_staging';
    config.dbPassword = 'apidbuser';
    config.conLimit = 5;
    
    //Log Mysql Config
    // config.logMasterIp = 'worlddesk-r1-log.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';    
    config.logMasterIp = '10.0.0.169';    
    config.logDatabase = 'worlddesk_log_staging';
    config.logDbPassword = 'Apidbuser_123';

    //Redis Config
    //config.redisIp = '127.0.0.1';
    //config.redisPort = 6379;  
    
    // config.redisIp = 'cache-staging.7otgcu.0001.aps1.cache.amazonaws.com';    
    config.redisIp = 'cache-production.7otgcu.ng.0001.aps1.cache.amazonaws.com';
    config.redisPort = 6379;
    
    //IOS Push
    config.iosPushMode = 'dev';

    //SQS Queue
    config.SQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/logs-staging"; //Staging SQS QUEUE

    //Portal Service URL & Mobile Service URL
    config.portalBaseUrl = "http://localhost:7001/";
    config.mobileBaseUrl = "http://localhost:7000/";

    //making twilio, Nexmo Calls
    config.efsPath = "/";
    
    //Kafka Configuration
    config.BROKER_HOST = "192.168.1.4:9092";
    config.BROKER_CONNECT_TIMEOUT = 10000;
    config.BROKER_REQUEST_TIMEOUT = 60000;
    config.BROKER_AUTO_CONNECT = true;
    config.BROKER_MAX_ASYNC_REQUESTS = 10;

    config.PRODUCER_REQUIRE_ACKS = 1;
    config.PRODUCER_ACKS_TIMEOUT = 100;
    config.PRODUCER_PARTITONER_TYPE = 3;

    //Configs for Consumer Group
    config.CONSUMER_GROUP_BATCH = undefined;
    config.CONSUMER_GROUP_SSL = false;
    config.CONSUMER_GROUP_SESSION_TIMEOUT = 15000;
    config.CONSUMER_GROUP_PARTITION_ASSIGNMENT_PROTOCOL = ['roundrobin'];
    config.CONSUMER_GROUP_FROM_OFFSET = 'latest';
    config.CONSUMER_GROUP_COMMIT_OFFSET_ONFIRSTJOIN = true;
    config.CONSUMER_GROUP_OUTOFRANGE_OFFSET = 'earliest';
    config.CONSUMER_GROUP_MIGRATE_HLC = false;
    config.CONSUMER_GROUP_MIGRATE_ROLLING = true;

    //Desker
    config.TOPIC_ID = 8;
    config.TOPIC_NAME = "desker-activities";
    config.CONSUMER_GROUP_ID = 'desker-activities-consumer-group';    
    
    //Widget
    config.WIDGET_TOPIC_NAME = 'desker-form-widgets';    
    config.WIDGET_CONSUMER_GROUP_ID = 'staging-desker-activities-widget-cg';
    
    //LOGS
    config.LOGS_TOPIC_NAME = 'desker-logs';
    config.LOGS_CONSUMER_GROUP_ID = 'desker-logs-cg';
    
    config.CONSUMER_AUTO_COMMIT = true;
    config.CONSUMER_AUTO_COMMIT_INTERVAL = 1000;
    config.CONSUMER_FETCH_MAX_WAIT = 10;
    config.CONSUMER_FETCH_MIN_BYTES = 1;
    config.CONSUMER_FETCH_MAX_BYTES = 1048576;
    config.CONSUMER_ENCODING = "utf8";
    config.CONSUMER_KEY_ENCODING = "utf8";
    ///////////////////////////////  
    
    config.emailbaseUrlApprove = "https://stagingmydesk.desker.co"; 
    config.emailbaseUrlUpload = "https://stagingmydesk.desker.co";
    
}

if (mode === 'dev') {

    //Ports Config
    config.version = 'rd';
    config.servicePort = 3000;
    config.standAlonePamServicePort = 3100;

    config.consumerZero = 3200;
    config.consumerOne = 3201;
    config.consumerTwo = 3202;
    config.consumerThree = 3203;
    config.consumerFour = 3204;
    config.consumerFive = 3205;    

    config.sqsConsumer = 3300;

    //Mysql Config
    config.masterIp = 'worlddesk-r1-master.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.slave1Ip = 'worlddesk-r1-slave1.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
        
    config.dbUser = 'apiuser';
    config.database = 'desker_staging';
    config.dbPassword = 'apidbuser';
    config.conLimit = 2;

    config.logMasterIp = '10.0.0.169';
    config.logDatabase = 'worlddesk_log_staging';
    config.logDbPassword = 'Apidbuser_123';

    //Redis Config
    config.redisIp = 'cache-staging.7otgcu.0001.aps1.cache.amazonaws.com';
    config.redisPort = 6379;    
    
    //IOS Push
    config.iosPushMode = 'dev';

    //SQS Queue
    config.SQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/logs-staging"; //Staging SQS QUEUE

    //Portal Service URL & Mobile Service URL
    config.portalBaseUrl = "https://stagingportal.worlddesk.cloud/";
    config.mobileBaseUrl = "https://stagingapi.worlddesk.cloud/";

    //making twilio, Nexmo Calls
    config.efsPath = "/apistaging-data/";
    
    //Kafka Configuration
    config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
    config.BROKER_CONNECT_TIMEOUT = 10000;
    config.BROKER_REQUEST_TIMEOUT = 60000;
    config.BROKER_AUTO_CONNECT = true;
    config.BROKER_MAX_ASYNC_REQUESTS = 10;

    config.PRODUCER_REQUIRE_ACKS = 1;
    config.PRODUCER_ACKS_TIMEOUT = 100;
    config.PRODUCER_PARTITONER_TYPE = 3;

    //Configs for Consumer Group
    config.CONSUMER_GROUP_BATCH = undefined;
    config.CONSUMER_GROUP_SSL = false;
    config.CONSUMER_GROUP_SESSION_TIMEOUT = 15000;
    config.CONSUMER_GROUP_PARTITION_ASSIGNMENT_PROTOCOL = ['roundrobin'];
    config.CONSUMER_GROUP_FROM_OFFSET = 'latest';
    config.CONSUMER_GROUP_COMMIT_OFFSET_ONFIRSTJOIN = true;
    config.CONSUMER_GROUP_OUTOFRANGE_OFFSET = 'earliest';
    config.CONSUMER_GROUP_MIGRATE_HLC = false;
    config.CONSUMER_GROUP_MIGRATE_ROLLING = true;

    config.TOPIC_ID = 1;
    config.TOPIC_NAME = "dev-desker-activities";
    config.WIDGET_TOPIC_NAME = 'dev-desker-form-widgets';
    config.CONSUMER_GROUP_ID = "dev-desker-activities-consumer-group";
    config.CONSUMER_AUTO_COMMIT = true;
    config.CONSUMER_AUTO_COMMIT_INTERVAL = 1000;
    config.CONSUMER_FETCH_MAX_WAIT = 10;
    config.CONSUMER_FETCH_MIN_BYTES = 1;
    config.CONSUMER_FETCH_MAX_BYTES = 1048576;
    config.CONSUMER_ENCODING = "utf8";
    config.CONSUMER_KEY_ENCODING = "utf8";
    ///////////////////////////////
       
    config.emailbaseUrlApprove = "https://stagingmydesk.desker.co"; 
    config.emailbaseUrlUpload = "https://stagingmydesk.desker.co";
    
}

if (mode === 'staging') {

    //Ports Config
    config.version = 'r0';
    config.servicePort = 4000;
    config.standAlonePamServicePort = 4100;

    config.consumerSix = 4200;
    config.consumerOne = 4201;
    config.consumerTwo = 4202;
    config.consumerThree = 4203;
    config.consumerFour = 4204;
    config.consumerFive = 4205;

    config.sqsConsumer = 4300;

    //Mysql Config
    // config.masterIp = 'worlddesk-r1-master.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    // config.slave1Ip = 'worlddesk-r1-slave1.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';    
    config.masterIp = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.slave1Ip = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';

    config.dbUser = 'apiuser';
    // config.database = 'desker_staging';
    config.database = 'worlddesk_staging';
    config.dbPassword = 'apidbuser';

    config.conLimit = 2;
    
    //Log Mysql Config
    // config.logMasterIp = 'worlddesk-r1-log.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';    
    config.logMasterIp = '10.0.0.169';    
    config.logDatabase = 'worlddesk_log_staging';
    config.logDbPassword = 'Apidbuser_123';

    //Redis Config    
    config.redisIp = 'cache-staging.7otgcu.0001.aps1.cache.amazonaws.com';
    config.redisPort = 6379;

    //IOS Push
    config.iosPushMode = 'dev'; // currently shouuld be in dev

    //SQS Queue
    config.SQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/logs-staging"; //Staging SQS QUEUE

    //Portal Service URL & Mobile Service URL
    config.portalBaseUrl = "https://stagingportal.worlddesk.cloud/";
    config.mobileBaseUrl = "https://stagingapi.worlddesk.cloud/";

    //making twilio, Nexmo Calls
    config.efsPath = "/apistaging-data/";
    
    //Kafka Configuration
    config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
    config.BROKER_CONNECT_TIMEOUT = 10000;
    config.BROKER_REQUEST_TIMEOUT = 60000;
    config.BROKER_AUTO_CONNECT = true;
    config.BROKER_MAX_ASYNC_REQUESTS = 10;

    config.PRODUCER_REQUIRE_ACKS = 1;
    config.PRODUCER_ACKS_TIMEOUT = 100;
    config.PRODUCER_PARTITONER_TYPE = 3;

    //Configs for Consumer Group
    config.CONSUMER_GROUP_BATCH = undefined;
    config.CONSUMER_GROUP_SSL = false;
    config.CONSUMER_GROUP_SESSION_TIMEOUT = 15000;
    config.CONSUMER_GROUP_PARTITION_ASSIGNMENT_PROTOCOL = ['roundrobin'];
    config.CONSUMER_GROUP_FROM_OFFSET = 'latest';
    config.CONSUMER_GROUP_COMMIT_OFFSET_ONFIRSTJOIN = true;
    config.CONSUMER_GROUP_OUTOFRANGE_OFFSET = 'earliest';
    config.CONSUMER_GROUP_MIGRATE_HLC = false;
    config.CONSUMER_GROUP_MIGRATE_ROLLING = true;

    config.TOPIC_ID = 16;
    config.TOPIC_NAME = 'staging-desker-activities-v3'; //v1 is only one partition
    config.CONSUMER_GROUP_ID = 'staging-desker-activities-v3-cg';
    
    //staging-desker-form-widgets-v2 - 1 partition
    config.WIDGET_TOPIC_NAME = 'staging-desker-form-widgets-v2';    
    config.WIDGET_CONSUMER_GROUP_ID = 'staging-desker-form-widgets-v2-cg-new';
    
    //LOGS
    //staging-desker-logs-v2 1 partition
    config.LOGS_TOPIC_NAME = 'staging-desker-logs-v3';
    config.LOGS_CONSUMER_GROUP_ID = 'staging-desker-logs-v3-cg';
    
    config.CONSUMER_AUTO_COMMIT = true;
    config.CONSUMER_AUTO_COMMIT_INTERVAL = 1000;
    config.CONSUMER_FETCH_MAX_WAIT = 10;
    config.CONSUMER_FETCH_MIN_BYTES = 1;
    config.CONSUMER_FETCH_MAX_BYTES = 1048576;
    config.CONSUMER_ENCODING = "utf8";
    config.CONSUMER_KEY_ENCODING = "utf8";
    ///////////////////////////////
    
    config.emailbaseUrlApprove = "https://staging.officedesk.app"; 
    config.emailbaseUrlUpload = "https://staging.officedesk.app";
    //config.emailbaseUrlUpload = "https://stagingmydesk.desker.co";
}

if (mode === 'preprod') {

    //Ports Config
    config.version = 'r1';
    config.servicePort = 6000;
    config.standAlonePamServicePort = 6100;

    config.consumerZero = 6200;
    config.consumerOne = 6201;
    config.consumerTwo = 6202;
    config.consumerThree = 6203;
    config.consumerFour = 6204;
    config.consumerFive = 6205;

    config.sqsConsumer = 6300;

    //Mysql Config
    // config.masterIp = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    // config.slave1Ip = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.masterIp = 'worlddesk-r1-master.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.slave1Ip = 'worlddesk-r1-slave1.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    
    config.dbUser = 'apiuser';    
    // config.database = 'worlddesk_preprod';
    config.database = 'desker'; // desker_staging
    config.dbPassword = 'apidbuser';

    config.conLimit = 2;

    // Redis Config    
    // config.redisIp = 'cache-preprod.7otgcu.0001.aps1.cache.amazonaws.com';
    config.redisIp = 'cache-production.7otgcu.ng.0001.aps1.cache.amazonaws.com';
    config.redisPort = 6379;

    //IOS Push
    config.iosPushMode = 'prod';

    //SQS Queue
    config.SQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/logs-production";

    //Portal Service URL & Mobile Service URL
    config.portalBaseUrl = "https://preprodportal.worlddesk.cloud/";    
    config.mobileBaseUrl = "https://preprodapi.worlddesk.cloud/";

    //making twilio, Nexmo Calls
    config.efsPath = "/data/";
    
    //Kafka Configuration
    config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
    config.BROKER_CONNECT_TIMEOUT = 10000;
    config.BROKER_REQUEST_TIMEOUT = 60000;
    config.BROKER_AUTO_CONNECT = true;
    config.BROKER_MAX_ASYNC_REQUESTS = 10;

    config.PRODUCER_REQUIRE_ACKS = 1;
    config.PRODUCER_ACKS_TIMEOUT = 100;
    config.PRODUCER_PARTITONER_TYPE = 3;

    //Configs for Consumer Group
    config.CONSUMER_GROUP_BATCH = undefined;
    config.CONSUMER_GROUP_SSL = false;
    config.CONSUMER_GROUP_SESSION_TIMEOUT = 15000;
    config.CONSUMER_GROUP_PARTITION_ASSIGNMENT_PROTOCOL = ['roundrobin'];
    config.CONSUMER_GROUP_FROM_OFFSET = 'latest';
    config.CONSUMER_GROUP_COMMIT_OFFSET_ONFIRSTJOIN = true;
    config.CONSUMER_GROUP_OUTOFRANGE_OFFSET = 'earliest';
    config.CONSUMER_GROUP_MIGRATE_HLC = false;
    config.CONSUMER_GROUP_MIGRATE_ROLLING = true;

    config.TOPIC_ID = 11;
    config.TOPIC_NAME = 'preprod-desker-activities-v1'; //Only one partition
    config.CONSUMER_GROUP_ID = 'preprod-desker-activities-consumer-group-v1';

    //WIDGETS    
    config.WIDGET_TOPIC_NAME = 'preprod-desker-form-widgets-v1'; //Only one partition
    config.WIDGET_CONSUMER_GROUP_ID = 'preprod-desker-form-widgets-v1-cg';    
    
    //LOGS    
    config.LOGS_TOPIC_NAME = 'preprod-desker-logs-v1'; //Only one partition
    config.LOGS_CONSUMER_GROUP_ID = 'preprod-desker-logs-v1-cg';
    
    config.CONSUMER_AUTO_COMMIT = true;
    config.CONSUMER_AUTO_COMMIT_INTERVAL = 1000;
    config.CONSUMER_FETCH_MAX_WAIT = 10;
    config.CONSUMER_FETCH_MIN_BYTES = 1;
    config.CONSUMER_FETCH_MAX_BYTES = 1048576;
    config.CONSUMER_ENCODING = "utf8";
    config.CONSUMER_KEY_ENCODING = "utf8";
    ///////////////////////////////
    
    config.emailbaseUrlApprove = "https://preprodweb.officedesk.app"; 
    config.emailbaseUrlUpload = "https://preprodweb.officedesk.app";
    
}

if (mode === 'prod') {

    //Ports config
    config.version = 'r1';
    config.servicePort = 3000;
    config.standAlonePamServicePort = 3100;

    config.consumerZero = 3200;
    config.consumerOne = 3201;
    config.consumerTwo = 3202;
    config.consumerThree = 3203;
    config.consumerFour = 3204;
    config.consumerFive = 3205;

    config.sqsConsumer = 3300;

    //Mysql Config   
    config.masterIp = 'worlddesk-r1-master.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.slave1Ip = 'worlddesk-r1-slave1.cgbemsumnr3x.ap-south-1.rds.amazonaws.com'; 
    
    config.dbUser = 'apiuser';
    config.database = 'desker';
    config.dbPassword = 'apidbuser';

    config.conLimit = 2;
    
    //Log Mysql Config
    // config.logMasterIp = 'worlddesk-r1-log.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';    
    config.logMasterIp = '10.0.0.169';    
    config.logDatabase = 'worlddesk_log';
    config.logDbPassword = 'Apidbuser_123';

    //Redis    
    config.redisIp = 'cache-production.7otgcu.ng.0001.aps1.cache.amazonaws.com';
    config.redisPort = 6379;

    //Kafka Configuration
    config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
    config.BROKER_CONNECT_TIMEOUT = 10000;
    config.BROKER_REQUEST_TIMEOUT = 60000;
    config.BROKER_AUTO_CONNECT = true;
    config.BROKER_MAX_ASYNC_REQUESTS = 10;

    config.PRODUCER_REQUIRE_ACKS = 1;
    config.PRODUCER_ACKS_TIMEOUT = 100;
    config.PRODUCER_PARTITONER_TYPE = 3;

    //Configs for Consumer Group
    config.CONSUMER_GROUP_BATCH = undefined;
    config.CONSUMER_GROUP_SSL = false;
    config.CONSUMER_GROUP_SESSION_TIMEOUT = 15000;
    config.CONSUMER_GROUP_PARTITION_ASSIGNMENT_PROTOCOL = ['roundrobin'];
    config.CONSUMER_GROUP_FROM_OFFSET = 'latest';
    config.CONSUMER_GROUP_COMMIT_OFFSET_ONFIRSTJOIN = true;
    config.CONSUMER_GROUP_OUTOFRANGE_OFFSET = 'earliest';
    config.CONSUMER_GROUP_MIGRATE_HLC = false;
    config.CONSUMER_GROUP_MIGRATE_ROLLING = true;

    config.TOPIC_ID = 12;
    config.TOPIC_NAME = 'prod-desker-activities-v1'; //Only one partition
    config.CONSUMER_GROUP_ID = 'prod-desker-activities-consumer-group-v1';
    
    // Widget
    config.WIDGET_TOPIC_NAME = 'prod-desker-form-widgets-v1'; //Only one partition
    config.WIDGET_CONSUMER_GROUP_ID = 'prod-desker-form-widgets-cg-v1';

    //LOGS
    config.LOGS_TOPIC_NAME = 'prod-desker-logs-v1'; //Only one partition
    config.LOGS_CONSUMER_GROUP_ID = 'prod-desker-logs-cg-v1';
    
    config.CONSUMER_AUTO_COMMIT = true;
    config.CONSUMER_AUTO_COMMIT_INTERVAL = 1000;
    config.CONSUMER_FETCH_MAX_WAIT = 10;
    config.CONSUMER_FETCH_MIN_BYTES = 1;
    config.CONSUMER_FETCH_MAX_BYTES = 1048576;
    config.CONSUMER_ENCODING = "utf8";
    config.CONSUMER_KEY_ENCODING = "utf8";
    ///////////////////////////////

    //IOS PUSH
    config.iosPushMode = 'prod';

    //SQS QUEUE
    config.SQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/logs-production";

    //Portal Service URL & Mobile Service URL
    config.portalBaseUrl = "https://portal.worlddesk.cloud/";    
    config.mobileBaseUrl = "https://api.worlddesk.cloud/";

    //making twilio, Nexmo Calls
    config.efsPath = "/api-data/";
    
    config.emailbaseUrlApprove = "https://officedesk.app"; 
    config.emailbaseUrlUpload = "https://officedesk.app";
    
}


//Android
config.platformApplicationAndroid = "arn:aws:sns:ap-south-1:430506864995:app/GCM/worldDeskAndroidPush";

//World Desk IOS normal Push platform endpoints
config.platformApplicationIosWorldDeskDevGR = 'arn:aws:sns:ap-south-1:430506864995:app/APNS_SANDBOX/worldDeskIOSDevPush';
config.platformApplicationIosWorldDeskProdGR = 'arn:aws:sns:ap-south-1:430506864995:app/APNS/worldDeskIOSProdPush';

//Service Desk IOS normal Push platform endpoints
config.platformApplicationIosSDPushDev = 'arn:aws:sns:ap-south-1:430506864995:app/APNS_SANDBOX/serviceDeskIOSDevPush';
config.platformApplicationIosSDPushProd = 'arn:aws:sns:ap-south-1:430506864995:app/APNS/serviceDeskIOSProdPush';

//Office Desk IOS normal Push platform endpoints
config.platformApplicationIosODPushDev = 'arn:aws:sns:ap-south-1:430506864995:app/APNS_SANDBOX/officeDeskIOSDevPush';
config.platformApplicationIosODPushProd = 'arn:aws:sns:ap-south-1:430506864995:app/APNS/officeDeskIOSProdPush';

//PAM App IOS Pushes
config.platformApplicationIosPamPushDev = 'arn:aws:sns:ap-south-1:430506864995:app/APNS_SANDBOX/pamDevPush';
config.platformApplicationIosPamPushProd = 'arn:aws:sns:ap-south-1:430506864995:app/APNS/pamProdPush';

//TONY IOS normal Push platform endpoints
config.platformApplicationIosTonyPushDev = 'arn:aws:sns:ap-south-1:430506864995:app/APNS_SANDBOX/TonyIOSDevPush';
config.platformApplicationIosTonyPushProd = 'arn:aws:sns:ap-south-1:430506864995:app/APNS/TonyIOSProdPush';

//iTONY IOS normal Push platform endpoints
config.platformApplicationIosiTonyPushDev = 'arn:aws:sns:ap-south-1:430506864995:app/APNS_SANDBOX/iTonyDevPush';

config.twilioAccountSid = "AC66cabb9ae7db92bbf7e6113ff2eeabad";
config.twilioAuthToken = "7d4f9ee9f8122d2a7129e13fdaefd919";
config.nexmoAPIKey = "533696c3";
config.nexmoSecretKey = "0c8aa63d";
config.nexmpAppliationId = "33635cb2-5497-4d69-831e-dcb533449e84";

config.smtp_host = 'retail.smtp.com';
config.smtp_port = '2525';
config.smtp_user = 'vodafone_idea@grenerobotics.com';
config.smtp_pass = 'foxtrot111';

config.cassandraCredentialsDev = {
    ip: '10.0.0.169',
    user: 'apiuser',
    pwd: 'c@ss@ndr@@ccess',
    log_keyspace: 'deskerlogv2_staging',
    session_keyspace: 'deskersession_staging'
};

config.cassandraCredentialsProd = {
    ip: '10.0.0.169',
    user: 'apiuser',
    pwd: 'c@ss@ndr@@ccess',
    log_keyspace: 'deskerlogv2',
    session_keyspace: 'deskersession'
};
