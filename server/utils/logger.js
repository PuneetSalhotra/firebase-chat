/*
 * author: Sri Sai Venkatesh
 */

var SQS = require("../queue/sqsProducer");

function Logger() {

    var sqs = new SQS();    
    
    this.write = function (level, message, object,request) {
        var loggerCollection = {
            message: message,
            object: object,            
            level: level,
            request: request,
            environment: global.mode //'prod'
        };
        var loggerCollectionString = JSON.stringify(loggerCollection);
        sqs.produce(loggerCollectionString, function (err, response) {
            if(err)
                console.log("error is: "+ err);
            });
    };
}
;
module.exports = Logger;
