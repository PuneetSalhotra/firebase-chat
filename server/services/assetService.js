/*
 * author: Sri Sai Venkatesh
 */

var uuid = require('uuid');
var AwsSns = require('../utils/snsWrapper');

function AssetService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var cacheWrapper = objectCollection.cacheWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var sns = new AwsSns();
    this.getPhoneNumberAssets = function (request, callback) {

        var phoneNumber = util.cleanPhoneNumber(request.asset_phone_number);
        var countryCode = util.cleanPhoneNumber(request.asset_phone_country_code);
        var emailId = request.asset_email_id;
        var verificationMethod = Number(request.verification_method);
        var organizationId = request.organization_id;


        //verification_method (0 - NA, 1 - SMS; 2 - Call; 3 - Email)
        if (verificationMethod === 1 || verificationMethod === 2 || verificationMethod === 3) {
            var paramsArr = new Array(
                    organizationId,
                    phoneNumber,
                    countryCode
                    );

            var queryString = util.getQueryString('ds_v1_asset_list_select_phone_number', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, selectData) {
                    if (err === false) {
                        var verificationCode = util.getVerificationCode();
                        var pwdValidDatetime = util.addDays(util.getCurrentUTCTime(), 1);
                        if (selectData.length > 0) {
                            if (verificationMethod !== 0) {

                                formatPhoneNumberAssets(selectData, function (error, data) {
                                    if (error === false)
                                        callback(false, {data: data}, 200);
                                });

                                paramsArr = new Array(
                                        selectData[0]['asset_id'],
                                        selectData[0]['organization_id'],
                                        verificationCode,
                                        pwdValidDatetime
                                        );
                                var updateQueryString = util.getQueryString('ds_v1_asset_list_update_passcode', paramsArr);
                                db.executeQuery(0, updateQueryString, request, function (err, data) {
                                    assetListHistoryInsert(request, selectData[0]['asset_id'], selectData[0]['organization_id'], 208, util.getCurrentUTCTime(), function (err, data) {

                                    });
                                });

                                sendCallOrSms(verificationMethod, countryCode, phoneNumber, verificationCode, request);
                            }
                        } else {
                            callback(false, {}, -3202);
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
                    formatAssetData(data[0], function (error, data) {
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
                'organization_id': util.replaceDefaultNumber(rowData['organization_id'])
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

    var formatAssetData = function (row, callback) {

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
            'asset_status_name': util.replaceDefaultString(row['asset_status_name'])

        };

        callback(false, rowData);
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
                'asset_status_id': util.replaceDefaultNumber(row['asset_status_id']),
                'asset_status_name': util.replaceDefaultString(row['asset_status_name']),
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
                    paramsArr = new Array(
                            request.organization_id,
                            request.asset_phone_number,
                            request.asset_phone_country_code
                            );
                    negResponseCode = -3202;
                    queryString = util.getQueryString('ds_v1_asset_list_select_phone_number', paramsArr);
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


    var sendCallOrSms = function (verificationMethod, countryCode, phoneNumber, verificationCode, request) {

        var smsString = util.getSMSString(verificationCode);
        switch (verificationMethod) {
            case 0:
                //global.logger.write('client chose only to retrive data', request, 'device', 'trace'); // no third party api's in this case
                break;
            case 1:
                // send sms                
                //global.logger.write("sms string is " + smsString, request, 'trace'); // no third party api's in this case
                if (countryCode === 91) {
                    // send local sms
                    switch (global.config.sms_mode) {
                        case 1: // mvaayoo                        
                            util.sendSmsMvaayoo(smsString, countryCode, phoneNumber, function (error, data) {
                                if (error)
                                    //console.log(error);
                                    //console.log(data);
                                    global.logger.write('trace', 'Data: ' + data + 'Error - ' + error, request)
                            });
                            break;
                        case 2: // bulk sms                            
                            util.sendSmsBulk(smsString, countryCode, phoneNumber, function (error, data) {
                                if (error)
                                    //console.log(error);
                                    //console.log(data);
                                    global.logger.write('trace', 'Data: ' + data + 'Error - ' + error, request)
                            });
                            break;
                        case 3:// sinfini                                                        
                            util.sendSmsSinfini(smsString, countryCode, phoneNumber, function (error, data) {
                                if (error)
                                    //console.log(error);
                                    //console.log(data);
                                    global.logger.write('trace', 'Data: ' + data + 'Error - ' + error, request)
                            });
                            break;
                    }
                } else {
                    // send international sms                    
                    //global.logger.write('came inside else case', request, 'device', 'trace');
                }
                break;
            case 2: //send call 
                util.makeCall(smsString, countryCode, phoneNumber, function (error, data) {
                    if (error)
                        //console.log(error);
                        //console.log(data);
                        global.logger.write('trace', 'Data: ' + data + 'Error - ' + error, request)
                })
                break;
            case 3: //email
                break;

        }
    };

    this.linkAsset = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        var encToken = uuid.v1();

        var proceedLinking = function (callback) {
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
                                            callback(false, responseArr, 200);
                                            //global.logger.write("auth token is set in redis for operating asset id", request, 'asset', 'trace');
                                        } else {
                                            callback(false, responseArr, -7998);
                                        }
                                    });
                                } else {
                                    callback(false, responseArr, -7998);
                                }
                            });
                        });

                    });
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

                                        } else {
                                            callback(false, responseArr, -7998);
                                        }
                                    });
                                } else {
                                    callback(false, responseArr, -7998);
                                }
                            });
                            return;
                        } else {
                            //callback(err, false, -9998);
                            callback(err, false, -3201);
                        }
                    });

                } else {
                    // some thing is wrong and have to be dealt                    
                    callback(err, false, -9998);
                    return;
                }

            });
        }
        if (request.hasOwnProperty('asset_token_push') && request.asset_token_push !== '' && request.asset_token_push !== null) {
            sns.createPlatformEndPoint(Number(request.device_os_id), request.asset_token_push, function (err, endPointArn) {
                if (!err) {
                    //console.log('success in creating platform end point');
                    global.logger.write('debug', 'success in creating platform end point', request)
                    request.asset_push_arn = endPointArn;
                    proceedLinking(function (err, response, status) {
                        callback(err, response, status);
                    });
                } else {
                    //console.log('problem in creating platform end point');
                    global.logger.write('serverError', 'problem in creating platform end point - ' + err, request)
                    callback(err, {}, -3108);
                }
            });
        } else {
            request.asset_push_arn = '';
            proceedLinking(function (err, response, status) {
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


    var assetListInsertAddAsset = function (request, callback) {

        var activityInlineData = JSON.parse(request.activity_inline_data);
        var paramsArr = new Array(
                activityInlineData.contact_first_name,
                activityInlineData.contact_last_name,
                "",
                0,
                activityInlineData.contact_profile_picture,
                request.activity_inline_data,
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
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_asset_list_update_status_all', paramsArr);
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

    this.alterAssetAssignedStatus = function (request, callback) {
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

    };




}
;

module.exports = AssetService;

