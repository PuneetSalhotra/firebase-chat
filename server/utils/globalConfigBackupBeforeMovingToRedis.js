/* 
 * author: V Nani Kalyan
 */

//mode = process.env.mode;
mode = process.env.NODE_ENV;
// mode = "local";
//var Logger = require(`${__dirname}/logger.js`);
//logger = new Logger();


config = {};

//razorpay configuration
config.razorpayMerchantId = "GpdQxFFvBJpwGH";
config.razorpayApiId = "rzp_test_EKiobaL8CXxuzm";
config.razorpayApiKey = "U8iSqeNexlYFCMEqNnl9Ik82";

config.accountSid = 'ACbe16c5becf34df577de71b253fa3ffe4';
config.authToken = "73ec15bf2eecd3ead2650d4d6768b8cd";
config.privateKey = '>qu6#y&(7Qj}>edm!'
config.domestic_sms_mode = 3; //  Domestic - 1: Mvaayo | 2: bulkSMS  |   3: Sinfini
config.international_sms_mode = 1; //  1: Twilio | 2: Nexmo
config.phone_call = 1; // both Domestic and International 1: Nexmo | 2: Twilio

config.BROKER_HOST = "b-1.msk-apachekafka-clust.mpbfxt.c2.kafka.ap-south-1.amazonaws.com:9092,b-2.msk-apachekafka-clust.mpbfxt.c2.kafka.ap-south-1.amazonaws.com:9092,b-3.msk-apachekafka-clust.mpbfxt.c2.kafka.ap-south-1.amazonaws.com:9092";
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
config.refreshTokenUrl = 'https://account-d.docusign.com/oauth/token';
config.sessionSecret = '12345';
config.production = false;
config.tokenSecret = 'LJHDJAS67567%7677SDKLKJSL';
config.allowSilentAuthentication = true
config.documentTypes = {
    customerApplicationForm: {
        emailSubject: 'Please sign this document sent vodafone',
        emailBlurb: 'Please sign this document sent vodafone',
        "tabs": {
            signHereTabs: [{
                stampType: "signature",documentId: '1',
                pageNumber: '1',recipientId: '1',tabLabel: 'SignHereTab',
                xPosition: '500',yPosition: '508'
            },
            {
                stampType: "signature",documentId: '1',
                pageNumber: '1',recipientId: '1',tabLabel: 'SignHereTab',
                xPosition: '510',yPosition: '220'
            },
            {
                stampType: "stamp",documentId: '1',
                pageNumber: '1',recipientId: '1',tabLabel: 'SignHereTab',
                xPosition: '500',yPosition: '565'
            },
            {
                stampType: "stamp",documentId: '1',
                pageNumber: '1',recipientId: '1',tabLabel: 'SignHereTab',
                xPosition: '500',yPosition: '200'
            }
            ],
            textTabs: [{
                tabLabel: "Photo",value: "Affix Photograph",locked: "true",
                xPosition: "470",yPosition: "270",
                documentId: "1",pageNumber: "1"
            }]
        }
    },
    vodafone: {
        emailSubject: 'Please sign this  vodafone document',
        emailBlurb: 'Please sign this vodafone document',
        "tabs": {
            signHereTabs: [{
                stampType: "signature",documentId: '1',
                pageNumber: '1',recipientId: '1',tabLabel: 'SignHereTab',
                xPosition: '195',yPosition: '147'
            },
            {
                stampType: "stamp",documentId: '1',
                pageNumber: '1',recipientId: '1',tabLabel: 'SignHereTab',
                xPosition: '135',yPosition: '177'
            },{
                stampType: "signature",documentId: '1',
                pageNumber: '2',recipientId: '1',tabLabel: 'SignHereTab',
                xPosition: '195',yPosition: '147'
            },
            {
                stampType: "stamp",documentId: '1',
                pageNumber: '2',recipientId: '1',tabLabel: 'SignHereTab',
                xPosition: '135',yPosition: '177'
            }]
        }
    }
}

config.masterIp = "";
config.masterDBUser = "";
config.masterDBPassword = "";
config.masterDatabase = "";

