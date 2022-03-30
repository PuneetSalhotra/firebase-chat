/*
 * author: Sri Sai Venkatesh
 */
const pubnubWrapper = new(require('../utils/pubnubWrapper'))(); //BETA
//const pusherWrapper = new(require('../utils/pusherWrapper'))();
//var PDFDocument = require('pdfkit');
//var AwsSss = require('../utils/s3Wrapper');
const logger = require("../logger/winstonLogger");
const { serializeError } = require('serialize-error');

const AWS = require('aws-sdk');
AWS.config.update({
    "accessKeyId": "AKIAWIPBVOFRSFSVJZMF",
    "secretAccessKey": "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",
    "region": "ap-south-1"
});
const sqs = new AWS.SQS();
const uuidv4 = require('uuid/v4');

function ActivityTimelineService(objectCollection) {

    let db = objectCollection.db;
    let activityCommonService = objectCollection.activityCommonService;
    let util = objectCollection.util;
    let forEachAsync = objectCollection.forEachAsync;
    // var activityPushService = objectCollection.activityPushService;
    let queueWrapper = objectCollection.queueWrapper;
    const cacheWrapper = objectCollection.cacheWrapper;

    const ActivityPushService = require('../services/activityPushService');
    const activityPushService = new ActivityPushService(objectCollection);

    const moment = require('moment');
    const nodeUtil = require('util');
    const sleep = nodeUtil.promisify(setTimeout);
    const io = objectCollection.io;

    this.addTimelineTransaction = async function (request, callback) {

        util.logInfo(request,`IN addTimelineTransaction :: `);
        // const supressTimelineEntries = [50079,50068, 4609, 50294, 50295, 50264,50403, 50787];
        //const supressTimelineEntries = [50079,50068, 4609, 50294, 50295, 50264,50787,50824, 51087, 51086, 50403];
        
        
        //const self = this;
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        let activityTypeCategoryId = Number(request.activity_type_category_id);
        let activityStreamTypeId = Number(request.activity_stream_type_id);

        let [err, data] = await activityCommonService.workforceFormMappingSelectSuppress(request);
        util.logInfo(request, `workforceFormMappingSelectSuppress ${data.length} %j`);
        if (!err && data.length > 0) {
            activityStreamTypeId = 728;
            request.activity_stream_type_id = 728;
        }
        
        if(activityStreamTypeId == 728) {
           
            let [err, botResponse] = await activityCommonService.getMappedBotSteps({
                organization_id: request.organization_id,
                bot_id: 0,
                form_id: request.form_id,
                field_id: 0,
                start_from: 0,
                limit_value: 1
            }, 0);
            if(botResponse.length > 0) {
                await fireBotEngineInitWorkflow(request);
            }
        }
        
        // if(supressTimelineEntries.includes(Number(request.form_id)) && Number(request.activity_stream_type_id)==713 ){
        //     activityStreamTypeId = 728;
        //     request.activity_stream_type_id = 728;
        // }
        
        activityCommonService.updateAssetLocation(request, function (err, data) {});

        if (activityTypeCategoryId === 9 && activityStreamTypeId === 705) { // add form case
            setTimeout(() => {
                getActivityIdBasedOnTransId(request)
                    .then(async (data) => {
                        if (data.length > 0) {

                            //act id in request is different from retrieved one
                            // Adding 705 entires onto a diff file not a dedicated file
                            //Should not do Form Transaction Insertion as it is not a dedicated file
                            util.logInfo(request,`request.activity_id - ${request.activity_id} data[0].activity_id - ${data[0].activity_id}`);
                            if (Number(request.activity_id) !== Number(data[0].activity_id)) {
                                util.logInfo(request,`Activity_ID from request is different from retrived Activity_id hence proceeding `);
                                request.data_activity_id = Number(data[0].activity_id); //Dedicated file activity id
                                request.non_dedicated_file = 1;

                                //retrievingFormIdandProcess(request, data).then(()=>{});                   
                                if (Number(request.organization_id) === 860 || Number(request.organization_id) === 858 ||
                                    Number(request.organization_id) === 868) {
                                    await retrievingFormIdandProcess(request, data).then(() => {});

                                    // [VODAFONE] Patch | Needs to be removed eventually
                                    if (
                                        Number(request.activity_stream_type_id) === 705 &&
                                        request.hasOwnProperty("workflow_activity_id") &&
                                        Number(request.workflow_activity_id) !== 0 &&
                                        Number(request.workflow_activity_id) === Number(request.activity_id)
                                    ) {
                                        try {
                                            let targetFormGenerationRequest = Object.assign({}, request);
                                            targetFormGenerationRequest.workflow_activity_id = Number(request.activity_id)
                                            initiateTargetFormGeneration(targetFormGenerationRequest);
                                        } catch (error) {
                                            util.logError(request,`[VODAFONE] Patch | Error firing initiateTargetFormGeneration:`, { type: 'timeline', error: serializeError(error) });
                                        }
                                    }
                                } else {
                                    timelineStandardCalls(request)
                                        .then(() => {})
                                        .catch((err) => {
                                            util.logError(request,`Error in timelineStandardCalls`, { type: 'timeline', error: serializeError(err) });
                                        });
                                }

                            } else {
                                lutil.logInfo(request,` Activity_ID from request is same as retrived Activity_id hence checking for device os id 7`);

                                //705 for Dedicated file
                                if (Number(request.device_os_id) === 7) {
                                    //retrievingFormIdandProcess(request, data).then(()=>{});

                                    if (Number(request.organization_id) === 860 || Number(request.organization_id) === 858 ||
                                        Number(request.organization_id) === 868) {
                                        retrievingFormIdandProcess(request, data).then(() => {});
                                    } else {
                                        timelineStandardCalls(request).then(() => {}).catch((err) => {
                                            util.logError(request,`Error in timelineStandardCalls`, { type: 'timeline', error: serializeError(err) });
                                        });
                                    }

                                    //Form Transaction Insertion should happen only for dedicated files
                                    addFormEntries(request, function (err, approvalFieldsArr) {});
                                }

                                if (Number(request.device_os_id) === 8) {
                                    util.logInfo(request,`Activity_ID from request is same as retrived Activity_id and device_os_id 8`);
                                    // If request for dedicated file, and if there should not be any form entries for this
                                    // timeline transaction request
                                    retrievingFormIdandProcess(request, data).then(() => {});
                                }
                            }
                        } else {
                            util.logInfo(request,`There is no data hence checking for device os id`);

                            if (Number(request.device_os_id) === 7) { //7 means calling internal from services
                                //retrievingFormIdandProcess(request, data).then(()=>{});  
                                if (Number(request.organization_id) === 860 || Number(request.organization_id) === 858 || Number(request.organization_id) === 868) {
                                    retrievingFormIdandProcess(request, data).then(() => {});
                                } else {
                                    timelineStandardCalls(request).then(() => {}).catch((err) => {
                                        util.logError(request,`Error in timelineStandardCalls`, { type: 'timeline', error: serializeError(err) });
                                    });
                                }

                                //Form Transaction Insertion should happen only for dedicated files
                                addFormEntries(request, function (err, approvalFieldsArr) {});
                            }

                            if (Number(request.device_os_id) === 8 || Number(request.device_os_id) === 5) {
                                request.non_dedicated_file = 1;
                                retrievingFormIdandProcess(request, data).then(() => {});
                            }
                        }
                    }).then(async () => {
                        try {
                            if (activityTypeCategoryId === 9 && request.device_os_id !== 9) {
                                // await fireBotEngineInitForm(request);
                            }
                        } catch (error) {
                            util.logError(request,`addTimelineTransaction | fireBotEngineInitForm | Error:`, { type: 'timeline', error: serializeError(err) });
                        }
                    }).catch(() => {});
            }, 2000);
        } else if (activityTypeCategoryId === 9 && activityStreamTypeId === 713) {

            timelineStandardCalls(request).then(() => {}).catch((err) => {
                util.logError(request,`Error in timelineStandardCalls `, { type: 'timeline', error: serializeError(err) });
            });

        } else if (
            (
                activityTypeCategoryId === 48 || 
                activityTypeCategoryId === 50 || 
                activityTypeCategoryId === 51 ||
                activityTypeCategoryId === 53
            ) &&
            (
                activityStreamTypeId === 713 || 
                activityStreamTypeId === 705 || 
                activityStreamTypeId === 715 || 
                activityStreamTypeId === 716
            )
        ) {

            request.non_dedicated_file = 1;

            setTimeout(() => {
                getActivityIdBasedOnTransId(request)
                    .then(async (data) => {
                        if (data.length > 0) {
                            request.data_activity_id = Number(data[0].activity_id);
                        }
                        await timelineStandardCalls(request)
                            .then(() => {})
                            .catch((err) => {
                                util.logError(request,`Error in timelineStandardCalls `, { type: 'timeline', error: serializeError(err) });
                            });

                        // [VODAFONE]
                        if (activityStreamTypeId === 705) {
                            try {
                                let targetFormGenerationRequest = Object.assign({}, request);
                                targetFormGenerationRequest.workflow_activity_id = Number(request.activity_id)
                                initiateTargetFormGeneration(targetFormGenerationRequest);
                            } catch (error) {
                                util.logError(request,`Error firing initiateTargetFormGeneration:  `, { type: 'timeline', error: serializeError(error) });
                            }
                        }
                        // 
                    }).then(async () => {
                        try {
                            if ((
                                activityTypeCategoryId === 48 ||
                                activityTypeCategoryId === 50 ||
                                activityTypeCategoryId === 51 ||
                                activityTypeCategoryId === 53 ||
                                activityTypeCategoryId === 60
                            ) && request.device_os_id !== 9) {
                                await fireBotEngineInitWorkflow(request);
                            }
                        } catch (error) {
                            util.logError(request,`addTimelineTransaction | fireBotEngineInitWorkflow `, { type: 'timeline_service', error: serializeError(error) });
                        }
                    }).catch(() => {});
            }, 2000);

        } else {
            let [errSuppress, dataSuppress] = await activityCommonService.workforceFormMappingSelectSuppress(request);
            util.logInfo(request, `workforceFormMappingSelectSuppress ${dataSuppress.length} %j`);
            if (errSuppress || dataSuppress.length === 0) {
                request.form_id = 0;
            }

            // if(![50079,50068, 4609, 50294, 50295, 50264,50403].includes(Number(request.form_id))){
            // request.form_id = 0;
            // }
            timelineStandardCalls(request).then(() => {}).catch((err) => {
                util.logError(request,`Error in timelineStandardCalls  `, { type: 'timeline', error: serializeError(err) });
            });
        }

        //If it is a comment with a mention
        //commentWithMentions(request);

        new Promise(() => {
            setTimeout(() => {
                callback(false, {}, 200);
            }, 1500);
        });
        //callback(false, {}, 200);
    };

    this.addTimelineTransactionAsync = async (request) => {
        util.logInfo(request,`IN addTimelineTransactionAsync :: START`);

        //IF      | 9 & 705
        //ELSE IF | 9 & 713
        //ELSE IF | 48,50,51,54 & 705,713,715,716,726
        //ELSE
        // const supressTimelineEntries = [50079,50068, 4609, 50294, 50295, 50264,50403, 50787];
        //const supressTimelineEntries = [50079,50068, 4609, 50294, 50295, 50264,50787,50824, 51087, 51086, 50403];
        
        let responseData = [],
            error = true;

        request['datetime_log'] = util.getCurrentUTCTime();
        let activityTypeCategoryId = Number(request.activity_type_category_id);
        let activityStreamTypeId = Number(request.activity_stream_type_id);
        //console.log("IN addTimelineTransactionAsync form_id:: "+request.form_id + " :: "+supressTimelineEntries.includes(Number(request.form_id)));
        //console.log("IN addTimelineTransactionAsync activity_stream_type_id:: "+request.activity_stream_type_id+" : "+(Number(request.activity_stream_type_id)==713));
        // if(supressTimelineEntries.includes(Number(request.form_id)) && Number(request.activity_stream_type_id)==713){
        //     //console.log("IN addTimelineTransactionAsync Suprress:: ");
        //     activityStreamTypeId = 728;
        //     request.activity_stream_type_id = 728;
        // }
        let [err, data] = await activityCommonService.workforceFormMappingSelectSuppress(request);
        util.logInfo(request, `workforceFormMappingSelectSuppress ${data.length} %j`);
        if (!err && data.length > 0) {
            activityStreamTypeId = 728;
            request.activity_stream_type_id = 728;
        }

        if(activityStreamTypeId == 728) {
           
            let [err, botResponse] = await activityCommonService.getMappedBotSteps({
                organization_id: request.organization_id,
                bot_id: 0,
                form_id: request.form_id,
                field_id: 0,
                start_from: 0,
                limit_value: 1
            }, 0);
            if(botResponse.length > 0) {
                await fireBotEngineInitWorkflow(request);
            }
        }

        util.logInfo(request,` 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 ASYNC - ADD Timeline Transaction - ENTRY 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒`);

        if((activityTypeCategoryId === 48 && activityStreamTypeId === 705) || 
           (activityTypeCategoryId === 48 && activityStreamTypeId === 713) ||
           (activityTypeCategoryId === 48 && activityStreamTypeId === 726) ||
           (activityTypeCategoryId === 54 && activityStreamTypeId === 705) ||
           (activityTypeCategoryId === 55 && activityStreamTypeId === 705) ||
           (activityTypeCategoryId === 31 && activityStreamTypeId === 705) ||
           (activityTypeCategoryId === 63 && activityStreamTypeId === 705) ||
           (activityTypeCategoryId === 60 && activityStreamTypeId === 705)
           ){
            util.logInfo(request,`🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 Bots will be triggerred 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒`);
        }

        await activityCommonService.updateAssetLocationPromise(request);

        if (activityTypeCategoryId === 9 && activityStreamTypeId === 705) { // IF | 9 & 705
            //await sleep(2000);
            let [err, data] = await getActivityIdBasedOnTransIdAsync(request);
            if (data.length > 0) {
                //act id in request is different from retrieved one
                //Adding 705 entires onto a diff file not a dedicated file
                //Should not do Form Transaction Insertion as it is not a dedicated file
                util.logInfo(request,`request.activity_id - ${request.activity_id} data[0].activity_id - ${data[0].activity_id}`);

                if (Number(request.activity_id) !== Number(data[0].activity_id)) {
                    request.data_activity_id = Number(data[0].activity_id); //Dedicated file activity id
                    request.non_dedicated_file = 1;

                    if (Number(request.organization_id) === 860 || 
                        Number(request.organization_id) === 858 ||
                        Number(request.organization_id) === 868) 
                        {
                            await retrievingFormIdandProcessAsync(request, data);

                            // [VODAFONE] Patch | Needs to be removed eventually
                            if (
                                Number(request.activity_stream_type_id) === 705 &&
                                request.hasOwnProperty("workflow_activity_id") &&
                                Number(request.workflow_activity_id) !== 0 &&
                                Number(request.workflow_activity_id) === Number(request.activity_id)
                            ) {
                                try {
                                    let targetFormGenerationRequest = Object.assign({}, request);
                                        targetFormGenerationRequest.workflow_activity_id = Number(request.activity_id)
                                    await initiateTargetFormGenerationPromise(targetFormGenerationRequest);
                                } catch (error) {
                                    util.logError(request,`[VODAFONE] Patch | Error firing initiateTargetFormGeneration:`, { type: 'timeline_service', error: serializeError(error) });
                                }
                            }

                        } else { //Organizations other than 860, 858, 868
                            let [err, data] = await timelineStandardCallsAsync(request);
                            (err) ?
                            util.logError(request,`Error in timelineStandardCalls:`, { type: 'timeline_service', error: serializeError(err) }):
                                error=false; 
                        }

                    } else { //Number(request.activity_id) === Number(data[0].activity_id)

                        //705 for Dedicated file
                        if (Number(request.device_os_id) === 7) {                            
                            if (Number(request.organization_id) === 860 || 
                                Number(request.organization_id) === 858 ||
                                Number(request.organization_id) === 868) {
                                    await retrievingFormIdandProcessAsync(request, data);
                            } else {
                                let [err, data] = await timelineStandardCallsAsync(request);
                                (err) ?util.logError(request,`Error in timelineStandardCalls`, { type: 'timeline', error: serializeError(err) }):
                                    error=false; 
                            }
                            
                            //Form Transaction Insertion should happen only for dedicated files
                            await addFormEntriesAsync(request);
                        }

                        if (Number(request.device_os_id) === 8) {
                            util.logInfo(request,`Activity_ID from request is same as retrived Activity_id and device_os_id 8`);
                            // If request for dedicated file, and if there should not be any form entries for this
                            // timeline transaction request
                            await retrievingFormIdandProcessAsync(request, data);
                        }
                    }
            } else { // No DATA from getActivityIdBasedOnTransIdAsync(request);
                util.logInfo(request,`There is no data hence checking for device os id `);
                
                if (Number(request.device_os_id) === 7) { //7 means calling internal from services                    
                    if (Number(request.organization_id) === 860 || 
                        Number(request.organization_id) === 858 || 
                        Number(request.organization_id) === 868) {
                            await retrievingFormIdandProcessAsync(request, data);
                    } else {
                        let [err, data] = await timelineStandardCallsAsync(request);
                        (err) ?
                        util.logError(request,`Error in timelineStandardCalls`, { type: 'timeline_serviec', error: serializeError(err) }):
                            error=false; 
                
                    //Form Transaction Insertion should happen only for dedicated files
                    await addFormEntriesAsync(request);
                }

                if (Number(request.device_os_id) === 8 || Number(request.device_os_id) === 5) {
                    request.non_dedicated_file = 1;
                    await retrievingFormIdandProcessAsync(request, data);
                }
                }
            }
        
        } else if (activityTypeCategoryId === 9 && activityStreamTypeId === 713) { //ELSE IF | 9 & 713
            //Make Standard Timeline Entries
            let [err, data] = await timelineStandardCallsAsync(request);
            (err) ?util.logError(request,`Error in timelineStandardCalls`, { type: 'timeline', error: serializeError(err) }):
                error=false;

        } else if ( //ELSE IF | 48,50,51,53,54,55 & 705,713,715,716
            (
                activityTypeCategoryId === 48 ||
                activityTypeCategoryId === 50 ||
                activityTypeCategoryId === 51 ||
                activityTypeCategoryId === 53 ||
                activityTypeCategoryId === 54 ||
                activityTypeCategoryId === 55 ||
                activityTypeCategoryId === 59 ||
                activityTypeCategoryId === 31 ||
                activityTypeCategoryId === 63 ||
                activityTypeCategoryId === 60
            ) &&
            (
                activityStreamTypeId === 713 ||
                activityStreamTypeId === 705 ||
                activityStreamTypeId === 715 ||
                activityStreamTypeId === 716 ||
                activityStreamTypeId === 726
            )
        ) { 

            request.non_dedicated_file = 1;
            //await sleep(2000);
            
            let [err, data] = await getActivityIdBasedOnTransIdAsync(request);            
            if (data.length > 0) {
                request.data_activity_id = Number(data[0].activity_id);
            }

            //Make Standard Timeline Entrie*
            let [err1, data1] = await timelineStandardCallsAsync(request);
            (err1) ?
            util.logError(request,`Error in timelineStandardCalls`, { type: 'timeline', error: serializeError(err) }):
                error=false;

            // [VODAFONE]
            if (activityStreamTypeId === 705) {
                try {
                    let targetFormGenerationRequest = Object.assign({}, request);
                        targetFormGenerationRequest.workflow_activity_id = Number(request.activity_id);
                    await initiateTargetFormGenerationPromise(targetFormGenerationRequest);
                } catch (error) {
                    util.logError(request,`Error firing initiateTargetFormGeneration: `, { type: 'timeline', error: serializeError(error) });
                }
            }

            //fireBotEngineInitWorkflow
            try {
                if ((
                    activityTypeCategoryId === 48 ||
                    activityTypeCategoryId === 50 ||
                    activityTypeCategoryId === 51 ||
                    activityTypeCategoryId === 53 ||
                    activityTypeCategoryId === 54 ||
                    activityTypeCategoryId === 59 ||
                    activityTypeCategoryId === 31 ||
                    activityTypeCategoryId === 63 ||
                    activityTypeCategoryId === 60
                ) && request.device_os_id !== 9) {
                    await fireBotEngineInitWorkflow(request);
                }
            } catch (error) {
                util.logError(request,`addTimelineTransaction | fireBotEngineInitWorkflow | Error: `, { type: 'timeline', error: serializeError(error) });
            }
        
        }///////////////////////// 
        else { //ELSE PART
            request.form_id = (request.hasOwnProperty('form_id')) ? request.form_id: 0;
            let [err, data] = await timelineStandardCallsAsync(request);
            (err) ?
            util.logError(request,`Error in timelineStandardCalls `, { type: 'timeline', error: serializeError(err) }):
                error=false; 
        }

        //commentWithMentions(request);
        util.logInfo(request,` 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 ASYNC - ADD Timeline Transaction - EXIT  🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒 🕒`);


        return [error, responseData];
    };

    // [VODAFONE]
    function initiateTargetFormGeneration(request) {
        // Process/Workflow ROMS Target Form Generation Trigger
        if (
            Number(request.activity_stream_type_id) === 705 &&
            request.hasOwnProperty("workflow_activity_id") &&
            Number(request.workflow_activity_id) !== 0
        ) {
            //Wait for 5 seconds
            setTimeout(()=>{
                util.logInfo(request,` CALLING buildAndSubmitCafFormV1`);
                const romsTargetFormGenerationEvent = {
                    name: "vodafoneService",
                    service: "vodafoneService",
                    method: "buildAndSubmitCafFormV1",
                    payload: request
                };
                queueWrapper.raiseActivityEvent(romsTargetFormGenerationEvent, request.activity_id, (err, resp) => {
                    if (err) {
                        util.logError(request,`Error in queueWrapper raiseActivityEvent`, { type: 'initiateTargetFormGeneration', error: serializeError(err) });
                    } else {
                        util.logInfo(request,`Response from queueWrapper raiseActivityEvent: %j`,resp);
                    }
                });
            }, 5000);
            
            //console.log('CALLING buildAndSubmitCafFormV1');
            //const romsTargetFormGenerationEvent = {
            //    name: "vodafoneService",
            //    service: "vodafoneService",
            //    method: "buildAndSubmitCafFormV1",
            //    payload: request
            //};
            //queueWrapper.raiseActivityEvent(romsTargetFormGenerationEvent, request.activity_id, (err, resp) => {
            //    if (err) {
            //        global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
            //        global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
            //    } else {
            //        global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
            //        global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
            //    }
            //});
        }
    }

    function retrievingFormIdandProcess(request, data) {
        return new Promise((resolve, reject) => {

            let activityStreamTypeId = Number(request.activity_stream_type_id);

            if (!request.hasOwnProperty('form_id')) {
                let formDataJson = JSON.parse(request.activity_timeline_collection);
                request.form_id = formDataJson[0]['form_id'];
                let lastObject = formDataJson[formDataJson.length - 1];
                util.logInfo(request,`Last object :  %j`, JSON.stringify(lastObject, null, 2));
                if (lastObject.hasOwnProperty('field_value')) {
                    util.logInfo(request,`Has the field value in the last object`);
                    //remote Analytics
                    if (request.form_id == 325) {
                        monthlySummaryTransInsert(request).then(() => {});
                    }
                }
            }

            // Triggering BOT 1
            if ((Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER))) {

                if (Number(request.organization_id) !== 868) {
                    util.logInfo(request,`[Log] Triggering the BOT 1`);

                    //makeRequest to /vodafone/neworder_form/queue/add
                    let newRequest = Object.assign({}, request);
                        newRequest.activity_inline_data = {};
                    
                    activityCommonService.makeRequest(newRequest, "vodafone/neworder_form/queue/add", 1).then((resp) => {
                        util.logInfo(request,`resp %j`,resp);
                    });
                }
            }

            //Triggering BOT 2
            if ((Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.FR) ||
                    Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.CRM))) {
                        util.logInfo(request,`[Log] Triggering the BOT 2`);

                activityCommonService.makeRequest(request, "vodafone/customer_form/add", 1).then((resp) => {
                    util.logInfo(request,`resp %j`,resp);
                });
            }

            //BOT to send email on CRM form submission
            //if (Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.CRM) && Number(request.device_os_id) === 7) {
            if (Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.CRM) && Number(request.non_dedicated_file) === 1) {
                util.logInfo(request,`[Log] Triggering BOT to send email on CRM form submission`);
                let newRequest = Object.assign({}, request);
                const crmFormData = JSON.parse(request.activity_inline_data);

                crmFormData.forEach(formEntry => {
                    switch (Number(formEntry.field_id)) {

                        case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Company_Name:
                            newRequest.first_name = formEntry.field_value;
                            newRequest.contact_company = formEntry.field_value;
                            break;
                        case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Number:
                            if (String(formEntry.field_value).includes('||')) {
                                newRequest.contact_phone_country_code = String(formEntry.field_value).split('||')[0];
                                newRequest.contact_phone_number = String(formEntry.field_value).split('||')[1];
                            } else {
                                newRequest.contact_phone_country_code = 91;
                                newRequest.contact_phone_number = formEntry.field_value;
                            }
                            break;
                        case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Email:
                            newRequest.contact_email_id = formEntry.field_value;
                            break;
                        case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Designation:
                            newRequest.contact_designation = formEntry.field_value;
                            break;
                    }
                });

                activityCommonService.makeRequest(newRequest, "vodafone/send/email", 1).then((resp) => {
                    util.logInfo(request,`resp %j`,resp);
                });
            }

            //Generic Function to updated the CAF percentage
            updateCAFPercentage(request).then(() => {});

            // [VODAFONE] Listen for Account Manager Approval or Customer (Service Desk) Approval Form
            // [VODAFONE] The above no longer applies. New trigger on CRM Acknowledgement Form submission.

            const CRM_ACKNOWLEDGEMENT_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM_ACKNOWLEDGEMENT;

            if (activityStreamTypeId === 705 && (Number(request.form_id) === Number(CRM_ACKNOWLEDGEMENT_FORM_ID))) {
                console.log('CALLING approvalFormsSubmissionCheck');
                const approvalCheckRequestEvent = {
                    name: "vodafoneService",
                    service: "vodafoneService",
                    method: "approvalFormsSubmissionCheck",
                    payload: request
                };
                // queueWrapper.raiseActivityEvent(approvalCheckRequestEvent, request.activity_id, (err, resp) => {
                //     if (err) {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     } else {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     }
                // });
            }
            //
            // 
            // [VODAFONE] Provided the form file has submissions for New Order, FR, CRM and HLD, 
            // only then proceed with CAF Form building
            const NEW_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER,
                FR_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.FR,
                CRM_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM,
                HLD_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.HLD;

            if (
                activityStreamTypeId === 705 &&
                (
                    Number(request.form_id) === NEW_ORDER_FORM_ID || // New Order
                    Number(request.form_id) === FR_FORM_ID || // FR
                    Number(request.form_id) === CRM_FORM_ID || // CRM
                    Number(request.form_id) === HLD_FORM_ID // HLD
                )
            ) {
                console.log('CALLING buildAndSubmitCafForm');
                const approvalCheckRequestEvent = {
                    name: "vodafoneService",
                    service: "vodafoneService",
                    method: "buildAndSubmitCafForm",
                    payload: request
                };
                // queueWrapper.raiseActivityEvent(approvalCheckRequestEvent, request.activity_id, (err, resp) => {
                //     if (err) {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     } else {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     }
                // });

            }
            //
            // 
            // [VODAFONE] Alter the status of the form file to Approval Pending. Also modify the 
            // last status alter time and current status for all the queue activity mappings.
            const OMT_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.OMT_APPROVAL;
            const CUSTOMER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL;

            if (
                activityStreamTypeId === 705 &&
                (
                    Number(request.form_id) === CUSTOMER_APPROVAL_FORM_ID
                )
            ) {
                console.log('CALLING setStatusApprovalPendingAndFireEmail');
                const omtApprovalRequestEvent = {
                    name: "vodafoneService",
                    service: "vodafoneService",
                    method: "setStatusApprovalPendingAndFireEmail",
                    payload: request
                };
                // queueWrapper.raiseActivityEvent(omtApprovalRequestEvent, request.activity_id, (err, resp) => {
                //     if (err) {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     } else {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     }
                // });
            }
            //
            // 
            // [VODAFONE] Customer Management Approval Workflow
            if (activityStreamTypeId === 705 &&
                (Number(request.form_id) === global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL)) {
                console.log('CALLING customerManagementApprovalWorkflow');
                const omtApprovalRequestEvent = {
                    name: "vodafoneService",
                    service: "vodafoneService",
                    method: "customerManagementApprovalWorkflow",
                    payload: request
                };
                // queueWrapper.raiseActivityEvent(omtApprovalRequestEvent, request.activity_id, (err, resp) => {
                //     if (err) {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     } else {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     }
                // });
            }

            // Process/Workflow ROMS Target Form Generation Trigger
            // if (
            //     activityStreamTypeId === 705 &&
            //     request.hasOwnProperty("workflow_activity_id") &&
            //     Number(request.workflow_activity_id) !== 0
            // ) {
            //     console.log('CALLING buildAndSubmitCafFormV1');
            //     const romsTargetFormGenerationEvent = {
            //         name: "vodafoneService",
            //         service: "vodafoneService",
            //         method: "buildAndSubmitCafFormV1",
            //         payload: request
            //     };
            //     queueWrapper.raiseActivityEvent(romsTargetFormGenerationEvent, request.activity_id, (err, resp) => {
            //         if (err) {
            //             global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
            //             global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
            //         } else {
            //             global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
            //             global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
            //         }
            //     });
            // }

            timelineStandardCalls(request).then(() => {}).catch((err) => {
                util.logError(request,`Error in timelineStandardCalls`, { type: 'retrievingFormIdandProcess', error: serializeError(err) });
            });
            resolve();
        });
    }

    function timelineStandardCalls(request) {
        return new Promise((resolve, reject) => {

            let formDataJson = null;
            try {
                formDataJson = JSON.parse(request.activity_timeline_collection);
            } catch (exception) {
                util.logError(request,`exception`, { type: 'timelineStandardCalls', error: serializeError(exception) });
            }

            let activityStreamTypeId = Number(request.activity_stream_type_id);
            let activityTypeCategoryId = Number(request.activity_type_category_id);
            let isAddToTimeline = true;

            if (request.hasOwnProperty('flag_timeline_entry'))
                isAddToTimeline = (Number(request.flag_timeline_entry)) > 0 ? true : false;

            if (isAddToTimeline) {
                activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {
                    if (err) {
                        util.logError(request,`timelineStandardCalls`, { type: 'timelineStandardCalls', error: serializeError(err) });
                    } else {

                        // activityPushService.sendPush(request, objectCollection, 0, function () {});
                        try {
                            if (
                                (request.hasOwnProperty("is_child_order") && Boolean(request.is_child_order) === true) &&
                                (
                                    Number(request.activity_type_category_id) === 9 ||
                                    Number(request.activity_type_category_id) === 48
                                )
                            ) {
                                throw new Error("ChildOrder::NoPush")
                            }
                            if(activityStreamTypeId !== 711 && activityStreamTypeId !== 111 && activityStreamTypeId !== 112 && activityStreamTypeId !== 113 && activityStreamTypeId !== 734) {
                                activityPushService.sendPush(request, objectCollection, 0, function () {});
                            }
                        } catch (error) {
                            util.logError(request,`[WARNING] No Push Sent: `, { type: 'timelineStandardCalls', error: serializeError(error) });
                        }
                        activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});

                        //updating log differential datetime for only this asset
                        activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {});

                        //(request.hasOwnProperty('signedup_asset_id')) ?
                        //activityCommonService.updateActivityLogLastUpdatedDatetime(request, 0, function (err, data) {}): //To increase unread cnt for marketing manager
                        //    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});

                        if(request.hasOwnProperty('signedup_asset_id')) {
                            activityCommonService.updateActivityLogLastUpdatedDatetime(request, 0, function (err, data) {}); //To increase unread cnt for marketing manager
                        } else {
                            if(activityStreamTypeId === 711 || activityStreamTypeId === 734) {
                                //Do Nothing
                                //Send Push only to the Owner Asset ID
                            } else {
                                activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});
                            }
                        }

                        // Telephone module
                        // 23003 => Added an update to the chat
                        if (activityTypeCategoryId === 16 && activityStreamTypeId === 23003) {

                            // Update last updated and last differential datetime for the sender
                            activityCommonService.activityAssetMappingUpdateLastUpdateDateTimeOnly(request, function (err, data) {
                                activityCommonService.getActivityDetails(request, request.activity_id, function (err, data) {

                                    // Replace/append the new chat message to the existing inline data
                                    let updatedActivityInlineData = JSON.parse(data[0].activity_inline_data);
                                    updatedActivityInlineData.message = JSON.parse(request.activity_timeline_collection);

                                    // Update the activity's inline data with the last send chat message
                                    activityCommonService.activityAssetMappingUpdateInlineDataOnly(request, JSON.stringify(updatedActivityInlineData), () => {});
                                });

                            });
                        }

                        if (formDataJson.hasOwnProperty('asset_reference')) {
                            if (formDataJson.asset_reference.length > 0) {
                                forEachAsync(formDataJson.asset_reference, function (next, rowData) {
                                    switch (Number(request.activity_type_category_id)) {
                                        case 10:
                                        case 11:
                                            activityPushService.sendSMSNotification(request, objectCollection, rowData.asset_id, function () {});
                                            break;
                                    }
                                    next();
                                }).then(function () {

                                });
                            }
                        } else {
                            util.logError(request,`asset_reference is not available`, { type: 'timelinestandardcall' });
                        }
                    }
                });
                resolve();
            }
        });
    }

    this.timelineStandardCallsAsyncV1 =async (request)=> {
        util.logInfo(request,`timelineStandardCallsAsyncV1`);
        let responseData = [],
            error = false;

        // try {
        //     var formDataJson = JSON.parse(request.activity_timeline_collection);
        // } catch (exception) {
        //     global.logger.write('debug', exception, {}, request);
        // }

        let activityStreamTypeId = Number(request.activity_stream_type_id);
        let activityTypeCategoryId = Number(request.activity_type_category_id);
        let isAddToTimeline = true;
        let [err, data] = await activityCommonService.activityTimelineTransactionInsertAsync(request, {}, activityStreamTypeId);
        let activityData = await activityCommonService.getActivityDetailsPromise(request, request.activity_id);
        let activity_lead_asset_id = activityData[0].activity_lead_asset_id; 
        let activity_creator_asset_id = activityData[0].activity_creator_asset_id;
        if(activity_lead_asset_id&&activity_lead_asset_id>0){ 
        await activityCommonService.updateActivityLogLastUpdatedDatetimeV1(request, Number(activity_lead_asset_id));
        await activityPushService.sendPushAsync(request, objectCollection, activity_lead_asset_id,Number(activity_lead_asset_id));
        }
        if(activity_creator_asset_id&&activity_creator_asset_id>0){ 
            await activityCommonService.updateActivityLogLastUpdatedDatetimeV1(request, Number(activity_creator_asset_id));
            await activityPushService.sendPushAsync(request, objectCollection, activity_creator_asset_id,Number(activity_creator_asset_id));
        }
        return [error,responseData]
    }

    async function timelineStandardCallsAsync(request) {
        util.logInfo(request,`In timelineStandardCallsAsync`);
        let responseData = [],
            error = true;

        let formDataJson = null;
        try {
            formDataJson = JSON.parse(request.activity_timeline_collection);
        } catch (exception) {
            util.logError(request,`exception`, { type: 'timeline_stanadard', error: serializeError(exception) });
        }

        let activityStreamTypeId = Number(request.activity_stream_type_id);
        let activityTypeCategoryId = Number(request.activity_type_category_id);
        let isAddToTimeline = true;
        
        if((activityTypeCategoryId === 48 || 
            activityTypeCategoryId === 53 ||
            activityTypeCategoryId === 54 ) && 
            (activityStreamTypeId === 705 ||
                activityStreamTypeId === 713))
                {
            //Add extra key to the activity_timeline_colletion
            let activityTimelineCollection = (typeof request.activity_timeline_collection === 'string') ?
            JSON.parse(request.activity_timeline_collection) :
            request.activity_timeline_collection;


            //let activityTimelineCollection = JSON.parse(request.activity_timeline_collection);
            //console.log('activityTimelineCollection - ', activityTimelineCollection);

            let [err, data] = await getPreviewEnabledFields(request);

            let formInlineData = activityTimelineCollection.form_submitted || [];
            let formFieldPreviewEnabled = [];
            formInlineData = (typeof formInlineData === 'string') ?
            JSON.parse(formInlineData) : formInlineData;

            for(const i of formInlineData) {
                for(const j of data) {                
                    if(i.field_id == j.field_id) {
                        let temp = {};
                        temp.field_name = i.field_name;
                        temp.field_value = i.field_value;

                        if(i.field_data_type_id == 59 || i.field_data_type_id == 57 ) {
                            try {
                                console.log('i.field_value',i.field_value)
                                temp.field_value = i.field_value.split('|')[1]; //get the name
                            } catch (e) {
                                util.logError(request,`Could not parse the data type id ${i.field_data_type_id} ${i.field_value}`, { type: 'timeline_stanadard', error: serializeError(e) });
                            }
                        }
                        formFieldPreviewEnabled.push(temp);
                    }
                }
            }

            activityTimelineCollection.form_field_preview_enabled = formFieldPreviewEnabled;
            //console.log('activityTimelineCollection - ', activityTimelineCollection);
            request.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
        }

        if (request.hasOwnProperty('flag_timeline_entry'))
            isAddToTimeline = (Number(request.flag_timeline_entry)) > 0 ? true : false;
     
            if (isAddToTimeline) {
                let [err, data] = await activityCommonService.activityTimelineTransactionInsertAsync(request, {}, activityStreamTypeId);
                if(!err) {
                    error=false;
                    try {
                        if (
                            (request.hasOwnProperty("is_child_order") && Boolean(request.is_child_order) === true) &&
                            (
                                Number(request.activity_type_category_id) === 9 ||
                                Number(request.activity_type_category_id) === 48
                            )
                        ) {
                            throw new Error("ChildOrder::NoPush");
                        }
                        if(activityStreamTypeId !== 711 || activityStreamTypeId !== 734) {
                            await activityPushService.sendPushAsync(request, objectCollection, 0);
                        }                        
                    } catch (err) {
                        util.logError(request,`[WARNING] No Push Sent:`, { type: 'timeline_service', error: serializeError(err) });
                    }
                            
                    await activityCommonService.assetTimelineTransactionInsertAsync(request, {}, activityStreamTypeId);
    
                    //updating log differential datetime for only this asset
                    await activityCommonService.updateActivityLogDiffDatetimeAsync(request, request.asset_id);
    
                    //(request.hasOwnProperty('signedup_asset_id')) ?
                    //    await activityCommonService.updateActivityLogLastUpdatedDatetimeAsync(request, 0): //To increase unread cnt for marketing manager
                    //    await activityCommonService.updateActivityLogLastUpdatedDatetimeAsync(request, Number(request.asset_id));
    
                    if(request.hasOwnProperty('signedup_asset_id')) {
                        await activityCommonService.updateActivityLogLastUpdatedDatetime(request, 0); //To increase unread cnt for marketing manager
                    } else {
                        if(activityStreamTypeId === 711 || activityStreamTypeId === 734 ) {
                            //Do Nothing                            
                        } else {
                            await activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id));
                        }
                    }

                    // Telephone module
                    // 23003 => Added an update to the chat
                    if (activityTypeCategoryId === 16 && activityStreamTypeId === 23003) {
                        // Update last updated and last differential datetime for the sender
                        await activityCommonService.activityAssetMappingUpdateLastUpdateDateTimeOnlyAsync(request);
                        try{
                            let [err, data] = await activityCommonService.getActivityDetailsPromise(request, request.activity_id); 
                            
                            // Replace/append the new chat message to the existing inline data
                            let updatedActivityInlineData = JSON.parse(data[0].activity_inline_data);
                            updatedActivityInlineData.message = JSON.parse(request.activity_timeline_collection);
                            
                            // Update the activity's inline data with the last send chat message
                            activityCommonService.activityAssetMappingUpdateInlineDataOnly(request, JSON.stringify(updatedActivityInlineData), ()=>{});
                        } catch(err) {
                            util.logError(request,`Error`, { type: 'timeline_standard', error: serializeError(err) });
                        }
                    }
    
                    if (formDataJson.hasOwnProperty('asset_reference')) {
                        let assetData = formDataJson.asset_reference;
                        if (assetData.length > 0) {
                            for(let i=0; i<assetData.length; i++) {
                                switch (Number(request.activity_type_category_id)) {
                                    case 10:
                                    case 11:
                                        activityPushService.sendSMSNotification(request, objectCollection, assetData.asset_id, ()=>{});
                                        break;
                                }
                            }
                        }
                    } else {
                        util.logInfo(request,`asset_reference is not available`);
                    }
                }
            } //end of if (isAddToTimeline)
            else { //if addtimelineEntry is false
                error = false;
            }

        return [error, responseData];
    }

    //To update the workflow percentage
    this.workflowPercentageUpdate = async function (request) {
        return await updateCAFPercentage(request);
    };

    function updateCAFPercentage(request) {
        return new Promise((resolve, reject) => {

            let newrequest = Object.assign({}, request);

            (Number(request.organization_id) === 860 || Number(request.organization_id) === 858 || Number(request.organization_id) === 868) ?
            newrequest.asset_id = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID:
                newrequest.asset_id = request.asset_id;

            let cafCompletionPercentage = 0;

            if (Number(newrequest.organization_id) === 858 || Number(newrequest.organization_id) === 860) {
                switch (Number(newrequest.form_id)) {
                    //case global.vodafoneConfig[newrequest.organization_id].FORM_ID.NEW_ORDER:
                    //cafCompletionPercentage = 3;
                    //break;
                    //case global.vodafoneConfig[newrequest.organization_id].FORM_ID.ORDER_SUPPLEMENTARY:
                    //cafCompletionPercentage = 20;
                    //  cafCompletionPercentage = 23;
                    //break;
                    case global.vodafoneConfig[newrequest.organization_id].FORM_ID.FR:
                        cafCompletionPercentage = 5;
                        break;
                    case global.vodafoneConfig[newrequest.organization_id].FORM_ID.CRM:
                        cafCompletionPercentage = 7;
                        break;
                    case global.vodafoneConfig[newrequest.organization_id].FORM_ID.HLD:
                        cafCompletionPercentage = 12;
                        break;
                    case global.vodafoneConfig[newrequest.organization_id].FORM_ID.NEW_CUSTOMER:
                    case global.vodafoneConfig[newrequest.organization_id].FORM_ID.EXISTING_CUSTOMER:
                        cafCompletionPercentage = 5;
                        break;
                    case global.vodafoneConfig[newrequest.organization_id].FORM_ID.OMT_APPROVAL:
                        cafCompletionPercentage = 1;
                        break;
                    case global.vodafoneConfig[newrequest.organization_id].FORM_ID.ACCOUNT_MANAGER_APPROVAL:
                        cafCompletionPercentage = 1;
                        break;
                    case global.vodafoneConfig[newrequest.organization_id].FORM_ID.CUSTOMER_APPROVAL:
                        cafCompletionPercentage = 1;
                        break;
                        // case global.vodafoneConfig[newrequest.organization_id].FORM_ID.CAF:
                        //     cafCompletionPercentage = 45;
                        //     break;
                    default:
                        cafCompletionPercentage = newrequest.workflow_completion_percentage || 0;
                }
            }


            console.log('cafCompletionPercentage : ', cafCompletionPercentage);

            if (cafCompletionPercentage !== 0) {

                //Adding to OMT Queue                
                newrequest.start_from = 0;
                newrequest.limit_value = 1;

                //Updating in the OMT QUEUE
                //Get the Queue ID
                activityCommonService.fetchQueueByQueueName(newrequest, "OMT").then((resp) => {
                    console.log('Queue Data : ', resp);

                    //Checking the queuemappingid
                    activityCommonService.fetchQueueActivityMappingId(newrequest, resp[0].queue_id).then((queueActivityMappingData) => {
                        console.log('queueActivityMappingData : ', queueActivityMappingData);

                        if (queueActivityMappingData.length > 0) {

                            let queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;
                            let queueActMapInlineData = JSON.parse(queueActivityMappingData[0].queue_activity_mapping_inline_data);
                            queueActMapInlineData.queue_sort.caf_completion_percentage += cafCompletionPercentage;

                            console.log('Updated Queue JSON : ', queueActMapInlineData);

                            activityCommonService.queueActivityMappingUpdateInlineData(newrequest, queueActivityMappingId, JSON.stringify(queueActMapInlineData)).then((data) => {
                                console.log('Updating the Queue Json : ', data);
                                activityCommonService.queueHistoryInsert(newrequest, 1402, queueActivityMappingId).then(() => {});
                            }).catch((err) => {
                                //global.logger.write('debug', err, {}, newrequest);
                                util.logError(request,`queueActivityMappingUpdateInlineData debug Error %j`, { err,newrequest });
                            });

                        }
                    });
                });
                ////////////////////////////////

                //Updating in the HLD QUEUE
                //Get the Queue ID
                activityCommonService.fetchQueueByQueueName(newrequest, "HLD").then((resp) => {
                    console.log('Queue Data : ', resp);

                    //Checking the queuemappingid
                    activityCommonService.fetchQueueActivityMappingId(newrequest, resp[0].queue_id).then((queueActivityMappingData) => {
                        console.log('queueActivityMappingData : ', queueActivityMappingData);

                        if (queueActivityMappingData.length > 0) {

                            let queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;
                            let queueActMapInlineData = JSON.parse(queueActivityMappingData[0].queue_activity_mapping_inline_data);
                            queueActMapInlineData.queue_sort.caf_completion_percentage += cafCompletionPercentage;

                            console.log('Updated Queue JSON : ', queueActMapInlineData);

                            activityCommonService.queueActivityMappingUpdateInlineData(newrequest, queueActivityMappingId, JSON.stringify(queueActMapInlineData)).then((data) => {
                                console.log('Updating the Queue Json : ', data);
                                activityCommonService.queueHistoryInsert(newrequest, 1402, queueActivityMappingId).then(() => {});
                            }).catch((err) => {
                                //global.logger.write('debug', err, {}, newrequest);
                                util.logError(request,`queueActivityMappingUpdateInlineData debug Error %j`, { err,newrequest });
                            });

                        }
                    });
                });

            }

            resolve();
        });

    }

    async function fireBotEngineInitForm(request) {
        try {
            let botEngineRequest = Object.assign({}, request);
            botEngineRequest.form_id = request.activity_form_id || request.form_id;
            botEngineRequest.field_id = 0;
            botEngineRequest.flag = 3;

            const [formConfigError, formConfigData] = await activityCommonService.workforceFormMappingSelect(botEngineRequest);
            if (
                (formConfigError === false) &&
                (Number(formConfigData.length) > 0) &&
                (Number(formConfigData[0].form_flag_workflow_enabled) === 1) &&
                (Number(formConfigData[0].form_flag_workflow_origin) === 0)
            ) {
                // Proceeding because there was no error found, there were records returned
                // and form_flag_workflow_enabled is set to 1
                let botsListData = await activityCommonService.getBotsMappedToActType(botEngineRequest);
                if (botsListData.length > 0) {
                    botEngineRequest.bot_id = botsListData[0].bot_id;
                    botEngineRequest.bot_inline_data = botsListData[0].bot_inline_data;
                    botEngineRequest.flag_check = 1;
                    botEngineRequest.flag_defined = 1;

                    let result = await activityCommonService.botOperationInsert(botEngineRequest);
                    // console.log('RESULT : ', result);
                    if (result.length > 0) {
                        botEngineRequest.bot_transaction_id = result[0].bot_transaction_id;
                    }

                    // Bot log - Bot is defined
                    activityCommonService.botOperationFlagUpdateBotDefined(botEngineRequest, 1);

                    let botEngineRequestHandleType = global.config.BOT_ENGINE_REQUEST_HANDLE_TYPE;
                    util.logInfo(request, `[BotEngineTrigger] Bot Engine request handle type ${botEngineRequestHandleType} %j`, { request: botEngineRequest });

                    botEngineRequestHandleType = botEngineRequestHandleType.toLowerCase();
                    switch (botEngineRequestHandleType) {
                        case "api":
                            util.logInfo(request, `Bot Engine trigerring via ${botEngineRequestHandleType}`);
                            botEngineRequest.bot_trigger_source_id = 14;
                            const [botTransactionId, messageID] = await util.handleBotTransactionInsertForApi(botEngineRequest);
                            botEngineRequest.sqs_bot_transaction_id = botTransactionId;
                            botEngineRequest.message_id = messageID;
                            await activityCommonService.makeRequest(botEngineRequest, "engine/bot/init", 1)
                                .then((resp) => {
                                    //global.logger.write('debug', "Bot Engine Trigger Response: " + JSON.stringify(resp), {}, request);
                                    util.logInfo(request,`makeRequest engine/bot/init debug Bot Engine Trigger Response: %j`,{Response : JSON.stringify(resp),request});
                                    let temp = JSON.parse(resp);

                                    (Number(temp.status) === 200) ?
                                        botEngineRequest.bot_operation_status_id = 1 :
                                        botEngineRequest.bot_operation_status_id = 2;

                                    botEngineRequest.bot_transaction_inline_data = JSON.stringify(resp);
                                    activityCommonService.botOperationFlagUpdateBotSts(botEngineRequest, 1);
                                }).catch((err) => {
                                    // Bot log - Update Bot status with Error
                                    botEngineRequest.bot_transaction_inline_data = JSON.stringify(err);
                                    activityCommonService.botOperationFlagUpdateBotSts(botEngineRequest, 2);
                                });

                            break;
                        case "sqs":
                            botEngineRequest.bot_trigger_source_id = 3;
                            util.logInfo(request, `Bot Engine trigerring via ${botEngineRequestHandleType}`);
                            util.logInfo(request, `[${request.workflow_activity_id}] Calling Bot Engine from activity service %j`, { botEngineRequest });
                            util.pushBotRequestToSQS(botEngineRequest);
                            break;
                        default:
                            botEngineRequest.bot_trigger_source_id = 4;
                            util.logInfo(request, `Bot Engine trigerring via ${botEngineRequestHandleType}`);
                            util.logInfo(request, `[${request.workflow_activity_id}] Calling Bot Engine from activity service %j`, { botEngineRequest });
                            util.pushBotRequestToSQS(botEngineRequest);
                            break;
                    }

                } else {
                    // Bot is not defined
                    activityCommonService.botOperationFlagUpdateBotDefined(botEngineRequest, 0);
                }
            } else {
                //global.logger.write('debug', "formConfigError: " + formConfigError, {}, request);
                util.logInfo(request,`fireBotEngineInitForm debug formConfigError: %j`,{formConfigError : formConfigError,request});
                //global.logger.write('debug', "formConfigData: ", {}, request);
                util.logInfo(request,`fireBotEngineInitForm debug formConfigData: %j`,{formConfigData : formConfigData,request});
                //global.logger.write('debug', formConfigData, {}, request);
            }
        } catch (botInitError) {
            //global.logger.write('error', botInitError, botInitError, botEngineRequest);
            util.logError(request,`fireBotEngineInitForm error Error %j`, { botInitError,botEngineRequest });
        }
    }

    async function fireBotEngineInitWorkflow(request) {
        try {
            if (
                request.hasOwnProperty("fire_bot_engine") &&
                Number(request.fire_bot_engine) === 0
            ) {
                return;
            }
        } catch (error) {
            util.logError(request,`fireBotEngineInitWorkflow | fire_bot_engine Check | Error: `, { type: 'fireBotEngineInitWorkflow', error: serializeError(error) });
        }
        try {
            let botEngineRequest = Object.assign({}, request);
            botEngineRequest.form_id = request.activity_form_id || request.form_id;
            botEngineRequest.field_id = 0;
            botEngineRequest.altered_field_id = request.field_id;
            botEngineRequest.flag = 3;
            botEngineRequest.workflow_activity_id = request.activity_id;

            const [formConfigError, formConfigData] = await activityCommonService.workforceFormMappingSelect(botEngineRequest);
            if (
                (formConfigError === false) &&
                (Number(formConfigData.length) > 0) &&
                (Number(formConfigData[0].form_flag_workflow_enabled) === 1) // &&
                // (Number(formConfigData[0].form_flag_workflow_origin) === 1)
            ) {
                // Proceeding because there was no error found, there were records returned
                // and form_flag_workflow_enabled is set to 1
                let botsListData = await activityCommonService.getBotsMappedToActType(botEngineRequest);
                if (botsListData.length > 0) {
                    botEngineRequest.bot_id = botsListData[0].bot_id;
                    botEngineRequest.bot_inline_data = botsListData[0].bot_inline_data;
                    botEngineRequest.flag_check = 1;
                    botEngineRequest.flag_defined = 1;
                    // Populate the workflow's activity type ID
                    botEngineRequest.activity_type_id = Number(formConfigData[0].form_workflow_activity_type_id);

                    let result = await activityCommonService.botOperationInsert(botEngineRequest);
                    //console.log('RESULT : ', result);
                    if (result.length > 0) {
                        botEngineRequest.bot_transaction_id = result[0].bot_transaction_id;
                    }

                    //Bot log - Bot is defined
                    await activityCommonService.botOperationFlagUpdateBotDefined(botEngineRequest, 1);

                    util.logInfo(request,`fireBotEngineInitWorkflow | botEngineRequest: `, botEngineRequest);

                    let botEngineRequestHandleType = await global.config.BOT_ENGINE_REQUEST_HANDLE_TYPE;
                    util.logInfo(request, `[BotEngineTrigger] Bot Engine request handle type ${botEngineRequestHandleType} %j`, { request: botEngineRequest });
                    botEngineRequestHandleType = botEngineRequestHandleType.toLowerCase();
                    switch (botEngineRequestHandleType) {
                        case "api":
                            util.logInfo(request,`Bot Engine trigerring via ${botEngineRequestHandleType}`);
                            botEngineRequest.bot_trigger_source_id = 15;
                            const [botTransactionId, messageID] = await util.handleBotTransactionInsertForApi(botEngineRequest);
                            botEngineRequest.sqs_bot_transaction_id = botTransactionId;
                            botEngineRequest.message_id = messageID;
                            await activityCommonService.makeRequest(botEngineRequest, "engine/bot/init", 1)
                                .then(async (resp) => {
                                    util.logInfo(request, `Bot Engine Trigger Response: %j`, resp);
                                    //Bot log - Update Bot status
                                    //1.SUCCESS; 2.INTERNAL ERROR; 3.EXTERNAL ERROR; 4.COMMUNICATION ERROR
                                    //activityCommonService.botOperationFlagUpdateBotSts(botEngineRequest, 1); 
                                    let temp = JSON.parse(resp);

                                    (Number(temp.status) === 200) ?
                                        botEngineRequest.bot_operation_status_id = 1 :
                                        botEngineRequest.bot_operation_status_id = 2;

                                    botEngineRequest.bot_transaction_inline_data = JSON.stringify(resp);
                                    await activityCommonService.botOperationFlagUpdateBotSts(botEngineRequest, 1);
                                }).catch(async (err) => {
                                    //Bot log - Update Bot status with Error
                                    botEngineRequest.bot_transaction_inline_data = JSON.stringify(err);
                                    await activityCommonService.botOperationFlagUpdateBotSts(botEngineRequest, 2);
                                });

                            break;
                        case "sqs":
                            botEngineRequest.bot_trigger_source_id = 5;
                            util.logInfo(request,`Bot Engine trigerring via ${botEngineRequestHandleType}`);
                            util.logInfo(request, `[${request.workflow_activity_id}] Calling Bot Engine from activity service %j`, { botEngineRequest });
                            util.pushBotRequestToSQS(botEngineRequest);
                            break;
                        default:
                            botEngineRequest.bot_trigger_source_id = 6;
                            util.logInfo(request,`Bot Engine trigerring via ${botEngineRequestHandleType}`);
                            util.logInfo(request, `[${request.workflow_activity_id}] Calling Bot Engine from activity service %j`, { botEngineRequest });
                            util.pushBotRequestToSQS(botEngineRequest);
                            break;
                    }

                } else {
                    //Bot is not defined
                    util.logInfo(request,`activitytimelineService - fireBotEngineInitWorkflow - Bot is not defined`);
                    activityCommonService.botOperationFlagUpdateBotDefined(botEngineRequest, 0);
                }
            } else {
                util.logError(request,`formConfigError ${formConfigError}`, { type: 'fireBotEngineInitWorkflow' });
            }
        } catch (botInitError) {
            util.logError(request,`botInitError`, { type: 'fireBotEngineInitWorkflow', error: serializeError(botInitError) });
        }
    }

    //This is to support the feature - Not to increase unread count during timeline entry
    this.addTimelineTransactionV1 = function (request, callback) {
        //console.log('In addTimelineTransactionV1');
        //global.logger.write('conLog', 'In addTimelineTransactionV1', {}, request);
        util.logInfo(request,`conLog In addTimelineTransactionV1 %j`,{request});
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        let activityTypeCategoryId = Number(request.activity_type_category_id);
        let activityStreamTypeId = Number(request.activity_stream_type_id);
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        if (activityTypeCategoryId === 9 && activityStreamTypeId === 705) { // add form case
            let formDataJson = JSON.parse(request.activity_timeline_collection);
            request.form_id = formDataJson[0]['form_id'];
            //console.log('form id extracted from json is: ' + formDataJson[0]['form_id']);
            //global.logger.write('debug', 'form id extracted from json is: ' + formDataJson[0]['form_id'], {}, request);
            util.logInfo(request,`addTimelineTransactionV1 debug form id extracted from json is: %j`,{form_id : formDataJson[0]['form_id'],request});
            let lastObject = formDataJson[formDataJson.length - 1];
            //console.log('Last object : ', lastObject)
            //global.logger.write('debug', 'Last object : ' + JSON.stringify(lastObject, null, 2), {}, request);
            util.logInfo(request,`addTimelineTransactionV1 debug Last object :  %j`,{Last_object : JSON.stringify(lastObject, null, 2),request});
            if (lastObject.hasOwnProperty('field_value')) {
                //console.log('Has the field value in the last object')
                //global.logger.write('conLog', 'Has the field value in the last object', {}, request);
                util.logInfo(request,`addTimelineTransactionV1 Has the field value in the last object %j`,{request});
                //remote Analytics
                if (request.form_id == 325) {
                    monthlySummaryTransInsert(request).then(() => {});
                }
            }
            // add form entries
            addFormEntries(request, function (err, approvalFieldsArr) {
                if (err === false) {
                    //callback(false,{},200);
                } else {
                    //callback(true, {}, -9999);
                }
            });
        } else {
            request.form_id = 0;
        }
        try {
            let formDataJson = JSON.parse(request.activity_timeline_collection);
        } catch (exception) {
            //console.log(exception);
            //global.logger.write('debug', exception, {}, request);
            util.logError(request,`addTimelineTransactionV1 debug Error %j`, { exception,request });
        }

        let isAddToTimeline = true;
        if (request.hasOwnProperty('flag_timeline_entry'))
            isAddToTimeline = (Number(request.flag_timeline_entry)) > 0 ? true : false;
        if (isAddToTimeline) {
            activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {
                if (err) {

                } else {
                    activityPushService.sendPush(request, objectCollection, 0, function () {});
                    activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});

                    //updating log differential datetime for only this asset
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {});

                    if (formDataJson.hasOwnProperty('asset_reference')) {
                        if (formDataJson.asset_reference.length > 0) {
                            forEachAsync(formDataJson.asset_reference, function (next, rowData) {
                                switch (Number(request.activity_type_category_id)) {
                                    case 10:
                                    case 11:
                                        activityPushService.sendSMSNotification(request, objectCollection, rowData.asset_id, function () {});
                                        break;
                                }
                                next();
                            }).then(function () {

                            });
                        }
                    } else {
                        //console.log('asset_reference is not availale');
                        //global.logger.write('conLog', 'asset_reference is not available', {}, request);
                        util.logInfo(request,`activityTimelineTransactionInsert asset_reference is not available %j`,{request});
                    }


                }
            });
        }
        callback(false, {}, 200);
    };


    /*this.addTimelineTransactionVodafone = function (request, callback) {       
                        
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id) || 9;
        var activityStreamTypeId = Number(request.activity_stream_type_id) || 325;
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        if (activityTypeCategoryId === 9 && activityStreamTypeId === 705) {   // add form case
            var formDataJson = JSON.parse(request.activity_timeline_collection);
            request.form_id = formDataJson[0]['form_id'];
            //console.log('form id extracted from json is: ' + formDataJson[0]['form_id']);
            global.logger.write('debug', 'form id extracted from json is: ' + formDataJson[0]['form_id'], {}, request);
            var lastObject = formDataJson[formDataJson.length - 1];
            //console.log('Last object : ', lastObject)
            global.logger.write('debug', 'Last object : ' + lastObject, {}, request);
            if (lastObject.hasOwnProperty('field_value')) {
                //console.log('Has the field value in the last object')
                global.logger.write('debug', 'Has the field value in the last object', {}, request);
                //remote Analytics
                if (request.form_id == 325) {
                    monthlySummaryTransInsert(request).then(() => {
                    });
                }
            }
            // add form entries
            addFormEntries(request, function (err, approvalFieldsArr) {
                if (err === false) {
                    //callback(false,{},200);
                } else {
                    //callback(true, {}, -9999);
                }
            });
        } else {
            request.form_id = 0;
        }
        try {
            var formDataJson = JSON.parse(request.activity_timeline_collection);
        } catch (exception) {
            //console.log(exception);
            global.logger.write('debug', exception, {}, request);
        }

        var isAddToTimeline = true;
        if (request.hasOwnProperty('flag_timeline_entry'))
            isAddToTimeline = (Number(request.flag_timeline_entry)) > 0 ? true : false;
        if (isAddToTimeline) {
            activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {
                if (err) {

                } else {

                    activityPushService.sendPush(request, objectCollection, 0, function () {});
                    activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });

                    //updating log differential datetime for only this asset
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) { });
                    
                    (request.hasOwnProperty('signedup_asset_id')) ? 
                        activityCommonService.updateActivityLogLastUpdatedDatetime(request, 0, function (err, data) { }): //To increase unread cnt for marketing manager
                        activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) { });
                    
                    if(request.auth_asset_id == 31035 && request.flag_status_alter == 1) {
                        
                        var newRequestOne = Object.assign(request);
                                var activityParticipantCollection = [{
                                        "organization_id": 856,
                                        "account_id": 971,
                                        "workforce_id": 5336,
                                        "asset_id": 30983,
                                        "activity_id": request.activity_id,                                        
                                        "asset_type_category_id": 3,
                                        "asset_type_id": 122940,
                                        "access_role_id": 29
                                    }];
                                newRequestOne.organization_id = 856;
                                newRequestOne.account_id = 971;
                                newRequestOne.workforce_id = 5344;    
                            
                                newRequestOne.activity_participant_collection = JSON.stringify(activityParticipantCollection);
                                newRequestOne.message_unique_id = util.getMessageUniqueId(31035);
                                newRequestOne.url = "/" + global.config.version + "/activity/participant/access/set";
                                
                                var event = {
                                    name: "assignParticipnt",
                                    service: "activityParticipantService",
                                    method: "assignCoworker",
                                    payload: newRequestOne
                                };

                                queueWrapper.raiseActivityEvent(event, newRequestOne.activity_id, (err, resp) => {
                                    if (err) {
                                        // console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                        global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);                                        
                                        throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                    } else {
                                        var newRequest = Object.assign(newRequestOne);                                     

                                        newRequest.activity_status_id = 278803;
                                        newRequest.activity_status_type_id = 22;
                                        newRequest.message_unique_id = util.getMessageUniqueId(31035);
                                        newRequest.url = "/" + global.config.version + "/activity/status/alter";

                                        var event = {
                                            name: "alterActivityStatus",
                                            service: "activityService",
                                            method: "alterActivityStatus",
                                            payload: newRequest
                                        };

                                        queueWrapper.raiseActivityEvent(event, newRequest.activity_id, (err, resp) => {
                                            if (err) {
                                                // console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);                                
                                                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                            } else {}                            
                                        });
                                    }
                                    resolve();
                                });                        
                    } 
                    
                    if (formDataJson.hasOwnProperty('asset_reference')) {
                        if (formDataJson.asset_reference.length > 0) {
                            forEachAsync(formDataJson.asset_reference, function (next, rowData) {                                
                                switch (Number(request.activity_type_category_id)) {
                                    case 10:
                                    case 11: 
                                        activityPushService.sendSMSNotification(request, objectCollection, rowData.asset_id, function () {});
                                        break;
                                }
                                next();
                            }).then(function () {

                            });
                        }
                    } else {
                        //console.log('asset_reference is not availale');
                        global.logger.write('debug', 'asset_reference is not available', {}, request);
                    }


                }
            });
        }
        callback(false, {}, 200);
    };*/

    //MONTHLY Remote Analytics
    //Insert into monthly summary table
    function monthlySummaryTransInsert(request) {
        return new Promise((resolve, reject) => {
            let dateTimeLog = util.getCurrentUTCTime();
            request['datetime_log'] = dateTimeLog;

            let avgHours;
            let occupiedDesks;
            let countDesks;
            let noOfDesks;
            getFormTransTimeCardsStats(request).then((data) => {
                request.viewee_workforce_id = request.workforce_id;
                activityCommonService.getOccupiedDeskCounts(request, function (err, result) {
                    if (err === false) {
                        occupiedDesks = result[0].occupied_desks;
                        if (occupiedDesks == 0) {
                            avgHours = 0;
                        } else {
                            avgHours = data[0].totalHours / result[0].occupied_desks;
                        }

                        request.flag = 11;
                        request.viewee_asset_id = request.asset_id;
                        request.viewee_operating_asset_id = request.operating_asset_id;

                        activityCommonService.assetAccessCounts(request, function (err, resp) {
                            if (err === false) {
                                countDesks = resp[0].countDesks;
                                (occupiedDesks > countDesks) ? noOfDesks = occupiedDesks: noOfDesks = countDesks;
                                //insert
                                let paramsArr = new Array(
                                    1, //request.monthly_summary_id,
                                    request.asset_id,
                                    request.workforce_id,
                                    request.account_id,
                                    request.organization_id,
                                    util.getStartDayOfMonth(), //entity_date_1,    //Monthly Month start Date
                                    "", //entity_datetime_1, 
                                    "", //entity_tinyint_1, 
                                    noOfDesks, //entity_bigint_1, //number of desks
                                    avgHours, //entity_double_1, //average hours
                                    data[0].assetHours, //entity_decimal_1, //total number of hours for a asset
                                    "", //entity_decimal_2,
                                    "", //entity_decimal_3, 
                                    data[0].totalHours, //entity_text_1, 
                                    "", //entity_text_2
                                    request.track_latitude,
                                    request.track_longitude,
                                    request.track_gps_accuracy,
                                    request.track_gps_status,
                                    request.track_gps_location,
                                    request.track_gps_datetime,
                                    request.device_manufacturer_name,
                                    request.device_model_name,
                                    request.device_os_id,
                                    request.device_os_name,
                                    request.device_os_version,
                                    request.app_version,
                                    request.api_version,
                                    request.asset_id,
                                    request.message_unique_id,
                                    request.flag_retry || 0,
                                    request.flag_offline || 0,
                                    request.track_gps_datetime,
                                    request.datetime_log
                                );
                                let queryString = util.getQueryString('ds_v1_asset_monthly_summary_transaction_insert', paramsArr);
                                if (queryString != '') {
                                    db.executeQuery(0, queryString, request, function (err, data) {
                                        (err === false) ? resolve(data): reject(err);
                                    });
                                }
                            } else {
                                //Some error -9999 
                            }
                        });
                    }
                });
            });
        });
    }



    //Get total hours of a employee or all employees in an organization
    function getFormTransTimeCardsStats(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.asset_id,
                request.organization_id,
                util.getStartDateTimeOfMonth(),
                util.getEndDateTimeOfMonth()
            );
            let queryString = util.getQueryString('ds_v1_activity_form_transaction_select_timecard_stats', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log('getFormTransTimeCardsStats : \n', data, "\n");
                    //global.logger.write('conLog', 'getFormTransTimeCardsStats : \n' + JSON.stringify(data, null, 2) + "\n", {}, request);
                    util.logInfo(request,`conLog getFormTransTimeCardsStats : %j`,{getFormTransTimeCardsStats : JSON.stringify(data, null, 2),request});
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    }
    //////////////////////////////////////////////////////////

    this.addTimelineComment = function (request, callback) {
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        //IN p_form_transaction_id BIGINT(20), IN p_form_id BIGINT(20), IN p_field_id BIGINT(20), IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20),
        //IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_stream_type_id SMALLINT(6), IN p_entity_text_1 VARCHAR(1200), IN p_entity_text_2 VARCHAR(4800), IN p_location_latitude DECIMAL(12,8), IN p_location_longitude DECIMAL(12,8), IN p_location_gps_accuracy DOUBLE(16,4), IN p_location_gps_enabled TINYINT(1), IN p_location_address VARCHAR(300), IN p_location_datetime DATETIME, IN p_device_manufacturer_name VARCHAR(50), IN p_device_model_name VARCHAR(50), IN p_device_os_id TINYINT(4), IN p_device_os_name VARCHAR(50), IN p_device_os_version VARCHAR(50), IN p_device_app_version VARCHAR(50), IN p_device_api_version VARCHAR(50), IN p_log_asset_id BIGINT(20), IN p_log_message_unique_id VARCHAR(50), IN p_log_retry TINYINT(1), IN p_log_offline TINYINT(1), IN p_transaction_datetime DATETIME, IN p_log_datetime DATETIME

        let paramsArr = new Array(
            request.form_transaction_id,
            request.form_id,
            request.form_field_id,
            request.activity_id,
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.activity_stream_type_id,
            request.comment_text,
            '',
            0.0,
            0.0,
            0.0,
            0,
            '',
            request.track_gps_datetime,
            '',
            '',
            request.device_os_id,
            '',
            '',
            request.app_version,
            request.api_version,
            request.asset_id,
            request.message_unique_id,
            request.flag_retry,
            request.flag_offline,
            request.track_gps_datetime,
            request.datetime_log

        );
        let queryString = util.getQueryString('ds_v1_activity_form_field_timeline_transaction_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                activityCommonService.updateWholeLotForTimelineComment(request, function (err, data) {});
                if (err === false) {
                    callback(false, {}, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, {}, 200);
                    return;
                }
            });
        }
        /*if (request.hasOwnProperty('device_os_id')) {
         if (Number(request.device_os_id) !== 5) {
         //incr the asset_message_counter
         cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
         if (err) {
         //console.log("error in setting in asset parity");
         global.logger.write('serverError','error in setting in asset parity - ' + err, request)
         } else
         //console.log("asset parity is set successfully")
         global.logger.write('debug','asset parity is set successfully', request)
         
         });
         }
         } */

    };

    this.retrieveFormFieldTimeline = function (request, callback) {
        let paramsArr = new Array(
            request.form_transaction_id,
            request.form_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_v1_activity_form_field_timeline_transaction_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatFormFieldTimeline(data, function (err, responseData) {
                        if (err === false) {
                            callback(false, {
                                data: responseData
                            }, 200);
                        } else {
                            callback(false, {}, -9999);
                        }
                    });
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    this.retrieveFormCollection = function (request, callback) {
        //var activityTypeCategoryId = util.replaceZero(request.activity_type_category_id);
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        let paramsArr = new Array(
            request.form_transaction_id,
            request.form_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_v1_activity_form_transaction_select_transaction', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
                if (err === false) {
                    activityCommonService.formatFormDataCollection(data, function (err, responseData) {
                        if (err === false) {
                            callback(false, {
                                data: responseData
                            }, 200);
                            return;
                        } else {
                            callback(false, {}, -9999);
                            return;
                        }
                    });
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    async function orgRateLimitCheckAndSet(organizationID) {
        let isOrgRateLimitExceeded = false;
        try {
            const pushTimestamp = await cacheWrapper.getOrgLastPubnubPushTimestamp(organizationID);
            const timeDiff = moment.utc().diff(moment.utc(pushTimestamp));
            if (moment.duration(timeDiff).asSeconds() <= 120) {
                console.log("ActivityTimelineService | sendPush | timeDiff Duration: ", moment.duration(timeDiff).asSeconds())
                // It's still less than 2 minutes since the last org level push was sent.
                isOrgRateLimitExceeded = true;
            } else {
                const timestampSet = await cacheWrapper.setOrgLastPubnubPushTimestamp(organizationID, moment().utc().format('YYYY-MM-DD HH:mm:ss'));
                console.log("ActivityTimelineService | sendPush | timestampSet: ", timestampSet)
            }
        } catch (error) {
            console.log("ActivityTimelineService | sendPush | isOrgRateLimitExceeded: ", error);
        }
        return isOrgRateLimitExceeded;
    }

    this.retrieveTimelineList = async function (request, callback) {
        // 
        let isOrgRateLimitExceeded = false;
        try {
            isOrgRateLimitExceeded = await orgRateLimitCheckAndSet(Number(request.organization_id));
        } catch (error) {
            console.log("ActivityTimelineService | retrieveTimelineList | orgRateLimitCheckAndSet | Error: ", error);
        }
        // 
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        //console.log('REQUEST - ', request);
        if (
            (Number(request.device_os_id) !== 5) &&
            (Number(request.auth_asset_id) === Number(request.asset_id))
        ) {
            let pubnubMsg = {};
            pubnubMsg.type = 'activity_unread';
            pubnubMsg.organization_id = request.organization_id;
            pubnubMsg.desk_asset_id = request.asset_id;
            pubnubMsg.activity_type_category_id = (Number(request.activity_type_category_id)) === 16 ? 0 : request.activity_type_category_id;
            //console.log('PubNub Message : ', pubnubMsg);
            //global.logger.write('debug', 'PubNub Message : ' + JSON.stringify(pubnubMsg, null, 2), {}, request);
            util.logInfo(request,`retrieveTimelineList debug PubNub Message : %j`,{PubNub_Message : JSON.stringify(pubnubMsg, null, 2),request});
            pubnubWrapper.push(request.asset_id, pubnubMsg, io);
            pubnubWrapper.push(request.organization_id, pubnubMsg, io, isOrgRateLimitExceeded);

            //Send pushes using Pusher
            //let eventName = 'retrieveTimelineList';
            //pusherWrapper.push('asset_' + request.asset_id, pubnubMsg, eventName);
            //pusherWrapper.push('org_' + request.organization_id, pubnubMsg, eventName, isOrgRateLimitExceeded);
        }
        /*if(Number(request.activity_type_category_id) !== 8) {
            activityCommonService.resetAssetUnreadCount(request, 0, function (err, data) {});
        }*/

        switch (Number(request.activity_type_category_id)) {
            case 8:
                break;
            case 9: // Form
                break;
            case 10:
                break;
            case 11:
                break;
            default:
                activityCommonService.resetAssetUnreadCount(request, 0, function (err, data) {});
                break;
        }
        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
        let activityTypeCategoryId = util.replaceZero(request.activity_type_category_id);
        if (activityTypeCategoryId > 0) {
            let paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                request.timeline_transaction_id || 0,
                request.flag_previous,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );
            let queryString = util.getQueryString('ds_v1_activity_timeline_transaction_select_differential', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        formatActivityTimelineList(data, activityTypeCategoryId, function (err, responseData) {
                            if (err === false) {
                                callback(false, {
                                    data: responseData
                                }, 200);
                            } else {
                                callback(false, {}, -9999);
                            }
                        });
                        return;
                    } else {
                        // some thing is wrong and have to be dealt
                        callback(err, false, -9999);
                        return;
                    }
                });
            }

        } else {
            callback(false, {}, -3303);
        }

    };

    this.retrieveTimelineListV1 = async function (request, callback) {
        // 
        let isOrgRateLimitExceeded = false;
        try {
            isOrgRateLimitExceeded = await orgRateLimitCheckAndSet(Number(request.organization_id));
        } catch (error) {
            console.log("ActivityTimelineService | retrieveTimelineListV1 | orgRateLimitCheckAndSet | Error: ", error);
        }
        // 
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        if (
            (Number(request.device_os_id) !== 5) &&
            (Number(request.auth_asset_id) === Number(request.asset_id))
        ) {
            let pubnubMsg = {};
            pubnubMsg.type = 'activity_unread';
            pubnubMsg.organization_id = request.organization_id;
            pubnubMsg.desk_asset_id = request.asset_id;
            pubnubMsg.activity_type_category_id = (Number(request.activity_type_category_id)) === 16 ? 0 : request.activity_type_category_id;
            //console.log('PubNub Message : ', pubnubMsg);
            //global.logger.write('debug', 'PubNub Message : ' + JSON.stringify(pubnubMsg, null, 2), {}, request);
            util.logInfo(request,`retrieveTimelineListV1 debug PubNub Message : %j`,{PubNub_Message : JSON.stringify(pubnubMsg, null, 2),request});
            pubnubWrapper.push(request.asset_id, pubnubMsg, io);
            //pubnubWrapper.push(request.organization_id, pubnubMsg, isOrgRateLimitExceeded);
        }
        /*if(Number(request.activity_type_category_id) !== 8) {
            activityCommonService.resetAssetUnreadCount(request, 0, function (err, data) {});
        }*/

        switch (Number(request.activity_type_category_id)) {
            case 8:
                break;
            case 9: // Form
                break;
            case 10:
                break;
            case 11:
                break;
            default:
                activityCommonService.resetAssetUnreadCount(request, 0, function (err, data) {});
                break;
        }
        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
        let activityTypeCategoryId = util.replaceZero(request.activity_type_category_id);
        if (activityTypeCategoryId > 0) {
            // IN p_organization_id BIGINT(20), IN p_activity_id bigint(20), 
            // IN p_timeline_transaction_id BIGINT(20), IN p_is_previous tinyint(4), 
            // IN p_stream_type_id BIGINT(20), IN p_sort_flag SMALLINT(6), IN p_sort_order TINYINT(4), 
            // IN p_start_from SMALLINT(6), IN p_limit_value smallint(6)
            let paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                request.timeline_transaction_id || 0,
                request.flag_previous,
                request.stream_type_id || 0,
                request.sort_flag || 1, // 1 => Created Datetime/Timeline transaction datetime
                request.sort_order, // 0 => Ascending | 1 => Descending
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );
            let queryString = util.getQueryString('ds_p1_activity_timeline_transaction_select_differential', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        formatActivityTimelineList(data, activityTypeCategoryId, function (err, responseData) {
                            if (err === false) {
                                callback(false, {
                                    data: responseData
                                }, 200);
                            } else {
                                callback(false, {}, -9999);
                            }
                        });
                        return;
                    } else {
                        // some thing is wrong and have to be dealt
                        callback(err, false, -9999);
                        return;
                    }
                });
            }

        } else {
            callback(false, {}, -3303);
        }

    };

    //PAM
    this.retrieveTimelineListBasedOnAsset = function (request, callback) {
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        let paramsArr = new Array(
            request.organization_id,
            request.asset_id,
            request.timeline_transaction_id,
            request.flag_previous,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_v1_asset_timeline_transaction_select_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatAssetTimelineList(data, function (err, responseData) {
                        if (err === false) {
                            callback(false, {
                                data: responseData
                            }, 200);
                        } else {
                            callback(false, {}, -9999);
                        }
                    });
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        } else {
            callback(false, {}, -3303);
        }

    };

    let formatFormFieldTimeline = function (data, callback) {
        let responseData = new Array();
        forEachAsync(data, function (next, rowData) {
            let rowDataArr = {};

            rowDataArr.timeline_transaction_id = util.replaceDefaultNumber(rowData['timeline_transaction_id']);
            rowDataArr.timeline_form_transaction_id = util.replaceDefaultNumber(rowData['timeline_form_transaction_id']);
            rowDataArr.form_id = util.replaceDefaultNumber(rowData['timeline_form_id']);
            rowDataArr.field_id = util.replaceDefaultNumber(rowData['timeline_field_id']);
            rowDataArr.comment_text = util.replaceDefaultString(rowData['timeline_entity_text_1']);
            rowDataArr.activity_id = util.replaceDefaultNumber(rowData['activity_id']);
            rowDataArr.asset_id = util.replaceDefaultNumber(rowData['asset_id']);
            rowDataArr.asset_first_name = util.replaceDefaultString(rowData['asset_first_name']);
            rowDataArr.asset_last_name = util.replaceDefaultString(rowData['asset_last_name']);
            rowDataArr.workforce_id = util.replaceDefaultNumber(rowData['workforce_id']);
            rowDataArr.workforce_name = util.replaceDefaultString(rowData['workforce_name']);
            rowDataArr.account_id = util.replaceDefaultNumber(rowData['account_id']);
            rowDataArr.account_name = util.replaceDefaultString(rowData['account_name']);
            rowDataArr.organization_id = util.replaceDefaultNumber(rowData['organization_id']);
            rowDataArr.organization_name = util.replaceDefaultString(rowData['organization_name']);
            rowDataArr.datetime_log = util.replaceDefaultDatetime(rowData['log_datetime']);
            responseData.push(rowDataArr);
            next();
        }).then(function () {
            callback(false, responseData);
        });

    };

    //PAM
    let formatAssetTimelineList = function (data, callback) {
        let responseData = new Array();
        forEachAsync(data, function (next, rowData) {
            let rowDataArr = {};
            rowDataArr.activity_id = util.replaceDefaultNumber(rowData['activity_id']);
            rowDataArr.activity_type_id = util.replaceDefaultNumber(rowData['activity_type_id']);
            rowDataArr.activity_type_category_id = util.replaceDefaultNumber(rowData['activity_type_category_id']);
            rowDataArr.timeline_transaction_id = util.replaceDefaultNumber(rowData['timeline_transaction_id']);
            rowDataArr.timeline_transaction_datetime = util.replaceDefaultDatetime(rowData['timeline_transaction_datetime']);
            rowDataArr.timeline_stream_type_id = util.replaceDefaultNumber(rowData['timeline_stream_type_id']);
            rowDataArr.timeline_stream_type_name = util.replaceDefaultString(rowData['timeline_stream_type_name']);
            rowDataArr.asset_id = util.replaceDefaultNumber(rowData['asset_id']);
            rowDataArr.asset_first_name = util.replaceDefaultString(rowData['asset_first_name']);
            rowDataArr.asset_last_name = util.replaceDefaultString(rowData['asset_last_name']);
            rowDataArr.asset_image_path = util.replaceDefaultString(rowData['asset_image_path']);
            rowDataArr.workforce_id = util.replaceDefaultNumber(rowData['workforce_id']);
            rowDataArr.workforce_name = util.replaceDefaultString(rowData['workforce_name']);
            rowDataArr.account_id = util.replaceDefaultNumber(rowData['account_id']);
            rowDataArr.account_name = util.replaceDefaultString(rowData['account_name']);
            rowDataArr.organization_id = util.replaceDefaultNumber(rowData['organization_id']);
            rowDataArr.organization_name = util.replaceDefaultString(rowData['organization_name']);
            rowDataArr.datetime_log = util.replaceDefaultDatetime(rowData['log_datetime']);
            rowDataArr.message_unique_id = rowData['log_message_unique_id'];
            rowDataArr.activity_timeline_text = '';
            rowDataArr.activity_timeline_url = '';
            rowDataArr.activity_timeline_collection = {};
            rowDataArr.activity_timeline_url_title = '';
            rowDataArr.log_message_unique_id = util.replaceDefaultNumber(rowData['log_message_unique_id']);
            rowDataArr.log_retry = util.replaceDefaultNumber(rowData['log_retry']);
            rowDataArr.log_offline = util.replaceDefaultNumber(rowData['log_offline']);
            rowDataArr.log_asset_id = util.replaceDefaultNumber(rowData['log_asset_id']);
            rowDataArr.log_asset_name = util.replaceDefaultString(rowData['log_asset_name']);
            rowDataArr.log_asset_image_path = util.replaceDefaultString(rowData['log_asset_image_path']);
            rowDataArr.log_datetime = util.replaceDefaultDatetime(rowData['log_datetime']);

            responseData.push(rowDataArr);
            next();
        }).then(function () {
            callback(false, responseData);
        });

    };

    let formatActivityTimelineList = function (data, activityTypeCategoryId, callback) {
        let responseData = new Array();
        forEachAsync(data, function (next, rowData) {
            let rowDataArr = {};
            rowDataArr.activity_id = util.replaceDefaultNumber(rowData['activity_id']);
            rowDataArr.activity_type_id = util.replaceDefaultNumber(rowData['activity_type_id']);
            rowDataArr.activity_type_category_id = util.replaceDefaultNumber(rowData['activity_type_category_id']);
            rowDataArr.timeline_transaction_id = util.replaceDefaultNumber(rowData['timeline_transaction_id']);
            rowDataArr.timeline_transaction_datetime = util.replaceDefaultDatetime(rowData['timeline_transaction_datetime']);
            rowDataArr.timeline_stream_type_id = util.replaceDefaultNumber(rowData['timeline_stream_type_id']);
            rowDataArr.timeline_stream_type_name = util.replaceDefaultString(rowData['timeline_stream_type_name']);
            rowDataArr.asset_id = util.replaceDefaultNumber(rowData['asset_id']);
            rowDataArr.asset_first_name = util.replaceDefaultString(rowData['asset_first_name']);
            rowDataArr.asset_last_name = util.replaceDefaultString(rowData['asset_last_name']);
            rowDataArr.asset_image_path = util.replaceDefaultString(rowData['asset_image_path']);
            //BETA
            rowDataArr.operating_asset_id = util.replaceDefaultNumber(rowData['operating_asset_id']);
            rowDataArr.operating_asset_first_name = util.replaceDefaultString(rowData['operating_asset_first_name']);
            rowDataArr.operating_asset_last_name = util.replaceDefaultString(rowData['operating_asset_last_name']);
            rowDataArr.operating_asset_image_path = util.replaceDefaultString(rowData['operating_asset_image_path']);
            rowDataArr.workforce_id = util.replaceDefaultNumber(rowData['workforce_id']);
            rowDataArr.workforce_name = util.replaceDefaultString(rowData['workforce_name']);
            rowDataArr.account_id = util.replaceDefaultNumber(rowData['account_id']);
            rowDataArr.account_name = util.replaceDefaultString(rowData['account_name']);
            rowDataArr.organization_id = util.replaceDefaultNumber(rowData['organization_id']);
            rowDataArr.organization_name = util.replaceDefaultString(rowData['organization_name']);
            rowDataArr.datetime_log = util.replaceDefaultDatetime(rowData['log_datetime']);
            rowDataArr.message_unique_id = rowData['log_message_unique_id'];
            rowDataArr.activity_timeline_text = '';
            rowDataArr.activity_timeline_url = '';
            rowDataArr.activity_timeline_collection = {};
            rowDataArr.activity_timeline_url_title = '';
            rowDataArr.data_entity_inline = rowData['data_entity_inline'] || {};
            rowDataArr.data_form_transaction_id = util.replaceDefaultNumber(rowData['data_form_transaction_id']);
            rowDataArr.data_form_name = util.replaceDefaultString(rowData['data_form_name']);
            rowDataArr.activity_title = util.replaceDefaultString(rowData['activity_title']);
            rowDataArr.log_asset_first_name = util.replaceDefaultString(rowData['log_asset_first_name']);
            rowDataArr.log_asset_id = util.replaceDefaultNumber(rowData['log_asset_id']);
            //Added for Beta
            rowDataArr.activity_timeline_url_title = util.replaceDefaultString(rowData['data_entity_text_3']);
            rowDataArr.activity_timeline_url_preview = '';

            // Address
            // location_latitude, location_longitude, location_gps_accuracy, location_gps_enabled, location_address, location_datetime,
            rowDataArr.location_latitude = util.replaceDefaultNumber(rowData['location_latitude']);
            rowDataArr.location_longitude = util.replaceDefaultNumber(rowData['location_longitude']);
            rowDataArr.location_gps_accuracy = util.replaceDefaultNumber(rowData['location_gps_accuracy']);
            rowDataArr.location_gps_enabled = util.replaceDefaultNumber(rowData['location_gps_enabled']);
            rowDataArr.location_address = util.replaceDefaultString(rowData['location_address']);
            rowDataArr.location_datetime = util.replaceDefaultDatetime(rowData['location_datetime']);

            // activity status keys
            rowDataArr.activity_status_id = util.replaceDefaultNumber(rowData['activity_status_id']);
            rowDataArr.activity_status_name = util.replaceDefaultString(rowData['activity_status_name']);
            rowDataArr.activity_status_type_id = util.replaceDefaultNumber(rowData['activity_status_type_id']);
            rowDataArr.activity_status_type_name = util.replaceDefaultString(rowData['activity_status_type_name']);
            rowDataArr.activity_status_type_category_id = util.replaceDefaultNumber(rowData['activity_status_type_category_id']);
            
            switch (activityTypeCategoryId) {
                case 1: //To do
                    switch (rowData['timeline_stream_type_id']) {
                        case 401:
                        case 402:
                        case 403:
                        case 404:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }

                    break;
                case 2: //  notepad
                    switch (rowData['timeline_stream_type_id']) {
                        case 501:
                        case 502:
                        case 503:
                        case 504:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }

                    break;

                case 3: //plant // not yet defined
                    switch (rowData['timeline_stream_type_id']) {
                        case 101:
                            rowDataArr.activity_timeline_text = '';
                            break;
                        case 102:
                            rowDataArr.activity_timeline_text = '';
                            break;
                        case 103:
                            rowDataArr.activity_timeline_text = '';
                            break;
                    }

                    break;

                case 4: // employee id card
                    rowDataArr.activity_timeline_text = '';
                    rowDataArr.activity_timeline_url = '';
                    rowDataArr.activity_timeline_collection = {};
                    break;

                case 5: // coworker
                    switch (rowData['timeline_stream_type_id']) {
                        case 101:

                            break;
                        case 102:

                            break;
                        case 103:
                            rowDataArr.activity_timeline_text = '';
                            break;
                    }

                    break;

                case 6: // external contact card
                    switch (rowData['timeline_stream_type_id']) {
                        case 101:
                            rowDataArr.activity_timeline_text = '';
                            break;
                        case 102:
                            rowDataArr.activity_timeline_text = '';
                            break;
                        case 103:
                            rowDataArr.activity_timeline_text = '';
                            break;
                    }

                    break;
                case 9: // form
                    switch (rowData['timeline_stream_type_id']) {
                        case 701:
                        case 702:
                        case 703:
                        case 704:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 705:
                        case 706:
                        case 707:
                        case 708:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 709:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                    }
                    break;
                case 10: // document
                    switch (rowData['timeline_stream_type_id']) {
                        case 301:
                        case 302:
                        case 303:
                        case 304:
                        case 305:
                        case 306:
                        case 307:
                        case 308:
                        case 309:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 310:
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 311:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                        case 312:
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 313: //Added form on to the Document
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 314: //Added Cloud based Document link on to the Document
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                        case 315: //Added Email conversation on to the Document
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = rowData['data_entity_text_1'];
                            break;
                        case 316: //Added notepad on to the Document
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = rowData['data_entity_text_1'];
                            break;
                    }

                    break;

                case 11: // Project
                    switch (rowData['timeline_stream_type_id']) {
                        case 1401:
                        case 1402:
                        case 1403:
                        case 1404:
                        case 1405:
                        case 1406:
                        case 1407:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1408:
                        case 1409:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                    }

                    break;

                case 14: // Voice Call
                    switch (rowData['timeline_stream_type_id']) {
                        case 801:
                        case 802:
                        case 803:
                        case 804:
                        case 805:
                        case 806:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 807:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                        case 808:
                        case 809:
                        case 810:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }

                    break;

                case 15: // Video Conference
                    switch (rowData['timeline_stream_type_id']) {
                        case 1601:
                        case 1602:
                        case 1603:
                        case 1604:
                        case 1605:
                        case 1606:
                        case 1607:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1608:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                    }

                    break;

                case 32: // Customer Request
                    switch (rowData['timeline_stream_type_id']) {
                        case 601:
                        case 602:
                        case 603:
                        case 604:
                        case 605:
                        case 606:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 607:
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 608:
                        case 609:
                        case 610:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                        case 611:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }

                    break;

                case 33: // Visitor Request
                    switch (rowData['timeline_stream_type_id']) {
                        case 1301:
                        case 1302:
                        case 1303:
                        case 1304:
                        case 1305:
                        case 1306:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1307:
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1308:
                        case 1309:
                        case 1310:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                        case 1311:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }

                    break;

                case 34: // Timecard
                    switch (rowData['timeline_stream_type_id']) {
                        case 1501:
                        case 1502:
                        case 1503:
                        case 1504:
                        case 1505:
                        case 1506:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1507:
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1508:
                        case 1509:
                        case 1510:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                        case 1511:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }

                    break;
                default:
                    break;

            }


            responseData.push(rowDataArr);
            next();
        }).then(function () {
            callback(false, responseData);
        });

    };

    let addFormEntries = function (request, callback) {

        util.logInfo(request,`In ActivtiyTimelineService - Inside the addFormEntries() function.`);
        let formDataJson;
        let annexureExcelFilePath = "";
        const widgetFieldsStatusesData = util.widgetFieldsStatusesData();
        let poFields = widgetFieldsStatusesData.PO_FIELDS; // new Array(13263, 13269, 13265, 13268, 13271);
        let annexureFields = widgetFieldsStatusesData.ANNEXURE_FIELDS;
        //console.log(annexureFields);
        if (request.hasOwnProperty('form_id')) {

            let formDataCollection;

            try {
                formDataCollection = JSON.parse(request.activity_timeline_collection);
            } catch (err) {
                util.logError(request,`Error in addFormEntries() function - ONE. JSON Error`, { type: 'addFormEntries', error: serializeError(err) });
            }

            if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
                formDataJson = formDataCollection.form_submitted;
            } else {

                try {
                    formDataJson = JSON.parse(formDataCollection.form_submitted);
                } catch (err) {
                    util.logError(request,`Error in addFormEntries() function - TWO. JSON Error`, { type: 'addFormEntries', error: serializeError(err) });
                }

            }
        } else {
            formDataJson = JSON.parse(request.activity_timeline_collection);
        }

        // 
        // If this is an incremental form data submission
        if (request.hasOwnProperty('form_id') && request.hasOwnProperty('incremental_form_data')) {

            if (Array.isArray(request.incremental_form_data) === true || typeof request.incremental_form_data === 'object') {
                formDataJson = request.incremental_form_data;
            } else {
                formDataJson = JSON.parse(request.incremental_form_data);
            }
            util.logInfo(request,`[Incremental Form Data Submission] formDataJson: %j`, formDataJson);
        }

        //console.log('formDataJson : ', formDataJson);

        let workflowReference,documentReference,assetReference;

        let approvalFields = new Array();
        forEachAsync(formDataJson, function (next, row) {
            let datatypeComboId = 0
            if (row.hasOwnProperty('data_type_combo_id')) {
                datatypeComboId = row.data_type_combo_id;
            }

            let params = new Array(
                request.form_transaction_id, //0
                row.form_id, //1
                row.field_id, //2
                datatypeComboId, //3
                request.activity_id, //4
                request.asset_id, //5
                request.workforce_id, //6
                request.account_id, //7
                request.organization_id, //8
                '', //IN p_entity_date_1 DATE                                   9
                request.entity_datetime_1 || '', //IN p_entity_datetime_1 DATETIME            10
                '', //IN p_entity_tinyint_1 TINYINT(4)                          11
                '', //IN p_entity_tinyint_2 TINYINT(4)                          12 BETA
                '', //IN p_entity_bigint_1 BIGINT(20)                           13
                '', //IN p_entity_double_1 DOUBLE(16,4),                        14
                '', //IN p_entity_decimal_1 DECIMAL(14,2)                       15
                '', //IN p_entity_decimal_2 DECIMAL(14,8)                       16
                '', //IN p_entity_decimal_3 DECIMAL(14,8)                       17
                '', //IN p_entity_text_1 VARCHAR(1200)                          18
                '', //IN p_entity_text_2 VARCHAR(4800)                          19
                '', //IN p_entity_text_3 VARCHAR(100)                           20 BETA
                '', //IN p_location_latitude DECIMAL(12,8)                      21
                '', // IN p_location_longitude DECIMAL(12,8)                    22
                '', //IN p_location_gps_accuracy DOUBLE(16,4)                   23
                '', //IN p_location_gps_enabled TINYINT(1)                      24
                '', //IN p_location_address VARCHAR(300)                        25
                '', //IN p_location_datetime DATETIME                           26
                '{}' //IN p_inline_data JSON                                    27
            );

            //global.logger.write('debug', '\x1b[32m addFormEntries params - \x1b[0m' + JSON.stringify(params), {}, request);

            let dataTypeId = Number(row.field_data_type_id);
            let signatureData = null;
            switch (dataTypeId) {
                case 1: // Date
                case 2: // future Date
                case 3: // past Date
                    params[9] = row.field_value;
                    break;
                case 4: // Date and time
                    params[10] = row.field_value;
                    break;
                case 5: //Number
                    //params[12] = row.field_value;
                    params[13] = row.field_value;
                    break;
                case 6: //Decimal
                    //params[13] = row.field_value;
                    params[14] = row.field_value;
                    break;
                case 7: //Scale (0 to 100)
                case 8: //Scale (0 to 5)
                    params[11] = row.field_value;
                    break;
                case 9: // Reference - Organization
                case 10: // Reference - Building
                case 11: // Reference - Floor
                case 12: // Reference - Person
                case 13: // Reference - Vehicle
                case 14: // Reference - Room
                case 15: // Reference - Desk
                case 16: // Reference - Assistant
                    //params[12] = row.field_value;
                    params[13] = row.field_value;
                    break;
                case 17: // Location
                    // Format: { "location_data": { "flag_location_available": 1, "location_latitude": 0.0, "location_longitude": 0.0 } }
                    // Revision 1 | 25th September 2019
                    // try {
                    //     const fieldValue = isObject(row.field_value) ? row.field_value : JSON.parse(row.field_value);

                    //     if (Number(fieldValue.location_data.flag_location_available) === 1) {
                    //         params[16] = parseFloat(fieldValue.location_data.location_latitude);
                    //         params[17] = parseFloat(fieldValue.location_data.location_longitude);
                    //         // Set the location availibility flag
                    //         params[11] = 1;
                    //     } else {
                    //         // Reset the location availibility flag
                    //         params[11] = 0;
                    //     }
                    //     params[18] = JSON.stringify(fieldValue);
                    //     break;
                    // } catch (error) {
                    //     console.log("Error parsing location data")
                    //     // Proceed
                    // }
                    // Format: xx.xxx,yy.yyy | Legacy | Ensure backward compatibility
                    const location = row.field_value.split(',');
                    if (
                        !isNaN(parseFloat(location[0])) ||
                        !isNaN(parseFloat(location[1]))
                    ) {
                        params[16] = parseFloat(location[0]);
                        params[17] = parseFloat(location[1]);
                    } else {
                        params[16] = 0;
                        params[17] = 0;
                    }

                    params[18] = row.field_value;
                    if (
                        row.field_value !== "null" &&
                        row.field_value !== "" &&
                        row.field_value !== "undefined" &&
                        row.field_value !== "NA"
                    ) {
                        // Set the location availibility flag
                        params[11] = 1;
                    } else {
                        // Reset the location availibility flag
                        params[11] = 0;
                    }
                    break;
                case 18: //Money with currency name
                    let money = row.field_value.split('|');
                    params[15] = money[0];
                    params[18] = money[1];
                    break;
                case 19: //Short Text
                    params[18] = row.field_value;
                    break;
                case 20: //Long Text
                    params[19] = row.field_value;
                    break;
                case 21: //Label
                    params[18] = row.field_value;
                    break;
                case 22: //Email ID
                    params[18] = row.field_value;
                    break;
                case 23: //Phone Number with Country Code
                    /*var phone = row.field_value.split('|');
                    params[13] = phone[0];  //country code
                    params[18] = phone[1];  //phone number
                    break;*/
                    let phone;
                    if (String(row.field_value).includes('||')) {
                        phone = row.field_value.split('||');
                        params[13] = phone[0]; // country code
                        params[18] = phone[1]; // phone number
                    } else if (
                        String(row.field_value).includes('|')
                    ) {
                        phone = row.field_value.split('|');
                        params[13] = phone[0]; // country code
                        params[18] = phone[1]; // phone number
                    } else {
                        params[18] = row.field_value; // phone number
                    }
                    break;
                case 24: //Gallery Image
                case 25: //Camera Front Image
                case 26: //Video Attachment
                    params[18] = row.field_value;
                    break;
                case 27: //General Signature with asset reference
                case 28: //General Picnature with asset reference
                    signatureData = row.field_value.split('|');
                    params[18] = signatureData[0]; //image path
                    params[13] = signatureData[1]; // asset reference
                    params[11] = signatureData[1]; // accepted /rejected flag
                    break;
                case 29: //Coworker Signature with asset reference
                case 30: //Coworker Picnature with asset reference
                    approvalFields.push(row.field_id);
                    signatureData = row.field_value.split('|');
                    params[18] = signatureData[0]; //image path
                    params[13] = signatureData[1]; // asset reference
                    params[11] = signatureData[1]; // accepted /rejected flag
                    break;
                case 31: //Cloud Document Link
                    params[18] = row.field_value;
                    break;
                case 32: // PDF Document                
                case 33: //Single Selection List
                    params[18] = row.field_value;
                    break;
                case 34: //Multi Selection List
                    params[18] = row.field_value;
                    break;
                case 35: //QR Code
                case 36: //Barcode
                    params[18] = row.field_value;
                    break;
                case 38: //Audio Attachment
                    params[18] = row.field_value;
                    break;
                case 39: //Flag
                    params[11] = row.field_value;
                    break;
                    case 50: // Reference - File
                    try {
                        params[13] = Number(JSON.parse(row.field_value).activity_id); // p_entity_bigint_1
                        params[18] = row.field_value; // p_entity_text_1
                    } catch (err) {}
                    break;
                case 51: // PDF Scan
                    params[18] = row.field_value;
                    break;
                case 52: // Excel Document
                    annexureExcelFilePath = row.field_value;
                    params[18] = row.field_value;
                    break;
                case 53: // IP Address Form
                    // Format: { "ip_address_data": { "flag_ip_address_available": 1, "ip_address": "0.00.0.0" } }
                    // Revision 1 | 25th September 2019
                    // try {
                    //     const fieldValue = isObject(row.field_value) ? row.field_value : JSON.parse(row.field_value);

                    //     if (Number(fieldValue.ip_address_data.flag_ip_address_available) === 1) {
                    //         params[18] = fieldValue.ip_address_data.ip_address;
                    //         // Set the IP address availibility flag
                    //         params[11] = 1;
                    //     } else {
                    //         // Reset the IP address availibility flag
                    //         params[11] = 0;
                    //     }
                    //     break;
                    // } catch (error) {
                    //     console.log("Error parsing location data")
                    //     // Proceed
                    // }
                    // Format: X.X.X.X | Legacy | Ensure backward compatibility
                    params[18] = row.field_value;
                    if (
                        row.field_value !== "null" &&
                        row.field_value !== "" &&
                        row.field_value !== "undefined" &&
                        row.field_value !== "NA"
                    ) {
                        // Set the IP address availibility flag
                        params[11] = 1;
                    }
                    break;
                case 54: // MAC Address Form
                    params[18] = row.field_value;
                    break;
                case 55: // Word Document
                    params[18] = row.field_value;
                    break;
                case 56: // Outlook Message
                    params[18] = row.field_value;
                    break;
                case 57: //Workflow(/Activity) reference                    
                    try {
                        workflowReference = row.field_value.split('|');
                        params[13] = workflowReference[0]; //ID
                        params[18] = workflowReference[1]; //Name
                        // p_entity_text_2 19
                        params[19] = workflowReference[4] || workflowReference[2] || "";
                    } catch (err) {
                        util.logError(request,`[57] row.field_value ${row.field_value}`, { type: 'addFormEntries', error: serializeError(err) });

                        if (typeof row.field_value === 'object') {
                            params[27] = JSON.stringify(row.field_value);
                        } else {
                            params[27] = row.field_value;
                        }
                    }
                    break;
                case 58://Document reference
                    // documentReference = row.field_value.split('|');
                    params[18] = row.field_value;
                    break;
                case 59: //Asset reference                    
                    try {
                        assetReference = row.field_value.split('|');
                        params[13] = assetReference[0]; //ID
                        
                        // p_entity_text_1 18
                        params[18] = assetReference[1]; //Name    

                        // p_entity_text_2 19
                        params[19] = assetReference[2] || "";

                        // p_entity_text_3 20
                        params[20] = assetReference[3] || "";
                    } catch (err) {
                        util.logError(request,`[59] row.field_value ${row.field_value}`, { type: 'addFormEntries', error: serializeError(err) });
                        if (typeof row.field_value === 'object') {
                            params[27] = JSON.stringify(row.field_value);
                        } else {
                            params[27] = row.field_value;
                        }
                    }
                    break;
                case 61: //Time Datatype
                    params[18] = row.field_value;
                    break;
                case 62: //Credit/Debit DataType
                    try {
                        let jsonData = JSON.parse(row.field_value);
                        (Number(jsonData.transaction_type_id) === 1) ?
                            params[15] = jsonData.transaction_data.transaction_amount: //credit
                            params[16] = jsonData.transaction_data.transaction_amount; // Debit
                        params[13] = jsonData.transaction_data.activity_id; //Activity_id i.e account(ledger)_activity_id
                    } catch (err) {
                        util.logError(request,`[62] row.field_value ${row.field_value}`, { type: 'addFormEntries', error: serializeError(err) });
                    }
                    break;
                case 64: // Address DataType
                    //params[27] = row.field_value;
                    if(typeof row.field_value === 'object') {
                        params[27] = JSON.stringify(row.field_value);
                    } else {
                        params[27] = row.field_value;
                    }
                    break;
                case 65: // Business Card DataType
                    params[27] = row.field_value;
                    break;
                case 67: // Reminder DataType
                    params[27] = row.field_value;
                    break;
                case 68: break;
                case 69: break;
                case 70: // LoV Datatype
                    params[18] = row.field_value;
                    break;
                case 71: //Cart Datatype
                    params[27] = row.field_value;
                    try {
                        let fieldValue = row.field_value;
                        (typeof fieldValue === 'string') ?
                            params[13] = JSON.parse(row.field_value).cart_total_cost:
                            params[13] = Number(fieldValue.cart_total_cost);
                    } catch(err) {
                        util.logError(request,`[71] row.field_value ${row.field_value}`, { type: 'addFormEntries', error: serializeError(err) });
                    }
                    break;                
                case 72: 
                    params[18] = row.field_value;
                    break;
                case 73: 
                    params[18] = row.field_value;
                    break;
                case 74: // Composite Online List
                    let fieldValue = row.field_value;
                    try {
                        if (typeof fieldValue === 'string') {
                            params[18] = fieldValue;
                            params[27] = fieldValue;
                        }
                        if (typeof fieldValue === 'object') {
                            params[18] = JSON.stringify(fieldValue);
                            params[27] = JSON.stringify(fieldValue);
                        }
                    } catch (err) {
                        util.logError(request,`[74] row.field_value ${row.field_value}`, { type: 'addFormEntries', error: serializeError(err) });
                    }
                    break;
                case 76: //Drop box data type
                    params[18] = (typeof row.field_value === 'object') ? JSON.stringify(row.field_value) : row.field_value;
                    break;
            }

            params.push(''); //IN p_device_manufacturer_name VARCHAR(50)
            params.push(''); // IN p_device_model_name VARCHAR(50)
            params.push(request.device_os_id); // IN p_device_os_id TINYINT(4)
            params.push(''); // IN p_device_os_name VARCHAR(50),
            params.push(''); // IN p_device_os_version VARCHAR(50)
            params.push(request.app_version); // IIN p_device_app_version VARCHAR(50)
            params.push(request.api_version); // IN p_device_api_version VARCHAR(50)
            params.push(request.asset_id); // IN p_log_asset_id BIGINT(20)
            params.push(row.message_unique_id); // IN p_log_message_unique_id VARCHAR(50)
            params.push(request.flag_retry || 0); // IN p_log_retry TINYINT(1)
            params.push(request.flag_offline || 0); // IN p_log_offline TINYINT(1)
            params.push(util.getCurrentUTCTime()); // IN p_transaction_datetime DATETIME
            params.push(request.datetime_log); // IN p_log_datetime DATETIME
            params.push(request.entity_datetime_2); // IN p_entity_datetime_2 DATETIME
            params.push(row.field_gamification_score || 0); // IN p_field_gamification_score
            params.push(request.is_refill === 1 || request.is_resubmit === 1 ? 1 : 0); //refill or resubmit

            util.logInfo(request,`addFormEntries params %j`, params);

            //var queryString = util.getQueryString('ds_v1_activity_form_transaction_insert', params);
            // var queryString = util.getQueryString('ds_v1_1_activity_form_transaction_insert', params); //BETA
            // var queryString = util.getQueryString('ds_v1_2_activity_form_transaction_insert', params); //BETA
            let queryString = util.getQueryString('ds_v1_4_activity_form_transaction_insert', params); //BETA
            if (queryString != '') {
                db.executeQuery(0, queryString, request, async function (err, data) {
                    if (Object.keys(poFields).includes(String(row.field_id))) {
                        activityCommonService.getActivityDetailsPromise(request, 0).then((activityData) => {
                            request['workflow_activity_id'] = activityData[0].channel_activity_id;
                            request['order_po_date'] = row.field_value;
                            request['flag'] = 1;
                            request['datetime_log'] = util.getCurrentUTCTime();
                            activityCommonService.widgetActivityFieldTxnUpdateDatetime(request);
                        });
                    }

                    // Trigger Child order creation on annexure fields 
                    if (Object.keys(annexureFields).includes(String(row.field_id))) {
                        if (annexureExcelFilePath.length > 0) {
                            let childOrdersCreationTopicName = global.config.CHILD_ORDER_TOPIC_NAME;
                            util.logInfo(request,`${childOrdersCreationTopicName} %j`, {
                                ...request,
                                s3UrlOfExcel: annexureExcelFilePath
                            });

                            await kafkaProdcucerForChildOrderCreation(childOrdersCreationTopicName, {
                                ...request,
                                s3UrlOfExcel: annexureExcelFilePath
                            }).catch(global.logger.error);
                        }

                
                    }

                    next();
                    if (err === false) {
                        //Success
                        /*if(request.activity_type_category_id == 9 && request.activity_form_id == 807) {
                            //success
                            var newRequest = Object.assign({}, request);
                            newRequest.datetime_start = util.getStartDayOfWeek();
                            newRequest.datetime_end = util.getEndDayOfWeek();
                            activityCommonService.getActivityListDateRange(newRequest, (err, data)=>{
                                if(data.length>0) {                                
                                    newRequest.activity_id = data[0].activity_id; //TimeCard ActivityId for the week
                                    var event = {
                                            name: "addTimelineTransaction",
                                            service: "activityTimelineService",
                                            method: "addTimelineTransaction",
                                            payload: newRequest
                                            };
                                    queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                                        if (err) {
                                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                            //global.logger.write('serverError', "Error in queueWrapper raiseActivityEvent", err, request);
                                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                           }
                                    });
                                }
                            });
                            next();
                        } else {
                            next();
                        }*/

                    } else {
                        //failure
                        //next();
                    }
                });
            } else {
                //callback(false, {}, -3303);
            }

        }).then(function () {
            util.logInfo(request,`******AFTER FORM DATA ENTRY *********`);
            request['source_id'] = 2;
            //sendRequesttoWidgetEngine(request);

            const widgetFieldsStatusesData = util.widgetFieldsStatusesData();
            let order_caf_approval_form_ids, order_logged_form_ids, order_documents_form_ids;
            order_caf_approval_form_ids = widgetFieldsStatusesData.AUTH_SIGNATORY_FORM_IDS; //new Array(282556, 282586, 282640, 282622, 282669); //
            order_logged_form_ids = widgetFieldsStatusesData.ORDER_CLOSURE_FORM_IDS; //new Array(282624, 282642, 282671, 282557, 282588);//
            order_documents_form_ids = widgetFieldsStatusesData.ORDER_DOCUMETS_FORM_IDS;
            util.logInfo(request,`order_caf_approval_form_ids ${Object.keys(order_caf_approval_form_ids)}`);
            util.logInfo(request,`order_logged_form_ids ${Object.keys(order_logged_form_ids)}`);


            if (Object.keys(order_caf_approval_form_ids).includes(String(request.form_id))) {
                activityCommonService.getActivityDetailsPromise(request, 0).then((activityData) => {
                    util.logInfo(request,`******ALTER CAF APPROVAL STATUS DATETIME*********`);
                    request['workflow_activity_id'] = activityData[0].channel_activity_id;
                    request['order_caf_approval_datetime'] = util.addUnitsToDateTime(util.replaceDefaultDatetime(util.getCurrentUTCTime()), 5.5, 'hours');
                    request['order_caf_approval_log_diff'] = 0;
                    request['flag'] = 2;
                    request['datetime_log'] = util.getCurrentUTCTime();
                    activityCommonService.widgetActivityFieldTxnUpdateDatetime(request);
                })

            } else if (Object.keys(order_logged_form_ids).includes(String(request.form_id))) {
                activityCommonService.getActivityDetailsPromise(request, 0).then((activityData) => {
                    util.logInfo(request,`******ALTER ORDER LOGGED STATUS DATETIME*********`);
                    request['workflow_activity_id'] = activityData[0].channel_activity_id;
                    request['order_logged_datetime'] = util.addUnitsToDateTime(util.replaceDefaultDatetime(util.getCurrentUTCTime()), 5.5, 'hours');
                    request['order_trigger_log_diff'] = 0;
                    request['order_caf_approval_log_diff'] = 0;
                    request['order_po_log_diff'] = 0;
                    request['flag'] = 3;
                    request['datetime_log'] = util.getCurrentUTCTime();
                    activityCommonService.widgetActivityFieldTxnUpdateDatetime(request);
                })
            } else if (Object.keys(order_documents_form_ids).includes(String(request.form_id))) {
               activityCommonService.getActivityDetailsPromise(request, 0).then((activityData) => {
                util.logInfo(request,`******ORDER DOCUMENTS SUBMITTED*********`);
                   request['activity_id'] = activityData[0].channel_activity_id;
                   request['documents_submitted'] = 1;
                   activityCommonService.activityUpdateDocumentsSubmitted(request);
               })
           }

            callback(false, approvalFields);
        });
    };

    function sendRequesttoWidgetEngine(request) {

        //global.logger.write('conLog', '*********************************BEFORE FORM WIDGET *********************************************88 : ', {}, request);
        util.logInfo(request,`sendRequesttoWidgetEngine *********************************BEFORE FORM WIDGET *********************************************88 :  %j`,{request});
        if (request.activity_type_category_id == 9) { //form and submitted state                    
            activityCommonService.getActivityDetails(request, 0, function (err, activityData) { // get activity form_id and form_transaction id
                activityCommonService.getWorkflowOfForm(request)
                    .then((formData) => {
                        let idActivityType = activityData[0].activity_type_id;
                        if (formData.length > 0) {
                            idActivityType = formData[0].form_workflow_activity_type_id;
                        }
                        let widgetEngineQueueMessage = {
                            form_id: activityData[0].form_id,
                            form_transaction_id: activityData[0].form_transaction_id,
                            organization_id: request.organization_id,
                            account_id: request.account_id,
                            workforce_id: request.workforce_id,
                            asset_id: request.asset_id,
                            activity_id: request.activity_id,
                            activity_type_id: idActivityType,
                            activity_type_category_id: request.activity_type_category_id,
                            activity_stream_type_id: request.activity_stream_type_id,
                            track_gps_location: request.track_gps_location,
                            track_gps_datetime: request.track_gps_datetime,
                            track_gps_accuracy: request.track_gps_accuracy,
                            track_gps_status: request.track_gps_status,
                            device_os_id: request.device_os_id,
                            service_version: request.service_version,
                            app_version: request.app_version,
                            api_version: request.api_version,
                            widget_type_category_id: 1,
                            source_id: request.source_id
                        };
                        let event = {
                            name: "Form Based Widget Engine",
                            payload: widgetEngineQueueMessage
                        };
                        //lobal.logger.write('conLog', 'Hitting Widget Engine with request:' + event, {}, request);
                        util.logInfo(request,`conLog Hitting Widget Engine with request: %j`,{event,request});

                        queueWrapper.raiseFormWidgetEvent(event, request.activity_id);
                    });
            });
        }
    }

    function getActivityIdBasedOnTransId(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.form_transaction_id
            );
            let queryString = util.getQueryString('ds_p1_activity_list_select_form_transaction', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    console.log('Data from getActivityIdBasedOnTransId : ', data);
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    }

    async function getActivityIdBasedOnTransIdAsync(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.form_transaction_id
        );
        const queryString = util.getQueryString('ds_p1_activity_list_select_form_transaction', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    //error = true;
                });
        }
        return [error, responseData];
    }

    // Retrieve all attachments from the timeline entries, with a provision to search
    this.retrieveSearchTimelineAttachments = async function (request) {
        request.is_previous = -3;
        const [error, timelineAttachmentsData] = await activityTimelineTransactionSearchDifferential(request);
        if (error) {
            console.log("retrieveSearchTimelineAttachments | Error: ", error);
            return [true, []];
        }

        // Filter out the relevant data
        let filteredAttachmentsList = [];
        for (const timelineEntry of timelineAttachmentsData) {
            let attachments = [];
            try {
                attachments = JSON.parse(timelineEntry.data_entity_inline).attachments;
            } catch (error) {
                console.log("retrieveSearchTimelineAttachments | Filter Logic: ", error);
                // Do nothing
            }

            if (Number(attachments.length) > 0) {
                for (const attachmentURL of attachments) {
                    // When searching for specific files
                    if (
                        String(request.search_string) !== '' &&
                        String(attachmentURL).includes(String(request.search_string))
                    ) {
                        filteredAttachmentsList.push(
                            formatTimelineAttachmentsList(timelineEntry, attachmentURL)
                        );
                    }

                    // When not search with a specific string
                    if (String(request.search_string) === '') {
                        filteredAttachmentsList.push(
                            formatTimelineAttachmentsList(timelineEntry, attachmentURL)
                        );
                    }

                }
            }
        }
        return [false, filteredAttachmentsList];
    }

    function formatTimelineAttachmentsList(timelineEntry, attachmentURL) {
        return {
            timeline_transaction_id: timelineEntry.timeline_transaction_id,
            attachment_name: String(attachmentURL).substring(String(attachmentURL).lastIndexOf('/') + 1),
            attachment_url: attachmentURL,
            timeline_transaction_datetime: timelineEntry.timeline_transaction_datetime,
            timeline_stream_type_id: timelineEntry.timeline_stream_type_id,
            activity_id: timelineEntry.activity_id,
            activity_title: timelineEntry.activity_title,
            activity_type_id: timelineEntry.activity_type_id,
            activity_type_name: timelineEntry.activity_type_name,
            activity_type_category_id: timelineEntry.activity_type_category_id,
            activity_type_category_name: timelineEntry.activity_type_category_name,
            asset_id: timelineEntry.asset_id,
            asset_first_name: timelineEntry.asset_first_name,
            operating_asset_id: timelineEntry.operating_asset_id,
            operating_asset_first_name: timelineEntry.operating_asset_first_name,
            data_entity_inline: timelineEntry.data_entity_inline
        }
    }

    async function activityTimelineTransactionSearchDifferential(request) {
        // IN p_organization_id BIGINT(20), IN p_activity_id bigint(20), 
        // IN p_timeline_transaction_id BIGINT(20), IN p_is_previous tinyint(4), 
        // IN p_search_string VARCHAR(50), IN p_start_from SMALLINT(6), IN p_limit_value smallint(6)

        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.timeline_transaction_id || 0,
            request.is_previous || -3,
            request.search_string,
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_v1_activity_timeline_transaction_search_differential', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    function isObject(arg) {
        return arg !== null && typeof arg === 'object';
    }

    // [VODAFONE]
    async function initiateTargetFormGenerationPromise(request) {
        // Process/Workflow ROMS Target Form Generation Trigger        
        if (
            (Number(request.device_os_id) === 1 || Number(request.device_os_id) === 2) &&
            Number(request.activity_type_category_id) === 48 &&
            Number(request.activity_stream_type_id) === 705 &&
            Number(request.organization_id) === 868
        ) {
            request.workflow_activity_id = request.activity_id;
        }

        if (
            Number(request.activity_stream_type_id) === 705 &&
            request.hasOwnProperty("workflow_activity_id") &&
            Number(request.workflow_activity_id) !== 0 &&
            Number(request.organization_id) === 868
        ) {
            logger.info(`[${request.log_uuid || ""}] CALLING buildAndSubmitCafFormV1 from the function 'initiateTargetFormGenerationPromise'`);
            const romsTargetFormGenerationEvent = {
                name: "vodafoneService",
                service: "vodafoneService",
                method: "buildAndSubmitCafFormV1Async",
                payload: request
            };

            await queueWrapper.raiseActivityEventPromise(romsTargetFormGenerationEvent, request.activity_id);
        }

        return "success";
    }


