/*
 * author: Sri Sai Venkatesh
 */

var moment = require('moment');
var request = require("request");
var twilio = require('twilio');
var nodemailer = require('nodemailer');
var tz = require('moment-timezone');
const Nexmo = require('nexmo');
var fs = require('fs');
var os = require('os');

// SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');
// 
// Vodafone Form Field Mapping
const vodafoneFormFieldIdMapping = require(`${__dirname}/formFieldIdMapping`);
// [Vodafone ROMS] CAF Fields Data
const vodafoneRomsCafFieldsData = require(`${__dirname}/vodafoneRomsCafFieldsData`);
// 
// SendInBlue
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;
// Configure API key authorization: api-key
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = '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';

const apiInstance = new SibApiV3Sdk.SMTPApi();
// 

function Util() {

    this.getSMSString = function (verificationCode) {
        var msg_body = "Desker : Use " + verificationCode + " as verification code for registering the Desker App .";
        return (msg_body);
    };

    this.hasValidActivityId = function (request) {
        if (request.hasOwnProperty('activity_id')) {
            var returnValue;
            (this.replaceZero(request.activity_id) <= 0) ? returnValue = false: returnValue = true;
            return returnValue;
        } else
            return false;
    };

    this.hasValidGenericId = function (request, parameter) {
        var returnValue;
        if (request.hasOwnProperty(parameter)) {
            (this.replaceZero(request[parameter]) <= 0) ? returnValue = false: returnValue = true;
            return returnValue;
        } else
            return false;
    };

    this.isValidAssetMessageCounter = function (request) {
        if (request.hasOwnProperty('asset_message_counter')) {
            var returnValue = false;
            var messageCounter = this.replaceZero(request.asset_message_counter);
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
        var url = "http://api.mvaayoo.com/mvaayooapi/MessageCompose?user=junaid.m@grene.in:greneapple&senderID=DESKER&receipientno=" + countryCode + "" + phoneNumber + "&dcs=0&msgtxt=" + messageString + "&state=4";

        request(url, function (error, response, body) {
            var res = {};
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
        var url = "http://api.mvaayoo.com/mvaayooapi/MessageCompose?user=junaid.m@grene.in:greneapple&senderID=PUDMNK&receipientno=" + countryCode + "" + phoneNumber + "&dcs=0&msgtxt=" + messageString + "&state=4";
        //console.log('URL : ', url);
        global.logger.write('conLog', 'URL : ' + url, {}, {});

        request(url, function (error, response, body) {
            var res = {};
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
        var url = "http://bulksmsapps.com/apisms.aspx?user=gsaikiran&password=LUHUUI&genkey=094729492&sender=BLUFLK&number=" + countryCode + "" + phoneNumber + "&message=" + messageString;
        //console.log(url);
        request(url, function (error, response, body) {
            var res = {};
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

    this.sendSmsSinfini = function (messageString, countryCode, phoneNumber, callback) {
        messageString = encodeURI(messageString);
        //var url = "http://api-alerts.solutionsinfini.com/v3/?method=sms&api_key=A85da7898dc8bd4d79fdd62cd6f5cc4ec&to=" + countryCode + "" + phoneNumber + "&sender=BLUFLK&format=json&message=" + messageString;
        var url = "http://api-alerts.solutionsinfini.com/v3/?method=sms&api_key=A9113d0c40f299b66cdf5cf654bfc61b8&to=" + countryCode + "" + phoneNumber + "&sender=DESKER&format=json&message=" + messageString;
        //console.log(url);
        global.logger.write('debug', url, {}, {});
        request(url, function (error, response, body) {
            var foo = JSON.parse(body);

            //console.log('error : ', error);
            //console.log('body : ' , body);
            global.logger.write('debug', 'error : ' + JSON.stringify(error), {}, {});
            global.logger.write('debug', 'body : ' + JSON.stringify(body), {}, {});

            var res = {};
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
        var url = "http://smshorizon.co.in/api/sendsms.php?user=GreneRobotics&apikey=oLm0MhRHBt2KPXFRrk8k&mobile="+countryCode+""+phoneNumber+"&message="+messageString+"&senderid=WDDESK&type=txt";
        global.logger.write('conLog', 'URL: ' + url, {}, {});
        request(url, function (error, response, body) {
        	global.logger.write('debug', 'SMS HORIZON RESP:: ' + body, {}, {});
            var res = {};            
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
        var accountSid = global.config.twilioAccountSid; // Your Account SID from www.twilio.com/console
        var authToken = global.config.twilioAuthToken; // Your Auth Token from www.twilio.com/console
        var client = new twilio.RestClient(accountSid, authToken);
        client.messages.create({
            body: messageString,
            to: '+' + countryCode + '' + phoneNumber, // Text this number
            from: '+1 810-637-5928' // From a valid Twilio number
        }, function (err, message) {
            var res = {};
            if (typeof message != 'undefined' && message.sid != '') {
                res['status'] = 1;
                res['message'] = "Message sent";
            } else {
                res['status'] = 0;
                res['message'] = "Message not sent";
            }
            //console.log(res);
            global.logger.write('debug', res, {}, request);
            if (err) {
                //console.log('err : ', err);
                global.logger.write('debug', err, {}, request);
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

        global.logger.write('conLog', 'To : ' + to, {}, request);
        global.logger.write('conLog', 'Text : ' + text, {}, request);

        nexmo.message.sendSms(from, to, text, (error, response) => {
            if (error) {
                global.logger.write('debug', error, {}, request);
                throw error;
            } else if (response.messages[0].status != '0') {
                //console.error(response);
                global.logger.write('debug', response, {}, request);
                throw 'Nexmo returned back a non-zero status';
            } else {
                //console.log(response);
                global.logger.write('debug', response, {}, request);
            }
        });
    };

    this.getPhoneNumbers = function (request, callback) {
        var accountSid = 'ACbe16c5becf34df577de71b253fa3ffe4';
        var authToken = "73ec15bf2eecd3ead2650d4d6768b8cd";
        var client = new twilio.RestClient(accountSid, authToken);

        var country = request.country;
        //var areaCode = request.area_code;
        //console.log(country,'/n', areaCode);

        client.availablePhoneNumbers(country).local.list({
            //areaCode: areaCode
        }, function (err, data) {
            (data.available_phone_numbers.length > 0) ? callback(false, data, 200): callback(false, [], 200);
        });
    }

    this.purchaseNumber = function (request, callback) {
        var accountSid = 'ACbe16c5becf34df577de71b253fa3ffe4';
        var authToken = "73ec15bf2eecd3ead2650d4d6768b8cd";
        var client = new twilio.RestClient(accountSid, authToken);

        var phoneNumber = request.phone_number;

        client.incomingPhoneNumbers.create({
            phoneNumber: phoneNumber
        }, function (err, purchasedNumber) {
            (err) ? callback(false, err.message, -3401): callback(false, purchasedNumber, 200);
        });
    }

    this.MakeCallTwilio = function (text, passcode, countryCode, phoneNumber, callback) {
        var accountSid = global.config.twilioAccountSid; // Your Account SID from www.twilio.com/console
        var authToken = global.config.twilioAuthToken; // Your Auth Token from www.twilio.com/console
        const client = require('twilio')(accountSid, authToken);
        var toNumber = '+' + countryCode + phoneNumber;

        var xmlText = "<?xml version='1.0' encoding='UTF-8'?>";
        xmlText += "<Response>"
        xmlText += "<Say voice='alice'>" + text + "</Say>"
        xmlText += "</Response>"

        //console.log('xmlText : ' + xmlText);
        //console.log(global.config.mobileBaseUrl + global.config.version + '/account/voice_'+passcode);

        global.logger.write('conLog', 'xmlText : ' + xmlText, {}, request);
        global.logger.write('conLog', global.config.mobileBaseUrl + global.config.version + '/account/voice_' + passcode, {}, request);

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
            var domestic_sms_mode = global.config.domestic_sms_mode;
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

        var jsonText = '[{ "action": "talk", "voiceName": "Russell","text":"';
        jsonText += messageString;
        jsonText += '"}]';

        //console.log('jsonText : ' + jsonText);
        global.logger.write('conLog', 'jsonText : ' + jsonText, {}, {});
        let answerUrl = global.config.mobileBaseUrl + global.config.version + '/account/nexmo/voice_' + passcode + '.json?file=voice_' + passcode + '.json';
        //console.log('Answer Url : ', answerUrl);
        global.logger.write('conLog', 'Answer Url : ' + answerUrl, {}, {});
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
                        global.logger.write('debug', 'makeCallNexmo response: ' + JSON.stringify(response), {}, request);
                        callback(false, response, 200);
                    }
                });
            }
        });
    };

    this.decodeSpecialChars = function (string) {
        if (typeof string === 'string') {
            string = string.replace(";sqt;", "'");
            string = htmlEntities(string);
            return string;
        } else {
            return "";
        }

    };

    var htmlEntities = function (str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    this.getCurrentUTCTime = function () {
        var now = moment().utc().format("YYYY-MM-DD HH:mm:ss");
        return now;
    };

    this.getCurrentISTTime = function () {
        var now = moment().tz('Asia/Kolkata').format("YYYY-MM-DD HH:mm:ss");
        return now;
    };

    this.getOTPHeartBeatCode = function () {
        var now = moment().tz('Asia/Kolkata').format("DDHHmm");
        return now;
    };

    this.getCurrentDate = function () {
        var now = moment().utc().format("YYYY-MM-DD");
        return now;
    };

    this.getCurrentMonth = function () {
        var now = moment().utc().format("MM");
        return now;
    };

    this.getCurrentYear = function () {
        var now = moment().utc().format("YYYY");
        return now;
    };

    this.getCurrentUTCTimestamp = function () {
        var now = moment().utc().valueOf();
        return now;
    };

    this.getStartDayOfMonth = function () {
        var value = moment().startOf('month').format("YYYY-MM-DD");
        return value;
    };

    this.getStartDayOfPrevMonth = function () {
        var value = moment().startOf('month').subtract(1, 'month').format("YYYY-MM-DD");
        return value;
    };

    this.getStartDayOfWeek = function () {
        var value = moment().startOf('week').add(1, 'days').format("YYYY-MM-DD");
        return value;
    };

    this.getStartDateTimeOfWeek = function () {
        var value = moment().startOf('week').add(1, 'days').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.getEndDayOfWeek = function () {
        var value = moment().endOf('week').format("YYYY-MM-DD");
        return value;
    };

    this.getEndDateTimeOfWeek = function () {
        var value = moment().endOf('week').add(1, 'days').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.getStartDayOfPrevWeek = function () {
        var value = moment().startOf('week').add(1, 'days').subtract(7, 'days').format("YYYY-MM-DD");
        return value;
    };

    this.getStartDateTimeOfMonth = function () {
        var value = moment().startOf('month').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.getEndDateTimeOfMonth = function () {
        var value = moment().endOf('month').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.getcurrentTime = function () {
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var dateVal = date.getDate();
        var hours = date.getHours();
        var min = date.getMinutes();
        var sec = date.getSeconds();
        var dateTimeString = year + "-" + month + "-" + dateVal + " " + hours + ":" + min + ":" + sec;
        return dateTimeString;
    };

    this.getcurrentTimeInMilliSecs = function () {
        var date = new Date();
        var year = date.getFullYear();

        var month = date.getMonth();
        month++;
        month = (month < 10 ? '0' : '') + month;

        var dateVal = date.getDate();
        var hours = date.getHours();
        var min = date.getMinutes();
        var sec = date.getSeconds();
        var ms = date.getMilliseconds();
        var dateTimeString = year + month + dateVal + "-" + hours + min + sec + ms;
        return dateTimeString;
    };

    this.getQueryString = function (callName, paramsArr) {
        var queryString = "CALL " + callName + "(";
        paramsArr.forEach(function (item, index) {
            if (typeof item === 'string' || item instanceof String)
                item = item.replace(/'/g, "\\'") // escaping single quote                   
                .replace(/\"/g, '\\"') // escaping \" from UI
                .replace(/\n/g, '\\n');
            if (index === (paramsArr.length - 1))
                queryString = queryString + "'" + item + "'";
            else
                queryString = queryString + "'" + item + "',";
        }, this);
        queryString = queryString + ");";
        return queryString;

    };

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
        var messageUniqueId = assetId + this.getCurrentUTCTimestamp() + this.getRandomInt();
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
            var retValue = Number(value);
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
        var value = moment(timeString).format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.getFormatedLogDate = function (timeString) {
        var value = moment(timeString).format("YYYY-MM-DD");
        return value;
    };

    this.getFormatedSlashDate = function (timeString) {
        var value = moment(timeString).format("DD/MM/YYYY");
        return value;
    };

    this.getFormatedLogTime = function (timeString) {
        var value = moment(timeString).format("HH:mm:ss");
        return value;
    };

    this.getFormatedLogYear = function (timeString) {
        var value = moment(timeString).format("YYYY");
        return value;
    };

    this.getFormatedLogMonth = function (timeString) {
        var value = moment(timeString).format("MM");
        return value;
    };

    this.getTimestamp = function (timeString) {
        var value = moment(timeString).valueOf();
        return value;
    };

    this.getDatetimewithAmPm = function (timeString) {
        var value = moment(timeString).format("YYYY-MM-DD hh:mm A");
        return value;
    };

    this.getDatewithndrdth = function (timeString) {
        var value = moment(timeString).format("MMM Do");
        return value;
    };

    this.addDays = function (timeString, days) {
        var value = moment(timeString, "YYYY-MM-DD HH:mm:ss").add(days, 'days').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.addUnitsToDateTime = function (timeString, days, unit) {
        var value = moment(timeString, "YYYY-MM-DD HH:mm:ss").add(days, unit).format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.subtractDays = function (timeString, days) {
        var value = moment(timeString, "YYYY-MM-DD HH:mm:ss").subtract(days, 'days').format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.subtractUnitsFromDateTime = function (timeString, days, unit) {
        var value = moment(timeString, "YYYY-MM-DD HH:mm:ss").subtract(days, unit).format("YYYY-MM-DD HH:mm:ss");
        return value;
    };

    this.differenceDatetimes = function (timeString1, timeString2) {
        var value = moment(timeString1, "YYYY-MM-DD HH:mm:ss").diff(moment(timeString2, "YYYY-MM-DD HH:mm:ss"));
        return value;
    };

    this.differenceDatetime = function (timeString1, timeString2) {
        var value = moment(timeString1, "YYYY-MM-DD HH:mm:ss").diff(moment(timeString2, "YYYY-MM-DD HH:mm:ss"));
        return moment.duration(value)._data;
    };

    /*this.getNoOfDays = function (timeString1, timeString2) {
        var value = moment(timeString1, "YYYY-MM-DD HH:mm:ss").diff(moment(timeString2, "YYYY-MM-DD HH:mm:ss"), 'days');
        return value;
    };*/

    this.getDayStartDatetime = function () {
        var value = moment().startOf('day').utcOffset("-05:30").format('YYYY-MM-DD HH:mm:ss');
        return value;
    };

    this.getDayEndDatetime = function () {
        var value = moment().endOf('day').utcOffset("-05:30").format('YYYY-MM-DD HH:mm:ss');
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

    this.getDayStartDatetimeIST = function () {
        var value = moment().tz('Asia/Kolkata').startOf('day').format('YYYY-MM-DD HH:mm:ss');
        return value;
    };

    this.getDayEndDatetimeIST = function () {
        var value = moment().tz('Asia/Kolkata').endOf('day').format('YYYY-MM-DD HH:mm:ss');
        return value;
    };

    //getDay start time based on the TimeZone
    this.getDayStartDatetimeTZ = function (timezone) {
        (timezone === "") ? timezone = 'Asia/Kolkata': timezone = timezone;
        var input = moment().tz(timezone).startOf('day');
        var format = 'YYYY-MM-DD HH:mm:ss';
        var value = moment.tz(input, format, timezone).utc().format('YYYY-MM-DD HH:mm:ss');
        //console.log('TimeZone : ', timezone);
        //console.log('Start DateTime in given timezone: ', value);        
        return value;
    };

    //getDay end time based on the TimeZone
    this.getDayEndDatetimeTZ = function (timezone) {
        (timezone === "") ? timezone = 'Asia/Kolkata': timezone = timezone;
        var input = moment().tz(timezone).endOf('day');
        var format = 'YYYY-MM-DD HH:mm:ss';
        var value = moment.tz(input, format, timezone).utc().format('YYYY-MM-DD HH:mm:ss');
        //console.log('TimeZone : ', timezone);
        //console.log('End DateTime in given timezone: ', value);
        return value;
    };

    this.isDateBetween = function (startDt, endDt, compareDt) {
        var compareDate = moment(compareDt, "YYYY-MM-DD HH:mm:ss");
        var startDate = moment(startDt, "YYYY-MM-DD HH:mm:ss");
        var endDate = moment(endDt, "YYYY-MM-DD HH:mm:ss");

        var value = compareDate.isBetween(startDate, endDate);
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
        var cnt = 0;
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
        var a = stringUrl.substr(0, stringUrl.lastIndexOf("."));
        var b = a.slice(-1);
        if (b === '_') {
            var d = new Date();
            return stringUrl.substr(0, stringUrl.lastIndexOf("_") + 1) + size + stringUrl.substr(stringUrl.lastIndexOf(".")) + "?" + d.getTime();
        } else {
            return stringUrl.substr(0, stringUrl.lastIndexOf(".")) + '_' + size + stringUrl.substr(stringUrl.lastIndexOf("."));
        }
    };

    this.sendEmail = function (email, subject, text, htmlTemplate, callback) {
        var smtpConfig = {
            host: global.config.smtp_host,
            port: global.config.smtp_port,
            secure: false, // use SSL
            auth: {
                user: global.config.smtp_user,
                pass: global.config.smtp_pass
            }
        };
        // create reusable transporter object using the default SMTP transport
        var transporter = nodemailer.createTransport(smtpConfig);

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: 'BlueFlock <' + global.config.smtp_user + '>', // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            text: text, // plaintext body
            html: htmlTemplate // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                callback(true, error);
            } else {
                //console.log('Message sent: ' + info.response);
                global.logger.write('debug', 'Message sent: ' + JSON.stringify(info.response), {}, request);
                callback(false, info);
            }
        });
        return;
    };

    this.sendEmailV1 = function (request, email, subject, text, htmlTemplate, callback) {
        var smtpConfig = {
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
        var transporter = nodemailer.createTransport(smtpConfig);

        // setup e-mail data with unicode symbols
        var mailOptions = {
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
                callback(true, error);
            } else {
                //console.log('Message sent: ' + info.response);
                global.logger.write('debug', 'Message sent: ' + info.response, {}, request);
                callback(false, info);
            }
        });
        return;
    };

    // SendGrid
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
    this.sendEmailV3 = function (request, email, subject, text, htmlTemplate, callback) {
        console.log('email : ', email);
        console.log('subject : ', subject);
        console.log('text : ', text);
        
        // SendSmtpEmail | Values to send a transactional email
        var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
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
        // sendSmtpEmail.attachment = [{
        //     "url": "https://i.imgur.com/Pf7zKgl.jpg"
        // }]

        apiInstance.sendTransacEmail(sendSmtpEmail)
            .then(function (data) {
                console.log('API called successfully. Returned data: ', data);
                return callback(false, data);
            }, function (error) {
                return callback(true, error);
            });
    };

    this.getRedableFormatLogDate = function (timeString, type) {
        if (typeof type == 'undefined' || type == '' || type == null)
            type = 0;

        var value = '';

        if (type == 1) {
            value = moment(timeString).format("YYYY-MM-DD HH:mm");
        } else {
            value = moment(timeString).format("dddd, MMMM Do, YYYY");
        }
        return value;
    };

    this.convertToTimezone = function (timeString, offsetValue) {
        var timeStringNew = moment(timeString).valueOf();
        timeString = (timeStringNew > 0 && Number(offsetValue) != 'NaN') ? Number(timeStringNew) + Number(offsetValue) : timeString;
        var value = moment(timeString).format("YYYY-MM-DD HH:mm:ss");
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
    }

    this.writeLogs = function (data, isTargeted) {
        var date = this.getCurrentUTCTime();
        var locationInServer;
        var logFilePath;
        var targetedLogFilePath;

        if (global.mode === 'prod') {
            locationInServer = global.config.efsPath + 'api/';
            logFilePath = locationInServer + 'logs/' + this.getCurrentDate() + '.txt';
            targetedLogFilePath = locationInServer + 'targeted_logs/' + this.getCurrentDate() + '.txt';
        } else {
            locationInServer = global.config.efsPath + 'staging_api/';
            logFilePath = locationInServer + 'logs/' + this.getCurrentDate() + '.txt';
            // Development and Pre-Production | Not Staging
            targetedLogFilePath = locationInServer + 'targeted_logs/' + this.getCurrentDate() + '.txt';
        }       
        

        if (typeof data === 'object') {
            // console.log('JSON.stringify(data) : ' + JSON.stringify(data));
            data = JSON.stringify(data);
        }

        var data_to_add = date + ': ' + data;
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
        var url = "http://smshorizon.co.in/api/sendsms.php?user=GreneRobotics&apikey=oLm0MhRHBt2KPXFRrk8k&mobile="+countryCode+""+phoneNumber+"&message="+messageString+"&senderid=WDDESK&type=txt";
        global.logger.write('conLog', 'URL: ' + url, {}, {});
        request(url, function (error, response, body) {
        	global.logger.write('debug', 'SMS HORIZON RESP:: ' + body, {}, {});
            var res = {};            
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

};

module.exports = Util;
