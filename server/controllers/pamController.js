/*
 *author: Nani Kalyan V
 * 
 */

var PamService = require("../services/pamService");

function PamController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var pamService = new PamService(objCollection);
    var util = objCollection.util;
    var cacheWrapper = objCollection.cacheWrapper;
    var queueWrapper = objCollection.queueWrapper;

    //IVR Service
    app.post('/' + global.config.version + '/pam/ivr', function (req, res) {
        pamService.ivrService(req.body, function (err, data, statusCode) {
            if (err === false) {
                var text = 'Dear Customer, Please call us back after <> to check if there are any reservation slots available.';
                console.log('DATA : ', data);
                if (data.called_before === 'true' && data.reservation_available === 'false') {
                    util.sendSmsMvaayoo(text, req.country_code, req.phone_number, function (err, res) {});
                } else if (data.called_before === 'false' && data.reservation_available === 'false') {
                    util.sendSmsMvaayoo(text, req.country_code, req.phone_number, function (err, res) {});
                }

                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Send SMS
    app.post('/' + global.config.version + '/pam/send/sms', function (req, res) {
        pamService.sendSms(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/reservations/count', function (req, res) {
        pamService.getReservationsCount(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/asset_mapping/access/add', function (req, res) {
        pamService.assetAccessAdd(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/workforce/access/list', function (req, res) {
        pamService.getWorkforceDifferential(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/user/access/list', function (req, res) {
        pamService.getUserAccessDetails(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));

            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset_mapping/access/account/list', function (req, res) {
        pamService.getAssetAccessAccountLevelDifferential(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/indegredient/menu/inventory_check', function (req, res) {
        pamService.getMenuItemIngredients(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.put('/' + global.config.version + '/update/operating_asset/details', function (req, res) {
        pamService.updateOperatingAssetDetails(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.put('/' + global.config.version + '/activity/mintime_station/access/set', function (req, res) {
        pamService.stationAssignAlter(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.put('/' + global.config.version + '/pam/bulk/status/alter', function (req, res) {
        pamService.bulkStatusAlter(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/reservation_code/check', function (req, res) {
        pamService.checkingReservationCode(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/item_order/workstation/check', function (req, res) {
        pamService.itemOrderWsCheck(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/reservation/set', function (req, res) {
        pamService.reservationSet(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/pam/passcode/reset', function (req, res) {
        pamService.updatePhonePasscode(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/pam/asset/details/alter', function (req, res) {
        pamService.assetListUpdate(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //PAM
    app.post('/' + global.config.version + '/asset/add', function (req, res) {
        pamService.assetAddForPAM(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/pam/inventory/quantity/alter', function (req, res) {
        pamService.updateInvtQty(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/pam/activity/title/alter', function (req, res) {
        pamService.updateTitleDesc(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/pam/asset/cover/alter/clockin', function (req, res) {
        pamService.assetClockIn(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/pam/asset/cover/alter/clockout', function (req, res) {
        pamService.assetClockOut(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/pam/activity/status_cancel/alter', function (req, res) {
        pamService.cancelItem(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/pam/activity/status_preparing/alter', function (req, res) {
        pamService.preparingItem(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });  
    
    app.put('/' + global.config.version + '/pam/cover/inline/alter', function (req, res) {
        pamService.coverInlineAlter(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/get/event/details', function (req, res) {
        pamService.getEventDetails(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/member/passcode/send', function (req, res) {
        pamService.sendMemberPassCode(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/pam/activity/status_pay/alter', function (req, res) {
        pamService.paymentStatusAlter(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/activity/participant/access/set', function (req, res) {
        global.logger.write('debug', 'PAM::/pam/activity/participant/access/set::'+req.body, {}, req); 
        var assetMessageCounter = 0;
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedParticipantAccessSet = function () {
            var event = {
                name: "pamAssignParticipnt",
                service: "pamService",
                method: "pamAssignParticipant",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.send(responseWrapper.getResponse(true, {}, -5998,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5 || Number(req.device_os_id) !== 6) {
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
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                            return;
                        }
                });
            //res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5 && deviceOsId !== 6) {

                cacheWrapper.checkAssetParity(req.body.asset_id, Number(assetMessageCounter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed
                            proceedParticipantAccessSet();

                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5 || deviceOsId === 6) {
                proceedParticipantAccessSet();
            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
        }
    });
        
    app.post('/' + global.config.version + '/pam/asset/timeline/entry/add', function (req, res) {
     		console.log(req.body);
    		pamService.insertAssetTimeline(req.body, function (err, data, statusCode) {
                if (err === false) {    
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                } else {                
                    data = {};
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                }
            });
        
    });
    
    app.put('/' + global.config.version + '/pam/asset/desc/alter', function (req, res) {
        pamService.assetListUpdateDesc(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/asset/activate/alter', function (req, res) {
    	pamService.deactivateAsset(req.body).then((data)=>{    		
    		res.send(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.send(responseWrapper.getResponse(err, {}, -999, req.body));
        	});
    		
        });

    app.post('/' + global.config.version + '/pam/activity/timeline/entry/add', function (req, res) {
     		console.log(req.body);
    		pamService.insertActivityTimeline(req.body, function (err, data, statusCode) {
                if (err === false) {    
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                } else {                
                    data = {};
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                }
            });
        
    });
    
    app.post('/' + global.config.version + '/pam/activity/participant/access/set/nonqueue', function (req, res) {
    	global.logger.write('debug', ':::::::::::::::::::SERVICE START:::::::::::::::::::::', {}, req);
    	global.logger.write('debug', '/pam/activity/participant/access/set/nonqueue', {}, req);
    	global.logger.write('debug', req.body, {}, req);    	
    	
        pamService.pamAssignParticipant((req.body), function(err,data){
    		   	//console.log("NonQueue: Participant Assign Completed");
    		   	global.logger.write('debug', 'NON QUEUE: PARTICIPANT ASSIGN COMPLETED', {}, req);
    		   	global.logger.write('debug', ':::::::::::::::::::SERVICE END:::::::::::::::::::::', {}, req);
    	});
        res.send(responseWrapper.getResponse({},{}, 200, req.body)); 
    });
}
;
module.exports = PamController;
