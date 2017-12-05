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

    app.put('/' + global.config.version + '/activity/inline/alter', function (req, res) {
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
                            global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
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
                        }
                });
            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            return;
        };
        try {
            JSON.parse(req.body.activity_inline_data);
            console.log('json is fine');
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

    app.put('/' + global.config.version + '/activity/cover/alter', function (req, res) {
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
                            global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
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
                        }
                });
            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            return;
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

    app.put('/' + global.config.version + '/activity/parent/alter', function (req, res) {
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
                            global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
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
                        }
                });
            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            return;
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
}

module.exports = ActivityUpdateController;
