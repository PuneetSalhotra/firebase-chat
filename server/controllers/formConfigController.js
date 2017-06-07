/*
 *author: Sri Sai Venkatesh 
 * 
 */

var FormConfigService = require("../services/formConfigService");

function FormConfigController(objCollection) {
    
    var responseWrapper = objCollection.responseWrapper;    
    var app = objCollection.app;

    var formConfigService = new FormConfigService(objCollection.db, objCollection.util);

    app.post('/' + global.config.version + '/form/access/organisation/list', function (req, res) {
        req.body['module'] = 'form';
        
        formConfigService.getOrganizationalLevelForms (req.body, function (err, data, statusCode) {
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
        req.body['module'] = 'form';
        
        formConfigService.getAccountLevelForms (req.body, function (err, data, statusCode) {
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
        req.body['module'] = 'form';
        
        formConfigService.getWorkforceLevelForms (req.body, function (err, data, statusCode) {
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
        req.body['module'] = 'form';
        
        formConfigService.getActivityLevelForms (req.body, function (err, data, statusCode) {
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
    
};


module.exports = FormConfigController;