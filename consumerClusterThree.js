var cluster = require('cluster');
const http = require('http');
var numCPUs = require('os').cpus().length;

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
    var Consumer = require("./server/queue/consumerThree.js");
    new Consumer();   
}