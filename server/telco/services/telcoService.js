
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
    // const fs = require("fs");

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
        try {
            // fs.writeFileSync('/Users/Bensooraj/Desktop/desker_api/server/vodafone/utils/data.json', JSON.stringify(request, null, 2) , 'utf-8');
        } catch (error) {
            console.log("fireTelcoDemoTimelineLogic | writeFileSync | Error: ", error);
        }

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

        // virtualPrivateNetworkField === "Global VPN"
        if (
            virtualPrivateNetworkField === "Global VPN" && 
            formID === 1525
        ) {
            try {
                await addCapexValueForm(request, request.activity_id);
                await sleep(4000);
            } catch (error) {
                console.log("fireTelcoDemoTimelineLogic | addCapexValueForm | Error: ", error);
            }
        }

        // [Nani | Integration] Upload
        if (
            virtualPrivateNetworkField !== '' &&
            (formID === 1525 || formID === 1527)
        ) {

            let is_signature_upload = 0,
                signature_url = '';
            // [IF] Authorization Form
            console.log("[Nani | Integration] Upload | formID: ", formID);
            console.log("[Nani | Integration] Upload | formDataMap.get(13834): ", formDataMap.get(13834));
            if (
                formID === 1527 &&
                formDataMap.has(13834) &&
                formDataMap.get(13834).field_value !== ""
            ) {
                is_signature_upload = 1;
                signature_url = formDataMap.get(13834).field_value;
            }
            console.log("[Nani | Integration] Upload | is_signature_upload: ", is_signature_upload);
            console.log("[Nani | Integration] Upload | signature_url: ", signature_url);


            const uploadPDFAndTimelineEntryAdd = nodeUtil.promisify(makeRequest.post);
            const makeRequestOptions = {
                form: {
                    organization_id: Number(request.organization_id),
                    form_id: 1524,
                    activity_id: request.activity_id,
                    account_id: request.account_id,
                    workforce_id: request.workforce_id,
                    asset_id: 100,
                    is_signature_upload,
                    signature_url
                }
            };
            try {
                // global.config.mobileBaseUrl + global.config.version
                const response = await uploadPDFAndTimelineEntryAdd(global.config.mobileBaseUrl + global.config.version + '/account/timline/upload_pdf/add', makeRequestOptions);
                const body = JSON.parse(response.body);
                if (Number(body.status) === 200) {
                    console.log("fireTelcoDemoTimelineLogic | uploadPDFAndTimelineEntryAdd | Body: ", body);
                }
            } catch (error) {
                console.log("fireTelcoDemoTimelineLogic | uploadPDFAndTimelineEntryAdd | Error: ", error);
            }

            await sleep(1000);
            // Send email to the customer
            // try {
            //     let sendEmailRequest = Object.assign({}, request);
            //     sendEmailRequest.activity_form_id = 1528;
            //     sendEmailRequest.attachment_url = `https://demotelcoinc.s3.ap-south-1.amazonaws.com/${request.activity_id}.pdf`;
            //     sendEmailRequest.attachment_name = "proposal.pdf";
            //     sendEmailRequest.form_transaction_id = originFormTransactionID;
            //     sendEmailRequest.activity_id = request.activity_id;
            //     sendEmailRequest.activity_type_id = 140257;
            //     await self.demoTelcoSendEmail(sendEmailRequest);
            // } catch (error) {
            //     console.log("TelcoService | sendEmailRequest | demoTelcoSendEmail | Error: ", error);
            // }
        }

        if (
            formID === 1527
        ) {
            // Send email to the customer
            try {
                let sendEmailRequest = Object.assign({}, request);
                sendEmailRequest.activity_form_id = 1528;                
                sendEmailRequest.attachment_url = `https://demotelcoinc.s3.ap-south-1.amazonaws.com/${request.activity_id}_with_appr_signature.pdf`;
                sendEmailRequest.attachment_name = "proposal.pdf";
                sendEmailRequest.form_transaction_id = originFormTransactionID;
                sendEmailRequest.activity_id = request.activity_id;
                sendEmailRequest.activity_type_id = 140257;
                await self.demoTelcoSendEmail(sendEmailRequest);
            } catch (error) {
                console.log("TelcoService | sendEmailRequest | demoTelcoSendEmail | Error: ", error);
            }
        }

        // try {
        //     await addDeskAsParticipant({
        //         organization_id: request.organization_id,
        //         account_id: request.account_id,
        //         workforce_id: request.workforce_id,
        //         workflow_activity_id: request.activity_id,
        //         asset_id: 35532
        //     }, {
        //             first_name: "CEO",
        //             desk_asset_id: 35477,
        //             contact_phone_number: 9908000111,
        //             contact_phone_country_code: 91,
        //             asset_type_id: 133189,
        //         });
        // } catch (error) {
        //     console.log("TelcoService | addDeskAsParticipant | CEO | Error: ", error);
        // }

        if (
            formID === 1528
        ) {
            
        }
        return [false, []];
    }

    async function addTimelineText(request, text) {
        console.log("TelcoService | addTimelineText | request: ", request);

        let timelineTextRequest = Object.assign({}, request);

        timelineTextRequest.auth_asset_id = request.asset_id;
        timelineTextRequest.asset_id = 35532;
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
        timelineTextRequest.message_unique_id = util.getMessageUniqueId(35532);

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

        const addParticipantEvent = {
            name: "assignParticipnt",
            service: "activityParticipantService",
            method: "assignCoworker",
            payload: addParticipantRequest
        };

        queueWrapper.raiseActivityEvent(addParticipantEvent, request.workflow_activity_id, (err, resp) => {
            if (err) {
                console.log("TelcoService | addDeskAsParticipant | Error: ", err);
            } else {
                console.log("TelcoService | addDeskAsParticipant | Response: ", resp);
            }
        });
        return;
    }

    async function addCapexValueForm(request, workflowActivityID) {
        let addCapexFormRequest = Object.assign({}, request);

        // Fetch the next activity_id to and the form be inserted
        capexFormActivityId = await cacheWrapper.getActivityIdPromise();
        capexFormTransactionId = await cacheWrapper.getFormTransactionIdPromise();
        let activityInlineData = [{
            "form_id": 1526,
            "field_id": "13833",
            "field_name": "Capex Value",
            "field_data_type_id": 6,
            "field_data_type_category_id": 2,
            "data_type_combo_id": 0,
            "data_type_combo_value": "0",
            "field_value": "200000",
            "message_unique_id": 1560773711697
        }];

        addCapexFormRequest.activity_form_id = 1526;
        addCapexFormRequest.form_id = 1526;
        addCapexFormRequest.activity_id = capexFormActivityId;
        addCapexFormRequest.form_transaction_id = capexFormTransactionId;
        addCapexFormRequest.workflow_activity_id = workflowActivityID;
        addCapexFormRequest.activity_title = `${moment().utcOffset('+05:30').format('LLLL')} Capex Value`;
        addCapexFormRequest.activity_description = "Capex Value";
        addCapexFormRequest.activity_inline_data = JSON.stringify(activityInlineData);
        addCapexFormRequest.activity_datetime_start = util.getCurrentUTCTime();;
        addCapexFormRequest.activity_datetime_end = util.getCurrentUTCTime();;
        addCapexFormRequest.activity_type_category_id = 9;
        addCapexFormRequest.activity_sub_type_id = 0;
        addCapexFormRequest.activity_type_id = 140257;
        addCapexFormRequest.activity_access_role_id = 21;
        addCapexFormRequest.activity_status_type_category_id = 1;
        addCapexFormRequest.activity_status_type_id = 22;
        addCapexFormRequest.asset_participant_access_id = 21;
        addCapexFormRequest.activity_flag_file_enabled = -1;
        addCapexFormRequest.activity_parent_id = 0;
        addCapexFormRequest.flag_pin = 0;
        addCapexFormRequest.flag_offline = 0;
        addCapexFormRequest.flag_retry = 0;
        addCapexFormRequest.message_unique_id = util.getMessageUniqueId(35532);
        addCapexFormRequest.device_os_id = 5;
        addCapexFormRequest.activity_stream_type_id = 705;
        addCapexFormRequest.activity_timeline_collection = JSON.stringify({
            "mail_body": "Capex Value Form",
            "asset_reference": [],
            "activity_reference": [],
            "form_approval_field_reference": [],
            "subject": "Capex Value Form",
            "attachments": [],
            "content": "Form Submitted",
            "form_submitted": activityInlineData,
            "form_id": 1526
        });
        addCapexFormRequest.data_entity_inline = JSON.stringify(activityInlineData);
        addCapexFormRequest.flag_timeline_entry = 1;
        addCapexFormRequest.asset_id = 35532;
        addCapexFormRequest.organization_id = 898;
        addCapexFormRequest.account_id = 1013;
        addCapexFormRequest.workforce_id = 5616;
        console.log("addActivityAsync | Capex Value Add | Request: ", addCapexFormRequest);

        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        try {
            await addActivityAsync(addCapexFormRequest);
        } catch (error) {
            console.log("TelcoService | addCapexValueForm | addActivityAsync | Error: ", error);
        }

        let workflowFile705Request = Object.assign({}, addCapexFormRequest);
        workflowFile705Request.data_activity_id = capexFormActivityId;
        workflowFile705Request.activity_id = workflowActivityID;
        workflowFile705Request.workflow_activity_id = workflowActivityID;
        workflowFile705Request.organization_id = 898;
        workflowFile705Request.account_id = 1013;
        workflowFile705Request.workforce_id = 5616;
        console.log("addTimelineTransaction | Capex Value Add | Request: ", workflowFile705Request);

        await (1000);
        try {
            // await addTimelineTransactionAsync(workflowFile713Request);
            let workflowFile705RequestEvent = {
                name: "addTimelineTransaction",
                service: "activityTimelineService",
                method: "addTimelineTransaction",
                payload: workflowFile705Request
            };

            queueWrapper.raiseActivityEvent(workflowFile705RequestEvent, workflowActivityID, (err, resp) => {
                if (err) {
                    console.log("\x1b[35m [ERROR] Raising queue activity raised for 713 streamtypeid for Workflow/Process file. \x1b[0m", err);
                } else {
                    console.log("\x1b[35m Raising queue activity raised for 713 streamtypeid for Workflow/Process file. \x1b[0m");
                }
            });
        } catch (error) {
            console.log("addTimelineTransaction | Error: ", error);
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.demoTelcoSendEmail = async function (request) {
        return new Promise((resolve, reject) => {
            console.log("\x1b[35m [Log] Inside demoTelcoSendEmail \x1b[0m");

            let customerName = "", customerEmail = "";

            if (request.form_transaction_id > 0) {
                request.form_id = 1524;
                activityCommonService.getFormTransactionDataAll(request).then((workflowActivityData) => {
                    //console.log('workflowActivityData ',workflowActivityData);
                    //JSONArray ar = workflowActivityData.activity_inline_data;
                    if (workflowActivityData.length >= 1) {
                        forEachAsync(workflowActivityData, (next, row) => {
                            if (row.field_id === 13836 || row.field_id === 13839 || row.field_id === 13777)
                                customerName = customerName || row.data_entity_text_1;
                            else if (row.field_id === 13838 || row.field_id === 13841 || row.field_id === 13779)
                                customerEmail = customerEmail || row.data_entity_text_1;

                            next();
                        }).then(() => {
                            console.log("Before Preparation of Template");
                            prepareTemplateNsend(request, customerName, customerEmail);
                            resolve();
                        })
                    } else {
                        console.log("form Data <> 1 ", workflowActivityData.length);
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    function prepareTemplateNsend(request, customerName, customerEmail) {

        return new Promise((resolve, reject) => {

            let date = util.getFormatedSlashDate();
            try {
                const jsonString = {
                    organization_id: request.organization_id,
                    account_id: request.account_id,
                    workforce_id: request.workforce_id,
                    asset_id: 35505,
                    asset_token_auth: "54188fa0-f904-11e6-b140-abfd0c7973d9",
                    auth_asset_id: 100,
                    activity_id: request.activity_id || 0,
                    activity_type_category_id: 9,
                    activity_type_id: 140138,
                    activity_stream_type_id: 705,
                    activity_type_id_form: 140138,
                    form_id: Number(request.activity_form_id),
                    type: 'approval'
                };

                console.log('customerEmail ::', customerEmail);
                //customerEmail = 'sravan@grenerobotics.com';
                /*  
                if (String(customerCollection.contactEmailId).includes('%40')) {
                    customerCollection.contactEmailId = String(customerCollection.contactEmailId).replace(/%40/g, "@");
                } */

                const encodedString = Buffer.from(JSON.stringify(jsonString)).toString('base64');

                const baseUrlUpload = global.config.emailbaseUrlUpload + "/#/forms/edit/" + encodedString;

                openingMessage = "Please verify the proposal form and upload the PO.";
                callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"

                const Template = `
 <table style='border-collapse: collapse !important;' width='100%' bgcolor='#ffffff' border='0' cellpadding='10' cellspacing='0'>
    <tbody><tr> <td> 
    <table bgcolor='#ffffff' style='width: 100%;max-width: 600px;' class='content' align='center' cellpadding='0' cellspacing='0' border='0'> 
    <tbody><tr><td align='center' valign='top'><table style='border: 1px solid #e2e2e2; border-radius: 4px; background-clip: padding-box; border-spacing: 0;' border='0' cellpadding='0' cellspacing='0' width='100%' id='templateContainer'>
    <tbody> <tr> <td align='left' style='float: right;' valign='top'>
    <img style='width: 600px' src ='https://staging.officedesk.app/header_banner_generic.png'/> 
    <table style='position: relative;top: -30px;left: 215px;font-size:12px;color: #fff;font-family: Helvetica;'>
    <tbody><tr><td><strong>Team</strong></td></tr></tbody>
    </table>
    </td> 
    </tr> 
     <tr>
    <td valign='top' style=' color: #505050; font-family: Helvetica; font-size: 14px; line-height: 150%; padding-top: 3.143em; padding-right: 3.5em; padding-left: 3.5em; padding-bottom: 1em; text-align: left;' class='bodyContent' mc:edit='body_content'> 
     <p style='  display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>
   Date: ${date}</p> 
    <p style=' color: #f47920; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>
    Dear <strong>${customerName},</strong></p> 
   
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>
    Thank you very much for your interest in our services.</p> 

    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 30px; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>Based on the inputs provided by you, attached please find our proposal for your perusal. We hope you find the same to be in line with your requirements and look forward to your valued order.</p> 
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 30px; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>To place your order, kindly upload the Purchase Order (PO) using the below link for us to proceed with the delivery of your order.</p> 
   
    <a style='background: #f47920;display: inline-block;color: #FFFFFF;text-decoration: none;font-size: 12px;margin-top: 1.0em;background-clip: padding-box;padding: 5px 15px;box-shadow: 4px 4px 6px 1px #cbcbcb;margin-left:10px' target='_blank' class='blue-btn' href='${baseUrlUpload}'>Upload PO</a> 
    
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 30px; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>
    Should you have any queries or seek additional information, please feel free to reach us on 7032979378.</p> 
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>
    Thanking you and assuring you of our best services at all times.</p> 

    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 40px; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'> Regards, </p> 
    <p style=' color: #f47920; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0px; margin-left: 0; text-align: left;'>  </p> 
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 20px; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Sales Department</p> 
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Grene Telco </p> </td></tr> 

    <tr>
        <td style='padding: 40px;color: #c8c8c8;'>
            <p style='font-family: Helvetica;font-size: 9px;'>This E-Mail (including any attachments) may contain Confidential and/or legally privileged Information and is meant for the intended recipient(s) only. If you have received this e-mail in error and are not the intended recipient/s, kindly delete this e-mail immediately from your system. You are also hereby notified that any use, any form of reproduction, dissemination, copying, disclosure, modification, distribution and/or publication of this e-mail, its contents or its attachment/s other than by its intended recipient/s is strictly prohibited and may be construed unlawful. Internet Communications cannot be guaranteed to be secure or error-free as information could be delayed, intercepted, corrupted, lost, or may contain viruses. Vodafone Idea Limited does not accept any liability for any errors, omissions, viruses or computer shutdown (s) or any kind of disruption/denial of services if any experienced by any recipient as a result of this e-mail.</p>
        </td>
    </tr>

  </tbody></table> </td> </tr></tbody></table>`;

                //request.email_sender = 'vodafone_idea@grenerobotics.com';
                //request.email_sender_name = 'vodafone_idea grenerobotics.com';
                request.email_sender = 'support@grenerobotics.com';
                request.email_sender_name = 'Grene Telco';

                util.sendEmailDemoTelco(request,
                    customerEmail,
                    openingMessage,
                    "IGNORE",
                    Template,
                    (err, data) => {
                        if (err) {
                            console.log("[Send Email On Form Submission | Error]: ", data);
                        } else {
                            console.log("[Send Email On Form Submission | Response]: ", "Email Sent");
                        }

                        resolve();
                    });
            } catch (err) {
                console.log(err);
            }

        });
    }
}


module.exports = TelcoService;
