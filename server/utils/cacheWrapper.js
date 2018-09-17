
function CacheWrapper(client) {

    this.getServiceId = function(url, callback) {
      client.hget('service_map', url, function (err, reply) {
          if (err) {
              console.log(err);
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
                callback(err, false);
            } else {
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
    
    this.setKafkaMessageUniqueId = function (messageUniqueId, value, callback) {
        client.hset('kafka_message_unique_id', messageUniqueId, value, function (err, reply) {
            if (err) {
                console.log(err);
                callback(true, err);
                return;
            } else {                
                callback(false, reply);
                return;
            }
        });
    };
    
    this.getKafkaMessageUniqueId = function (partition, callback) {
        client.hget('kafka_message_unique_id', partition, function (err, reply) {
            if(err) {
                callback(true, err);
            } else {
                callback(false, reply);
            }
        });
    };
    
    this.IsAssetIDTargeted = function (asset_id, callback) {
        client.SISMEMBER("targeted_logging_asset_ids", asset_id, (err, reply) => {
            if (err) {
                console.log("Error: ", err);
                callback(true, err);
            } else {
                callback(false, reply);
                console.log("Reply: ", reply);
                console.log("TypeOf Reply: ", typeof reply);
            }
        })
    };

}

module.exports = CacheWrapper;
