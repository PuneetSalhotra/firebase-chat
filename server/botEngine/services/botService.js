/*
 * author: Nani Kalyan V
 */

const logger = require("../../logger/winstonLogger");
var ActivityService = require('../../services/activityService.js');
var ActivityParticipantService = require('../../services/activityParticipantService.js');
//var ActivityUpdateService = require('../../services/activityUpdateService.js');
var ActivityTimelineService = require('../../services/activityTimelineService.js');
var ActivityListingService = require('../../services/activityListingService.js');

const UrlOpsService = require('../../UrlShortner/services/urlOpsService');

const LedgerOpsService = require('../../Ledgers/services/ledgerOpsService');

const AdminListingService = require("../../Administrator/services/adminListingService");
const AdminOpsService = require('../../Administrator/services/adminOpsService');

//const WorkbookOpsService = require('../../Workbook/services/workbookOpsService');
//const WorkbookOpsService_VodafoneCustom = require('../../Workbook/services/workbookOpsService_VodafoneCustom');

const RMBotService = require('./rmbotService');

const uuidv4 = require('uuid/v4');
const _ = require('lodash');

const AWS = require('aws-sdk');
AWS.config.update({
    "accessKeyId": "AKIAWIPBVOFRSFSVJZMF",
    "secretAccessKey": "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",
    "region": "ap-south-1"
});
const sqs = new AWS.SQS();

const XLSX = require('xlsx');

