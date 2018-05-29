/*
 * author: Nani Kalyan V
 */

function PamListingService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
       
    
    this.getOrdersUnderAReservation = function(request, callback){
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
                   if(err === false) {
                        formatOrdersData(data).then((finalData)=>{
                            callback(false, finalData, 200);
                        });
                   } else {
                       callback(false, {}, -9999);
                   }
                });
            }
    };
    
    function formatOrdersData(data){
        return new Promise((resolve, reject)=>{
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
                    'activity_datetime_start_expected' : util.replaceDefaultDatetime(row['activity_datetime_start_expected']),
                    'activity_sub_type_name' : util.replaceDefaultString(row['activity_sub_type_name']),
                    'parent_activity_title' : util.replaceDefaultString(row['parent_activity_title']),
                    'channel_activity_id' : util.replaceDefaultNumber(row['channel_activity_id']),
                    'channel_activity_type_category_id' : util.replaceDefaultString(row['channel_activity_type_category_id'])
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
                            callback(false, {data: responseData}, 200);
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
    
    this.eventReport = function(request, callback) {
        callback(false,{}, 200);
    };
}
;

module.exports = PamListingService;
