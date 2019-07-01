/*
 *author: Sri Sai Venkatesh 
 * 
 */

//var ActivityUpdateService = require("../services/activityUpdateService");

function ActivityUpdateController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var cacheWrapper = objCollection.cacheWrapper;
    var queueWrapper = objCollection.queueWrapper;
    var app = objCollection.app;
    var util = objCollection.util;
    var forEachAsync = objCollection.forEachAsync;

    app.post('/' + global.config.version + '/activity/inline/alter', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedInlineUpdate = function () {
            var event = {
                name: "alterActivityInline",
                service: "activityUpdateService",
                method: "alterActivityInline",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.send(responseWrapper.getResponse(false, {}, -5999,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            global.logger.write('serverError', "error in setting in asset parity", err, req.body);
                                        } else
                                            //console.log("asset parity is set successfully")
                                            global.logger.write('conLog', "asset parity is set successfully", {}, req.body);

                                    });
                                }
                            }
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                });
            //res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        try {
            JSON.parse(req.body.activity_inline_data);
            // console.log('json is fine');
            global.logger.write('conLog', "json is fine", {}, req.body);

        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {}, -3308,req.body));
            return;
        }
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed
                            proceedInlineUpdate();
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedInlineUpdate();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
        }

    });

    app.post('/' + global.config.version + '/activity/cover/alter', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedCoverUpdate = function () {
            var event = {
                name: "alterActivityCover",
                service: "activityUpdateService",
                method: "alterActivityCover",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.send(responseWrapper.getResponse(false, {}, -5999,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            global.logger.write('serverError',"error in setting in asset parity",err,req.body);
                                        } else
                                            //console.log("asset parity is set successfully")
                                            global.logger.write('conLog', "asset parity is set successfully", {}, req.body);

                                    });
                                }
                            }
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                });
            //res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed                        
                            proceedCoverUpdate();
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedCoverUpdate();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
            }

        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/parent/alter', function (req, res) {
        var assetMessageCounter = 0;
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);
        var activityTypeCategoryId = Number(req.body.activity_type_category_id);
        var proceedActivityParentAlter = function () {

            var event = {
                name: "alterActivityParent",
                service: "activityUpdateService",
                method: "alterActivityParent",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.send(responseWrapper.getResponse(true, {}, -5999,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            global.logger.write('serverError',"error in setting in asset parity",err,req.body);
                                        } else
                                            //console.log("asset parity is set successfully")
                                            global.logger.write('conLog', "asset parity is set successfully", {}, req.body);

                                    });
                                }
                            }
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                });
            //res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        if (req.body.activity_type_id !== '' && req.body.activity_type_id !== 0 && req.body.activity_type_category_id !== '' && req.body.activity_type_category_id !== 0) {
            if (util.hasValidActivityId(req.body)) {
                if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                    cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                        if (err) {
                            res.send(responseWrapper.getResponse(false, {}, -7998,req.body));
                        } else {
                            if (status) {     // proceed
                                proceedActivityParentAlter();
                            } else {  // this is a duplicate hit,
                                res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                            }
                        }
                    });
                } else if (deviceOsId === 5) {
                    proceedActivityParentAlter();
                } else {
                    res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
                }

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3303,req.body));
        }

    });
    
    //Added by V Nani Kalyan
    app.post('/' + global.config.version + '/activity/unread/count/reset', function (req, res) {
        var cnt = 0;
        var deviceOsId = 0;
        var activityArray = JSON.parse(req.body.activity_id_array);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);
       
        var proceedUnreadUpdate = function (activityId) {
            req.body.activity_id = activityId; 
            var event = {
                name: "resetUnreadUpdateCount",
                service: "activityUpdateService",
                method: "resetUnreadUpdateCount",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, activityId, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.send(responseWrapper.getResponse(true, {}, -5999,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            global.logger.write('serverError',"error in setting in asset parity",err,req.body);
                                        } else
                                            //console.log("asset parity is set successfully")
                                            global.logger.write('conLog', "asset parity is set successfully", {}, req.body);

                                    });
                                }
                            }
                            cnt++;
                            if(cnt == activityArray.length) {
                                 res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                            }                       
                        }
                }) ;            
        };
            
        if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed                            
                            forEachAsync(activityArray, function (next, rowData) {
                                // console.log(rowData);
                                global.logger.write('debug', 'rowData: ' + JSON.stringify(rowData, null, 2), {}, req.body);

                                proceedUnreadUpdate(rowData);
                                next();
                            });
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                forEachAsync(activityArray, function (next, rowData) {
                                // console.log(rowData);
                                global.logger.write('debug', 'rowData: ' + JSON.stringify(rowData, null, 2), {}, req.body);

                                proceedUnreadUpdate(rowData);
                                next();
                            });
            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
            
        }); 
        
    // Added by V Nani Kalyan
    app.post('/' + global.config.version + '/activity/unread/count/reset/v1', function (req, res) {
        var cnt = 0;
        var deviceOsId = 0;
        try {
            var activityArray = JSON.parse(req.body.activity_id_array);
        } catch (exception) {
            res.send(responseWrapper.getResponse(false, { data: "Invalid Json format" }, -3308, req.body));
            return;
        }

        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedUnreadUpdate = function (rowData) {
            req.body.activity_id = rowData.activity_id;
            req.body.timeline_transaction_id = rowData.timeline_transaction_id;
            req.body.timeline_transaction_datetime = rowData.timeline_transaction_datetime;
            var event = {
                name: "resetUnreadUpdateCount",
                service: "activityUpdateService",
                method: "resetUnreadUpdateCount",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, rowData.activity_id, (err, resp) => {
                if (err) {
                    //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                    //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                    res.send(responseWrapper.getResponse(true, {}, -5999, req.body));
                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                } else {
                    if (req.hasOwnProperty('device_os_id')) {
                        if (Number(req.device_os_id) !== 5) {
                            //incr the asset_message_counter                        
                            cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                if (err) {
                                    //console.log("error in setting in asset parity");
                                    global.logger.write('serverError', "error in setting in asset parity", err, req.body);
                                } else
                                    //console.log("asset parity is set successfully")
                                    global.logger.write('conLog', "asset parity is set successfully", {}, req.body);

                            });
                        }
                    }
                    cnt++;
                    if (cnt == activityArray.length) {
                        res.send(responseWrapper.getResponse(false, {}, 200, req.body));
                    }
                }
            });
        };

        if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
            cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                if (err) {
                    res.send(responseWrapper.getResponse(false, {}, -7998, req.body));
                } else {
                    if (status) {     // proceed                            
                        forEachAsync(activityArray, function (next, rowData) {
                            // console.log(rowData);
                            global.logger.write('debug', 'rowData: ' + JSON.stringify(rowData, null, 2), {}, req.body);

                            proceedUnreadUpdate(rowData);
                            next();
                        });
                    } else {  // this is a duplicate hit,
                        res.send(responseWrapper.getResponse(false, {}, 200, req.body));
                    }
                }
            });

        } else if (deviceOsId === 5) {
            forEachAsync(activityArray, function (next, rowData) {
                // console.log(rowData);
                global.logger.write('debug', 'rowData: ' + JSON.stringify(rowData, null, 2), {}, req.body);

                proceedUnreadUpdate(rowData);
                next();
            });
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3304, req.body));
        }

    }); 
        
        
   //PAM
   app.post('/' + global.config.version + '/pam/activity/cover/alter/channel_activity', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedCoverUpdate = function () {
            var event = {
                name: "alterActivityCover",
                service: "activityUpdateService",
                method: "alterActivityCoverChannelActivity",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{});
            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            return;
        };
        if (util.hasValidActivityId(req.body)) {
            if (deviceOsId === 5) {
                proceedCoverUpdate();
            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
        }
    });
    
    //PAM
    app.post('/' + global.config.version + '/pam/activity/cover/alter/subtype_activity', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedCoverUpdate = function () {
            var event = {
                name: "alterActivityCover",
                service: "activityUpdateService",
                method: "alterCoverSubTypeActivity",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{});
            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            return;
        };
        if (util.hasValidActivityId(req.body)) {
            if (deviceOsId === 5) {
                proceedCoverUpdate();
            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
        }
    });
    
    //BETA
    app.post('/' + global.config.version + '/activity/owner/alter', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedOwnerUpdate = function () {
            var event = {
                name: "alterActivityCover",
                service: "activityUpdateService",
                method: "alterActivityOwner",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.send(responseWrapper.getResponse(true, {}, -5999,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            global.logger.write('serverError',"error in setting in asset parity",err,req.body);
                                        } else
                                            //console.log("asset parity is set successfully")
                                            global.logger.write('conLog', "asset parity is set successfully", {}, req.body);

                                    });
                                }
                            }
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                });
            //res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed                        
                            proceedOwnerUpdate();
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedOwnerUpdate();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
            }

        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
        }
    });    
    
    //Setting or unsetting the activity_flag_file_enabled 
    app.post('/' + global.config.version + '/activity/asset/file_enabled_flag/alter', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedActivityFlagFileUpdate = function () {
            var event = {
                name: "alterActivityFlagFileEnabled",
                service: "activityUpdateService",
                method: "alterActivityFlagFileEnabled",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.send(responseWrapper.getResponse(true, {}, -5999,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            global.logger.write('serverError',"error in setting in asset parity",err,req.body);
                                        } else
                                            //console.log("asset parity is set successfully")
                                            global.logger.write('conLog', "asset parity is set successfully", {}, req.body);

                                    });
                                }
                            }                            
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                });
            //res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed                        
                            proceedActivityFlagFileUpdate();
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedActivityFlagFileUpdate();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
            }

        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
        }
    });

    // Delete a user from the Organization/Workforce
    app.post('/' + global.config.version + '/asset/access/workforce/reset', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id')) {
            deviceOsId = Number(req.body.device_os_id);
        }
        // Get current datetime for logging
        req['datetime_log'] = util.getCurrentUTCTime();

        if ((util.hasValidGenericId(req.body, 'asset_message_counter')) && deviceOsId !== 5 && deviceOsId !== 6) {
            cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                if (err) {
                    res.send(responseWrapper.getResponse(false, {
                        activity_id: 0
                    }, -7998, req.body));
                } else {
                    if (status) { // proceed
                        // console.log("calling deleteAccountFromWorkforce");
                        global.logger.write('conLog', 'calling deleteAccountFromWorkforce', {}, req.body);
                        // Raise event
                        initiateServiceToDeleteUserFromWorkforce(req.body, function (err, data) {
                            if (!err) {
                                res.send(responseWrapper.getResponse(false, data, 200, req.body));
                            } else {
                                // Message not produced to Kafka
                                res.send(responseWrapper.getResponse(err, data, -5998, req.body));
                            }
                        });
                    } else { // get the activity id using message unique id and send as response
                        cacheWrapper.getMessageUniqueIdLookup(req.body.message_unique_id, function (err, activityId) {
                            if (err) {
                                res.send(responseWrapper.getResponse(false, {
                                    activity_id: 0
                                }, -7998, req.body));
                            } else {
                                res.send(responseWrapper.getResponse(false, {
                                    activity_id: Number(activityId)
                                }, 200, req.body));
                            }
                        });
                    }
                }
            });
        } else if (deviceOsId === 5 || deviceOsId === 6) {
            // Raise event
            initiateServiceToDeleteUserFromWorkforce(req.body, function (err, data) {
                if (!err) {
                    res.send(responseWrapper.getResponse(false, data, 200, req.body));
                } else {
                    // Message not produced to Kafka
                    res.send(responseWrapper.getResponse(err, data, -5998, req.body));
                }
            });
        } else {
            res.send(responseWrapper.getResponse(false, {
                activity_id: 0
            }, -3304, req.body));
        }

        
        function initiateServiceToDeleteUserFromWorkforce(reqBody, callback) {
            var event = {
                name: "activityUpdateService",
                service: "activityUpdateService",
                method: "populateDataForRemovingUserFromOrg",
                payload: reqBody
            };

            queueWrapper.raiseActivityEvent(event, reqBody.asset_id, function (err, resp) {
                if (err) {
                    // console.log('Error in queueWrapper raiseActivityEvent : ' + err)
                    global.logger.write('serverError', 'Error in queueWrapper raiseActivityEvent', err, reqBody);
                    callback(true, {})
                } else {
                    if (req.hasOwnProperty('device_os_id')) {
                        if (Number(reqBody.device_os_id) !== 5) {
                            //incr the asset_message_counter                        
                            cacheWrapper.setAssetParity(reqBody.asset_id, reqBody.asset_message_counter, function (err, status) {
                                if (err) {
                                    // console.log("error in setting in asset parity");
                                    global.logger.write('serverError', 'error in setting in asset parity', err, reqBody);
                                } else
                                    // console.log("asset parity is set successfully")
                                    global.logger.write('conLog', "asset parity is set successfully", {}, reqBody);

                            });
                        }
                    }
                    // console.log("populateDataForRemovingUserFromOrg service raised: ", event);
                    global.logger.write('debug', "populateDataForRemovingUserFromOrg service raised: ", event, reqBody);
                    callback(false, {});
                }
            });
        }
    });
    
}

module.exports = ActivityUpdateController;
