/*
 *author: Nani Kalyan V
 * 
 */

var ZohoService = require("../services/zohoService");

function ZohoController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var zohoService = new ZohoService(objCollection);
    var util = objCollection.util;
    var cacheWrapper = objCollection.cacheWrapper;
    var queueWrapper = objCollection.queueWrapper;
    
       
    //Create a Customer
    app.post('/' + global.config.version + '/zoho/customer/set', function (req, res) {
        zohoService.createCustomer(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    
    //Get a Customerconsole.log
    app.post('/' + global.config.version + '/zoho/customer/retrieve', function (req, res) {
        zohoService.getCustomerDetails(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Update a Customer
    app.put('/' + global.config.version + '/zoho/customer/update', function (req, res) {
        zohoService.updateCustomerDetails(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Delete a Customer
    app.post('/' + global.config.version + '/zoho/customer/reset', function (req, res) {
        zohoService.deleteCustomer(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Mark a customer as Active
    app.post('/' + global.config.version + '/zoho/customer/active', function (req, res) {
        zohoService.markCustomerActive(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Mark a customer as InActive
    app.post('/' + global.config.version + '/zoho/customer/inactive', function (req, res) {
        zohoService.markCustomerInActive(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Create subscription for a new Customer
    app.post('/' + global.config.version + '/zoho/customer/subscription/set', function (req, res) {
        zohoService.createCustomerSubscription(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Create subscription for existing Customer
    app.post('/' + global.config.version + '/zoho/existing_customer/subscription/set', function (req, res) {
        zohoService.createExistingCustomerSubscription(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Update subscription
    app.put('/' + global.config.version + '/zoho/customer/subscription/update', function (req, res) {
        zohoService.updateCustomerSubscription(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Delete subscription
    app.post('/' + global.config.version + '/zoho/customer/subscription/reset', function (req, res) {
        zohoService.deleteCustomerSubscription(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Retrieving Card of a Customer
    app.post('/' + global.config.version + '/zoho/customer/card/retrieve', function (req, res) {
        zohoService.getCustomerCardDetails(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Updating Card of a Customer
    app.put('/' + global.config.version + '/zoho/customer/card/update', function (req, res) {
        zohoService.updateCustomerCardDetails(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Removing Card of a Customer
    app.post('/' + global.config.version + '/zoho/customer/card/reset', function (req, res) {
        zohoService.deleteCustomerCardDetails(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Zoho Payment Integration -- Update account Billing Details
    app.put('/' + global.config.version + '/zoho/account/billing/update', function (req, res) {
        zohoService.updateAcctBillingDetails(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Zoho Payment Integration -- Update account Billing asset
    app.put('/' + global.config.version + '/zoho/asset/account/billing/update', function (req, res) {
        zohoService.updateAssetBillingDetails(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper response');
                global.logger.write('response', 'did not get proper response', err, {});
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
}
;
module.exports = ZohoController;
