/*
 * author: Sri Sai Venkatesh
 */
var cassandra = require('cassandra-driver');
var uuid = require('uuid');
var cassandraConfig = require('cassandraConfig');


function CassandraWrapper(cassandraCredentials, util) {

    var authProvider = new cassandra.auth.PlainTextAuthProvider(cassandraCredentials.user, cassandraCredentials.pwd);
    var client = new cassandra.Client({contactPoints: [cassandraCredentials.ip], keyspace: cassandraCredentials.keyspace, authProvider: authProvider});

    this.addBundleTransaction = function (reqBody, reqUrl, callback) {

        //var bundleTransactionId = uuid.v1();
        var logTimestamp = util.getCurrentUTCTime() ;

        var query = "INSERT INTO deskerlog.bundle_transaction ";
        query = query + "(asset_id, bundle_transaction_id, log_timestamp, activity_id, device_country_code, activity_title, asset_name, device_phone_number)";
        query = query + "VALUES (";

        if (reqBody.hasOwnProperty("asset_id")) {
            query = query + reqBody.asset_id + ",";
        } else {
            query = query + "0,";
        }
        query = query + bundleTransactionId + ",";
        query = query + "'" + logTimestamp + "',";

        query = query + "0,";  // activity_id

        if (reqBody.hasOwnProperty("country_code")) {
            query = query + "'" + reqBody.country_code + "',";
        } else {
            query = query + "'0',";
        }
        query = query + "'','',";// activity_title, asset_name

        if (reqBody.hasOwnProperty("phone_number")) {
            query = query + "'" + reqBody.phone_number + "');";
        } else {
            query = query + "'0');";
        }

        console.log(query);

        executeCassandraQuery(query, function (err, data) {
            if (err === false) {
                addActivityTransaction(bundleTransactionId,reqBody, reqUrl, logTimestamp, function(){
                    
                });
                addAssetTransaction(bundleTransactionId,reqBody, reqUrl, logTimestamp, function(){
                    
                });
                callback(false, bundleTransactionId);
            } else {
                callback(true, null);
            }
        });
    };

    var addActivityTransaction = function (bundleTransactionId, reqBody,reqUrl,logTimestamp, callback) {

        var activityTransactionId = uuid.v1();

        var query = "INSERT INTO deskerlog.activity_record_transaction ";
        query = query + "(bundle_transaction_id, service_url, log_timestamp, activity_id, source_id, level_id, service_id, log_response_data, log_response_code, log_date,";
        query = query + "log_response_turnaround, source_name, service_name, asset_id, log_response_timestamp, log_stacktrace_data,  log_request_timestamp, level_name,";
        query = query + " record_transaction_id, log_request_data, log_message)";
        query = query + "VALUES ('" + bundleTransactionId +"',";    //bundle transaction id
        query = query + "'" + reqUrl + "'";                         // request url
        query = query + "'" + logTimestamp + "',";                  // timestamp generated from bundle transaction

        if (reqBody.hasOwnProperty("activity_id")) {                // activity id
            query = query + reqBody.activity_id + ",";
        } else {
            query = query + "0,";
        }
        if (reqBody.hasOwnProperty("device_os_id")) {               // device os id (source id)
            query = query + reqBody.device_os_id + ",";
        } else {
            query = query + "0,";
        }
        query = query + 1 + ",'";                                    // log level id
        
        query = query + cassandraConfig.serviceIdUrlMapping[reqUrl]+ "',";      //service id
        query = query + "'',";                                                   //response data
        query = query + 0 + ",";                                                // response code
        query = query + "'" + logTimestamp + "'," ;                              // log_date
        query = query + "'',";                                                   //log_response_turnaround
        query = query + "'',";                                                   //source_name
        query = query + "'',";                                                   //service_name
        if (reqBody.hasOwnProperty("asset_id")) {                               // asset id
            query = query + reqBody.asset_id + ",";
        } else {
            query = query + "0,";
        }
        query = query + "'" + logTimestamp + "'," ;                              // log_response_timestamp
        query = query + "'',";                                                   //log_stacktrace_data
        query = query + "'" + logTimestamp + "'," ;                              // log_request_timestamp
        query = query + "request," ;                                             // level_name
        query = query + "'"+activityTransactionId  + "',";                           // record_transaction_id
        query = query + "'"+ reqBody + "',";                                    //log_request_data 
        query = query + "'');";                                                  //log_message
        
        query = query + "'" +  + "',";
        
        console.log(query);

        executeCassandraQuery(query, function (err, data) {
            if (err === false) {
                callback(false, true);
            } else {
                callback(true, null);
            }
        });

    };

    var addAssetTransaction = function (bundleTransactionId, reqBody,reqUrl,logTimestamp, callback) {

        var assetTransactionId = uuid.v1();

        var query = "INSERT INTO deskerlog.activity_record_transaction ";
        query = query + "(bundle_transaction_id, service_url, log_timestamp, activity_id, source_id, level_id, service_id, log_response_data, log_response_code, log_date,";
        query = query + "log_response_turnaround, source_name, service_name, asset_id, log_response_timestamp, log_stacktrace_data,  log_request_timestamp, level_name,";
        query = query + " record_transaction_id, log_request_data, log_message)";
        query = query + "VALUES ('" + bundleTransactionId +"',";    //bundle transaction id
        query = query + "'" + reqUrl + "'";                         // request url
        query = query + "'" + logTimestamp + "',";                  // timestamp generated from bundle transaction

        if (reqBody.hasOwnProperty("activity_id")) {                // activity id
            query = query + reqBody.activity_id + ",";
        } else {
            query = query + "0,";
        }
        if (reqBody.hasOwnProperty("device_os_id")) {               // device os id (source id)
            query = query + reqBody.device_os_id + ",";
        } else {
            query = query + "0,";
        }
        query = query + 1 + ",'";                                    // log level id
        
        query = query + cassandraConfig.serviceIdUrlMapping[reqUrl]+ "',";      //service id
        query = query + "'',";                                                   //response data
        query = query + 0 + ",";                                                // response code
        query = query + "'" + logTimestamp + "'," ;                              // log_date
        query = query + "'',";                                                   //log_response_turnaround
        query = query + "'',";                                                   //source_name
        query = query + "'',";                                                   //service_name
        if (reqBody.hasOwnProperty("asset_id")) {                               // asset id
            query = query + reqBody.asset_id + ",";
        } else {
            query = query + "0,";
        }
        query = query + "'" + logTimestamp + "'," ;                              // log_response_timestamp
        query = query + "'',";                                                   //log_stacktrace_data
        query = query + "'" + logTimestamp + "'," ;                              // log_request_timestamp
        query = query + "request," ;                                             // level_name
        query = query + "'"+activityTransactionId  + "',";                           // record_transaction_id
        query = query + "'"+ reqBody + "',";                                    //log_request_data 
        query = query + "'');";                                                  //log_message
        
        query = query + "'" +  + "',";
        
        console.log(query);

        executeCassandraQuery(query, function (err, data) {
            if (err === false) {
                callback(false, true);
            } else {
                callback(true, null);
            }
        });
    };


    this.addActivityTransaction = function () {

    };

    this.addDeviceTransaction = function () {

    };

    this.addAssetTransaction = function () {

    };

    var executeCassandraQuery = function (query, callback) {
        client.execute(query, function (err, result) {
            if (!err) {
                callback(false, true);
            } else {
                console.log(err);
                callback(true, false);
            }
        });
    };



}
;
module.exports = CassandraWrapper;
