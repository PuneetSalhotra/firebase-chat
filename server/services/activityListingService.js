/*
 * author: Sri Sai Venkatesh
 */

function ActivityListingService(objCollection) {

    var db = objCollection.db;
    var util = objCollection.util;
    var activityCommonService = objCollection.activityCommonService;
    var forEachAsync = objCollection.forEachAsync;

    this.getActivityListDifferential = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        if (request.hasOwnProperty('activity_type_category_id') && Number(request.device_os_id) === 5) {
            switch (Number(request.activity_type_category_id)) {
                case 15: //Video Conference BETA
                    paramsArr = new Array(
                        request.asset_id,
                        request.organization_id,
                        request.account_id,
                        request.workforce_id,
                        request.activity_type_category_id,
                        request.activity_sub_type_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_category_sub_type', paramsArr);
                    break;
                default:
                    paramsArr = new Array(
                        request.asset_id,
                        request.organization_id,
                        request.account_id,
                        request.workforce_id,
                        request.activity_type_category_id,
                        request.datetime_differential,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_category', paramsArr);
                    break;
            }
        } else {
            paramsArr = new Array(
                request.organization_id,
                request.asset_id,
                request.datetime_differential,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );
            //queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_differential', paramsArr);
            queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_signup_differential', paramsArr);
        }
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log(data);
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
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
    this.getActivityAssetAccountLevelDifferential = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.asset_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_account_differential', paramsArr);
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

    //BETA
    this.getAllFolders = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        var activityTypeCategoryId = Number(request.activity_type_category_id) || 0;
        if (activityTypeCategoryId === 28) {
            paramsArr = new Array(
                request.asset_id,
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.search_string,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );
            queryString = util.getQueryString('ds_p1_activity_asset_mapping_search_postit', paramsArr);
        } else {
            paramsArr = new Array(
                request.asset_id,
                request.organization_id,
                request.account_id,
                request.workforce_id,
                activityTypeCategoryId,
                request.activity_sub_type_id,
                request.is_unread,
                request.is_status,
                request.is_due_date,
                request.is_sort,
                request.is_search, //1 for searching
                request.search_string,
                request.flag,
                request.start_datetime,
                request.end_datetime,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );
            queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_folders_all', paramsArr);
        }
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

    //BETA
    this.getAllProjects = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        paramsArr = new Array(
            request.asset_id,
            request.parent_activity_id,
            request.organization_id,
            request.sub_task_category_type_id,
            request.activity_sub_type_id,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        queryString = util.getQueryString('ds_v1_1_activity_asset_mapping_select_asset_sub_tasks', paramsArr);
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
                    callback(err, false, -9998);
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

    this.getActivityInlineCollection = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
        activityCommonService.getActivityDetails(request, 0, function (err, activityData) {
            if (err === false) {
                formatActivityInlineCollection(activityData, {}, function (err, responseData) {
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
    };

    this.getActivityCoverCollection = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
        var paramsArr = new Array(
            request.activity_id,
            request.asset_id,
            request.organization_id
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    if (data.length > 0) {
                        var coverCollection = {};
                        coverCollection.activity_title = util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(data[0]['activity_title'])));
                        coverCollection.activity_datetime_start = util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(data[0]['activity_datetime_start_expected'])));
                        coverCollection.activity_duedate = util.replaceDefaultString(data[0]['activity_datetime_end_expected']);
                        coverCollection.activity_description = util.replaceDefaultString(util.decodeSpecialChars(data[0]['activity_description']));
                        coverCollection.activity_completion_percentage = util.replaceDefaultString(data[0]['activity_completion_percentage']); //BETA
                        formatActivityInlineCollection(data, coverCollection, function (err, responseData) {
                            if (err === false) {
                                callback(false, {
                                    data: responseData
                                }, 200);
                            } else {
                                callback(false, {}, -9999)
                            }
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }

    };

    this.getActivityCoverCollectionV1 = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        var monthly_summary = {};
        //monthly_summary.owned_tasks_response = -1;
        //monthly_summary.inmail_response_rate = -1;
        monthly_summary.completion_rate = -1;
        monthly_summary.unread_update_response_rate = -1;
        monthly_summary.average_value = -1;
        request['datetime_log'] = logDatetime;
        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
        var paramsArr = new Array(
            request.activity_id,
            request.operating_asset_id,
            request.organization_id
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
                        if (err === false) {
                            //callback(false, {data:{activity_cover: finalData, monthly_summary:{}}}, 200);
                            paramsArr = new Array(
                                request.asset_id,
                                request.operating_asset_id,
                                request.organization_id,
                                1,
                                //util.getStartDayOfMonth()
                                util.getStartDayOfPrevMonth()
                            );
                            queryString = util.getQueryString('ds_p1_asset_monthly_summary_transaction_select_flag', paramsArr);
                            if (queryString != '') {
                                db.executeQuery(1, queryString, request, function (err, statsData) {
                                    if (err === false) {
                                        //console.log('statsData :', statsData);
                                        statsData.forEach(function (rowData, index) {
                                            switch (rowData.monthly_summary_id) {
                                                /*case 8:     //Response rate of owned tasks 
                                                    monthly_summary.owned_tasks_response = util.replaceDefaultNumber(rowData['data_entity_decimal_1']);
                                                    break;
                                                case 10:    //10	Response Rate - InMail
                                                    monthly_summary.inmail_response_rate = util.replaceDefaultNumber(rowData['data_entity_decimal_1']);
                                                    break;*/
                                                case 12: // 12	Completion rate - Lead
                                                    monthly_summary.completion_rate = util.replaceDefaultNumber(rowData['data_entity_decimal_1']);
                                                    break;
                                                case 22: // 22	unread update response rate
                                                    monthly_summary.unread_update_response_rate = util.replaceDefaultNumber(rowData['data_entity_double_1']);
                                                    break;
                                            }
                                        }, this);
                                        var denominator = 0;

                                        //(monthly_summary.owned_tasks_response > 0)? denominator++: monthly_summary.owned_tasks_response = 0;
                                        //(monthly_summary.inmail_response_rate > 0)? denominator++: monthly_summary.inmail_response_rate = 0;
                                        (monthly_summary.completion_rate > 0) ? denominator++ : monthly_summary.completion_rate = 0;
                                        (monthly_summary.unread_update_response_rate > 0) ? denominator++ : monthly_summary.unread_update_response_rate = 0;


                                        // console.log('Denominator after processing : ' + denominator);
                                        //console.log('monthly_summary.owned_tasks_response : ' + monthly_summary.owned_tasks_response);
                                        //console.log('monthly_summary.inmail_response_rate : ' + monthly_summary.inmail_response_rate);
                                        // console.log('monthly_summary.completion_rate : ' + monthly_summary.completion_rate);
                                        // console.log('monthly_summary.unread_update_response_rate : ' + monthly_summary.unread_update_response_rate);

                                        global.logger.write('debug', 'Denominator after processing: ' + denominator, {}, request);
                                        global.logger.write('debug', 'monthly_summary.completion_rate: ' + monthly_summary.completion_rate, {}, request);
                                        global.logger.write('debug', 'monthly_summary.unread_update_response_rate: ' + monthly_summary.unread_update_response_rate, {}, request);

                                        if (denominator == 0) {
                                            monthly_summary.average_value = -1;
                                        } else {
                                            //monthly_summary.average_value = (monthly_summary.owned_tasks_response + monthly_summary.inmail_response_rate + monthly_summary.completion_rate) / denominator;
                                            monthly_summary.average_value = (monthly_summary.completion_rate + monthly_summary.unread_update_response_rate) / denominator;
                                        }

                                        finalData[0].activity_inline_data.monthly_summary = monthly_summary;
                                        //console.log('finalData : ' + finalData);
                                        callback(false, {
                                            data: finalData
                                        }, 200);
                                    } else {
                                        callback(err, false, -9999);
                                    }
                                });
                            }
                        } else {
                            callback(err, false, -9999);
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

    this.getCoworkers = function (request, callback) {

        var paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_category_coworker', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
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
    //this function will search both contacts and coworkers
    this.searchSharedContacts = function (request, callback) {

        var paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.contact_search_string,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );

        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_coworker', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, coworkerData) {
                if (err === false) {
                    if (coworkerData.length > 0) {
                        formatActivityListing(coworkerData, function (err, finalCoworkerData) {
                            if (err === false) {
                                searchContacts(request, function (err, finalContactsData) {
                                    if (finalContactsData.length > 0) {
                                        callback(false, {
                                            data: finalCoworkerData.concat(finalContactsData)
                                        }, 200);
                                    } else {
                                        callback(false, {
                                            data: finalCoworkerData
                                        }, 200);
                                    }
                                });
                            }
                        });
                    } else {
                        searchContacts(request, function (err, finalContactsData) {
                            callback(false, {
                                data: finalContactsData
                            }, 200);
                        });
                    }
                } else {
                    callback(err, false, -9999);
                    return;

                }
            });
        }

    };

    this.listContacts = function (request, callback) {

        var paramsArr = new Array(
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.flag_search,
            request.search_string,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        // IN p_is_search TINYINT(4), IN p_search_string VARCHAR(100), IN p_start_from BIGINT(20), IN p_limit_value TINYINT(4)

        var queryString = util.getQueryString('ds_p1_activity_asset_mapping_search_contact_inline', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, coworkerData) {
                console.log(coworkerData);
                global.logger.write('debug', 'coworkerData' + JSON.stringify(coworkerData, null, 2), {}, request);

                if (err === false) {
                    if (coworkerData.length > 0) {
                        formatActivityListing(coworkerData, function (err, finalCoworkerData) {
                            if (err === false) {
                                callback(false, {
                                    data: finalCoworkerData
                                }, 200);
                            } else {
                                callback(false, {}, 200);
                            }
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                } else {
                    callback(err, false, -9999);
                    return;
                }
            });
        }

    };

    this.searchActivityByType = function (request, callback) {

        var paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.search_string,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );

        var paramsArrForCalendar = new Array(
            request.asset_id,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.search_string,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );

        var queryString = '';
        switch (Number(request.activity_type_category_id)) {
            case 8: // mail
                queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_inline', paramsArr);
                break;
            case 10: //File BETA
                var paramsArrForFile = new Array(
                    request.asset_id,
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    request.activity_type_category_id,
                    request.search_string,
                    request.activity_sub_type_id,
                    request.page_start,
                    util.replaceQueryLimit(request.page_limit)
                );
                queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_sub_type', paramsArrForFile);
                break;
            case 15: //Video Conference BETA
                var paramsArrForVideoConf = new Array(
                    request.asset_id,
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    request.activity_type_category_id,
                    request.activity_sub_type_id,
                    request.search_string,
                    request.page_start,
                    util.replaceQueryLimit(request.page_limit)
                );
                queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_cat_sub_type_title', paramsArrForVideoConf);
                break;
            case 31: //calendar event
                queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_calendar', paramsArrForCalendar);
                break;
            default:
                queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_title', paramsArr);
                break;
        }

        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
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

    var searchContacts = function (request, callback) {

        var paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.contact_search_string,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );

        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_contact', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, contactsData) {
                if (err === false) {
                    formatActivityListing(contactsData, function (err, finalContactsData) {
                        if (err === false) {
                            callback(false, finalContactsData);
                        }
                    });

                } else {
                    callback(err, false, -9999);
                    return;

                }
            });
        }
    };

    this.searchMail = function (request, callback) {

        var paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            5,
            request.contact_search_string,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_inline', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {

                    formatActivityListing(data, function (err, finalData) {
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

    this.getDuevsTotal = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.datetime_log // previously 0
        );
        //var queryString = util.getQueryString('ds_v1_activity_list_select_project_status_counts', paramsArr);
        var queryString = util.getQueryString('ds_p1_activity_list_select_project_status_counts', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
                if (err === false) {
                    callback(false, {
                        data: data
                    }, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }

    };

    this.getActivityListDateRange = function (request, callback) {

        var paramsArr = new Array(
            request.organization_id,
            request.asset_id,
            request.datetime_start, //00:00:00
            request.datetime_end // 23:59:59
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_open_payroll_activity', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
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

    this.getAllContactTypes = function (request, callback) {

        var paramsArr = new Array(
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.page_start,
            request.page_limit
        );
        var queryString = util.getQueryString('ds_p1_activity_list_select_contacts', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
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

    this.searchAllContactTypes = function (request, callback) {

        var paramsArr = new Array(
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.search_string,
            request.page_start,
            request.page_limit
        );
        var queryString = util.getQueryString('ds_p1_activity_list_select_contact_search', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
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

    //BETA
    this.getVideoConfSchedule = function (request, callback) {

        var paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.is_status,
            request.is_sort,
            request.is_search,
            request.search_string,
            request.start_datetime,
            request.end_datetime,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_category_datetime', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
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

    //BETA
    this.getOptimumMeetingRoom = function (request, callback) {

        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.meeting_workforce_id,
            request.participant_count,
            request.start_datetime,
            request.end_datetime
        );
        var queryString = util.getQueryString('ds_v1_asset_list_select_meeting_room', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
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

    this.getAllPendingCounts = function (request, callback) {
        var taskCnt;
        var endDate = util.getCurrentDate() + " 23:59:59";
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.operating_asset_id,
            request.activity_type_category_id,
            request.activity_sub_type_id,
            endDate //util.getCurrentUTCTime()
        );
        var queryString = util.getQueryString('ds_p1_activity_asset_maaping_select_task_pending_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    // console.log('Data of pending count : ', data);
                    global.logger.write('debug', 'Data of pending count: ' + JSON.stringify(data, null, 2), {}, request);

                    (data.length > 0) ? taskCnt = data[0].count: taskCnt = 0;
                    getCatGrpCts(request).then((resp) => {
                        resp.push({
                            count: taskCnt,
                            activity_type_category_id: 101,
                            activity_type_category_name: 'Task'
                        });
                        callback(false, resp, 200);
                    }).catch((err) => {
                        // console.log(err);
                        global.logger.write('debug', err, err, request);

                        callback(err, false, -9999);
                    })
                } else {
                    callback(err, false, -9999);
                }
            });
        }
    }

    this.getAllPendingCountsV1 = function (request, callback) {
        var taskCnt;
        var responseArray = new Array();
        var projectCnt = 0;

        var startDatetime = util.getCurrentDate() + " 00:00:00";
        var endDatetime = util.getCurrentDate() + " 23:59:59";
        var currentDatetime = util.getCurrentUTCTime();
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.operating_asset_id,
            request.activity_type_category_id,
            request.activity_sub_type_id,
            request.flag_filter,
            request.search_string,
            startDatetime,
            endDatetime,
            currentDatetime,
            request.coworker_asset_id || 0,
            request.parent_activity_id || 0
        );
        var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_task_list_filters_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    // console.log('Data of pending count : ', data);
                    global.logger.write('debug', 'Data of pending count: ' + JSON.stringify(data, null, 2), {}, request);

                    (data.length > 0) ? taskCnt = data[0].count: taskCnt = 0;
                    getCatGrpCts(request).then((resp) => {

                        forEachAsync(resp, (next, row) => {
                            if (row.activity_type_category_id == 11) {
                                projectCnt = row.count;
                            }
                            next();
                        }).then(() => {
                            forEachAsync(resp, (next, innerRow) => {
                                if (innerRow.activity_type_category_id == 10) {
                                    innerRow.count = innerRow.count + projectCnt;
                                }

                                if (innerRow.activity_type_category_id != 11) {
                                    responseArray.push(innerRow);
                                }

                                next();
                            }).then(() => {
                                responseArray.push({
                                    count: taskCnt,
                                    activity_type_category_id: 101,
                                    activity_type_category_name: 'Task'
                                });
                                getProjectBadgeCounts(request).then((response) => {
                                    (response.length > 0) ? responseArray.push({
                                        count: response[0].count || 0,
                                        activity_type_category_id: 11,
                                        activity_type_category_name: 'Project'
                                    }): taskCnt = 0;
                                    //resp.push(response);                            
                                    callback(false, responseArray, 200);
                                }).catch((err) => {
                                    // console.log(err);
                                    global.logger.write('debug', err, err, request);

                                    callback(err, false, -9999);
                                });
                            });
                        });


                    }).catch((err) => {
                        // console.log(err);
                        global.logger.write('debug', err, err, request);

                        callback(err, false, -9999);
                    })
                } else {
                    callback(err, false, -9999);
                }
            });
        }
    }

    this.getTasks = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.operating_asset_id,
            request.activity_type_category_id,
            request.activity_sub_type_id,
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_p1_activity_asset_maaping_select_task_pending', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
                        if (err === false) {
                            callback(false, {
                                data: finalData
                            }, 200);
                        }
                    });
                    return;
                } else {
                    callback(err, false, -9999);
                }
            });
        }
    };

    this.getTasksV1 = function (request, callback) {
        var currentDatetime = util.getCurrentUTCTime();
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.operating_asset_id,
            request.activity_type_category_id,
            request.activity_sub_type_id,
            request.flag_filter,
            request.search_string,
            request.start_datetime,
            request.end_datetime,
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit),
            currentDatetime,
            request.coworker_asset_id || 0,
            request.parent_activity_id || 0
        );
        var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_task_list_filters', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
                        if (err === false) {
                            callback(false, {
                                data: finalData
                            }, 200);
                        }
                    });
                    return;
                } else {
                    callback(err, false, -9999);
                }
            });
        }
    };

    this.pendingInmailCount = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.operating_asset_id,
            request.activity_type_category_id,
            request.activity_sub_type_id,
            request.start_datetime,
            request.end_datetime,
            util.getCurrentUTCTime()
        );
        var queryString = util.getQueryString('ds_p1_1_activity_asset_maaping_select_task_pending_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    // console.log('Inmail pending count : ', data);
                    global.logger.write('debug', 'Inmail pending count: ' + JSON.stringify(data, null, 2), {}, request);

                    (data.length > 0) ? callback(false, data, 200): callback(false, {}, 200);
                } else {
                    callback(err, false, -9999);
                }
            });
        }
    };

    var getTaskListFilterCounts = function (request, filter, callback) {
        // if case 14 current date time = current date time - 24 hrs
        // if case 15 start datetime = current datetime, end date time = current datetime + 24 hrs
        var startDatetime, endDatetime, currentDatetime;
        switch (filter) {
            case 14:
                startDatetime = util.getCurrentDate() + " 00:00:00";
                endDatetime = util.getCurrentDate() + " 23:59:59";
                currentDatetime = util.subtractDays(util.getCurrentUTCTime(), 1);
                break;
            case 15:
                startDatetime = util.subtractDays(util.getCurrentUTCTime(), 1);
                endDatetime = util.getCurrentUTCTime();
                currentDatetime = util.getCurrentUTCTime();
                break;
            default:
                startDatetime = util.getCurrentDate() + " 00:00:00";
                endDatetime = util.getCurrentDate() + " 23:59:59";
                currentDatetime = util.getCurrentUTCTime();
                break;
        }
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.operating_asset_id,
            request.activity_type_category_id,
            request.activity_sub_type_id,
            filter,
            request.search_string,
            startDatetime,
            endDatetime,
            currentDatetime,
            request.coworker_asset_id || 0,
            request.parent_activity_id || 0
        );

        var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_task_list_filters_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {

                    if (filter !== 10) {
                        callback(false, {
                            count: data[0].count
                        });
                    } else {
                        callback(false, {
                            pending_count: data[0].pending_count,
                            past_due_count: data[0].past_due_count,
                            due_today_count: data[0].due_today_count
                        });
                    }
                } else {
                    callback(err, false);
                }
            });
        }

    };


    this.getTaskListCounts = function (request, callback) {

        var flags = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17];
        var response = {};
        forEachAsync(flags, function (next, flagValue) {

            getTaskListFilterCounts(request, flagValue, function (err, data) {
                if (err) {
                    callback(err, {}, -9998);
                    return;
                }
                switch (flagValue) {
                    case 0:
                        response.all_count = data;
                        break;
                    case 1:
                        response.pending_count = data;
                        break;
                    case 2:
                        response.past_due_count = data;
                        break;
                    case 3:
                        response.due_today_count = data;
                        break;
                    case 4:
                        response.due_future_count = data;
                        break;
                    case 5:
                        response.search_count = data;
                        break;
                    case 6:
                        response.creator_count = data;
                        break;
                    case 7:
                        response.lead_count = data;
                        break;
                    case 8:
                        response.project_count = data;
                        break;
                    case 9:
                        response.no_lead_count = data;
                        break;
                    case 11:
                        response.non_project_count = data;
                        break;
                    case 12:
                        response.co_worker_lead_count = data;
                        break;
                    case 13:
                        response.project_all_count = data;
                        break;
                    case 14:
                        response.pending_exceeding_24hr_count = data;
                        break;
                    case 15:
                        response.pending_next_24hr_count = data;
                        break;
                    case 17:
                        response.no_file = data;
                        break;
                }
                next();
            });


        }).then(function () {
            callback(false, response, 200);
        });

    }

    function getCatGrpCts(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id
            );
            var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_asst_act_cat_grp_counts', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, resp) {
                    if (err === false) {
                        // console.log('Data of group counts : ', resp);
                        global.logger.write('debug', 'Data of group counts: ' + JSON.stringify(resp, null, 2), {}, request);

                        return resolve(resp);
                        /*forEachAsync(resp, (next, row)=>{                            
                            if(row.activity_type_category_id == 11) {
                                   projectCnt = row.count;                                   
                               }
                            next();
                            }).then(()=>{                               
                               forEachAsync(resp, (next, innerRow)=>{
                                    if(innerRow.activity_type_category_id == 10) {
                                           innerRow.count = innerRow.count + projectCnt;
                                       }
                                    
                                    if(innerRow.activity_type_category_id != 11) {
                                           responseArray.push(innerRow);
                                       }
                                       
                                    next();
                                    }).then(()=>{
                                        return resolve(responseArray);
                                    });                                    
                            });*/
                    } else {
                        return reject(err);
                    }
                });
            }
        });

    }

    function getProjectBadgeCounts(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.asset_id,
                util.getCurrentUTCTime()
            );
            var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_project_pending_count', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, resp) {
                    if (err === false) {
                        // console.log('Badge Counts : ', resp);
                        global.logger.write('debug', 'Badge Counts: ' + JSON.stringify(resp, null, 2), {}, request);

                        return resolve(resp);
                    } else {
                        return reject(err);
                    }
                });
            }
        });

    }

    var formatActivityInlineCollection = function (data, collection, callback) {

        var responseData = new Array();
        data.forEach(function (rowData, index) {
            var rowDataArr = {
                "activity_id": util.replaceDefaultNumber(rowData['activity_id']),
                "activity_title": util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(rowData['activity_title']))),
                //"activity_inline_data": JSON.parse(rowData['activity_inline_data']),
                "asset_id": util.replaceDefaultNumber(rowData['asset_id']),
                "asset_first_name": util.replaceDefaultString(rowData['asset_first_name']),
                "asset_last_name": util.replaceDefaultString(rowData['asset_last_name']),
                "workforce_id": util.replaceZero(rowData['workforce_id']),
                "workforce_name": util.replaceDefaultString(rowData['workforce_name']),
                "account_id": util.replaceZero(rowData['account_id']),
                "account_name": util.replaceDefaultString(rowData['account_name']),
                "organization_id": util.replaceZero(rowData['organization_id']),
                "organization_name": util.replaceDefaultString(rowData['organization_name'])
            };
            if (Object.keys(collection).length > 0) {
                rowDataArr.activity_cover_data = collection;
            } else
                rowDataArr.activity_inline_data = JSON.parse(rowData['activity_inline_data']);
            responseData.push(rowDataArr);
        }, this);
        callback(false, responseData);
    };

    var formatActivityListing = function (data, callback) {
        var responseData = new Array();
        data.forEach(function (rowData, index) {
            var activityCreatorAssetId;
            var activityCreatorAssetFirstName;
            var activityCreatorAssetLastName;
            var activityCreatorAssetImagePath;

            (util.replaceDefaultNumber(rowData['activity_creator_asset_id']) == 0) ?
            activityCreatorAssetId = util.replaceDefaultNumber(rowData['activity_lead_asset_id']):
                activityCreatorAssetId = util.replaceDefaultNumber(rowData['activity_creator_asset_id']);

            (util.replaceDefaultString(rowData['activity_creator_asset_first_name']) == "") ?
            activityCreatorAssetFirstName = util.replaceDefaultString(rowData['activity_lead_asset_first_name']):
                activityCreatorAssetFirstName = util.replaceDefaultString(rowData['activity_creator_asset_first_name']);

            (util.replaceDefaultString(rowData['activity_creator_asset_last_name']) == "") ?
            activityCreatorAssetLastName = util.replaceDefaultString(rowData['activity_lead_asset_last_name']):
                activityCreatorAssetLastName = util.replaceDefaultString(rowData['activity_creator_asset_last_name']);

            (util.replaceDefaultString(rowData['activity_creator_asset_image_path']) == "") ?
            activityCreatorAssetImagePath = util.replaceDefaultString(rowData['activity_lead_asset_image_path']):
                activityCreatorAssetImagePath = util.replaceDefaultString(rowData['activity_creator_asset_image_path']);

            var rowDataArr = {
                "activity_id": util.replaceDefaultNumber(rowData['activity_id']),
                "activity_title": util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(rowData['activity_title']))),
                "activity_description": util.replaceDefaultString(util.decodeSpecialChars(rowData['activity_description'])),
                "activity_inline_data": JSON.parse(util.replaceDefaultJSON(rowData['activity_inline_data'])),
                "activity_type_id": util.replaceDefaultNumber(rowData['activity_type_id']),
                "activity_type_name": (util.replaceDefaultString(rowData['activity_type_id']) === 1) ? 'Personal ' : util.replaceDefaultString(rowData['activity_type_name']),
                "activity_type_category_id": util.replaceDefaultNumber(rowData['activity_type_category_id']),
                "activity_type_category_name": util.replaceDefaultString(rowData['activity_type_category_name']),
                "activity_datetime_start_expected": util.replaceDefaultDatetime(rowData['activity_datetime_start_expected']),
                "activity_datetime_end_expected": util.replaceDefaultString(rowData['activity_datetime_end_expected']),
                "activity_datetime_end_deferred": util.replaceDefaultString(rowData['activity_datetime_end_deferred']),
                "activity_datetime_end_estimated": util.replaceDefaultString(rowData['activity_datetime_end_estimated']),
                "activity_priority_enabled": util.replaceZero(rowData['activity_priority_enabled']),
                "activity_pinned_enabled": util.replaceZero(rowData['activity_pinned_enabled']),
                "activity_flag_active": util.replaceZero(rowData['is_active']),
                "activity_location_latitude": util.replaceZero(rowData['activity_location_latitude']),
                "activity_location_longitude": util.replaceZero(rowData['activity_location_longitude']),
                "activity_status_id": util.replaceDefaultNumber(rowData['activity_status_id']),
                "activity_status_name": util.replaceDefaultString(rowData['activity_status_name']),
                "activity_status_type_id": util.replaceDefaultNumber(rowData['activity_status_type_id']),
                "activity_status_type_name": util.replaceDefaultString(rowData['activity_status_type_name']),
                "activity_owner_asset_id": util.replaceDefaultNumber(rowData['activity_owner_asset_id']),
                "activity_owner_asset_first_name": util.replaceDefaultString(rowData['activity_owner_asset_first_name']),
                "activity_owner_asset_last_name": util.replaceDefaultString(rowData['activity_owner_asset_last_name']),
                "activity_owner_asset_image_path": util.replaceDefaultString(rowData['activity_owner_asset_image_path']),
                "activity_update_count": util.replaceDefaultNumber(rowData['asset_unread_updates_count']),
                "asset_unread_field_updates_count": util.replaceDefaultNumber(rowData['asset_unread_field_updates_count']),
                "asset_unread_updates_count": util.replaceDefaultNumber(rowData['asset_unread_updates_count']),
                "asset_id": util.replaceDefaultNumber(rowData['asset_id']),
                "workforce_id": util.replaceZero(rowData['workforce_id']),
                "workforce_name": util.replaceDefaultString(rowData['workforce_name']),
                "activity_image_path": util.replaceDefaultActivityImage(rowData['activity_image_path']),
                "log_asset_id": util.replaceDefaultNumber(rowData['log_asset_id']),
                "log_state": util.replaceDefaultNumber(rowData['log_state']),
                "log_active": util.replaceDefaultNumber(rowData['log_active']),
                "log_datetime": util.replaceDefaultDatetime(rowData['asset_datetime_last_differential']),
                "asset_participant_access_id": util.replaceDefaultNumber(rowData['asset_participant_access_id']),
                "asset_participant_access_name": util.replaceDefaultString(rowData['asset_participant_access_name']),
                "parent_activity_id": util.replaceDefaultNumber(rowData['parent_activity_id']),
                "parent_activity_title": util.replaceDefaultString(util.decodeSpecialChars(rowData['parent_activity_title'])),
                "parent_activity_datetime_start_expected": util.replaceDefaultDatetime(rowData['parent_activity_datetime_start_expected']),
                "parent_activity_datetime_end_expected": (util.replaceDefaultString(rowData['parent_activity_datetime_end_differed']) !== '') ? util.replaceDefaultDatetime(rowData['parent_activity_datetime_end_  ']) : util.replaceDefaultDatetime(rowData['parent_activity_datetime_end_expected']), //parentActivityEndDiffered,
                "parent_activity_type_id": util.replaceDefaultNumber(rowData['parent_activity_type_id']),
                "parent_activity_type_name": util.replaceDefaultString(rowData['parent_activity_type_name']),
                "parent_activity_type_category_id": util.replaceDefaultNumber(rowData['parent_activity_type_category_id']),
                "parent_activity_type_category_name": util.replaceDefaultString(rowData['parent_activity_type_category_name']),
                "parent_activity_open_count": util.replaceDefaultNumber(rowData['parent_activity_open_count']),
                "parent_activity_closed_count": util.replaceDefaultNumber(rowData['parent_activity_closed_count']),
                "activity_participant_count": util.replaceZero(rowData['participant_count']),
                "account_id": util.replaceZero(rowData['account_id']),
                "account_name": util.replaceDefaultString(rowData['account_name']),
                "form_id": util.replaceZero(rowData['form_id']),
                "form_transaction_id": util.replaceZero(rowData['form_transaction_id']),
                "operating_asset_id": util.replaceZero(rowData['operating_asset_id']),
                "operating_asset_first_name": util.replaceDefaultString(rowData['operating_asset_first_name']),
                "operating_asset_last_name": util.replaceDefaultString(rowData['operating_asset_last_name']),
                "activity_sub_type_id": util.replaceDefaultNumber(rowData['activity_sub_type_id']),
                "activity_sub_type_name": util.replaceDefaultString(rowData['activity_sub_type_name']),
                //BETA
                //"activity_creator_asset_id": util.replaceDefaultNumber(rowData['activity_lead_asset_id']),
                //"activity_creator_asset_first_name": util.replaceDefaultString(rowData['activity_lead_asset_first_name']),
                //"activity_creator_asset_last_name": util.replaceDefaultString(rowData['activity_lead_asset_last_name']),
                //"activity_creator_asset_image_path": util.replaceDefaultString(rowData['activity_lead_asset_image_path']),
                "activity_creator_asset_id": activityCreatorAssetId,
                "activity_creator_asset_first_name": activityCreatorAssetFirstName,
                "activity_creator_asset_last_name": activityCreatorAssetLastName,
                "activity_creator_asset_image_path": activityCreatorAssetImagePath,
                "activity_creator_operating_asset_id": util.replaceDefaultNumber(rowData['activity_creator_operating_asset_id']),
                "activity_creator_operating_asset_first_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_first_name']),
                "activity_creator_operating_asset_last_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_last_name']),
                //Response Required Flag
                "activity_flag_delivery_ontime": util.replaceDefaultNumber(rowData['activity_flag_delivery_ontime']),
                "activity_flag_delivery_quality": util.replaceDefaultNumber(rowData['activity_flag_delivery_quality']),
                "activity_flag_response_required": util.replaceDefaultNumber(rowData['activity_flag_response_required']),
                "activity_flag_response_ontime": util.replaceDefaultNumber(rowData['activity_flag_response_ontime']),
                "activity_flag_creator_status": util.replaceDefaultNumber(rowData['activity_flag_creator_status']),
                "activity_flag_lead_status": util.replaceDefaultNumber(rowData['activity_flag_lead_status']),
                "activity_datetime_creator_status": util.replaceDefaultDatetime(rowData['activity_datetime_creator_status']),
                "activity_datetime_lead_assigned": util.replaceDefaultDatetime(rowData['activity_datetime_lead_assigned']),
                "activity_datetime_lead_status": util.replaceDefaultDatetime(rowData['activity_datetime_lead_status']),
                "activity_datetime_created": util.replaceDefaultDatetime(rowData['activity_datetime_created']),
                "activity_creator_operating_asset_id": util.replaceDefaultNumber(rowData['activity_creator_operating_asset_id']),
                "activity_creator_operating_asset_first_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_first_name']),
                "activity_creator_operating_asset_last_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_last_name']),
                "activity_creator_asset_id": util.replaceDefaultNumber(rowData['activity_creator_asset_id']),
                "activity_creator_asset_first_name": util.replaceDefaultString(rowData['activity_creator_asset_first_name']),
                "activity_creator_asset_last_name": util.replaceDefaultString(rowData['activity_creator_asset_last_name']),
                "activity_flag_rating_creator": util.replaceDefaultNumber(rowData['activity_rating_creator']),
                "activity_rating_creator_decision": util.replaceDefaultNumber(rowData['activity_rating_creator_decision']),
                "activity_rating_creator_planning": util.replaceDefaultNumber(rowData['activity_rating_creator_planning']),
                "activity_rating_creator_specification": util.replaceDefaultNumber(rowData['activity_rating_creator_specification']),
                "activity_flag_rating_lead": util.replaceDefaultNumber(rowData['activity_rating_lead']),
                "activity_rating_lead_ownership": util.replaceDefaultNumber(rowData['activity_rating_lead_ownership']),
                "activity_rating_lead_completion": util.replaceDefaultNumber(rowData['activity_rating_lead_completion']),
                "activity_rating_lead_timeliness": util.replaceDefaultNumber(rowData['activity_rating_lead_timeliness']),
                "activity_flag_file_enabled": util.replaceDefaultNumber(rowData['activity_flag_file_enabled']),
                "count": util.replaceDefaultNumber(rowData['count'])

            };
            responseData.push(rowDataArr);
        }, this);
        callback(false, responseData);
    };

    this.getAssetTasksInProjCount = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.project_activity_id,
            request.activity_type_category_id,
            request.activity_sub_type_id
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_project_sub_task_ount', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, data, 200);
                } else {
                    callback(true, err, -9999);
                }
            });
        }
    }

    this.getLatestPayrollActivity = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.asset_id
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_latest_payroll_activity', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
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

    this.searchActivityByCategory = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.operating_asset_id || 0,
            request.activity_type_category_id,
            request.activity_sub_type_id, // 0 if activity_type_category_id is not 10
            request.flag_filter, // p_flter_flag = 0 - all	// p_flter_flag = 1 - unread	// p_flter_flag = 2 - completed	// p_flter_flag = 3 - past due	// p_flter_flag = 4 - search
            request.search_string,
            request.datetime_differential,
            request.flag_sort,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_project_task_filter', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
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

    this.getOrganizationsOfANumber = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id || 0,
            request.phone_number,
            request.country_code
        );
        var queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, data, 200);
                } else {
                    callback(err, false, -9999);
                }
            });
        }
    };

    this.listMeetingsByDateRangeOrSearchString = function (request, callback) {
        // Parameters: 
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_asset_id BIGINT(20), IN p_operating_asset_id BIGINT(20), IN p_activity_type_category_id 
        // SMALLINT(6), IN p_sub_type_id SMALLINT(6), IN p_flter_flag SMALLINT(6), IN p_search_string 
        // VARCHAR(100), IN p_datetime_start DATETIME, IN p_datetime_end DATETIME, IN p_datetime DATETIME, 
        // IN p_coworker_asset_id BIGINT(20), IN p_parent_activity_id BIGINT(20), IN p_start_from 
        // BIGINT(20), IN p_limit_value TINYINT(4)
        // 
        // p_flter_flag values:
        // 0 => all meetings in a date range 
        // 1 => meetings in a date range which are in progress or scheduled
        // 11 => search all meetings in a date range
        // 
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.operating_asset_id,
            request.activity_type_category_id,
            request.sub_type_id || 0,
            request.flter_flag,
            request.search_string,
            request.datetime_start,
            request.datetime_end,
            request.datetime || '1970-01-01 00:00:00',
            request.coworker_asset_id || 0,
            request.parent_activity_id || 0,
            request.start_from,
            request.limit_value
        );
        let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_day_planner_filters', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, formattedlData) {
                        if (err === false) {
                            callback(false, formattedlData, 200);
                        }
                    });
                } else {
                    callback(err, false, -9999);
                }
            });
        }
    };

    this.countOfMeetingsByDateRangeOrSearchString = function (request, callback) {
        // Parameters: 
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_asset_id BIGINT(20), IN p_operating_asset_id BIGINT(20), IN p_activity_type_category_id 
        // SMALLINT(6), IN p_sub_type_id SMALLINT(6), IN p_flter_flag SMALLINT(6), IN p_search_string 
        // VARCHAR(100), IN p_datetime_start DATETIME, IN p_datetime_end DATETIME, IN p_datetime DATETIME, 
        // IN p_coworker_asset_id BIGINT(20), IN p_parent_activity_id BIGINT(20)
        // 
        // p_flter_flag values:
        // 0 => all meetings in a date range 
        // 1 => meetings in a date range which are in progress or scheduled
        // 11 => search all meetings in a date range
        // 
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.operating_asset_id,
            request.activity_type_category_id,
            request.sub_type_id || 0,
            request.flter_flag,
            request.search_string,
            request.datetime_start,
            request.datetime_end,
            request.datetime || '1970-01-01 00:00:00',
            request.coworker_asset_id || 0,
            request.parent_activity_id || 0
        );
        let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_day_planner_filters_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, data, 200);
                } else {
                    callback(err, false, -9999);
                }
            });
        }
    };

    this.checkIfChatExists = function (request, callback) {
        // Parameters: 
        // IN p_organization_id BIGINT(20), IN p_creator_asset_id BIGINT(20), 
        // IN p_owner_asset_id BIGINT(20)
        // 
        let paramsArr = new Array(
            request.organization_id,
            request.creator_asset_id,
            request.owner_asset_id
        );
        let queryString = util.getQueryString('ds_p1_activity_list_select_asset_chat', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    // Verify if a chat exists
                    if (data.length > 0) {
                        // Chat exists
                        callback(false, {
                            isChatExists: true,
                            data: data
                        }, 200);
                    } else {
                        // Chat doesn't exist
                        callback(false, {
                            isChatExists: false,
                            data: data
                        }, 200);
                    }
                } else {
                    // Error executing the query
                    callback(err, false, -9999);
                }
            });
        }
    };

    this.fetchRecentChatList = function (request, callback) {
        // Parameters: 
        // IN p_organization_id BIGINT(20), IN p_asset_id BIGINT(20), 
        // IN p_start_from BIGINT(20), IN p_limit_value SMALLINT(6)
        // 
        let paramsArr = new Array(
            request.organization_id,
            request.asset_id,
            request.start_from || 0,
            request.limit_value || 50
        );
        // Replaced 'ds_p1_activity_list_select_asset_recent_chats' 
        // with 'ds_p1_activity_asset_mapping_select_recent_chats'
        let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_recent_chats', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, data, 200);
                } else {
                    // Error executing the query
                    callback(err, false, -9999);
                }
            });
        }
    };

};

module.exports = ActivityListingService;
