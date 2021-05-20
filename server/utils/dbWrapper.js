/*
 * author: Sri Sai Venkatesh
 */

const logger = require("../logger/winstonLogger");

var mysql = require('mysql');
var redis = require('redis');

var clusterConfig = {
    canRetry: true,
    removeNodeErrorCount: 5, // Remove the node immediately when connection fails.
    restoreNodeTimeout: 1000, //Milliseconds
    defaultSelector: 'ORDER'
};

var writeCluster = mysql.createPoolCluster();
var readCluster = mysql.createPoolCluster(clusterConfig);

const writeClusterForHealthCheck = mysql.createPoolCluster();
var readClusterForHealthCheck = mysql.createPoolCluster(clusterConfig);

const readClusterForAccountSearch = mysql.createPoolCluster(clusterConfig);

let redisSubscriber;
let redisClient;
if(global.mode === 'local') {
    redisClient = redis.createClient(global.config.redisConfig);
    redisSubscriber = redis.createClient(global.config.redisConfig);
} else {
    redisClient = redis.createClient(global.config.redisPort,global.config.redisIp);
    redisSubscriber = redis.createClient(global.config.redisPort,global.config.redisIp);
}

redisSubscriber.subscribe('__keyevent@0__:set');

redisSubscriber.on("message", function (channel, message) {
    if (global.config.dbURLKeys.includes(message)) {
        getAndSetDbURL();
    }
});

//Adding Master
writeCluster.add('MASTER', {
    connectionLimit: global.config.conLimit,
    host: global.config.masterIp,
    user: global.config.masterDBUser,
    password: global.config.masterDBPassword,
    database: global.config.masterDatabase,
    debug: false
});

//Adding Slave
readCluster.add('SLAVE1', {
    connectionLimit: global.config.conLimit,
    host: global.config.slave1Ip,
    user: global.config.slave1DBUser,
    password: global.config.slave1DBPassword,
    database: global.config.slave1Database,
    debug: false
});

//Adding Master for healthCheck purpose
writeClusterForHealthCheck.add('MASTER', {
    connectionLimit: 1,
    host: global.config.masterIp,
    user: global.config.masterDBUser,
    password: global.config.masterDBPassword,
    database: global.config.masterDatabase,
    debug: false
});

//Adding Slave for healthCheck purpose
readClusterForHealthCheck.add('SLAVE1', {
    connectionLimit: 1,
    host: global.config.slave1Ip,
    user: global.config.slave1DBUser,
    password: global.config.slave1DBPassword,
    database: global.config.slave1Database,
    debug: false
});

readClusterForAccountSearch.add('SLAVE2', {
    connectionLimit: global.config.conLimit,
    host: global.config.slave2Ip,
    user: global.config.slave1DBUser,
    password: global.config.slave1DBPassword,
    database: global.config.slave1Database,
    debug: false
});

//Adding Master
//readCluster.add('MASTER', {
//    connectionLimit: global.config.conLimit,
//    host: global.config.masterIp,
//    user: global.config.dbUser,
//    password: global.config.dbPassword,
//    database: global.config.database,
//    debug: false
//});

//Test the connection pool error
/*var checkDBInstanceAvailablity = async (flag) => {
    var conPool;
    switch (flag) {
        case 0: conPool = writeCluster;
            break;
        case 1: conPool = readCluster;
            break;
    }

    return await new Promise((resolve) => {
        try {
            conPool.getConnection(function (err, conn) {
                if (err) {
                    //console.log('ERROR WHILE GETTING CONNECTON - ', err);                     
                    resolve([1, err]);
                } else {
                    conn.release();
                    resolve([0, 'up']);
                }
            });
        } catch (exception) {
            //console.log('Exception Occurred - ' , exception);
            resolve([0, exception]);
        }
    });

};*/

