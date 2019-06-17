
function TelcoService(objectCollection) {

    const queueWrapper = objectCollection.queueWrapper;
    const util = objectCollection.util;
    const db = objectCollection.db;
    const forEachAsync = objectCollection.forEachAsync;
    const activityPushService = objectCollection.activityPushService;
    const activityCommonService = objectCollection.activityCommonService;
    const cacheWrapper = objectCollection.cacheWrapper;
    const makeRequest = require('request');
    const moment = require('moment');
    const nodeUtil = require('util');
    const self = this;

    let servicesLoadPathPrefix = '';
    if (!__dirname.includes('queue')) {
        servicesLoadPathPrefix = '../..';
    } else {
        servicesLoadPathPrefix = `${__dirname}/..`;
    }
    const ActivityService = require(`${servicesLoadPathPrefix}/services/activityService`);
    const activityService = new ActivityService(objectCollection);


    this.fireTelcoDemoTimelineLogic = async function (request) {

        const formDataCollection = JSON.parse(request.activity_timeline_collection);
        let formData = {};
        if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
            formData = formDataCollection.form_submitted;
        } else {
            formData = JSON.parse(formDataCollection.form_submitted);
        }

        let formDataMap = new Map();
        for (const field of formData) {
            formDataMap.set(Number(field.field_id), field);
        }

        // Timeline Text
        let timelineText = '';

        if (
            formDataMap.has(13786) &&
            formDataMap.get(13786).field_value === 'Domestic VPN'
        ) {
            timelineText = "Thanks for your request, a sales representative will be added here for assisting you with this order";
        }

        
        // IF [LOGIC]
        try {
            await addTimelineText(request, timelineText);
        } catch (error) {
            console.log("TelcoService | addTimelineText | addTimelineText | Error: ", error);
        }
    }

    async function addTimelineText(request, text) {
        console.log("TelcoService | addTimelineText | request: ", request);

        let timelineTextRequest = Object.assign({}, request);

        timelineTextRequest.auth_asset_id = request.asset_id;
        timelineTextRequest.asset_id = 100;
        timelineTextRequest.activity_stream_type_id = 325;
        timelineTextRequest.timeline_stream_type_id = 325;
        timelineTextRequest.activity_timeline_collection = JSON.stringify({
            "content": text,
            "subject": `Note - ${moment().utcOffset('+05:30').format('LLLL')}`,
            "mail_body": text,
            "attachments": [],
            "activity_reference": [],
            "asset_reference": [],
            "form_approval_field_reference": []
        });

        timelineTextRequest.device_os_id = 5;
        timelineTextRequest.flag_timeline_entry = 1;

        let timelineTextRequestEvent = {
            name: "addTimelineTransaction",
            service: "activityTimelineService",
            method: "addTimelineTransaction",
            payload: timelineTextRequest
        };

        queueWrapper.raiseActivityEvent(timelineTextRequestEvent, request.activity_id, (err, resp) => {
            if (err) {
                global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
            } else {
                global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
            }
        });


    }
    // Add Paramesh OMT as participant
    //     const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
    //         organization_id: request.organization_id,
    //         asset_id: 32037
    //     });
    //     if (!error && Number(assetData.length) > 0) {
    //         try {
    //             await addDeskAsParticipant({
    //                 organization_id: formWorkflowActivityOrganizationID,
    //                 account_id: formWorkflowActivityAccountID,
    //                 workforce_id: formWorkflowActivityWorkforceID,
    //                 workflow_activity_id: parentWorkflowActivityID,
    //                 asset_id: 100
    //             }, {
    //                 first_name: assetData[0].asset_first_name,
    //                 desk_asset_id: assetData[0].asset_id,
    //                 contact_phone_number: assetData[0].operating_asset_phone_number,
    //                 contact_phone_country_code: assetData[0].operating_asset_phone_country_code,
    //                 asset_type_id: assetData[0].asset_type_id,
    //             });
    //         } catch (error) {
    //             console.log("vodafoneCreateChildOrdersFromExcelUpload | addDeskAsParticipant | Error: ", error);
    //         }
    //         console.log("[ABORT] More than 100 child order rows found. Adding Paramesh as participant.");
    //     }

    async function addDeskAsParticipant(request, assetData) {
        let addParticipantRequest = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: 100,
            asset_message_counter: 0,
            activity_id: Number(request.workflow_activity_id),
            activity_access_role_id: 29,
            activity_type_category_id: 48,
            activity_type_id: 0,
            activity_participant_collection: JSON.stringify([{
                "access_role_id": 29,
                "account_id": request.account_id,
                "activity_id": Number(request.workflow_activity_id),
                "asset_datetime_last_seen": "1970-01-01 00:00:00",
                "asset_first_name": assetData.first_name,
                "asset_id": Number(assetData.desk_asset_id),
                "asset_image_path": "",
                "asset_last_name": "",
                "asset_phone_number": assetData.contact_phone_number,
                "asset_phone_number_code": assetData.contact_phone_country_code,
                "asset_type_category_id": 45,
                "asset_type_id": assetData.asset_type_id,
                "field_id": 0,
                "log_asset_id": request.asset_id,
                "message_unique_id": util.getMessageUniqueId(Number(request.asset_id)),
                "operating_asset_first_name": assetData.first_name,
                "organization_id": request.organization_id,
                "workforce_id": request.workforce_id
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
            service_version: "3.X",
            app_version: "3.X.X",
            device_os_id: 9
        };

        // return await new Promise((resolve, reject) => {
        //     activityParticipantService.assignCoworker(addParticipantRequest, (err, resp) => {
        //         (err === false) ? resolve() : reject(err);
        //     });
        // });
        const addParticipantEvent = {
            name: "assignParticipnt",
            service: "activityParticipantService",
            method: "assignCoworker",
            payload: addParticipantRequest
        };

        queueWrapper.raiseActivityEvent(addParticipantEvent, request.workflow_activity_id, (err, resp) => {
            if (err) {
                global.logger.write('conLog', "\x1b[35m [ERROR] Raising queue activity raised for adding Service Desk as a participant. \x1b[0m", {}, request);
                reject('Error while raising queue activity for adding service desk as a participant');
            } else {
                global.logger.write('conLog', "\x1b[35m Queue activity raised for adding Service Desk as a participant. \x1b[0m", {}, request);
                resolve();
            }
        });
    }
}


module.exports = TelcoService;
