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
// config.whitelist = ['http://officedesk.app', 'http://preprod.officedesk.app', 'http://staging.officedesk.app', 'http://127.0.0.1', 'http://localhost'];
config.whitelist = [
    'http://officedesk.app',
    "https://management.officedesk.app",
    "https://web.officedesk.app",
    "https://dashboard2.officedesk.app",
    "https://dashboard.officedesk.app",
    "https://preprod.officedesk.app",
    "https://preprodmanagement.officedesk.app",
    "https://preprodweb.officedesk.app",
    "https://preproddashboard2.officedesk.app",
    "https://preproddashboard.officedesk.app",
    "https://staging.officedesk.app",
    "https://stagingmanagement.officedesk.app",
    "https://stagingweb.officedesk.app",
    "https://stagingdashboard2.officedesk.app",
    "https://stagingdashboard.officedesk.app",
    "https://sprintoffice.greneos.com",
    "https://sprintweb.greneos.com",
    "https://sprintdashboard.greneos.com",
    "https://sprintdashboard2.greneos.com",
    "https://stagingoffice.greneos.com",
    "https://stagingweb.greneos.com",
    "https://stagingdashboard.greneos.com",
    "https://stagingdashboard2.greneos.com",
    "https://preprodoffice.greneos.com",
    "https://preprodweb.greneos.com",
    "https://preproddashboard.greneos.com",
    "https://preproddashboard2.greneos.com",
    'https://office.greneos.com/',
    'https://web.greneos.com/',
    'https://dashboard.greneos.com',
    'http://127.0.0.1',
    'http://localhost',
];

config.BROKER_HOST = "b-1.msk-apachekafka-clust.82ohbb.c2.kafka.ap-south-1.amazonaws.com:9092,b-2.msk-apachekafka-clust.82ohbb.c2.kafka.ap-south-1.amazonaws.com:9092,b-3.msk-apachekafka-clust.82ohbb.c2.kafka.ap-south-1.amazonaws.com:9092";
config.knowledgeGraphArticleMaxSize = 2
config.knowledgeGraphUrl = "https://kg.diffbot.com/kg/dql_endpoint?type=query&token=fe4c4f9e6c07673dc036cd88a7032855&size=" + config.knowledgeGraphArticleMaxSize + "&from=0&query=type"
config.knowledgeGraphKeywords = ["Mobile connection","GSM","Mobility"
    ,"Internet leased line (ILL)","MPLS","NPLC","IPLC","SDWAN",
    "Data Centre","DC","DR","Infra as a service (IAAS)","Platform as a service (PAAS)","software as a service (SAAS)","Colocation, Hosting",
    "Cloud","WFME","office 360","Mobile device management (MDM)","cloud telephony",
    "IOT","M2M","Tracking system",
    "PRI","SIP","Toll-free (TFS)"
]
config.numberOfThreadsForDiffbotProcessing = 2

