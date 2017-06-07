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

        var activityId = request.activity_id;
        var organizationId = request.organization_id;
        var accountId = request.account_id;
        var workforceId = request.workforce_id;
        var assetId = request.asset_id;
        var messageUniqueId = request.message_unique_id;
        var entityTypeId = 0;
        var entityText1 = "";
        var entityText2 = "";

        var retryFlag = 0;
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;


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
                entityText2 = request.activity_cover_data;
                break;
            case 310:   // text message
                entityTypeId = 0;
                entityText1 = ""
                entityText2 = request.activity_timeline_text;
                break;
            case 311:   // image
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
                break;
            case 314:   // cloud based document
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
        var queryString = util.getQueryString("ds_v1_asset_timeline_transaction_insert", paramsArr);
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

        var organizationId = request.organization_id;
        var accountId = request.account_id;
        var workforceId = request.workforce_id;
        var assetId = request.asset_id;
        var messageUniqueId = request.message_unique_id;
        var entityTypeId = 0;
        var entityText1 = "";
        var entityText2 = "";
        var retryFlag = 0;
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;

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
                entityText2 = request.activity_cover_data;
                break;
            case 310:   // text message
                entityTypeId = 0;
                entityText1 = ""
                entityText2 = request.activity_timeline_text;
                break;
            case 311:   // image                
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
                break;
            case 314:   // cloud based document
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
        var queryString = util.getQueryString("ds_v1_activity_timeline_transaction_insert", paramsArr);
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


module.exports = ActivityCommonService;
