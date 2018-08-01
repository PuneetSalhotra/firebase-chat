/**
 * author: V Nani Kalyan
 */
var WidgetEngineConsumer = require("./consumer.js");
var options = {
    topic: global.config.kafkaActivitiesTopic,
    groupId: 'desker-activities-consumer-group',
    autoCommit: true,      
    kafkaHost: global.config.kafkaIPOne.kafkaHost,
    sessionTimeout: 15000,
    protocol: ['roundrobin'],
    fromOffset: 'earliest'  
};

new WidgetEngineConsumer(options);