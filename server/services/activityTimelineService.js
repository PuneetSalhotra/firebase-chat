/*
 * author: Sri Sai Venkatesh
 */

function ActivityTimelineService(objectCollection) {

    var db = objectCollection.db;
    var cacheWrapper = objectCollection.cacheWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
    var activityPushService = objectCollection.activityPushService;

    this.addTimelineTransaction = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        var activityStreamTypeId = Number(request.activity_stream_type_id);
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        if (activityTypeCategoryId === 9 && activityStreamTypeId === 705) {   // add form case
            var formDataJson = JSON.parse(request.activity_timeline_collection);
            request.form_id = formDataJson[0]['form_id'];
            console.log('form id extracted from json is: ' + formDataJson[0]['form_id']);
            var lastObject = formDataJson[formDataJson.length - 1]
            console.log('Last object : ', lastObject)
            if (lastObject.hasOwnProperty('field_value')) {
                console.log('Has the field value in the last object')
                //remote Analytics
                if (request.form_id == 325) {
                    monthlySummaryTransInsert(request).then(() => {
                    });
                }
            }
            // add form entries
            addFormEntries(request, function (err, approvalFieldsArr) {
                if (err === false) {
                    //callback(false,{},200);
                } else {
                    //callback(true, {}, -9999);
                }
            });
        } else {
            request.form_id = 0;
        }
        var isAddToTimeline = true;
        if (request.hasOwnProperty('flag_timeline_entry'))
            isAddToTimeline = (Number(request.flag_timeline_entry)) > 0 ? true : false;
        if (isAddToTimeline) {
            activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {
                if (err) {

                } else {
                    activityPushService.sendPush(request, objectCollection, 0, function () {});
                    activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });

                    //updating log differential datetime for only this asset
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) { });
                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) { });
                    //if(request.hasOwnProperty('activity_timeline_collection'))
                    if (formDataJson.asset_reference.length > 0) {
                        forEachAsync(formDataJson.asset_reference, function (next, rowData) {
                            switch (Number(request.activity_type_category_id)) {
                                case 10:
                                case 11:
                                    activityPushService.sendSMSNotification(request, objectCollection, rowData.asset_id, function () {});
                                    break;
                            }
                            next();
                        }).then(function () {

                        });
                    }
                }
            });
        }
        callback(false, {}, 200);
    };


    //MONTHLY Remote Analytics
    //Insert into monthly summary table
    function monthlySummaryTransInsert(request) {
        return new Promise((resolve, reject) => {
            var dateTimeLog = util.getCurrentUTCTime();
            request['datetime_log'] = dateTimeLog;

            var avgHours;
            var occupiedDesks;
            var countDesks;
            var noOfDesks;
            getFormTransTimeCardsStats(request).then((data) => {
                request.viewee_workforce_id = request.workforce_id;
                activityCommonService.getOccupiedDeskCounts(request, function (err, result) {
                    if (err === false) {
                        occupiedDesks = result[0].occupied_desks;
                        if (occupiedDesks == 0) {
                            avgHours = 0;
                        } else {
                            avgHours = data[0].totalHours / result[0].occupied_desks;
                        }

                        request.flag = 11;
                        request.viewee_asset_id = request.asset_id;
                        request.viewee_operating_asset_id = request.operating_asset_id;

                        activityCommonService.assetAccessCounts(request, function (err, resp) {
                            if (err === false) {
                                countDesks = resp[0].countDesks;
                                (occupiedDesks > countDesks) ? noOfDesks = occupiedDesks : noOfDesks = countDesks;
                                //insert
                                var paramsArr = new Array(
                                        1, //request.monthly_summary_id,
                                        request.asset_id,
                                        request.workforce_id,
                                        request.account_id,
                                        request.organization_id,
                                        util.getStartDayOfMonth(), //entity_date_1,    //Monthly Month start Date
                                        "", //entity_datetime_1, 
                                        "", //entity_tinyint_1, 
                                        noOfDesks, //entity_bigint_1, //number of desks
                                        avgHours, //entity_double_1, //average hours
                                        data[0].assetHours, //entity_decimal_1, //total number of hours for a asset
                                        "", //entity_decimal_2,
                                        "", //entity_decimal_3, 
                                        data[0].totalHours, //entity_text_1, 
                                        "", //entity_text_2
                                        request.track_latitude,
                                        request.track_longitude,
                                        request.track_gps_accuracy,
                                        request.track_gps_status,
                                        request.track_gps_location,
                                        request.track_gps_datetime,
                                        request.device_manufacturer_name,
                                        request.device_model_name,
                                        request.device_os_id,
                                        request.device_os_name,
                                        request.device_os_version,
                                        request.app_version,
                                        request.api_version,
                                        request.asset_id,
                                        request.message_unique_id,
                                        request.flag_retry,
                                        request.flag_offline,
                                        request.track_gps_datetime,
                                        request.datetime_log
                                        );
                                var queryString = util.getQueryString('ds_v1_asset_monthly_summary_transaction_insert', paramsArr);
                                if (queryString != '') {
                                    db.executeQuery(0, queryString, request, function (err, data) {
                                        (err === false) ? resolve(data) : reject(err);
                                    });
                                }
                            } else {
                                //Some error -9999 
                            }
                        });
                    }
                });
            })
        })
    }



    //Get total hours of a employee or all employees in an organization
    function getFormTransTimeCardsStats(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    request.asset_id,
                    request.organization_id,
                    util.getStartDateTimeOfMonth(),
                    util.getEndDateTimeOfMonth()
                    );
            var queryString = util.getQueryString('ds_v1_activity_form_transaction_select_timecard_stats', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    console.log('getFormTransTimeCardsStats : \n', data, "\n");
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }
    //////////////////////////////////////////////////////////

    this.addTimelineComment = function (request, callback) {
        activityCommonService.updateAssetLocation(request, function (err, data) {});
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
        /*if (request.hasOwnProperty('device_os_id')) {
         if (Number(request.device_os_id) !== 5) {
         //incr the asset_message_counter
         cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
         if (err) {
         //console.log("error in setting in asset parity");
         global.logger.write('serverError','error in setting in asset parity - ' + err, request)
         } else
         //console.log("asset parity is set successfully")
         global.logger.write('debug','asset parity is set successfully', request)
         
         });
         }
         } */

    };

    this.retrieveFormFieldTimeline = function (request, callback) {
        var paramsArr = new Array(
                request.form_transaction_id,
                request.form_id,
                request.datetime_differential,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
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
                util.replaceQueryLimit(request.page_limit)
                );
        var queryString = util.getQueryString('ds_v1_activity_form_transaction_select_transaction', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                if (err === false) {
                    activityCommonService.formatFormDataCollection(data, function (err, responseData) {
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

        activityCommonService.resetAssetUnreadCount(request, 0, function (err, data) {});
        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
        var activityTypeCategoryId = util.replaceZero(request.activity_type_category_id);
        if (activityTypeCategoryId > 0) {
            var paramsArr = new Array(
                    request.organization_id,
                    request.activity_id,
                    request.timeline_transaction_id,
                    request.flag_previous,
                    request.page_start,
                    util.replaceQueryLimit(request.page_limit)
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

    //PAM
    this.retrieveTimelineListBasedOnAsset = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var paramsArr = new Array(
                request.organization_id,
                request.asset_id,
                request.timeline_transaction_id,
                request.flag_previous,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
                );
        var queryString = util.getQueryString('ds_v1_asset_timeline_transaction_select_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatAssetTimelineList(data, function (err, responseData) {
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

    //PAM
    var formatAssetTimelineList = function (data, callback) {
        var responseData = new Array();
        forEachAsync(data, function (next, rowData) {
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
            rowDataArr.workforce_name = util.replaceDefaultString(rowData['workforce_name']);
            rowDataArr.account_id = util.replaceDefaultNumber(rowData['account_id']);
            rowDataArr.account_name = util.replaceDefaultString(rowData['account_name']);
            rowDataArr.organization_id = util.replaceDefaultNumber(rowData['organization_id']);
            rowDataArr.organization_name = util.replaceDefaultString(rowData['organization_name']);
            rowDataArr.datetime_log = util.replaceDefaultDatetime(rowData['log_datetime']);
            rowDataArr.message_unique_id = rowData['log_message_unique_id'];
            rowDataArr.activity_timeline_text = '';
            rowDataArr.activity_timeline_url = '';
            rowDataArr.activity_timeline_collection = {};
            rowDataArr.activity_timeline_url_title = '';
            rowDataArr.log_message_unique_id = util.replaceDefaultNumber(rowData['log_message_unique_id']);
            rowDataArr.log_retry = util.replaceDefaultNumber(rowData['log_retry']);
            rowDataArr.log_offline = util.replaceDefaultNumber(rowData['log_offline']);
            rowDataArr.log_asset_id = util.replaceDefaultNumber(rowData['log_asset_id']);
            rowDataArr.log_asset_name = util.replaceDefaultString(rowData['log_asset_name']);
            rowDataArr.log_asset_image_path = util.replaceDefaultString(rowData['log_asset_image_path']);
            rowDataArr.log_datetime = util.replaceDefaultDatetime(rowData['log_datetime']);

            responseData.push(rowDataArr);
            next();
        }).then(function () {
            callback(false, responseData);
        });

    };

    var formatActivityTimelineList = function (data, activityTypeCategoryId, callback) {
        var responseData = new Array();
        forEachAsync(data, function (next, rowData) {
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
            //BETA
            rowDataArr.operating_asset_id = util.replaceDefaultNumber(rowData['operating_asset_id']);
            rowDataArr.operating_asset_first_name = util.replaceDefaultString(rowData['operating_asset_first_name']);
            rowDataArr.operating_asset_last_name = util.replaceDefaultString(rowData['operating_asset_last_name']);
            rowDataArr.operating_asset_image_path = util.replaceDefaultString(rowData['operating_asset_image_path']);
            rowDataArr.workforce_id = util.replaceDefaultNumber(rowData['workforce_id']);
            rowDataArr.workforce_name = util.replaceDefaultString(rowData['workforce_name']);
            rowDataArr.account_id = util.replaceDefaultNumber(rowData['account_id']);
            rowDataArr.account_name = util.replaceDefaultString(rowData['account_name']);
            rowDataArr.organization_id = util.replaceDefaultNumber(rowData['organization_id']);
            rowDataArr.organization_name = util.replaceDefaultString(rowData['organization_name']);
            rowDataArr.datetime_log = util.replaceDefaultDatetime(rowData['log_datetime']);
            rowDataArr.message_unique_id = rowData['log_message_unique_id'];
            rowDataArr.activity_timeline_text = '';
            rowDataArr.activity_timeline_url = '';
            rowDataArr.activity_timeline_collection = {};
            rowDataArr.activity_timeline_url_title = '';
            rowDataArr.data_entity_inline = rowData['data_entity_inline'] || {};

            //Added for Beta
            rowDataArr.activity_timeline_url_title = util.replaceDefaultString(rowData['data_entity_text_3']);
            rowDataArr.activity_timeline_url_preview = '';

            switch (activityTypeCategoryId) {
                case 1: //To do
                    switch (rowData['timeline_stream_type_id']) {
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
                    switch (rowData['timeline_stream_type_id']) {
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
                    switch (rowData['timeline_stream_type_id']) {
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
                    rowDataArr.activity_timeline_text = '';
                    rowDataArr.activity_timeline_url = '';
                    rowDataArr.activity_timeline_collection = {};
                    break;

                case 5: // coworker
                    switch (rowData['timeline_stream_type_id']) {
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
                    switch (rowData['timeline_stream_type_id']) {
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
                    switch (rowData['timeline_stream_type_id']) {
                        case 701:
                        case 702:
                        case 703:
                        case 704:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 705:
                        case 706:
                        case 707:
                        case 708:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 709:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                    }
                    ;
                case 10: // document
                    switch (rowData['timeline_stream_type_id']) {
                        case 301:
                        case 302:
                        case 303:
                        case 304:
                        case 305:
                        case 306:
                        case 307:
                        case 308:
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
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
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
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
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

                case 11: // Project
                    switch (rowData['timeline_stream_type_id']) {
                        case 1401:
                        case 1402:
                        case 1403:
                        case 1404:
                        case 1405:
                        case 1406:
                        case 1407:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1408:
                        case 1409:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                    }
                    ;
                    break;

                case 14: // Voice Call
                    switch (rowData['timeline_stream_type_id']) {
                        case 801:
                        case 802:
                        case 803:
                        case 804:
                        case 805:
                        case 806:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 807:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                        case 808:
                        case 809:
                        case 810:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }
                    ;
                    break;

                case 15: // Video Conference
                    switch (rowData['timeline_stream_type_id']) {
                        case 1601:
                        case 1602:
                        case 1603:
                        case 1604:
                        case 1605:
                        case 1606:
                        case 1607:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1608:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                    }
                    ;
                    break;

                case 32: // Customer Request
                    switch (rowData['timeline_stream_type_id']) {
                        case 601:
                        case 602:
                        case 603:
                        case 604:
                        case 605:
                        case 606:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 607:
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 608:
                        case 609:
                        case 610:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                        case 611:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }
                    ;
                    break;

                case 33: // Visitor Request
                    switch (rowData['timeline_stream_type_id']) {
                        case 1301:
                        case 1302:
                        case 1303:
                        case 1304:
                        case 1305:
                        case 1306:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1307:
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1308:
                        case 1309:
                        case 1310:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                        case 1311:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }
                    ;
                    break;

                case 34: // Timecard
                    switch (rowData['timeline_stream_type_id']) {
                        case 1501:
                        case 1502:
                        case 1503:
                        case 1504:
                        case 1505:
                        case 1506:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1507:
                            rowDataArr.activity_timeline_text = rowData['data_entity_text_2'];
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                        case 1508:
                        case 1509:
                        case 1510:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = rowData['data_entity_text_1'];
                            rowDataArr.activity_timeline_collection = {};
                            rowDataArr.activity_timeline_url_preview = util.replaceDefaultString(rowData['data_entity_text_2']);
                            break;
                        case 1511:
                            rowDataArr.activity_timeline_text = '';
                            rowDataArr.activity_timeline_url = '';
                            rowDataArr.activity_timeline_collection = {};
                            break;
                    }
                    ;
                    break;
                default:
                    break;

            }
            ;

            responseData.push(rowDataArr);
            next();
        }).then(function () {
            callback(false, responseData);
        });

    };

    var addFormEntries = function (request, callback) {
        var formDataJson = JSON.parse(request.activity_timeline_collection);
        var approvalFields = new Array();
        forEachAsync(formDataJson, function (next, row) {
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
                    '' //IN p_location_datetime DATETIME                            26
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
                case 9:     //Reference - Organization
                case 10:    //Reference - Building
                case 11:    //Reference - Floor
                case 12:    //Reference - Person
                case 13:    //Reference - Vehicle
                case 14:    //Reference - Room
                case 15:    //Reference - Desk
                case 16:    //Reference - Assistant
                    //params[12] = row.field_value;
                    params[13] = row.field_value;
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
                    params[18] = row.field_value;
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
                case 32:    //PDF Document
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
            params.push(row.message_unique_id);                                 // IN p_log_message_unique_id VARCHAR(50)
            params.push(request.flag_retry);                                    // IN p_log_retry TINYINT(1)
            params.push(request.flag_offline);                                  // IN p_log_offline TINYINT(1)
            params.push(request.track_gps_datetime);                            // IN p_transaction_datetime DATETIME
            params.push(request.datetime_log);                                  // IN p_log_datetime DATETIME

            //var queryString = util.getQueryString('ds_v1_activity_form_transaction_insert', params);
            var queryString = util.getQueryString('ds_v1_1_activity_form_transaction_insert', params); //BETA
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    next();
                    if (err === false) {
                        //success
                    } else {
                        //failure
                    }
                });
            } else {
                //callback(false, {}, -3303);
            }

        }).then(function () {
            callback(false, approvalFields);
        });
    };


}
;
module.exports = ActivityTimelineService;
