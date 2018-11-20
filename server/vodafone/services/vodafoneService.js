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
    const cacheWrapper = objectCollection.cacheWrapper;
    const makeRequest = require('request');
    const uuid = require('uuid');
    const fs = require('fs');
    const moment = require('moment');

    this.newOrderFormAddToQueues = function(request, callback) {
        
        var logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;              
        request.form_status_id = global.vodafoneConfig[request.organization_id].STATUS.HLD_PENDING;
        
        //Step 1 :- Fill the order Supplementary form, add a dedicated file for it
        addOrderSuppForm(request).then(()=>{});;
        
        //Step 2 :- Set the status of the form file to "HLD Pending"
        changeStatusToHLDPending(request).then(()=>{});
        
        activityCommonService.getActivityDetails(request, request.activity_id, (err, data)=>{
            if(err === false) {
                                            
                //let fileCreationDateTime = util.replaceDefaultDatetime(data[0].activity_datetime_start_expected);
                let fileCreationDateTime = util.replaceDefaultDatetime(data[0].activity_datetime_created);
                
                //Adding to OMT Queue                
                request.start_from = 0;
                request.limit_value = 1;
                
                //Update the JSON
                let queueMappingJson = {};
                let queueSort = {};
                queueSort.file_creation_time = fileCreationDateTime;
                queueSort.queue_mapping_time = request.datetime_log;
                queueSort.last_status_alter_time = request.datetime_log;
                queueSort.current_status_id = request.form_status_id;
                queueSort.current_status_name = "HLD Pending";
                queueMappingJson.queue_sort = queueSort;
                
                console.log('queueMappingJson : ', JSON.parse(JSON.stringify(queueMappingJson)));

                //Get the Queue ID
                activityCommonService.fetchQueueByQueueName(request, "OMT").then((resp)=>{
                    console.log('Queue Data : ', resp);
                    
                    //Checking the queuemappingid
                    activityCommonService.fetchQueueActivityMappingId(request, resp[0].queue_id).then((queueActivityMappingData) => {
                        console.log('queueActivityMappingData : ', queueActivityMappingData);
                        
                        if(queueActivityMappingData.length > 0){ 
                            //Check the status
                            //If status is same then do nothing
                            let queueInlineData = JSON.parse(queueActivityMappingData[0].queue_inline_data);
                            if(Number(queueInlineData.activity_status_id) !== Number(request.form_status_id)) {
                                //If different unmap the activitymapping and insert the new status id                            
                                queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;                                
                                
                                activityCommonService.queueActivityMappingUpdateInlineStatus(request, queueActivityMappingId, JSON.stringify(queueMappingJson)).then((data)=>{
                                    console.log('Updating the Queue Json : ', data);
                                    activityCommonService.queueHistoryInsert(request, 1402, queueActivityMappingId).then(()=>{});
                                }).catch((err)=>{
                                    global.logger.write('debug', err, {}, request);
                                });                                
                            }
                        } else {                            
                            activityCommonService.mapFileToQueue(request, resp[0].queue_id, JSON.stringify(queueMappingJson)).then((data) => {
                                console.log("Form assigned to OMT queue: ", data);
                                activityCommonService.queueHistoryInsert(request, 1401, data[0].queue_activity_mapping_id).then(()=>{});
                            }).catch((error) => {
                                console.log("Error assigning form to the queue: ", error)
                            });
                        }                                               
                            
                    }).then((data) => { console.log("Form unassigned from queue: ", data); })
                      .catch((error) => { console.log("Error unassigning form from queue: ", error); });                    
                    
                }).catch((err)=>{ global.logger.write('debug', err, {}, request); });

/////////////////////////////////////////////////////////////////////////////////////////////////////                
                //Adding to HLD Queue
                //Get the Queue ID
                activityCommonService.fetchQueueByQueueName(request, "HLD").then((resp)=>{
                    console.log('Queue Data : ', resp);
                    
                    //Checking the queuemappingid
                    activityCommonService.fetchQueueActivityMappingId(request, resp[0].queue_id).then((queueActivityMappingData) => {
                        console.log('queueActivityMappingData : ', queueActivityMappingData);
                        
                        if(queueActivityMappingData.length > 0){ 
                            //Check the status
                            //If status is same then do nothing
                            let queueInlineData = JSON.parse(queueActivityMappingData[0].queue_inline_data);
                            if(Number(queueInlineData.activity_status_id) !== Number(request.form_status_id)) {
                                //If different unmap the activitymapping and insert the new status id                            
                                let queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;                                
                                
                                activityCommonService.queueActivityMappingUpdateInlineStatus(request, queueActivityMappingId, queueMappingJson).then((data)=>{
                                    console.log('Updating the Queue Json : ', data);                                    
                                    activityCommonService.queueHistoryInsert(request, 1402, queueActivityMappingId).then(()=>{});
                                }).catch((err)=>{
                                    global.logger.write('debug', err, {}, request);
                                });                                
                            }
                        } else {                            
                            activityCommonService.mapFileToQueue(request, resp[0].queue_id, JSON.stringify(queueMappingJson)).then((data) => {
                                console.log("Form assigned to OMT queue: ", data);
                                activityCommonService.queueHistoryInsert(request, 1401, data[0].queue_activity_mapping_id).then(()=>{});
                            }).catch((error) => {
                                console.log("Error assigning form to the queue: ", error)
                            });
                        }                                               
                            
                    }).then((data) => { console.log("Form unassigned from queue: ", data); })
                      .catch((error) => { console.log("Error unassigning form from queue: ", error); });                    
                    
                }).catch((err)=>{ global.logger.write('debug', err, {}, request); });

                
            } else {
                callback(true, {}, -9998);
            }
        });       
        
        callback(false, {}, 200);
    };   
    
    function addOrderSuppForm(request) {
        return new Promise((resolve, reject)=>{
            
            //Get the orderSuppForm and add it to the activityinlinedata
            getSpecifiedForm(request, global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY).then((data)=>{
             
                let newRequest = {
                    organization_id: request.organization_id,
                    account_id: global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                    workforce_id: global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                    asset_id: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
                    asset_token_auth: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID.ENC_TOKEN,
                    asset_message_counter: 0,
                    activity_title: "Adding the Order Supplementary Form",
                    activity_description: "Adding the Order Supplementary Form",
                    activity_inline_data: data,
                    activity_datetime_start: util.getCurrentUTCTime(),
                    activity_datetime_end: util.getCurrentUTCTime(),
                    activity_type_category_id: 9,
                    form_id:global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY,
                    activity_sub_type_id: 0,
                    activity_type_id: global.vodafoneConfig[request.organization_id].ACTIVITY_TYPE_IDS.FORM_ACTIVITY_TYPE_ID,
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

                cacheWrapper.getActivityId(function (err, activityId) {
                    if (err) {
                        console.log(err);
                        global.logger.write('debug', err, err, newRequest);
                        reject(err);
                    } else {
                        newRequest['activity_id'] = activityId;
                        let event = {
                            name: "addActivity",
                            service: "activityService",
                            method: "addActivity",
                            payload: newRequest
                        };

                        queueWrapper.raiseActivityEvent(event, newRequest.activity_id, (err, resp) => {
                            if (err) {
                                console.log("\x1b[35m [ERROR] Raising queue activity raised for creating empty Order Supplementary Form. \x1b[0m");
                            } else {
                                console.log("\x1b[35m Queue activity raised for creating empty Order Supplementary Form. \x1b[0m");
                                
                                
                                newRequest.activity_stream_type_id = 705;
                                let event = {
                                    name: "addTimelineTransaction",
                                    service: "activityTimelineService",
                                    method: "addTimelineTransaction",
                                    payload: newRequest
                                };
                                queueWrapper.raiseActivityEvent(event, newRequest.activity_id, (err, resp) => {
                                    if (err) {
                                        console.log("\x1b[35m [ERROR] Raising queue activity raised for timeline entry with 705 streamtypeid. \x1b[0m");
                                    } else {
                                        console.log("\x1b[35m Queue activity raised for timeline entry with 705 streamtypeid. \x1b[0m");
                                        resolve(activityId);
                                   }
                                });
                           }
                        });
                    }
              });
            });
            
        });
    }
    
    this.newOrderFormSubmission = function (request, callback) {
      
        let isFrDone = false;
        let isCRMDone = false;        
        
        if (Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.FR) || 
                Number(global.vodafoneConfig[request.organization_id].FORM_ID.CRM)) {
            
            //check whether FR form is submitted 
            activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, global.vodafoneConfig[request.organization_id].FORM_ID.FR)
                .then((frFormData) => {
                    console.log("FRFormData: ", frFormData);
                    console.log("customerApprovalFormData.length: ", frFormData.length);
         
                    if (frFormData.length > 0) {                                                
                        isFrDone = true;
                    }
            });
            
            //check whether CRM form is submitted
            activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, global.vodafoneConfig[request.organization_id].FORM_ID.CRM)
                .then((crmFormData) => {
                    console.log("CRMFormData: ", crmFormData);
                    console.log("CRMFormData.length: ", crmFormData.length);                            
                            
                    if (crmFormData.length > 0) {                        
                        isCRMDone = true;
                        request.crm_form_data = crmFormData.activity_inline_data;
                    }
            });
        }
            
        console.log("isFrDone: ", isFrDone);
        console.log("isCRMDone: ", isCRMDone);

        if (isFrDone === true && isCRMDone === true) {
            
            activityCommonService.getActivityDetails(request, request.activity_id, (err, data)=>{
                if(err === false) {
                    console.log('data[0].activity_inline_data : ', data[0].activity_inline_data);
                    const newOrderFormData = JSON.parse(data[0].activity_inline_data);                   
                    
                    formData.forEach(formEntry => {                        
                        switch (Number(formEntry.field_id)) {
                            case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Account_Code:
                                 request.account_code = formEntry.field_value;
                                 break;                    
                        }
                    });  
            
                    console.log('Account Code from New Order : ', request.account_code);
                    
                    let customerData = {};
            
                    //construct the request object and call the function
                    const formData = JSON.parse(request.crm_form_data);

                    formData.forEach(formEntry => {
                        switch (Number(formEntry.field_id)) {                   

                            case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Person_Name:
                                 customerData.first_name = formEntry.field_value;
                                 break;                         
                            case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Company_Name:
                                 customerData.contact_company = formEntry.field_value;
                                 break;                    
                            case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Number:                        
                                 customerData.contact_phone_country_code = String(formEntry.field_value).split('||')[0];
                                 customerData.contact_phone_number = String(formEntry.field_value).split('||')[1];
                                 break;                         
                            case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Email_Id:
                                 customerData.contact_email_id = formEntry.field_value;
                                 break;                         
                            case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Designation:
                                 customerData.contact_designation = formEntry.field_value;
                                 break;
                        }
                    });  

                    console.log('customerData after processing : ', customerData);        

                    customerFormSubmission(request, customerData).then(()=>{

                    }).catch((err)=>{
                        global.logger.write('debug', err, {}, request);
                    });
                    
                } else {
                    
                }
            });  
            
        }
        
    };
    
    //Manual
    function customerFormSubmission(request, customerData) {
       return new Promise((resolve, reject)=>{
            var logDatetime = util.getCurrentUTCTime();        
            request['datetime_log'] = logDatetime;
        
            /*let customerData = {};
            customerData.first_name = request.first_name;
            customerData.contact_company = request.contact_company;
            customerData.contact_phone_country_code = request.contact_phone_country_code;
            customerData.contact_phone_number = request.contact_phone_number;
            customerData.contact_email_id = request.contact_email_id;
            customerData.contact_designation = request.contact_designation;

            //let solutionsRepName = global.vodafoneConfig[request.organization_id].SOLUTIONS_REP.NAME;
            //let solutionsRepEMail = global.vodafoneConfig[request.organization_id].SOLUTIONS_REP.EMAIL;*/

            request.form_order_activity_id = request.activity_id;       
             
        //Step 1 :- Custom Based on the Custom Code check whether the service desk is existing or not
        checkServiceDeskExistence(request).then((dataResp)=>{
            if(dataResp.length > 0) { //status is true means service desk exists
                 
                let sdResp = dataResp[0];
                let deskAssetId = sdResp.asset_id;   
                
                console.log('deskAssetId : ', deskAssetId);
                
                if(Number(sdResp.operating_asset_phone_number) !== Number(request.authorised_signatory_contact_number)) {
                    
                    console.log('operating asset phone number is different from authorised_signatory_contact_number');
                                          
                    //Unmap the operating Asset from service desk
                    activityCommonService.assetListUpdateOperatingAsset(request, deskAssetId, 0, (err, data)=>{});
                               
                               var newRequest = Object.assign(request);
                               newRequest.activity_title = 'Adding Co-Worker Contact Card';
                               newRequest.activity_description = 'Adding Co-Worker Contact Card';
                               newRequest.activity_type_id = global.vodafoneConfig[request.organization_id].ACTIVITY_TYPE_IDS.CONTACT_CARD_ACTIVITY_TYPE_ID;
                               newRequest.activity_inline_data = JSON.stringify({
                                    "activity_id": 0,
                                    "activity_ineternal_id": -1,
                                    "activity_type_category_id": 6,
                                    "contact_account_id": global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                                    "contact_asset_id": 0,
                                    "contact_asset_type_id": global.vodafoneConfig[request.organization_id].CUSTOMER.ASSET_TYPE_ID,
                                    "contact_department": "",
                                    "contact_designation": customerData.contact_designation,
                                    "contact_email_id": customerData.contact_email_id,
                                    "contact_first_name": customerData.first_name,
                                    "contact_last_name": "",
                                    "contact_location": "Hyderabad",
                                    "contact_operating_asset_name": customerData.first_name,
                                    "contact_organization": "",
                                    "contact_organization_id": request.organization_id,
                                    "contact_phone_country_code": customerData.contact_phone_country_code,
                                    "contact_phone_number": customerData.contact_phone_number,
                                    "contact_profile_picture": "",
                                    "contact_workforce_id": global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                                    "contact_asset_type_name": "Customer",
                                    "contact_company": customerData.contact_company,
                                    "contact_lat": 0.0,
                                    "contact_lon": 0.0,
                                    "contact_notes": "",
                                    "field_id": 0,
                                    "log_asset_id": request.asset_id,
                                    "web_url": ""
                                });
                                
                               //Create Customer Operating Asset 
                               createAsset(newRequest).then((operatingAssetId)=>{
                                   
                                   //Create a contact file
                                   //createContactFile(newRequest, operatingAssetId).then((contactfileActId)=>{
                                       
                                        //Map the operating Asset to the contact file
                                        //addCustomerAsParticipantToContFile(newRequest, contactfileActId, customerData, operatingAssetId).then(()=>{});
                                        
                                        //Map the newly created operating asset with service desk asset
                                        activityCommonService.assetListUpdateOperatingAsset(request, deskAssetId, operatingAssetId, (err, data)=>{});
                                       
                                        //Add Service Desk as Participant to form file
                                        addDeskAsParticipant(request, customerData, deskAssetId).then(()=>{

                                            var customerCollection = {};
                                            customerCollection.firstName = customerData.first_name;
                                            customerCollection.contactPhoneCountryCode = customerData.contact_phone_country_code;
                                            customerCollection.contactPhoneNumber = customerData.contact_phone_number;
                                            customerCollection.contactEmailId = customerData.contact_email_id;
                                            customerCollection.customerServiceDeskAssetID = deskAssetId;
                                            customerCollection.activity_form_id = global.vodafoneConfig[request.organization_id].FORM_ID.EXISTING_CUSTOMER;
                                            
                                            activityCommonService.getActivityDetails(request, request.form_order_activity_id, (err, data)=>{
                                                if(err === false) {
                                                    console.log('data[0].activity_inline_data : ', data[0].activity_inline_data);
                                                    request.activity_inline_data = data[0].activity_inline_data;
                                                    
                                                    let response = {};
                                                    response.asset_id = operatingAssetId;
                                                    response.desk_asset_id = deskAssetId;                                                    
                                                    
                                                    //Fire Email to Customer
                                                    vodafoneSendEmail(request, customerCollection).then(()=>{
                                                        resolve(response);
                                                    }).catch((err)=>{
                                                        console.log('err : ' , err);
                                                        global.logger.write('debug', err, {}, request);
                                                        reject(err);
                                                    });
                                                    
                                                    /*var solutionsRepCollection = {};
                                                    solutionsRepCollection.firstName = solutionsRepName;
                                                    //solutionsRepCollection.contactPhoneCountryCode = customerData.contact_phone_country_code;
                                                    //solutionsRepCollection.contactPhoneNumber = customerData.contact_phone_number;
                                                    solutionsRepCollection.contactEmailId = solutionsRepEMail;                                            
                                                    solutionsRepCollection.customerServiceDeskAssetID = deskAssetId;
                                                    solutionsRepCollection.activity_form_id = HLD_FORM_ID;

                                                    //Fire Email to Solutions Representation to submit HLD Form
                                                    vodafoneSendEmail(request, solutionsRepCollection).then(()=>{
                                                        resolve(response);
                                                    }).catch((err)=>{
                                                        console.log('err : ' , err);
                                                        global.logger.write('debug', err, {}, request);
                                                        reject(err);
                                                    });*/
                                                    
                                                } else {
                                                    global.logger.write('debug', err, {}, request);
                                                }
                                            });                                           

                                        }).catch((err)=>{
                                            global.logger.write('debug', err, {}, request);
                                        }); 
                                   /*}).catch((err)=>{
                                       global.logger.write('debug', err, {}, request);
                                   });*/
                                   
                               }).catch((err)=>{                                   
                                   global.logger.write('debug', err, {}, request);                                        
                               });                              
                               
                            } else { //When authorized_signatory_phone_number is equal to the retrieved operating asset
                                    console.log('operating asset phone number is same as authorised_signatory_contact_number');
                                        //Add Service Desk as Participant to form file
                                        addDeskAsParticipant(request, customerData, deskAssetId).then(()=>{

                                            var customerCollection = {};
                                            customerCollection.firstName = customerData.first_name;
                                            customerCollection.contactPhoneCountryCode = customerData.contact_phone_country_code;
                                            customerCollection.contactPhoneNumber = customerData.contact_phone_number;
                                            customerCollection.contactEmailId = customerData.contact_email_id;
                                            customerCollection.customerServiceDeskAssetID = deskAssetId;
                                            customerCollection.activity_form_id = global.vodafoneConfig[request.organization_id].FORM_ID.EXISTING_CUSTOMER;
            
                                            activityCommonService.getActivityDetails(request, request.activity_id, (err, data)=>{
                                                if(err === false) {
                                                    request.activity_inline_data = data[0].activity_inline_data;
                                                    
                                                    let response = {};                                                    
                                                    response.desk_asset_id = deskAssetId;     
                                                    
                                                    //Fire Email to customer
                                                    vodafoneSendEmail(request, customerCollection).then(()=>{
                                                        resolve(response);
                                                    }).catch((err)=>{
                                                        console.log('vnk err : ' , err);
                                                        global.logger.write('debug', err, {}, request);
                                                        reject(err);
                                                    });
                                                    
                                                    /*var solutionsRepCollection = {};
                                                    solutionsRepCollection.firstName = solutionsRepName;
                                                    //solutionsRepCollection.contactPhoneCountryCode = customerData.contact_phone_country_code;
                                                    //solutionsRepCollection.contactPhoneNumber = customerData.contact_phone_number;
                                                    solutionsRepCollection.contactEmailId = solutionsRepEMail;                                            
                                                    solutionsRepCollection.customerServiceDeskAssetID = deskAssetId;
                                                    solutionsRepCollection.activity_form_id = HLD_FORM_ID;

                                                    //Fire Email to Solutions Representation to submit HLD Form
                                                    vodafoneSendEmail(request, solutionsRepCollection).then(()=>{
                                                        resolve(response);
                                                    }).catch((err)=>{
                                                        console.log('err : ' , err);
                                                        global.logger.write('debug', err, {}, request);
                                                        reject(err);
                                                    });*/
                                                    
                                                } else {
                                                    global.logger.write('debug', err, {}, request);
                                                }
                                            });

                                        }).catch((err)=>{
                                            global.logger.write('debug', err, {}, request);
                                        });
                                
                            }
                            
//When Service desk not exists
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                        } else {
                            console.log('In else part');
                            //Create Customer Operating Asset
                            //Create Customer Contact file
                            //Create Customer Desk Asset                            
                            createAssetContactDesk(request, customerData).then((resp)=>{                                
                                                             
                                let assetId = resp.response.asset_id;
                                let deskAssetId = resp.response.desk_asset_id;
                                let contactfileActId = resp.response.activity_id;
                                
                                //Map the operating Asset to the contact file
                                addCustomerAsParticipantToContFile(newRequest, contactfileActId, customerData, assetId).then(()=>{});
                                
                                //Add Service Desk as Participant to form file
                                addDeskAsParticipant(request, customerData, deskAssetId).then(()=>{
                                    
                                    let customerCollection = {};
                                    customerCollection.firstName = customerData.first_name;
                                    customerCollection.contactPhoneCountryCode = customerData.contact_phone_country_code;
                                    customerCollection.contactPhoneNumber = customerData.contact_phone_number;
                                    customerCollection.contactEmailId = customerData.contact_email_id;
                                    customerCollection.customerServiceDeskAssetID = deskAssetId;
                                    customerCollection.activity_form_id = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_CUSTOMER;
                                    
                                    activityCommonService.getActivityDetails(request, request.activity_id, (err, data)=>{
                                        if(err === false) {
                                            request.activity_inline_data = data[0].activity_inline_data;
                                             
                                            let response = {};
                                            response.asset_id = assetId;
                                            response.desk_asset_id = deskAssetId;
                                            response.contact_card_activity_id = contactfileActId;
                                            
                                            //Fire Email to Customer
                                            vodafoneSendEmail(request, customerCollection).then(()=>{
                                                resolve(response);
                                            }).catch((err)=>{
                                                console.log('err : ' , err);
                                                global.logger.write('debug', err, {}, request);
                                                reject(err);
                                            });
                                            
                                            /*var solutionsRepCollection = {};
                                            solutionsRepCollection.firstName = solutionsRepName;
                                            //solutionsRepCollection.contactPhoneCountryCode = customerData.contact_phone_country_code;
                                            //solutionsRepCollection.contactPhoneNumber = customerData.contact_phone_number;
                                            solutionsRepCollection.contactEmailId = solutionsRepEMail;                                            
                                            solutionsRepCollection.customerServiceDeskAssetID = deskAssetId;
                                            solutionsRepCollection.activity_form_id = HLD_FORM_ID;
                                            
                                            //Fire Email to Solutions Representation to submit HLD Form
                                            vodafoneSendEmail(request, solutionsRepCollection).then(()=>{
                                                resolve(response);
                                            }).catch((err)=>{
                                                console.log('err : ' , err);
                                                global.logger.write('debug', err, {}, request);
                                                reject(err);
                                            });*/
                                                    
                                        } else {
                                            global.logger.write('debug', err, {}, request);
                                        }
                                    });
                                    
                                }).catch((err)=>{
                                    global.logger.write('debug', err, {}, request);
                                });
                                
                                
                            }).catch((err)=>{
                                global.logger.write('debug', err, {}, request);
                            });                 
                            
                        }
                    }).catch((err)=>{
                        global.logger.write('debug', err, {}, request);
                    });
        });       
             
    };
     
  
    function changeStatusToHLDPending(request) {
        return new Promise((resolve, reject)=>{
           
           var newRequest = Object.assign(request);
           newRequest.activity_status_id = global.vodafoneConfig[request.organization_id].STATUS.HLD_PENDING;
           newRequest.activity_status_type_id = 0; 
           //newRequest.activity_status_type_category_id = ""; 
           newRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
           
           var event = {
                name: "alterActivityStatus",
                service: "activityService",
                method: "alterActivityStatus",
                payload: newRequest
            };

            queueWrapper.raiseActivityEvent(event, newRequest.activity_id, (err, resp) => {
                if (err) {
                    console.log("\x1b[35m [ERROR] Raising queue activity raised for changing the status to HLD Pending. \x1b[0m");
                } else {
                    console.log("\x1b[35m Queue activity raised for changing the status to HLD Pending. \x1b[0m");
                }
            });

            resolve();
        });
    }
    
    /*function frFormApiIntegration(request) {
        return new Promise((resolve, reject)=>{
            var requestOptionsForFrPull = Object.assign(request);
            requestOptionsForFrPull.api_secret = global.config.frApiSecret;
            requestOptionsForFrPull.url = 'vodafone/fr/pull';

            activityCommonService.makeRequest(requestOptionsForFrPull, requestOptionsForFrPull.url, 1).then((resp)=>{
                global.logger.write('debug', resp, {}, request);
                let frResponse = JSON.parse(resp);             
                
                var frPulledRespAsTlReq = Object.assign(request);
                frPulledRespAsTlReq.activity_timeline_collection = JSON.stringify(frResponse.response);
                frPulledRespAsTlReq.activity_form_id = global.config.frFormId;

                if (Number(frResponse.status) === 200) {
                    //Timeline Entry
                    var event = {
                        name: "vodafone",
                        service: "vodafoneService",
                        method: "addTimelineTransactionVodafone",
                        payload: frPulledRespAsTlReq
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
                  reject('Status is ' + Number(frResponse.status) +' while doing FR Pull Request');
              }
            });
      });
    };
    
    
    function crmFormApiIntegration(request, customerData) {
        return new Promise((resolve, reject)=>{
            
            var requestOptionsForCrmPull = Object.assign(request);            
            requestOptionsForCrmPull.api_secret = global.config.crmApiSecret;
            requestOptionsForCrmPull.url = 'vodafone/crm_portal/pull';

            activityCommonService.makeRequest(requestOptionsForCrmPull, requestOptionsForCrmPull.url, 1).then((resp)=>{
                global.logger.write('debug', resp, {}, request);
                let crmResponse = JSON.parse(resp);
                crmResponse.activity_timeline_collection = crmResponse.response;
                crmResponse.activity_form_id = global.config.crmFormId;
                
                if (Number(crmResponse.status) === 200) {
                    request.authorised_signatory_contact_number = crmResponse.response.authorised_signatory_contact_number || 'undefined';
                    request.authorised_signatory_email = crmResponse.response.authorised_signatory_email || 'undefined';
                    
                    if(request.authorised_signatory_contact_number == 'undefined' || request.authorised_signatory_email == 'undefined') {
                        reject('Authorised Signatory phone number or email is missing from CRM Pull');
                    } else {
                        
                        customerData.first_name = crmResponse.response.authorised_signatory_name || "";
                        customerData.contact_company = crmResponse.response.company_name || "";
                        customerData.contact_phone_country_code = "";
                        customerData.contact_phone_number = request.authorised_signatory_contact_number;
                        customerData.contact_email_id = request.authorised_signatory_email;
                        customerData.contact_designation = crmResponse.response.ba_contact_designation || "";
                        
                        console.log("firstName: ", customerData.first_name);
                        console.log("contactCompany: ", customerData.contact_company);
                        console.log("contactPhoneCountryCode: ", customerData.contact_phone_country_code);
                        console.log("contactPhoneNumber: ", customerData.contact_phone_number);
                        console.log("contactEmailId: ", customerData.contact_email_id);
                        console.log("contactDesignation: ", customerData.contact_designation);
                        
                        var crmPulledRespAsTlReq = Object.assign(request);
                        crmPulledRespAsTlReq.activity_timeline_collection = JSON.stringify(crmResponse.response);
                        crmPulledRespAsTlReq.activity_form_id = global.config.crmFormId;
                        
                        //Timeline Entry
                        var event = {
                            name: "vodafone",
                            service: "vodafoneService",
                            method: "addTimelineTransactionVodafone",
                            payload: crmPulledRespAsTlReq
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
                    }
                } else {
                    reject('Status is ' + Number(crmResponse.status) +' while doing CRM Pull Request');
                }
        });
      });
    };*/
    
    function createAssetContactDesk(request, customerData){
        return new Promise((resolve, reject)=>{                     

            let customerServiceDeskRequest = {
                organization_id: request.organization_id,
                account_id: global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                workforce_id: global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                asset_id: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
                asset_token_auth: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID.ENC_TOKEN,
                asset_message_counter: 1,
                activity_title: customerData.first_name,
                activity_description: customerData.first_name,
                activity_inline_data: JSON.stringify({
                    "activity_id": 0,
                    "activity_ineternal_id": -1,
                    "activity_type_category_id": 6,
                    "contact_account_id": global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                    "contact_asset_id": 0,
                    "contact_asset_type_id": global.vodafoneConfig[request.organization_id].CUSTOMER.ASSET_TYPE_ID, //Customer Operating Asset Type ID
                    "contact_department": "",
                    "contact_designation": customerData.contact_designation,
                    "contact_email_id": customerData.contact_email_id,
                    "contact_first_name": customerData.first_name,
                    "contact_last_name": "",
                    "contact_location": "Hyderabad",
                    "contact_operating_asset_name": customerData.first_name,
                    "contact_organization": "",
                    "contact_organization_id": request.organization_id,
                    "contact_phone_country_code": customerData.contact_phone_country_code,
                    "contact_phone_number": customerData.contact_phone_number,
                    "contact_profile_picture": "",
                    "contact_workforce_id": global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                    "contact_asset_type_name": "Customer",
                    "contact_company": customerData.contact_company,
                    "contact_lat": 0.0,
                    "contact_lon": 0.0,
                    "contact_notes": "",
                    "field_id": 0,
                    "log_asset_id": request.asset_id,
                    "web_url": ""
                }),
                account_code: request.account_code,
                activity_datetime_start: util.getCurrentUTCTime(),
                activity_datetime_end: util.getCurrentUTCTime(),
                activity_type_category_id: 6,
                activity_sub_type_id: 0,
                activity_type_id: global.vodafoneConfig[request.organization_id].ACTIVITY_TYPE_IDS.FORM_ACTIVITY_TYPE_ID,
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
            
            console.log('Before Making Request');
            makeRequest.post(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', requestOptions, function (error, response, body) {
                console.log("[customerServiceDeskRequest] Body: ", body);
                console.log("[customerServiceDeskRequest] Error: ", error);
                // console.log("[customerServiceDeskRequest] Response: ", response);

                body = JSON.parse(body);                

                if (Number(body.status) === 200) {                    
                    const assetID = body.response.asset_id;
                    const DeskAssetID = body.response.desk_asset_id;
                    
                    resolve(body);
                } else {
                    reject('Status is ' + Number(body.status) +' while creating Service Desk');
                }
            });
    });
   }
   
   function addDeskAsParticipant(request, customerData, deskAssetId) {
       return new Promise((resolve, reject)=>{
            
           let addParticipantRequest = {
                organization_id: request.organization_id,
                account_id: global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                workforce_id: global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                asset_id: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
                asset_token_auth: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID.ENC_TOKEN,
                asset_message_counter: 0,
                activity_id: Number(request.form_order_activity_id),
                activity_access_role_id: 29,
                activity_type_category_id: 9,
                activity_type_id: 0,
                activity_participant_collection: JSON.stringify([{
                    "access_role_id": 29,
                    "account_id": global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                    "activity_id": Number(request.form_order_activity_id),
                    "asset_datetime_last_seen": "1970-01-01 00:00:00",
                    "asset_first_name": customerData.first_name,
                    "asset_id": Number(deskAssetId),
                    "asset_image_path": "",
                    "asset_last_name": "",
                    "asset_phone_number": customerData.contact_phone_number,
                    "asset_phone_number_code": customerData.contact_phone_country_code,
                    "asset_type_category_id": 45,
                    "asset_type_id": global.vodafoneConfig[request.organization_id].CUSTOMER.DESK_ASSET_TYPE_ID,
                    "field_id": 0,
                    "log_asset_id": request.asset_id,
                    "message_unique_id": util.getMessageUniqueId(Number(request.asset_id)),
                    "operating_asset_first_name": customerData.first_name,
                    "organization_id": request.organization_id,
                    "workforce_id": global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID
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
    
    /*function createContactFile(newRequest, operatingAssetId) {
        return new Promise((resolve, reject)=>{
           var contactJson = eval('(' + newRequest.activity_inline_data + ')');
           contactJson['contact_asset_id'] = operatingAssetId;
           newRequest.activity_inline_data = JSON.stringify(contactJson);
           newRequest.message_unique_id = util.getMessageUniqueId(newRequest.asset_id);
                                  
           cacheWrapper.getActivityId(function (err, activityId) {
            if (err) {
                console.log(err);
                global.logger.write('debug', err, err, newRequest);
                reject(err);
            } else {
                newRequest['activity_id'] = activityId;
                var event = {
                    name: "addActivity",
                    service: "activityService",
                    method: "addActivity",
                    payload: newRequest
                };
                
            queueWrapper.raiseActivityEvent(event, newRequest.activity_id, (err, resp) => {
                if (err) {
                    console.log("\x1b[35m [ERROR] Raising queue activity raised for creating Contact File. \x1b[0m")
                } else {
                    console.log("\x1b[35m Queue activity raised for creating Contact File. \x1b[0m");
                    resolve(activityId);
               }
            });            
            }
          });       
        });
    };*/
    
    
    function addCustomerAsParticipantToContFile(request, contactFileActId, customerData, operatingAssetId) {
       return new Promise((resolve, reject)=>{
            
           let addParticipantRequest = {
                organization_id: request.organization_id,
                account_id: global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                workforce_id: global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                asset_id: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
                asset_token_auth: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID.ENC_TOKEN,
                asset_message_counter: 0,
                activity_id: contactFileActId,
                activity_access_role_id: 29,
                activity_type_category_id: 9,
                activity_type_id: 0,
                activity_participant_collection: JSON.stringify([{
                    "access_role_id": 29,
                    "account_id": global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                    "activity_id": contactFileActId,
                    "asset_datetime_last_seen": "1970-01-01 00:00:00",
                    "asset_first_name": customerData.first_name,
                    "asset_id": operatingAssetId,
                    "asset_image_path": "",
                    "asset_last_name": "",
                    "asset_phone_number": customerData.contact_phone_number,
                    "asset_phone_number_code": customerData.contact_phone_country_code,
                    "asset_type_category_id": 13,
                    "asset_type_id": global.vodafoneConfig[request.organization_id].CUSTOMER.ASSET_TYPE_ID,
                    "field_id": 0,
                    "log_asset_id": request.asset_id,
                    "message_unique_id": util.getMessageUniqueId(Number(request.asset_id)),
                    "operating_asset_first_name": customerData.first_name,
                    "organization_id": request.organization_id,
                    "workforce_id": global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID
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
                        global.logger.write('debug',"\x1b[35m [ERROR] Raising queue activity raised for mapping customer operating asset to Contact file. \x1b[0m",{},request);
                        reject('Error while raising queue activity for mapping customer operating asset to Contact file.');
                    } else {                        
                        global.logger.write('debug',"\x1b[35m Queue activity raised for mapping customer operating asset to Contact file. \x1b[0m",{},request);
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
                console.log('err : ' , err);
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
                organization_id: request.organization_id,
                account_id: request.account_id,
                workforce_id: request.workforce_id,
                asset_id: Number(customerCollection.customerServiceDeskAssetID),
                asset_token_auth: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID.ENC_TOKEN,
                auth_asset_id: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
                activity_id: request.activity_id || 0,
                activity_type_category_id: 9,
                activity_stream_type_id : 705,
                form_id: Number(customerCollection.activity_form_id),                
                type: 'approval'
            };

            if (String(customerCollection.contactEmailId).includes('%40')) {
                customerCollection.contactEmailId = String(customerCollection.contactEmailId).replace(/%40/g, "@");
            }

            const encodedString = Buffer.from(JSON.stringify(jsonString)).toString('base64');

            const baseUrlApprove = global.config.emailbaseUrlApprove + "/#/forms/entry/" + encodedString;
            const baseUrlUpload = global.config.emailbaseUrlUpload + "/#/forms/entry/" + encodedString;

            switch(Number(customerCollection.activity_form_id)) {
                case 856: emailSubject = 'Upload Documents for Order';
                          openingMessage = "Please verify the order details and upload the required documentation.";
                          callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"
                          break;
                case 844: emailSubject = "Approve Order Data";
                          openingMessage = "Please verify the customer application form and approve by providing a digital signature.";
                          callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlApprove + "'>APPROVE</a>"
                          break;
                case global.vodafoneConfig[request.organization_id].FORM_ID.HLD:
                          emailSubject = "Upload HLD Documents for Order";
                          openingMessage = "Please verify the order details and upload the required documentation.";
                          callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"
                          break;                
                case global.vodafoneConfig[request.organization_id].FORM_ID.NEW_CUSTOMER:
                          emailSubject = 'Upload Documents for Order';
                          openingMessage = "Please verify the order details and upload the required documentation.";
                          callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"
                          break;
                //Existing Customer
                case global.vodafoneConfig[request.organization_id].FORM_ID.EXISTING_CUSTOMER:
                          emailSubject = 'Upload Documents for Order';
                          openingMessage = "Please verify the order details and upload the required documentation.";
                          callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"
                          break;
            }
            

            try {
                const formData = JSON.parse(request.activity_inline_data);
                //console.log('formData: ', formData);
               
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
            } catch(e) {
                console.log('In Catch Block : ', e);
            }       

            console.log("\x1b[35m [vodafoneSendEmail] fieldHTML: \x1b[0m", fieldHTML)
            const allFields = fieldHTML;

            const templateDesign = "<table style='border-collapse: collapse !important;' width='100%' bgcolor='#ffffff' border='0' cellpadding='10' cellspacing='0'><tbody><tr> <td> <table bgcolor='#ffffff' style='width: 100%;max-width: 600px;' class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tbody><tr><td align='center' valign='top'><table style='border: 1px solid #e2e2e2; border-radius: 4px; background-clip: padding-box; border-spacing: 0;' border='0' cellpadding='0' cellspacing='0' width='100%' id='templateContainer'><tbody> <tr> <td align='left' style='float: right;padding: 20px;' valign='top'> <img style='width: 100px' src ='https://office.desker.co/Vodafone_logo.png'/> <img style='height: 44px;margin-left: 10px;' src ='https://office.desker.co/Idea_logo.png'/> </td> </tr> <tr><td valign='top' style=' color: #505050; font-family: Helvetica; font-size: 14px; line-height: 150%; padding-top: 3.143em; padding-right: 3.5em; padding-left: 3.5em; padding-bottom: 3.143em; text-align: left;' class='bodyContent' mc:edit='body_content'> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>Hey " + nameStr + ",</p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>" + openingMessage + "</p> <p style=' color: #808080; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: bold; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 10px; margin-left: 0; text-align: left;'>Order Management Form</p> " + allFields + "<table style='width: 100%;margin-top: 5px'></table> " + callToction + " <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 40px; margin-right: 0; margin-bottom: 0px; margin-left: 0; text-align: left;'> Parmeshwar Reddy </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Vice President </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Customer Care </p></td></tr> <tr> <td style='height: 35px;background: #cbcbcb;'></td> </tr></tbody></table><!-- // END BODY --></td></tr> </tbody></table> </td> </tr></tbody></table>";

            request.email_sender = 'vodafone_idea@grenerobotics.com';
            request.email_sender_name = 'vodafone_idea grenerobotics.com';            
                    
            util.sendEmailV3(request,
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
    
    /*this.addFeasibilityChecker = function(request, callback) {
        
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
    };*/
    
    
    this.addTimelineTransactionExternal = function (request, callback) {       
                        
        /*From request you have to get the (means you have to send the same in base64 in firing email service)
            1) order form activity Id
            2) form id
            3) Form Data in activity_timeline_collection
         */
        
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id) || 9;
        var activityStreamTypeId = Number(request.activity_stream_type_id) || 325;
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        
        switch(Number(request.form_id)) {
                case 866: //FR Form Definition
                case 871: request.activity_inline_data = request.activity_timeline_collection;
                          request.activity_form_id = FR_FORM_ID;                          
                          request.form_name = "FR Form";
                          break;                      
                case 865: //CRM Form Definition
                case 870: request.activity_inline_data = request.activity_timeline_collection;
                          request.activity_form_id = CRM_FORM_ID;
                          request.form_name = "CRM Form";
                          break;
                case 864: //HLD Form
                case 869: request.activity_inline_data = request.activity_timeline_collection;
                          request.activity_form_id = HLD_FORM_ID;                          
                          request.form_name = "HLD Form";
                          break;
                case 867: //CAF Form
                case 872: request.activity_inline_data = request.activity_timeline_collection;
                          request.activity_form_id = CAF_FORM_ID;                          
                          request.form_name = "CAF Form";
                          break;                
                case 876: //New Customer
                case 880: request.activity_inline_data = request.activity_timeline_collection;
                          request.activity_form_id = newCustomer;                          
                          break;            
                case 877: //Existing Customer
                case 881: request.activity_inline_data = request.activity_timeline_collection;
                          request.activity_form_id = existingCustomer;
                          break;
            }
        
        
        var activityTimelineCollection = {};
            activityTimelineCollection.content = "Form Submitted";
            activityTimelineCollection.subject = request.form_name;
            activityTimelineCollection.mail_body = request.form_name;
            activityTimelineCollection.form_submitted = JSON.parse(request.activity_timeline_collection);
            activityTimelineCollection.attachments = [];
            activityTimelineCollection.asset_reference = [];
            activityTimelineCollection.activity_reference = [];
            activityTimelineCollection.form_approval_field_reference = [];
        
        if(!(request.hasOwnProperty('from_internal'))) {
            //Create a new file activity for the customer submitted form data with file status -1
            addActivityChangeFileStatus(request).then(()=>{

            }).catch((err)=>{
                console.log(err);
                global.logger.write('debug', err, {}, request);
            });
        }
        
        //var formDataJson = JSON.parse(request.activity_timeline_collection);
        //request.form_id = formDataJson[0]['form_id'];
                        
        // add form entries
        //addFormEntries(request, function (err, approvalFieldsArr) {});
            
            
        request.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
        
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
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) { });
                    
                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) { });
                    
                    /*if(request.auth_asset_id == global.config.botAssetId && request.flag_status_alter == 1) {
                        
                        request.asset_type_id = global.config.contactDeskAssetTypeId;
                        leastLoadedDesk1(request).then((data)=>{
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
                    } */
                }
            });
        }
        callback(false, {}, 200);
    };
    
    
    function addActivityChangeFileStatus(request) {
        return new Promise((resolve, reject)=>{
            
            let addFileActivityReq = {
                organization_id: contactOrganizationId,
                account_id: contactAccountId,
                workforce_id: contactWorkforceId,
                asset_id: botAssetID,
                asset_token_auth: botEncToken,
                asset_message_counter: 0,                
                activity_type_category_id: 10,
                activity_title: "Customer Form Data Submitted",
                activity_description:"Customer Form Data Submitted",
                activity_inline_data: request.activity_timeline_collection,
                activity_type_id: activityTypeId,
                activity_sub_type_id: 1,
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
                
                activityCommonService.makeRequest(addFileActivityReq, 'activity/add/v1', 1).then((resp)=>{
                    let response = JSON.parse(resp);
                    
                    let flagAlterReq = {};
                    flagAlterReq.activity_id = response.response.activity_id;                    
                    flagAlterReq.asset_id = botAssetID;
                    flagAlterReq.organization_id = contactOrganizationId;
                    flagAlterReq.activity_flag_file_enabled = -1;

                    if (Number(response.status) === 200) {                        
                                              
                        var event = {
                            name: "alterActivityFlagFileEnabled",
                            service: "activityUpdateService",
                            method: "alterActivityFlagFileEnabled",
                            payload: flagAlterReq
                        };
                        
                        queueWrapper.raiseActivityEvent(event, flagAlterReq.activity_id, (err, resp) => {
                            if (err) {
                                global.logger.write('debug',"\x1b[35m [ERROR] Raising queue activity raised for adding Service Desk as a participant. \x1b[0m",{},request);
                                reject('Error while raising queue activity for adding service desk as a participant');
                            } else {                        
                                global.logger.write('debug',"\x1b[35m Queue activity raised for adding Service Desk as a participant. \x1b[0m",{},request);
                                resolve();
                            }
                        });
                        resolve();
                    } else {
                        reject(response);
                    }
                });
        });
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
    
    /*function leastLoadedDesk1(request) {
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
                    if (err === false) {
                        console.log('Dataa from DB: ', data);
                        resolve(data)
                    } else {
                        reject(err);
                    }
                });
            }
        });        
    };*/
    
    
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
                0,
                0,
                request.account_code,
                45 // employee 2 ; Customer 13; service desk 45
            );            
            var queryString = util.getQueryString('ds_p1_1_asset_list_select_customer_unique_id', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if(err === false) {
                     console.log('checkServiceDeskExistence data : ', data);                     
                     resolve(data);
                     } else {
                     reject(err);
                    }
                });
            }
        });
    }
    
    
    function createAsset(request) {
        return new Promise((resolve, reject)=>{
            var dateTimeLog = util.getCurrentUTCTime();
            request['datetime_log'] = dateTimeLog;

            assetListInsertAddAsset(request, function (err, newAssetId) {
                if (err === false) {
                    assetListHistoryInsert(request, newAssetId, request.organization_id, 0, dateTimeLog, function (err, data) {
                        if (err === false) {
                            var newAssetCollection = {
                                organization_id: request.organization_id,
                                account_id: request.account_id,
                                workforce_id: request.workforce_id,
                                asset_id: newAssetId,
                                message_unique_id: request.message_unique_id
                            };
                            activityCommonService.assetTimelineTransactionInsert(request, newAssetCollection, 7, function (err, data) {});                        
                    } else {
                        reject(err);
                    }
                });
                resolve(newAssetId);
            } else {                
                reject(err);
            }
        });   
        });
    };
    
    var assetListInsertAddAsset = function (request, callback) {
        var activityInlineData = JSON.parse(request.activity_inline_data);      
          
        var paramsArr = new Array(
            activityInlineData.contact_first_name,
            activityInlineData.contact_last_name,
            request.asset_description || "",
            request.account_code || 0,
            activityInlineData.contact_profile_picture,
            request.activity_inline_data, //p_asset_inline_data
            activityInlineData.contact_phone_country_code,
            activityInlineData.contact_phone_number,
            activityInlineData.contact_email_id,
            22,
            activityInlineData.contact_asset_type_id, // asset type id
            request.operating_asset_id || 0,
            0,
            activityInlineData.contact_workforce_id || request.workforce_id,
            activityInlineData.contact_account_id || request.account_id,
            activityInlineData.contact_organization_id || request.organization_id,
            request.asset_id,
            request.datetime_log
        );

        var queryString = util.getQueryString('ds_v1_asset_list_insert', paramsArr);
        if (queryString != '') {
            //global.logger.write(queryString, request, 'asset', 'trace');
            db.executeQuery(0, queryString, request, function (err, assetData) {
                (err === false) ? callback(false, assetData[0]['asset_id']): callback(err, false);
            });
        }
    };
    
    var assetListHistoryInsert = function (request, assetId, organizationId, updateTypeId, datetimeLog, callback) {
        var paramsArr = new Array(
            assetId,
            organizationId,
            updateTypeId,
            datetimeLog
        );

        var queryString = util.getQueryString('ds_v1_asset_list_history_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                //global.logger.write(queryString, request, 'asset', 'trace');
                (err === false) ? callback(false, true): callback(err, false);                
            });
        }
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

        // CAF
        let CAF_ORGANIZATION_ID,
            CAF_ACCOUNT_ID,
            CAF_WORKFORCE_ID,
            CAF_ACTIVITY_TYPE_ID,
            CAF_BOT_ASSET_ID,
            CAF_BOT_ENC_TOKEN;

        if (Number(request.organization_id) === 860) {
            // CAF
            CAF_ORGANIZATION_ID = 860; // Vodafone Idea Beta
            CAF_ACCOUNT_ID = 975; // Central OMT Beta
            CAF_WORKFORCE_ID = 5355; // Lobby
            CAF_ACTIVITY_TYPE_ID = 133250;
            // CAF BOT
            CAF_BOT_ASSET_ID = 31347;
            CAF_BOT_ENC_TOKEN = "05986bb0-e364-11e8-a1c0-0b6831833754";

        } else if (Number(request.organization_id) === 858) {
            // CAF
            CAF_ORGANIZATION_ID = 858; // Vodafone Idea Beta
            CAF_ACCOUNT_ID = 973; // Central OMT Beta
            CAF_WORKFORCE_ID = 5345; // Lobby
            CAF_ACTIVITY_TYPE_ID = 133000;
            // CAF BOT
            CAF_BOT_ASSET_ID = 31298;
            CAF_BOT_ENC_TOKEN = "3dc16b80-e338-11e8-a779-5b17182fa0f6";

        }
        const NEW_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER,
            SUPPLEMENTARY_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY,
            FR_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.FR,
            CRM_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM,
            HLD_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.HLD,
            CAF_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CAF;

        const ACTIVITY_STATUS_ID_VALIDATION_PENDING = global.vodafoneConfig[request.organization_id].STATUS.VALIDATION_PENDING;

        var cafFormJson = [];
        var formId = NEW_ORDER_FORM_ID;

        // Pull the required data from the NEW ORDER FORM of the form file
        activityCommonService
            .getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
            .then((newOrderFormData) => {
                if (newOrderFormData.length > 0) {
                    // Append it to cafFormJson
                    cafFormJson = applyTransform(request, cafFormJson, JSON.parse(newOrderFormData[0].data_entity_inline), formId);
                    // Pull the required data from the SUPPLEMENTARY ORDER FORM of the form file
                    formId = SUPPLEMENTARY_ORDER_FORM_ID;
                    return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
                } else {
                    throw new Error("newOrderFormNotFound");
                }

            })
            .then((supplementaryOrderFormData) => {
                // 
                if (supplementaryOrderFormData.length > 0) {
                    // Append it to cafFormJson
                    cafFormJson = applyTransform(request, cafFormJson, JSON.parse(supplementaryOrderFormData[0].data_entity_inline), formId);
                }

                // Pull the required data from the SUPPLEMENTARY ORDER FORM of the form file
                formId = FR_FORM_ID;
                return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
            })
            .then((frFormData) => {
                if (frFormData.length > 0) {
                    // Append it to cafFormJson
                    cafFormJson = applyTransform(request, cafFormJson, JSON.parse(frFormData[0].data_entity_inline), formId);
                    // Pull the required data from the CRM FORM of the form file
                    formId = CRM_FORM_ID;
                    return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
                } else {
                    throw new Error("frFormNotFound");
                }
                // formId = CRM_FORM_ID;
                // return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
            })
            .then((crmFormData) => {
                if (crmFormData.length > 0) {
                    // Append it to cafFormJson
                    cafFormJson = applyTransform(request, cafFormJson, JSON.parse(crmFormData[0].data_entity_inline), formId);
                    // Pull the required data from the HLD FORM of the form file
                    formId = HLD_FORM_ID;
                    return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
                } else {
                    throw new Error("crmFormNotFound");
                }
                // formId = HLD_FORM_ID;
                // return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
            })
            .then(async (hldFormData) => {
                if (hldFormData.length > 0) {
                    // Append it to cafFormJson
                    cafFormJson = applyTransform(request, cafFormJson, JSON.parse(hldFormData[0].data_entity_inline), formId);
                } else {
                    throw new Error("hldFormNotFound");
                }

                // callback(false, cafFormJson);
                // return;

                // Deduce all the additional data required for the CAF Form building
                // 
                // Sum all relevant fields and store them
                const calculatedValuesJSON = calculateAllSums(cafFormJson);
                var formParticipantsData,
                    formActivityData;
                // Fetch participants data
                await activityCommonService
                    .getAllParticipantsPromise(request)
                    .then((participantData) => {
                        if (participantData.length > 0) {
                            formParticipantsData = participantData;
                        }
                    })

                // Fetch activityListData
                await activityCommonService
                    .getActivityDetailsPromise(request, request.activity_id)
                    .then((activityListData) => {
                        if (activityListData.length > 0) {
                            formActivityData = activityListData;
                        }
                    })

                // ROMS CAF Fields Data | Process, Update & Append
                let ROMS_CAF_FIELDS_DATA = {};
                if (Number(request.organization_id) === 860) {
                    ROMS_CAF_FIELDS_DATA = romsCafFieldsData.BETA;

                } else if (Number(request.organization_id) === 858) {
                    ROMS_CAF_FIELDS_DATA = romsCafFieldsData.LIVE;
                }

                const romsCafFieldsAndValues = populateRomsCafFieldValues(
                    Object.assign(ROMS_CAF_FIELDS_DATA),
                    calculatedValuesJSON,
                    formParticipantsData,
                    formActivityData
                );

                // console.log("calculatedValuesJSON: ", calculatedValuesJSON);
                // console.log("formParticipantsData: ", formParticipantsData);
                // console.log("ROMS_CAF_FIELDS_DATA: ", ROMS_CAF_FIELDS_DATA);
                // Append fields which need to be calculated, and then appended. I am just
                // appending them for now with default/empty values. T H I S ~ N E E D S ~ W O R K.
                cafFormJson = cafFormJson.concat(romsCafFieldsAndValues);

                // Append the Labels
                cafFormJson = appendLabels(request, cafFormJson);

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
                    asset_id: CAF_BOT_ASSET_ID, // CAF_BOT_ASSET_ID,
                    asset_token_auth: CAF_BOT_ENC_TOKEN, // CAF_BOT_ENC_TOKEN,
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

                // global.config.mobileBaseUrl + global.config.version
                // 'https://api.worlddesk.cloud/r1'
                makeRequest.post(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', cafRequestOptions, function (error, response, body) {
                    console.log("[cafFormSubmissionRequest] Body: ", body);
                    console.log("[cafFormSubmissionRequest] Error: ", error);
                    body = JSON.parse(body);
                    console.log('\x1b[36m body \x1b[0m', body);

                    if (Number(body.status) === 200) {
                        const cafFormActivityId = body.response.activity_id;
                        const cafFormTransactionId = body.response.form_transaction_id;

                        // Add the CAF form submitted as a timeline entry to the form file
                        // cafFormSubmissionRequest.asset_id = request.asset_id;
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
                                // NEEDS WORK | NEEDS WORK | NEEDS WORK | NEEDS WORK | NEEDS WORK | NEEDS WORK | NEEDS WORK

                                // Unmap the form file from HLD queue by archiving the mapping of queue and activity
                                request.start_from = 0;
                                request.limit_value = 50;
                                let hldQueueActivityMappingId;

                                activityCommonService
                                    .fetchQueueByQueueName(request, 'HLD')
                                    .then((queueListData) => {
                                        console.log('data[0].queue_id: ', queueListData[0].queue_id);
                                        return activityCommonService.fetchQueueActivityMappingId(request, queueListData[0].queue_id);
                                    })
                                    .then((queueActivityMappingData) => {
                                        console.log('queueActivityMappingData[0].queue_activity_mapping_id: ', queueActivityMappingData[0].queue_activity_mapping_id);
                                        hldQueueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;
                                        return activityCommonService.unmapFileFromQueue(request, queueActivityMappingData[0].queue_activity_mapping_id)
                                    })
                                    .then((data) => {
                                        activityCommonService.queueHistoryInsert(request, 1403, hldQueueActivityMappingId).then(()=>{});
                                    })
                                    .catch((error) => {
                                        console.log("Error Unmapping the form file from HLD queue: ", error)
                                    });

                                // Alter the status of the form file to Validation Pending
                                // Form the request object
                                var statusAlterRequest = Object.assign(cafFormSubmissionRequest);
                                statusAlterRequest.activity_id = request.activity_id;
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
                                        let omtQueueActivityMappingId;

                                        // Also modify the last status alter time and current status 
                                        // for all the queue activity mappings.
                                        activityCommonService
                                            .fetchQueueByQueueName(request, 'OMT')
                                            .then((queueListData) => {
                                                console.log('data[0].queue_id: ', queueListData[0].queue_id);
                                                return activityCommonService.fetchQueueActivityMappingId(request, queueListData[0].queue_id);
                                            })
                                            .then((queueActivityMappingData) => {
                                                let queueActivityMappingInlineData = JSON.parse(queueActivityMappingData[0].queue_activity_mapping_inline_data);
                                                queueActivityMappingInlineData.queue_sort.current_status = ACTIVITY_STATUS_ID_VALIDATION_PENDING;
                                                queueActivityMappingInlineData.queue_sort.current_status_id = ACTIVITY_STATUS_ID_VALIDATION_PENDING;
                                                queueActivityMappingInlineData.queue_sort.current_status_name = "Validation Pending";
                                                queueActivityMappingInlineData.queue_sort.last_status_alter_time = util.getCurrentUTCTime();
                                                request.activity_status_id = ACTIVITY_STATUS_ID_VALIDATION_PENDING;

                                                omtQueueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;

                                                return activityCommonService.queueActivityMappingUpdateInlineStatus(
                                                    request,
                                                    queueActivityMappingData[0].queue_activity_mapping_id,
                                                    JSON.stringify(queueActivityMappingInlineData)
                                                )
                                            })
                                            .then((data) => {
                                                activityCommonService.queueHistoryInsert(request, 1402, omtQueueActivityMappingId).then(()=>{});
                                            })
                                            .catch((error) => {
                                                console.log("Error modifying the form file activity entry in the OMT queue: ", error)
                                            })

                                        return callback(false, true);
                                    }
                                });
                            }
                        });

                        // Fire 705 for the newly created CAF Form's activity_id
                        let timelineStreamType705ForCAF = Object.assign(cafFormSubmissionRequest);
                        timelineStreamType705ForCAF.activity_id = cafFormActivityId;
                        timelineStreamType705ForCAF.form_transaction_id = cafFormTransactionId;
                        timelineStreamType705ForCAF.activity_stream_type_id = 705;
                        timelineStreamType705ForCAF.message_unique_id = util.getMessageUniqueId(request.asset_id);

                        let fire705OnNewCafFormEvent = {
                            name: "addTimelineTransaction",
                            service: "activityTimelineService",
                            method: "addTimelineTransaction",
                            payload: timelineStreamType705ForCAF
                        };

                        queueWrapper.raiseActivityEvent(fire705OnNewCafFormEvent, cafFormActivityId, (err, resp) => {
                            if (err) {
                                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                            } else {
                                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                            }
                        });

                        // Fire 325 for the newly created CAF Form's activity_id
                        let timelineStreamType325ForCAF = Object.assign(timelineStreamType705ForCAF);
                        timelineStreamType325ForCAF.activity_id = cafFormActivityId;
                        timelineStreamType325ForCAF.form_transaction_id = cafFormTransactionId;
                        timelineStreamType325ForCAF.activity_stream_type_id = 325;
                        timelineStreamType325ForCAF.message_unique_id = util.getMessageUniqueId(CAF_BOT_ASSET_ID);
                        timelineStreamType325ForCAF.activity_timeline_collection = JSON.stringify({
                            "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                            "subject": "CAF Form",
                            "content": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                            "asset_reference": [],
                            "activity_reference": [],
                            "form_approval_field_reference": [],
                            "form_submitted": cafFormSubmissionRequest.activity_inline_data,
                            "attachments": []
                        });

                        let fire325OnNewCafFormEvent = {
                            name: "addTimelineTransaction",
                            service: "activityTimelineService",
                            method: "addTimelineTransaction",
                            payload: timelineStreamType325ForCAF
                        };

                        queueWrapper.raiseActivityEvent(fire325OnNewCafFormEvent, cafFormActivityId, (err, resp) => {
                            if (err) {
                                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                            } else {
                                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                            }
                        });

                        // Fire a 325 request to the new order form too!
                        let activityTimelineCollectionFor325 = {
                            "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                            "subject": "Submitted - CAF Form",
                            "content": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                            "asset_reference": [],
                            "activity_reference": [],
                            "form_approval_field_reference": [],
                            "form_submitted": cafFormSubmissionRequest.activity_inline_data,
                            "attachments": []
                        };
                        cafFormSubmissionRequest.activity_timeline_collection = JSON.stringify(activityTimelineCollectionFor325);
                        cafFormSubmissionRequest.activity_stream_type_id = 325;
                        cafFormSubmissionRequest.activity_id = request.activity_id;

                        let displayCafFormOnFileEvent = {
                            name: "addTimelineTransaction",
                            service: "activityTimelineService",
                            method: "addTimelineTransaction",
                            payload: cafFormSubmissionRequest
                        };

                        queueWrapper.raiseActivityEvent(displayCafFormOnFileEvent, request.activity_id, (err, resp) => {
                            if (err) {
                                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                            } else {
                                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                            }
                        });

                    } else {
                        // If the CAF Form submission wasn't successful
                        console.log("CAF Form submission wasn't successful: ", );
                        return callback(true, false);
                    }

                });
            })
            .catch((error) => {
                console.log("[buildAndSubmitCafForm] Promise Chain Error: ", error)
                callback(true, false);
                return;
            });
    }

    function populateRomsCafFieldValues(ROMS_CAF_FIELDS_DATA, calculatedValuesJSON, formParticipantsData, formActivityData) {
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
                case 5703: // LIVE | Date
                case 5971: // BETA | Date
                    ROMS_CAF_FIELDS_DATA[index].field_value = formActivityData[0].activity_datetime_created;
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

    function applyTransform(request, cafFormData, sourceFormData, formId) {

        const NEW_ORDER_FORM_ID =  global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER,
              SUPPLEMENTARY_ORDER_FORM_ID =  global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY,
              FR_FORM_ID =  global.vodafoneConfig[request.organization_id].FORM_ID.FR,
              CRM_FORM_ID =  global.vodafoneConfig[request.organization_id].FORM_ID.CRM,
              HLD_FORM_ID =  global.vodafoneConfig[request.organization_id].FORM_ID.HLD;

        let NEW_ORDER_TO_CAF_FIELD_ID_MAP, 
            SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP, 
            FR_TO_CAF_FIELD_ID_MAP, 
            CRM_TO_CAF_FIELD_ID_MAP, 
            HLD_TO_CAF_FIELD_ID_MAP;
        
        if (Number(request.organization_id) === 860) {
            // BETA
            NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
            SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
            FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.FR_TO_CAF_FIELD_ID_MAP;
            CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.CRM_TO_CAF_FIELD_ID_MAP;
            HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.HLD_TO_CAF_FIELD_ID_MAP;
            
        } else if (Number(request.organization_id) === 858) {
            // LIVE
            NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
            SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
            FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.FR_TO_CAF_FIELD_ID_MAP;
            CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.CRM_TO_CAF_FIELD_ID_MAP;
            HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.HLD_TO_CAF_FIELD_ID_MAP;
        }
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

    function appendLabels(request, cafFormData) {
        
        let ROMS_CAF_FORM_LABELS = {};
        if (Number(request.organization_id) === 860) {
            // BETA
            ROMS_CAF_FORM_LABELS = formFieldIdMapping.BETA.ROMS_LABELS;

        } else if (Number(request.organization_id) === 858) {
            // LIVE
            ROMS_CAF_FORM_LABELS = formFieldIdMapping.LIVE.ROMS_LABELS;
        }
        
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

    this.setStatusApprovalPendingAndFireEmail = async function (request, callback) {
        
        const NEW_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER,
              ACCOUNT_MANAGER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.ACCOUNT_MANAGER_APPROVAL,
              CUSTOMER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL,
              CAF_BOT_ASSET_ID  = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
              CAF_BOT_ENC_TOKEN  = global.vodafoneConfig[request.organization_id].BOT.ENC_TOKEN,
              ACTIVITY_STATUS_ID_APPROVAL_PENDING = global.vodafoneConfig[request.organization_id].STATUS.APPROVAL_PENDING;

        var formExists = false;
        var jsonString = {},
            encodedString,
            openingMessage,
            callToction,
            baseUrlApprove,
            templateDesign;

        // Check if a NEW ORDER FORM exists for the activity_id/form file
        await activityCommonService
            .getActivityTimelineTransactionByFormId(request, request.activity_id, NEW_ORDER_FORM_ID)
            .then((newOrderFormData) => {
                if (newOrderFormData.length > 0) {
                    // New Order Form exists for this activity_id
                    formExists = true;
                } else {
                    formExists = "Hello World!"
                    throw new Error("newOrderFormNotFound");
                }

            })
            .catch((error) => {
                console.log("[setStatusApprovalPendingAndFireEmail] Error: ", error);
                callback(true, false);
                return;
            })
        
        console.log("formExists: ", formExists);
        // callback(true, false);
        // return;

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
                // Also modify the last status alter time and current status 
                // for all the queue activity mappings.
                let omtQueueActivityMappingId;
                request.start_from = 0;
                request.limit_value = 50;

                activityCommonService
                    .fetchQueueByQueueName(request, 'OMT')
                    .then((queueListData) => {
                        console.log('data[0].queue_id: ', queueListData[0].queue_id);
                        return activityCommonService.fetchQueueActivityMappingId(request, queueListData[0].queue_id);
                    })
                    .then((queueActivityMappingData) => {
                        let queueActivityMappingInlineData = JSON.parse(queueActivityMappingData[0].queue_activity_mapping_inline_data);
                        queueActivityMappingInlineData.queue_sort.current_status = ACTIVITY_STATUS_ID_APPROVAL_PENDING;
                        queueActivityMappingInlineData.queue_sort.current_status_id = ACTIVITY_STATUS_ID_APPROVAL_PENDING;
                        queueActivityMappingInlineData.queue_sort.current_status_name = "Approval Pending";
                        queueActivityMappingInlineData.queue_sort.last_status_alter_time = util.getCurrentUTCTime();
                        request.activity_status_id = ACTIVITY_STATUS_ID_APPROVAL_PENDING;

                        omtQueueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;

                        return activityCommonService.queueActivityMappingUpdateInlineStatus(
                            request,
                            queueActivityMappingData[0].queue_activity_mapping_id,
                            JSON.stringify(queueActivityMappingInlineData)
                        )
                    })
                    .then((data) => {
                        activityCommonService.queueHistoryInsert(request, 1402, omtQueueActivityMappingId).then(()=>{});
                    })
                    .catch((error) => {
                        console.log("Error modifying the form file activity entry in the OMT queue: ", error)
                    })
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
                                        if (participant.operating_asset_email_id !== '' && participant.operating_asset_email_id !== null) {
                                            console.log("participant.operating_asset_email_id: ", participant.operating_asset_email_id);
                                            jsonString = {
                                                organization_id: request.organization_id,
                                                account_id: request.account_id,
                                                workforce_id: request.workforce_id,
                                                asset_id: Number(participant.asset_id),
                                                auth_asset_id: CAF_BOT_ASSET_ID,
                                                asset_token_auth: CAF_BOT_ENC_TOKEN,
                                                activity_id: Number(request.activity_id),
                                                activity_type_category_id: 9,
                                                activity_stream_type_id: 705,
                                                form_id: ACCOUNT_MANAGER_APPROVAL_FORM_ID,
                                                // activity_type_id: activityTypeId,
                                                type: 'approval'
                                            };
                                            encodedString = Buffer.from(JSON.stringify(jsonString)).toString('base64');
                                            openingMessage = "Please verify the customer application form and approve by providing a digital signature.";
                                            baseUrlApprove = global.config.emailbaseUrlApprove + "/#/forms/entry/" + encodedString;
                                            callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlApprove + "'>APPROVE</a>"
                                            nameStr = `${participant.operating_asset_first_name} ${participant.operating_asset_last_name}`;
                                            allFields = '';
                                            templateDesign = "<table style='border-collapse: collapse !important;' width='100%' bgcolor='#ffffff' border='0' cellpadding='10' cellspacing='0'><tbody><tr> <td> <table bgcolor='#ffffff' style='width: 100%;max-width: 600px;' class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tbody><tr><td align='center' valign='top'><table style='border: 1px solid #e2e2e2; border-radius: 4px; background-clip: padding-box; border-spacing: 0;' border='0' cellpadding='0' cellspacing='0' width='100%' id='templateContainer'><tbody> <tr> <td align='left' style='float: right;padding: 20px;' valign='top'> <img style='width: 100px' src ='https://office.desker.co/Vodafone_logo.png'/> <img style='height: 44px;margin-left: 10px;' src ='https://office.desker.co/Idea_logo.png'/> </td> </tr> <tr><td valign='top' style=' color: #505050; font-family: Helvetica; font-size: 14px; line-height: 150%; padding-top: 3.143em; padding-right: 3.5em; padding-left: 3.5em; padding-bottom: 3.143em; text-align: left;' class='bodyContent' mc:edit='body_content'> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>Hey " + nameStr + ",</p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>" + openingMessage + "</p> <p style=' color: #808080; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: bold; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 10px; margin-left: 0; text-align: left;'>Account Manager Approval Form</p> " + allFields + "<table style='width: 100%;margin-top: 5px'></table> " + callToction + " <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 40px; margin-right: 0; margin-bottom: 0px; margin-left: 0; text-align: left;'> Parmeshwar Reddy </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Vice President </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Customer Care </p></td></tr> <tr> <td style='height: 35px;background: #cbcbcb;'></td> </tr></tbody></table><!-- // END BODY --></td></tr> </tbody></table> </td> </tr></tbody></table>";

                                            // Fire the email
                                            util.sendEmailV3({
                                                    email_receiver_name: `${participant.asset_first_name} ${participant.asset_last_name}`,
                                                    email_sender_name: 'Vodafone - Idea',
                                                    email_sender: 'vodafone_idea@grenerobotics.com'
                                                },
                                                participant.operating_asset_email_id,
                                                'Submit The Account Manager Approval Form',
                                                'Text Content Will Be Ignored',
                                                templateDesign,
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
                                    if (participant.operating_asset_email_id !== '' && participant.operating_asset_email_id !== null) {
                                        jsonString = {
                                            organization_id: request.organization_id,
                                            account_id: request.account_id,
                                            workforce_id: request.workforce_id,
                                            asset_id: Number(participant.asset_id),
                                            auth_asset_id: CAF_BOT_ASSET_ID,
                                            asset_token_auth: CAF_BOT_ENC_TOKEN,
                                            activity_id: Number(request.activity_id),
                                            form_id: CUSTOMER_APPROVAL_FORM_ID,
                                            activity_type_category_id: 9,
                                            activity_stream_type_id: 705,
                                            // activity_type_id: activityTypeId,
                                            type: 'approval'
                                        };
                                        encodedString = Buffer.from(JSON.stringify(jsonString)).toString('base64');
                                        openingMessage = "Please verify the customer application form and approve by providing a digital signature.";
                                        baseUrlApprove = global.config.emailbaseUrlApprove + "/#/forms/entry/" + encodedString;
                                        callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlApprove + "'>APPROVE</a>"
                                        nameStr = `${participant.operating_asset_first_name} ${participant.operating_asset_last_name}`;
                                        allFields = '';
                                        templateDesign = "<table style='border-collapse: collapse !important;' width='100%' bgcolor='#ffffff' border='0' cellpadding='10' cellspacing='0'><tbody><tr> <td> <table bgcolor='#ffffff' style='width: 100%;max-width: 600px;' class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tbody><tr><td align='center' valign='top'><table style='border: 1px solid #e2e2e2; border-radius: 4px; background-clip: padding-box; border-spacing: 0;' border='0' cellpadding='0' cellspacing='0' width='100%' id='templateContainer'><tbody> <tr> <td align='left' style='float: right;padding: 20px;' valign='top'> <img style='width: 100px' src ='https://office.desker.co/Vodafone_logo.png'/> <img style='height: 44px;margin-left: 10px;' src ='https://office.desker.co/Idea_logo.png'/> </td> </tr> <tr><td valign='top' style=' color: #505050; font-family: Helvetica; font-size: 14px; line-height: 150%; padding-top: 3.143em; padding-right: 3.5em; padding-left: 3.5em; padding-bottom: 3.143em; text-align: left;' class='bodyContent' mc:edit='body_content'> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>Hey " + nameStr + ",</p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>" + openingMessage + "</p> <p style=' color: #808080; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: bold; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 10px; margin-left: 0; text-align: left;'>Customer Approval Form</p> " + allFields + "<table style='width: 100%;margin-top: 5px'></table> " + callToction + " <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 40px; margin-right: 0; margin-bottom: 0px; margin-left: 0; text-align: left;'> Parmeshwar Reddy </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Vice President </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Customer Care </p></td></tr> <tr> <td style='height: 35px;background: #cbcbcb;'></td> </tr></tbody></table><!-- // END BODY --></td></tr> </tbody></table> </td> </tr></tbody></table>";

                                        // Fire the email
                                        util.sendEmailV3({
                                                email_receiver_name: `${participant.asset_first_name} ${participant.asset_last_name}`,
                                                email_sender_name: 'Vodafone - Idea',
                                                email_sender: 'vodafone_idea@grenerobotics.com'
                                            },
                                            participant.operating_asset_email_id,
                                            'Submit The Customer Approval Form',
                                            'Text Content Will Be Ignored',
                                            templateDesign,
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
        var isApprovalDone = false,
            queueActivityMappingId;
        
        const CUSTOMER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL;
        const ACCOUNT_MANAGER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.ACCOUNT_MANAGER_APPROVAL;
        const CRM_ACKNOWLEDGEMENT_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM_ACKNOWLEDGEMENT;
        const NEW_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER;
        const ACTIVITY_STATUS_ID_ORDER_CLOSED = global.vodafoneConfig[request.organization_id].STATUS.ORDER_CLOSED;
        // 
        // If the incoming form submission request is for the AM APPROVAL FORM
        // if (Number(request.form_id) === 858 || Number(request.form_id) === 875) {
        //     await activityCommonService
        //         .getActivityTimelineTransactionByFormId(request, request.activity_id, CUSTOMER_APPROVAL_FORM_ID)
        //         .then((customerApprovalFormData) => {
        //             console.log("customerApprovalFormData: ", customerApprovalFormData);
        //             console.log("customerApprovalFormData.length: ", customerApprovalFormData.length);
        //             if (customerApprovalFormData.length > 0) {
        //                 // 
        //                 isApprovalDone = true
        //             }
        //         })
        //     // If the incoming form submission request is for the CUSTOMER APPROVAL FORM
        // } else if (Number(request.form_id) === 878 || Number(request.form_id) === 882) {
        //     await activityCommonService
        //         .getActivityTimelineTransactionByFormId(request, request.activity_id, ACCOUNT_MANAGER_APPROVAL_FORM_ID)
        //         .then((accountManagerApprovalFormData) => {
        //             console.log("accountManagerApprovalFormData: ", accountManagerApprovalFormData);
        //             console.log("accountManagerApprovalFormData.length: ", accountManagerApprovalFormData.length);
        //             if (accountManagerApprovalFormData.length > 0) {
        //                 // 
        //                 isApprovalDone = true
        //             }
        //         })
        // }

        // If the incoming form submission request is for the CRM ACKNOWLEDGEMENT FORM,
        // check if a corresponding NEW ORDER FORM exists
        console.log("Number(request.form_id): ", Number(request.form_id));
        console.log("Number(CRM_ACKNOWLEDGEMENT_FORM_ID): ", Number(CRM_ACKNOWLEDGEMENT_FORM_ID));
        if (Number(request.form_id) === Number(CRM_ACKNOWLEDGEMENT_FORM_ID)) {
            
            await activityCommonService
                .getActivityTimelineTransactionByFormId(request, request.activity_id, NEW_ORDER_FORM_ID)
                .then((customerApprovalFormData) => {
                    console.log("customerApprovalFormData: ", customerApprovalFormData);
                    console.log("customerApprovalFormData.length: ", customerApprovalFormData.length);
                    if (customerApprovalFormData.length > 0) {
                        // 
                        isApprovalDone = true
                    }
                })
        }

        console.log("isApprovalDone: ", isApprovalDone);

        if (isApprovalDone === true) {
            request.start_from = 0;
            request.limit_value = 50;
            // Map the form file to the Order Validation queue
            activityCommonService
                .fetchQueueByQueueName(request, 'OMT')
                .then((queueListData) => {
                    console.log('data[0].queue_id: ', queueListData[0].queue_id);
                    return activityCommonService.fetchQueueActivityMappingId(request, queueListData[0].queue_id);
                })
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
            var statusAlterRequest = Object.assign(request);
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
    
    function getSpecifiedForm(request, formId) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array();
            var queryString = '';

            paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                formId,
                '1970-01-01 00:00:00',
                0,
                50
            );
            queryString = util.getQueryString('ds_v1_workforce_form_field_mapping_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        if (data.length > 0) {
                            //console.log(data);
                            formatFormsListing(data, function (err, finalData) {
                                if (err === false) {
                                    resolve(finalData);
                                }
                            });
                        } else {
                            resolve();
                        }                        
                    } else {                        
                        reject(err);                        
                    }
                });
            }
    
        });
    }
    
    var formatFormsListing = function (data, callback) {
        var responseData = new Array();
        data.forEach(function (rowData, index) {

            var rowDataArr = {
                "form_id": util.replaceDefaultNumber(rowData['form_id']),
                "form_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['form_name'])),
                "field_id": util.replaceDefaultNumber(rowData['field_id']),
                "field_description": util.replaceDefaultString(util.decodeSpecialChars(rowData['field_description'])),
                "field_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['field_name'])),
                "data_type_id": util.replaceDefaultNumber(rowData['data_type_id']),
                "data_type_category_id": util.replaceDefaultNumber(rowData['data_type_category_id']),
                "data_type_category_name": util.replaceDefaultString(rowData['data_type_category_name'])
            };
            responseData.push(rowDataArr);
        }, this);
        callback(false, responseData);
    };
    
};


module.exports = VodafoneService;
