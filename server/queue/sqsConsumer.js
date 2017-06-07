var aws = require('aws-sdk');
aws.config.loadFromPath('/var/www/html/desker/NODEJS/desker_api_0.1/server/utils/config.json');
//var queueUrl = "https://sqs.us-east-1.amazonaws.com/430506864995/desker-logging-queue";
var queueUrl = "https://sqs.us-east-1.amazonaws.com/430506864995/desker-logging-staging";
var sqs = new aws.SQS();
var CassandraWrapper = require('../utils/cassandraWrapper');
var cassandraCredentials = {
    ip: '34.192.228.175',
    user: 'aamir',
    pwd: 'foxtrot88',
    keyspace: 'deskerlog'
};
var Util = require('../utils/util');
var util = new Util();
var cassandraWrapper = new CassandraWrapper(cassandraCredentials, util);

var consume = function () {
    var params = {
        QueueUrl: queueUrl,
        VisibilityTimeout: 60 // 10 min wait time for anyone else to process.
    };

    sqs.receiveMessage(params, function (err, data) {
        if (err) {
            console.log("sqs message reception error ");
            console.log(err);
        } else {
            if (data.hasOwnProperty("Messages")) {

                var deletMesageHandle = data['Messages'][0].ReceiptHandle;
                //console.log("messge body is: "+ data['Messages'][0].Body);
                try {
                    var body = data['Messages'][0].Body;
                    var messageCollection = JSON.parse(body);
                    cassandraWrapper.logData(messageCollection);

                } catch (e) {
                    console.log(e);
                }

                params = {
                    QueueUrl: queueUrl,
                    ReceiptHandle: deletMesageHandle
                };
                sqs.deleteMessage(params, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        //console.log(data);
                    }
                });
            } else {
                //console.log("no new message yet!!");
            }


        }
    });
};

setInterval(consume, 500);
