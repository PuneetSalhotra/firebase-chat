/*
 * author: Sri Sai Venkatesh
 */

function ActivityListingService(objCollection) {

    var db = objCollection.db;
    var util = objCollection.util;
    var activityCommonService = objCollection.activityCommonService;

    this.getActivityListDifferential = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        if (request.hasOwnProperty('activity_type_category_id') && Number(request.device_os_id) === 5) {
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
        } else {
            paramsArr = new Array(
                    request.organization_id,
                    request.asset_id,
                    request.datetime_differential,
                    request.page_start,
                    util.replaceQueryLimit(request.page_limit)
                    );
            queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_differential', paramsArr);
        }
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log(data);
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
                        if (err === false) {
                            callback(false, {data: finalData}, 200);
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
                    formatActivityListing(data, function (err, finalData) {
                        if (err === false) {
                            callback(false, {data: finalData}, 200);
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
    

    this.getActivityInlineCollection = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
        activityCommonService.getActivityDetails(request,0, function (err, activityData) {
            if (err === false) {
                formatActivityInlineCollection(activityData, {}, function (err, responseData) {
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
    };

    this.getActivityCoverCollection = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
        var paramsArr = new Array(
                request.activity_id,
                request.asset_id,
                request.organization_id
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    var coverCollection = {};
                    coverCollection.activity_title = util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(data[0]['activity_title'])));
                    coverCollection.activity_datetime_start = util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(data[0]['activity_datetime_start_expected'])));
                    coverCollection.activity_duedate = util.replaceDefaultString(data[0]['activity_datetime_end_expected']);
                    coverCollection.activity_description = util.replaceDefaultString(util.decodeSpecialChars(data[0]['activity_description']));
                    formatActivityInlineCollection(data, coverCollection, function (err, responseData) {
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
                            callback(false, {data: finalData}, 200);
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
                                        callback(false, {data: finalCoworkerData.concat(finalContactsData)}, 200);
                                    } else {
                                        callback(false, {data: finalCoworkerData}, 200);
                                    }
                                });
                            }
                        });
                    } else {
                        searchContacts(request, function (err, finalContactsData) {
                            callback(false, {data: finalContactsData}, 200);
                        });
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
            case 31:    //calendar event
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
                            callback(false, {data: finalData}, 200);
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
                            callback(false, {data: finalData}, 200);
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
                0
                );
        var queryString = util.getQueryString('ds_v1_activity_list_select_project_status_counts', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                if (err === false) {
                    callback(false, {data: data}, 200);
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
                request.datetime_start,
                request.datetime_end
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_open_payroll_activity', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatActivityListing(data, function (err, finalData) {
                        if (err === false) {
                            callback(false, {data: finalData}, 200);
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
            var rowDataArr = {
                "activity_id": util.replaceDefaultNumber(rowData['activity_id']),
                "activity_title": util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(rowData['activity_title']))),
                "activity_description": util.replaceDefaultString(util.decodeSpecialChars(rowData['activity_description'])),
                "activity_inline_data": JSON.parse(util.replaceDefaultString(rowData['activity_inline_data'])),
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
                "parent_activity_datetime_end_expected": (util.replaceDefaultString(rowData['parent_activity_datetime_end_differed']) !== '') ? util.replaceDefaultDatetime(rowData['parent_activity_datetime_end_differed']) : util.replaceDefaultDatetime(rowData['parent_activity_datetime_end_expected']), //parentActivityEndDiffered,
                "parent_activity_type_id": util.replaceDefaultNumber(rowData['parent_activity_type_id']),
                "parent_activity_type_name": util.replaceDefaultString(rowData['parent_activity_type_name']),
                "parent_activity_type_category_id": util.replaceDefaultNumber(rowData['parent_activity_type_category_id']),
                "parent_activity_type_category_name": util.replaceDefaultString(rowData['parent_activity_type_category_name']),
                "activity_participant_count": util.replaceZero(rowData['participant_count']),
                "account_id": util.replaceZero(rowData['account_id']),
                "account_name": util.replaceDefaultString(rowData['account_name']),
                "form_id": util.replaceZero(rowData['form_id']),
                "form_transaction_id": util.replaceZero(rowData['form_transaction_id']),
                "operating_asset_id": util.replaceZero(rowData['operating_asset_id']),
                "operating_asset_first_name": util.replaceDefaultString(rowData['operating_asset_first_name']),
                "operating_asset_last_name": util.replaceDefaultString(rowData['operating_asset_last_name']),
                "activity_sub_type_id": util.replaceDefaultNumber(rowData['activity_sub_type_id']),
                "activity_sub_type_name": util.replaceDefaultString(rowData['activity_sub_type_name'])
            };
            responseData.push(rowDataArr);
        }, this);
        callback(false, responseData);
    };

}
;

module.exports = ActivityListingService;
