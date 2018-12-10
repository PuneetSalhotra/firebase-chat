/**
 * author: V Nani Kalyan
 */
var WidgetEngineConsumer = require("./consumer.js");
var options = {
    topic: global.config.WIDGET_TOPIC_NAME,
    groupId: global.config.WIDGET_CONSUMER_GROUP_ID,
    autoCommit: true,      
    kafkaHost: global.config.BROKER_HOST,
    sessionTimeout: 15000,
    protocol: ['roundrobin'],
    fromOffset: 'earliest'  
};

new WidgetEngineConsumer(options);