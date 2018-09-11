/*
 * author: Nani Kalyan V
 */

function PamListingService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;


    this.getOrdersUnderAReservation = function (request, callback) {
        var paramsArr = new Array(
            request.reservation_id,
            request.order_activity_type_category_id,
            request.access_role_id,
            request.organization_id,
            request.start_limit,
            request.end_limit
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_sub_tasks_category', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatOrdersData(data).then((finalData) => {
                        callback(false, finalData, 200);
                    });
                } else {
                    callback(false, {}, -9999);
                }
            });
        }
    };

    function formatOrdersData(data) {
        return new Promise((resolve, reject) => {
            var responseArr = new Array();
            forEachAsync(data, function (next, row) {
                var rowData = {
                    'activity_id': util.replaceDefaultNumber(row['activity_id']),
                    'activity_title': util.replaceDefaultString(row['activity_title']),
                    'activity_status_type_id': util.replaceDefaultNumber(row['activity_status_type_id']),
                    'activity_status_type_name': util.replaceDefaultString(row['activity_status_type_name']),
                    'activity_status_id': util.replaceDefaultNumber(row['activity_status_id']),
                    'activity_status_name': util.replaceDefaultString(row['activity_status_name']),
                    'activity_priority_enabled': util.replaceDefaultNumber(row['activity_priority_enabled']),
                    'activity_inline_data': JSON.parse(util.replaceDefaultString(row['activity_inline_data'])),
                    'activity_datetime_start_expected': util.replaceDefaultDatetime(row['activity_datetime_start_expected']),
                    'activity_sub_type_name': util.replaceDefaultString(row['activity_sub_type_name']),
                    'parent_activity_title': util.replaceDefaultString(row['parent_activity_title']),
                    'channel_activity_id': util.replaceDefaultNumber(row['channel_activity_id']),
                    'channel_activity_type_category_id': util.replaceDefaultString(row['channel_activity_type_category_id']),
                    'log_datetime': util.replaceDefaultDatetime(row['log_datetime']),
                    'form_id': util.replaceDefaultNumber(row['form_id'])
                };
                responseArr.push(rowData);
                next();
            }).then(() => {
                resolve(responseArr);
            });
        });
    };

    this.assetAccountListDiff = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );

        var queryString = util.getQueryString('ds_v1_asset_list_select_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatAssetAccountListDiff(data, (err, responseData) => {
                        if (err === false) {
                            callback(false, {
                                data: responseData
                            }, 200);
                        } else {
                            callback(false, {}, -9999)
                        }
                    })
                    //callback(false, data, 200);
                } else {
                    callback(true, err, -9998);
                }
            });
        }
    };


    //PAM
    var formatAssetAccountListDiff = function (data, callback) {
        var responseData = new Array();
        forEachAsync(data, function (next, rowData) {
            var rowDataArr = {};
            rowDataArr.asset_id = util.replaceDefaultNumber(rowData['asset_id']);
            rowDataArr.asset_first_name = util.replaceDefaultString(rowData['asset_first_name']);
            rowDataArr.asset_last_name = util.replaceDefaultString(rowData['asset_last_name']);
            rowDataArr.asset_description = util.replaceDefaultString(rowData['asset_description']);
            rowDataArr.asset_customer_unique_id = util.replaceDefaultNumber(rowData['asset_customer_unique_id']);
            rowDataArr.asset_type_id = util.replaceDefaultNumber(rowData['asset_type_id']);
            rowDataArr.asset_type_name = util.replaceDefaultString(rowData['asset_type_name']);
            rowDataArr.asset_type_category_id = util.replaceDefaultNumber(rowData['asset_type_category_id']);
            rowDataArr.asset_type_category_name = util.replaceDefaultString(rowData['asset_type_category_name']);
            rowDataArr.asset_image_path = util.replaceDefaultString(rowData['asset_image_path']);
            rowDataArr.asset_qrcode_image_path = util.replaceDefaultString(rowData['asset_qrcode_image_path']);
            rowDataArr.asset_inline_data = rowData['asset_inline_data'] || {};
            rowDataArr.asset_phone_country_code = util.replaceDefaultNumber(rowData['asset_phone_country_code']);
            rowDataArr.asset_phone_number = util.replaceDefaultNumber(rowData['asset_phone_number']);
            rowDataArr.asset_phone_passcode = util.replaceDefaultString(rowData['asset_phone_passcode']);
            rowDataArr.asset_passcode_expiry_datetime = util.replaceDefaultDatetime(rowData['asset_passcode_expiry_datetime']);
            rowDataArr.asset_email_id = util.replaceDefaultString(rowData['asset_email_id']);
            rowDataArr.asset_email_password = util.replaceDefaultString(rowData['asset_email_password']);
            rowDataArr.asset_password_expiry_datetime = util.replaceDefaultDatetime(rowData['asset_password_expiry_datetime']);
            rowDataArr.asset_timezone_id = util.replaceDefaultNumber(rowData['asset_timezone_id']);
            rowDataArr.asset_timezone_offset = util.replaceDefaultString(rowData['asset_timezone_offset']);
            rowDataArr.asset_settings_updated = util.replaceDefaultNumber(rowData['asset_settings_updated']);
            rowDataArr.asset_encryption_token_id = util.replaceDefaultString(rowData['asset_encryption_token_id']);
            rowDataArr.asset_push_notification_id = util.replaceDefaultNumber(rowData['asset_push_notification_id']);
            rowDataArr.asset_push_arn = util.replaceDefaultString(rowData['asset_push_arn']);
            rowDataArr.asset_linked_enabled = util.replaceZero(rowData['asset_linked_enabled']);
            rowDataArr.asset_linked_status_datetime = util.replaceDefaultDatetime(rowData['asset_linked_status_datetime']);
            rowDataArr.asset_activated_enabled = util.replaceDefaultString(rowData['asset_activated_enabled']);
            rowDataArr.asset_last_seen_datetime = util.replaceDefaultDatetime(rowData['asset_last_seen_datetime']);
            rowDataArr.asset_created_datetime = util.replaceDefaultDatetime(rowData['asset_created_datetime']);
            rowDataArr.asset_desk_position_index = rowData['asset_desk_position_index'];
            rowDataArr.device_hardware_id = util.replaceDefaultNumber(rowData['device_hardware_id']);
            rowDataArr.device_manufacturer_name = util.replaceDefaultString(rowData['device_manufacturer_name']);
            rowDataArr.device_model_name = util.replaceDefaultString(rowData['device_model_name']);
            rowDataArr.device_os_id = util.replaceDefaultNumber(rowData['device_os_id']);
            rowDataArr.device_os_name = util.replaceDefaultString(rowData['device_os_name']);
            rowDataArr.device_os_version = util.replaceDefaultString(rowData['device_os_version']);
            rowDataArr.device_app_version = util.replaceDefaultString(rowData['device_app_version']);
            rowDataArr.asset_session_status_id = util.replaceDefaultNumber(rowData['asset_session_status_id']);
            rowDataArr.asset_session_status_name = util.replaceDefaultString(rowData['asset_session_status_name']);
            rowDataArr.asset_session_status_datetime = util.replaceDefaultDatetime(rowData['asset_session_status_datetime']);
            rowDataArr.asset_status_id = util.replaceDefaultNumber(rowData['asset_status_id']);
            rowDataArr.asset_status_name = util.replaceDefaultString(rowData['asset_status_name']);
            rowDataArr.asset_status_datetime = util.replaceDefaultDatetime(rowData['asset_status_datetime']);
            rowDataArr.workforce_id = util.replaceDefaultNumber(rowData['workforce_id']);
            rowDataArr.workforce_name = util.replaceDefaultString(rowData['workforce_name']);
            rowDataArr.workforce_image_path = util.replaceDefaultString(rowData['workforce_image_path']);
            rowDataArr.workforce_type_id = util.replaceDefaultNumber(rowData['workforce_type_id']);
            rowDataArr.workforce_type_name = util.replaceDefaultString(rowData['workforce_type_name']);
            rowDataArr.workforce_type_category_id = util.replaceDefaultNumber(rowData['workforce_type_category_id']);
            rowDataArr.workforce_type_category_name = util.replaceDefaultString(rowData['workforce_type_category_name']);
            rowDataArr.account_id = util.replaceDefaultNumber(rowData['account_id']);
            rowDataArr.account_name = util.replaceDefaultString(rowData['account_name']);
            rowDataArr.account_image_path = util.replaceDefaultString(rowData['account_image_path']);
            rowDataArr.account_type_id = util.replaceDefaultNumber(rowData['account_type_id']);
            rowDataArr.account_type_name = util.replaceDefaultString(rowData['account_type_name']);
            rowDataArr.account_type_category_id = util.replaceDefaultNumber(rowData['account_type_category_id']);
            rowDataArr.account_type_category_name = util.replaceDefaultString(rowData['account_type_category_name']);
            rowDataArr.organization_id = util.replaceDefaultNumber(rowData['organization_id']);
            rowDataArr.organization_name = util.replaceDefaultString(rowData['organization_name']);
            rowDataArr.organization_image_path = util.replaceDefaultString(rowData['organization_image_path']);
            rowDataArr.organization_type_id = util.replaceDefaultNumber(rowData['organization_type_id']);
            rowDataArr.organization_type_name = util.replaceDefaultString(rowData['organization_type_name']);
            rowDataArr.organization_type_category_id = util.replaceDefaultNumber(rowData['organization_type_category_id']);
            rowDataArr.organization_type_category_name = util.replaceDefaultString(rowData['organization_type_category_name']);

            rowDataArr.operating_asset_id = util.replaceDefaultNumber(rowData['operating_asset_id']);
            rowDataArr.operating_asset_first_name = util.replaceDefaultString(rowData['operating_asset_first_name']);
            rowDataArr.operating_asset_last_name = util.replaceDefaultString(rowData['operating_asset_last_name']);
            rowDataArr.operating_asset_image_path = util.replaceDefaultString(rowData['operating_asset_image_path']);
            rowDataArr.operating_asset_type_id = util.replaceDefaultNumber(rowData['operating_asset_type_id']);
            rowDataArr.operating_asset_type_name = util.replaceDefaultString(rowData['operating_asset_type_name']);
            rowDataArr.operating_asset_type_category_id = util.replaceDefaultNumber(rowData['operating_asset_type_category_id']);
            rowDataArr.operating_asset_type_category_name = util.replaceDefaultString(rowData['operating_asset_type_category_name']);

            rowDataArr.log_asset_id = util.replaceDefaultNumber(rowData['log_asset_id']);
            rowDataArr.log_asset_first_name = util.replaceDefaultString(rowData['log_asset_first_name']);
            rowDataArr.log_asset_last_name = util.replaceDefaultString(rowData['log_asset_last_name']);
            rowDataArr.log_asset_image_path = util.replaceDefaultString(rowData['log_asset_image_path']);
            rowDataArr.log_datetime = util.replaceDefaultDatetime(rowData['log_datetime']);
            rowDataArr.log_state = util.replaceDefaultString(rowData['log_state']);
            rowDataArr.log_active = util.replaceDefaultString(rowData['log_active']);
            rowDataArr.update_sequence_id = util.replaceDefaultNumber(rowData['update_sequence_id']);
            rowDataArr.asset_member_enabled = util.replaceDefaultNumber(rowData['asset_coffee_enabled']);

            responseData.push(rowDataArr);
            next();
        }).then(function () {
            callback(false, responseData);
        });
    };

    this.eventReport = function (request, callback) {
        callback(false, {}, 200);
    };

    this.assetTimeline = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
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
                            callback(false, {
                                data: responseData
                            }, 200);
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
            rowDataArr.activity_timeline_text = util.replaceDefaultString(rowData['data_entity_text_1']);
            rowDataArr.activity_timeline_url = '';
            rowDataArr.activity_timeline_collection = {};
            rowDataArr.activity_timeline_url_title = '';
            rowDataArr.log_message_unique_id = util.replaceDefaultNumber(rowData['log_message_unique_id']);
            rowDataArr.log_retry = util.replaceDefaultNumber(rowData['log_retry']);
            rowDataArr.log_offline = util.replaceDefaultNumber(rowData['log_offline']);
            rowDataArr.log_asset_id = util.replaceDefaultNumber(rowData['log_asset_id']);
            rowDataArr.log_asset_first_name = util.replaceDefaultString(rowData['log_asset_first_name']);
            rowDataArr.log_asset_last_name = util.replaceDefaultString(rowData['log_asset_last_name']);
            rowDataArr.log_asset_image_path = util.replaceDefaultString(rowData['log_asset_image_path']);
            rowDataArr.log_datetime = util.replaceDefaultDatetime(rowData['log_datetime']);

            responseData.push(rowDataArr);
            next();
        }).then(function () {
            callback(false, responseData);
        });

    };

    this.getFavouriteOrdersOfMember = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.target_asset_id,
                request.start_limit,
                request.end_limit
            );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_member_favourites', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    console.log("err " + err);
                    if (err === false) {
                        formatMemberOrdersData(data).then((finalData) => {
                            resolve(data);
                        });

                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    function formatMemberOrdersData(data) {
        return new Promise((resolve, reject) => {
            var responseArr = new Array();
            forEachAsync(data, function (next, row) {
                var rowData = {
                    'count': util.replaceDefaultNumber(row['count']),
                    'activity_title': util.replaceDefaultString(row['activity_tite']),

                };
                responseArr.push(rowData);
                next();
            }).then(() => {
                resolve(responseArr);
            });
        });
    };

    this.getCategoryActivitiesOfAsset = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.target_asset_id,
                request.activity_type_category_id,
                request.is_search,
                request.search_string,
                request.start_limit,
                request.end_limit
            );
            var queryString = util.getQueryString('ds_v1_1_activity_asset_mapping_select_asset_category', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    console.log("err " + err);
                    if (err === false) {
                        //formatMemberOrdersData(data).then((finalData)=>{
                        resolve(data);
                        // });

                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.getActivityParticipantsCategory = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.activity_id,
                request.asset_type_category_id,
                request.is_search,
                request.search_string,
                request.start_limit,
                request.end_limit
            );
            var queryString = util.getQueryString('ds_v1_1_activity_asset_mapping_select_participants_category', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    console.log("err " + err);
                    if (err === false) {
                        //formatMemberOrdersData(data).then((finalData)=>{
                        resolve(data);
                        // });

                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.getActivityListCategory = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_type_category_id,
                request.is_search,
                request.search_string,
                request.start_limit,
                request.end_limit
            );
            var queryString = util.getQueryString('ds_v1_activity_list_select_category', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    console.log("err " + err);
                    if (err === false) {
                        //formatMemberOrdersData(data).then((finalData)=>{
                        resolve(data);
                        // });

                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.getMemberEventVisitHistory = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.target_asset_id,
                request.is_date,
                request.event_date,
                request.is_total,
                request.start_limit,
                request.end_limit
            );
            var queryString = util.getQueryString('pm_v1_pam_event_billing_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    console.log("err " + err);
                    if (err === false) {
                        if (request.is_total == 0) {
                            formatMemberHistoryData(data).then((finalData) => {
                                resolve(finalData);
                            });
                        } else {
                            resolve(data);
                        }
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    function formatMemberHistoryData(data) {
        return new Promise((resolve, reject) => {
            var responseArr = new Array();
            forEachAsync(data, function (next, row) {
                var rowData = {
                    'event_id': util.replaceDefaultNumber(row['event_id']),
                    'event_name': util.replaceDefaultString(row['event_name']),
                    'event_date': util.replaceDefaultDate(row['event_date']),
                    'event_bill': util.replaceDefaultString(row['event_bill'])
                };
                responseArr.push(rowData);
                next();
            }).then(() => {
                resolve(responseArr);
            });
        });
    };

    this.getActivitiesAllCategories = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.parent_activity_id,
                request.activity_type_category_id,
                request.access_role_id,
                request.activity_status_type_id,
                request.is_search,
                request.search_string,
                request.is_date,
                request.date,
                request.start_limit,
                request.end_limit
            );
            var queryString = util.getQueryString('pm_v1_activity_asset_mapping_select_all_categories', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    console.log("err " + err);
                    if (err === false) {
                        //formatMemberOrdersData(data).then((finalData)=>{
                        resolve(data);
                        // });

                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.getActivityAssetCategoryDifferential = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.asset_id,
            request.activity_type_category_id,
            request.datetime_differential,
            request.parent_activity_id,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );

        queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_category_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log(data);
                if (err === false) {
                    formatActivityAccountListing(data, function (err, finalData) {
                        if (err === false) {
                            callback(false, {
                                data: finalData
                            }, 200);
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

    //PAM
    var formatActivityAccountListing = function (data, callback) {
        var responseData = new Array();
        data.forEach(function (rowData, index) {
            var rowDataArr = {
                "activity_id": util.replaceDefaultNumber(rowData['activity_id']),
                "activity_title": util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(rowData['activity_title']))),
                "activity_description": util.replaceDefaultString(util.decodeSpecialChars(rowData['activity_description'])),
                "activity_inline_data": JSON.parse(util.replaceDefaultString(rowData['activity_inline_data'])),
                "activity_type_id": util.replaceDefaultNumber(rowData['activity_type_id']),
                "activity_type_name": (util.replaceDefaultString(rowData['activity_type_id']) === 1) ? 'Personal ' : util.replaceDefaultString(rowData['activity_type_name']),
                "activity_type_category_id": util.replaceDefaultNumber(rowData['activity_type_category_id']),
                "activity_type_category_name": util.replaceDefaultString(rowData['activity_type_category_name']),
                "activity_sub_type_id": util.replaceDefaultNumber(rowData['activity_sub_type_id']),
                "activity_sub_type_name": util.replaceDefaultString(rowData['activity_sub_type_name']),
                "activity_datetime_created": util.replaceDefaultDatetime(rowData['activity_datetime_created']),
                "activity_datetime_start_expected": util.replaceDefaultDatetime(rowData['activity_datetime_start_expected']),
                "activity_datetime_end_expected": util.replaceDefaultDatetime(rowData['activity_datetime_end_expected']),
                "activity_datetime_end_deferred": util.replaceDefaultDatetime(rowData['activity_datetime_end_deferred']),
                "activity_datetime_end_estimated": util.replaceDefaultDatetime(rowData['activity_datetime_end_estimated']),
                "activity_datetime_closed": util.replaceDefaultDatetime(rowData['activity_datetime_closed']),
                "activity_datetime_last_updated": util.replaceDefaultDatetime(rowData['activity_datetime_last_updated']),
                "activity_status_id": util.replaceDefaultNumber(rowData['activity_status_id']),
                "activity_status_name": util.replaceDefaultString(rowData['activity_status_name']),
                "activity_status_type_id": util.replaceDefaultNumber(rowData['activity_status_type_id']),
                "activity_status_type_name": util.replaceDefaultString(rowData['activity_status_type_name']),
                "activity_status_type_category_id": util.replaceDefaultNumber(rowData['activity_status_type_category_id']),
                "activity_status_type_category_name": util.replaceDefaultString(rowData['activity_status_type_category_name']),
                "activity_pinned_enabled": util.replaceZero(rowData['activity_pinned_enabled']),
                "activity_priority_enabled": util.replaceZero(rowData['activity_priority_enabled']),
                "activity_participant_count": util.replaceZero(rowData['participant_count']),
                "activity_owner_asset_id": util.replaceDefaultNumber(rowData['activity_owner_asset_id']),
                "activity_owner_asset_first_name": util.replaceDefaultString(rowData['activity_owner_asset_first_name']),
                "activity_owner_asset_last_name": util.replaceDefaultString(rowData['activity_owner_asset_last_name']),
                "activity_owner_asset_image_path": util.replaceDefaultString(rowData['activity_owner_asset_image_path']),
                "activity_owner_asset_type_id": util.replaceDefaultNumber(rowData['activity_owner_asset_type_id']),
                "activity_owner_asset_type_name": util.replaceDefaultString(rowData['activity_owner_asset_type_name']),
                "activity_owner_asset_type_category_id": util.replaceDefaultNumber(rowData['activity_owner_asset_type_category_id']),
                "activity_owner_asset_type_category_name": util.replaceDefaultString(rowData['activity_owner_asset_type_category_name']),
                "activity_lead_asset_id": util.replaceDefaultNumber(rowData['activity_lead_asset_id']),
                "activity_lead_asset_first_name": util.replaceDefaultString(rowData['activity_lead_asset_first_name']),
                "activity_lead_asset_last_name": util.replaceDefaultString(rowData['activity_lead_asset_last_name']),
                "activity_lead_asset_image_path": util.replaceDefaultString(rowData['activity_lead_asset_image_path']),
                "activity_lead_asset_type_id": util.replaceDefaultNumber(rowData['activity_lead_asset_type_id']),
                "activity_lead_asset_type_name": util.replaceDefaultString(rowData['activity_lead_asset_type_name']),
                "activity_lead_asset_type_category_id": util.replaceDefaultNumber(rowData['activity_lead_asset_type_category_id']),
                "activity_lead_asset_type_category_name": util.replaceDefaultString(rowData['activity_lead_asset_type_category_name']),
                "parent_activity_id": util.replaceDefaultNumber(rowData['parent_activity_id']),
                "parent_activity_title": util.replaceDefaultString(util.decodeSpecialChars(rowData['parent_activity_title'])),
                "parent_activity_type_id": util.replaceDefaultNumber(rowData['parent_activity_type_id']),
                "parent_activity_type_name": util.replaceDefaultString(rowData['parent_activity_type_name']),
                "parent_activity_type_category_id": util.replaceDefaultNumber(rowData['parent_activity_type_category_id']),
                "parent_activity_type_category_name": util.replaceDefaultString(rowData['parent_activity_type_category_name']),
                //"parent_activity_total_count": util.replaceZero(rowData['parent_activity_total_count']),
                //"parent_activity_priority_count": util.replaceZero(rowData['parent_activity_priority_count']),
                "parent_activity_open_count": util.replaceZero(rowData['parent_activity_open_count']),
                "parent_activity_closed_count": util.replaceZero(rowData['parent_activity_closed_count']),
                //"parent_activity_asset_participation_count": util.replaceZero(rowData['parent_activity_asset_participation_count']),
                "asset_datetime_last_differential": util.replaceDefaultDatetime(rowData['asset_datetime_last_differential']),
                "asset_datetime_last_seen": util.replaceDefaultDatetime(rowData['asset_datetime_last_seen']),
                "asset_participant_access_id": util.replaceDefaultNumber(rowData['asset_participant_access_id']),
                "asset_participant_access_name": util.replaceDefaultString(rowData['asset_participant_access_name']),
                "asset_unread_updates_count": util.replaceZero(rowData['asset_unread_updates_count']),
                //"asset_unread_field_updates_count": util.replaceZero(rowData['asset_unread_field_updates_count']),
                "asset_notification_muted": util.replaceDefaultString(rowData['asset_notification_muted']),
                "asset_id": util.replaceDefaultNumber(rowData['asset_id']),
                "asset_first_name": util.replaceDefaultString(rowData['asset_first_name']),
                "asset_last_name": util.replaceDefaultString(rowData['asset_last_name']),
                "asset_image_path": util.replaceDefaultString(rowData['asset_image_path']),
                "asset_type_id": util.replaceDefaultNumber(rowData['asset_type_id']),
                "asset_type_name": util.replaceDefaultString(rowData['asset_type_name']),
                "asset_type_category_id": util.replaceDefaultNumber(rowData['asset_type_category_id']),
                "asset_type_category_name": util.replaceDefaultString(rowData['activity_sub_type_name']),
                "operating_asset_id": util.replaceZero(rowData['operating_asset_id']),
                "operating_asset_first_name": util.replaceDefaultString(rowData['operating_asset_first_name']),
                "operating_asset_last_name": util.replaceDefaultString(rowData['operating_asset_last_name']),
                "operating_asset_image_path": util.replaceDefaultString(rowData['operating_asset_image_path']),
                "operating_asset_type_id": util.replaceDefaultNumber(rowData['operating_asset_type_id']),
                "operating_asset_type_name": util.replaceDefaultString(rowData['operating_asset_type_name']),
                "operating_asset_type_category_id": util.replaceDefaultNumber(rowData['operating_asset_type_category_id']),
                "operating_asset_type_category_name": util.replaceDefaultString(rowData['operating_asset_type_category_name']),
                "operating_asset_phone_country_code": util.replaceDefaultString(rowData['operating_asset_phone_country_code']),
                "operating_asset_phone_number": util.replaceDefaultString(rowData['operating_asset_phone_number']),
                "operating_asset_email_id": util.replaceDefaultString(rowData['operating_asset_email_id']),
                "workforce_id": util.replaceZero(rowData['workforce_id']),
                "workforce_name": util.replaceDefaultString(rowData['workforce_name']),
                "workforce_image_path": util.replaceDefaultString(rowData['workforce_image_path']),
                "workforce_type_id": util.replaceDefaultNumber(rowData['workforce_type_id']),
                "workforce_type_name": util.replaceDefaultString(rowData['workforce_type_name']),
                "workforce_type_category_id": util.replaceDefaultNumber(rowData['workforce_type_category_id']),
                "workforce_type_category_name": util.replaceDefaultString(rowData['workforce_type_category_name']),
                "account_id": util.replaceZero(rowData['account_id']),
                "account_name": util.replaceDefaultString(rowData['account_name']),
                "account_image_path": util.replaceDefaultString(rowData['account_image_path']),
                "account_type_id": util.replaceDefaultNumber(rowData['account_type_id']),
                "account_type_name": util.replaceDefaultString(rowData['account_type_name']),
                "account_type_category_id": util.replaceDefaultNumber(rowData['account_type_category_id']),
                "account_type_category_name": util.replaceDefaultString(rowData['account_type_category_name']),
                "organization_id": util.replaceDefaultNumber(rowData['organization_id']),
                "organization_name": util.replaceDefaultString(rowData['organization_name']),
                "organization_image_path": util.replaceDefaultString(rowData['organization_image_path']),
                "organization_type_id": util.replaceDefaultNumber(rowData['organization_type_id']),
                "organization_type_name": util.replaceDefaultString(rowData['organization_type_name']),
                "organization_type_category_id": util.replaceDefaultNumber(rowData['organization_type_category_id']),
                "organization_type_category_name": util.replaceDefaultString(rowData['organization_type_category_name']),
                "form_transaction_id": util.replaceZero(rowData['form_transaction_id']),
                "form_id": util.replaceZero(rowData['form_id']),
                "field_id": util.replaceDefaultNumber(rowData['field_id']),
                //"activity_form_approval_status": util.replaceDefaultString(rowData['activity_form_approval_status']),
                //"activity_form_approval_datetime": util.replaceDefaultDatetime(rowData['activity_form_approval_datetime']),
                "channel_activity_id": util.replaceDefaultNumber(rowData['channel_activity_id']),
                "channel_activity_type_category_id": util.replaceDefaultNumber(rowData['channel_activity_type_category_id']),
                "log_message_unique_id": util.replaceDefaultNumber(rowData['log_message_unique_id']),
                "log_retry": util.replaceDefaultNumber(rowData['log_retry']),
                "log_offline": util.replaceDefaultNumber(rowData['log_offline']),
                "log_asset_id": util.replaceDefaultNumber(rowData['log_asset_id']),
                "log_asset_first_name": util.replaceDefaultString(rowData['log_asset_first_name']),
                "log_asset_last_name": util.replaceDefaultString(rowData['log_asset_last_name']),
                "log_asset_image_path": util.replaceDefaultString(rowData['log_asset_image_path']),
                "log_datetime": util.replaceDefaultDatetime(rowData['asset_datetime_last_differential']),
                "log_state": util.replaceDefaultNumber(rowData['log_state']),
                "log_active": util.replaceDefaultNumber(rowData['log_active']),
                "update_sequence_id": util.replaceDefaultNumber(rowData['log_asset_image_path']),
                "activity_creator_operating_asset_id": util.replaceDefaultNumber(rowData['activity_creator_operating_asset_id']),
                "activity_creator_operating_asset_first_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_first_name']),
                "activity_creator_operating_asset_last_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_last_name']),
                "activity_creator_asset_id": util.replaceDefaultNumber(rowData['activity_creator_asset_id']),
                "activity_creator_asset_first_name": util.replaceDefaultString(rowData['activity_creator_asset_first_name']),
                "activity_creator_asset_last_name": util.replaceDefaultString(rowData['activity_creator_asset_last_name'])
            };
            responseData.push(rowDataArr);
        }, this);
        callback(false, responseData);
    };

    this.getActivityAssetCategoryDifferentialCount = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array();
            var queryString = '';
            paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.asset_id,
                request.activity_type_category_id,
                request.datetime_differential,
                request.parent_activity_id
            );

            queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_category_differential_count', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    console.log("err " + err);
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.assetAccountListCategoryDiff = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_type_category_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );

        var queryString = util.getQueryString('ds_v1_asset_list_select_category_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatAssetAccountListDiff(data, (err, responseData) => {
                        if (err === false) {
                            callback(false, {
                                data: responseData
                            }, 200);
                        } else {
                            callback(false, {}, -9999)
                        }
                    })
                    //callback(false, data, 200);
                } else {
                    callback(true, err, -9998);
                }
            });
        }
    };

    this.assetAccountListCategoryDiffCount = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_type_category_id,
                request.datetime_differential
            );

            var queryString = util.getQueryString('ds_v1_asset_list_select_category_differential_count', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    console.log("err " + err);
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };
    
    
    this.activityAssetMappingCategorySearch = function (request) {
		return new Promise((resolve, reject)=>{
	        var paramsArr = new Array(
	                request.organization_id,
	                request.account_id,
	                request.workforce_id,
	                request.activity_type_category_id,
	                request.asset_type_category_id,
	                request.is_search,
	                request.search_string,
	                request.is_date,
	                request.start_datetime,
	                request.end_datetime,
	                request.is_status,
	                request.activity_status_type_id,
	                request.page_start,
                	util.replaceQueryLimit(request.page_limit)
	                );
	
	        var queryString = util.getQueryString('pm_v1_activity_asset_mapping_select_category_search_date', paramsArr);
	        if (queryString != '') {
	            db.executeQuery(1, queryString, request, function (err, data) {
	            	//console.log("err "+err);
	               if(err === false) {	        			
	        			  formatInventoryData(data).then((finalData)=>{
	        			  	resolve(finalData);
	        			  }).catch((err1)=>{
	        			  console.log(err1);
				            reject(err1);
				          });     			  
                    } else {
	                   reject(err);
	               }
	            });
	   		}
        });
    };	  
    
    function formatInventoryData(data){
        return new Promise((resolve, reject)=>{
            var responseArr = new Array();
            forEachAsync(data, function (next, row) {
                var rowData = {
                    'activity_id': util.replaceDefaultNumber(row['activity_id']),
                    'activity_title': util.replaceDefaultString(row['activity_title']),
                    'asset_id': util.replaceDefaultNumber(row['asset_id']),
                	'asset_first_name': util.replaceDefaultString(row['asset_first_name']),
                	'activity_datetime_created': util.replaceDefaultDatetime(row['activity_datetime_created']),
                	'activity_inline_data': util.replaceDefaultString(row['activity_inline_data']),
                	'activity_sub_type_id': util.replaceDefaultNumber(row['activity_sub_type_id']),
                	'activity_sub_type_name': util.replaceDefaultString(row['activity_sub_type_name']),
                 	'activity_status_id': util.replaceDefaultNumber(row['activity_status_id']),
                	'activity_status_name': util.replaceDefaultString(row['activity_status_name']),
                 	'activity_status_type_id': util.replaceDefaultNumber(row['activity_status_type_id']),
                	'activity_status_type_name': util.replaceDefaultString(row['activity_status_type_name'])   			                  
                };
                responseArr.push(rowData);
                next();
            }).then(() => {
                resolve(responseArr);
            });
        });        
    };  
    
	
    this.activityTimeline = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                request.timeline_transaction_id,
                request.flag_previous,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
                );
        var queryString = util.getQueryString('ds_v1_2_activity_timeline_transaction_select_differential', paramsArr);
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
    
    this.averages = function (request) {
		return new Promise((resolve, reject)=>{
	        var paramsArr = new Array(
	        		request.organization_id,
	        		request.account_id,
					request.event_activity_id,
					request.is_date,
					request.start_date,
					request.end_date
	                );
	
	        var queryString = util.getQueryString('pm_v1_pam_order_list_select_averages', paramsArr);
	        if (queryString != '') {
	            db.executeQuery(1, queryString, request, function (err, data) {
	            	//console.log("err "+err);
	               if(err === false) {
	        			resolve(data);	        			      			  
                    } else {
	                   reject(err);
	               }
	            });
	   		}
        });
    };
    
    this.mostOrdered = function (request) {
		return new Promise((resolve, reject)=>{
	        var paramsArr = new Array(
	        	    request.organization_id,
	        		request.account_id,
					request.event_activity_id,
					request.order_activity_type_id,
					request.is_date,
					request.start_date,
					request.end_date
	                );
	
	        var queryString = util.getQueryString('pm_v1_pam_order_list_max_ordered', paramsArr);
	        if (queryString != '') {
	            db.executeQuery(1, queryString, request, function (err, data) {
	            	//console.log("err "+err);
	               if(err === false) {
	        			resolve(data);	        			      			  
                    } else {
	                   reject(err);
	               }
	            });
	   		}
        });
    };
    
    this.billByItemType = function (request) {
		return new Promise((resolve, reject)=>{
	        var paramsArr = new Array(
	        		request.organization_id,
	        		request.account_id,
					request.event_activity_id,
					request.is_date,
					request.start_date,
					request.end_date,
					request.is_status,
					request.is_type
	                );
	
	        var queryString = util.getQueryString('pm_v1_pam_order_list_select_bill_group_by', paramsArr);
	        if (queryString != '') {
	            db.executeQuery(1, queryString, request, function (err, data) {
	            	//console.log("err "+err);
	               if(err === false) {
	        			resolve(data);	        			      			  
                    } else {
	                   reject(err);
	               }
	            });
	   		}
        });
    };
    
    this.getEventBydate = function (request) {
		return new Promise((resolve, reject)=>{
	        var paramsArr = new Array(
	        		request.organization_id,
	        		request.account_id,
					request.activity_type_category_id,
					request.start_datetime,
					request.end_datetime,
	                request.page_start,
                	util.replaceQueryLimit(request.page_limit)
	                );
	
	        var queryString = util.getQueryString('pm_v1_activity_list_select_date_events', paramsArr);
	        if (queryString != '') {
	            db.executeQuery(1, queryString, request, function (err, data) {
	            	//console.log("err "+err);
	               if(err === false) {
	        			resolve(data);	        			      			  
                    } else {
	                   reject(err);
	               }
	            });
	   		}
        });
    };
    
    this.getAssetDetails = function (request) {
    return new Promise((resolve, reject)=>{
        var paramsArr = new Array(
            request.organization_id,
            request.target_asset_id
        );
        var queryString = util.getQueryString('pm_v1_asset_list_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
				 if(err === false) {
	        			resolve(data);	        			      			  
                    } else {
	                   reject(err);
	               }
            });
        }
	});
    };
    
   this.billingAmountByPaymentType = function (request) {
		return new Promise((resolve, reject)=>{
	        var paramsArr = new Array(
	        		request.organization_id,
	        		request.account_id,
					request.event_activity_id,
					request.is_date,
					request.start_date,
					request.end_date
	                );
	
	        var queryString = util.getQueryString('pm_v1_pam_event_billing_select_event_billing', paramsArr);
	        if (queryString != '') {
	            db.executeQuery(1, queryString, request, function (err, data) {
	            	//console.log("err "+err);
	               if(err === false) {
	        			resolve(data);	        			      			  
                    } else {
	                   reject(err);
	               }
	            });
	   		}
        });
    };
    
    this.getInventoryConsumption = function (request) {
		return new Promise((resolve, reject)=>{
	        var paramsArr = new Array(
	        		request.organization_id,
	        		request.account_id,
					request.event_activity_id,
					request.is_date,
					request.start_date,
					request.end_date,
					request.start_limit,
					request.end_limit
	                );
	
	        var queryString = util.getQueryString('pm_v1_pam_inventory_consumption_select_consumption', paramsArr);
	        if (queryString != '') {
	            db.executeQuery(1, queryString, request, function (err, data) {
	            	//console.log("err "+err);
	               if(err === false) {
	        			resolve(data);	        			      			  
                    } else {
	                   reject(err);
	               }
	            });
	   		}
        });
    };
    
};

module.exports = PamListingService;
