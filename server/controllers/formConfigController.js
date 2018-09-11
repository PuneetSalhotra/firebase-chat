/*
 *author: Sri Sai Venkatesh 
 * 
 */

var FormConfigService = require("../services/formConfigService");
const moment = require('moment');

function FormConfigController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;

    var formConfigService = new FormConfigService(objCollection);

    app.post('/' + global.config.version + '/form/access/organisation/list', function (req, res) {

        formConfigService.getOrganizationalLevelForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper rseponse');
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
                console.log('did not get proper rseponse');
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
                console.log('did not get proper rseponse');
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
                console.log('did not get proper rseponse');
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
                console.log('did not get proper rseponse');
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
};

module.exports = FormConfigController;
