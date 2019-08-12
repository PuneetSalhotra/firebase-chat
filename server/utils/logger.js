/*
 * author: Sri Sai Venkatesh
 */

//var SQS = require("../queue/sqsProducer");
var Util = require('./util');
const logger = require("../logger/winstonLogger");

function Logger(queueWrapper) {

    //let sqs = new SQS();
    let util = new Util();

    let logLevel = {
        request: 1,
        response: 2,
        debug: 3,
        warning: 4,
        trace: 5,
        appError: 6,
        serverError: 7,
        fatal: 8,
        dbResponse: 9,
        cacheResponse: 10,
        conLog: 11
    };

    this.write = function (level, message, object, request) {
        var isTargeted = false;

        let loggerCollection = {
            message: message,
            object: object,
            levelId: logLevel[level],
            level: level,
            request: request,
            environment: global.mode, //'prod'
            log: 'log'
        };

        try {
            if ((typeof request === 'object') && request.hasOwnProperty('isTargeted') && request.isTargeted) {
                isTargeted = true;
            }
        } catch (error) {
            // 
        }

        // Textual Logs
        // util.writeLogs(message, isTargeted);
        logger.silly(message, { type: 'legacy_logs', miscellaneous: object, request_body: request });

        //Logs pushing to Kafka
        switch (level) {
            case 'conLog':
                if ((typeof object === 'object')) {
                    if (Object.keys(object).length > 0) {
                        // eslint-disable-next-line no-console
                        // console.log(object);
                    }
                } else {
                    // eslint-disable-next-line no-console
                    // console.log(object);
                }
                break;
            default:
                queueWrapper.raiseLogEvent(loggerCollection).then(() => {});
        }


        /*try {
            let loggerCollectionString = JSON.stringify(loggerCollection);
            
            switch (level) {
                case 'conLog':
                    break;

                default:
                    sqs.produce(loggerCollectionString, function (err, response) {
                        if (err)
                            console.log("error is: " + err);
                    });
                    break;
            }
        } catch(e) {
            
        }*/

    };

    this.writeSession = function (request) {
        var loggerCollection = {
            message: request,
            request: request,
            environment: global.mode, //'prod'
            log: 'session'
        };
        /*var loggerCollectionString = JSON.stringify(loggerCollection);
        sqs.produce(loggerCollectionString, function (err, response) {
            if (err)
                console.log("error is: " + err);
        });*/
    };
}

module.exports = Logger;
