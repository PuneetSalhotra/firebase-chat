/* 
 * author: Sri Sai Venkatesh
 */

function ActivityCommonService(db, util) {

    this.getAllParticipants = function (request, callback) {
        var paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                0,
                50
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants', paramsArr);
        if (queryString != '') {
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

    this.getAllParticipantsExceptAsset = function (request, assetId, callback) {
        var paramsArr = new Array(
                request.activity_id,
                assetId,
                request.organization_id,
                request.account_id,
                request.workforce_id,
                0,
                50
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_other_participants', paramsArr);
        if (queryString != '') {
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


    this.updateActivityLogDiffDatetime = function (request, assetId, callback) {
        if (assetId > 0) {
            // update log differential datetime for only the asset id
            updateActivityLogDiffDatetimeAsset(request, assetId, function (err, data) {
                if (err === false)
                    callback(false, true);
                else
                    callback(true, false);
            });
        } else {
            //update log differential date time for all participants of activity
            this.getAllParticipants(request, function (err, data) {
                if (err === false) {
                    data.forEach(function (assetData, index) {
                        updateActivityLogDiffDatetimeAsset(request, assetData['asset_id'], function (err, data) {

                        });
                    }, this);
                } else {
                    callback(true, false);
                }
            });
        }

    };

    var updateActivityLogDiffDatetimeAsset = function (request, assetId, callback) {
        var paramsArr = new Array(
                request.activity_id,
                assetId,
                request.organization_id,
                request.datetime_log
                );
        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(true, false);
                    console.log(err);
                    return;
                }
            });
        }
    };

    var updateActivityLogLastUpdatedDatetimeAsset = function (request, assetCollection, callback) {

        var paramsArr = new Array(
                request.activity_id,
                assetCollection.asset_id,
                assetCollection.organization_id,
                request.datetime_log
                );
        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_updated_datetime', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(true, false);
                    console.log(err);
                    return;
                }
            });
        }
    };

    this.updateActivityLogLastUpdatedDatetime = function (request, assetId, callback) {

        function updateAssetsLogDatetime(assetData) {
            assetData.forEach(function (assetInfo, index) {
                var assetCollection = {
                    asset_id: assetInfo['asset_id'],
                    workforce_id: assetInfo['project_id'],
                    account_id: assetInfo['account_id'],
                    organization_id: assetInfo['organization_id']
                };
                updateActivityLogLastUpdatedDatetimeAsset(request, assetCollection, function (err, data) {
                    if (err !== false) {
                        console.log(err);
                    }
                });
            }, this);
        }
        ;
        if (assetId > 0) {
            this.getAllParticipantsExceptAsset(request, assetId, function (err, data) {
                if (err === false) {
                    updateAssetsLogDatetime(data);
                }
            }.bind(this));
        } else {
            this.getAllParticipants(request, function (err, data) {
                if (err === false) {
                    updateAssetsLogDatetime(data);
                }
            }.bind(this));
        }
    };


    this.activityListHistoryInsert = function (request, updateTypeId, callback) {

        var paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                updateTypeId,
                request.datetime_log // server log date time
                );

        var queryString = util.getQueryString('ds_v1_activity_list_history_insert', paramsArr);
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


    this.assetActivityListHistoryInsert = function (request, assetId, updateTypeId, callback) {
        if (assetId === 0) {
            assetId = request.asset_id;
        }
        var paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                assetId,
                updateTypeId,
                request.datetime_log // server log date time
                );

        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_history_insert', paramsArr);
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

    this.assetTimelineTransactionInsert = function (request, participantData, streamTypeId, callback) {

        var activityId = util.replaceZero(request.activity_id);
        var organizationId = request.organization_id;
        var accountId = request.account_id;
        var workforceId = request.workforce_id;
        var assetId = request.asset_id;
        var messageUniqueId = request.message_unique_id;
        var entityTypeId = 0;
        var entityText1 = "";
        var entityText2 = "";
        var formTransactionId = 0;
        var dataTypeId = 0;
        var formId = 0;
        var retryFlag = 0;
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;

        if (request.hasOwnProperty('activity_type_category_id')) {
            var activityTypeCategoryId = Number(request.activity_type_category_id);
            if (activityTypeCategoryId === 4) {
                if (request.hasOwnProperty('activity_inline_data')) {
                    var inlineJson = JSON.parse(request.activity_inline_data);
                    var assetId = inlineJson.employee_asset_id;
                }
            } else {
                var assetId = request.asset_id;
            }
        } else {
            var assetId = request.asset_id;
        }

        if (participantData.hasOwnProperty('organization_id')) {

            organizationId = participantData.organization_id;
            accountId = participantData.account_id;
            workforceId = participantData.workforce_id;
            assetId = participantData.asset_id;
            messageUniqueId = participantData.message_unique_id
        }

        switch (streamTypeId) {
            case 4:         // activity updated
                entityTypeId = 0;
                entityText1 = "activity updated";
                entityText2 = request.activity_inline_data;
                break;
            case 207:   // Contact card has been clipped to a Document
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 309:   // activity cover altered
                entityTypeId = 0;
                entityText1 = ""
                entityText2 = request.activity_cover_collection;
                break;
            case 310:   // text message     --> File
            case 607:   // text message     --> Customer Request
            case 1307:   // text message    --> Visitor Request
            case 1507:   // text message    --> Time Card
                entityTypeId = 0;
                entityText1 = ""
                entityText2 = request.activity_timeline_text;
                break;
            case 311:   // image    --> file           
            case 608:   // image    --> Customer Request          
            case 1308:   // image    --> Visitor Request
            case 1508:   // image   --> Time Card       
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = '';
                break;
            case 313:   // form                
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                entityText2 = request.activity_timeline_collection;
                break;
            case 705:   // form                
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                entityText2 = request.activity_timeline_collection;
                formTransactionId = request.form_transaction_id;
                formId = request.form_id;
                dataTypeId = 37;    //static for all form submissions
                break;
            case 314:   // cloud based document -- file
            case 610:   // cloud based document -- Customer Request
            case 709:   // cloud based document -- Form
            case 1310:   // cloud based document -- Visitor Request
            case 1408:   // cloud based document -- Project
            case 1510:   // cloud based document -- Time Card
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = '';
                break;
            case 315:   // clip mail to task
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 316:   // clip notepad
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            default:
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = "";
                break;
        }
        ;

        var paramsArr = new Array(
                activityId,
                assetId,
                workforceId,
                accountId,
                organizationId,
                streamTypeId,
                entityTypeId, // entity type id
                entityText1, // entity text 1
                entityText2, // entity text 2
                request.track_latitude,
                request.track_longitude,
                formTransactionId, //form_transaction_id   
                formId, //form_id
                dataTypeId, //data_type_id  should be 37 static
                '', //location latitude
                '', //location longitude                
                request.track_gps_accuracy,
                request.track_gps_status,
                request.track_gps_location,
                request.track_gps_datetime,
                "",
                "",
                request.device_os_id,
                "",
                "",
                request.app_version,
                request.service_version,
                request.asset_id,
                messageUniqueId,
                retryFlag,
                util.replaceZero(request.flag_offline),
                request.track_gps_datetime,
                request.datetime_log
                );
        var queryString = util.getQueryString("ds_v1_asset_timeline_transaction_insert_form", paramsArr);
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

    this.activityTimelineTransactionInsert = function (request, participantData, streamTypeId, callback) {
        var assetId = request.asset_id;
        var organizationId = request.organization_id;
        var accountId = request.account_id;
        var workforceId = request.workforce_id;
        var messageUniqueId = request.message_unique_id;
        var entityTypeId = 0;
        var entityText1 = "";
        var entityText2 = "";
        var retryFlag = 0;
        var formTransactionId = 0;
        var dataTypeId = 0;
        var formId = 0;
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;


        if (request.hasOwnProperty('activity_type_category_id')) {
            var activityTypeCategoryId = Number(request.activity_type_category_id);
            if (activityTypeCategoryId === 4) {
                if (request.hasOwnProperty('activity_inline_data')) {
                    var inlineJson = JSON.parse(request.activity_inline_data);
                    assetId = inlineJson.employee_asset_id;
                } else {
                    assetId = request.asset_id;
                }
            } else {
                assetId = request.asset_id;
            }
        } else {
            assetId = request.asset_id;
        }


        if (participantData.length > 0) {
            organizationId = participantData.organization_id;
            accountId = participantData.account_id;
            workforceId = participantData.workforce_id;
            assetId = participantData.asset_id;
            messageUniqueId = participantData.message_unique_id
        }

        switch (streamTypeId) {
            case 4:         // activity updated
                entityTypeId = 0;
                entityText1 = "activity updated";
                entityText2 = request.activity_inline_data;
                break;
            case 207:   // Contact card has been clipped to a Document
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 309:   // activity cover altered
                entityTypeId = 0;
                entityText1 = ""
                entityText2 = request.activity_cover_collection;
                break;
            case 310:   // text message     --> File
            case 607:   // text message     --> Customer Request
            case 1307:   // text message    --> Visitor Request
            case 1507:   // text message    --> Time Card
                entityTypeId = 0;
                entityText1 = ""
                entityText2 = request.activity_timeline_text;
                break;
            case 311:   // image    --> file           
            case 608:   // image    --> Customer Request          
            case 1308:   // image    --> Visitor Request
            case 1508:   // image   --> Time Card       
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = '';
                break;
            case 313:   // form                
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                entityText2 = request.activity_timeline_collection;
                break;
            case 705:   // form                
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                entityText2 = request.activity_timeline_collection;
                formTransactionId = request.form_transaction_id;
                formId = request.form_id;
                dataTypeId = 37;    //static for all form submissions
                break;
            case 314:   // cloud based document -- file
            case 610:   // cloud based document -- Customer Request
            case 709:   // cloud based document -- Form
            case 1310:   // cloud based document -- Visitor Request
            case 1408:   // cloud based document -- Project
            case 1510:   // cloud based document -- Time Card
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = '';
                break;
            case 315:   // clip mail to task
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 316:   // clip notepad
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            default:
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = "";
                break;
        }
        ;

        var paramsArr = new Array(
                request.activity_id,
                assetId,
                workforceId,
                accountId,
                organizationId,
                streamTypeId,
                entityTypeId, // entity type id
                entityText1, // entity text 1
                entityText2, // entity text 2
                request.track_latitude,
                request.track_longitude,
                formTransactionId, //form_transaction_id   
                formId, //form_id
                dataTypeId, //data_type_id  should be 37 static
                request.track_latitude, //location latitude
                request.track_longitude, //location longitude
                request.track_gps_accuracy,
                request.track_gps_status,
                request.track_gps_location,
                request.track_gps_datetime,
                "",
                "",
                request.device_os_id,
                "",
                "",
                request.app_version,
                request.service_version,
                request.asset_id,
                messageUniqueId,
                retryFlag,
                request.flag_offline,
                request.track_gps_datetime,
                request.datetime_log
                );
        var queryString = util.getQueryString("ds_v1_activity_timeline_transaction_insert_form", paramsArr);
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

    this.assetListUpdateImagePath = function (request, callback) {
        var inlineJson = JSON.parse(request.activity_inline_data);
        var paramsArr = new Array(
                inlineJson.employee_asset_id,
                inlineJson.employee_organization_id,
                inlineJson.employee_profile_picture,
                request.asset_id,
                request.datetime_log // server log date time
                );

        var queryString = util.getQueryString('ds_v1_asset_list_update_image', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    paramsArr = new Array(
                            inlineJson.employee_asset_id,
                            inlineJson.employee_organization_id,
                            206,
                            request.datetime_log // server log date time
                            );

                    queryString = util.getQueryString('ds_v1_asset_list_history_insert', paramsArr);
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

                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    this.resetAssetUnreadCount = function (request, callback) {
        var paramsArr = new Array(
                request.activity_id,
                request.asset_id,
                request.organization_id,
                request.datetime_log // server log date time
                );

        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_seen_unread_count', paramsArr);
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

    this.updateAssetLastSeenDatetime = function (request, callback) {
        var paramsArr = new Array(
                request.activity_id,
                request.asset_id,
                request.organization_id,
                request.datetime_log // server log date time
                );

        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_seen_datetime', paramsArr);
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

    this.updateWholeLotForTimelineComment = function (request, callback) {

        var paramsArr = new Array();
        var queryString = '';
        this.getAllParticipantsExceptAsset(request, Number(request.asset_id), function (err, participantsData) {
            if (err === false) {
                participantsData.forEach(function (assetInfo, index) {
                    paramsArr = new Array(
                            request.activity_id,
                            request.asset_id,
                            request.organization_id,
                            request.datetime_log // server log date time
                            );
                    queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_field_updates_count', paramsArr);
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
                }, this);
            }
        });
    };

    this.getActivityDetails = function (request, activityId, callback) {
        var paramsArr = new Array();
        if (Number(activityId > 0)) {
            paramsArr = new Array(
                    activityId,
                    request.organization_id
                    );
        } else {
            paramsArr = new Array(
                    request.activity_id,
                    request.organization_id
                    );
        }
        var queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
        if (queryString != '') {
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

    this.handlePush = function (request, assetId, callback) {
        if (assetId === 0)
            assetId
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

    };

}
;


module.exports = ActivityCommonService;
