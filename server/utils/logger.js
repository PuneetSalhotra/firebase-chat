/*
 * author: Sri Sai Venkatesh
 */

var SQS = require("../queue/sqsProducer");
var Util = require('./util');

function Logger() {

    var sqs = new SQS();
    var util = new Util();

    this.write = function (level, message, object, request) {
        var isTargeted = false;
        var loggerCollection = {
            message: message,
            object: object,
            level: level,
            request: request,
            environment: global.mode, //'prod'
            log: 'log'
        };

        if (request.hasOwnProperty('isTargeted') && request.isTargeted) {
            isTargeted = true;
        
        } 

        //util.writeLogs(message, isTargeted); //Using our own logic
        util.writeLogs(message, isTargeted);
        logger.debug(message);

        //logger.info(message); //Winston rotational logs
        var loggerCollectionString = JSON.stringify(loggerCollection);
        sqs.produce(loggerCollectionString, function (err, response) {
            if (err)
                console.log("error is: " + err);
        });
    };

    this.writeSession = function (request) {
        var loggerCollection = {
            message: request,
            request: request,
            environment: global.mode, //'prod'
            log: 'session'
        };
        var loggerCollectionString = JSON.stringify(loggerCollection);
        sqs.produce(loggerCollectionString, function (err, response) {
            if (err)
                console.log("error is: " + err);
        });
    };
};
module.exports = Logger;
