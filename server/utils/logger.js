/*
 * author: Sri Sai Venkatesh
 */

var SQS = require("../queue/sqsProducer");

function Logger() {

    var sqs = new SQS();
    
    this.write = function (message, request, level) {
        
        var loggerCollection = {
            message: message,
            request: request,            
            level: level
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
