/*
 * author: Sri Sai Venkatesh
 */

let uuid = require('uuid');
let AwsSns = require('../utils/snsWrapper');
let AwsSss = require('../utils/s3Wrapper');
let fs = require('fs');
const moment = require('moment');
const xlsx = require('xlsx');
const CryptoJS = require("crypto-js");

const OpenTok = require('opentok');
let opentok = new OpenTok(global.config.opentok_apiKey, global.config.opentok_apiSecret);

const RMBotService = require('../botEngine/services/rmbotService');
const awesomePhoneNumber = require( 'awesome-phonenumber' );

const AWS_Cognito = require('aws-sdk');
AWS_Cognito.config.update({
    "accessKeyId": global.config.access_key_id,
    "secretAccessKey": global.config.secret_access_key,
    "region": global.config.cognito_region
});
const cognitoidentityserviceprovider = new AWS_Cognito.CognitoIdentityServiceProvider();


function AssetService(objectCollection) {

    let db = objectCollection.db;
    let util = objectCollection.util;
    let cacheWrapper = objectCollection.cacheWrapper;
    let activityCommonService = objectCollection.activityCommonService;
    let queueWrapper = objectCollection.queueWrapper;
    let sns = new AwsSns();
    let sss = new AwsSss();
    const rmbotService = new RMBotService(objectCollection);
    // SMS
    const smsEngine = require('../utils/smsEngine');
    //PAM
    let forEachAsync = objectCollection.forEachAsync;

    let self = this;

    this.getPhoneNumberAssets = function (request, callback) {

        let phoneNumber = util.cleanPhoneNumber(request.asset_phone_number);
        let countryCode = util.cleanPhoneNumber(request.asset_phone_country_code);
        let emailId = request.asset_email_id;
        let verificationMethod = Number(request.verification_method);
        let organizationId = request.organization_id;


        //verification_method (0 - NA, 1 - SMS; 2 - Call; 3 - Email)
        //if (verificationMethod === 1 || verificationMethod === 2 || verificationMethod === 3) {
        if (verificationMethod === 1) {
            let paramsArr = new Array(
                0, //organizationId,
                phoneNumber,
                countryCode
            );

            //var queryString = util.getQueryString('ds_v1_asset_list_select_phone_number', paramsArr);
            let queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, selectData) {
                    if (err === false) {
                        let verificationCode;
                        (phoneNumber === 7032975769) ? verificationCode = 637979 : verificationCode = util.getVerificationCode();

                        let pwdValidDatetime = util.addDays(util.getCurrentUTCTime(), 1);
                        if (selectData.length > 0) {
                            if (verificationMethod !== 0) {

                                /*formatPhoneNumberAssets(selectData, function (error, data) {
                                    if (error === false)
                                        callback(false, {data: data}, 200);
                                });*/
                                callback(false, {
                                    passcode: verificationCode
                                }, 200);
                                forEachAsync(selectData, function (next, rowData) {
                                    paramsArr = new Array(
                                        rowData.asset_id,
                                        rowData.organization_id,
                                        verificationCode,
                                        pwdValidDatetime
                                    );
                                    let updateQueryString = util.getQueryString('ds_v1_asset_list_update_passcode', paramsArr);
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
                            callback(false, {
                                passcode: verificationCode
                            }, 200);
                        }
                    } else {
                        // some thing is wrong and have to be dealt                        
                        callback(err, false, -9999);
                    }
                });
            }
        } else if (verificationMethod === 2) {
            sendCallOrSms(verificationMethod, countryCode, phoneNumber, 1234, request);
            callback(false, {}, 200);
        } else {
            callback(false, {}, -3101);
        }
    };

    this.getPhoneNumberAssetsV1 = async function (request, callback) {

        console.log("request:: asset/passcode/alter/v2 :: "+JSON.stringify(request));

        let phoneNumber = request.asset_phone_number;
        let email = request.email;
        let countryCode = undefined;
        let emailId = request.asset_email_id;
        let verificationMethod = Number(request.verification_method);
        let organizationId = request.organization_id;
        //let appID = Number(request.app_id) || 0;

        // email wrapper

        if(email && email.indexOf('@') > -1) {
            let [error, response] = await this.getAssetPhoneNumberDetals(request, email);

            if(response.length > 1) {
                return callback(true, {
                    message: `Multiple resources are linked with your email`
                }, 400);
            }
            if(response.length) {
                phoneNumber = "+" + response[0].operating_asset_phone_country_code + response[0].operating_asset_phone_number;
            }

            request.asset_phone_number = phoneNumber;
            console.log("Got Email in the request--", email, phoneNumber, response);
            
            if(Number(response[0].asset_flag_email_login)) {
                let decryptedPassword = CryptoJS.AES.decrypt((response[0].asset_email_login_password || '').toString() || "", 'lp-n5^+8M@62').toString(CryptoJS.enc.Utf8);

                callback(false, {
                    verification_code : decryptedPassword
                }, 200);
            }
        }

        console.log("Phone Number", phoneNumber);

        let phoneNumverValidationFlag = await cacheWrapper.getKeyValueFromCache('phone_number_validation');
        if('1' === phoneNumverValidationFlag) {
            console.log("validate using module awesome-phoneNumber");
            let pn = null;
            try{
                if(phoneNumber.length > 5)
                pn = new awesomePhoneNumber(phoneNumber);
            }catch(e){
                pn = null;
               // phoneNumber = NaN;
               // countryCode = NaN;
               // request.asset_phone_country_code = NaN;
                console.log("Exception in Phone Number Validation "+phoneNumber);
            }
            if(pn !== undefined && pn !== null) {
                const isValidNumber = pn.isValid();
                console.log("isValid PhoneNumber = " + isValidNumber);
                if(isValidNumber) {
                    phoneNumber = pn.getNumber('significant');
                    countryCode = pn.getCountryCode();
                    request.asset_phone_country_code = countryCode;
                } else {
                    phoneNumber = undefined;
                    countryCode = undefined;
                }
            }else{
                console.log("Incorrect Phone Number");
            }

        } else {

            console.log("validate using core logic");
            phoneNumber = util.cleanPhoneNumber(request.asset_phone_number);
            countryCode = util.cleanPhoneNumber(request.asset_phone_country_code);
            
            if (
                request.url.includes('v2') &&
                (
                    String(request.asset_phone_number).includes('+91') ||
                    String(request.asset_phone_number).includes('+61') ||
                    String(request.asset_phone_number).includes('+44') ||
                    String(request.asset_phone_number).includes('+49') ||
                    String(request.asset_phone_number).includes('+33') 
                )
            ) {
                countryCode = Number(String(request.asset_phone_number).slice(0, 3));
                request.asset_phone_country_code = countryCode;

                phoneNumber = Number(String(request.asset_phone_number).slice(3));
                request.asset_phone_number = request.asset_phone_number;
            } else if (
                request.url.includes('v2') &&
                (
                    String(request.asset_phone_number).includes('+1')
                )
            ) {
                countryCode = Number(String(request.asset_phone_number).slice(0, 2));
                request.asset_phone_country_code = countryCode;

                phoneNumber = Number(String(request.asset_phone_number).slice(2));
                request.asset_phone_number = request.asset_phone_number;
            }  else if (
                request.url.includes('v2') &&
                (
                    String(request.asset_phone_number).includes('+880') ||
                    String(request.asset_phone_number).includes('+961')
                )
            ) {
                countryCode = Number(String(request.asset_phone_number).slice(0, 4));
                request.asset_phone_country_code = countryCode;

                phoneNumber = Number(String(request.asset_phone_number).slice(4));
                request.asset_phone_number = request.asset_phone_number;
            }
        }

        console.log("countryCode: ", countryCode);
        console.log("phoneNumber: ", phoneNumber);
        
        try {
            let responseCode = 200;
            phoneNumber = isNaN(Number(phoneNumber)) ? "0" : phoneNumber;
            countryCode = isNaN(Number(countryCode)) ? 0 : countryCode;
            const [error, rateLimit] = await checkIfOTPRateLimitExceeded(phoneNumber, countryCode, request);
            if (rateLimit.length > 0 && rateLimit[0].passcode_count >= 10) {
                // if (request.url.includes('v2')) { responseCode = 429; }
                callback(false, {
                    message: `OTP rate limit exceeded!`
                }, responseCode);
                
                const smsMessage = `Sorry, you have exceeded the number of times you can generate a fresh OTP. Please try again after one hour.`;
                // util.sendSmsSinfiniV1(smsMessage, countryCode || 91, phoneNumber || 0, 'MYTONY', function (err, response) {
                //     console.log('[getPhoneNumberAssetsV1] Sinfini Response: ', response);
                //     console.log('[getPhoneNumberAssetsV1] Sinfini Error: ', err);
                // });

                if (!email) {
                    let redisValdomesticSmsMode = await cacheWrapper.getSmsMode('domestic_sms_mode');
                    let domesticSmsMode = Number(redisValdomesticSmsMode);

                    switch (domesticSmsMode) {
                        case 1: // SinFini
                            smsEngine.emit('send-sinfini-sms', {
                                type: 'NOTFCTN',
                                countryCode,
                                phoneNumber,
                                msgString: smsMessage,
                                failOver: true,
                                appName: ''
                            });
                            break;
                        case 2: // textlocal
                            smsEngine.emit('send-textlocal-sms', {
                                type: 'NOTFCTN',
                                countryCode,
                                phoneNumber,
                                msgString: smsMessage,
                                failOver: true,
                                appName: ''
                            });
                            break;
                        default:
                            smsEngine.emit('send-sinfini-sms', {
                                type: 'NOTFCTN',
                                countryCode,
                                phoneNumber,
                                msgString: smsMessage,
                                failOver: true,
                                appName: ''
                            });
                            break;
                    }


                }

                return;
            }
        } catch (error) {
            let responseCode = 200;
            console.log("checkIfOTPRateLimitExceeded | Error: ", error);
            // if (request.url.includes('v2')) { responseCode = 429; }
            callback(true, {
                message: `OTP rate limit check failed!`
            }, responseCode);
            return;
        }

        //verification_method (0 - NA, 1 - SMS; 2 - Call; 3 - Email)
        if (verificationMethod === 1 || verificationMethod === 2 || verificationMethod == 3) {
            let paramsArr = new Array(
                0, //organizationId,
                phoneNumber,
                countryCode
            );

            let queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, async function (err, selectData) {
                    if (err === false) {
                        let verificationCode;
                        (phoneNumber === 7032975769) ? verificationCode = 637979 : verificationCode = util.getVerificationCode();

                        let response = {};
                        if (request.url.includes('v2')) {
                            response.verification_code = verificationCode;
                        }

                        let pwdValidDatetime = util.addDays(util.getCurrentUTCTime(), 1);
                        if (selectData.length > 0) {
                            if (verificationMethod !== 0 && verificationMethod === 1) {

                                callback(false, response, 200);
                                forEachAsync(selectData, function (next, rowData) {
                                    paramsArr = new Array(
                                        rowData.asset_id,
                                        rowData.organization_id,
                                        verificationCode,
                                        pwdValidDatetime
                                    );
                                    let updateQueryString = util.getQueryString('ds_v1_asset_list_update_passcode', paramsArr);
                                    db.executeQuery(0, updateQueryString, request, function (err, data) {
                                        assetListHistoryInsert(request, rowData.asset_id, rowData.organization_id, 208, util.getCurrentUTCTime(), function (err, data) {

                                        });
                                        next();
                                    });

                                });
                                try {
                                    await newUserPassCodeSet(phoneNumber, verificationCode, request)
                                } catch (error) {
                                    console.log("getPhoneNumberAssetsV1 | Asset found | newUserPassCodeSet: ", error);
                                }
                                sendCallOrSms(verificationMethod, countryCode, phoneNumber, verificationCode, request);
                            } else if (verificationMethod === 2) {
                                request.passcode = selectData[0].asset_phone_passcode;
                                sendCallOrSms(verificationMethod, countryCode, phoneNumber, 1234, request);
                                callback(false, { response }, 200);
                                return;
                            } else if (verificationMethod === 3) {
                                request.passcode = selectData[0].asset_phone_passcode;
                                forEachAsync(selectData, function (next, rowData) {
                                    paramsArr = new Array(
                                        rowData.asset_id,
                                        rowData.organization_id,
                                        verificationCode,
                                        pwdValidDatetime
                                    );
                                    let updateQueryString = util.getQueryString('ds_v1_asset_list_update_passcode', paramsArr);
                                    db.executeQuery(0, updateQueryString, request, function (err, data) {
                                        assetListHistoryInsert(request, rowData.asset_id, rowData.organization_id, 208, util.getCurrentUTCTime(), function (err, data) {

                                        });
                                        next();
                                    });

                                });
                                try {
                                    await newUserPassCodeSet(phoneNumber, verificationCode, request)
                                } catch (error) {
                                    console.log("getPhoneNumberAssetsV1 | Asset found | newUserPassCodeSet: ", error);
                                }

                                sendCallOrSms(verificationMethod, countryCode, phoneNumber, verificationCode, request);
                                callback(false, response , 200);
                                return;
                            }
                        } else {
                            if (verificationMethod === 1) {
                                newUserPassCodeSet(phoneNumber, verificationCode, request)
                                    .then(function () {
                                        // Passcode set in the DB
                                        sendCallOrSms(verificationMethod, countryCode, phoneNumber, verificationCode, request);
                                        callback(false, { response }, 200);
                                    }, function (err) {
                                        // There was an error setting the passcode in the DB
                                        callback(true, err, -9998);

                                    })
                            } else if (verificationMethod === 2) {
                                getPasscodeForNewPhonenumber(phoneNumber, request)
                                    .then(function (data) {
                                        request.passcode = data[0].phone_passcode;
                                        sendCallOrSms(verificationMethod, countryCode, phoneNumber, 1234, request);
                                        callback(false, { response }, 200);
                                    }, function (err) {
                                        // Operation error
                                        callback(false, {}, -9998);
                                    })
                            } else if (verificationMethod === 3) {
                                newUserPassCodeSet(phoneNumber, verificationCode, request)
                                    .then(function (data) {
                                        request.passcode = data[0].phone_passcode;
                                        // Passcode set in the DB
                                        sendCallOrSms(verificationMethod, countryCode, phoneNumber, verificationCode, request);
                                        callback(false, { response }, 200);
                                    }, function (err) {
                                        // There was an error setting the passcode in the DB
                                        callback(true, err, -9998);

                                    });
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

    this.getAssetPhoneNumberDetals = async function(request, email) {
        let responseData = [];
        let paramsArr = new Array(
            email
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_operating_asset_email', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
            }

        return [error, responseData];
    
    }

    async function checkIfOTPRateLimitExceeded(phoneNumber, countryCode, request) {
        // IN p_phone_number VARCHAR(50), IN p_phone_country_code SMALLINT(6), 
        // IN p_start_datetime DATETIME, IN p_end_datetime DATETIME
        let responseData = [],
            error = true,
            currentUTCDateTime = moment().utc();
        let paramsArr = new Array(
            phoneNumber,
            countryCode,
            moment().utc().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
            moment().utc().format('YYYY-MM-DD HH:mm:ss')
        );
        const queryString = util.getQueryString('ds_p1_phone_passcode_transaction_select_passcode_count', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

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

            console.log(JSON.stringify(request, null, 2));
            let paramsArr = new Array(
                phoneNumber,
                util.cleanPhoneNumber(request.asset_phone_country_code),  
                verificationCode,
                util.getCurrentUTCTime(),
                moment().utc().add(24, 'hours').format('YYYY-MM-DD HH:mm:ss'), // util.getCurrentUTCTime(),
                util.getCurrentUTCTime()
            );
            let queryString = util.getQueryString('ds_p1_phone_passcode_transaction_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (!err) ? resolve() : reject(err);
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
        let paramsArr = new Array(
            request.organization_id,
            request.account_id || 0,
            request.workforce_id || 0,
            request.asset_id
        );
        let queryString = util.getQueryString('ds_v1_1_asset_list_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    // console.log(data);
                    formatAssetData(data, function (error, data) {
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

    this.getAssetWorkStatuses = function (request, callback) {
        let productId = (request.hasOwnProperty('product_id')) ? request.product_id : 1;
        let paramsArr = new Array(
            request.page_start,
            util.replaceQueryLimit(request.page_limit),
            productId
        );

        //PAM
        let queryString = util.getQueryString('ds_v1_1_asset_type_category_status_master_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    formatAssetWorkStatuses(data, function (error, data) {
                        if (error === false)
                            callback(false, {
                                data: data
                            }, 200);
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
        let paramsArr = new Array();
        let queryString = '';
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
                            callback(false, {
                                data: finalData
                            }, 200);
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


    let formatPhoneNumberAssets = function (rows, callback) {
        //var responseData = new Array();
        let data = new Array();

        rows.forEach(function (rowData, index) {

            let rowDataArr = {
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
                'asset_storage_url': util.replaceDefaultString(rowData['asset_storage_url']),
                'asset_default_module_id': util.replaceDefaultNumber(rowData['asset_default_module_id']),
                'asset_default_module_name': util.replaceDefaultString(rowData['asset_default_module_name']),
                'asset_flag_module_locked': util.replaceDefaultNumber(rowData['asset_flag_module_locked']),
            };
            data.push(rowDataArr);

        }, this);

        callback(false, data);
    };

    let formatAssetWorkStatuses = function (rows, callback) {
        let data = new Array();
        rows.forEach(function (rowData, index) {

            let rowDataArr = {
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
    let formatMeetingRoomAssetData = function (data, callback) {
        let responseArr = new Array();
        forEachAsync(data, function (next, row) {
            let rowData = {
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
                'asset_assigned_status_datetime': util.replaceDefaultDatetime(row['asset_assigned_status_datetime']),
                'asset_datetime_available_till': util.replaceDefaultDatetime(rowArray[0]['asset_datetime_available_till']),
            };
            responseArr.push(rowData);
            next();
        }).then(function () {
            callback(false, responseArr);
        });
    };

    let formatAssetData = function (rowArray, callback) {
        
        let is_password_set = 'No';
        for(const i of rowArray) {
            if(!!i.asset_email_password){
                //if((i.asset_email_password).length > 0) {
                    //Password is Set
                    is_password_set = 'Yes';
                    break;
               // }
            }
        }

        let rowData = {
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
            'asset_last_location_datetime': util.replaceDefaultDatetime(rowArray[0]['asset_last_seen_datetime']),
            'asset_work_location_address': util.replaceDefaultString(rowArray[0]['asset_work_location_address']),
            'asset_work_location_latitude': util.replaceDefaultString(rowArray[0]['asset_work_location_latitude']),
            'asset_work_location_longitude': util.replaceDefaultString(rowArray[0]['asset_work_location_longitude']),
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
            'asset_count_task_created': util.replaceDefaultNumber(rowArray[0]['asset_count_task_created']),
            'operating_asset_image_path': util.replaceDefaultString(rowArray[0]['operating_asset_image_path']),
            'workforce_type_id': util.replaceDefaultNumber(rowArray[0]['workforce_type_id']),

            'asset_flag_admin': util.replaceDefaultNumber(rowArray[0]['asset_flag_admin']), // Legacy
            'asset_flag_account_admin': util.replaceDefaultNumber(rowArray[0]['asset_flag_admin']),
            'asset_flag_organization_admin': util.replaceDefaultNumber(rowArray[0]['asset_flag_organization_admin']),
            'asset_inline_data': util.replaceDefaultString(rowArray[0]['asset_inline_data']),
            'asset_datetime_available_till': util.replaceDefaultDatetime(rowArray[0]['asset_datetime_available_till']),
            'organization_enterprise_features_enabled':util.replaceDefaultNumber(rowArray[0]['organization_enterprise_features_enabled']),
            'asset_type_id': util.replaceDefaultNumber(rowArray[0]['asset_type_id']),
            'operating_asset_type_id': util.replaceDefaultNumber(rowArray[0]['operating_asset_type_id']),
            'organization_image_path': util.replaceDefaultString(rowArray[0]['organization_image_path']),
            'asset_flag_process_management': util.replaceDefaultNumber(rowArray[0]['asset_flag_process_management']),
            'workforce_flag_enable_web_access': util.replaceDefaultNumber(rowArray[0]['workforce_flag_enable_web_access']),
            'cluster_tag_id': util.replaceDefaultNumber(rowArray[0]['cluster_tag_id']),
            'asset_flag_super_admin': util.replaceDefaultNumber(rowArray[0]['asset_flag_super_admin']),
            'cluster_tag_name': util.replaceDefaultString(rowArray[0]['cluster_tag_name']) ,
            'organization_inline_data': util.replaceDefaultString(rowArray[0]['organization_inline_data']),
            'is_password_set':is_password_set,
            'asset_encryption_token_id': util.replaceDefaultString(rowArray[0]['asset_encryption_token_id']),
            'organization_flag_email_integration_enabled': util.replaceDefaultNumber(rowArray[0]['organization_flag_email_integration_enabled']),
            'asset_flag_approval':util.replaceDefaultNumber(rowArray[0]['asset_flag_approval']),
            'asset_last_attendance_swipe_type_id':util.replaceDefaultNumber(rowArray[0]['asset_last_attendance_swipe_type_id']),
            'asset_last_attendance_swipe_type_name':util.replaceDefaultString(rowArray[0]['asset_last_attendance_swipe_type_name']),
            'asset_last_attendance_swipe_type_datetime':util.replaceDefaultDatetime(rowArray[0]['asset_last_attendance_swipe_type_datetime']),
            'organization_flag_enable_manager_proxy':util.replaceDefaultNumber(rowArray[0]['organization_flag_enable_manager_proxy']),
            "asset_manual_work_location_address":util.replaceDefaultString(rowArray[0]['asset_manual_work_location_address']),
            "asset_flag_suspended":util.replaceDefaultNumber(rowArray[0]['asset_flag_suspended']),
            "asset_master_data":util.replaceDefaultString(rowArray[0]['asset_master_data']),
            "asset_suspension_datetime":util.replaceDefaultString(rowArray[0]['asset_suspension_datetime']),
            "asset_suspension_activity_id":util.replaceDefaultString(rowArray[0]['asset_suspension_activity_id']),
            "asset_type_attendance_type_id":util.replaceDefaultNumber(rowArray[0]['asset_type_attendance_type_id']),
            "asset_type_attendance_type_name":util.replaceDefaultString(rowArray[0]['asset_type_attendance_type_name']),
            "asset_approval_activity_id":util.replaceDefaultString(rowArray[0]['asset_approval_activity_id']),
            "manager_asset_id":util.replaceDefaultString(rowArray[0]['manager_asset_id']),
            "asset_type_flag_enable_suspension":util.replaceDefaultNumber(rowArray[0]['asset_type_flag_enable_suspension']),
            "operating_asset_username":util.replaceDefaultString(rowArray[0]['operating_asset_username']),
            "asset_email_password":util.replaceDefaultString(rowArray[0]['asset_email_password']),

            //Returning the following data - Document Repository System
            "asset_doc_repo_access_type_id":util.replaceDefaultNumber(rowArray[0]['asset_doc_repo_access_type_id']),
            "asset_doc_repo_access_type_name":util.replaceDefaultString(rowArray[0]['asset_doc_repo_access_type_name']),
            "organization_flag_document_repository_enabled":util.replaceDefaultString(rowArray[0]['organization_flag_document_repository_enabled']),
            "organization_document_repository_bucked_url":util.replaceDefaultString(rowArray[0]['organization_document_repository_bucked_url']),
            "asset_flag_document_repo_super_admin":util.replaceDefaultNumber(rowArray[0]['asset_flag_document_repo_super_admin']),
            "asset_type_flag_hide_organization_details":util.replaceDefaultNumber(rowArray[0]['asset_type_flag_hide_organization_details']),
            
            //email integrations
            "email_integration_enable":util.replaceDefaultNumber(rowArray[0]['email_integration_enable']),
            "asset_linked_enabled" :util.replaceDefaultNumber(rowArray[0]['asset_linked_enabled ']),
            "asset_linked_status_datetime":util.replaceDefaultDatetime(rowArray[0]['asset_linked_status_datetime ']),
            "asset_flag_organization_management":util.replaceDefaultNumber(rowArray[0]['asset_flag_organization_management']),
            "asset_admin_access_data" :util.replaceDefaultString(rowArray[0]['asset_admin_access_data']),
            "organization_flag_enable_form_tag" :util.replaceDefaultNumber(rowArray[0]['organization_flag_enable_form_tag']),
            "asset_flag_arp_settings_enabled":util.replaceDefaultNumber(rowArray[0]['asset_flag_arp_settings_enabled']),
            "asset_arp_data":util.replaceDefaultString(rowArray[0]['asset_arp_data']),
            "workforce_flag_arp_settings_enabled":util.replaceDefaultNumber(rowArray[0]['workforce_flag_arp_settings_enabled']),
            "workforce_arp_data":util.replaceDefaultString(rowArray[0]['workforce_arp_data']),
            "account_arp_data":util.replaceDefaultString(rowArray[0]['account_arp_data']),

            //tags
            "asset_tag_id_1" : util.replaceDefaultNumber(rowArray[0]['asset_tag_id_1']),
            "asset_tag_name_1" : util.replaceDefaultString(rowArray[0]['asset_tag_name_1']),
            "asset_tag_type_id_1" : util.replaceDefaultNumber(rowArray[0]['asset_tag_type_id_1']),
            "asset_tag_type_name_1" : util.replaceDefaultString(rowArray[0]['asset_tag_type_name_1']),
            "asset_tag_id_2" : util.replaceDefaultNumber(rowArray[0]['asset_tag_id_2']),
            "asset_tag_name_2" : util.replaceDefaultString(rowArray[0]['asset_tag_name_2']),
            "asset_tag_type_id_2" : util.replaceDefaultNumber(rowArray[0]['asset_tag_type_id_2']),
            "asset_tag_type_name_2" : util.replaceDefaultString(rowArray[0]['asset_tag_type_name_2']),
            "asset_tag_id_3" : util.replaceDefaultNumber(rowArray[0]['asset_tag_id_3']),
            "asset_tag_name_3" : util.replaceDefaultString(rowArray[0]['asset_tag_name_3']),
            "asset_tag_type_id_3" : util.replaceDefaultNumber(rowArray[0]['asset_tag_type_id_3']),
            "asset_tag_type_name_3" : util.replaceDefaultString(rowArray[0]['asset_tag_type_name_3']),

            //TASI 
            "organization_flag_enable_sip_module" : util.replaceDefaultNumber(rowArray[0]['organization_flag_enable_sip_module']),
            "asset_flag_sip_admin_access" : util.replaceDefaultNumber(rowArray[0]['asset_flag_sip_admin_access']),
            "asset_flag_frontline" : util.replaceDefaultNumber(rowArray[0]['asset_flag_frontline']),
            "organization_flag_elasticsearch_enabled": util.replaceDefaultNumber(rowArray[0]['organization_flag_elasticsearch_enabled']),
            "asset_flag_export" : util.replaceDefaultNumber(rowArray[0]['asset_flag_export']),
            "organization_flag_calendar_enabled" : util.replaceDefaultNumber(rowArray[0]['organization_flag_calendar_enabled']),
            "asset_flag_simulation" : util.replaceDefaultNumber(rowArray[0]['asset_flag_simulation']),
            "organization_flag_enable_timetracker" : util.replaceDefaultNumber(rowArray[0]['organization_flag_enable_timetracker']),
            "organization_flag_timeline_access_mgmt" : util.replaceDefaultNumber(rowArray[0]['organization_flag_timeline_access_mgmt']),
            "organization_flag_lead_mgmt" : util.replaceDefaultNumber(rowArray[0]['organization_flag_lead_mgmt']),
            "asset_password_expiry_datetime": util.replaceDefaultDatetime(rowArray[0]['asset_password_expiry_datetime']),

            "organization_flag_dashboard_onhold": util.replaceDefaultNumber(rowArray[0]['organization_flag_dashboard_onhold']),
            "organization_flag_enable_tag": util.replaceDefaultNumber(rowArray[0]['organization_flag_enable_tag']), 
            "asset_type_flag_enable_dashboard": util.replaceDefaultNumber(rowArray[0]['asset_type_flag_enable_dashboard']),
            "workforce_tag_id": util.replaceDefaultNumber(rowArray[0]['workforce_tag_id']),
            "workforce_tag_name": util.replaceDefaultString(rowArray[0]['workforce_tag_name']),
            "asset_type_flag_enable_gamification": util.replaceDefaultNumber(rowArray[0]['asset_type_flag_enable_gamification']),
            "organization_ai_bot_enabled": util.replaceDefaultNumber(rowArray[0]['organization_ai_bot_enabled']),
            "asset_type_flag_enable_gantt_chart": util.replaceDefaultNumber(rowArray[0]['asset_type_flag_enable_gantt_chart'])
       };

        callback(false, rowData);
    };

    this.updateAssetPassword = async function(request) {

        let [err,assetData]= await activityCommonService.getAssetDetailsAsync(request);
        if(assetData[0].asset_flag_email_login != 1){
            return [true,{message:"Enable email login flag for asset"}]
        }
        
        if(err || assetData.length==0){
            return [true,{message:"something went wrong"}]
        }
      try{
        let decryptedPassword = CryptoJS.AES.decrypt(assetData[0].asset_email_login_password.toString() || "", 'lp-n5^+8M@62').toString(CryptoJS.enc.Utf8);

          if (decryptedPassword == request.old_password) {
              let newPasswordEncrypt =  CryptoJS.AES.encrypt(request.new_password, 'lp-n5^+8M@62').toString();
            let paramsArr1 = new Array(
              request.asset_email,
              request.organization_id,
              newPasswordEncrypt,
              request.log_asset_id,
              util.getCurrentUTCTime()
            );
            let queryString1 = util.getQueryString("ds_p1_asset_list_update_login_password",paramsArr1);
            db.executeQuery(0,queryString1,request,function (err1, updatedData) {
                if (!err1) {
                return [false,[]]
                }
                else{
                    return [true,{message:"something went wrong"}]
                }
              }
            );
          } else {
            return [true,{message:"your old password does not match"}]
          }
        }catch(catcherr){
        return [true,{message:"something went wrong"}] 
        }
    }


    this.checkAssetPasscode = function (request, callback) {
        let phoneNumber = util.cleanPhoneNumber(request.asset_phone_number);
        let phoneCountryCode = util.cleanPhoneNumber(request.asset_phone_country_code);
        let verificationCode = util.cleanPhoneNumber(request.verification_passcode);
        let verificationType = Number(request.verification_method);

        if (verificationType === 1 || verificationType === 2 || verificationType === 3) {
            let paramsArr = new Array();
            let queryString = "";
            let negResponseCode = 0;
            switch (verificationType) {
                case 1:
                case 2:
                    paramsArr = new Array(
                        0,
                        phoneNumber,
                        phoneCountryCode
                    );
                    negResponseCode = -3201;
                    queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all', paramsArr);
                    break;

                case 3:
                    paramsArr = new Array(
                        request.organization_id,
                        request.asset_email_id
                    );
                    queryString = util.getQueryString('ds_v1_asset_list_select_operating_asset_email', paramsArr);
                    negResponseCode = -3203;
                    break;
            };


            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        // got data now parse it..                          
                        if (data.length > 0) {
                            //console.log("data[0].asset_phone_passcode: ", data[0].asset_phone_passcode);
                            //global.logger.write('debug', "data[0].asset_phone_passcode: " + data[0].asset_phone_passcode, {}, request);
                            util.logInfo(request,`checkAssetPasscode debug data[0].asset_phone_passcode:  %j`,{asset_phone_passcode : data[0].asset_phone_passcode,request});
                            let dbVerifyCode = 0;
                            verificationType === 3 ? dbVerifyCode = util.replaceDefaultNumber(data[0].asset_email_password) : dbVerifyCode = util.replaceDefaultNumber(data[0].asset_phone_passcode);
                            //asset_password_expiry_datetime --> for email 
                            //asset_passcode_expiry_datetime --> for asset                            
                            if (dbVerifyCode === verificationCode) {
                                //do time check here..
                                formatPhoneNumberAssets(data, function (error, fromatedData) {
                                    if (error === false)
                                        callback(false, {
                                            data: fromatedData
                                        }, 200);
                                });
                            } else {
                                callback(false, {}, -3107);
                            }
                        } else {
                            getPasscodeForNewPhonenumber(phoneNumber, request)
                                .then(function (data) {
                                    //console.log("data[0].phone_passcode: ", Number(data[0].phone_passcode));
                                    //console.log("verificationCode: ", Number(verificationCode));

                                    //global.logger.write('debug', "data[0].phone_passcode: " + Number(data[0].phone_passcode), {}, request);
                                    util.logInfo(request,`getPasscodeForNewPhonenumber debug data[0].phone_passcode:  %j`,{phone_passcode : Number(data[0].phone_passcode),request});
                                    //global.logger.write('debug', "verificationCode: " + Number(verificationCode), {}, request);
                                    util.logInfo(request,`getPasscodeForNewPhonenumber debug verificationCode: %j`,{verificationCode : Number(verificationCode),request});

                                    if (Number(data[0].phone_passcode) === Number(verificationCode)) {
                                        // Set verification status  to true
                                        setPasscodeVerificationStatusForNewPhonenumber(data[0].phone_passcode_transaction_id, true, request);
                                        console.log("******* PASSCODE VERIFIED *******");
                                        //global.logger.write('conLog', "******* PASSCODE VERIFIED *******", {}, request);
                                        util.logInfo(request,`getPasscodeForNewPhonenumber ******* PASSCODE VERIFIED ******* %j`,{request});
                                        callback(false, {
                                            data: []
                                        }, 200)
                                    } else {
                                        // Either the phone and country code combination doesn't exit
                                        // or, the user entered passcode doesn't match. 
                                        callback(false, {}, -3202);
                                    }
                                }, function (err) {
                                    // Operation error
                                    callback(false, {}, -9998);
                                })
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
            //console.log("Inside getPasscodeForNewPhonenumber");
            // IN p_phone_number VARCHAR(50), IN phone_country_code SMALLINT(6)

            let paramsArr = new Array(
                phoneNumber,
                util.cleanPhoneNumber(request.asset_phone_country_code)
            );
            let queryString = util.getQueryString('ds_p1_phone_passcode_transaction_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log("ds_p1_phone_passcode_transaction_select data: ", data);
                    //global.logger.write('conLog', "ds_p1_phone_passcode_transaction_select data: " + JSON.stringify(data, null, 2), {}, request);
                    util.logInfo(request,`getPasscodeForNewPhonenumber ds_p1_phone_passcode_transaction_select data: %j`,{data : JSON.stringify(data, null, 2),request});
                    (!err) ? resolve(data) : reject(err);
                });
            }
        });
    }

    function setPasscodeVerificationStatusForNewPhonenumber(phonePasscodeTransactionID, isPasscodeVerified, request) {
        return new Promise(function (resolve, reject) {
            //console.log("Inside setPasscodeVerificationStatusForNewPhonenumber");
            // IN p_phone_passcode_transaction_id BIGINT(20), IN p_phone_passcode_is_verified TINYINT(4), 
            // IN p_phone_passcode_verification_datetime DATETIME

            let paramsArr = new Array(
                phonePasscodeTransactionID,
                isPasscodeVerified,
                util.getCurrentUTCTime()
            );

            let queryString = util.getQueryString('ds_p1_phone_passcode_transaction_update_verified', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    //console.log("ds_p1_phone_passcode_transaction_update_verified data: ", data);
                    //global.logger.write('conLog', "ds_p1_phone_passcode_transaction_update_verified data: " + JSON.stringify(data, null, 2), {}, request);
                    util.logInfo(request,`setPasscodeVerificationStatusForNewPhonenumber ds_p1_phone_passcode_transaction_update_verified data: %j`,{data : JSON.stringify(data, null, 2),request});
                    (!err) ? resolve(data) : reject(err);
                });
            }
        });
    }

    let sendCallOrSms = async (verificationMethod, countryCode, phoneNumber, verificationCode, request) =>{

        let smsString = util.getSMSString(verificationCode);
        let domesticSmsMode = global.config.domestic_sms_mode;
        let internationalSmsMode = global.config.international_sms_mode;
        let phoneCall = global.config.phone_call;
        let appID = Number(request.app_id) || 3;

        // SMS heart-beat logic
        if (`${countryCode}${phoneNumber}` === '919100112970') {
            verificationCode = util.getOTPHeartBeatCode();
        }

        //Get the appID
        let[err, appData] = await activityCommonService.getAppName(request, appID);
        if(err) {
            //appName = 'TONY';
            appName = 'greneOS app.';
        } else {
            appName = appData[0].app_name;
        }
        console.log('appName : ', appName);

        let smsOptions = {
            type: 'OTP', // Other types: 'NOTFCTN' | 'COLLBRTN' | 'INVTATN',
            countryCode,
            phoneNumber,
            verificationCode,
            failOver: true,
            appName
        };
        switch (verificationMethod) {
            case 0:
                //global.logger.write('client chose only to retrive data', request, 'device', 'trace'); // no third party api's in this case
                break;
            case 1:
                // send sms                
                //global.logger.write("sms string is " + smsString, request, 'trace'); // no third party api's in this case

                // There used to be a logic earlier to decide between the SMS vendors and 
                // and then send domestic/international text. You can check it out in the
                // GitHub PR (Pull Request) #19. 
                // Pick the initial/primary SMS provider from domesticSmsMode.txt
                if (countryCode === 91) {

                    let redisValdomesticSmsMode = await cacheWrapper.getSmsMode('domestic_sms_mode');
                    domesticSmsMode = Number(redisValdomesticSmsMode);
                    // fs.readFile(`${__dirname}/../utils/domesticSmsMode.txt`, function (err, data) {
                    //     (err) ? global.logger.write('debug', err, {}, request) : domesticSmsMode = Number(data.toString());

                        /*   case 1: // mvaayoo                        
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
                            case 3: // sinfini                                                        
                                console.log('In send SmsSinfini');
                                util.sendSmsSinfini(smsString, countryCode, phoneNumber, function (error, data) {
                                    if (error)
                                        console.log(error);
                                    console.log(data);
                                    global.logger.write('trace', data, error, request)
                                });
                                break;
                         */

                    switch (domesticSmsMode) {
                        case 1: // SinFini
                            smsEngine.emit('send-sinfini-sms', smsOptions);
                            break;
                        case 2: // mVayoo
                            smsEngine.emit('send-textlocal-sms', smsOptions);
                            break;
                        default: // SinFini
                            smsEngine.emit('send-sinfini-sms', smsOptions);
                            break;
                    }
                

                    /* smsEngine.sendDomesticSms(smsOptions); */

                } else {

                    let redisValinternationalSmsMode = await cacheWrapper.getSmsMode('international_sms_mode');
                    internationalSmsMode = Number(redisValinternationalSmsMode);

                    // fs.readFile(`${__dirname}/../utils/internationalSmsMode.txt`, function (err, data) {
                    //     (err) ? global.logger.write('debug', err, {}, request) : internationalSmsMode = Number(data.toString());

                        /* case 1:
                               util.sendInternationalTwilioSMS(smsString, countryCode, phoneNumber, function (error, data) {
                                   if (error)
                                       global.logger.write('trace', data, error, request)
                               });
                               break;

                           case 2:
                               util.sendInternationalNexmoSMS(smsString, countryCode, phoneNumber, function (error, data) {
                                   if (error)
                                       global.logger.write('trace', data, error, request)
                               });
                               break; */

                        switch (internationalSmsMode) {
                            case 1: // Twilio
                                smsEngine.emit('send-twilio-sms', smsOptions);
                                break;
                            case 2: // Nexmo
                                smsEngine.emit('send-nexmo-sms', smsOptions);
                                break;
                        }
                    

                    // let smsOptions = {
                    //     type: 'OTP', // Other types: 'NOTFCTN' | 'COLLBRTN' | 'INVTATN',
                    //     countryCode,
                    //     phoneNumber,
                    //     verificationCode,
                    //     failOver: true
                    // };
                    // smsEngine.sendInternationalSms(smsOptions);

                }
                break;
            case 2: //Make a call                
                // fs.readFile(`${__dirname}/../utils/phoneCall.txt`, function (err, data) {
                //     (err) ? global.logger.write('debug', err, {}, request) : phoneCall = Number(data.toString());

                let redisPhoneCallMode = await cacheWrapper.getSmsMode('phone_call_mode');
                redisPhoneCallMode = Number(redisPhoneCallMode);

                let passcode= "", text = "";
                switch (redisPhoneCallMode) {
                    case 2: //Nexmo
                        //console.log('Making Nexmo Call');
                        //global.logger.write('conLog', 'Making Nexmo Call', {}, request);
                        util.logInfo(request,`sendCallOrSms Making Nexmo Call %j`,{request});
                        passcode = request.passcode;
                        passcode = passcode.split("");
                        passcode = passcode.toString();
                        passcode = passcode.replace(/,/g, " ");

                        //var text = "Your passcode for Mytony App is, " + passcode + ". I repeat, your passcode for Mytony App is, " + passcode + ". Thank you.";
                        text = "Your passcode for " + appName + " App is, " + passcode;
                        text += ". I repeat, your passcode for " + appName + " App is, " + passcode;
                        text += ". I repeat, your passcode for " + appName + " App is, " + passcode;
                        text += ". I repeat, your passcode for " + appName + " App is, " + passcode;
                        text += ". I repeat, your passcode for " + appName + " App is, " + passcode;
                        //console.log('Text: ' + text);
                        //global.logger.write('debug', 'Text: ' + text, {}, request);
                        util.logInfo(request,`sendCallOrSms debug Text:  %j`,{Text : text,request});

                        util.makeCallNexmoV1(text, request.passcode, countryCode, phoneNumber, function (error, data) {
                            if (error)
                                console.log(error);
                            console.log(data);
                            //global.logger.write('trace', data, error, request)
                            util.logError(request,`sendCallOrSms trace Error %j`, { data, error, request });
                        });
                        break;

                    case 1: //Twilio
                        //console.log('Making Twilio Call');
                        //global.logger.write('conLog', 'Making Twilio Call', {}, request);
                        util.logInfo(request,`sendCallOrSms Making Twilio Call %j`,{request});
                        passcode = request.passcode;
                        passcode = passcode.split("");

                        //var text = "Your passcode is " + passcode + " I repeat," + passcode + " Thank you.";
                        //var text = "Your passcode for Mytony App is, " + passcode + ". I repeat, your passcode for Mytony App is, " + passcode + ". Thank you.";
                        text = "Your passcode for " + appName + " App is, " + passcode;
                        text += ". I repeat, your passcode for " + appName + " App is, " + passcode;
                        text += ". I repeat, your passcode for " + appName + " App is, " + passcode;
                        text += ". I repeat, your passcode for " + appName + " App is, " + passcode;
                        text += ". I repeat, your passcode for " + appName + " App is, " + passcode;
                        //console.log('Text: ' + text);
                        //global.logger.write('debug', 'Text: ' + text, {}, request);
                        util.logInfo(request,`sendCallOrSms debug Text: %j`,{Text : text,request});
                        util.MakeCallTwilio(text, request.passcode, countryCode, phoneNumber, function (error, data) {
                            if (error)
                                console.log(error);
                            console.log(data);
                            //global.logger.write('trace', data, error, request)
                            util.logError(request,`sendCallOrSms trace Error %j`, { data, error, request });
                        });
                        break;
                }

                // });

                break;
            case 3: //email
                request.email_receiver_name="";
                request.email_sender_name="greneOS";
                //request.email_id = request.email_id;
                request.email_sender="support@greneos.com";
                request.subject = "greneOS App One Time Password";
                request.body = `Hi, <br/> ${verificationCode} is your verification code for the ${appName}.`;
                request.email_id = request.email;
                this.sendEmail(request);
                break;

        }
    };

    this.linkAsset = function (request, callback) {
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        let encToken = uuid.v1();
        let flag; //1 is prod and 0 is dev
        let flagAppAccount; //1 is Grene Robotics and 0 is BlueFlock

        (request.hasOwnProperty('flag_dev')) ? flag = request.flag_dev : flag = 1;
        (request.hasOwnProperty('flag_app_account')) ? flagAppAccount = request.flag_app_account : flagAppAccount = 0;

        let proceedLinking = function (proceedLinkingCallback) {

            updateAssetLinkStatus(request, request.asset_id, encToken, dateTimeLog, function (err, data) {
                if (err === false) {
                    let responseArr = {
                        enc_token: encToken
                    };
                    let authTokenCollection = {
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
                            cacheWrapper.getAssetParity(request.operating_asset_id, function (err, reply) { // retriving asset parity for operating asset id
                                if (!err) {
                                    authTokenCollection.asset_id = request.operating_asset_id;
                                    if (reply === 0) { // setting asset parity to 0
                                        cacheWrapper.setAssetParity(request.operating_asset_id, 0, function (err, reply) { });
                                        responseArr.operating_asset_message_counter = 0;
                                    } else { //sending the retrived parity value as response
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
                        // assetListHistoryInsert(request, request.asset_id, request.organization_id, 201, dateTimeLog, function (err, data) {
                        if (err === false) {
                            activityCommonService.assetTimelineTransactionInsert(request, {}, 1001, function (err, data) { });
                            cacheWrapper.getAssetParity(request.asset_id, function (err, reply) { // setting asset parity for desk asset id 
                                if (!err) {
                                    authTokenCollection.asset_id = request.asset_id;
                                    if (reply === 0) { // setting asset parity to 0
                                        cacheWrapper.setAssetParity(request.asset_id, 0, function (err, reply) { });
                                        responseArr.asset_message_counter = 0;
                                    } else { //sending the retrived parity value as response
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
                        // });
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
                    //global.logger.write('conLog', 'success in creating platform end point', {}, request)
                    util.logInfo(request,`createPlatformEndPoint success in creating platform end point %j`,{request});
                    request.asset_push_arn = endPointArn;
                    proceedLinking(function (err, response, status) {
                        if (status == 200) {
                            if (request.flag_is_linkup == 1) {
                                updateSignUpCnt(request, request.asset_id, 1).then(() => { });
                                updateSignUpCnt(request, request.operating_asset_id, 2).then(() => { });
                            }
                        }

                        callback(err, response, status);
                    });
                } else {
                    //console.log('problem in creating platform end point');
                    //global.logger.write('serverError', 'problem in creating platform end point', err, request)
                    util.logError(request,`createPlatformEndPoint serverError problem in creating platform end point Error %j`, { err,request });
                    callback(err, {}, -3108);
                }
            });
        } else {
            request.asset_push_arn = '';
            proceedLinking(function (err, response, status) {
                if (status == 200) {
                    if (request.flag_is_linkup == 1) {
                        updateSignUpCnt(request, request.asset_id, 1).then(() => { });
                        updateSignUpCnt(request, request.operating_asset_id, 2).then(() => { });
                    }
                }

                callback(err, response, status);
            });
        }
    };

    this.unlinkAsset = function (request, callback) {
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        updateAssetUnlink(request, request.asset_id, '', dateTimeLog, function (err, data) {
            if (err === false) {
                let responseArr = {};
                let authTokenCollection = {
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

    let updateAssetLinkStatus = function (request, assetId, encToken, dateTimeLog, callback) {

        let queryString = "";
        let paramsArr = new Array(
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

        if (request.hasOwnProperty('timezone_offset')) {
            //console.log('\x1b[36m timezone_offset parameter found \x1b[0m');
            //global.logger.write('conLog', '\x1b[36m timezone_offset parameter found \x1b[0m', {}, request);
            util.logInfo(request,`updateAssetLinkStatus \x1b[36m timezone_offset parameter found \x1b[0m %j`,{request});
            paramsArr.push(request.timezone_offset);

            // IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_device_hardware_id VARCHAR(300), 
            // IN p_device_os_id TINYINT(4), IN p_encryption_token_id VARCHAR(300), IN p_push_notification_id VARCHAR(300), 
            // IN p_push_arn VARCHAR(600), IN p_model_name VARCHAR(50), IN p_manufacturer_name VARCHAR(50), 
            // IN p_app_version VARCHAR(50), IN p_device_os_version VARCHAR(50),  IN p_log_asset_id BIGINT(20), 
            // IN p_log_datetime DATETIME, IN p_timezone_offset BIGINT
            queryString = util.getQueryString('ds_v1_2_asset_list_update_link', paramsArr);

        } else {
            // The following is retained for the sake of backward compatibility
            queryString = util.getQueryString('ds_v1_asset_list_update_link', paramsArr);

        }
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                } else {
                    callback(err, false);
                }
            });
        }
    };

    function updateSignUpCnt(request, assetId, whichAssetId) {
        // asset_Id : 1 
        // operating_asset_id : 2
        return new Promise((resolve, reject) => {

            if (whichAssetId === 1) {
                // ASSET ID - DESK
                activityCommonService.getAssetDetails(request, (err, data, statusCode) => {
                    if (err === false) {
                        //console.log('\x1b[36mAsset Signup count:\x1b[0m ', data.asset_count_signup);
                        //global.logger.write('debug', '\x1b[36mAsset Signup count:\x1b[0m ' + data.asset_count_signup, {}, request);
                        util.logInfo(request,`updateSignUpCnt debug \x1b[36mAsset Signup count:\x1b[0m  %j`,{asset_count_signup : data.asset_count_signup, request});
                        request.asset_count_signup = data.asset_count_signup;

                        if (data.asset_count_signup > 0) {
                            assetListUpdateSignupCnt(request, assetId).then(() => { });

                        } else {
                            assetListUpdateSignupCnt(request, assetId).then(() => { });
                            //Create a Task in a given Project and add an update
                            //Asset_id, operating_asset_name, organization_name, workforce_name
                            //console.log('Create a Task for Paramesh');
                            //global.logger.write('conLog', 'Create a Task for Paramesh', {}, request);
                            util.logInfo(request,`updateSignUpCnt Create a Task for Paramesh %j`,{request});
                            let newRequest = {};

                            newRequest.organization_id = 336;
                            newRequest.account_id = 437;
                            newRequest.workforce_id = 1898;
                            newRequest.asset_id = 8827;
                            newRequest.operating_asset_id = 8826;
                            newRequest.activity_title = data.operating_asset_first_name + " has signed up";
                            newRequest.activity_description = data.operating_asset_first_name + " has signed up";
                            newRequest.activity_inline_data = "{}";
                            newRequest.activity_datetime_start = util.getCurrentUTCTime();
                            newRequest.activity_datetime_end = util.addUnitsToDateTime(util.getCurrentUTCTime(), 1, 'years');
                            newRequest.activity_type_category_id = 10;
                            newRequest.activity_sub_type_id = 1;
                            newRequest.activity_type_id = 46458;

                            newRequest.activity_access_role_id = 26;
                            newRequest.activity_parent_id = 95670; //PROD - 95670 ; Staging - 93256

                            newRequest.url = "/add/activity/";
                            //activity_status_id:83846
                            //activity_status_type_id:17
                            //activity_status_type_category_id:0

                            newRequest.signedup_asset_id = data.asset_id;
                            newRequest.signedup_asset_organization_name = data.organization_name;
                            newRequest.signedup_asset_workforce_name = data.workforce_name;
                            newRequest.signedup_asset_name = data.operating_asset_first_name || "";

                            newRequest.signedup_asset_email_id = data.operating_asset_email_id || "";
                            newRequest.signedup_asset_phone_country_code = data.operating_asset_phone_country_code;
                            newRequest.signedup_asset_phone_number = data.operating_asset_phone_number;

                            cacheWrapper.getActivityId(function (err, activityId) {
                                if (err) {
                                    //console.log(err);
                                    //global.logger.write('debug', err, err, request);
                                    util.logError(request,`getActivityId debug Error %j`, { err,request });
                                } else {
                                    newRequest.activity_id = activityId;
                                    let event = {
                                        name: "addActivity",
                                        service: "activityService",
                                        method: "addActivity",
                                        payload: newRequest
                                    };
                                    queueWrapper.raiseActivityEvent(event, activityId, (err, resp) => {
                                        if (err) {
                                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                            //global.logger.write('serverError', 'Error in queueWrapper raiseActivityEvent : ' + resp, resp, request);
                                            util.logError(request,`serverError Error in queueWrapper raiseActivityEvent : Error %j`, { err, resp, request });
                                        } else {
                                            //console.log("new activityId is : " + activityId);
                                            //global.logger.write('debug', "new activityId is :" + activityId, {}, newRequest);
                                            util.logInfo(request,`raiseActivityEvent debug new activityId is : %j`,{new_activityId : activityId,newRequest});
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            } else {
                // OPERATING ASSET ID - EMPLOYEE
                let newRequest = Object.assign(request);
                newRequest.asset_id = request.operating_asset_id;

                activityCommonService.getAssetDetails(newRequest, (err, data, statusCode) => {
                    //console.log('\x1b[36mOperating Asset Signup count:\x1b[0m ', data.asset_count_signup);
                    //global.logger.write('debug', '\x1b[36mOperating Asset Signup count:\x1b[0m ' + data.asset_count_signup, {}, newRequest);
                    util.logInfo(request,`getAssetDetails debug \x1b[36mOperating Asset Signup count:\x1b[0m %j`,{asset_count_signup : data.asset_count_signup, newRequest});
                    newRequest.asset_count_signup = data.asset_count_signup;

                    assetListUpdateSignupCnt(request, assetId).then(() => { });
                });

            }
        });
    };

    function assetListUpdateSignupCnt(request, assetId) {
        return new Promise((resolve, reject) => {
            // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
            // IN p_asset_id BIGINT(20), IN p_asset_count_signup BIGINT(20), IN p_log_datetime DATETIME
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                assetId,
                request.asset_count_signup,
                util.getCurrentUTCTime()
            );
            let queryString = util.getQueryString('ds_v1_1_asset_list_update_signup_count', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    //global.logger.write(queryString, request, 'asset', 'trace');
                    (err === false) ? resolve() : reject(err);
                });
            }
        });
    }


    let updateAssetUnlink = function (request, assetId, encToken, dateTimeLog, callback) {

        let paramsArr = new Array(
            assetId,
            request.organization_id,
            request.asset_id,
            dateTimeLog
        );

        let queryString = util.getQueryString('ds_v1_asset_list_update_unlink', paramsArr);
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


    let assetListHistoryInsert = function (request, assetId, organizationId, updateTypeId, datetimeLog, callback) {

        let paramsArr = new Array(
            assetId,
            organizationId,
            updateTypeId,
            datetimeLog
        );

        let queryString = util.getQueryString('ds_v1_asset_list_history_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                //global.logger.write(queryString, request, 'asset', 'trace');
                if (err === false) {
                    callback(false, true);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(false, false);
                }
            });
        }
    };

    this.addAsset = function (request, callback) {
        let responseDataCollection = {};
        let contactActivityInlineData = JSON.parse(request.activity_inline_data);
        request.workforce_id = contactActivityInlineData.contact_workforce_id || request.workforce_id;

        //check if phone number and cc of the new contact exist in the activity type id ...
        checkIfContactAssetExistV1(request, 0, function (err, contactAssetData) {
            if (err === false) {
                console.log('\x1b[36m [Existing Asset ID Check] contactAssetData: \x1b[0m', contactAssetData);
                if (contactAssetData.length > 0) {
                    console.log('contactAssetData: ', contactAssetData);
                    responseDataCollection.asset_id = contactAssetData[0]['asset_id'];

                    activityCommonService.workforceAssetTypeMappingSelectCategory(request, 45, function (err, assetTypeData, statusCode) {

                        checkIfContactAssetExistV1(request, Number(assetTypeData[0].asset_type_id), function (err, contactAssetData) {
                            console.log('\x1b[36m [Existing Desk Asset ID Check] contactAssetData: \x1b[0m', contactAssetData);

                            // Check if a desk asset entry exists
                            if (contactAssetData.length > 0) {

                                responseDataCollection.desk_asset_id = contactAssetData[0]['asset_id'];

                                // If a desk asset exists, look for the corresponding contact file activity_id
                                getContactActivityid(request, responseDataCollection.desk_asset_id, function (err, contactActivityData) {
                                    if (contactActivityData.length > 0) {
                                        responseDataCollection.activity_id = contactActivityData[0]['activity_id'];
                                    }
                                    callback(false, responseDataCollection, 200);
                                });

                            } else {
                                // If a desk asset and/or contact file activity doesn't
                                // exist return just the contact's asset_id
                                return callback(false, responseDataCollection, 200);
                            }

                        });
                    });

                    // getContactActivityid(request, contactAssetData[0]['asset_id'], function (err, contactActivityData) {
                    //     responseDataCollection.activity_id = contactActivityData[0]['activity_id'];
                    //     callback(false, responseDataCollection, 200);
                    // });
                    // callback(false, responseDataCollection, 200);
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

                } else { // create an asset and then add activity here..
                    createAsset(request, function (err, newAssetId) {
                        if (err === false) {
                            responseDataCollection.asset_id = newAssetId;
                            console.log('\x1b[36m [New Asset ID Created] responseDataCollection: \x1b[0m', responseDataCollection);

                            // For a contact card file activity
                            if (Number(request.activity_type_category_id) === 6) {

                                // Fetch asset_type_id for creating the service desk
                                activityCommonService.workforceAssetTypeMappingSelectCategory(request, 45, function (err, assetTypeData, statusCode) {
                                    if (!err) {
                                        // Create the service desk
                                        let newRequestObject = Object.assign(request);
                                        let contactCardActivityInlineData = JSON.parse(request.activity_inline_data);
                                        contactCardActivityInlineData.contact_asset_type_id = assetTypeData[0].asset_type_id;

                                        newRequestObject.operating_asset_id = newAssetId;
                                        newRequestObject.asset_description = "Service Desk";
                                        newRequestObject.activity_inline_data = JSON.stringify(contactCardActivityInlineData);

                                        createAsset(newRequestObject, function name(err, newDeskAssetId) {
                                            responseDataCollection.desk_asset_id = newDeskAssetId;
                                            console.log('\x1b[36m [New Desk Asset ID Created] responseDataCollection: \x1b[0m', responseDataCollection);

                                            callback(false, responseDataCollection, 200);
                                        });

                                    } else {
                                        return callback(false, responseDataCollection, 200);
                                    }
                                });

                            } else {
                                callback(false, responseDataCollection, 200);
                            }
                            // callback(false, responseDataCollection, 200);
                        } else {
                            callback(err, {}, -9998);
                        }
                    });
                }
            }
        });
        return;
    };

    let getContactActivityid = function (request, contactAssetId, callback) {

        let paramsArr = new Array(
            contactAssetId,
            request.organization_id,
            request.activity_type_category_id
        );
        let queryString = util.getQueryString('ds_v1_activity_list_select_category_contact', paramsArr);
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


    let createAsset = function (request, callback) {
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        assetListInsertAddAsset(request, function (err, newAssetId) {
            if (err === false) {
                assetListHistoryInsert(request, newAssetId, request.organization_id, 0, dateTimeLog, function (err, data) {
                    if (err === false) {
                        let newAssetCollection = {
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


    let checkIfContactAssetExist = function (request, callback) {

        let activityInlineData = JSON.parse(request.activity_inline_data);
        let paramsArr = new Array(
            request.organization_id,
            activityInlineData.contact_phone_number,
            activityInlineData.contact_phone_country_code,
            activityInlineData.contact_asset_type_id
        );

        let queryString = util.getQueryString('ds_v1_asset_list_select_category_phone_number', paramsArr);
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

    let checkIfContactAssetExistV1 = function (request, contactAssetTypeId, callback) {

       

        let activityInlineData = JSON.parse(request.activity_inline_data);
        if(activityInlineData.contact_phone_number==""){
            callback(false, []);
            return 
          }
        if (contactAssetTypeId === 0) {
            contactAssetTypeId = activityInlineData.contact_asset_type_id;
        }
        let paramsArr = new Array(
            request.organization_id,
            activityInlineData.contact_phone_number,
            activityInlineData.contact_phone_country_code,
            contactAssetTypeId
        );

        let queryString = util.getQueryString('ds_v1_asset_list_select_asset_type_phone_number', paramsArr);
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

    let archiveAsset = async function (request,type){

        let error= true,
         responseData = [];

         let paramsArr = new Array(
            request.target_asset_id,
            request.organization_id,
            type,
            util.getCurrentUTCTime(),
            request.asset_id,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_v1_asset_archived_list_insert', paramsArr);
        if (queryString != '') {
             await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    //logger.info("DD :: "+JSON.stringify(data));
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        console.log(error ,":: ",responseData);
        return [error, responseData];
    }

    let deleteAsset = function (request, callback) {
        let paramsArr = new Array(
            request.target_asset_id,
            request.organization_id,
            request.target_asset_id,
            request.datetime_log
        );
        console.log(paramsArr);
        let queryString = util.getQueryString('ds_v1_asset_list_delete', paramsArr);
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


    let assetListInsertAddAsset = function (request, callback) {
        // IN p_asset_first_name VARCHAR(50), IN p_asset_last_name VARCHAR(50), 
        // IN p_asset_description VARCHAR(150), IN p_customer_unique_id VARCHAR(50), 
        // IN p_asset_image_path VARCHAR(300), IN p_asset_inline_data JSON, 
        // IN p_country_code SMALLINT(6), IN p_phone_number VARCHAR(20), IN p_email_id VARCHAR(50), 
        // IN p_timezone_id SMALLINT(6), IN p_asset_type_id BIGINT(20), IN p_operating_asset_id BIGINT(20), 
        // IN p_manager_asset_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_account_id  BIGINT(20), 
        // IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME


        let activityInlineData = JSON.parse(request.activity_inline_data);

        console.log('activityInlineData.contact_workforce_id - ', activityInlineData.contact_workforce_id);
        console.log('request.workforce_id - ', request.workforce_id);

        let paramsArr = new Array(
            activityInlineData.contact_first_name,
            activityInlineData.contact_last_name,
            request.asset_description || "",
            request.account_code || 0,
            activityInlineData.contact_profile_picture,
            request.activity_inline_data, //p_asset_inline_data
            activityInlineData.contact_phone_country_code,
            activityInlineData.contact_phone_number,
            activityInlineData.contact_email_id,
            22,
            activityInlineData.contact_asset_type_id, // asset type id
            request.operating_asset_id || 0,
            0,
            activityInlineData.contact_workforce_id || request.workforce_id,
            activityInlineData.contact_account_id || request.account_id,
            activityInlineData.contact_organization_id || request.organization_id,
            request.asset_id,
            request.datetime_log
        );

        let queryString = util.getQueryString('ds_v1_asset_list_insert', paramsArr);
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

        let paramsArr = new Array(
            assetId,
            request.organization_id,
            request.lamp_status,
            request.track_gps_datetime,
            request.asset_id,
            request.datetime_log
        );

        let queryString = util.getQueryString('ds_v1_asset_list_update_lamp_status', paramsArr);
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
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        assetListUpdateLampStatus(request, request.asset_id, function (err, data) {
            if (err === false) {
                assetListHistoryInsert(request, request.asset_id, request.organization_id, request.update_type_id, dateTimeLog, function (err, data) { });
                assetListUpdateLampStatus(request, request.operating_asset_id, function (err, data) {
                    if (err === false) {
                        assetListHistoryInsert(request, request.operating_asset_id, request.organization_id, request.update_type_id, dateTimeLog, function (err, data) { });
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
        let paramsArr = new Array(
            request.account_id
        );

        let queryString = util.getQueryString('ds_v1_account_list_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    let rowData = {
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
        let paramsArr = new Array(
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

        let queryString = util.getQueryString('ds_v1_asset_list_select_list_level', paramsArr);
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

    let assetListUpdateStatus = function (request, assetId, callback) {

        let paramsArr = new Array(
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
        let queryString = util.getQueryString('ds_v1_1_asset_list_update_status_all', paramsArr);
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

        let paramsArr = new Array(
            assetId,
            request.organization_id,
            request.lamp_status_id,
            request.track_latitude,
            request.track_longitude,
            request.track_gps_datetime,
            request.asset_id,
            request.datetime_log
        );

        let queryString = util.getQueryString('ds_v1_1_asset_list_update_lamp_status', paramsArr);
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
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        if (request.asset_clocked_status_id > 0 || request.asset_session_status_id > 0) {

            //Session Status
            this.getAssetDetails(request, (err, data, statuscode) => {

                let x = JSON.parse(JSON.stringify(data));
                let retrievedAssetSessionStatusId = util.replaceDefaultNumber(x.data.asset_session_status_id);
                let requestAssetSessionStatusId = util.replaceDefaultNumber(request.asset_session_status_id);
                let retrievedAssetSessionStatusDateTime = util.replaceDefaultDatetime(x.data.asset_session_status_datetime);

                let retrievedAssetStatusId = util.replaceDefaultNumber(x.data.asset_status_id);
                let requestAssetStatusId = util.replaceDefaultNumber(request.asset_clocked_status_id);
                let retrievedAssetStatusDateTime = util.replaceDefaultDatetime(x.data.asset_status_datetime);

                //console.log('requestAssetSessionStatusId : ' + requestAssetSessionStatusId);
                //console.log('retrievedAssetSessionStatusId : ' + retrievedAssetSessionStatusId);

                //console.log('requestAssetStatusId Clocked : ' + requestAssetStatusId);
                //console.log('retrievedAssetStatusId Clocked : ' + retrievedAssetStatusId);

                //global.logger.write('debug', 'requestAssetSessionStatusId : ' + requestAssetSessionStatusId, {}, request);
                util.logInfo(request,`getAssetDetails debug requestAssetSessionStatusId: %j`,{requestAssetSessionStatusId : requestAssetSessionStatusId, request});
                //global.logger.write('debug', 'retrievedAssetSessionStatusId : ' + retrievedAssetSessionStatusId, {}, request);
                util.logInfo(request,`getAssetDetails debug retrievedAssetSessionStatusId: %j`,{retrievedAssetSessionStatusId : retrievedAssetSessionStatusId, request});

                //global.logger.write('debug', 'requestAssetStatusId Clocked : ' + requestAssetStatusId, {}, request);
                util.logInfo(request,`getAssetDetails debug requestAssetStatusId Clocked : %j`,{requestAssetStatusId : requestAssetStatusId, request});
                //global.logger.write('debug', 'retrievedAssetStatusId Clocked : ' + retrievedAssetStatusId, {}, request);
                util.logInfo(request,`getAssetDetails debug retrievedAssetStatusId Clocked : %j`,{retrievedAssetStatusId : retrievedAssetStatusId, request});

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
                                let ms = util.differenceDatetimes(dateTimeLog, retrievedAssetSessionStatusDateTime);
                                let sec = ms * 0.001;
                                //console.log('Seconds : ' + sec);
                                //console.log('requested DAteTime : ' + dateTimeLog);
                                //console.log('retrievedAssetSessionStatusDateTime : ' + retrievedAssetSessionStatusDateTime);

                                //global.logger.write('debug', 'Seconds : ' + sec, {}, request);
                                util.logInfo(request,`getAssetDetails debug Seconds : %j`,{Seconds : sec, request});
                                //global.logger.write('debug', 'requested DAteTime : ' + dateTimeLog, {}, request);
                                util.logInfo(request,`getAssetDetails debug requested DAteTime : %j`,{DAteTime : dateTimeLog, request});
                                //global.logger.write('debug', 'retrievedAssetSessionStatusDateTime : ' + retrievedAssetSessionStatusDateTime, {}, request);
                                util.logInfo(request,`getAssetDetails debug retrievedAssetSessionStatusDateTime: %j`,{retrievedAssetSessionStatusDateTime : retrievedAssetSessionStatusDateTime, request});

                                request['seconds'] = Math.round(sec);
                                //global.logger.writeSession(request);
                                util.logInfo(request,`getAssetDetails %j`,{request});

                                //MySQL Insert
                                //this.mySqlInsertForAlterAssetStatus(request, callback);
                            }
                        }
                    } else if (requestAssetSessionStatusId === 10) {
                        //Update the Log
                        let ms = util.differenceDatetimes(dateTimeLog, retrievedAssetSessionStatusDateTime);
                        let sec = ms * 0.001;
                        //console.log('Seconds : ' + sec);
                        //console.log('requested DAteTime : ' + dateTimeLog);
                        //console.log('retrievedAssetSessionStatusDateTime : ' + retrievedAssetSessionStatusDateTime);

                        //global.logger.write('debug', 'Seconds : ' + sec, {}, request);
                        util.logInfo(request,`getAssetDetails debug Seconds :  %j`,{Seconds : sec, request});
                        //global.logger.write('debug', 'requested DAteTime : ' + dateTimeLog, {}, request);
                        util.logInfo(request,`getAssetDetails debug requested DAteTime :  %j`,{DAteTime : dateTimeLog, request});
                        //global.logger.write('debug', 'retrievedAssetSessionStatusDateTime : ' + retrievedAssetSessionStatusDateTime, {}, request);
                        util.logInfo(request,`getAssetDetails debug retrievedAssetSessionStatusDateTime : %j`,{retrievedAssetSessionStatusDateTime : retrievedAssetSessionStatusDateTime, request});

                        request['seconds'] = Math.round(sec);
                        //global.logger.writeSession(request);
                        util.logInfo(request,`getAssetDetails %j`,{request});

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
                                let ms = util.differenceDatetimes(dateTimeLog, retrievedAssetStatusDateTime);
                                let hours = (ms * 0.001) / 3600;
                                //console.log('dateTimeLog : ' + dateTimeLog)
                                //console.log('retrievedAssetStatusDateTime : ' + retrievedAssetStatusDateTime)
                                //console.log('Hours : ' + Math.round(hours));
                                request['hours'] = Math.round(hours);
                                //global.logger.writeSession(request);
                                util.logInfo(request,`getAssetDetails  %j`,{request});

                                //MySQL Insert
                                //this.mySqlInsertForAlterAssetStatus(request, callback);
                            }
                        }
                    } else if (requestAssetStatusId === 2) {
                        let ms = util.differenceDatetimes(dateTimeLog, retrievedAssetStatusDateTime);
                        let hours = (ms * 0.001) / 3600;
                        //console.log('dateTimeLog : ' + dateTimeLog)
                        //console.log('retrievedAssetStatusDateTime : ' + retrievedAssetStatusDateTime)
                        //console.log('Hours : ' + Math.round(hours));
                        request['hours'] = Math.round(hours);
                        //global.logger.writeSession(request);
                        util.logInfo(request,`getAssetDetails %j`,{request});

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
/*
    //PAM
    this.removeAsset = async (request) => {
        console.log('util : ' + util);
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        
        //archive asset data
        deleteAsset(request, function (err, AssetId) {
                if (err === false) {
                    archiveAsset(request);
                    assetListHistoryInsert(request, request.target_asset_id, request.organization_id, 204, dateTimeLog, function (err, data) { });
                    var responseDataCollection = {};
                    responseDataCollection.asset_id = AssetId;
                    return[false, responseDataCollection];
                } else {
                    return[err, {}]
                }
            });
    };
*/
    this.removeAsset = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
            request.target_asset_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_v1_asset_list_delete', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
                  archiveAsset(request,3803);
                  assetListHistoryInsert(request, request.target_asset_id, request.organization_id, 204, util.getCurrentUTCTime(), function (err, data) { });

              })
              .catch((err) => {
                  console.log("error in removeAssets", err, err.stack);
                  error = err;
              })
        }

        return [error, responseData];
    }  
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
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            0, //request.workforce_id
            request.asset_type_category_id
        );

        let queryString = util.getQueryString('ds_v1_1_asset_list_select_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, totalCount) {
                if (err === false) {
                    console.log('totalCount[0].total_count : ' + totalCount)

                    if (totalCount.length > 0) {

                        let responseTotalData = new Array();
                        forEachAsync(totalCount, function (next, rowData) {
                            let rowDataArr = {};
                            rowDataArr.total_count = util.replaceDefaultNumber(rowData['total_count']);
                            rowDataArr.asset_type_name = util.replaceDefaultString(rowData['asset_type_name']);
                            rowDataArr.asset_type_id = util.replaceDefaultString(rowData['asset_type_id']);
                            responseTotalData.push(rowDataArr);
                            next();
                        }).then(function () {

                            let paramsArr = new Array(
                                request.organization_id,
                                request.account_id,
                                request.asset_type_category_id,
                                request.asset_status_id,
                                request.page_start,
                                request.page_limit
                            );

                            let queryString = util.getQueryString('ds_v1_asset_list_select_status_count', paramsArr);
                            if (queryString != '') {
                                db.executeQuery(1, queryString, request, function (err, totalCount) {
                                    if (err === false) {
                                        console.log('Count returned2 : ' + JSON.stringify(totalCount));
                                        console.log('totalCount.length : ' + totalCount.length);
                                        if (totalCount.length > 0) {

                                            let responseData = new Array();
                                            forEachAsync(totalCount, function (next, rowData) {
                                                let rowDataArr = {};
                                                rowDataArr.total_count = util.replaceDefaultNumber(rowData['total_count']);
                                                rowDataArr.asset_type_name = util.replaceDefaultString(rowData['asset_type_name']);
                                                rowDataArr.asset_type_id = util.replaceDefaultString(rowData['asset_type_id']);
                                                responseData.push(rowDataArr);
                                                next();
                                            }).then(function () {
                                                callback(false, {
                                                    responseTotalData,
                                                    responseData
                                                }, 200);
                                            });
                                        } else {
                                            callback(false, {
                                                "responseTotalData": [],
                                                "responseData": []
                                            }, 200);
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
                        callback(false, {
                            "responseTotalData": [],
                            "responseData": []
                        }, 200);
                    }
                }
            });
        } else {
            callback(true, 'Error', -9998);
        }
    };

    //PAM
    this.assetInlineAlter = function (request, callback) {
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        let paramsArr = new Array(
            request.target_asset_id,
            request.organization_id,
            request.asset_inline_data,
            request.asset_id,
            request.datetime_log
        );

        let queryString = util.getQueryString('ds_v1_asset_list_update_inline_data', paramsArr);
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
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        let paramsArr = new Array(
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

        let queryString = util.getQueryString('ds_v1_asset_list_insert', paramsArr);
        if (queryString != '') {
            //global.logger.write(queryString, request, 'asset', 'trace');
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    assetListHistoryInsert(request, assetData[0]['asset_id'], request.organization_id, 0, dateTimeLog, function (err, data) { });
                    request.ingredient_asset_id = assetData[0]['asset_id'];
                    // sss.createAssetBucket(request, function () {});

                    if (assetData[0].asset_type_category_id == 41) {
                        retrieveAccountWorkforces(request).then((data) => {
                            forEachAsync(data, function (next, x) {
                                createActivityTypeForAllWorkforces(request, x).then(() => {
                                    workForceActivityTypeHistoryInsert(request).then(() => { })
                                    next();
                                })
                            }).then(() => { });
                        });
                    }
                    callback(false, {
                        "asset_id": assetData[0]['asset_id']
                    }, 200);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, err, -9999);
                }
            });
        }
    }

    function retrieveAccountWorkforces(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                0,
                50
            );
            let queryString = util.getQueryString('ds_v1_workforce_list_select_account', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }

    function createActivityTypeForAllWorkforces(request, workforceId) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
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
            let queryString = util.getQueryString('ds_v1_workforce_activity_type_mapping_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }

    function workForceActivityTypeHistoryInsert(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                0, //update type id
                request.datetime_log
            );
            let queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_history_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }

    this.updateAssetCoverLocation = function (request, callback) {
        let dateTimeLog = util.getCurrentUTCTime();
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
            let response = {};
            let A1, A2, A3;
            let X;

            let D1, D2;
            let E1, E2;
            let Y;

            let F1, F3;
            let G1, G3;
            let Z;

            activityCommonService.getOccupiedDeskCounts(request, function (err, data) {
                if (err === false) {
                    A1 = data[0].occupied_desks; //Total number of Desks

                    request.flag = 0;
                    activityCommonService.assetAccessCounts(request, function (err, resp) {
                        if (err === false) {
                            A2 = resp[0].totalOrgHours; //Total Organization Hours
                            A3 = resp[0].totalAssetHours; //Total Employee Hours

                            //console.log('A1 :', A1);
                            //console.log('A2 :', A2);
                            //console.log('A3 :', A3);

                            //global.logger.write('conLog', 'A1 :' + A1, {}, request);
                            util.logInfo(request,`assetAccessCounts A1 : %j`,{A1 : A1, request});
                            //global.logger.write('conLog', 'A2 :' + A2, {}, request);
                            util.logInfo(request,`assetAccessCounts A2 : %j`,{A2 : A2, request});
                            //global.logger.write('conLog', 'A3 :' + A3, {}, request);
                            util.logInfo(request,`assetAccessCounts A3 : %j`,{A3 : A3, request});


                            (A1 == 0 || A2 == 0) ? X = -1 : X = ((A3 / (A2 / A1)) * 100);

                            console.log('Work Presence : ' + X);
                            //global.logger.write('conLog', 'Work Presence : ' + X, {}, request);
                            util.logInfo(request,`assetAccessCounts Work Presence : %j`,{Work_Presence : X, request});


                            D1 = resp[0].countAllVoice;
                            D2 = resp[0].countMissedVoice;

                            E1 = resp[0].countAllVideo;
                            E2 = resp[0].countMissedVideo;

                            //console.log('D1 :', D1);
                            //console.log('D2 :', D2);
                            //console.log('E1 :', E1);
                            //console.log('E2 :', E2);

                            //global.logger.write('conLog', 'D1 :' + D1, {}, request);
                            util.logInfo(request,`assetAccessCounts D1 : %j`,{D1 : D1, request});
                            //global.logger.write('conLog', 'D2 :' + D2, {}, request);
                            util.logInfo(request,`assetAccessCounts D2 : %j`,{D2 : D2, request});
                            //global.logger.write('conLog', 'E1 :' + E1, {}, request);
                            util.logInfo(request,`assetAccessCounts E1 : %j`,{E1 : E1, request});
                            //global.logger.write('conLog', 'E2 :' + E2, {}, request);
                            util.logInfo(request,`assetAccessCounts E2 : %j`,{E2 : E2, request});


                            ((D1 + E1) == 0) ? Y = -1 : Y = ((((D1 + E1) - (D2 + E2)) / (D1 + E1)) * 100);

                            console.log('Communication Aptitude : ' + Y);
                            //global.logger.write('conLog', 'Communication Aptitude : ' + Y, {}, request);
                            util.logInfo(request,`assetAccessCounts Communication Aptitude :  %j`,{Communication_Aptitude : Y, request});

                            F1 = resp[0].countCreatedTasks;
                            F3 = resp[0].countCompletedTasks;

                            G1 = resp[0].countCreatedProjects;
                            G3 = resp[0].countCompletedProjects;

                            //console.log('F1 :', F1);
                            //console.log('F3 :', F3);
                            //console.log('G1 :', G1);
                            //console.log('G3 :', G3);

                            //global.logger.write('conLog', 'F1 :' + F1, {}, request);
                            util.logInfo(request,`assetAccessCounts F1 : %j`,{F1 : F1, request});
                            //global.logger.write('conLog', 'F3 :' + F3, {}, request);
                            util.logInfo(request,`assetAccessCounts F3 : %j`,{F3 : F3, request});
                            //global.logger.write('conLog', 'G1 :' + G1, {}, request);
                            util.logInfo(request,`assetAccessCounts G1 : %j`,{G1 : G1, request});
                            //global.logger.write('conLog', 'G3 :' + G3, {}, request);
                            util.logInfo(request,`assetAccessCounts G3 : %j`,{G3 : G3, request});

                            ((F1 + G1) == 0) ? Z = -1 : Z = (((F3 + G3) / (F1 + G1)) * 100);

                            console.log('Productivity : ' + Z);
                            //global.logger.write('conLog', 'Productivity : ' + Z, {}, request);
                            util.logInfo(request,`assetAccessCounts Productivity :  %j`,{Productivity : Z, request});

                            let rating;
                            (X == -1 || Y == -1 || Z == -1) ? rating = -1 : rating = (((12 / 70) * X) + ((34 / 70) * Y) + ((24 / 70) * Z));

                            console.log('Rating : ' + rating);
                            //global.logger.write('conLog', 'Rating : ' + rating, {}, request);
                            util.logInfo(request,`assetAccessCounts Rating : %j`,{Rating : rating,request});
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
                        case 0:
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
        let response = {};
        let collection = {};
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
        let response = {};
        let collection = {};
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
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        let flag; //1 is prod and 0 is dev
        let flagAppAccount; //1 is Grene Robotics and 0 is BlueFlock

        (request.hasOwnProperty('flag_dev')) ? flag = request.flag_dev : flag = 1;
        (request.hasOwnProperty('flag_app_account')) ? flagAppAccount = request.flag_app_account : flagAppAccount = 0;

        let proceed = function (callback) {
            let authTokenCollection = {
                "asset_id": request.asset_id,
                "workforce_id": request.workforce_id,
                "account_id": request.account_id,
                "organization_id": request.organization_id,
                "asset_token_push": request.asset_token_push,
                "asset_push_arn": request.asset_push_arn,
                "asset_auth_token": request.asset_token_auth
            };

            updatePushToken(request, request.operating_asset_id).then(() => {
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
            }).catch(() => {
                callback(true, {}, -9998);
            });

            function callingNextFunction() {
                updatePushToken(request, request.asset_id).then(() => {
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
                }).catch(() => {
                    callback(true, {}, -9998);
                });
            }
        }

        if (request.hasOwnProperty('asset_token_push') && request.asset_token_push !== '' && request.asset_token_push !== null) {
            sns.createPlatformEndPoint(Number(request.device_os_id), request.asset_token_push, flag, flagAppAccount, function (err, endPointArn) { //flag 1 is prod and 0 is dev
                if (!err) {
                    //console.log('success in creating platform end point');
                    //global.logger.write('conLog', 'success in creating platform end point', {}, request)
                    util.logInfo(request,`createPlatformEndPoint success in creating platform end point %j`,{request});
                    request.asset_push_arn = endPointArn;
                    proceed(function (err, response, status) {
                        callback(err, response, status);
                    });
                } else {
                    //console.log('problem in creating platform end point : ' , err);
                    //global.logger.write('serverError', 'problem in creating platform end point', err, request)
                    util.logError(request,`createPlatformEndPoint serverError problem in creating platform end point Error %j`, { err, request });
                    callback(true, err, -3108);
                }
            });
        } else {
            callback(true, false, -9998);
        }
    };

    this.updateInviteCount = function (request, callback) {
        updateInviteCountFn(request, request.asset_id).then(() => {
            updateInviteCountFn(request, request.operating_asset_id).then(() => {
                callback(false, {}, 200);
            }).catch((err) => {
                callback(true, err, -9999);
            });
        }).catch((err) => {
            callback(true, err, -9999);
        });
    };


    function updateInviteCountFn(request, assetId) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                assetId
            );
            let queryString = util.getQueryString('ds_v1_asset_list_update_invite_count', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve() : reject(err);
                });
            }
        });
    };

    this.phoneNumberDelete = function (request, callback) {
        let paramsArr = new Array(
            request.asset_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('ds_p1_asset_list_phone_number_delete', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, {}, 200) : reject(true, err, -9999);
            });
        }
    };

    //Retrieving the unread count based on mobile number
    this.unreadCntBasedOnMobileNumber = function (request, callback) {
        let response = new Array;
        let allAssetIds = new Array;
        let finalAssetIds = new Array;
        let finalResponse = new Array;
        let dayPlanAssetIds = new Array;
        let pastDueAssetIds = new Array;

        let paramsArr = new Array(
            request.operating_asset_phone_number,
            request.operating_asset_phone_country_code,
            request.sort_flag,
            0,
            50
        );

        let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_unread_counts_phone_number', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    //console.log('unread counts: ', data);
                    //global.logger.write('debug', 'unread counts: ' + JSON.stringify(data, null, 2), {}, request);
                    util.logInfo(request,`unreadCntBasedOnMobileNumber debug unread counts:  %j`,{unread_counts : JSON.stringify(data, null, 2), request});
                    forEachAsync(data, (next, row) => {
                        allAssetIds.push(row.asset_id);
                        row.unread_count = row.count; //Adding the unread_count parameter in the response                
                        formatActiveAccountsCountData(row, (err, formatedData) => {
                            response.push(formatedData);
                            next();
                        });
                    }).then(() => {
                        let paramsArr = new Array(
                            0, //organizationId,
                            request.operating_asset_phone_number,
                            request.operating_asset_phone_country_code
                        );
                        let queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all', paramsArr);
                        if (queryString != '') {
                            db.executeQuery(1, queryString, request, function (err, selectData) {
                                if (err === false) {
                                    //console.log(selectData.length);
                                    //global.logger.write('debug', selectData.length, {}, request);
                                    util.logInfo(request,`unreadCntBasedOnMobileNumber debug %j`,{selectData_length : selectData.length, request});
                                    forEachAsync(selectData, (next, rowData) => {
                                        finalAssetIds.push(rowData.asset_id);
                                        if (allAssetIds.includes(rowData.asset_id)) {
                                            //console.log(rowData.asset_id + ' is there.');
                                            //global.logger.write('conLog', rowData.asset_id + ' is there.', {}, request);
                                            util.logInfo(request,`unreadCntBasedOnMobileNumber conLog ${rowData.asset_id} is there. %j`,{request});
                                            next();
                                        } else {
                                            formatActiveAccountsCountData(rowData, (err, formatedData) => {
                                                response.push(formatedData);
                                                next();
                                            });
                                        }
                                    }).then(() => {
                                        //console.log('All Asset Ids : ', allAssetIds);
                                        //console.log('final Asset Ids : ', finalAssetIds);

                                        //global.logger.write('debug', 'All Asset Ids : ' + JSON.stringify(allAssetIds), {}, request);
                                        util.logInfo(request,`unreadCntBasedOnMobileNumber debug All Asset Ids : %j`,{All_Asset_Ids : JSON.stringify(allAssetIds), request});
                                        //global.logger.write('debug', 'final Asset Ids : ' + JSON.stringify(finalAssetIds), {}, request);
                                        util.logInfo(request,`unreadCntBasedOnMobileNumber debug final Asset Ids : %j`,{final_Asset_Ids : JSON.stringify(finalAssetIds), request});

                                        forEachAsync(response, (next, rowData) => {
                                            if (finalAssetIds.includes(rowData.asset_id)) {
                                                //console.log(rowData.asset_id);
                                                //global.logger.write('conLog', rowData.asset_id, {}, request);
                                                util.logInfo(request,`unreadCntBasedOnMobileNumber conLog %j`,{asset_id : rowData.asset_id, request});
                                                finalResponse.push(rowData);
                                            }
                                            next();
                                        }).then(() => {

                                            dayPlanCnt(request).then((dayPlanCnt) => {
                                                //console.log('DayPlanCnt : ', dayPlanCnt);
                                                //global.logger.write('debug', 'DayPlanCnt : ' + JSON.stringify(dayPlanCnt), {}, request);
                                                util.logInfo(request,`unreadCntBasedOnMobileNumber debug DayPlanCnt : %j`,{DayPlanCnt : JSON.stringify(dayPlanCnt), request});

                                                forEachAsync(dayPlanCnt, (next, dayPlanrowData) => {
                                                    dayPlanAssetIds.push(dayPlanrowData.asset_id);

                                                    if (finalAssetIds.includes(dayPlanrowData.asset_id)) {

                                                        //Updating the count in the final response
                                                        forEachAsync(finalResponse, (next, finalResprowData) => {
                                                            if (finalResprowData.asset_id === dayPlanrowData.asset_id) {
                                                                finalResprowData.count += dayPlanrowData.count; //Adding the dayPlanCount to total count
                                                                finalResprowData.day_plan_count = dayPlanrowData.count;
                                                                next();
                                                            } else {
                                                                next();
                                                            }
                                                        }).then(() => {
                                                            next();
                                                        });
                                                    } else {
                                                        next();
                                                    }

                                                }).then(() => {
                                                    pastDueCnt(request).then((pastDueCnt) => {
                                                        //console.log('pastDueCnt : ', pastDueCnt);
                                                        //global.logger.write('debug', 'pastDueCnt : ' + JSON.stringify(pastDueCnt), {}, request);
                                                        util.logInfo(request,`unreadCntBasedOnMobileNumber debug pastDueCnt :  %j`,{pastDueCnt : JSON.stringify(pastDueCnt), request});

                                                        forEachAsync(pastDueCnt, (next, pastDuerowData) => {
                                                            pastDueAssetIds.push(pastDuerowData.asset_id);
                                                            if (finalAssetIds.includes(pastDuerowData.asset_id)) {

                                                                //Updating the count in the final response
                                                                forEachAsync(finalResponse, (next, finalResprowData) => {
                                                                    if (finalResprowData.asset_id === pastDuerowData.asset_id) {
                                                                        finalResprowData.count += pastDuerowData.count; //Adding the PastDueCount to total count
                                                                        finalResprowData.past_due_count = pastDuerowData.count;
                                                                        next();
                                                                    } else {
                                                                        next();
                                                                    }
                                                                }).then(() => {
                                                                    next();
                                                                });
                                                            } else {
                                                                next();
                                                            }
                                                        }).then(() => {
                                                            callback(false, finalResponse, 200);
                                                        });

                                                    });

                                                });
                                            });
                                        });
                                    });
                                } else {
                                    callback(true, err, -9999);
                                } //Second DB Call
                            });
                        }
                    });

                } else {
                    callback(true, err, -9999);
                } //First DB Call
            });

        }
    };

    function dayPlanCnt(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.operating_asset_phone_number,
                request.operating_asset_phone_country_code,
                util.getDayStartDatetimeTZ(request.timezone || ""), //start_datetime, TimeZone needs to be considered
                util.getDayEndDatetimeTZ(request.timezone || ""), //end_datetime,TimeZone needs to be considered
                request.sort_flag || 0, //anything can be given DB developer confirmed
                0,
                50
            );

            let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_dayplan_count_phone_number', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    function pastDueCnt(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.operating_asset_phone_number,
                request.operating_asset_phone_country_code,
                util.getCurrentUTCTime(),
                request.sort_flag || 0, //anything can be given DB developer confirmed
                0,
                50
            );

            let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_past_due_count_phone_number', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    let formatActiveAccountsCountData = function (rowArray, callback) {

        let rowData = {
            'count': rowArray['count'] || 0,
            'asset_id': util.replaceDefaultNumber(rowArray['asset_id']),
            'asset_first_name': util.replaceDefaultString(rowArray['asset_first_name']),
            'organization_id': util.replaceDefaultNumber(rowArray['organization_id']),
            'organization_name': util.replaceDefaultString(rowArray['organization_name']),
            'asset_last_name': util.replaceDefaultString(rowArray['asset_last_name']),
            'asset_image_path': util.replaceDefaultString(rowArray['asset_image_path']),
            'operating_asset_id': util.replaceDefaultNumber(rowArray['operating_asset_id']),
            'operating_asset_first_name': util.replaceDefaultString(rowArray['operating_asset_first_name']),
            'operating_asset_last_name': util.replaceDefaultString(rowArray['operating_asset_last_name']),
            'unread_count': rowArray['unread_count'] || 0,
            'day_plan_count': rowArray['day_plan_count'] || 0,
            'past_due_count': rowArray['past_due_count'] || 0
        };

        callback(false, rowData);
    };

    function updatePushToken(request, assetId) {
        return new Promise((resolve, reject) => {
            const paramsArr = [
                assetId,
                request.organization_id,
                request.asset_token_push,
                request.asset_push_arn,
                request.asset_id,
                request.datetime_log
            ];
            
            let dbCall = 'ds_v1_asset_list_update_push_token';            
            if(request.hasOwnProperty('flag_switching') && Number(request.flag_switching) === 1) {                
                dbCall = 'ds_p1_asset_list_update_push_token';
            }
            
            const queryString = util.getQueryString(dbCall, paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(false, data) : reject(true, err);
                });
            }            
        });
    };

    // Retrieve asset's monthly summary params
    this.retrieveAssetMonthlySummaryParams = function (request, callback) {
        let flag = 2;
        if (request.hasOwnProperty("flag")) {
            flag = request.flag;
        }
        // IN p_asset_id BIGINT(20), IN p_operating_asset_id BIGINT(20), 
        // IN p_organization_id BIGINT(20), IN p_flag SMALLINT(6), IN p_data_entity_date_1 DATETIME
        let paramsArr = new Array(
            request.asset_id,
            request.operating_asset_id,
            request.organization_id,
            flag, // p_flag
            request.month_start_date // p_data_entity_date_1 => YYYY-MM-DD
        );
        let queryString = util.getQueryString('ds_p1_asset_monthly_summary_transaction_select_flag', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data, 200) : callback(true, err, -9999);
            });
        }
    };

    // Retrieve asset's weekly summary params
    this.retrieveAssetWeeklySummaryParams = function (request, callback) {
        let flag = 2;
        if (request.hasOwnProperty("flag")) {
            flag = request.flag;
        }
        let paramsArr = new Array(
            request.asset_id,
            request.operating_asset_id,
            request.organization_id,
            flag, // p_flag
            request.week_start_date // p_data_entity_date_1 => YYYY-MM-DD
        );
        let queryString = util.getQueryString('ds_p1_asset_weekly_summary_transaction_select_flag', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (typeof data !== 'undefined') {
                    if (data.length > 0) {
                        (err === false) ? callback(false, data, 200) : callback(true, err, -9999);
                    } else {
                        callback(true, err, -9999);
                    }
                } else {
                    callback(true, err, -9999);
                }
            });
        }
    };

    // Service to fire everytime the app is launched.
    this.assetAppLaunchTransactionInsert = function (request, callback) {
        // IN p_asset_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_organization_id BIGINT(20), IN p_log_datetime DATETIME
        let paramsArr = new Array(
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('ds_p1_asset_app_launch_transaction_insert', paramsArr);

        if (queryString !== '') {
            db.executeQuery(0, queryString, request, async function (err, data) {
                try {
                    await assetListUpdateAppVersion(request);
                } catch (error) {
                    console.log("assetAppLaunchTransactionInsert | assetListUpdateAppVersion | Error: ", error);
                }
                try {
                    request.datetime_log = util.getCurrentUTCTime();
                    if (Array.isArray(request.track_gps_status)) {
                        request.track_gps_status = JSON.stringify(request.track_gps_status);
                    }
                    // Update the desk's location
                    await activityCommonService.updateAssetLocationPromise(request);
                    // Update the operating asset's location
                    if (request.hasOwnProperty("operating_asset_id")) {
                        await activityCommonService.updateAssetLocationPromise({
                            ...request,
                            asset_id: request.operating_asset_id
                        });
                    }
                } catch (error) {
                    console.log("assetAppLaunchTransactionInsert | activityCommonService.updateAssetLocationPromise | Error: ", error);
                }
                (err === false) ? callback(false, data, 200) : callback(true, err, -9999);
            });
        }
    }

    // Asset List Update App Version
    async function assetListUpdateAppVersion(request) {
        // IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_app_version VARCHAR(50), 
        // IN p_device_os_version VARCHAR(50),   IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME, 
        // IN p_timezone_offset BIGINT
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            request.app_version,
            request.device_os_version,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime(),
            request.timezone_offset
        );
        const queryString = util.getQueryString('ds_v1_2_asset_list_update_app_version', paramsArr);

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
        return [error, responseData];
    }

    // Service to return both weekly and monthly summary params combined.
    this.retrieveAssetWeeklyAndMonthlySummaryParams = function (request, callback) {
        const self = this;
        let responseJSON = {
            asset_id: request.asset_id,
            operating_asset_id: request.operating_asset_id,
            workforce_id: request.workforce_id,
            account_id: request.account_id,
            organization_id: request.organization_id,
            // week_start_date: request.week_start_date,
            // month_start_date: request.month_start_date,
            performance_data_weekly: { // Weekly summary params 
                week_start_date: request.week_start_date,
                response_rate: 0,
                planning_rate: 0,
                completion_rate: 0,
                office_presence_percentage: 0
            },
            performance_data_monthly: { // Monthly summary params
                month_start_date: request.month_start_date,
                response_rate: 0,
                planning_rate: 0,
                completion_rate: 0,
                office_presence_percentage: 0
            }
        };

        Promise.all([
            // Populate weekly summary params
            asyncRetrieveAssetWeeklySummaryParams(request)
                .then((data) => {
                    // Run through each of the summary entries returned
                    //console.log("data: ", data);
                    //global.logger.write('debug', "data: " + JSON.stringify(data, null, 2), {}, request);
                    util.logInfo(request,`asyncRetrieveAssetWeeklySummaryParams debug data: %j`,{data : JSON.stringify(data, null, 2), request});
                    let responseRateTotalCount = 0;
                    let responseRateOnTimeCount = 0;

                    let responseRateSum = 0;
                    let numOfResponseRateEntries = 0;
                    // Run through each of the summary entries returned
                    data.forEach((summaryEntry) => {
                        // 
                        switch (Number(summaryEntry.weekly_summary_id)) {

                            case 3: // Response Rate - InMail
                            // case 15: // Response Rate - Unread Updates
                            case 16: // Response Rate - Postits
                            case 19: // Response Rate - File Updates
                                // Include the response rate value for average calculation only if
                                // it's a non-zero positive value. Else, ignore the entry.
                                // if (Number(summaryEntry.data_entity_decimal_1) > 0) {
                                //     responseRateSum += Number(summaryEntry.data_entity_decimal_1);
                                //     numOfResponseRateEntries += 1;
                                // }

                                responseRateTotalCount += Number(summaryEntry.data_entity_bigint_1);
                                responseRateOnTimeCount += Number(summaryEntry.data_entity_decimal_3);

                                break;

                            case 17: // Timeliness of tasks - Lead
                                responseJSON.performance_data_weekly.planning_rate = summaryEntry.data_entity_decimal_1;
                                break;

                            case 5: // Completion rate - Lead
                                responseJSON.performance_data_weekly.completion_rate = summaryEntry.data_entity_decimal_1;
                                break;

                            case 18: // Office presence
                                responseJSON.performance_data_weekly.office_presence_percentage = summaryEntry.data_entity_double_1;
                                break;
                        }
                    });

                    if (responseRateTotalCount === 0) {
                        responseJSON.performance_data_weekly.response_rate = 0;
                    } else {
                        responseJSON.performance_data_weekly.response_rate = (responseRateOnTimeCount / responseRateTotalCount) * 100;
                    }
                }),

            // Populate monthly summary params
            asyncRetrieveAssetMonthlySummaryParams(request)
                .then((data) => {
                    let responseRateTotalCount = 0;
                    let responseRateOnTimeCount = 0;

                    let numOfResponseRateEntries = 0;
                    // Run through each of the summary entries returned
                    //console.log("data: ", data);
                    //global.logger.write('debug', "data: " + JSON.stringify(data, null, 2), {}, request);
                    util.logInfo(request,`asyncRetrieveAssetMonthlySummaryParams debug data: %j`,{data : JSON.stringify(data, null, 2),request});
                    data.forEach((summaryEntry) => {
                        // 
                        switch (Number(summaryEntry.monthly_summary_id)) {

                            case 10: // Response Rate - InMail
                            // case 22: // Response Rate - Unread Updates
                            case 29: // Response Rate - Postits
                            case 32: // Response Rate - File Updates
                                // Include the response rate value for average calculation only if
                                // it's a non-zero positive value. Else, ignore the entry.
                                // if (Number(summaryEntry.data_entity_decimal_1) > 0) {
                                //     responseRateSum += Number(summaryEntry.data_entity_decimal_1);
                                //     numOfResponseRateEntries += 1;
                                // }
                                responseRateTotalCount += Number(summaryEntry.data_entity_bigint_1);
                                responseRateOnTimeCount += Number(summaryEntry.data_entity_decimal_3);

                                break;

                            case 30: // Timeliness of tasks - Lead
                                responseJSON.performance_data_monthly.planning_rate = summaryEntry.data_entity_decimal_1;
                                break;

                            case 12: // Completion rate - Lead
                                responseJSON.performance_data_monthly.completion_rate = summaryEntry.data_entity_decimal_1;
                                break;

                            case 31: // Office presence
                                responseJSON.performance_data_monthly.office_presence_percentage = summaryEntry.data_entity_double_1;
                                break;
                        }
                    });

                    if (responseRateTotalCount === 0) {
                        responseJSON.performance_data_monthly.response_rate = 0;
                    } else {
                        responseJSON.performance_data_monthly.response_rate = (responseRateOnTimeCount / responseRateTotalCount) * 100;
                    }

                })
        ])
            .then(() => {
                callback(false, responseJSON, 200)
                return;
            })
            .catch((err) => {
                callback(true, err, -9999)
                return;
            })

    };

    // [Asynchronously] Retrieve asset's weekly summary params
    function asyncRetrieveAssetWeeklySummaryParams(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.asset_id,
                request.operating_asset_id,
                request.organization_id,
                2, // p_flag
                request.week_start_date // p_data_entity_date_1 => YYYY-MM-DD
            );
            let queryString = util.getQueryString('ds_p1_asset_weekly_summary_transaction_select_flag', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (!err) ? resolve(data) : reject(err);
                });
            }
        });
    };

    // [Asynchronously] Retrieve asset's monthly summary params
    function asyncRetrieveAssetMonthlySummaryParams(request) {
        return new Promise((resolve, reject) => {
            // IN p_asset_id BIGINT(20), IN p_operating_asset_id BIGINT(20), 
            // IN p_organization_id BIGINT(20), IN p_flag SMALLINT(6), IN p_data_entity_date_1 DATETIME
            let paramsArr = new Array(
                request.asset_id,
                request.operating_asset_id,
                request.organization_id,
                2, // p_flag
                request.month_start_date // p_data_entity_date_1 => YYYY-MM-DD
            );
            let queryString = util.getQueryString('ds_p1_asset_monthly_summary_transaction_select_flag', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (!err) ? resolve(data) : reject(err);
                });
            }
        });
    };

    // Set default module for asset. Once set, the user is taken to the 
    // set module by default, instead of to the desk.
    this.setDefaultModuleForAsset = function (request, callback) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20), 
        // IN p_default_module_id SMALLINT(6), IN p_log_datetime DATETIME, 
        // IN p_log_asset_id BIGINT(20)

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.default_module_id,
            request.default_module_lock_enable,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_1_asset_list_update_default_module', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err) ? callback(true, err, -9999) : callback(false, data, 200);
            });
        }
    };

    this.checkPamAssetPasscode = function (request, callback) {

        let phoneNumber = util.cleanPhoneNumber(request.asset_phone_number);
        let phoneCountryCode = util.cleanPhoneNumber(request.asset_phone_country_code);
        let verificationCode = util.cleanPhoneNumber(request.verification_passcode);
        let verificationType = Number(request.verification_method);

        let paramsArr = new Array();
        let queryString = "";

        if (request.hasOwnProperty('member_code')) {

            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.member_code
            );
            queryString = util.getQueryString('ds_v1_asset_list_passcode_check_member', paramsArr);

        } else {
            let paramsArr = new Array(
                request.organization_id,
                request.asset_phone_number,
                request.asset_phone_country_code
            );

            queryString = util.getQueryString('pm_v1_asset_list_select_member_phone_number', paramsArr);
        }

        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    if (data.length > 0) {
                        if (verificationCode == data[0].asset_email_password) {
                            callback(false, data, 200);
                        } else {
                            callback(false, { "Error": "OTP Mismatch" }, -3107);
                        }
                    } else {
                        callback(false, { "Error": "Member Code or Phone Number Not Valid" }, -3202);
                    }
                } else {
                    callback(false, { "Error": "DB Error" }, -9998);
                }
            });
        }

    };


    this.getPamMemberPhoneNumberAsset = function (request, callback) {

        let phoneNumber = util.cleanPhoneNumber(request.asset_phone_number);
        let countryCode = util.cleanPhoneNumber(request.asset_phone_country_code);
        let emailId = request.asset_email_id;
        let verificationMethod = Number(request.verification_method);
        let organizationId = request.organization_id;

        let queryString = '';

        if (request.hasOwnProperty('member_code')) {

            let paramsArr = new Array(
                organizationId,
                request.account_id,
                request.member_code
            );
            queryString = util.getQueryString('ds_v1_asset_list_passcode_check_member', paramsArr);

        } else {
            console.log('phoneNumber: ' + phoneNumber);
            console.log('countryCode: ' + countryCode);
            let paramsArr = new Array(
                organizationId,
                phoneNumber,
                countryCode
            );
            queryString = util.getQueryString('pm_v1_asset_list_select_member_phone_number', paramsArr);
        }


        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, selectData) {
                if (err === false) {
                    let verificationCode;
                    verificationCode = util.getVerificationCode();
                    if (selectData.length > 0) {
                        paramsArr = new Array(
                            selectData[0].organization_id,
                            selectData[0].account_id,
                            selectData[0].asset_id,
                            verificationCode,
                            11031,
                            util.getCurrentUTCTime()
                        );
                        let updateQueryString = util.getQueryString('ds_v1_asset_list_update_pam_member_otp', paramsArr);
                        db.executeQuery(0, updateQueryString, request, function (err, data) {
                            assetListHistoryInsert(request, selectData[0].asset_id, selectData[0].organization_id, 208, util.getCurrentUTCTime(), function (err, data) {

                            });
                        });
                        let text = `OTP ${verificationCode} is for your member code validation at Pudding & Mink. Valid only for 30mins. Do not share OTP for security reasons -GreneOS`;
                        self.sendSms(selectData[0].asset_phone_country_code,selectData[0].asset_phone_number,encodeURIComponent(text));
                        //sendCallOrSms(verificationMethod, selectData[0].asset_phone_country_code, selectData[0].asset_phone_number, verificationCode, request);
                        callback(err, true, 200);
                    } else {
                        callback(err, false, -9997);
                    }
                } else {
                    // some thing is wrong and have to be dealt                        
                    callback(err, false, -9999);
                }
            });
        } else {
            callback(false, {}, -3101);
        }
    };


    this.getAssetTimelineData = async (request) => {
        let paramsArr = new Array(
            request.organization_id,
            request.workforce_id,
            request.asset_id,
            request.stream_type_id || 0,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_p1_asset_timeline_transaction_select_asset_stream_type', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    this.geAssetGeoFenceCounts = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.flag,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_geofence_count', paramsArr);
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

    this.queueAccessListSelectAsset = async (request) => {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20), 
        // IN p_flag TINYINT(4), IN p_start_from BIGINT(20), IN p_limit_value TINYINT(4)
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.flag,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_p1_queue_access_list_select_asset', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    this.assetListSelectFlag = async function (request) {
        let responseData = [],
            error = true;

        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_type_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_flag SMALLINT(6), IN p_sort_flag TINYINT(4), 
        // IN p_start_from INT(11), IN p_limit_value TINYINT(4)

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_type_id,
            request.workforce_id,
            request.flag,
            request.sort_flag,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_flag', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    let zerothElement = Object.assign({}, data[0]);
                    zerothElement.asset_id = 0;
                    zerothElement.operating_asset_first_name = "All";
                    data.unshift(zerothElement);
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    };

    this.workforceActivityTypeMappingSelectFlag = async function (request) {
        let responseData = [],
            error = true;

        // IN p_organization_id bigint(20), IN p_account_id bigint(20), 
        // IN p_workforce_id bigint(20), IN p_activity_type_category_id SMALLINT(6), 
        // IN p_flag SMALLINT(6), IN p_sort_flag SMALLINT(6), 
        // IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.flag,
            request.sort_flag,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_select_flag', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = append0thActivityTypeId(data);
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    };

    function append0thActivityTypeId(data) {
        let zerothElement = Object.assign({}, data[0]);
        zerothElement.activity_type_id = 0;
        zerothElement.activity_type_name = "All";
        //console.log(zerothElement);
        //data.push(zerothElement);
        data.unshift(zerothElement);
        return data;
    }

    this.assetAccessMappingSelectUserFlag = function (request) {
        return new Promise((resolve, reject) => {
            let responseData = [];
            let singleData = {};

            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.workforce_type_id || 0,
                request.target_asset_id,
                request.tag_type_id || 0,
                request.tag_id || 0,
                request.flag || 1,
                request.page_start || 0,
                request.page_limit || 50
            );
            const queryString = util.getQueryString('ds_p1_asset_access_mapping_select_user_flag', paramsArr);
            if (queryString !== '') {
                db.executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        //responseData = data;
                        error = false;
                        console.log("DATA LENGTH ", data.length);
                        if (request.flag == 2) {
                            if (data.length == 0) {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);

                            } else if (data.length == 1) {

                                if (data[0].account_id == 0) {

                                    accountListSelect(request).then((resData) => {
                                        singleData.query_status = 0;
                                        singleData.account_id = 0;
                                        singleData.account_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 19) {
                            if (data.length == 0) {
                                if (request.account_id > 0) {
                                    let paramsArrInter = new Array(
                                        request.organization_id,
                                        0,
                                        request.workforce_id,
                                        request.workforce_type_id || 0,
                                        request.target_asset_id,
                                        request.tag_type_id || 0,
                                        request.tag_id || 0,
                                        request.flag || 1,
                                        request.page_start || 0,
                                        request.page_limit || 50
                                    );
                                    let queryStringInter = util.getQueryString('ds_p1_asset_access_mapping_select_user_flag', paramsArrInter);
                                    if (queryStringInter !== '') {
                                        db.executeQueryPromise(1, queryStringInter, request)
                                            .then((IntermediateData) => {

                                                if (IntermediateData.length == 1) {

                                                    if (IntermediateData[0].workforce_type_id == 0) {

                                                        workforceTypeMasterSelect(request).then((resData) => {

                                                            singleData.query_status = 0;
                                                            singleData.workforce_type_id = 0;
                                                            singleData.workforce_type_name = "All";

                                                            resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                                            responseData[0] = "";
                                                            responseData[1] = resData;
                                                            //console.log("responseData ", responseData);
                                                            resolve(responseData);

                                                        });
                                                    } else {
                                                        responseData[0] = "";
                                                        responseData[1] = IntermediateData;
                                                        resolve(responseData);
                                                    }
                                                } else {
                                                    responseData[0] = "";
                                                    responseData[1] = IntermediateData;
                                                    resolve(responseData);
                                                }
                                            })

                                    } else {
                                        responseData[0] = "";
                                        responseData[1] = data;
                                        resolve(responseData);
                                    }
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }

                            } else if (data.length == 1) {
                                if (data[0].workforce_type_id == 0) {

                                    workforceTypeMasterSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.workforce_type_id = 0;
                                        singleData.workforce_type_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 6) {

                            if (data.length == 0) {
                                if (request.account_id == 0) {
                                    singleData.query_status = 0;
                                    singleData.asset_id = 0;
                                    singleData.asset_first_name = "All";
                                    singleData.operating_asset_id = 0;
                                    singleData.operating_asset_first_name = "All";

                                    responseData[0] = "";
                                    responseData[1] = singleData;
                                    resolve(responseData);
                                } else {
                                    assetListSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.asset_id = 0;
                                        singleData.asset_first_name = "All";
                                        singleData.operating_asset_id = 0;
                                        singleData.operating_asset_first_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                }
                            } else if (data.length == 1) {
                                console.log("CASE 6, DATA LENGTH 1, request.account_id :: ", request.account_id + ' ' + data[0].asset_id);
                                if (request.account_id == 0) {
                                    console.log("CASE 6, DATA LENGTH 1, request.account_id = 0 :: ", request.account_id + ' ' + data[0].asset_id);
                                    singleData.query_status = 0;
                                    singleData.asset_id = 0;
                                    singleData.asset_first_name = "All";
                                    singleData.operating_asset_id = 0;
                                    singleData.operating_asset_first_name = "All";

                                    responseData[0] = "";
                                    responseData[1] = singleData;
                                    resolve(responseData);

                                } else {
                                    console.log("CASE 6, DATA LENGTH 1, request.account_id > 0:: ", request.account_id + ' ' + data[0].asset_id);
                                    if (data[0].asset_id == 0) {
                                        assetListSelect(request).then((resData) => {

                                            singleData.query_status = 0;
                                            singleData.asset_id = 0;
                                            singleData.asset_first_name = "All";
                                            singleData.operating_asset_id = 0;
                                            singleData.operating_asset_first_name = "All";

                                            resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                            responseData[0] = "";
                                            responseData[1] = resData;
                                            //console.log("responseData ", responseData);
                                            resolve(responseData);

                                        });
                                    } else {
                                        console.log('CASE 6, DATA LENGTH 1, request.account_id > 0 data[0].asset_id > 0 :: ', +' ' + JSON.stringify(data));
                                        responseData[0] = "";
                                        responseData[1] = data;
                                        console.log('CASE 6, DATA LENGTH 1, request.account_id > 0 data[0].asset_id > 0 responseData :: ', +' ' + JSON.stringify(responseData));
                                        resolve(responseData);
                                    }
                                }

                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 20) {
                            if (data.length == 0) {
                                tagTypeMasterSelect(request).then((resData) => {
                                    /*
                                                                        singleData.query_status = 0;
                                                                        singleData.tag_type_id = 0;
                                                                        singleData.tag_type_name = "All";
                                                                           
                                                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                                                         */
                                    responseData[0] = "";
                                    responseData[1] = resData;
                                    //console.log("responseData ", responseData);
                                    resolve(responseData);
                                });
                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 21) {
                            console.log('CASE 21 request.tag_type_id :: ', +' ' + request.tag_type_id);
                            if (data.length == 0) {
                                console.log('CASE 21, request.tag_type_id DATA LENGTH 0, :: ');
                                tagListSelect(request).then((resData) => {

                                    singleData.query_status = 0;
                                    singleData.tag_id = 0;
                                    singleData.tag_name = "All";

                                    resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                    responseData[0] = "";
                                    responseData[1] = resData;
                                    //console.log("responseData ", responseData);
                                    resolve(responseData);
                                });

                            } else {
                                if (data[0].tag_id == 0) {

                                    tagListSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.tag_id = 0;
                                        singleData.tag_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            }
                        } else if (request.flag == 8) {
                            if (data.length == 0) {
                                activityTypeTagMappingSelect(request).then((resData) => {

                                    singleData.query_status = 0;
                                    singleData.activity_type_id = 0;
                                    singleData.activity_type_name = "All";

                                    resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                    responseData[0] = "";
                                    responseData[1] = resData;
                                    //console.log("responseData ", responseData);
                                    resolve(responseData);

                                });
                            } else {
                                if (data[0].activity_type_id == 0) {

                                    activityTypeTagMappingSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.activity_type_id = 0;
                                        singleData.activity_type_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            }
                        } else {
                            responseData[0] = "";
                            responseData[1] = data;
                            resolve(responseData);
                        }

                    })
                    .catch((err) => {
                        error = err;
                    });
            }
        });
    };

    function accountListSelect(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.page_start,
                request.page_limit
            );

            let queryString = util.getQueryString('ds_p1_account_list_select_organization', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    function workforceTypeMasterSelect(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.page_start,
                request.page_limit
            );

            let queryString = util.getQueryString('ds_p1_workforce_type_master_select_organization', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    function assetListSelect(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_type_id,
                request.workforce_id,
                request._flag || 0,
                request.sort_flag || 0,
                0,
                1000
            );

            let queryString = util.getQueryString('ds_p1_asset_list_select_flag', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    function tagTypeMasterSelect(request) {
        return new Promise((resolve, reject) => {
            const paramsArr = new Array(
                request.organization_id,
                request.page_start,
                request.page_limit
            );

            //var queryString = util.getQueryString('ds_p1_tag_type_master_select', paramsArr);
            const queryString = util.getQueryString('ds_p1_tag_type_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    function tagListSelect(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.page_start,
                request.page_limit
            );

            let queryString = util.getQueryString('ds_p1_tag_list_select_organization', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    async function activityTypeTagMappingSelect(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.tag_type_id,
                request.tag_id,
                // request._flag || 0,
                // request.sort_flag || 0,
                request.page_start,
                request.page_limit
            );

            let queryString = util.getQueryString('ds_p1_activity_type_tag_mapping_select_flag', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    this.processExcel = async function (request) {

        const [errOne, workbook] = await util.getXlsxWorkbookFromS3Url(request, request.bucket_url);
        const sheet_name_list = workbook.SheetNames;
        console.log("EXCEL WORKBOOK :: " + sheet_name_list);

        if(sheet_name_list.length > 0) {
            if(sheet_name_list[0] !== 'Sheet1') {
                return ["error", "Unable to find the sheet with name Sheet1 in the excel sheet. please check and resubmit"];
            }
        }

        console.log('xlData :: ' + workbook.Sheets[sheet_name_list[0]]);
        let xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        console.log('xlData :: ' + xlData.length);
        //console.log('xlData :: ' + JSON.stringify(xlData));


        if(xlData.length == 0){
            return ["error", "The CAF annexure is not filled in the required format,   please check and resubmit"];
        }

        for(let row of xlData) {
           if(!row.hasOwnProperty('One Time Charges (Rs.)')
             || !row.hasOwnProperty('Existing Recurring Charges (Rs.)') || !row.hasOwnProperty('Recurring Charges (Rs.)')) {
               return ["error", "The CAF annexure is not filled in the required format, please check and resubmit"];
           }
        }
        
        for (let row = 2; row <= (xlData.length+1); row++) {
            //console.log('row ',row);
            for (const col of 'EFG') {
                //console.log('col ',col);
                try {
                    let val = workbook.Sheets[sheet_name_list[0]][`${col}${row}`].t;
                    //console.log('value :: ',workbook.Sheets[sheet_name_list[0]][`${col}${row}`]);
                    console.log('is number :: ',val);
                    if (val === 'n') {
                        console.log(col + "" + row + " : " + workbook.Sheets[sheet_name_list[0]][`${col}${row}`].v);
                    } else {
                        console.log("Not a Number at " + col + "" + row + " : " + workbook.Sheets[sheet_name_list[0]][`${col}${row}`].v);
                        return ["error", "The CAF annexure is not filled in the required format, please check and resubmit"];
                    }
                } catch (error) {
                    return [error, "The CAF annexure is not filled in the required format, please check and resubmit."];
                }
            }
        }
        
        let mandatoryPositionsOfColumns = {
            "C1" : "Feasibility ID",
            "D1" : "Bandwidth (Mbps)",
            "E1" : "One Time Charges (Rs.)",
            "G1" : "Recurring Charges (Rs.)",
            "F1" : "Existing Recurring Charges (Rs.)"
        }
        
        for (let column of Object.keys(mandatoryPositionsOfColumns)) {
            if (mandatoryPositionsOfColumns[column] !== workbook.Sheets[sheet_name_list[0]][column].v) {
                console.log("Columns are not in required order.Please correct it and upload again.");
                return ["error", "Columns are not in required order.Please correct it and upload again."];
            }
        }

        for (let row of xlData) {
            if (isNaN(Number(row['One Time Charges (Rs.)'])) || isNaN(Number(row['Existing Recurring Charges (Rs.)'])) || isNaN(Number(row['Recurring Charges (Rs.)']))) {
                return ["error", "The CAF annexure is filled invalid data format, please check and resubmit"];
            }
        }

        console.log('No Strings in Excel :: ' + xlData.length);
        return ["", "Annexure is Valid"];
    };
    
    this.searchAssetRef = async (request) => {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_type_category_id,            
            request.search_string,            
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_p1_asset_list_search_asset_reference', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    //Update the Asset Type
    /*this.updateAssetType = async (request) => {
    //async function updateAssetType(request){
        const paramsArr = new Array(
            request.asset_id,
            request.asset_type_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_asset_type', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));
        }
    }

    //Update the Asset's Manager Data
    this.updateAssetsManagerDetails = async (request) => {
    //async function updateAssetsManagerDetails(request){
        const paramsArr = new Array(
            request.asset_id,
            request.manager_asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_manager', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));
        }
    }*/

    this.assetWFExposureMatrix = async (request) => {
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.flag || 0,
            request.summary_id  || 0,
            request.start_datetime,
            request.end_datetime,
            request.activity_type_id  || 0,
            request.activity_type_tag_id  || 0,
            request.tag_type_id  || 0,
            request.workforce_type_id || 0,
            request.activity_status_type_id || 0,
            request.start_from  || 0,
            request.limit_val || 50
        );
        const queryString = util.getQueryString('ds_v1_asset_summary_transaction_select', paramsArr);

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
    }

    // Monthly Response Rate
    this.retrieveAssetMonthlySummaryResponseRate = async function (request, summaryID) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        const monthStartDate = util.getStartDateTimeOfMonth(),
            monthEndDate = util.getEndDateTimeOfMonth();
        // startDate = util.getStartDateTimeOfWeek();
        // endDate = util.getEndDateTimeOfWeek();
        const [error, responseData] = await assetMonthlySummaryTransactionSelect({
            ...request,
            monthly_summary_id: request.monthly_summary_id || summaryID,
            data_entity_date_1: monthStartDate
        }, organizationID, accountID, workforceID);
        if (error) {
            return [error, { message: "Error retrieving asset's monthly response rate summary" }];
        }
        return [error, responseData];
    }

    async function assetMonthlySummaryTransactionSelect(request, organizationID, accountID, workforceID) {

        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.operating_asset_id,
            organizationID,
            request.monthly_summary_id,
            request.data_entity_date_1
        );
        const queryString = util.getQueryString('ds_p1_asset_monthly_summary_transaction_select', paramsArr);

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
    }

    // Weekly Response Rate
    this.retrieveAssetWeeklySummaryResponseRate = async function (request, summaryID) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        const weekStartDate = util.getStartDateTimeOfWeek(),
            weekEndDate = util.getEndDateTimeOfWeek();
        const [error, responseData] = await assetWeeklySummaryTransactionSelect({
            ...request,
            weekly_summary_id: summaryID,
            data_entity_date_1: weekStartDate
        }, organizationID, accountID, workforceID);
        if (error) {
            return [error, { message: "Error retrieving asset's weekly response rate summary" }];
        }
        return [error, responseData];
    }

    async function assetWeeklySummaryTransactionSelect(request, organizationID, accountID, workforceID) {

        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.operating_asset_id,
            organizationID,
            request.weekly_summary_id,
            request.data_entity_date_1
        );
        const queryString = util.getQueryString('ds_p1_asset_weekly_summary_transaction_select', paramsArr);

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
    }

this.getQrBarcodeFeeback = async(request) => {
    let responseData = [],
        error = true;

    /*const paramsArr = new Array(
        request.asset_id,
        request.operating_asset_id,
        organizationID,
        request.weekly_summary_id,
        request.data_entity_date_1
    );
    const queryString = util.getQueryString('ds_p1_asset_weekly_summary_transaction_select', paramsArr);

    if (queryString !== '') {
        await db.executeQueryPromise(1, queryString, request)
            .then((data) => {
                responseData = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            });
    }*/
    let resp = {
        "scanned_content" : request.scanned_content,
        //"message": "Successfully scanned!"
        "message": "Invalid scan!"
    }

    responseData.push(resp);
    
    return [false, resp];
}

    this.assetAvailableUpdate = async (request) => {
        let responseData = {},
            error = true;
        request.global_array = [];
        /*
        request.ai_bot_trigger_key = "asset_"+request.target_asset_id;
        request.ai_bot_trigger_asset_id = request.target_asset_id;
        request.ai_bot_trigger_activity_id = 0;
        request.ai_bot_trigger_activity_status_id = 0;

        
        request.global_array.push({"asset_available_set_":request.target_asset_id+" "+JSON.stringify(request, null, 2)});
        */
        const paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
            request.available_flag,
            request.available_till_datetime,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_1_asset_list_update_available', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                /*
                    let ai_bot_transaction_id = 0;

                    request.ai_trace_insert_location = "assetAvailableUpdate, AFTER SETTING THE RESOURCE TO AVAILBALE";
                    let [errAI, responseDataAI] = await rmbotService.AIEventTransactionInsert(request);
                    if(responseDataAI.length > 0){
                        request.ai_bot_transaction_id = responseDataAI[0].ai_bot_transaction_id;
                    }
                    request.global_array.push({"assetAvailableUpdate":"AIEventTransactionInsert, idTransaction "+request.ai_bot_transaction_id})
                    if(responseData.length > 0){
                        if(responseData[0].organization_ai_bot_enabled == 1){
                            if(request.available_flag == 1){
                                //call the trigger service
                                request.lead_asset_type_id = responseData[0].asset_type_id;
                                request.res_account_id = responseData[0].account_id;
                                request.res_workforce_id = responseData[0].workforce_id;
                                request.res_asset_type_id = responseData[0].asset_type_id;
                                request.res_asset_id = responseData[0].asset_id;
                                request.res_asset_category_id = responseData[0].asset_type_category_id;
                                request.target_asset_id = responseData[0].asset_id;
                                request.target_asset_name = responseData[0].asset_first_name;
                                request.target_operating_asset_id = responseData[0].operating_asset_id;
                                request.target_operating_asset_name = responseData[0].operating_asset_first_name;
                                request.global_array.push({"assetAvailableUpdate":"Hitting the resource pool (RMLoopInResoources)"});
                                rmbotService.RMLoopInResoources(request);
                            }else{
                                logger.info("assetAvailableUpdate :: AVAILABLE FLAG NOT SET FOR THIS ASSET");
                                request.global_array.push({"assetAvailableUpdate":"AVAILABLE FLAG NOT SET FOR THIS ASSET, aiTransactionId"+request.ai_bot_transaction_id})
                                rmbotService.AIEventTransactionInsert(request);                                 
                            }
                        }else{
                            logger.info("assetAvailableUpdate :: AI NOT ENABLED FOR THIS ORGANIZATION");
                            request.global_array.push({"assetAvailableUpdate":"AI NOT ENABLED FOR THIS ORGANIZATION, aiTransactionId"+request.ai_bot_transaction_id})
                            //rmbotService.AIEventTransactionInsert(request);                            
                        }
                    }else{
                        logger.info("assetAvailableUpdate :: RESOURCE IS NOT ACTIVE");
                        request.global_array.push({"assetAvailableUpdate":"RESOURCE IS NOT ACTIVE, aiTransactionId"+request.ai_bot_transaction_id})
                        rmbotService.AIEventTransactionInsert(request);
                    } */
                })
                .catch((err) => {
                    error = err;
                   // request.global_array.push({"assetAvailableUpdaten Exception":error})
                   // rmbotService.AIEventTransactionInsert(request);                    
                });
        }
        return [error, responseData];
    }    


    //OpenTok
    this.openTokGetSessionData = async (request) => {
        let responseData = {},
            error = false;

        //if a room name is already associated with a session ID
        let [err, sessionData] = await getSessionID(request);
        if(err) {
            return [true, "Unable to retrive the session data"];
        }
        console.log('Retrieved sessionData : ', sessionData);
        if(sessionData.length > 0) {
            // fetch the sessionId from local storage
            // generate token
            let sessionID = sessionData[0].video_call_session_id;
            let token = opentok.generateToken(sessionID);
            responseData = {
                "apiKey": global.config.opentok_apiKey,
                "sessionId": sessionID,
                "token": token
            }
        } else {
            //Create Session ID
            // store the sessionId into local
            // generate token
            await new Promise((resolve, reject)=>{
                opentok.createSession({mediaMode:"routed"}, (err, session)=>{
                    if (err){
                        console.log(err);
                        error = true;
                        resolve();
                    } 
                    request.session_id = session.sessionId;
                    saveSessionID(request);
            
                    let token = session.generateToken();
                    responseData = {
                        "apiKey": global.config.opentok_apiKey,
                        "sessionId": session.sessionId,
                        "token": token
                    }
                    resolve();
                });
            });            
        }
        
        return [error, responseData];
    };

    //Store room id against session id
    async function saveSessionID(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.from_asset_id,
            request.to_asset_id,
            request.room_id,
            request.session_id,
            request.inline_data || '{}',
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_asset_video_call_transaction_insert', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
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

    //Get the session id associated with a room_id
    async function getSessionID(request){
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.room_id
        );

        const queryString = util.getQueryString('ds_p1_asset_video_call_transaction_select_room', paramsArr);
        if (queryString != '') {
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
    }


     this.generateEmailPasscode = async function(request){
        let responseData = [],
            error = true;

        let verificationCode = util.getVerificationCode();
        //request.asset_full_name = request.asset_full_name?request.asset_full_name:"";
        let paramsArr = new Array(
            request.email_id,
            verificationCode,
            util.getCurrentUTCTime(),
            moment().utc().add(24, 'hours').format('YYYY-MM-DD HH:mm:ss'), // util.getCurrentUTCTime(),
            util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('ds_v1_email_passcode_transaction_insert', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;

                //send email
                request.email_receiver_name="";
                request.email_sender_name="greneOS";
                //request.email_id = request.email_id;
                request.email_sender="support@greneos.com";
                request.subject = "DESKER OTP";
                request.body = "Hi, <br/> Desker signup verification code is "+verificationCode+".";
                let self = this;
                self.sendEmail(request);

            })
            .catch((err) => {
                error = err;
            });  
        }
        return[error, responseData];
    } 

    this.sendEmail = async function (request) {
        
        //global.logger.write('conLog', "\x1b[35m [Log] Inside SendEmail \x1b[0m", {}, {});
        util.logInfo(request,`conLog \x1b[35m [Log] Inside SendEmail \x1b[0m `,{request});
        const emailSubject = request.subject;
        const Template = request.body;

        //request.email_sender = 'OMT.IN1@vodafoneidea.com'; 
        //request.email_sender_name = 'Vodafoneidea';

        //global.logger.write('conLog', emailSubject, {}, {});
        util.logInfo(request,`sendEmail conLog  %j`,{emailSubject, request});
        //global.logger.write('conLog', Template, {}, {});
        util.logInfo(request,`sendEmail conLog  %j`,{Template, request});

        util.sendEmailV3(request,
            request.email_id,
            emailSubject,
            "IGNORE",
            Template,
            (err, data) => {
                if (err) {
                    //global.logger.write('conLog', "[Send Email On Form Submission | Error]: ", {}, {});
                    util.logError(request,`sendEmailV3 conLog [Send Email On Form Submission | Error]: %j`, { err, request });
                    //global.logger.write('conLog', err, {}, {});
                } else {
                    //global.logger.write('conLog', "[Send Email On Form Submission | Response]: " + "Email Sent", {}, {});
                    util.logInfo(request,`sendEmailV3 conLog [Send Email On Form Submission | Response]: Email Sent %j`,{data, request});
                    //global.logger.write('conLog', data, {}, {});
                }

               return "Email Sent";
            });
       
    }

    this.verifyEmailSignup = async function (request){
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.email_id,
        );

        const queryString = util.getQueryString('ds_v1_email_passcode_transaction_select', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    
                    if(data.length == 1){
                        if(data[0].email_passcode == request.passcode){
                            responseData.code = 200;
                            responseData.message = "passcode matched";
                            error = false;
                            console.log("::::::::::::::::::: PASSCODE MATCHED :::::::::::::::::::");
                        }else{
                            responseData.code = -3202;
                            responseData.message = "passcode doesn't match";
                            error = true;
                            console.log("::::::::::::::::::: PASSCODE DOESN'T MATCHED :::::::::::::::::::");
                        }
                    }else{
                        responseData.code = -3210;
                        responseData.message = "no entry exists with this emailid";
                        error = true;
                        console.log("::::::::::::::::::: NO ENTRY EXISTS WITH THIS EMAILID :::::::::::::::::::");
                    }

                })
                .catch((err) => {
                    error = err;
                     console.log("Error :: verifyEmailSignup ",err);
                });            
        }

        return [error, responseData];
    }

    this.callPushService = async function(request){

        let error = false,
             responseData = [];
        let assetName = "";

        if(request.hasOwnProperty("operating_asset_first_name")){
            assetName = request.operating_asset_first_name;
        }else{
            let [err, assetData] = await activityCommonService.getAssetDetailsAsync(request); // source for 1 and 2
            if(assetData.length > 0){
                assetName = assetData[0].operating_asset_first_name;
            }
        }
        
        if(assetName != ""){

            request.target_workforce_id = request.workforce_id;
            request.activity_id = 0;
            if(request.swipe_type_id == 1){

                request.push_title = "Logged In";
                request.push_message = assetName+" has logged in";

            }else if(request.swipe_type_id == 2){

                request.push_title = "Logged Out";
                request.push_message = assetName+" has logged out";

            }else if(request.swipe_type_id == 3){

                request.push_title = "Chai";
                request.push_message = assetName+" and "+request.target_operating_asset_first_name+" connected for chai";

            }else if(request.swipe_type_id == 4){

                request.push_title = "DND Removed";
                request.push_message = "DND removed on "+assetName;
                
            }else if(request.swipe_type_id == 5){

                request.push_title = "Chat Inititated";
                request.push_message = "Chat Inititated between "+assetName+" and "+request.target_operating_asset_first_name;
            }  

            activityCommonService.sendPushToWorkforceAssets(request);
        }

        return [error, responseData];
    }

    this.getAssetUsingPhoneNumber = async function (request) {

        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.asset_phone_number,
            request.country_code
        );
        const queryString = util.getQueryString('ds_v1_asset_list_select_phone_number_last_seen', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    
                    if(data.length > 0){

                        responseData = data;
                        error = false;

                    }else{
                        console.log("data.length "+data.length);
                        const rowData = {
                            'query_status': -1,
                            'asset_id': 0,
                            'organization_id': 4,
                            'organization_type_id': 5,
                            'organization_type_category_id': 2,
                            'account_id': 5,
                            'workforce_id': 6,
                            'employee_activity_type_id': 53,
                            'desk_activity_type_id': 54,
                            'employee_asset_type_id': 34,
                            'desk_asset_type_id':35
                        };
                        responseData[0] = rowData;
                        error = false;
                    }
                    console.log("data.length "+responseData.length);
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    }    

    this.assetListSelectCommonPool = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.is_search,
            request.search_string,
            request.page_start || 0,
            request.page_limit || 50
        );
        const queryString = util.getQueryString('ds_v1_asset_list_select_common_pool', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.getAssetDetailsExclusions = async (request) =>{
        let assetData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id || 0,
            request.workforce_id || 0,
            request.asset_id,
            request.is_allow_org_category || 1,
            request.is_allow_common_floor || 1
        );
        const queryString = util.getQueryString('ds_v1_asset_list_select_exclusions', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    assetData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, assetData];
    };

    this.getAssetMessageCounter = async(request)=> {
        return await cacheWrapper.getAssetParityPromise(Number(request.asset_id));
    };


    this.assetAccessLevelMappingSelectFlag = function (request) {
        return new Promise((resolve, reject) => {
            let responseData = [];
            let singleData = {};

            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.segment_id || 0,
                request.target_asset_id,
                request.tag_type_id || 0,
                request.tag_id || 0,
                request.flag || 1,
                request.page_start || 0,
                request.page_limit || 50
            );
            const queryString = util.getQueryString('ds_p1_asset_access_level_mapping_select_flag', paramsArr);
            if (queryString !== '') {
                db.executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        //responseData = data;
                        error = false;
                        console.log("DATA LENGTH ", data.length);
                        if (request.flag == 2) {
                            if (data.length == 0) {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);

                            } else if (data.length == 1) {

                                if (data[0].account_id == 0) {

                                    accountListSelect(request).then((resData) => {
                                        singleData.query_status = 0;
                                        singleData.account_id = 0;
                                        singleData.account_name = "National";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 21) {
                            if (data.length == 0) {
                                if (request.account_id > 0) {
                                    let paramsArrInter = new Array(
                                        request.organization_id,
                                        0,
                                        request.workforce_id,
                                        request.segment_id || 0,
                                        request.target_asset_id,
                                        request.tag_type_id || 0,
                                        request.tag_id || 0,
                                        request.flag || 1,
                                        request.page_start || 0,
                                        request.page_limit || 50
                                    );
                                    let queryStringInter = util.getQueryString('ds_p1_asset_access_level_mapping_select_flag', paramsArrInter);
                                    if (queryStringInter !== '') {
                                        db.executeQueryPromise(1, queryStringInter, request)
                                            .then((IntermediateData) => {

                                                if (IntermediateData.length == 1) {

                                                    if (IntermediateData[0].tag_id == 0) {
                                                        
                                                        tagListOfTagTypeSelect(request).then((resData) => {

                                                            singleData.query_status = 0;
                                                            singleData.tag_id = 0;
                                                            singleData.tag_name = "All";

                                                            resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                                            responseData[0] = "";
                                                            responseData[1] = resData;
                                                            //console.log("responseData ", responseData);
                                                            resolve(responseData);

                                                        });
                                                    } else {
                                                        responseData[0] = "";
                                                        responseData[1] = IntermediateData;
                                                        resolve(responseData);
                                                    }
                                                } else {
                                                    responseData[0] = "";
                                                    responseData[1] = IntermediateData;
                                                    resolve(responseData);
                                                }
                                            })

                                    } else {
                                        responseData[0] = "";
                                        responseData[1] = data;
                                        resolve(responseData);
                                    }
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }

                            } else if (data.length == 1) {
                                if (data[0].tag_id == 0) {
                                    
                                    tagListOfTagTypeSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.tag_id = 0;
                                        singleData.tag_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 6) {

                            if (data.length == 0) {
                                if (request.account_id == 0) {
                                    singleData.query_status = 0;
                                    singleData.asset_id = 0;
                                    singleData.asset_first_name = "All";
                                    singleData.operating_asset_id = 0;
                                    singleData.operating_asset_first_name = "All";

                                    responseData[0] = "";
                                    responseData[1] = singleData;
                                    resolve(responseData);
                                } else {
                                    assetListSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.asset_id = 0;
                                        singleData.asset_first_name = "All";
                                        singleData.operating_asset_id = 0;
                                        singleData.operating_asset_first_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                }
                            } else if (data.length == 1) {
                                console.log("CASE 6, DATA LENGTH 1, request.account_id :: ", request.account_id + ' ' + data[0].asset_id);
                                if (request.account_id == 0) {
                                    console.log("CASE 6, DATA LENGTH 1, request.account_id = 0 :: ", request.account_id + ' ' + data[0].asset_id);
                                    singleData.query_status = 0;
                                    singleData.asset_id = 0;
                                    singleData.asset_first_name = "All";
                                    singleData.operating_asset_id = 0;
                                    singleData.operating_asset_first_name = "All";

                                    responseData[0] = "";
                                    responseData[1] = singleData;
                                    resolve(responseData);

                                } else {
                                    console.log("CASE 6, DATA LENGTH 1, request.account_id > 0:: ", request.account_id + ' ' + data[0].asset_id);
                                    if (data[0].target_asset_id == 0) {
                                        assetListSelect(request).then((resData) => {

                                            singleData.query_status = 0;
                                            singleData.asset_id = 0;
                                            singleData.asset_first_name = "All";
                                            singleData.operating_asset_id = 0;
                                            singleData.operating_asset_first_name = "All";

                                            resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                            responseData[0] = "";
                                            responseData[1] = resData;
                                            //console.log("responseData ", responseData);
                                            resolve(responseData);

                                        });
                                    } else {
                                        console.log('CASE 6, DATA LENGTH 1, request.account_id > 0 data[0].asset_id > 0 :: ', +' ' + JSON.stringify(data));
                                        responseData[0] = "";
                                        responseData[1] = data;
                                        console.log('CASE 6, DATA LENGTH 1, request.account_id > 0 data[0].asset_id > 0 responseData :: ', +' ' + JSON.stringify(responseData));
                                        resolve(responseData);
                                    }
                                }

                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 8) {
                            if (data.length == 0) {
                                tagEntityMappingTagTypeSelect(request).then((resData) => {

                                    singleData.query_status = 0;
                                    singleData.activity_type_id = 0;
                                    singleData.activity_type_name = "All";

                                    resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                    responseData[0] = "";
                                    responseData[1] = resData;
                                    //console.log("responseData ", responseData);
                                    resolve(responseData);

                                });
                            } else {
                                if (data[0].activity_type_id == 0) {

                                    tagEntityMappingTagTypeSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.activity_type_id = 0;
                                        singleData.activity_type_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            }
                        } else if (request.flag == 22) {
                            if (data.length == 0) {
                                if (request.account_id > 0) {
                                    let paramsArrInter = new Array(
                                        request.organization_id,
                                        0,
                                        request.workforce_id,
                                        request.segment_id || 0,
                                        request.target_asset_id,
                                        request.tag_type_id || 0,
                                        request.tag_id || 0,
                                        request.flag || 1,
                                        request.page_start || 0,
                                        request.page_limit || 50
                                    );
                                    let queryStringInter = util.getQueryString('ds_p1_asset_access_level_mapping_select_flag', paramsArrInter);
                                    if (queryStringInter !== '') {
                                        db.executeQueryPromise(1, queryStringInter, request)
                                            .then((IntermediateData) => {

                                                if (IntermediateData.length == 1) {

                                                    if (IntermediateData[0].tag_id == 0) {
                                                        
                                                        tagListOfTagTypeSelect(request).then((resData) => {

                                                            singleData.query_status = 0;
                                                            singleData.tag_id = 0;
                                                            singleData.tag_name = "All";

                                                            resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                                            responseData[0] = "";
                                                            responseData[1] = resData;
                                                            //console.log("responseData ", responseData);
                                                            resolve(responseData);

                                                        });
                                                    } else {
                                                        responseData[0] = "";
                                                        responseData[1] = IntermediateData;
                                                        resolve(responseData);
                                                    }
                                                } else {
                                                    responseData[0] = "";
                                                    responseData[1] = IntermediateData;
                                                    resolve(responseData);
                                                }
                                            })

                                    } else {
                                        responseData[0] = "";
                                        responseData[1] = data;
                                        resolve(responseData);
                                    }
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }

                            } else if (data.length == 1) {
                                if (data[0].tag_id == 0) {
                                    
                                    tagListOfTagTypeSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.tag_id = 0;
                                        singleData.tag_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 23) {
                            if (data.length == 0) {
                                tagEntityMappingSelect(request).then((resData) => {

                                    singleData.query_status = 0;
                                    singleData.activity_type_id = 0;
                                    singleData.activity_type_name = "All";

                                    resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                    responseData[0] = "";
                                    responseData[1] = resData;
                                    //console.log("responseData ", responseData);
                                    resolve(responseData);

                                });
                            } else {
                                if (data[0].product_type_id == 0) {

                                    tagEntityMappingSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.activity_type_id = 0;
                                        singleData.activity_type_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            }
                        } else {
                            responseData[0] = "";
                            responseData[1] = data;
                            resolve(responseData);
                        }

                    })
                    .catch((err) => {
                        error = err;
                    });
            }
        });
    };  

    this.assetAccessLevelMappingSelectFlagV2 = function (request) {
        return new Promise((resolve, reject) => {
            let responseData = [];
            let singleData = {};

            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.segment_id || 0,
                request.target_asset_id,
                request.tag_type_id || 0,
                request.tag_id || 0,
                request.cluster_tag_id || 0,
                request.vertical_tag_id || 0,
                request.flag || 1,
                request.resource_tag_dynamic_enabled || 0,
                request.page_start || 0,
                request.page_limit || 50
            );
            const queryString = util.getQueryString('ds_p1_3_asset_access_level_mapping_select_flag', paramsArr);
            if (queryString !== '') {
                db.executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        //responseData = data;
                        error = false;
                        console.log("assetAccessLevelMappingSelectFlagV2 :: Flag "+request.flag+" :: DATA LENGTH :: ", data.length);
                        if (request.flag == 2) {
                            console.log("request.cluster_tag_id :: "+request.cluster_tag_id);
                            if(request.cluster_tag_id == 0){ // cluster tag

                                tagEntityMappingTagSelect(request).then((resData) => {
                                    singleData.query_status = 0;
                                    singleData.account_id = 0;
                                    singleData.account_name = "National";

                                    resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                    responseData[0] = "";
                                    responseData[1] = resData;
                                    //console.log("responseData ", responseData);
                                    resolve(responseData);
                                });                                 
                            }else if(request.cluster_tag_id > 0){
                                    if(data.length == 0){
                                        let resData = [];
                                        singleData.query_status = 0;
                                        singleData.account_id = 0;
                                        singleData.account_name = "All";
                                        
                                        resData.splice(0, 0, singleData);
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);
                                    }else{
                                          if(data[0].account_id == 0) {

                                            tagEntityMappingTagSelect(request).then((resData) => {
                                                singleData.query_status = 0;
                                                singleData.account_id = 0;
                                                singleData.account_name = "All";

                                                resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                                responseData[0] = "";
                                                responseData[1] = resData;
                                                //console.log("responseData ", responseData);
                                                resolve(responseData);
                                            });                                            
                                        }else{
                                                responseData[0] = "";
                                                responseData[1] = data;
                                                resolve(responseData);
                                        }
                                    }


                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                            
                        } else if (request.flag == 21) {
                            if (data.length == 0) {
                                if (request.account_id > 0) {
                                    let paramsArrInter = new Array(
                                        request.organization_id,
                                        0,
                                        request.workforce_id,
                                        request.segment_id || 0,
                                        request.target_asset_id,
                                        request.tag_type_id || 0,
                                        request.tag_id || 0,
                                        request.flag || 1,
                                        request.page_start || 0,
                                        request.page_limit || 50
                                    );
                                    let queryStringInter = util.getQueryString('ds_p1_asset_access_level_mapping_select_flag', paramsArrInter);
                                    if (queryStringInter !== '') {
                                        db.executeQueryPromise(1, queryStringInter, request)
                                            .then((IntermediateData) => {

                                                if (IntermediateData.length == 1) {

                                                    if (IntermediateData[0].tag_id == 0) {
                                                        
                                                        tagListOfTagTypeSelect(request).then((resData) => {

                                                            singleData.query_status = 0;
                                                            singleData.tag_id = 0;
                                                            singleData.tag_name = "All";

                                                            resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                                            responseData[0] = "";
                                                            responseData[1] = resData;
                                                            //console.log("responseData ", responseData);
                                                            resolve(responseData);

                                                        });
                                                    } else {
                                                        responseData[0] = "";
                                                        responseData[1] = IntermediateData;
                                                        resolve(responseData);
                                                    }
                                                } else {
                                                    responseData[0] = "";
                                                    responseData[1] = IntermediateData;
                                                    resolve(responseData);
                                                }
                                            })

                                    } else {
                                        responseData[0] = "";
                                        responseData[1] = data;
                                        resolve(responseData);
                                    }
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }

                            } else if (data.length == 1) {
                                if (data[0].tag_id == 0) {
                                    
                                    tagListOfTagTypeSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.tag_id = 0;
                                        singleData.tag_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 6) {

                            if (data.length == 0) {
                                if (request.account_id == 0) {
                                    singleData.query_status = 0;
                                    singleData.asset_id = 0;
                                    singleData.asset_first_name = "All";
                                    singleData.operating_asset_id = 0;
                                    singleData.operating_asset_first_name = "All";

                                    responseData[0] = "";
                                    responseData[1] = singleData;
                                    resolve(responseData);
                                } else {
                                    assetListSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.asset_id = 0;
                                        singleData.asset_first_name = "All";
                                        singleData.operating_asset_id = 0;
                                        singleData.operating_asset_first_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                }
                            } else if (data.length == 1) {
                                console.log("CASE 6, DATA LENGTH 1, request.account_id :: ", request.account_id + ' ' + data[0].asset_id);
                                if (request.account_id == 0) {
                                    console.log("CASE 6, DATA LENGTH 1, request.account_id = 0 :: ", request.account_id + ' ' + data[0].asset_id);
                                    singleData.query_status = 0;
                                    singleData.asset_id = 0;
                                    singleData.asset_first_name = "All";
                                    singleData.operating_asset_id = 0;
                                    singleData.operating_asset_first_name = "All";

                                    responseData[0] = "";
                                    responseData[1] = singleData;
                                    resolve(responseData);

                                } else {
                                    console.log("CASE 6, DATA LENGTH 1, request.account_id > 0:: ", request.account_id + ' ' + data[0].asset_id);
                                    if (data[0].target_asset_id == 0) {
                                        assetListSelect(request).then((resData) => {

                                            singleData.query_status = 0;
                                            singleData.asset_id = 0;
                                            singleData.asset_first_name = "All";
                                            singleData.operating_asset_id = 0;
                                            singleData.operating_asset_first_name = "All";

                                            resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                            responseData[0] = "";
                                            responseData[1] = resData;
                                            //console.log("responseData ", responseData);
                                            resolve(responseData);

                                        });
                                    } else {
                                        console.log('CASE 6, DATA LENGTH 1, request.account_id > 0 data[0].asset_id > 0 :: ', +' ' + JSON.stringify(data));
                                        responseData[0] = "";
                                        responseData[1] = data;
                                        console.log('CASE 6, DATA LENGTH 1, request.account_id > 0 data[0].asset_id > 0 responseData :: ', +' ' + JSON.stringify(responseData));
                                        resolve(responseData);
                                    }
                                }

                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 8) {
                            if (data.length == 0) {
                                tagEntityMappingTagTypeSelect(request).then((resData) => {

                                    singleData.query_status = 0;
                                    singleData.activity_type_id = 0;
                                    singleData.activity_type_name = "All";

                                    resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                    responseData[0] = "";
                                    responseData[1] = resData;
                                    //console.log("responseData ", responseData);
                                    resolve(responseData);

                                });
                            } else {
                                if (data[0].activity_type_id == 0) {

                                    tagEntityMappingTagTypeSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.activity_type_id = 0;
                                        singleData.activity_type_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            }
                        } else if (request.flag == 22) {
                            if (data.length == 0) {
                                if (request.account_id > 0) {
                                    let paramsArrInter = new Array(
                                        request.organization_id,
                                        0,
                                        request.workforce_id,
                                        request.segment_id || 0,
                                        request.target_asset_id,
                                        request.tag_type_id || 0,
                                        request.tag_id || 0,
                                        request.flag || 1,
                                        request.page_start || 0,
                                        request.page_limit || 50
                                    );
                                    let queryStringInter = util.getQueryString('ds_p1_asset_access_level_mapping_select_flag', paramsArrInter);
                                    if (queryStringInter !== '') {
                                        db.executeQueryPromise(1, queryStringInter, request)
                                            .then((IntermediateData) => {

                                                if (IntermediateData.length == 1) {

                                                    if (IntermediateData[0].tag_id == 0) {
                                                        
                                                        tagListOfTagTypeSelect(request).then((resData) => {

                                                            singleData.query_status = 0;
                                                            singleData.tag_id = 0;
                                                            singleData.tag_name = "All";

                                                            resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                                            responseData[0] = "";
                                                            responseData[1] = resData;
                                                            //console.log("responseData ", responseData);
                                                            resolve(responseData);

                                                        });
                                                    } else {
                                                        responseData[0] = "";
                                                        responseData[1] = IntermediateData;
                                                        resolve(responseData);
                                                    }
                                                } else {
                                                    responseData[0] = "";
                                                    responseData[1] = IntermediateData;
                                                    resolve(responseData);
                                                }
                                            })

                                    } else {
                                        responseData[0] = "";
                                        responseData[1] = data;
                                        resolve(responseData);
                                    }
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }

                            } else if (data.length == 1) {
                                if (data[0].tag_id == 0) {
                                    
                                    tagListOfTagTypeSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.tag_id = 0;
                                        singleData.tag_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)

                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 23) {
                            if (data.length == 0) {
                                tagEntityMappingSelect(request).then((resData) => {

                                    singleData.query_status = 0;
                                    singleData.activity_type_id = 0;
                                    singleData.activity_type_name = "All";

                                    resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                    responseData[0] = "";
                                    responseData[1] = resData;
                                    //console.log("responseData ", responseData);
                                    resolve(responseData);

                                });
                            } else {
                                if (data[0].product_type_id == 0) {

                                    tagEntityMappingSelect(request).then((resData) => {

                                        singleData.query_status = 0;
                                        singleData.activity_type_id = 0;
                                        singleData.activity_type_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            }
                        } else if (request.flag == 25) {
                            if (data.length == 0) {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);

                            } else if (data.length == 1) {

                                if (data[0].cluster_tag_id == 0) {

                                    tagListOfTagTypeSelect(request).then((resData) => {
                                        singleData.query_status = 0;
                                        singleData.tag_id = 0;
                                        singleData.tag_name = "National";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 26) {

                            if (data.length == 0) {
                                
                                singleData.query_status = 0;
                                singleData.tag_id = 0;
                                singleData.tag_name = "All";

                                data.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);

                            } else if (data.length == 1) {

                                if (data[0].workforce_tag_id == 0) {

                                    tagListOfTagTypeSelect(request).then((resData) => {
                                        singleData.query_status = 0;
                                        singleData.tag_id = 0;
                                        singleData.tag_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                singleData.query_status = 0;
                                singleData.tag_id = 0;
                                singleData.tag_name = "All";

                                data.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 20) {

                            if (data.length == 0/* || (data.length == 1 && data[0].tag_type_id == 0)*/) {
                                
                                    tagTypesforApplication(request).then((resData) => {
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);
                                    });

                            } else if (data.length == 1) {

                                if (data[0].tag_type_id == 0) {

                                    tagTypesforApplication(request).then((resData) => {
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 28) {
                            if (data.length == 0) {
                        
                                singleData.query_status = 0;
                                singleData.tag_id = 0;
                                singleData.tag_name = "All";

                                data.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);

                            } else if (data.length == 1) {

                                if (data[0].vertical_tag_id == 0) {

                                    request.tag_type_category_id = 3;
                                    request.tag_type_id = data[0].vertical_tag_type_id;
                                    
                                    tagListOfTagTypeSelect(request).then((resData) => {
                                        singleData.query_status = 0;
                                        singleData.tag_id = 0;
                                        singleData.tag_name = "All";
                                        singleData.tag_type_id = data[0].vertical_tag_type_id;
                                        singleData.tag_type_name = data[0].vertical_tag_type_name;

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 30) {

                            if (data.length == 0) {
                                
                                singleData.query_status = 0;
                                singleData.campaign_id = 0;
                                singleData.campaign_title = "All";

                                data.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);

                            } else if (data.length == 1) {

                                if (data[0].campaign_id == 0) {

                                    getCampaignSearchList(request).then((resData) => {
                                        singleData.query_status = 0;
                                        singleData.campaign_id = 0;
                                        singleData.campaign_title = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {
                                singleData.query_status = 0;
                                singleData.campaign_id = 0;
                                singleData.campaign_title = "All";

                                data.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else if (request.flag == 27) {
                            responseData[0] = "";
                            responseData[1] = data;
                            resolve(responseData);
                        } else if ([31,32,33].includes(Number(request.flag))){

                            if (data.length == 0) {
                                
                                singleData.query_status = 0;
                                singleData.tag_id = 0;
                                singleData.tag_name = "All";

                                data.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);

                            } else if (data.length == 1) {

                                if(data[0].tag_type_id == 0){

                                    if(request.tag_type_id == 0){

                                        singleData.query_status = 0;
                                        singleData.tag_id = 0;
                                        singleData.tag_name = "All";
        
                                        data.splice(0, 1, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = data;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    }else if(request.tag_type_id > 0){

                                        tagListOfTagTypeSelectV1(request).then((resData) => {
                                            singleData.query_status = 0;
                                            singleData.tag_id = 0;
                                            singleData.tag_name = "All";
    
                                            resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                            responseData[0] = "";
                                            responseData[1] = resData;
                                            //console.log("responseData ", responseData);
                                            resolve(responseData);
    
                                        });
                                    }

                                }else if(data[0].tag_type_id > 0){
                                    if(data[0].tag_id == 0){
                                        tagListOfTagTypeSelectV1(request).then((resData) => {
                                            singleData.query_status = 0;
                                            singleData.tag_id = 0;
                                            singleData.tag_name = "All";
    
                                            resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                            responseData[0] = "";
                                            responseData[1] = resData;
                                            //console.log("responseData ", responseData);
                                            resolve(responseData);
    
                                        });
                                    }else if(data[0].tag_id > 0){
                                        responseData[0] = "";
                                        responseData[1] = data;
                                        resolve(responseData);
                                    }
                                }else{
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }                               
                            } else {    
                                
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }  

                        } else if ([34,35,36].includes(Number(request.flag))){
                            if (data.length == 0) {
                                
                                singleData.query_status = 0;
                                singleData.tag_type_id = 0;
                                singleData.tag_type_name = "All";

                                data.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);

                            } else if (data.length == 1) {

                                if (data[0].tag_type_id == 0) {
                                    // get the list of tag types from organization_list
                                    tagTypeListUnderAVertical(request).then((resData) => {
                                        singleData.query_status = 0;
                                        singleData.tag_type_id = 0;
                                        singleData.tag_type_name = "All";

                                        resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                        responseData[0] = "";
                                        responseData[1] = resData;
                                        //console.log("responseData ", responseData);
                                        resolve(responseData);

                                    });
                                } else {
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }
                            } else {    
                                
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                        } else {

                            if(!request.hasOwnProperty("resource_tag_dynamic_enabled"))
                            {
                                request.resource_tag_dynamic_enabled = 0;
                            }
                            if(request.resource_tag_dynamic_enabled == 2){ //0 = static filters, 1 = dynamic field filters, 2 = dynamic resource tags

                                if (data.length == 0) {
                                
                                    singleData.query_status = 0;
                                    singleData.tag_id = 0;
                                    singleData.tag_name = "All";
    
                                    data.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
    
                                } else if (data.length == 1) {
    
                                    if (data[0].tag_id == 0) {

                                        request.tag_type_id = data[0].tag_type_id;
                                        tagListOfTagTypeSelectV1(request).then((resData) => {
                                            singleData.query_status = 0;
                                            singleData.tag_id = 0;
                                            singleData.tag_name = "All";
    
                                            resData.splice(0, 0, singleData);//splice(index, <deletion 0 or 1>, item)
                                            responseData[0] = "";
                                            responseData[1] = resData;
                                            //console.log("responseData ", responseData);
                                            resolve(responseData);
    
                                        });
                                    } else {
                                        responseData[0] = "";
                                        responseData[1] = data;
                                        resolve(responseData);
                                    }
                                } else {    
                                    
                                    responseData[0] = "";
                                    responseData[1] = data;
                                    resolve(responseData);
                                }                                
                            }else{
                                responseData[0] = "";
                                responseData[1] = data;
                                resolve(responseData);
                            }
                            
                        }

                    })
                    .catch((err) => {
                        error = err;
                    });
            }
        });
    };  

    this.assetReportAccessMapping = function(request) {
        console.log("assetReportAccessMapping :: access_level_id " + request.access_level_id);
        console.log(request);
        return new Promise((resolve, reject) => {
            let responseData = [];
            let singleData = {};

            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.access_level_id,
                request.target_asset_id,
                request.tag_type_id,
                request.tag_id || 0,
                request.activity_type_id || 0,
                request.target_account_id || 0,
                request.search_string || '',
                request.is_export,
                request.page_start || 0,
                request.page_limit || 100
            );
            const queryString = util.getQueryString('ds_p1_asset_report_mapping_select', paramsArr);
            if (queryString !== '') {
                db.executeQueryPromise(1, queryString, request).then((data) => {
                    console.log(data);
                    error = false;
                    console.log("assetReportAccessMapping :: access_level_id " + request.access_level_id + " :: DATA LENGTH :: ", data.length);
                    if (request.access_level_id == 2) { 

                        if (request.tag_id == 0) { // cluster tag
                        
                            tagEntityMappingTagSelectV1(request).then((resData) => {
                                singleData.query_status = 0;
                                singleData.account_id = 0;
                                singleData.account_name = "National";

                                resData.splice(0, 0, singleData); //splice(index, <deletion 0 or 1>, item)
                                resolve([false, resData]);
                            });
                        
                        } else if (request.tag_id > 0) {
                            if (data.length == 0) {
                                resolve([false, data]);
                            } else {
                                if (data[0].account_id == 0) {
                        
                                    tagEntityMappingTagSelectV1(request).then((resData) => {
                                        singleData.query_status = 0;
                                        singleData.account_id = 0;
                                        singleData.account_name = "All";

                                        resData.splice(0, 0, singleData); //splice(index, <deletion 0 or 1>, item)
                                        resolve([false, resData]);
                                    });
                        
                                } else {
                                    resolve([false, data]);
                                }
                            }
                        } else {
                            resolve([false, data]);
                        }

                    } else if (request.access_level_id == 21) {
                        
                        if (data.length == 0) {
                            resolve([false, data]);
                        } else if (data.length == 1) {
                            if (data[0].tag_id == 0) {
                                
                                request.tag_type_id = 110;
                                request.tag_type_category_id = 1;
                                
                                tagListOfTagTypeSelect(request).then((resData) => {
                                    singleData.query_status = 0;
                                    singleData.tag_id = 0;
                                    singleData.tag_name = "All";

                                    resData.splice(0, 0, singleData); //splice(index, <deletion 0 or 1>, item)
                                    resolve([false, resData]);
                                });
                        
                            } else {
                                resolve([false, data]);
                            }
                        } else {
                            resolve([false, data]);
                        }

                    } else if (request.access_level_id == 6) {

                        if (data.length == 0) {
                            if (request.account_id == 0) {
                                singleData.query_status = 0;
                                singleData.asset_id = 0;
                                singleData.asset_first_name = "All";
                                singleData.operating_asset_id = 0;
                                singleData.operating_asset_first_name = "All";
                                resolve([false, singleData]);
                            } else {
                                
                                request.account_id = request.target_account_id;
                                request.workforce_id = 0;
                                request.workforce_type_id = 0;
                                
                                assetListSelect(request).then((resData) => {
                                    singleData.query_status = 0;
                                    singleData.asset_id = 0;
                                    singleData.asset_first_name = "All";
                                    singleData.operating_asset_id = 0;
                                    singleData.operating_asset_first_name = "All";

                                    resData.splice(0, 0, singleData); //splice(index, <deletion 0 or 1>, item)
                                    resolve([false, resData]);
                                });

                            }
                        } else if (data.length == 1) {                            
                            console.log("CASE 6, DATA LENGTH 1, request.account_id :: ", request.account_id + ' ' + data[0].asset_id);
                            if (request.target_account_id == 0) {
                                resolve([false, data]);
                            } else {
                                console.log("CASE 6, DATA LENGTH 1, request.account_id > 0:: ", request.account_id + ' ' + data[0].asset_id);
                                if (data[0].target_asset_id == 0) {

                                    request.account_id = request.target_account_id;
                                    request.workforce_id = 0;
                                    request.workforce_type_id = 0;
                                    
                                    assetListSelect(request).then((resData) => {
                                        singleData.query_status = 0;
                                        singleData.asset_id = 0;
                                        singleData.asset_first_name = "All";
                                        singleData.operating_asset_id = 0;
                                        singleData.operating_asset_first_name = "All";

                                        resData.splice(0, 0, singleData); //splice(index, <deletion 0 or 1>, item)
                                        resolve([false, resData]);
                                    });

                                } else {
                                    console.log('CASE 6, DATA LENGTH 1, request.account_id > 0 data[0].asset_id > 0 :: ', +' ' + JSON.stringify(data));
                                    resolve([false, data]);
                                }
                            }
                        } else {
                            resolve([false, data]);
                        }

                    } else if (request.access_level_id == 8) {
                        resolve([false, data]);
                    } else if (request.access_level_id == 22) {

                        if (data.length == 0) {
                            resolve([false, data]);
                        } else if (data.length == 1) {
                            if (data[0].tag_id == 0) {

                                request.tag_type_category_id = 5;
                                request.tag_type_id = 141;
                                
                                tagListOfTagTypeSelect(request).then((resData) => {
                                    singleData.query_status = 0;
                                    singleData.tag_id = 0;
                                    singleData.tag_name = "All";

                                    resData.splice(0, 0, singleData); //splice(index, <deletion 0 or 1>, item)
                                    resolve([false, resData]);
                                });
                            } else {
                                resolve([false, data]);
                            }
                        } else {
                            resolve([false, data]);
                        }

                    } else if (request.access_level_id == 23) {
                        
                        if (data.length == 0) {
                            
                            tagEntityMappingSelect(request).then((resData) => {
                                singleData.query_status = 0;
                                singleData.activity_type_id = 0;
                                singleData.activity_type_name = "All";

                                resData.splice(0, 0, singleData); //splice(index, <deletion 0 or 1>, item)
                                resolve([false, resData]);
                            });

                        } else {
                            if (data[0].product_type_id == 0) {

                                tagEntityMappingSelect(request).then((resData) => {
                                    singleData.query_status = 0;
                                    singleData.activity_type_id = 0;
                                    singleData.activity_type_name = "All";

                                    resData.splice(0, 0, singleData); //splice(index, <deletion 0 or 1>, item)
                                    resolve([false, resData]);
                                });

                            } else {
                                resolve([false, data]);
                            }
                        }

                    } else if (request.access_level_id == 24) {
                        resolve([false, data]);
                    } else if (request.access_level_id == 25) {
                        if (data.length == 0) {
                            resolve([false, data]);
                        } else if (data.length == 1) {
                            if (data[0].cluster_tag_id == 0) {

                                tagListOfTagTypeSelect(request).then((resData) => {
                                    singleData.query_status = 0;
                                    singleData.tag_id = 0;
                                    singleData.tag_name = "National";

                                    resData.splice(0, 0, singleData); //splice(index, <deletion 0 or 1>, item)
                                    resolve([false, resData]);
                                });

                            } else {
                                resolve([false, data]);
                            }
                        } else {
                            console.log(data);
                            resolve([false, data]);
                        }

                    } else if (request.access_level_id == 26) {

                        if (data.length == 0) {
                            resolve([false, data]);
                        } else if (data.length == 1) {
                            if (data[0].workforce_tag_id == 0) {

                                request.tag_type_category_id = 2;
                                request.tag_type_id = 147;
                                
                                tagListOfTagTypeSelect(request).then((resData) => {
                                    singleData.query_status = 0;
                                    singleData.tag_id = 0;
                                    singleData.tag_name = "All";

                                    resData.splice(0, 0, singleData); //splice(index, <deletion 0 or 1>, item)
                                    resolve([false, resData]);
                                });

                            } else {
                                resolve([false, data]);
                            }
                        } else {
                            resolve([false, data]);
                        }
                    } else if (request.access_level_id == 20) {
                        resolve([false, data]);
                    } else {
                        resolve([false, data]);
                    }
                })
                .catch((err) => {
                    error = err;
                });
            }
        });
    };

    function tagListOfTagTypeSelect(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.tag_type_category_id,
                request.tag_type_id,
                request.page_start,
                request.page_limit
            );
            let queryString = util.getQueryString('ds_p1_tag_list_select_tag_type', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    function tagListOfTagTypeSelectV1(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.tag_type_id,
                request.page_start || 0,
                request.page_limit || 50
            );
            let queryString = util.getQueryString('ds_v1_tag_list_select_tag_type', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    function tagTypeListUnderAVertical(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.flag
            );
            var queryString = util.getQueryString('ds_v1_organization_list_select_tag', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if(err === false){
                        console.log(data[0].tag);
                        resolve(JSON.parse(data[0].tag));
                    }else{
                        reject(err);
                    }
                    
                });
            }
        });
    };    

    async function tagEntityMappingSelect(request) {
        return new Promise((resolve, reject) => {
            const paramsArr = new Array(
                request.organization_id,
                request.tag_id,
                request.page_start || 0,
                request.page_limit
            );
            const queryString = util.getQueryString('ds_p1_tag_entity_mapping_select', paramsArr);

             if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };    

    async function tagEntityMappingTagTypeSelect(request) {
        return new Promise((resolve, reject) => {
            const paramsArr = new Array(
                request.organization_id,
                request.tag_type_category_id,
                request.tag_type_id,
                request.page_start || 0,
                request.page_limit
            );
            const queryString = util.getQueryString('ds_p1_tag_entity_mapping_select_tag_type', paramsArr);

             if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    async function tagEntityMappingTagSelect(request) {
        return new Promise((resolve, reject) => {
            const paramsArr = new Array(
                request.organization_id,
                request.tag_type_category_id,
                request.tag_type_id,
                request.cluster_tag_id,
                request.page_start || 0,
                request.page_limit
            );
            const queryString = util.getQueryString('ds_p1_tag_entity_mapping_select_tag', paramsArr);

             if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    async function tagEntityMappingTagSelectV1(request) {
        return new Promise((resolve, reject) => {
            const paramsArr = new Array(
                request.organization_id,
                request.tag_id,
                request.page_start || 0,
                request.page_limit
            );
            const queryString = util.getQueryString('ds_p1_1_tag_entity_mapping_select_tag', paramsArr);

             if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    function getCampaignSearchList(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.tag_type_id,
                request.activity_type_id,   
                request.is_search || 0,
                request.search_string || '',             
                request.page_start || 0,
                request.page_limit || 10
            );
            let queryString = util.getQueryString('ds_v1_activity_search_list_select_campaign_search', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };    

    this.insertResourceTimesheet = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.swipe_type_id,
            request.start_datetime,
            request.end_datetime,
            request.work_hours_duration,
            request.asset_id,
            request.operating_asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            util.getCurrentUTCTime()            
        );
        const queryString = util.getQueryString('ds_p1_asset_timesheet_transaction_insert', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    this.getResourceTimesheet = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.target_account_id,
            request.target_workforce_id,
            request.target_asset_id,
            request.operating_asset_id, 
            request.start_datetime,
            request.end_datetime,    
            request.swipe_type_id || 1,                               
            request.flag || 0            
        );
        const queryString = util.getQueryString('ds_p1_asset_timesheet_transaction_select', paramsArr);
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
    
    
    this.getAssetsReportingToSameManager = async function (request) {
        let responseData = [],
            error = true;

        ///flag:3 you will get current lead also
        ///flag:4 Reporting assets other than current lead will be returned
        ///manager : manager_asset_id
        ///asset_id = current_lead_asset_id

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_type_id,
            request.current_lead_asset_id, 
            request.manager_asset_id,
            request.flag                        
        );
        const queryString = util.getQueryString('ds_p1_1_asset_list_select_manager_flag', paramsArr);
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

    this.getActivityAssetReferenceList = async(request) => {

        let [error, responseData] = await getAssetReferenceList(request);
        if(error) {
            console.error("filterActivityParticipants error", error);
            return [true, [{ message : "Something went wrong"}]]
        }

        return [error, responseData];
    }    
    
    this.getActivityAssetRoleReferenceList = async(request) => {

        let [error, responseData] = await getAssetRoleReferenceList(request);
        if(error) {
            console.error("getActivityAssetRoleReferenceList error", error);
            return [true, [{ message : "Something went wrong"}]]
        }

        return [error, responseData];
    }

    async function getAssetReferenceList(request) {
        let responseData = [],
            error = true, queryString = "";

        if(request.hasOwnProperty("form_id")){ 
            let paramsArr = [
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_id,
                request.activity_id,
                request.asset_type_id,
                request.asset_type_category_id,
                request.flag_filter,
                request.form_id,
                request.search_string,
                request.start_from || 0,
                request.limit_value || 50
             ]
            queryString = util.getQueryString('ds_p1_3_asset_list_select_asset_reference', paramsArr);
        }else{
            let paramsArr = [
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_id,
                request.activity_id,
                request.asset_type_category_id,
                request.flag_filter,
                request.search_string,
                request.start_from || 0,
                request.limit_value || 50
            ]
            queryString = util.getQueryString('ds_p1_1_asset_list_select_asset_reference', paramsArr);
        }
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request).then((data) => {
                responseData = data;
                error = false;
            }).catch((err) => {
                    error = err;
            });
        }
        return [error, responseData];
    }

    async function getAssetRoleReferenceList(request) {
        let responseData = [],
            error = true, queryString = "";

        if(request.hasOwnProperty("form_id"))
        {
            let paramsArr = [
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.activity_id,
            request.asset_type_id,
            request.asset_type_category_id,
            request.flag_filter,
            request.form_id,
            request.search_string,
            request.start_from || 0,
            request.limit_value || 50
            ];
            
            queryString = util.getQueryString('ds_p1_3_asset_list_select_asset_reference', paramsArr);
        }else{
            
            let paramsArr = [
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_id,
                request.activity_id,
                request.asset_type_id,
                request.asset_type_category_id,
                request.flag_filter,
                request.search_string,
                request.start_from || 0,
                request.limit_value || 50
                ];
            queryString = util.getQueryString('ds_p1_2_asset_list_select_asset_reference', paramsArr);
        }            
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request).then((data) => {
                responseData = data;
                error = false;
            }).catch((err) => {
                    error = err;
            });
        }

        return [error, responseData];
    }

    this.insertAssetSlot = async(request) => {

        request.flag = 1; 
        // IF p_flag = 0 THEN RETURNS COUNT of OPEN workflows which are lead by the owner in the given duration 
        // IF p_flag = 1 THEN RETURNS LIST of OPEN workflows which are lead by the owner in the given duration
        
        let [error, assetSlots] = await fetchAssetSlots(request);
        if(error) {
            console.error("insertAssetSlot error", error);
            return [true, [{ message : "Something went wrong"}]];
        }

        if(!assetSlots.length) {
            return insertAssetSlot(request);
        }

        return [true, [{ message : "Slot already exists" }]];
    }

    async function fetchAssetSlots(request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
          request.organization_id,
          request.asset_id,
          request.flag || 0,
          request.start_datetime,
          request.end_datetime,
          request.start_from || 0,
          request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_asset_slot_transaction_select', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request).then((data) => {
                responseData = data;
                error = false;
            }).catch((err) => {
                error = err;
            });
        }

        return [error, responseData];
    }

    async function insertAssetSlot(request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
          request.organization_id,
          request.asset_id,
          request.start_datetime,
          request.end_datetime,
        );
        const queryString = util.getQueryString('ds_p1_asset_slot_transaction_insert', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request).then((data) => {
                error = false;
            }).catch((err) => {
                error = err;
            });
        }

        return [error, responseData];
    }

    this.getAssetSlots = async(request) => {

        let [error, responseData] = await fetchAssetSlots(request);
        if(error) {
            console.error("getAssetSlots error", error);
            return [true, [{ message : "Something went wrong"}]]
        }

        return [error, responseData];
    }

    this.assetEmailPwdSet  = async (request) => {
        let responseData = [],
            error = true;        

        const paramsArr = [
                            request.asset_id,                            
                            request.organization_id,
                            request.new_password,
                            util.addDaysToGivenDate(util.getCurrentUTCTime(), 90, "YYYY-MM-DD HH:mm:ss"), //PWD expiry datetime,
                            request.operating_asset_username,
                            request.asset_id,
                            util.getCurrentUTCTime()
                        ];
        const queryString = util.getQueryString('ds_p1_1_asset_list_update_password', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
              .then((data)=>{
                    responseData = {'message': 'Password updated successfully!'};
                    error = false;
                })
                .catch((err)=>{
                        console.log('[Error] assetEmailPwdSet ',err);
                        error = err;
                });
        }

        return [error, responseData];
    };

    this.updateFlagProcess = async function(request){
        let responseData = [],
        error = true;        

    const paramsArr = [
                      request.organization_id,
                      request.account_id,
                      request.workforce_id,
                      request.asset_id,
                      request.asset_flag_process_mgmt  
                    ];
    const queryString = util.getQueryString('ds_p1_asset_list_update_flag_process_mgmt', paramsArr);
    if (queryString != '') {
        await db.executeQueryPromise(0, queryString, request)
          .then((data)=>{
                responseData = {'message': 'asset list flag process management updated successfully!'};
                error = false;
            })
            .catch((err)=>{
                    console.log('[Error] asset list flag process ',err);
                    error = err;
            });
    }

    return [error, responseData];
    }

    function tagTypesforApplication(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.application_id,
                request.organization_id
            );
            let queryString = util.getQueryString('ds_v1_application_tag_type_mapping_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };    

    function getOrganizationApplications(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id
            );
            let queryString = util.getQueryString('ds_v1_application_master_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };      

    this.assetSwipeIn = async function(request){
        let responseData = [],
        error = true;        

    const paramsArr = [
                      request.asset_id,
                      request.organization_id,
                      request.swipein_datetime,
                      request.swipein_latitude,
                      request.swipein_longitude,
                      request.swipein_address,
                      request.log_asset_id,
                      util.getCurrentUTCTime() 
                    ];
    const queryString = util.getQueryString('ds_p1_asset_attendance_transaction_insert', paramsArr);
    if (queryString != '') {
        await db.executeQueryPromise(0, queryString, request)
          .then((data)=>{
                responseData = {'message': 'asset attendance updated successfully!'};
                error = false;
            })
            .catch((err)=>{
                    console.log('[Error] asset attendence process ',err);
                    return [true,[]]
            });
    }
    let [updateErr,updateData] = await this.updateAssetSwipeDetails(request);
    if(updateErr){
        return [true,[]]
    }
    
    // ds_p1_asset_attendance_transaction_select`(IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20))
    let [listErr,listData] = await getLatestAttendenceTransactionDetails(request);
    if(listErr){
        return [true,[]]
    }
    responseData = listData;
    console.log(listData)
//     let [err,assetDetails] = await getAssetDetails(request);
// //Add a timeline entry
// let activityTimelineCollection =  JSON.stringify({                            
//     "content": `${assetDetails[0].first_name} swiped in at ${moment().utcOffset('+05:30').format('LLLL')}.`,
//     "subject": `Note - ${util.getCurrentDate()}.`,
//     "mail_body": `${assetDetails[0].first_name} swiped in at ${moment().utcOffset('+05:30').format('LLLL')}.`,
//     "activity_reference": [],
//     "asset_reference": [],
//     "attachments": [],
//     "form_approval_field_reference": []
// });

// let timelineReq = Object.assign({}, request);
//     timelineReq.activity_type_id = request.activity_type_id;
//     timelineReq.message_unique_id = util.getMessageUniqueId(100);
//     timelineReq.track_gps_datetime = util.getCurrentUTCTime();
//     timelineReq.activity_stream_type_id = 112;
//     timelineReq.timeline_stream_type_id = 112;
//     timelineReq.activity_timeline_collection = activityTimelineCollection;
//     timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;

// await activityTimelineService.addTimelineTransactionAsync(timelineReq);
    return [error, responseData];
    }

    this.assetSwipeOut = async function(request){
        let responseData = [],
        error = true;        

    const paramsArr = [
                      request.attendance_transaction_id ,
                      request.asset_id,
                      request.organization_id,
                      request.swipeout_datetime,
                      request.swipeout_latitude,
                      request.swipeout_longitude,
                      request.swipeout_address,
                      request.asset_id,
                      util.getCurrentUTCTime() 
                    ];
    const queryString = util.getQueryString('ds_p1_asset_attendance_transaction_update', paramsArr);
    if (queryString != '') {
        await db.executeQueryPromise(0, queryString, request)
          .then((data)=>{
                responseData = {'message': 'asset attendance updated successfully!'};
                error = false;
            })
            .catch((err)=>{
                    console.log('[Error] asset attendence process ',err);
                    return [true,[]]
            });
    }
    let [updateErr,updateData] = await this.updateAssetSwipeDetails(request);
    if(updateErr){
        error=true;
    }
    // let [err,assetDetails] = await getAssetDetails(request);
    // //Add a timeline entry
    // let activityTimelineCollection =  JSON.stringify({                            
    //     "content": `${assetDetails[0].first_name} swiped out at ${moment().utcOffset('+05:30').format('LLLL')}.`,
    //     "subject": `Note - ${util.getCurrentDate()}.`,
    //     "mail_body": `${assetDetails[0].first_name} swiped out at ${moment().utcOffset('+05:30').format('LLLL')}.`,
    //     "activity_reference": [],
    //     "asset_reference": [],
    //     "attachments": [],
    //     "form_approval_field_reference": []
    // });
    
    // let timelineReq = Object.assign({}, request);
    //     timelineReq.activity_type_id = request.activity_type_id;
    //     timelineReq.message_unique_id = util.getMessageUniqueId(100);
    //     timelineReq.track_gps_datetime = util.getCurrentUTCTime();
    //     timelineReq.activity_stream_type_id = 113;
    //     timelineReq.timeline_stream_type_id = 113;
    //     timelineReq.activity_timeline_collection = activityTimelineCollection;
    //     timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;
    
    // await activityTimelineService.addTimelineTransactionAsync(timelineReq);

    return [error, responseData];
    }

   async function getLatestAttendenceTransactionDetails(request){
        let responseData = [],
        error = true;        

    const paramsArr = [
                      request.asset_id,
                      request.organization_id
                    ];
    const queryString = util.getQueryString('ds_p1_asset_attendance_transaction_select', paramsArr);
    if (queryString != '') {
        await db.executeQueryPromise(1, queryString, request)
          .then((data)=>{
              if(data && data.length>0){
                responseData = data[0];
              }
                error = false;
            })
            .catch((err)=>{
                    console.log('[Error] asset last attendence process ',err);
                    error = err;
            });
    }

    return [error, responseData];
    } 

    this.updateAssetSwipeDetails = async function(request){
        let responseData = [],
        error = true;        

    const paramsArr = [
                      request.asset_id,
                      request.organization_id,
                      request.asset_type_attendance_type_id,
                      request.asset_attendance_swipe_type_name,
                      request.asset_attendance_swipe_type_datetime
                    ];
    const queryString = util.getQueryString('ds_v1_asset_list_update_swipe', paramsArr);
    if (queryString != '') {
        await db.executeQueryPromise(0, queryString, request)
          .then((data)=>{
                responseData = {'message': 'asset last attendance updated successfully!'};
                error = false;
            })
            .catch((err)=>{
                    console.log('[Error] asset last attendence process ',err);
                    error = err;
            });
    }

    return [error, responseData];
    }

    
    this.assetSessionLogout = async (request) => {
        let responseData = [],
        error = true; 

        let message = {
            organization_id: request.organization_id,
            target_asset_id: request.target_asset_id,
            asset_id: request.asset_id,
            datetime: util.getCurrentUTCTime(),
            type: "logout"
        };

        let data = {
            organization_id: request.organization_id,
            asset_id: request.target_asset_id
        }

        responseData = util.sendPushNotification(request, data, message);
        error = false;
        console.log("assetSessionLogout  : " +JSON.stringify(responseData));       
        return [error, responseData]

    }

    this.getAssetDetailsAsync = async function (request) {
        let assetData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.asset_id
        );
        const queryString = util.getQueryString('ds_v1_2_asset_list_select', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    assetData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, assetData];
    };

    this.assetLeaveMappingInsert = async function (request) {
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        let responseData = [],
            error = true;

        const paramsArr = [
            request.organization_id,
            request.target_asset_id,
            request.leave_start_datetime,
            request.leave_end_datetime,
            request.asset_id,
            util.getCurrentUTCTime()
        ];
        const queryString = util.getQueryString('ds_v1_1_asset_leave_mapping_insert', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    self.assetLeaveMappingHistoryInsert(request,responseData[0].leave_workflow_id);
                    activityCommonService.assetTimelineTransactionInsert(request, {}, 2901, function (err, data) { });
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    this.assetLeaveMappingUpdate = async function (request) {
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        let responseData = [],
            error = true;

        const paramsArr = [
            request.organization_id,
            request.leave_workflow_id,
            request.target_asset_id,
            request.leave_start_datetime,
            request.leave_end_datetime,
            request.asset_id,
            util.getCurrentUTCTime()
        ];
        const queryString = util.getQueryString('ds_v1_asset_leave_mapping_update', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    self.assetLeaveMappingHistoryInsert(request,request.leave_workflow_id);
                    activityCommonService.assetTimelineTransactionInsert(request, {}, 2902, function (err, data) { });
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    this.assetLeaveMappingDelete = async function (request) {
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        let responseData = [],
            error = true;

        const paramsArr = [
            request.organization_id,
            request.leave_workflow_id,
            request.target_asset_id,
            request.asset_id,
            util.getCurrentUTCTime()
        ];
        const queryString = util.getQueryString('ds_v1_asset_leave_mapping_delete', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    self.assetLeaveMappingHistoryInsert(request,request.leave_workflow_id);
                    activityCommonService.assetTimelineTransactionInsert(request, {}, 2903, function (err, data) { });
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    this.assetLeaveMappingHistoryInsert = async function (request,leave_id) {
        let responseData = [],
            error = true;

        const paramsArr = [
            leave_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        ];
        const queryString = util.getQueryString('ds_v1_asset_leave_mapping_history_insert', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    this.getAssetLeaveMappingSelect = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id,
              request.page_start || 0,
              request.page_limit || 10
        ];

        const queryString = util.getQueryString('ds_v1_asset_leave_mapping_select', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
              })
              .catch((err) => {
                  error = err;
              })
        }

        return [error, responseData];
    }

    //----------------------------------------------
    //Get the read / unread counts of the broadcast messages of an asset
    this.getReadUnReadBroadMessageCount = async function(request) {
        console.log("getReadUnReadBroadMessageCount: request : " + JSON.stringify(request));
    
        let error = false,
            responseData = [];
    
        try {
            let paramsArr = new Array(
                request.asset_id,
                request.organization_id
            );
            let queryString = util.getQueryString(
                "ds_p1_broadcast_transaction_select_asset_count",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        console.log("getReadUnReadBroadMessageCount : query : Error " + error);
                    });
            }
        } catch (err) {
            console.log("getReadUnReadBroadMessageCount : Error " + err);
        }
    
        return [error, responseData];
    }

    this.assetListUpdateFlagOrganizationMgmt = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.account_id,
              request.workforce_id,
              request.target_asset_id,
              request.asset_flag_organization_management,
              request.asset_admin_access_data
        ];

        const queryString = util.getQueryString('ds_p1_asset_list_update_flag_organization_mgmt', paramsArr);
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

        return [error, responseData];
    }

    this.assetListByEmail = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.asset_email_id
        ];

        const queryString = util.getQueryString('ds_v1_asset_list_select_operating_asset_email', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
              })
              .catch((err) => {
                  error = err;
              })
        }

        return [error, responseData];
    }

    this.assetCertificateSet = async (request) => {

        let responseData = [],
            error = true;

        const paramsArr = [     
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.professional_details,
            request.log_asset_id,
            util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_p1_asset_list_update_professional_details', paramsArr);
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

        return [error, responseData];
    }


    this.assetListUpdateTags = async (request) => {

        /*
            IF p_flag = 0 THEN update all tags
            IF p_flag = 1 THEN update tag_1
            IF p_flag = 2 THEN update tag_2
            IF p_flag = 3 THEN update tag_3
        */

        let responseData = [],
            error = true;
        
        const paramsArr = [     
            request.asset_id,
            request.tag_id_1,
            request.tag_id_2,
            request.tag_id_3,
            request.organization_id,
            request.workforce_id,
            request.account_id,
            request.flag || 0,
            request.log_asset_id,
            util.getCurrentUTCTime()
        ];

        
        const queryString = util.getQueryString('ds_p1_asset_list_update_tag', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
              .then((data) => {
                  error = false;
                  assetListHistoryInsert(request,request.asset_id,request.organization_id,224,util.getCurrentUTCTime(),(err,dat)=>{})
              })
              .catch((err) => {
                  error = err;
              })
        }

        return [error, responseData];
    }

    this.reporteeListByRoleOfAManager = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id,
              request.manager_asset_id,
              request.asset_type_id,
              request.page_start,
              request.page_limit
        ];

        const queryString = util.getQueryString('ds_v1_asset_list_select_role_reportees', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
              })
              .catch((err) => {
                  error = err;
              })
        }

        return [error, responseData];
    }    
    this.fetchCompanyDefaultAssetName = async function (request) {
        let assetName = 'greneOS',
            error = true,
            idOrganization = 1;
        let assetId = 100;
        if(request.is_pam){
            assetId = 9841;
            idOrganization = 351;
        }

        let paramsArr = new Array(
            idOrganization,
            assetId
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    assetName = data[0].asset_first_name;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, assetName];
    };

    this.getDeskAssetArchiveList = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.asset_id,
              request.page_start,
              request.page_limit
        ];

        const queryString = util.getQueryString('ds_p1_asset_archive_list_select_asset_id', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
              })
              .catch((err) => {
                  error = err;
              })
        }

        return [error, responseData];
    }  

    this.getEmailResourceList = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = [
            request.organization_id,
            request.operating_asset_email
        ];

        const queryString = util.getQueryString('ds_p1_asset_list_select_email_all', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }

        return [error, responseData];
    }


    this.sendSms = async (countryCode, phoneNumber, smsMessage) =>{
        console.log("sendSms :: "+countryCode+" : "+phoneNumber)
        let domesticSmsMode = await cacheWrapper.getSmsMode('domestic_sms_mode');
            switch (parseInt(domesticSmsMode)) {
                case 1: // SinFini
                        console.log("sendSms :: "+domesticSmsMode)
                        util.pamSendSmsSinfini(smsMessage, countryCode, phoneNumber, function(err,res){
                            if(err === false) {
                                console.log('SinFini Message sent!',res);
                            }else{
                                console.log('SinFini Message Not sent!',res);
                            }
                        });
                        break;
                case 2: // mVayoo
                        util.pamSendSmsMvaayoo(text, countryCode, phoneNumber, function(err,res){
                            if(err === false) {
                                console.log('mVayoo Message sent!',res);
                            }
                        });
                        break;
                default:
                    console.log('sendSms :: In default');
            }
    };    
    
    this.getAssetTypeList = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.asset_type_category_id,
            request.asset_type_id,
            request.start_from || 0,
            request.limit_value || 20                    
        );
        const queryString = util.getQueryString('ds_p1_1_asset_list_select_asset_type', paramsArr);
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

    this.getAssetTimelineAssetFlag = async function (request) {
        let responseData = [],
            error = true;

       let paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
            request.flag || 1,
            request.datetime_start,
	        request.datetime_end,
            request.start_from || 0,
            request.limit_value || 20               
        );
        const queryString = util.getQueryString('Ds_p1_asset_timeline_transaction_select_asset_flag', paramsArr);
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

    this.assetListAssetTypeCategorySearch = async function (request) {
        let responseData = [],
            error = true;

       let paramsArr = new Array(
        request.organization_id,
        request.account_id,
        request.workforce_id,
        request.asset_type_category_id,
        request.search_string,
        request.asset_type_id,
        request.workforce_tag_id,
        request.start_from,
        request.limit_value            
        );
        const queryString = util.getQueryString('ds_p2_asset_list_search_asset_type_category', paramsArr);
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

    this.emailVerifyRequest = async function(request) {
        try {

            let [error, assetDetails] = await this.assetDetailsByEmail(request);

            if(assetDetails.length == 0) {
                return [true, {}];
            }
            let [err, rateLimit] = await this.checkIfEmailOTPRateLimitExceeded(request);
           
            if(rateLimit.length > 0 && rateLimit[0].passcode_count >= 5){
                return [false, { message: `OTP rate limit exceeded!`}];
                
            }


            let verificationCode = util.getVerificationCode();

            sendCallOrSms(3, '', '', verificationCode, request);

            request.email_passcode = verificationCode;

            this.updatePasscodeBasedOnEmail(request);;

            this.insertEmailTransaction(request);

            return [false, {}];

        } catch(e) {
            console.log("emailVerifyRequest error", e, e.stack);
            return [true, {}];
        }
    }

    this.emailPasscodeVerification = async function(request) {
        try {
            let [err,assetDetails] = await this.assetDetailsByEmail(request);

            console.log("assetDetails[0].asset_email_passcode", assetDetails[0].asset_email_passcode);
            if(Number(request.verification_code) !== Number(assetDetails[0].asset_email_passcode)) {
                return [true, {}];
            }
            

            this.emailVerifyFlagUpdate(request);

            return [false, {}];

        } catch(e) {
            console.log("emailPasscodeVerification", e, e.stack);
            return [true, {}];
        }
    }

    this.assetDetailsByEmail = async function (request) {
        let responseData = [],
            error = true;

       let paramsArr = new Array(
            request.organization_id,
            request.email
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_email_all', paramsArr);
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

    this.updatePasscodeBasedOnEmail = async function (request) {
        let responseData = [],
            error = true;
            
       let paramsArr = new Array(
            request.asset_id, 
            request.organization_id, 
            request.email_passcode, 
            util.addMinutes(util.getCurrentUTCTime(), 10), 
            request.log_asset_id || request.asset_id, 
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_email_passcode', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = {};
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    };

    this.insertEmailTransaction = async function (request) {
        let responseData = [],
            error = true;
            
       let paramsArr = new Array(
            request.email,
            request.email_passcode,
            util.getCurrentUTCTime(),
            util.addMinutes(util.getCurrentUTCTime(), 10),
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_email_passcode_transaction_insert', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = {};
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    };

    this.emailVerifyFlagUpdate = async function (request) {
        let responseData = [],
            error = true;
            
       let paramsArr = new Array(
            request.email,
            request.workforce_id, 
            request.account_id, 
            request.organization_id,  
            1
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_email_verified', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = {};
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    };
    this.checkIfEmailOTPRateLimitExceeded=async function(request) {
  
        let responseData = [],
            error = true;           
        let paramsArr = new Array(
            request.email,
            util.substractMinutes(util.getCurrentUTCTime(), 60),
            util.getCurrentUTCTime()

        );
        const queryString = util.getQueryString('ds_p1_email_passcode_transaction_select_passcode_count', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }
    this.activityAssetMappingAssetCategorySelect = async function (request) {
        let responseData = [],
            error = true;
            
       let paramsArr = new Array(
        request.asset_id,
        request.organization_id,
        request.account_id,
        request.activity_type_category_id,
        request.start_from,
        request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_2_activity_asset_mapping_select_asset_category', paramsArr);
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
    
    //organizationListInsert
    this.organization_List_Insert = async function (request) {
        let responseData = [],
            error = true;    
        const paramsArr = new Array(
            request.organization_name,
            request.organization_domain,
            request.organization_image_path,
            request.organization_address,
            request.organization_phone_country_code,
            request.organization_phone_number,
            request.organization_email,
            request.organization_one_time_set_up_fee,
            request.organization_monthly_subscription_charges,
            request.organization_dotpe_transaction_fee,
            request.organization_payment_service_charges,
            request.contact_person,
            request.contact_phone_country_code,
            request.contact_phone_number,
            request.contact_email,
            request.org_enterprise_feature_data,
            request.flag_email,
            request.flag_doc_repo,
            request.flag_ent_features,
            request.flag_ai_bot,
            request.flag_manager_proxy,
            request.flag_enable_form_tag,
            request.flag_enable_sip_module,
            request.flag_enable_elasticsearch,
            request.org_exchange_server_url,
            request.org_exchange_server_domain,
            request.flag_enable_calendar,
            request.flag_enable_grouping,
            request.organization_type_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_7_organization_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    
                    addUser(request.organization_phone_country_code +''+request.organization_phone_number, global.config.pam_user_pool_id);
                    
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };


      //Organization list update
      this.organizationListUpdateFees = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_one_time_set_up_fee,
            request.organization_monthly_subscription_charges,
            request.organization_dotpe_transaction_fee,
            request.organization_payment_service_charges,
            request.organization_id,
        );
        const queryString = util.getQueryString('ds_p1_organization_list_update_fees', paramsArr);

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
        return [error, responseData];
    };

    this.assetListSearchUnassignedDesk = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.account_id,
          request.workforce_id,
          request.asset_type_category_id,
          request.search_string,
          request.start_from,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_asset_list_search_previous', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };

    this.assetListSearchManger = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.account_id,
          request.workforce_id,
          request.asset_id,
          request.asset_type_category_id,
          request.search_string,
          request.start_from,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_asset_list_search_manager', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };


    async function addUser(username, pool_id) {
        // console.log('Adding ', pool_id);
         console.log('*******************');
         console.log('Adding : ', username);
 
         let userAttr = [];
       
         if(username.toString().indexOf('@') > -1) {
             userAttr.push({
                 Name: 'email', /* required */
                 Value: username
             },{
                 Name : "email_verified",
                 Value : "true"
             });
             
         } else {
             userAttr.push({
                 Name: 'phone_number', /* required */
                 Value: username
               });
         }
 
 
         let params = {
             UserPoolId: pool_id, //global.config.user_pool_id,
             Username: username,
             
             //TemporaryPassword: 'STRING_VALUE',
             UserAttributes: userAttr,
             MessageAction : "SUPPRESS"          
           };
 
         await new Promise((resolve, reject)=>{
             cognitoidentityserviceprovider.adminCreateUser(params, (err, data) => {
                 if (err) {
                     console.log(err, err.stack); // an error occurred
                 } else {
                 console.log(data);           // successful response
                 }
     
                 //After 5 seconds get the added user from cognito and add it to the redis layer
                 console.log('Beofre setTimeout 5 Seconds');
                 setTimeout(()=>{ getUser(username, pool_id) }, 5000);
                 resolve();
             });
         });
     
         return "success";	  
     }
     

     async function getUser(username, pool_id) {
        let params = {
            UserPoolId: pool_id, //global.config.user_pool_id,
            Username: username
          };
          cognitoidentityserviceprovider.adminGetUser(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.log('data : ', data.Username);
                let userAttributes = data.UserAttributes;
                
                for(const i_iterator of userAttributes) {
                    console.log("i_iterator.Name", i_iterator.Name)
                    if(i_iterator.Name === 'phone_number' || i_iterator.Name === 'email') {
                        console.log('Phone Number: ', i_iterator.Value);

                        cacheWrapper.setUserNameFromAccessToken(data.Username, i_iterator.Value);
                    }
                }
            }
          });

        return "success";
    }

    this.assetListUpdateLastSeenDateTime = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id, 
            request.asset_id, 
            request.location_datetime, 
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_updated_last_seen_datetime', paramsArr);

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
        return [error, responseData];
    };

    this.getAssetListForSelectedManager = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.manager_asset_id,
            request.workforce_tag_id,
            request.workforce_id,
            request.account_id,
            request.asset_tag_id_1,
            request.asset_type_id,
            request.asset_tag_type_id_1,
            request.asset_tag_id_2,
            request.asset_tag_id_3,
            request.target_asset_id || 0,
            request.flag,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_4_asset_list_select_manager', paramsArr);
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

    this.sendCallOrSmsV1 = async (verificationMethod, countryCode, phoneNumber, verificationCode, request) => {
      await  sendCallOrSms(verificationMethod, countryCode, phoneNumber, verificationCode, request);
    };

    this.getAssetCategoryTargets = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.asset_id,
            request.manager_asset_id,
            request.flag_type,
            request.organization_id,
            request.widget_type_id,
            request.account_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.activity_type_category_id,
            request.start_from || 0,
            request.limit_value || 100
        );
        const queryString = util.getQueryString('ds_p1_2_activity_asset_mapping_select_asset_category_targets', paramsArr);
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

    this.individualTargetListing = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_type_id,
            request.workforce_id,
            request.workforce_tag_id,
            request.cluster_tag_id,
            request.vertical_tag_id,
            request.subvertical_tag_id,
            request.flag,
            request.sort_flag,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p2_asset_list_select_flag', paramsArr);
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

    this.assetListForAssetReference = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id, 
            request.account_id, 
            request.workforce_id, 
            request.workforce_tag_id,
            request.asset_id,
            request.activity_id,
            request.asset_type_id,
            request.asset_type_category_id, 
            request.flag_filter,
            request.form_id,
            request.search_string, 
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_4_asset_list_select_asset_reference', paramsArr);
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
}
module.exports = AssetService;


