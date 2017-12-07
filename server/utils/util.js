/*
 * author: Sri Sai Venkatesh
 */

var moment = require('moment');
var request = require("request");
var twilio = require('twilio');
var nodemailer = require('nodemailer');

function Util() {

    this.getSMSString = function (verificationCode) {
        var msg_body = "Desker : Use " + verificationCode + " as verification code for registering the Desker App .";
        return (msg_body);
    };

    this.hasValidActivityId = function (request) {
        if (request.hasOwnProperty('activity_id')) {
            var returnValue;
            (this.replaceZero(request.activity_id) <= 0) ? returnValue = false : returnValue = true;
            return returnValue;
        } else
            return false;
    };

    this.hasValidGenericId = function (request, parameter) {
        var returnValue;
        if (request.hasOwnProperty(parameter)) {
            (this.replaceZero(request[parameter]) <= 0) ? returnValue = false : returnValue = true;
            return returnValue;
        } else
            return false;
    };

    this.isValidAssetMessageCounter = function (request) {
        if (request.hasOwnProperty('asset_message_counter')) {
            var returnValue = false;
            var messageCounter = this.replaceZero(request.asset_message_counter);
            //console.log('after replacing ' + messageCounter);
            (messageCounter === 0) ? returnValue = false : returnValue = true;
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
        var url = "http://api-alerts.solutionsinfini.com/v3/?method=sms&api_key=A85da7898dc8bd4d79fdd62cd6f5cc4ec&to=" + countryCode + "" + phoneNumber + "&sender=BLUFLK&format=json&message=" + messageString;
        console.log(url);
        request(url, function (error, response, body) {
            var foo = JSON.parse(body);
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

    this.sendInternationalSMS = function (messageString, countryCode, phoneNumber, callback) {
        var accountSid = global.config.twilioAccountSid; // Your Account SID from www.twilio.com/console
        var authToken = global.config.twilioAuthToken; // Your Auth Token from www.twilio.com/console
        var client = new twilio.RestClient(accountSid, authToken);
        client.messages.create({
            body: messageString,
            to: countryCode + '' + phoneNumber, // Text this number
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
            if (err)
                callback(err, false);
            callback(false, res);
        });
    };

    this.sendSMS = function (messageString, countryCode, phoneNumber, callback) {
        if (countryCode == 91) {
            var sms_mode = global.config.sms_mode;
            if (sms_mode == 1) {
                this.sendSmsMvaayoo(messageString, countryCode, phoneNumber, function (err, res) {
                    callback(err, res);
                });
            } else if (sms_mode == 2) {
                this.sendSmsBulk(messageString, countryCode, phoneNumber, function (err, res) {
                    callback(err, res);
                });
            } else if (sms_mode == 3) {
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

    this.makeCall = function (messageString, countryCode, phoneNumber, callback) {
        var requestData = {
            api_key: global.config.nexmoAPIKey,
            "api_secret": global.config.nexmoSecretKey,
            "to": countryCode + "" + phoneNumber,
            "text": messageString,
            "voice": "female",
            "lg": "en-gb"
        };
        //console.log(requestData);
        var url = "https://api.nexmo.com/tts/json";
//        console.log(url);
        request.post({
            uri: url,
            form: requestData
        }, function (error, response, body) {
            var foo = JSON.parse(body);
            console.log(JSON.stringify(foo));
            var res = {};
            if (foo.status === 0) {
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

    this.getCurrentDate = function () {
        var now = moment().utc().format("YYYY-MM-DD");
        return now;
    };

    this.getCurrentUTCTimestamp = function () {
        var now = moment().utc().valueOf();
        return now;
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

    this.getQueryString = function (callName, paramsArr) {
        var queryString = "CALL " + callName + "(";
        paramsArr.forEach(function (item, index) {
            if (typeof item === 'string' || item instanceof String)
                item = item.replace(/'/g, "\\'")    // escaping single quote                   
                        .replace(/\"/g, '\\"')         // escaping \" from UI
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
        if (value === undefined || value === null || value === '')
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

    this.getFormatedLogTime = function (timeString) {
        var value = moment(timeString).format("HH:mm:ss");
        return value;
    };

    this.getTimestamp = function (timeString) {
        var value = moment(timeString).valueOf();
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

    this.differenceDatetimes = function (timeString1, timeString2) {

        var value = moment(timeString1, "YYYY-MM-DD HH:mm:ss").diff(moment(timeString2, "YYYY-MM-DD HH:mm:ss"));
        return value;
    };

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
                console.log('Message sent: ' + info.response);
                callback(false, info);
            }
        });
        return;
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
    }
}
;

module.exports = Util;
