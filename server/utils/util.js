/*
 * author: Sri Sai Venkatesh
 */

let moment = require('moment');
let request = require("request");
let twilio = require('twilio');
let nodemailer = require('nodemailer');
let tz = require('moment-timezone');
const Nexmo = require('nexmo');
let fs = require('fs');
let os = require('os');
const excelToJson = require('convert-excel-to-json');
const XLSX = require('xlsx');
const AWS = require('aws-sdk');
const archiver = require('archiver');
const logger = require("../logger/winstonLogger");
const path = require('path');
const ip = require("ip");
const uuidv4 = require('uuid/v4');
const db = require("./dbWrapper")
let ipAddress = ip.address();
ipAddress = ipAddress.replace(/\./g, '_');
let axios=require('axios');

AWS.config.loadFromPath(`${__dirname}/configS3.json`);

AWS.config.update({
    "accessKeyId": global.config.aws_sqs_email_accessKeyId,
    "secretAccessKey": global.config.aws_sqs_email_secretAccessKey,
    "region": global.config.aws_sqs_email_region
});
const sqs = new AWS.SQS();


const AWS1 = require('aws-sdk');
AWS1.config.update({
    "accessKeyId": "AKIAWIPBVOFRSFSVJZMF",
    "secretAccessKey": "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",
    "region": "ap-south-1"
});
const sqs1 = new AWS1.SQS();

//AWS.config.update(
//    {
//        accessKeyId: "AKIAWIPBVOFRZMTH7FPD",
//        secretAccessKey: "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",
//        region: 'ap-south-1'
//    }
//);

// SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');
// 
// Vodafone Form Field Mapping
const vodafoneFormFieldIdMapping = require(`${__dirname}/formFieldIdMapping`);
// [Vodafone ROMS] CAF Fields Data
const vodafoneRomsCafFieldsData = require(`${__dirname}/vodafoneRomsCafFieldsData`);
const widgetFieldsStatusesData = require(`${__dirname}/widgetFieldsStatusesData`);
// 
// SendInBlue
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;
// Configure API key authorization: api-key
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = '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';

const apiInstance = new SibApiV3Sdk.SMTPApi();
// 

// MySQL for generating prepared statements
const mysql = require('mysql');

// Mailgun Setup
// 
const mailgun = require('mailgun-js')({
    apiKey: 'eabfd38c33980f8f2402df7e4256af64-816b23ef-96f002de',
    domain: 'mg.grenerobotics.com'
});

// AWS SNS
const AwsSns = require('./snsWrapper');
const sns = new AwsSns();

const PubnubWrapper = require('./pubnubWrapper');
const pubnubWrapper = new PubnubWrapper();

const EWS = require('node-ews');
const { response } = require('express');

const CryptoJS = require("crypto-js");
// exchange server connection info
/*const ewsConfig = {
    username: 'ESMSMails@vodafoneidea.com',
    password: 'June@2020',
    password: 'July@2020',
    host: 'https://webmail.vodafoneidea.com'    
  };

// initialize node-ews
const ews = new EWS(ewsConfig);*/

