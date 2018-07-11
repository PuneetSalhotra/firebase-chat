/*
 * author: Sri Sai Venkatesh
 */

function ActivityCommonService(db, util, forEachAsync) {

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
                    //console.log(err);
                    global.logger.write('serverError', '', err, request)
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
        if ((request.activity_status_type_id == 74 && request.activity_type_category_id == 28) ||
                (request.activity_status_type_id == 37 && request.activity_type_category_id == 14) ||
                (request.activity_status_type_id == 41 && request.activity_type_category_id == 15)) {
            queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_updated_dt_unrd_reset', paramsArr);
        } else {
            // ds_v1_activity_asset_mapping_update_last_updated_datetime ---> updates activity_datetime_last_updated, asset_datetime_last_differential, asset_unread_updates_count
            queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_updated_datetime', paramsArr);
        }
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(true, false);
                    //console.log(err);
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
                        //console.log(err);
                        global.logger.write('serverError', '', err, request)
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
        //console.log('vnk streamTypeId : ', streamTypeId);
        var assetId = request.asset_id;
        var organizationId = request.organization_id;
        var accountId = request.account_id;
        var workforceId = request.workforce_id;
        var messageUniqueId = request.message_unique_id;
        var entityTypeId = 0;
        var entityText1 = "";
        var entityText2 = "";
        var entityText3 = "";
        var activityTimelineCollection = "{}"; //BETA
        var retryFlag = 0;
        var formTransactionId = 0;
        var dataTypeId = 0;
        var formId = 0;
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;

        entityText3 = (request.hasOwnProperty('activity_timeline_title')) ? request.activity_timeline_title : "";

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
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                break;
            case 311:   // image    --> file
            case 608:   // image    --> Customer Request
            case 1308:   // image    --> Visitor Request
            case 1508:   // image   --> Time Card
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
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
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
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
            case 320:   // Add video call communication
            case 321:   // Add phone call communication
            case 322:   // Add mobile call communication
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 323:   // Add message communication
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                break;
            case 325:   // Add Participant Collection for taskList BETA
                activityTimelineCollection = request.activity_timeline_collection;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
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
                entityText3, //Beta
                activityTimelineCollection, //BETA
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
        var queryString = util.getQueryString("ds_v1_2_asset_timeline_transaction_insert", paramsArr);
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

    this.activityTimelineTransactionInsert = function (request, participantData, streamTypeId, callback) {
        //console.log('vnk streamTypeId : ', streamTypeId);
        var assetId = request.asset_id;
        var organizationId = request.organization_id;
        var accountId = request.account_id;
        var workforceId = request.workforce_id;
        var messageUniqueId = request.message_unique_id;
        var entityTypeId = 0;
        var entityText1 = "";
        var entityText2 = "";
        var entityText3 = ""; //Beta
        var activityTimelineCollection = "{}"; //BETA
        var retryFlag = 0;
        var formTransactionId = 0;
        var dataTypeId = 0;
        var formId = 0;
        var newUserAssetId = (request.hasOwnProperty('signedup_asset_id')) ? request.signedup_asset_id : "";
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;

        entityText3 = (request.hasOwnProperty('activity_timeline_title')) ? request.activity_timeline_title : "";

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
            messageUniqueId = participantData.message_unique_id;
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
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
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
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
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
            case 320:   // Add video call communication
            case 321:   // Add phone call communication
            case 322:   // Add mobile call communication
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 323:   // Add message communication
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                break;
            case 325:   // Add Participant Collection for taskList
                activityTimelineCollection = request.activity_timeline_collection;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
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
                entityText3, //Beta
                activityTimelineCollection, //BETA
                newUserAssetId, //New User Signed Up Asset ID
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
        //Beta
        var queryString = util.getQueryString("ds_v1_2_activity_timeline_transaction_insert", paramsArr);
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

    this.resetAssetUnreadCount = function (request, activityId, callback) {
        if (activityId === 0) {
            activityId = request.activity_id;
        }

        var paramsArr = new Array(
                activityId,
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
    
    this.responseRateUnreadCount = function (request, activityId, callback) {
        if (activityId === 0) {
            activityId = request.activity_id;
        }
        
        var duration = util.differenceDatetimes(request.timeline_transaction_datetime, request.datetime_log);
        console.log('Duration in Seconds : ', duration);

        var paramsArr = new Array(
                activityId,
                request.asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.timeline_transaction_id,
                request.asset_id,
                request.datetime_log, // server log date time
                duration
                );

        var queryString = util.getQueryString('ds_p1_asset_update_transaction_insert', paramsArr);
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
        var paramsArr;
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

    this.updateAssetLocation = function (request, callback) {
        //if (request.track_latitude !== '0.0000' || request.track_latitude !== '0.0') {
            var paramsArr = new Array(
                    request.organization_id,
                    request.asset_id,
                    request.track_latitude,
                    request.track_longitude,
                    request.track_gps_accuracy,
                    request.track_gps_status,
                    request.track_gps_location,
                    request.track_gps_datetime,
                    request.asset_id,
                    request.datetime_log
                    );            
            var queryString = util.getQueryString('ds_v1_asset_list_update_location_v2', paramsArr);
            //var queryString = util.getQueryString('ds_v1_asset_list_update_location', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        callback(false, data);
                    } else {
                        // some thing is wrong and have to be dealt
                        callback(err, false);
                    }
                });
            }
        //}

    };

    this.formatFormDataCollection = function (data, callback) {
        var responseData = new Array();
        forEachAsync(data, function (next, rowData) {
            var rowDataArr = {};
            rowDataArr.activity_id = util.replaceDefaultNumber(rowData['activity_id']);
            rowDataArr.activity_title = util.replaceDefaultString(rowData['activity_title']);
            rowDataArr.asset_id = util.replaceDefaultNumber(rowData['asset_id']);
            rowDataArr.asset_first_name = util.replaceDefaultString(rowData['asset_first_name']);
            rowDataArr.asset_last_name = util.replaceDefaultString(rowData['asset_last_name']);
            rowDataArr.workforce_id = util.replaceDefaultNumber(rowData['workforce_id']);
            rowDataArr.workforce_name = util.replaceDefaultString(rowData['workforce_name']);
            rowDataArr.account_id = util.replaceDefaultNumber(rowData['account_id']);
            rowDataArr.account_name = util.replaceDefaultString(rowData['account_name']);
            rowDataArr.organization_id = util.replaceDefaultNumber(rowData['organization_id']);
            rowDataArr.organization_name = util.replaceDefaultString(rowData['organization_name']);
            rowDataArr.form_transaction_id = util.replaceDefaultNumber(rowData['form_transaction_id']);
            rowDataArr.form_transaction_datetime = util.replaceDefaultDatetime(rowData['form_transaction_id']);
            rowDataArr.form_id = util.replaceDefaultNumber(rowData['form_id']);
            rowDataArr.form_name = util.replaceDefaultString(rowData['form_name']);
            rowDataArr.field_id = util.replaceDefaultNumber(rowData['field_id']);
            rowDataArr.field_name = util.replaceDefaultString(rowData['field_name']);
            rowDataArr.field_sequence_id = util.replaceDefaultNumber(rowData['field_sequence_id']);
            rowDataArr.field_mandatory_enabled = util.replaceDefaultNumber(rowData['field_mandatory_enabled']);
            rowDataArr.field_preview_enabled = util.replaceZero(rowData['field_preview_enabled']);
            rowDataArr.data_type_combo_id = util.replaceZero(rowData['data_type_combo_id']);
            rowDataArr.data_type_combo_value = util.replaceZero(rowData['data_type_combo_value']);
            rowDataArr.data_type_id = util.replaceDefaultString(rowData['data_type_id']);
            rowDataArr.data_type_name = util.replaceDefaultString(rowData['data_type_name']);
            rowDataArr.data_type_category_id = util.replaceDefaultNumber(rowData['data_type_category_id']);
            rowDataArr.data_type_category_name = util.replaceDefaultString(rowData['data_type_category_name']);
            rowDataArr.message_unique_id = rowData['log_message_unique_id'];
            rowDataArr.datetime_log = util.replaceDefaultDatetime(rowData['log_datetime']);
            //rowDataArr.field_value = '';
            getFieldValue(rowData, function (err, fieldValue) {
                if (err) {
                    //console.log(err);
                    //console.log('error occured');
                    global.logger.write('serverError', 'error occurred', err, rowData)
                }
                rowDataArr.field_value = fieldValue;
                responseData.push(rowDataArr);
                next();
            });
        }).then(function () {
            callback(false, responseData);
        });
    };

    var getFieldValue = function (rowData, callback) {
        var fieldValue;
        var dataTypeId = Number(rowData['data_type_id']);
        switch (dataTypeId) {
            case 1:     //Date
            case 2:     //Future Date
            case 3:     //Past Date
                fieldValue = util.replaceDefaultDate(rowData['data_entity_date_1']);
                break;
            case 4:     //Date and Time
                fieldValue = util.replaceDefaultDatetime(rowData['data_entity_datetime_1']);
                break;
            case 5:     //Number
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_bigint_1']);
                break;
            case 6:     //Decimal
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_double_1']);
                break;
            case 7:     //Scale (0 to 100)
            case 8:     //Scale (0 to 5)
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_tinyint_1']);
                break;
            case 9:     //Reference - Organization
            case 10:    //Reference - Building
            case 11:    //Reference - Floor
            case 12:    //Reference - Person
            case 13:    //Reference - Vehicle
            case 14:    //Reference - Room
            case 15:    //Reference - Desk
            case 16:    //Reference - Assistant
                fieldValue = util.replaceZero(rowData['data_entity_bigint_1']);
                break;
            case 17:    //Location
                fieldValue = rowData['data_entity_decimal_2'] + '|' + rowData['data_entity_decimal_3'];
                break;
            case 18:    //Money with currency name
                fieldValue = rowData['data_entity_decimal_1'] + '|' + rowData['data_entity_text_1'];
                break;
            case 19:    //short text
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 20:    //long text
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_2']);
                break;
            case 21:    //Label
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 22:    //Email ID
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 23:    //Phone Number with Country Code
                fieldValue = rowData['data_entity_bigint_1'] + '|' + rowData['data_entity_text_1'];
                break;
            case 24:    //Gallery Image
            case 25:    //Camera Image
            case 26:    //Video Attachment
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 27:    //General Signature with asset reference
            case 28:    //General Picnature with asset reference
            case 29:    //Coworker Signature with asset reference
            case 30:    //Coworker Picnature with asset reference
                fieldValue = rowData['data_entity_text_1'] + '|' + rowData['data_entity_bigint_1'] + '|' + rowData['data_entity_tinyint_1'];
                break;
            case 31:    //Cloud Document Link
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 32:    //PDF Document
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 33:    //Single Selection List
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 34:    //multiple Selection List
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 35:    //QR Code
            case 36:    //QR Code
            case 38:    //Audio Attachment
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 39:
                break;
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_tinyint_1']);
            default:
                //console.log('came into default for data type id: ' + dataTypeId);
                global.logger.write('debug', 'asset parity is set successfully', {}, rowData)
                fieldValue = ''
                break;
        }
        ;
        //console.log(fieldValue, 'datatype of fieldvalue is '+ typeof fieldValue);

        callback(false, fieldValue);
    };

    //PAM
    /*this.activityAccountListDiff = function(request, callback) {
     var paramsArr = new Array(
     request.organization_id,
     request.account_id,
     request.asset_id,
     request.datetime_differential,
     request.page_start,
     util.replaceQueryLimit(request.page_limit)
     );
     
     var queryString = util.getQueryString('ds_v1_activity_list_select_account_differential', paramsArr);
     if (queryString != '') {
     db.executeQuery(1, queryString, request, function (err, data) {
     if (err === false) {
     console.log('DATA : ' + data);
     callback(false, data, 200);
     } else {
     callback(true, err, -9998);
     }
     });
     }
     }; */

    this.getAssetDetails = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.asset_id
                );
        var queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data[0].asset_session_status_id);
                    //callback(false, data[0].asset_session_status_id, 200);
                    callback(false, data[0], 200);
                } else {
                    callback(true, false, 200);
                }
            });
        }

    };

    //PAM
    this.inventoryCheck = function (request, activityId, callback) {
        var paramsArr = new Array();
        var responseArray = new Array();
        var queryString = '';
        paramsArr = new Array(
                request.organization_id,
                request.account_id,
                activityId,
                request.asset_type_category_id || 41,
                request.page_start || 0,
                util.replaceQueryLimit(request.page_limit)
                );
        queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants_category', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    console.log('DAta in inventory check : ', data);
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
                                //console.log('Ingredients : ')
                                //console.log(ingredients);
                                //console.log('=============================')
                                var stationIdArrays = new Array();
                                var tempArray = new Array();
                                forEachAsync(ingredients, function (next, x) {
                                    getArrayOfStationIds(request, x).then((data) => {
                                        data = util.getUniqueValuesOfArray(data);
                                        stationIdArrays.push(data);
                                        tempArray = tempArray.concat(data);
                                        next();
                                    });

                                }).then(() => {
                                    console.log('stationIdArrays: ', stationIdArrays);
                                    console.log('TempArray: ', tempArray);
                                    tempArray.forEach(function (item, index) {
                                        //console.log('util.getFrequency(item'+item+',tempArray) : ' , util.getFrequency(item, tempArray))
                                        //console.log('stationIdArrays.length : ', stationIdArrays.length)
                                        if (util.getFrequency(item, tempArray) == stationIdArrays.length) {
                                            responseArray.push(item);
                                        }
                                    });

                                    (responseArray.length > 0) ? callback(false, true, responseArray) : callback(false, false, responseArray);
                                });

                            }
                        });

                    } else {
                        callback(false, true, responseArray)
                    }
                } else {
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };


    function getArrayOfStationIds(request, ingredients) {
        return new Promise((resolve, reject) => {
            var qty = request.hasOwnProperty('item_quantity') ? request.item_quantity : 1;
            qty *= ingredients.activity_sub_type_id;
            var stationAssetId = request.hasOwnProperty('station_asset_id') ? request.station_asset_id : 0;
            var response = new Array();
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    stationAssetId,
                    ingredients.ingredient_asset_id, //request.ingredient_asset_id,
                    ingredients.channel_activity_type_category_id,
                    qty,
                    request.page_start || 0,
                    util.replaceQueryLimit(request.page_limit)
                    );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_inventory_check', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        //console.log('DATA : ', data);
                        if (data.length > 0) {
                            forEachAsync(data, function (next, x) {
                                response.push(x.activity_owner_asset_id);
                                next();
                            }).then(() => {
                                resolve(response);
                            })
                        } else {
                            resolve([]);
                        }
                    } else {
                        reject(err);
                    }
                });
            }

        })
    }

    //PAM
    this.pamAssetListUpdateOperatingAsset = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    request.workstation_asset_id,
                    request.workforce_id,
                    request.account_id,
                    request.organization_id,
                    0, //request.asset_id,
                    request.asset_id,
                    request.datetime_log
                    );

            var queryString = util.getQueryString('ds_v1_asset_list_update_operating_asset', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(true) : reject(err);
                });
            }
        })
    };

    //PAM
    this.checkingUniqueCode = function (request, code, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                code,
                request.activity_parent_id
                );

        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_existing_reserv_code', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log('data.length :' + data.length);                
                console.log('data : ', data);
                if (data.length > 0) {
                    callback(true, data);
                } else {
                    callback(false, code);
                }
            });
        }
    };

    //PAM
    var checkingSixDgtUniqueCode = function (request, code, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                code
                );

        var queryString = util.getQueryString('ds_v1_asset_list_passcode_check', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                console.log('data : ', data);
                if (data.length > 0) {
                    callback(true, data);
                } else {
                    callback(false, code);
                }
            });
        }
    };

    this.assetAccessCounts = function (request, callback) {
        var paramsArr = new Array(
                request.viewee_asset_id,
                request.viewee_operating_asset_id,
                request.viewee_workforce_id,
                request.account_id,
                request.organization_id,
                util.getStartDayOfWeek(),
                util.getStartDayOfMonth(),
                request.flag
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_analytic_counts', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                console.log('DAta : ', data);
                if (err === false) {
                    if (data.length > 0) {
                        callback(false, data);
                    } else {
                        callback(false, '');
                    }
                } else {
                    callback(true, err);
                }
            });
        }
    }

    //Get total count of desks occupied
    this.getOccupiedDeskCounts = function (request, callback) {
        var paramsArr = new Array(
                request.viewee_workforce_id,
                request.account_id,
                request.organization_id
                );
        var queryString = util.getQueryString('ds_v1_asset_list_select_occupied_desks_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                console.log('getOccupiedDeskCounts : ', data);
                (err === false) ? callback(false, data) : callback(true, err);
            });
        }
    };

    this.generateUniqueCode = function (request, callback) {
        function generateCode() {
            var phoneCode = util.randomInt(111111, 999999).toString();
            checkingSixDgtUniqueCode(request, phoneCode, (err, data) => {
                (err === false) ? callback(false, data) : generateCode();
            });
        }
        generateCode();
    };

    this.getInmailCounts = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.activity_type_category_id,
                request.asset_id,
                util.getStartDateTimeOfMonth(),
                util.getEndDateTimeOfMonth()
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_inmail_counts', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data) : callback(true, err);
            });
        }
    };

    this.updateLeadAssignedDatetime = function (request, assetId, callback) {
        var paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                request.assetId,
                request.datetime_log
                );
        var queryString = util.getQueryString('ds_p1_activity_list_update_datetime_lead_assigned', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    // proceed with activity asset mapping
                    queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_datetime_lead_assigned', paramsArr);
                    db.executeQuery(0, queryString, request, function (err, data) {
                        if (err === false) {
                            callback(false, true);
                        } else {
                            callback(err, false);
                        }
                    });
                } else {
                    callback(err, false);
                }
            });
        }
    };

    this.updateOwnerStatus = function (request, flag, callback) {
        var paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                flag,
                request.asset_id,
                request.datetime_log
                );
        var queryString = util.getQueryString('ds_p1_activity_list_update_flag_creator_status', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    // proceed with activity asset mapping
                    queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_flag_creator_status', paramsArr);
                    db.executeQuery(0, queryString, request, function (err, data) {
                        if (err === false) {
                            callback(false, true);
                        } else {
                            callback(err, false);
                        }
                    });
                } else {
                    callback(err, false);
                }
            });
        }
    };


    this.isParticipantAlreadyAssigned = function (assetCollection, activityId, request, callback) {
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
                    callback(err, false, false);
                    //console.log(err);
                    global.logger.write('serverError', '' + err, request)
                    return;
                }
            });
        }
    };

    this.weeklySummaryInsert = function (request, collection) {
        
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    collection.summary_id,
                    collection.asset_id,
                    request.workforce_id,
                    request.account_id,
                    request.organization_id,
                    util.getStartDayOfWeek(), //entity_date_1, //WEEK
                    util.getStartDayOfWeek(),
                    collection.entity_tinyint_1 || 0,
                    collection.entity_bigint_1 || 0,
                    collection.entity_double_1 || 0,
                    collection.entity_decimal_1 || 0,
                    collection.entity_decimal_2 || 0,
                    collection.entity_decimal_3 || 0,
                    collection.entity_text_1 || '', //request.asset_frist_name
                    collection.entity_text_2 || '', //request.asset_last_name
                    request.track_latitude,
                    request.track_longitude,
                    request.track_gps_accuracy,
                    request.track_gps_enabled,
                    request.track_gps_location,
                    request.track_gps_datetime || request.datetime_log,
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
                    request.track_gps_datetime || request.datetime_log,
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

    this.monthlySummaryInsert = function (request, collection) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    collection.summary_id, //request.monthly_summary_id,
                    collection.asset_id,
                    request.workforce_id,
                    request.account_id,
                    request.organization_id,
                    util.getStartDayOfMonth(), //entity_date_1,    //Monthly Month start Date
                    util.getStartDayOfMonth(),
                    collection.entity_tinyint_1 || 0,
                    collection.entity_bigint_1 || 0,
                    collection.entity_double_1 || 0,
                    collection.entity_decimal_1 || 0,
                    collection.entity_decimal_2 || 0,
                    collection.entity_decimal_3 || 0,
                    collection.entity_text_1 || '', //request.asset_frist_name
                    collection.entity_text_2 || '', //request.asset_last_name
                    request.track_latitude,
                    request.track_longitude,
                    request.track_gps_accuracy,
                    request.track_gps_status,
                    request.track_gps_location,
                    request.track_gps_datetime || request.datetime_log,
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
                    request.track_gps_datetime || request.datetime_log,
                    request.datetime_log
                    );
            var queryString = util.getQueryString('ds_v1_asset_monthly_summary_transaction_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve(data)
                    } else {
                        reject(err);
                    }
                });
            }


        });
    }
    ;
    
    this.sendSmsCodeParticipant = function(request, callback){
            var reservationCode;
            var expiryDatetime;
            var tableNames = "";
            var noOfGuests = 0;
            var cnt = 0;
            
            var memberName;
            var countryCode;
            var phoneNumber;                      
       
            var participantData = JSON.parse(request.activity_participant_collection);
                    forEachAsync(participantData, function (next, row) {
                        cnt++;                                              
                        if(row.asset_category_id == 30){
                            pamGetActivityDetails(request).then((resp)=>{                               
                                reservationCode = resp[0].activity_sub_type_name;
                                expiryDatetime = util.replaceDefaultDatetime(resp[0].activity_datetime_end_estimated);
                                
                                request.work_station_asset_id = row.asset_id;
                                pamGetAssetDetails(request).then((data)=>{                                        
                                    phoneNumber = util.replaceDefaultNumber(data[0].asset_phone_number);
                                    countryCode = util.replaceDefaultNumber(data[0].asset_phone_country_code);
                                    memberName = util.replaceDefaultString(data[0].asset_first_name);
                                    next();
                                });                            
                            });                           
                                                     
                        } else if(row.asset_category_id == 31){
                                request.work_station_asset_id = row.asset_id;
                                    pamGetAssetDetails(request).then((data)=>{
                                        tableNames += data[0].asset_first_name + "-";
                                        
                                        console.log('data[0].asset_inline_data : ' , data[0].asset_inline_data);
                                        var inlineJson = JSON.parse(data[0].asset_inline_data);
                                        noOfGuests += util.replaceDefaultNumber(inlineJson.element_cover_capacity);
                                        next();
                                    });
                                                              
                        } else {
                            next();
                        }                       
                        
                    }).then(() => {
                         noOfGuests--;
                         var text;
                         console.log('memberName : ', memberName);
                         console.log('countryCode: ', countryCode);
                         console.log('phoneNumber : ', phoneNumber);
                         
                         var expiryDateTime = util.addUnitsToDateTime(util.replaceDefaultDatetime(request.event_start_datetime),5.5,'hours');
                         expiryDateTime = util.getDatewithndrdth(expiryDateTime);
                         
                         if(request.hasOwnProperty('reserv_at_item_order')) {
                            text = "Dear "+memberName+","+" Your code was used to make an order a few minutes ago.";
                             text += " If you are not at Pudding & Mink right now, please whatsapp / call us at 916309386175 immediately. Pudding & Mink";
                         } else {
                            text = "Dear "+memberName+","+" I have reserved table number "+tableNames+" for your group tonight, your reservation code is "+reservationCode+".";
                             text += " Feel free to forward this message to your other "+noOfGuests+" guests, they can use the same code to enter.";
                             text += " Remember the entry is only from the parking garage @ Radisson Blu Banjara Hills. Looking forward to hosting your group on ";
                             text += expiryDateTime + ".";
                             //text += " PS - I will be forced to release the table block if no one shows up before "+expiryDatetime+"."+" -PAM";
                             text += " Pudding & Mink";                             
                         }
                         console.log('SMS text : \n', text);
                         util.pamSendSmsMvaayoo(text, countryCode, phoneNumber, function(err,res){
                                if(err === false) {
                                    console.log('Message sent!',res);
                                 }
                         });
                         util.pamSendSmsMvaayoo(text, 91, 6309386175, function(err,res){
                                if(err === false) {
                                    console.log('Message sent to Admin!', res);
                                }                                     
                             });
                         return callback(false, 200);
                         });                             
                
   };
   
   function pamGetAssetDetails(request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                351, //request.organization_id,
                request.work_station_asset_id
                );
            var queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {                    
                    (err === false)? resolve(data) : reject(err);
                });
            }
        });
    };
    
    function pamGetActivityDetails(request){
        return new Promise((resolve, reject)=>{
            var paramsArr;
            paramsArr = new Array(
                        request.activity_id,
                        request.organization_id
                        );

            var queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false)? resolve(data) : reject(err);
                });
            }
        });        
    };
    
    this.updateParticipantCount = function (activityId, organizationId, request, callback) {
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
                    global.logger.write('debug','participant count retrieved from query is: ' + participantCount, request)
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
                                getAllParticipantsforTasks(request).then((participantsData)=>{                                   
                                    if (participantsData.length > 0) {
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
                                                    (err === false) ? callback(true, false) : callback(true, false);                                                    
                                                });
                                            }
                                        });
                                        
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
                                global.logger.write('serverError','' + err, request)
                                return;
                            }
                        });
                    }
                } else {
                    callback(err, false);
                    //console.log(err);
                    global.logger.write('serverError','' + err, request)
                    return;
                }
            });
        }
    };

    this.updateLeadStatus = function (request, flag, callback) {
        var paramsArr = new Array(
                request.activity_id,
                request.asset_id,
                request.organization_id,
                flag,
                request.asset_id,
                request.datetime_log
                );
        var queryString = util.getQueryString('ds_p1_activity_list_update_flag_lead_status', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    // proceed with activity asset mapping
                    queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_flag_lead_status', paramsArr);
                    db.executeQuery(0, queryString, request, function (err, data) {
                        if (err === false) {
                            callback(false, true);
                        } else {
                            callback(err, false);
                        }
                    });
                } else {
                    callback(err, false);
                }
            });
        }
    };

    function getAllParticipantsforTasks(request){
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                0,
                50
                );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });        
    };
    
    this.getAssetAverageRating = function(request, collection) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    collection.asset_id,
                    collection.operating_asset_id,
                    collection.flag_filter,
                    collection.datetime_start,
                    collection.datetime_end
                    );
            var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_rating_average', paramsArr);
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
    };
    
    this.getAssetActiveAccount = function(request) {
        return new Promise((resolve, reject)=>{
            var refinedParticipantList = new Array();
            
            //console.log('beforerefinedParticipantList : ', request);
            console.log('beforerefinedParticipantList length: ', request.length);            
            
            forEachAsync(request, function (next, rowData) {
                var paramsArr = new Array(
                    rowData.operating_asset_phone_number,
                    rowData.operating_asset_phone_country_code                    
                    );
                var queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_last_linked', paramsArr);
                if (queryString != '') {
                    db.executeQuery(1, queryString, request, function (err, data) {
                        if (err === false) {
                            if(data.length > 0){
                                console.log("Asset - " + data[0].asset_id + " - " + data[0].operating_asset_first_name +" - Active Organization is : " + data[0].organization_id);
                                console.log("Asset - " + data[0].asset_id + " - " + data[0].operating_asset_first_name +" - Organization in participant List: " , rowData['organization_id']);
                                
                                if(data[0].organization_id == rowData['organization_id']) {
                                    refinedParticipantList.push(rowData);
                                } 
                                next();                                
                            } else {                                
                                refinedParticipantList.push(rowData);
                                next();
                            }
                        } else {
                            reject(err);
                        }
                    });
                }
            }).then(()=>{
                console.log('refinedParticipantList : ', refinedParticipantList.length);
                resolve(refinedParticipantList);
            });
        });
        
    };

}
;


module.exports = ActivityCommonService;
