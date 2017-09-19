/* 
 * author: Sri Sai Venkatesh
 */

function ActivityParticipantService(objectCollection) {

    var db = objectCollection.db;
    var cacheWrapper = objectCollection.cacheWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var util = objectCollection.util;
    var sns = objectCollection.sns;

    this.getParticipantsList = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                request.datetime_differential,
                request.page_start,
                request.page_limit
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatParticipantList(data, function (err, response) {
                        if (err === false)
                            callback(false, {data: response}, 200);
                    });
                    activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
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
                'asset_type_category_name': util.replaceDefaultString(rowData['asset_type_category_name']),
                'asset_image_path': (util.replaceDefaultString(rowData['asset_image_path']) !== ''),
                'asset_phone_number': util.replaceDefaultString(rowData['asset_phone_number']),
                'asset_phone_number_code': util.replaceDefaultString(rowData['asset_phone_country_code']),
                'log_asset_id': util.replaceDefaultNumber(rowData['log_asset_id']),
                'log_state': util.replaceDefaultNumber(rowData['log_state']),
                'log_active': util.replaceDefaultNumber(rowData['log_active']),
                "operating_asset_id": util.replaceZero(rowData['operating_asset_id']),
                "operating_asset_first_name": util.replaceDefaultString(rowData['operating_asset_first_name']),
                "operating_asset_last_name": util.replaceDefaultString(rowData['operating_asset_last_name'])
            };
            responseData.push(rowDataArr);
        }, this);
        callback(false, responseData);
    };

    this.assignCoworker = function (request, callback) {

        var loopAddParticipant = function (participantCollection, index, maxIndex) {
            iterateAddParticipant(participantCollection, index, maxIndex, function (err, data) {
                if (err === false) {
                    if (index === maxIndex) {
                        updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) { });
                        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                        if (request.hasOwnProperty('device_os_id')) {
                            if (Number(request.device_os_id) !== 5) {
                                //incr the asset_message_counter                        
                                cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                                    if (err) {
                                        console.log("error in setting in asset parity");
                                    } else
                                        console.log("asset parity is set successfully")

                                });
                            }
                        }
                    }
                } else {
                    console.log("something is not wright in adding a participant");
                }
            });
        };

        var iterateAddParticipant = function (participantCollection, index, maxIndex, callback) {

            var participantData = participantCollection[index];
            isParticipantAlreadyAssigned(participantData, request.activity_id, request, function (err, alreadyAssignedStatus, newRecordStatus) {
                if ((err === false) && (!alreadyAssignedStatus)) {
                    //proceed and add a participant
                    addParticipant(request, participantData, newRecordStatus, function (err, data) {
                        if (err === false) {
                            console.log("participant successfully added");
                            var nextIndex = index + 1;
                            if (nextIndex <= maxIndex) {
                                loopAddParticipant(participantCollection, nextIndex, maxIndex);
                            }
                            if (Number(request.activity_type_category_id) === 28) {// post it, send a push notification
                                var participantParamsArr = new Array(
                                        participantData.organization_id,
                                        participantData.asset_id
                                        );

                                var queryString = util.getQueryString('ds_v1_asset_list_select', participantParamsArr);
                                if (queryString != '') {
                                    db.executeQuery(1, queryString, request, function (err, data) {
                                        if (data.length > 0) {
                                            var assetPushArn = data[0].asset_push_arn;
                                            //console.log('from query we got ' + assetPushArn + ' as arn');
                                            this.getActivityDetails(request, function (err, activityData) {
                                                if (err === false) {
                                                    var inlineData = JSON.parse(activityData[0]['activity_inline_data']);
                                                    //console.log(inlineData);
                                                    var pushString = {
                                                        title: inlineData.sender.asset_name + ' sent a Post-It: ',
                                                        description: activityData[0]['description'].substring(0, 100)
                                                    };
                                                    // get badge count
                                                    var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_unread_task_count', participantParamsArr);
                                                    if (queryString != '') {
                                                        db.executeQuery(1, queryString, request, function (err, data) {
                                                            if (err === false) {
                                                                var badgeCount = util.replaceOne(data[0]['badge_count']);
                                                                sns.publish(pushString, badgeCount, assetPushArn);
                                                            }
                                                        });
                                                    }


                                                }
                                            });
                                        } else {
                                            //nothing
                                        }
                                    });
                                }
                            }
                            callback(false, true);
                        } else {
                            console.log(err);
                            callback(true, false);
                        }
                    }.bind(this));
                } else {
                    if (alreadyAssignedStatus > 0) {
                        console.log("participant already assigned");
                        var nextIndex = index + 1;
                        if (nextIndex <= maxIndex) {
                            console.log("next index is: ", nextIndex);
                            loopAddParticipant(participantCollection, nextIndex, maxIndex);
                        }
                        callback(false, false);
                    } else {
                        callback(true, false);
                    }
                }
            });

        };

        var activityStreamTypeId = 2;
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
                case 9: //form
                    activityStreamTypeId = 702;
                    break;
                case 10:    //document
                    activityStreamTypeId = 306;
                    break;
                case 11:    //folder
                    activityStreamTypeId = 1403;
                    break;
                case 14:    //voice call
                    break;
                case 15:    //video conference
                    break;
                case 28:    // post-it
                    activityStreamTypeId = 902;
                    break;
                case 29:    // External Contact Card - Supplier
                    activityStreamTypeId = 1206;
                    break;
                case 30:    //contact group
                    activityStreamTypeId = 1301;
                    break;
                default:
                    activityStreamTypeId = 2;   //by default so that we know
                    console.log('adding streamtype id 2');
                    break;

            }
            ;
        }

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        request['activity_streamtype_id'] = activityStreamTypeId;

        var index = 0;
        var activityParticipantCollection = JSON.parse(request.activity_participant_collection);
        var maxIndex = activityParticipantCollection.length - 1;
        //var maxIndex = request.activity_participant_collection.length - 1;        
        iterateAddParticipant(activityParticipantCollection, index, maxIndex, function (err, data) {
            if (err === false && data === true) {
                //callback(false, {}, 200);
                if (maxIndex === index) {
                    updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) { });
                    activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                    if (request.hasOwnProperty('device_os_id')) {
                        if (Number(request.device_os_id) !== 5) {
                            //incr the asset_message_counter                        
                            cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                                if (err) {
                                    console.log("error in setting in asset parity");
                                } else
                                    console.log("asset parity is set successfully")

                            });
                        }
                    }
                }
            } else {
                //console.log("something is not wright in adding a participant");
            }
        });
    };


    this.unassignParticicpant = function (request, callback) {

        var loopUnassignParticipant = function (participantCollection, index, maxIndex) {
            iterateUnassignParticipant(participantCollection, index, maxIndex, function (err, data) {
                if (err === false) {
                    if (index === maxIndex) {
                        updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) { });
                        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                        if (request.hasOwnProperty('device_os_id')) {
                            if (Number(request.device_os_id) !== 5) {
                                //incr the asset_message_counter                        
                                cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                                    if (err) {
                                        console.log("error in setting in asset parity");
                                    } else
                                        console.log("asset parity is set successfully")

                                });
                            }
                        }
                    }
                } else {
                    console.log("something is not wright in unassign a participant");
                }
            });
        };

        var iterateUnassignParticipant = function (participantCollection, index, maxIndex, callback) {
            var participantData = participantCollection[index];
            unassignAssetFromActivity(request, participantData, function (err, data) {
                if (err === false) {
                    console.log("participant successfully un-assigned");
                    var nextIndex = index + 1;
                    if (nextIndex <= maxIndex) {
                        loopUnassignParticipant(participantCollection, nextIndex, maxIndex);
                    }
                    callback(false, true);
                } else {
                    console.log(err);
                    callback(true, false);
                }
            }.bind(this));
        };

        var activityStreamTypeId = 3;
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
                case 9: //form
                    activityStreamTypeId = 707;
                    break;
                case 10:    //document
                    activityStreamTypeId = 308;
                    break;
                case 11:    //folder
                    activityStreamTypeId = 1405;
                    break;
                case 14:    //voice call
                    break;
                case 15:    //video conference
                    break;
                case 28:    // post-it
                    activityStreamTypeId = 906;
                    break;
                case 29:    // External Contact Card - Supplier
                    activityStreamTypeId = 1209;
                    break;
                case 30:    //contact group
                    activityStreamTypeId = 1301;
                    break;
                default:
                    activityStreamTypeId = 3;   //by default so that we know
                    console.log('adding streamtype id 3');
                    break;

            }
            ;
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
                    updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) { });
                    activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                    if (request.hasOwnProperty('device_os_id')) {
                        if (Number(request.device_os_id) !== 5) {
                            //incr the asset_message_counter                        
                            cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                                if (err) {
                                    console.log("error in setting in asset parity");
                                } else
                                    console.log("asset parity is set successfully")

                            });
                        }
                    }
                }
            } else {
                //console.log("something is not wright in adding a participant");
            }
        });
    };

    this.updateParticipantAccess = function (request, callback) {

        var loopUpdateParticipantAccess = function (participantCollection, index, maxIndex) {
            iterateUpdateParticipantAccess(participantCollection, index, maxIndex, function (err, data) {
                if (err === false) {
                    if (index === maxIndex) {
                        activityCommonService.updateActivityLogDiffDatetime(request, 0, function (err, data) {
                            activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                        });
                        if (request.hasOwnProperty('device_os_id')) {
                            if (Number(request.device_os_id) !== 5) {
                                //incr the asset_message_counter                        
                                cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                                    if (err) {
                                        console.log("error in setting in asset parity");
                                    } else
                                        console.log("asset parity is set successfully")

                                });
                            }
                        }
                    }
                } else {
                    console.log("something is not wright in unassign a participant");
                }
            });
        };

        var iterateUpdateParticipantAccess = function (participantCollection, index, maxIndex, callback) {
            var participantData = participantCollection[index];
            updateAssetParticipantAccess(request, participantData, function (err, data) {
                if (err === false) {
                    console.log("participant successfully updated");
                    var nextIndex = index + 1;
                    if (nextIndex <= maxIndex) {
                        loopUpdateParticipantAccess(participantCollection, nextIndex, maxIndex);
                    }
                    callback(false, true);
                } else {
                    console.log(err);
                    callback(true, false);
                }
            }.bind(this));
        };

        var activityStreamTypeId = 3;
        if (request.hasOwnProperty('activity_type_category_id')) {
            var activityTypeCategroyId = Number(request.activity_type_category_id);
            switch (activityTypeCategroyId) {
                case 2: // notepad 
                    activityStreamTypeId = 4;//adding a default value
                    break;
                case 3: //plant
                    break;
                case 4: //employee id card
                    activityStreamTypeId = 4;    // adding a default value                    
                    break;
                case 5: //Co-worker Contact Card
                    activityStreamTypeId = 4;   // adding a default value
                    break;
                case 6: //  External Contact Card - Customer
                    activityStreamTypeId = 4; // adding a default value
                    break;
                case 9: //form
                    activityStreamTypeId = 703;
                    break;
                case 10:    //document
                    activityStreamTypeId = 307;
                    break;
                case 11:    //folder
                    activityStreamTypeId = 1404;
                    break;
                case 14:    //voice call
                    break;
                case 15:    //video conference
                    break;
                case 28:    // post-it
                    activityStreamTypeId = 4;   // adding a default value
                    break;
                case 29:    // External Contact Card - Supplier
                    activityStreamTypeId = 4;   // adding a default value
                    break;
                case 30:    //contact group
                    activityStreamTypeId = 4;   // adding a default value
                    break;
                default:
                    activityStreamTypeId = 4;   //by default so that we know
                    console.log('adding streamtype id 4');
                    break;

            }
            ;
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
                        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                    });
                    if (request.hasOwnProperty('device_os_id')) {
                        if (Number(request.device_os_id) !== 5) {
                            //incr the asset_message_counter                        
                            cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                                if (err) {
                                    console.log("error in setting in asset parity");
                                } else
                                    console.log("asset parity is set successfully")

                            });
                        }
                    }
                }
            } else {
                //console.log("something is not wright in adding a participant");
            }
        });
    };

    var addParticipant = function (request, participantData, newRecordStatus, callback) {
        var fieldId = 0;
        if (participantData.hasOwnProperty('field_id')) {
            fieldId = participantData.field_id;
        }
        if (newRecordStatus) {
            activityAssetMappingInsertParticipantAssign(request, participantData, function (err, data) {
                if (err === false) {
                    activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                    });
                    if (Number(request.activity_type_category_id) !== 10 || Number(request.activity_type_category_id) !== 11 || (Number(request.activity_type_category_id) === 9 && fieldId > 0)) {
                        activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                        });
                    } else {
                        console.log('either documnent or a file');
                    }
                    activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 0, function (err, restult) {

                    });
                    callback(false, true);
                } else {
                    callback(err, false);
                }
            });

        } else {
            console.log('re-assigining to the archived row');
            activityAssetMappingUpdateParticipantReAssign(request, participantData, function (err, data) {
                if (err === false) {
                    activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 502, function (err, restult) {
                        if (err === false) {
                            activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                            });
                            if (Number(request.activity_type_category_id) !== 10 || Number(request.activity_type_category_id) !== 11 || (Number(request.activity_type_category_id) === 9 && fieldId > 0)) {
                                activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                                });
                            } else {
                                console.log('either documnent or a file');
                            }
                        }
                    });
                    callback(false, true);
                } else {
                    callback(err, false);
                }
            });
        }
    };

    var isParticipantAlreadyAssigned = function (assetCollection, activityId, request, callback) {
        var fieldId = 0;
        if (assetCollection.hasOwnProperty('field_id')) {
            fieldId = assetCollection.field_id;
        }
        var paramsArr = new Array(
                activityId,
                assetCollection.asset_id,
                assetCollection.organization_id,
                fieldId
                );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_select_check_participant_appr", paramsArr);

        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false)
                {
                    //var queryStatus = (data.length > 0) ? (data[0]['log_state']< 3)?true:false : false;
                    var queryStatus = false;
                    var newRecordFalg = false;
                    if (data.length > 0) {
                        if (data[0]['log_state'] < 3) {
                            queryStatus = true;
                        } else {
                            queryStatus = false;
                            newRecordFalg = false;
                        }
                    } else {
                        queryStatus = false;
                        newRecordFalg = true;
                    }
                    callback(false, queryStatus, newRecordFalg);
                    return;
                } else {
                    callback(err, false);
                    console.log(err);
                    return;
                }
            });
        }
    };

    var activityAssetMappingInsertParticipantAssign = function (request, participantData, callback) {
        var fieldId = 0;
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
                request.flag_retry,
                request.flag_offline,
                request.asset_id,
                request.datetime_log,
                fieldId
                );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_insert_asset_assign_appr", paramsArr);

        if (queryString !== '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    console.log(err);
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
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    console.log(err);
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
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    console.log(err);
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
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false)
                {
                    var participantCount = data[0].participant_count;
                    console.log('participant count retrieved from query is: ' + participantCount);
                    paramsArr = new Array(
                            activityId,
                            organizationId,
                            participantCount
                            );
                    queryString = util.getQueryString("ds_v1_1_activity_list_update_participant_count", paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false)
                            {
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
                                console.log(err);
                                return;
                            }
                        });
                    }
                } else {
                    callback(err, false);
                    console.log(err);
                    return;
                }
            });
        }
    };

    var unassignAssetFromActivity = function (request, participantData, callback) {

        activityAssetMappingInsertParticipantUnassign(request, participantData, function (err, data) {
            if (err === false) {

                activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 501, function (err, restult) {
                    if (err === false) {
                        activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                        });
                        if (Number(request.activity_type_category_id) !== 10 || Number(request.activity_type_category_id) !== 11) {
                            //add form case also here
                            activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                            });
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

        activityAssetMappingUpdateParticipantAccess(request, participantData, function (err, data) {
            if (err === false) {

                activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                });
                if (Number(request.activity_type_category_id) !== 10 || Number(request.activity_type_category_id) !== 11) {
                    activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {

                    });
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
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    console.log(err);
                    return;
                }
            });
        }
    };


}
;
module.exports = ActivityParticipantService;
