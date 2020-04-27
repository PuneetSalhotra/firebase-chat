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

function WorkbookOpsService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;
    // const nodeUtil = require('util');
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
        const workflowActivityID = request.workflow_activity_id,
            excelSheetFilePath = `/Users/Bensooraj/Desktop/NodeJS/testAPIOne/Workbook_mapping_bot_test_v1.xlsx`;

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
                outFormIsSubmitted = false;
            } else {
                outFormIsSubmitted = true;
                outputFormTransactionID = Number(formData[0].data_form_transaction_id);
                outputFormActivityID = Number(formData[0].data_activity_id);
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
        const workbook = XLSX.readFile(excelSheetFilePath, { type: "buffer" });
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
            throw new Error("[ActivityTimelineTransaction] No form data found for fetching the input form field values");
        }

        let inputCellToValueMap = new Map();
        for (const inputMapping of inputMappings) {
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

    async function getWorkforceFormFieldMappingForOutputForm(request, organizationID, formID, fieldIDArray = [], outFormIsSubmitted) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            organizationID,
            formID
        );
        // ${new Array(paramsArr.length).fill('?').join(', ')}
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
        const queryString = mysql.format(`${baseQuery};`, paramsArr);
        console.log("queryString: ", queryString)
        // const queryString = mysql.format(`
        //     SELECT 
        //         form_id,
        //         field_id,
        //         field_name,
        //         data_type_id AS field_data_type_id,
        //         data_type_category_id AS field_data_type_category_id,
        //         data_type_combo_id,
        //         data_type_combo_value,
        //         (CASE data_type_id
        //             WHEN 5 THEN 0
        //             WHEN 6 THEN 0
        //             ELSE ''
        //         END) AS field_value,
        //         2222333344445555 AS message_unique_id
        //     FROM
        //         workforce_form_field_mapping
        //     WHERE
        //         organization_id = ? AND form_id = ?
        //             AND field_id IN (?);
        // `, paramsArr);

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
}

module.exports = WorkbookOpsService;