config.slave1Ip = "";
config.slave1Database = "";
config.slave1DBUser = "";
config.slave1DBPassword = "";
config.transactionsLogsDatabase = "";

config.slave2Ip = "";

// codes to switch the slave to master in case of errors
config.mysqlConnectionErrors = {
    ENOTFOUND: 1,
    EHOSTUNREACH: 1,
    PROTOCOL_SEQUENCE_TIMEOUT: 1,
    ECONNREFUSED: 1,
    ER_ACCESS_DENIED_ERROR: 1,
    ER_DBACCESS_DENIED_ERROR: 1,
    ER_SP_DOES_NOT_EXIST: 1,
    POOL_NONEONLINE: 1
}

config.elasticActivityAssetTable = 'activity_asset_search_mapping';
config.elasticActivitySearchTable = 'activity_search_mapping';
config.elasticCrawlingAccountTable = 'crawling_accounts';
config.elasticVidmTable = 'vidm';
config.elasticCrawlingGroupAccounts = 'crawling_group_accounts';
config.roleMappingElastic = [142898, 144143, 144142, 144144, 145183, 145184, 142986,153656,153657,153658,153659,153660,153661];

config.dbURLKeys = ["MASTER_IP","MASTER_DB_NAME", "MASTER_DB_USER","MASTER_DB_PASSWORD", "SLAVE1_IP","SLAVE1_DB_NAME","SLAVE1_DB_USER","SLAVE1_DB_PASSWORD", "SLAVE2_IP"];

if(mode === 'testingprodissueenv') {

    //Ports Config
    config.version = 'r0';
    config.servicePort = 4000;


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
    config.whitelist = [
        "https://staging.officedesk.app",
        "https://stagingmanagement.officedesk.app",
        "https://stagingweb.officedesk.app",
        "https://stagingdashboard2.officedesk.app",
        "https://stagingdashboard.officedesk.app",
        "https://stagingoffice.greneos.com",
        "https://stagingweb.greneos.com",
        "https://stagingdashboard.greneos.com",
        "https://stagingdashboard2.greneos.com",
        'http://127.0.0.1',
        'http://localhost:3000',
    ];

}

