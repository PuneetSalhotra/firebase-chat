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
    
    app.post('/' + global.config.version + '/form/access/global/entry/collection', function (req, res) {
        
        
        formConfigService.getSpecifiedForm (req.body, function (err, data, statusCode) {
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
    
      //Added By Nani Kalyan
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

    
};


module.exports = FormConfigController;