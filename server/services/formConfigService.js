/*
 * author: Sri Sai Venkatesh
 */

function FormConfigService(objCollection) {

    var db = objCollection.db;
    var util = objCollection.util;
    var activityCommonService = objCollection.activityCommonService;
    var queueWrapper = objCollection.queueWrapper;

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
        
        //activityCommonService.updateAssetLocation(request, function (err, data) {});        
        
        getLatestUpdateSeqId(request).then((data)=>{
            console.log('update_sequence_id : ', data.update_sequence_id);            
            request.update_sequence_id = ++data.update_sequence_id;
            
            putLatestUpdateSeqId(request).then(()=>{
                
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
        })
        
        
        
        
        //Updating the following for all collaborators except the current asset
        //1) activity_datetime_last_updated
        //2) activity_datetime_last_differential
        //3) asset_unread_updates_count        
        //activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});
        
        //Updating the following for the current collaborator
        //1) activity_datetime_last_differential
        //2) activity_datetime_last_seen
        //activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {});
        
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
                    console.log('data from getLatestUpdateSeqId : ', data);
                    (err === false) ?  resolve(data[0]) : reject();
                });
            }
        });
    };
    
    function putLatestUpdateSeqId(request){
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(              
                request.form_transaction_id,
                request.form_id,
                request.field_id,
                request.data_type_combo_id || 0,
                request.activity_id,
                request.asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.entity_date_1 || '1970-01-01 00:00:00',
                request.entity_datetime_1 || '1970-01-01 00:00:00',
                request.entity_tinyint_1,
                request.entity_tinyint_2,
                request.entity_bigint_1,
                request.entity_double_1,
                request.entity_decimal_1,
                request.entity_decimal_2,
                request.entity_decimal_3,
                request.entity_text_1 || "",
                request.entity_text_2 || "",
                request.entity_text_3 || "",
                request.track_latitude,
                request.track_longitude,
                request.track_gps_accuracy,
                request.track_gps_enabled,
                request.track_gps_location,
                request.track_gps_datetime,
                request.device_manufacturer_name,
                request.device_model_name,
                request.device_os_id,
                request.device_os_name,
                request.device_os_version,
                request.device_app_version,
                request.device_api_version,
                request.asset_id, //log_asset_id
                request.message_unique_id,
                request.log_retry,
                request.log_offline,
                request.transaction_datetime,
                request.log_datetime,
                request.entity_datetime_2,
                request.update_sequence_id
            );
            queryString = util.getQueryString('ds_p1_activity_form_transaction_insert_field_update', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {                    
                    (err === false) ?  resolve() : reject();
                });
            }
        });
    };

};

module.exports = FormConfigService;
