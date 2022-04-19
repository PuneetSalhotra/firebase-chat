/*
 *author: Sri Sai Venkatesh 
 * 
 */

let AccountService = require("../services/accountService");
let fs = require('fs');
//const smsEngine = require('../utils/smsEngine');

function AccountController(objCollection) {

    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    let util = objCollection.util;
    const db = objCollection.db;
    let accountService = new AccountService(objCollection);

    app.post('/' + global.config.version + '/account/access/admin-asset/list', function (req, res) {
        accountService.getAdminAssets(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/account/asset/access/desk-mapping/list', function (req, res) {
        accountService.getDeskMappingAssets(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/account/cover/update/email', function (req, res) {
        accountService.updateAccountEmail(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/account/cover/update/mailing-address', function (req, res) {
        try {
            JSON.parse(req.body.mailing_address_collection);
            accountService.updateAccountMailingAddress(req.body, function (err, data, statusCode) {
                if (err === false) {
                    // got positive response   
                    res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                } else {
                    //console.log('did not get proper rseponse');
                    data = {};
                    res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                }
            });
        } catch (exeption) {
            res.json(responseWrapper.getResponse(false, {}, -3308, req.body));
            return;
        }

    });

    app.post('/' + global.config.version + '/account/cover/update/forwarding-address', function (req, res) {
        try {
            JSON.parse(req.body.account_forwarding_address);
            accountService.updateAccountForwardingAddress(req.body, function (err, data, statusCode) {
                if (err === false) {
                    // got positive response   
                    res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                } else {
                    //console.log('did not get proper rseponse');
                    data = {};
                    res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                }
            });
        } catch (exeption) {
            res.json(responseWrapper.getResponse(false, {}, -3308, req.body));
            return;
        }

    });

    app.post('/' + global.config.version + '/account/cover/update/phone', function (req, res) {
        try {
            JSON.parse(req.body.account_phone_number_collection);
            accountService.updateAccountPhone(req.body, function (err, data, statusCode) {
                if (err === false) {
                    // got positive response   
                    res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                } else {
                    //console.log('did not get proper rseponse');
                    data = {};
                    res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
                }
            });
        } catch (exeption) {
            res.json(responseWrapper.getResponse(false, {}, -3308, req.body));
            return;
        }

    });

    app.post('/' + global.config.version + '/account/access/list', function (req, res) {
        accountService.retrieveAccountList(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Twilio
    app.post('/' + global.config.version + '/account/twilio/getPhoneNumbers', function (req, res) {
        util.getPhoneNumbers(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Twilio
    app.post('/' + global.config.version + '/account/twilio/purchaseNumber', function (req, res) {
        util.purchaseNumber(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Twilio
    app.post('/' + global.config.version + '/account/twilio/makeCall', function (req, res) {
        util.twilioMakeCall(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Loggin Communication request Service -- Bharat asked on 15th June
    app.post('/' + global.config.version + '/account/log/communication/request', function (req, res) {
        accountService.loggingCommunicationReq(req.body, function (err, data, statusCode) {
            (err === false) ?
            res.json(responseWrapper.getResponse(err, data, statusCode, req.body)):
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
        });
    });


    //Loggin Communication request Service -- Bharat asked on 15th June
    app.get('/' + global.config.version + '/account/log/communication/request', function (req, res) {
        accountService.loggingCommunicationReq(req.query, function (err, data, statusCode) {
            (err === false) ?
            res.json(responseWrapper.getResponse(err, data, statusCode, req.body)):
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
        });
    });

    //Loggin Communication request Service -- Bharat asked on 16th June
    app.post('/' + global.config.version + '/account/log/communication/request/list', function (req, res) {
        accountService.getLoggingCommunicationReq(req.body, function (err, data, statusCode) {
            (err === false) ?
            res.json(responseWrapper.getResponse(err, data, statusCode, req.body)):
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
        });
    });

    //Voice XML for TWILIO
    app.post('/' + global.config.version + '/account/voice*', function (req, res) {
        // console.log('VNK : ' , req.body);
        //global.logger.write('conLog', 'VNK : ' + JSON.stringify(req.body, null, 2), {}, req);
        util.logInfo(req.body,`/account/voice* VNK: %j`,{VNK : JSON.stringify(req.body, null, 2),body : req.body});
        let x = req.body.url;
        x = x.split("/");
        // console.log('x[3] : ' + x[3]);
        //global.logger.write('conLog', 'x[3] : ' + x[3], {}, req);
        util.logInfo(req.body,`/account/voice* x[3]: %j`,{x3 : x[3], body : req.body});

        let file = global.config.efsPath + 'twiliovoicesxmlfiles/' + x[3] + '.xml';
        // console.log(file);               
        //global.logger.write('conLog', 'Voice XML for TWILIO: ' + file, {}, req);
        util.logInfo(req.body,`/account/voice* Voice XML for TWILIO: %j`,{Voice_XML_for_TWILIO : file, body : req.body});

        fs.readFile(file, function (err, data) {
            if (err) {
                res.json(responseWrapper.getResponse(err, x[3] + ".xml is not there.", -3401, req.body));
            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/xml'
                });
                res.write(data);
                res.end();
            }
        });
    });


    //Voice JSON for NEXMO
    app.get('/' + global.config.version + '/account/nexmo/voice*', function (req, res) {
        // console.log('Request.query : ' , req.body);
        //global.logger.write('debug', 'Request.query : ' + JSON.stringify(req.body, null, 2), {}, req);

        let file = global.config.efsPath + 'nexmovoicesjsonfiles/' + req.query.file;
        // console.log(file);       
        //global.logger.write('debug', 'Voice JSON file for NEXMO: ' + file, {}, req);

        fs.readFile(file, function (err, data) {
            if (err) {
                res.json(responseWrapper.getResponse(err, file + " is not there.", -3501, req.body));
            } else {
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.write(data);
                res.end();
            }
        });
    });

    // Voice JSON for NEXMO | Version: v1
    app.get('/' + global.config.version + '/account/nexmo/v1/voice*', async function (req, res) {
        const file = req.query.file;
        try {
            const [err, rawJsonData] = await util.getJsonFromS3Bucket(req.body, "worlddesk-passcode-voice", "nexmo", req.query.file);
            if (err) {
                res.json(responseWrapper.getResponse(err, file + " is not there.", -3501, req.body));
                return;
            } else {
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                res.write(rawJsonData);
                res.end();
            }
        } catch (error) {
            console.log("/account/nexmo/v1/voice* | Error: ", error);
            res.json(responseWrapper.getResponse(error, file + " is not there.", -3501, req.body));
            return;
        }
    });

    //Webhook for NEXMO
    app.post('/' + global.config.version + '/account/webhook/nexmo', function (req, res) {
        // console.log('Nexmo webhook req.body : ', req.body)
        //global.logger.write('debug', 'Nexmo webhook req.body: ' + JSON.stringify(req.body, null, 2), {}, req);
        res.json(responseWrapper.getResponse(false, req.body, 200, req.body));
    });

    //Send SMS
    app.post('/' + global.config.version + '/account/send/sms', async (req, res) => {
        let request = req.body;
        
        //global.logger.write('debug', 'Request params: ' + JSON.stringify(request, null, 2), {}, request);
        util.logInfo(request,`/account/send/sms debug Request params: %j`,{Request_params : JSON.stringify(request, null, 2), request});         
        
        let paramsArr = new Array(request.organization_id);        
        let queryString = util.getQueryString('ds_p1_organization_list_select', paramsArr);
        let result, senderId;

        if (queryString != '') {                
            result = await (db.executeQueryPromise(1, queryString, request));
        }

        (result.length > 0) ? senderId = result[0].organization_text_sender_name : senderId = 'MYTONY';        
        
        util.sendSmsSinfiniV1(request.message, request.country_code, request.phone_number, senderId, function (err, response) {
            // console.log(err,'\n',res);
            //global.logger.write('debug', 'Sinfini Error: ' + JSON.stringify(err, null, 2), {}, request);
            util.logInfo(request,`debug Sinfini Error: %j`,{Sinfini_Error : JSON.stringify(err, null, 2), request});
            util.logError(request,`conLog Sinfini Error: %j`, { err });
            //global.logger.write('debug', 'Sinfini Response: ' + JSON.stringify(response, null, 2), {}, request);
            util.logInfo(request,`debug Sinfini Response: %j`,{Sinfini_Response : JSON.stringify(response, null, 2), request});
            res.json(responseWrapper.getResponse(false, {}, 200, req.body));
        });       

    });

    /* GET SINFINI SMS delivery receipt  */
    /*app.get('/' + global.config.version + '/sms-dlvry/sinfini', function (req, res) {
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
        res.jsonStatus(200);
    });*/

    /* GET TWILIO SMS delivery receipt */
    /*app.post('/' + global.config.version + '/sms-dlvry/twilio', function (req, res) {
        console.log("req.query: ", req.query);
        console.log("req.body: ", req.body);
        console.log("req.params: ", req.params);

        if (req.body.SmsStatus === 'queued' || req.body.SmsStatus === 'sent') {
           //  Irrelevant statuses
            res.jsonStatus(200);
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
        res.jsonStatus(200);
    });*/

    /* GET NEXMO SMS delivery receipt. */
    /*app.get('/' + global.config.version + '/sms-dlvry/nexmo', function (req, res) {

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
        res.jsonStatus(200);
    });*/


    // Set Account Config Values
    app.post('/' + global.config.version + '/account/config/set', function (req, res) {
        accountService.setAccountConfigValues(req.body, function (err, data, statusCode) {
            (err === false) ?
            res.json(responseWrapper.getResponse(err, data, statusCode, req.body)):
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
        });
    });

    // Fetch available customer suppoer agent: POC Phase.
    // This route may be required to be moved to a separate module altogether.
    /*app.post('/' + global.config.version + '/account/customer_service/agents/fetch', function (req, res) {
        accountService.fetchCustomerServiceAgentsOnCrmFloor(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // Error fetching available errors
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });*/

    // Set default landing module for a workforce.
    app.post('/' + global.config.version + '/workforce/module/default/set', function (req, res) {
        accountService.setDefaultModuleForWorkforce(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Set default landing module for an account.
    app.post('/' + global.config.version + '/account/module/default/set', function (req, res) {
        accountService.setDefaultModuleForAccount(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Call to update the inline data of the workforce
    app.post('/' + global.config.version + '/workforce/inline_data/update', async function (req, res) {
        const [err, data] = await accountService.workforceListUpdateInlineData(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // Call to get differential data for a workforce
    app.post('/' + global.config.version + '/workforce/list', async function (req, res) {
        const [err, data] = await accountService.workforceListSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // Call to search processes
    app.post('/' + global.config.version + '/workforce/activity_type/search', async function (req, res) {
        const [err, data] = await accountService.workforceActivityTypeMappingSelectSearch(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // Service to fetch S3 User Credentials
    app.post('/' + global.config.version + '/account/s3/user-credentials/fetch', async function (req, res) {
        const [err, data] = await accountService.fetchS3UserCredentials(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // Service to fetch AWS Resource Credentials
    app.post('/' + global.config.version + '/aws_resources/credentials/fetch', async function (req, res) {
        try{
            const data = await accountService.fetchCredentials(req.body);
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }catch(err){            
            res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
        }        
    });

    app.post('/' + global.config.version + '/organization/labels/fetch', async function (req, res) {
        const [err, data] = await accountService.fetchOrganizationLabels(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/aws-bucket/name/list', async function (req, res) {
        
            const [err,result] = await accountService.fetchS3BucketByMonthYear(req.body);
            if(!err){
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        }else{            
            res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
        }        
    });

    app.post('/' + global.config.version + '/singleaccount/mob/iot/ransactions/summary', async function (req, res) {

        const [err, result] = await accountService.singleaccountMobIoTransactionsSummary(req.body);

        if (!err) {
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
        }
    });

};

module.exports = AccountController;
