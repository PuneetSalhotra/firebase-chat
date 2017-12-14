require('../utils/globalConfig');
var aws = require('aws-sdk');
aws.config.loadFromPath('/var/www/html/node/Bharat/server/utils/config.json');
var CassandraWrapper = require('../utils/cassandraWrapper');
var CassandraInterceptor = require('../interceptors/cassandraInterceptor');
var Util = require('../utils/util');

var sqs = new aws.SQS();
var util = new Util();
var cassandraWrapper = new CassandraWrapper();
var cassandraInterceptor = new CassandraInterceptor(util, cassandraWrapper);


var consume = function () {
    var params = {
        QueueUrl: global.config.SQSqueueUrl,
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
                    //console.log(messageCollection);
                    switch (messageCollection.log) {
                        case 'log':
                            console.log('LOG');
                            cassandraInterceptor.logData(messageCollection);
                            break;
                        case 'session':
                            console.log('SESSION');
                            cassandraInterceptor.logSessionData(messageCollection);
                            break;
                    }
                    ;
                } catch (e) {
                    console.log(e);
                }

                params = {
                    QueueUrl: global.config.SQSqueueUrl,
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

setInterval(consume, 1000);