if(mode === 'local') {

    //AWS SQS Email Configuration
    config.aws_sqs_email_accessKeyId = "AKIAWIPBVOFRQ2HPP4F3";
    config.aws_sqs_email_secretAccessKey = "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";
    config.aws_sqs_email_region = "ap-south-1";
    config.emailSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/ews-engine-mail";
    config.smpEmailSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/ews-engine-mail-smp";

    //Cognito
    config.cognito_region = 'ap-south-1';
    config.user_pool_id = 'ap-south-1_b7x0MLSHi';
    config.user_web_pool_id = 'ap-south-1_9vPl6RcPo';
    config.customer_pool_id = 'ap-south-1_Bp2kNOKl8';
    config.pam_user_pool_id = "ap-south-1_b7d7a47VM"; // pam mobile and web common login


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

    config.conLimit = 5;

    //Log Mysql Config
    // config.logMasterIp = 'worlddesk-r1-log.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';    
    config.logMasterIp = '10.0.0.169';
    config.logDatabase = 'worlddesk_log_staging';
    config.logDbPassword = 'Apidbuser_123';

    //Redis Config
    //config.redisIp = '127.0.0.1';
    //config.redisPort = 6379;  

    //config.redisIp = 'cache-staging.7otgcu.0001.aps1.cache.amazonaws.com';
    config.redisIp = 'localhost';
    config.redisPort = 6379;

    config.redisConfig = {
        "auth": "",
        "host": "10.0.1.226",
        "name": "staging server",
        "port": 6379,
        "ssh_host": "10.0.0.11",
        "ssh_password": "vVg\"3XM{",
        "ssh_user": "nanikalyan",
        "timeout_connect": 60000,
        "timeout_execute": 60000
    };

    //IOS Push
    config.iosPushMode = 'dev';

    //SQS Queue
    config.SQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/logs-staging"; //Staging SQS QUEUE
    config.ChildOrdersSQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/local-child-orders-creation-v1.fifo";
    config.elasticSearchFailedEntriesSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/staging-elastic-search-failed-entries-v1.fifo";
    config.elasticSearchEntriesSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/staging-elastic-search-entries-v1.fifo";
    
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

    config.TOPIC_ID = 38;
    // config.TOPIC_ID = 26;
    config.TOPIC_NAME = "desker-activities-sravan-test-topic";
    // config.TOPIC_NAME = "demo-eks-test-topic";
    config.CONSUMER_GROUP_ID = 'desker-activities-test-topic-consumer-group-ben-v1';

    //Widget
    config.WIDGET_TOPIC_NAME = 'desker-form-widgets';
    config.WIDGET_CONSUMER_GROUP_ID = 'staging-desker-activities-widget-cg';

    //LOGS
    config.LOGS_TOPIC_NAME = 'desker-logs';
    config.LOGS_CONSUMER_GROUP_ID = 'desker-logs-cg';

    //Child Order Creation
    config.CHILD_ORDER_TOPIC_NAME = "local-desker-child-order-creation-v1";

    config.CONSUMER_AUTO_COMMIT = true;
    config.CONSUMER_AUTO_COMMIT_INTERVAL = 1000;
    config.CONSUMER_FETCH_MAX_WAIT = 10;
    config.CONSUMER_FETCH_MIN_BYTES = 1;
    config.CONSUMER_FETCH_MAX_BYTES = 1048576;
    config.CONSUMER_ENCODING = "utf8";
    config.CONSUMER_KEY_ENCODING = "utf8";
    ///////////////////////////////  
    config.pamApplicationUrl = "http://localhost:3000/payment-response/";

    config.emailbaseUrlApprove = "https://stagingmydesk.desker.co";
    config.emailbaseUrlUpload = "https://stagingmydesk.desker.co";

    config.esmsMentionsEmail = "https://stagingweb.officedesk.app";

    config.elastiSearchNode = 'https://vpc-worlddesk-staging-wkc45fyoo6x2hjp2dppwfbdaxa.ap-south-1.es.amazonaws.com';
    config.docusignWebApp = "https://sprintweb.greneos.com";
    // config.docusignWebApp = "https://preprodweb.officedesk.app";
    config.docusignHookBaseUrl = 'https://stagingapi.worlddesk.cloud';

    config.excelBotSQSQueue = 'https://sqs.ap-south-1.amazonaws.com/430506864995/staging-vil-excel-job-queue.fifo';

    config.sqsConsumerSQSQueue = "https://sqs.ap-south-1.amazonaws.com/430506864995/local-bot-engine-queue-v1.fifo";
    config.sqsConsumerSQSQueueId = 69;

    config.whitelist = [
        "https://staging.officedesk.app",
        "https://stagingmanagement.officedesk.app",
        "https://stagingweb.officedesk.app",
        "https://stagingdashboard2.officedesk.app",
        "https://stagingdashboard.officedesk.app",
        "https://stagingoffice.greneos.com",
        "https://stagingweb.greneos.com",
        "https://stagingdashboard.greneos.com",
        "https://stagingdashboard2.greneos.com",
        'http://127.0.0.1',
        'http://localhost:3000',
        'https://d1g3r3ihuqqg05.cloudfront.net'
    ];

    config.elasticActivityAssetTable = 'activity_asset_search_mapping_s';
    config.elasticActivitySearchTable = 'activity_search_mapping_s';
    config.elasticCrawlingAccountTable = 'crawling_accounts_s';
    config.elasticVidmTable = 'vidm_s';
    config.elasticCrawlingGroupAccounts = 'crawling_group_accounts_s';
    config.roleMappingElastic = [142898, 144143, 144142, 144144, 145183, 145184, 142986,153656,153657,153658,153659,153660,153661]
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
    config.whitelist = [
        "https://staging.officedesk.app",
        "https://stagingmanagement.officedesk.app",
        "https://stagingweb.officedesk.app",
        "https://stagingdashboard2.officedesk.app",
        "https://stagingdashboard.officedesk.app",
        "https://stagingoffice.greneos.com",
        "https://stagingweb.greneos.com",
        "https://stagingdashboard.greneos.com",
        "https://stagingdashboard2.greneos.com",
        'http://127.0.0.1',
        'http://localhost:3000',
        'https://d1g3r3ihuqqg05.cloudfront.net/'
    ];

}

