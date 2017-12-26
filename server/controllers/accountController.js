/*
 *author: Sri Sai Venkatesh 
 * 
 */

var AccountService = require("../services/accountService");

function AccountController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var accountService = new AccountService(objCollection);

    app.post('/' + global.config.version + '/account/access/admin-asset/list', function (req, res) {
        accountService.getAdminAssets(req.body, function (err, data, statusCode) {
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
    
    app.post('/' + global.config.version + '/account/asset/access/desk-mapping/list', function (req, res) {
        accountService.getDeskMappingAssets(req.body, function (err, data, statusCode) {
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


};
module.exports = AccountController;