/*
 *author: Nani Kalyan V
 * 
 */

var VodafoneService = require("../services/vodafoneService");

function VodafoneController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var util = objCollection.util;
    var vodafoneService = new VodafoneService(objCollection);

    app.post('/' + global.config.version + '/vodafone/neworder_form/add', function (req, res) {
        vodafoneService.getAdminAssets(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });   
    
    
};

module.exports = VodafoneController;
