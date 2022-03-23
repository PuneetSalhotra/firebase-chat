
let PamService = require("../services/pamService");

function PamController(objCollection) {

    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    let pamService = new PamService(objCollection);
    let util = objCollection.util;
    let cacheWrapper = objCollection.cacheWrapper;
    let queueWrapper = objCollection.queueWrapper;

    //IVR Service 
    app.post('/' + global.config.version + '/pam/ivr', function (req, res) {
        pamService.ivrService(req.body, function (err, data, statusCode) {
            if (err === false) {
                let text = 'Dear Customer, Please call us back after <> to check if there are any reservation slots available.';
                console.log('DATA : ', data);
                if (data.called_before === 'true' && data.reservation_available === 'false') {
                    util.sendSmsMvaayoo(text, req.country_code, req.phone_number, function (err, res) {});
                } else if (data.called_before === 'false' && data.reservation_available === 'false') {
                    util.sendSmsMvaayoo(text, req.country_code, req.phone_number, function (err, res) {});
                }

                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Send SMS
    app.post('/' + global.config.version + '/pam/send/sms', function (req, res) {
        pamService.sendSms(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/reservations/count', function (req, res) {
        pamService.getReservationsCount(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/asset_mapping/access/add', function (req, res) {
        pamService.assetAccessAdd(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/workforce/access/list', function (req, res) {
        pamService.getWorkforceDifferential(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/user/access/list', function (req, res) {
        pamService.getUserAccessDetails(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));

            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset_mapping/access/account/list', function (req, res) {
        pamService.getAssetAccessAccountLevelDifferential(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/indegredient/menu/inventory_check', function (req, res) {
        pamService.getMenuItemIngredients(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/update/operating_asset/details', function (req, res) {
        pamService.updateOperatingAssetDetails(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/mintime_station/access/set', function (req, res) {
        pamService.stationAssignAlter(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/bulk/status/alter', function (req, res) {
        pamService.bulkStatusAlter(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/reservation_code/check', function (req, res) {
        pamService.checkingReservationCode(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/item_order/workstation/check', function (req, res) {
        pamService.itemOrderWsCheck(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/reservation/set', function (req, res) {
        pamService.reservationSet(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/passcode/reset', function (req, res) {
        pamService.updatePhonePasscode(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/asset/details/alter', function (req, res) {
        pamService.assetListUpdate(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //PAM
    app.post('/' + global.config.version + '/asset/add', function (req, res) {
        pamService.assetAddForPAM(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/inventory/quantity/alter', function (req, res) {
        pamService.updateInvtQty(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/activity/title/alter', function (req, res) {
        pamService.updateTitleDesc(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/asset/cover/alter/clockin', function (req, res) {
        pamService.assetClockIn(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/asset/cover/alter/clockout', function (req, res) {
        pamService.assetClockOut(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/activity/status_cancel/alter', function (req, res) {
        pamService.cancelItem(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/activity/status_preparing/alter', function (req, res) {
        pamService.preparingItem(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });  
    
    app.post('/' + global.config.version + '/pam/cover/inline/alter', function (req, res) {
        pamService.coverInlineAlter(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/get/event/details', function (req, res) {
        pamService.getEventDetails(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/member/passcode/send', function (req, res) {
        pamService.sendMemberPassCode(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/activity/status_pay/alter', function (req, res) {
        pamService.paymentStatusAlter(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/activity/participant/access/set', function (req, res) {
        //global.logger.write('debug', 'PAM::/pam/activity/participant/access/set::'+req.body, {}, req); 
        let assetMessageCounter = 0;
        let deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        let proceedParticipantAccessSet = function () {
            let event = {
                name: "pamAssignParticipnt",
                service: "pamService",
                method: "pamAssignParticipant",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.json(responseWrapper.getResponse(true, {}, -5998,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5 || Number(req.device_os_id) !== 6) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            //global.logger.write('serverError', "error in setting in asset parity", err, req.body);
                                            util.logError(req.body,`setAssetParity serverError error in setting in asset parity Error %j`, { err,body : req.body });
                                        } else
                                            //console.log("asset parity is set successfully")
                                            //global.logger.write('conLog', "asset parity is set successfully", {}, req.body);
                                            util.logInfo(req.body,`setAssetParity Asset parity is set successfully %j`,{body : req.body});

                                    });
                                }
                            }
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                            return;
                        }
                });
            //res.json(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5 && deviceOsId !== 6) {

                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.json(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantAccessSet();

                        } else {  // this is a duplicate hit,
                            res.json(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5 || deviceOsId === 6) {
                proceedParticipantAccessSet();
            } else {
                res.json(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.json(responseWrapper.getResponse(false, {}, -3301,req.body));
        }
    });
        
    app.post('/' + global.config.version + '/pam/asset/timeline/entry/add', function (req, res) {
     		console.log(req.body);
    		pamService.insertAssetTimeline(req.body, function (err, data, statusCode) {
                if (err === false) {    
                    res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                } else {                
                    data = {};
                    res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                }
            });
        
    });
    
    app.post('/' + global.config.version + '/pam/asset/desc/alter', function (req, res) {
        pamService.assetListUpdateDesc(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/asset/activate/alter', function (req, res) {
    	pamService.deactivateAsset(req.body).then((data)=>{    		
    		res.json(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        	});
    		
        });

    app.post('/' + global.config.version + '/pam/activity/timeline/entry/add', function (req, res) {
     		console.log(req.body);
    		pamService.insertActivityTimeline(req.body, function (err, data, statusCode) {
                if (err === false) {    
                    res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                } else {                
                    data = {};
                    res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                }
            });
        
    });
    
    app.post('/' + global.config.version + '/pam/activity/participant/access/set/nonqueue', function (req, res) {
    	//global.logger.write('debug', ':::::::::::::::::::SERVICE START:::::::::::::::::::::', {}, req);
    	//global.logger.write('debug', '/pam/activity/participant/access/set/nonqueue', {}, req);
    	//global.logger.write('debug', req.body, {}, req);    	
    	req.body.is_non_queue = 1;
        pamService.pamAssignParticipant((req.body), function(err,data){
    		   	//console.log("NonQueue: Participant Assign Completed");
    		//   	global.logger.write('debug', 'NON QUEUE: PARTICIPANT ASSIGN COMPLETED', {}, req);
    		  // 	global.logger.write('debug', ':::::::::::::::::::SERVICE END:::::::::::::::::::::', {}, req);
    	});
        res.json(responseWrapper.getResponse({},{}, 200, req.body)); 
    });
    
    app.post('/' + global.config.version + '/pam/event/report', function (req, res) {
    	pamService.eventReport(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    });
    
    app.post('/' + global.config.version + '/pam/reservation/bill', function (req, res) {
    	pamService.processReservationBilling(req.body, req.body.activity_id).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    });
    
    app.post('/' + global.config.version + '/pam/event/reservation/list', function (req, res) {
    	pamService.getEventReservations(req.body,0).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    });
        
    app.post('/' + global.config.version + '/pam/send/order/sms', async (req, res) => {
    	let [err,result] = await pamService.pamSendOrderSms(req.body);
        if(!err){
    		res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
    		res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/phone_number/activity/list', async (req, res) => {
        let [err,result] = await pamService.pamOrdersWithPhoneNumber(req.body)
        console.log(err);
        if(!err){
    		res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
    		res.json(responseWrapper.getResponse(err, {}, result, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/reservation/phone/number', async (req, res) => {
        let [err,result] = await pamService.addPamReservationViaPhoneNumber(req.body)
        if(!err){
    		res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
    		res.json(responseWrapper.getResponse(err, {}, result, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/get/activity/category/status', async (req, res) => {
        let [err,result] = await pamService.getActivityStatusV1(req.body)
        if(!err){
    		res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
    		res.json(responseWrapper.getResponse(err, {}, result, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/get/activity/category/type', async (req, res) => {
        let [err,result] = await pamService.getActivityType(req.body)
        if(!err){
    		res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
    		res.json(responseWrapper.getResponse(err, {}, result, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/get/whatsapp/access/token', async (req, res) => {
        let [err,result] = await pamService.whatsappAccessToken(req.body)
        if(!err){
    		res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
    		res.json(responseWrapper.getResponse(err, {}, result, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/send/whatsapp/message', async (req, res) => {
        let [err,result] = await pamService.sendWhatsAppTemplateMessage(req.body)
        if(!err){
    		res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
    		res.json(responseWrapper.getResponse(err, {}, result, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/get/coupancode', async (req, res) => {
        let [err,result] = await pamService.getCoupanDetails(req.body)
        if(!err){
    		res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
    		res.json(responseWrapper.getResponse(err, {}, result, req.body));
        }
    });    

    app.post('/' + global.config.version + '/pam/update/inlinedata', async (req, res) => {
        let [err,result] = await pamService.updateActivityInlineData(req.body)
        if(!err){
    		res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
    		res.json(responseWrapper.getResponse(err, {}, result, req.body));
        }
    });     

    app.post('/' + global.config.version + '/pam/reservation_code/check/v1', async (req, res) => {
        let [err,result] = await pamService.checkingReservationCodeV1(req.body)
            if(!err){
                res.json(responseWrapper.getResponse({}, result, 200, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, result, -9999, req.body));
            }
    });

    app.post('/' + global.config.version + '/pam/get/orders/reservation_code', async (req, res) => {
        let [err, result] = await pamService.getOrdersUsingReservationCode(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, result, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/get/upcoming/events', async (req, res) => {
        let [err, result] = await pamService.getUpcomingEvents(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, result, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/send/reservation/sms', async (req, res) => {
        let [err, result] = await pamService.sendReservationSMS(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, result, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/trending/orders', async (req, res) => {
        let [err, result] = await pamService.getTrendingOrders(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, result, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/send/test/sms', async (req, res) => {
        let [err, result] = await pamService.sendTestSMS(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, result, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/event/member/reservation', async (req, res) => {
        let [err, result] = await pamService.getMemberReservationDetails(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, result, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/pam/get/reservation/serial', async (req, res) => {
        let [err,result] = await pamService.getReservationSerialNumber(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/email/event/summary', async (req, res) => {
        let [err,result] = await pamService.emailEventSummary(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/workforce/asset_type/mapping/add', async function (req, res) {      
        let [err,result] = await pamService.addPamWorkforceAssetTypeMapping(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/workforce/asset_type/mapping/add | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/workforce/asset_type/mapping/delete', async function (req, res) { 
        
        let [err,result] = await pamService.removePamWorkforceAssetTypeMapping(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/workforce/asset_type/mapping/delete | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/workforce/asset_type/mapping/update', async function (req, res) { 
        
        let [err,result] = await pamService.updatePamWorkforceAssetTypeMapping(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/workforce/asset_type/mapping/update | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/get/module/master/', async function (req, res) { 
        
        let [err,result] = await pamService.getPamModuleMaster(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/get/module/master | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/module/role/mapping/add', async function (req, res) { 
        
        let [err,result] = await pamService.addRoleModulMapping(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/module/role/mapping/add | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/get/module/role/mapping', async function (req, res) { 
        let [err,result] = await pamService.getPamRoleModuleMapping(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/get/module/role/mapping | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/module/role/mapping/delete', async function (req, res) { 
        let [err,result] = await pamService.removePamRoleModuleMapping(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/module/role/mapping/delete | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/get/order/report/summary', async function (req, res) { 
        let [err,result] = await pamService.getPamOrderReportSummary(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/get/order/report/summary | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/get/Analytic/report', async function (req, res) { 
        let [err,result] = await pamService.PamAnalyticsReporteChecks(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/get/Analytic/report | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/discount/promocode/add', async function (req, res) { 
        let [err,result] = await pamService.discountPromotionCodeAdd(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/discount/promocode/add | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/get/inventory/current/quantity', async function (req, res) {
        const [err, data] = await pamService.getInventoryCurrentQuantity(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/pam/get/inventory/current/quantity Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
    app.post('/' + global.config.version + '/pam/update/minimum/count/assetlist', async function (req, res) {
        const [err, data] = await pamService.updateMinimumCountAssetlist(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/pam/update/minimum/count/assetlist Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
    app.post('/' + global.config.version + '/pam/get/minimum/count/assetlist', async function (req, res) {
        const [err, data] = await pamService.getMinimumCountAssetlist(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/pam/get/minimum/count/assetlist Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
    app.post('/' + global.config.version + '/pam/get/product/wise/sale', async function (req, res) {
        const [err, data] = await pamService.productWiseSale(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/pam/get/product/wise/sale Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	  
    app.post('/' + global.config.version + '/pam/menu/recommend/set', async function (req, res) { 
        
        let [err,result] = await pamService.setChefRecommendedMenu(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/menu/recommend/set | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/asset/update/user/profile', async function (req, res) {

        let [err, result] = await pamService.pamEditProfileWithPhoneNumber(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/asset/update/user/profile | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/get/asset/user/profile', async function (req, res) {

        let [err, result] = await pamService.pamGetProfileWithPhoneNumber(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/get/asset/user/profile | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/add/menu/rating/comment', async function (req, res) {

        let [err, result] = await pamService.assetAddRatingAndCommentToMenu(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/add/menu/rating/comment | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/get/menu/select/detailes', async function (req, res) {

        let [err, result] = await pamService.pamOrderListGetSelectDetailes(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            console.log("/pam/get/menu/select/detailes | Error: ", err);
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });  
    app.post('/' + global.config.version + '/pam/vendor/notify', async function (req, res) {
        let [err, result] = await pamService.notifyVendor(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(true, result, -9999, req.body));
        }
    });  
    app.post('/' + global.config.version + '/pam/asset/add', async (req, res) => {
        let [err, result] = await pamService.addPamAsset(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, result, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/asset/phone/verification', async (req, res) => {
        let [err, result] = await pamService.verifyPhoneNumber(req.body)
        if (!err) {
            res.json(responseWrapper.getResponse({}, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, result, req.body));
        }
    });  
};

module.exports = PamController;
