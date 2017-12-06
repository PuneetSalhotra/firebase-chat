/*
 * author: Sri Sai Venkatesh
 */
var cassandra = require('cassandra-driver');
function CassandraWrapper() {

    try {
        var logAuthProviderDev = new cassandra.auth.PlainTextAuthProvider(global.config.cassandraCredentialsDev.user, global.config.cassandraCredentialsDev.pwd);
        var logClientDev = new cassandra.Client({contactPoints: [global.config.cassandraCredentialsDev.ip], keyspace: global.config.cassandraCredentialsDev.log_keyspace, authProvider: logAuthProviderDev});

        var logAuthProviderProd = new cassandra.auth.PlainTextAuthProvider(global.config.cassandraCredentialsProd.user, global.config.cassandraCredentialsProd.pwd);
        var logClientProd = new cassandra.Client({contactPoints: [global.config.cassandraCredentialsProd.ip], keyspace: global.config.cassandraCredentialsProd.log_keyspace, authProvider: logAuthProviderProd});

        var sessionAuthProviderDev = new cassandra.auth.PlainTextAuthProvider(global.config.cassandraCredentialsDev.user, global.config.cassandraCredentialsDev.pwd);
        var sessionClientDev = new cassandra.Client({contactPoints: [global.config.cassandraCredentialsDev.ip], keyspace: global.config.cassandraCredentialsDev.session_keyspace, authProvider: logAuthProviderDev});

        var sessionAuthProviderProd = new cassandra.auth.PlainTextAuthProvider(global.config.cassandraCredentialsProd.user, global.config.cassandraCredentialsProd.pwd);
        var sessionClientProd = new cassandra.Client({contactPoints: [global.config.cassandraCredentialsProd.ip], keyspace: global.config.cassandraCredentialsProd.session_keyspace, authProvider: logAuthProviderProd});

    } catch (exception) {
        console.log(exception);
    }

    this.executeQuery = function (messageCollection, query, callback) {
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
                        connectionResource = logClientDev;
                        break;
                }
                break;
        }
        connectionResource.execute(query, function (err, result) {
            if (!err) {
                //console.log(executeIn + " - query success | " + query);
                console.log('Success');
                callback(false, true);
                return;
            } else {
                console.log("query failed | " + query);
                console.log(err);                
                callback(true, false);
                return;
            }
        });

    };
}
module.exports = CassandraWrapper;
