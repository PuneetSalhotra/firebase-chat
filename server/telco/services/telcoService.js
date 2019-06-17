
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
        console.log("fireTelcoDemoTimelineLogic | request: ", request);

        const formID = Number(request.form_id) || Number(request.activity_form_id);

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

        // [1524] Order Management
        if (
            formDataMap.has(13786)
        ) {
            timelineText = "Thanks for your request, a sales representative will be added here for assisting you with this order";
        }
        // [1525] Feasibility Check
        // Fetch the origin form data from the workflow
        let originFormID = 1524,
            originFormActivityID = 0,
            originFormTransactionID = 0;
        await activityCommonService
            .getActivityTimelineTransactionByFormId713(request, request.activity_id, originFormID)
            .then((formData) => {
                if (formData.length > 0) {
                    originFormActivityID = formData[0].data_activity_id;
                    originFormTransactionID = formData[0].data_form_transaction_id;
                }
            });

        // Get Virtual Private Network (VPN) from the origin form
        let virtualPrivateNetworkField = '';
        if (Number(originFormTransactionID) !== 0) {
            fieldValue = await getFieldValue({
                form_transaction_id: originFormTransactionID,
                form_id: originFormID,
                field_id: 13786,
                organization_id: request.organization_id
            });
            if (fieldValue[0].data_entity_text_1 !== '') {
                virtualPrivateNetworkField = fieldValue[0].data_entity_text_1;
            }
        }
        console.log("virtualPrivateNetworkField: ", virtualPrivateNetworkField);
        console.log("[1525] Feasibility Check | Form ID: ", formID);
        console.log("[1525] formDataMap.has(13832): ", formDataMap.has(13832));
        console.log("[1525] formDataMap.get(13832): ", formDataMap.get(13832));
        if (
            formID === 1525 &&
            formDataMap.has(13832)
        ) {
            if (virtualPrivateNetworkField === "Domestic VPN") {
                timelineText = "Yes, the request raised for VPN connection between the locations is feasible, you may please accept the order";

            } else if (virtualPrivateNetworkField === "Global VPN") {
                timelineText = "Request raised for VPN connection between the locations is feasible subject to capex approval, please escalate to get the approval for capex";
            }
        }


        // IF [LOGIC]
        try {
            if (timelineText !== '') {
                await addTimelineText(request, timelineText);
            }
        } catch (error) {
            console.log("TelcoService | addTimelineText | addTimelineText | Error: ", error);
        }

        // [TERMINATE FLOW] If the trigger was origin form submission
        if (formID === 1524) {
            return [false, []];
        }

        if (virtualPrivateNetworkField === "Global VPN") {
            try {
                await addCapexValueForm(request);
            } catch (error) {
                console.log("fireTelcoDemoTimelineLogic | addCapexValueForm | Error: ", error);
            }
        }

        try {
            await addDeskAsParticipant({
                organization_id: request.organization_id,
                account_id: request.account_id,
                workforce_id: request.workforce_id,
                workflow_activity_id: request.activity_id,
                asset_id: 100
            }, {
                    first_name: "CEO",
                    desk_asset_id: 35477,
                    contact_phone_number: 9908000111,
                    contact_phone_country_code: 91,
                    asset_type_id: 133189,
                });
        } catch (error) {
            console.log("vodafoneCreateChildOrdersFromExcelUpload | addDeskAsParticipant | Error: ", error);
        }

        return [false, []];
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
        timelineTextRequest.asset_participant_access_id = 21;

        let timelineTextRequestEvent = {
            name: "addTimelineTransaction",
            service: "activityTimelineService",
            method: "addTimelineTransaction",
            payload: timelineTextRequest
        };

        queueWrapper.raiseActivityEvent(timelineTextRequestEvent, request.activity_id, (err, resp) => {
            if (err) {
                console.log("addTimelineText | Error: ", err);
            } else {
                console.log("addTimelineText | Response: ", err);
            }
        });

        return;
    }

    // Get the field value based on form id and form_transaction_id
    async function getFieldValue(request) {
        let paramsArr = new Array(
            request.form_transaction_id || 0,
            request.form_id,
            request.field_id,
            request.organization_id
        );
        let queryString = util.getQueryString('ds_p1_activity_form_transaction_select_field_sequence_id', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));
        }
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
            }
        });
        return;
    }

    // async function addCapexValueForm(request) {
    //     let addCapexFormRequest = Object.assign({}, request);

    //     // Fetch the next activity_id to and the form be inserted
    //     childOrderOriginFormActivityId = await cacheWrapper.getActivityIdPromise();
    //     childOrderOriginFormTransactionId = await cacheWrapper.getFormTransactionIdPromise();

    //     activity_id= 221475;
    //     activity_title= "5:33 PM, Mon 17 Jun 2019Capex Value Form";
    //     activity_description= "\"500000\"";
    //     activity_inline_data= "[{\"form_id\":1526,\"field_id\":\"13833\",\"field_name\":\"Capex Value\",\"field_data_type_id\":6,\"field_data_type_category_id\":2,\"data_type_combo_id\":0,\"data_type_combo_value\":\"0\",\"field_value\":\"500000\",\"message_unique_id\":1560773711697}]";
    //     activity_participant_collection= "[{\"access_role_id\":22,\"account_id\":1013,\"activity_id\":221418,\"asset_datetime_last_seen\":\"1970-01-01 00:00:00\",\"asset_first_name\":\"Senior Engineer-APIs\",\"asset_id\":35496,\"asset_image_path\":\"\",\"asset_last_name\":\"\",\"asset_phone_number\":9618492847,\"asset_phone_number_code\":91,\"asset_type_category_id\":3,\"asset_type_id\":133001,\"field_id\":0,\"log_asset_id\":35496,\"message_unique_id\":1560773932197,\"operating_asset_first_name\":\"Ben Sooraj\",\"organization_id\":898,\"workforce_id\":5616}]";
    //     activity_datetime_start= "2019-06-17 12:03:38";
    //     activity_datetime_end= "2019-06-17 12:03:38";
    //     activity_type_category_id= 9;
    //     activity_sub_type_id= 0;
    //     activity_type_id= 140257;
    //     activity_access_role_id= 21;
    //     activity_status_type_category_id= 1;
    //     activity_status_type_id= 22;
    //     asset_participant_access_id= 21;
    //     activity_flag_file_enabled= -1;
    //     activity_parent_id= 0;
    //     activity_form_id= 1526;
    //     flag_pin= 0;
    //     flag_offline= 0;
    //     flag_retry= 0;
    //     message_unique_id= 1560773228537;
    //     track_latitude= "0.0";
    //     track_longitude= "0.0";
    //     track_altitude= 0;
    //     track_gps_datetime= "2019-06-17 12:03:38";
    //     track_gps_accuracy= "0";
    //     track_gps_status= 0;
    //     service_version= 1;
    //     app_version= 1;
    //     api_version= 1;
    //     device_os_id= 5;
    //     activity_stream_type_id= 705;
    //     form_transaction_id= 68963;
    //     form_id= 1526;
    //     activity_timeline_collection= "{\"mail_body\":\"Capex Value Form\",\"asset_reference\":[{\"account_id\":\"\",\"organization\":\"\",\"asset_id\":\"\",\"asset_first_name\":\"\",\"asset_type_category_id\":\"\",\"asset_last_name\":\"\",\"asset_image_path\":\"\"}],\"activity_reference\":[{\"activity_title\":\"\",\"activity_id\":\"\"}],\"form_approval_field_reference\":[],\"subject\":\"Capex Value Form\",\"attachments\":[],\"content\":\"Form Submitted\",\"form_submitted\":[{\"form_id\":1526,\"field_id\":\"13833\",\"field_name\":\"Capex Value\",\"field_data_type_id\":6,\"field_data_type_category_id\":2,\"data_type_combo_id\":0,\"data_type_combo_value\":\"0\",\"field_value\":\"500000\",\"message_unique_id\":1560773711697}],\"form_id\":1526}";
    //     data_entity_inline= "[{\"form_id\":1526,\"field_id\":\"13833\",\"field_name\":\"Capex Value\",\"field_data_type_id\":6,\"field_data_type_category_id\":2,\"data_type_combo_id\":0,\"data_type_combo_value\":\"0\",\"field_value\":\"500000\",\"message_unique_id\":1560773711697}]";
    //     activity_timeline_text= "";
    //     activity_timeline_url= "";
    //     flag_timeline_entry= 1;
    //     file_activity_id= 0;
    //     workflow_activity_id= 221418;
    // }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}


module.exports = TelcoService;
