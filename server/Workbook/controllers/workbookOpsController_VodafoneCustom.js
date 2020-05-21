const { serializeError } = require('serialize-error');
const moment = require('moment');

const { Consumer } = require('sqs-consumer');
const AWS = require('aws-sdk');
AWS.config.update({
    "accessKeyId": "AKIAWIPBVOFRSFSVJZMF",
    "secretAccessKey": "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",
    "region": "ap-south-1"
});

const logger = require("../../logger/winstonLogger");
const WorkbookOpsService_VodafoneCustom = require("../services/workbookOpsService_VodafoneCustom");

function WorkbookOpsController_VodafoneCustom(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    const util = objCollection.util;
    const cacheWrapper = objCollection.cacheWrapper;
    const queueWrapper = objCollection.queueWrapper;
    const activityCommonService = objCollection.activityCommonService;

    const workbookOpsService_VodafoneCustom = new WorkbookOpsService_VodafoneCustom(objCollection);


    // Helper methods
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const sqsConsumerApp = Consumer.create({
        queueUrl: 'https://sqs.ap-south-1.amazonaws.com/430506864995/staging-vil-excel-job-queue.fifo',
        handleMessage: async (message) => {
            // console.log("message.Attributes: ", message.Attributes);
            console.log("message.MessageAttributes: ", message.MessageAttributes);
            const request = JSON.parse(message.Body);
            try {
                await workbookOpsService_VodafoneCustom.workbookMappingBotOperation(request);
            } catch (error) {
                logger.error(`Error processing the excel sqs queue message.`, { type: 'excel_sqs_consumer', request_body: request, error: serializeError(error) });
            }
            await sleep(5000);
        },
        sqs: new AWS.SQS(),
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

    sqsConsumerApp.start();
    logger.silly("sqsConsumerApp started", { type: 'excel_sqs_consumer' });
}

module.exports = WorkbookOpsController_VodafoneCustom;
