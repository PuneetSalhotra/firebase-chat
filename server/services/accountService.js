/*
 * author: Sri Sai Venkatesh
 */

const crypto = require('crypto');
let CryptoJS = require("crypto-js");

function AccountService(objectCollection) {

    let db = objectCollection.db;
    let pgdb = objectCollection.pgdb;
    let util = objectCollection.util;
    let forEachAsync = objectCollection.forEachAsync;
    //var cacheWrapper = objectCollection.cacheWrapper;
    const activityCommonService = objectCollection.activityCommonService;

    this.getAdminAssets = function (request, callback) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.page_start,
            request.page_limit
        );
        let queryString = util.getQueryString('ds_p1_asset_list_select_all_admin_desks', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    formatAssetCoverData(data, function (error, data) {
                        if (error === false)
                            callback(false, {
                                data: data
                            }, 200);
                    });
                } else {
                    callback(false, {}, 200);
                }
            });
        }
    };

    this.getDeskMappingAssets = function (request, callback) {
        let paramsArr = new Array(
            request.organization_id,
            request.asset_id,
            5, // static value
            request.page_start,
            request.page_limit
        );
        let queryString = util.getQueryString('ds_p1_asset_access_mapping_select_user_level_all', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    formatAssetAccountDataLevel(data, function (error, data) {
                        if (error === false)
                            callback(false, {
                                data: data
                            }, 200);
                    });
                } else {
                    callback(false, {}, 200);
                }
            });
        }
    };

    this.retrieveAccountList = function (request, callback) {
        let paramsArr = [];
        paramsArr.push(request.account_id);
        let queryString = util.getQueryString('ds_p1_account_list_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    // console.log(data);
                    //global.logger.write('conLog', 'retrieveAccountList data: ' + JSON.stringify(data, null, 2), {}, {});
                    util.logInfo(request,`conLog retrieveAccountList data: %j`,{data: JSON.stringify(data, null, 2),request});

                    formatAccountAccessList(data, function (error, data) {
                        if (error === false)
                            callback(false, {
                                data: data
                            }, 200);
                    });
                } else {
                    callback(false, {}, 200);
                }
            });
        }
    };

    this.updateAccountEmail = function (request, callback) {

        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.user_id,
            request.user_name,
            request.user_password,
            request.user_customer_type,
            request.user_role_flag,
            request.user_status_flag,
            request.user_currency_code,
            request.user_vat_rate,
            logDatetime,
            request.asset_id
        );
        let queryString = util.getQueryString('ds_p1_account_list_update_user_details', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (!err) {
                    callback(false, {
                        data: data
                    }, 200);
                    accountListHistoryInsert(request, 1003, function () {});
                } else {
                    callback(false, {}, -9998);
                }
            });
        }
    };

    this.updateAccountMailingAddress = function (request, callback) {

        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.mailing_address_collection,
            request.mailing_postbox_id,
            request.mailing_postbox_name,
            logDatetime,
            request.asset_id
        );
        let queryString = util.getQueryString('ds_p1_account_list_update_mailing_address', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (!err) {
                    callback(false, {
                        data: data
                    }, 200);
                    accountListHistoryInsert(request, 1003, function () {});
                } else {
                    callback(false, {}, -9998);
                }
            });
        }
    };

    this.updateAccountForwardingAddress = function (request, callback) {

        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.account_address,
            request.account_forwarding_address,
            logDatetime,
            request.asset_id
        );
        let queryString = util.getQueryString('ds_p1_account_list_update_forwarding_address', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (!err) {
                    callback(false, {
                        data: data
                    }, 200);
                    accountListHistoryInsert(request, 1003, function () {});
                } else {
                    callback(false, {}, -9998);
                }
            });
        }
    };

    this.updateAccountPhone = function (request, callback) {

        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.account_phone_country_code,
            request.account_phone_number,
            request.account_phone_number_collection,
            logDatetime,
            request.asset_id
        );
        let queryString = util.getQueryString('ds_p1_account_list_update_user_phone_number', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (!err) {
                    callback(false, {
                        data: data
                    }, 200);
                    accountListHistoryInsert(request, 1003, function () {});
                } else {
                    callback(false, {}, -9998);
                }
            });
        }
    };



    let formatAssetCoverData = function (rowArray, callback) {
        let responseArr = new Array();
        objectCollection.forEachAsync(rowArray, function (next, row) {
            let rowData = {
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

    let formatAssetAccountDataLevel = function (data, callback) {
        let responseArr = new Array();
        forEachAsync(data, function (next, row) {
            let rowData = {
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

    let formatAccountAccessList = function (data, callback) {
        let responseArr = new Array();
        forEachAsync(data, function (next, rowData) {
            let row = {
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
                "account_mail_forwarding_address": JSON.parse(util.replaceDefaultString(rowData['account_mail_forwarding_address']) || "{}"),
                "account_mail_mailing_address": JSON.parse(util.replaceDefaultString(rowData['account_mail_mailing_address']) || "{}"),
                "account_mail_postbox_id": util.replaceDefaultNumber(rowData['account_mail_postbox_id']),
                "account_mail_postbox_name": util.replaceDefaultString(rowData['account_mail_postbox_name']),
                "account_mail_user_vat_rate": util.replaceDefaultNumber(rowData['account_mail_user_vat_rate']),
                "account_billing_product_id": util.replaceDefaultNumber(rowData['account_billing_product_id']),
                "account_billing_plan_id": util.replaceDefaultNumber(rowData['account_billing_plan_id']),
                "account_billing_customer_id": util.replaceDefaultNumber(rowData['account_billing_customer_id']),
                "account_billing_customer_email": util.replaceDefaultString(rowData['account_billing_customer_email']),
                "account_billing_customer_billing_address": util.replaceDefaultString(rowData['account_billing_customer_billing_address']),
                "account_billing_customer_currency": util.replaceDefaultString(rowData['account_billing_customer_currency']),
                "account_billing_subscription_id": util.replaceDefaultNumber(rowData['account_billing_subscription_id']),
                "account_billing_subscription_status": util.replaceDefaultString(rowData['account_billing_subscription_status']),
                "account_billing_subscription_date": util.replaceDefaultDatetime(rowData['account_billing_subscription_date']),
                "account_billing_payment_status": util.replaceDefaultString(rowData['account_billing_payment_status']),
                "account_billing_payment_gateway": util.replaceDefaultString(rowData['account_billing_payment_gateway']),
                "account_billing_payment_due_date": util.replaceDefaultDatetime(rowData['account_billing_payment_due_date']),
                "account_billing_trail_end_date": util.replaceDefaultDatetime(rowData['account_billing_trail_end_date']),
                "account_billing_asset_id": util.replaceDefaultNumber(rowData['account_billing_asset_id']),
                "account_billing_asset_first_name": util.replaceDefaultString(rowData['account_billing_asset_first_name']),
                "account_billing_asset_last_name": util.replaceDefaultString(rowData['account_billing_asset_last_name']),
                "account_billing_operating_asset_id": util.replaceDefaultNumber(rowData['account_billing_operating_asset_id']),
                "account_billing_operating_asset_first_name": util.replaceDefaultString(rowData['account_billing_operating_asset_first_name']),
                "account_billing_operating_asset_last_name": util.replaceDefaultString(rowData['account_billing_operating_asset_last_name']),
                "account_config_weekly_hours": util.replaceDefaultNumber(rowData['account_config_weekly_hours']),
                "account_config_response_hours": util.replaceDefaultNumber(rowData['account_config_response_hours']),
                "account_config_due_date_hours": util.replaceDefaultNumber(rowData['account_config_due_date_hours'])
            };
            responseArr.push(row);
            next();
        }).then(() => {
            callback(false, responseArr);
        });
    };

    let accountListHistoryInsert = function (request, updateTypeId, callback) {
        let paramsArr = new Array(
            request.account_id,
            request.organization_id,
            updateTypeId,
            request.datetime_log // server log date time
        );

        let queryString = util.getQueryString('ds_p1_account_list_history_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    this.loggingCommunicationReq = function (request, callback) {
        let paramsArr = new Array(
            util.getCurrentUTCTime(),
            JSON.stringify(request)
        );

        let queryString = util.getQueryString('ds_p1_communication_transaction_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, {}, 200): callback(true, err, -9999);
            });
        }
    };

    this.getLoggingCommunicationReq = function (request, callback) {
        let paramsArr = new Array(
            request.start_from,
            request.limit_value
        );

        let queryString = util.getQueryString('ds_p1_communication_transaction_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data, 200): callback(true, err, -9999);
            });
        }
    };

    this.setAccountConfigValues = function (request, callback) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.config_response_time,
            request.config_office_hours,
            request.config_due_date,
            util.getCurrentUTCTime(),
            request.log_asset_id
        );

        let queryString = util.getQueryString('ds_p1_account_list_update_config_values', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, {}, 200): callback(true, err, -9999);
            });
        }
    };

    /*this.fetchCustomerServiceAgentsOnCrmFloor = function (request, callback) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_asset_type_category_id BIGINT(20), IN p_start_from BIGINT(20),
        // IN p_limit_value TINYINT(4)
        var paramsArr = new Array(
            request.organization_id,
            0, // request.account_id,
            19, // request.asset_type_category_id,
            0, // request.start_from,
            50 // request.limit_value,
        );

        var queryString = util.getQueryString('ds_p1_asset_access_mapping_select_asset_type_access', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, data, 200): callback(true, err, -9999);
            });
        }
    };*/

    // Set default landing module for a workforce.
    this.setDefaultModuleForWorkforce = function (request, callback) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_default_module_id SMALLINT(6), 
        // IN p_log_datetime DATETIME, IN p_log_asset_id BIGINT(20)

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.default_module_id,
            request.default_module_lock_enable,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_1_workforce_list_update_default_module', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err) ? callback(true, err, -9999): callback(false, data, 200);
            });
        }
    };

    // Set default landing module for an account.
    this.setDefaultModuleForAccount = function (request, callback) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_default_module_id SMALLINT(6), IN p_log_datetime DATETIME, 
        // IN p_log_asset_id BIGINT(20)

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.default_module_id,
            request.default_module_lock_enable,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_1_account_list_update_default_module', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err) ? callback(true, err, -9999): callback(false, data, 200);
            });
        }
    };

    // Call to update the inline data of the workforce
    this.workforceListUpdateInlineData = async function (request) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_inline_data JSON, 
        // IN p_log_datetime DATETIME, IN p_log_asset_id BIGINT(20)

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.inline_data,
            util.getCurrentUTCTime(),
            request.asset_id
        );

        let queryString = util.getQueryString('ds_p1_workforce_list_update_inline_data', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        // History Insert as well
        try {
            activityCommonService.workforceListHistoryInsert(request, 1102);
        } catch (error) {
            // Nada
        }

        return [error, responseData];
    };

    // Call to get differential data for a workforce
    this.workforceListSelect = async function (request) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_flag TINYINT(4), 
        // IN p_differential_datetime DATETIME, IN p_start_from SMALLINT(6), 
        // IN p_limit_value TINYINT(4)

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.flag,
            request.differential_datetime,
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit)
        );

        let queryString = util.getQueryString('ds_p1_workforce_list_select', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    // Call to search processes
    /*this.workforceActivityTypeMappingSelectSearch = async function (request) {
        // IN p_organization_id bigint(20), IN p_account_id bigint(20), 
        // IN p_workforce_id bigint(20), IN p_search_string VARCHAR(50), 
        // IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.search_string || '',
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit)
        );

        //var queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_select_search', paramsArr);
        //var queryString = util.getQueryString('ds_p1_form_entity_mapping_select_search', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    console.log(data.length);
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };*/

    // Call to search processes
    this.workforceActivityTypeMappingSelectSearch = async function (request) {       

        let responseData = [],
            error = false;

        let i,j;
        let result;                
        for(i=1;i<4;i++) {
            try {
                result = await getActivityTypeMappingSelectSearch(request, i);
                if(result.length > 0) {
                    for(j=0;j<result.length;j++) {
                        let newReq = Object.assign({}, request);
                        newReq.form_id = result[j].form_id;
                        newReq.field_id = 0;
                        newReq.start_from = 0;
                        newReq.limit_value = 1;
                        let [err1, data] = await activityCommonService.workforceFormFieldMappingSelect(newReq);
                        (data.length> 0 && data[0].next_field_id > 0) ? result[j].is_smart = 1 : result[j].is_smart = 0;
                        responseData.push(result[j]);
                    }
                }
            } catch(err) {
                error = err;
            }            
            //console.log(result);
            //console.log('  ');
        }       
        
        return [error, responseData];
    };

    async function getActivityTypeMappingSelectSearch(request, flag) {
        //flag 1,2,3 organization, account, workforce respectively
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,  
            request.asset_id||0,          
            request.search_string || '',
            flag,            
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit)
        );        
        
        let queryString = util.getQueryString('ds_p2_form_entity_mapping_select_search', paramsArr);
        if (queryString !== '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    }

    // Service to fetch S3 User Credentials
    this.fetchS3UserCredentials = async function (request) {

        return [false, {
            username: "wd-user-s3",
            access_key_id: "AKIAI72IRX6A77QNHM6A",
            secret_access_key: "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"
        }];
    };

    this.fetchOrganizationLabels = async function (request) {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id || 0,
            request.account_id || 0,
            request.workforce_id || 0
        );

        let queryString = util.getQueryString('ds_p1_organization_labels_select', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = JSON.parse(data[0].labels);
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];

    };

    //this.fetchCredentials = async function (request) {
    //    const algorithm = 'aes-192-cbc';
    //    const password = 'lp-n5^+8M@62';
    //   
    //    const key = crypto.scryptSync(password, 'salt', 24);        
    //    const iv = Buffer.alloc(16, 0); // Initialization vector.
    //    const cipher = crypto.createCipheriv(algorithm, key, iv);       
