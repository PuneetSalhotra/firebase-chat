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
    
    
    app.post('/' + global.config.version + '/nani/kalyan/set', function (req, res) {
        cacheWrapper.setKafkaMessageUniqueId('deskeractivities_0_77', 'read', function(err, resp){
            if(err === false) {
                console.log('Created ' + resp);            
            } else {
                console.log('Not created : ' + err);
            }
        })
    });
    
    app.post('/' + global.config.version + '/nani/kalyan/get', function (req, res) {
        cacheWrapper.getKafkaMessageUniqueId('deskeractivities_0_78',function(err, resp){
            if(err === false) {
                console.log('Retrieved value ' + resp);
            } else {
                console.log('Not created : ' + err);
            }
        });
    });
}
;
module.exports = PamController;
