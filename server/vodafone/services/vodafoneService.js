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
       
    this.newOrderFormSubmission = function(request, callback) {
        
        let firstName = '',
            contactCompany = '',
            contactPhoneCountryCode = 0,
            contactPhoneNumber = 0,
            contactEmailId = '',
            contactDesignation = '';

            const formData = JSON.parse(request.activity_inline_data);

            formData.forEach(formEntry => {
                switch (Number(formEntry.field_id)) {

                    case 5020: // 856 | Company (Customer)Name
                        contactCompany = formEntry.field_value;
                        break;

                    case 5023: // 856 | Name
                    case 5276: // 844 | Name
                        firstName = formEntry.field_value;
                        break;

                    case 5024: // 856 | Contact Number
                    case 5277: // 844 | Contact Number
                        contactPhoneCountryCode = String(formEntry.field_value).split('||')[0];
                        contactPhoneNumber = String(formEntry.field_value).split('||')[1];
                        break;

                    case 5025: // 856 | Email
                    case 5278: // 844 | Email
                        contactEmailId = formEntry.field_value;
                        break;

                    case 5029: // 856 | Designation
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
            
            var customerData = {};
            customerData.first_name = firstName;
            customerData.contact_company = contactCompany;
            customerData.contact_phone_country_code = contactPhoneCountryCode;
            customerData.contact_phone_number = contactEmailId;
            customerData.contact_designation = contactDesignation;
            
            
        //Step 1 :- Change the status to "Order Creation"
        request.flag = 1;
        request.asset_type_id = 122992;
        changeStatusToCustApproval(request).then(()=>{});
        /////////////////////////////////////////////////
        
        //Step 2 :- FR Form API Integration followed by Timeline Entry        
        frFormApiIntegration(request).then(()=>{
        
            //Step 3 :- CRM Form API Integration followed by Timeline Entry
            crmFormApiIntegration(request).then(()=>{              
                                
                //Step 4 :- Custom Based on the Custom Code check whether the service desk is existing or not
                checkServiceDeskExistence(request).then((sdResp)=>{
                        if(sdResp) { //sdResp is true means service desk exists
                            request.authorised_signatory_contact_number;
                            request.authorised_signatory_email;
                            
                            
                        } else {
                            //Create Customer Operating Asset
                            //Create Customer Contact file
                            //Create Customer Desk Asset                            
                            createAssetContactDesk(request, customerData).then((assetId, deskAssetId)=>{
                                
                                //Add Participant
                                addDeskAsParticipant(request, customerData, deskAssetId).then(()=>{
                                    
                                    //Fire Email
                                    vodafoneSendEmail(request, {
                                        firstName,
                                        contactPhoneCountryCode,
                                        contactPhoneNumber,
                                        contactEmailId,
                                        customerServiceDeskAssetID: deskAssetId
                                    }, () => {});
                                    
                                }).catch((err)=>{
                                    global.logger.write('debug', err, {}, request);
                                });                              
                                
                                
                            }).catch((err)=>{
                                global.logger.write('debug', err, {}, request);
                            })
                            
                            
                        }
                    }).catch((err)=>{
                        global.logger.write('debug', err, {}, request);
                    });
                    
            }).catch(()=>{
                global.logger.write('debug', err, {}, request);
                return callback();
            });
            
        }).catch((err)=>{
            global.logger.write('debug', err, {}, request);
            return callback();
        });
    };
     
  
    function changeStatusToCustApproval(request) {
        return new Promise((resolve, reject)=>{
           
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
    
    function frFormApiIntegration(request) {
        return new Promise((resolve, reject)=>{
            var requestOptionsForFrPull = Object.assign(request);                   
            requestOptionsForFrPull.api_secret = 'asdf';
            requestOptionsForFrPull.url = '/vodafone/fr/pull';

            activityCommonService.makeRequest(requestOptionsForFrPull, requestOptionsForFrPull.url, 1).then((resp)=>{
                global.logger.write('debug', resp, {}, request);
                let frResponse = JSON.parse(resp);
                frResponse.activity_timeline_collection = frResponse.response;

                if (Number(frResponse.status) === 200) {
                    //Timeline Entry
                    var event = {
                        name: "vodafone",
                        service: "vodafoneService",
                        method: "addTimelineTransactionVodafone",
                        payload: frResponse.response
                    }

                    queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                        if (err) {
                            global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent : ' + JSON.stringify(resp, null, 2), err, request);
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            global.logger.write('debug', 'Successfullly FR form timeline entry done', {}, request);
                        }
                     });
                 resolve();
              } else {
                  reject('Status not 200 while doing FR Pull Request');
              }
            });
      });
    };
    
    
    function crmFormApiIntegration(request) {
        return new Promise((resolve, reject)=>{
            var requestOptionsForCrmPull = Object.assign(request);
            //requestOptionsForCrmPull.account_code = '1234';
            requestOptionsForCrmPull.api_secret = 'asdf';
            requestOptionsForCrmPull.url = '/vodafone/crm_portal/pull';

            activityCommonService.makeRequest(requestOptionsForCrmPull, requestOptionsForCrmPull.url, 1).then((resp)=>{
                global.logger.write('debug', resp, {}, request);
                let crmResponse = JSON.parse(resp);
                crmResponse.activity_timeline_collection = crmResponse.response;
                
                if (Number(crmResponse.status) === 200) {
                    request.authorised_signatory_contact_number = crmResponse.response.authorised_signatory_contact_number;
                    request.authorised_signatory_email = crmResponse.response.authorised_signatory_email;

                    //Timeline Entry
                    var event = {
                        name: "vodafone",
                        service: "vodafoneService",
                        method: "addTimelineTransactionVodafone",
                        payload: crmResponse.response
                    }

                    queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                        if (err) {
                            global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent : ' + JSON.stringify(resp, null, 2), err, request);
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            global.logger.write('debug', 'Successfullly FR form timeline entry done', {}, request);
                       }
                    });
                    resolve();
                } else {
                    reject('Status not 200 while doing CRM Pull Request');
                }
        });
      });
    };
    
    function createAssetContactDesk(request, customerData){
        return new Promise((resolve, reject)=>{                     

            let customerServiceDeskRequest = {
                organization_id: 858,
                account_id: 973,
                workforce_id: 5345,
                asset_id: 31298,
                asset_token_auth: "3dc16b80-e338-11e8-a779-5b17182fa0f6",
                asset_message_counter: 1,
                activity_title: customerData.first_name,
                activity_description: customerData.first_name,
                activity_inline_data: JSON.stringify({
                    "activity_id": 0,
                    "activity_ineternal_id": -1,
                    "activity_type_category_id": 6,
                    "contact_account_id": 974,
                    "contact_asset_id": 0,
                    "contact_asset_type_id": 126082, //Customer Operating Asset Type ID
                    "contact_department": "",
                    "contact_designation": customerData.contact_designation,
                    "contact_email_id": customerData.contact_email_Id,
                    "contact_first_name": customerData.first_name,
                    "contact_last_name": "",
                    "contact_location": "Hyderabad",
                    "contact_operating_asset_name": customerData.first_name,
                    "contact_organization": "",
                    "contact_organization_id": 858,
                    "contact_phone_country_code": customerData.contact_phone_country_code,
                    "contact_phone_number": customerData.contact_phone_number,
                    "contact_profile_picture": "",
                    "contact_workforce_id": 5354,
                    "contact_asset_type_name": "Customer",
                    "contact_company": customerData.contact_company,
                    "contact_lat": 0.0,
                    "contact_lon": 0.0,
                    "contact_notes": "",
                    "field_id": 0,
                    "log_asset_id": 31298,
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
                    
                    resolve(assetID, DeskAssetID);
                } else {
                    reject('Status not 200 while doing CRM Pull Request');
                }
            });
    });
   }
   
   function addDeskAsParticipant(request, customerData, deskAssetId) {
       return new Promise((resolve, reject)=>{
            
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
                    "asset_first_name": customerData.first_name,
                    "asset_id": Number(deskAssetId),
                    "asset_image_path": "",
                    "asset_last_name": "",
                    "asset_phone_number": customerData.contact_phone_number,
                    "asset_phone_number_code": customerData.contact_phone_country_code,
                    "asset_type_category_id": 45,
                    "asset_type_id": 125815,
                    "field_id": 0,
                    "log_asset_id": 31035,
                    "message_unique_id": util.getMessageUniqueId(Number(request.asset_id)),
                    "operating_asset_first_name": customerData.first_name,
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
                        global.logger.write('debug',"\x1b[35m [ERROR] Raising queue activity raised for adding Service Desk as a participant. \x1b[0m",{},request);
                        reject('Error while raising queue activity for adding service desk as a participant');
                    } else {                        
                        global.logger.write('debug',"\x1b[35m Queue activity raised for adding Service Desk as a participant. \x1b[0m",{},request);
                        resolve();
                    }
                });
               
        });
    };
    
    
    this.sendEmailVodafone = function(request, callback) {
        
        let firstName = request.first_name;
        let contactPhoneCountryCode = request.contact_phone_country_code;
        let contactPhoneNumber = request.contact_phone_number;
        let contactEmailId = request.contact_email_id;
        let deskAssetId = request.desk_asset_id;
            
        vodafoneSendEmail(request, {
            firstName,
            contactPhoneCountryCode,
            contactPhoneNumber,
            contactEmailId,
            customerServiceDeskAssetID: deskAssetId
            }).then(()=>{
                callback(false,{},200);
            }).catch((err)=>{
                console.log('vnk err : ' , err);
                global.logger.write('debug', err, {}, request);
                callback(true,{},-9998);
            });
    };
    
    function vodafoneSendEmail (request, customerCollection) {
        return new Promise((resolve, reject)=>{
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

            switch(Number(request.activity_form_id)) {
                case 856: emailSubject = 'Upload Documents for Order';
                          openingMessage = "Please verify the order details and upload the required documentation.";
                          callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"
                          break;
                case 844: emailSubject = "Approve Order Data";
                          openingMessage = "Please verify the customer application form and approve by providing a digital signature.";
                          callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlApprove + "'>APPROVE</a>"
                          break;
                case 864: emailSubject = "Upload HLD Documents for Order";
                          openingMessage = "Please verify the order details and upload the required documentation.";
                          callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"
                          break;
            }
            

            const formData = JSON.parse(request.activity_inline_data);
            console.log('formData: ', formData);

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
            
            global.logger.write('debug', 'form id extracted from json is: ' + formDataJson[0]['form_id'], {}, request);
            
            var lastObject = formDataJson[formDataJson.length - 1];            
            
            global.logger.write('debug', 'Last object : ' + lastObject, {}, request);
            
            if (lastObject.hasOwnProperty('field_value')) {
            
                global.logger.write('debug', 'Has the field value in the last object', {}, request);
                //remote Analytics
                if (request.form_id == 325) {
                    //monthlySummaryTransInsert(request).then(() => {}); 
                }
            }
            // add form entries
            addFormEntries(request, function (err, approvalFieldsArr) {});
            
            switch(Number(request.form_id)) {
                case 866: //FR Form Definition                          
                          request.activity_inline_data = request.activity_timeline_collection;
                          request.activity_form_id = 866;
            
                case 865: //CRM Form Definition
                          request.activity_inline_data = request.activity_timeline_collection;
                          request.activity_form_id = 865;
            }
            
            
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
                    
                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) { });
                    
                    if(request.auth_asset_id == 31035 && request.flag_status_alter == 1) {
                        
                        request.asset_type_id = 122964;
                        leastLoadedDesk1(request).then((data)=>{
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
    };
    
    function leastLoadedDesk1(request) {
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
    };
    
    
    this.fetchVodafoneFRPull = function(request) {
        return new Promise((resolve, reject)=>{
            var data = {
                    ia_contact_name: 'sravan',
                    ia_contact_designation: 'manager',
                    ia_contact_department: 'IT',
                    ia_installation_address: 'Huzrabad',
                    ia_city_village_postoffice: 'Pothireddypeta',
                    ia_pin_code: '50548',
                    ia_telephone_number: '087272589799',
                    ia_fax_number: '087273589632147',
                    ia_contact_email: 'sravan@desker.co',
                    ia_alternate_number: '7680000368',
                    site_identifier: 'www.vodafone.com',
                    last_mile_details_media: 'last_mile_details_media',
                    customer_end_interface: 'customer_end_interface',
                    service_provider_pop1: 'service_provider_pop1',
                    primary_last_mile_service_provider: 'Blueflock Technologies',
                    primary_cir_bandwidth_kbps: '1000'	
            };
            
            resolve(data);
        });        
    };
    
    this.fetchCRMPortalPull = function(request) {
        return new Promise((resolve, reject)=>{
            var data = {
                    company_name:'Vodafone' ,
                    account_code: '111',
                    authorised_signatory_name: 'Nani',
                    authorised_signatory_designation: 'SSE',
                    authorised_signatory_contact_number: '9966626954',
                    authorised_signatory_email: 'nani@desker.co',
                    ba_contact_name: 'kiran',
                    ba_contact_designation: 'CEO',
                    ba_contact_department: 'BUSINESS',
                    ba_billing_address: 'Jubilee Hills',
                    ba_city_village_postoffice:'Jubilee Hills' ,
                    ba_pin_code: '500032',
                    ba_telephone_number: '04098745621',
                    ba_landmark: 'Peddamma Temple',
                    ba_fax_number: '040897456982',
                    ba_contact_email: 'bharat@desker.co',
                    ba_contact_alternate_number: '9000202182',
                    gstin_uin_gstisd: '258741',
                    gst_registered_address: 'Jubile hills',
                    customer_type: 'Enterprise',
                    channel_partner_name:'TV9'	
            };
            
            resolve(data);
        });        
    };
    
    this.fetchCRMPortalPush = function(request) {
        return new Promise((resolve, reject)=>{
            var data = {
            		crm_acknowledgement_id:'25879658696'
            };
            
            resolve(data);
        });        
    };
    
    
    function checkServiceDeskExistence(request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.organization_id,
                request.workforce_id,
                request.account_id,
                request.account_code //customer_unique_id
            );
            var queryString = util.getQueryString('ds_p1_asset_list_select_customer_unique_id', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if(err === false) {
                     (data.length > 0) ? resolve(true) : resolve(false);
                     } else {
                     reject(err);
                    }
                });
            }
        });
    }

};

module.exports = VodafoneService;