if(mode === 'demo') {

    //Cognito
    config.cognito_region = 'ap-south-1';
    config.user_pool_id = 'ap-south-1_FS3ysb0GG';
    config.user_web_pool_id = '';
    //Ports Config
    config.version = 'r0';
    config.servicePort = 8000;
    config.standAlonePamServicePort = 6100;


    config.conLimit = 2;

    //Log Mysql Config
    // config.logMasterIp = 'worlddesk-r1-log.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';    
    config.logMasterIp = '10.0.0.169';
    config.logDatabase = 'worlddesk_log_staging';
    config.logDbPassword = 'Apidbuser_123';

    //Redis Config    
    //config.redisIp = 'cache-demo.7otgcu.0001.aps1.cache.amazonaws.com';
    config.redisIp = 'localhost';
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

    config.TOPIC_ID = 58;
    config.TOPIC_NAME = 'desker-activities-demo-topic';
    config.CONSUMER_GROUP_ID = 'demo-desker-activities-msk-cg';

    //staging-desker-form-widgets-v2 - 1 partition
    config.WIDGET_TOPIC_NAME = 'demo-desker-form-widgets';
    config.WIDGET_CONSUMER_GROUP_ID = 'demo-desker-form-widgets-cg';

    //LOGS
    //staging-desker-logs-v2 1 partition
    config.LOGS_TOPIC_NAME = 'demo-desker-logs';
    config.LOGS_CONSUMER_GROUP_ID = 'demo-desker-logs-cg';

    config.CONSUMER_AUTO_COMMIT = true;
    config.CONSUMER_AUTO_COMMIT_INTERVAL = 1000;
    config.CONSUMER_FETCH_MAX_WAIT = 10;
    config.CONSUMER_FETCH_MIN_BYTES = 1;
    config.CONSUMER_FETCH_MAX_BYTES = 1048576;
    config.CONSUMER_ENCODING = "utf8";
    config.CONSUMER_KEY_ENCODING = "utf8";
    ///////////////////////////////

    config.emailbaseUrlApprove = "https://demo.officedesk.app";
    config.emailbaseUrlUpload = "https://demo.officedesk.app";

    config.elastiSearchNode = 'https://vpc-worlddesk-staging-wkc45fyoo6x2hjp2dppwfbdaxa.ap-south-1.es.amazonaws.com';
    config.excelBotSQSQueue = 'https://sqs.ap-south-1.amazonaws.com/430506864995/staging-vil-excel-job-queue.fifo';
    config.whitelist = [
        "https://demo.officedesk.app",
        "https://demomanagement.officedesk.app",
        "https://demoweb.officedesk.app",
        "https://demodashboard2.officedesk.app",
        "https://demodashboard.officedesk.app",
        "https://demooffice.greneos.com",
        "https://demoweb.greneos.com",
        "https://demodashboard.greneos.com",
        "https://demodashboard2.greneos.com",
        "https://demooffice.greneos.com",
        "https://sprintweb.greneos.com",
        "https://sprintdashboard.greneos.com",
        "https://sprintdashboard2.greneos.com",
        'http://127.0.0.1',
        'http://localhost:3000',
        "https://d1g3r3ihuqqg05.cloudfront.net/"
    ];
}

