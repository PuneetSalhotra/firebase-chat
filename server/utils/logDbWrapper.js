/*
 * author: V Nani Kalyan
 */

let mysql = require('mysql');

var writeCluster = mysql.createPoolCluster();

//Adding Master
writeCluster.add('MASTER', {
    connectionLimit: global.config.conLimit,
    host: global.config.logMasterIp,
    user: global.config.dbUser,
    password: global.config.logDbPassword,
    database: global.config.logDatabase,
    debug: false
});

let logExecuteQuery = function (flag, queryString, request, callback) {

    /*
     * flag = 0 --> master
     * flag = 1 --> slave 1   
     */

    var conPool;
    switch (flag) {
        case 0:
            conPool = writeCluster;            
            break;
        /*case 1:
            conPool = readCluster;            
            break;*/
    }

    try {
        conPool.getConnection(function (err, conn) {
            if (err) {
                console.log('ERROR WHILE GETTING CONNECTON - ' + err);
                callback(err, false);
                return;
            } else {                
                conn.query(queryString, function (err, rows, fields) {
                    if (!err) {                        
                        console.log(queryString);                        
                        conn.release();
                        callback(false, rows[0]);
                        return;
                    } else {                        
                        console.log('SOME ERROR IN QUERY | ' + queryString)
                        console.log(err);
                        conn.release();
                        callback(err, false);
                    }
                });
            }
        });
    } catch (exception) {
        console.log(queryString);
        console.log(exception);                
    }
};

let getQueryString = function (callName, paramsArr) {

    let queryString = "CALL " + callName + "(";
    paramsArr.forEach(function (item, index) {
        if (index === (paramsArr.length - 1))
            queryString = queryString + "'" + item + "'";
        else
            queryString = queryString + "'" + item + "',";
    }, this);
    queryString = queryString + ");";
    return queryString;
};

let logExecuteRecursiveQuery = function (flag, start, limit, callName, paramsArr, callback) {
    let returnData = [];
    let nextLimit = parseInt(limit + start);
    let checkAndFetchRecords = function (start) {
        nextLimit = parseInt(limit + start);
        paramsArr.push(start);
        paramsArr.push(limit);
        var queryString = getQueryString(callName, paramsArr);
        paramsArr.pop();
        paramsArr.pop();

        logExecuteQuery(flag, queryString, {}, function (err, data) {
            if (err) {
                callback(err, returnData);
            } else {
                if (data.length === limit) {
                    returnData.push(data);
                    checkAndFetchRecords(nextLimit);
                } else {
                    if (data.length > 0)
                        returnData.push(data);
                    callback(false, returnData); // this acts as iterator
                }
            }
        });
    };
    checkAndFetchRecords(start);
};

module.exports = {
    logExecuteQuery: logExecuteQuery,
    logExecuteRecursiveQuery: logExecuteRecursiveQuery
};
