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
                //'log_asset_name': util.replaceDefaultString(rowData['log__name']),
                'log_state': util.replaceDefaultNumber(rowData['log_state']),
                'log_active': util.replaceDefaultNumber(rowData['log_active']),
                //'datetime_log': util.replaceDefaultDatetime(rowData['datetime_log']),
                //'log_active_datetime': (util.replaceDefaultDatetime(rowData['log_active_datetime']) === '1970-01-01 00:00:00') ? 'Never' : util.replaceDefaultDatetime(rowData['log_active_datetime']),
                //'log_last_seen_datetime': (util.replaceDefaultDatetime(rowData['log_last_seen_datetime']) === '1970-01-01 00:00:00') ? 'Never' : util.replaceDefaultDatetime(rowData['log_last_seen_datetime']),
                //'last_seen_datetime': util.replaceDefaultDatetime(rowData['log_last_seen_datetime']),
                //'message_unique_id': util.replaceDefaultString(rowData['message_unique_id']),
                //"participant_access_id": util.replaceDefaultNumber(rowData['activity_participant_access_id']),
                //"participant_access_name": util.replaceDefaultString(rowData['activity_participant_access_name'])       

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
                        cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                            if (err) {
                                console.log("error in setting in asset parity");
                            } else
                                console.log("asset parity is set successfully")

                        });
                    }
                } else {
                    console.log("something is not wright in adding a participant");
                }
            });
        };

        var iterateAddParticipant = function (participantCollection, index, maxIndex, callback) {

            var participantData = participantCollection[index];
            isParticipantAlreadyAssigned(participantData, request.activity_id, request, function (err, alreadyAssignedStatus) {
                if ((err === false) && (!alreadyAssignedStatus)) {
                    //proceed and add a participant
                    addParticipant(request, participantData, function (err, data) {
                        if (err === false) {
                            console.log("participant successfully added");
                            var nextIndex = index + 1;
                            if (nextIndex <= maxIndex) {
                                loopAddParticipant(participantCollection, nextIndex, maxIndex);
                            }
                            if (Number(request.activity_type_category_id) === 28) {// post it, send a push notification
                                //sns.publish();
                                //asset_push_arn
                                var participantParamsArr = new Array(
                                        participantData.organization_id,
                                        participantData.asset_id
                                        );

                                var queryString = util.getQueryString('ds_v1_asset_list_select', participantParamsArr);
                                if (queryString != '') {
                                    db.executeQuery(1, queryString, request, function (err, data) {
                                        if (data.length > 0) {
                                            //console.log(data);
                                            var assetPushArn = data[0].asset_push_arn;
                                            console.log('from query we got ' + assetPushArn + ' as arn');
                                            var paramsArr = new Array(
                                                    request.activity_id,
                                                    request.organization_id
                                                    );
                                            var queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
                                            if (queryString != '') {
                                                db.executeQuery(1, queryString, request, function (err, data) {
                                                    if (err === false) {
                                                        console.log(data);
                                                        var inlineData = JSON.parse(data[0]['activity_inline_data']);
                                                        console.log(inlineData);
                                                        var pushString = {
                                                            title:inlineData.sender.asset_name + ' sent a Post-It: ',
                                                            description:data[0]['description'].substring(0, 100)
                                                        };
                                                        // get badge count
                                                        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_unread_task_count',participantParamsArr );
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
                                            }


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
                        callback(false, false);
                    } else {
                        callback(true, false);
                    }
                }
            });

        };

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var index = 0;
        var activityParticipantCollection = JSON.parse(request.activity_participant_collection);
        var maxIndex = activityParticipantCollection.length - 1;
        //var maxIndex = request.activity_participant_collection.length - 1;        
        iterateAddParticipant(activityParticipantCollection, index, maxIndex, function (err, data) {
            if (err === false && data === true) {
                //callback(false, {}, 200);
                if (maxIndex === index) {
                    updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) { });
                    cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                        if (err) {
                            console.log("error in setting in asset parity");
                        } else
                            console.log("asset parity is set successfully")

                    });
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
                        cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                            if (err) {
                                console.log("error in setting in asset parity");
                            } else
                                console.log("asset parity is set successfully")

                        });
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

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var index = 0;
        var activityParticipantCollection = JSON.parse(request.activity_participant_collection);
        var maxIndex = activityParticipantCollection.length - 1;
        //var maxIndex = request.activity_participant_collection.length - 1;        
        iterateUnassignParticipant(activityParticipantCollection, index, maxIndex, function (err, data) {
            if (err === false && data === true) {
                //callback(false, {}, 200);
                if (maxIndex === index) {
                    updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) { });
                    cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                        if (err) {
                            console.log("error in setting in asset parity");
                        } else
                            console.log("asset parity is set successfully")

                    });
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
                        //updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) { });
                        cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                            if (err) {
                                console.log("error in setting in asset parity");
                            } else
                                console.log("asset parity is set successfully")

                        });
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

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var index = 0;
        var activityParticipantCollection = JSON.parse(request.activity_participant_collection);
        var maxIndex = activityParticipantCollection.length - 1;
        //var maxIndex = request.activity_participant_collection.length - 1;        
        iterateUpdateParticipantAccess(activityParticipantCollection, index, maxIndex, function (err, data) {
            if (err === false && data === true) {
                //callback(false, {}, 200);
                if (maxIndex === index) {
                    //updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) { });
                    cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                        if (err) {
                            console.log("error in setting in asset parity");
                        } else
                            console.log("asset parity is set successfully")

                    });
                }
            } else {
                //console.log("something is not wright in adding a participant");
            }
        });
    };

    var addParticipant = function (request, participantData, callback) {

        activityAssetMappingInsertParticipantAssign(request, participantData, function (err, data) {
            if (err === false) {
                var streamTypeId = 2;
                activityCommonService.assetTimelineTransactionInsert(request, participantData, streamTypeId, function (err, data) {

                });
                //activityCommonService.activityTimelineTransactionInsert(request, participantData, streamTypeId, function (err, data) { });
                activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 0, function (err, restult) {

                });
                callback(false, true);
            } else {
                callback(err, false);
            }
        });

        //activityCommonService.resourceRanking();

    };

    var isParticipantAlreadyAssigned = function (assetCollection, activityId, request, callback) {

        var paramsArr = new Array(
                activityId,
                assetCollection.asset_id,
                assetCollection.organization_id
                );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_select_asset", paramsArr);

        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false)
                {
                    var queryStatus = (data.length > 0) ? true : false;
                    callback(false, queryStatus);
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
                request.datetime_log

                );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_insert_asset_assign", paramsArr);

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
        var queryString = util.getQueryString("ds_v1_activity_list_update_participant_count", paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    queryString = util.getQueryString("ds_v1_activity_asset_mapping_update_participant_count", paramsArr);
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
                var streamTypeId = 3;

                activityCommonService.assetTimelineTransactionInsert(request, participantData, streamTypeId, function (err, data) {

                });
                //activityCommonService.activityTimelineTransactionInsert(request, participantData, streamTypeId, function (err, data) {   });
                activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 20, function (err, restult) {

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
                var streamTypeId = 307;

                activityCommonService.assetTimelineTransactionInsert(request, participantData, streamTypeId, function (err, data) {

                });
                //activityCommonService.activityTimelineTransactionInsert(request, participantData, streamTypeId, function (err, data) {  });
                activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 24, function (err, restult) {

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
