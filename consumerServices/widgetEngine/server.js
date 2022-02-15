/**
 * author: V Nani Kalyan
 */

let WidgetEngineConsumer = require("./consumer.js");
let options = {
  partition: Number(process.env.partition),
  topic: global.config.WIDGET_TOPIC_NAME
};

new WidgetEngineConsumer(options);


process.on('uncaughtException', (err) => {
  console.log(`process.on(uncaughtException): ${err}\n`);
  //throw new Error('uncaughtException');
});

process.on('error', (err) => {
  console.log(`process.on(error): ${err}\n`);
  throw new Error('error');
});
