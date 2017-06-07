/**
 * author: Sri Sai Venkatesh
 */

var aws = require('aws-sdk');

// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath('/var/www/html/desker/NODEJS/desker_api_0.1/server/utils/config.json');

// Instantiate SQS.
var sqs = new aws.SQS();

function SqsProducer() {
    //var queueUrl = "https://sqs.us-east-1.amazonaws.com/430506864995/desker-logging-queue";    
    var queueUrl = "https://sqs.us-east-1.amazonaws.com/430506864995/desker-logging-staging";    

    this.produce = function (message,callback) {
        
        var params = {
            MessageBody: message,
            QueueUrl: queueUrl,
            DelaySeconds: 0
        };
        sqs.sendMessage(params, function (err, data) {
            if (err) {
                console.log(err);
                callback(true,false);
            } else {
                //console.log(data);
                //console.log("successfully written data to sqs producer");
                callback(false,true);
            }            
        });

    };
}

module.exports = SqsProducer;

