/*
 *author: Sri Sai Venkatesh 
 * 
 */

var FormConfigService = require("../services/formConfigService");
const moment = require('moment');

function FormConfigController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var util = objCollection.util;
    var queueWrapper = objCollection.queueWrapper;

    var formConfigService = new FormConfigService(objCollection);

    app.post('/' + global.config.version + '/form/access/organisation/list', function (req, res) {

        formConfigService.getOrganizationalLevelForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('debug', 'did not get proper response', {}, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/form/access/account/list', function (req, res) {

        formConfigService.getAccountLevelForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('debug', 'did not get proper response', {}, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/form/access/workforce/list', function (req, res) {

        formConfigService.getWorkforceLevelForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('debug', 'did not get proper response', {}, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/form/access/activity/list', function (req, res) {

        formConfigService.getActivityLevelForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('debug', 'did not get proper response', {}, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/form/access/global/entry/collection', function (req, res) {

        formConfigService.getSpecifiedForm(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('debug', 'did not get proper response', {}, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Added By Nani Kalyan for BETA
    app.post('/' + global.config.version + '/form/register/access/workforce/list', function (req, res) {
        formConfigService.getRegisterForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/form/access/workforce/timeline/list', function (req, res) {
        formConfigService.getAllFormSubmissions(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });


    //Added By Nani Kalyan for BETA
    /*app.post('/' + global.config.version + '/form/register/access/workforce/list', function (req, res) {
        formConfigService.getRegisterForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });*/

    // Endpoint to fetch specific Timecard Forms (all, 325, 800 or 801)
    app.post('/' + global.config.version + '/form/access/asset/timecard/list', function (req, res) {
        // Sanity check
        if (req.body.datetime_start === undefined || req.body.datetime_end === undefined || req.body.flag === undefined) {
            let data = 'One or more of the request parameters is missing.';
            res.send(responseWrapper.getResponse(true, data, -3308, req.body));
            return;
        } else if (!moment(req.body.datetime_start, 'YYYY-MM-DD HH:mm:ss').isValid() || !moment(req.body.datetime_end, 'YYYY-MM-DD HH:mm:ss').isValid()) {
            let data = 'Invalid datetime format.';
            res.send(responseWrapper.getResponse(true, data, -3308, req.body));
            return;
        }

        // Fetch the Timecard Forms
        formConfigService.getManualMobileAndWebTimecardForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    
    //Get the list of forms submitted by the user
    //Search the list of forms submitted by the user
    app.post('/' + global.config.version + '/form/access/user/list', function (req, res) {
        formConfigService.getSearchUserForms(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    
    app.put('/' + global.config.version + '/form/activity/alter', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedInlineUpdate = function () {
            var event = {
                name: "alterFormActivity",
                service: "formConfigService",
                method: "alterFormActivity",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                            res.send(responseWrapper.getResponse(false, {}, -5999,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            global.logger.write('serverError', "error in setting in asset parity", err, req.body);
                                        } else
                                            //console.log("asset parity is set successfully")
                                            global.logger.write('debug', "asset parity is set successfully", {}, req.body);

                                    });
                                }
                            }
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                });
            //res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        try {
            JSON.parse(req.body.activity_inline_data);
            // console.log('json is fine');
            global.logger.write('debug', "json is fine", {}, req.body);

        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {}, -3308,req.body));
            return;
        }
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998,req.body));
                    } else {
                        if (status) {     // proceed
                            proceedInlineUpdate();
                        } else {  // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedInlineUpdate();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
        }

    });
    
    app.post('/' + global.config.version + '/form/field/combo/list', function (req, res) {

    	formConfigService.getFormFieldComboValues(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    });
    
};

module.exports = FormConfigController;