//Test the connection pool error
const checkDBInstanceAvailablityV1 = async (flag) => {
    //console.log('checkDBInstanceAvailablityV1');
    const conPool = (Number(flag) === 1) ? writeClusterForHealthCheck: readClusterForHealthCheck;   
    return await new Promise((resolve) => {
        try {
            conPool.getConnection(function (err, conn) {
                if (err) {
                    //console.log('ERROR WHILE GETTING CONNECTON - ', err);
                    resolve([1, err]);
                } else {
                    conn.release();
                    resolve([0, 'up']);
                }
            });
        } catch (exception) {
            //console.log('Exception Occurred - ' , exception);
            resolve([0, exception]);
        }
    });
};

var executeQuery = function (flag, queryString, request, callback) {
    let label;
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
        conPool.getConnection(async function (err, conn) {
            if (err) {
                logger.error(`[${flag}] ERROR WHILE GETTING MySQL CONNECTON`, { type: 'mysql', request_body: request, error: err });
                if(global.config.mysqlConnectionErrors[err['code']]) {
                    getActiveAvailableDbConnection((e, connection) => {
                        if(e) {
                            logger.error(`[1] ERROR WHILE GETTING MySQL CONNECTON MASTER AS BACKUP`, { type: 'mysql', db_response: null, request_body: request, error: e });
                            callback(true,e);
                        } else {
                            connection.query(queryString, function (err, rows, fields) {
                                if (!err) {
                                    logger.verbose(`[1] ${queryString}`, { type: 'mysql', db_response: rows[0], request_body: request, error: err });
                                    // global.logger.write('dbResponse', queryString, rows, request);
                                    connection.release();
                                    return callback(false, rows[0]);
                                } else {
                                    logger.error(`[1] ${queryString}`, { type: 'mysql', db_response: null, request_body: request, error: err });
                                    // global.logger.write('dbResponse', 'SOME ERROR IN QUERY | ' + queryString, err, request);
                                    // global.logger.write('serverError', err, err, request);
                                    connection.release();
                                    return callback(false, rows[0]);
                                }
                            // console.timeEnd(label);
                            });
                        }
                    });
                } else {
                    return callback(true, err);
                }
            } else {                
                // label = 'DB-Query-Execution-Callback' + Date.now();
                // console.time(label);
                conn.query(queryString, function (err, rows, fields) {
                    if (!err) {
                        logger.verbose(`[${flag}] ${queryString}`, { type: 'mysql', db_response: rows[0], request_body: request, error: err });
                        conn.release();
                        callback(false, rows[0]);
                        return;
                    } else {
                        console.log("error: err: ", err);
                        logger.error(`[${flag}] ${queryString}`, { type: 'mysql', db_response: null, request_body: request, error: err });
                        conn.release();
                        callback(err, false);
                    }
                // console.timeEnd(label);
                });
            }
        });
    } catch (exception) {
        //console.log(queryString);
        //console.log(exception);        
        logger.crit(`[${flag}] ERROR WHILE GETTING MySQL CONNECTON`, { type: 'mysql', db_response: null, request_body: request, error: exception });
        // global.logger.write('serverError', 'Exception Occurred - ' + exception, exception, request);
    }
};

