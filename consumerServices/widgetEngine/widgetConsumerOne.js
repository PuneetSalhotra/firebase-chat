/**
 * author: V Nani Kalyan
 */
let WidgetEngineConsumer = require("./consumer.js");
let options = {
    topic: global.config.WIDGET_TOPIC_NAME,
    groupId: global.config.WIDGET_CONSUMER_GROUP_ID,
    autoCommit: true,
    kafkaHost: global.config.BROKER_HOST,
    sessionTimeout: 15000,
    protocol: ['roundrobin'],
    fromOffset: 'earliest'
};

new WidgetEngineConsumer(options);