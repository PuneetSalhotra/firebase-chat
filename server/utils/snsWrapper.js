/**
 * author: Sri Sai Venkatesh
 */
const logger = require("../logger/winstonLogger");

var aws = require('aws-sdk');
var AwsSns = function () {
    // Load your AWS credentials and try to instantiate the object.
    //aws.config.loadFromPath('/var/www/html/desker/NODEJS/desker_api_0.1/server/utils/config.json');
    aws.config.loadFromPath(`${__dirname}/config.json`);
    var sns = new aws.SNS();

    this.publish = function (message, badgeCount, targetArn) {
        var GCMjson = {
            data: {
                title: "",
                message: "",
                timestamp: "",
                activity_id: 0,
                activity_inline_data: ""
            }
        };
        GCMjson.data.title = "'" + message.title + "'";
        GCMjson.data.message = "'" + message.description + "'";
        GCMjson.data.timestamp = "''";
        GCMjson.data.activity_id = Number(message.activity_id) || 0;
        GCMjson.data.activity_inline_data = message.activity_inline_data;

        var aps = {
            'badge': badgeCount,
            'sound': 'default',
            'alert': message.title + message.description,
            'activity_id': Number(message.activity_id) || 0,
            'content-available': 1
        };

        if (message.hasOwnProperty('extra_data')) {
            GCMjson.data.type = message.extra_data.type;
            GCMjson.data.call_data = message.extra_data.call_data;
            aps.call_data = message.extra_data.call_data;
            aps.type = message.extra_data.type;
        }

        // Clicking on the push notification should take the 
        // user to the corresponding activity
        if (message.hasOwnProperty('activity_id') && message.hasOwnProperty('activity_type_category_id')) {
            GCMjson.data.activity_id = message.activity_id;
            GCMjson.data.activity_type_category_id = message.activity_type_category_id;

        }

        /*var params = {
            MessageStructure: 'json',
            Message: JSON.stringify({
                'default': message.title + message.description,
                'GCM': JSON.stringify(GCMjson),
                APNS_VOIP: JSON.stringify({aps}),
                APNS_VOIP_SANDBOX: JSON.stringify({aps})
            }),
            TargetArn: targetArn
        };*/

        var params = {
            MessageStructure: 'json',
            Message: JSON.stringify({
                'default': message.title + message.description,
                'GCM': JSON.stringify(GCMjson),
                APNS_VOIP: JSON.stringify({
                    aps
                }),
                APNS_VOIP_SANDBOX: JSON.stringify({
                    aps
                }),
                APNS: JSON.stringify({
                    aps
                }),
                APNS_SANDBOX: JSON.stringify({
                    aps
                })
            }),
            TargetArn: targetArn
        };

        sns.publish(params, function (err, data) {
            console.log("sns.publish: ", err);
            console.log("sns.publish: ", data);
            if (err)
                // console.log(err); // an error occurred
                // global.logger.write('debug', err, {}, {});
                logger.error('AwsSns.publish.sns.publish: Error Sending Push Notification', { type: 'sns_push', sns_params: params, data, activity_id: message.activity_id || 0, error: err });
            else
                // console.log(data);           // successful response
                // global.logger.write('debug', 'Notification Sent : ' + JSON.stringify(data, null, 2), {}, {});
                logger.verbose('AwsSns.publish.sns.publish: %j', data, { type: 'sns_push', sns_params: params, data, activity_id: message.activity_id || 0, error: err });
        });
    };

    this.pamPublish = function (message, badgeCount, targetArn) {
        var aps = {
            'badge': badgeCount,
            'sound': 'default',
            'order_id': message.order_id,
            'order_name': message.order_name,
            'status_type_id': 0,
            'station_category_id': message.activity_channel_category_id
        }

        var params = {
            MessageStructure: 'json',
            Message: JSON.stringify({
                'default': message.order_id + message.order_name,
                APNS_VOIP: JSON.stringify({
                    aps
                }),
                APNS_VOIP_SANDBOX: JSON.stringify({
                    aps
                })
            }),
            TargetArn: targetArn
        };
        sns.publish(params, function (err, data) {
            if (err)
                //console.log(err); // an error occurred
                global.logger.write('debug', err, {}, {});
            else
                //console.log('Notification Sent : ' , data);           // successful response
                global.logger.write('debug', 'Notification Sent : ' + data, {}, {});
        });
    };

    this.createPlatformEndPoint = function (deviceOsId, pushToken, flag, flagAppAccount, callback) { //flag - 0 is Dev and 1 is Prod 
        var platformApplicationArn = '';
        //if (deviceOsId === 2) {
        switch (deviceOsId) {
            case 1: // android
                platformApplicationArn = global.config.platformApplicationAndroid;
                break;
            case 2: // ios
                if (flagAppAccount == 0) { //BlueFlock
                    if (flag == 0) {
                        //console.log('Flag is 0. Creating IOS Dev for Blue flock Account');
                        global.logger.write('conLog', 'Flag is 0. Creating IOS Dev for Blue flock Account', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosDev;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for Blue flock Account');
                        global.logger.write('conLog', 'Flag is 1. Creating IOS Prod for Blue flock Account', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosProd;
                    }
                } else if (flagAppAccount == 1) { //flagAppAccount == 1 i.e. Grene Robotics -- VOIP Push
                    if (flag == 0) {
                        //console.log('Flag is 0. Creating IOS Dev for Grene Robotics Account VOIP Push');
                        global.logger.write('conLog', 'Flag is 0. Creating IOS Dev for Grene Robotics Account VOIP Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosDevGR;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for Grene Robotics Account VOIP Push');
                        global.logger.write('conLog', 'Flag is 1. Creating IOS Prod for Grene Robotics Account VOIP Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosProdGR;
                    }
                } else if (flagAppAccount == 2) { //flagAppAccount == 2 i.e. Grene Robotics World Desk normal IOS Push
                    if (flag == 0) {
                        //console.log('Flag is 0. Creating IOS Dev for Grene Robotics Account Plain Push');
                        global.logger.write('conLog', 'Flag is 0. Creating IOS Dev for Grene Robotics Account Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosWorldDeskDevGR;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for Grene Robotics Account Plain Push');
                        global.logger.write('conLog', 'Flag is 1. Creating IOS Prod for Grene Robotics Account Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosWorldDeskProdGR;
                    }
                } else if (flagAppAccount == 3) { //flagAppAccount == 3 i.e. Grene Robotics World Desk VOIP IOS Push New //XCODE 10 20-09-2018
                    if (flag == 0) {
                        //console.log('Flag is 0. Creating IOS Dev for Grene Robotics Account Plain Push');
                        global.logger.write('conLog', 'Flag is 0. Creating IOS Dev for Grene Robotics Account VOIP Push - new certificate', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosVOIPDev;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for Grene Robotics Account Plain Push');
                        global.logger.write('conLog', 'Flag is 1. Creating IOS Prod for Grene Robotics Account VOIP Push - new certificate', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosVOIPProd;
                    }
                } else if (flagAppAccount == 4) { //flagAppAccount == 4 i.e. Grene Robotics Service Desk normal IOS Push
                    if (flag == 0) {
                        //console.log('Flag is 0. Creating IOS Dev for Grene Robotics Account Service Desk Plain Push');
                        global.logger.write('conLog', 'Flag is 0. Creating IOS Dev for Grene Robotics Account Service Desk Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosSDPushDev;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for Grene Robotics Account Service Desk Plain Push');
                        global.logger.write('conLog', 'Flag is 1. Creating IOS Prod for Grene Robotics Account Service Desk Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosSDPushProd;
                    }
                } else if (flagAppAccount == 5) { //flagAppAccount == 5 i.e. PAM normal IOS Push
                    if (flag == 0) {
                        //console.log('Flag is 0. Creating IOS Dev for Grene Robotics Account Service Desk Plain Push');
                        global.logger.write('conLog', 'Flag is 0. Creating IOS Dev for PAM App Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosPamPushDev;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for Grene Robotics Account Service Desk Plain Push');
                        global.logger.write('conLog', 'Flag is 1. Creating IOS Prod for PAM App Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosPamPushProd;
                    }
                } else if (flagAppAccount == 6) { //flagAppAccount == 6 i.e. Office Desk normal IOS Push
                    if (flag == 0) {
                        //console.log('Flag is 0. Creating IOS Dev for Grene Robotics Account Office Desk Plain Push');
                        global.logger.write('conLog', 'Flag is 0. Creating IOS Dev for Office Desk App Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosODPushDev;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for Grene Robotics Account Office Desk Plain Push');
                        global.logger.write('conLog', 'Flag is 1. Creating IOS Prod for Office Desk App Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosODPushProd;
                    }
                } else if (flagAppAccount == 7) { //flagAppAccount == 7 i.e. TONY App normal IOS Push
                    if (flag == 0) {
                        //console.log('Flag is 0. Creating IOS Dev for Tony');
                        global.logger.write('conLog', 'Flag is 0. Creating IOS Dev for Tony App Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosTonyPushDev;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for Tony');
                        global.logger.write('conLog', 'Flag is 1. Creating IOS Prod for Tony App Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosTonyPushProd;
                    }
                } else if (flagAppAccount == 8) { //flagAppAccount == 8 i.e. TONY App normal IOS Push
                    if (flag == 0) {
                        //console.log('Flag is 0. Creating IOS Dev for iTony');
                        global.logger.write('conLog', 'Flag is 0. Creating IOS Dev for iTony App Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosiTonyPushDev;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for iTony');
                        global.logger.write('conLog', 'Flag is 1. Creating IOS Prod for iTony App Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosiTonyPushDev;
                    }
                }
                break;
            case 3: // windows
                platformApplicationArn = global.config.platformApplicationWindows;
                break;
        }
        var params = {
            PlatformApplicationArn: platformApplicationArn,
            /* required */
            Token: pushToken
        };
        sns.createPlatformEndpoint(params, function (err, data) {
            if (err) {
                //console.log(err, err.stack); // an error occurred
                global.logger.write('conLog', err + ' ' + err.stack, {}, {});
                callback(true, '');
            } else {
                //console.log(data);           // successful response
                global.logger.write('conLog', data, {}, {});
                callback(false, data.EndpointArn);
            }
        });
        //}

    };
};
module.exports = AwsSns;
