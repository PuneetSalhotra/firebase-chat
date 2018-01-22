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


    this.logData = function (messageCollection, callback) {
        var logTimestamp = util.getCurrentUTCTime();
        var logDate = util.getCurrentDate();

        switch (messageCollection.request.module) {

            case 'device':
                console.log('Module : Device');
                deviceTransactionInsert(messageCollection, logDate, logTimestamp, callback);
                break;
            case 'activity':
                console.log('Module : Activity');
                activityTransactionInsert(1, messageCollection, logDate, logTimestamp, callback);
                break;
            case 'asset':
                console.log('Module : Asset');
                activityTransactionInsert(0, messageCollection, logDate, logTimestamp, callback);
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
        query += (messageCollection.request.hasOwnProperty("asset_phone_country_code")) ? "'" + messageCollection.request.asset_phone_country_code + "'" : "''";
        query += ",";
        query += (messageCollection.request.hasOwnProperty("asset_phone_number")) ? "'" + messageCollection.request.asset_phone_number + "'" : "''";
        query += ",";
        query += "'" + logDate + "'";
        query += ",";
        query += (messageCollection.request.hasOwnProperty("service_id")) ? util.replaceDefaultNumber(messageCollection.request.service_id) : 0;
        query += ",";
        query += (messageCollection.request.hasOwnProperty("bundle_transaction_id")) ? messageCollection.request.bundle_transaction_id : "''";
        query += ",";
        query += transactionId;
        query += ",";
        query += (messageCollection.request.hasOwnProperty("activity_id")) ? messageCollection.request.activity_id : 0;
        query += ",";
        query += (messageCollection.request.hasOwnProperty("activity_title")) ? "'" + messageCollection.request.activity_title + "'" : "''";
        query += ",";
        query += (messageCollection.request.hasOwnProperty("asset_id")) ? messageCollection.request.asset_id : 0;
        query += ",";
        query += (messageCollection.request.hasOwnProperty("asset_name")) ? messageCollection.request.asset_name : "''";
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
        query += (messageCollection.request.hasOwnProperty("service_name")) ? messageCollection.request.service_name : "''";
        query += ",";
        query += (messageCollection.request.hasOwnProperty("url")) ? "'" + messageCollection.request.url + "'" : "''";
        query += ",";
        query += (messageCollection.request.hasOwnProperty("device_os_id")) ? messageCollection.request.device_os_id : 0;
        query += ",";
        query += (sourceMap[messageCollection.request.device_os_id]) ? "'" + sourceMap[messageCollection.request.device_os_id] + "'" : "'NA'";
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
            query += (messageCollection.request.hasOwnProperty("activity_id")) ? messageCollection.request.activity_id : 0;
            query += ",";
            query += "'" + logDate + "'";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("service_id")) ? util.replaceDefaultNumber(messageCollection.request.service_id) : 0;
            query += ",";
            query += (messageCollection.request.hasOwnProperty("bundle_transaction_id")) ? messageCollection.request.bundle_transaction_id : "''";
            query += ",";
            query += transactionId;
            query += ",";
            query += (messageCollection.request.hasOwnProperty("activity_title")) ? "'" + messageCollection.request.activity_title + "'" : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("asset_id")) ? messageCollection.request.asset_id : 0;
            query += ",";
            query += (messageCollection.request.hasOwnProperty("asset_name")) ? messageCollection.request.asset_name : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("asset_phone_country_code")) ? messageCollection.request.asset_phone_country_code : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("asset_phone_number")) ? messageCollection.request.asset_phone_number : "''";
            query += ",";
            query += (logLevel[messageCollection.level]) ? logLevel[messageCollection.level] : 0;
            query += ",";
            query += (messageCollection.hasOwnProperty("level")) ? "'" + messageCollection.level + "'" : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("message")) ? "$$" + messageCollection.request.message + "$$" : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("request_data")) ? messageCollection.request.request : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("request_timestamp")) ? messageCollection.request.request_time : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("response_code")) ? messageCollection.request.response_code : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("response_data")) ? messageCollection.request.response : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("response_status")) ? messageCollection.request.response_status : false;
            query += ",";
            query += (messageCollection.request.hasOwnProperty("response_timestamp")) ? messageCollection.request.response_time : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("response_turnaround")) ? messageCollection.request.response_tat : 0;
            query += ",";
            query += (messageCollection.request.hasOwnProperty("stack_trace")) ? messageCollection.request.string_tokenizer : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("crtd")) ? messageCollection.request.crtd : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("service_name")) ? messageCollection.request.service_name : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("url")) ? "'" + messageCollection.request.url + "'" : "''";
            query += ",";
            query += (messageCollection.request.hasOwnProperty("device_os_id")) ? messageCollection.request.device_os_id : 0;
            query += ",";
            query += (sourceMap[messageCollection.request.device_os_id]) ? "'" + sourceMap[messageCollection.request.device_os_id] + "'" : "'NA'";
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
        assetQuery += (messageCollection.request.hasOwnProperty("asset_id")) ? messageCollection.request.asset_id : 0;
        assetQuery += ",";
        assetQuery += "'" + logDate + "'";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("service_id")) ? util.replaceDefaultNumber(messageCollection.request.service_id) : 0;
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("bundle_transaction_id")) ? messageCollection.request.bundle_transaction_id : "''";
        assetQuery += ",";
        assetQuery += transactionId;
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("activity_id")) ? messageCollection.request.activity_id : 0;
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("activity_title")) ? "'" + messageCollection.request.activity_title + "'" : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("asset_name")) ? messageCollection.request.asset_name : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("asset_phone_country_code")) ? messageCollection.request.asset_phone_country_code : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("asset_phone_number")) ? messageCollection.request.asset_phone_number : "''";
        assetQuery += ",";
        assetQuery += (logLevel[messageCollection.level]) ? logLevel[messageCollection.level] : 0;
        assetQuery += ",";
        assetQuery += (messageCollection.hasOwnProperty("level")) ? "'" + messageCollection.level + "'" : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.hasOwnProperty("message")) ? "$$" + messageCollection.message + "$$" : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("request_data")) ? messageCollection.request.request : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("request_timestamp")) ? messageCollection.request.request_time : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("response_code")) ? messageCollection.request.response_code : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("response_data")) ? messageCollection.request.response : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("response_status")) ? messageCollection.request.response_status : false;
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("response_timestamp")) ? messageCollection.request.response_time : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("response_turnaround")) ? messageCollection.request.response_tat : 0;
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("stack_trace")) ? messageCollection.request.string_tokenizer : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("crtd")) ? messageCollection.request.crtd : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("service_name")) ? messageCollection.request.service_name : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("url")) ? "'" + messageCollection.request.url + "'" : "''";
        assetQuery += ",";
        assetQuery += (messageCollection.request.hasOwnProperty("device_os_id")) ? messageCollection.request.device_os_id : 0;
        assetQuery += ",";
        assetQuery += (sourceMap[messageCollection.request.device_os_id]) ? "'" + sourceMap[messageCollection.request.device_os_id] + "'" : "'NA'";
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
    
    
    this.logSessionData = function (messageCollection, callback) {
        var logTimestamp = util.getCurrentUTCTime();
        var logDate = util.getCurrentDate();
        var Id = uuid.v1();
        
        console.log('In logSessioData Function messageCollection : \n' + JSON.stringify(messageCollection));
        console.log('messageCollection.request.asset_clocked_status_id :' + messageCollection.request.asset_clocked_status_id)
        if(messageCollection.request.asset_assigned_status_id > 0) {
            sessionsByAsset(messageCollection, Id,'sessions_by_asset',callback);
            sessionsByAsset(messageCollection, Id,'sessions_by_workforce',callback);
            sessionsByAsset(messageCollection, Id,'sessions_by_account',callback);
            sessionsByAsset(messageCollection, Id,'sessions_by_organization',callback);
        } 
        
        if(messageCollection.request.asset_clocked_status_id > 0) {
            sessionsByWorkHours(messageCollection, Id,'workhrs_by_asset',callback);
            sessionsByWorkHours(messageCollection, Id,'workhrs_by_workforce',callback)
            sessionsByWorkHours(messageCollection, Id,'workhrs_by_account',callback)
            sessionsByWorkHours(messageCollection, Id,'workhrs_by_organization',callback)
        }
        
        if(messageCollection.request.asset_session_status_id > 0) {
            
        }
    
    };
    
    sessionsByAsset = function(messageCollection,Id,tableName, callback) {
        
         /*var query = "SELECT dursec FROM " + tableName + 
                    " WHERE astid=" + messageCollection.request.asset_id + 
                    " and year="+ util.getFormatedLogYear(messageCollection.request.datetime_log) 
        
            
         cassandraWrapper.executeQuery(messageCollection, query, function (err, data) {
            if (err) {
                callback(false, data);
                return;
            } else {
                var sec = messageCollection.request.seconds;
                /*var x =JSON.parse(JSON.stringify(data));
                //console.log('x.rows.length : ' + x.rows.length)
                if(x.rows.length > 0) {
                    //console.log('HRS : ' + (x.rows[0].hrs === 'undefined')?0:x.rows[0].hrs);
                    sec = (x.rows[0].dursec === 'undefined')? sec: (x.rows[0].dursec + sec);
                }*/
            
        var query = "UPDATE " + tableName + " SET ";
                    query += "id=" + Id + ",";
                    query += "dt='" + util.getFormatedLogDate(messageCollection.request.datetime_log) + "',";
                    query += "month=" + util.getFormatedLogMonth(messageCollection.request.datetime_log) + ",";
                    //query += "year=" + util.getFormatedLogYear(messageCollection.request.datetime_log) + ",";
                    query += "stm=" + messageCollection.request.seconds + ",";
                    query += "slat=" + messageCollection.request.track_latitude + ",";
                    query += "slng=" + messageCollection.request.track_longitude + ",";
                    query += "etm=" + messageCollection.request.seconds + ",";
                    query += "elat=" + messageCollection.request.track_latitude + ",";
                    query += "elng=" + messageCollection.request.track_longitude + ",";
                    query += "dursec=" + messageCollection.request.seconds + ",";
                    query += "frstnm='" +messageCollection.request.first_name + "',";
                    query += "lstnm='" + messageCollection.request.last_name + "',";
                    //query += "astid=" + messageCollection.request.asset_id + ",";
                    query += "wkfid=" + messageCollection.request.workforce_id + ",";
                    query += "wkfnm='" + messageCollection.request.workforce_name + "',";
                    query += "accid=" + messageCollection.request.account_id + ",";
                    query += "accnm='" + messageCollection.request.account_name + "',";
                    query += "orgid=" + messageCollection.request.organization_id + ",";
                    query += "orgnm='" + messageCollection.request.organization_name + "',";
                    query += "devid='" + messageCollection.request.asset_hardware_os_id  + "',";
                    query += "devmdl='" + messageCollection.request.asset_hardware_model  + "',";
                    query += "devman='" + messageCollection.request.asset_hardware_manufacturer  + "',";
                    query += "devos='" + messageCollection.request.device_os_id  + "',";
                    query += "devtyp='" + messageCollection.request.asset_hardware_os_version  + "',";
                    query += "lnktime='" + messageCollection.request.datetime_log  + "',";
                    query += "vrsn='" + messageCollection.request.service_version  + "'";
                    //query += "lgtime=" + "'" +messageCollection.request.datetime_log + "'";
                    query += "  WHERE astid="+messageCollection.request.asset_id;
            query += " and year="+util.getFormatedLogYear(messageCollection.request.datetime_log)+" and lgtime='"+messageCollection.request.datetime_log + "';";
                        
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
         //});
     //};
    
    sessionsByWorkHours = function(messageCollection, Id, tableName, callback) {
        
        var query = "SELECT hrs FROM " + tableName + 
                    " WHERE astid=" + messageCollection.request.asset_id + 
                    " and year="+ util.getFormatedLogYear(messageCollection.request.datetime_log) +";";
        //console.log(query);
        
        cassandraWrapper.executeQuery(messageCollection, query, function (err, data) {
            if (err) {
                callback(false, data);
                return;
            } else {
                var hrs = messageCollection.request.hours;
                var x =JSON.parse(JSON.stringify(data));
                //console.log('x.rows.length : ' + x.rows.length)
                if(x.rows.length > 0) {
                    //console.log('HRS : ' + (x.rows[0].hrs === 'undefined')?0:x.rows[0].hrs);
                    hrs = (x.rows[0].hrs === 'undefined')? hrs: x.rows[0].hrs + hrs;
                }                
                
                var query = "UPDATE " + tableName + " SET ";
            query += "id=" + Id  + ",";
            query += "dt=" + "'" + util.getFormatedLogDate(messageCollection.request.datetime_log) + "',";
            query += "month=" + util.getFormatedLogMonth(messageCollection.request.datetime_log) + ",";
            //query += "year=" + util.getFormatedLogYear(messageCollection.request.datetime_log) + ",";
            //query += "tm='" + messageCollection.request.start_time  + "',";
            query += "tm='" + messageCollection.request.datetime_log + "',";
            query += "hrs=" + hrs  + ",";
            query += "lat=" + messageCollection.request.track_latitude  + ",";
            query += "lng=" + messageCollection.request.track_longitude  + ",";
            query += "acc=" + messageCollection.request.track_gps_accuracy  + ",";
            query += "addr='" + messageCollection.request.track_gps_location  + "',";
            query += "gps=" + ((messageCollection.request.track_gps_status === 1) ? true:false)  + ",";          
            query += "frstnm=" + "'" + messageCollection.request.first_name + "',";
            query += "lstnm=" + "'" + messageCollection.request.last_name + "',";
            //query += "astid=" + messageCollection.request.asset_id  + ",";
            query += "wkfid=" + messageCollection.request.workforce_id  + ",";
            query += "wkfnm=" + "'" + messageCollection.request.workforce_name+ "',";
            query += "accid=" + messageCollection.request.account_id  + ",";
            query += "accnm=" + "'" + messageCollection.request.account_name+ "',";
            query += "orgid=" + messageCollection.request.organization_id  + ",";
            query += "orgnm=" + "'" + messageCollection.request.organization_name+ "',";
            query += "devid='" + messageCollection.request.asset_hardware_os_id  + "',";
            query += "devmdl='" + messageCollection.request.asset_hardware_model  + "',";
            query += "devman='" + messageCollection.request.asset_hardware_manufacturer  + "',";
            query += "devos='" + messageCollection.request.device_os_id  + "',";
            query += "devtyp='" + messageCollection.request.asset_hardware_os_version  + "',";
            query += "lnktime='" + messageCollection.request.datetime_log  + "',";
            query += "vrsn='" + messageCollection.request.service_version  + "'";
            //query += "lgtime=" + "'" +messageCollection.request.datetime_log + "'";
            query += "  WHERE astid="+messageCollection.request.asset_id;
            query += " and year="+util.getFormatedLogYear(messageCollection.request.datetime_log)+" and lgtime='"+messageCollection.request.datetime_log + "';";
            
            //console.log('Query : ' + query);

            cassandraWrapper.executeQuery(messageCollection, query, function (err, data) {
                if (!err) {
                    callback(false, data);
                    return;
                } else {
                    callback(true, err);
                    return;
                }
            });
        
        callback(true, err);
        return;
            }
        });           
    };
}
;
module.exports = CassandraInterceptor;
