/*
 * author: Sri Sai Venkatesh
 */
'use strict';
var forEachAsync = require('forEachAsync').forEachAsync;
function ActivityTimelineService(objectCollection) {

    var db = objectCollection.db;
    var cacheWrapper = objectCollection.cacheWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var util = objectCollection.util;

    this.addTimelineTransaction = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        var activityStreamTypeId = Number(request.activity_stream_type_id);
        
        if (activityTypeCategoryId === 9 && activityStreamTypeId === 705) {   // add form case
            var formDataJson = JSON.parse(request.activity_timeline_collection);
            request.form_id = formDataJson[0]['form_id'];
            console.log('form id extracted from json is: '+formDataJson[0]['form_id']);
            // add form entries
            addFormEntries(request, function (err, response) {
                if (err === false) {
                    //callback(false,{},200);
                } else {
                    //callback(true, {}, -9999);
                }
            });
        }
        else{
            request.form_id = 0;
        }
        var isAddToTimeline = true;
        if (request.hasOwnProperty('flag_timeline_entry'))
            isAddToTimeline = (Number(request.flag_timeline_entry)) > 0 ? true : false;        
        if (isAddToTimeline) {
            activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                });
                //updating log differential datetime for only this asset
                activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {

                });

                activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {

                });
                if (request.hasOwnProperty('device_os_id')) {
                    if (Number(request.device_os_id) !== 5) {
                        //incr the asset_message_counter                        
                        cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                            if (err) {
                                console.log("error in setting in asset parity");
                            } else
                                console.log("asset parity is set successfully")

                        });
                    }
                }

            });

        }
        callback(false, {}, 200);

    };
    this.addTimelineComment = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        //IN p_form_transaction_id BIGINT(20), IN p_form_id BIGINT(20), IN p_field_id BIGINT(20), IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20), 
        //IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_stream_type_id SMALLINT(6), IN p_entity_text_1 VARCHAR(1200), IN p_entity_text_2 VARCHAR(4800), IN p_location_latitude DECIMAL(12,8), IN p_location_longitude DECIMAL(12,8), IN p_location_gps_accuracy DOUBLE(16,4), IN p_location_gps_enabled TINYINT(1), IN p_location_address VARCHAR(300), IN p_location_datetime DATETIME, IN p_device_manufacturer_name VARCHAR(50), IN p_device_model_name VARCHAR(50), IN p_device_os_id TINYINT(4), IN p_device_os_name VARCHAR(50), IN p_device_os_version VARCHAR(50), IN p_device_app_version VARCHAR(50), IN p_device_api_version VARCHAR(50), IN p_log_asset_id BIGINT(20), IN p_log_message_unique_id VARCHAR(50), IN p_log_retry TINYINT(1), IN p_log_offline TINYINT(1), IN p_transaction_datetime DATETIME, IN p_log_datetime DATETIME

        var paramsArr = new Array(
                request.form_transaction_id,
                request.form_id,
                request.form_field_id,
                request.activity_id,
                request.asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.activity_stream_type_id,
                request.comment_text,
                '',
                0.0,
                0.0,
                0.0,
                0,
                '',
                request.track_gps_datetime,
                '',
                '',
                request.device_os_id,
                '',
                '',
                request.app_version,
                request.api_version,
                request.asset_id,
                request.message_unique_id,
                request.flag_retry,
                request.flag_offline,
                request.track_gps_datetime,
                request.datetime_log

                );
        var queryString = util.getQueryString('ds_v1_activity_form_field_timeline_transaction_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                activityCommonService.updateWholeLotForTimelineComment(request, function (err, data) {});
                if (err === false) {
                    callback(false, {}, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, {}, 200);
                    return;
                }
            });
        }
        if (request.hasOwnProperty('device_os_id')) {
            if (Number(request.device_os_id) !== 5) {
                //incr the asset_message_counter                        
                cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                    if (err) {
                        console.log("error in setting in asset parity");
                    } else
                        console.log("asset parity is set successfully")

                });
            }
        }

    };

    this.retrieveFormFieldTimeline = function (request, callback) {
        var paramsArr = new Array(
                request.form_transaction_id,
                request.form_id,
                request.datetime_differential,
                request.page_start,
                request.page_limit
                );
        var queryString = util.getQueryString('ds_v1_activity_form_field_timeline_transaction_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatFormFieldTimeline(data, function (err, responseData) {
                        if (err === false) {
                            callback(false, {data: responseData}, 200);
                        } else {
                            callback(false, {}, -9999)
                        }
                    });
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    this.retrieveFormCollection = function (request, callback) {
        //var activityTypeCategoryId = util.replaceZero(request.activity_type_category_id);
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var paramsArr = new Array(
                request.form_transaction_id,
                request.form_id,
                request.datetime_differential,
                request.page_start,
                request.page_limit
                );
        var queryString = util.getQueryString('ds_v1_activity_form_transaction_select_transaction', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                if (err === false) {
                    formatFormDataCollection(data, function (err, responseData) {
                        if (err === false) {
                            callback(false, {data: responseData}, 200);
                            return;
                        } else {
                            callback(false, {}, -9999)
                            return
                        }
                    });
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    this.retrieveTimelineList = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        activityCommonService.resetAssetUnreadCount(request, function (err, data) {});
        var activityTypeCategoryId = util.replaceZero(request.activity_type_category_id);
        if (activityTypeCategoryId > 0) {
            var paramsArr = new Array(
                    request.organization_id,
                    request.activity_id,
                    request.timeline_transaction_id,
                    request.flag_previous,
                    request.page_start,
                    request.page_limit
                    );
            var queryString = util.getQueryString('ds_v1_activity_timeline_transaction_select_differential', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        formatActivityTimelineList(data, activityTypeCategoryId, function (err, responseData) {
                            if (err === false) {
                                callback(false, {data: responseData}, 200);
                            } else {
                                callback(false, {}, -9999)
                            }
                        });
                        return;
                    } else {
                        // some thing is wrong and have to be dealt
                        callback(err, false, -9999);
                        return;
                    }
                });
            }

        } else {
            callback(false, {}, -3303);
        }

    };

    var formatFormFieldTimeline = function (data, callback) {
        var responseData = new Array();
        forEachAsync(data, function (next, rowData) {
            var rowDataArr = {};

            rowDataArr.timeline_transaction_id = util.replaceDefaultNumber(rowData['timeline_transaction_id']);
            rowDataArr.timeline_form_transaction_id = util.replaceDefaultNumber(rowData['timeline_form_transaction_id']);
            rowDataArr.form_id = util.replaceDefaultNumber(rowData['timeline_form_id']);
            rowDataArr.field_id = util.replaceDefaultNumber(rowData['timeline_field_id']);
            rowDataArr.comment_text = util.replaceDefaultString(rowData['timeline_entity_text_1']);
            rowDataArr.activity_id = util.replaceDefaultNumber(rowData['activity_id']);
            rowDataArr.asset_id = util.replaceDefaultNumber(rowData['asset_id']);
            rowDataArr.asset_first_name = util.replaceDefaultString(rowData['asset_first_name']);
            rowDataArr.asset_last_name = util.replaceDefaultString(rowData['asset_last_name']);
            rowDataArr.workforce_id = util.replaceDefaultNumber(rowData['workforce_id']);
            rowDataArr.workforce_name = util.replaceDefaultString(rowData['workforce_name']);
            rowDataArr.account_id = util.replaceDefaultNumber(rowData['account_id']);
            rowDataArr.account_name = util.replaceDefaultString(rowData['account_name']);
            rowDataArr.organization_id = util.replaceDefaultNumber(rowData['organization_id']);
            rowDataArr.organization_name = util.replaceDefaultString(rowData['organization_name']);
            rowDataArr.datetime_log = util.replaceDefaultDatetime(rowData['log_datetime']);
            responseData.push(rowDataArr);
            next();
        }).then(function () {
            callback(false, responseData);
        });

    };



    var formatFormDataCollection = function (data, callback) {
        var responseData = new Array();
        forEachAsync(data, function (next, rowData) {
            var rowDataArr = {};
            rowDataArr.activity_id = util.replaceDefaultNumber(rowData['activity_id']);
            rowDataArr.activity_title = util.replaceDefaultString(rowData['activity_title']);
            rowDataArr.asset_id = util.replaceDefaultNumber(rowData['asset_id']);
            rowDataArr.asset_first_name = util.replaceDefaultString(rowData['asset_first_name']);
            rowDataArr.asset_last_name = util.replaceDefaultString(rowData['asset_last_name']);
            rowDataArr.workforce_id = util.replaceDefaultNumber(rowData['workforce_id']);
            rowDataArr.workforce_name = util.replaceDefaultString(rowData['workforce_name']);
            rowDataArr.account_id = util.replaceDefaultNumber(rowData['account_id']);
            rowDataArr.account_name = util.replaceDefaultString(rowData['account_name']);
            rowDataArr.organization_id = util.replaceDefaultNumber(rowData['organization_id']);
            rowDataArr.organization_name = util.replaceDefaultString(rowData['organization_name']);
            rowDataArr.form_transaction_id = util.replaceDefaultNumber(rowData['form_transaction_id']);
            rowDataArr.form_transaction_datetime = util.replaceDefaultDatetime(rowData['form_transaction_id']);
            rowDataArr.form_id = util.replaceDefaultNumber(rowData['form_id']);
            rowDataArr.form_name = util.replaceDefaultString(rowData['form_name']);
            rowDataArr.field_id = util.replaceDefaultNumber(rowData['field_id']);
            rowDataArr.field_name = util.replaceDefaultString(rowData['field_name']);
            rowDataArr.field_sequence_id = util.replaceDefaultNumber(rowData['field_sequence_id']);
            rowDataArr.field_mandatory_enabled = util.replaceDefaultNumber(rowData['field_mandatory_enabled']);
            rowDataArr.field_preview_enabled = util.replaceZero(rowData['field_preview_enabled']);
            rowDataArr.data_type_combo_id = util.replaceZero(rowData['data_type_combo_id']);
            rowDataArr.data_type_combo_value = util.replaceZero(rowData['data_type_combo_value']);
            rowDataArr.data_type_id = util.replaceDefaultString(rowData['data_type_id']);
            rowDataArr.data_type_name = util.replaceDefaultString(rowData['data_type_name']);
            rowDataArr.data_type_category_id = util.replaceDefaultNumber(rowData['data_type_category_id']);
            rowDataArr.data_type_category_name = util.replaceDefaultString(rowData['data_type_category_name']);
            rowDataArr.message_unique_id = rowData['log_message_unique_id'];
            rowDataArr.datetime_log = util.replaceDefaultDatetime(rowData['log_datetime']);
            //rowDataArr.field_value = '';                
            getFieldValue(rowData, function (err, fieldValue) {
                if (err) {
                    console.log(err);
                    console.log('error occured');
                }
                rowDataArr.field_value = fieldValue;
                responseData.push(rowDataArr);
                next();
            });
        }).then(function () {
            callback(false, responseData);
        });

    };

    var getFieldValue = function (rowData, callback) {
        var fieldValue;        
        var dataTypeId = Number(rowData['data_type_id']);        
        switch (dataTypeId) {
            case 1:     //Date
            case 2:     //Future Date
            case 3:     //Past Date
                fieldValue = util.replaceDefaultDate(rowData['data_entity_date_1']);
                break;
            case 4:     //Date and Time
                fieldValue = util.replaceDefaultDatetime(rowData['data_entity_datetime_1']);
                break;
            case 5:     //Number
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_bigint_1']);
                break;
            case 6:     //Decimal
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_double_1']);
                break;
            case 7:     //Scale (0 to 100)
            case 8:     //Scale (0 to 5)
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_tinyint_1']);
                break;
            case 9:     //Reference - Organization
            case 10:    //Reference - Building
            case 11:    //Reference - Floor
            case 12:    //Reference - Person
            case 13:    //Reference - Vehicle
            case 14:    //Reference - Room
            case 15:    //Reference - Desk
            case 16:    //Reference - Assistant
                fieldValue = util.replaceZero(rowData['data_entity_bigint_1']);
                break;
            case 17:    //Location
                fieldValue = rowData['data_entity_decimal_2'] + '|' + rowData['data_entity_decimal_3'];
                break;
            case 18:    //Money with currency name
                fieldValue = rowData['data_entity_decimal_1'] + '|' + rowData['data_entity_text_1'];
                break;
            case 19:    //short text
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 20:    //long text
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_2']);
                break;
            case 21:    //Label
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 22:    //Email ID
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 23:    //Phone Number with Country Code
                fieldValue = rowData['data_entity_bigint_1'] + '|' + rowData['data_entity_text_1'];
                break;
            case 24:    //Gallery Image
            case 25:    //Camera Image            
            case 26:    //Video Attachment
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 27:    //General Signature with asset reference
            case 28:    //General Picnature with asset reference
            case 29:    //Coworker Signature with asset reference
            case 30:    //Coworker Picnature with asset reference
                fieldValue = rowData['data_entity_text_1'] + '|' + rowData['data_entity_bigint_1'] + '|' + rowData['data_entity_tinyint_1'];
                break;
            case 31:    //Cloud Document Link
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 32:    //PDF Document
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 33:    //Single Selection List
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 34:    //multiple Selection List
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 35:    //QR Code
            case 36:    //QR Code
            case 38:    //Audio Attachment
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 39:
                break;
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_tinyint_1']);
            default:
                console.log('came into default for data type id: ' + dataTypeId);
                fieldValue = ''
                break;
        }
        ;
        //console.log(fieldValue, 'datatype of fieldvalue is '+ typeof fieldValue);

        callback(false, fieldValue);
    };

    var formatActivityTimelineList = function (data, activityTypeCategoryId, callback) {
        var responseData = new Array();
        data.forEach(function (rowData, index) {
            var rowDataArr = {};
            rowDataArr.activity_id = util.replaceDefaultNumber(rowData['activity_id']);
            rowDataArr.activity_type_id = util.replaceDefaultNumber(rowData['activity_type_id']);
            rowDataArr.activity_type_category_id = util.replaceDefaultNumber(rowData['activity_type_category_id']);
            rowDataArr.timeline_transaction_id = util.replaceDefaultNumber(rowData['timeline_transaction_id']);
            rowDataArr.timeline_transaction_datetime = util.replaceDefaultDatetime(rowData['timeline_transaction_datetime']);
            rowDataArr.timeline_stream_type_id = util.replaceDefaultNumber(rowData['timeline_stream_type_id']);
            rowDataArr.timeline_stream_type_name = util.replaceDefaultString(rowData['timeline_stream_type_name']);
            rowDataArr.asset_id = util.replaceDefaultNumber(rowData['asset_id']);
            rowDataArr.asset_first_name = util.replaceDefaultString(rowData['asset_first_name']);
            rowDataArr.asset_last_name = util.replaceDefaultString(rowData['asset_last_name']);
            rowDataArr.asset_image_path = util.replaceDefaultString(rowData['asset_image_path']);
            rowDataArr.workforce_id = util.replaceDefaultNumber(rowData['workforce_id']);
            rowDataArr.workforce_name = util.replaceDefaultNumber(rowData['workforce_name']);
            rowDataArr.account_id = util.replaceDefaultNumber(rowData['account_id']);
            rowDataArr.account_name = util.replaceDefaultString(rowData['account_name']);
            rowDataArr.organization_id = util.replaceDefaultNumber(rowData['organization_id']);
            rowDataArr.organization_name = util.replaceDefaultString(rowData['organization_name']);
            rowDataArr.datetime_log = util.replaceDefaultDatetime(rowData['log_datetime']);
            rowDataArr.message_unique_id = rowData['log_message_unique_id'];
            rowDataArr.activity_timeline_text = '';
            rowDataArr.activity_timeline_url = '';
            rowDataArr.activity_timeline_collection = {};

            switch (activityTypeCategoryId) {
                case 1: //To do

                    switch (rowData['streamtype_id']) {
                        case 401:
                        case 402:
                        case 403:
                        case 404:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }
                    ;
                    break;
                case 2: //  notepad
                    switch (rowData['streamtype_id']) {
                        case 501:
                        case 502:
                        case 503:
                        case 504:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }
                    ;
                    break;

                case 3: //plant // not yet defined
                    switch (rowData['streamtype_id']) {
                        case 101:
                            rowDataArr.activity_timeline_text = '';
                            break;
                        case 102:
                            rowDataArr.activity_timeline_text = '';
                            break;
                        case 103:
                            rowDataArr.activity_timeline_text = '';
                            break;
                    }
                    ;
                    break;

                case 4: // employee id card
                    /*
                     switch (rowData['streamtype_id']) {
                     case 101:
                     rowDataArr.activity_timeline_text = '';
                     break;
                     case 102:
                     rowDataArr.activity_timeline_text = '';
                     break;
                     case 103:
                     rowDataArr.activity_timeline_text = '';
                     break;
                     };
                     */
                    rowDataArr.activity_timeline_text = '';
                    rowDataArr.activity_timeline_url = '';
                    rowDataArr.activity_timeline_collection = {};
                    break;

                case 5: // coworker
                    switch (rowData['streamtype_id']) {
                        case 101:

                            break;
                        case 102:

                            break;
                        case 103:
                            rowDataArr.activity_timeline_text = '';
                            break;
                    }
                    ;
                    break;

                case 6: // external contact card
                    switch (rowData['streamtype_id']) {
                        case 101:
                            rowDataArr.activity_timeline_text = '';
                            break;
                        case 102:
                            rowDataArr.activity_timeline_text = '';
                            break;
                        case 103:
                            rowDataArr.activity_timeline_text = '';
                            break;
                    }
                    ;
                    break;
                case 9: // form
                    switch (rowData['streamtype_id']) {
                        case 101:
                            rowDataArr.activity_timeline_text = '';
                            break;
                        case 102:
                            rowDataArr.activity_timeline_text = '';
                            break;
                        case 103:
                            rowDataArr.activity_timeline_text = '';
                            break;
                    }
                    ;
                case 10: // document
                    switch (rowData['streamtype_id']) {
                        case 301:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 302:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 303:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 304:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 305:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 306:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 307:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 308:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 309:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 310:
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 311:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 312:
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 313:   //Added form on to the Document
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 314:   //Added Cloud based Document link on to the Document
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 315:   //Added Email conversation on to the Document
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = rowData['data_entity_text_1'];
                            break;
                        case 316:   //Added notepad on to the Document
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = rowData['data_entity_text_1'];
                            break;
                    }
                    ;
                    break;
                default:
                    break;

            }
            ;

            responseData.push(rowDataArr);
        }, this);
        callback(false, responseData);
    };

    var addFormEntries = function (request, callback) {

        var formDataJson = JSON.parse(request.activity_timeline_collection);

        formDataJson.forEach(function (row, index) {
            if (row.hasOwnProperty('data_type_combo_id')) {
                var datatypeComboId = row.data_type_combo_id;
            } else
                var datatypeComboId = 0;
            var params = new Array(
                    request.form_transaction_id, //0
                    row.form_id, //1                    
                    row.field_id, //2
                    datatypeComboId, //3
                    request.activity_id, //4
                    request.asset_id, //5
                    request.workforce_id, //6
                    request.account_id, //7
                    request.organization_id, //8
                    '', //IN p_entity_date_1 DATE                                   9
                    '', //IN p_entity_datetime_1 DATETIME                           10
                    '', //IN p_entity_tinyint_1 TINYINT(4)                          11
                    '', //IN p_entity_bigint_1 BIGINT(20)                           12
                    '', //IN p_entity_double_1 DOUBLE(16,4),                        13
                    '', //IN p_entity_decimal_1 DECIMAL(14,2)                       14
                    '', //IN p_entity_decimal_2 DECIMAL(14,8)                       15
                    '', //IN p_entity_decimal_3 DECIMAL(14,8)                       16
                    '', //IN p_entity_text_1 VARCHAR(1200)                          17
                    '', //IN p_entity_text_2 VARCHAR(4800)                          18
                    '', //IN p_location_latitude DECIMAL(12,8)                      19
                    '', // IN p_location_longitude DECIMAL(12,8)                    20
                    '', //IN p_location_gps_accuracy DOUBLE(16,4)                   21
                    '', //IN p_location_gps_enabled TINYINT(1)                      22
                    '', //IN p_location_address VARCHAR(300)                        23
                    '' //IN p_location_datetime DATETIME                            24
                    );

            var dataTypeId = Number(row.field_data_type_id);
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
                    params[12] = row.field_value;
                    break;
                case 6:     //Decimal
                    params[13] = row.field_value;
                    break;
                case 7:     //Scale (0 to 100)
                case 8:     //Scale (0 to 5)
                    params[11] = row.field_value;
                    break;
                case 9:     //Reference - Organization
                case 10:    //Reference - Building
                case 11:    //Reference - Floor
                case 12:    //Reference - Person
                case 13:    //Reference - Vehicle
                case 14:    //Reference - Room
                case 15:    //Reference - Desk
                case 16:    //Reference - Assistant
                    params[12] = row.field_value;
                    break;
                case 17:    //Location
                    var location = row.field_value.split('|');
                    params[15] = location[0];
                    params[16] = location[1];
                    break;
                case 18:    //Money with currency name
                    var money = row.field_value.split('|');
                    params[14] = money[0];
                    params[17] = money[1];
                    break;
                case 19:    //Short Text                    
                    params[17] = row.field_value;
                    break;
                case 20:    //Long Text
                    params[18] = row.field_value;
                    break;
                case 21:    //Label
                    params[17] = row.field_value;
                    break;
                case 22:    //Email ID
                    params[17] = row.field_value;
                    break;
                case 23:    //Phone Number with Country Code
                    var phone = row.field_value.split('|');
                    params[12] = phone[0];  //country code
                    params[17] = phone[1];  //phone number
                    break;
                case 24:    //Gallery Image
                case 25:    //Camera Front Image                
                case 26:    //Video Attachment
                    params[17] = row.field_value;
                    break;
                case 27:    //General Signature with asset reference
                case 28:    //General Picnature with asset reference
                case 29:    //Coworker Signature with asset reference
                case 30:    //Coworker Picnature with asset reference
                    var signatureData = row.field_value.split('|');
                    params[17] = signatureData[0];  //image path
                    params[12] = signatureData[1];  // asset reference
                    params[11] = signatureData[1];  // accepted /rejected flag
                    break;
                case 31:    //Cloud Document Link
                    params[17] = row.field_value;
                    break;
                case 32:    //PDF Document
                    params[17] = row.field_value;
                    break;
                case 33:    //Single Selection List
                    params[17] = row.field_value;
                    break;
                case 34:    //Multi Selection List
                    params[17] = row.field_value;
                    break;
                case 35:    //QR Code                    
                case 36:    //Barcode
                    params[17] = row.field_value;
                    break;
                case 38:    //Audio Attachment
                    params[17] = row.field_value;
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
            params.push(row.message_unique_id);                                 // IN p_log_message_unique_id VARCHAR(50)
            params.push(request.flag_retry);                                    // IN p_log_retry TINYINT(1)
            params.push(request.flag_offline);                                  // IN p_log_offline TINYINT(1)
            params.push(request.track_gps_datetime);                            // IN p_transaction_datetime DATETIME
            params.push(request.datetime_log);                                  // IN p_log_datetime DATETIME

            var queryString = util.getQueryString('ds_v1_activity_form_transaction_insert', params);

            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        //success
                    } else {
                        //failure
                    }
                });
            } else {
                //callback(false, {}, -3303);
            }
        }, this);
        callback(false, true);
    };


}
;
module.exports = ActivityTimelineService;
