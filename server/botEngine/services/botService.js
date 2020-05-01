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

const WorkbookOpsService = require('../../Workbook/services/workbookOpsService');

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

    const workbookOpsService = new WorkbookOpsService(objectCollection);

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

        wfSteps = await this.getBotworkflowStepsByForm({
            "organization_id": 0,
            "form_id": request.form_id,
            "field_id": 0,
            "bot_id": 0, // request.bot_id,
            "page_start": 0,
            "page_limit": 50
        });


        let botOperationsJson,
            botSteps;

        // Prepare the map equivalent for the form's inline data,
        // for easy checks and comparisons
        let formInlineData = [], formInlineDataMap = new Map();
        try {
            if (!request.hasOwnProperty('activity_inline_data')) {
                // Usually mobile apps send only activity_timeline_collection parameter in
                // the "/activity/timeline/entry/add" call
                const activityTimelineCollection = JSON.parse(request.activity_timeline_collection);
                formInlineData = activityTimelineCollection.form_submitted;
            } else {
                formInlineData = JSON.parse(request.activity_inline_data);
            }
            for (const field of formInlineData) {
                formInlineDataMap.set(Number(field.field_id), field);
            }
        } catch (error) {
            logger.error("Error parsing inline JSON and/or preparing the form data map", { type: 'bot_engine', error, request_body: request });
        }
        // console.log("formInlineDataMap: ", formInlineDataMap);

        for (let i of wfSteps) {
            global.logger.write('conLog', i.bot_operation_type_id, {}, {});

            // Check whether the bot operation should be triggered for a specific field_id only
            console.table([{
                bot_operation_sequence_id: i.bot_operation_sequence_id,
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

            botOperationsJson = JSON.parse(i.bot_operation_inline_data);
            botSteps = Object.keys(botOperationsJson.bot_operations);
            logger.silly("botSteps: %j", botSteps);

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
                    logger.silly("[Not Yet Implemented] Workbook Mapping Bot: %j", request);
                    try {
                        await workbookOpsService.workbookMappingBotOperation(request, formInlineDataMap, botOperationsJson.bot_operations.map_workbook);
                    } catch (error) {
                        logger.error("Error running the Workbook Mapping Bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
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
                    fridExpiryDate = util.addDaysToGivenDate((reqActivityInlineData[i].field_value).toString(), 60, "DD-MM-YYYY"); //Add 60 days to it    
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

            addCommentRequest.asset_id = 100;
            addCommentRequest.device_os_id = 7;
            addCommentRequest.activity_type_category_id = 48;
            addCommentRequest.activity_type_id = workflowActivityTypeID;
            addCommentRequest.activity_id = workflowActivityID;
            addCommentRequest.activity_timeline_collection = JSON.stringify({
                "content": `${comment.comment}`,
                "subject": `${comment.comment}`,
                "mail_body": `${comment.comment}`,
                "attachments": []
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
    async function copyFields(request, fieldCopyInlineData) {        

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

            const sourceFieldDataTypeID = Number(sourceFieldData[0].data_type_id);            
            console.log('sourceFieldDataTypeID : ', sourceFieldDataTypeID);
            console.log('getFielDataValueColumnName(sourceFieldDataTypeID) : ', getFielDataValueColumnName(sourceFieldDataTypeID));
            const sourceFieldValue = sourceFieldData[0][getFielDataValueColumnName(sourceFieldDataTypeID)];
            console.log('sourceFieldData[0] : ', sourceFieldData[0]);

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
        } //For loop Finished

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
                return 'data_entity_inline';
            default: console.log('In default Case : getFielDataValueColumnName');
        }
    }

    // Bot Step Adding a participant
    async function addParticipant(request, inlineData, formInlineDataMap = new Map()) {
        let newReq = Object.assign({}, request);
        let resp;
        global.logger.write('conLog', inlineData, {}, {});
        newReq.message_unique_id = util.getMessageUniqueId(request.asset_id);

        let type = Object.keys(inlineData);
        global.logger.write('conLog', type, {}, {});

        if (type[0] === 'static') {
            newReq.flag_asset = inlineData[type[0]].flag_asset;

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
                    organization_id: request.organization_id,
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

        if (
            (newReq.phone_number !== -1) &&
            (Number(newReq.phone_number) !== 0) &&
            newReq.phone_number !== 'null'
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
                formToFill["value"] = formConfigData[0].form_name || "";
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

    async function updateCUIDBotOperation(request, formInlineDataMap, cuidInlineData) {
        for (let [cuidKey, cuidValue] of Object.entries(cuidInlineData)) {
            let cuidUpdateFlag = 0,
                activityCUID1 = '', activityCUID2 = '', activityCUID3 = '',
                fieldValue = "";

            if(request.hasOwnProperty("opportunity_update"))
            {
                fieldValue = cuidValue;
            }else if
            (
                formInlineDataMap.has(Number(cuidValue.field_id))
            ) {
                const fieldData = formInlineDataMap.get(Number(cuidValue.field_id));
                fieldValue = fieldData.field_value || "";
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

    this.generateOppurtunity = async function (request){
        let responseData = [],
            error = false,
            generatedOpportunityID = "OPP-"; 
        try{

            let targetOpportunityID = await cacheWrapper.getOpportunityIdPromise();
            if(targetOpportunityID >= 100000){

            }else if(targetOpportunityID >= 10000){
                targetOpportunityID = "0"+targetOpportunityID;
            }else if(targetOpportunityID >= 1000){
                targetOpportunityID = "00"+targetOpportunityID;
            }else if(targetOpportunityID >= 100){
                targetOpportunityID = "000"+targetOpportunityID;
            }else if(targetOpportunityID >= 10){
                targetOpportunityID = "0000"+targetOpportunityID;
            }else if(targetOpportunityID >= 1){
                targetOpportunityID = "00000"+targetOpportunityID;
            }

            if(targetOpportunityID == 999900){
                await cacheWrapper.setOppurtunity(0);
            }
            generatedOpportunityID = generatedOpportunityID+targetOpportunityID+'-'+util.getCurrentISTDDMMYY();
            responseData.push(generatedOpportunityID); 


            // request.activity_inline_data
            // form_id
/*            let formInlineData = [], formInlineDataMap = new Map();
            try {
                
                    formInlineData = JSON.parse(request.activity_inline_data);

                    for (const field of formInlineData) {
                        formInlineDataMap.set(Number(field.field_id), field);
                    }
            } catch (error) {
                logger.error("Error parsing inline JSON and/or preparing the form data map", { type: 'opportunity', error, request_body: request });
            }            
*/
            logger.silly("Update CUID Bot");
            logger.silly("Update CUID Bot Request: ", request);
            try {
                request.opportunity_update = true;
                await updateCUIDBotOperation(request, {}, {"CUID1":generatedOpportunityID});
            } catch (error) {
                logger.error("Error running the CUID update bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
            }            

        }catch(e){
            error = true;
        }
        return [error, responseData];        
    }



}

module.exports = BotService;