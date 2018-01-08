/*
 *author: Nani Kalyan V
 * 
 */

var PamService = require("../services/pamService");

function PamController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var pamService = new PamService(objCollection);

    //IVR Service
    app.post('/' + global.config.version + '/pam/ivr', function (req, res) {
        pamService.ivrService(req.body, function (err, data, statusCode) {
            if (err === false) {
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

}
;
module.exports = PamController;
