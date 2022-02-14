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

    const moment = require('moment');
    const multer = require('multer');
    const upload = multer({
        storage: multer.diskStorage({
            destination: 'bulk_order_excel_uploads',
            filename: function (req, file, cb) {
                cb(null, req.body.workflow_activity_id + '-' + moment().utcOffset('+05:30').format('YYYY-MM-DD_HH-mm-ss') + '.xlsx')
            }
        })
    });
  
    
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
                //global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req);
                util.logError(req,`conLog Error in queueWrapper raiseActivityEvent: %j`, { error : JSON.stringify(err), err, req });
                res.json(responseWrapper.getResponse(err, {}, -5999, req));
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                res.json(responseWrapper.getResponse(err, {}, 200, req));
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
                //global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req);
                util.logError(req,`conLog Error in queueWrapper raiseActivityEvent: Error %j`, {error : JSON.stringify(err), err, req });
                res.json(responseWrapper.getResponse(err, {}, -5999, req));
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                res.json(responseWrapper.getResponse(err, {}, 200, req));
            }                            
        });
      
    });
    
    
    /*app.post('/' + global.config.version + '/vodafone/fr/pull', function (req, res) {
    	vodafoneService.fetchVodafoneFRPull(req.body,0).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
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
                //global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req);
                util.logError(req,`conLog Error in queueWrapper raiseActivityEvent: Error %j`, {error : JSON.stringify(err), err, req });
                res.json(responseWrapper.getResponse(err, {}, -5999, req));
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                res.json(responseWrapper.getResponse(err, {}, 200, req));
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
                res.json(responseWrapper.getResponse(err, {}, -5999, req));
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                res.json(responseWrapper.getResponse(false, {}, 200, req.body));
            }                            
        });        
    });*/ 
    
    //BOT 4
    app.post('/' + global.config.version + '/vodafone/send/email', function (req, res) {        
        /*vodafoneService.sendEmailVodafone(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
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
                //global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req.body);
                util.logError(req,`conLog Error in queueWrapper raiseActivityEvent: Error %j`, {error : JSON.stringify(err), err, body : req.body });
                res.json(responseWrapper.getResponse(err, {}, -5999, req));
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                res.json(responseWrapper.getResponse(false, {}, 200, req.body));
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
                            res.json(responseWrapper.getResponse(true, {}, -5999,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            //global.logger.write('conLog', "error in setting in asset parity", err, req.body);
                                            util.logError(req,`conLog error in setting in asset parity Error %j`, { err, body : req.body });
                                        } else
                                            //console.log("asset parity is set successfully")
                                            //global.logger.write('conLog', "asset parity is set successfully", {}, req.body);
                                            util.logInfo(req,`conLog asset parity is set successfully %j`,{ body : req.body});

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

    });

    // BOT 5
    app.post('/' + global.config.version + '/vodafone/process/timeline/entry/add', async function (req, res) {
        const [error, status] = await vodafoneService.buildAndSubmitCafFormV1(req.body);
        if (error) {
            return res.json(responseWrapper.getResponse(error, {
                error
            }, -5999999, req.body));
        } else {
            return res.json(responseWrapper.getResponse(error, {
                status
            }, 200, req.body));
        }

        // buildAndSubmitCafForm
        // vodafoneService.regenerateAndSubmitCAF(req.body, (err, data) => {
        //     if (err) {
        //         return res.json(responseWrapper.getResponse(err, {
        //             err
        //         }, -5999999, req.body));
        //     } else {
        //         return res.json(responseWrapper.getResponse(err, {
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
    //             res.json(responseWrapper.getResponse({}, data, 200, req.body));
    //         }).catch((err) => {
    //             data = {};
    //             res.json(responseWrapper.getResponse(err, data, -999, req.body));
    //         });
    // });
    // BOT Test
    app.post('/' + global.config.version + '/vodafone/bot/test_3', async function (req, res) {
        const [error, status] = await vodafoneService.regenerateAndSubmitTargetForm(req.body);
        if (error) {
            return res.json(responseWrapper.getResponse(error, {
                error
            }, -5999999, req.body));
        } else {
            return res.json(responseWrapper.getResponse(error, {
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
                //global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req);
                util.logError(req,`conLog Error in queueWrapper raiseActivityEvent: Error %j`, {error : JSON.stringify(err), err, req });
                return res.json(responseWrapper.getResponse(err, {
                    err
                }, -5999999, req.body));

            } else {
                return res.json(responseWrapper.getResponse(err, {
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
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });
    });
    
    app.post('/' + global.config.version + '/vodafone/fr/pull', function (req, res) {
    	vodafoneService.fetchVodafoneFRPull(req.body,0).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    });
    
    app.post('/' + global.config.version + '/vodafone/crm_portal/pull', function (req, res) {
    	vodafoneService.fetchCRMPortalPull(req.body,0).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    }); 

    app.post('/' + global.config.version + '/vodafone/manual_trigger/child_workflows_create', async function (req, res) {
        const [err, orgData] = await vodafoneService.vodafoneCreateChildOrdersFromBulkOrder(
            req.body,
            req.body.workflow_activity_id,
            req.s3_bucket_url
        );
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/vodafone/manual_trigger/child_workflows_create | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });
    

    app.post('/' + global.config.version + '/vodafone/manual_trigger/excel_upload/child_workflows_create', upload.single('bulk_order_file'), async function (req, res) {
        const [err, orgData] = await vodafoneService.vodafoneCreateChildOrdersFromExcelUpload(
            req.body,
            req.body.workflow_activity_id,
            req.file
        );
        console.log("req.file: ", req.file);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/vodafone/manual_trigger/excel_upload/child_workflows_create | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    //Search service for workflow reference with activity type restriction
    app.post('/' + global.config.version + '/workflow_reference/activity_type/search', async (req, res) =>{       
        try {            
            //global.logger.write('conLog', req.body, {}, {});
            util.logInfo(req,`conLog %j`,{body : req.body});
            let result = await vodafoneService.searchWFBasedOnActivityType(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    
    //Search service for attachment reference with attachment type restriction
    app.post('/' + global.config.version + '/document_reference/attachment_type/search', async (req, res) =>{        
        try {            
            //global.logger.write('conLog', req.body, {}, {});
            util.logInfo(req,`conLog %j`,{body : req.body});
            let result = await vodafoneService.searchDocBasedOnAttachmentType(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });


    //Search service for workflow reference with activity type restriction
    app.post('/' + global.config.version + '/workflow_reference/activity_type/search/v1', async (req, res) =>{        
        const [err, responseData] = await vodafoneService.searchWFBasedOnActivityTypeV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/workflow_reference/activity_type/search/v1 | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

        //Search service for workflow reference with activity type restriction - Elastic Search
        app.post('/' + global.config.version + '/workflow_reference/activity_type/search/v2', async (req, res) =>{        
            const [err, responseData] = await vodafoneService.searchWFBasedOnActivityTypeV2(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
            } else {
                console.log("/workflow_reference/activity_type/search/v2 | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        });

    //repopulate ElasticSearch Data service activity_search_mapping, activity_asset_search_mapping - Elastic Search
    app.post('/' + global.config.version + '/workflow_reference/activity_search/mapping/update', async (req, res) => {
        const [err, responseData] = await vodafoneService.activitySearchMappingUpdateInES(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/workflow_reference/activity_search/mapping/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

}

module.exports = VodafoneController;