//docusign config
config.accountId = '10725652';
config.ClientId = "91513002-2fad-4cb3-aa1f-4de24aaea5a4";
config.ClientSecret = "4d75e63d-6cf2-4ada-bbf3-42a7c85cb35b";
config.docusignBasePath = 'https://demo.docusign.net/restapi';
config.auditEventsUrl = 'https://demo.docusign.net/restapi/v2.1/accounts/';
config.refreshTokenUrl ='https://account-d.docusign.com/oauth/token';
config.refreshToken =  'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQoAAAABAAgABwAAk5vxgQ7YSAgAABMA6hQm2EgCAJxZkRdIGc9FiMxeJmZeuaoVAAEAAAAYAAEAAAAFAAAADQAkAAAAOTE1MTMwMDItMmZhZC00Y2IzLWFhMWYtNGRlMjRhYWVhNWE0IgAkAAAAOTE1MTMwMDItMmZhZC00Y2IzLWFhMWYtNGRlMjRhYWVhNWE0MACAEGbFtA3YSDcAXxFvTjA9w0uJFJMplSq_2w.aDwiofmPFF4UFdnwCDXl4GC98J4pL4cAbgUkNKIM27lYtZZA0vlxmKTXZp9t0I6lRscI9aTYy9N9TBcZccwN8R9ecSsDmtrq8fXHCr81m0qZoeYPdx9pr_t4oqjTiZ_fPMK3X1mRlJPdOISSFpSU8MfPNuj0B4bnsAgJstEnh6LMYdOrJ35cFoygJsygbcyWighXHihM2CEQOEhMMujZrIrZk23SAH1Gh9sG_vxwHkYTO9O5jlZ9gbSLEa-X6w5I42vk8LFQ2JcK6c78qwMjnniZp_pMnMILQ_VEkHGidCsSNXI6ZpjyX0r9NvHJoj8BZvurwJFEuM9a-oLZnd51Zw';
config.documentTypes = {
    customerApplicationForm:{
        emailSubject:'Please sign this document sent vodafone',
        emailBlurb:'Please sign this document sent vodafone',
        signHereTabs:[{
        stampType:"signature",documentId: '1',
        pageNumber: '1', recipientId: '1', tabLabel: 'SignHereTab',
        xPosition: '195', yPosition: '147'},
        {stampType:"stamp",documentId: '1',
        pageNumber: '1', recipientId: '1', tabLabel: 'SignHereTab',
        xPosition: '135', yPosition: '147'}]
    }
}

