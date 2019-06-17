/* eslint-disable no-console */
/*
 * author: Nani Kalyan V
 */

var ActivityService = require('../../services/activityService.js');
var ActivityParticipantService = require('../../services/activityParticipantService.js');
//var ActivityUpdateService = require('../../services/activityUpdateService.js');
var ActivityTimelineService = require('../../services/activityTimelineService.js');
//var ActivityListingService = require('../../services/activityListingService.js');
const aws = require('aws-sdk');
var fs = require('fs');
aws.config.loadFromPath(`${__dirname}/configS3.json`);
const s3 = new aws.S3();
var pdf = require('html-pdf');

function BotService(objectCollection) {

    const moment = require('moment');
    const makeRequest = require('request');
    const TinyURL = require('tinyurl');

    const cacheWrapper = objectCollection.cacheWrapper;
    const queueWrapper = objectCollection.queueWrapper;
    //const activityPushService = objectCollection.activityPushService;

    const util = objectCollection.util;
    const db = objectCollection.db;
    const botConfig = require('../utils/botConfig.js');

    const activityCommonService = objectCollection.activityCommonService;
    //const activityUpdateService = new ActivityUpdateService(objectCollection);
    const activityParticipantService = new ActivityParticipantService(objectCollection);
    const activityService = new ActivityService(objectCollection);
    //const activityListingService = new ActivityListingService(objectCollection);
    const activityTimelineService = new ActivityTimelineService(objectCollection);

    const nodeUtil = require('util');
    /*
    //Generic function for firing stored procedures
    //Bharat Masimukku
    //2019-01-20
    this.callDBProcedure = 
    async (request, procName, paramsArray, flagReadOperation) =>
    {
        try
        {
            let queryString = util.getQueryString(procName, paramsArray);

            if (queryString != '') 
            {                
                let result = await (db.executeQueryPromise(flagReadOperation, queryString, request));
                console.log(`DB SP Result:\n${JSON.stringify(result, null, 4)}`);
                console.log(`Query Status:\n${JSON.stringify(result[0].query_status, null, 4)}`);

                if (result[0].query_status === 0)
                {
                    return result;
                }
                else
                {
                    return Promise.reject(result);
                }            
            }
            else
            {
                return Promise.reject(`Invalid Query String`);
            }
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };
    */

    //Retrieve the supported trigger types for defining a new bot
    //Bharat Masimukku
    //2019-01-17
    this.getBotTriggerTypes =
        async (request) => {
            try {
                let results = new Array();
                let paramsArray;

                paramsArray =
                    new Array(
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                results[0] = db.callDBProcedure(request, 'ds_p1_bot_trigger_master_select', paramsArray, 1);

                return results[0];
            } catch (error) {
                return Promise.reject(error);
            }
        };

    //Retrieve the supported operation types for defining a new bot
    //Bharat Masimukku
    //2019-01-17
    this.getBotOperationTypes =
        async (request) => {
            try {
                let results = new Array();
                let paramsArray;

                paramsArray =
                    new Array(
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                results[0] = db.callDBProcedure(request, 'ds_p1_bot_operation_type_master_select', paramsArray, 1);

                return results[0];
            } catch (error) {
                return Promise.reject(error);
            }
        };

    //Insert a new bot definition which includes the type of trigger and the supporting info for the trigger
    //Bharat Masimukku
    //2019-01-17
    this.addBot =
        async (request) => {
            try {
                let results = new Array();
                let paramsArray;

                paramsArray =
                    new Array(
                        request.bot_name,
                        request.bot_inline_data,
                        request.bot_level_id,
                        request.bot_trigger_id,
                        request.field_id,
                        request.form_id,
                        request.activity_status_id,
                        request.activity_type_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.log_asset_id,
                        request.log_datetime,
                    );

                results[0] = await db.callDBProcedure(request, 'ds_p1_bot_list_insert', paramsArray, 0);

                paramsArray =
                    new Array(
                        results[0][0].bot_id,
                        request.organization_id,
                        global.botConfig.botAdded,
                        request.log_asset_id,
                        request.log_datetime,
                    );

                results[1] = await db.callDBProcedure(request, 'ds_p1_bot_list_history_insert', paramsArray, 0);

                return results[0];
            } catch (error) {
                return Promise.reject(error);
            }
        };

    //Alter bot definition
    //Bharat Masimukku
    //2019-01-18
    this.alterBot =
        async (request) => {
            try {
                let results = new Array();
                let paramsArray;

                paramsArray =
                    new Array(
                        request.bot_id,
                        request.bot_level_id,
                        request.bot_trigger_id,
                        request.organization_id,
                        request.log_asset_id,
                        request.log_datetime,
                    );

                results[0] = await db.callDBProcedure(request, 'ds_p1_bot_list_update', paramsArray, 0);

                paramsArray =
                    new Array(
                        request.bot_id,
                        request.organization_id,
                        global.botConfig.botAltered,
                        request.log_asset_id,
                        request.log_datetime,
                    );

                results[1] = await db.callDBProcedure(request, 'ds_p1_bot_list_history_insert', paramsArray, 0);

                return results[0];
            } catch (error) {
                return Promise.reject(error);
            }
        };

    //Archive bot definition
    //Bharat Masimukku
    //2019-01-18
    this.archiveBot =
        async (request) => {
            try {
                let results = new Array();
                let paramsArray;

                paramsArray =
                    new Array(
                        request.bot_id,
                        request.organization_id,
                        request.log_state,
                        request.log_asset_id,
                        request.log_datetime,
                    );

                results[0] = await db.callDBProcedure(request, 'ds_p1_bot_list_update_log_state', paramsArray, 0);

                paramsArray =
                    new Array(
                        request.bot_id,
                        request.organization_id,
                        global.botConfig.botArchived,
                        request.log_asset_id,
                        request.log_datetime,
                    );

                results[1] = await db.callDBProcedure(request, 'ds_p1_bot_list_history_insert', paramsArray, 0);

                return results[0];
            } catch (error) {
                return Promise.reject(error);
            }
        };

    //Insert a new bot operation mapping
    //Bharat Masimukku
    //2019-01-18
    this.addBotWorkflowStep =
        async (request) => {
            try {
                let results = new Array();
                let paramsArray;

                paramsArray =
                    new Array(
                        request.bot_id,
                        request.bot_operation_type_id,
                        request.bot_operation_sequence_id,
                        request.bot_operation_inline_data,
                        request.organization_id,
                        request.log_asset_id,
                        request.log_datetime,
                    );

                results[0] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_insert', paramsArray, 0);

                paramsArray =
                    new Array(
                        request.bot_id,
                        results[0][0].bot_operation_id,
                        request.organization_id,
                        global.botConfig.botOperationAdded,
                        request.log_asset_id,
                        request.log_datetime,
                    );

                results[1] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_history_insert', paramsArray, 0);

                return results[0];
            } catch (error) {
                return Promise.reject(error);
            }
        };

    //Alter bot operation mapping
    //Bharat Masimukku
    //2019-01-18
    this.alterBotWorkflowStep =
        async (request) => {
            try {
                let results = new Array();
                let paramsArray;

                let sequenceCurrent = request.bot_operation_sequence_current;
                let sequenceNew = request.bot_operation_sequence_new;

                paramsArray =
                    new Array(
                        request.bot_id,
                        0,
                        1000,
                    );

                results[0] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_select', paramsArray, 0);

                if (sequenceCurrent < sequenceNew) {
                    for (let value of results[0]) {
                        //console.log(value.bot_operation_sequence_id);

                        if (Number(value.bot_operation_sequence_id) > Number(sequenceCurrent) && Number(value.bot_operation_sequence_id) <= Number(sequenceNew)) {
                            paramsArray =
                                new Array(
                                    value.bot_operation_id,
                                    value.bot_id,
                                    (value.bot_operation_sequence_id - 1),
                                    value.organization_id,
                                    request.log_asset_id,
                                    request.log_datetime,
                                );

                            results[1] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_update_sequence', paramsArray, 0);

                            paramsArray =
                                new Array(
                                    value.bot_id,
                                    value.bot_operation_id,
                                    value.organization_id,
                                    global.botConfig.botOperationAltered,
                                    request.log_asset_id,
                                    request.log_datetime,
                                );

                            results[2] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_history_insert', paramsArray, 0);
                        }

                        if (Number(value.bot_operation_sequence_id) === Number(sequenceCurrent)) {
                            paramsArray =
                                new Array(
                                    value.bot_operation_id,
                                    value.bot_id,
                                    sequenceNew,
                                    value.organization_id,
                                    request.log_asset_id,
                                    request.log_datetime,
                                );

                            results[1] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_update_sequence', paramsArray, 0);

                            paramsArray =
                                new Array(
                                    value.bot_id,
                                    value.bot_operation_id,
                                    value.organization_id,
                                    global.botConfig.botOperationAltered,
                                    request.log_asset_id,
                                    request.log_datetime,
                                );

                            results[2] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_history_insert', paramsArray, 0);
                        }
                    }
                } else if (sequenceCurrent > sequenceNew) {
                    for (let value of results[0]) {
                        //console.log(value.bot_operation_sequence_id);

                        if (Number(value.bot_operation_sequence_id) >= Number(sequenceNew) && Number(value.bot_operation_sequence_id) < Number(sequenceCurrent)) {
                            paramsArray =
                                new Array(
                                    value.bot_operation_id,
                                    value.bot_id,
                                    (value.bot_operation_sequence_id + 1),
                                    value.organization_id,
                                    request.log_asset_id,
                                    request.log_datetime,
                                );

                            results[1] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_update_sequence', paramsArray, 0);

                            paramsArray =
                                new Array(
                                    value.bot_id,
                                    value.bot_operation_id,
                                    value.organization_id,
                                    global.botConfig.botOperationAltered,
                                    request.log_asset_id,
                                    request.log_datetime,
                                );

                            results[2] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_history_insert', paramsArray, 0);
                        }

                        if (Number(value.bot_operation_sequence_id) === Number(sequenceCurrent)) {
                            paramsArray =
                                new Array(
                                    value.bot_operation_id,
                                    value.bot_id,
                                    sequenceNew,
                                    value.organization_id,
                                    request.log_asset_id,
                                    request.log_datetime,
                                );

                            results[1] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_update_sequence', paramsArray, 0);

                            paramsArray =
                                new Array(
                                    value.bot_id,
                                    value.bot_operation_id,
                                    value.organization_id,
                                    global.botConfig.botOperationAltered,
                                    request.log_asset_id,
                                    request.log_datetime,
                                );

                            results[2] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_history_insert', paramsArray, 0);
                        }
                    }
                } else {
                    return Promise.reject("Invalid new sequence id for the bot operation");
                }

                paramsArray =
                    new Array(
                        request.bot_id,
                        0,
                        1000,
                    );

                results[3] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_select', paramsArray, 0);
                return results[3];
            } catch (error) {
                return Promise.reject(error);
            }
        };

    //Archive bot operation mapping
    //Bharat Masimukku
    //2019-01-18
    this.archiveBotWorkflowStep =
        async (request) => {
            try {
                let results = new Array();
                let paramsArray;

                paramsArray =
                    new Array(
                        request.bot_id,
                        request.bot_operation_id,
                        request.organization_id,
                        request.log_state,
                        request.log_asset_id,
                        request.log_datetime,
                    );

                results[0] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_update_log_state', paramsArray, 0);

                paramsArray =
                    new Array(
                        request.bot_id,
                        request.bot_operation_id,
                        request.organization_id,
                        global.botConfig.botOperationArchived,
                        request.log_asset_id,
                        request.log_datetime,
                    );

                results[1] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_history_insert', paramsArray, 0);

                return results[0];
            } catch (error) {
                return Promise.reject(error);
            }
        };

    this.getBotsMappedToActType = async (request) => {
        let paramsArr = new Array(
            request.flag || 1,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id,
            request.field_id,
            request.form_id,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_p1_bot_list_select', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    this.getBotworkflowSteps = async (request) => {
        let paramsArr = new Array(
            request.bot_id,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_p1_bot_operation_mapping_select', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    this.initBotEngine = async (request) => {

        //Bot Log - Bot engine Triggered
        activityCommonService.botOperationFlagUpdateTrigger(request, 1);

        global.logger.write('conLog', ' ', {}, {});
        global.logger.write('conLog', '#############################################################################', {}, {});
        global.logger.write('conLog', ' ', {}, {});
        global.logger.write('conLog', '############################### ENTERED BOT ENGINE ##########################', {}, {});
        global.logger.write('conLog', ' ', {}, {});
        global.logger.write('conLog', '#############################################################################', {}, {});
        global.logger.write('conLog', ' ', {}, {});

        request['datetime_log'] = util.getCurrentUTCTime();
        // console.log("initBotEngine | request: ", request);

        let wfSteps;

        /*if(request.hasOwnProperty(bot_operation_id)) {
            wfSteps = request.inline_data;
        } else {
            wfSteps = await this.getBotworkflowSteps({
                "bot_id": request.bot_id,
                "page_start": 0,
                "page_limit": 50
            });
        }*/

        wfSteps = await this.getBotworkflowSteps({
            "bot_id": request.bot_id,
            "page_start": 0,
            "page_limit": 50
        });

        //console.log('WFSTEPS : ', wfSteps);

        let botOperationsJson,
            botSteps;

        for (let i of wfSteps) {
            global.logger.write('conLog', i.bot_operation_type_id, {}, {});

            botOperationsJson = JSON.parse(i.bot_operation_inline_data);
            botSteps = Object.keys(botOperationsJson.bot_operations);
            global.logger.write('conLog', botSteps, {}, {});

            switch (i.bot_operation_type_id) {
                //case 'participant_add':
                case 1: // Add Participant                 
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'PARTICIPANT ADD', {}, {});
                    try {
                        await addParticipant(request, botOperationsJson.bot_operations.participant_add);
                    } catch (err) {
                        global.logger.write('serverError', 'Error in executing addParticipant Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                        //return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                //case 'status_alter': 
                case 2: // Alter Status
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'STATUS ALTER', {}, {});
                    global.logger.write('conLog', 'Request Params received from Request', {}, {});
                    global.logger.write('conLog', request, {}, {});
                    try {
                        let result = await changeStatus(request, botOperationsJson.bot_operations.status_alter);
                        if (result[0]) {
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": result[1]
                            });
                        }
                    } catch (err) {
                        global.logger.write('serverError', err, {}, {});
                        global.logger.write('conLog', 'Error in executing changeStatus Step', {}, {});
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                        //return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                //case 'form_field_copy':
                case 3: //Copy Form field
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'FORM FIELD', {}, {});
                    try {
                        // global.logger.write('conLog', 'Request Params received by BOT ENGINE', request, {});
                        console.log('form_field_copy | Request Params received by BOT ENGINE', request);
                        await copyFields(request, botOperationsJson.bot_operations.form_field_copy);
                    } catch (err) {
                        global.logger.write('conLog', 'Error in executing copyFields Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                        //return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                //case 'workflow_percentage_alter': 
                case 4: //Update Workflow Percentage
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'WF PERCENTAGE ALTER', {}, {});
                    global.logger.write('conLog', 'Request Params received from Request', {}, {});
                    global.logger.write('conLog', request, {}, {});
                    try {
                        let result = await alterWFCompletionPercentage(request, botOperationsJson.bot_operations.workflow_percentage_alter);
                        if (result[0]) {
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": result[1]
                            });
                        }
                    } catch (err) {
                        global.logger.write('conLog', 'Error in executing alterWFCompletionPercentage Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                        //return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                //case 'fire_api': 
                case 5: // External System Integration
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'FIRE API', {}, {});
                    try {
                        await fireApi(request, botOperationsJson.bot_operations.fire_api);
                    } catch (err) {
                        global.logger.write('conLog', 'Error in executing fireApi Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        i.bot_operation_status_id = 3;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                        //return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                //case 'fire_text': 
                case 6: // Send Text Message
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'FIRE TEXT', {}, {});
                    try {
                        await fireTextMsg(request, botOperationsJson.bot_operations.fire_text);
                    } catch (err) {
                        global.logger.write('conLog', 'Error in executing fireTextMsg Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        i.bot_operation_status_id = 4;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                        //return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                //case 'fire_email':           
                case 7: // Send email
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'FIRE EMAIL', {}, {});
                    try {
                        await fireEmail(request, botOperationsJson.bot_operations.fire_email);
                    } catch (err) {
                        global.logger.write('conLog', 'Error in executing fireEmail Step', {}, {});
                        console.log("Error in executing fireEmail Step: ", err)
                        global.logger.write('serverError', err, {}, {});
                        i.bot_operation_status_id = 4;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                        //return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;
            }

            //botOperationTxnInsert(request, i);
            botOperationTxnInsertV1(request, i);
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve();
                }, 1000);
            });
        }

        return {};
    };

    async function botOperationTxnInsert(request, botData) {
        let paramsArr = new Array(
            botData.bot_operation_id,
            botData.bot_id,
            botData.bot_operation_inline_data,
            botData.bot_operation_status_id || 1,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.asset_id,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_p1_bot_operation_transaction_insert', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));
        }
    }

    async function botOperationTxnInsertV1(request, botData) {
        let paramsArr = new Array(
            request.bot_transaction_id || 0,
            botData.bot_operation_status_id || 1,
            //botData.bot_operation_transaction_status_id || 0, 
            botData.bot_operation_inline_data || '{}',
            request.workflow_activity_id || 0,
            request.form_activity_id || 0,
            request.form_transaction_id || 0,
            ///////////////////////////
            botData.bot_operation_id,
            botData.bot_id,
            '{}',
            //botData.bot_operation_inline_data, 
            botData.bot_operation_status_id || 1,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.asset_id,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_p1_1_bot_operation_log_transaction_insert', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));
        }
    }

    //Bot Step to change the status
    async function changeStatus(request, inlineData) {
        let newReq = Object.assign({}, request);
        global.logger.write('conLog', inlineData, {}, {});
        newReq.activity_id = request.workflow_activity_id;
        newReq.activity_status_id = inlineData.activity_status_id;
        //newRequest.activity_status_type_id = inlineData.activity_status_id; 
        //newRequest.activity_status_type_category_id = ""; 
        newReq.activity_type_category_id = 48;
        newReq.message_unique_id = util.getMessageUniqueId(request.asset_id);
        newReq.device_os_id = 9;
        newReq.log_asset_id = 100; // Tony

        const statusName = await getStatusName(newReq, inlineData.activity_status_id);
        if (Number(statusName.length) > 0) {
            newReq.activity_timeline_collection = JSON.stringify({
                "activity_reference": [{
                    "activity_id": newReq.activity_id,
                    "activity_title": ""
                }],
                "asset_reference": [{}],
                "attachments": [],
                "content": `Status updated to ${statusName[0].activity_status_name || ""}`,
                "mail_body": `Status updated to ${statusName[0].activity_status_name || ""}`,
                "subject": `Status updated to ${statusName[0].activity_status_name || ""}`
            });
        }

        try {
            await new Promise((resolve, reject) => {
                activityService.alterActivityStatus(newReq, (err, resp) => {
                    (err === false) ? resolve() : reject(err);
                });
            });

            await activityService.updateWorkflowQueueMapping(newReq);
        } catch (err) {
            return [true, "unknown Error"];
        }

        let resp = await getQueueActivity(newReq, request.workflow_activity_id);
        global.logger.write('conLog', resp, {}, {});

        if (resp.length > 0) {
            let workflowActivityPercentage = 0;
            try {
                await activityCommonService
                    .getActivityDetailsPromise(request, request.workflow_activity_id)
                    .then((workflowActivityData) => {
                        if (workflowActivityData.length > 0) {
                            workflowActivityPercentage = Number(workflowActivityData[0].activity_workflow_completion_percentage);
                        }
                    })
                    .catch((error) => {
                        console.log("BotEngine: changeStatus | getActivityDetailsPromise | error: ", error);
                    });
            } catch (error) {
                console.log("BotEngine: changeStatus | Activity Details Fetch Error | error: ", error);
            }

            // let statusName = await getStatusName(newReq, inlineData.activity_status_id);
            global.logger.write('conLog', 'Status Alter BOT Step - status Name : ', statusName, {});

            let queuesData = await getAllQueuesBasedOnActId(newReq, request.workflow_activity_id);

            global.logger.write('conLog', 'queues Data : ', queuesData, {});

            let queueActMapInlineData;
            let data;
            for (let i of queuesData) {
                queueActMapInlineData = JSON.parse(i.queue_activity_mapping_inline_data);

                queueActMapInlineData.queue_sort.current_status_id = inlineData.activity_status_id;
                queueActMapInlineData.queue_sort.current_status_name = statusName[0].activity_status_name || "";
                queueActMapInlineData.queue_sort.last_status_alter_time = util.getCurrentUTCTime();

                // Bring the percentage up to the latest value
                if (Number(workflowActivityPercentage) !== 0) {
                    queueActMapInlineData.queue_sort.caf_completion_percentage = workflowActivityPercentage;
                }

                data = await (activityCommonService.queueActivityMappingUpdateInlineData(newReq, i.queue_activity_mapping_id, JSON.stringify(queueActMapInlineData)));
                global.logger.write('conLog', 'Status Alter BOT Step - Updating the Queue Json : ', data, {});

                activityCommonService.queueHistoryInsert(newReq, 1402, i.queue_activity_mapping_id).then(() => { });
            }



            //Checking the queuemappingid
            /*let queueActivityMappingData = await (activityCommonService.fetchQueueActivityMappingId({activity_id: request.workflow_activity_id,
                                                                                                     organization_id: newReq.organization_id}, 
                                                                                                     resp[0].queue_id));            
            global.logger.write('conLog', 'Status Alter BOT Step - queueActivityMappingData : ',queueActivityMappingData,{});
            
            /*if(queueActivityMappingData.length > 0){

                let statusName = await getStatusName(newReq, inlineData.activity_status_id);
                global.logger.write('conLog', 'Status Alter BOT Step - status Name : ',statusName,{});

                let queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;  
                let queueActMapInlineData = JSON.parse(queueActivityMappingData[0].queue_activity_mapping_inline_data);
                
                queueActMapInlineData.queue_sort.current_status_id = inlineData.activity_status_id;
                queueActMapInlineData.queue_sort.current_status_name = statusName[0].activity_status_name || "";
                queueActMapInlineData.queue_sort.last_status_alter_time = util.getCurrentUTCTime();
                
                global.logger.write('conLog', 'Status Alter BOT Step - Updated Queue JSON : ',queueActMapInlineData,{});
                
                let data = await (activityCommonService.queueActivityMappingUpdateInlineData(newReq, queueActivityMappingId, JSON.stringify(queueActMapInlineData)));                
                global.logger.write('conLog', 'Status Alter BOT Step - Updating the Queue Json : ',data,{});
                
                activityCommonService.queueHistoryInsert(newReq, 1402, queueActivityMappingId).then(()=>{});                
                return [false, {}];
            }
        } else {
            return [true, "Queue Not Available"];
        }*/
            return [false, {}];
        } else {
            return [true, "Resp is Empty"];
        }
    }

    //Bot Step Copying the fields
    async function copyFields(request, fieldCopyInlineData) {

        const workflowActivityID = Number(request.workflow_activity_id),
            sourceFormActivityID = Number(request.activity_id),
            sourceFormTransactionID = Number(request.form_transaction_id),
            sourceFormID = Number(request.form_id),
            targetFormID = Number(fieldCopyInlineData[0].target_form_id);

        let sourceFormTransactionData = [],
            targetFormTransactionData = [],
            targetFormActivityID = 0,
            targetFormTransactionID = 0;

        // Check if the target form already exists for the given workflow
        try {
            targetFormTransactionData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, workflowActivityID, targetFormID);

            if (Number(targetFormTransactionData.length) > 0) {
                targetFormTransactionID = targetFormTransactionData[0].data_form_transaction_id;
                targetFormActivityID = targetFormTransactionData[0].data_activity_id;
            }
        } catch (error) {
            console.log("copyFields | Fetch Target Form Transaction Data | Error: ", error);
            throw new Error(error);
        }

        let activityInlineData = [],
            activityInlineDataMap = new Map(),
            REQUEST_FIELD_ID = 0;

        for (const batch of fieldCopyInlineData) {
            const sourceFieldID = Number(batch.source_field_id);
            const targetFieldID = Number(batch.target_field_id);

            // This is purely for passing as a parameter to the field alter service
            REQUEST_FIELD_ID = targetFieldID;

            const sourceFieldData = await getFieldValue({
                form_transaction_id: sourceFormTransactionID,
                form_id: sourceFormID,
                field_id: sourceFieldID,
                organization_id: request.organization_id
            });

            const sourceFieldDataTypeID = Number(sourceFieldData[0].data_type_id);
            const sourceFieldValue = sourceFieldData[0][getFielDataValueColumnName(sourceFieldDataTypeID)];

            activityInlineDataMap.set(sourceFieldID, {
                // "form_name": Number(sourceFieldData[0].form_name),
                "data_type_combo_id": Number(sourceFieldData[0].data_type_combo_id),
                "data_type_combo_value": Number(sourceFieldData[0].data_type_combo_value) || "",
                "field_data_type_category_id": Number(sourceFieldData[0].data_type_category_id),
                "field_data_type_id": Number(sourceFieldData[0].data_type_id),
                "field_id": targetFieldID,
                "field_name": String(sourceFieldData[0].field_name),
                "field_value": sourceFieldValue,
                "form_id": targetFormID,
                "message_unique_id": 123123123123123123
            });
        }
        activityInlineData = [...activityInlineDataMap.values()];
        console.log("copyFields | activityInlineData: ", activityInlineData);

        if (targetFormTransactionID !== 0) {
            let fieldsAlterRequest = Object.assign({}, request);
            fieldsAlterRequest.form_transaction_id = targetFormTransactionID;
            fieldsAlterRequest.form_id = targetFormID;
            fieldsAlterRequest.field_id = REQUEST_FIELD_ID;
            fieldsAlterRequest.activity_inline_data = JSON.stringify(activityInlineData);
            fieldsAlterRequest.activity_id = targetFormActivityID;
            fieldsAlterRequest.workflow_activity_id = workflowActivityID;

            try {
                await alterFormActivityFieldValues(fieldsAlterRequest);
            } catch (error) {
                console.log("copyFields | alterFormActivityFieldValues | Error: ", error);
            }

        } else if (targetFormTransactionID === 0 || targetFormActivityID === 0) {
            // If the target form has not been submitted yet, create one
            let createTargetFormRequest = Object.assign({}, request);
            createTargetFormRequest.activity_form_id = targetFormID;
            createTargetFormRequest.form_id = targetFormID;
            createTargetFormRequest.activity_inline_data = JSON.stringify(activityInlineData);
            createTargetFormRequest.workflow_activity_id = workflowActivityID;

            try {
                await createTargetFormActivity(createTargetFormRequest);
            } catch (error) {
                console.log("copyFields | createTargetFormActivity | Error: ", error);
            }
        }
        return;
    }

    async function createTargetFormActivity(createTargetFormRequest) {
        // Get the activity_id and form_trasanction_id
        const targetFormActivityID = await cacheWrapper.getActivityIdPromise();
        const targetFormTransactionID = await cacheWrapper.getFormTransactionIdPromise();

        if (
            Number(targetFormActivityID) === 0 ||
            Number(targetFormTransactionID) === 0
        ) {
            throw new Error("Error Fetching Activity ID or Form Transaction ID");
        }

        createTargetFormRequest.activity_id = targetFormActivityID;
        createTargetFormRequest.form_transaction_id = targetFormTransactionID;

        // Fetch the activity_type_id
        let targetFormctivityTypeID = 0;
        const [workforceActivityTypeMappingError, workforceActivityTypeMappingData] = await workforceActivityTypeMappingSelect({
            organization_id: createTargetFormRequest.organization_id,
            account_id: createTargetFormRequest.account_id,
            workforce_id: createTargetFormRequest.workforce_id,
            activity_type_category_id: 9
        });
        if (
            (workforceActivityTypeMappingError === false) &&
            (Number(workforceActivityTypeMappingData.length) > 0)
        ) {
            targetFormctivityTypeID = Number(workforceActivityTypeMappingData[0].activity_type_id) || 134492;
        }

        if (targetFormctivityTypeID === 0) {
            throw new Error("createTargetFormActivity | Error Fetching targetFormctivityTypeID");
        }
        createTargetFormRequest.activity_type_id = targetFormctivityTypeID;

        // Get the target form's name:
        let targetFormName = '';
        const [targetFormConfigError, targetFormConfigData] = await activityCommonService.workforceFormMappingSelect({
            organization_id: createTargetFormRequest.organization_id,
            account_id: createTargetFormRequest.account_id,
            workforce_id: createTargetFormRequest.workforce_id,
            form_id: createTargetFormRequest.form_id
        });
        if (targetFormConfigData.length > 0) {
            targetFormName = targetFormConfigData[0].form_name;
        }
        createTargetFormRequest.activity_title = `${util.getCurrentUTCTime()} - ${targetFormName || ''}`;
        createTargetFormRequest.activity_description = `${util.getCurrentUTCTime()} - ${targetFormName || ''}`;

        // Other miscellaneous parameters
        createTargetFormRequest.activity_datetime_start = util.getCurrentUTCTime();
        createTargetFormRequest.activity_datetime_end = util.getCurrentUTCTime();
        createTargetFormRequest.activity_type_category_id = 9;
        createTargetFormRequest.activity_sub_type_id = 0;
        createTargetFormRequest.activity_access_role_id = 21;
        createTargetFormRequest.activity_status_type_category_id = 1;
        createTargetFormRequest.activity_status_type_id = 22;
        createTargetFormRequest.asset_participant_access_id = 21;
        createTargetFormRequest.activity_flag_file_enabled = -1;
        createTargetFormRequest.activity_parent_id = 0;
        createTargetFormRequest.flag_pin = 0;
        createTargetFormRequest.flag_offline = 0;
        createTargetFormRequest.flag_retry = 0;
        createTargetFormRequest.device_os_id = 5;
        createTargetFormRequest.activity_stream_type_id = 705;
        createTargetFormRequest.flag_timeline_entry = 1;
        createTargetFormRequest.url = "/r1/activity/add/v1";
        createTargetFormRequest.create_workflow = 1;

        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        await addActivityAsync(createTargetFormRequest);

        // Make a 705 timeline transaction entry in the workflow file
        if (createTargetFormRequest.hasOwnProperty("workflow_activity_id")) {
            let workflowFile705Request = Object.assign({}, createTargetFormRequest);
            workflowFile705Request.activity_id = createTargetFormRequest.workflow_activity_id;
            workflowFile705Request.data_activity_id = Number(createTargetFormRequest.activity_id);
            workflowFile705Request.form_transaction_id = Number(createTargetFormRequest.form_transaction_id);
            workflowFile705Request.activity_type_category_id = 48;
            workflowFile705Request.activity_stream_type_id = 705;
            workflowFile705Request.flag_timeline_entry = 1;
            workflowFile705Request.message_unique_id = util.getMessageUniqueId(createTargetFormRequest.asset_id);
            workflowFile705Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            workflowFile705Request.device_os_id = 8;

            workflowFile705Request.activity_timeline_collection = JSON.stringify({
                "mail_body": `${targetFormName} Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                "subject": `${targetFormName}`,
                "content": `${targetFormName}`,
                "asset_reference": [],
                "activity_reference": [],
                "form_approval_field_reference": [],
                "form_submitted": JSON.parse(createTargetFormRequest.activity_inline_data),
                "attachments": []
            });

            const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
            try {
                await addTimelineTransactionAsync(workflowFile705Request);
            } catch (error) {
                console.log("createTargetFormActivity | workflowFile705Request | addTimelineTransactionAsync | Error: ", error);
                throw new Error(error);
            }
        }
        return;
    }

    async function workforceActivityTypeMappingSelect(request) {
        // IN p_organization_id BIGINT(20), IN p_account_id bigint(20), 
        // IN p_workforce_id bigint(20), IN p_form_id BIGINT(20)

        let formData = [],
            error = true;

        const paramsArr = new Array(
            request.access_level_id || 0,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.page_start || 0,
            request.page_limit || 50
        );
        const queryString = util.getQueryString('ds_p1_1_workforce_activity_type_mapping_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    formData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, formData];
    }

    function getFielDataValueColumnName(fieldDataTypeID) {
        switch (fieldDataTypeID) {
            case 1: // Date
                return 'data_entity_datetime_2';
            case 5: // Number
                return 'data_entity_bigint_1';
            case 6: // Decimal
                return 'data_entity_double_1';
            case 19: // Short Text
            case 21: // Label
            case 22: // Email ID
            case 27: // General Signature with asset reference
            case 33: // Single Selection List
                return 'data_entity_text_1';
            case 20: // Long Text
                return 'data_entity_text_2';
        }
    }

    // Bot Step Adding a participant
    async function addParticipant(request, inlineData) {
        let newReq = Object.assign({}, request);
        let resp;
        global.logger.write('conLog', inlineData, {}, {});
        newReq.message_unique_id = util.getMessageUniqueId(request.asset_id);

        let type = Object.keys(inlineData);
        global.logger.write('conLog', type, {}, {});

        if (type[0] === 'static') {
            newReq.flag_asset = inlineData[type[0]].flag_asset;

            if (Number(newReq.flag_asset) === 1) {
                // Use Asset Id
                newReq.desk_asset_id = inlineData[type[0]].desk_asset_id;
                newReq.phone_number = inlineData[type[0]].phone_number;
            } else {
                //Use Phone Number
                newReq.desk_asset_id = 0;
                let phoneNumber = inlineData[type[0]].phone_number;
                let phone;
                (phoneNumber.includes('||')) ?
                    phone = phoneNumber.split('||') :
                    phone = phoneNumber.split('|');

                newReq.country_code = phone[0]; //country code
                newReq.phone_number = phone[1]; //phone number                      
            }

        } else if (type[0] === 'dynamic') {
            newReq.desk_asset_id = 0;
            // Phone number
            newReq.form_id = inlineData[type[0]].form_id;
            newReq.field_id = inlineData[type[0]].field_id;
            // Name
            newReq.name_field_id = inlineData[type[0]].name_field_id;
            newReq.customer_name = '';
            newReq.participant_workforce_id = inlineData[type[0]].workforce_id || 0;
            newReq.participant_account_id = inlineData[type[0]].account_id || 0;

            let activityInlineData;

            resp = await getFieldValue(newReq);
            if (resp.length > 0) {
                newReq.phone_country_code = String(resp[0].data_entity_bigint_1);
                newReq.phone_number = String(resp[0].data_entity_text_1);
            } else {
                resp = await getActivityIdBasedOnTransId(newReq);
                activityInlineData = JSON.parse(resp[0].activity_inline_data);
                for (let i of activityInlineData) {
                    if (Number(i.form_id) === Number(newReq.form_id) && Number(i.field_id) === Number(newReq.field_id)) {

                        let phoneNumber = i.field_value;
                        let phone;

                        (phoneNumber.includes('||')) ?
                            phone = phoneNumber.split('||') :
                            phone = phoneNumber.split('|');

                        newReq.country_code = phone[0]; //country code
                        newReq.phone_number = phone[1]; //phone number                      
                    }
                    // Grab the name
                    if (
                        Number(i.form_id) === Number(newReq.form_id) &&
                        Number(i.field_id) === Number(newReq.name_field_id)
                    ) {
                        newReq.customer_name = i.field_value;
                        console.log("BotEngine | addParticipant | From Form | newReq.customer_name", newReq.customer_name);
                    }
                }
            }
        }
        // Fetch participant name from the DB
        if (newReq.customer_name === '') {
            try {
                let fieldData = await getFieldValue({
                    form_transaction_id: newReq.form_transaction_id,
                    form_id: newReq.form_id,
                    field_id: newReq.name_field_id,
                    organization_id: newReq.organization_id
                });
                if (fieldData.length > 0) {
                    newReq.customer_name = String(fieldData[0].data_entity_text_1);
                    console.log("BotEngine | addParticipant | getFieldValue | Customer Name: ", newReq.customer_name);
                }
            } catch (error) {
                console.log("BotEngine | addParticipant | getFieldValue | Customer Name | Error: ", error);
            }
        }

        if (
            (newReq.phone_number !== -1) &&
            (Number(newReq.phone_number) !== 0)
        ) {
            console.log("BotService | addParticipant | Message: ", newReq.phone_number, " | ", typeof newReq.phone_number);
            return await addParticipantStep(newReq);
        } else {
            console.log("BotService | addParticipant | Error: ", `Phone number: ${newReq.phone_number}, has got problems!`);
            return [true, "Phone Number is Undefined"];
        }

    }

    //Bot Step Firing an eMail
    async function fireEmail(request, inlineData) {
        let newReq = Object.assign({}, request);
        let resp;

        global.logger.write('conLog', inlineData, {}, {});
        let type = Object.keys(inlineData);
        global.logger.write('conLog', type, {}, {});

        if (type[0] === 'static') {
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.email_id = inlineData[type[0]].email;
            newReq.email_sender = inlineData[type[0]].sender_email;
            newReq.email_sender_name = inlineData[type[0]].sender_name;
        } else if (type[0] === 'dynamic') {
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.form_id = inlineData[type[0]].form_id;
            newReq.field_id = inlineData[type[0]].field_id;
            newReq.email_sender = inlineData[type[0]].sender_email;
            newReq.email_sender_name = inlineData[type[0]].sender_name;

            //request.email_sender = 'OMT.IN1@vodafoneidea.com'; 
            //request.email_sender_name = 'Vodafoneidea';

            resp = await getFieldValue(newReq);
            newReq.email_id = resp[0].data_entity_text_1;
        }

        let dbResp = await getCommTemplates(newReq);
        let retrievedCommInlineData = JSON.parse(dbResp[0].communication_inline_data);
        // global.logger.write('conLog', retrievedCommInlineData.communication_template.email, {}, {});
        let emailBody = '';
        try {
            let buff = new Buffer(retrievedCommInlineData.communication_template.email.body, 'base64');
            emailBody = buff.toString('ascii');
        } catch (error) {
            console.log("Fire Email | base64_2_string | Decode Error: ", error);
        }

        // Find and replace placeholders
        // 1. {$dateTime}
        if (String(emailBody).includes("{$dateTime}")) {
            emailBody = String(emailBody).replace(/{\$dateTime}/g, moment().utcOffset("+05:30").format("YYYY/MM/DD hh:mm A"));
        }

        let placeholders = retrievedCommInlineData.communication_template.email.placeholders;
        let userName = placeholders.userName;
        let userNameValue = '';
        // 
        let fromName = placeholders.fromName;
        let fromNameValue = '';
        // 
        let reqFormId = 0;
        if (request.hasOwnProperty('activity_form_id')) {
            reqFormId = Number(request.activity_form_id);
        } else if (request.hasOwnProperty('form_id')) {
            reqFormId = Number(request.form_id);
        }

        let activityInlineData = [];
        if (request.hasOwnProperty('activity_inline_data')) {
            try {
                activityInlineData = JSON.parse(request.activity_inline_data);
            } catch (error) {
                activityInlineData = [];
            }
        }

        // 2. {$userName}
        if (Number(userName.fieldId) === 0) {
            userNameValue = userName.defaultValue;

        } else if (reqFormId === Number(userName.formId) && request.hasOwnProperty('activity_inline_data')) {
            for (const fieldEntry of activityInlineData) {
                if (Number(fieldEntry.field_id) === Number(userName.fieldId)) {
                    userNameValue = fieldEntry.field_value;
                }
            }
        } else {
            let activityId = 0,
                formTransactionId = 0;
            try {
                let formData = await activityCommonService.getActivityTimelineTransactionByFormId713(request, request.workflow_activity_id, userName.formId);
                if (formData.length > 0) {
                    activityId = formData[0].data_activity_id;
                    formTransactionId = formData[0].data_form_transaction_id;

                    let fieldData = await getFieldValue({
                        form_transaction_id: formTransactionId,
                        form_id: userName.formId,
                        field_id: userName.fieldId,
                        organization_id: request.organization_id
                    });
                    userNameValue = fieldData[0].data_entity_text_1;
                } else {
                    // Populate with the default value
                }
            } catch (error) {
                console.log("Error fetching userNameValue value: ", error)
            }
        }

        if (String(emailBody).includes("{$userName}")) {
            emailBody = String(emailBody).replace(/{\$userName}/g, userNameValue);
        }

        // 3. {$fromName}
        if (Number(fromName.fieldId) === 0) {
            fromNameValue = fromName.defaultValue;

        } else if (reqFormId === Number(fromName.formId) && request.hasOwnProperty('activity_inline_data')) {
            for (const fieldEntry of activityInlineData) {
                if (Number(fieldEntry.field_id) === Number(fromName.fieldId)) {
                    fromName = fieldEntry.field_value;
                }
            }
        } else {
            let activityId = 0,
                formTransactionId = 0;
            try {
                let formData = await activityCommonService.getActivityTimelineTransactionByFormId713(request, request.workflow_activity_id, fromName.formId);
                if (formData.length > 0) {
                    activityId = formData[0].data_activity_id;
                    formTransactionId = formData[0].data_form_transaction_id;

                    let fieldData = await getFieldValue({
                        form_transaction_id: formTransactionId,
                        form_id: fromName.formId,
                        field_id: fromName.fieldId,
                        organization_id: request.organization_id
                    });
                    fromNameValue = fieldData[0].data_entity_text_1;
                } else {
                    // Populate with the default value
                }
            } catch (error) {
                console.log("Error fetching userNameValue value: ", error)
            }
        }
        if (String(emailBody).includes("{$fromName}")) {
            emailBody = String(emailBody).replace(/{\$fromName}/g, fromNameValue);
        }

        // Fetch 
        if (request.hasOwnProperty("workflow_activity_id")) {
            try {
                let processUserData = await activityCommonService.activityAssetMappingSelectActivityParticipant(request, request.workflow_activity_id);
                if (processUserData.length > 0) {
                    request.asset_first_name = processUserData[0].asset_first_name;
                    request.operating_asset_first_name = processUserData[0].operating_asset_first_name;
                    request.operating_asset_phone_number = processUserData[0].operating_asset_phone_number;
                }
            } catch (error) {
                console.log("Error fetching processUserData: ", error)
            }
        }
        // All call to actions!
        let callToActions = retrievedCommInlineData.communication_template.email.call_to_actions;

        // 5. {$statusLink}
        let emailFlagWorkflowStatus = callToActions.flag_workflow_status;
        let statusLink = '';
        if (Number(emailFlagWorkflowStatus) === 1) {
            statusLink = await getStatusLink(request, {}, request.workflow_activity_id);
        }

        // 4. {$actionLink}
        let formActions = callToActions.forms;
        let actionLink = '';
        for (const formAction of formActions) {
            if (formAction.call_to_action_label !== '') {
                let link = await getActionLink(request, formAction, request.workflow_activity_id);
                actionLink += link;
            }
        }

        if (statusLink !== '') {
            actionLink += statusLink;
        }

        if (String(emailBody).includes("{$actionLink}")) {
            emailBody = String(emailBody).replace(/{\$actionLink}/g, actionLink);
        }

        if (emailBody !== '') {
            retrievedCommInlineData.communication_template.email.body = emailBody;
        }

        // console.log("************************************************************")
        // console.log("emailBody: ", emailBody)
        // console.log("************************************************************")

        await sendEmail(newReq, retrievedCommInlineData.communication_template.email);

        // Make a 715 timeline entry - (715 streamtypeid is for email)
        // Buffer.from(retrievedCommInlineData.communication_template.email).toString('base64')
        let timelineEntryEmailContent = retrievedCommInlineData.communication_template.email;
        timelineEntryEmailContent.body = Buffer.from(emailBody).toString('base64');
        let activityTimelineCollection = {
            email: timelineEntryEmailContent,
            email_sender: newReq.email_sender,
            email_sender_name: newReq.email_sender_name
        };

        let fire715OnWFOrderFileRequest = Object.assign({}, newReq);
        fire715OnWFOrderFileRequest.activity_id = newReq.workflow_activity_id;
        fire715OnWFOrderFileRequest.form_transaction_id = newReq.form_transaction_id;
        fire715OnWFOrderFileRequest.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
        fire715OnWFOrderFileRequest.activity_stream_type_id = 715;
        fire715OnWFOrderFileRequest.form_id = newReq.form_id || 0;
        fire715OnWFOrderFileRequest.asset_message_counter = 0;
        fire715OnWFOrderFileRequest.activity_type_category_id = 48;
        fire715OnWFOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
        fire715OnWFOrderFileRequest.activity_timeline_text = '';
        fire715OnWFOrderFileRequest.activity_timeline_url = '';
        fire715OnWFOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        fire715OnWFOrderFileRequest.flag_timeline_entry = 1;
        fire715OnWFOrderFileRequest.service_version = '1.0';
        fire715OnWFOrderFileRequest.app_version = '2.8.16';
        fire715OnWFOrderFileRequest.device_os_id = 9;
        fire715OnWFOrderFileRequest.data_activity_id = request.activity_id;
        fire715OnWFOrderFileRequest.log_asset_id = 100;

        // global.logger.write('conLog', 'fire715OnWFOrderFileRequest : ', fire715OnWFOrderFileRequest, {});
        return new Promise((resolve, reject) => {
            activityTimelineService.addTimelineTransaction(fire715OnWFOrderFileRequest, (err, resp) => {
                (err === false) ? resolve() : reject(err);
            });
            // resolve();
        });
    }

    async function getActionLink(request, formAction, workflowActivityId) {
        // Get activity_id of the form instance in the process/workflow
        const JsonData = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: request.asset_id,
            auth_asset_id: 31347,
            asset_token_auth: "05986bb0-e364-11e8-a1c0-0b6831833754",
            activity_id: workflowActivityId, // request.activity_id,
            activity_type_category_id: 9,
            activity_stream_type_id: 705,
            form_transaction_id: request.form_transaction_id,
            form_id: formAction.form_id,
            activity_type_id: request.activity_type_id,
            type: "approval",
            asset_first_name: request.asset_first_name || '',
            asset_phone_number: request.operating_asset_phone_number || 0,
            operating_asset_first_name: request.operating_asset_first_name || ''
        }

        const base64Json = Buffer.from(JSON.stringify(JsonData)).toString('base64');
        let urlStrFill = "https://staging.officedesk.app/#/forms/view/" + base64Json;
        if (global.mode === 'prod') {
            urlStrFill = "https://officedesk.app/#/forms/view/" + base64Json;
        }

        const buttonName = formAction.call_to_action_label;
        const actionLink = `<a style='background: #f47920;display: inline-block;color: #FFFFFF;text-decoration: none;font-size: 12px;margin-top: 1.0em;background-clip: padding-box;padding: 5px 15px;box-shadow: 4px 4px 6px 1px #cbcbcb;margin-left:10px' target='_blank' href='${urlStrFill}'>${buttonName}</a> `;

        return actionLink;
    }

    async function getStatusLink(request, formAction, workflowActivityId) {
        let workflowActivityTypeId = request.activity_type_id;
        try {
            await activityCommonService
                .getActivityDetailsPromise(request, workflowActivityId)
                .then((workflowActivityData) => {
                    if (workflowActivityData.length > 0) {
                        workflowActivityTypeId = workflowActivityData[0].activity_type_id;
                    }
                })
                .catch((error) => {
                    console.log("workflowActivityTypeId | getActivityDetailsPromise | error: ", error);
                });
        } catch (error) {
            console.log("workflowActivityTypeId | error: ", error);
        }
        const JsonData = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: request.asset_id,
            auth_asset_id: 31347,
            asset_token_auth: "05986bb0-e364-11e8-a1c0-0b6831833754",
            activity_id: workflowActivityId, // request.activity_id,
            activity_type_category_id: 9,
            activity_stream_type_id: 705,
            activity_type_id: workflowActivityTypeId,
            asset_first_name: request.asset_first_name || ''
        }
        const base64Json = Buffer.from(JSON.stringify(JsonData)).toString('base64');
        let urlStrFill = "https://staging.officedesk.app/#/orderstatus/" + base64Json;
        if (global.mode === 'prod') {
            urlStrFill = "https://officedesk.app/#/orderstatus/" + base64Json;
        }
        const statusLink = `<a style='background: #f47920;display: inline-block;color: #FFFFFF;text-decoration: none;font-size: 12px;margin-top: 1.0em;background-clip: padding-box;padding: 5px 15px;box-shadow: 4px 4px 6px 1px #cbcbcb;margin-left:10px' target='_blank' href='${urlStrFill}'>Track Order Status</a>`;

        return statusLink;
    }

    //Bot Step Firing a Text Message
    async function fireTextMsg(request, inlineData) {
        let newReq = Object.assign({}, request);
        let resp;

        global.logger.write('conLog', inlineData, {}, {});
        let type = Object.keys(inlineData);
        global.logger.write('conLog', type, {}, {});

        if (type[0] === 'static') {
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.country_code = inlineData[type[0]].phone_country_code;
            newReq.phone_number = inlineData[type[0]].phone_number;
        } else if (type[0] === 'dynamic') {
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.form_id = inlineData[type[0]].form_id;
            newReq.field_id = inlineData[type[0]].field_id;

            resp = await getFieldValue(newReq);
            newReq.country_code = resp[0].data_entity_bigint_1;
            newReq.phone_number = resp[0].data_entity_text_1;
        }

        let dbResp = await getCommTemplates(newReq);
        let retrievedCommInlineData = JSON.parse(dbResp[0].communication_inline_data);
        newReq.smsText = retrievedCommInlineData.communication_template.text.message;
        newReq.line = retrievedCommInlineData.communication_template.text.link || "";
        newReq.form = retrievedCommInlineData.communication_template.text.form || 0;
        global.logger.write('conLog', newReq.smsText, {}, {});

        if (newReq.line) {
            newReq.smsText = newReq.smsText + " " + newReq.line;
        } else if (newReq.form != 0) {
            //Get the form Transaction Id
            //Convert into base 64
            //Convert into Tiny Url
            //Update the SMS Text

            const jsonString = {
                organization_id: newReq.organization_id,
                account_id: newReq.account_id,
                workforce_id: newReq.workforce_id,
                asset_id: Number(newReq.asset_id),
                asset_token_auth: '54188fa0-f904-11e6-b140-abfd0c7973d9',
                auth_asset_id: 100,
                activity_id: newReq.activity_id || 0,
                activity_type_category_id: 9,
                activity_type_id: newReq.activity_type_id,
                activity_stream_type_id: 705,
                form_id: Number(newReq.form_id)
            };

            const encodedString = Buffer.from(JSON.stringify(jsonString)).toString('base64');
            const baseUrlApprove = global.config.emailbaseUrlApprove + "/#/forms/entry/" + encodedString;

            let shortenedUrl = "";
            await new Promise((resolve, reject) => {
                TinyURL.shorten(baseUrlApprove, function (res) {
                    global.logger.write('conLog', res, {}, {});
                    shortenedUrl = res;
                    resolve();
                });
            });

            newReq.smsText = newReq.smsText + " " + shortenedUrl;
        }

        await new Promise((resolve, reject) => {
            if (Number(newReq.country_code) === 91) {
                util.sendSmsSinfini(newReq.smsText, newReq.country_code, newReq.phone_number, function (err, res) {
                    global.logger.write('debug', 'Sinfini Error: ' + JSON.stringify(err, null, 2), {}, request);
                    global.logger.write('debug', 'Sinfini Response: ' + JSON.stringify(res, null, 2), {}, request);
                    resolve();
                });
            } else {
                util.sendInternationalTwilioSMS(newReq.smsText, newReq.country_code, newReq.phone_number, function (err, res) {
                    global.logger.write('debug', 'Twilio Error: ' + JSON.stringify(err, null, 2), {}, request);
                    global.logger.write('debug', 'Twilio Response: ' + JSON.stringify(res, null, 2), {}, request);
                    resolve();
                });
            }

        });

        //Make a 716 timeline entry - (716 streamtypeid is for email)
        let activityTimelineCollection = {
            text: retrievedCommInlineData.communication_template.text
        };

        let fire716OnWFOrderFileRequest = Object.assign({}, newReq);
        fire716OnWFOrderFileRequest.activity_id = newReq.workflow_activity_id;
        fire716OnWFOrderFileRequest.form_transaction_id = newReq.form_transaction_id;
        fire716OnWFOrderFileRequest.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
        fire716OnWFOrderFileRequest.activity_stream_type_id = 716;
        fire716OnWFOrderFileRequest.form_id = 0;
        fire716OnWFOrderFileRequest.asset_message_counter = 0;
        fire716OnWFOrderFileRequest.activity_type_category_id = 48;
        fire716OnWFOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
        fire716OnWFOrderFileRequest.activity_timeline_text = '';
        fire716OnWFOrderFileRequest.activity_timeline_url = '';
        fire716OnWFOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        fire716OnWFOrderFileRequest.flag_timeline_entry = 1;
        fire716OnWFOrderFileRequest.service_version = '1.0';
        fire716OnWFOrderFileRequest.app_version = '2.8.16';
        fire716OnWFOrderFileRequest.device_os_id = 9;
        fire716OnWFOrderFileRequest.data_activity_id = request.activity_id;
        fire716OnWFOrderFileRequest.log_asset_id = 100;

        global.logger.write('conLog', 'fire716OnWFOrderFileRequest :', fire716OnWFOrderFileRequest, {});
        return new Promise((resolve, reject) => {
            activityTimelineService.addTimelineTransaction(fire716OnWFOrderFileRequest, (err, resp) => {
                (err === false) ? resolve() : reject(err);
            });
        });
    }

    //Bot Step Firing an API
    async function fireApi(request, inlineData) {
        let newReq = Object.assign({}, request);
        let resp;

        global.logger.write('conLog', inlineData, {}, {});
        let type = Object.keys(inlineData);
        global.logger.write('conLog', type, {}, {});

        if (type[0] === 'static') {
            newReq.endpoint = inlineData[type[0]].endpoint;
            newReq.method = inlineData[type[0]].method;
            newReq.protocol = inlineData[type[0]].protocol;
            newReq.parameters = inlineData[type[0]].parameters;
        } else if (type[0] === 'dynamic') {
            newReq.endpoint = inlineData[type[0]].endpoint;
            newReq.method = inlineData[type[0]].method;
            newReq.protocol = inlineData[type[0]].protocol;
            newReq.parameters = inlineData[type[0]].parameters;

            for (let i of newReq.parameters) {
                resp = await getFieldValue({
                    "form_transaction_id": newReq.form_transaction_id,
                    "form_id": i.parameter_value.form_id,
                    "field_id": i.parameter_value.field_id,
                    "organization_id": newReq.organization_id
                });
                global.logger.write('conLog', resp, {}, {});
                i.parameter_value = resp[0].data_entity_text_1;
            }
        }

        let response = await makeAPIRequest(newReq, newReq.parameters);

        //Make a timeline entry
        let activityTimelineCollection = {
            type: type[0],
            endpoint: newReq.endpoint,
            method: newReq.method,
            protocol: newReq.protocol,
            parameters: newReq.parameters,
            response: response
        };

        let fire714OnNewOrderFileRequest = Object.assign({}, newReq);
        fire714OnNewOrderFileRequest.activity_id = newReq.activity_id;
        fire714OnNewOrderFileRequest.form_transaction_id = newReq.form_transaction_id;
        fire714OnNewOrderFileRequest.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
        fire714OnNewOrderFileRequest.activity_stream_type_id = 714;
        fire714OnNewOrderFileRequest.form_id = 0;
        fire714OnNewOrderFileRequest.asset_message_counter = 0;
        fire714OnNewOrderFileRequest.activity_type_category_id = 48;
        fire714OnNewOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
        fire714OnNewOrderFileRequest.activity_timeline_text = '';
        fire714OnNewOrderFileRequest.activity_timeline_url = '';
        fire714OnNewOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        fire714OnNewOrderFileRequest.flag_timeline_entry = 1;
        fire714OnNewOrderFileRequest.service_version = '1.0';
        fire714OnNewOrderFileRequest.app_version = '2.8.16';
        fire714OnNewOrderFileRequest.device_os_id = 7;
        fire714OnNewOrderFileRequest.data_activity_id = request.activity_id;

        return new Promise((resolve, reject) => {
            activityTimelineService.addTimelineTransaction(fire714OnNewOrderFileRequest, (err, resp) => {
                (err === false) ? resolve() : reject(err);
            });
        });
    }

    //Bot Step Altering workflow completion percentage
    async function alterWFCompletionPercentage(request, inlineData) {
        let newrequest = Object.assign({}, request);

        //newrequest.activity_id = request.workflow_activity_id;
        global.logger.write('conLog', inlineData.workflow_percentage_contribution, {}, {});
        newrequest.workflow_completion_percentage = inlineData.workflow_percentage_contribution;
        let wfCompletionPercentage = newrequest.workflow_completion_percentage;
        //let resp = await getQueueActivity(newrequest, newrequest.workflow_activity_id);        
        let resp = await getAllQueuesBasedOnActId(newrequest, newrequest.workflow_activity_id);
        global.logger.write('conLog', resp, {}, {});

        if (Number(wfCompletionPercentage) !== 0 && resp.length > 0) {

            //Adding to OMT Queue                
            newrequest.start_from = 0;
            newrequest.limit_value = 1;

            let queueActivityMappingData;
            let data;
            let queueActivityMappingId;
            let queueActMapInlineData;

            for (let i of resp) {

                //Checking the queuemappingid
                queueActivityMappingData = await (activityCommonService.fetchQueueActivityMappingId({
                    activity_id: newrequest.workflow_activity_id,
                    organization_id: newrequest.organization_id
                },
                    i.queue_id));
                global.logger.write('conLog', 'queueActivityMappingData : ', {}, {});
                global.logger.write('conLog', queueActivityMappingData, {}, {});

                if (queueActivityMappingData.length > 0) {
                    queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;
                    queueActMapInlineData = JSON.parse(queueActivityMappingData[0].queue_activity_mapping_inline_data);
                    let obj = {};

                    global.logger.write('conLog', 'queueActMapInlineData.length', Object.keys(queueActMapInlineData).length, {});
                    if (Object.keys(queueActMapInlineData).length === 0) {
                        obj.queue_sort = {};
                        obj.queue_sort.caf_completion_percentage = wfCompletionPercentage;
                        queueActMapInlineData = obj;
                    } else {
                        //queueActMapInlineData.queue_sort.caf_completion_percentage += wfCompletionPercentage;
                        queueActMapInlineData.queue_sort.caf_completion_percentage = wfCompletionPercentage;
                    }
                    global.logger.write('conLog', 'Updated Queue JSON : ', queueActMapInlineData, {});

                    data = await (activityCommonService.queueActivityMappingUpdateInlineData(newrequest, queueActivityMappingId, JSON.stringify(queueActMapInlineData)));
                    global.logger.write('conLog', 'Updating the Queue Json : ', data, {});

                    activityCommonService.queueHistoryInsert(newrequest, 1402, queueActivityMappingId).then(() => { });
                    //return [false, {}];
                }
            }
            // Update the workflow percentage in the activity_list table
            try {
                await activityListUpdateWorkflowPercent(newrequest, wfCompletionPercentage);
            } catch (error) {
                console.log("Bot Engine | alterWFCompletionPercentage | activityListUpdateWorkflowPercent | Error: ", error)
            }
            // Update the workflow percentage in the activity_asset_mapping table
            try {
                await activityAssetMappingUpdateWorkflowPercent(newrequest, wfCompletionPercentage);
            } catch (error) {
                console.log("Bot Engine | alterWFCompletionPercentage | activityAssetMappingUpdateWorkflowPercent | Error: ", error)
            }
            // [Last Step] Update the workflow's timeline as well
            if (Number(wfCompletionPercentage) !== 0) {
                try {
                    let workflowTimelineUpdateRequest = Object.assign({}, newrequest);
                    workflowTimelineUpdateRequest.activity_id = newrequest.workflow_activity_id;
                    workflowTimelineUpdateRequest.activity_timeline_collection = JSON.stringify({
                        "activity_reference": [{
                            "activity_id": newrequest.workflow_activity_id,
                            "activity_title": ""
                        }],
                        "asset_reference": [{}],
                        "attachments": [],
                        "content": `Workflow percentage updated to ${wfCompletionPercentage}`,
                        "mail_body": `Workflow percentage updated to ${wfCompletionPercentage}`,
                        "subject": `Workflow percentage updated to ${wfCompletionPercentage}`
                    });
                    workflowTimelineUpdateRequest.log_asset_id = 100; // Tony
                    await activityCommonService.asyncActivityTimelineTransactionInsert(workflowTimelineUpdateRequest, {}, 717);
                } catch (error) {
                    console.log("Bot Engine | alterWFCompletionPercentage | asyncActivityTimelineTransactionInsert | Error: ", error)
                }
            }
            return [false, {}];
        } else {
            return [true, "Queue Not Available"];
        }
    }

    async function activityListUpdateWorkflowPercent(request, workflowPercentage) {
        // IN p_organization_id BIGINT(20), IN p_activity_id BIGINT(20), 
        // IN p_workflow_percentage DECIMAL(4,2), IN p_log_asset_id BIGINT(20), 
        // IN p_log_datetime DATETIME
        let paramsArr = new Array(
            request.organization_id,
            request.workflow_activity_id,
            workflowPercentage,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('ds_p1_activity_list_update_workflow_percent', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));
        }
    }

    async function activityAssetMappingUpdateWorkflowPercent(request, workflowPercentage) {
        // IN p_organization_id BIGINT(20), IN p_activity_id BIGINT(20), 
        // IN p_workflow_percentage DECIMAL(4,2), IN p_log_asset_id BIGINT(20), 
        // IN p_log_datetime DATETIME
        let paramsArr = new Array(
            request.organization_id,
            request.workflow_activity_id,
            workflowPercentage,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_workflow_percent', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));
        }
    }

    function sendEmail(request, emailJson) {
        return new Promise((resolve, reject) => {
            global.logger.write('conLog', "\x1b[35m [Log] Inside SendEmail \x1b[0m", {}, {});
            const emailSubject = emailJson.subject;
            const Template = emailJson.body;

            //request.email_sender = 'OMT.IN1@vodafoneidea.com'; 
            //request.email_sender_name = 'Vodafoneidea';

            global.logger.write('conLog', emailSubject, {}, {});
            global.logger.write('conLog', Template, {}, {});

            util.sendEmailV3(request,
                request.email_id,
                emailSubject,
                "IGNORE",
                Template,
                (err, data) => {
                    if (err) {
                        global.logger.write('conLog', "[Send Email On Form Submission | Error]: ", {}, {});
                        global.logger.write('conLog', err, {}, {});
                    } else {
                        global.logger.write('conLog', "[Send Email On Form Submission | Response]: " + "Email Sent", {}, {});
                        global.logger.write('conLog', data, {}, {});
                    }

                    resolve();
                });
        });
    }

    //Get the email, sms template
    async function getCommTemplates(request) {
        let paramsArr = new Array(
            2,
            request.communication_id,
            request.communication_type_id || 0,
            request.communication_type_category_id || 0,
            request.activity_type_id || 0,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_p1_communication_list_select', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    }

    //Get the field value based on form id and form_transaction_id
    async function getFieldValue(request) {
        let paramsArr = new Array(
            request.form_transaction_id || 0,
            request.form_id,
            request.field_id,
            request.organization_id
        );
        let queryString = util.getQueryString('ds_p1_activity_form_transaction_select_field_sequence_id', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    }

    async function addParticipantStep(request) {
        let dataResp,
            deskAssetData;
        let assetData = {};
        assetData.desk_asset_id = 0;

        if (request.desk_asset_id === 0) {
            dataResp = await getAssetDetailsOfANumber(request);
            if (dataResp.length > 0) {
                for (let i of dataResp) {
                    if (i.asset_type_category_id === 3 || i.asset_type_category_id === 45) {
                        deskAssetData = i;
                        break;
                    }
                }
            } else {
                //Create a Desk
                let result = await createAssetContactDesk(request, {
                    "contact_designation": request.phone_number,
                    "contact_email_id": request.phone_number,
                    "first_name": request.customer_name || request.phone_number,
                    "contact_phone_number": request.phone_number,
                    "contact_phone_country_code": 91,
                    "workforce_id": request.participant_workforce_id,
                    "account_id": request.participant_account_id
                });
                deskAssetData = result.response;
                assetData.desk_asset_id = deskAssetData.desk_asset_id;
            }

        } else {
            dataResp = await getAssetDetails({
                "organization_id": request.organization_id,
                "asset_id": request.desk_asset_id
            });
            deskAssetData = dataResp[0];
        }
        global.logger.write('conLog', 'Desk Asset Details : ', deskAssetData, {});

        if (assetData.desk_asset_id === 0) {
            assetData.desk_asset_id = deskAssetData.asset_id;
        }

        assetData.first_name = deskAssetData.operating_asset_first_name;
        assetData.contact_phone_number = deskAssetData.operating_asset_phone_number;
        assetData.contact_phone_country_code = deskAssetData.operating_asset_phone_country_code;
        assetData.asset_type_id = deskAssetData.asset_type_id;

        return await addDeskAsParticipant(request, assetData);

        /*if(dataResp.length > 0) { //status is true means service desk exists
             
            let sdResp = dataResp[0];
            let deskAssetId = sdResp.asset_id;   
            console.log('deskAssetId : ', deskAssetId);
                
            if(Number(sdResp.operating_asset_phone_number) !== Number(customerData.contact_phone_number)) {
                
                console.log('operating asset phone number is different from authorised_signatory_contact_number');
                                      
                //Unmap the operating Asset from service desk
                activityCommonService.assetListUpdateOperatingAsset(request, deskAssetId, 0, (err, data)=>{});
                           
                var newRequest = Object.assign({}, request);
                newRequest.activity_title = 'Adding Co-Worker Contact Card';
                newRequest.activity_description = 'Adding Co-Worker Contact Card';
                newRequest.activity_type_id = "";
                newRequest.activity_inline_data = JSON.stringify({
                     "activity_id": 0,
                     "activity_ineternal_id": -1,
                     "activity_type_category_id": 6,
                     "contact_account_id": request.account_id,
                     "contact_asset_id": 0,
                     "contact_asset_type_id": request.asset_type_id,
                     "contact_department": "",
                     "contact_designation": customerData.contact_designation,
                     "contact_email_id": customerData.contact_email_id,
                     "contact_first_name": customerData.first_name,
                     "contact_last_name": "",
                     "contact_location": "Hyderabad",
                     "contact_operating_asset_name": customerData.first_name,
                     "contact_organization": "",
                     "contact_organization_id": request.organization_id,
                     "contact_phone_country_code": customerData.contact_phone_country_code,
                     "contact_phone_number": customerData.contact_phone_number,
                     "contact_profile_picture": "",
                     "contact_workforce_id": global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                     "contact_asset_type_name": "Customer",
                     "contact_company": customerData.contact_company,
                     "contact_lat": 0.0,
                     "contact_lon": 0.0,
                     "contact_notes": "",
                     "field_id": 0,
                     "log_asset_id": request.asset_id,
                     "web_url": ""
                 });
                            
                //Create Customer Operating Asset 
                let operatingAssetId = await createAsset(newRequest);
                
                //Map the newly created operating asset with service desk asset
                activityCommonService.assetListUpdateOperatingAsset(request, deskAssetId, operatingAssetId, (err, data)=>{});
                
                //Add Service Desk as Participant to form file
                addDeskAsParticipant(request, customerData, deskAssetId);
                
            } else { 
                    //When authorized_signatory_phone_number is equal to the retrieved operating asset
                    console.log('operating asset phone number is same as authorised_signatory_contact_number');
                    
                    //Add Service Desk as Participant to form file
                    addDeskAsParticipant(request, customerData, deskAssetId);
                            
            }                        
//When Service desk not exists
        } else {
            console.log('In else part');
            //Create Customer Operating Asset
            //Create Customer Contact file
            //Create Customer Desk Asset                            
            let resp  = await createAssetContactDesk(request, customerData);
                                             
            let assetId = resp.response.asset_id;
            let deskAssetId = resp.response.desk_asset_id;
            let contactfileActId = resp.response.activity_id;
            
            //Map the operating Asset to the contact file
            addCustomerAsParticipantToContFile(newRequest, contactfileActId, customerData, assetId).then(()=>{});
            
            //Add Service Desk as Participant to form file
            addDeskAsParticipant(request, customerData, deskAssetId);
        }*/
    }

    function createAssetContactDesk(request, customerData) {
        return new Promise((resolve, reject) => {

            //Get asset_type_id for category 3 for the specific workforce
            let newRequest = Object.assign({}, request);
            newRequest.workforce_id = customerData.workforce_id || request.workforce_id;
            newRequest.account_id = customerData.account_id || request.account_id;
            activityCommonService.workforceAssetTypeMappingSelectCategoryPromise(newRequest, 13).then((data) => {
                let customerServiceDeskRequest = {
                    organization_id: request.organization_id,
                    account_id: customerData.account_id || request.account_id,
                    workforce_id: customerData.workforce_id || request.workforce_id,
                    //asset_id: request.asset_id,
                    asset_id: 100,
                    asset_token_auth: '54188fa0-f904-11e6-b140-abfd0c7973d9',
                    //auth_asset_id: 100,
                    activity_title: customerData.first_name,
                    activity_description: customerData.first_name,
                    activity_inline_data: JSON.stringify({
                        "activity_id": 0,
                        "activity_ineternal_id": -1,
                        "activity_type_category_id": 6,
                        "contact_account_id": customerData.account_id || request.account_id,
                        "contact_asset_id": 0,
                        "contact_asset_type_id": data[0].asset_type_id || 0,
                        "contact_department": "",
                        "contact_designation": customerData.contact_designation,
                        "contact_email_id": customerData.contact_email_id,
                        "contact_first_name": customerData.first_name,
                        "contact_last_name": "",
                        "contact_location": "Hyderabad",
                        "contact_operating_asset_name": customerData.first_name,
                        "contact_organization": "",
                        "contact_organization_id": request.organization_id,
                        "contact_phone_country_code": customerData.contact_phone_country_code,
                        "contact_phone_number": customerData.contact_phone_number,
                        "contact_profile_picture": "",
                        "contact_workforce_id": customerData.workforce_id || request.workforce_id,
                        "contact_asset_type_name": "Customer",
                        //"contact_company": customerData.contact_company,
                        "contact_lat": 0.0,
                        "contact_lon": 0.0,
                        "contact_notes": "",
                        "field_id": 0,
                        "log_asset_id": request.asset_id,
                        "web_url": ""
                    }),
                    //account_code: request.account_code,
                    activity_datetime_start: util.getCurrentUTCTime(),
                    activity_datetime_end: util.getCurrentUTCTime(),
                    activity_type_category_id: 6,
                    activity_sub_type_id: 0,
                    activity_type_id: request.activity_type_id,
                    activity_access_role_id: 13,
                    asset_participant_access_id: 13,
                    activity_parent_id: 0,
                    flag_pin: 0,
                    flag_priority: 0,
                    activity_flag_file_enabled: 0,
                    flag_offline: 0,
                    flag_retry: 0,
                    message_unique_id: util.getMessageUniqueId(Number(request.asset_id)),
                    activity_channel_id: 0,
                    activity_channel_category_id: 0,
                    activity_flag_response_required: 0,
                    track_latitude: 0.0,
                    track_longitude: 0.0,
                    track_altitude: 0,
                    track_gps_datetime: util.getCurrentUTCTime(),
                    track_gps_accuracy: 0,
                    track_gps_status: 0,
                    service_version: 1.0,
                    app_version: "2.5.5",
                    device_os_id: 5
                };

                global.logger.write('conLog', "customerServiceDeskRequest: ", customerServiceDeskRequest, {});

                const requestOptions = {
                    form: customerServiceDeskRequest
                };

                global.logger.write('conLog', 'Before Making Request', {}, {});
                makeRequest.post(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', requestOptions, function (error, response, body) {
                    global.logger.write('conLog', "[customerServiceDeskRequest] Body: ", body, {});
                    //global.logger.write('conLog', "[customerServiceDeskRequest] Error: ", error, {});
                    //console.log("[customerServiceDeskRequest] Response: ", response);

                    body = JSON.parse(body);

                    if (Number(body.status) === 200) {
                        //const assetID = body.response.asset_id;
                        //const DeskAssetID = body.response.desk_asset_id;

                        resolve(body);
                    } else {
                        reject('Status is ' + Number(body.status) + ' while creating Service Desk');
                    }
                });
            });
        });
    }

    async function addDeskAsParticipant(request, assetData) {
        let addParticipantRequest = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            //asset_id: request.desk_asset_id,
            asset_id: 100,
            asset_message_counter: 0,
            activity_id: Number(request.workflow_activity_id),
            activity_access_role_id: 29,
            activity_type_category_id: 48,
            activity_type_id: 0,
            activity_participant_collection: JSON.stringify([{
                "access_role_id": 29,
                "account_id": request.account_id,
                "activity_id": Number(request.workflow_activity_id),
                "asset_datetime_last_seen": "1970-01-01 00:00:00",
                "asset_first_name": assetData.first_name,
                "asset_id": Number(assetData.desk_asset_id),
                "asset_image_path": "",
                "asset_last_name": "",
                "asset_phone_number": assetData.contact_phone_number,
                "asset_phone_number_code": assetData.contact_phone_country_code,
                "asset_type_category_id": 45,
                "asset_type_id": assetData.asset_type_id,
                "field_id": 0,
                "log_asset_id": request.asset_id,
                "message_unique_id": util.getMessageUniqueId(Number(request.asset_id)),
                "operating_asset_first_name": assetData.first_name,
                "organization_id": request.organization_id,
                "workforce_id": request.workforce_id
            }]),
            flag_pin: 0,
            flag_priority: 0,
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(Number(request.asset_id)),
            track_latitude: 0.0,
            track_longitude: 0.0,
            track_altitude: 0,
            track_gps_datetime: util.getCurrentUTCTime(),
            track_gps_accuracy: 0,
            track_gps_status: 0,
            service_version: 1.0,
            app_version: "2.5.5",
            device_os_id: 9
        };

        return await new Promise((resolve, reject) => {
            activityParticipantService.assignCoworker(addParticipantRequest, (err, resp) => {
                (err === false) ? resolve() : reject(err);
            });
        });

    }

    async function makeAPIRequest(request, parametersJson) {
        let url;
        let formParams = {};
        if (request.method === 'GET') {
            url = `${request.protocol}://${request.endpoint}`;
            makeRequest(url, function (error, response, body) {
                global.logger.write('conLog', error, {}, {});
                global.logger.write('conLog', response && response.statusCode, {}, {});
                global.logger.write('conLog', body, {}, {});
            });
        } else if (request.method === 'POST') {

            for (let i of parametersJson) {
                formParams[i.parameter_key] = i.parameter_value;
            }

            global.logger.write('conLog', 'formParams : ', {}, {});
            global.logger.write('conLog', formParams, {}, {});
            url = `${request.protocol}://${request.endpoint}`;

            return new Promise((resolve, reject) => {
                makeRequest.post({
                    url: url,
                    form: formParams
                }, (err, httpResponse, body) => {
                    //global.logger.write('conLog', httpResponse,{},{});                    
                    global.logger.write('conLog', 'error:', {}, {});
                    global.logger.write('conLog', err, {}, {});
                    global.logger.write('conLog', body, {}, {});

                    (err === null) ? resolve(body) : reject(err);
                });
            });
        }
    }

    async function getLatestUpdateSeqId(request) {
        let paramsArr = new Array(
            request.form_transaction_id,
            request.form_id,
            request.field_id,
            request.organization_id
        );
        let queryString = util.getQueryString('ds_p1_activity_form_transaction_select_field_sequence_id', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    }

    async function putLatestUpdateSeqId(request, activityInlineData) {
        for (let row of activityInlineData) {
            const params = new Array(
                request.form_transaction_id, //0
                row.form_id, //1
                row.field_id, //2
                row.data_type_combo_id || 0, //3
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
                '', //IN p_location_datetime DATETIME                          26
            );

            const dataTypeId = Number(row.field_data_type_id);
            request['field_value'] = row.field_value;
            console.log('dataTypeId : ', dataTypeId);
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
                case 50: // Reference - File
                    // params[13] = Number(JSON.parse(row.field_value).activity_id); // p_entity_bigint_1
                    params[18] = row.field_value; // p_entity_text_1
                    break;
                case 52: // Excel Document
                    params[18] = row.field_value;
                    break;
                case 53: // IP Address Form
                    params[18] = row.field_value;
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
                case 17: //Location
                    var location = row.field_value.split('|');
                    params[16] = location[0];
                    params[17] = location[1];
                    break;
                case 18: //Money with currency name
                    var money = row.field_value.split('|');
                    params[15] = money[0];
                    params[18] = money[1];
                    break;
                case 19: //Short Text
                    params[18] = request.new_field_value || row.field_value;
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
                    var phone = row.field_value.split('|');
                    params[13] = phone[0]; //country code
                    params[18] = phone[1]; //phone number
                    break;
                case 24: //Gallery Image
                case 25: //Camera Front Image
                case 26: //Video Attachment
                    params[18] = row.field_value;
                    break;
                case 27: //General Signature with asset reference
                case 28: //General Picnature with asset reference
                    var signatureData = row.field_value.split('|');
                    params[18] = signatureData[0]; //image path
                    params[13] = signatureData[1]; // asset reference
                    params[11] = signatureData[1]; // accepted /rejected flag
                    break;
                case 29: //Coworker Signature with asset reference
                case 30: //Coworker Picnature with asset reference
                    // approvalFields.push(row.field_id);
                    var signatureData = row.field_value.split('|');
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
            }

            params.push(''); //IN p_device_manufacturer_name VARCHAR(50)
            params.push(''); // IN p_device_model_name VARCHAR(50)
            params.push(request.device_os_id); // IN p_device_os_id TINYINT(4)
            params.push(''); // IN p_device_os_name VARCHAR(50),
            params.push(''); // IN p_device_os_version VARCHAR(50)
            params.push(request.app_version); // IIN p_device_app_version VARCHAR(50)
            params.push(request.api_version); // IN p_device_api_version VARCHAR(50)
            params.push(request.asset_id); // IN p_log_asset_id BIGINT(20)
            params.push(request.message_unique_id); // IN p_log_message_unique_id VARCHAR(50)
            params.push(request.flag_retry || 0); // IN p_log_retry TINYINT(1)
            params.push(request.flag_offline || 0); // IN p_log_offline TINYINT(1)
            params.push(request.datetime_log); // IN p_transaction_datetime DATETIME
            params.push(request.datetime_log); // IN p_log_datetime DATETIME
            params.push(request.datetime_log); // IN p_entity_datetime_2 DATETIME            
            params.push(request.update_sequence_id);

            global.logger.write('conLog', '\x1b[32m In BotService - addFormEntries params - \x1b[0m' + JSON.stringify(params), {}, request);

            let queryString = util.getQueryString('ds_p1_activity_form_transaction_insert_field_update', params);
            if (queryString != '') {
                try {
                    await db.executeQueryPromise(0, queryString, request);
                } catch (err) {
                    global.logger.write('debug', err, {}, {});
                }
            }
        }
        return {};
    }

    async function getQueueActivity(request, idActivity) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            idActivity
        );
        let queryString = util.getQueryString('ds_v1_queue_activity_mapping_select_activity', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
        }
    }

    async function getAssetDetailsOfANumber(request) {
        var paramsArr = new Array(
            request.organization_id || 0,
            request.phone_number,
            request.country_code || 91
        );
        var queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
        }
    }

    async function getAssetDetails(request) {
        var paramsArr = new Array(
            request.organization_id,
            request.asset_id
        );
        var queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
        }
    }

    async function getStatusName(request, activityStatusId) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            activityStatusId
        );
        let queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select_id', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
        }
    }

    async function getAllQueuesBasedOnActId(request, activityId) {
        let paramsArr = new Array(
            request.organization_id,
            activityId
        );
        let queryString = util.getQueryString('ds_p1_1_queue_activity_mapping_select_activity', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
        }
    }

    async function getActivityIdBasedOnTransId(request) {
        let paramsArr = new Array(
            request.organization_id,
            request.form_transaction_id || 0
        );
        let queryString = util.getQueryString('ds_p1_activity_list_select_form_transaction', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    }

    async function alterFormActivityFieldValues(request) {
        let fieldsNewValues = [],
            fieldsNewValuesMap = new Map();
        fieldsNewValues = JSON.parse(request.activity_inline_data);
        for (const field of fieldsNewValues) {
            fieldsNewValuesMap.set(Number(field.field_id), field);
        }
        console.log("fieldsNewValuesMap: ", fieldsNewValuesMap);

        let activityData = [];
        // Fetch the activity data from the DB
        try {
            activityData = await activityCommonService.getActivityByFormTransaction(request, request.activity_id);
        } catch (error) {
            console.log("alterFormActivityFieldValues | getActivityByFormTransaction | Error", error)
            return [error, []];
        }
        // If the activity exists, retrieve and parse the inline data
        let activityInlineData = [];
        if (activityData.length > 0) {
            try {
                activityInlineData = JSON.parse(activityData[0].activity_inline_data);
            } catch (error) {
                return [error, []];
            }
        } else {
            return [new Error("ActivityNotFound"), []];
        }
        // Convert the inline data to a map, for easy processing
        let activityInlineDataMap = new Map();
        for (const field of activityInlineData) {
            activityInlineDataMap.set(Number(field.field_id), field);
        }
        // Build the promises array for concurrent processing
        let fetchUpdateSeqIdPromises = [];
        // Content to be displayed on the UI
        let content = '',
            formName = '';
        for (const fieldID of fieldsNewValuesMap.keys()) {
            // Fetch the latest upate sequence ID
            fetchUpdateSeqIdPromises.push(
                getLatestUpdateSeqId({
                    form_transaction_id: request.form_transaction_id,
                    form_id: request.form_id,
                    field_id: fieldID,
                    organization_id: request.organization_id
                })
                    .then(async (data) => {
                        let newRequest = Object.assign({}, request);
                        let newFieldData = [];

                        if (data.length > 0) {
                            newRequest.update_sequence_id = Number(data[0].update_sequence_id) + 1;
                        } else {
                            newRequest.update_sequence_id = 1;
                        }

                        newRequest.field_id = fieldID;
                        newRequest.data_type_combo_id = fieldsNewValuesMap.get(fieldID).data_type_combo_id;
                        newRequest.new_field_value = fieldsNewValuesMap.get(fieldID).field_value;
                        newRequest.datetime_log = util.getCurrentUTCTime();
                        newFieldData.push(fieldsNewValuesMap.get(fieldID));
                        // Update the field entry
                        await putLatestUpdateSeqId(newRequest, newFieldData);

                        formName = fieldsNewValuesMap.get(fieldID).form_name;
                        let fieldName = fieldsNewValuesMap.get(fieldID).field_name;
                        // Update the activity inline data as well
                        if (activityInlineDataMap.has(fieldID)) {
                            let oldFieldEntry = activityInlineDataMap.get(fieldID);
                            let newFieldEntry = Object.assign({}, oldFieldEntry);
                            newFieldEntry.field_value = fieldsNewValuesMap.get(fieldID).field_value;
                            // Set the new value in the inline data map
                            activityInlineDataMap.set(fieldID, newFieldEntry);

                            // Form the content string
                            content += `In the ${formName}, the field ${fieldName} was updated from ${oldFieldEntry.field_value} to ${newFieldEntry.field_value} <br />`;;
                        } else {
                            // If it doesn't already exist, make a fresh entry!
                            let newFieldEntry = fieldsNewValuesMap.get(fieldID);
                            activityInlineDataMap.set(fieldID, {
                                "data_type_combo_id": newFieldEntry.data_type_combo_id,
                                "data_type_combo_value": newFieldEntry.data_type_combo_value,
                                "field_data_type_category_id": newFieldEntry.field_data_type_category_id,
                                "field_data_type_id": newFieldEntry.field_data_type_id,
                                "field_id": fieldID,
                                "field_name": fieldName,
                                "field_value": newFieldEntry.field_value,
                                "form_id": newRequest.form_id,
                                "message_unique_id": 12345678910
                            });

                            // Form the content string
                            content += `In the ${formName}, the field ${fieldName} was updated to ${newFieldEntry.field_value} <br />`;;
                        }

                        return {
                            field_id: fieldID,
                            success: true,
                            update_sequence_id: newRequest.update_sequence_id
                        };
                    })
                    .catch((error) => {
                        console.log("fetchUpdateSeqIdPromises | getLatestUpdateSeqId | Error: ", error);
                        return 'Ghotala';
                    })
            );
        }

        await Promise.all(fetchUpdateSeqIdPromises)
            .then((updateSequenceIDs) => {
                console.log("updateSequenceIDs: ", updateSequenceIDs);
            })
            .catch((error) => {
                console.log("Promise.all | fetchUpdateSeqIdPromises | error: ", error);
                return [error, []];
            });

        console.log("content: ", content);
        // update the activity's inline data as well
        activityInlineData = [...activityInlineDataMap.values()];

        // [REORDER | SORT] Fetch the target form's field sequence data
        let fieldSequenceIdMap = {};
        await activityCommonService
            .getFormFieldMappings(request, Number(request.form_id), 0, 500)
            .then((data) => {
                if (data.length > 0) {

                    data.forEach(formMappingEntry => {
                        fieldSequenceIdMap[formMappingEntry.field_id] = Number(formMappingEntry.field_sequence_id);
                    });
                }
            });

        // S O R T Target Form entries based on the 
        // field_id:field_seq_id data feteched above
        activityInlineData.sort((a, b) => {
            let keyA = Number(fieldSequenceIdMap[a.field_id]),
                keyB = Number(fieldSequenceIdMap[b.field_id]);
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });

        request.activity_inline_data = JSON.stringify(activityInlineData);

        let activityTimelineCollection = {
            form_submitted: activityInlineData,
            subject: `Field Updated for ${formName}`,
            content: content,
            mail_body: `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
            attachments: [],
            asset_reference: [],
            activity_reference: [],
            form_approval_field_reference: []

        };
        request.activity_timeline_collection = JSON.stringify(activityTimelineCollection);

        const event = {
            name: "alterActivityInline",
            service: "activityUpdateService",
            method: "alterActivityInline",
            payload: request
        };

        queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
            if (err) {
                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
            }
        });

        if (request.hasOwnProperty("workflow_activity_id")) {
            // Make a 713 timeline transaction entry in the workflow file
            let workflowFile713Request = Object.assign({}, request);
            workflowFile713Request.activity_id = request.workflow_activity_id;
            workflowFile713Request.data_activity_id = Number(request.activity_id);
            workflowFile713Request.form_transaction_id = Number(request.form_transaction_id);
            workflowFile713Request.activity_type_category_id = 48;
            workflowFile713Request.activity_stream_type_id = 713;
            workflowFile713Request.flag_timeline_entry = 1;
            workflowFile713Request.message_unique_id = util.getMessageUniqueId(request.asset_id);
            workflowFile713Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            workflowFile713Request.device_os_id = 8;
            const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
            try {
                await addTimelineTransactionAsync(workflowFile713Request);
            } catch (error) {
                console.log("alterFormActivityFieldValues | workflowFile713Request | addTimelineTransactionAsync | Error: ", error);
            }
        }

        return [false, activityData];
    };

    //async function uploadHtmltoPDF () {
    this.nanikalyan = async (request) => {

        let activityDetails = await activityCommonService.getActivityDetailsPromise(request, request.activity_id);
        //console.log('ACT Details : ', activityDetails);
        let activityInlineData = JSON.parse(activityDetails[0].activity_inline_data);

        //console.log(activityInlineData);
        let useTemplate = 0;
        let customerName = "";
        let location = "";
        let productType = "";
        let productSubType = "";
        let locations= "";
        let locationA = "";
        let locationB = "";
        let bandWidth = "";

        for(let i=0; i < activityInlineData.length;i++) {
            //console.log(i.field_name);

            if(activityInlineData[i].field_id === '13786') {
                (activityInlineData[i].field_value === "Domestic VPN") ?
                    useTemplate = 1 //Domestic
                        :
                    useTemplate = 2; //Global
                
            } else if(activityInlineData[i].field_id === '13777') {
                customerName = activityInlineData[i].field_value;
            } else if(activityInlineData[i].field_id === '13788') {
                location = activityInlineData[i].field_value;
            } else if(activityInlineData[i].field_id === '13771') { //Product Type
                productType = activityInlineData[i].field_value;
            } else if(activityInlineData[i].field_id === '13773') { //Product Sub Type
                productSubType = activityInlineData[i].field_value;                
            } else if(activityInlineData[i].field_id === '13787') {
                locations = activityInlineData[i].field_value;
            } else if(activityInlineData[i].field_id === '13783') {
                locationA = activityInlineData[i].field_value;
            } else if(activityInlineData[i].field_id === '13784') {
                locationB = activityInlineData[i].field_value;
            }else if(activityInlineData[i].field_id === '13780') {
                bandWidth = activityInlineData[i].field_value;
            }
        }
        
        const domesticTemplate = `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>Welcome</title>
            </head>
            <body style="margin:0; padding:0;">
            <div style="margin:0 auto; width:650px; font-family:Georgia, 'Times New Roman', Times, serif; color:#555; font-size:14px;">
            <div style="padding:10px 0; border-bottom:1px dashed #555;">
                <p style="text-align:center; margin:0;"><span style="font-size:40px; border-bottom:1px solid #FF0000; color:#FF0000; font-weight:bold; line-height:30px; display:inline-block;">Demo Telco Inc.</span></p>
                <p style="text-align:center; font-size:12px; margin:5px 0;">Plot No <span style="border-bottom:1px solid #FF0000; color:#FF0000;">123</span>, Road No. <span style="border-bottom:1px solid #FF0000; color:#FF0000;">25</span>, Jubilee Hills, Hyderabad- 500 062</p>
            </div>
            <div style=" text-align:right; padding-top:10px; padding-right:30px; font-weight:bold; font-size:15px; color:#FF0000;">Date:${util.getCurrentDate()}</div>
            <div style="padding-top:10px; font-weight:bold; font-size:15px; color:#555;">To</div>
            <div style=" padding-top:30px;font-weight:bold; font-size:15px; color:#FF0000;">${customerName},</div>
            <div style=" padding-top:5px;font-weight:bold; font-size:15px; color:#FF0000;">${location}<span style="color:#555">.</span></div>
            <div style=" padding-top:30px;">Subject: Quotation for <span style="color:#ff0000">${productType}</span></div>
            <div style=" padding-top:20px; padding-bottom:20px;">Thank you for your interest in our services. With reference to your inquiry for <span style="color:#ff0000">${productType}</span>, we are
                pleased to submit our proposal for your perusal. </div>
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #ccc; text-align:center;">
                <tr>
                <td width="5%" style="padding:5px; border:1px solid #ccc;"><strong>S.<br />
                    No</strong></td>
                <td width="40%" style="padding:5px; border:1px solid #ccc;"><strong>Description</strong></td>
                <td width="10%" style="padding:5px; border:1px solid #ccc;">&nbsp;</td>
                <td width="10%" style="padding:5px; border:1px solid #ccc;"><span style="color:#FF0000"><strong>Price</strong></span></td>
                <td width="10%" style="padding:5px; border:1px solid #ccc;"><strong>Total</strong></td>
                </tr>
                <tr>
                <td style="padding:5px;border:1px solid #ccc; text-align:left;">01</td>
                <td style="padding:5px;border:1px solid #ccc; text-align:left;"><div style="color:#ff0000">${productType}:</div>
                    For the <span style="color:#ff0000">&quot;${productSubType}&quot;</span> with <span style="color:#ff0000">&quot;${locations}&quot;</span>
                    locations from <span style="color:#ff0000">${locationA}</span> to <span style="color:#ff0000">${locationB}</span> with <span style="color:#ff0000">&quot;${bandWidth}&quot;</span>
                    Bandwidth<br />
                <br /><br />
                <br />

                </td>
                    <td style="padding:5px;border:1px solid #ccc; text-align:left;">&nbsp;</td>
                    <td style="padding:5px;border:1px solid #ccc; text-align:center;"><span style="border-bottom:1px solid #ff0000; color:#ff0000;">Rs.50,000/-</span></td>
                    <td style="padding:5px;border:1px solid #ccc; text-align:left;">Rs.50,000/-</td>
                    </tr>
                    <tr>
                    <td style="padding:5px;border:1px solid #ccc; text-align:left;">02</td>
                    <td style="padding:5px;border:1px solid #ccc;text-align:left;"><span style="color:#ff0000">Tax<br />
                <br />
                </span></td>
                    <td style="padding:5px;border:1px solid #ccc;text-align:left;"><span style="color:#ff0000">18</span></td>
                    <td style="padding:5px;border:1px solid #ccc;text-align:left;">9000</td>
                    <td style="padding:5px;border:1px solid #ccc;text-align:left;">9000</td>
                    </tr>
                    <tr>
                    <td style="padding:5px;border:1px solid #ccc;text-align:left;"> </td>
                    <td style="padding:5px;border:1px solid #ccc;text-align:left;"><span style="color:#ff0000">Total<br />
                <br />
                </span></td>
                    <td style="padding:5px;border:1px solid #ccc;text-align:left;"> </td>
                    <td style="padding:5px;border:1px solid #ccc;text-align:left;"> </td>
                    <td style="padding:5px;border:1px solid #ccc;text-align:left;">59000</td>
                    </tr>
                </table>
                
                <div style="padding:30px 0 0; color:#000;"><strong><span style="border-bottom:1px solid #555">Terms and Conditions:</span></strong></div>
                
                <div style="padding:20px 0; color:#555; line-height:25px;">1. Payment: 70% along with PO and balance against delivery.<br />

                2. GST: @18% Added extra<br />

                3. Installation <span style="color:#ff0000; border-bottom:1px solid #ff0000;">charges include in above price</span>.<br />

                4. Delivery and installation as per your schedule.<br />

                5. Validity – This quote is valid <span style="color:#ff0000; border-bottom:1px solid #ff0000;">for one</span> mont<span style="color:#ff0000; border-bottom:1px solid #ff0000;">h</span>.</div>
                
                <div style="padding:0;"><span style="color:#ff0000; border-bottom:1px solid #ff0000;">Looking forward to your order and assuring you of</span> our best services at all times.</div>
                <div style="padding:30px 0 10px;">Thanking you<br />
                <br />
                Your’s faithfully</div>

                <div style="padding:10px 0 30px;"><span style="color:#ff0000; border-bottom:1px solid #ff0000;">Parameshwar Reddy<br />

                For Demo Telco Inc.</span></div>
                </div>
                </body>
                </html>`;


        const globalTemplate = `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>Welcome</title>
            </head>
            <body style="margin:0; padding:0;">
            <div style="margin:0 auto; width:650px; font-family:Georgia, 'Times New Roman', Times, serif; color:#555; font-size:14px;">
            <div style="padding:10px 0; border-bottom:1px dashed #555;">
                <p style="text-align:center; margin:0;"><span style="font-size:40px; border-bottom:1px solid #FF0000; color:#FF0000; font-weight:bold; line-height:30px; display:inline-block;">Demo Telco Inc.</span></p>
                <p style="text-align:center; font-size:12px; margin:5px 0;">Plot No <span style="border-bottom:1px solid #FF0000; color:#FF0000;">123</span>, Road No. <span style="border-bottom:1px solid #FF0000; color:#FF0000;">25</span>, Jubilee Hills, Hyderabad- 500 062</p>
            </div>
            <div style=" text-align:right; padding-top:10px; padding-right:30px; font-weight:bold; font-size:15px; color:#FF0000;">Date:${util.getCurrentDate()}</div>
            <div style="padding-top:10px; font-weight:bold; font-size:15px; color:#555;">To</div>
            <div style=" padding-top:30px;font-weight:bold; font-size:15px; color:#FF0000;">${customerName},</div>
            <div style=" padding-top:5px;font-weight:bold; font-size:15px; color:#FF0000;">${location}<span style="color:#555">.</span></div>
            <div style=" padding-top:30px;">Subject: Quotation for <span style="color:#ff0000">${productType}</span></div>
            <div style=" padding-top:20px; padding-bottom:20px;">Thank you for your interest in our services. With reference to your inquiry for <span style="color:#ff0000">${productType}</span>, we are
                pleased to submit our proposal for your perusal. </div>
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #ccc; text-align:center;">
                <tr>
                <td width="5%" style="padding:5px; border:1px solid #ccc;"><strong>S.<br />
                    No</strong></td>
                <td width="40%" style="padding:5px; border:1px solid #ccc;"><strong>Description</strong></td>
                <td width="10%" style="padding:5px; border:1px solid #ccc;">&nbsp;</td>
                <td width="10%" style="padding:5px; border:1px solid #ccc;"><span style="color:#FF0000"><strong>Price</strong></span></td>
                <td width="10%" style="padding:5px; border:1px solid #ccc;"><strong>Total</strong></td>
                </tr>
                <tr>
                <td style="padding:5px;border:1px solid #ccc; text-align:left;">01</td>
                <td style="padding:5px;border:1px solid #ccc; text-align:left;"><div style="color:#ff0000">${productType}:</div>
                    For the <span style="color:#ff0000">&quot;${productSubType}&quot;</span> with <span style="color:#ff0000">&quot;${locations}&quot;</span>
                    locations from <span style="color:#ff0000">${locationA}</span> to <span style="color:#ff0000">${locationB}</span> with <span style="color:#ff0000">&quot;${bandWidth}&quot;</span>
                    Bandwidth<br />
            <br /><br />
            <br />

            </td>
                <td style="padding:5px;border:1px solid #ccc; text-align:left;">&nbsp;</td>
                <td style="padding:5px;border:1px solid #ccc; text-align:center;"><span style="border-bottom:1px solid #ff0000; color:#ff0000;">Rs.50,000/-</span></td>
                <td style="padding:5px;border:1px solid #ccc; text-align:left;">Rs.50,000/-</td>
                </tr>
                <tr>
                <td style="padding:5px;border:1px solid #ccc; text-align:left;">02</td>
                <td style="padding:5px;border:1px solid #ccc; text-align:left;"><div style="color:#ff0000">CAPEX:</div>


            </td>
                <td style="padding:5px;border:1px solid #ccc; text-align:left;">&nbsp;</td>
                <td style="padding:5px;border:1px solid #ccc; text-align:center;"><span style="border-bottom:1px solid #ff0000; color:#ff0000;">Rs.200,000/-</span></td>
                <td style="padding:5px;border:1px solid #ccc; text-align:left;">Rs.200,000/-</td>
                </tr>
                <tr>
                <td style="padding:5px;border:1px solid #ccc; text-align:left;">03</td>
                <td style="padding:5px;border:1px solid #ccc;text-align:left;"><span style="color:#ff0000">Tax<br />
            <br />
            </span></td>
                <td style="padding:5px;border:1px solid #ccc;text-align:left;"><span style="color:#ff0000">18</span></td>
                <td style="padding:5px;border:1px solid #ccc;text-align:left;">45000</td>
                <td style="padding:5px;border:1px solid #ccc;text-align:left;">45000</td>
                </tr>
                <tr>
                <td style="padding:5px;border:1px solid #ccc;text-align:left;"> </td>
                <td style="padding:5px;border:1px solid #ccc;text-align:left;"><span style="color:#ff0000">Total<br />
            <br />
            </span></td>
                <td style="padding:5px;border:1px solid #ccc;text-align:left;"> </td>
                <td style="padding:5px;border:1px solid #ccc;text-align:left;"> </td>
                <td style="padding:5px;border:1px solid #ccc;text-align:left;">295000</td>
                </tr>
            </table>
            
            <div style="padding:30px 0 0; color:#000;"><strong><span style="border-bottom:1px solid #555">Terms and Conditions:</span></strong></div>
            
            <div style="padding:20px 0; color:#555; line-height:25px;">1. Payment: 70% along with PO and balance against delivery.<br />

            2. GST: @18% Added extra<br />

            3. Installation <span style="color:#ff0000; border-bottom:1px solid #ff0000;">charges include in above price</span>.<br />

            4. Delivery and installation as per your schedule.<br />

            5. Validity – This quote is valid <span style="color:#ff0000; border-bottom:1px solid #ff0000;">for one</span> mont<span style="color:#ff0000; border-bottom:1px solid #ff0000;">h</span>.</div>
            
            <div style="padding:0;"><span style="color:#ff0000; border-bottom:1px solid #ff0000;">Looking forward to your order and assuring you of</span> our best services at all times.</div>
            <div style="padding:30px 0 10px;">Thanking you<br />
            <br />
            Your’s faithfully</div>

            <div style="padding:10px 0 30px;"><span style="color:#ff0000; border-bottom:1px solid #ff0000;">Parameshwar Reddy<br />

            For Demo Telco Inc.</span></div>
            </div>
            </body>
            </html>`;


        const pdfFilePath = `${__dirname}/pdfs/${request.activity_id}.pdf`;        
        await new Promise((resolve,)=>{
            let template;
            if(useTemplate === 1) {
                template = domesticTemplate;
            } else if(useTemplate === 2) {
                template = globalTemplate;
            }
            fs.writeFile(`${__dirname}/pdfs/${request.activity_id}.html`, template, function (err) {
                if (err) throw err;

                console.log('HTML File is generated');
                return resolve();
            });
        });        

        let html = fs.readFileSync(`${__dirname}/pdfs/${request.activity_id}.html`, 'utf8');
        var options = { 
                "height": "10.5in", // allowed units: mm, cm, in, px
                  "width": "9in", 
                format: 'A4',
                "border": {
                    "top": "0.5in",            // default is 0, units: mm, cm, in, px
                    //"right": "0.5in",
                    "bottom": "0.5in",
                    "left": "0.25in"
                  }
                };         
        
        return await new Promise((resolve)=>{
            pdf.create(html, options).toFile(`${__dirname}/pdfs/${request.activity_id}.pdf`, async (err, res) => {
                if (err){
                  console.log(err);
                } 
                else {
                  console.log('PDF file is generated! ', res);
      
                  let body = await new Promise((resolve)=>{
                      fs.readFile(pdfFilePath, (err, data) => {
                          if (err) throw err;
          
                          console.log('Reading pdf stream is done');
                          return resolve(data);
                      });
                  });                       
                  
                  //console.log('Before Params...');
                  let params = {
                      Body: body,
                      Bucket: "demotelcoinc",                
                      Key: `${request.activity_id}.pdf`,
                      ContentType: 'application/pdf',
                      //ContentEncoding: 'base64',
                      ACL: 'public-read'
                  };
          
                  console.log('Uploading to S3...');
                  s3.putObject(params, async (err, data) =>{
                      console.log(err);
                      console.log(data);
      
                      await (this.addTimelineEntrywithAttachment(request));
                      return resolve();
                  });
                }
                
              });
        });
        
    };

    this.addTimelineEntrywithAttachment = async (request) => {

        let activityTimelineCollection = {};
        activityTimelineCollection.content = "File - " + util.getCurrentDate();
        activityTimelineCollection.subject = "File - " + util.getCurrentDate();
        activityTimelineCollection.mail_body = "File - " + util.getCurrentDate();
        let url = "https://demotelcoinc.s3.ap-south-1.amazonaws.com/" +request.activity_id+".pdf";
        activityTimelineCollection.attachments = [url];
        activityTimelineCollection.asset_reference = [];
        activityTimelineCollection.activity_reference = [];
        activityTimelineCollection.form_approval_field_reference = [];

        let timelineParams = {};
        timelineParams.account_id= request.account_id;
        timelineParams.activity_access_role_id= 27;
        timelineParams.activity_channel_category_id= 0;
        timelineParams.activity_channel_id= 0;
        timelineParams.activity_id= request.activity_id;
        timelineParams.activity_parent_id= 0;
        timelineParams.activity_stream_type_id= 325;
        timelineParams.activity_sub_type_id= -1;
        timelineParams.activity_timeline_collection= JSON.stringify(activityTimelineCollection);
        timelineParams.activity_timeline_text= "";
        timelineParams.activity_timeline_url= "";
        timelineParams.activity_type_category_id= 48;
        timelineParams.activity_type_id= 140138;
        timelineParams.app_version= 1;
        timelineParams.asset_id= request.asset_id;
        timelineParams.data_entity_inline= JSON.stringify(activityTimelineCollection);
        timelineParams.datetime_log= util.getCurrentUTCTime();
        timelineParams.device_os_id= 5;
        timelineParams.flag_offline= 0;
        timelineParams.flag_pin= 0;
        timelineParams.flag_priority= 0;
        timelineParams.flag_retry= 0;
        timelineParams.message_unique_id= util.getMessageUniqueId(request.asset_id);
        timelineParams.operating_asset_first_name= "BOT";
        timelineParams.organization_id= 898;
        timelineParams.service_version= 1;
        timelineParams.timeline_stream_type_id= 325;
        //timelineParams.timeline_transaction_id= 1560767030826
        timelineParams.track_altitude= 0;
        timelineParams.track_gps_accuracy= "0";
        timelineParams.track_gps_datetime= util.getCurrentUTCTime();
        timelineParams.track_gps_status= 0;
        timelineParams.track_latitude= "0.0";
        timelineParams.track_longitude= "0.0";
        timelineParams.workforce_id= request.workforce_id;

        await new Promise((resolve, reject) => {
            activityTimelineService.addTimelineTransaction(timelineParams, (err) => {
                (err === false) ? resolve() : reject(err);
            });            
        });
    };

}

module.exports = BotService;