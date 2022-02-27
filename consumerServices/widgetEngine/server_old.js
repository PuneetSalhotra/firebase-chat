/**
 * author: SBK
 */
let cluster = require('cluster');
const http = require('http');
let numCPUs = require('os').cpus().length;

if (cluster.isMaster) {

    cluster.fork();

    Object.keys(cluster.workers).forEach(function (id) {
        console.log("running with ID : " + cluster.workers[id].process.pid);
    });

    cluster.on('exit', function (worker, code, signal) {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });
} else {
    let WidgetEngineConsumer = require("./consumer.js");
    let options = {
        partition: Number(process.argv[2]),
        topic: 'desker-form-widgets'
    };
    new WidgetEngineConsumer(options);

}