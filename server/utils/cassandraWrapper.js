/*
 * author: Sri Sai Venkatesh
 */
var cassandra = require('cassandra-driver');
var uuid = require('uuid');
var logDataConfig = require('/var/www/html/desker/NODEJS/desker_api_0.1/server/utils/logDataConfig');

function CassandraWrapper(cassandraCredentials, util) {

    var authProvider = new cassandra.auth.PlainTextAuthProvider(cassandraCredentials.user, cassandraCredentials.pwd);
    var client = new cassandra.Client({contactPoints: [cassandraCredentials.ip], keyspace: cassandraCredentials.keyspace, authProvider: authProvider});

    this.logData = function (messageCollection) {
        var logTimestamp = util.getCurrentUTCTime();
        
        if (messageCollection.level === 'request') {
            // do bundle transaction insert
            bundleTransactionInsert(messageCollection.request, logTimestamp, function (err, data) {

            });
        }

        if (messageCollection.request.module === 'device') {
            // do a device transaction insert here
            deviceTransactionInsert(messageCollection.message, messageCollection.request, messageCollection['level'], logTimestamp, function () {

            });

        } else if (messageCollection.request.module === 'asset') {
            transactionInsert("asset_record_transaction", messageCollection.message, messageCollection.request, messageCollection.level, logTimestamp, function () {

            });
            return;
        } else {
            transactionInsert("activity_record_transaction", messageCollection.message, messageCollection.request, messageCollection.level, logTimestamp, function () {

            });
            transactionInsert("asset_record_transaction", messageCollection.message, messageCollection.request, messageCollection.level, logTimestamp, function () {

            });
        }
    };

    var bundleTransactionInsert = function (reqBody, logTimestamp, callback) {

        var bundleTransactionId = reqBody.bundle_transaction_id;
        var deviceOsId = 0;

        var query = "INSERT INTO deskerlog.bundle_transaction ";
        query = query + "(asset_id, bundle_transaction_id, log_timestamp, activity_id, device_country_code, device_phone_number)";
        query = query + "VALUES (";

        if (reqBody.hasOwnProperty("asset_id")) {
            query = query + reqBody.asset_id + ",";
        } else {
            query = query + "0,";
        }
        query = query + bundleTransactionId + ",";
        query = query + "'" + logTimestamp + "',";

        query = query + "0,";  // activity_id

        if (reqBody.hasOwnProperty("asset_phone_country_code")) {
            query = query + "'" + reqBody.asset_phone_country_code + "',";
        } else {
            query = query + "'0',";
        }


        if (reqBody.hasOwnProperty("asset_phone_number")) {
            query = query + "'" + reqBody.asset_phone_number + "');";
        } else {
            query = query + "'0');";
        }

        executeCassandraQuery(query, function (err, data) {
            if (!err) {
                callback(false, true);
            } else {
                callback(true, false);
            }
        });
    };

    var transactionInsert = function (table, message, reqBody, level, logTimestamp, callback) {

        var transactionId = uuid.v1();
        var logLevel = logDataConfig.logLevel[level];
        var deviceOsId = 0;

        var query = "INSERT INTO deskerlog." + table;// ";
        query = query + "(bundle_transaction_id, record_transaction_id, asset_id, activity_id, service_id, service_name, service_url, source_id, source_name, level_id, level_name,";
        query = query + "log_date, log_timestamp, log_request_timestamp, log_request_data, log_response_timestamp, log_response_data, log_response_code, log_response_turnaround, ";
        query = query + "log_stacktrace_data, log_message) VALUES (";

        query = query + reqBody.bundle_transaction_id + ",";                    //bundle transaction id
        query = query + transactionId + ",";                                    //record_transaction_id
        if (reqBody.hasOwnProperty("asset_id")) {                               //asset id
            query = query + reqBody.asset_id + ",";
        } else {
            query = query + "0,";
        }
        if (reqBody.hasOwnProperty("activity_id")) {                            //activity id
            query = query + reqBody.activity_id + ",";
        } else {
            query = query + "0,";
        }
        /*
         var serviceId = Number(logDataConfig.serviceIdUrlMapping[reqBody.url]);        
         if (serviceId === 'NaN')
         query = query + 0 + ",";                                             //service id
         else
         query = query + serviceId + ",";                                     //service id
         */
        query = query + 0 + ",";                                                //service id
        query = query + "'',";                                                  //service_name
        query = query + "'" + reqBody.url + "',";                               //service_url
        if (reqBody.hasOwnProperty("device_os_id")) {                           //source_id (os id)
            deviceOsId = reqBody.device_os_id;
            query = query + reqBody.device_os_id + ",";
        } else {
            query = query + "0,";
        }
        query = query + "'" + logDataConfig.sourceMap[deviceOsId] + "',";       //source_name
        query = query + logLevel + ",";                                         //level_id
        query = query + "'" + level + "',";                                     //level_name
        query = query + "'" + util.getCurrentDate() + "',";                     //log_date
        query = query + "'" + logTimestamp + "',";                              //timestamp generated from bundle transaction

        switch (logLevel) {
            case 1: // request
                query = query + "'" + logTimestamp + "',";                       //request timestamp
                query = query + JSON.stringify(reqBody).replace(/"/gi, "'") + ",";                  //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response turnaround time
                query = query + "'',";                                          //stack trace
                query = query + "''";                                           //message string
                break;
            case 2: // response
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + message.replace(/"/gi, "'") + ",";              //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "''";                                           //message string
                break;
            case 3: //debug
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "''";                                           //message string
                break;
            case 4: // warning
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "''";                                           //message string
                break;
            case 5: // trace
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response turn around
                query = query + "{},";                                          //stack trace
                query = query + "'" + message.replace(/'/gi, '') + "'";                            //message string
                break;
            case 6: //app error
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "'" + message + "'";                            //message string
                break;
            case 7: //server error
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + message.replace(/"/gi, "'") + ",";              //stack trace
                query = query + "''";                                           //message string
                break;
            case 8: //fatal
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "'" + message + "'";                            //message string
                break;
            default:
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "'" + message + "'";                            //message string
                break;
        }
        query = query + ");";

        executeCassandraQuery(query, function (err, data) {
            if (!err) {
                callback(false, true);
                return;
            } else {
                callback(true, false);
                return;
            }
        });
    };

    var deviceTransactionInsert = function (message, reqBody, level, logTimestamp, callback) {

        var transactionId = uuid.v1();
        var logLevel = logDataConfig.logLevel[level];
        var deviceOsId = 0;

        var query = "INSERT INTO deskerlog.device_record_transaction";// ";
        query = query + "(bundle_transaction_id, record_transaction_id, device_phone_number, device_country_code, asset_id, activity_id, service_id, service_name, service_url, source_id, source_name, level_id, level_name,";
        query = query + "log_date, log_timestamp, log_request_timestamp, log_request_data, log_response_timestamp, log_response_data, log_response_code, log_response_turnaround, ";
        query = query + "log_stacktrace_data, log_message) VALUES (";

        query = query + reqBody.bundle_transaction_id + ",";                    //bundle transaction id
        query = query + transactionId + ",";                                    //record_transaction_id
        query = query + "'" + reqBody.asset_phone_number + "',";                //record_transaction_id
        query = query + "'" + reqBody.asset_phone_country_code + "',";          //record_transaction_id

        if (reqBody.hasOwnProperty("asset_id")) {                               //asset id
            query = query + reqBody.asset_id + ",";
        } else {
            query = query + "0,";
        }

        if (reqBody.hasOwnProperty("activity_id")) {                            //activity id
            query = query + reqBody.activity_id + ",";
        } else {
            query = query + "0,";
        }
        /*
         var serviceId = logDataConfig.serviceIdUrlMapping[reqBody.url];
         if (serviceId === 'undefined')
         query = query + 0 + ",";                                             //service id
         else
         query = query + serviceId + ",";                                     //service id
         */
        query = query + 0 + ",";                                                //service id
        query = query + "'',";                                                  //service_name
        query = query + "'" + reqBody.url + "',";                               //service_url
        if (reqBody.hasOwnProperty("device_os_id")) {                           //source_id (os id)
            query = query + reqBody.device_os_id + ",";
            deviceOsId = reqBody.device_os_id;
        } else {
            query = query + "0,";
        }
        query = query + "'" + logDataConfig.sourceMap[deviceOsId] + "',";       //source_name
        query = query + logLevel + ",";                                         //level_id
        query = query + "'" + level + "',";                                     //level_name
        query = query + "'" + util.getCurrentDate() + "',";                     //log_date
        query = query + "'" + logTimestamp + "',";                              //timestamp generated from bundle transaction

        switch (logLevel) {
            case 1: // request
                query = query + "'" + logTimestamp + "',";                     //request timestamp
                query = query + JSON.stringify(reqBody).replace(/"/gi, "'") + ",";                  //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //turnaround time
                query = query + "'',";                                          //stack trace
                query = query + "''";                                           //message string
                break;
            case 2: // response
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + message.replace(/"/gi, "'") + ",";            //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "''";                                           //message string
                break;
            case 3: //debug
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "''";                                           //message string
                break;
            case 4: // warning
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "''";                                           //message string
                break;
            case 5: // trace
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'',";                                           //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "'" + message.replace(/'/gi, '') + "'";                            //message string
                break;
            case 6: //app error
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "''";                                           //message string
                break;
            case 7: //server error
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + message.replace(/"/gi, "'") + ",";              //stack trace
                query = query + "''";                                           //message string
                break;
            case 8: //fatal
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "''";                                           //message string
                break;
            default:
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //log_request_data 
                query = query + "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query = query + "{},";                                          //response collection
                query = query + "'0',";                                         //response code
                query = query + "0,";                                           //response code
                query = query + "'',";                                          //stack trace
                query = query + "''";                                           //message string
                break;
        }
        query = query + ");";

        executeCassandraQuery(query, function (err, data) {
            if (err === false) {
                callback(false, true);
                return;
            } else {
                callback(true, null);
                return;
            }
        });
    };
    /*
     var getMapString = function (jsonObj) {
     console.log(typeof jsonObj);        
     var objCount = Object.keys(jsonObj).length;
     console.log(objCount);
     var iteration = 0;
     var mapString = '{';
     jsonObj.forEach(function (value, key) {
     if(iteration === objCount-1)
     mapString = mapString + "'" + key + "':'" + value + "'";
     else
     mapString = mapString + "'" + key + "':'" + value + "',";
     iteration = iteration +1;
     }, this);
     mapString = mapString + '}';
     return mapString;
     
     };
     */
    var executeCassandraQuery = function (query, callback) {
        client.execute(query, function (err, result) {
            if (!err) {
                console.log("query success | " + query);
                console.log(' ');
                callback(false, true);
                return;
            } else {
                console.log("query failed | " + query);
                console.log(err);
                console.log(' ');
                callback(true, false);
                return;
            }
        });
    };
}
;
module.exports = CassandraWrapper;