var executeQueryPromise = function (flag, queryString, request) {
    return new Promise((resolve, reject) => {
        let conPool;
        let label;
        
        //(flag === 0) ? conPool = writeCluster : conPool = readCluster;
        if(flag === 0) {
            conPool = writeCluster;
        } else if(flag === 1) {
            conPool = readCluster;
        } else {
            conPool = readClusterForAccountSearch;
            console.log('Hitting the account search Read Replica DB');
        }

        try {            
            conPool.getConnection(function (err, conn) {
                if (err) {
                    logger.error(`[${flag}] ERROR WHILE GETTING MySQL CONNECTON`, { type: 'mysql', db_response: null, request_body: request, error: err });
                    if(global.config.mysqlConnectionErrors[err['code']] && flag === 1) {
                        getActiveAvailableDbConnection((e, connection) => {
                            if(e) {
                                logger.error(`[1] ERROR WHILE GETTING MySQL CONNECTON MASTER AS BACKUP`, { type: 'mysql', db_response: null, request_body: request, error: e });
                                reject(e);
                            } else {
                                connection.query(queryString, function (err, rows, fields) {
                                    if (!err) {
                                        logger.verbose(`[1] ${queryString}`, { type: 'mysql', db_response: rows[0], request_body: request, error: err });
                                        // global.logger.write('dbResponse', queryString, rows, request);
                                        connection.release();
                                        resolve(rows[0]);
                                    } else {
                                        logger.error(`[1] ${queryString}`, { type: 'mysql', db_response: null, request_body: request, error: err });
                                        // global.logger.write('dbResponse', 'SOME ERROR IN QUERY | ' + queryString, err, request);
                                        // global.logger.write('serverError', err, err, request);
                                        connection.release();
                                        reject(err);
                                    }
                                // console.timeEnd(label);
                                });
                            }
                        });
                    } else {
                        // global.logger.write('serverError', 'ERROR WHILE GETTING CONNECTON - ' + err, err, request);
                        reject(err);
                    }
                    // global.logger.write('serverError', 'ERROR WHILE GETTING CONNECTON - ' + err, err, request);
                } else {
                    // label = 'DB-Query-Execution-Promise' + Date.now();
                    // console.time(label);
                    conn.query(queryString, function (err, rows, fields) {
                        if (!err) {
                            logger.verbose(`[${flag}] ${queryString}`, { type: 'mysql', db_response: rows[0], request_body: request, error: err });
                            // global.logger.write('dbResponse', queryString, rows, request);
                            conn.release();
                            resolve(rows[0]);
                        } else {
                            logger.error(`[${flag}] ${queryString}`, { type: 'mysql', db_response: null, request_body: request, error: err });
                            // global.logger.write('dbResponse', 'SOME ERROR IN QUERY | ' + queryString, err, request);
                            // global.logger.write('serverError', err, err, request);
                            conn.release();
                            reject(err);
                        }
                    // console.timeEnd(label);
                    });
                }
            });
        } catch (exception) {
            logger.crit(`[${flag}] ERROR WHILE GETTING MySQL CONNECTON`, { type: 'mysql', db_response: null, request_body: request, error: exception });
            // global.logger.write('serverError', 'Exception Occurred - ' + exception, exception, request);
            reject(exception);
        }
    });
};

