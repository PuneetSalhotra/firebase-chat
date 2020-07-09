// Core
const logger = require('../../logger/winstonLogger');
const fs = require('fs');
const moment = require('moment');
const { serializeError } = require('serialize-error');
// MySQL for generating prepared statements
const mysql = require('mysql');

// Debug
const debug_info = require('debug')('workbookOpsService_VodafoneCustom:info');
const debug_warn = require('debug')('workbookOpsService_VodafoneCustom:warn');

// Excel
const XLSX = require('@sheet/core');
const S5SCalc = require("@sheet/formula");
S5SCalc.set_XLSX(XLSX);

const tempy = require('tempy');

// Load the output form mappings
const outputFormMappings = require("../outputFormMappings/index");
const objectPath = require("object-path");

const ActivityService = require('../../services/activityService.js');

function WorkbookOpsService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;
    const queueWrapper = objectCollection.queueWrapper;
    const cacheWrapper = objectCollection.cacheWrapper;
    const nodeUtil = require('util');

    const activityService = new ActivityService(objectCollection);

    const self = this;

    // Helper methods
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isArray(obj) {
        return obj !== undefined && obj !== null && Array.isArray(obj) && obj.constructor == Array;
    }

    function isObject(obj) {
        return obj !== undefined && obj !== null && !Array.isArray(obj) && obj.constructor == Object;
    }

    function getFielDataValueColumnName(fieldDataTypeID, overrideColumnName = "") {
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
            case 57: // Workflow Reference
                if (overrideColumnName !== "" && overrideColumnName === "data_entity_text_2") { return "data_entity_text_2" };
                return 'data_entity_text_1';
            case 59: // Asset Reference
                return 'data_entity_text_3';
            case 20: // Long Text
                return 'data_entity_text_2';
        }
    }

    function getExcelCellDataTypeByfieldDataTypeID(fieldDataTypeID) {
        // type: b Boolean, e Error, n Number, d Date, s Text, z Stub
        switch (fieldDataTypeID) {
            case 1: // Date
            case 2: // Future Date
            case 3: // Past Date
            case 4: // Date and Time
            case 60: // Slot Availability
            case 67: // Reminder
                return 'd';
            case 5: // Number
            case 6: // Decimal
                return 'n';
            case 19: // Short Text
            case 20: // Long Text
            case 21: // Label
            case 22: // Email ID
            case 27: // General Signature with asset reference
            case 33: // Single Selection List
            case 57: // Workflow Reference
            case 59: // Asset Reference
                return 's';
        }
    }

    // Bot Operation Logic
    this.workbookMappingBotOperation = async function (request, formInlineDataMap, botOperationInlineData = {}) {
        const organizationID = Number(request.organization_id);
        const workflowActivityID = request.workflow_activity_id;
        let workbookMappedStreamTypeID = 718; // For initial mapping

        let OpportunityID = "",
            BuildingName = "",
            WorkforceName = "",
            WorkflowCreatedDateTime = "",

            workflowActivityTypeID = 0;

        console.log("[workbookMappingBotOperation] request.bot_id: ", request.bot_id)
        console.log("[workbookMappingBotOperation] request.bot_operation_id: ", request.bot_operation_id)
        try {
            const [_, botOperationData] = await botOperationMappingSelectID({
                bot_id: request.bot_id,
                bot_operation_id: request.bot_operation_id
            });
            if (botOperationData.length > 0) {
                botOperationInlineData = JSON.parse(botOperationData[0].bot_operation_inline_data);
                botOperationInlineData = botOperationInlineData.bot_operations.map_workbook;

            } else {
                throw new Error(`No bot operation data found for bot_operation_id ${request.bot_operation_id}`);
            }
        } catch (error) {
            throw new Error(error)
        }
        // Flags
        const isFormulaEngineEnabled = botOperationInlineData.is_formula_engine_enabled || false;
        const isVILCustomOutputMappingEnabled = botOperationInlineData.is_vil_custom_mapping_enabled || false;
        const isOverrideOutputMappingEnabled = botOperationInlineData.is_override_output_mapping_enabled || false;

        let excelSheetFilePath = botOperationInlineData.workbook_url;
        // Override the excel base template path
        if (
            isObject(botOperationInlineData.workbook_url) &&

            botOperationInlineData.workbook_url.hasOwnProperty("form_id") &&
            Number(botOperationInlineData.workbook_url.form_id) > 0 &&

            botOperationInlineData.workbook_url.hasOwnProperty("field_id") &&
            Number(botOperationInlineData.workbook_url.field_id) > 0
        ) {
            excelSheetFilePath = await getExcelSheetFilePath(request, botOperationInlineData, {
                formID: Number(botOperationInlineData.workbook_url.form_id),
                fieldID: Number(botOperationInlineData.workbook_url.field_id),
                workflowActivityID
            });
        }

        let workflowActivityData = [];
        try {
            workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
            if (
                Number(workflowActivityData.length) > 0 &&
                Number(workflowActivityData[0].activity_flag_workbook_mapped) &&
                workflowActivityData[0].activity_workbook_url
            ) {
                excelSheetFilePath = workflowActivityData[0].activity_workbook_url;
                workbookMappedStreamTypeID = 719; // If workbook is being updated
            }
            if (Number(workflowActivityData.length) > 0) {
                workflowActivityTypeID = workflowActivityData[0].activity_type_id || 0;
                OpportunityID = workflowActivityData[0].activity_cuid_1 || "";
                BuildingName = workflowActivityData[0].account_name || "";
                WorkforceName = workflowActivityData[0].workforce_name || "";
                WorkflowCreatedDateTime = moment(workflowActivityData[0].activity_datetime_created).format("YYYY-MM-DD HH:mm:ss") || "";
            }
        } catch (error) {
            throw new Error("workbookMappingBotOperation | Error fetching Workflow Data Found in DB");
        }

        const [xlsxDataBodyError, xlsxDataBody] = await util.getXlsxDataBodyFromS3Url(request, excelSheetFilePath);
        if (xlsxDataBodyError) {
            throw new Error(xlsxDataBodyError);
        }

        // Get the single selection value for selecting the sheet
        let sheetIndex = 0;
        try {
            if (
                botOperationInlineData.hasOwnProperty("worksheet_index_fixed_value") &&
                Number(botOperationInlineData.worksheet_index_fixed_value) >= 0
            ) {
                sheetIndex = Number(botOperationInlineData.worksheet_index_fixed_value);
            } else {
                sheetIndex = await getSheetIndexValue(
                    request, workflowActivityID,
                    botOperationInlineData.worksheet_index_form_id,
                    botOperationInlineData.worksheet_index_field_id
                );
            }
        } catch (error) {
            logger.error("Error fetching sheet index from single selection", { type: 'bot_engine', request_body: request, error: serializeError(error) });
            return;
        }
        logger.silly(`sheetIndex: ${sheetIndex}`, { type: 'workbook_bot' })

        const inputMappings = botOperationInlineData.mappings[sheetIndex].input;
        let outputMappings = botOperationInlineData.mappings[sheetIndex].output || [];

        logger.silly(`inputMappings: %j`, inputMappings, { type: 'workbook_bot' });
        logger.silly(`outputMappings: %j`, outputMappings, { type: 'workbook_bot' });

        // Get the input field values
        let inputCellToValueMap = new Map();
        try {
            // inputCellToValueMap = await getInputFormFieldValues(request, workflowActivityID, inputMappings);
            inputCellToValueMap = await getInputFormFieldValuesFromMultipleForms(request, workflowActivityID, inputMappings, {
                OpportunityID,
                BuildingName,
                WorkforceName,
                WorkflowCreatedDateTime
            });
        } catch (error) {
            logger.error("Error fetching input form field values", { type: 'bot_engine', request_body: request, error: serializeError(error) });
            return;
        }
        console.log("inputCellToValueMap: ", inputCellToValueMap);
        // return;

        // Fetch the relevant output mappings
        if (organizationID === 868 && isOverrideOutputMappingEnabled) {
            // Get the origin form data
            // const originFormID = 4353;
            console.log("workflowActivityTypeID: ", workflowActivityTypeID);
            const originFormID = outputFormMappings.getActivityTypeIDToFieldMapping(workflowActivityTypeID).OpportunityReferenceField.form_id || 0;
            const originFormData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, workflowActivityID, originFormID);
            if (!(originFormData.length > 0)) {
                throw new Error("No Origin Form Available For Fetching Reference");
            }

            let dataEntityInline = JSON.parse(originFormData[0].data_entity_inline);
            let formSubmitted = dataEntityInline.form_submitted;
            formSubmitted = (typeof formSubmitted === 'string') ? JSON.parse(formSubmitted) : formSubmitted;

            let OpportunityReferenceJSON = [{ activity_id: 0, activity_title: "" }];
            for (const field of formSubmitted) {
                // Field Name: Opportunity Reference
                const OpportunityReferenceFieldID = outputFormMappings.getActivityTypeIDToFieldMapping(workflowActivityTypeID).OpportunityReferenceField.field_id || 0;
                if (Number(field.field_id) === Number(OpportunityReferenceFieldID)) {
                    const fieldValue = field.field_value;
                    OpportunityReferenceJSON = (typeof fieldValue === 'string') ? JSON.parse(fieldValue) : fieldValue;
                }
            }

            if (Number(OpportunityReferenceJSON[0].activity_id) !== 0) {
                const OpportunityActivityID = OpportunityReferenceJSON[0].activity_id;
                const OpportunityActivityData = await activityCommonService.getActivityDetailsPromise(request, OpportunityActivityID);
                let OpportunityActivityTypeID = 0;
                if (OpportunityActivityData.length > 0) { OpportunityActivityTypeID = OpportunityActivityData[0].activity_type_id || 0; };

                const OpportunityUpdateFormID = outputFormMappings.getActivityTypeIDToFieldMapping(OpportunityActivityTypeID).ProductCartSelectionField.form_id || 0;
                // Fetch OpportunityUpdateForm from the referenced opportunity
                const OpportunityUpdateFormData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, OpportunityActivityID, OpportunityUpdateFormID);
                if (!(OpportunityUpdateFormData.length > 0)) {
                    throw new Error("No Opportunity Update Form Available For Fetching Product Category");
                }
                // Get the product cart field value
                dataEntityInline = JSON.parse(OpportunityUpdateFormData[0].data_entity_inline);
                formSubmitted = dataEntityInline.form_submitted;
                formSubmitted = (typeof formSubmitted === 'string') ? JSON.parse(formSubmitted) : formSubmitted;

                let ProductSelectionJSON = {
                    product_tag_type_id: 0, product_tag_type_name: '',
                    product_tag_id: 0, product_tag_name: '',
                    product_activity_type_id: 0, product_activity_type_name: '',
                    product_activity_id: 0, product_activity_title: '',
                    product_activity_business_case: '', cart_items: []
                };
                for (const field of formSubmitted) {
                    // Field Name: Product Selection
                    const ProductCartSelectionFieldID = outputFormMappings.getActivityTypeIDToFieldMapping(OpportunityActivityTypeID).ProductCartSelectionField.field_id || 0;
                    if (Number(field.field_id) === Number(ProductCartSelectionFieldID)) {
                        const fieldValue = field.field_value;
                        ProductSelectionJSON = (typeof fieldValue === 'string') ? JSON.parse(fieldValue) : fieldValue;
                    }
                }
                console.log("ProductSelectionJSON: ", ProductSelectionJSON);
                if (
                    ProductSelectionJSON.product_activity_id !== 0 &&
                    outputFormMappings.ifProductToOutputMappingExists(ProductSelectionJSON.product_activity_id)
                ) {
                    outputMappings = outputFormMappings.getProductToOutputMapping(ProductSelectionJSON.product_activity_id).OutputMapping || [];
                    logger.silly(`[Mapping Override] outputMappings: %j`, outputMappings, { type: 'workbook_bot' });
                }
            } else {
                throw new Error("activity_id is either not found or is zero in the Opportunity Reference field");
            }
        }
        // Create the cellKey => field_id map for output cells
        let outputCellToFieldIDMap = new Map(outputMappings.map(e => [`${e.cell_x}${e.cell_y}`, Number(e.field_id)]));

        // Check if the output form exists
        let outFormIsSubmitted = false,
            outputFormID = outputMappings.length > 0 ? outputMappings[0].form_id : 0,
            outputFormName = '',
            outputFormTransactionID = 0,
            outputFormActivityID = 0,
            outputFormFieldInlineTemplateMap = new Map();
        try {
            // Check if the output mappings are defined
            if (Number(outputMappings.length) === 0 && Number(outputFormID) === 0) {
                throw new Error("NoOutputMappingsDefined");
            }
            const formID = outputMappings[0].form_id;
            let formFieldInlineTemplate = [];
            const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                organization_id: request.organization_id,
                account_id: request.account_id
            }, workflowActivityID, formID);
            if (!(formData.length > 0)) {
                // throw new Error("Output form does not exist");
                logger.debug(`The output form ${formID} for the workflow ${workflowActivityID} is not sumitted`, { type: 'bot_engine', request_body: request });
                try {
                    const [formConfigError, formConfigData] = await activityCommonService.workforceFormMappingSelect({
                        organization_id: request.organization_id,
                        account_id: request.account_id,
                        workforce_id: request.workforce_id,
                        form_id: outputFormID
                    });
                    if (!(formConfigData.length > 0)) {
                        throw new Error(`Error fetching output form ${outputFormID} details`);
                    }
                    outputFormName = formConfigData[0].form_name;
                } catch (error) {
                    throw new Error(error);
                }

                outFormIsSubmitted = false;
            } else {
                outFormIsSubmitted = true;
                outputFormTransactionID = Number(formData[0].data_form_transaction_id);
                outputFormActivityID = Number(formData[0].data_activity_id);
                if (!outputFormActivityID && outputFormTransactionID) {
                    try {
                        const [error, outputFormTxnData] = await getFormActivityIDFromActivityFormTxnTable(
                            request,
                            request.organization_id,
                            formID,
                            outputFormTransactionID
                        );
                        if (outputFormTxnData.length > 0) {
                            outputFormActivityID = outputFormTxnData[0].activity_id
                        }
                    } catch (error) {
                        logger.error("[getFormActivityIDFromActivityFormTxnTable] Error fethcing output form activity ID from the activity_form_transaction table.", { type: 'bot_engine', request_body: request, error: serializeError(error) });
                    }
                }
            }

            [_, formFieldInlineTemplate] = await getWorkforceFormFieldMappingForOutputForm(
                request,
                request.organization_id,
                formID,
                outputMappings.map(e => e.field_id),
                outFormIsSubmitted
            );
            // console.log("formFieldInlineTemplate: ", formFieldInlineTemplate);
            outputFormFieldInlineTemplateMap = new Map(formFieldInlineTemplate.map(e => [Number(e.field_id), e]));
        } catch (error) {
            logger.error("Error fethcing output form.", { type: 'bot_engine', request_body: request, error: serializeError(error) });
            if (error.message !== "NoOutputMappingsDefined") {
                return;
            }
        }
        // return;

        // Parse and process the excel file
        // const workbook = XLSX.readFile(excelSheetFilePath, { type: "buffer" });
        const workbook = XLSX.read(xlsxDataBody, { type: "buffer", cellStyles: true });
        // Select sheet
        const sheet_names = workbook.SheetNames;
        logger.silly("sheet_names: %j", sheet_names);
        for (const [cellKey, { fieldValue: cellValue, fieldDataTypeID }] of inputCellToValueMap) {
            // Check if the cell has the up-to-date value
            const existingCellValue = workbook.Sheets[sheet_names[sheetIndex]][cellKey].v;
            if (existingCellValue == cellValue) {
                logger.silly(`${cellKey} is up-to-date. No update needed: \`${existingCellValue}\` == \`${cellValue}\` `);
                continue;
            }
            const cellDataType = getExcelCellDataTypeByfieldDataTypeID(fieldDataTypeID);
            try {
                logger.silly(`Updating ${cellKey} of type ${cellDataType} to ${cellValue}`);
                if (isFormulaEngineEnabled) {
                    S5SCalc.update_value(workbook, sheet_names[sheetIndex], cellKey, cellValue);

                } else {
                    workbook.Sheets[sheet_names[sheetIndex]][cellKey].t = cellDataType;
                    workbook.Sheets[sheet_names[sheetIndex]][cellKey].v = cellValue;
                }
            } catch (error) {
                logger.error(`Error updating cell ${cellKey}, with the value ${cellValue} in the sheet ${sheet_names[sheetIndex]}.`, { type: 'bot_engine', request_body: request, error: serializeError(error) });
            }
        }

        // Fetch the updated values
        for (const [cellKey, fieldID] of outputCellToFieldIDMap) {
            if (outputFormFieldInlineTemplateMap.has(fieldID)) {
                let cellValue = "";
                try {
                    cellValue = workbook.Sheets[sheet_names[sheetIndex]][cellKey].v;
                    let field = outputFormFieldInlineTemplateMap.get(fieldID);

                    // Update the field
                    field.field_value = cellValue;
                    outputFormFieldInlineTemplateMap.set(fieldID, field);

                    logger.silly(`Updated the field ${fieldID} with the value at ${cellKey}: %j`, cellValue, { type: 'bot_engine' });
                } catch (error) {
                    logger.error(`Error updating the field ${fieldID} with the value at ${cellKey}: %j`, cellValue, { type: 'bot_engine', error: serializeError(error) });
                }
            }
        }
        console.log("outputFormFieldInlineTemplateMap: ", outputFormFieldInlineTemplateMap);

        if (outFormIsSubmitted) {
            // If the form exists, fire fields alter
            let fieldsAlterRequest = Object.assign({}, request);
            fieldsAlterRequest.form_transaction_id = outputFormTransactionID;
            fieldsAlterRequest.form_id = outputFormID;
            fieldsAlterRequest.activity_form_id = outputFormID;
            fieldsAlterRequest.field_id = 99999999999;
            fieldsAlterRequest.activity_inline_data = JSON.stringify([...outputFormFieldInlineTemplateMap.values()]);
            fieldsAlterRequest.activity_id = outputFormActivityID;
            fieldsAlterRequest.workflow_activity_id = workflowActivityID;

            const fieldsAlterRequestEvent = {
                name: "alterFormActivityFieldValues",
                service: "formConfigService",
                method: "alterFormActivityFieldValues",
                payload: fieldsAlterRequest
            };

            console.log("fieldsAlterRequest: ", fieldsAlterRequest);
            try {
                await queueWrapper.raiseActivityEventPromise(fieldsAlterRequestEvent, fieldsAlterRequest.activity_id)
            } catch (error) {
                logger.error(`Error firing fieldsAlterRequest kafka event for ${outputFormActivityID} and workflow ${workflowActivityID}.`, { type: 'bot_engine', request_body: fieldsAlterRequest, error: serializeError(error) });
            }

        } else if (Number(outputMappings.length) > 0 && Number(outputFormID) > 0) {
            // If the form does not exist, fire add activity
            try {
                await createAndSubmitTheOutputForm(
                    request, workflowActivityID,
                    {
                        outputFormID,
                        outputFormName,
                    },
                    outputFormFieldInlineTemplateMap
                );
            } catch (error) {
                logger.error(`[createAndSubmitTheOutputForm] Error creating and submitting the output form.`, { type: 'bot_engine', error: serializeError(error) });
                throw new Error(error);
            }
        }

        let updatedWorkbookS3URL = "";
        try {
            updatedWorkbookS3URL = await uploadWorkbookToS3AndGetURL(workbook, {
                organization_id: request.organization_id,
                account_id: request.account_id,
                workforce_id: request.workforce_id,
                asset_id: request.asset_id,
                workflow_activity_id: workflowActivityID
            });
            logger.silly("updatedWorkbookS3URL: %j", updatedWorkbookS3URL, { type: "bot_engine" });
        } catch (error) {
            throw new Error(error);
        }

        try {
            if (updatedWorkbookS3URL) {
                // Activity List Table
                await activityListUpdateWorkbookURL({
                    organization_id: request.organization_id,
                    activity_id: request.activity_id,
                    workbook_url: updatedWorkbookS3URL,
                    workbook_mapped: 1,
                    asset_id: request.asset_id
                });
                // Activity Asset Mapping Table
                await activityAssetMappingUpdateWorkbookURL({
                    organization_id: request.organization_id,
                    activity_id: request.activity_id,
                    workbook_url: updatedWorkbookS3URL,
                    workbook_mapped: 1,
                    asset_id: request.asset_id
                });

                // Make a timeline entry onto the workflow for mapping (718) or updating (719) the workbook
                await updateWorkbookURLOnWorkflowTimeline(
                    request, workflowActivityID,
                    updatedWorkbookS3URL, workbookMappedStreamTypeID
                );
            }
        } catch (error) {
            throw new Error(error);
        }

        return [{}, {}];
    }

    async function getExcelSheetFilePath(request, botOperationInlineData, options) {

        const formID = Number(options.formID);
        const fieldID = Number(options.fieldID);
        const workflowActivityID = Number(options.workflowActivityID);
        let fieldValue = "";

        const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
            organization_id: request.organization_id,
            account_id: request.account_id
        }, workflowActivityID, formID);

        if (formData.length > 0) {
            let formSubmitted = [], dataEntityInline = {};

            // Parse the timeline entry
            if (isObject(formData[0].data_entity_inline)) {
                dataEntityInline = formData[0].data_entity_inline;
            } else if (typeof formData[0].data_entity_inline === "string") {
                dataEntityInline = JSON.parse(formData[0].data_entity_inline);
            }

            // Parse the form_submitted key
            if (isArray(dataEntityInline.form_submitted)) {
                formSubmitted = dataEntityInline.form_submitted;
            } else if (typeof dataEntityInline.form_submitted === "string") {
                formSubmitted = JSON.parse(dataEntityInline.form_submitted);
            }

            // Get the specified field_id
            for (const field of formSubmitted) {
                if (Number(field.field_id) === Number(fieldID)) {
                    switch (Number(field.field_data_type_id)) {
                        case 71: // Product Cart
                            const fieldDataJSON = JSON.parse(field.field_value);
                            if (
                                fieldDataJSON.hasOwnProperty("product_activity_business_case") &&
                                fieldDataJSON.product_activity_business_case !== ""
                            ) {
                                fieldValue = fieldDataJSON.product_activity_business_case;
                            }
                            break;

                        default:
                            fieldValue = field.field_value;
                            break;
                    }
                }
            }
        }

        debug_info("[getExcelSheetFilePath] fieldValue: ", fieldValue);
        return fieldValue;
    }

    async function botOperationMappingSelectID(request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.bot_id,
            request.bot_operation_id,
            request.start_from || 0,
            request.limit_value || 50
        );

        var queryString = util.getQueryString('ds_p1_bot_operation_mapping_select_id', paramsArr);
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

    async function uploadWorkbookToS3AndGetURL(workbook, options = {}) {
        const tempXlsxFilePath = tempy.file({ extension: 'xlsx' });
        XLSX.writeFile(workbook, tempXlsxFilePath, {
            cellStyles: true,
            compression: true,
        });

        const bucketName = await util.getS3BucketName(),
            prefixPath = await util.getS3PrefixPath(options);

        logger.silly("tempXlsxFilePath: %j", tempXlsxFilePath, { type: "bot_engine" });
        logger.silly("bucketName: %j", bucketName, { type: "bot_engine" });
        logger.silly("prefixPath: %j", prefixPath, { type: "bot_engine" });

        const uploadDetails = await util.uploadReadableStreamToS3(options, {
            Bucket: bucketName,
            Key: `${prefixPath}/${options.workflow_activity_id}_${moment().utcOffset("+05:30").format("YYYY-MM-DD_hh-mm-A")}_workbook.xlsx`,
            Body: fs.createReadStream(tempXlsxFilePath),
            ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ACL: 'public-read'
        }, undefined);

        // Delete the file
        fs.unlinkSync(tempXlsxFilePath);

        return uploadDetails.Location;
    }

    async function activityListUpdateWorkbookURL(request) {
        // IN p_organization_id BIGINT(20), IN p_account_id bigint(20), 
        // IN p_workforce_id bigint(20), IN p_form_id BIGINT(20)

        let formData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.workbook_url,
            request.workbook_mapped,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_activity_list_update_workbook_bot', paramsArr);
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

    async function activityAssetMappingUpdateWorkbookURL(request) {
        // IN p_organization_id BIGINT(20), IN p_account_id bigint(20), 
        // IN p_workforce_id bigint(20), IN p_form_id BIGINT(20)

        let formData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.workbook_url,
            request.workbook_mapped,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_workbook_bot', paramsArr);
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

    // DB Calls
    async function getSheetIndexValue(request, workflowActivityID, formID, fieldID) {
        const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
            organization_id: request.organization_id,
            account_id: request.account_id
        }, workflowActivityID, formID);

        let formTransactionID = 0,
            formActivityID = 0;

        if (Number(formData.length) > 0) {
            formTransactionID = Number(formData[0].data_form_transaction_id);
            formActivityID = Number(formData[0].data_activity_id);
        } else {
            throw new Error("[ActivityTimelineTransaction] No form data found for fetching the sheet index");
        }

        // Fetch the field value
        const fieldData = await getFieldValue({
            form_transaction_id: formTransactionID,
            form_id: formID,
            field_id: fieldID,
            organization_id: request.organization_id
        });
        if (!(fieldData.length > 0)) {
            throw new Error("[ActivityFormTransaction] No form field data found for getting the sheet index");
        }

        const fieldValue = Number(fieldData[0].data_type_combo_id);

        return fieldValue - 1;
    }

    // Get the field value based on form id and form_transaction_id
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

    async function getInputFormFieldValuesFromMultipleForms(request, workflowActivityID, inputMappings, options) {
        let inputCellToValueMasterMap = new Map(),
            inputFormIDsSet = new Set(),
            formIDToInputMappingsJSON = {};

        // Create the segregation by form_ids
        for (const inputMapping of inputMappings) {
            // Set the dynamic fields
            if (inputMapping.type === "DYNAMIC") {
                switch (inputMapping.kind) {
                    case "OpportunityID":
                        inputCellToValueMasterMap.set(`${inputMapping.cell_x}${inputMapping.cell_y}`, {
                            fieldValue: options.OpportunityID || "",
                            fieldDataTypeID: 19
                        });
                        break;
                    case "BuildingName":
                        inputCellToValueMasterMap.set(`${inputMapping.cell_x}${inputMapping.cell_y}`, {
                            fieldValue: options.BuildingName || "",
                            fieldDataTypeID: 19
                        });
                        break;
                    case "WorkforceName":
                        inputCellToValueMasterMap.set(`${inputMapping.cell_x}${inputMapping.cell_y}`, {
                            fieldValue: options.WorkforceName || "",
                            fieldDataTypeID: 19
                        });
                        break;
                    case "WorkflowCreatedDateTime":
                        inputCellToValueMasterMap.set(`${inputMapping.cell_x}${inputMapping.cell_y}`, {
                            fieldValue: options.WorkflowCreatedDateTime || "",
                            fieldDataTypeID: 19
                        });
                        break;
                }
                continue;
            }
            // Set default value if no formID or fieldID is found
            if (
                !inputMapping.hasOwnProperty("form_id") &&
                inputMapping.hasOwnProperty("default_value")
            ) {
                inputCellToValueMasterMap.set(`${inputMapping.cell_x}${inputMapping.cell_y}`, {
                    fieldValue: inputMapping.default_value,
                    fieldDataTypeID: 19
                });
                continue;
            }
            const formID = Number(inputMapping.form_id);
            if (inputFormIDsSet.has(formID)) {
                formIDToInputMappingsJSON[formID].push(inputMapping);
            } else {
                inputFormIDsSet.add(formID);
                formIDToInputMappingsJSON[formID] = [inputMapping];
            }
        }
        // Fetch input cell value map for each formID
        for (const formID of inputFormIDsSet) {
            const inputCellToValueMap = await getInputFormFieldValues(request, workflowActivityID, formIDToInputMappingsJSON[formID]);
            inputCellToValueMasterMap = new Map(function* () { yield* inputCellToValueMasterMap; yield* inputCellToValueMap }());
        }

        debug_info("inputFormIDsSet: ", inputFormIDsSet);
        debug_info("formIDToInputMappingsJSON: ", formIDToInputMappingsJSON);
        debug_info("inputCellToValueMasterMap: ", inputCellToValueMasterMap);

        return inputCellToValueMasterMap;
    }

    async function getInputFormFieldValues(request, workflowActivityID, inputMappings) {
        const formID = inputMappings[0].form_id;
        let inputCellToValueMap = new Map();
        // const formData = await activityCommonService.getActivityTimelineTransactionByFormId713({
        //     organization_id: request.organization_id,
        //     account_id: request.account_id
        // }, workflowActivityID, formID);

        const [_, formData] = await getMultipleSubmissionsFormData({
            organization_id: request.organization_id,
            account_id: request.account_id
        }, workflowActivityID, formID);

        let formTransactionID = Number(request.form_transaction_id),
            formActivityID = 0,
            customFsiToCellMappingIndex = Number.NEGATIVE_INFINITY;

        if (Number(formData.length) > 0) {
            for (let i = 0; i < formData.length; i++) {
                if (Number(formData[i].data_form_transaction_id) === Number(formTransactionID)) {
                    logger.silly(`[Match Found | ${i}] formData.data_form_transaction_id: ${formData[i].data_form_transaction_id} | formTransactionID: ${formTransactionID}`);

                    customFsiToCellMappingIndex = i;
                    formActivityID = Number(formData[0].data_activity_id);
                    break;
                } else {
                    logger.silly(`[${i}] formData.data_form_transaction_id: ${formData[i].data_form_transaction_id} | formTransactionID: ${formTransactionID}`);
                }
            }

            // FOR NON-MULTI FORM SUBMISSIONS [ADD ANY FLAGS HERE FOR LATER USE]
            if (customFsiToCellMappingIndex === Number.NEGATIVE_INFINITY) {
                formActivityID = Number(formData[0].data_activity_id);
                formTransactionID = Number(formData[0].data_form_transaction_id);
            }
        } else {
            // throw new Error("[ActivityTimelineTransaction] No form data found for fetching the input form field values");
            logger.error(`[ActivityTimelineTransaction] No form data found for fetching the input form ${formID}'s field values`, { type: 'bot_engine', request_body: request });
            return inputCellToValueMap;
        }

        for (const inputMapping of inputMappings) {
            // Vodafone Custom Logic
            if (
                customFsiToCellMappingIndex > Number.NEGATIVE_INFINITY &&
                inputMapping.hasOwnProperty("custom_fsi_to_cell_mapping")
            ) {
                inputMapping.cell_x = inputMapping.custom_fsi_to_cell_mapping[customFsiToCellMappingIndex].cell_x;
                inputMapping.cell_y = inputMapping.custom_fsi_to_cell_mapping[customFsiToCellMappingIndex].cell_y;
            }
            // Vodafone Custom Logic
            const fieldID = Number(inputMapping.field_id);

            // Fetch the field value
            const fieldData = await getFieldValue({
                form_transaction_id: formTransactionID,
                form_id: formID,
                field_id: fieldID,
                organization_id: request.organization_id
            });
            if (!(fieldData.length > 0)) {
                // throw new Error("[ActivityFormTransaction] No form field data found for getting the sheet index");
                logger.error("[ActivityFormTransaction] No form field data found for getting the sheet index. fieldData is empty.", { type: 'bot_engine', request_body: request });
                continue;
            }
            const fieldDataTypeID = Number(fieldData[0].data_type_id) || 0;
            logger.silly("fieldDataTypeID: %j", fieldDataTypeID)

            let overrideColumnName = "";
            if (inputMapping.hasOwnProperty("override_column_name") && inputMapping.override_column_name) {
                overrideColumnName = inputMapping.override_column_name;
            }

            let fieldValue = fieldData[0][getFielDataValueColumnName(fieldDataTypeID, overrideColumnName)] || 0;
            if (fieldDataTypeID === 57 && String(fieldValue).includes("|")) {
                fieldValue = String(fieldValue).split("|")[1];
            }
            logger.silly("fieldValue: %j", fieldValue)

            inputCellToValueMap.set(`${inputMapping.cell_x}${inputMapping.cell_y}`, {
                fieldValue,
                fieldDataTypeID
            });
        }

        return inputCellToValueMap;
    }

    async function getMultipleSubmissionsFormData(request, workflowActivityID, formID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            workflowActivityID,
            formID,
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit) || 50
        );
        const queryString = util.getQueryString('ds_v1_1_activity_timeline_transaction_select_activity_form', paramsArr);

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

    async function getWorkforceFormFieldMappingForOutputForm(request, organizationID, formID, fieldIDArray = [], outFormIsSubmitted) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            organizationID,
            formID
        );
        let baseQuery = `
            SELECT 
                form_id,
                field_id,
                field_name,
                data_type_id AS field_data_type_id,
                data_type_category_id AS field_data_type_category_id,
                data_type_combo_id,
                data_type_combo_value,
                (CASE data_type_id
                    WHEN 5 THEN 0
                    WHEN 6 THEN 0
                    WHEN 33 THEN data_type_combo_value
                    ELSE ''
                END) AS field_value,
                2222333344445555 AS message_unique_id
            FROM
                workforce_form_field_mapping
            WHERE
                organization_id = ? AND form_id = ?`;

        if (outFormIsSubmitted) {
            paramsArr = paramsArr.concat(fieldIDArray);
            baseQuery = `${baseQuery} AND field_id IN (${new Array(fieldIDArray.length).fill('?').join(', ')})`
        }
        const queryString = mysql.format(`${baseQuery} ORDER BY field_id ASC , data_type_combo_id DESC;`, paramsArr);
        if (queryString !== '') {
            await db.executeRawQueryPromise(0, queryString, request)
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

    async function getFormActivityIDFromActivityFormTxnTable(request, organizationID, formID, outputFormTransactionID) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            organizationID,
            formID,
            outputFormTransactionID
        );
        let baseQuery = `
            SELECT 
                activity_id, form_name
            FROM
                activity_form_transaction
            WHERE
                organization_id = ? AND form_id = ?
                    AND form_transaction_id = ?
            LIMIT 1;
        `;

        const queryString = mysql.format(`${baseQuery};`, paramsArr);
        if (queryString !== '') {
            await db.executeRawQueryPromise(0, queryString, request)
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

    // Create and submit the output form
    async function createAndSubmitTheOutputForm(request, workflowActivityID, outputForm, outputFormFieldInlineTemplateMap) {

        let outputFormActivityTypeID = 0;

        let workflowActivityTypeID = 0,
            workflowActivityCreatorAssetID = 0,
            workflowActivityStartDate = '',
            workflowActivityDueDate = '',
            workflowActivityOrganizationID = 0,
            workflowActivityAccountID = 0,
            workflowActivityWorkforceID = 0,
            workflowOriginFormActivityTitle = '';

        const workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
        if (workflowActivityData.length > 0) {
            workflowActivityTypeID = workflowActivityData[0].activity_type_id;
            workflowActivityCreatorAssetID = workflowActivityData[0].activity_creator_asset_id;
            workflowActivityStartDate = workflowActivityData[0].activity_datetime_start_expected;
            workflowActivityDueDate = workflowActivityData[0].activity_datetime_end_deferred;
            workflowActivityOrganizationID = workflowActivityData[0].organization_id;
            workflowActivityAccountID = workflowActivityData[0].account_id;
            workflowActivityWorkforceID = workflowActivityData[0].workforce_id;
            workflowOriginFormActivityTitle = workflowActivityData[0].activity_title;
        } else {
            throw new Error(`[createAndSubmitTheOutputForm] Parent Workflow ${workflowActivityID} Not Found`)
        }

        // Get the form's activity type ID
        const [workforceActivityTypeMappingError, workforceActivityTypeMappingData] = await workforceActivityTypeMappingSelect({
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            activity_type_category_id: 9
        });
        if (
            (workforceActivityTypeMappingError === false) &&
            (Number(workforceActivityTypeMappingData.length) > 0)
        ) {
            outputFormActivityTypeID = Number(workforceActivityTypeMappingData[0].activity_type_id) || 134492;
        }

        const outputFormActivityInlineData = [...outputFormFieldInlineTemplateMap.values()];

        const outputFormSubmissionRequest = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: workflowActivityCreatorAssetID,
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            asset_message_counter: 0,
            activity_title: `${outputForm.outputFormName} - ${workflowOriginFormActivityTitle}`,
            activity_description: "",
            activity_inline_data: JSON.stringify(outputFormActivityInlineData),
            activity_datetime_start: util.getCurrentUTCTime(),
            activity_datetime_end: workflowActivityDueDate,
            activity_type_category_id: 9,
            activity_sub_type_id: 0,
            activity_type_id: outputFormActivityTypeID,
            activity_status_type_id: 22,
            activity_access_role_id: 21,
            asset_participant_access_id: 21,
            activity_parent_id: 0,
            flag_pin: 0,
            flag_priority: 0,
            activity_flag_file_enabled: -1,
            activity_form_id: outputForm.outputFormID,
            form_id: outputForm.outputFormID,
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(31993),
            activity_channel_id: 0,
            activity_channel_category_id: 0,
            activity_flag_response_required: 0,
            track_latitude: 0.0,
            track_longitude: 0.0,
            track_altitude: 0,
            track_gps_datetime: util.getCurrentUTCTime(),
            track_gps_accuracy: 0,
            track_gps_status: 0,
            service_version: "2.0",
            app_version: "2.5.7",
            device_os_id: 5,
            url: 'v1',
            // create_workflow: 1,
            workflow_activity_id: workflowActivityID
        };
        logger.silly(`outputFormSubmissionRequest: %j`, outputFormSubmissionRequest);

        let outputFormActivityID = 0,
            outputFormTransactionID = 0;

        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        try {
            outputFormActivityID = await cacheWrapper.getActivityIdPromise();
            outputFormTransactionID = await cacheWrapper.getFormTransactionIdPromise();

            logger.silly(`outputFormActivityID: ${outputFormActivityID} | outputFormTransactionID: ${outputFormTransactionID}`);

            outputFormSubmissionRequest.activity_id = outputFormActivityID;
            outputFormSubmissionRequest.form_transaction_id = outputFormTransactionID;

            await addActivityAsync(outputFormSubmissionRequest);

            // Make a timeline entry on the workflow
            let workflowFile705Request = Object.assign({}, outputFormSubmissionRequest);
            workflowFile705Request.activity_id = workflowActivityID;
            workflowFile705Request.data_activity_id = outputFormActivityID
            workflowFile705Request.form_transaction_id = outputFormTransactionID
            workflowFile705Request.activity_timeline_collection = JSON.stringify({
                "mail_body": `${outputForm.outputFormName} submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                "subject": `${outputForm.outputFormName}`,
                "content": `${outputForm.outputFormName}`,
                "asset_reference": [],
                "activity_reference": [],
                "form_approval_field_reference": [],
                "form_submitted": outputFormActivityInlineData,
                "attachments": []
            });
            workflowFile705Request.activity_type_category_id = 48;
            workflowFile705Request.activity_stream_type_id = 705;
            workflowFile705Request.flag_timeline_entry = 1;
            workflowFile705Request.message_unique_id = util.getMessageUniqueId(request.asset_id);
            workflowFile705Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            workflowFile705Request.device_os_id = 8;
            workflowFile705Request.asset_id = workflowActivityCreatorAssetID;
            workflowFile705Request.log_asset_id = workflowActivityCreatorAssetID;
            // This will be captured in the push-string message-forming switch-case logic
            workflowFile705Request.url = `/${global.config.version}/activity/timeline/entry/add/v1`;

            let workflowFile705RequestEvent = {
                name: "addTimelineTransaction",
                service: "activityTimelineService",
                //method: "addTimelineTransaction",
                method: "addTimelineTransactionAsync",
                payload: workflowFile705Request
            };

            await queueWrapper.raiseActivityEventPromise(workflowFile705RequestEvent, request.activity_id || request.workflow_activity_id);
        } catch (error) {
            throw new Error(error);
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

    function updateWorkbookURLOnWorkflowTimeline(request, workflowActivityID, updatedWorkbookS3URL, workbookMappedStreamTypeID) {
        const workbookURLTimelineRequest = Object.assign({}, request);

        let workbookTimelineActionName = Number(workbookMappedStreamTypeID) === 718 ? `mapped` : `updated`;
        workbookURLTimelineRequest.activity_timeline_collection = JSON.stringify({
            "mail_body": `Workbook ${workbookTimelineActionName} at ${moment().utcOffset('+05:30').format('LLLL')}`,
            "subject": `Workbook ${workbookTimelineActionName}`,
            "content": `Workbook ${workbookTimelineActionName}`,
            "asset_reference": [],
            "activity_reference": [],
            "attachments": [
                updatedWorkbookS3URL,
            ]
        });
        workbookURLTimelineRequest.workbook_s3_url = updatedWorkbookS3URL;
        workbookURLTimelineRequest.device_os_id = 8;
        workbookURLTimelineRequest.asset_id = 100;
        workbookURLTimelineRequest.log_asset_id = 100;
        workbookURLTimelineRequest.activity_id = workflowActivityID;
        workbookURLTimelineRequest.activity_type_category_id = 48;
        workbookURLTimelineRequest.activity_stream_type_id = 705;
        workbookURLTimelineRequest.flag_timeline_entry = 1;
        workbookURLTimelineRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
        workbookURLTimelineRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');

        activityCommonService.activityTimelineTransactionInsertAsync(workbookURLTimelineRequest, {}, workbookMappedStreamTypeID);
    }
}

module.exports = WorkbookOpsService;