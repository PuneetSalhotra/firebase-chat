/*
 * author: Sri Sai Venkatesh
 */

var SQS = require("../queue/sqsProducer");

function Logger() {

    var sqs = new SQS();
    var environment = '';
    
    this.setEnvironment = (mode)=>{
      //console.log('Nani from logger file');
      environment = mode;
    }
    this.write = function (level, message, request) {
        var loggerCollection = {
            message: message,
            request: request,            
            level: level,
            environment: environment //'prod'
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
