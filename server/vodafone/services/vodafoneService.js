/*
 * author: Nani Kalyan V
 */

function VodafoneService(objectCollection) {

    const queueWrapper = objectCollection.queueWrapper;
    const util = objectCollection.util;
    const db = objectCollection.db;
    const forEachAsync = objectCollection.forEachAsync;
    const activityPushService = objectCollection.activityPushService;
    const activityCommonService = objectCollection.activityCommonService;
    const makeRequest = require('request');
    const uuid = require('uuid');
    const fs = require('fs');

    var NEW_ORDER_FORM_ID,
        SUPPLEMENTARY_ORDER_FORM_ID,
        FR_FORM_ID,
        CRM_FORM_ID,
        HLD_FORM_ID,
        CAF_FORM_ID,
        ACCOUNT_MANAGER_APPROVAL_FORM_ID,
        CUSTOMER_APPROVAL_FORM_ID,
        CRM_ACK_FORM_ID;

    var CAF_ORGANIZATION_ID,
        CAF_ACCOUNT_ID,
        CAF_WORKFORCE_ID,
        CAF_ACTIVITY_TYPE_ID;

    var CAF_BOT_ASSET_ID, CAF_BOT_ENC_TOKEN;

    var VODAFONE_FORM_FILE_QUEUE_ID;

    var ACTIVITY_STATUS_ID_VALIDATION_PENDING,
        ACTIVITY_STATUS_ID_APPROVAL_PENDING,
        ACTIVITY_STATUS_ID_ORDER_CLOSED;
    //
    const formFieldIdMapping = util.getVodafoneFormFieldIdMapping();
    const romsCafFieldsData = util.getVodafoneRomsCafFieldsData();

    var NEW_ORDER_TO_CAF_FIELD_ID_MAP,
        SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP,
        FR_TO_CAF_FIELD_ID_MAP,
        CRM_TO_CAF_FIELD_ID_MAP,
        HLD_TO_CAF_FIELD_ID_MAP,
        ROMS_CAF_FORM_LABELS,
        ROMS_CAF_FIELDS_DATA,
        CAF_TO_CRM_PORTAL_PUSH_MAP;

    if (global.mode === 'preprod' || global.mode === 'local' || global.mode === 'staging') {
        // BETA
        NEW_ORDER_FORM_ID = 873;
        SUPPLEMENTARY_ORDER_FORM_ID = 874;
        FR_FORM_ID = 871;
        CRM_FORM_ID = 870;
        HLD_FORM_ID = 869;
        CAF_FORM_ID = 872;
        ACCOUNT_MANAGER_APPROVAL_FORM_ID = 875;
        CUSTOMER_APPROVAL_FORM_ID = 882;
        CRM_ACK_FORM_ID = 868;

        // CAF
        CAF_ORGANIZATION_ID = 860; // Vodafone Idea Beta
        CAF_ACCOUNT_ID = 975; // Central OMT Beta
        CAF_WORKFORCE_ID = 5355; // Lobby
        CAF_ACTIVITY_TYPE_ID = 133250;

        // CAF BOT | BOT #5
        CAF_BOT_ASSET_ID = 31347;
        CAF_BOT_ENC_TOKEN = "05986bb0-e364-11e8-a1c0-0b6831833754";

        // STATUS
        ACTIVITY_STATUS_ID_VALIDATION_PENDING = 280032;
        ACTIVITY_STATUS_ID_APPROVAL_PENDING = 280033;
        ACTIVITY_STATUS_ID_ORDER_CLOSED = 280034;

        // Form Field ID Mappings
        NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
        SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
        FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.FR_TO_CAF_FIELD_ID_MAP;
        CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.CRM_TO_CAF_FIELD_ID_MAP;
        HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.HLD_TO_CAF_FIELD_ID_MAP;
        CAF_TO_CRM_PORTAL_PUSH_MAP = formFieldIdMapping.BETA.CAF_TO_CRM_PORTAL_PUSH_MAP;

        // ROMS Labels
        ROMS_CAF_FORM_LABELS = formFieldIdMapping.BETA.ROMS_LABELS;
        // ROMS CAF Fields Data | Process, Update & Append
        ROMS_CAF_FIELDS_DATA = romsCafFieldsData.BETA;

        // Queue to map or unmap a form file
        VODAFONE_FORM_FILE_QUEUE_ID = 2;


    } else if (global.mode === 'prod' || global.mode === 'staging' || global.mode === 'dev') {
        // LIVE
        NEW_ORDER_FORM_ID = 856;
        SUPPLEMENTARY_ORDER_FORM_ID = 857;
        FR_FORM_ID = 866;
        CRM_FORM_ID = 865;
        HLD_FORM_ID = 864;
        CAF_FORM_ID = 867;
        ACCOUNT_MANAGER_APPROVAL_FORM_ID = 858;
        CUSTOMER_APPROVAL_FORM_ID = 878;
        CRM_ACK_FORM_ID = 863;

        // CAF
        CAF_ORGANIZATION_ID = 858; // Vodafone Idea Beta
        CAF_ACCOUNT_ID = 973; // Central OMT Beta
        CAF_WORKFORCE_ID = 5345; // Lobby
        CAF_ACTIVITY_TYPE_ID = 133000;

        // CAF BOT | BOT #5
        CAF_BOT_ASSET_ID = 31298;
        CAF_BOT_ENC_TOKEN = "3dc16b80-e338-11e8-a779-5b17182fa0f6";

        // STATUS
        ACTIVITY_STATUS_ID_VALIDATION_PENDING = 279438;
        ACTIVITY_STATUS_ID_APPROVAL_PENDING = 279439;
        ACTIVITY_STATUS_ID_ORDER_CLOSED = 279440;

        // Form Field ID Mappings
        NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
        SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
        FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.FR_TO_CAF_FIELD_ID_MAP;
        CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.CRM_TO_CAF_FIELD_ID_MAP;
        HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.HLD_TO_CAF_FIELD_ID_MAP;
        CAF_TO_CRM_PORTAL_PUSH_MAP = formFieldIdMapping.LIVE.CAF_TO_CRM_PORTAL_PUSH_MAP;

        // ROMS Labels
        ROMS_CAF_FORM_LABELS = formFieldIdMapping.LIVE.ROMS_LABELS;
        // ROMS CAF Fields Data | Process, Update & Append
        ROMS_CAF_FIELDS_DATA = romsCafFieldsData.LIVE;
        
        // Queue to map or unmap a form file
        VODAFONE_FORM_FILE_QUEUE_ID = 1;
    }

    this.newOrderFormSubmission = function (request, callback) {
        //Step 1
        //Change the status to Customer approval
        request.flag = 1;
        request.asset_type_id = 122992;
        changeStatusToCustApproval(request).then(() => {});

        let firstName = '',
            contactCompany = '',
            contactPhoneCountryCode = 0,
            contactPhoneNumber = 0,
            contactEmailId = '',
            contactDesignation = '';

        const formData = JSON.parse(request.activity_inline_data);

        formData.forEach(formEntry => {
            switch (Number(formEntry.field_id)) {

                case 5020: // 837 | Company (Customer)Name
                    contactCompany = formEntry.field_value;
                    break;

                case 5023: // 837 | Name
                case 5276: // 844 | Name
                    firstName = formEntry.field_value;
                    break;

                case 5024: // 837 | Contact Number
                case 5277: // 844 | Contact Number
                    contactPhoneCountryCode = String(formEntry.field_value).split('||')[0];
                    contactPhoneNumber = String(formEntry.field_value).split('||')[1];
                    break;

                case 5025: // 837 | Email
                case 5278: // 844 | Email
                    contactEmailId = formEntry.field_value;
                    break;

                case 5029: // 837 | Designation
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

                // Check for form_id
                if (Number(request.activity_form_id) === 844) {
                    // Send the email to the customer's email
                    vodafoneSendEmail(request, {
                        firstName,
                        contactPhoneCountryCode,
                        contactPhoneNumber,
                        contactEmailId,
                        customerServiceDeskAssetID: DeskAssetID
                    }, () => {})
                    return callback();
                }

                leastLoadedDesk1(request).then((data) => {
                    var lowestCnt = 99999;
                    var deskToBeAssigned;

                    global.logger.write('debug', 'data.length : ' + data.length, {}, request);
                    if (Number(data.length) > 0) {
                        forEachAsync(data, (next, rowData) => {
                            global.logger.write('debug', 'rowData.count : ' + rowData.count, {}, request);
                            global.logger.write('debug', 'lowestCnt : ' + lowestCnt, {}, request);

                            if (rowData.count < lowestCnt) {
                                lowestCnt = rowData.count;
                                deskToBeAssigned = rowData;
                            }
                            next();
                        }).then(() => {
                            //callback(false, {data: deskToBeAssigned}, 200);

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
                                    },
                                    { //Assigning the Least assigned Administrator 
                                        "access_role_id": 29, //Ask Sai; What should be the role id for Administrator
                                        "account_id": 971,
                                        "activity_id": Number(request.activity_id),
                                        "asset_datetime_last_seen": "1970-01-01 00:00:00",
                                        "asset_first_name": deskToBeAssigned.asset_first_name,
                                        "asset_id": deskToBeAssigned.asset_id,
                                        "asset_image_path": "",
                                        "asset_last_name": "",
                                        "asset_phone_number": deskToBeAssigned.operating_asset_phone_number,
                                        "asset_phone_number_code": deskToBeAssigned.operating_asset_phone_country_code,
                                        "asset_type_category_id": 45, //Ask Sai; Is this the correct asset_type_category id
                                        "asset_type_id": request.asset_type_id, //Ask Sai; Double check is this the asset_type_id
                                        "field_id": 0,
                                        "log_asset_id": 31035,
                                        "message_unique_id": util.getMessageUniqueId(Number(request.asset_id)),
                                        "operating_asset_first_name": deskToBeAssigned.operating_asset_first_name,
                                        "organization_id": 856,
                                        "workforce_id": 5344 //Ask Sai; Is the workforce_id correct
                                    }
                                ]),
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

                                    // Send the email to the customer's email
                                    vodafoneSendEmail(request, {
                                        firstName,
                                        contactPhoneCountryCode,
                                        contactPhoneNumber,
                                        contactEmailId,
                                        customerServiceDeskAssetID: DeskAssetID
                                    }, () => {})
                                }
                            });

                        });
                    }
                }).catch((err) => {
                    callback(false, {}, 200);
                });

            }
            callback();
        });
    };

    function changeStatusToCustApproval(request) {
        return new Promise((resolve, reject) => {

            var newRequest = Object.assign(request);
            newRequest.activity_status_id = " "; //Ask Sai;
            newRequest.activity_status_type_id = ""; //Ask Sai;
            newRequest.activity_status_type_category_id = ""; //Ask Sai;
            newRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);

            var event = {
                name: "alterActivityStatus",
                service: "activityService",
                method: "alterActivityStatus",
                payload: newRequest
            };

            queueWrapper.raiseActivityEvent(event, newRequest.activity_id, (err, resp) => {
                if (err) {
                    console.log("\x1b[35m [ERROR] Raising queue activity raised for changing the status to customer approval. \x1b[0m")
                } else {
                    console.log("\x1b[35m Queue activity raised for changing the status to customer approval. \x1b[0m");
                }
            });

            resolve();
        });
    }

    function vodafoneSendEmail(request, customerCollection) {
        return new Promise((resolve, reject) => {
            console.log("\x1b[35m [Log] Inside vodafoneSendEmail \x1b[0m")

            let fieldHTML = '',
                nameStr = unescape(customerCollection.firstName),
                emailSubject = '',
                callToction,
                openingMessage = 'Please verify the below form details.';

            const jsonString = {
                asset_id: Number(customerCollection.customerServiceDeskAssetID),
                activity_id: Number(request.activity_id),
                type: 'approval'
            }

            if (String(customerCollection.contactEmailId).includes('%40')) {
                customerCollection.contactEmailId = String(customerCollection.contactEmailId).replace(/%40/g, "@");
            }

            const encodedString = Buffer.from(JSON.stringify(jsonString)).toString('base64');

            const baseUrlApprove = "https://preprodmydesk.desker.co/#/customapproval/" + encodedString;
            const baseUrlUpload = "https://preprodmydesk.desker.co/#/customupload/" + encodedString;

            if (Number(request.activity_form_id) === 837) {

                emailSubject = 'Upload Documents for Order';
                openingMessage = "Please verify the order details and upload the required documentation.";
                callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"

            } else if (Number(request.activity_form_id) === 844) {

                emailSubject = "Approve Order Data";
                openingMessage = "Please verify the customer application form and approve by providing a digital signature.";
                callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlApprove + "'>APPROVE</a>"

            }

            const formData = JSON.parse(request.activity_inline_data);

            formData.forEach(formEntry => {

                switch (Number(formEntry.field_data_type_category_id)) {
                    case 8:
                        /// Only Label
                        fieldHTML += "<table style='width: 100%;margin-top:5px; '><tr><td style='width: 100%;padding: 5px 5px 5px 10px;font-size: 10px;'>";
                        fieldHTML += unescape(formEntry.field_name);
                        fieldHTML += "</td></tr>  </table>";
                        break;

                    default:
                        fieldHTML += "<table style='width: 100%;margin-top:5px; '><tr><td style='width: 100%;border: 1px solid #cbcbcb;padding: 5px 5px 5px 10px;background: #e3e3e3;font-size: 10px;'>";
                        fieldHTML += unescape(formEntry.field_name);
                        fieldHTML += "</td></tr> <tr><td style='border: 1px solid #cbcbcb;border-top: 0px;padding: 5px 5px 5px 10px;font-size: 12px;'>";
                        fieldHTML += unescape(formEntry.field_value);
                        fieldHTML += "</td></tr> </table>";
                        break;
                }
            });

            console.log("\x1b[35m [vodafoneSendEmail] fieldHTML: \x1b[0m", fieldHTML)
            const allFields = fieldHTML;

            const templateDesign = "<table style='border-collapse: collapse !important;' width='100%' bgcolor='#ffffff' border='0' cellpadding='10' cellspacing='0'><tbody><tr> <td> <table bgcolor='#ffffff' style='width: 100%;max-width: 600px;' class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tbody><tr><td align='center' valign='top'><table style='border: 1px solid #e2e2e2; border-radius: 4px; background-clip: padding-box; border-spacing: 0;' border='0' cellpadding='0' cellspacing='0' width='100%' id='templateContainer'><tbody> <tr> <td align='left' style='float: right;padding: 20px;' valign='top'> <img style='width: 100px' src ='https://office.desker.co/Vodafone_logo.png'/> <img style='height: 44px;margin-left: 10px;' src ='https://office.desker.co/Idea_logo.png'/> </td> </tr> <tr><td valign='top' style=' color: #505050; font-family: Helvetica; font-size: 14px; line-height: 150%; padding-top: 3.143em; padding-right: 3.5em; padding-left: 3.5em; padding-bottom: 3.143em; text-align: left;' class='bodyContent' mc:edit='body_content'> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>Hey " + nameStr + ",</p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>" + openingMessage + "</p> <p style=' color: #808080; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: bold; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 10px; margin-left: 0; text-align: left;'>Order Management Form</p> " + allFields + "<table style='width: 100%;margin-top: 5px'></table> " + callToction + " <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 40px; margin-right: 0; margin-bottom: 0px; margin-left: 0; text-align: left;'> Parmeshwar Reddy </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Vice President </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Customer Care </p></td></tr> <tr> <td style='height: 35px;background: #cbcbcb;'></td> </tr></tbody></table><!-- // END BODY --></td></tr> </tbody></table> </td> </tr></tbody></table>";

            util.sendEmailV2(request,
                customerCollection.contactEmailId,
                emailSubject,
                "IGNORE",
                templateDesign,
                (err, data) => {
                    if (err) {
                        console.log("[Send Email On Form Submission | Error]: ", data);
                    } else {
                        console.log("[Send Email On Form Submission | Response]: ", "Email Sent");
                    }

                    resolve();
                });
        });


    }

    this.addFeasibilityChecker = function (request, callback) {

        request.flag = 1;
        request.asset_type_id = 122965;

        this.leastLoadedDesk(request).then((data) => {
            var lowestCnt = 99999;
            var deskToBeAssigned;

            global.logger.write('debug', 'data.length : ' + data.length, {}, request);
            if (Number(data.length) > 0) {
                forEachAsync(data, (next, rowData) => {
                    global.logger.write('debug', 'rowData.count : ' + rowData.count, {}, request);
                    global.logger.write('debug', 'lowestCnt : ' + lowestCnt, {}, request);

                    if (rowData.count < lowestCnt) {
                        lowestCnt = rowData.count;
                        deskToBeAssigned = rowData;
                    }
                    next();
                }).then(() => {
                    //callback(false, {data: deskToBeAssigned}, 200);
                    var activityParticipantCollection = [{
                        "access_role_id": 22,
                        "account_id": 971,
                        "activity_id": request.activity_id,
                        "asset_datetime_last_seen": "1970-01-01 00:00:00",
                        "asset_first_name": deskToBeAssigned.asset_first_name, //"Feasibility Checker",
                        "asset_id": deskToBeAssigned.asset_id, //30998
                        "asset_image_path": "",
                        "asset_last_name": "",
                        "asset_phone_number": deskToBeAssigned.operating_asset_phone_number,
                        "asset_phone_number_code": deskToBeAssigned.operating_asset_phone_country_code,
                        "asset_type_category_id": 3,
                        "asset_type_id": 122940,
                        "field_id": 0,
                        "log_asset_id": request.asset_id,
                        "operating_asset_first_name": deskToBeAssigned.operating_asset_first_name,
                        "organization_id": 856,
                        "workforce_id": 5336,
                    }];

                    request.message_unique_id = util.getMessageUniqueId(request.asset_id);
                    request.activity_access_role_id = 22;
                    request.activity_participant_collection = JSON.stringify(activityParticipantCollection);

                    const event = {
                        name: "assignParticipnt",
                        service: "activityParticipantService",
                        method: "assignCoworker",
                        payload: request
                    };

                    if (Number(request.activity_status_id) === 278416) {
                        // Feasibility Check 
                        queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                            if (err) {
                                console.log("\x1b[35m [ERROR] Raising queue activity raised for adding Feasibility Checker as a participant. \x1b[0m")
                            } else {
                                console.log("\x1b[35m Queue activity raised for adding Feasibility Checker as a participant. \x1b[0m")
                            }
                        });
                    }

                });
            }
        });

        callback();
    };


    this.addTimelineTransactionVodafone = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id) || 9;
        var activityStreamTypeId = Number(request.activity_stream_type_id) || 325;
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        if (activityTypeCategoryId === 9 && activityStreamTypeId === 705) { // add form case
            var formDataJson = JSON.parse(request.activity_timeline_collection);
            request.form_id = formDataJson[0]['form_id'];
            //console.log('form id extracted from json is: ' + formDataJson[0]['form_id']);
            global.logger.write('debug', 'form id extracted from json is: ' + formDataJson[0]['form_id'], {}, request);
            var lastObject = formDataJson[formDataJson.length - 1];
            //console.log('Last object : ', lastObject)
            global.logger.write('debug', 'Last object : ' + lastObject, {}, request);
            if (lastObject.hasOwnProperty('field_value')) {
                //console.log('Has the field value in the last object')
                global.logger.write('debug', 'Has the field value in the last object', {}, request);
                //remote Analytics
                if (request.form_id == 325) {
                    //monthlySummaryTransInsert(request).then(() => {}); 
                }
            }
            // add form entries
            addFormEntries(request, function (err, approvalFieldsArr) {});
        } else {
            request.form_id = 0;
        }
        try {
            var formDataJson = JSON.parse(request.activity_timeline_collection);
        } catch (exception) {
            //console.log(exception);
            global.logger.write('debug', exception, {}, request);
        }

        var isAddToTimeline = true;
        if (request.hasOwnProperty('flag_timeline_entry'))
            isAddToTimeline = (Number(request.flag_timeline_entry)) > 0 ? true : false;
        if (isAddToTimeline) {
            activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {
                if (err) {

                } else {

                    activityPushService.sendPush(request, objectCollection, 0, function () {});
                    activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});

                    //updating log differential datetime for only this asset
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {});

                    (request.hasOwnProperty('signedup_asset_id')) ?
                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, 0, function (err, data) {}): //To increase unread cnt for marketing manager
                        activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});

                    if (request.auth_asset_id == 31035 && request.flag_status_alter == 1) {

                        request.asset_type_id = 122964;
                        leastLoadedDesk1(request).then((data) => {
                            var lowestCnt = 99999;
                            var deskToBeAssigned;

                            global.logger.write('debug', 'data.length : ' + data.length, {}, request);
                            if (Number(data.length) > 0) {
                                forEachAsync(data, (next, rowData) => {
                                    global.logger.write('debug', 'rowData.count : ' + rowData.count, {}, request);
                                    global.logger.write('debug', 'lowestCnt : ' + lowestCnt, {}, request);

                                    if (rowData.count < lowestCnt) {
                                        lowestCnt = rowData.count;
                                        deskToBeAssigned = rowData;
                                    }
                                    next();
                                }).then(() => {
                                    var newRequestOne = Object.assign(request);

                                    //Adding the Document Validator
                                    var activityParticipantCollection = [{
                                        "organization_id": 856,
                                        "account_id": 971,
                                        "workforce_id": 5336,
                                        "asset_id": deskToBeAssigned.asset_id, //30983, ASK SAI
                                        "activity_id": request.activity_id,
                                        "asset_type_category_id": 3,
                                        "asset_type_id": 122940,
                                        "access_role_id": 29
                                    }];
                                    newRequestOne.organization_id = 856;
                                    newRequestOne.account_id = 971;
                                    newRequestOne.workforce_id = 5344;

                                    newRequestOne.activity_participant_collection = JSON.stringify(activityParticipantCollection);
                                    newRequestOne.message_unique_id = util.getMessageUniqueId(31035);
                                    newRequestOne.url = "/" + global.config.version + "/activity/participant/access/set";

                                    var event = {
                                        name: "assignParticipnt",
                                        service: "activityParticipantService",
                                        method: "assignCoworker",
                                        payload: newRequestOne
                                    };

                                    queueWrapper.raiseActivityEvent(event, newRequestOne.activity_id, (err, resp) => {
                                        if (err) {
                                            global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                        } else {
                                            //Altering the status to Document Validation
                                            var newRequest = Object.assign(newRequestOne);

                                            newRequest.activity_status_id = 278803;
                                            newRequest.activity_status_type_id = 22;
                                            newRequest.message_unique_id = util.getMessageUniqueId(31035);
                                            newRequest.url = "/" + global.config.version + "/activity/status/alter";

                                            var event = {
                                                name: "alterActivityStatus",
                                                service: "activityService",
                                                method: "alterActivityStatus",
                                                payload: newRequest
                                            };

                                            queueWrapper.raiseActivityEvent(event, newRequest.activity_id, (err, resp) => {
                                                if (err) {
                                                    global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                                } else {}
                                            });
                                        }
                                        resolve();
                                    });
                                });
                            }
                        });
                    }
                }
            });
        }
        callback(false, {}, 200);
    };


    //Document Validator = 122964; 
    //Feasibility Checker = 122965; 
    //Administrator (Account Manager) = 122992
    this.leastLoadedDesk = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.flag,
                request.form_id,
                request.asset_type_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.page_start || 0,
                request.page_limit || 50
            );
            var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_least_loaded_asset', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        console.log('Dataa from DB: ', data);
                        resolve(data)
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    function leastLoadedDesk1(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.flag,
                request.form_id,
                request.asset_type_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.page_start || 0,
                request.page_limit || 50
            );
            var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_least_loaded_asset', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        console.log('Dataa from DB: ', data);
                        resolve(data)
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.buildAndSubmitCafForm = function (request, callback) {

        var cafFormJson = [];
        var formId = NEW_ORDER_FORM_ID;

        // Pull the required data from the NEW ORDER FORM of the form file
        activityCommonService
            .getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
            .then((newOrderFormData) => {
                // Append it to cafFormJson
                if (newOrderFormData.length > 0) {
                    cafFormJson = applyTransform(cafFormJson, JSON.parse(newOrderFormData[0].data_entity_inline), formId);
                }
                // Pull the required data from the SUPPLEMENTARY ORDER FORM of the form file
                formId = SUPPLEMENTARY_ORDER_FORM_ID;
                return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
            })
            .then((supplementaryOrderFormData) => {
                // Append it to cafFormJson
                // 
                if (supplementaryOrderFormData.length > 0) {
                    cafFormJson = applyTransform(cafFormJson, JSON.parse(supplementaryOrderFormData[0].data_entity_inline), formId);
                }
                // Pull the required data from the SUPPLEMENTARY ORDER FORM of the form file
                formId = FR_FORM_ID;
                return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
            })
            .then((frFormData) => {
                if (frFormData.length > 0) {
                    cafFormJson = applyTransform(cafFormJson, JSON.parse(frFormData[0].data_entity_inline), formId);
                }
                // Pull the required data from the CRM FORM of the form file
                formId = CRM_FORM_ID;
                return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
            })
            .then((crmFormData) => {
                // Append it to cafFormJson
                if (crmFormData.length > 0) {
                    cafFormJson = applyTransform(cafFormJson, JSON.parse(crmFormData[0].data_entity_inline), formId);
                }
                // Pull the required data from the HLD FORM of the form file
                formId = HLD_FORM_ID;
                return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)

            })
            .then(async (hldFormData) => {
                // Append it to cafFormJson
                if (hldFormData.length > 0) {
                    cafFormJson = applyTransform(cafFormJson, JSON.parse(hldFormData[0].data_entity_inline), formId);
                }

                // Deduce all the additional data required for the CAF Form building
                // 
                // Sum all relevant fields and store them
                const calculatedValuesJSON = calculateAllSums(cafFormJson);
                var formParticipantsData,
                    activityListData;
                // Fetch participants data
                await activityCommonService
                    .getAllParticipantsPromise(request)
                    .then((participantData) => {
                        if (participantData.length) {
                            formParticipantsData = participantData;
                        }
                    })
                
                const romsCafFieldsAndValues = populateRomsCafFieldValues(
                    Object.assign(ROMS_CAF_FIELDS_DATA),
                    calculatedValuesJSON,
                    formParticipantsData
                );

                // console.log("calculatedValuesJSON: ", calculatedValuesJSON);
                // console.log("formParticipantsData: ", formParticipantsData);
                // console.log("ROMS_CAF_FIELDS_DATA: ", ROMS_CAF_FIELDS_DATA);
                // Append fields which need to be calculated, and then appended. I am just
                // appending them for now with default/empty values. T H I S ~ N E E D S ~ W O R K.
                cafFormJson = cafFormJson.concat(romsCafFieldsAndValues);

                // Append the Labels
                cafFormJson = appendLabels(cafFormJson)

                // console.log("[FINAL] cafFormJson: ", cafFormJson);
                // fs.appendFileSync('pdfs/caf.json', JSON.stringify(cafFormJson));
                
                // callback(false, cafFormJson);
                // return;
                // 
                // Build the full and final CAF Form and submit the form data to the timeline of the form file
                var cafFormSubmissionRequest = {
                    organization_id: CAF_ORGANIZATION_ID,
                    account_id: CAF_ACCOUNT_ID,
                    workforce_id: CAF_WORKFORCE_ID,
                    asset_id: request.asset_id, // CAF_BOT_ASSET_ID,
                    asset_token_auth: request.asset_token_auth, // CAF_BOT_ENC_TOKEN,
                    asset_message_counter: 0,
                    activity_title: "CAF",
                    activity_description: "CAF",
                    activity_inline_data: JSON.stringify(cafFormJson),
                    activity_datetime_start: util.getCurrentUTCTime(),
                    activity_datetime_end: util.getCurrentUTCTime(),
                    activity_type_category_id: 9,
                    activity_sub_type_id: 0,
                    activity_type_id: CAF_ACTIVITY_TYPE_ID,
                    activity_access_role_id: 21,
                    asset_participant_access_id: 21,
                    activity_parent_id: 0,
                    flag_pin: 0,
                    flag_priority: 0,
                    activity_flag_file_enabled: -1,
                    activity_form_id: CAF_FORM_ID,
                    flag_offline: 0,
                    flag_retry: 0,
                    message_unique_id: util.getMessageUniqueId(CAF_BOT_ASSET_ID),
                    activity_channel_id: 0,
                    activity_channel_category_id: 0,
                    activity_flag_response_required: 0,
                    track_latitude: 0.0,
                    track_longitude: 0.0,
                    track_altitude: 0,
                    track_gps_datetime: util.getCurrentUTCTime(),
                    track_gps_accuracy: 0,
                    track_gps_status: 0,
                    service_version: "1.0",
                    app_version: "2.5.7",
                    device_os_id: 5
                };

                const cafRequestOptions = {
                    form: cafFormSubmissionRequest
                }

                makeRequest.post(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', cafRequestOptions, function (error, response, body) {
                    console.log("[cafFormSubmissionRequest] Body: ", body);
                    console.log("[cafFormSubmissionRequest] Error: ", error);
                    body = JSON.parse(body);
                    console.log('\x1b[36m body \x1b[0m', body);

                    if (Number(body.status) === 200) {
                        const cafFormActivityId = body.response.activity_id;
                        const cafFormTransactionId = body.response.form_transaction_id;

                        // Add the CAF form submitted as a timeline entry to the form file
                        cafFormSubmissionRequest.activity_id = request.activity_id;
                        cafFormSubmissionRequest.form_transaction_id = cafFormTransactionId;
                        cafFormSubmissionRequest.form_id = CAF_FORM_ID;
                        cafFormSubmissionRequest.activity_timeline_collection = cafFormSubmissionRequest.activity_inline_data;
                        cafFormSubmissionRequest.flag_timeline_entry = 1;
                        cafFormSubmissionRequest.activity_stream_type_id = 705;
                        cafFormSubmissionRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);

                        let event = {
                            name: "addTimelineTransaction",
                            service: "activityTimelineService",
                            method: "addTimelineTransaction",
                            payload: cafFormSubmissionRequest
                        };

                        queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                            if (err) {
                                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                // throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                            } else {
                                // Calculate the percentage completion of CAF Form and store it in the inline data of the file form
                                //
                                const percentageCompletion = cafFormJson.length / 332;
                                console.log("percentageCompletion: ", percentageCompletion);
                                activityCommonService.getActivityDetails(request, 0, (err, activityData) => {
                                    console.log("activityData.activity_master_data: ", activityData.activity_master_data);
                                    let activityMasterData = {};
                                    if (activityData[0].activity_master_data !== '' && activityData[0].activity_master_data !== null) {
                                        activityMasterData = JSON.parse(activityData[0].activity_master_data)
                                    }
                                    activityMasterData.percentage_completion = percentageCompletion;
                                    activityCommonService.updateActivityMasterData(request, request.activity_id, JSON.stringify(activityMasterData), () => {});
                                });

                                // Map the form file to the Order Validation queue
                                activityCommonService
                                    .mapFileToQueue(cafFormSubmissionRequest, VODAFONE_FORM_FILE_QUEUE_ID, JSON.stringify({}))
                                    .then((data) => {
                                        console.log("Form assigned to queue: ", data);
                                    })
                                    .catch((error) => {
                                        console.log("Error assigning form to the queue: ", error)
                                    });

                                // Alter the status of the form file to Validation Pending
                                // Form the request object
                                var statusAlterRequest = Object.assign(cafFormSubmissionRequest);
                                statusAlterRequest.activity_status_id = ACTIVITY_STATUS_ID_VALIDATION_PENDING;
                                statusAlterRequest.activity_status_type_id = 25;
                                statusAlterRequest.activity_status_type_category_id = 1;
                                statusAlterRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);

                                let statusAlterRequestEvent = {
                                    name: "alterActivityStatus",
                                    service: "activityService",
                                    method: "alterActivityStatus",
                                    payload: statusAlterRequest
                                };

                                queueWrapper.raiseActivityEvent(statusAlterRequestEvent, request.activity_id, (err, resp) => {
                                    if (err) {
                                        global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                        // throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                    } else {
                                        // 
                                        console.log("Form status changed to validation pending");
                                        return callback(false, true);
                                    }
                                });
                            }
                        });

                    } else {
                        // If the CAF Form submission wasn't successful
                        console.log("CAF Form submission wasn't successful");
                        return callback(true, false);
                    }

                });
            });
    }

    function populateRomsCafFieldValues(ROMS_CAF_FIELDS_DATA, calculatedValuesJSON, formParticipantsData) {
        ROMS_CAF_FIELDS_DATA.forEach((formEntry, index) => {
            switch (formEntry.field_id) {
                case 5568: // LIVE | CAF ID
                case 5836: // BETA | CAF ID
                    // Time-based UUID
                    ROMS_CAF_FIELDS_DATA[index].field_value = uuid.v1();
                    break;
                case 5726: // LIVE | Service Rental-Grand Total(A+B+C) 
                case 5994: // BETA | Service Rental-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.serviceRentalGrandTotal;
                    break;
                case 5729: // LIVE | IP Address Charges-Grand Total(A+B+C)
                case 5997: // BETA | IP Address Charges-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.ipAddressChargesGrandTotal;
                    break;
                case 5732: // LIVE | SLA Charges-Grand Total(A+B+C)
                case 6000: // BETA | SLA Charges-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.slaChargesGrandTotal;
                    break;
                case 5735: // LIVE | Self Care Portal Service Charges-Grand Total(A+B+C)
                case 6003: // BETA | Self Care Portal Service Charges-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.selfCarePortalServiceChargesGrandTotal;
                    break;
                case 5738: // LIVE | Managed Services Charges-Grand Total(A+B+C)
                case 6006: // BETA | Managed Services Charges-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.managedServicesChargesGrandTotal;
                    break;
                case 5741: // LIVE | Managed CPE Charges-Grand Total(A+B+C)
                case 6009: // BETA | Managed CPE Charges-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.managedCPEChargesGrandTotal;
                    break;
                case 5745: // LIVE | CPE Rentals-Grand Total(A+B+C)
                case 6013: // BETA | CPE Rentals-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpeRentalsGrandTotal;
                    break;
                case 5749: // LIVE | CPE 1-Grand Total(A+B+C)
                case 6017: // BETA | CPE 1-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpe1GrandTotal;
                    break;
                case 5753: // LIVE | CPE 2-Grand Total(A+B+C)
                case 6021: // BETA | CPE 2-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpe2GrandTotal;
                    break;
                case 5757: // LIVE | CPE 3-Grand Total(A+B+C)
                case 6025: // BETA | CPE 3-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpe3GrandTotal;
                    break;
                case 5761: // LIVE | CPE 4-Grand Total(A+B+C)
                case 6029: // BETA | CPE 4-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpe4GrandTotal;
                    break;
                case 5765: // LIVE | CPE 5-Grand Total(A+B+C)
                case 6033: // BETA | CPE 5-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpe5GrandTotal;
                    break;
                case 5769: // LIVE | Miscellaneous Charges-1-Grand Total(A+B+C)
                case 6037: // BETA | Miscellaneous Charges-1-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.miscellaneousCharges1GrandTotal;
                    break;
                case 5773: // LIVE | Miscellaneous Charges2-Grand Total(A+B+C)
                case 6041: // BETA | Miscellaneous Charges2-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.miscellaneousCharges2GrandTotal;
                    break;
                case 5775: // LIVE | Registration Charges-Grand Total(A+B+C)
                case 6043: // BETA | Registration Charges-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.registrationChargesGrandTotal;
                    break;
                case 5828: // LIVE | Total Amount Payable-Grand Total(A+B+C)
                case 6096: // BETA | Total Amount Payable-Grand Total(A+B+C)
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.totalAmountPayableGrandTotal;
                    break;
                    // case 5780: // LIVE | Total Order Value
                    // case 6048: // BETA | Total Order Value
                    //     ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.serviceRentalGrandTotal;
                    //     break;
                case 5705: // LIVE | Account Manager Name
                case 5973: // BETA | Account Manager Name
                    formParticipantsData.forEach(participant => {
                        switch (participant.asset_type_id) {
                            case 126035: // LIVE | Account Managers - Mumbai Circle
                            case 126305: // BETA | Account Managers - Mumbai Circle
                                ROMS_CAF_FIELDS_DATA[index].field_value = `${participant.operating_asset_first_name} ${participant.operating_asset_last_name}`;
                                break;
                        }
                    });
                    break;
                case 5706: // LIVE | Account Manager Circle Office
                case 5974: // BETA | Account Manager Circle Office
                    ROMS_CAF_FIELDS_DATA[index].field_value = "Mumbai Circle - Account Managers";
                    break;
            }
        });

        // console.log(ROMS_CAF_FIELDS_DATA);

        return ROMS_CAF_FIELDS_DATA;
    }

    function calculateAllSums(cafFormData) {
        var sumsKeyValueJson = {
            serviceRentalGrandTotal: 0,
            ipAddressChargesGrandTotal: 0,
            slaChargesGrandTotal: 0,
            selfCarePortalServiceChargesGrandTotal: 0,
            managedServicesChargesGrandTotal: 0,
            managedCPEChargesGrandTotal: 0,
            cpeRentalsGrandTotal: 0,
            cpe1GrandTotal: 0,
            cpe2GrandTotal: 0,
            cpe3GrandTotal: 0,
            cpe4GrandTotal: 0,
            cpe5GrandTotal: 0,
            miscellaneousCharges1GrandTotal: 0,
            miscellaneousCharges2GrandTotal: 0,
            registrationChargesGrandTotal: 0,
            totalAmountPayableGrandTotal: 0
        }
        cafFormData.forEach(formEntry => {
            switch (formEntry.field_id) {
                // Service Rental-Grand Total(A+B+C)
                case 5991: // BETA | Service Rental-One Time(A)
                case 5992: // BETA | Service Rental-Annual Recurring(B)
                case 5993: // BETA | Service Rental-Security Deposit(C)
                case 5723: // LIVE | Service Rental-One Time(A)
                case 5724: // LIVE | Service Rental-Annual Recurring(B)
                case 5725: // LIVE | Service Rental-Security Deposit(C)
                    sumsKeyValueJson.serviceRentalGrandTotal += Number(formEntry.field_value);
                    break;
                    // IP Address Charges-Grand Total(A+B+C)
                case 5996: // BETA | IP Address Charges-Annual Recurring(B)
                case 5995: // BETA | IP Address Charges-One Time(A)
                case 5727: // LIVE | IP Address Charges-One Time(A)
                case 5728: // LIVE | IP Address Charges-Annual Recurring(B)
                    sumsKeyValueJson.ipAddressChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // SLA Charges-Grand Total(A+B+C)
                case 5999: // BETA | SLA Charges-Annual Recurring(B)
                case 5998: // BETA | SLA Charges-One Time(A)
                case 5730: // LIVE | SLA Charges-One Time(A)
                case 5731: // LIVE | SLA Charges-Annual Recurring(B)
                    sumsKeyValueJson.slaChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // Self Care Portal Service Charges-Grand Total(A+B+C)
                case 6002: // BETA | Self Care Portal Service Charges-Annual Recurring(B)
                case 6001: // BETA | Self Care Portal Service Charges-One Time(A)
                case 5733: // LIVE | Self Care Portal Service Charges-One Time(A)
                case 5734: // LIVE | Self Care Portal Service Charges-Annual Recurring(B)
                    sumsKeyValueJson.selfCarePortalServiceChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // Managed Services Charges-Grand Total(A+B+C)
                case 6005: // BETA | Managed Services Charges-Annual Recurring(B)
                case 6004: // BETA | Managed Services Charges-One Time(A)
                case 5736: // LIVE | Managed Services Charges-One Time(A)
                case 5737: // LIVE | Managed Services Charges-Annual Recurring(B)
                    sumsKeyValueJson.managedServicesChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // Managed CPE Charges-Grand Total(A+B+C)
                case 6008: // BETA | Managed CPE Charges-Annual Recurring(B)
                case 6007: // BETA | Managed CPE Charges-One Time(A)
                case 5739: // LIVE | Managed CPE Charges-One Time(A)
                case 5740: // LIVE | Managed CPE Charges-Annual Recurring(B)
                    sumsKeyValueJson.managedCPEChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE Rentals-Grand Total(A+B+C)
                case 6011: // BETA | CPE Rentals-Annual Recurring(B)
                case 6010: // BETA | CPE Rentals-One Time(A)
                case 6012: // BETA | CPE Rentals-Security Deposit(C)
                case 5742: // LIVE | CPE Rentals-One Time(A)
                case 5743: // LIVE | CPE Rentals-Annual Recurring(B)
                case 5744: // LIVE | CPE Rentals-Security Deposit(C)
                    sumsKeyValueJson.cpeRentalsGrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE 1-Grand Total(A+B+C)
                case 6015: // CPE 1-Annual Recurring(B)
                case 6014: // CPE 1-One Time(A)
                case 6016: // CPE 1-Security Deposit(C)
                case 5746: // CPE 1-One Time(A)
                case 5747: // CPE 1-Annual Recurring(B)
                case 5748: // CPE 1-Security Deposit(C)
                    sumsKeyValueJson.cpe1GrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE 2-Grand Total(A+B+C)
                case 6019: // CPE 2-Annual Recurring(B)
                case 6018: // CPE 2-One Time(A)
                case 6020: // CPE 2-Security Deposit(C)
                case 5750: // CPE 2-One Time(A)
                case 5751: // CPE 2-Annual Recurring(B)
                case 5752: // CPE 2-Security Deposit(C)
                    sumsKeyValueJson.cpe2GrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE 3-Grand Total(A+B+C)
                case 6023: // CPE 3-Annual Recurring(B)
                case 6022: // CPE 3-One Time(A)
                case 6024: // CPE 3-Security Deposit(C)
                case 5754: // CPE 3-One Time(A)
                case 5755: // CPE 3-Annual Recurring(B)
                case 5756: // CPE 3-Security Deposit(C)
                    sumsKeyValueJson.cpe3GrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE 4-Grand Total(A+B+C)
                case 6027: // CPE 4-Annual Recurring(B)
                case 6026: // CPE 4-One Time(A)
                case 6028: // CPE 4-Security Deposit(C)
                case 5758: // CPE 4-One Time(A)
                case 5759: // CPE 4-Annual Recurring(B)
                case 5760: // CPE 4-Security Deposit(C)
                    sumsKeyValueJson.cpe4GrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE 5-Grand Total(A+B+C)
                case 6031: // CPE 5-Annual Recurring(B)
                case 6030: // CPE 5-One Time(A)
                case 6032: // CPE 5-Security Deposit(C)
                case 5762: // CPE 5-One Time(A)
                case 5763: // CPE 5-Annual Recurring(B)
                case 5764: // CPE 5-Security Deposit(C)
                    sumsKeyValueJson.cpe5GrandTotal += Number(formEntry.field_value);
                    break;
                    // Miscellaneous Charges-1-Grand Total(A+B+C)
                case 6035: // Miscellaneous Charges-1-Annual Recurring(B)
                case 6034: // Miscellaneous Charges-1-One Time(A)
                case 6036: // Miscellaneous Charges-1-Security Deposit(C)
                case 5766: // Miscellaneous Charges-1-One Time(A)
                case 5767: // Miscellaneous Charges-1-Annual Recurring(B)
                case 5768: // Miscellaneous Charges-1-Security Deposit(C)
                    sumsKeyValueJson.miscellaneousCharges1GrandTotal += Number(formEntry.field_value);
                    break;
                    // Miscellaneous Charges-2-Grand Total(A+B+C)
                case 6039: // Miscellaneous Charges2-Annual Recurring(B)
                case 6038: // Miscellaneous Charges2-One Time(A)
                case 6040: // Miscellaneous Charges2-Security Deposit(C)
                case 5770: // Miscellaneous Charges2-One Time(A)
                case 5771: // Miscellaneous Charges2-Annual Recurring(B)
                case 5772: // Miscellaneous Charges2-Security Deposit(C)
                    sumsKeyValueJson.miscellaneousCharges2GrandTotal += Number(formEntry.field_value);
                    break;
                    // Registration Charges-Grand Total(A+B+C)
                case 6042: // Registration Charges-One Time(A)
                case 5774: // Registration Charges-One Time(A)
                    sumsKeyValueJson.registrationChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // Total Amount Payable-Grand Total(A+B+C)
                case 6045: // Total Amount Payable-Annual Recurring(B)
                case 6044: // Total Amount Payable-One Time(A)
                case 5776: // Total Amount Payable-One Time(A)
                case 5777: // Total Amount Payable-Annual Recurring(B)
                    sumsKeyValueJson.totalAmountPayableGrandTotal += Number(formEntry.field_value);
                    break;
            }
        });

        return sumsKeyValueJson;
    }

    function applyTransform(cafFormData, sourceFormData, formId) {

        // New Order Form
        if (formId === NEW_ORDER_FORM_ID) {
            // 
            sourceFormData.forEach(formEntry => {
                if (Object.keys(NEW_ORDER_TO_CAF_FIELD_ID_MAP).includes(String(formEntry.field_id))) {
                    // Push entries from new order form, which have a defined CAF mapping
                    cafFormData.push({
                        "form_id": CAF_FORM_ID,
                        "field_id": NEW_ORDER_TO_CAF_FIELD_ID_MAP[String(formEntry.field_id)],
                        "field_name": formEntry.field_name,
                        "field_data_type_id": formEntry.field_data_type_id,
                        "field_data_type_category_id": formEntry.field_data_type_category_id,
                        "data_type_combo_id": formEntry.data_type_combo_id,
                        "data_type_combo_value": formEntry.data_type_combo_value,
                        "field_value": formEntry.field_value,
                        "message_unique_id": formEntry.message_unique_id
                    })
                } else {
                    // Ignore the other entries
                }
            });
            // Return the populated CAF object
            return cafFormData;
        }

        // Supplementary Order Form
        if (formId === SUPPLEMENTARY_ORDER_FORM_ID) {
            // 
            sourceFormData.forEach(formEntry => {
                if (Object.keys(SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP).includes(String(formEntry.field_id))) {
                    // Push entries from the Supplementary Order Form, which have a defined CAF mapping
                    cafFormData.push({
                        "form_id": CAF_FORM_ID,
                        "field_id": SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP[String(formEntry.field_id)],
                        "field_name": formEntry.field_name,
                        "field_data_type_id": formEntry.field_data_type_id,
                        "field_data_type_category_id": formEntry.field_data_type_category_id,
                        "data_type_combo_id": formEntry.data_type_combo_id,
                        "data_type_combo_value": formEntry.data_type_combo_value,
                        "field_value": formEntry.field_value,
                        "message_unique_id": formEntry.message_unique_id
                    })
                } else {
                    // Ignore the other entries
                }
            });
            // Return the populated CAF object
            return cafFormData;
        }

        // FR FORM
        if (formId === FR_FORM_ID) {
            // 
            sourceFormData.forEach(formEntry => {
                if (Object.keys(FR_TO_CAF_FIELD_ID_MAP).includes(String(formEntry.field_id))) {
                    // Push entries from the Supplementary Order Form, which have a defined CAF mapping
                    cafFormData.push({
                        "form_id": CAF_FORM_ID,
                        "field_id": FR_TO_CAF_FIELD_ID_MAP[String(formEntry.field_id)],
                        "field_name": formEntry.field_name,
                        "field_data_type_id": formEntry.field_data_type_id,
                        "field_data_type_category_id": formEntry.field_data_type_category_id,
                        "data_type_combo_id": formEntry.data_type_combo_id,
                        "data_type_combo_value": formEntry.data_type_combo_value,
                        "field_value": formEntry.field_value,
                        "message_unique_id": formEntry.message_unique_id
                    })
                } else {
                    // Ignore the other entries
                }
            });
            // Return the populated CAF object
            return cafFormData;
        }

        // CRM FORM
        if (formId === CRM_FORM_ID) {
            // 
            sourceFormData.forEach(formEntry => {
                if (Object.keys(CRM_TO_CAF_FIELD_ID_MAP).includes(String(formEntry.field_id))) {
                    // Push entries from the Supplementary Order Form, which have a defined CAF mapping
                    cafFormData.push({
                        "form_id": CAF_FORM_ID,
                        "field_id": CRM_TO_CAF_FIELD_ID_MAP[String(formEntry.field_id)],
                        "field_name": formEntry.field_name,
                        "field_data_type_id": formEntry.field_data_type_id,
                        "field_data_type_category_id": formEntry.field_data_type_category_id,
                        "data_type_combo_id": formEntry.data_type_combo_id,
                        "data_type_combo_value": formEntry.data_type_combo_value,
                        "field_value": formEntry.field_value,
                        "message_unique_id": formEntry.message_unique_id
                    })
                } else {
                    // Ignore the other entries
                }
            });
            // Return the populated CAF object
            return cafFormData;
        }

        // HLD Form
        if (formId === HLD_FORM_ID) {
            // 
            sourceFormData.forEach(formEntry => {
                if (Object.keys(HLD_TO_CAF_FIELD_ID_MAP).includes(String(formEntry.field_id))) {
                    // Push entries from the Supplementary Order Form, which have a defined CAF mapping
                    cafFormData.push({
                        "form_id": CAF_FORM_ID,
                        "field_id": HLD_TO_CAF_FIELD_ID_MAP[String(formEntry.field_id)],
                        "field_name": formEntry.field_name,
                        "field_data_type_id": formEntry.field_data_type_id,
                        "field_data_type_category_id": formEntry.field_data_type_category_id,
                        "data_type_combo_id": formEntry.data_type_combo_id,
                        "data_type_combo_value": formEntry.data_type_combo_value,
                        "field_value": formEntry.field_value,
                        "message_unique_id": formEntry.message_unique_id
                    })
                } else {
                    // Ignore the other entries
                }
            });
            // Return the populated CAF object
            return cafFormData;
        }

        // If none match, then just return the CAF form data as is
        return cafFormData;
    }

    function appendLabels(cafFormData) {
        Object.keys(ROMS_CAF_FORM_LABELS).forEach(formEntry => {
            cafFormData.push({
                "form_id": 872,
                "field_id": formEntry,
                "field_name": ROMS_CAF_FORM_LABELS[formEntry],
                "field_data_type_id": 21,
                "field_data_type_category_id": 8,
                "data_type_combo_id": 0,
                "data_type_combo_value": "0",
                "field_value": ROMS_CAF_FORM_LABELS[formEntry],
                "message_unique_id": "127349187236941782639"
            })
        });
        return cafFormData;
    }

    this.setStatusApprovalPendingAndFireEmail = function (request, callback) {

        request.asset_id = CAF_BOT_ASSET_ID;
        request.activity_status_id = ACTIVITY_STATUS_ID_APPROVAL_PENDING;
        request.activity_status_type_id = 25;
        request.activity_status_type_category_id = 1;
        request.message_unique_id = util.getMessageUniqueId(request.asset_id);

        let statusAlterRequestEvent = {
            name: "alterActivityStatus",
            service: "activityService",
            method: "alterActivityStatus",
            payload: request
        };

        queueWrapper.raiseActivityEvent(statusAlterRequestEvent, request.activity_id, (err, resp) => {
            if (err) {
                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
            } else {
                // 
                console.log("Form status set to approval pending");

                activityCommonService.getAllParticipants(request, (err, participantData) => {
                    if (participantData.length > 0) {
                        participantData.forEach(participant => {
                            // Account Managers/Employees/Vodafone people
                            switch (participant.asset_type_id) {
                                case 126035: // Account Managers - Mumbai Circle | LIVE
                                case 126305: // Account Managers - Mumbai Circle | BETA
                                    // console.log("participant: ", participant)
                                    // Check if the participant is the owner of the form file
                                    if (Number(participant.activity_owner_asset_id) === Number(participant.asset_id)) {
                                        // Check if the email exists for the field
                                        if (participant.operating_asset_email_id !== '' || participant.operating_asset_email_id !== null) {
                                            // Fire the email
                                            util.sendEmailV3({
                                                    email_receiver_name: `${participant.asset_first_name} ${participant.asset_last_name}`,
                                                    email_sender_name: 'Vodafone - Idea',
                                                    email_sender: 'vodafone_idea@grenerobotics.com'
                                                },
                                                participant.operating_asset_email_id,
                                                'Submit The Account Manager Approval Form',
                                                'Text Content Will Be Ignored',
                                                '<h1>Submit the AM Approval Form</h1>',
                                                (err, data) => {
                                                    if (err) {
                                                        console.log("Error sending email to the Account Manager: ", data);
                                                    } else {
                                                        console.log("Email sent to the Account Manager: ", data);
                                                    }
                                                });
                                        }
                                    }
                                    break;
                            }

                            // For Customer
                            switch (participant.asset_type_category_id) {
                                case 45: // Customer Service Desk
                                    // console.log("participant: ", participant)
                                    // Check if the email exists for the field
                                    if (participant.operating_asset_email_id !== '' || participant.operating_asset_email_id !== null) {
                                        // Fire the email
                                        util.sendEmailV3({
                                                email_receiver_name: `${participant.asset_first_name} ${participant.asset_last_name}`,
                                                email_sender_name: 'Vodafone - Idea',
                                                email_sender: 'vodafone_idea@grenerobotics.com'
                                            },
                                            participant.operating_asset_email_id,
                                            'Submit The Customer Approval Form',
                                            'Text Content Will Be Ignored',
                                            '<h1>Submit the Customer Approval Form</h1>',
                                            (err, data) => {
                                                if (err) {
                                                    console.log("Error sending email to the Account Manager: ", data);
                                                } else {
                                                    console.log("Email sent to the Account Manager: ", data);
                                                }
                                            });
                                    }
                                    break;
                            }
                        });
                        return callback(false, true);
                    } else {
                        // Do nothing, for now
                    }
                });
                // return callback(false, true);
            }
        });

    }

    this.approvalFormsSubmissionCheck = async function (request, callback) {
        // LIVE => 858 - Account Manager Approval | 878 - Customer Approval
        // BETA => 875 - Account Manager Approval | 882 - Customer Approval
        var cafFormData = [],
            crmPushRequestData = {},
            isApprovalDone = false,
            crmAcknowledgementId,
            crmAcknowledgementFormJson,
            queueActivityMappingId;

        // If the incoming form submission request is for the AM APPROVAL FORM
        if (Number(request.activity_form_id) === 858 || Number(request.activity_form_id) === 875) {
            await activityCommonService
                .getActivityTimelineTransactionByFormId(request, request.activity_id, CUSTOMER_APPROVAL_FORM_ID)
                .then((customerApprovalFormData) => {
                    console.log("customerApprovalFormData: ", customerApprovalFormData);
                    console.log("customerApprovalFormData.length: ", customerApprovalFormData.length);
                    if (customerApprovalFormData.length > 0) {
                        // 
                        isApprovalDone = true
                    }
                })
            // If the incoming form submission request is for the CUSTOMER APPROVAL FORM
        } else if (Number(request.activity_form_id) === 878 || Number(request.activity_form_id) === 882) {
            await activityCommonService
                .getActivityTimelineTransactionByFormId(request, request.activity_id, ACCOUNT_MANAGER_APPROVAL_FORM_ID)
                .then((accountManagerApprovalFormData) => {
                    console.log("customerApprovalFormData: ", accountManagerApprovalFormData);
                    console.log("customerApprovalFormData.length: ", accountManagerApprovalFormData.length);
                    if (accountManagerApprovalFormData.length > 0) {
                        // 
                        isApprovalDone = true
                    }
                })
        }

        // If both the approval forms from Account Manager and Customer Service Desk have
        // been added to the file form, trigger a push data call to the CRM Portal
        if (isApprovalDone === true) {
            console.log("Approvals are done!")
            await activityCommonService
                .getActivityTimelineTransactionByFormId(request, request.activity_id, CAF_FORM_ID)
                .then((cafData) => {

                    cafFormData = JSON.parse(cafData[0].data_entity_inline);

                    cafFormData.forEach(formEntry => {
                        crmPushRequestData[CAF_TO_CRM_PORTAL_PUSH_MAP[formEntry.field_id]] = formEntry.field_value;
                    });

                    crmPushRequestData["customer_name"] = crmPushRequestData["billing_customer_name"] || '';
                    crmPushRequestData["sample_data"] = "Hello World!";
                }).catch((error) => {
                    global.logger.write('debug', 'No CAF Form Exists for the order: ' + JSON.stringify(error), error, request);
                    
                    return callback(false, {
                        isApprovalDone
                    })
                    // crmPushRequestData["sample_data"] = "Hello World!";
                });

            // Push the data to CRM:
            const crmPushRequestOptions = {
                form: crmPushRequestData
            }

            await makePostRequestPromise(global.config.mobileBaseUrl + global.config.version + '/vodafone/crm_portal/push', crmPushRequestOptions)
                .then((body) => {
                    body = JSON.parse(body);
                    console.log("[/vodafone/crm_portal/push] body: ", body);
                    // Get acknowledgement ID from the CRM
                    if (Number(body.status) === 200) {
                        crmAcknowledgementId = body.response.crm_acknowledgement_id;
                    }
                });

            // Prepare the CRM Acknowledgement Form
            let fieldId_1 = 0,
                fieldId_2 = 0;

            if (CRM_ACK_FORM_ID === 868) { // BETA
                fieldId_1 = 5829;
                fieldId_2 = 5830;
            } else if (CRM_ACK_FORM_ID === 863) { // LIVE
                fieldId_1 = 5561;
                fieldId_2 = 5562;
            }
            crmAcknowledgementFormJson = [{
                "form_id": CRM_ACK_FORM_ID,
                "field_id": fieldId_1,
                "field_name": "CRM Acknowledgement Form",
                "field_data_type_id": 19,
                "field_data_type_category_id": 7,
                "data_type_combo_id": 0,
                "data_type_combo_value": "0",
                "field_value": crmAcknowledgementId,
                "message_unique_id": "313591541834883314219"
            }, {
                "form_id": CRM_ACK_FORM_ID,
                "field_id": fieldId_2,
                "field_name": "CRM Acknowledgement Form",
                "field_data_type_id": 21,
                "field_data_type_category_id": 8,
                "data_type_combo_id": 0,
                "data_type_combo_value": "0",
                "field_value": "CRM Acknowledgement Form",
                "message_unique_id": "313591541834883314219"
            }];
            // Initiate the CRM Acknowledgement Form Submission
            var crmAckFormSubmissionRequest = {
                organization_id: CAF_ORGANIZATION_ID,
                account_id: CAF_ACCOUNT_ID,
                workforce_id: CAF_WORKFORCE_ID,
                asset_id: request.asset_id, // CAF_BOT_ASSET_ID,
                asset_token_auth: request.asset_token_auth,
                asset_message_counter: 0,
                activity_title: "CRM Acknowledgement Form",
                activity_description: "CRM Acknowledgement Form",
                activity_inline_data: JSON.stringify(crmAcknowledgementFormJson),
                activity_datetime_start: util.getCurrentUTCTime(),
                activity_datetime_end: util.getCurrentUTCTime(),
                activity_type_category_id: 9,
                activity_sub_type_id: 0,
                activity_type_id: CAF_ACTIVITY_TYPE_ID,
                activity_access_role_id: 21,
                asset_participant_access_id: 21,
                activity_parent_id: 0,
                flag_pin: 0,
                flag_priority: 0,
                activity_flag_file_enabled: -1,
                activity_form_id: CRM_ACK_FORM_ID,
                flag_offline: 0,
                flag_retry: 0,
                message_unique_id: util.getMessageUniqueId(CAF_BOT_ASSET_ID),
                activity_channel_id: 0,
                activity_channel_category_id: 0,
                activity_flag_response_required: 0,
                track_latitude: 0.0,
                track_longitude: 0.0,
                track_altitude: 0,
                track_gps_datetime: util.getCurrentUTCTime(),
                track_gps_accuracy: 0,
                track_gps_status: 0,
                service_version: "1.0",
                app_version: "2.5.7",
                device_os_id: 5
            };

            const crmAckRequestOptions = {
                form: crmAckFormSubmissionRequest
            }

            await makeRequest.post(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', crmAckRequestOptions, function (error, response, body) {
                body = JSON.parse(body);
                if (Number(body.status) === 200) {
                    const crmAckFormActivityId = body.response.activity_id;
                    const crmAckFormTransactionId = body.response.form_transaction_id;

                    // Add the CAF form submitted as a timeline entry to the form file
                    crmAckFormSubmissionRequest.activity_id = request.activity_id;
                    crmAckFormSubmissionRequest.form_transaction_id = crmAckFormTransactionId;
                    crmAckFormSubmissionRequest.form_id = CRM_ACK_FORM_ID;
                    crmAckFormSubmissionRequest.activity_timeline_collection = crmAckFormSubmissionRequest.activity_inline_data;
                    crmAckFormSubmissionRequest.flag_timeline_entry = 1;
                    crmAckFormSubmissionRequest.activity_stream_type_id = 705;
                    crmAckFormSubmissionRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);

                    let event = {
                        name: "addTimelineTransaction",
                        service: "activityTimelineService",
                        method: "addTimelineTransaction",
                        payload: crmAckFormSubmissionRequest
                    };

                    queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                        if (err) {
                            global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                        } else {

                            // Map the form file to the Order Validation queue
                            activityCommonService
                                .fetchQueueActivityMappingId(request, VODAFONE_FORM_FILE_QUEUE_ID)
                                .then((queueActivityMappingData) => {
                                    queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;
                                    // Unmap the form file from the Order Validation queue
                                    return activityCommonService.unmapFileFromQueue(request, queueActivityMappingId)
                                })
                                .then((data) => {
                                    console.log("Form unassigned from queue: ", data);
                                })
                                .catch((error) => {
                                    console.log("Error unassigning form from queue: ", error)
                                });

                            // Alter the status of the form file to Order Close
                            // Form the request object
                            var statusAlterRequest = Object.assign(crmAckFormSubmissionRequest);
                            statusAlterRequest.activity_status_id = ACTIVITY_STATUS_ID_ORDER_CLOSED;
                            statusAlterRequest.activity_status_type_id = 26;
                            statusAlterRequest.activity_status_type_category_id = 1;
                            statusAlterRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);

                            let statusAlterRequestEvent = {
                                name: "alterActivityStatus",
                                service: "activityService",
                                method: "alterActivityStatus",
                                payload: statusAlterRequest
                            };

                            queueWrapper.raiseActivityEvent(statusAlterRequestEvent, request.activity_id, (err, resp) => {
                                if (err) {
                                    global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                } else {
                                    // 
                                    console.log("Form status changed to validation pending");
                                }
                            });
                        }
                    });
                } else {
                    // 
                }

            });

        }

        return callback(false, {
            isApprovalDone
        })
    }

    // Promisifying a request
    function makePostRequestPromise(url, options) {
        return new Promise((resolve, reject) => {
            makeRequest.post(url, options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    resolve(body);
                } else {
                    reject(error);
                }
            });
        });
    }

    // 
    this.fetchCRMPortalPush = function (request) {
        return new Promise((resolve, reject) => {
            var data = {
                crm_acknowledgement_id: '25879658696'
            };

            resolve(data);
        });
    };
};


module.exports = VodafoneService;
