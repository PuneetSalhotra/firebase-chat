/*
 * author: Sri Sai Venkatesh
 */

var mysql = require('mysql');

var clusterConfig = {
    removeNodeErrorCount: 1, // Remove the node immediately when connection fails.
    defaultSelector: 'ORDER'
};

var writeCluster = mysql.createPoolCluster();
var readCluster = mysql.createPoolCluster(clusterConfig);

//Adding Master
writeCluster.add('MASTER', {
    connectionLimit: global.config.conLimit,
    host: global.config.masterIp,
    user: global.config.dbUser,
    password: global.config.dbPassword,
    database: global.config.database,
    debug: false
});

//Adding Slave
readCluster.add('SLAVE1', {
    connectionLimit: global.config.conLimit,
    host: global.config.slave1Ip,
    user: global.config.dbUser,
    password: global.config.dbPassword,
    database: global.config.database,
    debug: false
});

//Adding Master
readCluster.add('MASTER', {
    connectionLimit: global.config.conLimit,
    host: global.config.masterIp,
    user: global.config.dbUser,
    password: global.config.dbPassword,
    database: global.config.database,
    debug: false
});

var executeQuery = function (flag, queryString, request, callback) {

    /*
     * flag = 0 --> master
     * flag = 1 --> slave 1
     * flag = 2 --> slave 2
     */

    var conPool;
    switch (flag) {
        case 0:
            conPool = writeCluster;
            //            console.log('master pool is selected');
            break;
        case 1:
            conPool = readCluster;
            //            console.log('slave1 pool is selected');
            break;
    }

    try {
        conPool.getConnection(function (err, conn) {
            if (err) {
                global.logger.write('serverError', 'ERROR WHILE GETTING CONNECTON - ' + err, err, request);
                callback(err, false);
                return;
            } else {
                //global.logger.write('conLog', 'conPool flag - ' + flag, {}, request);
                //global.logger.write('conLog', 'Connection is: ' + conn.config.host, {}, request); 
                conn.query(queryString, function (err, rows, fields) {
                    if (!err) {
                        global.logger.write('dbResponse', queryString, rows, request);
                        conn.release();
                        callback(false, rows[0]);
                        return;
                    } else {
                        global.logger.write('dbResponse', 'SOME ERROR IN QUERY | ' + queryString, err, request);
                        global.logger.write('serverError', err, err, request);
                        conn.release();
                        callback(err, false);
                    }
                });
            }
        });
    } catch (exception) {
        //console.log(queryString);
        //console.log(exception);        
        global.logger.write('serverError', 'Exception Occurred - ' + exception, exception, request);
    }
};

var executeQueryPromise = function (flag, queryString, request) {
    return new Promise((resolve, reject) => {
        let conPool;

        (flag === 0) ? conPool = writeCluster: conPool = readCluster;

        try {
            conPool.getConnection(function (err, conn) {
                if (err) {
                    global.logger.write('serverError', 'ERROR WHILE GETTING CONNECTON - ' + err, err, request);
                    reject(err);
                } else {
                    conn.query(queryString, function (err, rows, fields) {
                        if (!err) {
                            global.logger.write('dbResponse', queryString, rows, request);
                            conn.release();
                            resolve(rows[0]);
                        } else {
                            global.logger.write('dbResponse', 'SOME ERROR IN QUERY | ' + queryString, err, request);
                            global.logger.write('serverError', err, err, request);
                            conn.release();
                            reject(err);
                        }
                    });
                }
            });
        } catch (exception) {
            global.logger.write('serverError', 'Exception Occurred - ' + exception, exception, request);
            reject(exception);
        }
    });
};

/*function retrieveFromMasterDbPool(conPool, queryString, request){
    return new Promise((resolve, reject)=>{
        try {
            poolCluster.getConnection(conPool, function (err, conn) {
                if (err) {                    
                    global.logger.write('serverError','ERROR WHILE GETTING CONNECTON - ' + err, err, request);                    
                    reject(err);

                } else {
                    conn.query(queryString, function (err, rows, fields) {
                        if (!err) {
                            global.logger.write('debug', queryString, {}, request);
                            conn.release();
                            resolve(rows[0]);
                        } else {
                            global.logger.write('serverError', 'SOME ERROR IN QUERY | ' + queryString, err, request);
                            global.logger.write('serverError', err, err, request);
                            conn.release();
                            reject(err);
                        }
                    });
                }
            });
        } catch (exception) {
            global.logger.write('serverError', 'Exception Occurred - ' + exception, exception, request);
        }
    });
}*/

var getQueryString = function (callName, paramsArr) {

    var queryString = "CALL " + callName + "(";
    paramsArr.forEach(function (item, index) {
        if (index === (paramsArr.length - 1))
            queryString = queryString + "'" + item + "'";
        else
            queryString = queryString + "'" + item + "',";
    }, this);
    queryString = queryString + ");";
    return queryString;
};

var executeRecursiveQuery = function (flag, start, limit, callName, paramsArr, callback) {
    var returnData = [];
    var nextLimit = parseInt(limit + start);
    var checkAndFetchRecords = function (start) {
        nextLimit = parseInt(limit + start);
        paramsArr.push(start);
        paramsArr.push(limit);
        var queryString = getQueryString(callName, paramsArr);
        paramsArr.pop();
        paramsArr.pop();

        executeQuery(flag, queryString, {}, function (err, data) {
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

//Generic function for firing stored procedures
//Bharat Masimukku
//2019-01-20
let callDBProcedure =
    async (request, procName, paramsArray, flagReadOperation) => {
        try {
            let queryString = getQueryString(procName, paramsArray);

            if (queryString != '') {
                let result = await (executeQueryPromise(flagReadOperation, queryString, request));
                console.log(`DB SP Result:\n${JSON.stringify(result, null, 4)}`);
                // console.log(`Query Status: ${JSON.stringify(result[0].query_status, null, 4)}`);

                if (result[0].query_status === 0) {
                    return result;
                } else {
                    return Promise.reject(result);
                }
            } else {
                return Promise.reject(`Invalid Query String`);
            }
        } catch (error) {
            return Promise.reject(error);
        }
    };

/*process.on('exit', (err) => {
    global.logger.write('conLog', 'Closing the poolCluster : ' + err, {}, {});
    writeCluster.end();
    readCluster.end();
    global.logger.write('conLog', 'Closed the poolCluster : ' + err, {}, {});
});

//Ctrl+C Event
process.on('SIGINT', () => {
    process.exit();
});*/

//PID kill; PM2 Restart; nodemon Restart
//process.on('SIGUSR1', ()=>{ process.exit(); });
//process.on('SIGUSR2', ()=>{ process.exit(); });

module.exports = {
    executeQuery: executeQuery,
    executeQueryPromise: executeQueryPromise,
    executeRecursiveQuery: executeRecursiveQuery,
    callDBProcedure: callDBProcedure,
};
