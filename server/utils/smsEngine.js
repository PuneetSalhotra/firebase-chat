// Events
const EventEmitter = require('events');
const request = require('request');

class EEngine extends EventEmitter {

    constructor(dateOfCreation) {
        super();

        this.dateOfCreation = dateOfCreation;
        this.on('print-instance-creation-date', this.printInstanceCreationDate);

        // Domestic
        this.on('send-sinfini-sms', sendSinfiniSms);
        this.on('send-mvayoo-sms', sendMvayooSms);
        this.on('send-bulksms-sms', sendBulkSms);

    };

    printInstanceCreationDate() {
        console.log('dateOfCreation: ', this.dateOfCreation);
        return;
    }

    sendDomesticSms(options) {
        options.failOver = (typeof options.failOver === 'undefined') ? false : options.failOver;

        if (options.failOver === true && options.type === 'OTP') {
            this.emit('send-sinfini-sms', options);
            return;
        }

        this.emit();
    }

}

const eEngine = new EEngine(new Date());

////////////////////////////////////////////////////////////
// Domestic

// 1. Sinfini
function sendSinfiniSms(options) {
    // Inits
    options.failOver = (typeof options.failOver === 'undefined') ? false : options.failOver;
    options.countryCode = (typeof options.countryCode === 'undefined') ? '' : options.countryCode;
    let msgString;

    let url = 'https://api-alerts.solutionsinfini.com/v4';
    let dlrurl = 'http://0a4fc7df.ngrok.io/sms-dlvry/sinfini?sent={sent}&delivered={delivered}&custom={custom}&sid={sid}&status={status}&reference={reference}&custom1={custom1}&custom2={custom2}&credits={credits}&mobile={mobile}';
    dlrurl = (options.failOver === true) ? dlrurl : '';

    if (options.type === 'OTP') {
        msgString = getOTPString(options.verificationCode);
    }

    let qs = {
        method: 'sms',
        api_key: 'A9113d0c40f299b66cdf5cf654bfc61b8',
        to: options.countryCode + '' + options.phoneNumber,
        sender: 'DESKER',
        format: 'json',
        message: msgString,
        custom: options.type,
        custom1: options.verificationCode,
        custom2: '',
        dlrurl: dlrurl
    };
    console.log("qs: ", qs)
    // dlrurl => dlr_url

    request({
        url,
        qs
    }, (err, response, body) => {

        let parsedBody = JSON.parse(body);
        if (err || response.statusCode !== 200 || parsedBody.status !== 'OK' || parsedBody.data['0'].status !== 'AWAITED-DLR') {
            console.log("\x1b[31m[sinfini]\x1b[0m Error: ", err);
            console.log("\x1b[31m[sinfini]\x1b[0m response statusCode: ", response.statusCode);
            console.log("\x1b[31m[sinfini]\x1b[0m parsedBody: ", parsedBody);
            console.log("\x1b[31m[sinfini]\x1b[0m parsedBody.data['0'] status: ", parsedBody.data && parsedBody.data['0'].status);

            // Emit failover event to mVayoo
            if (options.failOver === true) {
                this.emit('send-mvayoo-sms', options);
            }
            return;
        }

        // The SMS has been submitted to the operator/mobile network.
        // All good for now.
        console.log("\x1b[32m[sinfini]\x1b[0m response statusCode: ", response.statusCode);
        console.log("\x1b[32m[sinfini]\x1b[0m parsedBody: ", parsedBody);
        console.log("\x1b[32m[sinfini]\x1b[0m parsedBody.data['0'] status: ", parsedBody.data['0'].status);
        return;
    });
}

// 2. mVayoo
function sendMvayooSms(options) {
    // Inits
    options.failOver = (typeof options.failOver === 'undefined') ? false : options.failOver;
    options.countryCode = (typeof options.countryCode === 'undefined') ? '' : options.countryCode;
    let msgString;

    let url = 'http://api.mvaayoo.com/mvaayooapi/MessageCompose';
    if (options.type === 'OTP') {
        msgString = getOTPString(options.verificationCode);
    }
    let qs = {
        user: 'junaid.m@grene.in:greneapple',
        senderID: 'DESKER',
        receipientno: options.countryCode + '' + options.phoneNumber,
        dcs: 0, // Data Coding Schema. 0 => Text Message
        msgtxt: 'msgString',
        state: 4 // This specifies the response types 
    };

    request({
        url,
        qs
    }, (err, response, body) => {

        if (err || response.statusCode !== 200 || !body.includes("Status=0")) {
            console.log("\x1b[31m[mVayoo]\x1b[0m Error: ", err);
            console.log("\x1b[31m[mVayoo]\x1b[0m response statusCode: ", response.statusCode);
            console.log("\x1b[31m[mVayoo]\x1b[0m body: ", body);

            // Emit failover event to BulkSms 
            if (options.failOver === true) {
                this.emit('send-bulksms-sms', options);
            }
            return;
        }

        // The SMS has been submitted to the operator/mobile network.
        // All good for now.
        console.log("\x1b[32m[mVayoo]\x1b[0m response statusCode: ", response.statusCode);
        console.log("\x1b[32m[mVayoo]\x1b[0m body: ", body);
        return;

    });

}

// 3. Bulk SMS
function sendBulkSms(options) {
    // Inits
    options.failOver = (typeof options.failOver === 'undefined') ? false : options.failOver;
    options.countryCode = (typeof options.countryCode === 'undefined') ? '' : options.countryCode;
    let msgString;

    if (options.type === 'OTP') {
        msgString = getOTPString(options.verificationCode);
    }

    let url = 'http://bulksmsapps.com/apisms.aspx';

    let qs = {
        user: 'gsaikiran',
        password: 'blueflock@1',
        genkey: '094729492',
        sender: 'DESKER',
        number: options.countryCode + '' + options.phoneNumber,
        message: msgString,
    };

    request({
        url,
        qs
    }, (err, response, body) => {

        if (err || response.statusCode !== 200 || !body.includes("MessageId")) {
            console.log("\x1b[31m[BulkSms]\x1b[0m Error: ", err);
            console.log("\x1b[31m[BulkSms]\x1b[0m response statusCode: ", response.statusCode);
            console.log("\x1b[31m[BulkSms]\x1b[0m body: ", body);

            // Emit failover event to NONE 
            return;
        }

        // The SMS has been submitted to the operator/mobile network.
        // All good for now.
        console.log("\x1b[32m[BulkSms]\x1b[0m response statusCode: ", response.statusCode);
        console.log("\x1b[32m[BulkSms]\x1b[0m body: ", body);
        console.log("\x1b[32m[BulkSms]\x1b[0m body.includes: ", body.includes('MessageId'));
        return;

    });

}

////////////////////////////////////////////////////////////
// Utilities
function getOTPString(verificationCode) {
    var msg_body = "Desker : Use " + verificationCode + " as verification code for registering the Desker App .";
    return msg_body;
};

module.exports = eEngine;