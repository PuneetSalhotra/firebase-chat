function CacheWrapper(client) {

    this.getServiceId = function (url, callback) {
        client.hget('service_map', url, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HGET service_map ${url}`, err, {});
                callback(err, false);
            } else {
                callback(false, reply)
            }
        })
    }

    this.getTokenAuth = function (assetId, callback) {
        client.hget('asset_map', assetId, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, err, {});
                callback(err, false);
            } else {
                global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, reply, {});
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

        client.hset('asset_map', assetId, collectionString, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HSET asset_map ${JSON.stringify(assetId)} ${JSON.stringify(collectionString)}`, err, {});
                callback(err, false);
            } else {
                global.logger.write('cacheResponse', `HSET asset_map ${JSON.stringify(assetId)} ${JSON.stringify(collectionString)}`, reply, {});
                callback(false, true);
            }
        });
    };

    this.getAssetMap = function (assetId, callback) {
        client.hget('asset_map', assetId, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, err, {});
                callback(err, false);
            } else {

                global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, reply, {});
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
                global.logger.write('cacheResponse', `INCR activity_id`, err, {});
                callback(err, 0);
            }
            //console.log('getActivityId => ' + id);
            global.logger.write('cacheResponse', `INCR activity_id`, id, {});
            callback(false, id);
        });
    };

    this.getFormTransactionId = function (callback) {

        client.incr('form_transaction_id', function (err, id) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `INCR form_transaction_id`, err, {});
                callback(err, 0);
            }
            //console.log('getActivityId => ' + id);
            global.logger.write('cacheResponse', `INCR form_transaction_id`, id, {});
            callback(false, id);
        });
    };


    this.getAssetParity = function (assetId, callback) {

        client.hget('asset_message_counter', assetId, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HGET asset_message_counter ${JSON.stringify(assetId)}`, err, {});
                callback(err, false);
            } else {
                global.logger.write('cacheResponse', `HGET asset_message_counter ${JSON.stringify(assetId)}`, reply, {});
                callback(false, Number(reply));
            }
        });
    };

    this.setAssetParity = function (assetId, parity, callback) {

        client.hset('asset_message_counter', assetId, parity, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HSET asset_message_counter ${JSON.stringify(assetId)} ${JSON.stringify(parity)}`, err, {});
                callback(true, false);
                return;
            } else {
                //console.log(reply);
                global.logger.write('cacheResponse', `HSET asset_message_counter ${JSON.stringify(assetId)} ${JSON.stringify(parity)}`, reply, {});
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
                global.logger.write('cacheResponse', `HGET message_unique_id_lookup ${JSON.stringify(messageUniqueId)}`, err, {});
                callback(err, false);
            } else {
                global.logger.write('cacheResponse', `HGET message_unique_id_lookup ${JSON.stringify(messageUniqueId)}`, reply, {});
                callback(false, reply);
            }
        });
    };

    this.setMessageUniqueIdLookup = function (messageUniqueId, value, callback) {

        client.hset('message_unique_id_lookup', messageUniqueId, value, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HSET message_unique_id_lookup ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, err, {});
                callback(true, false);
                return;
            } else {
                //console.log(reply);
                global.logger.write('cacheResponse', `HSET message_unique_id_lookup ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, reply, {});
                callback(false, true);
                return;
            }
        });
    };

    this.setKafkaMessageUniqueId = function (messageUniqueId, value, callback) {
        client.hset('kafka_message_unique_id', messageUniqueId, value, function (err, reply) {
            if (err) {
                console.log(err);
                global.logger.write('cacheResponse', `HSET kafka_message_unique_id ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, err, {});
                callback(true, err);
                return;
            } else {
                global.logger.write('cacheResponse', `HSET kafka_message_unique_id ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, reply, {});
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
        client.SISMEMBER("targeted_logging_asset_ids", asset_id, (err, reply) => {
            if (err) {
                global.logger.write('cacheResponse', `SISMEMBER targeted_logging_asset_ids ${JSON.stringify(asset_id)}`, err, {});
                callback(true, err);

            } else {
                global.logger.write('cacheResponse', `SISMEMBER targeted_logging_asset_ids ${JSON.stringify(asset_id)}`, reply, {});
                callback(false, reply);

            }
        })
    };

}

module.exports = CacheWrapper;
