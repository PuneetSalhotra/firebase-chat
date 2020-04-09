/* 
 * author: Sri Sai Venkatesh
 */

function ActivityParticipantService(objectCollection) {

    var db = objectCollection.db;
    var cacheWrapper = objectCollection.cacheWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var util = objectCollection.util;
    var sns = objectCollection.sns;
    // var activityPushService = objectCollection.activityPushService;

    const ActivityPushService = require('../services/activityPushService');
    const activityPushService = new ActivityPushService(objectCollection);

    const RMBotService = require('../botEngine/services/rmbotService');
    const rmbotService = new RMBotService(objectCollection);

    this.getParticipantsList = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
        var paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatParticipantList(data, function (err, response) {
                        if (err === false)
                            callback(false, {
                                data: response
                            }, 200);
                    });
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }

    };

    var formatParticipantList = function (data, callback) {
        var responseData = new Array();
        data.forEach(function (rowData, index) {
            var rowDataArr = {
                'activity_id': util.replaceDefaultNumber(rowData['activity_id']),
                'asset_id': util.replaceDefaultNumber(rowData['asset_id']),
                'account_id': util.replaceDefaultNumber(rowData['account_id']),
                'organization_id': util.replaceDefaultNumber(rowData['organization_id']),
                'workforce_id': util.replaceDefaultNumber(rowData['workforce_id']),
                'workforce_name': util.replaceDefaultString(rowData['workforce_name']),
                'account_name': util.replaceDefaultString(rowData['account_name']),
                'asset_first_name': util.replaceDefaultString(rowData['asset_first_name']),
                'asset_last_name': util.replaceDefaultString(rowData['asset_last_name']),
                'asset_type_id': util.replaceDefaultNumber(rowData['asset_type_id']),
                'asset_type_name': util.replaceDefaultString(rowData['asset_type_name']),
                'asset_type_category_id': util.replaceDefaultNumber(rowData['asset_type_category_id']),
                'field_id': util.replaceDefaultNumber(rowData['field_id']),
                'asset_type_category_name': util.replaceDefaultString(rowData['asset_type_category_name']),
                'asset_image_path': (util.replaceDefaultString(rowData['asset_image_path']) !== ''),
                'asset_phone_number': util.replaceDefaultString(rowData['asset_phone_number']),
                'asset_phone_number_code': util.replaceDefaultString(rowData['asset_phone_country_code']),
                'operating_asset_phone_number': util.replaceDefaultString(rowData['operating_asset_phone_number']),
                'operating_asset_phone_country_code': util.replaceDefaultString(rowData['operating_asset_phone_country_code']),
                'log_asset_id': util.replaceDefaultNumber(rowData['log_asset_id']),
                'log_state': util.replaceDefaultNumber(rowData['log_state']),
                'log_active': util.replaceDefaultNumber(rowData['log_active']),
                "operating_asset_id": util.replaceZero(rowData['operating_asset_id']),
                "operating_asset_first_name": util.replaceDefaultString(rowData['operating_asset_first_name']),
                "operating_asset_last_name": util.replaceDefaultString(rowData['operating_asset_last_name']),
                "activity_creator_operating_asset_first_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_first_name']),
                "asset_datetime_last_seen": util.replaceDefaultDatetime(rowData['asset_datetime_last_seen']),
                "activity_creator_asset_id": util.replaceDefaultNumber(rowData['activity_creator_asset_id']),
                "activity_owner_asset_image_path": util.replaceDefaultString(rowData['activity_owner_asset_image_path']),
                "operating_asset_image_path": util.replaceDefaultString(rowData['operating_asset_image_path']),
                "asset_image_path": util.replaceDefaultString(rowData['asset_image_path'])
            };
            responseData.push(rowDataArr);
        }, this);
        callback(false, responseData);
    };

    this.assignCoworker = async function (request, callback) { //Addparticipant Request

        request.flag_retry = request.flag_retry || 0;
        request.flag_offline = request.flag_offline || 0;

        let activityTitle = '';
        try {
            await activityCommonService
                .getActivityDetailsPromise(request, request.activity_id)
                .then((workflowActivityData) => {
                    if (workflowActivityData.length > 0) {
                        // 
                        activityTitle = workflowActivityData[0].activity_title;
                        // 
                        request.activity_title = activityTitle;
                    }
                })
                .catch((error) => {
                    console.log("BotEngine: changeStatus | getActivityDetailsPromise | error: ", error);
                });
        } catch (error) {
            console.log("BotEngine: changeStatus | Activity Details Fetch Error | error: ", error);
        }

        var loopAddParticipant = function (participantCollection, index, maxIndex) {
            iterateAddParticipant(participantCollection, index, maxIndex, function (err, data) {
                if (err === false) {
                    if (index === maxIndex) {
                        updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) {});
                    }
                } else {
                    //console.log("something is not wright in adding a participant");
                    global.logger.write('serverError', 'something is not right in adding a participant', err, {})
                }
            });
        };

        var iterateAddParticipant = function (participantCollection, index, maxIndex, callback) {

            var participantData = participantCollection[index];
            activityCommonService.isParticipantAlreadyAssigned(participantData, request.activity_id, request, function (err, alreadyAssignedStatus, newRecordStatus) {
                if ((err === false) && (!alreadyAssignedStatus)) {
                    //proceed and add a participant
                    addParticipant(request, participantData, newRecordStatus, async function (err, data) {
                        if (err === false) {
                            //console.log("participant successfully added");
                            global.logger.write('conLog', '******** actvityParticipantService : iterateAddParticipant : addParticipant : activityLeadUpdate', {}, {})
                            
                            if(Number(request.activity_type_category_id) === 16){
                                
                                let newObject = Object.assign({}, request);
                                newObject.target_workforce_id = data[0].idWorkforce;
                                newObject.push_title = "Connected";
                                newObject.push_message = data[0].firstNameCreatorOperatingAsset+" connected with "+data[0].firstNameOperatingAsset;
                                activityCommonService.sendPushToWorkforceAssets(newObject);
                            }
                            //else
                            if(request.hasOwnProperty("add_as_lead")){
                                rmbotService.assignResourceAsLead(request, participantData.asset_id);
                            }/*else{
                                request.target_activity_id = request.activity_id;
                                let [err, response] = await rmbotService.workforceActivityStatusMappingSelectStatusId(request);
                                
                                if(response.length > 0) {
                                    if(response[0].activity_type_flag_persist_role === 1)
                                        activityCommonService.activityLeadUpdate(request, participantData, false); 
                                    else
                                        rmbotService.RMResourceAvailabilityTrigger(request);
                                } else {
                                    rmbotService.RMResourceAvailabilityTrigger(request);
                                }
                                
                            }*/
                            global.logger.write('conLog', 'participant successfully added', {}, {})
                            //check participant is active in last 48 hrs or not
                            if (activityTypeCategroyId === 28 || activityTypeCategroyId === 8) {
                                activityPushService.sendSMSNotification(request, objectCollection, participantData.asset_id, function () {});
                            }
                            var nextIndex = index + 1;
                            if (nextIndex <= maxIndex) {
                                loopAddParticipant(participantCollection, nextIndex, maxIndex);
                            }
                            callback(false, true);
                        } else {
                            //console.log(err);
                            global.logger.write('serverError', err, {}, {})
                            callback(true, false);
                        }
                    }.bind(this));
                } else {
                    if (alreadyAssignedStatus > 0) {
                        //console.log("participant already assigned");
                        global.logger.write('conLog', 'participant already assigned', {}, {});
                        if(request.hasOwnProperty("add_as_lead")){
                            console.log("Assigning already added resource as Lead");
                            rmbotService.assignResourceAsLead(request, participantData.asset_id);
                        }
                        var nextIndex = index + 1;
                        if (nextIndex <= maxIndex) {
                            loopAddParticipant(participantCollection, nextIndex, maxIndex);
                        }
                        callback(false, false);
                    } else {
                        callback(true, false);
                    }
                }
            });

        };
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        var activityStreamTypeId = 2; //Older 2:added participant
        if (request.hasOwnProperty('activity_type_category_id')) {
            var activityTypeCategroyId = Number(request.activity_type_category_id);
            switch (activityTypeCategroyId) {
                case 2: // notepad 
                    activityStreamTypeId = 501;
                    break;
                case 3: //plant
                    break;
                case 4: //employee id card
                    activityStreamTypeId = 103;
                    break;
                case 5: //Co-worker Contact Card
                    activityStreamTypeId = 206;
                    break;
                case 6: //  External Contact Card - Customer
                    activityStreamTypeId = 1106;
                    break;
                    //Added by Nani Kalyan
                case 8: //Mail
                    activityStreamTypeId = 1703;
                    break;
                    //////////////////////////////
                case 50: 
                    activityStreamTypeId = 2202;
                    break;
                case 51: 
                    activityStreamTypeId = 2302;
                    break;
                case 48:
                case 9: //form
                    activityStreamTypeId = 702;
                    break;
                case 10: //document
                    activityStreamTypeId = 306;
                    break;
                case 11: //folder
                    activityStreamTypeId = 1403;
                    break;
                case 14: //voice call
                    activityStreamTypeId = 803; //Added by Nani kalyan
                    break;
                case 15: //video conference
                    activityStreamTypeId = 1603; //Added by Nani kalyan
                    break;
                case 28: // post-it
                    activityStreamTypeId = 902;
                    break;
                case 29: // External Contact Card - Supplier
                    activityStreamTypeId = 1206;
                    break;
                case 30: //contact group
                    activityStreamTypeId = 1301;
                    break;
                    //Added by Nani Kalyan
                case 31: //Calendar Event
                    activityStreamTypeId = 504;
                    break;
                    //Added by Nani Kalyan
                case 32: //Customer Request
                    activityStreamTypeId = 603;
                    break;
                    //Added by Nani Kalyan
                case 33: //Visitor Request
                    activityStreamTypeId = 1303;
                    break;
                    //Added by Nani Kalyan
                case 34: //Time Card
                    activityStreamTypeId = 1503;
                    break;
                    //////////////////////////////////
                    //PAM
                case 36: //Menu Item
                    activityStreamTypeId = 19002;
                    break;
                case 37: //Reservation
                    activityStreamTypeId = 18002;
                    break;
                case 38: //Item Order
                    activityStreamTypeId = 21002;
                    break;
                case 39: //Inventory
                    activityStreamTypeId = 20002;
                    break;
                case 40: //Payment
                    activityStreamTypeId = 22005;
                    break;
                case 41: //Event
                    activityStreamTypeId = 17002;
                    break;
                case 52: //Widget
                    activityStreamTypeId = 26002;
                    break;
                case 53: //Account
                    activityStreamTypeId = 27004;
                    break;
                case 56: //Move
                    activityStreamTypeId = 2702;
                    break;                    
                default:
                    activityStreamTypeId = 2; //by default so that we know
                    //console.log('adding streamtype id 2');
                    global.logger.write('conLog', 'adding streamtype id 2', {}, {})
                    break;

            }
        }

        var logDatetime = util.getCurrentUTCTime();
        var sendSMSNotification = 0;
        request['datetime_log'] = logDatetime;
        request['activity_streamtype_id'] = activityStreamTypeId;
        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
        var index = 0;
        var activityParticipantCollection = JSON.parse(request.activity_participant_collection);
        var maxIndex = activityParticipantCollection.length - 1;
        //var maxIndex = request.activity_participant_collection.length - 1;                
        iterateAddParticipant(activityParticipantCollection, index, maxIndex, function (err, data) {
            if (activityTypeCategroyId == 37) {
                var newRequest = Object.assign({}, request);
                activityCommonService.sendSmsCodeParticipant(newRequest, function (err, data) {});
            }

            if (err === false && data === true) {
                //callback(false, {}, 200);
                callback(false, true);
                if (maxIndex === index) {
                    updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) {});
                    activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
                }
            } else {                
                //console.log("something is not wright in adding a participant");
                global.logger.write('serverError', 'something is not right in adding a participant', err, {});
                callback(false, {}, 200);
            }
        });
    };


    this.unassignParticicpant = async function (request, callback) {

        var loopUnassignParticipant = function (participantCollection, index, maxIndex) {
            iterateUnassignParticipant(participantCollection, index, maxIndex, function (err, data) {
                if (err === false) {
                    if (index === maxIndex) {
                        updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) {});
                        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
                    }
                } else {
                    //console.log("something is not wright in unassign a participant");
                    global.logger.write('serverError', 'something is not wright in unassign a participant', err, {})
                }
            });
        };

        var iterateUnassignParticipant = function (participantCollection, index, maxIndex, callback) {
            var participantData = participantCollection[index];
            unassignAssetFromActivity(request, participantData, function (err, data) {
                if (err === false) {
                    //console.log("participant successfully un-assigned");
                    global.logger.write('debug', 'participant successfully un-assigned', {}, {})
                    var nextIndex = index + 1;
                    if (nextIndex <= maxIndex) {
                        loopUnassignParticipant(participantCollection, nextIndex, maxIndex);
                    }
                    callback(false, true);
                } else {
                    //console.log(err);
                    global.logger.write('serverError', err, err, {})
                    callback(true, false);
                }
            }.bind(this));
        };
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        var activityStreamTypeId = 3;
        const activityData = await activityCommonService.getActivityDetailsPromise(request, request.activity_id);
        if (activityData.length > 0) {
            request.activity_type_category_id = activityData[0].activity_type_category_id;
            console.log("unassignParticicpant | Number(activityData[0].activity_type_category_id): ", Number(activityData[0].activity_type_category_id));
        }
        if (request.hasOwnProperty('activity_type_category_id')) {
            var activityTypeCategroyId = Number(request.activity_type_category_id);
            switch (activityTypeCategroyId) {
                case 2: // notepad 
                    activityStreamTypeId = 501;
                    break;
                case 3: //plant
                    break;
                case 4: //employee id card
                    activityStreamTypeId = 104;
                    break;
                case 5: //Co-worker Contact Card
                    activityStreamTypeId = 209;
                    break;
                case 6: //  External Contact Card - Customer
                    activityStreamTypeId = 1109;
                    break;
                    //Added by Nani Kalyan
                case 8: //Mail
                    activityStreamTypeId = 1704;
                    break;
                    ////////////////////////////////
                case 9: //form
                case 48: //form
                    activityStreamTypeId = 707;
                    break;
                case 10: //document
                    activityStreamTypeId = 308;
                    break;
                case 11: //folder
                    activityStreamTypeId = 1405;
                    break;
                case 14: //voice call
                    activityStreamTypeId = 805; //Added by Nani Kalyan
                    break;
                case 15: //video conference
                    activityStreamTypeId = 1605; //Added by Nani Kalyan
                    break;
                case 28: // post-it
                    activityStreamTypeId = 906;
                    break;
                case 29: // External Contact Card - Supplier
                    activityStreamTypeId = 1209;
                    break;
                case 30: //contact group
                    activityStreamTypeId = 1301;
                    break;
                    //Added by Nani Kalyan
                case 31: //Calendar Event
                    activityStreamTypeId = 506;
                    break;
                    //Added by Nani Kalyan
                case 32: //Customer Request
                    activityStreamTypeId = 605;
                    break;
                    //Added by Nani Kalyan
                case 33: //Visitor Request
                    activityStreamTypeId = 1305;
                    break;
                    //Added by Nani Kalyan
                case 34: //Time Card
                    activityStreamTypeId = 1505;
                    break;
                    ////////////////////////////////////////
                case 50: //Support
                    activityStreamTypeId = 2207;
                    break;
                case 51: //Feedback
                    activityStreamTypeId = 2307;
                    break;
                case 52: //Widget
                    activityStreamTypeId = 26005;
                    break;
                default:
                    activityStreamTypeId = 3; //by default so that we know
                    //console.log('adding streamtype id 3');
                    global.logger.write('conLog', 'adding streamtype id 3', {}, request)
                    break;

            };
        }
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        request['activity_streamtype_id'] = activityStreamTypeId;
        var index = 0;
        var activityParticipantCollection = JSON.parse(request.activity_participant_collection);
        var maxIndex = activityParticipantCollection.length - 1;
        //var maxIndex = request.activity_participant_collection.length - 1;        
        iterateUnassignParticipant(activityParticipantCollection, index, maxIndex, function (err, data) {
            if (err === false && data === true) {
                //callback(false, {}, 200);
                if (maxIndex === index) {
                    updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) {});
                    activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
                }
            } else {
                //console.log("something is not wright in adding a participant");
                global.logger.write('serverError', 'something is not right in adding a participant', err, {})
            }
        });
    };

    this.updateParticipantAccess = function (request, callback) {

        var loopUpdateParticipantAccess = function (participantCollection, index, maxIndex) {
            iterateUpdateParticipantAccess(participantCollection, index, maxIndex, function (err, data) {
                if (err === false) {
                    if (index === maxIndex) {
                        activityCommonService.updateActivityLogDiffDatetime(request, 0, function (err, data) {
                            activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
                        });
                    }
                } else {
                    //console.log("something is not wright in unassign a participant");
                    global.logger.write('serverError', 'something is not wright in unassign a participant', err, {})
                }
            });
        };

        var iterateUpdateParticipantAccess = function (participantCollection, index, maxIndex, callback) {
            var participantData = participantCollection[index];
            updateAssetParticipantAccess(request, participantData, function (err, data) {
                if (err === false) {
                    //console.log("participant successfully updated");
                    global.logger.write('conLog', 'participant successfully updated', {}, {})
                    var nextIndex = index + 1;
                    if (nextIndex <= maxIndex) {
                        loopUpdateParticipantAccess(participantCollection, nextIndex, maxIndex);
                    }
                    callback(false, true);
                } else {
                    //console.log(err);
                    global.logger.write('serverError', err, err, {})
                    callback(true, false);
                }
            }.bind(this));
        };
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        var activityStreamTypeId = 3;
        if (request.hasOwnProperty('activity_type_category_id')) {
            var activityTypeCategroyId = Number(request.activity_type_category_id);
            switch (activityTypeCategroyId) {
                case 2: // notepad 
                    activityStreamTypeId = 4; //adding a default value
                    break;
                case 3: //plant
                    break;
                case 4: //employee id card
                    activityStreamTypeId = 4; // adding a default value                    
                    break;
                case 5: //Co-worker Contact Card
                    activityStreamTypeId = 4; // adding a default value
                    break;
                case 6: //  External Contact Card - Customer
                    activityStreamTypeId = 4; // adding a default value
                    break;
                case 50: 
                    activityStreamTypeId = 2203;
                    break;
                case 51: 
                    activityStreamTypeId = 2303;
                    break;
                case 9: //form
                    activityStreamTypeId = 703;
                    break;
                case 10: //document
                    activityStreamTypeId = 307;
                    break;
                case 11: //folder
                    activityStreamTypeId = 1404;
                    break;
                case 14: //voice call
                    activityStreamTypeId = 804; //Added by Nani Kalyan
                    break;
                case 15: //video conference
                    activityStreamTypeId = 1604; //Added by Nani Kalyan
                    break;
                case 28: // post-it
                    //activityStreamTypeId = 4;   // adding a default value
                    activityStreamTypeId = 905; //Added by Nani Kalyan
                    break;
                case 29: // External Contact Card - Supplier
                    activityStreamTypeId = 4; // adding a default value
                    break;
                case 30: //contact group
                    activityStreamTypeId = 4; // adding a default value
                    break;
                    //Added by Nani Kalyan
                case 31: //Calendar Event
                    activityStreamTypeId = 505;
                    break;
                    //Added by Nani Kalyan
                case 32: //Customer Request
                    activityStreamTypeId = 604;
                    break;
                    //Added by Nani Kalyan
                case 33: //Visitor Request
                    activityStreamTypeId = 1304;
                    break;
                    //Added by Nani Kalyan
                case 34: //Visitor Request
                    activityStreamTypeId = 1504;
                    break;
                    /////////////////////////////////
                default:
                    activityStreamTypeId = 4; //by default so that we know
                    //console.log('adding streamtype id 4');
                    global.logger.write('conLog', 'adding streamtype id 4', {}, request)
                    break;

            };
        }
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        request['activity_streamtype_id'] = activityStreamTypeId;

        var index = 0;
        var activityParticipantCollection = JSON.parse(request.activity_participant_collection);
        var maxIndex = activityParticipantCollection.length - 1;
        //var maxIndex = request.activity_participant_collection.length - 1;        
        iterateUpdateParticipantAccess(activityParticipantCollection, index, maxIndex, function (err, data) {
            if (err === false && data === true) {
                //callback(false, {}, 200);
                if (maxIndex === index) {
                    activityCommonService.updateActivityLogDiffDatetime(request, 0, function (err, data) {
                        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});
                    });
                }
            } else {
                //console.log("something is not wright in adding a participant");
                global.logger.write('serverError', 'something is not right in adding a participant', err, {})
            }
        });
    };

    var addParticipant = function (request, participantData, newRecordStatus, callback) {
        var fieldId = 0;
        if (participantData.hasOwnProperty('field_id')) {
            fieldId = participantData.field_id;
        }
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        if (newRecordStatus) {
            activityAssetMappingInsertParticipantAssign(request, participantData, function (err, data) {
                if (err === false) {
                    try {
                        activityPushService.sendPush(request, objectCollection, participantData.asset_id, function () {});
                    } catch(err) {
                        console.log(err);
                    }
                    
                    activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                    });

                    /*console.log('BEFORE ACTIVITY TIMELINE INSERT activityTypeCategoryId :: '+activityTypeCategoryId);

                    if (activityTypeCategoryId === 48 || activityTypeCategoryId === 9){
                        activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                        });
                    }*/

                    if (activityTypeCategoryId !== 10 && activityTypeCategoryId !== 11) {
                        if (activityTypeCategoryId !== 9) {
                            activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {
                                if (!err) {
                                    if (activityTypeCategoryId === 48) {
                                        activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});
                                        // ######################################################################################
                                        let pubnubMsg = {};
                                        pubnubMsg.type = 'activity_unread';
                                        pubnubMsg.organization_id = request.organization_id;
                                        pubnubMsg.desk_asset_id = participantData.asset_id;
                                        pubnubMsg.activity_type_category_id = request.activity_type_category_id || 0;
                                        pubnubMsg.description = `Added you as a participant in ${request.activity_title}.`;
                                        console.log('Participant Add | PubNub Message: ', pubnubMsg);
                                        activityPushService.pubNubPush({
                                            asset_id: participantData.asset_id,
                                            organization_id: request.organization_id
                                        }, pubnubMsg, function (err, data) {});
                                        // ######################################################################################
                                    }
                                }
                            });
                        } else if (activityTypeCategoryId === 9 && fieldId > 0) {
                            activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                            });
                        }

                    }

                    //PAM
                    if (activityTypeCategoryId == 39 || activityTypeCategoryId == 38) {
                        assignUnassignParticipantPam(request, participantData, 1, function (err, resp) {}); //1 for assign
                    }

                    activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 0, function (err, restult) {

                    });
                    callback(false, true);
                } else {
                    callback(err, false);
                }
            });

        } else {
            //console.log('re-assigining to the archived row');
            global.logger.write('conLog', 're-assigining to the archived row', {}, {})
            activityAssetMappingUpdateParticipantReAssign(request, participantData, function (err, data) {
                if (err === false) {
                    activityPushService.sendPush(request, objectCollection, participantData.asset_id, function () {});
                    activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 502, function (err, restult) {
                        if (err === false) {
                            activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                            });

                            console.log('BEFORE ACTIVITY TIMELINE INSERT activityTypeCategoryId :: '+activityTypeCategoryId);
                            if (activityTypeCategoryId === 48 || activityTypeCategoryId === 9) {
                                activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {
                                    // ######################################################################################
                                    if (activityTypeCategoryId === 48) {
                                        activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});
                                        let pubnubMsg = {};
                                        pubnubMsg.type = 'activity_unread';
                                        pubnubMsg.organization_id = request.organization_id;
                                        pubnubMsg.desk_asset_id = participantData.asset_id;
                                        pubnubMsg.activity_type_category_id = request.activity_type_category_id || 0;
                                        pubnubMsg.description = `Added you as a participant in ${request.activity_title}.`;
                                        console.log('Participant Add | PubNub Message: ', pubnubMsg);
                                        activityPushService.pubNubPush({
                                            asset_id: participantData.asset_id,
                                            organization_id: request.organization_id
                                        }, pubnubMsg, function (err, data) {});
                                    }
                                    // ######################################################################################
                                });
                            }
                            
                            if (activityTypeCategoryId !== 10 && activityTypeCategoryId !== 11 && (activityTypeCategoryId === 9 && fieldId > 0)) {
                                activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                                });
                            } else {
                                //console.log('either documnent or a file');
                                global.logger.write('conLog', 'either documnent or a file', {}, {})
                            }
                        }

                        //PAM
                        if (activityTypeCategoryId == 39 || activityTypeCategoryId == 38) {
                            assignUnassignParticipantPam(request, participantData, 1, function (err, resp) {}); //1 for assign
                        }

                    });
                    callback(false, true);
                } else {
                    callback(err, false);
                }
            });
        }
    };

    var assignUnassignParticipantPam = function (request, participantData, status, callback) {
        updateActivityListOwnerLeadPam(request, participantData, status, function (err, data) {
            if (err === false) { //You will get it from participant collection
                if (participantData.asset_category_id == 32 ||
                    participantData.asset_category_id == 33 ||
                    participantData.asset_category_id == 34 ||
                    participantData.asset_category_id == 35
                ) {
                    activityCommonService.activityListHistoryInsert(request, 409, function () {});
                } else if (participantData.asset_category_id == 41) {
                    activityCommonService.activityListHistoryInsert(request, 410, function () {});
                }
            }

        })

        activityCommonService.getAllParticipants(request, function (err, participantsData) {
            if (err === false) {
                if (participantsData.length > 0) {
                    if (status === 0) {
                        participantData.asset_id = 0;
                    }
                    participantsData.forEach(function (rowData, index) {

                        paramsArr = new Array(
                            request.activity_id,
                            rowData['asset_id'],
                            participantData.asset_id, //have to take from participant collection
                            request.organization_id,
                            request.activity_type_category_id,
                            participantData.asset_category_id, // have to take from participant collection
                            0, //request.flag
                            request.asset_id,
                            request.datetime_log
                        );
                        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_owner_lead_pam', paramsArr);
                        db.executeQuery(0, queryString, request, function (error, queryResponse) {});
                    }, this);
                    callback(false, true);
                }
            }

        });
    };

    var updateActivityListOwnerLeadPam = function (request, participantCollection, status, callback) {
        var flag = (status === 1) ? 1 : 0;
        var paramsArr = new Array(
            request.activity_id,
            participantCollection.asset_id,
            request.organization_id,
            request.activity_type_category_id,
            participantCollection.asset_category_id,
            flag, //unassign = 0 and assign 1
            request.asset_id,
            request.datetime_log
        );
        var queryString = util.getQueryString("ds_v1_activity_list_update_owner_lead_pam", paramsArr);
        if (queryString != '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    //console.log(err);
                    global.logger.write('serverError', err, err, {})
                    return;
                }
            });
        }
    }

    //BETA
    this.updateParticipantTimestamp = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        //Update the collaborator joining timestamp
        updateTimeStamp(request, function (err, data) {
            if (err === false) {
                //Insert update collaborator joining timestamp log in history
                activityCommonService.assetActivityListHistoryInsert(request, request.target_asset_id, 504, function (err, restult) {});

                //Update the asset_datetime_last_seen of the current collaborator
                activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) {});

                //Add timeline entry in asset timeline
                activityCommonService.assetTimelineTransactionInsert(request, {}, 1609, function (err, data) {});
            }

        });
    };

    //BETA
    var updateTimeStamp = function (request, callback) {
        var paramsArr = new Array(
            request.activity_id,
            request.target_asset_id,
            request.organization_id,
            request.joining_datetime,
            request.asset_id,
            request.datetime_log
        );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_update_joining_datetime", paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                } else {
                    global.logger.write('serverError', err, {}, {});
                    callback(true, err);
                }
            });
        }
    };

    var activityAssetMappingInsertParticipantAssign = function (request, participantData, callback) {
        var fieldId = 0;
        var quantityUnitType = (request.hasOwnProperty('quantity_unit_type')) ? request.quantity_unit_type : '';
        var quantityUnitValue = (request.hasOwnProperty('quantity_unit_value')) ? request.quantity_unit_value : -1;

        if (participantData.hasOwnProperty('field_id')) {
            fieldId = participantData.field_id;
        }
        var paramsArr = new Array(
            request.activity_id,
            participantData.asset_id,
            participantData.workforce_id,
            participantData.account_id,
            participantData.organization_id,
            participantData.access_role_id,
            participantData.message_unique_id,
            request.flag_retry || 0,
            request.flag_offline || 0,
            request.asset_id,
            request.datetime_log,
            fieldId,
            quantityUnitType,
            quantityUnitValue
        );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_insert_asset_assign_appr_ingre", paramsArr);
        //var queryString = util.getQueryString("ds_v1_activity_asset_mapping_insert_asset_assign_appr", paramsArr);

        if (queryString !== '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    //PAM
                    /*if(request.activity_type_category_id == 37 && participantData.asset_category_id == 30) {
                        console.log('data[0].dateTimeEndEstimatedActivity : ' + data[0].dateTimeEndEstimatedActivity);
                        var expDatetime = util.replaceDefaultDatetime(data[0].dateTimeEndEstimatedActivity);
                        //expDatetime = util.addUnitsToDateTime(expDatetime,6.5,'hours');
                        console.log('EXP DATE : ' + expDatetime);
                        
                        if(expDatetime == "Invalid date"){
                            expDatetime = "1970-01-01 00:00:00";
                        }                        
                        var smsText = "Dear " + data[0].firstNameAsset + " , Your reservation for today is confirmed. Please use the following reservation code " + data[0].nameActivitySubType;
                        smsText+= " . Note that this reservation code is only valid till "+ expDatetime + " .";
                        console.log('SMS text : \n', smsText);
                        util.pamSendSmsMvaayoo(smsText, data[0].countryCode, data[0].phoneNumber, function(err,res){});
                    }*/
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    //console.log(err);
                    global.logger.write('serverError', err, {}, {})
                    return;
                }
            });
        }
    };

    var activityAssetMappingUpdateParticipantReAssign = function (request, participantData, callback) {
        var fieldId = 0;
        if (participantData.hasOwnProperty('field_id')) {
            fieldId = participantData.field_id;
        }
        var paramsArr = new Array(
            request.activity_id,
            participantData.asset_id,
            participantData.organization_id,
            fieldId,
            request.asset_id,
            request.datetime_log
        );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_update_reassign_participant_appr", paramsArr);

        if (queryString !== '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    //console.log(err);
                    global.logger.write('serverError', err, {}, {})
                    return;
                }
            });
        }
    };

    var activityAssetMappingInsertParticipantUnassign = function (request, participantData, callback) {
        //IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        var paramsArr = new Array(
            request.activity_id,
            participantData.asset_id,
            request.organization_id,
            request.asset_id,
            request.datetime_log

        );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_update_asset_unassign", paramsArr);

        if (queryString != '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    //console.log(err);
                    global.logger.write('serverError', err, {}, {})
                    return;
                }
            });
        }
    };

    var updateParticipantCount = function (activityId, organizationId, request, callback) {
        var paramsArr = new Array(
            activityId,
            organizationId
        );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_select_participant_count", paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    var participantCount = data[0].participant_count;
                    //console.log('participant count retrieved from query is: ' + participantCount);
                    global.logger.write('conLog', 'participant count retrieved from query is: ' + participantCount, request)
                    paramsArr = new Array(
                        activityId,
                        organizationId,
                        participantCount
                    );
                    queryString = util.getQueryString("ds_v1_1_activity_list_update_participant_count", paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                activityCommonService.getAllParticipants(request, function (err, participantsData) {

                                    if (err === false && participantsData.length > 0) {

                                        participantsData.forEach(function (rowData, index) {

                                            paramsArr = new Array(
                                                activityId,
                                                rowData.asset_id,
                                                request.organization_id,
                                                participantCount,
                                                request.datetime_log
                                            );
                                            queryString = util.getQueryString('ds_v1_1_activity_asset_mapping_update_participant_count', paramsArr);

                                            if (queryString != '') {
                                                db.executeQuery(0, queryString, request, function (err, data) {
                                                    if (err === false) {
                                                        callback(true, false);
                                                    } else {
                                                        // some thing is wrong and have to be dealt
                                                        callback(true, false);
                                                    }
                                                });
                                            }


                                        }, this);
                                        callback(false, true);
                                    } else {
                                        callback(true, false);
                                    }
                                });
                                callback(false, true);
                                return;
                            } else {
                                callback(err, false);
                                //console.log(err);
                                global.logger.write('serverError', err, {}, request)
                                return;
                            }
                        });
                    }
                } else {
                    callback(err, false);
                    //console.log(err);
                    global.logger.write('serverError', err, {}, {})
                    return;
                }
            });
        }
    };

    var unassignAssetFromActivity = function (request, participantData, callback) {
        var fieldId = 0;
        if (participantData.hasOwnProperty('field_id')) {
            fieldId = participantData.field_id;
        }
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        activityAssetMappingInsertParticipantUnassign(request, participantData, function (err, data) {
            if (err === false) {

                activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 501, function (err, restult) {
                    if (err === false) {
                        activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                        });
                        if (activityTypeCategoryId !== 10 && activityTypeCategoryId !== 11) {
                            if (activityTypeCategoryId !== 9) {
                                activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                                });
                            } else if (activityTypeCategoryId === 9 && fieldId > 0) {
                                activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                                });
                            }
                        }
                        //PAM
                        if (activityTypeCategoryId == 39 || activityTypeCategoryId == 38) {
                            assignUnassignParticipantPam(request, participantData, 0, function (err, resp) {}); //1 for unassign
                        }
                    }
                });

                callback(false, true);
            } else {
                callback(false, false);
            }
        });
    }

    var updateAssetParticipantAccess = function (request, participantData, callback) {
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        var fieldId = 0;
        if (participantData.hasOwnProperty('field_id')) {
            fieldId = participantData.field_id;
        }
        activityAssetMappingUpdateParticipantAccess(request, participantData, function (err, data) {
            if (err === false) {

                activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                });
                if (activityTypeCategoryId !== 10 && activityTypeCategoryId !== 11) {
                    if (activityTypeCategoryId !== 9) {
                        activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                        });
                    } else if (activityTypeCategoryId === 9 && fieldId > 0) {
                        activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                        });
                    }
                }
                activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 503, function (err, restult) {

                });

                callback(false, true);
            } else {
                callback(false, false);
            }
        });
    }

    var activityAssetMappingUpdateParticipantAccess = function (request, participantData, callback) {
        //IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        var paramsArr = new Array(
            request.activity_id,
            participantData.asset_id,
            participantData.organization_id,
            participantData.access_role_id,
            request.asset_id,
            request.datetime_log
        );

        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_update_asset_aceess", paramsArr);

        if (queryString != '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    //console.log(err);
                    global.logger.write('serverError', err, err, {})
                    return;
                }
            });
        }
    };

    this.addInviteeAsParticipantToIdCard = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var activityParticipantCollection = JSON.parse(request.activity_participant_collection);

        activityAssetMappingInsertParticipantAssign(request, activityParticipantCollection[0], function (err, data) {
            if (err === false) {
                callback(false, {}, 200);
            } else {
                callback(true, {}, -9999);
            }
        });
    };

};

module.exports = ActivityParticipantService;
