/*
 * author: A Sri Sai Venkatesh
 */

function CassandraInterceptor(util, cassandraWrapper) {
    var uuid = require('uuid');
    
    var logLevel = {
        request: 1,
        response: 2,
        debug: 3,
        warning: 4,
        trace: 5,
        appError: 6,
        serverError: 7,
        fatal: 8
    };

    var sourceMap = {
        0: "NA",
        1: "android",
        2: "IOS",
        3: "windows",
        4: "web",
        5: "portal",
        6: "reporting server"
    };


    this.logData = function (messageCollection) {
        var logTimestamp = util.getCurrentUTCTime();
        var logDate = util.getCurrentDate();

        switch (messageCollection.request.module) {

            case 'device':
                console.log('Module : Device');
                deviceTransactionInsert(messageCollection, logDate, logTimestamp, function () {});
                break;
            case 'activity':
                console.log('Module : Activity');
                activityTransactionInsert(1, messageCollection, logDate, logTimestamp, function () {});
                break;
            case 'asset':
                console.log('Module : Asset');
                activityTransactionInsert(0, messageCollection, logDate, logTimestamp, function () {});
                break;
            default:
                console.log('No Such Module exists : \n' + messageCollection.request + '\n\n');
        }
    };

    deviceTransactionInsert = function (messageCollection, logDate, logTimestamp, callback) {
        var transactionId = uuid.v1();
        var logLevelId = (logLevel[messageCollection.level]) ? logLevel[messageCollection.level] : 0;

        var query = "INSERT INTO transactionsbydevice";
        query += " (devcntrycd, " + //asset_phone_country_code
                "devphnnmbr, " + //asset_phone_number
                "date, " + //
                "srvcid,  " + //serviceid
                "bndlid, " + //bundleTransactionId
                "recid, " + //transactionid
                "actvtyid, " + //activityid
                "actvtyttle, " +
                "asstid, " + //asset_id
                "asstname, " + //asstName
                "lvlid, " + //logLevelid
                "lvlnm, " + //level
                "msg, " + //message
                "req, " +
                "reqtime, " +
                "rescode, " +
                "res, " +
                "ressts, " +
                "restime, " +
                "restat, " +
                "stktrc, " +
                "crtd, " +
                "srvcname, " +
                "url, " +
                "srcid, " +
                "srcnm) VALUES(";
        query += (messageCollection.object.hasOwnProperty("asset_phone_country_code")) ? "'" + messageCollection.object.asset_phone_country_code + "'" : "''";
        query += ",";
        query += (messageCollection.object.hasOwnProperty("asset_phone_number")) ? "'" + messageCollection.object.asset_phone_number + "'" : "''";
        query += ",";
        query += "'" + logDate + "'";
        query += ",";
        query += (messageCollection.object.hasOwnProperty("service_id")) ? util.replaceDefaultNumber(messageCollection.object.service_id) : 0;
        query += ",";
        query += (messageCollection.object.hasOwnProperty("bundle_transaction_id")) ? messageCollection.object.bundle_transaction_id : "''";
        query += ",";
        query += transactionId;
        query += ",";
        query += (messageCollection.object.hasOwnProperty("activity_id")) ? messageCollection.object.activity_id : 0;
        query += ",";
        query += (messageCollection.object.hasOwnProperty("activity_title")) ? "'" + messageCollection.object.activity_title + "'" : "''";
        query += ",";
        query += (messageCollection.object.hasOwnProperty("asset_id")) ? messageCollection.object.asset_id : 0;
        query += ",";
        query += (messageCollection.object.hasOwnProperty("asset_name")) ? messageCollection.object.asset_name : "''";
        query += ",";
        query += logLevelId;
        query += ",";
        query += (messageCollection.level) ? "'" + messageCollection.level + "'" : "''";
        query += ",";


        switch (logLevelId) {
            case 1: // request
                console.log('In case 1');
                query += (messageCollection.hasOwnProperty("message")) ? "$$" + messageCollection.message + "$$" : "''";
                query += ",";
                query += "'',";                                          //log_request_data
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "'',";                                         //response code
                query += "'',";                                          //response collection
                query += "false,";                                        //response Status
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "0,";                                           //turnaround time
                query += "'',";                                          //stack trace
                break;
            case 2: // response
                console.log('In case 2');
                query += (messageCollection.hasOwnProperty("message")) ? "$$" + messageCollection.message + "$$" : "''";
                query += ",";
                query += "'',";                                          //log_request_data
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "'',";                                         //response code
                query += "'',";                                          //response collection
                query += "false,";                                        //response Status
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "0,";                                           //turnaround time
                query += "'',";                                          //stack trace
                break;
            case 3: //debug
                console.log('In case 3');
                query += (messageCollection.hasOwnProperty("message")) ? "$$" + messageCollection.message + "$$" : "''";
                query += ",";
                query += "'',";                                          //log_request_data
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "'',";                                         //response code
                query += "'',";                                          //response collection
                query += "false,";                                       //response Status
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "0,";                                           //turnaround time
                query += "'',";                                          //stack trace
                break;
            case 4: // warning
                console.log('In case 4')
                query += (messageCollection.hasOwnProperty("message")) ? "$$" + messageCollection.message + "$$" : "''";
                query += ",";
                query += "'',";                                          //log_request_data
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "'',";                                         //response code
                query += "'',";                                          //response collection
                query += "false,";                                        //response Status
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "0,";                                           //turnaround time
                query += "'',";                                          //stack trace
                break;
            case 5: // trace
                console.log('In case 5');
                query += (messageCollection.hasOwnProperty("message")) ? "$$" + messageCollection.message + "$$" : "''";
                query += ",";
                query += "'',";                                          //log_request_data
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "'',";                                         //response code
                query += "'',";                                          //response collection
                query += "false,";                                        //response Status
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "0,";                                           //turnaround time
                query += "'',";                                          //stack trace
                break;
            case 6: //app error
                console.log('In case 6');
                query += (messageCollection.hasOwnProperty("message")) ? "$$" + messageCollection.message + "$$" : "''";
                query += ",";
                query += "'',";                                          //log_request_data
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "'',";                                         //response code
                query += "'',";                                          //response collection
                query += "false,";                                        //response Status
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "0,";                                           //turnaround time
                query += "'',";                                          //stack trace
                break;
            case 7: //server error
                console.log('In case 7');
                query += (messageCollection.hasOwnProperty("message")) ? "$$" + messageCollection.message + "$$" : "''";
                query += ",";
                query += "'',";                                          //log_request_data
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "'',";                                         //response code
                query += "'',";                                          //response collection
                query += "false,";                                        //response Status
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "0,";                                           //turnaround time
                query += "'',";                                          //stack trace
                break;
            case 8: //fatal
                console.log('In case 8');
                query += (messageCollection.hasOwnProperty("message")) ? "$$" + messageCollection.message + "$$" : "''";
                query += ",";
                query += "'',";                                          //log_request_data
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "'',";                                         //response code
                query += "'',";                                          //response collection
                query += "false,";                                        //response Status
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "0,";                                           //turnaround time
                query += "'',";                                          //stack trace
                break;
            default:
                console.log('In Default case');
                query += (messageCollection.hasOwnProperty("message")) ? "$$" + messageCollection.message + "$$" : "''";
                query += ",";
                query += "'',";                                          //log_request_data
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "'vnk',";                                         //response code
                query += "'',";                                          //response collection
                query += "false,";                                        //response Status
                query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
                query += "0,";                                         //turnaround time
                query += "'',";                                          //stack trace
                break;
        }

        query += "'" + logTimestamp + "'";
        query += ",";
        query += (messageCollection.object.hasOwnProperty("service_name")) ? messageCollection.object.service_name : "''";
        query += ",";
        query += (messageCollection.object.hasOwnProperty("url")) ? "'" + messageCollection.object.url + "'" : "''";
        query += ",";
        query += (messageCollection.object.hasOwnProperty("device_os_id")) ? messageCollection.object.device_os_id : 0;
        query += ",";
        query += (sourceMap[messageCollection.object.device_os_id]) ? "'" + sourceMap[messageCollection.object.device_os_id] + "'" : "'NA'";
        query += ");";

        cassandraWrapper.executeQuery(messageCollection, query, function (err, data) {
            if (!err) {
                callback(false, true);
                return;
            } else {
                callback(true, false);
                return;
            }
        });
    };

    activityTransactionInsert = function (transactionType, messageCollection, logDate, logTimestamp, callback) {

        var transactionId = uuid.v1();

        if (transactionType === 1) {
            var query = "INSERT INTO transactionsbyactivity";
            query += " (actvtyid, " +
                    "date, " +
                    "srvcid, " +
                    "bndlid,  " +
                    "recId, " +
                    "actvtyttle, " +
                    "asstid, " +
                    "asstnm, " +
                    "devCntryCd, " +
                    "devPhnNmbr, " +
                    "lvlId, " +
                    "lvlnm, " +
                    "msg, " +
                    "req, " +
                    "reqtime, " +
                    "rescode, " +
                    "res, " +
                    "ressts, " +
                    "restime, " +
                    "restat, " +
                    "stktrc, " +
                    "crtd, " +
                    "srvcname, " +
                    "url, " +
                    "srcid, " +
                    "srcnm) VALUES(";
            query += (messageCollection.object.hasOwnProperty("activity_id")) ? messageCollection.object.activity_id : 0;
            query += ",";
            query += "'" + logDate + "'";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("service_id")) ? util.replaceDefaultNumber(messageCollection.object.service_id) : 0;
            query += ",";
            query += (messageCollection.object.hasOwnProperty("bundle_transaction_id")) ? messageCollection.object.bundle_transaction_id : "''";
            query += ",";
            query += transactionId;
            query += ",";
            query += (messageCollection.object.hasOwnProperty("activity_title")) ? "'" + messageCollection.object.activity_title + "'" : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("asset_id")) ? messageCollection.object.asset_id : 0;
            query += ",";
            query += (messageCollection.object.hasOwnProperty("asset_name")) ? messageCollection.object.asset_name : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("asset_phone_country_code")) ? messageCollection.object.asset_phone_country_code : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("asset_phone_number")) ? messageCollection.object.asset_phone_number : "''";
            query += ",";
            query += (logLevel[messageCollection.level]) ? logLevel[messageCollection.level] : 0;
            query += ",";
            query += (messageCollection.hasOwnProperty("level")) ? "'" + messageCollection.level + "'" : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("message")) ? "$$" + messageCollection.object.message + "$$" : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("request_data")) ? messageCollection.object.request : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("request_timestamp")) ? messageCollection.object.request_time : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("response_code")) ? messageCollection.object.response_code : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("response_data")) ? messageCollection.object.response : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("response_status")) ? messageCollection.object.response_status : false;
            query += ",";
            query += (messageCollection.object.hasOwnProperty("response_timestamp")) ? messageCollection.object.response_time : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("response_turnaround")) ? messageCollection.object.response_tat : 0;
            query += ",";
            query += (messageCollection.object.hasOwnProperty("stack_trace")) ? messageCollection.object.string_tokenizer : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("crtd")) ? messageCollection.object.crtd : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("service_name")) ? messageCollection.object.service_name : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("url")) ? "'" + messageCollection.object.url + "'" : "''";
            query += ",";
            query += (messageCollection.object.hasOwnProperty("device_os_id")) ? messageCollection.object.device_os_id : 0;
            query += ",";
            query += (sourceMap[messageCollection.object.device_os_id]) ? "'" + sourceMap[messageCollection.object.device_os_id] + "'" : "'NA'";
            query += ");";

            cassandraWrapper.executeQuery(messageCollection, query, function (err, data) {
                if (!err) {
                    callback(false, true);
                    return;
                } else {
                    callback(true, false);
                    return;
                }
            });
        }


        var assetQuery = "INSERT INTO transactionsbyasset";
        assetQuery += " (asstid, " +
                "date, " +
                "srvcid, " +
                "bndlid,  " +
                "recId, " +
                "actvtyid, " +
                "actvtyttle, " +
                "asstnm, " +
                "devCntryCd, " +
                "devPhnNmbr, " +
                "lvlId, " +
                "lvlnm, " +
                "msg, " +
                "req, " +
                "reqtime, " +
                "rescode, " +
                "res, " +
                "ressts, " +
                "restime, " +
                "restat, " +
                "stktrc, " +
                "crtd, " +
                "srvcname, " +
                "url, " +
                "srcid, " +
                "srcnm) VALUES(";
        assetQuery += (messageCollection.object.hasOwnProperty("asset_id")) ? messageCollection.object.asset_id : 0;
        assetQuery += ",";
        assetQuery += "'" + logDate + "'";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("service_id")) ? util.replaceDefaultNumber(messageCollection.object.service_id) : 0;
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("bundle_transaction_id")) ? messageCollection.object.bundle_transaction_id : "''";
        assetQuery += ",";
        assetQuery += transactionId;
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("activity_id")) ? messageCollection.object.activity_id : 0;
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("activity_title")) ? "'" + messageCollection.object.activity_title + "'" : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("asset_name")) ? messageCollection.object.asset_name : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("asset_phone_country_code")) ? messageCollection.object.asset_phone_country_code : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("asset_phone_number")) ? messageCollection.object.asset_phone_number : "''";
        assetQuery += ",";
        assetQuery += (logLevel[messageCollection.level]) ? logLevel[messageCollection.level] : 0;
        assetQuery += ",";
        assetQuery += (messageCollection.hasOwnProperty("level")) ? "'" + messageCollection.level + "'" : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.hasOwnProperty("message")) ? "$$" + messageCollection.message + "$$" : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("request_data")) ? messageCollection.object.request : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("request_timestamp")) ? messageCollection.object.request_time : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("response_code")) ? messageCollection.object.response_code : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("response_data")) ? messageCollection.object.response : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("response_status")) ? messageCollection.object.response_status : false;
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("response_timestamp")) ? messageCollection.object.response_time : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("response_turnaround")) ? messageCollection.object.response_tat : 0;
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("stack_trace")) ? messageCollection.object.string_tokenizer : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("crtd")) ? messageCollection.object.crtd : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("service_name")) ? messageCollection.object.service_name : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("url")) ? "'" + messageCollection.object.url + "'" : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.object.hasOwnProperty("device_os_id")) ? messageCollection.object.device_os_id : 0;
        assetQuery += ",";
        assetQuery += (sourceMap[messageCollection.object.device_os_id]) ? "'" + sourceMap[messageCollection.object.device_os_id] + "'" : "'NA'";
        assetQuery += ");";

        cassandraWrapper.executeQuery(messageCollection, assetQuery, function (err, data) {
            if (!err) {
                callback(false, true);
                return;
            } else {
                callback(true, false);
                return;
            }
        });
    };

}
;
module.exports = CassandraInterceptor;
