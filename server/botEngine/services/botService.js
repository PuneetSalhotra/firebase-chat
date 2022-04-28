/*
 * author: Nani Kalyan V
 */
const { Kafka } = require('kafkajs');
const logger = require("../../logger/winstonLogger");
const ActivityService = require('../../services/activityService.js');
const ActivityParticipantService = require('../../services/activityParticipantService.js');
// var ActivityUpdateService = require('../../services/activityUpdateService.js');
const ActivityTimelineService = require('../../services/activityTimelineService.js');
const ActivityListingService = require('../../services/activityListingService.js');
const AssetService = require('../../services/assetService.js');

const UrlOpsService = require('../../UrlShortner/services/urlOpsService');

const LedgerOpsService = require('../../Ledgers/services/ledgerOpsService');

const AdminListingService = require("../../Administrator/services/adminListingService");
const AdminOpsService = require('../../Administrator/services/adminOpsService');
const CommnElasticService = require('../../elasticSearch/services/elasticSearchService');
//var aspose = aspose || {};
//aspose.cells = require("aspose.cells");
//
//var license = new aspose.cells.License();
//license.setLicense(`${__dirname}/Aspose.Cells.lic`);
//const WorkbookOpsService = require('../../Workbook/services/workbookOpsService');
//const WorkbookOpsService_VodafoneCustom = require('../../Workbook/services/workbookOpsService_VodafoneCustom');

const RMBotService = require('./rmbotService');

const uuidv4 = require('uuid/v4');
const _ = require('lodash');
const ics = require('ics')

const AWS = require('aws-sdk');
AWS.config.update({
    "accessKeyId": "AKIAWIPBVOFR4QJ3TS6E",
    "secretAccessKey": "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",
    "region": "ap-south-1"
});
const sqs = new AWS.SQS();

const XLSX = require('xlsx');
const XLSXColor = require('xlsx-color');
const {PDFDocument, rgb, StandardFonts,degrees } = require('pdf-lib');
const fetch = require('node-fetch');
const fontkit = require('@pdf-lib/fontkit');

const pdfreader = require('pdfreader');
const excelColumnName = require('excel-column-name');

function isObject(obj) {
    return obj !== undefined && obj !== null && !Array.isArray(obj) && obj.constructor == Object;
}

function BotService(objectCollection) {
    
    const moment = require('moment');
    const makeRequest = require('request');
    const TinyURL = require('tinyurl');
    //var hummus = require('hummus');

    const cacheWrapper = objectCollection.cacheWrapper;
    const queueWrapper = objectCollection.queueWrapper;
    //const activityPushService = objectCollection.activityPushService;
    
    const ActivityPushService = require('../../services/activityPushService');
    const activityPushService = new ActivityPushService(objectCollection);

    const util = objectCollection.util;
    const db = objectCollection.db;
    const botConfig = require('../utils/botConfig.js');
    const vilBulkLOVs = require('../utils/vilBulkLOVs');

    const activityCommonService = objectCollection.activityCommonService;
    // const activityUpdateService = new ActivityUpdateService(objectCollection);
    const activityParticipantService = new ActivityParticipantService(objectCollection);
    const activityService = new ActivityService(objectCollection);
    const activityListingService = new ActivityListingService(objectCollection);
    const activityTimelineService = new ActivityTimelineService(objectCollection);
    
    const urlOpsService = new UrlOpsService(objectCollection);
    const ledgerOpsService = new LedgerOpsService(objectCollection);

    const adminListingService = new AdminListingService(objectCollection);
    const adminOpsService = new AdminOpsService(objectCollection);
    const elasticService = new CommnElasticService(objectCollection);

    //const workbookOpsService = new WorkbookOpsService(objectCollection);
    //const workbookOpsService_VodafoneCustom = new WorkbookOpsService_VodafoneCustom(objectCollection);

    const rmBotService = new RMBotService(objectCollection);

    const assetService = new AssetService(objectCollection);

    const nodeUtil = require('util');

    const pdf = require('html-pdf');

    const path = require('path');
    const fs = require('fs');

    // const HummusRecipe = require('hummus-recipe');

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
                    const queryString = util.getQueryString('ds_p1_bot_list_insert', paramsArray);
                    if (queryString != '') {
                        await db.executeQueryPromise(0, queryString, request)
                          .then((data)=>{
                                results[0] = data;
                            })
                            .catch((err)=>{
                                    return Promise.reject(err)
                            });
                    }
               

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
                     request.bot_name,
                     request.bot_inline_data,
                     request.bot_inline_data,
                     request.organization_id,
                     request.log_asset_id,
                     request.log_datetime,
                 );
                 const queryString = util.getQueryString('ds_p2_bot_operation_mapping_update_inline', paramsArray);
                 if (queryString != '') {
                     await db.executeQueryPromise(0, queryString, request)
                       .then((data)=>{
                             responseData = {'message': 'bot data updated successfully!'};
                             error = false;
                         })
                         .catch((err)=>{
                                 util.logError(request,`[Error] bot data update `, { type: 'bot_engine', err });
                                 error = err;
                         });
                 }
                
                // enabling round robin arp bot
                if(request.bot_operation_type_id == 2) {
                    const botOperationInlineData = JSON.parse(request.bot_inline_data),
                    botOperations = botOperationInlineData.bot_operations;

                    let activityTypeFlagRoundRobin = botOperations.status_alter.activity_type_flag_round_robin;

                    let activityStatusId = botOperations.status_alter.activity_status_id;
                    
                    if(activityTypeFlagRoundRobin == 1) {
                        let statusDetails = await getStatusName(request, activityStatusId);

                        for(let status of statusDetails) {
                            util.logInfo("status", JSON.stringify(status));
                            let [err,assetList] = await assetService.getAssetTypeList({
                                organization_id : request.organization_id,
                                asset_type_id : status.asset_type_id,
                                asset_type_category_id : status.asset_type_category_id,
                                start_from : 0,
                                limit_value : 1000
                            });
    
                            await updateArpRRFlag({
                                organization_id : request.organization_id,
                                asset_type_id : status.asset_type_id,
                                asset_type_arp_round_robin_enabled : 1,
                                log_asset_id : request.asset_id
                            });

                            if(err) {
                                console.error("Got Error");
                                return [err, []];
                            }
                            util.logInfo("assetList", JSON.stringify(assetList));
                            let sequence_id = 1;
                            for(let row of assetList) {
                                await updateAssetSequenceId({
                                    asset_id : row.asset_id,
                                    organization_id : request.organization_id,
                                    sequence_id : sequence_id,
                                    cycle_id : 1,
                                    log_asset_id : row.asset_id,
                                });
                                sequence_id++;
                            }
    
                        }                        
                    }
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
                // results[0] = await db.callDBProcedure(request, 'ds_p1_1_bot_operation_mapping_insert', paramsArray, 0);

                const queryString = util.getQueryString('ds_p1_1_bot_operation_mapping_insert', paramsArray);
                if (queryString != '') {
                    await db.executeQueryPromise(0, queryString, request)
                      .then((data)=>{
                            //success block
                            results[0] = data;
                        })
                        .catch((err)=>{
                                return Promise.reject(error)
                        });
                }

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

                // enabling round robin arp bot
                if(request.bot_operation_type_id == 2) {
                    const botOperationInlineData = JSON.parse(request.bot_operation_inline_data),
                    botOperations = botOperationInlineData.bot_operations;

                    let activityTypeFlagRoundRobin = botOperations.status_alter.activity_type_flag_round_robin;

                    let activityStatusId = botOperations.status_alter.activity_status_id;
                    
                    if(activityTypeFlagRoundRobin == 1) {
                        let statusDetails = await getStatusName(request, activityStatusId);

                        for(let status of statusDetails) {
                            util.logInfo("status", JSON.stringify(status));
                            let [err,assetList] = await assetService.getAssetTypeList({
                                organization_id : request.organization_id,
                                asset_type_id : status.asset_type_id,
                                asset_type_category_id : status.asset_type_category_id,
                                start_from : 0,
                                limit_value : 1000
                            });
    
                            await updateArpRRFlag({
                                organization_id : request.organization_id,
                                asset_type_id : status.asset_type_id,
                                asset_type_arp_round_robin_enabled : 1,
                                log_asset_id : request.asset_id
                            });

                            if(err) {
                                console.error("Got Error");
                                return [err, []];
                            }
                            util.logInfo("assetList", JSON.stringify(assetList));
                            let sequence_id = 1;
                            for(let row of assetList) {
                                await updateAssetSequenceId({
                                    asset_id : row.asset_id,
                                    organization_id : request.organization_id,
                                    sequence_id : sequence_id,
                                    cycle_id : 1,
                                    log_asset_id : row.asset_id,
                                });
                                sequence_id++;
                            }
    
                        }                        
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

        const botInitialRequest = Object.assign({}, request);
        const botMessageId = request.message_id || "";
        try {
            util.logInfo(request, `Initiating BOT Request Params %j`, request);

            request.debug_info = [];
            request.debug_info.push("initBotEngine" + JSON.stringify(request));
            //Bot Log - Bot engine Triggered
            activityCommonService.botOperationFlagUpdateTrigger(request, 1);

            util.logInfo(request, `🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖`);
            util.logInfo(request, `🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖  ENTERED BOT ENGINE  🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖`);
            util.logInfo(request, `🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖`);

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
                    formInlineDataMap.set(Number(field.field_id), { ...field, bot_count: 1 });
                }
            } catch (error) {
                util.logError(request, `Error parsing inline JSON and/or preparing the form data map`, { type: 'bot_engine', error });

                let errorStatusUpdateRequest = Object.assign({}, request);
                errorStatusUpdateRequest.status_id = 4;
                errorStatusUpdateRequest.log_asset_id = request.asset_id || 0;
                errorStatusUpdateRequest.consumed_datetime = null;
                errorStatusUpdateRequest.processed_datetime = null;
                errorStatusUpdateRequest.failed_datetime = util.getCurrentUTCTime();
                errorStatusUpdateRequest.log_datetime = util.getCurrentUTCTime();

                const [errorThree, __] = await activityCommonService.BOTMessageTransactionUpdateStatusAsync(errorStatusUpdateRequest);

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
            if (Number(request.is_from_field_alter) === 1) { //Request has come from field alter       
                util.logInfo(request, `In form_field_alter`);


                util.logInfo(request, `formInlineDataMap:  %j`, formInlineDataMap);

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
                if (request.is_bulk_edit == 1) {
                    for (let lk = 0; lk < formInlineData.length; lk++) {
                        let eachFieldLevelWFSteps = await this.getBotworkflowStepsByForm({
                            "organization_id": 0,
                            "form_id": request.form_id,
                            "field_id": formInlineData[lk].field_id,
                            "bot_id": 0, // request.bot_id,
                            "page_start": 0,
                            "page_limit": 50
                        });
                        fieldLevelWFSteps = [...fieldLevelWFSteps, ...eachFieldLevelWFSteps];
                    }
                }
                else {
                    fieldLevelWFSteps = await this.getBotworkflowStepsByForm({
                        "organization_id": 0,
                        "form_id": request.form_id,
                        "field_id": request.altered_field_id,
                        "bot_id": 0, // request.bot_id,
                        "page_start": 0,
                        "page_limit": 50
                    });
                }
                // console.log(fieldLevelWFSteps)

                if (formLevelWFSteps.length > 0) {
                    wfSteps = fieldLevelWFSteps.concat(formLevelWFSteps);
                } else {
                    wfSteps = fieldLevelWFSteps;
                }

            } else if (Number(request.is_refill) === 1) {
                util.logInfo(request, `This is smart form - Refill case`);
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
                util.logInfo(request, `Number of form Level Bots form_id : ${request.form_id} %j`, botResponse.length);

                let totalBots = botResponse; //Assigning form based bots

                //2) Retrigger all the impacted field level
                let fieldLevelWFSteps = [];
                for (const i_iterator of formInlineData) {
                    let tempResponse = await this.getBotworkflowStepsByForm({
                        "organization_id": 0,
                        "form_id": request.form_id,
                        "field_id": i_iterator.field_id,
                        "bot_id": 0, // request.bot_id,
                        "page_start": 0,
                        "page_limit": 50
                    });
                    util.logInfo(request, `Number of field Level Bots field_id : ${i_iterator.field_id} %j`, tempResponse.length);
                    if (tempResponse.length > 0) {
                        totalBots = totalBots.concat(tempResponse); //Assigning field level bots
                    }
                }

                wfSteps = totalBots;

            } else if (Number(request.is_resubmit) === 1) {
                util.logInfo(request, `This is non-smart - Resubmit case`);
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
                util.logInfo(request, `This is generic case!! - First time form Submission!!`);
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
            util.logInfo(request, `Attached bots list`);
            //Print what are all the bots are there
            util.logInfo(request, `Printing all the bots attached`);
            for (const temp_iterator of wfSteps) {
                util.logInfo(request, `***************************************`);
                util.logInfo(request, `bot_operation_type_id ${temp_iterator.bot_operation_type_id}`);
                util.logInfo(request, `bot_operation_sequence_id ${temp_iterator.bot_operation_sequence_id}`);
                util.logInfo(request, `bot_operation_id ${temp_iterator.bot_operation_id}`);
                util.logInfo(request, `bot_operation_type_name ${temp_iterator.bot_operation_type_name}`);
                util.logInfo(request, `form_id ${temp_iterator.form_id}`);
                util.logInfo(request, `field_id ${temp_iterator.field_id}`);
                util.logInfo(request, `data_type_combo_id ${temp_iterator.data_type_combo_id}`);
                util.logInfo(request, `data_type_combo_name ${temp_iterator.data_type_combo_name}`);

                console.table([{
                    bot_operation_sequence_id: temp_iterator.bot_operation_sequence_id,
                    bot_operation_id: temp_iterator.bot_operation_id,
                    bot_operation_type_name: temp_iterator.bot_operation_type_name,
                    form_id: temp_iterator.form_id,
                    field_id: temp_iterator.field_id,
                    data_type_combo_id: temp_iterator.data_type_combo_id,
                    data_type_combo_name: temp_iterator.data_type_combo_name
                }]);
                util.logInfo(request, `***************************************`);
            }

            util.logInfo(request, `🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖 🤖`);

            for (let i of wfSteps) {
                request.debug_info = [];
                // Adding bot_operation_id into request for logs
                request["bot_operation_id"] = i.bot_operation_id;

                util.logInfo(request, `------------START EXECUTING BOT----------------------`);
                util.logInfo(request, ` i.bot_operation_type_id ${i.bot_operation_type_id}`);
                util.logInfo(request, ` bot_operation_sequence_id ${i.bot_operation_sequence_id}`);
                util.logInfo(request, ` bot_operation_type_name ${i.bot_operation_type_name}`);
                util.logInfo(request, ` form_id ${i.form_id}`);
                util.logInfo(request, ` field_id ${i.field_id}`);
                util.logInfo(request, ` data_type_combo_id ${i.data_type_combo_id}`);
                util.logInfo(request, ` data_type_combo_name ${i.data_type_combo_name}`);

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

                request.debug_info.push("bot_operation_sequence_id - " + i.bot_operation_sequence_id);
                request.debug_info.push("bot_operation_type_id - " + i.bot_operation_type_id);
                request.debug_info.push("bot_operation_type_name - " + i.bot_operation_type_name);
                request.debug_info.push("form_id - " + i.form_id);
                request.debug_info.push("field_id - " + i.field_id);
                request.debug_info.push("data_type_combo_id - " + i.data_type_combo_id);
                request.debug_info.push("data_type_combo_name - " + i.data_type_combo_name);

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
                        util.logInfo(request, `Not triggering bot`);
                        util.logInfo(request, `\x1b[31mThis bot operation is field specific & cannot be applied.\x1b[0m`);
                        request.debug_info.push('This bot operation is field specific & cannot be applied.');
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
                        util.logInfo(request, `Not triggering bot`);
                        util.logInfo(request, `\x1b[31mThis bot operation is field and data_type_combo_id specific & cannot be applied.\x1b[0m`);
                        request.debug_info.push('This bot operation is field and data_type_combo_id specific & cannot be applied.');
                        continue;
                    }
                } catch (error) {
                    util.logError(request, `Error checking field/data_type_combo_id trigger specificity`, { type: 'bot_service', error: serializeError(error) });
                    request.debug_info.push('Error checking field/data_type_combo_id trigger specificity');
                    request.debug_info.push(error);
                }

                util.logInfo(request, `i.bot_operation_inline_data : %j`, i.bot_operation_inline_data);
                util.logInfo(request, `Value of i :  %j`, i);
                util.logInfo(request, `~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);

                // Skipping form enable bot because it is causing other to fail
                if (Number(i.bot_operation_type_id) === 20) {
                    util.logInfo(request, "Skipping form enable bot because it is causing other to fail")
                    continue;
                }

                try {
                    botOperationsJson = JSON.parse(i.bot_operation_inline_data);
                } catch (error) {
                    util.logError(request, `[botOperationsJson] Error parsing bot_operation_inline_data`, { type: "bot_engine", error: serializeError(error) });
                }
                try {
                    botSteps = Object.keys(botOperationsJson.bot_operations);
                    util.logInfo(request, `botSteps: %j`, botSteps);
                } catch (error) {
                    util.logError(request, `[botSteps] Error listing bot_operations keys`, { type: "bot_engine", error: serializeError(error) });
                }

                // Check for condition, if any
                let canPassthrough = true;
                try {
                    canPassthrough = await isBotOperationConditionTrue(request, botOperationsJson.bot_operations, formInlineDataMap);
                } catch (error) {
                    util.logError(request, `canPassthrough | isBotOperationConditionTrue | canPassthrough | Error: `, { type: "bot_engine", error: serializeError(error) });
                }
                if (!canPassthrough) {
                    util.logError(request, `The bot operation condition failed, so the bot operation will not be executed.`, { type: "bot_engine" });
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
                        util.logInfo(request, `****************************************************************`);
                        util.logInfo(request, `PARTICIPANT ADD`);
                        request.debug_info.push('PARTICIPANT ADD');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await addParticipant(request, botOperationsJson.bot_operations.participant_add, formInlineDataMap);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();

                        } catch (err) {
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            util.logError(request, `Error in executing addParticipant Step`, { type: 'add_participant', error: serializeError(err) });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            i.bot_operation_error_message = serializeError(err);
                            //return Promise.reject(err);
                        }
                        util.logInfo(request, `****************************************************************`);
                        break;

                    //case 'status_alter': 
                    case 2: // Alter Status
                        util.logInfo(request, `****************************************************************`);
                        util.logInfo(request, `STATUS ALTER BOT %j`, request);
                        request.debug_info.push('STATUS ALTER BOT');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            let result = await changeStatusV1(request, botOperationsJson.bot_operations.status_alter);
                            if (result[0]) {
                                i.bot_operation_status_id = 2;
                                request.debug_info.push(result);
                                i.bot_operation_inline_data = JSON.stringify(
                                    request.debug_info
                                );
                                
                                //await handleBotOperationMessageUpdate(request, i, 4, result[1]);
                                i.bot_operation_end_datetime = util.getCurrentUTCTime();
                                i.bot_operation_error_message = result[1];
                            } else {
                                //await handleBotOperationMessageUpdate(request, i, 3);
                                i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            }
                        } catch (err) {
                            util.logError(request, `serverError | Error in executing changeStatus Step`, { type: "bot_engine", error: serializeError(err) });
                            request.debug_info.push(err);
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify(
                                request.debug_info
                            );
                            //return Promise.reject(err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                        }
                        util.logInfo(request, `****************************************************************`);
                        break;

                    //case 'form_field_copy':
                    case 3: //Copy Form field
                        util.logInfo(request, `****************************************************************`);
                        util.logInfo(request, ` FORM FIELD %j`, request);
                        i.bot_operation_start_datetime = util.getCurrentUTCTime();
                        try {
                            // global.logger.write('conLog', 'Request Params received by BOT ENGINE', request, {});
                            request.debug_info.push('form_field_copy | Request Params received by BOT ENGINE' + request);
                            await copyFields(request, botOperationsJson.bot_operations.form_field_copy, botOperationsJson.bot_operations.condition);

                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            //await handleBotOperationMessageUpdate(request, i, 3);
                        } catch (err) {
                            util.logError(request, `Error in executing copyFields Step`, { type: "bot_engine", error: serializeError(err) });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //return Promise.reject(err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                        }
                        util.logInfo(request, `****************************************************************`);
                        break;

                    //case 'workflow_percentage_alter': 
                    case 4: //Update Workflow Percentage
                        util.logInfo(request, '****************************************************************')
                        util.logInfo(request, 'WF PERCENTAGE ALTER');
                        logger.silly("Request Params received from Request: %j", request);
                        request.debug_info.push('WF PERCENTAGE ALTER ');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            let result = await alterWFCompletionPercentage(request, botOperationsJson.bot_operations.workflow_percentage_alter);
                            if (result[0]) {
                                i.bot_operation_status_id = 2;
                                i.bot_operation_inline_data = JSON.stringify({
                                    "err": result[1]
                                });
                                i.bot_operation_end_datetime = util.getCurrentUTCTime();
                                i.bot_operation_error_message = result[1];
                                //await handleBotOperationMessageUpdate(request, i, 4, result[1]);
                            } else {
                                i.bot_operation_end_datetime = util.getCurrentUTCTime();
                                //await handleBotOperationMessageUpdate(request, i, 3);
                            }
                        } catch (err) {
                            logger.error("serverError | Error in executing alterWFCompletionPercentage Step", { type: "bot_engine", request_body: request, error: serializeError(err) });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //return Promise.reject(err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                        }
                        util.logInfo(request, '****************************************************************');
                        break;

                    //case 'fire_api': 
                    case 5: // External System Integration
                        util.logInfo(request, '****************************************************************');
                        util.logInfo(request, 'FIRE API');
                        request.debug_info.push('FIRE API ');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await fireApi(request, botOperationsJson.bot_operations.fire_api);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            //await handleBotOperationMessageUpdate(request, i, 3);
                        } catch (err) {
                            util.logError(request, 'Error in executing fireApi Step', { err })
                            i.bot_operation_status_id = 3;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //return Promise.reject(err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                        }
                        util.logInfo(request, '****************************************************************');
                        break;

                    //case 'fire_text': 
                    case 6: // Send Text Message
                        i.bot_operation_start_datetime = util.getCurrentUTCTime();
                        if (
                            request.hasOwnProperty("activity_stream_type_id") &&
                            Number(request.activity_stream_type_id) === 713
                        ) {
                            // Do not fire this bot step on form edits
                            logger.verbose(`Do Not Fire Email On Form Edit`, { type: 'bot_engine', request_body: request, error: null });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = "Do Not Fire Send Text Message On Form Edit";
                            //await handleBotOperationMessageUpdate(request, i, 3, "Do Not Fire Send Text Message On Form Edit");
                            continue;
                            // break;
                        }
                        util.logInfo(request, '****************************************************************');
                        util.logInfo(request, 'FIRE TEXT');
                        request.debug_info.push('FIRE TEXT');
                        try {
                            await fireTextMsg(request, botOperationsJson.bot_operations.fire_text);

                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            //await handleBotOperationMessageUpdate(request, i, 3);
                        } catch (err) {
                            util.logError(request, `Error in executing fireTextMsg Step | Error: `, { type: 'bot_engine', err });
                            util.logError(request, 'serverError', { err });
                            i.bot_operation_status_id = 4;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //return Promise.reject(err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                        }
                        util.logInfo(request, '****************************************************************');
                        break;

                    //case 'fire_email':           
                    case 7: // Send email
                        i.bot_operation_start_datetime = util.getCurrentUTCTime();
                        if (
                            request.hasOwnProperty("activity_stream_type_id") &&
                            Number(request.activity_stream_type_id) === 713
                        ) {
                            // Do not fire this bot step on form edits
                            logger.verbose(`Do Not Fire Email On Form Edit`, { type: 'bot_engine', request_body: request, error: null });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = "Do Not Fire Email On Form Edit";
                            //await handleBotOperationMessageUpdate(request, i, 3, "Do Not Fire Email On Form Edit");
                            continue;
                            // break;
                        }
                        util.logInfo(request, '****************************************************************');
                        util.logInfo(request, 'FIRE EMAIL');
                        request.debug_info.push('FIRE EMAIL ');
                        try {
                            await fireEmail(request, botOperationsJson.bot_operations.fire_email);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            util.logError(request, `Error in executing fireEmail Step: `, { type: 'bot_engine', err });
                            util.logError(request, 'Error in executing fireEmail Step', { err });
                            i.bot_operation_status_id = 4;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            //return Promise.reject(err);
                        }
                        util.logInfo(request, '****************************************************************');
                        break;

                    case 8: // add_comment
                        util.logInfo(request, `****************************************************************`);
                        util.logInfo(request, `add_comment`);
                        util.logInfo(request, `add_comment | Request Params received by BOT ENGINE`);
                        request.debug_info.push('add_comment');
                        request.debug_info.push('add_comment | Request Params received by BOT ENGINE' + request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await addComment(request, botOperationsJson.bot_operations.add_comment);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            // await handleBotOperationMessageUpdate(request, i, 3);
                        } catch (err) {
                            util.logError(request, `add_comment | Error`, { type: 'bot_engine', error });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            // await handleBotOperationMessageUpdate(request, i, 4, err);
                        }
                        util.logInfo(request, `****************************************************************`);
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
                        util.logInfo(request, `****************************************************************`);
                        util.logInfo(request, `add_attachment_with_attestation`);
                        util.logInfo(request, `add_attachment_with_attestation | Request Params received by BOT ENGINE`);
                        request.debug_info.push('add_attachment_with_attestation ');
                        request.debug_info.push('add_attachment_with_attestation | Request Params received by BOT ENGINE' + request);
                        try {
                            util.logInfo(request, `try add_attachment_with_attestation`);
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await addAttachmentWithAttestation(request, botOperationsJson.bot_operations.add_attachment_with_attestation);

                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            util.logError(request, `add_attachment_with_attestation  | Error`, { type: 'bot_engine', err });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                        }
                        util.logInfo(request, `****************************************************************`);
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
                        util.logInfo(request, `****************************************************************`);
                        util.logInfo(request, `form_pdf`);
                        logger.silly('form_pdf | Request Params received by BOT ENGINE: %j', request);
                        request.debug_info.push('form_pdf');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            util.logInfo(request, `form_pdf`);
                            // commenting to get hummus error
                            // await addPdfFromHtmlTemplate(request, botOperationsJson.bot_operations.form_pdf);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            logger.error("serverError | Error in executing form_pdf Step", { type: "bot_engine", request_body: request, error: serializeError(err) });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                        }
                        util.logInfo(request, `****************************************************************`);
                        break;

                    case 13: // [RESERVED] Time Slot Bot
                        break;

                    case 14: // [RESERVED] Ledger Transactions Bot
                        logger.silly("LEDGER TRANSACTION");
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await ledgerOpsService.ledgerCreditDebitNetTransactionUpdate(request);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            //await handleBotOperationMessageUpdate(request, i, 3);
                        } catch (error) {
                            util.logError(request, `LEDGER TRANSACTION Error: `, { type: 'bot_engine', error });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 15: // Customer Creation Bot
                        i.bot_operation_start_datetime = util.getCurrentUTCTime();
                        if (
                            request.hasOwnProperty("activity_stream_type_id") &&
                            Number(request.activity_stream_type_id) === 713
                        ) {
                            // Do not fire this bot step on form edits
                            logger.silly(`Do Not Fire Create Customer On Form Edit`, { type: 'bot_engine', error: null });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = "Do Not Fire Create Customer On Form Edit";
                            //await handleBotOperationMessageUpdate(request, i, 3, "Do Not Fire Create Customer On Form Edit");
                            continue;
                        }
                        logger.silly("CREATE CUSTOMER");
                        try {
                            await createCustomerAsset(request, botOperationsJson.bot_operations.create_customer);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            //await handleBotOperationMessageUpdate(request, i, 3);
                        } catch (error) {
                            util.logError(request, `CREATE CUSTOMER Error: `, { type: 'bot_engine', error });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                        }
                        break;

                    case 16: // Workflow Reference Bot
                        logger.silly("Workflow Reference Bot");
                        i.bot_operation_start_datetime = util.getCurrentUTCTime();
                        try {
                            //await createCustomerAsset(request, botOperationsJson.bot_operations.create_customer);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            //await handleBotOperationMessageUpdate(request, i, 3);
                        } catch (error) {
                            util.logError(request, `Workflow Reference Bot: `, { type: 'bot_engine', error });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
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
                        let product_variant_activity_title = ""
                        let cartItems = [];
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
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
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }

                        util.logInfo(request, ` `);
                        util.logInfo(request, `activityInlineData : %j`, activityInlineData);
                        request.debug_info.push('activityInlineData: ' + activityInlineData);

                        let activityProductSelection;
                        for (const i of activityInlineData) {
                            if (Number(i.field_data_type_id) === 71) {
                                activityProductSelection = i.field_value;

                                let fieldValue = JSON.parse(i.field_value);
                                 cartItems = fieldValue.cart_items;
                                util.logInfo(request, `typeof Cart Items : %j`, typeof cartItems);
                                util.logInfo(request, `Cart Items :  %j`, cartItems);
                                request.debug_info.push('typeof Cart Items: ' + typeof cartItems);
                                request.debug_info.push('Cart Items: ' + cartItems);

                                cartItems = (typeof cartItems === 'string') ? JSON.parse(cartItems) : cartItems;

                                if (cartItems.length > 0) {
                                    util.logInfo(request, `Searching for custom variant %j`, request);
                                    request.debug_info.push('Searching for custom variant');
                                    for (j of cartItems) {
                                        util.logInfo(request, `product_variant_activity_title : ${(j.product_variant_activity_title).toLowerCase()}`);
                                        request.debug_info.push('product_variant_activity_title: ' + (j.product_variant_activity_title).toLowerCase());
                                        if ((j.product_variant_activity_title).toLowerCase() == 'custom variant' ||
                                            (j.product_variant_activity_title).toLowerCase() == 'custom') {
                                            flag = 1
                                        }
                                        else {
                                            product_variant_activity_title = j.product_variant_activity_title;
                                        }
                                    }
                                } //End of If
                            }
                        }

                        if (Number(request.activity_type_id) === 152184) {
                            flag = 1;
                        }

                        util.logInfo(request, `Number(request.parent_activity_id) - ${Number(request.parent_activity_id)}`);
                        request.debug_info.push('Number(request.parent_activity_id): ' + Number(request.parent_activity_id));
                        if (request.hasOwnProperty('parent_activity_id') && Number(request.parent_activity_id) > 0) {
                            flag = 0;
                        }

                        let workflowActivityID = request.workflow_activity_id;
                        let wfActivityDetails = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);

                        if (wfActivityDetails.length > 0) {
                            if (wfActivityDetails[0].parent_activity_id > 0) {
                                //await handleBotOperationMessageUpdate(request, i, 3, "Avoiding workbook mapping bot on child opportunity");
                                i.bot_operation_end_datetime = util.getCurrentUTCTime();
                                i.bot_operation_error_message = "Avoiding workbook mapping bot on child opportunity";
                                break;
                            }
                        }

                        //For Workbook logs
                        request.activity_product_selection = (typeof activityProductSelection === 'object') ? JSON.stringify(activityProductSelection) : activityProductSelection;
                        let [err, response] = await activityCommonService.workbookTrxInsert(request);
                        util.logInfo(request, `response : %j`, response);
                        request.debug_info.push('response: ' + response);

                        let workbookTxnID = (response.length > 0) ? response[0].transaction_id : 0;
                        request.activity_workbook_transaction_id = workbookTxnID;
                        ///////////////////////////

                        if (Number(flag) === 1) {
                            if (Number(request.activity_type_id) === 152184) {
                                util.logInfo(request, `Its a BC workflow Form : ${request.form_id} -- ${request.form_name}`);
                                request.debug_info.push('request.form_id: ' + request.form_id);
                                request.debug_info.push('request.form_name: ' + request.form_name);
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
                                    } else if (global.mode === "prod") {
                                        baseURL = null;
                                        //sqsQueueUrl = `https://sqs.ap-south-1.amazonaws.com/430506864995/prod-vil-excel-job-queue.fifo`;
                                        sqsQueueUrl = global.config.excelBotSQSQueue;
                                    }
                                    logger.info(request.workflow_activity_id + ": inserting status into database %j", [], { type: 'bot_engine', request_body: request });
                                    let [sqsInserErr, insertData] = await insertSqsStatus({ ...request, bot_operation_id: 18 });
                                    request.bot_excel_log_transaction = insertData;
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
                                    }, async (error, data) => {
                                        if (error) {
                                            logger.error("Error sending excel job to SQS queue", { type: 'bot_engine', error: serializeError(error), request_body: request });
                                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                                            i.bot_operation_error_message = serializeError(error);
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
                                //await handleBotOperationMessageUpdate(request, i, 4, error);
                                i.bot_operation_end_datetime = util.getCurrentUTCTime();
                                i.bot_operation_error_message = serializeError(error);
                            }
                        } else {
                            util.logInfo(request, `Its not a custom Variant. Hence not triggering the Bot!`);
                            util.logInfo(request, `OR It has non-zero parent activity ID - ${Number(request.parent_activity_id)}`);
                            util.logInfo(request, `---------- TIMELINE ENTRY -----------`);
                            request.debug_info.push('Its not a custom Variant. Hence not triggering the Bot!');
                            request.debug_info.push('OR It has non-zero parent activity ID: ' + Number(request.parent_activity_id));

                            let timelineEntryDone = false;
                            for (let cartItem of cartItems) {
                                let productVariantActivityId = cartItem.product_variant_activity_id
                                let message = botOperationsJson.bot_operations.standard_product_cart_message[String(productVariantActivityId)];

                                if (message) {
                                    await addTimelineEntry({ ...request, content: message, subject: "sample", mail_body: request.mail_body, attachment: [], timeline_stream_type_id: request.timeline_stream_type_id }, 1);
                                    timelineEntryDone = true;
                                }
                            }

                            if (!timelineEntryDone) {
                                await addTimelineEntry({ ...request, content: `BC excel mapping is not configured for this opportunity as it is a standard plan`, subject: "sample", mail_body: request.mail_body, attachment: [], timeline_stream_type_id: request.timeline_stream_type_id }, 1);
                            }

                        }
                        //await handleBotOperationMessageUpdate(request, i, 3);
                        i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        break;

                    case 19: // Update CUID Bot
                        logger.silly("Update CUID Bot");
                        logger.silly("Update CUID Bot Request: %j", request);
                        let is_opportunity = false;
                        let updateCuids = {};
                        i.bot_operation_start_datetime = util.getCurrentUTCTime();
                        if (request.activity_type_category_id == 48 && (request.activity_type_id == 150258
                            || request.activity_type_id == 150229 || request.activity_type_id == 150192
                            || request.activity_type_id == 149818 || request.activity_type_id == 149752
                            || request.activity_type_id == 149058 || request.activity_type_id == 151728 || request.activity_type_id == 151727
                            || request.activity_type_id == 151729 || request.activity_type_id == 151730)) {
                            util.logInfo(request, `OPPORTUNITY :: ${request.activity_type_category_id} :: ${request.activity_type_id}`);
                            request.debug_info.push('activity_type_category_id: ' + request.activity_type_category_id);
                            request.debug_info.push('activity_type_id: ' + request.activity_type_id);

                            request.opportunity_update = true;
                            updateCuids = botOperationsJson.bot_operations.update_cuids;

                        } else if (Number(request.activity_type_category_id) === 63) {

                            let formID = request.form_id;
                            let activityId = request.workflow_activity_id || request.activity_id;

                            const momPointsData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                                organization_id: request.organization_id,
                                account_id: request.account_id
                            }, activityId, formID);

                            if (momPointsData.length === 1) {
                                request.calendar_event_id_update = true;
                                updateCuids = request.updateCuids;
                            }
                        } 
                        
                        if (Number(request.activity_type_category_id) === 48 && request.activity_type_id == 196190) {
                            updateCuids = botOperationsJson.bot_operations.update_cuids;
                        }           

                        try {
                            await updateCUIDBotOperation(request, formInlineDataMap, updateCuids);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("Error running the CUID update bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 24: // Due date edit Bot - ESMS
                        logger.silly("Due date edit Bot - ESMS");
                        logger.silly("Due date edit Bot - ESMS: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await this.setDueDateOfWorkflow(request, formInlineDataMap, botOperationsJson.bot_operations.due_date_edit, botOperationsJson.bot_operations.condition);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("Error running the setDueDateOfWorkflow", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 25: // participant_remove
                        logger.silly("[participant_remove] Params received from Request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await removeParticipant(request, botOperationsJson.bot_operations.participant_remove, formInlineDataMap);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[participant_remove] Error removing participant", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 26: // ESMS Integrations- Consume Part - Bot
                        logger.silly("[ESMS Integrations- Consume] Params received from Request: %j", request);
                        let esmsIntegrationsTopicName = global.config.ESMS_INTEGRATIONS_TOPIC || "";

                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            if (esmsIntegrationsTopicName === "") { throw new Error("EsmsIntegrationsTopicNotDefinedForMode"); }
                            if (request.hasOwnProperty("do_not_trigger_integrations_bot") && Number(request.do_not_trigger_integrations_bot) === 1) { throw new Error("DoNotTriggerIntegrationsBot"); }
                            await queueWrapper.raiseActivityEventToTopicPromise({
                                type: "VIL_ESMS_IBMMQ_INTEGRATION",
                                trigger_form_id: Number(request.trigger_form_id),
                                form_transaction_id: Number(request.form_transaction_id),
                                payload: request
                            }, esmsIntegrationsTopicName, request.workflow_activity_id || request.activity_id);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            // await handleBotOperationMessageUpdate(request, i, 3);
                        } catch (error) {
                            logger.error("[ESMS Integrations- Consume] Error during consuming", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 28: //Arithmetic Bot
                        logger.silly("ArithMetic Bot Params received from Request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            util.logInfo(request, `botOperationsJson in Arithmetic Bot: %j`, botOperationsJson);
                            request.debug_info.push('botOperationsJson in Arithmetic Bot: ' + botOperationsJson);
                            await arithmeticBot(request, formInlineDataMap, botOperationsJson.bot_operations.arithmetic_calculation);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[Arithmetic Bot] Error in Arithmetic Bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 29: //Reminder Bot
                        logger.silly("Reminder Bot Params received from Request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await reminderBot(request, formInlineDataMap, botOperationsJson.bot_operations.date_reminder);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            //await handleBotOperationMessageUpdate(request, i, 3);
                        } catch (error) {
                            logger.error("[Reminder Bot] Error in Reminder Bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                        }
                        break;

                    case 30: // Bulk Feasibility Excel Parser Bot
                        logger.silly("Bulk Feasibility Excel Parser Bot params received from request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            // await bulkFeasibilityBot(request, formInlineDataMap, botOperationsJson.bot_operations.bulk_feasibility);
                            let requestForSQS = {
                                request: request,
                                sqs_switch_flag: 4,
                                formInlineDataMap: formInlineDataMap,
                                inlineJSON: botOperationsJson.bot_operations.bulk_feasibility
                            }
                            sendToSqsPdfGeneration(requestForSQS);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[Bulk Feasibility Excel Parser Bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 31: // workflow start bot
                        util.logInfo(request, '****************************************************************');
                        util.logInfo(request, 'WorkFlow Bot');
                        request.debug_info.push('WorkFlow Bot');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            // util.logInfo(request, 'Request Params received by BOT ENGINE', request, {});
                            util.logInfo(request, `workflow start | Request Params received by BOT ENGINE`);
                            request.debug_info.push('workflow start | Request Params received by BOT ENGINE' + request);
                            await workFlowCopyFields(request, botOperationsJson.bot_operations.form_field_copy, botOperationsJson.bot_operations.condition);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            util.logError(request, 'Error in executing workflow start Step', { err });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            //return Promise.reject(err);
                        }
                        util.logInfo(request, '****************************************************************');
                        break;

                    case 33: //Global Add Participant
                        util.logInfo(request, '****************************************************************');
                        util.logInfo(request, 'GLOBAL PARTICIPANT ADD');
                        logger.info("Request Params received from Request: %j", request);
                        request.debug_info.push(request.workflow_activity_id + ': GLOBAL PARTICIPANT ADD');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await globalAddParticipant(request, botOperationsJson.bot_operations.participant_add, formInlineDataMap);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            util.logError(request, 'Error in executing Global addParticipant Step', { err });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            //return Promise.reject(err);
                        }
                        util.logInfo(request, '****************************************************************');
                        break;

                    case 34: // ARP
                        util.logInfo(request, request.workflow_activity_id + ': ****************************************************************');
                        util.logInfo(request, request.workflow_activity_id + ': ARPBot');
                        logger.info(request.workflow_activity_id + ": ARP: Request Params received from Request: %j", request);
                        request.debug_info.push(request.workflow_activity_id + ': ARPBot');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await arpBot(request, botOperationsJson.bot_operations);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            util.logError(request, 'Error in executing ARPBot Step', { err });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "log": request.debug_info,
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                        }
                        util.logInfo(request, '****************************************************************');

                        break;

                    case 35: //custom bot
                        util.logInfo(request, '****************************************************************');
                        util.logInfo(request, 'checkLargeDoa');
                        logger.info(request.workflow_activity_id + ": Request Params received from Request: %j", request);
                        request.debug_info.push(request.workflow_activity_id + ':checkLargeDoa');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            request.botOperationInlineData = botOperationsJson.bot_operations.bot_inline;
                            request.bot_inline_data = '';
                            request.bot_operation_type_id = 35;
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
                            } else if (global.mode === "prod") {
                                baseURL = null;
                                //sqsQueueUrl = `https://sqs.ap-south-1.amazonaws.com/430506864995/prod-vil-excel-job-queue.fifo`;
                                sqsQueueUrl = global.config.excelBotSQSQueue;
                            }
                            logger.info(request.workflow_activity_id + ": inserting status into database %j " + JSON.stringify({ type: 'bot_engine', request_body: request }));
                            let [sqsInserErr, insertData] = await insertSqsStatus({ ...request, bot_operation_id: 35 });
                            request.bot_excel_log_transaction = insertData;
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
                            }, async (error, data) => {
                                if (error) {
                                    logger.error(request.workflow_activity_id + " Error sending excel job to SQS queue", { type: 'bot_engine', error: serializeError(error), request_body: request });

                                    activityCommonService.workbookTrxUpdate({
                                        activity_workbook_transaction_id: workbookTxnID,
                                        flag_generated: -1, //Error pushing to SQS Queue
                                        url: ''
                                    });
                                    //await handleBotOperationMessageUpdate(request, i, 4, error);
                                    i.bot_operation_end_datetime = util.getCurrentUTCTime();
                                    i.bot_operation_error_message = serializeError(error);
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
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            util.logError(request, 'Error in executing checkCustomBot Step', { err });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "log": request.debug_info,
                                "err": err
                            });
                            //return Promise.reject(err);
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                        }
                        util.logInfo(request, '****************************************************************');
                        break;

                    case 36: //SME ILL DOA Bot
                        util.logInfo(request, '****************************************************************');
                        util.logInfo(request, 'SME ILL Bot');
                        logger.info("Request Params received from Request: %j", request);
                        request.debug_info.push('SME ILL Bot');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            // await checkSmeBot(request, botOperationsJson.bot_operations.bot_inline);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            util.logError(request, 'Error in executing SME ILL Bot Step', { err });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            //return Promise.reject(err);
                        }
                        util.logInfo(request, '****************************************************************');
                        break;
                    case 37: //PDF generation Bot
                        util.logInfo(request, `entered 37`);
                        let pdf_json = JSON.parse(i.bot_operation_inline_data);
                        request.pdf_json = pdf_json;
                        request.generate_pdf = 1;
                        request.bot_operation_id = 37;
                        i.bot_operation_start_datetime = util.getCurrentUTCTime();
                        sendToSqsPdfGeneration(request);
                        //await handleBotOperationMessageUpdate(request, i, 3);
                        i.bot_operation_end_datetime = util.getCurrentUTCTime();

                        // try{
                        // let pdf_json = JSON.parse(i.bot_operation_inline_data);
                        // let activity_inline_data_json = JSON.parse(request.activity_inline_data);

                        // let workbook_json = activity_inline_data_json.filter((inline)=>inline.field_id == pdf_json.bot_operations.workbook_field_id);
                        // console.log("workbook",workbook_json)
                        // let combo_id_json = activity_inline_data_json.filter((inline)=>inline.field_id == pdf_json.bot_operations.product_field_id);
                        // console.log("comboid json",combo_id_json)
                        // let workbook_file_path = await util.downloadS3ObjectVil(request,workbook_json[0].field_value);
                        // console.log("excel file path ",workbook_file_path);
                        // let sheetIndexes = pdf_json.bot_operations[combo_id_json[0].data_type_combo_id];
                        // await new Promise((resolve, reject) => {
                        //     setTimeout(() => {
                        //         resolve();
                        //     }, 5000);
                        // });
                        // let pathModify = workbook_file_path.replace("/\/","/")
                        // let workbookFile =  new aspose.cells.Workbook(pathModify);

                        // console.log("length of excel",workbookFile.getWorksheets().getCount());
                        //  for (let i = 0; i < workbookFile.getWorksheets().getCount(); i++) {


                        //      let index = sheetIndexes.indexOf(i);
                        //      if (index == -1) {
                        //      workbookFile.getWorksheets().get(i).setVisible(false);
                        //       }
                        //       else{
                        //         console.log("index",i);
                        //       }
                        //  }
                        // //  workbookFile.save(workbook_file_path)
                        //  var saveOptions = aspose.cells.PdfSaveOptions();
                        //  saveOptions.setAllColumnsInOnePagePerSheet(true);

                        //  let fileName = util.getCurrentUTCTimestamp();
                        //  let filePath = global.config.efsPath;
                        //  let pdfFilePath = `${filePath}${fileName}.pdf`;
                        //  console.log("pdf file path",pdfFilePath);
                        //  workbookFile.save(pdfFilePath,saveOptions);

                        //  let [error,pdfS3Link] = await util.uploadPdfFileToS3(request,pdfFilePath);
                        //  console.log(pdfS3Link);
                        //  fs.unlink(pdfFilePath,()=>{});
                        //  fs.unlink(workbook_file_path,()=>{})
                        //  request.content = "pdf entry sample test";
                        //  request.subject = 'pdf entry sample test';

                        //  await addTimelineEntry(request,1,[pdfS3Link[0].location]);
                        // }
                        // catch(err){
                        //     console.log("error while generation pdf",err)
                        // }
                        break;
                    case 38:  //Static copy field bot
                        util.logInfo(request, '****************************************************************');
                        util.logInfo(request, 'Static copy field bot');
                        logger.silly("Request Params received from Request: %j", request);
                        request.debug_info.push('Static copy field bot ');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            staticCopyField(request, botOperationsJson.bot_operations.static_form_field_copy);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            util.logError(request, 'Error in executing Static copy field bot Step', { err });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                        }
                        util.logInfo(request, '****************************************************************');
                        break;
                    case 39:  //Asset approval
                        util.logInfo(request, '****************************************************************');
                        util.logInfo(request, 'Asset approval workflow bot');
                        logger.silly("Request Params received from Request: %j", request);
                        //JSON.parse(i.bot_operation_inline_data)
                        i.bot_operation_start_datetime = util.getCurrentUTCTime();
                        let approveJson = JSON.parse(i.bot_operation_inline_data).bot_operations.condition;

                        try {
                            let [err1, data] = await assetApprovalWorkflow(request, approveJson);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            //await handleBotOperationMessageUpdate(request, i, 3);
                        } catch (error) {
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                        }

                        util.logInfo(request, '****************************************************************');
                        break;
                    case 40: // Bulk Create SR Bot
                        logger.silly("Bulk Create SR Bot params received from request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await bulkCreateSRBot(request, formInlineDataMap, botOperationsJson.bot_operations.bulk_create_sr);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[Bulk Create SR Bot Bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 42: //Leave Aplication
                        logger.silly("Leave Aplication Bot params received from request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            let leaveStartDatetime = await getFormFieldValue(request, botOperationsJson.bot_operations.leave_start_datetime_field_id);
                            let leaveEndDatetime = await getFormFieldValue(request, botOperationsJson.bot_operations.leave_end_datetime_field_id);
                            let leaveDaysCount = await getFormFieldValue(request, botOperationsJson.bot_operations.leave_days_count_field_id);
/*
                            if (!util.checkDateFormat(fieldValue, "yyyy-MM-dd hh:mm:ss")) {
                                if (botOperationsJson.bot_operations.leave_flag == 2) {
                                    fieldValue = util.getFormatedLogDatetime(fieldValue);
                                    fieldValue = util.addDays(fieldValue, 1);
                                    fieldValue = util.subtractUnitsFromDateTime(fieldValue, 1, 'seconds');
                                }
                            }
*/
                            //await applyLeave(request, botOperationsJson.bot_operations.leave_flag, fieldValue);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            // await handleBotOperationMessageUpdate(request, i, 3);
                            await applyWorkflowLeave(request, leaveStartDatetime, leaveEndDatetime, leaveDaysCount);
                        } catch (error) {
                            logger.error("[Leave Aplication Bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                        }
                        break;

                    case 44: //FTP
                        logger.info(request.workflow_activity_id + ": FTP Bot params received from request: %j", request);
                        i.bot_operation_start_datetime = util.getCurrentUTCTime();
                        let ftpJson = JSON.parse(i.bot_operation_inline_data).bot_operations.ftp_upload;
                        let s3url = await getFormFieldValue(request, ftpJson.field_id)
                        sendToSqsPdfGeneration({ ...request, sqs_switch_flag: 2, s3url, ftpJson, bot_operation_id: 44 });
                        //await handleBotOperationMessageUpdate(request, i, 3);
                        i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        // try {
                        //     let ftpJson = JSON.parse(i.bot_operation_inline_data).bot_operations.ftp_upload;
                        //     let s3url = await getFormFieldValue(request,ftpJson.field_id)
                        //     let fileName = await util.downloadS3Object(request,s3url);
                        //     let fileData = fileName.split('/');
                        //     let finalName = fileData[fileData.length-1]
                        //     let dataToSend = fs.createReadStream(fileName);
                        //     let remote = `${ftpJson.ftp_upload_location}/${finalName}`;
                        //     let serverConfig = {
                        //         host:ftpJson.ftp_address,
                        //         port:ftpJson.ftp_port,
                        //         username:ftpJson.ftp_username,
                        //         password:ftpJson.ftp_password,
                        //     }
                        //     sftp.connect(serverConfig).then(() => {
                        //       return sftp.put(dataToSend, remote);
                        //     }).then(data => {
                        //       console.log(data, 'the data info');
                        //       fs.unlink(fileName);
                        //     }).catch(err => {
                        //       console.log(err, 'catch error');
                        //     });

                        // } catch (error) {
                        //     logger.error("[FTP Bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                        //     i.bot_operation_status_id = 2;
                        //     i.bot_operation_inline_data = JSON.stringify({
                        //     "error": error
                        //     });
                        // }
                        break;

                    case 45:
                        logger.silly("Remove CUID Bot");
                        logger.silly("Remove CUID Bot Request: %j", request);
                        logger.info("Remove CUID BOT : " + JSON.stringify(botOperationsJson.bot_operations))
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await removeCUIDs(request, botOperationsJson.bot_operations);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("Error running the CUID update bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error,
                                "error_stack": error.stack
                            });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                        }
                        break;


                    case 46: //Forcast Category, Product Quantity in drilldown
                        util.logInfo(request, `****************************************************************`);
                        util.logInfo(request, ` ${request.workflow_activity_id} : Widget drilldown additional fields: Request Params received from Request: %j`, request);
                        request.debug_info.push(request.workflow_activity_id + ': Widget drilldown additional fields');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            //if(botOperationsJson.bot_operations.is_product == 1){
                            request.is_product = botOperationsJson.bot_operations.is_product;
                            request.is_cart = botOperationsJson.bot_operations.is_cart;
                            request.final_key = botOperationsJson.bot_operations.final_key;
                            //}
                            let fieldValue = await getFormFieldValue(request, botOperationsJson.bot_operations.field_id);
                            await activitySearchListUpdateAddition(request, botOperationsJson.bot_operations.column_flag, fieldValue);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            util.logError(request, `[Widget drilldown additional fields] Error: `, { type: 'bot_engine', error: serializeError(error) });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "log": request.debug_info,
                                "error": error
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 48: // pdf_edit
                        util.logInfo(request, `****************************************************************`);
                        util.logInfo(request, `pdf_edit`);
                        logger.silly('pdf_edit | Request Params received by BOT ENGINE: %j', request);
                        request.debug_info.push('pdf_edit');
                        util.logInfo(request, `botOperationsJson : %j`, botOperationsJson);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await editPDF(request, JSON.parse(i.bot_operation_inline_data));
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            logger.error("serverError | Error in executing pdf_edit Step", { type: "bot_engine", request_body: request, error: serializeError(err) });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                        }
                        util.logInfo(request, `****************************************************************`);
                        break;
                    case 49: // Bulk Third Party Bot
                        logger.silly("Bulk Third party opex Bot params received from request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await bulkThirdPartyOpexBot(request, formInlineDataMap, botOperationsJson.bot_operations.third_party_opex_bulk);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[Bulk Third party opex Bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 50: // Activity Update customer data 
                        util.logInfo(request, `****************************************************************`);
                        util.logInfo(request, ` `);
                        logger.silly('Activity Update customer data | Request Params received by BOT ENGINE: %j', request);
                        request.debug_info.push('pdf_edit');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await activityUpdateCustomerData(request, botOperationsJson.bot_operations);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            logger.error("serverError | Error in executing Activity Update customer data  Step", { type: "bot_engine", request_body: request, error: serializeError(err) });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                        }
                        util.logInfo(request, `****************************************************************`);
                        break;

                    case 51: // Autopopulate BC excel
                        util.logInfo(request, `****************************************************************`);
                        util.logInfo(request, ` `);
                        logger.silly('Autopopulate BC excel | Request Params received by BOT ENGINE: %j', request);
                        request.debug_info.push('bc_auto_populate');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            util.logInfo(request, `botOperationsJson.bot_operations.condition.form_id ${botOperationsJson.bot_operations.condition.form_id}`);
                            sendToSqsPdfGeneration({ ...request, sqs_switch_flag: 3, bot_operation_id: 51, third_party_opex_form_id: botOperationsJson.bot_operations.condition.form_id });
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            logger.error("Autopopulate | Error in pushing sqs message for autopopulate", { type: "bot_engine", request_body: request, error: serializeError(err) });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                        }
                        util.logInfo(request, `****************************************************************`);
                        break;

                    case 53: // Calender Auto form submittion
                        util.logInfo(request, `****************************************************************`);

                        request.debug_info.push('calender_auto_form_submittion');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            util.logInfo(request, `came in auto submit`);
                            autoFormSubmission(request, botOperationsJson.bot_operations);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            logger.error("Auto form submission | Error ", { type: "bot_engine", request_body: request, error: serializeError(err) });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                        }
                        util.logInfo(request, `****************************************************************`);
                        break;

                    case 54: // Child Order creation BOT
                        util.logInfo(request, '****************************************************************');
                        util.logInfo(request, 'WorkFlow Bot');
                        request.debug_info.push('WorkFlow Bot');
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            // global.logger.write('conLog', 'Request Params received by BOT ENGINE', request, {});
                            util.logInfo(request, `Child Order creation BOT | Request Params received by BOT ENGINE`);
                            request.debug_info.push('Child Order creation BOT | Request Params received by BOT ENGINE' + request);

                            let formData = (typeof request.activity_inline_data === 'string') ? JSON.parse(request.activity_inline_data) : request.activity_inline_data;

                            for (const fieldData of formData) {
                                if (Number(fieldData.field_id) == 312766) {
                                    let requestParams = {
                                        meeting_activity_id: request.workflow_activity_id,
                                        mom_excel_path: fieldData.field_value,
                                        status_id: 1,
                                        organization_id: request.organization_id,
                                        log_asset_id: request.asset_id,
                                    }
                                    let [insertError, insertResponseData] = await momBulkTransactionInsert(requestParams);

                                    if (!insertError && insertResponseData.length > 0) {
                                        request.meeting_transaction_id = insertResponseData[0].meeting_transaction_id
                                    }
                                    util.logInfo(request, `insertResponseData  %j`, insertResponseData);
                                    break;
                                }
                            }

                            util.logInfo(request, ` ${global.config.CHILD_ORDER_TOPIC_NAME} %j`, {
                                request,
                                requestType: "mom_child_orders",
                                form_field_copy: botOperationsJson.bot_operations.form_field_copy,
                                condition: botOperationsJson.bot_operations.condition
                            });

                            // await kafkaProdcucerForChildOrderCreation(global.config.CHILD_ORDER_TOPIC_NAME, {
                            //     request,
                            //     requestType: "mom_child_orders",
                            //     form_field_copy: botOperationsJson.bot_operations.form_field_copy,
                            //     condition: botOperationsJson.bot_operations.condition
                            // }).catch(global.logger.error);


                            sqs.sendMessage({
                                // DelaySeconds: 5,
                                MessageBody: JSON.stringify({
                                    request,
                                    requestType: "mom_child_orders",
                                    ...botOperationsJson.bot_operations
                                }),
                                QueueUrl: global.config.ChildOrdersSQSqueueUrl,
                                MessageGroupId: `mom-creation-queue-v1`,
                                MessageDeduplicationId: uuidv4(),
                                MessageAttributes: {
                                    "Environment": {
                                        DataType: "String",
                                        StringValue: global.mode
                                    },
                                }
                            }, async (error, data) => {
                                if (error) {
                                    logger.error(request.workflow_activity_id + ": Error sending excel job to SQS queue", { type: 'bot_engine', error: serializeError(error), request_body: request });
                                    util.logError(request, request.workflow_activity_id + `: Error sending excel job to SQS queue`, { type: 'bot_engine', error });
                                    //await handleBotOperationMessageUpdate(request, i, 4, error);
                                    i.bot_operation_end_datetime = util.getCurrentUTCTime();
                                    i.bot_operation_error_message = serializeError(error);
                                } else {
                                    logger.info(request.workflow_activity_id + ": Successfully sent excel job to SQS queue: %j", data, { type: 'bot_engine', request_body: request });
                                    util.logInfo(request, `${request.workflow_activity_id} : Successfully sent excel job to SQS queue:  %j`, data);
                                }
                            });

                            let params = {
                                QueueUrl: global.config.ChildOrdersSQSqueueUrl,
                                AttributeNames: ['ApproximateNumberOfMessages'],
                            };

                            sqs.getQueueAttributes(params, function (err, data) {
                                if (err) {
                                    util.logError(request, `Error`, { type: 'bot_engine', err });
                                } else {
                                    util.logInfo(request, `data %j`, data);
                                    util.logInfo(request, `data.Attributes.ApproximateNumberOfMessages : ${data.Attributes.ApproximateNumberOfMessages}`);

                                    if (Number(data.Attributes.ApproximateNumberOfMessages) >= 20) {
                                        addTimelineMessage(
                                            {
                                                activity_timeline_text: "Info",
                                                organization_id: request.organization_id
                                            }, request.workflow_activity_id || 0,
                                            {
                                                subject: 'Info: More Requests in queue',
                                                content: "There will be a slight delay in processing your request as we have received multiple requests at a time.\nPlease wait for sometime while we are processing your request.",
                                                mail_body: "There will be a slight delay in processing your request as we have received multiple requests at a time.\nPlease wait for sometime while we are processing your request.",
                                                attachments: []
                                            }
                                        );
                                    }
                                }
                            });
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (err) {
                            util.logError(request, 'Error in executing Child Order creation BOT Step', { err });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "err": err
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, err);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(err);
                            //return Promise.reject(err);
                        }
                        util.logInfo(request, '****************************************************************');
                        break;

                    case 55: // Non Ascii Check Bot
                        logger.silly("Non Ascci Check Bot params received from request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            let requestForSQS = {
                                request: request,
                                sqs_switch_flag: 5,
                                formInlineDataMap: formInlineDataMap,
                                inlineJSON: botOperationsJson.bot_operations.non_ascii_check
                            }
                            sendToSqsPdfGeneration(requestForSQS);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[Non Ascci Check Bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 56: // Midmile Excel Generation Bot
                        logger.silly("Midmile Excel Generation Bot: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await midmileExcelCreationBot(request, botOperationsJson.bot_operations);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            //await handleBotOperationMessageUpdate(request, i, 3);
                        } catch (error) {
                            logger.error("[Midmile Excel Generation Bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 57: // Add Pan to elastic

                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await addCUIDs(request, botOperationsJson.bot_operations);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[Add Pan to elastic Bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 58: // Close All Business case's when reffered optty is closed 

                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await closeRefferedOutActivities(request, botOperationsJson.bot_operations);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[Close Reffered Out Activities Bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 59: // Due date remove Bot - ESMS
                        logger.silly("Due date remove Bot - ESMS");
                        logger.silly("Due date remove Bot - ESMS: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await this.removeDueDateOfWorkflow(request, botOperationsJson.bot_operations.due_date_edit);
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("Error running the removeDueDateOfWorkflow", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;

                    case 60: // Sme Gemification bot
                        logger.silly("Sme Gemification bot");
                        logger.silly("Sme Gemification bot %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await this.smeGemification(request, {});
                            //await handleBotOperationMessageUpdate(request, i, 3);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("Error running the smeGemification", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                        }
                        break;
                    
                    case 61: // Leave Approval 
                        logger.silly("Leave Approval Bot params received from request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            let approvalFlag = botOperationsJson.bot_operations.approval_flag;
                            await updateLeaveApprovalStaus(request, approvalFlag);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[Leave Approval Bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                        }

                        break;

                    case 62: // PDF Validation Bot
                        logger.silly("PDf Validation Bot params received from request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await pdfValidationBot(request, botOperationsJson.bot_operations.pdf_validation);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[PDf Validation] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                        }
                        break;

                    case 63: // Custom Timeline Bot
                        logger.silly("Custom Timeline bot params received from request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await customTimelineEntryBot(request, botOperationsJson.bot_operations.timeline_entry);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[Custom Timeline bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                        }
                        break;

                    case 64: // Custom Qty Update bot
                        logger.silly("Custom Qty Update bot timeline Bot params received from request: %j", request);
                        try {
                            i.bot_operation_start_datetime = util.getCurrentUTCTime();
                            await customQtyUpdateBot(request, botOperationsJson.bot_operations.update_qty);
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                        } catch (error) {
                            logger.error("[Custom Qty Update bot] Error: ", { type: 'bot_engine', error: serializeError(error), request_body: request });
                            i.bot_operation_status_id = 2;
                            i.bot_operation_inline_data = JSON.stringify({
                                "error": error
                            });
                            i.bot_operation_end_datetime = util.getCurrentUTCTime();
                            i.bot_operation_error_message = serializeError(error);
                            //await handleBotOperationMessageUpdate(request, i, 4, error);
                        }

                        break;
                }

                await handleBotOperationMessageUpdate(request, i);
                //botOperationTxnInsert(request, i);
                // botOperationTxnInsertV1(request, i);
                await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    }, 1000);
                });
            }

            let processedStatusUpdateRequest = Object.assign({}, request);
            processedStatusUpdateRequest.status_id = 3;
            processedStatusUpdateRequest.log_asset_id = request.asset_id || 0;
            processedStatusUpdateRequest.consumed_datetime = null;
            processedStatusUpdateRequest.processed_datetime = util.getCurrentUTCTime();
            processedStatusUpdateRequest.failed_datetime = null;
            processedStatusUpdateRequest.log_datetime = util.getCurrentUTCTime();

            const [errorThree, __] = await activityCommonService.BOTMessageTransactionUpdateStatusAsync(processedStatusUpdateRequest);

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

        } catch (botException) {
            util.logError(botInitialRequest, "[botException] Error in bot exception", { error: botException });
        } finally {
            return { messageId: botMessageId };
        }

    };

   async function sendToSqsPdfGeneration(request){
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

    logger.info(request.workflow_activity_id+": inserting status into database %j", [], { type: 'bot_engine', request_body: request });
    let [sqsInserErr,insertData]= await insertSqsStatus(request);
    request.bot_excel_log_transaction = insertData;

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
            logger.error(request.workflow_activity_id+": Error sending excel job to SQS queue", { type: 'bot_engine', error: serializeError(error), request_body: request });
            util.logError(request,request.workflow_activity_id + `: Error sending excel job to SQS queue`, { type: 'bot_engine', error });
            // activityCommonService.workbookTrxUpdate({
            //     activity_workbook_transaction_id: workbookTxnID,
            //     flag_generated: -1, //Error pushing to SQS Queue
            //     url: ''
            // });
        } else {
            logger.info(request.workflow_activity_id+": Successfully sent excel job to SQS queue: %j", data, { type: 'bot_engine', request_body: request });    
            util.logInfo(request,request.workflow_activity_id + `: Successfully sent excel job to SQS queue: %j ` , data);                              
        }                                    
    });
   }

   async function getFieldDataComboIdUsingFieldIdV1(request,formID,fieldID) {
    util.logInfo(request,` `);
    util.logInfo(request,`************************`);
    util.logInfo(request,`request.form_id - ${request.form_id}`);
    util.logInfo(request,`formID - ${formID}`);
    util.logInfo(request,`fieldID - ${fieldID}`);

    let fieldValue = "";
    let formData;
    
    //Based on the workflow Activity Id - Fetch the latest entry from 713
    if(request.hasOwnProperty('workflow_activity_id') && Number(request.workflow_activity_id) > 0 && request.form_id != formID){
        formData = await getFormInlineData({
            organization_id: request.organization_id,
            account_id: request.account_id,
            workflow_activity_id: request.workflow_activity_id,
            form_id: formID
        },2);
    } else {
        //Take the inline data from the request
        formData = (typeof request.activity_inline_data === 'string') ? JSON.parse(request.activity_inline_data): request.activity_inline_data;
    }    

    //console.log('formData - ', formData);

    for(const fieldData of formData) {
        if(Number(fieldData.field_id) == fieldID) {
           
            util.logInfo(request,`fieldData.field_data_type_id : %j` , fieldData);
            switch(Number(fieldData.field_data_type_id)) {
                //Need Single selection and Drop Down
                //circle/ state

                case 57: //Account
                    fieldValue = fieldData.field_value;
                    fieldValue = fieldValue.split('|')[1];
                    break;
                //case 68: break;
                default: fieldValue=fieldData.data_type_combo_id;
            }
            break;
        }
    }


    util.logInfo(request,`Field Value B4: %j` , fieldValue);
    // fieldValue = fieldValue.split(" ").join("");
    // console.log('Field Value After: ',fieldValue);
    // console.log('*************************');
    return fieldValue;
}
/*
  async function editPDF(request,bot_data){
    //   request.debug_info = [];
    request.debug_info.push("****ENTERED PDF EDIT BOT****");
    let s3Url = "";
    let pdfPath = "";
    let customerName ="GreneOS";
    
    let bot_json = bot_data.bot_operations;
    if(bot_json.hasOwnProperty("static_pdf")&& bot_json.static_pdf=="true"){
    let pdfJson = bot_json.pdf_json;
    // let comboValue = await getFieldDataComboIdUsingFieldIdV1(request,pdfJson.form_id,pdfJson.field_id);
    
    // s3Url = pdfJson.pdfs[Number(comboValue)-1];
    s3Url = pdfJson.pdfs;
    }
    else{
        util.logInfo(request,"Sleeping for 9 sec",[]);
    await sleep(9000);
    // let activityInlineData = typeof request.activity_inline_data == 'string' ?JSON.stringify(request.activity_inline_data):request.activity_inline_data;
    
    let pdfJson = {
        mobility_json:{
            "pdf_url":"https://worlddesk-staging-j21qqcnj.s3.ap-south-1.amazonaws.com/868/1102/5918/41535/2021/04/103/1618390937999/Proposal---SocGen---Mobility.pdf",
            "fields":[
               {
                  "field_id":304213,
                  "pdf_search_name":"viperiod",
                  "sheet":6
               },
               {
                  "field_id":304210,
                  "pdf_search_name":"viassetname",
                  "sheet":2
               },
               {
                  "field_id":304224,
                  "pdf_search_name":"viplan",
                  "sheet":6
               },
               {
                  "field_id":304316,
                  "pdf_search_name":"viaov",
                  "sheet":6
               },
            //    {
            //       "field_id":311068,
            //       "pdf_search_name":"vitcv",
            //       "sheet":6
            //    }
            ]
         },
        feasibility_json:{"feasibility_feild_ids":[
            311053,
            311054,
            311055,
            311056,
            311057,
            311058,
            311059,
            311060
         ],
         "pdf_url":"https://worlddesk-staging-j21qqcnj.s3.ap-south-1.amazonaws.com/868/1102/5918/41535/2021/04/103/1618398697086/Proposal---SocGen---MPLS-L2.pdf",
         "fields":[
            {
               "field_id":311070,
               "pdf_search_name":"viplan",
               "sheet":16
            },
            {
               "field_id":311071,
               "pdf_search_name":"viband",
               "sheet":16
            },
            {
               "field_id":311069,
               "pdf_search_name":"viperiod",
               "sheet":16
            }
         ]},
        mobility_feild_ids:[311043,311044,311045,311046,311047,311048,311049,311050,311051,311052]
    };
    
    let isMobility = true;
    request.debug_info.push("checking which type of form it is");
    let product_name = "Mobility";

    // for(let i=0;i<pdfJson.mobility_feild_ids.length;i++){
    //   let field_value =  await getFormFieldValue(request,pdfJson.mobility_feild_ids[i]);
    //   if(field_value){
    //       product_name = field_value;
    //       isMobility=true;
    //       request.debug_info.push("it is a mobility type form");
    //   }
    // }
    util.logInfo(request,"is mob" + isMobility,[]);

    let pdf_edit_json = {}

    if(isMobility){
    pdf_edit_json = pdfJson.mobility_json;
    }
    else {
    pdf_edit_json = pdfJson.feasibility_json;
    for(let i=0;i<pdf_edit_json.feasibility_feild_ids.length;i++){
        let field_value =  await getFieldValueUsingFieldIdV1(request,50633,pdf_edit_json.feasibility_feild_ids[i]);
        if(field_value){
            product_name = field_value;
            
            request.debug_info.push("it is a feasibility type form");
        }
    }
    }
    let pdf_url = pdf_edit_json.pdf_url;

    let pdfFileName = await util.downloadS3Object(request, pdf_url);
     pdfPath =  path.resolve(global.config.efsPath, pdfFileName);
    console.log(pdfPath,pdfFileName);
    // let pdfPath = "C:/Users/shankar/Downloads/Proposal---SocGen---MPLS-L2.pdf"
    await sleep(2000)
    request.debug_info.push("Product name ",product_name);

    //getting accounts of asset
    let [accerr,accountDetails] = await adminOpsService.getAdminAssetMappedList(request);
    let accountName = accountDetails[0].activity_title;
    request.debug_info.push("account name ",accountName);

    // getting asset Details
    const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
        organization_id: request.organization_id,
        asset_id: request.asset_id
    });
     customerName = assetData[0].operating_asset_first_name?assetData[0].operating_asset_first_name:assetData[0].asset_first_name;
    request.debug_info.push("customer name ",customerName);
let aovValue = 0;
let periodValue = 0;
   for(let i=0;i<pdf_edit_json.fields.length;i++){
    util.logInfo(request,"pdf fields"+ pdf_edit_json.fields[i].field_id,pdf_edit_json.fields[i],[]);
      
    let field_value = "";
    if(isMobility){
    // field_value =  await getFormFieldValue(request,pdf_edit_json.fields[i].field_id);
    field_value =  await getFieldValueUsingFieldIdV1(request,50294,pdf_edit_json.fields[i].field_id);
    }
    else{
        field_value =  await getFieldValueUsingFieldIdV1(request,50633,pdf_edit_json.fields[i].field_id);
    }
    
    if(field_value){
        // console.log("came inside");
        try{
       await pdfreplaceText(pdfPath, pdfPath,pdf_edit_json.fields[i].sheet , pdf_edit_json.fields[i].pdf_search_name, field_value);
      
        }
        catch(err){
            console.log(err)
        }
    }
    if(pdf_edit_json.fields[i].pdf_search_name == 'viaov' && field_value){
        aovValue= Number(field_value);
    }
    if(pdf_edit_json.fields[i].pdf_search_name == 'viperiod' && field_value){
        periodValue= Number(field_value);
    }
   }
   //adding account name
   await pdfreplaceText(pdfPath, pdfPath,0 , "viaccna", accountName);
// await pdfreplaceText(pdfPath, pdfPath,0 , "viaccna", "Shankar Reddy");

   //adding customer name
//    await pdfreplaceText(pdfPath, pdfPath,2 , "viassetname", customerName);

   //adding product name
   await pdfreplaceText(pdfPath, pdfPath,0 , "viprodhead", `Proposal for Product Name -${product_name}`);

   //adding product name
   await pdfreplaceText(pdfPath, pdfPath,isMobility?6:16 , "viprod", product_name);

   //adding tcv value
   await pdfreplaceText(pdfPath, pdfPath,isMobility?6:16 , "vitcv", aovValue*periodValue);

   //adding current date
   let currentDate = (util.getCurrentDate()).toString();
   await pdfreplaceText(pdfPath, pdfPath,2 , "vidate", currentDate);
// return [false,[]]
   let pdfS3urlnew = await util.uploadPdfFileToS3(request,pdfPath);
    s3Url = pdfS3urlnew[1][0].location;
}
    // let addCommentRequest = Object.assign(request, {});
    
    // request.form_id = request.form_id;
    // request.activity_form_id = request.form_id
    // request.activity_inline_data = JSON.stringify([
    //     {"form_id":50639,"field_id":"311124","field_name":"PDF Scan",
    //     "field_data_type_id":51,"field_data_type_category_id":13,
    //     "data_type_combo_id":0,"data_type_combo_value":"0",
    //     "field_value":s3Url,
    //     "message_unique_id":1618208278588}])
    // await submitFormV1(request);

    let addCommentRequest = request;
    addCommentRequest.asset_id = 100;
    addCommentRequest.device_os_id = 7;
    addCommentRequest.activity_type_category_id = 48;
    addCommentRequest.activity_type_id = request.activity_type_id;
    addCommentRequest.activity_id = request.workflow_activity_id;
    addCommentRequest.activity_timeline_collection = JSON.stringify({
        "content": `${customerName} has added attachment(s).`,
        "subject": `${customerName} has added attachment(s).`,
        "mail_body": `${customerName} has added attachment(s).`,
        "attachments": [s3Url]
    });
    addCommentRequest.activity_stream_type_id = 325;
    addCommentRequest.timeline_stream_type_id = 325;
    addCommentRequest.activity_timeline_text = "";
    addCommentRequest.activity_access_role_id = 27;
    addCommentRequest.operating_asset_first_name = customerName;
    addCommentRequest.datetime_log = util.getCurrentUTCTime();
    addCommentRequest.track_gps_datetime = util.getCurrentUTCTime();
    addCommentRequest.flag_timeline_entry = 1;
    addCommentRequest.log_asset_id = 100;
    addCommentRequest.attachment_type_id = 17;
    addCommentRequest.attachment_type_name = path.basename(s3Url);
    addCommentRequest.message_unique_id=1618208278588;

    const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
    try {
        await addTimelineTransactionAsync(addCommentRequest);
    } catch (error) {
        util.logError(request,"addPdfFromHtmlTemplate | addCommentRequest | addTimelineTransactionAsync | Error: ",error)
        
        throw new Error(error);
    }
    if(pdfPath !=""){
    fs.unlink(pdfPath,()=>{});
    }
    request.debug_info.push("****EXITED PDF EDIT BOT****");
    return [false,[]]
   }
*/
   function pdfstrToByteArray(str) {
    let myBuffer = [];
    let buffer = Buffer.from(str);
    for (let i = 0; i < buffer.length; i++) {
        myBuffer.push(buffer[i]);
    }
    return myBuffer;
  }
  /*
  function pdfreplaceText(sourceFile, targetFile, pageNumber, findText, replaceText) {  
    //   console.log("in",pageNumber,findText,replaceText)
      var writer = hummus.createWriterToModify(sourceFile, {
          modifiedFilePath: targetFile
      });
      var sourceParser = writer.createPDFCopyingContextForModifiedFile().getSourceDocumentParser();
      var pageObject = sourceParser.parsePage(Number(pageNumber));
      var textObjectId = pageObject.getDictionary().toJSObject().Contents.getObjectID();
      var textStream = sourceParser.queryDictionaryObject(pageObject.getDictionary(), 'Contents');
      //read the original block of text data
      var data = [];
      var readStream = sourceParser.startReadingFromStream(textStream);
      while(readStream.notEnded()){
          Array.prototype.push.apply(data, readStream.read(10000));
      }
    //   console.log(findText)
      var string = Buffer.from(data).toString();
  for(let i =0;i<findText.length;i++){
  var characters = findText;
  var match = [];
  for (var a = 0; a < characters.length; a++) {
      match.push('(-?[0-9]+)?(\\()?' + characters[a] + '(\\))?');
  }
//   console.log("---",match)
  string = string.replace(new RegExp(match.join('')), function(m, m1) {
      // m1 holds the first item which is a space
      return m1 + '( ' + replaceText + ')';
  });
}
  
      //Create and write our new text object
      var objectsContext = writer.getObjectsContext();
      objectsContext.startModifiedIndirectObject(textObjectId);
  
      var stream = objectsContext.startUnfilteredPDFStream();
      stream.getWriteStream().write(pdfstrToByteArray(string));
      objectsContext.endPDFStream(stream);
  
      objectsContext.endIndirectObject();
  
      writer.end();
  }
*/
  async function activityUpdateCustomerData(request,bot_details) {
      let req_Json = bot_details.customer_data_set;
      let field_value = await getFieldValueUsingFieldIdV1(request,req_Json.form_id,req_Json.field_id)
let assetDetailsArr = field_value.split('|')
    let responseData = [],
    error = true;

const paramsArr = new Array(
    request.organization_id,
    request.activity_id,
    assetDetailsArr[0],
    request.asset_id || 0,
    util.getCurrentUTCTime()
);
const queryString = util.getQueryString('ds_v1_activity_list_update_customer', paramsArr);

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

   async function assetApprovalWorkflow(request,bot_data){
    let responseData = [];
    let error = false;
    let workflowActivityID = request.workflow_activity_id;
    let wfActivityDetails = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
    let creatorAssetID;
    if(wfActivityDetails.length>0){
     creatorAssetID = wfActivityDetails[0].activity_creator_asset_id
    }
     // let tagetAsset_id =

     if(bot_data.hasOwnProperty("rejected")&&bot_data.rejected==1){
       await removeAsLeadAndAssignCreaterAsLead(request,workflowActivityID,creatorAssetID,creatorAssetID)
     }
     else{
        // console.log(wfActivityDetails[0]);
         let activity_inline_data_json = typeof wfActivityDetails[0].activity_inline_data =="string"?JSON.parse(wfActivityDetails[0].activity_inline_data):wfActivityDetails[0].activity_inline_data;
         activity_inline_data_json = typeof activity_inline_data_json == "string" ? JSON.parse(activity_inline_data_json):activity_inline_data_json;
         let target_asset_id_form = activity_inline_data_json.filter(formdata=>formdata.field_id==bot_data.field_id);
         util.logInfo(request,`target_asset_id_form : %j` , target_asset_id_form);
         let target_asset_id = target_asset_id_form[0].field_value;
        //  console.log(assetfeildDetails)
        //  let target_asset_id = assetfeildDetails.field_value;
        //  const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
        //     organization_id: request.organization_id,
        //     asset_id: target_asset_id
        // });
        // ds_p1_asset_list_update_flag_asset_approval`(
        //     IN p_organization_id BIGINT(20),
        //     IN p_account_id BIGINT(20),
        //     IN p_workforce_id BIGINT(20),
        //     IN p_asset_id BIGINT(20),
        //     IN p_asset_flag_approval TINYINT(4));
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            target_asset_id,
            1,
            util.getCurrentUTCTime(),
            request.workflow_activity_id
        );

        let queryString = util.getQueryString('ds_p1_asset_list_update_flag_asset_approval',paramsArr);
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
        // let target_asset_id =
         //update approval flag
     }
     return [error,[]]
   }

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
            util.logInfo(request,`isBotOperationConditionTrue | fieldValue: %j` , fieldValue);

            let isConditionTrue = await checkForThresholdCondition(fieldValue, threshold, operation);
            util.logInfo(request,`isBotOperationConditionTrue | isConditionTrue: ${isConditionTrue}`);

            return isConditionTrue;
        } else {
            return true;
        }
    }

    async function checkForThresholdCondition(value, threshold, operation) {
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

            util.logInfo(request,`Inline data`);
            util.logInfo(request,` %j` , inlineData);
            request.debug_info.push('inlineData: ' + JSON.stringify(inlineData));

            let type = Object.keys(inlineData);
                util.logInfo(request, 'removeParticipant type: %j', type);
                request.debug_info.push('type: ' + type);

            //console.log('type[0]: ', type[0]);
            //if(type[0] === 'flag_esms') {
            if(type.includes('static')){
                    assetID = Number(inlineData[type[0]].asset_id);
                    util.logInfo(request,`STATIC - Asset ID : ${assetID}`);
                    request.debug_info.push('STATIC - Asset ID : '+ assetID);
                }
                else if(type.includes('from_request')){
                    assetID = Number(request.asset_id);
                    util.logInfo(request,`from_request - Asset ID : ${assetID}`);
                    request.debug_info.push('from_request - Asset ID : '+ assetID);
                } else if(type.includes('asset_reference'))
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
                        util.logInfo(request,`Asset Reference - Asset ID : ${assetID}`);
                        request.debug_info.push(' Asset ID: ' + assetID);
                }

            let wfActivityDetails = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);

            if(wfActivityDetails.length > 0) {                    
                let leadAssetID = Number(wfActivityDetails[0].activity_lead_asset_id);
                let creatorAssetID = Number(wfActivityDetails[0].activity_creator_asset_id);
                let ownerAssetID = Number(wfActivityDetails[0].activity_owner_asset_id)
                    
                util.logInfo(request,`Asset ID : ${assetID}`);
                util.logInfo(request,`Lead Asset ID : ${leadAssetID}`);
                util.logInfo(request,`Creator Asset ID : ${creatorAssetID}`);
                request.debug_info.push('Asset ID : '+ assetID);
                request.debug_info.push('Lead Asset ID : '+ leadAssetID);
                request.debug_info.push('Creator Asset ID : '+ creatorAssetID);


                if(Number(inlineData["flag_remove_lead"]) === 1){
                    util.logInfo(request,`Remove as lead`);
                    request.debug_info.push('Remove as lead');
                    await removeAsLead(request,workflowActivityID,leadAssetID);
                }
                
                else if(Number(inlineData["flag_remove_owner"]) === 1){

                    util.logInfo(request,`Remove as Owner`);
                    request.debug_info.push('Remove as Owner');
                    let reqDataForRemovingAsOwner = { 
                        activity_id : workflowActivityID,
                        target_asset_id : assetID,
                        organization_id : request.organization_id,
                        owner_flag : 0,
                    }
                 await removeAsOwner(request,reqDataForRemovingAsOwner,0);

                }
                else if(Number(inlineData["flag_remove_creator_as_owner"]) === 1 ){
                    util.logInfo(request,`Remove Creator as owner`);
                    request.debug_info.push("Remove Creator as owner");
                    let reqDataForRemovingCreaterAsOwner = { 
                        activity_id : workflowActivityID,
                        target_asset_id : creatorAssetID,
                        organization_id : request.organization_id,
                        owner_flag : 0,
                    };
                 await removeAsOwner(request,reqDataForRemovingCreaterAsOwner,0);

                }
                else if(Number(inlineData["flag_remove_participant"]) === 1){

                    util.logInfo(request,`Remove Participant`);
                    request.debug_info.push("Remove Participant");

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
                request.debug_info.push("Error in processing remove participant Bot", " Error : "+ error, "Error Stack : " + error.stack );
                throw new Error("Error in processing remove participant Bot");
            }
        }
        
        return;
    }

    async function removeAsLead(request,workflowActivityID, leadAssetID)
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
            util.logInfo(request,`Remove lead asset inside if--------`);
            request.debug_info.push("Remove lead asset inside if--------");
            let leadAssetFirstName = '',leadOperatingAssetFirstName='';
            try {
                const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
                    organization_id: request.organization_id,
                    asset_id: leadAssetID
                });
        
                util.logInfo(request,`********************************`);
                util.logInfo(request,`LEAD ASSET DATA - %j` , assetData[0]);
                util.logInfo(request,`********************************`);
                request.debug_info.push('LEAD ASSET DATA - '+ assetData[0]);
                // leadAssetFirstName = assetData[0].asset_first_name;
                leadOperatingAssetFirstName = assetData[0].operating_asset_first_name;
            } catch (error) {
                util.logError(request,`Error removeAsLead`, { type: 'bot_engine', error });
            }
            
            // const [log_error, log_assetData] = await activityCommonService.getAssetDetailsAsync({
            //     organization_id: request.organization_id,
            //     asset_id: request.asset_id
            // });
            // let logAssetFirstName = log_assetData[0].operating_asset_first_name;
            // console.log("***********changed from ${defaultAssetName} to name****************",log_assetData[0].asset_id)
            //Add a timeline entry
            const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);

            let activityTimelineCollection =  JSON.stringify({                            
                "content": `${defaultAssetName} removed ${leadOperatingAssetFirstName} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
                "subject": `Note - ${util.getCurrentDate()}.`,
                "mail_body": `${defaultAssetName} removed ${leadOperatingAssetFirstName} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
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

        util.logInfo(request,`********************************`);
        util.logInfo(request,`LEAD ASSET DATA - %j` , assetData[0]);
        util.logInfo(request,`********************************`);
        request.debug_info.push('LEAD ASSET DATA - '+ assetData[0]);
        leadAssetFirstName = assetData[0].operating_asset_first_name;
    } catch (error) {
        util.logError(request,`Error removeAsLeadAndAssignCreaterAsLead`, { type: 'bot_engine', error });
    }
 
    // const [log_error, log_assetData] = await activityCommonService.getAssetDetailsAsync({
    //     organization_id: request.organization_id,
    //     asset_id: request.asset_id
    // });
    // let logAssetFirstName = log_assetData[0].operating_asset_first_name;
    // console.log("***********changed from ${defaultAssetName} to name****************",log_assetData[0].asset_id)
    //Add a timeline entry
    const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);

    let activityTimelineCollection =  JSON.stringify({                            
        "content": `${defaultAssetName} assigned ${leadAssetFirstName} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
        "subject": `Note - ${util.getCurrentDate()}.`,
        "mail_body": `${defaultAssetName} assigned ${leadAssetFirstName} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
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

async function removeAsOwner(request,data,addT=0)  {
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

        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_owner_flag',paramsArr);
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
        if(addT==0){
        const [error2, assetData] = await activityCommonService.getAssetDetailsAsync({
            organization_id: request.organization_id,
            asset_id: data.target_asset_id
        });
        let assetName = assetData[0].operating_asset_first_name || assetData[0].asset_first_name;
        const [error1, logassetData] = await activityCommonService.getAssetDetailsAsync({
            organization_id: request.organization_id,
            asset_id: request.asset_id
        });
        let logAssetname = logassetData[0].operating_asset_first_name || logassetData[0].asset_first_name;
        let activityTimelineCollection =  JSON.stringify({                            
            "content": `${logAssetname} revoke ownership ${assetName} @ ${moment().utcOffset('+05:30').format('LLLL')}.`,
            "subject": `Note - ${util.getCurrentDate()}.`,
            "mail_body": `${logAssetname} revoke ownership ${assetName} @ ${moment().utcOffset('+05:30').format('LLLL')}.`,
            "activity_reference": [],
            "asset_reference": [],
            "attachments": [],
            "form_approval_field_reference": []
        });
    
        let timelineReq = Object.assign({}, request);
            timelineReq.activity_id = request.workflow_activity_id;
            timelineReq.activity_type_id = request.activity_type_id;
            timelineReq.message_unique_id = util.getMessageUniqueId(100);
            timelineReq.track_gps_datetime = util.getCurrentUTCTime();
            timelineReq.activity_stream_type_id = 702;
            timelineReq.timeline_stream_type_id = 702;
            timelineReq.activity_timeline_collection = activityTimelineCollection;
            timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;
    
        await activityTimelineService.addTimelineTransactionAsync(timelineReq);
    }
        return [error,responseData];
    }


    async function removeParticipantBot(request, removeParticipantBotOperationData, formInlineDataMap = new Map()) {
        util.logInfo(request,`removeParticipant | formInlineDataMap: %j` , formInlineDataMap);
        request.debug_info.push("removeParticipant | formInlineDataMap: "+ formInlineDataMap);
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
            util.logError(request,`removeParticipant | error: `, { type: 'bot_engine', error });
            request.debug_info.push("removeParticipant | error: "+ error);
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

/*
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
        request.debug_info.push("htmlTemplate: "+ htmlTemplate);

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
        request.debug_info.push('placeholderMatches: ' + placeholderMatches);
        
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
            request.debug_info.push('fieldID: ' + fieldID);
            
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
        request.debug_info.push('htmlTemplate: ' + htmlTemplate);

        let annexures = [];
        try {
            if (
                templateData.hasOwnProperty("annexures") &&
                Array.isArray(templateData.annexures)
            ) {
                console.log("templateData.annexures: ", templateData.annexures);
                request.debug_info.push('templateData.annexures: ' + templateData.annexures);

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
        // const bucketName = await util.getS3BucketName();
        const bucketName = await util.getS3BucketNameV1();
        const prefixPath = await util.getS3PrefixPath(request);
        console.log("bucketName: ", bucketName);
        console.log("prefixPath: ", prefixPath);
        request.debug_info.push('bucketName: ' + bucketName);
        request.debug_info.push('prefixPath: ' + prefixPath);

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
        request.debug_info.push('attachmentsList: ' + attachmentsList);

        let addCommentRequest = Object.assign(request, {});

        const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);
        
        addCommentRequest.asset_id = 100;
        addCommentRequest.device_os_id = 7;
        addCommentRequest.activity_type_category_id = 48;
        addCommentRequest.activity_type_id = workflowActivityTypeID;
        addCommentRequest.activity_id = workflowActivityID;
        addCommentRequest.activity_timeline_collection = JSON.stringify({
            "content": `${defaultAssetName} has added attachment(s).`,
            "subject": `${defaultAssetName} has added attachment(s).`,
            "mail_body": `${defaultAssetName} has added attachment(s).`,
            "attachments": attachmentsList
        });
        addCommentRequest.activity_stream_type_id = 325;
        addCommentRequest.timeline_stream_type_id = 325;
        addCommentRequest.activity_timeline_text = "";
        addCommentRequest.activity_access_role_id = 27;
        addCommentRequest.operating_asset_first_name = defaultAssetName;
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
*/
/*
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
                // const bucketName = await util.getS3BucketName();
                const bucketName = await util.getS3BucketNameV1();
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
        const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);

        addCommentRequest.asset_id = 100;
        addCommentRequest.device_os_id = 7;
        addCommentRequest.activity_type_category_id = 48;
        addCommentRequest.activity_type_id = workflowActivityTypeID;
        addCommentRequest.activity_id = workflowActivityID;
        addCommentRequest.activity_timeline_collection = JSON.stringify({
            "content": `${defaultAssetName} has added attachment(s).`,
            "subject": `${defaultAssetName} has added attachment(s).`,
            "mail_body": `${defaultAssetName} has added attachment(s).`,
            "attachments": attachmentsList
        });
        addCommentRequest.activity_stream_type_id = 325;
        addCommentRequest.timeline_stream_type_id = 325;
        addCommentRequest.activity_timeline_text = "";
        addCommentRequest.activity_access_role_id = 27;
        // addCommentRequest.data_entity_inline
        addCommentRequest.operating_asset_first_name = defaultAssetName;
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
*/
    async function getHTMLTemplateForFormData(request, formEntries) {

        let formDataHTML = '';

        for (const formEntry of formEntries) {
            util.logInfo(request,`addFormAsPdf | getHTMLTemplateForFormData | Field Name: ${formEntry.field_name} | Field Value: ${formEntry.field_value}`);
            
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

                util.logInfo(request,`typeof field_value: %j` , typeof fieldValue);
                util.logInfo(request,`field_value:  %j` , fieldValue);
                request.debug_info.push('typeof field_value: '+ typeof fieldValue);
                request.debug_info.push('field_value: '+ fieldValue);
                
                if(fieldValue === undefined || fieldValue === null || fieldValue === "") {
                    //fridNotExists = false;
                    return;
                }

                util.logInfo(request,`Number(request.device_os_id): ${Number(request.device_os_id)}`);
                request.debug_info.push('Number(request.device_os_id): '+ Number(request.device_os_id));
                if(Number(request.device_os_id) === 2) { //IOS
                    // if(util.checkDateFormat(reqActivityInlineData[i].field_value).toString(),"DD MMM YYYY"){
                    //     fridExpiryDate = util.addDaysToGivenDate((reqActivityInlineData[i].field_value).toString(), 60, "DD MMM YYYY"); //Add 60 days to it
                    // } else if(util.checkDateFormat(reqActivityInlineData[i].field_value).toString(),"YYYY-MM-DD"){
                    //     fridExpiryDate = util.addDaysToGivenDate((reqActivityInlineData[i].field_value).toString(), 60, "YYYY-MM-DD"); //Add 60 days to it
                    // }    
                    fridExpiryDate = util.addDaysToGivenDate((reqActivityInlineData[i].field_value).toString(), 60); //Add 60 days to it
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
        const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);
        for (const comment of comments) {
            let addCommentRequest = Object.assign(request, {});       

        
            if(comment.comment === "<<vf_frid_expire>>" && fridNotExists) {
                //let fridExpiryDateArr = fridExpiryDate.split("-");
                //let currentDateArr = ((util.getCurrentDate()).toString()).split("-");
                let currentDateArr = (util.getCurrentDate()).toString();

                util.logInfo(request,`fridExpiryDate : %j` , fridExpiryDate);
                util.logInfo(request,`currentDateArr : %j` , currentDateArr);
                request.debug_info.push('fridExpiryDate : '+ fridExpiryDate);
                request.debug_info.push('currentDateArr : '+ currentDateArr);
                
                let a = moment(fridExpiryDate, "YYYY-MM-DD");
                let b = moment(currentDateArr, "YYYY-MM-DD");
                
                let difference = a.diff(b, 'days');
                util.logInfo(request,`Difference : ${difference}`);
                request.debug_info.push('Difference : '+ difference);
                
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

            util.logInfo(request,`comment ---------------------`);
            util.logInfo(request,` %j` , comment.comment);
            request.debug_info.push('comment: ' + comment.comment);

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
            addCommentRequest.operating_asset_first_name = defaultAssetName;
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
                util.logError(request,`addComment | addCommentRequest | addTimelineTransactionAsync | Error: `, { type: 'bot_engine', error });
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
                util.logInfo(request,`targetFieldData[0].data_entity_text_1: %j` , targetFieldData[0].data_entity_text_1);
                if (
                    Number(targetFieldData.length) > 0 &&
                    targetFieldData[0].data_entity_text_1 !== ''
                ) {
                    attachmentsList.push(targetFieldData[0].data_entity_text_1);
                }
            }

        }
        util.logInfo(request,`attachmentsList: %j` , attachmentsList);
        // Do not do anything if no attachments are to be added
        if (
            Number(attachmentsList.length) === 0
        ) {
            return;
        }

        const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);

        let addCommentRequest = Object.assign(request, {});

        addCommentRequest.asset_id = 100;
        addCommentRequest.device_os_id = 7;
        addCommentRequest.activity_type_category_id = 48;
        addCommentRequest.activity_type_id
        addCommentRequest.activity_id
        addCommentRequest.activity_timeline_collection = JSON.stringify({
            "content": `${defaultAssetName} has added attachment(s).`,
            "subject": `${defaultAssetName} has added attachment(s).`,
            "mail_body": `${defaultAssetName} has added attachment(s).`,
            "attachments": attachmentsList
        });
        addCommentRequest.activity_stream_type_id = 325;
        addCommentRequest.timeline_stream_type_id = 325;
        addCommentRequest.activity_timeline_text = "";
        addCommentRequest.activity_access_role_id = 27;
        // addCommentRequest.data_entity_inline
        addCommentRequest.operating_asset_first_name = defaultAssetName;
        addCommentRequest.datetime_log = util.getCurrentUTCTime();
        addCommentRequest.track_gps_datetime = util.getCurrentUTCTime();
        addCommentRequest.flag_timeline_entry = 1;
        addCommentRequest.log_asset_id = 100;

        const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
        try {
            await addTimelineTransactionAsync(addCommentRequest);
        } catch (error) {
            util.logError(request,`addComment | addCommentRequest | addTimelineTransactionAsync | Error: `, { type: 'bot_engine', error });
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
                util.logInfo(request,`documentFieldData[0].data_entity_text_1: %j` , documentFieldData[0].data_entity_text_1);
                request.debug_info.push("documentFieldData[0].data_entity_text_1: "+ documentFieldData[0].data_entity_text_1);
                
                // Fetch the Attestation URL
                const attestationFieldData = await getFieldValue({
                    form_transaction_id: attestationFormTransactionID,
                    form_id: attestationFormID,
                    field_id: attestationFieldID,
                    organization_id: request.organization_id
                });

                // console.log("attestationFieldData: ", attestationFieldData);
                util.logInfo(request,`attestationFieldData[0].data_entity_text_1: %j` , attestationFieldData[0].data_entity_text_1);
                request.debug_info.push("attestationFieldData[0].data_entity_text_1: "+ attestationFieldData[0].data_entity_text_1);

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
                    // const pdfDoc = new HummusRecipe(
                    //     documentPath,
                    //     documentWithAttestationPath,
                    //     {
                    //         fontSrcPath: `${__dirname}/../../../fonts`
                    //     }
                    // );
                    // for (let i = 1; i <= pdfDoc.metadata.pages; i++) {
                    //     if (flagAttestationIsText) {
                    //         pdfDoc
                    //             .editPage(i)
                    //             .text(attestationText, 400, 790, {
                    //                 color: '#000000',
                    //                 fontSize: 25,
                    //                 // bold: true,
                    //                 // underline: true,
                    //                 // font: 'Audhistine',
                    //                 font: 'HerrVonMuellerhoff',
                    //                 opacity: 0.8,
                    //                 rotation: 325,
                    //                 textBox: {
                    //                     width: 250,
                    //                     height: 40,
                    //                     wrap: 'trim',
                    //                     style: {
                    //                         lineWidth: 0,
                    //                         fill: "#FFFFFF",
                    //                         opacity: 1,
                    //                     }
                    //                 }
                    //             })
                    //             .endPage();
                    //         // .endPDF();
                    //     } else {
                    //         pdfDoc
                    //             .editPage(i)
                    //             .image(attestationPath, 500, 640, { width: 100, keepAspectRatio: true })
                    //             .endPage();
                    //         // .endPDF();
                    //     }
                    // }
                    // pdfDoc.endPDF();
                    // console.log("hjyut trt",documentWithAttestationPath);
                    const pdfdf = await PDFDocument.create();
  let pdfLoadInitiation =await new Promise((resolve,reject)=>{fs.readFile(documentPath,(err,data)=>{
   resolve(data)
    })})
                    const pdfDoc = await PDFDocument.load(pdfLoadInitiation);
                    const pdfPages = pdfDoc.getPages();
                    let fontLoadInitiation =await new Promise((resolve,reject)=>{fs.readFile(`${__dirname}/../../../fonts/HerrVonMuellerhoff.otf`,(err,data)=>{
                        resolve(data)
                         })})
                   
                    pdfDoc.registerFontkit(fontkit);
                    const customFont = await pdfDoc.embedFont(fontLoadInitiation);
                    for (let i = 0; i < pdfPages.length; i++) {
                        if (flagAttestationIsText) {
                            //text
                            const firstPage = pdfPages[i];
                            util.logInfo(request,`attestationText ${attestationText} length : ${pdfPages.length}`);
                            const { width, height } = firstPage.getSize()
                            util.logInfo(request,`sizes width : ${width} height : ${height}`);
                            firstPage.drawText(attestationText, {
                                x: 400,
                                y: 10,
                                size:25,
                                color: rgb(0, 0, 0),
                                rotate: degrees(35),
                                opacity:0.8,
                                font:customFont
                              })
                        }
                        else {
                            //image

                            let imageLoadInitiation =await new Promise((resolve,reject)=>{fs.readFile(attestationPath,(err,data)=>{
                                resolve(data)
                                 })});
                                 let imageType = attestationPath.split('.');
                                 let imageEmbed="";
                                 if(imageType[imageType.length-1]=='png'){
                                    imageEmbed = await pdfDoc.embedPng(imageLoadInitiation);
                                 }
                                 else{
                                  imageEmbed = await pdfDoc.embedJpg(imageLoadInitiation);
                                 }
                            
                            firstPage.drawImage(imageEmbed, {
                                x: 500,
                                y: 160,
                                width:100
                              })
                        }
                    }
                    const pdfBytes = await pdfDoc.save();
fs.writeFile(documentWithAttestationPath, pdfBytes, function (err) {
  if (err) return util.logError(request,`Error `, { type: 'bot_engine', err });;
  util.logInfo(request,`created pdf`);
});
                    // Upload to S3
                    // const environment = global.mode;
                    // let bucketName = '';
                    // if (environment === 'prod') {
                    //     bucketName = "worlddesk-" + util.getCurrentYear() + '-' + util.getCurrentMonth();

                    // } else if (environment === 'staging' || environment === 'local') {
                    //     bucketName = "worlddesk-staging-" + util.getCurrentYear() + '-' + util.getCurrentMonth();

                    // } else {

                    //     bucketName = "worlddesk-" + environment + "-" + util.getCurrentYear() + '-' + util.getCurrentMonth();
                    // }
                    let prefixPath = request.organization_id + '/' +
                        request.account_id + '/' +
                        request.workforce_id + '/' +
                        request.asset_id + '/' +
                        util.getCurrentYear() + '/' + util.getCurrentMonth() + '/103' + '/' + util.getMessageUniqueId(request.asset_id);

                    // console.log("bucketName: ", bucketName);
                    // console.log("prefixPath: ", prefixPath);
                    // request.debug_info.push('bucketName: ' + bucketName);
                    // request.debug_info.push('prefixPath: ' + prefixPath);
                    const bucketName = await util.getS3BucketNameV1();
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
        util.logInfo(request,`attachmentsList: %j` , attachmentsList);
        request.debug_info.push('attachmentsList: ' + attachmentsList);
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
            util.logError(request,`addAttachmentWithAttestation | alterFormActivityFieldValues | Error: `, { type: 'bot_engine', error });
        }

        // Decide whether to add the attested document to timeline or not
        if (
            flagAddAttestedDocumentToTimeline === 0
        ) {
            return;
        }

        const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);

        let addCommentRequest = Object.assign(request, {});

        addCommentRequest.asset_id = 100;
        addCommentRequest.device_os_id = 7;
        addCommentRequest.activity_type_category_id = 48;
        addCommentRequest.activity_type_id
        addCommentRequest.activity_id
        addCommentRequest.activity_timeline_collection = JSON.stringify({
            "content": `${defaultAssetName} has added attachment(s).`,
            "subject": `${defaultAssetName} has added attachment(s).`,
            "mail_body": `${defaultAssetName} has added attachment(s).`,
            "attachments": attachmentsList
        });
        addCommentRequest.activity_stream_type_id = 325;
        addCommentRequest.timeline_stream_type_id = 325;
        addCommentRequest.activity_timeline_text = "";
        addCommentRequest.activity_access_role_id = 27;
        // addCommentRequest.data_entity_inline
        addCommentRequest.operating_asset_first_name = defaultAssetName;
        addCommentRequest.datetime_log = util.getCurrentUTCTime();
        addCommentRequest.track_gps_datetime = util.getCurrentUTCTime();
        addCommentRequest.flag_timeline_entry = 1;
        addCommentRequest.log_asset_id = 100;

        const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
        try {
            await addTimelineTransactionAsync(addCommentRequest);
        } catch (error) {
            util.logError(request,`addComment | addCommentRequest | addTimelineTransactionAsync | Error: `, { type: 'bot_engine', error });
            throw new Error(error);
        }
        return;
    }
/*
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
*/

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
        util.logInfo(request,` `);
        util.logInfo(request,`***********************`);
        //console.log('request.debug_info - ', request.debug_info);
        util.logInfo(request,`***********************`);
        util.logInfo(request,` `);
        let debugInfo = {
            debug_info : request.debug_info
        }
        debugInfo = (typeof debugInfo === 'object') ? JSON.stringify(debugInfo) : debugInfo;
        const paramsArr = [
                            request.bot_transaction_id || 0,
                            botData.bot_operation_status_id || 1,                            
                            botData.bot_operation_inline_data || '{}', //p_bot_operation_transaction_inline_data
                            request.workflow_activity_id || 0,
                            request.form_activity_id || 0,
                            request.form_transaction_id || 0,
                            ///////////////////////////
                            botData.bot_operation_id,
                            botData.bot_id,
                            '{}', //p_inline_data     
                            botData.bot_operation_status_id || 1,
                            request.workforce_id,
                            request.account_id,
                            request.organization_id,
                            request.asset_id,
                            request.datetime_log,
                            debugInfo || '{}' //Debug Info
                          ];
        //let queryString = util.getQueryString('ds_p1_1_bot_operation_log_transaction_insert', paramsArr);
        const queryString = util.getQueryString('ds_p1_2_bot_operation_log_transaction_insert', paramsArr);        
        if (queryString != '') {
            try {
                return await (db.executeQueryPromise(0, queryString, request));
            } catch(err) {
                util.logError(request,`botOperationTxnInsertV1 Error `, { type: 'bot_engine', err });
                return;
            }            
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

    async function changeStatusV1(request, inlineData = {}) {
        util.logInfo(request,`change status v1 %j` , inlineData);
        request.debug_info.push('change status v1 ');
        // if(inlineData.hasOwnProperty('check_dates')&&Number(inlineData.check_dates)===1){
            
        //     let field_value1 = await getFormFieldValue(request,inlineData.field_id1);
        //     util.logInfo(request,"field_value 1"+field_value1);
        //     let field_value2 = await getFormFieldValue(request,inlineData.field_id2);
        //     util.logInfo(request,"field_value 2"+field_value2);
        //     var time1 = field_value1 //.format('YYYY-MM-DD');
        //     var time2 = field_value2 //.format('YYYY-MM-DD');
        //     if(time1 == time2){
        //         util.logInfo(request,"both dates are equal proceeding in");
        //         await changeStatus(request,inlineData);
                // await this.alterWFCompletionPercentageMethod({...request,activity_status_workflow_percentage:inlineData.})
                
                if(inlineData.hasOwnProperty('check_parent_closure')&& Number(inlineData.check_parent_closure)===1){
                    util.logInfo(request,"checking parent closure");
                    let childActivityDetails = await activityCommonService.getActivityDetailsPromise(request,request.workflow_activity_id);
                    const paramsArr = new Array(
                        request.organization_id,
                        childActivityDetails[0].activity_type_category_id,
                        childActivityDetails[0].activity_type_id,
                        childActivityDetails[0].parent_activity_id,
                        0
                    );
                    const queryString = util.getQueryString('ds_v1_1_activity_list_select_child_order_status_count', paramsArr);
            
                    if (queryString !== '') {
                        await db.executeQueryPromise(1, queryString, request)
                            .then(async (data) => {
                                util.logInfo(request,"parent child count"+data[0].count);
                                if(data.length>0 && data[0].count==0){
                                    util.logInfo(request,"proceeding to close parent too");

                                    let parentActivityDetails = await activityCommonService.getActivityDetailsPromise(request,childActivityDetails[0].parent_activity_id);
                                    // inlineData.

                                    let parentInlineData = {...inlineData};
                                    parentInlineData.activity_status_id = inlineData.parent_activity_status_id;
                                    // return [false,{}];
                                    util.logInfo(request,`parent change status %j` , parentInlineData);
                                    await changeStatus({...request,...parentActivityDetails[0],workflow_activity_id:childActivityDetails[0].parent_activity_id},parentInlineData); 
                                    if(inlineData.is_workflow_percentage_change==1){
                                       await alterWFCompletionPercentage({...request,...parentActivityDetails[0],workflow_activity_id:childActivityDetails[0].parent_activity_id,activity_status_workflow_percentage:inlineData.workflow_percentage},{workflow_percentage_contribution: inlineData.workflow_percentage})
                                    };
                                    return [false,{}]
                                }
                            })
                            .catch((err) => {
                                error = err;
                            });
                //     }
                // }
            //    return changeStatus(request,inlineData); 
            return [false,{}]

            }
            else{
                return [false, {}];
            }
            
        }else{
            // return [false,{}]
            request.debug_info.push(' Hitting changeStatus ');
            return changeStatus(request,inlineData);
        }
    }
    
    // Bot Step to change the status
    async function changeStatus(request, inlineData = {}) {
        let botOperationId = request.bot_operation_id || "";
        const workflowActivityID = request.workflow_activity_id;
        request.debug_info.push(' In changeStatus '+JSON.stringify(inlineData));
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
                        organization_id: request.organization_id,
                        log_uuid : request.log_uuid
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

            util.logInfo(request,`conditionChain: %j`, conditionChain);
            
            // Process the condition chain
            const conditionReducer = (accumulator, currentValue) => {
                let value = 0;
                util.logInfo(request,`accumulator: ${JSON.stringify(accumulator)} | currentValue: ${JSON.stringify(currentValue)}`);
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
            util.logInfo(request,`finalCondition: %j`, finalCondition);

            // Select the status based on the condition arrived
            if (finalCondition.value) {
                inlineData.activity_status_id = inlineData.pass.activity_status_id;
                inlineData.flag_trigger_resource_manager = inlineData.pass.flag_trigger_resource_manager;

            } else if (!finalCondition.value) {
                inlineData.activity_status_id = inlineData.fail.activity_status_id;
                inlineData.flag_trigger_resource_manager = inlineData.fail.flag_trigger_resource_manager;

            } else {
                util.logError(request,`Error processing the condition chain`, { type: 'change_status' });
                return [true, "Error processing the condition chain"];
            }
        }

        let newReq = Object.assign({}, request);
        util.logInfo(request,` inlineData: %j`, inlineData);
        request.debug_info.push(' In changeStatus '+request.workflow_activity_id+" "+inlineData.activity_status_id);
        newReq.activity_id = request.workflow_activity_id;
        newReq.activity_status_id = inlineData.activity_status_id;
        //newRequest.activity_status_type_id = inlineData.activity_status_id; 
        //newRequest.activity_status_type_category_id = ""; 
        newReq.activity_type_category_id = 48;
        newReq.device_os_id = 9;
        newReq.log_asset_id = 100; // Tony
        newReq.asset_id = 100; // Tony
        newReq.creator_asset_id = request.asset_id;
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

        let statusName = await getStatusName(newReq, inlineData.activity_status_id);
        request.debug_info.push(' In changeStatus getStatusName '+JSON.stringify(statusName));
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
            newReq.activity_status_duration = statusName[0].activity_status_duration;
            // Send push notification to mobile devices for live loading of the updates 
            newReq.activity_stream_type_id = 704;
            newReq.bot_operation_type = 'status_alter';
            newReq.push_message = `Status updated to ${statusName[0].activity_status_name || ""}`;
        }

        //console.log('statusName newReq ########################## : ', statusName);
        try {
            await new Promise((resolve, reject) => {
                request.debug_info.push(' In changeStatus alterActivityStatus '+JSON.stringify(newReq));
                activityService.alterActivityStatus(newReq, (err, resp) => {
                    (err === false) ? resolve() : reject(err);
                });
            });
            request.debug_info.push(' In changeStatus updateWorkflowQueueMapping ');
            await activityService.updateWorkflowQueueMapping(newReq);
        } catch (err) {
            util.logError(request,`Error updating the workflow's queue mapping`, { type: 'bot_engine', error: err });
            return [true, "unknown Error"];
        }

        let resp = await getQueueActivity(newReq, request.workflow_activity_id,request.activity_type_category_id);
        util.logInfo(request,` getQueueActivity | resp: %j`, resp);

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
                        util.logError(request,`changeStatus | getActivityDetailsPromise | error`, { type: 'bot_engine', error: error});
                    });
            } catch (error) {
                util.logError(request,`changeStatus | Activity Details Fetch Error | error`, { type: 'bot_engine', error: error });
            }

            // let statusName = await getStatusName(newReq, inlineData.activity_status_id);
            util.logInfo(request,` Status Alter BOT Step - status Name: %j `, statusName, { type: 'bot_engine' });

            let queuesData = await getAllQueuesBasedOnActId(newReq, request.workflow_activity_id);

            util.logInfo(request,`queues Data: %j `, queuesData, { type: 'bot_engine' });

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
                util.logInfo(request,`Status Alter BOT Step - Updating the Queue Json: %j `, data, { type: 'bot_engine' });

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
            util.logError(request,`No workflow to queue mappings found`, { type: 'bot_engine'});
            return [false, "No workflow to queue mappings found"];
        }
    }

    this.copyFieldBot = async (request) => {
        try {
            // global.logger.write('conLog', 'Request Params received by BOT ENGINE', request, {});
            util.logInfo(request,`form_field_copy | Request Params received by BOT ENGINE`);
            await copyFields(request, JSON.parse(request.form_field_copy));
        } catch (err) {
         util.logError(request,`Error` + error.stack, { type: 'bot_engine', err });
        }
    }
    
    //Bot Step Copying the fields
    async function copyFields(request, fieldCopyInlineData, condition = {}) {
        let botOperationId = request.bot_operation_id || "";
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
            
                util.logInfo(request,`originFlagSet %j`,originFlagSet);
                util.logInfo(request,`isWorkflowEnabled %j`,isWorkflowEnabled);
                util.logInfo(request,`sourceFormActivityTypeID %j`,sourceFormActivityTypeID);
                util.logInfo(request,`workflowActivityTypeId %j`,workflowActivityTypeId);


            request.debug_info.push('originFlagSet: ' + originFlagSet);
            request.debug_info.push('isWorkflowEnabled: ' + isWorkflowEnabled);
            request.debug_info.push('sourceFormActivityTypeID: ' + sourceFormActivityTypeID);
            request.debug_info.push('workflowActivityTypeId: ' + workflowActivityTypeId);

            if(sourceFormActivityTypeID !== workflowActivityTypeId){
                util.logInfo(request,`Target Form Process is different from the Source form `);
                request.debug_info.push('Target Form Process is different from the Source form');

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
                        util.logInfo(request,`Target Form Submitted! ${targetFormTransactionID} ${targetFormActivityID} %j`,inlineData);
                        request.debug_info.push('Target Form Submitted!');
                        request.debug_info.push('targetFormTransactionID: ' + targetFormTransactionID);
                        request.debug_info.push('targetFormActivityID: ' + targetFormActivityID);
                    }
                } else {
                    if(Number(esmsFlag) === 1) {
                        util.logInfo(request,`Target Form Not Submitted! `);
                        request.debug_info.push('Target Form Not Submitted!');
                    }
                }
            } catch (error) {
                util.logError(request,`copyFields | Fetch Target Form Transaction Data | Error: `, { type: "bot_engine", error: serializeError(error) });
                throw new Error(error);
            }
        //}

        let activityInlineData = [],
            activityInlineDataMap = new Map(),
            REQUEST_FIELD_ID = 0;

        request.debug_info.push('fieldCopyInlineData.length: ' +  fieldCopyInlineData.length);
        for (const batch of fieldCopyInlineData) {
            let sourceFormID = Number(batch.source_form_id),
                sourceFormTransactionData = [],
                sourceFormActivityID = 0,
                sourceFormTransactionID = 0;
                
            // Fetch Source Form Transaction Data
            try {
                sourceFormTransactionData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id,
                    log_uuid : request.log_uuid
                }, workflowActivityID, sourceFormID);
    
                if (Number(sourceFormTransactionData.length) > 0) {                    
                    //sourceFormActivityTypeID = Number(sourceFormTransactionData[0].activity_type_id);
                    sourceFormTransactionID = Number(sourceFormTransactionData[0].data_form_transaction_id);
                    sourceFormActivityID = Number(sourceFormTransactionData[0].data_activity_id);
                }
            } catch (error) {
                util.logError(request,`copyFields | Fetch Source Form Transaction Data | Error: `, { type: "bot_engine", error: serializeError(error) });
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
                log_uuid : request.log_uuid,
                organization_id: request.organization_id
            });

            try {
                const sourceFieldDataTypeID = Number(sourceFieldData[0].data_type_id);

                util.logInfo(request,`sourceFieldData[0] %j`,sourceFieldData[0]);
                util.logInfo(request,`sourceFieldDataTypeID %j`,sourceFieldDataTypeID);
                util.logInfo(request,`getFielDataValueColumnName(sourceFieldDataTypeID) :  %j`,sourceFieldDataTypeID);

                request.debug_info.push('sourceFieldData[0]: ' + sourceFieldData[0]);
                request.debug_info.push('sourceFieldDataTypeID: ' + sourceFieldDataTypeID);
                request.debug_info.push('getFielDataValueColumnNameNew(sourceFieldDataTypeID): ' + getFielDataValueColumnNameNew(sourceFieldDataTypeID));
                // console.log('sddd',`getFielDataValueColumnNameNew(sourceFieldDataTypeID) sourceFieldData[0][${getFielDataValueColumnNameNew(sourceFieldDataTypeID)}]`)
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
                util.logError(request,`Error in processing the form_id - ${sourceFormID} and field_id -  ${sourceFieldID}`, { type: "bot_engine", error: serializeError(err) });
            }
        } //For loop Finished

        activityInlineData = [...activityInlineDataMap.values()];
        util.logInfo(request,`copyFields | activityInlineData: %j`,activityInlineData);
        request.debug_info.push('activityInlineData: ' + activityInlineData);
        request.activity_title = activityInlineData[0].field_value;
        
        util.logInfo(request,`targetFormTransactionID %j`,targetFormTransactionID);
        util.logInfo(request,`targetFormTransactionID %j`,targetFormActivityID);

        request.debug_info.push('targetFormTransactionID: ' + targetFormTransactionID);
        request.debug_info.push('targetFormActivityID: ' + targetFormActivityID);

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
                util.logError(request,`copyFields | alterFormActivityFieldValues | Error: `, { type: "bot_engine", error: serializeError(error) });
            }

        } else if (targetFormTransactionID === 0 || targetFormActivityID === 0) {
            // If the target form has not been submitted yet, DO NOT DO ANYTHING
            util.logInfo(request,`shouldSubmitTargetForm %j`,shouldSubmitTargetForm);
            request.debug_info.push('shouldSubmitTargetForm: ' + shouldSubmitTargetForm);
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
                    util.logError(request,`copyFields | createTargetFormActivity | Error: `, { type: "bot_engine", error: serializeError(error) });
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

            util.logInfo(request,`##################################`);
            util.logInfo(request,`originFlagSet : ${originFlagSet}`);
            util.logInfo(request,`isWorkflowEnabled : ${isWorkflowEnabled}`);
            util.logInfo(request,`sourceFormActivityTypeID : ${sourceFormActivityTypeID}`);
            util.logInfo(request,`workflowActivityTypeId : %j` , workflowActivityTypeId);

            if(sourceFormActivityTypeID !== workflowActivityTypeId){
                util.logInfo(request,`Target Form Process is different from the Source form`);
                util.logInfo(request,`##################################`);

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
                        util.logInfo(request,`Target Form Submitted!`);
                        util.logInfo(request,`targetFormTransactionID : ${targetFormTransactionID}`);
                        util.logInfo(request,`targetFormActivityID : ${targetFormActivityID}`);
                    }
                } else {
                    if(Number(esmsFlag) === 1) {
                        util.logInfo(request,`Target Form Not Submitted!`);
                    }
                }
            } catch (error) {
                util.logError(request,`copyFields | Fetch Target Form Transaction Data | Error: `, { type: 'bot_engine', error });
                throw new Error(error);
            }
        //}

        let activityInlineData = [],
            activityInlineDataMap = new Map(),
            REQUEST_FIELD_ID = 0;

        util.logInfo(request,`fieldCopyInlineData.length : %j` , fieldCopyInlineData.length);
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
                util.logError(request,`copyFields | Fetch Source Form Transaction Data | Error: `, { type: 'bot_engine', error });
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
                util.logInfo(request,`sourceFieldData[0] : %j` , sourceFieldData[0]);
                const sourceFieldDataTypeID = Number(sourceFieldData[0].data_type_id);
                util.logInfo(request,`sourceFieldDataTypeID : ${sourceFieldDataTypeID}`);
                util.logInfo(request,`getFielDataValueColumnName(sourceFieldDataTypeID) : %j` , getFielDataValueColumnNameNew(sourceFieldDataTypeID));
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
                util.logInfo(request,`Error in processing the form_id - ${sourceFormID} and field_id -  ${sourceFieldID}`, request);
                util.logError(request,`Error in processing the form_id - ${sourceFormID} and field_id -  ${sourceFieldID}`, { type: 'bot_engine', err });
                
            }
        } //For loop Finished

        activityInlineData = [...activityInlineDataMap.values()];
        util.logInfo(request,`copyFields | activityInlineData: %j` , activityInlineData);
        request.activity_title = activityInlineData[0].field_value;

        util.logInfo(request,`targetFormTransactionID: ${targetFormTransactionID}`);
        util.logInfo(request,`targetFormActivityID: ${targetFormActivityID}`);

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
                util.logError(request,`copyFields | alterFormActivityFieldValues | Error: `, { type: 'bot_engine', error });
            }

        } else if (targetFormTransactionID === 0 || targetFormActivityID === 0) {
            // If the target form has not been submitted yet, DO NOT DO ANYTHING
            util.logInfo(request,`shouldSubmitTargetForm : ${shouldSubmitTargetForm}`);
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

                createTargetFormRequest.start_workflow_activity_parent_id = condition.flag_is_child_workflow ? request.activity_id : 0;
                
                try {
                    await createTargetFormActivity(createTargetFormRequest);
                } catch (error) {
                    util.logError(request,`copyFields | createTargetFormActivity | Error: `, { type: 'bot_engine', error });
                }
            }

        }
        return;
    }

    async function createTargetFormActivity(createTargetFormRequest) {
        let reqActivityId = createTargetFormRequest.activity_id
        // Get the activity_id and form_trasanction_id
        // const targetFormActivityID = await cacheWrapper.getActivityIdPromise();
        // const targetFormTransactionID = await cacheWrapper.getFormTransactionIdPromise();

        // if (
        //     Number(targetFormActivityID) === 0 ||
        //     Number(targetFormTransactionID) === 0
        // ) {
        //     throw new Error("Error Fetching Activity ID or Form Transaction ID");
        // }

        // createTargetFormRequest.activity_id = targetFormActivityID;
        // if(!createTargetFormRequest.start_workflow_activity_parent_id) {
        //     createTargetFormRequest.form_transaction_id = targetFormTransactionID;
        // }

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
        createTargetFormRequest.activity_parent_id = createTargetFormRequest.start_workflow_activity_parent_id || 0;
        if(createTargetFormRequest.start_workflow_activity_parent_id) {
            let [err, resp] = await workforceActivityTypeMappingSelectCategory({...createTargetFormRequest, activity_type_category_id : 63 });

            util.logInfo(request,`resp : %j` , resp);
            let [err1, resp1] = await workforceActivityStatusMappingSelectStatusType({...createTargetFormRequest, activity_status_type_id : 184, 
                activity_type_category_id : 63, // MOM type
                activity_type_id : resp[0].activity_type_id
            });

            util.logInfo(request,`resp1 : %j` , resp1);

            createTargetFormRequest.activity_status_id = resp1[0].activity_status_id;
            createTargetFormRequest.activity_status_type_id = 184;
            createTargetFormRequest.activity_type_id = resp[0].activity_type_id;
            createTargetFormRequest.activity_type_category_id = 63;

            activityListUpdateSubtype({...createTargetFormRequest, activity_sub_type_id : 1,
                activity_sub_type_name : "",
                activity_id : reqActivityId
            });

            activityAssetMappingUpdateSubtype({...createTargetFormRequest, activity_sub_type_id : 1,
                activity_sub_type_name : "",
                activity_id : reqActivityId
            })
            
        }

        createTargetFormRequest.flag_pin = 0;
        createTargetFormRequest.flag_offline = 0;
        createTargetFormRequest.flag_retry = 0;
        createTargetFormRequest.device_os_id = 5;
        createTargetFormRequest.activity_stream_type_id = 705;
        createTargetFormRequest.flag_timeline_entry = 1;
        createTargetFormRequest.url = "/r1/activity/add/v1";
        createTargetFormRequest.create_workflow = 1;
        const addActivityRequest = {
            ...createTargetFormRequest,
            workflow_activity_id: Number(createTargetFormRequest.workflow_activity_id),
            activity_id : Number(createTargetFormRequest.workflow_activity_id),
            channel_activity_id: Number(createTargetFormRequest.workflow_activity_id),
            data_entity_inline:createTargetFormRequest.activity_inline_data,
            form_transaction_id : 0,
            isOrigin :false,
            is_mytony: 1,
            form_api_activity_type_category_id: 48,
            form_api_activity_type_id: createTargetFormRequest.activity_type_id,
            form_id: createTargetFormRequest.form_id,
            form_workflow_activity_type_id: createTargetFormRequest.activity_type_id,
            activity_type_category_id: 9,
            activity_sub_type_id: 0,
            activity_type_id: createTargetFormRequest.activity_type_id,
            asset_participant_access_id: 0,
            activity_parent_id: 0,
            flag_pin: 0,
            flag_priority: 0,
            activity_flag_file_enabled: -1,
            activity_form_id: createTargetFormRequest.form_id,
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(31993),
            activity_channel_id: Number(createTargetFormRequest.workflow_activity_id),
            activity_channel_category_id: 0,
            activity_flag_response_required: 0,
            track_latitude: 0.0,
            track_longitude: 0.0,
            track_altitude: 0,
            track_gps_datetime: util.getCurrentUTCTime(),
            track_gps_accuracy: 0,
            track_gps_status: 0,
            service_version: "3.0",
            app_version: "3.0.0",
            device_os_id: 5
        };

        util.logInfo(createTargetFormRequest,`createTargetFormRequest.isESMS : %j`,createTargetFormRequest.isESMS);
        util.logInfo(createTargetFormRequest,`createTargetFormRequest.isEsmsOriginFlag : %j`,createTargetFormRequest.isEsmsOriginFlag);
        util.logInfo(createTargetFormRequest,`createTargetFormRequest.activity_flag_created_by_bot :  %j`,createTargetFormRequest.activity_flag_created_by_bot);     

        const addActivityAsync = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form: addActivityRequest
        };
        try {
            // global.config.mobileBaseUrl + global.config.version
            const response = await addActivityAsync(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', makeRequestOptions);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                util.logInfo({},`createActivity | addActivityAsync | Body: %j` , body);
                let activityTimelineCollection =  JSON.stringify({
                    "content"            : `Form Submitted`,
                    "subject"            : `Form Submitted`,
                    "mail_body"          : `Form Submitted`,
                    "activity_reference" : [],
                    "form_id"            : addActivityRequest.form_id,
                    "form_submitted"     : JSON.parse(addActivityRequest.data_entity_inline),
                    "asset_reference"    : [],
                    "attachments"        : [],
                    "form_approval_field_reference": []
                });
        
                addActivityRequest.form_transaction_id = body.response.form_transaction_id;
                let timelineReq = Object.assign({}, addActivityRequest);
        
                timelineReq.activity_id                  = addActivityRequest.workflow_activity_id;
                timelineReq.message_unique_id            = util.getMessageUniqueId(100);
                timelineReq.track_gps_datetime           = util.getCurrentUTCTime();
                timelineReq.activity_stream_type_id      = 705;
                timelineReq.timeline_stream_type_id      = 705;
                timelineReq.activity_type_category_id    = 48;
                timelineReq.asset_id                     = 100;
                timelineReq.activity_timeline_collection = activityTimelineCollection;
                timelineReq.data_entity_inline           = timelineReq.activity_timeline_collection;
        
                await activityTimelineService.addTimelineTransactionAsync(timelineReq);
                return [false, body];
            }
        } catch (error) {
            util.logError({},`createActivity | addActivityAsync | Error: `, { type: 'bot_engine', error });
            return [true, {}];
        }
        return;
    }

    function activityListUpdateSubtype(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array();
            let queryString = '';
            paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                request.activity_sub_type_id,
                request.activity_sub_type_name,
                request.asset_id,
                request.datetime_log
            );
            queryString = util.getQueryString('ds_v1_activity_list_update_sub_type', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(): reject(err);
                });
            }
        });
    };

    function activityAssetMappingUpdateSubtype(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array();
            let queryString = '';
            paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id, 
                request.activity_sub_type_id, 
                request.activity_sub_type_name,
                request.asset_id,
                request.datetime_log
            );
            queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_sub_type', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(): reject(err);
                });
            }
        });
    };

    async function workforceActivityTypeMappingSelectCategory(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.start_from || 0,
            request.limit_value || 1
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_select_category', paramsArr);

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

    async function workforceActivityStatusMappingSelectStatusType(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.activity_type_id,
            request.activity_status_type_id,
            0,
            1
        );
        const queryString = util.getQueryString('ds_p1_2_workforce_activity_status_mapping_select', paramsArr);

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
            default: util.logInfo(request,`In default Case : getFielDataValueColumnName`);
        }
    }

    function getFielDataValueColumnNameNew(fieldDataTypeID) {
        switch (fieldDataTypeID) {
            case 1: // Date
                return 'data_entity_date_1';
            case 2 : // date only
                return 'data_entity_date_1';
            case 71: 
            case 5: // Number
                return 'data_entity_bigint_1';
            case 6: // Decimal
                return 'data_entity_double_1';
            case 19: // Short Text
            case 34: // MultiSelection   
            case 21: // Label
            case 22: // Email ID
            case 23: // Phone Number
                return 'data_entity_text_1';
            case 27: // General Signature with asset reference
            case 33: // Single Selection List
            case 57: // workflow reference            
            case 59: // asset reference            
                return 'data_entity_text_1';
            case 20: // Long Text
                return 'data_entity_text_2';
            case 64: //JSON                
                return 'data_entity_inline';
            default: util.logInfo({},`In default Case : getFielDataValueColumnName`);
        }
    }    
    
    // Bot Step Adding a participant
    async function addParticipant(request, inlineData, formInlineDataMap = new Map()) {
        let botOperationId = request.bot_operation_id || "";
        let newReq = Object.assign({}, request);
        let resp;
        let isLead = 0, isOwner = 0, flagCreatorAsOwner = 0;
        request.debug_info=[]
        util.logInfo(request,`inlineData %j`,inlineData);
        request.debug_info.push('inlineData: ' + inlineData);
        request.debug_info.push((typeof inlineData === 'object') ? JSON.stringify(inlineData):inlineData);
        newReq.message_unique_id = util.getMessageUniqueId(request.asset_id);

        let type = Object.keys(inlineData);
        request.debug_info.push('type: ' + type);

        if (type[0] === 'static') {
            util.logInfo(request,`addParticipant : Processing Static`);
            logger.info(request.workflow_activity_id + " : ");
            request.debug_info.push('Inside Static');
            newReq.flag_asset = inlineData[type[0]].flag_asset;

            isLead = (inlineData[type[0]].hasOwnProperty('is_lead')) ? inlineData[type[0]].is_lead : 0;
            isOwner = (inlineData[type[0]].hasOwnProperty('is_owner')) ? inlineData[type[0]].is_owner : 0;
            flagCreatorAsOwner = (inlineData[type[0]].hasOwnProperty('flag_creator_as_owner')) ? inlineData[type[0]].flag_creator_as_owner : 0;

            util.logInfo(request,`addParticipant : isLead : ${isLead} : isOwner : ${isOwner}  : flagCreatorAsOwner : ${flagCreatorAsOwner}` );

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
            util.logInfo(request,`Inside dynamic`);
            request.debug_info.push('Inside dynamic');
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
            util.logInfo(request,`addParticipant : isLead : ${isLead} : isOwner : ${isOwner}  : flagCreatorAsOwner : ${flagCreatorAsOwner}` );
            request.debug_info.push(request.workflow_activity_id + " : addParticipant : isLead : "+ isLead + " : isOwner : " + isOwner + " : flagCreatorAsOwner : " + flagCreatorAsOwner);
            let activityInlineData;

            resp = await getFieldValue(newReq);
            request.debug_info.push(request.workflow_activity_id + " : addParticipant : resp : " + resp.length);
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
                    request.debug_info.push('Grab the name : i.form_id : newReq.form_id '+i.form_id+' '+newReq.form_id);
                    request.debug_info.push('Grab the name : i.field_id : newReq.name_field_id '+i.field_id+' '+newReq.name_field_id);
                    // Grab the name
                    if (
                        Number(i.form_id) === Number(newReq.form_id) &&
                        Number(i.field_id) === Number(newReq.name_field_id)
                    ) {
                        request.debug_info.push('Grab the name : '+i.field_value);
                        newReq.customer_name = i.field_value;
                        request.debug_info.push('BotEngine | addParticipant | From Form | newReq.customer_name: ' +  newReq.customer_name);
                    }
                }
            }
            request.debug_info.push('End of Dynamic : Country Code : '+newReq.country_code);
            request.debug_info.push('End of Dynamic : PhoneNumber : '+newReq.phone_number);

        } else if (type[0] === 'asset_reference') {
            util.logInfo(request,`Inside asset_reference`);
            request.debug_info.push('Inside asset_reference');
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
                util.logInfo(request,`Inside !formInlineDataMap.has(fieldID) `);
                request.debug_info.push('Inside !formInlineDataMap.has(fieldID)');
                // const fieldValue = String(formInlineDataMap.get(fieldID).field_value).split("|");
                // newReq.desk_asset_id = fieldValue[0];
                // newReq.customer_name = fieldValue[1]

            } else {
                util.logInfo(request,`ELSE !formInlineDataMap.has(fieldID) `);
                request.debug_info.push('ELSE !formInlineDataMap.has(fieldID)');
                const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, workflowActivityID, formID);

                request.debug_info.push('formData : '+formData.length);

                if (Number(formData.length) > 0) {
                    formTransactionID = Number(formData[0].data_form_transaction_id);
                    formActivityID = Number(formData[0].data_activity_id);
                }
                util.logInfo(request,'formTransactionID : '+formTransactionID+ " formActivityID : "+formActivityID );
                request.debug_info.push('formTransactionID : '+formTransactionID+ " formActivityID : "+formActivityID);
                if (
                    Number(formTransactionID) > 0 //&&
                    //Number(formActivityID) > 0
                ) {
                    // Fetch the field value
                    try{
                    const fieldData = await getFieldValue({
                        form_transaction_id: formTransactionID,
                        form_id: formID,
                        field_id: fieldID,
                        organization_id: request.organization_id
                    });
                    
                    if(fieldData.length == 0){
                        throw('err')
                    }
                    newReq.desk_asset_id = fieldData[0].data_entity_bigint_1;
                    newReq.customer_name = fieldData[0].data_entity_text_1;

                    util.logInfo(request,`newReq.desk_asset_id = fieldData[0].data_entity_bigint_1 - ${fieldData[0].data_entity_bigint_1} `);
                    util.logInfo(request,`newReq.customer_name = fieldData[0].data_entity_text_1 -  ${fieldData[0].data_entity_text_1} `);
                    request.debug_info.push('newReq.desk_asset_id = fieldData[0].data_entity_bigint_1 : ' +  fieldData[0].data_entity_bigint_1);
                    request.debug_info.push('newReq.customer_name = fieldData[0].data_entity_text_1 : ' +  fieldData[0].data_entity_text_1);
                }
                catch (transactionerr){// got error while getting value from form transaction so getting value from inline
                    util.logInfo(request,`got error in nrml flow came in catch -  `);
                      const [erractivityFieldData,activityFieldData] = await activityListingService.getActivityFormList({
                        form_transaction_id: formTransactionID,
                        form_id: formID,
                        field_id: fieldID,
                        organization_id: request.organization_id,
                        workflow_activity_id: request.workflow_activity_id,
                        activity_id : formActivityID
                      });
                      
                      if(!erractivityFieldData && activityFieldData.length>0){
                           
                      let activityFieldDataInline = typeof activityFieldData[0].activity_inline_data == 'string' ? JSON.parse(activityFieldData[0].activity_inline_data):activityFieldData[0].activity_inline_data;
                    //   console.log(activityFieldData);

                      util.logInfo(request,` activityFieldData.hasOwnProperty(_fieldID) : ${activityFieldDataInline.hasOwnProperty(`_${fieldID}`)}` );
                      if(activityFieldDataInline.hasOwnProperty(`_${fieldID}`)){
                          let leadAssetData = activityFieldDataInline[`_${fieldID}`].field_value;
                          util.logInfo(request,` field value : ${leadAssetData}` );
                          if(leadAssetData){
                          let assetDetailsSplit = leadAssetData.split('|');
                          
                          newReq.desk_asset_id = assetDetailsSplit[0];
                          newReq.customer_name = assetDetailsSplit[1];
                          util.logInfo(request,`newReq.desk_asset_id = assetDetailsSplit[0] - ${assetDetailsSplit[0]} `);
                          util.logInfo(request,`newReq.customer_name = assetDetailsSplit[1] -  ${assetDetailsSplit[1]} `);
                          }
                          else{
                            util.logInfo(request,`asset data is empty in catch case `);
                          }
                      }
                      util.logInfo(request,` activityFieldData is empty so exiting..` );
                      }
                }
                util.logInfo(request,` desk_asset_id after try catch ${newReq.desk_asset_id}` );
                if(!newReq.desk_asset_id){
                    util.logInfo(request,`came inside checking inline data failing 2 cases `);
                    let formSubmittedData = typeof formData[0].data_entity_inline  == 'string'? JSON.parse(formData[0].data_entity_inline) : formData[0].data_entity_inline;
                    
                    let fieldSubmittedDate = await getFieldValueUsingFieldIdV1({...request,activity_inline_data:formSubmittedData.form_submitted,workflow_activity_id:0},formID,fieldID);
                    util.logInfo(request,` field value : ${fieldSubmittedDate}` );
                    if(fieldSubmittedDate){
                    let assetDetailsSplit = fieldSubmittedDate.split('|');
                          newReq.desk_asset_id = assetDetailsSplit[0];
                          newReq.customer_name = assetDetailsSplit[1];
                          util.logInfo(request,`newReq.desk_asset_id = assetDetailsSplit[0] - ${assetDetailsSplit[0]} `);
                          util.logInfo(request,`newReq.customer_name = assetDetailsSplit[1] -  ${assetDetailsSplit[1]} `);
                    }
                    else{
                        util.logInfo(request,`asset data is empty in final case `);
                    }
                }
                }else{
                    request.debug_info.push('formTransactionID is not valid : ' +  formTransactionID);
                }
            }

            

            if (Number(newReq.desk_asset_id) > 0) {
                request.debug_info.push('Inside newReq.desk_asset_id');
                const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
                    organization_id: request.organization_id,
                    asset_id: newReq.desk_asset_id
                });
                util.logInfo(request,`addParticipant : assetData.length %j`, assetData.length);
                request.debug_info.push('assetData.length: ' + assetData.length);
                if (assetData.length > 0) {
                    newReq.country_code = Number(assetData[0].operating_asset_phone_country_code) || Number(assetData[0].asset_phone_country_code);
                    newReq.phone_number = Number(assetData[0].operating_asset_phone_number) || Number(assetData[0].asset_phone_number);

                    request.debug_info.push('newReq.phone_number : ' + newReq.phone_number);
                }
            }

        } else if(type[0] === 'workflow_reference') {
            util.logInfo(request,`addParticipant : Processing Static`);
            logger.info(request.workflow_activity_id + " : ");
            request.debug_info.push('Inside workflow_reference');
            // newReq.flag_asset = inlineData[type[0]].flag_asset;
            util.logInfo(request,`request.activity_inline_data %j` , request.activity_inline_data);
            let activityInlineData = typeof request.activity_inline_data =="string" ? JSON.parse(request.activity_inline_data):request.activity_inline_data;
            let fieldDetails;
            for(let row of activityInlineData) {
                if(row.field_id == inlineData[type[0]].field_id) {
                    fieldDetails = row.field_value;
                    break;
                }
            }

            fieldDetails = fieldDetails.split('|');

            let activityId = fieldDetails[0];
            let activityDetails = await activityCommonService.getActivityDetailsPromise(request, activityId);
            
            if(inlineData[type[0]].participant_type == 'creator') {
                newReq.desk_asset_id = activityDetails[0].activity_creator_asset_id;
                newReq.phone_number = 0;
            };

            const [error, assetData12] = await activityCommonService.getAssetDetailsAsync({
                organization_id: request.organization_id,
                asset_id: newReq.desk_asset_id
            });
            util.logInfo(request,`addParticipant : assetData.length %j`, assetData12.length);
            // request.debug_info.push('assetData.length: ' + assetData.length);
            if (assetData12.length > 0) {
                newReq.country_code = Number(assetData12[0].operating_asset_phone_country_code) || Number(assetData12[0].asset_phone_country_code);
                newReq.phone_number = Number(assetData12[0].operating_asset_phone_number) || Number(assetData12[0].asset_phone_number);

                request.debug_info.push('newReq.phone_number : ' + newReq.phone_number);
            }

            isLead = (inlineData[type[0]].hasOwnProperty('is_lead')) ? inlineData[type[0]].is_lead : 0;
            isOwner = (inlineData[type[0]].hasOwnProperty('is_owner')) ? inlineData[type[0]].is_owner : 0;
            flagCreatorAsOwner = (inlineData[type[0]].hasOwnProperty('flag_creator_as_owner')) ? inlineData[type[0]].flag_creator_as_owner : 0;

            util.logInfo(request,`addParticipant : isLead : ${isLead} : isOwner : ${isOwner}  : flagCreatorAsOwner : ${flagCreatorAsOwner}` );

        }

        // Fetch participant name from the DB
        if (newReq.customer_name === '') {
            util.logInfo(request,`Customer Name is empty hence fetching from DB`);

            request.debug_info.push('Customer Name is empty hence fetching from DB');
            try {
                let fieldData = await getFieldValue({
                    form_transaction_id: newReq.form_transaction_id,
                    form_id: newReq.form_id,
                    field_id: newReq.name_field_id,
                    organization_id: newReq.organization_id
                });
                if (fieldData.length > 0) {
                    newReq.customer_name = String(fieldData[0].data_entity_text_1);
                    util.logInfo(request,`BotEngine | addParticipant | getFieldValue | Customer Name:  %j`,newReq.customer_name);
                    request.debug_info.push("BotEngine | addParticipant | getFieldValue | Customer Name: " + newReq.customer_name);
                }
            } catch (error) {
                util.logError(request,`BotEngine | addParticipant | getFieldValue | Customer Name | Error: `, { type: "bot_engine", error: serializeError(error) });
            }
        }

        newReq.is_lead = isLead;
        newReq.is_owner = isOwner;
        newReq.flag_creator_as_owner = flagCreatorAsOwner;

        util.logInfo(request,`BotEngine | addParticipant | newReq  %j`,newReq);
        request.debug_info.push('newReq.phone_number : ' + newReq.phone_number);
        if (
            (newReq.phone_number !== -1) &&
            (Number(newReq.phone_number) !== 0) &&
            (newReq.phone_number !== 'null') && (newReq.phone_number !== undefined)
        ) {
            request.debug_info.push("BotService | addParticipant | Message: " + newReq.phone_number + " | " + typeof newReq.phone_number);
            return await addParticipantStep(newReq);
        } else {
            util.logError(request,`BotService | addParticipant | Error: Phone number: ${newReq.phone_number}, has got problems!`);
            return [true, "Phone Number is Undefined"];
        }

    }

    //Bot Step Firing an eMail
    async function fireEmail(request, inlineData) {
        let newReq = Object.assign({}, request);
        let resp;

        util.logInfo(request, 'fireEmail inlineData: %j', inlineData);
        request.debug_info.push('inlineData: ' + inlineData);
        let type = Object.keys(inlineData);
        util.logInfo(request, 'fireEmail inlineData: %j', type);
        request.debug_info.push('type: ' + type);

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
                    util.logError(request,`Error fetching attachment value: `, { type: 'bot_engine', error });
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
            util.logError(request,`Fire Email | base64_2_string | Decode Error: `, { type: 'bot_engine', error });
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
                util.logError(request,`Error fetching userNameValue value: `, { type: 'bot_engine', error });
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
                util.logError(request,`Error fetching userNameValue value: `, { type: 'bot_engine', error });
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
                util.logError(request,`Error fetching processUserData: `, { type: 'bot_engine', error });
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
            util.logError(request,`Error shortening URL parameters: `, { type: 'bot_engine', errOne });
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
                    util.logError(request,`workflowActivityTypeId | getActivityDetailsPromise | error: `, { type: 'bot_engine', error });
                });
        } catch (error) {
            util.logError(request,`workflowActivityTypeId | error: `, { type: 'bot_engine', error });
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
            util.logError(request,`Error shortening URL parameters: `, { type: 'bot_engine', errOne });
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

        util.logInfo(request,`urlStrFill : ${urlStrFill}`);
        const statusLink = `<a style='background: #f47920;display: inline-block;color: #FFFFFF;text-decoration: none;font-size: 12px;margin-top: 1.0em;background-clip: padding-box;padding: 5px 15px;box-shadow: 4px 4px 6px 1px #cbcbcb;margin-left:10px' target='_blank' href='${urlStrFill}'>Track Order Status</a>`;

        return statusLink;
    }

    // Bot Step Firing a Text Message
    async function fireTextMsg(request, inlineData) {
        let newReq = Object.assign({}, request);
        let resp;
        util.logInfo(request,`inline data %j` , JSON.stringify(inlineData));
        util.logInfo(request, 'fireTextMsg inlineData: %j', inlineData);
        request.debug_info.push('inlineData: ' + inlineData);
        let type = Object.keys(inlineData);
        util.logInfo(request, 'fireTextMsg type: %j', type);
        request.debug_info.push('type: ' + type);

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
        } else if (type[0]==='asset_reference') {
            newReq.communication_id = inlineData[type[0]].template_id;
            let target_form_id = inlineData[type[0]].form_id;
            let target_field_id = inlineData[type[0]].field_id;
            newReq.form_id = inlineData[type[0]].form_id;
            newReq.field_id = inlineData[type[0]].field_id;
            let activityData = await activityCommonService.getActivityDetailsPromise({ organization_id: request.organization_id },request.workflow_activity_id);
            let activityInlineData = activityData[0].activity_inline_data;
            activityInlineData = JSON.parse(activityInlineData)
            let assetfieldData = activityInlineData.find((item=>item.field_id == target_field_id));
            if(assetfieldData){
            let targetAssetId = typeof assetfieldData.field_value == 'string'?assetfieldData.field_value.split('|'):assetfieldData.field_value.toString().split('|');
            util.logInfo(request,`tar asset id %j` , targetAssetId);
            let dataResp = await getAssetDetails({
                "organization_id": request.organization_id,
                "asset_id": targetAssetId[0]
            });
            newReq.country_code = dataResp[0].operating_asset_phone_country_code;
            newReq.phone_number = dataResp[0].operating_asset_phone_number;
            }

        }
if(type[0]==='asset_reference'&& !newReq.communication_id){
    newReq.smsText = inlineData[type[0]].template;
        newReq.line =  "";
        newReq.form =  0;
}
else{

        let dbResp = await getCommTemplates(newReq);
        let retrievedCommInlineData = JSON.parse(dbResp[0].communication_inline_data);
        newReq.smsText = retrievedCommInlineData.communication_template.text.message;
        newReq.line = retrievedCommInlineData.communication_template.text.link || "";
        newReq.form = retrievedCommInlineData.communication_template.text.form || 0;
        util.logInfo(request, 'fireTextMsg smsText: %j', newReq.smsText);
        request.debug_info.push('smsText: ' + newReq.smsText);
}
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
                    util.logInfo(request, 'fireTextMsg smsText: %j', res);
                    shortenedUrl = res;
                    resolve();
                });
            });

            newReq.smsText = newReq.smsText + " " + shortenedUrl;
        }

        await new Promise((resolve, reject) => {
            if (Number(newReq.country_code) === 91) {
                util.sendSmsSinfiniV1(newReq.smsText, newReq.country_code, newReq.phone_number,'GRNEOS', function (err, res) {
                    util.logError(request, 'Sinfini Error: ', { err });
                    util.logInfo(request, 'Sinfini Response: %j', res);
                    resolve();
                });
            } else {
                util.sendInternationalTwilioSMS(newReq.smsText, newReq.country_code, newReq.phone_number, function (err, res) {
                    util.logError(request, 'Twilio Error: ', { err });
                    util.logInfo(request, 'Twilio Response: %j', res);                    
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

        util.logInfo(request, 'fire716OnWFOrderFileRequest: %j', fire716OnWFOrderFileRequest);
        request.debug_info.push('fire716OnWFOrderFileRequest: ' + fire716OnWFOrderFileRequest);
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

        util.logInfo(request, 'fireApi inlineData: %j', inlineData);
        request.debug_info.push('inlineData: ' + inlineData);
        let type = Object.keys(inlineData);
        util.logInfo(request, 'fireApi inlineData: %j', type);
        request.debug_info.push('type: ' + type);

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
                util.logInfo(request, 'fireApi inlineData: %j', resp);
                request.debug_info.push('resp: ' + resp);
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
        util.logInfo(request, '****************************************************************');
        util.logInfo(request, 'WF PERCENTAGE ALTER');
        util.logInfo(request, 'Request Params received from Request');
        util.logInfo(request, 'alterWFCompletionPercentageMethod request: %j', request);

        let inline = {
            workflow_percentage_contribution: request.activity_status_workflow_percentage
        };
        try {
            let result = await alterWFCompletionPercentage(request, inline);
        } catch (err) {
            util.logInfo(request, 'Error in executing alterWFCompletionPercentageMethod Step: %j', err);
        }
        util.logInfo(request, '****************************************************************');

        return [false, {}]
    }

    //Bot Step Altering workflow completion percentage
    async function alterWFCompletionPercentage(request, inlineData) {
        let newrequest = Object.assign({}, request);

        //newrequest.activity_id = request.workflow_activity_id;
        util.logInfo(request, 'alterWFCompletionPercentage workflow_percentage_contribution: %j', inlineData.workflow_percentage_contribution);
        request.debug_info.push('inlineData.workflow_percentage_contribution: ' + inlineData.workflow_percentage_contribution);
        newrequest.workflow_completion_percentage = inlineData.workflow_percentage_contribution;
        let wfCompletionPercentage = newrequest.workflow_completion_percentage;
        //let resp = await getQueueActivity(newrequest, newrequest.workflow_activity_id);        
        let resp = await getAllQueuesBasedOnActId(newrequest, newrequest.workflow_activity_id);
        util.logInfo(request, 'alterWFCompletionPercentage resp: %j', resp);
        request.debug_info.push('resp: ' + resp);

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
                util.logInfo(request, 'queueActivityMappingData: %j', queueActivityMappingData);

                request.debug_info.push('queueActivityMappingData: ' + queueActivityMappingData);
                if (queueActivityMappingData.length > 0) {
                    queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;
                    queueActMapInlineData = JSON.parse(queueActivityMappingData[0].queue_activity_mapping_inline_data);
                    let obj = {};

                    util.logInfo(request, 'queueActMapInlineData.length: %j', Object.keys(queueActMapInlineData).length);
                    request.debug_info.push('queueActMapInlineData.length: ' + Object.keys(queueActMapInlineData).length);
                    if (Object.keys(queueActMapInlineData).length === 0) {
                        obj.queue_sort = {};
                        obj.queue_sort.caf_completion_percentage = wfCompletionPercentage;
                        queueActMapInlineData = obj;
                    } else {
                        //queueActMapInlineData.queue_sort.caf_completion_percentage += wfCompletionPercentage;
                        queueActMapInlineData.queue_sort.caf_completion_percentage = wfCompletionPercentage;
                    }
                    util.logInfo(request, 'Updated Queue JSON : %j', queueActMapInlineData, {});

                    request.debug_info.push('Updated Queue JSON - queueActMapInlineData: ' + queueActMapInlineData);
                    data = await (activityCommonService.queueActivityMappingUpdateInlineData(newrequest, queueActivityMappingId, JSON.stringify(queueActMapInlineData)));
                    util.logInfo(request, 'Updating the Queue Json : %j', data, {});

                    request.debug_info.push('Updating the Queue Json -data: ' + data);
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

    async function sendEmail(request, emailJson) {
        return new Promise(async (resolve, reject) => {
            util.logInfo(request, "\x1b[35m [Log] Inside SendEmail \x1b[0m", {}, {});
            const emailSubject = emailJson.subject;
            const Template = emailJson.body;

            //request.email_sender = 'OMT.IN1@vodafoneidea.com'; 
            //request.email_sender_name = 'Vodafoneidea';

            util.logInfo(request, 'sendEmail emailSubject %j', emailSubject);
            util.logInfo(request, 'sendEmail Template %j', Template);            

            if(Number(request.organization_id) === 868) {
                util.logInfo(request,`Its vodafone request`);
                //From ESMSMails@vodafoneidea.com
                //util.sendEmailEWS(request, request.email_id, emailSubject, Template);  

                //CentralOmt.In@vodafoneidea.com  
                let [err123, activityTypeConfigData] = await activityCommonService.getWorkflowFieldsBasedonActTypeId(request,request.activity_type_id);
      
      if(err123 || activityTypeConfigData.length == 0 || activityTypeConfigData[0].activity_type_inline_data == ""){
        util.logInfo(request,"Exiting due to missing config settings");
        util.sendEmailV4ews(request, request.email_id, emailSubject, Template, 1);
      }
      else{ 
      let activity_type_inline_data = typeof activityTypeConfigData[0].activity_type_inline_data == 'string' ? JSON.parse(activityTypeConfigData[0].activity_type_inline_data) : activityTypeConfigData[0].activity_type_inline_data; 
      let emailProviderDetails = {
        email:activity_type_inline_data.activity_type_email_id,
        password:activity_type_inline_data.activity_type_email_password,
        username:activity_type_inline_data.activity_type_email_username
    }
                // util.sendEmailV4ews(request, request.email_id, emailSubject, Template, 1);
                util.sendEmailV4ewsV1(
                    request,
                    [request.email_id],
                    emailSubject,
                    Template,
                    "",
                    emailProviderDetails
                );
      }

            } else {
                util.logInfo(request,`Its non-vodafone request`);
                util.sendEmailV3(request,
                    request.email_id,
                    emailSubject,
                    "IGNORE",
                    Template,
                    (err, data) => {
                        if (err) {
                            until.logError(request, '[Send Email On Form Submission | Error]', { err })
                        } else {
                            util.logInfo(request, "[Send Email On Form Submission | Response]: " + "Email Sent", data);
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
        let botOperationId = request.bot_operation_id || "";

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
        util.logInfo(request,`deskAssetData %j`,deskAssetData);

        if (assetData.desk_asset_id === 0) {
            assetData.desk_asset_id = deskAssetData.asset_id;
        }

        assetData.first_name = deskAssetData.operating_asset_first_name || deskAssetData.asset_first_name;
        assetData.contact_phone_number = deskAssetData.operating_asset_phone_number || deskAssetData.asset_phone_number;
        assetData.contact_phone_country_code = deskAssetData.operating_asset_phone_country_code || deskAssetData.asset_phone_country_code;
        assetData.asset_type_id = deskAssetData.asset_type_id;
        request.debug_info = []
        util.logInfo(request,`assetData %j`,assetData);
        request.debug_info.push(request.workflow_activity_id + " : addParticipant : going to be added assetData :"+ JSON.stringify(assetData))
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
        let botOperationId = request.bot_operation_id || "";
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

                util.logInfo(request,`customerServiceDeskRequest %j`,customerServiceDeskRequest);

                const requestOptions = {
                    form: customerServiceDeskRequest
                };


                util.logInfo(request,`Before Making Request `);
                makeRequest.post(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', requestOptions, function (error, response, body) {
                    util.logInfo(request,`[customerServiceDeskRequest] Body:  %j`,body);
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
        let botOperationId = request.bot_operation_id || "";
        // const [log_error, log_assetData] = await activityCommonService.getAssetDetailsAsync({
        //     organization_id: request.organization_id,
        //     asset_id: request.asset_id
        // });
        const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);

        let logAssetFirstName = defaultAssetName;
            let message = `${logAssetFirstName} added ${assetData.asset_first_name} as collaborator.`;
            // console.log("***********changed from ${defaultAssetName} to name****************",log_assetData[0].asset_id)
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
                "content": message,
                "mail_body": message,
                "participant_added": message,
                "subject": message
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

        util.logInfo(request,`addDeskAsParticipant %j`,addParticipantRequest);

        request.debug_info.push(request.workflow_activity_id + " : addParticipant : addDeskAsParticipant : addParticipantRequest :"+ JSON.stringify(addParticipantRequest))
        return await new Promise((resolve, reject) => {
            activityParticipantService.assignCoworker(addParticipantRequest, async (err, resp) => {
                if(err === false) {                    
                    
                    //Check for lead flag                    
                    request.debug_info.push("request.is_lead : "+request.is_lead);
                    request.debug_info.push("request.is_owner : "+request.is_owner);
                    request.debug_info.push("request.flag_creator_as_owner : "+request.flag_creator_as_owner);

                    const dataResp = await getAssetDetails({
                        "organization_id": request.organization_id,
                        "asset_id": request.asset_id
                    });

                    if(Number(request.is_lead) === 1) {
                        util.logInfo(request,`Inside is_lead `);
                        let newReq = {};
                            newReq.organization_id = request.organization_id;
                            newReq.account_id = request.account_id;
                            newReq.workforce_id = request.workforce_id;
                            newReq.asset_id = 100;
                            newReq.activity_id = Number(request.workflow_activity_id);
                            newReq.lead_asset_id = Number(assetData.desk_asset_id);
                            newReq.timeline_stream_type_id = 718;
                            newReq.datetime_log = util.getCurrentUTCTime();
                        request.debug_info.push(" addDeskAsParticipant | Before activityListLeadUpdateV2 |"+assetData.desk_asset_id);
                        await rmBotService.activityListLeadUpdateV2(newReq, Number(assetData.desk_asset_id));

                        //Get the asset Details of the requestor
                        

                        let requestAssetName = defaultAssetName;
                        if(dataResp.length > 0) {
                           let requestorAssetData = dataResp[0];
                            requestAssetName = requestorAssetData.operating_asset_first_name || requestorAssetData.asset_first_name;
                        }
                        
                        let contentText = `${requestAssetName} assigned ${assetData.first_name} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`;

                        if(request.asset_id == assetData.desk_asset_id){
                          contentText = `${assetData.first_name} has made as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`
                        }
                        request.debug_info.push('Assigner asset data length : '+dataResp.length);
                        request.debug_info.push('Target asset_id and assigner asset_id : ' +request.asset_id + assetData.desk_asset_id)
                        request.debug_info.push('Text added to timeline : '+contentText)
                        //Add a timeline entry
                        let activityTimelineCollection =  JSON.stringify({                            
                            "content": contentText,
                            "subject": `Note - ${util.getCurrentDate()}.`,
                            "mail_body": contentText,
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

                        util.logInfo(request,`making owner bot `);
                        let params = {
                            activity_id : Number(request.workflow_activity_id),
                            target_asset_id : assetData.desk_asset_id,
                            organization_id : request.organization_id,
                            owner_flag : 1,
                            asset_id : 100
                        }
                        await activityCommonService.setAtivityOwnerFlag(params);

                        // const [log_error1, log_assetData1] = await activityCommonService.getAssetDetailsAsync({
                        //     organization_id: request.organization_id,
                        //     asset_id: request.asset_id
                        // });
                        let logAssetFirstName = defaultAssetName;//log_assetData[0].operating_asset_first_name;
                        if(dataResp.length > 0) {
                          let requestorAssetData = dataResp[0];
                            logAssetFirstName = requestorAssetData.operating_asset_first_name || requestorAssetData.asset_first_name;
                        }
                        // console.log("***********changed from ${defaultAssetName} to name****************",log_assetData[0].asset_id)
                        let contentText = `${logAssetFirstName} assigned ${assetData.first_name} as owner at ${moment().utcOffset('+05:30').format('LLLL')}.`;
                        if(request.asset_id == assetData.desk_asset_id){
                       contentText = `${assetData.first_name} has made as owner at ${moment().utcOffset('+05:30').format('LLLL')}.`
                        }

                        request.debug_info.push('Assigner asset data length : '+dataResp.length);
                        request.debug_info.push('Target asset_id and assigner asset_id : ' +request.asset_id + assetData.desk_asset_id)
                        request.debug_info.push('Text added to timeline : '+contentText)
                        // if()
                        let activityTimelineCollection =  JSON.stringify({
                            "content": contentText,
                            "subject": `Note - ${util.getCurrentDate()}.`,
                            "mail_body": contentText,
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
                        util.logInfo(request,`making creator bot`);
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

                        // const [log_error, log_assetData] = await activityCommonService.getAssetDetailsAsync({
                        //     organization_id: request.organization_id,
                        //     asset_id: request.asset_id
                        // });
                        let logAssetFirstName = defaultAssetName;//log_assetData[0].operating_asset_first_name;
                        if(dataResp.length > 0) {
                            let requestorAssetData = dataResp[0];
                              logAssetFirstName = requestorAssetData.operating_asset_first_name || requestorAssetData.asset_first_name;
                          }
                        // console.log("***********changed from ${defaultAssetName} to name****************",log_assetData[0].asset_id)
                        let contentText = `${logAssetFirstName} assigned ${assetData.first_name} as creator at ${moment().utcOffset('+05:30').format('LLLL')}.`;
                        if(request.asset_id == assetData.desk_asset_id){
                        contentText = `${assetData.first_name} has made as creator at ${moment().utcOffset('+05:30').format('LLLL')}.`
                        }
                        request.debug_info.push('Assigner asset data length : '+dataResp.length);
                        request.debug_info.push('Target asset_id and assigner asset_id : ' +request.asset_id + assetData.desk_asset_id)
                        request.debug_info.push('Text added to timeline : '+contentText)
                        let activityTimelineCollection =  JSON.stringify({
                            "content": contentText,
                            "subject": `Note - ${util.getCurrentDate()}.`,
                            "mail_body": contentText,
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
                util.logError(request, 'makeAPIRequest error', { error });
                util.logInfo(request, 'makeAPIRequest response: %j', response && response.statusCode);
                util.logInfo(request, 'makeAPIRequest body: %j', body);
            });
        } else if (request.method === 'POST') {

            for (let i of parametersJson) {
                formParams[i.parameter_key] = i.parameter_value;
            }

            util.logInfo(request, 'makeAPIRequest formParams : %j', formParams);
            url = `${request.protocol}://${request.endpoint}`;

            return new Promise((resolve, reject) => {
                makeRequest.post({
                    url: url,
                    form: formParams
                }, (err, httpResponse, body) => {
                    //global.logger.write('conLog', httpResponse,{},{});                    
                    
                    util.logError(request, 'makeAPIRequest error', { err });
                    util.logInfo(request, 'makeAPIRequest body : %j', body);

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
        let botOperationId = request.bot_operation_id || "";

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
            util.logInfo(request,`dataTypeId :  %j`,dataTypeId);

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
                    let money = typeof row.field_value=='string'?JSON.parse(row.field_value):row.field_value;
                    params[14] = money.value;
                    params[18] = money.code;
                    params[27] = JSON.stringify(money)
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
                    let signatureData1 = row.field_value.split('|');
                    params[18] = signatureData1[0]; //image path
                    params[13] = signatureData1[1]; // asset reference
                    params[11] = signatureData1[1]; // accepted /rejected flag
                    break;
                case 29: //Coworker Signature with asset reference
                case 30: //Coworker Picnature with asset reference
                    // approvalFields.push(row.field_id);
                    let signatureData2 = row.field_value.split('|');
                    params[18] = signatureData2[0]; //image path
                    params[13] = signatureData2[1]; // asset reference
                    params[11] = signatureData2[1]; // accepted /rejected flag
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
                            util.logError(request,`ERROR in field edit - 57 : `, { type: "bot_engine", error: serializeError(err) });
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
                        util.logError(request,`ERROR in field edit - 62 : `, { type: "bot_engine", error: serializeError(err) });
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
                        util.logError(request,`ERROR in field edit - 71 : `, { type: "bot_engine", error: serializeError(err) });
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

            util.logInfo(request,`In BotService - addFormEntries params %j`,params);
         
            // let queryString = util.getQueryString('ds_p1_activity_form_transaction_insert_field_update', params);
            let queryString = util.getQueryString('ds_p1_1_activity_form_transaction_insert_field_update', params);
            if(request.asset_id === 0 || request.asset_id === null) {
                util.logInfo(request,`ds_p1_1_activity_form_transaction_insert_field_update as asset_id is ${request.asset_id}`);
            }
            else {
                if (queryString != '') {
                    try {
                        await db.executeQueryPromise(0, queryString, request);
                    } catch (err) {
                        util.logError(request,`serverError | Error in executing changeStatus Step`, { type: "bot_engine", error: serializeError(err) });
                    }
                }
            }
        }
        return {};
    }

    async function getQueueActivity(request, idActivity,activityTypeCategoryId) {
        let queryString='';
        if(Number(activityTypeCategoryId)===59){
            let paramsArr = [idActivity];
             queryString = util.getQueryString('ds_v2_queue_activity_mapping_select_activity', paramsArr);
        }
        else{
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            idActivity
        );
         queryString = util.getQueryString('ds_v1_queue_activity_mapping_select_activity', paramsArr);
        }
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
        }
    }

    async function getAssetDetailsOfANumber(request) {
        let paramsArr = new Array(
            request.organization_id || 0,
            request.phone_number,
            request.country_code || 91
        );
        let queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
        }
    }

    async function getAssetDetails(request) {
        let paramsArr = new Array(
            request.organization_id,
            request.asset_id
        );
        let queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
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
        let queryString="";
        if(request.activity_type_category_id==59){
            let paramsArr =[activityId]
             queryString = util.getQueryString('ds_p1_3_queue_activity_mapping_select_activity', paramsArr);
        }
        else{
        let paramsArr = new Array(
            request.organization_id,
            activityId
        );
         queryString = util.getQueryString('ds_p1_1_queue_activity_mapping_select_activity', paramsArr);
        }
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
        let botOperationId = request.bot_operation_id || "";

        let fieldsNewValues = [],
            fieldsNewValuesMap = new Map();
        fieldsNewValues = JSON.parse(request.activity_inline_data);
        for (const field of fieldsNewValues) {
            fieldsNewValuesMap.set(Number(field.field_id), field);
        }
        util.logInfo(request,`fieldsNewValuesMap:  %j`,fieldsNewValuesMap);

        let activityData = [];
        // Fetch the activity data from the DB
        try {
            activityData = await activityCommonService.getActivityByFormTransaction(request, request.activity_id);
        } catch (error) {
            util.logError(request,`alterFormActivityFieldValues | getActivityByFormTransaction | Error`, { type: "bot_engine", error: serializeError(error) });
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
                    organization_id: request.organization_id,
                    log_uuid : request.log_uuid
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

                        let simpleDataTypes = [1,2,3,7,8,9,10,14,15,19,21,22];
                        if (activityInlineDataMap.has(fieldID)) {
                            let oldFieldEntry = activityInlineDataMap.get(fieldID);
                            let newFieldEntry = Object.assign({}, oldFieldEntry);
                            newFieldEntry.field_value = fieldsNewValuesMap.get(fieldID).field_value;
                            // Set the new value in the inline data map
                            activityInlineDataMap.set(fieldID, newFieldEntry);

                            // Form the content string
                            // content += `In the ${formName}, the field ${fieldName} was updated from ${oldFieldEntry.field_value} to ${newFieldEntry.field_value} <br />`;;
                            if(simpleDataTypes.includes(newFieldEntry.field_data_type_id))                         
                            content += `In the ${formName}, the field ${fieldName} was updated from ${oldFieldEntry.field_value} to ${newFieldEntry.field_value} <br />`;
                            else
                            content += `In the ${formName}, the field ${fieldName} was updated <br />`;
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
                            if(simpleDataTypes.includes(newFieldEntry.field_data_type_id))   
                            content += `In the ${formName}, the field ${fieldName} was updated to ${newFieldEntry.field_value} <br />`;
                            else
                            content += `In the ${formName}, the field ${fieldName} was updated <br />`;
                            // content += `In the ${formName}, the field ${fieldName} was updated to ${newFieldEntry.field_value} <br />`;;
                        }

                        return {
                            field_id: fieldID,
                            success: true,
                            update_sequence_id: newRequest.update_sequence_id
                        };
                    })
                    .catch((error) => {
                        util.logError(request,`fetchUpdateSeqIdPromises | getLatestUpdateSeqId | Error: `, { type: "bot_engine", error: serializeError(error) });
                        return 'Ghotala';
                    })
            );
        }

        await Promise.all(fetchUpdateSeqIdPromises)
            .then((updateSequenceIDs) => {
                util.logInfo(request,`updateSequenceIDs:  %j`,updateSequenceIDs);
            })
            .catch((error) => {
                util.logError(request,`Promise.all | fetchUpdateSeqIdPromises | error: `, { type: "bot_engine", error: serializeError(error) });
                return [error, []];
            });

            util.logInfo(request,`content:  %j`,content);
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
                util.logError(request,`Error in queueWrapper raiseActivityEvent: `, { type: "bot_engine", error: serializeError(err) });
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                util.logInfo(request,`Response from queueWrapper raiseActivityEvent:  %j`,resp);
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
                util.logError(request,`alterFormActivityFieldValues | workflowFile713Request | addTimelineTransactionAsync | Error: `, { type: "bot_engine", error: serializeError(error) });
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
            util.logInfo(request,`key: ${key}`);
            request.debug_info.push('key: ' + key);
            const fieldID = Number(createCustomerInlineData[key].field_id);
            util.logInfo(request,`fieldID: ${fieldID}`);
            request.debug_info.push('fieldID: ' + fieldID);
            if (formInlineDataMap.has(fieldID)) {
                customerData[key] = formInlineDataMap.get(fieldID).field_value;
                util.logInfo(request,`formInlineDataMap.get(fieldID).field_value: %j` , formInlineDataMap.get(fieldID).field_value);
                request.debug_info.push('formInlineDataMap.get(fieldID).field_value: ' + formInlineDataMap.get(fieldID).field_value);
            }
        }
        // console.lo
        
        let indutry_type_id = createCustomerInlineData['lov_type_id'];
        const [errInd,industryData] = await getIndustryIdByName({id:indutry_type_id,name:customerData.customer_industry})
        util.logInfo(request,`indData12 %j` , industryData);
        let countryCode = 0, phoneNumber = 0;
        if (customerData.customer_phone_number.includes('|')) {
            [countryCode, phoneNumber] = customerData.customer_phone_number.split('|')
        } else if (customerData.customer_phone_number.includes('||')) {
            [countryCode, phoneNumber] = customerData.customer_phone_number.split('||')
        }
        else {
            countryCode = "91";
            phoneNumber = customerData.customer_phone_number;
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
        // const [errOne, serviceDeskAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory({
        //     organization_id: request.organization_id,
        //     account_id: createCustomerInlineData.account_id,
        //     workforce_id: createCustomerInlineData.workforce_id,
        //     asset_type_category_id: 45
        // });
        // if (errOne || !(serviceDeskAssetTypeData.length > 0)) {
        //     logger.error("Unable to fetch asset_type_id for the customer service desk.", { type: 'bot_engine', request_body: request });
        //     return;
        // }
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
            asset_type_id: createCustomerInlineData.desk_asset_type_id,

            activity_inline_data: JSON.stringify({
                "contact_profile_picture": "",
                "contact_first_name": deskName,
                "contact_designation": deskName,
                "contact_location": "",
                "contact_phone_country_code": countryCode,
                "contact_phone_number": phoneNumber,
                "contact_email_id": customerData.customer_email,
                "contact_asset_type_id": createCustomerInlineData.desk_asset_type_id,
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
       if(industryData && industryData.length>0){
        const [errten,assetUpdateIndustry1]=await assetListUpdateIndustry({...request,asset_id:serviceDeskData.asset_id,industry_id:industryData[0].entity_id});
       }
        // Fetch the Customer's asset_type_id
        // const [errThree, customerAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory({
        //     organization_id: request.organization_id,
        //     account_id: createCustomerInlineData.account_id,
        //     workforce_id: createCustomerInlineData.workforce_id,
        //     asset_type_category_id: 13
        // });
        // if (errThree || !(customerAssetTypeData.length > 0)) {
        //     logger.error("Unable to fetch asset_type_id for the customer.", { type: 'bot_engine', request_body: request });
        //     return;
        // }
        // Create Customer on the Service Desk
        const createCustomerRequest = {
            ...createCustomerServiceDeskRequest,
            activity_description: `${customerData.customer_name_first} ${customerData.customer_name_last}`,
            activity_title: `${customerData.customer_name_first} ${customerData.customer_name_last}`,
            asset_first_name: `${customerData.customer_name_first} ${customerData.customer_name_last}`,
            asset_type_category_id: 13,
            asset_access_role_id: 1,
            asset_access_level_id: 5,
            asset_type_id: createCustomerInlineData.asset_type_id,
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
        if(industryData && industryData.length>0){
        const [err11,assetUpdateIndustry2]=await assetListUpdateIndustry({...request,asset_id:customerAssetData.operating_asset_id,industry_id:industryData[0].entity_id});
        }
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

    async function assetListUpdateIndustry (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.asset_id,
            request.industry_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        let queryString = util.getQueryString('ds_v1_asset_list_update_industry', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    async function getIndustryIdByName(request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
          request.id,
          request.name
        );

        let queryString = util.getQueryString('ds_p3_lov_list_select', paramsArr);
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

    async function updateStatusInIntTablesReferenceDtypes(request, inlineData) {
        let botOperationId = request.bot_operation_id || "";
        
        let activity_id = request.workflow_activity_id;
        let activity_status_id = inlineData.activity_status_id;
        let activity_status_type_id = inlineData.activity_status_id
        
        let newRequest = Object.assign({}, request);
            newRequest.operation_type_id = 16;
        const [err, respData] = await activityListingService.getWorkflowReferenceBots(newRequest);
        util.logInfo(request,`Workflow Reference Bots for this activity_type :  %j`,respData.length);

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
        util.logInfo(request,`Combo Field Reference Bots for this activity_type :  %j`,respData1.length);

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
        util.logInfo(request,`Workflow Reference Bots for this activity_type : %j`, respData.length);
        if(respData.length > 0) {
            //for(let i = 0; i<respData.length; i++) {}               
            activityCommonService.activityEntityMappingUpdateWFPercentage(request, {
                activity_id,
                workflow_percentage
            }, 1);
        }

        newRequest.operation_type_id = 17;
        const [err1, respData1] = await activityListingService.getWorkflowReferenceBots(newRequest);
        util.logInfo(request,`Combo Field Reference Bots for this activity_type : ${respData.length}`);
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

        let queryString = util.getQueryString('ds_p1_1_bot_operation_mapping_select_operation_type', paramsArr);
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
          
        util.logInfo(request,`cuidInlineData : %j` , cuidInlineData);

        for (let [cuidKey, cuidValue] of Object.entries(cuidInlineData)) {
            let cuidUpdateFlag = 0,
                activityCUID1 = '', activityCUID2 = '', activityCUID3 = '',
                fieldValue = "";

            if(request.hasOwnProperty("opportunity_update")){
                fieldValue = cuidValue;
            } else if(request.hasOwnProperty("account_code_update")) {
                fieldValue = cuidValue;
            } else if(request.hasOwnProperty("calendar_event_id_update")) {
                fieldValue = cuidValue;
            } else if(formInlineDataMap.has(Number(cuidValue.field_id))) {
                const fieldData = formInlineDataMap.get(Number(cuidValue.field_id));
                
                util.logInfo(request,`fieldData : %j` , fieldData);
                util.logInfo(request,`Number(fieldData.field_data_type_id) : ${Number(fieldData.field_data_type_id)}`);

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

            try {
                activityCommonService.actAssetSearchMappingUpdate(request);
            } catch (error) {
                logger.error("updateCUIDs | Error updating CUID in the AssetSearchMapping", { type: 'esms_ibm_mq', error: serializeError(error) });
            }

        }

        return [false, []];
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

    async function activityListRemoveCUIDs(request, cuidUpdateFlag) {
        /* 
            {
                "bot_operations": {
                    "condition": {
                    "form_id": 0,
                    "field_id": 0,
                    "is_check": false,
                    "operation": "",
                    "threshold": 0
                },
                "remove_cuids": {
                    "remove_cuid_flag":0/1/2/3
                    }
                }
            }

            0 for all
        */
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            cuidUpdateFlag,
            request.asset_id || 0,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_v1_activity_list_delete_cuid', paramsArr);

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

                    //Inserting into activity asset table for account search
                    util.logInfo(request,`\nAccount Search - Updating the activity asset table`);
                    activityCommonService.actAssetSearchMappingUpdate({
                        activity_id: request.activity_id,
                        asset_id: request.asset_id,
                        organization_id: request.organization_id
                        //flag: 0
                    });
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

        //let activityInlineData = JSON.parse(request.activity_inline_data);
        let accountActivityId;
        let accountDetails = [];
        util.logInfo(request, 'request.account_activity_id : ', request.account_activity_id);
        if (request.account_activity_id > 0) {
            accountActivityId = request.account_activity_id;
            accountDetails = await activityCommonService.getActivityDetailsPromise(request, accountActivityId);
        } /*else {
            util.logInfo(request, 'activityopportunityset No Account :: ' + request.account_activity_id);
            util.logInfo(request, 'activityopportunityset request.reference_data :: ' + request.reference_data);
            util.logInfo(request, 'activityopportunityset request.reference_data stringify :: ' + JSON.stringify(request.reference_data));
            let fieldValue = request.reference_data || '';
            util.logInfo(request, 'activityopportunityset request.reference_data.field_value :: ' + fieldValue.field_value);
            //fieldValue = (typeof fieldValue === 'string')? fieldValue : JSON.stringify(fieldValue);
            if (fieldValue.field_value.includes('|')) {
                accountActivityId = fieldValue.split('|')[0];
            }else{
                util.logInfo(request, 'fieldValue doesnot include |');
            }
        } */
        util.logInfo(request, 'AccountId : ' + accountActivityId + " :: LENGTH :: " + accountDetails.length);
        //Call activity_activity_mapping retrieval service to get the segment
        /* let [err, segmentData] = await activityCommonService.activityActivityMappingSelect({
             activity_id: request.activity_id, //Workflow activity id
             parent_activity_id: parentActivityID, //reference account workflow activity_id
             parent_activity_id: accountActivityId, //reference account workflow activity_id
             organization_id: request.organization_id,
             start_from: 0,
             limit_value: 50
         }); */

        //segmentName = segmentName.toLowerCase();
        if (accountDetails.length > 0) {
            let segmentId = accountDetails[0].activity_type_tag_id; //(segmentData.length>0)?(segmentData[0].parent_activity_tag_name).toLowerCase():'';
            util.logInfo(request, 'segmentId : '+ segmentId);
            switch (segmentId) {
                case 91: generatedOpportunityID += 'C-';
                    break;
                case 122: generatedOpportunityID += 'V-';
                    break;
                case 124: generatedOpportunityID += 'D-';
                    break;
                case 120: generatedOpportunityID += 'S-';
                    break;
                case 123: generatedOpportunityID += 'G-';
                    break;
                case 121: generatedOpportunityID += 'W-';
                    break;
                default : 
                    util.logError(request, '-segmentIDError- '+segmentId);
                    generatedOpportunityID += '';
                    break;
            }
        } else {
            util.logError(request, '-OptyIDError- No Account details');
        }
        try {
            if (generatedOpportunityID.length == 6 && accountDetails[0].tag_type_id == 110) {

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
            } else {
                util.logInfo(request, 'WRONG SEGMENT : ', generatedOpportunityID);
            }
        } catch (e) {
            error = true;
            util.logError(request,`generateOppurtunity Error `, { type: 'bot_engine', e });
        }

        return [error, responseData];
    }

    this.generateCalendarEventID = async (request) => {
        let responseData = [],
            error = false,
            generatedCalendarEventID = "MT";

        try {

            let targetCalendarEventID = await cacheWrapper.getCalendarEventIdPromise();

            generatedCalendarEventID += targetCalendarEventID;
            responseData.push(generatedCalendarEventID);

            logger.silly("Update CUID Bot");
            logger.silly("Update CUID Bot Request: ", request);
            try {
                request.calendar_event_id_update = true;
                await updateCUIDBotOperation(request, {}, { "CUID3": generatedCalendarEventID });
            } catch (error) {
                logger.error("Error running the CUID update bot", { type: 'bot_engine', error: serializeError(error), request_body: request });
            }

        } catch (e) {
            error = true;
            util.logError(request,`generateCalendarEventID Error`, { type: 'bot_engine', e });
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

        util.logInfo(request,`formInlineDataMap : %j` , formInlineDataMap);

        await this.setDueDateOfWorkflow(request, formInlineDataMap, botOperationsJson.bot_operations.due_date_edit);

        return [false, []];
    }
    
    this.setDueDateOfWorkflow = async(request, formInlineDataMap, dueDateEdit, inlineData) => {

        let responseData = [],
            error = false,
            oldDate,
            newDate;

        let fieldData;
        let workflowActivityDetails = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);

        oldDate = (workflowActivityDetails.length > 0) ? workflowActivityDetails[0].activity_datetime_end_deferred: 0;
        if(inlineData && inlineData.hasOwnProperty('is_status_due_date') && inlineData.is_status_due_date == 1) {
            oldDate = (workflowActivityDetails.length > 0) ? workflowActivityDetails[0].activity_datetime_end_status: 0; 
        }
        //oldDate = util.replaceDefaultDatetime(oldDate);
        if(oldDate && oldDate != ""){
        oldDate = util.getFormatedLogDatetimeV1(oldDate,"DD-MM-YYYY HH:mm:ss");
        }
        else {
            oldDate= "";
        }

        util.logInfo(request,`formInlineDataMap : %j` , formInlineDataMap);
        util.logInfo(request,`dueDateEdit form bot inline: %j` , dueDateEdit);
        request.debug_info.push('formInlineDataMap: ' + formInlineDataMap);
        request.debug_info.push('dueDateEdit: ' + dueDateEdit);

        if(dueDateEdit.hasOwnProperty('form_id') && dueDateEdit.form_id > 0) {
            let dateReq = Object.assign({}, request);
                    dateReq.form_id = dueDateEdit.form_id;
                    dateReq.field_id = dueDateEdit.field_id;
            let dateFormData = await getFormInlineData(dateReq, 2);

            for(const i_iterator of dateFormData) {
                if(Number(i_iterator.field_id) === Number(dueDateEdit.date_field_id)) {                
                    newDate = i_iterator.field_value;
                    if(inlineData && Number(inlineData.is_meeting) && i_iterator.field_data_type_id == 77) {
                        let data = i_iterator.field_value;
                        newDate =  data.end_date_time;
                    }

                    newDate = util.getFormatedLogDatetimeV1(newDate, "DD-MM-YYYY HH:mm:ss");
                    break;
                }
            }
        } else {
            if(formInlineDataMap.has(Number(dueDateEdit.field_id))) {
                fieldData = formInlineDataMap.get(Number(dueDateEdit.field_id));
                util.logInfo(request,`fieldData : %j` , fieldData);
                request.debug_info.push('fieldData: ' + fieldData);

                newDate = fieldData.field_value;

                if(inlineData && Number(inlineData.is_meeting) && fieldData.field_data_type_id == 77) {
                    util.logInfo(request,`Parsing Data type 77 %j` , fieldData.field_value);
                    let data = fieldData.field_value;
                    newDate =  data.end_date_time;
                }

                util.logInfo(request,`New Date b4 converting - %j` , newDate);
                util.logInfo(request,`Number(request.device_os_id) - ${Number(request.device_os_id)}`);
                request.debug_info.push('newDate: ' + newDate);
                request.debug_info.push('Number(request.device_os_id): ' + Number(request.device_os_id));
                 
                if(Number(request.device_os_id) === 1) {
                    //newDate = util.getFormatedLogDatetimeV1(newDate, "DD-MM-YYYY HH:mm:ss");

                    util.logInfo(request,`moment(newDate, YYYY-MM-DD, true) - ${moment(newDate, 'YYYY-MM-DD', true).isValid()}`);
                    request.debug_info.push('moment(newDate, YYYY-MM-DD, true): ' + moment(newDate, 'YYYY-MM-DD', true).isValid());
                    if(!moment(newDate, 'YYYY-MM-DD', true).isValid()) {
                        newDate = util.getFormatedLogDatetimeV1(newDate, "DD-MM-YYYY HH:mm:ss");
                    }
                    
                    util.logInfo(request,`Retrieved Date field value - ANDROID: %j` , newDate);
                    request.debug_info.push('Retrieved Date field value - ANDROID: '+ newDate);
                } else if(Number(request.device_os_id) === 2) {
                    //newDate = util.getFormatedLogDatetimeV1(newDate, "DD MMM YYYY");

                    util.logInfo(request,`moment(newDate, YYYY-MM-DD, true) - ${moment(newDate, 'YYYY-MM-DD', true).isValid()}`);
                    request.debug_info.push('moment(newDate, YYYY-MM-DD, true) -: '+ moment(newDate, 'YYYY-MM-DD', true).isValid());
                    if(!moment(newDate, 'YYYY-MM-DD', true).isValid()) {
                        newDate = util.getFormatedLogDatetimeV1(newDate, "DD MMM YYYY");
                    }                   
                    
                    util.logInfo(request,`Retrieved Date field value - IOS: %j` , newDate);
                    request.debug_info.push('Retrieved Date field value - IOS: '+ newDate);
                }
                 else if(Number(request.device_os_id) === 5||Number(request.device_os_id) === 8){
                    util.logInfo(request,`moment(newDate, YYYY-MM-DD, true) - ${moment(newDate, 'YYYY-MM-DD', true).isValid()}`);
                    request.debug_info.push('moment(newDate, YYYY-MM-DD, true) - '+ moment(newDate, 'YYYY-MM-DD', true).isValid());
                    
                    if(!(moment(newDate, 'YYYY-MM-DD', true).isValid() || moment(newDate, 'YYYY-MM-DD HH:mm:ss', true).isValid())) {
                        if(moment(newDate, 'YYYY-MM-DD', true).isValid()) {
                            util.logInfo(request,`IN IF`);
                            request.debug_info.push('IN IF');
                            newDate = await util.getFormatedLogDatetimeV1(newDate, "YYYY-MM-DD");
                        } else {
                            util.logInfo(request,`IN ELSE`);
                            request.debug_info.push('IN ELSE');
                            newDate = await util.getFormatedLogDatetimeV1(newDate, "YYYY-MM-DD HH:mm:ss");
                        }
                    }
                }
            }
        }
 
        
        util.logInfo(request,`OLD DATE : ${oldDate}`);
        util.logInfo(request,`NEW DATE : ${newDate}`);
        request.debug_info.push('OLD DATE: ' + oldDate);
        request.debug_info.push('NEW DATE: ' + newDate);

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
        // console.log("inlineData", inlineData);
        let fieldDetails = formInlineDataMap.get(Number(dueDateEdit.field_id));
        util.logInfo(request,`fieldDetails : %j` , fieldDetails);
        if(inlineData && Number(inlineData.is_meeting) && fieldDetails.field_data_type_id == 77) {
            let parseDetails = fieldDetails.field_value;
           activityCoverData.start_date = {};

           activityCoverData.start_date.new = await util.getFormatedLogDatetimeV1(parseDetails.start_date_time, "YYYY-MM-DD HH:mm:ss");
           
           
        //    let newDate = moment(request.activity_datetime_start). add(inlineData.meeting_duration, 'minutes');
        //    activityCoverData.duedate.new = await util.getFormatedLogDatetimeV1(newDate, "DD-MM-YYYY HH:mm:ss");
        //    activityCoverData.start_date.new = await util.getFormatedLogDatetimeV1(request.activity_datetime_start, "DD-MM-YYYY HH:mm:ss");

           util.logInfo(request,`EDC bot update details : current date : ${parseDetails.start_date_time} %j`, activityCoverData);
        }

        util.logInfo(request,`activityCoverData : %j` , activityCoverData);
        request.debug_info.push('activityCoverData: ' + activityCoverData);
        try{
            newReq.activity_cover_data = JSON.stringify(activityCoverData);
        } catch(err) {
            util.logError(request,`Error`, { type: 'bot_engine', err });
        }
        
        newReq.asset_id = 100;
        newReq.creator_asset_id = Number(request.asset_id);
        newReq.activity_id = Number(request.workflow_activity_id);
        
        const event = {
            name: "alterActivityCover",
            service: "activityUpdateService",
            method: "alterActivityCover",
            payload: newReq
        };

        if(inlineData && inlineData.hasOwnProperty('is_parent_due_date_update') && inlineData.is_parent_due_date_update == 1){
            this.setDueDateV1(request,newDate)
        }
        util.logInfo(request,`request.workflow_activity_id : ${request.workflow_activity_id}`);
        request.debug_info.push('request.workflow_activity_id : '+ request.workflow_activity_id);
        let status_dueDate = false;

        if(inlineData && inlineData.hasOwnProperty('is_status_due_date') && inlineData.is_status_due_date == 1) {
           let updateStatusDueDateParams = {...request};
           updateStatusDueDateParams.activity_id = Number(request.workflow_activity_id);
           updateStatusDueDateParams.status_due_datetime = newDate;
            rmBotService.updateStatusDueDate(updateStatusDueDateParams)
            status_dueDate = true;
        }
        else {

        await queueWrapper.raiseActivityEventPromise(event, request.workflow_activity_id);
        }
        

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

            let content = `${status_dueDate?"Status d":"D"}ue date ${oldDate != "" ? `changed from ${moment(oldDate).format('Do MMMM YYYY, h:mm a')}`:"set"} to ${moment(newDate).format('Do MMMM YYYY, h:mm a')} by ${assetName}`;
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
                timelineReq.timeline_stream_type_id= 734;
                timelineReq.activity_stream_type_id= 734;
                timelineReq.timeline_transaction_datetime = util.getCurrentUTCTime();
                timelineReq.track_gps_datetime = timelineReq.timeline_transaction_datetime;
                timelineReq.datetime_log = timelineReq.timeline_transaction_datetime;
                timelineReq.message_unique_id = util.getMessageUniqueId(100);
                timelineReq.form_date = oldDate;
                timelineReq.to_date = newDate;
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

    this.setDueDateV1 = async function (request,newDate,flag=0){
        
        let activity_id = request.workflow_activity_id;
        console.log("came in activity_id ",activity_id)
        do {
            console.log('came in as',flag)
            let workflowActivityDetails = await activityCommonService.getActivityDetailsPromise(request, activity_id);
            activity_id = flag == 0 ?workflowActivityDetails[0].parent_activity_id:activity_id;
            if(Number(activity_id)==0){
                return [true,[]];
            }
            let parentWorkflowActivityDetails = await activityCommonService.getActivityDetailsPromise(request, activity_id);
            let childEndDate = moment(newDate);
            console.log("newwww",newDate);
            console.log("request.start date",request.start_date)
            let oldDate = parentWorkflowActivityDetails[0].activity_datetime_end_deferred;
            let oldDateM = moment(parentWorkflowActivityDetails[0].activity_datetime_end_deferred);
            console.log("OLD DATE :: ",oldDate);
            console.log(oldDateM.diff(childEndDate))
            activity_id = Number(workflowActivityDetails[0].parent_activity_id);
            if(oldDateM.diff(childEndDate)>=0 && flag!=2 && flag != 1 && flag !=3){
              continue;
            }
            // console.log("came here")
            // return
            let newReq = Object.assign({}, request);
            newReq.timeline_transaction_datetime = util.getCurrentUTCTime();
            newReq.track_gps_datetime = util.getCurrentUTCTime();
            newReq.datetime_log = newReq.track_gps_datetime;
            newReq.message_unique_id = util.getMessageUniqueId(100);
            
        let activityCoverData = {};
            activityCoverData.title = {};
                activityCoverData.title.old = parentWorkflowActivityDetails[0].activity_title;
                activityCoverData.title.new = parentWorkflowActivityDetails[0].activity_title;

            activityCoverData.description = {};
                activityCoverData.description.old = "";
                activityCoverData.description.new = "";

            activityCoverData.duedate = {};
                activityCoverData.duedate.old = oldDate;
                activityCoverData.duedate.new = newDate;
            if(flag==3){
                activityCoverData.duedate.old = oldDate;
                activityCoverData.duedate.new = newDate;
                if(request.start_date && request.start_date!=""){
                    activityCoverData.start_date = {};
                    activityCoverData.start_date.old = parentWorkflowActivityDetails[0].activity_datetime_start_expected;
                    activityCoverData.start_date.new = request.start_date;
                }
                }
            if(flag==2){
                activityCoverData.start_date = {};
                activityCoverData.start_date.old = parentWorkflowActivityDetails[0].activity_datetime_start_expected;
                activityCoverData.start_date.new = request.start_date == ""?parentWorkflowActivityDetails[0].activity_datetime_start_expected:request.start_date;
                let startDatePrev = moment(parentWorkflowActivityDetails[0].activity_datetime_start_expected);
                let endDatePrev = moment(oldDate);
                let daystoAdd = endDatePrev.diff(startDatePrev,'days');
                
                let endDate = util.addDays(request.start_date, daystoAdd);
                activityCoverData.duedate.new = endDate;
                newDate = endDate;
            }
            let finalNewDate = '';
            if(flag==1){
                
                
                let startDatePrev = moment(parentWorkflowActivityDetails[0].activity_datetime_start_expected);
                let endDatePrev = moment(oldDate);
                let daystoAdd = endDatePrev.diff(startDatePrev,'days');
                console.log('days');
                let endDate = util.subtractDays(newDate, daystoAdd);
                activityCoverData.start_date = {};
                activityCoverData.start_date.old = parentWorkflowActivityDetails[0].activity_datetime_start_expected;
                activityCoverData.start_date.new = endDate;
                
                // activityCoverData.duedate.new = endDate;
                finalNewDate = endDate;
            }
            console.log(activityCoverData)
        try{
            newReq.activity_cover_data = JSON.stringify(activityCoverData);
        } catch(err) {
            util.logError(request,`Error`, { type: 'bot_engine', err });
        }
        // return [false,[]]
        newReq.asset_id = 100;
        newReq.creator_asset_id = Number(request.asset_id);
        newReq.activity_id = Number(parentWorkflowActivityDetails[0].activity_id);
        // flag = 0;
        const event = {
            name: "alterActivityCover",
            service: "activityUpdateService",
            method: "alterActivityCover",
            payload: newReq
        };
        // activityUpdateService.alterActivityCover(newReq,()=>{});
        await queueWrapper.raiseActivityEventPromise(event, workflowActivityDetails[0].parent_activity_id);

            let assetDetails = await getAssetDetails({
                "organization_id": request.organization_id,
                "asset_id": request.asset_id
            });

            let assetName = (assetDetails.length > 0) ? assetDetails[0].operating_asset_first_name : 'Bot';
            let status_dueDate = false;
            let content = `${status_dueDate?"Status d":"D"}ue date ${oldDate != "" ? `changed from ${moment(oldDate).format('Do MMMM YYYY, h:mm a')}`:"set"} to ${moment(newDate).format('Do MMMM YYYY, h:mm a')} by ${assetName}`;
            let activityTimelineCollection = {
                content: content,
                subject: `Note - ${util.getCurrentDate()}`,
                mail_body: content,
                attachments: [],                
                asset_reference: [],
                activity_reference: [],
                form_approval_field_reference: []
            };
            newDate = finalNewDate;
            let timelineReq = Object.assign({}, request);
                timelineReq.activity_type_category_id= 48;
                timelineReq.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
                timelineReq.data_entity_inline = JSON.stringify(activityTimelineCollection);
                timelineReq.asset_id = 100;   
                timelineReq.timeline_stream_type_id= 734;
                timelineReq.activity_stream_type_id= 734;
                timelineReq.timeline_transaction_datetime = util.getCurrentUTCTime();
                timelineReq.track_gps_datetime = timelineReq.timeline_transaction_datetime;
                timelineReq.datetime_log = timelineReq.timeline_transaction_datetime;
                timelineReq.message_unique_id = util.getMessageUniqueId(100);
                timelineReq.form_date = oldDate;
                timelineReq.to_date = newDate;
                //timelineReq.device_os_id = 10; //Do not trigger Bots

            timelineReq.activity_id = Number(parentWorkflowActivityDetails[0].activity_id);
            const event1 = {
                name: "addTimelineTransaction",
                service: "activityTimelineService",                
                method: "addTimelineTransactionAsync",                
                payload: timelineReq
            };
            // activityTimelineService.addTimelineTransactionAsync(timelineReq);
            await queueWrapper.raiseActivityEventPromise(event1, workflowActivityDetails[0].parent_activity_id);
        console.log("do exit activity_id",activity_id)
          }
          while (Number(activity_id)!=0 && flag !=2 && flag !=3);
          return [false,[]]
    }

    this.ghantChartStartAndDueDateUpdate = async (request) => {
        if(!request){
            return [false,[]]
        }
console.log(request);
// console.log('single req',request.single_req)
// console.log(request.activity_id)
        //flow to update all its parents due date
        let startDate = moment(request.start_date);
        let workflowActivityDetails1 = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);
        let oldDateM = moment(workflowActivityDetails1[0].activity_datetime_start_expected);
        console.log(workflowActivityDetails1[0].activity_datetime_start_expected);
        console.log(startDate)
        console.log(oldDateM.diff(startDate));
       
        if (request.set_flag == 1) {
          await this.setDueDateV1(request, request.start_date, 2);
        } else if (request.set_flag == 2) {
          await this.setDueDateV1(request, request.due_date, 3);
          return [false, []];
        } else {
          await this.setDueDateV1(request, request.due_date, 1);
        }
        
          if(request.hasOwnProperty('single_req')){
              return [false,[]]
          }
        //flow to update all reffered activities start and end date
        let [err,childActivitiesArray] = await activityListSelectChildOrders({...request,parent_activity_id:request.workflow_activity_id,flag:8});
        // console.log(childActivitiesArray)
        for(let i=0 ; i < childActivitiesArray.length ; i++){
            if(Number(childActivitiesArray[i].activity_mapping_flag_is_prerequisite)==0){
                continue;
            }
            let eachChildRequest = childActivitiesArray[i];
            eachChildRequest.workflow_activity_id = eachChildRequest.activity_id;
            eachChildRequest.refrence_activity_id = request.workflow_activity_id;
            eachChildRequest.parent_activity_id = request.parent_activity_id;
            await this.childChangeStartAndEndDate(eachChildRequest,request.due_date,request.start_date);
        }
        return [false,[]]

    }

    this.childChangeStartAndEndDate = async function (request,due_date,start_date){
        request.workflow_activity_id = request.workflow_activity_id ? request.workflow_activity_id : request.activity_id;
           await this.taskRelationTypesSet({...request,})
           await sleep(3000);
           let workflowActivityDetails1 = await activityCommonService.getActivityDetailsPromise(request, request.activity_id);
           
           let [err,childActivitiesArray]  =await  activityListSelectChildOrders({...request,parent_activity_id:request.activity_id,flag:8});
        for(let i=0 ; i < childActivitiesArray.length ; i++){
            if(Number(childActivitiesArray[i].activity_mapping_flag_is_prerequisite)==0){
                continue;
            }

            let eachChildRequest = childActivitiesArray[i];

            eachChildRequest.refrence_activity_id = request.activity_id;
            eachChildRequest.parent_activity_id = request.parent_activity_id;
            await this.childChangeStartAndEndDate(eachChildRequest,workflowActivityDetails1[0].activity_datetime_end_deferred,start_date);
        }
    }


    this.ghantChartStartAndDueDateUpdateV1 = async (request) => {
         
        let parentActivityDetails = await activityCommonService.getActivityDetailsPromise(request, request.start_end.project_activity_id);
        // let childActivityDetails = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);
        if(request.start_end){
            if(request.start_end.activity_id == request.workflow_activity_id) {
                let oldDateM = moment(parentActivityDetails[0].activity_datetime_end_deferred);
                let endDate = moment(request.start_end.end);
                // console.log(parentActivityDetails[0].activity_datetime_start_expected);
                
                    let parentDueDateReq = {...request};
                    parentDueDateReq.workflow_activity_id = request.start_end.project_activity_id;
                    parentDueDateReq.due_date = request.due_date;
                    parentDueDateReq.start_date = "";

                    await this.setDueDateV2(parentDueDateReq);
                
            }
        }
        await this.setDueDateV2(request);
        let [err,childActivitiesArray] = await activityListSelectChildOrders({...request,parent_activity_id:request.workflow_activity_id,flag:8});
        // console.log(childActivitiesArray)
        for(let i=0 ; i < childActivitiesArray.length ; i++){
            if(Number(childActivitiesArray[i].activity_mapping_flag_is_prerequisite)==0){
                continue;
            }
            let eachChildRequest = childActivitiesArray[i];
            eachChildRequest.workflow_activity_id = eachChildRequest.activity_id;
            eachChildRequest.refrence_activity_id = request.workflow_activity_id;
            eachChildRequest.parent_activity_id = request.parent_activity_id;
            await this.childChangeStartAndEndDate(eachChildRequest,request.due_date,request.start_date);
        }
        return [false,[]]
    }

    this.taskRelationTypesSet = async function (req){
        // console.log('came in ',req)
		switch (Number(req.activity_mapping_flag_is_prerequisite)) {
			case 1:
			  this.fsRelation(req);
			  break;
			case 2:
			  this.sfRelation(req);
			  break;
			case 3:
			  this.ffRelation(req);
			  break;
			case 4:
			  this.ssRelation(req);
		  }
	}

	this.fsRelation = async function (request){
        console.log('here i am')
		let parentActivity_id = request.parent_activity_id;
		let activityReferenceId = request.refrence_activity_id;
		let workflowActivityDetails = await activityCommonService.getActivityDetailsPromise(request, activityReferenceId);
		let workflowActivityDetails1 = await activityCommonService.getActivityDetailsPromise(request, request.activity_id);
		
		let [act_act_err,activity_activityList] = await activityCommonService.activityActivityMappingSelect({...request,parent_activity_id:request.refrence_activity_id,flag:1});
		let ghantt_config = typeof activity_activityList[0].activity_inline_data == 'string'?JSON.parse(activity_activityList[0].activity_inline_data):activity_activityList[0].activity_inline_data;
		let offsetDays = ghantt_config && ghantt_config.hasOwnProperty('offset_time')?Number(ghantt_config.offset_time):0;
		let startDatePrev = moment(workflowActivityDetails1[0].activity_datetime_start_expected);
                let endDatePrev = moment(workflowActivityDetails1[0].activity_datetime_end_deferred);
                let daystoAdd = endDatePrev.diff(startDatePrev,'days');
                console.log('days',daystoAdd);
                console.log("offsetDays ",offsetDays)
                let endDate = util.addDays(workflowActivityDetails[0].activity_datetime_end_deferred, daystoAdd+offsetDays);
				let startDate = util.addDays(workflowActivityDetails[0].activity_datetime_end_deferred, offsetDays)
				let workflowActivityDetails2 = await activityCommonService.getActivityDetailsPromise(request, parentActivity_id);
				let dueDateParent = moment(workflowActivityDetails2[0].activity_datetime_end_deferred);
				console.log(endDate,"end date")
		const changeParentDueDate = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {...request,workflow_activity_id:request.activity_id,start_date:startDate,due_date:endDate,set_flag:1,single_req:1};
		console.log(endDate,"end date");
		console.log('ddd',dueDateParent)
		console.log(dueDateParent.diff(endDate));
		
		if (dueDateParent.diff(endDate) < 0) {
      const makeRequestOptions1 = {
          ...request,
          workflow_activity_id: parentActivity_id,
          start_date: "",
          due_date: endDate,
          set_flag: 2,
          single_req:1
      };
      try {
          console.log('came here too')
        // global.config.mobileBaseUrl + global.config.version
        await this.ghantChartStartAndDueDateUpdate(makeRequestOptions1);
        // const response = await changeParentDueDate(global.config.mobileBaseUrl + global.config.version + '/bot/set/parent/child/due/date/v1', makeRequestOptions1);
      } catch (err2) {
      }
    }

    try {
      // global.config.mobileBaseUrl + global.config.version
      this.ghantChartStartAndDueDateUpdate(makeRequestOptions);
      // const response = await changeParentDueDate(global.config.mobileBaseUrl + global.config.version + '/bot/set/parent/child/due/date/v1', makeRequestOptions);
    } catch (err1) {}
	}
	this.sfRelation = async function (request){
		let parentActivity_id = request.parent_activity_id;
		let activityReferenceId = request.refrence_activity_id;
		let workflowActivityDetails = await activityCommonService.getActivityDetailsPromise(request, activityReferenceId);
		let workflowActivityDetails1 = await activityCommonService.getActivityDetailsPromise(request, request.activity_id);
        let [act_act_err,activity_activityList] = await activityCommonService.activityActivityMappingSelect({...request,parent_activity_id:request.refrence_activity_id,flag:1});
		let ghantt_config = typeof activity_activityList[0].activity_inline_data == 'string'?JSON.parse(activity_activityList[0].activity_inline_data):activity_activityList[0].activity_inline_data;
		let offsetDays = ghantt_config && ghantt_config.hasOwnProperty('offset_time')?Number(ghantt_config.offset_time):0;
		let startDatePrev = moment(workflowActivityDetails1[0].activity_datetime_start_expected);
                let endDatePrev = moment(workflowActivityDetails1[0].activity_datetime_end_deferred);
                let daystoAdd = endDatePrev.diff(startDatePrev,'days');
                console.log('days',daystoAdd);
                console.log("offsetDays ",offsetDays)
                // let endDate = util.addDays(workflowActivityDetails[0].activity_datetime_end_deferred, daystoAdd);
				let endDate = util.subtractDays(workflowActivityDetails[0].activity_datetime_start_expected,offsetDays);
				let startDate = util.subtractDays(workflowActivityDetails[0].activity_datetime_start_expected,daystoAdd+offsetDays);
				let startDateM = moment(startDate);
				let workflowActivityDetails2 = await activityCommonService.getActivityDetailsPromise(request, parentActivity_id);
				let startDateParent = moment(workflowActivityDetails2[0].activity_datetime_start_expected);
				console.log(endDate,"end date")
		const changeParentDueDate = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form:{...request,workflow_activity_id:request.activity_id,start_date:startDate,due_date:endDate,set_flag:1,single_req:1}
        };
		// console.log(endDate,"end date");
		// console.log('ddd',dueDateParent)
		console.log(startDateParent.diff(startDate));
		if(startDateM.diff(startDateParent)<0){
			const makeRequestOptions1 = {
				form:{...request,workflow_activity_id:parentActivity_id,start_date:startDate,due_date:workflowActivityDetails2[0].activity_datetime_end_deferred,set_flag:2,single_req:1}
			};
			try {
                // global.config.mobileBaseUrl + global.config.version
                this.ghantChartStartAndDueDateUpdate(makeRequestOptions1.form);
                // const response = await changeParentDueDate(global.config.mobileBaseUrl + global.config.version + '/bot/set/parent/child/due/date/v1', makeRequestOptions1);
              } catch (err2) {}
            }
        
            try {
              // global.config.mobileBaseUrl + global.config.version
              this.ghantChartStartAndDueDateUpdate(makeRequestOptions.form);
              // const response = await changeParentDueDate(global.config.mobileBaseUrl + global.config.version + '/bot/set/parent/child/due/date/v1', makeRequestOptions);
            } catch (err1) {}
		
	}
	this.ffRelation = async function (request){
		let parentActivity_id = request.parent_activity_id;
		let activityReferenceId = request.refrence_activity_id;
		let workflowActivityDetails = await activityCommonService.getActivityDetailsPromise(request, activityReferenceId);
		let workflowActivityDetails1 = await activityCommonService.getActivityDetailsPromise(request, request.activity_id);
        let [act_act_err,activity_activityList] = await activityCommonService.activityActivityMappingSelect({...request,parent_activity_id:request.refrence_activity_id,flag:1});
		let ghantt_config = typeof activity_activityList[0].activity_inline_data == 'string'?JSON.parse(activity_activityList[0].activity_inline_data):activity_activityList[0].activity_inline_data;
		let offsetDays = ghantt_config && ghantt_config.hasOwnProperty('offset_time')?Number(ghantt_config.offset_time):0;
		let startDatePrev = moment(workflowActivityDetails1[0].activity_datetime_start_expected);
        let endDatePrev = moment(workflowActivityDetails1[0].activity_datetime_end_deferred);
        let daystoAdd = endDatePrev.diff(startDatePrev, "days");
        console.log("days", daystoAdd);
        console.log("offsetDays ",offsetDays)
        let endDate = util.subtractDays(workflowActivityDetails[0].activity_datetime_end_deferred,daystoAdd+offsetDays);
        let startDate = util.subtractDays(workflowActivityDetails[0].activity_datetime_end_deferred,daystoAdd+offsetDays);
		// let startDate = workflowActivityDetails[0].activity_datetime_start_expected;
		const changeParentDueDate = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form:{...request,workflow_activity_id:request.activity_id,start_date:startDate,due_date:endDate,set_flag:1,single_req:1}
        };
    
        try {
          // global.config.mobileBaseUrl + global.config.version
          this.ghantChartStartAndDueDateUpdate(makeRequestOptions.form);
          // const response = await changeParentDueDate(global.config.mobileBaseUrl + global.config.version + '/bot/set/parent/child/due/date/v1', makeRequestOptions);
        } catch (err1) {}
	}
	this.ssRelation = async function (request){
		let parentActivity_id = request.parent_activity_id;
		let activityReferenceId = request.refrence_activity_id;
		let workflowActivityDetails = await activityCommonService.getActivityDetailsPromise(request, activityReferenceId);
		let workflowActivityDetails1 = await activityCommonService.getActivityDetailsPromise(request, request.activity_id);
        let [act_act_err,activity_activityList] = await activityCommonService.activityActivityMappingSelect({...request,parent_activity_id:request.refrence_activity_id,flag:1});
		let ghantt_config = typeof activity_activityList[0].activity_inline_data == 'string'?JSON.parse(activity_activityList[0].activity_inline_data):activity_activityList[0].activity_inline_data;
		let offsetDays = ghantt_config && ghantt_config.hasOwnProperty('offset_time')?Number(ghantt_config.offset_time):0;
		let startDatePrev = moment(workflowActivityDetails1[0].activity_datetime_start_expected);
        let endDatePrev = moment(workflowActivityDetails1[0].activity_datetime_end_deferred);
        let daystoAdd = endDatePrev.diff(startDatePrev, "days");
        console.log("days", daystoAdd);
        console.log("offsetDays ",offsetDays)
        let endDate = util.addDays(workflowActivityDetails[0].activity_datetime_start_expected,daystoAdd+offsetDays);
		let startDate = util.addDays(workflowActivityDetails[0].activity_datetime_start_expected,offsetDays);
		let workflowActivityDetails2 = await activityCommonService.getActivityDetailsPromise(request, parentActivity_id);
		let dueDateParent = moment(workflowActivityDetails2[0].activity_datetime_end_deferred);
		const changeParentDueDate = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form:{...request,workflow_activity_id:request.activity_id,start_date:startDate,due_date:endDate,set_flag:1,single_req:1}
        };
		if(dueDateParent.diff(endDate)<0){
			const makeRequestOptions1 = {
				form:{...request,workflow_activity_id:parentActivity_id,start_date:"",due_date:endDate,set_flag:2,single_req:1}
			};
			try {
                // global.config.mobileBaseUrl + global.config.version
                this.ghantChartStartAndDueDateUpdate(makeRequestOptions1.form);
                // const response = await changeParentDueDate(global.config.mobileBaseUrl + global.config.version + '/bot/set/parent/child/due/date/v1', makeRequestOptions1);
              } catch (err2) {}
            }
        
            try {
              // global.config.mobileBaseUrl + global.config.version
              this.ghantChartStartAndDueDateUpdate(makeRequestOptions.form);
              // const response = await changeParentDueDate(global.config.mobileBaseUrl + global.config.version + '/bot/set/parent/child/due/date/v1', makeRequestOptions);
            } catch (err1) {}

	}


    this.setDueDateV2 = async function (request){
            let activity_id = request.workflow_activity_id;
            let workflowActivityDetails = await activityCommonService.getActivityDetailsPromise(request, activity_id);
           
            // console.log("came here")
            // return
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
                activityCoverData.duedate.old = workflowActivityDetails[0].activity_datetime_end_deferred;
                activityCoverData.duedate.new = request.due_date;
            if(request.start_date != ""){
                activityCoverData.start_date = {};
                activityCoverData.start_date.old = workflowActivityDetails[0].activity_datetime_start_expected;
                activityCoverData.start_date.new = request.start_date;
            }
            
            console.log(activityCoverData)
        try{
            newReq.activity_cover_data = JSON.stringify(activityCoverData);
        } catch(err) {
            util.logError(request,`Error`, { type: 'bot_engine', err });
        }
        
        newReq.asset_id = 100;
        newReq.creator_asset_id = Number(request.asset_id);
        newReq.activity_id = request.workflow_activity_id;
        // flag = 0;
        const event = {
            name: "alterActivityCover",
            service: "activityUpdateService",
            method: "alterActivityCover",
            payload: newReq
        };
       
        // activityUpdateService.alterActivityCover(newReq,()=>{});
        await queueWrapper.raiseActivityEventPromise(event, request.workflow_activity_id);

            let assetDetails = await getAssetDetails({
                "organization_id": request.organization_id,
                "asset_id": request.asset_id
            });

            let assetName = (assetDetails.length > 0) ? assetDetails[0].operating_asset_first_name : 'Bot';
            let status_dueDate = false;
            let content = `Due date changed from ${moment(workflowActivityDetails[0].activity_datetime_end_deferred).format('Do MMMM YYYY, h:mm a')} to ${moment(request.due_date).format('Do MMMM YYYY, h:mm a')} by ${assetName}`;
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
                timelineReq.timeline_stream_type_id= 734;
                timelineReq.activity_stream_type_id= 734;
                timelineReq.timeline_transaction_datetime = util.getCurrentUTCTime();
                timelineReq.track_gps_datetime = timelineReq.timeline_transaction_datetime;
                timelineReq.datetime_log = timelineReq.timeline_transaction_datetime;
                timelineReq.message_unique_id = util.getMessageUniqueId(100);
                timelineReq.form_date = workflowActivityDetails[0].activity_datetime_end_deferred;
                timelineReq.to_date = request.due_date;
                //timelineReq.device_os_id = 10; //Do not trigger Bots

            timelineReq.activity_id = Number(request.workflow_activity_id);
            const event1 = {
                name: "addTimelineTransaction",
                service: "activityTimelineService",                
                method: "addTimelineTransactionAsync",                
                payload: timelineReq
            };
            // activityTimelineService.addTimelineTransactionAsync(timelineReq);
            await queueWrapper.raiseActivityEventPromise(event1, request.workflow_activity_id);
          return [false,[]]
    }
    
    async function checkParentActivityDueDate(request,child_activity_id,newDate){
        let responseReturn = true;
        let workflowActivityDetails = await activityCommonService.getActivityDetailsPromise(request, child_activity_id);
        if(Number(workflowActivityDetails[0].parent_activity_id) === 0){
            return responseReturn;
        }
        // let parentWorkflowActivityDetails = await activityCommonService.getActivityDetailsPromise(request, workflowActivityDetails[0].parent_activity_id);
        // let childEndDate = moment(newDate);
        // let parentEndDate = moment(parentWorkflowActivityDetails[0].activity_datetime_end_deferred);
        // if(parentEndDate.diff(childEndDate)>=0){
        //     return responseReturn;
        // }
        // else {
        //     return true;
        // }
        return responseReturn;

    }

    this.smeGemification = async (request, bot_inline) => {
        
      util.logInfo(request,`in smeGamification : %j`);
      let activity_inline_data = {};
      if(request.hasOwnProperty('activity_inline_data')){
      activity_inline_data = typeof request.activity_inline_data =="string"?JSON.parse(request.activity_inline_data):request.activity_inline_data;
      }
      else{
        const formTimelineData = await activityCommonService.getActivityTimelineTransactionByFormId713({
            organization_id: request.organization_id,
            account_id: request.account_id
        }, request.workflow_activity_id, request.form_id);
        if(formTimelineData.length>0){
            let inlineExtract = JSON.parse(formTimelineData[0].data_entity_inline);
            activity_inline_data = typeof inlineExtract.form_submitted == 'string' ? JSON.parse(inlineExtract.form_submitted):inlineExtract.form_submitted;
        }
      }
      //field edit request
      [activity_inline_data,totalFormScore] = await fieldMappingGamification(request,activity_inline_data);
      
      util.logInfo(request,`in is_from_field_alter : %j`,request.is_from_field_alter);
      util.logInfo(request,`in is_refill : %j`,request.is_refill);
      util.logInfo(request,`in is_resubmit : %j`,request.is_resubmit);

      if (request.is_from_field_alter==1) {
        let [err,gamificationScore] = await getFormGamificationScore(request,0);
        util.logInfo(request,`previous gemification score length : %j`,gamificationScore.length);
        if(gamificationScore.length>0){
            let previousScore = Number(gamificationScore[0].field_gamification_score_value);
            if(previousScore == 0 || previousScore == null){
                return;
            }
            let finalScore = await gamificationCountForInlineData(request,activity_inline_data,previousScore,1);
            
            request.field_gamification_score = finalScore;
            util.logInfo(request,`final score : %j`,finalScore);
            let [err1,gamificationScoreMonthly] = await getFormGamificationScore(request,2);
            let [err2,gamificationScoreOverall] = await getFormGamificationScore(request,3);
            let previousScoreOverall = Number(gamificationScoreOverall[0].field_gamification_score_value);
            let previousScoreMonthly = Number(gamificationScoreMonthly[0].field_gamification_score_value);
            let previousFormScoreOverall = gamificationScoreOverall.length>0?Number(gamificationScoreOverall[0].form_gamification_score_value):0;
            let previousFormScoreMonthly = gamificationScoreMonthly.length>0?Number(gamificationScoreMonthly[0].form_gamification_score_value):0;
            let previousSubmissionsScoreOverall = gamificationScoreOverall.length>0?Number(gamificationScoreOverall[0].No_of_submissions):0;
            let previousSubmissionsScoreMonthly = gamificationScoreMonthly.length>0?Number(gamificationScoreMonthly[0].No_of_submissions):0;
            await updateGamificationScore(request,3);
            await assetSummaryTransactionInsert(request,previousScoreOverall+Math.abs(previousScore-finalScore),previousFormScoreOverall,previousSubmissionsScoreOverall);
            await assetMonthlySummaryTransactionInsert(request,previousScoreMonthly+Math.abs(previousScore-finalScore),previousFormScoreMonthly,previousSubmissionsScoreMonthly)
        }
        
      } //resubmit or refill case
      else if (Number(request.is_refill) === 1 || Number(request.is_resubmit) === 1) {
        request.field_gamification_score = 0;
        await updateGamificationScore(request,request.is_refill === 1?1:2);
      } //new form submission case
      else {
        util.logInfo(request,`new entry : %j`);
        let finalScore = await gamificationCountForInlineData(request,activity_inline_data,0,0);
        request.field_gamification_score = finalScore;
        util.logInfo(request,`final score : %j`,finalScore);
        util.logInfo(request,`final score inserting into asset summary table: %j`,finalScore);
        let [err1,gamificationScoreMonthly] = await getFormGamificationScore(request,2);
            let [err2,gamificationScoreOverall] = await getFormGamificationScore(request,3);
            let previousScoreOverall = gamificationScoreOverall.length>0?Number(gamificationScoreOverall[0].field_gamification_score_value):0;
            let previousScoreMonthly = gamificationScoreMonthly.length>0?Number(gamificationScoreMonthly[0].field_gamification_score_value):0;
            console.log("final overall prev",previousScoreOverall)
            console.log("final overall",previousScoreOverall+finalScore);
            console.log("montly overall prev",previousScoreMonthly);
            console.log("montly overall final",previousScoreMonthly + finalScore);
            await insertGamificationScore(request);
            let [err3,gamificationScoreMonthly1] = await getFormGamificationScore(request,2);
            let [err4,gamificationScoreOverall1] = await getFormGamificationScore(request,3);
            let previousFormScoreOverall = gamificationScoreOverall1.length>0?Number(gamificationScoreOverall1[0].form_gamification_score_value):0;
            let previousFormScoreMonthly = gamificationScoreMonthly1.length>0?Number(gamificationScoreMonthly1[0].form_gamification_score_value):0;
            let previousSubmissionsScoreOverall = gamificationScoreOverall1.length>0?Number(gamificationScoreOverall1[0].No_of_submissions):0;
            let previousSubmissionsScoreMonthly = gamificationScoreMonthly1.length>0?Number(gamificationScoreMonthly1[0].No_of_submissions):0;
            await assetSummaryTransactionInsert(request,previousScoreOverall+finalScore,previousFormScoreOverall,previousSubmissionsScoreOverall);
            await assetMonthlySummaryTransactionInsert(request,previousScoreMonthly+finalScore,previousFormScoreMonthly,previousSubmissionsScoreMonthly);
      }
    };

    async function gamificationCountForInlineData(request,inline_data,gamification_score,is_edit){
        
        for await (const eachField of inline_data) {
            if(is_edit==1){
              let [err,data] =await formFieldsHistory({...request,field_id:eachField.field_id});
              if(data.length>1){
                  continue;
              }
            }
            if(!eachField.field_value || eachField.field_value==""){
                continue;
            }
            
            gamification_score = gamification_score + Number(eachField.field_gamification_score_value || 0);
            
        }
        return gamification_score
    }

    async function getFormGamificationScore(request,flag) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            flag,
            request.workflow_activity_id,
            request.form_id,
            request.form_transaction_id,
            request.asset_id == 100?request.auth_asset_id:request.asset_id,
            util.getStartDayOfMonth(),
            util.getEndDateOfMonth(),
            request.start_from || 0, 
            request.limit_value || 10
        );
        const queryString = util.getQueryString('ds_v1_asset_gamification_transaction_select', paramsArr);


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
    }

    async function assetSummaryTransactionInsert(request,score,formScore,noOfSubmissions) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
        7, 
		request.asset_id == 100?request.auth_asset_id:request.asset_id, 
		request.workforce_id, 
		request.account_id, 
		request.organization_id, 
		request.inline_data || '{}', 
        request.entity_date_1 || '', 
        request.entity_datetime_1 || '', 
        request.entity_tinyint_1 || '', 
        score,
        formScore,
        noOfSubmissions,
        request.entity_double_1 || '', 
        request.entity_decimal_1 || '', 
        request.entity_decimal_2 || '', 
        request.entity_decimal_3 || '', 
        request.entity_text_1 || '', 
        request.entity_text_2 || '', 
        request.location_latitude || '', 
        request.location_longitude || '', 
        request.location_gps_accuracy || '', 
        request.location_gps_enabled || '', 
        request.location_address || '', 
        request.location_datetime || '', 
        request.device_manufacturer_name || '', 
        request.device_model_name || '', 
        request.device_os_id || 5, 
        request.device_os_name || '', 
        request.device_os_version || '', 
        request.device_app_version || '', 
        request.device_api_version || '', 
        request.log_asset_id || '', 
        request.log_message_unique_id || '', 
        request.log_retry || '', 
        request.log_offline || '', 
        request.transaction_datetime || '', 
        util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_1_asset_summary_transaction_insert', paramsArr);


        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    }

    async function assetMonthlySummaryTransactionInsert(request,score,formScore,noOfSubmissions) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          41,
          request.asset_id == 100?request.auth_asset_id:request.asset_id,
          request.workforce_id || "",
          request.account_id || "",
          request.organization_id || "",
          util.getStartDayOfMonth(),
          util.getStartDateTimeOfMonth(),
          request.entity_tinyint_1 || "",
          score,
          formScore,
          noOfSubmissions,
          request.entity_double_1 || "",
          request.entity_decimal_1 || "",
          request.entity_decimal_2 || "",
          request.entity_decimal_3 || "",
          request.entity_text_1 || "",
          request.entity_text_2 || "",
          request.location_latitude || "",
          request.location_longitude || "",
          request.location_gps_accuracy || "",
          request.location_gps_enabled || "",
          request.location_address || "",
          request.location_datetime || "",
          request.device_manufacturer_name || "",
          request.device_model_name || "",
          request.device_os_id || "",
          request.device_os_name || "",
          request.device_os_version || "",
          request.device_app_version || "",
          request.device_api_version || "",
          request.log_asset_id || "",
          request.log_message_unique_id || "",
          request.log_retry || "",
          request.log_offline || "",
          request.transaction_datetime || "",
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_1_asset_monthly_summary_transaction_insert', paramsArr);


        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    }

    async function insertGamificationScore(request) {
      let responseData = [],
        error = true;

      const paramsArr = new Array(
        request.organization_id,
        request.form_transaction_id,
        util.getCurrentUTCTime(),
        request.form_id,
        request.form_name || "",
        request.field_gamification_score,
        request.workflow_activity_id,
        request.asset_id == 100?request.auth_asset_id:request.asset_id,
        request.asset_id,
        util.getCurrentUTCTime()
      );
      const queryString = util.getQueryString(
        "ds_v1_asset_gamification_transaction_insert",
        paramsArr
      );

      if (queryString !== "") {
        await db
          .executeQueryPromise(0, queryString, request)
          .then((data) => {
            responseData = data;
            error = false;
          })
          .catch((err) => {
            error = err;
          });
      }
      return [error, responseData];
    }  
    
    async function updateGamificationScore(request,flag) {
      let responseData = [],
        error = true;

      const paramsArr = new Array(
        request.workflow_activity_id,
        request.form_id,
        request.form_transaction_id,
        request.asset_id == 100?request.auth_asset_id:request.asset_id,
        flag,
        request.field_gamification_score,
        util.getCurrentUTCTime()
      );
      const queryString = util.getQueryString(
        "ds_v1_asset_gamification_transaction_update_score",
        paramsArr
      );

      if (queryString !== "") {
        await db
          .executeQueryPromise(0, queryString, request)
          .then((data) => {
            responseData = data;
            error = false;
          })
          .catch((err) => {
            error = err;
          });
      }
      return [error, responseData];
    }

    this.removeDueDateOfWorkflow = async(request, dueDateEdit) => {

        let responseData = [],
            error = false,
            oldDate,
            newDate = null;

        
            let paramsArr = new Array(
                request.workflow_activity_id,
                request.organization_id,
                request.asset_id,
                util.getCurrentUTCTime()
            );
    
            let queryString = util.getQueryString('ds_v1_activity_list_delete_deferred_datetime', paramsArr);
            if (queryString !== '') {
                await db.executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    });
            }
            let assetDetails = await getAssetDetails({
                "organization_id": request.organization_id,
                "asset_id": request.asset_id
            });

            let assetName = (assetDetails.length > 0) ? assetDetails[0].operating_asset_first_name : 'Bot';

            let content = `Due date removed by ${assetName}`;
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
                timelineReq.timeline_stream_type_id= 734;
                timelineReq.activity_stream_type_id= 734;
                timelineReq.timeline_transaction_datetime = util.getCurrentUTCTime();
                timelineReq.track_gps_datetime = timelineReq.timeline_transaction_datetime;
                timelineReq.datetime_log = timelineReq.timeline_transaction_datetime;
                timelineReq.message_unique_id = util.getMessageUniqueId(100);
                timelineReq.form_date = oldDate;
                timelineReq.to_date = newDate;
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

        let queryString = util.getQueryString('ds_p1_1_bot_operation_mapping_select_operation_type', paramsArr);
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
                    util.logInfo(request,`responseData : %j` , responseData);
                    return [true, responseData];
                }

                //console.log('formDataFrom713Entry[0] : ', formDataFrom713Entry[0]);
                let formTransactionInlineData = JSON.parse(formDataFrom713Entry[0].data_entity_inline);
                util.logInfo(request,`formTransactionInlineData form_submitted: %j` , formTransactionInlineData.form_submitted);
                let formData = formTransactionInlineData.form_submitted;
                formData = (typeof formData === 'string')? JSON.parse(formData) : formData;

                for(const j_iterator of formData) {
                    if(Number(i_iterator.field_id) === Number(j_iterator.field_id)) {
                        if(util.replaceDefaultString(j_iterator.field_value) === '') {
                            responseData.push({'message': `${j_iterator.field_value} is empty`});
                            util.logInfo(request,`responseData : %j` , responseData);
                            return [true, responseData];
                        }
                        util.logInfo(request,`field_value : %j` , j_iterator.field_value);
                        i_iterator.field_value = j_iterator.field_value;
                    }
                } //End of checking for non-empty field_value                    
            } //ELSE       
            
        } //End of processing all form fields in the bot operation inline

        util.logInfo(request,`sortedfieldsData : %j` , sortedfieldsData);
        util.logInfo(request,`sortedfieldsData[0] : %j` , sortedfieldsData[0]);
        let finalResult = sortedfieldsData[0].field_value;
        for(let i=0; i<sortedfieldsData.length;i++){
            util.logInfo(request,`sortedfieldsData[i].join_condition : %j` , sortedfieldsData[i].join_condition);
            if(sortedfieldsData[i].join_condition === 'EOJ') {
                break;
            }

            util.logInfo(request,`sortedfieldsData[i+1].field_value : %j` , sortedfieldsData[i+1].field_value);
            finalResult = await performArithmeticOperation(finalResult, sortedfieldsData[i+1].field_value, sortedfieldsData[i].join_condition);
            util.logInfo(request,`finalResult : %j` , finalResult);
        }

        //Update in the target form and field Id
        let newReq = Object.assign({}, request);
            newReq.form_id = arithmeticCalculation.target_form_id;
            newReq.field_id = arithmeticCalculation.target_field_id;
        let formDataFrom713Entry = await getFormInlineData(newReq, 1);
        let formData = await getFormInlineData(newReq, 2);

        util.logInfo(request,`formDataFrom713Entry: %j` , formDataFrom713Entry);
        util.logInfo(request,` `);
        util.logInfo(request,`formData: %j` , formData);
        
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
            util.logError(request,`copyFields | alterFormActivityFieldValues | Error: `, { type: 'bot_engine', error });
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
            util.logError(request,`Unable to get the date field : `, { type: 'bot_engine', err });
        }
        
        util.logInfo(request,`Retrieved Date field value : %j` , dateFieldValue);
        if(Number(request.device_os_id) === 1) {
            dateFieldValue = util.getFormatedLogDatetimeV1(dateFieldValue, "DD-MM-YYYY HH:mm:ss");
            util.logInfo(request,`Retrieved Date field value - ANDROiD: %j` , dateFieldValue);
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
                            util.logInfo(request,`---------- TIMELINE ENTRY -----------`);
                            try{
                                let tempVar = { date_reminder: dateReminder };
                                let newReq = Object.assign({}, request);
                                    newReq.inline_data = JSON.stringify(tempVar);                                    
                                await activityCommonService.activityReminderTxnInsert(newReq, 1, reminderDatetime);
                            } catch(err) {
                                util.logError(request,`Reminder Bot - Error in updating Timeline in TXN Table: `, { type: 'bot_engine', err });
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
                                    util.logError(request,`Reminder Bot - Error in updating Participant in TXN Table: `, { type: 'bot_engine', err });
                                }
                                break;

            case 'email': //Send an email reminder
                                try{                                    
                                   let tempVar = { date_reminder:  dateReminder };       
                                   let newReq = Object.assign({}, request);
                                       newReq.inline_data = JSON.stringify(tempVar);       
                                   await activityCommonService.activityReminderTxnInsert(newReq, 3, reminderDatetime);
                                } catch(err) {
                                   util.logError(request,`Reminder Bot - Error in updating Email in TXN Table: `, { type: 'bot_engine', err });
                                }
                                 break;

            case 'text': //Send a text(sms) reminder   
                        try{                           
                            let tempVar = { date_reminder:  dateReminder };
                            let newReq = Object.assign({}, request);
                                newReq.inline_data = JSON.stringify(tempVar);
                            await activityCommonService.activityReminderTxnInsert(newReq, 4, reminderDatetime);
                        } catch(err) {
                            util.logError(request,`Reminder Bot - Error in updating Text in TXN Table: `, { type: 'bot_engine', err });
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
            responseData.push({'message': `${request.form_id} is not submitted`});
            util.logInfo(request,`responseData : %j` , responseData);
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

        util.logInfo(request,`reminderBotData : %j` , reminderBotData);        
        
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
                        util.logInfo(request,`---------- TIMELINE ENTRY -----------`);
                        await addTimelineEntry(i_iterator,0);
                        break;

                case 2: //Add Participant     
                        util.logInfo(request,`---------- PARTICIPANT -----------`);                 
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
                            util.logInfo(request,`---------- EMAIL -----------`);
                        } else if(Number(i_iterator.reminder_type_id) === 4) {
                            util.logInfo(request,`---------- TEXT -----------`);
                        }
                        activityData = await activityCommonService.getActivityDetailsPromise({ organization_id: i_iterator.organization_id }, 
                                                                                       i_iterator.activity_id);
                        
                        //console.log('activityData : ', activityData);
                        util.logInfo(request,`inlineData : %j` , inlineData);
                        util.logInfo(request,`inlineData.escalation_target : %j` , dateReminder.escalation_target);
                        //Get the lead email ID
                        if(dateReminder.escalation_target === 'creator') {
                            assetID = activityData[0].activity_creator_asset_id;

                            assetDetails = await getAssetDetails({
                                "organization_id": i_iterator.organization_id,
                                "asset_id": assetID
                            });
                            if(assetDetails.length==0){
                                continue
                            }

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
if(assetDetails.length==0){
    continue
}
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
                                util.logInfo(request,`Manager Asset ID : ${managerAssetID}`);

                                assetDetails = await getAssetDetails({
                                    "organization_id": i_iterator.organization_id,
                                    "asset_id": managerAssetID
                                });
                                if(assetDetails.length==0){
                                    continue
                                }
                                
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
                                if(assetDetails.length==0){
                                    continue
                                }

                                managerAssetID = Number(assetDetails[0].manager_asset_id);
                                util.logInfo(request,`Manager Asset ID : ${managerAssetID}`);

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
                            util.logInfo(request,`Phone Number with country code : ${textPhCtyCode} ${textPhNo}`);
                            
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
            
            util.logInfo(request,` `);
            util.logInfo(request,`********************************************************`);
            util.logInfo(request,` `);
        } //End of For Loop

        if(reminderBotData.length === 50) {
            startFrom = startFrom + 50; 
            await reminderBotExecutionFn(request, startFrom);
        }

        return [error, responseData];
    }

    this.callAddTimelineEntry = async(request) => {        
        await addTimelineEntry(request, 2);
        return [false, []];
    }
    
    async function addTimelineEntry(request, flag,attachment = []) {
        
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
                "attachments": attachment
            });
           
            addCommentRequest.activity_stream_type_id = 325;
            addCommentRequest.timeline_stream_type_id = 325;
            
            
        }
        else if(flag === 2) {
            addCommentRequest.activity_timeline_collection = JSON.stringify({
                "content": request.content,
                "subject": request.subject,
                "mail_body": request.mail_body,
                "attachments": attachment
            });
           
            addCommentRequest.activity_stream_type_id = request.timeline_stream_type_id;
            addCommentRequest.timeline_stream_type_id = request.timeline_stream_type_id;
            
            
        }
        else {
            let reminder_inline_data = request.reminder_inline_data?JSON.parse(request.reminder_inline_data):{};
            if(reminder_inline_data.hasOwnProperty('date_reminder')){
                if(reminder_inline_data.date_reminder.hasOwnProperty("message_template")&&reminder_inline_data.date_reminder.message_template!=""){
                    let message_template = reminder_inline_data.date_reminder.message_template;
                    util.logInfo(request,`message template %j` , message_template);
                    util.logInfo(request,`req %j` , request);
                    // let message_template_textArr = message_template.split(" ");
                    const workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, request.activity_id);
if(workflowActivityData.length==0){
    return "success"
}
                    message_template = message_template.replace('<<title>>',request.activity_title?request.activity_title:"'NA'");
                    message_template = message_template.replace("<<cuid_1>>",workflowActivityData[0].activity_cuid_1?workflowActivityData[0].activity_cuid_1:"'NA'");
                    message_template = message_template.replace("<<cuid_2>>",workflowActivityData[0].activity_cuid_2?workflowActivityData[0].activity_cuid_2:"'NA'");
                    message_template = message_template.replace("<<cuid_3>>",workflowActivityData[0].activity_cuid_3?workflowActivityData[0].activity_cuid_3:"'NA'");
                    message_template = message_template.replace("<<creator_name>>",workflowActivityData[0].activity_creator_operating_asset_first_name?workflowActivityData[0].activity_creator_operating_asset_first_name:"'NA'");
                    message_template = message_template.replace("<<lead_name>>",workflowActivityData[0].activity_lead_operating_asset_first_name?workflowActivityData[0].activity_lead_operating_asset_first_name:"'NA'");
                    let dueDate = workflowActivityData[0].activity_datetime_end_deferred;
                    let dateObj = new Date(dueDate);
                    dueDate = `${moment(dateObj).format('ddd DD MMM YYYY')}`
                    message_template = message_template.replace("<<duedate>>",dueDate);
                    util.logInfo(request,`message template after %j` , message_template);
                    // console.log("array",message_template_textArr)
                    // for(let i=0;i<message_template_textArr.length;i++){
                    //     if(message_template_textArr[i]=="<<title>>"){
                            
                    //         message_template_textArr[i] = request.activity_title?request.activity_title:"'NA'";
                    //     }
                    //     if(message_template_textArr[i]=="<<cuid_1>>"){
                            
                    //         message_template_textArr[i] = workflowActivityData[0].activity_cuid_1?workflowActivityData[0].activity_cuid_1:"'NA'";
                    //     }
                    //     if(message_template_textArr[i]=="<<cuid_2>>"){
                            
                    //         message_template_textArr[i] = workflowActivityData[0].activity_cuid_2?workflowActivityData[0].activity_cuid_2:"'NA'";
                    //     }
                    //     if(message_template_textArr[i]=="<<cuid_3>>"){
                            
                    //         message_template_textArr[i] = workflowActivityData[0].activity_cuid_3?workflowActivityData[0].activity_cuid_3:"'NA'";
                    //     }
                    //     if(message_template_textArr[i]=="<<creator_name>>"){
                            
                    //         message_template_textArr[i] = workflowActivityData[0].activity_creator_operating_asset_first_name?workflowActivityData[0].activity_creator_operating_asset_first_name:"'NA'";
                    //     }
                    //     if(message_template_textArr[i]=="<<lead_name>>"){
                            
                    //         message_template_textArr[i] = workflowActivityData[0].activity_lead_operating_asset_first_name?workflowActivityData[0].activity_lead_operating_asset_first_name:"'NA'";
                    //     }
                        
                    // }
                    let messageToSend = message_template
                    addCommentRequest.activity_timeline_collection = JSON.stringify({
                        "content": `${messageToSend}`,
                        "subject": `${messageToSend}`,
                        "mail_body": `${messageToSend}`,
                        "attachments": []
                    });
                }
                else{
                addCommentRequest.activity_timeline_collection = JSON.stringify({
                    "content": `This is a scheduled reminder for the file - ${request.activity_title}`,
                    "subject": `This is a scheduled reminder for the file - ${request.activity_title}`,
                    "mail_body": `This is a scheduled reminder for the file - ${request.activity_title}`,
                    "attachments": []
                });
            }
            }

            
            addCommentRequest.activity_stream_type_id = 325;
            addCommentRequest.timeline_stream_type_id = 325;
        }
        const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);
    
        addCommentRequest.activity_timeline_text = "";
        addCommentRequest.activity_access_role_id = 27;
        addCommentRequest.operating_asset_first_name = defaultAssetName;
        addCommentRequest.datetime_log = util.getCurrentUTCTime();
        addCommentRequest.track_gps_datetime = util.getCurrentUTCTime();
        addCommentRequest.flag_timeline_entry = 1;
        addCommentRequest.log_asset_id = 100;
        addCommentRequest.message_unique_id = util.getMessageUniqueId(100);
        //addCommentRequest.attachment_type_id = 17;
        //addCommentRequest.attachment_type_name = path.basename(attachmentsList[0]);
        
        try {
            await activityTimelineService.timelineStandardCallsAsyncV1(addCommentRequest);        
        } catch (error) {
            util.logError(request,`Reminder Bot trigger - timeline entry failed : `, { type: 'bot_engine', error });
            //throw new Error(error);
        }

        return "success";
    }   
    
    
    async function unassignParticipantFunc(request, activityID, assetID) {
        util.logInfo(request,`Unassigning the participant!`);
        request.debug_info.push('Unassigning the participant!');

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

            util.logError(request,`removeParticipant | error: `, { type: 'bot_engine', error });
            request.debug_info.push("removeParticipant | error: "+ error);
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
        const checksForBulkUpload = vilBulkLOVs["checksForBulkUpload"];
        const formId = request.form_id || request.trigger_form_id || 0;
        const productTypeFromForm = vilBulkLOVs["product_fb_form_mapping"][String(formId)];
        const postingCircleFormMapping = vilBulkLOVs["posting_circle_mapping"];
        logger.silly("product selected: %j", productTypeFromForm);
        let workflowActivityID = Number(request.workflow_activity_id) || 0,
            workflowActivityCategoryTypeID = 0,
            workflowActivityTypeID = 0,
            bulkUploadFormTransactionID = 0,
            bulkUploadFormActivityID = 0,
            opportunityID = "",
            sqsQueueUrl = "",
            solutionDocumentUrl = "";
        let workflowActivityData;
        let workflowActivityCreatorAssetID = 0;

        const triggerFormID = request.trigger_form_id,
            triggerFormName = request.trigger_form_name,
            triggerFieldID = request.trigger_field_id,
            triggerFieldName = request.trigger_field_name,
            // Form and Field for getting the excel file's 
            bulkUploadFormID = botOperationInlineData.bulk_upload.form_id || 0,
            bulkUploadFieldID = botOperationInlineData.bulk_upload.field_id || 0,
            solutionDocumentFormID = botOperationInlineData.solution_document.form_id || 0,
            solutionDocumentFieldID = botOperationInlineData.solution_document.field_id || 0;

        switch (global.mode) {
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
            workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
            if (Number(workflowActivityData.length) > 0) {
                workflowActivityCategoryTypeID = Number(workflowActivityData[0].activity_type_category_id);
                workflowActivityTypeID = Number(workflowActivityData[0].activity_type_id);
                opportunityID = workflowActivityData[0].activity_cuid_1;
                workflowActivityCreatorAssetID = workflowActivityData[0].activity_owner_asset_id;
            }
        } catch (error) {
            util.logError(request, `No Workflow Data Found in DB`);
            throw new Error("No Workflow Data Found in DB");
        }

        if (workflowActivityID === 0 || workflowActivityTypeID === 0 || opportunityID === "") {
            util.logError(request, `Couldn't Fetch workflowActivityID or workflowActivityTypeID`);
            throw new Error("Couldn't Fetch workflowActivityID or workflowActivityTypeID");
        }

        if (bulkUploadFormID === 0 || bulkUploadFieldID === 0) {
            util.logError(request, `Form ID and field ID not defined to fetch excel for bulk upload`);
            throw new Error("Form ID and field ID not defined to fetch excel for bulk upload");
        }

        if (workflowActivityData[0].parent_activity_id !== 0 && workflowActivityData[0].parent_activity_id !== null) {
            await addTimelineMessage(
                {
                    activity_timeline_text: "Error",
                    organization_id: request.organization_id
                }, workflowActivityID || 0,
                {
                    subject: 'Errors found while parsing the bulk excel',
                    content: "Your request is not processed. Child Opportunity cannot be created on a child Opportunity.",
                    mail_body: "Your request is not processed. Child Opportunity cannot be created on a child Opportunity.",
                    attachments: []
                }
            );
            util.logError(request, `Your request is not processed. Child Opportunity cannot be created on a child Opportunity.`);
            return;
        }

        // let postingCircleFormID = postingCircleFormMapping[String(request.activity_type_id)].form_id;

        // const requestAssetDetails =
        // {
        //     asset_id: workflowActivityCreatorAssetID,
        //     organization_id: request.organization_id
        // };

        // let responseAssetDetails = await getAssetDetails(requestAssetDetails);
        // if(responseAssetDetails.length > 0 ) {
        //     if (responseAssetDetails[0].account_name.toLowerCase() === "red edge") {
        //         // Fetch the Posting Circle
        //         const postingCircleFormData = await activityCommonService.getActivityTimelineTransactionByFormId713({
        //             organization_id: request.organization_id,
        //             account_id: request.account_id
        //         }, workflowActivityID, postingCircleFormID);

        //         if (Number(postingCircleFormData.length) === 0) {
        //             await addTimelineMessage(
        //                 {
        //                     activity_timeline_text: "Error",
        //                     organization_id: request.organization_id
        //                 }, workflowActivityID || 0,
        //                 {
        //                     subject: 'Request cannot be processed',
        //                     content: `Please Submit the Form "Posting Circle (To Be Filled By Red Edge Users)" before Raising the Feasibility`,
        //                     mail_body: `Please Submit the Form "Posting Circle (To Be Filled By Red Edge Users)" before Raising the Feasibility`,
        //                     attachments: []
        //                 }
        //             );
        //             return;
        //         }

        //     }
        // }

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
            util.logError(request, `Form to bulk upload feasibility is not submitted`);
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
            util.logError(request, `Field to fetch the bulk upload excel file not submitted`);
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

        // const urlKey = `868/984/5648/35156/2020/12/103/1608140463463/OPP-V-002337-161220-_-004.xlsx`;
        // bulkUploadFieldData[0].data_entity_text_1 = `https://worlddesk-preprod-d20kggbr.s3.amazonaws.com/${urlKey}`;
        util.logInfo(request,`bulkUploadFieldData[0].data_entity_text_1: %j` , bulkUploadFieldData[0].data_entity_text_1);
        request.debug_info.push("bulkUploadFieldData[0].data_entity_text_1: " + bulkUploadFieldData[0].data_entity_text_1);
        const [xlsxDataBodyError, xlsxDataBody] = await util.getXlsxDataBodyFromS3Url(request, bulkUploadFieldData[0].data_entity_text_1);
        if (xlsxDataBodyError) {
            util.logError(request, `[BulkFeasibilityError]${xlsxDataBodyError}`);
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
            "SalesRemarks", "ReasonForCloning", "VendorName",
            "IsSecureRemoteVPNConnect"
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

        // Error containers
        let errorMessageForNonAscii = "Non Ascii Character(s) found in:\n";
        let errorMessageForMandatoryFieldsMissing = "Mandatory fields missing in:\n";
        let errorMessageForUnsupportedProductForSecondary = "\nUnsupported products for secondary found in:\n";
        let errorMessageForInvalidValue = "\nInvalid value(s) found in:\n";
        let errorMessageForCharLimitExceeded = "Characters limit exceeded in:\n";
        let errorMessageForInvalidProduct = "Invalid product selected in:\n";
        let errorMessageForInvalidEmailId = "Invalid Email ID entered in:\n";

        // Error flags
        let unsupportedProductForSecondaryFound = false;
        let mandatoryFieldsMissing = false;
        let nonAsciiErroFound = false;
        let invalidValueFound = false;
        let charlimitExceeded = false;
        let invalidProductSelected = false;
        let invalidEmailIdFound = false;


        for (let i = 2; i < childOpportunitiesArray.length; i++) {
            const childOpportunity = childOpportunitiesArray[i];
            // Non ASCII check
            for (const [key, value] of Object.entries(childOpportunity)) {
                let indexOfNonAscii = String(value).search(/[^ -~]+/g);
                if (indexOfNonAscii !== -1) {
                    nonAsciiErroFound = true;
                    errorMessageForNonAscii += `Row: ${i + 1} Column: ${key}\n`;
                }
            }

            // service type compatibility check for secondary
            let actionType = childOpportunity.actionType;
            let linkType = childOpportunity.LinkType;
            let serviceType = childOpportunity.ServiceType;
            let isLastMileOffNet = childOpportunity.IsLastMileOffNet || "";
            let vendorName = childOpportunity.VendorName || "";
            const LastMileOffNetVendor = childOpportunity.LastMileOffNetVendor || "";
            let lastMileName = childOpportunity.LastMileName || "";
            let rejectionRemarks = childOpportunity.RejectionRemarks || "";
            let reasonForCloning = childOpportunity.ReasonForCloning || "";

            if (productTypeFromForm !== serviceType) {
                invalidProductSelected = true;
                errorMessageForInvalidProduct += `Invalid Product "${serviceType}" selected instead of "${productTypeFromForm}" in Row ${i + 1}\n`;
            }

            if (linkType === "Secondary" && (serviceType === "SuperWiFi" || serviceType === "NPLC" || serviceType === "IPLC" || serviceType === "MPLS-L2")) {
                unsupportedProductForSecondaryFound = true;
                errorMessageForUnsupportedProductForSecondary += `Unsupported Product for secondary form found in Row ${i + 1}\n`;
            }

            // Mandatory check for secondary
            if (linkType === "Secondary" && isLastMileOffNet === "") {
                mandatoryFieldsMissing = true;
                errorMessageForMandatoryFieldsMissing += `isLastMileOffNet is empty in Row ${i + 1}.\n`;
            }

            // Mandatory check for secondary
            if (linkType === "Secondary" && String(isLastMileOffNet).toLowerCase() === "yes" && LastMileOffNetVendor === "") {
                mandatoryFieldsMissing = true;
                errorMessageForMandatoryFieldsMissing += `LastMileOffNetVendor is empty in Row ${i + 1}.\n`;
            }

            // Mandatory check by actiontype
            let mandatoryChecks = checksForBulkUpload["mandatory"][actionType] || [];
            for (const field of mandatoryChecks) {
                if (!isObject(field)) {
                    let fieldName = field;
                    let value = childOpportunity[fieldName] || "";
                    if (value === "") {
                        mandatoryFieldsMissing = true;
                        errorMessageForMandatoryFieldsMissing += `${fieldName} is empty in Row ${i + 1}.\n`;
                    }
                } else {
                    let fieldName = Object.keys(field)[0];
                    let value = childOpportunity[fieldName] || "";
                    let [dependentFieldName, dependentValue] = Object.entries(field[fieldName])[0];
                    if (childOpportunity[dependentFieldName] === dependentValue && value === "") {
                        mandatoryFieldsMissing = true;
                        errorMessageForMandatoryFieldsMissing += `${fieldName} is empty in Row ${i + 1}.\n`;
                    }
                }
            }

            //Mandatory checks for Existing Feasbility
            if (childOpportunity.IsNewFeasibilityRequest === "Existing") {
                mandatoryChecks = checksForBulkUpload["mandatory"]["Existing_Feasibility"] || [];
                for (const field of mandatoryChecks) {
                    if (!isObject(field)) {
                        let fieldName = field;
                        let value = childOpportunity[fieldName] || "";
                        if (value === "") {
                            mandatoryFieldsMissing = true;
                            errorMessageForMandatoryFieldsMissing += `${fieldName} is empty in Row ${i + 1}.\n`;
                        }
                    } else {
                        let fieldName = Object.keys(field)[0];
                        let value = childOpportunity[fieldName] || "";
                        let [dependentFieldName, dependentValue] = Object.entries(field[fieldName])[0];
                        if (childOpportunity[dependentFieldName] === dependentValue && value === "") {
                            mandatoryFieldsMissing = true;
                            errorMessageForMandatoryFieldsMissing += `${fieldName} is empty in Row ${i + 1}.\n`;
                        }
                    }
                }
            }

            let charsLimitChecks = checksForBulkUpload["char_limit"];
            for (const [fieldName, limit] of Object.entries(charsLimitChecks)) {
                let fieldValue = childOpportunity[fieldName] || "";
                if (fieldValue.length > limit) {
                    charlimitExceeded = true;
                    errorMessageForCharLimitExceeded += `Characters limit exceeded for ${fieldName} in ${i + 1}.\n`;
                }
            }

            let emailValidationCheck = checksForBulkUpload["email_validation"];
            for (const fieldName of emailValidationCheck) {
                let fieldValue = childOpportunity[fieldName] || "";
                if (fieldValue.length > 0 && !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(fieldValue)) {
                    invalidEmailIdFound = true;
                    errorMessageForInvalidEmailId += `Invalid Email ID found for ${fieldName} in ${i + 1}.\n`;
                }
            }

            // Invalid LastMileOffNetVendor check
            if (
                LastMileOffNetVendor !== ""
            ) {
                let processedVendorList = LastMileOffNetVendor
                    .split(",")
                    .map(vendor => {
                        vendor = vendor.trim();
                        if (!vilBulkLOVs["vendorsList"].includes(vendor)) {
                            invalidValueFound = true;
                            errorMessageForInvalidValue += `Invalid LastMileOffNetVendor ${vendor} found in Row ${i + 1}\n`;
                        }
                        return vendor;
                    })
                    .join("|")

                childOpportunitiesArray[i].LastMileOffNetVendor = processedVendorList;
            }

            // Invalid vendor check
            if (
                vendorName !== ""
            ) {
                vendorName = vendorName.trim();
                if (!vilBulkLOVs["vendorsList"].includes(vendorName)) {
                    invalidValueFound = true;
                    errorMessageForInvalidValue += `Invalid vendor ${vendorName} found in Row ${i + 1}\n`;
                }
                childOpportunitiesArray[i].VendorName = vendorName;
            }

            // Invalid LastMile check
            if (
                lastMileName !== ""
            ) {
                lastMileName = lastMileName.trim();
                if (!vilBulkLOVs["LastMileList"].includes(lastMileName)) {
                    invalidValueFound = true;
                    errorMessageForInvalidValue += `Invalid LastMile ${lastMileName} found in Row ${i + 1}\n`;
                }
                childOpportunity.LastMileName = lastMileName;
            }

            // Invalid RejectionRemarksList check
            if (
                rejectionRemarks !== ""
            ) {
                rejectionRemarks = rejectionRemarks.trim();
                if (!vilBulkLOVs["RejectionRemarksList"].includes(rejectionRemarks)) {
                    invalidValueFound = true;
                    errorMessageForInvalidValue += `Invalid RejectionRemarks ${rejectionRemarks} found in Row ${i + 1}\n`;
                }
                childOpportunity.RejectionRemarks = rejectionRemarks;
            }

            // Invalid ReasonForCloning check
            if (
                reasonForCloning !== ""
            ) {
                reasonForCloning = reasonForCloning.trim();
                if (!vilBulkLOVs["ReasonForCloningList"].includes(reasonForCloning)) {
                    invalidValueFound = true;
                    errorMessageForInvalidValue += `Invalid ReasonForCloning ${reasonForCloning} found in Row ${i + 1}\n`;
                }
                childOpportunity.ReasonForCloning = reasonForCloning;
            }
        }

        if (nonAsciiErroFound || unsupportedProductForSecondaryFound || invalidValueFound || mandatoryFieldsMissing || charlimitExceeded || invalidProductSelected || invalidEmailIdFound) {
            let formattedTimelineMessage = `Errors found while parsing the bulk excel:\n\n`;
            if (nonAsciiErroFound) { formattedTimelineMessage += errorMessageForNonAscii }
            if (unsupportedProductForSecondaryFound) { formattedTimelineMessage += errorMessageForUnsupportedProductForSecondary }
            if (invalidValueFound) { formattedTimelineMessage += errorMessageForInvalidValue }
            if (mandatoryFieldsMissing) { formattedTimelineMessage += errorMessageForMandatoryFieldsMissing }
            if (charlimitExceeded) { formattedTimelineMessage += errorMessageForCharLimitExceeded }
            if (invalidProductSelected) { formattedTimelineMessage += errorMessageForInvalidProduct }
            if (invalidEmailIdFound) { formattedTimelineMessage += errorMessageForInvalidEmailId }
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
            util.logError(request, `[BulkFeasibilityError] BulkExcelPreProcessingErrorFound`);
            throw new Error("BulkExcelPreProcessingErrorFound");
        }

        // PreProcessinf Stage 1
        const errorMessagesArray = [];
        let groupedJobsMap = new Map();
        let childOpportunityIDToDualFlagMap = new Map();
        for (let i = 2; i < childOpportunitiesArray.length; i++) {
            const childOpportunity = childOpportunitiesArray[i];

            // Applies only to first upload and subsequent corrections
            // if (!(childOpportunity.actionType === "new" || childOpportunity.actionType === "correction")) {
            //     continue;
            // }

            if (solutionDocumentUrl !== "") { childOpportunity.FilePath = solutionDocumentUrl }

            const actionType = String(childOpportunity.actionType).toLowerCase();
            const linkType = String(childOpportunity.LinkType).toLowerCase();
            const serialNumber = childOpportunity.serialNum;
            const childOpportunityID = `${opportunityID}-${serialNumber}`;
            childOpportunityIDToDualFlagMap.set(childOpportunityID, false);

            if (groupedJobsMap.has(childOpportunityID)) {
                let jobInlineJSON = groupedJobsMap.get(childOpportunityID);
                if (linkType === "primary") { jobInlineJSON.bulk_job.primary = childOpportunity }
                if (linkType === "mplsl2_second_primary" && actionType === "new") { jobInlineJSON.bulk_job.second_primary = childOpportunity }
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
                        second_primary: {},
                        secondary: {}
                    }
                }
                if (linkType === "primary") { jobInlineJSON.bulk_job.primary = childOpportunity }
                if (linkType === "mplsl2_second_primary" && actionType === "new") { jobInlineJSON.bulk_job.second_primary = childOpportunity }
                if (linkType === "secondary") { jobInlineJSON.bulk_job.secondary = childOpportunity }
                groupedJobsMap.set(childOpportunityID, jobInlineJSON)
            }
        }
        // console.log("childOpportunityIDToDualFlagMap: ", childOpportunityIDToDualFlagMap);
        // console.log("groupedJobsMap: ", groupedJobsMap);

        const [errorOne, allChildOpportunityDatamp] = await activityListSearchCUIDFromParentActivityID({
            organization_id: request.organization_id,
            activity_type_category_id: workflowActivityCategoryTypeID,
            activity_type_id: workflowActivityTypeID,
            parent_activity_id: workflowActivityID,
        });

        for (let i = 2; i < childOpportunitiesArray.length; i++) {
            const childOpportunity = childOpportunitiesArray[i];
            util.logInfo(request,`IsNewFeasibilityRequest: ${childOpportunity.IsNewFeasibilityRequest} | serialNum: ${childOpportunity.serialNum} | actionType: ${childOpportunity.actionType}`);
            if (
                !childOpportunity.hasOwnProperty("IsNewFeasibilityRequest") ||
                childOpportunity.IsNewFeasibilityRequest === "" ||
                !childOpportunity.hasOwnProperty("actionType") ||
                !(
                    childOpportunity.actionType === "new" ||
                    childOpportunity.actionType === "correction" ||
                    childOpportunity.actionType === "refeasibility_rejected_by_fes" ||
                    childOpportunity.actionType === "refeasibility_rejected_by_am" ||
                    childOpportunity.actionType === "cloning"
                ) ||
                !childOpportunity.hasOwnProperty("LinkType") ||
                !(
                    String(childOpportunity.LinkType).toLowerCase() === "primary" ||
                    String(childOpportunity.LinkType).toLowerCase() === "secondary" ||
                    String(childOpportunity.LinkType).toLowerCase() === "mplsl2_second_primary"
                ) ||
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
                errorMessagesArray.push(`Child opportunity is empty in row #${i} for correction.`);
                continue;
            }
            // If actionType === correction, assert that the child opportunity exists
            if (childOpportunity.actionType === "correction" && childOpportunity.OppId !== "") {

                // Primary
                if (!allChildOpportunityDatamp.has(childOpportunity.OppId)) {
                    // errorMessageJSON.errorExists = true;
                    // errorMessageJSON.action.correction.opportunity_ids.push(childOpportunity.OppId);
                    errorMessagesArray.push(`Child opportunity ${childOpportunity.OppId} in row #${i} doesn't exist in our DB.`)
                    continue;
                }
                // Secondary
                const primaryFRID = allChildOpportunityDatamp.get(childOpportunity.OppId).activity_cuid_2 || "";
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
                if (linkType === "mplsl2_second_primary" && isDualJob) { continue; }

                if (linkType === "secondary" || linkType === "mplsl2_second_primary") { childOpportunityID = childOpportunity.OppId || ""; }
                if (childOpportunityID === "") {
                    errorMessagesArray.push(`Child opportunity is empty in row #${i}.`);
                    continue;
                }

                if (
                    linkType === "primary" &&
                    allChildOpportunityDatamp.has(childOpportunityID)
                ) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.new.opportunity_ids.push(childOpportunityID);
                    continue;
                }

                if (
                    linkType === "secondary" &&
                    allChildOpportunityDatamp.has(childOpportunityID) &&
                    !String(allChildOpportunityDatamp.get(childOpportunityID).activity_cuid_2).startsWith("FR")
                ) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.new_secondary.opportunity_ids.push(childOpportunityID);
                    continue;
                }

                if (
                    linkType === "mplsl2_second_primary" &&
                    !allChildOpportunityDatamp.has(childOpportunityID)
                ) {
                    errorMessagesArray.push(`Child opportunity ${childOpportunityID} in row #${i} doesn't exist in our DB.`)
                    continue;
                }

                childOpportunity.OppId = childOpportunityID;
            }

            if (childOpportunity.actionType === "refeasibility_rejected_by_am") {
                if (childOpportunity.OppId === "") { continue; }

                childOpportunityID = childOpportunity.OppId;

                if (!allChildOpportunityDatamp.has(childOpportunityID)) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.refeasibility_rejected_by_am.opportunity_ids.push(childOpportunityID);
                    continue;
                }
                const primaryFRID = allChildOpportunityDatamp.get(childOpportunityID).activity_cuid_2 || "";
                const secondaryFRID = allChildOpportunityDatamp.get(childOpportunityID).activity_cuid_3 || "";

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

                if (!(allChildOpportunityDatamp.has(childOpportunityID))) {
                    errorMessageJSON.errorExists = true;
                    errorMessageJSON.action.refeasibility_rejected_by_fes.opportunity_ids.push(childOpportunityID);
                    continue;
                }
                const primaryFRID = allChildOpportunityDatamp.get(childOpportunityID).activity_cuid_2 || "";
                const secondaryFRID = allChildOpportunityDatamp.get(childOpportunityID).activity_cuid_3 || "";

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

                if (!(allChildOpportunityDatamp.has(childOpportunityID))) {
                    errorMessageJSON.errorExists = true;
                    // errorMessageJSON.action.refeasibility_rejected_by_fes.opportunity_ids.push(childOpportunityID);
                    continue;
                }
                const primaryFRID = allChildOpportunityDatamp.get(childOpportunityID).activity_cuid_2 || "";
                const secondaryFRID = allChildOpportunityDatamp.get(childOpportunityID).activity_cuid_3 || "";

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
                    util.logError(request, `Error sending excel job to SQS queue`, { type: 'bot_engine', error: serializeError(error), request_body: request });
                    logger.error("Error sending excel job to SQS queue", { type: 'bot_engine', error: serializeError(error), request_body: request });
                } else {
                    util.logInfo(request, `Successfully sent excel job to SQS queue: %j`, { type: 'bot_engine', request_body: request });
                    logger.info("Successfully sent excel job to SQS queue: %j", data, { type: 'bot_engine', request_body: request });
                }
            });
        }

        try {
            if (!errorMessageJSON.errorExists && errorMessagesArray.length === 0) { throw new Error("NoErrorsFound") };
            let formattedTimelineMessage = `Errors found while parsing the bulk excel:\n\n`
            for (const errorCategory of Object.keys(errorMessageJSON.action)) {
                if (Number(errorMessageJSON.action[errorCategory].opportunity_ids.length) > 0) {
                    formattedTimelineMessage += errorMessageJSON.action[errorCategory].message;
                    formattedTimelineMessage += `${errorMessageJSON.action[errorCategory].opportunity_ids.join(', ')}\n\n`;
                }
            }

            if (errorMessagesArray.length > 0) {
                formattedTimelineMessage += "\nOther errors: \n";
                for (const errorMessage of errorMessagesArray) {
                    formattedTimelineMessage += `# ${errorMessage}\n`;
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
            util.logError(request, `${formattedTimelineMessage}`, { type: 'bot_engine', request_body: request });
        } catch (error) {
            if (error.message === "NoErrorsFound") {
                await addTimelineMessage(
                    {
                        activity_timeline_text: "",
                        organization_id: request.organization_id
                    }, workflowActivityID || 0,
                    {
                        subject: 'Bulk Operation Notifictaion',
                        content: "Excel has been submitted for processing successfully",
                        mail_body: "Excel has been submitted for processing successfully",
                        attachments: []
                    }
                );
                util.logInfo(request, `Excel has been submitted for processing successfully`);
            }
            else {
                util.logError(request, "Error logging the error message to the timeline", { type: "bulk_feasibility", error: serializeError(error) });
            }

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

        let paramsArr;
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

        if (global.config.cuid_search_from == "elastic") {
            [error, responseData] = await activityCommonService.searchCuidFromElastic(request);
        } else {
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
        util.logInfo(request,`making creator bot - addParticipantCreatorOwner`);
        
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
        activityCommonService.actAssetSearchMappingUpdate({...request,asset_id:assetID});

        // const [log_error, log_assetData] = await activityCommonService.getAssetDetailsAsync({
        //     organization_id: request.organization_id,
        //     asset_id: request.asset_id
        // });
        // let logAssetFirstName = log_assetData[0].operating_asset_first_name;
        // console.log("***********changed from ${defaultAssetName} to name****************",log_assetData[0].asset_id)

        const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);

        let activityTimelineCollection =  JSON.stringify({
            "content": `${defaultAssetName} assigned ${assetOperatingAssetFirstName} as owner at ${moment().utcOffset('+05:30').format('LLLL')}.`,
            "subject": `Note - ${util.getCurrentDate()}.`,
            "mail_body": `${defaultAssetName} assigned ${assetOperatingAssetFirstName} as owner at ${moment().utcOffset('+05:30').format('LLLL')}.`,
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
        
        util.logInfo(request,`globalAddParticipant inlineData : %j` , inlineData);
        request.debug_info.push('inlineData: ' + inlineData);
        newReq.message_unique_id = util.getMessageUniqueId(request.asset_id);

        let inlineKeys = Object.keys(inlineData);        
        util.logInfo(request,`inlineKeys - %j` , inlineKeys);
        request.debug_info.push('inlineKeys: ' + inlineKeys);

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
                    Number(formTransactionID) > 0 //&&
                    //Number(formActivityID) > 0
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
                    util.logInfo(request,`BotEngine | addParticipant | getFieldValue | Customer Name: ${newReq.customer_name}`);
                    request.debug_info.push("BotEngine | addParticipant | getFieldValue | Customer Name: "+ newReq.customer_name);
                }
            } catch (error) {
                logger.error("BotEngine | addParticipant | getFieldValue | Customer Name | Error: ", { type: "bot_engine", error: serializeError(error), request_body: request });
            }
        }

        newReq.is_lead = isLead;
        newReq.is_owner = isOwner;
        newReq.flag_creator_as_owner = flagCreatorAsOwner;

        util.logInfo(request,`newReq.phone_number : ${newReq.phone_number}`);
        request.debug_info.push('newReq.phone_number : '+ newReq.phone_number);
        if (
            (newReq.phone_number !== -1) &&
            (Number(newReq.phone_number) !== 0) &&
            (newReq.phone_number !== 'null') && (newReq.phone_number !== undefined)
        ) {
            util.logInfo(request,`BotService | addParticipant | Message: ${newReq.phone_number}  |  ${typeof newReq.phone_number}`);
            request.debug_info.push('phone_number: ' + newReq.phone_number);
            newReq.organization_id = 906;
            return await addParticipantStep(newReq);
        } else {
            logger.error(`BotService | addParticipant | Error: Phone number: ${newReq.phone_number}, has got problems!`);
            return [true, "Phone Number is Undefined"];
        }

    }

    async function checkLargeDoa(request, inlineData) {
        util.logInfo(request,`checkLargDoa`);
        await sleep(5 * 1000);

        request.form_id = 4353;
        let originForm = await getFormInlineData(request, 1);
        let originFormData = JSON.parse(originForm.data_entity_inline).form_submitted;

        logger.info(request.workflow_activity_id+" : larger DOA : dateFormData" + JSON.stringify(originFormData));
        request.debug_info.push('dateFormData: ' + JSON.stringify(originFormData));

        let resultProductAndRequestType = validatingProductAndRequestType(originFormData, inlineData.origin_form_config);

        logger.info(request.workflow_activity_id+" : larger DOA : resultProductAndRequestType----" + resultProductAndRequestType);
        request.debug_info.push('resultProductAndRequestType: ' + resultProductAndRequestType);

        let planConfig = {}, activityDetails = '', activityTypeId = '';

        let requestInlineData = JSON.parse(request.activity_inline_data)
        for(let row of requestInlineData) {
            if(parseInt(row.field_id) == 225020) {
                planConfig = row;
            }

            if(parseInt(row.field_id) == 218728) {
                activityDetails = row.field_value;
            }
        }

        logger.info(request.workflow_activity_id+" : larger DOA : activityDetails----"+ JSON.stringify(activityDetails));
        let activityTypeDetails = await getActivityTypeIdBasedOnActivityId(request, request.organization_id, activityDetails.split('|')[0]);

        if(activityTypeDetails.length) {
            activityTypeId = activityTypeDetails[0].activity_type_id;
        } else {
            logger.info(request.workflow_activity_id+" : larger DOA : activityTypeDetails found empty");
        }

        if(activityTypeId == '149752') {
            logger.info(request.workflow_activity_id +" : larger DOA : activityTypeDetails found "+ activityTypeId + " so going to wintogether");
            return;            
        }

        let formInputToProcess, connectionTypeValue, capexValue, opexValue;

        if(resultProductAndRequestType.productMatchFlag == 3 &&
          ([1,2,4].indexOf(resultProductAndRequestType.requestTypeMatch) > -1)) {
            try {
                logger.info(request.workflow_activity_id+" : larger DOA : Mobility is to be triggered");
                request.form_id = 50079;
                let fldForm = await getFormInlineData(request, 1);
                formInputToProcess = JSON.parse(fldForm.data_entity_inline).form_submitted;

                connectionTypeValue = countCOCPAndIOIP(formInputToProcess, inlineData.cocp_ioip_field_ids);
            } catch(e) {
                logger.info(request.workflow_activity_id+" : larger DOA : Data not fetched for 50079 mobility");
            }

        } else {
            try {
                request.form_id = 50264;
                let IllForm = await getFormInlineData(request, 1);
                formInputToProcess = JSON.parse(IllForm.data_entity_inline).form_submitted;

                for(let row of formInputToProcess) {

                    if(row.field_id == inlineData.opexFieldId) {
                        opexValue = row.field_value;
                    } else if(row.field_id == inlineData.capexFieldId) {
                        capexValue = row.field_value;
                    }

                    if(opexValue && capexValue) {
                        break;
                    }
                }
            } catch (e) {
                logger.info(request.workflow_activity_id+" : larger DOA : Data for found for 50264");
            }
        }


        let largerDoaDataToProcess = inlineData.large_doa[resultProductAndRequestType.productMatchFlag];

        largerDoaDataToProcess.sort((a, b) => (a.priority > b.priority
        ) ? 1 : -1);

        request.form_id = 50403;
        let largeDoa = await getFormInlineData(request, 1);
        let largeDoaData = JSON.parse(largeDoa.data_entity_inline).form_submitted;

        logger.info(request.workflow_activity_id+" : larger DOA : largeDoaData----> "+ JSON.stringify(largeDoaData));

        let columnNumber = {
            "column": 0,
            "title" : "Corporate-Commercial L1"
        }

        let fieldIdValuesMap = {}, aovValue = '';

        for(let row of largeDoaData) {
            fieldIdValuesMap[row.field_id] = row.field_value;
        }

        request.fldAovValue = fieldIdValuesMap[310745]
        request.mobilityAovValue = fieldIdValuesMap[308694]; 

        for(let currentExecution of largerDoaDataToProcess) {

            logger.info(request.workflow_activity_id+" : larger DOA : columnNumber---- "+ JSON.stringify(columnNumber) +' column name '+ currentExecution.name);

            let valuesToBeChecked = inlineData.values[currentExecution.values];


            if(currentExecution.key_number == 1) {

                if(!currentExecution.isEnable) {
                    logger.info(request.workflow_activity_id+" : larger DOA : Empowerment DOA is disabled ");
                    continue;
                }
                
                logger.info(request.workflow_activity_id+" : larger DOA : Final Prcessing Data " + JSON.stringify(formInputToProcess));
                logger.info(request.workflow_activity_id+" : larger DOA : Processing Empowerment DOA "+ JSON.stringify(valuesToBeChecked[0]) +' currentExecution values'+ currentExecution.values);
                let response = await checkCustomBotV1(request, valuesToBeChecked[0], resultProductAndRequestType, formInputToProcess, connectionTypeValue);

                if(response != 1) {
                    logger.info(request.workflow_activity_id+" : larger DOA : Got Rejection case in Custom Bot so not proceeding with next flow in larger DOA");
                    return;
                } else {
                    logger.info(request.workflow_activity_id+" : larger DOA : Got Win-together/manual Flow So checking to which team it should be assigned");
                    continue;
                }
            }

            for(let fieldId of currentExecution.field_ids) {

                let fieldValue = fieldIdValuesMap[fieldId];

                if(fieldValue == '') {
                    logger.info(request.workflow_activity_id+" : larger DOA : Got Empty Value " + fieldId+ " " + fieldValue);
                    continue;
                }

                if(currentExecution.key_number == 2) {
                    aovValue = fieldValue;
                }

                if(!currentExecution.isEnable) {
                    logger.info(request.workflow_activity_id +` : larger DOA : ${currentExecution.name} is disabled` );
                    break;
                }

                logger.info(request.workflow_activity_id+" : larger DOA : columnNumber before update" + columnNumber + " and the value is " + fieldValue + " and type is " + currentExecution.type + " and field id is "+ fieldId);

                for(let columnDetails of valuesToBeChecked) {
                    logger.info(request.workflow_activity_id+" : larger DOA : columnDetails-----" + JSON.stringify(columnDetails));
                    if(columnDetails['value1']) {

                        logger.info(request.workflow_activity_id+" : larger DOA : column value is" + columnDetails['value1']);

                        if(currentExecution.type == 'number') {
                            try {
                                fieldValue = Number(fieldValue);
                            } catch (e){
                                logger.info(request.workflow_activity_id+" : larger DOA : parsing error" );
                                continue;
                            }
                            
                            let exp1 = fieldValue + columnDetails['value1'];
                            logger.info(request.workflow_activity_id+" : larger DOA : exp1---->" + exp1 + " "+eval(exp1));

                            if(columnDetails['value2']) {
                                let exp2 = fieldValue + columnDetails['value2'];
                                logger.info(request.workflow_activity_id+" : larger DOA : exp2---->" + exp2 + " "+eval(exp2));

                                if(columnDetails['value3']) {
                                    let exp3 = fieldValue + columnDetails['value2'];
                                    logger.info(request.workflow_activity_id+" : larger DOA : exp3---->" + exp3 + " "+eval(exp3));
                                    if(eval(exp2) && eval(exp1)  && eval(exp3)) {

                                        if(columnDetails.column > columnNumber.column) {
                                            columnNumber = Object.assign({}, columnDetails);
                                            logger.info(request.workflow_activity_id+" : larger DOA : columnNumber is updated to"+ JSON.stringify(columnNumber));
                                            continue;
                                        }
                                    }
                                } else if(eval(exp2) && eval(exp1)) {

                                    if(columnDetails.column > columnNumber.column) {
                                        columnNumber = Object.assign({}, columnDetails);
                                        logger.info(request.workflow_activity_id+" : larger DOA : columnNumber is updated to"+ JSON.stringify(columnNumber));
                                        continue;
                                    }
                                }
                            } else if(eval(exp1)) {
                                if(columnDetails.column > columnNumber.column) {
                                    columnNumber = Object.assign({}, columnDetails);
                                    logger.info(request.workflow_activity_id+" : larger DOA : columnNumber is updated to"+ JSON.stringify(columnNumber));
                                    continue;
                                }
                            }
                        } else {
                            if(columnDetails['value1'] == fieldValue) {
                                if(columnDetails.column > columnNumber.column) {
                                    columnNumber = Object.assign({}, columnDetails);
                                    logger.info(request.workflow_activity_id+" : larger DOA : columnNumber is updated to"+ JSON.stringify(columnNumber));
                                    continue;
                                }
                            }
                        }
                    }

                    logger.info(request.workflow_activity_id+" : larger DOA : columnNumber Final Value"+ JSON.stringify(columnNumber));
                }

                break;
            }
        }

        logger.info(request.workflow_activity_id+" : larger DOA : Selected column is "+ JSON.stringify(columnNumber));

        // even if there is an exception for this then it is fine because aovValue is expected to have a number always
        if(!Number(aovValue) || Number(aovValue) < 0 || aovValue == "#N/A") {
            logger.info(request.workflow_activity_id+" : larger DOA : aovValue "+ aovValue);
            columnNumber = {
                "column": 0,
                "title" : "Corporate-Commercial L1"
            }
            // return;
        }
        //need timeline entry

        let fieldValue = parseInt(planConfig.data_type_combo_id) == 3 ? "New Plan Configuration" : (activityTypeId == '149752' ? 'Bid / Tender' : 'Other workflow');
        logger.info(request.workflow_activity_id+" : larger DOA : Will be assigned to the required team");
        let wfActivityDetails = await activityCommonService.getActivityDetailsPromise({ organization_id : request.organization_id }, request.workflow_activity_id);
        logger.info(request.workflow_activity_id+" : larger DOA : wfActivityDetails "+ JSON.stringify(wfActivityDetails));
        let createWorkflowRequest                       = Object.assign({}, request);

        //Assign field_value based on value exists in db or not.
        //Mangesh Shinde - 04 March 2021
        let requestObj = {
            organization_id : request.organization_id,
            activity_id : request.workflow_activity_id,
            trigger_form_id : request.form_id,
            global_array : []
        };

        //Based on requet parameter isFieldEdit == 1 deciding 
        //field_name: 'Assign Commercial L1' value as 'No' Otherwise value as 'Yes'
        logger.info(request.workflow_activity_id + " isFieldEdit = " + request.isFieldEdit);
        let fieldValueForAssignCommercialL1 = 'Yes';
        let comboValueForAssignCommercialL1 = 1;
        if(request.hasOwnProperty("isFieldEdit")) {
            if(request.isFieldEdit == 1) {
                fieldValueForAssignCommercialL1 = 'No';
                comboValueForAssignCommercialL1 = 2;
            }
        }
        
        createWorkflowRequest.activity_inline_data      = JSON.stringify([
            {
                form_id: 50476,
                field_id: '309277',
                field_name: 'Derived DOA',
                field_data_type_id: 19,
                field_data_type_category_id: 7,
                data_type_combo_id: 0,
                data_type_combo_value: '0',
                field_value: columnNumber.title,
                message_unique_id: 1611037456814
            },
            {
                form_id: 50476,
                field_id: '309279',
                field_name: 'Decision Type',
                field_data_type_id: 33,
                field_data_type_category_id: 14,
                data_type_combo_id: 0,
                data_type_combo_value: fieldValue,
                field_value : fieldValue,
                message_unique_id : 1611037993575
            },
            {
                form_id: 50476,
                field_id: '309278',
                field_name: 'AOV',
                field_data_type_id: 6,
                field_data_type_category_id: 2,
                data_type_combo_id: 0,
                data_type_combo_value: aovValue,
                field_value: aovValue,
                message_unique_id: 1611037843535
            },
            {
                form_id: 50476,
                field_id: '310606',
                field_name: 'Assign Commercial L1',
                field_data_type_id: 33,
                field_data_type_category_id: 14,
                data_type_combo_id: comboValueForAssignCommercialL1,
                data_type_combo_value: fieldValueForAssignCommercialL1,
                field_value: fieldValueForAssignCommercialL1,
                message_unique_id: 1611037843535
            }
        ]);

        requestObj = null; formEditErr = null; formEditData = null; fieldValueForAssignCommercialL1 = null;

        createWorkflowRequest.workflow_activity_id      = Number(request.workflow_activity_id);
        createWorkflowRequest.activity_type_category_id = 9;
        createWorkflowRequest.activity_type_id          = 150506;
        //createWorkflowRequest.activity_title = workflowActivityTypeName;
        //createWorkflowRequest.activity_description = workflowActivityTypeName;
        //createWorkflowRequest.activity_form_id    = Number(request.activity_form_id);
        // Child Orders
        createWorkflowRequest.activity_parent_id = 0;
        createWorkflowRequest.activity_form_id    = 50476;
        createWorkflowRequest.form_id    = 50476;

        createWorkflowRequest.activity_datetime_start = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        createWorkflowRequest.activity_datetime_end   = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        // delete createWorkflowRequest.activity_id;
        createWorkflowRequest.device_os_id = 7;

        const targetFormActivityID = await cacheWrapper.getActivityIdPromise();
        const targetFormTransactionID = await cacheWrapper.getFormTransactionIdPromise();
        createWorkflowRequest.activity_id = targetFormActivityID;
        createWorkflowRequest.form_transaction_id = targetFormTransactionID;
        createWorkflowRequest.data_entity_inline        = createWorkflowRequest.activity_inline_data;

        logger.info(request.workflow_activity_id+" : larger DOA : createWorkflowRequest "+ JSON.stringify(createWorkflowRequest));
        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        let activityInsertedDetails = await addActivityAsync(createWorkflowRequest);


        logger.info(request.workflow_activity_id+" : larger DOA : activityInsertedDetails----> " +  JSON.stringify(activityInsertedDetails));

        let activityTimelineCollection =  JSON.stringify({
            "content": `Form Submitted`,
            "subject": `ARP Trigger`,
            "mail_body": `ARP Trigger`,
            "activity_reference": [],
            "form_id" : 50476,
            "form_submitted" : JSON.parse(createWorkflowRequest.data_entity_inline),
            "asset_reference": [],
            "attachments": [],
            "form_approval_field_reference": []
        });


        let timelineReq = Object.assign({}, createWorkflowRequest);

        timelineReq.activity_id = request.workflow_activity_id;
        timelineReq.message_unique_id = util.getMessageUniqueId(100);
        timelineReq.track_gps_datetime = util.getCurrentUTCTime();
        timelineReq.activity_stream_type_id = 717;
        timelineReq.activity_stream_type_id = 705;
        timelineReq.timeline_stream_type_id = 705;
        timelineReq.activity_type_category_id = 48;
        timelineReq.asset_id = 100;
        timelineReq.activity_timeline_collection = activityTimelineCollection;
        timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;

        await activityTimelineService.addTimelineTransactionAsync(timelineReq);

        return

    }
    

    async function triggerArpForm(request) {
        try {
            // even if there is an exception for this then it is fine because aovValue is expected to have a number always
            // check for AOV value, should not be a string 
            if(!Number(request.aovValue) || Number(request.aovValue) < 0 || request.aovValue.toUpperCase() == '#N/A') {
                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :triggerArpForm aovValue" + aovValue);
                request.team_title = "Corporate-Commercial L1"
                // return;
            }
            let createWorkflowRequest                       = Object.assign({}, request);

            //Assign field_value based on value exists in db or not.
            let fieldValueForAssignCommercialL1 = 'No';
            let comboValueForAssignCommercialL1 = 2;

            createWorkflowRequest.activity_inline_data      = JSON.stringify([
                {
                    form_id: 50476,
                    field_id: '309277',
                    field_name: 'Derived DOA',
                    field_data_type_id: 19,
                    field_data_type_category_id: 7,
                    data_type_combo_id: 0,
                    data_type_combo_value: '0',
                    field_value: request.team_title || "",
                    message_unique_id: 1611037456814
                },
                {
                    form_id: 50476,
                    field_id: '309279',
                    field_name: 'Decision Type',
                    field_data_type_id: 33,
                    field_data_type_category_id: 14,
                    data_type_combo_id: 0,
                    data_type_combo_value: request.decision_type_value || "",
                    field_value : request.decision_type_value || "",
                    message_unique_id : 1611037993575
                },
                {
                    form_id: 50476,
                    field_id: '309278',
                    field_name: 'AOV',
                    field_data_type_id: 6,
                    field_data_type_category_id: 2,
                    data_type_combo_id: 0,
                    data_type_combo_value: request.aovValue || "",
                    field_value: request.aovValue || "",
                    message_unique_id: 1611037843535
                },
                {
                    form_id: 50476,
                    field_id: '310606',
                    field_name: 'Assign Commercial L1',
                    field_data_type_id: 33,
                    field_data_type_category_id: 14,
                    data_type_combo_id: comboValueForAssignCommercialL1,
                    data_type_combo_value: fieldValueForAssignCommercialL1,
                    field_value: fieldValueForAssignCommercialL1,
                    message_unique_id: 1611037843535
                }
            ]);

            requestObj = null; formEditErr = null; formEditData = null; fieldValueForAssignCommercialL1 = null;

            createWorkflowRequest.workflow_activity_id      = Number(request.workflow_activity_id);
            createWorkflowRequest.activity_type_category_id = 9;
            createWorkflowRequest.activity_type_id          = 150506;
            //createWorkflowRequest.activity_title = workflowActivityTypeName;
            //createWorkflowRequest.activity_description = workflowActivityTypeName;
            //createWorkflowRequest.activity_form_id    = Number(request.activity_form_id);
            // Child Orders
            createWorkflowRequest.activity_parent_id = 0;
            createWorkflowRequest.activity_form_id    = 50476;
            createWorkflowRequest.form_id    = 50476;

            createWorkflowRequest.activity_datetime_start = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            createWorkflowRequest.activity_datetime_end   = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            // delete createWorkflowRequest.activity_id;
            createWorkflowRequest.device_os_id = 7;

            const targetFormActivityID = await cacheWrapper.getActivityIdPromise();
            const targetFormTransactionID = await cacheWrapper.getFormTransactionIdPromise();
            createWorkflowRequest.activity_id = targetFormActivityID;
            createWorkflowRequest.form_transaction_id = targetFormTransactionID;
            createWorkflowRequest.data_entity_inline        = createWorkflowRequest.activity_inline_data;

            logger.info(request.workflow_activity_id+" : larger DOA : createWorkflowRequest", JSON.stringify(createWorkflowRequest));
            const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
            let activityInsertedDetails = await addActivityAsync(createWorkflowRequest);

            logger.info(request.workflow_activity_id+" : larger DOA : activityInsertedDetails---->", activityInsertedDetails);


            let activityTimelineCollection =  JSON.stringify({
                "content": `Form Submitted`,
                "subject": `ARP Trigger`,
                "mail_body": `ARP Trigger`,
                "activity_reference": [],
                "form_id" : 50476,
                "form_submitted" : JSON.parse(createWorkflowRequest.data_entity_inline),
                "asset_reference": [],
                "attachments": [],
                "form_approval_field_reference": []
            });


            let timelineReq = Object.assign({}, createWorkflowRequest);

            timelineReq.activity_id = request.workflow_activity_id;
            timelineReq.message_unique_id = util.getMessageUniqueId(100);
            timelineReq.track_gps_datetime = util.getCurrentUTCTime();
            // timelineReq.activity_stream_type_id = 717;
            timelineReq.activity_stream_type_id = 705;
            timelineReq.timeline_stream_type_id = 705;
            timelineReq.activity_type_category_id = 48;
            timelineReq.asset_id = 100;
            timelineReq.activity_timeline_collection = activityTimelineCollection;
            timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;

            await activityTimelineService.addTimelineTransactionAsync(timelineReq);

            return 1;
        } catch(e) {
            logger.info(request.workflow_activity_id+" : larger DOA : Error-->", e.stack, e);
            return 0;
        }
    }

    async function getActivityTypeIdBasedOnActivityId(request, organization_id, activity_id) {
        let paramsArr = new Array(
          activity_id,
          organization_id
        );
        let queryString = util.getQueryString('ds_p1_activity_list_select', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    }

    async function checkCustomBot(request, inlineData) {

        if(request.flag_past_data_processing == 1) {
            console.error("got flag_past_data_processing key as " + request.flag_past_data_processing + " so skipping Custom bot 35 SME and Mobility");
            return;
        }

        util.logInfo(request, `checkCustomBot---- ${request.workflow_activity_id} ${request.activity_id} %j `, { request, inlineData });
        request.debug_info.push('inlineData: ' + inlineData);
        request.debug_info.push('workflow_activity_id: ' + request.workflow_activity_id);
        request.debug_info.push('activity_id: ' + request.activity_id);
        await sleep(5 * 1000);
        request.form_id = 4353;
        let originForm = await getFormInlineData(request, 1);
        let originFormData = JSON.parse(originForm.data_entity_inline).form_submitted;
        util.logInfo(request,`dateFormData : %j` , JSON.stringify(originFormData));
        request.debug_info.push('dateFormData: ' + JSON.stringify(originFormData));
        let dataResp = await getAssetDetailsOfANumber({
            country_code : inlineData.country_code || '',
            phone_number : inlineData.phone_number,
            organization_id : request.organization_id
        });
        let deskAssetData;
        if (dataResp.length > 0) {
            for (let i of dataResp) {
                if (i.asset_type_category_id === 3 || i.asset_type_category_id === 45) {
                    deskAssetData = i;
                    break;
                }
            }
        }

        // validating product and request type
        let resultProductAndRequestType = validatingProductAndRequestType(originFormData, inlineData.origin_form_config);

        util.logInfo(request,`resultProductAndRequestType---- %j` , resultProductAndRequestType);
        request.debug_info.push('resultProductAndRequestType: ' + resultProductAndRequestType);
        // if(!resultProductAndRequestType.requestTypeMatch && resultProductAndRequestType.reqularApproval) {
        //     console.log("Request type match failed");
        //     submitRejectionForm(request, "Rejected! One/more of the condition for trading desk approval is not met.", deskAssetData, inlineData);
        //     return;
        // } else if(!resultProductAndRequestType.reqularApproval) {
        //     console.log("Regular approval match failed");
        //     // submitRejectionForm(request, "Rejected! One/more of the condition for trading desk approval is not met.", deskAssetData, inlineData);
        //     return;
        // }

        resultProductAndRequestType.productMatchFlag = (resultProductAndRequestType.productMatchFlag == 1 || resultProductAndRequestType.productMatchFlag == 3) ? resultProductAndRequestType.productMatchFlag : 0;
        util.logInfo(request,`final value resultProductAndRequestType.productMatchFlag ${resultProductAndRequestType.productMatchFlag}`);
        request.debug_info.push("final value resultProductAndRequestType.productMatchFlag : "+ resultProductAndRequestType.productMatchFlag);
        if(resultProductAndRequestType.productMatchFlag == 1 && !resultProductAndRequestType.reqularApproval) {
            util.logInfo(request,`Got Product FLD Domestic, Tiggering SME ILL BOT, IF this fails then it should be manual approval`);
            request.debug_info.push("Got Product FLD Domestic, Tiggering SME ILL BOT, IF this fails then it should be manual approval");
            inlineData.sme_config.phone_number = inlineData.phone_number;
            checkSmeBot(request, inlineData.sme_config, deskAssetData);
            return;
        } else if(resultProductAndRequestType.productMatchFlag == 3 &&
          ([1,2,4].indexOf(resultProductAndRequestType.requestTypeMatch) > -1)) { // [1,2,4] Acquisition, Rentention and Mnp
            util.logInfo(request,`Got Product Mobility, Triggering Mobility BOT`);
            request.debug_info.push("Got Product Mobility, Triggering Mobility BOT");
            inlineData.mobility_config.phone_number = inlineData.phone_number;
            checkMobility(request, inlineData.mobility_config, deskAssetData, resultProductAndRequestType.requestTypeMatch, resultProductAndRequestType.reqularApproval);
            return;
        } else if((!resultProductAndRequestType.productMatchFlag && !resultProductAndRequestType.reqularApproval) ||
          (resultProductAndRequestType.productMatchFlag == 3 && resultProductAndRequestType.requestTypeMatch && !resultProductAndRequestType.reqularApproval) ||
          (resultProductAndRequestType.productMatchFlag == 3 && !resultProductAndRequestType.requestTypeMatch && !resultProductAndRequestType.reqularApproval)) {
            util.logInfo(request,`Product Match Failed--- Manual Flow`);
            request.debug_info.push("Product Match Failed--- Manual Flow");
            // submitRejectionForm(request, "Rejected! One/more of the condition for trading desk approval is not met.", deskAssetData, inlineData);
            return;
        }
        submitRejectionForm(request, "Rejected! One/more of the condition for trading desk approval is not met.", deskAssetData, inlineData);
    }
    async function checkCustomBotV1(request, inlineData, resultProductAndRequestType, formToProcess, connectionTypeValue) {

        if(request.flag_past_data_processing == 1) {
            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : got flag_past_data_processing key as " + request.flag_past_data_processing + " so skipping Custom bot 35 SME and Mobility");
            return;
        }

        request.debug_info.push('inlineData: ' + inlineData);
        request.debug_info.push('workflow_activity_id: ' + request.workflow_activity_id);
        request.debug_info.push('activity_id: ' + request.activity_id);
        await sleep(5 * 1000);
        request.form_id = 4353;
        let originForm = await getFormInlineData(request, 1);
        let originFormData = JSON.parse(originForm.data_entity_inline).form_submitted;
        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 :dateFormData "+ JSON.stringify(originFormData));
        request.debug_info.push('dateFormData: ' + JSON.stringify(originFormData));
        let dataResp = await getAssetDetailsOfANumber({
            country_code : inlineData.country_code || '',
            phone_number : inlineData.phone_number,
            organization_id : request.organization_id
        });
        let deskAssetData;
        if (dataResp.length > 0) {
            for (let i of dataResp) {
                if (i.asset_type_category_id === 3 || i.asset_type_category_id === 45) {
                    deskAssetData = i;
                    break;
                }
            }
        }

        // validating product and request type
        // let resultProductAndRequestType = validatingProductAndRequestType(originFormData, inlineData.origin_form_config);

        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 :resultProductAndRequestType---- " + JSON.stringify(resultProductAndRequestType));
        request.debug_info.push('resultProductAndRequestType: ' + resultProductAndRequestType);
        // if(!resultProductAndRequestType.requestTypeMatch && resultProductAndRequestType.reqularApproval) {
        //     logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 :Request type match failed");
        //     submitRejectionForm(request, "Rejected! One/more of the condition for trading desk approval is not met.", deskAssetData, inlineData);
        //     return;
        // } else if(!resultProductAndRequestType.reqularApproval) {
        //     logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 :Regular approval match failed");
        //     // submitRejectionForm(request, "Rejected! One/more of the condition for trading desk approval is not met.", deskAssetData, inlineData);
        //     return;
        // }

        resultProductAndRequestType.productMatchFlag = (resultProductAndRequestType.productMatchFlag == 1 || resultProductAndRequestType.productMatchFlag == 3) ? resultProductAndRequestType.productMatchFlag : 0;
        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 :final value resultProductAndRequestType.productMatchFlag "+ resultProductAndRequestType.productMatchFlag);
        request.debug_info.push("final value resultProductAndRequestType.productMatchFlag : "+ resultProductAndRequestType.productMatchFlag);
        if(resultProductAndRequestType.productMatchFlag == 1 && !resultProductAndRequestType.reqularApproval) {
            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 :Got Product FLD Domestic, Tiggering SME ILL BOT, IF this fails then it should be manual approval");
            request.debug_info.push("Got Product FLD Domestic, Tiggering SME ILL BOT, IF this fails then it should be manual approval");
            inlineData.sme_config.phone_number = inlineData.phone_number;
            return checkSmeBotV1(request, inlineData.sme_config, deskAssetData, formToProcess);
        } else if(resultProductAndRequestType.productMatchFlag == 3 &&
          ([1,2,4].indexOf(resultProductAndRequestType.requestTypeMatch) > -1)) { // [1,2,4] Acquisition, Rentention and Mnp
            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 :Got Product Mobility, Triggering Mobility BOT");
            request.debug_info.push("Got Product Mobility, Triggering Mobility BOT");
            inlineData.mobility_config.phone_number = inlineData.phone_number;
            return checkMobilityV1(request, inlineData.mobility_config, deskAssetData, resultProductAndRequestType.requestTypeMatch, resultProductAndRequestType.reqularApproval, connectionTypeValue, formToProcess);
        } else if((!resultProductAndRequestType.productMatchFlag && !resultProductAndRequestType.reqularApproval) ||
          (resultProductAndRequestType.productMatchFlag == 3 && resultProductAndRequestType.requestTypeMatch && !resultProductAndRequestType.reqularApproval) ||
          (resultProductAndRequestType.productMatchFlag == 3 && !resultProductAndRequestType.requestTypeMatch && !resultProductAndRequestType.reqularApproval)) {
            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 :Product Match Failed--- Manual Flow");
            request.debug_info.push("Product Match Failed--- Manual Flow");
            // submitRejectionForm(request, "Rejected! One/more of the condition for trading desk approval is not met.", deskAssetData, inlineData);
            return 1;
        }
        submitRejectionForm(request, "Rejected! One/more of the condition for trading desk approval is not met.", deskAssetData, inlineData);
    }

    function validatingProductAndRequestType(formData, originFormConfig) {
        let productMatchFlag = 0, requestTypeMatch = 0, reqularApproval = 0;
        for(let row of formData) {
            if(Object.keys(originFormConfig).includes(row.field_id.toString())) {
                let value = originFormConfig[row.field_id];
                util.logInfo(request,`Value from config ${value} Value from list ${row.field_value}`);
                if(!value) {
                    util.logInfo(request,`Value not found in validatingProductAndRequestType ${row.field_id}`);
                    break;
                }

                if(row.field_id == 224835) {
                    util.logInfo(request,`Value get matched in validatingProductAndRequestType ${row.field_id} ${row.data_type_combo_id}`);
                    productMatchFlag = row.data_type_combo_id;
                } else if(row.field_id == 225020) {
                    util.logInfo(request,`Value get matched in validatingProductAndRequestType ${row.field_id} ${row.data_type_combo_id}`);
                    requestTypeMatch = row.data_type_combo_id;
                } else if(row.field_id == 223769 && originFormConfig[row.field_id] == Number(row.data_type_combo_id)){
                    util.logInfo(request,`Value get matched in validatingProductAndRequestType reqularApproval ${row.field_id} ${row.data_type_combo_id}`);
                    reqularApproval = 1;
                }

            }
        }

        return {productMatchFlag, requestTypeMatch, reqularApproval};
    };


    async function checkMobility (request, inlineData, deskAssetData, requestTypeComboId, workflowType) {
        request.form_id = 50079; // NON FLD form
        let submitRejectionFormFlag = 0, comment = '';
        let fldForm = await getFormInlineData(request, 1);
        let fldFormData = JSON.parse(fldForm.data_entity_inline).form_submitted;
        util.logInfo(request,`dateFormData1 : %j` , JSON.stringify(fldFormData));
        request.debug_info.push("dateFormData1", JSON.stringify(fldFormData));


        let totalCOCPAndIOIP = countCOCPAndIOIP(fldFormData, inlineData.plans_field_ids);

        util.logInfo(request,`totalCOCPAndIOIP : %j` , totalCOCPAndIOIP);
        request.debug_info.push("totalCOCPAndIOIP", totalCOCPAndIOIP);

        let sheets = [], connectionType = '';
        if(totalCOCPAndIOIP[0].cocp > 0 && totalCOCPAndIOIP[0].cocpr > 0 && (totalCOCPAndIOIP[0].ioip + totalCOCPAndIOIP[0].ioip) == 0) {
            sheets.push(1,2);
            connectionType = 'COCP';
        } else if(totalCOCPAndIOIP[0].cocp > 0 && (totalCOCPAndIOIP[0].ioip + totalCOCPAndIOIP[0].ioip) == 0) {
            sheets.push(2);
            connectionType = 'COCP';
        } else  if(totalCOCPAndIOIP[0].cocpr > 0 && (totalCOCPAndIOIP[0].ioip + totalCOCPAndIOIP[0].ioip) == 0) {
            sheets.push(1);
            connectionType = 'COCP';
        } else if((totalCOCPAndIOIP[0].ioip + totalCOCPAndIOIP[0].ioip) > 0 && (totalCOCPAndIOIP[0].cocp + totalCOCPAndIOIP[0].cocpr) >= 0) {
            sheets.push(3);
            connectionType = 'IOIP';
        }

        util.logInfo(request,`Sheet Selected is ${sheets} and the connection type is ${connectionType}`);
        request.debug_info.push("Sheet Selected is ", sheets, " and the connection type is ", connectionType);

        let configSheets =  inlineData.field_values_map[connectionType] || [];

        if(!configSheets.length) {
            util.logInfo(request,`No Sheet Selected`);
            request.debug_info.push("No Sheet Selected");
        }

        util.logInfo(request,`configSheets : ${JSON.stringify(configSheets)} %j` , request);
        request.debug_info.push("configSheets", JSON.stringify(configSheets));

        let checkingSegmentResult = validatingSegment(fldFormData, inlineData.segment_config, configSheets, sheets);
        if(!checkingSegmentResult.length) {
            console.error("Segment is not matched");
            request.debug_info.push("Segment is not matched");
            submitRejectionFormFlag = 1;
        }

        util.logInfo(request,`checkingSegmentResult : %j` , JSON.stringify(checkingSegmentResult));
        request.debug_info.push("checkingSegmentResult", JSON.stringify(checkingSegmentResult));

        let sheetMatchFlag = {};
        for(let row of checkingSegmentResult) {
            util.logInfo(request,`Processing Sheet %j` , row.sheet);
            request.debug_info.push("Processing Sheet ", row.sheet);
            comment = row.comment;

            if(sheetMatchFlag[row.sheet] && sheetMatchFlag[row.sheet] == '0') {
                util.logInfo(request,`Already matched for sheet ${row.sheet}  so skipping and checking for next sheet if there is`);
                request.debug_info.push("Already matched for sheet ", row.sheet, ' so skipping and checking for next sheet if there is');
                continue;
            }

            util.logInfo(request,`row.key----> %j` , JSON.stringify(row.key));
            request.debug_info.push("row.key---->", JSON.stringify(row.key));
            if(!(row.value.key.indexOf(parseInt(requestTypeComboId)) > -1)) {
                console.error("Request Type Match Failed requestTypeComboId ", requestTypeComboId);
                request.debug_info.push("Request Type Match Failed requestTypeComboId ", requestTypeComboId);
                sheetMatchFlag[row.sheet] = '1';
                continue;
            } else {
                sheetMatchFlag[row.sheet] = '0';
            }

            // // validating COCP and IOIP
            // let totalLinks = validatingCocpAndIoip(fldFormData, inlineData.plans_field_ids);
            //
            // if(!totalLinks.length) {
            //     console.error("Failed in Matching validatingCocpAndIoip");
            //     request.debug_info.push("Failed in Matching validatingCocpAndIoip");
            //     continue;
            // }

            // validating No of Links

            // selecting Comments for approval


            let linkResponse = validatingNoOfLinks(row.value.value, totalCOCPAndIOIP, row.sheet);

            if(!linkResponse) {
                console.error("NO of Links are not matched");
                request.debug_info.push("NO of Links are not matched");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }

            console.error("linkResponse",linkResponse);
            request.debug_info.push("linkResponse",linkResponse);

            // Checking Rentals
            let rentalResult = validatingRentals(fldFormData, inlineData.rental_field_ids, linkResponse);

            // check for empty plans
            if(!rentalResult[0] && !rentalResult[1] && !rentalResult[2] && !rentalResult[3] && !rentalResult[4]) {
                console.error("Failed in Matching validatingRentals");
                request.debug_info.push("Failed in Matching validatingRentals");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }
            
            if(!rentalResult || !rentalResult.length) {
                console.error("Failed in Matching validatingRentals");
                request.debug_info.push("Failed in Matching validatingRentals");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }
            console.error("rentalResult", rentalResult, inlineData.monthly_quota);
            request.debug_info.push("rentalResult", rentalResult, inlineData.monthly_quota);


            // validating the monthly Quota
            let monthlyQuota = validatingMonthlyQuota(fldFormData, rentalResult, inlineData.monthly_quota);

            if(!monthlyQuota.length) {
                console.error("Conditions did not match in validatingMonthlyQuota");
                request.debug_info.push("Conditions did not match in validatingMonthlyQuota");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }

            let dailyQuota = validatingDailyQuota(fldFormData, monthlyQuota, inlineData.daily_quota);

            if(!dailyQuota.length) {
                console.error("Conditions did not match in validatingDailyQuota");
                request.debug_info.push("Conditions did not match in validatingDailyQuota");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }

            let smsCount = validatingSMSValues(fldFormData, dailyQuota, inlineData.sme_field_ids);

            if(!smsCount.length) {
                console.error("Conditions did not match in validatingSMSValues");
                request.debug_info.push("Conditions did not match in validatingSMSValues");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }

            let minQuota = validateMins(fldFormData, smsCount, inlineData.min_field_ids);

            util.logInfo(request,`minQuota %j` , JSON.stringify(minQuota));
            request.debug_info.push("minQuota", JSON.stringify(minQuota));
            if(smsCount.length != minQuota.length) {
                console.error("Condition failed in validate Mins");
                request.debug_info.push("Condition failed in validate Mins");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }

            if(!sheetMatchFlag[row.sheet]) {
                console.error("First condition got matched so getting out from loop");
                request.debug_info.push("First condition got matched so getting out from loop");
                sheetMatchFlag[row.sheet] = '0';
                // break;
            }
            util.logInfo(request,`sheetMatchFlag-- %j` , JSON.stringify(sheetMatchFlag));
            request.debug_info.push("sheetMatchFlag-- " + JSON.stringify(sheetMatchFlag));
        }

        // processing sheet Match Flags

        let arrayOut = [];
        for(let key in sheetMatchFlag) {
            arrayOut.push(sheetMatchFlag[key]);
        }

        let result = arrayOut.join('+');

        result ? result = eval(result) : '';

        if(submitRejectionFormFlag || result) {

            if(workflowType == 1) {
                submitRejectionForm(request, "Rejected! One/more of the condition for trading desk approval is not met.", deskAssetData, inlineData);
            } else {
                util.logInfo(request,`Not Rejection because workflowType did not matched to current value`);
                request.debug_info.push("Not Rejection because workflowType did not matched to current value");
            }
            return;
        }

        let wfActivityDetails = await activityCommonService.getActivityDetailsPromise({ organization_id : request.organization_id }, request.workflow_activity_id);
        util.logInfo(request,`wfActivityDetails : %j` , JSON.stringify(wfActivityDetails));
        request.debug_info.push("wfActivityDetails "+ JSON.stringify(wfActivityDetails));


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
            util.logInfo(request,`Error while adding participant`);
            util.logError(request,`Error while adding participant`, { type: 'bot_engine', e });
            request.debug_info.push("Error while adding participant")
        }


        await sleep((inlineData.form_trigger_time_in_min || 0) * 60 * 1000);
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
                field_value: comment,
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
                field_value: wfActivityDetails[0].asset_id + '|' + wfActivityDetails[0].operating_asset_first_name + '|' + wfActivityDetails[0].operating_asset_id + '|' + wfActivityDetails[0].asset_first_name,
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

        util.logInfo(request,`createWorkflowRequest %j` , JSON.stringify(createWorkflowRequest));
        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        let activityInsertedDetails = await addActivityAsync(createWorkflowRequest);

        util.logInfo(request,`InactivityInsertedDetails----> %j` , activityInsertedDetails);


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


        let timelineReq = Object.assign({}, createWorkflowRequest);

        timelineReq.activity_id = request.workflow_activity_id;
        timelineReq.message_unique_id = util.getMessageUniqueId(100);
        timelineReq.track_gps_datetime = util.getCurrentUTCTime();
        timelineReq.activity_stream_type_id = 717;
        timelineReq.activity_stream_type_id = 705;
        timelineReq.timeline_stream_type_id = 705;
        timelineReq.activity_type_category_id = 48;
        timelineReq.asset_id = deskAssetData.asset_id;
        timelineReq.activity_timeline_collection = activityTimelineCollection;
        timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;

        await activityTimelineService.addTimelineTransactionAsync(timelineReq);

        try{
            await addParticipantStep({
                is_lead : 1,
                workflow_activity_id : request.activity_id,
                desk_asset_id : wfActivityDetails[0].activity_creator_asset_id,
                organization_id : request.organization_id
            });
        }catch(e) {
            util.logError(request,`Error while adding participant`, { type: 'bot_engine', e });
        }
    }

    async function checkMobilityV1 (request, inlineData, deskAssetData, requestTypeComboId, workflowType, totalCOCPAndIOIP, fldFormData) {
        request.form_id = 50079; // NON FLD form
        let submitRejectionFormFlag = 0, comment = '';
        // let fldForm = await getFormInlineData(request, 1);
        // let fldFormData = JSON.parse(fldForm.data_entity_inline).form_submitted;
        
        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 "+ JSON.stringify(fldFormData));


        // let totalCOCPAndIOIP = countCOCPAndIOIP(fldFormData, inlineData.plans_field_ids);

        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 totalCOCPAndIOIP "+ totalCOCPAndIOIP);

        let sheets = [], connectionType = '';
        if(totalCOCPAndIOIP[0].cocp > 0 && totalCOCPAndIOIP[0].cocpr > 0 && (totalCOCPAndIOIP[0].ioip + totalCOCPAndIOIP[0].ioip) == 0) {
            sheets.push(1,2);
            connectionType = 'COCP';
        } else if(totalCOCPAndIOIP[0].cocp > 0 && (totalCOCPAndIOIP[0].ioip + totalCOCPAndIOIP[0].ioip) == 0) {
            sheets.push(2);
            connectionType = 'COCP';
        } else  if(totalCOCPAndIOIP[0].cocpr > 0 && (totalCOCPAndIOIP[0].ioip + totalCOCPAndIOIP[0].ioip) == 0) {
            sheets.push(1);
            connectionType = 'COCP';
        } else if((totalCOCPAndIOIP[0].ioip + totalCOCPAndIOIP[0].ioip) > 0 && (totalCOCPAndIOIP[0].cocp + totalCOCPAndIOIP[0].cocpr) >= 0) {
            sheets.push(3);
            connectionType = 'IOIP';
        }

        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Sheet Selected is "+ sheets + " and the connection type is "+ connectionType);

        let configSheets =  inlineData.field_values_map[connectionType] || [];

        if(!configSheets.length) {
            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 No Sheet Selected");
        }

        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 configSheets "+ JSON.stringify(configSheets));

        let checkingSegmentResult = validatingSegment(fldFormData, inlineData.segment_config, configSheets, sheets);
        if(!checkingSegmentResult.length) {
            console.error("Segment is not matched");
            submitRejectionFormFlag = 1;
        }

        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 checkingSegmentResult "+ JSON.stringify(checkingSegmentResult));

        let sheetMatchFlag = {};
        for(let row of checkingSegmentResult) {
            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Processing Sheet "+ row.sheet);
            request.debug_info.push("Processing Sheet ", row.sheet);
            comment = row.comment;

            if(sheetMatchFlag[row.sheet] && sheetMatchFlag[row.sheet] == '0') {
                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Already matched for sheet "+ row.sheet+ ' so skipping and checking for next sheet if there is');
                request.debug_info.push("Already matched for sheet ", row.sheet, ' so skipping and checking for next sheet if there is');
                continue;
            }

            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 row.key----> "+ JSON.stringify(row.key));
            request.debug_info.push("row.key---->", JSON.stringify(row.key));
            if(!(row.value.key.indexOf(parseInt(requestTypeComboId)) > -1)) {
                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Request Type Match Failed requestTypeComboId "+ requestTypeComboId);
                request.debug_info.push("Request Type Match Failed requestTypeComboId ", requestTypeComboId);
                sheetMatchFlag[row.sheet] = '1';
                continue;
            } else {
                sheetMatchFlag[row.sheet] = '0';
            }

            // // validating COCP and IOIP
            // let totalLinks = validatingCocpAndIoip(fldFormData, inlineData.plans_field_ids);
            //
            // if(!totalLinks.length) {
            //     console.error("Failed in Matching validatingCocpAndIoip");
            //     request.debug_info.push("Failed in Matching validatingCocpAndIoip");
            //     continue;
            // }

            // validating No of Links

            // selecting Comments for approval


            let linkResponse = validatingNoOfLinks(row.value.value, totalCOCPAndIOIP, row.sheet);

            if(!linkResponse) {
                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 NO of Links are not matched");
                request.debug_info.push("NO of Links are not matched");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }

            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 linkResponse " + JSON.stringify(linkResponse));
            request.debug_info.push("linkResponse",linkResponse);

            // Checking Rentals
            let rentalResult = validatingRentals(fldFormData, inlineData.rental_field_ids, linkResponse);

            // check for empty plans
            if(!rentalResult[0] && !rentalResult[1] && !rentalResult[2] && !rentalResult[3] && !rentalResult[4]) {
                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Failed in Matching validatingRentals");
                request.debug_info.push("Failed in Matching validatingRentals");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }

            if(!rentalResult || !rentalResult.length) {
                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Failed in Matching validatingRentals");
                request.debug_info.push("Failed in Matching validatingRentals");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }
            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 rentalResult " +  JSON.stringify(rentalResult) + " monthly_quota " + JSON.stringify(inlineData.monthly_quota));
            request.debug_info.push("rentalResult", rentalResult, inlineData.monthly_quota);


            // validating the monthly Quota
            let monthlyQuota = validatingMonthlyQuota(fldFormData, rentalResult, inlineData.monthly_quota);

            if(!monthlyQuota.length) {
                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Conditions did not match in validatingMonthlyQuota");
                request.debug_info.push("Conditions did not match in validatingMonthlyQuota");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }

            let dailyQuota = validatingDailyQuota(fldFormData, monthlyQuota, inlineData.daily_quota);

            if(!dailyQuota.length) {
                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Conditions did not match in validatingDailyQuota");
                request.debug_info.push("Conditions did not match in validatingDailyQuota");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }

            let smsCount = validatingSMSValues(fldFormData, dailyQuota, inlineData.sme_field_ids);
            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 smsCount ", JSON.stringify(smsCount));
            
            if(!smsCount.length) {
                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Conditions did not match in validatingSMSValues");
                request.debug_info.push("Conditions did not match in validatingSMSValues");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }

            let minQuota = validateMins(fldFormData, smsCount, inlineData.min_field_ids);

            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 minQuota "+ JSON.stringify(minQuota));
            request.debug_info.push("minQuota", JSON.stringify(minQuota));
            if(smsCount.length != minQuota.length) {
                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Condition failed in validate Mins");
                request.debug_info.push("Condition failed in validate Mins");
                sheetMatchFlag[row.sheet] = '1';
                continue;
            }

            if(!sheetMatchFlag[row.sheet]) {
                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 First condition got matched so getting out from loop");
                request.debug_info.push("First condition got matched so getting out from loop");
                sheetMatchFlag[row.sheet] = '0';
                // break;
            }
            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 sheetMatchFlag--"+ JSON.stringify(sheetMatchFlag));
            request.debug_info.push("sheetMatchFlag-- " + JSON.stringify(sheetMatchFlag));
        }

        // processing sheet Match Flags

        let arrayOut = [];
        for(let key in sheetMatchFlag) {
            arrayOut.push(sheetMatchFlag[key]);
        }

        let result = arrayOut.join('+');

        result ? result = eval(result) : '';

        if(submitRejectionFormFlag || result) {

            if(workflowType == 1) {
                submitRejectionForm(request, "Rejected! One/more of the condition for trading desk approval is not met.", deskAssetData, inlineData);
                return 0;
            }

            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Not Rejection because workflowType did not matched to current value");

            return 1;
        }

        let wfActivityDetails = await activityCommonService.getActivityDetailsPromise({ organization_id : request.organization_id }, request.workflow_activity_id);
        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 wfActivityDetails "+ JSON.stringify(wfActivityDetails));

        // try{
        //     await addParticipantStep({
        //         is_lead : 1,
        //         workflow_activity_id : request.activity_id,
        //         desk_asset_id : 0,
        //         phone_number : inlineData.phone_number,
        //         country_code : "",
        //         organization_id : request.organization_id,
        //         asset_id : wfActivityDetails[0].activity_creator_asset_id
        //     });
        // }catch(e) {
        //     logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Error while adding participant")
        // }

        // try{
        //     await addParticipantStep({
        //         is_lead : 1,
        //         workflow_activity_id : request.activity_id,
        //         desk_asset_id : wfActivityDetails[0].activity_creator_asset_id,
        //         organization_id : request.organization_id
        //     });
        // }catch(e) {
        //     console.log("Error while adding participant")
        // }

        let planConfig = {}, activityDetails = '', activityTypeId = '', aovValue = '';

        let requestInlineData = JSON.parse(request.activity_inline_data)
        for(let row of requestInlineData) {
            if(parseInt(row.field_id) == 225020) {
                planConfig = row;
            }

            if(parseInt(row.field_id) == 218728) {
                activityDetails = row.field_value;
            }
        }

        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 activityDetails----", activityDetails);
        let activityTypeDetails = await getActivityTypeIdBasedOnActivityId(request, request.organization_id, activityDetails.split('|')[0]);

        if(activityTypeDetails.length) {
            activityTypeId = activityTypeDetails[0].activity_type_id;
            // return;
        } else {
            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 activityTypeDetails found empty");
        }

        let fieldValue = parseInt(planConfig.data_type_combo_id) == 3 ? "New Plan Configuration" : (activityTypeId == '149752' ? 'Bid / Tender' : 'Other workflow');
        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 Will be assigned to the required team");

        if(activityTypeId == '149752') {
            logger.info(request.workflow_activity_id +" : larger DOA : checkCustomBotV1 :activityTypeDetails found "+ activityTypeId + " so going to wintogether");
            return;
        }
        request.team_title = "commercial L1";
        request.decision_type_value = fieldValue;
        request.aovValue = request.mobilityAovValue;

        triggerArpForm(request);

        await sleep((inlineData.form_trigger_time_in_min || 0) * 60 * 1000);
        await sleep(3 * 1000); // putting manual delay so that arp should be triggered before auto approve
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
                field_value: comment,
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
                field_value: wfActivityDetails[0].activity_creator_asset_id + '|' + wfActivityDetails[0].activity_creator_asset_first_name + '|' + wfActivityDetails[0].activity_creator_asset_id + '|' + wfActivityDetails[0].activity_creator_first_name,
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

        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 createWorkflowRequest", JSON.stringify(createWorkflowRequest));
        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        let activityInsertedDetails = await addActivityAsync(createWorkflowRequest);

        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :checkMobilityV1 activityInsertedDetails---->", activityInsertedDetails);


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


        let timelineReq = Object.assign({}, createWorkflowRequest);

        timelineReq.activity_id = request.workflow_activity_id;
        timelineReq.message_unique_id = util.getMessageUniqueId(100);
        timelineReq.track_gps_datetime = util.getCurrentUTCTime();
        timelineReq.activity_stream_type_id = 717;
        timelineReq.activity_stream_type_id = 705;
        timelineReq.timeline_stream_type_id = 705;
        timelineReq.activity_type_category_id = 48;
        timelineReq.asset_id = 100;
        timelineReq.activity_timeline_collection = activityTimelineCollection;
        timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;

        await activityTimelineService.addTimelineTransactionAsync(timelineReq);

    }

    function validatingSegment(formData, segment, configSheets, sheets) {
        let response = [];
        for(let row of formData) {
            if (segment[row.field_id]) {
                util.logInfo(request,`Value found in Segment ${segment[row.field_id]} ${row.field_value.toUpperCase()}`);
                for(let config of configSheets) {
                    if(config.key.indexOf(row.field_value.toUpperCase()) > -1 && sheets.indexOf(config.sheet) > -1) {
                        response.push(config);
                    }
                }
            }
        }

        return response;
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
            util.logInfo(request,`fieldIds %j` , {fieldIds,plan});

            totalLink.push(Number(plan[fieldIds[0]]));

        }
        util.logInfo(request,`totalLinks %j` , totalLink);
        return totalLink;
    }

    function validatingRentals(formData, rentalFieldIds, mobiltiyFieldsValues) {
        util.logInfo(request,`Testing Rentals %j`, request);
        let response = [];
        util.logInfo(request,`validatingRentals mobiltiyFieldsValues %j` , Object.keys(mobiltiyFieldsValues));
        for(let row of formData) {
            if(rentalFieldIds.includes(Number(row.field_id))) {
                util.logInfo(request,`Getting this value to match in Rentals ${row.field_value}`);

                if(row.field_value == '') {
                    util.logInfo(request,`Got Empty Value in validatingRentals for plan ${rentalFieldIds.indexOf(row.field_id) + 1}`);
                    response.push('');
                    continue;
                }

                if(row.field_value != null) {
                    if(mobiltiyFieldsValues[Number(row.field_value)] == null || mobiltiyFieldsValues[Number(row.field_value)] == undefined) {
                        util.logInfo(request,`Got empty value in validatingRentals`);
                        return [];
                    }
                    response.push(mobiltiyFieldsValues[Number(row.field_value)]);
                }
            }
        }
        return response;
    }


    function validatingNoOfLinks(configSheet, totalLinks, sheet) {
        util.logInfo(request,`Validating No of Links %j` , {totalLinks,sheet});

        for(let i = 0; i < totalLinks.length; i++) {
            for(let row of configSheet) {
                if(row.LOWER) {

                    if(sheet == 1) {
                        util.logInfo(request,`row sheet 1-> ${row.LOWER} ${row.UPPER} ${totalLinks[i]} ${totalLinks[i].cocpr > row.LOWER} ${totalLinks[i].cocpr < row.UPPER} ${row.value}`);
                        if(totalLinks[i].cocpr >= row.LOWER) {
                            if(row.UPPER) {
                                if(totalLinks[i].cocpr < row.UPPER) {
                                    return row.value;
                                }
                                util.logInfo(request,`Did not match for total ${totalLinks[i]} Link value  ${row.LOWER} ${row.UPPER}`);
                                continue;
                            }
                            return row.value;
                        }
                    } else if(sheet == 2) {
                        util.logInfo(request,`row sheet 2-> ${row.LOWER} ${row.UPPER} ${totalLinks[i]} ${totalLinks[i].cocp > row.LOWER} ${totalLinks[i].cocp < row.UPPER} ${row.value}`);
                        if(totalLinks[i].cocp >= row.LOWER) {
                            if(row.UPPER) {
                                if(totalLinks[i].cocp < row.UPPER) {
                                    return row.value;
                                }
                                util.logInfo(request,`Did not match for total ${totalLinks[i]} Link value ${row.LOWER} ${row.UPPER}`);
                                continue;
                            }
                            return row.value;
                        }
                    } else if(sheet == 3) {
                        util.logInfo(request,`row 3-> ${row.LOWER} ${row.UPPER} ${totalLinks[i]} ${totalLinks[i].ioip > row.LOWER} ${totalLinks[i].ioip < row.UPPER} ${row.value}`);

                        if(totalLinks[i].ioip >= row.LOWER) {
                            if(row.UPPER) {
                                if(totalLinks[i].ioip < row.UPPER) {
                                    return row.value;
                                }
                                util.logInfo(request,`Did not match for total ${totalLinks[i]} ${row.LOWER} ${row.UPPER}`);
                                continue;
                            }
                            return row.value;
                        }
                    }
                }
            }
        }
        util.logInfo(request,`Response from validatingNoOfLinks`);
        return ;
    }

    function validatingMonthlyQuota(formData, linkResp, monthlyQuota) {

        util.logInfo(request,`Validating Monthly Quota`);
        let response = [];
        for(let row of formData) {
            for(let i =0; i < monthlyQuota.length; i++) {
                if(linkResp[i] != null) {

                    let monthlyQuotaFieldId = monthlyQuota[i];

                    if(Number(row.field_id) == monthlyQuotaFieldId) {
                        if(linkResp[i] == '') {
                            response.push('');
                            util.logInfo(request,`Got Empty Value in validatingMonthlyQuota for plan ${i + 1}`);
                            continue;
                        }
                        let monthlyQuotaValue = Object.keys(linkResp[i]);

                        util.logInfo(request,`linkResp[i] ${linkResp[i]} ${i} ${row.field_id} ${Number(row.field_value)} ${monthlyQuotaValue[0]}`);
                        if(Number(row.field_value) > Number(monthlyQuotaValue[0])) {
                            util.logInfo(request,`Got invalid value ${Number(row.field_value)} %j` , monthlyQuotaValue);
                            return []
                        }
                        util.logInfo(request,`linkResp[i][monthlyQuotaValue[0]] : %j` , linkResp[i][monthlyQuotaValue[0]]);
                        response.push(linkResp[i][monthlyQuotaValue[0]]);
                    }
                }
            }
        }

        util.logInfo(request,`Final Response in validatingMonthlyQuota %j` , response);
        return response;
    }

    function validatingDailyQuota(formData, linkResp, dailyQuota) {

        util.logInfo(request,`Validating Daily Quota`);
        let response = [];
        for(let row of formData) {
            for(let i =0; i < dailyQuota.length; i++) {
                if(linkResp[i] != null) {

                    let dailyQuotaFieldId = dailyQuota[i];

                    if(Number(row.field_id) == dailyQuotaFieldId) {
                        if(linkResp[i] == '') {
                            response.push('');
                            util.logInfo(request,`Got Empty Value in validatingDailyQuota for plan ${i + 1}`);
                            continue;
                        }
                        let dailyQuotaValue = Object.keys(linkResp[i]);

                        util.logInfo(request,`linkResp[i] ${linkResp[i]} ${i} ${row.field_id} ${Number(row.field_value)} ${dailyQuotaValue[0]}`);
                        if(Number(row.field_value) > Number(dailyQuotaValue[0])) {
                            util.logInfo(request,`Got invalid value ${Number(row.field_value)} %j` , dailyQuotaValue);
                            return [];
                        }
                        util.logInfo(request,`linkResp[i][dailyQuotaValue[0]] ${linkResp[i][dailyQuotaValue[0]]}`);
                        response.push(linkResp[i][dailyQuotaValue[0]]);
                    }
                }
            }
        }

        util.logInfo(request,`Final Response in validatingDailyQuota %j` , response);
        return response;
    }


    function validatingSMSValues(formData, monthlyQuota, smsFieldIds) {
        let response = [];
        for(let row of formData) {
            for(let i =0; i < smsFieldIds.length; i++) {
                if(monthlyQuota[i] != null) {
                    let smsFieldIdsFieldId = smsFieldIds[i];

                    if(Number(row.field_id) == smsFieldIdsFieldId) {
                        if(monthlyQuota[i] == '' ) {
                            response.push('');
                            util.logInfo(request,`Got Empty Value in validatingSMSValues for plan ${(i + 1)}`);
                            continue;
                        }
                        let smsFieldIdsValue = Object.keys(monthlyQuota[i]);

                        util.logInfo(request,`smsFieldIdsFieldId ${row.field_id} %j` , smsFieldIdsFieldId);
                        if(Number(row.field_value) > smsFieldIdsValue[0]) {
                            util.logInfo(request,`Got invalid value validatingSMSValues ${Number(row.field_value)} %j` , smsFieldIdsValue);
                            return response
                        }
                        response.push(monthlyQuota[i][smsFieldIdsValue[0]]);
                    }

                }
            }
        }
        util.logInfo(request,`Final Response in validatingSMSValues %j` , response);
        return response;
    }

    function validateMins(formData, minQuota, minFieldIds) {
        let response = [];
        for(let row of formData) {
            for(let i = 0; i < minFieldIds.length; i++) {
                if(minQuota[i] != null) {
                    if(row.field_id == minFieldIds[i]) {
                        if(minQuota[i] == '' ) {
                            response.push('');
                            util.logInfo(request,`Got Empty Value in validateMins for plan ${(i + 1)}`);
                            continue;
                        }
                        let minValue = Object.keys(minQuota[i]);
                        util.logInfo(request,`Field ids ${row.field_id} ${minFieldIds[i]} ${minValue} ${row.field_value} ${minQuota[i][row.field_value]}`);
                        if(row.field_value < Number(minValue[0])) {
                            util.logInfo(request,`Got nothing for ${minQuota[i]} ${row.field_value}`);
                            return [];
                        } else {
                            response.push(minQuota[i]);
                        }
                    }
                }
            }
        }

        return response;
    }

    function countCOCPAndIOIP(formData, COCPFieldIds) {

        let COCPAndIOIPTotal = [{cocp : 0, ioip : 0, cocpr : 0, ioipr : 0}];
        for(let i = 0; i < COCPFieldIds.length; i++) {
            let fieldIds = Object.keys(COCPFieldIds[i]);
            for(let row of formData) {
                if(row.field_id == fieldIds[0]) {
                    COCPAndIOIPTotal[0].cocp = COCPAndIOIPTotal[0].cocp + Number(row.field_value);
                } else if(row.field_id == fieldIds[1]) {
                    COCPAndIOIPTotal[0].ioip = COCPAndIOIPTotal[0].ioip + Number(row.field_value);
                } else if(row.field_id == fieldIds[2]) {
                    COCPAndIOIPTotal[0].cocpr = COCPAndIOIPTotal[0].cocpr + Number(row.field_value);
                } else if(row.field_id == fieldIds[3]) {
                    COCPAndIOIPTotal[0].ioipr = COCPAndIOIPTotal[0].ioipr + Number(row.field_value);
                }
            }
        }

        return COCPAndIOIPTotal;
    }

    async function checkSmeBot(request, inlineData, deskAssetData) {

        await sleep(2 * 1000);

        request.form_id = 50264;
        let IllForm = await getFormInlineData(request, 1);
        let IllFormData = JSON.parse(IllForm.data_entity_inline).form_submitted;

        util.logInfo(request,`IllFormData ---- %j` , JSON.stringify(IllFormData));

        let segmentFieldIds =  inlineData.segmentFieldIds;
        let netCash =  inlineData.netCash;;
        let linkFieldIds = inlineData.linkFieldIds;
        let productFieldIds = inlineData.productFieldIds;

        let orderTypeFieldIds = inlineData.orderTypeFieldIds;

        let bwFieldIds = inlineData.bwFieldIds;

        let otcFieldIds = inlineData.otcFieldIds;

        let arcFields = inlineData.arcFields;

        let contractTermsFieldIds = inlineData.contractTermsFieldIds;

        let opexFieldId =  inlineData.opexFieldId, opexValue;
        let capexFieldId =  inlineData.capexFieldId, capexValue;

        let paybackFieldId = inlineData.paybackFieldId;

        let activateDateFieldIds = inlineData.activateDateFieldIds;

        let illFormDataWithLiks = [];


        // to push the first three entries for every link to test the flow in a one go
        let temp = [IllFormData[0], IllFormData[1], IllFormData[2]], paybackData;
        for(let i = 0, j = 0; i < IllFormData.length; i++) {

            if(IllFormData[i].field_id == opexFieldId) {
                opexValue = IllFormData[i].field_value;
            } else if(IllFormData[i].field_id == capexFieldId) {
                capexValue = IllFormData[i].field_value;
            }

            if(IllFormData[i].field_id == paybackFieldId) {
                paybackData = IllFormData[i];
            }

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

        let j = 0, activationDataOfLinks = [];
        for(let row of temp) {
            if(activateDateFieldIds[j] == row.field_id) {
                activationDataOfLinks.push(row);
                j++
            }

            if(j == 20) {
                break;
            }
        }

        util.logInfo(request,`activationDataOfLinks %j` , JSON.stringify(activationDataOfLinks));
        illFormDataWithLiks.push(temp);

        for(let row of illFormDataWithLiks) {
            row.push(paybackData);
        }

        util.logInfo(request,`illFormDataWithLiks %j` , JSON.stringify(illFormDataWithLiks));

        for(let i = 0; i < illFormDataWithLiks.length; i++) {
            if(!checkValues(illFormDataWithLiks[i], productFieldIds[i], segmentFieldIds[0], orderTypeFieldIds[i], bwFieldIds[i], otcFieldIds[i], arcFields[i], contractTermsFieldIds[i], netCash[0], capexValue, opexValue, i, inlineData, activationDataOfLinks[i], paybackFieldId)) {
                console.error("Criteria did not match in SME ILL bot");
                return;
            }

            console.error("Criteria matched for ", i + 1);

        }

        let wfActivityDetails = await activityCommonService.getActivityDetailsPromise({ organization_id : request.organization_id }, request.workflow_activity_id);
        util.logInfo(request,`wfActivityDetails %j` , JSON.stringify(wfActivityDetails));


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
            util.logInfo(request,`Error while adding participant`);
            util.logError(request,`Error while adding participant %j`, { type: 'bot_engine', e });
        }


        await sleep((inlineData.form_trigger_time_in_min || 0) * 60 * 1000);
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
                field_value: 'Approved as per DOA. Based on inputs uploaded in business case under BC Input Section of data management Tab. Any future changes in BW/Cost/Solutio will lead to revision in commercial"',
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
                field_value: wfActivityDetails[0].asset_id + '|' + wfActivityDetails[0].operating_asset_first_name + '|' + wfActivityDetails[0].operating_asset_id + '|' + wfActivityDetails[0].asset_first_name,
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

        util.logInfo(request,`createWorkflowRequest %j` , JSON.stringify(createWorkflowRequest));
        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        let activityInsertedDetails = await addActivityAsync(createWorkflowRequest);

        util.logInfo(request,`activityInsertedDetails----> %j` , activityInsertedDetails);


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


        let timelineReq = Object.assign({}, createWorkflowRequest);

        timelineReq.activity_id = request.workflow_activity_id;
        timelineReq.message_unique_id = util.getMessageUniqueId(100);
        timelineReq.track_gps_datetime = util.getCurrentUTCTime();
        timelineReq.activity_stream_type_id = 717;
        timelineReq.activity_stream_type_id = 705;
        timelineReq.timeline_stream_type_id = 705;
        timelineReq.activity_type_category_id = 48;
        timelineReq.asset_id = deskAssetData.asset_id;
        timelineReq.activity_timeline_collection = activityTimelineCollection;
        timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;

        await activityTimelineService.addTimelineTransactionAsync(timelineReq);

        try{
            await addParticipantStep({
                is_lead : 1,
                workflow_activity_id : request.activity_id,
                desk_asset_id : wfActivityDetails[0].activity_creator_asset_id,
                organization_id : request.organization_id
            });
        }catch(e) {
            util.logInfo(request,`Error while adding participant`);
            util.logError(request,`Error while adding participant `, { type: 'bot_engine', e });
        }

        function checkValues(linkDetails, productFieldId, segmentFieldId, orderTypeFieldId, bwFieldId, otcFieldId, arcField, contractTermsFieldId, netCash, capexValue, opexValue, linkId, inlineData, activationDataOfLinks, paybackValue) {

            let sheetSelected = [], phase1 = 0, phase2 = 0, checkActivationDateFlag = 0;
            for(let value of inlineData.smeConstants) {
                let productF = 0, segementF = 0, orderTypeF = 0;
                for(let row of linkDetails) {
                    util.logInfo(request,`ROw Data ${row.field_id} ${row.field_value} ${productFieldId} ${segmentFieldId} ${orderTypeFieldId} ${bwFieldId} ${otcFieldId} ${arcField} ${contractTermsFieldId} ${netCash}`);
                    if(row.field_id == productFieldId) {
                        // console.log("row.field_id == productFieldId && value['1'].toLowerCase() == row.field_value.toLowerCase()", row.field_id == productFieldId && value['1'].toLowerCase() == row.field_value.toLowerCase())
                        util.logInfo(request,`Product Matched ${row.field_id} expected ${value['1']} got this ${row.field_value.toLowerCase()}`);
                        value['1'].toLowerCase() == row.field_value.toLowerCase() ? productF = 1 : 0;
                        row.field_value == '' ? productF = 1 : 0;
                        continue;
                    } else if(row.field_id == segmentFieldId) {
                        util.logInfo(request,`Segment Matched ${row.field_id} expected ${value['2']} got this ${row.field_value.toLowerCase()}`);
                        value['2'].toLowerCase() == row.field_value.toLowerCase() ? segementF = 1 : 0;
                        row.field_value == '' ? segementF = 1 : 0;
                        continue;
                    } else if(row.field_id == orderTypeFieldId) {
                        if(row.field_value.toLowerCase() == 'new link' || row.field_value.toLowerCase() == 'upgrade with capex/ opex') {
                            util.logInfo(request,`Matched Order Type capexValue, opexValue ${capexValue} ${opexValue}`);
                            orderTypeF = 1;

                            if(capexValue > 0 || (capexValue > 0 && opexValue > 0)) {
                                util.logInfo(request,`Sheet Selected Sheet 1`);
                                sheetSelected = inlineData.smeSheet1;
                            } else if(opexValue > 0){
                                util.logInfo(request,`Sheet Selected Sheet 3`);
                                sheetSelected = inlineData.smeSheet3;
                            }
                        } else if(row.field_value.toLowerCase() == 'price revision' || row.field_value.toLowerCase() == 'downgrade') {
                            util.logInfo(request,`Matched Order Type capexValue, opexValue ${capexValue} ${opexValue}`);
                            orderTypeF = 1;

                            if(capexValue > 0 || (capexValue > 0 && opexValue > 0)) {
                                util.logInfo(request,`Sheet Selected Sheet 2`);
                                checkActivationDateFlag = 1;
                                sheetSelected = inlineData.smeSheet2;
                            } else if(opexValue > 0){
                                util.logInfo(request,`Sheet Selected Sheet 4`);
                                checkActivationDateFlag = 1;
                                sheetSelected = inlineData.smeSheet4;
                            }
                        } else if(row.field_value == '') {
                            console.error("Got Empty values while checking capexValue opexValue");
                            orderTypeF = 1;
                            if(capexValue > 0 || (capexValue > 0 && opexValue > 0)) {
                                util.logInfo(request,`Sheet Selected Sheet 2`);
                                sheetSelected = inlineData.smeSheet2;
                            } else if(opexValue > 0){
                                util.logInfo(request,`Sheet Selected Sheet 4`);
                                sheetSelected = inlineData.smeSheet4;
                            }
                        }
                        continue;
                    }
                }

                util.logInfo(request,`productF && segementF && orderTypeF ${productF} ${segementF} ${orderTypeF}`);
                if(productF && segementF && orderTypeF){
                    util.logInfo(request,`Got match in phase 1`);
                    phase1 = {productF, segementF, orderTypeF};
                    break;
                }
                else {
                    productF = 0, segementF = 0, orderTypeF = 0;
                    util.logInfo(request,`Reset Params phase 1. Checking for new`);
                }

            }

            if(!Object.keys(phase1).length) {
                console.error("Matching Failed in Product, Segment, orderTypeF");
                return false;
            }

            util.logInfo(request,`Executing new sheet %j` , sheetSelected);
            for(let value of sheetSelected) {

                let bwF = 0, otcF = 0, arcF = 0, contractF = 0, netCashF = 0, paybackF = 0;
                for(let row of linkDetails) {
                    util.logInfo(request,`bwF && otcF && arcF && contractF && netCashF loop ${row.field_id} ${row.field_name} ${row.field_value}`);
                    if(row.field_id == bwFieldId) {
                        util.logInfo(request,`BW Match ) ${row.field_id} ${bwFieldId} ${Number(row.field_value)} ${Number(value['4'])}`);
                        Number(row.field_value) == Number(value['4']) ? bwF = 1 : 0;
                        row.field_value == '' ? bwF = 1 : 0;
                        continue;
                    } else if(row.field_id == otcFieldId) {
                        util.logInfo(request,`otcF ${row.field_id} ${otcFieldId} ${Number(row.field_value)} ${Number(value['5'])}`);
                        Number(row.field_value) >= Number(value['5']) ? otcF = 1 : 0;
                        row.field_value == '' ? otcF = 1 : 0;
                        continue;
                    } else if(row.field_id == arcField) {
                        util.logInfo(request,`arcF ${row.field_id} ${arcField} ${Number(row.field_value)} ${Number(value['6'])}`);
                        Number(row.field_value) >= Number(value['6']) ? arcF = 1 : 0;
                        row.field_value == '' ? arcF = 1 : 0;
                        continue;
                    } else if(row.field_id == contractTermsFieldId) {
                        util.logInfo(request,`contractF ${row.field_id} ${contractTermsFieldId} ${Number(row.field_value)} ${Number(value['7'])}`);
                        if(checkActivationDateFlag) {
                            let yearsDiff = moment(new Date()).diff(new Date(activationDataOfLinks.field_value), 'years', true);
                            util.logInfo(request,`Months Difference is ${yearsDiff} ${new Date()} ${new Date(activationDataOfLinks.field_value)} ${activationDataOfLinks.field_value}`);
                            yearsDiff >= Number(value['7']) ? contractF = 1 : 0;

                        } else {
                            Number(row.field_value) >= Number(value['7']) ? contractF = 1 : 0;
                        }
                        row.field_value == '' ? contractF = 1 : 0;
                        continue;
                    } else if(row.field_id == netCash) {
                        util.logInfo(request,`netCashF ${row.field_id} ${netCash} ${Number(row.field_value)} ${Number(value['8'])}`);
                        Number(row.field_value) >= Number(value['8']) ? netCashF = 1 : 0;
                        row.field_value == '' ? netCashF = 1 : 0;
                        continue;
                    } else if(row.field_id == paybackFieldId) {
                        util.logInfo(request,`Checking for Pay back fields`);

                        if(row.field_value <= value['9']) {
                            util.logInfo(request,`Value matched in pay back value`);
                            paybackF = 1;
                        }
                        row.field_value == '' ? paybackF = 1 : 0;
                        continue;
                    }
                }

                util.logInfo(request,`bwF && otcF && arcF && contractF && netCashF && paybackF ${bwF} ${otcF} ${arcF} ${contractF} ${netCashF} ${paybackF}`);
                if(bwF && otcF && arcF && contractF && netCashF && paybackF) {
                    util.logInfo(request,`Got match in phase 2 link ${linkId}`);
                    phase2 = {bwF, otcF, arcF, contractF, netCashF, paybackF};
                    return true;
                } else {
                    util.logInfo(request,`Reset In phase 2. Checking for new`);
                    bwF = 0, otcF = 0, arcF = 0, contractF = 0, netCashF = 0, paybackF = 0;
                }
            }
            return 0;
        }

    }

    async function checkSmeBotV1(request, inlineData, deskAssetData, IllFormData) {

        await sleep(2 * 1000);

        // request.form_id = 50264;
        // let IllForm = await getFormInlineData(request, 1);
        // let IllFormData = JSON.parse(IllForm.data_entity_inline).form_submitted;

        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :---- "+ JSON.stringify(IllFormData));

        let segmentFieldIds =  inlineData.segmentFieldIds;
        let netCash =  inlineData.netCash;;
        let linkFieldIds = inlineData.linkFieldIds;
        let productFieldIds = inlineData.productFieldIds;

        let orderTypeFieldIds = inlineData.orderTypeFieldIds;

        let bwFieldIds = inlineData.bwFieldIds;

        let otcFieldIds = inlineData.otcFieldIds;

        let arcFields = inlineData.arcFields;

        let contractTermsFieldIds = inlineData.contractTermsFieldIds;

        let opexFieldId =  inlineData.opexFieldId, opexValue;
        let capexFieldId =  inlineData.capexFieldId, capexValue;

        let paybackFieldId = inlineData.paybackFieldId;

        let activateDateFieldIds = inlineData.activateDateFieldIds;

        let illFormDataWithLiks = [];


        // to push the first three entries for every link to test the flow in a one go
        let temp = [IllFormData[0], IllFormData[1], IllFormData[2]], paybackData;
        for(let i = 0, j = 0; i < IllFormData.length; i++) {

            if(IllFormData[i].field_id == opexFieldId) {
                opexValue = IllFormData[i].field_value;
            } else if(IllFormData[i].field_id == capexFieldId) {
                capexValue = IllFormData[i].field_value;
            }

            if(IllFormData[i].field_id == paybackFieldId) {
                paybackData = IllFormData[i];
            }

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

        let j = 0, activationDataOfLinks = [];
        for(let row of temp) {
            if(activateDateFieldIds[j] == row.field_id) {
                activationDataOfLinks.push(row);
                j++
            }

            if(j == 20) {
                break;
            }
        }

        
        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :activationDataOfLinks "+ JSON.stringify(activationDataOfLinks));
        illFormDataWithLiks.push(temp);

        for(let row of illFormDataWithLiks) {
            row.push(paybackData);
        }

        
        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :illFormDataWithLiks " + JSON.stringify(illFormDataWithLiks));

        for(let i = 0; i < illFormDataWithLiks.length; i++) {
            if(!checkValues(illFormDataWithLiks[i], productFieldIds[i], segmentFieldIds[0], orderTypeFieldIds[i], bwFieldIds[i], otcFieldIds[i], arcFields[i], contractTermsFieldIds[i], netCash[0], capexValue, opexValue, i, inlineData, activationDataOfLinks[i], paybackFieldId)) {
                console.error("Criteria did not match in SME ILL bot");
                return 1;
            }

            console.error("Criteria matched for ", i + 1);

        }

        let wfActivityDetails = await activityCommonService.getActivityDetailsPromise({ organization_id : request.organization_id }, request.workflow_activity_id);
        
        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :wfActivityDetails "+ JSON.stringify(wfActivityDetails));


        // try{
        //     await addParticipantStep({
        //         is_lead : 1,
        //         workflow_activity_id : request.activity_id,
        //         desk_asset_id : 0,
        //         phone_number : inlineData.phone_number,
        //         country_code : "",
        //         organization_id : request.organization_id,
        //         asset_id : wfActivityDetails[0].activity_creator_asset_id
        //     });
        // }catch(e) {
        //     
        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :Error while adding participant")
        // }

        // try{
        //     await addParticipantStep({
        //         is_lead : 1,
        //         workflow_activity_id : request.activity_id,
        //         desk_asset_id : wfActivityDetails[0].activity_creator_asset_id,
        //         organization_id : request.organization_id
        //     });
        // }catch(e) {
        //     console.log("Error while adding participant")
        // }



        let planConfig = {}, activityDetails = '', activityTypeId = '', aovValue = '';

        let requestInlineData = JSON.parse(request.activity_inline_data)
        for(let row of requestInlineData) {
            if(parseInt(row.field_id) == 308742) {
                planConfig = row;
            }

            if(parseInt(row.field_id) == 218728) {
                activityDetails = row.field_value;
            }
        }
        
        util.logInfo(request,`activityDetails---- %j` , activityDetails);
        let activityTypeDetails = await getActivityTypeIdBasedOnActivityId(request, request.organization_id, activityDetails.split('|')[0]);

        if(activityTypeDetails.length) {
            activityTypeId = activityTypeDetails[0].activity_type_id;
            // return;
        } else {
            console.error("activityTypeDetails found empty");
        }

        let fieldValue = planConfig.data_type_combo_id == 3 ? "New Plan Configuration" : (activityTypeId == '149752' ? 'Bid / Tender' : 'Other workflow');
        logger.info(request.workflow_activity_id + " Will be assigned to the required team");

        request.team_title = "commercial L1";
        request.decision_type_value = fieldValue;
        request.aovValue = request.fldAovValue;

        triggerArpForm(request);

        await sleep((inlineData.form_trigger_time_in_min || 0) * 60 * 1000);
        await sleep(3 * 1000);
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
                field_value: 'Approved as per DOA. Based on inputs uploaded in business case under BC Input Section of data management Tab. Any future changes in BW/Cost/Solutio will lead to revision in commercial',
                //field_value: 'Approved considering MNP acquisition requirement',
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
                field_value: wfActivityDetails[0].activity_creator_asset_id + '|' + wfActivityDetails[0].activity_creator_asset_first_name + '|' + wfActivityDetails[0].activity_creator_asset_id + '|' + wfActivityDetails[0].activity_creator_first_name,
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

        
        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :createWorkflowRequest "+ JSON.stringify(createWorkflowRequest));
        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        let activityInsertedDetails = await addActivityAsync(createWorkflowRequest);

        
        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 :activityInsertedDetails----> "+ JSON.stringify(activityInsertedDetails));


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


        let timelineReq = Object.assign({}, createWorkflowRequest);

        timelineReq.activity_id = request.workflow_activity_id;
        timelineReq.message_unique_id = util.getMessageUniqueId(100);
        timelineReq.track_gps_datetime = util.getCurrentUTCTime();
        timelineReq.activity_stream_type_id = 717;
        timelineReq.activity_stream_type_id = 705;
        timelineReq.timeline_stream_type_id = 705;
        timelineReq.activity_type_category_id = 48;
        timelineReq.asset_id = 100;
        timelineReq.activity_timeline_collection = activityTimelineCollection;
        timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;

        await activityTimelineService.addTimelineTransactionAsync(timelineReq);

        function checkValues(linkDetails, productFieldId, segmentFieldId, orderTypeFieldId, bwFieldId, otcFieldId, arcField, contractTermsFieldId, netCash, capexValue, opexValue, linkId, inlineData, activationDataOfLinks, paybackValue) {

            let sheetSelected = [], phase1 = 0, phase2 = 0, checkActivationDateFlag = 0;
            for(let value of inlineData.smeConstants) {
                let productF = 0, segementF = 0, orderTypeF = 0;
                for(let row of linkDetails) {
                    logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : ROw Data " + JSON.stringify([row.field_id , row.field_value , productFieldId , segmentFieldId , orderTypeFieldId , bwFieldId , otcFieldId , arcField , contractTermsFieldId , netCash]));
                    if(row.field_id == productFieldId) {
                        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Product Matched " + row.field_id + "expected ",value['1'] + "got this " + row.field_value.toLowerCase());
                        value['1'].toLowerCase() == row.field_value.toLowerCase() ? productF = 1 : 0;
                        row.field_value == '' ? productF = 1 : 0;
                        continue;
                    } else if(row.field_id == segmentFieldId) {
                        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Segment Matched " + row.field_id + "expected ",value['2'] + "got this " + row.field_value.toLowerCase());
                        value['2'].toLowerCase() == row.field_value.toLowerCase() ? segementF = 1 : 0;
                        row.field_value == '' ? segementF = 1 : 0;
                        continue;
                    } else if(row.field_id == orderTypeFieldId) {
                        if(row.field_value.toLowerCase() == 'new link' || row.field_value.toLowerCase() == 'upgrade with capex/ opex') {
                            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Matched Order Type capexValue + opexValue " + capexValue +" opex value "+ opexValue);
                            orderTypeF = 1;

                            if(capexValue > 0 || (capexValue > 0 && opexValue > 0)) {
                                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Sheet Selected Sheet 1");
                                sheetSelected = inlineData.smeSheet1;
                            } else if(opexValue > 0){
                                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Sheet Selected Sheet 3");
                                sheetSelected = inlineData.smeSheet3;
                            }
                        } else if(row.field_value.toLowerCase() == 'price revision' || row.field_value.toLowerCase() == 'downgrade') {
                            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Matched Order Type capexValue + opexValue " + capexValue +" opex value "+ opexValue);
                            orderTypeF = 1;

                            if(capexValue > 0 || (capexValue > 0 && opexValue > 0)) {
                                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Sheet Selected Sheet 2");
                                checkActivationDateFlag = 1;
                                sheetSelected = inlineData.smeSheet2;
                            } else if(opexValue > 0){
                                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Sheet Selected Sheet 4");
                                checkActivationDateFlag = 1;
                                sheetSelected = inlineData.smeSheet4;
                            }
                        } else if(row.field_value == '') {
                            console.error("Got Empty values while checking capexValue opexValue");
                            orderTypeF = 1;
                            if(capexValue > 0 || (capexValue > 0 && opexValue > 0)) {
                                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Sheet Selected Sheet 2");
                                sheetSelected = inlineData.smeSheet2;
                            } else if(opexValue > 0){
                                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Sheet Selected Sheet 4");
                                sheetSelected = inlineData.smeSheet4;
                            }
                        }
                        continue;
                    }
                }

                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : productF && segementF && orderTypeF " + JSON.stringify({productF , segementF, orderTypeF}));
                if(productF && segementF && orderTypeF){
                    logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Got match in phase 1");
                    phase1 = {productF, segementF, orderTypeF};
                    break;
                }
                else {
                    productF = 0, segementF = 0, orderTypeF = 0;
                    logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Reset Params phase 1. Checking for new");
                }

            }

            if(!Object.keys(phase1).length) {
                console.error("Matching Failed in Product, Segment, orderTypeF");
                return false;
            }

            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Executing new sheet " + sheetSelected);
            for(let value of sheetSelected) {

                let bwF = 0, otcF = 0, arcF = 0, contractF = 0, netCashF = 0, paybackF = 0;
                for(let row of linkDetails) {
                    logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : bwF && otcF && arcF && contractF && netCashF loop " + JSON.stringify([ row.field_id, row.field_name, row.field_value]));
                    if(row.field_id == bwFieldId) {
                        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : BW Match ) " + JSON.stringify([ row.field_id, bwFieldId, Number(row.field_value), Number(value['4'])]));
                        Number(row.field_value) == Number(value['4']) ? bwF = 1 : 0;
                        row.field_value == '' ? bwF = 1 : 0;
                        continue;
                    } else if(row.field_id == otcFieldId) {
                        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : otcF " + JSON.stringify([ row.field_id , otcFieldId , Number(row.field_value) , Number(value['5'])]));
                        Number(row.field_value) >= Number(value['5']) ? otcF = 1 : 0;
                        row.field_value == '' ? otcF = 1 : 0;
                        continue;
                    } else if(row.field_id == arcField) {
                        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : arcF " + JSON.stringify([ row.field_id, arcField,  Number(row.field_value), Number(value['6'])]));
                        Number(row.field_value) >= Number(value['6']) ? arcF = 1 : 0;
                        row.field_value == '' ? arcF = 1 : 0;
                        continue;
                    } else if(row.field_id == contractTermsFieldId) {
                        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : contractF " + JSON.stringify([ row.field_id, contractTermsFieldId, Number(row.field_value), Number(value['7'])]));
                        if(checkActivationDateFlag) {
                            let yearsDiff = moment(new Date()).diff(new Date(activationDataOfLinks.field_value), 'years', true);
                            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Months Difference is " + JSON.stringify([ yearsDiff, new Date(), new Date(activationDataOfLinks.field_value), activationDataOfLinks.field_value]));
                            yearsDiff >= Number(value['7']) ? contractF = 1 : 0;

                        } else {
                            Number(row.field_value) >= Number(value['7']) ? contractF = 1 : 0;
                        }
                        row.field_value == '' ? contractF = 1 : 0;
                        continue;
                    } else if(row.field_id == netCash) {
                        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : netCashF " + JSON.stringify([ row.field_id, netCash , Number(row.field_value) , Number(value['8'])]));
                        Number(row.field_value) >= Number(value['8']) ? netCashF = 1 : 0;
                        row.field_value == '' ? netCashF = 1 : 0;
                        continue;
                    } else if(row.field_id == paybackFieldId) {
                        logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Checking for Pay back fields");

                        if(row.field_value <= value['9']) {
                            logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Value matched in pay back value");
                            paybackF = 1;
                        }
                        row.field_value == '' ? paybackF = 1 : 0;
                        continue;
                    }
                }

                logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : bwF && otcF && arcF && contractF && netCashF && paybackF " + JSON.stringify([ bwF, otcF, arcF, contractF, netCashF, paybackF]));
                if(bwF && otcF && arcF && contractF && netCashF && paybackF) {
                    logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Got match in phase 2 link" + linkId);
                    phase2 = {bwF, otcF, arcF, contractF, netCashF, paybackF};
                    return true;
                } else {
                    logger.info(request.workflow_activity_id+" : larger DOA : checkCustomBotV1 : checkSmeBotV1 : Reset In phase 2. Checking for new");
                    bwF = 0, otcF = 0, arcF = 0, contractF = 0, netCashF = 0, paybackF = 0;
                }
            }
            return 0;
        }

    }

    async function submitRejectionForm(request, reason, deskAssetData, inlineData) {
        util.logInfo(request,`Processing Rejection Form`);
        try {
            let planConfig = {}, activityDetails = '', activityTypeId = '', aovValue = '', productId = '';

            let requestInlineData = JSON.parse(request.activity_inline_data)
            for(let row of requestInlineData) {
                if(parseInt(row.field_id) == 308742) {
                    planConfig = row;
                }
    
                if(parseInt(row.field_id) == 218728) {
                    activityDetails = row.field_value;
                }
                    
                if(parseInt(row.field_id) == 224835) {
                    productId = parseInt(row.data_type_combo_id);
                }
            }
            
            util.logInfo(request,`activityDetails---- %j` , activityDetails);
            let activityTypeDetails = await getActivityTypeIdBasedOnActivityId(request, request.organization_id, activityDetails.split('|')[0]);
    
            if(activityTypeDetails.length) {
                activityTypeId = activityTypeDetails[0].activity_type_id;
                
            } else {
                console.error("activityTypeDetails found empty");
            }
    
            let fieldValue = planConfig.data_type_combo_id == 3 ? "New Plan Configuration" : (activityTypeId == '149752' ? 'Bid / Tender' : 'Other workflow');
            util.logInfo(request,`Will be assigned to the required team`);
    
            request.team_title = "commercial L1";
            request.decision_type_value = fieldValue;
            request.aovValue = productId == 3 ? request.mobilityAovValue : request.fldAovValue;
            triggerArpForm(request);
           
            const getBotworkflowStepsByFormV1 = async (request) => {
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
            let botDetails = await getBotworkflowStepsByFormV1({
                "organization_id": request.organization_id,
                "form_id": 4430,
                "field_id": 0,
                "bot_id": 0, // request.bot_id,
                "page_start": 0,
                "page_limit": 50
            });

            try {
                let botData;
                for(let row of botDetails) {
                    if(row.bot_operation_type_id == 1) {
                        botData = row;
                        break;
                    }
                }

                util.logInfo(request,`botData--- %j` , botData);

                if(!botData) {
                    console.error("Bot data was not found so lead would not be added before form submission");
                }

                botData = JSON.parse(botData.bot_operation_inline_data).bot_operations.participant_add.static;

                util.logInfo(request,`Final=----- %j` , botData);
                let wfActivityDetails = await activityCommonService.getActivityDetailsPromise({ organization_id : request.organization_id }, request.workflow_activity_id);
                util.logInfo(request,`wfActivityDetails %j` , JSON.stringify(wfActivityDetails));


                await addParticipantStep({
                    is_lead : 1,
                    workflow_activity_id : request.activity_id,
                    desk_asset_id : 0,
                    phone_number : botData.phone_number,
                    country_code : "",
                    organization_id : request.organization_id,
                    asset_id : wfActivityDetails[0].activity_creator_asset_id
                });
            } catch (e) {
                util.logError(request,`Error while adding participant while form is rejected ` + e.stack, { type: 'bot_engine', e });
            }


            await sleep((inlineData.form_trigger_time_in_min || 0) * 60 * 1000);

            let createWorkflowRequest                       = Object.assign({}, request);

            createWorkflowRequest.activity_inline_data      = JSON.stringify([
                {
                    "form_id": 4430,
                    "field_id": "220023",
                    "field_name": "Reasons for Rejection",
                    "field_value": reason,
                    "message_unique_id": 1604647824383,
                    "data_type_combo_id": 0,
                    "field_data_type_id": 20,
                    "data_type_combo_value": "0",
                    "field_data_type_category_id": 7
                },
                {
                    "form_id": 4430,
                    "field_id": "225207",
                    "field_name": "Document Upload",
                    "field_value": "",
                    "message_unique_id": 1604647846404,
                    "data_type_combo_id": 0,
                    "field_data_type_id": 72,
                    "data_type_combo_value": "0",
                    "field_data_type_category_id": 13
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
            createWorkflowRequest.activity_form_id    = 4430;
            createWorkflowRequest.form_id    = 4430;

            createWorkflowRequest.activity_datetime_start = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            createWorkflowRequest.activity_datetime_end   = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            // delete createWorkflowRequest.activity_id;
            createWorkflowRequest.device_os_id = 7;

            const targetFormActivityID = await cacheWrapper.getActivityIdPromise();
            const targetFormTransactionID = await cacheWrapper.getFormTransactionIdPromise();
            createWorkflowRequest.activity_id = targetFormActivityID;
            createWorkflowRequest.form_transaction_id = targetFormTransactionID;
            createWorkflowRequest.data_entity_inline        = createWorkflowRequest.activity_inline_data;

            util.logInfo(request,`createWorkflowRequest %j` , JSON.stringify(createWorkflowRequest));
            const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
            let activityInsertedDetails = await addActivityAsync(createWorkflowRequest);

            util.logInfo(request,`activityInsertedDetails----> %j` , activityInsertedDetails);


            let activityTimelineCollection =  JSON.stringify({
                "content": `Form Submitted`,
                "subject": `Reject`,
                "mail_body": `Reject`,
                "activity_reference": [],
                "form_id" : 4430,
                "form_submitted" : JSON.parse(createWorkflowRequest.data_entity_inline),
                "asset_reference": [],
                "attachments": [],
                "form_approval_field_reference": []
            });


            let timelineReq = Object.assign({}, createWorkflowRequest);

            timelineReq.activity_id = request.workflow_activity_id;
            timelineReq.message_unique_id = util.getMessageUniqueId(100);
            timelineReq.track_gps_datetime = util.getCurrentUTCTime();
            timelineReq.activity_stream_type_id = 717;
            timelineReq.activity_stream_type_id = 705;
            timelineReq.timeline_stream_type_id = 705;
            timelineReq.activity_type_category_id = 48;
            timelineReq.asset_id = 100;
            timelineReq.activity_timeline_collection = activityTimelineCollection;
            timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;

            await activityTimelineService.addTimelineTransactionAsync(timelineReq);
        } catch (e) {
            util.logError(request,`Auto Rejection form Failed ` + e.stack, { type: 'bot_engine', e });
        }
    }

    async function staticCopyField(request, inlineData) {

        for(let row of inlineData) {
            let formData = await activityCommonService.getFormFieldMappings(request, row.target_form_id, 0, 50);

            let activityInlineData = [];

            for(let data of formData) {
                activityInlineData.push({
                    "form_id": data.form_id,
                    "field_id": data.field_id,
                    "field_name": data.field_name,
                    "message_unique_id": data.message_unique_id,
                    "data_type_combo_id": data.data_type_combo_id,
                    "field_data_type_id": data.data_type_id,
                    "data_type_combo_value": data.data_type_combo_value,
                    "field_data_type_category_id": data.data_type_category_id
                });
            }

            util.logInfo(request,`activityInlineData %j` , JSON.stringify(activityInlineData));

            let finalInlineData = [];
            for(let formInline of activityInlineData) {
                for(let row of inlineData) {
                    if(formInline.field_id == row.target_field_id) {
                        if(row.target_field_data_type_id == formInline.field_data_type_id) {
                            if(row.target_field_data_type_combo_id == formInline.data_type_combo_id) {
                                formInline.data_type_combo_value = row.target_field_value;
                                formInline.field_value = row.target_field_value;
                                finalInlineData.push(formInline);
                            }
                        }
                    }
                }
            }

            if(!finalInlineData.length) {
                util.logInfo(request,`Got No field to copy`);
                request.debug_info.push('Got No field to copy' + JSON.stringify(inlineData), "Data from db " + formData[0].field_inline_data);
                return;
            }

            util.logInfo(request,`After Alteration %j` , finalInlineData);

            await sleep(30 * 1000);
            let formId = row.target_form_id;

            let createWorkflowRequest                       = Object.assign({}, request);
            let targetFormctivityTypeID = 0;
            const [workforceActivityTypeMappingError, workforceActivityTypeMappingData] = await workforceActivityTypeMappingSelect({
                organization_id: createWorkflowRequest.organization_id,
                account_id: createWorkflowRequest.account_id,
                workforce_id: createWorkflowRequest.workforce_id,
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
            createWorkflowRequest.activity_type_id          = targetFormctivityTypeID;
            createWorkflowRequest.activity_inline_data      = JSON.stringify(finalInlineData);
            createWorkflowRequest.workflow_activity_id      = Number(request.workflow_activity_id);
            createWorkflowRequest.activity_type_category_id = 9;
            createWorkflowRequest.activity_parent_id        = 0;
            createWorkflowRequest.activity_form_id          = formId;
            createWorkflowRequest.form_id                   = formId;
            createWorkflowRequest.activity_datetime_start   = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            createWorkflowRequest.activity_datetime_end     = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            createWorkflowRequest.device_os_id              = 7;

            const targetFormActivityID                = await cacheWrapper.getActivityIdPromise();
            const targetFormTransactionID             = await cacheWrapper.getFormTransactionIdPromise();
            createWorkflowRequest.activity_id         = targetFormActivityID;
            createWorkflowRequest.form_transaction_id = targetFormTransactionID;
            createWorkflowRequest.data_entity_inline  = createWorkflowRequest.activity_inline_data;

            util.logInfo(request,`createWorkflowRequest %j` , JSON.stringify(createWorkflowRequest));
            request.debug_info.push('createWorkflowRequest: ' + createWorkflowRequest);
            const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
            let activityInsertedDetails = await addActivityAsync(createWorkflowRequest);

            util.logInfo(request,`activityInsertedDetails----> %j` , activityInsertedDetails);
            request.debug_info.push('activityInsertedDetails: ' + activityInsertedDetails);


            let activityTimelineCollection =  JSON.stringify({
                "content"            : `Form Submitted`,
                "subject"            : `Final Approval for BC Closure`,
                "mail_body"          : `Final Approval for BC Closure`,
                "activity_reference" : [],
                "form_id"            : formId,
                "form_submitted"     : JSON.parse(createWorkflowRequest.data_entity_inline),
                "asset_reference"    : [],
                "attachments"        : [],
                "form_approval_field_reference": []
            });


            let timelineReq = Object.assign({}, createWorkflowRequest);

            timelineReq.activity_id                  = request.workflow_activity_id;
            timelineReq.message_unique_id            = util.getMessageUniqueId(100);
            timelineReq.track_gps_datetime           = util.getCurrentUTCTime();
            timelineReq.activity_stream_type_id      = 705;
            timelineReq.timeline_stream_type_id      = 705;
            timelineReq.activity_type_category_id    = 48;
            timelineReq.asset_id                     = 100;
            timelineReq.activity_timeline_collection = activityTimelineCollection;
            timelineReq.data_entity_inline           = timelineReq.activity_timeline_collection;

            await activityTimelineService.addTimelineTransactionAsync(timelineReq);
        }
    }

    async function arpBot(request, inlineData) {
        logger.info(request.workflow_activity_id+": arpBot: Request Params received from Request: %j", request);
        logger.info(request.workflow_activity_id+": arpBot: Bot Inline data: %j", inlineData);
        let key = "_0";
        let isEnd = false;

        if (Number(request.is_refill) == 1 && Number(request.lead_asset_id)) {
            request.target_asset_id = request.lead_asset_id;
            request.target_asset_first_name = request.lead_asset_first_name;
            request.asset_type_id = request.lead_asset_type_id;
            rmBotService.TriggerRoundRobinV2(request);
            logger.info(request.workflow_activity_id+": arpBot: is cloned/is_refill  so skipped : %j", key);
            return;
        }
        // logger.silly("arpBot: Bot Inline data Key1: %j", inlineData._1);
        // logger.silly("arpBot: Bot Inline data Key2: %j", inlineData[key]);
        // logger.silly("arpBot: Bot Inline data Key Operation_type : %j", inlineData[key].operation_type);

        while (!isEnd) {
            isEnd = true;
            logger.info(request.workflow_activity_id+": arpBot: Bot Inline data Key Operation_type : %j", inlineData[key].operation_type);
            let conditionData = inlineData[key];
            if (conditionData.operation_type === 'check') {
                // get the field value here
                logger.info(request.workflow_activity_id+": arpBot: conditionData.condition: %j", conditionData.condition);
                logger.info(request.workflow_activity_id+": arpBot: conditionData.data_type: %j", conditionData.data_type);
                let fieldValue = await getFormFieldValue(request, conditionData.field_id);
                logger.info(request.workflow_activity_id+": arpBot: getFormFieldValue fieldValue: %j", fieldValue);
                if (conditionData.condition == 'eq') {
                    if (conditionData.data_type === 'int') {
                        if (fieldValue === Number(conditionData.compare_value)) {
                            key = conditionData.is_true;
                        } else {
                            key = conditionData.is_false;
                        }
                    } else if (conditionData.data_type === 'string') {
                        if (fieldValue === conditionData.compare_value) {
                            key = conditionData.is_true;
                        } else {
                            key = conditionData.is_false;
                        }
                    }
                    isEnd = conditionData.isEnd;
                } else if (conditionData.condition == 'gt') {
                    if (fieldValue > Number(conditionData.compare_value)) {
                        key = conditionData.is_true;
                    } else {
                        key = conditionData.is_false;
                    }
                    isEnd = conditionData.isEnd;
                } else if (conditionData.condition == 'gteq') {
                    if (fieldValue >= Number(conditionData.compare_value)) {
                        key = conditionData.is_true;
                    } else {
                        key = conditionData.is_false;
                    }
                    isEnd = conditionData.isEnd;
                } else if (conditionData.condition == 'lt') {
                    if (fieldValue < Number(conditionData.compare_value)) {
                        key = conditionData.is_true;
                    } else {
                        key = conditionData.is_false;
                    }
                    isEnd = conditionData.isEnd;
                } else if (conditionData.condition == 'lteq') {
                    if (fieldValue <= Number(conditionData.compare_value)) {
                        key = conditionData.is_true;
                    } else {
                        key = conditionData.is_false;
                    }
                    isEnd = conditionData.isEnd;
                } else if (conditionData.condition == 'neq') {
                    if (fieldValue != Number(conditionData.compare_value)) {
                        key = conditionData.is_true;
                    } else {
                        key = conditionData.is_false;
                    }
                    isEnd = conditionData.isEnd;
                } else {
                    isEnd = true;
                }
            } else if (conditionData.operation_type === 'assign') {

                request.target_asset_id = conditionData.asset_id;
                request.target_asset_first_name = conditionData.operating_asset_first_name || '';
                request.asset_type_id = conditionData.asset_type_id;
                rmBotService.TriggerRoundRobinV2(request);
                key = conditionData.next_key;
                isEnd = conditionData.isEnd;

            } else if (conditionData.operation_type === 'na') {

                isEnd = conditionData.isEnd;
                key = conditionData.next_key;

            } else {

                isEnd = true;
                key = '-3';
            }

            logger.info(request.workflow_activity_id+": arpBot: nextKey: %j", key);
            logger.info(request.workflow_activity_id+": arpBot: isEnd: %j", isEnd);
        }
    }

    async function getFormFieldValue(request, idField) {
        let botOperationId = request.bot_operation_id || "";

        let fieldValue = '';
        try{
            util.logInfo(request,`${request.workflow_activity_id} : idField: %j`, idField);
        const workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, request.data_activity_id);
        let formInlineData = JSON.parse(workflowActivityData[0].activity_inline_data);

        for (let counter = 0; counter < formInlineData.length; counter++) {
            util.logInfo(request,`idField: %j`,Number(formInlineData[counter].field_id));
            if (Number(formInlineData[counter].field_id) === Number(idField)) {
                util.logInfo(request,`datatypeid: %j`,formInlineData[counter].field_data_type_id);
                util.logInfo(request,`is_cart: %j`,request.is_cart);
                util.logInfo(request,`final_key: %j`,request.final_key);
                util.logInfo(request,`product_data: %j`,formInlineData[counter].field_value);

                if([64,65,71,75].includes(Number(formInlineData[counter].field_data_type_id))){
                    if(request.is_cart == 0){
                        fieldValue = formInlineData[counter].field_value;
                        fieldValue = typeof fieldValue === 'string' ? JSON.parse(fieldValue)[request.final_key] : fieldValue[request.final_key];
                    }else if(request.is_cart == 1) {
                        //util.logInfo(request,`Field Matched: %j`,JSON.parse(formInlineData[counter].field_value).cart_items);
                        //logger.info(" "+JSON.parse(formInlineData[counter].field_value).cart_items[0][request.final_key]);
                        fieldValue = formInlineData[counter].field_value;
                        fieldValue = typeof fieldValue === 'string' ? JSON.parse(fieldValue) : fieldValue;
                        //fieldValue = JSON.parse(formInlineData[counter].field_value);
                        fieldValue = typeof fieldValue.cart_items == 'string' ? JSON.parse(fieldValue.cart_items)[0][request.final_key] : fieldValue.cart_items[0][request.final_key];
                    }
                }
                else if(Number(formInlineData[counter].field_data_type_id) === 57){
                    fieldValue = formInlineData[counter].field_value.split('|')[1];
                }
                else if(Number(formInlineData[counter].field_data_type_id) === 59){
                    fieldValue = formInlineData[counter].field_value.split('|')[1];
                }
                else{
                    fieldValue = formInlineData[counter].field_value;
                }                
                break;
            }
        }
        util.logInfo(request,`getFormFieldValue: fieldValue: %j`,fieldValue); 
        }catch(error){
            util.logError(request,`getFormFieldValue Error`, { type: "bot_engine", error: serializeError(error) });
        }
        request.debug_info.push("getFormFieldValue "+ fieldValue);
        return fieldValue;
    }


    async function getFieldValueUsingFieldIdV1(request,formID,fieldID) {
        util.logInfo(request,` `);
        util.logInfo(request,`*************************`);
        util.logInfo(request,`request.form_id - ${request.form_id}`);
        util.logInfo(request,`formID - ${formID}`);
        util.logInfo(request,`fieldID - ${fieldID}`);

        let fieldValue = "";
        let formData;
      
            // console.log(request.form_id,formID)
        //Based on the workflow Activity Id - Fetch the latest entry from 713
        if(request.hasOwnProperty('workflow_activity_id') && Number(request.workflow_activity_id) > 0 && request.form_id != formID){
          try{
            formData = await getFormInlineData({
                organization_id: request.organization_id,
                account_id: request.account_id,
                workflow_activity_id: request.workflow_activity_id,
                form_id: formID
            },2);
        }
        catch(err){
            formData=[]
        }

        } else {
            //Take the inline data from the request
            formData = (typeof request.activity_inline_data === 'string') ? JSON.parse(request.activity_inline_data): request.activity_inline_data;
        }    

        // console.log('formData - ', formData);

        for(const fieldData of formData) {
            if(Number(fieldData.field_id) === Number(fieldID)) {
               
                util.logInfo(request,`fieldData.field_data_type_id : ${fieldData.field_data_type_id}`);
                switch(Number(fieldData.field_data_type_id)) {
                    //Need Single selection and Drop Down
                    //circle/ state

                    case 57: //Account
                        fieldValue = fieldData.field_value;
                        fieldValue = fieldValue.split('|')[1];
                        break;
                    case 18: //Money
                        fieldValue = typeof fieldData.field_value=="string"?JSON.parse(fieldData.field_value):fieldData.field_value;
                        fieldValue = fieldValue.value;
                        break;
                    //case 68: break;
                    default: fieldValue = fieldData.field_value;
                }
                break;
            }
        }
    
        util.logInfo(request,`Field Value B4: ${fieldValue}`);
        fieldValue = fieldValue.split(" ").join("");
        util.logInfo(request,`Field Value After: ${fieldValue}`);
        util.logInfo(request,`*************************`);
        return fieldValue;
    }

    async function bulkCreateSRBot(request, formInlineDataMap = new Map(), botOperationInlineData = {}) {

        let workflowActivityID = Number(request.workflow_activity_id) || 0,
            workflowActivityCategoryTypeID = 0,
            workflowActivityTypeID = 0,
            bulkUploadFormTransactionID = 0,
            bulkUploadFormActivityID = 0,
            opportunityID = "",
            esmsIntegrationsTopicName = "";

        const triggerFormID = request.trigger_form_id,
            // Form and Field for getting the excel file's 
            bulkUploadFormID = botOperationInlineData.bulk_upload.form_id || 0,
            bulkUploadFieldID = botOperationInlineData.bulk_upload.field_id || 0;

        switch (global.mode) {
            case "local":
                esmsIntegrationsTopicName = "local-BulkCreateSR-request-topic-v1"
                break;

            // case "staging":
            case "preprod":
                esmsIntegrationsTopicName = "staging-BulkCreateSR-request-topic-v1"
                break;

            case "prod":
            case "production":
                esmsIntegrationsTopicName = "production-BulkCreateSR-request-topic-v1"
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
            throw new Error("Form ID and field ID not defined to fetch excel for Create SR");
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
            throw new Error("Form to Bulk Create SR is not submitted");
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

        util.logInfo(request,`bulkUploadFieldData[0].data_entity_text_1: %j` , bulkUploadFieldData[0].data_entity_text_1);
        request.debug_info.push("bulkUploadFieldData[0].data_entity_text_1: " + bulkUploadFieldData[0].data_entity_text_1);
        const [xlsxDataBodyError, xlsxDataBody] = await util.getXlsxDataBodyFromS3Url(request, bulkUploadFieldData[0].data_entity_text_1);
        if (xlsxDataBodyError) {
            throw new Error(xlsxDataBodyError);
        }

        const workbook = XLSX.read(xlsxDataBody, { type: "buffer", cellStyles: false });
        // Select sheet
        const sheet_names = workbook.SheetNames;
        logger.silly("sheet_names: %j", sheet_names);

        const headersArray = ["SerialNo", "OpportunityID", "roms_order_id", "CircuitID", "FRID", "SRType", "SRSubType"];
        const mandatoryHeaders = ["SerialNo", "OpportunityID", "CircuitID", "FRID", "SRType", "SRSubType"];
        const OpportunitiesArray = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_names[0]], { header: headersArray });
        let errorMessageForNonAscii = "Non Ascii Character(s) found in \n";
        let nonAsciiErroFound = false;
        for (let i = 1; i < OpportunitiesArray.length; i++) {
            const Opportunity = OpportunitiesArray[i];
            for (const [key, value] of Object.entries(Opportunity)) {
                let indexOfNonAscii = String(value).search(/[^ -~]+/g);
                if (indexOfNonAscii !== -1) {
                    nonAsciiErroFound = true;
                    errorMessageForNonAscii += `Row: ${i + 1} Column: ${key}\n`;
                }

            }
        }

        if (nonAsciiErroFound) {
            let formattedTimelineMessage = `Errors found while parsing the bulk excel:\n\n`;
            formattedTimelineMessage += errorMessageForNonAscii;
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
            throw new Error("NonAsciiCharacterFound");
        }

        // PreProcessing Stage 1
        let errorMessage = "";
        for (let i = 1; i < OpportunitiesArray.length; i++) {
            const Opportunity = OpportunitiesArray[i];
            util.logInfo(request,`teSR: serialNum: %j`, Opportunity.serialNumber);
            let errorFoundForAnyColumn = false;
            for (const header of mandatoryHeaders) {
                if (Opportunity[header] == undefined || Opportunity[header] === "") {
                    errorFoundForAnyColumn = true;
                    errorMessage += `${header} is empty in row ${i + 1} \n`;
                }
            }

            if (!errorFoundForAnyColumn) {
                let cuidRequestData = {
                    organization_id: request.organization_id,
                    activity_type_category_id: 48,
                    activity_type_id: 0,
                    flag: 0,
                    search_string: Opportunity.OpportunityID,
                    start_from: 0,
                    limit_value: 10
                }
                let workflowActivityIDOfEnteredOpportunity = "";
                const [errorOne, opportunityDataFromDb] = await activityListSearchCUID(cuidRequestData);
                if (errorOne || opportunityDataFromDb.length === 0) {
                    errorMessage += `The entered Oppurtuinity ID ${Opportunity.OpportunityID} in row ${i + 1} doesn't exist \n`;
                }
                else {
                    let FRID = Opportunity.FRID;
                    let primaryFeasibilityRequestID = opportunityDataFromDb[0].activity_cuid_2 || "";
                    let secondaryFeasibilityRequestID = opportunityDataFromDb[0].activity_cuid_3 || "";
                    workflowActivityIDOfEnteredOpportunity = opportunityDataFromDb[0].activity_id;
                    if (primaryFeasibilityRequestID !== FRID && secondaryFeasibilityRequestID !== FRID) {
                        errorMessage += `The entered FRID ${Opportunity.FRID} doesn't belong to the mentioned Oppurtuinity ID ${Opportunity.OpportunityID} in row ${i + 1}\n`;
                    } else {
                        const [errorZero, workflowActivityDataOfEnteredOpportunity] = await getActivityDetailsAsync({
                            organization_id: request.organization_id,
                        }, workflowActivityIDOfEnteredOpportunity);
                        let activityMasterData = JSON.parse(workflowActivityDataOfEnteredOpportunity[0].activity_master_data || "{}");
                        if(primaryFeasibilityRequestID === FRID && !activityMasterData.hasOwnProperty("feasibility_xml")){
                            errorMessage += `The entered FRID ${Opportunity.FRID} in row ${i + 1} is not yet published \n`;
                        }else if(secondaryFeasibilityRequestID === FRID && !activityMasterData.hasOwnProperty("feasibility_secondary")){
                            errorMessage += `The entered FRID ${Opportunity.FRID} in row ${i + 1} is not yet published \n`;
                        }
                    }
                }
            }
        }

        if (errorMessage !== "") {

            await addTimelineMessage(
                {
                    activity_timeline_text: "",
                    organization_id: request.organization_id
                }, workflowActivityID || 0,
                {
                    subject: 'Errors found while parsing the CreateSR excel',
                    content: errorMessage,
                    mail_body: errorMessage,
                    attachments: []
                }
            );

            throw new Error("ErrorsFoundWhileProcessingCreateSR");
        }

        for (let i = 1; i < OpportunitiesArray.length; i++) {
            await queueWrapper.raiseActivityEventToTopicPromise({
                type: "VIL_ESMS_IBMMQ_INTEGRATION",
                trigger_form_id: Number(triggerFormID),
                form_transaction_id: Number(request.form_transaction_id),
                payload: {
                    workflow_activity_id: request.workflow_activity_id,
                    account_id: request.account_id,
                    opportunity_details: OpportunitiesArray[i]
                }
            }, esmsIntegrationsTopicName, Number(workflowActivityID));
        }

        await addTimelineMessage(
            {
                activity_timeline_text: "",
                organization_id: request.organization_id
            }, workflowActivityID || 0,
            {
                subject: 'Bulk Operation Notifictaion',
                content: "Excel has been submitted for processing successfully",
                mail_body: "Excel has been submitted for processing successfully",
                attachments: []
            }
        );

        return;
    }

    async function applyLeave(request, leave_flag, leave_date) {
        let paramsArr = [
            request.organization_id,
            request.asset_id,
            util.ISTtoUTC(leave_date),
            leave_flag,
            util.getCurrentUTCTime()
        ];
        let queryString = util.getQueryString('ds_v1_asset_list_update_leave', paramsArr);
        if (queryString != '') {
        return await (db.executeQueryPromise(0, queryString, request));
        }
    }  

    async function applyWorkflowLeave(request, leave_start_datetime, leave_end_datetime, leave_days_count) {
        let paramsArr = [
            request.organization_id,
            request.workflow_activity_id,
            request.asset_id,
            util.ISTtoUTC(leave_start_datetime),
            util.ISTtoUTC(leave_end_datetime),
            leave_days_count,
            request.asset_id || request.auth_asset_id,
            util.getCurrentUTCTime()
        ];
        let queryString = util.getQueryString('ds_v1_2_asset_leave_mapping_insert', paramsArr);
        if (queryString != '') {
        return await (db.executeQueryPromise(0, queryString, request));
        }
    }  

    async function updateLeaveApprovalStaus(request, approval_flag) {
        let paramsArr = [
            request.organization_id,
            request.workflow_activity_id,
            request.asset_id,
            approval_flag,
            request.asset_id || request.auth_asset_id,
            util.getCurrentUTCTime()
        ];
        let queryString = util.getQueryString('ds_v1_asset_leave_mapping_update_approval', paramsArr);
        if (queryString != '') {
        return await (db.executeQueryPromise(0, queryString, request));
        }
    }     

    async function removeCUIDs(request, inlineData) {
        await activityListRemoveCUIDs(request, inlineData.remove_cuids.remove_cuid_flag);
        let activityTitleExpression = request.activity_title.replace(/\s/g, '').toLowerCase();

        switch (parseInt(inlineData.remove_cuids.remove_cuid_flag)) {
            case 1:
                request.cuid_1 = null;
                break;

            case 2:
                request.cuid_2 = null;
                break;

            case 3:
                request.cuid_3 = null;
                break;

            case 0 :
                request.cuid_1 = null;
                request.cuid_2 = null;
                request.cuid_3 = null;
                break;
            default:
                logger.info("Remove CUID BOT : " + `cuidInlineData contains incorrect cuid key: ${inlineData.remove_cuids.remove_cuid_flag}`);
                throw new Error(`cuidInlineData contains incorrect cuid key: ${inlineData.remove_cuids.remove_cuid_flag}`)
            // break;
        }

        logger.info("Remove CUID BOT : " + JSON.stringify({request, activityTitleExpression}));
        await elasticService.updateAccountCodeV1(request, 3);

        return;
    }

    async function addCUIDs(request, inlineData) {

        // switch (parseInt(inlineData.add_cuids.add_cuid_flag)) {
        //     case 1:
        //         request.cuid_1 = null;
        //         break;

        //     case 2:
        //         request.cuid_2 = null;
        //         break;

        //     case 3:
        //         request.cuid_3 = null;
        //         break;

        //     case 0 :
        //         request.cuid_1 = null;
        //         request.cuid_2 = null;
        //         request.cuid_3 = null;
        //         break;
        //     default:
        //         logger.info("Remove CUID BOT : " + `cuidInlineData contains incorrect cuid key: ${inlineData.remove_cuids.remove_cuid_flag}`);
        //         throw new Error(`cuidInlineData contains incorrect cuid key: ${inlineData.remove_cuids.remove_cuid_flag}`)
        //     // break;
        // }

        // logger.info("Add CUID BOT : " + JSON.stringify({request, activityTitleExpression}));
        await elasticService.updateAccountCodeV1(request, 1);

        return;
    }

    async function activitySearchListUpdateAddition(request, column_flag, field_value) {
        let paramsArr = [
            request.organization_id,
            request.workflow_activity_id,
            field_value,
            column_flag
        ];
        let queryString = util.getQueryString('ds_v1_activity_search_list_update_addition_fields', paramsArr);
        if (queryString != '') {
        return await (db.executeQueryPromise(0, queryString, request));
        }
    }


    // Create Activity Service
    async function submitFormV1(request) {
        const activityID = await cacheWrapper.getActivityIdPromise();
        const formTransactionID = await cacheWrapper.getFormTransactionIdPromise();
        let activityTimelineCollection =  JSON.stringify({
            "content": `Form Submitted`,
            "subject": `Proposal Form`,
            "mail_body": `Proposal Form`,
            "activity_reference": [],
            "form_id" : 50639,
            "form_submitted" : JSON.parse(request.activity_inline_data),
            "asset_reference": [],
            "attachments": [],
            "form_approval_field_reference": []
        });
        const addActivityRequest = {
            "organization_id":request.organization_id,
            "account_id":request.account_id,
            "workforce_id":request.workforce_id,
            "asset_id":request.asset_id,
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            "asset_message_counter":0,
            "activity_title":"Proposal Form",
            "activity_description":"Adding Pdf",
            //"activity_inline_data":"[{\"form_id\":50639,\"field_id\":\"311124\",\"field_name\":\"PDF Scan\",\"field_data_type_id\":51,\"field_data_type_category_id\":13,\"data_type_combo_id\":0,\"data_type_combo_value\":\"0\",\"field_value\":\"https://worlddesk-staging-j21qqcnj.s3.ap-south-1.amazonaws.com/868/1102/5918/41535/2021/04/103/1618208142138/2021049-21549985.pdf\",\"message_unique_id\":1618208278588}]",
            "activity_inline_data":request.activity_inline_data,
            "activity_participant_collection":request.activity_participant_collection||"",
            "activity_datetime_start":util.getCurrentUTCTime(),
            "activity_datetime_end":util.getCurrentUTCTime(),
            "activity_type_category_id":9,
            "activity_sub_type_id":0,
            "activity_id":activityID,
            "activity_type_id":187495,
            "activity_access_role_id":21,
            "activity_status_id":381939,
            "activity_status_type_category_id":1,
            "activity_status_type_id":22,
            "asset_participant_access_id":21,
            "activity_flag_file_enabled":1,
            "activity_parent_id":0,
            "activity_form_id":50639,
            "flag_pin":0,
            "flag_offline":0,
            "flag_retry":0,
            "message_unique_id":util.getMessageUniqueId(31993),
            "track_latitude":"0.0",
            "track_longitude":"0.0",
            "track_altitude":0,
            "track_gps_datetime":util.getCurrentUTCTime(),
            "track_gps_accuracy":"0",
            "track_gps_status":0,
            "service_version":1,
            "app_version":1,
            "api_version":1,
            "device_os_id":5,
            "activity_stream_type_id":705,
            "activity_parent_id":request.workflow_activity_id,
            "parent_activity_id":request.workflow_activity_id,
            "form_transaction_id":formTransactionID,
            "form_id":request.form_id,
            "activity_timeline_collection":activityTimelineCollection,
            "data_entity_inline":request.activity_inline_data,
            "activity_timeline_text":"",
            "activity_timeline_url":"",
            "flag_timeline_entry":1,
            "file_activity_id":0,
            "workflow_activity_id":request.workflow_activity_id,
            "is_mytony":1,
            "is_refill":0,
            "expression":"",
            url: "/r1/activity/add/v1",
            
        };
        util.logInfo(request,`addActivityRequest %j` , JSON.stringify(addActivityRequest));
        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        await addActivityAsync(addActivityRequest);
        // console.log('xdxd',xx);
        // let wfActivityDetails = await activityCommonService.getActivityDetailsPromise(request, activityID);
        // console.log('act det',wfActivityDetails)
      
            const childWorkflow705Request = Object.assign({}, addActivityRequest);
            childWorkflow705Request.activity_id = request.workflow_activity_id;
            childWorkflow705Request.data_activity_id = activityID;
            childWorkflow705Request.data_form_transaction_id =formTransactionID;
            childWorkflow705Request.activity_type_category_id = 48;
            childWorkflow705Request.message_unique_id = util.getMessageUniqueId(31993);
            childWorkflow705Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            childWorkflow705Request.device_os_id = 5;
            childWorkflow705Request.auth_asset_id = 100;
            childWorkflow705Request.asset_token_auth = "54188fa0-f904-11e6-b140-abfd0c7973d9";
            childWorkflow705Request.track_gps_datetime = util.getCurrentUTCTime();
            childWorkflow705Request.activity_datetime_end=util.getCurrentUTCTime();
            // childWorkflow705Request.activity_timeline_collection = activityTimelineCollection;
            util.logInfo(request,`timeline entry %j` , childWorkflow705Request);
            // const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
            // await addTimelineTransactionAsync(childWorkflow705Request);
            
             activityTimelineService.addTimelineTransactionAsync(childWorkflow705Request);
             return [false,[]]
}

    async function insertSqsStatus(request) {
        let responseData = 0,
        error = true;
        let paramsArr = new Array(
            0,
            util.getCurrentUTCTime(),
            5,
            JSON.stringify(request),
            request.bot_operation_id||0,
            request.workflow_activity_id||0,
            request.activity_id||0,
            request.form_transaction_id||0,
            request.workforce_id || 0,
            request.account_id || 0,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime(),
        );
        let queryString = util.getQueryString('ds_p1_bot_excel_log_transaction_insert', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data[0].bot_operation_transaction_id;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        logger.info(request.workflow_activity_id+" : excel bot log inserted");
      return [false,responseData]
    };

    async function bulkThirdPartyOpexBot(request, formInlineDataMap = new Map(), botOperationInlineData = {}) {

        let workflowActivityID = Number(request.workflow_activity_id) || 0,
            workflowActivityCategoryTypeID = 0,
            workflowActivityTypeID = 0,
            thirdPartyOpexFormTransactionID = 0,
            thirdPartyOpexFormActivityID = 0,
            opportunityID = "",
            esmsIntegrationsTopicName = "";
        let thirdPartyOpexMapping = {};
        let excelRows = [];
        let formWise = false;
        const triggerFormID = request.trigger_form_id,
            // Form and Field for getting the excel file's 
            primaryRequestFormId = botOperationInlineData.bulk_upload.primary_form_id || 0,
            primaryRequestFieldId = botOperationInlineData.bulk_upload.primary_field_id || 0,
            seconadryRequestFormId = botOperationInlineData.bulk_upload.secondary_form_id || 0,
            seconadryRequestFieldId = botOperationInlineData.bulk_upload.secondary_field_id || 0;


        switch (global.mode) {
            case "local":
                esmsIntegrationsTopicName = "local-BulkThirdPartyOpex-request-topic-v1"
                break;

            // case "staging":
            case "preprod":
                esmsIntegrationsTopicName = "staging-BulkThirdPartyOpex-request-topic-v2"
                break;

            case "prod":
            case "production":
                esmsIntegrationsTopicName = "production-BulkThirdPartyOpex-request-topic-v1"
                break;
        }

        let workflowActivityData;

        try {
            workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
            if (Number(workflowActivityData.length) > 0) {
                workflowActivityCategoryTypeID = Number(workflowActivityData[0].activity_type_category_id);
                workflowActivityTypeID = Number(workflowActivityData[0].activity_type_id);
                opportunityID = workflowActivityData[0].activity_cuid_1;
                thirdPartyOpexMapping = vilBulkLOVs["third_party_opex"][`${workflowActivityTypeID}`];
            }
        } catch (error) {
            throw new Error("No Workflow Data Found in DB");
        }

        if (workflowActivityID === 0 || workflowActivityTypeID === 0 || opportunityID === "") {
            throw new Error("Couldn't Fetch workflowActivityID or workflowActivityTypeID");
        }

        // Fetch the bulk upload excel's S3 URL
        const bulkUploadFormData = await activityCommonService.getActivityTimelineTransactionByFormId713({
            organization_id: request.organization_id,
            account_id: request.account_id
        }, workflowActivityID, thirdPartyOpexMapping.form_id);


        if (Number(bulkUploadFormData.length) > 0) {
            thirdPartyOpexFormActivityID = Number(bulkUploadFormData[0].data_activity_id);
            thirdPartyOpexFormTransactionID = Number(bulkUploadFormData[0].data_form_transaction_id);
        }

        if (thirdPartyOpexFormActivityID === 0 || thirdPartyOpexFormTransactionID === 0) {
            throw new Error("Form to Third party opex is not submitted");
        }

        // Fetch the Business case Type
        const businessCaseTypeFieldData = await getFieldValue({
            form_transaction_id: thirdPartyOpexFormTransactionID,
            form_id: thirdPartyOpexMapping.form_id,
            field_id: thirdPartyOpexMapping.business_case_type_field,
            organization_id: request.organization_id
        });

        if (businessCaseTypeFieldData.length === 0) {
            throw new Error("Field to fetch the Business case Type not submitted");
        }

        let businessCaseType = businessCaseTypeFieldData[0].data_entity_text_1;

        // Get the details of child orders.
        const [errorZero, childOpportunitiesData] = await activityListSelectChildOrders({
            organization_id: request.organization_id,
            parent_activity_id: workflowActivityID
        });

        if (businessCaseType.toLowerCase() === "single") { //To handle Single FR Case
            formWise = true;
            // Fetch the 1st case current FR
            const firstCaseCurrentFRFieldData = await getFieldValue({
                form_transaction_id: thirdPartyOpexFormTransactionID,
                form_id: thirdPartyOpexMapping.form_id,
                field_id: thirdPartyOpexMapping.single_case.first_case.current_fr_field,
                organization_id: request.organization_id
            });

            if (firstCaseCurrentFRFieldData.length === 0) {
                throw new Error("Field to fetch the first Case Current FR Field Data not submitted");
            }

            const firstCaseExistingFRFieldData = await getFieldValue({
                form_transaction_id: thirdPartyOpexFormTransactionID,
                form_id: thirdPartyOpexMapping.form_id,
                field_id: thirdPartyOpexMapping.single_case.first_case.existing_fr_field,
                organization_id: request.organization_id
            });

            if (firstCaseExistingFRFieldData.length === 0) {
                throw new Error("Field to fetch the first Case Existing FR Field Data not submitted");
            }

            // const firstCaseLastmileFieldData = await getFieldValue({
            //     form_transaction_id: thirdPartyOpexFormTransactionID,
            //     form_id: thirdPartyOpexMapping.form_id,
            //     field_id: thirdPartyOpexMapping.single_case.first_case.existing_fr_field,
            //     organization_id: request.organization_id
            // });

            // if (firstCaseLastmileFieldData.length === 0) {
            //     throw new Error("Field to fetch the first Case Lastmile FR Field Data not submitted");
            // }

            // const firstCaseServiceProviderFieldData = await getFieldValue({
            //     form_transaction_id: thirdPartyOpexFormTransactionID,
            //     form_id: thirdPartyOpexMapping.form_id,
            //     field_id: thirdPartyOpexMapping.single_case.first_case.existing_fr_field,
            //     organization_id: request.organization_id
            // });

            let firstCaseCurrentFR = firstCaseCurrentFRFieldData[0].data_entity_text_1 || "";
            let firstCaseExistingFR = firstCaseExistingFRFieldData[0].data_entity_text_1 || "";
            // let firstCaseLastmile = firstCaseLastmileFieldData[0].data_entity_text_1 || "";
            // let firstCaseServiceProvider = "";

            // if (firstCaseServiceProviderFieldData.length > 0) {
            //     firstCaseServiceProvider = firstCaseServiceProviderFieldData[0].data_entity_text_1 || "";
            // }

            let fridFound = false;

            if (
                String(firstCaseCurrentFR).toUpperCase() === String(workflowActivityData[0].activity_cuid_2).toUpperCase() ||
                String(firstCaseCurrentFR).toUpperCase() === String(workflowActivityData[0].activity_cuid_3).toUpperCase()
            ) {
                fridFound = true;
            }

            let row = {};

            if (fridFound) {
                row["fridType"] = String(firstCaseCurrentFR).toUpperCase() === String(workflowActivityData[0].activity_cuid_2).toUpperCase() ? "PRIMARY" : "SECONDARY";
                row["activityId"] = workflowActivityID;
                row["currentBusinessFR"] = firstCaseCurrentFR;
                row["thirdPartyFR"] = firstCaseExistingFR;

                if (row["fridType"] === "PRIMARY") {
                    row["formId"] = primaryRequestFormId;
                    row["fieldId"] = primaryRequestFieldId;
                } else {
                    row["formId"] = seconadryRequestFormId;
                    row["fieldId"] = seconadryRequestFieldId;
                }

                excelRows.push(row);

            } else {
                let fridtype = "";
                let childActivityId = 0;
                for (const childOpty of childOpportunitiesData) {
                    if (
                        String(firstCaseCurrentFR).toUpperCase() === String(childOpty.activity_cuid_2).toUpperCase() ||
                        String(firstCaseCurrentFR).toUpperCase() === String(childOpty.activity_cuid_3).toUpperCase()
                    ) {
                        fridtype = String(firstCaseCurrentFR).toUpperCase() === String(childOpty.activity_cuid_2).toUpperCase() ? "PRIMARY" : "SECONDARY";
                        fridFound = true;
                        childActivityId = childOpty.activity_id;
                        break;
                    }
                }

                if (fridFound) {
                    row["fridType"] = fridtype;
                    row["activityId"] = childActivityId;
                    row["currentBusinessFR"] = firstCaseCurrentFR;
                    row["thirdPartyFR"] = firstCaseExistingFR;

                    if (fridtype === "PRIMARY") {
                        row["formId"] = primaryRequestFormId;
                        row["fieldId"] = primaryRequestFieldId;
                    } else {
                        row["formId"] = seconadryRequestFormId;
                        row["fieldId"] = seconadryRequestFieldId;
                    }
                    excelRows.push(row);
                }

            }

            let errorMessage = "";
            if (!fridFound) {
                errorMessage += `${firstCaseCurrentFR} doesn't belong to Opportunity\n`;
            }

            // Fetch the 2nd case FR Required
            const secondCaseRequiredFieldData = await getFieldValue({
                form_transaction_id: thirdPartyOpexFormTransactionID,
                form_id: thirdPartyOpexMapping.form_id,
                field_id: thirdPartyOpexMapping.single_case.is_second_case_needed,
                organization_id: request.organization_id
            });

            if (secondCaseRequiredFieldData.length === 0) {
                throw new Error("Field to fetch the second Case Required Field Data not submitted");
            }

            let secondCaseRequired = secondCaseRequiredFieldData[0].data_entity_text_1 || "";

            if (secondCaseRequired.toLowerCase() === "yes") {

                // Fetch the 2nd case current FR
                const secondCaseCurrentFRFieldData = await getFieldValue({
                    form_transaction_id: thirdPartyOpexFormTransactionID,
                    form_id: thirdPartyOpexMapping.form_id,
                    field_id: thirdPartyOpexMapping.single_case.second_case.current_fr_field,
                    organization_id: request.organization_id
                });

                if (secondCaseCurrentFRFieldData.length === 0) {
                    throw new Error("Field to fetch the second Case Current FR Field Data not submitted");
                }

                const secondCaseExistingFRFieldData = await getFieldValue({
                    form_transaction_id: thirdPartyOpexFormTransactionID,
                    form_id: thirdPartyOpexMapping.form_id,
                    field_id: thirdPartyOpexMapping.single_case.second_case.existing_fr_field,
                    organization_id: request.organization_id
                });

                if (secondCaseExistingFRFieldData.length === 0) {
                    throw new Error("Field to fetch the second Case Existing FR Field Data not submitted");
                }

                let secondCaseCurrentFR = secondCaseCurrentFRFieldData[0].data_entity_text_1 || "";
                let secondCaseExistingFR = secondCaseExistingFRFieldData[0].data_entity_text_1 || "";


                let fridFound = false;

                if (
                    String(secondCaseCurrentFR).toUpperCase() === String(workflowActivityData[0].activity_cuid_2).toUpperCase() ||
                    String(secondCaseCurrentFR).toUpperCase() === String(workflowActivityData[0].activity_cuid_3).toUpperCase()
                ) {
                    fridFound = true;
                }

                let row = {};

                if (fridFound) {
                    row["fridType"] = String(secondCaseCurrentFR).toUpperCase() === String(workflowActivityData[0].activity_cuid_2).toUpperCase() ? "PRIMARY" : "SECONDARY";
                    row["activityId"] = workflowActivityID;
                    row["currentBusinessFR"] = secondCaseCurrentFR;
                    row["thirdPartyFR"] = secondCaseExistingFR;

                    if (row["fridType"] === "PRIMARY") {
                        row["formId"] = primaryRequestFormId;
                        row["fieldId"] = primaryRequestFieldId;
                    } else {
                        row["formId"] = seconadryRequestFormId;
                        row["fieldId"] = seconadryRequestFieldId;
                    }
                    excelRows.push(row);

                } else {
                    let fridtype = "";
                    let childActivityId = 0;
                    for (const childOpty of childOpportunitiesData) {
                        if (
                            String(secondCaseCurrentFR).toUpperCase() === String(childOpty.activity_cuid_2).toUpperCase() ||
                            String(firstCaseCurrentFR).toUpperCase() === String(childOpty.activity_cuid_3).toUpperCase()
                        ) {
                            fridtype = String(firstCaseCurrentFR).toUpperCase() === String(childOpty.activity_cuid_2).toUpperCase() ? "PRIMARY" : "SECONDARY";
                            fridFound = true;
                            childActivityId = childOpty.activity_id;
                            break;
                        }
                    }

                    if (fridFound) {
                        row["fridType"] = fridtype;
                        row["activityId"] = childActivityId;
                        row["currentBusinessFR"] = secondCaseCurrentFR;
                        row["thirdPartyFR"] = secondCaseExistingFR;

                        if (fridtype === "PRIMARY") {
                            row["formId"] = primaryRequestFormId;
                            row["fieldId"] = primaryRequestFieldId;
                        } else {
                            row["formId"] = seconadryRequestFormId;
                            row["fieldId"] = seconadryRequestFieldId;
                        }

                        excelRows.push(row);
                    }

                }

                if (!fridFound) {
                    errorMessage += `${secondCaseCurrentFR} doesn't belong to Opportunity\n`;
                }

            }

            if (errorMessage.length > 0) {
                let formattedTimelineMessage = `Error !!`;
                formattedTimelineMessage += errorMessage;
                await addTimelineMessage(
                    {
                        activity_timeline_text: "",
                        organization_id: request.organization_id
                    }, workflowActivityID || 0,
                    {
                        subject: 'Errors found',
                        content: formattedTimelineMessage,
                        mail_body: formattedTimelineMessage,
                        attachments: []
                    }
                );
                throw new Error("ErrorsFoundInFR");
            }

        } else if (businessCaseType.toLowerCase() === "bulk") { // To handle Bulk case from Excel File
            formWise = false;
            // Fetch the excel URL
            const bulkUploadFieldData = await getFieldValue({
                form_transaction_id: thirdPartyOpexFormTransactionID,
                form_id: thirdPartyOpexMapping.form_id,
                field_id: thirdPartyOpexMapping.bulk_upload_field,
                organization_id: request.organization_id
            });

            if (bulkUploadFieldData.length === 0) {
                throw new Error("Field to fetch the bulk upload excel file not submitted");
            }

            util.logInfo(request,`bulkUploadFieldData[0].data_entity_text_1: %j` , bulkUploadFieldData[0].data_entity_text_1);
            request.debug_info.push("bulkUploadFieldData[0].data_entity_text_1: " + bulkUploadFieldData[0].data_entity_text_1);
            const [xlsxDataBodyError, xlsxDataBody] = await util.getXlsxDataBodyFromS3Url(request, bulkUploadFieldData[0].data_entity_text_1);
            if (xlsxDataBodyError) {
                throw new Error(xlsxDataBodyError);
            }

            const workbook = XLSX.read(xlsxDataBody, { type: "buffer", cellStyles: false });
            // Select sheet
            const sheet_names = workbook.SheetNames;
            logger.silly("sheet_names: %j", sheet_names);

            const headersArray = ["SerialNo", "currentBusinessFR", "thirdPartyFR"];
            const mandatoryHeaders = ["SerialNo", "currentBusinessFR"];
            excelRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_names[0]], { header: headersArray });
            let errorMessageForNonAscii = "Non Ascii Character(s) found in \n";
            let nonAsciiErroFound = false;
            for (let i = 1; i < excelRows.length; i++) {
                const row = excelRows[i];
                for (const [key, value] of Object.entries(row)) {
                    let indexOfNonAscii = String(value).search(/[^ -~]+/g);
                    if (indexOfNonAscii !== -1) {
                        nonAsciiErroFound = true;
                        errorMessageForNonAscii += `Row: ${i + 1} Column: ${key}\n`;
                    }
                }
            }

            if (nonAsciiErroFound) {
                let formattedTimelineMessage = `Errors found while parsing the bulk excel:\n\n`;
                formattedTimelineMessage += errorMessageForNonAscii;
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
                throw new Error("NonAsciiCharacterFound");
            }

            // PreProcessing Stage 1
            let errorMessage = "";
            for (let i = 1; i < excelRows.length; i++) {
                const row = excelRows[i];
                util.logInfo(request,`NewThirdPartyOpexFR: serialNum: ${row.SerialNo}`);
                let errorFoundForAnyColumn = false;
                for (const header of mandatoryHeaders) {
                    if (row[header] == undefined || row[header] === "") {
                        errorFoundForAnyColumn = true;
                        errorMessage += `${header} is empty in row ${i + 1} \n`;
                    }
                }

                if (!errorFoundForAnyColumn) {

                    if (childOpportunitiesData.length > 0) {
                        let fridFound = false;
                        let fridtype = "";
                        let childActivityId = 0;
                        for (const childOpty of childOpportunitiesData) {
                            util.logInfo(request,`childOpty : %j` , childOpty);
                            if (
                                String(row.currentBusinessFR).toUpperCase() === String(childOpty.activity_cuid_2).toUpperCase() ||
                                String(row.currentBusinessFR).toUpperCase() === String(childOpty.activity_cuid_3).toUpperCase()
                            ) {
                                fridtype = String(row.currentBusinessFR).toUpperCase() === String(childOpty.activity_cuid_2).toUpperCase() ? "PRIMARY" : "SECONDARY";
                                fridFound = true;
                                childActivityId = childOpty.activity_id;
                                break;
                            }
                        }
                        if (fridFound) {
                            row["fridType"] = fridtype;
                            row["activityId"] = childActivityId;
                            if (fridtype === "PRIMARY") {
                                row["formId"] = primaryRequestFormId;
                                row["fieldId"] = primaryRequestFieldId;
                            } else {
                                row["formId"] = seconadryRequestFormId;
                                row["fieldId"] = seconadryRequestFieldId;
                            }
                        } else {
                            errorFoundForAnyColumn = true;
                            errorMessage += `${row.currentBusinessFR} in row ${i + 1} doesn't belong to Opportunity\n`;
                        }
                    } else {
                        let fridFound = false;
                        if (
                            String(row.currentBusinessFR).toUpperCase() === String(workflowActivityData[0].activity_cuid_2).toUpperCase() ||
                            String(row.currentBusinessFR).toUpperCase() === String(workflowActivityData[0].activity_cuid_3).toUpperCase()
                        ) {
                            fridFound = true;
                        }
                        if (fridFound) {
                            row["fridType"] = String(row.currentBusinessFR).toUpperCase() === String(workflowActivityData[0].activity_cuid_2).toUpperCase() ? "PRIMARY" : "SECONDARY";
                            row["activityId"] = workflowActivityID;
                            if (row["fridType"] === "PRIMARY") {
                                row["formId"] = primaryRequestFormId;
                                row["fieldId"] = primaryRequestFieldId;
                            } else {
                                row["formId"] = seconadryRequestFormId;
                                row["fieldId"] = seconadryRequestFieldId;
                            }
                        } else {
                            errorFoundForAnyColumn = true;
                            errorMessage += `${row.currentBusinessFR} in row ${i + 1} doesn't belong to Opportunity\n`;
                        }
                    }
                }
            }

            if (errorMessage !== "") {

                await addTimelineMessage(
                    {
                        activity_timeline_text: "",
                        organization_id: request.organization_id
                    }, workflowActivityID || 0,
                    {
                        subject: 'Errors found while parsing the CreateSR excel',
                        content: errorMessage,
                        mail_body: errorMessage,
                        attachments: []
                    }
                );

                throw new Error("ErrorsFoundWhileProcessingBulkThirdPartyOpex");
            }

            await addTimelineMessage(
                {
                    activity_timeline_text: "",
                    organization_id: request.organization_id
                }, workflowActivityID || 0,
                {
                    subject: 'Bulk Operation Notifictaion',
                    content: "Excel has been submitted for processing successfully",
                    mail_body: "Excel has been submitted for processing successfully",
                    attachments: []
                }
            );

        }

        logger.info(`Third party opex rows ${workflowActivityID} %j`, excelRows);
        let startingIndex = formWise ? 0 : 1;
        for (let i = startingIndex; i < excelRows.length; i++) {
            await queueWrapper.raiseActivityEventToTopicPromise({
                type: "VIL_ESMS_IBMMQ_INTEGRATION",
                trigger_form_id: Number(triggerFormID),
                form_transaction_id: Number(request.form_transaction_id),
                payload: {
                    workflow_activity_id: request.workflow_activity_id,
                    account_id: request.account_id,
                    frid_details: excelRows[i]
                }
            }, esmsIntegrationsTopicName, Number(workflowActivityID));
        }

        return;
    }

    async function activityListSelectChildOrders(request) {
        // IN p_organization_id BIGINT(20), IN p_parent_activity_id BIGINT(20), 
        // IN p_flag TINYINT(4), IN p_sort_flag TINYINT(4), IN p_datetime_start DATETIME, 
        // IN p_datetime_end DATETIME, IN p_start_from SMALLINT(6), IN p_limit_value SMALLINT(6)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.parent_activity_id,
            request.flag || 1,
            request.sort_flag || 0,
            request.datetime_start || '1970-01-01 00:00:00',
            request.datetime_end || util.getCurrentUTCTime(),
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_activity_list_select_child_orders', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }
    this.addParticipantByEmail = async (request) => {
      let responseData = [],
        error = false,
        deskAssetData,
        assetData={};
    for (let i = 0; i < request.emails.length; i++) {
    try{
        let [err, assetDetails] = await getAssetByEmail({
          organization_id: request.organization_id,
          email: request.emails[i].email,
        });
        util.logInfo(request,`assetData : %j` , assetDetails);
        if(assetDetails.length>0){
            deskAssetData = assetDetails[0];
        }
        else{
            
            let result = await createAssetContactDesk(request, {
                "contact_designation": request.emails[i].designation,
                "contact_email_id": request.emails[i].email,
                "first_name": request.emails[i].name,
                "contact_phone_number": "",
                "contact_phone_country_code": 91,
                "asset_email_id":request.emails[i].email,
                "workforce_id": request._workforce_id,
                "account_id": request.account_id
            });
            deskAssetData = result.response;
            assetData.desk_asset_id = deskAssetData.desk_asset_id;
        }
        if (!assetData.desk_asset_id||assetData.desk_asset_id === 0) {
            assetData.desk_asset_id = deskAssetData.asset_id;
        }
        assetData.first_name = deskAssetData.operating_asset_first_name || deskAssetData.asset_first_name;
        assetData.contact_phone_number = deskAssetData.operating_asset_phone_number || deskAssetData.asset_phone_number;
        assetData.contact_phone_country_code = deskAssetData.operating_asset_phone_country_code || deskAssetData.asset_phone_country_code;
        assetData.asset_type_id = deskAssetData.asset_type_id;
        request.debug_info = []
        logger.info(request.workflow_activity_id + " : addParticipant : going to be added assetData :"+ JSON.stringify(assetData));
        request.debug_info.push(request.workflow_activity_id + " : addParticipant : going to be added assetData :"+ JSON.stringify(assetData))
            await addDeskAsParticipant(request, assetData);
            if(request.hasOwnProperty("send_email") && request.send_email==1){
            await icsEventCreation(request,request.emails[i].email,assetData.first_name);
            }
        }
        catch{
            error = true
        }
    }     
        return [error, responseData];
    };

    async function getFormInlineData(request,flag) {
        //flag 
        // 1. Send the entire formdata 713
        // 2. Send only the submitted form_data
        //3. Send both

        let formData = [];
        let formDataFrom713Entry = await activityCommonService.getActivityTimelineTransactionByFormId713(request,request.workflow_activity_id,request.form_id);
        if(!formDataFrom713Entry.length > 0) {
            responseData.push({'message': `${i_iterator.form_id} is not submitted`});
            util.logInfo(request,`responseData : %j` , responseData);
            return [true,responseData];
        }

        //console.log('formDataFrom713Entry[0] : ', formDataFrom713Entry[0]);
        let formTransactionInlineData = JSON.parse(formDataFrom713Entry[0].data_entity_inline);
        //console.log('formTransactionInlineData form Submitted: ', formTransactionInlineData.form_submitted);
        formData = formTransactionInlineData.form_submitted;
        formData = (typeof formData === 'string') ? JSON.parse(formData) : formData;

        switch(Number(flag)) {
            case 1: return formDataFrom713Entry[0];
            case 2: return formData;
            case 3: break;
            default: return formData;
        }
    }

    async function icsEventCreation(request, email, receiver_name) {

      //Getting Activity Type Config
      let [err1, activityTypeConfig] = await activityCommonService.getWorkflowFieldsBasedonActTypeId(request,request.activity_type_id);
      
      if(err1 || activityTypeConfig.length == 0 || activityTypeConfig[0].activity_type_inline_data == ""){
        util.logInfo(request,"Exiting without creating Ics Event due to missing config settings");
          return [false,[]]
      }
      let activity_type_inline_data = typeof activityTypeConfig[0].activity_type_inline_data == 'string' ? JSON.parse(activityTypeConfig[0].activity_type_inline_data) : activityTypeConfig[0].activity_type_inline_data;
      util.logInfo(request,`activity_type_inline_data : %j` , activity_type_inline_data);
      //Getting Activity Details
      let wfActivityDetails = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);

      if(!(activity_type_inline_data.hasOwnProperty('meeting_location_form_id') && activity_type_inline_data.meeting_location_form_id != "")){
        util.logInfo(request,"Exiting without creating Ics Event due to missing config settings");
        return [false,[ ]]
      }
      // Get Form Data
      let formData = await getFormInlineData({
        organization_id: request.organization_id,
        account_id: request.account_id,
        workflow_activity_id: request.workflow_activity_id,
        form_id: activity_type_inline_data.meeting_location_form_id
        },2);
      
        let eventLocation = formData.filter((_, i) =>_.field_id == activity_type_inline_data.meeting_location_field_id);
        let eventTimeDetails = formData.filter((_, i) => _.field_data_type_id === 77);

        const timeDifferenceInMinutes = Math.floor(eventTimeDetails[0].field_value.duration);
        let createDate = new Date(moment(eventTimeDetails[0].field_value.start_date_time).utcOffset("-05:30").format("YYYY-MM-DD HH:mm:ss"));
        let endDate = new Date(moment(eventTimeDetails[0].field_value.end_date_time).utcOffset("-05:30").format("YYYY-MM-DD HH:mm:ss"));
        let createDateutc = new Date(moment(eventTimeDetails[0].field_value.start_date_time).format("YYYY-MM-DD HH:mm:ss"));
        let endDateutc = new Date(moment(eventTimeDetails[0].field_value.end_date_time).format("YYYY-MM-DD HH:mm:ss"));
        let today = new Date();

        //Getting Participants list 
        activityParticipantService.getParticipantsList({...request,activity_id: request.workflow_activity_id,datetime_differential: "1970-01-01 00:00:00"},async function(err, dat) {
        
        util.logInfo(request,"Participants length : "+ dat.length);
        let emailsToAdd = [];
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        let subjectContent = `Meeting ID-${
                wfActivityDetails[0].activity_cuid_3
              } Scheduled on ${createDateutc.getDate()} - ${
                months[createDateutc.getMonth()]
              } from ${
                createDateutc.getHours() < 10 ? 0 : ""
              }${createDateutc.getHours()}:${
                createDateutc.getMinutes() < 10 ? 0 : ""
              }${createDateutc.getMinutes()} to ${
                endDateutc.getHours() < 10 ? 0 : ""
              }${endDateutc.getHours()}:${
                endDateutc.getMinutes() < 10 ? 0 : ""
              }${endDateutc.getMinutes()}.`;
        let bodyContent = `A Meeting(Meeting ID-${
                wfActivityDetails[0].activity_cuid_3
              }) has been scheduled on ${createDateutc.getDate()} - ${
                months[createDateutc.getMonth()]
              } from ${
                createDateutc.getHours() < 10 ? 0 : ""
              }${createDateutc.getHours()}:${
                createDateutc.getMinutes() < 10 ? 0 : ""
              }${createDateutc.getMinutes()} to ${
                endDateutc.getHours() < 10 ? 0 : ""
              }${endDateutc.getHours()}:${
                endDateutc.getMinutes() < 10 ? 0 : ""
              }${endDateutc.getMinutes()}. you are asked to join as participant`;

              util.logInfo(request,"Subject & Title :" + subjectContent+bodyContent);
           let creatorAssetDetails = [];
            for (let i = 0; i < dat.data.length; i++) {
                let [error, assetData] =
                await activityCommonService.getAssetDetailsAsync({
                    organization_id: request.organization_id,
                    asset_id: dat.data[i].asset_id,
                });
                if (
                    assetData.length > 0 &&
                    assetData[0].operating_asset_email_id
                ) {
                    if(assetData.activity_creator_asset_id==assetData.asset_id){
                        creatorAssetDetails.push({ name: assetData[0].operating_asset_first_name,
                            email: assetData[0].operating_asset_email_id,})
                    }
                    emailsToAdd.push({
                        name: assetData[0].operating_asset_first_name,
                        email: assetData[0].operating_asset_email_id,
                    });
                }
            }
            let htmlReceived = "";
        //   console.log(htmlReceived)

        ics.createEvent({
                title: subjectContent,
                description: bodyContent,
                busyStatus: "FREE",
                location: eventLocation.length>0 ? eventLocation[0].field_value : "",
                start: [
                    createDate.getFullYear(),
                    createDate.getMonth() + 1,
                    createDate.getDate(),
                    createDate.getHours(),
                    createDate.getMinutes(),
                ],
                duration: {
                    minutes: timeDifferenceInMinutes
                },
                organizer: {
                    name: creatorAssetDetails[0].name,
                    email: creatorAssetDetails[0].email,
                },
                attendees: emailsToAdd,
            },
            async (error, value) => {
                if (error) {
                    util.logError(request,`Error`, { type: 'bot_engine', error });
                }

                let fileName = `${global.config.efsPath}${
                    request.asset_id
                  }-${today.getTime()}.ics`;
                fs.writeFileSync(fileName, value);

                request.email_sender_name = "GreneOS";

                request.email_sender = "admin@grenerobotics.com";
                // for(let j=0;j<emailsToAdd.length;j++){
                request.email_receiver_name = receiver_name;
                let emailsToSend = [];
                for (let i = 0; i < emailsToAdd.length; i++) {
                    if(emailsToAdd[i].email == "shankar@gmail.com"){

                    }
                    else{
                    emailsToSend.push(emailsToAdd[i].email);
                    }
                }
                let [s3err, s3Response] = await util.uploadICSFileToS3V1(
                    request,
                    fileName
                );
                util.logInfo(request,"Emails To Send" + emailsToSend);
                let emailProviderDetails = {
                    email:activity_type_inline_data.activity_type_email_id,
                    password:activity_type_inline_data.activity_type_email_password,
                    username:activity_type_inline_data.activity_type_email_username
                }
                // console.log(s3Response);
                util.sendEmailV4ewsV1(
                    request,
                    emailsToSend,
                    subjectContent,
                    bodyContent,
                    s3Response[0].location,
                    emailProviderDetails
                );
                fs.unlink(fileName, function(err) {
                    if (err) return util.logError(request,`Error`, { type: 'bot_engine', err });;
                    util.logInfo(request,`file deleted successfully %j`, request);
                });
            })
        });

    }

    async function generateHtmlForParticipantList(req,participantsList){
        let htmlString = '<p>Hi,</p><p>Greetings from Vi&trade;</p><br><table width="100%" border="1" cellspacing="0"><thead><tr>';
        let slNoOfParticipant = 1;

		let participantListEmailString = '<br><table border="1" cellspacing="0"><thead><tr><th colspan="3" >Participant List</th><tr><th>Sl No</th><th>Name</th><th>Email</th></tr></thead><tbody>'
		for (const asset of participantsList) {
			if (asset.email !== null && asset.email !== "") {
				participantListEmailString += '<tr>';
				participantListEmailString += '<td>' + (slNoOfParticipant++) + '</td>';
				participantListEmailString += '<td>' + asset.name + '</td>';
				participantListEmailString += '<td>' + asset.email + '</td>';
				participantListEmailString += '</tr>';
			}
		}
		participantListEmailString += '</tbody></table><br>';

		htmlString += '</tbody></table><br><br>' + participantListEmailString + '<p>Thanks,</p><p>Vi&trade; Business</p>';
		return htmlString;
    }

    async function getAssetByEmail(request) {
      let responseData = [],
        error = true;

      const paramsArr = new Array(request.organization_id, request.email);
      const queryString = util.getQueryString(
        "ds_v1_asset_list_select_email",
        paramsArr
      );
      if (queryString !== "") {
        await db
          .executeQueryPromise(1, queryString, request)
          .then((data) => {
            responseData = data;
            error = false;
          })
          .catch((err) => {
            error = err;
          });
      }
      return [error, responseData];
    }

    async function kafkaProdcucerForChildOrderCreation(topicName, message) {
        const kafka = new Kafka({
            clientId: 'child-order-creation',
            brokers: global.config.BROKER_HOST.split(",")
        })

        const producer = kafka.producer()

        await producer.connect()
        await producer.send({
            topic: topicName,

            messages: [
                {
                    value: JSON.stringify(message)
                },
            ],
        })
        producer.disconnect();
        return;
    }

    async function autoFormSubmission(request,inlineData){


        if(inlineData.submit_form.hasOwnProperty('check_dates')&&Number(inlineData.submit_form.check_dates)===1){
            
            let field_value1 = await getFormFieldValue(request,inlineData.submit_form.field_id1);
            util.logInfo(request,"field_value 1"+field_value1);
            let field_value2 = await getFormFieldValue(request,inlineData.submit_form.field_id2);
            util.logInfo(request,"field_value 2"+field_value2);
            const time1 = field_value1 //.format('YYYY-MM-DD');
            const time2 = field_value2 //.format('YYYY-MM-DD');
            if(time1 == time2){
             submitFormInternal(request,inlineData,time1)
            }
        }
        // submitFormInternal(request,inlineData)
        }

        async function submitFormInternal(request,inlineData,dateValue){
            let formData = inlineData.form_data;
            let activityInlineData = [
                {
                  "form_id": 50825,
                  "field_id": 312338,
                  "field_name": "Status",
                  "field_value": "Closed",
                  "message_unique_id": "404641627463602240",
                  "data_type_combo_id": 1,
                  "field_data_type_id": 33,
                  "field_reference_id": 0,
                  "data_type_combo_value": 0,
                  "field_data_type_category_id": 14
                },
          {
                  "form_id": 50825,
                  "field_id": 312341,
                  "field_name": "Closed Date",
                  "field_value": dateValue,
                  "message_unique_id": "404641627463602240",
                  "data_type_combo_id": 0,
                  "field_data_type_id": 2,
                  "field_reference_id": 0,
                  "data_type_combo_value": '',
                  "field_data_type_category_id": 1
                },  
                {
                  "form_id": 50825,
                  "field_id": 312416,
                  "field_name": "comments",
                  "field_value": "",
                  "message_unique_id": "404641627464374845",
                  "data_type_combo_id": 0,
                  "field_data_type_id": 20,
                  "field_reference_id": 0,
                  "data_type_combo_value": "0",
                  "field_data_type_category_id": 7
                }
              ];
// console.log(formData)
            // for(let data of formData) {
            //     activityInlineData.push({
            //         "form_id": data.form_id,
            //         "field_id": data.field_id,
            //         "field_name": data.field_name,
            //         "message_unique_id": data.message_unique_id,
            //         "data_type_combo_id": data.data_type_combo_id,
            //         "field_data_type_id": data.data_type_id,
            //         "data_type_combo_value": data.data_type_combo_value,
            //         "field_data_type_category_id": data.data_type_category_id
            //     });
            // }

            util.logInfo(request,`activityInlineData : %j` , JSON.stringify(activityInlineData));


            let formId = formData[0].form_id;

            let createWorkflowRequest = Object.assign({}, request);
            let targetFormctivityTypeID = inlineData.submit_form.form_activity_type_id;
           
            createWorkflowRequest.activity_type_id          = targetFormctivityTypeID;
            createWorkflowRequest.activity_inline_data      = JSON.stringify(activityInlineData);
            createWorkflowRequest.workflow_activity_id      = Number(request.workflow_activity_id);
            createWorkflowRequest.activity_type_category_id = 9;
            createWorkflowRequest.activity_parent_id        = 0;
            createWorkflowRequest.activity_form_id          = formId;
            createWorkflowRequest.form_id                   = formId;
            createWorkflowRequest.activity_datetime_start   = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            createWorkflowRequest.activity_datetime_end     = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            createWorkflowRequest.device_os_id              = 7;

            const targetFormActivityID                = await cacheWrapper.getActivityIdPromise();
            const targetFormTransactionID             = await cacheWrapper.getFormTransactionIdPromise();
            createWorkflowRequest.activity_id         = targetFormActivityID;
            createWorkflowRequest.form_transaction_id = targetFormTransactionID;
            createWorkflowRequest.data_entity_inline  = createWorkflowRequest.activity_inline_data;
            createWorkflowRequest.message_unique_id = util.getMessageUniqueId(100);
            createWorkflowRequest.log_message_unique_id = util.getMessageUniqueId(100);

            util.logInfo(request,`createWorkflowRequest %j` , JSON.stringify(createWorkflowRequest));
            // request.debug_info.push('createWorkflowRequest: ' + createWorkflowRequest);
            const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
            let activityInsertedDetails = await addActivityAsync(createWorkflowRequest);

            util.logInfo(request,`activityInsertedDetails----> %j` , activityInsertedDetails);
            // request.debug_info.push('activityInsertedDetails: ' + activityInsertedDetails);


            let activityTimelineCollection =  JSON.stringify({
                "content"            : `Form Submitted`,
                "subject"            : `Form Submitted`,
                "mail_body"          : `Form Submitted`,
                "activity_reference" : [],
                "form_id"            : formId,
                "form_submitted"     : JSON.parse(createWorkflowRequest.data_entity_inline),
                "asset_reference"    : [],
                "attachments"        : [],
                "form_approval_field_reference": []
            });


            let timelineReq = Object.assign({}, createWorkflowRequest);

            timelineReq.activity_id                  = request.workflow_activity_id;
            timelineReq.message_unique_id            = util.getMessageUniqueId(100);
            timelineReq.track_gps_datetime           = util.getCurrentUTCTime();
            timelineReq.activity_stream_type_id      = 705;
            timelineReq.timeline_stream_type_id      = 705;
            timelineReq.activity_type_category_id    = 48;
            timelineReq.asset_id                     = 100;
            timelineReq.activity_timeline_collection = activityTimelineCollection;
            timelineReq.data_entity_inline           = timelineReq.activity_timeline_collection;

            await activityTimelineService.addTimelineTransactionAsync(timelineReq);
        }

    let midmileExcelCreationBot = async (request, inlineJOSN) => {

        try {

            // inlineJOSN = {
            //     "sqs_queue": "https://sqs.ap-south-1.amazonaws.com/430506864995/clms-test.fifo",
            //     "input": {
            //         "input_type": {
            //             "form_id": 51007,
            //             "field_id": 313637
            //         },
            //         "input_fields": {
            //             "datacenter": {
            //                 "0": [{
            //                     "form_id": 51007,
            //                     "field_id": 313613
            //                 }],
            //                 "1": [{
            //                     "form_id": 51007,
            //                     "field_id": 313612
            //                 }]
            //             },
            //             "pincode": {
            //                 "0": [{
            //                     "form_id": 51007,
            //                     "field_id": 313613
            //                 }],
            //                 "1": [{
            //                     "form_id": 51007,
            //                     "field_id": 313611
            //                 }, {
            //                     "form_id": 51007,
            //                     "field_id": 313639
            //                 }, {
            //                     "form_id": 51007,
            //                     "field_id": 313641
            //                 }]
            //             }
            //         }
            //     },
            //     "output": {
            //         "1": {
            //             "flag_param_type_id": 1,
            //             "flag_param_type_name": "field",
            //             "form_id": 51007,
            //             "field_id": 313613,
            //             "param_name": "probability",
            //             "field_value": ""
            //         },
            //         "2": {
            //             "flag_param_type_id": 1,
            //             "flag_param_type_name": "field",
            //             "form_id": 51007,
            //             "field_id": 313612,
            //             "param_name": "Data Center",
            //             "field_value": ""
            //         },
            //         "3": {
            //             "flag_param_type_id": 2,
            //             "flag_param_type_name": "array_of_field",
            //             "param_name": "pincode",
            //             "field_details": [{
            //                 "form_id": 51007,
            //                 "field_id": 313611,
            //                 "field_value": ""
            //             }, {
            //                 "form_id": 51007,
            //                 "field_id": 313639,
            //                 "field_value": ""
            //             }, {
            //                 "form_id": 51007,
            //                 "field_id": 313641,
            //                 "field_value": ""
            //             }]
            //         }
            //     }
            // };

            const workflowActivityID = request.workflow_activity_id || request.activity_id || 0;
            let sqsQueueUrl = inlineJOSN.sqs_queue;
            let inputJSON = inlineJOSN.input;
            let outputJSON = inlineJOSN.output;
            let inputTypeFormID = inputJSON.input_type.form_id;
            let inputTypeFieldID = inputJSON.input_type.field_id;

            util.logInfo(request,`inputTypeFormID : ${inputTypeFormID}`);
            util.logInfo(request,`inputTypeFieldID ${inputTypeFieldID}`);

            const inputTypeFormData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, workflowActivityID, inputTypeFormID);

            let inputTypeFormActivityID = 0, inputTypeFormTransactionID = 0;

            if (Number(inputTypeFormData.length) > 0) {
                inputTypeFormActivityID = Number(inputTypeFormData[0].data_activity_id);
                inputTypeFormTransactionID = Number(inputTypeFormData[0].data_form_transaction_id);
            }

            if (inputTypeFormActivityID === 0 || inputTypeFormTransactionID === 0) {
                logger.error(`Midmile form is not submitted`);
                throw new Error("Midmile form is not submitted");
            }

            const inputTypeFieldDataFieldData = await getFieldValue({
                form_transaction_id: inputTypeFormTransactionID,
                form_id: inputTypeFormID,
                field_id: inputTypeFieldID,
                organization_id: request.organization_id
            });

            let inputTypeValue = "";
            if (inputTypeFieldDataFieldData.length > 0) {
                inputTypeValue = inputTypeFieldDataFieldData[0][getFielDataValueColumnNameNew(inputTypeFieldDataFieldData[0].data_type_id)];
            }

            if (inputTypeValue.length > 0) {
                inputTypeValue = inputTypeValue.split(/\s/).join('').toLowerCase();
            }

            let inputFields = inputJSON["input_fields"][inputTypeValue];

            let fieldIdValueMap = new Map();
            for (let key of Object.keys(inputFields)) {
                for (let field of inputFields[key]) {
                    util.logInfo(request,`field : %j` , field);

                    const inputFormData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                        organization_id: request.organization_id,
                        account_id: request.account_id
                    }, workflowActivityID, field.form_id);

                    let inputFormActivityID = 0, inputFormTransactionID = 0;

                    if (Number(inputFormData.length) > 0) {
                        inputFormActivityID = Number(inputFormData[0].data_activity_id);
                        inputFormTransactionID = Number(inputFormData[0].data_form_transaction_id);
                    }

                    if (inputFormActivityID === 0 || inputFormTransactionID === 0) {
                        logger.error(`Midmile form is not submitted`);
                        throw new Error("Midmile form is not submitted");
                    }

                    const inputFieldDataFieldData = await getFieldValue({
                        form_transaction_id: inputTypeFormTransactionID,
                        form_id: field.form_id,
                        field_id: field.field_id,
                        organization_id: request.organization_id
                    });

                    let inputValue = "";
                    if (inputFieldDataFieldData.length > 0) {
                        inputValue = inputFieldDataFieldData[0][getFielDataValueColumnNameNew(inputFieldDataFieldData[0].data_type_id)];
                    }

                    fieldIdValueMap.set(field.field_id, inputValue);

                }
            }

            for (const outputFieldKey of Object.keys(outputJSON)) {
                let outputFieldConfig = outputJSON[outputFieldKey];
                if (outputFieldConfig.flag_param_type_id === 1) {
                    let value = fieldIdValueMap.get(outputFieldConfig.field_id);
                    if (value) {
                        outputFieldConfig.field_value = fieldIdValueMap.get(outputFieldConfig.field_id);
                    } else {
                        delete outputJSON[outputFieldKey];
                    }

                } else if (outputFieldConfig.flag_param_type_id === 2) {

                    let fieldDetails = outputFieldConfig.field_details.flatMap((fieldDetails) => {
                        let value = fieldIdValueMap.get(fieldDetails.field_id);
                        if (value) {
                            return { ...fieldDetails, field_value: value }
                        } else {
                            return []
                        }
                    })
                    if (fieldDetails.length === 0) {
                        delete outputJSON[outputFieldKey];
                    } else {
                        outputFieldConfig.field_details = fieldDetails;
                    }

                }
            }

            let finalOput = {
                request: {
                    asset_id: Number(request.asset_id),
                    activity_id: Number(request.activity_id),
                    workforce_id: Number(request.workforce_id),
                    account_id: Number(request.account_id)
                },
                input: outputJSON
            };

            util.logInfo(request, "Output JSON for midmile sqs %j", { message: JSON.stringify(finalOput) });

            sqs.sendMessage({
                MessageBody: JSON.stringify(finalOput),
                QueueUrl: sqsQueueUrl,
                MessageGroupId: `midmile-excel-job-queue-v1`,
                MessageDeduplicationId: uuidv4(),
                MessageAttributes: {
                    "Environment": {
                        DataType: "String",
                        StringValue: global.mode
                    },
                }
            }, (error, data) => {
                if (error) {
                    util.logError(request, `Error sending excel job to SQS queue`, { type: 'bot_engine', error: serializeError(error), request_body: request });
                } else {
                    util.logInfo(request, `Successfully sent excel job to SQS queue: %j`, { type: 'bot_engine', request_body: request });
                }
            });

        } catch (e) {
            util.logError(request,`Error`, { type: 'bot_engine', e });
        }
    }
    async function closeRefferedOutActivities(request,bot_inline){
        const workflowActivityID = request.workflow_activity_id;
        let [err1,activityDetails_1] = await getActivityDetailsAsync(request,workflowActivityID);
        
        let sourceFieldValue = await getFieldValueUsingFieldIdV1({...request,workflow_activity_id:0},bot_inline.source_form_data.form_id,bot_inline.source_form_data.field_id);
        if(sourceFieldValue == ""){
            return [false,[]]
        }
        let requestForChildActivities = {
            ...request,
            activity_type_id:bot_inline.target_form_data.form_activity_type_id,
            activity_type_category_id:0,
            tag_id:0,
            tag_type_id:0,
            flag:2,
            page_limit:50
        }
        //get list of activities Reffered out
        const [actListErr,referedOutActivities] = await activityListingService.getActActChildActivitiesV1(requestForChildActivities);
// console.log(referedOutActivities)
        if(referedOutActivities.length==0){
            return [false,[]]
        }
        // return [false,[]]
        //continuing because there are activities to close
        
        for(let i=0;i<referedOutActivities.length;i++){
            let [err12,activityDetails_12] = await getActivityDetailsAsync(request,referedOutActivities[i].activity_id);
            if(Number(activityDetails_12[0].activity_workflow_completion_percentage)==100 || Number(activityDetails_12[0].activity_workflow_completion_percentage)==100.00){
                continue;
            }
            await submitFormInternalV1(request,bot_inline,referedOutActivities[i].activity_id,sourceFieldValue)
        }
        return [false,[]]

    }

    async function submitFormInternalV1(request,inlineData,workFlowActivityID,sourceFieldValue){
        let sds = await createActivity(request,inlineData,workFlowActivityID,sourceFieldValue);
        // console.log(sds)
        return [false,[]]
       
    }
    async function createActivity(request, inlineData,workflowActivityID,sourceFieldValue) {
        let formData = inlineData.target_form_data;
        let activityInlineData = formData.fields;
        activityInlineData[0].field_value = `Opportunity Closed - ${sourceFieldValue}`;
        util.logInfo(request,`activityInlineData %j` , JSON.stringify(activityInlineData));
        let formId = formData.form_id;

        let targetFormctivityTypeID = formData.form_activity_type_id;
        let targetActivityTypeID = formData.activity_type_id;
        const addActivityRequest = {
            ...request,
            workflow_activity_id: Number(workflowActivityID),
            activity_id : Number(workflowActivityID),
            channel_activity_id: Number(workflowActivityID),
            form_id:formId,
            form_transaction_id : 0,
            isOrigin :false,
            is_mytony: 1,
            form_api_activity_type_category_id: 48,
            form_api_activity_type_id: targetFormctivityTypeID,
            form_id: formId,
            form_workflow_activity_type_id: targetFormctivityTypeID,
            data_entity_inline: JSON.stringify(activityInlineData),
            activity_inline_data: JSON.stringify(activityInlineData),
            activity_datetime_start: util.getCurrentUTCTime(),
            activity_datetime_end: util.getCurrentUTCTime(),
            activity_type_category_id: 9,
            activity_sub_type_id: 0,
            activity_type_id: targetActivityTypeID,
            asset_participant_access_id: 0,
            activity_parent_id: 0,
            flag_pin: 0,
            flag_priority: 0,
            activity_flag_file_enabled: -1,
            activity_form_id: formId,
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(31993),
            activity_channel_id: workflowActivityID,
            activity_channel_category_id: 0,
            activity_flag_response_required: 0,
            track_latitude: 0.0,
            track_longitude: 0.0,
            track_altitude: 0,
            track_gps_datetime: util.getCurrentUTCTime(),
            track_gps_accuracy: 0,
            track_gps_status: 0,
            service_version: "3.0",
            app_version: "3.0.0",
            device_os_id: 5
        };

        const addActivityAsync = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form: addActivityRequest
        };
        try {
            // global.config.mobileBaseUrl + global.config.version
            const response = await addActivityAsync(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', makeRequestOptions);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                util.logInfo(request,`createActivity | addActivityAsync | Body: %j` , body);
                let activityTimelineCollection =  JSON.stringify({
                    "content"            : `Form Submitted`,
                    "subject"            : `Form Submitted`,
                    "mail_body"          : `Form Submitted`,
                    "activity_reference" : [],
                    "form_id"            : formId,
                    "form_submitted"     : JSON.parse(addActivityRequest.data_entity_inline),
                    "asset_reference"    : [],
                    "attachments"        : [],
                    "form_approval_field_reference": []
                });
        
                addActivityRequest.form_transaction_id = body.response.form_transaction_id;
                let timelineReq = Object.assign({}, addActivityRequest);
        
                timelineReq.activity_id                  = workflowActivityID;
                timelineReq.message_unique_id            = util.getMessageUniqueId(100);
                timelineReq.track_gps_datetime           = util.getCurrentUTCTime();
                timelineReq.activity_stream_type_id      = 705;
                timelineReq.timeline_stream_type_id      = 705;
                timelineReq.activity_type_category_id    = 48;
                timelineReq.asset_id                     = 100;
                timelineReq.activity_timeline_collection = activityTimelineCollection;
                timelineReq.data_entity_inline           = timelineReq.activity_timeline_collection;
        
                await activityTimelineService.addTimelineTransactionAsync(timelineReq);
                return [false, body];
            }
        } catch (error) {
            util.logError(request,`createActivity | addActivityAsync | Error: `, { type: 'bot_engine', error });
            return [true, {}];
        }
    }

    async function activityListSearchCUIDFromParentActivityID(request) {
        let error = true,
            responseDataMp = new Map();

        const paramsArr = new Array(
            request.organization_id,
            request.activity_type_category_id,
            request.activity_type_id || 0,
            request.parent_activity_id,
            request.page_start || 0,
            request.page_limit || 2000
        );

        const queryString = util.getQueryString('ds_v1_activity_list_select_parent', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {

                    for (let childData of data) {
                        responseDataMp.set(childData.activity_cuid_1, childData);
                    }
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseDataMp];
    }

    async function momBulkTransactionInsert(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.meeting_activity_id,
            request.mom_excel_path,
            request.status_id,
            util.getCurrentUTCTime(),
            request.organization_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_mom_bulk_transaction_insert', paramsArr);

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
    async function formFieldsHistory (request) {

        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.organization_id,
            request.form_transaction_id || 0,
            request.form_id,
            request.field_id
        );
        const queryString = util.getQueryString('ds_p1_1_activity_form_transaction_select_trans_field_history', paramsArr);

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

    async function handleBotOperationMessageUpdate(request, i = {}) {

        try {

            let statusID = 3;

            if (i.bot_operation_error_message) {
                statusID = 4;
            }

            let requestForBotTransactionUpdate = {};
            requestForBotTransactionUpdate.sqs_bot_transaction_id = request.sqs_bot_transaction_id || 0;
            requestForBotTransactionUpdate.message_id = request.message_id || "";
            requestForBotTransactionUpdate.bot_operation_id = i.bot_operation_id || 0;
            requestForBotTransactionUpdate.bot_operation_type_id = i.bot_operation_type_id || 0;
            requestForBotTransactionUpdate.workflow_activity_id = request.workflow_activity_id || 0;
            requestForBotTransactionUpdate.form_activity_id = request.data_activity_id || 0;
            requestForBotTransactionUpdate.form_transaction_id = request.form_transaction_id || 0;
            requestForBotTransactionUpdate.form_id = i.form_id || 0;
            requestForBotTransactionUpdate.field_id = i.field_id || 0;
            requestForBotTransactionUpdate.status_id = statusID;
            requestForBotTransactionUpdate.bot_operation_start_datetime = i.bot_operation_start_datetime;
            requestForBotTransactionUpdate.bot_operation_end_datetime = i.bot_operation_end_datetime;
            requestForBotTransactionUpdate.error_failed_json = JSON.stringify({ logs: request.debug_info, error: i.bot_operation_error_message || "" });
            requestForBotTransactionUpdate.organization_id = request.organization_id || 0;
            requestForBotTransactionUpdate.log_datetime = util.getCurrentUTCTime();

            await activityCommonService.BOTOperationMessageTransactionInsertAsync(requestForBotTransactionUpdate);
        } catch (e) {
            util.logError(request, `Error inserting bot operation message `, { type: "bot_consumer", error: serializeError(e) })
        }

    }
    async function formFieldGamificationData(request){
        let responseData = [],
            error = true;
        let paramsArr = [
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id,
            '1970-01-01 00:00:00',
            0,
            100
        ];
        let queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select', paramsArr);
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

    async function fieldMappingGamification(request, inline_data) {
      let [err, data] = await formFieldGamificationData(request);
      let totalScore = 0;
      for (let i = 0; i < data.length; i++) {
        try {
            console.log("index",i)
          let each = await data.find(
            (val) => val.field_id == inline_data[i].field_id
          );
          totalScore = totalScore + Number(each.field_gamification_score_value)
          inline_data[i].field_gamification_score_value =
            each.field_gamification_score_value;
        } catch (err1) {
          continue;
        }
      }
      return [inline_data,totalScore];
    }

    async function updateAssetSequenceId(request){
        try {
            let error = true;
            let paramsArray =
                new Array(
                    request.asset_id,
                    request.organization_id,
                    request.sequence_id,
                    request.cycle_id,
                    request.log_asset_id,
                    util.getCurrentUTCTime()
                );
                const queryString = util.getQueryString('ds_v1_asset_list_update_arp_rr_sequence', paramsArray);
                if (queryString != '') {
                    await db.executeQueryPromise(0, queryString, request)
                       .then((data)=>{
                            error = false;
                        }).catch((err)=>{
                            util.logError(request,`[Error] bot data update `, { type: 'bot_config', err });
                            error = err;
                        });
                }
        } catch(e) {
            util.logError(request,`[Error] bot data update `, { type: 'bot_config', e });
            return [true, []];
        }
    }

    async function updateArpRRFlag(request){
        try {
            let error = true;
            let paramsArray =
                new Array(
                    request.organization_id,
                    request.asset_type_id,
                    request.asset_type_arp_round_robin_enabled || 0,
                    request.log_asset_id,
                    util.getCurrentUTCTime()
                );
                const queryString = util.getQueryString('ds_v1_workforce_asset_type_mapping_update_arp_rr', paramsArray);
                if (queryString != '') {
                    await db.executeQueryPromise(0, queryString, request)
                       .then((data)=>{
                            error = false;
                        }).catch((err)=>{
                            util.logError(request,`[Error] bot data update `, { type: 'bot_config', err });
                            error = err;
                        });
                }
        } catch(e) {
            util.logError(request,`[Error] bot data update `, { type: 'bot_config', e });
            return [true, []];
        }
    }

    async function customQtyUpdateBot(request, botInlineJson) {
        try {
            let formId = request.form_id;
            const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, request.workflow_activity_id, formId);

            let dataEntityInline = JSON.parse(formData[0].data_entity_inline);

            if (typeof dataEntityInline == "string") {
                dataEntityInline = JSON.parse(dataEntityInline);
            }

            let activityInlineData = dataEntityInline.form_submitted;

            let referenceFieldValue = activityInlineData.filter((inline) => inline.field_id == botInlineJson.refrence_field_id)[0].field_value;
            let qtyFieldValue = activityInlineData.filter((inline) => inline.field_id == botInlineJson.qty_field_id)[0].field_value;
            qtyFieldValue = Number(qtyFieldValue);

            let referenceActivityId = referenceFieldValue.split("|")[0];
            let wfActivityDetails = await activityCommonService.getActivityDetailsPromise(request, referenceActivityId);

            if (wfActivityDetails.length > 0) {
                let workflowFinalValue = wfActivityDetails[0].activity_workflow_value_final;
                workflowFinalValue = Number(workflowFinalValue) || 0;
                if (botInlineJson.type_of_operation === "add") {
                    let sum = workflowFinalValue + qtyFieldValue;
                    let reqForUpdateQty = Object.assign({}, request);
                    reqForUpdateQty.workflow_activity_id = referenceActivityId;
                    reqForUpdateQty.sequence_id = 1;
                    await activityCommonService.updateWorkflowValue(reqForUpdateQty, sum);
                    await addTimelineEntry({ ...request, content: `The current quantity of "${wfActivityDetails[0].activity_title}" is ${workflowFinalValue} and it is updated to ${sum}`, subject: "sample", mail_body: request.mail_body, attachment: [], timeline_stream_type_id: request.timeline_stream_type_id }, 1);
                } else if (botInlineJson.type_of_operation === "subtract") {
                    if (workflowFinalValue > qtyFieldValue) {
                        let sub = workflowFinalValue - qtyFieldValue;
                        let reqForUpdateQty = Object.assign({}, request);
                        reqForUpdateQty.workflow_activity_id = referenceActivityId;
                        reqForUpdateQty.sequence_id = 1;
                        await activityCommonService.updateWorkflowValue(reqForUpdateQty, sub);
                        await addTimelineEntry({ ...request, content: `The current quantity of "${wfActivityDetails[0].activity_title}" is ${workflowFinalValue} and it is updated to ${sub}`, subject: "sample", mail_body: request.mail_body, attachment: [], timeline_stream_type_id: request.timeline_stream_type_id }, 1);
                    } else {
                        await addTimelineEntry({ ...request, content: `Error:\nThe Requested qty for "${wfActivityDetails[0].activity_title}" is higher than the current quantity.`, subject: "sample", mail_body: request.mail_body, attachment: [], timeline_stream_type_id: request.timeline_stream_type_id }, 1);
                    }
                }
            }

        } catch (e) {
            console.log(e);
        }
    }

    async function customTimelineEntryBot(request, botInlineJson) {
        try {
            let formId = request.form_id;
            const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, request.workflow_activity_id, formId);

            let dataEntityInline = JSON.parse(formData[0].data_entity_inline);

            if (typeof dataEntityInline == "string") {
                dataEntityInline = JSON.parse(dataEntityInline);
            }

            let activityInlineData = dataEntityInline.form_submitted;

            let referenceFieldValue = activityInlineData.filter((inline) => inline.field_id == botInlineJson.refrence_field_id)[0].field_value;
            let referenceActivityId = referenceFieldValue.split("|")[0];
            let wfActivityDetails = await activityCommonService.getActivityDetailsPromise(request, referenceActivityId);

            if (wfActivityDetails.length > 0) {
                let workflowFinalValue = wfActivityDetails[0].activity_workflow_value_final;
                workflowFinalValue = Number(workflowFinalValue) || 0;
                await addTimelineEntry({ ...request, content: `The current quantity of "${wfActivityDetails[0].activity_title}" is ${workflowFinalValue}`, subject: "sample", mail_body: request.mail_body, attachment: [], timeline_stream_type_id: request.timeline_stream_type_id }, 1);
            }

        } catch (e) {
            console.log(e);
        }
    }

    async function pdfValidationBot(request, botInlineJson) {
        try {
            let finalPdfText = "";
            if (!request.hasOwnProperty("workflow_activity_id")) {
                request.workflow_activity_id = request.activity_id
            }

            let referenceFormId = botInlineJson.reference_form_id;
            const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, request.workflow_activity_id, request.form_id);

            let dataEntityInline = JSON.parse(formData[0].data_entity_inline);

            if (typeof dataEntityInline == "string") {
                dataEntityInline = JSON.parse(dataEntityInline);
            }

            let activityInlineData = dataEntityInline.form_submitted;
            let referenceFieldValue = activityInlineData.filter((inline) => inline.field_id == botInlineJson.refrence_field_id)[0].field_value;
            let referenceActivityId = referenceFieldValue.split("|")[0];
            let pdfFeildValue = activityInlineData.filter((inline) => inline.field_id == botInlineJson.pdf_field_id)[0].field_value;

            let wfActivityDetails = await activityCommonService.getActivityDetailsPromise(request, referenceActivityId);

            const [data, bucketPath] = await util.getS3ObjectsfromFolder(pdfFeildValue);

            console.log(data, bucketPath);

            let excelData = {};
            let cellColorData = {};

            let totalMisMatchData = "";

            let misMatchFound = false;

            const refrenceFormData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, referenceActivityId, referenceFormId);

            let refrenceDataEntityInline = JSON.parse(refrenceFormData[0].data_entity_inline);
            if (typeof refrenceDataEntityInline == "string") {
                refrenceDataEntityInline = JSON.parse(refrenceDataEntityInline);
            }
            let activityInlineDataOfReferenceActivity = refrenceDataEntityInline.form_submitted;
            console.log(activityInlineDataOfReferenceActivity);

            for (let index = 0; index < data.length; index++) {
                let pdfPath = data[index]['Key'];
                let misMactchData = "";
                console.log(bucketPath + pdfPath);

                let pdfFileName = pdfPath.split("/")[pdfPath.split("/").length - 1];
                const [pdfBufferError, pdfBuffer] = await util.getXlsxDataBodyFromS3Url(request, bucketPath + pdfPath);

                if (pdfBufferError) {
                    util.logError(request, `[PdfValidationError] `, { error: pdfBufferError });
                    throw new Error(pdfBufferError);
                }

                if (wfActivityDetails.length > 0) {

                    let finalPdfText = await readPdfAsync(pdfBuffer);

                    let columnIndex = 0;
                    excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = pdfFileName;
                    for (const [fieldId, fieldConfig] of Object.entries(botInlineJson.pdf_config)) {

                        let fieldData = activityInlineDataOfReferenceActivity.filter((inline) => inline.field_id == fieldId)[0];
                        let fieldValue = fieldData.field_value;
                        let fieldName = fieldData.field_name;

                        if (fieldConfig.hasOwnProperty("starts_from")) {
                            let startsFrom = fieldConfig.starts_from;
                            let endsAt = fieldConfig.ends_at;

                            let startIndex = -1;

                            if (startsFrom.hasOwnProperty("end_of")) {
                                if (startsFrom.hasOwnProperty("place_of_occurance") && startsFrom.place_of_occurance > 0) {
                                    let indexes = [...finalPdfText.matchAll(new RegExp(startsFrom.end_of, 'gi'))].map(a => a.index);
                                    if (indexes.length >= startsFrom.place_of_occurance) {
                                        startIndex = indexes[startsFrom.place_of_occurance];
                                    }
                                } else {
                                    startIndex = finalPdfText.indexOf(startsFrom.end_of);
                                }

                                if (startIndex != -1) {
                                    startIndex += startsFrom.end_of.length;
                                    let subString = finalPdfText.substring(startIndex);
                                    const indexes = [...subString.matchAll(new RegExp("\n", 'gi'))].map(a => a.index);
                                    let extractedPdfValueOfField = finalPdfText.substring(startIndex, startIndex + indexes[endsAt.line_number]).trim();
                                    extractedPdfValueOfField = extractedPdfValueOfField.replace(/\n/g, "");

                                    excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = fieldValue;
                                    excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = extractedPdfValueOfField;

                                    if (fieldValue != extractedPdfValueOfField) {
                                        misMatchFound = true;
                                        misMactchData += `<b>${fieldName}</b>\n`;
                                        misMactchData += `Correct Value: ${fieldValue}\nIncorrect Value: ${extractedPdfValueOfField}\n\n`;
                                        excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = "Mismatch";
                                        cellColorData[`${excelColumnName.intToExcelCol(columnIndex)}${index + 3}`] = "red";
                                    } else {
                                        excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = "Matched";
                                        cellColorData[`${excelColumnName.intToExcelCol(columnIndex)}${index + 3}`] = "green";
                                    }

                                } else {
                                    misMatchFound = true;
                                    misMactchData += `<b>${fieldName}</b>\n`;
                                    misMactchData += `Correct Value: ${fieldValue}\nIncorrect Value: Couldn't extract.\n\n`;

                                    excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = fieldValue;
                                    excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = "Couldn't extract";
                                    excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = "Mismatch";
                                    cellColorData[`${excelColumnName.intToExcelCol(columnIndex)}${index + 3}`] = "red";
                                }
                            } else if (startsFrom.hasOwnProperty("start_of")) {
                                let indexes = [...finalPdfText.matchAll(new RegExp(startsFrom.start_of, 'gi'))].map(a => a.index);
                                let subString = finalPdfText.substring(0, indexes[startsFrom.place_of_occurance || 0]);
                                indexes = [...subString.matchAll(new RegExp("\n", 'gi'))].map(a => a.index);

                                let extractedPdfValueOfField = subString.substring(indexes[indexes.length - 2], indexes[indexes.length - 1]).trim();

                                excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = fieldValue;
                                excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = extractedPdfValueOfField;

                                extractedPdfValueOfField = extractedPdfValueOfField.replace(/\n/g, "");
                                if (fieldValue != extractedPdfValueOfField) {
                                    misMatchFound = true;
                                    misMactchData += `<b>${fieldName}</b>\n`;
                                    misMactchData += `Correct Value: ${fieldValue}\nIncorrect Value: ${extractedPdfValueOfField}\n\n`;
                                    excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = "Mismatch";
                                    cellColorData[`${excelColumnName.intToExcelCol(columnIndex)}${index + 3}`] = "red";
                                } else {
                                    excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = "Matched";
                                    cellColorData[`${excelColumnName.intToExcelCol(columnIndex)}${index + 3}`] = "green";
                                }
                            }
                        } else if (fieldConfig.hasOwnProperty("between")) {
                            let between = fieldConfig.between;
                            let startsFrom = between.start_from;
                            let endAt = between.end_at;
                            let startIndex = finalPdfText.indexOf(startsFrom);
                            let endIndex = finalPdfText.indexOf(endAt);
                            if (startIndex != -1 && endIndex != -1) {
                                startIndex += startsFrom.length;
                                let extractedPdfValueOfField = finalPdfText.substring(startIndex, endIndex).trim();
                                extractedPdfValueOfField = extractedPdfValueOfField.replace(/\n/g, "");

                                excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = fieldValue;
                                excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = extractedPdfValueOfField;

                                if (fieldValue != extractedPdfValueOfField) {
                                    misMatchFound = true;
                                    misMactchData += `<b>${fieldName}</b>\n`;
                                    misMactchData += `Correct Value: ${fieldValue}\nIncorrect Value: ${extractedPdfValueOfField}\n\n`;
                                    excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = "Mismatch";
                                    cellColorData[`${excelColumnName.intToExcelCol(columnIndex)}${index + 3}`] = "red";
                                } else {
                                    excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = "Matched";
                                    cellColorData[`${excelColumnName.intToExcelCol(columnIndex)}${index + 3}`] = "green";
                                }

                            } else {
                                misMatchFound = true;
                                misMactchData += `<b>${fieldName}</b>\n`;
                                misMactchData += `Correct Value: ${fieldValue}\nIncorrect Value: Couldn't extract.\n\n`;

                                excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = fieldValue;
                                excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = "Couldn't extract";
                                excelData[`${excelColumnName.intToExcelCol(++columnIndex)}${index + 3}`] = "Mismatch";
                                cellColorData[`${excelColumnName.intToExcelCol(columnIndex)}${index + 3}`] = "red";
                            }

                        }

                    }

                    if (misMactchData.length > 0) {
                        misMactchData = `Error!!\n\nMismatch found in Invoice Data : \n\n<b>File Name:</b> ${pdfFileName}\n\n${misMactchData}`;
                        await addTimelineEntry({ ...request, content: misMactchData, subject: "sample", mail_body: request.mail_body, attachment: [], timeline_stream_type_id: request.timeline_stream_type_id }, 1);
                    } else {
                        misMactchData = `No Mismatch found in Invoice Data : \n\n<b>File Name:</b> ${pdfFileName}\n\n${misMactchData}`;
                        await addTimelineEntry({ ...request, content: misMactchData, subject: "sample", mail_body: request.mail_body, attachment: [], timeline_stream_type_id: request.timeline_stream_type_id }, 1);
                    }
                }
                totalMisMatchData += misMactchData;
            }


            let columnIndexRow1 = 1;
            let columnIndexRow2 = 1;

            excelData[`${excelColumnName.intToExcelCol(columnIndexRow1++)}1`] = "File Name";
            excelData[`${excelColumnName.intToExcelCol(columnIndexRow2++)}2`] = "";
            for (const [fieldId, fieldConfig] of Object.entries(botInlineJson.pdf_config)) {

                let fieldData = activityInlineDataOfReferenceActivity.filter((inline) => inline.field_id == fieldId)[0];
                let fieldName = fieldData.field_name;

                excelData[`${excelColumnName.intToExcelCol(columnIndexRow1)}1`] = fieldName;
                columnIndexRow1 += 3;

                excelData[`${excelColumnName.intToExcelCol(columnIndexRow2++)}2`] = "Value from Vendor";
                excelData[`${excelColumnName.intToExcelCol(columnIndexRow2++)}2`] = "Value from Invoice";
                excelData[`${excelColumnName.intToExcelCol(columnIndexRow2++)}2`] = "Remarks";
            }

            const wb = XLSXColor.utils.book_new();
            const ws = XLSXColor.utils.aoa_to_sheet([])

            for (const [key, value] of Object.entries(excelData)) {
                XLSXColor.utils.sheet_add_aoa(ws, [[value]], { origin: key });
            }

            ws["!merges"] = [];
            let columnIndexToMerge = 1;
            for (const [fieldId, fieldConfig] of Object.entries(botInlineJson.pdf_config)) {
                ws["!merges"].push({ s: { c: columnIndexToMerge, r: 0 }, e: { c: columnIndexToMerge + 2, r: 0 } });
                columnIndexToMerge += 3;
            }

            ws["!merges"].push({ s: { c: 0, r: 0 }, e: { c: 0, r: 1 } });


            XLSXColor.utils.book_append_sheet(wb, ws, "sheet_1");

            console.log(ws);
            for (const [cellId, color] of Object.entries(cellColorData)) {

                let colorId = "ff0000";
                if(color == "green") {
                    colorId = "26A65B";
                }
                ws[cellId].s = {
                    fill: {
                        patternType: "solid",
                        fgColor: { rgb: colorId }
                    }
                };
            }

            var fileBuffer = XLSXColor.write(wb, { type: 'buffer', bookType: "xlsx" });
            const timestampIST = moment().utcOffset("+05:30").format("DD_MM_YYYY-hh_mm_A");
            let fileName = request.organization_id + "/summary_report_" + request.activity_id + "_" + timestampIST + ".xlsx";
            let s3Url = await util.uploadXLSXToS3(fileBuffer, fileName);

            timelineMessageObject = {
                subject: "Summary Sheet",
                content: "Summary Sheet",
                mail_body: "Summary Sheet",
                attachments: [s3Url]
            };

            await addTimelineMessage(
                {
                    activity_timeline_text: "Summary Sheet",
                    organization_id: request.organization_id
                }, request.workflow_activity_id || 0,
                timelineMessageObject
            );

            if (misMatchFound) {
                submitPdfValidationForm(request, botInlineJson, "error", totalMisMatchData)
            } else {
                submitPdfValidationForm(request, botInlineJson, "success", totalMisMatchData)
            }

        } catch (error) {
            util.logError(request, "[PdfValidationBotError] Error in pdf validation ", { request, error: serializeError(error) })
        }
    }

    async function readPdfAsync(pdfBuffer) {
        let finalPdfText = "";
        await new Promise((resolve) => {
            new pdfreader.PdfReader().parseBuffer(pdfBuffer, async function (err, item) {
                if (err) {
                    console.error(err);
                    resolve();
                } else if (!item) {
                    resolve();
                } else if (item.text) {
                    finalPdfText += item.text + "\n";
                }
            });
        })

        return finalPdfText;
    }

    async function submitPdfValidationForm(request, botInlineJson, formType, message) {
        try {

            let formId = formType == "error" ? botInlineJson.error_form_id : botInlineJson.success_form_id;
            let fieldId = formType == "error" ? botInlineJson.error_field_id : botInlineJson.success_field_id;
            let formApiActivityTypeId = formType == "error" ? botInlineJson.error_activity_type_id : botInlineJson.success_activity_type_id;
            let formTitle = formType == "error" ? botInlineJson.error_form_title : botInlineJson.success_form_title;

            let dataInLine = [];
            dataInLine.push({
                "data_type_combo_id": 0,
                "data_type_combo_value": "",
                "field_data_type_category_id": 7,
                "field_data_type_id": 20,
                "field_id": fieldId,
                "field_name": "Comments",
                "field_value": message,
                "form_id": formId,
                "message_unique_id": 123123123123123123
            })

            dataInLine = JSON.stringify(dataInLine);
            let timelineCollection = JSON.stringify({
                "mail_body": `${formTitle} Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                "subject": `${formTitle}`,
                "content": `${formTitle}`,
                "asset_reference": [],
                "activity_reference": [],
                "form_approval_field_reference": [],
                "form_submitted": dataInLine,
                "attachments": []
            });

            let newReq = null;
            if (formType == "error") {

                newReq = {
                    "account_id": "1209",
                    "activity_access_role_id": 21,
                    "activity_datetime_end": request.activity_datetime_end,
                    "activity_datetime_start": request.activity_datetime_start,
                    "activity_description": message,
                    "activity_flag_file_enabled": 1,
                    "activity_form_id": 51557,
                    "activity_id": request.workflow_activity_id,
                    "activity_inline_data": dataInLine,
                    "activity_parent_id": 0,
                    "activity_status_id": 467292,
                    "activity_status_type_category_id": 1,
                    "activity_status_type_id": 22,
                    "activity_stream_type_id": 705,
                    "activity_sub_type_id": 0,
                    "activity_timeline_collection": timelineCollection,
                    "activity_timeline_text": "",
                    "activity_timeline_url": "",
                    "activity_title": message,
                    "activity_title_expression": null,
                    "activity_type_category_id": 9,
                    "activity_type_id": 201201,
                    "api_version": 1,
                    "app_version": 1,
                    "asset_id": request.asset_id,
                    "asset_image_path": "",
                    "asset_message_counter": 0,
                    "asset_participant_access_id": 21,
                    "asset_token_auth": request.asset_token_auth,
                    "asset_type_id": "160547",
                    "auth_asset_id": request.auth_asset_id,
                    "channel_activity_id": request.workflow_activity_id,
                    "data_entity_inline": dataInLine,
                    "device_os_id": 5,
                    "expression": "",
                    "file_activity_id": 0,
                    "flag_offline": 0,
                    "flag_pin": 0,
                    "flag_retry": 0,
                    "flag_timeline_entry": 1,
                    "form_api_activity_type_category_id": 48,
                    "form_api_activity_type_id": 201365,
                    "form_id": 51557,
                    "form_transaction_id": 0,
                    "form_workflow_activity_type_id": 201365,
                    "generated_account_code": null,
                    "generated_group_account_name": null,
                    "gst_number": "",
                    "is_mytony": 1,
                    "is_refill": 0,
                    "isOrigin": false,
                    "lead_asset_first_name": null,
                    "lead_asset_id": 0,
                    "lead_asset_type_id": null,
                    "message_unique_id": "543311647506965662",
                    "organization_id": "1061",
                    "organization_onhold": 0,
                    "pan_number": "",
                    "service_version": 1,
                    "track_altitude": 0,
                    "track_gps_accuracy": "0",
                    "track_gps_datetime": "2022-03-17 08:35:05",
                    "track_gps_status": 0,
                    "track_latitude": "0.0",
                    "track_longitude": "0.0",
                    "workflow_activity_id": request.workflow_activity_id,
                    "workforce_id": "6605"
                }
            } else {
                newReq = {
                    "activity_id": request.workflow_activity_id,
                    "channel_activity_id": request.workflow_activity_id,
                    "activity_title": message,
                    "activity_description": message,
                    "activity_inline_data": dataInLine,
                    "data_entity_inline": dataInLine,
                    "activity_timeline_collection": timelineCollection,
                    "form_id": 51559,
                    "activity_form_id": 51559,
                    "workflow_activity_id": request.workflow_activity_id,
                    "activity_type_id": 201201,
                    "is_refill": 0,
                    "form_workflow_activity_type_id": 201365,
                    "generated_group_account_name": null,
                    "generated_account_code": null,
                    "activity_title_expression": null,
                    "gst_number": "",
                    "pan_number": "",
                    "activity_datetime_end": "2022-03-17 08:38:56",
                    "activity_datetime_start": "2022-03-17 08:38:56",
                    "activity_status_id": 467292,
                    "lead_asset_first_name": null,
                    "lead_asset_type_id": null,
                    "lead_asset_id": 0,
                    "isOrigin": false,
                    "form_api_activity_type_category_id": 48,
                    "form_api_activity_type_id": 201365,
                    "organization_id": "1061",
                    "account_id": "1209",
                    "workforce_id": "6605",
                    "asset_id": request.asset_id,
                    "auth_asset_id": request.auth_asset_id,
                    "asset_type_id": "160547",
                    "asset_token_auth": request.asset_token_auth,
                    "asset_image_path": "",
                    "organization_onhold": 0,
                    "device_os_id": 5,
                    "service_version": 1,
                    "app_version": 1,
                    "activity_type_category_id": 9,
                    "activity_sub_type_id": 0,
                    "activity_access_role_id": 21,
                    "asset_message_counter": 0,
                    "activity_status_type_category_id": 1,
                    "activity_status_type_id": 22,
                    "asset_participant_access_id": 21,
                    "activity_flag_file_enabled": 1,
                    "activity_parent_id": 0,
                    "flag_pin": 0,
                    "flag_offline": 0,
                    "flag_retry": 0,
                    "message_unique_id": "543311647507206133",
                    "track_gps_datetime": "2022-03-17 08:38:56",
                    "track_latitude": "0.0",
                    "track_longitude": "0.0",
                    "track_altitude": 0,
                    "track_gps_accuracy": "0",
                    "track_gps_status": 0,
                    "api_version": 1,
                    "activity_stream_type_id": 705,
                    "form_transaction_id": 0,
                    "activity_timeline_text": "",
                    "activity_timeline_url": "",
                    "flag_timeline_entry": 1,
                    "file_activity_id": 0,
                    "is_mytony": 1,
                    "expression": ""
                }
            }
            // let newReq = Object.assign({}, request);
            // newReq.activity_description = message;
            // newReq.activity_form_id = formId;
            // newReq.activity_title = message;
            // newReq.activity_title_expression = null;
            // newReq.activity_type_category_id = 9;
            // newReq.channel_activity_id = request.workflow_activity_id;
            // newReq.form_api_activity_type_category_id = 48;
            // newReq.form_api_activity_type_id = formApiActivityTypeId;
            // newReq.form_id = formId;
            // newReq.form_transaction_id = 0;
            // newReq.generated_account_code = null;
            // newReq.generated_group_account_name = null;
            // newReq.lead_asset_first_name = null;
            // newReq.lead_asset_id = 0;
            // newReq.lead_asset_type_id = null;



            // newReq.activity_inline_data = dataInLine;
            // newReq.activity_timeline_collection = timelineCollection;
            // newReq.data_entity_inline = dataInLine;


            const addActivityAsync = nodeUtil.promisify(makeRequest.post);
            let makeRequestOptions = {
                form: newReq
            };


            console.log(JSON.stringify(newReq, null, 2));
            let response = await addActivityAsync(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', makeRequestOptions);
            let body = JSON.parse(response.body);
            console.log(`Add activity response  %j`, body);

            if (Number(body.status) === 200) {

                newReq.data_activity_id = newReq.workflow_activity_id;
                newReq.activity_type_category_id = 48;
                newReq.form_transaction_id = body.response.form_transaction_id;

                makeRequestOptions = {
                    form: newReq
                };

                const addTimeLineAsync = nodeUtil.promisify(makeRequest.post);
                const maketimelineRequestOptions = {
                    form: newReq
                };
                console.log(`Timeline request params for account %j`, maketimelineRequestOptions);
                const timelineresponse = await addTimeLineAsync(global.config.mobileBaseUrl + global.config.version + '/activity/timeline/entry/add', maketimelineRequestOptions);
                const timelineresponsebody = JSON.parse(timelineresponse.body);
                console.log(`Timeline response  %j`, timelineresponsebody);
            }

        } catch (error) {
            util.logError(request, "[PdfValidationBotError] Error in pdf validation form submission ", { request, error: serializeError(error) })
        }
    }

}



module.exports = BotService;
