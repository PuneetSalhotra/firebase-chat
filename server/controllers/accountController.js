/*
 *author: Sri Sai Venkatesh 
 * 
 */

var AccountService = require("../services/accountService");
var fs = require('fs');
const smsEngine = require('../utils/smsEngine');

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
    
    //Loggin Communication request Service -- Bharat asked on 15th June
    app.post('/' + global.config.version + '/account/log/communication/request', function (req, res) {
        accountService.loggingCommunicationReq(req.body, function (err, data, statusCode) {
                (err === false) ?
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body)):                    
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body));                
            });        
    });
    
    
    //Loggin Communication request Service -- Bharat asked on 15th June
    app.get('/' + global.config.version + '/account/log/communication/request', function (req, res) {        
        accountService.loggingCommunicationReq(req.query, function (err, data, statusCode) {
                (err === false) ?
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body)):                    
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body));                
            });        
    });
    
    //Loggin Communication request Service -- Bharat asked on 16th June
    app.post('/' + global.config.version + '/account/log/communication/request/list', function (req, res) {
        accountService.getLoggingCommunicationReq(req.body, function (err, data, statusCode) {
                (err === false) ?
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body)):                    
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            });        
    });
    
    //Voice XML for TWILIO
    app.post('/' + global.config.version + '/account/voice*', function (req, res) {
        console.log('VNK : ' , req.body);
        var x = req.body.url;
        x = x.split("/");
        console.log('x[3] : ' + x[3]);
        
        var file = global.config.efsPath + 'twiliovoicesxmlfiles/' + x[3] + '.xml';
        console.log(file);               
        
        fs.readFile(file,function (err, data) {
          if (err) {
              res.send(responseWrapper.getResponse(err, x[3] + ".xml is not there.", -3401, req.body));
          } else {
              res.writeHead(200, {'Content-Type': 'text/xml'});
              res.write(data);
              res.end();
          }
      });        
    });
    
    
    //Voice JSON for NEXMO
    app.get('/' + global.config.version + '/account/nexmo/voice*', function (req, res) {
        console.log('Request.query : ' , req.body);
        var file = global.config.efsPath + 'nexmovoicesjsonfiles/' + req.query.file;
        console.log(file);       
     
        fs.readFile(file,function (err, data) {
          if (err) {
              res.send(responseWrapper.getResponse(err, file + " is not there.", -3501, req.body));
          } else {
              res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
              res.write(data);
              res.end();
          }
      });        
    });
    
    //Webhook for NEXMO
    app.post('/' + global.config.version + '/account/webhook/nexmo', function (req, res) {
        console.log('Nexmo webhook req.body : ', req.body)
        res.send(responseWrapper.getResponse(false, req.body, 200, req.body));        
    });
    
    //Send SMS
    app.post('/' + global.config.version + '/account/send/sms', function (req, res) {
        var request = req.body;
        console.log('Request params : ', request);
                
        util.sendSmsSinfini(request.message, request.country_code, request.phone_number, function(err,res){
                console.log(err,'\n',res);                 
            });
            
        res.send(responseWrapper.getResponse(false, {}, 200, req.body));
     });

     /* GET SINFINI SMS delivery receipt  */
     app.get('/' + global.config.version + '/sms-dlvry/sinfini', function (req, res) {
         console.log("req.query: ", req.query);

         if (req.query.status[0] === 'DELIVRD' || req.query.status[1] === 'DELIVRD') {
             console.log("\x1b[32m[sinfini]\x1b[0m Message has been delivered.");

         } else if (req.query.custom === 'OTP') {
             console.log("\x1b[31m[sinfini]\x1b[0m OTP has not been delivered.");

             let smsOptions = {
                 type: req.query.custom, // Other types: 'NOTFCTN' | 'COLLBRTN' | 'INVTATN',
                 countryCode: '',
                 phoneNumber: req.query.mobile,
                 verificationCode: req.query.custom1,
                 failOver: true
             };
             smsEngine.emit('send-mvayoo-sms', smsOptions);
         }
         res.sendStatus(200);
     });

     /* GET TWILIO SMS delivery receipt */
     app.post('/' + global.config.version + '/sms-dlvry/twilio', function (req, res) {
         console.log("req.query: ", req.query);
         console.log("req.body: ", req.body);
         console.log("req.params: ", req.params);

         if (req.body.SmsStatus === 'queued' || req.body.SmsStatus === 'sent') {
            //  Irrelevant statuses
             res.sendStatus(200);
             return;
         }

         if (req.body.SmsStatus === 'delivered') {
            console.log("\x1b[32m[twilio]\x1b[0m Message has been delivered.");
         } else if (req.query.type === 'OTP' && (req.body.SmsStatus === 'failed' || req.body.SmsStatus === 'undelivered')) {
            // Currently, the primay internationsal SMS service vendor is Twilio.
            // Fail over to Nexmo.
            let smsOptions = {
                type: req.query.type, // Other types: 'NOTFCTN' | 'COLLBRTN' | 'INVTATN',
                countryCode: '',
                phoneNumber: req.query.ph,
                verificationCode: req.query.vcode,
                failOver: false
            };

            smsEngine.emit('send-nexmo-sms', smsOptions);
         }
         res.sendStatus(200);
     });

    /* GET NEXMO SMS delivery receipt. */
     app.get('/' + global.config.version + '/sms-dlvry/nexmo', function (req, res) {

         if (req.query.status === 'delivered') {
            console.log("\x1b[32m[nexmo]\x1b[0m Message has been delivered.");
         } else if (req.query.type === 'OTP') {
            // Currently, the primay internationsal SMS service vendor is Twilio.
            // So, uncomment the following lines, when either a 3rd vendor is added or
            // when Twilio becomes secondary and Nexmo becomes primary.
            // let smsOptions = {
            //     type: req.query.type, // Other types: 'NOTFCTN' | 'COLLBRTN' | 'INVTATN',
            //     countryCode: '',
            //     phoneNumber: req.query.ph,
            //     verificationCode: req.query.vcode,
            //     failOver: false
            // };

            // smsEngine.emit('send-XXXXXXX-sms', smsOptions);
         }
         res.sendStatus(200);
     });
     
     
    // Set Account Config Values
    app.put('/' + global.config.version + '/account/config/set', function (req, res) {
        accountService.setAccountConfigValues(req.body, function (err, data, statusCode) {
                (err === false) ?
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body)):                    
                    res.send(responseWrapper.getResponse(err, data, statusCode, req.body));                
            });        
    });

    // Fetch available customer suppoer agent: POC Phase.
    // This route may be required to be moved to a separate module altogether.
    app.post('/' + global.config.version + '/account/customer_service/agents/fetch', function (req, res) {
        accountService.fetchCustomerServiceAgentsOnCrmFloor(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // Error fetching available errors
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
     
};

module.exports = AccountController;
