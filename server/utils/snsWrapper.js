/**
 * author: Sri Sai Venkatesh
 */

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
                timestamp: ""
            }
        }
        GCMjson.data.title = "'" + message.title + "'";
        GCMjson.data.message = "'" + message.description + "'";
        GCMjson.data.timestamp = "''";

        var aps = {
            'badge': badgeCount,
            'sound': 'default',
            'alert': message.title + message.description,
            'content-available': 1
        }

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
            if (err)
                //console.log(err); // an error occurred
                global.logger.write('debug', err, {}, {});
            else
                //console.log(data);           // successful response
                global.logger.write('debug', 'Notification Sent : ' + JSON.stringify(data, null, 2), {}, {});
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
                        global.logger.write('debug', 'Flag is 0. Creating IOS Dev for Blue flock Account', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosDev;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for Blue flock Account');
                        global.logger.write('debug', 'Flag is 1. Creating IOS Prod for Blue flock Account', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosProd;
                    }
                } else if (flagAppAccount == 1) { //flagAppAccount == 1 i.e. Grene Robotics -- VOIP Push
                    if (flag == 0) {
                        //console.log('Flag is 0. Creating IOS Dev for Grene Robotics Account VOIP Push');
                        global.logger.write('debug', 'Flag is 0. Creating IOS Dev for Grene Robotics Account VOIP Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosDevGR;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for Grene Robotics Account VOIP Push');
                        global.logger.write('debug', 'Flag is 1. Creating IOS Prod for Grene Robotics Account VOIP Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosProdGR;
                    }
                } else { //flagAppAccount == 2 i.e. Grene Robotics World Desk normal IOS Push
                    if (flag == 0) {
                        //console.log('Flag is 0. Creating IOS Dev for Grene Robotics Account Plain Push');
                        global.logger.write('debug', 'Flag is 0. Creating IOS Dev for Grene Robotics Account Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosWorldDeskDevGR;
                    } else {
                        //console.log('Flag is 1. Creating IOS Prod for Grene Robotics Account Plain Push');
                        global.logger.write('debug', 'Flag is 1. Creating IOS Prod for Grene Robotics Account Plain Push', {}, {});
                        platformApplicationArn = global.config.platformApplicationIosWorldDeskProdGR;
                    }
                }
                break;
            case 3: // windows
                platformApplicationArn = global.config.platformApplicationWindows;
                break;
        };
        var params = {
            PlatformApplicationArn: platformApplicationArn,
            /* required */
            Token: pushToken
        };
        sns.createPlatformEndpoint(params, function (err, data) {
            if (err) {
                //console.log(err, err.stack); // an error occurred
                global.logger.write('debug', err + ' ' + err.stack, {}, {});
                callback(true, '');
            } else {
                //console.log(data);           // successful response
                global.logger.write('debug', data, {}, {});
                callback(false, data.EndpointArn);
            }
        });
        //}

    };
};
module.exports = AwsSns;