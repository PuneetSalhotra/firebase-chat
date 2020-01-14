/*
 * author: Nani Kalyan V
 */
const logger = require("../logger/winstonLogger");
var Pusher = require('pusher');

var pusher = new Pusher({
    appId: '924927',
    key: '2f0f3315ab9b5fcf4126',
    secret: '63d242357975898a1d0d',
    cluster: 'ap2'
    //encrypted: true
  });

function PusherPush() { 

    this.push = function (channelId, message, eventName, isRateLimitExceeded = false) {
        if (isRateLimitExceeded) return;

        //1st Param: Channel Name
        //2nd Param: Event Name    
        pusher.trigger(channelId, eventName, {
            "message": message
        });
    };

    this.publish = function (channelId, message, eventName) {
        //1st Param: Channel Name
        //2nd Param: Event Name    
        pusher.trigger(channelId, eventName, {
            "message": message
        });
    };

}

module.exports = PusherPush;