function CacheWrapper(client) {

    this.getServiceId = function (url, callback) {
        const reqBodyObject = {
            url: url,
            module: 'asset'
        };
        client.hget('service_map', url, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HGET service_map ${url}`, err, reqBodyObject);
                callback(err, false);
            } else {
                global.logger.write('cacheResponse', `HGET service_map ${url}`, reply, reqBodyObject);
                callback(false, reply)
            }
        })
    }

    this.getTokenAuth = function (assetId, callback) {
        const reqBodyObject = {
            asset_id: assetId,
            module: 'asset'
        };

        client.hget('asset_map', assetId, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, err, reqBodyObject);
                callback(err, false);
            } else {
                global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, reply, reqBodyObject);
                if (typeof reply === 'string') {
                    var collection = JSON.parse(reply);

                    callback(false, collection.asset_auth_token);
                } else {
                    callback(false, false);
                }
            }
        });
    };

    this.setTokenAuth = function (assetId, collectionString, callback) {

        const reqBodyObject = {
            asset_id: assetId,
            module: 'asset'
        };

        client.hset('asset_map', assetId, collectionString, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HSET asset_map ${JSON.stringify(assetId)} ${JSON.stringify(collectionString)}`, err, reqBodyObject);
                callback(err, false);
            } else {
                global.logger.write('cacheResponse', `HSET asset_map ${JSON.stringify(assetId)} ${JSON.stringify(collectionString)}`, reply, reqBodyObject);
                callback(false, true);
            }
        });
    };

    this.getAssetMap = function (assetId, callback) {

        const reqBodyObject = {
            asset_id: assetId,
            module: 'asset'
        };

        client.hget('asset_map', assetId, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, err, reqBodyObject);
                callback(err, false);
            } else {

                global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, reply, reqBodyObject);
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

        const reqBodyObject = {
            module: 'activity'
        };

        client.incr('activity_id', function (err, id) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `INCR activity_id`, err, reqBodyObject);
                callback(err, 0);
            }

            reqBodyObject.activity_id = id;
            global.logger.write('cacheResponse', `INCR activity_id`, id, reqBodyObject);
            callback(false, id);
        });
    };

    this.getFormTransactionId = function (callback) {

        const reqBodyObject = {
            module: 'activity'
        };

        client.incr('form_transaction_id', function (err, id) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `INCR form_transaction_id`, err, reqBodyObject);
                callback(err, 0);
            }

            reqBodyObject.activity_id = id;
            global.logger.write('cacheResponse', `INCR form_transaction_id`, id, reqBodyObject);
            callback(false, id);
        });
    };


    this.getAssetParity = function (assetId, callback) {

        const reqBodyObject = {
            asset_id: assetId,
            module: 'asset'
        };

        client.hget('asset_message_counter', assetId, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HGET asset_message_counter ${JSON.stringify(assetId)}`, err, reqBodyObject);
                callback(err, false);
            } else {
                global.logger.write('cacheResponse', `HGET asset_message_counter ${JSON.stringify(assetId)}`, reply, reqBodyObject);
                callback(false, Number(reply));
            }
        });
    };

    this.setAssetParity = function (assetId, parity, callback) {

        const reqBodyObject = {
            asset_id: assetId,
            module: 'asset'
        };

        client.hset('asset_message_counter', assetId, parity, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HSET asset_message_counter ${JSON.stringify(assetId)} ${JSON.stringify(parity)}`, err, reqBodyObject);
                callback(true, false);
                return;
            } else {
                //console.log(reply);
                global.logger.write('cacheResponse', `HSET asset_message_counter ${JSON.stringify(assetId)} ${JSON.stringify(parity)}`, reply, reqBodyObject);
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

        const reqBodyObject = {
            module: 'asset'
        };

        client.hget('message_unique_id_lookup', messageUniqueId, function (err, reply) {
            if (err) {
                //console.log(err);
                global.logger.write('cacheResponse', `HGET message_unique_id_lookup ${JSON.stringify(messageUniqueId)}`, err, reqBodyObject);
                callback(err, false);
            } else {
                global.logger.write('cacheResponse', `HGET message_unique_id_lookup ${JSON.stringify(messageUniqueId)}`, reply, reqBodyObject);
                callback(false, reply);
            }
        });
    };

    this.setMessageUniqueIdLookup = function (messageUniqueId, value, callback) {

        const reqBodyObject = {
            module: 'asset'
        };

        client.hset('message_unique_id_lookup', messageUniqueId, value, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HSET message_unique_id_lookup ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, err, reqBodyObject);
                callback(true, false);
                return;
            } else {
                //console.log(reply);
                global.logger.write('cacheResponse', `HSET message_unique_id_lookup ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, reply, reqBodyObject);
                callback(false, true);
                return;
            }
        });
    };

    this.setKafkaMessageUniqueId = function (messageUniqueId, value, callback) {

        const reqBodyObject = {
            module: 'asset'
        };

        client.hset('kafka_message_unique_id', messageUniqueId, value, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HSET kafka_message_unique_id ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, err, reqBodyObject);
                callback(true, err);
                return;
            } else {
                global.logger.write('cacheResponse', `HSET kafka_message_unique_id ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, reply, reqBodyObject);
                callback(false, reply);
                return;
            }
        });
    };

    this.getKafkaMessageUniqueId = function (partition, callback) {
        client.hget('kafka_message_unique_id', partition, function (err, reply) {
            if (err) {
                callback(true, err);
            } else {
                callback(false, reply);
            }
        });
    };

    // Check whether a given asset_id is included for targetted logging
    // Currently, the asset_ids are added to or removed from the redis 
    // set targeted_logging_asset_ids manually. If these operations 
    // need to be handled via servicess, use:
    // SADD: For adding to the set
    // SREM: For removing from the set
    // Ref: https://redis.io/commands/sadd
    this.IsAssetIDTargeted = function (asset_id, callback) {

        const reqBodyObject = {
            asset_id: asset_id,
            module: 'asset'
        };

        client.SISMEMBER("targeted_logging_asset_ids", asset_id, (err, reply) => {
            if (err) {
                global.logger.write('cacheResponse', `SISMEMBER targeted_logging_asset_ids ${JSON.stringify(asset_id)}`, err, reqBodyObject);
                callback(true, err);

            } else {
                global.logger.write('cacheResponse', `SISMEMBER targeted_logging_asset_ids ${JSON.stringify(asset_id)}`, reply, reqBodyObject);
                callback(false, reply);

            }
        })
    };

}

module.exports = CacheWrapper;
