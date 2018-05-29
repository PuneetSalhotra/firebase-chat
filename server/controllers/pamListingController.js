/*
 *author: Nani Kalyan V
 * 
 */

var PamListingService = require("../services/pamListingService");

function PamListingController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var pamListingService = new PamListingService(objCollection);
           
    app.post('/' + global.config.version + '/pam/orders/access/list', function (req, res) {
        pamListingService.getOrdersUnderAReservation(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/asset/access/account/list', function (req, res) {
        pamListingService.assetAccountListDiff(req.body, function (err, data, statusCode) {
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
    
    
    app.post('/' + global.config.version + '/pam/event/report', function (req, res) {
        pamListingService.eventReport(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
}
;
module.exports = PamListingController;
