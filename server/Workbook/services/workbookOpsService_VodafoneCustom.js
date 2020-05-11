// Core
const logger = require('../../logger/winstonLogger');
const fs = require('fs');
const moment = require('moment');
const { serializeError } = require('serialize-error');
// MySQL for generating prepared statements
const mysql = require('mysql');

// Excel
const XLSX = require('@sheet/core');
const S5SCalc = require("@sheet/formula");
S5SCalc.set_XLSX(XLSX);

const tempy = require('tempy');

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

    // Bot Operation Logic
    this.workbookMappingBotOperation = async function (request, formInlineDataMap, botOperationInlineData) {
        const workflowActivityID = request.workflow_activity_id;

        let excelSheetFilePath = botOperationInlineData.workbook_url;

        try {
            const workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityID);
            if (
                Number(workflowActivityData.length) > 0 &&
                Number(workflowActivityData[0].activity_flag_workbook_mapped) &&
                workflowActivityData[0].activity_workbook_url
            ) {
                excelSheetFilePath = workflowActivityData[0].activity_workbook_url;
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
            sheetIndex = await getSheetIndexValue(
                request, workflowActivityID,
                botOperationInlineData.worksheet_index_form_id,
                botOperationInlineData.worksheet_index_field_id
            );
        } catch (error) {
            logger.error("Error fetching sheet index from single selection", { type: 'bot_engine', request_body: request, error: serializeError(error) });
            return;
        }
        logger.silly(`sheetIndex: ${sheetIndex}`, { type: 'workbook_bot' })

        const inputMappings = botOperationInlineData.mappings[sheetIndex].input,
            outputMappings = botOperationInlineData.mappings[sheetIndex].output;

        logger.silly(`inputMappings: %j`, inputMappings, { type: 'workbook_bot' });
        logger.silly(`outputMappings: %j`, outputMappings, { type: 'workbook_bot' });

        // Get the input field values
        let inputCellToValueMap = new Map();
        try {
            inputCellToValueMap = await getInputFormFieldValues(request, workflowActivityID, inputMappings);
        } catch (error) {
            logger.error("Error fetching input form field values", { type: 'bot_engine', request_body: request, error: serializeError(error) });
            return;
        }
        console.log("inputCellToValueMap: ", inputCellToValueMap);

        // Create the cellKey => field_id map for output cells
        let outputCellToFieldIDMap = new Map(outputMappings.map(e => [`${e.cell_x}${e.cell_y}`, Number(e.field_id)]));

        // Check if the output form exists
        let outFormIsSubmitted = false,
            outputFormID = outputMappings[0].form_id,
            outputFormName = '',
            outputFormTransactionID = 0,
            outputFormActivityID = 0,
            outputFormFieldInlineTemplateMap = new Map();
        try {
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
            return;
        }
        console.log("outputFormFieldInlineTemplateMap: ", outputFormFieldInlineTemplateMap);

        // Parse and process the excel file
        // const workbook = XLSX.readFile(excelSheetFilePath, { type: "buffer" });
        const workbook = XLSX.read(xlsxDataBody, { type: "buffer" });
        // Select sheet
        const sheet_names = workbook.SheetNames;
        logger.silly("sheet_names: %j", sheet_names);
        for (const [cellKey, cellValue] of inputCellToValueMap) {
            logger.silly(`Updating ${cellKey} to ${cellValue}`)
            try {
                S5SCalc.update_value(workbook, sheet_names[sheetIndex], cellKey, cellValue);
            } catch (error) {
                logger.error(`Error updating cell ${cellKey}, with the value ${cellValue} in the sheet ${sheet_names[sheetIndex]}.`, { type: 'bot_engine', request_body: request, error: serializeError(error) });
            }
        }

        // Fetch the updated values
        for (const [cellKey, fieldID] of outputCellToFieldIDMap) {
            if (outputFormFieldInlineTemplateMap.has(fieldID)) {
                const cellValue = workbook.Sheets[sheet_names[sheetIndex]][cellKey].v;
                let field = outputFormFieldInlineTemplateMap.get(fieldID);

                // Update the field
                field.field_value = cellValue;
                outputFormFieldInlineTemplateMap.set(fieldID, field);

                logger.silly(`Updated the field ${fieldID} with the value at ${cellKey}: %j`, cellValue);
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

        } else {
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
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    async function uploadWorkbookToS3AndGetURL(workbook, options = {}) {
        const tempXlsxFilePath = tempy.file({ extension: 'xlsx' });
        XLSX.writeFile(workbook, tempXlsxFilePath);

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

    async function getInputFormFieldValues(request, workflowActivityID, inputMappings) {
        const formID = inputMappings[0].form_id;
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
        } else {
            throw new Error("[ActivityTimelineTransaction] No form data found for fetching the input form field values");
        }

        let inputCellToValueMap = new Map();
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

            const fieldValue = fieldData[0][getFielDataValueColumnName(fieldDataTypeID)] || 0;
            logger.silly("fieldValue: %j", fieldValue)

            inputCellToValueMap.set(`${inputMapping.cell_x}${inputMapping.cell_y}`, fieldValue);
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
            outputFormActivityID = await cacheWrapper.getActivityIdPromise(),
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
}

module.exports = WorkbookOpsService;