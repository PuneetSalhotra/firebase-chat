const logger = require("../logger/winstonLogger");


let redis = require('redis');
const moment = require('moment');
const { Pool } = require('pg');


let writeCluster;
let readCluster;

let redisSubscriber;
let redisClient;
if (global.mode === 'local') {
    redisClient = redis.createClient(global.config.redisConfig);
    redisSubscriber = redis.createClient(global.config.redisConfig);
} else {
    redisClient = redis.createClient(global.config.redisPort, global.config.redisIp);
    redisSubscriber = redis.createClient(global.config.redisPort, global.config.redisIp);
}

redisSubscriber.subscribe('__keyevent@0__:set');

redisSubscriber.on("message", function (channel, message) {
    if (global.config.pgDbURLKeys.includes(message)) {
        getAndSetDbURL();
    }
});


getAndSetDbURL();

let executeQueryPromise = async function (flag, queryString, request) {

    let error, responseData = [];
    let client;
    let connetionEstablished = false;
    try {
        client = flag === 1 ? await readCluster.connect() : await writeCluster.connect();
        connetionEstablished = true;
    } catch (e) {
        console.log(e);
        if (flag === 1) {
            try {
                client = await masterPool.connect();
                connetionEstablished = true;
            } catch (e1) {
                console.log(e1);
            }
        }
    }

    if (connetionEstablished) {
        try {
            const res = await client.query(queryString);

            console.log("res ", res.rows);
            error = false
            responseData = res.rows;
        } catch (e) {
            console.log(e);
            error = true
            responseData = [];
        } finally {
            // Make sure to release the client before any error handling,
            // just in case the error handling itself throws an error.
            client.release();
            return [error, responseData];
        }
    } else {
        [true, []]
    }

};


function getAndSetDbURL() {
    redisClient.mget(global.config.pgDbURLKeys, function (err, reply) {
        if (err) {
            logger.error('Redis Error', { type: 'redis', error: serializeError(err) });
        } else {
            logger.warn(`[DBCrendentialsChanged]`, { type: 'mysql', db_response: null, request_body: null, error: null });

            global.config.pgMasterIp = reply[0];
            global.config.pgMasterDatabase = reply[1];
            global.config.pgMasterDBUser = reply[2];
            global.config.pgMasterDBPassword = reply[3];

            global.config.pgSlaveIp = reply[4];
            global.config.pgSlaveDatabase = reply[5];
            global.config.pgSlaveDBUser = reply[6];
            global.config.pgSlaveDBPassword = reply[7];


            writeCluster = new Pool({
                user: global.config.pgMasterDBUser,
                host: global.config.pgMasterIp,
                database: global.config.pgMasterDatabase,
                password: global.config.pgMasterDBPassword,
                port: 5432,
            })
            readCluster = new Pool({
                user: global.config.pgSlaveDBUser,
                host: global.config.pgSlaveIp,
                database: global.config.pgSlaveDatabase,
                password: global.config.pgSlaveDBPassword,
                port: 5432,
            })

            logger.warn(`[PGDBConnectionEstablished] ${moment().format('YYYY-MM-DD h:mm:ss')}`, { type: 'mysql', db_response: null, request_body: null, error: null });
        }
    });
}

module.exports = {
    executeQueryPromise: executeQueryPromise
};
