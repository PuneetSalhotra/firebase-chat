/*
 *author: Sri Sai Venkatesh 
 * 
 */

var AssetService = require("../services/assetService");

function AssetController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var activityCommonService = objCollection.activityCommonService;
    var assetService = new AssetService(objCollection);
    app.put('/' + global.config.version + '/asset/passcode/alter', function (req, res) {

        assetService.getPhoneNumberAssets(req.body, function (err, data, statusCode) {
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

    app.put('/' + global.config.version + '/asset/passcode/alter/v1', function (req, res) {

        assetService.getPhoneNumberAssetsV1(req.body, function (err, data, statusCode) {
            if (err === false) {
                // Positive response
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // Error
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset/passcode/check', function (req, res) {

        assetService.checkAssetPasscode(req.body, function (err, data, statusCode) {

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
    app.post('/' + global.config.version + '/asset/inline/collection', function (req, res) {
        assetService.getAssetDetails(req.body, function (err, data, statusCode) {

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
    app.post('/' + global.config.version + '/asset_status/access/global/list', function (req, res) {
        assetService.getAssetWorkStatuses(req.body, function (err, data, statusCode) {

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
    app.put('/' + global.config.version + '/asset/link/set', function (req, res) {

        assetService.linkAsset(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response   

                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.put('/' + global.config.version + '/asset/link/reset', function (req, res) {

        assetService.unlinkAsset(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   

                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.put('/' + global.config.version + '/asset/cover/lamp/set', function (req, res) {

        req.body.update_type_id = 213;
        req.body.lamp_status = 1;
        assetService.alterLampStatus(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response  
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.put('/' + global.config.version + '/asset/cover/lamp/reset', function (req, res) {

        req.body.update_type_id = 214;
        req.body.lamp_status = 0;
        assetService.alterLampStatus(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/account/cover/payroll/collection', function (req, res) {

        assetService.getPayrollCollection(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/asset/cover/collection', function (req, res) {
        req.body.access_level_id = 5;
        //req.body.page_start = (req.body.hasOwnProperty('page_start'))? req.body.page_start : 0;
        req.body.page_start = req.body.page_start || 0;
        req.body.page_limit = req.body.page_limit || 50;
        assetService.getAssetCoverCollection(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/asset/access/workforce/cover/collection', function (req, res) {
        req.body.access_level_id = 3;
        //req.body.page_start = (req.body.hasOwnProperty('page_start'))? req.body.page_start : 0;
        req.body.page_start = req.body.page_start || 0;
        req.body.page_limit = req.body.page_limit || 50;
        assetService.getAssetCoverCollection(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/asset/status/collection', function (req, res) {
        assetService.getAssetDetails(req.body, function (err, data, statusCode) {
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
    app.put('/' + global.config.version + '/asset/cover/status/alter', function (req, res) {
        assetService.alterAssetStatus(req.body, function (err, data, statusCode) {
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
    app.put('/' + global.config.version + '/asset/cover/location/alter', function (req, res) {
        assetService.updateAssetCoverLocation(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    /*app.put('/' + global.config.version + '/asset/cover/assigned_status/alter', function (req, res) {
     req.body['module'] = 'asset';
     assetService.alterAssetAssignedStatus(req.body, function (err, data, statusCode) {
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
     
     app.put('/' + global.config.version + '/asset/cover/lamp/alter', function (req, res) {
     req.body['module'] = 'asset';
     assetService.alterAssetLampStatus(req.body, function (err, data, statusCode) {
     if (err === false) {
     // got positive response    
     res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
     
     } else {
     //console.log('did not get proper rseponse');
     data = {};
     res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
     }
     });
     
     });*/

    //PAM 
    /*app.put('/' + global.config.version + '/pam/asset/cover/alter/clockin', function (req, res) {
     assetService.assetClockIn(req.body, function (err, data, statusCode) {
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
     
     //PAM /asset/cover/alter/clockout
     app.put('/' + global.config.version + '/pam/asset/cover/alter/clockout', function (req, res) {
     assetService.assetClockOut(req.body, function (err, data, statusCode) {
     if (err === false) {
     // got positive response    
     res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
     
     } else {
     //console.log('did not get proper rseponse');
     data = {};
     res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
     }
     });
     });*/

    //PAM
    app.post('/' + global.config.version + '/pam/asset_type/stats/onduty_total', function (req, res) {
        assetService.assetStatsOnDutyTotal(req.body, function (err, data, statusCode) {
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
    //PAM
    app.put('/' + global.config.version + '/asset/status/alter', function (req, res) {
        assetService.removeAsset(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    })

    //PAM
    app.put('/' + global.config.version + '/asset/inline/alter', function (req, res) {
        assetService.assetInlineAlter(req.body, function (err, data, statusCode) {
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
    //BETA
    app.post('/' + global.config.version + '/asset/meeting_room/access/workforce/list', function (req, res) {
        assetService.getMeetingRoomAssets(req.body, function (err, data, statusCode) {
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
    //BETA Remote Analytics
    app.post('/' + global.config.version + '/asset/access/counts', function (req, res) {
        assetService.assetRatingAccessCounts(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.put('/' + global.config.version + '/asset/cover/notification/set', function (req, res) {

        assetService.updateAssetPushToken(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response  
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/asset/avg_rating/owner/list', function (req, res) {

        assetService.getAverageAssetOwnerRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, {
                    data: data
                }, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset/avg_rating/lead/list', function (req, res) {

        assetService.getAverageAssetLeadRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, {
                    data: data
                }, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.put('/' + global.config.version + '/asset/update/invite/count', function (req, res) {

        assetService.updateInviteCount(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Deleting the phone number of an asset
    app.put('/' + global.config.version + '/asset/access/phonenumber/reset', function (req, res) {
        assetService.phoneNumberDelete(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Retrieving the unread count based on mobile number
    app.post('/' + global.config.version + '/asset/access/phonenumber/unread_count', function (req, res) {
        assetService.unreadCntBasedOnMobileNumber(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Retrieve asset's monthly summary params
    app.post('/' + global.config.version + '/asset/monthly/summary/params', function (req, res) {
        assetService.retrieveAssetMonthlySummaryParams(req.body, function (err, data, statusCode) {
            if (err === false) {
                // Positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Retrieve asset's weekly summary params
    app.post('/' + global.config.version + '/asset/weekly/summary/params', function (req, res) {
        assetService.retrieveAssetWeeklySummaryParams(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Service to fire everytime the app is launched.
    app.post('/' + global.config.version + '/asset/signal/app_launch', function (req, res) {
        assetService.assetAppLaunchTransactionInsert(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

}
module.exports = AssetController;
