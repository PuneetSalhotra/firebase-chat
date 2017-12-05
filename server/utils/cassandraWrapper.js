/*
 * author: V Nani Kalyan
 */
var cassandra = require('cassandra-driver');
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

function CassandraWrapper(cassandraCredentials, util) {
    //console.log('cassandraCredentials : ' + JSON.stringify(cassandraCredentialsProd))


    var authProvider = new cassandra.auth.PlainTextAuthProvider(cassandraCredentials.user, cassandraCredentials.pwd);
    var client = new cassandra.Client({contactPoints: [cassandraCredentials.ip],
                                       keyspace: cassandraCredentials.keyspace
                                      });

    this.logData = function (messageCollection) {
        var logTimestamp = util.getCurrentUTCTime();
        var x =new Date();
        var month = x.getMonth() + 1;
        var logDate = x.getFullYear() + '-' + x.getMonth() + '-' + x.getDate();
        //console.log('logDate : ' + logDate)

        switch(messageCollection.request.module) {

          case 'device':
                  console.log('Module : Device')
                  deviceTransactionInsert(messageCollection, logDate, logTimestamp, function () {});
                  break;
          case 'activity':
                  console.log('Module : Activity')
                  activityTransactionInsert(messageCollection, logDate, logTimestamp, function () {});
                  assetTransactionInsert(messageCollection, logDate, logTimestamp, function () {});
                  break;
          case 'asset':
                  console.log('Module : Asset')
                  assetTransactionInsert(messageCollection, logDate, logTimestamp, function () {});
                  break;
          default:
                  console.log('No Such Module exists : \n' + messageCollection.request + '\n\n')
        }
    }

    deviceTransactionInsert = function(messageCollection, logDate, logTimestamp, callback) {
      var transactionId = uuid.v1();
      var log_level = (messageCollection.level)? "'" + messageCollection.level + "'" : "''";
      var loglevelid = (logLevel[messageCollection.level]) ? logLevel[messageCollection.level] : 0;
      var sourcename = (sourceMap[messageCollection.request.device_os_id]) ? sourceMap[messageCollection.request.device_os_id] : "'NA'";

      var query = "INSERT INTO transactionsbydevice";
      query += " (devcntrycd, " +         //asset_phone_country_code
                 "devphnnmbr, " +         //asset_phone_number
                 "date, " +               //
                 "srvcid,  " +            //serviceid
                 "bndlid, " +             //bundleTransactionId
                 "recid, " +              //transactionid
                 "actvtyid, " +           //activityid
                 "actvtyttle, " +
                 "asstid, " +             //asset_id
                 "asstname, " +           //asstName
                 "lvlid, " +              //logLevelid
                 "lvlnm, " +              //level
                 "msg, " +                //message
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
      query += (messageCollection.request.hasOwnProperty("asset_phone_country_code")) ?  messageCollection.request.asset_phone_country_code : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("asset_phone_number")) ?  messageCollection.request.asset_phone_number : "''"; query += ",";
      query += "'" + logDate + "'"; query += ",";
      query += (messageCollection.request.hasOwnProperty("service_id")) ?  messageCollection.request.service_id : 0; query += ",";
      query += (messageCollection.request.hasOwnProperty("bundle_transaction_id")) ?  messageCollection.request.bundle_transaction_id : "''"; query += ",";
      query += transactionId; query += ",";
      query += (messageCollection.request.hasOwnProperty("activity_id")) ?  messageCollection.request.activity_id : 99666; query += ",";
      query += (messageCollection.request.hasOwnProperty("activity_title")) ?  "'" + messageCollection.request.activity_title + "'" : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("asset_id")) ?  messageCollection.request.asset_id : 0; query += ",";
      query += (messageCollection.request.hasOwnProperty("asset_name")) ?  messageCollection.request.asset_name : "''"; query += ",";
      query += loglevelid; query += ",";
      query += log_level; query += ",";


      switch (loglevelid) {
          case 1: // request
              console.log('In case 1')
              query += (messageCollection.hasOwnProperty("message")) ?  "'" +messageCollection.message+"'" : "''"; query += ",";
              query += "'',";                                          //log_request_data
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "'',";                                         //response code
              query += "'',";                                          //response collection
              query += "false,"                                        //response Status
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "0,";                                           //turnaround time
              query += "'',";                                          //stack trace
              break;
          case 2: // response
              console.log('In case 2')
              query += (messageCollection.hasOwnProperty("message")) ?  "'" +messageCollection.message+"'" : "''"; query += ",";
              query += "'',";                                          //log_request_data
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "'',";                                         //response code
              query += "'',";                                          //response collection
              query += "false,"                                        //response Status
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "0,";                                           //turnaround time
              query += "'',";                                          //stack trace
              break;
          case 3: //debug
              console.log('In case 3')
              query += (messageCollection.hasOwnProperty("message")) ?  "'" +messageCollection.message+"'" : "''"; query += ",";
              query += "'',";                                          //log_request_data
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "'',";                                         //response code
              query += "'',";                                          //response collection
              query += "false,"                                        //response Status
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "0,";                                           //turnaround time
              query += "'',";                                          //stack trace
              break;
          case 4: // warning
              console.log('In case 4')
              query += (messageCollection.hasOwnProperty("message")) ?  "'" +messageCollection.message+"'" : "''"; query += ",";
              query += "'',";                                          //log_request_data
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "'',";                                         //response code
              query += "'',";                                          //response collection
              query += "false,"                                        //response Status
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "0,";                                           //turnaround time
              query += "'',";                                          //stack trace
              break;
          case 5: // trace
              console.log('In case 5')
              query += (messageCollection.hasOwnProperty("message")) ?  "'" +messageCollection.message+"'" : "''"; query += ",";
              query += "'',";                                          //log_request_data
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "'',";                                         //response code
              query += "'',";                                          //response collection
              query += "false,"                                        //response Status
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "0,";                                           //turnaround time
              query += "'',";                                          //stack trace
              break;
          case 6: //app error
              console.log('In case 6')
              query += (messageCollection.hasOwnProperty("message")) ?  "'" +messageCollection.message+"'" : "''"; query += ",";
              query += "'',";                                          //log_request_data
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "'',";                                         //response code
              query += "'',";                                          //response collection
              query += "false,"                                        //response Status
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "0,";                                           //turnaround time
              query += "'',";                                          //stack trace
              break;
          case 7: //server error
              console.log('In case 7')
              query += (messageCollection.hasOwnProperty("message")) ?  "'" +messageCollection.message+"'" : "''"; query += ",";
              query += "'',";                                          //log_request_data
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "'',";                                         //response code
              query += "'',";                                          //response collection
              query += "false,"                                        //response Status
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "0,";                                           //turnaround time
              query += "'',";                                          //stack trace
              break;
          case 8: //fatal
              console.log('In case 8')
              query += (messageCollection.hasOwnProperty("message")) ?  "'" +messageCollection.message+"'" : "''"; query += ",";
              query += "'',";                                          //log_request_data
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "'',";                                         //response code
              query += "'',";                                          //response collection
              query += "false,"                                        //response Status
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "0,";                                           //turnaround time
              query += "'',";                                          //stack trace
              break;
          default:
              console.log('In Default case')
              query += (messageCollection.hasOwnProperty("message")) ?  "'" +messageCollection.message+"'" : "''"; query += ",";
              query += "'',";                                          //log_request_data
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "'vnk',";                                         //response code
              query += "'',";                                          //response collection
              query += "false,"                                        //response Status
              query += "'" + logTimestamp + "',";                      //timestamp generated from bundle transaction
              query += "0,";                                         //turnaround time
              query += "'',";                                          //stack trace
              break;
      }

      query += "'" + logTimestamp + "'"; query += ",";
      query += (messageCollection.request.hasOwnProperty("service_name")) ?  messageCollection.request.service_name : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("url")) ?  "'" +messageCollection.request.url + "'" : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("device_os_id")) ?  messageCollection.request.device_os_id : 0; query += ",";
      query += "'" + sourcename + "'";
      query += ");";

      //console.log(query);

      executeCassandraQuery(query, function (err, data) {
          if (!err) {
              callback(false, true);
              return;
          } else {
              callback(true, false);
              return;
          }
      });
    }

    activityTransactionInsert = function(messageCollection, logDate, logTimestamp, callback) {

      var transactionId = uuid.v1();
      var log_level = (messageCollection.request.level)? "'" + messageCollection.request.level + "'" : "''";
      var loglevelid = (logLevel[messageCollection.request.level]) ? logLevel[messageCollection.request.level] : 0;
      var sourcename = (sourceMap[messageCollection.request.device_os_id]) ? sourceMap[messageCollection.request.device_os_id] : "'NA'";

      //console.log("Message : " + messageCollection.message)

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
      query += (messageCollection.request.hasOwnProperty("activity_id")) ?  messageCollection.request.activity_id : 0; query += ",";
      query += "'" + logDate + "'"; query += ",";
      query += (messageCollection.request.hasOwnProperty("service_id")) ?  messageCollection.request.service_id : 0; query += ",";
      query += (messageCollection.request.hasOwnProperty("bundle_transaction_id")) ?  messageCollection.request.bundle_transaction_id : "''"; query += ",";
      query += transactionId; query += ",";
      query += (messageCollection.request.hasOwnProperty("activity_title")) ?  "'" + messageCollection.request.activity_title + "'"  : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("asset_id")) ?  messageCollection.request.asset_id : 0; query += ",";
      query += (messageCollection.request.hasOwnProperty("asstNm")) ?  messageCollection.request.asset_name : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("asset_phone_country_code")) ?  messageCollection.request.asset_phone_country_code : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("asset_phone_number")) ?  messageCollection.request.asset_phone_number : "''"; query += ",";
      query += loglevelid; query += ",";
      query += (messageCollection.request.hasOwnProperty("level")) ? "'"+messageCollection.request.level+"'" : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("message")) ?  "'" +messageCollection.request.message+"'" : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("req")) ?  messageCollection.request.request : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("reqTime")) ?  messageCollection.request.request_time : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("resCode")) ?  messageCollection.request.response_code : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("res")) ?  messageCollection.request.response : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("resSts")) ?  messageCollection.request.response_status : false; query += ",";
      query += (messageCollection.request.hasOwnProperty("resTime")) ?  messageCollection.request.response_time : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("resTAT")) ?  messageCollection.request.response_tat : 0; query += ",";
      query += (messageCollection.request.hasOwnProperty("stkTrc")) ?  messageCollection.request.string_tokenizer : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("crtd")) ?  messageCollection.request.crtd : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("srvcName")) ?  messageCollection.request.service_name : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("url")) ?  "'" +messageCollection.request.url + "'" : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("device_os_id")) ?  messageCollection.request.device_os_id : 0; query += ",";
      query += "'" + sourcename + "'";
      query += ");";

      //console.log(query);

      executeCassandraQuery(query, function (err, data) {
          if (!err) {
              callback(false, true);
              return;
          } else {
              callback(true, false);
              return;
          }
      });
    }

    assetTransactionInsert = function(messageCollection, logDate, logTimestamp, callback) {

      var transactionId = uuid.v1();
      var log_level = (messageCollection.request.level)? "'" + messageCollection.request.level + "'" : "''";
      var loglevelid = (logLevel[messageCollection.request.level]) ? logLevel[messageCollection.request.level] : 0;
      var sourcename = (sourceMap[messageCollection.request.device_os_id]) ? sourceMap[messageCollection.request.device_os_id] : "'NA'";

      //console.log("Message : " + messageCollection.message)

      var query = "INSERT INTO transactionsbyasset";
      query += " (asstid, " +
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
      query += (messageCollection.request.hasOwnProperty("asset_id")) ?  messageCollection.request.asset_id : 0; query += ",";
      query += "'" + logDate + "'"; query += ",";
      query += (messageCollection.request.hasOwnProperty("service_id")) ?  messageCollection.request.service_id : 0; query += ",";
      query += (messageCollection.request.hasOwnProperty("bundle_transaction_id")) ?  messageCollection.request.bundle_transaction_id : "'99666'"; query += ",";
      query += transactionId; query += ",";
      query += (messageCollection.request.hasOwnProperty("activity_id")) ?  messageCollection.request.activity_id : 99666; query += ",";
      query += (messageCollection.request.hasOwnProperty("activity_title")) ?  "'" + messageCollection.request.activity_title + "'" : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("asset_name")) ?  messageCollection.request.asset_name : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("asset_phone_country_code")) ?  messageCollection.request.asset_phone_country_code : "'IND'"; query += ",";
      query += (messageCollection.request.hasOwnProperty("asset_phone_number")) ?  messageCollection.request.asset_phone_number : "''"; query += ",";
      query += loglevelid; query += ",";
      query += (messageCollection.request.hasOwnProperty("level")) ?  "'"+messageCollection.request.level+"'" : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("message")) ?  "'" + messageCollection.request.message + "'" : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("req")) ?  messageCollection.request.request : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("reqTime")) ?  messageCollection.request.request_time : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("resCode")) ?  messageCollection.request.response_code : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("res")) ?  messageCollection.request.response : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("resSts")) ?  messageCollection.request.response_status : false; query += ",";
      query += (messageCollection.request.hasOwnProperty("resTime")) ?  messageCollection.request.response_time : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("resTAT")) ?  messageCollection.request.response_tat : 0; query += ",";
      query += (messageCollection.request.hasOwnProperty("stkTrc")) ?  messageCollection.request.string_tokenizer : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("crtd")) ?  messageCollection.request.crtd : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("srvcName")) ?  messageCollection.request.service_name : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("url")) ?  "'" +messageCollection.request.url + "'" : "''"; query += ",";
      query += (messageCollection.request.hasOwnProperty("device_os_id")) ?  messageCollection.request.device_os_id : 0; query += ",";
      query += "'" + sourcename + "'";
      query += ");";

      //console.log(query);

      executeCassandraQuery(query, function (err, data) {
          if (!err) {
              callback(false, true);
              return;
          } else {
              callback(true, false);
              return;
          }
      });
    }

    var executeCassandraQuery = function (query, callback) {
        client.execute(query, function (err, result) {
            if (!err) {
                //console.log("query success | " + query);
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
module.exports = CassandraWrapper;
