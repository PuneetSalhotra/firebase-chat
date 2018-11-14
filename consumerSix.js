var Consumer = require("./server/queue/consumerSix.js");
new Consumer();

process.on('uncaughtException', (err) => {
  console.log(`process.on(uncaughtException): ${err}\n`);
  //throw new Error('uncaughtException');
});

process.on('error', (err) => {
  console.log(`process.on(error): ${err}\n`);
  throw new Error('error');
});