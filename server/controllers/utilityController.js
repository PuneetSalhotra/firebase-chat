//const request = require('request');
/*
 *author: Sri Sai Venkatesh 
 * 
 */
var AwsSss = require('../utils/s3Wrapper');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const FileType = require('file-type');

function UtilityController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var util = objCollection.util;
    var sss = new AwsSss();
    const db = objCollection.db;
    const activityCommonService = objCollection.activityCommonService;
    const privateKey = global.config.privateKey;

    app.post('/' + global.config.version + '/time/access/global/entry/collection', function (req, res) {

        var statusCode = 200;
        res.send(responseWrapper.getResponse(false, {}, statusCode, req.body));

    });

    //Bharat Requirement
    app.post('/' + global.config.version + '/send/email', function (req, res) {
        var otp = util.randomInt(1111, 9999);
        otp = otp.toString();
        util.sendEmail('bharat@desker.co', otp, JSON.stringify(req.body), '', function (err, data) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data.response, 200, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data.code, 200, req.body));
            }
        });
    });

    //Bharat Requirement
    app.get('/' + global.config.version + '/send/email', function (req, res) {
        var otp = util.randomInt(1111, 9999);
        otp = otp.toString();
        util.sendEmail('bharat@desker.co', otp, JSON.stringify(req.query), '', function (err, data) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data.response, 200, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data.code, 200, req.body));
            }
        });
    });

    // Developed during the Vodafone - Order Management - PoC - SMTP
    app.post('/' + global.config.version + '/send/email/v1', function (req, res) {
        let emailSubject = req.body.email_subject;
        let emailBody = req.body.email_body;
        let htmlTemplate = req.body.html_template
        let emailReceiver = JSON.stringify(req.body.email_receiver);

        util.sendEmailV1(req.body, emailReceiver, emailSubject, emailBody, htmlTemplate, function (err, data) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, 200, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, -100, req.body));
            }
        });
    });

    // Developed during the Vodafone - Order Management - PoC - SendGrid
    app.post('/' + global.config.version + '/send/email/v2', function (req, res) {
        let emailSubject = req.body.email_subject;
        let emailBody = req.body.email_body;
        let htmlTemplate = req.body.html_template
        let emailReceiver = req.body.email_receiver;

        util.sendEmailV2(req.body, emailReceiver, emailSubject, emailBody, htmlTemplate, function (err, data) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, 200, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, -100, req.body));
            }
        });
    });

    // Testing Sendinblue email service
    app.post('/' + global.config.version + '/send/email/v3', function (req, res) {
        let emailSubject = req.body.email_subject;
        let emailBody = req.body.email_body;
        let htmlTemplate = req.body.html_template;
        let emailReceiver = req.body.email_receiver;

        util.sendEmailV3(req.body, emailReceiver, emailSubject, emailBody, htmlTemplate, function (err, data) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, 200, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, -100, req.body));
            }
        });
    });

    // Testing Sendinblue email service
    app.post('/' + global.config.version + '/send/email/v4', async (req, res) => {
        let emailSubject = req.body.email_subject;
        let emailBody = req.body.email_body;
        let htmlTemplate = req.body.html_template;
        let emailReceiver = req.body.email_receiver;
        const emailSender = req.body.email_sender;

        if(emailSender === 'no_reply@grenerobotics.com') {
            util.sendEmailV4(req.body, emailReceiver, emailSubject, emailBody, htmlTemplate, function (err, data) {
                if (err === false) {
                    res.send(responseWrapper.getResponse(err, data, 200, req.body));
                } else {
                    res.send(responseWrapper.getResponse(err, err, -100, req.body));
                }
            });
        } else {
            let [err, data] = await util.sendEmailV4ews(req.body, emailReceiver, emailSubject, emailBody, htmlTemplate);
            if (err) {
                return res.send(responseWrapper.getResponse(err, data, -9999, req.body));
            } else {
                return res.send(responseWrapper.getResponse({}, data, 200, req.body));
            }
        }
        
    });

    //VNK webhook
    app.post('/' + global.config.version + '/vnk', function (req, res) {
        //console.log('Request : ', req.body);
        global.logger.write('debug', 'Request : ' + JSON.stringify(req.body), {}, req.body);
        req.body.country_code = '91';
        req.body.to_phone_number = '9966626954';
        req.body.from_phone_number = '+15107094638';

        util.twilioMakeCall(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //VNK webhook
    app.get('/' + global.config.version + '/vnk', function (req, res) {
        //console.log('Request : ', req.body);
        global.logger.write('debug', 'Request : ' + JSON.stringify(req.body), {}, req.body);
        req.body.country_code = '91';
        req.body.to_phone_number = '9966626954';
        req.body.from_phone_number = '+15107094638';

        util.twilioMakeCall(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset/bucket/add', function (req, res) {
        sss.createAssetBucket(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Send SMS Invite
    app.post('/' + global.config.version + '/invite/send/sms', function (req, res) {
        var request = req.body;
        var domesticSmsMode = global.config.domestic_sms_mode;
        var internationalSmsMode = global.config.international_sms_mode;

        //console.log('Request params : ', request);
        global.logger.write('debug', 'Request params : ' + JSON.stringify(request), {}, request);
        var text;

        if (!request.hasOwnProperty("task_title")) {
            text = "Hi " + request.receiver_name + " , " + request.sender_name + " has requested your participation in a task, ";
            text += "You can access this task by downloading your WorldDesk App from https://worlddesk.desker.co/";
        } else if (request.hasOwnProperty("task_title")) {
            if (request.task_title != "") {
                text = "Hi " + request.receiver_name + " , " + request.sender_name + " has requested your participation in " + request.task_title + " using the WorldDesk App, ";
                text += "it's due by " + request.due_date + ". Download the app from https://worlddesk.desker.co/";
            } else {
                text = "Hi " + request.receiver_name + " , " + request.sender_name + " has requested your participation in a task, ";
                text += "You can access this task by downloading your WorldDesk App from https://worlddesk.desker.co/";
            }
        }

        //console.log("sms Text : " + text);
        global.logger.write('debug', 'sms Text : ' + text, {}, request);

        /*if (request.country_code == 91) {
            //console.log('Sending Domestic SMS');
            global.logger.write('debug', 'Sending Domestic SMS', {}, request);
            fs.readFile(`${__dirname}/../utils/domesticSmsMode.txt`, function (err, data) {
                (err) ?
                global.logger.write('debug', err, {}, request):
                    //console.log(err) : 
                    domesticSmsMode = Number(data.toString());

                switch (domesticSmsMode) {
                    case 1: // mvaayoo                        
                        util.sendSmsMvaayoo(text, request.country_code, request.phone_number, function (error, data) {
                            if (error)
                                //console.log(error);
                                //console.log(data);                                            
                                global.logger.write('debug', error, {}, request);
                            global.logger.write('trace', data, error, request);
                        });
                        break;
                    case 3: // sinfini                                    
                        util.sendSmsSinfini(text, request.country_code, request.phone_number, function (error, data) {
                            if (error)
                                //console.log(error);
                                //console.log(data);
                                global.logger.write('debug', error, {}, request);
                            global.logger.write('trace', data, error, request)
                        });
                        break;
                }
            });

        } else {
            fs.readFile(`${__dirname}/../utils/internationalSmsMode.txt`, function (err, data) {
                (err) ?
                global.logger.write('debug', err, {}, request):
                    //console.log(err) : 
                    internationalSmsMode = Number(data.toString());

                // send international sms                    
                //console.log('Sending International SMS');
                global.logger.write('debug', 'Sending International SMS', {}, request);
                switch (internationalSmsMode) {
                    case 1:
                        util.sendInternationalTwilioSMS(text, request.country_code, request.phone_number, function (error, data) {
                            if (error)
                                global.logger.write('trace', data, error, request)
                        });
                        break;
                    case 2:
                        util.sendInternationalNexmoSMS(text, request.country_code, request.phone_number, function (error, data) {
                            if (error)
                                global.logger.write('trace', data, error, request)
                        });
                        break;
                }
            });
        }*/

        res.send(responseWrapper.getResponse(false, {}, 200, req.body));
    });
    
    app.post('/' + global.config.version + '/send/smshorizon/sms', function (req, res) {
       var smapleSMS = "Hi This is a sample Test";
       smapleSMS = smapleSMS + req.body.counter;
       
        util.sendSmsHorizon(smapleSMS, req.body.country_code, req.body.phone_number, function (err, data) {
            if (err === false) {
            	global.logger.write('debug', 'SMS HORIZON RESPONSE: ' + JSON.stringify(data), {}, req);
                res.send(responseWrapper.getResponse(err, data.response, 200, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data.code, 200, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/send/smshorizon/sms', function (req, res) {
        var smapleSMS = "Hi This is a sample Test";
        smapleSMS = smapleSMS + req.body.counter;
        
         util.sendSmsHorizon(smapleSMS, req.body.country_code, req.body.phone_number, function (err, data) {
             if (err === false) {
             	global.logger.write('debug', 'SMS HORIZON RESPONSE: ' + JSON.stringify(data), {}, req);
                 res.send(responseWrapper.getResponse(err, data.response, 200, req.body));
             } else {
                 res.send(responseWrapper.getResponse(err, data.code, 200, req.body));
             }
         });
     });

     app.post('/' + global.config.version + '/s3/excel_json/list', async (req, res) => {       
        try {
            let result = await util.getJSONfromXcel(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }         
     });

     app.get('/' + global.config.version + '/healthcheck', async (req, res) => {       
        try {                       
            let result = await db.checkDBInstanceAvailablity(1);
            console.log('MASTER : ', result);
            if(result[0] === 0) {
                ////////////////////////////////////
                try {                       
                    let result = await db.checkDBInstanceAvailablity(0);
                    console.log('SLAVE : ', result);
                    if(result[0] === 0) {                        
                        res.send(result[1]);
                    } else if(result[0] === 1) {
                        res.status(500).send(result[1]);
                    }
                } catch(err) {
                    console.log('ERROR : ', err);
                    res.send(err);
                }
                ///////////////////////////////////
                //res.send(result[1]);
            } else if(result[0] === 1) {
                res.status(500).send(result[1]);
            }
        } catch(err) {
            console.log('ERROR : ', err);
            res.send(err);
        }

     });

    app.post('/' + global.config.version + '/send/asset/push_notification', async (req, res) => {
        // [CHECK] activity_id
        if (
            !req.body.hasOwnProperty("activity_id") ||
            Number(req.body.activity_id) === 0
        ) {
            return [true, {
                message: `Incorrect activity_id specified.`
            }];
        }
        const activityData = await activityCommonService.getActivityDetailsPromise(req.body, req.body.activity_id);
        if (Number(activityData.length) <= 0) {
            return res.send(responseWrapper.getResponse(true, {
                message: `No workflow/activity data found in db`
            }, -9999, req.body));
        }

        const [err, responseData] = await util.sendCustomPushNotification(req.body, activityData);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/send/asset/push_notification | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // send/email/v3 -- /send/email/v5 - need auth token or accesstoken
    app.post('/' + global.config.version + '/send/email/v5', (req, res) => {
        let emailSubject = req.body.email_subject;
        let emailBody = req.body.email_body;
        let htmlTemplate = req.body.html_template;
        let emailReceiver = req.body.email_receiver;

        util.sendEmailV3(req.body, emailReceiver, emailSubject, emailBody, htmlTemplate, function (err, data) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, 200, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, -100, req.body));
            }
        });
    });


    // send/email/v4 -- /send/email/v6 - need auth token or accesstoken
    app.post('/' + global.config.version + '/send/email/v6', async (req, res) => {
        let emailSubject = req.body.email_subject;
        let emailBody = req.body.email_body;
        let htmlTemplate = req.body.html_template;
        let emailReceiver = req.body.email_receiver;
        const emailSender = req.body.email_sender;
        let outlookEmailIntegrationFLag = req.body.outlook_email_integration;
        
        if(emailSender === 'no_reply@grenerobotics.com') {
            util.sendEmailV4(req.body, emailReceiver, emailSubject, emailBody, htmlTemplate, function (err, data) {
                if (err === false) {
                    res.send(responseWrapper.getResponse(err, data, 200, req.body));
                } else {
                    res.send(responseWrapper.getResponse(err, err, -100, req.body));
                }
            });
        } else {
            let [err, data] = await util.sendEmailV4ews(req.body, emailReceiver, emailSubject, emailBody, htmlTemplate, 0, outlookEmailIntegrationFLag, emailSender);
            if (err) {
                return res.send(responseWrapper.getResponse(err, data, -9999, req.body));
            } else {
                return res.send(responseWrapper.getResponse({}, data, 200, req.body));
            }
        }
    });


    //ROMS email using ews web exchange server
    app.post('/' + global.config.version + '/send/email/v7', async (req, res) => {
        let emailSubject = req.body.email_subject;
        let emailBody = req.body.email_body;
        let htmlTemplate = req.body.html_template;
        let emailReceiver = req.body.email_receiver;

        let [err, data] = await util.sendEmailV4ews(req.body, emailReceiver, emailSubject, emailBody, htmlTemplate);
        if (err) {
            return res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    //Uploading XLSB file 
    //Added by Akshay Singh
    app.post('/'+global.config.version+'/excel/s3/upload',async(req,res)=>{
        let filePath = req.body.filePath;
        console.log("File Path"+filePath);
        // let [err,data] = await util.uploadExcelFileToS3(req.body,filePath);
        let [err,data] = await util.uploadExcelFileToS3V1(req.body,filePath);
        console.log(err);
        console.log(data);
        if (err) {
            return res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    //Downloading XLSB file 
    //Added by Akshay Singh
    app.post('/'+global.config.version+'/excel/s3/download',async(req,res)=>{
        let fileKey = req.body.fileKey;
        let pathToDownload = req.body.pathToDownload;
        let fileNameToCreate = req.body.fileNameToCreate;

        // let [err,data] = await util.downloadExcelFileFromS3(req.body,fileKey,pathToDownload,fileNameToCreate);
        let [err,data] = await util.downloadExcelFileFromS3V1(req.body,fileKey,pathToDownload,fileNameToCreate);
        console.log(err,data);
        if (err) {
            return res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        } else {
            return res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }
    });

    app.post('/'+global.config.version+'/vil/temp-credentials/fetch',async(req,res)=>{
        //Give an Username & PWD        
        if(req.body.user_name === 'nani' && req.body.password === 'kalyan') {
            const token = jwt.sign({user_id: 'vil'}, privateKey, { expiresIn: '1h' }, { algorithm: 'RS256'});
            res.status(200).send({'access_token': token, 'expires_in': '1 hour'});
        } else {
            res.status(401).send({'message': 'Invalid Username or password'});            
        }        
    });

    
    //For Vodafone S3 File downloads
    app.post('/'+global.config.version+'/vil/s3-object/download',async(req,res)=>{        
        
        try {
            //Do the JWT authentication
            let token = req.headers.accesstoken;
            token = token.split(' ')[1];

            console.log('token - ', token);
            if(token === null || token === undefined) {
                res.status(401).send({'message': 'Invalid Access Token'});
                    return;            
            }        
                
            let decoded;
            try{
                decoded = jwt.verify(token, privateKey);
                console.log('decoded : ', decoded);
            } catch(err) {
                res.status(401).send({'message': 'Access Token Expired'});
                return;
            }            

            if(decoded === null) {             
                res.status(401).send({'message': 'Invalid Access Token'});
                return;
            }

            if(req.body.s3_url === null || req.body.s3_url === undefined) {
                res.status(400).send({'message': 's3_url params is missing'});
                return;
            } else {
                let filePath = await util.downloadS3ObjectVil(req.body, req.body.s3_url);
                console.log('filePath in Controller - ', filePath);

                if(filePath!== null) {
                    //fs.createReadStream(filePath).pipe(res);
                    //res.write(fs.createReadStream(filePath));
                    //fs.unlink(filePath);
                    //res.end();

                    //res.contentType(filePath);
                    //res.sendFile(filePath);
                    
                    //res.sendFile('/apistaging-data/one.png');
                    //res.sendFile('/apistaging-data/MOJO0925005A16233330.pdf');

                    //const buffer = new Buffer.from(filePath,'base64');
                    //console.log(buffer);
                    //console.log(buffer.toString('base64'));
                    //res.send(buffer);                    

                    const stat = fs.statSync(filePath);                   

                    let mime;
                    try {
                        const {ext, mime} = await FileType.fromFile(filePath);
                        console.log('ext - ', ext);
                        console.log('mime - ', mime);
                    } catch(err) {
                        mime = 'application/pdf; image/png';
                    }
                    console.log('mime - ', mime);
                    
                    //res.writeHead(200, {
                    //    'Content-Type': mime,
                    //    'Content-Length': stat.size
                    //});

                    const readStream = fs.createReadStream(filePath);                    
                    //readStream.pipe(res);

                    res.sendFile(filePath);

                    readStream.on('end', ()=>{                        
                        //fs.unlink(filePath, ()=>{});
                    });
                    
                } else {
                    res.status(500).send({'message': 'Error in downloading the S3 Object'});
                }   
            }            
        } catch(err) {
            console.log(err);
            res.status(500).send({'message': 'Error in downloading the S3 Object'});
        }
        
    });

    app.post('/'+global.config.version+'/veryify-token',async(req,res)=>{
        console.log("In verifying Access token for socket io");
        return res.send(responseWrapper.getResponse({}, {}, 200, {}));
    });
}
module.exports = UtilityController;
