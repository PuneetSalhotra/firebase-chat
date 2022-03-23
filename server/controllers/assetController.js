/*
 *author: Sri Sai Venkatesh 
 * 
 */

let AssetService = require("../services/assetService");

function AssetController(objCollection) {

    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    let activityCommonService = objCollection.activityCommonService;
    let util = objCollection.util;
    let assetService = new AssetService(objCollection);
    app.post('/' + global.config.version + '/asset/passcode/alter', function (req, res) {

        assetService.getPhoneNumberAssets(req.body, function (err, data, statusCode) {
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

    app.post('/' + global.config.version + '/asset/passcode/alter/v1', function (req, res) {

        assetService.getPhoneNumberAssetsV1(req.body, function (err, data, statusCode) {
            if (err === false) {
                // Positive response
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // Error
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset/passcode/alter/v2', function (req, res) {

        assetService.getPhoneNumberAssetsV1(req.body, function (err, data, statusCode) {
            if (err === false) {
                // Positive response
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // Error
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset/passcode/check', function (req, res) {

        assetService.checkAssetPasscode(req.body, function (err, data, statusCode) {

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
    app.post('/' + global.config.version + '/asset/inline/collection', function (req, res) {
        assetService.getAssetDetails(req.body, function (err, data, statusCode) {

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
    app.post('/' + global.config.version + '/asset_status/access/global/list', function (req, res) {
        assetService.getAssetWorkStatuses(req.body, function (err, data, statusCode) {

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
    app.post('/' + global.config.version + '/asset/link/set', function (req, res) {

        assetService.linkAsset(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response   

                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/asset/link/reset', function (req, res) {

        assetService.unlinkAsset(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   

                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/asset/cover/lamp/set', function (req, res) {

        req.body.update_type_id = 213;
        req.body.lamp_status = 1;
        assetService.alterLampStatus(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response  
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/asset/cover/lamp/reset', function (req, res) {

        req.body.update_type_id = 214;
        req.body.lamp_status = 0;
        assetService.alterLampStatus(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response   
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/account/cover/payroll/collection', function (req, res) {

        assetService.getPayrollCollection(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response   
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
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
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
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
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/asset/status/collection', function (req, res) {
        assetService.getAssetDetails(req.body, function (err, data, statusCode) {
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
    app.post('/' + global.config.version + '/asset/cover/status/alter', function (req, res) {
        assetService.alterAssetStatus(req.body, function (err, data, statusCode) {
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
    app.post('/' + global.config.version + '/asset/cover/location/alter', function (req, res) {
        assetService.updateAssetCoverLocation(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    /*app.post('/' + global.config.version + '/asset/cover/assigned_status/alter', function (req, res) {
     req.body['module'] = 'asset';
     assetService.alterAssetAssignedStatus(req.body, function (err, data, statusCode) {
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
     
     app.post('/' + global.config.version + '/asset/cover/lamp/alter', function (req, res) {
     req.body['module'] = 'asset';
     assetService.alterAssetLampStatus(req.body, function (err, data, statusCode) {
     if (err === false) {
     // got positive response    
     res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
     
     } else {
     //console.log('did not get proper rseponse');
     data = {};
     res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
     }
     });
     
     });*/

    //PAM
    app.post('/' + global.config.version + '/pam/asset_type/stats/onduty_total', function (req, res) {
        assetService.assetStatsOnDutyTotal(req.body, function (err, data, statusCode) {
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
    //PAM
    app.post('/' + global.config.version + '/asset/status/alter', async (req, res) => {        

        let [err,result] = await assetService.removeAsset(req.body);
        if(!err){
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }    
    });     

    //PAM
    app.post('/' + global.config.version + '/asset/inline/alter', function (req, res) {
        assetService.assetInlineAlter(req.body, function (err, data, statusCode) {
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
    //BETA
    app.post('/' + global.config.version + '/asset/meeting_room/access/workforce/list', function (req, res) {
        assetService.getMeetingRoomAssets(req.body, function (err, data, statusCode) {
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
    //BETA Remote Analytics
    app.post('/' + global.config.version + '/asset/access/counts', function (req, res) {
        assetService.assetRatingAccessCounts(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/asset/cover/notification/set', function (req, res) {

        assetService.updateAssetPushToken(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response  
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    app.post('/' + global.config.version + '/asset/avg_rating/owner/list', function (req, res) {

        assetService.getAverageAssetOwnerRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, {
                    data: data
                }, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset/avg_rating/lead/list', function (req, res) {

        assetService.getAverageAssetLeadRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, {
                    data: data
                }, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset/update/invite/count', function (req, res) {

        assetService.updateInviteCount(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Deleting the phone number of an asset
    app.post('/' + global.config.version + '/asset/access/phonenumber/reset', function (req, res) {
        assetService.phoneNumberDelete(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Retrieving the unread count based on mobile number
    app.post('/' + global.config.version + '/asset/access/phonenumber/unread_count', function (req, res) {
        assetService.unreadCntBasedOnMobileNumber(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Retrieve asset's monthly summary params
    app.post('/' + global.config.version + '/asset/monthly/summary/params', function (req, res) {
        // Flag: 
        // 0 => 22, 32, 40
        assetService.retrieveAssetMonthlySummaryParams(req.body, function (err, data, statusCode) {
            if (err === false) {
                // Positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Retrieve asset's weekly summary params
    app.post('/' + global.config.version + '/asset/weekly/summary/params', function (req, res) {
        // Flag:
        // 0 => 15, 19, 27
        assetService.retrieveAssetWeeklySummaryParams(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Retrieve asset's monthly summary params for Read Time Efficiency (Response Rate Percentage under 24 hours)
    app.post('/' + global.config.version + '/asset/monthly/summary/response_rate', async function (req, res) {
        const [err, responseData] = await assetService.retrieveAssetMonthlySummaryResponseRate(req.body, 32);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/asset/monthly/summary/response_rate | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Retrieve asset's weekly summary params for Read Time Efficiency (Response Rate Percentage under 24 hours)
    app.post('/' + global.config.version + '/asset/weekly/summary/response_rate', async function (req, res) {
        const [err, responseData] = await assetService.retrieveAssetWeeklySummaryResponseRate(req.body, 19);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/asset/weekly/summary/response_rate | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Service to fire everytime the app is launched.
    app.post('/' + global.config.version + '/asset/signal/app_launch', function (req, res) {
        assetService.assetAppLaunchTransactionInsert(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Service to return both weekly and monthly summary params combined.
    app.post('/' + global.config.version + '/asset/weekly_monthly/summary/params', function (req, res) {
        assetService.retrieveAssetWeeklyAndMonthlySummaryParams(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Set default module for asset. Once set, the user is taken to the 
    // set module by default, instead of to the desk.

    app.post('/' + global.config.version + '/asset/module/default/set', function (req, res) {
        assetService.setDefaultModuleForAsset(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Fetch all queues
    // A queue can be at organization, workforce or account level
    app.post('/' + global.config.version + '/asset/queue/list', function (req, res) {
        // 
        // Check if a form transaction with a specific form_id has already 
        // been submitted on a form file
        activityCommonService
            .listAllQueues(req.body)
            .then((data) => {
                res.json(responseWrapper.getResponse(false, data, 200, req.body));
            })
            .catch((err) => {
                let data = {};
                res.json(responseWrapper.getResponse(err, data, -9998, req.body));
            });
    });
    
   app.post('/' + global.config.version + '/pam/asset/passcode/alter/v1', function (req, res) {

        assetService.getPamMemberPhoneNumberAsset(req.body, function (err, data, statusCode) {
            if (err === false) {
                // Positive response
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // Error
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/asset/passcode/check', function (req, res) {

		assetService.checkPamAssetPasscode(req.body, function (err, data, statusCode) {
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

    //Retrieve the asset Timeline Data
    app.post('/' + global.config.version + '/asset/access/timeline/list', async (req, res) => {
        try {            
            //global.logger.write('conLog', req.body, {}, {});
            util.logInfo(req.body,`/asset/access/timeline/list  %j`,{body : req.body});
            let result = await assetService.getAssetTimelineData(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    
    app.post('/' + global.config.version + '/asset/geofence/count', async function (req, res) {
        const [err, data] = await assetService.geAssetGeoFenceCounts(req.body);
        (!err) ?
            res.json(responseWrapper.getResponse({}, data, 200, req.body)):                    
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
    });

    app.post('/' + global.config.version + '/asset/access/queue/list', async (req, res) => {
        try {
            //global.logger.write('conLog', req.body, {}, {});
            util.logInfo(req.body,`/asset/access/queue/list %j`,{body : req.body});
            let result = await assetService.queueAccessListSelectAsset(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/access/levels/list', async function (req, res) {
        const [err, data] = await assetService.assetAccessMappingSelectUserFlag(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/workforce/workforce_type/asset/list', async function (req, res) {
        const [err, data] = await assetService.assetListSelectFlag(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/workforce/activity_type/mapping/list', async function (req, res) {
        const [err, data] = await assetService.workforceActivityTypeMappingSelectFlag(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/process/annexure', async function (req, res) {
        const [err, data] = await assetService.processExcel(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset_reference/asset_type/search', async (req, res) =>{
        try {            
            //global.logger.write('conLog', req.body, {}, {});
            util.logInfo(req.body,`/asset_reference/asset_type/search %j`,{body : req.body});
            let result = await assetService.searchAssetRef(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });
    
    //Work Exposure
    app.post('/' + global.config.version + '/asset/workflow_exposure/matrix', async function (req, res) {
        const [err, data] = await assetService.assetWFExposureMatrix(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/asset/workflow_exposure/matrix | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    //FeedBack for QR / Barcode scanned
    app.post('/' + global.config.version + '/asset/qr_barcode/feedback', async (req, res) => {
        const [err, data] = await assetService.getQrBarcodeFeeback(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/asset/qr_barcode/feedback | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/available/set', async function (req, res) {
        const [err, data] = await assetService.assetAvailableUpdate(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/asset/available/set | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });
 
    //OpenTOK
    app.post('/' + global.config.version + '/room/name', async (req, res) => {
        const [err, openTokData] = await assetService.openTokGetSessionData(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, openTokData, 200, req.body));
        } else {
            console.log("/room/name | Error: ", err);
            res.json(responseWrapper.getResponse(err, openTokData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/email/passcode/generate', async (req, res) => {
        const [err, generatedData] = await assetService.generateEmailPasscode(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, generatedData, 200, req.body));
        } else {
            console.log("/room/name | Error: ", err);
            res.json(responseWrapper.getResponse(err, generatedData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/email/passcode/verify', async (req, res) => {
        const [err, verifiedData] = await assetService.verifyEmailSignup(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, verifiedData, verifiedData.code, req.body));
        } else {
            console.log("/email/passcode/verify | Error: ", err);
            res.json(responseWrapper.getResponse(err, verifiedData, verifiedData.code, req.body));
        }
    });
 
    app.post('/' + global.config.version + '/asset/send_push', async (req, res) => {
        const [err, responseData] = await activityCommonService.sendPushToAsset(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/asset/send_push | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/workforce/send_push', async (req, res) => {
        const [err, responseData] = await activityCommonService.sendPushToWorkforce(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/workforce/send_push | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });    

    app.post('/' + global.config.version + '/asset/swipe', async (req, res) => {
        const [err, responseData] = await assetService.callPushService(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/asset/swipe | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    }); 
    
    app.post('/' + global.config.version + '/asset/swipe/in', async (req, res) => {
        const [err, responseData] = await assetService.assetSwipeIn(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/asset/swipe | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });  

    app.post('/' + global.config.version + '/asset/swipe/out', async (req, res) => {
        const [err, responseData] = await assetService.assetSwipeOut(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/asset/swipe | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });  

    app.post('/' + global.config.version + '/asset/swipe/update', async (req, res) => {
        const [err, responseData] = await assetService.updateAssetSwipeDetails(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/asset/swipe | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });  

    app.post('/' + global.config.version + '/phone_number/verify/invite', async (req, res) => {
        const [err, responseData] = await assetService.getAssetUsingPhoneNumber(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/phone_number/verify/invite | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    }); 

    app.post('/' + global.config.version + '/organization/common/pool', async (req, res) => {
        const [err, responseData] = await assetService.assetListSelectCommonPool(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/organization/common/pool | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });       

    app.post('/' + global.config.version + '/asset/inline/collection/v1', async (req, res) => {
        const [err, responseData] = await assetService.getAssetDetailsExclusions(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/asset/inline/collection/v1 | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });      

    app.post('/' + global.config.version + '/asset/link/set/v1', (req, res) => {
        assetService.linkAsset(req.body, (err, data, statusCode) => {
            if (err === false) {
                // got positive response   
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset/message-counter/list', async (req, res) => {
        const [err, responseData] = await assetService.getAssetMessageCounter(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/asset/message-counter/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    }); 

    app.post('/' + global.config.version + '/asset/access/levels/list/v1', async function (req, res) {
        const [err, data] = await assetService.assetAccessLevelMappingSelectFlag(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    }); 

    app.post('/' + global.config.version + '/asset/timesheet/add', async function (req, res) {
        const [err, data] = await assetService.insertResourceTimesheet(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });   

    app.post('/' + global.config.version + '/asset/timesheet', async function (req, res) {
        const [err, data] = await assetService.getResourceTimesheet(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/mananger/resources/list', async function (req, res) {
        const [err, data] = await assetService.getAssetsReportingToSameManager(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/access/levels/list/v2', async function (req, res) {
        const [err, data] = await assetService.assetAccessLevelMappingSelectFlagV2(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/access/levels/list/v3', async function (req, res) {
        const [err, data] = await assetService.assetReportAccessMapping(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/asset-reference/list', async function (req, res) {
        const [err, data] = await assetService.getActivityAssetReferenceList(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });    
    
    app.post('/' + global.config.version + '/activity/asset-role-reference/list', async function (req, res) {
        const [err, data] = await assetService.getActivityAssetRoleReferenceList(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/asset-slot/add', async function (req, res) {
        const [err, data] = await assetService.insertAssetSlot(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/asset-slot/list', async function (req, res) {
        const [err, data] = await assetService.getAssetSlots(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });
    
    app.post('/' + global.config.version + '/asset/mentions-email/pwd/set', async(req, res) => {
        const [err, data] = await assetService.assetEmailPwdSet(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/asset/mentions-email/pwd/set | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/process-management/flag/set', async(req, res) => {
        const [err, data] = await assetService.updateFlagProcess(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/asset/process-management/flag/set  | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    //Service to logout session 
    app.post('/' + global.config.version + '/asset/session/logout', async (req, res) => {
        const [err, data] = await assetService.assetSessionLogout(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });      

    app.post('/' + global.config.version + '/asset/inline/collection/v2', async (req, res) => {
        const [err, responseData] = await assetService.getAssetDetailsAsync(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/asset/inline/collection/v2 | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/leave/set', async (req, res) => {
        const [err, responseData] = await assetService.assetLeaveMappingInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/asset/leave/set | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/leave/alter', async (req, res) => {
        const [err, responseData] = await assetService.assetLeaveMappingUpdate(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/asset/leave/alter | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });

    
    app.post('/' + global.config.version + '/asset/leave/list', async (req, res) => {        

        let [err,result] = await assetService.getAssetLeaveMappingSelect(req.body);
        if(!err){
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });

    
    app.post('/' + global.config.version + '/asset/leave/reset', async (req, res) => {        

        let [err,result] = await assetService.assetLeaveMappingDelete(req.body);
        if(!err){
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });     
    //--------------------------------------
    //Get the read / unread counts of the broadcast messages of an asset.
    app.post('/' + global.config.version + '/asset/broadcast/counts', async function (req, res) {
        const [err, orgData] = await assetService.getReadUnReadBroadMessageCount(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/asset/broadcast/counts | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });        
    
    app.post('/' + global.config.version + '/asset/org/mgmt/flag/set', async (req, res) => {        

        let [err,result] = await assetService.assetListUpdateFlagOrganizationMgmt(req.body);
        if(!err){
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });      

    app.post('/' + global.config.version + '/asset/email/select', async (req, res) => {        

        let [err,result] = await assetService.assetListByEmail(req.body);
        if(!err){
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    }); 

    app.post('/' + global.config.version + '/asset/cerificates/set', async (req, res) => {        

        let [err,result] = await assetService.assetCertificateSet(req.body);
        if(!err){
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });
    app.post('/' + global.config.version + '/asset/tag/update', async (req, res) => {        

        let [err,result] = await assetService.assetListUpdateTags(req.body);
        if(!err){
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }    
    }); 

    app.post('/' + global.config.version + '/asset/reportee/role/list', async (req, res) => {        

        let [err,result] = await assetService.reporteeListByRoleOfAManager(req.body);
        if(!err){
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }    
    }); 

    app.post('/' + global.config.version + '/asset/desk/archive/list', async (req, res) => {        

        let [err,result] = await assetService.getDeskAssetArchiveList(req.body);
        if(!err){
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }    
    });

    app.post('/' + global.config.version + '/organization/email/resource/list', async (req, res) => {

        let [err, result] = await assetService.getEmailResourceList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/asset_type/list', async function (req, res) {
        const [err, data] = await assetService.getAssetTypeList(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });
    
    app.post('/' + global.config.version + '/asset/timeline/transaction/asset_flag/select', async function (req, res) {
        const [err, data] = await assetService.getAssetTimelineAssetFlag(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/email/password/update', async function (req, res) {
        const [err, data] = await assetService.updateAssetPassword(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/type/category/search', async function (req, res) {
        const [err, data] = await assetService.assetListAssetTypeCategorySearch(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/email/verify/request', async function (req, res) {
        const [err, data] = await assetService.emailVerifyRequest(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/email/verification', async function (req, res) {
        const [err, data] = await assetService.emailPasscodeVerification(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/account/mapped/list', async function (req, res) {
        const [err, data] = await assetService.activityAssetMappingAssetCategorySelect(req.body);
        if (err) {
            return res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/organization/list/insert', async function (req, res) {
        const [err, resData] = await assetService.organization_List_Insert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/organization/list/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/organization/list/update/fees', async function (req, res) {
        const [err, resData] = await assetService.organizationListUpdateFees(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/organization/list/update/fees | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/list/unassigned/desk/search', async function (req, res) {
        const [err, resData] = await assetService.assetListSearchUnassignedDesk(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/asset/list/unassigned/desk/search | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/list/manager/search', async function (req, res) {
        const [err, resData] = await assetService.assetListSearchManger(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/asset/list/manager/search | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
	
    app.post('/' + global.config.version + '/asset/list/selected/manager', async function (req, res) {
        const [err, resData] = await assetService.getAssetListForSelectedManager(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/asset/list/selected/manager | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/mapping/category/targets/select', async function (req, res) {
        const [err, resData] = await assetService.getAssetCategoryTargets(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/asset/mapping/category/targets/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
}
module.exports = AssetController;
