/*
 *author: V Nani Kalyan
 * 
 */
var PamUpdateService = require("../services/pamUpdateService");
function PamUpdateController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var cacheWrapper = objCollection.cacheWrapper;
    var queueWrapper = objCollection.queueWrapper;
    var app = objCollection.app;
    var util = objCollection.util;
    var forEachAsync = objCollection.forEachAsync;
    var pamUpdateService = new PamUpdateService(objCollection);
    
    //PAM
    app.put('/' + global.config.version + '/pam/activity/ingredient/alter', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedCoverUpdate = function () {
            var event = {
                name: "alterActivityIngredient",
                service: "pamUpdateService",
                method: "alterIngredientSubTypeActivity",
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
    
    
    app.put('/' + global.config.version + '/pam/activity/participant/access/reset', function (req, res) {
        var assetMessageCounter = 0;
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedParticipantAccessReset = function () {
            var event = {
                name: "unassignParticicpant",
                service: "pamUpdateService",
                method: "unassignParticicpant",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.send(responseWrapper.getResponse(false, {}, -5998,req.body));
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
                                            global.logger.write('debug',"asset parity is set successfully",{},req.body);

                                    });
                                }
                            }
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                            return;
                        }
                });
            //res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        try {
            JSON.parse(req.body.activity_participant_collection);
            console.log('no exception so far');
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {}, -3308,req.body));
            return;
        }
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantAccessReset();
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedParticipantAccessReset();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
        }

    });
    
    //Activity Status Alter
    app.put('/' + global.config.version + '/pam/activity/status/alter', function (req, res) {
        
        //global.logger.write('debug', 'PAM::/pam/activity/status/alter::'+req.body, {}, req); 
        
        var assetMessageCounter = 0;
        var deviceOsId = 0;
        var activityData = {activity_id: req.body.activity_id, message_unique_id: req.body.message_unique_id}; //BETA
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);
        var activityTypeCategoryId = Number(req.body.activity_type_category_id);

        var proceedActivityStatusAlter = function () {

            var event = {
                name: "pamAlterActivityStatus",
                service: "pamUpdateService",
                method: "alterActivityStatus",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req.body);
                            res.send(responseWrapper.getResponse(true, activityData, -5999,req.body));
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
                                        global.logger.write('debug',"asset parity is set successfully",{},req.body);

                                    });
                                }
                            }
                            res.send(responseWrapper.getResponse(false, activityData, 200,req.body));
                        }
                });
            //res.send(responseWrapper.getResponse(false, activityData, 200,req.body));
            //return;
        };
        if (util.hasValidGenericId(req.body, 'activity_type_category_id')) {
            if (util.hasValidGenericId(req.body, 'activity_id')) {
                if (util.hasValidGenericId(req.body, 'activity_status_type_id')) {
                    if ((util.hasValidGenericId(req.body, 'asset_message_counter')) && deviceOsId !== 5) {
                        cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                            if (err) {
                                res.send(responseWrapper.getResponse(false, activityData, -7998,req.body));
                            } else {
                                if (status) {     // proceed
                                    proceedActivityStatusAlter();
                                } else {  // this is a duplicate hit,
                                    res.send(responseWrapper.getResponse(false, activityData, 200,req.body));
                                }
                            }
                        });
                    } else if (deviceOsId === 5) {
                        proceedActivityStatusAlter();
                    } else {
                        res.send(responseWrapper.getResponse(false, activityData, -3304,req.body));
                    }
                } else {
                    res.send(responseWrapper.getResponse(false, activityData, -3306,req.body));
                }

            } else {
                res.send(responseWrapper.getResponse(false, activityData, -3301,req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, activityData, -3303,req.body));
            return;
        }

    });
    
    app.put('/' + global.config.version + '/pam/activity/event/covers/alter', function (req, res) {
    	pamUpdateService.activityListUpdateEventCovers(req.body).then(()=>{    	
    		pamUpdateService.activityAssetMappingUpdateEventCovers(req.body).then(()=>{   	
    			res.send(responseWrapper.getResponse({}, {}, 200, req.body));    	
    		}).catch((err) => {        	
    			res.send(responseWrapper.getResponse(err, {}, -999, req.body));
    		});
    	}).catch((err) => {        	
        	res.send(responseWrapper.getResponse(err, {}, -998, req.body));
    	});
    });
    
    app.put('/' + global.config.version + '/pam/activity/status/alter/nonqueue', function (req, res) {
    	//global.logger.write('debug', ':::::::::::::::::::SERVICE START:::::::::::::::::::::', {}, req);
    	//global.logger.write('debug', '/pam/activity/status/alter/nonqueue', {}, req);
    	//global.logger.write('debug', req.body, {}, req);    
    	req.body.is_non_queue = 1;
     	pamUpdateService.alterActivityStatus(req.body, function (err, data) {
     		//global.logger.write('debug', ':::::::::::::::::::NONQUEUE: ALTER STATUS COMPLETED:::::::::::::::::::::', {}, req);
     		//global.logger.write('debug', ':::::::::::::::::::SERVICE END:::::::::::::::::::::', {}, req);
        });
     	
     	res.send(responseWrapper.getResponse({}, {}, 200,req.body));
    });
}

module.exports = PamUpdateController;
