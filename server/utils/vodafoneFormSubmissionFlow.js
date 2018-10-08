// 
const moment = require('moment');
const pubnubWrapper = new(require('./pubnubWrapper'))();
const makeRequest = require('request');

function vodafoneFormSubmissionFlow(request, activityCommonService, objectCollection, callback) {

    console.log("\x1b[35m [Log] Inside vodafoneFormSubmissionFlow \x1b[0m")

    const util = objectCollection.util;
    const cacheWrapper = objectCollection.cacheWrapper;
    const queueWrapper = objectCollection.queueWrapper;
    const activityPushService = objectCollection.activityPushService;
    const db = objectCollection.db;

    let firstName = '',
        contactCompany = '',
        contactPhoneCountryCode = 0,
        contactPhoneNumber = 0,
        contactEmailId = '',
        contactDesignation = '';

    const formData = JSON.parse(request.activity_inline_data);

    formData.forEach(formEntry => {
        switch (Number(formEntry.field_id)) {

            case 5020: // Company (Customer)Name
                contactCompany = formEntry.field_value;
                break;

            case 5023: // Name
                firstName = formEntry.field_value;
                break;

            case 5024: // Contact Number
                contactPhoneCountryCode = String(formEntry.field_value).split('||')[0];
                contactPhoneNumber = String(formEntry.field_value).split('||')[1];
                break;

            case 5025: // Email
                contactEmailId = formEntry.field_value;
                break;

            case 5029: // Designation
                contactDesignation = formEntry.field_value;
                break;
        }
    });

    console.log("firstName: ", firstName);
    console.log("contactCompany: ", contactCompany);
    console.log("contactPhoneCountryCode: ", contactPhoneCountryCode);
    console.log("contactPhoneNumber: ", contactPhoneNumber);
    console.log("contactEmailId: ", contactEmailId);
    console.log("contactDesignation: ", contactDesignation);

    let customerServiceDeskRequest = {
        organization_id: 856,
        account_id: 971,
        workforce_id: 5338,
        asset_id: 31035,
        asset_token_auth: "99c85180-c86e-11e8-9dbf-5bc3d8c0f2c7",
        asset_message_counter: 1,
        activity_title: firstName,
        activity_description: firstName,
        activity_inline_data: JSON.stringify({
            "activity_id": 0,
            "activity_ineternal_id": -1,
            "activity_type_category_id": 6,
            "contact_account_id": 971,
            "contact_asset_id": 0,
            "contact_asset_type_id": 125812,
            "contact_department": "",
            "contact_designation": contactDesignation,
            "contact_email_id": contactEmailId,
            "contact_first_name": firstName,
            "contact_last_name": "",
            "contact_location": "Hyderabad",
            "contact_operating_asset_name": firstName,
            "contact_organization": "",
            "contact_organization_id": 856,
            "contact_phone_country_code": contactPhoneCountryCode,
            "contact_phone_number": contactPhoneNumber,
            "contact_profile_picture": "",
            "contact_workforce_id": 5344,
            "contact_asset_type_name": "Customer",
            "contact_company": contactCompany,
            "contact_lat": 0.0,
            "contact_lon": 0.0,
            "contact_notes": "",
            "field_id": 0,
            "log_asset_id": 31035,
            "web_url": ""
        }),
        activity_datetime_start: util.getCurrentUTCTime(),
        activity_datetime_end: util.getCurrentUTCTime(),
        activity_type_category_id: 6,
        activity_sub_type_id: 0,
        activity_type_id: 132973, // 132820
        activity_access_role_id: 13,
        asset_participant_access_id: 13,
        activity_parent_id: 0,
        flag_pin: 0,
        flag_priority: 0,
        activity_flag_file_enabled: 0,
        flag_offline: 0,
        flag_retry: 0,
        message_unique_id: util.getMessageUniqueId(Number(request.asset_id)),
        activity_channel_id: 0,
        activity_channel_category_id: 0,
        activity_flag_response_required: 0,
        track_latitude: 0.0,
        track_longitude: 0.0,
        track_altitude: 0,
        track_gps_datetime: util.getCurrentUTCTime(),
        track_gps_accuracy: 0,
        track_gps_status: 0,
        service_version: 1.0,
        app_version: "2.5.5",
        device_os_id: 5
    };

    console.log("customerServiceDeskRequest: ", customerServiceDeskRequest);

    const requestOptions = {
        form: customerServiceDeskRequest
    }

    makeRequest.post(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', requestOptions, function (error, response, body) {
        console.log("[customerServiceDeskRequest] Body: ", body);
        console.log("[customerServiceDeskRequest] Error: ", error);
        // console.log("[customerServiceDeskRequest] Response: ", response);

        body = JSON.parse(body);

        if (Number(body.status) === 200) {
            const assetID = body.response.asset_id;
            const DeskAssetID = body.response.desk_asset_id;

            let addParticipantRequest = {
                organization_id: 856,
                account_id: 971,
                workforce_id: 5338,
                asset_id: 31035,
                asset_token_auth: "99c85180-c86e-11e8-9dbf-5bc3d8c0f2c7",
                asset_message_counter: 246,
                activity_id: Number(request.activity_id),
                activity_access_role_id: 29,
                activity_type_category_id: 9,
                activity_type_id: 0,
                activity_participant_collection: JSON.stringify([{
                    "access_role_id": 29,
                    "account_id": 971,
                    "activity_id": Number(request.activity_id),
                    "asset_datetime_last_seen": "1970-01-01 00:00:00",
                    "asset_first_name": firstName,
                    "asset_id": Number(DeskAssetID),
                    "asset_image_path": "",
                    "asset_last_name": "",
                    "asset_phone_number": contactPhoneNumber,
                    "asset_phone_number_code": contactPhoneCountryCode,
                    "asset_type_category_id": 45,
                    "asset_type_id": 125815,
                    "field_id": 0,
                    "log_asset_id": 31035,
                    "message_unique_id": util.getMessageUniqueId(Number(request.asset_id)),
                    "operating_asset_first_name": firstName,
                    "organization_id": 856,
                    "workforce_id": 5344
                }]),
                flag_pin: 0,
                flag_priority: 0,
                flag_offline: 0,
                flag_retry: 0,
                message_unique_id: util.getMessageUniqueId(Number(request.asset_id)),
                track_latitude: 0.0,
                track_longitude: 0.0,
                track_altitude: 0,
                track_gps_datetime: util.getCurrentUTCTime(),
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
                    console.log("\x1b[35m [ERROR] Raising queue activity raised for adding Service Desk as a participant. \x1b[0m")
                } else {
                    console.log("\x1b[35m Queue activity raised for adding Service Desk as a participant. \x1b[0m")
                }
            });
        }
        callback();
    });

}

module.exports = vodafoneFormSubmissionFlow;