//
    //    let paramsArr = new Array(
    //        request.device_os_id,
    //        request.access_key_type_id,
    //        util.getCurrentUTCTime()
    //    );
    //    let queryString = util.getQueryString('ds_p1_access_key_master_select', paramsArr);
    //    if (queryString != '') {
    //        let data = await (db.executeQueryPromise(1, queryString, request));
    //        //console.log('DATA: ', data);
    //        if(data.length > 0) {
    //            let credentials = data[0].access_key_inline_data;
    //            
    //            let encrypted = cipher.update(credentials, 'utf8', 'hex');
    //            encrypted += cipher.final('hex');
    //            //console.log(encrypted);
    //            data[0].access_key_inline_data = encrypted;
    //            return data;
    //        } else {
    //            return new Error;
    //        }
    //        
    //    }        
    //};

    this.fetchCredentials = async function (request) {        
        let paramsArr = new Array(
            request.device_os_id,
            request.access_key_type_id,
            util.getCurrentUTCTime()
        );
        
        let queryString = util.getQueryString('ds_p1_access_key_master_select', paramsArr);
            if (queryString != '') {
                let data = await (db.executeQueryPromise(1, queryString, request));
                //console.log('DATA: ', data);
                if(data.length > 0) {
                    let credentials = data[0].access_key_inline_data;

                    let encrypted = CryptoJS.AES.encrypt(credentials, 'lp-n5^+8M@62');
                    console.log(encrypted.toString());
                    data[0].access_key_inline_data = encrypted.toString();
                    return data;
                } else {
                    return new Error;
                }                
            }        
        };

    this.fetchS3BucketByMonthYear = async function (request) {
        let error = true;
        let responseData = []
        let paramsArr = new Array(
            request.bucket_month,
            request.bucket_year
        );
        let queryString = util.getQueryString('ds_v1_common_aws_s3_bucket_master_select_month_year', paramsArr);
            if (queryString != '') {
                await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })            
            }  
            
        return [error,responseData]
    }

    this.singleaccountMobIoTransactionsSummary = async function (request) {
        let error = true;
        let responseData = []
        let paramsArr = new Array(
            request.asset_id,
            request.month,
            request.year
        );

        let queryString = util.getPgQueryString('ds_p1_ent_singleaccount_mob_iot_transactions_summary_select', paramsArr);
        if (queryString != '') {
            [error, responseData] = await pgdb.executeQueryPromise(1, queryString, request);
        }
        return [error, responseData]
    }


}

module.exports = AccountService;
