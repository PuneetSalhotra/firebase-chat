/*
 * author: Sri Sai Venkatesh
 */

var SQS = require("../queue/sqsProducer");
var Util = require('./util');

function Logger() {

    var sqs = new SQS();
    var util = new Util();

    /*var winston = require('winston');
    require('winston-daily-rotate-file');

    var transport = new (winston.transports.DailyRotateFile)({
      filename: './logs/' + '%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      //zippedArchive: true,
      //maxSize: '20m',
      //maxFiles: '14d'
    });

    transport.on('rotate', function(oldFilename, newFilename) {
      // do something fun
    });

    var logger = new (winston.Logger)({
      transports: [
        transport
      ]
    });*/

    this.write = function (level, message, object, request) {
        var loggerCollection = {
            message: message,
            object: object,
            level: level,
            request: request,
            environment: global.mode, //'prod'
            log: 'log'
        };
        util.writeLogs(message); //Using our own logic
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