if(mode === 'sprint') {

    //Cognito
    config.cognito_region = 'ap-south-1';
    config.user_pool_id = 'ap-south-1_24nBlFK07';
    config.user_web_pool_id = '';
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

    config.conLimit = 2;

    //Log Mysql Config
    // config.logMasterIp = 'worlddesk-r1-log.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';    
    config.logMasterIp = '10.0.0.169';
    config.logDatabase = 'worlddesk_log_staging';
    config.logDbPassword = 'Apidbuser_123';

    //Redis Config    
    //config.redisIp = 'cache-demo.7otgcu.0001.aps1.cache.amazonaws.com';
    config.redisIp = 'localhost';
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

    config.TOPIC_ID = 57;
    //config.TOPIC_NAME = 'sprint-desker-activities-msk'; //v1 is only one partition
    config.TOPIC_NAME = 'desker-activities-partitiontest-topic';
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
    config.excelBotSQSQueue = 'https://sqs.ap-south-1.amazonaws.com/430506864995/staging-vil-excel-job-queue.fifo';
    config.whitelist = [
        "https://staging.officedesk.app",
        "https://stagingmanagement.officedesk.app",
        "https://stagingweb.officedesk.app",
        "https://stagingdashboard2.officedesk.app",
        "https://stagingdashboard.officedesk.app",
        "https://stagingoffice.greneos.com",
        "https://stagingweb.greneos.com",
        "https://stagingdashboard.greneos.com",
        "https://stagingdashboard2.greneos.com",
        "https://sprintoffice.greneos.com",
        "https://sprintweb.greneos.com",
        "https://sprintdashboard.greneos.com",
        "https://sprintdashboard2.greneos.com",
        'http://127.0.0.1',
        'http://localhost:3000',
    ];
}

