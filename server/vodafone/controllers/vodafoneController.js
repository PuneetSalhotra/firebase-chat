/*
 *author: Nani Kalyan V
 * 
 */

var VodafoneService = require("../services/vodafoneService");

function VodafoneController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    const util = objCollection.util;
    const cacheWrapper = objCollection.cacheWrapper;
    const queueWrapper = objCollection.queueWrapper;
    var vodafoneService = new VodafoneService(objCollection);
    const activityCommonService = objCollection.activityCommonService;
  
    
    //BOT 2
    app.post('/' + global.config.version + '/vodafone/neworder_form/queue/add', function (req, res) {
        req.body.message_unique_id = util.getMessageUniqueId(req.body.asset_id);
        var event = {
            name: "vodafone",
            service: "vodafoneService",
            method: "newOrderFormAddToQueues",
            payload: req.body
        };

        queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
            if (err) {
                global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req);
                res.send(responseWrapper.getResponse(err, {}, -5999, req));
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                res.send(responseWrapper.getResponse(err, {}, 200, req));
            }                            
        });
      
    });
    
    //BOT 2
    app.post('/' + global.config.version + '/vodafone/customer_form/add', function (req, res) {
        req.body.message_unique_id = util.getMessageUniqueId(req.body.asset_id);
        var event = {
            name: "vodafone",
            service: "vodafoneService",
            method: "newOrderFormSubmission",
            payload: req.body
        };

        queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
            if (err) {
                global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req);
                res.send(responseWrapper.getResponse(err, {}, -5999, req));
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                res.send(responseWrapper.getResponse(err, {}, 200, req));
            }                            
        });
      
    });
    
    
    /*app.post('/' + global.config.version + '/vodafone/fr/pull', function (req, res) {
    	vodafoneService.fetchVodafoneFRPull(req.body,0).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    });*/
    
    //BOT 2
    app.post('/' + global.config.version + '/vodafone/caf_form/add', function (req, res) {
        req.body.message_unique_id = util.getMessageUniqueId(req.body.asset_id);
        var event = {
            name: "vodafone",
            service: "vodafoneService",
            method: "newOrderFormSubmission",
            payload: req.body
        };

        queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
            if (err) {
                global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req);
                res.send(responseWrapper.getResponse(err, {}, -5999, req));
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                res.send(responseWrapper.getResponse(err, {}, 200, req));
            }            
        });
        
    });
        
    //BOT 
    /*app.post('/' + global.config.version + '/vodafone/feasibility_checker/update', function (req, res) {
        req.body.message_unique_id = util.getMessageUniqueId(req.body.asset_id);
        var event = {
            name: "vodafone",
            service: "vodafoneService",
            method: "addFeasibilityChecker",
            payload: req.body
        };

        queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
            if (err) {
                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req.body);
                res.send(responseWrapper.getResponse(err, {}, -5999, req));
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                res.send(responseWrapper.getResponse(false, {}, 200, req.body));
            }                            
        });        
    });*/ 
    
    //BOT 4
    app.post('/' + global.config.version + '/vodafone/send/email', function (req, res) {        
        /*vodafoneService.sendEmailVodafone(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });*/
        
        req.body.message_unique_id = util.getMessageUniqueId(req.body.asset_id);
        var event = {
            name: "vodafone",
            service: "vodafoneService",
            method: "sendEmailVodafone",
            payload: req.body
        };

        queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
            if (err) {
                global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req.body);
                res.send(responseWrapper.getResponse(err, {}, -5999, req));
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                res.send(responseWrapper.getResponse(false, {}, 200, req.body));
            }                            
        });
    });
        
    
    //BOT 3
    app.post('/' + global.config.version + '/activity/timeline/entry/add/external', function (req, res) {        
        
        console.log('Calling it from Vodafone Controller');
        
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
                name: "vodafone",
                service: "vodafoneService",
                method: "addTimelineTransactionExternal",
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
                                            global.logger.write('conLog', "error in setting in asset parity", err, req.body);
                                        } else
                                            //console.log("asset parity is set successfully")
                                            global.logger.write('conLog', "asset parity is set successfully", {}, req.body);

                                    });
                                }
                            }
                            if (formTransactionId > 0)
                                res.send(responseWrapper.getResponse(false, {form_transaction_id: formTransactionId}, 200,req.body));
                            else
                                res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                            return;
                        }
                });            
        };        
        
        if (req.body.hasOwnProperty('activity_stream_type_id') && req.body.activity_stream_type_id > 0) {            
            if (util.hasValidActivityId(req.body)) {
                if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                    cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                        if (err) {
                            res.send(responseWrapper.getResponse(false, {}, -7998,req.body));
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
                                res.send(responseWrapper.getResponse(false, {}, 200,req.body));
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
                    res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
                }
            } else {
                res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3305,req.body));
        }

    });

    // BOT 5
    app.post('/' + global.config.version + '/vodafone/process/timeline/entry/add', async function (req, res) {
        const [error, status] = await vodafoneService.buildAndSubmitCafFormV1(req.body);
        if (error) {
            return res.send(responseWrapper.getResponse(error, {
                error
            }, -5999999, req.body));
        } else {
            return res.send(responseWrapper.getResponse(error, {
                status
            }, 200, req.body));
        }

        // buildAndSubmitCafForm
        // vodafoneService.regenerateAndSubmitCAF(req.body, (err, data) => {
        //     if (err) {
        //         return res.send(responseWrapper.getResponse(err, {
        //             err
        //         }, -5999999, req.body));
        //     } else {
        //         return res.send(responseWrapper.getResponse(err, {
        //             data
        //         }, 200, req.body));
        //     }
        // });
    });

    // // BOT Test
    // app.post('/' + global.config.version + '/vodafone/bot/test_2', function (req, res) {

    //     const CAF_FORM_ID = global.vodafoneConfig[req.body.organization_id].FORM_ID.CAF;

    //     // activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
    //     activityCommonService.getActivityTimelineTransactionByFormId(req.body, req.body.activity_id, CAF_FORM_ID)
    //         .then((data) => {
    //             //console.log(data);
    //             res.send(responseWrapper.getResponse({}, data, 200, req.body));
    //         }).catch((err) => {
    //             data = {};
    //             res.send(responseWrapper.getResponse(err, data, -999, req.body));
    //         });
    // });
    // BOT Test
    app.post('/' + global.config.version + '/vodafone/bot/test_3', async function (req, res) {
        const [error, status] = await vodafoneService.regenerateAndSubmitTargetForm(req.body);
        if (error) {
            return res.send(responseWrapper.getResponse(error, {
                error
            }, -5999999, req.body));
        } else {
            return res.send(responseWrapper.getResponse(error, {
                status
            }, 200, req.body));
        }
    });

    // BOT 6
    app.post('/' + global.config.version + '/vodafone/status/set/approval_pending', function (req, res) {

        var event = {
            name: "vodafoneService",
            service: "vodafoneService",
            method: "setStatusApprovalPendingAndFireEmail",
            payload: req.body
        };

        queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
            if (err) {
                global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req);
                return res.send(responseWrapper.getResponse(err, {
                    err
                }, -5999999, req.body));

            } else {
                return res.send(responseWrapper.getResponse(err, {
                    activity_id: req.body.activity_id,
                    message_unique_id: req.body.message_unique_id
                }, 200, req.body));
            }
        });

    });

    // Mock APIs
    app.post('/' + global.config.version + '/vodafone/crm_portal/push', function (req, res) {
        vodafoneService.fetchCRMPortalPush(req.body, 0).then((data) => {
            //console.log(data);
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });
    });
    
    app.post('/' + global.config.version + '/vodafone/fr/pull', function (req, res) {
    	vodafoneService.fetchVodafoneFRPull(req.body,0).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    });
    
    app.post('/' + global.config.version + '/vodafone/crm_portal/pull', function (req, res) {
    	vodafoneService.fetchCRMPortalPull(req.body,0).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    }); 
    
};

module.exports = VodafoneController;
