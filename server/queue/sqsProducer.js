/**
 * author: Sri Sai Venkatesh
 */

let aws = require('aws-sdk');

// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath(`${__dirname}/../utils/config.json`);

// Instantiate SQS.
let sqs = new aws.SQS();

function SqsProducer() {

    this.produce = function (message, callback) {

        let params = {
            MessageBody: message,
            QueueUrl: global.config.SQSqueueUrl,
            DelaySeconds: 0
        };
        sqs.sendMessage(params, function (err, data) {
            if (err) {
                console.log(err);
                callback(true, false);
            } else {
                //console.log(data);
                callback(false, data);
            }
        });

    };
}

module.exports = SqsProducer;