function Util(objectCollection) {
    
    let cacheWrapper = {};
    if (
        objectCollection &&
        objectCollection.hasOwnProperty("cacheWrapper")
    ) {
        cacheWrapper = objectCollection.cacheWrapper;
        activityCommonService = objectCollection.activityCommonService;
    }


    this.getSMSString = function (verificationCode) {
        let msg_body = "MyTony : Use " + verificationCode + " as verification code for registering the MyTony App .";
        return (msg_body);
    };

    this.hasValidActivityId = function (request) {
        if (request.hasOwnProperty('activity_id')) {
            let returnValue;
            (this.replaceZero(request.activity_id) <= 0) ? returnValue = false: returnValue = true;
            return returnValue;
        } else
            return false;
    };

    this.hasValidGenericId = function (request, parameter) {
        let returnValue;
        if (request.hasOwnProperty(parameter)) {
            (this.replaceZero(request[parameter]) <= 0) ? returnValue = false: returnValue = true;
            return returnValue;
        } else
            return false;
    };

    this.isValidAssetMessageCounter = function (request) {
        if (request.hasOwnProperty('asset_message_counter')) {
            let returnValue = false;
            let messageCounter = this.replaceZero(request.asset_message_counter);
            //console.log('after replacing ' + messageCounter);
            (messageCounter === 0) ? returnValue = false: returnValue = true;
            //console.log('returning ' + returnValue);
            return returnValue;
        } else
            return false;
    };

    this.sendSmsMvaayoo = function (messageString, countryCode, phoneNumber, callback) {
        //        console.log("inside sendSmsMvaayoo");
        messageString = encodeURI(messageString);
        let url = "http://api.mvaayoo.com/mvaayooapi/MessageCompose?user=junaid.m@grene.in:greneapple&senderID=MYTONY&receipientno=" + countryCode + "" + phoneNumber + "&dcs=0&msgtxt=" + messageString + "&state=4";

        request(url, function (error, response, body) {
            let res = {};
            if (typeof body != 'undefined' && body.indexOf('Status=0') > -1) {
                res['status'] = 1;
                res['message'] = "Message sent";
            } else {
                res['status'] = 0;
                res['message'] = "Message not sent";
            }
            if (error)
                callback(error, false);
            callback(false, res);
        });
    };

    this.pamSendSmsMvaayoo = function (messageString, countryCode, phoneNumber, callback) {
        //messageString = encodeURI(messageString);
        messageString = encodeURIComponent(messageString);
        let url = "http://api.mvaayoo.com/mvaayooapi/MessageCompose?user=junaid.m@grene.in:greneapple&senderID=PUDMNK&receipientno=" + countryCode + "" + phoneNumber + "&dcs=0&msgtxt=" + messageString + "&state=4";
        //console.log('URL : ', url);
        //global.logger.write('conLog', 'URL : ' + url, {}, {});
        this.logInfo({},`pamSendSmsMvaayoo conLog URL :  %j`,{URL : url});

        request(url, function (error, response, body) {
            let res = {};
            if (typeof body != 'undefined' && body.indexOf('Status=0') > -1) {
                res['status'] = 1;
                res['message'] = "Message sent";
            } else {
                res['status'] = 0;
                res['message'] = "Message not sent";
            }
            if (error)
                callback(error, false);
            callback(false, res);
        });
    };

    this.sendSmsBulk = function (messageString, countryCode, phoneNumber, callback) {
        messageString = encodeURI(messageString);
        let url = "http://bulksmsapps.com/apisms.aspx?user=gsaikiran&password=LUHUUI&genkey=094729492&sender=BLUFLK&number=" + countryCode + "" + phoneNumber + "&message=" + messageString;
        //console.log(url);
        request(url, function (error, response, body) {
            let res = {};
            if (typeof body != 'undefined' && body.indexOf('Status=0') > -1) {
                res['status'] = 1;
                res['message'] = "Message sent";
            } else {
                res['status'] = 0;
                res['message'] = "Message not sent";
            }
            if (error)
                callback(error, false);
            callback(false, res);
        });
    };

    this.sendSmsSinfini = async function (messageString, countryCode, phoneNumber, callback) {

        messageString = encodeURI(messageString);

        let redisValdomesticSmsMode = await cacheWrapper.getSmsMode('domestic_sms_mode');
        let domesticSmsMode = Number(redisValdomesticSmsMode);

        if (domesticSmsMode === 2) {
            let response = await this.sendtextLocalSMS(messageString, countryCode, phoneNumber, "MYTONY");
            callback(false, response);
            return;
        }

        //var url = "http://api-alerts.solutionsinfini.com/v3/?method=sms&api_key=A85da7898dc8bd4d79fdd62cd6f5cc4ec&to=" + countryCode + "" + phoneNumber + "&sender=BLUFLK&format=json&message=" + messageString;
        let url = "http://api-alerts.solutionsinfini.com/v3/?method=sms&api_key=A9113d0c40f299b66cdf5cf654bfc61b8&to=" + countryCode + "" + phoneNumber + "&sender=MYTONY&format=json&message=" + messageString;
        //console.log(url);
        //global.logger.write('debug', url, {}, {});
        this.logInfo({},`sendSmsSinfini debug url %j`,{url});
        request(url, function (error, response, body) {
            let foo = JSON.parse(body);

            //console.log('error : ', error);
            //console.log('body : ' , body);
            // global.logger.write('debug', 'error : ' + JSON.stringify(error), {}, {});
            // global.logger.write('debug', 'body : ' + JSON.stringify(body), {}, {});
            logger.info(`SMS Sent To ${phoneNumber}`, { type: 'sms', url, country_code: countryCode, phone_number: phoneNumber, message: messageString, response, body, error });

            let res = {};
            if (typeof foo != 'undefined' && foo.status === 1) {
                res['status'] = 1;
                res['message'] = "Message sent";
            } else {
                res['status'] = 0;
                res['message'] = "Message not sent";
            }
            if (error)
                callback(error, false);
            callback(false, res);
        });
    };

    this.pamSendSmsSinfini = async function (messageString, countryCode, phoneNumber, callback) {

        messageString = encodeURI(messageString);

        let redisValdomesticSmsMode = await cacheWrapper.getSmsMode('domestic_sms_mode');
        let domesticSmsMode = Number(redisValdomesticSmsMode);

        if (domesticSmsMode === 2) {
            let response = await this.sendtextLocalSMS(messageString, countryCode, phoneNumber, "PAMAPP");
            callback(false, response);
            return;
        }

        //var url = "http://api-alerts.solutionsinfini.com/v3/?method=sms&api_key=A85da7898dc8bd4d79fdd62cd6f5cc4ec&to=" + countryCode + "" + phoneNumber + "&sender=BLUFLK&format=json&message=" + messageString;
        let url = "http://api-alerts.solutionsinfini.com/v3/?method=sms&api_key=A9113d0c40f299b66cdf5cf654bfc61b8&to=" + countryCode + "" + phoneNumber + "&sender=PAMAPP&format=json&message=" + messageString;
        //console.log(url);
        //global.logger.write('debug', url, {}, {});
        this.logInfo({},`pamSendSmsSinfini debug url %j`,{url});
        request(url, function (error, response, body) {
            let foo = JSON.parse(body);

            //console.log('error : ', error);
            //console.log('body : ' , body);
            // global.logger.write('debug', 'error : ' + JSON.stringify(error), {}, {});
            // global.logger.write('debug', 'body : ' + JSON.stringify(body), {}, {});
            logger.info(`SMS Sent To ${phoneNumber}`, { type: 'sms', url, country_code: countryCode, phone_number: phoneNumber, message: messageString, response, body, error });

            let res = {};
            if (typeof foo != 'undefined' && foo.status === 1) {
                res['status'] = 1;
                res['message'] = "Message sent";
            } else {
                res['status'] = 0;
                res['message'] = "Message not sent";
            }
            if (error)
                callback(error, false);
            callback(false, res);
        });
    };

    //Handling the Sender ID
    this.sendSmsSinfiniV1 = async function (messageString, countryCode, phoneNumber, senderId, callback) {

        messageString = encodeURI(messageString);
        let redisValdomesticSmsMode = await cacheWrapper.getSmsMode('domestic_sms_mode');
        let domesticSmsMode = Number(redisValdomesticSmsMode);

        if (domesticSmsMode === 2) {
            let response = await this.sendtextLocalSMS(messageString, countryCode, phoneNumber, senderId);
            callback(false, response);
            return;
        }

        let url = "http://api-alerts.solutionsinfini.com/v3/?method=sms&api_key=A9113d0c40f299b66cdf5cf654bfc61b8&to=" + countryCode + "" + phoneNumber + "&sender="+senderId+"&format=json&message=" + messageString;
        //console.log(url);
        //global.logger.write('debug', url, {}, {});
        this.logInfo({},`sendSmsSinfiniV1 debug url %j`,{url});
        request(url, function (error, response, body) {
            let foo = JSON.parse(body);

            //console.log('error : ', error);
            //console.log('body : ' , body);
            // global.logger.write('debug', 'error : ' + JSON.stringify(error), {}, {});
            // global.logger.write('debug', 'body : ' + JSON.stringify(body), {}, {});
            logger.info(`SMS Sent To ${phoneNumber}`, { type: 'sms', url, country_code: countryCode, phone_number: phoneNumber, message: messageString, response, body, error });

            let res = {};
            if (typeof foo != 'undefined' && foo.status === 1) {
                res['status'] = 1;
                res['message'] = "Message sent";
            } else {
                res['status'] = 0;
                res['message'] = "Message not sent";
            }
            if (error)
                callback(error, false);
            callback(false, res);
        });
    };
    
    this.sendSmsHorizon = function (messageString, countryCode, phoneNumber, callback) {
        //        console.log("inside sendSmsMvaayoo");
        messageString = encodeURI(messageString);
        let url = "http://smshorizon.co.in/api/sendsms.php?user=GreneRobotics&apikey=oLm0MhRHBt2KPXFRrk8k&mobile="+countryCode+""+phoneNumber+"&message="+messageString+"&senderid=WDDESK&type=txt";
        //global.logger.write('conLog', 'URL: ' + url, {}, {});
        this.logInfo({},`sendSmsHorizon conLog URL %j`,{URL : url});
        request(url, function (error, response, body) {
            //global.logger.write('debug', 'SMS HORIZON RESP:: ' + body, {}, {});
            this.logInfo({},`sendSmsHorizon debug SMS HORIZON RESP::  %j`,{body});
            let res = {};            
            if (typeof body == 'string' && Number(body) > 0) {
                res['status'] = 1;
                res['message'] = "Message sent";
            } else {
                res['status'] = 0;
                res['message'] = "Message not sent";
            }
            if (error)
                callback(error, false);
            callback(false, res);
        });
    };

    this.sendInternationalTwilioSMS = function (messageString, countryCode, phoneNumber, callback) {
        let accountSid = global.config.twilioAccountSid; // Your Account SID from www.twilio.com/console
        let authToken = global.config.twilioAuthToken; // Your Auth Token from www.twilio.com/console
        let client = new twilio.RestClient(accountSid, authToken);
        client.messages.create({
            body: messageString,
            to: '+' + countryCode + '' + phoneNumber, // Text this number
            from: '+1 810-637-5928' // From a valid Twilio number
        }, function (err, message) {
            let res = {};
            if (typeof message != 'undefined' && message.sid != '') {
                res['status'] = 1;
                res['message'] = "Message sent";
            } else {
                res['status'] = 0;
                res['message'] = "Message not sent";
            }
            //console.log(res);
            //global.logger.write('debug', res, {}, request);
            this.logInfo(request,`sendInternationalTwilioSMS debug  %j`,{res, request});
            if (err) {
                //console.log('err : ', err);
                //global.logger.write('debug', err, {}, request);
                this.logError(request,`sendInternationalTwilioSMS debug Error %j`, { err, request });
                callback(err, false);
            } else {
                callback(false, res);
            }
        });
    };

    this.sendInternationalNexmoSMS = function (messageString, countryCode, phoneNumber, callback) {
        const nexmo = new Nexmo({
            apiKey: global.config.nexmoAPIKey,
            apiSecret: global.config.nexmoSecretKey
        });

        const from = 'DESKER';
        const to = '+' + countryCode + phoneNumber;
        const text = messageString;

        //console.log('To : ', to);
        //console.log('Text : ', text);

        //global.logger.write('conLog', 'To : ' + to, {}, request);
        this.logInfo(request,`sendInternationalNexmoSMS conLog To : %j`,{To : to, request});
        //global.logger.write('conLog', 'Text : ' + text, {}, request);
        this.logInfo(request,`sendInternationalNexmoSMS conLog Text : %j`,{Text : text, request});

        nexmo.message.sendSms(from, to, text, (error, response) => {
            if (error) {
                //global.logger.write('debug', error, {}, request);
                this.logError(request,`nexmo.message.sendSms debug Error %j`, { error, request });
                throw error;
            } else if (response.messages[0].status != '0') {
                //console.error(response);
                //global.logger.write('debug', response, {}, request);
                this.logInfo(request,`nexmo.message.sendSms conLog  %j`,{response, request});
                throw 'Nexmo returned back a non-zero status';
            } else {
                //console.log(response);
                //global.logger.write('debug', response, {}, request);
                this.logInfo(request,`nexmo.message.sendSms conLog %j`,{response, request});
            }
        });
    };

    this.sendtextLocalSMS = async function (messageString, countryCode, phoneNumber, senderId) {

        let url = 'https://api.textlocal.in/send/';

        let qs = {
            apikey: 'NTg2ODM3MzA0NTUwMzc0ZjY4MzE3OTUwNzk3MTM2NTM=',
            numbers: countryCode + '' + phoneNumber,
            sender: senderId,
            message: messageString
        };

        let response = await new Promise((resolve) => {
            request({
                url,
                qs
            }, (err, response, body) => {
                if (err) {
                    console.log("\x1b[31m[localText]\x1b[0m Error: ", err);
                    resolve();
                } else {
                    let parsedBody = JSON.parse(body);
                    console.log("\x1b[32m[localText]\x1b[0m response statusCode: ", response.statusCode);
                    console.log("\x1b[32m[localText]\x1b[0m parsedBody: ", parsedBody);
                    console.log("\x1b[32m[localText]\x1b[0m parsedBody.status: ", parsedBody.status);
                    resolve(response);
                }
            });
        });

        return response;
    };


    this.getPhoneNumbers = function (request, callback) {
        let accountSid = global.config.accountSid;
        let authToken = global.config.authToken;

        let client = new twilio.RestClient(accountSid, authToken);

        let country = request.country;
        //var areaCode = request.area_code;
        //console.log(country,'/n', areaCode);

        client.availablePhoneNumbers(country).local.list({
            //areaCode: areaCode
        }, function (err, data) {
            (data.available_phone_numbers.length > 0) ? callback(false, data, 200): callback(false, [], 200);
        });
    }

    this.purchaseNumber = function (request, callback) {
        let accountSid = global.config.accountSid;
        let authToken = global.config.authToken;
        
        let client = new twilio.RestClient(accountSid, authToken);

        let phoneNumber = request.phone_number;

        client.incomingPhoneNumbers.create({
            phoneNumber: phoneNumber
        }, function (err, purchasedNumber) {
            (err) ? callback(false, err.message, -3401): callback(false, purchasedNumber, 200);
        });
    }

    this.MakeCallTwilio = function (text, passcode, countryCode, phoneNumber, callback) {
        let accountSid = global.config.twilioAccountSid; // Your Account SID from www.twilio.com/console
        let authToken = global.config.twilioAuthToken; // Your Auth Token from www.twilio.com/console
        const client = require('twilio')(accountSid, authToken);
        let toNumber = '+' + countryCode + phoneNumber;

        let xmlText = "<?xml version='1.0' encoding='UTF-8'?>";
        xmlText += "<Response>"
        xmlText += "<Say voice='alice'>" + text + "</Say>"
        xmlText += "</Response>"

        //console.log('xmlText : ' + xmlText);
        //console.log(global.config.mobileBaseUrl + global.config.version + '/account/voice_'+passcode);

        //global.logger.write('conLog', 'xmlText : ' + xmlText, {}, request);
        this.logInfo(request,`MakeCallTwilio conLog xmlText : %j`,{xmlText : xmlText, request});
        //global.logger.write('conLog', global.config.mobileBaseUrl + global.config.version + '/account/voice_' + passcode, {}, request);
        this.logInfo(request,`MakeCallTwilio conLog  %j`,{global_config_mobileBaseUrl : global.config.mobileBaseUrl + global.config.version + '/account/voice_' + passcode, request});

        fs.writeFile(global.config.efsPath + 'twiliovoicesxmlfiles/voice_' + passcode + '.xml', xmlText, function (err) {
            if (err) {
                throw err;
            } else {
                client.calls.create({
                        url: global.config.mobileBaseUrl + global.config.version + '/account/voice_' + passcode,
                        to: toNumber,
                        from: '+1 810-637-5928' // From a valid Twilio number                  
                    },
                    (err, call) => {
                        (err) ? callback(false, err.message, -3401): callback(false, call, 200);
                    }
                );
            }
        });
    };

    this.sendSMS = function (messageString, countryCode, phoneNumber, callback) {
        if (countryCode == 91) {
            let domestic_sms_mode = global.config.domestic_sms_mode;
            if (domestic_sms_mode == 1) {
                this.sendSmsMvaayoo(messageString, countryCode, phoneNumber, function (err, res) {
                    callback(err, res);
                });
            } else if (domestic_sms_mode == 2) {
                this.sendSmsBulk(messageString, countryCode, phoneNumber, function (err, res) {
                    callback(err, res);
                });
            } else if (domestic_sms_mode == 3) {
                this.sendSmsSinfini(messageString, countryCode, phoneNumber, function (err, res) {
                    callback(err, res);
                });
            }
        } else {
            this.sendInternationalSMS(messageString, countryCode, phoneNumber, function (err, res) {
                callback(err, res);
            });
        }
    };

    this.makeCallNexmo = function (messageString, passcode, countryCode, phoneNumber, callback) {
        const nexmo = new Nexmo({
            apiKey: global.config.nexmoAPIKey,
            apiSecret: global.config.nexmoSecretKey,
            applicationId: global.config.nexmpAppliationId,
            privateKey: `${__dirname}/private.key`
        });

        let jsonText = '[{ "action": "talk", "voiceName": "Russell","text":"';
        jsonText += messageString;
        jsonText += '"}]';

        //console.log('jsonText : ' + jsonText);
        //global.logger.write('conLog', 'jsonText : ' + jsonText, {}, {});
        this.logInfo(request,`makeCallNexmo conLog jsonText : %j`,{jsonText : jsonText});
        let answerUrl = global.config.mobileBaseUrl + global.config.version + '/account/nexmo/voice_' + passcode + '.json?file=voice_' + passcode + '.json';
        //console.log('Answer Url : ', answerUrl);
        //global.logger.write('conLog', 'Answer Url : ' + answerUrl, {}, {});
        this.logInfo(request,`makeCallNexmo conLog Answer Url : %j`,{Answer_Url : answerUrl});
        fs.writeFile(global.config.efsPath + 'nexmovoicesjsonfiles/voice_' + passcode + '.json', jsonText, function (err) {
            if (err) {
                throw err;
            } else {
                nexmo.calls.create({
                    from: {
                        type: 'phone',
                        number: 123456789
                    },
                    to: [{
                        type: 'phone',
                        number: countryCode + "" + phoneNumber,
                    }],
                    answer_url: [answerUrl]
                }, (error, response) => {
                    if (error) {
                        console.error(error)
                        callback(true, error, -3502);
                    } else {
                        //console.log('makeCallNexmo response: ', response);
                        //global.logger.write('debug', 'makeCallNexmo response: ' + JSON.stringify(response), {}, request);
                        this.logInfo(request,`fs.writeFile debug makeCallNexmo response: %j`,{response : JSON.stringify(response), request});
                        callback(false, response, 200);
                    }
                });
            }
        });
    };

    // No EFS in Mumbai region, so no shared file system between the two servers. Therefore, using s3 for storing
    // and retrieving the JSON files
    this.makeCallNexmoV1 = async function (messageString, passcode, countryCode, phoneNumber, callback) {
        const nexmo = new Nexmo({
            apiKey: global.config.nexmoAPIKey,
            apiSecret: global.config.nexmoSecretKey,
            applicationId: global.config.nexmpAppliationId,
            privateKey: `${__dirname}/private.key`
        });
        const jsonText = [{
            action: "talk",
            voiceName: "Russell",
            text: messageString
        }];

        //global.logger.write('conLog', 'jsonText : ' + jsonText, {}, {});
        this.logInfo(request,`makeCallNexmoV1 conLog jsonText : %j`,{jsonText : jsonText});
        // let answerUrl = 'http://f0ef1a18.ngrok.io/r1' + '/account/nexmo/v1/voice_' + passcode + '.json?file=voice_' + passcode + '.json';
        let answerUrl = global.config.mobileBaseUrl + global.config.version + '/account/nexmo/v1/voice_' + passcode + '.json?file=voice_' + passcode + '.json';
        //global.logger.write('conLog', 'Answer Url : ' + answerUrl, {}, {});
        this.logInfo(request,`makeCallNexmoV1 conLog Answer Url : %j`,{Answer_Url : jsonText});

        await uploadJsonToS3({}, jsonText, 'nexmo', `voice_${passcode}`);

        nexmo.calls.create({
            from: {
                type: 'phone',
                number: 123456789
            },
            to: [{
                type: 'phone',
                number: countryCode + "" + phoneNumber,
            }],
            answer_url: [answerUrl]
        }, (error, response) => {
            if (error) {
                console.error(error)
                callback(true, error, -3502);
            } else {
                //console.log('makeCallNexmo response: ', response);
                //global.logger.write('debug', 'makeCallNexmo response: ' + JSON.stringify(response), {}, request);
                this.logInfo(request,`nexmo.calls.create debug makeCallNexmo response: %j`,{response : JSON.stringify(response), request});
                callback(false, response, 200);
            }
        });
        callback(false, "response Ben", 200);
    };
    async function uploadJsonToS3(request, jsonObject, folderName, jsonFileName) {
        const s3 = new AWS.S3();
        const uploadParams = {
            Body: JSON.stringify(jsonObject),
            Bucket: "worlddesk-passcode-voice",
            Key: `${folderName}/${jsonFileName}.json`,
            ContentType: 'application/json',
            ACL: 'public-read'
        };
        const s3UploadPromise = s3.putObject(uploadParams).promise();
        await s3UploadPromise
            .then(function (data) {
                console.log('uploadJsonToS3 | Success | data: ', data);
            }).catch(function (err) {
                console.log('uploadJsonToS3 | Error | err: ', err);
            });
    }

    async function uploadJsonToS3V1(request, jsonObject, folderName, jsonFileName) {
        const s3 = new AWS.S3();
        const bucketName = await this.getDynamicBucketName();
        const uploadParams = {
            Body: JSON.stringify(jsonObject),
            Bucket: bucketName,
            Key: `${folderName}/${jsonFileName}.json`,
            ContentType: 'application/json',
            ACL: 'public-read'
        };
        const s3UploadPromise = s3.putObject(uploadParams).promise();
        await s3UploadPromise
            .then(function (data) {
                console.log('uploadJsonToS3 | Success | data: ', data);
            }).catch(function (err) {
                console.log('uploadJsonToS3 | Error | err: ', err);
            });
    }

    this.getDynamicBucketName = async function(){
        let responseData = []
        let curDate = new Date();
        let paramsArr = new Array(
            curDate.getMonth()+1,
            curDate.getFullYear()
        );
        
        let queryString = this.getQueryString('ds_v1_common_aws_s3_bucket_master_select_month_year', paramsArr);
            if (queryString != '') {
                await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data[0].bucket_name;
                    
                })
                .catch((err) => {
                   
                })            
            }  
            return responseData;
    }

    this.decodeSpecialChars = function (string) {
        if (typeof string === 'string') {
            string = string.replace(";sqt;", "'");
            string = htmlEntities(string);
            return string;
        } else {
            return "";
        }

    };

    let htmlEntities = function (str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    this.getCurrentUTCTime = function (format) {
        let now = moment().utc().format(format || "YYYY-MM-DD HH:mm:ss");
        return now;
    };


    this.getCurrentISTTime = function () {
        let now = moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss");
        return now;
    };

    this.getOTPHeartBeatCode = function () {
        let now = moment().tz('Asia/Kolkata').format("DDHHmm");
        return now;
    };

    this.getCurrentDate = function () {
        let now = moment().utc().format("YYYY-MM-DD");
        return now;
    };

    this.getCurrentMonth = function () {
        let now = moment().utc().format("MM");
        return now;
    };

    this.getCurrentYear = function () {
        let now = moment().utc().format("YYYY");
        return now;
    };

    this.getCurrentUTCTimestamp = function () {
        let now = moment().utc().valueOf();
        return now;
    };

    this.getStartDayOfMonth = function () {
        let value = moment().startOf('month').format("YYYY-MM-DD");
        return value;
    };

    this.getStartDayOfPrevMonth = function () {
        let value = moment().startOf('month').subtract(1, 'month').format("YYYY-MM-DD");
        return value;
    };

    this.getStartDayOfWeek = function () {
        let value = moment().startOf('week').add(1, 'days').format("YYYY-MM-DD");
        return value;
    };

    this.getStartDateTimeOfWeek = function () {
        let value = moment().startOf('week').add(1, 'days').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.getEndDayOfWeek = function () {
        let value = moment().endOf('week').format("YYYY-MM-DD");
        return value;
    };

    this.substractMinutes = function (datetime, minutes) {
       // console.log("substractMinutes datetime :: "+datetime +" "+minutes);
       /* if(Number(minutes) < 0){
            minutes = Number(minutes) * -1;
        } */
       // console.log("substractMinutes datetime :: "+datetime +" "+minutes);
        let value = moment(datetime).subtract(minutes, 'minutes').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.addMinutes = function (datetime, minutes) {
         let value = moment(datetime).add(minutes, 'minutes').format("YYYY-MM-DD HH:mm:ss");
         return value;
     };

    this.getDayOfWeek = function (datetime) {
        let arr = new Array();
        arr.push("SUNDAY");
        arr.push("MONDAY");
        arr.push("TUESDAY");
        arr.push("WEDNESDAY");
        arr.push("THURSDAY");
        arr.push("FRIDAY");
        arr.push("SATURDAY");
        let value = arr[moment(datetime).weekday()];
        return value;
    };

    this.getEndDateTimeOfWeek = function () {
        let value = moment().endOf('week').add(1, 'days').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.getStartDayOfPrevWeek = function () {
        let value = moment().startOf('week').add(1, 'days').subtract(7, 'days').format("YYYY-MM-DD");
        return value;
    };

    this.getStartDateTimeOfMonth = function () {
        let value = moment().startOf('month').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.getEndDateTimeOfMonth = function () {
        let value = moment().endOf('month').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };
    this.getEndDateOfMonth = function () {
        var value = moment().endOf('month').format("YYYY-MM-DD");
        return value;
    };

    this.getcurrentTime = function () {
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth();
        let dateVal = date.getDate();
        let hours = date.getHours();
        let min = date.getMinutes();
        let sec = date.getSeconds();
        let dateTimeString = year + "-" + month + "-" + dateVal + " " + hours + ":" + min + ":" + sec;
        return dateTimeString;
    };

    this.getcurrentTimeInMilliSecs = function () {
        let date = new Date();
        let year = date.getFullYear();

        let month = date.getMonth();
        month++;
        month = (month < 10 ? '0' : '') + month;

        let dateVal = date.getDate();
        let hours = date.getHours();
        let min = date.getMinutes();
        let sec = date.getSeconds();
        let ms = date.getMilliseconds();
        let dateTimeString = year + month + dateVal + "-" + hours + min + sec + ms;
        return dateTimeString;
    };

    // this.getQueryString = function (callName, paramsArr) {
    //     var queryString = "CALL " + callName + "(";
    //     paramsArr.forEach(function (item, index) {
    //         if (typeof item === 'string' || item instanceof String)
    //             item = item.replace(/'/g, "\\'") // escaping single quote                   
    //             .replace(/\"/g, '\\"') // escaping \" from UI
    //             .replace(/\n/g, '\\n');
    //         if (index === (paramsArr.length - 1))
    //             queryString = queryString + "'" + item + "'";
    //         else
    //             queryString = queryString + "'" + item + "',";
    //     }, this);
    //     queryString = queryString + ");";
    //     return queryString;

    // };

    this.getQueryString = function (callName, paramsArr) {
        let queryString = '',
            preparedQueryString;
        if (paramsArr.length > 0) {
            // if (callName === 'ds_v1_activity_list_insert_pam') {
            //     console.log("ds_v1_activity_list_insert_pam | paramsArr | Length: ", paramsArr.length);
            //     console.log("ds_v1_activity_list_insert_pam | paramsArr: ", paramsArr);
            // }
            queryString = `CALL ?? (${new Array(paramsArr.length).fill('?').join(', ')});`;
            // console.log("queryString: ", queryString);
            // console.log("paramsArr: ", paramsArr);
            preparedQueryString = mysql.format(queryString, [String(callName)].concat(paramsArr));
            // console.log("preparedQueryString: ", preparedQueryString);
            return preparedQueryString;
        } else {
            return '';
        }
    }

    this.getRandomInt = function () {
        /*
         var min = 100000;
         var max = 999999;
         return Math.floor(Math.random() * (max - min)) + min;
         */
        return Math.floor(Math.random() * (999999 - 100000)) + 100000;
    };

    this.getVerificationCode = function () {
        //var min = 1000;
        //var max = 9999;
        return Math.floor(Math.random() * (999999 - 100000)) + 100000;
    };

    this.getMessageUniqueId = function (assetId) {
        let messageUniqueId = assetId + this.getCurrentUTCTimestamp() + this.getRandomInt();
        return messageUniqueId;
    };

    this.replaceDefaultNumber = function (value) {
        if (value === undefined || value === null || value === '' || isNaN(value))
            return Number(-1);
        else
            return Number(value);
    };

    this.replaceZero = function (value) {
        if (value === undefined || value === null || value === '') {
            //console.log('inside null / undefined case of replaceZero')
            return Number(0);
        } else {
            let retValue = Number(value);
            if (isNaN(retValue)) {
                return 0;
            } else {
                return retValue;
            }
        }

    };

    this.replaceOne = function (value) {
        if (value === undefined || value === null || value === '' || value === 0 || value === '0')
            return Number(1);
        else
            return Number(value);
    };

    this.replaceQueryLimit = function (value) {
        if (isNaN(Number(value)) === true || Number(value) === 0 || Number(value) > 50)
            return 50;
        else
            return Number(value);
    };

    this.replaceDefaultString = function (value) {
        if (value === undefined || value === null || value === '')
            return '';
        else
            return value;
    };

    this.replaceDefaultJSON = function (value) {
        if (value === undefined || value === null || value === '')
            return '{}';
        else
            return value;
    };

    this.replaceDefaultDatetime = function (value) {
        if (value === undefined || value === null || value === '' || value === '1970-01-01' || value === '1970-01-01 00:00:00')
            return "1970-01-01 00:00:00";
        else
            return this.getFormatedLogDatetime(value);
    };

    this.replaceDefaultDate = function (value) {
        if (value === undefined || value === null || value === '' || value === '1970-01-01' || value === '1970-01-01 00:00:00')
            return '1970-01-01';
        else
            return this.getFormatedLogDate(value);
    };

    this.replaceDefaultAssetUrl = function (value) {
        if (value === undefined || value === null || value === '')
            return "http://blueflock.com/blueflock_images/Personal.png";
        else
            return (value);
    };

    this.getFormatedLogDatetime = function (timeString) {
        let value = moment(timeString).format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.getFormatedLogDatetimeV1 = function (timeString, format) {
        let value = moment(timeString, format).format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.getFormatedLogDate = function (timeString) {
        let value = moment(timeString).format("YYYY-MM-DD");
        return value;
    };

    this.getFormatedSlashDate = function (timeString) {
        let value = moment(timeString).format("DD/MM/YYYY");
        return value;
    };

    this.getFormatedLogTime = function (timeString) {
        let value = moment(timeString).format("HH:mm:ss");
        return value;
    };

    this.getFormatedLogYear = function (timeString) {
        let value = moment(timeString).format("YYYY");
        return value;
    };

    this.getFormatedLogMonth = function (timeString) {
        let value = moment(timeString).format("MM");
        return value;
    };

    this.getTimestamp = function (timeString) {
        let value = moment(timeString).valueOf();
        return value;
    };

    this.getDatetimewithAmPm = function (timeString) {
        let value = moment(timeString).format("YYYY-MM-DD hh:mm A");
        return value;
    };

    this.getDatewithndrdth = function (timeString) {
        let value = moment(timeString).format("MMM Do");
        return value;
    };

    this.addDays = function (timeString, days) {
        let value = moment(timeString, "YYYY-MM-DD HH:mm:ss").add(days, 'days').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.addDaysToGivenDate = function (timeString, days, dateFormat = "YYYY-MM-DD") {
        let value = moment(timeString, dateFormat).add(days, 'days').format("YYYY-MM-DD");
        return value;
    };

    this.addUnitsToDateTime = function (timeString, days, unit) {
        let value = moment(timeString, "YYYY-MM-DD HH:mm:ss").add(days, unit).format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.addUnitsToDateTimeV1 = function (timeString, format, days, unit) {
        const value = moment(timeString, format).add(days, unit).format(format);
        return value;
    };

    this.subtractDays = function (timeString, days) {
        let value = moment(timeString, "YYYY-MM-DD HH:mm:ss").subtract(days, 'days').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.subtractUnitsFromDateTime = function (timeString, days, unit) {
        let value = moment(timeString, "YYYY-MM-DD HH:mm:ss").subtract(days, unit).format("YYYY-MM-DD HH:mm:ss");
        return value;
    };
    
    this.subtractUnitsFromDateTimeV1 = function (timeString, format, days, unit) {
        let value = moment(timeString, format).subtract(days, unit).format(format);
        return value;
    };

    this.differenceDatetimes = function (timeString1, timeString2) {
        let value = moment(timeString1, "YYYY-MM-DD HH:mm:ss").diff(moment(timeString2, "YYYY-MM-DD HH:mm:ss"));
        return value;
    };

    this.differenceDatetime = function (timeString1, timeString2) {
        let value = moment(timeString1, "YYYY-MM-DD HH:mm:ss").diff(moment(timeString2, "YYYY-MM-DD HH:mm:ss"));
        return moment.duration(value)._data;
    };
    this.differenceDatetimeInMin = function (timeString1, timeString2) {
        console.log('came in')
        let value = moment(timeString1, "YYYY-MM-DD HH:mm:ss").diff(moment(timeString2, "YYYY-MM-DD HH:mm:ss"),'minutes');
        // let sss = moment.utc(value).format('mm');
        return value;
    };
   

    /*this.getNoOfDays = function (timeString1, timeString2) {
        var value = moment(timeString1, "YYYY-MM-DD HH:mm:ss").diff(moment(timeString2, "YYYY-MM-DD HH:mm:ss"), 'days');
        return value;
    };*/

    this.getDayStartDatetime = function () {
        let value = moment().startOf('day').utcOffset("-05:30").format('YYYY-MM-DD HH:mm:ss');
        return value;
    };

    this.getDayEndDatetime = function () {
        let value = moment().endOf('day').utcOffset("-05:30").format('YYYY-MM-DD HH:mm:ss');
        return value;
    };

    /*this.getGivenDayStartDatetime = function(timeString) {
        var value = moment(timeString, "YYYY-MM-DD HH:mm:ss").format('YYYY-MM-DD 00:00:00');
        return value;
    };
    
    this.getGivenDayEndDatetime = function(timeString) {
        var value = moment(timeString, "YYYY-MM-DD HH:mm:ss").format('YYYY-MM-DD 23:59:59');
        return value;
    };*/

    this.getCurrentTimeHHmmIST = function () {
        let value = moment().tz('Asia/Kolkata').format('hh:mm A');
        return value;
    };

    this.getCurrentTimeHHmmIST_ = function () {
        let value = moment().tz('Asia/Kolkata').format('HH:mm');
        return value;
    };    

    this.reminingTimeOfTheDay = function(startTime, endTime, currentTime){
        let self = this;
        let startTimeTemp = startTime, endTimeTemp = endTime, currentTimeTemp = currentTime;

        // console.log("startTime :: "+startTime);
        // console.log("endTime :: "+endTime);
        // console.log("currentTime :: "+currentTime);


        let startTimeT = self.getCustomTimeHHmm(startTime);
        let endTimeT = self.getCustomTimeHHmm(endTime);
        let currentTimeT = self.getCustomTimeHHmm(currentTime);

        // console.log("startTime1 :: "+startTime);
        // console.log("endTime1 :: "+endTime);
        // console.log("currentTime1 :: "+currentTime);

        let startTimeT1 = Number(startTimeT[0]+startTimeT[1]);
        let endTimeT1 = Number(endTimeT[0]+endTimeT[1]);
        let currentTimeT1 = Number(currentTimeT[0]+currentTimeT[1]);

        // console.log("startTime2 :: "+startTimeT1);
        // console.log("endTime2 :: "+endTimeT1);
        // console.log("currentTime2 :: "+currentTimeT1);

        if(currentTimeT1 < endTimeT1 && currentTimeT1 < startTimeT1){
            //console.log("reminingTimeOfTheDay :: 1")
            return self.getDiffAMPM(startTimeTemp, endTimeTemp);
        }else if(currentTimeT1 < endTimeT1 && currentTimeT1 >= startTimeT1){
            //console.log("reminingTimeOfTheDay :: 2")
            return self.getDiffAMPM(currentTimeTemp, endTimeTemp);
        }else if(currentTimeT1 > endTimeT1 && currentTimeT1 >= startTimeT1){
            //console.log("reminingTimeOfTheDay :: 3")
            return 0;
        }

    }

    this.getCustomTimeHHmm = function (time) {
        //console.log("time :: ",time);
        if(time.indexOf("PM") >= 0){
            time=time.split(" ")[0];
            time= time.split(":");
            time[0]=Number(time[0])+12;
            //console.log("time[0] "+time[0]);
        }else if(time.indexOf("AM") >= 0){
            time=time.split(" ")[0];
            time= time.split(":");
            //console.log("time[0] "+time[0]);
        }
        return time;
    };  

    this.getCustomTimeHHmmNumber = function (time) {
        //console.log("time :: ",time);
        if(time.indexOf("PM") >= 0){
            time=time.split(" ")[0];
            time= time.split(":");
            time[0]=Number(time[0])+12;
            //console.log("time[0] "+time[0]);
        }else if(time.indexOf("AM") >= 0){
            time=time.split(" ")[0];
            time= time.split(":");
            //console.log("time[0] "+time[0]);
        }
        time = time.join("");
        return time;
    };      

    this.getCustomTimeHHmm24Hr = function (time) {
        logger.info("time :: "+time);
        if(time.indexOf("PM") >= 0){
            time=time.split(" ")[0];
            time= time.split(":");
            time[0]=Number(time[0])+12;
            //console.log("time[0] "+time[0]);
        }else if(time.indexOf("AM") >= 0){
            time=time.split(" ")[0];
            time= time.split(":");
            //console.log("time[0] "+time[0]);
        }
        time = time.join(":")+":00";
        return time;
    }; 
    this.getDiffAMPM = function (startTime, endTime) {

        let self = this;
        let startTimeT = self.getCustomTimeHHmm(startTime);
        let endTimeT = self.getCustomTimeHHmm(endTime);

       // console.log(Number(endTime[0]) +" : "+Number(startTime[0]));
        let diff = (Number(endTimeT[0]) - Number(startTimeT[0])) * 60;
        //console.log("diff in minutes: "+diff);
        if(Number(startTimeT[1]) > Number(endTimeT[1]))
            diff = diff - (Number(startTimeT[1]) - Number(endTimeT[1]));
        else if(Number(startTimeT[1]) < Number(endTimeT[1]))
             diff = diff + (Number(endTimeT[1]) - Number(startTimeT[1]));

        //console.log("diff in minutes inculding minutes part : "+diff);
        return diff;
    };

    this.getDueDate = function(minutes, businessDays, businessHours){

    }

    this.getDayStartDatetimeIST = function () {
        let value = moment().tz('Asia/Kolkata').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        return value;
    };

    this.getDayEndDatetimeIST = function () {
        let value = moment().tz('Asia/Kolkata').endOf('day').format('YYYY-MM-DD HH:mm:ss');
        return value;
    };

    //getDay start time based on the TimeZone
    this.getDayStartDatetimeTZ = function (timezone) {
        (timezone === "") ? timezone = 'Asia/Kolkata': timezone = timezone;
        let input = moment().tz(timezone).startOf('day');
        let format = 'YYYY-MM-DD HH:mm:ss';
        let value = moment.tz(input, format, timezone).utc().format('YYYY-MM-DD HH:mm:ss');
        //console.log('TimeZone : ', timezone);
        //console.log('Start DateTime in given timezone: ', value);        
        return value;
    };

    //getDay end time based on the TimeZone
    this.getDayEndDatetimeTZ = function (timezone) {
        (timezone === "") ? timezone = 'Asia/Kolkata': timezone = timezone;
        let input = moment().tz(timezone).endOf('day');
        let format = 'YYYY-MM-DD HH:mm:ss';
        let value = moment.tz(input, format, timezone).utc().format('YYYY-MM-DD HH:mm:ss');
        //console.log('TimeZone : ', timezone);
        //console.log('End DateTime in given timezone: ', value);
        return value;
    };

    this.isDateBetween = function (startDt, endDt, compareDt) {
        let compareDate = moment(compareDt, "YYYY-MM-DD HH:mm:ss");
        let startDate = moment(startDt, "YYYY-MM-DD HH:mm:ss");
        let endDate = moment(endDt, "YYYY-MM-DD HH:mm:ss");

        let value = compareDate.isBetween(startDate, endDate);
        return value;
    };

    this.getUniqueValuesOfArray = function (arr) {
        return Array.from(new Set(arr));
    }

    this.getMinValueOfArray = function (arr) {
        return Math.min(arr);
    }

    this.getMaxValueOfArray = function (arr) {
        return Math.max(arr);
    }

    this.getFrequency = function (element, arr) {
        let cnt = 0;
        arr.forEach(function (item, index) {
            if (element == item) {
                cnt++;
            }
        })
        return cnt;
    }

    this.cleanPhoneNumber = function (phone) {

        if (typeof phone === 'string') {
            phone.replace(" ", "");
            phone.replace("-", "");
            phone.replace("+", "");
        }
        return Number(phone);
    };

    this.ucfirst = function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    this.replaceDefaultProjectImage = function (value) {
        if (value === undefined || value === null || value === '')
            return "http://blueflock.com/blueflock_images/Project.png";
        else
            return value;
    };

    this.replaceDefaultActivityImage = function (value) {
        if (value === undefined || value === null || value === '')
            return "http://blueflock.com/blueflock_images/Personal.png";
        else
            return value;
    };

    this.getImageUrlForSizeM = function (stringUrl, size) {
        let a = stringUrl.substr(0, stringUrl.lastIndexOf("."));
        let b = a.slice(-1);
        if (b === '_') {
            let d = new Date();
            return stringUrl.substr(0, stringUrl.lastIndexOf("_") + 1) + size + stringUrl.substr(stringUrl.lastIndexOf(".")) + "?" + d.getTime();
        } else {
            return stringUrl.substr(0, stringUrl.lastIndexOf(".")) + '_' + size + stringUrl.substr(stringUrl.lastIndexOf("."));
        }
    };

    this.getAssetDetails = async function (request) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id || 0,
            request.workforce_id || 0,
            request.asset_id
        );
        let responseData = [], error = true;

        let queryString = this.getQueryString('ds_v1_1_asset_list_select', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];

    };
    this.sendEmail = function (email, subject, text, htmlTemplate, callback) {
        let smtpConfig = {
            host: global.config.smtp_host,
            port: global.config.smtp_port,
            secure: false, // use SSL
            auth: {
                user: global.config.smtp_user,
                pass: global.config.smtp_pass
            }
        };
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport(smtpConfig);

        // setup e-mail data with unicode symbols
        let mailOptions = {
            from: 'BlueFlock <' + global.config.smtp_user + '>', // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            text: text, // plaintext body
            html: htmlTemplate // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                logger.error(`Error Sending Email Sent To ${email}`, { type: 'email', email_options: mailOptions, response: info, error });
                callback(true, error);
            } else {
                logger.info(`Email Sent To ${email}`, { type: 'email', email_options: mailOptions, response: info, error });
                // console.log('Message sent: ' + info.response);
                // global.logger.write('debug', 'Message sent: ' + JSON.stringify(info.response), {}, request);
                callback(false, info);
            }
        });
        return;
    };

    this.sendEmailV1 = function (request, email, subject, text, htmlTemplate, callback) {
        let smtpConfig = {
            host: global.config.smtp_host,
            port: global.config.smtp_port,
            secure: false, // use SSL
            auth: {
                user: global.config.smtp_user,
                pass: global.config.smtp_pass
            }
        };
        htmlTemplate = request.html_template
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport(smtpConfig);

        // setup e-mail data with unicode symbols
        let mailOptions = {
            from: 'Vodafon - Idea <' + global.config.smtp_user + '>', // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            text: text, // plaintext body
            html: htmlTemplate, // html body,

        };

        if (request.hasOwnProperty('attachment_url')) {
            mailOptions.attachments = [{
                // use URL as an attachment
                filename: request.attachment_name, // 'service_request_form.pdf',
                path: request.attachment_url
            }]
        }

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                logger.error(`Error Sending Email Sent To ${email}`, { type: 'email', request_body: request, email_options: mailOptions, response: info, error });
                callback(true, error);
            } else {
                logger.info(`Email Sent To ${email}`, { type: 'email', request_body: request, email_options: mailOptions, response: info, error });
                // console.log('Message sent: ' + info.response);
                // global.logger.write('debug', 'Message sent: ' + info.response, {}, request);
                callback(false, info);
            }
        });
        return;
    };

    // 
    this.sendEmailV2 = function (request, email, subject, text, htmlTemplate, callback) {
        const msg = {
            to: email,
            from: request.email_sender, // 'Vodafone - Idea <vodafone_idea@grenerobotics.com>'
            subject: subject,
            text: text,
            html: htmlTemplate,
        };
        // console.log("msg: ", msg);

        sgMail.send(msg)
            .then((sendGridResponse) => {
                return callback(false, sendGridResponse);
            })
            .catch((error) => {
                return callback(true, error);
            });
    };

    // SendInBlue
    this.sendEmailV3 = async function (request, email, subject, text, htmlTemplate, callback) {
        console.log('email : ', email);
        console.log('subject : ', subject);
        console.log('text : ', text);

        let emailProvider = 1;
        try {
            emailProvider = await cacheWrapper.getEmailProvider();
        } catch (error) {
            console.log("Error fetching the app_config:emailProvider: ", error);
        }

        let emailMode = await cacheWrapper.getSmsMode('email_mode');

        console.log("emailProvider", emailProvider);
        if (Number(emailMode) === 2 || request.sendRegularEmail == 1) {
            try {
                const responseBody = await sendEmailMailgunV1(
                    request, email, subject,
                    text, htmlTemplate,
                    htmlTemplateEncoding = "html"
                );
                logger.info(`Email Sent To ${email}`, { type: 'email', request_body: request, response: responseBody, error: null });
                return callback(false, responseBody);
            } catch (error) {
                console.log("Error: ", error)
                logger.error(`Error Sending Email Sent To ${email}`, { type: 'email', request_body: request, error });
                return callback(error, []);

            }
        }

        // SendSmtpEmail | Values to send a transactional email
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{
            "name": request.email_receiver_name || undefined,
            "email": email
        }];
        sendSmtpEmail.sender = {
            "name": request.email_sender_name || undefined,
            "email": request.email_sender
        };
        sendSmtpEmail.textContent = text;
        sendSmtpEmail.htmlContent = htmlTemplate;
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.headers = {
            "x-mailin-custom": "Grene Robotics"
        };
        sendSmtpEmail.tags = ["test"];
        //sendSmtpEmail.attachment = [{
        //     "url": "https://i.imgur.com/Pf7zKgl.jpg"
        //}];

        if (
            request.hasOwnProperty("attachment") &&
            request.attachment !== null
        ) {
            sendSmtpEmail.attachment = [{
                "url": request.attachment
            }];
        }

        if (
            request.hasOwnProperty("bot_operation_email_attachment") &&
            request.bot_operation_email_attachment.length > 0
        ) {
            sendSmtpEmail.attachment = request.bot_operation_email_attachment;
        }

        apiInstance.sendTransacEmail(sendSmtpEmail)
            .then(function (data) {
                logger.info(`Email Sent To ${email}: %j`, data, { type: 'email', request_body: request, response: data, error: null });
                // console.log('API called successfully. Returned data: ', data);
                return callback(false, data);
            }, function (error) {
                logger.error(`Error Sending Email Sent To ${email}`, { type: 'email', request_body: request, error });
                return callback(true, error);
            });
    };

    async function sendEmailMailgunV1(request, email, subject, text, htmlTemplate, htmlTemplateEncoding = "html") {
        console.log("htmlTemplateEncoding: ", htmlTemplateEncoding);
        if (htmlTemplateEncoding === "base64") {
            let buff = new Buffer(htmlTemplate, 'base64');
            htmlTemplate = buff.toString('ascii');
        }

        const mailOptions = {
            from: `${request.email_sender_name} <${request.email_sender}>`,
            to: `${request.email_receiver_name} <${email}>`,
            // cc: 'baz@example.com',
            // bcc: 'bar@example.com',
            subject: subject,
            // text: 'Testing some Mailgun awesomness!',
            html: htmlTemplate,
            // attachment: filepath
        };

        if (
            request.hasOwnProperty("bcc_email_receiver") &&
            request.bcc_email_receiver !== ''
        ) {
            mailOptions.cc = request.bcc_email_receiver;
        }

        if (
            request.hasOwnProperty("attachment") &&
            request.attachment !== null
        ) {
            mailOptions.attachment = new mailgun.Attachment({
                data: request.attachment,
                filename: path.basename(request.attachment)
            });
        }

        if (
            request.hasOwnProperty("bot_operation_email_attachment") &&
            request.bot_operation_email_attachment.length > 0
        ) {
            let attachments = [];
            // attachments = request.bot_operation_email_attachment;
            mailOptions.attachment = attachments.map(attachment => {
                return mailgun.Attachment({
                    data: Buffer.from(attachment.content, 'base64'),
                    filename: attachment.name
                });
            });
        }

        return new Promise((resolve, reject) => {
            mailgun
                .messages()
                .send(mailOptions, function (error, body) {
                    if (error) {
                        reject(error);
                    }
                    resolve(body);
                });
        });
    }

    this.sendEmailMailgunV2=async (request, email, subject, filepath, htmlTemplate, htmlTemplateEncoding = "html",descrip) => {
        console.log("htmlTemplateEncoding: ", htmlTemplateEncoding);
        if (request.flag == 0) {
            let buff = new Buffer.from(htmlTemplate, 'base64');
            htmlTemplate = buff.toString('ascii');
            // console.log(htmlTemplate)
        }

        const mailOptions = {
            from: `${request.email_sender_name} <${request.email_sender}>`,
            to: `${request.email_receiver_name} <${email}>`,
            // cc: 'baz@example.com',
            // bcc: 'bar@example.com',
            subject: subject,
            text: descrip,
            html: htmlTemplate,
            attachment: filepath
        };
        if(filepath==''){
            delete mailOptions.attachment
        }

            // let attachments = [];
            // // attachments = request.bot_operation_email_attachment;
            // mailOptions.attachment = attachments.map(attachment => {
            //     return mailgun.Attachment({
            //         data: Buffer.from(attachment.content, 'base64'),
            //         filename: attachment.name
            //     });
            // });
        

        return new Promise((resolve, reject) => {
            mailgun
                .messages()
                .send(mailOptions, function (error, body) {
                    if (error) {
                        reject(error);
                    }
                    console.log('succesfully sent to mailgun')
                    resolve(body);
                   if(filepath==''){
                       return
                   }
                    fs.unlink(filepath,function(err){
                        if(err) return console.log(err);
                        console.log('file deleted successfully');
                   }); 
                
                });
        });
    }

    // SendInBlue, htmlTemplate is sent as base64 encoded
    this.sendEmailV4 = async function (request, email, subject, text, base64EncodedHtmlTemplate, callback) {
        console.log('email : ', email);
        console.log('subject : ', subject);
        console.log('text : ', text);

        let [err1, assetDetails] = await this.getAssetDetails(request);

        let organisationFlagOutlook = assetDetails.length ? assetDetails[0].organization_flag_email_integration_enabled : 0;
        console.log("organisationFlagOutlook", organisationFlagOutlook);

        if(organisationFlagOutlook) {
        
            let [err, res] = await this.sendEmailV4ews(request, email, subject, text, base64EncodedHtmlTemplate);
            return callback(err, res);
        }

        let emailProvider = 0;
        try {
            emailProvider = await cacheWrapper.getEmailProvider();
        } catch (error) {
            console.log("Error fetching the app_config:emailProvider: ", error);
        }

        let emailMode = await cacheWrapper.getSmsMode('email_mode');

        if (Number(emailMode) === 2) {
            try {
                const responseBody = await sendEmailMailgunV1(
                    request, email, subject,
                    text, base64EncodedHtmlTemplate,
                    htmlTemplateEncoding = "base64"
                );
                logger.info(`Email Sent To ${email}`, { type: 'email', request_body: request, response: responseBody, error: null });
                return callback(false, responseBody);
            } catch (error) {
                console.log("Error: ", error)
                logger.error(`Error Sending Email Sent To ${email}`, { type: 'email', request_body: request, error });
                return callback(error, []);

            }
        }

        //let buff = new Buffer(base64EncodedHtmlTemplate, 'base64');
        let buff = new Buffer.from(base64EncodedHtmlTemplate, 'base64');
        let htmlTemplate = buff.toString('ascii');

        // SendSmtpEmail | Values to send a transactional email
        let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{
            "name": request.email_receiver_name || undefined,
            "email": email
        }];
        sendSmtpEmail.sender = {
            "name": request.email_sender_name || undefined,
            "email": request.email_sender
        };
        sendSmtpEmail.textContent = text;
        sendSmtpEmail.htmlContent = htmlTemplate;
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.headers = {
            "x-mailin-custom": "Grene Robotics"
        };
        sendSmtpEmail.tags = ["live"];

        apiInstance.sendTransacEmail(sendSmtpEmail)
            .then(function (data) {
                logger.info(`Email Sent To ${email}`, { type: 'email', request_body: request, response: data, error: null });
                // console.log('API called successfully. Returned data: ', data);
                return callback(false, data);
            }, function (error) {
                logger.error(`Error Sending Email Sent To ${email}`, { type: 'email', request_body: request, error });
                return callback(true, error);
            });
    };

    this.getRedableFormatLogDate = function (timeString, type) {
        if (typeof type == 'undefined' || type == '' || type == null)
            type = 0;

        let value = '';

        if (type == 1) {
            value = moment(timeString).format("YYYY-MM-DD HH:mm");
        } else {
            value = moment(timeString).format("dddd, MMMM Do, YYYY");
        }
        return value;
    };

    this.convertToTimezone = function (timeString, offsetValue) {
        let timeStringNew = moment(timeString).valueOf();
        timeString = (timeStringNew > 0 && Number(offsetValue) != 'NaN') ? Number(timeStringNew) + Number(offsetValue) : timeString;
        let value = moment(timeString).format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.randomInt = function (low, high) {
        return Math.floor(Math.random() * (high - low + 1) + low);
    };

    this.getUniqueArray = function (a) {
        return Array.from(new Set(a));
    };

    this.getWorkFlowUrl = function (url) {
        return url.slice(4);
    };

    this.writeLogs = function (data, isTargeted) {
        let date = this.getCurrentUTCTime();
        let locationInServer;
        let logFilePath;
        let targetedLogFilePath;

        if (global.mode === 'prod') {
            locationInServer = global.config.efsPath + 'api/';
            logFilePath = locationInServer + 'logs/' + ipAddress + '_' + this.getCurrentDate() + '.txt';
            targetedLogFilePath = locationInServer + 'targeted_logs/' + ipAddress + '_' + this.getCurrentDate() + '.txt';
        } else if(global.mode === 'preprod'){
            locationInServer = global.config.efsPath + 'preprod_api/';
            logFilePath = locationInServer + 'logs/' + ipAddress + '_' + this.getCurrentDate() + '.txt';
            // Development and Pre-Production | Not Staging
            targetedLogFilePath = locationInServer + 'targeted_logs/' + ipAddress + '_' + this.getCurrentDate() + '.txt';
        } else {
            locationInServer = global.config.efsPath + 'staging_api/';
            logFilePath = locationInServer + 'logs/' + ipAddress + '_' + this.getCurrentDate() + '.txt';
            // Development and Pre-Production | Not Staging
            targetedLogFilePath = locationInServer + 'targeted_logs/' + ipAddress + '_' + this.getCurrentDate() + '.txt';
        }       
        

        if (typeof data === 'object') {
            // console.log('JSON.stringify(data) : ' + JSON.stringify(data));
            data = JSON.stringify(data);
        }

        let data_to_add = date + ': ' + data;
        console.log(data);
        if (fs.existsSync(logFilePath)) {
            fs.appendFile(logFilePath, os.EOL + data_to_add, function (err, fd) {
                if (err)
                    console.log('Error while writing data to file', err);
            });

        } else {
            fs.writeFile(logFilePath, data_to_add, function (err, fd) {
                if (err)
                    console.log('Error while writing data to file', err);
                fs.chmodSync(logFilePath, '777');
            });
        }

        // Targeted logging
        if (isTargeted === true && (global.mode === 'prod' || global.mode === 'preprod' || global.mode === 'dev')) {
            if (fs.existsSync(targetedLogFilePath)) {
                fs.appendFile(targetedLogFilePath, os.EOL + data_to_add, function (err, fd) {
                    if (err)
                        console.log('Error while writing data to file', err);
                });

            } else {
                fs.writeFile(targetedLogFilePath, data_to_add, function (err, fd) {
                    if (err)
                        console.log('Error while writing data to file', err);
                });
            }
        }
    };

    // [VODAFONE]
    this.getVodafoneFormFieldIdMapping = function () {
        return vodafoneFormFieldIdMapping;
    };

    // [VODAFONE]
    this.getVodafoneRomsCafFieldsData = function () {
        return vodafoneRomsCafFieldsData;
    };
    
    this.sendSmsHorizon = function (messageString, countryCode, phoneNumber, callback) {
 
        messageString = encodeURI(messageString);
        let url = "http://smshorizon.co.in/api/sendsms.php?user=GreneRobotics&apikey=oLm0MhRHBt2KPXFRrk8k&mobile="+countryCode+""+phoneNumber+"&message="+messageString+"&senderid=WDDESK&type=txt";
        //global.logger.write('conLog', 'URL: ' + url, {}, {});
        this.logInfo({},`sendSmsHorizon conLog URL: %j`,{URL : url});
        request(url, function (error, response, body) {
            //global.logger.write('debug', 'SMS HORIZON RESP:: ' + body, {}, {});
            this.logInfo({},`sendSmsHorizon debug SMS HORIZON RESP:: %j`,{ body});
            let res = {};            
            if (typeof body == 'string' && Number(body) > 0) {
                res['status'] = 1;
                res['message'] = "Message sent";
            } else {
                res['status'] = 0;
                res['message'] = "Message not sent";
            }
            if (error)
                callback(error, false);
            callback(false, res);
        });
    };
    

    this.getJSONfromXcel = async (request) => {            
        let s3 = new AWS.S3();

        let url = request.bucket_url;
        // const BucketName = url.slice(8, 25);
        // const KeyName = url.slice(43);      
        let [BucketName,KeyName,FileName]= await new Promise((resolve) => {
            try {
            let urlParts;
            if (url.indexOf('ap-south') > 1) {
            urlParts = url.split('.s3.ap-south-1.amazonaws.com/');
            } else {
            urlParts = url.split('.s3.amazonaws.com/');
            }
            
            let keyParts = urlParts[1].split('/');
            let BucketName = urlParts[0].replace('https://', '');
            let KeyName = urlParts[1];
            let FileName = keyParts[keyParts.length - 1];
            resolve([BucketName, KeyName, FileName]);
            } catch (err) {
            resolve(['', '', '']);
            }
            });
        
        let params =  {
                        Bucket: BucketName, 
                        Key: KeyName
                        };

         let fileName = "";
        // //HANDLE THE PATHS in STAGING and PREPROD AND PRODUCTION
        switch(global.mode) {            
            case 'staging': fileName = '/apistaging-data/';
                            break;
            case 'preprod': fileName = '/data/';
                            break;
            case 'prod': fileName = '/api-data/';
                         break;            
            default: fileName = '/api-data/'; 
                     break;
        }
        
        fileName += 'mpls-aws-'+this.getCurrentUTCTimestamp()+'.xlsx';
     
        let file = require('fs').createWriteStream(fileName);
        s3.getObject(params).createReadStream().pipe(file);

         console.log('HERE I AM ', fileName);

        return await new Promise((resolve, reject)=>{
            setTimeout(() =>{
                const result = excelToJson({sourceFile: fileName});
                //console.log(JSON.stringify(result, null, 4));
                fs.unlink(fileName, ()=>{});
                let modifiedResult = [];
                modifiedResult.push(result.Sheet1[0]);
                for(let i=1;i<result.Sheet1.length;i++){
                  let temp = result.Sheet1[i];
                 if(result.Sheet1[i].H){
                 
                    let d =  new Date(`${result.Sheet1[i].H}`);
                    
                    //temp.H = `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}`;
                    temp.H = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;

                  }
                modifiedResult.push(temp);
                }
                resolve(JSON.stringify(modifiedResult, null, 4));                
            },
            3000
            );
        });        
    };

    this.getJsonFromS3Bucket = async function (request, buketName, folderName, jsonFileName) {
        const s3 = new AWS.S3();
        const getObjectParams = {
            Bucket: buketName,
            Key: `${folderName}/${jsonFileName}`,
        };
        const s3GetObjectPromise = s3.getObject(getObjectParams).promise();

        let error, jsonData = [];

        await s3GetObjectPromise
            .then(function (data) {
                console.log('getJsonFromS3Bucket | Success | data: ', data);
                // Convert Body from a Buffer to a String
                jsonData = data.Body.toString('utf-8'); // Use the encoding necessary
                console.log("objectData: ", jsonData);

            }).catch(function (err) {
                console.log('getJsonFromS3Bucket | Error | err: ', err);
                error = err;
            });
        
        return [error, jsonData];
    }

    this.widgetFieldsStatusesData = function () {
        return widgetFieldsStatusesData;
    };

    this.getXlsxWorkbookFromS3Url = async function (request, S3Url) {
        const s3 = new AWS.S3();
        let [bucketName,keyName,fileName]= await new Promise((resolve) => {
            try {
            let urlParts;
            if (S3Url.indexOf('ap-south') > 1) {
            urlParts = S3Url.split('.s3.ap-south-1.amazonaws.com/');
            } else {
            urlParts = S3Url.split('.s3.amazonaws.com/');
            }
            
            let keyParts = urlParts[1].split('/');
            let BucketName = urlParts[0].replace('https://', '');
            let KeyName = urlParts[1];
            let FileName = keyParts[keyParts.length - 1];
            resolve([BucketName, KeyName, FileName]);
            } catch (err) {
            resolve(['', '', '']);
            }
            });
        // const bucketName = S3Url.slice(8, 25);
        // const keyName = S3Url.slice(43);
        // let bucketName = S3Url.slice(8, 25);
        // let keyName = S3Url.slice(43);

        // if (S3Url.includes('ap-south-1')) {
        //     keyName = S3Url.slice(54);
        // }

        // if (S3Url.includes('staging') || S3Url.includes('preprod')) {
        //     bucketName = S3Url.slice(8, 33);
        //     keyName = S3Url.slice(51);

        //     if (S3Url.includes('ap-south-1')) {
        //         keyName = S3Url.slice(62);
        //     }
        // }

        const getObjectParams = {
            Bucket: bucketName,
            Key: keyName,
        };
        const s3GetObjectPromise = s3.getObject(getObjectParams).promise();
        // const s3GetObjectPromise = s3.getObject(getObjectParams).createReadStream().pipe();

        let error, workbook;

        await s3GetObjectPromise
            .then(function (data) {
                console.log('getXlsxWorkbookFromS3Url | Success | data: ', data);
                // Convert Body from a Buffer to a String
                // console.log(Object.keys(data))
                // for (const property of Object.keys(data)) {
                //     console.log(`property ${property}: `, data[property], "type: ", typeof data[property])
                // }

                workbook = XLSX.read(data.Body, {
                    type: "buffer"
                });
                const sheet_names = workbook.SheetNames;
                console.log("sheet_names: ", sheet_names)

            }).catch(function (err) {
                console.log('getXlsxWorkbookFromS3Url | Error | err: ', err);
                error = err;
            });

        return [error, workbook];
    };

    this.getXlsxDataBodyFromS3Url = async function (request, S3Url) {
        const s3 = new AWS.S3();

        // const bucketName = S3Url.slice(8, 25);
        // const keyName = S3Url.slice(43);
        let [bucketName,keyName,fileName]= await new Promise((resolve) => {
            try {
            let urlParts;
            if (S3Url.indexOf('ap-south') > 1) {
            urlParts = S3Url.split('.s3.ap-south-1.amazonaws.com/');
            } else {
            urlParts = S3Url.split('.s3.amazonaws.com/');
            }
            
            let keyParts = urlParts[1].split('/');
            let BucketName = urlParts[0].replace('https://', '');
            let KeyName = urlParts[1];
            let FileName = keyParts[keyParts.length - 1];
            resolve([BucketName, KeyName, FileName]);
            } catch (err) {
            resolve(['', '', '']);
            }
            });

        const getObjectParams = {
            Bucket: bucketName,
            Key: keyName,
        };
        const s3GetObjectPromise = s3.getObject(getObjectParams).promise();
        // const s3GetObjectPromise = s3.getObject(getObjectParams).createReadStream().pipe();

        let error, dataBody;

        await s3GetObjectPromise
            .then(function (data) {
                // console.log('getXlsxWorkbookFromS3Url | Success | data: ', data);
                
                dataBody = data.Body;

            }).catch(function (err) {
                console.log('getXlsxWorkbookFromS3Url | Error | err: ', err);
                error = err;
            });

        return [error, dataBody];
    };

    this.getFileDataFromS3Url = async function (request, S3Url) {
        const s3 = new AWS.S3();

        let [bucketName,keyName,fileName]= await new Promise((resolve) => {
            try {
            let urlParts;
            if (S3Url.indexOf('ap-south') > 1) {
            urlParts = S3Url.split('.s3.ap-south-1.amazonaws.com/');
            } else {
            urlParts = S3Url.split('.s3.amazonaws.com/');
            }
            
            let keyParts = urlParts[1].split('/');
            let BucketName = urlParts[0].replace('https://', '');
            let KeyName = urlParts[1];
            let FileName = keyParts[keyParts.length - 1];
            resolve([BucketName, KeyName, FileName]);
            } catch (err) {
            resolve(['', '', '']);
            }
            });

        const getObjectParams = {
            Bucket: bucketName,
            Key: keyName,
        };
        const s3GetObjectPromise = s3.getObject(getObjectParams).promise();

        let error, fileData;

        await s3GetObjectPromise
            .then(function (data) {
                logger.verbose(`s3GetObjectPromise | Data Fetched: %j`, data, { type: 'aws_s3', s3_url: S3Url, bucket: bucketName, key: keyName, data, request_body: request, error: null });

                fileData = data;

            }).catch(function (err) {
                error = err;
                logger.verbose(`s3GetObjectPromise | Data Fetch Error `, { type: 'aws_s3', s3_url: S3Url, bucket: bucketName, key: keyName, request_body: request, error });
            });

        return [error, fileData];
    };

    this.downloadS3Object = async (request, url) => {
        console.log("came here",url)
        return new Promise(async (resolve) => {
            let s3 = new AWS.S3();
            console.log('URL : ', url);

            let [BucketName,KeyName,FileName]= await new Promise((resolve) => {
                try {
                let urlParts;
                if (url.indexOf('ap-south') > 1) {
                urlParts = url.split('.s3.ap-south-1.amazonaws.com/');
                } else {
                urlParts = url.split('.s3.amazonaws.com/');
                }
                console.log("url parts",urlParts)
                let keyParts = urlParts[1].split('/');
                let BucketName = urlParts[0].replace('https://', '');
                let KeyName = urlParts[1];
                let FileName = keyParts[keyParts.length - 1];
                resolve([BucketName, KeyName, FileName]);
                } catch (err) {
                resolve(['', '', '']);
                }
                });

            console.log('BucketName : ', BucketName);
            console.log('KeyName : ', KeyName);

            console.log('FILENAME : ', FileName);

            let params = {
                Bucket: BucketName,
                Key: KeyName
            };

            let filePath = global.config.efsPath;
            let myFile = fs.createWriteStream(filePath + FileName);
            
            let fileStream = s3.getObject(params).createReadStream();
            fileStream.pipe(myFile);
            resolve(FileName);
        });
    };

    this.uploadS3Object = async (request, zipFile) => {
        return new Promise(async (resolve)=>{
            let filePath= global.config.efsPath; 
            let environment = global.mode;
            
            let bucketName = await this.getDynamicBucketName();
           
            // if (environment === 'prod') {

            //     bucketName = "worlddesk-" + this.getCurrentYear() + '-' + this.getCurrentMonth();

            // } else {
            //     bucketName = "worlddesk-" + environment + "-" + this.getCurrentYear() + '-' + this.getCurrentMonth();
            // }

            let prefixPath = request.organization_id + '/' + 
                             request.account_id + '/' + 
                             request.workforce_id + '/' + 
                             request.asset_id + '/' + 
                             this.getCurrentYear() + '/' + this.getCurrentMonth() + '/103' + '/' + this.getMessageUniqueId(request.asset_id);
            console.log(bucketName);
            console.log(prefixPath);

            let s3 = new AWS.S3();
            let params = {
                Body: fs.createReadStream(filePath + zipFile),
                Bucket: bucketName,
                Key: prefixPath + "/" + zipFile,
                ContentType: 'application/zip',
                //ContentEncoding: 'base64',
                //ACL: 'public-read'
            };

            //console.log(params.Body);
    
            console.log('Uploading to S3...');

            s3.putObject(params, async (err, data) =>{
                    console.log('ERROR', err);
                    console.log(data);
                   
                    resolve(`https://${bucketName}.s3.ap-south-1.amazonaws.com/${params.Key}`);
                });
            });
    };    

    this.uploadS3ObjectV1 = async (request, zipFile) => {
        return new Promise(async (resolve)=>{
            let filePath= global.config.efsPath; 
            let environment = global.mode;
            
            let bucketName = await this.getDynamicBucketName();
           

            let prefixPath = request.organization_id + '/' + 
                             request.account_id + '/' + 
                             request.workforce_id + '/' + 
                             request.asset_id + '/' + 
                             this.getCurrentYear() + '/' + this.getCurrentMonth() + '/103' + '/' + this.getMessageUniqueId(request.asset_id);
            console.log(bucketName);
            console.log(prefixPath);

            let s3 = new AWS.S3();
            let params = {
                Body: fs.createReadStream(filePath + zipFile),
                Bucket: bucketName,
                Key: prefixPath + "/" + zipFile,
                ContentType: 'application/zip',
                //ContentEncoding: 'base64',
                //ACL: 'public-read'
            };

            //console.log(params.Body);
    
            console.log('Uploading to S3...');

            s3.putObject(params, async (err, data) =>{
                    console.log('ERROR', err);
                    console.log(data);
                   
                    resolve(`https://${bucketName}.s3.ap-south-1.amazonaws.com/${params.Key}`);
                });
            });
    };    

    this.uploadReadableStreamToS3 = async (request, options, stream) => {
        const s3 = new AWS.S3();
        console.log('Uploading to S3...');
        return s3.upload(options).promise().catch((error) => {
            logger.error(`uploadReadableStreamToS3 | Data Upload Error: `, { type: 'aws_s3', options, request_body: request, error });
        });
    };

    this.zipTheFiles = async (request, files) =>{
        return new Promise((resolve)=>{
            
            let zipFile = 'download_' + this.getMessageUniqueId(request.asset_id) + '.zip';
            let filePath = global.config.efsPath;
            let output = fs.createWriteStream(filePath + zipFile);
            let archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });
            
            output.on('close', function() {
                console.log(archive.pointer() + ' total bytes');
                console.log('archiver has been finalized and the output file descriptor has closed.');  
                
                resolve(zipFile);
            });
            
            output.on('end', function() {
                console.log('Data has been drained');
            });
            
            archive.on('warning', function(err) {
                if (err.code === 'ENOENT') {
                    // log warning
                } else {
                    // throw error
                    throw err;
                }
            });
            
            // good practice to catch this error explicitly
            archive.on('error', function(err) {
                throw err;
            });
            
            archive.pipe(output);
            
            for(let i=0;i < files.length; i++) {                
                archive.append(fs.createReadStream(filePath + files[i]), { name: files[i] });
            }           

            archive.finalize();              
            //resolve();
        });
    };

    this.getS3BucketName = async function (request) {
        const environment = global.mode;
        let bucketName = '';
        if (environment === 'prod') {
            bucketName = "worlddesk-" + this.getCurrentYear() + '-' + this.getCurrentMonth();

        } else if (environment === 'staging' || environment === 'local' || environment === 'demo') {
            bucketName = "worlddesk-staging-" + this.getCurrentYear() + '-' + this.getCurrentMonth();

        } else {

            bucketName = "worlddesk-" + environment + "-" + this.getCurrentYear() + '-' + this.getCurrentMonth();
        }
        
        return bucketName;
    };

    this.getS3BucketNameV1 = async function (request) {
        let bucketName = await this.getDynamicBucketName();   
        return bucketName;
    };

    this.getS3PrefixPath = async function (request) {
        let prefixPath = request.organization_id + '/' +
            request.account_id + '/' +
            request.workforce_id + '/' +
            request.asset_id + '/' +
            this.getCurrentYear() + '/' + this.getCurrentMonth() + '/103' + '/' + this.getMessageUniqueId(request.asset_id);
        
        return prefixPath;
    };

    this.sendCustomPushNotification = async function (request, activityData) {
        let error = false;
        // [CHECK] target_asset_id
        if (
            !request.hasOwnProperty("target_asset_id") ||
            Number(request.target_asset_id) === 0
        ) {
            return [true, {
                message: "Incorrect target asset_id specified."
            }]
        }

        let activityID = Number(request.activity_id) || 0,
            activityTypeID = Number(activityData[0].activity_type_id) || 0,
            activityTypeCategoryID = Number(activityData[0].activity_type_category_id) || 0,
            activityTitle = activityData[0].activity_title || '';

        const assetMapData = await cacheWrapper.getAssetMapPromise(request.target_asset_id);
        const assetPushARN = assetMapData.asset_push_arn;
        const [error1, defaultAssetName] = await this.fetchCompanyDefaultAssetName(request);

        sns.publish({
            description: request.message,
            title: activityTitle,
            subtitle: request.message,
            body: defaultAssetName,
            activity_id: activityID,
            activity_type_category_id: activityTypeCategoryID
        }, 1, assetPushARN);


        if(!request.is_pam){
            pubnubWrapper.publish(request.target_asset_id, {
                type: "activity_unread",
                organization_id: Number(request.organization_id),
                activity_type_category_id: activityTypeCategoryID,
                activity_id: activityID,
                activity_title: activityTitle,
                description: request.message
            });
        }

        return [error, {
            message: `Push sent to ${request.target_asset_id}`
        }];
    }

    this.sendRPACompletionAcknowledgement = async function (request) {
        let error = false;
        // [CHECK] target_asset_id
        if (
            !request.hasOwnProperty("target_asset_id") ||
            Number(request.target_asset_id) === 0
        ) {
            return [true, {
                message: "Incorrect target asset_id specified."
            }]
        }

        const assetMapData = await cacheWrapper.getAssetMapPromise(request.target_asset_id);
        const assetPushARN = assetMapData.asset_push_arn;

        sns.publish({
            // description: request.message,
            // title: activityTitle,
            // subtitle: request.message,
            // body: `TONY`,
            type: "rpa_completion_ack",
            activity_id: request.workflow_activity_id,
            activity_type_category_id: request.activity_type_category_id,
            form_id: request.form_id,
            field_id: request.field_id
        }, 1, assetPushARN, 1);

        pubnubWrapper.publish(request.target_asset_id, {
            type: "rpa_completion_ack",
            organization_id: Number(request.organization_id),
            activity_type_category_id: request.activity_type_category_id,
            workflow_activity_id: request.workflow_activity_id,
            form_id: request.form_id,
            field_id: request.field_id
        });

        return [error, {
            message: `Push sent to ${request.target_asset_id}`
        }];
    };

    this.formatDate = (timeString, formatToTimeString, dateFormat = "YYYY-MM-DD") => {
        const value = moment(timeString, dateFormat).format(formatToTimeString);
        return value;
    };

    this.sendPushToWorkforce = async function(request) {

         let error = false;
        // [CHECK] target_asset_id
        if (
            !request.hasOwnProperty("target_workforce_id") ||
            Number(request.target_workforce_id) === 0
        ) {
            return [true, {
                message: "Incorrect target workforce_id specified."
            }];
        }

        //pubnubWrapper.publish(request.target_workforce_id, {
        //    type: "workforce_push",
        //    organization_id: Number(request.organization_id),
        //    activity_type_category_id: 0,
        //    activity_id: 0,
        //    activity_title: request.push_title,
        //    description: request.push_message,
        //    target_workforce_id:request.target_workforce_id
        //});

        return [error, {
            message: `Push sent to ${request.target_workforce_id}`
        }];
    };

    this.sendPushToAsset = async (request) =>{
        let error = false;
        // [CHECK] target_asset_id
        if (
            !request.hasOwnProperty("target_asset_id") ||
            Number(request.target_asset_id) === 0
        ) {
            logger.error("Incorrect target asset_id specified.");
            return [true, {
                message: "Incorrect target asset_id specified."
            }];
        }
        let  assetPushARN = "";
        if(request.hasOwnProperty("asset_push_arn")){
            assetPushARN = request.asset_push_arn;
        }else{
            const assetMapData = await cacheWrapper.getAssetMapPromise(request.target_asset_id);
            assetPushARN = assetMapData.asset_push_arn;
        }
        
        sns.publish({
            description: request.message,
            title: request.push_title,
            subtitle: request.push_message,
            body: ``,
            activity_id: request.broadcast_id,
            activity_type_category_id: -1      
        }, 1, assetPushARN);
        logger.info("asset push notification ====>")
        logger.info(JSON.stringify({
            description: request.message,
            title: request.push_title,
            subtitle: request.push_message,
            body: ``,
            activity_id: request.broadcast_id,
            activity_type_category_id: -1      
        }, null, 2));
       
        logger.info(`Push sent to ${request.target_asset_id}`);
        return [error, {
            message: `Push sent to ${request.target_asset_id}`
        }];
    };

    this.mentionsDateFormat = async() => {
        //const now = await moment().utc().format("DD-MM-YYYY HH:MM A");
        //const now = await moment().utc().format("DD-MM-YYYY");
        const now = moment().tz('Asia/Kolkata').format("DD-MM-YYYY HH:mm:ss A");
        //const now = moment().utcOffset("+5:30").format("DD-MM-YYYY HH:MM A");        
        return now;
    };

    this.getCurrentISTDDMMYY = function () {
        let now = moment().tz('Asia/Kolkata').format("DDMMYY");
        return now;
    };  
    
    this.sendEmailEWS = async(request, receiverEmailID, emailSubject, Template) => {
        let pwd;
        let ewsConfig;
        if(request.hasOwnProperty('is_version_v1') && request.is_version_v1 === 1) {
            let decrypted = CryptoJS.AES.decrypt(request.email_sender_password.toString() || "", 'lp-n5^+8M@62').toString(CryptoJS.enc.Utf8);
            console.log('decrypted PWD : ', decrypted);

            ewsConfig = {
                username: request.email_sender,
                password: decrypted,
                host: 'https://webmail.vodafoneidea.com'    
            };
        } else {
            pwd = await cacheWrapper.getESMSMailsPwd();
            // console.log('pwd : ', pwd);
            ewsConfig = {
                username: 'ESMSMails@vodafoneidea.com',
                password: pwd, //'Aug@2020',
                host: 'https://webmail.vodafoneidea.com'    
            };
        }

        console.log("ewsConfig", JSON.stringify(ewsConfig));
        // initialize node-ews
        const ews = new EWS(ewsConfig);

        // define ews api function
        const ewsFunction = 'CreateItem';

        // define ews api function args
        const ewsArgs = {
        "attributes" : {
            "MessageDisposition" : "SendAndSaveCopy"
        },
        "SavedItemFolderId": {
            "DistinguishedFolderId": {
            "attributes": {
                "Id": "sentitems"
            }
            }
        },
        "Items" : {
            "Message" : {
            "ItemClass": "IPM.Note",
            "Subject" : emailSubject,
            "Body" : {
                "attributes": {
                //"BodyType" : "Text"
                "BodyType" : "HTML"
                },
                "$value": Template
            },
            "ToRecipients" : {
                "Mailbox" : {
                "EmailAddress" : receiverEmailID
                }
            },
            "IsRead": "false"
            }
        }
        };

        // query ews, print resulting JSON to console
        console.log('Before ews.run : emailSubject -  ', emailSubject);
        //console.log('Before ews.run : Template - ', Template);
        console.log('Before ews.run : receiverEmailID - ', receiverEmailID);
        
        return new Promise((resolve, reject)=>{
            ews.run(ewsFunction, ewsArgs)
            .then(result => {
                console.log('EWS Email - Result : ', JSON.stringify(result));
                resolve(false);
            })
            .catch(err => {            
                console.log('EWS Email - error : ', err.stack);
                console.log('EWS Email - message : ', err.message);
    
                if((err.message).includes('401') && (err.message).includes('Unauthorized')) {
                    console.log('Invalid Password!');
    
                    resolve(true);
                }
            });
        });
        
    };

    /*
    //This is to support ews
    this.sendEmailV4ews = async function (request, email, subject, text, base64EncodedHtmlTemplate, flag=0, organisationFlag=0, senderEmail) {
        let responseData = [],
            error = false;

        //console.log('email : ', email);
        //console.log('subject : ', subject);
        //console.log('text : ', text);

        console.log('FLAG : ', flag, "organisationFlag", organisationFlag);
        let buff;
        let htmlTemplate;
        if(flag === 0 ) {
            buff = new Buffer.from(base64EncodedHtmlTemplate, 'base64');
            htmlTemplate = buff.toString('ascii');
        } else if(flag === 1) {
            htmlTemplate = text;
        }

        if(organisationFlag) {
            request.is_version_v1 = 1;
            let [error, assetDetails] = await this.getAssetDetails(request);

            console.log("assetDetails[0].asset_email_password before decrypt", assetDetails[0].asset_email_password);
            request.email_sender_password_text = assetDetails[0].asset_email_password;
            const err = await this.sendEmailEWS(request, email, subject, htmlTemplate);
            if(err) {
                return [true, 'Invalid Password'];
            } else {
                return [false, 'Success'];
            }
        }

        const pwd = await cacheWrapper.getROMSMailsPwd();
        console.log('Sender Email ID : CentralOmt.In@vodafoneidea.com');
        // console.log('PWD : ', pwd);
        const ewsConfig = {
            //username: 'Poonam.Chavan3@vodafoneidea.com',
            //username: 'COR420930@vodafoneidea.com',
            //username: 'Yasmeen.Sayyed3@vodafoneidea.com',
            //username: 'CentralOmt.In@vodafoneidea.com',
            username: 'COR458207@vodafoneidea.com',
            password: pwd, //'Jul@2020',
            host: 'https://webmail.vodafoneidea.com'
        };

        console.log("ewsConfig", JSON.stringify(ewsConfig));
        // initialize node-ews
        const ews = new EWS(ewsConfig);

        // define ews api function
        const ewsFunction = 'CreateItem';

        // define ews api function args
        const ewsArgs = {
        "attributes" : {
            "MessageDisposition" : "SendAndSaveCopy"
        },
        "SavedItemFolderId": {
            "DistinguishedFolderId": {
            "attributes": {
                "Id": "sentitems"
            }
            }
        },
        "Items" : {
            "Message" : {
            "ItemClass": "IPM.Note",
            "Subject" : subject,
            "Body" : {
                "attributes": {
                //"BodyType" : "Text"
                "BodyType" : "HTML"
                },
                "$value": htmlTemplate
            },
            "ToRecipients" : {
                "Mailbox" : {
                "EmailAddress" : email
                }
            },
            "IsRead": "false"
            }
        }
        };

        // query ews, print resulting JSON to console
        console.log('Before ews.run : emailSubject -  ', subject);
        //console.log('Before ews.run : Template - ', htmlTemplate);
        console.log('Before ews.run : receiverEmailID - ', email);


        //get flag from redis cache
        let ews_mail = JSON.stringify({"email" : email});
        let ews_function = ewsFunction;
        let ews_request = JSON.stringify(request);
        let ews_mail_error = null;
        let log_asset_id = request.asset_id;
        let isSendEmail = true;
        cacheWrapper.getKeyValueFromCache('ews_mail_send_enabled')
        .then(ewsMailSendEnabledFlag => {
            console.log("ewsMailSendEnabledFlag = " + ewsMailSendEnabledFlag);
            if(ewsMailSendEnabledFlag == 1|| ewsMailSendEnabledFlag == null) {
                console.log("ewsMailSendEnabledFlag = 1 :  send email and also insert into ews_mail_transaction table");
                if(ewsMailSendEnabledFlag === null) {
                    ews_mail_error = JSON.stringify({"error" : "flag not available in cache"});
                }
            } else if(ewsMailSendEnabledFlag == 2) {
                console.log("ewsMailSendEnabledFlag = 2 :  only insert into ews_mail_transaction table");
                isSendEmail = false;
                this.insertEwsEmailTransactions (ews_mail, ews_function, ewsMailSendEnabledFlag, ews_request, ews_mail_error, log_asset_id);
            } else if(ewsMailSendEnabledFlag == 0) {
                console.log("ewsMailSendEnabledFlag = 0 : only send email");
            }
            console.log("isSendEmail " + isSendEmail);
            if(isSendEmail) {
                ews.run(ewsFunction, ewsArgs)
                .then(result => {
                    console.log('EWS Email - Result : ', JSON.stringify(result));
                    if(ewsMailSendEnabledFlag == 1 || ewsMailSendEnabledFlag == null) {
                        this.insertEwsEmailTransactions (ews_mail, ews_function, ewsMailSendEnabledFlag, ews_request, ews_mail_error, log_asset_id);
                    }
                })
                .catch(err => {
                    console.log('EWS Email - error : ', err.stack);
                    ews_mail_error = JSON.stringify({"error" : err.stack});
                    this.insertEwsEmailTransactions (ews_mail, ews_function, ewsMailSendEnabledFlag, ews_request, ews_mail_error, log_asset_id);
                });
            }
        })
        .catch(err => {
            console.log('cachewrapper : getKeyValueFromCache  - error : ', err);
        });

        return [error, responseData];
    };
    */

    //This is to support ews
    this.sendEmailV4ews = async function (request, email, subject, text, base64EncodedHtmlTemplate, flag = 0, organisationFlag = 0, senderEmail, attachment = "") {
        logger.info("sendEmailV4ews=>");
        let responseData = [],
            error = false;

        try {
            //console.log('email : ', email);
            //console.log('subject : ', subject);
            //console.log('text : ', text);

            console.log('FLAG : ', flag, "organisationFlag", organisationFlag);
            let buff;
            let htmlTemplate;
            if (flag === 0) {
                buff = new Buffer.from(base64EncodedHtmlTemplate, 'base64');
                htmlTemplate = buff.toString('ascii');
            } else if (flag === 1) {
                htmlTemplate = text;
            }

            if (organisationFlag) {
                request.is_version_v1 = 1;
                let [error, assetDetails] = await this.getAssetDetails(request);

                console.log("assetDetails[0].asset_email_password before decrypt", assetDetails[0].asset_email_password);
                request.email_sender_password_text = assetDetails[0].asset_email_password;
                const err = await this.sendEmailEWS(request, email, subject, htmlTemplate);
                if (err) {
                    return [true, 'Invalid Password'];
                } else {
                    return [false, 'Success'];
                }
            }

            let ewsPassword = await cacheWrapper.getKeyValueFromCache('omt.in1@vodafoneidea.com');
            let emailSQSQueueUrl = global.config.emailSQSQueueUrl;
            let emailMessageBody = {
                "ewsEmail": "CentralOmt.In@vodafoneidea.com",
                "ewsUsername": 'COR458207',
                "ewsPassword": ewsPassword,
                "ewsDomain": "inroot",
                "ewsEndpoint": "https://webmail.vodafoneidea.com/ews/exchange.asmx",
                "ewsMailReceiver": email,
                "ewsMailSubject": subject,
                "ewsMailBody": htmlTemplate,
                "ewsMailAttachment": attachment
            };
            logger.info(JSON.stringify(emailMessageBody));
            let sqsMessage = {
                MessageBody: JSON.stringify(emailMessageBody),
                QueueUrl: emailSQSQueueUrl,
                MessageAttributes: {
                    "Environment": {
                        DataType: "String",
                        StringValue: 'staging'
                    },
                }
            };
            logger.info(JSON.stringify(sqsMessage));
            sqs.sendMessage(sqsMessage, (err, data) => {
                if (err) {
                    logger.error("Error sending email job to SQS queue => ");
                    logger.error(err);
                    responseData = { errormsg: err };
                    error = true;
                    //logger.error("Error sending email job to SQS queue", { type: 'ews-engine-mail', error: serializeError(err), request_body: emailMessageBody });
                } else {
                    error = false;
                    responseData = { errormsg: "Successfully sent email to " + email };
                    logger.info("Successfully sent email job to SQS queue: %j", data, { type: 'ews-engine-mail', request_body: emailMessageBody });
                }
            });
        } catch (err) {
            console.log(err);
            logger.error("sendEmailV4ews : Error " + err);
            error = true;
        }
        return [error, responseData];
    };

    this.sendEmailV4ewsV1 = async function (request, emails, subject, body, attachment, emailProviderDetails, base64EncodedHtmlTemplate = '') {
        let responseData = [];
        let error = false;
        let htmlTemplate = "";
        try {
            let ewsPassword = await cacheWrapper.getKeyValueFromCache('omt.in1@vodafoneidea.com');
            let emailSQSQueueUrl = global.config.emailSQSQueueUrl;
            htmlTemplate = body;
            if (request.flag == 0) {
                buff = new Buffer.from(base64EncodedHtmlTemplate, 'base64');
                htmlTemplate = buff.toString('ascii');
                // console.log('html temp',htmlTemplate)
            } else {
                htmlTemplate = body;
            }
            if (request.get_email_pasword == 1) {
                let [error1, assetDetails] = await this.getAssetDetails({ ...request, asset_id: request.email_sender_asset_id });
                console.log("assetDetails[0].asset_email_password before decrypt", assetDetails[0].asset_email_password);
                let email_sender_password_text = assetDetails[0].asset_email_password;
                let decrypted = CryptoJS.AES.decrypt(email_sender_password_text.toString() || "", 'lp-n5^+8M@62').toString(CryptoJS.enc.Utf8);
                console.log('decrypted PWD : ', decrypted);
                emailProviderDetails.email = assetDetails[0].asset_email_id;
                emailProviderDetails.username = assetDetails[0].operating_asset_username
                emailProviderDetails.password = decrypted;
            }
            // console.log('fg',emailProviderDetails)
            let ewsConfig = {
                "ewsEmail": emailProviderDetails.email || "CentralOmt.In@vodafoneidea.com",
                "ewsUsername": emailProviderDetails.username || "COR458207",
                "ewsPassword": emailProviderDetails.password || ewsPassword,
                "ewsDomain": "inroot",
                "ewsEndpoint": "https://webmail.vodafoneidea.com/ews/exchange.asmx",
                "ewsMailReceiver": emails,
                "ewsMailReceiverCc": [],
                "ewsMailReceiverBcc": [],
                "ewsMailSubject": subject,
                "ewsMailBody": htmlTemplate,
                "ewsMailAttachment": attachment
            }

            if (emailProviderDetails.hasOwnProperty("email") && emailProviderDetails.email === "vibs.selfcaresupport@vodafoneidea.com") {
                emailSQSQueueUrl = global.config.smpEmailSQSQueueUrl;
            }

            console.log(JSON.stringify(ewsConfig))
            let sqsMessage = {
                MessageBody: JSON.stringify(ewsConfig),
                QueueUrl: emailSQSQueueUrl,
                MessageAttributes: {
                    "Environment": {
                        DataType: "String",
                        StringValue: 'staging'
                    },
                }
            };
            logger.info(JSON.stringify(sqsMessage));
            sqs.sendMessage(sqsMessage, (err, data) => {
                if (err) {
                    logger.error("Error sending email job to SQS queue => ");
                    logger.error(err);
                    responseData = { errormsg: err };
                    error = true;
                    //logger.error("Error sending email job to SQS queue", { type: 'ews-engine-mail', error: serializeError(err), request_body: emailMessageBody });
                } else {
                    error = false;
                    responseData = { errormsg: "Successfully sent email to " };
                    logger.info("Successfully sent email job to SQS queue: %j", data, { type: 'ews-engine-mail', request_body: ewsConfig });
                }
            });
        }
        catch (err) {

        }

    }

    this.insertEwsEmailTransactions = async function(ews_mail, ews_function, ews_email_sent_enabled, ews_request, ews_mail_error, log_asset_id) {
        console.log("insertEwsEmailTransactions: ");
        // console.log("ews_mail = " + ews_mail);
        // console.log("ews_function = " + ews_function);
        // console.log("ews_request = " + ews_request);
        // console.log("ews_mail_error = " + ews_mail_error);
        // console.log("log_asset_id = " + log_asset_id);

        let error = false,
            responseData = [];
    
        try {
            let paramsArr = new Array(
                ews_mail,
                ews_function,
                ews_email_sent_enabled || 0,
                ews_request,
                ews_mail_error,
                log_asset_id,
                this.getCurrentUTCTime()
            );
            let queryString = this.getQueryString(
                "ds_v1_ews_mail_transaction_insert",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        console.log("insertEwsEmailTransactions : query : Error " + error);
                    });
            }
        } catch (err) {
            console.log("insertEwsEmailTransactions : Error " + err);
        }
    
        return [error, responseData];
    }

    //Uploading XLSB file 
    //Added by Akshay Singh
    this.uploadExcelFileToS3 = async function(request,filePath){
        let error = false;
        let resposneData = [];

        try{
            const s3 = new AWS.S3();
            const readStream = fs.createReadStream(filePath);
            let fileKey = "xlsb/excel-"+this.getcurrentTimeInMilliSecs()+".xlsb";
            const params = {
              Bucket: await this.getS3BucketName(request),
              Key: fileKey,
              Body: readStream
            };
          
            let response = await s3.upload(params).promise();
            let data = {};
            data.location = response.Location;
            data.fileKey = fileKey;
            resposneData.push(data);
            return [error,resposneData];
        }catch(e)
        {
            return[e,resposneData];
        }
    }

    this.uploadExcelFileToS3V1 = async function(request,filePath){
        let error = false;
        let resposneData = [];

        try{
            const s3 = new AWS.S3();
            const readStream = fs.createReadStream(filePath);
            let fileKey = "xlsb/excel-"+this.getcurrentTimeInMilliSecs()+".xlsb";
            const params = {
              Bucket: await this.getDynamicBucketName(),
              Key: fileKey,
              Body: readStream
            };
          
            let response = await s3.upload(params).promise();
            let data = {};
            data.location = response.Location;
            data.fileKey = fileKey;
            resposneData.push(data);
            return [error,resposneData];
        }catch(e)
        {
            return[e,resposneData];
        }
    }

    //Uploading XLSXfile PAM
    this.uploadExcelFileToS3V2 = async function(request, filePath){
        let error = false;
        let resposneData = [];
        try{
            const s3 = new AWS.S3();
            const readStream = fs.createReadStream(filePath);
            let fileKey = "xlsx/excel-"+this.getcurrentTimeInMilliSecs()+".xlsx";
            const params = {
            Bucket: await this.getDynamicBucketName(),
            Key: fileKey,
            Body:JSON.stringify(readStream)
            };
            // console.log(params,"params");

            let response = await s3.upload(params).promise();
            let data = {};
            data.location = response.Location;
            data.fileKey = fileKey;
            resposneData.push(data);
            return [error,resposneData];
        }catch(e)
        {
            return[e,resposneData];
        }
    }

    this.uploadICSFileToS3V1 = async function(request,filePath){
        let error = false;
        let resposneData = [];

        try{
            const s3 = new AWS.S3();
            const readStream = fs.createReadStream(filePath);
            let fileKey = "ics/event-"+this.getcurrentTimeInMilliSecs()+".ics";
            let bucket_name = await this.getDynamicBucketName();      
            const params = {
              Bucket: bucket_name,
              Key: fileKey,
              Body: readStream
            };
            let response = await s3.upload(params).promise();
            let data = {};
            data.location = response.Location;
            data.fileKey = fileKey;
            resposneData.push(data);
            return [error,resposneData];
        }catch(e)
        {
            return[e,resposneData];
        }
    }

    this.uploadPdfFileToS3 = async function(request,filePath){
        let error = false;
        let resposneData = [];

        try{
            const s3 = new AWS.S3();
            const readStream = fs.createReadStream(filePath);
            let fileKey = "868/984/5404/38850/2020/01/103/"+this.getcurrentTimeInMilliSecs()+".pdf";
            let bucName = await this.getS3BucketNameV1(request);
            const params = {
              Bucket: bucName,
              Key: fileKey,
              Body: readStream
            };
          
            let response = await s3.upload(params).promise();
            let data = {};
            data.location = response.Location;
            data.fileKey = fileKey;
            resposneData.push(data);
            return [error,resposneData];
        }catch(e)
        {
            return[e,resposneData];
        }
    }


    this.downloadExcelFileFromS3 = async function(request,fileKey,pathToDownload,fileNameToCreate){

        try{
            const s3 = new AWS.S3();
            
            const params = {
              Bucket: await this.getS3BucketName(request),
              Key: fileKey,
            };
          

            let responseData = await s3.getObject(params).promise();
            console.log(responseData);

            const fs1 = require("fs").promises;
            let error = await fs1.writeFile(pathToDownload+"\\"+fileNameToCreate, responseData.Body);
            
            if(error)
            {
                return [error,[{status :false ,message : "Unsuccessfull"}]];
            }
            else{
                return [false,[{status : true,message : "File Created Successfully!"}]];
            }

        }catch(e)
        {
            return[e,[{}]];
        }      
    }

    this.downloadExcelFileFromS3V1 = async function(request,fileKey,pathToDownload,fileNameToCreate){

        try{
            const s3 = new AWS.S3();
            
            const params = {
              Bucket: await this.getS3BucketNameV1(request),
              Key: fileKey,
            };
          

            let responseData = await s3.getObject(params).promise();
            console.log(responseData);

            const fs1 = require("fs").promises;
            let error = await fs1.writeFile(pathToDownload+"\\"+fileNameToCreate, responseData.Body);
            
            if(error)
            {
                return [error,[{status :false ,message : "Unsuccessfull"}]];
            }
            else{
                return [false,[{status : true,message : "File Created Successfully!"}]];
            }

        }catch(e)
        {
            return[e,[{}]];
        }      
    }

    this.downloadS3ObjectVil = async (request, url) => {
        return new Promise((resolve) => {
            let s3 = new AWS.S3();
            console.log('URL : ', url);

            let BucketName = url.slice(8, 25);
            let KeyName = url.slice(43);

            if (url.includes('ap-south-1')) {
                KeyName = url.slice(54);
            }

            if (url.includes('staging') || url.includes('preprod')) {
                BucketName = url.slice(8, 33);
                KeyName = url.slice(51);

                if (url.includes('ap-south-1')) {
                    KeyName = url.slice(62);
                }
            }

            console.log('BucketName : ', BucketName);
            console.log('KeyName : ', KeyName);
            console.log('Bucket Check: ', BucketName.substring(0,9));

            if(BucketName.substring(0,9) === 'worlddesk') {
                const FileNameArr = url.split('/');
                const FileName = FileNameArr[FileNameArr.length - 1];

                console.log('FILENAME : ', FileName);

                let params = {
                    Bucket: BucketName,
                    Key: KeyName
                };               
                
                try{
                    let filePath = global.config.efsPath;
                    console.log('filePath in Service- ', filePath);
                    let fileStream = s3.getObject(params).createReadStream();
                    console.log("path",filePath)
                    let myFile = fs.createWriteStream(filePath + FileName);
                    
                    fileStream.pipe(myFile);

                    resolve(filePath+''+FileName);
                } catch(err) {
                    console.log(err);
                    resolve(null);
                }
            } else {
                resolve(null);
            }            
        });
    };

    this.removeSpecialCharecters = async function(string){
        let convertedString = string.replace(/[^a-zA-Z0-9 ]/g, "");
        return convertedString;
    }

    this.uploadExcelToS3V3 = async function(filePath){
        let error = false;
        let resposneData = [];

        try{
            const s3 = new AWS.S3();
            const readStream = fs.createReadStream(filePath);
            let fileKey = "xlsb/excel-"+this.getcurrentTimeInMilliSecs()+".xlsb";
            const params = {
              Bucket: "worlddesk-staging-d20kggbr",
              Key: fileKey,
              Body: readStream
            };
          
            let response = await s3.upload(params).promise();
            let data = {};
            data.location = response.Location;
            data.fileKey = fileKey;
            resposneData.push(data);
            return [error,resposneData];
        }catch(e)
        {
            return[e,resposneData];
        }
    }

    this.retriveExcelFromS3V3 = async function(url){
        return new Promise((resolve) => {
            let s3 = new AWS.S3();
            console.log('URL : ', url);
        let KeyName = url.slice(63);
        console.log(KeyName)
        //    return 
        let params = {
            Bucket: "worlddesk-staging-d20kggbr",
            Key: KeyName
        };   
        try{
            const FileNameArr = url.split('/');
            const FileName = FileNameArr[FileNameArr.length - 1];
            
            let filePath = global.config.efsPath;
            console.log('filePath in Service- ', filePath);
            let fileStream = s3.getObject(params).createReadStream();
            console.log("path",filePath)
            let myFile = fs.createWriteStream(filePath + FileName);
            
            fileStream.pipe(myFile);

            resolve(filePath+''+FileName);
        } catch(err) {
            console.log(err);
            resolve(null);
        }
    })
    }


    this.uploadXLSXToS3 = async (fileData,prefix) => {
        return new Promise(async (resolve)=>{
            
            let bucketName = await this.getDynamicBucketName();
            let s3 = new AWS.S3();
            let params = {
                Body: fileData,
                Bucket: bucketName,
                Key: prefix,
                ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ContentEncoding: 'base64',
            };

            //console.log(params.Body);
    
            console.log('Uploading to S3...');

            s3.putObject(params, async (err, data) =>{
                    console.log('ERROR', err);
                    console.log(data);
                    resolve(`https://${bucketName}.s3.ap-south-1.amazonaws.com/${params.Key}`);
                });
            });
    };    

    this.ISTtoUTC = function (date) {
        //var value = moment(date).utcOffset("-05:30").format('YYYY-MM-DD HH:mm:ss');
        let value = moment(date).add(-330, 'minutes').format("YYYY-MM-DD HH:mm:ss")
        return value;
    };

    this.UTCtoIST = function (date) {
        // var value = moment(date).utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss")
        let value = moment(date).add(330, 'minutes').format("YYYY-MM-DD HH:mm:ss")
        return value;
    };

    this.convertDateFormat = (date,format) => {
        return moment(date).format(format);
    }

    this.checkDateFormat = (date,format) => {
        return moment(date, format).isValid();
    }

    this.getFirstDayOfCurrentMonthToIST = () => {
        return moment().tz('Asia/Kolkata').startOf('month').startOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    this.getLastDayOfCurrentMonthToIST = () => {
        return moment().tz('Asia/Kolkata').startOf('month').endOf('month').endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    this.getFirstDayOfNextMonthToIST = () => {
        return moment().tz('Asia/Kolkata').startOf('month').startOf('day').add(1, 'month').format('YYYY-MM-DD HH:mm:ss');
    }

    this.getLastDayOfNextMonthToIST = () => {
        return moment().tz('Asia/Kolkata').endOf('month').endOf('day').add(1, 'month').format('YYYY-MM-DD HH:mm:ss');
    }

    this.getFirstDayOfCurrentQuarterToIST = () => {
        let value = moment().tz('Asia/Kolkata');
        let currentQuarter = value.quarter();
        let currentYear = value.year();
        return moment(moment(currentYear + '-01-01').toDate()).quarter(currentQuarter).startOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    this.getLastDayOfCurrentQuarterToIST = () => {
        let value = moment().tz('Asia/Kolkata');
        let currentQuarter = value.quarter();
        let currentYear = value.year();
        let endMonth = 3 * parseInt(currentQuarter);
        if (endMonth < 10)
            endMonth = '0' + endMonth;
        else
            endMonth += '';
        return moment(currentYear + '-' + endMonth).endOf('month').endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    this.sendPushNotification = async function (request, data, message) {
        let error = false;
        // [CHECK] target_asset_id
        if (
            !request.hasOwnProperty("target_asset_id") ||
            Number(request.target_asset_id) === 0
        ) {
            return [true, {
                message: "Incorrect target asset_id specified."
            }]
        }
        
        let [err, assetData] = await this.getAssetDetails(data);
        let assetPushARN = "";
        if(assetData.length > 0){
            assetPushARN = assetData[0].asset_push_arn;

            sns.logOutPublish(message, assetPushARN, 1);
            pubnubWrapper.publish(request.target_asset_id, message);

            return [error, {
                message: `Push sent to ${request.target_asset_id}`
            }];
        }else{
            return [error, {
                message: `No resource exists hence push not sent to ${request.target_asset_id}`
            }];
        }
    }

    this.sendPushToEntity = async function(request) {

        let error = false;
        let type_flag = "";
        let idChannel = 0;

        if (request.flag == 1) {

            if (
                !request.hasOwnProperty("organization_id") ||
                Number(request.organization_id) === 0
            ) {
                logger.error("Incorrect organization_id specified.");
                return [true, {
                    message: "Incorrect organization_id specified."
                }];
            }else{
                type_flag = "organization_push"
                idChannel = request.organization_id;
            }             

        }else if(request.flag == 2){

            if (
                !request.hasOwnProperty("target_account_id") ||
                Number(request.target_account_id) === 0
            ) {
                logger.error("Incorrect target_account_id specified.");
                return [true, {
                    message: "Incorrect target_account_id specified."
                }];
            }else{
                type_flag = "account_push";
                idChannel = request.target_account_id;
            }              
            
        }else if(request.flag == 3){

            if (
                !request.hasOwnProperty("target_workforce_id") ||
                Number(request.target_workforce_id) === 0
            ) {
                logger.error("Incorrect target workforce_id specified.");
                return [true, {
                    message: "Incorrect target workforce_id specified."
                }];
            }else{
                type_flag = "workforce_push"
                idChannel = request.target_workforce_id;
            }            
            
        }else if(request.flag == 4){

            if (
                !request.hasOwnProperty("target_asset_type_id") ||
                Number(request.target_asset_type_id) === 0
            ) {
                logger.error("Incorrect target asset_type_id specified.");
                return [true, {
                    message: "Incorrect target asset_type_id specified."
                }];
            }else{
                type_flag = "asset_type_push"
                idChannel = request.target_asset_type_id;
            }            
            
        }else if(request.flag == 5){

            if (
                !request.hasOwnProperty("target_asset_id") ||
                Number(request.target_asset_id) === 0
            ) {
                logger.error("Incorrect target asset_id specified.");
                return [true, {
                    message: "Incorrect target asset_id specified."
                }];
            }else{
                type_flag = "asset_push";
                idChannel = request.target_asset_id;
            }  
        } else if (request.flag == 6) {
            if (
                !request.hasOwnProperty("target_workforce_tag_id") ||
                Number(request.target_workforce_tag_id) === 0
            ) {
                logger.error("Incorrect target_workforce_tag_id specified.");
                return [true, {
                    message: "Incorrect target_workforce_tag_id specified."
                }];
            } else {
                type_flag = "workforce_tag_push";
                idChannel = request.target_workforce_tag_id;
            }
        }

       pubnubWrapper.publish(idChannel, {
          type: type_flag,
          organization_id: Number(request.organization_id),
          activity_title: request.push_title,
          description: request.push_message,
          target_workforce_id:request.target_workforce_id,
           target_workforce_tag_id: request.target_workforce_tag_id,
          target_account_id:request.target_account_id,
          target_asset_type_id:request.target_asset_type_id,
          target_asset_id:request.target_workforce_id,
          broadcast_id: request.broadcast_id       
       });
       
       logger.info(`pubnub push sent to channel = ${idChannel} and type = ${type_flag}`);
       return [error, {
           message: `Push sent to ${idChannel}`
       }];
   };

    this.logInfo = function (request = {}, message = '', data = '') {

        let logUUID = request.log_uuid || "";
        let botOperationId = request.bot_operation_id || "";

        logger.info(`${attachlogUUID(logUUID, botOperationId)} ${message}`, data);

    };


    this.logDebug = function (request = {}, message = '', data = '') {

        let logUUID = request.log_uuid || "";
        let botOperationId = request.bot_operation_id || "";

        logger.debug(`${attachlogUUID(logUUID, botOperationId)} ${message}`, data);
    };

    this.logVerbose = function (request = {}, message = '', data = '') {

        let logUUID = request.log_uuid || "";
        let botOperationId = request.bot_operation_id || "";

        logger.verbose(`${attachlogUUID(logUUID, botOperationId)} ${message}`, data);

    };

    this.logWarning = function (request = {}, message = '', data = '') {

        let logUUID = request.log_uuid || "";
        let botOperationId = request.bot_operation_id || "";

        logger.warn(`${attachlogUUID(logUUID, botOperationId)} ${message}`, data);

    };

    this.logError = function (request = {}, message = '', data = '') {

        let logUUID = request.log_uuid || "";
        let botOperationId = request.bot_operation_id || "";

        logger.error(`${attachlogUUID(logUUID, botOperationId)} ${message}`, data);

    };

    this.logSilly = function (request = {}, message = '', data = '') {

        let logUUID = request.log_uuid || "";
        let botOperationId = request.bot_operation_id || "";

        logger.silly(`${attachlogUUID(logUUID, botOperationId)} ${message}`, data);

    };

    let attachlogUUID = (logUUID, botOperationId) => {

        let text = "";

        if (logUUID) {
            text += `[${logUUID}]`;
        }

        if (botOperationId) {
            text += `[${botOperationId}]`;
        }
        return text;
    }

    this.fetchCompanyDefaultAssetName = async function (request) {
        let assetName = 'greneOS',
            error = true,
            idOrganization = 1;
        let assetId = 100;
        if(request.is_pam){
            assetId = 9841;
            idOrganization = 351;
        }

        let paramsArr = new Array(
            idOrganization,
            assetId
        );
        const queryString = this.getQueryString('ds_p1_asset_list_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    assetName = data[0].asset_first_name;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, assetName];
    };


    this.handleElasticSearchResponse = async function (request, dataTobeSent, elasticIndex, err, response, stackTrace = "") {
        if (err) {
            this.logError(request, `${elasticIndex} - elastic data insert error`, { type: "elastic_search", data: dataTobeSent, error: err });

            // sqs1.sendMessage({
            //     MessageBody: JSON.stringify({ err, data: dataTobeSent, elasticIndex: elasticIndex, stackTrace, request }),
            //     QueueUrl: global.config.elasticSearchFailedEntriesSQSQueueUrl,
            //     MessageGroupId: `elastic-search-error-group-v1`,
            //     MessageDeduplicationId: uuidv4(),
            //     MessageAttributes: {
            //         "Environment": {
            //             DataType: "String",
            //             StringValue: global.mode
            //         },
            //     }
            // }, (error, data) => {
            //     if (error) {
            //         this.logError(request, `Error sending excel job to SQS queue`, { type: 'elastic_search', error });
            //     } else {
            //         this.logInfo(request, `Successfully sent excel job to SQS queue: %j`, { type: 'elastic_search', request_body: request });
            //     }
            // });

            let [error, responseData] = await this.insertElasticFailedEntries(request, JSON.stringify({ err, data: dataTobeSent, elasticIndex: elasticIndex, stackTrace, request }), elasticIndex)
            if (error) {
                this.logError(request, `Error inserting failed elastic entries into db`, { type: 'elastic_search', error });
            } else {
                this.logInfo(request, `Successfully inserted failed elastic entries into db %j`, { type: 'elastic_search', request_body: request });
            }
        } else {
            this.logInfo(request, `${elasticIndex} - elastic data insert done %j`, dataTobeSent);
        }
    }

    this.handleElasticSearchEntries = async function (request, entryType, queryData, elasticIndex, stackTrace = "") {

        this.logInfo(request, `${elasticIndex} - request for elastic search data ${entryType}  %j`, { queryData, elasticIndex, stackTrace, request });

        let insertedResponse = await new Promise((resolve) => {
            sqs1.sendMessage({
                MessageBody: JSON.stringify({ queryData, entryType, elasticIndex, stackTrace, request }),
                QueueUrl: global.config.elasticSearchEntriesSQSQueueUrl,
                MessageGroupId: `elastic-search-group-v1`,
                MessageDeduplicationId: uuidv4(),
                MessageAttributes: {
                    "Environment": {
                        DataType: "String",
                        StringValue: global.mode
                    },
                }
            }, (error, data) => {
                if (error) {
                    this.logError(request, `${elasticIndex}-${entryType} - error sending elastic search entry into SQS`, { type: 'elastic_search', error, queryData, elasticIndex, stackTrace, request });
                    resolve();
                } else {
                    this.logInfo(request, `${elasticIndex}-${entryType} - successfully sent to SQS`, { queryData, elasticIndex, stackTrace, request });
                    resolve();
                }
            });

        })
    }

    this.getStackTrace = () => {

        let stack;

        try {
            throw new Error('');
        }
        catch (error) {
            stack = error.stack || '';
        }

        stack = stack.split('\n').map(function (line) { return line.trim(); });
        return stack.splice(stack[0] == 'Error' ? 2 : 1);
    }

    this.insertElasticFailedEntries = async (request, message, index) => {
        let responseData = [],
            error = true;

        try {
            const paramsArr = new Array(
                message,
                index
            );
            const queryString = this.getQueryString('ds_v1_elastic_error_transaction_insert', paramsArr);

            if (queryString !== '') {
                await db.executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    })
            }
        } catch (e) {
            this.logError(request, "Error inserting elastic faild entries into DB", { type: 'elastic_search', error: e });
        }

        return [error, responseData];
    }
    this.WhatsappNotification=async(request,memberData,recipientData,templateName)=>{
        let responseData = [];
        let   error = true;   
        let data = {
            "channelId":global.config.gallaboxChannelId,
            "channelType": "whatsapp",       
            "recipient":recipientData,
            "whatsapp": {
            "type": "template",
            "template": {
            "templateName": templateName,
            "bodyValues":memberData,
            }
            }
            };
            let config = {
                method: 'post',
                url:global.config.gallaboxurl,
                headers:global.config.gallaboxApiCredentials,
                data : data
              };
         await  axios(config)
            .then((response)=> {
                responseData.push(response.data)  
                error = false;              
                }).catch(err=>{
                    console.log(err)
                    error = err;
                })
                return [error, responseData];
    }

    this.handleBotTransactionInsertForApi = async (request) => {

        let messageId = uuidv4() || "";
        let requestForBotTransactionInsert = {};

        requestForBotTransactionInsert.message_id = messageId;
        requestForBotTransactionInsert.workflow_activity_id = request.workflow_activity_id || 0;
        requestForBotTransactionInsert.form_activity_id = request.data_activity_id || 0;
        requestForBotTransactionInsert.form_transaction_id = request.form_transaction_id || 0;
        requestForBotTransactionInsert.form_id = request.form_id || 0;
        requestForBotTransactionInsert.field_id = request.field_id || 0;
        requestForBotTransactionInsert.message_body = request || {};
        requestForBotTransactionInsert.status_id = 5;
        requestForBotTransactionInsert.produced_datetime = this.getCurrentUTCTime();
        requestForBotTransactionInsert.organization_id = request.organization_id || 0;
        requestForBotTransactionInsert.log_asset_id = request.asset_id || 0;
        requestForBotTransactionInsert.asset_id = request.asset_id || 0;
        requestForBotTransactionInsert.log_datetime = this.getCurrentUTCTime();
        requestForBotTransactionInsert.bot_trigger_source_id = request.bot_trigger_source_id || 0;

        let [insertError, insertResponseData] = await this.BOTMessageTransactionInsertAsync(requestForBotTransactionInsert);

        if (!insertError && insertResponseData.length > 0) {
            return [insertResponseData[0].bot_transaction_id || 0, messageId];
        } else {
            return [0, messageId];
        }
    }

    this.pushBotRequestToSQS = async (request) => {

        let requestForSqs = {};

        requestForSqs.message_id = null;
        requestForSqs.workflow_activity_id = request.workflow_activity_id || 0;
        requestForSqs.form_activity_id = request.data_activity_id || 0;
        requestForSqs.form_transaction_id = request.form_transaction_id || 0;
        requestForSqs.form_id = request.form_id || 0;
        requestForSqs.field_id = request.field_id || 0;
        requestForSqs.message_body = request || {};
        requestForSqs.status_id = 1;
        requestForSqs.produced_datetime = this.getCurrentUTCTime();
        requestForSqs.organization_id = request.organization_id || 0;
        requestForSqs.log_asset_id = request.asset_id || 0;
        requestForSqs.asset_id = request.asset_id || 0;
        requestForSqs.log_datetime = this.getCurrentUTCTime();
        requestForSqs.bot_trigger_source_id = request.bot_trigger_source_id || 0;
        let [insertError, insertResponseData] = await this.BOTMessageTransactionInsertAsync(requestForSqs);

        if (!insertError && insertResponseData.length > 0) {
            request.sqs_bot_transaction_id = insertResponseData[0].bot_transaction_id || 0;
            requestForSqs.sqs_bot_transaction_id = insertResponseData[0].bot_transaction_id || 0;
        }

        sqs1.sendMessage({
            MessageBody: JSON.stringify(requestForSqs),
            QueueUrl: global.config.sqsConsumerSQSQueue,
            MessageGroupId: `bot-consumer-group-v1`,
            MessageDeduplicationId: uuidv4(),
            MessageAttributes: {
                "Environment": {
                    DataType: "String",
                    StringValue: global.mode
                },
            }
        }, (error, data) => {
            if (error) {
                this.logError(request, `[${requestForSqs.workflow_activity_id}][${requestForSqs.sqs_bot_transaction_id}] Error triggering Bot engine`, { type: 'bot_consumer', error, requestForSqs });
            } else {
                this.logInfo(request, `[${requestForSqs.workflow_activity_id}][${requestForSqs.sqs_bot_transaction_id}] Successfully Sent SQS Bot trigger message %j`, { requestForSqs });
            }
        });
    }

    this.BOTMessageTransactionInsertAsync = async function (request) {
        let responseData = [],
            error = true;
            
        const paramsArr = new Array(
            request.bot_trigger_source_id,
            request.message_id,
            request.workflow_activity_id,
            request.form_activity_id,
            request.form_transaction_id,
            request.form_id,
            request.field_id,
            JSON.stringify(request.message_body),
            request.status_id,
            request.produced_datetime,
            request.organization_id,
            request.log_asset_id,
            request.log_datetime,
        );

        const queryString = this.getQueryString('ds_p1_bot_message_transaction_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    this.getS3ObjectsfromFolder = async function (S3FolderUrl) {
        const s3 = new AWS.S3();

        let [bucketName, keyName, bucketUrl] = await new Promise((resolve) => {
            try {

                let urlParts;
                let mainUrl = "";
                if (S3FolderUrl.indexOf('ap-south') > 1) {
                    urlParts = S3FolderUrl.split('.s3.ap-south-1.amazonaws.com/');
                    mainUrl = urlParts[0] + ".s3.ap-south-1.amazonaws.com/";
                } else {
                    urlParts = S3FolderUrl.split('.s3.amazonaws.com/');
                    mainUrl = urlParts[0] + ".s3.amazonaws.com/";
                }

                let BucketName = urlParts[0].replace('https://', '');
                let KeyName = urlParts[1];

                resolve([BucketName, KeyName, mainUrl]);
            } catch (err) {
                resolve(['', '', '']);
            }
        });

        const params = {
            Bucket: bucketName,
            Delimiter: '/',
            Prefix: keyName + '/'
        };

        const data = await s3.listObjects(params).promise();
        return [data['Contents'], bucketUrl];

    };

}

module.exports = Util;