function BotService(objectCollection) {

    const moment = require('moment');
    const makeRequest = require('request');
    const TinyURL = require('tinyurl');

    const cacheWrapper = objectCollection.cacheWrapper;
    const queueWrapper = objectCollection.queueWrapper;
    //const activityPushService = objectCollection.activityPushService;
    
    const ActivityPushService = require('../../services/activityPushService');
    const activityPushService = new ActivityPushService(objectCollection);

    const util = objectCollection.util;
    const db = objectCollection.db;
    const botConfig = require('../utils/botConfig.js');

    const activityCommonService = objectCollection.activityCommonService;
    //const activityUpdateService = new ActivityUpdateService(objectCollection);
    const activityParticipantService = new ActivityParticipantService(objectCollection);
    const activityService = new ActivityService(objectCollection);
    const activityListingService = new ActivityListingService(objectCollection);
    const activityTimelineService = new ActivityTimelineService(objectCollection);

    const urlOpsService = new UrlOpsService(objectCollection);
    const ledgerOpsService = new LedgerOpsService(objectCollection);

    const adminListingService = new AdminListingService(objectCollection);
    const adminOpsService = new AdminOpsService(objectCollection);

    //const workbookOpsService = new WorkbookOpsService(objectCollection);
    //const workbookOpsService_VodafoneCustom = new WorkbookOpsService_VodafoneCustom(objectCollection);

    const rmBotService = new RMBotService(objectCollection);

    const nodeUtil = require('util');

    const pdf = require('html-pdf');

    const path = require('path');
    const fs = require('fs');

    const HummusRecipe = require('hummus-recipe');

    const { serializeError } = require('serialize-error')
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
                
                // let results = new Array();
                let paramsArray;
                let error = true;
                let responseData='';
                // paramsArray =
                //     new Array(
                //         request.bot_id,
                //         request.bot_level_id,
                //         request.bot_trigger_id,
                //         request.organization_id,
                //         request.log_asset_id,
                //         request.log_datetime,
                //     );

                // results[0] = await db.callDBProcedure(request, 'ds_p1_bot_list_update', paramsArray, 0);

                 //Inline data update
                 paramsArray =
                 new Array(
                     request.bot_operation_id,
                     request.bot_id,
                     JSON.stringify(request.bot_inline_data),
                     request.organization_id,
                     request.log_asset_id,
                     request.log_datetime,
                 );
                 const queryString = util.getQueryString('ds_p1_bot_operation_mapping_update_inline', paramsArray);
                 if (queryString != '') {
                     await db.executeQueryPromise(0, queryString, request)
                       .then((data)=>{
                             responseData = {'message': 'bot data updated successfully!'};
                             error = false;
                         })
                         .catch((err)=>{
                                 console.log('[Error] bot data update ',err);
                                 error = err;
                         });
                 }
                
                // paramsArray =
                //     new Array(
                //         request.bot_id,
                //         request.organization_id,
                //         global.botConfig.botAltered,
                //         request.log_asset_id,
                //         request.log_datetime,
                //     );

                // results[2] = await db.callDBProcedure(request, 'ds_p1_bot_list_history_insert', paramsArray, 0);

                return [error,responseData];
            } catch (error) {
                // console.log(error)
                return [true,[]]
            }
        };

    //Archive bot definition
    //Bharat Masimukku
    //2019-01-18
    this.archiveBot =
        async (request) => {
            try {
                // Fetch all associated bot operations
                const [_, botOperationData] = await adminListingService.botOperationMappingSelectID({
                    bot_id: request.bot_id,
                    bot_operation_id: 0
                });

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

                // Delete all associated bots
                if (botOperationData.length > 0) {
                    for (const botOperation of botOperationData) {
                        try {
                            await this.archiveBotWorkflowStep({
                                ...request,
                                bot_operation_id: botOperation.bot_operation_id
                            });
                        } catch (error) {
                            logger.error(`Error deleting bot operation | %j`, error.message, { type: 'archive_bot', error, request_body: request, stack: error.stack, error_message: error.message });
                        }
                    }
                }

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
                        request.field_id,
                        request.data_type_combo_id,
                        request.form_id,
                        request.bot_operation_sequence_id,
                        request.bot_operation_inline_data,
                        request.organization_id,
                        request.log_asset_id,
                        request.log_datetime,
                    );

                // results[0] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_insert', paramsArray, 0);
                results[0] = await db.callDBProcedure(request, 'ds_p1_1_bot_operation_mapping_insert', paramsArray, 0);

                if(request.bot_operation_type_id == 32) { // set a flag for the target field as prefill enabled for prefil bot
                    let inlineData = JSON.parse(request.bot_operation_inline_data);
                    let fieldCopy = inlineData.bot_operations.form_field_copy;

                    for(let row of fieldCopy) {
                        paramsArray =
                          new Array(
                            row.target_field_id,
                            request.form_id,
                            request.organization_id,
                            request.field_value_prefill_enabled || 0,
                            request.log_asset_id,
                            request.log_datetime
                          );

                        await db.callDBProcedure(request, 'ds_p1_workforce_form_field_mapping_update_prefill_enabled', paramsArray, 0);
                    }
                }

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
                let rpaFormFieldList = [];
                // Check if this is a (field ID combo ID) specific bot operation
                if (Number(request.field_id) !== 0) {
                    rpaFormFieldList.push({
                        form_id: request.form_id,
                        field_id: request.field_id,
                        data_type_combo_id: request.data_type_combo_id || 0
                    });
                }
                // Check for any bot operation conditionals 
                try {
                    const botOperationInlineData = JSON.parse(request.bot_operation_inline_data),
                    botOperations = botOperationInlineData.bot_operations;
                if (
                    Boolean(botOperations.condition.is_check) === true &&
                    Number(botOperations.condition.form_id) > 0 &&
                    Number(botOperations.condition.field_id) > 0
                ) {
                    rpaFormFieldList.push({
                        form_id: Number(botOperations.condition.form_id),
                        field_id: Number(botOperations.condition.field_id),
                        data_type_combo_id: 0
                    });
                }
                } catch (error) {
                    // 
                }
                // Check for field IDs inside the bot operations's inline data
                rpaFormFieldList = await getRPAFieldsFromBotOperation(request, rpaFormFieldList);

                for (const rpaFormField of rpaFormFieldList) {
                    try {
                        if (Number(request.field_id) !== 0) {
                            // 1. Get the field data
                            const [errOne, fieldData] = await adminListingService.workforceFormFieldMappingSelectWorkflowFields({
                                ...request,
                                form_id: rpaFormField.form_id,
                                field_id: rpaFormField.field_id,
                                data_type_combo_id: rpaFormField.data_type_combo_id || 0
                            });
                            // 2. Extract the field's inline data
                            if (!errOne && fieldData.length > 0) {
                                let fieldInlineData = JSON.parse(fieldData[0].field_inline_data || '{}');
                                if (!fieldInlineData.hasOwnProperty("bots")) {
                                    fieldInlineData.bots = {};
                                    fieldInlineData.bots[request.bot_id] = {};
                                    fieldInlineData.bots[request.bot_id].bot_operations = {};

                                } else if (!fieldInlineData.bots.hasOwnProperty(request.bot_id)) {
                                    fieldInlineData.bots[request.bot_id] = {};
                                    fieldInlineData.bots[request.bot_id].bot_operations = {};

                                }

                                fieldInlineData.bots[request.bot_id].bot_operations[results[0][0].bot_operation_id] = {
                                    bot_id: request.bot_id,
                                    bot_name: results[0][0].bot_name,
                                    bot_operation_id: results[0][0].bot_operation_id,
                                    bot_operation_type_id: request.bot_operation_type_id,
                                    bot_operation_type_name: results[0][0].bot_operation_type_name,
                                    bot_form_id: request.form_id,
                                    bot_form_name: results[0][0].form_name
                                };

                                // 3. Update the field's inline data
                                const [errTwo, _] = await adminOpsService.workforceFormFieldMappingUpdateInline({
                                    ...request,
                                    field_id: rpaFormField.field_id,
                                    data_type_combo_id: rpaFormField.data_type_combo_id || 0,
                                    form_id: rpaFormField.form_id,
                                    field_name: fieldData[0].field_name,
                                    inline_data: JSON.stringify(fieldInlineData),
                                    flag_value_contributor: fieldData[0].field_flag_workflow_value_contributor,
                                    flag_bot_dependency: 1
                                });

                            } else {
                                // console.log("workforceFormFieldMappingSelectWorkflowFields: ", errOne);
                            }
                        }
                    } catch (error) {
                        // console.log("Error: ", error);
                    }
                }

                return results[0];
            } catch (error) {
                return Promise.reject(error);
            }
        };

    async function getRPAFieldsFromBotOperation(request, rpaFormFieldList) {
        const botOperationTypeID = Number(request.bot_operation_type_id),
            botOperationInlineData = JSON.parse(request.bot_operation_inline_data),
            botOperations = botOperationInlineData.bot_operations;

        switch (botOperationTypeID) {
            case 1: // Add participant
                if (
                    botOperations.participant_add.hasOwnProperty("dynamic") &&
                    Number(botOperations.participant_add.dynamic.field_id) > 0 &&
                    Number(botOperations.participant_add.dynamic.form_id) > 0
                ) {
                    rpaFormFieldList.push({
                        form_id: Number(botOperations.participant_add.dynamic.form_id),
                        field_id: Number(botOperations.participant_add.dynamic.field_id),
                        data_type_combo_id: 0
                    });
                }
                break;

            case 3: // Form Field Copy Bot
                if (
                    Array.isArray(botOperations.form_field_copy) &&
                    botOperations.form_field_copy.length > 0
                ) {
                    for (const sourceTargetPair of botOperations.form_field_copy) {
                        if (
                            // Source
                            Number(sourceTargetPair.source_field_id) > 0 &&
                            Number(sourceTargetPair.source_form_id) > 0 &&
                            // Target
                            Number(sourceTargetPair.target_field_id) > 0 &&
                            Number(sourceTargetPair.target_form_id) > 0
                        ) {
                            rpaFormFieldList.push({
                                form_id: Number(sourceTargetPair.target_form_id),
                                field_id: Number(sourceTargetPair.target_field_id),
                                data_type_combo_id: 0
                            });
                        }
                    }
                }
                break;
            
            case 6: // Fire text
                if (
                    botOperations.fire_text.hasOwnProperty("dynamic") &&
                    Number(botOperations.fire_text.dynamic.field_id) > 0 &&
                    Number(botOperations.fire_text.dynamic.form_id) > 0
                ) {
                    rpaFormFieldList.push({
                        form_id: Number(botOperations.fire_text.dynamic.form_id),
                        field_id: Number(botOperations.fire_text.dynamic.field_id),
                        data_type_combo_id: 0
                    });
                }
                break;
            
            case 7: // Fire email
                if (
                    botOperations.fire_email.hasOwnProperty("dynamic") &&
                    Number(botOperations.fire_email.dynamic.field_id) > 0 &&
                    Number(botOperations.fire_email.dynamic.form_id) > 0
                ) {
                    rpaFormFieldList.push({
                        form_id: Number(botOperations.fire_email.dynamic.form_id),
                        field_id: Number(botOperations.fire_email.dynamic.field_id),
                        data_type_combo_id: 0
                    });
                }
                break;

            case 10: // Add attachment with/without attestation
                for (const attachment of botOperations.add_attachment_with_attestation) {
                    // Document
                    if (
                        attachment.hasOwnProperty("document") &&
                        Number(attachment.document.field_id) > 0 &&
                        Number(attachment.document.form_id) > 0
                    ) {
                        rpaFormFieldList.push({
                            form_id: Number(attachment.document.form_id),
                            field_id: Number(attachment.document.field_id),
                            data_type_combo_id: 0
                        });
                    }
                    // Attestation
                    if (
                        attachment.hasOwnProperty("document") &&
                        attachment.document.hasOwnProperty("attestation") &&
                        Number(attachment.document.attestation.field_id) > 0 &&
                        Number(attachment.document.attestation.form_id) > 0
                    ) {
                        rpaFormFieldList.push({
                            form_id: Number(attachment.document.attestation.form_id),
                            field_id: Number(attachment.document.attestation.field_id),
                            data_type_combo_id: 0
                        });
                    }
                }
                break;

            case 15: // Create customer
                const createCustomerFields = botOperations.create_customer;
                for (const key of Object.keys(createCustomerFields)) {
                    if (
                        createCustomerFields[key].hasOwnProperty("field_id") &&
                        Number(createCustomerFields[key].field_id) > 0 &&
                        Number(createCustomerFields[key].form_id) > 0
                    ) {
                        rpaFormFieldList.push({
                            form_id: Number(createCustomerFields[key].form_id),
                            field_id: Number(createCustomerFields[key].field_id),
                            data_type_combo_id: 0
                        });
                    }
                }
                break;

            case 16: // Workflow reference cumulation
                const workflowReferenceCumulation = botOperations.workflow_reference_cumulation;
                if (
                    workflowReferenceCumulation.hasOwnProperty("reference_activity_datatype") &&
                    Number(workflowReferenceCumulation.reference_activity_datatype.field_id) > 0 &&
                    Number(workflowReferenceCumulation.reference_activity_datatype.form_id) > 0
                ) {
                    rpaFormFieldList.push({
                        form_id: Number(workflowReferenceCumulation.reference_activity_datatype.form_id),
                        field_id: Number(workflowReferenceCumulation.reference_activity_datatype.field_id),
                        data_type_combo_id: 0
                    });
                }
                break;

            case 17: // Single selection cumulation
                const singleSelectionCumulation = botOperations.single_selection_cumulation;
                const maxDataTypeComboID = Number(request.max_data_type_combo_id);
                if (
                    singleSelectionCumulation.hasOwnProperty("single_selection_datatype") &&
                    Number(singleSelectionCumulation.single_selection_datatype.field_id) > 0 &&
                    Number(singleSelectionCumulation.single_selection_datatype.form_id) > 0
                ) {
                    let singleSelectionFieldData = await activityCommonService.getFormFieldDefinition(request, {
                        form_id: Number(singleSelectionCumulation.single_selection_datatype.form_id),
                        field_id: Number(singleSelectionCumulation.single_selection_datatype.field_id)
                    });
                    for (const singleSelectionField of singleSelectionFieldData) {
                        rpaFormFieldList.push({
                            form_id: Number(singleSelectionCumulation.single_selection_datatype.form_id),
                            field_id: Number(singleSelectionCumulation.single_selection_datatype.field_id),
                            data_type_combo_id: singleSelectionField.data_type_combo_id
                        });
                    }
                }
                break;

            default:
                break;
        }

        return rpaFormFieldList;
    }

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
            // Get the bot operation's inline data
            try {
                let rpaFormFieldList = [];
                const [errOne, botOperationData] = await adminListingService.botOperationMappingSelectID(request);
                if (botOperationData.length > 0) {
                    let flagBotDependency = 1;
                    const botOperationInlineData = JSON.parse(botOperationData[0].bot_operation_inline_data),
                        botOperations = botOperationInlineData.bot_operations;

                    // Check if this is a (field ID combo ID) specific bot operation
                    if (Number(botOperationData[0].field_id) !== 0) {
                        rpaFormFieldList.push({
                            form_id: botOperationData[0].form_id,
                            field_id: botOperationData[0].field_id,
                            data_type_combo_id: botOperationData[0].data_type_combo_id || 0
                        });
                    }
                    // 
                    // Check for any bot operation conditionals 
                    if (
                        botOperations.hasOwnProperty("condition") &&
                        Boolean(botOperations.condition.is_check) === true &&
                        Number(botOperations.condition.form_id) > 0 &&
                        Number(botOperations.condition.field_id) > 0
                    ) {
                        rpaFormFieldList.push({
                            form_id: Number(botOperations.condition.form_id),
                            field_id: Number(botOperations.condition.field_id),
                            data_type_combo_id: 0
                        });
                    }
                    // 
                    // Check for field IDs inside the bot operations's inline data
                    rpaFormFieldList = await getRPAFieldsFromBotOperation({
                        ...request,
                        bot_operation_type_id: botOperationData[0].bot_operation_type_id,
                        bot_operation_inline_data: botOperationData[0].bot_operation_inline_data
                    }, rpaFormFieldList);
                }
                for (const rpaFormField of rpaFormFieldList) {
                    try {
                        if (Number(request.field_id) !== 0) {
                            // 1. Get the field data
                            const [errOne, fieldData] = await adminListingService.workforceFormFieldMappingSelectWorkflowFields({
                                ...request,
                                form_id: rpaFormField.form_id,
                                field_id: rpaFormField.field_id,
                                data_type_combo_id: rpaFormField.data_type_combo_id || 0
                            });
                            // 2. Modify the field's inline data
                            if (!errOne && fieldData.length > 0) {
                                let fieldInlineData = JSON.parse(fieldData[0].field_inline_data || '{}');
                                // Remove the specific bot operation information from the field's inline data
                                if (
                                    fieldInlineData.hasOwnProperty("bots") &&
                                    fieldInlineData.bots.hasOwnProperty(request.bot_id) &&
                                    fieldInlineData.bots[request.bot_id].hasOwnProperty("bot_operations") &&
                                    fieldInlineData.bots[request.bot_id].bot_operations.hasOwnProperty(request.bot_operation_id)
                                ) {
                                    // Remove the specific the bot operation from the inline data
                                    delete fieldInlineData.bots[request.bot_id].bot_operations[request.bot_operation_id];
                                    // Remove any dangling bots (bots with no bot operations associated with the field)
                                    if (Object.keys(fieldInlineData.bots[request.bot_id].bot_operations).length === 0) {
                                        delete fieldInlineData.bots[request.bot_id];
                                    }
                                    
                                    // Set flagBotDependency to 0, if there are no bots defined at all
                                    if (Object.keys(fieldInlineData.bots).length === 0) {
                                        flagBotDependency = 0;
                                    }
                                }

                                // 3. Update the field's inline data
                                const [errTwo, _] = await adminOpsService.workforceFormFieldMappingUpdateInline({
                                    ...request,
                                    field_id: rpaFormField.field_id,
                                    data_type_combo_id: rpaFormField.data_type_combo_id || 0,
                                    form_id: rpaFormField.form_id,
                                    field_name: fieldData[0].field_name,
                                    inline_data: JSON.stringify(fieldInlineData),
                                    flag_value_contributor: fieldData[0].field_flag_workflow_value_contributor,
                                    flag_bot_dependency: flagBotDependency
                                });

                            } else {
                                // console.log("workforceFormFieldMappingSelectWorkflowFields: ", errOne);
                            }
                        }
                    } catch (error) {
                        // console.log("Error: ", error);
                    }
                }
            } catch (error) {
                logger.error(`Error updating field inline data | %j`, error.message, { type: 'archive_bot_operation', error, request_body: request, stack: error.stack, error_message: error.message });
            }
            // Check if the bot has only this bot operation associated with it
            // Get all bot operations for the given bot_id
            let archiveBotFlag = 0;
            try {
                const botOperations = await this.getBotworkflowStepsByForm({
                    organization_id: request.organization_id,
                    form_id: 0,
                    field_id: 0,
                    bot_id: request.bot_id,
                    page_start: 0,
                    page_limit: 50
                });
                if (
                    botOperations.length === 1 &&
                    Number(botOperations[0].bot_operation_id) === Number(request.bot_operation_id)
                ) {
                    archiveBotFlag = 1;
                }
            } catch (error) {
                logger.error(`Error fetching bot operations for bot | %j`, error.message, { type: 'archive_bot_operation', error, request_body: request, stack: error.stack, error_message: error.message });
            }
            try {
                let results = new Array();
                let paramsArray;

                paramsArray =
                    new Array(
                        request.bot_id,
                        request.bot_operation_id,
                        request.organization_id,
                        request.log_state || 3,
                        request.log_asset_id || request.asset_id,
                        request.log_datetime || util.getCurrentUTCTime(),
                    );

                results[0] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_update_log_state', paramsArray, 0);

                paramsArray =
                    new Array(
                        request.bot_id,
                        request.bot_operation_id,
                        request.organization_id,
                        global.botConfig.botOperationArchived,
                        request.log_asset_id || request.asset_id,
                        request.log_datetime || util.getCurrentUTCTime(),
                    );

                results[1] = await db.callDBProcedure(request, 'ds_p1_bot_operation_mapping_history_insert', paramsArray, 0);

                if (archiveBotFlag && request.url.includes('bot/mapping/workflow_step/archive')) {
                    try {
                        await this.archiveBot({
                            ...request,
                            log_state: 3,
                            log_asset_id: request.asset_id,
                            log_datetime: util.getCurrentUTCTime()
                        });
                    } catch (error) {
                        logger.error(`Error archiving bot ${request.bot_id} | %j`, error.message, { type: 'archive_bot_operation', error, request_body: request, stack: error.stack, error_message: error.message });
                    }
                }

                return results[0];
            } catch (error) {
                logger.error(`Error archiving bot operation ${request.bot_operation_id} | %j`, error.message, { type: 'archive_bot_operation', error, request_body: request, stack: error.stack, error_message: error.message });
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

    this.getBotworkflowStepsByForm = async (request) => {
        // p_organization_id BIGINT, p_bot_id BIGINT, p_form_id BIGINT, 
        // p_field_id BIGINT, p_start_from BIGINT, p_limit_value SMALLINT
        let paramsArr = new Array(
            request.organization_id,
            request.bot_id,
            request.form_id || 0,
            request.field_id || 0,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_p1_bot_operation_mapping_select_form', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.initBotEngine = async (request) => {

        //Bot Log - Bot engine Triggered
        activityCommonService.botOperationFlagUpdateTrigger(request, 1);

        logger.silly(' ');
        logger.silly('🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖');
        logger.silly(' ');
        logger.silly('🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖  ENTERED BOT ENGINE  🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖');
        logger.silly(' ');
        logger.silly('🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖');
        logger.silly(' ');

        request['datetime_log'] = util.getCurrentUTCTime();
        // console.log("initBotEngine | request: ", request);

        // Prepare the map equivalent for the form's inline data,
        // for easy checks and comparisons
        let formInlineData = [], formInlineDataMap = new Map();
        try {
            if (!request.hasOwnProperty('activity_inline_data')) {
                // Usually mobile apps send only activity_timeline_collection parameter in
                // the "/activity/timeline/entry/add" call
                const activityTimelineCollection = JSON.parse(request.activity_timeline_collection);
                formInlineData = activityTimelineCollection.form_submitted;
                if (
                    Number(request.device_os_id) === 1 &&
                    typeof activityTimelineCollection.form_submitted === "string"
                ) {
                    formInlineData = JSON.parse(activityTimelineCollection.form_submitted);
                }
            } else {
                formInlineData = JSON.parse(request.activity_inline_data);
            }
            for (const field of formInlineData) {
                formInlineDataMap.set(Number(field.field_id), field);
            }
        } catch (error) {
            logger.error("Error parsing inline JSON and/or preparing the form data map", { type: 'bot_engine', error, request_body: request });
        }

        let wfSteps;
        let formLevelWFSteps = [];
        let fieldLevelWFSteps = [];

        /*if(request.hasOwnProperty(bot_operation_id)) {
            wfSteps = request.inline_data;
        } else {
            wfSteps = await this.getBotworkflowSteps({
                "bot_id": request.bot_id,
                "page_start": 0,
                "page_limit": 50
            });
        }*/

        //bot_flag_trigger_on_field_edit
        if(Number(request.is_from_field_alter) === 1) { //Request has come from field alter       
            console.log('In form_field_alter');
            console.log("formInlineDataMap: ", formInlineDataMap);
            console.log(' ');
            /*In case of Refill 
                1) trigger all form level bots 
                2) trigger bots on the respective field i.e. altered*/

            //flag = 0 = ALL bots
            //flag = 1 = Only Field based bots
            //flag = 2 = ONly Form Based bots
            //flag = 3 = ONly specific Form Based bots to be triggered in field edit
            
            let [err, botResponse] = await activityCommonService.getMappedBotSteps({
                organization_id: 0,
                bot_id: 0,
                form_id: request.form_id,
                field_id: request.altered_field_id,
                start_from: 0,
                limit_value: 50
            }, 3);

            formLevelWFSteps = botResponse;
            
            //console.log('formLevelWFSteps : ', formLevelWFSteps);

            //To trigger only field level Bots
            fieldLevelWFSteps = await this.getBotworkflowStepsByForm({
                "organization_id": 0,
                "form_id": request.form_id,
                "field_id": request.altered_field_id,
                "bot_id": 0, // request.bot_id,
                "page_start": 0,
                "page_limit": 50
            });

            if(formLevelWFSteps.length > 0) {
                wfSteps = fieldLevelWFSteps.concat(formLevelWFSteps);
            } else {
                wfSteps = fieldLevelWFSteps;
            }            

        } else if(Number(request.is_refill) === 1) { 
            console.log('This is smart form - Refill case');
            //This is Form refill SMART FORM 
            //1) Retrigger all form level bots
            //2) Retrigger all the impacted field level
            
            //1) Retrigger all form level bots
                let [err, botResponse] = await activityCommonService.getMappedBotSteps({
                    organization_id: 0,
                    bot_id: 0,
                    form_id: request.form_id,
                    field_id: request.altered_field_id,
                    start_from: 0,
                    limit_value: 50
                }, 2);

            console.log('Number of form Level Bots : ',  botResponse.length);
            let totalBots = botResponse; //Assigning form based bots

            //2) Retrigger all the impacted field level
            let fieldLevelWFSteps = [];
            for(const i_iterator of formInlineData) {
                let tempResponse = await this.getBotworkflowStepsByForm({
                    "organization_id": 0,
                    "form_id": request.form_id,
                    "field_id": i_iterator.field_id,
                    "bot_id": 0, // request.bot_id,
                    "page_start": 0,
                    "page_limit": 50
                });

                console.log('Field Level Bots : ',tempResponse.length);
                if(tempResponse.length > 0) {
                    totalBots = totalBots.concat(tempResponse); //Assigning field level bots
                }                
            }

            wfSteps = totalBots;            

        } else if(Number(request.is_resubmit) === 1) {
            console.log('This is non-smart - Resubmit case');
            //This is Form resubmit NON-SMART FORM 
            //Retrigger all form level bots
            let [err, botResponse] = await activityCommonService.getMappedBotSteps({
                organization_id: 0,
                bot_id: 0,
                form_id: request.form_id,
                field_id: request.altered_field_id,
                start_from: 0,
                limit_value: 50
            }, 2);

            wfSteps = botResponse; //Assigning form based bots
        } else {   
            console.log('This is generic case!! - First time form Submission!!');
            //trigger both the form level bots & field level - Normally happens for the first time form submission
            wfSteps = await this.getBotworkflowStepsByForm({
                "organization_id": 0,
                "form_id": request.form_id,
                "field_id": 0,
                "bot_id": 0, // request.bot_id,
                "page_start": 0,
                "page_limit": 50
            });
        }

        let botOperationsJson,
            botSteps;
        
        //console.log("formInlineDataMap: ", formInlineDataMap);
        //console.log('wfSteps : ', wfSteps);

        //Print what are all the bots are there
        for (const temp_iterator of wfSteps) {
            console.log('bot_operation_type_id : ', temp_iterator.bot_operation_type_id);
            console.table([{
                bot_operation_sequence_id: temp_iterator.bot_operation_sequence_id,
                bot_operation_id: temp_iterator.bot_operation_id,
                bot_operation_type_name: temp_iterator.bot_operation_type_name,
                form_id: temp_iterator.form_id,
                field_id: temp_iterator.field_id,
                data_type_combo_id: temp_iterator.data_type_combo_id,
                data_type_combo_name: temp_iterator.data_type_combo_name
            }]);
        }

        logger.silly('🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖');
        
        for (let i of wfSteps) {
            global.logger.write('conLog', i.bot_operation_type_id, {}, {});

            // Check whether the bot operation should be triggered for a specific field_id only
            console.table([{
                bot_operation_sequence_id: i.bot_operation_sequence_id,
                //bot_operation_type_id: i.bot_operation_type_id,
                bot_operation_type_name: i.bot_operation_type_name,
                form_id: i.form_id,
                field_id: i.field_id,
                data_type_combo_id: i.data_type_combo_id,
                data_type_combo_name: i.data_type_combo_name
            }]);
            
            // Update bot trigger details
            request.trigger_form_id = Number(i.form_id);
            request.trigger_form_name = i.form_name || "";
            request.trigger_field_id = Number(i.field_id);
            request.trigger_field_name = i.field_name || "";

            try {
                // Check if the bot operation is field specific
                let botOperationFieldID = Number(i.field_id);
                if (
                    botOperationFieldID > 0 &&
                    !formInlineDataMap.has(botOperationFieldID)
                ) {
                    logger.silly("\x1b[31mThis bot operation is field specific & cannot be applied.\x1b[0m");
                    continue;
                }
                // 
                // Check if the bot operation is field + data_type_combo_id specific
                if (
                    botOperationFieldID > 0 &&
                    Number(i.data_type_combo_id) > 0 &&
                    formInlineDataMap.has(botOperationFieldID) &&
                    !(Number(i.data_type_combo_id) === Number(formInlineDataMap.get(botOperationFieldID).data_type_combo_id))
                ) {
                    logger.silly("\x1b[31mThis bot operation is field and data_type_combo_id specific & cannot be applied.\x1b[0m");
                    continue;
                }
            } catch (error) {
                logger.error("Error checking field/data_type_combo_id trigger specificity", { type: 'bot_engine', error, request_body: request });
            }

            console.log('i.bot_operation_inline_data : ', i.bot_operation_inline_data);
            console.log('Value of i : ', i)
            console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
            botOperationsJson = JSON.parse(i.bot_operation_inline_data);
            //console.log('ONE: ', botOperationsJson);
            botSteps = Object.keys(botOperationsJson.bot_operations);
            //console.log('TWO');
            logger.silly("botSteps: %j", botSteps);
            //console.log('THREE');

            // Check for condition, if any
            let canPassthrough = true;
            try {
                canPassthrough = await isBotOperationConditionTrue(request, botOperationsJson.bot_operations, formInlineDataMap);
            } catch (error) {
                console.log("canPassthrough | isBotOperationConditionTrue | canPassthrough | Error: ", error);
            }
            if (!canPassthrough) {
                console.log("The bot operation condition failed, so the bot operation will not be executed.");
                continue;
            }

            //if(i.bot_operation_type_id === 2 || 
            //   i.bot_operation_type_id === 17 || 
            //   i.bot_operation_type_id === 28) {
            //    continue;
            //}

            switch (i.bot_operation_type_id) {
                //case 'participant_add':
                case 1: // Add Participant                 
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'PARTICIPANT ADD', {}, {});
                    logger.silly("Request Params received from Request: %j", request);
                    try {
                        await addParticipant(request, botOperationsJson.bot_operations.participant_add, formInlineDataMap);
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
                    logger.silly("Request Params received from Request: %j", request);
                    try {
                        let result = await changeStatus(request, botOperationsJson.bot_operations.status_alter);
                        if (result[0]) {
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": result[1]
                            });
                        }
                    } catch (err) {
                        logger.error("serverError | Error in executing changeStatus Step", { type: "bot_engine", request_body: request, error: serializeError(err) });
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
                        await copyFields(request, botOperationsJson.bot_operations.form_field_copy, botOperationsJson.bot_operations.condition);
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
                    logger.silly("Request Params received from Request: %j", request);
                    try {
                        let result = await alterWFCompletionPercentage(request, botOperationsJson.bot_operations.workflow_percentage_alter);
                        if (result[0]) {
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": result[1]
                            });
                        }
                    } catch (err) {
                        logger.error("serverError | Error in executing alterWFCompletionPercentage Step", { type: "bot_engine", request_body: request, error: serializeError(err) });
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
                    if (
                        request.hasOwnProperty("activity_stream_type_id") &&
                        Number(request.activity_stream_type_id) === 713
                    ) {
                        // Do not fire this bot step on form edits
                        logger.verbose(`Do Not Fire Email On Form Edit`, { type: 'bot_engine', request_body: request, error: null });
                        continue;
                        // break;
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'FIRE TEXT', {}, {});
                    try {
                        await fireTextMsg(request, botOperationsJson.bot_operations.fire_text);
                    } catch (err) {
                        console.log("Error in executing fireTextMsg Step | Error: ", err)
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
                    if (
                        request.hasOwnProperty("activity_stream_type_id") &&
                        Number(request.activity_stream_type_id) === 713
                    ) {
                        // Do not fire this bot step on form edits
                        logger.verbose(`Do Not Fire Email On Form Edit`, { type: 'bot_engine', request_body: request, error: null });
                        continue;
                        // break;
                    }
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
                
                case 8: // add_comment
                    console.log('****************************************************************');
                    console.log('add_comment');
                    console.log('add_comment | Request Params received by BOT ENGINE', request);
                    try {
                        await addComment(request, botOperationsJson.bot_operations.add_comment);
                    } catch (err) {
                        console.log('add_comment | Error', err);
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                    }
                    console.log('****************************************************************');
                    break;
                
                // case 9: // add_attachment
                //     console.log('****************************************************************');
                //     console.log('add_attachment');
                //     console.log('add_attachment | Request Params received by BOT ENGINE', request);
                //     try {
                //         await addAttachment(request, botOperationsJson.bot_operations.add_attachment);
                //     } catch (err) {
                //         console.log('add_attachment  | Error', err);
                //         i.bot_operation_status_id = 2;
                //         i.bot_operation_inline_data = JSON.stringify({
                //             "err": err
                //         });
                //     }
                //     console.log('****************************************************************');
                //     break;
                
                case 10: // add_attachment_with_attestation
                    console.log('****************************************************************');
                    console.log('add_attachment_with_attestation');
                    console.log('add_attachment_with_attestation | Request Params received by BOT ENGINE', request);
                    try {
                        await addAttachmentWithAttestation(request, botOperationsJson.bot_operations.add_attachment_with_attestation);
                    } catch (err) {
                        console.log('add_attachment_with_attestation  | Error', err);
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                    }
                    console.log('****************************************************************');
                    break;
                
                // case 11: // add_form_as_pdf
                //     console.log('****************************************************************');
                //     console.log('add_form_as_pdf');
                //     console.log('add_form_as_pdf | Request Params received by BOT ENGINE', request);
                //     try {
                //         await addFormAsPdf(request, botOperationsJson.bot_operations.add_form_as_pdf);
                //     } catch (err) {
                //         console.log('add_form_as_pdf  | Error', err);
                //         i.bot_operation_status_id = 2;
                //         i.bot_operation_inline_data = JSON.stringify({
                //             "err": err
                //         });
                //     }
                //     console.log('****************************************************************');
                //     break;
                
                case 12: // form_pdf
                    console.log('****************************************************************');
                    console.log('form_pdf');
                    logger.silly('form_pdf | Request Params received by BOT ENGINE: %j', request);
                    try {
                        await addPdfFromHtmlTemplate(request, botOperationsJson.bot_operations.form_pdf);
                    } catch (err) {
                        logger.error("serverError | Error in executing form_pdf Step", { type: "bot_engine", request_body: request, error: serializeError(err) });
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                    }
                    console.log('****************************************************************');
                    break;
                
                case 13: // [RESERVED] Time Slot Bot
                    break;

                case 14: // [RESERVED] Ledger Transactions Bot
                    logger.silly("LEDGER TRANSACTION");
                    try {
                        await ledgerOpsService.ledgerCreditDebitNetTransactionUpdate(request);
                    } catch (error) {
                        console.log("LEDGER TRANSACTION Error: ", error);
                    }
                    break;

                case 15: // Customer Creation Bot
                    if (
                        request.hasOwnProperty("activity_stream_type_id") &&
                        Number(request.activity_stream_type_id) === 713
                    ) {
                        // Do not fire this bot step on form edits
                        logger.silly(`Do Not Fire Create Customer On Form Edit`, { type: 'bot_engine', error: null });
                        continue;
                    }
                    logger.silly("CREATE CUSTOMER");
                    try {
                        await createCustomerAsset(request, botOperationsJson.bot_operations.create_customer);
                    } catch (error) {
                        console.log("CREATE CUSTOMER Error: ", error);
                    }
                    break;
                
                case 16: // Workflow Reference Bot
                    logger.silly("Workflow Reference Bot");
                    try {
                        //await createCustomerAsset(request, botOperationsJson.bot_operations.create_customer);
                    } catch (error) {
                        console.log("Workflow Reference Bot: ", error);
                    }
                    break;

                case 17: // Combo Field Selection Bot
                    logger.silly("Combo Field Selection Bot");
                    break;

                case 18: // Workbook Mapping Bot
                    logger.silly("[Implemented] Workbook Mapping Bot: %j", request);
                    //Only if product variant is selected then only trigger the bot
                    let flag = 0;                    
                    let activityInlineData;
                    let product_variant_activity_title=""
                    try {
                        if (!request.hasOwnProperty('activity_inline_data')) {                            
                            const activityTimelineCollection = JSON.parse(request.activity_timeline_collection);
                            activityInlineData = activityTimelineCollection.form_submitted;
                            if (
                                Number(request.device_os_id) === 1 &&
                                typeof activityTimelineCollection.form_submitted === "string"
                            ) {
                                activityInlineData = JSON.parse(activityTimelineCollection.form_submitted);
                            }
                        } else {
                            activityInlineData = JSON.parse(request.activity_inline_data);
                        }                        
                    } catch (error) {
                        logger.error("Error parsing inline JSON for workbook bot", { type: 'bot_engine', error, request_body: request });
                    }

                    console.log(' ');
                    console.log('activityInlineData : ', activityInlineData);

                    let activityProductSelection;
                    for(const i of activityInlineData) {
                        if(Number(i.field_data_type_id) === 71) {
                            activityProductSelection = i.field_value;

                            let fieldValue = JSON.parse(i.field_value);
                            let cartItems = fieldValue.cart_items;
                            console.log('typeof Cart Items : ', typeof cartItems);
                            console.log('Cart Items : ', cartItems);

                            cartItems = (typeof cartItems === 'string') ? JSON.parse(cartItems) : cartItems;

                            if(cartItems.length > 0) {
                                console.log('Searching for custom variant');
                                for(j of cartItems) {
                                    console.log('product_variant_activity_title : ', (j.product_variant_activity_title).toLowerCase());
                                    if((j.product_variant_activity_title).toLowerCase() == 'custom variant' ||
                                        (j.product_variant_activity_title).toLowerCase() == 'custom') {
                                        flag = 1
                                    }
                                    else{
                                        product_variant_activity_title = j.product_variant_activity_title;
                                    }
                                }
                            } //End of If
                        }
                    }

                    if(Number(request.activity_type_id) === 152184) {
                        flag = 1;
                    }

                    console.log('Number(request.parent_activity_id) - ', Number(request.parent_activity_id));
                    if(request.hasOwnProperty('parent_activity_id') && Number(request.parent_activity_id) > 0) {
                        flag = 0;
                    }

                    //For Workbook logs
                    request.activity_product_selection = (typeof activityProductSelection === 'object') ? JSON.stringify(activityProductSelection) : activityProductSelection;
                    let[err, response] = await activityCommonService.workbookTrxInsert(request);
                    console.log(response);
                                
                    let workbookTxnID = (response.length > 0) ? response[0].transaction_id : 0;
                    request.activity_workbook_transaction_id = workbookTxnID;
                    ///////////////////////////

                    if(Number(flag) === 1) {
                        if(Number(request.activity_type_id) === 152184) {
                            console.log('Its a BC workflow Form : ', request.form_id, ' -- ' , request.form_name);
                        }
                        
                        try {
                            if (
                                Number(request.organization_id) === 868 ||
                                Number(request.organization_id) === 912
                            ) {
                                request.bot_id = i.bot_id;
                                request.bot_operation_id = i.bot_operation_id;

                                let baseURL = `http://localhost:7000`,
                                //sqsQueueUrl = 'https://sqs.ap-south-1.amazonaws.com/430506864995/staging-vil-excel-job-queue.fifo';
                                sqsQueueUrl = global.config.excelBotSQSQueue;
                                if (global.mode === "sprint" || global.mode === "staging") {
                                    baseURL = `http://10.0.2.49:4000`;
                                    //sqsQueueUrl = `https://sqs.ap-south-1.amazonaws.com/430506864995/staging-vil-excel-job-queue.fifo`;
                                    sqsQueueUrl = global.config.excelBotSQSQueue;
                                } else if (global.mode === "preprod") {
                                    baseURL = null;
                                    //sqsQueueUrl = `https://sqs.ap-south-1.amazonaws.com/430506864995/preprod-vil-excel-job-queue.fifo`;
                                    sqsQueueUrl = global.config.excelBotSQSQueue;
                                } else if(global.mode === "prod") {
                                    baseURL = null;
                                    //sqsQueueUrl = `https://sqs.ap-south-1.amazonaws.com/430506864995/prod-vil-excel-job-queue.fifo`;
                                    sqsQueueUrl = global.config.excelBotSQSQueue;
                                }
                                sqs.sendMessage({
                                    // DelaySeconds: 5,
                                    MessageBody: JSON.stringify(request),
                                    QueueUrl: sqsQueueUrl,
                                    MessageGroupId: `excel-processing-job-queue-v1`,
                                    MessageDeduplicationId: uuidv4(),
                                    MessageAttributes: {
                                        "Environment": {
                                            DataType: "String",
                                            StringValue: global.mode
                                        },
                                    }
                                }, (error, data) => {
                                    if (error) {
                                        logger.error("Error sending excel job to SQS queue", { type: 'bot_engine', error: serializeError(error), request_body: request });

                                        activityCommonService.workbookTrxUpdate({
                                            activity_workbook_transaction_id: workbookTxnID,
                                            flag_generated: -1, //Error pushing to SQS Queue
                                            url: ''
                                        });
                                    } else {
                                        logger.info("Successfully sent excel job to SQS queue: %j", data, { type: 'bot_engine', request_body: request });                                        
                                    }                                    
                                });
                                // makeRequest.post(`${baseURL}/r1/bot/bot_step/trigger/vodafone_workbook_bot`, {
                                //     form: request,
                                // }, function (error, response, body) {
                                //     logger.silly("[Workbook Mapping Bot] Request error: %j", error);
                                //     logger.silly("[Workbook Mapping Bot] Request body: %j", body);
                                // });
    
                                // await workbookOpsService_VodafoneCustom.workbookMappingBotOperation(request, formInlineDataMap, botOperationsJson.bot_operations.map_workbook);
                            } else {
                                // await workbookOpsService.workbookMappingBotOperation(request, formInlineDataMap, botOperationsJson.bot_operations.map_workbook);
                            }
                        } catch (error) {
                            logger.error("Error running the Workbook Mapping Bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
                        }
                    } else {
                        console.log('Its not a custom Variant. Hence not triggering the Bot!');
                        console.log('OR It has non-zero parent activity ID - ', Number(request.parent_activity_id));
                        console.log('---------- TIMELINE ENTRY -----------');
                        
                        await addTimelineEntry({...request,content:`BC excel mapping is not configured for this opportunity as it is a standard plan`,subject:"sample",mail_body:request.mail_body,attachment:[],timeline_stream_type_id:request.timeline_stream_type_id},1);
                    }
                    
                    break;

                case 19: // Update CUID Bot
                    logger.silly("Update CUID Bot");
                    logger.silly("Update CUID Bot Request: %j", request);
                    try {
                        await updateCUIDBotOperation(request, formInlineDataMap, botOperationsJson.bot_operations.update_cuids);
                    } catch (error) {
                        logger.error("Error running the CUID update bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
                    }
                    break;

                case 24: // Due date edit Bot - ESMS
                    logger.silly("Due date edit Bot - ESMS");
                    logger.silly("Due date edit Bot - ESMS: %j", request);
                    try {
                        await this.setDueDateOfWorkflow(request, formInlineDataMap, botOperationsJson.bot_operations.due_date_edit);
                    } catch (error) {
                        logger.error("Error running the setDueDateOfWorkflow", { type: 'bot_engine', error: serializeError(error), request_body: request });
                    }
                    break;

                case 25: // participant_remove
                    logger.silly("[participant_remove] Params received from Request: %j", request);
                    try {
                        await removeParticipant(request, botOperationsJson.bot_operations.participant_remove, formInlineDataMap);
                    } catch (error) {
                        logger.error("[participant_remove] Error removing participant", { type: 'bot_engine', error: serializeError(error), request_body: request });
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "error": error
                        });
                    }
                    break;
                    
                case 26: // ESMS Integrations- Consume Part - Bot
                    logger.silly("[ESMS Integrations- Consume] Params received from Request: %j", request);
                    let esmsIntegrationsTopicName = "";
                    switch (process.env.mode) {
                        case "staging":
                            // Disabled for PreProd testing, because both staging and preprod
                            // share the same topic for integrations communication
                            // esmsIntegrationsTopicName = "staging-vil-esms-ibmmq-v2";
                            break;
                        case "preprod":
                            esmsIntegrationsTopicName = "staging-vil-esms-ibmmq-v3";
                            break;
                        case "prod":
                            esmsIntegrationsTopicName = "production-vil-esms-ibmmq-v1";
                            break;
                    }
                    try {
                        if (esmsIntegrationsTopicName === "") { throw new Error("EsmsIntegrationsTopicNotDefinedForMode"); }
                        await queueWrapper.raiseActivityEventToTopicPromise({
                            type: "VIL_ESMS_IBMMQ_INTEGRATION",
                            trigger_form_id: Number(request.trigger_form_id),
                            form_transaction_id: Number(request.form_transaction_id),
                            payload: request
                        }, esmsIntegrationsTopicName, request.workflow_activity_id || request.activity_id);
                    } catch (error) {
                        logger.error("[ESMS Integrations- Consume] Error during consuming", { type: 'bot_engine', error: serializeError(error), request_body: request });
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "error": error
                        });
                    }
                    break;

                case 28: //Arithmetic Bot
                        logger.silly("ArithMetic Bot Params received from Request: %j", request);
                        try {
                            console.log('botOperationsJson in Arithmetic Bot: ', botOperationsJson);
                            await arithmeticBot(request, formInlineDataMap, botOperationsJson.bot_operations.arithmetic_calculation);
                        } catch (error) {
                            logger.error("[Arithmetic Bot] Error in Arithmetic Bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                        }
                        break;

                case 29: //Reminder Bot
                        logger.silly("Reminder Bot Params received from Request: %j", request);
                            try {
                                await reminderBot(request, formInlineDataMap, botOperationsJson.bot_operations.date_reminder);
                            } catch (error) {
                                logger.error("[Reminder Bot] Error in Reminder Bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
                                i.bot_operation_status_id = 2;
                                i.bot_operation_inline_data = JSON.stringify({
                                    "error": error
                            });
                        }                
                        break;

                case 30: // Bulk Feasibility Excel Parser Bot
                        logger.silly("Bulk Feasibility Excel Parser Bot params received from request: %j", request);
                        try {
                            await bulkFeasibilityBot(request, formInlineDataMap, botOperationsJson.bot_operations.bulk_feasibility);
                        } catch (error) {
                            logger.error("[Bulk Feasibility Excel Parser Bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                        }
                        break;
                
                case 31: // workflow start bot
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'WorkFlow Bot', {}, {});
                    try {
                        // global.logger.write('conLog', 'Request Params received by BOT ENGINE', request, {});
                        console.log('workflow start | Request Params received by BOT ENGINE', request);
                        await workFlowCopyFields(request, botOperationsJson.bot_operations.form_field_copy, botOperationsJson.bot_operations.condition);
                    } catch (err) {
                        global.logger.write('conLog', 'Error in executing workflow start Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                        //return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                case 33: //Global Add Participant
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'GLOBAL PARTICIPANT ADD', {}, {});
                    logger.silly("Request Params received from Request: %j", request);
                    try {
                        await globalAddParticipant(request, botOperationsJson.bot_operations.participant_add, formInlineDataMap);
                    } catch (err) {
                        global.logger.write('serverError', 'Error in executing Global addParticipant Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                        //return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                case 35: //Mobility  Bot
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'Mobility Bot', {}, {});
                    logger.silly("Request Params received from Request: %j", request);
                    try {
                        await checkMobility(request, botOperationsJson.bot_operations.bot_inline);
                    } catch (err) {
                        global.logger.write('serverError', 'Error in executing Mobility Bot Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        i.bot_operation_status_id = 2;
                        i.bot_operation_inline_data = JSON.stringify({
                            "err": err
                        });
                        //return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                case 36: //SME ILL DOA Bot
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    global.logger.write('conLog', 'SME ILL Bot', {}, {});
                    logger.silly("Request Params received from Request: %j", request);
                    try {
                        await checkMobility(request, botOperationsJson.bot_operations.bot_inline);
                    } catch (err) {
                        global.logger.write('serverError', 'Error in executing SME ILL Bot Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        i.bot_operation_status_id = 2;
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

        // Send push notification
        try {
            if (
                request.hasOwnProperty("activity_stream_type_id") &&
                Number(request.activity_stream_type_id) === 713
            ) {
                util.sendRPACompletionAcknowledgement({
                    organization_id: request.organization_id,
                    target_asset_id: request.asset_id,
                    activity_type_category_id: request.activity_type_category_id,
                    workflow_activity_id: request.workflow_activity_id,
                    form_id: request.form_id,
                    field_id: formInlineData[0].field_id
                });
            }
        } catch (error) {
            // console.log("sendRPACompletionAcknowledgement | Error: ", error)
        }

        return {};
    };

    async function isBotOperationConditionTrue(request, botOperationsJson, formInlineDataMap) {
        let workflowActivityID = Number(request.workflow_activity_id) || 0;

        if (
            botOperationsJson.hasOwnProperty("condition") &&
            botOperationsJson.condition.hasOwnProperty("is_check") &&
            Boolean(botOperationsJson.condition.is_check) === true
        ) {
            const formID = botOperationsJson.condition.form_id,
                fieldID = botOperationsJson.condition.field_id,
                operation = botOperationsJson.condition.operation,
                threshold = botOperationsJson.condition.threshold;

            // Get the form transaction ID
            let formTransactionID, formActivityID;
            const formTimelineData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, workflowActivityID, formID);

            if (Number(formTimelineData.length) > 0) {
                formTransactionID = Number(formTimelineData[0].data_form_transaction_id);
                formActivityID = Number(formTimelineData[0].data_activity_id);
            }

            // Get the field value
            let fieldData = await getFieldValue({
                form_transaction_id: formTransactionID,
                form_id: formID,
                field_id: fieldID,
                organization_id: request.organization_id
            });
            let fieldDataTypeID = 0;
            let fieldValue = '';
            if (fieldData.length > 0) {
                fieldDataTypeID = Number(fieldData[0].data_type_id);
                fieldValue = fieldData[0][getFielDataValueColumnName(fieldDataTypeID)];
            
            } else {
                if (formInlineDataMap.has(Number(fieldID))) {
                    fieldData = formInlineDataMap.get(Number(fieldID));
                    fieldDataTypeID = Number(fieldData.field_data_type_id);
                    fieldValue = fieldData.field_value;
                }
            }

            if (fieldDataTypeID === 5 || fieldDataTypeID === 6) {
                fieldValue = Number(fieldValue);
            }
            console.log("isBotOperationConditionTrue | fieldValue: ", fieldValue);

            let isConditionTrue = await checkForThresholdCondition(fieldValue, threshold, operation);
            console.log("isBotOperationConditionTrue | isConditionTrue: ", isConditionTrue);

            return isConditionTrue;
        } else {
            return true;
        }
    }

    async function checkForThresholdCondition(value, threshold, operation) {
        console.log("checkForThresholdCondition | value: ", value);
        console.log("checkForThresholdCondition | threshold: ", threshold);
        console.log("checkForThresholdCondition | operation: ", operation);
        switch (operation) {
            case "gt":
                if (value > threshold) {
                    return true;
                } else {
                    return false;
                }
                break;
            case "gte":
                if (value >= threshold) {
                    return true;
                } else {
                    return false;
                }
                break;
            case "lt":
                if (value < threshold) {
                    return true;
                } else {
                    return false;
                }
                break;
            case "lte":
                if (value <= threshold) {
                    return true;
                } else {
                    return false;
                }
                break;
            case "eq":
                if (value === threshold) {
                    return true;
                } else {
                    return false;
                }
                break;
            default:
                // We don't want any mess-up because of a wrong condition
                // Let the operation just pass through
                return true;
        }
    }

    this.removeParticipantMethod = async(request) => {
        /*
        
        {
            "bot_operations": {
              "participant_remove": {
                "from_request": {        
                  "asset_id": 32079
                },
            "flag_remove_participant": 1,
                "flag_remove_lead": 0,
                "flag_remove_owner": 0,
                "flag_esms": 1
              }
            }
          }  
        
        
        
        {
            "bot_operations": {
              "participant_remove": {
                "static": {        
                  "asset_id": 32079
                },
            "flag_remove_participant": 1,
                "flag_remove_lead": 0,
                "flag_remove_owner": 0,
                "flag_esms": 1
              }
            }
          }          
          
          {
            "bot_operations": {
              "participant_remove": {
                "asset_reference": {
                  "form_id": "",
                  "field_id": ""
                },
                "flag_esms": 1
              }
            }
          }*/
        
        //TEST CASE 1
        let inlineData = {};
            inlineData.from_request = {};
            inlineData.from_request.asset_id = 38848;    
            inlineData.flag_esms = 1;
            inlineData.flag_remove_participant = 0;
            inlineData.flag_remove_lead = 1;
            inlineData.flag_remove_owner = 0;
            inlineData.flag_remove_creator_as_owner = 0;

        //TEST CASE 2
        // let inlineData = {};
        //    inlineData.flag_esms = 1;
        //    inlineData.asset_reference = {};
        //    inlineData.asset_reference.form_id = 1234;
        //    inlineData.asset_reference.field_id = 1234;
        //   inlineData.flag_remove_participant = 0;
        //     inlineData.flag_remove_lead = 1;
        //     inlineData.flag_remove_owner = 0;
        //     inlineData.flag_remove_creator_as_owner = 0;

        await removeParticipant(request, inlineData);
        return [false, []];
    }

    async function removeParticipant(request, removeParticipantBotOperationData, formInlineDataMap = new Map()) {
        //Check Whether it is for ESMS
        if(removeParticipantBotOperationData.hasOwnProperty('flag_esms') && Number(removeParticipantBotOperationData.flag_esms) === 1) {
            //1. Check if the asset is the lead for the workflow if YES then remove his as lead
            //2. Remove the asset from the workflow
            
            const workflowActivityID = Number(request.workflow_activity_id) || 0;
            let assetID = 0;

            let inlineData = removeParticipantBotOperationData;

            console.log("Inline data");
            console.log(inlineData);

            let type = Object.keys(inlineData);
                global.logger.write('conLog', type, {}, {});

                if(type.includes('static')){
                    assetID = Number(inlineData[type[0]].asset_id);
                    console.log('STATIC - Asset ID : ', assetID);
                }
                else if(type.includes('from_request')){
                    assetID = Number(request.asset_id);
                    console.log('from_request - Asset ID : ', assetID);
                }
                else if(type.includes('asset_reference'))
                {
                    const formID = Number(inlineData["asset_reference"].form_id),
                    fieldID = Number(inlineData["asset_reference"].field_id);                      
  
                    let formTransactionID = 0, formActivityID = 0;    
              
                    const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                                        organization_id: request.organization_id,
                                        account_id: request.account_id
                                        }, workflowActivityID, formID);
  
                    if (Number(formData.length) > 0) {
                        formTransactionID = Number(formData[0].data_form_transaction_id);
                        formActivityID = Number(formData[0].data_activity_id);
                    }
                    
                    if (Number(formTransactionID) > 0 && Number(formActivityID) > 0) {
                            // Fetch the field value
                            const fieldData = await getFieldValue({
                                form_transaction_id: formTransactionID,
                                form_id: formID,
                                field_id: fieldID,
                                organization_id: request.organization_id
                            });
                            assetID = Number(fieldData[0].data_entity_bigint_1);
                        }
                        console.log('Asset Reference - Asset ID : ', assetID);
                }

            let wfActivityDetails = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);

            if(wfActivityDetails.length > 0) {                    
                let leadAssetID = Number(wfActivityDetails[0].activity_lead_asset_id);
                let creatorAssetID = Number(wfActivityDetails[0].activity_creator_asset_id);
                    
                console.log('Asset ID : ', assetID);
                console.log('Lead Asset ID : ', leadAssetID);
                console.log('Creator Asset ID : ', creatorAssetID);


                if(Number(inlineData["flag_remove_lead"]) === 1){
                    console.log('Remove as lead');
                    await removeAsLead(request,workflowActivityID,leadAssetID);
                }
                
                else if(Number(inlineData["flag_remove_owner"]) === 1){

                    console.log('Remove as Owner');
                    let reqDataForRemovingAsOwner = { 
                        activity_id : workflowActivityID,
                        target_asset_id : assetID,
                        organization_id : request.organization_id,
                        owner_flag : 0,
                    }
                 await removeAsOwner(request,reqDataForRemovingAsOwner);

                }
                else if(Number(inlineData["flag_remove_creator_as_owner"]) === 1 ){
                    console.log("Remove Creator as owner");
                    let reqDataForRemovingCreaterAsOwner = { 
                        activity_id : workflowActivityID,
                        target_asset_id : creatorAssetID,
                        organization_id : request.organization_id,
                        owner_flag : 0,
                    };
                 await removeAsOwner(request,reqDataForRemovingCreaterAsOwner);

                }
                else if(Number(inlineData["flag_remove_participant"]) === 1){

                    console.log("Remove Participant");

                    if(leadAssetID === assetID && leadAssetID !== creatorAssetID) {
                        //Unassign him as lead - Implicitly Add the creator or owner as the LEAD                        
                        await removeAsLeadAndAssignCreaterAsLead(request,workflowActivityID,creatorAssetID,leadAssetID);
                    } 
                        
                        //remove the asset from the workflow
                    if(assetID !== creatorAssetID) {
                        await unassignParticipantFunc(request, workflowActivityID, assetID);
                    }
                }

                
            }
        } //END of IF (esms flag)
        else {
            try {
                await removeParticipantBot(request, botOperationsJson.bot_operations.participant_remove, formInlineDataMap);
            } catch (error) {
                throw new Error("Error in processing remove participant Bot");
            }
        }
        
        return;
    }

    async function removeAsLead(request,workflowActivityID,leadAssetID)
    {
        let newReq = {};
        newReq.organization_id = request.organization_id;
        newReq.account_id = request.account_id;
        newReq.workforce_id = request.workforce_id;
        newReq.asset_id = 100;
        newReq.activity_id = workflowActivityID;
        newReq.lead_asset_id = 0;
        newReq.timeline_stream_type_id = 718;
        newReq.datetime_log = util.getCurrentUTCTime();
    
        await rmBotService.activityListLeadUpdateV2(newReq, 0);
    

        if(leadAssetID !== 0)
        {
            console.log("Remove lead asset inside if--------");
            let leadAssetFirstName = '',leadOperatingAssetFirstName='';
            try {
                const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
                    organization_id: request.organization_id,
                    asset_id: leadAssetID
                });
        
                console.log('********************************');
                console.log('LEAD ASSET DATA - ', assetData[0]);
                console.log('********************************');
                // leadAssetFirstName = assetData[0].asset_first_name;
                leadOperatingAssetFirstName = assetData[0].operating_asset_first_name;
            } catch (error) {
                console.log(error);
            }
        
            //Add a timeline entry
            let activityTimelineCollection =  JSON.stringify({                            
                "content": `Tony removed ${leadOperatingAssetFirstName} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
                "subject": `Note - ${util.getCurrentDate()}.`,
                "mail_body": `Tony removed ${leadOperatingAssetFirstName} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
                "activity_reference": [],
                "asset_reference": [],
                "attachments": [],
                "form_approval_field_reference": []
            });
        
            let timelineReq = Object.assign({}, request);
                timelineReq.activity_id = workflowActivityID;
                timelineReq.activity_type_id = request.activity_type_id;
                timelineReq.message_unique_id = util.getMessageUniqueId(100);
                timelineReq.track_gps_datetime = util.getCurrentUTCTime();
                timelineReq.activity_stream_type_id = 717;
                timelineReq.timeline_stream_type_id = 717;
                timelineReq.activity_timeline_collection = activityTimelineCollection;
                timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;
        
            await activityTimelineService.addTimelineTransactionAsync(timelineReq);
        }

    }

async function removeAsLeadAndAssignCreaterAsLead(request,workflowActivityID,creatorAssetID,leadAssetID){
    let newReq = {};
    newReq.organization_id = request.organization_id;
    newReq.account_id = request.account_id;
    newReq.workforce_id = request.workforce_id;
    newReq.asset_id = 100;
    newReq.activity_id = workflowActivityID;
    newReq.lead_asset_id = creatorAssetID;
    newReq.timeline_stream_type_id = 718;
    newReq.datetime_log = util.getCurrentUTCTime();

    await rmBotService.activityListLeadUpdateV2(newReq, creatorAssetID);

    let leadAssetFirstName = '';
    try {
        const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
            organization_id: request.organization_id,
            asset_id: leadAssetID
        });

        console.log('********************************');
        console.log('LEAD ASSET DATA - ', assetData[0]);
        console.log('********************************');
        leadAssetFirstName = assetData[0].asset_first_name;
    } catch (error) {
        console.log(error);
    }

    //Add a timeline entry
    let activityTimelineCollection =  JSON.stringify({                            
        "content": `Tony assigned ${leadAssetFirstName} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
        "subject": `Note - ${util.getCurrentDate()}.`,
        "mail_body": `Tony assigned ${leadAssetFirstName} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
        "activity_reference": [],
        "asset_reference": [],
        "attachments": [],
        "form_approval_field_reference": []
    });

    let timelineReq = Object.assign({}, request);
        timelineReq.activity_type_id = request.activity_type_id;
        timelineReq.message_unique_id = util.getMessageUniqueId(100);
        timelineReq.track_gps_datetime = util.getCurrentUTCTime();
        timelineReq.activity_stream_type_id = 711;
        timelineReq.timeline_stream_type_id = 711;
        timelineReq.activity_timeline_collection = activityTimelineCollection;
        timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;

    await activityTimelineService.addTimelineTransactionAsync(timelineReq);
}

async function removeAsOwner(request,data)  {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            data.activity_id,
            data.target_asset_id,
            data.organization_id,
            data.owner_flag || 0,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_owner_flag',paramsArr);
        if(queryString !== '') {
            try {
                const data = await db.executeQueryPromise(0,queryString,request);
                // await callAddTimelineEntry(request);
                responseData = data;
                error = false;
            } catch(e) {
                error = e;
            }
        }
        return [error,responseData];
    }


    async function removeParticipantBot(request, removeParticipantBotOperationData, formInlineDataMap = new Map()) {
        console.log("removeParticipant | formInlineDataMap: ", formInlineDataMap);
        if (!Number(removeParticipantBotOperationData.flag_form_submitter) === 1) {
            throw new Error("FlagFormSubmitter flag not set to 1");
        }
        const workflowActivityID = Number(request.workflow_activity_id) || 0;
        // const assetID = Number(request.auth_asset_id) || Number(request.asset_id); // Actual
        const assetID = Number(request.asset_id) || Number(request.auth_asset_id); // Test

        // Status alter or substatus completion bot incorporating arithmetic condition
        inlineData = removeParticipantBotOperationData;
        if (
            // Check if the new condition array exists
            inlineData.hasOwnProperty("condition") &&
            Array.isArray(inlineData.condition) &&
            inlineData.condition.length > 0 // &&
            // Check if the pass and fail status objects exist
            // inlineData.hasOwnProperty("pass") &&
            // inlineData.hasOwnProperty("fail")
        ) {
            let conditionChain = [];
            for (const condition of inlineData.condition) {
                const formID = Number(condition.form_id),
                    fieldID = Number(condition.field_id);

                // Check if the field is already present in the formInlineDataMap
                if (formInlineDataMap.has(fieldID)) {
                    const field = formInlineDataMap.get(fieldID);
                    conditionChain.push({
                        value: await checkForThresholdCondition(field.field_value, condition.threshold, condition.operation),
                        join_condition: condition.join_condition
                    });
                    continue;
                }

                let formTransactionID = 0,
                    formActivityID = 0;

                const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, workflowActivityID, condition.form_id);

                if (Number(formData.length) > 0) {
                    formTransactionID = Number(formData[0].data_form_transaction_id);
                    formActivityID = Number(formData[0].data_activity_id);
                }
                if (
                    Number(formTransactionID) > 0 // &&
                    // Number(formActivityID) > 0
                ) {
                    // Fetch the field value
                    const fieldData = await getFieldValue({
                        form_transaction_id: formTransactionID,
                        form_id: formID,
                        field_id: fieldID,
                        organization_id: request.organization_id
                    });
                    const fieldDataTypeID = Number(fieldData[0].data_type_id) || 0;
                    const fieldValue = fieldData[0][getFielDataValueColumnName(fieldDataTypeID)] || 0;

                    conditionChain.push({
                        value: await checkForThresholdCondition(fieldValue, condition.threshold, condition.operation),
                        join_condition: condition.join_condition
                    });

                } else {
                    conditionChain.push({
                        value: false,
                        join_condition: condition.join_condition
                    });
                }
            }

            logger.silly("conditionChain: %j", conditionChain);

            // Process the condition chain
            const conditionReducer = (accumulator, currentValue) => {
                let value = 0;
                logger.silly(`accumulator: ${JSON.stringify(accumulator)} | currentValue: ${JSON.stringify(currentValue)}`);
                // AND
                if (accumulator.join_condition === "AND") {
                    value = accumulator.value && currentValue.value;
                }
                // OR
                if (accumulator.join_condition === "OR") {
                    value = accumulator.value || currentValue.value;
                }
                // EOJ
                // Not needed
                return {
                    value,
                    join_condition: currentValue.join_condition
                }
            };

            const finalCondition = conditionChain.reduce(conditionReducer);
            logger.silly("finalCondition: %j", finalCondition);

            // Select the status based on the condition arrived
            if (finalCondition.value) {
                // PROCEED
                // Placeholder block
            } else if (!finalCondition.value) {
                // DO NOT PROCEED
                return;
            } else {
                logger.error("Error processing the condition chain", { type: 'bot_engine', request_body: request, condition_chain: conditionChain, final_condition: finalCondition });
                throw new Error("Error processing the condition chain");
            }
        }

        let removeParticipantRequest = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            activity_id: workflowActivityID,
            asset_id: request.asset_id,
            asset_token_auth: request.asset_token_auth,
            activity_participant_collection: JSON.stringify([]), // Placeholder
            api_version: request.api_version,
            app_version: request.app_version,
            asset_message_counter: request.asset_message_counter,
            device_os_id: request.device_os_id,
            flag_offline: request.flag_offline,
            flag_retry: request.flag_retry,
            message_unique_id: request.message_unique_id,
            service_version: request.service_version,
            track_gps_accuracy: request.track_gps_accuracy,
            track_gps_datetime: request.track_gps_datetime,
            track_gps_location: request.track_gps_location,
            track_gps_status: request.track_gps_status,
            track_latitude: request.track_latitude,
            track_longitude: request.track_longitude
        };

        try {
            const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
                organization_id: request.organization_id,
                asset_id: assetID
            });
            console.log("removeParticipant | error: ", error);
            if (assetData.length > 0) {
                removeParticipantRequest.activity_participant_collection = JSON.stringify([
                    {
                        "organization_id": assetData[0].organization_id,
                        "account_id": assetData[0].account_id,
                        "workforce_id": assetData[0].workforce_id,
                        "asset_type_id": assetData[0].asset_type_id,
                        "asset_category_id": assetData[0].asset_type_category_id,
                        "asset_id": assetID,
                        "access_role_id": 0,
                        "message_unique_id": 98989898989898
                    }
                ]);
            }
        } catch (error) {
            throw new Error(error);
        }

        try {
            await activityParticipantService.unassignParticicpant(removeParticipantRequest);
        } catch (error) {
            throw new Error(error);
        }

        return;
    }

    async function addPdfFromHtmlTemplate(request, templateData) {
        // If the bot operation inline data does not contain the key 'html_template_url',
        // redirect operation to addFormAsPdf
        if (
            !templateData.hasOwnProperty("html_template_url")
        ) {
            await addFormAsPdf(request, templateData);
            return;
        }

        let workflowActivityID = Number(request.workflow_activity_id) || 0,
            workflowActivityTypeID = 0;

        let [errOne, htmlTemplate] = await util.getFileDataFromS3Url(request, templateData.html_template_url);
        htmlTemplate = Buffer.from(htmlTemplate.Body).toString('ascii');

        console.log("htmlTemplate: ", htmlTemplate);

        try {
            const workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
            if (Number(workflowActivityData.length) > 0) {
                workflowActivityTypeID = Number(workflowActivityData[0].activity_type_id);
            }
        } catch (error) {
            throw new Error("addPdfFromHtmlTemplate | No Workflow Data Found in DB");
        }
        
        if (workflowActivityID === 0 || workflowActivityTypeID === 0) {
            throw new Error("addPdfFromHtmlTemplate | Couldn't Fetch workflowActivityID or workflowActivityTypeID");
        }
        
        
        let placeholderRegex = /\{\$(\d*?)\}/g,
        match,
        placeholderMatches = new Map();
        
        while (match = placeholderRegex.exec(htmlTemplate)) {
            // console.log("match[1]: ", match[1]);
            placeholderMatches.set(match[1], {});
        }
        console.log("placeholderMatches: ", placeholderMatches);
        
        let formAndFormTxnIDMap = new Map(),
        fieldDataMap = new Map();

        const formID = Number(templateData.form_id);
        const formTimelineData = await activityCommonService.getActivityTimelineTransactionByFormId713({
            organization_id: request.organization_id,
            account_id: request.account_id
        }, workflowActivityID, formID);

        let formDataCollection = JSON.parse(formTimelineData[0].data_entity_inline),
            formFieldData = [],
            formFieldDataMap = new Map();

        if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
            formFieldData = formDataCollection.form_submitted;
        } else {
            formFieldData = JSON.parse(formDataCollection.form_submitted);
        }
        for (const field of formFieldData) {
            formFieldDataMap.set(Number(field.field_id), field);
        }
        // console.log("formFieldDataMap: ", formFieldDataMap);
        
        for (const placeholder of placeholderMatches) {
            // const formID = Number(placeholder[0].split("_")[0]);
            const fieldID = Number(placeholder[0]);
            console.log("fieldID: ", fieldID);
            
            placeholderMatches.set(fieldID, {
                form_id: formID,
                field_id: fieldID,
                data_type_category_id: formFieldDataMap.get(fieldID).field_data_type_category_id,
                field_value: formFieldDataMap.get(fieldID).field_value
            });

            // Replace the placeholders with values in the html template
            htmlTemplate = String(htmlTemplate).replace(`{$${String(fieldID)}}`, formFieldDataMap.get(fieldID).field_value || '');
        }

        // Other miscellaneous placeholders
        // 1. {$currentDatetime}
        if (String(htmlTemplate).includes("{$currentDatetime}")) {
            htmlTemplate = String(htmlTemplate).replace(/{\$currentDatetime}/g, moment().utcOffset("+05:30").format("DD/MM/YYYY hh:mm A"));
        }

        // 1.1 {$currentDate}
        if (String(htmlTemplate).includes("{$currentDate}")) {
            htmlTemplate = String(htmlTemplate).replace(/{\$currentDate}/g, moment().utcOffset("+05:30").format("DD/MM/YYYY"));
        }

        // 1.2 {$currentDate}
        if (String(htmlTemplate).includes("{$currentTime}")) {
            htmlTemplate = String(htmlTemplate).replace(/{\$currentTime}/g, moment().utcOffset("+05:30").format("hh:mm:ss A"));
        }

        // 1.3 {$workflowActivityID}
        if (String(htmlTemplate).includes("{$workflowActivityID}")) {
            htmlTemplate = String(htmlTemplate).replace(/{\$workflowActivityID}/g, workflowActivityID);
        }

        console.log("htmlTemplate: ", htmlTemplate);

        let annexures = [];
        try {
            if (
                templateData.hasOwnProperty("annexures") &&
                Array.isArray(templateData.annexures)
            ) {
                console.log("templateData.annexures: ", templateData.annexures);

                for (const annexure of templateData.annexures) {
                    if (
                        formFieldDataMap.has(annexure.field_id) &&
                        formFieldDataMap.get(annexure.field_id).field_value !== ""
                    ) {
                        let annexureName = await util.downloadS3Object(request, formFieldDataMap.get(annexure.field_id).field_value);
                        const annexurePath = path.resolve(global.config.efsPath, annexureName);
                        logger.silly(`annexurePath: ${annexurePath}`, { type: 'html_to_pdf_bot' });
                        annexures.push({
                            ...annexure,
                            filepath: annexurePath
                        });
                    }
                }
            }
        } catch (error) {
            logger.error(`Error parsing/fetching annexure data`, { type: 'html_to_pdf_bot', error: serializeError(error) });
        }
        
        // Generate PDF readable stream
        const readableStream = await generatePDFreadableStream(request, htmlTemplate, annexures);
        const bucketName = await util.getS3BucketName();
        const prefixPath = await util.getS3PrefixPath(request);
        console.log("bucketName: ", bucketName);
        console.log("prefixPath: ", prefixPath);

        const uploadDetails = await util.uploadReadableStreamToS3(request, {
            Bucket: bucketName || "demotelcoinc",
            Key: `${prefixPath}/${workflowActivityID}` + `_${moment().utcOffset("+05:30").format("YYYYMMDD_hhmmA")}_` + 'customer_proposal.pdf',
            Body: readableStream,
            ContentType: 'application/pdf',
            // ACL: 'public-read'
        }, readableStream);

        let attachmentsList = [];
        attachmentsList.push(uploadDetails.Location);
        logger.verbose(`uploadReadableStreamToS3 | Data Upload Success: %j: `, uploadDetails, { type: 'aws_s3', upload_details: uploadDetails, request_body: request, error: null });

        // 
        console.log("attachmentsList: ", attachmentsList);

        let addCommentRequest = Object.assign(request, {});

        addCommentRequest.asset_id = 100;
        addCommentRequest.device_os_id = 7;
        addCommentRequest.activity_type_category_id = 48;
        addCommentRequest.activity_type_id = workflowActivityTypeID;
        addCommentRequest.activity_id = workflowActivityID;
        addCommentRequest.activity_timeline_collection = JSON.stringify({
            "content": `Tony has added attachment(s).`,
            "subject": `Tony has added attachment(s).`,
            "mail_body": `Tony has added attachment(s).`,
            "attachments": attachmentsList
        });
        addCommentRequest.activity_stream_type_id = 325;
        addCommentRequest.timeline_stream_type_id = 325;
        addCommentRequest.activity_timeline_text = "";
        addCommentRequest.activity_access_role_id = 27;
        addCommentRequest.operating_asset_first_name = "TONY"
        addCommentRequest.datetime_log = util.getCurrentUTCTime();
        addCommentRequest.track_gps_datetime = util.getCurrentUTCTime();
        addCommentRequest.flag_timeline_entry = 1;
        addCommentRequest.log_asset_id = 100;
        addCommentRequest.attachment_type_id = 17;
        addCommentRequest.attachment_type_name = path.basename(attachmentsList[0]);

        const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
        try {
            await addTimelineTransactionAsync(addCommentRequest);
        } catch (error) {
            console.log("addPdfFromHtmlTemplate | addCommentRequest | addTimelineTransactionAsync | Error: ", error);
            throw new Error(error);
        }
        return;
    }

    async function addFormAsPdf(request, formDetails) {
        // 
        let workflowActivityID = Number(request.workflow_activity_id) || 0,
            workflowActivityTypeID = 0;
        try {
            const workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
            if (Number(workflowActivityData.length) > 0) {
                workflowActivityTypeID = Number(workflowActivityData[0].activity_type_id);
            }
        } catch (error) {
            throw new Error("addFormAsPdf | No Workflow Data Found in DB");
        }

        if (workflowActivityID === 0 || workflowActivityTypeID === 0) {
            throw new Error("addFormAsPdf | Couldn't Fetch workflowActivityID or workflowActivityTypeID");
        }

        let attachmentsList = [];
        // 
        for (const formDetail of formDetails) {
            const formID = Number(formDetail.form_id);
            let formTransactionID = 0,
                formActivityID = 0;

            const formTimelineData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, workflowActivityID, formID);

            let formInlineData = [], formEntries = [];
            if (Number(formTimelineData.length) > 0) {
                formTransactionID = Number(formTimelineData[0].data_form_transaction_id);
                formActivityID = Number(formTimelineData[0].data_activity_id);

                formInlineData = JSON.parse(formTimelineData[0].data_entity_inline);

                if (Array.isArray(formInlineData.form_submitted) === true || typeof formInlineData.form_submitted === 'object') {
                    formEntries = formInlineData.form_submitted;

                } else {
                    formEntries = JSON.parse(formInlineData.form_submitted);

                }
            }

            if (
                Number(formEntries.length) > 0
            ) {
                const htmlTemplate = await getHTMLTemplateForFormData(request, formEntries);

                // Generate PDF readable stream
                const readableStream = await generatePDFreadableStream(request, htmlTemplate);
                const bucketName = await util.getS3BucketName();
                const prefixPath = await util.getS3PrefixPath(request);
                console.log("bucketName: ", bucketName);
                console.log("prefixPath: ", prefixPath);

                const uploadDetails = await util.uploadReadableStreamToS3(request, {
                    Bucket: bucketName || "demotelcoinc",
                    Key: `${prefixPath}/${formActivityID}` + '_form_data.pdf',
                    Body: readableStream,
                    ContentType: 'application/pdf',
                    // ACL: 'public-read'
                }, readableStream);

                attachmentsList.push(uploadDetails.Location);

            } else {
                continue;
            }

        }
        // 
        console.log("attachmentsList: ", attachmentsList);

        let addCommentRequest = Object.assign(request, {});

        addCommentRequest.asset_id = 100;
        addCommentRequest.device_os_id = 7;
        addCommentRequest.activity_type_category_id = 48;
        addCommentRequest.activity_type_id = workflowActivityTypeID;
        addCommentRequest.activity_id = workflowActivityID;
        addCommentRequest.activity_timeline_collection = JSON.stringify({
            "content": `Tony has added attachment(s).`,
            "subject": `Tony has added attachment(s).`,
            "mail_body": `Tony has added attachment(s).`,
            "attachments": attachmentsList
        });
        addCommentRequest.activity_stream_type_id = 325;
        addCommentRequest.timeline_stream_type_id = 325;
        addCommentRequest.activity_timeline_text = "";
        addCommentRequest.activity_access_role_id = 27;
        // addCommentRequest.data_entity_inline
        addCommentRequest.operating_asset_first_name = "TONY"
        addCommentRequest.datetime_log = util.getCurrentUTCTime();
        addCommentRequest.track_gps_datetime = util.getCurrentUTCTime();
        addCommentRequest.flag_timeline_entry = 1;
        addCommentRequest.log_asset_id = 100;

        const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
        try {
            await addTimelineTransactionAsync(addCommentRequest);
        } catch (error) {
            console.log("addFormAsPdf | addCommentRequest | addTimelineTransactionAsync | Error: ", error);
            throw new Error(error);
        }
        return;
    }

    async function getHTMLTemplateForFormData(request, formEntries) {

        let formDataHTML = '';

        for (const formEntry of formEntries) {
            console.log(`addFormAsPdf | getHTMLTemplateForFormData | Field Name: ${formEntry.field_name} | Field Value: ${formEntry.field_value}`);
            
            formDataHTML += `
            <tr>
                <td>${formEntry.field_name}</td>
                <td>${formEntry.field_value}</td>
            </tr>
            `;
        }

        let htmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Form Data</title>
        </head>
        <body>
            <table>
                ${formDataHTML}
            </table>
        </body>
        </html>
        `;
        return htmlTemplate;
    }

    async function addComment(request, comments) {
        let workflowActivityID = Number(request.workflow_activity_id) || 0,
            workflowActivityTypeID = 0,
            //activityInlineData = {},
            fridExpiryDate,
            fridNotExists = true;

        let reqActivityInlineData;
        if (!request.hasOwnProperty('activity_inline_data')) {
            // Usually mobile apps send only activity_timeline_collection parameter in
            // the "/activity/timeline/entry/add" call
            const activityTimelineCollection = JSON.parse(request.activity_timeline_collection);
            reqActivityInlineData = activityTimelineCollection.form_submitted;
            if (
                Number(request.device_os_id) === 1 &&
                typeof activityTimelineCollection.form_submitted === "string"
            ) {
                reqActivityInlineData = JSON.parse(activityTimelineCollection.form_submitted);
            }
        } else {
            reqActivityInlineData = JSON.parse(request.activity_inline_data);
        }

        //let reqActivityInlineData = JSON.parse(request.activity_inline_data);
        for(let i=0; i<reqActivityInlineData.length; i++){
            if(Number(reqActivityInlineData[i].field_id) === Number(request.trigger_field_id)) {
                let fieldValue = reqActivityInlineData[i].field_value;

                console.log('typeof field_value: ', typeof fieldValue);
                console.log('field_value: ', fieldValue);
                
                if(fieldValue === undefined || fieldValue === null || fieldValue === "") {
                    //fridNotExists = false;
                    return;
                }

                console.log('Number(request.device_os_id): ', Number(request.device_os_id));
                if(Number(request.device_os_id) === 2) { //IOS
                    fridExpiryDate = util.addDaysToGivenDate((reqActivityInlineData[i].field_value).toString(), 60, "DD MMM YYYY"); //Add 60 days to it    
                } else if(Number(request.device_os_id) === 1) { //Android
                    //fridExpiryDate = util.addDaysToGivenDate((reqActivityInlineData[i].field_value).toString(), 60, "DD-MM-YYYY"); //Add 60 days to it    
                    fridExpiryDate = util.addDaysToGivenDate((reqActivityInlineData[i].field_value).toString(), 60, "YYYY-MM-DD"); //Add 60 days to it
                } else {
                    fridExpiryDate = util.addDaysToGivenDate((reqActivityInlineData[i].field_value).toString(), 60); //Add 60 days to it    
                }
                break;
            }
        }

        try {
            const workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
            if (Number(workflowActivityData.length) > 0) {                
                /*activityInlineData = JSON.parse(workflowActivityData[0].activity_inline_data)
                console.log('Number(request.trigger_field_id) : ', Number(request.trigger_field_id));

                for(let i=0; i<activityInlineData.length; i++){
                    if(Number(activityInlineData[i].field_id) === Number(request.trigger_field_id)) {
                        console.log('field_value: ', activityInlineData[i].field_value);
                        fridExpiryDate = util.addDaysToGivenDate((activityInlineData[i].field_value).toString(), 60); //Add 60 days to it
                        break;
                    }
                }*/
                workflowActivityTypeID = Number(workflowActivityData[0].activity_type_id);
            }
        } catch (error) {
            throw new Error("No Workflow Data Found in DB");
        }

        if (workflowActivityID === 0 || workflowActivityTypeID === 0) {
            throw new Error("Couldn't Fetch workflowActivityID or workflowActivityTypeID");
        }

        let attachments = [];
        for (const comment of comments) {
            let addCommentRequest = Object.assign(request, {});       

        
            if(comment.comment === "<<vf_frid_expire>>" && fridNotExists) {
                //let fridExpiryDateArr = fridExpiryDate.split("-");
                //let currentDateArr = ((util.getCurrentDate()).toString()).split("-");
                let currentDateArr = (util.getCurrentDate()).toString();

                console.log('fridExpiryDate : ', fridExpiryDate);
                console.log('currentDateArr : ', currentDateArr);
                
                let a = moment(fridExpiryDate, "YYYY-MM-DD");
                let b = moment(currentDateArr, "YYYY-MM-DD");
                
                let difference = a.diff(b, 'days');
                console.log('Difference : ', difference);
                
                fridExpiryDate = util.formatDate(fridExpiryDate, "DD MMM YYYY");
                if(Math.sign(difference) === 1) { //Positive
                    comment.comment = `This Order's FRID is going to expire on ${fridExpiryDate} (in ${difference} Days).`;
                } else {
                    comment.comment = `This Order's FRID is expired on ${fridExpiryDate}, please raise a new FRID for this Order.`;
                }
            }

            if(comment.comment.includes("<<asset_id>>"))
            {
                comment.comment = comment.comment.replace("<<asset_id>>",request.asset_id);
            }
            
            if(comment.comment.includes("<<activity_id>>"))
            {
                comment.comment = comment.comment.replace("<<activity_id>>",workflowActivityID);
            }

            if(comment.comment.includes("<<contract>>"))
            {
                comment.comment = "Contract Template";
                attachments = ["https://worlddesk-staging-2020-10.s3.amazonaws.com/868/1102/5918/34810/2020/10/103/1603209047434/MASTER-SUBSCRIPTION-AGREEMENT.docx"];
            }

            console.log("comment ---------------------");
            console.log(comment.comment);

            addCommentRequest.asset_id = 100;
            addCommentRequest.device_os_id = 7;
            addCommentRequest.activity_type_category_id = 48;
            addCommentRequest.activity_type_id = workflowActivityTypeID;
            addCommentRequest.activity_id = workflowActivityID;
            addCommentRequest.activity_timeline_collection = JSON.stringify({
                "content": `${comment.comment}`,
                "subject": `${comment.comment}`,
                "mail_body": `${comment.comment}`,
                "attachments": attachments
            });
            addCommentRequest.activity_stream_type_id = 325;
            addCommentRequest.timeline_stream_type_id = 325;
            addCommentRequest.activity_timeline_text = "";
            addCommentRequest.activity_access_role_id = 27;
            // addCommentRequest.data_entity_inline
            addCommentRequest.operating_asset_first_name = "TONY"
            addCommentRequest.datetime_log = util.getCurrentUTCTime();
            addCommentRequest.flag_timeline_entry = 1;
            addCommentRequest.log_asset_id = 100;

            // Send push notification to mobile devices for live loading of the updates 
            addCommentRequest.activity_stream_type_id = 325;
            addCommentRequest.bot_operation_type = 'add_comment';
            addCommentRequest.push_message = `${comment.comment}`;

            //const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
            try {
                //await addTimelineTransactionAsync(addCommentRequest);
                await activityTimelineService.addTimelineTransactionAsync(addCommentRequest);
            } catch (error) {
                console.log("addComment | addCommentRequest | addTimelineTransactionAsync | Error: ", error);
                throw new Error(error);
            }
        }
        return;
    }

    async function addAttachment(request, attachments) {

        await sleep(2000);

        let workflowActivityID = Number(request.workflow_activity_id) || 0,
            workflowActivityTypeID = 0,
            attachmentsList = [];

        try {
            const workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
            if (Number(workflowActivityData.length) > 0) {
                workflowActivityTypeID = Number(workflowActivityData[0].activity_type_id);
            }
        } catch (error) {
            throw new Error("No Workflow Data Found in DB");
        }

        if (workflowActivityID === 0 || workflowActivityTypeID === 0) {
            throw new Error("Couldn't Fetch workflowActivityID or workflowActivityTypeID");
        }

        for (const attachment of attachments) {
            const targetFormID = Number(attachment.form_id);
            const targetFieldID = Number(attachment.field_id);

            const targetFormTransactionData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, workflowActivityID, targetFormID);

            if (Number(targetFormTransactionData.length) > 0) {
                targetFormTransactionID = Number(targetFormTransactionData[0].data_form_transaction_id);
                targetFormActivityID = Number(targetFormTransactionData[0].data_activity_id);
            }

            if (
                targetFormTransactionID > 0 &&
                targetFormActivityID > 0
            ) {
                const targetFieldData = await getFieldValue({
                    form_transaction_id: targetFormTransactionID,
                    form_id: targetFormID,
                    field_id: targetFieldID,
                    organization_id: request.organization_id
                });

                // console.log("targetFieldData: ", targetFieldData);
                console.log("targetFieldData[0].data_entity_text_1: ", targetFieldData[0].data_entity_text_1);
                if (
                    Number(targetFieldData.length) > 0 &&
                    targetFieldData[0].data_entity_text_1 !== ''
                ) {
                    attachmentsList.push(targetFieldData[0].data_entity_text_1);
                }
            }

        }
        console.log("attachmentsList: ", attachmentsList);
        // Do not do anything if no attachments are to be added
        if (
            Number(attachmentsList.length) === 0
        ) {
            return;
        }

        let addCommentRequest = Object.assign(request, {});

        addCommentRequest.asset_id = 100;
        addCommentRequest.device_os_id = 7;
        addCommentRequest.activity_type_category_id = 48;
        addCommentRequest.activity_type_id
        addCommentRequest.activity_id
        addCommentRequest.activity_timeline_collection = JSON.stringify({
            "content": `Tony has added attachment(s).`,
            "subject": `Tony has added attachment(s).`,
            "mail_body": `Tony has added attachment(s).`,
            "attachments": attachmentsList
        });
        addCommentRequest.activity_stream_type_id = 325;
        addCommentRequest.timeline_stream_type_id = 325;
        addCommentRequest.activity_timeline_text = "";
        addCommentRequest.activity_access_role_id = 27;
        // addCommentRequest.data_entity_inline
        addCommentRequest.operating_asset_first_name = "TONY"
        addCommentRequest.datetime_log = util.getCurrentUTCTime();
        addCommentRequest.track_gps_datetime = util.getCurrentUTCTime();
        addCommentRequest.flag_timeline_entry = 1;
        addCommentRequest.log_asset_id = 100;

        const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
        try {
            await addTimelineTransactionAsync(addCommentRequest);
        } catch (error) {
            console.log("addComment | addCommentRequest | addTimelineTransactionAsync | Error: ", error);
            throw new Error(error);
        }
        return;
    }

    async function addAttachmentWithAttestation(request, attachments) {

        await sleep(2000);

        let workflowActivityID = Number(request.workflow_activity_id) || 0,
            workflowActivityTypeID = 0,
            attachmentsList = [];

        try {
            const workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
            if (Number(workflowActivityData.length) > 0) {
                workflowActivityTypeID = Number(workflowActivityData[0].activity_type_id);
            }
        } catch (error) {
            throw new Error("No Workflow Data Found in DB");
        }

        if (workflowActivityID === 0 || workflowActivityTypeID === 0) {
            throw new Error("Couldn't Fetch workflowActivityID or workflowActivityTypeID");
        }

        let documentData = {},
            documentFieldUpdateInlineData = [],
            flagAddAttestedDocumentToTimeline = 0,
            flagAttestationIsText = 0;
        for (const attachment of attachments) {

            // If the bot operation inline data doesn't have the key "attestation",
            // redirect bot operation to just add the attachment without any attestation
            if (
                !attachment.document.hasOwnProperty("attestation")
            ) {

                await addAttachment(request, [attachment.document]);
                continue;
            }
            
            flagAddAttestedDocumentToTimeline = Number(attachment.flag_add_attested_document_to_timeline);
            flagAttestationIsText = Number(attachment.flag_attestation_is_text);

            const documentFormID = Number(attachment.document.form_id);
            const documentFieldID = Number(attachment.document.field_id);
            documentData.documentFormID = documentFormID;
            documentData.documentFieldID = documentFieldID;

            let documentFormTransactionID = 0,
                documentFormActivityID = 0;
            
            const attestationFormID = Number(attachment.document.attestation.form_id);
            const attestationFieldID = Number(attachment.document.attestation.field_id);
            let attestationFormTransactionID = 0,
                attestationFormActivityID = 0;

            // Fetch the document's URL
            const documentFormData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, workflowActivityID, documentFormID);

            if (Number(documentFormData.length) > 0) {
                documentFormTransactionID = Number(documentFormData[0].data_form_transaction_id);
                documentFormActivityID = Number(documentFormData[0].data_activity_id);

                documentData.documentFormTransactionID = documentFormTransactionID;
                documentData.documentFormActivityID = documentFormActivityID;
            }
            // Fetch the attestation's URL
            const attestationFormData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, workflowActivityID, attestationFormID);

            if (Number(attestationFormData.length) > 0) {
                attestationFormTransactionID = Number(attestationFormData[0].data_form_transaction_id);
                attestationFormActivityID = Number(attestationFormData[0].data_activity_id);
            }

            if (
                documentFormTransactionID > 0 &&
                documentFormActivityID > 0 &&
                attestationFormTransactionID > 0 &&
                attestationFormActivityID > 0
            ) {
                // Fetch the Document URL
                const documentFieldData = await getFieldValue({
                    form_transaction_id: documentFormTransactionID,
                    form_id: documentFormID,
                    field_id: documentFieldID,
                    organization_id: request.organization_id
                });
                // console.log("documentFieldData: ", documentFieldData);
                console.log("documentFieldData[0].data_entity_text_1: ", documentFieldData[0].data_entity_text_1);
                
                // Fetch the Attestation URL
                const attestationFieldData = await getFieldValue({
                    form_transaction_id: attestationFormTransactionID,
                    form_id: attestationFormID,
                    field_id: attestationFieldID,
                    organization_id: request.organization_id
                });

                // console.log("attestationFieldData: ", attestationFieldData);
                console.log("attestationFieldData[0].data_entity_text_1: ", attestationFieldData[0].data_entity_text_1);

                if (
                    Number(documentFieldData.length) > 0 &&
                    documentFieldData[0].data_entity_text_1 !== '' &&

                    Number(attestationFieldData.length) > 0 &&
                    attestationFieldData[0].data_entity_text_1 !== ''
                ) {
                    // Document
                    let documentName = await util.downloadS3Object(request, documentFieldData[0].data_entity_text_1);
                    const documentPath = path.resolve(global.config.efsPath, documentName);
                    logger.silly(`documentPath: ${documentPath}`, { type: 'document_with_attestation' });
                    
                    // Signature
                    let attestationName = "",
                        attestationPath = "",
                        attestationText = "";
                    if (flagAttestationIsText) {
                        attestationText = attestationFieldData[0].data_entity_text_1;
                        let signatureWords = attestationText.split(" ");
                        if (signatureWords.length < 2) {
                            attestationText = `${signatureWords[0].toUpperCase()[0]}.`;
                        } else {
                            attestationText = `${signatureWords[0].toUpperCase()[0]}. ${signatureWords[1]}`;
                        }
                    } else {
                        attestationName = await util.downloadS3Object(request, attestationFieldData[0].data_entity_text_1);
                        attestationPath = path.resolve(global.config.efsPath, attestationName);
                        logger.silly(`attestationPath: ${attestationPath}`, { type: 'document_with_attestation' });
                    }
                    
                    // Document With Attestation/Signature
                    const documentWithAttestationPath = `${documentPath.split('.')[0]}_with_attestation.pdf`
                    logger.silly(`documentWithAttestationPath: ${documentWithAttestationPath}`, { type: 'document_with_attestation' });

                    await sleep(4000);
                    const pdfDoc = new HummusRecipe(
                        documentPath,
                        documentWithAttestationPath,
                        {
                            fontSrcPath: `${__dirname}/../../../fonts`
                        }
                    );
                    for (let i = 1; i <= pdfDoc.metadata.pages; i++) {
                        if (flagAttestationIsText) {
                            pdfDoc
                                .editPage(i)
                                .text(attestationText, 400, 790, {
                                    color: '#000000',
                                    fontSize: 25,
                                    // bold: true,
                                    // underline: true,
                                    // font: 'Audhistine',
                                    font: 'HerrVonMuellerhoff',
                                    opacity: 0.8,
                                    rotation: 325,
                                    textBox: {
                                        width: 250,
                                        height: 40,
                                        wrap: 'trim',
                                        style: {
                                            lineWidth: 0,
                                            fill: "#FFFFFF",
                                            opacity: 1,
                                        }
                                    }
                                })
                                .endPage();
                            // .endPDF();
                        } else {
                            pdfDoc
                                .editPage(i)
                                .image(attestationPath, 500, 640, { width: 100, keepAspectRatio: true })
                                .endPage();
                            // .endPDF();
                        }
                    }
                    pdfDoc.endPDF();
                    
                    // Upload to S3
                    const environment = global.mode;
                    let bucketName = '';
                    if (environment === 'prod') {
                        bucketName = "worlddesk-" + util.getCurrentYear() + '-' + util.getCurrentMonth();

                    } else if (environment === 'staging' || environment === 'local') {
                        bucketName = "worlddesk-staging-" + util.getCurrentYear() + '-' + util.getCurrentMonth();

                    } else {

                        bucketName = "worlddesk-" + environment + "-" + util.getCurrentYear() + '-' + util.getCurrentMonth();
                    }
                    let prefixPath = request.organization_id + '/' +
                        request.account_id + '/' +
                        request.workforce_id + '/' +
                        request.asset_id + '/' +
                        util.getCurrentYear() + '/' + util.getCurrentMonth() + '/103' + '/' + util.getMessageUniqueId(request.asset_id);

                    console.log("bucketName: ", bucketName);
                    console.log("prefixPath: ", prefixPath);

                    const uploadDetails = await util.uploadReadableStreamToS3(request, {
                        Bucket: bucketName || "demotelcoinc",
                        Key: `${prefixPath}/${request.activity_id}` + '_with_signature.pdf',
                        Body: fs.createReadStream(documentWithAttestationPath),
                        ContentType: 'application/pdf',
                        // ACL: 'public-read'
                    }, null);

                    attachmentsList.push(uploadDetails.Location);
                    documentFieldUpdateInlineData.push({
                        "data_type_combo_id": Number(documentFieldData[0].data_type_combo_id),
                        "data_type_combo_value": Number(documentFieldData[0].data_type_combo_value) || "",
                        "field_data_type_category_id": Number(documentFieldData[0].data_type_category_id),
                        "field_data_type_id": Number(documentFieldData[0].data_type_id),
                        "field_id": documentFieldID,
                        "field_name": String(documentFieldData[0].field_name),
                        "field_value": uploadDetails.Location,
                        "form_id": documentFormID,
                        "message_unique_id": 123123123123123123
                    });

                } else {
                    throw new Error("Couldn't Fetch document URL or attestation URL");
                }
            }

        }
        console.log("attachmentsList: ", attachmentsList);

        // Do not do anything if no attachments are to be added
        if (
            Number(attachmentsList.length) === 0
        ) {
            return;
        }

        // alterFormActivityFieldValues Update the document's field value to the attested one
        let fieldsAlterRequest = Object.assign({}, request);
        fieldsAlterRequest.form_transaction_id = documentData.documentFormTransactionID;
        fieldsAlterRequest.activity_form_id = documentData.documentFormID;
        fieldsAlterRequest.form_id = documentData.documentFormID;
        fieldsAlterRequest.field_id = documentData.documentFieldID;
        fieldsAlterRequest.activity_inline_data = JSON.stringify(documentFieldUpdateInlineData);
        fieldsAlterRequest.activity_id = documentData.documentFormActivityID;
        fieldsAlterRequest.workflow_activity_id = workflowActivityID;

        try {
            await alterFormActivityFieldValues(fieldsAlterRequest);
        } catch (error) {
            console.log("addAttachmentWithAttestation | alterFormActivityFieldValues | Error: ", error);
        }

        // Decide whether to add the attested document to timeline or not
        if (
            flagAddAttestedDocumentToTimeline === 0
        ) {
            return;
        }

        let addCommentRequest = Object.assign(request, {});

        addCommentRequest.asset_id = 100;
        addCommentRequest.device_os_id = 7;
        addCommentRequest.activity_type_category_id = 48;
        addCommentRequest.activity_type_id
        addCommentRequest.activity_id
        addCommentRequest.activity_timeline_collection = JSON.stringify({
            "content": `Tony has added attachment(s).`,
            "subject": `Tony has added attachment(s).`,
            "mail_body": `Tony has added attachment(s).`,
            "attachments": attachmentsList
        });
        addCommentRequest.activity_stream_type_id = 325;
        addCommentRequest.timeline_stream_type_id = 325;
        addCommentRequest.activity_timeline_text = "";
        addCommentRequest.activity_access_role_id = 27;
        // addCommentRequest.data_entity_inline
        addCommentRequest.operating_asset_first_name = "TONY"
        addCommentRequest.datetime_log = util.getCurrentUTCTime();
        addCommentRequest.track_gps_datetime = util.getCurrentUTCTime();
        addCommentRequest.flag_timeline_entry = 1;
        addCommentRequest.log_asset_id = 100;

        const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
        try {
            await addTimelineTransactionAsync(addCommentRequest);
        } catch (error) {
            console.log("addComment | addCommentRequest | addTimelineTransactionAsync | Error: ", error);
            throw new Error(error);
        }
        return;
    }

    async function generatePDFreadableStream(request, htmlTemplate, annexures = []) {
        const pdfOptions = {
            "height": "10.5in", // allowed units: mm, cm, in, px
            "width": "9in",
            "format": 'A4',
            "border": {
                "top": "0.5in", // default is 0, units: mm, cm, in, px
                // "right": "0.5in",
                "bottom": "0.5in",
                "left": "0.25in"
            }
        };
        return new Promise((resolve, reject) => {
            let filesToCleanup = new Set();

            if (annexures.length === 0) {
                pdf.create(htmlTemplate, pdfOptions).toStream(function (err, pdfStream) {
                    if (err) {
                        logger.error(`Error creating pdf from html template [no annexures]`, { type: 'generatePDFreadableStream', error: serializeError(error) });
                        reject(err)
                        return;
                    }
                    // console.log("pdfStream: ", pdfStream);
                    resolve(pdfStream)
                });
            } else {
                pdf.create(htmlTemplate, pdfOptions).toBuffer(function (err, pdfBuffer) {
                    if (err) {
                        logger.error(`Error creating pdf from html template [annexures]`, { type: 'generatePDFreadableStream', error: serializeError(error) });
                        reject(err)
                        return;
                    }

                    const finalOutputPDF = `${global.config.efsPath}/${request.activity_id}_${moment().utc().format('YYYY-MM-DD_HH-mm-ss')}.pdf`
                    const pdfDoc = new HummusRecipe(pdfBuffer, finalOutputPDF, {
                        // version: 1.6,
                        // author: 'John Doe',
                        // title: 'Hummus Recipe',
                        // subject: 'A brand new PDF'
                    });
    
                    for (const annexure of annexures) {
                        // 51 => PDF Documents
                        if (Number(annexure.data_type_id) === 51) {
                            console.log(`${annexure.data_type_id} annexure: `, annexure)
                            pdfDoc
                                .appendPage(`${annexure.filepath}`)
                                .endPage();
                        }
                        // Images:
                        // 24 => Gallery Image
                        // 25 => Camera Image
                        if (
                            Number(annexure.data_type_id) === 24 ||
                            Number(annexure.data_type_id) === 25
                        ) {
                            // Create a temporary empty PDF document
                            const tempBlankPDFDocumentPath = `${global.config.efsPath}/${request.workflow_activity_id}_blank_pdf_document.pdf`;
                            const tempBlankPDFDocument = new HummusRecipe('new', tempBlankPDFDocumentPath);
                            tempBlankPDFDocument
                                .createPage('A4')
                                .image(`${annexure.filepath}`, 20, 100, { width: 400, keepAspectRatio: true })
                                .endPage()
                                .endPDF();

                            filesToCleanup.add(tempBlankPDFDocumentPath)
                            pdfDoc
                                .appendPage(tempBlankPDFDocumentPath)
                                .endPage();
                        }

                        filesToCleanup.add(annexure.filepath);
                    }
                    pdfDoc.endPDF();

                    // CleanUp!
                    for (const file of filesToCleanup.values()) {
                        fs.unlinkSync(file);
                    }

                    resolve(fs.createReadStream(finalOutputPDF));
                });
            }
        });
    }

    function getHTMLTemplateForAttestation(documentURL, attestationURL) {
        const template = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Customer PO</title>
        </head>
        <body>
            <div>
                <div style="margin-left: 150px;margin-right:150px;">
                    <img src=${documentURL} alt="" height="550" width="100%">
                </div>
                <div style="margin-left: 500px;">
                    <img src=${attestationURL} alt="" height="100" width="100">
                </div>
            </div>
        </body>
        </html>`;

        return template;
    }

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
    
    this.alterStatus = async (request) => {
        let inlineData = {};
        inlineData.activity_status_id = request.activity_status_id;
        inlineData.activity_status_type_id = request.activity_status_type_id;
        inlineData.activity_status_name = request.activity_status_name;
        inlineData.activity_status_type_name = request.activity_status_type_name;

        await changeStatus(request, inlineData);
        return [false, {}]
    }
    
    // Bot Step to change the status
    async function changeStatus(request, inlineData = {}) {
        const workflowActivityID = request.workflow_activity_id;

        // Status alter or substatus completion bot incorporating arithmetic condition
        if (
            // Check if the new condition array exists
            inlineData.hasOwnProperty("condition") &&
            Array.isArray(inlineData.condition) &&
            inlineData.condition.length > 0 &&
            // Check if the pass and fail status objects exist
            inlineData.hasOwnProperty("pass") &&
            inlineData.hasOwnProperty("fail")
        ) {
            let conditionChain = [];
            for (const condition of inlineData.condition) {
                const formID = Number(condition.form_id),
                    fieldID = Number(condition.field_id);

                let formTransactionID = 0,
                    formActivityID = 0;

                const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, workflowActivityID, condition.form_id);

                if (Number(formData.length) > 0) {
                    formTransactionID = Number(formData[0].data_form_transaction_id);
                    formActivityID = Number(formData[0].data_activity_id);
                }
                if (
                    Number(formTransactionID) > 0 // &&
                    // Number(formActivityID) > 0
                ) {
                    // Fetch the field value
                    const fieldData = await getFieldValue({
                        form_transaction_id: formTransactionID,
                        form_id: formID,
                        field_id: fieldID,
                        organization_id: request.organization_id
                    });
                    const fieldDataTypeID = Number(fieldData[0].data_type_id) || 0;
                    const fieldValue = fieldData[0][getFielDataValueColumnName(fieldDataTypeID)] || 0;

                    conditionChain.push({
                        value: await checkForThresholdCondition(fieldValue, condition.threshold, condition.operation),
                        join_condition: condition.join_condition
                    });

                } else {
                    conditionChain.push({
                        value: false,
                        join_condition: condition.join_condition
                    });
                }
            }

            logger.silly("conditionChain: %j", conditionChain);
            
            // Process the condition chain
            const conditionReducer = (accumulator, currentValue) => {
                let value = 0;
                logger.silly(`accumulator: ${JSON.stringify(accumulator)} | currentValue: ${JSON.stringify(currentValue)}`);
                // AND
                if (accumulator.join_condition === "AND") {
                    value = accumulator.value && currentValue.value;
                }
                // OR
                if (accumulator.join_condition === "OR") {
                    value = accumulator.value || currentValue.value;
                }
                // EOJ
                // Not needed
                return {
                    value,
                    join_condition: currentValue.join_condition
                }
            };

            const finalCondition = conditionChain.reduce(conditionReducer);
            logger.silly("finalCondition: %j", finalCondition);

            // Select the status based on the condition arrived
            if (finalCondition.value) {
                inlineData.activity_status_id = inlineData.pass.activity_status_id;
                inlineData.flag_trigger_resource_manager = inlineData.pass.flag_trigger_resource_manager;

            } else if (!finalCondition.value) {
                inlineData.activity_status_id = inlineData.fail.activity_status_id;
                inlineData.flag_trigger_resource_manager = inlineData.fail.flag_trigger_resource_manager;

            } else {
                logger.error("Error processing the condition chain", { type: 'bot_engine', request_body: request, condition_chain: conditionChain, final_condition: finalCondition });
                return [true, "Error processing the condition chain"];
            }
        }

        let newReq = Object.assign({}, request);
        logger.silly("inlineData: %j", inlineData);
        newReq.activity_id = request.workflow_activity_id;
        newReq.activity_status_id = inlineData.activity_status_id;
        //newRequest.activity_status_type_id = inlineData.activity_status_id; 
        //newRequest.activity_status_type_category_id = ""; 
        newReq.activity_type_category_id = 48;
        newReq.device_os_id = 9;
        newReq.log_asset_id = 100; // Tony
        newReq.asset_id = 100; // Tony
        newReq.message_unique_id = util.getMessageUniqueId((Number(request.asset_id)) || newReq.asset_id);

        // Trigger flag for resource manager
        if (inlineData.hasOwnProperty("flag_trigger_resource_manager")) {
            newReq.flag_trigger_resource_manager = Number(inlineData.flag_trigger_resource_manager);
        } else {
            newReq.flag_trigger_resource_manager = 0;
        }

        // Flag to persist role on the activity type (workflow type)
        if (inlineData.hasOwnProperty("activity_type_flag_persist_role")) {
            newReq.activity_type_flag_persist_role = Number(inlineData.activity_type_flag_persist_role);
        } else {
            newReq.activity_type_flag_persist_role = 0;
        }

        // Flag to round robin on the activity type (workflow type)
        if (inlineData.hasOwnProperty("activity_type_flag_round_robin")) {
            newReq.activity_type_flag_round_robin = Number(inlineData.activity_type_flag_round_robin);
        } else {
            newReq.activity_type_flag_round_robin = 0;
        }        

        const statusName = await getStatusName(newReq, inlineData.activity_status_id);
        if (Number(statusName.length) > 0) {
            newReq.activity_timeline_collection = JSON.stringify({
                "activity_reference": [{
                    "activity_id": newReq.activity_id,
                    "activity_title": ""
                }],
                "asset_reference": [{}],
                "attachments": [],
                "content": `Status updated to '${statusName[0].activity_status_name || ""}'`,
                "mail_body": `Status updated to '${statusName[0].activity_status_name || ""}'`,
                "subject": `Status updated to '${statusName[0].activity_status_name || ""}'`
            });

            newReq.activity_status_type_id = statusName[0].activity_status_type_id;

            // Send push notification to mobile devices for live loading of the updates 
            newReq.activity_stream_type_id = 704;
            newReq.bot_operation_type = 'status_alter';
            newReq.push_message = `Status updated to ${statusName[0].activity_status_name || ""}`;
        }

        //console.log('statusName newReq ########################## : ', statusName);
        try {
            await new Promise((resolve, reject) => {
                activityService.alterActivityStatus(newReq, (err, resp) => {
                    (err === false) ? resolve() : reject(err);
                });
            });

            await activityService.updateWorkflowQueueMapping(newReq);
        } catch (err) {
            logger.error("Error updating the workflow's queue mapping", { type: 'bot_engine', error: err, request_body: request });
            return [true, "unknown Error"];
        }

        let resp = await getQueueActivity(newReq, request.workflow_activity_id);
        logger.silly("getQueueActivity | resp: %j", resp);

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
                        logger.error("changeStatus | getActivityDetailsPromise | error", { type: 'bot_engine', error: error, request_body: request });
                    });
            } catch (error) {
                logger.error("changeStatus | Activity Details Fetch Error | error", { type: 'bot_engine', error: error, request_body: request });
            }

            // let statusName = await getStatusName(newReq, inlineData.activity_status_id);
            logger.silly("Status Alter BOT Step - status Name: %j ", statusName, { type: 'bot_engine' });

            let queuesData = await getAllQueuesBasedOnActId(newReq, request.workflow_activity_id);

            logger.silly("queues Data: %j ", queuesData, { type: 'bot_engine' });

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
                logger.silly("Status Alter BOT Step - Updating the Queue Json: %j ", data, { type: 'bot_engine' });

                activityCommonService.queueHistoryInsert(newReq, 1402, i.queue_activity_mapping_id).then(() => { });
            }

            //Listeners
            //For Workflow reference, combo field widgets
            //flag = 1 - Insert into activity entity Mapping Table
            //flag = 2 - Insert into activity form field Mapping Table
            if(Number(request.activity_type_id) > 0) {
                updateStatusInIntTablesReferenceDtypes(request, inlineData);
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
            logger.error("No workflow to queue mappings found", { type: 'bot_engine', request_body: request });
            return [true, "Resp is Empty"];
        }
    }

    this.copyFieldBot = async (request) => {
        try {
            // global.logger.write('conLog', 'Request Params received by BOT ENGINE', request, {});
            console.log('form_field_copy | Request Params received by BOT ENGINE', request);
            await copyFields(request, JSON.parse(request.form_field_copy));
        } catch (err) {
         console.log('ERR : ', err);
        }
    }
    
    //Bot Step Copying the fields
    async function copyFields(request, fieldCopyInlineData, condition = {}) {

        //enable_target_form_submission = 1 then submit the target form
        //enable_target_form_submission = 0 then do not submit the target form
        let shouldSubmitTargetForm;
        (condition.hasOwnProperty('enable_target_form_submission')) ?
            shouldSubmitTargetForm = Number(condition.enable_target_form_submission):
            shouldSubmitTargetForm = 0;

        const workflowActivityID = Number(request.workflow_activity_id),
            // sourceFormActivityID = Number(request.activity_id),
            // sourceFormID = Number(request.form_id),
            targetFormID = Number(fieldCopyInlineData[0].target_form_id);
        
        let sourceFormActivityTypeID = Number(request.activity_type_id);

        //ESMS Requirement - Check If target_form_id is an origin form
        //////////////////////////////////////////////////////////////
        let esmsFlag = 0,
            esmsOriginFlag = 0;

        let esmsReq = Object.assign({}, request);
            esmsReq.form_id = targetFormID;            
        const [formConfigError, formConfigData] = await activityCommonService.workforceFormMappingSelect(esmsReq);
        if (formConfigError !== false || formConfigData.length === 0) {
            return [true, {
                message: `Couldn't fetch form data for form ${esmsReq.form_id}.`
            }];
        }        

        if (Number(formConfigData.length) > 0) {
            //console.log('############################################################');
            //console.log('ESMS - Target Form Data - formConfigData : ', formConfigData);
            //console.log('############################################################');

            let originFlagSet = Number(formConfigData[0].form_flag_workflow_origin),
                isWorkflowEnabled = Number(formConfigData[0].form_flag_workflow_enabled);
                workflowActivityTypeId = Number(formConfigData[0].form_workflow_activity_type_id),
                //formWorkflowActivityTypeCategoryID = Number(formConfigData[0].form_workflow_activity_type_category_id) || 48,
                //workflowActivityTypeName = formConfigData[0].form_workflow_activity_type_name,
                //formName = String(formConfigData[0].form_name),
                //workflowActivityTypeDefaultDurationDays = Number(formConfigData[0].form_workflow_activity_type_default_duration_days);
        
            console.log('##################################');
            console.log('originFlagSet : ', originFlagSet);
            console.log('isWorkflowEnabled : ', isWorkflowEnabled);
            console.log('sourceFormActivityTypeID : ', sourceFormActivityTypeID);
            console.log('workflowActivityTypeId : ', workflowActivityTypeId);            

            if(sourceFormActivityTypeID !== workflowActivityTypeId){
                console.log('Target Form Process is different from the Source form');
                console.log('##################################');

                esmsFlag = 1;
                if(originFlagSet && isWorkflowEnabled) {
                    esmsOriginFlag = 1; //This is an origin form in another process
                    await sleep(4000);
                }
            }            
        }
        ///////////////////////////////////////////////////// - ESMS  

        let targetFormTransactionData = [],
            targetFormActivityID = 0,
            targetFormTransactionID = 0;

        // Check if the target form already exists for the given workflow
        //if(Number(esmsFlag) === 0) {
            try {
                targetFormTransactionData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, workflowActivityID, targetFormID);
    
                if (Number(targetFormTransactionData.length) > 0) {                    
                    targetFormTransactionID = targetFormTransactionData[0].data_form_transaction_id;
                    targetFormActivityID = targetFormTransactionData[0].data_activity_id;

                    if(Number(esmsFlag) === 1) {
                        console.log('Target Form Submitted!');
                        console.log(targetFormTransactionID);
                        console.log(targetFormActivityID);
                    }
                } else {
                    if(Number(esmsFlag) === 1) {
                        console.log('Target Form Not Submitted!');
                    }
                }
            } catch (error) {
                console.log("copyFields | Fetch Target Form Transaction Data | Error: ", error);
                throw new Error(error);
            }
        //}

        let activityInlineData = [],
            activityInlineDataMap = new Map(),
            REQUEST_FIELD_ID = 0;

        console.log('fieldCopyInlineData.length : ', fieldCopyInlineData.length);
        for (const batch of fieldCopyInlineData) {
            let sourceFormID = Number(batch.source_form_id),
                sourceFormTransactionData = [],
                sourceFormActivityID = 0,
                sourceFormTransactionID = 0;
                
            // Fetch Source Form Transaction Data
            try {
                sourceFormTransactionData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, workflowActivityID, sourceFormID);
    
                if (Number(sourceFormTransactionData.length) > 0) {                    
                    //sourceFormActivityTypeID = Number(sourceFormTransactionData[0].activity_type_id);
                    sourceFormTransactionID = Number(sourceFormTransactionData[0].data_form_transaction_id);
                    sourceFormActivityID = Number(sourceFormTransactionData[0].data_activity_id);
                }
            } catch (error) {
                console.log("copyFields | Fetch Source Form Transaction Data | Error: ", error);
                throw new Error(error);
            }
            if (
                sourceFormTransactionID === 0
            ) {
                continue;
            }
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

            try {
                console.log('sourceFieldData[0] : ', sourceFieldData[0]);
                const sourceFieldDataTypeID = Number(sourceFieldData[0].data_type_id);            
                console.log('sourceFieldDataTypeID : ', sourceFieldDataTypeID);
                console.log('getFielDataValueColumnName(sourceFieldDataTypeID) : ', getFielDataValueColumnNameNew(sourceFieldDataTypeID));
                const sourceFieldValue = sourceFieldData[0][getFielDataValueColumnNameNew(sourceFieldDataTypeID)];
                
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
            } catch(err) {
                console.log(`Error in processing the form_id - ${sourceFormID} and field_id -  ${sourceFieldID}`);
            }
        } //For loop Finished

        activityInlineData = [...activityInlineDataMap.values()];
        console.log("copyFields | activityInlineData: ", activityInlineData);
        request.activity_title = activityInlineData[0].field_value;
        
        console.log("targetFormTransactionID: ", targetFormTransactionID);
        console.log("targetFormActivityID: ", targetFormActivityID);

        if (targetFormTransactionID !== 0) {
            let fieldsAlterRequest = Object.assign({}, request);
                fieldsAlterRequest.form_transaction_id = targetFormTransactionID;
                fieldsAlterRequest.form_id = targetFormID;
                fieldsAlterRequest.activity_form_id = targetFormID;
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
            // If the target form has not been submitted yet, DO NOT DO ANYTHING
            console.log('shouldSubmitTargetForm : ', shouldSubmitTargetForm);
            if(shouldSubmitTargetForm === 1) {
                // If the target form has not been submitted yet, create one
                //console.log('Request.activity_title : ', request);
                let createTargetFormRequest = Object.assign({}, request);
                    createTargetFormRequest.activity_form_id = targetFormID;
                    createTargetFormRequest.form_id = targetFormID;
                    createTargetFormRequest.activity_inline_data = JSON.stringify(activityInlineData);

                if(Number(esmsFlag) === 0) {
                    createTargetFormRequest.workflow_activity_id = workflowActivityID;
                }
                
                if(Number(esmsFlag) === 1) {
                    //Internally in activityService File. Workflow will be created
                    createTargetFormRequest.isESMS = 1;
                    createTargetFormRequest.isEsmsOriginFlag = esmsOriginFlag;

                    //flag to know that this form and workflow is submitted by a Bot
                    createTargetFormRequest.activity_flag_created_by_bot = 1;
                }
                
                try {
                    await createTargetFormActivity(createTargetFormRequest);
                } catch (error) {
                    console.log("copyFields | createTargetFormActivity | Error: ", error);
                }
            }
            
        }
        return;
    }
    async function workFlowCopyFields(request, fieldCopyInlineData, condition = {}) {

        //enable_target_form_submission = 1 then submit the target form
        //enable_target_form_submission = 0 then do not submit the target form
        let shouldSubmitTargetForm;
        (condition.hasOwnProperty('enable_target_form_submission')) ?
            shouldSubmitTargetForm = Number(condition.enable_target_form_submission):
            shouldSubmitTargetForm = 0;

        const workflowActivityID = Number(request.workflow_activity_id),
            // sourceFormActivityID = Number(request.activity_id),
            // sourceFormID = Number(request.form_id),
            targetFormID = Number(fieldCopyInlineData[0].target_form_id);

        let sourceFormActivityTypeID = Number(condition.source_form_activity_type_id);

        //ESMS Requirement - Check If target_form_id is an origin form
        //////////////////////////////////////////////////////////////
        let esmsFlag = 0,
            esmsOriginFlag = 0;

        let esmsReq = Object.assign({}, request);
            esmsReq.form_id = targetFormID;
        const [formConfigError, formConfigData] = await activityCommonService.workforceFormMappingSelect(esmsReq);
        if (formConfigError !== false || formConfigData.length === 0) {
            return [true, {
                message: `Couldn't fetch form data for form ${esmsReq.form_id}.`
            }];
        }

        if (Number(formConfigData.length) > 0) {
            //console.log('############################################################');
            //console.log('ESMS - Target Form Data - formConfigData : ', formConfigData);
            //console.log('############################################################');

            let originFlagSet = Number(formConfigData[0].form_flag_workflow_origin),
                isWorkflowEnabled = Number(formConfigData[0].form_flag_workflow_enabled);
                workflowActivityTypeId = Number(formConfigData[0].form_workflow_activity_type_id),
                //formWorkflowActivityTypeCategoryID = Number(formConfigData[0].form_workflow_activity_type_category_id) || 48,
                //workflowActivityTypeName = formConfigData[0].form_workflow_activity_type_name,
                //formName = String(formConfigData[0].form_name),
                //workflowActivityTypeDefaultDurationDays = Number(formConfigData[0].form_workflow_activity_type_default_duration_days);

            console.log('##################################');
            console.log('originFlagSet : ', originFlagSet);
            console.log('isWorkflowEnabled : ', isWorkflowEnabled);
            console.log('sourceFormActivityTypeID : ', sourceFormActivityTypeID);
            console.log('workflowActivityTypeId : ', workflowActivityTypeId);

            if(sourceFormActivityTypeID !== workflowActivityTypeId){
                console.log('Target Form Process is different from the Source form');
                console.log('##################################');

                esmsFlag = 1;
                if(originFlagSet && isWorkflowEnabled) {
                    esmsOriginFlag = 1; //This is an origin form in another process
                    await sleep(4000);
                }
            }
        }
        ///////////////////////////////////////////////////// - ESMS

        let targetFormTransactionData = [],
            targetFormActivityID = 0,
            targetFormTransactionID = 0;

        // Check if the target form already exists for the given workflow
        //if(Number(esmsFlag) === 0) {
            try {
                targetFormTransactionData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, workflowActivityID, targetFormID);

                if (Number(targetFormTransactionData.length) > 0) {
                    targetFormTransactionID = targetFormTransactionData[0].data_form_transaction_id;
                    targetFormActivityID = targetFormTransactionData[0].data_activity_id;

                    if(Number(esmsFlag) === 1) {
                        console.log('Target Form Submitted!');
                        console.log(targetFormTransactionID);
                        console.log(targetFormActivityID);
                    }
                } else {
                    if(Number(esmsFlag) === 1) {
                        console.log('Target Form Not Submitted!');
                    }
                }
            } catch (error) {
                console.log("copyFields | Fetch Target Form Transaction Data | Error: ", error);
                throw new Error(error);
            }
        //}

        let activityInlineData = [],
            activityInlineDataMap = new Map(),
            REQUEST_FIELD_ID = 0;

        console.log('fieldCopyInlineData.length : ', fieldCopyInlineData.length);
        for (const batch of fieldCopyInlineData) {
            let sourceFormID = Number(batch.source_form_id),
                sourceFormTransactionData = [],
                sourceFormActivityID = 0,
                sourceFormTransactionID = 0;

            // Fetch Source Form Transaction Data
            try {
                sourceFormTransactionData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, workflowActivityID, sourceFormID);

                if (Number(sourceFormTransactionData.length) > 0) {
                    //sourceFormActivityTypeID = Number(sourceFormTransactionData[0].activity_type_id);
                    sourceFormTransactionID = Number(sourceFormTransactionData[0].data_form_transaction_id);
                    sourceFormActivityID = Number(sourceFormTransactionData[0].data_activity_id);
                }
            } catch (error) {
                console.log("copyFields | Fetch Source Form Transaction Data | Error: ", error);
                throw new Error(error);
            }
            if (
                sourceFormTransactionID === 0
            ) {
                continue;
            }
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

            try {
                console.log('sourceFieldData[0] : ', sourceFieldData[0]);
                const sourceFieldDataTypeID = Number(sourceFieldData[0].data_type_id);
                console.log('sourceFieldDataTypeID : ', sourceFieldDataTypeID);
                console.log('getFielDataValueColumnName(sourceFieldDataTypeID) : ', getFielDataValueColumnNameNew(sourceFieldDataTypeID));
                const sourceFieldValue = sourceFieldData[0][getFielDataValueColumnNameNew(sourceFieldDataTypeID)];

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
            } catch(err) {
                console.log(`Error in processing the form_id - ${sourceFormID} and field_id -  ${sourceFieldID}`);
            }
        } //For loop Finished

        activityInlineData = [...activityInlineDataMap.values()];
        console.log("copyFields | activityInlineData: ", activityInlineData);
        request.activity_title = activityInlineData[0].field_value;

        console.log("targetFormTransactionID: ", targetFormTransactionID);
        console.log("targetFormActivityID: ", targetFormActivityID);

        if (targetFormTransactionID !== 0) {
            let fieldsAlterRequest = Object.assign({}, request);
                fieldsAlterRequest.form_transaction_id = targetFormTransactionID;
                fieldsAlterRequest.form_id = targetFormID;
                fieldsAlterRequest.activity_form_id = targetFormID;
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
            // If the target form has not been submitted yet, DO NOT DO ANYTHING
            console.log('shouldSubmitTargetForm : ', shouldSubmitTargetForm);
            if(shouldSubmitTargetForm === 1) {
                // If the target form has not been submitted yet, create one
                //console.log('Request.activity_title : ', request);
                let createTargetFormRequest = Object.assign({}, request);
                    createTargetFormRequest.activity_form_id = targetFormID;
                    createTargetFormRequest.form_id = targetFormID;
                    createTargetFormRequest.activity_inline_data = JSON.stringify(activityInlineData);

                if(Number(esmsFlag) === 0) {
                    createTargetFormRequest.workflow_activity_id = workflowActivityID;
                }

                if(Number(esmsFlag) === 1) {
                    //Internally in activityService File. Workflow will be created
                    createTargetFormRequest.isESMS = 1;
                    createTargetFormRequest.isEsmsOriginFlag = esmsOriginFlag;

                    //flag to know that this form and workflow is submitted by a Bot
                    createTargetFormRequest.activity_flag_created_by_bot = 1;
                }

                try {
                    await createTargetFormActivity(createTargetFormRequest);
                } catch (error) {
                    console.log("copyFields | createTargetFormActivity | Error: ", error);
                }
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
        
        if(Number(createTargetFormRequest.isESMS) === 0) {
            createTargetFormRequest.activity_title = `${util.getCurrentUTCTime()} - ${targetFormName || ''}`;
        }            
        
        //createTargetFormRequest.activity_title = "This is Target Form submission from BOT";
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

        console.log('createTargetFormRequest.isESMS : ', createTargetFormRequest.isESMS);
        console.log('createTargetFormRequest.isEsmsOriginFlag : ', createTargetFormRequest.isEsmsOriginFlag);
        console.log('createTargetFormRequest.activity_flag_created_by_bot : ', createTargetFormRequest.activity_flag_created_by_bot);        

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
            workflowFile705Request.message_unique_id = util.getMessageUniqueId(Number(createTargetFormRequest.asset_id));
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

            await db.executeQueryPromise(1, queryString, request)
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
            case 57: // JSON
            case 59: // JSON
            case 64: //JSON                
            //case 71: //JSON
                return 'data_entity_inline';
            default: console.log('In default Case : getFielDataValueColumnName');
        }
    }

    function getFielDataValueColumnNameNew(fieldDataTypeID) {
        switch (fieldDataTypeID) {
            case 1: // Date
                return 'data_entity_datetime_2';
            case 71: 
            case 5: // Number
                return 'data_entity_bigint_1';
            case 6: // Decimal
                return 'data_entity_double_1';
            case 19: // Short Text
            case 21: // Label
            case 22: // Email ID
            case 27: // General Signature with asset reference
            case 33: // Single Selection List
            case 57: // workflow reference            
            case 59: // asset reference            
                return 'data_entity_text_1';
            case 20: // Long Text
                return 'data_entity_text_2';
            case 64: //JSON                
                return 'data_entity_inline';
            default: console.log('In default Case : getFielDataValueColumnName');
        }
    }    
    
    // Bot Step Adding a participant
    async function addParticipant(request, inlineData, formInlineDataMap = new Map()) {
        let newReq = Object.assign({}, request);
        let resp;
        let isLead = 0, isOwner = 0, flagCreatorAsOwner = 0;
        
        global.logger.write('conLog', inlineData, {}, {});
        newReq.message_unique_id = util.getMessageUniqueId(request.asset_id);

        let type = Object.keys(inlineData);
        global.logger.write('conLog', type, {}, {});

        if (type[0] === 'static') {
            newReq.flag_asset = inlineData[type[0]].flag_asset;

            isLead = (inlineData[type[0]].hasOwnProperty('is_lead')) ? inlineData[type[0]].is_lead : 0;
            isOwner = (inlineData[type[0]].hasOwnProperty('is_owner')) ? inlineData[type[0]].is_owner : 0;
            flagCreatorAsOwner = (inlineData[type[0]].hasOwnProperty('flag_creator_as_owner')) ? inlineData[type[0]].flag_creator_as_owner : 0;

            if (newReq.flag_asset === 1) {
                //Use Asset Id
                newReq.desk_asset_id = inlineData[type[0]].desk_asset_id;
                newReq.phone_number = inlineData[type[0]].phone_number || 0;
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

            isLead = (inlineData[type[0]].hasOwnProperty('is_lead')) ? inlineData[type[0]].is_lead : 0;
            isOwner = (inlineData[type[0]].hasOwnProperty('is_owner')) ? inlineData[type[0]].is_owner : 0;
            flagCreatorAsOwner = (inlineData[type[0]].hasOwnProperty('flag_creator_as_owner')) ? inlineData[type[0]].flag_creator_as_owner : 0;

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
        } else if (type[0] === 'asset_reference') {
            const formID = Number(inlineData["asset_reference"].form_id),
                fieldID = Number(inlineData["asset_reference"].field_id),
                workflowActivityID = Number(request.workflow_activity_id);

            let formTransactionID = 0, formActivityID = 0;

            isLead = (inlineData["asset_reference"].hasOwnProperty('is_lead')) ? inlineData["asset_reference"].is_lead : 0;
            isOwner = (inlineData["asset_reference"].hasOwnProperty('is_owner')) ? inlineData["asset_reference"].is_owner : 0;
            flagCreatorAsOwner = (inlineData["asset_reference"].hasOwnProperty('flag_creator_as_owner')) ? inlineData[type[0]].flag_creator_as_owner : 0;

            if(Number(flagCreatorAsOwner) === 1) {
                await addParticipantCreatorOwner(request);
                return [false, []];
            }

            if (!formInlineDataMap.has(fieldID)) {
                // const fieldValue = String(formInlineDataMap.get(fieldID).field_value).split("|");
                // newReq.desk_asset_id = fieldValue[0];
                // newReq.customer_name = fieldValue[1]

            } else {
                const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, workflowActivityID, formID);

                if (Number(formData.length) > 0) {
                    formTransactionID = Number(formData[0].data_form_transaction_id);
                    formActivityID = Number(formData[0].data_activity_id);
                }
                if (
                    Number(formTransactionID) > 0 &&
                    Number(formActivityID) > 0
                ) {
                    // Fetch the field value
                    const fieldData = await getFieldValue({
                        form_transaction_id: formTransactionID,
                        form_id: formID,
                        field_id: fieldID,
                        organization_id: request.organization_id
                    });
                    newReq.desk_asset_id = fieldData[0].data_entity_bigint_1;
                    newReq.customer_name = fieldData[0].data_entity_text_1;

                    console.log('newReq.desk_asset_id = fieldData[0].data_entity_bigint_1 - ', fieldData[0].data_entity_bigint_1);
                    console.log('newReq.customer_name = fieldData[0].data_entity_text_1 - ', fieldData[0].data_entity_text_1);
                }
            }

            if (Number(newReq.desk_asset_id) > 0) {
                const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
                    organization_id: request.organization_id,
                    asset_id: newReq.desk_asset_id
                });
                console.log('assetData.length - ', assetData.length);
                if (assetData.length > 0) {
                    newReq.country_code = Number(assetData[0].operating_asset_phone_country_code) || Number(assetData[0].asset_phone_country_code);
                    newReq.phone_number = Number(assetData[0].operating_asset_phone_number) || Number(assetData[0].asset_phone_number);

                    console.log('newReq.phone_number - ', newReq.phone_number);
                }
            }
        }

        // Fetch participant name from the DB
        if (newReq.customer_name === '') {
            console.log('Customer Name is empty hence fetching from DB');
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
                logger.error("BotEngine | addParticipant | getFieldValue | Customer Name | Error: ", { type: "bot_engine", error: serializeError(error), request_body: request });
            }
        }

        newReq.is_lead = isLead;
        newReq.is_owner = isOwner;
        newReq.flag_creator_as_owner = flagCreatorAsOwner;

        console.log('newReq.phone_number : ', newReq.phone_number);
        if (
            (newReq.phone_number !== -1) &&
            (Number(newReq.phone_number) !== 0) &&
            (newReq.phone_number !== 'null') && (newReq.phone_number !== undefined)
        ) {
            console.log("BotService | addParticipant | Message: ", newReq.phone_number, " | ", typeof newReq.phone_number);
            return await addParticipantStep(newReq);
        } else {
            logger.error(`BotService | addParticipant | Error: Phone number: ${newReq.phone_number}, has got problems!`);
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
            newReq.form_id = 0;
        } else if (type[0] === 'dynamic') {
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.form_id = inlineData[type[0]].form_id;
            newReq.field_id = inlineData[type[0]].field_id;
            newReq.email_sender = inlineData[type[0]].sender_email;
            newReq.email_sender_name = inlineData[type[0]].sender_name;

            //request.email_sender = 'OMT.IN1@vodafoneidea.com'; 
            //request.email_sender_name = 'Vodafoneidea';

            await sleep(4000);
            resp = await getFieldValue(newReq);
            newReq.email_id = resp[0].data_entity_text_1;
        }

        let attachmentsList = [], attachmentURL = '';
        if (
            inlineData[type[0]].hasOwnProperty("attachments") &&
            inlineData[type[0]].attachments.length > 0
        ) {
            for (const attachment of inlineData[type[0]].attachments) {
                const formID = Number(attachment.attachment_form_id);
                const fieldID = Number(attachment.attachment_field_id);
                try {
                    let formData = await activityCommonService.getActivityTimelineTransactionByFormId713(request, request.workflow_activity_id, formID);
                    if (formData.length > 0) {
                        const activityId = formData[0].data_activity_id;
                        const formTransactionId = formData[0].data_form_transaction_id;
    
                        let fieldData = await getFieldValue({
                            form_transaction_id: formTransactionId,
                            form_id: formID,
                            field_id: fieldID,
                            organization_id: request.organization_id
                        });
                        if (
                            fieldData[0].data_entity_text_1 !== '' &&
                            fieldData[0].data_entity_text_1 !== 'null' &&
                            fieldData[0].data_entity_text_1 !== null
                        ) {
                            // attachmentsList.push(fieldData[0].data_entity_text_1);
                            attachmentURL = fieldData[0].data_entity_text_1;

                            let [errOne, attachmentFile] = await util.getFileDataFromS3Url(request, attachmentURL);
                            base64EncodedAttachmentFile = Buffer.from(attachmentFile.Body).toString('base64');
                            attachmentsList.push({
                                content: base64EncodedAttachmentFile,
                                name: path.basename(attachmentURL)
                            })
                        }
                    } else {
                        // Ignore
                    }
                } catch (error) {
                    console.log("Error fetching attachment value: ", error)
                }
            }
        }
        // console.log(attachmentsList);
        newReq.bot_operation_email_attachment = attachmentsList;
        request.email_id = newReq.email_id;


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
        let formsToFill = [];
        for (const formAction of formActions) {
            if (formAction.call_to_action_label !== '') {
                let link = await getActionLink(request, formAction, request.workflow_activity_id);
                actionLink += link;

                const [_, formConfigData] = await activityCommonService.workforceFormMappingSelect({
                    organization_id: request.organization_id,
                    account_id: request.account_id,
                    workforce_id: request.workforce_id,
                    form_id: formAction.form_id
                });
                let formToFill = {};
                // formToFill[formAction.form_id] = {
                //     "name": formConfigData[0].form_name || ""
                // };                
                formToFill["id"] = formAction.form_id;
                formToFill["value"] = (formConfigData.length > 0) ? formConfigData[0].form_name : "";
                formsToFill.push(formToFill);
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
        //let activityTimelineCollection = {
        //    email: timelineEntryEmailContent,
        //    email_sender: newReq.email_sender,
        //    email_sender_name: newReq.email_sender_name,
        //    email_receiver: newReq.email_id
        //};

        let emailJson = retrievedCommInlineData.communication_template.email;
        let activityTimelineCollection = {
            reminder_email: {
                sender_email: newReq.email_sender,
                sender_name: newReq.email_sender_name,
                receiver_email: newReq.email_id,
                receiver_name: newReq.email_id,
                subject: emailJson.subject,
                body: Buffer.from(emailBody).toString('base64'),
                form_trigger: {
                    [newReq.form_id]: {
                        name: fromNameValue
                    }
                },
                form_fill: formsToFill,
                form_approval: []
            }
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
        const [errOne, urlData] = await urlOpsService.urlParametersShorten({
            ...request,
            url_form_data: JSON.stringify(JsonData),
            url_mail_receiver: request.email_id || ''
        });
        if (errOne) {
            console.log("Error shortening URL parameters: ", errOne);
        }
        const paramsJSON = {
            "url_id": urlData[0].url_id,
            "uuid": urlData[0].uuid,
            "organization_id": request.organization_id
        };

        const base64Json = Buffer.from(JSON.stringify(paramsJSON)).toString('base64');
        let urlStrFill = "https://stagingweb.officedesk.app/#/forms/entry/" + base64Json;
        if (global.mode === 'prod') {
            //urlStrFill = "https://officedesk.app/#/forms/entry/" + base64Json;
            urlStrFill = "https://web.officedesk.app/#/forms/entry/" + base64Json;
        }
        if (global.mode === 'preprod') {
            urlStrFill = "https://preprodweb.officedesk.app/#/forms/entry/" + base64Json;
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
        const [errOne, urlData] = await urlOpsService.urlParametersShorten({
            ...request,
            url_form_data: JSON.stringify(JsonData),
            url_mail_receiver: request.email_id || ''
        });
        if (errOne) {
            console.log("Error shortening URL parameters: ", errOne);
        }
        const paramsJSON = {
            "url_id": urlData[0].url_id,
            "uuid": urlData[0].uuid,
            "organization_id": request.organization_id
        };
        const base64Json = Buffer.from(JSON.stringify(paramsJSON)).toString('base64');
        let urlStrFill = "https://stagingweb.officedesk.app/#/orderstatus/" + base64Json;
        if (global.mode === 'prod') {
            urlStrFill = "https://web.officedesk.app/#/orderstatus/" + base64Json;
        }
        if (global.mode === 'preprod') {
            urlStrFill = "https://preprodweb.officedesk.app/#/orderstatus/" + base64Json;
        }

        console.log('urlStrFill : ', urlStrFill);
        const statusLink = `<a style='background: #f47920;display: inline-block;color: #FFFFFF;text-decoration: none;font-size: 12px;margin-top: 1.0em;background-clip: padding-box;padding: 5px 15px;box-shadow: 4px 4px 6px 1px #cbcbcb;margin-left:10px' target='_blank' href='${urlStrFill}'>Track Order Status</a>`;

        return statusLink;
    }

    // Bot Step Firing a Text Message
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
            newReq.form_id = 0;
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

        // Make a 716 timeline entry - (716 streamtypeid is for email)
        //let activityTimelineCollection = {
        //    country_code: newReq.country_code,
        //    phone_number: newReq.phone_number,
        //    text: retrievedCommInlineData.communication_template.text
        //};

        // Make a 716 timeline entry - (716 streamtypeid is for SMS)
        let activityTimelineCollection = {            
            reminder_text: {
                country_code: newReq.country_code,
                phone_number: newReq.phone_number,
                message: newReq.smsText,
                form_trigger: 
                    {
                        [Number(newReq.trigger_form_id)]: {
                            name: newReq.trigger_form_name || ""
                        }
                    }
                }
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

    this.alterWFCompletionPercentageMethod = async(request) => {
        global.logger.write('conLog', '****************************************************************', {}, {});
        global.logger.write('conLog', 'WF PERCENTAGE ALTER', {}, {});
        global.logger.write('conLog', 'Request Params received from Request', {}, {});
        global.logger.write('conLog', request, {}, {});

        let inline = {
            workflow_percentage_contribution: request.activity_status_workflow_percentage
        };
        try {
            let result = await alterWFCompletionPercentage(request, inline);
        } catch (err) {
            global.logger.write('conLog', 'Error in executing alterWFCompletionPercentageMethod Step', {}, {});
            global.logger.write('serverError', err, {}, {});
        }
        global.logger.write('conLog', '****************************************************************', {}, {});

        return [false, {}]
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

        if (Number(wfCompletionPercentage) !== 0) {
            // Update the workflow percentage in the activity_list table
            try {
                await activityListUpdateWorkflowPercent(newrequest, wfCompletionPercentage);
                logger.debug(`alterWFCompletionPercentage | workflow ${newrequest.workflow_activity_id} percentage updated to ${wfCompletionPercentage}, in the activity_list table.`, { type: 'bot_engine' });
            } catch (error) {
                logger.error("Bot Engine | alterWFCompletionPercentage | activityListUpdateWorkflowPercent | Error", { type: 'bot_engine', error: serializeError(error), request_body: newrequest });
            }
            // Update the workflow percentage in the activity_asset_mapping table
            try {
                await activityAssetMappingUpdateWorkflowPercent(newrequest, wfCompletionPercentage);
                logger.debug(`alterWFCompletionPercentage | workflow ${newrequest.workflow_activity_id} percentage updated to ${wfCompletionPercentage}, in the activity_asset_mapping table.`, { type: 'bot_engine' });
            } catch (error) {
                logger.error("Bot Engine | alterWFCompletionPercentage | activityAssetMappingUpdateWorkflowPercent | Error", { type: 'bot_engine', error: serializeError(error), request_body: newrequest });
            }

            // Update the workflow's timeline as well
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
                    "content": `Workflow percentage updated to ${wfCompletionPercentage}%`,
                    "mail_body": `Workflow percentage updated to ${wfCompletionPercentage}%`,
                    "subject": `Workflow percentage updated to ${wfCompletionPercentage}%`
                });
                workflowTimelineUpdateRequest.asset_id = 100; // Tony
                workflowTimelineUpdateRequest.log_asset_id = 100; // Tony
                await activityCommonService.asyncActivityTimelineTransactionInsert(workflowTimelineUpdateRequest, {}, 717);

                // Send push notification to mobile devices for live loading of the updates 
                workflowTimelineUpdateRequest.activity_stream_type_id = 717;
                workflowTimelineUpdateRequest.bot_operation_type = 'workflow_percentage_alter';
                workflowTimelineUpdateRequest.push_message = `Workflow percentage updated to ${wfCompletionPercentage}%`;
                activityPushService.sendPush(workflowTimelineUpdateRequest, objectCollection, 0, function () { });
            } catch (error) {
                logger.error("Bot Engine | alterWFCompletionPercentage | asyncActivityTimelineTransactionInsert | Error", { type: 'bot_engine', error: serializeError(error), request_body: newrequest });
            }
        }

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
            // try {
            //     await activityListUpdateWorkflowPercent(newrequest, wfCompletionPercentage);
            // } catch (error) {
            //     console.log("Bot Engine | alterWFCompletionPercentage | activityListUpdateWorkflowPercent | Error: ", error)
            // }
            // Update the workflow percentage in the activity_asset_mapping table
            // try {
            //     await activityAssetMappingUpdateWorkflowPercent(newrequest, wfCompletionPercentage);
            // } catch (error) {
            //     console.log("Bot Engine | alterWFCompletionPercentage | activityAssetMappingUpdateWorkflowPercent | Error: ", error)
            // }
            // [Last Step] Update the workflow's timeline as well
            if (Number(wfCompletionPercentage) !== 0) {
                // try {
                //     let workflowTimelineUpdateRequest = Object.assign({}, newrequest);
                //     workflowTimelineUpdateRequest.activity_id = newrequest.workflow_activity_id;
                //     workflowTimelineUpdateRequest.activity_timeline_collection = JSON.stringify({
                //         "activity_reference": [{
                //             "activity_id": newrequest.workflow_activity_id,
                //             "activity_title": ""
                //         }],
                //         "asset_reference": [{}],
                //         "attachments": [],
                //         "content": `Workflow percentage updated to ${wfCompletionPercentage}%`,
                //         "mail_body": `Workflow percentage updated to ${wfCompletionPercentage}%`,
                //         "subject": `Workflow percentage updated to ${wfCompletionPercentage}%`
                //     });
                //     workflowTimelineUpdateRequest.asset_id = 100; // Tony
                //     workflowTimelineUpdateRequest.log_asset_id = 100; // Tony
                //     await activityCommonService.asyncActivityTimelineTransactionInsert(workflowTimelineUpdateRequest, {}, 717);

                //     // Send push notification to mobile devices for live loading of the updates 
                //     workflowTimelineUpdateRequest.activity_stream_type_id = 717;
                //     workflowTimelineUpdateRequest.bot_operation_type = 'workflow_percentage_alter';
                //     workflowTimelineUpdateRequest.push_message = `Workflow percentage updated to ${wfCompletionPercentage}%`;
                //     activityPushService.sendPush(workflowTimelineUpdateRequest, objectCollection, 0, function () {});
                // } catch (error) {
                //     console.log("Bot Engine | alterWFCompletionPercentage | asyncActivityTimelineTransactionInsert | Error: ", error)
                // }
            }

            //Listeners
            //For Workflow reference, combo field widgets
            //flag = 1 - Insert into activity entity Mapping Table
            //flag = 2 - Insert into activity form field Mapping Table
            if(Number(request.activity_type_id) > 0) {
                newrequest.workflow_percentage = wfCompletionPercentage;
                updateWFPercentageInIntTablesReferenceDtypes(newrequest);
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

            if(Number(request.organization_id) === 868) {
                console.log('Its vodafone request');
                //From ESMSMails@vodafoneidea.com
                //util.sendEmailEWS(request, request.email_id, emailSubject, Template);  

                //CentralOmt.In@vodafoneidea.com        
                util.sendEmailV4ews(request, request.email_id, emailSubject, Template, 1);
            } else {
                console.log('Its non-vodafone request');
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
                    });
            }
            
            resolve();
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
            activity_timeline_collection: JSON.stringify({
                "activity_reference": [],
                "asset_reference": [],
                "attachments": [],
                "content": `Tony added ${assetData.first_name} as collaborator.`,
                "mail_body": `Tony added ${assetData.first_name} as collaborator.`,
                "participant_added": `Tony added ${assetData.first_name} as collaborator.`,
                "subject": `Tony added ${assetData.first_name} as collaborator.`
            }),
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
            activityParticipantService.assignCoworker(addParticipantRequest, async (err, resp) => {
                if(err === false) {                    
                    
                    //Check for lead flag                    
                    console.log('request.is_lead in BotService: ',request.is_lead);
                    if(Number(request.is_lead) === 1) {
                        console.log('Inside IF');
                        let newReq = {};
                            newReq.organization_id = request.organization_id;
                            newReq.account_id = request.account_id;
                            newReq.workforce_id = request.workforce_id;
                            newReq.asset_id = 100;
                            newReq.activity_id = Number(request.workflow_activity_id);
                            newReq.lead_asset_id = Number(assetData.desk_asset_id);
                            newReq.timeline_stream_type_id = 718;
                            newReq.datetime_log = util.getCurrentUTCTime();

                        await rmBotService.activityListLeadUpdateV2(newReq, Number(assetData.desk_asset_id));

                        //Add a timeline entry
                        let activityTimelineCollection =  JSON.stringify({                            
                            "content": `Tony assigned ${assetData.first_name} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
                            "subject": `Note - ${util.getCurrentDate()}.`,
                            "mail_body": `Tony assigned ${assetData.first_name} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
                            "activity_reference": [],
                            "asset_reference": [],
                            "attachments": [],
                            "form_approval_field_reference": []
                        });

                        let timelineReq = Object.assign({}, addParticipantRequest);
                            timelineReq.activity_type_id = request.activity_type_id;
                            timelineReq.message_unique_id = util.getMessageUniqueId(100);
                            timelineReq.track_gps_datetime = util.getCurrentUTCTime();
                            timelineReq.activity_stream_type_id = 711;
                            timelineReq.timeline_stream_type_id = 711;
                            timelineReq.activity_timeline_collection = activityTimelineCollection;
                            timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;
                        activityTimelineService.addTimelineTransactionAsync(timelineReq);
                    }
                    if(parseInt(request.is_owner) == 1) {

                        console.log("making owner bot");
                        let params = {
                            activity_id : Number(request.workflow_activity_id),
                            target_asset_id : assetData.desk_asset_id,
                            organization_id : request.organization_id,
                            owner_flag : 1,
                            asset_id : 100
                        }
                        await activityCommonService.setAtivityOwnerFlag(params);

                        let activityTimelineCollection =  JSON.stringify({
                            "content": `Tony assigned ${assetData.first_name} as owner at ${moment().utcOffset('+05:30').format('LLLL')}.`,
                            "subject": `Note - ${util.getCurrentDate()}.`,
                            "mail_body": `Tony assigned ${assetData.first_name} as owner at ${moment().utcOffset('+05:30').format('LLLL')}.`,
                            "activity_reference": [],
                            "asset_reference": [],
                            "attachments": [],
                            "form_approval_field_reference": []
                        });

                        let timelineReq = Object.assign({}, addParticipantRequest);
                        timelineReq.activity_type_id = request.activity_type_id;
                        timelineReq.message_unique_id = util.getMessageUniqueId(100);
                        timelineReq.track_gps_datetime = util.getCurrentUTCTime();
                        timelineReq.activity_stream_type_id = 711;
                        timelineReq.timeline_stream_type_id = 711;
                        timelineReq.activity_timeline_collection = activityTimelineCollection;
                        timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;
                        activityTimelineService.addTimelineTransactionAsync(timelineReq);
                    }
                    if(parseInt(request.flag_creator_as_owner) == 1) {
                        console.log("making creator bot");
                        let activityData = await activityCommonService.getActivityDetailsPromise({ organization_id: request.organization_id },request.workflow_activity_id);
                        let assetID = activityData[0].activity_creator_asset_id;
                        let params = {
                            activity_id : Number(request.workflow_activity_id),
                            target_asset_id : assetID,
                            organization_id : request.organization_id,
                            owner_flag : 1,
                            asset_id : 100
                        }
                        await activityCommonService.setAtivityOwnerFlag(params);

                        let activityTimelineCollection =  JSON.stringify({
                            "content": `Tony assigned ${assetData.first_name} as creator at ${moment().utcOffset('+05:30').format('LLLL')}.`,
                            "subject": `Note - ${util.getCurrentDate()}.`,
                            "mail_body": `Tony assigned ${assetData.first_name} as creator at ${moment().utcOffset('+05:30').format('LLLL')}.`,
                            "activity_reference": [],
                            "asset_reference": [],
                            "attachments": [],
                            "form_approval_field_reference": []
                        });

                        let timelineReq = Object.assign({}, addParticipantRequest);
                        timelineReq.activity_type_id = request.activity_type_id;
                        timelineReq.message_unique_id = util.getMessageUniqueId(100);
                        timelineReq.track_gps_datetime = util.getCurrentUTCTime();
                        timelineReq.activity_stream_type_id = 711;
                        timelineReq.timeline_stream_type_id = 711;
                        timelineReq.activity_timeline_collection = activityTimelineCollection;
                        timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;
                        activityTimelineService.addTimelineTransactionAsync(timelineReq);
                    }
                    
                    resolve()
                } else {
                    reject(err);
                }
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
                '', //IN p_location_datetime DATETIME                           26
                '{}' //IN p_inline_data JSON                                     27
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
                case 17: //Location
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
                    // var phone = row.field_value.split('|');
                    // params[13] = phone[0]; //country code
                    // params[18] = phone[1]; //phone number

                    if (
                        String(row.field_value).includes('|')
                    ) {
                        const phone = row.field_value.split('|');
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
                    break;
                case 51: // PDF Scan
                    params[18] = row.field_value;
                    break;
                    case 50: // Reference - File
                    // params[13] = Number(JSON.parse(row.field_value).activity_id); // p_entity_bigint_1
                    params[18] = row.field_value; // p_entity_text_1
                    break;
                case 52: // Excel Document
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
                case 57: //Workflow reference                        
                    //params[27] = row.field_value;                        
                    if (typeof row.field_value === 'object') {
                        params[27] = JSON.stringify(row.field_value);
                    } else {
                        params[18] = row.field_value;
                        try {
                            let tempVar = (row.field_value).split('|');
                            let tempObj = {};
                            tempObj[tempVar[0]] = tempVar[1];
                            // p_entity_text_2 19
                            params[19] = tempVar[4] || tempVar[2] || "";
                            params[27] = JSON.stringify(tempObj);
                        } catch (err) {
                            console.log('ERROR in field edit - 57 : ', err);
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
                        console.log(err);
                    }
                    break;
                case 64: // Address DataType
                    params[27] = row.field_value;
                    break;
                case 65: // Business Card DataType
                    params[27] = row.field_value;
                    break;
                case 67: // Reminder DataType
                    params[27] = row.field_value;
                    break;
                case 68: // contact DataType
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
                        console.log('field alter data type 71 : ', err);
                    }
                    break;
                case 72: //Multi Type File Attachment 
                    params[18] = row.field_value;
                        break;
                case 73: //Zip File Attachment
                    params[18] = row.field_value;
                        break;
                case 74: //Composite Online List
                    params[18] = row.field_value;
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
            params.push(request.message_unique_id); // IN p_log_message_unique_id VARCHAR(50)
            params.push(request.flag_retry || 0); // IN p_log_retry TINYINT(1)
            params.push(request.flag_offline || 0); // IN p_log_offline TINYINT(1)
            params.push(request.datetime_log); // IN p_transaction_datetime DATETIME
            params.push(request.datetime_log); // IN p_log_datetime DATETIME
            params.push(request.datetime_log); // IN p_entity_datetime_2 DATETIME            
            params.push(request.update_sequence_id);

            global.logger.write('conLog', '\x1b[32m In BotService - addFormEntries params - \x1b[0m' + JSON.stringify(params), {}, request);
         
            // let queryString = util.getQueryString('ds_p1_activity_form_transaction_insert_field_update', params);
            let queryString = util.getQueryString('ds_p1_1_activity_form_transaction_insert_field_update', params);
            if(request.asset_id === 0 || request.asset_id === null) {
                global.logger.write('conLog', '\x1b[ds_p1_1_activity_form_transaction_insert_field_update as asset_id is - \x1b[0m' + request.asset_id);
            }
            else {
                if (queryString != '') {
                    try {
                        await db.executeQueryPromise(0, queryString, request);
                    } catch (err) {
                        global.logger.write('debug', err, {}, {});
                    }
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
            workflowFile713Request.message_unique_id = util.getMessageUniqueId(Number(request.asset_id));
            workflowFile713Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            workflowFile713Request.device_os_id = 8;
            workflowFile713Request.is_from_field_alter = 1;

            const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
            try {
                await addTimelineTransactionAsync(workflowFile713Request);
            } catch (error) {
                console.log("alterFormActivityFieldValues | workflowFile713Request | addTimelineTransactionAsync | Error: ", error);
            }
        }

        return [false, activityData];
    };

    async function createCustomerAsset(request, createCustomerInlineData) {
        // console.log("createCustomerInlineData: ", createCustomerInlineData);
        // console.log("createCustomerAsset: ", request);
        // Fetch and prepare the form data map
        let formInlineData = [], formInlineDataMap = new Map();
        try {
            formInlineData = JSON.parse(request.activity_inline_data);
            for (const field of formInlineData) {
                formInlineDataMap.set(Number(field.field_id), field);
            }
        } catch (error) {
            logger.error("Error parsing inline JSON and/or preparing the form data map", { type: 'bot_engine', error, request_body: request });
        }

        // Prepare the customer data
        const customerData = {};
        for (const key of Object.keys(createCustomerInlineData)) {
            console.log("key: ", key);
            const fieldID = Number(createCustomerInlineData[key].field_id);
            console.log("fieldID: ", fieldID);
            if (formInlineDataMap.has(fieldID)) {
                customerData[key] = formInlineDataMap.get(fieldID).field_value;
                console.log("formInlineDataMap.get(fieldID).field_value: ", formInlineDataMap.get(fieldID).field_value);
            }
        }

        let countryCode = 0, phoneNumber = 0;
        if (customerData.customer_phone_number.includes('|')) {
            [countryCode, phoneNumber] = customerData.customer_phone_number.split('|')
        } else if (customerData.customer_phone_number.includes('||')) {
            [countryCode, phoneNumber] = customerData.customer_phone_number.split('||')
        }
        logger.silly("countryCode: %j", countryCode);
        logger.silly("phoneNumber: %j", phoneNumber);

        try {
            customerData.customer_work_location_coordinates = customerData.customer_work_location_coordinates.split(",");
        } catch (error) {
            // 
            customerData.customer_work_location_coordinates = [0, 0];
        }

        // Check if an asset already exists with the given number
        const assetCheckData = await getAssetDetailsOfANumber({
            organization_id: request.organization_id,
            country_code: countryCode,
            phone_number: phoneNumber
        })
        if (assetCheckData.length > 0) {
            logger.error("Asset with phone number exists", { type: 'bot_engine', request_body: request });
            return;
        }

        // Fetch the Customer Service Desk's asset_type_id
        const [errOne, serviceDeskAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory({
            organization_id: request.organization_id,
            account_id: createCustomerInlineData.account_id,
            workforce_id: createCustomerInlineData.workforce_id,
            asset_type_category_id: 45
        });
        if (errOne || !(serviceDeskAssetTypeData.length > 0)) {
            logger.error("Unable to fetch asset_type_id for the customer service desk.", { type: 'bot_engine', request_body: request });
            return;
        }
        // Create the desk
        const deskName = `Customer Service Desk ${customerData.customer_cuid || ''}`;
        const createCustomerServiceDeskRequest = {
            ...request,
            activity_timeline_collection: null,
            data_entity_inline: null,
            account_id: createCustomerInlineData.account_id,
            workforce_id: createCustomerInlineData.workforce_id,
            activity_access_role_id: 10,
            activity_description: deskName,
            activity_title: deskName,
            asset_first_name: deskName,
            asset_type_category_id: 45,
            workforce_name: "Customer Floor",
            activity_stream_type_id: 11018,
            stream_type_id: 11018,
            asset_type_id: serviceDeskAssetTypeData[0].asset_type_id,
            activity_inline_data: JSON.stringify({
                "contact_profile_picture": "",
                "contact_first_name": deskName,
                "contact_designation": deskName,
                "contact_location": "",
                "contact_phone_country_code": countryCode,
                "contact_phone_number": phoneNumber,
                "contact_email_id": customerData.customer_email,
                "contact_asset_type_id": serviceDeskAssetTypeData[0].asset_type_id,
                "contact_organization": "",
                "contact_asset_id": 0,
                "contact_workforce_id": createCustomerInlineData.workforce_id,
                "contact_account_id": createCustomerInlineData.account_id,
                "contact_organization_id": request.organization_id,
                "contact_operating_asset_name": "",
                "contact_operating_asset_id": ""
            }),
            industry_id: customerData.customer_industry_id || 0,
            work_location_latitude: customerData.customer_work_location_coordinates[0],
            work_location_longitude: customerData.customer_work_location_coordinates[1],
            work_location_address: customerData.customer_work_location_address || ""
        };

        const [errTwo, serviceDeskData] = await adminOpsService.addNewDeskToWorkforce(createCustomerServiceDeskRequest);
        logger.verbose(`Customer service desk created: %j`, serviceDeskData, { type: 'bot_engine' });

        // Fetch the Customer's asset_type_id
        const [errThree, customerAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory({
            organization_id: request.organization_id,
            account_id: createCustomerInlineData.account_id,
            workforce_id: createCustomerInlineData.workforce_id,
            asset_type_category_id: 13
        });
        if (errThree || !(customerAssetTypeData.length > 0)) {
            logger.error("Unable to fetch asset_type_id for the customer.", { type: 'bot_engine', request_body: request });
            return;
        }
        // Create Customer on the Service Desk
        const createCustomerRequest = {
            ...createCustomerServiceDeskRequest,
            activity_description: `${customerData.customer_name_first} ${customerData.customer_name_last}`,
            activity_title: `${customerData.customer_name_first} ${customerData.customer_name_last}`,
            asset_first_name: `${customerData.customer_name_first} ${customerData.customer_name_last}`,
            asset_type_category_id: 13,
            asset_access_role_id: 1,
            asset_access_level_id: 5,
            asset_type_id: customerAssetTypeData[0].asset_type_id,
            desk_asset_id: serviceDeskData.asset_id,
            country_code: countryCode,
            phone_number: phoneNumber,
            customer_unique_id: customerData.customer_cuid,
            email_id: customerData.customer_email,
            gender_id: customerData.customer_gender,
            joined_datetime: util.getCurrentUTCTime(),
            activity_stream_type_id: 11006,
            stream_type_id: 11006,
            timezone_id: 22
        };

        const [errFour, customerAssetData] = await adminOpsService.addNewEmployeeToExistingDesk(createCustomerRequest);
        logger.verbose(`Customer asset created: %j`, customerAssetData, { type: 'bot_engine' });

        return;
    }

    //this.getWorkflowReferenceBots = async (request) =>{
    //    let responseData = [],
    //        error = true;
//
    //    const paramsArr = new Array(
    //        request.organization_id,
    //        request.activity_type_id,
    //        request.form_id,
    //        request.data_type_id,
    //        request.start_from || 0,
    //        request.limit_value || 1
    //    );
    //    const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_select_workflow_fields', paramsArr);
//
    //    if (queryString !== '') {
    //        await db.executeQueryPromise(1, queryString, request)
    //            .then((data) => {
    //                responseData = data;
    //                error = false;
    //            })
    //            .catch((err) => {
    //                error = err;
    //            })
    //    }
    //    return [error, responseData];
    //}

    async function updateStatusInIntTablesReferenceDtypes(request, inlineData) {
        let activity_id = request.workflow_activity_id;
        let activity_status_id = inlineData.activity_status_id;
        let activity_status_type_id = inlineData.activity_status_id
        
        let newRequest = Object.assign({}, request);
            newRequest.operation_type_id = 16;
        const [err, respData] = await activityListingService.getWorkflowReferenceBots(newRequest);
        console.log('Workflow Reference Bots for this activity_type : ', respData);
        if(respData.length > 0) {
            //for(let i = 0; i<respData.length; i++) {}               
            activityCommonService.activityEntityMappingUpdateStatus(request, {
                activity_id,
                activity_status_id,
                activity_status_type_id
            }, 1);
        }

        newRequest.operation_type_id = 17;
        const [err1, respData1] = await activityListingService.getWorkflowReferenceBots(newRequest);
        console.log('Combo Field Reference Bots for this activity_type : ', respData);
        if(respData1.length > 0) {
            //for(let i = 0; i<respData.length; i++) {}
            activityCommonService.activityEntityMappingUpdateStatus(request, {
                activity_id,
                activity_status_id,
                activity_status_type_id
            }, 2);
        }
    }

    async function updateWFPercentageInIntTablesReferenceDtypes(request) {
        let activity_id = request.workflow_activity_id;
        let workflow_percentage = request.workflow_percentage;

        let newRequest = Object.assign({}, request);
            newRequest.operation_type_id = 16;
        const [err, respData] = await activityListingService.getWorkflowReferenceBots(newRequest);
        console.log('Workflow Reference Bots for this activity_type : ', respData);
        if(respData.length > 0) {
            //for(let i = 0; i<respData.length; i++) {}               
            activityCommonService.activityEntityMappingUpdateWFPercentage(request, {
                activity_id,
                workflow_percentage
            }, 1);
        }

        newRequest.operation_type_id = 17;
        const [err1, respData1] = await activityListingService.getWorkflowReferenceBots(newRequest);
        console.log('Combo Field Reference Bots for this activity_type : ', respData);
        if(respData1.length > 0) {
            //for(let i = 0; i<respData.length; i++) {}
            activityCommonService.activityEntityMappingUpdateWFPercentage(request, {
                activity_id,
                workflow_percentage
            }, 2);
        }        
    }

    this.botOperationMappingSelectOperationType = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.activity_type_id || 0,
            request.bot_id || 0,
            request.bot_operation_type_id || 0,
            request.form_id || 0,
            request.field_id || 0,
            request.start_from || 0,
            request.limit_value || 50
        );

        var queryString = util.getQueryString('ds_p1_1_bot_operation_mapping_select_operation_type', paramsArr);
        if (queryString !== '') {
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

    this.callUpdateCUIDBotOperation = async(request) => {
        let formInlineDataMap = request.form_inline_data_map || {};
        let cuidInlineData = request.cuid_inline_data;

        let parsedCuidInlineData = (typeof cuidInlineData === 'string') ? JSON.parse(cuidInlineData) : cuidInlineData;
        return await updateCUIDBotOperation(request, formInlineDataMap, parsedCuidInlineData);
    }
    
    this.updateCUIDBotOperationMethod = async(request, formInlineDataMap = {}, cuidInlineData) => {
        //let formInlineDataMap = request.form_inline_data_map || {};
        //let cuidInlineData = request.cuid_inline_data;

        return await updateCUIDBotOperation(request, formInlineDataMap, cuidInlineData);
    }
    
    async function updateCUIDBotOperation(request, formInlineDataMap, cuidInlineData) {        
        //console.log('formInlineDataMap : ', formInlineDataMap);
        /*{
            "bot_operations": {
              "condition": {
                "form_id": 0,
                "field_id": 0,
                "is_check": false,
                "operation": "",
                "threshold": 0
              },
              "update_cuids": {
                "CUID2": {
                  "form_id": 2645,
                  "field_id": 28332
                }
              }
            }
          }*/
          
        console.log('cuidInlineData : ', cuidInlineData);

        for (let [cuidKey, cuidValue] of Object.entries(cuidInlineData)) {
            let cuidUpdateFlag = 0,
                activityCUID1 = '', activityCUID2 = '', activityCUID3 = '',
                fieldValue = "";

            if(request.hasOwnProperty("opportunity_update")){
                fieldValue = cuidValue;
            } else if(request.hasOwnProperty("account_code_update")) {
                fieldValue = cuidValue;
            } else if(formInlineDataMap.has(Number(cuidValue.field_id))) {
                const fieldData = formInlineDataMap.get(Number(cuidValue.field_id));

                console.log('fieldData : ', fieldData);
                console.log('Number(fieldData.field_data_type_id) : ', Number(fieldData.field_data_type_id));

                switch(Number(fieldData.field_data_type_id)) {
                    //Workflow Reference
                    case 68: let toBeProcessedfieldValue = fieldData.field_value;
                                 toBeProcessedfieldValue = (typeof toBeProcessedfieldValue === 'string')? JSON.parse(toBeProcessedfieldValue): toBeProcessedfieldValue;    
                            
                             for(const i_iterator of toBeProcessedfieldValue) {                        
                                fieldValue = i_iterator.activity_title;
                             }
                             break;

                    //Account Reference/Name
                    case 57: fieldValue = fieldData.field_value; 
                             (fieldValue.includes("|")) ?
                                fieldValue = String(fieldValue).split("|")[1]:
                                fieldValue = fieldData.field_value || "";
                             break;

                    default: fieldValue = fieldData.field_value || "";
                             break;
                }
                
                //Supporting workflow reference types
                /*if(Number(fieldData.field_data_type_id) === 68) {
                    let toBeProcessedfieldValue = fieldData.field_value;
                        toBeProcessedfieldValue = (typeof toBeProcessedfieldValue === 'string')? JSON.parse(toBeProcessedfieldValue): toBeProcessedfieldValue;    
                    
                    for(const i_iterator of toBeProcessedfieldValue) {                        
                        fieldValue = i_iterator.activity_title;
                    }
                } else {
                    fieldValue = fieldData.field_value || "";
                }*/
            }
            switch (cuidKey) {
                case "CUID1":
                    cuidUpdateFlag = 1;
                    activityCUID1 = fieldValue;
                    break;

                case "CUID2":
                    cuidUpdateFlag = 2;
                    activityCUID2 = fieldValue;
                    break;

                case "CUID3":
                    cuidUpdateFlag = 3;
                    activityCUID3 = fieldValue;
                    break;

                default:
                    throw new Error(`cuidInlineData contains incorrect cuid key: ${cuidKey}`)
                // break;
            }

            // Update the activity list table
            try {
                await activityListUpdateCUIDs({
                    ...request,
                    activity_id: request.workflow_activity_id
                }, cuidUpdateFlag, activityCUID1, activityCUID2, activityCUID3);
            } catch (error) {
                logger.error("updateCUIDBotOperation.activityListUpdateCuids | Error updating CUID in the activity_list table", { type: 'bot_engine', error: serializeError(error), request_body: request });
            }

            // Update the activity list history table
            try {
                await activityCommonService.activityListHistoryInsertAsync({
                    ...request,
                    activity_id: request.workflow_activity_id
                }, 418);
            } catch (error) {
                logger.error("updateCUIDBotOperation activityListHistoryInsertAsync | Error updating CUID in the activity_list_history table", { type: 'bot_engine', error: serializeError(error), request_body: request });
            }

            // Update the activity_asset_mapping table
            try {
                await activityAssetMappingUpdateCUIDs({
                    ...request,
                    activity_id: request.workflow_activity_id
                }, cuidUpdateFlag, activityCUID1, activityCUID2, activityCUID3);
            } catch (error) {
                logger.error("updateCUIDBotOperation.activityAssetMappingUpdateCUIDs | Error updating CUID in the activity_asset_mapping table", { type: 'bot_engine', error: serializeError(error), request_body: request });
            }

            // Update the queue_activity_mapping table
            try {
                await queueActivityMappingUpdateCUIDs({
                    ...request,
                    activity_id: request.workflow_activity_id
                }, cuidUpdateFlag, activityCUID1, activityCUID2, activityCUID3);
            } catch (error) {
                logger.error("updateCUIDBotOperation.queueActivityMappingUpdateCUIDs | Error updating CUID in the queue_activity_mapping table", { type: 'bot_engine', error: serializeError(error), request_body: request });
            }
        }

        return;
    }

    async function activityListUpdateCUIDs(request, cuidUpdateFlag, activityCUID1, activityCUID2, activityCUID3) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            cuidUpdateFlag,
            activityCUID1,
            activityCUID2,
            activityCUID3,
            request.asset_id || 0,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_activity_list_update_cuids', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    async function activityAssetMappingUpdateCUIDs(request, cuidUpdateFlag, activityCUID1, activityCUID2, activityCUID3) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            cuidUpdateFlag,
            activityCUID1,
            activityCUID2,
            activityCUID3,
            request.asset_id || 0,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_cuids', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    async function queueActivityMappingUpdateCUIDs(request, cuidUpdateFlag, activityCUID1, activityCUID2, activityCUID3) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            cuidUpdateFlag,
            activityCUID1,
            activityCUID2,
            activityCUID3,
            request.asset_id || 0,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_queue_activity_mapping_update_cuids', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    this.generateOppurtunity = async (request) => {
        let responseData = [],
            error = false,
            generatedOpportunityID = "OPP-";

        let activityInlineData = JSON.parse(request.activity_inline_data);
        let parentActivityID;

        for (let i_iterator of activityInlineData) {
            if (Number(i_iterator.field_data_type_id) === 57) {
                let fieldValue = i_iterator.field_value;
                if (fieldValue.includes('|')) {
                    //parentActivityID = fieldValue.split('|')[1];                    
                    parentActivityID = fieldValue.split('|')[0];
                }
            }
        }

        //Call activity_activity_mapping retrieval service to get the segment
        let [err, segmentData] = await activityCommonService.activityActivityMappingSelect({
            activity_id: request.activity_id, //Workflow activity id 
            parent_activity_id: parentActivityID, //reference account workflow activity_id
            organization_id: request.organization_id,
            start_from: 0,
            limit_value: 50
        });

        console.log('segmentData : ', segmentData);
        let segmentName = (segmentData[0].parent_activity_tag_name).toLowerCase();
        console.log('segmentData : ', segmentName);
        switch (segmentName) {
            case 'la': generatedOpportunityID += 'C-';
                break;
            case 'ge': generatedOpportunityID += 'V-';
                break;
            case 'soho': generatedOpportunityID += 'D-';
                break;
            case 'sme': generatedOpportunityID += 'S-';
                break;
            case 'govt': generatedOpportunityID += 'G-';
                break;
            case 'vics': generatedOpportunityID += 'W-';
                break;
        }

        try {

            let targetOpportunityID = await cacheWrapper.getOpportunityIdPromise();
            if (targetOpportunityID >= 100000) {

            } else if (targetOpportunityID >= 10000) {
                targetOpportunityID = "0" + targetOpportunityID;
            } else if (targetOpportunityID >= 1000) {
                targetOpportunityID = "00" + targetOpportunityID;
            } else if (targetOpportunityID >= 100) {
                targetOpportunityID = "000" + targetOpportunityID;
            } else if (targetOpportunityID >= 10) {
                targetOpportunityID = "0000" + targetOpportunityID;
            } else if (targetOpportunityID >= 1) {
                targetOpportunityID = "00000" + targetOpportunityID;
            }

            if (targetOpportunityID == 999900) {
                await cacheWrapper.setOppurtunity(0);
            }
            generatedOpportunityID = generatedOpportunityID + targetOpportunityID + '-' + util.getCurrentISTDDMMYY();
            responseData.push(generatedOpportunityID);

            logger.silly("Update CUID Bot");
            logger.silly("Update CUID Bot Request: ", request);
            try {
                request.opportunity_update = true;
                await updateCUIDBotOperation(request, {}, { "CUID1": generatedOpportunityID });
            } catch (error) {
                logger.error("Error running the CUID update bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
            }

        } catch (e) {
            error = true;
            console.log("error : ", e);
        }
        return [error, responseData];
    }

    async function generateChildOppurtunityIDNoSet(request, parentOppurtunityID = "") {
        let responseData = {},
            error = false,
            baseOpportunityID = String(parentOppurtunityID).substring(0, 6);

        try {
            let targetOpportunityID = await cacheWrapper.getOpportunityIdPromise();
            if (targetOpportunityID >= 100000) {

            } else if (targetOpportunityID >= 10000) {
                targetOpportunityID = "0" + targetOpportunityID;
            } else if (targetOpportunityID >= 1000) {
                targetOpportunityID = "00" + targetOpportunityID;
            } else if (targetOpportunityID >= 100) {
                targetOpportunityID = "000" + targetOpportunityID;
            } else if (targetOpportunityID >= 10) {
                targetOpportunityID = "0000" + targetOpportunityID;
            } else if (targetOpportunityID >= 1) {
                targetOpportunityID = "00000" + targetOpportunityID;
            }

            if (targetOpportunityID == 999900) {
                await cacheWrapper.setOppurtunity(0);
            }
            const childOpportunityID = baseOpportunityID + targetOpportunityID + '-' + util.getCurrentISTDDMMYY();
            responseData.childOpportunityID = childOpportunityID;

        } catch (error) {
            error = true;
            logger.error("Error generating child opportunity", { type: 'bot_engine', error, request_body: request });
        }
        return [error, responseData];
    }

    this.callSetDueDateOfWorkflow = async(request) => {
        let botOperationsJson = {
            bot_operations: {
                due_date_edit: {
                    form_id: 1234,
                    field_id: 223743
                }
            }
        };

        let formInlineData = [], formInlineDataMap = new Map();
        try {
            if (!request.hasOwnProperty('activity_inline_data')) {
                // Usually mobile apps send only activity_timeline_collection parameter in
                // the "/activity/timeline/entry/add" call
                const activityTimelineCollection = JSON.parse(request.activity_timeline_collection);
                formInlineData = activityTimelineCollection.form_submitted;
                if (
                    Number(request.device_os_id) === 1 &&
                    typeof activityTimelineCollection.form_submitted === "string"
                ) {
                    formInlineData = JSON.parse(activityTimelineCollection.form_submitted);
                }
            } else {
                formInlineData = JSON.parse(request.activity_inline_data);
            }
            for (const field of formInlineData) {
                formInlineDataMap.set(Number(field.field_id), field);
            }
        } catch (error) {
            logger.error("Error parsing inline JSON and/or preparing the form data map", { type: 'bot_engine', error, request_body: request });
        }

        console.log('formInlineDataMap : ', formInlineDataMap);

        await this.setDueDateOfWorkflow(request, formInlineDataMap, botOperationsJson.bot_operations.due_date_edit);

        return [false, []];
    }
    
    this.setDueDateOfWorkflow = async(request, formInlineDataMap, dueDateEdit) => {
        let responseData = [],
            error = false,
            oldDate,
            newDate;

        let fieldData;

        let workflowActivityDetails = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);

        oldDate = (workflowActivityDetails.length > 0) ? workflowActivityDetails[0].activity_datetime_end_deferred: 0;
        //oldDate = util.replaceDefaultDatetime(oldDate);
        oldDate = util.getFormatedLogDatetimeV1(oldDate,"DD-MM-YYYY HH:mm:ss");
        console.log('formInlineDataMap : ', formInlineDataMap);
        console.log('dueDateEdit form bot inline: ', dueDateEdit);

        if(dueDateEdit.hasOwnProperty('form_id') && dueDateEdit.form_id > 0) {
            let dateReq = Object.assign({}, request);
                    dateReq.form_id = dueDateEdit.form_id;
                    dateReq.field_id = dueDateEdit.field_id;
            let dateFormData = await getFormInlineData(dateReq, 2);

            for(const i_iterator of dateFormData) {
                if(Number(i_iterator.field_id) === Number(dueDateEdit.date_field_id)) {                
                    newDate = i_iterator.field_value;
                    newDate = util.getFormatedLogDatetimeV1(newDate, "DD-MM-YYYY HH:mm:ss");
                    break;
                }
            }
        } else {
            if(formInlineDataMap.has(Number(dueDateEdit.field_id))) {
                fieldData = formInlineDataMap.get(Number(dueDateEdit.field_id));
                console.log('fieldData : ', fieldData);

                newDate = fieldData.field_value;
                console.log('New Date b4 converting - ', newDate);
                console.log('Number(request.device_os_id) - ', Number(request.device_os_id));
                 
                if(Number(request.device_os_id) === 1) {
                    //newDate = util.getFormatedLogDatetimeV1(newDate, "DD-MM-YYYY HH:mm:ss");

                    console.log('moment(newDate, YYYY-MM-DD, true) - ', moment(newDate, 'YYYY-MM-DD', true).isValid());
                    if(!moment(newDate, 'YYYY-MM-DD', true).isValid()) {
                        newDate = util.getFormatedLogDatetimeV1(newDate, "DD-MM-YYYY HH:mm:ss");
                    }
                    
                    console.log('Retrieved Date field value - ANDROID: ', newDate);
                } else if(Number(request.device_os_id) === 2) {
                    //newDate = util.getFormatedLogDatetimeV1(newDate, "DD MMM YYYY");

                    console.log('moment(newDate, YYYY-MM-DD, true) - ', moment(newDate, 'YYYY-MM-DD', true).isValid());
                    if(!moment(newDate, 'YYYY-MM-DD', true).isValid()) {
                        newDate = util.getFormatedLogDatetimeV1(newDate, "DD MMM YYYY");
                    }                   
                    
                    console.log('Retrieved Date field value - IOS: ', newDate);
                }
                 else if(Number(request.device_os_id) === 5||Number(request.device_os_id) === 8){
                    console.log('moment(newDate, YYYY-MM-DD, true) - ', moment(newDate, 'YYYY-MM-DD', true).isValid());
                    
                    if(!(moment(newDate, 'YYYY-MM-DD', true).isValid() || moment(newDate, 'YYYY-MM-DD HH:mm:ss', true).isValid())) {
                        if(moment(newDate, 'YYYY-MM-DD', true).isValid()) {
                            console.log('IN IF');
                            newDate = await util.getFormatedLogDatetimeV1(newDate, "YYYY-MM-DD");
                        } else {
                            console.log('IN ELSE');
                            newDate = await util.getFormatedLogDatetimeV1(newDate, "DD-MM-YYYY HH:mm:ss");
                        }
                    }
                }
            }
        }
 
        
        console.log('OLD DATE : ', oldDate);
        console.log('NEW DATE : ', newDate);

        //Alter the workflow due date
        //activity/cover/alter
            /*account_id: 1100
            activity_access_role_id: 26
            activity_cover_data: "{"title":{"old":"APR 28 0001","new":"APR 28 0001"},"description":{"old":"","new":""},"duedate":{"old":"2020-05-03 08:47:22","new":"2020-05-13T12:31:18.000Z"}}"
            activity_id: 2893222
            activity_parent_id: 0
            activity_type_category_id: 48
            activity_type_id: 150441
            app_version: 0
            asset_id: 40443
            asset_message_counter: 0
            asset_token_auth: "643be4e0-892a-11ea-8416-733b3e360f4a"
            device_os_id: 5
            flag_offline: 0
            flag_pin: 0
            flag_priority: 0
            flag_retry: 0
            message_unique_id: 1589287086577
            organization_id: 962
            service_version: 1
            track_altitude: 0
            track_gps_accuracy: 0
            track_gps_datetime: "2020-05-12 12:31:32"
            track_gps_status: 0
            track_latitude: 0
            track_longitude: 0
            workforce_id: 5912*/

        let newReq = Object.assign({}, request);
            newReq.timeline_transaction_datetime = util.getCurrentUTCTime();
            newReq.track_gps_datetime = util.getCurrentUTCTime();
            newReq.datetime_log = newReq.track_gps_datetime;
            newReq.message_unique_id = util.getMessageUniqueId(100);

        let activityCoverData = {};
            activityCoverData.title = {};
                activityCoverData.title.old = workflowActivityDetails[0].activity_title;
                activityCoverData.title.new = workflowActivityDetails[0].activity_title;

            activityCoverData.description = {};
                activityCoverData.description.old = "";
                activityCoverData.description.new = "";

            activityCoverData.duedate = {};
                activityCoverData.duedate.old = oldDate;
                activityCoverData.duedate.new = newDate;
        
        console.log('activityCoverData : ', activityCoverData);
        try{
            newReq.activity_cover_data = JSON.stringify(activityCoverData);
        } catch(err) {
            console.log(err);
        }
        
        newReq.asset_id = 100;
        newReq.activity_id = Number(request.workflow_activity_id);
        const event = {
            name: "alterActivityCover",
            service: "activityUpdateService",
            method: "alterActivityCover",
            payload: newReq
        };
        console.log('request.workflow_activity_id : ', request.workflow_activity_id);
        await queueWrapper.raiseActivityEventPromise(event, request.workflow_activity_id);

        //Timeline /activity/timeline/entry/add
            /*account_id: 1100
            activity_channel_category_id: 0
            activity_channel_id: 0
            activity_id: 2893222
            activity_parent_id: 0
            activity_stream_type_id: 711
            activity_sub_type_id: -1
            activity_timeline_collection: "{"content":"Due date changed from \"3rd May 2020\" to \"13th May 2020\" by Nani Kalyan","subject":"Note - 12th May ","mail_body":"Due date changed from \"3rd May 2020\" to \"13th May 2020\" by Nani Kalyan","attachments":[],"activity_reference":[{"activity_title":"","activity_id":""}],"asset_reference":[{}],"form_approval_field_reference":[]}"
            activity_timeline_text: ""
            activity_timeline_url: ""
            activity_type_category_id: 48
            activity_type_id: 150441
            app_version: 1
            asset_id: 40443
            asset_message_counter: 0
            asset_token_auth: "643be4e0-892a-11ea-8416-733b3e360f4a"
            auth_asset_id: 40443
            data_entity_inline: "{"content":"Due date changed from \"3rd May 2020\" to \"13th May 2020\" by Nani Kalyan","subject":"Note - 12th May ","mail_body":"Due date changed from \"3rd May 2020\" to \"13th May 2020\" by Nani Kalyan","attachments":[],"activity_reference":[{"activity_title":"","activity_id":""}],"asset_reference":[{}],"form_approval_field_reference":[]}"
            datetime_log: "2020-05-12 12:31:32"
            device_os_id: 5
            flag_offline: 0
            flag_pin: 0
            flag_priority: 0
            flag_retry: 0
            message_unique_id: 1589287764829
            operating_asset_first_name: "Nani Kalyan"
            organization_id: 962
            service_version: 1
            timeline_stream_type_id: 711
            timeline_transaction_id: 1589287504481
            track_altitude: 0
            track_gps_accuracy: "0"
            track_gps_datetime: "2020-05-12 12:31:32"
            track_gps_status: 0
            track_latitude: "0.0"
            track_longitude: "0.0"
            workforce_id: 5912*/

            let assetDetails = await getAssetDetails({
                "organization_id": request.organization_id,
                "asset_id": request.asset_id
            });

            let assetName = (assetDetails.length > 0) ? assetDetails[0].operating_asset_first_name : 'Bot';

            let content = `Due date changed from ${oldDate} to ${newDate} by ${assetName}`;
            let activityTimelineCollection = {
                content: content,
                subject: `Note - ${util.getCurrentDate()}`,
                mail_body: content,
                attachments: [],                
                asset_reference: [],
                activity_reference: [],
                form_approval_field_reference: []
            };

            let timelineReq = Object.assign({}, request);
                timelineReq.activity_type_category_id= 48;
                timelineReq.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
                timelineReq.data_entity_inline = JSON.stringify(activityTimelineCollection);
                timelineReq.asset_id = 100;   
                timelineReq.timeline_stream_type_id= 711;
                timelineReq.activity_stream_type_id= 711;
                timelineReq.timeline_transaction_datetime = util.getCurrentUTCTime();
                timelineReq.track_gps_datetime = timelineReq.timeline_transaction_datetime;
                timelineReq.datetime_log = timelineReq.timeline_transaction_datetime;
                timelineReq.message_unique_id = util.getMessageUniqueId(100);
                //timelineReq.device_os_id = 10; //Do not trigger Bots

            timelineReq.activity_id = Number(request.workflow_activity_id);
            const event1 = {
                name: "addTimelineTransaction",
                service: "activityTimelineService",                
                method: "addTimelineTransactionAsync",                
                payload: timelineReq
            };
            await queueWrapper.raiseActivityEventPromise(event1, request.workflow_activity_id);

        return [error, responseData];
    }

    this.prefillTargetFormValuesForFormFieldCopyBotOperation = async function (request) {
        let workflowActivityID = Number(request.workflow_activity_id) || 0;
        if (!workflowActivityID) {
            return [new Error("workflow_activity_id is missing"), null];
        }

        let prefillFieldsArray = [];
        try {
            prefillFieldsArray = JSON.parse(request.prefill_fields_array);
        } catch (error) {
            return [error, null];
        }

        if (!(prefillFieldsArray.length > 0)) {
            return [new Error("Empty prefill_fields_array"), null];
        }

        const botOperationInlineDataMap = new Map();
        const prefillFieldToSourceMap = new Map();
        try {

            for (const prefillField of prefillFieldsArray) {
                let filteredPair = [];
                if (botOperationInlineDataMap.has(Number(prefillField.bot_operation_id))) {
                    // DO!
                    const formFieldCopyArray = botOperationInlineDataMap.get(Number(prefillField.bot_operation_id));
                    // console.log("[EXISTING] botOperationInlineData.form_field_copy: ", formFieldCopyArray);

                    filteredPair = formFieldCopyArray.filter(mapping =>  Number(mapping.target_field_id) === Number(prefillField.field_id));

                } else {
                    // Fetch the bot_operation's inline data
                    const [_, botOperationData] = await adminListingService.botOperationMappingSelectID({
                        bot_id: prefillField.bot_id,
                        bot_operation_id: prefillField.bot_operation_id
                    });
                    if (!(botOperationData.length > 0)) { continue; }

                    const botOperationInlineData = JSON.parse(botOperationData[0].bot_operation_inline_data);
                    botOperationInlineDataMap.set(Number(prefillField.bot_operation_id), botOperationInlineData.bot_operations.form_field_copy);
                    
                    // console.log("[NEW] botOperationInlineData.form_field_copy: ", botOperationInlineData.bot_operations.form_field_copy);
                    filteredPair = botOperationInlineData.bot_operations.form_field_copy.filter(mapping =>  Number(mapping.target_field_id) === Number(prefillField.field_id));
                }
                prefillFieldToSourceMap.set(Number(prefillField.field_id), filteredPair[0]);
            }

        } catch (error) {
            return [error, null];
        }
        // console.log("botOperationInlineDataMap: ", botOperationInlineDataMap);
        // console.log("prefillFieldToSourceMap: ", prefillFieldToSourceMap);

        // 
        const fieldIDToValueJSON = {};
        try {
            for (const [prefillFieldID, sourceMap] of prefillFieldToSourceMap) {
                const sourceFormID = Number(sourceMap.source_form_id),
                    sourceFieldID = Number(sourceMap.source_field_id);

                const formTimelineData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, workflowActivityID, sourceFormID);

                let sourceFormActivityID = 0, sourceFormTransactionID = 0;
                if (Number(formTimelineData.length) > 0) {
                    sourceFormActivityID = Number(formTimelineData[0].data_activity_id);
                    sourceFormTransactionID = Number(formTimelineData[0].data_form_transaction_id);
                }
                if (
                    Number(sourceFormActivityID) > 0 &&
                    Number(sourceFormTransactionID) > 0
                ) {
                    // Get the field value
                    let fieldData = await getFieldValue({
                        form_transaction_id: sourceFormTransactionID,
                        form_id: sourceFormID,
                        field_id: sourceFieldID,
                        organization_id: request.organization_id
                    });
                    let fieldDataTypeID = 0;
                    let fieldValue = '';
                    if (fieldData.length > 0) {
                        fieldDataTypeID = Number(fieldData[0].data_type_id);
                        fieldValue = fieldData[0][getFielDataValueColumnName(fieldDataTypeID)];

                        fieldIDToValueJSON[prefillFieldID] = fieldValue;
                    }
                }
            }
        } catch (error) {
            return [error, null];
        }

        // console.log("fieldIDToValueJSON: ", fieldIDToValueJSON);

        return [null, fieldIDToValueJSON];
    }

    this.checkForParticipantRemoveBotOperationSuccess = async function (request) {
        const formID = Number(request.form_id);
        let botOperationInlineData = {},
            botID = 0, botOperationID = 0;

        // Prepare the map equivalent for the form's inline data,
        // for easy checks and comparisons
        let formInlineData = [], formInlineDataMap = new Map();
        try {
            formInlineData = JSON.parse(request.activity_inline_data);
            for (const field of formInlineData) {
                formInlineDataMap.set(Number(field.field_id), field);
            }
        } catch (error) {
            logger.error("Error parsing inline JSON and/or preparing the form data map", { type: 'bot_engine', error, request_body: request });
            return [error, null];
        }
        // console.log("formInlineDataMap: ", formInlineDataMap);

        // Get the participant remove bot for the form
        try {
            const [error, botOperationData] = await botOperationMappingSelectOperationType({
                organization_id: request.organization_id,
                form_id: formID,
                bot_operation_type_id: 25
            });
            if (botOperationData.length > 0) {
                botOperationInlineData = JSON.parse(botOperationData[0].bot_operation_inline_data);
                botID = botOperationData[0].bot_id;
                botOperationID = botOperationData[0].bot_operation_id;
            }
        } catch (error) {
            return [error, null]
        }

        let conditionsArray = [];
        if (
            botOperationInlineData.hasOwnProperty("bot_operations") &&
            botOperationInlineData.bot_operations.hasOwnProperty("participant_remove")
        ) {
            if (
                botOperationInlineData.bot_operations.participant_remove.hasOwnProperty("condition") &&
                Array.isArray(botOperationInlineData.bot_operations.participant_remove.condition) &&
                botOperationInlineData.bot_operations.participant_remove.condition.length > 0
            ) {
                conditionsArray = botOperationInlineData.bot_operations.participant_remove.condition;
            } else {
                return [null, {
                    is_success: true,
                    message: `The participant will be removed if the form is submitted.`
                }];
            }
        } else {
            return [new Error(`'bot_operation_inline_data' is incomplete for Bot ID: ${botID} and Bot Operation ID: ${botOperationID}`), null];
        }

        if (conditionsArray.length > 0) {

            let conditionChain = [];
            for (const condition of conditionsArray) {
                const formID = Number(condition.form_id),
                    fieldID = Number(condition.field_id);

                // Check if the field is already present in the formInlineDataMap
                if (formInlineDataMap.has(fieldID)) {
                    const field = formInlineDataMap.get(fieldID);
                    conditionChain.push({
                        value: await checkForThresholdCondition(field.field_value, condition.threshold, condition.operation),
                        join_condition: condition.join_condition
                    });
                    continue;
                }

                let formTransactionID = 0,
                    formActivityID = 0;

                const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, workflowActivityID, condition.form_id);

                if (Number(formData.length) > 0) {
                    formTransactionID = Number(formData[0].data_form_transaction_id);
                    formActivityID = Number(formData[0].data_activity_id);
                }
                if (
                    Number(formTransactionID) > 0 // &&
                    // Number(formActivityID) > 0
                ) {
                    // Fetch the field value
                    const fieldData = await getFieldValue({
                        form_transaction_id: formTransactionID,
                        form_id: formID,
                        field_id: fieldID,
                        organization_id: request.organization_id
                    });
                    const fieldDataTypeID = Number(fieldData[0].data_type_id) || 0;
                    const fieldValue = fieldData[0][getFielDataValueColumnName(fieldDataTypeID)] || 0;

                    conditionChain.push({
                        value: await checkForThresholdCondition(fieldValue, condition.threshold, condition.operation),
                        join_condition: condition.join_condition
                    });

                } else {
                    conditionChain.push({
                        value: false,
                        join_condition: condition.join_condition
                    });
                }
            }

            logger.silly("conditionChain: %j", conditionChain);

            // Process the condition chain
            const conditionReducer = (accumulator, currentValue) => {
                let value = 0;
                logger.silly(`accumulator: ${JSON.stringify(accumulator)} | currentValue: ${JSON.stringify(currentValue)}`);
                // AND
                if (accumulator.join_condition === "AND") {
                    value = accumulator.value && currentValue.value;
                }
                // OR
                if (accumulator.join_condition === "OR") {
                    value = accumulator.value || currentValue.value;
                }
                // EOJ
                // Not needed
                return {
                    value,
                    join_condition: currentValue.join_condition
                }
            };

            const finalCondition = conditionChain.reduce(conditionReducer);
            logger.silly("finalCondition: %j", finalCondition);

            // Select the status based on the condition arrived
            if (finalCondition.value) {
                return [null, {
                    is_success: true,
                    message: `The participant will be removed if the form is submitted.`
                }];
            } else if (!finalCondition.value) {
                return [null, {
                    is_success: false,
                    message: `The participant won't be removed if the form is submitted.`
                }];
            } else {
                logger.error("Error processing the condition chain", { type: 'bot_engine', request_body: request, condition_chain: conditionChain, final_condition: finalCondition });
            }
        }

        return [null, null];
    }

    async function botOperationMappingSelectOperationType(request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.activity_type_id || 0,
            request.bot_id || 0,
            request.bot_operation_type_id || 0,
            request.form_id || 0,
            request.field_id || 0,
            request.start_from || 0,
            request.limit_value || 50
        );

        var queryString = util.getQueryString('ds_p1_1_bot_operation_mapping_select_operation_type', paramsArr);
        if (queryString !== '') {
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

    this.esmsIntegrationsConsumeMethod = async (request) => {
        await queueWrapper.raiseActivityEventToTopicPromise({
            type: "VIL_ESMS_IBMMQ_INTEGRATION",
            trigger_form_id: Number(request.trigger_form_id),
            payload: request
        }, "staging-vil-esms-ibmmq-v1", request.workflow_activity_id || request.activity_id);
        return [false, []];
    }

    this.arithmeticBotVNK = async (request) => {
    let x = {
            "operations": [
              {
                "form_id": 4127,
                "field_id": 219915,
                "sequence_id": 2,
                "join_condition": "*"
              },
              {
                "form_id": 4127,
                "field_id": 219916,
                "sequence_id": 3,
                "join_condition": "EOJ"
              },
              {
                "form_id": 4127,
                "field_id": 218000,
                "sequence_id": 1,
                "join_condition": "*"
              }
            ],
            "target_form_id": 4127,
            "target_field_id": 215613,
            "target_field_data_type_id":6, 
            "target_field_data_type_category_id":2,
            "message_unique_id": 123456789321
          };

        await arithmeticBot(request, {}, x);
    }
    
    async function arithmeticBot(request, formInlineDataMap, arithmeticCalculation) {
        let responseData = [],
            error = false;

        /*"arithmetic_calculation": {
            "target_form_id": 0,
            "target_field_id": 0,
            "operations": [
            {
                "form_id": 1529,
                "field_id": 13890,
                "sequence_id":1,
                "join_condition": "+|-|*|/|EOJ"
            },
            {
                "form_id": 1529,
                "field_id": 13890,
                "sequence_id":2,
                "join_condition": "+|-|*|/|EOJ"
            }],
            "target_form_id": 4127,
            "target_field_id": 215613,
            "target_field_data_type_id":6, 
            "target_field_data_type_category_id":2,
            "message_unique_id": 123456789321
        }*/

        let fieldsData = arithmeticCalculation.operations;        
        sortedfieldsData = _.sortBy(fieldsData,"sequence_id");

        //Before firing check that all the required input fields are available else dont fire.
        for(let i_iterator of sortedfieldsData){            
            if(i_iterator.hasOwnProperty('value')) {
                i_iterator.field_value = value;
            } else {
                let formDataFrom713Entry = await activityCommonService.getActivityTimelineTransactionByFormId713(request, request.workflow_activity_id, i_iterator.form_id);                            
                if(!formDataFrom713Entry.length > 0) {
                    responseData.push({'message': `${i_iterator.form_id} is not submitted`});
                    console.log('responseData : ', responseData);
                    return [true, responseData];
                }

                //console.log('formDataFrom713Entry[0] : ', formDataFrom713Entry[0]);
                let formTransactionInlineData = JSON.parse(formDataFrom713Entry[0].data_entity_inline);
                console.log('formTransactionInlineData form_submitted: ', formTransactionInlineData.form_submitted);
                let formData = formTransactionInlineData.form_submitted;
                formData = (typeof formData === 'string')? JSON.parse(formData) : formData;

                for(const j_iterator of formData) {
                    if(Number(i_iterator.field_id) === Number(j_iterator.field_id)) {
                        if(util.replaceDefaultString(j_iterator.field_value) === '') {
                            responseData.push({'message': `${j_iterator.field_value} is empty`});
                            console.log('responseData : ', responseData);
                            return [true, responseData];
                        }
                        console.log('field_value : ', j_iterator.field_value);
                        i_iterator.field_value = j_iterator.field_value;
                    }
                } //End of checking for non-empty field_value                    
            } //ELSE       
            
        } //End of processing all form fields in the bot operation inline

        console.log('sortedfieldsData : ', sortedfieldsData);
        console.log('sortedfieldsData[0] : ', sortedfieldsData[0]);
        let finalResult = sortedfieldsData[0].field_value;
        for(let i=0; i<sortedfieldsData.length;i++){
            console.log('sortedfieldsData[i].join_condition : ', sortedfieldsData[i].join_condition);
            if(sortedfieldsData[i].join_condition === 'EOJ') {
                break;
            }

            console.log('sortedfieldsData[i+1].field_value : ', sortedfieldsData[i+1].field_value);
            finalResult = await performArithmeticOperation(finalResult, sortedfieldsData[i+1].field_value, sortedfieldsData[i].join_condition);
            console.log('finalResult : ', finalResult);
        }

        //Update in the target form and field Id
        let newReq = Object.assign({}, request);
            newReq.form_id = arithmeticCalculation.target_form_id;
            newReq.field_id = arithmeticCalculation.target_field_id;
        let formDataFrom713Entry = await getFormInlineData(newReq, 1);
        let formData = await getFormInlineData(newReq, 2);

        console.log('formDataFrom713Entry: ', formDataFrom713Entry);
        console.log(' ');
        console.log('formData: ', formData);
        
        let activityInlineData = [{
            form_id: arithmeticCalculation.target_form_id,
            field_id: arithmeticCalculation.target_field_id,            
            field_value: finalResult,
            message_unique_id: util.getMessageUniqueId(request.asset_id),
            field_data_type_id: arithmeticCalculation.target_field_data_type_id,
            field_data_type_category_id: arithmeticCalculation.target_field_data_type_category_id
        }];
        
        //field Alter
        let fieldsAlterRequest = Object.assign({}, request);
            fieldsAlterRequest.form_transaction_id = formDataFrom713Entry.data_form_transaction_id;
            fieldsAlterRequest.form_id = arithmeticCalculation.target_form_id;
            fieldsAlterRequest.activity_form_id = arithmeticCalculation.target_form_id;
            fieldsAlterRequest.field_id = arithmeticCalculation.target_field_id;
            fieldsAlterRequest.activity_inline_data = JSON.stringify(activityInlineData);
            fieldsAlterRequest.activity_id = formDataFrom713Entry.data_activity_id;
            fieldsAlterRequest.workflow_activity_id = request.workflow_activity_id;

        //console.log('fieldsAlterRequest :', fieldsAlterRequest);
        try {
            await alterFormActivityFieldValues(fieldsAlterRequest);
        } catch (error) {
            console.log("copyFields | alterFormActivityFieldValues | Error: ", error);
        }
        
        return [error, responseData];
    }

    async function performArithmeticOperation(fieldValue1, fieldValue2, operation) {
        let result;

        switch(operation) {
            case '+': result = fieldValue1 + fieldValue2;
                      break;
            case '-': result = fieldValue1 - fieldValue2;
                      break;
            case '*': result = fieldValue1 * fieldValue2;
                      break;
            case '/': result = fieldValue1 / fieldValue2;
                      break;
        }

        return result;
    }

    this.reminderBotVNK = async (request) => {
        //EMAIL
            //workflow_activity_id = 3128897
            //form_id, field_id = 3494, 53631

        let a = {
                "alert_type": "before",
                "date_form_id": 4467,
                "date_field_id": 220726,
                "escalation_type": "timeline",
                "escalation_target": "creator",
                "24hours_multiplier": 1,
                "asset_reference_form_id": 0,
                "asset_reference_field_id": 0
            };

            let x = {
                "alert_type": "before",
                "date_form_id": 4467,
                "date_field_id": 220726,
                "escalation_type": "timeline",
                "escalation_target": "creator",
                "24hours_multiplier": 2,
                "asset_reference_form_id": 0,
                "asset_reference_field_id": 0
                };
        
            let y = {
                    "alert_type": "before",
                    "date_form_id": 4467,
                    "date_field_id": 220726,
                    "escalation_type": "timeline",
                    "escalation_target": "creator",
                    "24hours_multiplier": 3,
                    "asset_reference_form_id": 0,
                    "asset_reference_field_id": 0
                };
        
            let z = {
                    "alert_type": "before",
                    "date_form_id": 4467,
                    "date_field_id": 220726,
                    "escalation_type": "timeline",
                    "escalation_target": "creator",
                    "24hours_multiplier": 4,
                    "asset_reference_form_id": 0,
                    "asset_reference_field_id": 0
                };
    
            await reminderBot(request, {}, a);
            await reminderBot(request, {}, x);
            await reminderBot(request, {}, y);
            await reminderBot(request, {}, z);
            return [false, []];
        }

    async function reminderBot(request, formInlineDataMap, dateReminder) {
        /*"date_reminder": {
            "date_form_id": 0,
            "date_field_id": 0,
            "asset_reference_form_id": 0,
            "asset_reference_field_id": 0,
            "alert_type": "before|after",
            "24hours_multiplier": 0,
            "escalation_target": "creator|lead|manager",
            "escalation_type": "timeline|participant|text|email"
        }*/

        request.status_id = 1;
        let escalationType = dateReminder.escalation_type;
        let alterType = dateReminder.alert_type;
        let multiplier = dateReminder['24hours_multiplier'];
        let reminderDatetime; 
        let dateFieldValue;

        try {
                let dateReq = Object.assign({}, request);
                    dateReq.form_id = dateReminder.date_form_id;
                    dateReq.field_id = dateReminder.date_field_id;
            
                let dateFormData = await getFormInlineData(dateReq, 2);               

                for(const i_iterator of dateFormData) {
                    if(Number(i_iterator.field_id) === Number(dateReminder.date_field_id)) {
                        dateFieldValue = i_iterator.field_value;
                        break;
                    }
                }
        } catch(err) {
            console.log('Unable to get the date field : ', err);
        }
        
        console.log('Retrieved Date field value : ', dateFieldValue);
        if(Number(request.device_os_id) === 1) {
            dateFieldValue = util.getFormatedLogDatetimeV1(dateFieldValue, "DD-MM-YYYY HH:mm:ss");
            console.log('Retrieved Date field value - ANDROiD: ', dateFieldValue);
        }
        
        if(alterType === 'before') {
            //reminderDatetime--;            
            reminderDatetime = util.subtractUnitsFromDateTime(dateFieldValue,multiplier,'days');
        } else if(alterType === 'after') {
            //reminderDatetime++;            
            reminderDatetime = util.addUnitsToDateTime(dateFieldValue,multiplier,'days');
        }

        //reminder_type_id
            //1 Timeline
            //2 Participant
            //3 Email
            //4 Text

        //Status ID
            //1 Added
            //2 Updated
            //3 Sent
            //4 Archived
        
        switch(escalationType) {
            case 'timeline': //post a reminder onto the timeline
                            console.log('---------- TIMELINE ENTRY -----------');
                            try{
                                let tempVar = { date_reminder: dateReminder };
                                let newReq = Object.assign({}, request);
                                    newReq.inline_data = JSON.stringify(tempVar);                                    
                                await activityCommonService.activityReminderTxnInsert(newReq, 1, reminderDatetime);
                            } catch(err) {
                                console.log('Reminder Bot - Error in updating Timeline in TXN Table: ', err);
                            }                            
                            break;

            case 'participant': try{
                                    /*let newParticipantReq = Object.assign({}, request);
                                        newParticipantReq.form_id = dateReminder.asset_reference_form_id;
                                        newParticipantReq.field_id = dateReminder.asset_reference_field_id;
                                    
                                    let participantFormData = await getFormInlineData(newParticipantReq, 2);
                                    let fieldValue = 0;

                                    //I will get the phone_Number
                                    for(const i_iterator of participantFormData) {
                                        if(Number(i_iterator.field_id) === Number(dateReminder.asset_reference_field_id)) {
                                            fieldValue = i_iterator.field_value;
                                            break;
                                        }
                                    }

                                    let tempVar = { participant: fieldValue,
                                                    date_reminder:  dateReminder                                                    
                                                  };*/

                                    let tempVar = { date_reminder:  dateReminder };
                                    let newReq = Object.assign({}, request);
                                        newReq.inline_data = JSON.stringify(tempVar);
                                    await activityCommonService.activityReminderTxnInsert(newReq, 2, reminderDatetime);
                                } catch(err) {
                                    console.log('Reminder Bot - Error in updating Participant in TXN Table: ', err);
                                }
                                break;

            case 'email': //Send an email reminder
                                try{                                    
                                   let tempVar = { date_reminder:  dateReminder };       
                                   let newReq = Object.assign({}, request);
                                       newReq.inline_data = JSON.stringify(tempVar);       
                                   await activityCommonService.activityReminderTxnInsert(newReq, 3, reminderDatetime);
                                } catch(err) {
                                   console.log('Reminder Bot - Error in updating Email in TXN Table: ', err);
                                }
                                 break;

            case 'text': //Send a text(sms) reminder   
                        try{                           
                            let tempVar = { date_reminder:  dateReminder };
                            let newReq = Object.assign({}, request);
                                newReq.inline_data = JSON.stringify(tempVar);
                            await activityCommonService.activityReminderTxnInsert(newReq, 4, reminderDatetime);
                        } catch(err) {
                            console.log('Reminder Bot - Error in updating Text in TXN Table: ', err);
                        }
                        break;            
                }

    }

    async function getFormInlineData(request, flag) {
        //flag 
        // 1. Send the entire formdata 713
        // 2. Send only the submitted form_data
         //3. Send both

        let formData = [];
        let formDataFrom713Entry = await activityCommonService.getActivityTimelineTransactionByFormId713(request, request.workflow_activity_id, request.form_id);
        if(!formDataFrom713Entry.length > 0) {
            let responseData = [];
            responseData.push({'message': `${i_iterator.form_id} is not submitted`});
            console.log('responseData : ', responseData);
            return [true, responseData];
        }

        //console.log('formDataFrom713Entry[0] : ', formDataFrom713Entry[0]);
        let formTransactionInlineData = JSON.parse(formDataFrom713Entry[0].data_entity_inline);
        //console.log('formTransactionInlineData form Submitted: ', formTransactionInlineData.form_submitted);
        formData = formTransactionInlineData.form_submitted;
        formData = (typeof formData === 'string')? JSON.parse(formData) : formData;

        switch(Number(flag)) {
            case 1: return formDataFrom713Entry[0];
            case 2: return formData;            
            case 3: break;
            default: return formData;
        }        
    }

    this.reminderBotExecution = async() => {
        let request = {};
            request.workflow_activity_id = 0;
            request.organization_id = 0;
            request.start_datetime = util.getDayStartDatetimeIST(); //util.getDayStartDatetime();
            request.end_datetime = util.getDayEndDatetimeIST(); //util.getDayEndDatetime();
            //request.start_datetime = util.getDayStartDatetime();
            //request.end_datetime = util.getDayEndDatetime();
            request.flag = 0;
            //request.start_from = 0;
            request.limit_value = 50;

        reminderBotExecutionFn(request, 0);

        let [err, reminderBotData] = await activityCommonService.activityReminderTxnSelect(request);

        let responseData = [];
            responseData.push({'No.Of.Reminders': reminderBotData.length, 'triggered_datetime': util.getCurrentISTTime()});

        return [false, responseData];
    }    

    //async function reminderBotExecutionIntermediateFn() {
    //    //Get the total Count and process them 50 Each
    //}

    async function reminderBotExecutionFn(request, startFrom) {
        let responseData = [],
            error = false;
        let inlineData;        
        
        request.start_from = startFrom;
        let [err, reminderBotData] = await activityCommonService.activityReminderTxnSelect(request);

        console.log('reminderBotData : ', reminderBotData);        
        
        let activityData;
        let assetID;
        let managerAssetID;
        let assetDetails;
        let emailID;
        let emailReceiverName;
        let textPhCtyCode;
        let textPhNo;
        let dateReminder;

        for(const i_iterator of reminderBotData) {
            //reminder_type_id
                //1 Timeline
                //2 Participant
                //3 Email
                //4 Text

            //Status ID
                //1 Added
                //2 Updated
                //3 Sent
                //4 Archived

            inlineData = JSON.parse(i_iterator.reminder_inline_data);
            dateReminder = inlineData.date_reminder;
            switch(Number(i_iterator.reminder_type_id)) {
                case 1: //Add timeline Entry
                        console.log('---------- TIMELINE ENTRY -----------');
                        await addTimelineEntry(i_iterator,0);
                        break;

                case 2: //Add Participant     
                        console.log('---------- PARTICIPANT -----------');                   
                        let participantReq = {
                                asset_reference: {
                                    form_id: dateReminder.asset_reference_form_id,
                                    field_id: dateReminder.asset_reference_field_id
                                }
                            }
                        i_iterator.workflow_activity_id = i_iterator.activity_id;
                        let formInlineDataMap = new Map();
                        formInlineDataMap.set(Number(dateReminder.asset_reference_field_id), 1);
                        await addParticipant(i_iterator, participantReq, formInlineDataMap);
                        break;

                case 3: //Send email                        
                case 4: //Send Text
                        if(Number(i_iterator.reminder_type_id) === 3) {
                            console.log('---------- EMAIL -----------');
                        } else if(Number(i_iterator.reminder_type_id) === 4) {
                            console.log('---------- TEXT -----------');
                        }
                        activityData = await activityCommonService.getActivityDetailsPromise({ organization_id: i_iterator.organization_id }, 
                                                                                       i_iterator.activity_id);
                        
                        //console.log('activityData : ', activityData);
                        console.log(inlineData);
                        console.log('inlineData.escalation_target : ', dateReminder.escalation_target);
                        //Get the lead email ID
                        if(dateReminder.escalation_target === 'creator') {
                            assetID = activityData[0].activity_creator_asset_id;

                            assetDetails = await getAssetDetails({
                                "organization_id": i_iterator.organization_id,
                                "asset_id": assetID
                            });

                            emailID = assetDetails[0].operating_asset_email_id;
                            emailReceiverName = assetDetails[0].operating_asset_first_name;
                            textPhCtyCode = assetDetails[0].operating_asset_phone_country_code;
                            textPhNo = assetDetails[0].operating_asset_phone_number;

                            /*Operating Asset Detais
                            //activityData[0].activity_creator_operating_asset_id
                            //operating_asset_phone_country_code
                            //operating_asset_phone_number
                            //operating_asset_email_id
                            /************************** */

                        } else if(dateReminder.escalation_target === 'lead') {
                            assetID = activityData[0].activity_lead_asset_id;

                            assetDetails = await getAssetDetails({
                                "organization_id": i_iterator.organization_id,
                                "asset_id": assetID
                            });

                            emailID = assetDetails[0].operating_asset_email_id;
                            emailReceiverName = assetDetails[0].operating_asset_first_name;
                            textPhCtyCode = assetDetails[0].operating_asset_phone_country_code;
                            textPhNo = assetDetails[0].operating_asset_phone_number;

                            ///activityData[0].activity_lead_operating_asset_id
                        } else if(dateReminder.escalation_target === 'manager') {                            
                            //if the lead is set and send to the lead's manager
                            if((activityData[0].activity_lead_asset_id !==null) && (Number(activityData[0].activity_lead_asset_id) !==0)) {                                
                                assetDetails = await getAssetDetails({
                                                                        "organization_id": i_iterator.organization_id,
                                                                        "asset_id": Number(activityData[0].activity_lead_asset_id)
                                                                    });

                                managerAssetID = Number(assetDetails[0].manager_asset_id);
                                console.log('Manager Asset ID : ', managerAssetID);

                                assetDetails = await getAssetDetails({
                                    "organization_id": i_iterator.organization_id,
                                    "asset_id": managerAssetID
                                });
                                
                                //Manager asset Details
                                emailID = assetDetails[0].operating_asset_email_id;
                                emailReceiverName = assetDetails[0].operating_asset_first_name;
                                textPhCtyCode = assetDetails[0].operating_asset_phone_country_code;
                                textPhNo = assetDetails[0].operating_asset_phone_number;
                            } //else send to the creator lead's manager 
                            else {  
                                assetDetails = await getAssetDetails({
                                    "organization_id": i_iterator.organization_id,
                                    "asset_id": Number(activityData[0].activity_creator_asset_id)
                                });

                                managerAssetID = Number(assetDetails[0].manager_asset_id);
                                console.log('Manager Asset ID : ', managerAssetID);

                                assetDetails = await getAssetDetails({
                                    "organization_id": i_iterator.organization_id,
                                    "asset_id": managerAssetID
                                });
                                
                                //Manager asset Details
                                emailID = assetDetails[0].operating_asset_email_id;
                                emailReceiverName = assetDetails[0].operating_asset_first_name;
                                textPhCtyCode = assetDetails[0].operating_asset_phone_country_code;
                                textPhNo = assetDetails[0].operating_asset_phone_number;
                            }                            
                        }
                        
                        if(Number(i_iterator.reminder_type_id) === 3) {
                            const emailSubject = `Reminder for ${i_iterator.activity_title}!`;
                            const emailBody = `This is a scheduled reminder for ${i_iterator.activity_title}!`;
                            const htmlTemplate = Buffer.from(JSON.stringify(emailBody)).toString('base64');

                            let req = {};
                                req.email_sender = 'reminders@grenerobotics.com';
                                req.email_sender_name = 'GreneOS';
                                req.email_receiver_name = emailReceiverName;

                            //Send email                            
                            await new Promise((resolve, reject)=>{
                                util.sendEmailV4(req, emailID, emailSubject, emailBody, htmlTemplate, ()=>{
                                    resolve();
                                });
                            });                            
                        } else if(Number(i_iterator.reminder_type_id) === 4) {
                            const text = `This is a scheduled reminder for ${i_iterator.activity_title}!`;
                            console.log('Phone Number with country code : ', textPhCtyCode, textPhNo);
                            
                            //Send text                            
                            await new Promise((resolve, reject)=>{
                                util.sendSmsSinfiniV1(text, textPhCtyCode, textPhNo, 'GRNEOS', ()=>{
                                    resolve();
                                });
                            });                            
                        }                     
                        break;                
            }
            await activityCommonService.activityReminderTxnUpdate({
                reminder_trx_id: i_iterator.reminder_transaction_id,
                workflow_activity_id: i_iterator.activity_id,
                organization_id: i_iterator.organization_id,
                status_id: 3
            });
            
            console.log(' ');
            console.log('********************************************************');
            console.log(' ');
        } //End of For Loop

        if(reminderBotData.length === 50) {
            startFrom = startFrom + 50; 
            await reminderBotExecutionFn(request, startFrom);
        }

        return [error, responseData];
    }

    this.callAddTimelineEntry = async(request) => {        
        await addTimelineEntry(request, 1);
        return [false, []];
    }
    
    async function addTimelineEntry(request, flag) {
        
        let addCommentRequest = Object.assign(request, {});

        addCommentRequest.asset_id = 100;
        addCommentRequest.device_os_id = 7;
        //addCommentRequest.activity_type_category_id = 48;
        //addCommentRequest.activity_type_id = workflowActivityTypeID;
        //addCommentRequest.activity_id = workflowActivityID;
        if(flag === 1) {
            addCommentRequest = {...request};
            addCommentRequest.activity_timeline_collection = JSON.stringify({
                "content": request.content,
                "subject": request.subject,
                "mail_body": "{}",
                "attachments": []
            });
           
            addCommentRequest.activity_stream_type_id = 325;
            addCommentRequest.timeline_stream_type_id = 325;
            
            
        } else {
            addCommentRequest.activity_timeline_collection = JSON.stringify({
                "content": `This is a scheduled reminder for the file - ${request.activity_title}`,
                "subject": `This is a scheduled reminder for the file - ${request.activity_title}`,
                "mail_body": `This is a scheduled reminder for the file - ${request.activity_title}`,
                "attachments": []
            });
            addCommentRequest.activity_stream_type_id = 325;
            addCommentRequest.timeline_stream_type_id = 325;
        }
        
        addCommentRequest.activity_timeline_text = "";
        addCommentRequest.activity_access_role_id = 27;
        addCommentRequest.operating_asset_first_name = "TONY"
        addCommentRequest.datetime_log = util.getCurrentUTCTime();
        addCommentRequest.track_gps_datetime = util.getCurrentUTCTime();
        addCommentRequest.flag_timeline_entry = 1;
        addCommentRequest.log_asset_id = 100;
        addCommentRequest.message_unique_id = util.getMessageUniqueId(100);
        //addCommentRequest.attachment_type_id = 17;
        //addCommentRequest.attachment_type_name = path.basename(attachmentsList[0]);
        
        try {
            await activityTimelineService.addTimelineTransactionAsync(addCommentRequest);        
        } catch (error) {
            console.log("Reminder Bot trigger - timeline entry failed : ", error);
            //throw new Error(error);
        }

        return "success";
    }   
    
    
    async function unassignParticipantFunc(request, activityID, assetID) {
        console.log('Unassigning the participant!');

        let trackGpsDatetime = request.track_gps_datetime || util.getCurrentUTCTime();

        let removeParticipantRequest = {
                organization_id: request.organization_id,
                account_id: request.account_id,
                workforce_id: request.workforce_id,
                activity_id: activityID,
                asset_id: request.asset_id,
                asset_token_auth: request.asset_token_auth,
                activity_participant_collection: JSON.stringify([]), // Placeholder
                api_version: request.api_version,
                app_version: request.app_version,
                asset_message_counter: request.asset_message_counter,
                device_os_id: request.device_os_id,
                flag_offline: request.flag_offline,
                flag_retry: request.flag_retry,
                message_unique_id: request.message_unique_id,
                service_version: request.service_version,
                track_gps_accuracy: request.track_gps_accuracy,
                track_gps_datetime: trackGpsDatetime,
                track_gps_location: request.track_gps_location,
                track_gps_status: request.track_gps_status,
                track_latitude: request.track_latitude,
                track_longitude: request.track_longitude
            };

        try {
            const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
                organization_id: request.organization_id,
                asset_id: assetID
            });

            console.log("removeParticipant | error: ", error);
            if (assetData.length > 0) {
                removeParticipantRequest.activity_participant_collection = JSON.stringify([
                    {
                        "organization_id": assetData[0].organization_id,
                        "account_id": assetData[0].account_id,
                        "workforce_id": assetData[0].workforce_id,
                        "asset_type_id": assetData[0].asset_type_id,
                        "asset_category_id": assetData[0].asset_type_category_id,
                        "asset_id": assetID,
                        "access_role_id": 0,
                        "message_unique_id": util.getMessageUniqueId(assetData[0].asset_id)
                    }
                ]);
            }
        } catch (error) {
            throw new Error(error);
        }

        try {
            await activityParticipantService.unassignParticicpant(removeParticipantRequest);
        } catch (error) {
            throw new Error(error);
        }

        return;
    }

    async function bulkFeasibilityBot(request, formInlineDataMap = new Map(), botOperationInlineData = {}) {
        await sleep(2000);
        const MAX_ORDERS_TO_BE_PARSED = 100;

        let workflowActivityID = Number(request.workflow_activity_id) || 0,
            workflowActivityCategoryTypeID = 0,
            workflowActivityTypeID = 0,
            bulkUploadFormTransactionID = 0,
            bulkUploadFormActivityID = 0,
            opportunityID = "",
            sqsQueueUrl = "",
            solutionDocumentUrl = "";

        const triggerFormID = request.trigger_form_id,
            triggerFormName = request.trigger_form_name,
            triggerFieldID = request.trigger_field_id,
            triggerFieldName = request.trigger_field_name,
            // Form and Field for getting the excel file's 
            bulkUploadFormID = botOperationInlineData.bulk_upload.form_id || 0,
            bulkUploadFieldID = botOperationInlineData.bulk_upload.field_id || 0,
            solutionDocumentFormID = botOperationInlineData.solution_document.form_id || 0,
            solutionDocumentFieldID = botOperationInlineData.solution_document.field_id || 0;

        switch (process.env.mode) {
            case "local":
                sqsQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/local-vil-bulk-feasibility-jobs-queue.fifo"
                break;

            // case "staging":
            case "preprod":
                sqsQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/staging-vil-bulk-feasibility-jobs-queue"
                break;

            case "prod":
            case "production":
                sqsQueueUrl = "https://sqs.ap-south-1.amazonaws.com/430506864995/production-vil-bulk-feasibility-jobs-queue"
                break;

        }
        try {
            const workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
            if (Number(workflowActivityData.length) > 0) {
                workflowActivityCategoryTypeID = Number(workflowActivityData[0].activity_type_category_id);
                workflowActivityTypeID = Number(workflowActivityData[0].activity_type_id);
                opportunityID = workflowActivityData[0].activity_cuid_1;
            }
        } catch (error) {
            throw new Error("No Workflow Data Found in DB");
        }

        if (workflowActivityID === 0 || workflowActivityTypeID === 0 || opportunityID === "") {
            throw new Error("Couldn't Fetch workflowActivityID or workflowActivityTypeID");
        }

        if (bulkUploadFormID === 0 || bulkUploadFieldID === 0) {
            throw new Error("Form ID and field ID not defined to fetch excel for bulk upload");
        }

        // Fetch the bulk upload excel's S3 URL
        const bulkUploadFormData = await activityCommonService.getActivityTimelineTransactionByFormId713({
            organization_id: request.organization_id,
            account_id: request.account_id
        }, workflowActivityID, bulkUploadFormID);

        if (Number(bulkUploadFormData.length) > 0) {
            bulkUploadFormActivityID = Number(bulkUploadFormData[0].data_activity_id);
            bulkUploadFormTransactionID = Number(bulkUploadFormData[0].data_form_transaction_id);
        }

        if (bulkUploadFormActivityID === 0 || bulkUploadFormTransactionID === 0) {
            throw new Error("Form to bulk upload feasibility is not submitted");
        }

        // Fetch the solution document URL
        const solutionBulkUploadFieldData = await getFieldValue({
            form_transaction_id: bulkUploadFormTransactionID,
            form_id: solutionDocumentFormID,
            field_id: solutionDocumentFieldID,
            organization_id: request.organization_id
        });
        if (solutionBulkUploadFieldData.length > 0) {
            solutionDocumentUrl = solutionBulkUploadFieldData[0].data_entity_text_1
        }

        // Fetch the excel URL
        const bulkUploadFieldData = await getFieldValue({
            form_transaction_id: bulkUploadFormTransactionID,
            form_id: bulkUploadFormID,
            field_id: bulkUploadFieldID,
            organization_id: request.organization_id
        });
        if (bulkUploadFieldData.length === 0) {
            throw new Error("Field to fetch the bulk upload excel file not submitted");
        }

        // Get the count of child orders.
        let childOpportunitiesCountOffset = 0;
        const [errorZero, childOpportunitiesCount] = await activityListSelectChildOrderCount({
            organization_id: request.organization_id,
            activity_type_category_id: workflowActivityCategoryTypeID,
            activity_type_id: workflowActivityTypeID,
            parent_activity_id: workflowActivityID,
        })
        if (childOpportunitiesCount.length > 0) {
            childOpportunitiesCountOffset = Number(childOpportunitiesCount[0].count) + 1;
        }

        // const urlKey = `858/974/5353/31476/2018/11/103/1604082465622/OPP-C-000196-260820-_-Bulk-3.xlsx`;
        // bulkUploadFieldData[0].data_entity_text_1 = `https://worlddesk-2020-10.s3.amazonaws.com/${urlKey}`;
        console.log("bulkUploadFieldData[0].data_entity_text_1: ", bulkUploadFieldData[0].data_entity_text_1);
        const [xlsxDataBodyError, xlsxDataBody] = await util.getXlsxDataBodyFromS3Url(request, bulkUploadFieldData[0].data_entity_text_1);
        if (xlsxDataBodyError) {
            throw new Error(xlsxDataBodyError);
        }

        const workbook = XLSX.read(xlsxDataBody, { type: "buffer", cellStyles: false });
        // Select sheet
        const sheet_names = workbook.SheetNames;
        logger.silly("sheet_names: %j", sheet_names);

        const headersArray = [
            "serialNum", "actionType", "OppId", "ServiceType", "LinkType", "IsNewFeasibilityRequest", "UpgradeOrDowngrade", "OrderID", "CircuitID", "BandwidthAmount",
            "BandwidthUnit", "InterfaceEndA", "CustomerNameEndA", "ContactPersonEmailIdEndA", "ContactNoEndA", "AlternateContactNumberEndA", "SearchBuildingIdEndA",
            "StreetFloorNameEndA", "SearchAreaEndA", "SearchPinEndA", "SearchCityEndA", "CircleEndA", "StateEndA", "CountryEndA", "IsThelocationADataCenterEndA",
            "RackNoEndA", "CageNoEndA", "AddressEndA", "SpecialInstructionsBySalesEndA", "SolutionDocRequiredEndA", "InterfaceEndB", "CustomerNameEndB",
            "ContactPersonEmailIdEndB", "ContactNoEndB", "AlternateContactNumberEndB", "SearchBuildingIdEndB", "StreetFloorNameEndB", "SearchAreaEndB",
            "SearchPinEndB", "SearchCityEndB", "CircleEndB", "StateEndB", "CountryEndB", "IsThelocationADataCenterEndB", "RackNoEndB", "CageNoEndB",
            "AddressEndB", "SpecialInstructionsBySalesEndB", "SolutionDocRequiredEndB", "IsVPNExtendedConnectSISA", "IsVPNExtendedConnect", "ConnectionType",
            "CodecRequired", "AudioCodecType", "VideoCodecType", "NumberOfAudioSession", "NumberOfVideoSession", "AdditionalBandwidth", "AdditionalBandwidthUnit",
            "SuperWiFiFlavour", "SuperWiFiVendor", "SuperWiFiExistingService", "SuperWiFiExistingWANCircuitId", "SuperWiFiExistingInterface", "SuperWiFiExistingLastMile",
            "MSBPOP", "IsLastMileOnNetWireline", "IsWirelessUBR", "IsWireless3G", "IsWireless4G", "IsCableAndWirelessCustomer", "A_Latitude", "A_Longitude",
            "B_Latitude", "B_Longitude", "LastMileName", "RejectionRemarks", "IsLastMileOffNet", "LastMileOffNetVendor", "ReSubmissionRemarksEndA", "ReSubmissionRemarksEndB",
            "SalesRemarks", "ReasonForCloning"
        ];

        const childOpportunitiesArray = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_names[0]], { header: headersArray });
        // console.log({ length: childOpportunitiesArray.length });
        // console.log({ childOpportunitiesArray });
        let errorMessageJSON = {
            errorExists: false,
            action: {
                new: {
                    message: "The following opportunity IDs couldn't be created because they already exist:\n",
                    opportunity_ids: []
                },
                correction: {
                    message: "The following opportunity IDs couldn't be corrected because they don't exist:\n",
                    opportunity_ids: []
                },
                new_secondary: {
                    message: "Secondary FR cannot be created on the following opportunity IDs because their primary FRs don't exist:\n",
                    opportunity_ids: []
                },
                correction_secondary: {
                    message: "Secondary FR creation cannot be corrected on the following opportunity IDs because their primary FRs don't exist:\n",
                    opportunity_ids: []
                },
                refeasibility_rejected_by_am: {
                    message: "Rejection by Account Manager cannot be initiated on the following opportunity IDs:\n",
                    opportunity_ids: []
                },
                refeasibility_rejected_by_fes: {
                    message: "Resubmission cannot be initiated on the following opportunity IDs:\n",
                    opportunity_ids: []
                },
                cloning_primary: {
                    message: "Cloning cannot be initiated on the following opportunity IDs, because their primary FRs don't exist:\n",
                    opportunity_ids: []
                },
                cloning_secondary: {
                    message: "Cloning cannot be initiated on the following opportunity IDs, because their secondary FRs don't exist:\n",
                    opportunity_ids: []
                }
            }
        };

        // PreProcessinf Stage 1
        let groupedJobsMap = new Map();
        let childOpportunityIDToDualFlagMap = new Map();
        for (let i = 2; i < childOpportunitiesArray.length; i++) {
            const childOpportunity = childOpportunitiesArray[i];

            // Applies only to first upload and subsequent corrections
            if (!(childOpportunity.actionType === "new" || childOpportunity.actionType === "correction")) {
                continue;
            }

            if (solutionDocumentUrl !== "") { childOpportunity.FilePath = solutionDocumentUrl }

            const linkType = String(childOpportunity.LinkType).toLowerCase();
            const serialNumber = childOpportunity.serialNum;
            const childOpportunityID = `${opportunityID}-${serialNumber}`;
            childOpportunityIDToDualFlagMap.set(childOpportunityID, false);

            if (groupedJobsMap.has(childOpportunityID)) {
                let jobInlineJSON = groupedJobsMap.get(childOpportunityID);
                if (linkType === "primary") { jobInlineJSON.bulk_job.primary = childOpportunity }
                if (linkType === "secondary") { jobInlineJSON.bulk_job.secondary = childOpportunity }

                groupedJobsMap.set(childOpportunityID, jobInlineJSON)
                childOpportunityIDToDualFlagMap.set(childOpportunityID, true);
                dualBulkJobTransactionUpdate({
                    child_opportunity_id: childOpportunityID,
                    parent_workflow_activity_id: workflowActivityID,
                    bulk_inline_data: JSON.stringify(jobInlineJSON),
                    activity_flag_secondary: 1
                })
            } else {
                let jobInlineJSON = {
                    bulk_job: {
                        metadata: {
                            child_opportunity_id: childOpportunityID,
                            opportunity_id: opportunityID,
                            workflow_activity_id: workflowActivityID,
                            workflow_activity_type_id: workflowActivityTypeID,
                            feasibility_form_id: triggerFormID
                        },
                        primary: {},
                        secondary: {}
                    }
                }
                if (linkType === "primary") { jobInlineJSON.bulk_job.primary = childOpportunity }
                if (linkType === "secondary") { jobInlineJSON.bulk_job.secondary = childOpportunity }
                groupedJobsMap.set(childOpportunityID, jobInlineJSON)
            }
        }
        // console.log("groupedJobsMap: ", groupedJobsMap);

        for (let i = 2; i < childOpportunitiesArray.length; i++) {
            const childOpportunity = childOpportunitiesArray[i];
            console.log(`IsNewFeasibilityRequest: ${childOpportunity.IsNewFeasibilityRequest} | serialNum: ${childOpportunity.serialNum} | actionType: ${childOpportunity.actionType}`);
            if (
                !childOpportunity.hasOwnProperty("IsNewFeasibilityRequest") ||
                childOpportunity.IsNewFeasibilityRequest === "" ||
                !childOpportunity.hasOwnProperty("actionType") ||
                !(childOpportunity.actionType === "new" || childOpportunity.actionType === "correction" || childOpportunity.actionType === "refeasibility_rejected_by_fes" || childOpportunity.actionType === "refeasibility_rejected_by_am" || childOpportunity.actionType === "cloning") ||
                !childOpportunity.hasOwnProperty("LinkType") ||
                !(String(childOpportunity.LinkType).toLowerCase() === "primary" || String(childOpportunity.LinkType).toLowerCase() === "secondary") ||
                !childOpportunity.hasOwnProperty("serialNum") ||
                Number(childOpportunity.serialNum) <= 0
            ) {
                break;
            }

            let childOpportunityID = "";
            const linkType = String(childOpportunity.LinkType).toLowerCase();
            // If actionType === correction, assert that OppId is populated. Otherwise
            // just move to the next row 
            if (childOpportunity.actionType === "correction" && childOpportunity.OppId === "") {
                continue;
            }
            // If actionType === correction, assert that the child opportunity exists
            if (childOpportunity.actionType === "correction" && childOpportunity.OppId !== "") {
                const [errorOne, childOpportunityData] = await activityListSearchCUID({
                    organization_id: request.organization_id,
                    activity_type_category_id: workflowActivityCategoryTypeID,
                    flag: 1,
                    search_string: childOpportunity.OppId
                });
                // Primary
                if (childOpportunityData.length === 0) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.correction.opportunity_ids.push(childOpportunity.OppId);
                    continue;
                }
                // Secondary
                const primaryFRID = childOpportunityData[0].activity_cuid_2 || "";
                if (
                    linkType === "secondary" &&
                    !String(primaryFRID).startsWith("FR")
                ) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.correction_secondary.opportunity_ids.push(childOpportunity.OppId);
                    continue;
                }
                childOpportunityID = childOpportunity.OppId;
            }

            // Do not freshly generate child opportunities, revert back to suffixing an
            // incremental offset to the parent's opportunity ID
            // const [error, response] = await generateChildOppurtunityIDNoSet(request, opportunityID);
            // if (error) {
            //     continue;
            // }
            const serialNumber = childOpportunity.serialNum;
            if (childOpportunity.actionType === "new") {
                // Do not depend on the total number of child orders created already
                // for deciding on the serial number offset for naming the child orders
                // ++childOpportunitiesCountOffset;
                // childOpportunityID = `${opportunityID}-${childOpportunitiesCountOffset}`;

                // Depend on the serial number explicitly entered by the user in the excel sheet

                if (linkType === "primary") { childOpportunityID = `${opportunityID}-${serialNumber}`; }

                // Skip pushing secondary creation job for dual creation cases to SQS
                const isDualJob = childOpportunityIDToDualFlagMap.get(`${opportunityID}-${serialNumber}`);
                if (linkType === "secondary" && isDualJob) { continue; }

                if (linkType === "secondary") { childOpportunityID = childOpportunity.OppId || ""; }
                if (childOpportunityID === "") { continue; }

                // Check if the child opportunity already exists
                const [errorTwo, childOpportunityData] = await activityListSearchCUID({
                    organization_id: request.organization_id,
                    activity_type_category_id: workflowActivityCategoryTypeID,
                    flag: 1,
                    search_string: childOpportunityID
                });

                if (
                    linkType === "primary" &&
                    childOpportunityData.length > 0
                ) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.new.opportunity_ids.push(childOpportunityID);
                    continue;
                }

                if (
                    linkType === "secondary" &&
                    childOpportunityData.length > 0 &&
                    !String(childOpportunityData[0].activity_cuid_2).startsWith("FR")
                ) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.new_secondary.opportunity_ids.push(childOpportunityID);
                    continue;
                }

                childOpportunity.OppId = childOpportunityID;
            }

            if (childOpportunity.actionType === "refeasibility_rejected_by_am") {
                if (childOpportunity.OppId === "") { continue; }

                childOpportunityID = childOpportunity.OppId;

                // Check if the child opportunity already exists
                const [errorThree, childOpportunityData] = await activityListSearchCUID({
                    organization_id: request.organization_id,
                    activity_type_category_id: workflowActivityCategoryTypeID,
                    flag: 1,
                    search_string: childOpportunityID
                });
                if (!(childOpportunityData.length > 0)) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.refeasibility_rejected_by_am.opportunity_ids.push(childOpportunityID);
                    continue;
                }
                const primaryFRID = childOpportunityData[0].activity_cuid_2 || "";
                const secondaryFRID = childOpportunityData[0].activity_cuid_3 || "";

                if (
                    (linkType === "primary" && !String(primaryFRID).startsWith("FR")) ||
                    (linkType === "secondary" && !String(secondaryFRID).startsWith("FR"))
                ) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.refeasibility_rejected_by_am.opportunity_ids.push(childOpportunityID);
                    continue;
                }
            }

            if (childOpportunity.actionType === "refeasibility_rejected_by_fes") {
                if (childOpportunity.OppId === "") { continue; }

                childOpportunityID = childOpportunity.OppId;

                // Check if the child opportunity already exists
                const [errorFour, childOpportunityData] = await activityListSearchCUID({
                    organization_id: request.organization_id,
                    activity_type_category_id: workflowActivityCategoryTypeID,
                    flag: 1,
                    search_string: childOpportunityID
                });
                if (!(childOpportunityData.length > 0)) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.refeasibility_rejected_by_fes.opportunity_ids.push(childOpportunityID);
                    continue;
                }
                const primaryFRID = childOpportunityData[0].activity_cuid_2 || "";
                const secondaryFRID = childOpportunityData[0].activity_cuid_3 || "";

                if (
                    (linkType === "primary" && !String(primaryFRID).startsWith("FR")) ||
                    (linkType === "secondary" && !String(secondaryFRID).startsWith("FR"))
                ) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.refeasibility_rejected_by_fes.opportunity_ids.push(childOpportunityID);
                    continue;
                }
            }

            if (childOpportunity.actionType === "cloning") {
                if (childOpportunity.OppId === "") { continue; }

                childOpportunityID = childOpportunity.OppId;

                // Check if the child opportunity already exists
                const [errorFive, childOpportunityData] = await activityListSearchCUID({
                    organization_id: request.organization_id,
                    activity_type_category_id: workflowActivityCategoryTypeID,
                    flag: 1,
                    search_string: childOpportunityID
                });
                if (!(childOpportunityData.length > 0)) {
                    errorMessageJSON.errorExists = true;
                    // errorMessageJSON.action.refeasibility_rejected_by_fes.opportunity_ids.push(childOpportunityID);
                    continue;
                }
                const primaryFRID = childOpportunityData[0].activity_cuid_2 || "";
                const secondaryFRID = childOpportunityData[0].activity_cuid_3 || "";

                if (linkType === "primary" && !String(primaryFRID).startsWith("FR")) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.cloning_primary.opportunity_ids.push(childOpportunityID);
                    continue;
                }

                if (linkType === "secondary" && !String(secondaryFRID).startsWith("FR")) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.cloning_secondary.opportunity_ids.push(childOpportunityID);
                    continue;
                }
            }

            if (solutionDocumentUrl !== "") { childOpportunity.FilePath = solutionDocumentUrl }

            const LastMileOffNetVendor = String(childOpportunity.LastMileOffNetVendor) || "";
            if (
                LastMileOffNetVendor !== "" &&
                LastMileOffNetVendor.includes(",")
            ) {
                childOpportunity.LastMileOffNetVendor = LastMileOffNetVendor.split(",").join("|")
            }
            const bulkJobRequest = {
                workflow_activity_id: workflowActivityID,
                workflow_activity_type_id: workflowActivityTypeID,
                opportunity_id: opportunityID,
                child_opportunity_id: childOpportunityID,
                childOpportunity: childOpportunity,
                feasibility_form_id: triggerFormID
            }

            // console.log("bulkJobRequest: ", JSON.stringify(bulkJobRequest));
            // continue;
            sqs.sendMessage({
                // DelaySeconds: 5,
                MessageBody: JSON.stringify(bulkJobRequest),
                QueueUrl: sqsQueueUrl,
                // MessageGroupId: `excel-processing-job-queue-v1`,
                // MessageDeduplicationId: uuidv4(),
                MessageAttributes: {
                    "Environment": {
                        DataType: "String",
                        StringValue: global.mode
                    },
                }
            }, (error, data) => {
                if (error) {
                    logger.error("Error sending excel job to SQS queue", { type: 'bot_engine', error: serializeError(error), request_body: request });
                } else {
                    logger.info("Successfully sent excel job to SQS queue: %j", data, { type: 'bot_engine', request_body: request });
                }
            });
        }

        try {
            if (!errorMessageJSON.errorExists) { throw new Error("NoErrorsFound") };
            let formattedTimelineMessage = `Errors found while parsing the bulk excel:\n\n`
            for (const errorCategory of Object.keys(errorMessageJSON.action)) {
                if (Number(errorMessageJSON.action[errorCategory].opportunity_ids.length) > 0) {
                    formattedTimelineMessage += errorMessageJSON.action[errorCategory].message;
                    formattedTimelineMessage += `${errorMessageJSON.action[errorCategory].opportunity_ids.join(', ')}\n\n`;
                }
            }

            await addTimelineMessage(
                {
                    activity_timeline_text: "",
                    organization_id: request.organization_id
                }, workflowActivityID || 0,
                {
                    subject: 'Errors found while parsing the bulk excel',
                    content: formattedTimelineMessage,
                    mail_body: formattedTimelineMessage,
                    attachments: []
                }
            );
        } catch (error) {
            logger.error("Error logging the error message to the timeline", { type: "bulk_feasibility", error: serializeError(error) });
        }

        return;
    }

    async function dualBulkJobTransactionUpdate(request) {
        try {
            const [errorOne, _] = await vodafoneActivityBulkFeasibilityMappingInsert(request);
            if (errorOne && errorOne.code === "ER_DUP_ENTRY") {
                const [errorTwo, _] = await vodafoneActivityBulkFeasibilityMappingUpdate(request);
                if (errorTwo) { throw new Error(errorTwo) }
            } else if (errorOne) {
                throw errorOne;
            }
        } catch (error) {
            logger.error("Error registering dual bulk job transaction", { type: "bulk_feasibility", error: serializeError(error) });
        }
    }

    async function vodafoneActivityBulkFeasibilityMappingInsert(request) {
        let error = true,
            responseData = [];

        const paramsArr = new Array(
            request.child_opportunity_id,
            request.parent_workflow_activity_id,
            request.bulk_inline_data || "{}",
            request.activity_flag_secondary || 0
        );
        const queryString = util.getQueryString('ds_p1_vodafone_activity_bulk_feasibility_mapping_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };

    async function vodafoneActivityBulkFeasibilityMappingUpdate(request) {
        let error = true,
            responseData = [];

        const paramsArr = new Array(
            request.child_opportunity_id,
            request.parent_workflow_activity_id,
            request.bulk_inline_data || "{}",
            request.activity_flag_secondary || 0
        );
        const queryString = util.getQueryString('ds_p1_vodafone_activity_bulk_feasibility_mapping_update', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };

    async function addTimelineMessage(request, workflowActivityID, timelineMessageObject = {}, streamTypeID = 325) {
        // Make a 705 timeline transaction entry in the workflow file
        // Get the Opportunity Workflow's details:
        const [errorZero, workflowActivityData] = await getActivityDetailsAsync({
            organization_id: request.organization_id,
        }, workflowActivityID);

        if (
            Number(workflowActivityID) > 0 &&
            workflowActivityData.length > 0
        ) {
            let workflowTimelineRequest = {
                "organization_id": workflowActivityData[0].organization_id,
                "account_id": workflowActivityData[0].account_id,
                "workforce_id": workflowActivityData[0].workforce_id,
                "asset_id": workflowActivityData[0].asset_id || 100,
                "track_gps_datetime": util.getCurrentUTCTime(),
                "activity_type_category_id": workflowActivityData[0].activity_type_category_id,
                "activity_type_id": workflowActivityData[0].activity_type_id,
                "activity_id": workflowActivityID,
                "activity_timeline_collection": JSON.stringify(timelineMessageObject),
                "activity_stream_type_id": streamTypeID,
                "timeline_stream_type_id": streamTypeID,
                "data_entity_inline": JSON.stringify(timelineMessageObject),
                "operating_asset_first_name": "ESMS Integrations Services",
                "datetime_log": util.getCurrentUTCTime(),
                "message_unique_id": util.getMessageUniqueId(100),
                "activity_access_role_id": 27,
                "device_os_id": 5,
                "service_version": 1,
                "app_version": 1,
                "activity_timeline_text": request.activity_timeline_text || "",
                "activity_timeline_url": "",
                "activity_parent_id": 0,
                "activity_sub_type_id": -1,
                "track_gps_accuracy": "0",
                "track_gps_status": 0,
                "activity_channel_category_id": 0,
                "activity_channel_id": 0,
                "track_latitude": "0.0",
                "track_longitude": "0.0",
                "track_altitude": 0,
                "asset_message_counter": 0,
                "flag_pin": 0,
                "flag_priority": 0,
                "flag_offline": 0,
                "flag_retry": 0,
            };
            const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
            try {
                await addTimelineTransactionAsync(workflowTimelineRequest);
            } catch (error) {
                debug_warn("addTimelineMessage | workflowTimelineRequest | addTimelineTransactionAsync | Error: ", error);
            }
        }
    }

    async function getActivityDetailsAsync(request, activityID) {

        let responseData = [],
            error = true;

        var paramsArr;
        if (Number(activityID > 0)) {
            paramsArr = new Array(
                activityID,
                request.organization_id
            );
        } else {
            paramsArr = new Array(
                request.activity_id,
                request.organization_id
            );
        }
        const queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
        if (queryString !== '') {
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

    async function activityListSearchCUID(request) {
        let error = true,
            responseData = [];

        const paramsArr = new Array(
            request.organization_id,
            request.activity_type_category_id,
            request.activity_type_id || 0,
            request.flag || 0,
            request.search_string,
            request.page_start || 0,
            request.page_limit || 50
        );
        const queryString = util.getQueryString('ds_v1_activity_list_search_cuid', paramsArr);

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

    // Get account bassed on country code
    async function activityListSelectChildOrderCount(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_type_category_id || 48,
            request.activity_type_id || 0,
            request.parent_activity_id,
        );
        const queryString = util.getQueryString('ds_p1_activity_list_select_child_order_count', paramsArr);
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

    async function addParticipantCreatorOwner(request) {
        console.log("making creator bot - addParticipantCreatorOwner");
        
        let activityData = await activityCommonService.getActivityDetailsPromise({ organization_id: request.organization_id },request.workflow_activity_id);
        let assetID = activityData[0].activity_creator_asset_id;
        let assetOperatingAssetFirstName = activityData[0].activity_creator_operating_asset_first_name;

        let params = {
            activity_id : Number(request.workflow_activity_id),
            target_asset_id : assetID,
            organization_id : request.organization_id,
            owner_flag : 1,
            asset_id : 100
        }
        await activityCommonService.setAtivityOwnerFlag(params);

        let activityTimelineCollection =  JSON.stringify({
            "content": `Tony assigned ${assetOperatingAssetFirstName} as owner at ${moment().utcOffset('+05:30').format('LLLL')}.`,
            "subject": `Note - ${util.getCurrentDate()}.`,
            "mail_body": `Tony assigned ${assetOperatingAssetFirstName} as owner at ${moment().utcOffset('+05:30').format('LLLL')}.`,
            "activity_reference": [],
            "asset_reference": [],
            "attachments": [],
            "form_approval_field_reference": []
        });

        let timelineReq = Object.assign({}, request);
            timelineReq.activity_type_id = request.activity_type_id;
            timelineReq.message_unique_id = util.getMessageUniqueId(100);
            timelineReq.track_gps_datetime = util.getCurrentUTCTime();
            timelineReq.activity_stream_type_id = 711;
            timelineReq.timeline_stream_type_id = 711;
            timelineReq.activity_timeline_collection = activityTimelineCollection;
            timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;
        
        activityTimelineService.addTimelineTransactionAsync(timelineReq);

        return [false, []];
    }

    this.wrapperGlobalAddParticipantFunc = (request)=> {
         /*{
            "bot_operations": {    
              "participant_add": {
                "asset_reference": {
                  "form_id": "2090",
                  "field_id": "0"
                }
              }
            }
          }*/
    }
    
    // Bot Step Adding a Global add participant
    async function globalAddParticipant(request, inlineData, formInlineDataMap = new Map()) {
        let newReq = Object.assign({}, request);
        let resp;
        let isLead = 0, isOwner = 0, flagCreatorAsOwner = 0;
        
        global.logger.write('conLog', inlineData, {}, {});
        console.log(inlineData);
        newReq.message_unique_id = util.getMessageUniqueId(request.asset_id);

        let inlineKeys = Object.keys(inlineData);        
        console.log('inlineKeys - ', inlineKeys);

        if(inlineKeys.includes('static')) {
            newReq.flag_asset = inlineData.static.flag_asset;

            isLead = (inlineData.static.hasOwnProperty('is_lead')) ? inlineData.static.is_lead : 0;
            isOwner = (inlineData.static.hasOwnProperty('is_owner')) ? inlineData.static.is_owner : 0;
            flagCreatorAsOwner = (inlineData.static.hasOwnProperty('flag_creator_as_owner')) ? inlineData.static.flag_creator_as_owner : 0;

            if (newReq.flag_asset === 1) {
                //Use Asset Id
                newReq.desk_asset_id = inlineData.static.desk_asset_id;
                newReq.phone_number = inlineData.static.phone_number || 0;
            } else {
                //Use Phone Number
                newReq.desk_asset_id = 0;
                let phoneNumber = inlineData.static.phone_number;
                let phone;
                (phoneNumber.includes('||')) ?
                    phone = phoneNumber.split('||') :
                    phone = phoneNumber.split('|');

                newReq.country_code = phone[0]; //country code
                newReq.phone_number = phone[1]; //phone number                      
            }
        } else if(inlineKeys.includes('asset_reference')) {
            const formID = Number(inlineData["asset_reference"].form_id),
                fieldID = Number(inlineData["asset_reference"].field_id),
                workflowActivityID = Number(request.workflow_activity_id);

            let formTransactionID = 0, formActivityID = 0;

            isLead = (inlineData["asset_reference"].hasOwnProperty('is_lead')) ? inlineData["asset_reference"].is_lead : 0;
            isOwner = (inlineData["asset_reference"].hasOwnProperty('is_owner')) ? inlineData["asset_reference"].is_owner : 0;
            flagCreatorAsOwner = (inlineData["asset_reference"].hasOwnProperty('flag_creator_as_owner')) ? inlineData["asset_reference"].flag_creator_as_owner : 0;

            if(Number(flagCreatorAsOwner) === 1) {
                await addParticipantCreatorOwner(request);
                return [false, []];
            }

            if (!formInlineDataMap.has(fieldID)) {
                // const fieldValue = String(formInlineDataMap.get(fieldID).field_value).split("|");
                // newReq.desk_asset_id = fieldValue[0];
                // newReq.customer_name = fieldValue[1]

            } else {
                const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, workflowActivityID, formID);

                if (Number(formData.length) > 0) {
                    formTransactionID = Number(formData[0].data_form_transaction_id);
                    formActivityID = Number(formData[0].data_activity_id);
                }
                if (
                    Number(formTransactionID) > 0 &&
                    Number(formActivityID) > 0
                ) {
                    // Fetch the field value
                    const fieldData = await getFieldValue({
                        form_transaction_id: formTransactionID,
                        form_id: formID,
                        field_id: fieldID,
                        organization_id: request.organization_id
                    });
                    newReq.desk_asset_id = fieldData[0].data_entity_bigint_1;
                    newReq.customer_name = fieldData[0].data_entity_text_1;
                }
            }

            if (Number(newReq.desk_asset_id) > 0) {
                const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
                    organization_id: 906,
                    asset_id: newReq.desk_asset_id
                });
                if (assetData.length > 0) {
                    newReq.country_code = Number(assetData[0].operating_asset_phone_country_code) || Number(assetData[0].asset_phone_country_code);
                    newReq.phone_number = Number(assetData[0].operating_asset_phone_number) || Number(assetData[0].asset_phone_number);
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
                logger.error("BotEngine | addParticipant | getFieldValue | Customer Name | Error: ", { type: "bot_engine", error: serializeError(error), request_body: request });
            }
        }

        newReq.is_lead = isLead;
        newReq.is_owner = isOwner;
        newReq.flag_creator_as_owner = flagCreatorAsOwner;

        console.log('newReq.phone_number : ', newReq.phone_number);
        if (
            (newReq.phone_number !== -1) &&
            (Number(newReq.phone_number) !== 0) &&
            (newReq.phone_number !== 'null') && (newReq.phone_number !== undefined)
        ) {
            console.log("BotService | addParticipant | Message: ", newReq.phone_number, " | ", typeof newReq.phone_number);
            newReq.organization_id = 906;
            return await addParticipantStep(newReq);
        } else {
            logger.error(`BotService | addParticipant | Error: Phone number: ${newReq.phone_number}, has got problems!`);
            return [true, "Phone Number is Undefined"];
        }

    }

    async function checkMobility (request, inlineData) {
        console.log("checkMobility----", JSON.stringify(request), inlineData, request.workflow_activity_id, request.activity_id);
        let originForm = await getFormInlineData(request, 1);
        let originFormData = JSON.parse(originForm.data_entity_inline).form_submitted;
        console.log("dateFormData", JSON.stringify(originFormData));
        request.form_id = 50079; // NON FLD form
        let fldForm = await getFormInlineData(request, 1);
        let fldFormData = JSON.parse(fldForm.data_entity_inline).form_submitted;
        console.log("dateFormData1", JSON.stringify(fldFormData));

        // validating product and request type
        let resultProductAndRequestType = validatingProductAndRequestType(originFormData, inlineData.origin_form_config);

        if(!resultProductAndRequestType) {
            console.log("Product and Request type match failed");
            return;
        }

        let checkingSegment = validatingSegment(fldFormData, inlineData.segment_config);
        if(!checkingSegment) {
            console.log("Segment is not matched");
            return;
        }

        // validating COCP and IOIP
        let totalLinks = validatingCocpAndIoip(fldFormData, inlineData.plans_field_ids);

        if(!totalLinks.length) {
            console.log("Failed in Matching validatingCocpAndIoip");
            return;
        }

        // Checking Rentals
        let rentalResult = validatingRentals(fldFormData, inlineData.rental_field_ids, inlineData.field_values_map);

        if(!rentalResult || !rentalResult.length) {
            console.log("Failed in Matching validatingRentals");
            return;
        }
        console.log("rentalResult", rentalResult, totalLinks);
        // validating No of Links
        let linkResponse = validatingNoOfLinks(rentalResult, totalLinks);

        if(!linkResponse.length) {
            console.log("NO of Links are not matched");
            return;
        }
        console.log("linkResponse",linkResponse);

        // validating the monthly Quota
        let monthlyQuota = validatingMonthlyQuota(fldFormData, linkResponse, inlineData.monthly_quota);


        if(!monthlyQuota.length) {
            console.log("Conditions did not match in validatingMonthlyQuota");
            return;
        }

        let smsCount = validatingSMSValues(fldFormData, monthlyQuota, inlineData.sme_field_ids);

        if(!smsCount.length) {
            console.log("Conditions did not match in validatingSMSValues");
            return;
        }

        let wfActivityDetails = await activityCommonService.getActivityDetailsPromise({ organization_id : request.organization_id }, request.workflow_activity_id);
        console.log("wfActivityDetails", JSON.stringify(wfActivityDetails));

        try{
            await addParticipantStep({
                is_lead : 1,
                workflow_activity_id : request.activity_id,
                desk_asset_id : 0,
                phone_number : inlineData.phone_number,
                country_code : "",
                organization_id : request.organization_id,
                asset_id : wfActivityDetails[0].activity_creator_asset_id

            });
        }catch(e) {
            console.log("Error while adding participant")
        }
        await sleep((inlineData.form_trigger_time_in_min || 0) * 1000);
        // form submission


        // Check if the form has an origin flag set
        let createWorkflowRequest                       = Object.assign({}, request);

        createWorkflowRequest.activity_inline_data      = JSON.stringify([
            {
                form_id: 4355,
                field_id: '218393',
                field_name: 'Approval Status',
                field_data_type_id: 33,
                field_data_type_category_id: 14,
                data_type_combo_id: 1,
                data_type_combo_value: 0,
                field_value: 'Approved',
                message_unique_id: 1603968340287
            },
            {
                form_id: 4355,
                field_id: '218394',
                field_name: 'Comments',
                field_data_type_id: 20,
                field_data_type_category_id: 7,
                data_type_combo_id: 0,
                data_type_combo_value: '0',
                field_value: 'Approved',
                message_unique_id: 1603968690920
            },
            {
                form_id: 4355,
                field_id: '224396',
                field_name: 'Tag the Account Manager for Deal Creation',
                field_data_type_id: 59,
                field_data_type_category_id: 4,
                data_type_combo_id: 0,
                data_type_combo_value: '0',
                field_value: wfActivityDetails[0].operating_asset_id + '|' + wfActivityDetails[0].operating_asset_first_name + '|'+  wfActivityDetails[0].asset_id + '|' + wfActivityDetails[0].asset_first_name,
                message_unique_id: 1603968483792
            },
            {
                form_id: 4355,
                field_id: '220056',
                field_name: 'BC PDF Out Put',
                field_data_type_id: 51,
                field_data_type_category_id: 13,
                data_type_combo_id: 0,
                data_type_combo_value: '0',
                field_value: '',
                message_unique_id: 1603967981582
            },
            {
                form_id: 4355,
                field_id: '220057',
                field_name: 'Excel Upload',
                field_data_type_id: 52,
                field_data_type_category_id: 13,
                data_type_combo_id: 0,
                data_type_combo_value: '0',
                field_value: '',
                message_unique_id: 1603968819046
            },
            {
                form_id: 4355,
                field_id: '220058',
                field_name: 'Outlook Document',
                field_data_type_id: 56,
                field_data_type_category_id: 13,
                data_type_combo_id: 0,
                data_type_combo_value: '0',
                field_value: '',
                message_unique_id: 1603968493603
            }
        ]);

        createWorkflowRequest.workflow_activity_id      = Number(request.workflow_activity_id);
        createWorkflowRequest.activity_type_category_id = 9;
        createWorkflowRequest.activity_type_id          = 150506;
        //createWorkflowRequest.activity_title = workflowActivityTypeName;
        //createWorkflowRequest.activity_description = workflowActivityTypeName;
        //createWorkflowRequest.activity_form_id    = Number(request.activity_form_id);
        // Child Orders
        createWorkflowRequest.activity_parent_id = 0;
        createWorkflowRequest.activity_form_id    = 4355;
        createWorkflowRequest.form_id    = 4355;

        createWorkflowRequest.activity_datetime_start = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        createWorkflowRequest.activity_datetime_end   = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        // delete createWorkflowRequest.activity_id;
        createWorkflowRequest.device_os_id = 7;

        const targetFormActivityID = await cacheWrapper.getActivityIdPromise();
        const targetFormTransactionID = await cacheWrapper.getFormTransactionIdPromise();
        createWorkflowRequest.activity_id = targetFormActivityID;
        createWorkflowRequest.form_transaction_id = targetFormTransactionID;
        createWorkflowRequest.data_entity_inline        = createWorkflowRequest.activity_inline_data;

        console.log("createWorkflowRequest", JSON.stringify(createWorkflowRequest));
        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        let activityInsertedDetails = await addActivityAsync(createWorkflowRequest);

        console.log("activityInsertedDetails---->", activityInsertedDetails);


        let activityTimelineCollection =  JSON.stringify({
            "content": `Form Submitted`,
            "subject": `Final Approval for BC Closure`,
            "mail_body": `Final Approval for BC Closure`,
            "activity_reference": [],
            "form_id" : 4355,
            "form_submitted" : JSON.parse(createWorkflowRequest.data_entity_inline),
            "asset_reference": [],
            "attachments": [],
            "form_approval_field_reference": []
        });


        // let timelineReq = Object.assign({}, request);
        let timelineReq = Object.assign({}, createWorkflowRequest);

        // timelineReq.activity_id = activityInsertedDetails.activity_id;
        timelineReq.activity_id = request.workflow_activity_id;
        // timelineReq.activity_type_id = request.activity_type_id;
        timelineReq.message_unique_id = util.getMessageUniqueId(100);
        timelineReq.track_gps_datetime = util.getCurrentUTCTime();
        timelineReq.activity_stream_type_id = 717;
              // timelineReq.timeline_stream_type_id = 717;
        timelineReq.activity_stream_type_id = 705;
        timelineReq.timeline_stream_type_id = 705;
        timelineReq.activity_type_category_id = 48;
        timelineReq.asset_id = 100;
        timelineReq.activity_timeline_collection = activityTimelineCollection;
        timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;

        await activityTimelineService.addTimelineTransactionAsync(timelineReq);
    }

    function validatingProductAndRequestType(formData, originFormConfig) {
        let productMatchFlag = 0, requestTypeMatch = 0;
        for(let row of formData) {
            if(Object.keys(originFormConfig).includes(row.field_id.toString())) {
                let value = originFormConfig[row.field_id];
                console.log("Value from config", value, "Value from list" ,row.field_value);
                if(!value) {
                    console.log("Value not found in validatingProductAndRequestType", row.field_id);
                    break;
                }

                if(row.field_id == 224835 && row.field_value.indexOf(value) > -1) {
                    console.log("Value get matched in validatingProductAndRequestType", row.field_id, row.field_value);
                    productMatchFlag = 1;
                } else if(row.field_id == 225020 && value.indexOf(row.field_value) > -1) {
                    console.log("Value get matched in validatingProductAndRequestType", row.field_id, row.field_value);
                    requestTypeMatch = 1;
                } else {
                    console.log("Value did not matched in validatingProductAndRequestType");
                    break;
                }

                if(productMatchFlag && requestTypeMatch) {
                    console.log("Values Matched");
                    return true;
                }

            }
        }
    };

    function validatingSegment(formData, segment) {
        for(let row of formData) {
            if (segment[row.field_id]) {
                console.log("Value found in Segment", segment[row.field_id], row.field_value);
                if (!(segment[row.field_id].indexOf(row.field_value) > -1)) {
                    console.log("Matching Failed in Segment");
                    return false;
                }

            }

        }

        return true;
    }

    function validatingCocpAndIoip(formData, plans) {
        for(let row of formData) {
            for(let plan of plans) {
                for(let key in plan) {
                    if(key  == row.field_id) {
                        if(typeof(Number(row.field_value)) != 'number') {
                            console.error("Got a String and expecting Number " + row.field_id);
                            break;
                        }
                        plan[key] = row.field_value;
                    }
                }
            }
        }


        let totalLink = [];
        for(let plan of plans) {
            let fieldIds = Object.keys(plan);
            console.log("fieldIds", fieldIds, plan);

            if(Number(plan[fieldIds[0]]) != null && Number(plan[fieldIds[2]]) > 0  && Number(plan[fieldIds[1]]) != null  && Number(plan[fieldIds[3]]) <= 0) {
                console.log("This is the success case for ", plan);
            } else if((Number(plan[fieldIds[0]]) != null && Number(plan[fieldIds[2]]) > 0 && Number(plan[fieldIds[1]]) != null && Number(plan[fieldIds[3]]) > 0)
              || (Number(plan[fieldIds[0]]) != null && plan[fieldIds[2]] <= 0 &&  Number(plan[fieldIds[1]]) != null && Number(plan[fieldIds[3]]) > 0)){
                console.log("This is not success case for ", plan);
                return [];
            } else {
                console.log("This is the unknown condition");
                // return [];
            }

            totalLink.push(Number(plan[fieldIds[0]]));

        }
        console.log("totalLinks", totalLink);
        return totalLink;
    }

    function validatingRentals(formData, rentalFieldIds, mobiltiyFieldsValues) {
        console.log("Testing Rentals");
        let response = [];
        console.log("validatingRentals mobiltiyFieldsValues",Object.keys(mobiltiyFieldsValues));
        for(let row of formData) {
            if(rentalFieldIds.includes(Number(row.field_id))) {
                console.log("Getting this value to match in Rentals", row.field_value);
                if(row.field_value != null && row.field_value != '') {
                    if(mobiltiyFieldsValues[Number(row.field_value)] == null || mobiltiyFieldsValues[Number(row.field_value)] == undefined) {
                        console.log("Got empty value in validatingRentals");
                        return [];
                    }
                    response.push(mobiltiyFieldsValues[Number(row.field_value)]);
                }
            }
        }
        return response;
    }


    function validatingNoOfLinks(rentalResponse, totalLinks) {
        console.log("Validating No of Links");
        let response = [];
        for(let i = 0; i < rentalResponse.length; i++) {
            let valuesObject = Object.keys(rentalResponse[i]);
            console.log("valuesObject rental object", Number(valuesObject[0]), Number(totalLinks[i]), rentalResponse[i]);
            //  if(valuesObject[0] < totalLinks[i]) {
            if(!(totalLinks[i]  >= valuesObject[0])) {

                console.log("Condition get failed", rentalResponse[i], totalLinks[i]);
                return [];
            }

            response.push(rentalResponse[i][valuesObject[0]]);
        }
        console.log("Response from validatingNoOfLinks", response);
        return response;
    }

    function validatingMonthlyQuota(formData, linkResp, monthlyQuota) {

        console.log("Validating Monthly Quota");
        let response = [];
        for(let row of formData) {
            for(let i =0; i < monthlyQuota.length; i++) {
                if(linkResp[i] != null) {
                    let monthlyQuotaValue = Object.keys(linkResp[i]);
                    let monthlyQuotaFieldId = monthlyQuota[i];

                    if(Number(row.field_id) == monthlyQuotaFieldId) {
                        console.log("linkResp[i]", linkResp[i], i, row.field_id);
                        if(Number(row.field_value) > monthlyQuotaValue[0]) {
                            console.log("Got invalid value", Number(row.field_value), monthlyQuotaValue);
                            return []
                        }
                        console.log("linkResp[i][monthlyQuotaValue[0]]", linkResp[i][monthlyQuotaValue[0]]);
                        response.push(linkResp[i][monthlyQuotaValue[0]]);
                    }
                }
            }
        }

        console.log("Final Response in validatingMonthlyQuota", response);
        return response;
    }


    function validatingSMSValues(formData, monthlyQuota, smsFieldIds) {
        let response = [];
        for(let row of formData) {
            for(let i =0; i < smsFieldIds.length; i++) {
                if(monthlyQuota[i] != null) {

                    let smsFieldIdsValue = Object.keys(monthlyQuota[i]);
                    let smsFieldIdsFieldId = smsFieldIds[i];

                    if(Number(row.field_id) == smsFieldIdsFieldId) {
                        console.log("smsFieldIdsFieldId",row.field_id, smsFieldIdsFieldId);
                        if(Number(row.field_value) > smsFieldIdsValue[0]) {
                            console.log("Got invalid value validatingSMSValues", Number(row.field_value), smsFieldIdsValue);
                            return response
                        }
                        response.push(monthlyQuota[i][smsFieldIdsValue[0]]);
                    }

                }
            }
        }
        console.log("Final Response in validatingSMSValues", response);
        return response;
    }


    async function checkSmeBot(request, inlineData) {

        request.form_id = 50264;
        let IllForm = await getFormInlineData(request, 1);
        let IllFormData = JSON.parse(IllForm.data_entity_inline).form_submitted;

        console.log("----", JSON.stringify(IllFormData));

        let segmentFieldIds = [303443];
        let netCash = [303445];
        let linkFieldIds = [
                303446, 303453, 303460, 303467,
                303474, 303481, 303488,
                303495, 303502, 303509,
                303516, 303523, 303530,
                303537, 303544, 303551,
                303558, 303565, 303572,
                303579, 303579
            ];
        let productFieldIds = [
            303447, 303454, 303461, 303468,
            303475, 303482, 303489,
            303496, 303503, 303510,
            303517, 303524, 303531,
            303538, 303545, 303552,
            303559, 303566, 303573,
            303580, 303587
        ];

        let orderTypeFieldIds = [
            303448, 303455, 303462, 303469,
            303476, 303483, 303490,
            303497, 303504, 303511,
            303518, 303525, 303532,
            303539, 303546, 303553,
            303560, 303567, 303574,
            303581, 303588
        ];

        let bwFieldIds = [
            303449, 303456, 303463, 303470,
            303477, 303484, 303491,
            303498, 303505, 303512,
            303519, 303526, 303533,
            303540, 303547, 303554,
            303561, 303568, 303575,
            303582, 303589, 303589
        ];

        let otcFieldIds = [
            303450, 303457, 303464, 303471,
            303478, 303485, 303492,
            303499, 303506, 303513,
            303520, 303527, 303534,
            303541, 303548, 303555,
            303562, 303569, 303576,
            303583, 303590, 303590
        ];

        let arcFields = [
            303451, 303458, 303465,
            303472, 303479, 303486,
            303493, 303500, 303507,
            303514, 303521, 303528,
            303535, 303542, 303549,
            303556, 303563, 303570,
            303577, 303577
        ];

        let contractTermsFieldIds = [
            303452, 303459, 303466,
            303473, 303480, 303487,
            303494, 303501, 303508,
            303515, 303522, 303529,
            303536, 303543, 303550,
            303557, 303564, 303571,
            303578, 303578
        ];

        let illFormDataWithLiks = [];


        // to push the first three entries for every link to test the flow in a one go
        let temp = [IllFormData[0], IllFormData[1], IllFormData[2]];
        for(let i = 0, j = 0; i < IllFormData.length; i++) {

            if(IllFormData[i].field_id == linkFieldIds[j]) {
                if(j) {
                    illFormDataWithLiks.push(temp);
                }
                // to push the first three entries for every link to test the flow in a one go
                temp = [IllFormData[0], IllFormData[1], IllFormData[2]];
                j++;

            }

            if(j && !linkFieldIds.includes(Number(IllFormData[i].field_id))) {
                temp.push(IllFormData[i])
            }
        }

        illFormDataWithLiks.push(temp);

        console.log("illFormDataWithLiks",JSON.stringify(illFormDataWithLiks));

        for(let i = 0; i < illFormDataWithLiks.length; i++) {
            if(!checkValues(illFormDataWithLiks[i], productFieldIds[i], segmentFieldIds[0], orderTypeFieldIds[i], bwFieldIds[i], otcFieldIds[i], arcFields[i], contractTermsFieldIds[i], netCash[0])) {
                console.log("Criteria did not match");
                break;
            }
        }

        await addParticipantStep({
            is_lead : 1,
            workflow_activity_id : request.activity_id,
            desk_asset_id : 0,
            phone_number : inlineData.phone_number,
            country_code : "",
            organization_id : request.organization_id,
            asset_id : request.asset_id
        });

        await sleep(15*1000)


        let wfActivityDetails = await activityCommonService.getActivityDetailsPromise({ organization_id : 868 }, request.activity_id);

        console.log("wfActivityDetails", request);
        // Check if the form has an origin flag set
        let createWorkflowRequest                       = Object.assign({}, request);

        createWorkflowRequest.activity_inline_data      = JSON.stringify([
            {
                form_id: 4355,
                field_id: '218393',
                field_name: 'Approval Status',
                field_data_type_id: 33,
                field_data_type_category_id: 14,
                data_type_combo_id: 1,
                data_type_combo_value: 0,
                field_value: 'Approved',
                message_unique_id: 1603968340287
            },
            {
                form_id: 4355,
                field_id: '218394',
                field_name: 'Comments',
                field_data_type_id: 20,
                field_data_type_category_id: 7,
                data_type_combo_id: 0,
                data_type_combo_value: '0',
                field_value: 'abc',
                message_unique_id: 1603968690920
            },
            {
                form_id: 4355,
                field_id: '224396',
                field_name: 'Tag the Account Manager for Deal Creation',
                field_data_type_id: 59,
                field_data_type_category_id: 4,
                data_type_combo_id: 0,
                data_type_combo_value: '0',
                field_value: wfActivityDetails[0].operating_asset_id + '|' + wfActivityDetails[0].operating_asset_first_name + '|'+  wfActivityDetails[0].asset_id + '|' + wfActivityDetails[0].asset_first_name,
                message_unique_id: 1603968483792
            },
            {
                form_id: 4355,
                field_id: '220056',
                field_name: 'BC PDF Out Put',
                field_data_type_id: 51,
                field_data_type_category_id: 13,
                data_type_combo_id: 0,
                data_type_combo_value: '0',
                field_value: '',
                message_unique_id: 1603967981582
            },
            {
                form_id: 4355,
                field_id: '220057',
                field_name: 'Excel Upload',
                field_data_type_id: 52,
                field_data_type_category_id: 13,
                data_type_combo_id: 0,
                data_type_combo_value: '0',
                field_value: '',
                message_unique_id: 1603968819046
            },
            {
                form_id: 4355,
                field_id: '220058',
                field_name: 'Outlook Document',
                field_data_type_id: 56,
                field_data_type_category_id: 13,
                data_type_combo_id: 0,
                data_type_combo_value: '0',
                field_value: '',
                message_unique_id: 1603968493603
            }
        ]);
        createWorkflowRequest.workflow_activity_id      = Number(request.workflow_activity_id);
        createWorkflowRequest.activity_type_category_id = 9;
        createWorkflowRequest.activity_type_id          = 150506;
        //createWorkflowRequest.activity_title = workflowActivityTypeName;
        //createWorkflowRequest.activity_description = workflowActivityTypeName;
        createWorkflowRequest.activity_form_id    = Number(request.activity_form_id);
        // Child Orders
        createWorkflowRequest.activity_parent_id = 0;

        createWorkflowRequest.activity_datetime_start = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        createWorkflowRequest.activity_datetime_end   = moment().utc().format('YYYY-MM-DD HH:mm:ss');

        const targetFormActivityID = await cacheWrapper.getActivityIdPromise();
        const targetFormTransactionID = await cacheWrapper.getFormTransactionIdPromise();
        createWorkflowRequest.activity_id = targetFormActivityID;
        createWorkflowRequest.form_transaction_id = targetFormTransactionID;

        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        let activityInsertedDetails = await addActivityAsync(createWorkflowRequest);

        console.log("activityInsertedDetails---->", activityInsertedDetails);

        let activityTimelineCollection =  JSON.stringify({
            "content": `Status updated to BC Approved`,
            "subject": `Note - ${util.getCurrentDate()}.`,
            "mail_body": `Status updated to BC Approved`,
            "activity_reference": [],
            "asset_reference": [],
            "attachments": [],
            "form_approval_field_reference": []
        });

        let timelineReq = Object.assign({}, request);
        timelineReq.activity_id = activityInsertedDetails.activity_id;
        timelineReq.activity_type_id = request.activity_type_id;
        timelineReq.message_unique_id = util.getMessageUniqueId(100);
        timelineReq.track_gps_datetime = util.getCurrentUTCTime();
        timelineReq.activity_stream_type_id = 717;
        timelineReq.timeline_stream_type_id = 717;
        timelineReq.activity_timeline_collection = activityTimelineCollection;
        timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;

        await activityTimelineService.addTimelineTransactionAsync(timelineReq);



        function checkValues(linkDetails, productFieldId, segmentFieldId, orderTypeFieldId, bwFieldId, otcFieldId, arcField, contractTermsFieldId, netCash) {

            for(let value of global.botConfig.smeConstants) {
                let productF = 0, segementF = 0, orderTypeF = 0, bwF = 0, otcF = 0, arcF = 0, contractF = 0, netCashF = 0;
                for(let row of linkDetails) {
                    console.log("ROw Data", row.field_id, row.field_value, productFieldId, segmentFieldId, orderTypeFieldId, bwFieldId, otcFieldId, arcField, contractTermsFieldId, netCash)
                    if(row.field_id == productFieldId) {
                        console.log("row.field_id == productFieldId && value['1'].toLowerCase() == row.field_value.toLowerCase()", row.field_id == productFieldId && value['1'].toLowerCase() == row.field_value.toLowerCase())
                        value['1'].toLowerCase() == row.field_value.toLowerCase() ? productF = 1 : 0;
                        continue;
                    } else if(row.field_id == segmentFieldId) {
                        console.log("row.field_id == segmentFieldId && value['2'].toLowerCase() == row.field_value.toLowerCase()", row.field_id == segmentFieldId && value['2'].toLowerCase() == row.field_value.toLowerCase());
                        value['2'].toLowerCase() == row.field_value.toLowerCase() ? segementF = 1 : 0;
                        continue;
                    } else if(row.field_id == orderTypeFieldId) {
                        console.log("row.field_id == orderTypeFieldId && (row.field_value.toLowerCase() == 'new link' || row.field_value.toLowerCase() == 'Upgrade with Capex/ Opex'.toLowerCase())", row.field_id == orderTypeFieldId
                          && (row.field_value.toLowerCase() == 'new link' || row.field_value.toLowerCase() == 'Upgrade with Capex/ Opex'.toLowerCase()));
                        (row.field_value.toLowerCase() == 'new link' || row.field_value.toLowerCase() == 'Upgrade with Capex/ Opex'.toLowerCase()) ? orderTypeF = 1 : 0;
                        continue;
                    } else if(row.field_id == bwFieldId) {
                        console.log("row.field_id == bwFieldId && Number(row.field_value) == Number(value['4'])", row.field_id == bwFieldId && Number(row.field_value) == Number(value['4']));
                        Number(row.field_value) == Number(value['4']) ? bwF = 1 : 0;
                        continue;
                    } else if(row.field_id == otcFieldId) {
                        console.log("row.field_id == otcFieldId && Number(row.field_value) >= Number(value['5'])", row.field_id == otcFieldId && Number(row.field_value) >= Number(value['5']));
                        Number(row.field_value) >= Number(value['5']) ? otcF = 1 : 0;
                        continue;
                    } else if(row.field_id == arcField) {
                        console.log("row.field_id == arcField && Number(row.field_value) >= Number(value['6'])", row.field_id == arcField && Number(row.field_value) >= Number(value['6']));
                        Number(row.field_value) >= Number(value['6']) ? arcF = 1 : 0;
                        continue;
                    } else if(row.field_id == contractTermsFieldId) {
                        console.log("row.field_id == contractTermsFieldId && Number(row.field_value) >= Number(value['7'])", row.field_id == contractTermsFieldId && Number(row.field_value) >= Number(value['7']));
                        Number(row.field_value) >= Number(value['7']) ? contractF = 1 : 0;
                        continue;
                    } else if(row.field_id == netCash) {
                        console.log("row.field_id == netCash && Number(row.field_value) >= Number(value['8'])", row.field_id == netCash && Number(row.field_value) >= Number(value['8']));
                        Number(row.field_value) >= Number(value['8']) ? netCashF = 1 : 0;
                        continue;
                    }
                }

                if(productF && segementF && orderTypeF && bwF && otcF && arcF && contractF && netCashF)
                    return 1;
                else
                    productF = 0, segementF = 0, orderTypeF = 0, bwF = 0, otcF = 0, arcF = 0, contractF = 0, netCashF = 0;

            }
            return 0;
        }

    }
}

module.exports = BotService;
