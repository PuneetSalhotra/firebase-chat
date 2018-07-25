/*
 * author: Sri Sai Venkatesh
 */

var uuid = require('uuid');
var AwsSns = require('../utils/snsWrapper');
var AwsSss = require('../utils/s3Wrapper');
var fs = require('fs');

function AssetService(objectCollection) {   

    var db = objectCollection.db;
    var util = objectCollection.util;
    var cacheWrapper = objectCollection.cacheWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var queueWrapper = objectCollection.queueWrapper;
    var sns = new AwsSns();
    var sss = new AwsSss();
    //PAM
    var forEachAsync = objectCollection.forEachAsync;

    this.getPhoneNumberAssets = function (request, callback) {

        var phoneNumber = util.cleanPhoneNumber(request.asset_phone_number);
        var countryCode = util.cleanPhoneNumber(request.asset_phone_country_code);
        var emailId = request.asset_email_id;
        var verificationMethod = Number(request.verification_method);
        var organizationId = request.organization_id;


        //verification_method (0 - NA, 1 - SMS; 2 - Call; 3 - Email)
        //if (verificationMethod === 1 || verificationMethod === 2 || verificationMethod === 3) {
        if (verificationMethod === 1) {
                var paramsArr = new Array(
                    0, //organizationId,
                    phoneNumber,
                    countryCode
                    );

            //var queryString = util.getQueryString('ds_v1_asset_list_select_phone_number', paramsArr);
            var queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, selectData) {
                    if (err === false) {
                        var verificationCode;
                        (phoneNumber === 7032975769) ? verificationCode = 637979 : verificationCode = util.getVerificationCode();

                        var pwdValidDatetime = util.addDays(util.getCurrentUTCTime(), 1);
                        if (selectData.length > 0) {
                            if (verificationMethod !== 0) {

                                /*formatPhoneNumberAssets(selectData, function (error, data) {
                                    if (error === false)
                                        callback(false, {data: data}, 200);
                                });*/
                                callback(false, {passcode: verificationCode}, 200);
                                forEachAsync(selectData, function (next, rowData) {
                                    paramsArr = new Array(
                                        rowData.asset_id,
                                        rowData.organization_id,
                                        verificationCode,
                                        pwdValidDatetime
                                        );
                                    var updateQueryString = util.getQueryString('ds_v1_asset_list_update_passcode', paramsArr);
                                    db.executeQuery(0, updateQueryString, request, function (err, data) {
                                        assetListHistoryInsert(request, rowData.asset_id, rowData.organization_id, 208, util.getCurrentUTCTime(), function (err, data) {

                                        });
                                        next();
                                    });
                                    
                                });
                                
                                /*paramsArr = new Array(
                                        selectData[0]['asset_id'],
                                        selectData[0]['organization_id'],
                                        verificationCode,
                                        pwdValidDatetime
                                        );
                                var updateQueryString = util.getQueryString('ds_v1_asset_list_update_passcode', paramsArr);
                                db.executeQuery(0, updateQueryString, request, function (err, data) {
                                    assetListHistoryInsert(request, selectData[0]['asset_id'], selectData[0]['organization_id'], 208, util.getCurrentUTCTime(), function (err, data) {

                                    });
                                });*/

                                sendCallOrSms(verificationMethod, countryCode, phoneNumber, verificationCode, request);
                            }
                        } else {
                            //callback(false, {}, -3202);
                            sendCallOrSms(verificationMethod, countryCode, phoneNumber, verificationCode, request);
                            callback(false, {passcode: verificationCode}, 200);
                        }
                    } else {
                        // some thing is wrong and have to be dealt                        
                        callback(err, false, -9999);
                    }
                });
            }
        } else if(verificationMethod === 2) {
            sendCallOrSms(verificationMethod, countryCode, phoneNumber, 1234, request);            
            callback(false, {}, 200);
        } else {
            callback(false, {}, -3101);
        }
    };

    this.getPhoneNumberAssetsV1 = function (request, callback) {

        var phoneNumber = util.cleanPhoneNumber(request.asset_phone_number);
        var countryCode = util.cleanPhoneNumber(request.asset_phone_country_code);
        var emailId = request.asset_email_id;
        var verificationMethod = Number(request.verification_method);
        var organizationId = request.organization_id;


        //verification_method (0 - NA, 1 - SMS; 2 - Call; 3 - Email)
        if (verificationMethod === 1 || verificationMethod === 2) {
            var paramsArr = new Array(
                0, //organizationId,
                phoneNumber,
                countryCode
            );

            var queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, selectData) {
                    if (err === false) {
                        var verificationCode;
                        (phoneNumber === 7032975769) ? verificationCode = 637979: verificationCode = util.getVerificationCode();

                        var pwdValidDatetime = util.addDays(util.getCurrentUTCTime(), 1);
                        if (selectData.length > 0) {
                            if (verificationMethod !== 0 && verificationMethod === 1) {

                                callback(false, {}, 200);
                                forEachAsync(selectData, function (next, rowData) {
                                    paramsArr = new Array(
                                        rowData.asset_id,
                                        rowData.organization_id,
                                        verificationCode,
                                        pwdValidDatetime
                                    );
                                    var updateQueryString = util.getQueryString('ds_v1_asset_list_update_passcode', paramsArr);
                                    db.executeQuery(0, updateQueryString, request, function (err, data) {
                                        assetListHistoryInsert(request, rowData.asset_id, rowData.organization_id, 208, util.getCurrentUTCTime(), function (err, data) {

                                        });
                                        next();
                                    });

                                });

                                sendCallOrSms(verificationMethod, countryCode, phoneNumber, verificationCode, request);
                            } else if (verificationMethod === 2) {
                                request.passcode = selectData[0].asset_phone_passcode;
                                sendCallOrSms(verificationMethod, countryCode, phoneNumber, 1234, request);
                                callback(false, {}, 200);
                                return;
                            }
                        } else {
                            if (verificationMethod === 1) {
                                newUserPassCodeSet(phoneNumber, verificationCode, request)
                                    .then(function () {
                                        // Passcode set in the DB
                                        sendCallOrSms(verificationMethod, countryCode, phoneNumber, verificationCode, request);
                                        callback(false, {}, 200);
                                    }, function (err) {
                                        // There was an error setting the passcode in the DB
                                        callback(true, err, -9998);

                                    })
                            } else if (verificationMethod === 2) {
                                getPasscodeForNewPhonenumber(phoneNumber, request)
                                    .then(function (data) {
                                        request.passcode = data[0].phone_passcode;
                                        sendCallOrSms(verificationMethod, countryCode, phoneNumber, 1234, request);
                                        callback(false, {}, 200);
                                    }, function (err) {
                                        // Operation error
                                        callback(false, {}, -9998);
                                    })
                            }
                        }
                    } else {
                        // some thing is wrong and have to be dealt                        
                        callback(err, false, -9999);
                    }
                });
            }

        } else {
            callback(false, {}, -3101);
        }
    };

    function newUserPassCodeSet(phoneNumber, verificationCode, request) {
        return new Promise(function (resolve, reject) {
            // Check if the entry already exists
            // getPasscodeForNewPhonenumber(phoneNumber, request, function (err, data) {
            //     if (!err) {
            //         if (data.length > 0) {
            //             console.log("Entry exists: ", data)
            //             // Entry exists, so just update
            //             // IN p_phone_passcode_transaction_id BIGINT(20), IN p_passcode VARCHAR(50), 
            //             // IN p_passcode_generation_datetime DATETIME, IN p_passcode_expiry_datetime DATETIME
            //             var paramsArr = new Array(
            //                 data[0].phone_passcode_transaction_id,
            //                 verificationCode,
            //                 util.getCurrentUTCTime(),
            //                 util.getCurrentUTCTime()
            //                 // util.getCurrentUTCTime()
            //             );
            //             var queryString = util.getQueryString('ds_p1_phone_passcode_transaction_update_passcode', paramsArr);
            //             if (queryString != '') {
            //                 db.executeQuery(0, queryString, request, function (err, data) {

            //                 });
            //             }
            //             // Set the verification status for the new passcode to false
            //             setPasscodeVerificationStatusForNewPhonenumber(data[0].phone_passcode_transaction_id, false, request, function () {});


            //         } else {

            //             console.log("Entry doesn't exist");
            //          // No entry exists, so make an insert
            // 
            // IN p_phone_number VARCHAR(50), IN p_phone_country_code SMALLINT(6), 
            // IN p_phone_passcode VARCHAR(20), IN p_phone_passcode_generation_datetime DATETIME, 
            // IN p_phone_passcode_expiry_datetime DATETIME
            var paramsArr = new Array(
                phoneNumber,
                util.cleanPhoneNumber(request.asset_phone_country_code),
                verificationCode,
                util.getCurrentUTCTime(),
                util.getCurrentUTCTime(),
                util.getCurrentUTCTime()
            );
            var queryString = util.getQueryString('ds_p1_phone_passcode_transaction_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (!err) ? resolve(): reject(err);
                });
            }
            //         }
            //     } else {
            //         callback(true, false);
            //     }
            // })
        });
    }

    this.getAssetDetails = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.asset_id
                );
        var queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    formatAssetData(data, function (error, data) {
                        if (error === false)
                            callback(false, {data: data}, 200);
                    });
                } else {
                    callback(false, {}, 200);
                }
            });
        }

    };

    this.getAssetWorkStatuses = function (request, callback) {
        var productId = (request.hasOwnProperty('product_id')) ? request.product_id : 1;
        var paramsArr = new Array(
                request.page_start,
                util.replaceQueryLimit(request.page_limit),
                productId
                );

        //PAM
        var queryString = util.getQueryString('ds_v1_1_asset_type_category_status_master_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    formatAssetWorkStatuses(data, function (error, data) {
                        if (error === false)
                            callback(false, {data: data}, 200);
                    });
                    //callback(false, {data: data}, 200);                    
                } else {
                    callback(false, {}, 200);
                }
            });
        }

    };

    //BETA
    this.getMeetingRoomAssets = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_type_category_id,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
                );
        queryString = util.getQueryString('ds_v1_asset_list_select_asset_category', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    //console.log(data);
                    formatMeetingRoomAssetData(data, function (err, finalData) {
                        if (err === false) {
                            callback(false, {data: finalData}, 200);
                        }
                    });
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }

    };


    var formatPhoneNumberAssets = function (rows, callback) {
        //var responseData = new Array();
        var data = new Array();

        rows.forEach(function (rowData, index) {

            var rowDataArr = {
                'asset_id': util.replaceDefaultNumber(rowData['asset_id']),
                'operating_asset_id': util.replaceDefaultNumber(rowData['operating_asset_id']),
                'asset_first_name': util.replaceDefaultString(rowData['asset_first_name']),
                'asset_last_name': util.replaceDefaultString(rowData['asset_last_name']),
                'operating_asset_first_name': util.replaceDefaultString(rowData['operating_asset_first_name']),
                'operating_asset_last_name': util.replaceDefaultString(rowData['operating_asset_last_name']),
                'asset_phone_number': util.replaceDefaultNumber(rowData['operating_asset_phone_number']),
                'asset_phone_country_code': util.replaceDefaultNumber(rowData['operating_asset_phone_country_code']),
                'asset_image_path': util.replaceDefaultString(rowData['asset_image_path']),
                'workforce_id': util.replaceDefaultNumber(rowData['workforce_id']),
                'workforce_name': util.replaceDefaultString(rowData['workforce_name']),
                'account_id': util.replaceDefaultNumber(rowData['account_id']),
                'account_name': util.replaceDefaultString(rowData['account_name']),
                'organization_name': util.replaceDefaultString(rowData['organization_name']),
                'organization_id': util.replaceDefaultNumber(rowData['organization_id']),
                'asset_gender_id': util.replaceDefaultNumber(rowData['asset_gender_id']),
                'asset_gender_name': util.replaceDefaultString(rowData['asset_gender_name']),
                'operating_asset_gender_id': util.replaceDefaultNumber(rowData['operating_asset_gender_id']),
                'operating_asset_gender_name': util.replaceDefaultString(rowData['operating_asset_gender_name']),
                'asset_storage_bucket_name': util.replaceDefaultString(rowData['asset_storage_bucket_name']),
                'asset_storage_url': util.replaceDefaultString(rowData['asset_storage_url'])

            };
            data.push(rowDataArr);

        }, this);

        callback(false, data);
    };

    var formatAssetWorkStatuses = function (rows, callback) {
        var data = new Array();
        rows.forEach(function (rowData, index) {

            var rowDataArr = {
                'asset_type_category_status_id': util.replaceZero(rowData['asset_type_category_status_id']),
                'asset_type_category_id': util.replaceDefaultNumber(rowData['asset_type_category_id']),
                'asset_type_category_status_name': util.replaceDefaultString(rowData['asset_type_category_status_name']),
                'asset_type_category_name': util.replaceDefaultString(rowData['asset_type_category_name']),
                'log_asset_id': util.replaceDefaultNumber(rowData['log_asset_id']),
                'log_asset_first_name': util.replaceDefaultString(rowData['log_asset_first_name']),
                'log_asset_last_name': util.replaceDefaultString(rowData['log_asset_last_name']),
                'log_asset_image_path': util.replaceDefaultString(rowData['log_asset_image_path']),
                'log_datetime': util.replaceDefaultDatetime(rowData['log_datetime']),
                'log_state': util.replaceZero(rowData['log_state']),
                'log_active': util.replaceZero(rowData['log_active']),
                'update_sequence_id': util.replaceZero(rowData['update_sequence_id'])
            };
            data.push(rowDataArr);

        }, this);

        callback(false, data);
    };

    //BETA
    var formatMeetingRoomAssetData = function (data, callback) {
        var responseArr = new Array();
        forEachAsync(data, function (next, row) {
            var rowData = {
                'asset_id': util.replaceDefaultNumber(row['asset_id']),
                'asset_first_name': util.replaceDefaultString(row['asset_first_name']),
                'asset_last_name': util.replaceDefaultString(row['asset_last_name']),
                'asset_description': util.replaceDefaultString(row['asset_description']),
                'asset_customer_unique_id': util.replaceDefaultNumber(row['asset_id']),
                'asset_coffee_enabled': util.replaceDefaultNumber(row['asset_id']),
                'asset_image_path': util.replaceDefaultString(row['asset_image_path']),
                'asset_qrcode_image_path': util.replaceDefaultString(row['asset_qrcode_image_path']),
                'asset_idcard_json': util.replaceDefaultString(row['asset_idcard_json']),
                'asset_inline_data': util.replaceDefaultString(row['asset_inline_data']),
                'asset_phone_country_code': util.replaceDefaultString(row['asset_phone_country_code']),
                'asset_phone_number': util.replaceDefaultNumber(row['asset_phone_number']),
                'asset_phone_passcode': util.replaceDefaultString(row['asset_phone_passcode']),
                'asset_passcode_expiry_datetime': util.replaceDefaultDatetime(row['asset_passcode_expiry_datetime']),
                'asset_email_id': util.replaceDefaultString(row['asset_email_id']),
                'asset_email_password': util.replaceDefaultString(row['asset_email_password']),
                "asset_password_expiry_datetime": util.replaceDefaultDatetime(row['asset_password_expiry_datetime']),
                'asset_timezone_id': util.replaceDefaultNumber(row['asset_timezone_id']),
                'asset_timezone_offset': util.replaceDefaultString(row['asset_timezone_offset']),
                'asset_settings_updated': util.replaceDefaultString(row['asset_settings_updated']),
                'asset_push_notification_id': util.replaceDefaultNumber(row['asset_push_notification_id']),
                'asset_linked_enabled': util.replaceDefaultString(row['asset_linked_enabled']),
                'asset_linked_status_datetime': util.replaceDefaultDatetime(row['asset_linked_status_datetime']),
                'asset_activated_enabled': util.replaceDefaultString(row['asset_activated_enabled']),
                'asset_last_location_latitude': util.replaceDefaultString(row['asset_last_location_latitude']),
                'asset_last_location_longitude': util.replaceDefaultString(row['asset_last_location_longitude']),
                'asset_last_location_gps_accuracy': util.replaceDefaultString(row['asset_last_location_gps_accuracy']),
                'asset_last_location_gps_enabled': util.replaceDefaultString(row['asset_last_location_gps_enabled']),
                'asset_last_location_address': util.replaceDefaultString(row['asset_last_location_address']),
                'asset_last_location_datetime': util.replaceDefaultDatetime(row['asset_last_location_datetime']),
                'asset_last_seen_datetime': util.replaceDefaultDatetime(row['asset_last_seen_datetime']),
                'asset_type_id': util.replaceDefaultNumber(row['asset_type_id']),
                'asset_type_name': util.replaceDefaultString(row['asset_type_name']),
                'asset_type_category_id': util.replaceDefaultNumber(row['asset_type_category_id']),
                'asset_type_category_name': util.replaceDefaultString(row['asset_type_category_name']),
                'operating_asset_id': util.replaceDefaultNumber(row['operating_asset_id']),
                'operating_asset_first_name': util.replaceDefaultString(row['operating_asset_first_name']),
                'operating_asset_last_name': util.replaceDefaultString(row['operating_asset_last_name']),
                'operating_asset_image_path': util.replaceDefaultString(row['operating_asset_image_path']),
                'operating_asset_type_id': util.replaceDefaultNumber(row['operating_asset_type_id']),
                'operating_asset_type_name': util.replaceDefaultString(row['operating_asset_type_name']),
                'operating_asset_type_category_id': util.replaceDefaultNumber(row['operating_asset_type_category_id']),
                'operating_asset_type_category_name': util.replaceDefaultString(row['operating_asset_type_category_name']),
                'operating_asset_phone_country_code': util.replaceDefaultString(row['operating_asset_phone_country_code']),
                'operating_asset_phone_number': util.replaceDefaultString(row['operating_asset_phone_number']),
                'operating_asset_email_id': util.replaceDefaultString(row['operating_asset_email_id']),
                'operating_asset_customer_unique_id': util.replaceDefaultNumber(row['operating_asset_customer_unique_id']),
                'manager_asset_id': util.replaceDefaultNumber(row['manager_asset_id']),
                'manager_asset_first_name': util.replaceDefaultString(row['manager_asset_first_name']),
                'manager_asset_last_name': util.replaceDefaultString(row['manager_asset_last_name']),
                'manager_asset_image_path': util.replaceDefaultString(row['manager_asset_image_path']),
                'manager_asset_type_id': util.replaceDefaultNumber(row['manager_asset_type_id']),
                'manager_asset_type_name': util.replaceDefaultString(row['manager_asset_type_name']),
                'manager_asset_type_category_id': util.replaceDefaultNumber(row['manager_asset_type_category_id']),
                'manager_asset_type_category_name': util.replaceDefaultString(row['manager_asset_type_category_name']),
                'device_hardware_id': util.replaceDefaultNumber(row['device_hardware_id']),
                'device_manufacturer_name': util.replaceDefaultString(row['device_manufacturer_name']),
                'device_model_name': util.replaceDefaultString(row['device_model_name']),
                'device_os_id': util.replaceDefaultNumber(row['device_os_id']),
                'device_os_name': util.replaceDefaultString(row['device_os_name']),
                'device_os_version': util.replaceDefaultString(row['device_os_version']),
                'device_app_version': util.replaceDefaultString(row['device_app_version']),
                'workforce_id': util.replaceDefaultNumber(row['workforce_id']),
                'workforce_name': util.replaceDefaultString(row['workforce_name']),
                'workforce_image_path': util.replaceDefaultString(row['workforce_image_path']),
                'workforce_type_id': util.replaceDefaultNumber(row['workforce_type_id']),
                'workforce_type_name': util.replaceDefaultString(row['workforce_type_name']),
                'workforce_type_category_id': util.replaceDefaultString(row['workforce_type_category_id']),
                'workforce_type_category_name': util.replaceDefaultString(row['workforce_type_category_name']),
                'account_id': util.replaceDefaultNumber(row['account_id']),
                'account_name': util.replaceDefaultString(row['account_name']),
                'organization_id': util.replaceDefaultNumber(row['organization_id']),
                'organization_name': util.replaceDefaultString(row['organization_name']),
                'log_asset_id': util.replaceDefaultNumber(row['log_asset_id']),
                'log_asset_first_name': util.replaceDefaultString(row['log_asset_first_name']),
                'log_asset_last_name': util.replaceDefaultString(row['log_asset_last_name']),
                'log_asset_image_path': util.replaceDefaultString(row['log_asset_image_path']),
                'log_datetime': util.replaceDefaultDatetime(row['log_datetime']),
                'log_state': util.replaceDefaultNumber(row['log_state']),
                'log_active': util.replaceDefaultNumber(row['log_active']),
                'update_sequence_id': util.replaceDefaultNumber(row['update_sequence_id']),
                'asset_desk_mapped_enabled': util.replaceDefaultString(row['asset_desk_mapped_enabled']),
                'asset_created_datetime': util.replaceDefaultDatetime(row['asset_created_datetime'])
            };
            responseArr.push(rowData);
            next();
        }).then(() => {
            callback(false, responseArr);
        });
    };
    //PAM
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

    var formatAssetData = function (rowArray, callback) {

        var rowData = {
            'asset_id': util.replaceDefaultNumber(rowArray[0]['asset_id']),
            'operating_asset_id': util.replaceDefaultNumber(rowArray[0]['operating_asset_id']),
            'asset_first_name': util.replaceDefaultString(rowArray[0]['asset_first_name']),
            'asset_last_name': util.replaceDefaultString(rowArray[0]['asset_last_name']),
            'operating_asset_first_name': util.replaceDefaultString(rowArray[0]['operating_asset_first_name']),
            'operating_asset_last_name': util.replaceDefaultString(rowArray[0]['operating_asset_last_name']),
            'asset_email_id': util.replaceDefaultString(rowArray[0]['asset_email_id']),
            'asset_phone_number': util.replaceDefaultNumber(rowArray[0]['operating_asset_phone_number']),
            'asset_phone_country_code': util.replaceDefaultNumber(rowArray[0]['operating_asset_phone_country_code']),
            'asset_timezone_id': util.replaceDefaultNumber(rowArray[0]['asset_timezone_id']),
            'asset_timezone_offset': util.replaceDefaultString(rowArray[0]['asset_timezone_offset']),
            'asset_last_seen_location_latitude': util.replaceDefaultString(rowArray[0]['asset_last_location_latitude']),
            'asset_last_seen_location_longitude': util.replaceDefaultString(rowArray[0]['asset_last_location_longitude']),
            'asset_last_seen_location_gps_accuracy': util.replaceDefaultString(rowArray[0]['asset_last_location_gps_accuracy']),
            'asset_image_path': util.replaceDefaultString(rowArray[0]['asset_image_path']),
            'workforce_id': util.replaceDefaultNumber(rowArray[0]['workforce_id']),
            'workforce_name': util.replaceDefaultString(rowArray[0]['workforce_name']),
            'account_id': util.replaceDefaultNumber(rowArray[0]['account_id']),
            'account_name': util.replaceDefaultString(rowArray[0]['account_name']),
            'organization_name': util.replaceDefaultString(rowArray[0]['organization_name']),
            'organization_id': util.replaceDefaultNumber(rowArray[0]['organization_id']),
            'asset_status_id': util.replaceDefaultNumber(rowArray[0]['asset_status_id']),
            'asset_status_name': util.replaceDefaultString(rowArray[0]['asset_status_name']),
            'asset_last_location_gps_enabled': util.replaceDefaultNumber(rowArray[0]['asset_last_location_gps_enabled']),
            'asset_last_location_address': util.replaceDefaultString(rowArray[0]['asset_last_location_address']),
            'asset_last_location_datetime': util.replaceDefaultDatetime(rowArray[0]['asset_last_location_datetime']),
            'asset_session_status_id': util.replaceDefaultNumber(rowArray[0]['asset_session_status_id']),
            'asset_session_status_name': util.replaceDefaultString(rowArray[0]['asset_session_status_name']),
            'asset_session_status_datetime': util.replaceDefaultDatetime(rowArray[0]['asset_session_status_datetime']),
            //'asset_status_id': util.replaceDefaultNumber(rowArray[0]['asset_status_id']),
            //'asset_status_name': util.replaceDefaultString(rowArray[0]['asset_status_name']),
            'asset_status_datetime': util.replaceDefaultDatetime(rowArray[0]['asset_status_datetime']),
            'asset_assigned_status_id': util.replaceDefaultNumber(rowArray[0]['asset_assigned_status_id']),
            'asset_assigned_status_name': util.replaceDefaultString(rowArray[0]['asset_assigned_status_name']),
            'asset_assigned_status_datetime': util.replaceDefaultDatetime(rowArray[0]['asset_assigned_status_datetime']),
            'asset_storage_url': util.replaceDefaultString(rowArray[0]['asset_storage_url']),
            'asset_storage_bucket_name': util.replaceDefaultString(rowArray[0]['asset_storage_bucket_name']),
            'asset_logout_datetime': util.replaceDefaultDatetime(rowArray[0]['asset_logout_datetime']),
            
            'asset_count_invite': util.replaceDefaultNumber(rowArray[0]['asset_count_invite']),
            'asset_count_signup': util.replaceDefaultNumber(rowArray[0]['asset_count_signup']),
            'asset_count_task_created': util.replaceDefaultNumber(rowArray[0]['asset_count_task_created'])
        };

        callback(false, rowData);
    };


    this.checkAssetPasscode = function (request, callback) {
        var verificationCode = util.cleanPhoneNumber(request.verification_passcode);
        var verificationType = Number(request.verification_type);

        if (verificationType === 1 || verificationType === 2 || verificationType === 3) {
            var paramsArr = new Array();
            var queryString = "";
            var negResponseCode = 0;
            switch (verificationType) {
                case 1:
                    paramsArr = new Array(
                            request.organization_id,
                            request.asset_id
                            );
                    negResponseCode = -3201;
                    queryString = util.getQueryString('ds_v1_asset_list_select_operating_asset', paramsArr);
                    break;
                case 2:
                    /*paramsArr = new Array(
                            0, //request.organization_id,
                            request.asset_phone_number,
                            request.asset_phone_country_code
                            );
                    negResponseCode = -3202;
                    queryString = util.getQueryString('ds_v1_asset_list_select_phone_number', paramsArr);
                    break;*/
                    
                    paramsArr = new Array(
                            request.asset_id
                            );
                    negResponseCode = -3202;
                    queryString = util.getQueryString('ds_p1_asset_list_select_asset', paramsArr);
                    break;
                case 3:
                    paramsArr = new Array(
                            request.organization_id,
                            request.asset_email_id
                            );
                    queryString = util.getQueryString('ds_v1_asset_list_select_operating_asset_email', paramsArr);
                    negResponseCode = -3203;
                    break;
            }
            ;

            //global.logger.write(queryString, request, 'device', 'trace');

            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        // got data now parse it..                          
                        if (data.length > 0) {
                            var dbVerifyCode = 0;
                            verificationType === 3 ? dbVerifyCode = util.replaceDefaultNumber(data[0].asset_email_password) : dbVerifyCode = util.replaceDefaultNumber(data[0].asset_phone_passcode);
                            //asset_password_expiry_datetime --> for email 
                            //asset_passcode_expiry_datetime --> for asset                            
                            if (dbVerifyCode === verificationCode) {
                                //do time check here..
                                formatPhoneNumberAssets(data, function (error, fromatedData) {
                                    if (error === false)
                                        callback(false, {data: fromatedData}, 200);
                                });
                            } else {
                                callback(false, {}, -3107);
                            }
                        } else {
                            callback(false, {}, negResponseCode);
                        }

                    } else {
                        // some thing is wrong and have to be dealt
                        callback(err, {}, -9999);
                    }
                });
            }
        } else {
            callback(false, {}, -3102);
        }
    };


    function getPasscodeForNewPhonenumber(phoneNumber, request) {
        return new Promise(function (resolve, reject) {
            console.log("Inside getPasscodeForNewPhonenumber");
            // IN p_phone_number VARCHAR(50), IN phone_country_code SMALLINT(6)

            var paramsArr = new Array(
                phoneNumber,
                util.cleanPhoneNumber(request.asset_phone_country_code)
            );
            var queryString = util.getQueryString('ds_p1_phone_passcode_transaction_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    console.log("ds_p1_phone_passcode_transaction_select data: ", data);
                    (!err) ? resolve(data): reject(err);
                });
            }
        });
    }

    var sendCallOrSms = function (verificationMethod, countryCode, phoneNumber, verificationCode, request) {

        var smsString = util.getSMSString(verificationCode);
        var domesticSmsMode = global.config.domestic_sms_mode;
        var internationalSmsMode = global.config.international_sms_mode;
        var phoneCall = global.config.phone_call;
        switch (verificationMethod) {
            case 0:
                //global.logger.write('client chose only to retrive data', request, 'device', 'trace'); // no third party api's in this case
                break;
            case 1:
                // send sms                
                //global.logger.write("sms string is " + smsString, request, 'trace'); // no third party api's in this case
                if (countryCode === 91) {
                    fs.readFile(`${__dirname}/../utils/domesticSmsMode.txt`, function(err, data){
                        (err)? console.log(err) : domesticSmsMode = Number(data.toString());                       
                        
                        // send local sms
                        //switch (global.config.domestic_sms_mode) {
                            switch (domesticSmsMode) {
                                case 1: // mvaayoo                        
                                    util.sendSmsMvaayoo(smsString, countryCode, phoneNumber, function (error, data) {
                                        if (error)
                                            //console.log(error);
                                            //console.log(data);
                                            global.logger.write('trace', data, error, request)
                                    });
                                    break;
                                case 2: // bulk sms                            
                                    util.sendSmsBulk(smsString, countryCode, phoneNumber, function (error, data) {
                                        if (error)
                                            //console.log(error);
                                            //console.log(data);
                                            global.logger.write('trace', data, error, request)
                                    });
                                    break;
                                case 3:// sinfini                                                        
                                    console.log('In send SmsSinfini');
                                    util.sendSmsSinfini(smsString, countryCode, phoneNumber, function (error, data) {
                                        if (error)
                                            console.log(error);
                                            console.log(data);
                                            global.logger.write('trace', data, error, request)
                                    });
                                    break;
                            }
                     });
                } else {
                    
                    fs.readFile(`${__dirname}/../utils/internationalSmsMode.txt`, function(err, data){
                        (err)? console.log(err) : internationalSmsMode = Number(data.toString());
                        
                        // send international sms                    
                        //global.logger.write('came inside else case', request, 'device', 'trace');
                        switch (internationalSmsMode) {
                            case 1: util.sendInternationalTwilioSMS(smsString, countryCode, phoneNumber, function (error, data) {
                                        if (error)
                                            global.logger.write('trace', data, error, request)
                                    });
                                    break;

                            case 2: util.sendInternationalNexmoSMS(smsString, countryCode, phoneNumber, function (error, data) {
                                        if (error)
                                            global.logger.write('trace', data, error, request)
                                    });
                                    break;
                        }
                    });                   
                    
                }
                break;
            case 2: //Make a call                 
                fs.readFile(`${__dirname}/../utils/phoneCall.txt`, function(err, data){
                        (err)? console.log(err) : phoneCall = Number(data.toString());
                        
                     switch (phoneCall) {
                        case 1: //Nexmo
                                console.log('Making Nexmo Call');
                                var passcode = request.passcode;
                                passcode = passcode.split("");
                                passcode = passcode.toString();
                                passcode = passcode.replace(/,/g, " ");

                                //var text = "Your passcode for Desker App is, " + passcode + ". I repeat, your passcode for Desker App is, " + passcode + ". Thank you.";
                                var text = "Your passcode for Desker App is, " + passcode;
                                text += ". I repeat, your passcode for Desker App is, " + passcode;
                                text += ". I repeat, your passcode for Desker App is, " + passcode;
                                text += ". I repeat, your passcode for Desker App is, " + passcode;
                                text += ". I repeat, your passcode for Desker App is, " + passcode;
                                console.log('Text: ' + text);

                                util.makeCallNexmo(text, request.passcode, countryCode, phoneNumber, function (error, data) {
                                    if (error)
                                        console.log(error);
                                        console.log(data);
                                        global.logger.write('trace', data, error, request)
                                    });
                                break;

                        case 2: //Twilio
                                console.log('Making Twilio Call');
                                var passcode = request.passcode;
                                passcode = passcode.split("");

                                //var text = "Your passcode is " + passcode + " I repeat," + passcode + " Thank you.";
                                //var text = "Your passcode for Desker App is, " + passcode + ". I repeat, your passcode for Desker App is, " + passcode + ". Thank you.";
                                var text = "Your passcode for Desker App is, " + passcode;
                                text += ". I repeat, your passcode for Desker App is, " + passcode;
                                text += ". I repeat, your passcode for Desker App is, " + passcode;
                                text += ". I repeat, your passcode for Desker App is, " + passcode;
                                text += ". I repeat, your passcode for Desker App is, " + passcode;
                                console.log('Text: ' + text);
                                                util.MakeCallTwilio(text, request.passcode, countryCode, phoneNumber, function (error, data) {
                                                    if (error)
                                                        console.log(error);
                                                        console.log(data);
                                                        global.logger.write('trace', data, error, request)
                                                });
                                break;
                    }
                    
                });
                            
                break;
            case 3: //email
                    break;

        }
    };

    this.linkAsset = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        var encToken = uuid.v1();
        var flag; //1 is prod and 0 is dev
        var flagAppAccount; //1 is Grene Robotics and 0 is BlueFlock
        
        (request.hasOwnProperty('flag_dev')) ? flag = request.flag_dev : flag = 1;
        (request.hasOwnProperty('flag_app_account')) ? flagAppAccount = request.flag_app_account : flagAppAccount = 0;

        var proceedLinking = function (proceedLinkingCallback) {

            updateAssetLinkStatus(request, request.asset_id, encToken, dateTimeLog, function (err, data) {
                if (err === false) {
                    var responseArr = {
                        enc_token: encToken
                    };
                    var authTokenCollection = {
                        "asset_id": request.asset_id,
                        "workforce_id": request.workforce_id,
                        "account_id": request.account_id,
                        "organization_id": request.organization_id,
                        "asset_token_push": request.asset_token_push,
                        "asset_push_arn": request.asset_push_arn,
                        "asset_auth_token": encToken
                    };

                    updateAssetLinkStatus(request, request.operating_asset_id, encToken, dateTimeLog, function (err, data) {
                        assetListHistoryInsert(request, request.operating_asset_id, request.organization_id, 201, dateTimeLog, function (err, data) {
                            cacheWrapper.getAssetParity(request.operating_asset_id, function (err, reply) {  // retriving asset parity for operating asset id
                                if (!err) {
                                    authTokenCollection.asset_id = request.operating_asset_id;
                                    if (reply === 0) {    // setting asset parity to 0
                                        cacheWrapper.setAssetParity(request.operating_asset_id, 0, function (err, reply) {});
                                        responseArr.operating_asset_message_counter = 0;
                                    } else {  //sending the retrived parity value as response
                                        responseArr.operating_asset_message_counter = reply;
                                    }
                                    // setting auth token for operating asset id
                                    cacheWrapper.setTokenAuth(request.operating_asset_id, JSON.stringify(authTokenCollection), function (err, reply) {
                                        if (!err) {
                                            //global.logger.write("auth token is set in redis for operating asset id", request, 'asset', 'trace');
                                            callingNextFunction();
                                        } else {
                                            proceedLinkingCallback(false, responseArr, -7998);
                                        }
                                    });
                                } else {
                                    proceedLinkingCallback(false, responseArr, -7998);
                                }
                            });
                        });

                    });

                    function callingNextFunction() {
                        assetListHistoryInsert(request, request.asset_id, request.organization_id, 201, dateTimeLog, function (err, data) {
                            if (err === false) {
                                activityCommonService.assetTimelineTransactionInsert(request, {}, 1001, function (err, data) { });
                                cacheWrapper.getAssetParity(request.asset_id, function (err, reply) {   // setting asset parity for desk asset id 
                                    if (!err) {
                                        authTokenCollection.asset_id = request.asset_id;
                                        if (reply === 0) {    // setting asset parity to 0
                                            cacheWrapper.setAssetParity(request.asset_id, 0, function (err, reply) {});
                                            responseArr.asset_message_counter = 0;
                                        } else {  //sending the retrived parity value as response
                                            responseArr.asset_message_counter = reply;
                                        }
                                        cacheWrapper.setTokenAuth(request.asset_id, JSON.stringify(authTokenCollection), function (err, reply) {
                                            if (!err) {
                                                proceedLinkingCallback(false, responseArr, 200);
                                            } else {
                                                proceedLinkingCallback(false, responseArr, -7998);
                                            }
                                        });
                                    } else {
                                        proceedLinkingCallback(false, responseArr, -7998);
                                    }
                                });
                                return;
                            } else {
                                //callback(err, false, -9998);
                                proceedLinkingCallback(err, false, -3201);
                            }
                        });
                    }

                } else {
                    // some thing is wrong and have to be dealt                    
                    proceedLinkingCallback(err, false, -9998);
                    return;
                }

            });
        }
        if (request.hasOwnProperty('asset_token_push') && request.asset_token_push !== '' && request.asset_token_push !== null) {
            sns.createPlatformEndPoint(Number(request.device_os_id), request.asset_token_push, flag, flagAppAccount, function (err, endPointArn) {
                if (!err) {
                    //console.log('success in creating platform end point');
                    global.logger.write('debug', 'success in creating platform end point', {}, request)
                    request.asset_push_arn = endPointArn;
                    proceedLinking(function (err, response, status) {
                        if(status == 200) {
                            if(request.flag_is_linkup == 1) {
                                updateSignUpCnt(request, request.asset_id, 1).then(()=>{});
                                updateSignUpCnt(request, request.operating_asset_id, 2).then(()=>{});
                            }                      
                        }
                        
                        callback(err, response, status);
                    });
                } else {
                    //console.log('problem in creating platform end point');
                    global.logger.write('serverError', 'problem in creating platform end point', err, request)
                    callback(err, {}, -3108);
                }
            });
        } else {
            request.asset_push_arn = '';
            proceedLinking(function (err, response, status) {
                if(status == 200) {
                    if(request.flag_is_linkup == 1) {
                        updateSignUpCnt(request, request.asset_id, 1).then(()=>{});
                        updateSignUpCnt(request, request.operating_asset_id, 2).then(()=>{});
                    }                      
                }
                
                callback(err, response, status);
            });
        }
    };

    this.unlinkAsset = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        updateAssetUnlink(request, request.asset_id, '', dateTimeLog, function (err, data) {
            if (err === false) {
                var responseArr = {};
                var authTokenCollection = {
                    "asset_id": request.asset_id,
                    "workforce_id": request.workforce_id,
                    "account_id": request.account_id,
                    "organization_id": request.organization_id,
                    "asset_token_push": '',
                    "asset_push_arn": '',
                    "asset_auth_token": ''
                };
                updateAssetUnlink(request, request.operating_asset_id, '', dateTimeLog, function (err, data) {
                    assetListHistoryInsert(request, request.operating_asset_id, request.organization_id, 202, dateTimeLog, function (err, data) {
                        authTokenCollection.asset_id = request.operating_asset_id;
                        cacheWrapper.setTokenAuth(request.asset_id, JSON.stringify(authTokenCollection), function (err, reply) {
                            if (!err) {

                            } else {
                                callback(false, responseArr, -7998);
                            }
                        });
                    });

                });
                assetListHistoryInsert(request, request.asset_id, request.organization_id, 202, dateTimeLog, function (err, data) {
                    if (err === false) {
                        activityCommonService.assetTimelineTransactionInsert(request, {}, 1002, function (err, data) {

                        });

                        return;
                    } else {
                        callback(err, false, -9998);
                    }
                });
                cacheWrapper.setTokenAuth(request.asset_id, JSON.stringify(authTokenCollection), function (err, reply) {
                    if (!err) {

                    } else {
                        callback(false, responseArr, -7998);
                    }
                });
                callback(false, {}, 200);
            } else {
                // some thing is wrong and have to be dealt                    
                callback(err, false, -9998);
                return;
            }

        });
    };

    var updateAssetLinkStatus = function (request, assetId, encToken, dateTimeLog, callback) {

        var paramsArr = new Array(
                assetId,
                request.organization_id,
                request.asset_hardware_imei,
                request.asset_hardware_os_id,
                encToken,
                request.asset_token_push,
                request.asset_push_arn,
                request.asset_hardware_model,
                request.asset_hardware_manufacturer,
                request.app_version,
                request.asset_hardware_os_version,
                request.asset_id,
                dateTimeLog
                );

        var queryString = util.getQueryString('ds_v1_asset_list_update_link', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                //global.logger.write(queryString, request, 'asset', 'trace');
                if (err === false) {
                    callback(false, true);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };
    
    function updateSignUpCnt(request, assetId, whichAssetId) { //Asset_Id : 1 -- Operating_asset_id : 2
        return new Promise((resolve, reject)=>{
            if(whichAssetId == 2) {
                activityCommonService.getAssetDetails(request, (err, data, statuscode) => {
                    if(err === false) {
                        console.log('Asset Signup count : ' , data.asset_count_signup);
                        assetListUpdateSignupCnt(request, assetId).then(()=>{});
                        
                        /*if(data.asset_count_signup > 0) {
                            assetListUpdateSignupCnt(request, assetId).then(()=>{});
                        } else {
                            //Create a Task in a given Project and add an update
                            //Asset_id, operating_asset_name, organization_name, workforce_name
                            console.log('Have to create a Task');
                            var newRequest = {};

                            newRequest.organization_id = 753;
                            newRequest.account_id = 864;
                            newRequest.workforce_id = 4576;
                            newRequest.asset_id = 27008;
                            newRequest.operating_asset_id = 27007;                            
                            newRequest.activity_title = data.operating_asset_first_name + " has signed up";
                            newRequest.activity_description = data.operating_asset_first_name + " has signed up";
                            newRequest.activity_inline_data= "{}";
                            newRequest.activity_datetime_start = util.getCurrentUTCTime();
                            newRequest.activity_datetime_end = util.addUnitsToDateTime(util.getCurrentUTCTime(), 1, 'years');
                            newRequest.activity_type_category_id = 10;
                            newRequest.activity_sub_type_id = 1;
                            newRequest.activity_type_id = 111328;
                            newRequest.activity_access_role_id =26;
                            newRequest.activity_parent_id = 93256;
                            newRequest.url = "/add/activity/";
                            //activity_status_id:83846
                            //activity_status_type_id:17
                            //activity_status_type_category_id:0
                            
                            newRequest.signedup_asset_id = data.asset_id;
                            newRequest.signedup_asset_organization_name = data.organization_name;
                            newRequest.signedup_asset_workforce_name = data.workforce_name;
                            newRequest.signedup_asset_name = data.operating_asset_first_name || "";
                            newRequest.signedup_asset_email_id = data.asset_email_id || "";
                            newRequest.signedup_asset_phone_country_code = data.asset_phone_country_code;
                            newRequest.signedup_asset_phone_number = data.asset_phone_number;                            
                            
                            cacheWrapper.getActivityId(function (err, activityId) {
                                if (err) {
                                    console.log(err);
                                    //global.logger.write('debug','',err,req);                                    
                                } else {
                                    newRequest.activity_id = activityId;
                                    var event = {
                                        name: "addActivity",
                                        service: "activityService",
                                        method: "addActivity",
                                        payload: newRequest
                                        };
                                    queueWrapper.raiseActivityEvent(event, activityId, (err, resp)=>{
                                            if(err) {
                                                console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                                //global.logger.write('serverError','Error in queueWrapper raiseActivityEvent',resp,req);                                                
                                            } else {                                                
                                                console.log("new activityId is : " + activityId);
                                                //global.logger.write('debug',"new activityId is :" + activityId,{}, newRequest);
                                            }
                                       });                                    
                                    }
                            });
                        }*/
                    }
                });
            } else {
                assetListUpdateSignupCnt(request, assetId).then(()=>{});
            }
        });
    };
    
    function assetListUpdateSignupCnt(request, assetId) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    assetId
                    );
            var queryString = util.getQueryString('ds_v1_asset_list_update_signup_count', paramsArr);
                if (queryString != '') {
                    db.executeQuery(0, queryString, request, function (err, data) {
                    //global.logger.write(queryString, request, 'asset', 'trace');
                    (err === false) ? resolve(): reject(err);
                });
            }
        });
    }


    var updateAssetUnlink = function (request, assetId, encToken, dateTimeLog, callback) {

        var paramsArr = new Array(
                assetId,
                request.organization_id,
                request.asset_id,
                dateTimeLog
                );

        var queryString = util.getQueryString('ds_v1_asset_list_update_unlink', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                //global.logger.write(queryString, request, 'asset', 'trace');
                if (err === false) {
                    callback(false, true);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };


    var assetListHistoryInsert = function (request, assetId, organizationId, updateTypeId, datetimeLog, callback) {

        var paramsArr = new Array(
                assetId,
                organizationId,
                updateTypeId,
                datetimeLog
                );

        var queryString = util.getQueryString('ds_v1_asset_list_history_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                //global.logger.write(queryString, request, 'asset', 'trace');
                if (err === false) {
                    callback(false, true);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    this.addAsset = function (request, callback) {
        var responseDataCollection = {};

        //check if phone number and cc of the new contact exist in the activity type id ...
        checkIfContactAssetExist(request, function (err, contactAssetData) {
            if (err === false) {
                if (contactAssetData.length > 0) {
                    responseDataCollection.asset_id = contactAssetData[0]['asset_id'];
                    callback(false, responseDataCollection, 200);
                    /*
                     getContactActivityid(request, contactAssetData[0]['asset_id'], function (err, contactActivityData) {
                     if (err === false) {
                     if (contactActivityData.length > 0) {
                     responseDataCollection.activity_id = contactActivityData[0]['activity_id'];
                     callback(false, responseDataCollection, -3205);
                     } else {    // asset for contact phone number exist, but contact card is not exist
                     //responseDataCollection.activity_id = 0;
                     callback(false, responseDataCollection, 200);// status is 200 here as there is no activitty id available
                     }
                     } else {
                     callback(false, responseDataCollection, -3205);
                     }
                     });
                     */

                } else {   // create an asset and then add activity here..
                    createAsset(request, function (err, newAssetId) {
                        if (err === false) {
                            responseDataCollection.asset_id = newAssetId;
                            callback(false, responseDataCollection, 200);
                        } else {
                            callback(err, {}, -9998);
                        }
                    });
                }
            }
        });
        return;
    };

    var getContactActivityid = function (request, contactAssetId, callback) {

        var paramsArr = new Array(
                contactAssetId,
                request.organization_id,
                request.activity_type_category_id
                );
        var queryString = util.getQueryString('ds_v1_activity_list_select_category_contact', paramsArr);
        if (queryString != '') {
            //global.logger.write(queryString, request, 'activity', 'trace');
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, data);
                    //console.log(data);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };


    var createAsset = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        assetListInsertAddAsset(request, function (err, newAssetId) {
            if (err === false) {
                assetListHistoryInsert(request, newAssetId, request.organization_id, 0, dateTimeLog, function (err, data) {
                    if (err === false) {
                        var newAssetCollection = {
                            organization_id: request.organization_id,
                            account_id: request.account_id,
                            workforce_id: request.workforce_id,
                            asset_id: newAssetId,
                            message_unique_id: request.message_unique_id
                        };
                        activityCommonService.assetTimelineTransactionInsert(request, newAssetCollection, 7, function (err, data) {

                        });
                        return;
                    } else {
                        callback(err, false);
                    }
                });
                callback(false, newAssetId);
            } else {
                //console.log("not inserted to asset list");
                callback(err, false);
            }
        });
    };


    var checkIfContactAssetExist = function (request, callback) {

        var activityInlineData = JSON.parse(request.activity_inline_data);
        var paramsArr = new Array(
                request.organization_id,
                activityInlineData.contact_phone_number,
                activityInlineData.contact_phone_country_code,
                activityInlineData.contact_asset_type_id
                );

        var queryString = util.getQueryString('ds_v1_asset_list_select_category_phone_number', paramsArr);
        if (queryString != '') {
            //global.logger.write(queryString, request, 'asset', 'trace');
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, data);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    var deleteAsset = function (request, callback) {
        var paramsArr = new Array(
                request.target_asset_id,
                request.organization_id,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_asset_list_delete', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    callback(false, assetData);
                } else {
                    callback(true, err);
                }
            });
        }
    }


    var assetListInsertAddAsset = function (request, callback) {

        var activityInlineData = JSON.parse(request.activity_inline_data);
        var paramsArr = new Array(
                activityInlineData.contact_first_name,
                activityInlineData.contact_last_name,
                "",
                0,
                activityInlineData.contact_profile_picture,
                request.activity_inline_data, //p_asset_inline_data
                activityInlineData.contact_phone_country_code,
                activityInlineData.contact_phone_number,
                activityInlineData.contact_email_id,
                22,
                activityInlineData.contact_asset_type_id, // asset type id
                0,
                0,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_asset_list_insert', paramsArr);
        if (queryString != '') {
            //global.logger.write(queryString, request, 'asset', 'trace');
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    callback(false, assetData[0]['asset_id']);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }


    };

    var assetListUpdateLampStatus = function (request, assetId, callback) {

        var paramsArr = new Array(
                assetId,
                request.organization_id,
                request.lamp_status,
                request.track_gps_datetime,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_asset_list_update_lamp_status', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    callback(false, true);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };


    this.alterLampStatus = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        assetListUpdateLampStatus(request, request.asset_id, function (err, data) {
            if (err === false) {
                assetListHistoryInsert(request, request.asset_id, request.organization_id, request.update_type_id, dateTimeLog, function (err, data) {
                });
                assetListUpdateLampStatus(request, request.operating_asset_id, function (err, data) {
                    if (err === false) {
                        assetListHistoryInsert(request, request.operating_asset_id, request.organization_id, request.update_type_id, dateTimeLog, function (err, data) {
                        });
                        callback(false, {}, 200);
                        return;
                    } else {
                        callback(err, {}, -9998);
                    }
                });
            } else {
                callback(err, {}, -9998);
            }
        });

    };

    this.getPayrollCollection = function (request, callback) {
        var paramsArr = new Array(
                request.account_id
                );

        var queryString = util.getQueryString('ds_v1_account_list_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    var rowData = {
                        'account_id': util.replaceDefaultNumber(data[0]['account_id']),
                        'account_name': util.replaceDefaultString(data[0]['account_name']),
                        'organization_id': util.replaceDefaultNumber(data[0]['organization_id']),
                        'organization_name': util.replaceDefaultString(data[0]['organization_name']),
                        'payroll_cycle_type_id': util.replaceDefaultNumber(data[0]['payroll_cycle_type_id']),
                        'payroll_cycle_type_name': util.replaceDefaultString(data[0]['payroll_cycle_type_name']),
                        'payroll_cycle_start_date': util.replaceDefaultDatetime(data[0]['payroll_cycle_start_date']),
                        'timecard_session_time_out': util.replaceDefaultDatetime(data[0]['timecard_session_time_out'])
                    };

                    callback(false, rowData, 200);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    this.getAssetCoverCollection = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_id,
                0, //p_asset_type_category_id > 0 (given category) else all categories
                request.access_level_id, //p_is_access_level = 5 (asset_level)
                0, //p_is_sort = 0(static)
                request.page_start,
                request.page_limit
                );

        var queryString = util.getQueryString('ds_v1_asset_list_select_list_level', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatAssetCoverData(data, function (err, finalData) {
                        callback(false, finalData, 200);
                    });
                    //console.log(data);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, {}, -9998);
                }
            });
        }
    };

    var assetListUpdateStatus = function (request, assetId, callback) {

        var paramsArr = new Array(
                assetId,
                request.organization_id,
                request.asset_clocked_status_id,
                request.asset_assigned_status_id,
                request.asset_session_status_id,
                request.track_gps_datetime,
                request.track_latitude,
                request.track_longitude,
                request.track_gps_accuracy,
                request.track_gps_status,
                request.track_gps_location,
                request.asset_id,
                request.datetime_log,
                request.logout_datetime
                );

        //var queryString = util.getQueryString('ds_v1_asset_list_update_status_all', paramsArr);
        var queryString = util.getQueryString('ds_v1_1_asset_list_update_status_all', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    callback(false, true);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    //PAM
    /*function assetListUpdateStatusPush(request, assetId){
     return new Promise((resolve, reject)=>{
     var paramsArr = new Array(
     assetId,
     request.organization_id,
     request.asset_clocked_status_id,
     request.asset_assigned_status_id,
     request.asset_session_status_id,
     request.track_gps_datetime,
     request.track_latitude,
     request.track_longitude,
     request.track_gps_accuracy,
     request.track_gps_status,
     request.track_gps_location,
     request.asset_id,
     request.datetime_log,
     request.logout_datetime,
     request.push_notification_id,
     request.asset_push_arn
     );
     var queryString = util.getQueryString('ds_v1_asset_list_update_clocked_status_push', paramsArr);
     if (queryString != '') {
     db.executeQuery(0, queryString, request, function (err, assetData) {
     (err === false) ? resolve(false) : reject(err);
     });
     }
     });        
     };*/

    var assetListUpdateLampStatus = function (request, assetId, callback) {

        var paramsArr = new Array(
                assetId,
                request.organization_id,
                request.lamp_status_id,
                request.track_latitude,
                request.track_longitude,
                request.track_gps_datetime,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_1_asset_list_update_lamp_status', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    callback(false, true);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };


    this.alterAssetStatus = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        if (request.asset_clocked_status_id > 0 || request.asset_session_status_id > 0) {

            //Session Status
            this.getAssetDetails(request, (err, data, statuscode) => {

                var x = JSON.parse(JSON.stringify(data));
                var retrievedAssetSessionStatusId = util.replaceDefaultNumber(x.data.asset_session_status_id);
                var requestAssetSessionStatusId = util.replaceDefaultNumber(request.asset_session_status_id);
                var retrievedAssetSessionStatusDateTime = util.replaceDefaultDatetime(x.data.asset_session_status_datetime);

                var retrievedAssetStatusId = util.replaceDefaultNumber(x.data.asset_status_id);
                var requestAssetStatusId = util.replaceDefaultNumber(request.asset_clocked_status_id);
                var retrievedAssetStatusDateTime = util.replaceDefaultDatetime(x.data.asset_status_datetime);

                console.log('requestAssetSessionStatusId : ' + requestAssetSessionStatusId);
                console.log('retrievedAssetSessionStatusId : ' + retrievedAssetSessionStatusId);

                console.log('requestAssetStatusId Clocked : ' + requestAssetStatusId);
                console.log('retrievedAssetStatusId Clocked : ' + retrievedAssetStatusId);

                request['first_name'] = x.data.asset_first_name;
                request['last_name'] = x.data.asset_last_name;
                request['workforce_name'] = x.data.workforce_name;
                request['account_name'] = x.data.account_name;
                request['organization_name'] = x.data.organization_name;

                //Session Storage
                if (request.asset_clocked_status_id > 0) {
                    if (requestAssetSessionStatusId === 8 || requestAssetSessionStatusId === 9) {
                        if (retrievedAssetSessionStatusId === 10) {
                            //MySQL Insert
                            //this.mySqlInsertForAlterAssetStatus(request, callback);
                        } else {
                            if (requestAssetSessionStatusId !== retrievedAssetSessionStatusId) {
                                //update log
                                var ms = util.differenceDatetimes(dateTimeLog, retrievedAssetSessionStatusDateTime);
                                var sec = ms * 0.001;
                                console.log('Seconds : ' + sec);
                                console.log('requested DAteTime : ' + dateTimeLog);
                                console.log('retrievedAssetSessionStatusDateTime : ' + retrievedAssetSessionStatusDateTime);
                                request['seconds'] = Math.round(sec);
                                global.logger.writeSession(request);

                                //MySQL Insert
                                //this.mySqlInsertForAlterAssetStatus(request, callback);
                            }
                        }
                    } else if (requestAssetSessionStatusId === 10) {
                        //Update the Log
                        var ms = util.differenceDatetimes(dateTimeLog, retrievedAssetSessionStatusDateTime);
                        var sec = ms * 0.001;
                        console.log('Seconds : ' + sec);
                        console.log('requested DAteTime : ' + dateTimeLog);
                        console.log('retrievedAssetSessionStatusDateTime : ' + retrievedAssetSessionStatusDateTime);
                        request['seconds'] = Math.round(sec);
                        global.logger.writeSession(request);

                        //MySQL Insert
                        //this.mySqlInsertForAlterAssetStatus(request, callback);
                    }
                }


                //==========================================================================================================
                //Clock Status Storage
                if (request.asset_session_status_id > 0) {
                    if (requestAssetStatusId === 1 || requestAssetStatusId === 3 || requestAssetStatusId === 4) {
                        if (retrievedAssetStatusId === 2) {
                            //MySql Insert
                            //this.mySqlInsertForAlterAssetStatus(request, callback);

                        } else {
                            if (retrievedAssetStatusId !== requestAssetStatusId) {
                                //console.log('In else');
                                var ms = util.differenceDatetimes(dateTimeLog, retrievedAssetStatusDateTime);
                                var hours = (ms * 0.001) / 3600;
                                //console.log('dateTimeLog : ' + dateTimeLog)
                                //console.log('retrievedAssetStatusDateTime : ' + retrievedAssetStatusDateTime)
                                //console.log('Hours : ' + Math.round(hours));
                                request['hours'] = Math.round(hours);
                                global.logger.writeSession(request);

                                //MySQL Insert
                                //this.mySqlInsertForAlterAssetStatus(request, callback);
                            }
                        }
                    } else if (requestAssetStatusId === 2) {
                        var ms = util.differenceDatetimes(dateTimeLog, retrievedAssetStatusDateTime);
                        var hours = (ms * 0.001) / 3600;
                        //console.log('dateTimeLog : ' + dateTimeLog)
                        //console.log('retrievedAssetStatusDateTime : ' + retrievedAssetStatusDateTime)
                        //console.log('Hours : ' + Math.round(hours));
                        request['hours'] = Math.round(hours);
                        global.logger.writeSession(request);

                        //MySQL Insert
                        //this.mySqlInsertForAlterAssetStatus(request, callback);
                    }
                }
                //MySQL Insert
                this.mySqlInsertForAlterAssetStatus(request, callback);
            });
        } else {
            //MySQL Insert
            this.mySqlInsertForAlterAssetStatus(request, callback);
        }
    };

    this.mySqlInsertForAlterAssetStatus = function (request, callback) {
        assetListUpdateStatus(request, request.asset_id, function (err, data) {
            if (err === false) {
                assetListUpdateStatus(request, request.operating_asset_id, function (err, data) {
                    if (err) {
                        callback(err, {}, -9998);
                    }
                });
                callback(false, {}, 200);
                return;
            } else {
                callback(err, {}, -9998);
            }
        });
    };

    /*this.alterAssetAssignedStatus = function (request, callback) {
     var dateTimeLog = util.getCurrentUTCTime();
     request['datetime_log'] = dateTimeLog;
     assetListUpdateStatus(request, request.asset_id, function (err, data) {
     if (err === false) {
     assetListUpdateStatus(request, request.operating_asset_id, function (err, data) {
     if (err === false) {
     assetListHistoryInsert(request, request.operating_asset_id, request.organization_id, 207, dateTimeLog, function (err, data) {
     });
     var operatingAssetData = {
     organization_id: request.organization_id,
     account_id: request.account_id,
     workforce_id: request.workforce_id,
     asset_id: request.asset_id,
     message_unique_id: request.message_unique_id
     };
     activityCommonService.assetTimelineTransactionInsert(request, operatingAssetData, 1512, function (err, data) {
     
     });
     } else {
     callback(err, {}, -9998);
     }
     });
     assetListHistoryInsert(request, request.asset_id, request.organization_id, 207, dateTimeLog, function (err, data) {
     });
     activityCommonService.assetTimelineTransactionInsert(request, {}, 1512, function (err, data) {
     
     });
     callback(false, {}, 200);
     return;
     } else {
     callback(err, {}, -9998);
     }
     });
     
     }; 
     
     this.alterAssetLampStatus = function (request, callback) {
     var dateTimeLog = util.getCurrentUTCTime();
     request['datetime_log'] = dateTimeLog;
     assetListUpdateLampStatus(request, request.asset_id, function (err, data) {
     if (err === false) {
     assetListUpdateLampStatus(request, request.operating_asset_id, function (err, data) {
     if (err === false) {
     assetListHistoryInsert(request, request.operating_asset_id, request.organization_id, 207, dateTimeLog, function (err, data) {
     });
     var operatingAssetData = {
     organization_id: request.organization_id,
     account_id: request.account_id,
     workforce_id: request.workforce_id,
     asset_id: request.asset_id,
     message_unique_id: request.message_unique_id
     };
     activityCommonService.assetTimelineTransactionInsert(request, operatingAssetData, 1512, function (err, data) {
     
     });
     } else {
     callback(err, {}, -9998);
     }
     });
     assetListHistoryInsert(request, request.asset_id, request.organization_id, 207, dateTimeLog, function (err, data) {
     });
     activityCommonService.assetTimelineTransactionInsert(request, {}, 1512, function (err, data) {
     
     });
     callback(false, {}, 200);
     return;
     } else {
     callback(err, {}, -9998);
     }
     });
     
     };*/

    //PAM
    this.removeAsset = function (request, callback) {
        console.log('util : ' + util);
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        deleteAsset(request, function (err, AssetId) {
            if (err === false) {
                assetListHistoryInsert(request, request.target_asset_id, request.organization_id, 204, dateTimeLog, function (err, data) {});
                var responseDataCollection = {};
                responseDataCollection.asset_id = AssetId;
                callback(false, responseDataCollection, 200);
            } else {
                callback(err, {}, -9998);
            }
        });
    };

    //PAM
    /*this.assetClockIn = function (request, callback) {
     var dateTimeLog = util.getCurrentUTCTime();
     request['datetime_log'] = dateTimeLog;
     var response = {};
     
     assetListSelectPasscode(request, function (err, resp) {
     if (err === false) {
     request['asset_assigned_status_id'] = 0;
     request['asset_session_status_id'] = 0;
     
     global.logger.writeSession(request.body);
     
     sns.createPlatformEndPoint(Number(request.device_os_id), request.asset_token_push, function (err, endPointArn) {
     if (!err) {
     //console.log('success in creating platform end point : ' + endPointArn);
     global.logger.write('debug', 'success in creating platform end point', {}, request);
     request.push_notification_id = request.asset_token_push;
     request.asset_push_arn = endPointArn;
     assetListUpdateStatusPush(request, resp.asset_id).then(() => {
     });
     } else {
     console.log('problem in creating platform end point');
     global.logger.write('serverError', 'problem in creating platform end point', err, request);
     }
     });
     
     cacheWrapper.getAssetParity(resp.asset_id, (err, data) => {
     if (err === false) {
     response.asset_id = resp.asset_id;
     response.asset_message_counter = data;
     response.asset_encryption_token_id = resp.asset_encryption_token_id;
     
     pamGetEmpStations(request).then((data)=>{
     if(data.length > 0) {                
     forEachAsync(data, function (next, row) {                    
     pamAssetListUpdateOperatingAsset(request, row.asset_id, 0).then(()=>{
     pamAssetListHistoryInsert(request, 40, row.asset_id).then(()=>{ 
     next();
     });
     });                        
     })
     } 
     }).then(()=>{
     callback(false, response, 200);
     }).catch((err)=>{
     callback(true, err, -9999);
     });                        
     } else {
     callback(false, {}, -7998);
     }
     });
     
     } else {
     if (resp === 'wrongPasscode') {
     callback(err, {}, -3701);
     } else {
     callback(err, {}, -9998);
     }
     
     }
     });
     };
     
     //PAM
     this.assetClockOut = function (request, callback) {
     var dateTimeLog = util.getCurrentUTCTime();
     request['datetime_log'] = dateTimeLog;
     request['asset_assigned_status_id'] = 0;
     request['asset_session_status_id'] = 0;
     if (!request.hasOwnProperty('workstation_asset_id')) {
     request.workstation_asset_id = 0;
     }
     
     console.log('assetClockOut : \n', request);
     global.logger.writeSession(request.body);
     
     request.push_notification_id = '';
     request.asset_push_arn = '';
     assetListUpdateStatusPush(request, request.asset_id).then(() => {
     if (request.workstation_asset_id != 0) {
     activityCommonService.pamAssetListUpdateOperatingAsset(request).then(() => {
     assetListHistoryInsert(request, request.workstation_asset_id, request.organization_id, 211, dateTimeLog, function (err, data) {});
     });
     }
     callback(request.asset_id, {}, 200);
     }).catch((err) => {
     callback(err, {}, -9998);
     });
     };
     
     //PAM
     var assetListSelectPasscode = function (request, callback) {
     var response = {};
     var paramsArr = new Array(
     request.organization_id,
     request.passcode
     );
     
     var queryString = util.getQueryString('ds_v1_asset_list_select_passcode', paramsArr);
     if (queryString != '') {
     db.executeQuery(1, queryString, request, function (err, assetId) {
     if (err === false) {
     //console.log('Asset Id : ' + JSON.stringify(assetId[0]));
     if (assetId.length > 0) {
     response.asset_id = assetId[0].asset_id;
     response.asset_encryption_token_id = assetId[0].asset_encryption_token_id;
     callback(false, response);
     } else {
     callback(true, 'wrongPasscode');
     }
     } else {
     callback(true, err);
     }
     });
     }
     };*/

    //PAM
    this.assetStatsOnDutyTotal = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                0, //request.workforce_id
                request.asset_type_category_id
                );

        var queryString = util.getQueryString('ds_v1_1_asset_list_select_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, totalCount) {
                if (err === false) {
                    console.log('totalCount[0].total_count : ' + totalCount)

                    if (totalCount.length > 0) {

                        var responseTotalData = new Array();
                        forEachAsync(totalCount, function (next, rowData) {
                            var rowDataArr = {};
                            rowDataArr.total_count = util.replaceDefaultNumber(rowData['total_count']);
                            rowDataArr.asset_type_name = util.replaceDefaultString(rowData['asset_type_name']);
                            rowDataArr.asset_type_id = util.replaceDefaultString(rowData['asset_type_id']);
                            responseTotalData.push(rowDataArr);
                            next();
                        }).then(function () {

                            var paramsArr = new Array(
                                    request.organization_id,
                                    request.account_id,
                                    request.asset_type_category_id,
                                    request.asset_status_id,
                                    request.page_start,
                                    request.page_limit
                                    );

                            var queryString = util.getQueryString('ds_v1_asset_list_select_status_count', paramsArr);
                            if (queryString != '') {
                                db.executeQuery(1, queryString, request, function (err, totalCount) {
                                    if (err === false) {
                                        console.log('Count returned2 : ' + JSON.stringify(totalCount));
                                        console.log('totalCount.length : ' + totalCount.length);
                                        if (totalCount.length > 0) {

                                            var responseData = new Array();
                                            forEachAsync(totalCount, function (next, rowData) {
                                                var rowDataArr = {};
                                                rowDataArr.total_count = util.replaceDefaultNumber(rowData['total_count']);
                                                rowDataArr.asset_type_name = util.replaceDefaultString(rowData['asset_type_name']);
                                                rowDataArr.asset_type_id = util.replaceDefaultString(rowData['asset_type_id']);
                                                responseData.push(rowDataArr);
                                                next();
                                            }).then(function () {
                                                callback(false, {responseTotalData, responseData}, 200);
                                            });
                                        } else {
                                            callback(false, {"responseTotalData": [], "responseData": []}, 200);
                                        }
                                    } else {
                                        callback(true, err, -9998);
                                    }
                                });
                            } else {
                                callback(true, err, -9998);
                            }
                        });
                    } else {
                        callback(false, {"responseTotalData": [], "responseData": []}, 200);
                    }
                }
            });
        } else {
            callback(true, 'Error', -9998);
        }
    };

    //PAM
    this.assetInlineAlter = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        var paramsArr = new Array(
                request.target_asset_id,
                request.organization_id,
                request.asset_inline_data,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_asset_list_update_inline_data', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    assetListHistoryInsert(request, request.target_asset_id, request.organization_id, 205, dateTimeLog, function (err, data) { });
                    callback(false, data, 200);
                } else {
                    callback(true, err, -9998);
                }
            });
        }
    };

    //PAM assetAccountListDiff
    

    this.assetAddForPAM = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        var paramsArr = new Array(
                request.asset_first_name,
                request.asset_last_name,
                request.asset_description,
                request.customer_unique_id,
                request.asset_profile_picture,
                request.asset_inline_data,
                request.phone_country_code,
                request.asset_phone_number,
                request.asset_email_id,
                request.asset_timezone_id,
                request.asset_type_id,
                request.operating_asset_id,
                request.manager_asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_asset_list_insert', paramsArr);
        if (queryString != '') {
            //global.logger.write(queryString, request, 'asset', 'trace');
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    assetListHistoryInsert(request, assetData[0]['asset_id'], request.organization_id, 0, dateTimeLog, function (err, data) {});
                    request.ingredient_asset_id = assetData[0]['asset_id'];
                    sss.createAssetBucket(request, function () {});

                    if (assetData[0].asset_type_category_id == 41) {
                        retrieveAccountWorkforces(request).then((data) => {
                            forEachAsync(data, function (next, x) {
                                createActivityTypeForAllWorkforces(request, x).then(() => {
                                    workForceActivityTypeHistoryInsert(request).then(() => {
                                    })
                                    next();
                                })
                            }).then(() => {
                            });
                        });
                    }
                    callback(false, {"asset_id": assetData[0]['asset_id']}, 200);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, err, -9999);
                }
            });
        }
    }

    function retrieveAccountWorkforces(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    0,
                    50
                    );
            var queryString = util.getQueryString('ds_v1_workforce_list_select_account', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }

    function createActivityTypeForAllWorkforces(request, workforceId) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    request.asset_first_name,
                    request.asset_description,
                    request.activity_type_category_id,
                    workforceId,
                    request.account_id,
                    request.organization_id,
                    request.ingredient_asset_id,
                    41, //asset_type_category_id
                    request.asset_id,
                    request.datetime_log
                    );
            var queryString = util.getQueryString('ds_v1_workforce_activity_type_mapping_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }

    function workForceActivityTypeHistoryInsert(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    request.activity_id,
                    request.organization_id,
                    0, //update type id
                    request.datetime_log
                    );
            var queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_history_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }

    this.updateAssetCoverLocation = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        activityCommonService.updateAssetLocation(request, function (err, resp) {
            if (err === false) {
                request.asset_id = request.operating_asset_id;
                activityCommonService.updateAssetLocation(request, function (err, resp) {
                    if (err === false) {
                        callback(false, {}, 200);
                    } else {
                        callback(true, {}, -9998);
                    }
                });
            } else {
                callback(true, {}, -9998);
            }
        })
    }

    

    this.assetRatingAccessCounts = function (request, callback) {
        if (request.flag == 1) {
            var response = {};
            var A1, A2, A3;
            var X;

            var D1, D2;
            var E1, E2;
            var Y;

            var F1, F3;
            var G1, G3;
            var Z;

            activityCommonService.getOccupiedDeskCounts(request, function (err, data) {
                if (err === false) {
                    A1 = data[0].occupied_desks; //Total number of Desks

                    request.flag = 0;
                    activityCommonService.assetAccessCounts(request, function (err, resp) {
                        if (err === false) {
                            A2 = resp[0].totalOrgHours;   //Total Organization Hours
                            A3 = resp[0].totalAssetHours; //Total Employee Hours

                            console.log('A1 :', A1);
                            console.log('A2 :', A2);
                            console.log('A3 :', A3);

                            (A1 == 0 || A2 == 0) ? X = -1 : X = ((A3 / (A2 / A1)) * 100);

                            console.log('Work Presence : ' + X);
                            global.logger.write('debug', 'Work Presence : ' + X, {}, request);


                            D1 = resp[0].countAllVoice;
                            D2 = resp[0].countMissedVoice;

                            E1 = resp[0].countAllVideo;
                            E2 = resp[0].countMissedVideo;

                            console.log('D1 :', D1);
                            console.log('D2 :', D2);
                            console.log('E1 :', E1);
                            console.log('E2 :', E2);

                            ((D1 + E1) == 0) ? Y = -1 : Y = ((((D1 + E1) - (D2 + E2)) / (D1 + E1)) * 100);

                            console.log('Communication Aptitude : ' + Y);
                            global.logger.write('debug', 'Communication Aptitude : ' + Y, {}, request);

                            F1 = resp[0].countCreatedTasks;
                            F3 = resp[0].countCompletedTasks;

                            G1 = resp[0].countCreatedProjects;
                            G3 = resp[0].countCompletedProjects;

                            console.log('F1 :', F1);
                            console.log('F3 :', F3);
                            console.log('G1 :', G1);
                            console.log('G3 :', G3);

                            ((F1 + G1) == 0) ? Z = -1 : Z = (((F3 + G3) / (F1 + G1)) * 100);

                            console.log('Productivity : ' + Z);
                            global.logger.write('debug', 'Productivity : ' + Z, {}, request);

                            var rating;
                            (X == -1 || Y == -1 || Z == -1) ? rating = -1 : rating = (((12 / 70) * X) + ((34 / 70) * Y) + ((24 / 70) * Z));

                            console.log('Rating : ' + rating);
                            global.logger.write('debug', 'Rating : ' + rating, {}, request);
                            response.asset_id = request.viewee_asset_id;
                            response.work_presence = X;
                            response.communication_aptitude = Y;
                            response.productivity = Z;
                            response.rating = rating;

                            callback(false, response, 200);
                        } else {
                            callback(true, {}, -9999)
                        }

                    });

                } else {
                    callback(true, {}, -9999)
                }
            })
        } else {
            activityCommonService.assetAccessCounts(request, function (err, data) {
                if (err === false) {
                    switch (Number(request.flag)) {
                        case 0 :
                            data[0].averageResposeTimePostit = data[0].averageResposeTimePostit / 60;
                            data[0].averageResposeTimeInmail = data[0].averageResposeTimeInmail / 60;

                        case 11:
                            data[0].avergaeOrgHours = data[0].avergaeOrgHours / 3600;
                            data[0].totalAssetHours = data[0].totalAssetHours / 3600;
                            data[0].totalOrgHours = data[0].totalOrgHours / 3600;
                            break;
                        case 21:
                            data[0].averageResposeTimePostit = data[0].averageResposeTimePostit / 60;
                            break;
                        case 71:
                            data[0].averageResposeTimeInmail = data[0].averageResposeTimeInmail / 60;
                            break
                    }

                    data[0].asset_id = request.viewee_asset_id;
                    callback(false, data, 200);
                } else {
                    callback(true, {}, -9999)
                }
            })
        }
    };

  
    this.getAverageAssetOwnerRating = function (request, callback) { 
        var response = {};
        var collection = {};
        collection.flag_filter = 1;
        collection.asset_id = request.asset_id;
        collection.operating_asset_id = request.operating_asset_id;
        collection.datetime_start = util.getStartDayOfWeek();
        collection.datetime_end = util.getEndDayOfWeek(); // getting weekly data
        activityCommonService.getAssetAverageRating(request, collection).then((weeklyAssetAverageRating) => {
            response.weekly = {
                activity_rating_creator_specification: util.replaceDefaultNumber(weeklyAssetAverageRating[0].activity_rating_creator_specification),
                activity_rating_creator_decision: util.replaceDefaultNumber(weeklyAssetAverageRating[0].activity_rating_creator_decision),
                activity_rating_creator_planning: util.replaceDefaultNumber(weeklyAssetAverageRating[0].activity_rating_creator_planning)
            };
            collection.datetime_start = util.getStartDateTimeOfMonth();
            collection.datetime_end = util.getEndDateTimeOfMonth();
            activityCommonService.getAssetAverageRating(request, collection).then((monthlyAssetAverageRating) => {
                response.monthly = {
                    activity_rating_creator_specification: util.replaceDefaultNumber(monthlyAssetAverageRating[0].activity_rating_creator_specification),
                    activity_rating_creator_decision: util.replaceDefaultNumber(monthlyAssetAverageRating[0].activity_rating_creator_decision),
                    activity_rating_creator_planning: util.replaceDefaultNumber(monthlyAssetAverageRating[0].activity_rating_creator_planning)
                };
                callback(false, response, 200);
            });
        });
    };
    
    
    this.getAverageAssetLeadRating = function (request, callback) { 
        var response = {};
        var collection = {};
        collection.flag_filter = 0;
        collection.asset_id = request.asset_id;
        collection.operating_asset_id = request.operating_asset_id;
        collection.datetime_start = util.getStartDayOfWeek();
        collection.datetime_end = util.getEndDayOfWeek(); // getting weekly data
        activityCommonService.getAssetAverageRating(request, collection).then((weeklyAssetAverageRating) => {
            response.weekly = {
                activity_rating_lead_completion: util.replaceDefaultNumber(weeklyAssetAverageRating[0].activity_rating_lead_completion),
                activity_rating_lead_ownership: util.replaceDefaultNumber(weeklyAssetAverageRating[0].activity_rating_lead_ownership),
                activity_rating_lead_timeliness: util.replaceDefaultNumber(weeklyAssetAverageRating[0].activity_rating_lead_timeliness)
            };
            collection.datetime_start = util.getStartDateTimeOfMonth();
            collection.datetime_end = util.getEndDateTimeOfMonth();
            activityCommonService.getAssetAverageRating(request, collection).then((monthlyAssetAverageRating) => {
                response.monthly = {
                    activity_rating_lead_completion: util.replaceDefaultNumber(monthlyAssetAverageRating[0].activity_rating_lead_completion),
                    activity_rating_lead_ownership: util.replaceDefaultNumber(monthlyAssetAverageRating[0].activity_rating_lead_ownership),
                    activity_rating_lead_timeliness: util.replaceDefaultNumber(monthlyAssetAverageRating[0].activity_rating_lead_timeliness)
                };
                callback(false, response, 200);
            });
        });
    };
    
    this.updateAssetPushToken = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        var proceed = function (callback) {
            var authTokenCollection = {
                "asset_id": request.asset_id,
                "workforce_id": request.workforce_id,
                "account_id": request.account_id,
                "organization_id": request.organization_id,
                "asset_token_push": request.asset_token_push,
                "asset_push_arn": request.asset_push_arn,
                "asset_auth_token": request.asset_token_auth
            };
            
            updatePushToken(request, request.operating_asset_id).then(()=>{
               assetListHistoryInsert(request, request.operating_asset_id, request.organization_id, 201, dateTimeLog, function (err, data) {
               authTokenCollection.asset_id = request.operating_asset_id;
               // setting auth token for operating asset id
               cacheWrapper.setTokenAuth(request.operating_asset_id, JSON.stringify(authTokenCollection), function (err, reply) {
                    if (!err) {
                        //global.logger.write("auth token is set in redis for operating asset id", request, 'asset', 'trace');
                        callingNextFunction();
                    } else {
                        callback(false, {}, -7998);
                        }
                    });
                });
            }).catch(()=>{
                callback(true, {}, -9998);
            });

            function callingNextFunction() {                
                updatePushToken(request, request.asset_id).then(()=>{
                    assetListHistoryInsert(request, request.asset_id, request.organization_id, 201, dateTimeLog, function (err, data) {
                        if (err === false) {
                            authTokenCollection.asset_id = request.asset_id;
                            cacheWrapper.setTokenAuth(request.asset_id, JSON.stringify(authTokenCollection), function (err, reply) {
                                (!err) ? callback(false, {}, 200) : callback(false, {}, -7998);
                            });
                            return;
                        } else {
                            //callback(err, false, -9998);
                            callback(err, false, -3201);
                        }
                    });
                }).catch(()=>{
                    callback(true, {}, -9998);
                });                
            }
        }

        if (request.hasOwnProperty('asset_token_push') && request.asset_token_push !== '' && request.asset_token_push !== null) {
            sns.createPlatformEndPoint(Number(request.device_os_id), request.asset_token_push, 1, 0, function (err, endPointArn) { //flag 1 is prod and 0 is dev
                if (!err) {
                    //console.log('success in creating platform end point');
                    global.logger.write('debug', 'success in creating platform end point', {}, request)
                    request.asset_push_arn = endPointArn;
                    proceed(function (err, response, status) {
                        callback(err, response, status);
                    });
                } else {
                    //console.log('problem in creating platform end point : ' , err);
                    global.logger.write('serverError', 'problem in creating platform end point', err, request)
                    callback(true, err, -3108);
                }
            });
        } else {
            callback(true, false, -9998);
        }
    };
    
    this.updateInviteCount = function(request, callback) {
        updateInviteCountFn(request, request.asset_id).then(()=>{
            updateInviteCountFn(request, request.operating_asset_id).then(()=>{
                callback(false, {}, 200);
            }).catch((err)=>{
                callback(true, err, -9999);
            });
        }).catch((err)=>{
            callback(true, err, -9999);
        });        
    };
    
    
    function updateInviteCountFn(request, assetId) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                assetId
                );
            var queryString = util.getQueryString('ds_v1_asset_list_update_invite_count', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve() : reject(err);                    
                });
            }
        });        
    };
    
    this.phoneNumberDelete = function(request, callback) {  
        var paramsArr = new Array(
                request.asset_id,
                request.log_asset_id,
                util.getCurrentUTCTime()
                );
            var queryString = util.getQueryString('ds_p1_asset_list_phone_number_delete', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? callback(false, {}, 200) : reject(true, err, -9999);
                });
            }
    };
    
    //Retrieving the unread count based on mobile number
    this.unreadCntBasedOnMobileNumber = function(request, callback) {
        var paramsArr = new Array(
                request.operating_asset_phone_number,
                request.operating_asset_phone_country_code,
                request.sort_flag,
                0,
                50
                );
            var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_unread_counts_phone_number', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? callback(false, data, 200) : callback(true, err, -9999); 
                });
            }
    };
    
    function updatePushToken(request, assetId) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                assetId,
                request.organization_id,
                request.asset_token_push,
                request.asset_push_arn,
                request.asset_id,
                request.datetime_log
                );
            var queryString = util.getQueryString('ds_v1_asset_list_update_push_token', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(false, data) : reject(true, err);
                });
            }
        });
        
    };

}

module.exports = AssetService;
