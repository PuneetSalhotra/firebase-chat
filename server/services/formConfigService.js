
function FormConfigService(objCollection) {

    var db = objCollection.db;
    var util = objCollection.util;
    var activityCommonService = objCollection.activityCommonService;
    var queueWrapper = objCollection.queueWrapper;
    var forEachAsync = objCollection.forEachAsync;

    const ActivityService = require('../services/activityService');
    const activityService = new ActivityService(objCollection);

    const ActivityTimelineService = require('../services/activityTimelineService');
    const activityTimelineService = new ActivityTimelineService(objCollection);

    const BotService = require('../botEngine/services/botService');
    const botService = new BotService(objCollection);

    const cacheWrapper = objCollection.cacheWrapper;
    const moment = require('moment');
    const nodeUtil = require('util');
    const self = this;

    console.log("[FormConfigService] Object.keys(objCollection): ", Object.keys(objCollection));

    this.getOrganizationalLevelForms = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';

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
        var paramsArr = new Array();
        var queryString = '';

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
        var paramsArr = new Array();
        var queryString = '';

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
        var paramsArr = new Array();
        var queryString = '';

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
        var paramsArr = new Array();
        var queryString = '';

        paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id,
            '1970-01-01 00:00:00',
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select', paramsArr);
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
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    //Added by V Nani Kalyan for BETA
    this.getRegisterForms = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';

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
        var paramsArr = new Array();
        var queryString = '';

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

    var formatFromsListing = function (device_os_id, data, callback) {
        //console.log(data);
        var responseData = new Array();
        data.forEach(function (rowData, index) {

            var rowDataArr = {
                "form_id": util.replaceDefaultNumber(rowData['form_id']),
                "form_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['form_name'])),
                "field_id": util.replaceDefaultNumber(rowData['field_id']),
                "field_description": util.replaceDefaultString(util.decodeSpecialChars(rowData['field_description'])),
                "field_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['field_name'])),
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
                "form_flag_workflow_origin": util.replaceDefaultNumber(rowData['form_flag_workflow_origin'])
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

    this.alterFormActivity = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var activityInlineData = JSON.parse(request.activity_inline_data);
        var newData = activityInlineData[0];
        console.log('newData from Request: ', newData);
        request.new_field_value = newData.field_value;

        let cnt = 0,
            oldFieldValue,
            newFieldValue = newData.field_value;

        activityCommonService.getActivityByFormTransactionCallback(request, request.activity_id, (err, data) => {
            if (err === false) {
                console.log('Data from activity_list: ', data);
                var retrievedInlineData = [];
                if (data.length > 0) {
                    request['activity_id'] = data[0].activity_id;

                    retrievedInlineData = JSON.parse(data[0].activity_inline_data);

                    newData.form_name = data[0].form_name || newData.form_name;
                }
                forEachAsync(retrievedInlineData, (next, row) => {
                    if (Number(row.field_id) === Number(newData.field_id)) {
                        oldFieldValue = row.field_value;
                        row.field_value = newData.field_value;
                        newData.field_name = row.field_name;
                        cnt++;
                    }
                    next();
                }).then(() => {

                    if (cnt == 0) {
                        newData.update_sequence_id = 1;
                        retrievedInlineData.push(newData);
                        oldFieldValue = newData.field_value;
                        // newData.field_name = row.field_name;
                    }

                    request.activity_inline_data = JSON.stringify(retrievedInlineData);

                    let content = '';
                    if (String(oldFieldValue).trim().length === 0) {
                        content = `In the ${newData.form_name}, the field ${newData.field_name} was updated to ${newFieldValue}`;
                    } else {
                        content = `In the ${newData.form_name}, the field ${newData.field_name} was updated from ${oldFieldValue} to ${newFieldValue}`;
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
                            console.log('update_sequence_id : ', x.update_sequence_id);
                            request.update_sequence_id = ++x.update_sequence_id;
                        } else {
                            request.update_sequence_id = 1;
                        }

                        await putLatestUpdateSeqId(request, activityInlineData).then(() => {

                            

                            var event = {
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

                        }).catch((err) => {
                            // global.logger.write(err);
                        });

                        // Workflow trigger on form edit
                        const [formConfigError, formConfigData] = await workforceFormMappingSelect(request);
                        if (formConfigError !== false) {
                            // return [formConfigError, formConfigData];
                            console.log("Error: ", formConfigError);

                        } else if (Number(formConfigData.length) > 0 && Number(formConfigData[0].form_flag_workflow_enabled) === 1) {
                            let workflowRequest = Object.assign({}, request);
                            workflowRequest.activity_inline_data = JSON.stringify(activityInlineData);
                            try {
                                self.workflowOnFormEdit(workflowRequest);
                            } catch (error) {
                                console.log("[alterFormActivity] Workflow trigger on form edit: ", error);
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

                            console.log("[regenerateAndSubmitCAF] activityInlineData: ", activityInlineData);

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
                            global.logger.write('conLog', "\x1b[35m [Log] CAF EDIT \x1b[0m", {}, request);
                            await fetchReferredFormActivityId(request, request.activity_id, newData.form_transaction_id, request.form_id).then((data) => {
                                global.logger.write('conLog', "\x1b[35m [Log] DATA \x1b[0m", {}, request);
                                global.logger.write('debug', data, {}, request);

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

                                    global.logger.write('conLog', "\x1b[35m [Log]  Raising 713 entry onto New Order Form \x1b[0m", {}, request);
                                    queueWrapper.raiseActivityEvent(fire705OnNewOrderFileEvent, request.activity_id, (err, resp) => {
                                        if (err) {
                                            global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                            global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                                        } else {
                                            global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                                        }
                                    });
                                } else {
                                    global.logger.write('conLog', "\x1b[35m [Log] Data from this call fetchReferredFormActivityId is empty \x1b[0m", {}, request);
                                }

                            });
                        }

                    }).catch((err) => {
                        global.logger.write(err);
                    });
                });

            } else {
                callback(true, {}, -9998);
            }
        });

        callback(false, {}, 200);
    };

    function getLatestUpdateSeqId(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
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

    function putLatestUpdateSeqId(request, activityInlineData) {
        return new Promise((resolve, reject) => {

            const widgetFieldsStatusesData = util.widgetFieldsStatusesData();
            let poFields = widgetFieldsStatusesData.PO_FIELDS; //new Array(13263, 13269, 13265, 13268, 13271);
            let orderValueFields = widgetFieldsStatusesData.TOTAL_ORDER_VALUE_IDS; //new Array(7200, 8565, 8817, 9667, 9941, 10207, 12069, 12610)

            forEachAsync(activityInlineData, (next, row) => {
                var params = new Array(
                    request.form_transaction_id, //0
                    request.form_id, //1
                    request.field_id, //2
                    request.data_type_combo_id || 0, //3
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

                var dataTypeId = Number(row.field_data_type_id);
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
                        approvalFields.push(row.field_id);
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

                global.logger.write('conLog', '\x1b[32m In formConfigService - addFormEntries params - \x1b[0m' + JSON.stringify(params), {}, request);

                let queryString = util.getQueryString('ds_p1_activity_form_transaction_insert_field_update', params);
                if (queryString != '') {
                    db.executeQuery(0, queryString, request, function (err, data) {  
                        global.logger.write('conLog', '*****Update: update field_value in widget *******'+row.field_id +' '+row.field_value , {}, request);
                        try{
                            if(Object.keys(orderValueFields).includes(String(row.field_id))){
                                if((typeof row.field_value) === 'number')
                                    widgetAggrFieldValueUpdate(request);
                                else
                                    console.log("Field Value is not a number || not Total Order Value Field "+row.field_value);
                                }else{
                                    console.log("This field is not configured to update in intermediate table "+row.field_id);
                                }
                            }catch(err){
                                console.log('Error in updating Intermediate Table : ', err);
                            }  


                         global.logger.write('conLog', '*****Update: update po_date in widget1 *******'+Object.keys(poFields) +' '+row.field_id , {}, request);
                         if(Object.keys(poFields).includes(String(row.field_id))){
                                global.logger.write('conLog', '*****Update: update po_date in widget2 *******', {}, request);
                                activityCommonService.getActivityDetailsPromise(request,0).then((activityData)=>{ 
                                    global.logger.write('conLog', '*****Update: update po_date in widget3 *******'+activityData[0].channel_activity_id , {}, request);                                       
                                    request['workflow_activity_id'] = activityData[0].channel_activity_id;                            
                                    request['order_po_date'] = row.field_value;
                                    request['flag'] = 1;
                                    request['datetime_log'] = util.getCurrentUTCTime();
                                    activityCommonService.widgetActivityFieldTxnUpdateDatetime(request); 
                                });          
                            }
                        next();
                        //(err === false) ?  resolve() : reject();
                    });
                }
            }).then(() => {
                resolve();
            });
        });
    }


    this.getFormFieldComboValues = function (request) {
        return new Promise((resolve, reject) => {
            var queryString = '';

            var paramsArr = new Array(
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
                global.logger.write('conLog', "\x1b[35m [Log] DATA \x1b[0m", {}, request);
                global.logger.write('conLog', data, {}, request);
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

                            global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                            global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);

                            reject(err);

                        } else {

                            global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);

                            resolve();
                        }
                    });
                }
            });
        });
    }

    this.getFormTransactionData = function (request) {
        return new Promise((resolve, reject) => {
            var queryString = 'ds_v1_1_activity_form_transaction_select_transaction';
            var paramsArr = new Array(
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
            var formData = [];
            var counter = -1;

            forEachAsync(data, (next, dataArray) => {
                console.log(dataArray.length);
                forEachAsync(dataArray, (next1, fieldData) => {
                    console.log("fieldData.field_id " + fieldData.field_id);
                    var formattedFieldData = {};
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
            error;

        await workforceFormMappingInsert(request)
            .then(async (newFormData) => {
                console.log("newFormData: ", newFormData);

                let fieldSequenceId = 0;

                if (Number(newFormData[0].query_status) === 0 && newFormData[0].form_id > 0) {

                    formId = newFormData[0].form_id;
                    request.form_id = Number(newFormData[0].form_id);

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

                        let dataTypeCategoryId = Number(formField.datatypecategoryid);

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
                                        field_sequence_id: fieldSequenceId,
                                        field_mandatory_enabled: fieldMandatoryEnabled,
                                        field_preview_enabled: 0, // THIS NEEDS WORK
                                        data_type_combo_id: index + 1,
                                        data_type_combo_value: comboEntry.label,
                                        data_type_id: Number(formField.datatypeid),
                                        next_field_id: nextFieldId
                                    })
                                    .then((fieldData) => {
                                        // console.log("someData: ", someData)
                                        if (fieldId === 0) {
                                            fieldId = Number(fieldData[0].p_field_id);
                                        }
                                    });

                                // History insert in the workforce_form_field_mapping_history_insert table
                                await workforceFormFieldMappingHistoryInsert(request, {
                                    field_id: fieldId,
                                    data_type_combo_id: index + 1
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
                                    field_sequence_id: fieldSequenceId,
                                    field_mandatory_enabled: fieldMandatoryEnabled,
                                    field_preview_enabled: 0, // THIS NEEDS WORK
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
                                });
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
                formFieldCollection.field_sequence_id,
                formFieldCollection.field_mandatory_enabled,
                formFieldCollection.field_preview_enabled,
                formFieldCollection.data_type_combo_id,
                formFieldCollection.data_type_combo_value,
                formFieldCollection.data_type_id,
                formFieldCollection.next_field_id,
                request.form_id,
                request.organization_id,
                request.asset_id,
                util.getCurrentUTCTime()
            );

            const queryString = util.getQueryString('ds_p1_1_workforce_form_field_mapping_insert', paramsArr);
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

            await db.executeQueryPromise(0, queryString, request)
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

    this.fetchFormAccessList = async function (request) {
        // Update asset's GPS data
        request.datetime_log = util.getCurrentUTCTime();
        activityCommonService.updateAssetLocation(request, () => {});

        if (
            request.hasOwnProperty("add_process") &&
            Number(request.add_process) === 1
        ) {
            const [error, workflowFormsData] = await formEntityMappingSelectWorkflowForms(request);
            return [error, workflowFormsData];
            
        } else {
            const [error, workflowFormsData] = await workforceFormMappingSelectWorkflowForms(request);
            return [error, workflowFormsData];

        }
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
            request.start_from,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_select_workflow_forms', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(0, queryString, request)
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

            await db.executeQueryPromise(0, queryString, request)
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

            await db.executeQueryPromise(0, queryString, request)
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
                formFieldUpdateStatus: []
            }];
        }
        // History update
        request.update_type_id = 605;
        workforceFormMappingHistoryInsert(request);

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

        let workflowActivityId = request.workflow_activity_id || 0;

        request.form_id = Number(request.activity_form_id);

        // Fetch form's config data
        const [formConfigError, formConfigData] = await workforceFormMappingSelect(request);
        if (formConfigError !== false) {
            return [formConfigError, formConfigData];
        }

        if (Number(formConfigData.length) > 0) {
            // Check if the form has an origin flag set
            let activityId;
            let originFlagSet = Number(formConfigData[0].form_flag_workflow_origin),
                isWorkflowEnabled = Number(formConfigData[0].form_flag_workflow_enabled),
                workflowActivityTypeId = Number(formConfigData[0].form_workflow_activity_type_id),
                workflowActivityTypeName = formConfigData[0].form_workflow_activity_type_name;

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

                global.logger.write('conLog', "New activityId is :" + activityId, {}, request);

                // Prepare a new request object and fire the addActivity service
                let createWorkflowRequest = Object.assign({}, request);
                createWorkflowRequest.activity_id = Number(activityId);
                createWorkflowRequest.activity_type_category_id = 48;
                createWorkflowRequest.activity_type_id = workflowActivityTypeId;
                //createWorkflowRequest.activity_title = workflowActivityTypeName;
                //createWorkflowRequest.activity_description = workflowActivityTypeName;
                createWorkflowRequest.activity_form_id = Number(request.activity_form_id);
                createWorkflowRequest.form_transaction_id = Number(request.form_transaction_id);
                createWorkflowRequest.activity_parent_id = Number(request.child_order_activity_parent_id) || 0;

                const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
                await addActivityAsync(createWorkflowRequest);

                workflowActivityId = Number(activityId);

                // Trigger Bot Engine
                // Bot Engine Trigger
                try {                    
                    let botEngineRequest = Object.assign({}, request);
                    botEngineRequest.form_id = request.activity_form_id;
                    botEngineRequest.field_id = 0;
                    botEngineRequest.flag = 3;
                    botEngineRequest.workflow_activity_id = workflowActivityId;

                    const [formConfigError, formConfigData] = await activityCommonService.workforceFormMappingSelect(botEngineRequest);
                    if (
                        (formConfigError === false) &&
                        (Number(formConfigData.length) > 0) &&
                        (Number(formConfigData[0].form_flag_workflow_enabled) === 1)
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
                            //console.log('RESULT : ', result);
                            if(result.length > 0) {
                                botEngineRequest.bot_transaction_id = result[0].bot_transaction_id;
                            }
                            
                            //Bot log - Bot is defined
                                activityCommonService.botOperationFlagUpdateBotDefined(botEngineRequest, 1);
                            
                            await activityCommonService.makeRequest(botEngineRequest, "engine/bot/init", 1)
                                .then((resp) => {
                                    global.logger.write('debug', "Bot Engine Trigger Response: " + JSON.stringify(resp), {}, request);
                                    //Bot log - Update Bot status
                                    //1.SUCCESS; 2.INTERNAL ERROR; 3.EXTERNAL ERROR; 4.COMMUNICATION ERROR
                                        activityCommonService.botOperationFlagUpdateBotSts(botEngineRequest, 1); 
                                }).catch((err)=>{
                                    //Bot log - Update Bot status with Error
                                        activityCommonService.botOperationFlagUpdateBotSts(botEngineRequest, 2);
                                });
                        } else {
                            //Bot is not defined
                                activityCommonService.botOperationFlagUpdateBotDefined(botEngineRequest, 0);
                        }
                    }
                } catch (botInitError) {
                    global.logger.write('error', botInitError, botInitError, botEngineRequest);
                }

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
                    /*"mail_body": `Form Updated at ${moment().utcOffset('+05:30').format('LLLL')}`,
                    "subject": "Form Name",
                    "content": `Form Name`,
                    "asset_reference": [],
                    "activity_reference": [],
                    "form_approval_field_reference": [],
                    "form_submitted": JSON.parse(request.activity_inline_data),
                    "attachments": []*/

                    "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                    "subject": activityTitle,
                    "content": 'Form Submitted',
                    "asset_reference": [],
                    "activity_reference": [],
                    "form_approval_field_reference": [],
                    "form_submitted": JSON.parse(request.activity_inline_data),
                    "attachments": []
                });
                // Append the incremental form data as well
                workflowFile713Request.form_id = workflowFile713Request.activity_form_id;
                workflowFile713Request.activity_type_category_id = 48;
                workflowFile713Request.activity_stream_type_id = 705;
                workflowFile713Request.flag_timeline_entry = 1;
                workflowFile713Request.message_unique_id = util.getMessageUniqueId(request.asset_id);
                workflowFile713Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                workflowFile713Request.device_os_id = 8;

                const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
                await addTimelineTransactionAsync(workflowFile713Request);
            }
        }

        return [formConfigError, {
            formConfigData
        }];
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
        console.log("workflowActivityId: ", workflowActivityId);

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
            console.log("formWorkflowActivityTypeId: ", formWorkflowActivityTypeId);

            if (Number(formWorkflowActivityTypeId) !== 0) {
                // 713 timeline entry on the workflow file
                try {
                    const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
                    await addTimelineTransactionAsync(workflowFile713Request);
                } catch (error) {
                    console.log("workflowOnFormEdit | addTimelineTransactionAsync | workflowFile713Request: ", error);
                }
                // Regenerate target form (if required/mapping exists), and then submit a 713 entry
                console.log("Calling [regenerateAndSubmitTargetForm]: ", request.activity_inline_data);

                const rebuildTargetFormEvent = {
                    name: "vodafoneService",
                    service: "vodafoneService",
                    method: "regenerateAndSubmitTargetForm",
                    payload: Object.assign(request)
                };
                queueWrapper.raiseActivityEvent(rebuildTargetFormEvent, request.activity_id, (err, resp) => {
                    if (err) {
                        global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                    } else {
                        global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                        global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
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

            console.log("formFieldMapping: ", formFieldMapping);
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
                    console.log("Match Found: ", mapping);
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
                    setTimeout(() => {
                        botService.initBotEngine(newRequest);
                    }, 2500);
                } catch (error) {
                    global.logger.write('conLog', 'botService.initBotEngine Error!', error, {});
                    console.log("botService.initBotEngine Error!", error);
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
                    setTimeout(() => {
                        botService.initBotEngine(newRequest);
                    }, 3000);
                } catch (error) {
                    global.logger.write('conLog', 'botService.initBotEngine Error!', error, {});
                    console.log("botService.initBotEngine Error!", error);
                }
            }
        }

        console.log();
        console.log();
        console.log("targetFormActivityId: ", targetFormActivityId);
        console.log("targetFormTransactionId: ", targetFormTransactionId);
        // console.log("targetFormInlineData: ", targetFormInlineData)
        console.log("targetFormSubmittedData: ", targetFormSubmittedData);
        console.log("targetFormName: ", targetFormName);

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

    this.formFieldDefinitionUpdate = async function (request) {
        let fieldDefinitions = [];
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
        console.log("fieldDefinitions.length: ", fieldDefinitions.length)

        // Process each field
        for (const field of fieldDefinitions) {
            // console.log("Object.keys(field): ", Object.keys(field));
            console.log("dataTypeCategoryId: ", field.dataTypeCategoryId)
            let dataTypeCategoryId = Number(field.dataTypeCategoryId)
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
                        field_description: '',
                        data_type_combo_value: dataTypeComboValue,
                        field_sequence_id: field.sequence_id,
                        field_mandatory_enabled: fieldMandatoryEnabled,
                        field_preview_enabled: '0'
                    });
                    if (updateError !== false) {

                    }
                    await workforceFormFieldMappingHistoryInsert(request, {
                        field_id: field.field_id,
                        data_type_combo_id: option.dataTypeComboId
                    });
                }
            } else {

                let dataTypeComboValue = (typeof field.update_option === 'undefined') ? '0' : field.label;

                const [updateError, updateStatus] = await workforceFormFieldMappingUpdate(request, {
                    field_id: field.field_id,
                    data_type_combo_id: field.dataTypeComboId,
                    field_name: fieldName,
                    field_description: '',
                    data_type_combo_value: dataTypeComboValue,
                    field_sequence_id: field.sequence_id,
                    field_mandatory_enabled: fieldMandatoryEnabled,
                    field_preview_enabled: '0'
                });
                if (updateError !== false) {

                }

                await workforceFormFieldMappingHistoryInsert(request, {
                    field_id: field.field_id,
                    data_type_combo_id: field.dataTypeComboId
                });

            }

        }

        return [false, []];
    };

    async function workforceFormFieldMappingUpdate(request, fieldOptions) {
        // IN p_field_id BIGINT(20), IN p_data_type_combo_id SMALLINT(6), 
        // IN p_form_id BIGINT(20), IN p_field_name VARCHAR(1200), 
        // IN p_field_description VARCHAR(300), IN p_data_type_combo_value VARCHAR(1200), 
        // IN p_field_sequence_id BIGINT(20), IN p_field_mandatory_enabled TINYINT(4), 
        // IN p_field_preview_enabled TINYINT(4), IN p_organization_id BIGINT(20), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let fieldUpdateStatus = [],
            error = false; // true;

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
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_update', paramsArr);
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
            let dataTypeCategoryId = Number(field.dataTypeCategoryId)
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
            formData = [],
            error;

        request.update_type_id = 28;

        try {
            fieldDefinitions = JSON.parse(request.fields_data);
        } catch (error) {
            return [true, {
                message: "fields_data has invalid JSON."
            }];
        }
        for (const formField of fieldDefinitions) {
            let fieldName = (typeof formField.label == 'undefined') ? formField.title : formField.label;
            let fieldDescription = (typeof formField.description == 'undefined') ? '' : formField.description;
            let fieldMandatoryEnabled = (typeof formField.validate == 'undefined') ? 0 : (formField.validate.required == true ? 1 : 0);
            let nextFieldId = (typeof formField.next_field_id == 'undefined') ? 0 : Number(formField.next_field_id);
            let fieldSequenceId = Number(formField.sequence_id);

            let dataTypeCategoryId = Number(formField.dataTypeCategoryId);

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
                            field_sequence_id: fieldSequenceId,
                            field_mandatory_enabled: fieldMandatoryEnabled,
                            field_preview_enabled: 0, // THIS NEEDS WORK
                            data_type_combo_id: comboEntry.dataTypeComboId,
                            data_type_combo_value: comboEntry.label,
                            data_type_id: Number(formField.dataTypeId),
                            next_field_id: nextFieldId
                        })
                        .then((fieldData) => {
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
                            field_preview_enabled: 0, // THIS NEEDS WORK
                            data_type_combo_id: comboEntry.dataTypeComboId,
                            data_type_combo_value: comboEntry.label,
                            data_type_id: Number(formField.dataTypeId),
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

                // Reset fieldId to 0, so it can be re-used by other fields
                // in the subsequent iterations
                fieldId = 0;

            } else {

                await workforceFormFieldMappingInsert(request, {
                        field_id: 0,
                        field_name: fieldName,
                        field_description: fieldDescription,
                        field_sequence_id: fieldSequenceId,
                        field_mandatory_enabled: fieldMandatoryEnabled,
                        field_preview_enabled: 0, // THIS NEEDS WORK
                        data_type_combo_id: 0,
                        data_type_combo_value: '',
                        data_type_id: Number(formField.dataTypeId),
                        next_field_id: nextFieldId
                    })
                    .then(async (fieldData) => {
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
            var queryString = '';

            var paramsArr = new Array(
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


   async function widgetAggrFieldValueUpdate(request) {

        let fieldUpdateStatus = [],
            error = false; // true;

        let paramsArr = new Array(
            request.activity_id,
            request.form_id,
            request.field_id,
            request.field_value,
            request.form_transaction_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            util.getCurrentUTCTime(),
        );
        let temp = {};
        let newReq = Object.assign({}, request);
        newReq.form_activity_id = request.activity_id;
        const queryString = util.getQueryString('ds_p1_widget_activity_field_transaction_update_field_value', paramsArr);
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
                    activityCommonService.widgetLogTrx(newReq, 1);
                })
                .catch((err) => {
                    console.log('FCS ERRRRRRRRRRRRRRROR : ', err);                    
                    temp.err = err;
                    newReq.inline_data = temp;
                    error = err;
                    activityCommonService.widgetLogTrx(newReq, 2);
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
                })
        }

        return [error, fieldData];
    }

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
                })
        }

        return [error, formFieldData];
    }

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
                })
        }

        return [error, fieldData];
    }

}

module.exports = FormConfigService;
