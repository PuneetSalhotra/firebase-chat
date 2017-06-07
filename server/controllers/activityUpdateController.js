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

            queueWrapper.raiseEvent(event, req.body.activity_id);
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

            queueWrapper.raiseEvent(event, req.body.activity_id);
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
}


module.exports = ActivityUpdateController;