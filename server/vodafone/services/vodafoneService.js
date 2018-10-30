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
    
    this.getAdminAssets = function(request, callback) {
        this.leastLoadedDesk(request).then((data)=>{
                var lowestCnt = 99999;
                var deskToBeAssigned;
        
                global.logger.write('debug', 'data.length : ' + data.length, {}, request);
                if(Number(data.length) > 0) {
                    forEachAsync(data, (next, rowData)=>{                 
                        global.logger.write('debug', 'rowData.count : ' + rowData.count, {}, request);
                        global.logger.write('debug', 'lowestCnt : ' + lowestCnt, {}, request);
                    
                        if(rowData.count < lowestCnt) {
                            lowestCnt = rowData.count;
                            deskToBeAssigned = rowData;
                        }
                        next();
                    }).then(()=>{
                        callback(false, {nani: deskToBeAssigned}, 200);
                    });
                }
            });
    };
    
    this.newOrderFormSubmission = function(request, callback) {
        //Step 1
        //Change the status to Customer approval
        request.flag = 1;
        request.asset_type_id = 122992;
        changeStatusToCustApproval(request).then(()=>{});
        
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
                    this.vodafoneSendEmail(request, objectCollection, {
                        firstName,
                        contactPhoneCountryCode,
                        contactPhoneNumber,
                        contactEmailId,
                        customerServiceDeskAssetID: DeskAssetID
                    }, () => {})
                    return callback();
                }
                
            this.leastLoadedDesk(request).then((data)=>{
                var lowestCnt = 99999;
                var deskToBeAssigned;
        
                global.logger.write('debug', 'data.length : ' + data.length, {}, request);
                if(Number(data.length) > 0) {
                    forEachAsync(data, (next, rowData)=>{                 
                        global.logger.write('debug', 'rowData.count : ' + rowData.count, {}, request);
                        global.logger.write('debug', 'lowestCnt : ' + lowestCnt, {}, request);
                    
                        if(rowData.count < lowestCnt) {
                            lowestCnt = rowData.count;
                            deskToBeAssigned = rowData;
                        }
                        next();
                    }).then(()=>{
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
                            {   //Assigning the Least assigned Administrator 
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

                                // Send the email to the customer's email
                                this.vodafoneSendEmail(request, objectCollection, {
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
            }).catch((err)=>{
                callback(false, {}, 200);
            });

            }
            callback();
        });
    };
  
    function changeStatusToCustApproval(request) {
        return new Promise((resolve, reject)=>{
           
           var newRequest = Object.assign(request);
           newRequest.activity_status_id = " "; //Ask Sai;
           newRequest.activity_status_type_id = ""; //Ask Sai;
           newRequest.activity_status_type_category_id = ""; //Ask Sai;
           
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
    
    this.vodafoneSendEmail = function(request, objectCollection, customerCollection, callback) {

        console.log("\x1b[35m [Log] Inside vodafoneSendEmail \x1b[0m")

        const util = objectCollection.util;
        const db = objectCollection.db;

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

                callback()
            });
    }

    //Document Validator = 122964; 
    //Feasibility Checker = 122965; 
    //Administrator (Account Manager) = 122992
    this.leastLoadedDesk  = function(request) {
        return new Promise((resolve, reject)=>{
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
                    if(err === false) {
                     console.log('Dataa from DB: ', data);
                     resolve(data)   
                    } else {
                     reject(err);
                    }
                });
            }
        });        
    }
    
    this.addFeasibilityChecker = function(request, callback) {
        
        request.flag = 1;
        request.asset_type_id = 122965; 
        
        this.leastLoadedDesk(request).then((data)=>{
                var lowestCnt = 99999;
                var deskToBeAssigned;
        
                global.logger.write('debug', 'data.length : ' + data.length, {}, request);
                if(Number(data.length) > 0) {
                    forEachAsync(data, (next, rowData)=>{                 
                        global.logger.write('debug', 'rowData.count : ' + rowData.count, {}, request);
                        global.logger.write('debug', 'lowestCnt : ' + lowestCnt, {}, request);
                    
                        if(rowData.count < lowestCnt) {
                            lowestCnt = rowData.count;
                            deskToBeAssigned = rowData;
                        }
                        next();
                    }).then(()=>{
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
        if (activityTypeCategoryId === 9 && activityStreamTypeId === 705) {   // add form case
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
                    activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });

                    //updating log differential datetime for only this asset
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) { });
                    
                    (request.hasOwnProperty('signedup_asset_id')) ? 
                        activityCommonService.updateActivityLogLastUpdatedDatetime(request, 0, function (err, data) { }): //To increase unread cnt for marketing manager
                        activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) { });
                    
                    if(request.auth_asset_id == 31035 && request.flag_status_alter == 1) {
                        
                        request.asset_type_id = 122964;
                        leastLoadedDesk(request).then((data)=>{
                            var lowestCnt = 99999;
                            var deskToBeAssigned;

                            global.logger.write('debug', 'data.length : ' + data.length, {}, request);
                            if(Number(data.length) > 0) {
                                forEachAsync(data, (next, rowData)=>{                 
                                    global.logger.write('debug', 'rowData.count : ' + rowData.count, {}, request);
                                    global.logger.write('debug', 'lowestCnt : ' + lowestCnt, {}, request);

                                    if(rowData.count < lowestCnt) {
                                        lowestCnt = rowData.count;
                                        deskToBeAssigned = rowData;
                                    }
                                    next();
                                }).then(()=>{
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
    

};

module.exports = VodafoneService;
