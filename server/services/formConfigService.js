/* eslint-disable no-case-declarations */
const AWS = require('aws-sdk');
AWS.config.update({
    "accessKeyId": "AKIAWIPBVOFR4QJ3TS6E",
    "secretAccessKey": "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",
    "region": "ap-south-1"
});
const sqs = new AWS.SQS();
const uuidv4 = require('uuid/v4');

function FormConfigService(objCollection) {

    let db = objCollection.db;
    let util = objCollection.util;
    let activityCommonService = objCollection.activityCommonService;
    let queueWrapper = objCollection.queueWrapper;
    let forEachAsync = objCollection.forEachAsync;

    const ActivityService = require('../services/activityService');
    const activityService = new ActivityService(objCollection);

    const ActivityTimelineService = require('../services/activityTimelineService');
    const activityTimelineService = new ActivityTimelineService(objCollection);

    const BotService = require('../botEngine/services/botService');
    const botService = new BotService(objCollection);

    const ParticipantService = require('../services/activityParticipantService');
    const participantService = new ParticipantService(objCollection);

    const cacheWrapper = objCollection.cacheWrapper;
    const moment = require('moment');
    const nodeUtil = require('util');
    const self = this;
    const logger = require("../logger/winstonLogger");
    const { serializeError } = require("serialize-error");

    function isArray(obj) {
        return obj !== undefined && obj !== null && Array.isArray(obj) && obj.constructor == Array;
    }

    this.getOrganizationalLevelForms = function (request, callback) {
        let paramsArr = new Array();
        let queryString = '';

        paramsArr = new Array(
            request.organization_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select_level_organization', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    if (data.length > 0) {
                        //console.log(data);
                        formatFromsListing(-1, data, function (err, finalData) {
                            if (err === false) {
                                callback(false, {
                                    data: finalData
                                }, 200);
                            }
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    this.getAccountLevelForms = function (request, callback) {
        let paramsArr = new Array();
        let queryString = '';

        paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select_level_account', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    if (data.length > 0) {
                        //console.log(data);
                        formatFromsListing(-1, data, function (err, finalData) {
                            if (err === false) {
                                callback(false, {
                                    data: finalData
                                }, 200);
                            }
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    this.getWorkforceLevelForms = function (request, callback) {
        let paramsArr = new Array();
        let queryString = '';

        paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select_level_workforce', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    if (data.length > 0) {
                        //console.log(data);
                        formatFromsListing(-1, data, function (err, finalData) {
                            if (err === false) {
                                callback(false, {
                                    data: finalData
                                }, 200);
                            }
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    this.getActivityLevelForms = function (request, callback) {
        let paramsArr = new Array();
        let queryString = '';

        paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select_level_activity', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    if (data.length > 0) {
                        //console.log(data);
                        formatFromsListing(-1, data, function (err, finalData) {
                            if (err === false) {
                                callback(false, {
                                    data: finalData
                                }, 200);
                            }
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    this.getSpecifiedForm = function (request, callback) {
        let paramsArr;
        let queryString = '';

        if(request.hasOwnProperty('activity_type_category_id') && request.activity_type_category_id > 0) {
            paramsArr = [
                            request.organization_id,
                            request.account_id,
                            request.workforce_id,
                            request.form_id,
                            request.activity_type_category_id,
                            '1970-01-01 00:00:00',
                            request.page_start,
                            request.page_limit
                        ];
            queryString = util.getQueryString('ds_v1_1_workforce_form_field_mapping_select', paramsArr);
        } else {
            paramsArr = [
                            request.organization_id,
                            request.account_id,
                            request.workforce_id,
                            request.form_id,
                            '1970-01-01 00:00:00',
                            request.page_start,
                            request.page_limit
                        ];
            queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select', paramsArr);
        }        
        
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    if (data.length > 0) {
                        //console.log(data);
                        formatFromsListing(request.device_os_id, data, function (err, finalData) {
                            if (err === false) {
                                callback(false, {
                                    data: finalData
                                }, 200);
                            }
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    // Promisified version of the above retrieval function
    // 'getSpecifiedForm'
    this.getFormFieldMappings = function (request, formId, startFrom, limitValue) {
        return new Promise((resolve, reject) => {
            // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
            // IN p_workforce_id BIGINT(20), IN p_form_id BIGINT(20), 
            // IN p_differential_datetime DATETIME, IN p_start_from INT(11), 
            // IN p_limit_value TINYINT(4)
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                formId,
                '1970-01-01 00:00:00',
                ((startFrom > 0) ? startFrom : request.start_from) || 0,
                ((limitValue > 0) ? limitValue : request.limit_value) || 50
            );
            const queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    //Added by V Nani Kalyan for BETA
    this.getRegisterForms = function (request, callback) {
        let paramsArr = new Array();
        let queryString = '';

        paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            0, //request.group_id
            10, //form_type_category_id
            3, //entity_level_id,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        queryString = util.getQueryString('ds_v1_workforce_form_mapping_select_category_level', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    if (data.length > 0) {
                        //console.log(data);
                        formatFromsListing(-1, data, function (err, finalData) {
                            if (err === false) {
                                callback(false, {
                                    data: finalData
                                }, 200);
                            }
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    this.getAllFormSubmissions = function (request, callback) {
        let paramsArr = new Array();
        let queryString = '';

        paramsArr = new Array(
            request.form_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.datetime_differential,
            3, //entity_level_id,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        queryString = util.getQueryString('ds_v1_activity_form_transaction_analytics_select_form', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    if (data.length > 0) {
                        //console.log(data);
                        activityCommonService.formatFormDataCollection(data, function (err, finalData) {
                            //formatFromsListing(-1, data, function (err, finalData) {
                            if (err === false) {
                                callback(false, {
                                    data: finalData
                                }, 200);
                            }
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    let formatFromsListing = function (device_os_id, data, callback) {
        //console.log(data);
        let responseData = new Array();
        data.forEach(function (rowData, index) {

            let rowDataArr = {
                "form_id": util.replaceDefaultNumber(rowData['form_id']),
                "form_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['form_name'])),
                "field_id": util.replaceDefaultNumber(rowData['field_id']),
                "field_description": util.replaceDefaultString(util.decodeSpecialChars(rowData['field_description'])),
                //"field_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['field_name'])),
                "field_name": util.replaceDefaultString(rowData['field_name']),
                "field_sequence_id": util.replaceDefaultNumber(rowData['field_sequence_id']),
                "field_mandatory_enabled": util.replaceDefaultNumber(rowData['field_mandatory_enabled']),
                "field_preview_enabled": util.replaceDefaultNumber(rowData['field_preview_enabled']),
                "field_inline_data": JSON.parse(rowData['field_inline_data']),
                "field_validation_enabled": util.replaceDefaultNumber(rowData['field_validation_enabled']),
                "data_type_combo_id": util.replaceDefaultNumber(rowData['data_type_combo_id']),
                "data_type_combo_value": util.replaceDefaultString(rowData['data_type_combo_value']),
                "data_type_id": util.replaceDefaultNumber(rowData['data_type_id']),
                "data_type_name": util.replaceDefaultString(rowData['data_type_name']),
                "data_type_category_id": util.replaceDefaultNumber(rowData['data_type_category_id']),
                "data_type_category_name": util.replaceDefaultString(rowData['data_type_category_name']),
                "next_field_id": util.replaceDefaultNumber(rowData['next_field_id']),
                "next_field_name": util.replaceDefaultString(rowData['next_field_name']),
                "next_field_data_type_id": util.replaceDefaultNumber(rowData['next_field_data_type_id']),
                "next_field_data_type_name": util.replaceDefaultString(rowData['next_field_data_type_name']),
                "next_field_data_type_category_id": util.replaceDefaultNumber(rowData['next_field_data_type_category_id']),
                "next_field_data_type_category_name": util.replaceDefaultString(rowData['next_field_data_type_category_name']),
                "form_public_enabled": util.replaceDefaultNumber(rowData['form_public_enabled']),
                "form_type_id": util.replaceDefaultNumber(rowData['form_type_id']),
                "form_type_name": util.decodeSpecialChars(util.replaceDefaultString(rowData['form_type_name'])),
                "form_type_category_id": util.replaceDefaultNumber(rowData['form_type_category_id']),
                "form_type_category_name": util.replaceDefaultString(rowData['form_type_category_name']),
                "workforce_id": util.replaceDefaultNumber(rowData['workforce_id']),
                "workforce_name": util.replaceDefaultString(rowData['workforce_name']),
                "account_id": util.replaceDefaultNumber(rowData['account_id']),
                "account_name": util.replaceDefaultString(rowData['account_name']),
                "organization_id": util.replaceDefaultNumber(rowData['organization_id']),
                "organization_name": util.replaceDefaultString(rowData['organization_name']),
                "log_asset_id": util.replaceDefaultNumber(rowData['log_asset_id']),
                "form_binding_entity_level_id": util.replaceDefaultNumber(rowData['form_binding_entity_level_id']),
                "activity_id": util.replaceDefaultNumber(rowData['activity_id']),
                "activity_title": util.decodeSpecialChars(rowData['activity_title']),
                "activity_type_id": util.replaceDefaultNumber(rowData['activity_type_id']),
                "activity_type_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['activity_type_name'])),
                "activity_type_category_id": util.replaceDefaultNumber(rowData['activity_type_category_id']),
                "activity_type_category_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['activity_type_category_name'])),
                "log_asset_first_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['log_asset_first_name'])),
                "log_asset_last_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['log_asset_last_name'])),
                "log_asset_image_path": util.replaceDefaultString(util.decodeSpecialChars(rowData['log_asset_image_path'])),
                "log_datetime": util.replaceDefaultDatetime(rowData['log_datetime']),
                "log_state": util.replaceDefaultNumber(rowData['log_state']),
                "log_active": util.replaceDefaultNumber(rowData['log_active']),
                "update_sequence_id": util.replaceDefaultNumber(rowData['update_sequence_id']),
                "form_workflow_activity_type_id": util.replaceDefaultNumber(rowData['form_workflow_activity_type_id']),
                "form_workflow_activity_type_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['form_workflow_activity_type_name'])),
                "form_flag_workflow_origin": util.replaceDefaultNumber(rowData['form_flag_workflow_origin']),
                "field_value_edit_enabled": util.replaceDefaultNumber(rowData['field_value_edit_enabled']),
                "form_submission_type_id": util.replaceDefaultNumber(rowData['form_submission_type_id']),
                "form_submission_type_name": util.replaceDefaultNumber(rowData['form_submission_type_name']),
                "field_reference_id": util.replaceDefaultNumber(rowData['field_reference_id']),
                "field_value_prefill_enabled": util.replaceDefaultNumber(rowData['field_value_prefill_enabled']),
                //0 - Nothing - field_value_number_representation
                //1 - Millions
                //2 - Crores
                "field_value_number_representation": util.replaceDefaultNumber(rowData['field_value_number_representation']),
                "is_integrations_dependent": util.replaceDefaultNumber(rowData['field_integrations_dependent_enabled']),
                "field_gamification_score_value": util.replaceDefaultNumber(rowData['field_gamification_score_value']),
                "next_field_smart_flow_disable": util.replaceDefaultNumber(rowData['next_field_smart_flow_disable'])
            };

            /*if (Number(device_os_id) === 5 && Number(index) === 0 && Number(rowData['field_sequence_id']) === 0)
            {
                //Dont push the row data to array
                //For device OS ID 5, do not send the form name stored in the label as per the requirement presented by the web team
            }
            else
            {
                responseData.push(rowDataArr);
            }*/
            responseData.push(rowDataArr);
        }, this);
        callback(false, responseData);
    };

    this.getManualMobileAndWebTimecardForms = function (request, callback) {

        let paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            request.datetime_start,
            request.datetime_end,
            request.flag || 0,
            request.is_sort || 0
        );
        let queryString = util.getQueryString('ds_p1_activity_form_transaction_select_timecard_forms', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (!err) {
                    console.log('Retrieved Data: ', data);
                    if (data.length > 0) {
                        activityCommonService.formatFormDataCollection(data, function (err, formattedData) {
                            (err === false) ? callback(false, {
                                data: formattedData
                            }, 200): callback(true, {}, -9999);
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                } else {
                    callback(err, data, -9999);
                }
            });
        }
    };


    this.getSearchUserForms = function (request, callback) {

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.form_id,
            request.is_search,
            request.search_string,
            request.activity_status_type_id,
            request.start_datetime,
            request.end_datetime,
            request.start_from,
            request.limit_value || 50
        );
        let queryString = util.getQueryString('ds_p1_activity_list_select_asset_forms', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (!err) {
                    //console.log('Retrieved Data: ', data);
                    if (data.length > 0) {
                        activityCommonService.formatFormDataCollection(data, function (err, formattedData) {
                            (err === false) ? callback(false, {
                                data: formattedData
                            }, 200): callback(true, {}, -9999);
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                } else {
                    callback(err, data, -9999);
                }
            });
        }
    };

    this.alterFormActivity = async function (request, callback) {

        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        
        //added new flag 
        request.isFieldEdit = 1;

        //From the request you are suppossed to get the form_activity_id in the parameter activity_id
        //for some migration data in production Instread of getting form_activity_id we are getting workflow_activity_id in the parameter activity_id
        //Hence added the following check

        //If the parameter activity_id is form_activity_id then proceed else check and the get the form_activity_id and append
        let [err, responseData] = await checkWhetherFormWorkflowActID({
            log_uuid : request.log_uuid,
            form_transaction_id: request.form_transaction_id,
            organization_id: request.organization_id
        });

        let activityTypeID = 0;
        let workflowActID = 0;
        if(responseData.length > 0) {
            util.logInfo(request,`Form Activity ID %j`,responseData[0].form_activity_id);
            util.logInfo(request,`Workflow Activity ID -  %j`,responseData[0].workflow_activity_id);
            util.logInfo(request,`request.activity_id -  %j`,request.activity_id);
            util.logInfo(request,`responseData[0].activity_type_id - %j`,responseData[0].activity_type_id);
            
            workflowActID = responseData[0].workflow_activity_id;
            activityTypeID = Number(responseData[0].activity_type_id);

            if(Number(responseData[0].form_activity_id) !== Number(request.activity_id)) {
                util.logInfo(request,`Received workflow_Activity_Id instead of form_activity_id from request`);
                request.activity_id = responseData[0].form_activity_id;
            } else {
                util.logInfo(request,`Received form_activity_id from request. Hence proceeeding!`);
            }
        }        

        let activityInlineData = JSON.parse(request.activity_inline_data);
        let newData = activityInlineData[0];        
        request.new_field_value = newData.field_value;
        let dataTypeId = Number(newData.field_data_type_id);
        //let dataTypeCategoryId = Number(newData.field_data_type_category_id);
        //Listener to update data in Intermediate tables for Reference/combo bots
        switch(Number(newData.field_data_type_id)) {
            case 57: fireBotUpdateIntTables(request, newData);
                     break;
            case 33: fireBotUpdateIntTables(request, newData);
                     break;
            //case 68: activityActivityMappingInsertV1(request, newData, 0);
            //         break;
            default: break;
        }

        //If the asset in not a participant on the workflow then add him
        addAssetToWorkflow(request);

        let cnt = 0,
            oldFieldValue,
            newFieldValue = newData.field_value;

        activityCommonService.getActivityByFormTransactionCallback(request, request.activity_id, (err, data) => {
            if (err === false) {
                util.logInfo(request,`Data from activity_list: %j`, data.length);
                let retrievedInlineData = [];
                if (data.length > 0) {
                    request['activity_id'] = data[0].activity_id;
                    request.activity_type_id = data[0].activity_type_id  || 0;
                    retrievedInlineData = JSON.parse(data[0].activity_inline_data);

                    newData.form_name = data[0].form_name || newData.form_name;
                }
                forEachAsync(retrievedInlineData, (next, row) => {
                    if (Number(row.field_id) === Number(newData.field_id)) {
                        oldFieldValue = row.field_value;
                        row.field_value = newData.field_value;
                        newData.field_name = row.field_name;
                        if(dataTypeId === 62) {
                            try{
                                let oldFieldData;
                                let jsonData;
                                (typeof newData.field_value === 'object')?
                                    jsonData = newData.field_value:
                                    jsonData = JSON.parse(newData.field_value);

                                (typeof oldFieldValue === 'object')?
                                    oldFieldData = oldFieldValue:
                                    oldFieldData = JSON.parse(oldFieldValue);
                                
                                newFieldValue = jsonData.transaction_data.transaction_amount;
                                oldFieldValue = oldFieldData.transaction_data.transaction_amount;

                                util.logInfo(request,`Old Transaction Amount: %j`, oldFieldValue);
                                util.logInfo(request,`New Transaction Amount: %j`, newFieldValue);
                            } catch (err) {
                                util.logError(request,`alterFormActivity`, { type: 'alter_form', error: serializeError(err) });
                            }
                        }
                        
                        if(dataTypeId === 68) { 
                            activityActivityMappingUpdateV1(request, newData, oldFieldValue, 'multi');
                        }

                        if(dataTypeId === 57) { 
                            activityActivityMappingUpdateV1(request, newData, oldFieldValue, 'single');
                        }

                        if(dataTypeId === 71) {
                            activityActivityMappingUpdateV1(request, newData, oldFieldValue, 'multi');
                        }

                        cnt++;
                    }
                    next();
                }).then(() => {

                    if (cnt == 0) {
                        newData.update_sequence_id = 1;
                        retrievedInlineData.push(newData);
                        oldFieldValue = newData.field_value;
                        if(dataTypeId === 62) {
                            try{
                                let oldFieldData;
                                (typeof oldFieldValue === 'object')?
                                    oldFieldData = oldFieldValue:
                                    oldFieldData = JSON.parse(oldFieldValue);                               
                                
                                oldFieldValue = oldFieldData.transaction_data.transaction_amount;
                            } catch (err) {
                                util.logError(request,`alterFormActivity`, { type: 'alter_form', error: serializeError(err) });
                            }
                        }
                        // newData.field_name = row.field_name;
                    }

                    request.activity_inline_data = JSON.stringify(retrievedInlineData);
                    //console.log('oldFieldValue: ', oldFieldValue);
                    let content = '';
                    let simpleDataTypes = [1,2,3,7,8,9,10,14,15,19,21,22];
                    let excludeDataTypeIds = [77,64]
                    util.logInfo(request,` /activity/form/alter data_type_category_id  ${newData.field_data_type_category_id} exists in simple categories : ${simpleDataTypes.includes(newData.field_data_type_category_id)}`);
                    if(simpleDataTypes.includes(newData.field_data_type_category_id) && !excludeDataTypeIds.includes(newData.field_data_type_id)){
                        if (String(oldFieldValue).trim().length === 0) {
                            content = `In the ${newData.form_name}, the field ${newData.field_name} was updated to ${newFieldValue}`;
                        } else {
                            content = `In the ${newData.form_name}, the field ${newData.field_name} was updated from ${oldFieldValue} to ${newFieldValue}`;
                        }
                    }else{
                        content = `In the ${newData.form_name}, the field ${newData.field_name} was updated`;
                    }

                    let activityTimelineCollection = {
                        form_submitted: retrievedInlineData,
                        subject: `Field Updated for ${newData.form_name}`,
                        content: content,
                        mail_body: `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                        attachments: [],
                        asset_reference: [],
                        activity_reference: [],
                        form_approval_field_reference: []

                    };
                    request.activity_timeline_collection = JSON.stringify(activityTimelineCollection);

                    getLatestUpdateSeqId(request).then(async (data) => {

                        if (data.length > 0) {
                            let x = data[0];
                            request.update_sequence_id = ++x.update_sequence_id;
                            util.logInfo(request,`update_sequence_id : ${request.update_sequence_id}`);
                        } else {
                            request.update_sequence_id = 1;
                        }

                        activityInlineData[0].old_field_value = oldFieldValue;
                        await putLatestUpdateSeqId(request, activityInlineData, retrievedInlineData).then(() => {
                            util.logInfo(request,`After putLatestUpdateSeqId`);                       

                            let event = {
                                name: "alterActivityInline",
                                service: "activityUpdateService",
                                method: "alterActivityInline",
                                payload: request
                            };

                            queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                                if (err) {
                                    util.logError(request,`Error in queueWrapper raiseActivityEvent:`, { type: 'alter_form', error: serializeError(err) });
                                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                } else {
                                    util.logInfo(request,`Response from queueWrapper raiseActivityEvent: %j`,resp);
                                }
                            });

                            if(activityTypeID === 151717) {
                                let newReq = Object.assign({}, request);
                                newReq.activity_id = workflowActID;
                                console.log('workflowActID - ', workflowActID);

                                let event = {
                                    name: "alterActivityInline",
                                    service: "activityUpdateService",
                                    method: "alterActivityInline",
                                    payload: newReq
                                };

                                queueWrapper.raiseActivityEvent(event, workflowActID, (err, resp) => {
                                    if (err) {
                                        util.logError(request,`Error in queueWrapper raiseActivityEvent:`, { type: 'alter_form', error: serializeError(err) });
                                        throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                    } else {
                                        util.logInfo(request,`Response from queueWrapper raiseActivityEvent: %j`, resp);
                                    }
                                }); 
                            }

                        }).catch((err) => {
                            // global.logger.write(err);
                            util.logError(request,`Error in putLatestUpdateSeqId`, { type: 'alter_form', error: serializeError(err) });
                        });

                        //Analytics for Widget
                        //addValueToWidgetForAnalytics(request);

                        // Workflow trigger on form edit
                        const [formConfigError, formConfigData] = await workforceFormMappingSelect(request);
                        if (formConfigError !== false) {
                            // return [formConfigError, formConfigData];
                            util.logError(request,`formConfigError `, { type: 'alter_form', error: serializeError(formConfigError) });
                        } else if (Number(formConfigData.length) > 0 && Number(formConfigData[0].form_flag_workflow_enabled) === 1) {
                            let workflowRequest = Object.assign({}, request);
                                workflowRequest.activity_inline_data = JSON.stringify(activityInlineData);
                                workflowRequest.is_from_field_alter = 1;
                            try {
                                self.workflowOnFormEdit(workflowRequest);
                            } catch (error) {
                                util.logError(request,`[alterFormActivity] Workflow trigger on form edit`, { type: 'alter_form', error: serializeError(error) });
                            }
                        }

                        // [Vodafone] Update/Regenerate CAF when any of New Order Form, Order supplementary form, 
                        // CRM Form, FR Form, HLD Form is edited
                        const NEW_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER,
                            ORDER_SUPPLEMENTARY_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY,
                            FR_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.FR,
                            CRM_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM,
                            HLD_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.HLD,
                            CAF_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CAF,
                            CUSTOMER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL;

                        if (
                            Number(request.form_id) === NEW_ORDER_FORM_ID || // New Order
                            Number(request.form_id) === ORDER_SUPPLEMENTARY_FORM_ID || // Order Supplementary
                            Number(request.form_id) === FR_FORM_ID || // FR
                            Number(request.form_id) === CRM_FORM_ID || // CRM
                            Number(request.form_id) === HLD_FORM_ID || // HLD
                            Number(request.form_id) === CUSTOMER_APPROVAL_FORM_ID // Customer Sign & Seal

                        ) {
                            let rebuildCafRequest = Object.assign({}, request);
                            rebuildCafRequest.activity_inline_data = JSON.stringify(activityInlineData);

                            util.logInfo(request,`[regenerateAndSubmitCAF] activityInlineData: %j`, activityInlineData);

                            let rebuildCafEvent = {
                                name: "vodafoneService",
                                service: "vodafoneService",
                                method: "regenerateAndSubmitCAF",
                                payload: rebuildCafRequest
                            };

                            // console.log("[regenerateAndSubmitCAF] Calling regenerateAndSubmitCAF");

                            // queueWrapper.raiseActivityEvent(rebuildCafEvent, request.activity_id, (err, resp) => {
                            //     if (err) {
                            //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                            //         throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                            //     } else {
                            //         global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                            //         global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);

                            //         // Fire 713 addTimelineTransaction entry for the incoming dedicated form
                            //         // ...
                            //         fire713OnNewOrderFileForDedicatedFile(request).then(() => {});

                            //     }
                            // });
                        }

                        // [Vodafone] New order 713 entry trigger point for non-CAF-impacting forms 
                        const ORDER_CLOSURE_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM_ACKNOWLEDGEMENT,
                            CAF_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.ACCOUNT_MANAGER_APPROVAL,
                            NEW_CUSTOMER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_CUSTOMER,
                            EXISTING_CUSTOMER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.EXISTING_CUSTOMER,
                            OMT_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.OMT_APPROVAL,
                            CUSTOMER_IT_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_IT_APPROVAL,
                            CUSTOMER_AUTHORISED_SIGNATORY_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_AUTHORISED_SIGNATORY_APPROVAL,
                            ORDER_DOCUMENTS_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.BC_HLD,
                            CAF_REVISE_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CAF_REVISE;

                        if (
                            Number(request.form_id) === ORDER_CLOSURE_FORM_ID ||
                            Number(request.form_id) === CAF_APPROVAL_FORM_ID ||
                            Number(request.form_id) === NEW_CUSTOMER_FORM_ID ||
                            Number(request.form_id) === EXISTING_CUSTOMER_FORM_ID ||
                            Number(request.form_id) === OMT_APPROVAL_FORM_ID ||
                            Number(request.form_id) === CUSTOMER_IT_APPROVAL_FORM_ID ||
                            Number(request.form_id) === CUSTOMER_AUTHORISED_SIGNATORY_APPROVAL_FORM_ID ||
                            Number(request.form_id) === ORDER_DOCUMENTS_FORM_ID ||
                            Number(request.form_id) === CAF_REVISE_FORM_ID
                        ) {
                            // Fire 713 addTimelineTransaction entry for the incoming dedicated form
                            // ...
                            fire713OnNewOrderFileForDedicatedFile(request).then(() => {});
                        }

                        //The following piece of code will be executed only if it is CAF Form Edit and 
                        //the request is not fired internally device_os_id = 7 means internal call
                        if (Number(request.form_id) === CAF_FORM_ID && Number(request.device_os_id) !== 7) {
                            //global.logger.write('conLog', "\x1b[35m [Log] CAF EDIT \x1b[0m", {}, request);
                            util.logInfo(request,`getLatestUpdateSeqId conLog \x1b[35m [Log] CAF EDIT \x1b[0m %j`,{request});
                            await fetchReferredFormActivityId(request, request.activity_id, newData.form_transaction_id, request.form_id).then((data) => {
                                util.logInfo(request,`workflow_activity_id %j`,data[0].activity_id);

                                if (data.length > 0) {
                                    let newOrderFormActivityId = Number(data[0].activity_id);

                                    let fire713OnNewOrderFileRequest = Object.assign({}, request);
                                    fire713OnNewOrderFileRequest.activity_id = Number(newOrderFormActivityId);
                                    fire713OnNewOrderFileRequest.form_transaction_id = newData.form_transaction_id;
                                    fire713OnNewOrderFileRequest.activity_timeline_collection = request.activity_timeline_collection;
                                    fire713OnNewOrderFileRequest.activity_stream_type_id = 713;
                                    fire713OnNewOrderFileRequest.form_id = CAF_FORM_ID;
                                    fire713OnNewOrderFileRequest.asset_message_counter = 0;
                                    fire713OnNewOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
                                    fire713OnNewOrderFileRequest.activity_timeline_text = '';
                                    fire713OnNewOrderFileRequest.activity_timeline_url = '';
                                    fire713OnNewOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                                    fire713OnNewOrderFileRequest.flag_timeline_entry = 1;
                                    fire713OnNewOrderFileRequest.service_version = '1.0';
                                    fire713OnNewOrderFileRequest.app_version = '2.8.16';
                                    fire713OnNewOrderFileRequest.device_os_id = 7;
                                    fire713OnNewOrderFileRequest.data_activity_id = request.activity_id;

                                    let fire705OnNewOrderFileEvent = {
                                        name: "addTimelineTransaction",
                                        service: "activityTimelineService",
                                        method: "addTimelineTransaction",
                                        payload: fire713OnNewOrderFileRequest
                                    };

                                    util.logInfo(request,`Raising 713 entry onto New Order Form %j`,fire713OnNewOrderFileRequest);
                                    queueWrapper.raiseActivityEvent(fire705OnNewOrderFileEvent, request.activity_id, (err, resp) => {
                                        if (err) {
                                            util.logError(request,`Error in queueWrapper raiseActivityEvent:`, { type: 'alter_form', error: serializeError(err) });
                                        } else {
                                            util.logInfo(request,`Response from queueWrapper raiseActivityEvent: %j`,resp);
                                        }
                                    });
                                } else {
                                    util.logInfo(request,`Data from this call fetchReferredFormActivityId is empty`);
                                }

                            });
                        }

                    }).catch((err) => {
                        util.logError(request,`Error in queueWrapper raiseActivityEvent:`, { type: 'alter_form', error: serializeError(err) });
                    });
                });

            } else {
                callback(true, {}, -9998);
            }
        });

        callback(false, {}, 200);
    };

    this.alterFormActivityBulk = async function (request,callback) {
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        
        //added new flag 
        request.isFieldEdit = 1;

        //From the request you are suppossed to get the form_activity_id in the parameter activity_id
        //for some migration data in production Instread of getting form_activity_id we are getting workflow_activity_id in the parameter activity_id
        //Hence added the following check

        //If the parameter activity_id is form_activity_id then proceed else check and the get the form_activity_id and append
        let [err, responseData] = await checkWhetherFormWorkflowActID({
            log_uuid : request.log_uuid,
            form_transaction_id: request.form_transaction_id,
            organization_id: request.organization_id
        });

        let activityTypeID = 0;
        let workflowActID = 0;
        let finalInlineData = [];
        if(responseData.length > 0) {
            util.logInfo(request,`Form Activity ID %j`,responseData[0].form_activity_id);
            util.logInfo(request,`Workflow Activity ID -  %j`,responseData[0].workflow_activity_id);
            util.logInfo(request,`request.activity_id -  %j`,request.activity_id);
            util.logInfo(request,`responseData[0].activity_type_id - %j`,responseData[0].activity_type_id);
            
            workflowActID = responseData[0].workflow_activity_id;
            activityTypeID = Number(responseData[0].activity_type_id);

            if(Number(responseData[0].form_activity_id) !== Number(request.activity_id)) {
                util.logInfo(request,`Received workflow_Activity_Id instead of form_activity_id from request`);
                request.activity_id = responseData[0].form_activity_id;
            } else {
                util.logInfo(request,`Received form_activity_id from request. Hence proceeeding!`);
            }
        }        
        addAssetToWorkflow(request);

        let activityInlineData = JSON.parse(request.activity_inline_data);

        let form_name_inline = request.form_name || "Form";
        //If the asset in not a participant on the workflow then add him
        

        //Perform actions for each field edited

        activityCommonService.getActivityByFormTransactionCallback(request, request.activity_id, (err, data) => {
            
            if (err === false) {
                util.logInfo(request,`Data from activity_list: %j`, data);
                
                let retrievedInlineData = [];
                if (data.length > 0) {
                    request['activity_id'] = data[0].activity_id;
                    request.activity_type_id = data[0].activity_type_id  || 0;
                    retrievedInlineData = JSON.parse(data[0].activity_inline_data);

                    // newData.form_name = data[0].form_name || newData.form_name || "";
                }
                forEachAsync(retrievedInlineData, (next, row) => {
                     
                    let newData = activityInlineData.find(o => Number(o.field_id) === Number(row.field_id));
                    if(newData){       
                    request.new_field_value = newData.field_value;
                    let dataTypeId = Number(newData.field_data_type_id);
                    let newFieldValue = newData.field_value;
                        oldFieldValue = row.field_value;
                        row.field_value = newData.field_value;
                        newData.field_name = row.field_name;
                        newData.form_name = data[0].form_name || newData.form_name;
                        if(dataTypeId === 62) {
                            try{
                                let oldFieldData;
                                let jsonData;
                                (typeof newData.field_value === 'object')?
                                    jsonData = newData.field_value:
                                    jsonData = JSON.parse(newData.field_value);

                                (typeof oldFieldValue === 'object')?
                                    oldFieldData = oldFieldValue:
                                    oldFieldData = JSON.parse(oldFieldValue);
                                
                                newFieldValue = jsonData.transaction_data.transaction_amount;
                                oldFieldValue = oldFieldData.transaction_data.transaction_amount;

                                util.logInfo(request,`Old Transaction Amount: %j`, oldFieldValue);
                                util.logInfo(request,`New Transaction Amount: %j`, newFieldValue);
                            } catch (err) {
                                util.logError(request,`alterFormActivity`, { type: 'alter_form', error: serializeError(err) });
                            }
                        }
                        
                        if(dataTypeId === 68) { 
                            activityActivityMappingUpdateV1(request, newData, oldFieldValue, 'multi');
                        }

                        if(dataTypeId === 57) { 
                            activityActivityMappingUpdateV1(request, newData, oldFieldValue, 'single');
                        }

                        if(dataTypeId === 71) {
                            activityActivityMappingUpdateV1(request, newData, oldFieldValue, 'multi');
                        }

                        // cnt++;
                    }
                    next();
                }).then(async () => {
                    // console.log('inline data',retrievedInlineData);

                    for(let i=0;i<activityInlineData.length;i++){
                        let newDataEach = activityInlineData[i];        
                        request.new_field_value = newDataEach.field_value;
                        let dataTypeId = Number(newDataEach.field_data_type_id);
                        //let dataTypeCategoryId = Number(newData.field_data_type_category_id);
                        
                        switch(Number(newDataEach.field_data_type_id)) {
                            case 57: fireBotUpdateIntTables(request, newDataEach);
                                     break;
                            case 33: fireBotUpdateIntTables(request, newDataEach);
                                     break;
                            //case 68: activityActivityMappingInsertV1(request, newData, 0);
                            //         break;
                            default: break;
                        }
                        let oldFieldValue;
                                    // if (cnt == 0) {
                                    //     newData.update_sequence_id = 1;
                                    //     retrievedInlineData.push(newData);
                                    //     oldFieldValue = newData.field_value;
                                    //     if(dataTypeId === 62) {
                                    //         try{
                                    //             let oldFieldData;
                                    //             (typeof oldFieldValue === 'object')?
                                    //                 oldFieldData = oldFieldValue:
                                    //                 oldFieldData = JSON.parse(oldFieldValue);                               
                                                
                                    //             oldFieldValue = oldFieldData.transaction_data.transaction_amount;
                                    //         } catch (err) {
                                    //             util.logError(request,`alterFormActivity`, { type: 'alter_form', error: serializeError(err) });
                                    //         }
                                    //     }
                                    //     // newData.field_name = row.field_name;
                                    // }
                
                                    request.activity_inline_data = JSON.stringify(retrievedInlineData);
                                    //console.log('oldFieldValue: ', oldFieldValue);
                                    // let content = '';
                                    // let simpleDataTypes = [1,2,3,7,8,9,10,14,15,19,21,22];
                                    // util.logInfo(request,` /activity/form/alter data_type_category_id  ${newData.field_data_type_category_id} exists in simple categories : ${simpleDataTypes.includes(newData.field_data_type_category_id)}`);
                                    // if(simpleDataTypes.includes(newData.field_data_type_category_id) && newData.field_data_type_id !=77){
                                    //     if (String(oldFieldValue).trim().length === 0) {
                                    //         content = `In the ${newData.form_name}, the field ${newData.field_name} was updated to ${newFieldValue}`;
                                    //     } else {
                                    //         content = `In the ${newData.form_name}, the field ${newData.field_name} was updated from ${oldFieldValue} to ${newFieldValue}`;
                                    //     }
                                    // }else{
                                    //     content = `In the ${newData.form_name}, the field ${newData.field_name} was updated`;
                                    // }
                
                                    // let activityTimelineCollection = {
                                    //     form_submitted: retrievedInlineData,
                                    //     subject: `Field Updated for ${newData.form_name}`,
                                    //     content: content,
                                    //     mail_body: `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                                    //     attachments: [],
                                    //     asset_reference: [],
                                    //     activity_reference: [],
                                    //     form_approval_field_reference: []
                
                                    // };
                                    // request.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
                                    request.form_id=newDataEach.form_id;
                                    request.field_id=newDataEach.field_id;
                                    getLatestUpdateSeqId(request).then(async (data) => {
                
                                        if (data.length > 0) {
                                            let x = data[0];
                                            request.update_sequence_id = ++x.update_sequence_id;
                                            util.logInfo(request,`update_sequence_id : ${request.update_sequence_id}`);
                                        } else {
                                            request.update_sequence_id = 1;
                                        }
                                       
                                        activityInlineData[i].old_field_value = oldFieldValue;
                                        await putLatestUpdateSeqId(request, [activityInlineData[i]], retrievedInlineData).then(() => {
                                            util.logInfo(request,`After putLatestUpdateSeqId`);                       
                                        }).catch((err) => {
                                            // global.logger.write(err);
                                            util.logError(request,`Error in putLatestUpdateSeqId`, { type: 'alter_form', error: serializeError(err) });
                                        });
                
                                    // }).catch((err) => {
                                    //     util.logError(request,`Error in queueWrapper raiseActivityEvent:`, { type: 'alter_form', error: serializeError(err) });
                                    // });
                
                        });
                    }
                    let content = `In the ${form_name_inline} bulk fields have been updated`;
                    let activityTimelineCollection = {
                        form_submitted: retrievedInlineData,
                        subject: `Fields Updated for ${data[0].form_name}`,
                        content: content,
                        mail_body: `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                        attachments: [],
                        asset_reference: [],
                        activity_reference: [],
                        form_approval_field_reference: []

                    };
                    request.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
                    request.activity_inline_data = JSON.stringify(retrievedInlineData);
                    //raise activity inline alter event
                    let event = {
                       name: "alterActivityInline",
                       service: "activityUpdateService",
                       method: "alterActivityInline",
                       payload: request
                   };
                    queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                       if (err) {
                           util.logError(request,`Error in queueWrapper raiseActivityEvent:`, { type: 'alter_form', error: serializeError(err) });
                           throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                       } else {
                           util.logInfo(request,`Response from queueWrapper raiseActivityEvent: %j`,resp);
                       }
                   });
           
                   if(activityTypeID === 151717) {
                       let newReq = Object.assign({}, request);
                       newReq.activity_id = workflowActID;
                       console.log('workflowActID - ', workflowActID);
           
                       let event = {
                           name: "alterActivityInline",
                           service: "activityUpdateService",
                           method: "alterActivityInline",
                           payload: newReq
                       };
                       queueWrapper.raiseActivityEvent(event, workflowActID, (err, resp) => {
                           if (err) {
                               util.logError(request,`Error in queueWrapper raiseActivityEvent:`, { type: 'alter_form', error: serializeError(err) });
                               throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                           } else {
                               util.logInfo(request,`Response from queueWrapper raiseActivityEvent: %j`, resp);
                           }
                       }); 
                   }
           
           
                    // Workflow trigger on form edit
                    const [formConfigError, formConfigData] = await workforceFormMappingSelect(request);
                    if (formConfigError !== false) {
                        // return [formConfigError, formConfigData];
                        util.logError(request,`formConfigError `, { type: 'alter_form', error: serializeError(formConfigError) });
                    } else if (Number(formConfigData.length) > 0 && Number(formConfigData[0].form_flag_workflow_enabled) === 1) {
                        let workflowRequest = Object.assign({}, request);
                            workflowRequest.activity_inline_data = JSON.stringify(activityInlineData);
                            workflowRequest.is_from_field_alter = 1;
                            workflowRequest.is_bulk_edit = 1;
                        try {
                            self.workflowOnFormEdit(workflowRequest);
                        } catch (error) {
                            util.logError(request,`[alterFormActivity] Workflow trigger on form edit`, { type: 'alter_form', error: serializeError(error) });
                        }
                    }
                })
            }
        })
      
        callback(false, {}, 200);
    }

    function getLatestUpdateSeqId(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.form_transaction_id,
                request.form_id,
                request.field_id,
                request.organization_id
            );
            let queryString = util.getQueryString('ds_p1_activity_form_transaction_select_field_sequence_id', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log('data from getLatestUpdateSeqId : ', data);
                    (err === false) ? resolve(data): reject();
                });
            }
        });
    }

    function putLatestUpdateSeqId(request, activityInlineData, completeInlineData = []) {
        util.logInfo(request,`Activity Inline Data :  %j`, activityInlineData);
        return new Promise(async (resolve, reject) => {
            const widgetFieldsStatusesData = util.widgetFieldsStatusesData();
            let poFields = widgetFieldsStatusesData.PO_FIELDS; //new Array(13263, 13269, 13265, 13268, 13271);
            let annexureFields = widgetFieldsStatusesData.ANNEXURE_FIELDS;
            let annexureExcelFilePath = "";
            let orderValueFields = widgetFieldsStatusesData.TOTAL_ORDER_VALUE_IDS; //new Array(7200, 8565, 8817, 9667, 9941, 10207, 12069, 12610)
            let OTC_1_ValueFields = widgetFieldsStatusesData.OTC_1;
            let ARC_1_ValueFields = widgetFieldsStatusesData.ARC_1;
            let OTC_2_ValueFields = widgetFieldsStatusesData.OTC_2;
            let ARC_2_ValueFields = widgetFieldsStatusesData.ARC_2;
            let creditDebitFields = widgetFieldsStatusesData.CREDIT_DEBIT_FIELDS;
            let valueflag = 0;

            let otc_1 = 0, arc_1 = 0, otc_2 = 0, arc_2 = 0;
            for (let i = 0; i < completeInlineData.length; i++) {
                switch (Number(request.form_id)) {
                    case 1073: // MPLS CRF
                        if (Number(completeInlineData[i].field_id) === 8163) otc_1 = completeInlineData[i].field_value;
                        if (Number(completeInlineData[i].field_id) === 8164) arc_1 = completeInlineData[i].field_value;
                        if (Number(completeInlineData[i].field_id) === 13745) arc_2 = completeInlineData[i].field_value;
                        break;
                    case 1136: // IIL CRF
                        if (Number(completeInlineData[i].field_id) === 9376) otc_1 = completeInlineData[i].field_value;
                        if (Number(completeInlineData[i].field_id) === 9377) arc_1 = completeInlineData[i].field_value;
                        if (Number(completeInlineData[i].field_id) === 13744) arc_2 = completeInlineData[i].field_value;
                        break;
                    case 1264: // NPLC CRF
                        if (Number(completeInlineData[i].field_id) === 10369) otc_1 = completeInlineData[i].field_value;
                        if (Number(completeInlineData[i].field_id) === 10370) arc_1 = completeInlineData[i].field_value;
                        if (Number(completeInlineData[i].field_id) === 13743) arc_2 = completeInlineData[i].field_value;
                        break;
                    case 1281: // FLV CRF
                        if (Number(completeInlineData[i].field_id) === 15127) otc_1 = completeInlineData[i].field_value;
                        if (Number(completeInlineData[i].field_id) === 15128) arc_1 = completeInlineData[i].field_value;
                        if (Number(completeInlineData[i].field_id) === 15129) arc_2 = completeInlineData[i].field_value;
                        break;
                    default: break;
                }
            }
            util.logInfo(request,`[putLatestUpdateSeqId | widgets] otc_1: ${otc_1}`);
            util.logInfo(request,`[putLatestUpdateSeqId | widgets] arc_1: ${arc_1}`);
            util.logInfo(request,`[putLatestUpdateSeqId | widgets] arc_2: ${arc_2}`);

            

            let workflowReference,documentReference,assetReference;
            let dataTypeComboId;
            let dashboardEntityFieldData = {};
            let [err, workflowData] = await activityCommonService.getFormWorkflowDetailsAsync(request);
            util.logInfo(request,`workflowData :: ` +JSON.stringify(workflowData)); 
            let workfolow_activity_type_id =  workflowData.length>0 && workflowData[0].activity_type_id ? workflowData[0].activity_type_id :0;
            let [errorWorkflowType, workflowTypeData] = await activityCommonService.getWorkflowFieldsBasedonActTypeId(request, workfolow_activity_type_id);
            util.logInfo(request,`workflowTypeData :: ` +workflowTypeData);  
            if (workflowTypeData.length > 0) {
                dashboardEntityFieldData = await activityCommonService.getDashboardEntityFieldData(request, workflowTypeData);
               // dashboardEntityFieldData = JSON.parse(workflowTypeData[0].dashboard_config_fields);
            } else {
                util.logInfo(request, "No Response from activity_type :: " + workflowTypeData.length);
            }

            util.logInfo(request, "dashboardEntityFieldData :: "+dashboardEntityFieldData)
            forEachAsync(activityInlineData, (next, row) => {
                let fieldData = row.field_value;
                let fieldDataValue = "";
                dataTypeComboId = (row.hasOwnProperty('data_type_combo_id')) ? row.data_type_combo_id: 0;
                let params = new Array(
                    request.form_transaction_id, //0
                    request.form_id, //1
                    row.field_id, //2
                    dataTypeComboId,
                    //request.data_type_combo_id || 0, //3
                    //request.data_type_combo_id || row.data_type_combo_id, //3
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

                let dataTypeId = Number(row.field_data_type_id);
                request['field_value'] = row.field_value;
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
                    case 50: // Reference - File
                        // params[13] = Number(JSON.parse(row.field_value).activity_id); // p_entity_bigint_1
                        params[18] = row.field_value; // p_entity_text_1
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
                        fieldData = request.new_field_value || row.field_value;
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
                                fieldData = tempVar[0];
                                fieldDataValue = tempVar[1];
                            } catch (err) {
                                util.logError(request,`ERROR in field edit - 57 : `, { type: 'put_latest_update_seq', error: serializeError(err) });
                            }
                        }
                        break;
                    case 58://Document reference
                        // documentReference = row.field_value.split('|');
                        params[18] = row.field_value;
                        break;
                    case 59: //Asset reference
                        //assetReference = row.field_value.split('|');
                        //params[13] = assetReference[0]; //ID
                        //params[18] = assetReference[1]; //Name
                        if (typeof row.field_value === 'object') {
                            params[27] = JSON.stringify(row.field_value);
                        } else {
                            params[18] = row.field_value;
                            try {
                                let tempVar = (row.field_value).split('|');
                                let tempObj = {};
                                tempObj[tempVar[0]] = tempVar[1];
                                /*OLD
                                // p_entity_text_2 19
                                params[19] = tempVar[1] || "";
                                // p_entity_text_3 20
                                params[20] = tempVar[3] || "";
                                /////////*/

                                // p_entity_text_1 18
                                params[18] = tempVar[1] || "";

                                // p_entity_text_2 19
                                params[19] = tempVar[2] || "";

                                // p_entity_text_3 20
                                params[20] = tempVar[3] || "";

                                params[27] = JSON.stringify(tempObj);

                                fieldData = tempVar[0];
                                fieldDataValue = tempVar[1];
                            } catch (err) {
                                util.logError(request,`ERROR in field edit - 59 : `, { type: 'put_latest_update_seq', error: serializeError(err) });
                            }
                        }
                        break;
                    case 61: //Time Datatype
                        params[18] = row.field_value;
                        break;
                    case 62: //Credit/Debit DataType
                        try {
                            let jsonData;
                            let amount;
                            
                            
                            (typeof row.field_value === 'object') ?
                                jsonData = row.field_value :
                                jsonData = JSON.parse(row.field_value);

                             params[27] = JSON.stringify(jsonData);
                            let newAmount = Number(jsonData.transaction_data.transaction_amount);
                            let oldAmount = Number(activityInlineData[0].old_field_value);

                            if (oldAmount > newAmount) {
                                //Decreased so Minus
                                amount = newAmount - oldAmount;
                            } else {
                                //Increased so Plus
                                amount = newAmount - oldAmount;
                            }

                            //console.log('jsonData : ', jsonData);
                            (Number(jsonData.transaction_data.transaction_type_id) === 1) ?
                                params[15] = amount : //credit
                                params[16] = amount; // Debit
                            params[13] = jsonData.transaction_data.activity_id; //Activity_id i.e account(ledger)_activity_id
                        } catch (err) {
                            util.logError(request,`ERROR in field edit - 62 : `, { type: 'put_latest_update_seq', error: serializeError(err) });
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
                       
                        if(typeof row.field_value === 'object') {
                            
                           params[27] = JSON.stringify(row.field_value);
                           console.log(params[27])
                        } else {
                           params[27] = row.field_value;
                        }
                        console.log(params[27])
                        break;
                    case 66: // Document Repository
                        if(typeof row.field_value === 'object') {
                           params[27] = JSON.stringify(row.field_value);
                        } else {
                           params[27] = row.field_value;
                        }
                        break;
                    case 67: // Reminder DataType
                        if(typeof row.field_value === 'object') {
                           params[27] = JSON.stringify(row.field_value);
                        } else {
                           params[27] = row.field_value;
                        }
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
                    case 76: //Drop box data type
                             params[18] = (typeof row.field_value === 'object') ? JSON.stringify(row.field_value) : row.field_value;
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
                params.push(request.message_unique_id); // IN p_log_message_unique_id VARCHAR(50)
                params.push(request.flag_retry || 0); // IN p_log_retry TINYINT(1)
                params.push(request.flag_offline || 0); // IN p_log_offline TINYINT(1)
                params.push(request.datetime_log); // IN p_transaction_datetime DATETIME
                params.push(request.datetime_log); // IN p_log_datetime DATETIME
                params.push(request.datetime_log); // IN p_entity_datetime_2 DATETIME            
                params.push(request.update_sequence_id);

                util.logInfo(request,`In formConfigService - addFormEntries params %j`, JSON.stringify(params));

                // let queryString = util.getQueryString('ds_p1_activity_form_transaction_insert_field_update', params);
                 let queryString = util.getQueryString('ds_p1_1_activity_form_transaction_insert_field_update', params);
                if(Number(request.asset_id) === 0 || request.asset_id === null) {
                    util.logInfo(request,`ds_p1_1_activity_form_transaction_insert_field_update as asset_id is %j`, request.asset_id);
                }
                else {
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, async function (err, data) {
    
                            util.logInfo(request,`update field_value in widget row.field_id ${row.field_id}  row.field_value ${row.field_value} request.asset_id ${request.asset_id}`);
    
                            self.activityFormListUpdateFieldValue(request);

                            let idWorkflow = 0;
                            let idWorkflowType = 0;
                            activityCommonService.getFormWorkflowDetails(request).then(async (workflowData)=>{  
                                if(workflowData.length > 0) {
                                    util.logInfo(request,`addWorkFlow Values request.activity_id ${workflowData[0].activity_id}  workflowData[0].activity_type_id ${workflowData[0].activity_type_id}`);
                                    await activityService.updateWorkflowValues({...request,workflow_activity_type_id:workflowData[0].activity_type_id},workflowData[0].activity_id)
                                    util.logInfo(request,` "dashboard Entity Fields ${JSON.stringify(dashboardEntityFieldData)}`);
                                    util.logInfo(request, "dashboard Entity keys "+ dashboardEntityFieldData[row.field_id]);
                                    request.workflow_activity_id = workflowData[0].activity_id;
                                    if (Object.keys(dashboardEntityFieldData).includes(row.field_id) || Object.keys(dashboardEntityFieldData).includes(String(row.field_id)) || Object.keys(dashboardEntityFieldData).includes(Number(row.field_id))) {
                                        activityCommonService.updateEntityFieldsForDashboardEntity(request, dashboardEntityFieldData, fieldData, fieldDataValue, row.field_id);
                                    }else{
                                        util.logInfo(request,`Not a dashboard Entity Field ${row.field_id}`);
                                    }
                                }
                                activityCommonService.processFieldWidgetData(request, row);
                            });
/*
                            const [workflowError, workflowData] = await activityCommonService.fetchReferredFormActivityIdAsyncv1(request, 0, formTransactionId, 0);
                            if(workflowData.length > 0) {
                                util.logInfo(request,`addWorkFlow Values request.activity_id ${workflowData[0].activity_id}  workflowData[0].activity_type_id ${workflowData[0].activity_type_id}`);
                                await activityService.updateWorkflowValues({...request,workflow_activity_type_id:workflowData[0].activity_type_id},workflowData[0].activity_id)
                            }
*/
                        /*activityCommonService.getFormWorkflowDetails(request).then(async (workflowData)=>{  
                            if(workflowData.length > 0) {
                                if(Number(workflowData[0].activity_type_id) !== 134564 && //MPLS CRF
                                Number(workflowData[0].activity_type_id) !== 134566 && //ILL CRF
                                Number(workflowData[0].activity_type_id) !== 134573 && //NPLC CRF
                                Number(workflowData[0].activity_type_id) !== 134575 &&
                                Number(workflowData[0].activity_type_id) !== 152451) { //FLV CRF    
                                    util.logInfo(request,`addValueToWidgetForAnalyticsWF request.activity_id ${request.activity_id}  WorkflowActivityId ${workflowData[0].activity_id} workflowData[0].activity_type_id ${workflowData[0].activity_type_id}`);
                                    addValueToWidgetForAnalyticsWF(request, workflowData[0].activity_id, workflowData[0].activity_type_id, 1);
                                    }
                            }
                        });*/

    
                            if(Object.keys(orderValueFields).includes(String(row.field_id))){
    
                                activityCommonService.getFormWorkflowDetails(request).then(async (workflowData)=>{
                                    if(workflowData.length > 0){
                                        idWorkflow = workflowData[0].activity_id;
                                        idWorkflowType = workflowData[0].activity_sub_type_id;                                    
                                        request.workflow_activity_id = idWorkflow;
                                        if(idWorkflowType == 0){ 
                                            if(Number(row.field_value) >= 0)  {
                                                widgetAggrFieldValueUpdateWorkflow(request);
                                                //await activityCommonService.analyticsUpdateWidgetValue(request, idWorkflow, 0, Number(row.field_value));
                                            } else {
                                                util.logInfo(request,`Field Value is not a number || Total Order Value Field ${row.field_value}`);
                                            }                                            
                                        }else{
                                            util.logInfo(request,`This field is not configured to update in intermediate table ${row.field_id}`);
                                        }
                                    }                                
                                });
                            }else{
    
                                try{
                                    if(Object.keys(OTC_1_ValueFields).includes(String(row.field_id))){
                                             valueflag = 1;                                         
                                             //otc_1 = isNaN(row.field_value) ? 0 : row.field_value;
                                    }else if(Object.keys(ARC_1_ValueFields).includes(String(row.field_id))){
                                             valueflag = 2;                                         
                                             //arc_1 = isNaN(row.field_value) ? 0 : row.field_value;
                                    }else if(Object.keys(OTC_2_ValueFields).includes(String(row.field_id))){
                                             valueflag = 3;                                         
                                             //otc_2 = isNaN(row.field_value) ? 0 : row.field_value;
                                    }else if(Object.keys(ARC_2_ValueFields).includes(String(row.field_id))){
                                             valueflag = 4;                                         
                                             //arc_2 = isNaN(row.field_value) ? 0 : row.field_value;
                                    }
    
                                    util.logInfo(request,`valueflag ::  ${valueflag}`);
                                    request['flag'] = valueflag;
                                    util.logInfo(request,`row.field_value :: ${row.field_value}`);
                                    let finalValue = 0;
                                    if(valueflag > 0){
                                        activityCommonService.getFormWorkflowDetails(request).then(async (workflowData)=>{
                                        if(workflowData.length > 0){
    
                                            /*if(Number(workflowData[0].activity_type_id) === 134564 || //MPLS CRF
                                                Number(workflowData[0].activity_type_id) === 134566 || //ILL CRF
                                                Number(workflowData[0].activity_type_id) === 134573 || //NPLC CRF
                                                Number(workflowData[0].activity_type_id) === 134575 ||
                                                Number(workflowData[0].activity_type_id) === 152451) { //FLV CRF
                                                
                                                (Number(arc_1) > Number(arc_2)) ?
                                                    finalValue = Number(otc_1) +(Number(arc_1) - Number(arc_2)) :
                                                    finalValue = Number(otc_1);
    
                                                    await activityCommonService.analyticsUpdateWidgetValue(request, workflowData[0].activity_id, 0, finalValue);
                                            } else {
                                                setTimeout(()=>{
                                                    updateWFTotalOrderValueinActList(request, workflowData[0].activity_id);
                                                },3000);
                                            }*/
    
                                            idWorkflow = workflowData[0].activity_id;
                                            idWorkflowType = workflowData[0].activity_sub_type_id;
                                            request.is_bulk_order = idWorkflowType;
                                            request.workflow_activity_id = idWorkflow;
                                            if(idWorkflowType == 1){ 
                                                if(Number(row.field_value) >= 0){
                                                    widgetAggrFieldValueUpdate(request);
                                                }
                                                else{
                                                    util.logInfo(request,`Field Value is not a number || (not OTC || not ARC) Field ${row.field_value}`);
                                                }
                                            }else{
    
                                                if(Number(row.field_value) >= 0){
                                                    widgetAggrFieldValueUpdate(request);
                                                }
                                                else{
                                                    util.logInfo(request,`Field Value is not a number || (not OTC || not ARC) Field ${row.field_value}`);
                                                }
                                            }
                                        }
                                        });
                                    }
                                    /*}
                                    else{                                    
                                        activityCommonService.getFormWorkflowDetails(request).then(async (workflowData)=>{                                        
                                            if(workflowData.length > 0){
                                                
                                                if(Number(workflowData[0].activity_type_id) === 134564 || //MPLS CRF
                                                    Number(workflowData[0].activity_type_id) === 134566 || //ILL CRF
                                                    Number(workflowData[0].activity_type_id) === 134573 || //NPLC CRF
                                                    Number(workflowData[0].activity_type_id) === 134575 ||
                                                    Number(workflowData[0].activity_type_id) === 152451 ) { //FLV CRF
                                                    //Do Nothing
                                                } else {
                                                    if(Number(request.organization_id) !== 868) {
                                                        addValueToWidgetForAnalyticsWF(request, 
                                                            workflowData[0].activity_id, 
                                                            workflowData[0].activity_type_id, 
                                                            1); //1 - Final value Widget
                                                        }
                                                    }
                                                    
                                            }           
                                                
                                        });                                    
                                        util.logInfo(request,`This field is not configured to update in intermediate table ${row.field_value}`);
                                    }*/
                                }catch(err){
                                    util.logError(request,`Error in updating Intermediate Table :`, { type: 'form_alter', error: serializeError(err) });
                                }                             
    
                            }
    
                            util.logInfo(request,`*****Update: update po_date in widget1 ******* ${row.field_id}`);
                             if(Object.keys(poFields).includes(String(row.field_id))){
                                util.logInfo(request,`*****Update: update po_date in widget1 ******* ${row.field_id}`);
                                    activityCommonService.getActivityDetailsPromise(request,0).then((activityData)=>{ 
                                        util.logInfo(request,`*****Update: update po_date in widget3 ******* ${activityData[0].channel_activity_id}`);                                     
                                        request['workflow_activity_id'] = activityData[0].channel_activity_id;                            
                                        request['order_po_date'] = row.field_value;
                                        request['flag'] = 1;
                                        request['datetime_log'] = util.getCurrentUTCTime();
                                        activityCommonService.widgetActivityFieldTxnUpdateDatetime(request); 
                                    });          
                                }else if(Object.keys(creditDebitFields).includes(String(row.field_id))){
                                    activityCommonService.getActivityDetailsPromise(request, 0).then((activityData) => {
                                        let creditDebitValue = 0;
                                        console.log("row.field_value.transaction_data.transaction_type_id :: "+row.field_value.transaction_data.transaction_type_id);
                                        row.field_value.transaction_data.transaction_type_id == 1? creditDebitValue = row.field_value.transaction_data.transaction_amount: creditDebitValue = row.field_value.transaction_data.transaction_amount;
                                        activityCommonService.analyticsUpdateWidgetValue(request, activityData[0].channel_activity_id, 0, creditDebitValue);
                                    });
                                }
                            // Trigger Child order creation on annexure fields 
                            if (Object.keys(annexureFields).includes(String(row.field_id))) {
                                let childOrdersCreationTopicName = global.config.CHILD_ORDER_TOPIC_NAME;

                                let [err, workflowData] = await activityCommonService.getFormWorkflowDetailsAsync(request);
                                let isFirstTimeExcelUploaded = true;
                                let oldFormsData = await activityCommonService.getActivityTimelineTransactionByFormId(request, workflowData[0].activity_id, request.form_id);
                                for (const row of oldFormsData) {
                                    let dataEntityInline = [];
                                    try {
                                        if (typeof row.data_entity_inline === 'string') {
                                            dataEntityInline = JSON.parse(row.data_entity_inline);
                                        } else if (isArray(row.data_entity_inline)) {
                                            dataEntityInline = row.data_entity_inline;
                                        }

                                    } catch (e) {
                                        lutil.logError(request,`error in checking old forms data`, { type: 'add_activity', error: serializeError(e) });
                                    }
                                    for (const formFields of dataEntityInline) {
                                        if (Object.keys(annexureFields).includes(String(formFields.field_id))) {
                                            if (formFields.field_value !== "") {
                                                isFirstTimeExcelUploaded = false;
                                                util.logInfo(request,`Excel file found in previous submission so do not create child order`);
                                            }
                                        }
                                    }

                                }

                                if (isFirstTimeExcelUploaded && annexureExcelFilePath.length > 0) {
                                    util.logInfo(request,` ${childOrdersCreationTopicName} %j`, {
                                        ...request,
                                        s3UrlOfExcel: annexureExcelFilePath
                                    });

                                    await kafkaProdcucerForChildOrderCreation(childOrdersCreationTopicName, {
                                        ...request,
                                        workflow_activity_id: workflowData[0].activity_id,
                                        s3UrlOfExcel: annexureExcelFilePath
                                    }).catch(global.logger.error);
                                }

                            }

                            next();
                            
                        });
                    }
                }
            }).then(() => {
                resolve();
            });
        });
    }

    async function updateWFTotalOrderValueinActList(request, workflowActID) {
        let finalValueOfCAF;
            try{
                let activityDataResp = await activityCommonService.getActivityDetailsPromise(request, workflowActID);
                util.logInfo(request,`activityDataResp: %j`, activityDataResp);
                if (activityDataResp.length > 0) {
                    finalValueOfCAF = Number(activityDataResp[0].activity_workflow_value_1) +
                                      Number(activityDataResp[0].activity_workflow_value_2) +
                                      Number(activityDataResp[0].activity_workflow_value_3) +
                                      Number(activityDataResp[0].activity_workflow_value_4) +
                                      Number(activityDataResp[0].activity_workflow_value_5);
                }
                util.logInfo(request,`FINAL VALUE OF CAF :  %j`, finalValueOfCAF);                
                await activityCommonService.analyticsUpdateWidgetValue(request, workflowActID, 0, finalValueOfCAF);
            }catch(err){
                util.logError(request,`ERROR`, { type: 'add_activity', error: serializeError(err) });
            }
    }

    this.getFormFieldComboValues = function (request) {
        return new Promise((resolve, reject) => {
            let queryString = '';

            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.form_id,
                request.field_id,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );
            queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select_field', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }

        });
    };

    function fetchReferredFormActivityId(request, activityId, formTransactionId, formId) {
        return new Promise((resolve, reject) => {
            // IN p_limit_value smallint(6)
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                activityId,
                formId,
                formTransactionId,
                request.start_from || 0,
                request.limit_value || 50
            );
            const queryString = util.getQueryString('ds_p1_activity_timeline_transaction_select_refered_activity', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    }

    function fire713OnNewOrderFileForDedicatedFile(request) {
        return new Promise((resolve, reject) => {

            fetchReferredFormActivityId(request, request.activity_id, request.form_transaction_id, request.form_id).then((data) => {
                //global.logger.write('conLog', "\x1b[35m [Log] DATA \x1b[0m", {}, request);
                util.logInfo(request,`fetchReferredFormActivityId conLog \x1b[35m [Log] DATA \x1b[0m %j`,{request});
                //global.logger.write('conLog', data, {}, request);
                util.logInfo(request,`fetchReferredFormActivityId conLog %j`,{data, request});
                if (data.length > 0) {
                    let newOrderFormActivityId = Number(data[0].activity_id);

                    let fire713OnNewOrderFileRequest = Object.assign({}, request);
                    fire713OnNewOrderFileRequest.activity_id = Number(newOrderFormActivityId);
                    fire713OnNewOrderFileRequest.data_activity_id = Number(request.activity_id);
                    fire713OnNewOrderFileRequest.form_transaction_id = Number(request.form_transaction_id);
                    fire713OnNewOrderFileRequest.activity_timeline_collection = request.activity_timeline_collection;
                    fire713OnNewOrderFileRequest.activity_stream_type_id = 713;
                    fire713OnNewOrderFileRequest.form_id = Number(request.form_id);
                    fire713OnNewOrderFileRequest.asset_message_counter = 0;
                    fire713OnNewOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
                    fire713OnNewOrderFileRequest.activity_timeline_text = '';
                    fire713OnNewOrderFileRequest.activity_timeline_url = '';
                    fire713OnNewOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                    fire713OnNewOrderFileRequest.flag_timeline_entry = 1;
                    fire713OnNewOrderFileRequest.service_version = '1.0';
                    fire713OnNewOrderFileRequest.app_version = '2.8.16';
                    fire713OnNewOrderFileRequest.device_os_id = 7;

                    let fire713OnNewOrderFileEvent = {
                        name: "addTimelineTransaction",
                        service: "activityTimelineService",
                        method: "addTimelineTransaction",
                        "location": "7777777777777777",
                        payload: fire713OnNewOrderFileRequest
                    };

                    queueWrapper.raiseActivityEvent(fire713OnNewOrderFileEvent, request.activity_id, (err, resp) => {
                        if (err) {

                            //global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                            util.logError(request,`debug Error in queueWrapper raiseActivityEvent:  %j`, {error : JSON.stringify(err), err, request });
                            //global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                            util.logInfo(request,`debug Response from queueWrapper raiseActivityEvent:  %j`,{Response : JSON.stringify(resp), resp, request});

                            reject(err);

                        } else {

                            //global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                            util.logInfo(request,`debug Response from queueWrapper raiseActivityEvent: %j`,{Response : JSON.stringify(resp), resp, request});

                            resolve();
                        }
                    });
                }
            });
        });
    }

    this.getFormTransactionData = function (request) {
        return new Promise((resolve, reject) => {
            let queryString = 'ds_v1_1_activity_form_transaction_select_transaction';
            let paramsArr = new Array(
                request.organization_id,
                request.form_transaction_id,
                request.form_id
            );
            db.executeRecursiveQuery(1, 0, 10, queryString, paramsArr, function (err, data) {
                if (err === false) {
                    /*  processFormTransactionData(request, data).then((finalData)=>{
                            //console.log("finalData : "+finalData);
                            resolve(finalData);
                        });   */
                    resolve(data);
                } else {
                    reject(err);
                }
            });
        });
    };

    function processFormTransactionData(request, data) {
        return new Promise((resolve, reject) => {
            let formData = [];
            let counter = -1;

            forEachAsync(data, (next, dataArray) => {
                console.log(dataArray.length);
                forEachAsync(dataArray, (next1, fieldData) => {
                    console.log("fieldData.field_id " + fieldData.field_id);
                    let formattedFieldData = {};
                    formattedFieldData.field_id = fieldData.field_id;
                    formattedFieldData.field_name = fieldData.field_name;
                    formattedFieldData.form_id = fieldData.form_id;
                    formattedFieldData.form_name = fieldData.form_name;
                    formattedFieldData.form_transaction_datetime = fieldData.form_transaction_datetime;
                    formattedFieldData.form_transaction_id = fieldData.form_transaction_id;
                    formattedFieldData.field_sequence_id = fieldData.field_sequence_id;
                    formattedFieldData.data_type_id = fieldData.data_type_id;
                    formattedFieldData.data_entity_date_1 = fieldData.data_entity_date_1;
                    formattedFieldData.data_entity_date_2 = fieldData.data_entity_date_2;
                    formattedFieldData.data_entity_datetime_1 = fieldData.data_entity_datetime_1;
                    formattedFieldData.data_entity_datetime_2 = fieldData.data_entity_datetime_2;
                    formattedFieldData.data_entity_text_1 = fieldData.data_entity_text_1;
                    formattedFieldData.data_entity_text_2 = fieldData.data_entity_text_2;
                    formattedFieldData.data_entity_text_3 = fieldData.data_entity_text_3;
                    formattedFieldData.data_entity_tinyint_1 = fieldData.data_entity_tinyint_1;
                    formattedFieldData.data_entity_tinyint_2 = fieldData.data_entity_tinyint_2;
                    formattedFieldData.data_entity_bigint_1 = fieldData.data_entity_bigint_1;
                    formattedFieldData.data_entity_bigint_2 = fieldData.data_entity_bigint_2;
                    formattedFieldData.data_entity_double_1 = fieldData.data_entity_double_1;
                    formattedFieldData.data_entity_double_2 = fieldData.data_entity_double_2;
                    formattedFieldData.data_entity_decimal_1 = fieldData.data_entity_decimal_1;
                    formattedFieldData.data_entity_decimal_2 = fieldData.data_entity_decimal_2;
                    formattedFieldData.data_entity_decimal_3 = fieldData.data_entity_decimal_3;
                    formattedFieldData.data_entity_cloud_path = fieldData.data_entity_cloud_path;
                    formattedFieldData.log_datetime = fieldData.log_datetime;
                    formData[++counter] = formattedFieldData;
                    next1();
                }).then(() => {
                    next();
                });
            }).then(() => {
                console.log(formData.length);
                resolve(formData);
            });

        });
    }

    this.formAdd = async function (request) {

        request.update_type_id = 28;

        let formId = 0,
            formFields = [],
            formData = [],
            error,
            fieldIdforBotCreation = 0;

        await workforceFormMappingInsert(request)
            .then(async (newFormData) => {
                console.log("newFormData: ", newFormData);

                let fieldSequenceId = 1;

                if (Number(newFormData[0].query_status) === 0 && newFormData[0].form_id > 0) {

                    formId = newFormData[0].form_id;
                    request.form_id = Number(newFormData[0].form_id);

                    // Make an entry in the form_entity_mapping table, for
                    // permissions
                    try {
                        const entityLevelID = Number(request.entity_level_id) || 3;
                        await formEntityMappingInsert(request, formId, entityLevelID);
                    } catch (error) {
                        console.log("formAdd | formEntityMappingInsert | Error: ", error);
                    }

                    // History insert in the workforce_form_mapping_history_insert table
                    await workforceFormMappingHistoryInsert(request);

                    // Update asset's GPS data
                    request.datetime_log = util.getCurrentUTCTime();
                    activityCommonService.updateAssetLocation(request, () => {});

                    formFields = JSON.parse(request.form_fields);

                    /*formFields.unshift({
                        label: request.form_name,
                        description: 'Form Name',
                        datatypeid: 19
                    });*/

                    for (const formField of formFields) {
                        let fieldName = (typeof formField.label == 'undefined') ? formField.title : formField.label;
                        let fieldDescription = (typeof formField.description == 'undefined') ? '' : formField.description;
                        let fieldMandatoryEnabled = (typeof formField.validate == 'undefined') ? 0 : (formField.validate.required == true ? 1 : 0);
                        let nextFieldId = (typeof formField.next_field_id == 'undefined') ? 0 : Number(formField.next_field_id);
                        let fieldValueEditEnabled = (typeof formField.field_value_edit_enabled == 'undefined') ? 1 : Number(formField.field_value_edit_enabled);
                        let inlineData = (typeof formField.inline_data == 'undefined') ? '{}' : JSON.stringify(formField.inline_data);
                        let fieldPreviewEnabled = (typeof formField.field_preview_enabled == 'undefined') ? 0 : Number(formField.field_preview_enabled);

                        let dataTypeId = Number(formField.datatypeid);                                           

                        let dataTypeCategoryId = Number(formField.datatypecategoryid);

                        let maxDataTypeComboID = 0;
                        
                        console.log('\x1b[36m\n\n%s\x1b[0m', 'fieldSequenceId: ', fieldSequenceId);

                        if (dataTypeCategoryId === 14 || dataTypeCategoryId === 15) {
                            // For Single Select Component and 
                            let fieldId = 0,
                                comboEntries = [];

                            if (dataTypeCategoryId === 14) {
                                comboEntries = formField.data.values;

                            } else if (dataTypeCategoryId === 15) {
                                comboEntries = formField.data.values;
                            }

                            for (const [index, comboEntry] of Array.from(comboEntries).entries()) {
                                await workforceFormFieldMappingInsert(request, {
                                        field_id: fieldId,
                                        field_name: fieldName,
                                        field_description: fieldDescription,
                                        inline_data: inlineData,
                                        field_sequence_id: fieldSequenceId,
                                        field_mandatory_enabled: fieldMandatoryEnabled,
                                        field_preview_enabled: fieldPreviewEnabled, // THIS NEEDS WORK
                                        field_value_edit_enabled: fieldValueEditEnabled,
                                        data_type_combo_id: index + 1,
                                        data_type_combo_value: comboEntry.label,
                                        data_type_id: Number(formField.datatypeid),
                                        next_field_id: nextFieldId
                                    })
                                    .then((fieldData) => {
                                        // console.log("someData: ", someData)
                                        if (fieldId === 0) {
                                            fieldId = Number(fieldData[0].p_field_id);
                                            fieldIdforBotCreation = fieldId;
                                        }
                                    });

                                // History insert in the workforce_form_field_mapping_history_insert table
                                await workforceFormFieldMappingHistoryInsert(request, {
                                    field_id: fieldId,
                                    data_type_combo_id: index + 1
                                });

                                maxDataTypeComboID = index + 1;
                            }

                            if(comboEntries.length==0){
                                await workforceFormFieldMappingInsert(request, {
                                    field_id: 0,
                                    field_name: fieldName,
                                    field_description: fieldDescription,
                                    inline_data: inlineData,
                                    field_sequence_id: fieldSequenceId,
                                    field_mandatory_enabled: fieldMandatoryEnabled,
                                    field_preview_enabled: fieldPreviewEnabled, // THIS NEEDS WORK
                                    field_value_edit_enabled: fieldValueEditEnabled,
                                    data_type_combo_id: 0,
                                    data_type_combo_value: '',
                                    data_type_id: Number(formField.datatypeid),
                                    next_field_id: nextFieldId
                                })
                                .then(async (fieldData) => {
                                    // console.log("someData: ", someData)
                                    // History insert in the workforce_form_field_mapping_history_insert table
                                    await workforceFormFieldMappingHistoryInsert(request, {
                                        field_id: Number(fieldData[0].p_field_id),
                                        data_type_combo_id: 0
                                    });
                                    fieldIdforBotCreation = Number(fieldData[0].p_field_id);
                                });
                            }
                            // Reset fieldId to 0, so it can be re-used by other fields
                            // in the subsequent iterations
                            fieldId = 0;

                        } else {

                            await workforceFormFieldMappingInsert(request, {
                                    field_id: 0,
                                    field_name: fieldName,
                                    field_description: fieldDescription,
                                    inline_data: inlineData,
                                    field_sequence_id: fieldSequenceId,
                                    field_mandatory_enabled: fieldMandatoryEnabled,
                                    field_preview_enabled: fieldPreviewEnabled, // THIS NEEDS WORK
                                    field_value_edit_enabled: fieldValueEditEnabled,
                                    data_type_combo_id: 0,
                                    data_type_combo_value: '',
                                    data_type_id: Number(formField.datatypeid),
                                    next_field_id: nextFieldId
                                })
                                .then(async (fieldData) => {
                                    // console.log("someData: ", someData)
                                    // History insert in the workforce_form_field_mapping_history_insert table
                                    await workforceFormFieldMappingHistoryInsert(request, {
                                        field_id: Number(fieldData[0].p_field_id),
                                        data_type_combo_id: 0
                                    });
                                    fieldIdforBotCreation = Number(fieldData[0].p_field_id);
                                });
                        }

                        //Listener  
                        //To create a bot for every workflow reference with type constraint datatype added in forms
                        //To create a bot for every single selection datatype added in forms
                        switch (dataTypeId) {
                            case 57: if (inlineData !== '{}') {
                                let newInlineData = JSON.parse(inlineData);
                                console.log('newInlineDAta : ', newInlineData);
                                let key = Object.keys(newInlineData);
                                if (key[0] === 'workflow_reference_restriction') {
                                    if (Number(newInlineData.workflow_reference_restriction.activity_type_id) > 0) {
                                        // Create a Bot
                                        await createBot(request, newInlineData, {
                                            dataTypeId,
                                            fieldName,
                                            fieldIdforBotCreation
                                        });
                                    }
                                } else if (key[0] === 'asset_reference_restriction') {
                                    //
                                }
                            }
                                break;
                            case 33: await createBot(request, {}, {
                                dataTypeId,
                                fieldName,
                                fieldIdforBotCreation,
                                maxDataTypeComboID
                            });
                                break;
                            case 62: await createBot(request, {}, {
                                dataTypeId,
                                fieldName: '',
                                fieldIdforBotCreation
                            });
                                break;
                            default: break;
                        }

                        fieldSequenceId++;
                    }
                }
                // return [false, newFormData]
                error = false;
                formData = newFormData;
            })
            .catch((err) => {
                console.log("Error: ", err);
                error = err;
                formData = [];
            });

        return [error, formData];
    };

    function workforceFormMappingInsert(request) {
        return new Promise((resolve, reject) => {
            // IN p_form_name VARCHAR(100), IN p_form_description VARCHAR(150), IN p_form_type_id BIGINT(20), 
            // IN p_entity_level_id SMALLINT(6), IN p_activity_id BIGINT(20), IN p_activity_type_id BIGINT(20), 
            // IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20), 
            // IN p_form_activity_type_id BIGINT(20), IN p_is_workflow TINYINT(4), IN p_is_workflow_origin TINYINT(4), 
            // IN p_workflow_percentage TINYINT(4), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

            let paramsArr = new Array(
                request.form_name,
                request.form_description,
                request.form_type_id,
                request.entity_level_id,
                request.activity_id || 0,
                request.activity_type_id || 0,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.form_activity_type_id || 0,
                request.is_workflow || 0,
                request.is_workflow_origin || 0,
                request.workflow_percentage || 0,
                request.asset_id,
                util.getCurrentUTCTime()
            );

            const queryString = util.getQueryString('ds_p1_1_workforce_form_mapping_insert', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    }

    function formEntityMappingInsert(request, formID, levelID) {
        return new Promise((resolve, reject) => {
            // IN p_form_id BIGINT(20), IN p_level_id TINYINT(4), IN p_workforce_id BIGINT(20), 
            // IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), 
            // IN p_log_datetime DATETIME

            let paramsArr = new Array(
                formID,
                levelID || 3,
                request.target_asset_id || 0,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.log_asset_id || request.asset_id,
                util.getCurrentUTCTime()
            );

            const queryString = util.getQueryString('ds_p1_1_form_entity_mapping_insert', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    }

    async function formEntityMappingRemove(request) {
        let responseData = [],
		error = true;
		const paramsArr = new Array(
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.form_id,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime()
		);
		const queryString = util.getQueryString('ds_p1_1_form_entity_mapping_delete', paramsArr);
		if (queryString !== '') {
			await db.executeQueryPromise(0, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
    }

    function workforceFormFieldMappingInsert(request, formFieldCollection) {
        return new Promise(async (resolve, reject) => {
            // IN p_field_id BIGINT(20), IN p_field_name VARCHAR(1200), IN p_field_description VARCHAR(150), 
            // IN p_field_sequence_id BIGINT(20), IN p_field_mandatory_enabled TINYINT(4), 
            // IN p_field_preview_enabled TINYINT(4), IN p_data_type_combo_id SMALLINT(6), 
            // IN p_data_type_combo_value VARCHAR(1200), IN p_data_type_id SMALLINT(6), IN p_next_field_id BIGINT(20), 
            // IN p_form_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

            let paramsArr = new Array(
                formFieldCollection.field_id,
                formFieldCollection.field_name || '',
                formFieldCollection.field_description,
                formFieldCollection.inline_data,
                formFieldCollection.field_sequence_id,
                formFieldCollection.field_mandatory_enabled,
                formFieldCollection.field_preview_enabled,
                formFieldCollection.field_value_edit_enabled,
                formFieldCollection.data_type_combo_id,
                formFieldCollection.data_type_combo_value,
                formFieldCollection.data_type_id,
                formFieldCollection.next_field_id,
                formFieldCollection.gamification_score || 0,
                request.form_id,
                request.organization_id,
                request.asset_id,
                util.getCurrentUTCTime()
            );

            //const queryString = util.getQueryString('ds_p1_1_workforce_form_field_mapping_insert', paramsArr);
            //const queryString = util.getQueryString('ds_p1_2_workforce_form_field_mapping_insert', paramsArr);
            const queryString = util.getQueryString('ds_p1_4_workforce_form_field_mapping_insert', paramsArr);            
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    }

    function workforceFormMappingHistoryInsert(request) {
        return new Promise(async (resolve, reject) => {
            // IN p_form_id BIGINT(20), IN p_organization_id BIGINT(20), 
            // IN p_update_type_id SMALLINT(6), IN p_update_datetime DATETIME
            let paramsArr = new Array(
                request.form_id,
                request.organization_id,
                request.update_type_id || 0,
                util.getCurrentUTCTime()
            );
            const queryString = util.getQueryString('ds_p1_workforce_form_mapping_history_insert', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    }

    function workforceFormFieldMappingHistoryInsert(request, formFieldCollection) {
        return new Promise(async (resolve, reject) => {
            // IN p_field_id BIGINT(20), IN p_data_type_combo_id SMALLINT(6), IN p_form_id BIGINT(20), 
            // IN p_organization_id BIGINT(20), IN p_update_type_id SMALLINT(6), IN p_update_datetime DATETIME
            let paramsArr = new Array(
                formFieldCollection.field_id,
                formFieldCollection.data_type_combo_id,
                request.form_id,
                request.organization_id,
                request.update_type_id || 0,
                util.getCurrentUTCTime()
            );
            const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_history_insert', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
                // await sleep(500);
                // console.log("workforceFormFieldMappingHistoryInsert | ", queryString)
                // resolve([{field_id: 7777}])
            }
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.fetchFormFieldList = async function (request) {
        // Update asset's GPS data
        request.datetime_log = util.getCurrentUTCTime();
        activityCommonService.updateAssetLocation(request, () => {});

        const [error, formFieldMappingData] = await workforceFormFieldMappingSelect(request);
        // Process the data if needed
        // ...
        // ...
        // 
        return [error, formFieldMappingData];
    };

    async function workforceFormFieldMappingSelect(request) {
        // IN p_organization_id BIGINT(20), IN p_account_id bigint(20), 
        // IN p_workforce_id bigint(20), IN p_form_id BIGINT(20), IN p_field_id BIGINT(20), 
        // IN p_start_from INT(11), IN p_limit_value TINYINT(4)
        let formFieldMappingData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id,
            request.field_id,
            request.start_from,
            util.replaceQueryLimit(request.limit_value)
        );
        const queryString = util.getQueryString('ds_p1_1_workforce_form_field_mapping_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    formFieldMappingData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, formFieldMappingData];

    }

    this.formEntityMappingSelectProcessOrigin = async function (request) {

        const [error, formEntityData] = await formEntityMappingSelectProcessOriginForm(request);
       
        return [error, formEntityData];
    };

    async function formEntityMappingSelectProcessOriginForm(request) {
        
        let formEntityData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.activity_type_id,
            request.workflow_form_origin,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_select_workflow_form_origin', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    formEntityData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, formEntityData];

    }

    this.fetchFormAccessList = async function (request) {
        // Update asset's GPS data
        request.datetime_log = util.getCurrentUTCTime();
        activityCommonService.updateAssetLocation(request, () => {});
        let error = true, workflowFormsData = [];

        if (
          request.hasOwnProperty("add_process") &&
          Number(request.add_process) === 1
        ) {
            //const [error, workflowFormsData] = await formEntityMappingSelectWorkflowForms(request);
            [error, workflowFormsData] = await retrieveOriginForm(request);

        } else {
            let deviceOSID = request.device_os_id?request.device_os_id:0;
            if(deviceOSID == 5){
                [error, workflowFormsData] = await workforceFormMappingSelectWorkflowForms(request);
            }
            else{
                [error, workflowFormsData] = await workforceFormMappingSelectWorkflowFormsV1(request);
            }


        }

        if(!error) {
            for(let row of workflowFormsData) {
                let newReq = Object.assign({}, request);
                //newReq.organization_id = 0;
                newReq.form_id = row.form_id;
                newReq.field_id = 0;
                newReq.start_from = 0;
                newReq.limit_value = 1;
                let [err1, data] = await activityCommonService.workforceFormFieldMappingSelect(newReq);
                //console.log('DATA : ', data);
                (data.length> 0 && data[0].next_field_id > 0) ? row.is_smart = 1 : row.is_smart = 0;
            }
        }

        return [error, workflowFormsData];

        // Process the data if needed
        // ...
        // ...
        //
    };

    async function workforceFormMappingSelectWorkflowForms(request) {
        // IN p_flag SMALLINT(6), IN p_organization_id BIGINT(20), IN p_account_id bigint(20), 
        // IN p_workforce_id bigint(20), IN p_activity_type_id BIGINT(20), IN p_access_level_id SMALLINT(6), 
        // IN p_log_datetime DATETIME, IN p_start_from INT(11), IN p_limit_value TINYINT(4)

        // Access Levels
        // 1 => Organization
        // 2 => Account
        // 3 => WorkForce
        // 4 => Asset Type Category
        // 5 => AssetType
        // 6 => Asset
        // 7 => Activity Type Category
        // 8 => Activity Type
        // 9 => Activity 
        // 10 => Activity Status Type Category
        // 11 => Activity Status Type
        // 12 => Activity Status
        // 13 => Form Type Category
        // 14 => Form Type
        // 15 => Form 
        // 16 => Data Type Category
        // 17 => Data Type
        // 18 => Field

        let workflowFormsData = [],
            error = true;

        let paramsArr = new Array(
            request.flag || 0,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id || 0,
            0, // request.access_level_id || 0,
            request.log_datetime || '1970-01-01 00:00:00',
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_select_workflow_forms', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    workflowFormsData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, workflowFormsData];
    }

    this.formEntityWorkflowFormsAccessList = async(request) => {
        return await formEntityMappingSelectWorkflowForms(request);
    }
    
    async function formEntityMappingSelectWorkflowForms(request) {
        let workflowFormsData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id || 0,
            request.flag || 0,
            request.log_datetime || '1970-01-01 00:00:00',
            request.start_from,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_form_entity_mapping_select_workflow_forms', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    workflowFormsData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, workflowFormsData];
    }

    
    async function retrieveOriginForm(request) {
        let workflowFormsData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,            
            request.activity_type_id || 0,
            1,
            //request.flag_origin,            
            request.start_from || 0,
            request.limit_value || 1
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_select_workflow_form_origin', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    workflowFormsData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, workflowFormsData];
    }
    
    this.fetchWorkflowFormSubmittedStatusList = async function (request) {
        // Update asset's GPS data
        request.datetime_log = util.getCurrentUTCTime();
        activityCommonService.updateAssetLocation(request, () => {});

        const [error, workflowFormSubmittedStatusList] = await activityTimelineTransactionSelectActivityForm(
            request,
            Number(request.activity_id),
            Number(request.form_id)
        );
        // Process the data if needed
        // ...
        // ...
        // 
        return [error, workflowFormSubmittedStatusList];

    };

    async function activityTimelineTransactionSelectActivityForm(request, activityId, formId) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_activity_id BIGINT(20), 
        // IN p_form_id BIGINT(20), IN p_start_from SMALLINT(6), IN p_limit_value smallint(6)

        let workflowFormsTimelineTransactionData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            activityId,
            formId,
            request.start_from,
            util.replaceQueryLimit(request.limit_value)
        );
        const queryString = util.getQueryString('ds_p1_1_activity_timeline_transaction_select_activity_form', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    workflowFormsTimelineTransactionData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, workflowFormsTimelineTransactionData];
    }

    // SET
    this.setActivityTypeAndConfig = async function (request) {
        // Update asset's GPS data
        request.datetime_log = util.getCurrentUTCTime();
        activityCommonService.updateAssetLocation(request, () => {});

        // Update form
        const [formUpdateError, formUpdateStatus] = await workforceFormMappingUpdateWorkflow(request);
        if (formUpdateError !== false) {
            return [formUpdateError, {
                formUpdateStatus,
                formFieldUpdateStatus: []
            }];
        }
        // History update
        request.update_type_id = 606;
        workforceFormMappingHistoryInsert(request);

        // Update form
       const [formEntityUpdateError, formEntityUpdateStatus] = await formEntityMappingUpdateWorkflow(request);
        if (formEntityUpdateError !== false) {
            return [formEntityUpdateError, {
                formEntityUpdateStatus,
                formFieldUpdateStatus: []
            }];
        }        

        // Update form fields
        const [formFieldUpdateError, formFieldUpdateStatus] = await workforceFormFieldMappingUpdateWorkflow(request);
        if (formFieldUpdateError !== false) {
            return [formFieldUpdateError, {
                formUpdateStatus,
                formFieldUpdateStatus
            }];
        }
        // History update: This is not happening for now, because I don't have the list of 
        // field_ids that need to be updated. Also, the activity_type_id and the config values update 
        // for all the fields are being taken care of internally by the stored db procedure.

        // Process the data if needed
        // ...
        // ...
        // 
        return [false, {
            formUpdateStatus,
            formFieldUpdateStatus
        }];
    };

    // RESET
    this.resetActivityTypeAndConfig = async function (request) {
        // Update asset's GPS data
        request.datetime_log = util.getCurrentUTCTime();
        activityCommonService.updateAssetLocation(request, () => {});

        // Update form
        const [formUpdateError, formUpdateStatus] = await workforceFormMappingUpdateWorkflow(request);
        if (formUpdateError !== false) {
            return [formUpdateError, {
                formUpdateStatus,
                formEntityUpdateStatus: [],
                formFieldUpdateStatus: []
            }];
        }
        // History update
        request.update_type_id = 605;
        workforceFormMappingHistoryInsert(request);

        // Update form
       const [formEntityUpdateError, formEntityUpdateStatus] = await formEntityMappingUpdateWorkflow(request);
        if (formEntityUpdateError !== false) {
            return [formEntityUpdateError, {
                formEntityUpdateStatus,
                formFieldUpdateStatus: []
            }];
        }

        // Update form fields
        const [formFieldUpdateError, formFieldUpdateStatus] = await workforceFormFieldMappingUpdateWorkflow(request);
        if (formFieldUpdateError !== false) {
            return [formFieldUpdateError, {
                formUpdateStatus,
                formEntityUpdateStatus,
                formFieldUpdateStatus
            }];
        }

        //
        const [formStatusdeleteError, formStatusdeleteStatus] = await workforceFormMappingUpdateStatus(request);
        if (formStatusdeleteError !== false) {
            return [formStatusdeleteError, {
                formUpdateStatus,
                formEntityUpdateStatus,
                formStatusdeleteStatus
            }];
        }
        // History update: This is not happening for now, because I don't have the list of 
        // field_ids that need to be updated. Also, the activity_type_id and the config values update 
        // for all the fields are being taken care of internally by the stored db procedure.

        // Process the data if needed
        // ...
        // ...
        // 

        //Loop on all the fields of the Form
        //Check if bots are defined on the bot
        //If Yes
        //Delete them also
        const formID = Number(request.form_id);
        try{
            let data = await this.getFormFieldMappings(request, formID, 0, 50);
            //console.log('DATA : ', data);
            if(data.length > 0) {
                for(let i=0; i<data.length; i++) {                   
                    let botEngineRequest = Object.assign({}, request);
                        botEngineRequest.form_id = formID;
                        botEngineRequest.field_id = Number(data[i].field_id);
                        botEngineRequest.flag = 5;

                    try{            
                        let botsListData = await activityCommonService.getBotsMappedToActType(botEngineRequest);
                        if (botsListData.length > 0) {                            
                            console.log('BOTID for Field ID : ', data[i].field_id , ' is : ', botsListData[0].bot_id);
                            
                            //Archive the Bot
                            let botArchiveReq = {};
                                botArchiveReq.organization_id = request.organization_id;
                                botArchiveReq.bot_id = botsListData[0].bot_id;
                                botArchiveReq.log_state = 3;
                                botArchiveReq.log_asset_id = 100;
                                botArchiveReq.log_datetime = util.getCurrentUTCTime();           
                            await botService.archiveBot(botArchiveReq);
                        } else {
                            console.log('BOTID : is not defined for Field ID : ', data[i].field_id);
                        }
                    } catch (botInitError) {
                        //global.logger.write('error', botInitError, botInitError, request);
                        util.logError(request,`getFormFieldMappings debug Error %j`, { botInitError, request });
                    }
                }
            }

        } catch(err) {
            console.log('ERROR : ', err);
        }

        await formEntityMappingDelete(request);
        return [false, {
            formUpdateStatus,
            formFieldUpdateStatus
        }];
    };

    async function workforceFormMappingUpdateStatus(request) {
        // IN p_flag TINYINT(4), IN p_activity_type_id BIGINT(20), IN p_is_workflow TINYINT(4), 
        // IN p_form_sequence_id BIGINT(20), IN p_is_workflow_origin TINYINT(4), IN p_workflow_percentage TINYINT(4), 
        // IN p_form_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let updateStatus = [],
            error = true;

        let paramsArr = new Array(
            request.form_id,
            request.activity_status_id,
            request.organization_id,
            3,
            request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_v1_workflow_form_status_mapping_update_log_state', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    updateStatus = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, updateStatus];
    }

    async function workforceFormMappingUpdateWorkflow(request) {
        // IN p_flag TINYINT(4), IN p_activity_type_id BIGINT(20), IN p_is_workflow TINYINT(4), 
        // IN p_form_sequence_id BIGINT(20), IN p_is_workflow_origin TINYINT(4), IN p_workflow_percentage TINYINT(4), 
        // IN p_form_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let updateStatus = [],
            error = true;

        let paramsArr = new Array(
            request.flag,
            request.activity_type_id,
            request.is_workflow,
            request.form_sequence_id,
            request.is_workflow_origin,
            request.workflow_percentage,
            request.form_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_update_workflow', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    updateStatus = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, updateStatus];
    }


    async function formEntityMappingUpdateWorkflow(request) {
        // IN p_organization_id BIGINT(20),
        // IN p_form_id BIGINT(20),
        // IN p_flag_origin TINYINT(4),
        // IN p_log_asset_id BIGINT(20),
        // IN p_log_datetime DATETIME

        let updateStatus = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.form_id,
            request.activity_type_id,
            request.is_workflow_origin,
            request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_form_entity_mapping_update_origin_flag', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    updateStatus = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, updateStatus];
    }

    async function workforceFormFieldMappingUpdateWorkflow(request) {
        // IN p_flag TINYINT(4), IN p_activity_type_id BIGINT(20), IN p_is_workflow TINYINT(4), 
        // IN p_form_sequence_id BIGINT(20), IN p_is_workflow_origin TINYINT(4), IN p_workflow_percentage TINYINT(4), 
        // IN p_form_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let updateStatus = [],
            error = true;

        let paramsArr = new Array(
            request.flag,
            request.activity_type_id,
            request.is_workflow,
            request.form_sequence_id,
            request.is_workflow_origin,
            request.workflow_percentage,
            request.form_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_update_workflow', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    updateStatus = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, updateStatus];
    }

    this.workflowEngine = async function (request) {

        console.log(' ');
        console.log('# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #');
        console.log(' ');
        console.log('# # Add Workflow - File: formConfigService, Func: workflowEngine # # ');
        console.log(' ');
        console.log('# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #');
        console.log(' ');

        let workflowActivityId = request.workflow_activity_id || 0;

        request.form_id = Number(request.activity_form_id);

        // Fetch form's config data
        const [formConfigError, formConfigData] = await workforceFormMappingSelect(request);
        console.log('formConfigError : ', formConfigError);

        if (formConfigError !== false) {
            return [formConfigError, formConfigData];
        }

        console.log('formConfigData.length : ', formConfigData.length);

        if (Number(formConfigData.length) > 0) {
            // Check if the form has an origin flag set
            let activityId;
            let originFlagSet = Number(formConfigData[0].form_flag_workflow_origin),
                isWorkflowEnabled = Number(formConfigData[0].form_flag_workflow_enabled),
                workflowActivityTypeId = Number(formConfigData[0].form_workflow_activity_type_id),
                formWorkflowActivityTypeCategoryID = Number(formConfigData[0].form_workflow_activity_type_category_id) || 48,
                workflowActivityTypeName = formConfigData[0].form_workflow_activity_type_name,
                formName = String(formConfigData[0].form_name),
                workflowActivityTypeDefaultDurationDays = Number(formConfigData[0].form_workflow_activity_type_default_duration_days);

            console.log('isWorkflowEnabled : ', isWorkflowEnabled);
            console.log('originFlagSet : ', originFlagSet);
            if (isWorkflowEnabled && originFlagSet) {
                // Fetch the next activity_id to be inserted
                await cacheWrapper
                    .getActivityIdPromise()
                    .then((id) => {
                        if (Number(id) === 0) {
                            throw new Error("ErrorGettingActivityId");
                        }
                        activityId = id;
                    })
                    .catch((err) => {
                        console.log("Error 2: ", err);
                        return [err, formConfigData];
                    });

                //global.logger.write('conLog', "New activityId is :" + activityId, {}, request);
                util.logInfo(request,`workforceFormMappingSelect conLog New activityId is : %j`,{New_activityId : activityId, request});

                // Prepare a new request object and fire the addActivity service
                let createWorkflowRequest = Object.assign({}, request);
                createWorkflowRequest.activity_id = Number(activityId);
                createWorkflowRequest.activity_type_category_id = 48;
                createWorkflowRequest.activity_type_id = workflowActivityTypeId;
                //createWorkflowRequest.activity_title = workflowActivityTypeName;
                //createWorkflowRequest.activity_description = workflowActivityTypeName;
                createWorkflowRequest.activity_form_id = Number(request.activity_form_id);
                createWorkflowRequest.form_transaction_id = Number(request.form_transaction_id);
                
                // Child Orders
                createWorkflowRequest.activity_parent_id = Number(request.child_order_activity_parent_id) || 0;

                createWorkflowRequest.activity_datetime_start = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                createWorkflowRequest.activity_datetime_end = moment().utc().add(workflowActivityTypeDefaultDurationDays, "days").format('YYYY-MM-DD HH:mm:ss');

                const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
                await addActivityAsync(createWorkflowRequest);

                //console.log('**********************************************');
                //console.log('createWorkflowRequest : ', createWorkflowRequest);
                //console.log('**********************************************');
                workflowActivityId = Number(activityId);                

                // Trigger Bot Engine
                // Bot Engine Trigger
                // try {
                //     let botEngineRequest = Object.assign({}, request);
                //     botEngineRequest.form_id = request.activity_form_id;
                //     botEngineRequest.field_id = 0;
                //     botEngineRequest.flag = 3;
                //     botEngineRequest.workflow_activity_id = workflowActivityId;

                //     const [formConfigError, formConfigData] = await activityCommonService.workforceFormMappingSelect(botEngineRequest);
                //     if (
                //         (formConfigError === false) &&
                //         (Number(formConfigData.length) > 0) &&
                //         (Number(formConfigData[0].form_flag_workflow_enabled) === 1)
                //     ) {
                //         // Proceeding because there was no error found, there were records returned
                //         // and form_flag_workflow_enabled is set to 1
                //         let botsListData = await activityCommonService.getBotsMappedToActType(botEngineRequest);
                //         if (botsListData.length > 0) {
                //             botEngineRequest.bot_id = botsListData[0].bot_id;
                //             botEngineRequest.bot_inline_data = botsListData[0].bot_inline_data;
                //             botEngineRequest.flag_check = 1;
                //             botEngineRequest.flag_defined = 1;

                //             let result = await activityCommonService.botOperationInsert(botEngineRequest);
                //             //console.log('RESULT : ', result);
                //             if (result.length > 0) {
                //                 botEngineRequest.bot_transaction_id = result[0].bot_transaction_id;
                //             }

                //             //Bot log - Bot is defined
                //             activityCommonService.botOperationFlagUpdateBotDefined(botEngineRequest, 1);
                            
                //             await activityCommonService.makeRequest(botEngineRequest, "engine/bot/init", 1)
                //                 .then((resp) => {
                //                     global.logger.write('debug', "Bot Engine Trigger Response: " + JSON.stringify(resp), {}, request);
                //                     //Bot log - Update Bot status
                //                     //1.SUCCESS; 2.INTERNAL ERROR; 3.EXTERNAL ERROR; 4.COMMUNICATION ERROR
                //                     activityCommonService.botOperationFlagUpdateBotSts(botEngineRequest, 1);
                //                 }).catch((err) => {
                //                     //Bot log - Update Bot status with Error
                //                     activityCommonService.botOperationFlagUpdateBotSts(botEngineRequest, 2);
                //                 });
                //         } else {
                //             //Bot is not defined
                //             activityCommonService.botOperationFlagUpdateBotDefined(botEngineRequest, 0);
                //         }
                //     }
                // } catch (botInitError) {
                //     global.logger.write('error', botInitError, botInitError, botEngineRequest);
                // }

            }

            if (isWorkflowEnabled && originFlagSet) {                
                let activityTitle = "Form Submitted";
                if (Number(request.organization_id) === 868) {
                    switch (Number(request.activity_form_id)) {
                        case global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER:
                            activityTitle = "New Order";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY:
                            activityTitle = "Order Supplementary";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.FR:
                            activityTitle = "Feasibility Report";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.CRM:
                            activityTitle = "Customer Details";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.HLD:
                            activityTitle = "HLD Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.BC_HLD:
                            activityTitle = "BC_HLD Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.NEW_CUSTOMER:
                            activityTitle = "New Customer Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.EXISTING_CUSTOMER:
                            activityTitle = "Existing Customer Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.OMT_APPROVAL:
                            activityTitle = "OMT Approval Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.ACCOUNT_MANAGER_APPROVAL:
                            activityTitle = "Account Manager Approval Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL:
                            activityTitle = "Customer Approval Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.CAF:
                            activityTitle = "CAF Form";
                            break;
                        default:
                            activityTitle = "Form Submitted";
                    }
                }                

                let workflowFile713Request = Object.assign({}, request);
                workflowFile713Request.activity_id = workflowActivityId;
                workflowFile713Request.data_activity_id = Number(request.activity_id);
                workflowFile713Request.form_transaction_id = Number(request.form_transaction_id);
                workflowFile713Request.activity_timeline_collection = JSON.stringify({
                    "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                    "subject": `${formName}`,
                    "content": `${formName}`,
                    "asset_reference": [],
                    "activity_reference": [],
                    "form_approval_field_reference": [],
                    "form_submitted": JSON.parse(request.activity_inline_data),
                    "attachments": []
                });
                // Append the incremental form data as well
                workflowFile713Request.form_id = workflowFile713Request.activity_form_id;
                workflowFile713Request.activity_type_category_id = formWorkflowActivityTypeCategoryID || 48;
                workflowFile713Request.activity_stream_type_id = 705;
                workflowFile713Request.flag_timeline_entry = 1;
                workflowFile713Request.message_unique_id = util.getMessageUniqueId(request.asset_id);
                workflowFile713Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                workflowFile713Request.device_os_id = 8;

                const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
                
                //console.log('**************************************************');
                //console.log('workflowFile713Request : ', workflowFile713Request);
                //console.log('**************************************************');                
                
                await addTimelineTransactionAsync(workflowFile713Request);

                //addValueToWidgetForAnalyticsWF(request, workflowActivityId, workflowActivityTypeId, 0); //non-widget
            }
        }

        return [formConfigError, {
            formConfigData
        }];
    };


    this.workflowEngineAsync = async function (request) {
        //If origin Form and workflow Enabled?
        //Create a Workflow Activity
        //Make a 705 timeline entry with activity category 48
        util.logInfo(request,`# # Entry Add Workflow - File: formConfigService Func: workflowEngineAsync # # `);

        let workflowActivityId = request.workflow_activity_id || 0;

        request.form_id = Number(request.activity_form_id);

        // Fetch form's config data
        const [formConfigError, formConfigData] = await workforceFormMappingSelect(request);
        util.logError(request,`formConfigError`, { type: 'workflow_engine', error: serializeError(formConfigError) });
        if (formConfigError !== false) {
            return [formConfigError, formConfigData];
        }

        if (Number(formConfigData.length) > 0) {
            // Check if the form has an origin flag set
            let activityId;
            let originFlagSet = Number(formConfigData[0].form_flag_workflow_origin),
                isWorkflowEnabled = Number(formConfigData[0].form_flag_workflow_enabled),
                workflowActivityTypeId = Number(formConfigData[0].form_workflow_activity_type_id),
                formWorkflowActivityTypeCategoryID = Number(formConfigData[0].form_workflow_activity_type_category_id) || 48,
                workflowActivityTypeName = formConfigData[0].form_workflow_activity_type_name,
                formName = String(formConfigData[0].form_name),
                workflowActivityTypeDefaultDurationDays = Number(formConfigData[0].form_workflow_activity_type_default_duration_days);
                
                //Handling Null Case
                if(workflowActivityTypeDefaultDurationDays === 0) {
                    workflowActivityTypeDefaultDurationDays = 5;
                }

            if (isWorkflowEnabled && originFlagSet) {
                // Fetch the next activity_id to be inserted
                await cacheWrapper
                    .getActivityIdPromise()
                    .then((id) => {
                        if (Number(id) === 0) {
                            throw new Error("ErrorGettingActivityId");
                        }
                        activityId = id;
                    })
                    .catch((err) => {
                        console.log("Error 2: ", err);
                        return [err, formConfigData];
                    });

                    util.logInfo(request,`New activityId is %j`,{activityId});
                // Prepare a new request object and fire the addActivity service
                let createWorkflowRequest = Object.assign({}, request);
                    createWorkflowRequest.activity_id = Number(activityId);
                    createWorkflowRequest.activity_type_category_id = 48;
                    createWorkflowRequest.activity_type_id = workflowActivityTypeId;                
                    createWorkflowRequest.activity_form_id = Number(request.activity_form_id);
                    createWorkflowRequest.form_transaction_id = Number(request.form_transaction_id);
                    
                    // Child Orders
                    createWorkflowRequest.activity_parent_id = Number(request.child_order_activity_parent_id) || 0;

                    createWorkflowRequest.activity_datetime_start = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                    createWorkflowRequest.activity_datetime_end = moment().utc().add(workflowActivityTypeDefaultDurationDays, "days").format('YYYY-MM-DD HH:mm:ss');

                const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
                await addActivityAsync(createWorkflowRequest);

                workflowActivityId = Number(activityId);
            }

            if (isWorkflowEnabled && originFlagSet) {                
                let activityTitle = "Form Submitted";
                if (Number(request.organization_id) === 868) {
                    switch (Number(request.activity_form_id)) {
                        case global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER:
                            activityTitle = "New Order";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY:
                            activityTitle = "Order Supplementary";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.FR:
                            activityTitle = "Feasibility Report";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.CRM:
                            activityTitle = "Customer Details";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.HLD:
                            activityTitle = "HLD Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.BC_HLD:
                            activityTitle = "BC_HLD Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.NEW_CUSTOMER:
                            activityTitle = "New Customer Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.EXISTING_CUSTOMER:
                            activityTitle = "Existing Customer Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.OMT_APPROVAL:
                            activityTitle = "OMT Approval Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.ACCOUNT_MANAGER_APPROVAL:
                            activityTitle = "Account Manager Approval Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL:
                            activityTitle = "Customer Approval Form";
                            break;
                        case global.vodafoneConfig[request.organization_id].FORM_ID.CAF:
                            activityTitle = "CAF Form";
                            break;
                        default:
                            activityTitle = "Form Submitted";
                    }
                }                

                //705 timeline entry of workFlow
                let workflowFile713Request = Object.assign({}, request);
                    workflowFile713Request.activity_id = workflowActivityId;
                    workflowFile713Request.data_activity_id = Number(request.activity_id);
                    workflowFile713Request.form_transaction_id = Number(request.form_transaction_id);
                    workflowFile713Request.activity_timeline_collection = JSON.stringify({
                        "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                        "subject": `${formName}`,
                        "content": `${formName}`,
                        "asset_reference": [],
                        "activity_reference": [],
                        "form_approval_field_reference": [],
                        "form_submitted": JSON.parse(request.activity_inline_data),
                        "attachments": []
                    });
                    // Append the incremental form data as well
                    workflowFile713Request.form_id = workflowFile713Request.activity_form_id;
                    workflowFile713Request.activity_type_category_id = formWorkflowActivityTypeCategoryID || 48;
                    workflowFile713Request.activity_stream_type_id = 705;
                    workflowFile713Request.flag_timeline_entry = 1;
                    workflowFile713Request.message_unique_id = util.getMessageUniqueId(request.asset_id);
                    workflowFile713Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                    workflowFile713Request.device_os_id = 8;                

                await activityTimelineService.addTimelineTransactionAsync(workflowFile713Request);
                //await addValueToWidgetForAnalyticsWF(request, workflowActivityId, workflowActivityTypeId, 0); //non-widget
            }
        }

        logger.info('# # Exit Add Workflow - File: formConfigService, Func: workflowEngineAsync # # ');

        return [formConfigError, {formConfigData}];
    };

    async function workforceFormMappingSelect(request, activityId, formId) {
        // IN p_organization_id BIGINT(20), IN p_account_id bigint(20), 
        // IN p_workforce_id bigint(20), IN p_form_id BIGINT(20)

        let formData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_select', paramsArr);
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

    this.workflowOnFormEdit = async function (request) {

        // Fetch form's config data
        request.page_start = 0;
        const [formConfigError, formConfigData] = await workforceFormMappingSelect(request);
        if (formConfigError !== false) {
            return [formConfigError, formConfigData];

        } else if (Number(formConfigData.length) === 0 || Number(formConfigData[0].form_flag_workflow_enabled) !== 1) {
            return [new Error("formConfigData Not Found Error"), formConfigData];
        }

        let workflowActivityId = 0,
            formWorkflowActivityTypeId = 0,
            formWorkflowActivityTypeCategoryID = 0,
            botId = 0,
            botTriggerId = 0,
            botOperationId = 0,
            copyFormFieldOperation = {};

        // Get the corresponding workflow's activity_id
        const [workflowError, workflowData] = await fetchReferredFormActivityIdAsync(request, request.activity_id, request.form_transaction_id, request.form_id);
        if (workflowError !== false || workflowData.length === 0) {
            return [workflowError, workflowData];
        }
        workflowActivityId = Number(workflowData[0].activity_id);
        const workflowActivityTypeID = Number(workflowData[0].activity_type_id);
        util.logInfo(request,`workflowActivityId %j`, workflowActivityId);
        util.logInfo(request,`workflowActivityTypeID %j`, workflowActivityTypeID);


        // Make a 713 timeline transaction entry in the workflow file
        let workflowFile713Request = Object.assign({}, request);
            workflowFile713Request.activity_id = workflowActivityId;
            workflowFile713Request.data_activity_id = Number(request.activity_id);
            workflowFile713Request.form_transaction_id = Number(request.form_transaction_id);
            workflowFile713Request.activity_type_category_id = 48;
            workflowFile713Request.activity_stream_type_id = 713;
            workflowFile713Request.flag_timeline_entry = 1;
            workflowFile713Request.message_unique_id = util.getMessageUniqueId(request.asset_id);
            workflowFile713Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            workflowFile713Request.device_os_id = 8;            

        if (Number(formConfigData.length) > 0) {

            formWorkflowActivityTypeId = formConfigData[0].form_workflow_activity_type_id;
            util.logInfo(request,`formWorkflowActivityTypeId %{formWorkflowActivityTypeId}`);

            formWorkflowActivityTypeCategoryID = Number(formConfigData[0].form_workflow_activity_type_category_id) || 48;
            workflowFile713Request.activity_type_category_id = formWorkflowActivityTypeCategoryID || 48;

            if (Number(formWorkflowActivityTypeId) !== 0) {
                // 713 timeline entry on the workflow file
                try {
                    //const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
                    await activityTimelineService.addTimelineTransactionAsync(workflowFile713Request);
                    //await addTimelineTransactionAsync(workflowFile713Request);
                } catch (error) {
                    util.logError(request,`addTimelineTransactionAsync`, { type: 'alter_form', error: serializeError(error) });
                }
                util.logInfo(request,`Calling [regenerateAndSubmitTargetForm]: %j`, request.activity_inline_data);
                // Regenerate target form (if required/mapping exists), and then submit a 713 entry

                const rebuildTargetFormEvent = {
                    name: "vodafoneService",
                    service: "vodafoneService",
                    method: "regenerateAndSubmitTargetForm",
                    payload: Object.assign(request)
                };
                queueWrapper.raiseActivityEvent(rebuildTargetFormEvent, request.activity_id, (err, resp) => {
                    if (err) {
                        util.logError(request,`Error in queueWrapper raiseActivityEvent:`, { type: 'alter_form', error: serializeError(err) });
                    } else {
                        util.logInfo(request,`Response from queueWrapper raiseActivityEvent: %j`, resp);
                    }
                });
            }

            try {
                let newRequest = Object.assign({}, request);
                newRequest.flag = 2;
                newRequest.activity_type_id = formWorkflowActivityTypeId;
                newRequest.account_id = 0;
                newRequest.workforce_id = 0;
                let result = await botService.getBotsMappedToActType(newRequest);
                if (result.length > 0) {
                    botId = result[0].bot_id;
                    botTriggerId = result[0].bot_trigger_id;
                }
                // return [false, {
                //     result
                // }];
            } catch (error) {
                return [error, {
                    result: []
                }];
            }
        }

        /*if (botId > 0) {
            try {
                let newRequest = Object.assign({}, request);
                newRequest.bot_id = botId;
                newRequest.activity_type_id = formWorkflowActivityTypeId;
                result = await botService.getBotworkflowSteps(newRequest);
                if (result.length > 0) {
                    result.forEach(botOperation => {
                        console.log("botOperation.bot_operation_type_id: ", Number(botOperation.bot_operation_type_id));
                        if (Number(botOperation.bot_operation_type_id) === 3) {
                            copyFormFieldOperation = botOperation;
                        }
                    });
                }
            } catch (error) {
                return [error, {
                    result: []
                }];
            }
        }*/

        let targetFormActivityId = 0,
            targetFormTransactionId = 0,
            targetFormName,
            targetFormInlineData = {},
            targetFormSubmittedData = [];
        if (Object.keys(copyFormFieldOperation).length > 0) {
            // console.log("copyFormFieldOperation: ", copyFormFieldOperation)
            botOperationId = copyFormFieldOperation.bot_operation_id;
            let botOperationInlineData = JSON.parse(copyFormFieldOperation.bot_operation_inline_data);
            let formFieldMapping = botOperationInlineData.bot_operations.form_field_copy;

            util.logInfo(request,`formFieldMapping: %j`, formFieldMapping);
            //if (formFieldMapping.length > 0) {

            let fieldCopyOperations = [];
            for (const mapping of formFieldMapping) {
                // console.log("[formFieldMapping] mapping: ", mapping)
                // console.log(`mapping.source_form_id: ${mapping.source_form_id} | request.form_id: ${request.form_id} | ${Number(mapping.source_form_id) === Number(request.form_id)}`);
                // console.log(`mapping.source_field_id: ${mapping.source_field_id} | request.field_id: ${request.field_id} | ${Number(mapping.source_field_id) === Number(request.field_id)}`);
                if (
                    Number(mapping.source_form_id) === Number(request.form_id) &&
                    Number(mapping.source_field_id) === Number(request.field_id)
                ) {
                    util.logInfo(request,`Match Found: %j`,mapping);
                    fieldCopyOperations.push(mapping);
                    await activityCommonService
                        .getActivityTimelineTransactionByFormId713(request, workflowActivityId, mapping.target_form_id)
                        .then((targetFormData) => {
                            if (targetFormData.length > 0) {
                                targetFormActivityId = Number(targetFormData[0].data_activity_id);
                                // targetFormActivityId = 152002;
                                targetFormTransactionId = Number(targetFormData[0].data_form_transaction_id);
                                targetFormInlineData = JSON.parse(targetFormData[0].data_entity_inline);
                                targetFormName = targetFormData[0].data_form_name;
                            }
                        });
                }
            }

            if (botTriggerId === 2) {
                let newRequest = Object.assign({}, request);
                newRequest.bot_id = botId;
                newRequest.bot_operation_id = botOperationId;
                newRequest.activity_type_id = formWorkflowActivityTypeId;
                newRequest.target_form_transaction_id = targetFormTransactionId;
                newRequest.target_activity_id = targetFormActivityId;
                newRequest.workflow_activity_id = workflowActivityId;
                newRequest.inline_data = JSON.stringify({
                    "bot_operations": {
                        "form_field_copy": fieldCopyOperations
                    }
                });
                try {
                    setTimeout(async () => {

                        let botEngineRequestHandleType = global.config.BOT_ENGINE_REQUEST_HANDLE_TYPE;
                        util.logInfo(request, `[BotEngineTrigger] Bot Engine request handle type ${botEngineRequestHandleType} %j`, { request: newRequest });
                        botEngineRequestHandleType = botEngineRequestHandleType.toLowerCase();
                        switch (botEngineRequestHandleType) {
                            case "api":
                                util.logInfo(request, `Bot Engine trigerring via ${botEngineRequestHandleType}`);
                                newRequest.bot_trigger_source_id = 16;
                                const [botTransactionId, messageID] = await util.handleBotTransactionInsertForApi(newRequest);
                                newRequest.sqs_bot_transaction_id = botTransactionId;
                                newRequest.message_id = messageID;
                                botService.initBotEngine(newRequest);
                                break;
                            case "sqs":
                                newRequest.bot_trigger_source_id = 7;
                                util.logInfo(request, `Bot Engine trigerring via ${botEngineRequestHandleType}`);
                                util.logInfo(request, `[${request.workflow_activity_id}] Calling Bot Engine from activity service %j`, { newRequest });
                                util.pushBotRequestToSQS(newRequest);
                                break;
                            default:
                                newRequest.bot_trigger_source_id = 8;
                                util.logInfo(request, `Bot Engine trigerring via ${botEngineRequestHandleType}`);
                                util.logInfo(request, `[${request.workflow_activity_id}] Calling Bot Engine from activity service %j`, { newRequest });
                                util.pushBotRequestToSQS(newRequest);
                                break;
                        }
                    }, 2500);
                } catch (error) {
                    util.logError(request,`botService.initBotEngine Error! `, { type: 'alter_form', error: serializeError(error) });
                }
            }

            //}

        } else {
            if (botTriggerId === 2) {
                let newRequest = Object.assign({}, request);
                newRequest.bot_id = botId;
                newRequest.activity_type_id = formWorkflowActivityTypeId;
                newRequest.target_form_transaction_id = targetFormTransactionId;
                newRequest.target_activity_id = targetFormActivityId;
                newRequest.workflow_activity_id = workflowActivityId;
                try {
                    setTimeout(async () => {
                        let botEngineRequestHandleType = global.config.BOT_ENGINE_REQUEST_HANDLE_TYPE;
                        util.logInfo(request, `[BotEngineTrigger] Bot Engine request handle type ${botEngineRequestHandleType} %j`, { request: newRequest });
                        botEngineRequestHandleType = botEngineRequestHandleType.toLowerCase();
                        switch (botEngineRequestHandleType) {
                            case "api":
                                util.logInfo(request,`Bot Engine trigerring via ${botEngineRequestHandleType}`);
                                newRequest.bot_trigger_source_id = 17;
                                const [botTransactionId, messageID] = await util.handleBotTransactionInsertForApi(newRequest);
                                newRequest.sqs_bot_transaction_id = botTransactionId;
                                newRequest.message_id = messageID;
                                botService.initBotEngine(newRequest);
                                break;
                            case "sqs":
                                newRequest.bot_trigger_source_id = 9;
                                util.logInfo(request,`Bot Engine trigerring via ${botEngineRequestHandleType}`);
                                util.logInfo(request, `[${request.workflow_activity_id}] Calling Bot Engine from activity service %j`, { newRequest });
                                util.pushBotRequestToSQS(newRequest);
                                break;
                            default:
                                newRequest.bot_trigger_source_id = 10;
                                util.logInfo(request,`Bot Engine trigerring via ${botEngineRequestHandleType}`);
                                util.logInfo(request, `[${request.workflow_activity_id}] Calling Bot Engine from activity service %j`, { newRequest });
                                util.pushBotRequestToSQS(newRequest);
                                break;
                        }

                    }, 3000);
                } catch (error) {
                    util.logError(request,`botService.initBotEngine Error! `, { type: 'alter_form', error: serializeError(error) });
                }
            }
        }
        
        // ############################## BOT ENGINE REQUEST START ##############################
        // console.log("workflowOnFormEdit | request | request", request);
        let initBotEngineRequest = Object.assign({}, request);
        initBotEngineRequest.workflow_activity_id = workflowActivityId;
        initBotEngineRequest.activity_form_id = request.form_id;
        initBotEngineRequest.flag_check = 1;
        initBotEngineRequest.flag_defined = 1;
        // Fetch bot details
        let initBotEngineRequestBotID = 0,
            initBotEngineRequestBotInlineData = {};

        try {
            throw new Error("This is not required!")
            const botListData = await activityCommonService.getBotsMappedToActType({
                flag: 3,
                organization_id: request.organization_id,
                account_id: request.account_id,
                workforce_id: request.workforce_id,
                activity_type_id: workflowActivityTypeID || 0,
                field_id: 0,
                form_id: request.form_id
            });
            if (Number(botListData.length) > 0) {
                initBotEngineRequestBotID = botListData[0].bot_id;
                initBotEngineRequestBotInlineData = botListData[0].bot_inline_data;

                initBotEngineRequest.bot_id = initBotEngineRequestBotID;
                initBotEngineRequest.bot_inline_data = initBotEngineRequestBotInlineData;

                // [LOGGING] Bot is defined for this form 
                activityCommonService.botOperationFlagUpdateBotDefined(initBotEngineRequest, 1);
            } else {
                // [LOGGING] No bot found for this form 
                activityCommonService.botOperationFlagUpdateBotDefined(initBotEngineRequest, 0);
            }
        } catch (error) {
            // [LOGGING] Error fetching bots for this form 
            activityCommonService.botOperationFlagUpdateBotDefined(initBotEngineRequest, 0);
            util.logError(request,`botListData `, { type: 'alter_form'});
        }
        
        // Fire the Bot Engine
        if (Number(initBotEngineRequestBotID) !== 0) {

            // [LOGGING] Fetch a bot trasaction ID for this operation
            let botTransactionInsertData = await activityCommonService.botOperationInsert(initBotEngineRequest);
            if (Number(botTransactionInsertData.length) > 0) {
                initBotEngineRequest.bot_transaction_id = botTransactionInsertData[0].bot_transaction_id;
            }

            await sleep(3000);
            try {
                let botEngineRequestHandleType = global.config.BOT_ENGINE_REQUEST_HANDLE_TYPE;
                util.logInfo(request, `[BotEngineTrigger] Bot Engine request handle type ${botEngineRequestHandleType} %j`, { request: initBotEngineRequest });
                botEngineRequestHandleType = botEngineRequestHandleType.toLowerCase();
                switch (botEngineRequestHandleType) {
                    case "api":
                        util.logInfo(request, `Bot Engine trigerring via ${botEngineRequestHandleType}`);
                        initBotEngineRequest.bot_trigger_source_id = 18;
                        const [botTransactionId, messageID] = await util.handleBotTransactionInsertForApi(initBotEngineRequest);
                        initBotEngineRequest.sqs_bot_transaction_id = botTransactionId;
                        initBotEngineRequest.message_id = messageID;
                        botService.initBotEngine(initBotEngineRequest);
                        break;
                    case "sqs":
                        initBotEngineRequest.bot_trigger_source_id = 11;
                        util.logInfo(request, `Bot Engine trigerring via ${botEngineRequestHandleType}`);
                        util.logInfo(request, `[${request.workflow_activity_id}] Calling Bot Engine from activity service %j`, { initBotEngineRequest });
                        util.pushBotRequestToSQS(initBotEngineRequest);
                        break;
                    default:
                        initBotEngineRequest.bot_trigger_source_id = 12;
                        util.logInfo(request, `Bot Engine trigerring via ${botEngineRequestHandleType}`);
                        util.logInfo(request, `[${request.workflow_activity_id}] Calling Bot Engine from activity service %j`, { initBotEngineRequest });
                        util.pushBotRequestToSQS(initBotEngineRequest);
                        break;
                }


                // [LOGGING] Bot Operation => 1. SUCCESS
                initBotEngineRequest.bot_operation_status_id = 1;
                initBotEngineRequest.bot_transaction_inline_data = '{}';
                activityCommonService.botOperationFlagUpdateBotSts(initBotEngineRequest, 1);
            } catch (error) {
                console.log("workflowOnFormEdit | botService | initBotEngine | Error: ", error);
                // [LOGGING] Bot Operation => 2. INTERNAL ERROR
                activityCommonService.botOperationFlagUpdateBotSts(initBotEngineRequest, 2);
            }
        } else {
            console.log("workflowOnFormEdit | botService | initBotEngine | initBotEngineRequestBotID is 0");
        }
        // ############################## BOT ENGINE REQUEST START ##############################
        
        util.logInfo(request,`targetFormActivityId %j`, targetFormActivityId);
        util.logInfo(request,` targetFormTransactionId %j`, targetFormTransactionId);
        util.logInfo(request,`targetFormSubmittedData %j`, targetFormSubmittedData);
        util.logInfo(request,`targetFormName %j`, targetFormName);

        return [formConfigError, {
            formConfigData
        }];


    };

    async function fetchReferredFormActivityIdAsync(request, activityId, formTransactionId, formId) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_activity_id BIGINT(20), IN p_form_id BIGINT(20), 
        // IN p_form_transaction_id BIGINT(20), IN p_start_from SMALLINT(6), 
        // IN p_limit_value smallint(6)

        let formData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            activityId,
            formId,
            formTransactionId,
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_activity_timeline_transaction_select_refered_activity', paramsArr);
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

    this.formFieldDefinitionUpdate = async function (request) {
        let fieldDefinitions = [];
        console.log("request.fields_data", request.fields_data);
        // Update asset's GPS data
        request.datetime_log = util.getCurrentUTCTime();
        request.update_type_id = 28;
        // activityCommonService.updateAssetLocation(request, () => {});

        try {
            fieldDefinitions = JSON.parse(request.fields_data);
        } catch (error) {
            return [true, {
                message: "fields_data has invalid JSON."
            }];
        }
        // console.log("fieldDefinitions: ", fieldDefinitions)
        console.log("fieldDefinitions.length: ", fieldDefinitions.length);

        // Process each field
        for (const field of fieldDefinitions) {
            // console.log("Object.keys(field): ", Object.keys(field));
            console.log("dataTypeCategoryId: ", field.dataTypeCategoryId);
            let dataTypeCategoryId = Number(field.dataTypeCategoryId);
            // let fieldName = (typeof field.update_option === 'undefined') ? field.label : field.update_option;
            let fieldName = field.label;
            let fieldMandatoryEnabled = 0;
            if (field.hasOwnProperty("validate") && field.validate.hasOwnProperty("required")) {
                if (field.validate.required === true) {
                    fieldMandatoryEnabled = 1;
                    console.log("fieldMandatoryEnabled: ", fieldMandatoryEnabled)
                }
            }

            console.log('\x1b[36m\n%s\x1b[0m', 'field_id: ', field.field_id);

            if (dataTypeCategoryId === 14 || dataTypeCategoryId === 15) {
                // Iterate through each form field options
                let fieldOptions = field.data.values;
                for (const option of fieldOptions) {

                    let dataTypeComboValue = option.label;

                    const [updateError, updateStatus] = await workforceFormFieldMappingUpdate(request, {
                        field_id: field.field_id,
                        data_type_combo_id: option.dataTypeComboId,
                        field_name: fieldName,
                        field_description: field.placeholder || '',
                        data_type_combo_value: dataTypeComboValue,
                        field_sequence_id: field.sequence_id,
                        field_mandatory_enabled: fieldMandatoryEnabled,
                        field_preview_enabled: field.field_preview_enabled,
                        field_value_edit_enabled: field.field_value_edit_enabled,
                        inline_data: JSON.stringify(field.inline_data),
                        gamification_score: field.gamification_score || 0,
                    });
                    if (updateError !== false) {

                    }
                    // Update next field ID, if needed
                    if (option.hasOwnProperty("next_field_id") && (Number(option.next_field_id) >= 0 || Number(option.next_field_id) === -1)) {
                        try {
                            await workforceFormFieldMappingUpdateNextField(request, {
                                field_id: field.field_id,
                                data_type_combo_id: option.dataTypeComboId,
                                next_field_id: option.next_field_id || field.next_field_id || 0
                            });
                        } catch (error) {
                            // console.log("qwe Error: ", error);
                        }
                    }
                    await workforceFormFieldMappingHistoryInsert(request, {
                        field_id: field.field_id,
                        data_type_combo_id: option.dataTypeComboId
                    });
                }

                if(fieldOptions.length === 0){
                    let dataTypeComboValue = (typeof field.update_option === 'undefined') ? '0' : field.label;

                    const [updateError, updateStatus] = await workforceFormFieldMappingUpdate(request, {
                        field_id: field.field_id,
                        data_type_combo_id: field.dataTypeComboId,
                        field_name: fieldName,
                        field_description: field.placeholder || '',
                        data_type_combo_value: dataTypeComboValue,
                        field_sequence_id: field.sequence_id,
                        field_mandatory_enabled: fieldMandatoryEnabled,
                        field_preview_enabled: field.field_preview_enabled,
                        field_value_edit_enabled: field.field_value_edit_enabled,
                        inline_data: JSON.stringify(field.inline_data),
                        gamification_score: field.gamification_score || 0,
                    });
                    if (updateError !== false) {
    
                    }
                    // Update next field ID, if needed
                    if (field.hasOwnProperty("next_field_id") && (Number(field.next_field_id) >= 0 || Number(field.next_field_id) === -1)) {
                        try {
                            await workforceFormFieldMappingUpdateNextField(request, {
                                field_id: field.field_id,
                                data_type_combo_id: field.dataTypeComboId,
                                next_field_id: Number(field.next_field_id)
                            });
                        } catch (error) {
                            console.log("qwe Error: ", error);
                        }
                    }
    
                    await workforceFormFieldMappingHistoryInsert(request, {
                        field_id: field.field_id,
                        data_type_combo_id: field.dataTypeComboId
                    });
                }
            } else {

                let dataTypeComboValue = (typeof field.update_option === 'undefined') ? '0' : field.label;

                const [updateError, updateStatus] = await workforceFormFieldMappingUpdate(request, {
                    field_id: field.field_id,
                    data_type_combo_id: field.dataTypeComboId,
                    field_name: fieldName,
                    field_description: field.placeholder || '',
                    data_type_combo_value: dataTypeComboValue,
                    field_sequence_id: field.sequence_id,
                    field_mandatory_enabled: fieldMandatoryEnabled,
                    field_preview_enabled: field.field_preview_enabled,
                    field_value_edit_enabled: field.field_value_edit_enabled,
                    inline_data: JSON.stringify(field.inline_data),
                    gamification_score: field.gamification_score || 0,
                });
                if (updateError !== false) {

                }
                // Update next field ID, if needed
                if (field.hasOwnProperty("next_field_id") && (Number(field.next_field_id) >= 0 || Number(field.next_field_id) === -1)) {
                    try {
                        await workforceFormFieldMappingUpdateNextField(request, {
                            field_id: field.field_id,
                            data_type_combo_id: field.dataTypeComboId,
                            next_field_id: Number(field.next_field_id)
                        });
                    } catch (error) {
                        console.log("qwe Error: ", error);
                    }
                }

                await workforceFormFieldMappingHistoryInsert(request, {
                    field_id: field.field_id,
                    data_type_combo_id: field.dataTypeComboId
                });
            }
        }
        return [false, []];
    };

    async function workforceFormFieldMappingUpdateNextField(request, fieldOptions) {
        let fieldUpdateStatus = [],
            error = false; // true;

        let paramsArr = new Array(
            fieldOptions.field_id,
            fieldOptions.data_type_combo_id,
            request.form_id,
            fieldOptions.next_field_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_1_workforce_form_field_mapping_update_next_field', paramsArr);
        if (queryString !== '') {
            // console.log(queryString)
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    fieldUpdateStatus = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, fieldUpdateStatus];
    }

    async function workforceFormFieldMappingUpdate(request, fieldOptions) {
        // IN p_field_id BIGINT(20), IN p_data_type_combo_id SMALLINT(6), 
        // IN p_form_id BIGINT(20), IN p_field_name VARCHAR(1200), 
        // IN p_field_description VARCHAR(300), IN p_data_type_combo_value VARCHAR(1200), 
        // IN p_inline_data JSON, IN p_field_sequence_id BIGINT(20), IN p_field_mandatory_enabled TINYINT(4),
        // IN p_field_preview_enabled TINYINT(4), IN p_field_value_edit_enabled TINYINT(4), 
        // IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let fieldUpdateStatus = [],
            error = false; // true;

        let paramsArr = new Array(
            fieldOptions.field_id,
            fieldOptions.data_type_combo_id,
            request.form_id,
            fieldOptions.field_name,
            fieldOptions.field_description,
            fieldOptions.data_type_combo_value,
            fieldOptions.inline_data || '{}',
            fieldOptions.field_sequence_id,
            fieldOptions.field_mandatory_enabled,
            fieldOptions.field_preview_enabled,
            fieldOptions.field_value_edit_enabled || 0,
            fieldOptions.gamification_score || 0, 
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime(),
        );
        //const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_update', paramsArr);
        const queryString = util.getQueryString('ds_p1_3_workforce_form_field_mapping_update', paramsArr);
        if (queryString !== '') {
            // console.log(queryString)
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    fieldUpdateStatus = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, fieldUpdateStatus];
    }

    async function workforceFormFieldMappingHistoryInsert(request, fieldOptions) {
        // IN p_field_id BIGINT(20), IN p_data_type_combo_id SMALLINT(6), IN p_form_id BIGINT(20), 
        // IN p_organization_id BIGINT(20), IN p_update_type_id SMALLINT(6), IN p_update_datetime DATETIME

        let fieldUpdateStatus = [],
            error = false; // true;

        let paramsArr = new Array(
            fieldOptions.field_id,
            fieldOptions.data_type_combo_id,
            request.form_id,
            request.organization_id,
            request.update_type_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_history_insert', paramsArr);
        if (queryString !== '') {
            // console.log(queryString)
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    fieldUpdateStatus = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, fieldUpdateStatus];
    }

    this.formFieldNameUpdate = async function (request) {
        request.update_type_id = 28;
        const [updateError, updateStatus] = await workforceFormFieldMappingUpdateFormName(request);
        // console.log("updateError: ", updateError)
        // console.log("updateStatus: ", updateStatus)
        // console.log()
        const [formFieldUpdateError, formFieldUpdateStatus] = await workforceFormFieldMappingUpdate(request, {
            field_id: request.field_id,
            data_type_combo_id: 0,
            field_name: request.form_name,
            field_description: '',
            data_type_combo_value: '',
            field_sequence_id: 0,
            field_mandatory_enabled: 0,
            field_preview_enabled: '0'
        });
        try {
            workforceFormFieldMappingHistoryInsert(request, {
                field_id: request.field_id,
                data_type_combo_id: 0
            });
            workforceFormMappingUpdate(request);
            formEntityMappingUpdateFormName(request);
        } catch (error) {

        }
        // console.log("formFieldUpdateError: ", updateError)
        // console.log("formFieldUpdateStatus: ", updateStatus)
        // console.log()
        // console.log()
        return [updateError, updateStatus];
    }

    async function workforceFormFieldMappingUpdateFormName(request) {
        // IN p_field_id BIGINT(20), IN p_data_type_combo_id SMALLINT(6), 
        // IN p_form_id BIGINT(20), IN p_field_name VARCHAR(1200), 
        // IN p_field_description VARCHAR(300), IN p_data_type_combo_value VARCHAR(1200), 
        // IN p_field_sequence_id BIGINT(20), IN p_field_mandatory_enabled TINYINT(4), 
        // IN p_field_preview_enabled TINYINT(4), IN p_organization_id BIGINT(20), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let updateStatus = [],
            error = true; // true;

        let procName = 'ds_p1_workforce_form_field_mapping_update_form_name';
        let paramsArr = new Array(
            0, // request.field_id,
            0, // request.data_type_combo_id,
            request.form_id,
            request.form_name,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        await db.callDBProcedure(request, procName, paramsArr, 0)
            .then((data) => {
                updateStatus = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            });
        return [error, updateStatus];
    }

    async function workforceFormMappingUpdate(request) {
        // IN p_form_name VARCHAR(100), IN p_form_description VARCHAR(150), 
        // IN p_form_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let updateStatus = [],
            error = true; // true;

        let procName = 'ds_p1_workforce_form_mapping_update';
        let paramsArr = new Array(
            request.form_name,
            '',
            request.form_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        await db.callDBProcedure(request, procName, paramsArr, 0)
            .then((data) => {
                updateStatus = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            });
        return [error, updateStatus];
    }

    async function formEntityMappingUpdateFormName(request) {
        // IN p_form_name VARCHAR(100), IN p_form_description VARCHAR(150), 
        // IN p_form_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let updateStatus = [],
            error = true; // true;

        let procName = 'ds_p1_form_entity_mapping_update';
        let paramsArr = new Array(
            request.form_name,
            '',
            request.form_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        await db.callDBProcedure(request, procName, paramsArr, 0)
            .then((data) => {
                updateStatus = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            });
        return [error, updateStatus];
    }

    this.formFieldDefinitionDelete = async function (request) {
        let fieldDefinitions = [];
        request.update_type_id = 30;

        try {
            fieldDefinitions = JSON.parse(request.fields_data);
        } catch (error) {
            return [true, {
                message: "fields_data has invalid JSON."
            }];
        }
        for (const field of fieldDefinitions) {
            let dataTypeCategoryId = Number(field.dataTypeCategoryId) || Number(field.datatypecategoryid);
            console.log('\x1b[36m\n%s\x1b[0m', 'field_id: ', field.field_id);
            // console.log("field: ", field);
            if (dataTypeCategoryId === 14 || dataTypeCategoryId === 15) {
                let fieldOptions = field.data.values;
                for (const option of fieldOptions) {

                    const [updateError, updateStatus] = await workforceFormFieldMappingDelete(request, {
                        field_id: field.field_id,
                        data_type_combo_id: option.dataTypeComboId,
                    });
                    if (updateError !== false) {

                    }
                    try {
                        await workforceFormFieldMappingHistoryInsert(request, {
                            field_id: field.field_id,
                            data_type_combo_id: option.dataTypeComboId
                        });
                    } catch (error) {
                        // Do nothing if the history insert fails
                    }
                }
                if(fieldOptions.length==0){
                    const [updateError, updateStatus] = await workforceFormFieldMappingDelete(request, {
                        field_id: field.field_id,
                        data_type_combo_id: field.dataTypeComboId || 0,
                    });
                    if (updateError !== false) {
    
                    }
                    try {
                        await workforceFormFieldMappingHistoryInsert(request, {
                            field_id: field.field_id,
                            data_type_combo_id: field.dataTypeComboId || 0
                        });
                    } catch (error) {
                        // Do nothing if the history insert fails
                    } 
                }
            } else {
                const [updateError, updateStatus] = await workforceFormFieldMappingDelete(request, {
                    field_id: field.field_id,
                    data_type_combo_id: field.dataTypeComboId,
                });
                if (updateError !== false) {

                }
                try {
                    await workforceFormFieldMappingHistoryInsert(request, {
                        field_id: field.field_id,
                        data_type_combo_id: field.dataTypeComboId
                    });
                } catch (error) {
                    // Do nothing if the history insert fails
                }
            }
        }
        return [false, []]
    }

    this.workforceFormFieldMappingDeleteFunc = async(request) => {        
        const [updateError, updateStatus] = await workforceFormFieldMappingDelete(request, {
            field_id: request.field_id,
            data_type_combo_id: request.data_type_combo_id,
        });
        return[false, {}];
    }
    
    async function workforceFormFieldMappingDelete(request, fieldOptions) {
        // IN p_field_id BIGINT(20), IN p_data_type_combo_id SMALLINT(6), 
        // IN p_form_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let updateStatus = [],
            error = true; // true;

        let procName = 'ds_p1_workforce_form_field_mapping_delete';
        let paramsArr = new Array(
            fieldOptions.field_id,
            fieldOptions.data_type_combo_id,
            request.form_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime(),
        );
        // const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_delete', paramsArr);
        // console.log(queryString);
        await db.callDBProcedure(request, procName, paramsArr, 0)
            .then((data) => {
                updateStatus = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            });
        return [error, updateStatus];
    }

    this.formFieldDefinitionInsert = async function (request) {
        let formId = 0,
            fieldDefinitions = [],
            formName = '', formData = [],
            error,
            fieldIDForBotCreation = 0;

        request.update_type_id = 28;

        try {
            fieldDefinitions = JSON.parse(request.fields_data);
        } catch (error) {
            return [true, {
                message: "fields_data has invalid JSON."
            }];
        }

        // Fetch form's config data
        const [formConfigError, formConfigData] = await workforceFormMappingSelect(request);

        if (formConfigError !== false || formConfigData.length === 0) {
            return [true, {
                message: `Couldn't fetch form data for form ${request.form_id}.`
            }];
        }
        request.form_activity_type_id = formConfigData[0].form_workflow_activity_type_id;

        for (const formField of fieldDefinitions) {
            let fieldName = (typeof formField.label == 'undefined') ? formField.title : formField.label;
            let fieldDescription = (typeof formField.description == 'undefined') ? '' : formField.description;
            let fieldMandatoryEnabled = (typeof formField.validate == 'undefined') ? 0 : (formField.validate.required == true ? 1 : 0);
            let nextFieldId = (typeof formField.next_field_id == 'undefined') ? 0 : Number(formField.next_field_id);
            let fieldSequenceId = Number(formField.sequence_id);
            let fieldValueEditEnabled = (typeof formField.field_value_edit_enabled == 'undefined') ? 1 : Number(formField.field_value_edit_enabled);
            let inlineData = (typeof formField.inline_data == 'undefined') ? '{}' : JSON.stringify(formField.inline_data);
            let fieldPreviewEnabled = (typeof formField.field_preview_enabled == 'undefined') ? 0 : Number(formField.field_preview_enabled);

            //console.log('typeof inlineData : ', typeof inlineData);

            let dataTypeCategoryId = Number(formField.dataTypeCategoryId);
            let dataTypeId = Number(formField.dataTypeId);

            console.log('\x1b[36m\n\n%s\x1b[0m', 'fieldSequenceId: ', fieldSequenceId);
            console.log('\x1b[36m\n\n%s\x1b[0m', 'dataTypeCategoryId: ', dataTypeCategoryId);

            if (dataTypeCategoryId === 14 || dataTypeCategoryId === 15) {
                // For Single Select Component and 
                let fieldId = formField.field_id || 0,
                    comboEntries = formField.data.values;

                // if (dataTypeCategoryId === 14 || dataTypeCategoryId === 15) {
                //     fieldId = request.field_id || 0;
                //     comboEntries = formField.data.values;
                // }
                console.log("comboEntries: ", comboEntries);
                console.log("fieldId: ", fieldId);
                

                for (const [index, comboEntry] of Array.from(comboEntries).entries()) {

                    let isDuplicateEntry = false;
                    await workforceFormFieldMappingInsert(request, {
                            field_id: fieldId,
                            field_name: fieldName,
                            field_description: fieldDescription,
                            inline_data: inlineData,
                            field_sequence_id: fieldSequenceId,
                            field_mandatory_enabled: fieldMandatoryEnabled,
                            field_preview_enabled: fieldPreviewEnabled, // THIS NEEDS WORK
                            field_value_edit_enabled: fieldValueEditEnabled,
                            data_type_combo_id: comboEntry.dataTypeComboId,
                            data_type_combo_value: comboEntry.label,
                            data_type_id: Number(formField.dataTypeId) || Number(formField.datatypeid),
                            next_field_id: nextFieldId
                        })
                        .then((fieldData) => {
                            formName = fieldData[0].form_name;
                            fieldIDForBotCreation = Number(fieldData[0].p_field_id);
                            // console.log("someData: ", someData)
                            if (fieldId === 0) {
                                fieldId = Number(fieldData[0].p_field_id);
                            }
                        })
                        .catch((error) => {
                            // Do nothing
                            console.log("comboEntry | Error: ", Object.keys(error));
                            if (error.code === "ER_DUP_ENTRY") {

                            }
                            isDuplicateEntry = true;
                        });

                    if (isDuplicateEntry) {
                        await workforceFormFieldMappingUpdateCombo(request, {
                            field_id: fieldId,
                            field_name: fieldName,
                            field_description: fieldDescription,
                            field_sequence_id: fieldSequenceId,
                            field_mandatory_enabled: fieldMandatoryEnabled,
                            field_preview_enabled: fieldPreviewEnabled, // THIS NEEDS WORK
                            data_type_combo_id: comboEntry.dataTypeComboId,
                            data_type_combo_value: comboEntry.label,
                            data_type_id: Number(formField.dataTypeId) || Number(formField.datatypeid),
                            next_field_id: nextFieldId,
                            log_state: 2
                        });
                    }
                    // History insert in the workforce_form_field_mapping_history_insert table
                    await workforceFormFieldMappingHistoryInsert(request, {
                            field_id: fieldId,
                            data_type_combo_id: comboEntry.dataTypeComboId
                        })
                        .catch((error) => {
                            // Do nothing
                            // console.log(Object.keys(error));
                        });
                }
                if(comboEntries.length===0 && Number(formField.dataTypeId) !==33&&Number(formField.dataTypeId)!==34){
                await workforceFormFieldMappingInsert(request, {
                    field_id: fieldId,
                    field_name: fieldName,
                    field_description: fieldDescription,
                    inline_data: inlineData,
                    field_sequence_id: fieldSequenceId,
                    field_mandatory_enabled: fieldMandatoryEnabled,
                    field_preview_enabled: fieldPreviewEnabled, // THIS NEEDS WORK
                    field_value_edit_enabled: fieldValueEditEnabled,
                    data_type_combo_id: 0,
                    data_type_combo_value: '',
                    data_type_id: Number(formField.dataTypeId) || Number(formField.datatypeid),
                    next_field_id: nextFieldId
                })
                .then(async (fieldData) => {
                    formName = fieldData[0].form_name;
                    fieldIDForBotCreation = Number(fieldData[0].p_field_id);
                    // console.log("someData: ", someData)
                    // History insert in the workforce_form_field_mapping_history_insert table
                    await workforceFormFieldMappingHistoryInsert(request, {
                            field_id: Number(fieldData[0].p_field_id),
                            data_type_combo_id: 0
                        })
                        .catch((error) => {
                            // Do nothing
                        });
                })
                .catch((error) => {
                    // Do nothing
                });
            }

                // Reset fieldId to 0, so it can be re-used by other fields
                // in the subsequent iterations
                fieldId = 0;

            } else {

                await workforceFormFieldMappingInsert(request, {
                        field_id: 0,
                        field_name: fieldName,
                        field_description: fieldDescription,
                        inline_data: inlineData,
                        field_sequence_id: fieldSequenceId,
                        field_mandatory_enabled: fieldMandatoryEnabled,
                        field_preview_enabled: fieldPreviewEnabled, // THIS NEEDS WORK
                        field_value_edit_enabled: fieldValueEditEnabled,
                        data_type_combo_id: 0,
                        data_type_combo_value: '',
                        data_type_id: Number(formField.dataTypeId) || Number(formField.datatypeid),
                        next_field_id: nextFieldId
                    })
                    .then(async (fieldData) => {
                        formName = fieldData[0].form_name;
                        fieldIDForBotCreation = Number(fieldData[0].p_field_id);
                        // console.log("someData: ", someData)
                        // History insert in the workforce_form_field_mapping_history_insert table
                        await workforceFormFieldMappingHistoryInsert(request, {
                                field_id: Number(fieldData[0].p_field_id),
                                data_type_combo_id: 0
                            })
                            .catch((error) => {
                                // Do nothing
                            });
                    })
                    .catch((error) => {
                        // Do nothing
                    });
            }

            // Listener  
            // To create a bot for every workflow reference with type constraint datatype added in forms
            // To create a bot for every single selection datatype added in forms
            request.form_name = formName;
            console.log('data type id',dataTypeId)
            switch (dataTypeId) {
                case 57: if (inlineData !== '{}') {
                    let newInlineData = JSON.parse(inlineData);
                    console.log('newInlineDAta : ', newInlineData);
                    let key = Object.keys(newInlineData);
                    if (key[0] === 'workflow_reference_restriction') {
                        if (Number(newInlineData.workflow_reference_restriction.activity_type_id) > 0) {
                            // Create a Bot
                            await createBot(request, newInlineData, {
                                dataTypeId,
                                fieldName,
                                fieldIdforBotCreation: fieldIDForBotCreation
                            });
                        }
                    } else if (key[0] === 'asset_reference_restriction') {
                        //
                    }
                }
                    break;
                case 33: await createBot(request, {}, {
                    dataTypeId,
                    fieldName,
                    fieldIdforBotCreation: fieldIDForBotCreation
                });
                    break;
                case 62: await createBot(request, {}, {
                    dataTypeId,
                    fieldName: '',
                    fieldIdforBotCreation: fieldIDForBotCreation
                });
                    break;
                default: break;
            }

            fieldSequenceId++;
        }

        return [false, []]
    }

    async function workforceFormFieldMappingUpdateCombo(request, fieldOptions) {
        // IN p_field_id BIGINT(20), IN p_data_type_combo_id SMALLINT(6), 
        // IN p_form_id BIGINT(20), IN p_field_name VARCHAR(1200), 
        // IN p_field_description VARCHAR(300), IN p_data_type_combo_value VARCHAR(1200), 
        // IN p_field_sequence_id BIGINT(20), IN p_field_mandatory_enabled TINYINT(4), 
        // IN p_field_preview_enabled TINYINT(4), IN p_log_state TINYINT(4), 
        // IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let updateStatus = [],
            error = true; // true;

        let procName = 'ds_p1_workforce_form_field_mapping_update_combo';
        let paramsArr = new Array(
            fieldOptions.field_id,
            fieldOptions.data_type_combo_id,
            request.form_id,
            fieldOptions.field_name,
            fieldOptions.field_description,
            fieldOptions.data_type_combo_value,
            fieldOptions.field_sequence_id,
            fieldOptions.field_mandatory_enabled,
            fieldOptions.field_preview_enabled,
            fieldOptions.log_state,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime(),
        );
        // const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_update_combo', paramsArr);
        // console.log(queryString);
        await db.callDBProcedure(request, procName, paramsArr, 0)
            .then((data) => {
                updateStatus = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            });
        return [error, updateStatus];
    }

    this.formFieldBotList = async function (request) {

        let botsListData = [],
            error = true; // true;

        request.flag = 5;
        request.page_start = request.page_start || 0;
        try {
            botsListData = await activityCommonService.getBotsMappedToActType(request);
            error = false;
        } catch (err) {
            error = err;
        }

        return [error, botsListData];
    }

    this.formFieldWidgetList = async function (request) {

        let widgetListData = [],
            error = true; // true;

        try {
            widgetListData = await activityCommonService.widgetListSelectFieldAll(request);
            error = false;
        } catch (err) {
            console.log("formFieldWidgetList | Error: ", err);
            error = err;
        }

        return [error, widgetListData];
    }

    async function widgetListSelectFieldAll(request) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20), 
        // IN p_form_id BIGINT(20), IN p_field_id BIGINT(20), 
        // IN p_start_from INT(11), IN p_limit_value TINYINT(4)

        let widgetListData = [],
            error = true; // true;

        let procName = 'ds_p1_widget_list_select_field_all';
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.form_id,
            request.field_id,
            request.start_from || 0,
            request.limit_value || 50
        );
        await db.callDBProcedure(request, procName, paramsArr, 0)
            .then((data) => {
                widgetListData = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            });
        return [error, widgetListData];
    }

    this.getDataTypeList = function (request) {
        return new Promise((resolve, reject) => {
            let queryString = '';

            let paramsArr = new Array(
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );
            queryString = util.getQueryString('ds_v1_common_data_type_master_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }

        })
    }

    this.workforceFormFieldMappingSelectNumericFields = async function (request) {

        let fieldData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_select_numeric', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    fieldData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }

        return [error, fieldData];
    }

    this.formFieldBotWidgetList = async function (request) {

        let botListData = [],
            error = true,
            fieldId,
            responseObject = {}; // true;

        try {
            fieldId = JSON.parse(request.field_id)
        } catch (err) {
            console.log("Invalid JSON, while parsing the field_id: ", err)
            return [error, botListData];
        }

        // console.log("fieldId: ", fieldId)

        request.flag = 5;
        request.page_start = request.page_start || 0;

        if (Array.isArray(fieldId) === true) {
            console.log("An Array!")

            for (const field of fieldId) {
                responseObject[`${field}`] = {};
                responseObject[`${field}`].bots = [];
                responseObject[`${field}`].widgets = [];

                try {
                    let newRequest = Object.assign({}, request);
                    newRequest.field_id = field;
                    botListData = await activityCommonService.getBotsMappedToActType(newRequest);
                    responseObject[`${field}`].bots = formatBotListData(botListData);

                    widgetListData = await activityCommonService.widgetListSelectFieldAll(newRequest);
                    responseObject[`${field}`].widgets = formatWidgetListData(widgetListData);
                    error = false;
                } catch (error) {
                    error = err;
                }
            }
        } else {
            // Single field_id query
            try {
                responseObject[`${fieldId}`] = {};
                responseObject[`${fieldId}`].bots = [];
                responseObject[`${fieldId}`].widgets = [];

                botListData = await activityCommonService.getBotsMappedToActType(request);
                responseObject[`${fieldId}`].bots = formatBotListData(botListData);

                widgetListData = await activityCommonService.widgetListSelectFieldAll(request);
                responseObject[`${fieldId}`].widgets = formatWidgetListData(widgetListData);
                error = false;
            } catch (err) {
                error = err;
            }
        }
        return [error, responseObject];
    }

    function formatBotListData(botListData) {
        let updatedData = [];
        botListData.forEach(element => {
            updatedData.push({
                bot_id: element.bot_id,
                bot_name: String(element.bot_name).trim(),
                bot_trigger_name: String(element.bot_trigger_name).trim()
            });
        });
        return updatedData;
    }

    function formatWidgetListData(widgetListData) {
        let updatedData = [];
        widgetListData.forEach(element => {
            updatedData.push({
                widget_id: element.widget_id,
                widget_name: String(element.widget_name).trim(),
                widget_aggregate_name: String(element.widget_aggregate_name).trim(),
                widget_chart_name: String(element.widget_chart_name).trim()
            });
        });
        return updatedData;
    }

    this.alterFormActivityFieldValues = async function (request) {
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
        const [formConfigError, formConfigData] = await workforceFormMappingSelect({
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            form_id: request.form_id
        });
        if (!formConfigError && formConfigData.length > 0) {
            formName = formConfigData[0].form_name;
        }
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

                    // formName = fieldsNewValuesMap.get(fieldID).form_name;
                    let fieldName = fieldsNewValuesMap.get(fieldID).field_name;
                    // Update the activity inline data as well
                    let simpleDataTypes = [1,2,3,7,8,9,10,14,15,19,21,22];
                    let excludeDataTypeIds = [77,64]
                    if (activityInlineDataMap.has(fieldID)) {
                        let oldFieldEntry = activityInlineDataMap.get(fieldID);
                        let newFieldEntry = Object.assign({}, oldFieldEntry);
                        newFieldEntry.field_value = fieldsNewValuesMap.get(fieldID).field_value;
                        // Set the new value in the inline data map
                        activityInlineDataMap.set(fieldID, newFieldEntry);

                        // Form the content string
                        if(simpleDataTypes.includes(newFieldEntry.field_data_type_id))                         
                        content += `In the ${formName}, the field ${fieldName} was updated from ${oldFieldEntry.field_value} to ${newFieldEntry.field_value} <br />`;
                        else
                        content += `In the ${formName}, the field ${fieldName} was updated <br />`;
                        // content += `In the ${formName}, the field ${fieldName} was updated from ${oldFieldEntry.field_value} to ${newFieldEntry.field_value} <br />`;;
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
                //global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                util.logError(request,`debug Error in queueWrapper raiseActivityEvent: %j`, {error : JSON.stringify(err), err, request });
                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                //global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                util.logError(request,`debug Error in queueWrapper raiseActivityEvent:  %j`, {error : JSON.stringify(err), err, request });
                //global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                util.logInfo(request,`debug Response from queueWrapper raiseActivityEvent: %j`,{Response : JSON.stringify(resp), resp, request});
                
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


   async function widgetAggrFieldValueUpdate(request) {

        let fieldUpdateStatus = [],
            error = false; // true;

        let paramsArr = new Array(
            request.workflow_activity_id,
            request.form_id,
            request.field_id,
            request.field_value,
            request.form_transaction_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            util.getCurrentUTCTime(),
            request.flag,
            request.is_bulk_order
        );

        let temp = {};
        let newReq = Object.assign({}, request);
        newReq.form_activity_id = request.activity_id;
        const queryString = util.getQueryString('ds_p1_3_widget_activity_field_transaction_update_field_value', paramsArr);

        if (queryString !== '') {
            // console.log(queryString)
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {                    
                    console.log('FCS DAAAAAAAAAAAAAAATA : ', data);
                    fieldUpdateStatus = data;
                    error = false;
                    
                    if(data.length > 0) {
                        newReq.widget_id = data[0].widget_id;
                    }
                    temp.data = data;
                    newReq.inline_data = temp;
                    if (Number(newReq.widget_id) > 0) {
                        activityCommonService.widgetLogTrx(newReq, 1);
                    }
                })
                .catch((err) => {
                    console.log('FCS ERRRRRRRRRRRRRRROR : ', err);                    
                    temp.err = err;
                    newReq.inline_data = temp;
                    error = err;
                    if (Number(newReq.widget_id) > 0) {
                        activityCommonService.widgetLogTrx(newReq, 2);
                    }
                });
        }

        return [error, fieldUpdateStatus];
    }


    this.formEntityMappingSelect = async function (request) {

        let fieldData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id,
            request.flag,
            request.datetime,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_form_entity_mapping_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    fieldData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, fieldData];
    };

    this.formEntityMappingSelectV1 = async function (request) {

        let fieldData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id,
            request.flag,
            request.datetime,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_form_entity_mapping_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    fieldData = data;
                    const [err, globalFormData] = await this.getGlobalForms(request);
                    if(err === false) {
                        //console.log('globalFormData : ', globalFormData);
                        Array.prototype.push.apply(fieldData,globalFormData); 
                    }
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, fieldData];
    };

    this.workforceFormFieldMappingSelectForm = async function (request) {

        let formFieldData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id,
            request.datetime,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    if (data.length > 0) {
                        //console.log(data);
                        formatFromsListing(-1, data, function (err, finalData) {
                            if (err === false) {
                                formFieldData = finalData;
                                error = false;
                            }
                        });
                    }else{                        
                        error = false;
                    }
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, formFieldData];
    };

    this.formEntityAccessCheck = async function (request) {

        let fieldData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id,
            request.target_asset_id,
            request.form_id,
            request.flag
        );
        const queryString = util.getQueryString('ds_p1_form_entity_mapping_select_check', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    fieldData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, fieldData];
    };

   async function widgetAggrFieldValueUpdateWorkflow(request) {

        let fieldUpdateStatus = [],
            error = false; // true;

        let paramsArr = new Array(
            request.workflow_activity_id,
            request.form_id,
            request.field_id,
            request.field_value,
            request.form_transaction_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            util.getCurrentUTCTime(),
            request.flag
        );

        let temp = {};
        let newReq = Object.assign({}, request);
        newReq.form_activity_id = request.activity_id;
        const queryString = util.getQueryString('ds_p1_widget_activity_field_transaction_update_fld_workflow', paramsArr);

        if (queryString !== '') {
            // console.log(queryString)
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {                    
                    console.log('FCS DAAAAAAAAAAAAAAATA : ', data);
                    fieldUpdateStatus = data;
                    error = false;
                    
                    if(data.length > 0) {
                        newReq.widget_id = data[0].widget_id;
                    }
                    temp.data = data;
                    newReq.inline_data = temp;
                    if (Number(newReq.widget_id) > 0) {
                        activityCommonService.widgetLogTrx(newReq, 1);
                    }
                })
                .catch((err) => {
                    console.log('FCS ERRRRRRRRRRRRRRROR : ', err);                    
                    temp.err = err;
                    newReq.inline_data = temp;
                    error = err;
                    if (Number(newReq.widget_id) > 0) {
                        activityCommonService.widgetLogTrx(newReq, 2);
                    }
                });
        }

        return [error, fieldUpdateStatus];
    }


    this.formEntityAccessAssetCheck = async function(request) {        
        let error = false;
        let formsArr = JSON.parse(JSON.stringify(request.forms));
        //let formsArr = JSON.parse(request.forms);
        let refinedForms = [];

        if(Number(request.workforce_id) === 5403 || 
            Number(request.workforce_id == 5404) || 
            Number(request.workforce_id) == 5648
            ){ 
                return [error, formsArr];
        }

        for(let i of formsArr) {
            //console.log(i.form_id);            
            request.form_id = i.id;
            let [err, formFieldData] = await self.formEntityAccessCheck(request);
            if(!err) {
                if(formFieldData.length > 0) {                    
                    refinedForms.push(i);
                }            
            }            
        }        

        return [error, refinedForms];
    };

    
    // Update Workflow values in Activity_List for Workflow Form
    async function addValueToWidgetForAnalyticsWF(requestObj, workflowActivityId, workflowActivityTypeID, flag) {
        let request = Object.assign({}, requestObj);

        let [err, inlineData] = await activityCommonService.getWorkflowFieldsBasedonActTypeId(request, workflowActivityTypeID);
        if (err || inlineData.length === 0) {
            console.log("addValueToWidgetForAnalyticsWF :: error in getting Inline Data");
            return err;
        }

        //console.log('inlineData : ', inlineData[0]);        
        console.log('inlineData[0].activity_type_inline_data : ', inlineData[0].activity_type_inline_data);
        
        if(inlineData[0].activity_type_inline_data === null) {
            console.log("addValueToWidgetForAnalyticsWF :: inline data is null");
            return "";
        }

        let finalInlineData = JSON.parse(inlineData[0].activity_type_inline_data);

        console.log('addValueToWidgetForAnalyticsWF :: finalInlineData.hasOwnProperty(workflow_fields) : '+ finalInlineData.hasOwnProperty('workflow_fields'));

        if (finalInlineData.hasOwnProperty('workflow_fields')) {
            let i, fieldId;
            let workflowFields = finalInlineData.workflow_fields;
            let activityInlineData = JSON.parse(request.activity_inline_data);

            console.log('workflowFields : '+ workflowFields);
            console.log('activityInlineData : '+request.activity_inline_data);
            console.log('activityInlineData.length : '+ activityInlineData.length);

            let finalValue = 0;
            let flagExecuteFinalValue = 0;
            for (i = 0; i < activityInlineData.length; i++) {
                for (fieldId in workflowFields) {
                    if (fieldId === activityInlineData[i].field_id) {
                        const fieldValue = await getFieldValueByDataTypeID(
                            Number(activityInlineData[i].field_data_type_id),
                            activityInlineData[i].field_value
                        );
                        console.log('addValueToWidgetForAnalyticsWF :: workflowFields[fieldId].sequence_id :: fieldValue :: '+fieldValue);
                        await activityCommonService.analyticsUpdateWidgetValue(request,
                            workflowActivityId,
                            workflowFields[fieldId].sequence_id,
                            fieldValue);

                        flagExecuteFinalValue = 1;
                        finalValue += Number(fieldValue);
                        break;
                    }
                }
            }

            if (flag === 1 && flagExecuteFinalValue === 1) {
                await activityCommonService.analyticsUpdateWidgetValue(request,
                    workflowActivityId,
                    6,
                    finalValue);
            }
        }

        return "success";
    }

    function getFieldValueByDataTypeID(fieldDataTypeID, fieldValue) {
        switch (fieldDataTypeID) {
            case 62: // Credit/Debit Data Type
                fieldValue = (typeof fieldValue === 'string') ? JSON.parse(fieldValue) : fieldValue;
                const transactionTypeID = Number(fieldValue.transaction_data.transaction_type_id),
                    // ledgerActivityID = Number(fieldValue.transaction_data.activity_id),
                    transactionAmount = Number(fieldValue.transaction_data.transaction_amount);
                if (transactionTypeID === 1) {
                    return Number(transactionAmount);
                } else if (transactionTypeID === 2) {
                    return -Number(transactionAmount);
                }
            case 18: // money data type
                fieldValue = (typeof fieldValue === 'string') ? JSON.parse(fieldValue) : fieldValue;
                return(fieldValue.value)
            default:
                return Number(fieldValue);
        }
    }
    
    //Update Workflow values in Activity_List for all non-origin Forms - field edits
    async function addValueToWidgetForAnalytics(requestObj) {
        let request = Object.assign({}, requestObj);

        let [err, workflowData] = await fetchReferredFormActivityIdAsync(request, request.activity_id, request.form_transaction_id, request.form_id);
        //console.log('workflowData : ', workflowData);
        if(err || workflowData.length === 0) {
            return err;
        }
        try {
            const workflowActivityId = Number(workflowData[0].activity_id);
            const workflowActivityTypeID = Number(workflowData[0].activity_type_id);
            console.log("workflowActivityId: ", workflowActivityId);
            console.log("workflowActivityTypeID: ", workflowActivityTypeID);        
    
            let [err1, inlineData] = await activityCommonService.getWorkflowFieldsBasedonActTypeId(request, workflowActivityTypeID);
            if(err1 || inlineData.length === 0) {
                return err1;
            }
            
            //console.log('inlineData : ', inlineData[0]);
            console.log('inlineData.activity_type_inline_data : ', inlineData[0].activity_type_inline_data);
            
            let finalInlineData = JSON.parse(inlineData[0].activity_type_inline_data);
            console.log('finalInlineData.hasOwnProperty(workflow_fields) : ', finalInlineData.hasOwnProperty('workflow_fields'));
            if(finalInlineData.hasOwnProperty('workflow_fields')) {
                    let workflowFields = finalInlineData.workflow_fields;
                    for(let fieldId in workflowFields){                    
                        if(fieldId == request.field_id) {
                            //console.log('fieldId : ', fieldId);
                            //console.log('workflowFields[fieldId].sequence_id : ', workflowFields[fieldId].sequence_id);
                            await activityCommonService.analyticsUpdateWidgetValue(request, 
                                                                                workflowActivityId, 
                                                                                workflowFields[fieldId].sequence_id, 
                                                                                request.new_field_value
                                                                                );
                            break;
                        }
                    }
                }
    
            return "success";
        }
        catch (error) {
            return error;
        }
      
    }

    function isObject(arg) {
        return arg !== null && typeof arg === 'object';
    }

    this.formEntityMappingSelectForm = async function (request) {

        let workforceData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id,
            request.flag,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_v1_form_entity_mapping_select_form', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    workforceData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }

        return [error, workforceData];
    } 
    
    this.removeWorkforceAccess = async function(request){
        let error = true;
        let responseData = "Successfully removed access";
        let [err, data] = await formEntityMappingRemove(request);
        if(err){
        responseData = "Error removing access"
        }
        else{
            error= false;
        }
       return [error,responseData]
    }

    this.setMultipleWorkforceAccess =
        async (request) => {
            try {
                let targetWorkforceInline = JSON.parse(request.target_workforces);
                for (let counter = 0; counter < targetWorkforceInline.length; counter++) {
                    request.workforce_id = targetWorkforceInline[counter].target_workforce_id;
                    request.account_id = targetWorkforceInline[counter].target_account_id;
                    let [err, formFieldData] = await self.formEntityAccessCheck(request);
                    console.log("formFieldData :: " + formFieldData.length);
                    if (formFieldData.length === 0)
                        await formEntityMappingInsert(request, request.form_id, 3);
                }

                const targetAssetsArray = JSON.parse(request.target_assets || '[]');
                for (const targetAssetData of targetAssetsArray) {
                    let [err, formEntityData] = await self.formEntityAccessCheck({
                        ...request,
                        target_asset_id: targetAssetData.asset_id,
                        workforce_id: targetAssetData.workforce_id,
                        account_id: targetAssetData.account_id,
                    });
                    if (formEntityData.length === 0) {
                        await formEntityMappingInsert({
                            ...request,
                            asset_id: targetAssetData.asset_id,
                            workforce_id: targetAssetData.workforce_id,
                            account_id: targetAssetData.account_id,
                            log_asset_id: request.asset_id
                        }, request.form_id, 6);
                    }
                }
            } catch (error) {
                return Promise.reject(error);
            }
        };

    async function createBot(request, newInlineData, fieldData) {
        let botInlineData = [];
        let botOperations = {};
        let tempObj = {};

        let newRequest = Object.assign({}, request);
        newRequest.bot_level_id = 1;
        newRequest.bot_trigger_id = 1;
        newRequest.field_id = fieldData.fieldIdforBotCreation;
        newRequest.activity_status_id = 0;
        newRequest.log_asset_id = request.asset_id;
        newRequest.log_datetime = util.getCurrentUTCTime();

        switch (fieldData.dataTypeId) {
            case 57: let refActDataType = {};
                refActDataType.form_id = request.form_id;
                refActDataType.field_id = fieldData.fieldIdforBotCreation;
                refActDataType.field_id_label = fieldData.fieldName;
                refActDataType.activity_flag_due_date_impact = Number(newInlineData.workflow_reference_restriction.activity_flag_due_date_impact);

                let wfRefCumulation = {};
                wfRefCumulation.reference_activity_datatype = refActDataType;

                botOperations.workflow_reference_cumulation = wfRefCumulation;

                tempObj.bot_operations = botOperations;
                botInlineData.push(tempObj);

                newRequest.bot_inline_data = JSON.stringify(botInlineData);
                newRequest.bot_name = request.form_name + " - WF Ref Bot - " + util.getCurrentUTCTime();
                //newRequest.activity_type_id = Number(newInlineData.workflow_reference_restriction.activity_type_id);
                newRequest.activity_type_id = Number(request.form_activity_type_id) || 0;
                newRequest.bot_operation_type_id = 16;
                break;

            case 33: let singleSelectionDataType = {};
                singleSelectionDataType.form_id = request.form_id;
                singleSelectionDataType.field_id = fieldData.fieldIdforBotCreation;
                singleSelectionDataType.field_id_label = fieldData.fieldName;

                let singleSelectionCumulation = {};
                singleSelectionCumulation.single_selection_datatype = singleSelectionDataType;

                botOperations.single_selection_cumulation = singleSelectionCumulation;

                tempObj.bot_operations = botOperations;
                botInlineData.push(tempObj);

                newRequest.bot_inline_data = JSON.stringify(botInlineData);
                newRequest.bot_name = request.form_name + " - SS Bot - " + util.getCurrentUTCTime();
                newRequest.activity_type_id = Number(request.form_activity_type_id) || 0;
                newRequest.bot_operation_type_id = 17;
                newRequest.field_id = fieldData.fieldIdforBotCreation;

                break;
            case 62:            
                tempObj.bot_operations = {};
                botInlineData.push(tempObj);

                newRequest.bot_inline_data = JSON.stringify(botInlineData);
                newRequest.bot_name = request.form_name + " - LTS - " + util.getCurrentUTCTime();
                newRequest.activity_type_id = Number(request.form_activity_type_id) || 0;
                newRequest.bot_operation_type_id = 14; 
                newRequest.field_id = fieldData.fieldIdforBotCreation;           
                break;
        }

        try {
            // Check for duplicate bot creation
            const [_, botOperationData] = await botService.botOperationMappingSelectOperationType({
                ...request,
                bot_operation_type_id: newRequest.bot_operation_type_id,
                form_id: request.form_id,
                field_id: newRequest.field_id
            });
            if (botOperationData.length > 0) {
                // Do no create the bot, return
                return "";
            }

            let botData = await botService.addBot(newRequest);
            console.log('botData : ', botData[0].bot_id);

            // Create a Bot Workflow Step
            newRequest.bot_id = botData[0].bot_id;
            newRequest.data_type_combo_id = 0;
            newRequest.bot_operation_inline_data = JSON.stringify(tempObj);
            newRequest.bot_operation_sequence_id = 1;
            await botService.addBotWorkflowStep(newRequest);
        } catch (err) {
            console.log(err);
        }
        return "success";
    }

    //update the Intermediate tables - For workflow Reference, Combo Field data types
    async function fireBotUpdateIntTables(request, fieldData) {
        const [workflowError, workflowData] = await fetchReferredFormActivityIdAsync(request, request.activity_id, request.form_transaction_id, request.form_id);
        if (workflowError !== false || workflowData.length === 0) {
            util.logError(request,`[fireBotUpdateIntTables] couldn't find workflow`);
            return [workflowError, workflowData];
        }
        let workflowActivityId = Number(workflowData[0].activity_id);
        
        let botIsDefined = 0;

        let botEngineRequest = Object.assign({}, request);
        botEngineRequest.form_id = Number(fieldData.form_id);
        botEngineRequest.field_id = Number(fieldData.field_id);
        botEngineRequest.flag = 5;

        try {
            let botsListData = await activityCommonService.getBotsMappedToActType(botEngineRequest);
            if (botsListData.length > 0) {
                botEngineRequest.bot_id = botsListData[0].bot_id;
                let botOperationsData = await activityCommonService.getBotworkflowSteps(botEngineRequest);
                botEngineRequest.bot_operation_id = botOperationsData[0].bot_operation_id;                
                botIsDefined = 1;
            }
        } catch (botInitError) {
            util.logError(request,`formtransactioniderror`, { type: 'formtransactioniderror', error: serializeError(botInitError) });
        }

        let newRequest = Object.assign({}, request);
        newRequest.activity_id = workflowActivityId;
        newRequest.form_transaction_id = fieldData.form_transaction_id;
        newRequest.field_id = fieldData.field_id;
        newRequest.data_type_combo_id = fieldData.data_type_combo_id;
        newRequest.bot_operation_id = botEngineRequest.bot_operation_id;
        newRequest.mapping_activity_id = 0;
        newRequest.log_asset_id = request.asset_id;
        newRequest.log_datetime = util.getCurrentUTCTime();

        util.logInfo(request,`botIsDefined %j`, botIsDefined);

        if (botIsDefined === 1) {
            switch (Number(fieldData.field_data_type_id)) {
                //Workflow Reference
                case 57://let fieldValue = fieldData.field_value.split('|'); 
                        //newRequest.mapping_activity_id = fieldValue[0];
                        //await activityCommonService.activityEntityMappingUpdateWfValue(newRequest, 1); //1 - activity_entity_mapping

                        let fieldValue = fieldData.field_value;
                        let parsedFieldValue;
                        let mappingActivityId;
                        let multiWorkflowReferenceFlag = 1;

                        try{
                            parsedFieldValue = JSON.parse(fieldValue);
                        } catch(err) {
                            util.logError(request,`Error in parsing workflow reference datatype : `, { type: 'fireBotUpdateIntTables', error: serializeError(err) });
                            util.logInfo(request,`Switching to backward compatibility parsedFieldValue: %j`,parsedFieldValue);
                            
                            //Backward Compatibility "workflowactivityid|workflowactivitytitle"
                            mappingActivityId = fieldData.field_value.split('|');
                            newRequest.mapping_activity_id = mappingActivityId[0];
                            await activityCommonService.activityEntityMappingUpdateWfValue(newRequest, 1); //1 - activity_entity_mapping
                            multiWorkflowReferenceFlag = 0;
                        }                     
    
                        if(Number(multiWorkflowReferenceFlag) === 1) {
                            for(let i = 0; i < parsedFieldValue.length; i++) {
                                newRequest.mapping_activity_id = parsedFieldValue[i].workflow_activity_id;;
                                await activityCommonService.activityEntityMappingUpdateWfValue(newRequest, 1); //1 - activity_entity_mapping
                            }
                        }
                    break;

                //Combo field
                case 33: await activityCommonService.activityFormFieldMappingUpdateWfValue(newRequest, 2); //2 - activity_form_field_mapping
                    break;
            }
        }

        return "success";
    }   
    
    
    async function addAssetToWorkflow(request){
        let flag = 1;
        const [workflowError, workflowData] = await fetchReferredFormActivityIdAsync(request, request.activity_id, request.form_transaction_id, request.form_id);
        if (workflowError !== false || workflowData.length === 0) {
            return [workflowError, workflowData];
        }
        let workflowActivityId = Number(workflowData[0].activity_id);
        //Get the workflow activity ID        
        //Get the participants on the workflow
        //Check whether the current asset is there
        //If Yes - Do Nothing
        //If No - Then Add the asset as participant
        
        let newReq = Object.assign({}, request);
            newReq.activity_id = workflowActivityId;
            newReq.datetime_differential = "1970-01-01 00:00:00";
            newReq.page_start = 0;

        participantService.getParticipantsList(newReq, async (err, resp)=>{

            let participantData = resp.data;
            util.logInfo(request,`********* participantData :  %j`,participantData);

            for(let i = 0; i<participantData.length; i++) {
                if(Number(participantData[i].asset_id) === Number(request.asset_id)) {
                    flag = 0;
                }
            }

            util.logInfo(request,`FLAG :  %j`,flag);
            if(flag === 1) {
                
                //Add the asset as participant
                const [err, assetData] = await activityCommonService.getAssetDetailsAsync(request); 
                if(err) {
                    return "failure";
                }

                if(assetData.length > 0) {
                    let participantCollection = [];
                
                    let temp = {};
                        temp.asset_id = assetData[0].asset_id;
                        temp.organization_id = request.organization_id;
                        temp.account_id = request.account_id;
                        temp.workforce_id = request.workforce_id;
                        temp.access_role_id = 1;
                        temp.message_unique_id = util.getMessageUniqueId(assetData[0].asset_id);
                        temp.asset_first_name =  assetData[0].asset_first_name;
                        temp.operating_asset_first_name = assetData[0].operating_asset_first_name;
                        temp.workforce_name = assetData[0].workforce_name;
                        temp.asset_type_id = assetData[0].asset_type_id;
                        temp.asset_category_id = 1;

                    participantCollection.push(temp);

                    let addPartipantReq = Object.assign({}, newReq);
                        addPartipantReq.activity_type_category_id = 48;
                        addPartipantReq.activity_type_id = Number(workflowData[0].activity_type_id);
                        addPartipantReq.activity_participant_collection = JSON.stringify(participantCollection);
                        addPartipantReq.message_unique_id = util.getMessageUniqueId(assetData[0].asset_id);

                    participantService.assignCoworker(addPartipantReq, ()=>{});
                }
            }

            return "success";
        });
    }

    //Get the Global Forms of an organization
    this.getGlobalForms = async function(request) {
        let responseData = [],
          error = true;
  
        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.flag || 0,
            request.start_from || 0,
            request.limit_value || request.page_limit
        );

        const queryString = util.getQueryString("ds_v1_workforce_form_mapping_select_global_forms",paramsArr);        
    
        if (queryString !== "") {
          await db
            .executeQueryPromise(1, queryString, request)
            .then(data => {
              responseData = data;
              error = false;
            })
            .catch(err => {
              error = err;
            });
        }
        return [error, responseData];
      };


    //Delete a form from form_entity_mapping
    async function formEntityMappingDelete(request){
        let responseData = [],
          error = true;
  
        const paramsArr = new Array(
            0, //request.workforce_id,
            0, //request.account_id,
            request.organization_id,
            Number(request.form_id),
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString("ds_p1_form_entity_mapping_delete",paramsArr);        
    
        if (queryString !== "") {
          await db
            .executeQueryPromise(0, queryString, request)
            .then(data => {
              responseData = data;
              error = false;
            })
            .catch(err => {              
                error = err;
            });
        }
        return [error, responseData];
      }

    //
    this.getFormFieldsCount = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_select_form_field_count', paramsArr);

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

    // Insert field history of a particular field and form
    this.insertFormFieldsHistory = async function(request) {

        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.form_transaction_id,
            request.form_id,
            request.field_id
        );
        const queryString = util.getQueryString('ds_p1_activity_form_transaction_select_trans_field_history', paramsArr);

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

    this.insertFormFieldsHistoryV1 = async function(request) {

        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.organization_id,
            request.form_transaction_id,
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


    this.getStatusBasedForms = async (request) => {
        let responseData = [],
            error = true, 
            statusData = [],
            statusError = true;

        if(Number(request.workforce_id) === 5403 || 
            Number(request.workforce_id == 5404) || 
            Number(request.workforce_id) == 5648
            ){ 
                [statusError, statusData] = await activityCommonService.getAssetTypeIDForAStatusID(request, request.activity_status_id);
                console.log('statusData.length : ', statusData.length);
                request.activity_type_id = (statusData.length > 0) ? statusData[0].activity_type_id : 0;
                
                let newReq = Object.assign({}, request);
                    newReq.limit_value = 50;
                    newReq.flag = 1;
                    newReq.account_id = 0;
                    newReq.workforce_id = 0;
                [error, responseData] = await workforceFormMappingSelectWorkflowForms(newReq);
                        
                console.log('responseData.length in IF: ', responseData.length);

                return [error, responseData];
        }

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_status_id,
            request.start_from || 0,
            request.limit_value || 10
        );
        const queryString = util.getQueryString('ds_v1_workflow_form_status_mapping_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    /*if(request.workforce_id == 5403 || request.workforce_id == 5404 || request.workforce_id == 5648){

                        [statusError, statusData] = await activityCommonService.getAssetTypeIDForAStatusID(request, request.activity_status_id);
                        request.activity_type_id = statusData[0].activity_type_id;
                        request.target_asset_id = request.asset_id;
                        request.flag = 0;

                        //[error, responseData] = await self.formEntityAccessList(request);
                        let newReq = Object.assign({}, request);
                            newReq.limit_value = 50;
                            newReq.flag = 1;
                            newReq.account_id = 0;
                            newReq.workforce_id = 0;
                        [error, responseData] = await workforceFormMappingSelectWorkflowForms(newReq);
                        
                        console.log('responseData.length in IF: ', responseData.length);
                    }else{
                        responseData = data;
                        error = false;
                    }*/

                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.insertStatusBasedForms = async (request) => {
        let responseData = [],
            error = false;
        
        let formIds = JSON.parse(request.form_ids);
        let i;
        for(i=0;i<formIds.length; i++) {
            try{
                await insertStatusBasedForm(request, formIds[i]);
            } catch(err) {
                error = true;
            }            
        }

        return [error, responseData];
    }
    
    
    async function insertStatusBasedForm(request, formID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            formID,
            request.activity_status_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_workflow_form_status_mapping_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch(async (err) => {
                    error = err;
                    await updateStatusBasedFormLogState(request, formID);
                })
        }
        return [error, responseData];
    }
    
    this.deleteStatusBasedForms = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.form_status_mapping_id,
            request.organization_id,
            request.log_state || 3,            
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workflow_form_status_mapping_update_log_state', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {                    
                    //responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.draftFormAdd = async (request) => {
        let responseData = [],
            error = true;

        let formTransactionID = await cacheWrapper.getFormTransactionIdPromise();        
        
        const paramsArr = new Array(
            request.organization_id, 
            request.account_id, 
            request.workforce_id, 
            request.asset_id, 
            request.operating_asset_id, 
            formTransactionID, 
            request.form_draft_inline_data || '{}',
            request.form_id, 
            request.workflow_activity_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_asset_form_draft_transaction_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {                    
                    //responseData = data;
                    responseData.push({"form_transaction_id" : formTransactionID});
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.draftFormList = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,            
            request.asset_id,
            request.workflow_activity_id || 0,
            request.form_id || 0
        );
        //const queryString = util.getQueryString('ds_v1_asset_form_draft_transaction_select_asset', paramsArr);
        const queryString = util.getQueryString('ds_v1_asset_form_draft_transaction_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {  
                    for(let row of data) {
                        row.form_draft_inline_data = JSON.parse(row.form_draft_inline_data);
                    }                  
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.draftFormAlter = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,            
            request.asset_id,
            request.form_id,
            request.form_transaction_id,
            request.form_inline_data || '{}',
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_asset_form_draft_transaction_update', paramsArr);

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

    this.draftFormDelete = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,            
            request.asset_id,
            request.form_id,
            request.form_transaction_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_asset_form_draft_transaction_delete', paramsArr);

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

    
    this.getMultipleSubmissionsData = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workflow_activity_id,
            request.form_id,
            request.page_start || 0,
			util.replaceQueryLimit(request.page_limit)
        );
        const queryString = util.getQueryString('ds_v1_activity_timeline_transaction_select_activity_form', paramsArr);

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


    this.assetLevelForms = async (request) => {
        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.differential_datetime,
            request.flag,
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit)
        );
        const queryString = util.getQueryString('ds_v1_form_entity_mapping_select_asset', paramsArr);

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

    async function updateStatusBasedFormLogState(request, formID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            formID,
            request.activity_status_id,
            request.organization_id,
            request.log_state || 2,            
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_workflow_form_status_mapping_update_log_state', paramsArr);

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

    
    this.fieldAlterCheck = async (request) => {
        //Show prompt = 1
        let responseData = [],
            error = false,
            show_prompt = false,
            currentStatusSeqID,
            targetStatusSeqID;

        const [workflowError, workflowData] = await fetchReferredFormActivityIdAsync(request, request.activity_id, request.form_transaction_id, request.form_id);
        if (workflowError !== false || workflowData.length === 0) {
            return [workflowError, workflowData];
        }
        
        const workflowActivityId = Number(workflowData[0].activity_id);
        const workflowActivityTypeID = Number(workflowData[0].activity_type_id);
        
        console.log("workflowActivityId: ", workflowActivityId);
        console.log("workflowActivityTypeID: ", workflowActivityTypeID);

        //Get the workflow details of the form - especially the current status
        let activityData = await activityCommonService.getActivityDetailsPromise(request, workflowActivityId);
        let currentStatusID = activityData[0].activity_status_id;
        

        request.workflow_activity_type_id = activityData[0].activity_type_id;
        let [err, statuses] = await activityCommonService.getStatusesOfaWorkflow(request);
        console.log('statuses : ', statuses);

           
        for(let i_iterator of statuses) {
            if(Number(currentStatusID) === i_iterator.activity_status_id) {
                currentStatusSeqID = i_iterator.activity_status_sequence_id;
                break;
            }            
        }

        console.log('Current Activity Status ID : ', currentStatusID);
        console.log('currentStatusSeqID : ',currentStatusSeqID);        
        
        try {
            let [err, fieldLevelBots] = await activityCommonService.getMappedBotSteps({
                organization_id: 0,
                bot_id: 0,
                form_id: request.form_id,
                field_id: request.field_id,
                start_from: 0,
                limit_value: 50
            }, 1); 

            //console.log(fieldLevelBots);
            if (fieldLevelBots.length > 0) {
                let temp_variable;
                for(let j_iterator of fieldLevelBots) {
                    
                    console.table([{
                        bot_operation_sequence_id: j_iterator.bot_operation_sequence_id,                        
                        bot_operation_type_name: j_iterator.bot_operation_type_name,
                        form_id: j_iterator.form_id,
                        field_id: j_iterator.field_id,
                        data_type_combo_id: j_iterator.data_type_combo_id,
                        data_type_combo_name: j_iterator.data_type_combo_name
                    }]);

                    if(j_iterator.bot_operation_type_id === 2) { //alter status
                        //Check the status - Will it trigger status roll back
                        temp_variable = j_iterator.bot_operation_inline_data;
                        console.log('temp_variable : ', temp_variable);
                        console.log('typeof temp_variable : ', typeof temp_variable);
                        temp_variable = JSON.parse(temp_variable);

                        console.log(temp_variable.bot_operations.status_alter.activity_status_id);

                        for(let k_iterator of statuses) {
                            if(Number(temp_variable.bot_operations.status_alter.activity_status_id) === k_iterator.activity_status_id) {
                                targetStatusSeqID = k_iterator.activity_status_sequence_id;
                                break;
                            }            
                        }

                        console.log('targetStatusSeqID : ', targetStatusSeqID);
                        if(currentStatusSeqID > targetStatusSeqID) { //Means Status rollback
                            show_prompt = 1;
                        }
                    }
                }                    
            } else {
                //Bot is not defined
                console.log('Bot is not defined');                
            }
            
        } catch(err) {
            error = true;
            console.log(err);
            responseData.push({'error': err});
        }

        responseData.push({"show_prompt": show_prompt});
        return [error, responseData];
    }

    this.formEntityAccessWithStatus = async function (request) {

        let formData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id,
            request.target_asset_id,
            request.flag || 0,
            request.activity_status_id,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_form_entity_mapping_select_check_status', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {

                    if(request.workforce_id == 5403 || request.workforce_id == 5404 || request.workforce_id == 5648){
                        request.flag = 0;
                        [error, formData] = await self.formEntityAccessList(request);
                    }else{

                        if(data.length > 0){
                            formData = data;
                            error = false;
                        }else{
                          [error, formData] = await self.formEntityAccessList(request);
                        }
                    }
                    
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, formData];
    };

    this.formEntityAccessList = async function (request) {

        let fieldData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id,
            request.target_asset_id,
            request.flag,
            '1970-01-01 00:00:00',
            request.start_from || 0,
            request.limit_value || 250
        );
        const queryString = util.getQueryString('ds_v1_form_entity_mapping_select_workflow_forms_level', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    fieldData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, fieldData];
    };    


    //Handling Arrya of Objects wala input
    async function activityActivityMappingUpdateV1(request, fieldData, oldFieldValue, flag) {
        util.logInfo(request,`In formConfigService activityActivityMappingInsertV1`);
        let currentWorkflowActivityId = request.activity_id; //workflow activity id
        
        if(Number(request.activity_type_category_id) === 9) {
            if(request.hasOwnProperty("workflow_activity_id")) {
                currentWorkflowActivityId = Number(request.workflow_activity_id);
            } else {
                await sleep(10000);
                const [workflowError, workflowData] = await activityCommonService.fetchReferredFormActivityIdAsyncv1(request, request.activity_id, request.form_transaction_id, request.form_id);
                if (workflowError !== false || workflowData.length === 0) {
                    util.logError(request,`workflowError | No data`, { type: 'activity_activty_mapping_update', error: serializeError(workflowError) });
                    
                    //if(cnt <= 2) {
                    //    await sleep(2000);
                    //    cnt++;
                    //    await activityActivityMappingInsertV1(request, fieldData, cnt);
                    //} else {
                    //    return [workflowError, workflowData];
                    //}
    
                    return [workflowError, workflowData];
                }
                currentWorkflowActivityId = Number(workflowData[0].activity_id);
            }

        }

        util.logInfo(request,`fieldData V1: %j`, fieldData);
        util.logInfo(request,`flag :  %j`, flag);

        
        //Unmap the existing one
        let processedOldFieldValue;
        let oldReq = Object.assign({}, request);
            oldReq.activity_id = currentWorkflowActivityId;
        try{
            if(flag === 'multi') {
                processedOldFieldValue = (typeof oldFieldValue === 'string')? JSON.parse(oldFieldValue): oldFieldValue;
                //let cartItems = (typeof processedOldFieldValue.cart_items === 'string') ? JSON.parse(processedOldFieldValue.cart_items): processedOldFieldValue.cart_items;
                //let productActId;
                /*for(const i_iterator of cartItems) {
                    //console.log('i_iterator.product_variant_activity_id - ', i_iterator.product_variant_activity_id);
                    //console.log('processedOldFieldValue.product_activity_id - ', processedOldFieldValue.product_activity_id);

                    //productActId = (Number(i_iterator.product_variant_activity_id) !== 0) ? i_iterator.product_variant_activity_id : processedOldFieldValue.product_activity_id;
                    //console.log('productActId - ', productActId);
                    await activityCommonService.activityActivityMappingArchive(oldReq, processedOldFieldValue.product_activity_id);
                }*/

                let activityId =  processedOldFieldValue.product_activity_id;

                if(!activityId) {
                    processedOldFieldValue.length ? activityId = processedOldFieldValue[0].activity_id : "";
                }
               

                await activityCommonService.activityActivityMappingArchive(oldReq, activityId);
            } else { //'Single'
                processedOldFieldValue = oldFieldValue.split('|');
                await activityCommonService.activityActivityMappingArchive(oldReq, processedOldFieldValue[0]);
            }
            
        } catch(err) {
            util.logError(request,`Error in parsing workflow reference datatype old V1 field edit:`, { type: 'activity_activty_mapping_update', error: serializeError(err) });
            //return "Failure";
        }

        /*if(fieldData.field_data_type_id == 71) { // for this the inline json have different structure
            try{
                if(flag === 'multi') {
                    processedOldFieldValue = (typeof oldFieldValue === 'string')? JSON.parse(oldFieldValue): oldFieldValue;
                    await activityCommonService.activityActivityMappingArchive(oldReq, processedOldFieldValue.product_activity_id);
                } else { //'Single'
                    processedOldFieldValue = oldFieldValue.split('|');
                    await activityCommonService.activityActivityMappingArchive(oldReq, processedOldFieldValue[0]);
                }

            } catch(err) {
                console.log('Error in parsing workflow reference datatype old V1 field edit for data type id 71: ', processedOldFieldValue);
                console.log(err);
            }
        }*/
        
        //Update with the newData
        let fieldValue;
        let newReq = Object.assign({}, request);
            newReq.activity_id = currentWorkflowActivityId;
        try{
            if(flag === 'multi') {
                fieldValue = JSON.parse(fieldData.field_value);
                switch(Number(fieldData.field_data_type_id)) {
                    case 68: for(const i of fieldValue) {
                                await activityCommonService.activityActivityMappingInsertV1(newReq, i.activity_id);
                             }
                             break;
                    case 71: //let childActivities = (typeof fieldValue.cart_items === 'string') ? JSON.parse(fieldValue.cart_items): fieldValue.cart_items;
                            //let productActId;
                            //for(const i of childActivities) {
                            //       productActId = (Number(i.product_variant_activity_id) !== 0) ? i.product_variant_activity_id : fieldValue.product_activity_id;
                            //       await activityCommonService.activityActivityMappingInsertV1(newReq, productActId);
                            //}
                            await activityCommonService.activityActivityMappingInsertV1(newReq, fieldValue.product_activity_id);
                            break;                    
                }
                
            } else { //'Single'
                fieldValue = (fieldData.field_value).split('|');
                await activityCommonService.activityActivityMappingInsertV1(newReq, fieldValue[0]);
            }
            
        } catch(err) {
            util.logError(request,`Error in parsing workflow reference datatype new  V1 field edit:`, { type: 'activity_activty_mapping_update', error: serializeError(err) });
            return "Failure";
        }

        return "success";
    }

    this.formParticipantSet = async(request) => {
        /*{
            "form_fill_request": [{
					"form_id": 1025,
					"form_name": "Sample Form",
					"asset_id": 40210,
					"asset_first_name": "<data>",
					"asset_last_name": "<data>",
					"operating_asset_id": "<data>",
					"operating_asset_first_name": "<data>",
					"operating_asset_last_name": "<data>"
				}]
        }*/

        let responseData = [],
            error = true;
            activityMasterData = [];

        let participantData = JSON.parse(request.participant_collection);
        let activityData = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);

        console.log('activityData.length : ', activityData.length);
        console.log('activityData[0].activity_master_data : ', activityData[0].activity_master_data);              

        if(activityData[0].activity_master_data !== null) {
            activityMasterData = JSON.parse(activityData[0].activity_master_data).form_fill_request;
            console.log('activityMasterData from Activity List table : ', activityMasterData);

            for(const i_iterator of participantData.form_fill_request) {
                activityMasterData.push(i_iterator);
            }
            
            let temp = {
                form_fill_request: activityMasterData
                };
                
            console.log('In IF TEMP : ', temp);
            activityMasterData = JSON.stringify(temp);
            
        } else {
            for(const i_iterator of participantData.form_fill_request) {
                activityMasterData.push(i_iterator);
            }

            let temp = {
                form_fill_request: activityMasterData
                };
                
            console.log('In ELSE TEMP : ', temp);
            activityMasterData = JSON.stringify(temp);            
        }   
        
        console.log('activityMasterData : ', activityMasterData);
        await new Promise((resolve, reject)=>{
            activityCommonService.updateActivityMasterData(
                request, 
                request.workflow_activity_id, 
                activityMasterData,        
                (err, data) =>{
                    if(!err) {
                        error = false;
                    }
                    resolve();
                });
        });
        
        return [error, responseData];
    }

    this.formParticipantReset = async(request) => {
          /*[{
                "form_id": 1025,                    
                "asset_id": 40210
            }, {
                "form_id": 2045,              
                "asset_id": 39526
            }]*/

        let responseData = [],
            error = true;

        let participantData = JSON.parse(request.participant_collection);
        let activityData = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);        

        let activityMasterData;        
        let newActivityMasterData = [];
        try {
            activityMasterData = JSON.parse(activityData[0].activity_master_data).form_fill_request;
            console.log('activityMasterData from Activity8 List: ', activityMasterData);            

            for(const i_iterator of participantData) {
                for(const j_iterator of activityMasterData) {
                    if(i_iterator.form_id === j_iterator.form_id && i_iterator.asset_id === j_iterator.asset_id) {
                        continue;
                    } else {
                        newActivityMasterData.push(j_iterator);
                    }                                     
                }
                activityMasterData = newActivityMasterData;
            }
            
        } catch(err) {
            console.log('Error in parsing the activity_master_data', err);
        }       
        
        let finalJson = {
            form_fill_request: newActivityMasterData
        };        
        finalJson = JSON.stringify(finalJson) ;

        await new Promise((resolve, reject)=>{
            activityCommonService.updateActivityMasterData(
                request, 
                request.workflow_activity_id, 
                finalJson, 
                (err, data) =>{
                    if(!err) {
                        error = false;
                    }
                    resolve();
                });
        });
        
        return [error, responseData];
    }

    this.getSmartNonSmartForm = async (request) => {
        let error = true,
            responseData = [];        

        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.timeline_transaction_id || 0,
            request.flag_previous,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );

        const queryString = util.getQueryString('ds_v1_activity_timeline_transaction_select_differential', paramsArr);

        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {                   
                    let newReq = Object.assign({}, request);
                        newReq.field_id = 0;
                        newReq.start_from = 0;
                        newReq.limit_value = 1;

                    //console.log('DATA : ', data);

                    for(const i_iterator of data){                            
                        newReq.form_id = i_iterator.data_form_id;
                        
                        if(Number(newReq.form_id) > 0) {
                            let [err1, data] = await activityCommonService.workforceFormFieldMappingSelect(newReq);
                        //console.log('DATA : ', data);
                        let temp = {};
                            temp.form_id = i_iterator.data_form_id;
                        temp.is_smart = (data.length> 0 && data[0].next_field_id > 0) ? i_iterator.is_smart = 1 : i_iterator.is_smart = 0;                           
                        responseData.push(temp);
                        }                        
                    }
                    
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }    

        return [error, responseData]; 
    }

    async function workforceFormMappingSelectWorkflowFormsV1(request) {

        let workflowFormsData = [],
            error = true;

        let paramsArr = new Array(
            request.flag || 0,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id || 0,
            0, // request.access_level_id || 0,
            request.log_datetime || '1970-01-01 00:00:00',
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_1_workforce_form_mapping_select_workflow_forms', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    workflowFormsData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, workflowFormsData];
    }

    this.autoPopulateForm = async (request) => {
        try {

            request.limit_value = 50;
            request.bot_id = 0;
            request.field_id = 0;
            request.bot_operation_type_id = 32;
            let [err, fieldLevelBots] = await activityCommonService.botOperationMappingSelectOperationType(request);

            console.log("fieldLevelBots", JSON.stringify(fieldLevelBots));

            if(err) {
                return [err, fieldLevelBots];
            }
            
            let botInlineData = [];
            let referenceShortTextFields = [];
            if(fieldLevelBots.length) {
                for(let row of fieldLevelBots) {
                    if(row.bot_operation_type_id == 32) {
                        console.log("row",JSON.parse(row.bot_operation_inline_data));
                        dummy = JSON.parse(row.bot_operation_inline_data);
                        
                        botInlineData = botInlineData.concat(JSON.parse(row.bot_operation_inline_data).bot_operations.form_field_copy);
                        if(JSON.parse(row.bot_operation_inline_data).bot_operations.hasOwnProperty("short_text_fields")){
                            
                            referenceShortTextFields = JSON.parse(row.bot_operation_inline_data).bot_operations.short_text_fields;
                        }
                    }
                }
            }
// return [true,{}]
            if(!botInlineData) {
                return [true, [{ message : "Form field data is empty"}]];
            }

            console.log("botInlineData", JSON.stringify(botInlineData));
            console.log("reference short text feilds",referenceShortTextFields);
            
            let response = [];
            for(let row of botInlineData) {
                let tempActivityID = request.workflow_activity_id;
                let creatorEmail = "";
                if(row.hasOwnProperty("workflow_reference_dependency") && row.workflow_reference_dependency==1){
                    let [referr,refAccountDetails] =  await getActActChildActivities(request);
                    
                    if(refAccountDetails.length>0){
                        for(let i=0;i<refAccountDetails.length;i++){
                            if(refAccountDetails[i].parent_activity_type_category_id==53){
                        tempActivityID = refAccountDetails[i].parent_activity_id
                            }
                        }
                    }
                }
                if(row.hasOwnProperty('activity_creator_email') && row.activity_creator_email==1){
                    let activityDataResp = await activityCommonService.getActivityDetailsPromise(request, tempActivityID);
                    if(activityDataResp.length>0){
                       let [err,creatorAssetDetails] =  await activityCommonService.getAssetDetailsAsync({...request,asset_id:activityDataResp[0].activity_creator_asset_id});
                       creatorEmail = creatorAssetDetails[0].operating_asset_email_id;
                       response.push({
                        [row.target_field_id]: creatorEmail
                    });
                    continue;
                    }
                }
                let dependentFormTransaction = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, tempActivityID, row.source_form_id);


                for(let row1 of dependentFormTransaction) {
                    let data = JSON.parse(row1.data_entity_inline);
                    let formSubmittedInfo = data.form_submitted;
                    
                    try {
                        formSubmittedInfo = JSON.parse(formSubmittedInfo);
                    } catch (e) {
                        console.log("got formSubmittedInfo as string");
                    }
                    // console.log(formSubmittedInfo)

                    for(let newRow of formSubmittedInfo) {
                        if(newRow.field_id == row.source_field_id) {
                            
                            if(referenceShortTextFields.findIndex((eachField)=>eachField == row.target_field_id)!=-1){
                                let tempVal = newRow.field_value.split('|');
                                const finalVal = tempVal[1];
                                response.push({
                                    [row.target_field_id]: finalVal
                                });
                                break;
                            }
                            response.push({
                                [row.target_field_id]: newRow.field_value
                            });
                            break;
                        }
                    }
                }
            }

            return [err, response];
        } catch (e) {
            console.log("Something went wrong", e.stack);
            return [true, [{ message : "Something went wrong. Please try again"}]]
        }
    }

    async function getActActChildActivities (request) {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.workflow_activity_id,
			request.activity_type_id || 0,
			0,
			request.organization_id,
			request.flag || 1,
			request.page_start || 0,
			request.page_limit || 50
		);
		const queryString = util.getQueryString('ds_p1_activity_activity_mapping_select_child_activities', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

    async function checkWhetherFormWorkflowActID(request) {
        let responseData = [],
            error = true;
        
        const paramsArr = [
                            request.form_transaction_id,
                            request.organization_id
                            ];

        const queryString = util.getQueryString('ds_p1_activity_list_select_workflow_activity', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
              .then((data)=>{
                responseData = data;
                error = false;
        })
        .catch((err)=>{
                console.log('[Error] activityUpdateExpression ',err);
            error = err;
        });
        }

        return [error, responseData];       
    }

    this.formFieldbotValidation = async (request) => {
        let error = true,
            responseData = [];        

        const paramsArr = new Array(
            request.organization_id,
            request.bot_id||0,
            request.form_id,
            request.field_id,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );

        const queryString = util.getQueryString('ds_p1_bot_operation_mapping_select_validation', paramsArr);

        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {                   
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }    

        return [error, responseData]; 
    }

    this.formAccessSearchList = async (request) => {
        let error = true,
            responseData = [];        

        try {
            const paramsArr = [
                request.flag,
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_type_id,
                request.search_string,
                request.page_start || 0,
                request.page_limit || 100
            ];
    
            const queryString = util.getQueryString('ds_p1_workforce_form_mapping_select_search', paramsArr);
    
            if (queryString != '') {
                await db.executeQueryPromise(1, queryString, request)
                    .then(async (data) => {                   
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    });
            }
        } catch (e){
            return [e, responseData];
        }   

        return [error, responseData]; 
    }

    this.retrieveEdcTransaction = async (request) => {
        let error = true,
            responseData = [];        

        try {
            let [error1,activityData] = await activityCommonService.getWorkflowFieldsBasedonActTypeId(request,request.activity_type_id);
            if(error1){
                throw error1;
            }
            if(activityData.length == 0 || activityData[0].activity_type_edc_form_id == undefined || activityData[0].activity_type_edc_form_id == null || activityData[0].activity_type_edc_form_id == 0 || activityData[0].activity_type_edc_field_id == null || activityData[0].activity_type_edc_field_id == 0 ){
                responseData.push({form_transaction_id:0,form_id :0 ,field_id :0});
                error = false;
                return [error, responseData];
            }
            const paramsArr = [
                request.organization_id,
                request.account_id,
                request.activity_id,
                activityData[0].activity_type_edc_form_id,
                0,
                1
            ];
    
            const queryString = util.getQueryString('ds_p1_1_activity_timeline_transaction_select_activity_form', paramsArr);
    
            if (queryString != '') {
                await db.executeQueryPromise(1, queryString, request)
                    .then(async (data) => {
                        if(data.length == 0){
                            responseData.push({form_transaction_id:0,form_id :activityData[0].activity_type_edc_form_id ,field_id :activityData[0].activity_type_edc_field_id});                            
                        } else {
                            responseData.push({form_transaction_id:data[0].data_form_transaction_id,form_id :activityData[0].activity_type_edc_form_id ,field_id :activityData[0].activity_type_edc_field_id});
                        }
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    });
            }
        } catch (e){
            return [e, responseData];
        }   

        return [error, responseData]; 
    }
    
    async function kafkaProdcucerForChildOrderCreation(topicName,message) {
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

    this.formEntityMappingTagFetch = async (request) => {
        let error = true,
            responseData = [];        
        /*
        p_flag_tag_enabled = 0 for listing origin forms directly where tags are not mapped
        p_flag_tag_enabled =  1 for listing the ones mapped to tags

        p_flag = 1 for organization level access
        p_flag = 2 for account level access
        p_flag = 3 for workforce/asset level access 
        */

        try {
            
            if(request.level_flag < 2 ) {
                if(request.flag_tag_enabled==0&&request.level_flag==0){
                    let [error, res] = await fetchMappingTagsBasedOnFlag(request);
                if(error) {
                   return  [error, []]
                }
                    return [false, [{
                        forms : res,
                        tags : []
                    }]]
                }
                
                let [error, res] = await fetchMappingTagsBasedOnFlag({...request,flag_tag_enabled:1});
                if(error) {
                   return  [error, []]
                }
                
                let [error1, res1] = await fetchMappingTagsBasedOnFlag({...request,flag_tag_enabled:0});

                if(error1) {
                    return  [error1, []]
                 }
               if(request.flag_tag_enabled==1&&request.level_flag==1){
                return [false, [{
                    forms : res1,
                    tag_types : res
                }]]
               }
                 return [false, [{
                     forms : res1,
                     tags : res
                 }]]


            } else {
                let [error, res] = await fetchMappingTagsBasedOnFlag(request);
                if(error) {
                   return  [error, []]
                }

                return  [
                    error, [{
                        forms : request.level_flag == 2?[]:res,
                        tags : request.level_flag == 3?[]:res
                    }]]

            }

        } catch (e){
            return [e, []];
        }   

    }

    async function fetchMappingTagsBasedOnFlag(request) {
        let responseData=[];
        console.log('level flag',request.level_flag)
        try {
            const paramsArr = [
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_id,
                request.tag_type_id,
                request.tag_id,
                request.flag_tag_enabled || 0,
                request.flag || 0,
                request.level_flag || 0,
                request.page_start || 0,
                request.page_limit || 100
            ];
    
            const queryString = util.getQueryString('ds_p1_form_entity_mapping_select_tag', paramsArr);
    
            if (queryString != '') {
                await db.executeQueryPromise(1, queryString, request)
                    .then(async (data) => {                   
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    });
            }
        } catch (e){
            return [e, responseData];
        }   

        return [error, responseData]; 
    }

    this.formEntityMappingTagDelete = async(request) => {
        try{

            for(let activityTagId of request.tag_activity_type_ids) {
                request.tag_activity_type_id = activityTagId;
                deleteMappingTags(request);
            }

            return [false, []];
        }catch(e) {
            console.log("formEntityMappingTagDelete", e, e.stack)
        }
    }
    async function deleteMappingTags(request) {
        let responseData=[];
        try {
            const paramsArr = [
                request.organization_id, 
                request.tag_id, 
                request.tag_type_category_id || 0, 
                request.tag_activity_type_id, 
                request.tag_workforce_id || 0, 
                request.tag_asset_id || 0, 
                request.activity_status_id || 0, 
                request.log_asset_id, 
                util.getCurrentUTCTime()
            ];
        
            const queryString = util.getQueryString('ds_v1_1_tag_entity_mapping_delete', paramsArr);
    
            if (queryString != '') {
                await db.executeQueryPromise(0, queryString, request)
                    .then(async (data) => {                   
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    });
            }
        } catch (e){
            return [e, responseData];
        }   

        return [error, responseData]; 
    }

    this.activityFormListUpdateFieldValue = async function (request) {

        let paramsArr = new Array(
            request.organization_id,
            request.activity_id, 
            request.form_id,
            request.form_transaction_id,
            request.field_id,
            request.field_value,
            request.datetime_log
        );
        
        let queryString = util.getQueryString("ds_v1_activity_form_list_update_field_value",paramsArr);    
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {                   
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
    };
     
    this.draftFormDeleteV1 = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,            
            request.asset_id,
            request.form_id,
            request.form_transaction_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_asset_form_draft_transaction_delete', paramsArr);

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

    this.activityFormFieldUpdatePreview = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.field_id,            
            request.form_id,
            request.organization_id,
            request.field_preview_enabled,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_update_preview_enabled', paramsArr);

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

    this.workforceFormMappingSelectMeetingFormOrigin = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_type_id,
            request.flag_origin,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_select_meeting_form_origin', paramsArr);

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

    this.formEntityMappingCategorySelect = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.activity_type_category_id || 31,
            request.flag || 0,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_form_entity_mapping_select_category', paramsArr);

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
}

module.exports = FormConfigService;