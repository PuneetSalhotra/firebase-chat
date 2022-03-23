
function ActivityCommonService(db, util, forEachAsync) {
    let makingRequest = require('request');
    const self = this;
    const nodeUtil = require('util');
    let elasticsearch = require('elasticsearch');
    const logger = require("../logger/winstonLogger");
    const { serializeError } = require("serialize-error");
    let client = new elasticsearch.Client({
        hosts: [global.config.elastiSearchNode]
    });

    this.getAllParticipants = function (request, callback) {
        let paramsArr = new Array(
            request.activity_id,
            request.organization_id,
            0,
            50
        );
        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants', paramsArr);
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

    // Promisified version of the above method
    this.getAllParticipantsPromise = function (request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                0,
                50
            );
            const queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    // Async version of the above method
this.getAllParticipantsAsync = async (request) => {
    let responseData = [],
        error = true;
    
    const paramsArr = new Array(
        request.activity_id,
        request.organization_id,
        0,
        50
    );
    const queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants', paramsArr);
    if (queryString !== '') {
        await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    //error = true;
                    console.log("Error in function 'getAllParticipantsAsync' : ", err);
                });
    }
    return [error, responseData];
};

    this.getAllParticipantsExceptAsset = function (request, assetId, callback) {
        let paramsArr = new Array(
            request.activity_id,
            assetId,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            0,
            50
        );
        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_other_participants', paramsArr);

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

    let updateActivityLogDiffDatetimeAsset = function (request, assetId, callback) {
        let paramsArr = new Array(
            request.activity_id,
            assetId,
            request.organization_id,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
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

    this.increaseUnreadForGivenAsset = (request, assetID) => {
        return new Promise((resolve, reject)=>{
            let assetCollection = {
                asset_id: assetID,
                workforce_id: request.workforce_id,
                account_id: request.account_id,
                organization_id: request.organization_id
            };
            updateActivityLogLastUpdatedDatetimeAsset(request, assetCollection, ()=>{
                resolve();
            });
        });
    };

    let updateActivityLogLastUpdatedDatetimeAsset = function (request, assetCollection, callback) {

        let paramsArr = new Array(
            request.activity_id,
            assetCollection.asset_id,
            assetCollection.organization_id,
            request.datetime_log
        );

        let queryString = '';
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
                if (err === false) {
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
                let assetCollection = {
                    asset_id: assetInfo['asset_id'],
                    workforce_id: assetInfo['project_id'],
                    account_id: assetInfo['account_id'],
                    organization_id: assetInfo['organization_id']
                };
                updateActivityLogLastUpdatedDatetimeAsset(request, assetCollection, function (err, data) {
                    if (err !== false) {
                        //console.log(err);
                        //global.logger.write('conLog', err, err, {});
                        util.logError(request,`updateActivityLogLastUpdatedDatetimeAsset Error %j`, { err , request});
                    }
                });
            }, this);
        }
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

    this.updateActivityLogLastUpdatedDatetimeV1 = async function (request, assetId, callback) {

        let [err,assetData]= await this.getAssetDetailsAsync({...request,asset_id:assetId});
            let assetInfo = assetData[0];
                let assetCollection = {
                    asset_id: assetInfo['asset_id'],
                    workforce_id: assetInfo['project_id'],
                    account_id: assetInfo['account_id'],
                    organization_id: assetInfo['organization_id']
                };
                updateActivityLogLastUpdatedDatetimeAsset(request, assetCollection, function (err, data) {
                    if (err !== false) {
                        //console.log(err);
                        //global.logger.write('conLog', err, err, {});
                        util.logError(request,`updateActivityLogLastUpdatedDatetimeAsset Error %j`, { err , request});
                    }
                });
            
        
        // if (assetId > 0) {
        //     this.getAllParticipantsExceptAsset(request, assetId, function (err, data) {
        //         if (err === false) {
        //             updateAssetsLogDatetime(data);
        //         }
        //     }.bind(this));
        // } else {
        //     this.getAllParticipants(request, function (err, data) {
        //         if (err === false) {
        //             updateAssetsLogDatetime(data);
        //         }
        //     }.bind(this));
        // }
    };


    this.activityListHistoryInsert = function (request, updateTypeId, callback) {

        let paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            updateTypeId,
            request.datetime_log // server log date time
        );

        let queryString = util.getQueryString('ds_v1_activity_list_history_insert', paramsArr);
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
        let paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            assetId,
            updateTypeId,
            request.datetime_log // server log date time
        );

        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_history_insert', paramsArr);
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

        let assetId = request.asset_id;
        let organizationId = request.organization_id;
        let accountId = request.account_id;
        let workforceId = request.workforce_id;
        let messageUniqueId = request.message_unique_id;
        let entityTypeId = 0;
        let entityText1 = "";
        let entityText2 = "";
        let entityText3 = "";
        let activityTimelineCollection = "{}"; //BETA
        let retryFlag = 0;
        let formTransactionId = 0;
        let dataTypeId = 0;
        let formId = 0;
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;

        entityText3 = (request.hasOwnProperty('activity_timeline_title')) ? request.activity_timeline_title : "";

        if (request.hasOwnProperty('activity_type_category_id')) {
            let activityTypeCategoryId = Number(request.activity_type_category_id);
            if (activityTypeCategoryId === 4) {
                if (request.hasOwnProperty('activity_inline_data')) {
                    let inlineJson = JSON.parse(request.activity_inline_data);
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


        if (Object.keys(participantData).length > 0) {
            organizationId = participantData.organization_id;
            accountId = participantData.account_id;
            workforceId = participantData.workforce_id;
            assetId = participantData.asset_id;
            messageUniqueId = participantData.message_unique_id;
        }

        switch (streamTypeId) {
            case 4: // activity updated
                entityTypeId = 0;
                entityText1 = "activity updated";
                entityText2 = request.activity_inline_data;
                break;
            case 207: // Contact card has been clipped to a Document
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 309: // activity cover altered
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_cover_collection;
                break;
            case 310: // text message     --> File
            case 607: // text message     --> Customer Request
            case 1307: // text message    --> Visitor Request
            case 1507: // text message    --> Time Card
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                break;
            case 311: // image    --> file
            case 608: // image    --> Customer Request
            case 1308: // image    --> Visitor Request
            case 1508: // image   --> Time Card
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 313: // form
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                entityText2 = request.activity_timeline_collection;
                break;
            case 704: // form: status alter
            case 711: //alered the due date
            case 734: //alered the due date
                entityTypeId = 0;
                entityText1 = request.from_date;
                entityText2 = request.to_date;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 717: // Workflow: Percentage alter
                entityTypeId = 0;
                entityText2 = request.activity_timeline_collection;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 705: // form
            case 728: // Report form BC
            case 729: // Report form BC Edit
            case 713:
            case 714:
            case 715:
            case 716:
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                // entityText2 = request.activity_timeline_collection;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                formTransactionId = request.form_transaction_id;
                formId = request.form_id;
                dataTypeId = 37; //static for all form submissions
                break;
            case 718:
            case 719:
            case 720:
            case 721:
            case 722:
                activityTimelineCollection = request.activity_lead_timeline_collection || '{}';
                break;
            case 710: // form field alter
                entityTypeId = 0;
                //entityText2 = request.activity_timeline_collection;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 314: // cloud based document -- file
            case 610: // cloud based document -- Customer Request
            case 709: // cloud based document -- Form
            case 1310: // cloud based document -- Visitor Request
            case 1408: // cloud based document -- Project
            case 1510: // cloud based document -- Time Card
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 315: // clip mail to task
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 316: // clip notepad
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 320: // Add video call communication
            case 321: // Add phone call communication
            case 322: // Add mobile call communication
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 323: // Add message communication
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                break;
            case 325: // Add Participant Collection for taskList BETA
            case 723:
            case 724:
            case 114: // IIT JAMMU ID CARD
            case 115: // IIT JAMMU ID CARD
            case 116: // IIT JAMMU ID CARD
            case 26004: // [Widget] Comment Added on Widget
                activityTimelineCollection = request.activity_timeline_collection;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                request.entity_tinyint_2 = request.attachment_type_id || 0;
                break;
            default:
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = "";
                break;
        }

        let paramsArr = new Array(
            request.activity_id || 0,
            assetId,
            workforceId,
            accountId,
            organizationId,
            streamTypeId,
            entityTypeId, // entity type id
            request.entity_datetime_1 || '1970-01-01 00:00:00', // entity type id
            request.entity_datetime_2 || '1970-01-01 00:00:00', // entity type id
            entityText1, // entity text 1
            entityText2, // entity text 2
            entityText3, //Beta
            activityTimelineCollection, //BETA
            request.track_latitude,
            request.track_longitude,
            request.entity_tinyint_1 || 0,
            request.entity_tinyint_2 || 0,
            request.entity_bigint_1 || 0,
            request.entity_bigint_2 || 0,
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
            request.log_asset_id || request.asset_id,
            messageUniqueId,
            retryFlag,
            request.flag_offline || 0,
            request.track_gps_datetime || new Date(),
            request.datetime_log,
            request.data_activity_id || 0
        );
        let queryString = util.getQueryString("ds_v1_3_asset_timeline_transaction_insert", paramsArr);
        if(assetId === 0 || assetId === null) {
            console.log(`ds_v1_3_asset_timeline_transaction_insert is not called as assetId is ${assetId}`);
            callback(false, true)
        }
        else {
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        callback(false, true);
                        return;
                    } else {
                        callback(err, false);
                        //global.logger.write('conLog', JSON.stringify(err), err, request);
                        util.logError(request,`assetTimelineTransactionInsert Error %j`, { error : JSON.stringify(err), err , request});
                        return;
                    }
                });
            }
        }
    };

    this.activityTimelineTransactionInsert = function (request, participantData, streamTypeId, callback) {

        //global.logger.write('conLog', 'Request Params in activityCommonService timeline : ',request,{});
        util.logInfo(request,`activityTimelineTransactionInsert Request Params in activityCommonService timeline %j`,{request});
        let assetId = request.asset_id;
        let organizationId = request.organization_id;
        let accountId = request.account_id;
        let workforceId = request.workforce_id;
        let messageUniqueId = request.message_unique_id;
        let entityTypeId = 0;
        let entityText1 = "";
        let entityText2 = "";
        let entityText3 = ""; //Beta
        let activityTimelineCollection = "{}"; //BETA
        let retryFlag = 0;
        let formTransactionId = 0;
        let dataTypeId = 0;
        let formId = 0;
        let newUserAssetId = (request.hasOwnProperty('signedup_asset_id')) ? request.signedup_asset_id : 0;
        
        // const supressTimelineEntries = [50079,50068, 4609, 50294, 50295, 50264,50403, 50787];
        const supressTimelineEntries = [50079,50068, 4609, 50294, 50295, 50264,50787,50824, 51087, 51086, 50403];
        
        if(supressTimelineEntries.includes(Number(request.form_id)) && Number(streamTypeId)==713){
            //console.log("IN addTimelineTransactionAsync Suprress:: ");
            streamTypeId = 728;
            //request.activity_stream_type_id = 728;
        }
        
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;

        entityText3 = (request.hasOwnProperty('activity_timeline_title')) ? request.activity_timeline_title : "";

        if (request.hasOwnProperty('activity_type_category_id')) {
            let activityTypeCategoryId = Number(request.activity_type_category_id);
            if (activityTypeCategoryId === 4) {
                if (request.hasOwnProperty('activity_inline_data')) {
                    let inlineJson = JSON.parse(request.activity_inline_data);
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


        if (Object.keys(participantData).length > 0) {
            organizationId = participantData.organization_id;
            accountId = participantData.account_id;
            workforceId = participantData.workforce_id;
            assetId = participantData.asset_id;
            messageUniqueId = participantData.message_unique_id;
        }

        //global.logger.write('conLog', 'activityTimelineTransactionInsert - streamTypeId: ' + streamTypeId, {}, request);
        util.logInfo(request,`conLog activityTimelineTransactionInsert -: %j`,{streamTypeId : streamTypeId, request});
        //global.logger.write('conLog', 'activityTimelineTransactionInsert - typeof streamTypeId: ' + typeof streamTypeId, {}, request);
        util.logInfo(request,`conLog activityTimelineTransactionInsert - %j`,{typeof_streamTypeId : typeof streamTypeId, request});
        //global.logger.write('conLog', 'activityTimelineTransactionInsert - lead_reject_reason: ' + request.lead_reject_reason, {}, request);
        util.logInfo(request,`conLog activityTimelineTransactionInsert %j`,{lead_reject_reason : request.lead_reject_reason, request});

        switch (streamTypeId) {
            case 4: // activity updated
                entityTypeId = 0;
                entityText1 = "activity updated";
                entityText2 = request.activity_inline_data;
                break;
            case 207: // Contact card has been clipped to a Document
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 309: // activity cover altered
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_cover_collection;
                break;
            case 310: // text message     --> File
            case 607: // text message     --> Customer Request
            case 1307: // text message    --> Visitor Request
            case 1507: // text message    --> Time Card
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = JSON.stringify(request.activity_timeline_text);
                break;
            case 311: // image    --> file
            case 608: // image    --> Customer Request
            case 1308: // image    --> Visitor Request
            case 1508: // image   --> Time Card
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 313: // form
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                entityText2 = request.activity_timeline_collection;
                break;
            case 702: // form | workflow: Add Participant
            case 26002: // widget: Add Participant
            case 26005: // widget: Remove Participant
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                entityText1 = "";
                entityText2 = "";
                break;
            case 704: // form: status alter
            case 711: //alered the due date
            case 734: //alered the due date
                entityTypeId = 0;
                entityText1 = request.from_date;
                entityText2 = request.to_date;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 717: // Workflow: Percentage alter
                entityTypeId = 0;
                entityText2 = request.activity_timeline_collection;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 705: // form
            case 728: // Report form BC
            case 729: // Report form BC Edit
            case 713: // form field alter
            case 714: //Bot Firing External API
            case 715:
            case 716:
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                entityText2 = '';
                activityTimelineCollection = request.activity_timeline_collection;
                formTransactionId = request.form_transaction_id;
                formId = request.form_id;
                request.entity_bigint_1 = request.reference_form_activity_id || 0;
                dataTypeId = 37; //static for all form submissions
                break;
            case 718: //
            case 719: //
                /*entityTypeId = 0;
                activityTimelineCollection = request.activity_lead_timeline_collection || '{}';
                entityText2 = request.lead_reject_reason?request.lead_reject_reason:""; 
                break;*/
            case 720:
            case 721:
            case 722: 
                activityTimelineCollection = request.activity_lead_timeline_collection || '{}';                                    
                entityText2 = request.lead_reject_reason?request.lead_reject_reason:"";
                console.log("request.lead_reject_reason :: "+request.lead_reject_reason);
                console.log("entityText2 :: "+entityText2)
                break;                
            case 710: // form field alter
                entityTypeId = 0;
                //entityText2 = request.activity_timeline_collection;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 314: // cloud based document -- file
            case 610: // cloud based document -- Customer Request
            case 709: // cloud based document -- Form
            case 1310: // cloud based document -- Visitor Request
            case 1408: // cloud based document -- Project
            case 1510: // cloud based document -- Time Card
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 315: // clip mail to task
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 316: // clip notepad
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 320: // Add video call communication
            case 321: // Add phone call communication
            case 322: // Add mobile call communication
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 323: // Add message communication
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                break;
            case 325: // [Files | Workflow] Add Comment/Attachment
            case 114: // IIT JAMMU ID CARD
            case 115: // IIT JAMMU ID CARD
            case 116: // IIT JAMMU ID CARD
            case 26001: //Widget Created
            case 26004: // [Widget] Comment Added on Widget
            case 2505: // [Contact] Add Comment 
            case 2605: // [Product] Add Comment
            case 723:
            case 509: 
                activityTimelineCollection = request.activity_timeline_collection;
            case 724:
                let attachmentNames = '',
                    isAttachment = 0;
                try {
                    const attachments = JSON.parse(request.activity_timeline_collection).attachments;
                    if (Number(attachments.length) > 0) {
                        let fileNames = [];
                        for (const attachmentURL of attachments) {
                            let fileName = String(attachmentURL).substring(String(attachmentURL).lastIndexOf('/')+1);
                            fileNames.push(fileName);
                        }
                        attachmentNames = fileNames.join('|');
                        isAttachment = 1;
                    }
                } catch (error) {
                    console.log("activityTimelineTransactionInsert | 325 | Parsing and retrieving attachments | Error: ", error);
                }
                activityTimelineCollection = request.activity_timeline_collection;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                entityText3 = attachmentNames;
                request.entity_tinyint_1 = isAttachment;
                request.entity_tinyint_2 = request.attachment_type_id || 0;
                break;
            case 23002: // Telephone Module: Altered the status of the chat
            case 23003: // Telephone Module: Added an update to the chat
            case 23004: // Telephone Module: Voice call started
            case 23005: // Telephone Module: Voice call answered
            case 23006: // Telephone Module: Voice call ended
            case 23007: // Telephone Module: Voice call Missed
            case 23008: // Telephone Module: Video call started
            case 23009: // Telephone Module: Video call answered
            case 23010: // Telephone Module: Video call ended
            case 23011: // Telephone Module: Video call Missed
                activityTimelineCollection = request.activity_timeline_collection;
                entityText1 = "";
                entityText2 = JSON.stringify(request.activity_timeline_text);
                break; 
            case 326:
            case 327:
                activityTimelineCollection = request.activity_timeline_collection;
                entityText1 = "";
                entityText2 = "";                
                break;
            case 2401: //Bot added lead
            case 2402: //Admin marked lead
            case 2403: //Admin replaced lead     
                entityText2 = request.activity_timeline_text;  
                break;  
            default:
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = "";
                break;
        }

        //global.logger.write('debug', 'activityTimelineCollection : ', {}, request);
        //global.logger.write('debug', activityTimelineCollection, {}, request);        

        // [QUICK FIX] 16th August 2019, Friday 08:51 PM - Ben
        // 1506 is a Time Card stream type, however, un-diagnosed bug was causing this
        // stream type to be added whenever a workflows due date (/r0/activity/cover/alter) 
        // was being changed from web. This was also setting all the participants to have 
        // to same last seen timestamp
        if (
            Number(streamTypeId) === 1506 &&
            request.hasOwnProperty('activity_type_category_id') &&
            Number(request.activity_type_category_id) !== 34
        ) {
            callback(false, false);
            return;
        }

        console.log("Entity text 2 "+entityText2);

        let paramsArr = new Array(
            request.activity_id,
            assetId,
            workforceId,
            accountId,
            organizationId,
            streamTypeId,
            entityTypeId, // entity type id
            request.entity_datetime_1 || '1970-01-01 00:00:00', // entity type id
            request.entity_datetime_2 || '1970-01-01 00:00:00', // entity type id
            entityText1, // entity text 1
            entityText2, // entity text 2
            entityText3, //Beta
            activityTimelineCollection, //BETA
            newUserAssetId, //New User Signed Up Asset ID
            request.track_longitude,
            request.entity_tinyint_1 || 0,
            request.entity_tinyint_2 || 0,
            request.entity_bigint_1 || 0,
            request.entity_bigint_2 || 0, //Added on 10-12-2018
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
            request.log_asset_id || request.asset_id,
            messageUniqueId || 0,
            retryFlag,
            request.flag_offline || 0,
            request.track_gps_datetime,
            request.datetime_log,
            request.data_activity_id || 0, //Added on 10-12-2018
            request.trigger_bot_id || 0,
            request.trigger_bot_operation_id || 0,
            request.trigger_form_id || 0,
            request.trigger_form_transaction_id || 0
        );
        //let queryString = util.getQueryString("ds_v1_5_activity_timeline_transaction_insert", paramsArr);
        //let queryString = util.getQueryString("ds_v1_6_activity_timeline_transaction_insert", paramsArr);
        let queryString = util.getQueryString("ds_v1_7_activity_timeline_transaction_insert", paramsArr);
        if(assetId === 0 || assetId === null){
            //global.logger.write('conLog', `ds_v1_7_activity_timeline_transaction_insert is not called as asset_id is ${assetId}`);
            util.logInfo(request,`activityTimelineTransactionInsert conLog ds_v1_7_activity_timeline_transaction_insert is not called as %j`,{asset_id : assetId, request});
            callback(false, true);
        }
        else {
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {

                        if(data.length > 0)
                        util.logInfo(request, "2.Timeline Transaction Id : "+data[0].id);

                        callback(false, true);
                        return;
                    } else {
                        callback(err, false);
                        //global.logger.write('conLog', JSON.stringify(err), err, request);
                        util.logError(request,`activityTimelineTransactionInsert Error %j`, { error : JSON.stringify(err), err,request });
                        return;
                    }
                });
            }
        }
    };

    // Promise/Async version of this.activityTimelineTransactionInsert method
    this.asyncActivityTimelineTransactionInsert = function (request, participantData, streamTypeId) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.activityTimelineTransactionInsert(request, participantData, streamTypeId, (err, data) => {
                (!err) ? resolve(data): reject(err);
            });
        });
    };

    this.resetAssetUnreadCount = function (request, activityId, callback) {
        if (activityId === 0) {
            activityId = request.activity_id;
        }

        let paramsArr = new Array(
            activityId,
            request.asset_id,
            request.organization_id,
            request.datetime_log // server log date time
        );

        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_seen_unread_count', paramsArr);
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

        let duration = util.differenceDatetimes(request.datetime_log, request.timeline_transaction_datetime);
        //console.log('Duration in Seconds : ', duration);
        //global.logger.write('conLog', 'Duration in Seconds : ' + duration, {}, request);
        util.logInfo(request,`responseRateUnreadCount Duration in Seconds %j`,{duration : duration,request});

        let paramsArr = new Array(
            activityId,
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.timeline_transaction_id,
            request.asset_id,
            request.datetime_log, // server log date time
            duration,
            request.config_resp_hours
        );

        let queryString = util.getQueryString('ds_p1_asset_update_transaction_insert', paramsArr);
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
        let paramsArr = new Array(
            request.activity_id,
            request.asset_id,
            request.organization_id,
            request.datetime_log // server log date time
        );

        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_seen_datetime', paramsArr);
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

        let paramsArr = new Array();
        let queryString = '';
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
        let paramsArr;
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
        let queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
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
    // Promisified version of the getActivityDetails()
    this.getActivityDetailsPromise = function (request, activityId) {

        return new Promise((resolve, reject) => {
            let paramsArr;
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
            const queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    // Promisified version of the getActivityDetails()
    this.getActivityDetailsPromiseMaster = function (request, activityId) {

        return new Promise((resolve, reject) => {
            let paramsArr;
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
            const queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    this.activityAssetMappingSelectActivityParticipantWithStatus = function (request, activityId) {
        // IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20)
        let status_form_enabled = 0;
        return new Promise((resolve, reject) => {
            let paramsArr;
            
                paramsArr = new Array(
                    request.organization_id,
                    request.activity_id,
                    request.form_id
                );
            
            const queryString = util.getQueryString('ds_v1_workflow_form_status_mapping_select_form', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, async function (err, data) {
                    if(err){
                        reject(err)
                    }
                    console.log(data)
                  if(data.length>0&&data[0].activity_status_id >0){
                    try{
                     let leadResponse = await activityAssetMappingSelectActivityParticipantV1(request,activityId);
                     if(leadResponse.length>0){
                     leadResponse[0].status_form_enabled=1;
                     }
                     resolve(leadResponse)
                    }
                    catch(err1){
                      reject(err1)
                    }
                  }
                  else{
                      resolve([{status_form_enabled:0}])
                  }
                  
                  
                });
            }
        });
    };

    function activityAssetMappingSelectActivityParticipantV1  (request) {
        // IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20)

        return new Promise((resolve, reject) => {
            let paramsArr;
           
                paramsArr = new Array(
                    request.activity_id,
                    request.asset_id,
                    request.organization_id
                );
            
            const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_role', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    }

    this.activityAssetMappingSelectActivityParticipant = function (request, activityId) {
        // IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20)

        return new Promise((resolve, reject) => {
            let paramsArr;
            if (Number(activityId > 0)) {
                paramsArr = new Array(
                    activityId,
                    request.asset_id,
                    request.organization_id
                );
            } else {
                paramsArr = new Array(
                    request.activity_id,
                    request.asset_id,
                    request.organization_id
                );
            }
            const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_activity_participant', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    this.updateAssetLocation = function (request, callback) {
        //if (request.track_latitude !== '0.0000' || request.track_latitude !== '0.0') {
        let paramsArr = new Array(
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
        let queryString = util.getQueryString('ds_v1_asset_list_update_location_v2', paramsArr);
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

    this.updateAssetLocationPromise = function (request) {
        return new Promise((resolve, reject) => {
            self.updateAssetLocation(request, (err, response) => {
                if (err) {
                    return reject(err);
                }
                return resolve(response);
            });
        });
    };

    this.formatFormDataCollection = function (data, callback) {
        let responseData = new Array();
        forEachAsync(data, function (next, rowData) {
            let rowDataArr = {};
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
                    //global.logger.write('conLog', 'error occurred', err, rowData);
                    util.logError(rowData,`formatFormDataCollection getFieldValue serverError error occurred Error %j`, { error : err,rowData});
                }
                rowDataArr.field_value = fieldValue;
                responseData.push(rowDataArr);
                next();
            });
        }).then(function () {
            callback(false, responseData);
        });
    };

    let getFieldValue = function (rowData, callback) {
        let fieldValue;
        let dataTypeId = Number(rowData['data_type_id']);
        switch (dataTypeId) {
            case 1: //Date
            case 2: //Future Date
            case 3: //Past Date
                fieldValue = util.replaceDefaultDate(rowData['data_entity_date_1']);
                break;
            case 4: //Date and Time
                fieldValue = util.replaceDefaultDatetime(rowData['data_entity_datetime_1']);
                break;
            case 5: //Number
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_bigint_1']);
                break;
            case 6: //Decimal
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_double_1']);
                break;
            case 7: //Scale (0 to 100)
            case 8: //Scale (0 to 5)
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_tinyint_1']);
                break;
            case 9: //Reference - Organization
            case 10: //Reference - Building
            case 11: //Reference - Floor
            case 12: //Reference - Person
            case 13: //Reference - Vehicle
            case 14: //Reference - Room
            case 15: //Reference - Desk
            case 16: //Reference - Assistant
                fieldValue = util.replaceZero(rowData['data_entity_bigint_1']);
                break;
            case 17: //Location
                fieldValue = rowData['data_entity_decimal_2'] + '|' + rowData['data_entity_decimal_3'];
                break;
            case 18: //Money with currency name
                fieldValue = rowData['data_entity_decimal_1'] + '|' + rowData['data_entity_text_1'];
                break;
            case 19: //short text
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 20: //long text
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_2']);
                break;
            case 21: //Label
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 22: //Email ID
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 23: //Phone Number with Country Code
                fieldValue = rowData['data_entity_bigint_1'] + '|' + rowData['data_entity_text_1'];
                break;
            case 24: //Gallery Image
            case 25: //Camera Image
            case 26: //Video Attachment
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 27: //General Signature with asset reference
            case 28: //General Picnature with asset reference
            case 29: //Coworker Signature with asset reference
            case 30: //Coworker Picnature with asset reference
                fieldValue = rowData['data_entity_text_1'] + '|' + rowData['data_entity_bigint_1'] + '|' + rowData['data_entity_tinyint_1'];
                break;
            case 31: //Cloud Document Link
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 32: //PDF Document
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 33: //Single Selection List
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 34: //multiple Selection List
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 35: //QR Code
            case 36: //QR Code
            case 38: //Audio Attachment
                fieldValue = util.replaceDefaultString(rowData['data_entity_text_1']);
                break;
            case 39:
                break;
                fieldValue = util.replaceDefaultNumber(rowData['data_entity_tinyint_1']);
            default:
                //console.log('came into default for data type id: ' + dataTypeId);
                //global.logger.write('conLog', 'asset parity is set successfully', {}, {});
                util.logInfo(rowData,`getFieldValue conLog asset parity is set successfully`,{});
                fieldValue = '';
                break;
        };
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
        let paramsArr = new Array(
            request.organization_id,
            request.asset_id
        );
        let queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
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

    this.getAssetDetailsAsync = async function (request) {
        let assetData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.asset_id
        );
        const queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
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

    //PAM
    this.inventoryCheck = function (request, activityId, callback) {
        let paramsArr = new Array();
        let responseArray = new Array();
        let queryString = '';
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
                    //console.log('DAta in inventory check : ', data);
                    //global.logger.write('conLog', 'Data in inventory check : ' + JSON.stringify(data, null, 2), {}, request);
                    util.logInfo(request,`inventoryCheck Data in inventory check : %j`,{data : JSON.stringify(data, null, 2),request});
                    if (data.length > 0) {
                        let ingredients = new Array();
                        forEachAsync(data, function (next, x) {
                            let items = {
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
                                let stationIdArrays = new Array();
                                let tempArray = new Array();
                                forEachAsync(ingredients, function (next, x) {
                                    getArrayOfStationIds(request, x).then((data) => {
                                        data = util.getUniqueValuesOfArray(data);
                                        stationIdArrays.push(data);
                                        tempArray = tempArray.concat(data);
                                        next();
                                    });

                                }).then(() => {
                                    //console.log('stationIdArrays: ', stationIdArrays);
                                    //console.log('TempArray: ', tempArray);
                                    //global.logger.write('conLog', 'stationIdArrays: ' + JSON.stringify(stationIdArrays, null, 2), {}, request);
                                    util.logInfo(request,`inventoryCheck conLog stationIdArrays : %j`,{stationIdArrays : JSON.stringify(stationIdArrays, null, 2),request});
                                    //global.logger.write('conLog', 'TempArray: ' + JSON.stringify(tempArray, null, 2), {}, request);
                                    util.logInfo(request,`inventoryCheck conLog TempArray: %j`,{TempArray : JSON.stringify(tempArray, null, 2),request});
                                    tempArray.forEach(function (item, index) {
                                        //console.log('util.getFrequency(item'+item+',tempArray) : ' , util.getFrequency(item, tempArray))
                                        //console.log('stationIdArrays.length : ', stationIdArrays.length)
                                        if (util.getFrequency(item, tempArray) == stationIdArrays.length) {
                                            responseArray.push(item);
                                        }
                                    });

                                    (responseArray.length > 0) ? callback(false, true, responseArray): callback(false, false, responseArray);
                                });

                            }
                        });

                    } else {
                        callback(false, true, responseArray);
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
            let qty = request.hasOwnProperty('item_quantity') ? request.item_quantity : 1;
            qty *= ingredients.activity_sub_type_id;
            let stationAssetId = request.hasOwnProperty('station_asset_id') ? request.station_asset_id : 0;
            let response = new Array();
            let paramsArr = new Array(
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
            let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_inventory_check', paramsArr);
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
                            });
                        } else {
                            resolve([]);
                        }
                    } else {
                        reject(err);
                    }
                });
            }

        });
    }

    //PAM
    this.pamAssetListUpdateOperatingAsset = function (request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.workstation_asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                0, //request.asset_id,
                request.asset_id,
                request.datetime_log
            );

            let queryString = util.getQueryString('ds_v1_asset_list_update_operating_asset', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(true): reject(err);
                });
            }
        });
    };

    //PAM
    this.checkingUniqueCode = function (request, code, callback) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            code,
            request.activity_parent_id
        );

        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_existing_reserv_code', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log('data.length :' + data.length);                
                //console.log('data : ', data);
                //global.logger.write('conLog', 'data : ' + JSON.stringify(data, null, 2), {}, request);
                util.logInfo(request,`checkingUniqueCode  data: %j`,{data : JSON.stringify(data, null, 2),request});
                if (data.length > 0) {
                    callback(true, data);
                } else {
                    callback(false, code);
                }
            });
        }
    };

    //PAM
    let checkingSixDgtUniqueCode = function (request, code, callback) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            code
        );

        let queryString = util.getQueryString('ds_v1_asset_list_passcode_check', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log('data : ', data);
                //global.logger.write('conLog', 'data : ' + JSON.stringify(data, null, 2), {}, request);
                util.logInfo(request,`checkingSixDgtUniqueCode data: %j`,{data : JSON.stringify(data, null, 2),request});
                if (data.length > 0) {
                    callback(true, data);
                } else {
                    callback(false, code);
                }
            });
        }
    };

    this.assetAccessCounts = function (request, callback) {
        let paramsArr = new Array(
            request.viewee_asset_id,
            request.viewee_operating_asset_id,
            request.viewee_workforce_id,
            request.account_id,
            request.organization_id,
            util.getStartDayOfWeek(),
            util.getStartDayOfMonth(),
            request.flag
        );
        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_analytic_counts', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log('DAta : ', data);
                //global.logger.write('conLog', 'data : ' + JSON.stringify(data, null, 2), {}, request);
                util.logInfo(request,`assetAccessCounts data: %j`,{data : JSON.stringify(data, null, 2),request});
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
    };

    //Get total count of desks occupied
    this.getOccupiedDeskCounts = function (request, callback) {
        let paramsArr = new Array(
            request.viewee_workforce_id,
            request.account_id,
            request.organization_id
        );
        let queryString = util.getQueryString('ds_v1_asset_list_select_occupied_desks_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log('getOccupiedDeskCounts : ', data);
                //global.logger.write('conLog', 'getOccupiedDeskCounts : ' + JSON.stringify(data, null, 2), {}, request);
                util.logInfo(request,`conLog getOccupiedDeskCounts: %j`,{getOccupiedDeskCounts : JSON.stringify(data, null, 2),request});
                (err === false) ? callback(false, data): callback(true, err);
            });
        }
    };

    this.generateUniqueCode = function (request, callback) {
        function generateCode() {
            let phoneCode = util.randomInt(111111, 999999).toString();
            checkingSixDgtUniqueCode(request, phoneCode, (err, data) => {
                (err === false) ? callback(false, data): generateCode();
            });
        }
        generateCode();
    };

    this.getInmailCounts = function (request, flag, callback) { //flag = 1 means monthly and flag = 2 means weekly
        let startDate;
        let endDate;

        if (flag === 1) {
            startDate = util.getStartDateTimeOfMonth();
            endDate = util.getEndDateTimeOfMonth();
        } else {
            startDate = util.getStartDateTimeOfWeek();
            endDate = util.getEndDateTimeOfWeek();
        }

        let paramsArr = new Array(
            request.organization_id,
            request.activity_type_category_id,
            request.asset_id,
            startDate,
            endDate
        );
        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_inmail_counts', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data): callback(true, err);
            });
        }
    };

    this.getPostItCounts = function (request, flag, callback) {
        // flag: 1 => monthly
        // flag: 2 => weekly
        let startDate;
        let endDate;

        if (flag === 1) {
            startDate = util.getStartDateTimeOfMonth();
            endDate = util.getEndDateTimeOfMonth();
        } else {
            startDate = util.getStartDateTimeOfWeek();
            endDate = util.getEndDateTimeOfWeek();
        }

        // IN p_organization_id BIGINT(20), IN p_activity_type_category_id SMALLINT(6), 
        // IN p_asset_id BIGINT(20), IN p_datetime_start DATETIME, IN p_datetime_end DATETIME
        let paramsArr = new Array(
            request.organization_id,
            request.activity_type_category_id,
            request.asset_id,
            startDate,
            endDate
        );
        let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_postit_counts', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data): callback(true, err);
            });
        }
    };

    this.updateLeadAssignedDatetime = function (request, assetId, callback) {
        let paramsArr = new Array(
            request.activity_id,
            request.organization_id,
            request.assetId,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_p1_activity_list_update_datetime_lead_assigned', paramsArr);
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
        let paramsArr = new Array(
            request.activity_id,
            request.organization_id,
            flag,
            request.asset_id,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_p1_activity_list_update_flag_creator_status', paramsArr);
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
        let fieldId = 0;
        if (assetCollection.hasOwnProperty('field_id')) {
            fieldId = assetCollection.field_id;
        }
        let paramsArr = new Array(
            activityId,
            assetCollection.asset_id,
            assetCollection.organization_id,
            fieldId
        );
        let queryString = util.getQueryString("ds_v1_activity_asset_mapping_select_check_participant_appr", paramsArr);

        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    //var queryStatus = (data.length > 0) ? (data[0]['log_state']< 3)?true:false : false;
                    let queryStatus = false;
                    let newRecordFalg = false;
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
                    //global.logger.write('conLog', err, {}, request);
                    util.logError(request,`isParticipantAlreadyAssigned Error %j`, { err,request});
                    return;
                }
            });
        }
    };

    this.weeklySummaryInsert = function (request, collection) {

        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                collection.summary_id,
                collection.asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                collection.startDateTimeOfWeek || util.getStartDayOfWeek(), //entity_date_1, //WEEK
                collection.endDateTimeOfWeek || util.getStartDayOfWeek(),
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
                request.flag_retry || 0,
                request.flag_offline || 0,
                request.track_gps_datetime || request.datetime_log,
                request.datetime_log
            );
            let queryString = util.getQueryString('ds_v1_asset_weekly_summary_transaction_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };

    this.monthlySummaryInsert = function (request, collection) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                collection.summary_id, //request.monthly_summary_id,
                collection.asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                collection.startDateTimeOfMonth || util.getStartDayOfMonth(), //entity_date_1,    //Monthly Month start Date
                collection.endDateTimeOfMonth || util.getStartDayOfMonth(),
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
                request.flag_retry || 0,
                request.flag_offline || 0,
                request.track_gps_datetime || request.datetime_log,
                request.datetime_log
            );
            let queryString = util.getQueryString('ds_v1_asset_monthly_summary_transaction_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }


        });
    };

    this.sendSmsCodeParticipant = function (request, callback) {
        let reservationCode;
        let expiryDatetime;
        let tableNames = "";
        let noOfGuests = 0;
        let cnt = 0;

        let memberName;
        let countryCode;
        let phoneNumber;

        let participantData = JSON.parse(request.activity_participant_collection);
        forEachAsync(participantData, function (next, row) {
            cnt++;
            if (row.asset_category_id == 30) {
                pamGetActivityDetails(request).then((resp) => {
                    reservationCode = resp[0].activity_sub_type_name;
                    expiryDatetime = util.replaceDefaultDatetime(resp[0].activity_datetime_end_estimated);

                    request.work_station_asset_id = row.asset_id;
                    pamGetAssetDetails(request).then((data) => {
                        phoneNumber = util.replaceDefaultNumber(data[0].asset_phone_number);
                        countryCode = util.replaceDefaultNumber(data[0].asset_phone_country_code);
                        memberName = util.replaceDefaultString(data[0].asset_first_name);
                        next();
                    });
                });

            } else if (row.asset_category_id == 31) {
                request.work_station_asset_id = row.asset_id;
                pamGetAssetDetails(request).then((data) => {
                    tableNames += data[0].asset_first_name + "-";

                    //console.log('data[0].asset_inline_data : ' , data[0].asset_inline_data);
                    //global.logger.write('debug', 'data[0].asset_inline_data : ' + data[0].asset_inline_data, {}, {});
                    util.logInfo(request,`pamGetAssetDetails debug data[0].asset_inline_data %j`,{data_asset_inline_data : data[0].asset_inline_data,request});
                    let inlineJson = JSON.parse(data[0].asset_inline_data);
                    noOfGuests += util.replaceDefaultNumber(inlineJson.element_cover_capacity);
                    next();
                });

            } else {
                next();
            }

        }).then(() => {
            noOfGuests--;
            let text;
            //console.log('memberName : ', memberName);
            //console.log('countryCode: ', countryCode);
            //console.log('phoneNumber : ', phoneNumber);
            //console.log('tableNames : ', tableNames);
            //global.logger.write('conLog', 'memberName : ' + memberName, {}, request);
            util.logInfo(request,`pamGetAssetDetails conLog %j`,{memberName : memberName,request});
            //global.logger.write('conLog', 'countryCode: ' + countryCode, {}, request);
            util.logInfo(request,`pamGetAssetDetails conLog %j`,{countryCode : countryCode,request});
            //global.logger.write('conLog', 'phoneNumber : ' + phoneNumber, {}, request);
            util.logInfo(request,`pamGetAssetDetails conLog %j`,{phoneNumber : phoneNumber,request});
            //global.logger.write('conLog', 'tableNames : ' + tableNames, {}, request);
            util.logInfo(request,`pamGetAssetDetails conLog %j`,{tableNames : tableNames,request});

            let expiryDateTime = util.addUnitsToDateTime(util.replaceDefaultDatetime(request.event_start_datetime), 5.5, 'hours');
            //expiryDateTime = util.getDatewithndrdth(expiryDateTime);
            expiryDateTime = util.getFormatedSlashDate(expiryDateTime);

            if (request.hasOwnProperty('reserv_at_item_order')) {
                text = "Dear " + memberName + "," + " Your code was used to make an order a few minutes ago.";
                text += " If you are not at Pudding & Mink right now, please whatsapp / call us at 916309386175 immediately. Pudding & Mink";
            } else {
                /*
                            text = "Dear "+memberName+","+" I have reserved table number "+tableNames+" for your group tonight, your reservation code is "+reservationCode+".";
                             text += " Feel free to forward this message to your other "+noOfGuests+" guests, they can use the same code to enter.";
                             text += " Remember the entry is only from the parking garage @ Radisson Blu Banjara Hills. Looking forward to hosting your group on ";
                             text += expiryDateTime + ".";
                             //text += " PS - I will be forced to release the table block if no one shows up before "+expiryDatetime+"."+" -PAM";
                             text += " Pudding & Mink"; */

                text = "Dear " + memberName + "," + " Thank you for patronizing PUDDING & MINK! \nTable number " + tableNames + " is reserved for you/ your group on " + expiryDateTime + ".";
                text += " Your reservation code is " + reservationCode + "." + " Do feel free to forward this message to your other guests, so they may use the same code to enter. \nPlease note the entry is from the parking level @ Radisson Blu Plaza, Banjara Hills.";
                text += " Your reservation will be forfeited at 12am if no one from the group is present. \nWe look forward to hosting you/ your group. \nAssuring you of a great experience, \nPUDDING & MINK !!";

            }
            //console.log('SMS text : \n', text);
            //global.logger.write('debug', 'SMS text : \n' + text, {}, request);
            util.logInfo(request,`pamGetAssetDetails debug %j`,{SMS_text : text,request});
            phoneNumber = '9010819966';
            util.pamSendSmsMvaayoo(text, countryCode, phoneNumber, function (err, res) {
                if (err === false) {
                    //console.log('Message sent!',res);
                    //global.logger.write('debug', 'Message sent!' + JSON.stringify(res, null, 2), {}, request);
                    util.logInfo(request,`pamSendSmsMvaayoo debug Message sent! %j`,{Message_sent : JSON.stringify(res, null, 2),request});
                }
            });
            util.pamSendSmsMvaayoo(text, 91, 6309386175, function (err, res) {
                if (err === false) {
                    //console.log('Message sent to Admin!', res);
                    //global.logger.write('debug', 'Message sent to Admin!' + JSON.stringify(res, null, 2), {}, request);
                    util.logInfo(request,`pamSendSmsMvaayoo debug Message sent to Admin! %j`,{Message_sent : JSON.stringify(res, null, 2),request});
                }
            });
            return callback(false, 200);
        });

    };

    function pamGetAssetDetails(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id || 351,
                request.work_station_asset_id
            );
            let queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };

    function pamGetActivityDetails(request) {
        return new Promise((resolve, reject) => {
            let paramsArr;
            paramsArr = new Array(
                request.activity_id,
                request.organization_id
            );

            let queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };

    this.updateParticipantCount = function (activityId, organizationId, request, callback) {
        let paramsArr = new Array(
            activityId,
            organizationId
        );
        let queryString = util.getQueryString("ds_v1_activity_asset_mapping_select_participant_count", paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    let participantCount = data[0].participant_count;
                    //console.log('participant count retrieved from query is: ' + participantCount);
                    paramsArr = new Array(
                        activityId,
                        organizationId,
                        participantCount
                    );
                    queryString = util.getQueryString("ds_v1_1_activity_list_update_participant_count", paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                getAllParticipantsforTasks(request).then((participantsData) => {
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
                                                    (err === false) ? callback(true, false): callback(true, false);
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
                                util.logError(request,`participantupdateerror`, { type: 'update_participant', error: serializeError(err) });
                                return;
                            }
                        });
                    }
                } else {
                    callback(err, false);
                    //console.log(err);
                    util.logError(request,`participantupdateerror`, { type: 'update_participant', error: serializeError(err) });
                    return;
                }
            });
        }
    };

    this.updateLeadStatus = function (request, flag, callback) {
        let paramsArr = new Array(
            request.activity_id,
            request.asset_id,
            request.organization_id,
            flag,
            request.asset_id,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_p1_activity_list_update_flag_lead_status', paramsArr);
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

    function getAllParticipantsforTasks(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                0,
                50
            );
            let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };

    this.getAssetAverageRating = function (request, collection) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                collection.asset_id,
                collection.operating_asset_id,
                collection.flag_filter,
                collection.datetime_start,
                collection.datetime_end
            );
            let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_rating_average', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        (data.length > 0) ? resolve(data): resolve(err);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.getAssetActiveAccount = function (request) {
        return new Promise((resolve, reject) => {
            let refinedParticipantList = new Array();

            //console.log('beforerefinedParticipantList : ', request);
            //console.log('beforerefinedParticipantList length: ', request.length);
            //global.logger.write('debug', 'beforerefinedParticipantList length: ' + request.length, {}, request);
            util.logInfo(request,`getAssetActiveAccount debug beforerefinedParticipantList length %j`,{length : request.length,request});

            forEachAsync(request, function (next, rowData) {
                let paramsArr = new Array(
                    rowData.operating_asset_phone_number,
                    rowData.operating_asset_phone_country_code
                );
                let queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_last_linked', paramsArr);
                if (queryString != '') {
                    db.executeQuery(1, queryString, request, function (err, data) {
                        if (err === false) {
                            if (data.length > 0) {
                                //console.log("Asset - " + data[0].asset_id + " - " + data[0].operating_asset_first_name +" - Active Organization is : " + data[0].organization_id);
                                //console.log("Asset - " + data[0].asset_id + " - " + data[0].operating_asset_first_name +" - Organization in participant List: " , rowData['organization_id']);
                                //global.logger.write('debug', "Asset - " + data[0].asset_id + " - " + data[0].operating_asset_first_name + " - Active Organization is : " + data[0].organization_id, {}, {});
                                util.logInfo(request,`getAssetActiveAccount debug %j`,{Asset : data[0].asset_id, operating_asset_first_name : data[0].operating_asset_first_name, Active_Organization : data[0].organization_id, request});
                                //global.logger.write('debug', "Asset - " + rowData.asset_id + " - " + rowData.operating_asset_first_name + " - Organization in participant List: " + rowData['organization_id'], {}, {});
                                util.logInfo(request,`getAssetActiveAccount debug %j`,{Asset : rowData.asset_id, operating_asset_first_name: rowData.operating_asset_first_name, Organization_in_participant_List : rowData['organization_id'], request});

                                if (data[0].organization_id == rowData['organization_id']) {
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
            }).then(() => {
                //console.log('refinedParticipantList : ', refinedParticipantList.length);
                //global.logger.write('debug', 'refinedParticipantList : ' + refinedParticipantList.length, {}, {});
                util.logInfo(request,`getAssetActiveAccount debug %j`,{refinedParticipantList : refinedParticipantList.length,request});
                resolve(refinedParticipantList);
            });
        });

    };

    this.getAllParticipantsforField = function (request, activityId, fieldId) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                activityId,
                41,
                0,
                50,
                fieldId
            );
            let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants_option', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };

    this.assetActivityListHistoryInsertField = function (request, assetId, fieldId, updateTypeId) {
        if (assetId === 0) {
            assetId = request.asset_id;
        }
        let paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            assetId,
            fieldId,
            updateTypeId,
            request.datetime_log // server log date time
        );

        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_history_insert_field', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? resolve(data): reject(err);
            });
        }
    };


    this.orderIngredientsAssign = function (request, participantData) {

        //console.log('In function activityAssetMappingInsertParticipantAssign - participantData : ', participantData);
        return new Promise((resolve, reject) => {
            let fieldId = 0;
            let paramsArr = new Array(
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
                participantData.field_id,
                participantData.activity_sub_type_name,
                participantData.activity_sub_type_id,
                participantData.option_id,
                participantData.parent_activity_title
            );
            let queryString = util.getQueryString("ds_v1_activity_asset_mapping_insert_asset_assign_pam", paramsArr);

            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.updateProjectEndDateTime = function (request, callback) {
        getlatestDateInAProject(request).then((data) => {
            if (data.length > 0) {
                let taskProjectsEndDtTime = util.replaceDefaultDatetime(data[0].activity_datetime_end_deferred); //Task with latest end Date Time

                //Get the Activity Details 
                this.getActivityDetails(request, request.activity_parent_id, (err, activityData) => {
                    let projectEndDtTime = util.replaceDefaultDatetime(activityData[0].activity_datetime_end_deferred);

                    //console.log('projectEndDtTime : ', projectEndDtTime);
                    //console.log('taskProjectsEndDtTime : ', taskProjectsEndDtTime);
                    //console.log('Math.sign(util.differenceDatetimes(' + taskProjectsEndDtTime+ ', ' + projectEndDtTime  + '): ', Math.sign(util.differenceDatetimes(taskProjectsEndDtTime, projectEndDtTime)));
                    //global.logger.write('debug', 'projectEndDtTime : ' + projectEndDtTime, {}, {});
                    util.logInfo(request, `getlatestDateInAProject debug %j`, { projectEndDtTime: projectEndDtTime, request });
                    //global.logger.write('debug', 'taskProjectsEndDtTime : ' + taskProjectsEndDtTime, {}, {});
                    util.logInfo(request, `getlatestDateInAProject debug %j`, { taskProjectsEndDtTime: taskProjectsEndDtTime, request });
                    //global.logger.write('debug', 'Math.sign(util.differenceDatetimes(' + taskProjectsEndDtTime + ', ' + projectEndDtTime + '): ' + Math.sign(util.differenceDatetimes(taskProjectsEndDtTime, projectEndDtTime)), {}, {});
                    util.logInfo(request, `getlatestDateInAProject debug Math.sign(util.differenceDatetimes(${taskProjectsEndDtTime}, ${projectEndDtTime})): %j`, { differenceDatetimes: Math.sign(util.differenceDatetimes(taskProjectsEndDtTime, projectEndDtTime)), request });
                    if ((Math.sign(util.differenceDatetimes(taskProjectsEndDtTime, projectEndDtTime)) !== 0)) {
                        //Call alter cover for that project
                        //Add timeline Entry
                        callback(false, projectEndDtTime, taskProjectsEndDtTime);
                    } else {
                        callback(true, false, false);
                    }
                });
            } else {
                //console.log('There are no tasks in the project - project id - ', request.activity_parent_id);
                //global.logger.write('debug', 'There are no tasks in the project - project id - ' + request.activity_parent_id, {}, {});
                util.logInfo(request, `getlatestDateInAProject debug There are no tasks in the project -  %j`, { project_id: request.activity_parent_id, request });
            }
        });
    };

    function getlatestDateInAProject(request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.activity_parent_id,
                1, //request.flag
                request.entity_1,
                request.start_datetime || "",
                request.end_datetime || "",
                request.start_from || 0,
                request.limit_value || 1
            );

            let queryString = util.getQueryString('ds_p1_activity_list_select_parent_flag', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        //console.log('DATA : ', data);
                        //global.logger.write('conLog', 'DATA : ' + JSON.stringify(data, null, 2), {}, request);
                        util.logInfo(request,`getlatestDateInAProject %j`,{DATA : JSON.stringify(data, null, 2),request});
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    /*this.getActivityListDateRange = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.asset_id,
                request.datetime_start, //00:00:00
                request.datetime_end // 23:59:59
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_open_payroll_activity', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data) : callback(err, false);
            });
        }
    };*/

    //Can use this function for both inmail and postit
    this.updateInMailResponse = function (request, activityFlagResponseonTimeFlag, callback) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_id,
            request.asset_id,
            activityFlagResponseonTimeFlag,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_inmail_response', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, true): callback(err, false);
            });
        }
    };

    this.retrieveAccountList = function (request, callback) {
        let paramsArr = [];
        paramsArr.push(request.account_id);
        let queryString = util.getQueryString('ds_p1_account_list_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    (err === false) ? callback(false, data): callback(true, {});
                } else {
                    callback(true, {});
                }
            });
        }
    };

    /*this.checkingMSgUniqueId = function (request, callback) {
        var paramsArr = new Array(
            request.message_unique_id,
            request.asset_id
        );
        //var queryString = util.getQueryString('ds_v1_activity_timeline_transaction_select_msg_unq_chk', paramsArr);
        var queryString = util.getQueryString('ds_p1_asset_message_unique_id_transaction_select', paramsArr);        
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log('data : ', data);
                global.logger.write('debug', data, {}, request);
                (data.length > 0) ? callback(true, {}) : callback(false, data);
            });
        }
    };*/

    this.checkingPartitionOffset = function (request, callback) {
        let paramsArr = new Array(
            global.config.TOPIC_ID,
            request.partition,
            request.offset
        );
        let queryString = util.getQueryString('ds_p1_partititon_offset_transaction_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //global.logger.write('conLog', data, {}, {});
                util.logInfo(request,`checkingPartitionOffset data %j`,{data , request});
                (data.length > 0) ? callback(true, {}): callback(false, data);
            });
        }
    };

    this.checkingPartitionOffsetAsync = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            global.config.TOPIC_ID,
            request.partition,
            request.offset
        );
        const queryString = util.getQueryString('ds_p1_partititon_offset_transaction_select', paramsArr);

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

    this.partitionOffsetInsertAsync = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            global.config.TOPIC_ID,
            request.partition,
            request.offset,
            request.asset_id,
            request.activity_id,
            request.form_transaction_id
        );
        const queryString = util.getQueryString('ds_p1_partition_offset_transaction_insert', paramsArr);

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

    this.partitionOffsetInsert = function (request, callback) {
        let paramsArr = new Array(
            global.config.TOPIC_ID,
            request.partition,
            request.offset,
            request.asset_id,
            request.activity_id,
            request.form_transaction_id
        );
        let queryString = util.getQueryString('ds_p1_partition_offset_transaction_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                //global.logger.write('conLog', data, {}, request);
                util.logInfo(request,`partitionOffsetInsert data %j`,{data , request});
                (err == false) ? callback(false, data): callback(true, {});
            });
        }
    };

    /*this.msgUniqueIdInsert = function (request, callback) {
        var paramsArr = new Array(
            request.message_unique_id,
            request.asset_id,
            request.activity_id,
            request.form_transaction_id
        );        
        var queryString = util.getQueryString('ds_p1_asset_message_unique_id_transaction_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                global.logger.write('debug', data, {}, request);
                (err == false) ? callback(false, data): callback(true, {});
            });
        }
    };*/

    this.duplicateMsgUniqueIdInsert = function (request, callback) {
        let arr = new Array();
        arr.push(request);

        let paramsArr = new Array(
            request.message_unique_id,
            JSON.stringify(arr),
            "{}",
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('ds_p1_asset_invalid_message_transaction_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, data): callback(true, {});
            });
        }
    };

    this.duplicateMsgUniqueIdInsertAsync = async function (request, callback) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.message_unique_id,
            JSON.stringify(request),
            "{}",
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_invalid_message_transaction_insert', paramsArr);

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

    // Update the last updated and differential datetime for an asset.
    // This is currently being used by the telephone module to update the same
    // for the sender's asset_id
    this.activityAssetMappingUpdateLastUpdateDateTimeOnly = function (request, callback) {
        // IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20), 
        // IN p_organization_id BIGINT(20), IN p_last_updated_datetime DATETIME

        let paramsArr = new Array(
            request.activity_id,
            request.asset_id,
            request.organization_id,
            util.getCurrentUTCTime() // request.track_gps_datetime
        );
        let queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_last_update_dt_only', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, data): callback(true, {});
            });
        }
    };

    // Update an activity's inline data in the activity_asset_mapping and activity_list
    // table. Currently used by the telephone module to update the last message that is 
    // sent.
    this.activityAssetMappingUpdateInlineDataOnly = function (request, updatedActivityInlineData, callback) {
        // IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_activity_inline_data JSON, IN p_pipe_separated_string VARCHAR(1200), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let paramsArr = new Array(
            request.activity_id,
            request.asset_id,
            request.organization_id,
            updatedActivityInlineData,
            '', // request.pipe_separated_string
            request.asset_id,
            util.getCurrentUTCTime() // request.log_datetime
        );
        let queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_inline_data_only', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, data): callback(true, {});
            });
        }
    };

    // Update activity_master_data. This is being used for storing the pdfMake's 
    // document definition in a JSON Format for Suzuki
    this.updateActivityMasterData = function (request, activityId, activityMasterData, callback) {
        // IN p_activity_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_activity_master_data JSON
        let paramsArr = new Array(
            activityId,
            request.organization_id,
            activityMasterData
        );
        let queryString = util.getQueryString('ds_p1_activity_list_update_master_data', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, data);
                } else {
                    callback(err, false);
                }
            });
        }
    };

    // Fetch contact file's first collaborator (non-creator):
    this.fetchContactFileFirstCollaborator = function (request, activityId, callback) {
        // IN p_activity_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)

        let paramsArr = new Array(
            activityId,
            request.organization_id,
            0,
            1
        );
        let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_non_creator_participants', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data): callback(true, {});
            });
        }
    };
    // [VODAFONE] Check the rules table
    this.activityStatusValidationMappingSelectTrigger = function (request, callback) {
        // IN p_form_id BIGINT(20), IN p_activity_status_id BIGINT(20), IN p_organization_id BIGINT(20)

        let paramsArr = new Array(
            request.form_id,
            request.activity_status_id,
            request.organization_id
        );
        let queryString = util.getQueryString('ds_p1_activity_status_validation_mapping_select_trigger', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data): callback(true, {});
            });
        }
    };

    // [VODAFONE] For this activity, get the earliest most timestamp of the source status
    this.activityTimelineTxnSelectActivityStatus = function (request, activityStatusId, flag) {
        // IN p_organization_id bigint(20), IN p_activity_id bigint(20), 
        // IN p_activity_status_id BIGINT(20), IN p_flag SMALLINT(6), 
        // IN p_start_from bigint(20), IN p_limit_value TINYINT(4)

        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                activityStatusId,
                flag,
                0, // start_from
                1 // limit_value
            );
            let queryString = util.getQueryString('ds_p1_activity_timeline_transaction_select_activity_status', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };

    // [VODAFONE] Check in activity_status_change_transaction table if there is a row existing for 
    // the combination of form_id, activity_id, source status and target status. If there is no existing 
    // row, insert a new row in the table for the combination of activity_id, source status and the target 
    // status. Else update the existing row with the generated duration value
    this.activityStatusChangeTxnInsert = function (request, duration, statusCollection) {
        // IN p_organization_id BIGINT(20), IN p_activity_id BIGINT(20), IN p_from_status_id BIGINT(20), 
        // IN p_to_status_id BIGINT(20), IN p_from_status_datetime DATETIME, IN p_to_status_datetime 
        // DATETIME, IN p_duration DECIMAL(16,4), IN p_log_datetime DATETIME, IN p_log_asset_id BIGINT(20)

        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                statusCollection.from_status_id,
                statusCollection.to_status_id,
                statusCollection.from_status_datetime,
                statusCollection.to_status_datetime,
                duration,
                util.getCurrentUTCTime(),
                request.asset_id
            );
            let queryString = util.getQueryString('ds_p1_activity_status_change_transaction_insert', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };

    // [VODAFONE] 
    this.activityStatusChangeTxnSelectAverage = function (request, flag, statusCollection) {
        // IN p_from_activity_status_id BIGINT(20), IN to_activity_status_id BIGINT(20), 
        // IN p_form_id BIGINT(20),IN p_organization_id BIGINT(20), IN p_flag SMALLINT(4), 
        // IN p_datetime_start DATETIME, IN p_datetime_end DATETIME

        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                statusCollection.from_status_id,
                statusCollection.to_status_id,
                request.form_id,
                request.organization_id,
                flag,
                statusCollection.datetime_start,
                statusCollection.datetime_end
            );
            let queryString = util.getQueryString('ds_p1_activity_status_change_transaction_select_average', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };
    /*
    this.processReservationBilling = function (request, idReservation){
    	return new Promise((resolve, reject)=>{
    		if(request.hasOwnProperty('is_room_posting'))
    			this.pamEventBillingUpdate(request, idReservation);
    		resolve();
    	});
    };    

    function pamEventBillingUpdate(request, idReservation) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,                
                idReservation,
                request.datetime_log
                );
            var queryString = util.getQueryString("pm_v1_pam_event_billing_update", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {                  
                   if(err === false){                	   
                	   resolve();
                   }else{
                	   reject(err);
                   }
                });
            }
        })
    };*/

    // Fetching the Asset Type ID for a given organisation/workforce and asset type category ID
    this.workforceAssetTypeMappingSelectCategory = function (request, assetTypeCategoryId, callback) {
        // IN p_organization_id bigint(20), IN p_account_id bigint(20), IN p_workforce_id bigint(20), 
        // IN p_asset_type_category_id SMALLINT(6), IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            assetTypeCategoryId,
            0,
            1
        );
        let queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_select_category', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data, 200): callback(err, data, -9998);
            });
        }
    };

    // Fetching the Asset Type ID for a given organisation/workforce and asset type category ID
    this.workforceAssetTypeMappingSelectCategoryPromise = function (request, assetTypeCategoryId) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                assetTypeCategoryId,
                0,
                1
            );
            let queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_select_category', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };

    this.getWorkflowForAGivenUrl = function (request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.worflow_trigger_url
            );
            let queryString = util.getQueryString('ds_p1_workflow_mapping_select_url', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };

    this.makeRequest = function (request, url, port) {
        return new Promise((resolve, reject) => {
            let options = {
                form: request
            };

            if (port == 0) {

            } else {
                //global.logger.write('debug', "Request Params b4 making Request : ", {}, request);
                //global.logger.write('debug', request, {}, {});
                //global.logger.write('debug', "http://localhost:" + global.config.servicePort + "/" + global.config.version + "/" + url, {}, {});
                util.logInfo(request,`makeRequest %j`,{url : "http://localhost:" + global.config.servicePort + "/" + global.config.version + "/" + url, request});
                makingRequest.post("http://localhost:" + global.config.servicePort + "/" + global.config.version + "/" + url, options, function (error, response, body) {
                    resolve(body);
                });
            }

        });
    };

    this.getActivityTimelineTransactionByFormId = function (request, activityId, formId) {
        return new Promise((resolve, reject) => {
            // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_activity_id BIGINT(20), 
            // IN p_form_id BIGINT(20), IN p_start_from SMALLINT(6), IN p_limit_value smallint(6)
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                activityId,
                formId,
                request.offset || 0,
                request.limit || 50
            );
            const queryString = util.getQueryString('ds_p1_activity_timeline_transaction_select_activity_form', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    // console.log("[ds_p1_activity_timeline_transaction_select_activity_form] err: ", err);
                    // console.log("[ds_p1_activity_timeline_transaction_select_activity_form] data: ", data);
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    this.getActivityTimelineTransactionByFormId713 = function (request, activityId, formId) {
        return new Promise((resolve, reject) => {
            // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_activity_id BIGINT(20), 
            // IN p_form_id BIGINT(20), IN p_start_from SMALLINT(6), IN p_limit_value smallint(6)
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                activityId,
                formId,
                0,
                50
            );
            const queryString = util.getQueryString('ds_p1_1_activity_timeline_transaction_select_activity_form', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    // console.log("[ds_p1_activity_timeline_transaction_select_activity_form] err: ", err);
                    // console.log("[ds_p1_activity_timeline_transaction_select_activity_form] data: ", data);
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    this.activityFormTransactionSelect = function (request, formTransactionId, formId) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                formTransactionId,
                formId,
                request.organization_id
            );
            const queryString = util.getQueryString('ds_v1_activity_form_transaction_select', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    // console.log("[ds_v1_activity_form_transaction_select] err: ", err);
                    // console.log("[ds_v1_activity_form_transaction_select] data: ", data);
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    // Map the form file to the Order Validation queue
    this.mapFileToQueue = function (request, queueId, queueInlineData) {
        return new Promise((resolve, reject) => {
            // IN p_queue_id BIGINT(20), IN p_organization_id BIGINT(20), 
            // IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20), 
            // IN p_queue_inline_data JSON, IN p_log_asset_id BIGINT(20), 
            // IN p_log_datetime DATETIME
            let paramsArr = new Array(
                queueId,
                request.organization_id,
                request.activity_id,
                request.asset_id,
                queueInlineData,
                request.asset_id,
                util.getCurrentUTCTime()
            );
            const queryString = util.getQueryString('ds_p1_queue_activity_mapping_insert', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    // Map the form file to the Order Validation queue
    this.mapFileToQueueV1 = function (request, queueId, queueInlineData) {
        return new Promise((resolve, reject) => {
            // IN p_queue_id BIGINT(20), IN p_organization_id BIGINT(20), 
            // IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20), 
            // IN p_queue_inline_data JSON, IN p_log_asset_id BIGINT(20), 
            // IN p_log_datetime DATETIME
            let paramsArr = new Array(
                queueId,
                request.organization_id,
                request.activity_id,
                request.asset_id,
                queueInlineData,
                request.asset_id,
                util.getCurrentUTCTime()
            );
            const queryString = util.getQueryString('ds_p1_1_queue_activity_mapping_insert', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };    

    // Unmap the form file from the Order Validation queue
    this.unmapFileFromQueue = function (request, queueActivityMappingId) {
        return new Promise((resolve, reject) => {
            // IN p_queue_activity_mapping_id BIGINT(20), IN p_organization_id BIGINT(20), 
            // IN p_log_state TINYINT(4), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
            let paramsArr = new Array(
                queueActivityMappingId,
                request.organization_id,
                request.set_log_state || 3, // log state // 2 for enabling
                request.asset_id,
                util.getCurrentUTCTime()
            );
            const queryString = util.getQueryString('ds_p1_queue_activity_mapping_update_log_state', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    // Unmap the form file from the Order Validation queue
    this.fetchQueueActivityMappingId = function (request, queueId) {
        return new Promise((resolve, reject) => {
            // IN p_queue_id BIGINT(20), IN p_activity_id BIGINT(20), 
            // IN p_organization_id BIGINT(20)
            let paramsArr = new Array(
                queueId,
                request.activity_id,
                request.organization_id
            );
            const queryString = util.getQueryString('ds_p1_queue_activity_mapping_select', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    this.fetchQueueActivityMappingIdV1 = function (request, queueId) {
        return new Promise((resolve, reject) => {
            // IN p_queue_id BIGINT(20), IN p_activity_id BIGINT(20), 
            // IN p_organization_id BIGINT(20)
            let queryString = '';
            if(request.activity_type_category_id==59){
                let paramsArr = new Array(
                    queueId,
                    request.activity_id
                );
                 queryString = util.getQueryString('ds_p2_1_queue_activity_mapping_select', paramsArr);
            }
            let paramsArr = new Array(
                queueId,
                request.activity_id,
                request.organization_id
            );
             queryString = util.getQueryString('ds_p1_1_queue_activity_mapping_select', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    this.queueActivityMappingUpdateDatetimeEndDeffered = function (request, queueActivityMappingId, datetimeEndDeffered) {
        return new Promise((resolve, reject) => {
            // IN p_queue_activity_mapping_id BIGINT(20), IN p_organization_id BIGINT(20), 
            // IN p_datetime_end_deffered DATETIME, IN p_log_asset_id BIGINT(20), 
            // IN p_log_datetime DATETIME
            let paramsArr = new Array(
                queueActivityMappingId,
                request.organization_id,
                datetimeEndDeffered,
                request.asset_id,
                util.getCurrentUTCTime()
            );
            const queryString = util.getQueryString('ds_p1_queue_activity_mapping_update_datetime_end_deffered', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    // Unmap the form file from the Order Validation queue
    this.queueActivityMappingUpdateInlineStatus = function (request, queueActivityMappingId, queueActivityInlineData) {
        return new Promise((resolve, reject) => {
            // IN p_queue_activity_mapping_id BIGINT(20), IN p_organization_id BIGINT(20), 
            // IN p_inline_data JSON, IN p_activity_status_id BIGINT(20), 
            // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
            let paramsArr = new Array(
                queueActivityMappingId,
                request.organization_id,
                queueActivityInlineData,
                request.activity_status_id,
                request.asset_id,
                util.getCurrentUTCTime()
            );
            const queryString = util.getQueryString('ds_p1_queue_activity_mapping_update_inline_status', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    //Update only the queue mapping inline data
    this.queueActivityMappingUpdateInlineData = function (request, queueActivityMappingId, queueActivityInlineData) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                queueActivityMappingId,
                queueActivityInlineData,
                request.organization_id,
                2,
                request.asset_id,
                util.getCurrentUTCTime()
            );
            const queryString = util.getQueryString('ds_p1_queue_activity_mapping_update_inline_data', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    this.assetListUpdateOperatingAsset = function (request, deskAssetId, operatingAssetId, callback) {
        let paramsArr = new Array(
            deskAssetId,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            operatingAssetId,
            request.asset_id,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_v1_asset_list_update_operating_asset', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, true): callback(err, false);
            });
        }
    };


    // Fetch all queues
    this.listAllQueues = function (request) {
        return new Promise((resolve, reject) => {
            // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
            // IN p_workforce_id BIGINT(20), IN p_flag SMALLINT(6), 
            // IN p_start_from BIGINT(20), IN p_limit_value SMALLINT(6)
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                0, // request.flag,
                request.start_from,
                request.limit_value
            );
            const queryString = util.getQueryString('ds_p1_queue_list_select', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    // Fetch all activities mapped to a queue
    this.fetchActivitiesMappedToQueue = function (request) {
        return new Promise((resolve, reject) => {
            // IN p_queue_id BIGINT(20), IN p_organization_id BIGINT(20), 
            // IN p_flag SMALLINT(6), IN p_sort_flag TINYINT(4), 
            // IN p_start_from BIGINT(20), IN p_limit_value SMALLINT(6)
            let paramsArr = new Array(
                request.queue_id,
                request.organization_id,
                request.sort_flag || 0, // 0 => Ascending | 1 => Descending
                request.flag || 0, // 0 => Due date | 1 => Created date
                request.start_from,
                request.limit_value
            );
            const queryString = util.getQueryString('ds_p1_queue_activity_mapping_select_queue', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    // Fetch queue by search string
    this.fetchQueueByQueueName = function (request, queueName) {
        return new Promise((resolve, reject) => {
            // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
            // IN p_workforce_id BIGINT(20), IN p_flag SMALLINT(6), 
            // IN p_is_search TINYINT(4), IN p_search_string VARCHAR(50), 
            // IN p_start_from BIGINT(20), IN p_limit_value SMALLINT(6)
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                0, // request.flag
                1, // request.is_search
                queueName,
                request.start_from,
                request.limit_value
            );
            const queryString = util.getQueryString('ds_p1_queue_list_select_name', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };


    this.processReservationBilling = function (request, idReservation) {
        return new Promise((resolve, reject) => {
            //if(request.hasOwnProperty('is_room_posting'))
            this.pamEventBillingUpdate(request, idReservation);
            resolve(true);
        });
    };

    this.pamEventBillingUpdate = function (request, idReservation) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                idReservation,
                request.datetime_log
            );
            let queryString = util.getQueryString("pm_v1_pam_event_billing_update", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.pamOrderListUpdate = function (request, idOrder) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                idOrder,
                request.datetime_log
            );
            let queryString = util.getQueryString("pm_v1_pam_order_list_update", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    // Queue History Insert
    this.queueHistoryInsert = function (request, updateTypeId, queueActivityMappingId) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                queueActivityMappingId,
                updateTypeId,
                request.asset_id,
                util.getCurrentUTCTime()
            );
            console.log('request.asset_id in queueHistoryInsert: ', request.asset_id);
            if(request.asset_id === 0 || request.asset_id === null || request.asset_id === undefined){
                console.log(`ds_p1_queue_activity_mapping_history_insert db call is not done as asset_id is ${request.asset_id}`);
                resolve([]);
            }
            else {
                const queryString = util.getQueryString('ds_p1_queue_activity_mapping_history_insert', paramsArr);
                if (queryString !== '') {
                    db.executeQuery(0, queryString, request, function (err, data) {
                        (err) ? reject(err): resolve(data);
                    });
                }
            }
        });
    };

    // Workforce History Insert
    this.workforceListHistoryInsert = function (request, updateTypeId) {
        // IN p_workforce_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_update_type_id SMALLINT(6), IN p_update_datetime DATETIME
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.workforce_id,
                request.organization_id,
                updateTypeId,
                util.getCurrentUTCTime(),
            );
            const queryString = util.getQueryString('ds_p1_workforce_list_history_insert', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    this.getActivityCollection = function (request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.activity_id,
                request.organization_id
            );

            let queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log("err "+err);
                    if (err === false) {
                        console.log('data: ' + data.length);
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.activityStatusChangeTxnInsertV2 = function (request, duration, statusCollection) {
        // IN p_organization_id BIGINT(20), IN p_activity_id BIGINT(20), IN p_from_status_id BIGINT(20), 
        // IN p_to_status_id BIGINT(20), IN p_from_status_datetime DATETIME, IN p_to_status_datetime 
        // DATETIME, IN p_duration DECIMAL(16,4), IN p_log_datetime DATETIME, IN p_log_asset_id BIGINT(20)
        // IN status_changed_flag TINYINT(4)
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                statusCollection.from_status_id,
                statusCollection.to_status_id,
                statusCollection.from_status_datetime,
                statusCollection.to_status_datetime,
                duration,
                util.getCurrentUTCTime(),
                request.asset_id,
                request.status_changed_flag,
                request.is_status_rollback || 0
            );
            let queryString = util.getQueryString('ds_p1_2_activity_status_change_transaction_insert', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };



    this.getActivityTimelineTransactionByFormId = function (request, activityId, formId) {
        return new Promise((resolve, reject) => {
            // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_activity_id BIGINT(20), 
            // IN p_form_id BIGINT(20), IN p_start_from SMALLINT(6), IN p_limit_value smallint(6)
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                activityId,
                formId,
                request.start_from||0,
                request.limit_value||200
            );
            const queryString = util.getQueryString('ds_p1_activity_timeline_transaction_select_activity_form', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        console.log('data: ' + data.length);
                        if (request.hasOwnProperty("field_id")) {
                            if (data.length > 0) {
                                processDBData(request, data).then((finalData) => {
                                    //console.log(finalData);
                                    resolve(finalData);
                                });
                            } else {
                                resolve(data);
                            }
                        } else {
                            resolve(data);
                        }
                    } else {
                        reject(err);
                    }

                });
            }
        });
    };

    function processDBData(request, data) {
        let array = [];
        return new Promise((resolve, reject) => {
            //console.log("AFTER PROMISE");

            forEachAsync(data, function (next, rowData) {
                //console.log("IN FIRST ASYNC");
                forEachAsync(JSON.parse(rowData.data_entity_inline).form_submitted, function (next1, fieldData) {
                    //console.log("IN SECOND ASYNC : "+parseInt(Number(fieldData.field_id)) +": "+parseInt(Number(request.field_id)));
                    if (parseInt(Number(fieldData.field_id)) === parseInt(Number(request.field_id))) {
                        //console.log("Field Equals "+fieldData);
                        rowData.data_entity_inline = [];
                        rowData.data_entity_inline[0] = fieldData;
                        //console.log("rowData.data_entity_inlne "+rowData.data_entity_inline);
                        array.push(rowData);
                        next();

                    } else {
                        console.log("Not Equals");
                        next1();
                    }

                }).then(() => {
                    next();
                });

            }).then(() => {
                //console.log(array);
                resolve(array);
            });
        });
    };

    this.getActivityByFormTransaction = function (request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.activity_id || 0,
                request.form_transaction_id,
                request.organization_id
            );

            let queryString = util.getQueryString('ds_v1_activity_list_select_form_transaction', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log("err "+err);
                    if (err === false) {
                        // console.log('data: ' + data);
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };


    this.getActivityByFormTransactionCallback = function (request, activityId, callback) {
        let paramsArr;
        if (Number(activityId > 0)) {
            paramsArr = new Array(
                activityId,
                request.form_transaction_id,
                request.organization_id
            );
        } else {
            paramsArr = new Array(
                request.activity_id,
                request.form_transaction_id,
                request.organization_id
            );
        }
        let queryString = util.getQueryString('ds_v1_activity_list_select_form_transaction', paramsArr);
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

    // Promisified version of the retrieval function
    // 'getSpecifiedForm'
    this.getFormFieldMappings = function (request, formId, startFrom, limitValue) {
        return new Promise((resolve, reject) => {
            // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
            // IN p_workforce_id BIGINT(20), IN p_form_id BIGINT(20), 
            // IN p_differential_datetime DATETIME, IN p_start_from INT(11), 
            // IN p_limit_value TINYINT(4)
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                formId,
                '1970-01-01 00:00:00',
                ((startFrom > 0) ? startFrom : request.start_from) || 0,
                ((limitValue > 0) ? limitValue : request.limit_value) || 50
            );
            const queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    this.workforceFormMappingSelect = async function (request) {
        // IN p_organization_id BIGINT(20), IN p_account_id bigint(20), 
        // IN p_workforce_id bigint(20), IN p_form_id BIGINT(20)

        let formData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    formData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, formData];
    };

    this.getBotsMappedToActType = async (request) => {
        let paramsArr = new Array(
            request.flag || 1,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id,
            request.field_id,
            request.form_id,
            request.page_start ||0,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_p1_bot_list_select', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    this.getBotworkflowSteps = async (request) => {
        let paramsArr = new Array(
            request.bot_id,
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_p1_bot_operation_mapping_select', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    this.widgetListSelectFieldAll = async (request) => {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.form_id,
            request.field_id,
            request.start_from || 0,
            request.limit_value || 50
        );
        let queryString = util.getQueryString('ds_p1_widget_list_select_field_all', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    this.getFormDataByFormTransaction = async (request) => {
        let paramsArr = new Array(
            request.organization_id,
            request.form_transaction_id
        );

        let queryString = util.getQueryString('ds_p1_activity_list_select_form_transaction', paramsArr);

        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };
    
    this.getFormDataByFormTransaction = async (request) => {        
        let paramsArr = new Array(            
            request.organization_id,
            request.form_transaction_id
        );

        let queryString = util.getQueryString('ds_p1_activity_list_select_form_transaction', paramsArr);
       
        if (queryString != '') {                
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    this.getWorkflowOfForm = async (request) => {        
        let paramsArr = new Array(            
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id
        );

        let queryString = util.getQueryString('ds_p1_workforce_form_mapping_select', paramsArr);
       
        if (queryString != '') {                
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    this.widgetActivityFieldTxnUpdateDatetime = function (request) {
        return new Promise((resolve, reject) => {

            let temp = {};
            let newReq = Object.assign({}, request);

            try {
                const flag = request.flag;

                let activityDatetimeCreatedIST = '';
                let order_po_trigger_diff = 0;
                let order_trigger_log_diff = 0;
                let order_caf_approval_log_diff = 0;
                let order_po_log_diff = 0;
                let order_docs__log_diff = 0;
                let order_po__order_docs_diff = 0;

                //global.logger.write('conLog', '*****Update: update po_date in widget5 *******'+request.flag +' '+flag, {}, request);    
                //global.logger.write('conLog', 'request.flag :: '+request.flag, {}, request);
                //global.logger.write('conLog', 'request.order_logged_datetime :: '+request.order_logged_datetime, {}, request);
                getWorkflowData(request).then((data) => {
                    //global.logger.write('conLog', 'In the workflow data length:: ' + request.flag + ' ' + JSON.stringify(data), {}, request);
                    util.logInfo(request,`getWorkflowData In the workflow data length: %j`,{length : request.flag, data : JSON.stringify(data), request});

                    if (data.length > 0) {

                        //global.logger.write('conLog', 'data[0].activity_caf_approval_datetime :: '+data[0].activity_caf_approval_datetime, {}, request);
                        //global.logger.write('conLog', 'data[0].activity_po_datetime :: '+data[0].activity_po_datetime, {}, request);
                        activityDatetimeCreatedIST = util.addUnitsToDateTime(util.replaceDefaultDatetime(data[0].activity_datetime_created), 5.5, 'hours');

                        // console.log('activityDatetimeCreatedIST :: ',activityDatetimeCreatedIST);
                        //global.logger.write('conLog', '*****Update: activityDatetimeCreatedIST widget ' + request.order_po_date + ', ' + request.flag + ',*******' + activityDatetimeCreatedIST, {}, request);
                        util.logInfo(request,`getWorkflowData *****Update: activityDatetimeCreatedIST widget %j`,{order_po_date : request.order_po_date, flag : request.flag, activityDatetimeCreatedIST : activityDatetimeCreatedIST, request});
                        if (flag == 1) {
                            if (request.order_po_date == null || request.order_po_date == '') {
                                order_po_trigger_diff = 0;
                                order_po_log_diff = 0;
                                order_po__order_docs_diff = 0;
                            } else {
                                //global.logger.write('conLog', '*****Update: activityDatetimeCreatedIST ELSE ' +data[0].activity_order_documents_datetime+' '+ data[0].activity_logged_datetime + ', ' + request.flag + ', *******' + activityDatetimeCreatedIST, {}, request);
                                util.logInfo(request,`getWorkflowData *****Update: activityDatetimeCreatedIST ELSE %j`,{activity_order_documents_datetime : data[0].activity_order_documents_datetime, activity_logged_datetime: data[0].activity_logged_datetime, flag : request.flag, activityDatetimeCreatedIST : activityDatetimeCreatedIST,request});
                                if (data[0].activity_logged_datetime != null && data[0].activity_order_documents_datetime != null) {
                                    console.log("$$$1");
                                    order_po_log_diff = util.differenceDatetimes(data[0].activity_logged_datetime, request.order_po_date) / 1000;
                                    order_po_trigger_diff = util.differenceDatetimes(activityDatetimeCreatedIST, request.order_po_date) / 1000;
                                    order_po__order_docs_diff = util.differenceDatetimes(data[0].activity_order_documents_datetime, request.order_po_date) / 1000;
                                }else if (data[0].activity_logged_datetime != null && data[0].activity_order_documents_datetime == null) {
                                    console.log("$$$2");
                                    order_po_log_diff = util.differenceDatetimes(data[0].activity_logged_datetime, request.order_po_date) / 1000;
                                    order_po_trigger_diff = util.differenceDatetimes(activityDatetimeCreatedIST, request.order_po_date) / 1000;
                                    order_po__order_docs_diff = 0;
                                }else if (data[0].activity_logged_datetime == null && data[0].activity_order_documents_datetime != null) {
                                    console.log("$$$3");
                                    order_po_log_diff = 0;
                                    order_po_trigger_diff = util.differenceDatetimes(activityDatetimeCreatedIST, request.order_po_date) / 1000;
                                    order_po__order_docs_diff = util.differenceDatetimes(data[0].activity_order_documents_datetime, request.order_po_date) / 1000;
                                }else {
                                    console.log("$$$4");
                                    order_po_log_diff = 0;
                                    order_po_trigger_diff = util.differenceDatetimes(activityDatetimeCreatedIST, request.order_po_date) / 1000;
                                    order_po__order_docs_diff = 0;
                                }
                            }

                        } else if (flag == 2) {
                            //
                        } else if (flag == 3) {
                            //global.logger.write('conLog', '*****Update: Order Logged ' +data[0].activity_order_documents_datetime+' '+ data[0].activity_caf_approval_datetime+' '+ data[0].activity_po_datetime + ', ' + request.flag + ', *******' + activityDatetimeCreatedIST, {}, request);
                            util.logInfo(request, `getWorkflowData *****Update: Order Logged %j`, { activity_order_documents_datetime: data[0].activity_order_documents_datetime, 
                                activity_caf_approval_datetime: data[0].activity_caf_approval_datetime, activity_po_datetime: data[0].activity_po_datetime, flag: request.flag,
                                activityDatetimeCreatedIST: activityDatetimeCreatedIST, request });
                            order_trigger_log_diff = util.differenceDatetimes(request.order_logged_datetime, activityDatetimeCreatedIST) / 1000;
                            //global.logger.write('conLog', 'request.order_trigger_log_diff :: '+order_trigger_log_diff, {}, request);
                            if(data[0].activity_order_documents_datetime !== null)
                                order_docs__log_diff = util.differenceDatetimes(request.order_logged_datetime, data[0].activity_order_documents_datetime) / 1000;

                            if (data[0].activity_caf_approval_datetime != null)
                                order_caf_approval_log_diff = util.differenceDatetimes(request.order_logged_datetime, data[0].activity_caf_approval_datetime) / 1000;

                            if (data[0].activity_po_datetime != null)
                                order_po_log_diff = util.differenceDatetimes(request.order_logged_datetime, data[0].activity_po_datetime) / 1000;
                        }
                    }

                    //global.logger.write('conLog', 'request.order_po_trigger_diff :: ' + order_po_trigger_diff, {}, request);
                    util.logInfo(request, `getWorkflowData request.order_po_trigger_diff %j`, { order_po_trigger_diff: order_po_trigger_diff, request });
                    //global.logger.write('conLog', 'request.order_trigger_log_diff :: ' + order_trigger_log_diff, {}, request);
                    util.logInfo(request, `getWorkflowData request.order_trigger_log_diff %j`, { order_trigger_log_diff: order_trigger_log_diff, request });
                    //global.logger.write('conLog', 'request.order_caf_approval_log_diff :: ' + order_caf_approval_log_diff, {}, request);
                    util.logInfo(request, `getWorkflowData request.order_caf_approval_log_diff %j`, { order_caf_approval_log_diff: order_caf_approval_log_diff, request });
                    //global.logger.write('conLog', 'request.order_po_log_diff :: ' + order_po_log_diff, {}, request);
                    util.logInfo(request, `getWorkflowData request.order_po_log_diff %j`, { order_po_log_diff: order_po_log_diff, request });
                    //global.logger.write('conLog', 'request.order_docs__log_diff :: ' + order_docs__log_diff, {}, request);
                    util.logInfo(request, `getWorkflowData request.order_docs__log_diff %j`, { order_docs__log_diff: order_docs__log_diff, request });
                    //global.logger.write('conLog', 'request.order_po__order_docs_diff :: ' + order_po__order_docs_diff, {}, request);
                    util.logInfo(request, `getWorkflowData request.order_po__order_docs_diff %j`, { order_po__order_docs_diff: order_po__order_docs_diff, request });

                    let paramsArr = new Array(
                        request.organization_id,
                        request.account_id,
                        request.workforce_id,
                        request.workflow_activity_id,
                        request.order_po_date || null,
                        request.order_caf_approval_datetime || null,
                        request.order_logged_datetime || null,
                        //order_po_trigger_diff,
                        isNaN(order_po_trigger_diff) ? 0 : order_po_trigger_diff,
                        order_trigger_log_diff,
                        order_caf_approval_log_diff,
                        order_po_log_diff,
                        order_docs__log_diff,
                        //order_po__order_docs_diff,
                        isNaN(order_po__order_docs_diff) ? 0 : order_po__order_docs_diff,
                        flag,
                        request.datetime_log
                    );
                    let queryString = util.getQueryString("ds_p1_4_widget_activity_field_transaction_update_datetime", paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {

                                console.log('ACS ERRRRRRRRRRRRRRROR : ', err);
                                console.log('ACS DAAAAAAAAAAAAAAATA : ', data);
                                if (data.length > 0) {
                                    newReq.widget_id = data[0].widget_id;
                                }
                                temp.data = data;
                                newReq.inline_data = temp;
                                if (Number(newReq.widget_id) > 0) {
                                    self.widgetLogTrx(newReq, 1);
                                }
                                resolve();
                            } else {
                                temp.err = err;
                                newReq.inline_data = temp;
                                if (Number(newReq.widget_id) > 0) {
                                    self.widgetLogTrx(newReq, 2);
                                }
                                reject(err);
                            }
                        });
                    }

                });
            } catch (error) {
                temp.err = error;
                newReq.inline_data = temp;
                if (Number(newReq.widget_id) > 0) {
                    self.widgetLogTrx(newReq, 2);
                }
                //global.logger.write('error', error, error, request);
                util.logError(request,`widgetActivityFieldTxnUpdateDatetime Error %j`, { error,request});
            }
        });
    }; 

   function getWorkflowData (request) { 
        return new Promise((resolve, reject) => {       
            let paramsArr = new Array(            
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.workflow_activity_id
            );

            let queryString = util.getQueryString('ds_p1_widget_activity_field_transaction_select_wokflow', paramsArr);
               
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }

    //Bot transaction - 
    this.botOperationInsert = async function(request) {
        let paramsArr = new Array(                
            request.request_data || '{}',
            request.flag_check,
            request.flag_defined,
            request.trigger || 0,
            request.bot_transaction_inline_data || '{}',            
            request.workflow_activity_id || 0,
            request.form_activity_id || 0,
            request.form_transaction_id || 0,
            request.bot_id,
            request.bot_inline_data,
            request.bot_operation_status_id || 0,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.asset_id,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_p1_1_bot_log_transaction_insert', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));                
        }
    };

    //Bot transaction - Update flag bot defined
    this.botOperationFlagUpdateBotDefined = async function(request, flag) {
        let paramsArr = new Array(                
            request.organization_id, 
            request.bot_transaction_id || 0, 
            flag, 
            request.bot_id || 0, 
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_p1_bot_log_transaction_update_flag_defined', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));                
        }
    };

    //Bot transaction - Update flag bot trigger
    this.botOperationFlagUpdateTrigger = async function(request, flag) {
        let paramsArr = new Array(                
            request.organization_id, 
            request.bot_transaction_id || 0, 
            flag, 
            //request.bot_id, 
            request.datetime_log            
        );
        let queryString = util.getQueryString('ds_p1_bot_log_transaction_update_flag_trigger', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));                
        }
    };

    //Bot transaction - Update bot status
    this.botOperationFlagUpdateBotSts = async function(request, botStatusId) {
        let paramsArr = new Array(                
            request.organization_id, 
            request.bot_transaction_id || 0, 
            botStatusId,
            request.bot_transaction_inline_data || '{}',
            request.datetime_log          
        );
        let queryString = util.getQueryString('ds_p1_bot_log_transaction_update_status', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));                
        }
    };

    //Widget Log transaction
    this.widgetLogTrx = async function(request, statusId) {        
        let paramsArr = new Array(                
            JSON.stringify(request),            
            //request.inline_data || '{}', 
            '{}',
            request.workflow_activity_id, 
            request.form_activity_id || 0, 
            request.form_transaction_id || 0, 
            request.activity_status_id || 0, 
            request.widget_id || 0, 
            statusId, 
            request.workforce_id, 
            request.account_id, 
            request.organization_id, 
            request.asset_id, 
            util.getCurrentUTCTime()  
        );
        let queryString = util.getQueryString('ds_p1_1_widget_log_transaction_insert', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));                
        }
    };


    this.getWidgetByActivityType = function (request) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_form_id,
                request.activity_type_id,
                request.access_level_id || 8,
                request.page_start || 0,
                request.page_limit || 1
            );

            let queryString = util.getQueryString('ds_p1_1_widget_list_select_form_activity_type', paramsArr);

            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.getFormWorkflowDetails = function (request) {

        return new Promise((resolve, reject) => {
            let paramsArr;

            paramsArr = new Array(
                request.activity_id,
                request.organization_id
            );
            const queryString = util.getQueryString('ds_v1_activity_list_select_form_workflow', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                });
            }
        });
    };

    this.getWorkflowFieldsBasedonActTypeId = async function (request, activityTypeId) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(            
            request.organization_id,
            request.account_id,
            request.workforce_id,
            activityTypeId
        );

        let queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_select_id', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    if(data === null) {
                        error = true;
                    } else {
                        responseData = data;
                        error = false;
                    }                    
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    this.analyticsUpdateWidgetValue = async function (request, activityId, flag, value) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            activityId,
            flag || 0,
            value,
            request.asset_id,
            request.datetime_log
        );

        let queryString = util.getQueryString('ds_p1_activity_list_update_widget_value', paramsArr);
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

    this.fetchReferredFormActivityIdAsync = async (request, activityId, formTransactionId, formId) =>{
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_activity_id BIGINT(20), IN p_form_id BIGINT(20), 
        // IN p_form_transaction_id BIGINT(20), IN p_start_from SMALLINT(6), 
        // IN p_limit_value smallint(6)

        let formData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            activityId,
            formId,
            formTransactionId,
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_activity_timeline_transaction_select_refered_activity', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    formData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, formData];
    };

    this.fetchReferredFormActivityIdAsyncv1 = async (request, activityId, formTransactionId, formId) => {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_activity_id BIGINT(20), IN p_form_id BIGINT(20), 
        // IN p_form_transaction_id BIGINT(20), IN p_start_from SMALLINT(6), 
        // IN p_limit_value smallint(6)

        let formData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            activityId,
            formId,
            formTransactionId,
            request.start_from || 0,
            request.limit_value || 1
        );

        const queryString = util.getQueryString('ds_p1_activity_timeline_transaction_select_form_workflow', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    formData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, formData];
    };

    this.activityListUpdateInlineData = async function (request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            organizationID || request.organization_id,
            request.activity_inline_data,
            request.pipe_separated_string || '',
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_activity_list_update_inline_data', paramsArr);

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

    this.getFormFieldDefinition = function (request, fieldData) {
        return new Promise((resolve, reject) => {
            let queryString = '';

            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                fieldData.form_id,
                fieldData.field_id,
                request.page_start || 0,
                util.replaceQueryLimit(request.page_limit)
            );
            queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_select_field', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve(data);
                    } else {
                        console.log(err);
                        reject(true);
                    }
                });
            }

        });
    };

    //Insert into activity_entity_mapping table
    //Insert into activity_form_field_mapping table
    //Workflow, combo fields reference data pre-crunch purpose
    this.activityEntityMappingInsert = async function(request, flag) {
        //flag = 1 - Insert into activity entity Mapping Table
        //flag = 2 - Insert into activity form field Mapping Table
      let responseData = [],
        error = true;

      const paramsArr = new Array(
        request.entity_type_id,
        request.entity_level_id,
        request.activity_id,
        request.mapping_activity_id,
        request.bot_operation_id,
        request.form_transaction_id,
        request.form_id,
        request.field_id,
        request.data_type_combo_id,
        request.asset_id,
        request.workforce_id,
        request.account_id,
        request.organization_id,
        request.participant_access_id,
        request.log_asset_id,
        request.log_datetime,
        request.flag_due_date_impact
      );
      let queryString = "";
      if(flag === 1) {
        queryString = util.getQueryString("ds_p1_activity_entity_mapping_insert",paramsArr);
      } else if(flag === 2) {
        queryString = util.getQueryString('ds_p1_activity_form_field_mapping_insert', paramsArr);
      }
      
      if (queryString !== "") {
        await db
          .executeQueryPromise(0, queryString, request)
          .then(data => {
            responseData = data;
            error = false;
          })
          .catch(err => {
            error = err;
          });
      }
      return [error, responseData];
    };

    //udpate status - activity_entity_mapping - Workflow reference
    //udpate status - form field mapping - combo field
    this.activityEntityMappingUpdateStatus = async function(request, data, flag) {
        //flag = 1 - Insert into activity entity Mapping Table
        //flag = 2 - Insert into activity form field Mapping Table
      let responseData = [],
        error = true;

      const paramsArr = new Array(
        request.organization_id,
        request.account_id,
        request.workforce_id,
        data.activity_id,
        data.activity_status_id,
        data.activity_status_type_id,
        util.getCurrentUTCTime()
      );
      let queryString = "";
      if(flag === 1) {
        queryString = util.getQueryString("ds_p1_activity_entity_mapping_update_status",paramsArr);
      } else if(flag === 2) {
        queryString = util.getQueryString('ds_p1_activity_form_field_mapping_update_status', paramsArr);
      }
    
      if (queryString !== "") {
        await db
          .executeQueryPromise(0, queryString, request)
          .then(data => {
            responseData = data;
            error = false;
          })
          .catch(err => {
            error = err;
          });
      }
      return [error, responseData];
    };

    //udpate workflow percentage - activity_entity_mapping - workflow reference
    //udpate workflow percentage - form field mapping - combo field
    this.activityEntityMappingUpdateWFPercentage = async function(request, data, flag) {
        //flag = 1 - Insert into activity entity Mapping Table
        //flag = 2 - Insert into activity form field Mapping Table
      let responseData = [],
        error = true;

      const paramsArr = new Array(
        request.organization_id,
        data.activity_id,
        data.workflow_percentage,
        request.log_asset_id || request.asset_id,
        util.getCurrentUTCTime()
      );

      let queryString = "";
      if(flag === 1) {
        queryString = util.getQueryString("ds_p1_activity_entity_mapping_update_workflow_percent",paramsArr);
      } else if(flag === 1) {
        queryString = util.getQueryString('ds_p1_activity_form_field_mapping_update_workflow_percent', paramsArr);
      }
    
      if (queryString !== "") {
        await db
          .executeQueryPromise(0, queryString, request)
          .then(data => {
            responseData = data;
            error = false;
          })
          .catch(err => {
            error = err;
          });
      }
      return [error, responseData];
    };

    //udpate deferred datetime - activity_entity_mapping -workflow reference
    //udpate deferred datetime - form field mapping - combo field
    this.activityEntityMappingUpdateDefDt = async function(request, data, flag) {
        //flag = 1 - Insert into activity entity Mapping Table
        //flag = 2 - Insert into activity form field Mapping Table
      let responseData = [],
        error = true;

      const paramsArr = new Array(
        data.activity_id,
        request.organization_id,
        util.getFormatedLogDatetime(data.deferred_datetime),
        request.asset_id,
        util.getCurrentUTCTime()
      );
      let queryString = "";
      if(flag === 1) {
        queryString = util.getQueryString("ds_v1_activity_entity_mapping_update_deferred_datetime",paramsArr);
      } else if(flag === 2) {
        queryString = util.getQueryString('ds_v1_activity_form_field_mapping_update_deferred_datetime', paramsArr);
      }
    
      if (queryString !== "") {
        await db
          .executeQueryPromise(0, queryString, request)
          .then(data => {
            responseData = data;
            error = false;
          })
          .catch(err => {
            error = err;
          });
      }
      return [error, responseData];
    };
    
    //udpate Workflow reference data type Value - activity_entity_mapping -workflow reference    
    this.activityEntityMappingUpdateWfValue = async function(request) {
        let responseData = [],
          error = true;
  
        const paramsArr = new Array(
            request.activity_id,
            request.form_transaction_id,
            request.field_id,
            request.bot_operation_id,
            request.organization_id,
            request.mapping_activity_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        
        const queryString = util.getQueryString("ds_v1_activity_entity_mapping_update_mapping_activity",paramsArr);        
    
        if (queryString !== "") {
          await db
            .executeQueryPromise(0, queryString, request)
            .then(data => {
              responseData = data;
              error = false;
            })
            .catch(err => {
              error = err;
            });
        }
        return [error, responseData];
      };

    
    //udpate Combo field data type value - form field mapping - combo field
    this.activityFormFieldMappingUpdateWfValue = async function(request) {
        let responseData = [],
          error = true;
  
        const paramsArr = new Array(
            request.activity_id,
            request.form_transaction_id,
            request.field_id,
            request.data_type_combo_id,
            request.bot_operation_id,
            request.organization_id,
            request.mapping_activity_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString("ds_v1_activity_form_field_mapping_update_combo_value",paramsArr);        
    
        if (queryString !== "") {
          await db
            .executeQueryPromise(0, queryString, request)
            .then(data => {
              responseData = data;
              error = false;
            })
            .catch(err => {
              error = err;
            });
        }
        return [error, responseData];
      };

    //Get the Global Forms of an organization
    this.getGlobalForms = async function(request) {
        let responseData = [],
          error = true;
  
        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.flag,
            request.start_from || 0,
            request.limit_value
        );

        const queryString = util.getQueryString("ds_v1_workforce_form_mapping_select_global_forms",paramsArr);        
    
        if (queryString !== "") {
          await db
            .executeQueryPromise(1, queryString, request)
            .then(data => {
              responseData = data;
              error = false;
            })
            .catch(err => {
              error = err;
            });
        }
        return [error, responseData];
      };

 	this.activityUpdateDocumentsSubmitted = async function(request, flag) {
        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            1,
            util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('ds_v1_activity_list_update_documents_submitted', paramsArr);
        let queryStringMapping = util.getQueryString('ds_v1_activity_asset_mapping_update_documents_submitted', paramsArr);
        
        if (queryString != '') {
                          db.executeQueryPromise(0, queryString, request);
            return await (db.executeQueryPromise(0, queryStringMapping, request)); 
                         
        }
       
    };

    this.assetSummaryTransactionInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.monthly_summary_id,
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.inline_data,
            request.entity_date_1,
            request.entity_datetime_1,
            request.entity_tinyint_1,
            request.entity_bigint_1,
            request.entity_double_1,
            request.entity_decimal_1,
            request.entity_decimal_2,
            request.entity_decimal_3,
            request.entity_text_1,
            request.entity_text_2,
            request.location_latitude,
            request.location_longitude,
            request.location_gps_accuracy,
            request.location_gps_enabled,
            request.location_address,
            request.location_datetime,
            request.device_manufacturer_name,
            request.device_model_name,
            request.device_os_id,
            request.device_os_name,
            request.device_os_version,
            request.device_app_version,
            request.device_api_version,
            request.asset_id,
            request.message_unique_id || 0,
            request.log_retry || 0,
            request.log_offline || 0,
            util.getCurrentUTCTime(), // transaction_datetime
            util.getCurrentUTCTime() // log_datetime
        );

        const queryString = util.getQueryString("ds_v1_asset_summary_transaction_insert", paramsArr);

        if(request.asset_id === 0) {
            console.log('Not making db call when the asset_id is 0', request.asset_id );
            return[error = false, []];
        }
        else {
            if (queryString !== "") {
                await db
                    .executeQueryPromise(0, queryString, request)
                    .then(data => {
                        responseData = data;
                        error = false;
                    })
                    .catch(err => {
                        error = err;
                    });
            }
            return [error, responseData];
        }
      
    };


    this.activityTimelineTransactionInsertAsync = async function (request, participantData, streamTypeId) {

        let responseData = [],
            error = true;
        //global.logger.write('conLog', 'Request Params in activityCommonService timeline : ',request,{});
        let assetId = request.asset_id;
        let organizationId = request.organization_id;
        let accountId = request.account_id;
        let workforceId = request.workforce_id;
        let messageUniqueId = request.message_unique_id;
        let entityTypeId = 0;
        let entityText1 = "";
        let entityText2 = "";
        let entityText3 = ""; //Beta
        let activityTimelineCollection = "{}"; //BETA
        let retryFlag = 0;
        let formTransactionId = 0;
        let dataTypeId = 0;
        let formId = 0;
        let newUserAssetId = (request.hasOwnProperty('signedup_asset_id')) ? request.signedup_asset_id : 0;
        
        // const supressTimelineEntries = [50079,50068, 4609, 50294, 50295, 50264,50403, 50787];
        
        const supressTimelineEntries = [50079,50068, 4609, 50294, 50295, 50264,50787,50824, 51087, 51086, 50403];
        
        if(supressTimelineEntries.includes(Number(request.form_id)) && Number(streamTypeId)==713){
            //console.log("IN addTimelineTransactionAsync Suprress:: ");
            streamTypeId = 728;
            //request.activity_stream_type_id = 728;
        }
        
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;

        entityText3 = (request.hasOwnProperty('activity_timeline_title')) ? request.activity_timeline_title : "";

        if (request.hasOwnProperty('activity_type_category_id')) {
            let activityTypeCategoryId = Number(request.activity_type_category_id);
            if (activityTypeCategoryId === 4) {
                if (request.hasOwnProperty('activity_inline_data')) {
                    let inlineJson = JSON.parse(request.activity_inline_data);
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


        if (Object.keys(participantData).length > 0) {
            organizationId = participantData.organization_id;
            accountId = participantData.account_id;
            workforceId = participantData.workforce_id;
            assetId = participantData.asset_id;
            messageUniqueId = participantData.message_unique_id;
        }

        util.logInfo(request,`activityTimelineTransactionInsertAsync streamTypeId ${streamTypeId}`);
        switch (streamTypeId) {
            case 4: // activity updated
                entityTypeId = 0;
                entityText1 = "activity updated";
                entityText2 = request.activity_inline_data;
                break;
            case 207: // Contact card has been clipped to a Document
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 309: // activity cover altered
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_cover_collection;
                break;
            case 310: // text message     --> File
            case 607: // text message     --> Customer Request
            case 1307: // text message    --> Visitor Request
            case 1507: // text message    --> Time Card
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = JSON.stringify(request.activity_timeline_text);
                break;
            case 311: // image    --> file
            case 608: // image    --> Customer Request
            case 1308: // image    --> Visitor Request
            case 1508: // image   --> Time Card
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 313: // form
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                entityText2 = request.activity_timeline_collection;
                break;
            case 702: // form | workflow: Add Participant
            case 26002: // widget: Add Participant
            case 26005: // widget: Remove Participant
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                entityText1 = "";
                entityText2 = "";
                break;
            case 704: // form: status alter
            case 711: //alered the due date
            case 734: //alered the due date
                entityTypeId = 0;
                entityText1 = request.from_date;
                entityText2 = request.to_date;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 717: // Workflow: Percentage alter
                entityTypeId = 0;
                entityText2 = request.activity_timeline_collection;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 705: // form
            case 728: // Report form BC
case 729: // Report form BC Edit
            case 713: // form field alter
            case 714: //Bot Firing External API
            case 715:
            case 716:
            case 726:
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                entityText2 = '';
                activityTimelineCollection = request.activity_timeline_collection;
                formTransactionId = request.form_transaction_id;
                formId = request.form_id;
                request.entity_bigint_1 = request.reference_form_activity_id || 0;
                dataTypeId = 37; //static for all form submissions
                break;
            case 710: // form field alter
                entityTypeId = 0;
                //entityText2 = request.activity_timeline_collection;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 718: // Workbook mapped
            case 719: // Workbook updated
                entityText1 = request.workbook_s3_url;
                entityText2 = "";
                activityTimelineCollection = request.activity_timeline_collection;
                formTransactionId = request.form_transaction_id;
                formId = request.form_id;
                break;
            case 314: // cloud based document -- file
            case 610: // cloud based document -- Customer Request
            case 709: // cloud based document -- Form
            case 1310: // cloud based document -- Visitor Request
            case 1408: // cloud based document -- Project
            case 1510: // cloud based document -- Time Card
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 315: // clip mail to task
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 316: // clip notepad
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 320: // Add video call communication
            case 321: // Add phone call communication
            case 322: // Add mobile call communication
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 323: // Add message communication
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                break;
            case 325: // [Files | Workflow] Add Comment/Attachment
            case 114: // IIT JAMMU ID CARD
            case 115: // IIT JAMMU ID CARD
            case 116: // IIT JAMMU ID CARD
            case 26001: //Widget Created
            case 26004: // [Widget] Comment Added on Widget
            case 2505: // [Contact] Add Comment
            case 2605: // [Product] Add Comment
            case 509: 
                activityTimelineCollection = request.activity_timeline_collection;
            case 723:
            case 724:
                let attachmentNames = '',
                    isAttachment = 0;
                try {
                    const attachments = JSON.parse(request.activity_timeline_collection).attachments;
                    if (Number(attachments.length) > 0) {
                        let fileNames = [];
                        for (const attachmentURL of attachments) {
                            let fileName = String(attachmentURL).substring(String(attachmentURL).lastIndexOf('/')+1);
                            fileNames.push(fileName);
                        }
                        attachmentNames = fileNames.join('|');
                        isAttachment = 1;
                    }
                } catch (err) {
                    util.logError(request,`Parsing and retrieving attachments`, { type: 'timeline_insert', error: serializeError(err) });
                }
                activityTimelineCollection = request.activity_timeline_collection;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                entityText3 = attachmentNames;
                request.entity_tinyint_1 = isAttachment;
                request.entity_tinyint_2 = request.attachment_type_id || 0;
                break;
            case 23002: // Telephone Module: Altered the status of the chat
            case 23003: // Telephone Module: Added an update to the chat
            case 23004: // Telephone Module: Voice call started
            case 23005: // Telephone Module: Voice call answered
            case 23006: // Telephone Module: Voice call ended
            case 23007: // Telephone Module: Voice call Missed
            case 23008: // Telephone Module: Video call started
            case 23009: // Telephone Module: Video call answered
            case 23010: // Telephone Module: Video call ended
            case 23011: // Telephone Module: Video call Missed
                activityTimelineCollection = request.activity_timeline_collection;
                entityText1 = "";
                entityText2 = JSON.stringify(request.activity_timeline_text);
                break;          
            default:
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = "";
                break;
        }

        //global.logger.write('debug', 'activityTimelineCollection : ', {}, request);
        //global.logger.write('debug', activityTimelineCollection, {}, request);        

        // [QUICK FIX] 16th August 2019, Friday 08:51 PM - Ben
        // 1506 is a Time Card stream type, however, un-diagnosed bug was causing this
        // stream type to be added whenever a workflows due date (/r0/activity/cover/alter) 
        // was being changed from web. This was also setting all the participants to have 
        // to same last seen timestamp
        if (
            Number(streamTypeId) === 1506 &&
            request.hasOwnProperty('activity_type_category_id') &&
            Number(request.activity_type_category_id) !== 34
        ) {
            return;
        }


        const paramsArr = new Array(
            request.activity_id,
            assetId,
            workforceId,
            accountId,
            organizationId,
            streamTypeId,
            entityTypeId, // entity type id
            request.entity_datetime_1 || '1970-01-01 00:00:00', // entity type id
            request.entity_datetime_2 || '1970-01-01 00:00:00', // entity type id
            entityText1, // entity text 1
            entityText2, // entity text 2
            entityText3, //Beta
            activityTimelineCollection, //BETA
            newUserAssetId, //New User Signed Up Asset ID
            request.track_longitude,
            request.entity_tinyint_1 || 0,
            request.entity_tinyint_2 || 0,
            request.entity_bigint_1 || 0,
            request.entity_bigint_2 || 0, //Added on 10-12-2018
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
            request.log_asset_id || request.asset_id,
            messageUniqueId || 0,
            retryFlag,
            request.flag_offline || 0,
            request.track_gps_datetime,
            request.datetime_log,
            request.data_activity_id || 0, //Added on 10-12-2018
            request.trigger_bot_id || 0,
            request.trigger_bot_operation_id || 0,
            request.trigger_form_id || 0,
            request.trigger_form_transaction_id || 0
        );
        //let queryString = util.getQueryString("ds_v1_6_activity_timeline_transaction_insert", paramsArr);
        let queryString = util.getQueryString("ds_v1_7_activity_timeline_transaction_insert", paramsArr);
        if(assetId === 0 || assetId === null){
            responseData = [];
            error = false;
        }
        else {
            if (queryString != '') {           
                await db.executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                        if(data.length > 0)
                        util.logInfo(request, "1.Timeline Transaction Id : "+data[0].id);
                    })
                    .catch((err) => {
                        error = true;
                    });
            }
        }
      

        return [error, responseData];
    };

    this.assetTimelineTransactionInsertAsync = async (request, participantData, streamTypeId) => {

        let responseData = [],
            error = true;

        let assetId = request.asset_id;
        let organizationId = request.organization_id;
        let accountId = request.account_id;
        let workforceId = request.workforce_id;
        let messageUniqueId = request.message_unique_id;
        let entityTypeId = 0;
        let entityText1 = "";
        let entityText2 = "";
        let entityText3 = "";
        let activityTimelineCollection = "{}"; //BETA
        let retryFlag = 0;
        let formTransactionId = 0;
        let dataTypeId = 0;
        let formId = 0;
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;

        entityText3 = (request.hasOwnProperty('activity_timeline_title')) ? request.activity_timeline_title : "";

        if (request.hasOwnProperty('activity_type_category_id')) {
            let activityTypeCategoryId = Number(request.activity_type_category_id);
            if (activityTypeCategoryId === 4) {
                if (request.hasOwnProperty('activity_inline_data')) {
                    let inlineJson = JSON.parse(request.activity_inline_data);
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


        if (Object.keys(participantData).length > 0) {
            organizationId = participantData.organization_id;
            accountId = participantData.account_id;
            workforceId = participantData.workforce_id;
            assetId = participantData.asset_id;
            messageUniqueId = participantData.message_unique_id;
        }

        switch (streamTypeId) {
            case 4: // activity updated
                entityTypeId = 0;
                entityText1 = "activity updated";
                entityText2 = request.activity_inline_data;
                break;
            case 207: // Contact card has been clipped to a Document
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 309: // activity cover altered
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_cover_collection;
                break;
            case 310: // text message     --> File
            case 607: // text message     --> Customer Request
            case 1307: // text message    --> Visitor Request
            case 1507: // text message    --> Time Card
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                break;
            case 311: // image    --> file
            case 608: // image    --> Customer Request
            case 1308: // image    --> Visitor Request
            case 1508: // image   --> Time Card
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 313: // form
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                entityText2 = request.activity_timeline_collection;
                break;
            case 704: // form: status alter
            case 711: //alered the due date
            case 734: //alered the due date
                entityTypeId = 0;
                entityText1 = request.from_date;
                entityText2 = request.to_date;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 717: // Workflow: Percentage alter
                entityTypeId = 0;
                entityText2 = request.activity_timeline_collection;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 705: // form
            case 728: // Report form BC
case 729: // Report form BC Edit
            case 713:
            case 714:
            case 715:
            case 716:
            case 726:
                entityTypeId = 0;
                entityText1 = request.form_transaction_id;
                // entityText2 = request.activity_timeline_collection;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                formTransactionId = request.form_transaction_id;
                formId = request.form_id;
                dataTypeId = 37; //static for all form submissions
                break;
            case 710: // form field alter
                entityTypeId = 0;
                //entityText2 = request.activity_timeline_collection;
                activityTimelineCollection = request.activity_timeline_collection || '{}';
                break;
            case 314: // cloud based document -- file
            case 610: // cloud based document -- Customer Request
            case 709: // cloud based document -- Form
            case 1310: // cloud based document -- Visitor Request
            case 1408: // cloud based document -- Project
            case 1510: // cloud based document -- Time Card
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 315: // clip mail to task
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 316: // clip notepad
                entityTypeId = 0;
                entityText1 = request.activity_timeline_collection;
                entityText2 = '';
                break;
            case 320: // Add video call communication
            case 321: // Add phone call communication
            case 322: // Add mobile call communication
                entityTypeId = 0;
                entityText1 = request.activity_timeline_url;
                entityText2 = (request.hasOwnProperty('activity_timeline_url_preview')) ? request.activity_timeline_url_preview : '';
                break;
            case 323: // Add message communication
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                break;
            case 325: // Add Participant Collection for taskList BETA
            case 114: // IIT JAMMU ID CARD
            case 115: // IIT JAMMU ID CARD
            case 116: // IIT JAMMU ID CARD
            case 723:
            case 724:
            case 26004: // [Widget] Comment Added on Widget
                activityTimelineCollection = request.activity_timeline_collection;
                entityText1 = "";
                entityText2 = request.activity_timeline_text;
                request.entity_tinyint_2 = request.attachment_type_id || 0;
                break;
            default:
                entityTypeId = 0;
                entityText1 = "";
                entityText2 = "";
                break;
        }

        const paramsArr = new Array(
            request.activity_id || 0,
            assetId,
            workforceId,
            accountId,
            organizationId,
            streamTypeId,
            entityTypeId, // entity type id
            request.entity_datetime_1 || '1970-01-01 00:00:00', // entity type id
            request.entity_datetime_2 || '1970-01-01 00:00:00', // entity type id
            entityText1, // entity text 1
            entityText2, // entity text 2
            entityText3, //Beta
            activityTimelineCollection, //BETA
            request.track_latitude,
            request.track_longitude,
            request.entity_tinyint_1 || 0,
            request.entity_tinyint_2 || 0,
            request.entity_bigint_1 || 0,
            request.entity_bigint_2 || 0,
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
            request.log_asset_id || request.asset_id,
            messageUniqueId,
            retryFlag,
            request.flag_offline || 0,
            request.track_gps_datetime,
            request.datetime_log,
            request.data_activity_id || 0
        );
        const queryString = util.getQueryString("ds_v1_3_asset_timeline_transaction_insert", paramsArr);
        if (assetId === 0 || assetId === null) {
            error = false;
            responseData = [];
        }
        else {
            if (queryString != '') {
                await db.executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                        logger.info(`[${request.log_uuid || ""}] asset_timeline_insert_sucess`);
                    })
                    .catch((err) => {
                        //error = true;                
                        logger.error(`[${request.log_uuid || ""}] errorinaddindassettimelineentry`, { type: 'add_activity', error: serializeError(err) });
                    });
            }
        }
        return [error, responseData];
    };


    // Update the last updated and differential datetime for an asset.
    // This is currently being used by the telephone module to update the same
    // for the sender's asset_id
    this.activityAssetMappingUpdateLastUpdateDateTimeOnlyAsync = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.asset_id,
            request.organization_id,
            util.getCurrentUTCTime() // request.track_gps_datetime
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_last_update_dt_only', paramsArr);
        if (queryString !== '') {            
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    //error = true;
                });
        }

        return [error, responseData];
    };

this.updateActivityLogDiffDatetimeAsync = async (request, assetId) => {
    let responseData = [],
        error = true;

    if (assetId > 0) {
        // update log differential datetime for only the asset id
        let [err, data] = await updateActivityLogDiffDatetimeAssetAsync(request, assetId);
        if(!err){
            error = false;
        }
    } else {
        //update log differential date time for all participants of activity
        let data = await this.getAllParticipantsPromise(request);
        error = false;
        let i;
        for(i=0; i<data.length; i++) {
            await updateActivityLogDiffDatetimeAssetAsync(request, data[i].asset_id);
        }
    }

    return [error, responseData];
};

async function updateActivityLogDiffDatetimeAssetAsync(request, assetId){
    let responseData = [],
        error = true;

    const paramsArr = new Array(
        request.activity_id,
        assetId,
        request.organization_id,
        request.datetime_log
    );
    
    const queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_differential', paramsArr);
    
    if (queryString != '') {
        await db.executeQueryPromise(0, queryString, request)
            .then((data) => {
                responseData = data;
                error = false;
            })
            .catch((err) => {
                logger.error(`[${request.log_uuid || ""}] updateActivityLogDiffDatetimeAssetAsync`, { type: 'add_activity', error: serializeError(err) });
            });
    }

    return [error, responseData];
}

async function updateAssetsLogDatetimeAsync(request, assetData) {
    let i;
    for(i=0; i<assetData.length; i++) {
        let assetCollection = {
            asset_id: assetData[i].asset_id,
            workforce_id: assetData[i].project_id,
            account_id: assetData[i].account_id,
            organization_id: assetData[i].organization_id
        };

        let [err, data] = await updateActivityLogLastUpdatedDatetimeAssetAsync(request, assetCollection);
        if(err) {
            //global.logger.write('conLog', err, err, {});
            util.logError(request,`updateActivityLogLastUpdatedDatetimeAssetAsync error %j`, { err,request});
        }
    }
}

this.updateActivityLogLastUpdatedDatetimeAsync = async (request, assetId) =>{
    if (assetId > 0) {
        let [err, data] = await this.getAllParticipantsExceptAssetAsync(request, assetId);
            if (!err) {
                updateAssetsLogDatetimeAsync(request, data);
            }
    } else {
        let data = this.getAllParticipantsPromise(request);
        updateAssetsLogDatetimeAsync(request, data);
    }
};

this.getAllParticipantsExceptAssetAsync = async (request, assetId) => {
    let responseData = [],
        error = true;

    const paramsArr = new Array(
        request.activity_id,
        assetId,
        request.organization_id,
        request.account_id,
        request.workforce_id,
        0,
        50
    );
    
    const queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_other_participants', paramsArr);
    

    if (queryString != '') {
        await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    //error = true;
                    console.log("Error in function 'getAllParticipantsExceptAssetAsync' : ", err);
                });
    }

    return [error, responseData];
};

async function updateActivityLogLastUpdatedDatetimeAssetAsync(request, assetCollection) {
    let responseData = [],
        error = true;

    const paramsArr = new Array(
        request.activity_id,
        assetCollection.asset_id,
        assetCollection.organization_id,
        request.datetime_log
    );

    let queryString = '';
    if ((request.activity_status_type_id == 74 && request.activity_type_category_id == 28) ||
        (request.activity_status_type_id == 37 && request.activity_type_category_id == 14) ||
        (request.activity_status_type_id == 41 && request.activity_type_category_id == 15)) {
        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_updated_dt_unrd_reset', paramsArr);
    } else {
        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_last_updated_datetime', paramsArr);
    }

    //global.logger.write('conLog', "Calling updateActivityLogLastUpdatedDatetimeAssetAsync", {}, request);
    util.logInfo(request, `conLog Calling updateActivityLogLastUpdatedDatetimeAssetAsync %j`, { request });
    //global.logger.write('conLog', queryString, {}, request);
    util.logInfo(request, `updateActivityLogLastUpdatedDatetimeAssetAsync %j`, { queryString, request });

    if (queryString != '') {
        await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    //error = true;
                    console.log("Error in function 'updateActivityLogLastUpdatedDatetimeAssetAsync' : ", err);
                });
    }

    return [error, responseData];
}

    //Get the asset_type_id(ROLE) for a given status_id - RM
    this.getAssetTypeIDForAStatusID = async (request, activityStatusId) => {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            activityStatusId
        );
        let queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select_id', paramsArr);
        if (queryString != '') {
            //return await db.executeQueryPromise(1, queryString, request);
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
    
    //Get the asset for a given asset_type_id(ROLE) - RM
    this.getAssetForAssetTypeID = async (request) =>{
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.asset_type_id,
            request.organization_id
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_role_participant', paramsArr);

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

    //Get the workload of lead asset
    //IF p_flag = -1 THEN RETURNS efficiency (Summation of expected durations - Summation of elapsed durations)
    //IF p_flag = 0 THEN RETURNS COUNT of OPEN workflows which are lead by the owner in the given duration
    //IF p_flag = 1 THEN RETURNS LIST of OPEN workflows which are lead by the owner in the given duration
    this.getLeadAssetWorkload = async (request) =>{
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,            
            request.asset_id,
            request.flag || 0,
            request.start_datetime, //Monday
            request.end_datetime, //Sunday
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_activity_list_select_asset_lead_tasks', paramsArr);

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

    this.activityLeadUpdate = async function (request, participantData, isAlterStatus) {

        self.getActivityDetailsPromise(request, request.activity_id).then(async (data) => {
            console.log("getActivityDetailsPromise :: ", data);
            let participantCheck = false;

            request.flag = -1;
            request.start_datetime = '1970-01-01 00:00:00';
            request.end_datetime = '2049-12-31 18:30:00';
            request.monthly_summary_id = 5;
            request.timeline_stream_type_id = 718;
            let assetID = 0;

            let leadRequest = Object.assign({}, request);
            leadRequest.asset_id = data[0].activity_lead_asset_id ? data[0].activity_lead_asset_id : 0;
            console.log("participantData :: ", JSON.stringify(participantData, null, 2));
            if (isAlterStatus) {

                let newReq = Object.assign({}, request);
                //Need to get the asset(Role) -- Mapped to that status
                let [err, roleData] = await self.getAssetTypeIDForAStatusID(request, newReq.activity_status_id);
                console.log('getAssetTypeIDForAStatusID : 1 ', roleData);
                newReq.asset_type_id = (!err && roleData.length > 0) ? roleData[0].asset_type_id : 0;
                console.log('getAssetTypeIDForAStatusID : 2 ', roleData[0].asset_type_id);

                let [err1, assetData] = await self.getAssetForAssetTypeID(newReq);
                console.log('getAssetForAssetTypeID : 3', assetData);
                assetID = (!err1 && assetData.length > 0) ? assetData[0].asset_id : 0;
                console.log('getAssetForAssetTypeID : ASSET ID', assetID);

            } else if (leadRequest.asset_id === 0 || leadRequest.asset_id === null) {
                //lead doesn't exists
                let newReq = Object.assign({}, request);
                //Need to get the asset(Role) -- Mapped to that status
                let [err, roleData] = await self.getAssetTypeIDForAStatusID(request, data[0].activity_status_id);
                console.log('getAssetTypeIDForAStatusID : 4 ', roleData);
                newReq.asset_type_id = (!err && roleData.length > 0) ? roleData[0].asset_type_id : 0;
                console.log('getAssetTypeIDForAStatusID : 5 ', roleData[0].asset_type_id);

                let [err1, assetData] = await self.getAssetForAssetTypeID(newReq);
                console.log('getAssetForAssetTypeID : 6', assetData);
                assetID = (!err1 && assetData.length > 0) ? assetData[0].asset_id : 0;
                console.log('getAssetForAssetTypeID : ASSET ID', assetID);
                participantCheck = true;
            } else if (participantData.asset_type_id === data[0].activity_lead_asset_type_id) {
                //lead exists                       
                participantCheck = true;
                assetID = participantData.asset_id;
                console.log('new Participant from Request : ASSET ID', assetID);
                if (participantData.asset_id !== data[0].activity_lead_asset_id) {
                    console.log("Existing lead data into status change transaction");
                }
            } else if (participantData.asset_type_id !== data[0].activity_lead_asset_type_id) {
                //lead doesn't exists
                let newReq = Object.assign({}, request);
                //Need to get the asset(Role) -- Mapped to that status
                let [err, roleData] = await self.getAssetTypeIDForAStatusID(request, data[0].activity_status_id);
                console.log('getAssetTypeIDForAStatusID : 7 ', roleData);
                if (roleData[0].asset_type_id !== data[0].activity_lead_asset_type_id) {

                    newReq.asset_type_id = (!err && roleData.length > 0) ? roleData[0].asset_type_id : 0;
                    console.log('getAssetTypeIDForAStatusID : 8 ', roleData[0].asset_type_id);

                    let [err1, assetData] = await self.getAssetForAssetTypeID(newReq);
                    console.log('getAssetForAssetTypeID : 9', assetData);
                    assetID = (!err1 && assetData.length > 0) ? assetData[0].asset_id : 0;
                    console.log('getAssetForAssetTypeID : ASSET ID', assetID);
                    participantCheck = true;
                } else {
                    participantCheck = false;
                }
            }

            if (participantCheck || isAlterStatus) {

                let self = this;

               await self.activityListLeadUpdate(request, assetID);

               //self.calculateAssetSummary(request, leadRequest, data);

            /*    let [err3, exisitngAssetData] = await self.getLeadAssetWorkload(leadRequest);
                console.log("exisitngAssetData :: ", exisitngAssetData);
                let existingAssetWorkLoad = (Number(exisitngAssetData[0].expected_duration)*60) - Number(exisitngAssetData[0].actual_duration);
                leadRequest.entity_decimal_1 = exisitngAssetData[0].expected_duration;
                leadRequest.entity_decimal_2 = Number(exisitngAssetData[0].actual_duration)/60;
                leadRequest.entity_decimal_3 = Number(existingAssetWorkLoad);

                console.log('After activityListLeadUpdate : ', leadRequest);
                leadRequest.asset_id = data[0].activity_lead_asset_id;
                await self.assetSummaryTransactionInsert(leadRequest);
                console.log('After assetSummaryTransactionInsert : ');

                leadRequest.asset_id = assetID;

                let [err2, newAssetData] = await self.getLeadAssetWorkload(leadRequest);
                console.log("newAssetData[0].query_status ", newAssetData[0].query_status)
                let newAssetWorkload = (Number(newAssetData[0].expected_duration)*60) - Number(newAssetData[0].actual_duration);
                leadRequest.entity_decimal_1 = newAssetData[0].expected_duration;
                leadRequest.entity_decimal_2 = Number(newAssetData[0].actual_duration)/60;
                leadRequest.entity_decimal_3 = Number(newAssetWorkload);

                console.log("Expected Duration :: ", newAssetData[0].expected_duration);
                console.log("Actual Duration :: ", newAssetData[0].actual_duration);
                console.log("newAssetEfficiency :: ", newAssetWorkload);

                leadRequest.asset_id = assetID;
                await self.assetSummaryTransactionInsert(leadRequest);

                console.log("existingAssetEfficiency ", existingAssetWorkLoad);
                console.log("newAssetEfficiency ", newAssetWorkload); */
            }
        });
    };

    this.activityListHistoryInsertAsync = async (request, updateTypeId) => {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            updateTypeId,
            request.datetime_log // server log date time
        );

        const queryString = util.getQueryString('ds_v1_activity_list_history_insert', paramsArr);
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


    this.assetActivityListHistoryInsertAsync = async (request, assetId, updateTypeId) => {
        let responseData = [],
            error = true;

        if (assetId === 0) {
            assetId = request.asset_id;
        }

        let paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            assetId,
            updateTypeId,
            request.datetime_log // server log date time
        );

        const queryString = util.getQueryString('ds_v1_activity_asset_mapping_history_insert', paramsArr);
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

    this.getAppName = async (request, appID) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            (appID).toString()
        );

        const queryString = util.getQueryString('ds_v1_common_app_master_select_id', paramsArr);
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
    };

    this.updateCustomerOnWorkflowAsync = async function (request, requestFormData) {
        let self = this;
        forEachAsync(requestFormData, function (next, fieldObj) {
            if (fieldObj.field_data_type_id == 59) {
                let assetReference = fieldObj.field_value.split('|');
                if (assetReference.length > 1) {
                    request['customer_asset_id'] = assetReference[0];
                    self.updateCustomerOnWorkflow(request);
                } else {
                    util.logError(request,`CUSTOMER REFERENCE VALUE IS IMPROPER ${fieldObj.field_value}`, { type: 'update_customer_workflow' });
                }
                next();
            } else {
                next();
            }

        }).then(() => {
        });
    };

    this.updateCustomerOnWorkflow = async (request) => {

        try{
            let paramsArr = new Array(                
                request.organization_id, 
                request.activity_id, 
                request.customer_asset_id,
                request.asset_id,
                util.getCurrentUTCTime()
            );
            let queryString = util.getQueryString('ds_v1_activity_list_update_customer', paramsArr);
           // let queryStringMapping = util.getQueryString('ds_v1_activity_asset_mapping_update_status_due_date', paramsArr);
            if (queryString != '') {
                             //(db.executeQueryPromise(0, queryStringMapping, request));
                return await (db.executeQueryPromise(0, queryString, request));
                                
            }
        }catch(err){
            console.log('Error '+err);
        }
    };

    this.sendPushToAsset = async function(request){
        if(request.hasOwnProperty("target_asset_id")){
            util.sendPushToAsset(request);
        }

        return "";
    }

    this.sendPushToWorkforceAssets = async function(request){

        if(request.hasOwnProperty("target_workforce_id")){
            util.sendPushToWorkforce(request); //pubnub
        }

       let [error, responseData] = await self.getLinkedAssetsInWorkforce(request);

        if(responseData.length > 0){
            for(let i = 0; i < responseData.length; i++){
                request.target_asset_id = responseData[i].asset_id;
                request.asset_push_arn = responseData[i].asset_push_arn;
                util.sendPushToAsset(request);
            }
        }

        return "";
    }

    this.getLinkedAssetsInWorkforce = async function(request) {
        let error = false,
            responseData = [];
        try{
            let paramsArr = new Array(                
                request.organization_id, 
                request.account_id, 
                request.target_workforce_id,
                0,
                500
            );
            let queryString = util.getQueryString('ds_v1_asset_list_select_linked_workforce', paramsArr);
           
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
        }catch(err){
            console.log('Error '+err);
        }

        return [error, responseData];   
    };

    this.getLinkedAssetsInWorkforceV1 = async function(request) {
        let error = false,
            responseData = [];
        try{
            let paramsArr = new Array(                
                request.organization_id, 
                request.account_id, 
                request.target_workforce_id,
                request.page_start,
                request.page_limit
            );
            let queryString = util.getQueryString('ds_v1_1_asset_list_select_linked_workforce', paramsArr);
           
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
        }catch(err){
            console.log('Error '+err);
        }

        return [error, responseData];   
    };

    this.activityActivityMappingInsert = async (request) => {
        let error = true,
        responseData = [];
        
        const paramsArr = new Array(                
                        request.activity_id, 
                        request.parent_activity_id, 
                        request.organization_id,
                        request.activity_flag_is_prerequisite || 0,
                        request.message_unique_id,
                        request.asset_id,
                        request.datetime_log
                    );
        const queryString = util.getQueryString('ds_p1_1_activity_activity_mapping_insert', paramsArr);           
        if (queryString != '') {
                await db.executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                        this.activityActivityMappingHistoryInsert(request);
                    })
                    .catch((err) => {
                        error = err;
                    });                 
            }
        return [error, responseData];   
    };


    this.activityActivityMappingHistoryInsert = async (request) => {
        let error = true,
        responseData = [];
        
        const paramsArr = new Array(                
                        request.activity_id, 
                        request.parent_activity_id, 
                        request.organization_id,                        
                        request.asset_id,
                        request.datetime_log
                    );
        const queryString = util.getQueryString('ds_p1_activity_activity_mapping_history_insert', paramsArr);           
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


    this.makeGenericRequest = async function(request){

        const genericAsync = nodeUtil.promisify(makingRequest.post);
        //console.log("assignRequest :: ",JSON.stringify(assignRequest, null,2));
        const makeRequestOptions = {
            form: request
        };
        try {
             //console.log("makeRequestOptions1 :: ",JSON.stringify(makeRequestOptions1, null,2));
            // global.config.mobileBaseUrl + global.config.version
            const response = await genericAsync(global.config.mobileBaseUrl + global.config.version + request.generic_url, makeRequestOptions);
            const body = JSON.parse(response.body);
            util.logInfo(request,`makeGenericRequest ${request.generic_url} %j`, body);
            if (Number(body.status) === 200) {
                return [false, {}];
            }else{
                return [true, {}];
            }
        } catch (error) {
            util.logError(request,`makeGenericRequest ${request.generic_url}`, { type: 'makeGenericRequest', error: serializeError(error) });
            return [true, {}];
        } 
    };
    
    this.updateMentionsCnt = async (request, assetID) => {
        let responseData = [],
            error = true;
    
        const paramsArr = new Array(
            request.activity_id,
            assetID,
            request.organization_id
        );
        const queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_mention_count', paramsArr);
    
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
    
    this.getMappedBotSteps = async (request, flag) => {
        //flag = 0 = ALL bots
        //flag = 1 = Only Field based bots
        //flag = 2 = ONly Form Based bots
        //flag = 3 = ONly sepecific Form Based bots to be triggered in field edit
        
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.bot_id,
            flag,
            request.form_id,
            request.field_id,
            request.start_from || 0,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_1_bot_operation_mapping_select_form', paramsArr);

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


    this.getStatusesOfaWorkflow = async (request) => {
        let responseData = [],
            error = true;

        //flag = 1 - Only parent statuses
        //flag = 2 - Both parent and substatus        
        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id || 48,
            request.activity_type_id || request.workflow_activity_type_id,
            request.flag || 1,
            request.datetime_log || util.getCurrentUTCTime(),
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit)
        );

        let queryString = util.getQueryString('ds_p1_1_workforce_activity_status_mapping_select', paramsArr);
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


    this.activityActivityMappingSelect = async (request) => {
        let error = true,
        responseData = [];
        
        const paramsArr = new Array(                
                        request.activity_id, 
                        request.parent_activity_id, 
                        request.organization_id,
                        request.flag || 1,
                        request.start_from || 0,
                        request.limit_value || 5
                        
                    );
        const queryString = util.getQueryString('ds_p1_activity_activity_mapping_select', paramsArr);
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
    };

    this.activityActivityMappingInsertV1 = async (request, referredActivityID) => {
        let error = true,
        responseData = [];
        
        const paramsArr = new Array(                
                        request.activity_id, 
                        referredActivityID, 
                        request.organization_id,
                        request.activity_flag_is_prerequisite || 0,
                        request.message_unique_id,
                        request.asset_id,
                        request.datetime_log
                    );
        const queryString = util.getQueryString('ds_p1_1_activity_activity_mapping_insert', paramsArr);           
        if (queryString != '') {
                await db.executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                        request.parent_activity_id = referredActivityID;
                        this.activityActivityMappingHistoryInsert(request);
                    })
                    .catch((err) => {
                        error = err;
                    });
            if(error.code == "ER_DUP_ENTRY") {
                request.log_state = 2;
                error = false;
                [error, responseData] = await this.activityActivityMappingArchive(request, referredActivityID);
            }
        }
        return [error, responseData];   
    };


    this.getFormWorkflowDetailsAsync = async (request) => {
        let error = true,
        responseData = [];        
        let paramsArr;
        paramsArr = new Array(
            request.activity_id,
            request.organization_id
        );
        const queryString = util.getQueryString('ds_v1_activity_list_select_form_workflow', paramsArr);
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
    };


    this.activityActivityMappingArchive = async (request, referrencedActivityID) => {
        let error = true,
        responseData = [];        
        
        let paramsArr = new Array(
            request.activity_id,
            referrencedActivityID,
            request.organization_id,
            request.log_state || 3,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_activity_activity_mapping_update_log_state', paramsArr);
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

    this.activityReminderTxnInsert = async (request, reminderTypeID, reminderDateTime) => {
        let error = true,
            responseData = [];        
        
        //console.log('request.inline_data in activityReminderTxnInsert: ', request.inline_data);
        const paramsArr = new Array(
                            request.organization_id,
                            request.workflow_activity_id,
                            request.asset_id,
                            reminderTypeID,
                            request.inline_data || '{}',
                            reminderDateTime,
                            request.status_id,
                            util.getCurrentUTCTime()
                        );
        const queryString = util.getQueryString('ds_p1_activity_reminder_transaction_insert', paramsArr);
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


    this.activityReminderTxnUpdate = async (request) => {
        let error = true,
        responseData = [];        
        
        const paramsArr = new Array(
                            request.reminder_trx_id,
                            request.workflow_activity_id,
                            request.organization_id,                            
                            request.status_id,
                            util.getCurrentUTCTime()
                        );
        const queryString = util.getQueryString('ds_p1_activity_reminder_transaction_update_reminder_status', paramsArr);
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

    
    this.activityReminderTxnSelect = async (request) => {
        let error = true,
            responseData = [];        
        
        const paramsArr = new Array(
                            request.workflow_activity_id,
                            request.organization_id,
                            request.start_datetime,
                            request.end_datetime,
                            request.flag,
                            request.start_from || 0,
                            request.limit_value
                        );
        const queryString = util.getQueryString('ds_p1_activity_reminder_transaction_select', paramsArr);
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
    };

    this.workforceFormFieldMappingSelect = async (request) => {        
        let formFieldMappingData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id,
            request.field_id,
            request.start_from,
            util.replaceQueryLimit(request.limit_value)
        );
        const queryString = util.getQueryString('ds_p1_1_workforce_form_field_mapping_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    formFieldMappingData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, formFieldMappingData];
    };

    this.updateAssetWorkLocation = async function (request) {
         let responseData = [],
            error = true;

            let paramsArr = new Array(
            request.asset_id,            
            request.organization_id,
            request.track_latitude,
            request.track_longitude,
            request.track_gps_location,
            request.asset_id,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_v1_2_asset_list_update_work_location', paramsArr);
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
    

    this.workbookTrxInsert = async (request) => {
        let responseData = [],
           error = true;

       const paramsArr = new Array(
            request.activity_workbook_transaction_datetime || util.getCurrentUTCTime(),
            request.activity_workbook_template_url || '',
            request.activity_product_selection,
            request.activity_id,
            request.activity_cuid_1 || '',
            request.activity_cuid_2 || '',
            request.activity_cuid_3 || '',
            request.activity_type_id,
            request.activity_type_category_id,
            util.getCurrentUTCTime(),
            request.asset_id           
       );
       const queryString = util.getQueryString('ds_v1_activity_workbook_transaction_insert', paramsArr);
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


   this.workbookTrxUpdate = async (request) => {
        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.activity_workbook_transaction_id,
            request.flag_generated,
            request.url,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_activity_workbook_transaction_update', paramsArr);
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

    this.activityUpdateExpression  = async function (request) {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
          request.activity_id,
          request.expression,
          request.organization_id,
          request.asset_id,
          util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('ds_p1_activity_list_update_title_expression', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
              .then((data)=>{
                responseData = data;
            error = false;
        })
        .catch((err)=>{
            util.logError(request,`activityUpdateExpression`, { type: 'activityUpdateExpression', error: serializeError(err) });
            error = err;
        });
        }
        return [error, responseData];
    };

    this.setAtivityOwnerFlag = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
          request.activity_id,
          request.target_asset_id,
          request.organization_id,
          request.owner_flag || 0,
          request.asset_id,
          util.getCurrentUTCTime()
        );

        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_owner_flag',paramsArr);
        if(queryString !== '') {
            try {
                const data = await db.executeQueryPromise(0,queryString,request);
                await botService.callAddTimelineEntry(request);
                responseData = data;
                error = false;
            } catch(e) {
                error = e;
            }
        }
        return [error,responseData];
    }

    this.getFormDetails = async (request) => {        
        let paramsArr = new Array(            
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id
        );

        let queryString = util.getQueryString('ds_v1_workforce_form_mapping_select', paramsArr);
       
        if (queryString != '') {                
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };    

    this.actAssetSearchMappingInsert = async request => {
        let responseData = [],
            error = true;

        const paramsArr = [
                            request.activity_id,
                            request.asset_id,
                            request.organization_id                            
                          ];
        const queryString = util.getQueryString('ds_v1_activity_asset_search_mapping_insert', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                   let [addToElasticErr,addToElasticData] = await this.insertAssetMappingsinElastic(request);
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    };


    this.actAssetSearchMappingUpdate = async request => {
        //p_flag = 0, Update Activity Details
        //p_flag = 1, Update Access
        //p_flag = 2, Update Owner Flag
        let responseData = [],
        error = true;
        util.logInfo(request,"actAssetSearchMappingUpdate :Setting timeout for 10 sec to bots to complete exectuion")
        setTimeout(async ()=>{
       

        const paramsArr = [
                            request.activity_id,
                            0,
                            request.organization_id,
                            //request.flag || 0,
                            //request.asset_participant_access_id || 0,
                            //request.asset_flag_is_owner || 0
                          ];
        const queryString = util.getQueryString('ds_v1_activity_asset_search_mapping_update', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                    let [addToElasticErr,addToElasticData] = await this.insertManyAssetMappingsinElastic(request);
                    let [addToActElasticErr,addToActElasticData] = await this.insertActivityMappingsinElastic(request);
                })
                .catch((err) => {
                    error = err;
                });
        }
    },20000)
        return [error, responseData];
    };

    
    this.actAssetSearchMappingArchive = async request => {
        let responseData = [],
            error = true;

        const paramsArr = [
                            request.activity_id,
                            request.asset_id,
                            request.organization_id                            
                          ];
        const queryString = util.getQueryString('ds_v1_activity_asset_search_mapping_delete', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    client.deleteByQuery({
                        index:global.config.elasticActivityAssetTable,
                        "body": {
                            "query": {
                                bool: {
                                    must: [
                                      {
                                        match: {
                                          activity_id:Number(request.activity_id)
                                        }
                                      },
                                      {
                                        match: {
                                          asset_id:Number(request.asset_id)
                                        }
                                      }
                                    ],
                            
                                }
                            }
                        }
                    })
                    // client.delete({
                    //     index:'activity_search_mapping',
                    //     activity_id:Number(request.activity_id)
                    // })
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    };

    this.insertAssetMappingsinElastic=async function (request){
        let responseData = [],
        error = true;

    const paramsArr = [
                        request.activity_id,
                        request.asset_id,
                        1                           
                      ];
    
    const queryString = util.getQueryString('ds_p1_activity_asset_search_mapping_select', paramsArr);
    // console.log(queryString)
    if (queryString !== '') {
        await db.executeQueryPromise(1, queryString, request)
            .then(async (data) => {
                responseData = data;
                // console.log(data)
                if(data.length>0){
                let dataTobeSent = responseData[0];
                   let resultData = await client.search({
                index: global.config.elasticActivityAssetTable,
                body: {
                    query: {
                        bool: {
                            must: [
                              {
                                match: {
                                  activity_id:Number(request.activity_id)
                                }
                              },
                              {
                                match: {
                                  asset_id:Number(request.asset_id)
                                }
                              }
                            ],
                    
                        }
                    }
                }
            });
            // console.log(resultData.hits.hits);
            // return
            if(resultData.hits.hits.length>0){
             let previousData = resultData.hits.hits[0]._source;
             let dataToBeUpdated = {...previousData,...dataTobeSent};
            //  dataToBeUpdated.operating_asset_first_name = "esha"
            util.logInfo(request,"insertActivityAssetMappingsinElastic : Updating existing value to : " + JSON.stringify(dataToBeUpdated))

            //  client.updateByQuery({
            //     index: global.config.elasticActivityAssetTable,
            //     "body": {
            //         "query": {
            //             bool: {
            //                 must: [
            //                   {
            //                     match: {
            //                       activity_id:Number(request.activity_id)
            //                     }
            //                   },
            //                   {
            //                     match: {
            //                       asset_id:Number(request.asset_id)
            //                     }
            //                   }
            //                 ],
                    
            //             }
            //         },
            //         "script": {
            //             "source": "ctx._source = params",
            //             "lang": "painless",
            //             "params": {...dataToBeUpdated
            //             }
            //         }
            //     },
            //     conflicts: 'proceed'
            //  }, function (err, res) {
            //      let stackTrace = util.getStackTrace();
            //      util.handleElasticSearchResponse(request, dataToBeUpdated, global.config.elasticActivityAssetTable, err, res, stackTrace);
            //  });

                let queryData = {
                    index: global.config.elasticActivityAssetTable,
                    "body": {
                        "query": {
                            bool: {
                                must: [
                                    {
                                        match: {
                                            activity_id: Number(request.activity_id)
                                        }
                                    },
                                    {
                                        match: {
                                            asset_id: Number(request.asset_id)
                                        }
                                    }
                                ],

                            }
                        },
                        "script": {
                            "source": "ctx._source = params",
                            "lang": "painless",
                            "params": {
                                ...dataToBeUpdated
                            }
                        }
                    },
                    conflicts: 'proceed'
                };
                let stackTrace = util.getStackTrace();
                await util.handleElasticSearchEntries(request, "update", queryData, global.config.elasticActivityAssetTable, stackTrace);


            }
            else{
                util.logInfo(request,"insertActivityAssetMappingsinElastic : Inserting new value to : " + JSON.stringify(dataTobeSent))
                // client.index({
                //     index: global.config.elasticActivityAssetTable,
                //     body: {
                //         ...dataTobeSent
                //     }
                // }, function (err, res) {
                //     util.handleElasticSearchResponse(request, dataTobeSent, global.config.elasticActivityAssetTable, err, res);
                // })

                let queryData = {
                    index: global.config.elasticActivityAssetTable,
                    body: {
                        ...dataTobeSent
                    }
                };

                let stackTrace = util.getStackTrace();
                await util.handleElasticSearchEntries(request, "insert", queryData, global.config.elasticActivityAssetTable, stackTrace);

            }
            }
                error = false;
            })
            .catch((err) => {
                error = err;
            });
    }

    return [error, responseData];
    }
    
    this.insertManyAssetMappingsinElastic = async function (request) {
        let responseData = [],
            error = true;
        util.logInfo(request, "insertManyAssetMappingsinElastic : ---Entered----")
        const paramsArr = [
            request.activity_id,
            request.asset_id,
            1
        ];
        const queryString = util.getQueryString('ds_p1_activity_asset_search_mapping_select', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    if (data.length > 0) {
                        let dataTobeSent = responseData[0];
                        let resultData = await client.search({
                            index: global.config.elasticActivityAssetTable,
                            body: {
                                query: {
                                    bool: {
                                        must: [
                                            {
                                                match: {
                                                    activity_id: Number(request.activity_id)
                                                }
                                            },
                                            {
                                                match: {
                                                    asset_id: Number(request.asset_id)
                                                }
                                            }
                                        ],

                                    }
                                }
                            }
                        });
                        // console.log(resultData.hits.hits);
                        // return;
                        for (let i = 0; i < resultData.hits.hits.length; i++) {
                            util.logInfo(request, "insertManyAssetMappingsinElastic : Updatting existing value to : " + JSON.stringify(dataTobeSent))
                            // console.log("came inside",resultData.hits.hits[i],i);

                            //  let dd ={ activity_title: 'FR01621483',
                            //  activity_cuid_1: null,
                            //  activity_cuid_2: null,
                            //  activity_cuid_3: null,
                            //  activity_status_id: 282557,
                            //  activity_status_type_id: 155,
                            //  activity_type_id: 134562,
                            //  activity_type_name: 'New FLD - MPLS CAF',
                            //  activity_type_category_id: 48,
                            //  activity_type_tag_id: 1,
                            //  tag_type_id: 8,
                            //  organization_id: 868,
                            //  asset_id: 33240,
                            //  asset_first_name: 'Account Manager',
                            //  operating_asset_first_name: 'Esha Pant',
                            //  activity_creator_asset_id: 33240,
                            //  activity_creator_asset_first_name: 'Account Manager',
                            //  activity_creator_operating_asset_first_name: 'Esha Pant',
                            //  asset_participant_access_id: 21,
                            //  asset_flag_is_owner: 1,
                            //  log_state: 2,
                            //  log_active: 1}
                            //  console.log(dataToBeUpdated)

                            // await client.updateByQuery({
                            //     index: global.config.elasticActivityAssetTable,
                            //     "body": {
                            //         "query": {
                            //             bool: {
                            //                 must: [
                            //                     {
                            //                         match: {
                            //                             activity_id: Number(request.activity_id)
                            //                         }
                            //                     },
                            //                     {
                            //                         match: {
                            //                             asset_id: Number(request.asset_id)
                            //                         }
                            //                     }
                            //                 ],

                            //             }
                            //         },
                            //         "script": {
                            //             "source": "ctx._source = params",
                            //             "lang": "painless",
                            //             "params": {
                            //                 ...dataTobeSent
                            //             }
                            //         }
                            //     },
                            //     conflicts: 'proceed'
                            // }, function (err, res) {
                            //     let stackTrace = util.getStackTrace();
                            //     util.handleElasticSearchResponse(request, dataTobeSent, global.config.elasticActivityAssetTable, err, res, stackTrace);
                            // });

                            let queryData = {
                                index: global.config.elasticActivityAssetTable,
                                "body": {
                                    "query": {
                                        bool: {
                                            must: [
                                                {
                                                    match: {
                                                        activity_id: Number(request.activity_id)
                                                    }
                                                },
                                                {
                                                    match: {
                                                        asset_id: Number(request.asset_id)
                                                    }
                                                }
                                            ],

                                        }
                                    },
                                    "script": {
                                        "source": "ctx._source = params",
                                        "lang": "painless",
                                        "params": {
                                            ...dataTobeSent
                                        }
                                    }
                                },
                                conflicts: 'proceed'
                            };

                            let stackTrace = util.getStackTrace();
                            await util.handleElasticSearchEntries(request, "update", queryData, global.config.elasticActivityAssetTable, stackTrace);

                            
                        }

                        if (resultData.hits.hits.length == 0) {
                            util.logInfo(request, "insertManyAssetMappingsinElastic : Inserting new value to : " + JSON.stringify(dataTobeSent));
                            // let insertedResponse = await new Promise((resolve) => {
                            //     client.index({
                            //         index: global.config.elasticActivityAssetTable,
                            //         body: {
                            //             ...dataTobeSent
                            //         }
                            //     }, function (err, res) {
                            //         util.handleElasticSearchResponse(request, dataTobeSent, global.config.elasticActivityAssetTable, err, res);
                            //         resolve();
                            //     })
                            // })

                            let queryData = {
                                index: global.config.elasticActivityAssetTable,
                                body: {
                                    ...dataTobeSent
                                }
                            };

                            let stackTrace = util.getStackTrace();
                            await util.handleElasticSearchEntries(request, "insert", queryData, global.config.elasticActivityAssetTable, stackTrace);

                        }

                    }

                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    }

    this.insertActivityMappingsinElastic=async function (request){
        let responseData = [],
        error = true;
        let checkEntry = [];
        util.logInfo(request,"insertActivityMappingsinElastic : ---Entered----")
// const paramsArr2 = [ request.activity_id,
//     request.asset_id,
//     request.organization_id ];
//     const queryString2 = util.getQueryString('ds_v1_activity_asset_search_mapping_update_elasticsearch_insert', paramsArr2);
//     if (queryString2 !== '') {
//         await db.executeQueryPromise(0, queryString2, request)
//             .then(async (data) => {
//                 console.log(data[0].updated_rows)
//                 checkEntry = data;
//             }).catch(err=>console.log(err))}
// if(checkEntry.length>0){
//     return [false, []];
// }
// else{
    
    const paramsArr = [
                        request.activity_id,
                        request.asset_id,
                        0                           
                      ];
    const queryString = util.getQueryString('ds_p1_activity_asset_search_mapping_select', paramsArr);
    if (queryString !== '') {
        await db.executeQueryPromise(1, queryString, request)
            .then(async (data) => {
                responseData = data;
               
                if(data.length>0 && data[0].activity_creator_asset_id==request.asset_id){
                // if(data.length>0){
                let dataTobeSent = responseData[0];
              
                   let resultData = await client.search({
                index: global.config.elasticActivitySearchTable,
                body: {
                    query: {
                        bool: {
                            must: [
                              {
                                match: {
                                  activity_id:Number(request.activity_id)
                                }
                              }
                            ],
                    
                        }
                    }
                }
            });
            
            // logger.info(resultData.hits.hits[0]._source);
            if(resultData.hits.hits.length>0){
            util.logInfo(request,"insertActivityMappingsinElastic : Updatting existing value to : " + JSON.stringify(dataTobeSent))
             let previousData = resultData.hits.hits[0]._source;
             let dataToBeUpdated = {...previousData,...dataTobeSent};

                let queryData = {
                    index: global.config.elasticActivitySearchTable,
                    "body": {
                        "query": {
                            bool: {
                                must: [
                                    {
                                        match: {
                                            activity_id: Number(request.activity_id)
                                        }
                                    }
                                ],

                            }
                        },
                        "script": {
                            "source": "ctx._source = params",
                            "lang": "painless",
                            "params": {
                                ...dataToBeUpdated
                            }
                        }
                    },
                    conflicts: 'proceed'
                };

                let stackTrace = util.getStackTrace();
                await util.handleElasticSearchEntries(request, "update", queryData, global.config.elasticActivitySearchTable, stackTrace);

                if (dataTobeSent.activity_type_category_id == 48) {
                    const [errorZero, workflowActivityData] = await this.getActivityDetailsAsync(request);

                    let parentActivityId = 0;
                    if (!errorZero && workflowActivityData.length > 0) {

                        if (workflowActivityData[0].parent_activity_id != null) {
                            parentActivityId = workflowActivityData[0].parent_activity_id;
                        }

                    }
                    queryData = {
                        index: global.config.elasticActivitySearch48Table,
                        "body": {
                            "query": {
                                bool: {
                                    must: [
                                        {
                                            match: {
                                                activity_id: Number(request.activity_id)
                                            }
                                        }
                                    ],

                                }
                            },
                            "script": {
                                "source": "ctx._source = params",
                                "lang": "painless",
                                "params": {
                                    ...dataToBeUpdated, parent_activity_id: parentActivityId
                                }
                            }
                        },
                        conflicts: 'proceed'
                    };
                    stackTrace = util.getStackTrace();
                    await util.handleElasticSearchEntries(request, "update", queryData, global.config.elasticActivitySearch48Table, stackTrace);
                }


            }
            else{
                util.logInfo(request,"insertActivityMappingsinElastic : inserting new value : " + JSON.stringify(dataTobeSent))

                let queryData = {
                    index: global.config.elasticActivitySearchTable,
                    body: {
                        ...dataTobeSent
                    }
                };
                let stackTrace = util.getStackTrace();
                await util.handleElasticSearchEntries(request, "insert", queryData, global.config.elasticActivitySearchTable, stackTrace);

                if (dataTobeSent.activity_type_category_id == 48) {
                    const [errorZero, workflowActivityData] = await this.getActivityDetailsAsync(request);

                    let parentActivityId = 0;
                    if (!errorZero && workflowActivityData.length > 0) {

                        if (workflowActivityData[0].parent_activity_id != null) {
                            parentActivityId = workflowActivityData[0].parent_activity_id;
                        }

                    }
                    queryData = {
                        index: global.config.elasticActivitySearch48Table,
                        body: {
                            ...dataTobeSent, parent_activity_id: parentActivityId
                        }
                    };

                    stackTrace = util.getStackTrace();
                    await util.handleElasticSearchEntries(request, "insert", queryData, global.config.elasticActivitySearch48Table, stackTrace);
                }


            }
        }
                error = false;
            })
            .catch((err) => {
                error = err;
            });
    }

    return [error, responseData];
    }

    this.delteAndInsertInElasticBulk = async function (request){
        for(let i=0;i<request.list.length;i++){
        await this.delteAndInsertInElastic({activity_id:request.list[i],asset_id:0})
        }
        return [false,[]]
    }
    
    this.delteAndInsertInElasticMulti = async function (request){
        let responseDataMulti = {};
        let responseData = [], error = false;
        try{
            let array = JSON.parse(request.activities);
            logger.info(array);
            for(let i =0; i < array.length; i++){
                request.activity_id = array[i];
                [error, responseData] = await self.delteAndInsertInElastic(request);
                responseDataMulti[request.activity_id] = responseData;            
            }
        }catch(error){
            util.logError(request, e)
            return [error, responseDataMulti]
        }
        return [false, responseDataMulti];
    } 

    this.delteAndInsertInElastic = async function (request){
        let responseData = [],
        error = true;
        let checkEntry = [];

// const paramsArr2 = [ request.activity_id,
//     request.asset_id,
//     request.organization_id ];
//     const queryString2 = util.getQueryString('ds_v1_activity_asset_search_mapping_update_elasticsearch_insert', paramsArr2);
//     if (queryString2 !== '') {
//         await db.executeQueryPromise(0, queryString2, request)
//             .then(async (data) => {
//                 console.log(data[0].updated_rows)
//                 checkEntry = data;
//             }).catch(err=>console.log(err))}
// if(checkEntry.length>0){
//     return [false, []];
// }
// else{
    
    const paramsArr = [
                        request.activity_id,
                        request.asset_id,
                        3                           
                      ];
    const queryString = util.getQueryString('ds_p1_activity_asset_search_mapping_select', paramsArr);
    if (queryString !== '') {
        await db.executeQueryPromise(1, queryString, request)
            .then(async (data) => {
                responseData = data;

             await client.deleteByQuery({
                index: global.config.elasticActivitySearchTable,
                "body": {
                    "query": {
                       
                                match: {
                                  activity_id:Number(request.activity_id)
                                }
                    },
                }
            })
            await client.deleteByQuery({
                index: global.config.elasticActivityAssetTable,
                "body": {
                    "query": {
                       
                                match: {
                                  activity_id:Number(request.activity_id)
                                }
                    },
                }
            });

            if(responseData.length>0){
                console.log(responseData)

                let queryData = {
                    index: global.config.elasticActivitySearchTable,
                    body: {
                        ...responseData[0]
                    }
                };

                let stackTrace = util.getStackTrace();
                await util.handleElasticSearchEntries(request, "insert", queryData, global.config.elasticActivitySearchTable, stackTrace);

                if (request.activity_type_category_id == 48) {

                    await client.deleteByQuery({
                        index: global.config.elasticActivitySearch48Table,
                        "body": {
                            "query": {

                                match: {
                                    activity_id: Number(request.activity_id)
                                }
                            },
                        }
                    })

                    const [errorZero, workflowActivityData] = await this.getActivityDetailsAsync(request);

                    let parentActivityId = 0;
                    if (!errorZero && workflowActivityData.length > 0) {

                        if (workflowActivityData[0].parent_activity_id != null) {
                            parentActivityId = workflowActivityData[0].parent_activity_id;
                        }

                    }
                    queryData = {
                        index: global.config.elasticActivitySearch48Table,
                        body: {
                            ...responseData[0], parent_activity_id: parentActivityId
                        }
                    };

                    stackTrace = util.getStackTrace();
                    await util.handleElasticSearchEntries(request, "insert", queryData, global.config.elasticActivitySearch48Table, stackTrace);
                }

                for (let i = 0; i < responseData.length; i++) {
                    util.logInfo(request, i);
                    // let insertedResponse = await new Promise((resolve) => {
                    //     client.index({
                    //         index: global.config.elasticActivityAssetTable,
                    //         body: {
                    //             ...responseData[i]
                    //         }
                    //     }, function (err, res) {
                    //         util.handleElasticSearchResponse(request, responseData[i], global.config.elasticActivityAssetTable, err, res);
                    //         resolve();
                    //     });
                    // })

                    let queryData = {
                        index: global.config.elasticActivityAssetTable,
                        body: {
                            ...responseData[i]
                        }
                    };
                    let stackTrace = util.getStackTrace();
                    await util.handleElasticSearchEntries(request, "insert", queryData, global.config.elasticActivityAssetTable, stackTrace);

                }
            }
            
            logger.info('came for crawling delete and insert');
                    if (request.hasOwnProperty("is_account")){
                        if (request.is_account == 1) {
                            await client.deleteByQuery({
                                index: global.config.elasticCrawlingAccountTable,
                                "body": {
                                    "query": {            
                                       match: {
                                            activity_id: Number(request.activity_id)
                                        }
                                    },
                                }
                            });
                            const paramsArr_c = [
                                request.organization_id,
                                request.activity_id,
                            ];

                            const queryString_c = util.getQueryString('dm_v1_activity_list_select_account', paramsArr_c);
                            if (queryString_c !== '') {
                                await db.executeQueryPromise(1, queryString_c, request)
                                    .then(async (data) => {
                                        responseData = data;    
                                        let queryData_c = {
                                            index: global.config.elasticCrawlingAccountTable,
                                            body: {
                                                ...responseData[0]
                                            }
                                        };
            
                                        let stackTrace = util.getStackTrace();   
                                              
                                        await util.handleElasticSearchEntries(request, "insert", queryData_c, global.config.elasticCrawlingAccountTable, stackTrace);
                                    })
                            }
            
                        }
                 }
        
                error = false;
            })
            .catch((err) => {
                error = err;
            });
    }

    return [error, responseData];
    }
       
    this.insertConsumerError = async (request) => {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
          request.consumer_message,
          request.consumer_error,
          request.activity_id || 0,
          util.getCurrentUTCTime()
        );

        let queryString = util.getQueryString('ds_v1_consumer_error_transaction_insert',paramsArr);
        if(queryString !== '') {
            try {
                const data = await db.executeQueryPromise(0,queryString,request);
                await botService.callAddTimelineEntry(request);
                responseData = data;
                error = false;
            } catch(e) {
                error = e;
            }
        }
        return [error,responseData];
    }

    this.fetchCompanyDefaultAssetName = async function (request) {
        let assetName = 'greneOS',
            error = true;

        const paramsArr = new Array(
            1,
            100
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

    this.getResourceByRole = async(request)=>{

        let responseData = [],
            error = true;
        //IN p_organization_id BIGINT(20), IN p_access_role_id SMALLINT(6), IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
       // let access_role_id = 2
        let paramsArr = new Array(
            request.organization_id,
            request.access_role_id,
            request.start_from || 0,
            request.limit_value||50
            )
        const queryString = util.getQueryString('pm_v1_asset_list_select_role', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
            .then((data) => {
                responseData = [{asset_id:request.asset_id}];
                error = false;
            })
            .catch((err) => {
                error = err;
            })
        }
        return [error, responseData];

    } 

    this.sendPushOnReservationAdd = async function (request) {

        request.access_role_id = 2;
        let [notErr, notData] = await self.getResourceByRole(request);
        request.message = "Order Received";
        request.target_asset_id = (notData.length > 0)?notData[0].asset_id:0;
        let activityData = [{
                            activity_type_id:request.activity_type_id,
                            activity_type_category_id:request.activity_type_category_id,
                            activity_title:request.activity_title || "",
                        }]
        util.sendCustomPushNotification(request,activityData);     
    }   

    this.getActivityDetailsAsync = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.workflow_activity_id || request.activity_id || 0,
            request.organization_id
        );
        const queryString = util.getQueryString('ds_p1_activity_list_select', paramsArr);

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
    
    
    this.updateWorkflowValue = async function(request, fieldValue){
        let responseData = [],
        error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.workflow_activity_id,
            request.activity_type_id,
            request.sequence_id,
            fieldValue
        );
        //console.log(paramsArr);            
        let queryString = util.getQueryString( "ds_v1_activity_list_update_workflow_value",paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    }

    this.updateEntityFields = async function (request) {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.channel_activity_id || request.workflow_activity_id,
            request.field_data,
            request.field_data_value,
            request.sequence_id
        );
        const queryString = util.getQueryString('ds_v1_activity_search_list_update_entity_fields', paramsArr);
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

    this.getDashboardEntityFieldData = async function (request, workflowTypeData) {
        let dashboardEntityFieldData = {};
        util.logInfo(request, "workflowTypeData : "+ workflowTypeData);
        if (workflowTypeData[0].dashboard_config_enabled !== 1) {
            return dashboardEntityFieldData;
        }else{
            util.logInfo(request, "dashboard_config_fields 1 : "+ workflowTypeData[0].dashboard_config_fields);
            if (workflowTypeData[0].dashboard_config_fields != null && workflowTypeData[0].dashboard_config_fields !== {}) {
                util.logInfo(request, "dashboard_config_fields 2 : "+ workflowTypeData[0].dashboard_config_fields);
                dashboardEntityFieldData = JSON.parse(workflowTypeData[0].dashboard_config_fields);
            }
        }
        return dashboardEntityFieldData;

    }

    this.updateEntityFieldsForDashboardEntity = async function (request, dashboardEntityFieldData, fieldData, fieldDataValue, idField) {

        let dashboardEntityFieldsDataKeys = Object.keys(dashboardEntityFieldData);
        util.logInfo(request, "dashboardEntityFieldsDataKeys :: " + (dashboardEntityFieldsDataKeys.includes(idField) || dashboardEntityFieldsDataKeys.includes(String(idField))));
        if (dashboardEntityFieldsDataKeys.includes(idField) || dashboardEntityFieldsDataKeys.includes(String(idField))) {
            util.logInfo(request, "updateEntityFieldsForDashboardEntity Configured :: " + idField + " : " + dashboardEntityFieldData[idField].sequence_id);
            request.sequence_id = dashboardEntityFieldData[idField].sequence_id
            request.field_data = fieldData;
            request.field_data_value = fieldDataValue;
            self.updateEntityFields(request);
        } else {
            util.logInfo(request, "activityTimelineService:updateEntityFields Not Configured");
        }

    }

    this.botOperationMappingSelectOperationType = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.activity_type_id || 0,
            request.bot_id || 0,
            request.bot_operation_type_id || 0,
            request.form_id || 0,
            request.field_id || 0,
            request.start_from || 0,
            request.limit_value || 50
        );

        let queryString = util.getQueryString('ds_p1_1_bot_operation_mapping_select_operation_type',paramsArr);
        if(queryString !== '') {
            await db.executeQueryPromise(1,queryString,request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error,responseData];
    };
    
    this.updateAmountInInlineData = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_parent_id,
            request.activity_type_category_id,
            request.amount,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('pm_v1_activity_list_update_inline_amount', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    console.log(responseData,'responseDataresponseData');
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.SQSMessageIdInsertAsync = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.topic_id,
            request.message_id,
            request.asset_id,
            request.activity_id,
            request.form_activity_id,
            request.form_transaction_id
        );
        const queryString = util.getQueryString('ds_v1_sqs_message_transaction_insert', paramsArr);

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

    this.checkingSQSMessageIdAsync = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.topic_id,
            request.message_id,
        );

        const queryString = util.getQueryString('ds_v1_sqs_message_transaction_select', paramsArr);

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

    this.BOTMessageTransactionUpdateErrorAsync = async function (request) {
        let responseData = [],
            error = true;
            
        const paramsArr = new Array(
            request.sqs_bot_transaction_id,
            request.message_id,
            request.error_failed_json,
            request.log_datetime,
        );
        const queryString = util.getQueryString('ds_p1_bot_message_transaction_update_error', paramsArr);

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

    this.BOTMessageTransactionUpdateStatusAsync = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.sqs_bot_transaction_id,
            request.message_id,
            request.status_id,
            request.log_asset_id,
            request.consumed_datetime,
            request.processed_datetime,
            request.failed_datetime,
            request.log_datetime,
        );
        const queryString = util.getQueryString('ds_p1_bot_message_transaction_update_status', paramsArr);

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

    this.BOTOperationMessageTransactionInsertAsync = async function (request) {
        let responseData = [],
            error = true;
          
        const paramsArr = new Array(
            request.sqs_bot_transaction_id,
            request.message_id,
            request.bot_operation_id,
            request.bot_operation_type_id,
            request.workflow_activity_id,
            request.form_activity_id,
            request.form_transaction_id,
            request.form_id,
            request.field_id,
            request.status_id,
            request.bot_operation_start_datetime,
            request.bot_operation_end_datetime,
            request.error_failed_json,
            request.organization_id,
            request.log_datetime,
        );
        const queryString = util.getQueryString('ds_p1_bot_operation_message_transaction_insert', paramsArr);

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

    this.workforceFormMappingSelectSuppress = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.form_id,
        );

        const queryString = util.getQueryString('ds_v1_workforce_form_mapping_select_suppress', paramsArr);

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

    this.activtyReferenceFieldInsert = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.activity_type_id,
            request.activity_type_category_id,
            request.form_id,
            request.field_id,
            request.field_name,
            request.field_value,
            request.form_transaction_id,
            request.mapping_activity_id,
            request.mapping_type_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_activity_reference_field_mapping_insert', paramsArr);

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

    this.checkFieldOrReferenceWidget = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = [
            request.organization_id,
            request.form_id,
            request.field_id,
            request.data_type_id,
            request.page_start,
            request.page_limit
        ];

        const queryString = util.getQueryString('ds_v1_widget_list_select_field_reference', paramsArr);

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

    this.processFieldWidgetData = async function (request, fieldData) {
        let responseData = [],
            error = true;

        let WidgetFieldRequest = Object.assign({}, request);
        let activityTypeCategroyId = parseInt(request.activity_type_category_id);
        WidgetFieldRequest.field_id = fieldData.field_id;
        WidgetFieldRequest.field_name = fieldData.field_name;
        //WidgetFieldRequest.form_id = fieldData.form_id;
        WidgetFieldRequest.data_type_id = fieldData.field_data_type_id;
        WidgetFieldRequest.page_start = 0;
        WidgetFieldRequest.page_limit = 1;
        //WidgetFieldRequest.widget_type_id = 68;
        WidgetFieldRequest.field_value = fieldData.field_value;

        if (fieldData.field_data_type_id === 57) {
            WidgetFieldRequest.field_value = fieldData.field_value;
            WidgetFieldRequest.mapping_activity_id = fieldData.field_value.split("\|")[0];
            WidgetFieldRequest.mapping_type_id = 1;
        } else if (fieldData.field_data_type_id == 33 || fieldData.field_data_type_id == 34 || fieldData.field_data_type_id == 19) {
            WidgetFieldRequest.field_value = fieldData.field_value;
            WidgetFieldRequest.mapping_type_id = 2;
            WidgetFieldRequest.mapping_activity_id = 0;
        } else {
            WidgetFieldRequest.field_value = fieldData.field_value;
            WidgetFieldRequest.mapping_type_id = 3;
            WidgetFieldRequest.mapping_activity_id = 0;
        }

        let [errorWidget, responseWidget] = await this.checkFieldOrReferenceWidget(WidgetFieldRequest);
        if (responseWidget.length > 0) {
            util.logInfo(request, `FieldWidget exists for this Field :: ${fieldData.field_id}`);

            if (activityTypeCategroyId === 48 || activityTypeCategroyId === 53 || activityTypeCategroyId === 54
                || activityTypeCategroyId === 63 || activityTypeCategroyId === 31) {
                await this.activtyReferenceFieldInsert(WidgetFieldRequest);

            } else if (activityTypeCategroyId === 9) {

                let formData = await this.getFormDetails(request);
                if (formData.length > 0) {

                    if (formData[0].form_flag_workflow_origin == 0 || request.isFieldEdit == 1) {

                        WidgetFieldRequest.activity_id = WidgetFieldRequest.workflow_activity_id || WidgetFieldRequest.channel_activity_id;
                        await this.activtyReferenceFieldInsert(WidgetFieldRequest);

                    } else {
                        util.logInfo(request, `Origin Form submitted, hence no widget data insert`);
                    }
                } else {
                    util.logInfo(request, `No Form Exists with this FormId`);
                }
            }
        } else {
            WidgetFieldRequest = null;
            util.logInfo(request, `No FieldWidget for this Field ${fieldData.field_id}`);
        }
        return [error, responseData];
    }

    this.searchCuidFromElastic = async (request) => {

        let error = true,
            responseData = [];
        try {
            request.search_string = request.search_string || request.cuid;
            let searchString = `activity_cuid_1 : ${request.search_string} OR activity_cuid_2 : ${request.search_string} OR activity_cuid_3 : ${request.search_string}`
            let query = `/${global.config.elasticActivitySearch48Table}/_search?q=${searchString}`;

            query = encodeURI(query);

            query = query + "&from=" + 0 + "&size=" + 10000;

            logger.info(`Search cuid ${request.search_string} %j`, { query });
            const result = await client.transport.request({
                method: "GET",
                path: query,
            });

            logger.info(`Search cuid ${request.search_string} length ${result.hits.hits.length}%j`);
            for (let i = 0; i < result.hits.hits.length; i++) {

                if (result.hits.hits[i]._source.log_state < 3 && (result.hits.hits[i]._source.activity_cuid_1 == request.search_string || result.hits.hits[i]._source.activity_cuid_2 == request.search_string || result.hits.hits[i]._source.activity_cuid_3 == request.search_string)) {
                    logger.info(`Search cuid ${request.search_string} found %j`);
                    let activityId = result.hits.hits[i]._source.activity_id;

                    request.organization_id = 868;
                    request.activity_id = activityId;
                    const [errorZero, workflowActivityData] = await this.getActivityDetailsAsync(request);
                    responseData = workflowActivityData;
                    break;
                }
            }

            error = false
        } catch (e) {
            error = e;
            logger.error("Error searching CUID data from elastic ", { error: e, request })
        }
        return [error, responseData];
    }

    this.changeDueDateOfParentBasedOnChild = async function (request) {
        let workflowActivityDeatils = await this.getActivityDetailsAsync(request);
        request.workflow_activity_id = request.workflow_activity_id || request.activity_id;
        const changeParentDueDate = nodeUtil.promisify(makingRequest.post);
        const makeRequestOptions = {
            form: {...request,new_date:workflowActivityDeatils[0].activity_datetime_end_deferred}
        };
        try {
            // global.config.mobileBaseUrl + global.config.version
            const response = await changeParentDueDate(global.config.mobileBaseUrl + global.config.version + '/bot/set/parents/due/date', makeRequestOptions);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                console.log("Success | changeParentDueDate | Body: ", body);
                return [false, body];
            }
        } catch (error) {
            console.log("Success | changeParentDueDate | Error: ", error);
            return [true, {}];
        }
        // await botService.setDueDateV1(request,workflowActivityDeatils[0].activity_datetime_end_deferred);
        return [false,[]]
    }
}


module.exports = ActivityCommonService;