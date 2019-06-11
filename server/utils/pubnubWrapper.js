/*
 * author: Nani Kalyan V
 */
var PubNub = require('pubnub');

var pubnub = new PubNub({
    publishKey: 'pub-c-2df152ea-248e-493d-8271-a21463a0c1b4',
    subscribeKey: 'sub-c-d5a2bff8-2c13-11e3-9343-02ee2ddab7fe'
});

function PubnubPush() {

    var publishConfig;

    this.push = function (channelId, message, isRateLimitExceeded = false) {

        if (isRateLimitExceeded) return;

        publishConfig = {
            channel: channelId,
            message: message
        };

        pubnub.publish(publishConfig, function (status, response) {
            // global.logger.write('conLog', status, {}, {});                
            // global.logger.write('conLog', response, {}, {});

            console.log("PubnubPush: publish | message: ", message)
            console.log("PubnubPush: publish | status: ", status);
            console.log("PubnubPush: publish | response: ", response);

        });
    };

    this.publish = function (channelId, message) {

        let publishConf = {
            channel: channelId,
            message: message
        };

        pubnub.publish(publishConf, function (status, response) {
            global.logger.write('conLog', status, {}, {});
            global.logger.write('conLog', response, {}, {});
        });
    };

    this.subscribe = function (channelId) {
        return new Promise((resolve, reject) => {
            pubnub.subscribe({ channels: [channelId] });
            pubnub.addListener({
                message: function (message) {
                    global.logger.write('conLog', message, {}, {});
                    resolve(message.message);
                }
            });
        });
    };

};

module.exports = PubnubPush;