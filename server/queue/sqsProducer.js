/**
 * author: Sri Sai Venkatesh
 */

var aws = require('aws-sdk');

// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath('/var/www/html/node/Bharat/server/utils/config.json');

// Instantiate SQS.
var sqs = new aws.SQS();

function SqsProducer() {
   
    this.produce = function (message,callback) {
        
        var params = {
            MessageBody: message,
            QueueUrl: global.config.SQSqueueUrl,
            DelaySeconds: 0
        };
        sqs.sendMessage(params, function (err, data) {
            if (err) {
                console.log(err);
                callback(true,false);
            } else {
                //console.log(data);
                //console.log("successfully written data to sqs producer");
                callback(false,data);
            }            
        });

    };
}

module.exports = SqsProducer;
