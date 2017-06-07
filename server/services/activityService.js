/* 
 * author: Sri Sai Venkatesh
 */


function ActivityService(objectCollection) {

    var db = objectCollection.db;
    var cacheWrapper = objectCollection.cacheWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var util = objectCollection.util;
    this.addActivity = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        var activityData = {activity_id: request.activity_id};
        request['datetime_log'] = logDatetime;
        activityListInsert(request, function (err, boolResult) {

            if (err === false) {
                assetActivityListInsertAddActivity(request, function (err, status) {
                    if (err === false) {

                        // do the timeline transactions here..                    

                        activityCommonService.assetTimelineTransactionInsert(request, {}, 1, function (err, data) {

                        });
                        activityCommonService.activityTimelineTransactionInsert(request, {}, 1, function (err, data) {

                        });
                        activityCommonService.activityListHistoryInsert(request, 0, function (err, restult) {

                        });
                        activityCommonService.assetActivityListHistoryInsert(request, 0, 0, function (err, restult) {

                        });
                        callback(false, activityData, 200);
                        //incr the asset_message_counter
                        cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                            if (err) {
                                console.log("error in setting in asset parity");
                            } else
                                console.log("asset parity is set successfully")

                        });
                        cacheWrapper.setMessageUniqueIdLookup(request.message_unique_id, request.activity_id, function (err, status) {
                            if (err) {
                                console.log("error in setting in message unique id look up");
                            } else
                                console.log("message unique id look up is set successfully")

                        });
                        return;
                    } else {
                        console.log("not inserted to asset activity list");
                        callback(false, activityData, 200);
                    }
                });
            } else {
                callback(err, activityData, -9999);
                return;
            }

        });
    };
    var activityListInsert = function (request, callback) {
        var paramsArr = new Array();
        var activityInlineData = JSON.parse(request.activity_inline_data);
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        /*
         *  IN p_form_id BIGINT(20), IN p_form_transaction_id BIGINT(20)
         */
        switch (activityTypeCategoryId) {
            case 2:    // notepad
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        request.activity_inline_data,
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        0, // activity status taking as 0 for now
                        request.activity_type_id,
                        request.activity_parent_id,
                        activityInlineData.asset_id,
                        activityInlineData.workforce_id,
                        activityInlineData.account_id,
                        activityInlineData.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        0,
                        0
                        );
                break;
            case 3: // plant activity            
            case 4:    // id card            
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        request.activity_inline_data,
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        0, // activity status taking as 0 for now
                        request.activity_type_id,
                        request.activity_parent_id,
                        activityInlineData.employee_asset_id,
                        activityInlineData.employee_workforce_id,
                        activityInlineData.employee_account_id,
                        activityInlineData.employee_organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        0,
                        0
                        );
                break;
            case 5: // coworker card
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        request.activity_inline_data,
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        0, // activity status taking as 0 for now
                        request.activity_type_id,
                        request.activity_parent_id,
                        activityInlineData.contact_asset_id,
                        activityInlineData.contact_workforce_id,
                        activityInlineData.contact_account_id,
                        activityInlineData.contact_organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        0,
                        0
                        );
                break;
            case 6:    // contact
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        request.activity_inline_data,
                        "",
                        0, //activityInlineData.contact_asset_id, //contact asset id
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        0, // activity status taking as 0 for now
                        request.activity_type_id,
                        request.activity_parent_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        0,
                        0
                        );
                break;
            case 9:// form
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        request.activity_inline_data,
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        0, // activity status taking as 0 for now
                        request.activity_type_id,
                        request.activity_parent_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        request.activity_form_id,
                        request.form_transaction_id
                        );
                break;
            default:
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        request.activity_inline_data,
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        0, // activity status taking as 0 for now
                        request.activity_type_id,
                        request.activity_parent_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        0,
                        0
                        );
                break;
        }
        var queryString = util.getQueryString('ds_v1_activity_list_insert_form', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                    return;
                }
            });
        }
    };
    var assetActivityListInsertAddActivity = function (request, callback) {

        var activityInlineData = JSON.parse(request.activity_inline_data);
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        var organisationId = 0;

        switch (activityTypeCategoryId) {
            case 2:    // notepad
                organisationId = activityInlineData.organization_id;
                break;
            case 3: // plant activity            
            case 4:    // id card            
                organisationId = activityInlineData.employee_organization_id;
                break;
            case 5: // coworker card
                organisationId = activityInlineData.contact_organization_id;
                break;
            case 6:    // contact
                organisationId = request.organization_id;
                break;
            case 9:// form
                organisationId = request.organization_id;
                break;
            default:
                organisationId = request.organization_id;
                break;
        }
        var paramsArr = new Array(
                request.activity_id,
                organisationId,
                request.activity_access_role_id,
                request.datetime_log // server log date time
                );

        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_insert', paramsArr);
        if (queryString != '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                    return;
                }
            });
        }


    };
    this.alterActivityStatus = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var proceedStatusUpdate = function () {
            activityListUpdateStatus(request, function (err, data) {
                if (err === false) {
                    assetActivityListUpdateStatus(request, activityStatusId, activityStatusTypeId, function (err, data) {

                    });
                    activityCommonService.activityListHistoryInsert(request, 18, function (err, result) {

                    });
                    activityCommonService.assetTimelineTransactionInsert(request, {}, 11, function (err, data) {

                    });
                    activityCommonService.activityTimelineTransactionInsert(request, {}, 11, function (err, data) {

                    });
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {

                    });
                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {

                    });

                    cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                        if (err) {
                            console.log("error in setting in asset parity");
                        } else
                            console.log("asset parity is set successfully");
                    });
                    callback(false, {}, 200);
                    return;
                } else {
                    callback(err, {}, -9998);
                    return;
                }

            });
        }

        var activityStatusTypeCategoryId = Number(request.activity_status_type_category_id);
        var activityStatusId = Number(request.activity_status_id);
        var activityStatusTypeId = Number(request.activity_status_type_id);
        var activityTypeCategoryId = Number(request.activity_type_category_id);

        if (activityTypeCategoryId === 9) {   //approval
            checkActivityStatusChangeEligibility(request, function (err, proceedStatus) {

            });
            proceedStatusUpdate();
        } else {
            proceedStatusUpdate();
        }
    };
    var checkActivityStatusChangeEligibility = function (request, calback) {
        var paramsArr = new Array(
                request.organization_id,
                request.form_id,
                30
                );
        var queryString = util.getQueryString("ds_v1_workforce_form_field_mapping_select_approval_field_count", paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false)
                {
                    queryString = util.getQueryString("ds_v1_activity_form_transaction_select_approval_field_count", paramsArr);
                    if (queryString != '') {
                        db.executeQuery(1, queryString, request, function (err, countData) {
                            if (err === false)
                            {

                                return;
                            } else {
                                callback(err, false);
                                console.log(err);
                                return;
                            }
                        });
                    }
                    return;
                } else {
                    callback(err, false);
                    console.log(err);
                    return;
                }
            });
        }


    };
    var activityListUpdateStatus = function (request, callback) {

        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                request.activity_status_id,
                request.activity_status_type_id,
                request.datetime_log
                );
        var queryString = util.getQueryString("ds_v1_activity_list_update_status", paramsArr);
        if (queryString != '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    console.log(err);
                    return;
                }
            });
        }
    };
    var assetActivityListUpdateStatus = function (request, activityStatusId, activityStatusTypeId, callback) {

        var paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                0,
                50
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    data.forEach(function (rowData, index) {
                        paramsArr = new Array(
                                request.organization_id,
                                request.account_id,
                                request.workforce_id,
                                request.activity_id,
                                rowData['asset_id'],
                                activityStatusId,
                                activityStatusTypeId,
                                request.datetime_log
                                );
                        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_status', paramsArr);
                        db.executeQuery(0, queryString, request, function (error, queryResponse) {

                        });
                    }, this);
                    callback(false, true);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, false);
                    console.log(err);
                    return;
                }
            });
        }
    };
}
;
module.exports = ActivityService;
