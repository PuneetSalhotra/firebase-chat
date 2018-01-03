/*
 *author: Nani Kalyan V
 * 
 */

var PamService = require("../services/pamService");

function PamController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var pamService = new PamService(objCollection);

    app.post('/' + global.config.version + '/pam/identify/caller', function (req, res) {
        pamService.identifyCaller(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    /*app.post('/' + global.config.version + '/pam/calllog', function (req, res) {
        pamService.getNonMembersCallLog(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });*/
    
    app.post('/' + global.config.version + '/pam/identify/caller_time', function (req, res) {
        pamService.getCalledTime(req.body, function (err, data, statusCode) {
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
    
    /*app.post('/' + global.config.version + '/pam/generate/reservationcode', function (req, res) {
        pamService.generatePasscode(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });*/

}
;
module.exports = PamController;
