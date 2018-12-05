var Consumer = require("./server/queue/consumer.js");
new Consumer();

process.on('uncaughtException', (err) => {
  console.log(`process.on(uncaughtException): ${err}\n`);
  //throw new Error('uncaughtException');
});

process.on('error', (err) => {
  console.log(`process.on(error): ${err}\n`);
  throw new Error('error');
});

/*var http = require('http');
http.createServer((req, res)=>{
    res.write('I am Alive');
    res.end();
}).listen(global.config.consumerZero);*/