/*
 *author: Sri Sai Venkatesh 
 * 
 */

let ParticipantService = require("../services/activityParticipantService");
const ActivityListingService = require("../services/activityListingService");

function ActivityParticipantController(objCollection) {

    let responseWrapper = objCollection.responseWrapper;
    let cacheWrapper = objCollection.cacheWrapper;
    let queueWrapper = objCollection.queueWrapper;
    let app = objCollection.app;
    let util = objCollection.util;
    
    let activityCommonService = objCollection.activityCommonService;

    let participantService = new ParticipantService(objCollection);
    const activityListingService = new ActivityListingService(objCollection);

    app.post('/' + global.config.version + '/activity/participant/list', function (req, res) {
        participantService.getParticipantsList(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode,req.body));
            } else {
                //console.log('did not get proper response');
                //global.logger.write('debug', 'Did not get proper response', err, req);
                util.logError(req.body,`getParticipantsList debug Did not get proper response Error %j`, { err,body : req.body });

                data = new Array();
                res.json(responseWrapper.getResponse(err, data, statusCode));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/participant/access/set', function (req, res) {
        let assetMessageCounter = 0;
        let deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        let productId;
        
        if(!req.body.hasOwnProperty('product_id')) {
            productId = 1;
        } else {
            productId = req.body.product_id;
        }
        
        /*if(productId == 2) {
            activityCommonService.getActivityDetails(req.body, 0, function(err, data){
                var x = data[0].activity_type_category_id;                
                // console.log('X : ', data[0].activity_type_category_id);
                global.logger.write('conLog', 'X : ' + data[0].activity_type_category_id, {}, req.body);

                req.body.activity_type_category_id = x;
            });
        } */
        
        let proceedParticipantAccessSet = function () {
            let event = {
                name: "assignParticipnt",
                service: "activityParticipantService",
                method: "assignCoworker",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.json(responseWrapper.getResponse(true, {}, -5998,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5 || Number(req.device_os_id) !== 6) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            //global.logger.write('serverError', "Error in setting in asset parity", err, req.body);
                                            util.logError(req.body,`setAssetParity serverError Error in setting in asset parity Error %j`, { err,body : req.body });

                                        } else
                                            //console.log("asset parity is set successfully")
                                            //global.logger.write('conLog', "Asset parity is set successfully", {}, req.body);
                                            util.logInfo(req.body,`setAssetParity  Asset parity is set successfully %j`,{body : req.body});

                                    });
                                }
                            }
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                            return;
                        }
                });
            //res.json(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5 && deviceOsId !== 6) {

                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.json(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantAccessSet();

                        } else {  // this is a duplicate hit,
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5 || deviceOsId === 6) {
                /*if(productId == 2) {
                    activityCommonService.getActivityDetails(req.body, 0, function(err, data){
                        var x = data[0].activity_type_category_id;                
                        // console.log('X : ', data[0].activity_type_category_id);
                        global.logger.write('debug', 'X : ' + data[0].activity_type_category_id, {}, req.body);

                        req.body.activity_type_category_id = x;
                        
                        proceedParticipantAccessSet();
                    });
                } else {
                    proceedParticipantAccessSet();
                } */
                proceedParticipantAccessSet();
            } else {
                res.json(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3301,req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/participant/access/v1/set', function (req, res) {
        let assetMessageCounter = 0;
        let deviceOsId = 0;
        req.body.apiVersion = 'v1';
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        let productId;
        
        if(!req.body.hasOwnProperty('product_id')) {
            productId = 1;
        } else {
            productId = req.body.product_id;
        }
        
        /*if(productId == 2) {
            activityCommonService.getActivityDetails(req.body, 0, function(err, data){
                var x = data[0].activity_type_category_id;                
                // console.log('X : ', data[0].activity_type_category_id);
                global.logger.write('conLog', 'X : ' + data[0].activity_type_category_id, {}, req.body);

                req.body.activity_type_category_id = x;
            });
        } */
        
        let proceedParticipantAccessSet = function () {
            let event = {
                name: "assignParticipnt",
                service: "activityParticipantService",
                method: "assignCoworker",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.json(responseWrapper.getResponse(true, {}, -5998,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5 || Number(req.device_os_id) !== 6) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            //global.logger.write('serverError', "Error in setting in asset parity", err, req.body);
                                            util.logError(req.body,`setAssetParity serverError Error in setting in asset parity Error %j`, { err,body : req.body });

                                        } else
                                            //console.log("asset parity is set successfully")
                                            //global.logger.write('conLog', "Asset parity is set successfully", {}, req.body);
                                            util.logInfo(req.body,`setAssetParity  Asset parity is set successfully %j`,{body : req.body});

                                    });
                                }
                            }
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                            return;
                        }
                });
            //res.json(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5 && deviceOsId !== 6) {

                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.json(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantAccessSet();

                        } else {  // this is a duplicate hit,
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5 || deviceOsId === 6) {
                /*if(productId == 2) {
                    activityCommonService.getActivityDetails(req.body, 0, function(err, data){
                        var x = data[0].activity_type_category_id;                
                        // console.log('X : ', data[0].activity_type_category_id);
                        global.logger.write('debug', 'X : ' + data[0].activity_type_category_id, {}, req.body);

                        req.body.activity_type_category_id = x;
                        
                        proceedParticipantAccessSet();
                    });
                } else {
                    proceedParticipantAccessSet();
                } */
                proceedParticipantAccessSet();
            } else {
                res.json(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3301,req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/participant/access/reset', function (req, res) {
        let assetMessageCounter = 0;
        let deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        let proceedParticipantAccessReset = function () {
            let event = {
                name: "unassignParticicpant",
                service: "activityParticipantService",
                method: "unassignParticicpant",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.json(responseWrapper.getResponse(false, {}, -5998,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            //global.logger.write('serverError', "Error in setting asset parity", err, req.body);
                                            util.logError(req.body,`setAssetParity serverError Error in setting asset parity Error %j`, { err,body : req.body });
                                        } else
                                            //console.log("asset parity is set successfully")
                                            //global.logger.write('conLog', "Asset parity is set successfully", {}, req.body);
                                            util.logInfo(req.body,`setAssetParity Asset parity is set successfully %j`,{body : req.body});

                                    });
                                }
                            }
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                            return;
                        }
                });
            //res.json(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        try {
            JSON.parse(req.body.activity_participant_collection);
            // console.log('no exception so far');
            //global.logger.write('debug', "No exception so far", {}, req.body);
            util.logInfo(req.body,`activity/participant/access/reset debug No exception so far %j`,{body : req.body});

        } catch (exeption) {
            res.json(responseWrapper.getResponse(false, {}, -3308,req.body));
            return;
        }
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.json(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantAccessReset();
                        } else {  // this is a duplicate hit,
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedParticipantAccessReset();

            } else {
                res.json(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3301,req.body));
        }

    });

    app.post('/' + global.config.version + '/activity/participant/access/alter', function (req, res) {
        let assetMessageCounter = 0;
        let deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        let proceedParticipantAccessReset = function () {
            let event = {
                name: "updateParticipantAccess",
                service: "activityParticipantService",
                method: "updateParticipantAccess",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.json(responseWrapper.getResponse(false, {}, -5999,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            //global.logger.write('serverError', "Error in setting in asset parity", err, req.body);
                                            util.logError(req.body,`setAssetParity serverError Error in setting in asset parity Error %j`, { err,body : req.body });
                                        } else
                                            //console.log("asset parity is set successfully")
                                            //global.logger.write('conLog', "Asset parity is set successfully", {}, req.body);
                                            util.logInfo(req.body,`setAssetParity Asset parity is set successfully %j`,{body : req.body});

                                    });
                                }
                            }
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                            return;
                        }
                });
            // res.json(responseWrapper.getResponse(false, {}, 200,req.body));
            // return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.json(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantAccessReset();
                        } else {  // this is a duplicate hit,
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedParticipantAccessReset();

            } else {
                res.json(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3301,req.body));
        }

    });

    //BETA
    app.post('/' + global.config.version + '/activity/participant/timestamp/alter', function (req, res) {
        let assetMessageCounter = 0;
        let deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        let proceedParticipantTimestampReset = function () {
            let event = {
                name: "updateParticipantAccess",
                service: "activityParticipantService",
                method: "updateParticipantTimestamp",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.json(responseWrapper.getResponse(false, {}, -5998,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            //global.logger.write('serverError', "Error in setting in asset parity", err, req.body);
                                            util.logError(req.body,`setAssetParity serverError Error in setting in asset parity Error %j`, { err,body : req.body });
                                        } else
                                            //console.log("asset parity is set successfully")
                                            //global.logger.write('conLog', "Asset parity is set successfully", {}, req.body);
                                            util.logInfo(req.body,`setAssetParity Asset parity is set successfully %j`,{body : req.body});

                                    });
                                }
                            }
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                            return;
                        }
                });
            //res.json(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.json(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantTimestampReset();
                        } else {  // this is a duplicate hit,
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedParticipantTimestampReset();

            } else {
                res.json(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3301,req.body));
        }

    });
    
    //Adding the invitee as a participant in invitor the ID Card Activity
    app.post('/' + global.config.version + '/activity/access/participant_invitee/set', function (req, res) {
        let assetMessageCounter = 0;
        let deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        let proceedParticipantInviteeAccessSet = function () {
            let event = {
                name: "assignParticipntAsInvitee",
                service: "activityParticipantService",
                method: "addInviteeAsParticipantToIdCard",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.json(responseWrapper.getResponse(true, {}, -5998,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5 || Number(req.device_os_id) !== 6) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            //global.logger.write('serverError', "Error in setting in asset parity", err, req.body);
                                            util.logError(req.body,`setAssetParity serverError Error in setting in asset parity Error %j`, { err,body : req.body });

                                        } else
                                            //console.log("asset parity is set successfully")
                                            //global.logger.write('conLog', "Asset parity is set successfully", {}, req.body);
                                            util.logInfo(req.body,`setAssetParity Asset parity is set successfully %j`,{body : req.body});

                                    });
                                }
                            }
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                            return;
                        }
                });
            //res.json(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5 && deviceOsId !== 6) {

                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.json(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantInviteeAccessSet();

                        } else {  // this is a duplicate hit,
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5 || deviceOsId === 6) {
                proceedParticipantInviteeAccessSet();
            } else {
                res.json(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3301,req.body));
        }
        
    });

    app.post('/' + global.config.version + '/activity/participant/asset_type/list', async (req, res) => {
        const [err, result] = await activityListingService.getAssetForAssetTypeID(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, result.map(participant => {
                return {
                    query_status: participant.query_status,
                    activity_id: participant.activity_id,
                    activity_title: participant.activity_title,
                    activity_description: participant.activity_description,
                    activity_lead_asset_id: participant.activity_lead_asset_id,
                    activity_lead_asset_first_name: participant.activity_lead_asset_first_name,
                    activity_lead_asset_last_name: participant.activity_lead_asset_last_name,
                    activity_lead_asset_image_path: participant.activity_lead_asset_image_path,
                    activity_lead_asset_type_id: participant.activity_lead_asset_type_id,
                    activity_lead_asset_type_name: participant.activity_lead_asset_type_name,
                    activity_owner_asset_id: participant.activity_owner_asset_id,
                    activity_owner_asset_first_name: participant.activity_owner_asset_first_name,
                    activity_owner_asset_last_name: participant.activity_owner_asset_last_name,
                    activity_owner_asset_image_path: participant.activity_owner_asset_image_path,
                    activity_owner_asset_type_id: participant.activity_owner_asset_type_id,
                    activity_owner_asset_type_name: participant.activity_owner_asset_type_name,
                    activity_type_id: participant.activity_type_id,
                    activity_type_name: participant.activity_type_name,
                    activity_type_category_id: participant.activity_type_category_id,
                    activity_type_category_name: participant.activity_type_category_name,
                    asset_id: participant.asset_id,
                    asset_first_name: participant.asset_first_name,
                    asset_last_name: participant.asset_last_name,
                    operating_asset_id: participant.operating_asset_id,
                    operating_asset_first_name: participant.operating_asset_first_name,
                    operating_asset_last_name: participant.operating_asset_last_name
                };
            }), 200, req.body));
        } else {
            console.log("/activity/participant/asset_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });
}


module.exports = ActivityParticipantController;
