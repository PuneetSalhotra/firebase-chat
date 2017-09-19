/*
 *author: Sri Sai Venkatesh 
 * 
 */

var ParticipantService = require("../services/activityParticipantService");


function ActivityParticipantController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var cacheWrapper = objCollection.cacheWrapper;
    var queueWrapper = objCollection.queueWrapper;
    var app = objCollection.app;
    var util = objCollection.util;

    var participantService = new ParticipantService(objCollection);

    app.post('/' + global.config.version + '/activity/participant/list', function (req, res) {
        req.body['module'] = 'activity';

        participantService.getParticipantsList(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode));
            } else {
                console.log('did not get proper rseponse');
                data = new Array();
                res.send(responseWrapper.getResponse(err, data, statusCode));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/participant/access/set', function (req, res) {
        req.body['module'] = 'activity';

        var assetMessageCounter = 0;
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedParticipantAccessSet = function () {
            var event = {
                name: "assignParticipnt",
                service: "activityParticipantService",
                method: "assignCoworker",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id);
            res.send(responseWrapper.getResponse(false, {}, 200));
            return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {

                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantAccessSet();

                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedParticipantAccessSet();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301));
        }
    });

    app.put('/' + global.config.version + '/activity/participant/access/reset', function (req, res) {
        req.body['module'] = 'activity';

        var assetMessageCounter = 0;
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedParticipantAccessReset = function () {
            var event = {
                name: "unassignParticicpant",
                service: "activityParticipantService",
                method: "unassignParticicpant",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id);
            res.send(responseWrapper.getResponse(false, {}, 200));
            return;
        };
        try {
            JSON.parse(req.body.activity_participant_collection);
            console.log('no exception so far');
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {}, -3308));
            return;
        }
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantAccessReset();
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedParticipantAccessReset();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301));
        }

    });

    app.put('/' + global.config.version + '/activity/participant/access/alter', function (req, res) {
        req.body['module'] = 'activity';

        var assetMessageCounter = 0;
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedParticipantAccessReset = function () {
            var event = {
                name: "updateParticipantAccess",
                service: "activityParticipantService",
                method: "updateParticipantAccess",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id);
            res.send(responseWrapper.getResponse(false, {}, 200));
            return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantAccessReset();
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedParticipantAccessReset();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301));
        }

    });


    //

}


module.exports = ActivityParticipantController;