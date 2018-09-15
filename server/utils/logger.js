/*
 * author: Sri Sai Venkatesh
 */

var SQS = require("../queue/sqsProducer");
var Util = require('./util');

function Logger() {

    var sqs = new SQS();
    var util = new Util();
    var targetAssetIDs = [
        20770, // Ben
        20771, // Ben
        9026, // Bharat Krishna Masimukku
        9027, // VP - Cloud & Infra (Bharat)
        9030, // Manager-Data & Middleware (Sai Kiran)
        9109, // Sai Kiran Gangam
        9166, // Nani Kalyan V
        9167 // Sr. Software Engg (Nani Kalyan)
    ];

    /*var winston = require('winston');
    require('winston-daily-rotate-file');

    var transport = new (winston.transports.DailyRotateFile)({
      filename: './logs/' + '%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      //zippedArchive: true,
      //maxSize: '20m',
      //maxFiles: '14d'
    });

    transport.on('rotate', function(oldFilename, newFilename) {
      // do something fun
    });

    var logger = new (winston.Logger)({
      transports: [
        transport
      ]
    });*/

    this.write = function (level, message, object, request) {
        var isTargeted = false;
        var loggerCollection = {
            message: message,
            object: object,
            level: level,
            request: request,
            environment: global.mode, //'prod'
            log: 'log'
        };

        if (request.hasOwnProperty('body')) {
            if (targetAssetIDs.includes(Number(request.body.asset_id)) || targetAssetIDs.includes(Number(request.body.auth_asset_id))) {
                isTargeted = true;
            }

        } else if (request.hasOwnProperty('asset_id') || request.hasOwnProperty('auth_asset_id')) {
            if (targetAssetIDs.includes(Number(request.asset_id)) || targetAssetIDs.includes(Number(request.auth_asset_id))) {
                isTargeted = true;
            }
        } else {
            isTargeted = false;
        }

        util.writeLogs(message, isTargeted); //Using our own logic

        //logger.info(message); //Winston rotational logs
        var loggerCollectionString = JSON.stringify(loggerCollection);
        sqs.produce(loggerCollectionString, function (err, response) {
            if (err)
                console.log("error is: " + err);
        });
    };

    this.writeSession = function (request) {
        var loggerCollection = {
            message: request,
            request: request,
            environment: global.mode, //'prod'
            log: 'session'
        };
        var loggerCollectionString = JSON.stringify(loggerCollection);
        sqs.produce(loggerCollectionString, function (err, response) {
            if (err)
                console.log("error is: " + err);
        });
    };
};

module.exports = Logger;
