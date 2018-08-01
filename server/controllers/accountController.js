/*
 *author: Sri Sai Venkatesh 
 * 
 */

var AccountService = require("../services/accountService");
var fs = require('fs');

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
        
        var file = '/api-efs/twiliovoicesxmlfiles/' + x[3] + '.xml';
        //var file = '/home/nani/Desktop/twiliovoicesxmlfiles/' + x[3] + '.xml';
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
        var file = '/api-efs/nexmovoicesjsonfiles/' + req.query.file;
        //var file = '/home/nani/Desktop/twiliovoicesxmlfiles/' + x[3] + '.xml';
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
                
        /*var text = "Hey "+ request.receiver_name +" , "+ request.sender_name+" has requested your participation in "+request.task_title+" using the Desker App, ";
            text += "it's due by " + request.due_date + ". Download the App from http://desker.co/download.";*/
                       
        util.sendSmsSinfini(request.message, request.country_code, request.phone_number, function(err,res){
                console.log(err,'\n',res);                 
            });
            
        res.send(responseWrapper.getResponse(false, {}, 200, req.body));
     });

}
;
module.exports = AccountController;
