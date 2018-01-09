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
    app.put('/' + global.config.version + '/pam/asset/cover/alter/clockin', function (req, res) {
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
    });
    
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
    app.post('/' + global.config.version + '/asset/access/account/list', function (req, res) {
        assetService.assetAccountListDiff(req.body, function (err, data, statusCode) {
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
    
    
    //PAM
    app.post('/' + global.config.version + '/asset/add', function (req, res) {
        assetService.assetAddForPAM(req.body, function (err, data, statusCode) {
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
}
module.exports = AssetController;