if(mode === 'testingprodissueenv') {

    //Ports Config
    config.version = 'r0';
    config.servicePort = 4000;

    //Mysql Config    
    config.masterIp = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.slave1Ip = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';

    config.dbUser = 'apiuser';
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
    config.efsPath = "/data/";

    //Kafka Configuration
    //config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
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

    config.TOPIC_ID = 21;
    config.TOPIC_NAME = 'testingprodissueenv'; //v1 is only one partition
    config.CONSUMER_GROUP_ID = 'testingprodissueenv-cg';

    //testingprodissueenv - 1 partition
    config.WIDGET_TOPIC_NAME = 'testingprodissueenv-widget';
    config.WIDGET_CONSUMER_GROUP_ID = 'testingprodissueenv-widget-cg';

    //LOGS
    //testingprodissueenv-logs 1 partition
    config.LOGS_TOPIC_NAME = 'testingprodissueenv-logs';
    config.LOGS_CONSUMER_GROUP_ID = 'testingprodissueenv-cg';

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

if(mode === 'masimukku') {

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
    config.masterIp = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.slave1Ip = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';

    config.dbUser = 'apiuser';
    config.database = 'worlddesk_staging';
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
    //config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
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
    config.TOPIC_NAME = 'masimukku-worlddesk-activities';
    config.CONSUMER_GROUP_ID = 'masimukku-worlddesk-activities-cg';

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

if(mode === 'local') {

    //Cognito
    config.cognito_region = 'ap-south-1';
    config.user_pool_id = 'ap-south-1_b7x0MLSHi';

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
    // config.masterIp = 'worlddesk-r1-master.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    // config.slave1Ip = 'worlddesk-r1-slave1.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';       
    config.masterIp = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.slave1Ip = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';

    config.dbUser = 'apiuser';
    //config.database = 'desker';// desker_staging
    // config.database = 'desker_staging';
    config.database = 'worlddesk_staging';
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

    config.redisIp = 'cache-staging.7otgcu.0001.aps1.cache.amazonaws.com';
    config.redisPort = 6379;

    //IOS Push
    config.iosPushMode = 'dev';

    //SQS Queue
    config.SQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/logs-staging"; //Staging SQS QUEUE

    //Portal Service URL & Mobile Service URL
    config.portalBaseUrl = "http://localhost:7001/";
    config.mobileBaseUrl = "http://localhost:7000/";

    //making twilio, Nexmo Calls
    config.efsPath = "/apistaging-data/";

    //Kafka Configuration
    //config.BROKER_HOST = "kafka1:9092";
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
    //config.TOPIC_ID = 8;
    //config.TOPIC_NAME = "desker-activities";
    //config.CONSUMER_GROUP_ID = 'desker-activities-consumer-group';   

    config.TOPIC_ID = 23;
    // config.TOPIC_ID = 26;
    config.TOPIC_NAME = "desker-activities-test-topic";
    // config.TOPIC_NAME = "demo-eks-test-topic";
    config.CONSUMER_GROUP_ID = 'desker-activities-test-topic-consumer-group-ben-v1';

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

    config.esmsMentionsEmail = "https://stagingweb.officedesk.app";

    config.elastiSearchNode = 'https://vpc-worlddesk-staging-wkc45fyoo6x2hjp2dppwfbdaxa.ap-south-1.es.amazonaws.com';
}

if(mode === 'dev') {

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
    //config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
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

if(mode === 'sprint') {

    //Cognito
    config.cognito_region = 'ap-south-1';
    config.user_pool_id = 'ap-south-1_24nBlFK07';

    //Ports Config
    config.version = 'r0';
    config.servicePort = 6000;
    config.standAlonePamServicePort = 6100;

    config.consumerSix = 6200;
    config.consumerOne = 6201;
    config.consumerTwo = 6202;
    config.consumerThree = 6203;
    config.consumerFour = 6204;
    config.consumerFive = 6205;

    config.sqsConsumer = 6300;

    //Mysql Config
    // config.masterIp = 'worlddesk-r1-master.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    // config.slave1Ip = 'worlddesk-r1-slave1.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';    
    //config.masterIp = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    //config.slave1Ip = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.masterIp = 'worlddesk-staging-1.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.slave1Ip = 'worlddesk-staging-1.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';

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
    ////config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
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

    config.TOPIC_ID = 24;
    config.TOPIC_NAME = 'sprint-desker-activities-msk'; //v1 is only one partition
    config.CONSUMER_GROUP_ID = 'sprint-desker-activities-msk-cg';

    //staging-desker-form-widgets-v2 - 1 partition
    config.WIDGET_TOPIC_NAME = 'sprint-desker-form-widgets';
    config.WIDGET_CONSUMER_GROUP_ID = 'sprint-desker-form-widgets-cg';

    //LOGS
    //staging-desker-logs-v2 1 partition
    config.LOGS_TOPIC_NAME = 'sprint-desker-logs';
    config.LOGS_CONSUMER_GROUP_ID = 'sprint-desker-logs-cg';

    config.CONSUMER_AUTO_COMMIT = true;
    config.CONSUMER_AUTO_COMMIT_INTERVAL = 1000;
    config.CONSUMER_FETCH_MAX_WAIT = 10;
    config.CONSUMER_FETCH_MIN_BYTES = 1;
    config.CONSUMER_FETCH_MAX_BYTES = 1048576;
    config.CONSUMER_ENCODING = "utf8";
    config.CONSUMER_KEY_ENCODING = "utf8";
    ///////////////////////////////

    config.emailbaseUrlApprove = "https://sprint.officedesk.app";
    config.emailbaseUrlUpload = "https://sprint.officedesk.app";
    //config.emailbaseUrlUpload = "https://stagingmydesk.desker.co";

    config.elastiSearchNode = 'https://vpc-worlddesk-staging-wkc45fyoo6x2hjp2dppwfbdaxa.ap-south-1.es.amazonaws.com';
}

if(mode === 'staging') {

    //Cognito
    config.cognito_region = 'ap-south-1';
    config.user_pool_id = 'ap-south-1_b7x0MLSHi';

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
    //config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
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

    //config.TOPIC_ID = 16;
    //config.TOPIC_NAME = 'staging-desker-activities-v3'; //v1 is only one partition
    //config.CONSUMER_GROUP_ID = 'staging-desker-activities-v3-cg';

    config.TOPIC_ID = 25;
    config.TOPIC_NAME = 'staging-desker-activities-msk';
    config.CONSUMER_GROUP_ID = 'staging-desker-activities-msk-cg';

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

    config.emailbaseUrlApprove = "https://stagingweb.officedesk.app";
    config.emailbaseUrlUpload = "https://stagingweb.officedesk.app";
    //config.emailbaseUrlUpload = "https://stagingmydesk.desker.co";

    // ECS microservices update
    if(
        Number(process.env.ms_mode) === 1
    ) {
        config.TOPIC_ID = 26;
        config.TOPIC_NAME = "ms-ecs-staging-v1";
        config.CONSUMER_GROUP_ID = "desker-activities-test-topic-consumer-group-v1";
        config.vodafoneServiceEndpoint = "http://staging-vodafone-service.local:3000"
    }

    config.esmsMentionsEmail = "https://stagingweb.officedesk.app";

    config.elastiSearchNode = 'https://vpc-worlddesk-staging-wkc45fyoo6x2hjp2dppwfbdaxa.ap-south-1.es.amazonaws.com';
}

if(mode === 'preprod') {

    //Cognito
    config.cognito_region = 'ap-south-1';
    config.user_pool_id = 'ap-south-1_Ccmp0pMyI';

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

    // Mysql Config
    config.masterIp = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    config.slave1Ip = 'worlddesk-staging.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    // config.masterIp = 'worlddesk-r1-master.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';
    // config.slave1Ip = 'worlddesk-r1-slave1.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';

    config.dbUser = 'apiuser';
    config.database = 'worlddesk_preprod';
    // config.database = 'desker';
    config.dbPassword = 'apidbuser';

    config.conLimit = 2;

    // Redis Config    
    config.redisIp = 'cache-preprod.7otgcu.0001.aps1.cache.amazonaws.com';
    // config.redisIp = 'cache-production.7otgcu.ng.0001.aps1.cache.amazonaws.com';
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
    //config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
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

    //config.TOPIC_ID = 11;
    //config.TOPIC_NAME = 'preprod-desker-activities-v1'; //Only one partition
    //config.CONSUMER_GROUP_ID = 'preprod-desker-activities-consumer-group-v1';

    config.TOPIC_ID = 27;
    config.TOPIC_NAME = 'preprod-desker-activities-msk'; //Only one partition
    config.CONSUMER_GROUP_ID = 'preprod-desker-activities-consumer-group-msk';

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

    config.esmsMentionsEmail = "https://preprodweb.officedesk.app";

    config.elastiSearchNode = 'https://vpc-worlddesk-staging-wkc45fyoo6x2hjp2dppwfbdaxa.ap-south-1.es.amazonaws.com';
}

if(mode === 'prod') {

    //Cognito
    config.cognito_region = 'ap-south-1';
    config.user_pool_id = 'ap-south-1_ne6W2ZavD';

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
    //config.BROKER_HOST = "kafka1:9092,kafka2:9092,kafka3:9092";
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

    //config.TOPIC_ID = 12;
    //config.TOPIC_NAME = 'prod-desker-activities-v1'; //Only one partition
    //config.CONSUMER_GROUP_ID = 'prod-desker-activities-consumer-group-v1';

    config.TOPIC_ID = 28;
    config.TOPIC_NAME = 'prod-desker-activities-msk'; //Only one partition
    config.CONSUMER_GROUP_ID = 'prod-desker-activities-consumer-group-msk';

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

    config.emailbaseUrlApprove = "https://web.officedesk.app"; //"https://officedesk.app"; 
    config.emailbaseUrlUpload = "https://web.officedesk.app";   //"https://officedesk.app";

    config.esmsMentionsEmail = "https://web.officedesk.app";

    config.elastiSearchNode = 'https://vpc-worlddesk-thg4o3ddhlkj4bbkj3tfwiky4a.ap-south-1.es.amazonaws.com';
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

//Grene Account IOS normal Push platform endpoints
config.platformApplicationIosGreneAccountPushDev = 'arn:aws:sns:ap-south-1:430506864995:app/APNS_SANDBOX/greneConnectIOSDevPush';
config.platformApplicationIosGreneAccountPushProd = 'arn:aws:sns:ap-south-1:430506864995:app/APNS/greneConnectIOSProdPush';

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

//OPENTOK
config.opentok_apiKey = "46050712";
config.opentok_apiSecret = "2ea5c758e3d625155f3cde7f42586111848b74c5";

//Cognito CLI Access
config.access_key_id = "AKIAWIPBVOFRSA6UUSRC";
config.secret_access_key = "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";
config.cognito_region = "ap-south-1";