if(mode === 'staging') {
    
    //AWS SQS Email Configuration
    config.aws_sqs_email_accessKeyId = "AKIAWIPBVOFRQ2HPP4F3";
    config.aws_sqs_email_secretAccessKey = "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";
    config.aws_sqs_email_region = "ap-south-1";
    config.emailSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/ews-engine-mail";
    config.smpEmailSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/ews-engine-mail-smp";

    //Cognito
    config.cognito_region = 'ap-south-1';
    config.user_pool_id = 'ap-south-1_b7x0MLSHi'; // phone number
    config.user_web_pool_id = 'ap-south-1_9vPl6RcPo'; // email and phone number
    config.customer_pool_id = 'ap-south-1_Bp2kNOKl8';

    config.pam_user_pool_id = "ap-south-1_b7d7a47VM";

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


    config.conLimit = 2;

    //Log Mysql Config
    // config.logMasterIp = 'worlddesk-r1-log.cgbemsumnr3x.ap-south-1.rds.amazonaws.com';    
    config.logMasterIp = '10.0.0.169';
    config.logDatabase = 'worlddesk_log_staging';
    config.logDbPassword = 'Apidbuser_123';

    //Redis Config    
    //config.redisIp = 'cache-staging.7otgcu.0001.aps1.cache.amazonaws.com';
    config.redisIp = '10.0.1.226';
    config.redisPort = 6379;

    //IOS Push
    config.iosPushMode = 'dev'; // currently shouuld be in dev

    //SQS Queue
    config.SQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/logs-staging"; //Staging SQS QUEUE
    config.ChildOrdersSQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/staging-child-orders-creation-v1.fifo";
    config.elasticSearchFailedEntriesSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/staging-elastic-search-failed-entries-v1.fifo";
    config.elasticSearchEntriesSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/staging-elastic-search-entries-v1.fifo";
    
    //Portal Service URL & Mobile Service URL
    config.portalBaseUrl = "https://stagingportal.worlddesk.cloud/";
    config.mobileBaseUrl = "https://stagingapi.worlddesk.cloud/";

    config.pamApplicationUrl = "https://staging.thepamapp.com/payment-response/";

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

    config.TOPIC_ID = 55;
    config.TOPIC_NAME = 'staging-desker-activities-msk';
    config.CONSUMER_GROUP_ID = 'staging-desker-activities-msk-cg';

    //staging-desker-form-widgets-v2 - 1 partition
    config.WIDGET_TOPIC_NAME = 'staging-desker-form-widgets-v2';
    config.WIDGET_CONSUMER_GROUP_ID = 'staging-desker-form-widgets-v2-cg-new';

    //LOGS
    //staging-desker-logs-v2 1 partition
    config.LOGS_TOPIC_NAME = 'staging-desker-logs-v3';
    config.LOGS_CONSUMER_GROUP_ID = 'staging-desker-logs-v3-cg';

    //Child Order Creation
    config.CHILD_ORDER_TOPIC_NAME = "staging-desker-child-order-creation-v1";

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

    //config.esmsMentionsEmail = "https://stagingweb.officedesk.app";
    config.esmsMentionsEmail = "https://stagingweb.greneos.com";

    config.elastiSearchNode = 'https://vpc-worlddesk-staging-wkc45fyoo6x2hjp2dppwfbdaxa.ap-south-1.es.amazonaws.com';
    config.docusignWebApp = "https://stagingweb2.greneos.com";
    config.docusignHookBaseUrl = 'https://stagingapi.worlddesk.cloud';

    config.excelBotSQSQueue = 'https://sqs.ap-south-1.amazonaws.com/430506864995/staging-vil-excel-job-queue.fifo';

    config.sqsConsumerSQSQueue = "https://sqs.ap-south-1.amazonaws.com/430506864995/staging-bot-engine-queue-v1.fifo";
    config.sqsConsumerSQSQueueId = 70;

    config.whitelist = [
        "https://staging.officedesk.app",
        "https://stagingmanagement.officedesk.app",
        "https://stagingweb.officedesk.app",
        "https://stagingdashboard2.officedesk.app",
        "https://stagingdashboard.officedesk.app",
        "https://stagingoffice.greneos.com",
        "https://stagingweb.greneos.com",
        "https://stagingdashboard.greneos.com",
        "https://stagingdashboard2.greneos.com",
        "https://sprintoffice.greneos.com",
        "https://sprintweb.greneos.com",
        "https://sprintdashboard.greneos.com",
        "https://sprintdashboard2.greneos.com",
        "http://127.0.0.1",
        "http://localhost:3000",
        "http://localhost:5000",
        "https://stagingmanagement.greneos.com",
        "https://d1g3r3ihuqqg05.cloudfront.net",
        "http://d1g3r3ihuqqg05.cloudfront.net",
        "https://vibusinesshub.myvi.in",
        "http://vibusinesshub.myvi.in" 
    ];
    config.elasticActivityAssetTable = 'activity_asset_search_mapping_s';
    config.elasticActivitySearchTable = 'activity_search_mapping_s';
    config.elasticCrawlingAccountTable = 'crawling_accounts_s';
    config.elasticVidmTable = 'vidm_s';
    config.elasticCrawlingGroupAccounts = 'crawling_group_accounts_s';
    config.roleMappingElastic = [142898, 144143, 144142, 144144, 145183, 145184, 142986,153656,153657,153658,153659,153660,153661]
}

