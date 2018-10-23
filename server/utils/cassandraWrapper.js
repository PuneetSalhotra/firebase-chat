/*
 * author: Sri Sai Venkatesh
 */
var cassandra = require('cassandra-driver');

function CassandraWrapper() {

    try {
        var logAuthProviderDev = new cassandra.auth.PlainTextAuthProvider(global.config.cassandraCredentialsDev.user, global.config.cassandraCredentialsDev.pwd);
        var logClientDev = new cassandra.Client({
            contactPoints: [global.config.cassandraCredentialsDev.ip],
            keyspace: global.config.cassandraCredentialsDev.log_keyspace,
            authProvider: logAuthProviderDev
        });

        var logAuthProviderProd = new cassandra.auth.PlainTextAuthProvider(global.config.cassandraCredentialsProd.user, global.config.cassandraCredentialsProd.pwd);
        var logClientProd = new cassandra.Client({
            contactPoints: [global.config.cassandraCredentialsProd.ip],
            keyspace: global.config.cassandraCredentialsProd.log_keyspace,
            authProvider: logAuthProviderProd
        });

        var sessionAuthProviderDev = new cassandra.auth.PlainTextAuthProvider(global.config.cassandraCredentialsDev.user, global.config.cassandraCredentialsDev.pwd);
        var sessionClientDev = new cassandra.Client({
            contactPoints: [global.config.cassandraCredentialsDev.ip],
            keyspace: global.config.cassandraCredentialsDev.session_keyspace,
            authProvider: logAuthProviderDev
        });

        var sessionAuthProviderProd = new cassandra.auth.PlainTextAuthProvider(global.config.cassandraCredentialsProd.user, global.config.cassandraCredentialsProd.pwd);
        var sessionClientProd = new cassandra.Client({
            contactPoints: [global.config.cassandraCredentialsProd.ip],
            keyspace: global.config.cassandraCredentialsProd.session_keyspace,
            authProvider: logAuthProviderProd
        });

    } catch (exception) {
        console.log(exception);
    }

    this.isConnected = function (log, callback) {
        var connectionResource;
        switch (log) {
            case 'session':
                switch (global.mode) {
                    case 'prod':
                        connectionResource = sessionClientProd;
                        break;
                    case 'dev':
                    case 'local':
                    case 'staging':
                    case 'preprod':
                        connectionResource = sessionClientDev;
                        break;
                }
                break;
            case 'log':
                switch (global.mode) {
                    case 'prod':
                        connectionResource = logClientProd;
                        break;
                    case 'dev':
                    case 'local':
                    case 'staging':
                    case 'preprod':
                        connectionResource = logClientDev;
                        break;
                }
                break;
        }

        connectionResource.connect(function (err, resp) {
            if (err) {
                console.log('err : ', err);
                callback(true, false);
            } else {
                console.log('Connected')
                callback(false, false);
            }
        });

    };

    this.executeQuery = function (messageCollection, query, params, callback) {
        var connectionResource;
        switch (messageCollection.log) {
            case 'session':
                switch (messageCollection.environment) {
                    case 'prod':
                        connectionResource = sessionClientProd;
                        break;
                    case 'dev':
                        connectionResource = sessionClientDev;
                        break;
                }
                break;
            case 'log':
                switch (messageCollection.environment) {
                    case 'prod':
                        connectionResource = logClientProd;
                        break;
                    case 'dev':
                    case 'local':
                    case 'staging':
                        connectionResource = logClientDev;
                        break;
                }
                break;
        }

        try {
            connectionResource.execute(query, params, {
                prepare: true
            }, function (err, result) {
                if (!err) {
                    console.log("\x1b[32m - query success \x1b[0m | " + query);
                    console.log("\x1b[32m - query params \x1b[0m | " + params);
                    console.log('\x1b[32m Success \x1b[0m');
                    console.log('\x1b[32m Result \x1b[0m : ' + JSON.stringify(result));
                    callback(false, result);
                    return;
                } else {
                    console.log("\x1b[31m query failed \x1b[0m | " + query);
                    console.log("\x1b[31m query params \x1b[0m | " + params);
                    console.log(err);
                    callback(true, err);
                    return;
                }
            });
        } catch (connectionResourceError) {
            console.log("connectionResourceError: ", connectionResourceError)
        }

    };
}
module.exports = CassandraWrapper;
