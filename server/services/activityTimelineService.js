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
        var activityTypeCategoryId = request.activity_type_category_id;
        var activityStreamTypeId = Number(request.activity_stream_type_id);

        if (activityStreamTypeId === 705 || activityStreamTypeId === 313) {   // add form case
            // add form entries
            addFormEntries(request, function (err, response) {
                if (err === false) {
                    //callback(false,{},200);
                } else {
                    //callback(true, {}, -9999);
                }
            });
        }
        var isAddToTimeline = request.hasOwnProperty('flag_timeline_entry') ? false : true;
        if (isAddToTimeline) {
            activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                });
                //updating log differential datetime for only this asset
                activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {

                });

                activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {

                });

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
                if (err === false) {
                    //console.log(data);
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
            console.log(rowData.data_type_id + ' is data type id');

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
            rowDataArr.data_type_id = util.replaceDefaultNumber(rowData['data_type_id']);
            rowDataArr.data_type_name = util.replaceDefaultString(rowData['data_type_name']);
            rowDataArr.data_type_category_id = util.replaceDefaultNumber(rowData['data_type_category_id']);
            rowDataArr.data_type_category_name = util.replaceDefaultString(rowData['data_type_category_name']);
            rowDataArr.message_unique_id = rowData['log_message_unique_id'];
            rowDataArr.datetime_log = util.replaceDefaultDatetime(rowData['log_datetime']);
            //rowDataArr.field_value = '';                
            getFieldValue(rowData, function (err, fieldValue) {                
                if(err){
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
        var fieldValue = '';
        //console.log(rowData);
        var dataTypeId = Number(rowData['data_type_id']);
        console.log(typeof dataTypeId, 'dataype '+dataTypeId);
        switch (dataTypeId) {
            case 1://Date
                fieldValue = rowData['data_entity_date_1'];                
                break;
            case 2://Date and Time
                fieldValue = rowData['data_entity_datetime_1'];                
                break;
            case 3://Counter
                fieldValue = rowData['data_entity_tinyint_1'];
                break;
            case 4://Number
                fieldValue = rowData['data_entity_bigint_1'];
                break;
            case 5://Percentage
                fieldValue = rowData['data_entity_tinyint_1'];
                break;
            case 6://Reference - Organization

            case 7://Reference - Account

            case 8://Reference - WorkForce

            case 9://Reference - Asset Type

            case 10://Reference - Asset

            case 11://Reference - Activity Type

            case 12://Reference - Activity

            case 13://Reference - Activity Status
                fieldValue = rowData['data_entity_bigint_1'];
                break;
            case 14://Decimal
                fieldValue = rowData['data_entity_decimal_1'];
                break;
            case 15://Location
                fieldValue = rowData['data_entity_decimal_2'] + '|' + rowData['data_entity_decimal_3'];
                break;
            case 16://Money
                fieldValue = rowData['data_entity_decimal_1'];
                break;
            case 17://Title
                fieldValue = rowData['data_entity_text_1'];                
                break;
            case 18://Description
                fieldValue = rowData['data_entity_text_1'];
                break;
            case 19://Label
                fieldValue = rowData['data_entity_text_1'];
                break;
            case 20://Email ID
                fieldValue = rowData['data_entity_text_1'];
                break;
            case 21://Phone Number with Country Code
                fieldValue = rowData['data_entity_bigint_1'] + '|' + rowData['data_entity_text_1'];
                break;
            case 22://Gallery Image

            case 23://Camera Front Image

            case 24://Camera Back Image
                fieldValue = rowData['data_entity_text_1'];
                break;
            case 25://Signature

            case 26://Picnature
                fieldValue = rowData['data_entity_text_1'] + '|' + rowData['data_entity_bigint_1'] + '|' + rowData['data_entity_bigint_1'];
                break;
            case 27://Audio Attachment
                fieldValue = rowData['data_entity_text_1'];
                break;
            case 28://Video Attachment
                fieldValue = rowData['data_entity_text_1'];
                break;
            case 29://Cloud Document
                fieldValue = rowData['data_entity_text_1'];
                break;
            case 30://Single Selection List
                fieldValue = rowData['data_entity_tinyint_1'] + '|' + rowData['data_entity_text_1'];
                break;
            case 31://Multi Selection List
                fieldValue = JSON.parse(rowData['data_entity_text_2']);
                break;
            case 32://QR Code
                break;
            case 33://Data Interface
                break;
            case 34://Web Link
                break;
            case 35://General Signature with asset reference
                break;
            case 36://General Picnature with asset reference
                break;
            case 37://Coworker Signature with asset reference
                break;
            case 38://Coworker Picnature with asset reference
                break;
            default:
                console.log('came into default');
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
                            rowDataArr.activity_timeline_text = rowData['entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 311:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 312:
                            rowDataArr.activity_timeline_text = rowData['entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 313:   //Added form on to the Document
                            rowDataArr.activity_timeline_text = rowData['entity_text_1'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 314:   //Added Cloud based Document link on to the Document
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 315:   //Added Email conversation on to the Document
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = rowData['entity_text_1'];
                            break;
                        case 316:   //Added notepad on to the Document
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = rowData['entity_text_1'];
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

        var formDataJson = JSON.parse((request.activity_timeline_collection));

        formDataJson.forEach(function (row, index) {
            if (formDataJson.hasOwnProperty('data_type_combo_id')) {
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
                case 1://Date
                    params[9] = row.field_value;
                    break;
                case 2://Date and Time
                    params[10] = row.field_value;
                    //console.log(params[10] );
                    break;
                case 3://Counter
                    params[11] = row.field_value;
                    break;
                case 4://Number
                    params[12] = row.field_value;
                    break;
                case 5://Percentage
                    params[11] = row.field_value;
                    break;
                case 6://Reference - Organization

                case 7://Reference - Account

                case 8://Reference - WorkForce

                case 9://Reference - Asset Type

                case 10://Reference - Asset

                case 11://Reference - Activity Type

                case 12://Reference - Activity

                case 13://Reference - Activity Status
                    params[11] = row.field_value;
                    break;
                case 14://Decimal
                    params[14] = row.field_value;
                    break;
                case 15://Location
                    var location = row.field_value.split('|');
                    params[15] = location[0];
                    params[16] = location[1];
                    break;
                case 16://Money
                    params[14] = row.field_value;
                    break;
                case 17://Title
                    break;
                    params[17] = row.field_value;
                case 18://Description
                    params[18] = row.field_value;
                    break;
                case 19://Label
                    params[17] = row.field_value;
                    break;
                case 20://Email ID
                    params[17] = row.field_value;
                    break;
                case 21://Phone Number with Country Code
                    var phone = row.field_value.split('|');
                    params[12] = phone[0];
                    params[17] = phone[1];
                    break;
                case 22://Gallery Image

                case 23://Camera Front Image

                case 24://Camera Back Image
                    params[17] = row.field_value;
                    break;
                case 25://Signature

                case 26://Picnature
                    var signatureData = row.field_value.split('|');
                    params[17] = signatureData[0];  //image path
                    params[12] = signatureData[1];  // asset reference
                    params[11] = signatureData[1];  // accepted /rejected flag
                    break;
                case 27://Audio Attachment
                    params[17] = row.field_value;
                    break;
                case 28://Video Attachment
                    params[17] = row.field_value;
                    break;
                case 29://Cloud Document
                    params[17] = row.field_value;
                    break;
                case 30://Single Selection List
                    var comboData = row.field_value.split('|');
                    params[11] = comboData[0];
                    params[17] = comboData[0];
                    break;
                case 31://Multi Selection List                    
                    params[18] = row.field_value;
                    break;
                case 32://QR Code
                    break;
                case 33://Data Interface
                    break;
                case 34://Web Link
                    break;
                case 35://General Signature with asset reference
                    
                case 36://General Picnature with asset reference
                    
                case 37://Coworker Signature with asset reference
                    
                case 38://Coworker Picnature with asset reference
                    /*
                     * "data_entity_cloud_path (Image)
                        data_entity_bigint_1 (Asset Reference)
                        data_entity_tinyint_1 (Approved/Rejected)"
                     */
                    var approvalData = row.field_value.split('|');
                    params[17] = approvalData[0];
                    params[11] = approvalData[1];
                    params[11] = approvalData[2];
                    break;
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