if(mode === 'preprod') {

    //AWS SQS Email Configuration
    config.aws_sqs_email_accessKeyId = "AKIAWIPBVOFRQ2HPP4F3";
    config.aws_sqs_email_secretAccessKey = "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";
    config.aws_sqs_email_region = "ap-south-1";
    config.emailSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/ews-engine-mail";
    config.smpEmailSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/ews-engine-mail-smp";

    //Cognito
    config.cognito_region = 'ap-south-1';
    config.user_pool_id = 'ap-south-1_Ccmp0pMyI';
    config.user_web_pool_id = 'ap-south-1_jeS0OISHP';
    config.customer_pool_id = 'ap-south-1_nk2Ek2BmZ';
    config.pam_user_pool_id = ""; // pam mobile and web common login



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


    config.conLimit = 2;

    // Redis Config    
    config.redisIp = 'cache-preprod.7otgcu.0001.aps1.cache.amazonaws.com';
    // config.redisIp = 'cache-production.7otgcu.ng.0001.aps1.cache.amazonaws.com';
    config.redisPort = 6379;

    //IOS Push
    config.iosPushMode = 'prod';

    //SQS Queue
    config.SQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/logs-production";
    config.ChildOrdersSQSqueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/preprod-child-orders-creation-v1.fifo";
    config.elasticSearchFailedEntriesSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/preprod-elastic-search-failed-entries-v1.fifo";
    config.elasticSearchEntriesSQSQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/preprod-elastic-search-entries-v1.fifo";
    
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

    config.TOPIC_ID = 56;
    config.TOPIC_NAME = 'preprod-desker-activities-msk'; //Only one partition
    config.CONSUMER_GROUP_ID = 'preprod-desker-activities-consumer-group-msk';

    //WIDGETS    
    config.WIDGET_TOPIC_NAME = 'preprod-desker-form-widgets-v1'; //Only one partition
    config.WIDGET_CONSUMER_GROUP_ID = 'preprod-desker-form-widgets-v1-cg';

    //LOGS    
    config.LOGS_TOPIC_NAME = 'preprod-desker-logs-v1'; //Only one partition
    config.LOGS_CONSUMER_GROUP_ID = 'preprod-desker-logs-v1-cg';

    //Child Order Creation
    config.CHILD_ORDER_TOPIC_NAME = "preprod-desker-child-order-creation-v1";

    //ESMS Integrations trigger topic
    config.ESMS_INTEGRATIONS_TOPIC = "staging-vil-esms-ibmmq-v3";

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

    //config.esmsMentionsEmail = "https://preprodweb.officedesk.app";
    config.esmsMentionsEmail = "https://preprodweb.greneos.com";

    config.elastiSearchNode = 'https://vpc-worlddesk-staging-wkc45fyoo6x2hjp2dppwfbdaxa.ap-south-1.es.amazonaws.com';
    config.docusignWebApp = "https://preprodweb2.greneos.com";

    config.excelBotSQSQueue = 'https://sqs.ap-south-1.amazonaws.com/430506864995/preprod-vil-excel-job-queue.fifo';

    config.sqsConsumerSQSQueue = "https://sqs.ap-south-1.amazonaws.com/430506864995/preprod-bot-engine-queue-v1.fifo";
    config.sqsConsumerSQSQueueId = 71;

    config.whitelist = [
        "https://preprod.officedesk.app",
        "https://preprodmanagement.officedesk.app",
        "https://preprodweb.officedesk.app",
        "https://preproddashboard2.officedesk.app",
        "https://preproddashboard.officedesk.app",
        "https://preprodoffice.greneos.com",
        "https://preprodweb.greneos.com",
        "https://preproddashboard.greneos.com",
        "https://preproddashboard2.greneos.com",
        "https://preprodmanagement.greneos.com",
        'http://localhost:3000',
        'http://localhost:5000',
        "https://d1g3r3ihuqqg05.cloudfront.net",
        "http://d1g3r3ihuqqg05.cloudfront.net",
        "https://vibusinesshub.myvi.in",
        "http://vibusinesshub.myvi.in" 
    ];
    config.elasticActivityAssetTable = 'activity_asset_search_mapping';
    config.elasticActivitySearchTable = 'activity_search_mapping';
    config.elasticCrawlingAccountTable = 'crawling_accounts';
    config.elasticVidmTable = 'vidm';
    config.elasticCrawlingGroupAccounts = 'crawling_group_accounts';
    config.roleMappingElastic = [142898, 144143, 144142, 144144, 145183, 145184, 142986,146764, 146765, 146766, 146767, 146768, 146769,147251]
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
config.access_key_id = "AKIAWIPBVOFRSH7MXHJY";
config.secret_access_key = "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";
config.cognito_region = "ap-south-1";
//Gallabox Whatsapp
config.gallaboxApiCredentials = {
    "apiSecret":'36b2de6f5af943acabda05cece696fb3',
    "apiKey": '61af21eeef52e800049bf811',
    "ContentType": 'application/json'
};

config.gallaboxurl='https://server.gallabox.com/devapi/messages/whatsapp';
config.gallaboxChannelId="61a9b44216fc4c0004b14d13";
//pam order track link
config.ordertracklink="https://staging.thepamapp.com/track-order/";