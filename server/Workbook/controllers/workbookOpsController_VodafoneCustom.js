const { serializeError } = require('serialize-error');
//const moment = require('moment');

const { Consumer } = require('sqs-consumer');
const AWS = require('aws-sdk');
AWS.config.update({
    "accessKeyId": "AKIAWIPBVOFR4QJ3TS6E",
    "secretAccessKey": "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",
    "region": "ap-south-1"
});

const logger = require("../../logger/winstonLogger");
const WorkbookOpsService_VodafoneCustom = require("../services/workbookOpsService_VodafoneCustom");
//const WorkbookOpsService_VodafoneCustom_v1 = require("../services/workbookOpsService_VodafoneCustom_v1");

function WorkbookOpsController_VodafoneCustom(objCollection) {

    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    //const util = objCollection.util;
    //const cacheWrapper = objCollection.cacheWrapper;
    //const queueWrapper = objCollection.queueWrapper;
    //const activityCommonService = objCollection.activityCommonService;

    const workbookOpsService_VodafoneCustom = new WorkbookOpsService_VodafoneCustom(objCollection);
    //const workbookOpsService_VodafoneCustom_v1 = new WorkbookOpsService_VodafoneCustom_v1(objCollection);
   
    app.post('/' + global.config.version + '/excel/s3/upload', async (req, res) => {        
        const [err, responseData] = await workbookOpsService_VodafoneCustom.uploadReadableStreamToS3Method(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/excel/s3/upload | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/excel/s3/download', async (req, res) => {
        const [err, responseData] = await workbookOpsService_VodafoneCustom.downloadExcelFromS3(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/excel/s3/download | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });

    
    /*app.post('/' + global.config.version + '/account/nani/kalyan', async (req, res) => {
        const [err, responseData] = await workbookOpsService_VodafoneCustom_v1.workbookMappingBotOperationV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/excel/s3/download | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });*/

    // Helper methods
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const sqsConsumerApp = Consumer.create({
        //queueUrl: 'https://sqs.ap-south-1.amazonaws.com/430506864995/staging-vil-excel-job-queue.fifo',
        queueUrl: global.config.excelBotSQSQueue,
        handleMessage: async (message) => {            
            // console.log("message.Attributes: ", message.Attributes);
            console.log("message.MessageAttributes: ", message.MessageAttributes);
            const request = JSON.parse(message.Body);
            //console.log('Request params : ', request);
            try {
                const begin=Date.now();
                await workbookOpsService_VodafoneCustom.workbookMappingBotOperation(request);
                //await workbookOpsService_VodafoneCustom_v1.workbookMappingBotOperationV1(request);

                console.log('\n Memory Details');
                console.log('--------------');
                let used = process.memoryUsage();
                for (let key in used) {
                    console.log(`Memory: ${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
                }

                const end= Date.now();

                const timeSpent=(end-begin)/1000+"secs";
                console.log('\n timeSpent - ', timeSpent);
                
            } catch (error) {
                logger.error(`Error processing the excel sqs queue message.`, { type: 'excel_sqs_consumer', request_body: request, error: serializeError(error) });
            }
            console.log(' ');
            console.log('Waiting for 5 seconds before processing next sheet....');
            await sleep(5000);
            console.log('Waiting Done!');
            console.log(' ');
        },
        //sqs: new AWS.SQS(),
        messageAttributeNames: ['Environment']
    });

    sqsConsumerApp.on('error', (error) => {
        logger.silly("[error]: %j", error.message, { type: 'excel_sqs_consumer', error: serializeError(error) });
    });

    sqsConsumerApp.on('processing_error', (error) => {
        logger.silly("[processing_error]: %j", error.message, { type: 'excel_sqs_consumer', error: serializeError(error) });
    });

    sqsConsumerApp.on('timeout_error', (error) => {
        logger.silly("[timeout_error]: %j", error.message, { type: 'excel_sqs_consumer', error: serializeError(error) });
    });

    //sqsConsumerApp.start();
    logger.silly("sqsConsumerApp started", { type: 'excel_sqs_consumer' });
    console.log('queueUrl : ', global.config.excelBotSQSQueue);

    /*var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
    var queueURL = global.config.excelBotSQSQueue;

    var params = {
                    AttributeNames: [
                        "SentTimestamp"
                    ],
                    MaxNumberOfMessages: 1,
                    MessageAttributeNames: [
                        "All"
                    ],
                    QueueUrl: queueURL,
                    VisibilityTimeout: 20,
                    WaitTimeSeconds: 0
                };

    sqs.receiveMessage(params, (err, data) => {
                if (err) {
                    console.log("Receive Error", err);
                } else if (data.Messages) {
                    console.log(data.Messages);

                    /*var deleteParams = {
                        QueueUrl: queueURL,
                        ReceiptHandle: data.Messages[0].ReceiptHandle
                    };
                    
                    sqs.deleteMessage(deleteParams, function(err, data) {
                        if (err) {
                            console.log("Delete Error", err);
                        } else {
                            console.log("Message Deleted", data);
                        }
                    });
        }
    });*/

}

module.exports = WorkbookOpsController_VodafoneCustom;
