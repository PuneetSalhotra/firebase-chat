/* 
 * author: Sri Sai Venkatesh
 */

function ActivityService(objectCollection) {

    var db = objectCollection.db;
    var cacheWrapper = objectCollection.cacheWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
    var queueWrapper = objectCollection.queueWrapper;
    var activityPushService = objectCollection.activityPushService;

    this.addActivity = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        var activityData = {activity_id: request.activity_id};
        request['datetime_log'] = logDatetime;
        var activityTypeCategroyId = Number(request.activity_type_category_id);

        new Promise((resolve, reject) => {
            if (activityTypeCategroyId !== 8)
                return resolve();
            updateMailInlineJson(request, function (err, updatedJson) {
                if (err === false) {
                    request.activity_inline_data = updatedJson;
                    return resolve();
                }
            });
            //kafkaProducer.on('ready', resolve);
        }).then(() => {
            activityListInsert(request, function (err, boolResult) {
                activityCommonService.updateAssetLocation(request, function (err, data) {});
                if (err === false) {

                    var activityStreamTypeId = 1;
                    var activityAssetMappingAsset = Number(request.asset_id);
                    var updateTypeId = 0;
                    switch (activityTypeCategroyId) {
                        case 1: // to-do
                            activityStreamTypeId = 401;
                            break;
                        case 2: // notepad 
                            activityStreamTypeId = 501;
                            break;
                        case 3: //plant
                            break;
                        case 4: //employee id card
                            activityStreamTypeId = 101;
                            var employeeJson = JSON.parse(request.activity_inline_data);
                            activityAssetMappingAsset = employeeJson.employee_asset_id;
                            break;
                        case 5: //Co-worker Contact Card
                            activityStreamTypeId = 203;
                            break;
                        case 6: //  External Contact Card - Customer
                            activityStreamTypeId = 1103;
                            break;
                        case 7: //  speed Dial Contact 
                            activityStreamTypeId = 1;
                            break;
                        case 8: //  Mail
                            activityStreamTypeId = 1701;
                            break;
                        case 9: //form
                            activityStreamTypeId = 701;
                            break;
                        case 10:    //document
                            activityStreamTypeId = 301;
                            break;
                        case 11:    //folder
                            activityStreamTypeId = 1401;
                            break;
                        case 14:    //voice call
                            activityStreamTypeId = 801;
                            break;
                        case 15:    //video conference
                            activityStreamTypeId = 1601;
                            break;
                        case 28:    // post-it
                            activityStreamTypeId = 901;
                            break;
                        case 29:    // External Contact Card - Supplier
                            activityStreamTypeId = 1203;
                            break;
                        case 30:    //contact group
                            activityStreamTypeId = 1301;
                            break;
                            //Added by Nani Kalyan
                        case 31:    //Calendar Event
                            activityStreamTypeId = 501;
                            break;
                            //Added by Nani Kalyan
                        case 32:    //Customer Request
                            activityStreamTypeId = 601;
                            break;
                            //Added by Nani Kalyan
                        case 33:    //Visitor Request
                            activityStreamTypeId = 1301;
                            break;
                            //Added by Nani Kalyan
                        case 34:    //Time Card
                            activityStreamTypeId = 1501;
                            break;
                            /////////////////////////////////
                        default:
                            activityStreamTypeId = 1;   //by default so that we know
                            //console.log('adding streamtype id 1');
                            global.logger.write('debug','adding streamtype id 1', request)
                            break;

                    }
                    ;
                    //console.log('streamtype id is: ' + activityStreamTypeId)
                    global.logger.write('debug','streamtype id is: ' + activityStreamTypeId, request)
                    assetActivityListInsertAddActivity(request, function (err, status) {
                        if (err === false) {

                            // do the timeline transactions here..                    

                            activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                            });
                            activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                            });
                            activityCommonService.activityListHistoryInsert(request, updateTypeId, function (err, restult) {

                            });
                            activityCommonService.assetActivityListHistoryInsert(request, activityAssetMappingAsset, 0, function (err, restult) {

                            });
                            callback(false, activityData, 200);
                            
                            /*if (request.hasOwnProperty('device_os_id')) {
                                if (Number(request.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            global.logger.write('serverError','error in setting in asset parity' + err, request)
                                        } else
                                            //console.log("asset parity is set successfully")
                                            global.logger.write('debug','asset parity is set successfully', request)

                                    });
                                }
                            }*/

                            cacheWrapper.setMessageUniqueIdLookup(request.message_unique_id, request.activity_id, function (err, status) {
                                if (err) {
                                    //console.log("error in setting in message unique id look up");
                                    global.logger.write('"error in setting in message unique id look up' + err, request)
                                } else
                                    //console.log("message unique id look up is set successfully")
                                    global.logger.write('debug','message unique id look up is set successfully', request)
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
        }).catch((err) => {
            //console.log(err);
            global.logger.write('serverError',err, request)
        });
    };

    var updateMailInlineJson = function (request, callback) {
        var mailJson = JSON.parse(request.activity_inline_data);
        var finalJson = {};
        forEachAsync(Object.keys(mailJson), function (next, mailData) {
            if (mailJson[mailData] !== null && typeof mailJson[mailData] === 'object') {
                var tempRefernceArr = new Array();
                forEachAsync(mailJson[mailData], function (next, referenceData, index) {
                    activityCommonService.getActivityDetails(request, Number(referenceData.activity_id), function (err, activityData) {
                        if (err === false) {
                            referenceData.organization_id = activityData[0]['organization_id'];
                            referenceData.account_id = activityData[0]['account_id'];
                            referenceData.workforce_id = activityData[0]['workforce_id'];
                            referenceData.asset_id = activityData[0]['asset_id'];
                            tempRefernceArr.push(referenceData);
                            next();
                        }
                    });
                }).then(function () {
                    finalJson[mailData] = tempRefernceArr;
                    next();
                });
            } else {
                finalJson[mailData] = mailJson[mailData];
                next();
            }
        }).then(function () {
            callback(false, JSON.stringify(finalJson));
        });
    };

    var activityListInsert = function (request, callback) {
        var paramsArr = new Array();
        var activityInlineData = JSON.parse(request.activity_inline_data);
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        var activityChannelId = 0;
        var activityChannelCategoryId = 0;
        var activityStatusId = 0;
        var activityFormId = 0;
        if (request.hasOwnProperty('activity_channel_id'))
            activityChannelId = request.activity_channel_id;
        if (request.hasOwnProperty('activity_channel_category_id'))
            activityChannelCategoryId = request.activity_channel_category_id;
        if (request.hasOwnProperty('activity_status_id'))
            activityStatusId = request.activity_status_id;
        if (request.hasOwnProperty('activity_form_id'))
            activityFormId = request.activity_form_id;
        
        //BETA
        var activitySubTypeId = (request.hasOwnProperty('activity_sub_type_id')) ? request.activity_sub_type_id : 0;
        
        switch (activityTypeCategoryId) {
            case 2:    // notepad
                /*
                 * 
                 * 
                 * 
                 IN p_channel_activity_id BIGINT(20), IN p_channel_activity_type_category_id TINYINT(4)
                 */
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
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
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                        );
                break;
            case 3: // plant activity            
            case 4:    // id card            
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
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
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                        );
                break;
            case 5: // coworker card
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
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
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                        );
                break;
            case 29:    // contact supplier
            case 6:    // contact customer
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        activityInlineData.contact_asset_id, //contact asset id
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
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
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                        );
                break;
            case 8: // mail
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
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
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                        );
                break;
            case 9:// form
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
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
                        activityFormId,
                        request.form_transaction_id,
                        activityChannelId,
                        activityChannelCategoryId
                        );
                break;
            case 28:    //post it
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
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
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                        );
                break;
            case 10:
                var ownerAssetID;
                if(request.hasOwnProperty('owner_asset_id')) {
                      ownerAssetID = request.owner_asset_id;
                } else {
                      ownerAssetID = request.asset_id;
                }
                
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        ownerAssetID,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                        );
               break;
            default:
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
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
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                        );
                break;
        }
        ;
        paramsArr.push(request.track_latitude);
        paramsArr.push(request.track_longitude); 
        paramsArr.push(activitySubTypeId);
        
        //var queryString = util.getQueryString('ds_v1_activity_list_insert', paramsArr);
        var queryString = util.getQueryString('ds_v1_activity_list_insert_sub_type', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    //BETA        
                    if(activityTypeCategoryId === 10 && (request.asset_id !== ownerAssetID)) {
                        var paramsArr1 = new Array(
                                request.activity_id,
                                request.asset_id,
                                request.workforce_id,
                                request.account_id,
                                request.organization_id,
                                29, //request.participant_access_id,
                                request.message_unique_id,
                                request.flag_retry,
                                request.flag_offline,
                                request.asset_id,
                                request.datetime_log,
                                0 //Field Id
                                );
                        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_insert_asset_assign_appr', paramsArr1);
                        if (queryString !== '') {
                                db.executeQuery(0, queryString, request, function (err, data) {
                                if (err === false) {
                                    callback(false, true);
                                    return;
                                } else {
                                    callback(err, false);
                                    return;
                                    }
                              });
                          }
                    } else {
                        callback(false, true);
                        return;
                    }
                
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

    /*var checkActivityStatusChangeEligibility = function (request, calback) {
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
     */

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
                    //console.log(err);
                    global.logger.write('serverError',err, request)
                    return;
                }
            });
        }
    };

    var assetActivityListUpdateStatus = function (request, activityStatusId, activityStatusTypeId, callback) {
        var paramsArr = new Array();
        activityCommonService.getAllParticipants(request, function (err, participantsData) {
            if (err === false) {
                participantsData.forEach(function (rowData, index) {
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
                    db.executeQuery(0, queryString, request, function (error, queryResponse) { });
                }, this);
                callback(false, true);
                return;
            } else {
                // some thing is wrong and have to be dealt
                callback(true, false);                
                return;
            }
        });
    };

    var getFormTransactionRecords = function (request, formTransactionId, formId, callback) {
        var paramsArr = new Array(
                formTransactionId,
                formId,
                request.organization_id
                );
        queryString = util.getQueryString('ds_v1_activity_form_transaction_select', paramsArr);
        db.executeQuery(1, queryString, request, function (err, data) {
            if (err === false) {
                callback(false, data);
            }
        });
    };

    var duplicateFormTransactionData = function (request, callback) {

        activityCommonService.getActivityDetails(request, 0, function (err, activityData) {    // get activity form_id and form_transaction id
            var formTransactionId = activityData[0].form_transaction_id;
            var formId = activityData[0].form_id;
            getFormTransactionRecords(request, formTransactionId, formId, function (err, formTransactionData) { // get all form transaction data
                if (err === false) {
                    var finalFormTransactionData = {};
                    forEachAsync(formTransactionData, function (next, rowData) {
                        var objectKey = rowData['field_id'] + '' + rowData['data_type_combo_id'];
                        finalFormTransactionData[objectKey] = rowData;
                        next();
                    }).then(function () {
                        var finalFormTransactionKeys = (Object.keys(finalFormTransactionData));
                        forEachAsync(finalFormTransactionKeys, function (next, keyValue) {
                            var paramsArr = new Array(
                                    finalFormTransactionData[keyValue].form_transaction_id,
                                    finalFormTransactionData[keyValue].form_id,
                                    finalFormTransactionData[keyValue].field_id,
                                    finalFormTransactionData[keyValue].data_type_combo_id,
                                    finalFormTransactionData[keyValue].activity_id,
                                    finalFormTransactionData[keyValue].asset_id,
                                    finalFormTransactionData[keyValue].workforce_id,
                                    finalFormTransactionData[keyValue].account_id,
                                    finalFormTransactionData[keyValue].organization_id,
                                    util.replaceDefaultDate(finalFormTransactionData[keyValue].data_entity_date_1),
                                    util.replaceDefaultDatetime(finalFormTransactionData[keyValue].data_entity_datetime_1),
                                    finalFormTransactionData[keyValue].data_entity_tinyint_1,
                                    finalFormTransactionData[keyValue].data_entity_bigint_1,
                                    finalFormTransactionData[keyValue].data_entity_double_1,
                                    finalFormTransactionData[keyValue].data_entity_decimal_1,
                                    finalFormTransactionData[keyValue].data_entity_decimal_2,
                                    finalFormTransactionData[keyValue].data_entity_decimal_3,
                                    finalFormTransactionData[keyValue].data_entity_text_1,
                                    '', //  p_entity_text_2 VARCHAR(4800)
                                    request.track_latitude,
                                    request.track_longitude,
                                    request.track_gps_accuracy,
                                    request.track_gps_status,
                                    '',
                                    '',
                                    '',
                                    '',
                                    request.device_os_id,
                                    '',
                                    '',
                                    request.app_version,
                                    request.service_version,
                                    finalFormTransactionData[keyValue].log_asset_id,
                                    finalFormTransactionData[keyValue].log_message_unique_id,
                                    0,
                                    request.flag_offline,
                                    util.replaceDefaultDatetime(finalFormTransactionData[keyValue].form_transaction_datetime),
                                    request.datetime_log
                                    );
                            var queryString = util.getQueryString('ds_v1_activity_form_transaction_analytics_insert', paramsArr);
                            if (queryString != '') {
                                db.executeQuery(0, queryString, request, function (err, data) {
                                    next();
                                    if (err === false) {
                                        //callback(false, true);
                                        //return;
                                    } else {
                                        // some thing is wrong and have to be dealt
                                        //callback(err, false);
                                        //return;
                                    }
                                });
                            }
                        }).then(function () {
                            callback(false, {formTransactionId: formTransactionId, formId: formId});
                        });
                    });
                } else {
                    //console.log('error while fetching from transaction data');
                    global.logger.write('serverError','error while fetching from transaction data', request)
                }
            });
        });
    };

    this.alterActivityStatus = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityStreamTypeId = 11;
        var activityStatusTypeCategoryId = Number(request.activity_status_type_category_id);
        var activityStatusId = Number(request.activity_status_id);
        var activityStatusTypeId = Number(request.activity_status_type_id);
        var activityTypeCategoryId = Number(request.activity_type_category_id);

        if (request.hasOwnProperty('activity_type_category_id')) {
            var activityTypeCategroyId = Number(request.activity_type_category_id);
            switch (activityTypeCategroyId) {
                case 1: // to-do 
                    activityStreamTypeId = 404;
                    break;
                case 2: // notepad 
                    //activityStreamTypeId = 504;
                    break;
                case 3: //plant
                    break;
                case 4: //employee id card
                    activityStreamTypeId = 11;  // nothing defined yet
                    break;
                case 5: //Co-worker Contact Card
                    activityStreamTypeId = 208;
                    break;
                case 6: //  External Contact Card - Customer
                    activityStreamTypeId = 1108;
                    break;
                    //Added by Nani Kalyan
                case 8: //Mail 
                    activityStreamTypeId = 1702;
                    break;
                    ////////////////////////////////
                case 9: //form
                    activityStreamTypeId = 704;
                    break;
                case 10:    //document
                    activityStreamTypeId = 305;
                    break;
                case 11:    //folder
                    activityStreamTypeId = 1402;
                    break;
                case 14:    //voice call
                    activityStreamTypeId = 802; //Added by Nani Kalyan
                    break;
                case 15:    //video conference
                    activityStreamTypeId = 1602; //Added by Nani Kalyan
                    break;
                case 28:    // post-it
                    activityStreamTypeId = 903;
                    break;
                case 29:    // External Contact Card - Supplier
                    activityStreamTypeId = 1208;
                    break;
                case 30:    //contact group
                    activityStreamTypeId = 11;  // non existent now 
                    break;
                    //Added by Nani Kalyan
                case 31: //Calendar Event 
                    activityStreamTypeId = 502;
                    break;
                    //Added by Nani Kalyan
                case 32: //Customer Request
                    activityStreamTypeId = 602;
                    break;
                    //Added by Nani Kalyan
                case 33: //Visitor Request 
                    activityStreamTypeId = 1302;
                    break;
                    //Added by Nani Kalyan
                case 34: //Time Card 
                    activityStreamTypeId = 1502;
                    break;
                default:
                    activityStreamTypeId = 11;   //by default so that we know
                    //console.log('adding streamtype id 11');
                    global.logger.write('debug','adding streamtype id 11', request)
                    break;

            }
            ;
            request.activity_stream_type_id = activityStreamTypeId;
        }
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        activityListUpdateStatus(request, function (err, data) {
            if (err === false) {
                assetActivityListUpdateStatus(request, activityStatusId, activityStatusTypeId, function (err, data) {

                });
                activityCommonService.activityListHistoryInsert(request, 402, function (err, result) {

                });
                activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                });
                activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                });
                activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {

                });
                activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {

                });
                activityPushService.sendPush(request, objectCollection, 0, function () {});
                if (activityTypeCategoryId === 9 && activityStatusTypeId === 23) {   //form and submitted state                    
                    duplicateFormTransactionData(request, function (err, data) {
                        var widgetEngineQueueMessage = {
                            form_id: data.formId,
                            form_transaction_id: data.formTransactionId,
                            organization_id: request.organization_id,
                            account_id: request.account_id,
                            workforce_id: request.workforce_id,
                            asset_id: request.asset_id,
                            activity_id: request.activity_id,
                            activity_type_category_id: request.activity_type_category_id,
                            activity_stream_type_id: request.activity_stream_type_id,
                            track_gps_location: request.track_gps_location,
                            track_gps_datetime: request.track_gps_datetime,
                            track_gps_accuracy: request.track_gps_accuracy,
                            track_gps_status: request.track_gps_status,
                            device_os_id: request.device_os_id,
                            service_version: request.service_version,
                            app_version: request.app_version,
                            api_version: request.api_version
                        };
                        var event = {
                            name: "Form Based Widget Engine",
                            payload: widgetEngineQueueMessage
                        };
                        queueWrapper.raiseFormWidgetEvent(event, request.activity_id);

                    });
                }

                /*if (request.hasOwnProperty('device_os_id')) {
                    if (Number(request.device_os_id) !== 5) {
                        //incr the asset_message_counter                        
                        cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                            if (err) {
                                //console.log("error in setting in asset parity");
                                global.logger.write('serverError','error in setting in asset parity - ' + err, request)
                            } else
                                //console.log("asset parity is set successfully")
                                global.logger.write('debug','asset parity is set successfully', request)

                        });
                    }
                }*/
                callback(false, {}, 200);
                return;
            } else {
                callback(err, {}, -9998);
                return;
            }

        });



    };
}
;
module.exports = ActivityService;
