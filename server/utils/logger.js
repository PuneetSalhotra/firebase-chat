/*
 * author: Sri Sai Venkatesh
 */

var SQS = require("../queue/sqsProducer");
var Util = require('./util');

function Logger(queueWrapper) {
    
    let sqs = new SQS();
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
            cacheResponse: 10
        };

    /*
        log_transaction_id
        log_record_key
        log_bundle_key
        log_level_id
        log_level_name
        log_service_url
        log_request_data
        log_response_data
        log_db_call
        log_db_response
        log_response_code
        log_message
        log_request_datetime
        log_response_datetime
        log_stack_trace_data
        log_date
        log_datetime
        activity_id
        activity_title
        asset_id
        asset_first_name
        device_phone_country_code
        device_phone_number
        device_os_id
     */
    
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

        if ((typeof request === 'object') && request.hasOwnProperty('isTargeted') && request.isTargeted) {
            isTargeted = true;
        }

        //Textual Logs
        //util.writeLogs(message, isTargeted);        
        
        //Logs pushing to Kafka
        queueWrapper.raiseLogEvent(loggerCollection).then(()=>{});            
        
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
        var loggerCollectionString = JSON.stringify(loggerCollection);
        sqs.produce(loggerCollectionString, function (err, response) {
            if (err)
                console.log("error is: " + err);
        });
    };      
};

module.exports = Logger;
