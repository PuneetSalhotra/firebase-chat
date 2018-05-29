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
    var responseactivityData = {}
    this.addActivity = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        responseactivityData = {activity_id: request.activity_id};
        request['datetime_log'] = logDatetime;
        var activityTypeCategroyId = Number(request.activity_type_category_id);
        new Promise((resolve, reject) => {
            if (activityTypeCategroyId !== 8)
                return resolve();
            updateMailInlineJson(request, function (err, updatedJson) {
                if (err === false) {
                    request.activity_inline_data = updatedJson;
                    return resolve();
                } else {
                    callback(true, false);
                    //return reject();
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
                            //PAM
                        case 36:    //Menu Item
                            activityStreamTypeId = 19001;
                            break;
                        case 37:    //Reservation
                            activityStreamTypeId = 18001;
                            break;
                        case 38:    //Item Order
                            activityStreamTypeId = 21001;
                            break;
                        case 39:    //Inventory
                            activityStreamTypeId = 20001;
                            break;
                        case 40:    //Payment
                            activityStreamTypeId = 22004;
                            break;
                        case 41:    //Event
                            activityStreamTypeId = 17001;
                            break;
                        case 42: //PAM Enquiry
                            activityStreamTypeId = 1801;
                            var inlineJson = JSON.parse(request.activity_inline_data);
                            util.pamSendSmsMvaayoo('Dear Sir/Madam, Our executive will contact you soon.', inlineJson.country_code, inlineJson.phone_number, function (err, res) {});
                            break;
                        default:
                            activityStreamTypeId = 1; //by default so that we know
                            //console.log('adding streamtype id 1');
                            global.logger.write('debug', 'adding streamtype id 1', {}, request);
                            break;
                    }
                    ;
                    //console.log('streamtype id is: ' + activityStreamTypeId)
                    global.logger.write('debug', 'streamtype id is: ' + activityStreamTypeId, {}, request);
                    assetActivityListInsertAddActivity(request, function (err, status) {
                        if (err === false) {
                            if(activityTypeCategroyId === 10 && request.hasOwnProperty('owner_asset_id')) {
                                    if(request.owner_asset_id !== request.asset_id){
                                        activityPushService.sendPush(request, objectCollection, 0, function () {});
                                        activityCommonService.updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) { });
                                    }
                                }
                                
                            if(activityTypeCategroyId === 10 && Number(request.activity_sub_type_id) === 1) {
                                updateTaskCreatedCnt(request).then(()=>{});
                            }
                            // do the timeline transactions here..                    

                            activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                            });
                            activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                            });
                            activityCommonService.activityListHistoryInsert(request, updateTypeId, function (err, restult) {

                            });
                            activityCommonService.assetActivityListHistoryInsert(request, activityAssetMappingAsset, 0, function (err, restult) {

                            });
                            if (request.hasOwnProperty('activity_parent_id')) {
                                if (util.hasValidGenericId(request, 'activity_parent_id')) {
                                    activityCommonService.getActivityDetails(request, Number(request.activity_parent_id), function (err, activityData) {
                                        if (err === false) {
                                            switch (Number(activityData[0]['activity_type_category_id'])) {
                                                case 6:
                                                case 29:
                                                case 43:
                                                case 44:
                                                    //update the p_parent_activity_id's end estimated datetime
                                                    var coverAlterJson = {};
                                                    coverAlterJson.title = {old: activityData[0]['activity_title'], new : activityData[0]['activity_title']};
                                                    coverAlterJson.duedate = {old: activityData[0]['activity_title'], new : activityData[0]['activity_title']};
                                                    // get the updated estimated datetime of project.
                                                    var newParamsArr = new Array(
                                                            request.activity_parent_id,
                                                            request.workforce_id,
                                                            request.account_id,
                                                            request.organization_id,
                                                            0, 1
                                                            );
                                                    var queryString = util.getQueryString('ds_p1_activity_list_select_project_tasks', newParamsArr);
                                                    if (queryString != '') {
                                                        db.executeQuery(1, queryString, request, function (err, result) {
                                                            if (err === false) {
                                                                var newEndEstimatedDatetime = result[0]['activity_datetime_end_estimated'];
                                                                console.log('setting new datetime for contact as ' + newEndEstimatedDatetime);
                                                                coverAlterJson.description = {old: activityData[0]['activity_datetime_end_estimated'], new : newEndEstimatedDatetime};

                                                                var event = {
                                                                    name: "alterActivityCover",
                                                                    service: "activityUpdateService",
                                                                    method: "alterActivityCover",
                                                                    payload: {
                                                                        organization_id: request.organization_id,
                                                                        account_id: request.account_id,
                                                                        workforce_id: request.workforce_id,
                                                                        asset_id: request.asset_id,
                                                                        asset_token_auth: request.asset_token_auth,
                                                                        activity_id: request.activity_parent_id,
                                                                        activity_cover_data: JSON.stringify(coverAlterJson),
                                                                        activity_type_category_id: activityData[0]['activity_type_category_id'],
                                                                        activity_type_id: 1,
                                                                        activity_access_role_id: 1,
                                                                        activity_parent_id: 0,
                                                                        flag_pin: 0,
                                                                        flag_priority: 0,
                                                                        flag_offline: 0,
                                                                        flag_retry: 0,
                                                                        message_unique_id: util.getMessageUniqueId(request.asset_id),
                                                                        track_latitude: request.track_latitude,
                                                                        track_longitude: request.track_longitude,
                                                                        track_altitude: request.track_altitude,
                                                                        track_gps_datetime: request.track_gps_datetime,
                                                                        track_gps_accuracy: request.track_gps_accuracy,
                                                                        track_gps_status: request.track_gps_status,
                                                                        track_gps_location: request.track_gps_location,
                                                                        service_version: request.service_version,
                                                                        app_version: request.app_version,
                                                                        device_os_id: request.device_os_id
                                                                    }
                                                                };
                                                                queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                                                                    if (err) {
                                                                        //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                                                        //global.logger.write('serverError', "Error in queueWrapper raiseActivityEvent", err, request);
                                                                        throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }

                                                    break;
                                            }

                                        }
                                    });
                                }

                            }// end parent activity id condition
                            callback(false, responseactivityData, 200);
                            cacheWrapper.setMessageUniqueIdLookup(request.message_unique_id, request.activity_id, function (err, status) {
                                if (err) {
                                    //console.log("error in setting in message unique id look up");
                                    global.logger.write('"error in setting in message unique id look up', err, request);
                                } else
                                    //console.log("message unique id look up is set successfully")
                                    global.logger.write('debug', 'message unique id look up is set successfully', {}, request);
                            });
                            return;
                        } else {
                            console.log("not inserted to asset activity list");
                            callback(false, responseactivityData, 200);
                        }
                    });
                } else {
                    callback(err, responseactivityData, -9999);
                    return;
                }
            });
        }).catch((err) => {
//console.log(err);
            global.logger.write('serverError', '', err, request);
        });
    };
    var updateMailInlineJson = function (request, callback) {
        var mailJson = JSON.parse(request.activity_inline_data);
        var finalJson = {};
        forEachAsync(Object.keys(mailJson), function (next, mailData, index) {
            if (index === 'activity_reference') {
                //if (mailJson[mailData] !== null && typeof mailJson[mailData] === 'object') {
                var tempRefernceArr = new Array();
                forEachAsync(mailJson[mailData], function (next, referenceData) {
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
        //var expiryDateTime = "";
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
        //PAM
        var activitySubTypeName = (request.hasOwnProperty('activity_sub_type_name')) ? request.activity_sub_type_name : '';
        var expiryDateTime = (request.hasOwnProperty('expiry_datetime')) ? request.expiry_datetime : '';
        var itemOrderCount = (request.hasOwnProperty('item_order_count')) ? request.item_order_count : '0';        
             
        if(activityTypeCategoryId === 38){
            console.log('Inside sendPush');
            sendPushPam(request).then(() => {
            });
        }
        
        new Promise((resolve, reject)=>{            
            if(activityTypeCategoryId === 37 && !request.hasOwnProperty('member_code')) { //PAM
                var reserveCode;
                function generateUniqueCode() {
                    reserveCode = util.randomInt(5001,9999).toString();
                    activityCommonService.checkingUniqueCode(request,reserveCode, (err, data)=>{
                    if(err === false) {
                        console.log('activitySubTypeName : ' + data);
                        activitySubTypeName = data;
                        responseactivityData.reservation_code = data;
                        activityCommonService.getActivityDetails(request, request.activity_parent_id, function(err, resp){
                            if(err === false) {
                                var eventStartDateTime = util.replaceDefaultDatetime(resp[0].activity_datetime_start_expected);                                                                                                
                                (Math.sign(util.differenceDatetimes(eventStartDateTime ,request.datetime_log)) === 1) ? 
                                                   expiryDateTime = util.addUnitsToDateTime(eventStartDateTime,6.5,'hours') :
                                                   expiryDateTime = util.addUnitsToDateTime(request.datetime_log,6.5,'hours');                                           
                                return resolve();
                            } else {
                                return resolve();
                            }
                        })                        
                       } else {
                           generateUniqueCode();
                        }
                    });
                }
               generateUniqueCode(); 
            } else if(activityTypeCategoryId === 37 && request.hasOwnProperty('member_code')) {
                    activitySubTypeName = request.member_code;
                    responseactivityData.reservation_code = request.member_code;
                    activityCommonService.getActivityDetails(request, request.activity_parent_id, function(err, resp){
                                if(err === false) {
                                    var eventStartDateTime = util.replaceDefaultDatetime(resp[0].activity_datetime_start_expected);                                                                                                
                                    (Math.sign(util.differenceDatetimes(eventStartDateTime ,request.datetime_log)) === 1) ? 
                                                       expiryDateTime = util.addUnitsToDateTime(eventStartDateTime,6.5,'hours') :
                                                       expiryDateTime = util.addUnitsToDateTime(request.datetime_log,6.5,'hours');                                           
                                    return resolve();
                                } else {
                                    return resolve();
                                }
                            });
                } else {
                    return resolve();
                }                
            
        }).then(()=>{
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
            //PAM
            case 37:
                activitySubTypeId = 0;
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
            default:
                paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        itemOrderCount, //"",PAM
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
        paramsArr.push(activitySubTypeName); //PAM
        paramsArr.push(expiryDateTime); //PAM
                
        var queryString = util.getQueryString('ds_v1_activity_list_insert_pam', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    //BETA                            
                    if ((activityTypeCategoryId === 10 || activityTypeCategoryId === 11) && (request.asset_id !== ownerAssetID)) {
                        var paramsArr1 = new Array(
                                request.activity_id,
                                request.asset_id,
                                request.workforce_id,
                                request.account_id,
                                request.organization_id,
                                26, //request.participant_access_id,
                                request.message_unique_id,
                                request.flag_retry,
                                request.flag_offline,
                                request.asset_id,
                                request.datetime_log,
                                0 //Field Id
                                //'',
                                //-1
                                );
                        //var queryString = util.getQueryString('ds_v1_activity_asset_mapping_insert_asset_assign_appr_ingre', paramsArr1);
                        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_insert_asset_assign_appr', paramsArr1);
                        if (queryString !== '') {
                                db.executeQuery(0, queryString, request, function (err, data) {
                                if (err === false) {
                                     activityCommonService.updateLeadAssignedDatetime(request, request.asset_id, function (err, data) {

                                        });
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
        });
    };
     
                    
                    
            
    function sendPushPam(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    0,
                    request.activity_channel_category_id,
                    0,
                    50
                    );
            var queryString = util.getQueryString('ds_v1_asset_list_select_category', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, pushArns) {
                    if (err === false) {
                        var data = new Array();
                        forEachAsync(pushArns, function (next, rowData) {
                            if (rowData.asset_push_arn != null) {
                                data.push(rowData.asset_push_arn);
                            }
                            next();
                        }).then(() => {
                            console.log('ARNS : ', data);
                            if (data.length > 0) {
                                activityPushService.pamSendPush(request, data, objectCollection, function (err, resp) {});
                            } else {
                                console.log('No arns');
                            }

                            resolve();
                        })
                    }
                });
            }
        })
    }
    ;
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
                    global.logger.write('serverError', '', err, request)
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
                                    finalFormTransactionData[keyValue].data_entity_tinyint_2, //BETA
                                    finalFormTransactionData[keyValue].data_entity_bigint_1,
                                    finalFormTransactionData[keyValue].data_entity_double_1,
                                    finalFormTransactionData[keyValue].data_entity_decimal_1,
                                    finalFormTransactionData[keyValue].data_entity_decimal_2,
                                    finalFormTransactionData[keyValue].data_entity_decimal_3,
                                    finalFormTransactionData[keyValue].data_entity_text_1,
                                    '', //  p_entity_text_2 VARCHAR(4800)
                                    '', //  p_entity_text_3 VARCHAR(100) BETA
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
                            //var queryString = util.getQueryString('ds_v1_activity_form_transaction_analytics_insert', paramsArr);
                            var queryString = util.getQueryString('ds_v1_1_activity_form_transaction_analytics_insert', paramsArr); //BETA
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
                    global.logger.write('serverError', 'error while fetching from transaction data', {}, request)
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
        var assetParticipantAccessId = Number(request.asset_participant_access_id);
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
                    activityStreamTypeId = 11; // nothing defined yet
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
                    activityStreamTypeId = 11; // non existent now 
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
                    //PAM
                case 36:    //Menu Item
                    activityStreamTypeId = 19004;
                    break;
                case 37:    //Reservation
                    activityStreamTypeId = 18004;
                    break;
                    /*case 38:    //Item Order
                     activityStreamTypeId = 21001;
                     break;
                     case 39:    //Inventory
                     activityStreamTypeId = 20001;
                     break;*/
                case 40:    //Payment
                    activityStreamTypeId = 22007;
                    break;
                case 41:    //Event
                    activityStreamTypeId = 17004;
                    break;
                default:
                    activityStreamTypeId = 11; //by default so that we know
                    //console.log('adding streamtype id 11');
                    global.logger.write('debug', 'adding streamtype id 11', {}, request)
                    break;
            }
            ;
            request.activity_stream_type_id = activityStreamTypeId;
        }
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        activityListUpdateStatus(request, function (err, data) {
            if (err === false) {
                //PAM
                if(activityTypeCategroyId == 38) {
                    switch(Number(request.activity_status_type_id)) {
                        case 105: itemOrderAlterStatus(request).then(()=>{});
                                  updateStatusDateTimes(request).then(()=>{});
                                  break;
                        case 106: 
                        case 125: updateStatusDateTimes(request).then(()=>{});
                                  break;
                    }
                }

                //Remote Analytics
                if (activityTypeCategroyId == 28 || activityTypeCategroyId == 8) {
                    if (request.activity_status_type_id == 74 || request.activity_status_type_id == 19) {
                        avgTotRespTimePostItsInmailsSummaryInsert(request).then(() => {
                        });
                    }
                }

                //TaskList Analytics
                if (activityTypeCategroyId == 10 || request.activity_sub_type_id == 1) {
                    switch (Number(request.activity_status_type_id)) {
                        case 26://Closed 
                            updateFlagOntime(request).then(() => {
                            });
                            break;
                        case 130://Accepted 
                            //updateFlagOntime(request).then(()=>{});
                            break;
                        case 134: //Certified
                            updateFlagQuality(request).then(() => {
                            });
                            break;
                        case 135: //Not Certified
                            //updateFlagOntime(request).then(()=>{});
                            break;
                    }
                }

                //Inmail response < 24 hours
                if (activityTypeCategoryId === 8 && assetParticipantAccessId === 19) { //18 Sender //19 Receiver
                    respReqinMail(request).then(() => {
                        inMailMonthlySummaryTransInsert(request).then(() => {
                        });
                    });
                }
                switch (activityStatusTypeId) {

                    case 26:    //completed // flag value is 2
                        getTaskAcceptanceStats(request, 2).then((acceptanceStats) => { // weekly and monthly stats here    
                            acceptanceStatsSummaryInsert(request, acceptanceStats, {weekly: 5, monthly: 12}, function () {});
                        });
                        break;

                    case 130:// flag value is 1 //accepted

                        activityCommonService.updateLeadStatus(request, 1, function (err, result) {});
                        activityCommonService.updateOwnerStatus(request, 1, function (err, result) {});

                        getTaskAcceptanceStats(request, 1).then((acceptanceStats) => { // weekly and monthly stats here   
                            acceptanceStatsSummaryInsert(request, acceptanceStats, {weekly: 4, monthly: 11}, function () {});
                        });
                        getTaskAcceptanceStats(request, 5).then((acceptanceStats) => { // weekly and monthly stats here            
                            acceptanceStatsSummaryInsert(request, acceptanceStats, {weekly: 8, monthly: 8}, function () {});
                        });
                        break;
                        //rejected
                    case 131:
                        activityCommonService.updateLeadStatus(request, 2, function (err, result) {});
                        activityCommonService.updateOwnerStatus(request, 2, function (err, result) {});
                        getTaskAcceptanceStats(request, 3).then((acceptanceStats) => { // weekly and monthly stats here    
                            acceptanceStatsSummaryInsert(request, acceptanceStats, {weekly: 6, monthly: 13}, function () {});
                        });
                        getTaskAcceptanceStats(request, 4).then((acceptanceStats) => { //there is a gray area here     
                            acceptanceStatsSummaryInsert(request, acceptanceStats, {weekly: 7, monthly: 15}, function () {});
                        });
                        getTaskAcceptanceStats(request, 5).then((acceptanceStats) => { // weekly and monthly stats here     
                            acceptanceStatsSummaryInsert(request, acceptanceStats, {weekly: 8, monthly: 8}, function () {});
                        });
                        break;
                        //discussion
                    case 132:
                        activityCommonService.updateLeadStatus(request, 3, function (err, result) {});
                        activityCommonService.updateOwnerStatus(request, 3, function (err, result) {});
                        break;

                }

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

                callback(false, {}, 200);
                return;
            } else {
                callback(err, {}, -9998);
                return;
            }

        });
    };
    
    function updateStatusDateTimes(request) {
        return new Promise((resolve, reject)=>{
            var servedAtBar = (request.hasOwnProperty('served_at_bar'))? request.served_at_bar : 0;            
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.activity_id,
                request.activity_status_type_id,
                servedAtBar,
                request.asset_id,
                request.datetime_log
                );
            var queryString = util.getQueryString('ds_v1_activity_list_update_order_status_datetime', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, resp) {
                    if (err === false) {
                        activityCommonService.getAllParticipants(request, function(err, participantData){
                            if(err === false){
                                forEachAsync(participantData, function (next, x) {
                                    updateStatusDttmsParticipants(request, x.asset_id, servedAtBar).then(()=>{
                                        next();
                                    });                                    
                                    }).then(()=>{
                                        resolve();
                                    });
                            } else {
                                reject(err);
                            }                            
                        });
                    } else {                    
                        callback(err, false);
                    }
                });
            }
        });
        
    };
    
    function updateStatusDttmsParticipants(request, assetId, servedAtBar){
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.activity_id,
                assetId, //p_asset_id
                request.activity_status_type_id,
                servedAtBar,
                request.asset_id, //log_asset_id
                request.datetime_log
                );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_order_status_datetime', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, resp) {
                    (err === false)? resolve() : reject(err);
                });
            }
        });
    }
    
    
    function respReqinMail(request){
        return new Promise((resolve, reject)=>{            
            var activityFlagResponseRequired;
            var diff;
            activityCommonService.getActivityDetails(request, 0, function (err, resp) {
                if (err === false) {

                    //console.log('request.datetime_log : ',request.datetime_log);
                    //console.log('resp[0].activity_datetime_end_expected : ', util.replaceDefaultDatetime(resp[0].activity_datetime_end_expected));

                    //diff will be in milli seconds
                    diff = util.differenceDatetimes(request.datetime_log ,util.replaceDefaultDatetime(resp[0].activity_datetime_end_expected));                    
                    diff = diff / 3600000;
                    diff = Number(diff);
                    (diff <= 24) ? activityFlagResponseRequired = 1 : activityFlagResponseRequired = 0;
                    //console.log('DIFF : ', typeof diff);
                    //console.log('activityFlagResponseRequired : ', activityFlagResponseRequired);

                    var paramsArr = new Array(
                            request.organization_id,
                            request.account_id,
                            request.workforce_id,
                            request.activity_id,
                            request.asset_id,
                            activityFlagResponseRequired,
                            request.datetime_log
                            );
                    var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_inmail_response', paramsArr);
                    if (queryString !== '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                return resolve(false, true);
                            } else {
                                return reject(err, false);
                            }
                        });
                    }

                } else {
                    reject(err);
                }
            });
        });
    }
    ;
    //For inMails
    function inMailMonthlySummaryTransInsert(request) {
        return new Promise((resolve, reject) => {
            activityCommonService.getInmailCounts(request, function (err, data) {
                if (err === false) {
                    var percent = 0;
                    if (Number(data[0].countToBeRespondedInmails) !== 0) {
                        percent = (data[0].countOntimeRespondedInmails / data[0].countToBeRespondedInmails) * 100;
                    }

                    request.weekly_summary_id = 3;
                    request.entity_bigint_1 = data[0].countOntimeRespondedInmails; //entity_bigint_1, //ontimecount
                    request.entity_double_1 = data[0].countReceivedInmails; //entity_double_1, //total count
                    request.entity_decimal_1 = percent; //entity_decimal_1, //percentage
                    request.entity_decimal_2 = data[0].countToBeRespondedInmails; //entity_decimal_2, //toberesponsded                    
                    request.entity_text_1 = data[0].totalHours; //entity_text_1, 

                    //insert
                    var paramsArr = new Array(
                            10, //request.monthly_summary_id,
                            request.asset_id,
                            request.workforce_id,
                            request.account_id,
                            request.organization_id,
                            util.getStartDayOfMonth(), //entity_date_1,    //Monthly Month start Date
                            "", //entity_datetime_1, 
                            "", //entity_tinyint_1, 
                            request.entity_bigint_1, //entity_bigint_1, //ontimecount
                            request.entity_double_1, //entity_double_1, //total count
                            request.entity_decimal_1, //entity_decimal_1, //percentage
                            request.entity_decimal_2, //entity_decimal_2, //toberesponsded
                            "", //entity_decimal_3, 
                            request.entity_text_1, //entity_text_1, 
                            "", //entity_text_2
                            request.track_latitude,
                            request.track_longitude,
                            request.track_gps_accuracy,
                            request.track_gps_status,
                            request.track_gps_location,
                            request.track_gps_datetime,
                            request.device_manufacturer_name,
                            request.device_model_name,
                            request.device_os_id,
                            request.device_os_name,
                            request.device_os_version,
                            request.app_version,
                            request.api_version,
                            request.asset_id,
                            request.message_unique_id,
                            request.flag_retry,
                            request.flag_offline,
                            request.track_gps_datetime,
                            request.datetime_log
                            );
                    var queryString = util.getQueryString('ds_v1_asset_monthly_summary_transaction_insert', paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                //Inserting the Response Rate
                                avgTotRespTimeSummaryInsert(request).then(() => {
                                });
                                resolve(data)
                            } else {
                                reject(err);
                            }
                        });
                    }
                }
            });
        });
    }
    ;
    function updateFlagOntime(request) {
        return new Promise((resolve, reject) => {
            activityCommonService.getActivityDetails(request, 0, function (err, data) {
                if (err === false) {
                    var dueDate = util.replaceDefaultDatetime(data[0].activity_datetime_end_expected);
                    if (util.getCurrentDate() <= dueDate) {
                        var paramsArr = new Array(
                                request.activity_id,
                                request.organization_id,
                                1, //activity_flag_delivery_ontime,
                                request.asset_id,
                                request.datetime_log
                                );
                        var queryString = util.getQueryString('ds_v1_activity_list_update_flag_ontime', paramsArr);
                        if (queryString != '') {
                            db.executeQuery(0, queryString, request, function (err, data) {
                                (err === false) ? resolve(data) : reject(err);
                            });
                        }
                    }
                } else {
                    reject(err)
                }
            })

        });
    }

    function updateFlagQuality(request) {
        return new Promise((resolve, reject) => {
            activityCommonService.getActivityDetails(request, 0, function (err, data) {
                if (err === false) {
                    var dueDate = util.replaceDefaultDatetime(data[0].activity_datetime_end_expected);
                    if (util.getCurrentDate() <= dueDate) {
                        var paramsArr = new Array(
                                request.activity_id,
                                request.organization_id,
                                1, //activity_flag_delivery_quality,
                                request.asset_id,
                                request.datetime_log
                                );
                        var queryString = util.getQueryString('ds_p1_activity_list_update_flag_quality', paramsArr);
                        if (queryString != '') {
                            db.executeQuery(0, queryString, request, function (err, data) {
                                (err === false) ? resolve(data) : reject(err);
                            });
                        }
                    }
                }
            });
        });
    }

    //Remote Analytics    Weekly
    function avgTotRespTimePostItsInmailsSummaryInsert(request) {
        return new Promise((resolve, reject) => {
            var creationDate;
            request.weekly_summary_id = (request.activity_type_category_id == 28) ? 1 : 2;
            activityCommonService.getActivityDetails(request, 0, function (err, data) {
                if (err === false) {
                    creationDate = util.replaceDefaultDatetime(data[0].activity_datetime_start_expected);
                    assetWeeklySummaryTrans(request, creationDate).then((result) => {
                        if (result.length > 0) {
                            request.entity_bigint_1 = result[0].data_entity_bigint_1 + 1;
                            request.entity_text_1 = Number(result[0].data_entity_text_1); //total duration of time
                            request.entity_text_1 += (util.differenceDatetimes(request.datetime_log, creationDate)) / 1000;
                            request.entity_double_1 = (request.entity_text_1) / request.entity_bigint_1; //avg response time;
                        } else {
                            request.entity_bigint_1 = 1;
                            request.entity_text_1 = (util.differenceDatetimes(request.datetime_log, creationDate)) / 1000; //postit creation_datetime - logdatetime 
                            request.entity_double_1 = request.entity_text_1; //Average REsponse time                                          
                        }

                        avgTotRespTimeSummaryInsert(request).then(() => {
                            resolve();
                        })
                    })
                } else {
                    reject(err)
                }
            });
        });
    }
    ;
    //get the current total number of hours to respond and current number of post its / inmails
    function assetWeeklySummaryTrans(request, creationDatetime) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    request.asset_id,
                    request.operating_asset_id,
                    request.organization_id,
                    request.weekly_summary_id,
                    util.getFormatedLogDate(creationDatetime)
                    );
            var queryString = util.getQueryString('ds_p1_asset_weekly_summary_transaction_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log('assetWeeklySummaryTrans : \n', data, "\n");
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }

    function avgTotRespTimeSummaryInsert(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    request.weekly_summary_id,
                    request.asset_id,
                    request.workforce_id,
                    request.account_id,
                    request.organization_id,
                    util.getStartDayOfWeek(), //entity_date_1, //WEEK
                    request.entity_datetime_1,
                    request.entity_tinyint_1,
                    request.entity_bigint_1,
                    request.entity_double_1,
                    request.entity_decimal_1,
                    request.entity_decimal_2,
                    request.entity_decimal_3,
                    request.entity_text_1, //request.asset_frist_name
                    request.entity_text_2, //request.asset_last_name
                    request.track_latitude,
                    request.track_longitude,
                    request.track_gps_accuracy,
                    request.track_gps_enabled,
                    request.track_gps_location,
                    request.location_datetime,
                    request.device_manufacturer_name,
                    request.device_model_name,
                    request.device_os_id,
                    request.device_os_name,
                    request.device_os_version,
                    request.device_app_version,
                    request.device_api_version,
                    request.asset_id,
                    request.message_unique_id,
                    request.flag_retry,
                    request.falg_retry_offline,
                    request.transaction_datetime,
                    request.datetime_log
                    );
            var queryString = util.getQueryString('ds_v1_asset_weekly_summary_transaction_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }

    function itemOrderAlterStatus(request) {
        return new Promise((resolve, reject) => {
            //activityCommonService.getActivityDetails(request,0,function(err, data){
            getItemOrderStation(request).then((data) => {
                console.log('menu_activity_id : ', data[0].channel_activity_id);
                console.log('station_id : ', data[0].asset_id);
                request.menu_activity_id = data[0].channel_activity_id;
                request.station_id = data[0].asset_id;
                getAllIngrediants(request).then((ingredients) => {
                    if (ingredients.length > 0) {
                        console.log('Ingredients : ', ingredients)
                        console.log('============================')
                        forEachAsync(ingredients, function (next, row) {
                            getAllInventoriesOfIngre(request, row).then((updatedInvs) => {
                                console.log('===========================');
                                console.log('Temp Array : ', updatedInvs);
                                updateIngrInvQty(request, updatedInvs).then(() => {
                                    updateIngrInvQtyAllParticipants(request, updatedInvs).then(() => {
                                    });
                                    next();
                                });
                            });
                        });
                    }
                });
            })
        });
    }

    function getAllIngrediants(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array();
            var queryString = '';
            paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.menu_activity_id,
                    41, //request.asset_type_category_id,
                    request.page_start || 0,
                    util.replaceQueryLimit(request.page_limit)
                    );
            queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants_category', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        //console.log('DAta in ingredients : ', data);
                        if (data.length > 0) {
                            var ingredients = new Array();
                            forEachAsync(data, function (next, x) {
                                var items = {
                                    'ingredient_asset_id': x.asset_id,
                                    'channel_activity_type_category_id': x.channel_activity_type_category_id,
                                    'activity_sub_type_id': x.activity_sub_type_id
                                };
                                ingredients.push(items);
                                next();
                            }).then(() => {
                                if (ingredients.length > 0) {
                                    ingredients = util.getUniqueValuesOfArray(ingredients);
                                }
                                resolve(ingredients);
                            });
                        }
                    }
                });
            }
        });
    }

    function getAllInventoriesOfIngre(request, ingredients) {
        return new Promise((resolve, reject) => {
            var inventories = new Array();
            var requiredQuantity;
            var inventoryQuantity;
            var result;
            console.log('ingredients.ingredient_asset_id : ', ingredients.ingredient_asset_id);
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    request.station_id,
                    ingredients.ingredient_asset_id
                    );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_inventory', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        requiredQuantity = ingredients.activity_sub_type_id;
                        inventoryQuantity = inventories.inventory_quantity_total_value;
                        //Here you have to write the logic
                        console.log('inventories data: ', data);
                        if (data.length > 0) {
                            updatingInventoryQtys(ingredients.activity_sub_type_id, data).then((updatedInv) => {
                                resolve(updatedInv)
                            }).catch(()=>{
                                console.log('Error occurred in performing the deductions of inventory quantity');
                                reject('Error occurred in performing the deductions of inventory quantity');
                            });
                        } else {
                        }

                    } else {
                        reject(err);
                    }
                });
            }
        })
    }

    function updatingInventoryQtys(requiredQty, inventories) {
        return new Promise((resolve, reject) => {
            var x;
            var tempArray = new Array();
            console.log('ingredients.activity_sub_type_id : ', requiredQty);
            forEachAsync(inventories, function (next, j) {
                x = JSON.parse(j.activity_inline_data);
                console.log('x : ', x.inventory_quantity_total_value);
                if (Math.sign(x.inventory_quantity_total_value - requiredQty) === -1) {
                    x.inventory_quantity_total_value = requiredQty - x.inventory_quantity_total_value;
                    console.log('Demo purpose basically 0: ', x.inventory_quantity_total_value);
                    requiredQty = x.inventory_quantity_total_value;
                    x.inventory_quantity_total_value = 0;
                    x.inventory_quantity = 0;
                    j.activity_sub_type_id = 0;
                    j.activity_inline_data = JSON.stringify(x);
                    tempArray.push(j)
                    next();
                } else if (Math.sign(x.inventory_quantity_total_value - requiredQty) === 1) {
                    x.inventory_quantity_total_value -= requiredQty;
                    x.inventory_quantity = Math.ceil(x.inventory_quantity_total_value / x.inventory_quantity_unit_value);
                    j.activity_sub_type_id = x.inventory_quantity_total_value;
                    j.activity_inline_data = JSON.stringify(x);
                    tempArray.push(j)
                    return resolve(tempArray);
                } else if (Math.sign(x.inventory_quantity_total_value - requiredQty) === 0) {
                    x.inventory_quantity_total_value -= requiredQty;
                    x.inventory_quantity = Math.ceil(x.inventory_quantity_total_value / x.inventory_quantity_unit_value);
                    j.activity_sub_type_id = x.inventory_quantity_total_value;
                    j.activity_inline_data = JSON.stringify(x);
                    tempArray.push(j)
                    return resolve(tempArray);
                }
            });
        });
    }

    function updateIngrInvQty(request, updatedIngrInv) {
        return new Promise((resolve, reject) => {
            forEachAsync(updatedIngrInv, function (next, row) {
                var paramsArr = new Array(
                        row.activity_id, //menu_activity_id??
                        request.organization_id,
                        row.activity_inline_data, //request.activity_inline_data,
                        row.activity_sub_type_id, //total_inventory_quantity,
                        request.asset_id,
                        request.datetime_log
                        );
                var queryString = util.getQueryString('ds_v1_activity_list_update_inventory', paramsArr);
                if (queryString != '') {
                    db.executeQuery(0, queryString, request, function (err, data) {
                        if (err === false) {
                            next();
                        } else {
                            reject(err);
                        }
                    });
                }

            }).then(() => {
                resolve();
            })

        });
    }

    function updateIngrInvQtyAllParticipants(request, updatedIngrInv) {
        return new Promise((resolve, reject) => {
            forEachAsync(updatedIngrInv, function (nextR, row) {
                var newRequest = {};
                newRequest.activity_id = row.activity_id;
                newRequest.organization_id = request.organization_id;
                activityCommonService.getAllParticipants(newRequest, function (err, participantData) {
                    if (err === false) {
                        //console.log('participantData : ', participantData);

                        forEachAsync(participantData, function (nextX, x) {
                            var paramsArr = new Array(
                                    row.activity_id, //menu_activity_id?
                                    x.asset_id,
                                    request.organization_id,
                                    row.activity_inline_data,
                                    row.activity_sub_type_id,
                                    request.asset_id,
                                    request.datetime_log
                                    );
                            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_inventory', paramsArr);
                            if (queryString != '') {
                                db.executeQuery(0, queryString, request, function (err, inventories) {
                                    if (err === false) {
                                        nextX();
                                    } else {
                                        reject(err);
                                    }
                                });
                            }
                        }).then(() => {
                            nextR();
                        })
                    }
                    ;
                });
            }).then(() => {
                resolve();
            })
        });
    }

    function getItemOrderStation(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.activity_id
                    );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_item_order_station', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        (data.length > 0) ? resolve(data) : resolve(err);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }

    this.inmailResReqSet = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                request.asset_id,
                request.activity_flag_response_required,
                util.getCurrentUTCTime()
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_inmail_response_req_flag', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, {}, 200);
                    return;
                } else {
                    callback(true, err, -9999);
                    return;
                }
            });
        }
    };

    this.updateOwnerRating = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var flag = 1;
        if (Number(request.owner_specification_rating) === -1 || Number(request.owner_decision_rating) === -1 || Number(request.owner_planning_rating) === -1) {
            flag = 2;
        }
        var paramsArr = new Array(
                request.activity_id,
                request.owner_asset_id,
                request.organization_id,
                flag,
                request.owner_specification_rating,
                request.owner_decision_rating,
                request.owner_planning_rating,
                request.asset_id,
                util.getCurrentUTCTime()
                );
        var queryString = util.getQueryString('ds_p1_activity_list_update_creator_rating', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_creator_rating', paramsArr);
                    if (queryString !== '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                callback(false, {}, 200);
                                var collection = {};
                                collection.flag_filter = 1;
                                collection.asset_id = request.owner_asset_id;
                                collection.operating_asset_id = request.owner_operating_asset_id;
                                collection.datetime_start = util.getStartDayOfWeek();
                                collection.datetime_end = util.getEndDayOfWeek();   // getting weekly data
                                if (flag === 1) {
                                    activityCommonService.getAssetAverageRating(request, collection).then((assetAverageRating) => {
                                        //console.log(assetAverageRating);
                                        /*
                                         * weekly
                                         9	Creator Rating - Specification
                                         10	Creator Rating - Decision
                                         11	Creator Rating - Planning
                                         */
                                        var weeklySummaryCollection = {};
                                        weeklySummaryCollection.summary_id = 9;
                                        weeklySummaryCollection.asset_id = request.owner_asset_id;
                                        weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_creator_specification;
                                        activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {
                                            weeklySummaryCollection.summary_id = 10;
                                            weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_creator_decision;
                                            //activity_rating_lead_ownership
                                            activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {
                                                weeklySummaryCollection.summary_id = 11;
                                                weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_creator_planning;
                                                activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {

                                                });
                                            });
                                        });
                                        /* monthly
                                         16	Creator Rating - Specification
                                         17	Creator Rating - Decision
                                         18	Creator Rating - Planning
                                         */
                                        collection.datetime_start = util.getStartDateTimeOfMonth();
                                        collection.datetime_end = util.getEndDateTimeOfMonth();   // getting monthly data
                                        activityCommonService.getAssetAverageRating(request, collection).then((monthlyAssetAverageRating) => {
                                            var monthlySummaryCollection = {};
                                            monthlySummaryCollection.summary_id = 16;
                                            monthlySummaryCollection.asset_id = request.owner_asset_id;
                                            monthlySummaryCollection.entity_decimal_1 = monthlyAssetAverageRating[0].activity_rating_creator_specification;
                                            activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {
                                                monthlySummaryCollection.summary_id = 17;
                                                monthlySummaryCollection.entity_decimal_1 = monthlyAssetAverageRating[0].activity_rating_creator_decision;
                                                //activity_rating_lead_ownership
                                                activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {
                                                    monthlySummaryCollection.summary_id = 18;
                                                    monthlySummaryCollection.entity_decimal_1 = monthlyAssetAverageRating[0].activity_rating_creator_planning;
                                                    activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {

                                                    });
                                                });
                                            });

                                        })
                                    })
                                }
                                return;
                            } else {
                                callback(true, err, -9999);
                                return;
                            }
                        });
                    }
                } else {
                    callback(true, err, -9999);
                    return;
                }
            });
        }
    };

    this.updateLeadRating = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var flag = 1;
        if (Number(request.lead_ownership_rating) === -1 || Number(request.lead_completion_rating) === -1 || Number(request.lead_timeliness_rating) === -1) {
            flag = 2;
        }
        var paramsArr = new Array(
                request.activity_id,
                request.lead_asset_id,
                request.organization_id,
                flag, // flag that sets that rating is set to lead
                request.lead_ownership_rating,
                request.lead_completion_rating,
                request.lead_timeliness_rating,
                request.asset_id,
                util.getCurrentUTCTime()
                );
        var queryString = util.getQueryString('ds_p1_activity_list_update_lead_rating', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_lead_rating', paramsArr);
                    if (queryString !== '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                callback(false, {}, 200);
                                var collection = {};
                                collection.flag_filter = 0;
                                collection.asset_id = request.lead_asset_id;
                                collection.operating_asset_id = request.lead_operating_asset_id;
                                collection.datetime_start = util.getStartDayOfWeek();
                                collection.datetime_end = util.getEndDayOfWeek();   // getting weekly data
                                if (flag === 1) {
                                    activityCommonService.getAssetAverageRating(request, collection).then((assetAverageRating) => {
                                        /*
                                         * weekly
                                         12	Lead Rating - Completeness
                                         13	Lead Rating - Ownership
                                         14	Lead Rating - Timeliness
                                         */
                                        var weeklySummaryCollection = {};
                                        weeklySummaryCollection.summary_id = 12;
                                        weeklySummaryCollection.asset_id = request.lead_asset_id;
                                        weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_completion;
                                        activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {
                                            weeklySummaryCollection.summary_id = 13;
                                            weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_ownership;
                                            activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {
                                                weeklySummaryCollection.summary_id = 14;
                                                weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_timeliness;
                                                activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {

                                                });
                                            });
                                        });
                                        /* monthly
                                         19	Lead Rating - Completeness
                                         20	Lead Rating - Ownership
                                         21	Lead Rating - Timeliness
                                         */
                                        collection.datetime_start = util.getStartDateTimeOfMonth();
                                        collection.datetime_end = util.getEndDateTimeOfMonth();   // getting monthly data
                                        activityCommonService.getAssetAverageRating(request, collection).then((assetAverageRating) => {
                                            console.log(assetAverageRating)
                                            var monthlySummaryCollection = {};
                                            monthlySummaryCollection.summary_id = 19;
                                            monthlySummaryCollection.asset_id = request.lead_asset_id;
                                            monthlySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_completion;
                                            activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {
                                                monthlySummaryCollection.summary_id = 20;
                                                monthlySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_ownership;
                                                //activity_rating_lead_ownership
                                                activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {
                                                    monthlySummaryCollection.summary_id = 21;
                                                    monthlySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_timeliness;
                                                    activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {

                                                    });
                                                });
                                            });

                                        });
                                    })
                                }
                                return;
                            } else {
                                callback(true, err, -9999);
                                return;
                            }
                        });
                    }
                } else {
                    callback(true, err, -9999);
                    return;
                }
            });
        }
    };



    function getTaskAcceptanceStats(request, flag) {
        return new Promise((resolve, reject) => {
            var response = {};
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    request.asset_id,
                    request.operating_asset_id || 0,
                    flag,
                    util.getStartDayOfWeek(),
                    util.getEndDayOfWeek()
                    );
            var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_task_acceptance_stats', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, weeklyAcceptanceStats) { // weekly stats
                    if (err === false) {
                        response.weekly_acceptance_stats = weeklyAcceptanceStats;
                        paramsArr = new Array(
                                request.organization_id,
                                request.account_id,
                                request.workforce_id,
                                request.asset_id,
                                request.operating_asset_id || 0,
                                flag,
                                util.getStartDateTimeOfMonth(),
                                util.getEndDateTimeOfMonth()
                                );
                        var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_task_acceptance_stats', paramsArr);
                        db.executeQuery(1, queryString, request, function (err, monthlyAcceptanceStats) { //monthly stats
                            if (err === false) {
                                response.monthly_acceptance_stats = monthlyAcceptanceStats
                                resolve(response);
                            } else {
                                reject(err);
                            }
                        });
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }

    var acceptanceStatsSummaryInsert = function (request, acceptanceStats, summaryIds, callback) {
        var collection = {};
        var totalCount = Number(acceptanceStats.weekly_acceptance_stats[0].total_count);
        var count = Number(acceptanceStats.weekly_acceptance_stats[0].count);
        var percentage = (totalCount > 0) ? (count / totalCount) * 100 : 0;
        collection.summary_id = summaryIds.weekly;
        collection.asset_id = request.asset_id;
        collection.entity_bigint_1 = totalCount;
        collection.entity_decimal_2 = count;
        collection.entity_decimal_1 = percentage;
        collection.entity_double_1 = percentage;
        activityCommonService.weeklySummaryInsert(request, collection).then((data) => {

            //monthly_acceptance_stats
            totalCount = Number(acceptanceStats.monthly_acceptance_stats[0].total_count);
            count = Number(acceptanceStats.monthly_acceptance_stats[0].count);
            percentage = (totalCount > 0) ? (count / totalCount) * 100 : 0;
            collection.summary_id = summaryIds.monthly;
            collection.entity_bigint_1 = totalCount;
            collection.entity_decimal_2 = count;
            collection.entity_decimal_1 = percentage;
            collection.entity_double_1 = percentage;
            activityCommonService.monthlySummaryInsert(request, collection).then((data) => {
                callback(false, true);
            });
        });
    };
    
    function updateTaskCreatedCnt(request) {
        return new Promise((resolve, reject)=>{
            activityCommonService.getAssetDetails(request, function (err, data){
               if(err === false) {
                    var paramsArr = new Array(
                        request.organization_id,
                        request.account_id,
                        request.workforce_id,
                        data.operating_asset_id
                    );

                    var queryString = util.getQueryString('ds_v1_asset_list_update_task_created_count', paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            //global.logger.write(queryString, request, 'asset', 'trace');
                            (err === false) ? resolve(): reject(err);
                        });
                    }
               } else {
                   reject(err);
               }
            });
        });
    };
}
;
module.exports = ActivityService;
