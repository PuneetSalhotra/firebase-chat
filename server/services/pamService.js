/*
 * author: Nani Kalyan V
 */

function PamService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
    //var cacheWrapper = objectCollection.cacheWrapper;
    //var activityCommonService = objectCollection.activityCommonService;

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

    var formatAssetCoverData = function (rowArray, callback) {
        var responseArr = new Array();
        objectCollection.forEachAsync(rowArray, function (next, row) {
            var rowData = {
                'asset_id': util.replaceDefaultNumber(row['asset_id']),
                'operating_asset_id': util.replaceDefaultNumber(row['operating_asset_id']),
                'asset_first_name': util.replaceDefaultString(row['asset_first_name']),
                'asset_last_name': util.replaceDefaultString(row['asset_last_name']),
                'operating_asset_first_name': util.replaceDefaultString(row['operating_asset_first_name']),
                'operating_asset_last_name': util.replaceDefaultString(row['operating_asset_last_name']),
                'asset_email_id': util.replaceDefaultString(row['asset_email_id']),
                'asset_phone_number': util.replaceDefaultNumber(row['operating_asset_phone_number']),
                'asset_phone_country_code': util.replaceDefaultNumber(row['operating_asset_phone_country_code']),
                'asset_timezone_id': util.replaceDefaultNumber(row['asset_timezone_id']),
                'asset_timezone_offset': util.replaceDefaultString(row['asset_timezone_offset']),
                'asset_last_seen_location_latitude': util.replaceDefaultString(row['asset_last_location_latitude']),
                'asset_last_seen_location_longitude': util.replaceDefaultString(row['asset_last_location_longitude']),
                'asset_last_seen_location_gps_accuracy': util.replaceDefaultString(row['asset_last_location_gps_accuracy']),
                'asset_image_path': util.replaceDefaultString(row['asset_image_path']),
                'workforce_id': util.replaceDefaultNumber(row['workforce_id']),
                'workforce_name': util.replaceDefaultString(row['workforce_name']),
                'account_id': util.replaceDefaultNumber(row['account_id']),
                'account_name': util.replaceDefaultString(row['account_name']),
                'organization_name': util.replaceDefaultString(row['organization_name']),
                'organization_id': util.replaceDefaultNumber(row['organization_id']),
                'asset_status_id': util.replaceDefaultNumber(row['asset_status_id']),
                'asset_status_name': util.replaceDefaultString(row['asset_status_name']),
                'asset_last_location_gps_enabled': util.replaceDefaultNumber(row['asset_last_location_gps_enabled']),
                'asset_last_location_address': util.replaceDefaultString(row['asset_last_location_address']),
                'asset_last_location_datetime': util.replaceDefaultDatetime(row['asset_last_location_datetime']),
                'asset_session_status_id': util.replaceDefaultNumber(row['asset_session_status_id']),
                'asset_session_status_name': util.replaceDefaultString(row['asset_session_status_name']),
                'asset_session_status_datetime': util.replaceDefaultDatetime(row['asset_session_status_datetime']),
                //'asset_status_id': util.replaceDefaultNumber(row['asset_status_id']),
                //'asset_status_name': util.replaceDefaultString(row['asset_status_name']),
                'asset_status_datetime': util.replaceDefaultDatetime(row['asset_status_datetime']),
                'asset_assigned_status_id': util.replaceDefaultNumber(row['asset_assigned_status_id']),
                'asset_assigned_status_name': util.replaceDefaultString(row['asset_assigned_status_name']),
                'asset_assigned_status_datetime': util.replaceDefaultDatetime(row['asset_assigned_status_datetime'])
            };
            responseArr.push(rowData);
            next();
        }).then(function () {
            callback(false, responseArr);
        });
    };

    var formatAssetAccountDataLevel = function (data, callback) {
        var responseArr = new Array();
        forEachAsync(data, function (next, row) {
            var rowData = {
                'user_mapping_id': util.replaceDefaultNumber(row['user_mapping_id']),
                'user_asset_id': util.replaceDefaultNumber(row['user_asset_id']),
                'user_asset_first_name': util.replaceDefaultString(row['user_asset_first_name']),
                'user_asset_last_name': util.replaceDefaultString(row['user_asset_last_name']),
                'user_asset_email_id': util.replaceDefaultString(row['user_asset_email_id']),
                'user_asset_access_role_id': util.replaceDefaultNumber(row['user_asset_access_role_id']),
                'user_asset_access_role_name': util.replaceDefaultString(row['user_asset_access_role_name']),
                'user_asset_access_level_id': util.replaceDefaultNumber(row['user_asset_access_level_id']),
                'user_asset_access_level_name': util.replaceDefaultString(row['user_asset_access_level_name']),
                'activity_id': util.replaceDefaultNumber(row['activity_id']),
                'activity_title': util.replaceDefaultString(row['activity_title']),
                'activity_type_id': util.replaceDefaultNumber(row['activity_type_id']),
                'activity_type_name': util.replaceDefaultString(row['activity_type_name']),
                'activity_type_category_id': util.replaceDefaultNumber(row['activity_type_category_id']),
                'activity_type_category_name': util.replaceDefaultString(row['activity_type_category_name']),
                'asset_id': util.replaceDefaultNumber(row['asset_id']),
                'asset_first_name': util.replaceDefaultString(row['asset_first_name']),
                'asset_last_name': util.replaceDefaultString(row['asset_last_name']),
                'asset_image_path': util.replaceDefaultString(row['asset_image_path']),
                'asset_type_id': util.replaceDefaultNumber(row['asset_type_id']),
                'asset_type_name': util.replaceDefaultString(row['asset_type_name']),
                'asset_type_category_id': util.replaceDefaultNumber(row['asset_type_category_id']),
                'asset_type_category_name': util.replaceDefaultString(row['asset_type_category_name']),
                'workforce_id': util.replaceDefaultNumber(row['workforce_id']),
                'workforce_name': util.replaceDefaultString(row['workforce_name']),
                'workforce_image_path': util.replaceDefaultString(row['workforce_image_path']),
                'workforce_type_id': util.replaceDefaultNumber(row['workforce_type_id']),
                'workforce_type_name': util.replaceDefaultString(row['workforce_type_name']),
                'workforce_type_category_id': util.replaceDefaultNumber(row['workforce_type_category_id']),
                'workforce_type_category_name': util.replaceDefaultString(row['workforce_type_category_name']),
                'account_id': util.replaceDefaultNumber(row['account_id']),
                'account_name': util.replaceDefaultString(row['account_name']),
                'account_image_path': util.replaceDefaultString(row['account_image_path']),
                'account_type_id': util.replaceDefaultNumber(row['account_type_id']),
                'account_type_name': util.replaceDefaultString(row['account_type_name']),
                'account_type_category_id': util.replaceDefaultNumber(row['account_type_category_id']),
                'account_type_category_name': util.replaceDefaultString(row['account_type_category_name']),
                'organization_id': util.replaceDefaultNumber(row['organization_id']),
                'organization_name': util.replaceDefaultString(row['organization_name']),
                'organization_image_path': util.replaceDefaultString(row['organization_image_path']),
                'organization_type_id': util.replaceDefaultNumber(row['organization_type_id']),
                'organization_type_name': util.replaceDefaultString(row['organization_type_name']),
                'organization_type_category_id': util.replaceDefaultNumber(row['organization_type_category_id']),
                'organization_type_category_name': util.replaceDefaultString(row['organization_type_category_name']),
                'workforce_view_map_enabled': util.replaceDefaultNumber(row['workforce_view_map_enabled']),
                'log_asset_id': util.replaceDefaultNumber(row['log_asset_id']),
                'log_asset_first_name': util.replaceDefaultString(row['log_asset_first_name']),
                'log_asset_last_name': util.replaceDefaultString(row['log_asset_first_name']),
                'log_asset_image_path': util.replaceDefaultString(row['log_asset_image_path']),
                'log_datetime': util.replaceDefaultDatetime(row['log_datetime']),
                'log_state': util.replaceDefaultNumber(row['log_state']),
                'log_active': util.replaceDefaultNumber(row['log_active']),
                'update_sequence_id': util.replaceDefaultNumber(row['update_sequence_id'])
            };
            responseArr.push(rowData);
            next();
        }).then(() => {
            callback(false, responseArr);
        });
    };
    
    var formatAccountAccessList = function (data, callback) {
        var responseArr = new Array();
        forEachAsync(data, function (next, rowData) {
            var row = {
                "account_id": util.replaceDefaultNumber(rowData['account_id']),
                "account_name": util.replaceDefaultString(rowData['account_name']),
                "account_image_path": util.replaceDefaultString(rowData['account_image_path']),
                "account_phone_country_code": util.replaceDefaultString(rowData['account_phone_country_code']),
                "account_phone_number": util.replaceDefaultString(rowData['account_phone_number']),
                "account_email": util.replaceDefaultString(rowData['account_email']),
                "account_address": util.replaceDefaultString(rowData['account_address']),
                "account_location_latitude": util.replaceDefaultString(rowData['account_location_latitude']),
                "account_location_longitude": util.replaceDefaultString(rowData['account_location_longitude']),
                "account_contact_person": util.replaceDefaultString(rowData['account_contact_person']),
                "account_fax_country_code": util.replaceDefaultString(rowData['account_fax_country_code']),
                "account_fax_phone_number": util.replaceDefaultString(rowData['account_fax_phone_number']),
                "account_contact_phone_country_code": util.replaceDefaultString(rowData['account_contact_phone_country_code']),
                "account_contact_phone_number": util.replaceDefaultString(rowData['account_contact_phone_number']),
                "account_contact_email": util.replaceDefaultString(rowData['account_contact_email']),
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
                "organization_type_category_name": util.replaceDefaultString(rowData['activity_id']),
                "manager_asset_id": util.replaceDefaultNumber(rowData['manager_asset_id']),
                "manager_asset_first_name": util.replaceDefaultString(rowData['manager_asset_first_name']),
                "manager_asset_last_name": util.replaceDefaultString(rowData['manager_asset_last_name']),
                "manager_asset_image_path": util.replaceDefaultString(rowData['manager_asset_image_path']),
                "manager_asset_type_id": util.replaceDefaultNumber(rowData['manager_asset_type_id']),
                "manager_asset_type_name": util.replaceDefaultString(rowData['manager_asset_type_name']),
                "manager_asset_type_category_id": util.replaceDefaultNumber(rowData['manager_asset_type_category_id']),
                "manager_asset_type_category_name": util.replaceDefaultString(rowData['manager_asset_type_category_name']),
                "log_asset_id": util.replaceDefaultNumber(rowData['log_asset_id']),
                "log_asset_first_name": util.replaceDefaultString(rowData['log_asset_first_name']),
                "log_asset_last_name": util.replaceDefaultString(rowData['log_asset_last_name']),
                "log_asset_image_path": util.replaceDefaultString(rowData['log_asset_image_path']),
                "log_datetime": util.replaceDefaultDatetime(rowData['log_datetime']),
                "log_state": util.replaceDefaultNumber(rowData['log_state']),
                "log_active": util.replaceDefaultNumber(rowData['log_active']),
                "timecard_session_time_out": util.replaceDefaultNumber(rowData['timecard_session_time_out']),
                "payroll_cycle_type_id": util.replaceDefaultNumber(rowData['payroll_cycle_type_id']),
                "payroll_cycle_type_name": util.replaceDefaultString(rowData['payroll_cycle_type_name']),
                "payroll_cycle_start_date": util.replaceDefaultDatetime(rowData['payroll_cycle_start_date']),
                "account_mail_user_id": util.replaceDefaultNumber(rowData['account_mail_user_id']),
                "account_mail_user_name": util.replaceDefaultString(rowData['account_mail_user_name']),
                "account_mail_user_password": util.replaceDefaultString(rowData['account_mail_user_password']),
                "account_mail_user_phone_number": JSON.parse(util.replaceDefaultString(rowData['account_mail_user_phone_number']) || "{}"),
                "account_mail_user_currency_code": util.replaceDefaultString(rowData['account_mail_user_currency_code']),
                "account_mail_user_role_flag": util.replaceDefaultNumber(rowData['account_mail_user_role_flag']),
                "account_mail_user_customer_type": util.replaceDefaultString(rowData['account_mail_user_customer_type']),
                "account_mail_user_status_flag": util.replaceDefaultNumber(rowData['account_mail_user_status_flag']),
                "account_mail_forwarding_address": JSON.parse(util.replaceDefaultString(rowData['account_mail_forwarding_address'])  || "{}"),
                "account_mail_mailing_address": JSON.parse(util.replaceDefaultString(rowData['account_mail_mailing_address'])  || "{}"),
                "account_mail_postbox_id": util.replaceDefaultNumber(rowData['account_mail_postbox_id']),
                "account_mail_postbox_name": util.replaceDefaultString(rowData['account_mail_postbox_name']),
                "account_mail_user_vat_rate": util.replaceDefaultNumber(rowData['account_mail_user_vat_rate'])
            };
            responseArr.push(row);
            next();
        }).then(() => {
            callback(false, responseArr);
        });
    };

}
;

module.exports = PamService;
