/**
 * author: Sri Sai Venkatesh
 */

var aws = require('aws-sdk');
var AwsSns = function () {
    // Load your AWS credentials and try to instantiate the object.
    aws.config.loadFromPath('/var/www/html/desker/NODEJS/desker_api_0.1/server/utils/config.json');
    var sns = new aws.SNS();

    this.publish = function (message, badgeCount, targetArn) {
        var GCMjson = {data: {title: "", message: "", timestamp: ""}}
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

        var params = {
            MessageStructure: 'json',
            Message: JSON.stringify({
                'default': message.title + message.description,
                'GCM': JSON.stringify(GCMjson),
                APNS_VOIP: JSON.stringify({aps}),
                APNS_VOIP_SANDBOX: JSON.stringify({aps})
            }),
            TargetArn: targetArn
        };
        sns.publish(params, function (err, data) {
            if (err)
                console.log(err); // an error occurred
            else
                console.log(data);           // successful response
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
                APNS_VOIP: JSON.stringify({aps}),
                APNS_VOIP_SANDBOX: JSON.stringify({aps})
            }),
            TargetArn: targetArn
        };
        sns.publish(params, function (err, data) {
            if (err)
                console.log(err); // an error occurred
            else
                console.log('Notification Sent : ' , data);           // successful response
        });
    };

    this.createPlatformEndPoint = function (deviceOsId, pushToken, flag, callback) { //flag - 0 is Dev and 1 is Prod 
        var platformApplicationArn = '';
        //if (deviceOsId === 2) {
        switch (deviceOsId) {
            case 1:// android
                platformApplicationArn = global.config.platformApplicationAndroid;
                break;
            case 2:// ios
                if (flag == 0){
                    console.log('Flag is 0. Creating IOS Dev');
                    platformApplicationArn = global.config.platformApplicationIosDev;
                } else {
                    console.log('Flag is 1. Creating IOS Prod');
                    platformApplicationArn = global.config.platformApplicationIosProd;
                }               
                break;
            case 3:// windows
                platformApplicationArn = global.config.platformApplicationWindows;
                break;
        }
        ;
        var params = {
            PlatformApplicationArn: platformApplicationArn, /* required */
            Token: pushToken
        };
        sns.createPlatformEndpoint(params, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                callback(true, '');
            } else {
                console.log(data);           // successful response
                callback(false, data.EndpointArn);
            }
        });
        //}

    };
};
module.exports = AwsSns;