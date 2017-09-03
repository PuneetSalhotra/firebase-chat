/*
 *author: Sri Sai Venkatesh 
 * 
 */

var ActivityTimelineService = require("../services/activityTimelineService");

function ActivityTimelineController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var cacheWrapper = objCollection.cacheWrapper;
    var queueWrapper = objCollection.queueWrapper;
    var app = objCollection.app;
    var util = objCollection.util;
    
    var activityTimelineService = new ActivityTimelineService(objCollection);

    app.post('/' + global.config.version + '/activity/timeline/entry/add', function (req, res) {
        req.body['module'] = 'activity';    // adding module name to req.body so that it is accessable for cassandra logging

        var assetMessageCounter = 0;
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);
        var streamTypeId = Number(req.body.activity_stream_type_id);

        var proceedActivityTimelineAdd = function (formTransactionId) {

            var event = {
                name: "addTimelineTransaction",
                service: "activityTimelineService",
                method: "addTimelineTransaction",
                payload: req.body
            };
            queueWrapper.raiseEvent(event, req.body.activity_id);
            if (formTransactionId > 0)
                res.send(responseWrapper.getResponse(false, {form_transaction_id: formTransactionId}, 200));
            else
                res.send(responseWrapper.getResponse(false, {}, 200));
            return;
        };
        if (req.body.hasOwnProperty('activity_stream_type_id') && req.body.activity_stream_type_id > 0) {
            if (util.hasValidActivityId(req.body)) {
                if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                    cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                        if (err) {
                            res.send(responseWrapper.getResponse(false, {}, -7998));
                        } else {
                            if (status) {     // proceed
                                if (streamTypeId === 705) { // submit form case   
                                    /*
                                     if (req.body.hasOwnProperty('form_transaction_id') && Number(req.body.form_transaction_id) > 0) {
                                     req.body.flag_timeline_entry = 0;
                                     proceedActivityTimelineAdd(Number(req.body.form_transaction_id));
                                     cacheWrapper.setMessageUniqueIdLookup(req.body.message_unique_id, req.body.form_transaction_id, function (err, status) {
                                     if (err) {
                                     console.log("error in setting in message unique id look up");
                                     } else
                                     console.log("message unique id look up is set successfully");
                                     });
                                     } else {
                                     req.body.flag_timeline_entry = 1;
                                     cacheWrapper.getFormTransactionId(function (err, formTransactionId) {
                                     if (err) {
                                     console.log(err);
                                     res.send(responseWrapper.getResponse(false, {form_transaction_id: 0}, -7998));
                                     return;
                                     } else {
                                     req.body['form_transaction_id'] = formTransactionId;
                                     proceedActivityTimelineAdd(formTransactionId);
                                     cacheWrapper.setMessageUniqueIdLookup(req.body.message_unique_id, formTransactionId, function (err, status) {
                                     if (err) {
                                     console.log("error in setting in message unique id look up");
                                     } else
                                     console.log("message unique id look up is set successfully");
                                     });
                                     }
                                     });
                                     }
                                     */
                                    proceedActivityTimelineAdd(Number(req.body.form_transaction_id));

                                } else {
                                    req.body.flag_timeline_entry = 1;
                                    proceedActivityTimelineAdd(0);//passing formTransactionId as 0
                                }
                                cacheWrapper.setAssetParity(req.body.asset_id, req.body.asset_message_counter, function (err, status) {
                                    if (err) {
                                        console.log("error in setting in asset parity");
                                    } else
                                        console.log("asset parity is set successfully")

                                });
                            } else {  // this is a duplicate hit,
                                console.log('this is a duplicate hit');
                                res.send(responseWrapper.getResponse(false, {}, 200));
                            }
                        }
                    });

                } else if (deviceOsId === 5) {
                    
                    //proceedActivityTimelineAdd(0);//passing formTransactionId as o
                    if (streamTypeId === 705 ) {
                        /*
                        if (req.body.hasOwnProperty('form_transaction_id') && Number(req.body.form_transaction_id) > 0) {
                            req.body.flag_timeline_entry = 0;
                            proceedActivityTimelineAdd(Number(req.body.form_transaction_id));
                            cacheWrapper.setMessageUniqueIdLookup(req.body.message_unique_id, req.body.form_transaction_id, function (err, status) {
                                if (err) {
                                    console.log("error in setting in message unique id look up");
                                } else
                                    console.log("message unique id look up is set successfully");
                            });
                        } else {
                            cacheWrapper.getFormTransactionId(function (err, formTransactionId) {
                                if (err) {
                                    console.log(err);
                                    res.send(responseWrapper.getResponse(false, {form_transaction_id: 0}, -7998));
                                    return;
                                } else {
                                    req.body['form_transaction_id'] = formTransactionId;
                                    proceedActivityTimelineAdd(formTransactionId);
                                    cacheWrapper.setMessageUniqueIdLookup(req.body.message_unique_id, formTransactionId, function (err, status) {
                                        if (err) {
                                            console.log("error in setting in message unique id look up");
                                        } else
                                            console.log("message unique id look up is set successfully");
                                    });
                                }
                            });
                        }
                        */
                       
                        proceedActivityTimelineAdd(Number(req.body.form_transaction_id));
                    } else {
                        req.body.flag_timeline_entry = 1;
                        proceedActivityTimelineAdd(0);//passing formTransactionId as 0

                    }
                } else {
                    res.send(responseWrapper.getResponse(false, {}, -3304));
                }
            } else {
                res.send(responseWrapper.getResponse(false, {}, -3301));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3305));
        }

    });

    app.post('/' + global.config.version + '/activity/timeline/entry/comment/add', function (req, res) {
        req.body['module'] = 'activity';    // adding module name to req.body so that it is accessable for cassandra logging

        var assetMessageCounter = 0;
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);
        var streamTypeId = Number(req.body.activity_stream_type_id);

        var proceedActivityTimelineCommentAdd = function () {

            var event = {
                name: "addTimelineTransaction",
                service: "activityTimelineService",
                method: "addTimelineComment",
                payload: req.body
            };
            queueWrapper.raiseEvent(event, req.body.activity_id);
            res.send(responseWrapper.getResponse(false, {}, 200));
            return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998));
                    } else {
                        if (status) {     // proceed

                            proceedActivityTimelineCommentAdd();//passing formTransactionId as o

                            cacheWrapper.setAssetParity(req.body.asset_id, req.body.asset_message_counter, function (err, status) {
                                if (err) {
                                    console.log("error in setting in asset parity");
                                } else
                                    console.log("asset parity is set successfully");
                            });
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedActivityTimelineCommentAdd();//passing formTransactionId as o
            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301));
        }
    });


    app.post('/' + global.config.version + '/activity/timeline/list', function (req, res) {
        req.body['module'] = 'activity';
        activityTimelineService.retrieveTimelineList(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/timeline/entry/collection', function (req, res) {
        req.body['module'] = 'activity';
        activityTimelineService.retrieveFormCollection(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/timeline/entry/comment/list', function (req, res) {
        req.body['module'] = 'activity';
        activityTimelineService.retrieveFormFieldTimeline(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });




}
;


module.exports = ActivityTimelineController;