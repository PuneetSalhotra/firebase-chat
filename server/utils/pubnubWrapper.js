/*
 * author: Nani Kalyan V
 */
var PubNub = require('pubnub');

pubnub = new PubNub({
               publishKey : 'pub-c-2df152ea-248e-493d-8271-a21463a0c1b4',
               subscribeKey : 'sub-c-d5a2bff8-2c13-11e3-9343-02ee2ddab7fe'
            });

function PubnubPush() {
        //console.log("In Publish Function");
        var publishConfig;
        
        this.push = function(channelId, message) {
            
            publishConfig = {
                channel : channelId,
                message : message
            }
            
             pubnub.publish(publishConfig, function(status, response) {
                console.log('STATUS : ' , status);
                console.log('');
                console.log('RESPONSE : ' , response);
            });
        }    
};

module.exports = PubnubPush;