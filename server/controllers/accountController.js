/*
 *author: Sri Sai Venkatesh 
 * 
 */

var AccountService = require("../services/accountService");

function AccountController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var util = objCollection.util;
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

    app.put('/' + global.config.version + '/account/cover/update/email', function (req, res){
        accountService.updateAccountEmail(req.body, function (err, data, statusCode) {
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

    app.put('/' + global.config.version + '/account/cover/update/mailing-address', function (req, res) {
        try {
            JSON.parse(req.body.mailing_address_collection);
            accountService.updateAccountMailingAddress(req.body, function (err, data, statusCode) {
                if (err === false) {
                    // got positive response   
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                } else {
                    //console.log('did not get proper rseponse');
                    data = {};
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                }
            });
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {}, -3308, req.body));
            return;
        }

    });

    app.put('/' + global.config.version + '/account/cover/update/forwarding-address', function (req, res) {
        try {
            JSON.parse(req.body.account_forwarding_address);
            accountService.updateAccountForwardingAddress(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {}, -3308, req.body));
            return;
        }
        
    });

    app.put('/' + global.config.version + '/account/cover/update/phone', function (req, res) {
        try{
            JSON.parse(req.body.account_phone_number_collection);
            accountService.updateAccountPhone(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {}, -3308, req.body));
            return;
        }
        
    });
    
    app.post('/' + global.config.version + '/account/access/list', function (req, res) {
        accountService.retrieveAccountList(req.body, function (err, data, statusCode) {
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
    
    //Twilio
    app.post('/' + global.config.version + '/account/twilio/getPhoneNumbers', function (req, res) {
        util.getPhoneNumbers(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Twilio
    app.post('/' + global.config.version + '/account/twilio/purchaseNumber', function (req, res) {
        util.purchaseNumber(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Twilio
    app.post('/' + global.config.version + '/account/twilio/makeCall', function (req, res) {
        util.twilioMakeCall(req.body, function (err, data, statusCode) {
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
module.exports = AccountController;
