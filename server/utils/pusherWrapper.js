/*
 * author: Nani Kalyan V
 */
const logger = require("../logger/winstonLogger");
var Pusher = require('pusher');
var pusher;

if(global.mode === 'local' || global.mode === 'sprint') {
    pusher = new Pusher({
        appId: '924927',
        key: '2f0f3315ab9b5fcf4126',
        secret: '63d242357975898a1d0d',
        cluster: 'ap2'
        //encrypted: true
      });
} else if(global.mode === 'staging') {
    pusher = new Pusher({
        appId: '924928',
        key: 'b9dcdb13fc7ddc7711fb',
        secret: 'a3df7e2e253e06c0eb5b',
        cluster: 'ap2'
        //encrypted: true
      });
} else if(global.mode === 'prod') {
    pusher = new Pusher({
        appId: '924929',
        key: '0adcc5eb2666ac307321',
        secret: 'e8f1b2b6220e5e5043d9',
        cluster: 'ap2'
        //encrypted: true
      });
}


function PusherPush() { 

    this.push = function (channelId, message, eventName = 'eventDesker', isRateLimitExceeded = false) {
        if (isRateLimitExceeded) return;

        console.log('^^^^^^^^^^^^^^^^^^^');
        console.log('Pusher - typeof channelId : ', typeof channelId);
        if(typeof channelId === 'number') {
            channelId = channelId.toString();
        }
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