var executeRawQueryPromise = function (flag, queryString, request) {
    return new Promise((resolve, reject) => {
        let conPool;
        let label;
        
        (flag === 0) ? conPool = writeCluster : conPool = readCluster;

        try {
            conPool.getConnection(function (err, conn) {
                if (err) {
                    logger.error(`[${flag}] ERROR WHILE GETTING MySQL CONNECTON`, { type: 'mysql', db_response: null, request_body: request, error: err });
                    if(global.config.mysqlConnectionErrors[err['code']]) {
                        getActiveAvailableDbConnection((e, connection) => {
                            if(e) {
                                logger.error(`[1] ERROR WHILE GETTING MySQL CONNECTON MASTER AS BACKUP`, { type: 'mysql', db_response: null, request_body: request, error: e });
                                reject(e);
                            } else {
                                connection.query(queryString, function (err, rows, fields) {
                                    if (!err) {
                                        logger.verbose(`[1] ${queryString}`, { type: 'mysql', db_response: rows[0], request_body: request, error: err });
                                        // global.logger.write('dbResponse', queryString, rows, request);
                                        connection.release();
                                        resolve(rows[0]);
                                    } else {
                                        logger.error(`[1] ${queryString}`, { type: 'mysql', db_response: null, request_body: request, error: err });
                                        // global.logger.write('dbResponse', 'SOME ERROR IN QUERY | ' + queryString, err, request);
                                        // global.logger.write('serverError', err, err, request);
                                        connection.release();
                                        reject(err);
                                    }
                                // console.timeEnd(label);
                                });
                            }
                        });
                    } else {
                        // global.logger.write('serverError', 'ERROR WHILE GETTING CONNECTON - ' + err, err, request);
                        reject(err);
                    }
                } else {
                    // label = 'DB-Query-Execution-Promise' + Date.now();
                    // console.time(label);
                    conn.query(queryString, function (err, rows, fields) {
                        if (!err) {
                            logger.verbose(`[${flag}] ${queryString}`, { type: 'mysql', db_response: rows, request_body: request, error: err });
                            // global.logger.write('dbResponse', queryString, rows, request);
                            conn.release();
                            resolve(rows);
                        } else {
                            logger.error(`[${flag}] ${queryString}`, { type: 'mysql', db_response: null, request_body: request, error: err });
                            // global.logger.write('dbResponse', 'SOME ERROR IN QUERY | ' + queryString, err, request);
                            // global.logger.write('serverError', err, err, request);
                            conn.release();
                            reject(err);
                        }
                    // console.timeEnd(label);
                    });
                }
            });
        } catch (exception) {
            logger.crit(`[${flag}] ERROR WHILE GETTING MySQL CONNECTON`, { type: 'mysql', db_response: null, request_body: request, error: exception });
            // global.logger.write('serverError', 'Exception Occurred - ' + exception, exception, request);
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
                logger.silly(`DB SP Result: %j`, result);
                // console.log(`DB SP Result:\n${JSON.stringify(result, null, 4)}`);
                // global.logger.write('dbResponse', queryString, result, request);
                // console.log(`Query Status: ${JSON.stringify(result[0].query_status, null, 4)}`);

                if (result[0].query_status === 0) {
                    return result;
                } else {
                    return Promise.reject(result);
                }
            } else {
                logger.error(`[${flagReadOperation}] ${queryString}`, { type: 'mysql', db_response: null, request_body: request, error: "Invalid Query String" });
                // global.logger.write('dbResponse', "Invalid Query String: " + queryString, {}, request);
                return Promise.reject(`Invalid Query String`);
            }
        } catch (error) {
            logger.error(`[${flagReadOperation}] QUERY ERROR`, { type: 'mysql', db_response: null, request_body: request, error: error });
            // global.logger.write('dbResponse', 'QUERY ERROR | ', error, request);
            return Promise.reject(error);
        }
    };

//Generic function for firing stored procedures
//Bharat Masimukku
//2019-07-13
let callDBProcedureR2 =
    async (request, procName, paramsArray, flagReadOperation) => {
        try {
            let queryString = getQueryString(procName, paramsArray);

            if (queryString != '') {
                let result = await (executeQueryPromise(flagReadOperation, queryString, request));

                console.log();
                console.log(`--------------------------------------`);
                // console.log(`DB Result:\n${JSON.stringify(result, null, 4)}`);
                logger.silly(`DB SP Result: %j`, result);
                console.log(`--------------------------------------`);
                console.log();

                // global.logger.write('dbResponse', queryString, result, request);
                // console.log(`Query Status: ${JSON.stringify(result[0].query_status, null, 4)}`);

                if (result.length > 0) {
                    if (result[0].query_status === 0) {
                        return result;
                    } else {
                        return Promise.reject(result);
                    }
                }
                else {
                    return result;
                }
            } else {
                logger.warn(`[${flagReadOperation}] ${queryString}`, { type: 'mysql', db_response: null, request_body: request, error: "Invalid Query String" });
                // global.logger.write('dbResponse', "Invalid Query String: " + queryString, {}, request);
                return Promise.reject(`Invalid Query String`);
            }
        } catch (error) {
            logger.warn(`[${flagReadOperation}] QUERY ERROR`, { type: 'mysql', db_response: null, request_body: request, error: error });
            // global.logger.write('dbResponse', 'QUERY ERROR | ', error, request);
            return Promise.reject(error);
        }
    };

let callDBProcedureRecursive =
    async (request, flagReadOperation, start, limit, procName, paramsArray, returnData) => {
        try {

            let startInternal = start;
            paramsArray.push(startInternal);
            paramsArray.push(limit);

            let queryString = getQueryString(procName, paramsArray);
            paramsArray.pop();
            paramsArray.pop();
            if (queryString != '') {
                let result = await (executeQueryPromise(flagReadOperation, queryString, request));

                console.log();
                console.log(`--------------------------------------`);
                console.log(`--------------------------------------`);
                console.log();

                if (result.length > 0) {
                    if (result[0].query_status === 0) {
                        logger.verbose(`[${flagReadOperation} | ${startInternal}] ${queryString}`, { type: 'mysql', db_response: result, request_body: request, error: null });

                        returnData = returnData.concat(result);

                        startInternal = startInternal + result.length;

                        if (result.length === limit) {

                            return callDBProcedureRecursive(request, 1, startInternal, limit, procName, paramsArray, returnData);
                        } else {
                            // logger.verbose(`[${flagReadOperation}] ${queryString}`, { type: 'mysql', db_response: returnData, request_body: request, error: null });
                            return returnData;
                        }
                    } else {
                        logger.error(`[${flagReadOperation} | ${startInternal}] ${queryString}`, { type: 'mysql', db_response: result, request_body: request, error: "query_status is not equal to 0" });
                        return Promise.reject(result);
                    }
                } else {
                    return result;
                }
            } else {
                logger.warn(`[${flagReadOperation}] ${queryString}`, { type: 'mysql', db_response: null, request_body: request, error: "Invalid Query String" });

                return Promise.reject(`Invalid Query String`);
            }
        } catch (error) {
            logger.warn(`[${flagReadOperation}] QUERY ERROR`, { type: 'mysql', db_response: null, request_body: request, error: error });

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

function getActiveAvailableDbConnection(callback) {
    logger.info(`[1] GETTING MySQL MASTER CONNECTON AS BACKUP`);
    writeCluster.getConnection(function (err, conn) {
        if (err) {
            //console.log('ERROR WHILE GETTING CONNECTON - ', err);
            logger.error(`[1] ERROR WHILE GETTING MySQL CONNECTON`, { type: 'mysql', request_body: {}, error: err });
            callback(err);
        } else {
            callback(false, conn);
        }
    });
}


function getAndSetDbURL() {
    redisClient.mget(global.config.dbURLKeys, function (err, reply) {
        if (err) {
            logger.error('Redis Error',{type: 'redis',error: serializeError(err)});
        } else {
            logger.warn(`[DBCrendentialsChanged]`, { type: 'mysql', db_response: null, request_body: null, error: null });
            global.config.masterIp = reply[0];
            global.config.masterDatabase = reply[1];
            global.config.masterDBUser = reply[2];
            global.config.masterDBPassword = reply[3];

            global.config.slave1Ip = reply[4];
            global.config.slave1Database = reply[5];
            global.config.slave1DBUser = reply[6];
            global.config.slave1DBPassword = reply[7];

            readCluster = mysql.createPoolCluster(clusterConfig);
            readClusterForHealthCheck = mysql.createPoolCluster(clusterConfig);
            readCluster.add('SLAVE1', {
                connectionLimit: global.config.conLimit,
                host: global.config.slave1Ip,
                user: global.config.slave1DBUser,
                password: global.config.slave1DBPassword,
                database: global.config.slave1Database,
                debug: false
            });
            //Adding Slave for healthCheck purpose
            readClusterForHealthCheck.add('SLAVE1', {
                connectionLimit: 1,
                host: global.config.slave1Ip,
                user: global.config.slave1DBUser,
                password: global.config.slave1DBPassword,
                database: global.config.slave1Database,
                debug: false
            });

        }
    });
}

module.exports = {
    executeQuery: executeQuery,
    executeQueryPromise: executeQueryPromise,
    executeRawQueryPromise: executeRawQueryPromise,
    executeRecursiveQuery: executeRecursiveQuery,
    callDBProcedure: callDBProcedure,
    callDBProcedureR2: callDBProcedureR2,
    callDBProcedureRecursive: callDBProcedureRecursive,
    checkDBInstanceAvailablity: checkDBInstanceAvailablityV1
};
