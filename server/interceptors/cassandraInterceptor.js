/*
 * author: A Sri Sai Venkatesh
 */

const TimeUuid = require('cassandra-driver').types.TimeUuid;

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
        fatal: 8,
        dbresponse: 9
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
        var logDate = util.getCurrentUTCTime();

        var module = messageCollection.hasOwnProperty("request") ? messageCollection.request.module : '';


        switch (module) {

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
                console.log('No Such Module exists : \n' + JSON.stringify(messageCollection.request, null, 2) + '\n\n');
        }
    };

    function deviceTransactionInsert(messageCollection, logDate, logTimestamp, callback) {

        const transactionId = messageCollection.request.bundle_transaction_id || 0;
        console.log("transactionId: ", transactionId);
        
        const recordId = TimeUuid.now();
        console.log("recordId: ", recordId);

        var logLevelId = (logLevel[messageCollection.level]) ? logLevel[messageCollection.level] : 0;

        let dbCall = '';
        let dbResponse = '';
        if (String(messageCollection.message).includes('CALL ')) {
            dbCall = messageCollection.message;
            dbResponse = JSON.stringify(messageCollection.object) || '';
        }

        const query = `INSERT INTO transactionsbydevice (actvtyid, actvtyttle, asstid, asstname, bndlid, crtd, date, dbcall, dbparams, dbrs, devcntrycd, devphnnmbr, lvlid, lvlnm, msg, recid, req, reqtime, res, rescode, ressts, restime, stktrc, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        let queryParams = [
            (messageCollection.request.hasOwnProperty("activity_id")) ? messageCollection.request.activity_id : 0, // actvtyid
            (messageCollection.request.hasOwnProperty("activity_title")) ? messageCollection.request.activity_title : '', // actvtyttle
            (messageCollection.request.hasOwnProperty("asset_id")) ? messageCollection.request.asset_id : 0, // asstid
            (messageCollection.request.hasOwnProperty("asset_name")) ? messageCollection.request.asset_name : '', // asstname
            transactionId, // bndlid
            util.getCurrentUTCTime(), // crtd
            util.getCurrentUTCTime(), // date
            dbCall, // dbcall
            '', // dbparams
            dbResponse, // dbrs
            (messageCollection.request.hasOwnProperty("asset_phone_country_code")) ? messageCollection.request.asset_phone_country_code : '', // devcntrycd
            (messageCollection.request.hasOwnProperty("asset_phone_number")) ? messageCollection.request.asset_phone_number : '', // devphnnmbr
            (logLevel[messageCollection.level]) ? logLevel[messageCollection.level] : 0, // lvlid
            (messageCollection.hasOwnProperty("level")) ? messageCollection.level : '', // lvlnm
            (messageCollection.hasOwnProperty("message")) ? JSON.stringify(messageCollection.message) : '', // msg
            recordId, // recid
            JSON.stringify(messageCollection.request), // req
            util.getCurrentUTCTime(), // reqtime
            (messageCollection.hasOwnProperty("object")) ? JSON.stringify(messageCollection.object) : '', // res
            (messageCollection.request.hasOwnProperty("response_code")) ? messageCollection.request.response_code : '', // rescode
            (messageCollection.request.hasOwnProperty("response_status")) ? messageCollection.request.response_status : false, // ressts
            util.getCurrentUTCTime(), // restime
            (messageCollection.request.hasOwnProperty("stack_trace")) ? messageCollection.request.stack_trace : '', // stktrc
            (messageCollection.request.hasOwnProperty("url")) ? messageCollection.request.url : '' // url
        ];

        cassandraWrapper.executeQuery(messageCollection, query, queryParams, function (err, data) {
            if (!err) {
                callback(false, true);
                return;
            } else {
                callback(true, false);
                return;
            }
        });
    };

    function activityTransactionInsert(transactionType, messageCollection, logDate, logTimestamp, callback) {
        let dbCall = '';
        let dbResponse = '';
        if (String(messageCollection.message).includes('CALL ')) {
            dbCall = messageCollection.message;
            dbResponse = JSON.stringify(messageCollection.object) || '';
        }

        const transactionId = messageCollection.request.bundle_transaction_id || 0;
        console.log("transactionId: ", transactionId);

        const recordId = TimeUuid.now();
        console.log("recordId: ", recordId);

        if (transactionType === 1) {
            console.log("\x1b[36m messageCollection.request.activity_id: \x1b[0m", messageCollection.request.activity_id);

            const query = `INSERT INTO transactionsbyactivity (actvtyid, actvtyttle, asstid, asstnm, bndlid, crtd, date, dbcall, dbparams, dbrs, devcntrycd, devphnnmbr, lvlid, lvlnm, msg, recid, req, reqtime, res, rescode, ressts, restime, stktrc, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            let queryParams = [
                (messageCollection.request.hasOwnProperty("activity_id")) ? messageCollection.request.activity_id : 0, // actvtyid
                (messageCollection.request.hasOwnProperty("activity_title")) ? messageCollection.request.activity_title : '', // actvtyttle
                (messageCollection.request.hasOwnProperty("asset_id")) ? messageCollection.request.asset_id : 0, // asstid
                (messageCollection.request.hasOwnProperty("asset_name")) ? messageCollection.request.asset_name : '', // asstnm
                transactionId, // bndlid
                util.getCurrentUTCTime(), // crtd
                util.getCurrentUTCTime(), // date
                dbCall, // dbcall
                '', // dbparams
                dbResponse, // dbrs
                (messageCollection.request.hasOwnProperty("asset_phone_country_code")) ? messageCollection.request.asset_phone_country_code : '', // devcntrycd
                (messageCollection.request.hasOwnProperty("asset_phone_number")) ? messageCollection.request.asset_phone_number : '', // devphnnmbr
                (logLevel[messageCollection.level]) ? logLevel[messageCollection.level] : 0, // lvlid
                (messageCollection.hasOwnProperty("level")) ? messageCollection.level : '', // lvlnm
                (messageCollection.hasOwnProperty("message")) ? JSON.stringify(messageCollection.message) : '', // msg
                recordId, // recid
                JSON.stringify(messageCollection.request), // req
                util.getCurrentUTCTime(), // reqtime
                (messageCollection.hasOwnProperty("object")) ? JSON.stringify(messageCollection.object) : '', // res
                (messageCollection.request.hasOwnProperty("response_code")) ? messageCollection.request.response_code : '', // rescode
                (messageCollection.request.hasOwnProperty("response_status")) ? messageCollection.request.response_status : false, // ressts
                util.getCurrentUTCTime(), // restime
                (messageCollection.request.hasOwnProperty("stack_trace")) ? messageCollection.request.stack_trace : '', // stktrc
                (messageCollection.request.hasOwnProperty("url")) ? messageCollection.request.url : '' // url
            ];

            cassandraWrapper.executeQuery(messageCollection, query, queryParams, function (err, data) {
                if (!err) {
                    callback(false, true);
                    return;
                } else {
                    callback(true, false);
                    return;
                }
            });
        }

        console.log("\x1b[36m messageCollection.request.asset_id: \x1b[0m", messageCollection.request.asset_id);
        const assetQuery = `INSERT INTO transactionsbyasset (actvtyid, actvtyttle, asstid, asstnm, bndlid, crtd, date, dbcall, dbparams, dbrs, devcntrycd, devphnnmbr, lvlid, lvlnm, msg, recid, req, reqtime, res, rescode, ressts, restime, stktrc, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        let assetQueryParams = [
            (messageCollection.request.hasOwnProperty("activity_id")) ? messageCollection.request.activity_id : 0, // actvtyid
            (messageCollection.request.hasOwnProperty("activity_title")) ? messageCollection.request.activity_title : '', // actvtyttle
            (messageCollection.request.hasOwnProperty("asset_id")) ? messageCollection.request.asset_id : 0, // asstid
            (messageCollection.request.hasOwnProperty("asset_name")) ? messageCollection.request.asset_name : '', // asstnm
            transactionId, // bndlid
            util.getCurrentUTCTime(), // crtd
            util.getCurrentUTCTime(), // date
            dbCall, // dbcall
            '', // dbparams
            dbResponse, // dbrs
            (messageCollection.request.hasOwnProperty("asset_phone_country_code")) ? messageCollection.request.asset_phone_country_code : '', // devcntrycd
            (messageCollection.request.hasOwnProperty("asset_phone_number")) ? messageCollection.request.asset_phone_number : '', // devphnnmbr
            (logLevel[messageCollection.level]) ? logLevel[messageCollection.level] : 0, // lvlid
            (messageCollection.hasOwnProperty("level")) ? messageCollection.level : '', // lvlnm
            (messageCollection.hasOwnProperty("message")) ? JSON.stringify(messageCollection.message) : '', // msg
            recordId, // recid
            JSON.stringify(messageCollection.request), // req
            util.getCurrentUTCTime(), // reqtime
            (messageCollection.hasOwnProperty("object")) ? JSON.stringify(messageCollection.object) : '', // res
            (messageCollection.request.hasOwnProperty("response_code")) ? messageCollection.request.response_code : '', // rescode
            (messageCollection.request.hasOwnProperty("response_status")) ? messageCollection.request.response_status : false, // ressts
            util.getCurrentUTCTime(), // restime
            (messageCollection.request.hasOwnProperty("stack_trace")) ? messageCollection.request.stack_trace : '', // stktrc
            (messageCollection.request.hasOwnProperty("url")) ? messageCollection.request.url : '' // url
        ];

        cassandraWrapper.executeQuery(messageCollection, assetQuery, assetQueryParams, function (err, data) {
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
        if (messageCollection.request.asset_assigned_status_id > 0) {
            sessionsByAsset(messageCollection, Id, 'sessions_by_asset', callback);
            sessionsByAsset(messageCollection, Id, 'sessions_by_workforce', callback);
            sessionsByAsset(messageCollection, Id, 'sessions_by_account', callback);
            sessionsByAsset(messageCollection, Id, 'sessions_by_organization', callback);
        }

        if (messageCollection.request.asset_clocked_status_id > 0) {
            sessionsByWorkHours(messageCollection, Id, 'workhrs_by_asset', callback);
            sessionsByWorkHours(messageCollection, Id, 'workhrs_by_workforce', callback)
            sessionsByWorkHours(messageCollection, Id, 'workhrs_by_account', callback)
            sessionsByWorkHours(messageCollection, Id, 'workhrs_by_organization', callback)
        }

        if (messageCollection.request.asset_session_status_id > 0) {

        }

    };

    function sessionsByAsset(messageCollection, Id, tableName, callback) {

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
        query += "frstnm='" + messageCollection.request.first_name + "',";
        query += "lstnm='" + messageCollection.request.last_name + "',";
        //query += "astid=" + messageCollection.request.asset_id + ",";
        query += "wkfid=" + messageCollection.request.workforce_id + ",";
        query += "wkfnm='" + messageCollection.request.workforce_name + "',";
        query += "accid=" + messageCollection.request.account_id + ",";
        query += "accnm='" + messageCollection.request.account_name + "',";
        query += "orgid=" + messageCollection.request.organization_id + ",";
        query += "orgnm='" + messageCollection.request.organization_name + "',";
        query += "devid='" + messageCollection.request.asset_hardware_os_id + "',";
        query += "devmdl='" + messageCollection.request.asset_hardware_model + "',";
        query += "devman='" + messageCollection.request.asset_hardware_manufacturer + "',";
        query += "devos='" + messageCollection.request.device_os_id + "',";
        query += "devtyp='" + messageCollection.request.asset_hardware_os_version + "',";
        query += "lnktime='" + messageCollection.request.datetime_log + "',";
        query += "vrsn='" + messageCollection.request.service_version + "'";
        //query += "lgtime=" + "'" +messageCollection.request.datetime_log + "'";
        query += "  WHERE astid=" + messageCollection.request.asset_id;
        query += " and year=" + util.getFormatedLogYear(messageCollection.request.datetime_log) + " and lgtime='" + messageCollection.request.datetime_log + "';";

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

    function sessionsByWorkHours(messageCollection, Id, tableName, callback) {

        var query = "SELECT hrs FROM " + tableName +
            " WHERE astid=" + messageCollection.request.asset_id +
            " and year=" + util.getFormatedLogYear(messageCollection.request.datetime_log) + ";";
        //console.log(query);

        cassandraWrapper.executeQuery(messageCollection, query, function (err, data) {
            if (err) {
                callback(false, data);
                return;
            } else {
                var hrs = messageCollection.request.hours;
                var x = JSON.parse(JSON.stringify(data));
                //console.log('x.rows.length : ' + x.rows.length)
                if (x.rows.length > 0) {
                    //console.log('HRS : ' + (x.rows[0].hrs === 'undefined')?0:x.rows[0].hrs);
                    hrs = (x.rows[0].hrs === 'undefined') ? hrs : x.rows[0].hrs + hrs;
                }

                var query = "UPDATE " + tableName + " SET ";
                query += "id=" + Id + ",";
                query += "dt=" + "'" + util.getFormatedLogDate(messageCollection.request.datetime_log) + "',";
                query += "month=" + util.getFormatedLogMonth(messageCollection.request.datetime_log) + ",";
                //query += "year=" + util.getFormatedLogYear(messageCollection.request.datetime_log) + ",";
                //query += "tm='" + messageCollection.request.start_time  + "',";
                query += "tm='" + messageCollection.request.datetime_log + "',";
                query += "hrs=" + hrs + ",";
                query += "lat=" + messageCollection.request.track_latitude + ",";
                query += "lng=" + messageCollection.request.track_longitude + ",";
                query += "acc=" + messageCollection.request.track_gps_accuracy + ",";
                query += "addr='" + messageCollection.request.track_gps_location + "',";
                query += "gps=" + ((messageCollection.request.track_gps_status === 1) ? true : false) + ",";
                query += "frstnm=" + "'" + messageCollection.request.first_name + "',";
                query += "lstnm=" + "'" + messageCollection.request.last_name + "',";
                //query += "astid=" + messageCollection.request.asset_id  + ",";
                query += "wkfid=" + messageCollection.request.workforce_id + ",";
                query += "wkfnm=" + "'" + messageCollection.request.workforce_name + "',";
                query += "accid=" + messageCollection.request.account_id + ",";
                query += "accnm=" + "'" + messageCollection.request.account_name + "',";
                query += "orgid=" + messageCollection.request.organization_id + ",";
                query += "orgnm=" + "'" + messageCollection.request.organization_name + "',";
                query += "devid='" + messageCollection.request.asset_hardware_os_id + "',";
                query += "devmdl='" + messageCollection.request.asset_hardware_model + "',";
                query += "devman='" + messageCollection.request.asset_hardware_manufacturer + "',";
                query += "devos='" + messageCollection.request.device_os_id + "',";
                query += "devtyp='" + messageCollection.request.asset_hardware_os_version + "',";
                query += "lnktime='" + messageCollection.request.datetime_log + "',";
                query += "vrsn='" + messageCollection.request.service_version + "'";
                //query += "lgtime=" + "'" +messageCollection.request.datetime_log + "'";
                query += "  WHERE astid=" + messageCollection.request.asset_id;
                query += " and year=" + util.getFormatedLogYear(messageCollection.request.datetime_log) + " and lgtime='" + messageCollection.request.datetime_log + "';";

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
};

module.exports = CassandraInterceptor;
