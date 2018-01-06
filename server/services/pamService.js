/*
 * author: Nani Kalyan V
 */

function PamService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
    //var cacheWrapper = objectCollection.cacheWrapper;
    //var activityCommonService = objectCollection.activityCommonService;
    
    this.getWorkforceDifferential = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.diffential_datetime,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
                );
        var queryString = util.getQueryString('ds_p1_workforce_list_select_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    var responseData = new Array();
                    forEachAsync(data, function (next, row) {
                            var rowData = {
                            "workforce_id": util.replaceDefaultNumber(row['workforce_id']),
                            "workforce_name": util.replaceDefaultString(row['workforce_name']),
                            "workforce_image_path": util.replaceDefaultString(row['workforce_image_path']),
                            "workforce_type_id": util.replaceDefaultNumber(row['workforce_type_id']),
                            "workforce_type_name": util.replaceDefaultString(row['workforce_type_name']),
                            "workforce_type_category_id": util.replaceDefaultNumber(row['workforce_type_category_id']),
                            "workforce_type_category_name": util.replaceDefaultString(row['workforce_type_category_name']),
                            "account_id": util.replaceDefaultNumber(row['account_id']),
                            "account_name": util.replaceDefaultString(row['account_name']),
                            "account_image_path": util.replaceDefaultString(row['account_image_path']),
                            "account_type_id": util.replaceDefaultNumber(row['account_type_id']),
                            "account_type_name": util.replaceDefaultString(row['account_type_name']),
                            "account_type_category_id": util.replaceDefaultNumber(row['account_type_category_id']),
                            "account_type_category_name": util.replaceDefaultString(row['account_type_category_name']),
                            "organization_id": util.replaceDefaultNumber(row['organization_id']),
                            "organization_name": util.replaceDefaultString(row['organization_name']),
                            "organization_image_path": util.replaceDefaultString(row['organization_image_path']),
                            "organization_type_id": util.replaceDefaultNumber(row['organization_type_id']),
                            "organization_type_name": util.replaceDefaultString(row['organization_type_name']),
                            "organization_type_category_id": util.replaceDefaultNumber(row['organization_type_category_id']),
                            "organization_type_category_name": util.replaceDefaultString(row['organization_type_category_name']),
                            "manager_asset_id": util.replaceDefaultNumber(row['manager_asset_id']),
                            "manager_asset_first_name": util.replaceDefaultString(row['manager_asset_first_name']),
                            "manager_asset_last_name": util.replaceDefaultString(row['manager_asset_last_name']),
                            "manager_asset_image_path": util.replaceDefaultString(row['manager_asset_image_path']),
                            "manager_asset_type_id": util.replaceDefaultNumber(row['manager_asset_type_id']),
                            "manager_asset_type_name": util.replaceDefaultString(row['manager_asset_type_name']),
                            "manager_asset_type_category_id": util.replaceDefaultNumber(row['manager_asset_type_category_id']),
                            "manager_asset_type_category_name": util.replaceDefaultString(row['manager_asset_type_category_name']),
                            "log_asset_id": util.replaceDefaultNumber(row['log_asset_id']),
                            "log_asset_first_name": util.replaceDefaultString(row['log_asset_first_name']),
                            "log_asset_last_name": util.replaceDefaultString(row['log_asset_last_name']),
                            "log_asset_image_path": util.replaceDefaultString(row['log_asset_image_path']),
                            "log_datetime": util.replaceDefaultDatetime(row['log_datetime']),
                            "log_state": util.replaceDefaultString(row['log_state']),
                            "log_active": util.replaceDefaultString(row['log_active']),
                            "update_sequence_id": util.replaceDefaultNumber(row['update_sequence_id'])
                         }
                            responseData.push(rowData);
                            next();
                        }).then(function () {
                               callback(false, {data: responseData}, 200);
                        });
                  } else {
                    callback(false, {}, 200);
                }
            });
        }
    };

    this.identifyCaller = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.asset_type_category_id,
                request.phone_number,
                request.country_code
                );
        var queryString = util.getQueryString('ds_v1_asset_list_select_phone_number_category', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    //formatAssetCoverData(data, function (error, data) {
                      //  if (error === false)
                            callback(false, {data: data}, 200);
                    //});
                } else {
                    callback(false, {}, -3202);
                }
            });
        }
    };
    
    /*this.getNonMembersCallLog = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.page_start,
                request.page_limit
                );
        var queryString = util.getQueryString('ds_p1_asset_list_select_all_admin_desks', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    //formatAssetCoverData(data, function (error, data) {
                      //  if (error === false)
                            callback(false, {data: data}, 200);
                    //});
                } else {
                    callback(false, {}, 200);
                }
            });
        }
    };*/
    
    this.getCalledTime = function (request, callback) {
        var paramsArr = new Array(
                request.asset_id,
                request.organization_id,
                //request.account_id,
                request.date_start,
                request.date_end,
                request.call_received_datetime
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_before_event_start', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    //formatAssetCoverData(data, function (error, data) {
                      //  if (error === false)
                            callback(false, {response: 'true'}, 200);
                    //});
                } else {
                    callback(false, {response: 'false'}, 200);
                }
            });
        }
    };
    
    
    this.getReservationsCount = function (request, callback) {
        var paramsArr = new Array(
                request.asset_id,
                request.organization_id,
                request.event_activity_id
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_reservation_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data[0].reservation_count);
                    //formatAssetCoverData(data, function (error, data) {
                      //  if (error === false)
                      if(data[0].reservation_count >= 50){
                          util.sendSmsMvaayoo('Dear Customer, No reservation available at this moment. Please contact us again at '+ request.next_datetime, 
                          request.country_code, request.phone_number, function(err,res){});
                          callback(false, {response: 'false'}, 200);
                      } else {
                          callback(false, {response: 'true'}, 200);
                      }
                       //callback(false, {data: data}, 200);
                    //});
                } else {
                    callback(false, {}, 200);
                }
            });
        }
    };
    
    this.generatePasscode = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.page_start,
                request.page_limit
                );
        var queryString = util.getQueryString('ds_p1_asset_list_select_all_admin_desks', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    //formatAssetCoverData(data, function (error, data) {
                      //  if (error === false)
                            callback(false, {data: data}, 200);
                    //});
                } else {
                    callback(false, {}, 200);
                }
            });
        }
    };
    
    this.assetAccessAdd = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        var paramsArr = new Array(
                request.user_asset_id,
                request.asset_email_id,
                request.asset_access_role_id,
                request.asset_access_level_id,
                request.asset_id,
                request.asset_type_id,
                request.activity_id,
                request.activity_type_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.log_asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_p1_asset_access_mapping_insert', paramsArr);
        if (queryString != '') {
            //global.logger.write(queryString, request, 'asset', 'trace');
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    //callback(false, {"asset_id": assetData[0]['asset_id']}, 200);
                    callback(false, {}, 200);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, err, -9999);
                }
            });
        }
    }

}
;

module.exports = PamService;
