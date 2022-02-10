/*
 *author: Sri Sai Venkatesh 
 * 
 */

var ActivityTimelineService = require("../services/activityTimelineService");
const logger = require("../logger/winstonLogger");
const { serializeError } = require('serialize-error');

function ActivityTimelineController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var cacheWrapper = objCollection.cacheWrapper;
    var queueWrapper = objCollection.queueWrapper;
    var app = objCollection.app;
    var util = objCollection.util;

    var activityTimelineService = new ActivityTimelineService(objCollection);
    
    app.post('/' + global.config.version + '/activity/timeline/entry/add',async function (req, res) {
        util.logInfo(req.body,`::START:: activity_id-${req.body.activity_id || ""}`);
        util.logInfo(req.body,`Request Params %j`,JSON.stringify(req.body,null, 4));
        
        var assetMessageCounter = 0;
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);
        var streamTypeId = Number(req.body.activity_stream_type_id);

        if(req.body.hasOwnProperty('activity_timeline_collection')) {
            try {
                JSON.parse(req.body.activity_timeline_collection);
            } catch (exception) {                
                res.json(responseWrapper.getResponse(false, {}, -3308, req.body));
                return;
            }
        }

        var proceedActivityTimelineAdd = function (formTransactionId) {

            var event = {
                name: "addTimelineTransaction",
                service: "activityTimelineService",
                //method: "addTimelineTransaction",
                method: "addTimelineTransactionAsync",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
                if (err) {
                    //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                    //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);                            
                    res.json(responseWrapper.getResponse(true, {}, -5999, req.body));
                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                } else {
                    if (req.hasOwnProperty('device_os_id')) {
                        if (Number(req.device_os_id) !== 5) {
                            //incr the asset_message_counter                        
                            cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                if (err) {
                                    //console.log("error in setting in asset parity");
                                    util.logError(req.body,`error in setting in asset parity`, { type: 'activity_timeline', error: serializeError(err) });
                                } else
                                    //console.log("asset parity is set successfully")
                                    util.logInfo(req.body,`asset parity is set successfully`);
                            });
                        }
                    }
                    if (formTransactionId > 0)
                        res.json(responseWrapper.getResponse(false, {
                            form_transaction_id: formTransactionId
                        }, 200, req.body));
                    else
                        res.json(responseWrapper.getResponse(false, {}, 200, req.body));
                    return;
                }
            });
            /*if (formTransactionId > 0)
                res.json(responseWrapper.getResponse(false, {form_transaction_id: formTransactionId}, 200,req.body));
            else
                res.json(responseWrapper.getResponse(false, {}, 200,req.body));
            return;*/
        };
        if (req.body.hasOwnProperty('activity_stream_type_id') && req.body.activity_stream_type_id > 0) {
            if (util.hasValidActivityId(req.body)) {
                if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                    cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                        if (err) {
                            res.json(responseWrapper.getResponse(false, {}, -7998, req.body));
                        } else {
                            if (status) { // proceed
                                if (streamTypeId === 705) { // submit form case   
                                    proceedActivityTimelineAdd(Number(req.body.form_transaction_id));
                                    cacheWrapper.setMessageUniqueIdLookup(req.body.message_unique_id, req.body.form_transaction_id, function (err, status) {
                                        if (err) {
                                            util.logError(req.body,`error in setting in message unique id look up`, { type: 'activity_timeline', error: serializeError(err) });
                                        } else {
                                            util.logInfo(req.body,` message unique id look up is set successfully`);
                                        }
                                    });

                                } else {
                                    req.body.flag_timeline_entry = 1;
                                    proceedActivityTimelineAdd(0); //passing formTransactionId as 0
                                }
                                cacheWrapper.setAssetParity(req.body.asset_id, req.body.asset_message_counter, function (err, status) {
                                    if (err) {
                                        console.log("");
                                        util.logError(req.body,`error in setting in asset parity`, { type: 'activity_timeline', error: serializeError(err) });
                                    } else {
                                        util.logInfo(req.body,`asset parity is set successfully`);
                                    }

                                });
                            } else { // this is a duplicate hit,
                                console.log('this is a duplicate hit');
                                util.logInfo(req.body,`this is a duplicate hit`);
                                res.json(responseWrapper.getResponse(false, {}, 200, req.body));
                            }
                        }
                    });

                } else if (deviceOsId === 5) {

                    //proceedActivityTimelineAdd(0);//passing formTransactionId as o
                    if (streamTypeId === 705) {
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
                         res.json(responseWrapper.getResponse(false, {form_transaction_id: 0}, -7998));
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
                        proceedActivityTimelineAdd(0); //passing formTransactionId as 0

                    }
                } else {
                    res.json(responseWrapper.getResponse(false, {}, -3304, req.body));
                }
            } else {
                res.json(responseWrapper.getResponse(false, {}, -3301, req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3305, req.body));
        }

    });


    app.post('/' + global.config.version + '/activity/timeline/entry/add/v2',async function (req, res) {
        util.logInfo(req.body,`::START:: activity_id-${req.body.activity_id || ""}`);
        util.logInfo(req.body,`Request Params %j`,JSON.stringify(req.body,null, 4));
        
        var assetMessageCounter = 0;
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);
        var streamTypeId = Number(req.body.activity_stream_type_id);

        if(req.body.hasOwnProperty('activity_timeline_collection')) {
            try {
                JSON.parse(req.body.activity_timeline_collection);
            } catch (exception) {                
                res.json(responseWrapper.getResponse(false, {}, -3308, req.body));
                return;
            }
        }

        var proceedActivityTimelineAdd = function (formTransactionId) {

            let firstRequest = Object.assign({}, req.body);
            firstRequest.log_asset_id = req.body.asset_id;
            let firstRequest2 = Object.assign({}, req.body);
            firstRequest2.log_asset_id = req.body.access_asset_id;
            firstRequest2.asset_id = req.body.access_asset_id;
            proceedActivityTimelineAddV1(formTransactionId, firstRequest);
            proceedActivityTimelineAddV1(formTransactionId, firstRequest2);
        };

        var proceedActivityTimelineAddV1 = function (formTransactionId, mainRequest) {

            var event = {
                name: "addTimelineTransaction",
                service: "activityTimelineService",
                //method: "addTimelineTransaction",
                method: "addTimelineTransactionAsync",
                payload: mainRequest
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
                if (err) {
                    //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                    //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);                            
                    res.json(responseWrapper.getResponse(true, {}, -5999, req.body));
                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                } else {
                    if (req.hasOwnProperty('device_os_id')) {
                        if (Number(req.device_os_id) !== 5) {
                            //incr the asset_message_counter                        
                            cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                if (err) {
                                    //console.log("error in setting in asset parity");
                                    util.logError(req.body,`error in setting in asset parity`, { type: 'activity_timeline', error: serializeError(err) });
                                } else
                                    //console.log("asset parity is set successfully")
                                    util.logInfo(req.body,`asset parity is set successfully`);
                            });
                        }
                    }
                    if (formTransactionId > 0)
                        res.json(responseWrapper.getResponse(false, {
                            form_transaction_id: formTransactionId
                        }, 200, req.body));
                    else
                        res.json(responseWrapper.getResponse(false, {}, 200, req.body));
                    return;
                }
            });
            /*if (formTransactionId > 0)
                res.json(responseWrapper.getResponse(false, {form_transaction_id: formTransactionId}, 200,req.body));
            else
                res.json(responseWrapper.getResponse(false, {}, 200,req.body));
            return;*/
        };
        if (req.body.hasOwnProperty('activity_stream_type_id') && req.body.activity_stream_type_id > 0) {
            if (util.hasValidActivityId(req.body)) {
                if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                    cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                        if (err) {
                            res.json(responseWrapper.getResponse(false, {}, -7998, req.body));
                        } else {
                            if (status) { // proceed
                                if (streamTypeId === 705) { // submit form case   
                                    proceedActivityTimelineAdd(Number(req.body.form_transaction_id));
                                    cacheWrapper.setMessageUniqueIdLookup(req.body.message_unique_id, req.body.form_transaction_id, function (err, status) {
                                        if (err) {
                                            util.logError(req.body,`error in setting in message unique id look up`, { type: 'activity_timeline', error: serializeError(err) });
                                        } else {
                                            util.logInfo(req.body,` message unique id look up is set successfully`);
                                        }
                                    });

                                } else {
                                    req.body.flag_timeline_entry = 1;
                                    proceedActivityTimelineAdd(0); //passing formTransactionId as 0
                                }
                                cacheWrapper.setAssetParity(req.body.asset_id, req.body.asset_message_counter, function (err, status) {
                                    if (err) {
                                        console.log("");
                                        util.logError(req.body,`error in setting in asset parity`, { type: 'activity_timeline', error: serializeError(err) });
                                    } else {
                                        util.logInfo(req.body,`asset parity is set successfully`);
                                    }

                                });
                            } else { // this is a duplicate hit,
                                console.log('this is a duplicate hit');
                                util.logInfo(req.body,`this is a duplicate hit`);
                                res.json(responseWrapper.getResponse(false, {}, 200, req.body));
                            }
                        }
                    });

                } else if (deviceOsId === 5) {

                    //proceedActivityTimelineAdd(0);//passing formTransactionId as o
                    if (streamTypeId === 705) {
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
                         res.json(responseWrapper.getResponse(false, {form_transaction_id: 0}, -7998));
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
                        proceedActivityTimelineAdd(0); //passing formTransactionId as 0

                    }
                } else {
                    res.json(responseWrapper.getResponse(false, {}, -3304, req.body));
                }
            } else {
                res.json(responseWrapper.getResponse(false, {}, -3301, req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3305, req.body));
        }

    });


    //This is to support the feature - Not to increase unread count during timeline entry
    app.post('/' + global.config.version + '/activity/timeline/entry/add/v1', function (req, res) {
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
                method: "addTimelineTransactionV1",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
                if (err) {
                    //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                    //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);                            
                    res.json(responseWrapper.getResponse(true, {}, -5999, req.body));
                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                } else {
                    if (req.hasOwnProperty('device_os_id')) {
                        if (Number(req.device_os_id) !== 5) {
                            //incr the asset_message_counter                        
                            cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                if (err) {
                                    //console.log("error in setting in asset parity");
                                    //global.logger.write('serverError', "error in setting in asset parity", err, req.body);
                                    util.logError(req,`serverError error in setting in asset parity Error %j`, { err,body : req.body });
                                } else
                                    //console.log("asset parity is set successfully")
                                    //global.logger.write('conLog', "asset parity is set successfully", {}, req.body);
                                    util.logInfo(req,`conLog Asset parity is set successfully %j`,{body : req.body});

                            });
                        }
                    }
                    if (formTransactionId > 0)
                        res.json(responseWrapper.getResponse(false, {
                            form_transaction_id: formTransactionId
                        }, 200, req.body));
                    else
                        res.json(responseWrapper.getResponse(false, {}, 200, req.body));
                    return;
                }
            });
        };
        if (req.body.hasOwnProperty('activity_stream_type_id') && req.body.activity_stream_type_id > 0) {
            if (util.hasValidActivityId(req.body)) {
                if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                    cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                        if (err) {
                            res.json(responseWrapper.getResponse(false, {}, -7998, req.body));
                        } else {
                            if (status) { // proceed
                                if (streamTypeId === 705) { // submit form case   
                                    proceedActivityTimelineAdd(Number(req.body.form_transaction_id));
                                    cacheWrapper.setMessageUniqueIdLookup(req.body.message_unique_id, req.body.form_transaction_id, function (err, status) {
                                        if (err) {
                                            console.log("error in setting in message unique id look up");
                                        } else
                                            console.log("message unique id look up is set successfully");
                                    });

                                } else {
                                    req.body.flag_timeline_entry = 1;
                                    proceedActivityTimelineAdd(0); //passing formTransactionId as 0
                                }
                                cacheWrapper.setAssetParity(req.body.asset_id, req.body.asset_message_counter, function (err, status) {
                                    if (err) {
                                        console.log("error in setting in asset parity");
                                    } else
                                        console.log("asset parity is set successfully")

                                });
                            } else { // this is a duplicate hit,
                                console.log('this is a duplicate hit');
                                res.json(responseWrapper.getResponse(false, {}, 200, req.body));
                            }
                        }
                    });

                } else if (deviceOsId === 5) {

                    //proceedActivityTimelineAdd(0);//passing formTransactionId as o
                    if (streamTypeId === 705) {
                        proceedActivityTimelineAdd(Number(req.body.form_transaction_id));
                    } else {
                        req.body.flag_timeline_entry = 1;
                        proceedActivityTimelineAdd(0); //passing formTransactionId as 0

                    }
                } else {
                    res.json(responseWrapper.getResponse(false, {}, -3304, req.body));
                }
            } else {
                res.json(responseWrapper.getResponse(false, {}, -3301, req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3305, req.body));
        }

    });


    //This is for Vodafone Demo
    /*app.post('/' + global.config.version + '/activity/timeline/entry/add/vodafone', function (req, res) {
        
        req.body.organization_id = 856;
        req.body.account_id = 971;
        req.body.workforce_id = 5344;
        req.body.activity_stream_type_id = 325;
        
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
                method: "addTimelineTransactionVodafone",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);                            
                            res.json(responseWrapper.getResponse(true, {}, -5999,req.body));
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
                            if (formTransactionId > 0)
                                res.json(responseWrapper.getResponse(false, {form_transaction_id: formTransactionId}, 200,req.body));
                            else
                                res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                            return;
                        }
                });            
        };        
        
        if (req.body.hasOwnProperty('activity_stream_type_id') && req.body.activity_stream_type_id > 0) {            
            if (util.hasValidActivityId(req.body)) {
                if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                    cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                        if (err) {
                            res.json(responseWrapper.getResponse(false, {}, -7998,req.body));
                        } else {
                            if (status) {     // proceed
                                if (streamTypeId === 705) { // submit form case   
                                    proceedActivityTimelineAdd(Number(req.body.form_transaction_id));
                                    cacheWrapper.setMessageUniqueIdLookup(req.body.message_unique_id, req.body.form_transaction_id, function (err, status) {
                                        if (err) {
                                            console.log("error in setting in message unique id look up");
                                        } else
                                            console.log("message unique id look up is set successfully");
                                    });

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
                                res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                            }
                        }
                    });

                } else if (deviceOsId === 5) {

                    //proceedActivityTimelineAdd(0);//passing formTransactionId as o
                    if (streamTypeId === 705) {
                        proceedActivityTimelineAdd(Number(req.body.form_transaction_id));
                    } else {
                        req.body.flag_timeline_entry = 1;
                        proceedActivityTimelineAdd(0);//passing formTransactionId as 0

                    }
                } else {
                    res.json(responseWrapper.getResponse(false, {}, -3304,req.body));
                }
            } else {
                res.json(responseWrapper.getResponse(false, {}, -3301,req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3305,req.body));
        }

    });*/


    app.post('/' + global.config.version + '/activity/timeline/entry/comment/add', function (req, res) {
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
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
                if (err) {
                    //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                    //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                    res.json(responseWrapper.getResponse(true, {}, -5998, req.body));
                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                } else {
                    if (req.hasOwnProperty('device_os_id')) {
                        if (Number(req.device_os_id) !== 5) {
                            //incr the asset_message_counter                        
                            cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                if (err) {
                                    //console.log("error in setting in asset parity");
                                    //global.logger.write('serverError', "error in setting in asset parity", err, req.body);
                                    util.logError(req,`serverError error in setting in asset parity Error %j`, { err,body : req.body });
                                } else
                                    //console.log("asset parity is set successfully")
                                    //global.logger.write('conLog', "asset parity is set successfully", {}, req.body);
                                    util.logInfo(req,`conLog Asset parity is set successfully %j`,{body : req.body});

                            });
                        }
                    }
                    res.json(responseWrapper.getResponse(false, {}, 200, req.body));
                    return;
                }
            });
            //res.json(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                    if (err) {
                        res.json(responseWrapper.getResponse(false, {}, -7998, req.body));
                    } else {
                        if (status) { // proceed

                            proceedActivityTimelineCommentAdd(); //passing formTransactionId as o

                            cacheWrapper.setAssetParity(req.body.asset_id, req.body.asset_message_counter, function (err, status) {
                                if (err) {
                                    console.log("error in setting in asset parity");
                                } else
                                    console.log("asset parity is set successfully");
                            });
                        } else { // this is a duplicate hit,
                            res.json(responseWrapper.getResponse(false, {}, 200, req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedActivityTimelineCommentAdd(); //passing formTransactionId as o
            } else {
                res.json(responseWrapper.getResponse(false, {}, -3304, req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3301, req.body));
        }
    });


    app.post('/' + global.config.version + '/activity/timeline/list', function (req, res) {
        activityTimelineService.retrieveTimelineList(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper response');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // With a feature to sort
    app.post('/' + global.config.version + '/activity/timeline/list/v1', function (req, res) {
        activityTimelineService.retrieveTimelineListV1(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper response');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/timeline/entry/collection', function (req, res) {
        activityTimelineService.retrieveFormCollection(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper rseponse');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/timeline/entry/comment/list', function (req, res) {
        activityTimelineService.retrieveFormFieldTimeline(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper rseponse');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //PAM
    app.post('/' + global.config.version + '/asset/timeline/list', function (req, res) {
        activityTimelineService.retrieveTimelineListBasedOnAsset(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper response');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Retrieve all attachments from the timeline entries, with a provision to search
    app.post('/' + global.config.version + '/activity/timeline/attachments/list', async (req, res) => {
        const [err, orgData] = await activityTimelineService.retrieveSearchTimelineAttachments(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/activity/timeline/attachments/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/activity/timeline/mentions/send_email', async function (req, res) {
        const [err, orgData] = await activityTimelineService.mentionsSendEmail(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/activity/timeline/mentions/send_email | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/activity/timeline/status/list', async (req, res) => {
        const [err, orgData] = await activityTimelineService.activityTimelineTxnSelectActivityStatus(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/activity/timeline/status/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/timeline/form-submissions/list', async (req, res) => {
        const [err, orgData] = await activityTimelineService.getNooftimeFormSubmitted(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/activity/timeline/form-submissions/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/activity/timeline/mentions/send_email/v1', async (req, res) => {
        // req.body.is_version_v1 = 1;
        const [err, orgData] = await activityTimelineService.mentionsSendEmail(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/activity/timeline/mentions/send_email | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/timeline-transaction/form/list', async (req, res) => {
        
        const [err, data] = await activityTimelineService.timelineTxnFormList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/activity/timeline-transaction/form/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

}

module.exports = ActivityTimelineController;