async function addFormEntriesAsync(request) {
    util.logInfo(request,`In addFormEntriesAsync`);

    let responseData = [],
            error = true;

    let formDataJson;
    let annexureExcelFilePath = "";
    const widgetFieldsStatusesData = util.widgetFieldsStatusesData();
    let poFields = widgetFieldsStatusesData.PO_FIELDS; // new Array(13263, 13269, 13265, 13268, 13271);
    let annexureFields = widgetFieldsStatusesData.ANNEXURE_FIELDS;

    //console.log(annexureFields);
    if (request.hasOwnProperty('form_id')) {
        let formDataCollection;
        try {
            formDataCollection = JSON.parse(request.activity_timeline_collection);
        } catch (err) {
            util.logError(request,`Error in addFormEntriesAsync()`, { type: 'add_form_entries', error: serializeError(err) });
        }
        if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
            formDataJson = formDataCollection.form_submitted;
        } else {
            try {
                formDataJson = JSON.parse(formDataCollection.form_submitted);
            } catch (err) {
                util.logError(request,`Error in addFormEntriesAsync()`, { type: 'add_form_entries', error: serializeError(err) });
            }
        }
    } else {
        formDataJson = JSON.parse(request.activity_timeline_collection);
    }

    // If this is an incremental form data submission
    if (request.hasOwnProperty('form_id') && request.hasOwnProperty('incremental_form_data')) {
        if (Array.isArray(request.incremental_form_data) === true || typeof request.incremental_form_data === 'object') {
            formDataJson = request.incremental_form_data;
        } else {
            formDataJson = JSON.parse(request.incremental_form_data);
        }
        util.logInfo(request,`[Incremental Form Data Submission] formDataJson %j`, formDataJson);
    }

    let errorValueContributor = true, responseValueContributor = [], data = [];
    let finalInlineData = {};
    let finalInlineDataKeys = [];
    let dashboardEntityFieldData = {};
    let fieldData = null;
    let fieldDataValue = null;
    // Value Contributors
    if(request.hasOwnProperty("workflow_activity_id")){

        let [err, data] = await activityCommonService.getActivityDetailsAsync(request);
        if(data.length > 0){
            [errorWorkflowType, workflowTypeData] = await activityCommonService.getWorkflowFieldsBasedonActTypeId(request, data[0].activity_type_id);
            util.logInfo(request, "workflowTypeData "+JSON.stringify(workflowTypeData));
            if(workflowTypeData.length > 0){
                if(workflowTypeData[0].activity_type_inline_data == null){
                    util.logInfo(request, data[0].activity_type_id+" activity_type_inline_data is null");               
                }else{
                    finalInlineData = JSON.parse(workflowTypeData[0].activity_type_inline_data);

                    if(finalInlineData.hasOwnProperty('workflow_fields'))
                        finalInlineDataKeys = Object.keys(finalInlineData.workflow_fields);
                    else
                    util.logInfo(request, "No workflow_fields");        
                                      
                }

                util.logInfo(request, "Dashboard config "+workflowTypeData[0].dashboard_config_fields+ " : "+workflowTypeData[0].dashboard_config_enabled);
                if(workflowTypeData[0].dashboard_config_fields !== null && workflowTypeData[0].dashboard_config_enabled === 1)
                    dashboardEntityFieldData = await activityCommonService.getDashboardEntityFieldData(request, workflowTypeData);
                else
                    util.logInfo(request, workflowTypeData[0].dashboard_config_fields+ " : "+workflowTypeData[0].dashboard_config_enabled); 
                
            }else{
                util.logInfo(request, "No Response from activity_type :: "+responseValueContributor.length);
            }           

        }else{
            util.logInfo(request, "No No Workflow");      
        }
    } 
    util.logInfo(request, "value contributors "+finalInlineDataKeys);
    util.logInfo(request, "dashboardEntityFieldData "+JSON.stringify(dashboardEntityFieldData));
    //console.log('formDataJson : ', formDataJson);

    let workflowReference,documentReference,assetReference;
    let approvalFields = new Array();
    let row;

    for(let i=0;i<formDataJson.length; i++) {
        row = formDataJson[i];
        let datatypeComboId = 0;
        if (row.hasOwnProperty('data_type_combo_id')) {
            datatypeComboId = row.data_type_combo_id;
        }
        fieldData = null;
        fieldDataValue = null;    
        const params = new Array(
            request.form_transaction_id, //0
            row.form_id, //1
            row.field_id, //2
            datatypeComboId, //3
            request.activity_id, //4
            request.asset_id, //5
            request.workforce_id, //6
            request.account_id, //7
            request.organization_id, //8
            '', //IN p_entity_date_1 DATE                                   9
            request.entity_datetime_1 || '', //IN p_entity_datetime_1 DATETIME            10
            '', //IN p_entity_tinyint_1 TINYINT(4)                         11
            '', //IN p_entity_tinyint_2 TINYINT(4)                          12 BETA
            '', //IN p_entity_bigint_1 BIGINT(20)                           13
            '', //IN p_entity_double_1 DOUBLE(16,4),                        14
            '', //IN p_entity_decimal_1 DECIMAL(14,2)                       15
            '', //IN p_entity_decimal_2 DECIMAL(14,8)                       16
            '', //IN p_entity_decimal_3 DECIMAL(14,8)                       17
            '', //IN p_entity_text_1 VARCHAR(1200)                          18
            '', //IN p_entity_text_2 VARCHAR(4800)                          19
            '', //IN p_entity_text_3 VARCHAR(100)                           20 BETA
            '', //IN p_location_latitude DECIMAL(12,8)                      21
            '', // IN p_location_longitude DECIMAL(12,8)                    22
            '', //IN p_location_gps_accuracy DOUBLE(16,4)                   23
            '', //IN p_location_gps_enabled TINYINT(1)                      24
            '', //IN p_location_address VARCHAR(300)                        25
            '', //IN p_location_datetime DATETIME                           26
            '{}' //IN p_inline_data JSON                                    27
            );

            //global.logger.write('debug', '\x1b[32m addFormEntriesAsync params - \x1b[0m' + JSON.stringify(params), {}, request);

        let dataTypeId = Number(row.field_data_type_id);
        let signatureData = null;
        switch (dataTypeId) {
            case 1: // Date
            case 2: // future Date
            case 3: // past Date
                params[9] = row.field_value;
                fieldData = row.field_value;
                fieldDataValue = "";                
                break;
            case 4: // Date and time
                params[10] = row.field_value;
                fieldData = row.field_value;
                fieldDataValue = "";                
                break;
            case 5: //Number
                //params[12] = row.field_value;
                params[13] = row.field_value;
                fieldData = row.field_value;
                fieldDataValue = "";                
                break;
            case 6: //Decimal
                //params[13] = row.field_value;
                params[14] = row.field_value;
                fieldData = row.field_value;
                fieldDataValue = "";                
                break;
            case 7: //Scale (0 to 100)
            case 8: //Scale (0 to 5)
                params[11] = row.field_value;
                fieldData = row.field_value;
                fieldDataValue = "";                
                break;
            case 9: // Reference - Organization
            case 10: // Reference - Building
            case 11: // Reference - Floor
            case 12: // Reference - Person
            case 13: // Reference - Vehicle
            case 14: // Reference - Room
            case 15: // Reference - Desk
            case 16: // Reference - Assistant
                //params[12] = row.field_value;
                    params[13] = row.field_value;
                    break;
            case 17: // Location
                // Format: { "location_data": { "flag_location_available": 1, "location_latitude": 0.0, "location_longitude": 0.0 } }
                // Revision 1 | 25th September 2019
                // try {
                //     const fieldValue = isObject(row.field_value) ? row.field_value : JSON.parse(row.field_value);
                //     if (Number(fieldValue.location_data.flag_location_available) === 1) {
                //         params[16] = parseFloat(fieldValue.location_data.location_latitude);
                //         params[17] = parseFloat(fieldValue.location_data.location_longitude);
                //         // Set the location availibility flag
                //         params[11] = 1;
                //     } else {
                //         // Reset the location availibility flag
                //         params[11] = 0;
                //     }
                //     params[18] = JSON.stringify(fieldValue);
                //     break;
                // } catch (error) {
                //     console.log("Error parsing location data")
                //     // Proceed
                // }
                // Format: xx.xxx,yy.yyy | Legacy | Ensure backward compatibility
                const location = row.field_value.split(',');
                if (
                    !isNaN(parseFloat(location[0])) ||
                    !isNaN(parseFloat(location[1]))
                ) {
                    params[16] = parseFloat(location[0]);
                    params[17] = parseFloat(location[1]);
                } else {
                    params[16] = 0;
                    params[17] = 0;
                }
                params[18] = row.field_value;
                if (
                    row.field_value !== "null" &&
                    row.field_value !== "" &&
                    row.field_value !== "undefined" &&
                    row.field_value !== "NA"
                ) {
                    // Set the location availibility flag
                    params[11] = 1;
                } else {
                    // Reset the location availibility flag
                    params[11] = 0;
                }
                break;
            case 18: //Money with currency name
                let money = row.field_value.split('|');
                params[15] = money[0];
                params[18] = money[1];
                break;
            case 19: //Short Text
                params[18] = row.field_value;
                fieldData = row.field_value;
                fieldDataValue = "";                
                break;
            case 20: //Long Text
                params[19] = row.field_value;
                fieldData = row.field_value;
                fieldDataValue = "";                
                break;
            case 21: //Label
                params[18] = row.field_value;
                break;
            case 22: //Email ID
                params[18] = row.field_value;
                fieldData = row.field_value;
                fieldDataValue = "";                
                break;
            case 23: //Phone Number with Country Code
                /*var phone = row.field_value.split('|');
                params[13] = phone[0];  //country code
                params[18] = phone[1];  //phone number
                break;*/
                let phone;
                if (String(row.field_value).includes('||')) {
                    phone = row.field_value.split('||');
                    params[13] = phone[0]; // country code
                    params[18] = phone[1]; // phone number
                } else if (
                    String(row.field_value).includes('|')
                ) {
                    phone = row.field_value.split('|');
                    params[13] = phone[0]; // country code
                    params[18] = phone[1]; // phone number
                } else {
                    params[18] = row.field_value; // phone number
                }
                break;
            case 24: //Gallery Image
            case 25: //Camera Front Image
            case 26: //Video Attachment
                params[18] = row.field_value;
                break;
            case 27: //General Signature with asset reference
            case 28: //General Picnature with asset reference
                signatureData = row.field_value.split('|');
                params[18] = signatureData[0]; //image path
                params[13] = signatureData[1]; // asset reference
                params[11] = signatureData[1]; // accepted /rejected flag
                break;
            case 29: //Coworker Signature with asset reference
            case 30: //Coworker Picnature with asset reference
                    approvalFields.push(row.field_id);
                    signatureData = row.field_value.split('|');
                    params[18] = signatureData[0]; //image path
                    params[13] = signatureData[1]; // asset reference
                    params[11] = signatureData[1]; // accepted /rejected flag
                    break;
            case 31: //Cloud Document Link
                params[18] = row.field_value;
                break;
            case 32: // PDF Document
            case 51: // PDF Scan
                params[18] = row.field_value;
                break;
            case 33: //Single Selection List
                params[18] = row.field_value;
                fieldData = row.field_value;
                fieldDataValue = "";
                break;
            case 34: //Multi Selection List
                params[18] = row.field_value;
                break;
            case 35: //QR Code
            case 36: //Barcode
                params[18] = row.field_value;
                break;
            case 38: //Audio Attachment
                params[18] = row.field_value;
                break;
            case 39: //Flag
                params[11] = row.field_value;
                break;
            case 50: // Reference - File
                try {
                    params[13] = Number(JSON.parse(row.field_value).activity_id); // p_entity_bigint_1
                    params[18] = row.field_value; // p_entity_text_1
                } catch (err) {}
                break;
            case 52: // Excel Document
                params[18] = row.field_value;
                annexureExcelFilePath = row.field_value;
                break;
            case 53: // IP Address Form
                // Format: { "ip_address_data": { "flag_ip_address_available": 1, "ip_address": "0.00.0.0" } }
                // Revision 1 | 25th September 2019
                // try {
                //     const fieldValue = isObject(row.field_value) ? row.field_value : JSON.parse(row.field_value);
                //     if (Number(fieldValue.ip_address_data.flag_ip_address_available) === 1) {
                //         params[18] = fieldValue.ip_address_data.ip_address;
                //         // Set the IP address availibility flag
                //         params[11] = 1;
                //     } else {
                //         // Reset the IP address availibility flag
                //         params[11] = 0;
                //     }
                //     break;
                // } catch (error) {
                //     console.log("Error parsing location data")
                //     // Proceed
                // }
                // Format: X.X.X.X | Legacy | Ensure backward compatibility
                params[18] = row.field_value;
                if (
                    row.field_value !== "null" &&
                    row.field_value !== "" &&
                    row.field_value !== "undefined" &&
                    row.field_value !== "NA"
                ) {
                    // Set the IP address availibility flag
                    params[11] = 1;
                }
                break;
            case 54: // MAC Address Form
                params[18] = row.field_value;
                break;
            case 55: // Word Document
                params[18] = row.field_value;
                break;
            case 56: // Outlook Message
                params[18] = row.field_value;
                break;
            case 57: //Workflow(/Activity) reference                    
                //params[27] = row.field_value;
                try {
                    workflowReference = row.field_value.split('|');
                    params[13] = workflowReference[0]; //ID
                    //params[18] = workflowReference[1]; //Name
                    params[18] = row.field_value; //This is coz during retrival we are using 18 to get entire string with pipe
                    
                    // p_entity_text_2 19
                    params[19] = workflowReference[4] || workflowReference[2] || "";
                } catch (err) {
                    util.logError(request,`addFormEntriesAsync case 57`, { type: 'addFormEntriesAsync', error: serializeError(err) });
                    if (typeof row.field_value === 'object') {
                        params[27] = JSON.stringify(row.field_value);
                    } else {
                        params[27] = row.field_value;
                    }
                }
                fieldData = params[13];
                fieldDataValue = workflowReference[1];
                break;
            case 58://Document reference
                // documentReference = row.field_value.split('|');
                params[18] = row.field_value;
                break;
            case 59: //Asset reference                
                try {
                    assetReference = row.field_value.split('|');
                    params[13] = assetReference[0]; //ID
                    
                    // p_entity_text_2 18
                    params[18] = assetReference[1]; //Name

                    // p_entity_text_2 19
                    params[19] = assetReference[2] || "";

                    // p_entity_text_3 20
                    params[20] = assetReference[3] || "";
                } catch (err) {
                    util.logError(request,`addFormEntriesAsync case 59`, { type: 'addFormEntriesAsync', error: serializeError(err) });
                    if (typeof row.field_value === 'object') {
                        params[27] = JSON.stringify(row.field_value);
                    } else {
                        params[27] = row.field_value;
                    }
                }
                fieldData = params[13];
                fieldDataValue = params[18];
                break;
            case 61: //Time Datatype
                params[18] = row.field_value;
                break;
            case 62: //Credit/Debit DataType
                try {
                    util.logInfo(request,`row.field_value 62`);
                        let jsonData = row.field_value.transaction_data;
                        (Number(jsonData.transaction_type_id) === 1) ?
                            params[15] = jsonData.transaction_amount: //credit
                            params[16] = jsonData.transaction_amount; // Debit
                            params[13] = jsonData.activity_id; //Activity_id i.e account(ledger)_activity_id
                    } catch (err) {
                        util.logError(request,`row.field_value 62`, { type: 'addFormEntriesAsync', error: serializeError(err) });
                    }
                break;
            case 64: // Address DataType
                //params[27] = row.field_value;
                if(typeof row.field_value === 'object') {
                    params[27] = JSON.stringify(row.field_value);
                } else {
                    params[27] = row.field_value;
                }
                break;
            case 65: // Business Card DataType
                params[27] = row.field_value;
                break;
            case 67: // Reminder DataType
                params[27] = row.field_value;
                break;
            case 68: //Multi Workflow Reference
                params[27] = row.field_value;
                break;
            case 69: //Multi Asset Reference
                params[27] = row.field_value;
                break;
            case 70: // LoV Datatype
                params[18] = row.field_value;
                break;
            case 71: //Cart Datatype
                params[27] = row.field_value;
                try {
                    let fieldValue = row.field_value;
                    (typeof fieldValue === 'string') ?
                        params[13] = JSON.parse(row.field_value).cart_total_cost:
                        params[13] = Number(fieldValue.cart_total_cost);
                } catch(err) {
                    console.log('data type 71 : ', err);
                }
                break;
            case 72: //Multi Type File Attachment 
                     params[18] = row.field_value;
                     break;
            case 73: //Zip File Attachment
                     params[18] = row.field_value;
                     break;
            case 74: //Composite Online List
                     let fieldValue = row.field_value;
                     console.log("******fieldValue1****** "+fieldValue);
                     console.log("******typeof fieldValue1****** "+typeof fieldValue);
                     try {
                         if (typeof fieldValue === 'string') {
                             params[18] = fieldValue;
                         }
                         if (typeof fieldValue === 'object') {
                             params[18] = JSON.stringify(fieldValue);
                         }
                     } catch (err) {
                         util.logError(request,`[74] row.field_value ${row.field_value}`, { type: 'addFormEntries', error: serializeError(err) });
                     }                     
                     break;
            case 76: //Drop box data type
                     params[18] = (typeof row.field_value === 'object') ? JSON.stringify(row.field_value) : row.field_value;    
                     break;
            case 77: //scheduling event
                    try {
                        console.log("handling 77", row.field_value);
                        let fieldValues = row.field_value;
                        params[13] = fieldValues.duration 
                        params[9]  = await util.getFormatedLogDatetimeV1(fieldValues.start_date_time, "DD-MM-YYYY HH:mm:ss")
                        params[18]  = await util.getFormatedLogDatetimeV1(fieldValues.end_date_time, "DD-MM-YYYY HH:mm:ss") 
                        params[27] = (typeof row.field_value === 'object') ? JSON.stringify(row.field_value) : row.field_value;
                    } catch(e) {
                        console.log("Error while handling scheduling data type", row.value, e,e.stack);
                    }
                    break;
            default:
                fieldData = row.field_value;
                fieldDataValue = "";
                break;
            }

            params.push(''); //IN p_device_manufacturer_name VARCHAR(50)
            params.push(''); // IN p_device_model_name VARCHAR(50)
            params.push(request.device_os_id); // IN p_device_os_id TINYINT(4)
            params.push(''); // IN p_device_os_name VARCHAR(50),
            params.push(''); // IN p_device_os_version VARCHAR(50)
            params.push(request.app_version); // IIN p_device_app_version VARCHAR(50)
            params.push(request.api_version); // IN p_device_api_version VARCHAR(50)
            params.push(request.asset_id); // IN p_log_asset_id BIGINT(20)
            params.push(row.message_unique_id); // IN p_log_message_unique_id VARCHAR(50)
            params.push(request.flag_retry || 0); // IN p_log_retry TINYINT(1)
            params.push(request.flag_offline || 0); // IN p_log_offline TINYINT(1)
            params.push(util.getCurrentUTCTime()); // IN p_transaction_datetime DATETIME
            params.push(request.datetime_log); // IN p_log_datetime DATETIME
            params.push(request.entity_datetime_2); // IN p_entity_datetime_2 DATETIME
            params.push(row.field_gamification_score || 0); // IN p_field_gamification_score 
            params.push(request.is_refill === 1 || request.is_resubmit === 1 ? 1 : 0); //refill or resubmit case

            util.logInfo(request,`addFormEntriesAsync params %j`,params);

            // const queryString = util.getQueryString('ds_v1_2_activity_form_transaction_insert', params); //BETA
            const queryString = util.getQueryString('ds_v1_4_activity_form_transaction_insert', params); //BETA
            if (queryString != '') {
                await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    if (Object.keys(poFields).includes(String(row.field_id))) {
                        let activityData = await activityCommonService.getActivityDetailsPromise(request, 0);
                            request['workflow_activity_id'] = activityData[0].channel_activity_id;
                            request['order_po_date'] = row.field_value;
                            request['flag'] = 1;
                            request['datetime_log'] = util.getCurrentUTCTime();
                            activityCommonService.widgetActivityFieldTxnUpdateDatetime(request);
                    }

                    // Trigger Child order creation on annexure fields 
                    if (Object.keys(annexureFields).includes(String(row.field_id))) {
                        if (annexureExcelFilePath.length > 0) {
                            let childOrdersCreationTopicName = global.config.CHILD_ORDER_TOPIC_NAME;
                            util.logInfo(request,`${childOrdersCreationTopicName} %j`, {
                                ...request,
                                s3UrlOfExcel: annexureExcelFilePath
                            });
                            await kafkaProdcucerForChildOrderCreation(childOrdersCreationTopicName, {
                                ...request,
                                s3UrlOfExcel: annexureExcelFilePath
                            }).catch(global.logger.error)
                        }
                    }
                    util.logInfo(request, "finalInlineDataKeys :: "+finalInlineDataKeys.includes(row.field_id));
                    if(finalInlineDataKeys.includes(row.field_id) || finalInlineDataKeys.includes(String(row.field_id)))
                    { 
                        util.logInfo(request, "activityTimelineService:updateWorkflowValue Configured :: "+row.field_id+" : "+finalInlineData.workflow_fields[row.field_id].sequence_id);
                        request.sequence_id = finalInlineData.workflow_fields[row.field_id].sequence_id
                        activityCommonService.updateWorkflowValue(request, row.field_value);
                    }else{
                        util.logInfo(request, "activityTimelineService:updateWorkflowValue Not Configured");
                    }

                    //request.workflow_activity_id = workflowData[0].activity_id;
                    if (Object.keys(dashboardEntityFieldData).includes(row.field_id) || Object.keys(dashboardEntityFieldData).includes(String(row.field_id)) || Object.keys(dashboardEntityFieldData).includes(Number(row.field_id))) {
                        activityCommonService.updateEntityFieldsForDashboardEntity(request, dashboardEntityFieldData, fieldData, fieldDataValue, row.field_id);
                    }else{
                        util.logInfo(request,`Not a dashboard Entity Field ${row.field_id}`);
                    }

                })
                .catch((err) => {
                    error = err;
                }); 
            }
        } //end of For loop

        //AFTER FORM DATA ENTRY
        util.logInfo(request,`AFTER FORM DATA ENTRY`);
        request['source_id'] = 2;
        //sendRequesttoWidgetEngine(request);

        let order_caf_approval_form_ids, order_logged_form_ids, order_documents_form_ids;
        order_caf_approval_form_ids = widgetFieldsStatusesData.AUTH_SIGNATORY_FORM_IDS; //new Array(282556, 282586, 282640, 282622, 282669); //
        order_logged_form_ids = widgetFieldsStatusesData.ORDER_CLOSURE_FORM_IDS; //new Array(282624, 282642, 282671, 282557, 282588);//
        order_documents_form_ids = widgetFieldsStatusesData.ORDER_DOCUMETS_FORM_IDS;

        util.logInfo(request,`order_caf_approval_form_ids ${Object.keys(order_caf_approval_form_ids)}`);
        util.logInfo(request,`order_logged_form_ids ${Object.keys(order_logged_form_ids)}`);

        if (Object.keys(order_caf_approval_form_ids).includes(String(request.form_id))) {
            activityCommonService.getActivityDetailsPromise(request, 0).then((activityData) => {

                util.logInfo(request,`*****ALTER CAF APPROVAL STATUS DATETIME*****`);
                request['workflow_activity_id'] = activityData[0].channel_activity_id;
                request['order_caf_approval_datetime'] = util.addUnitsToDateTime(util.replaceDefaultDatetime(util.getCurrentUTCTime()), 5.5, 'hours');
                request['order_caf_approval_log_diff'] = 0;
                request['flag'] = 2;
                request['datetime_log'] = util.getCurrentUTCTime();
                activityCommonService.widgetActivityFieldTxnUpdateDatetime(request);
            });
        } else if (Object.keys(order_logged_form_ids).includes(String(request.form_id))) {
            activityCommonService.getActivityDetailsPromise(request, 0).then((activityData) => {
                util.logInfo(request,`*****ALTER ORDER LOGGED STATUS DATETIME******`);
                    request['workflow_activity_id'] = activityData[0].channel_activity_id;
                    request['order_logged_datetime'] = util.addUnitsToDateTime(util.replaceDefaultDatetime(util.getCurrentUTCTime()), 5.5, 'hours');
                    request['order_trigger_log_diff'] = 0;
                    request['order_caf_approval_log_diff'] = 0;
                    request['order_po_log_diff'] = 0;
                    request['flag'] = 3;
                    request['datetime_log'] = util.getCurrentUTCTime();
                    activityCommonService.widgetActivityFieldTxnUpdateDatetime(request);
                });
            } else if (Object.keys(order_documents_form_ids).includes(String(request.form_id))) {
               activityCommonService.getActivityDetailsPromise(request, 0).then((activityData) => {
                util.logInfo(request,`***** ORDER DOCUMENTS SUBMITTED*******`);
                   request['activity_id'] = activityData[0].channel_activity_id;
                   request['documents_submitted'] = 1;
                   activityCommonService.activityUpdateDocumentsSubmitted(request);
               });
           }

        return [error, responseData];
        
    }


    async function retrievingFormIdandProcessAsync(request, data) {
        let responseData = [],
            error = true;

        let activityStreamTypeId = Number(request.activity_stream_type_id);

        if (!request.hasOwnProperty('form_id')) {
            let formDataJson = JSON.parse(request.activity_timeline_collection);
            request.form_id = formDataJson[0]['form_id'];
        
            let lastObject = formDataJson[formDataJson.length - 1];
            if (lastObject.hasOwnProperty('field_value')) {
                //remote Analytics
                if (request.form_id == 325) {
                    monthlySummaryTransInsert(request).then(() => {});
                }
            }
        }

        // Triggering BOT 1
        if ((Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER))) {
            if (Number(request.organization_id) !== 868) {
                util.logInfo(request,`[Log] Triggering the BOT 1`);
                //makeRequest to /vodafone/neworder_form/queue/add
                let newRequest = Object.assign({}, request);
                    newRequest.activity_inline_data = {};
                
                activityCommonService.makeRequest(newRequest, "vodafone/neworder_form/queue/add", 1).then((resp) => {
                    util.logInfo(request,`resp %j`,resp);
                });
            }
        }

        //Triggering BOT 2
        if ((Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.FR) ||
                Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.CRM))) {
                    util.logInfo(request,`[Log] Triggering the BOT 2`);
            activityCommonService.makeRequest(request, "vodafone/customer_form/add", 1).then((resp) => {
                util.logInfo(request,`resp %j`,resp);
            });
        }

        //BOT to send email on CRM form submission
        //if (Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.CRM) && Number(request.device_os_id) === 7) {
        if (Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.CRM) && Number(request.non_dedicated_file) === 1) {
            util.logInfo(request,`[Log] Triggering BOT to send email on CRM form submission`);
            let newRequest = Object.assign({}, request);
            const crmFormData = JSON.parse(request.activity_inline_data);
            crmFormData.forEach(formEntry => {
                switch (Number(formEntry.field_id)) {
                    case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Company_Name:
                        newRequest.first_name = formEntry.field_value;
                        newRequest.contact_company = formEntry.field_value;
                        break;
                    case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Number:
                        if (String(formEntry.field_value).includes('||')) {
                            newRequest.contact_phone_country_code = String(formEntry.field_value).split('||')[0];
                            newRequest.contact_phone_number = String(formEntry.field_value).split('||')[1];
                        } else {
                            newRequest.contact_phone_country_code = 91;
                            newRequest.contact_phone_number = formEntry.field_value;
                        }
                        break;
                    case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Email:
                        newRequest.contact_email_id = formEntry.field_value;
                        break;
                    case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Designation:
                        newRequest.contact_designation = formEntry.field_value;
                        break;
                }
            });
                
            activityCommonService.makeRequest(newRequest, "vodafone/send/email", 1).then((resp) => {
                util.logInfo(request,`resp %j`,resp);
                });
            }

            //Generic Function to updated the CAF percentage
            updateCAFPercentage(request).then(() => {});

            // [VODAFONE] Listen for Account Manager Approval or Customer (Service Desk) Approval Form
            // [VODAFONE] The above no longer applies. New trigger on CRM Acknowledgement Form submission.

            const CRM_ACKNOWLEDGEMENT_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM_ACKNOWLEDGEMENT;

            if (activityStreamTypeId === 705 && (Number(request.form_id) === Number(CRM_ACKNOWLEDGEMENT_FORM_ID))) {
                console.log('CALLING approvalFormsSubmissionCheck');
                const approvalCheckRequestEvent = {
                    name: "vodafoneService",
                    service: "vodafoneService",
                    method: "approvalFormsSubmissionCheck",
                    payload: request
                };
                // queueWrapper.raiseActivityEvent(approvalCheckRequestEvent, request.activity_id, (err, resp) => {
                //     if (err) {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     } else {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     }
                // });
            }
            //
            // 
            // [VODAFONE] Provided the form file has submissions for New Order, FR, CRM and HLD, 
            // only then proceed with CAF Form building
            const NEW_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER,
                FR_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.FR,
                CRM_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM,
                HLD_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.HLD;

            if (
                activityStreamTypeId === 705 &&
                (
                    Number(request.form_id) === NEW_ORDER_FORM_ID || // New Order
                    Number(request.form_id) === FR_FORM_ID || // FR
                    Number(request.form_id) === CRM_FORM_ID || // CRM
                    Number(request.form_id) === HLD_FORM_ID // HLD
                )
            ) {
                util.logInfo(request,`CALLING buildAndSubmitCafForm`);
                const approvalCheckRequestEvent = {
                    name: "vodafoneService",
                    service: "vodafoneService",
                    method: "buildAndSubmitCafForm",
                    payload: request
                };
                // queueWrapper.raiseActivityEvent(approvalCheckRequestEvent, request.activity_id, (err, resp) => {
                //     if (err) {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     } else {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     }
                // });

            }
            //
            // 
            // [VODAFONE] Alter the status of the form file to Approval Pending. Also modify the 
            // last status alter time and current status for all the queue activity mappings.
            const OMT_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.OMT_APPROVAL;
            const CUSTOMER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL;

            if (
                activityStreamTypeId === 705 &&
                (
                    Number(request.form_id) === CUSTOMER_APPROVAL_FORM_ID
                )
            ) {
                util.logInfo(request,`CALLING setStatusApprovalPendingAndFireEmail`);
                const omtApprovalRequestEvent = {
                    name: "vodafoneService",
                    service: "vodafoneService",
                    method: "setStatusApprovalPendingAndFireEmail",
                    payload: request
                };
                // queueWrapper.raiseActivityEvent(omtApprovalRequestEvent, request.activity_id, (err, resp) => {
                //     if (err) {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     } else {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     }
                // });
            }
            //
            // 
            // [VODAFONE] Customer Management Approval Workflow
            if (activityStreamTypeId === 705 &&
                (Number(request.form_id) === global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL)) {
                console.log('CALLING customerManagementApprovalWorkflow');
                const omtApprovalRequestEvent = {
                    name: "vodafoneService",
                    service: "vodafoneService",
                    method: "customerManagementApprovalWorkflow",
                    payload: request
                };
                // queueWrapper.raiseActivityEvent(omtApprovalRequestEvent, request.activity_id, (err, resp) => {
                //     if (err) {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     } else {
                //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                //     }
                // });
            }

            let err;
            [err, data] = await timelineStandardCallsAsync(request);
            (err) ?
            util.logError(request,`Error in timelineStandardCalls`, { type: 'retrievingFormIdandProcessAsync', error: serializeError(err) }):
                error=false;

            return [error, responseData];
    }

    this.mentionsSendEmail = async (request) => {
        let responseData = [],
            error = false;

        let mentionedAssets, i;
        (typeof request.mentioned_assets === 'string')?
            mentionedAssets = JSON.parse(request.mentioned_assets):        
            mentionedAssets =request.mentioned_assets;

        console.log('mentionedAssets : ', mentionedAssets);

        //Get the sender Details
        let [err, senderAssetData] = await activityCommonService.getAssetDetailsAsync({
            organization_id: request.organization_id, 
            asset_id: request.asset_id
         });
    
        for(i=0; i<mentionedAssets.length;i++) {
            let [err, assetData] = await activityCommonService.getAssetDetailsAsync({
                                                                organization_id: request.organization_id, 
                                                                asset_id: mentionedAssets[i]
                                                             });
            
            await activityCommonService.updateMentionsCnt(request, mentionedAssets[i]);
            if(err || assetData.length > 0) {
                if((assetData[0].operating_asset_email_id).length === 0 || 
                    (assetData[0].operating_asset_first_name).length === 0) {
                    console.log('Either Operating asset name or email id not available for : ', mentionedAssets[i]);
                } else {
                    console.log('Mentioned Asset Data : ', assetData[0]);
                    console.log('------------------------');
                    console.log('Sender Asset Data : ', senderAssetData[0]);
                    ///console.log(assetData[0].asset_encryption_token_id);

                    console.log('Number(request.organization_id === 868) : ', Number(request.organization_id));

                    if(request.hasOwnProperty('is_version_v1') && request.is_version_v1 === 1) {
                        const senderEmail = (Number(request.organization_id) === 868) ? senderAssetData[0].operating_asset_email_id : request.email_sender;
                        const senderEmailPwd =  senderAssetData[0].asset_email_password;

                        const [err, resp] = await sendEmail({
                                            workflow_title: request.workflow_title,
                                            workflow_update: request.workflow_update,
                                            operating_asset_name: assetData[0].operating_asset_first_name,
                                            asset_email_id: assetData[0].operating_asset_email_id,
                                            email_receiver_name: assetData[0].operating_asset_first_name,
                                            email_sender_name: senderAssetData[0].operating_asset_first_name,
                                            email_sender_asset_id:senderAssetData[0].asset_id,
                                            email_sender_password: senderEmailPwd,
                                            email_sender: senderEmail,
                                            sender_asset_id: request.asset_id,
                                            receiver_asset_id: mentionedAssets[i],
                                            is_version_v1:1,
                                            organization_id:request.organization_id,
                                            get_email_pasword:senderAssetData[0].organization_flag_email_integration_enabled==1?1:0,
                                            receiver_asset_token_auth: assetData[0].asset_encryption_token_id,
                                            sender_asset_token_auth: senderAssetData[0].asset_encryption_token_id,
                                        }, request);
                        if(err) {
                            error = true;
                            responseData.push({'message': `${resp} for the mailId - ${senderEmail}`});
                        }
                    } else {
                        if(Number(request.organization_id) === 868){
                            return [false,[]]
                        }
                        const senderEmail = (Number(request.organization_id) === 868) ? 'ESMSMails@vodafoneidea.com' : senderAssetData[0].operating_asset_email_id;
                        const [err, resp] = await sendEmail({
                                                workflow_title: request.workflow_title,
                                                workflow_update: request.workflow_update,
                                                operating_asset_name: assetData[0].operating_asset_first_name,
                                                asset_email_id: assetData[0].operating_asset_email_id,
                                                email_receiver_name: assetData[0].operating_asset_first_name,
                                                email_sender_name: senderAssetData[0].operating_asset_first_name,                        
                                                //email_sender: senderAssetData[0].operating_asset_email_id
                                                email_sender: senderEmail,
                                                sender_asset_id: request.asset_id,
                                                receiver_asset_id: mentionedAssets[i],
                                                receiver_asset_token_auth: assetData[0].asset_encryption_token_id,
                                                sender_asset_token_auth: senderAssetData[0].asset_encryption_token_id,
                                            }, request);
                        if(err) {
                            error = true;
                            responseData.push({'message': `${resp} for the mailId - ${senderEmail}`});
                        }
                    }
                }
            } else {
                console.log('No Asset Data for  : ', mentionedAssets[i].asset_id);
                //This is Just in case if you want to test for some emails that are not going
                //sendEmail({
                //    workflow_title: request.workflow_title,
                //    workflow_update: request.workflow_update,
                //    //operating_asset_name: assetData[0].operating_asset_first_name,
                //    //asset_email_id: assetData[0].operating_asset_email_id,
                //    //email_receiver_name: assetData[0].operating_asset_first_name,
                //    //email_sender_name: senderAssetData[0].operating_asset_first_name,                        
                //    //email_sender: senderAssetData[0].operating_asset_email_id
                //    email_sender: 'ESMSMails@vodafoneidea.com',
                //    sender_asset_id: request.asset_id,
                //    receiver_asset_id: mentionedAssets[i],
                //    //receiver_asset_token_auth: assetData[0].asset_encryption_token_id,
                //    //sender_asset_token_auth: senderAssetData[0].asset_encryption_token_id,
                //}, request);
            }
        }

        return [error, responseData];
    };

    async function sendEmail(request, requestObj) {
        let responseData = [],
            error = false;


        const paramsJSON = {
            "organization_id": requestObj.organization_id,
            "account_id": requestObj.account_id,
            "workforce_id": requestObj.workforce_id,
            "asset_id": request.sender_asset_id,
            "auth_asset_id": request.receiver_asset_id,
            "asset_token_auth": request.receiver_asset_token_auth,
            "message_unique_id": util.getMessageUniqueId(request.sender_asset_id),
            "activity_type_category_id": requestObj.activity_type_category_id,
            "activity_type_id": requestObj.activity_type_id,
            "activity_id": requestObj.workflow_activity_id,
            "activity_parent_id": 0,
            "operating_asset_name": request.operating_asset_name,
            "us": true
        };
    
        const base64Json = Buffer.from(JSON.stringify(paramsJSON)).toString('base64');

        //const urlStr = `${global.config.esmsMentionsEmail}/#/email_link/eyJvcmdhbml6YXRpb25faWQiOjkwNiwiYWNjb3VudF9pZCI6MTAyMywid29ya2ZvcmNlX2lkIjo1NjYwLCJhc3NldF9pZCI6NDAzOTcsImF1dGhfYXNzZXRfaWQiOjQwMzk3LCJhc3NldF90b2tlbl9hdXRoIjoiMDU5ODZiYjAtZTM2NC0xMWU4LWExYzAtMGI2ODMxODMzNzU0IiwibWVzc2FnZV91bmlxdWVfaWQiOjE1ODc5ODUyMTExMDYsImFjdGl2aXR5X3R5cGVfY2F0ZWdvcnlfaWQiOjQ4LCJhY3Rpdml0eV90eXBlX2lkIjoxNDMzMTcsImFjdGl2aXR5X2lkIjoyODkxMzU1LCJhY3Rpdml0eV9wYXJlbnRfaWQiOjAsIm9wZXJhdGluZ19hc3NldF9uYW1lIjoiU2FoaWwgS2FzaGV0d2FyIn0=`;
        const urlStr = `${global.config.esmsMentionsEmail}/#/email_link/${base64Json}`;
        //console.log(urlStr);

        /*if (String(customerCollection.contactEmailId).includes('%40')) {
            customerCollection.contactEmailId = String(customerCollection.contactEmailId).replace(/%40/g, "@");
        }

        const encodedString = Buffer.from(JSON.stringify(jsonString)).toString('base64');
        const Template = "";*/
        let dateTime = await util.mentionsDateFormat();
        console.log('dateTime : ', dateTime);
        const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);

        
        let emailSubject = `You have been mentioned on ${request.workflow_title} @ ${await util.mentionsDateFormat()} By ${request.email_sender_name}`;

        const Template = `<table><tbody>
                            <tr>
                            <p>
                            Hello <strong>${request.operating_asset_name},</strong><br/>
                            You have been mentioned by ${request.email_sender_name} on ${request.workflow_title} @ ${await util.mentionsDateFormat()}
                            </p>
                            <p>
                                Following is the copy of the exact update... <br/>
                                ${request.workflow_update} 
                                </p>
                            <br/>
                            <p>
                            Please login to your desk and access ${request.workflow_title} for more details.
                            <br/>
                            Optionally tap on this <a style='color: #ED212C;' target='_blank'  href='${urlStr}'>Link</a>  to reply.
                            </p>
                            <p>
                            Thankyou
                            <br>
                            ${defaultAssetName}
                            </p>
                            </tr>
                            </tbody>
                            </table>`;

        console.log('Number(requestObj.organization_id) : ', requestObj.organization_id);

        if(request.get_email_pasword==1) {
            console.log('Sending mentions email to : ', request.asset_email_id);
            // console.log('Template : ', Template);
            //request,emails,subject,body,attachment,emailProviderDetails,base64EncodedHtmlTemplate = ''
            const err = await util.sendEmailV4ewsV1(request,[request.asset_email_id], emailSubject, Template,"",{},"");
            if(err) {
                return [true, 'Invalid Password'];
            } else {
                return [false, 'Success'];
            }
        } else {
            console.log('Non-Vodafone Organization!');
            console.log('Sending mentions email to : ', request.asset_email_id);

            util.sendEmailV3(request,
                request.asset_email_id,
                emailSubject,
                "IGNORE",
                Template,
                (err, data) => {
                           if (err) {
                               console.log("[Send Email - SIB - Mention | Error]: ", data);
                           } else {
                               console.log("[Send Email - SIB - Mention | Response]: ", "Email Sent");
                           }                
                       }
                );
        }
        
        return [error, responseData];
    }

    this.activityTimelineTxnSelectActivityStatus = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
                    request.organization_id,
                    request.activity_id,
                    request.activity_status_id,
                    request.flag || 0,
                    request.page_start || 0, // start_from
                    request.page_limit || 1 // limit_value
                );

        const queryString = util.getQueryString('ds_p1_activity_timeline_transaction_select_activity_status', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });            
        }
        return [error, responseData];
    };


    this.getNooftimeFormSubmitted = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.activity_id,
                    request.form_id,
                    request.page_start || 0, // start_from
                    request.page_limit || 1 // limit_value
                );

        const queryString = util.getQueryString('ds_v1_1_activity_timeline_transaction_select_activity_form', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });            
        }
        return [error, responseData];
    };

    async function getPreviewEnabledFields(request) {
        let responseData = [],
            error = true;

        const paramsArr = [
                    request.organization_id,
                    request.workflow_activity_type_id || 0,                    
                    request.form_id,
                    0, //flag
                    0, // start_from
                    50 // limit_value
        ];

        const queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select_preview_enable', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });            
        }
        return [error, responseData];
    };

    this.timelineTxnFormList = async (request) => {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.activity_id,
                    request.form_id,
                    request.page_start || 0, // start_from
                    request.page_limit || 1 // limit_value
                );

        const queryString = util.getQueryString('ds_p1_2_activity_timeline_transaction_select_activity_form', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });            
        }
        return [error, responseData];
    };

    async function kafkaProdcucerForChildOrderCreation(topicName, message) {
        // const kafka = new Kafka({
        //     clientId: 'child-order-creation',
        //     brokers: global.config.BROKER_HOST.split(",")
        // })

        // const producer = kafka.producer()

        // await producer.connect()
        // await producer.send({
        //     topic: topicName,

        //     messages: [
        //         {
        //             value: JSON.stringify(message)
        //         },
        //     ],
        // })
        // producer.disconnect();

        sqs.sendMessage({
            // DelaySeconds: 5,
            MessageBody: JSON.stringify(message),
            QueueUrl: global.config.ChildOrdersSQSqueueUrl,
            MessageGroupId: `mom-creation-queue-v1`,
            MessageDeduplicationId: uuidv4(),
            MessageAttributes: {
                "Environment": {
                    DataType: "String",
                    StringValue: global.mode
                },
            }
        }, (error, data) => {
            if (error) {
                logger.error("Error sending excel job to SQS queue", { type: 'bot_engine', error: serializeError(error)});
                console.log("Error sending excel job to SQS queue", { type: 'bot_engine', error: serializeError(error)})
            } else {
                logger.info("Successfully sent excel job to SQS queue: %j", data);    
                console.log("Successfully sent excel job to SQS queue: %j", data);                                    
            }
        });


        return;
    }
}

module.exports = ActivityTimelineService;
