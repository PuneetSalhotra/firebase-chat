var aws = require('aws-sdk');

aws.config.loadFromPath(`${__dirname}/config.json`);
var sns = new aws.SNS();

var publish = function (message, badgeCount, targetArn) {
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

var message = {};
message.title = "Nani Testing";
message.description = "Nani testing from local machine";

publish(message, 1, 'arn:aws:sns:us-east-1:430506864995:endpoint/APNS_VOIP/GRVOIPiosProd/7a8e09e1-96b4-39a4-8385-5f800aa25656');
//publish(message, 1, 'arn:aws:sns:us-east-1:430506864995:endpoint/APNS_VOIP/GRVOIPiosProd/3e1629cf-df9a-3ec3-9884-4e19e67983a7');

function createPlatform() {
    var params = {
            PlatformApplicationArn: "arn:aws:sns:us-east-1:430506864995:app/APNS_VOIP_SANDBOX/VOIPios", /* required */
            Token: "EAD40080A2761B5227B7C222AEC9AC4B3B8B0AD34527374C9BBD4B9D87183007"
        };

        sns.createPlatformEndpoint(params, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred                
            } else {
                console.log(data);           // successful response
            }
        });
}

//createPlatform()
//publish(message, 1, 'arn:aws:sns:us-east-1:430506864995:endpoint/APNS_VOIP_SANDBOX/VOIPios/b1aee3e0-690f-3a61-9048-ae359cd6f138');