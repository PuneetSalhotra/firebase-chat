/*
 * author: Sri Sai Venkatesh
 */

function FormConfigService(objCollection) {

    var db = objCollection.db;
    var util = objCollection.util;
    var activityCommonService = objCollection.activityCommonService;
    var queueWrapper = objCollection.queueWrapper;
    var forEachAsync = objCollection.forEachAsync;

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
                        formatFromsListing(data, function (err, finalData) {
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
                        formatFromsListing(data, function (err, finalData) {
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
                        formatFromsListing(data, function (err, finalData) {
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
                        formatFromsListing(data, function (err, finalData) {
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
                        formatFromsListing(data, function (err, finalData) {
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
                        formatFromsListing(data, function (err, finalData) {
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
                        //formatFromsListing(data, function (err, finalData) {
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

    var formatFromsListing = function (data, callback) {
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
                "update_sequence_id": util.replaceDefaultNumber(rowData['update_sequence_id'])
            };
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
                    if(data.length > 0 ) {
                        activityCommonService.formatFormDataCollection(data, function (err, formattedData) {
                            (err === false) ? callback(false, { data: formattedData}, 200) : callback(true, {}, -9999);
                            });
                        } else {
                            callback(false, {}, 200);
                        }
                    } else {
                        callback(err, data, -9999)
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
                    if(data.length > 0 ) {
                        activityCommonService.formatFormDataCollection(data, function (err, formattedData) {
                            (err === false) ? callback(false, { data: formattedData}, 200) : callback(true, {}, -9999);
                            });
                        } else {
                            callback(false, {}, 200);
                        }
                    } else {
                        callback(err, data, -9999)
                    }
            });
        }
    };
    
    this.alterFormActivity = function(request, callback) {
      
        var logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;
        
        var activityInlineData = JSON.parse(request.activity_inline_data);       
        var newData = activityInlineData[0];
        console.log('newData from Request: ', newData);
        request.new_field_value = newData.field_value;
        
        activityCommonService.getActivityDetails(request, request.activity_id, (err, data)=>{
            if(err === false) {
                console.log('Data from activity_list: ', data);
                
                var retrievedInlineData = JSON.parse(data[0].activity_inline_data);               
                
                forEachAsync(retrievedInlineData, (next, row)=>{
                   if(Number(row.field_id) === Number(newData.field_id)) {
                       row.field_value = newData.field_value;
                   }
                   next();
                }).then(()=>{
                    
                    request.activity_inline_data = JSON.stringify(retrievedInlineData);
                    
                    getLatestUpdateSeqId(request).then((data)=>{
                        console.log('update_sequence_id : ', data.update_sequence_id);            
                        request.update_sequence_id = ++data.update_sequence_id;

                        putLatestUpdateSeqId(request, activityInlineData).then(()=>{

                            var event = {
                                name: "alterActivityInline",
                                service: "activityUpdateService",
                                method: "alterActivityInline",
                                payload: request       
                            };

                            queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                                if (err) {
                                    global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, req);                        
                                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                } else {}                            
                            });

                        }).catch((err)=>{
                            global.logger.write(err);
                        });

                    }).catch((err)=>{
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
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.form_transaction_id,
                request.form_id,
                request.field_id,
                request.organization_id
            );
            queryString = util.getQueryString('ds_p1_activity_form_transaction_select_field_sequence_id', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log('data from getLatestUpdateSeqId : ', data);
                    (err === false) ?  resolve(data[0]) : reject();
                });
            }
        });
    };
    
    function putLatestUpdateSeqId(request, activityInlineData){
        return new Promise((resolve, reject)=>{
            
            forEachAsync(activityInlineData, (next, row)=>{
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
                    '',  //IN p_location_datetime DATETIME                          26                    
                    );

                    //console.log('\x1b[32m addFormEntries params - \x1b[0m', params);
                    global.logger.write('debug', '\x1b[32m addFormEntries params - \x1b[0m' + JSON.stringify(params), {}, request);

                    var dataTypeId = Number(row.field_data_type_id);
                    console.log('dataTypeId : ', dataTypeId);
                    switch (dataTypeId) {
                        case 1:     // Date
                        case 2:     // future Date
                        case 3:     // past Date
                            params[9] = row.field_value;
                            break;
                        case 4:     // Date and time
                            params[10] = row.field_value;
                            break;
                        case 5:     //Number
                            //params[12] = row.field_value;
                            params[13] = row.field_value;
                            break;
                        case 6:     //Decimal
                            //params[13] = row.field_value;
                            params[14] = row.field_value;
                            break;
                        case 7:     //Scale (0 to 100)
                        case 8:     //Scale (0 to 5)
                            params[11] = row.field_value;
                            break;
                        case 9:     // Reference - Organization
                        case 10:    // Reference - Building
                        case 11:    // Reference - Floor
                        case 12:    // Reference - Person
                        case 13:    // Reference - Vehicle
                        case 14:    // Reference - Room
                        case 15:    // Reference - Desk
                        case 16:    // Reference - Assistant
                            //params[12] = row.field_value;
                            params[13] = row.field_value;
                            break;
                        case 50:    // Reference - File
                            params[13] = Number(JSON.parse(row.field_value).activity_id); // p_entity_bigint_1
                            params[18] = row.field_value; // p_entity_text_1
                            break;
                        case 17:    //Location
                            var location = row.field_value.split('|');
                            params[16] = location[0];
                            params[17] = location[1];
                            break;
                        case 18:    //Money with currency name
                            var money = row.field_value.split('|');
                            params[15] = money[0];
                            params[18] = money[1];
                            break;
                        case 19:    //Short Text
                            params[18] = request.new_field_value;
                            break;
                        case 20:    //Long Text
                            params[19] = row.field_value;
                            break;
                        case 21:    //Label
                            params[18] = row.field_value;
                            break;
                        case 22:    //Email ID
                            params[18] = row.field_value;
                            break;
                        case 23:    //Phone Number with Country Code
                            var phone = row.field_value.split('|');
                            params[13] = phone[0];  //country code
                            params[18] = phone[1];  //phone number
                            break;
                        case 24:    //Gallery Image
                        case 25:    //Camera Front Image
                        case 26:    //Video Attachment
                            params[18] = row.field_value;
                            break;
                        case 27:    //General Signature with asset reference
                        case 28:    //General Picnature with asset reference
                            var signatureData = row.field_value.split('|');
                            params[18] = signatureData[0];  //image path
                            params[13] = signatureData[1];  // asset reference
                            params[11] = signatureData[1];  // accepted /rejected flag
                            break;
                        case 29:    //Coworker Signature with asset reference
                        case 30:    //Coworker Picnature with asset reference
                            approvalFields.push(row.field_id);
                            var signatureData = row.field_value.split('|');
                            params[18] = signatureData[0];  //image path
                            params[13] = signatureData[1];  // asset reference
                            params[11] = signatureData[1];  // accepted /rejected flag
                            break;
                        case 31:    //Cloud Document Link
                            params[18] = row.field_value;
                            break;
                        case 32:    // PDF Document
                        case 51:    // PDF Scan
                            params[18] = row.field_value;
                            break;
                        case 33:    //Single Selection List
                            params[18] = row.field_value;
                            break;
                        case 34:    //Multi Selection List
                            params[18] = row.field_value;
                            break;
                        case 35:    //QR Code
                        case 36:    //Barcode
                            params[18] = row.field_value;
                            break;
                        case 38:    //Audio Attachment
                            params[18] = row.field_value;
                            break;
                        case 39:    //Flag
                            params[11] = row.field_value;
                    }
                    ;

                    params.push('');                                                    //IN p_device_manufacturer_name VARCHAR(50)
                    params.push('');                                                    // IN p_device_model_name VARCHAR(50)
                    params.push(request.device_os_id);                                  // IN p_device_os_id TINYINT(4)
                    params.push('');                                                    // IN p_device_os_name VARCHAR(50),
                    params.push('');                                                    // IN p_device_os_version VARCHAR(50)
                    params.push(request.app_version);                                   // IIN p_device_app_version VARCHAR(50)
                    params.push(request.api_version);                                   // IN p_device_api_version VARCHAR(50)
                    params.push(request.asset_id);                                      // IN p_log_asset_id BIGINT(20)
                    params.push(request.message_unique_id);                             // IN p_log_message_unique_id VARCHAR(50)
                    params.push(request.flag_retry || 0);                               // IN p_log_retry TINYINT(1)
                    params.push(request.flag_offline || 0);                             // IN p_log_offline TINYINT(1)
                    params.push(request.datetime_log);                                  // IN p_transaction_datetime DATETIME
                    params.push(request.datetime_log);                                  // IN p_log_datetime DATETIME
                    params.push(request.datetime_log);                                  // IN p_entity_datetime_2 DATETIME            
                    params.push(request.update_sequence_id);            

                    queryString = util.getQueryString('ds_p1_activity_form_transaction_insert_field_update', params);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {                    
                            next();
                            //(err === false) ?  resolve() : reject();
                        });
                    }
                })  .then(()=>{               
                        resolve();
                     });
            });  
    };
    
};

module.exports = FormConfigService;
