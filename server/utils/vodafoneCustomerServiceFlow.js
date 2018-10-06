// 
const moment = require('moment');
const pubnubWrapper = new(require('../utils/pubnubWrapper'))();

function vodafoneCustomerServiceFlow(request, activityCommonService, objectCollection, callback) {

    const util = objectCollection.util;
    const cacheWrapper = objectCollection.cacheWrapper;
    const queueWrapper = objectCollection.queueWrapper;
    const activityPushService = objectCollection.activityPushService;
    const db = objectCollection.db;

    // Add activity
    let addActivityRequest = {
        organization_id: 856,
        account_id: 971,
        workforce_id: 5337,
        asset_id: 31035,
        asset_token_auth: "99c85180-c86e-11e8-9dbf-5bc3d8c0f2c7",
        asset_message_counter: 0,
        activity_title: request.activity_title,
        activity_description: request.activity_description,
        activity_inline_data: JSON.stringify({
            "activity_owner_operating_asset_id": 0,
            "activity_owner_operating_asset_first_name": "",
            "activity_owner_operating_asset_last_name": "",
            "activity_owner_operating_asset_image_path": ""
        }),
        activity_datetime_start: request.activity_datetime_start,
        activity_datetime_end: request.activity_datetime_end,
        activity_type_category_id: 10,
        activity_sub_type_id: 1,
        activity_type_id: 132805,
        activity_access_role_id: 26,
        asset_participant_access_id: 26,
        activity_parent_id: 0,
        flag_pin: 0,
        flag_priority: 0,
        activity_flag_file_enabled: 1,
        flag_offline: 0,
        flag_retry: 0,
        message_unique_id: util.getMessageUniqueId(request.asset_id),
        activity_channel_id: 0,
        activity_channel_category_id: 0,
        activity_flag_response_required: 0,
        activity_status_id: 278390,
        activity_status_type_id: 130,
        activity_status_type_category_id: 0,
        track_latitude: 0.0,
        track_longitude: 0.0,
        track_altitude: 0,
        track_gps_datetime: request.track_gps_datetime,
        track_gps_accuracy: 0,
        track_gps_status: 0,
        service_version: 1.0,
        app_version: "2.5.5",
        device_os_id: 1
    };

    cacheWrapper.getActivityId(function (err, activityId) {
        if (err) {
            console.log(err);
            return callback(true, 0, -5998);
        } else {
            // Store the activity_id
            addActivityRequest['activity_id'] = activityId;
            request['activity_id'] = activityId;
            console.log("New activity_id: ", activityId);

            // Event config
            const addActivityEvent = {
                name: "addActivity",
                service: "activityService",
                method: "addActivity",
                payload: addActivityRequest
            };
            // Raise the event
            queueWrapper.raiseActivityEvent(addActivityEvent, request.activity_id, (err, resp) => {
                if (err) {
                    console.log("\x1b[35m [ERROR] Raising queue activity raised for creating an activity. \x1b[0m")
                } else {
                    if (request.hasOwnProperty('device_os_id')) {
                        if (Number(request.device_os_id) !== 5) {
                            cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                                if (err) {
                                    // global.logger.write('serverError', 'error in setting asset parity', err, req);
                                } else {
                                    // global.logger.write('debug', "asset parity is set successfully", {}, req);
                                }
                            });
                        }
                    }
                    console.log("\x1b[35m Queue activity raised for adding Service Agent as a participant. \x1b[0m")

                    // Add service agent as a participant on the file
                    let addParticipantRequest = {
                        organization_id: 856,
                        account_id: 971,
                        workforce_id: 5337,
                        asset_id: 31035,
                        asset_token_auth: "99c85180-c86e-11e8-9dbf-5bc3d8c0f2c7",
                        asset_message_counter: 0,
                        activity_id: request.activity_id,
                        activity_access_role_id: 29,
                        activity_type_category_id: 10,
                        activity_type_id: 0,
                        activity_participant_collection: JSON.stringify([{
                            "access_role_id": 29,
                            "account_id": 971,
                            "activity_id": request.activity_id,
                            "asset_datetime_last_seen": "1970-01-01 00:00:00",
                            "asset_first_name": "Testing",
                            "asset_id": 30990,
                            "asset_image_path": "",
                            "asset_last_name": "",
                            "asset_phone_number": "9618492847",
                            "asset_phone_number_code": "91",
                            "asset_type_category_id": 5,
                            "asset_type_id": 122968,
                            "field_id": 0,
                            "log_asset_id": 30990,
                            "message_unique_id": "309901538739696878349",
                            "operating_asset_first_name": "Ben Sooraj M",
                            "organization_id": 856,
                            "workforce_id": 5337
                        }]),
                        flag_pin: 0,
                        flag_priority: 0,
                        flag_offline: 0,
                        flag_retry: 0,
                        message_unique_id: util.getMessageUniqueId(request.asset_id),
                        track_latitude: 0.0,
                        track_longitude: 0.0,
                        track_altitude: 0,
                        track_gps_datetime: request.track_gps_datetime,
                        track_gps_accuracy: 0,
                        track_gps_status: 0,
                        service_version: 1.0,
                        app_version: "2.5.5",
                        device_os_id: 5
                    };

                    const addParticipantEvent = {
                        name: "assignParticipnt",
                        service: "activityParticipantService",
                        method: "assignCoworker",
                        payload: addParticipantRequest
                    };

                    queueWrapper.raiseActivityEvent(addParticipantEvent, request.activity_id, (err, resp) => {
                        if (err) {
                            console.log("\x1b[35m [ERROR] Raising queue activity raised for adding Service Agent as a participant. \x1b[0m")
                        } else {
                            console.log("\x1b[35m Queue activity raised for adding Service Agent as a participant. \x1b[0m")
                        }
                    });

                    // Add email content to the file
                    let addEmailContentToFileRequest = {
                        organization_id: 856,
                        account_id: 971,
                        workforce_id: 5337,
                        asset_id: 31035,
                        asset_token_auth: "99c85180-c86e-11e8-9dbf-5bc3d8c0f2c7",
                        asset_message_counter: 203,
                        activity_id: request.activity_id,
                        activity_type_category_id: 10,
                        activity_stream_type_id: 325,
                        activity_timeline_text: `${JSON.stringify(request.email_content)}`,
                        activity_timeline_url: '',
                        activity_timeline_collection: JSON.stringify({
                            "mail_body": `<br>Title: Customer Name<br>Description: Purpose<br><br><br>${request.email_content}`,
                            "subject": "Email sent.",
                            "content": `<br>Title: Customer Name<br>Description: Purpose<br><br><br>${request.email_content}`,
                            "asset_reference": [],
                            "activity_reference": [],
                            "form_approval_field_reference": [],
                            "attachments": []
                        }),
                        flag_offline: 0,
                        flag_retry: 0,
                        message_unique_id: util.getMessageUniqueId(request.asset_id),
                        track_latitude: 0.0,
                        track_longitude: 0.0,
                        track_altitude: 0,
                        track_gps_datetime: request.track_gps_datetime,
                        track_gps_accuracy: 0,
                        track_gps_status: 0,
                        service_version: 1.0,
                        app_version: "2.5.5",
                        device_os_id: 5
                    };

                    const addEmailContentToFileEvent = {
                        name: "addTimelineTransaction",
                        service: "activityTimelineService",
                        method: "addTimelineTransactionV1",
                        payload: addEmailContentToFileRequest
                    };

                    queueWrapper.raiseActivityEvent(addEmailContentToFileEvent, request.activity_id, (err, resp) => {
                        if (err) {
                            console.log("\x1b[35m [ERROR] Raising queue activity raised for adding email content to file. \x1b[0m")
                        } else {
                            console.log("\x1b[35m Queue activity raised for adding email content to file. \x1b[0m")
                        }
                    });

                    // Set the status of the file to Scheduled
                    let setStatusToScheduledRequest = {
                        organization_id: 856,
                        account_id: 971,
                        workforce_id: 5337,
                        asset_id: 31035,
                        asset_token_auth: "99c85180-c86e-11e8-9dbf-5bc3d8c0f2c7",
                        activity_id: request.activity_id,
                        activity_parent_id: 1,
                        activity_type_category_id: 10,
                        activity_access_role_id: 27,
                        activity_status_id: 278749,
                        activity_status_type_id: 25,
                        activity_status_type_category_id: 1,
                        asset_message_counter: 206,
                        flag_offline: 0,
                        flag_retry: 0,
                        message_unique_id: util.getMessageUniqueId(request.asset_id),
                        track_latitude: 0.0,
                        track_longitude: 0.0,
                        track_altitude: 0,
                        track_gps_datetime: request.track_gps_datetime,
                        track_gps_accuracy: 0,
                        track_gps_status: 0,
                        service_version: 1.0,
                        app_version: "2.5.5",
                        device_os_id: 5
                    };

                    const setStatusToScheduledEvent = {
                        name: "alterActivityStatus",
                        service: "activityService",
                        method: "alterActivityStatus",
                        payload: setStatusToScheduledRequest
                    };

                    queueWrapper.raiseActivityEvent(setStatusToScheduledEvent, request.activity_id, (err, resp) => {
                        if (err) {
                            console.log("\x1b[35m [ERROR] Raising queue activity raised for setting status Scheduled. \x1b[0m")
                        } else {
                            console.log("\x1b[35m Queue activity raised for setting status Scheduled. \x1b[0m")
                        }
                    });

                    callback(false, activityId, 200);
                }
            });
        }
    });

}

module.exports = vodafoneCustomerServiceFlow;
