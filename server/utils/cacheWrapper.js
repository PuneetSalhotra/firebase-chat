
function CacheWrapper(client) {

    this.getTokenAuth = function (assetId, callback) {

        client.hget('asset_map', assetId, function (err, reply) {
            if (err) {
                console.log(err);
                callback(err, false);
            } else {
                //console.log(typeof reply + " is data type of reply");
                //console.log(reply);
                if (typeof reply === 'string') {
                    var collection = JSON.parse(reply);
                    //console.log("enc token retrived from redis is : " + collection.asset_auth_token);
                    callback(false, collection.asset_auth_token);
                } else {
                    callback(false, false);
                }
            }

        });
    };

    this.setTokenAuth = function (assetId, collectionString, callback) {

        client.hset('asset_map', assetId, collectionString, function (err, reply) {
            if (err) {
                console.log(err);
                callback(err, false);
            } else
                callback(false, true);

        });
    };

    this.getAssetMap = function (assetId, callback) {
        client.hget('asset_map', assetId, function (err, reply) {
            if (err) {
                console.log(err);
                callback(err, false);
            } else {
                var collection = {};
                if (typeof reply === 'string') {
                    collection = JSON.parse(reply);                    
                    callback(false, collection);
                } else {
                    callback(false, false);
                }
            }

        });
    };


    this.getActivityId = function (callback) {

        client.incr('activity_id', function (err, id) {
            if (err) {
                console.log(err);
                callback(err, 0);
            }
            //console.log('getActivityId => ' + id);
            callback(false, id);
        });
    };

    this.getFormTransactionId = function (callback) {

        client.incr('form_transaction_id', function (err, id) {
            if (err) {
                console.log(err);
                callback(err, 0);
            }
            //console.log('getActivityId => ' + id);
            callback(false, id);
        });
    };


    this.getAssetParity = function (assetId, callback) {

        client.hget('asset_message_counter', assetId, function (err, reply) {
            if (err) {
                console.log(err);
                callback(err,false);
            } else {                
                callback(false, Number(reply));
            }
        });
    };

    this.setAssetParity = function (assetId, parity, callback) {

        client.hset('asset_message_counter', assetId, parity, function (err, reply) {
            if (err) {
                console.log(err);
                callback(true, false);
                return;
            } else {
                //console.log(reply);
                callback(false, true);
                return;
            }
        });
    };

    this.checkAssetParity = function (assetId, parity, callback) {
        this.getAssetParity(assetId, function (err, reply) {
            if (err === false) {
                if (Number(reply) < parity) {
                    callback(false, true);
                } else
                    callback(false, false);
            } else {
                callback(true, false);
            }
        });
    };

    this.getMessageUniqueIdLookup = function (messageUniqueId, callback) {
        client.hget('message_unique_id_lookup', messageUniqueId, function (err, reply) {
            if (err) {
                //console.log(err);
                callback(err, false);
            } else {
                callback(false, reply);
            }
        });
    };

    this.setMessageUniqueIdLookup = function (messageUniqueId, value, callback) {

        client.hset('message_unique_id_lookup', messageUniqueId, value, function (err, reply) {
            if (err) {
                console.log(err);
                callback(true, false);
                return;
            } else {
                //console.log(reply);
                callback(false, true);
                return;
            }
        });
    };

}

module.exports = CacheWrapper;

