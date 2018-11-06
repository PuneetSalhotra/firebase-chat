require('../utils/globalConfig');
var aws = require('aws-sdk');
//aws.config.loadFromPath('/var/www/html/node/Bharat/server/utils/config.json');
aws.config.loadFromPath(`${__dirname}/../utils/config.json`);
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
                console.log("****** ****** messge body is: ****** ******: \n", data['Messages'][0].Body);
                //try {
                var body = data['Messages'][0].Body;
                var messageCollection = JSON.parse(body);
                console.log('messageCollection.environment :', messageCollection.environment);
                switch (messageCollection.log) {
                    case 'log':
                        console.log('LOG');
                        cassandraInterceptor.logData(messageCollection, function (err, resp) {
                            if (err === false) {
                                deleteSQSMessage(deletMesageHandle);
                            }
                        });
                        break;
                    case 'session':
                        console.log('SESSION');
                        cassandraInterceptor.logSessionData(messageCollection, function (err, resp) {
                            if (err === false) {
                                deleteSQSMessage(deletMesageHandle);
                            }
                        });
                        break;
                };
                /*} catch (e) {
                    console.log(e);
                }*/


            } else {
                //console.log("no new message yet!!");
            }
        }
    });
};

function deleteSQSMessage(deletMesageHandle) {
    params = {
        QueueUrl: global.config.SQSqueueUrl,
        ReceiptHandle: deletMesageHandle
    };

    sqs.deleteMessage(params, function (err, data) {
        (err) ? console.log(err): console.log(data);
    });
}

function checkingCassandraInstance() {
    cassandraWrapper.isConnected('log', function (err, resp) {
        if (err === false) {
            consume();
        } else {
            console.log('Cassandra is Down!');
        }
    })
}


process.on('uncaughtException', (err) => {
    console.log(`process.on(uncaughtException): ${err}\n`);
    //throw new Error('uncaughtException');
});

process.on('error', (err) => {
    console.log(`process.on(error): ${err}\n`);
    throw new Error('error');
});

setInterval(checkingCassandraInstance, 20);

var http = require('http')
http.createServer((req, res) => {
    res.write('I am Alive');
    res.end();
}).listen(global.config.sqsConsumer);
