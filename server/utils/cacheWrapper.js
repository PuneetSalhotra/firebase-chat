const logger = require("../logger/winstonLogger");

function CacheWrapper(client) {

    this.getServiceId = function (url, callback) {
        // const reqBodyObject = {
        //     url: url,
        //     module: 'asset'
        // };
        client.hget('service_map', url, function (err, reply) {
            if (err) {
                logger.error(`HGET service_map ${url}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `HGET service_map ${url}`, err, reqBodyObject);
                callback(err, false);
            } else {
                logger.verbose(`HGET service_map ${url}`, { type: 'redis', cache_response: reply, error: err });
                // global.logger.write('cacheResponse', `HGET service_map ${url}`, reply, reqBodyObject);
                callback(false, reply);
            }
        });
    };

    this.getTokenAuth = function (assetId, callback) {
        // const reqBodyObject = {
        //     asset_id: assetId,
        //     module: 'asset'
        // };

        client.hget('asset_map', assetId, function (err, reply) {
            if (err) {
                logger.error(`HGET asset_map ${JSON.stringify(assetId)}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, err, reqBodyObject);
                callback(err, false);
            } else {
                logger.verbose(`HGET asset_map ${JSON.stringify(assetId)}`, { type: 'redis', cache_response: reply, error: err });
                // global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, reply, reqBodyObject);
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

        // const reqBodyObject = {
        //     asset_id: assetId,
        //     module: 'asset'
        // };

        client.hset('asset_map', assetId, collectionString, function (err, reply) {
            if (err) {
                logger.error(`HSET asset_map ${JSON.stringify(assetId)} ${JSON.stringify(collectionString)}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `HSET asset_map ${JSON.stringify(assetId)} ${JSON.stringify(collectionString)}`, err, reqBodyObject);
                callback(err, false);
            } else {
                logger.verbose(`HSET asset_map ${JSON.stringify(assetId)} ${JSON.stringify(collectionString)}`, { type: 'redis', cache_response: reply, error: err });
                // global.logger.write('cacheResponse', `HSET asset_map ${JSON.stringify(assetId)} ${JSON.stringify(collectionString)}`, reply, reqBodyObject);
                callback(false, true);
            }
        });
    };

    this.getAssetMap = function (assetId, callback) {

        // const reqBodyObject = {
        //     asset_id: assetId,
        //     module: 'asset'
        // };

        client.hget('asset_map', assetId, function (err, reply) {
            if (err) {
                logger.error(`HGET asset_map ${JSON.stringify(assetId)}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, err, reqBodyObject);
                callback(err, false);
            } else {
                logger.verbose(`HGET asset_map ${JSON.stringify(assetId)}`, { type: 'redis', cache_response: reply, error: err });
                // global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, reply, reqBodyObject);
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

    this.getAssetMapPromise = function (assetID) {
        return new Promise((resolve, reject) => {
            client.hget('asset_map', assetID, function (err, reply) {
                if (err) {
                    logger.error(`HGET asset_map ${JSON.stringify(assetID)}`, { type: 'redis', cache_response: reply, error: err });
                    reject(0);
                } else {
                    logger.verbose(`HGET asset_map ${JSON.stringify(assetID)}`, { type: 'redis', cache_response: reply, error: err });
                    var collection = {};
                    if (typeof reply === 'string') {
                        collection = JSON.parse(reply);
                        resolve(collection);
                    } else {
                        resolve(collection);
                    }
                }
            });
        });
    }


    this.getActivityId = function (callback) {

        // const reqBodyObject = {
        //     module: 'activity'
        // };

        client.incr('activity_id', function (err, id) {
            if (err) {
                logger.error(`INCR activity_id`, { type: 'redis', cache_response: id, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `INCR activity_id`, err, reqBodyObject);
                callback(err, 0);
            }

            // reqBodyObject.activity_id = id;
            logger.verbose(`INCR activity_id`, { type: 'redis', cache_response: id, error: err });
            // global.logger.write('cacheResponse', `INCR activity_id`, id, reqBodyObject);
            callback(false, id);
        });
    };

    this.getActivityIdPromise = () => {
        return new Promise((resolve, reject) => {
            // const reqBodyObject = {
            //     module: 'activity'
            // };

            client.incr('activity_id', function (err, id) {
                if (err) {
                    logger.error(`INCR activity_id`, { type: 'redis', cache_response: id, error: err });
                    // console.log(err);
                    // global.logger.write('cacheResponse', `INCR activity_id`, err, reqBodyObject);
                    resolve(0);
                }

                // reqBodyObject.activity_id = id;
                logger.verbose(`INCR activity_id`, { type: 'redis', cache_response: id, error: err });
                // global.logger.write('cacheResponse', `INCR activity_id`, id, reqBodyObject);
                resolve(id);
            });
        });
    };

    this.getFormTransactionId = function (callback) {

        // const reqBodyObject = {
        //     module: 'activity'
        // };

        client.incr('form_transaction_id', function (err, id) {
            if (err) {
                logger.error(`INCR form_transaction_id`, { type: 'redis', cache_response: id, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `INCR form_transaction_id`, err, reqBodyObject);
                callback(err, 0);
            }

            // reqBodyObject.activity_id = id;
            logger.verbose(`INCR form_transaction_id`, { type: 'redis', cache_response: id, error: err });
            // global.logger.write('cacheResponse', `INCR form_transaction_id`, id, reqBodyObject);
            callback(false, id);
        });
    };

    this.getFormTransactionIdPromise = () => {
        return new Promise((resolve, reject) => {
            // const reqBodyObject = {
            //     module: 'activity'
            // };

            client.incr('form_transaction_id', function (err, id) {
                if (err) {
                    logger.error(`INCR form_transaction_id`, { type: 'redis', cache_response: id, error: err });
                    // console.log(err);
                    // global.logger.write('cacheResponse', `INCR form_transaction_id`, err, reqBodyObject);
                    resolve(0);
                }

                // reqBodyObject.activity_id = id;
                logger.verbose(`INCR form_transaction_id`, { type: 'redis', cache_response: id, error: err });
                // global.logger.write('cacheResponse', `INCR form_transaction_id`, id, reqBodyObject);
                resolve(id);
            });
        });
    };


    this.getAssetParity = function (assetId, callback) {

        // const reqBodyObject = {
        //     asset_id: assetId,
        //     module: 'asset'
        // };

        client.hget('asset_message_counter', assetId, function (err, reply) {
            if (err) {
                logger.error(`HGET asset_message_counter ${JSON.stringify(assetId)}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `HGET asset_message_counter ${JSON.stringify(assetId)}`, err, reqBodyObject);
                callback(err, false);
            } else {
                logger.verbose(`HGET asset_message_counter ${JSON.stringify(assetId)}`, { type: 'redis', cache_response: reply, error: err });
                // global.logger.write('cacheResponse', `HGET asset_message_counter ${JSON.stringify(assetId)}`, reply, reqBodyObject);
                callback(false, Number(reply));
            }
        });
    };

    this.setAssetParity = function (assetId, parity, callback) {

        // const reqBodyObject = {
        //     asset_id: assetId,
        //     module: 'asset'
        // };

        client.hset('asset_message_counter', assetId, parity, function (err, reply) {
            if (err) {
                logger.error(`HSET asset_message_counter ${JSON.stringify(assetId)} ${JSON.stringify(parity)}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `HSET asset_message_counter ${JSON.stringify(assetId)} ${JSON.stringify(parity)}`, err, reqBodyObject);
                callback(true, false);
                return;
            } else {
                logger.verbose(`HSET asset_message_counter ${JSON.stringify(assetId)} ${JSON.stringify(parity)}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(reply);
                // global.logger.write('cacheResponse', `HSET asset_message_counter ${JSON.stringify(assetId)} ${JSON.stringify(parity)}`, reply, reqBodyObject);
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

        // const reqBodyObject = {
        //     module: 'asset'
        // };

        client.hget('message_unique_id_lookup', messageUniqueId, function (err, reply) {
            if (err) {
                logger.error(`HGET message_unique_id_lookup ${JSON.stringify(messageUniqueId)}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `HGET message_unique_id_lookup ${JSON.stringify(messageUniqueId)}`, err, reqBodyObject);
                callback(err, false);
            } else {
                logger.verbose(`HGET message_unique_id_lookup ${JSON.stringify(messageUniqueId)}`, { type: 'redis', cache_response: reply, error: err });
                // global.logger.write('cacheResponse', `HGET message_unique_id_lookup ${JSON.stringify(messageUniqueId)}`, reply, reqBodyObject);
                callback(false, reply);
            }
        });
    };

    this.setMessageUniqueIdLookup = function (messageUniqueId, value, callback) {

        // const reqBodyObject = {
        //     module: 'asset'
        // };

        client.hset('message_unique_id_lookup', messageUniqueId, value, function (err, reply) {
            if (err) {
                logger.error(`HSET message_unique_id_lookup ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `HSET message_unique_id_lookup ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, err, reqBodyObject);
                callback(true, false);
                return;
            } else {
                logger.verbose(`HSET message_unique_id_lookup ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(reply);
                // global.logger.write('cacheResponse', `HSET message_unique_id_lookup ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, reply, reqBodyObject);
                callback(false, true);
                return;
            }
        });
    };

    this.setKafkaMessageUniqueId = function (messageUniqueId, value, callback) {

        // const reqBodyObject = {
        //     module: 'asset'
        // };

        client.hset('kafka_message_unique_id', messageUniqueId, value, function (err, reply) {
            if (err) {
                logger.error(`HSET kafka_message_unique_id ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `HSET kafka_message_unique_id ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, err, reqBodyObject);
                callback(true, err);
                return;
            } else {
                logger.verbose(`HSET kafka_message_unique_id ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, { type: 'redis', cache_response: reply, error: err });
                // global.logger.write('cacheResponse', `HSET kafka_message_unique_id ${JSON.stringify(messageUniqueId)} ${JSON.stringify(value)}`, reply, reqBodyObject);
                callback(false, reply);
                return;
            }
        });
    };

    this.getKafkaMessageUniqueId = function (partition, callback) {
        client.hget('kafka_message_unique_id', partition, function (err, reply) {
            if (err) {
                logger.error(`HGET kafka_message_unique_id ${JSON.stringify(partition)}`, { type: 'redis', cache_response: reply, error: err });
                callback(true, err);
            } else {
                logger.verbose(`HGET kafka_message_unique_id ${JSON.stringify(partition)}`, { type: 'redis', cache_response: reply, error: err });
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

        // const reqBodyObject = {
        //     asset_id: asset_id,
        //     module: 'asset'
        // };

        client.SISMEMBER("targeted_logging_asset_ids", asset_id, (err, reply) => {
            if (err) {
                logger.error(`SISMEMBER targeted_logging_asset_ids ${JSON.stringify(asset_id)}`, { type: 'redis', cache_response: reply, error: err });
                // global.logger.write('cacheResponse', `SISMEMBER targeted_logging_asset_ids ${JSON.stringify(asset_id)}`, err, reqBodyObject);
                callback(true, err);

            } else {
                logger.verbose(`SISMEMBER targeted_logging_asset_ids ${JSON.stringify(asset_id)}`, { type: 'redis', cache_response: reply, error: err });
                // global.logger.write('cacheResponse', `SISMEMBER targeted_logging_asset_ids ${JSON.stringify(asset_id)}`, reply, reqBodyObject);
                callback(false, reply);

            }
        });
    };

    this.setCSDNumber = function (accountCode, mobileNumber, callback) {

        // const reqBodyObject = {
        //     account_code: accountCode,
        //     mobile_number: mobileNumber,
        //     module: 'vodafone'
        // };

        client.hset('CSDNumber', accountCode, mobileNumber, function (err, reply) {
            if (err) {
                logger.error(`HSET CSDNumber ${JSON.stringify(accountCode)} ${mobileNumber}`, { type: 'redis', cache_response: reply, error: err });
                // console.log(err);
                // global.logger.write('cacheResponse', `HSET CSDNumber ${JSON.stringify(accountCode)} ${mobileNumber}`, err, reqBodyObject);
                callback(err, false);
            } else {
                logger.verbose(`HSET CSDNumber ${JSON.stringify(accountCode)} ${mobileNumber}`, { type: 'redis', cache_response: reply, error: err });
                // global.logger.write('cacheResponse', `HSET CSDNumber ${JSON.stringify(accountCode)} ${mobileNumber}`, reply, reqBodyObject);
                callback(false, true);
            }
        });
    };

    this.getCSDNumber = function (accountCode, callback) {
        client.hget('CSDNumber', accountCode, function (err, reply) {
            if (err) {
                logger.error(`HGET CSDNumber ${JSON.stringify(accountCode)}`, { type: 'redis', cache_response: reply, error: err });
                callback(true, err);
            } else {
                logger.verbose(`HGET CSDNumber ${JSON.stringify(accountCode)}`, { type: 'redis', cache_response: reply, error: err });
                callback(false, reply);
            }
        });
    };

    this.setOrgLastPubnubPushTimestamp = (organizationID, timestamp) => {
        // const reqBodyObject = {
        //     organization_id: organizationID,
        //     module: 'asset'
        // };
        return new Promise((resolve, reject) => {
            client.hset('org_pubnub_push_rate_limit', organizationID, timestamp, function (err, reply) {
                if (err) {
                    logger.error(`HSET org_pubnub_push_rate_limit ${JSON.stringify(organizationID)} ${JSON.stringify(timestamp)}`, { type: 'redis', cache_response: reply, error: err });
                    // console.log(err);
                    // global.logger.write('cacheResponse', `HSET org_pubnub_push_rate_limit ${JSON.stringify(organizationID)} ${JSON.stringify(timestamp)}`, err, reqBodyObject);
                    reject(0);
                } else {
                    logger.verbose(`HSET org_pubnub_push_rate_limit ${JSON.stringify(organizationID)} ${JSON.stringify(timestamp)}`, { type: 'redis', cache_response: reply, error: err });
                    // console.log(reply);
                    // global.logger.write('cacheResponse', `HSET org_pubnub_push_rate_limit ${JSON.stringify(organizationID)} ${JSON.stringify(timestamp)}`, reply, reqBodyObject);
                    resolve(reply);
                }
            });
        });
    };

    this.getOrgLastPubnubPushTimestamp = (organizationID) => {
        // const reqBodyObject = {
        //     organization_id: organizationID,
        //     module: 'asset'
        // };
        return new Promise((resolve, reject) => {
            client.hget('org_pubnub_push_rate_limit', organizationID, function (err, reply) {
                if (err) {
                    logger.error(`HGET org_pubnub_push_rate_limit ${JSON.stringify(organizationID)}`, { type: 'redis', cache_response: reply, error: err });
                    // console.log(err);
                    // global.logger.write('cacheResponse', `HGET org_pubnub_push_rate_limit ${JSON.stringify(organizationID)}`, err, reqBodyObject);
                    reject(0);
                } else {
                    logger.verbose(`HGET org_pubnub_push_rate_limit ${JSON.stringify(organizationID)}`, { type: 'redis', cache_response: reply, error: err });
                    // console.log(reply);
                    // global.logger.write('cacheResponse', `HGET org_pubnub_push_rate_limit ${JSON.stringify(organizationID)}`, reply, reqBodyObject);
                    resolve(reply);
                }
            });
        });
    };

    this.getEmailProvider = function () {
        return new Promise((resolve, reject) => {
            client.hget('APP_CONFIG', 'EMAIL_PROVIDER', function (err, reply) {
                if (err) {
                    logger.error(`HGET APP_CONFIG EMAIL_PROVIDER`, { type: 'redis', cache_response: reply, error: err });
                    reject(0);
                } else {
                    logger.verbose(`HGET APP_CONFIG EMAIL_PROVIDER`, { type: 'redis', cache_response: reply, error: err });
                    resolve(reply);
                }
            });
        });
    };

    
    this.setOffset = (kafkaTopic, partitionOffset, status) => { 
        //Status - Open 1; Close 0
        //Open means  - message is yet to be read
        //Close means - message is read
        return new Promise((resolve, reject)=>{
            client.hset(kafkaTopic, partitionOffset, status, (err, reply) => {
                if (err) {
                    logger.error(`HSET ${kafkaTopic} ${JSON.stringify(partitionOffset)} ${JSON.stringify(status)}`, { type: 'redis', cache_response: reply, error: err });
                    // console.log(err);
                    reject(err);
                } else {
                    logger.verbose(`HSET ${kafkaTopic} ${JSON.stringify(partitionOffset)} ${JSON.stringify(status)}`, { type: 'redis', cache_response: reply, error: err });
                    resolve();
                }
            });
        });
    };
    

    this.getOffset = (kafkaTopic, partitionOffset) => {
        //Status - Open 1; Close 0
        //Open means  - message is yet to be read
        //Close means - message is read
        return new Promise((resolve, reject)=>{
            client.hget(kafkaTopic, partitionOffset, (err, reply) => {
                if (err) {
                    logger.error(`HGET ${kafkaTopic} ${JSON.stringify(partitionOffset)}`, { type: 'redis', cache_response: reply, error: err });
                    // console.log(err);
                    reject(err);
                } else {
                    logger.verbose(`HGET ${kafkaTopic} ${JSON.stringify(partitionOffset)}`, { type: 'redis', cache_response: reply, error: err });
                    // global.logger.write('cacheResponse', `HGET asset_map ${JSON.stringify(assetId)}`, reply, reqBodyObject);
                    resolve(reply);
                }
            });
        });
    };


    this.deleteOffset = (kafkaTopic, partitionOffset, status) => { 
        //Status - Open 1; Close 0
        //Open means  - message is yet to be read
        //Close means - message is read
        return new Promise((resolve, reject)=>{
            client.hdel(kafkaTopic, partitionOffset, status, (err, reply) => {
                if (err) {
                    logger.error(`HDEL ${kafkaTopic} ${JSON.stringify(partitionOffset)} ${JSON.stringify(status)}`, { type: 'redis', cache_response: reply, error: err });
                    // console.log(err);
                    reject(err);
                } else {
                    logger.verbose(`HDEL ${kafkaTopic} ${JSON.stringify(partitionOffset)} ${JSON.stringify(status)}`, { type: 'redis', cache_response: reply, error: err });
                    resolve();
                }
            });
        });
    };


    this.getTokenAuthPromise = (assetId) => {
        return new Promise((resolve, reject) => {
            client.hget('asset_map', assetId, function (err, reply) {
                if (err) {
                    logger.error(`HGET asset_map ${JSON.stringify(assetId)}`, { type: 'redis', cache_response: reply, error: err });                    
                    reject([err, false]);
                } else {
                    logger.verbose(`HGET asset_map ${JSON.stringify(assetId)}`, { type: 'redis', cache_response: reply, error: err });                    
                    if (typeof reply === 'string') {
                        var collection = JSON.parse(reply);    
                        resolve([false, collection.asset_auth_token]);
                    } else {
                        resolve([false, false]);
                    }
                }
            });
        });        
    };

    this.getOpportunityIdPromise = () => {
        return new Promise((resolve, reject) => {
            client.incr('opportunity_id', function (err, id) {
                if (err) {
                    logger.error(`INCR opportunity_id`, { type: 'redis', cache_response: id, error: err });
                    // console.log(err);
                    // global.logger.write('cacheResponse', `INCR opportunity_id`, err, reqBodyObject);
                    resolve(0);
                }

                logger.verbose(`INCR opportunity_id`, { type: 'redis', cache_response: id, error: err });
                // global.logger.write('cacheResponse', `INCR opportunity_id`, id, reqBodyObject);
                resolve(id);
            });
        });
    };

    this.setOppurtunity = (setValue) => {
        return new Promise((resolve, reject) => {
            client.set('opportunity_id', setValue, function (err, reply) {
                if (err) {
                    logger.error(`SET opportunity_id ${JSON.stringify(setValue)}`, { type: 'redis', cache_response: reply, error: err });
                    // console.log(err);
                    // global.logger.write('cacheResponse', `HSET asset_map ${JSON.stringify(assetId)} ${JSON.stringify(collectionString)}`, err, reqBodyObject);
                    resolve(err);
                } else {
                    logger.verbose(`SET opportunity_id ${JSON.stringify(setValue)}`, { type: 'redis', cache_response: reply, error: err });
                    // global.logger.write('cacheResponse', `HSET asset_map ${JSON.stringify(assetId)} ${JSON.stringify(collectionString)}`, reply, reqBodyObject);
                    resolve(reply);
                }
            });
        });        
    };

    this.getAssetParityPromise = async (assetId) => {
        let error = true,
            responseData = [];

        await new Promise((resolve, reject)=>{
            client.hget('asset_message_counter', assetId, function (err, reply) {
                if (err) {
                    logger.error(`HGET asset_message_counter ${JSON.stringify(assetId)}`, { type: 'redis', cache_response: reply, error: err });
                    resolve();                    
                } else {
                    logger.verbose(`HGET asset_message_counter ${JSON.stringify(assetId)}`, { type: 'redis', cache_response: reply, error: err });
                    error = false;
                    responseData.push({'asset_message_counter': Number(reply)});
                    resolve();
                }
            });
        });
        
        return [error, responseData];
    };

    //get Account SME Sequential number
    this.getSmeSeqNumber = () => {
        return new Promise((resolve, reject) => {

            //To handle the first time reading case - Key will be missing then we are sending 0
            client.get('sme_acccount_seqno', (err, reply) => {
                if(err) {
                    reject(err);
                }
                console.log('REPLY - get sme_acccount_seqno : ', reply);
                if(reply === null) {
                    this.setSmeSeqNumber(0);
                    resolve(0);                    
                } else {
                    
                    client.incr('sme_acccount_seqno', function (err, id) {
                        if (err) {
                            logger.error(`INCR sme_acccount_seqno`, { type: 'redis', cache_response: id, error: err });    
                            reject(err);
                        }
                        logger.verbose(`INCR sme_acccount_seqno`, { type: 'redis', cache_response: id, error: err });                
                        resolve(id);
                    });

                }
            });

        });
    };


    //Set Account SME Sequential number
    this.setSmeSeqNumber = (setValue) => {
        return new Promise((resolve, reject) => {
            client.set('sme_acccount_seqno', setValue, function (err, reply) {
                if (err) {
                    logger.error(`SET sme_acccount_seqno ${JSON.stringify(setValue)}`, { type: 'redis', cache_response: reply, error: err });                    
                    reject(err);
                } else {
                    logger.verbose(`SET sme_acccount_seqno ${JSON.stringify(setValue)}`, { type: 'redis', cache_response: reply, error: err });                    
                    resolve(reply);
                }
            });
        });        
    };


    //get Account VICS Sequential number
    this.getVICSSeqNumber = () => {
        return new Promise((resolve, reject) => {

            //To handle the first time reading case - Key will be missing then we are sending 0
            client.get('vics_acccount_seqno', (err, reply) => {
                if(err) {
                    reject(err);
                }
                console.log('REPLY - get vics_acccount_seqno : ', reply);
                if(reply === null) {
                    this.setSmeSeqNumber(0);
                    resolve(0);                    
                } else {
                    
                    client.incr('vics_acccount_seqno', function (err, id) {
                        if (err) {
                            logger.error(`INCR vics_acccount_seqno`, { type: 'redis', cache_response: id, error: err });    
                            reject(err);
                        }
                        logger.verbose(`INCR vics_acccount_seqno`, { type: 'redis', cache_response: id, error: err });                
                        resolve(id);
                    });
                    
                }
            });

        });
    };


    //Set Account VICS Sequential number
    this.setVICSSeqNumber = (setValue) => {
        return new Promise((resolve, reject) => {
            client.set('vics_acccount_seqno', setValue, function (err, reply) {
                if (err) {
                    logger.error(`SET vics_acccount_seqno ${JSON.stringify(setValue)}`, { type: 'redis', cache_response: reply, error: err });                    
                    reject(err);
                } else {
                    logger.verbose(`SET vics_acccount_seqno ${JSON.stringify(setValue)}`, { type: 'redis', cache_response: reply, error: err });                    
                    resolve(reply);
                }
            });
        });        
    };

    this.setUserNameFromAccessToken = (userName, setValue) => {
        return new Promise((resolve, reject) => {
            //client.set(userName, setValue, function (err, reply) {
            client.hset('cognito_user_map',userName, setValue, function (err, reply) {
                if (err) {
                    logger.error(`HSET UserNameFromAccessToken ${JSON.stringify(setValue)}`, { type: 'redis', cache_response: reply, error: err });                    
                    resolve(err);
                } else {
                    //logger.verbose(`SET UserNameFromAccessToken ${JSON.stringify(setValue)}`, { type: 'redis', cache_response: reply, error: err });                    
                    resolve(reply);
                }
            });
        });        
    };

    this.getUserNameFromAccessToken = (userName) => {
        return new Promise((resolve, reject) => {
            client.hget('cognito_user_map', userName, function (err, reply) {
            //client.get(userName, function (err, reply) {
                if (err) {
                    logger.error(`HGET UserNameFromAccessToken ${JSON.stringify(userName)}`, { type: 'redis', cache_response: reply, error: err });                    
                    resolve(err);
                } else {
                    logger.verbose(`HGET UserNameFromAccessToken ${JSON.stringify(userName)}`, { type: 'redis', cache_response: reply, error: err });                    
                    resolve(reply);
                }
            });
        });        
    };

    this.delUserNameCognito = (userName) => {
        return new Promise((resolve, reject) => {
            client.hdel('cognito_user_map', userName, function (err, reply) {
            //client.del(userName, function (err, reply) {
                if (err) {
                    logger.error(`HDEL UserNameCognito ${JSON.stringify(userName)}`, { type: 'redis', cache_response: reply, error: err });                    
                    resolve(err);
                } else {
                    logger.verbose(`HDEL UserNameCognito ${JSON.stringify(userName)}`, { type: 'redis', cache_response: reply, error: err });                    
                    resolve(reply);
                }
            });
        });        
    };    

}

module.exports = CacheWrapper;
