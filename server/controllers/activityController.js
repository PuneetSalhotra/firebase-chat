/*
 *author: Sri Sai Venkatesh 
 * 
 */

var ActivityService = require("../services/activityService");
var ActivityCommonService = require("../services/activityCommonService");
var AssetService = require("../services/assetService");

function ActivityController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var cacheWrapper = objCollection.cacheWrapper;
    var queueWrapper = objCollection.queueWrapper;
    var app = objCollection.app;
    var util = objCollection.util;

    var activityCommonService = new ActivityCommonService(objCollection.db, objCollection.util);
    //var activityService = new ActivityService(objCollection.db, objCollection.util, objCollection.cacheWrapper, activityCommonService);
    var assetService = new AssetService(objCollection.db, objCollection.util, objCollection.cacheWrapper, activityCommonService);

    app.post('/' + global.config.version + '/activity/add', function (req, res) {

        req.body['module'] = 'activity';    // adding module name to request so that it is accessable for cassandra logging
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedAddActivity = function () {
            console.log('came into proceed add activity ');
            if (req.body.activity_type_id !== '' && req.body.activity_type_id !== 0 && req.body.activity_type_category_id !== '' && req.body.activity_type_category_id !== 0) {
                var activityTypeCategoryId = Number(req.body.activity_type_category_id);
                var parentActivityId = (req.body.activity_parent_id === 'undefined' || req.body.activity_parent_id === '' || req.body.activity_parent_id === null) ? 0 : Number(req.body.activity_parent_id);
                switch (activityTypeCategoryId) {
                    case 29: // Co-worker Contact Card - supplier
                    case 6: // Co-worker Contact Card - customer
                        // this end point is strategically being added in activity controller as 
                        // every contact asset is an activity...
                        assetService.addAsset(req.body, function (err, data, statusCode) {
                            if (err === false) {
                                if (statusCode === 200) {   // go ahead and create a contact activity id
                                    var newAssetId = data.asset_id;
                                    var contactJson = eval('(' + req.body.activity_inline_data + ')');
                                    contactJson['contact_asset_id'] = newAssetId;
                                    req.body.activity_inline_data = JSON.stringify(contactJson);
                                    addActivity(req.body, function (err, activityId) {
                                        if (err === false) {
                                            var responseDataCollection = {asset_id: newAssetId, activity_id: activityId};
                                            res.send(responseWrapper.getResponse(false, responseDataCollection, 200));
                                        } else {
                                            res.send(responseWrapper.getResponse(err, data, statusCode));
                                        }
                                    });
                                } else {
                                    res.send(responseWrapper.getResponse(err, data, statusCode));
                                    return;
                                }

                            } else {
                                //console.log('did not get proper rseponse');
                                res.send(responseWrapper.getResponse(err, {}, statusCode));
                                return;
                            }
                        }.bind(this));
                        break;
                    case 8:     // mail
                        addActivity(req.body, function (err, activityId) {
                            if (err === false) {
                                res.send(responseWrapper.getResponse(false, {activity_id: activityId}, 200));
                                return;
                            } else {
                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998));
                                return;
                            }
                        });

                        break;
                    case 9:     // form                        
                        //generate a form transaction id first and give it back to the client along with new activity id
                        cacheWrapper.getFormTransactionId(function (err, formTransactionId) {
                            if (err) {
                                console.log(err);
                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998));
                                return;
                            } else {
                                req.body['form_transaction_id'] = formTransactionId;
                                addActivity(req.body, function (err, activityId) {
                                    if (err === false) {
                                        res.send(responseWrapper.getResponse(false, {activity_id: activityId, form_transaction_id: formTransactionId}, 200));
                                    } else {
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998));
                                    }
                                });
                            }
                        });
                        break;
                    default:
                        console.log('generating activity id via default condition');
                        addActivity(req.body, function (err, activityId) {
                            if (err === false) {
                                res.send(responseWrapper.getResponse(false, {activity_id: activityId}, 200));
                            } else {
                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998));
                            }
                        });
                        break;
                }
                ;
            } else {
                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -3303));
            }
        };

        if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {

            cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                if (err) {
                    res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998));
                } else {
                    if (status) {     // proceed
                        console.log("calling proceedAddActivity");
                        proceedAddActivity();
                    } else {  // get the activity id using message unique id and send as response
                        cacheWrapper.getMessageUniqueIdLookup(req.body.message_unique_id, function (err, activityId) {
                            if (err) {
                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998));
                            } else {
                                res.send(responseWrapper.getResponse(false, {activity_id: Number(activityId)}, 200));
                            }
                        });
                    }
                }
            });

        } else if (deviceOsId === 5) {
            proceedAddActivity();
        } else {
            res.send(responseWrapper.getResponse(false, {activity_id: 0}, -3304));
        }

    });

    var addActivity = function (req, callback) {
        cacheWrapper.getActivityId(function (err, activityId) {
            if (err) {
                console.log(err);
                callback(true, 0);
                return;
            } else {
                req['activity_id'] = activityId;
                var event = {
                    name: "addActivity",
                    service: "activityService",
                    method: "addActivity",
                    payload: req
                };
                queueWrapper.raiseEvent(event, activityId);
                console.log("new activityId is" + activityId);
                callback(false, activityId);
            }

        });
    };



    app.put('/' + global.config.version + '/activity/status/alter', function (req, res) {
        req.body['module'] = 'activity';    // adding module name to request so that it is accessable for cassandra logging
        var assetMessageCounter = 0;
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);
        var activityTypeCategoryId = Number(req.body.activity_type_category_id);
        var proceedActivityStatusAlter = function () {

            var event = {
                name: "alterActivityStatus",
                service: "activityService",
                method: "alterActivityStatus",
                payload: req.body
            };
            queueWrapper.raiseEvent(event, req.body.activity_id);
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
                                proceedActivityStatusAlter();
                            } else {  // this is a duplicate hit,
                                res.send(responseWrapper.getResponse(false, {}, 200));
                            }
                        }
                    });
                } else if (deviceOsId === 5) {
                    proceedActivityStatusAlter();
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
;


module.exports = ActivityController;