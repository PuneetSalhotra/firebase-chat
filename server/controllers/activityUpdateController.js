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
        req.body['module'] = 'activity';

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

            queueWrapper.raiseActivityEvent(event, req.body.activity_id);
            res.send(responseWrapper.getResponse(false, {}, 200));
            return;
        };
        try {
            JSON.parse(req.body.activity_inline_data);
            console.log('json is fine');
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {}, -3308));
            return;
        }
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998));
                    } else {
                        if (status) {     // proceed
                            proceedInlineUpdate();
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedInlineUpdate();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301));
        }

    });

    app.put('/' + global.config.version + '/activity/cover/alter', function (req, res) {
        req.body['module'] = 'activity';

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

            queueWrapper.raiseActivityEvent(event, req.body.activity_id);
            res.send(responseWrapper.getResponse(false, {}, 200));
            return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998));
                    } else {
                        if (status) {     // proceed                        
                            proceedCoverUpdate();
                            return;
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedCoverUpdate();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304));
            }

        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301));
        }
    });

    app.put('/' + global.config.version + '/activity/parent/alter', function (req, res) {
        req.body['module'] = 'activity';    // adding module name to request so that it is accessable for cassandra logging
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
            queueWrapper.raiseActivityEvent(event, req.body.activity_id);
            res.send(responseWrapper.getResponse(false, {}, 200));
            return;
        };
        if (req.body.activity_type_id !== '' && req.body.activity_type_id !== 0 && req.body.activity_type_category_id !== '' && req.body.activity_type_category_id !== 0) {
            if (util.hasValidActivityId(req.body)) {
                if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                    cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                        if (err) {
                            res.send(responseWrapper.getResponse(false, {}, -7998));
                        } else {
                            if (status) {     // proceed
                                proceedActivityParentAlter();
                            } else {  // this is a duplicate hit,
                                res.send(responseWrapper.getResponse(false, {}, 200));
                            }
                        }
                    });
                } else if (deviceOsId === 5) {
                    proceedActivityParentAlter();
                } else {
                    res.send(responseWrapper.getResponse(false, {}, -3304));
                }

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3301));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3303));
        }

    });

}


module.exports = ActivityUpdateController;
