/*
 * author: Nani Kalyan V and Ben Sooraj
 * Upate: PreProd Test 1
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
    //const uuid = require('uuid');
    const moment = require('moment');
    const formFieldIdMapping = util.getVodafoneFormFieldIdMapping();
    const romsCafFieldsData = util.getVodafoneRomsCafFieldsData();
    const nodeUtil = require('util');
    const self = this;

    // Form Config Service
    // const FormConfigService = require("../../services/formConfigService");
    // const formConfigService = new FormConfigService(objectCollection);
    // console.log(`global.vodafoneConfig["134564"].FORM_FIELD_MAPPING_DATA: `, global.vodafoneConfig["134564"].FORM_FIELD_MAPPING_DATA)

    // const ActivityTimelineService = require('../../services/activityTimelineService');
    // const activityTimelineService = new ActivityTimelineService(objectCollection);

    this.newOrderFormAddToQueues = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        request.form_status_id = global.vodafoneConfig[request.organization_id].STATUS.HLD_PENDING;
        request.form_activity_id = request.activity_id;

        //Step 2 :- Set the status of the form file to "HLD Pending"
        changeStatusToHLDPending(request).then(() => {});

        activityCommonService.getActivityDetails(request, request.activity_id, (err, data) => {
            if (err === false) {

                //Step 1 :- Fill the order Supplementary form, add a dedicated file for it
                request.activity_type_id = data[0].activity_type_id;
                addOrderSuppForm(request).then(() => {});

                //let fileCreationDateTime = util.replaceDefaultDatetime(data[0].activity_datetime_start_expected);
                let fileCreationDateTime = util.replaceDefaultDatetime(data[0].activity_datetime_created);

                //Adding to OMT Queue                
                request.start_from = 0;
                request.limit_value = 1;
                request.asset_id = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;

                //Update the JSON
                let queueMappingJson = {};
                let queueSort = {};
                queueSort.file_creation_time = fileCreationDateTime;
                queueSort.queue_mapping_time = request.datetime_log;
                queueSort.last_status_alter_time = request.datetime_log;
                queueSort.current_status_id = request.form_status_id;
                queueSort.caf_completion_percentage = 23;
                // queueSort.current_status_name = "HLD Pending";
                queueSort.current_status_name = "CAF Updation";
                queueMappingJson.queue_sort = queueSort;

                console.log('queueMappingJson : ', JSON.parse(JSON.stringify(queueMappingJson)));

                //Get the Queue ID
                activityCommonService.fetchQueueByQueueName(request, "OMT").then((resp) => {
                    console.log('Queue Data : ', resp);

                    //Checking the queuemappingid
                    activityCommonService.fetchQueueActivityMappingId(request, resp[0].queue_id).then((queueActivityMappingData) => {
                            console.log('queueActivityMappingData : ', queueActivityMappingData);

                            request.activity_status_id = request.form_status_id;

                            if (queueActivityMappingData.length > 0) {
                                //Check the status
                                //If status is same then do nothing
                                let queueInlineData = JSON.parse(queueActivityMappingData[0].queue_inline_data);
                                if (Number(queueInlineData.activity_status_id) !== Number(request.form_status_id)) {
                                    //If different unmap the activitymapping and insert the new status id                            
                                    queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;

                                    activityCommonService.queueActivityMappingUpdateInlineStatus(request, queueActivityMappingId, JSON.stringify(queueMappingJson)).then((data) => {
                                        console.log('Updating the Queue Json : ', data);
                                        activityCommonService.queueHistoryInsert(request, 1402, queueActivityMappingId).then(() => {});
                                    }).catch((err) => {
                                        global.logger.write('debug', err, {}, request);
                                    });
                                }
                            } else {
                                activityCommonService.mapFileToQueue(request, resp[0].queue_id, JSON.stringify(queueMappingJson)).then((data) => {
                                    console.log("Form assigned to OMT queue: ", data);
                                    activityCommonService.queueHistoryInsert(request, 1401, data[0].queue_activity_mapping_id).then(() => {});
                                }).catch((error) => {
                                    console.log("Error assigning form to the queue: ", error)
                                });
                            }

                        }).then((data) => {
                            console.log("Form unassigned from queue: ", data);
                        })
                        .catch((error) => {
                            console.log("Error unassigning form from queue: ", error);
                        });

                }).catch((err) => {
                    global.logger.write('debug', err, {}, request);
                });

                /////////////////////////////////////////////////////////////////////////////////////////////////////                
                //Adding to HLD Queue
                //Get the Queue ID
                activityCommonService.fetchQueueByQueueName(request, "HLD").then((resp) => {
                    console.log('Queue Data : ', resp);

                    //Checking the queuemappingid
                    activityCommonService.fetchQueueActivityMappingId(request, resp[0].queue_id).then((queueActivityMappingData) => {
                            console.log('queueActivityMappingData : ', queueActivityMappingData);

                            if (queueActivityMappingData.length > 0) {
                                //Check the status
                                //If status is same then do nothing
                                let queueInlineData = JSON.parse(queueActivityMappingData[0].queue_inline_data);
                                if (Number(queueInlineData.activity_status_id) !== Number(request.form_status_id)) {
                                    //If different unmap the activitymapping and insert the new status id                            
                                    let queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;

                                    activityCommonService.queueActivityMappingUpdateInlineStatus(request, queueActivityMappingId, JSON.stringify(queueMappingJson)).then((data) => {
                                        console.log('Updating the Queue Json : ', data);
                                        activityCommonService.queueHistoryInsert(request, 1402, queueActivityMappingId).then(() => {});
                                    }).catch((err) => {
                                        global.logger.write('debug', err, {}, request);
                                    });
                                }
                            } else {
                                activityCommonService.mapFileToQueue(request, resp[0].queue_id, JSON.stringify(queueMappingJson)).then((data) => {
                                    console.log("Form assigned to OMT queue: ", data);
                                    activityCommonService.queueHistoryInsert(request, 1401, data[0].queue_activity_mapping_id).then(() => {});
                                }).catch((error) => {
                                    console.log("Error assigning form to the queue: ", error)
                                });
                            }

                        }).then((data) => {
                            console.log("Form unassigned from queue: ", data);
                        })
                        .catch((error) => {
                            console.log("Error unassigning form from queue: ", error);
                        });

                }).catch((err) => {
                    global.logger.write('debug', err, {}, request);
                });


            } else {
                callback(true, {}, -9998);
            }
        });

        callback(false, {}, 200);
    };

    function addOrderSuppForm(request) {
        return new Promise((resolve, reject) => {

            //Get the orderSuppForm and add it to the activityinlinedata
            getSpecifiedForm(request, global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY).then((data) => {

                console.log("\x1b[35m Retrived Data Type . \x1b[0m", typeof data);
                console.log("\x1b[35m Got the empty Order supplementary form data . \x1b[0m");

                forEachAsync(data, (next, row) => {
                    row.field_value = "";
                    next();
                }).then(() => {

                    let newRequest = {
                        organization_id: request.organization_id,
                        account_id: global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                        workforce_id: global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                        asset_id: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
                        asset_token_auth: global.vodafoneConfig[request.organization_id].BOT.ENC_TOKEN,
                        asset_message_counter: 0,
                        activity_title: "Adding the Order Supplementary Form",
                        activity_description: "Adding the Order Supplementary Form",
                        activity_inline_data: JSON.stringify(data),
                        activity_datetime_start: util.getCurrentUTCTime(),
                        activity_datetime_end: util.getCurrentUTCTime(),
                        activity_type_category_id: 9,
                        activity_form_id: global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY,
                        form_id: global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY,
                        activity_sub_type_id: 0,
                        //activity_type_id: global.vodafoneConfig[request.organization_id].ACTIVITY_TYPE_IDS.FORM_ACTIVITY_TYPE_ID,
                        activity_type_id: request.activity_type_id,
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
                        device_os_id: 7
                    };

                    cacheWrapper.getFormTransactionId(function (err, formTransactionId) {
                        if (err) {
                            // console.log(err);
                            global.logger.write('serverError', err, err, newRequest);
                            global.logger.write('debug', err, err, newRequest);
                            reject(err);
                        } else {
                            newRequest['form_transaction_id'] = formTransactionId;

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

                                    //Adding new activity - Order Supplementary Form
                                    queueWrapper.raiseActivityEvent(event, newRequest.activity_id, (err, resp) => { //newRequest.activity_id Ord Suppl Form Act Id
                                        if (err) {
                                            console.log("\x1b[35m [ERROR] Raising queue activity raised for creating empty Order Supplementary Form. \x1b[0m", err);
                                        } else {
                                            console.log("\x1b[35m Queue activity raised for creating empty Order Supplementary Form. \x1b[0m");

                                            /*// 325 for Order Supplementary Form - Modified to 705
                                            /////////////////////////////////////////////////////
                                            let ordSupplactivityTimelineCollectionFor325 = {
                                                "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                                                "subject": "Submitted - Order Supplementary Form",
                                                "content": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                                                "asset_reference": [],
                                                "activity_reference": [],
                                                "form_approval_field_reference": [],                                    
                                                "form_submitted": data,
                                                "attachments": []
                                             };

                                            newRequest.activity_timeline_collection = JSON.stringify(ordSupplactivityTimelineCollectionFor325);                                
                                            newRequest.activity_stream_type_id = 705;
                                

                                            let displayOrdSupFormOnFileEvent = {
                                                name: "addTimelineTransaction",
                                                service: "activityTimelineService",
                                                method: "addTimelineTransaction",
                                                payload: newRequest
                                            };

                                            queueWrapper.raiseActivityEvent(displayOrdSupFormOnFileEvent, newRequest.activity_id, (err, resp) => { //newRequest.activity_id Ord Suppl Form Act Id
                                                if (err) {
                                                    console.log("\x1b[35m [ERROR] Raising queue activity raised for 705 streamtypeid for Order Supplementary file. \x1b[0m", err);
                                                } else {
                                                    console.log("\x1b[35m Raising queue activity raised for 705 streamtypeid for Order Supplementary file. \x1b[0m");
                                                }
                                            });*/
                                            ///////////////////////////////////////////////////////////

                                            // 325 for New Order Form regarding the order suppl form - Modified to 705
                                            ///////////////////////////////////////////////////////////////////////////
                                            let newRequest1 = Object.assign({}, newRequest);

                                            // Fire a 325 request to the new order form too! - Modified to 705
                                            let activityTimelineCollectionFor325 = {
                                                "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                                                "subject": "Order Supplementary Form",
                                                "content": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                                                "asset_reference": [],
                                                "activity_reference": [],
                                                "form_approval_field_reference": [],
                                                "form_submitted": data,
                                                "attachments": []
                                            };

                                            newRequest1.activity_timeline_collection = JSON.stringify(activityTimelineCollectionFor325);
                                            newRequest1.activity_stream_type_id = 705;
                                            newRequest1.flag_timeline_entry = 1;
                                            newRequest1.activity_id = request.form_activity_id;

                                            let displayOrdSupFormOnFileEventOne = {
                                                name: "addTimelineTransaction",
                                                service: "activityTimelineService",
                                                method: "addTimelineTransaction",
                                                payload: newRequest1
                                            };

                                            queueWrapper.raiseActivityEvent(displayOrdSupFormOnFileEventOne, request.form_activity_id, (err, resp) => {
                                                if (err) {
                                                    console.log("\x1b[35m [ERROR] Raising queue activity raised for 705 streamtypeid for Order Activity. \x1b[0m");
                                                } else {
                                                    console.log("\x1b[35m Queue activity raised for 705 streamtypeid for Order Activity. \x1b[0m");
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            });
        });
    }

    this.newOrderFormSubmission = function (request, callback) {

        if (Number(request.form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.FR) ||
            Number(global.vodafoneConfig[request.organization_id].FORM_ID.CRM)) {

            //check whether FR form is submitted 
            activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, global.vodafoneConfig[request.organization_id].FORM_ID.FR)
                .then((frFormData) => {
                    console.log("FRFormData: ", frFormData);
                    console.log("customerApprovalFormData.length: ", frFormData.length);

                    if (frFormData.length > 0) {

                        //check whether CRM form is submitted
                        activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, global.vodafoneConfig[request.organization_id].FORM_ID.CRM)
                            .then((crmFormData) => {
                                console.log("CRMFormData: ", crmFormData);
                                console.log("CRMFormData.length: ", crmFormData.length);

                                if (crmFormData.length > 0) {

                                    let formDataCollection = JSON.parse(crmFormData[0].data_entity_inline);
                                    //request.crm_form_data = JSON.parse(crmFormData[0].data_entity_inline);                                    

                                    if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
                                        request.crm_form_data = formDataCollection.form_submitted;
                                    } else {
                                        request.crm_form_data = JSON.parse(formDataCollection.form_submitted);
                                    }

                                    activityCommonService.getActivityDetails(request, request.activity_id, (err, data) => {
                                        if (err === false) {
                                            console.log('data[0].activity_inline_data : ', data[0].activity_inline_data);
                                            const newOrderFormData = JSON.parse(data[0].activity_inline_data);

                                            newOrderFormData.forEach(formEntry => {
                                                switch (Number(formEntry.field_id)) {
                                                    case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Account_Code:
                                                        request.account_code = formEntry.field_value;
                                                        break;
                                                }
                                            });

                                            console.log('Account Code from New Order : ', request.account_code);

                                            let customerData = {};

                                            //construct the request object and call the function
                                            const formData = request.crm_form_data;

                                            formData.forEach(formEntry => {
                                                switch (Number(formEntry.field_id)) {

                                                    case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Company_Name:
                                                        customerData.first_name = formEntry.field_value;
                                                        customerData.contact_company = formEntry.field_value;
                                                        break;
                                                    case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Number:
                                                        if (String(formEntry.field_value).includes('||')) {
                                                            customerData.contact_phone_country_code = String(formEntry.field_value).split('||')[0];
                                                            customerData.contact_phone_number = String(formEntry.field_value).split('||')[1];
                                                        } else {
                                                            customerData.contact_phone_country_code = 91;
                                                            customerData.contact_phone_number = formEntry.field_value;
                                                        }
                                                        break;
                                                    case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Email:
                                                        customerData.contact_email_id = formEntry.field_value;
                                                        break;
                                                    case global.vodafoneConfig[request.organization_id].CRM_FIELDVALUES.Contact_Designation:
                                                        customerData.contact_designation = formEntry.field_value;
                                                        break;
                                                }
                                            });

                                            console.log('customerData after processing : ', customerData);

                                            if (Object.keys(customerData).length > 0) {
                                                customerFormSubmission(request, customerData).then(() => {

                                                }).catch((err) => {
                                                    global.logger.write('debug', err, {}, request);
                                                });
                                            } else {
                                                console.log("\x1b[35m As Customer Data is empty we are not proceeding to further steps. \x1b[0m");
                                            }

                                        } else {

                                        }
                                    });
                                }
                            });
                    }
                });

        }

        callback(false, {}, 200);
    };


    //Manual
    function customerFormSubmission(request, customerData) {
        return new Promise((resolve, reject) => {
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
            checkServiceDeskExistence(request).then((dataResp) => {
                if (dataResp.length > 0) { //status is true means service desk exists

                    let sdResp = dataResp[0];
                    let deskAssetId = sdResp.asset_id;

                    console.log('deskAssetId : ', deskAssetId);

                    if (Number(sdResp.operating_asset_phone_number) !== Number(customerData.contact_phone_number)) {

                        console.log('operating asset phone number is different from authorised_signatory_contact_number');

                        //Unmap the operating Asset from service desk
                        activityCommonService.assetListUpdateOperatingAsset(request, deskAssetId, 0, (err, data) => {});

                        var newRequest = Object.assign({}, request);
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
                        createAsset(newRequest).then((operatingAssetId) => {

                            //Create a contact file
                            //createContactFile(newRequest, operatingAssetId).then((contactfileActId)=>{

                            //Map the operating Asset to the contact file
                            //addCustomerAsParticipantToContFile(newRequest, contactfileActId, customerData, operatingAssetId).then(()=>{});

                            //Map the newly created operating asset with service desk asset
                            activityCommonService.assetListUpdateOperatingAsset(request, deskAssetId, operatingAssetId, (err, data) => {});

                            //Add Service Desk as Participant to form file
                            addDeskAsParticipant(request, customerData, deskAssetId).then(() => {

                                var customerCollection = {};
                                customerCollection.firstName = customerData.first_name;
                                customerCollection.contactPhoneCountryCode = customerData.contact_phone_country_code;
                                customerCollection.contactPhoneNumber = customerData.contact_phone_number;
                                customerCollection.contactEmailId = customerData.contact_email_id;
                                customerCollection.customerServiceDeskAssetID = deskAssetId;
                                customerCollection.activity_form_id = global.vodafoneConfig[request.organization_id].FORM_ID.EXISTING_CUSTOMER;

                                /*activityCommonService.getActivityDetails(request, request.form_order_activity_id, (err, data)=>{
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
                                        });
                                        
                                    } else {
                                        global.logger.write('debug', err, {}, request);
                                    }
                                });*/

                            }).catch((err) => {
                                global.logger.write('debug', err, {}, request);
                            });
                            /*}).catch((err)=>{
                                global.logger.write('debug', err, {}, request);
                            });*/

                        }).catch((err) => {
                            global.logger.write('debug', err, {}, request);
                        });

                    } else { //When authorized_signatory_phone_number is equal to the retrieved operating asset
                        console.log('operating asset phone number is same as authorised_signatory_contact_number');
                        //Add Service Desk as Participant to form file
                        addDeskAsParticipant(request, customerData, deskAssetId).then(() => {

                            var customerCollection = {};
                            customerCollection.firstName = customerData.first_name;
                            customerCollection.contactPhoneCountryCode = customerData.contact_phone_country_code;
                            customerCollection.contactPhoneNumber = customerData.contact_phone_number;
                            customerCollection.contactEmailId = customerData.contact_email_id;
                            customerCollection.customerServiceDeskAssetID = deskAssetId;
                            customerCollection.activity_form_id = global.vodafoneConfig[request.organization_id].FORM_ID.EXISTING_CUSTOMER;

                            /*activityCommonService.getActivityDetails(request, request.activity_id, (err, data)=>{
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
                                    });
                                    
                                } else {
                                    global.logger.write('debug', err, {}, request);
                                }
                            });*/

                        }).catch((err) => {
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
                    createAssetContactDesk(request, customerData).then((resp) => {

                        let assetId = resp.response.asset_id;
                        let deskAssetId = resp.response.desk_asset_id;
                        let contactfileActId = resp.response.activity_id;

                        //Map the operating Asset to the contact file
                        addCustomerAsParticipantToContFile(newRequest, contactfileActId, customerData, assetId).then(() => {});

                        //Add Service Desk as Participant to form file
                        addDeskAsParticipant(request, customerData, deskAssetId).then(() => {

                            let customerCollection = {};
                            customerCollection.firstName = customerData.first_name;
                            customerCollection.contactPhoneCountryCode = customerData.contact_phone_country_code;
                            customerCollection.contactPhoneNumber = customerData.contact_phone_number;
                            customerCollection.contactEmailId = customerData.contact_email_id;
                            customerCollection.customerServiceDeskAssetID = deskAssetId;
                            customerCollection.activity_form_id = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_CUSTOMER;

                            /*activityCommonService.getActivityDetails(request, request.activity_id, (err, data)=>{
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
                                    });
                                            
                                } else {
                                    global.logger.write('debug', err, {}, request);
                                }
                            });*/

                        }).catch((err) => {
                            global.logger.write('debug', err, {}, request);
                        });


                    }).catch((err) => {
                        global.logger.write('debug', err, {}, request);
                    });

                }
            }).catch((err) => {
                global.logger.write('debug', err, {}, request);
            });
        });

    }


    function changeStatusToHLDPending(request) {
        return new Promise((resolve, reject) => {

            var newRequest = Object.assign({}, request);
            newRequest.asset_id = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;
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

    function createAssetContactDesk(request, customerData) {
        return new Promise((resolve, reject) => {

            let customerServiceDeskRequest = {
                organization_id: request.organization_id,
                account_id: global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                workforce_id: global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                asset_id: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
                asset_token_auth: global.vodafoneConfig[request.organization_id].BOT.ENC_TOKEN,
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
                    reject('Status is ' + Number(body.status) + ' while creating Service Desk');
                }
            });
        });
    }

    function addDeskAsParticipant(request, customerData, deskAssetId) {
        return new Promise((resolve, reject) => {

            let addParticipantRequest = {
                organization_id: request.organization_id,
                account_id: global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                workforce_id: global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                asset_id: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
                asset_token_auth: global.vodafoneConfig[request.organization_id].BOT.ENC_TOKEN,
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
                    global.logger.write('conLog', "\x1b[35m [ERROR] Raising queue activity raised for adding Service Desk as a participant. \x1b[0m", {}, request);
                    reject('Error while raising queue activity for adding service desk as a participant');
                } else {
                    global.logger.write('conLog', "\x1b[35m Queue activity raised for adding Service Desk as a participant. \x1b[0m", {}, request);
                    resolve();
                }
            });

        });
    }

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
        return new Promise((resolve, reject) => {

            let addParticipantRequest = {
                organization_id: request.organization_id,
                account_id: global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                workforce_id: global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                asset_id: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
                asset_token_auth: global.vodafoneConfig[request.organization_id].BOT.ENC_TOKEN,
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
                    global.logger.write('debug', "\x1b[35m [ERROR] Raising queue activity raised for mapping customer operating asset to Contact file. \x1b[0m", {}, request);
                    reject('Error while raising queue activity for mapping customer operating asset to Contact file.');
                } else {
                    global.logger.write('debug', "\x1b[35m Queue activity raised for mapping customer operating asset to Contact file. \x1b[0m", {}, request);
                    resolve();
                }
            });

        });
    }


    this.sendEmailVodafone = function (request, callback) {

        let firstName = request.first_name;
        let contactPhoneCountryCode = request.contact_phone_country_code;
        let contactPhoneNumber = request.contact_phone_number;
        let contactEmailId = request.contact_email_id;
        let deskAssetId = Number(request.desk_asset_id) || 0;


        vodafoneSendEmail(request, {
            firstName,
            contactPhoneCountryCode,
            contactPhoneNumber,
            contactEmailId,
            customerServiceDeskAssetID: deskAssetId
        }).then(() => {
            callback(false, {}, 200);
        }).catch((err) => {
            console.log('err : ', err);
            global.logger.write('debug', err, {}, request);
            callback(true, {}, -9998);
        });
        /*fetchReferredFormActivityId(request, request.activity_id, request.form_transaction_id, request.form_id).then((data)=>{               
               global.logger.write('debug', data,{}, request);
                                    
               if (data.length > 0) {
                    request.new_order_activity_id = Number(data[0].activity_id);
               }
               
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
        });*/

    };

    function vodafoneSendEmail(request, customerCollection) {
        return new Promise((resolve, reject) => {
            console.log("\x1b[35m [Log] Inside vodafoneSendEmail \x1b[0m");
            let date = util.getFormatedSlashDate();

            let fieldHTML = '',
                nameStr = unescape(customerCollection.firstName),
                emailSubject = 'Vodafone Idea Fixed Line Order Application Status',
                callToction,
                openingMessage = 'Please verify the below form details.';

            const jsonString = {
                organization_id: request.organization_id,
                account_id: request.account_id,
                workforce_id: request.workforce_id,
                asset_id: Number(customerCollection.customerServiceDeskAssetID),
                asset_token_auth: global.vodafoneConfig[request.organization_id].BOT.ENC_TOKEN,
                auth_asset_id: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
                activity_id: request.activity_id || 0,
                activity_type_category_id: 9,
                activity_type_id: global.vodafoneConfig[request.organization_id].ACTIVITY_TYPE_IDS[request.workforce_id],
                activity_stream_type_id: 705,
                form_id: Number(customerCollection.activity_form_id),
                type: 'approval'
            };

            if (String(customerCollection.contactEmailId).includes('%40')) {
                customerCollection.contactEmailId = String(customerCollection.contactEmailId).replace(/%40/g, "@");
            }

            const encodedString = Buffer.from(JSON.stringify(jsonString)).toString('base64');

            const baseUrlApprove = global.config.emailbaseUrlApprove + "/#/forms/entry/" + encodedString;
            const baseUrlUpload = global.config.emailbaseUrlUpload + "/#/forms/entry/" + encodedString;
            const baseUrlOrderStatus = global.config.emailbaseUrlApprove + "/#/orderstatus/" + encodedString;

            switch (Number(customerCollection.activity_form_id)) {
                case 856: //emailSubject = 'Upload Documents for Order';
                    openingMessage = "Please verify the order details and upload the required documentation.";
                    callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"
                    break;
                case 844: //emailSubject = "Approve Order Data";
                    openingMessage = "Please verify the customer application form and approve by providing a digital signature.";
                    callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlApprove + "'>APPROVE</a>"
                    break;
                case global.vodafoneConfig[request.organization_id].FORM_ID.HLD:
                    //emailSubject = "Upload HLD Documents for Order";
                    openingMessage = "Please verify the order details and upload the required documentation.";
                    callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"
                    break;
                case global.vodafoneConfig[request.organization_id].FORM_ID.NEW_CUSTOMER:
                    //emailSubject = 'Upload Documents for Order';
                    openingMessage = "Please verify the order details and upload the required documentation.";
                    callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"
                    break;
                    //Existing Customer
                case global.vodafoneConfig[request.organization_id].FORM_ID.EXISTING_CUSTOMER:
                    //emailSubject = 'Upload Documents for Order';
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
            } catch (e) {
                console.log('In Catch Block : ', e);
            }

            //console.log("\x1b[35m [vodafoneSendEmail] fieldHTML: \x1b[0m", fieldHTML)
            const allFields = fieldHTML;

            //const templateDesign = "<table style='border-collapse: collapse !important;' width='100%' bgcolor='#ffffff' border='0' cellpadding='10' cellspacing='0'><tbody><tr> <td> <table bgcolor='#ffffff' style='width: 100%;max-width: 600px;' class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tbody><tr><td align='center' valign='top'><table style='border: 1px solid #e2e2e2; border-radius: 4px; background-clip: padding-box; border-spacing: 0;' border='0' cellpadding='0' cellspacing='0' width='100%' id='templateContainer'><tbody> <tr> <td align='left' style='float: right;padding: 20px;' valign='top'> <img style='width: 100px' src ='https://office.desker.co/Vodafone_logo.png'/> <img style='height: 44px;margin-left: 10px;' src ='https://office.desker.co/Idea_logo.png'/> </td> </tr> <tr><td valign='top' style=' color: #505050; font-family: Helvetica; font-size: 14px; line-height: 150%; padding-top: 3.143em; padding-right: 3.5em; padding-left: 3.5em; padding-bottom: 3.143em; text-align: left;' class='bodyContent' mc:edit='body_content'> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>Hey " + nameStr + ",</p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>" + openingMessage + "</p> <p style=' color: #808080; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: bold; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 10px; margin-left: 0; text-align: left;'>Order Management Form</p> " + allFields + "<table style='width: 100%;margin-top: 5px'></table> " + callToction + " <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 40px; margin-right: 0; margin-bottom: 0px; margin-left: 0; text-align: left;'> Parmeshwar Reddy </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Vice President </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Customer Care </p></td></tr> <tr> <td style='height: 35px;background: #cbcbcb;'></td> </tr></tbody></table><!-- // END BODY --></td></tr> </tbody></table> </td> </tr></tbody></table>";

            const Template = `
 <table style='border-collapse: collapse !important;' width='100%' bgcolor='#ffffff' border='0' cellpadding='10' cellspacing='0'>
    <tbody><tr> <td> 
    <table bgcolor='#ffffff' style='width: 100%;max-width: 600px;' class='content' align='center' cellpadding='0' cellspacing='0' border='0'> 
    <tbody><tr><td align='center' valign='top'><table style='border: 1px solid #e2e2e2; border-radius: 4px; background-clip: padding-box; border-spacing: 0;' border='0' cellpadding='0' cellspacing='0' width='100%' id='templateContainer'>
    <tbody> <tr> <td align='left' style='float: right;' valign='top'> 
    <img style='width: 600px' src ='https://staging.officedesk.app/header_banner.png'/> 
    <table style='position: relative;top: -30px;left: 215px;font-size:12px;color: #fff;font-family: Helvetica;'>
    <tbody><tr><td><strong>Order Management Team</strong></td></tr></tbody>
    </table>
    </td> 
    </tr> 
     <tr>
    <td valign='top' style=' color: #505050; font-family: Helvetica; font-size: 14px; line-height: 150%; padding-top: 3.143em; padding-right: 3.5em; padding-left: 3.5em; padding-bottom: 1em; text-align: left;' class='bodyContent' mc:edit='body_content'> 
     <p style='  display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>
   Date: ${date}</p> 
    <p style=' color: #f47920; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>
    Dear <strong>${customerCollection.firstName},</strong></p> 
   
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>
    Thank you for providing your details, your order is currently being processed and will be released for delivery shortly.</p> 
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 30px; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>You can also track the progress of your order by clicking on the below tab</p> 
   
    <a style='background: #f47920;display: inline-block;color: #FFFFFF;text-decoration: none;font-size: 12px;margin-top: 1.0em;background-clip: padding-box;padding: 5px 15px;box-shadow: 4px 4px 6px 1px #cbcbcb;margin-left:10px' target='_blank' class='blue-btn' href='${baseUrlOrderStatus}'>Check Order Status</a> 
    
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 30px; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>
    Once your order is logged you will receive a confirmation email with your order ID.</p> 
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>
    We thank you for your business with Vodafone Idea Limited.</p> 

    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 40px; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'> Regards, </p> 
    <p style=' color: #f47920; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0px; margin-left: 0; text-align: left;'>  </p> 
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 20px; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Central Order Management Team </p> 
    <p style=' color: #545454; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Vodafone Idea Limited </p> </td></tr> 
    <tr>
        <td style='padding-left: 3em;'>
            <img style='width: 120px' src='https://staging.officedesk.app/Vodafone_Idea_logo.png'/>
        </td>
    </tr>
    <tr>
        <td style='color:#545454;padding-left: 50px;font-family: Helvetica;font-size: 10px;padding-bottom: 40px'>
            <strong>Vodafone Idea Limited</strong> (formerly Idea Cellular Limited)<br/>
            An Aditya Birla Group & Vodafone partnership
        </td>
    </tr>
    <tr>
        <td style='padding: 40px;color: #c8c8c8;'>
            <p style='font-family: Helvetica;font-size: 9px;'>This E-Mail (including any attachments) may contain Confidential and/or legally privileged Information and is meant for the intended recipient(s) only. If you have received this e-mail in error and are not the intended recipient/s, kindly delete this e-mail immediately from your system. You are also hereby notified that any use, any form of reproduction, dissemination, copying, disclosure, modification, distribution and/or publication of this e-mail, its contents or its attachment/s other than by its intended recipient/s is strictly prohibited and may be construed unlawful. Internet Communications cannot be guaranteed to be secure or error-free as information could be delayed, intercepted, corrupted, lost, or may contain viruses. Vodafone Idea Limited does not accept any liability for any errors, omissions, viruses or computer shutdown (s) or any kind of disruption/denial of services if any experienced by any recipient as a result of this e-mail.</p>
        </td>
    </tr>

  </tbody></table> </td> </tr></tbody></table>`;

            //request.email_sender = 'vodafone_idea@grenerobotics.com';
            //request.email_sender_name = 'vodafone_idea grenerobotics.com';
            request.email_sender = 'OMT.IN1@vodafoneidea.com';
            request.email_sender_name = 'Vodafoneidea';

            util.sendEmailV3(request,
                customerCollection.contactEmailId,
                emailSubject,
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
        });
    }

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
        const CAF_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CAF,
            FR_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.FR,
            CRM_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM,
            HLD_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.HLD;

        activityCommonService.updateAssetLocation(request, function (err, data) {});

        switch (Number(request.form_id)) {
            case 866: //FR Form Definition
            case 871:
                request.activity_inline_data = request.activity_timeline_collection;
                request.activity_form_id = FR_FORM_ID;
                request.form_name = "FR Form";
                break;
            case 865: //CRM Form Definition
            case 870:
                request.activity_inline_data = request.activity_timeline_collection;
                request.activity_form_id = CRM_FORM_ID;
                request.form_name = "CRM Form";
                break;
            case 864: //HLD Form
            case 869:
                request.activity_inline_data = request.activity_timeline_collection;
                request.activity_form_id = HLD_FORM_ID;
                request.form_name = "HLD Form";
                break;
            case 867: //CAF Form
            case 872:
                request.activity_inline_data = request.activity_timeline_collection;
                request.activity_form_id = CAF_FORM_ID;
                request.form_name = "CAF Form";
                break;
            case 876: //New Customer
            case 880:
                request.activity_inline_data = request.activity_timeline_collection;
                request.activity_form_id = newCustomer;
                break;
            case 877: //Existing Customer
            case 881:
                request.activity_inline_data = request.activity_timeline_collection;
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

        if (!(request.hasOwnProperty('from_internal'))) {
            //Create a new file activity for the customer submitted form data with file status -1
            addActivityChangeFileStatus(request).then(() => {

            }).catch((err) => {
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
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {});

                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});

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
        return new Promise((resolve, reject) => {

            let addFileActivityReq = {
                organization_id: request.organization_id,
                account_id: global.vodafoneConfig[request.organization_id].CUSTOMER.ACCOUNT_ID,
                workforce_id: global.vodafoneConfig[request.organization_id].CUSTOMER.WORKFORCE_ID,
                asset_id: global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
                asset_token_auth: global.vodafoneConfig[request.organization_id].BOT.ENC_TOKEN,
                asset_message_counter: 0,
                activity_type_category_id: 10,
                activity_title: "Customer Form Data Submitted",
                activity_description: "Customer Form Data Submitted",
                activity_inline_data: request.activity_timeline_collection,
                activity_type_id: global.vodafoneConfig[request.organization_id].ACTIVITY_TYPE_IDS.FORM_ACTIVITY_TYPE_ID,
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

            activityCommonService.makeRequest(addFileActivityReq, 'activity/add/v1', 1).then((resp) => {
                let response = JSON.parse(resp);

                let flagAlterReq = {};
                flagAlterReq.activity_id = response.response.activity_id;
                flagAlterReq.asset_id = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;
                flagAlterReq.organization_id = request.organization_id;
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
                            global.logger.write('conLog', "\x1b[35m [ERROR] Raising queue activity raised for adding Service Desk as a participant. \x1b[0m", {}, request);
                            reject('Error while raising queue activity for adding service desk as a participant');
                        } else {
                            global.logger.write('conLog', "\x1b[35m Queue activity raised for adding Service Desk as a participant. \x1b[0m", {}, request);
                            resolve();
                        }
                    });
                    resolve();
                } else {
                    reject(response);
                }
            });
        });
    }


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

    function checkServiceDeskExistence(request) {
        return new Promise((resolve, reject) => {
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
                    if (err === false) {
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
        return new Promise((resolve, reject) => {
            let newRequest = Object.assign({}, request);
            newRequest.asset_id = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;

            var dateTimeLog = util.getCurrentUTCTime();
            newRequest['datetime_log'] = dateTimeLog;

            assetListInsertAddAsset(newRequest, function (err, newAssetId) {
                if (err === false) {
                    assetListHistoryInsert(newRequest, newAssetId, newRequest.organization_id, 0, dateTimeLog, function (err, data) {
                        if (err === false) {
                            var newAssetCollection = {
                                organization_id: newRequest.organization_id,
                                account_id: newRequest.account_id,
                                workforce_id: newRequest.workforce_id,
                                asset_id: newAssetId,
                                message_unique_id: newRequest.message_unique_id
                            };
                            activityCommonService.assetTimelineTransactionInsert(newRequest, newAssetCollection, 7, function (err, data) {});
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
    }

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

    this.buildAndSubmitCafForm = function (request, callback) {

        // CAF
        let CAF_ORGANIZATION_ID,
            CAF_ACCOUNT_ID,
            CAF_WORKFORCE_ID,
            CAF_ACTIVITY_TYPE_ID,
            CAF_BOT_ASSET_ID,
            CAF_BOT_ENC_TOKEN;

        /*if (Number(request.organization_id) === 860) {
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
        } */

        switch (Number(request.organization_id)) {
            case 860: // CAF
                CAF_ORGANIZATION_ID = 860; // Vodafone Idea Beta
                CAF_ACCOUNT_ID = 975; // Central OMT Beta
                CAF_WORKFORCE_ID = 5355; // Lobby
                CAF_ACTIVITY_TYPE_ID = 133250;
                // CAF BOT
                CAF_BOT_ASSET_ID = 31347;
                CAF_BOT_ENC_TOKEN = "05986bb0-e364-11e8-a1c0-0b6831833754";
                break;

            case 858: // CAF
                CAF_ORGANIZATION_ID = 858; // Vodafone Idea Beta
                CAF_ACCOUNT_ID = 973; // Central OMT Beta
                CAF_WORKFORCE_ID = 5345; // Lobby
                CAF_ACTIVITY_TYPE_ID = 133000;
                // CAF BOT
                CAF_BOT_ASSET_ID = 31298;
                CAF_BOT_ENC_TOKEN = "3dc16b80-e338-11e8-a779-5b17182fa0f6";
                break;

            case 868:
                CAF_ORGANIZATION_ID = Number(request.organization_id);
                CAF_ACCOUNT_ID = global.vodafoneConfig[request.organization_id].BOT.ACCOUNT_ID;
                CAF_WORKFORCE_ID = global.vodafoneConfig[request.organization_id].BOT.WORKFORCE_ID;
                CAF_ACTIVITY_TYPE_ID = global.vodafoneConfig[request.organization_id].ACTIVITY_TYPE_IDS[CAF_WORKFORCE_ID];
                // CAF 
                CAF_BOT_ASSET_ID = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;
                CAF_BOT_ENC_TOKEN = global.vodafoneConfig[request.organization_id].BOT.ENC_TOKEN;
                break;
        }

        const NEW_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER,
            SUPPLEMENTARY_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY,
            FR_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.FR,
            CRM_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM,
            HLD_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.HLD,
            CAF_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CAF,
            CUSTOMER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL;

        const ACTIVITY_STATUS_ID_VALIDATION_PENDING = global.vodafoneConfig[request.organization_id].STATUS.VALIDATION_PENDING;

        var cafFormJson = [];
        var formId = NEW_ORDER_FORM_ID;

        // Pull the required data from the NEW ORDER FORM of the form file
        activityCommonService
            .getActivityTimelineTransactionByFormId713(request, request.activity_id, formId)
            .then((newOrderFormData) => {
                if (newOrderFormData.length > 0) {
                    // 
                    let formDataCollection = JSON.parse(newOrderFormData[0].data_entity_inline);
                    let formDataArrayOfObjects = [];

                    if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
                        formDataArrayOfObjects = formDataCollection.form_submitted;
                    } else {
                        formDataArrayOfObjects = JSON.parse(formDataCollection.form_submitted);
                    }
                    global.logger.write('conLog', ' ', {}, {});

                    // Append it to cafFormJson
                    cafFormJson = applyTransform(request, cafFormJson, formDataArrayOfObjects, formId);
                    // Pull the required data from the SUPPLEMENTARY ORDER FORM of the form file
                    formId = SUPPLEMENTARY_ORDER_FORM_ID;
                    return activityCommonService.getActivityTimelineTransactionByFormId713(request, request.activity_id, formId);
                } else {
                    throw new Error("newOrderFormNotFound");
                }

            })
            .then((supplementaryOrderFormData) => {
                // 
                if (supplementaryOrderFormData.length > 0) {
                    let formDataCollection = JSON.parse(supplementaryOrderFormData[0].data_entity_inline);
                    let formDataArrayOfObjects = [];

                    if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
                        formDataArrayOfObjects = formDataCollection.form_submitted;
                    } else {
                        formDataArrayOfObjects = JSON.parse(formDataCollection.form_submitted);
                    }
                    global.logger.write('conLog', ' ', {}, {});

                    // Append it to cafFormJson
                    cafFormJson = applyTransform(request, cafFormJson, formDataArrayOfObjects, formId);
                }

                // Pull the required data from the SUPPLEMENTARY ORDER FORM of the form file
                formId = FR_FORM_ID;
                return activityCommonService.getActivityTimelineTransactionByFormId713(request, request.activity_id, formId)
            })
            .then((frFormData) => {

                if (frFormData.length > 0) {
                    let formDataCollection = JSON.parse(frFormData[0].data_entity_inline);
                    let formDataArrayOfObjects = [];

                    if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
                        formDataArrayOfObjects = formDataCollection.form_submitted;
                    } else {
                        formDataArrayOfObjects = JSON.parse(formDataCollection.form_submitted);
                    }
                    global.logger.write('conLog', ' ', {}, {});
                    // Append it to cafFormJson
                    cafFormJson = applyTransform(request, cafFormJson, formDataArrayOfObjects, formId);
                    // Pull the required data from the CRM FORM of the form file
                    formId = CRM_FORM_ID;
                    return activityCommonService.getActivityTimelineTransactionByFormId713(request, request.activity_id, formId)
                } else {
                    throw new Error("frFormNotFound");
                }
                // formId = CRM_FORM_ID;
                // return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
            })
            .then((crmFormData) => {
                if (crmFormData.length > 0) {
                    let formDataCollection = JSON.parse(crmFormData[0].data_entity_inline);
                    let formDataArrayOfObjects = [];

                    if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
                        formDataArrayOfObjects = formDataCollection.form_submitted;
                    } else {
                        formDataArrayOfObjects = JSON.parse(formDataCollection.form_submitted);
                    }
                    global.logger.write('conLog', ' ', {}, {});
                    // Append it to cafFormJson
                    cafFormJson = applyTransform(request, cafFormJson, formDataArrayOfObjects, formId);
                    // Pull the required data from the HLD FORM of the form file
                    formId = CUSTOMER_APPROVAL_FORM_ID;
                    return activityCommonService.getActivityTimelineTransactionByFormId713(request, request.activity_id, formId)
                } else {
                    throw new Error("crmFormNotFound");
                }
                // formId = HLD_FORM_ID;
                // return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
            })
            .then(async (customerApprovalForm) => {
                if (customerApprovalForm.length > 0) {
                    let formDataCollection = JSON.parse(customerApprovalForm[0].data_entity_inline);
                    let formDataArrayOfObjects = [];

                    if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
                        formDataArrayOfObjects = formDataCollection.form_submitted;
                    } else {
                        formDataArrayOfObjects = JSON.parse(formDataCollection.form_submitted);
                    }
                    global.logger.write('conLog', ' ', {}, {});
                    // Append it to cafFormJson
                    cafFormJson = applyTransform(request, cafFormJson, formDataArrayOfObjects, formId);
                    // Pull the required data from the HLD FORM of the form file
                    // formId = HLD_FORM_ID;
                    // return activityCommonService.getActivityTimelineTransactionByFormId(request, request.activity_id, formId)
                } else {
                    // throw new Error("customerApprovalFormNotFound");
                }
                formId = HLD_FORM_ID;
                await sleep(4000);
                return activityCommonService.getActivityTimelineTransactionByFormId713(request, request.activity_id, formId);
            })
            .then(async (hldFormData) => {
                if (hldFormData.length > 0) {
                    let formDataCollection = JSON.parse(hldFormData[0].data_entity_inline);
                    let formDataArrayOfObjects = [];

                    if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
                        formDataArrayOfObjects = formDataCollection.form_submitted;
                    } else {
                        formDataArrayOfObjects = JSON.parse(formDataCollection.form_submitted);
                    }
                    global.logger.write('conLog', ' ', {}, {});
                    // Append it to cafFormJson
                    cafFormJson = applyTransform(request, cafFormJson, formDataArrayOfObjects, formId);
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
                    });

                // Fetch activityListData
                await activityCommonService
                    .getActivityDetailsPromise(request, request.activity_id)
                    .then((activityListData) => {
                        if (activityListData.length > 0) {
                            formActivityData = activityListData;
                        }
                    });

                // ROMS CAF Fields Data | Process, Update & Append
                let ROMS_CAF_FIELDS_DATA = {};
                /*if (Number(request.organization_id) === 860) {
                    ROMS_CAF_FIELDS_DATA = romsCafFieldsData.BETA;

                } else if (Number(request.organization_id) === 858) {
                    ROMS_CAF_FIELDS_DATA = romsCafFieldsData.LIVE;
                }*/

                switch (Number(request.organization_id)) {
                    case 860:
                        ROMS_CAF_FIELDS_DATA = romsCafFieldsData.BETA;
                        break;
                    case 858:
                        ROMS_CAF_FIELDS_DATA = romsCafFieldsData.LIVE;
                        break;
                    case 868:
                        ROMS_CAF_FIELDS_DATA = romsCafFieldsData.PLATFORM;
                        break;
                }

                // The 1st (0th) element in the array which populateRomsCafFieldValues() returns is 
                // ROMS_CAF_FIELDS_DATA
                const romsCafFieldsAndValues = populateRomsCafFieldValues(
                    Object.assign(ROMS_CAF_FIELDS_DATA),
                    calculatedValuesJSON,
                    formParticipantsData,
                    formActivityData
                )[0];

                // console.log("calculatedValuesJSON: ", calculatedValuesJSON);
                // console.log("formParticipantsData: ", formParticipantsData);
                // console.log("ROMS_CAF_FIELDS_DATA: ", ROMS_CAF_FIELDS_DATA);
                // Append fields which need to be calculated, and then appended. I am just
                // appending them for now with default/empty values. T H I S ~ N E E D S ~ W O R K.
                cafFormJson = cafFormJson.concat(romsCafFieldsAndValues);

                // Append the Labels
                cafFormJson = appendLabels(request, cafFormJson);

                // As per CAF Annexure
                try {
                    cafFormJson = await setAsPerCAFAnnexure(request, cafFormJson);
                } catch (error) {
                    console.log("cafFormJson | setAsPerCAFAnnexure | Error: ", error);
                }

                // console.log("[FINAL] cafFormJson: ", cafFormJson);
                // fs.appendFileSync('pdfs/caf.json', JSON.stringify(cafFormJson));

                // Fetch all form field mappings for the CAF Form
                let cafFieldIdToFieldSequenceIdMap = {};
                await activityCommonService
                    .getFormFieldMappings(request, CAF_FORM_ID, 0, 500)
                    .then((cafFormFieldMappingsData) => {
                        if (cafFormFieldMappingsData.length > 0) {

                            cafFormFieldMappingsData.forEach(formMappingEntry => {
                                cafFieldIdToFieldSequenceIdMap[formMappingEntry.field_id] = Number(formMappingEntry.field_sequence_id);
                            });
                        }
                    });

                // console.log("cafFieldIdToFieldSequenceIdMap: ", cafFieldIdToFieldSequenceIdMap);

                // Reorder CAF Form JSON based on the field_id:field_seq_id data 
                // feteched above
                cafFormJson.sort((a, b) => {
                    let keyA = Number(cafFieldIdToFieldSequenceIdMap[a.field_id]),
                        keyB = Number(cafFieldIdToFieldSequenceIdMap[b.field_id]);
                    if (keyA < keyB) return -1;
                    if (keyA > keyB) return 1;
                    return 0;
                });

                // console.log("cafFormJson: ", cafFormJson)

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
                };

                // global.config.mobileBaseUrl + global.config.version
                // 'https://api.worlddesk.cloud/r1'
                makeRequest.post(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', cafRequestOptions, function (error, response, body) {
                    global.logger.write('conLog', '[cafFormSubmissionRequest] Body: ', body, {});
                    // global.logger.write('conLog', '[cafFormSubmissionRequest] Error: ', error, {});
                    body = JSON.parse(body);
                    global.logger.write('conLog', '\x1b[36m body \x1b[0m', {}, {});

                    if (Number(body.status) === 200) {
                        const cafFormActivityId = body.response.activity_id;
                        const cafFormTransactionId = body.response.form_transaction_id;

                        // Add the CAF form submitted as a timeline entry to the form file
                        // cafFormSubmissionRequest.asset_id = request.asset_id;
                        let nonDedicatedCafFormTimelineEntryRequest = Object.assign({}, cafFormSubmissionRequest);
                        nonDedicatedCafFormTimelineEntryRequest.activity_id = request.activity_id;
                        nonDedicatedCafFormTimelineEntryRequest.form_transaction_id = cafFormTransactionId;
                        nonDedicatedCafFormTimelineEntryRequest.form_id = CAF_FORM_ID;
                        // cafFormSubmissionRequest.activity_timeline_collection = cafFormSubmissionRequest.activity_inline_data;
                        nonDedicatedCafFormTimelineEntryRequest.activity_timeline_collection = JSON.stringify({
                            "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                            "subject": "CAF Form",
                            "content": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                            "asset_reference": [],
                            "activity_reference": [],
                            "form_approval_field_reference": [],
                            "form_submitted": cafFormJson,
                            "attachments": []
                        });
                        nonDedicatedCafFormTimelineEntryRequest.flag_timeline_entry = 1;
                        nonDedicatedCafFormTimelineEntryRequest.activity_stream_type_id = 705;
                        nonDedicatedCafFormTimelineEntryRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
                        nonDedicatedCafFormTimelineEntryRequest.device_os_id = 8;

                        let event = {
                            name: "addTimelineTransaction",
                            service: "activityTimelineService",
                            method: "addTimelineTransaction",
                            payload: nonDedicatedCafFormTimelineEntryRequest
                        };

                        queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                            if (err) {
                                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                // throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                            } else {
                                // Calculate the percentage completion of CAF Form and store it in the inline data of the file form
                                // NEEDS WORK | NEEDS WORK | NEEDS WORK | NEEDS WORK | NEEDS WORK | NEEDS WORK | NEEDS WORK

                                if (Number(request.organization_id) !== 868) {

                                    // Unmap the form file from HLD queue by archiving the mapping of queue and activity
                                    request.start_from = 0;
                                    request.limit_value = 50;
                                    let hldQueueActivityMappingId;

                                    activityCommonService
                                        .fetchQueueByQueueName(request, 'HLD')
                                        .then((queueListData) => {
                                            global.logger.write('conLog', 'data[0].queue_id: ', queueListData[0].queue_id, {});
                                            return activityCommonService.fetchQueueActivityMappingId(request, queueListData[0].queue_id);
                                        })
                                        .then((queueActivityMappingData) => {
                                            global.logger.write('conLog', 'queueActivityMappingData[0].queue_activity_mapping_id: ', queueActivityMappingData[0].queue_activity_mapping_id, {});
                                            hldQueueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;
                                            let queueActivityUnmapRequest = Object.assign({}, request);
                                            queueActivityUnmapRequest.asset_id = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;
                                            return activityCommonService.unmapFileFromQueue(queueActivityUnmapRequest, queueActivityMappingData[0].queue_activity_mapping_id)
                                        })
                                        .then((data) => {
                                            let queueHistoryInsertRequest = Object.assign({}, request);
                                            queueHistoryInsertRequest.asset_id = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;
                                            activityCommonService.queueHistoryInsert(queueHistoryInsertRequest, 1403, hldQueueActivityMappingId).then(() => {});
                                        })
                                        .catch((error) => {
                                            global.logger.write('conLog', 'Error Unmapping the form file from HLD queue: ', error, {});
                                        });

                                    // Alter the status of the form file to Validation Pending
                                    // Form the request object
                                    var statusAlterRequest = Object.assign({}, cafFormSubmissionRequest);
                                    statusAlterRequest.activity_id = request.activity_id;
                                    statusAlterRequest.activity_status_id = ACTIVITY_STATUS_ID_VALIDATION_PENDING;
                                    statusAlterRequest.activity_status_type_id = 25;
                                    statusAlterRequest.activity_status_type_category_id = 1;
                                    statusAlterRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
                                    statusAlterRequest.device_os_id = 5;

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
                                                    // queueActivityMappingInlineData.queue_sort.current_status = ACTIVITY_STATUS_ID_VALIDATION_PENDING;
                                                    queueActivityMappingInlineData.queue_sort.current_status_id = ACTIVITY_STATUS_ID_VALIDATION_PENDING;
                                                    queueActivityMappingInlineData.queue_sort.current_status_name = "Order Validation";
                                                    queueActivityMappingInlineData.queue_sort.last_status_alter_time = util.getCurrentUTCTime();
                                                    queueActivityMappingInlineData.queue_sort.caf_completion_percentage += 45;
                                                    request.activity_status_id = ACTIVITY_STATUS_ID_VALIDATION_PENDING;

                                                    omtQueueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;

                                                    return activityCommonService.queueActivityMappingUpdateInlineStatus(
                                                        request,
                                                        queueActivityMappingData[0].queue_activity_mapping_id,
                                                        JSON.stringify(queueActivityMappingInlineData)
                                                    );
                                                })
                                                .then((data) => {

                                                    let queueHistoryInsertRequest = Object.assign({}, request);
                                                    queueHistoryInsertRequest.asset_id = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;
                                                    activityCommonService.queueHistoryInsert(queueHistoryInsertRequest, 1402, omtQueueActivityMappingId).then(() => {});
                                                })
                                                .catch((error) => {
                                                    console.log("Error modifying the form file activity entry in the OMT queue: ", error)
                                                });

                                            return callback(false, true);
                                        }
                                    });

                                } //If (request.organization_id !== 868)
                            }
                        });

                    } else {
                        // If the CAF Form submission wasn't successful                        
                        global.logger.write('conLog', 'CAF Form submission wasnt successful: ', {}, {});
                        return callback(true, false);
                    }

                });
            })
            .catch((error) => {
                console.log("[buildAndSubmitCafForm] Promise Chain Error: ", error);
                global.logger.write('conLog', '[buildAndSubmitCafForm] Promise Chain Error: ', error, {});
                callback(true, false);
                return;
            });
    };

    async function setAsPerCAFAnnexure(request, targetFormData) {
        let sourceFormActivityID = 0,
            sourceFormTransactionID = 0,
            isAnnexureUploaded = false;

        const sourceFormID = global.vodafoneConfig[request.organization_id].ANNEXURE_DEFAULTS.SOURCE_FORM_ID,
            sourceFormFieldID = global.vodafoneConfig[request.organization_id].ANNEXURE_DEFAULTS.SOURCE_FIELD_ID;

        await activityCommonService
            .getActivityTimelineTransactionByFormId713(request, request.activity_id, sourceFormID)
            .then((formData) => {
                if (formData.length > 0) {
                    sourceFormActivityID = formData[0].data_activity_id;
                    sourceFormTransactionID = formData[0].data_form_transaction_id;
                }
            });

        if (Number(sourceFormTransactionID) !== 0) {
            fieldValue = await getFieldValue({
                form_transaction_id: sourceFormTransactionID,
                form_id: sourceFormID,
                field_id: sourceFormFieldID,
                organization_id: request.organization_id
            });
            if (fieldValue[0].data_entity_text_1 !== '') {
                isAnnexureUploaded = true;
            }
        }
        const TARGET_FIELD_IDS = global.vodafoneConfig[request.organization_id].ANNEXURE_DEFAULTS.TARGET_FIELD_IDS;
        if (isAnnexureUploaded) {
            targetFormData.forEach((fieldEntry, index) => {
                if (TARGET_FIELD_IDS.includes(Number(fieldEntry.field_id))) {
                    targetFormData[index].field_value = 'As per CAF Annexure';
                }
            });
        }
        return targetFormData;
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

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.customerManagementApprovalWorkflow = async function (request, callback) {
        const CAF_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CAF,
            NEW_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER,
            CUSTOMER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL;

        let cafFormTransactionId,
            cafFormActivityId,
            cafActivityInlineData,
            incrementalCafFormData,
            customerManagementApprovalFormData = [];

        const customerManagementApprovalInlineData = JSON.parse(request.activity_timeline_collection);

        if (Array.isArray(customerManagementApprovalInlineData.form_submitted) === true || typeof customerManagementApprovalInlineData.form_submitted === 'object') {
            customerManagementApprovalFormData = customerManagementApprovalInlineData.form_submitted;
        } else {
            customerManagementApprovalFormData = JSON.parse(customerManagementApprovalInlineData.form_submitted);
        }

        await activityCommonService
            .getActivityTimelineTransactionByFormId(request, request.activity_id, CAF_FORM_ID)
            .then((cafFormData) => {
                if (cafFormData.length > 0) {
                    cafFormTransactionId = cafFormData[0].data_form_transaction_id

                    return getActivityIdBasedOnTransactionId(request, cafFormTransactionId)
                } else {
                    throw new Error("CAFformNotFound");
                }
            })
            .then((cafFormTransactionData) => {
                if (cafFormTransactionData.length > 0) {
                    cafFormActivityId = cafFormTransactionData[0].activity_id;
                    cafActivityInlineData = JSON.parse(cafFormTransactionData[0].activity_inline_data);
                    return Promise.resolve(true);
                } else {
                    throw new Error("cafFormTransactionDataNotFound");
                }
            })
            .catch((error) => {
                console.log("[customerManagementApprovalWorkflow] Promise Chain Error: ", error)
                callback(true, false);
                return;
            });

        // Apply Transform
        let originalCafFormDataLength = cafActivityInlineData.length;
        cafActivityInlineData = applyTransform(request, cafActivityInlineData, customerManagementApprovalFormData, CUSTOMER_APPROVAL_FORM_ID);

        // Get the incremental form data, as in, the number of new objects
        // appended to CAF after 'applyTransform'.
        let updatedCafFormDataLength = cafActivityInlineData.length;
        let numberOfNewCafFormData = updatedCafFormDataLength - originalCafFormDataLength;
        // This is useful for incremental form submission.
        incrementalCafFormData = cafActivityInlineData.slice(updatedCafFormDataLength - numberOfNewCafFormData);
        // Append the incremental form data to the request object

        // Fire the alterFormActivity service for each of the two new entries added to CAF
        let waitTime = 0;

        incrementalCafFormData.forEach(formEntry => {
            formEntry.form_name = "Digital CAF";
            formEntry.form_transaction_id = cafFormTransactionId;

            let cafFieldUpdateRequest = Object.assign({}, request);
            cafFieldUpdateRequest.asset_id = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;
            cafFieldUpdateRequest.activity_id = cafFormActivityId;
            cafFieldUpdateRequest.form_id = CAF_FORM_ID;
            cafFieldUpdateRequest.form_transaction_id = cafFormTransactionId;
            cafFieldUpdateRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            cafFieldUpdateRequest.device_os_id = 7;
            cafFieldUpdateRequest.field_id = formEntry.field_id;
            cafFieldUpdateRequest.activity_inline_data = JSON.stringify([formEntry]);

            // console.log("\n\nformEntry: ", formEntry)

            setTimeout(() => {

                let cafFieldUpdateEvent = {
                    name: "alterFormActivity",
                    service: "formConfigService",
                    method: "alterFormActivity",
                    payload: cafFieldUpdateRequest
                };

                // console.log("\n\n\n", moment().utc().format('YYYY-MM-DD HH:mm:ss'))
                // console.log("\n\n cafFieldUpdateRequest.activity_inline_data: ", JSON.parse(cafFieldUpdateRequest.activity_inline_data))

                queueWrapper.raiseActivityEvent(cafFieldUpdateEvent, cafFormActivityId, (err, resp) => {
                    if (err) {
                        global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                        global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                    } else {
                        global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                        global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                    }
                });

            }, waitTime * 1000)

            waitTime += 2;

        });


        // Sort the CAF Data
        // Fetch all form field mappings for the CAF Form
        let cafFieldIdToFieldSequenceIdMap = {};
        await activityCommonService
            .getFormFieldMappings(request, CAF_FORM_ID, 0, 500)
            .then((cafFormFieldMappingsData) => {
                if (cafFormFieldMappingsData.length > 0) {

                    cafFormFieldMappingsData.forEach(formMappingEntry => {
                        cafFieldIdToFieldSequenceIdMap[formMappingEntry.field_id] = Number(formMappingEntry.field_sequence_id);
                    });
                }
            })

        // Reorder CAF Form JSON based on the field_id:field_seq_id data 
        // feteched above
        cafActivityInlineData.sort((a, b) => {
            let keyA = Number(cafFieldIdToFieldSequenceIdMap[a.field_id]),
                keyB = Number(cafFieldIdToFieldSequenceIdMap[b.field_id])
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        })

        // console.log("cafFormTransactionId cafFormTransactionId", cafFormTransactionId)

        // [NEW ORDER FORM] Insert 713 record with update JSON data in activity_timeline_transaction 
        // and asset_timeline_transaction
        let fire713OnNewOrderFileRequest = Object.assign({}, request);
        fire713OnNewOrderFileRequest.activity_id = Number(request.activity_id);
        fire713OnNewOrderFileRequest.data_activity_id = Number(cafFormActivityId);
        fire713OnNewOrderFileRequest.form_transaction_id = Number(cafFormTransactionId);
        fire713OnNewOrderFileRequest.activity_timeline_collection = JSON.stringify({
            "mail_body": `Form Updated at ${moment().utcOffset('+05:30').format('LLLL')}`,
            "subject": "Field Updated for Digital CAF",
            "content": `In the Digital CAF, the field(s) Customer Company Seal(only png) and Authorised Signatory Sign were added.`,
            "asset_reference": [],
            "activity_reference": [],
            "form_approval_field_reference": [],
            "form_submitted": cafActivityInlineData,
            "attachments": []
        });
        // Append the incremental form data as well
        fire713OnNewOrderFileRequest.activity_type_category_id = 9;
        fire713OnNewOrderFileRequest.activity_stream_type_id = 713;
        fire713OnNewOrderFileRequest.form_id = Number(CAF_FORM_ID);
        fire713OnNewOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
        fire713OnNewOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        fire713OnNewOrderFileRequest.device_os_id = 7;

        let fire713OnNewOrderFileEvent = {
            name: "addTimelineTransaction",
            service: "activityTimelineService",
            method: "addTimelineTransaction",
            payload: fire713OnNewOrderFileRequest
        };

        queueWrapper.raiseActivityEvent(fire713OnNewOrderFileEvent, request.activity_id, (err, resp) => {
            if (err) {
                global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
            } else {
                global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
            }
        });

        return callback(false, {
            cafFormTransactionId,
            cafFormActivityId,
            incrementalCafFormData
        })
    };

    function getActivityIdBasedOnTransactionId(request, formTransactionId) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                formTransactionId
            );
            const queryString = util.getQueryString('ds_p1_activity_list_select_form_transaction', paramsArr);
            if (queryString !== '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    // console.log('Data from getActivityIdBasedOnTransId : ', data);
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    }

    function populateRomsCafFieldValues(ROMS_CAF_FIELDS_DATA, calculatedValuesJSON, formParticipantsData = [], formActivityData = []) {
        let updatedFields = [];
        ROMS_CAF_FIELDS_DATA.forEach((formEntry, index) => {
            switch (formEntry.field_id) {
                case 5568: // LIVE | CAF ID
                case 5836: // BETA | CAF ID
                    // Time-based UUID
                    // ROMS_CAF_FIELDS_DATA[index].field_value = uuid.v1();
                    ROMS_CAF_FIELDS_DATA[index].field_value = "";
                    break;
                case 5726: // LIVE | Service Rental-Grand Total(A+B+C) 
                case 5994: // BETA | Service Rental-Grand Total(A+B+C)
                case 7146: // Platform | Service Rental-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.serviceRentalGrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.serviceRentalGrandTotal;
                    break;
                case 5729: // LIVE | IP Address Charges-Grand Total(A+B+C)
                case 5997: // BETA | IP Address Charges-Grand Total(A+B+C)
                case 7149: // Platform | IP Address Charges-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.ipAddressChargesGrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.ipAddressChargesGrandTotal;
                    break;
                case 5732: // LIVE | SLA Charges-Grand Total(A+B+C)
                case 6000: // BETA | SLA Charges-Grand Total(A+B+C)
                case 7152: // Platform | SLA Charges-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.slaChargesGrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.slaChargesGrandTotal;
                    break;
                case 5735: // LIVE | Self Care Portal Service Charges-Grand Total(A+B+C)
                case 6003: // BETA | Self Care Portal Service Charges-Grand Total(A+B+C)
                case 7155: // Platform | Self Care Portal Service Charges-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.selfCarePortalServiceChargesGrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.selfCarePortalServiceChargesGrandTotal;
                    break;
                case 5738: // LIVE | Managed Services Charges-Grand Total(A+B+C)
                case 6006: // BETA | Managed Services Charges-Grand Total(A+B+C)
                case 7158: // Platform | Managed Services Charges-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.managedServicesChargesGrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.managedServicesChargesGrandTotal;
                    break;
                case 5741: // LIVE | Managed CPE Charges-Grand Total(A+B+C)
                case 6009: // BETA | Managed CPE Charges-Grand Total(A+B+C)
                case 7161: // Platform | Managed CPE Charges-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.managedCPEChargesGrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.managedCPEChargesGrandTotal;
                    break;
                case 5745: // LIVE | CPE Rentals-Grand Total(A+B+C)
                case 6013: // BETA | CPE Rentals-Grand Total(A+B+C)
                case 7165: // Platform | CPE Rentals-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.cpeRentalsGrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpeRentalsGrandTotal;
                    break;
                case 5749: // LIVE | CPE 1-Grand Total(A+B+C)
                case 6017: // BETA | CPE 1-Grand Total(A+B+C)
                case 7169: // Platform | CPE 1-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.cpe1GrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpe1GrandTotal;
                    break;
                case 5753: // LIVE | CPE 2-Grand Total(A+B+C)
                case 6021: // BETA | CPE 2-Grand Total(A+B+C)
                case 7173: // Platform | CPE 2-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.cpe2GrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpe2GrandTotal;
                    break;
                case 5757: // LIVE | CPE 3-Grand Total(A+B+C)
                case 6025: // BETA | CPE 3-Grand Total(A+B+C)
                case 7177: // Platform | CPE 3-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.cpe3GrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpe3GrandTotal;
                    break;
                case 5761: // LIVE | CPE 4-Grand Total(A+B+C)
                case 6029: // BETA | CPE 4-Grand Total(A+B+C)
                case 7181: // Platform | CPE 4-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.cpe4GrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpe4GrandTotal;
                    break;
                case 5765: // LIVE | CPE 5-Grand Total(A+B+C)
                case 6033: // BETA | CPE 5-Grand Total(A+B+C)
                case 7185: // Platform | CPE 5-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.cpe5GrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.cpe5GrandTotal;
                    break;
                case 5769: // LIVE | Miscellaneous Charges-1-Grand Total(A+B+C)
                case 6037: // BETA | Miscellaneous Charges-1-Grand Total(A+B+C)
                case 7189: // Platform | Miscellaneous Charges-1-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.miscellaneousCharges1GrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.miscellaneousCharges1GrandTotal;
                    break;
                case 5773: // LIVE | Miscellaneous Charges2-Grand Total(A+B+C)
                case 6041: // BETA | Miscellaneous Charges2-Grand Total(A+B+C)
                case 7193: // Platform | Miscellaneous Charges2-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.miscellaneousCharges2GrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.miscellaneousCharges2GrandTotal;
                    break;
                case 5775: // LIVE | Registration Charges-Grand Total(A+B+C)
                case 6043: // BETA | Registration Charges-Grand Total(A+B+C)
                case 7195: // Platform | Registration Charges-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.registrationChargesGrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.registrationChargesGrandTotal;
                    break;
                case 5828: // LIVE | Total Amount Payable-Grand Total(A+B+C)
                case 6096: // BETA | Total Amount Payable-Grand Total(A+B+C)
                case 7248: // Platform | Total Amount Payable-Grand Total(A+B+C)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.totalAmountPayableGrandTotal);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.totalAmountPayableGrandTotal;
                    break;
                case 7200: // Platform | Total Order Value
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.totalAmountPayableGrandTotal;
                    break;
                case 5705: // LIVE | Account Manager Name
                case 5973: // BETA | Account Manager Name
                case 7125: // Platform | Account Manager Name
                    if (formParticipantsData.length > 0) {
                        formParticipantsData.forEach(participant => {
                            switch (participant.asset_type_id) {
                                case 126035: // LIVE | Account Managers - Mumbai Circle
                                case 126305: // BETA | Account Managers - Mumbai Circle
                                case 127254: // Platform | Account Managers - Mumbai Circle
                                    ROMS_CAF_FIELDS_DATA[index].field_value = `${participant.operating_asset_first_name} ${participant.operating_asset_last_name}`;
                                    break;
                            }
                        });
                    }
                    break;
                case 5706: // LIVE | Account Manager Circle Office
                case 5974: // BETA | Account Manager Circle Office
                case 7126: // Platform | Account Manager Circle Office
                    ROMS_CAF_FIELDS_DATA[index].field_value = "Mumbai Circle - Account Managers";
                    break;
                case 5703: // LIVE | Date
                case 5971: // BETA | Date
                case 7123: // Platform | Date
                    if (formActivityData.length > 0) {
                        ROMS_CAF_FIELDS_DATA[index].field_value = formActivityData[0].activity_datetime_created;
                    }
                    break;

                case 6044: // Total Amount Payable-One Time(A)
                case 7196: // Platform | Total Amount Payable-One Time(A)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.totalAmountPayableTotal_A);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.totalAmountPayableTotal_A;
                    break;
                case 6045: // Total Amount Payable-Annual Recurring(B)
                case 7197: // Platform | Total Amount Payable-Annual Recurring(B)
                    accumulateUpdatedFields(ROMS_CAF_FIELDS_DATA[index], calculatedValuesJSON.totalAmountPayableTotal_B);
                    ROMS_CAF_FIELDS_DATA[index].field_value = calculatedValuesJSON.totalAmountPayableTotal_B;
                    break;
            }
        });

        // console.log(ROMS_CAF_FIELDS_DATA);
        function accumulateUpdatedFields(romsField, newValue) {
            if (Number(romsField.field_value) !== Number(newValue)) {
                let tempFieldJson = Object.assign({}, romsField);
                tempFieldJson.old_field_value = romsField.field_value;
                tempFieldJson.field_value = Number(newValue);
                updatedFields.push(tempFieldJson)
            }
        }

        return [
            ROMS_CAF_FIELDS_DATA,
            updatedFields
        ];
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
            totalAmountPayableGrandTotal: 0,
            totalAmountPayableTotal_A: 0,
            totalAmountPayableTotal_B: 0,
            totalAmountPayableTotal_C: 0
        };
        cafFormData.forEach(formEntry => {
            switch (formEntry.field_id) {
                // Service Rental-Grand Total(A+B+C)
                case 5991: // BETA | Service Rental-One Time(A)
                case 5992: // BETA | Service Rental-Annual Recurring(B)
                case 5993: // BETA | Service Rental-Security Deposit(C)
                case 5723: // LIVE | Service Rental-One Time(A)
                case 5724: // LIVE | Service Rental-Annual Recurring(B)
                case 5725: // LIVE | Service Rental-Security Deposit(C)
                case 7143: // Platform | Service Rental-One Time(A)
                case 7144: // Platform | Service Rental-Annual Recurring(B)
                case 7145: // Platform | Service Rental-Security Deposit(C)
                    if (isNaN(Number(formEntry.field_value))) {
                        formEntry.field_value = 0;
                    }
                    sumsKeyValueJson.serviceRentalGrandTotal += Number(formEntry.field_value);
                    break;
                    // IP Address Charges-Grand Total(A+B+C)
                case 5996: // BETA | IP Address Charges-Annual Recurring(B)
                case 5995: // BETA | IP Address Charges-One Time(A)
                case 5727: // LIVE | IP Address Charges-One Time(A)
                case 5728: // LIVE | IP Address Charges-Annual Recurring(B)
                case 7147: // Platform | IP Address Charges-One Time(A)
                case 7148: // Platform | IP Address Charges-Annual Recurring(B)
                    sumsKeyValueJson.ipAddressChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // SLA Charges-Grand Total(A+B+C)
                case 5999: // BETA | SLA Charges-Annual Recurring(B)
                case 5998: // BETA | SLA Charges-One Time(A)
                case 5730: // LIVE | SLA Charges-One Time(A)
                case 5731: // LIVE | SLA Charges-Annual Recurring(B)
                case 7150: // Platform | SLA Charges-One Time(A)
                case 7151: // Platform | SLA Charges-Annual Recurring(B)
                    sumsKeyValueJson.slaChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // Self Care Portal Service Charges-Grand Total(A+B+C)
                case 6002: // BETA | Self Care Portal Service Charges-Annual Recurring(B)
                case 6001: // BETA | Self Care Portal Service Charges-One Time(A)
                case 5733: // LIVE | Self Care Portal Service Charges-One Time(A)
                case 5734: // LIVE | Self Care Portal Service Charges-Annual Recurring(B)
                case 7153: // Platform | Self Care Portal Service Charges-One Time(A)
                case 7154: // Platform | Self Care Portal Service Charges-Annual Recurring(B)
                    sumsKeyValueJson.selfCarePortalServiceChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // Managed Services Charges-Grand Total(A+B+C)
                case 6005: // BETA | Managed Services Charges-Annual Recurring(B)
                case 6004: // BETA | Managed Services Charges-One Time(A)
                case 5736: // LIVE | Managed Services Charges-One Time(A)
                case 5737: // LIVE | Managed Services Charges-Annual Recurring(B)
                case 7156: // Platform | Managed Services Charges-One Time(A)
                case 7157: // Platform | Managed Services Charges-Annual Recurring(B)
                    sumsKeyValueJson.managedServicesChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // Managed CPE Charges-Grand Total(A+B+C)
                case 6008: // BETA | Managed CPE Charges-Annual Recurring(B)
                case 6007: // BETA | Managed CPE Charges-One Time(A)
                case 5739: // LIVE | Managed CPE Charges-One Time(A)
                case 5740: // LIVE | Managed CPE Charges-Annual Recurring(B)
                case 7159: // Platform | Managed CPE Charges-One Time(A)
                case 7160: // Platform | Managed CPE Charges-Annual Recurring(B)
                    sumsKeyValueJson.managedCPEChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE Rentals-Grand Total(A+B+C)
                case 6011: // BETA | CPE Rentals-Annual Recurring(B)
                case 6010: // BETA | CPE Rentals-One Time(A)
                case 6012: // BETA | CPE Rentals-Security Deposit(C)
                case 5742: // LIVE | CPE Rentals-One Time(A)
                case 5743: // LIVE | CPE Rentals-Annual Recurring(B)
                case 5744: // LIVE | CPE Rentals-Security Deposit(C)
                case 7162: // Platform | CPE Rentals-One Time(A)
                case 7163: // Platform | CPE Rentals-Annual Recurring(B)
                case 7164: // Platform | CPE Rentals-Security Deposit(C)
                    sumsKeyValueJson.cpeRentalsGrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE 1-Grand Total(A+B+C)
                case 6015: // CPE 1-Annual Recurring(B)
                case 6014: // CPE 1-One Time(A)
                case 6016: // CPE 1-Security Deposit(C)
                case 5746: // CPE 1-One Time(A)
                case 5747: // CPE 1-Annual Recurring(B)
                case 5748: // CPE 1-Security Deposit(C)
                case 7166: // Platform | CPE 1-One Time(A)
                case 7167: // Platform | CPE 1-Annual Recurring(B)
                case 7168: // Platform | CPE 1-Security Deposit(C)
                    sumsKeyValueJson.cpe1GrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE 2-Grand Total(A+B+C)
                case 6019: // CPE 2-Annual Recurring(B)
                case 6018: // CPE 2-One Time(A)
                case 6020: // CPE 2-Security Deposit(C)
                case 5750: // CPE 2-One Time(A)
                case 5751: // CPE 2-Annual Recurring(B)
                case 5752: // CPE 2-Security Deposit(C)
                case 7170: // Platform | CPE 2-One Time(A)
                case 7171: // Platform | CPE 2-Annual Recurring(B)
                case 7172: // Platform | CPE 2-Security Deposit(C)
                    sumsKeyValueJson.cpe2GrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE 3-Grand Total(A+B+C)
                case 6023: // CPE 3-Annual Recurring(B)
                case 6022: // CPE 3-One Time(A)
                case 6024: // CPE 3-Security Deposit(C)
                case 5754: // CPE 3-One Time(A)
                case 5755: // CPE 3-Annual Recurring(B)
                case 5756: // CPE 3-Security Deposit(C)
                case 7174: // Platform | CPE 3-One Time(A)
                case 7175: // Platform | CPE 3-Annual Recurring(B)
                case 7176: // Platform | CPE 3-Security Deposit(C)
                    sumsKeyValueJson.cpe3GrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE 4-Grand Total(A+B+C)
                case 6027: // CPE 4-Annual Recurring(B)
                case 6026: // CPE 4-One Time(A)
                case 6028: // CPE 4-Security Deposit(C)
                case 5758: // CPE 4-One Time(A)
                case 5759: // CPE 4-Annual Recurring(B)
                case 5760: // CPE 4-Security Deposit(C)
                case 7178: // Platform | CPE 4-One Time(A)
                case 7179: // Platform | CPE 4-Annual Recurring(B)
                case 7180: // Platform | CPE 4-Security Deposit(C)
                    sumsKeyValueJson.cpe4GrandTotal += Number(formEntry.field_value);
                    break;
                    // CPE 5-Grand Total(A+B+C)
                case 6031: // CPE 5-Annual Recurring(B)
                case 6030: // CPE 5-One Time(A)
                case 6032: // CPE 5-Security Deposit(C)
                case 5762: // CPE 5-One Time(A)
                case 5763: // CPE 5-Annual Recurring(B)
                case 5764: // CPE 5-Security Deposit(C)
                case 7182: // Platform | CPE 5-One Time(A)
                case 7183: // Platform | CPE 5-Annual Recurring(B)
                case 7184: // Platform | CPE 5-Security Deposit(C)
                    sumsKeyValueJson.cpe5GrandTotal += Number(formEntry.field_value);
                    break;
                    // Miscellaneous Charges-1-Grand Total(A+B+C)
                case 6035: // Miscellaneous Charges-1-Annual Recurring(B)
                case 6034: // Miscellaneous Charges-1-One Time(A)
                case 6036: // Miscellaneous Charges-1-Security Deposit(C)
                case 5766: // Miscellaneous Charges-1-One Time(A)
                case 5767: // Miscellaneous Charges-1-Annual Recurring(B)
                case 5768: // Miscellaneous Charges-1-Security Deposit(C)
                case 7186: // Platform | Miscellaneous Charges-1-One Time(A)
                case 7187: // Platform | Miscellaneous Charges-1-Annual Recurring(B)
                case 7188: // Platform | Miscellaneous Charges-1-Security Deposit(C)
                    sumsKeyValueJson.miscellaneousCharges1GrandTotal += Number(formEntry.field_value);
                    break;
                    // Miscellaneous Charges-2-Grand Total(A+B+C)
                case 6039: // Miscellaneous Charges2-Annual Recurring(B)
                case 6038: // Miscellaneous Charges2-One Time(A)
                case 6040: // Miscellaneous Charges2-Security Deposit(C)
                case 5770: // Miscellaneous Charges2-One Time(A)
                case 5771: // Miscellaneous Charges2-Annual Recurring(B)
                case 5772: // Miscellaneous Charges2-Security Deposit(C)
                case 7190: // Platform | Miscellaneous Charges2-One Time(A)
                case 7191: // Platform | Miscellaneous Charges2-Annual Recurring(B)
                    // case 7192: // Platform | Miscellaneous Charges2-Security Deposit(C)
                    sumsKeyValueJson.miscellaneousCharges2GrandTotal += Number(formEntry.field_value);
                    break;
                    // Registration Charges-Grand Total(A+B+C)
                case 6042: // Registration Charges-One Time(A)
                case 5774: // Registration Charges-One Time(A)
                case 7194: // Platform | Registration Charges-One Time(A)
                    sumsKeyValueJson.registrationChargesGrandTotal += Number(formEntry.field_value);
                    break;
                    // Total Amount Payable-Grand Total(A+B+C)
                case 6045: // Total Amount Payable-Annual Recurring(B)
                case 6044: // Total Amount Payable-One Time(A)
                case 5776: // Total Amount Payable-One Time(A)
                case 5777: // Total Amount Payable-Annual Recurring(B)
                case 7196: // Platform | Total Amount Payable-One Time(A)
                case 7197: // Platform | Total Amount Payable-Annual Recurring(B)
                    sumsKeyValueJson.totalAmountPayableGrandTotal += Number(formEntry.field_value);
                    break;
            }
        });

        // Calculate all Total Amount Payables
        cafFormData.forEach(formEntry => {
            switch (formEntry.field_id) {
                case 5991: // Service Rental-One Time(A) 
                case 5995: // IP Address Charges-One Time(A)
                case 5998: // SLA Charges-One Time(A)
                case 6001: // Self Care Portal Service Charges-One Time(A)
                case 6004: // Managed Services Charges-One Time(A)
                case 6007: // Managed CPE Charges-One Time(A)
                case 6010: // CPE Rentals-One Time(A)
                case 6014: // CPE 1-One Time(A)
                case 6018: // CPE 2-One Time(A)
                case 6022: // CPE 3-One Time(A)
                case 6026: // CPE 4-One Time(A)
                case 6030: // CPE 5-One Time(A)
                case 6034: // Miscellaneous Charges-1-One Time(A)
                case 6038: // Miscellaneous Charges2-One Time(A)
                case 6042: // Registration Charges-One Time(A)
                case 7143: // Platform | Service Rental-One Time(A)
                case 7147: // Platform | IP Address Charges-One Time(A)
                case 7150: // Platform | SLA Charges-One Time(A)
                case 7153: // Platform | Self Care Portal Service Charges-One Time(A)
                case 7156: // Platform | Managed Services Charges-One Time(A)
                case 7159: // Platform | Managed CPE Charges-One Time(A)
                case 7162: // Platform | CPE Rentals-One Time(A)
                case 7166: // Platform | CPE 1-One Time(A)
                case 7170: // Platform | CPE 2-One Time(A)
                case 7174: // Platform | CPE 3-One Time(A)
                case 7178: // Platform | CPE 4-One Time(A)
                case 7182: // Platform | CPE 5-One Time(A)
                case 7186: // Platform | Miscellaneous Charges-1-One Time(A)
                case 7190: // Platform | Miscellaneous Charges2-One Time(A)
                case 7194: // Platform | Registration Charges-One Time(A)
                    sumsKeyValueJson.totalAmountPayableTotal_A += Number(formEntry.field_value);
                    break;

                case 5992: // Service Rental-Annual Recurring(B)
                case 5996: // IP Address Charges-Annual Recurring(B)
                case 5999: // SLA Charges-Annual Recurring(B)
                case 6002: // Self Care Portal Service Charges-Annual 
                case 6005: // Managed Services Charges-Annual Recurring(B)
                case 6008: // Managed CPE Charges-Annual Recurring(B)
                case 6011: // CPE Rentals-Annual Recurring(B)
                case 6015: // CPE 1-Annual Recurring(B)
                case 6019: // CPE 2-Annual Recurring(B)
                case 6023: // CPE 3-Annual Recurring(B)
                case 6027: // CPE 4-Annual Recurring(B)
                case 6031: // CPE 5-Annual Recurring(B)
                case 6035: // Miscellaneous Charges-1-Annual Recurring(B)
                case 6039: // Miscellaneous Charges2-Annual Recurring(B)
                case 7144: // Platform | Service Rental-Annual Recurring(B)
                case 7148: // Platform | IP Address Charges-Annual Recurring(B)
                case 7151: // Platform | SLA Charges-Annual Recurring(B)
                case 7154: // Platform | Self Care Portal Service Charges-Annual Recurring(B)
                case 7157: // Platform | Managed Services Charges-Annual Recurring(B)
                case 7160: // Platform | Managed CPE Charges-Annual Recurring(B)
                case 7163: // Platform | CPE Rentals-Annual Recurring(B)
                case 7167: // Platform | CPE 1-Annual Recurring(B)
                case 7171: // Platform | CPE 2-Annual Recurring(B)
                case 7175: // Platform | CPE 3-Annual Recurring(B)
                case 7179: // Platform | CPE 4-Annual Recurring(B)
                case 7183: // Platform | CPE 5-Annual Recurring(B)
                case 7187: // Platform | Miscellaneous Charges-1-Annual Recurring(B)
                case 7191: // Platform | Miscellaneous Charges2-Annual Recurring(B)
                    sumsKeyValueJson.totalAmountPayableTotal_B += Number(formEntry.field_value);
                    break;

                case 7145: // Service Rental-Security Deposit(C)
                case 7164: // CPE Rentals-Security Deposit(C)
                case 7168: // CPE 1-Security Deposit(C)
                case 7172: // CPE 2-Security Deposit(C)
                case 7176: // CPE 3-Security Deposit(C)
                case 7180: // CPE 4-Security Deposit(C)
                case 7184: // CPE 5-Security Deposit(C)
                case 7188: // Miscellaneous Charges-1-Security Deposit(C)
                    sumsKeyValueJson.totalAmountPayableTotal_C += Number(formEntry.field_value);
                    break;
            }
        });

        // 6096 | Total Amount Payable-Grand Total(A+B+C)
        // Platform | 7248 | Total Amount Payable-Grand Total(A+B+C)
        sumsKeyValueJson.totalAmountPayableGrandTotal = sumsKeyValueJson.totalAmountPayableTotal_A + sumsKeyValueJson.totalAmountPayableTotal_B + sumsKeyValueJson.totalAmountPayableTotal_C;

        return sumsKeyValueJson;
    }

    function applyTransform(request, cafFormData, sourceFormData, formId) {

        const NEW_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER,
            SUPPLEMENTARY_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY,
            FR_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.FR,
            CRM_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM,
            HLD_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.HLD,
            CAF_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CAF,
            CUSTOMER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL;


        let NEW_ORDER_TO_CAF_FIELD_ID_MAP,
            SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP,
            FR_TO_CAF_FIELD_ID_MAP,
            CRM_TO_CAF_FIELD_ID_MAP,
            HLD_TO_CAF_FIELD_ID_MAP,
            CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;

        /*if (Number(request.organization_id) === 860) {
            // BETA
            NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
            SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
            FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.FR_TO_CAF_FIELD_ID_MAP;
            CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.CRM_TO_CAF_FIELD_ID_MAP;
            HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.HLD_TO_CAF_FIELD_ID_MAP;
            CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;
            
        } else if (Number(request.organization_id) === 858) {
            // LIVE
            NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
            SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
            FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.FR_TO_CAF_FIELD_ID_MAP;
            CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.CRM_TO_CAF_FIELD_ID_MAP;
            HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.HLD_TO_CAF_FIELD_ID_MAP;
            CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;
        } */

        switch (Number(request.organization_id)) {
            case 860: // BETA
                NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
                SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
                FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.FR_TO_CAF_FIELD_ID_MAP;
                CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.CRM_TO_CAF_FIELD_ID_MAP;
                HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.HLD_TO_CAF_FIELD_ID_MAP;
                CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;
                break;
            case 858: // LIVE
                NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
                SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
                FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.FR_TO_CAF_FIELD_ID_MAP;
                CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.CRM_TO_CAF_FIELD_ID_MAP;
                HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.HLD_TO_CAF_FIELD_ID_MAP;
                CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;
                break;
            case 868:
                NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
                SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
                FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.FR_TO_CAF_FIELD_ID_MAP;
                CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.CRM_TO_CAF_FIELD_ID_MAP;
                HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.HLD_TO_CAF_FIELD_ID_MAP;
                CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;
                break;
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
                    });
                } else {
                    // Ignore the other entries
                }
            });
            // Return the populated CAF object
            return cafFormData;
        }

        // Supplementary Order Form
        if (formId === SUPPLEMENTARY_ORDER_FORM_ID) {
            // Exclude the following two fields from the Optional order forms:
            // 7422: Total Amount Payable-One Time(A) | 868 Org
            // 7424: Total Amount Payable-Annual Recurring(B) | 868 Org
            // To avoid duplicate entries in the generated CAF while populating ROMS.
            sourceFormData.forEach(formEntry => {
                if (
                    Object.keys(SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP).includes(String(formEntry.field_id)) &&
                    Number(formEntry.field_id) !== 6270 &&
                    Number(formEntry.field_id) !== 6272 &&
                    Number(formEntry.field_id) !== 7422 &&
                    Number(formEntry.field_id) !== 7424
                ) {
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
                    });
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
                    });
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
                    });
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
                    // Check for drop-downs
                    if (Number(formEntry.field_data_type_id) === 33) {
                        formEntry.field_value = formEntry.data_type_combo_value;
                    }
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
                    });
                } else {
                    // Ignore the other entries
                }
            });
            // Return the populated CAF object
            return cafFormData;
        }

        // Customer Management Approval
        if (formId === CUSTOMER_APPROVAL_FORM_ID) {
            // 
            sourceFormData.forEach(formEntry => {
                if (Object.keys(CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP).includes(String(formEntry.field_id))) {
                    // Push entries from the Supplementary Order Form, which have a defined CAF mapping
                    cafFormData.push({
                        "form_id": CAF_FORM_ID,
                        "field_id": CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP[String(formEntry.field_id)],
                        "field_name": formEntry.field_name,
                        "field_data_type_id": formEntry.field_data_type_id,
                        "field_data_type_category_id": formEntry.field_data_type_category_id,
                        "data_type_combo_id": formEntry.data_type_combo_id,
                        "data_type_combo_value": formEntry.data_type_combo_value,
                        "field_value": formEntry.field_value,
                        "message_unique_id": formEntry.message_unique_id
                    });
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
        /*if (Number(request.organization_id) === 860) {
            // BETA
            ROMS_CAF_FORM_LABELS = formFieldIdMapping.BETA.ROMS_LABELS;

        } else if (Number(request.organization_id) === 858) {
            // LIVE
            ROMS_CAF_FORM_LABELS = formFieldIdMapping.LIVE.ROMS_LABELS;
        } */

        switch (Number(request.organization_id)) {
            case 860:
                ROMS_CAF_FORM_LABELS = formFieldIdMapping.BETA.ROMS_LABELS;
                break;
            case 858:
                ROMS_CAF_FORM_LABELS = formFieldIdMapping.LIVE.ROMS_LABELS;
                break;
            case 868:
                ROMS_CAF_FORM_LABELS = formFieldIdMapping.PLATFORM.ROMS_LABELS;
                break;
        }

        Object.keys(ROMS_CAF_FORM_LABELS).forEach(formEntry => {
            cafFormData.push({
                "form_id": global.vodafoneConfig[request.organization_id].FORM_ID.CAF,
                "field_id": Number(formEntry),
                "field_name": ROMS_CAF_FORM_LABELS[formEntry],
                "field_data_type_id": 21,
                "field_data_type_category_id": 8,
                "data_type_combo_id": 0,
                "data_type_combo_value": "0",
                "field_value": ROMS_CAF_FORM_LABELS[formEntry],
                "message_unique_id": "127349187236941782639"
            });
        });
        return cafFormData;
    }

    this.setStatusApprovalPendingAndFireEmail = async function (request, callback) {

        const NEW_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER,
            ACCOUNT_MANAGER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.ACCOUNT_MANAGER_APPROVAL,
            CUSTOMER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL,
            CAF_BOT_ASSET_ID = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID,
            CAF_BOT_ENC_TOKEN = global.vodafoneConfig[request.organization_id].BOT.ENC_TOKEN,
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
                global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
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
                        // queueActivityMappingInlineData.queue_sort.current_status = ACTIVITY_STATUS_ID_APPROVAL_PENDING;
                        queueActivityMappingInlineData.queue_sort.current_status_id = ACTIVITY_STATUS_ID_APPROVAL_PENDING;
                        queueActivityMappingInlineData.queue_sort.current_status_name = "Customer Approval";
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
                        activityCommonService.queueHistoryInsert(request, 1402, omtQueueActivityMappingId).then(() => {});
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
                                                activity_type_id: global.vodafoneConfig[request.organization_id].ACTIVITY_TYPE_IDS[request.workforce_id],
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
                                            /*util.sendEmailV3({
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
                                                });*/
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
                                            activity_type_id: global.vodafoneConfig[request.organization_id].ACTIVITY_TYPE_IDS[request.workforce_id],
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
                                        /*util.sendEmailV3({
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
                                            });*/
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

    };

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
        const CAF_BOT_ASSET_ID = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;
        const CAF_BOT_ENC_TOKEN = global.vodafoneConfig[request.organization_id].BOT.ENC_TOKEN;
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
                    request.asset_id = CAF_BOT_ASSET_ID;
                    return activityCommonService.unmapFileFromQueue(request, queueActivityMappingId)
                })
                .then((data) => {
                    console.log("Form unassigned from queue: ", data);
                    request.asset_id = CAF_BOT_ASSET_ID;
                    activityCommonService.queueHistoryInsert(request, 1403, queueActivityMappingId).then(() => {});
                })
                .catch((error) => {
                    console.log("Error unassigning form from queue: ", error)
                });

            // Alter the status of the form file to Order Close
            // Form the request object
            var statusAlterRequest = Object.assign({}, request);
            statusAlterRequest.activity_status_id = ACTIVITY_STATUS_ID_ORDER_CLOSED;
            statusAlterRequest.asset_id = CAF_BOT_ASSET_ID;
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
                    global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                } else {
                    // 
                    console.log("Form status changed to validation pending");
                }
            });
        }

        return callback(false, {
            isApprovalDone
        })
    };

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

    function getSpecifiedForm(request, formId) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array();
            var queryString = '';

            paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                formId,
                '1970-01-01 00:00:00',
                0,
                500
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
        let prevFieldId = 0;
        data.forEach(function (rowData, index) {

            var rowDataArr = {
                "form_id": util.replaceDefaultNumber(rowData['form_id']),
                "form_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['form_name'])),
                "field_id": util.replaceDefaultNumber(rowData['field_id']),
                "field_description": util.replaceDefaultString(util.decodeSpecialChars(rowData['field_description'])),
                "field_name": util.replaceDefaultString(util.decodeSpecialChars(rowData['field_name'])),
                "field_data_type_id": util.replaceDefaultNumber(rowData['data_type_id']),
                "field_data_type_category_id": util.replaceDefaultNumber(rowData['data_type_category_id']),
                "data_type_category_name": util.replaceDefaultString(rowData['data_type_category_name']),
                "data_type_combo_id": util.replaceDefaultNumber(rowData['data_type_combo_id']),
                "data_type_combo_value": util.replaceDefaultString(rowData['data_type_combo_value'])
            };

            if (Number(prevFieldId) !== Number(rowData['field_id'])) {
                responseData.push(rowDataArr);
            }
            // Keep track of the previous field_id, to avoid duplicates
            prevFieldId = Number(rowData['field_id']);

        }, this);
        callback(false, responseData);
    };

    this.regenerateAndSubmitCAF = async function (request, callback) {

        // Store the incoming form's field_id which is being edited
        const incomingFormFieldId = Number(request.field_id);
        // Without the following line, the getActivityTimelineTransactionByFormId method,
        // is dependant on the 'field_id', and will fail the proceeding logic
        delete request["field_id"];

        const CAF_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CAF,
            NEW_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER,
            SUPPLEMENTARY_ORDER_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY,
            CRM_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CRM,
            FR_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.FR,
            HLD_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.HLD,
            CUSTOMER_APPROVAL_FORM_ID = global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL;

        let NEW_ORDER_TO_CAF_FIELD_ID_MAP,
            SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP,
            FR_TO_CAF_FIELD_ID_MAP,
            CRM_TO_CAF_FIELD_ID_MAP,
            HLD_TO_CAF_FIELD_ID_MAP,
            CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;

        /*if (Number(request.organization_id) === 860) {
            // BETA
            NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
            SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
            FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.FR_TO_CAF_FIELD_ID_MAP;
            CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.CRM_TO_CAF_FIELD_ID_MAP;
            HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.HLD_TO_CAF_FIELD_ID_MAP;
            CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;

        } else if (Number(request.organization_id) === 858) {
            // LIVE
            NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
            SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
            FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.FR_TO_CAF_FIELD_ID_MAP;
            CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.CRM_TO_CAF_FIELD_ID_MAP;
            HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.HLD_TO_CAF_FIELD_ID_MAP;
            CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;
        }*/

        switch (Number(request.organization_id)) {
            case 860:
                NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
                SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
                FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.FR_TO_CAF_FIELD_ID_MAP;
                CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.CRM_TO_CAF_FIELD_ID_MAP;
                HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.HLD_TO_CAF_FIELD_ID_MAP;
                CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.BETA.CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;
                break;

            case 858:
                NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
                SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
                FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.FR_TO_CAF_FIELD_ID_MAP;
                CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.CRM_TO_CAF_FIELD_ID_MAP;
                HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.HLD_TO_CAF_FIELD_ID_MAP;
                CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.LIVE.CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;
                break;

            case 868:
                NEW_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.NEW_ORDER_TO_CAF_FIELD_ID_MAP;
                SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
                FR_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.FR_TO_CAF_FIELD_ID_MAP;
                CRM_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.CRM_TO_CAF_FIELD_ID_MAP;
                HLD_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.HLD_TO_CAF_FIELD_ID_MAP;
                CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP = formFieldIdMapping.PLATFORM.CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;
                break;
        }

        let incomingFormToCafFormMapping = {};
        incomingFormToCafFormMapping[NEW_ORDER_FORM_ID] = NEW_ORDER_TO_CAF_FIELD_ID_MAP;
        incomingFormToCafFormMapping[SUPPLEMENTARY_ORDER_FORM_ID] = SUPPLEMENTARY_ORDER_TO_CAF_FIELD_ID_MAP;
        incomingFormToCafFormMapping[FR_FORM_ID] = FR_TO_CAF_FIELD_ID_MAP;
        incomingFormToCafFormMapping[CRM_FORM_ID] = CRM_TO_CAF_FIELD_ID_MAP;
        incomingFormToCafFormMapping[HLD_FORM_ID] = HLD_TO_CAF_FIELD_ID_MAP;
        incomingFormToCafFormMapping[CUSTOMER_APPROVAL_FORM_ID] = CUSTOMER_APPROVAL_TO_CAF_FIELD_ID_MAP;


        let newOrderFormActivityId = 0,
            newOrderFormTransactionId = 0,
            cafFormActivityId = 0,
            cafFormTransactionId = 0,
            cafFormTargetFieldId = 0,
            cafActivityInlineData = {},
            cafActivityTimelineCollectionData = {},
            cafFormData = [],
            updatedRomsFields = [],
            newActivityInlineData = [];

        await fetchReferredFormActivityId(request, request.activity_id, request.form_transaction_id, request.form_id)
            .then((data) => {
                if (data.length > 0 || Number(request.form_id) === Number(NEW_ORDER_FORM_ID)) {

                    // if (Number(request.form_id) === Number(NEW_ORDER_FORM_ID)) {
                    //     newOrderFormActivityId = Number(request.activity_id);

                    // } else {
                    //     newOrderFormActivityId = Number(data[0].activity_id);

                    // }
                    // Even if it reads new order 
                    newOrderFormActivityId = Number(data[0].activity_id);

                    // Fetch form_transaction_id of the new order form
                    return activityCommonService
                        .getActivityTimelineTransactionByFormId(request, newOrderFormActivityId, NEW_ORDER_FORM_ID)

                } else {
                    throw new Error("newOrderReferenceNotFound");
                }
            })
            .then((newOrderFormData) => {
                if (newOrderFormData.length > 0) {
                    newOrderFormTransactionId = Number(newOrderFormData[0].data_form_transaction_id);

                    // Fetch CAF form transaction details
                    let newRequest = Object.assign({}, request);
                    delete newRequest["field_id"];

                    return activityCommonService
                        .getActivityTimelineTransactionByFormId713(newRequest, newOrderFormActivityId, CAF_FORM_ID)

                } else {
                    throw new Error("newOrderFormTransactionNotFound");
                }
            })
            .then((cafFormData) => {
                if (cafFormData.length > 0) {
                    cafFormTransactionId = cafFormData[0].data_form_transaction_id;
                    cafActivityTimelineCollectionData = JSON.parse(cafFormData[0].data_entity_inline);

                    // Fetch CAF form (dedicated) details
                    return getActivityIdBasedOnTransactionId(request, cafFormTransactionId)

                } else {
                    throw new Error("cafFormTransactionDataNotFound");
                }
            })
            .then((cafFormTransactionData) => {
                if (cafFormTransactionData.length > 0) {
                    cafFormActivityId = cafFormTransactionData[0].activity_id;
                    cafActivityInlineData = JSON.parse(cafFormTransactionData[0].activity_inline_data);

                    // Check if mapping exists for the field_id of the form
                    // being edited with a field_id in CAF
                    // console.log("Object.keys(incomingFormToCafFormMapping[request.form_id]): ", Object.keys(incomingFormToCafFormMapping[request.form_id]))
                    if (Object.keys(incomingFormToCafFormMapping[request.form_id]).includes(String(incomingFormFieldId))) {
                        return Promise.resolve(true);
                    } else {
                        return Promise.resolve(false);
                    }

                } else {
                    throw new Error("cafFormDataNotFound");
                }
            })
            .then(async (mappingExists) => {

                if (mappingExists) {
                    console.log("mappingExists: ", mappingExists)

                    cafFormTargetFieldId = incomingFormToCafFormMapping[request.form_id][incomingFormFieldId];

                    newActivityInlineData = JSON.parse(request.activity_inline_data);
                    newActivityInlineData[0].form_name = "Digital CAF";
                    newActivityInlineData[0].field_id = cafFormTargetFieldId;
                    newActivityInlineData[0].form_transaction_id = cafFormTransactionId;

                    console.log("newActivityInlineData: ", newActivityInlineData);
                    let newRequest = Object.assign({}, request);
                    newRequest.activity_id = newOrderFormActivityId;
                    newActivityInlineData = await setAsPerCAFAnnexure(newRequest, newActivityInlineData);
                    console.log("newActivityInlineData: ", newActivityInlineData);

                    // Fire the 'alterFormActivity' service | '/form/activity/alter' for CAF file
                    let cafFieldUpdateRequest = Object.assign({}, request);
                    let cafFieldUpdateEvent = {
                        name: "alterFormActivity",
                        service: "formConfigService",
                        method: "alterFormActivity",
                        payload: cafFieldUpdateRequest
                    };
                    cafFieldUpdateRequest.asset_id = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;
                    cafFieldUpdateRequest.activity_id = cafFormActivityId;
                    cafFieldUpdateRequest.form_id = CAF_FORM_ID;
                    cafFieldUpdateRequest.form_transaction_id = cafFormTransactionId;
                    cafFieldUpdateRequest.field_id = cafFormTargetFieldId;
                    cafFieldUpdateRequest.activity_inline_data = JSON.stringify(newActivityInlineData);
                    cafFieldUpdateRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                    cafFieldUpdateRequest.device_os_id = 7;

                    queueWrapper.raiseActivityEvent(cafFieldUpdateEvent, cafFieldUpdateRequest.activity_id, (err, resp) => {
                        if (err) {
                            global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                            global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                        } else {
                            global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                            global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                        }
                    });

                    return Promise.resolve(true);

                } else {
                    throw new Error("noCafMappingExistsForIncomingFormFieldId");
                }
            })
            .then((alterFormActivitySuccess) => {
                if (alterFormActivitySuccess) {
                    console.log("[Success] alterFormActivity: ", alterFormActivitySuccess)

                    if (Array.isArray(cafActivityTimelineCollectionData.form_submitted) === true || typeof cafActivityTimelineCollectionData.form_submitted === 'object') {
                        cafFormData = cafActivityTimelineCollectionData.form_submitted;
                    } else {
                        cafFormData = JSON.parse(cafActivityTimelineCollectionData.form_submitted);
                    }
                    console.log();

                    // Update the CAF Data
                    let oldCafFieldValue, newCafFieldValue;
                    cafFormData.forEach((formEntry, index) => {
                        if (Number(formEntry.field_id) === Number(cafFormTargetFieldId)) {
                            oldCafFieldValue = cafFormData[index].field_value;
                            newCafFieldValue = JSON.parse(request.activity_inline_data)[0].field_value;
                            cafFormData[index].field_value = JSON.parse(request.activity_inline_data)[0].field_value;
                        }
                    });

                    // Sum all relevant fields and store them
                    const calculatedValuesJSON = calculateAllSums(cafFormData);
                    console.log("[regenerateAndSubmitCAF] calculatedValuesJSON: ", calculatedValuesJSON);

                    // Get the updated the CAF form Json and the specific derived ROMS field which was updated 
                    [cafFormData, updatedRomsFields] = populateRomsCafFieldValues(cafFormData, calculatedValuesJSON);

                    console.log("[regenerateAndSubmitCAF] cafFormData: ", cafFormData[155]);
                    console.log("[regenerateAndSubmitCAF] updatedRomsFields: ", updatedRomsFields);

                    // Update the form data in the timeline collection 
                    cafActivityTimelineCollectionData.form_submitted = cafFormData;
                    cafActivityTimelineCollectionData.subject = "Field Updated for Digital CAF";
                    cafActivityTimelineCollectionData.content = `In the Digital CAF, the field ${newActivityInlineData[0].field_name} was updated from ${oldCafFieldValue} to ${newCafFieldValue}`;

                    console.log("[regenerateAndSubmitCAF] oldCafFieldValue  : ", oldCafFieldValue);
                    if (String(oldCafFieldValue).trim().length === 0) {
                        cafActivityTimelineCollectionData.content = `In the Digital CAF, the field ${newActivityInlineData[0].field_name} was updated to ${newCafFieldValue}`;
                    }

                    // console.log("[regenerateAndSubmitCAF] cafActivityTimelineCollectionData.form_submitted: ", cafActivityTimelineCollectionData.form_submitted[155]);

                    // [WORKFLOW FILE] Insert 713 record with the updated JSON data in activity_timeline_transaction 
                    // and asset_timeline_transaction
                    let activityTypeCategoryId = (Number(request.organization_id) === 860) ? 9 : 48;
                    // console.log("[regenerateAndSubmitCAF] activityTypeCategoryId: ", activityTypeCategoryId)
                    let fire705OnNewOrderFileRequest = Object.assign({}, request);
                    fire705OnNewOrderFileRequest.activity_id = Number(newOrderFormActivityId);
                    // The 'form_transaction_id' parameter is intentionally being set to an incorrect value
                    fire705OnNewOrderFileRequest.data_activity_id = Number(cafFormActivityId);
                    fire705OnNewOrderFileRequest.form_transaction_id = Number(cafFormTransactionId);
                    fire705OnNewOrderFileRequest.activity_timeline_collection = JSON.stringify(cafActivityTimelineCollectionData);
                    // Append the incremental form data as well
                    // fire705OnNewOrderFileRequest.incremental_form_data = incrementalCafFormData;
                    fire705OnNewOrderFileRequest.activity_type_category_id = 48;
                    fire705OnNewOrderFileRequest.activity_stream_type_id = 713;
                    fire705OnNewOrderFileRequest.form_id = Number(CAF_FORM_ID);
                    fire705OnNewOrderFileRequest.asset_message_counter = 0;
                    fire705OnNewOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
                    fire705OnNewOrderFileRequest.activity_timeline_text = '';
                    fire705OnNewOrderFileRequest.activity_timeline_url = '';
                    fire705OnNewOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                    fire705OnNewOrderFileRequest.flag_timeline_entry = 1;
                    fire705OnNewOrderFileRequest.service_version = '1.0';
                    fire705OnNewOrderFileRequest.app_version = '2.8.16';
                    fire705OnNewOrderFileRequest.device_os_id = 7;

                    // console.log("Number(CAF_FORM_ID): ", Number(CAF_FORM_ID))
                    // console.log("[regenerateAndSubmitCAF] fire705OnNewOrderFileRequest: ", fire705OnNewOrderFileRequest);

                    let fire705OnNewOrderFileEvent = {
                        name: "addTimelineTransaction",
                        service: "activityTimelineService",
                        method: "addTimelineTransaction",
                        location: "123123123123123123123",
                        payload: fire705OnNewOrderFileRequest
                    };

                    queueWrapper.raiseActivityEvent(fire705OnNewOrderFileEvent, request.activity_id, (err, resp) => {
                        if (err) {
                            global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                            global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                        } else {
                            global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                            global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                        }
                    });

                    // Fire the 'alterFormActivity' service | '/form/activity/alter' for the derived ROMS fields in the 
                    // CAF file
                    console.log("[regenerateAndSubmitCAF] updatedRomsFields: ", updatedRomsFields);
                    if (updatedRomsFields.length > 0) {
                        let waitTime = 1;
                        for (const derivedField of updatedRomsFields) {
                            setTimeout(() => {
                                derivedField.form_name = "Digital CAF";
                                let activityInlineDataObject = [];
                                activityInlineDataObject.push(derivedField)

                                let cafFieldUpdateRequest = Object.assign({}, request);
                                let cafFieldUpdateEvent = {
                                    name: "alterFormActivity",
                                    service: "formConfigService",
                                    method: "alterFormActivity",
                                    location: "derivedRomsFieldUpdate",
                                    payload: cafFieldUpdateRequest
                                };
                                cafFieldUpdateRequest.asset_id = global.vodafoneConfig[request.organization_id].BOT.ASSET_ID;
                                cafFieldUpdateRequest.activity_id = cafFormActivityId;
                                cafFieldUpdateRequest.form_id = CAF_FORM_ID;
                                cafFieldUpdateRequest.form_transaction_id = cafFormTransactionId;
                                cafFieldUpdateRequest.field_id = Number(derivedField.field_id);
                                cafFieldUpdateRequest.activity_inline_data = JSON.stringify(activityInlineDataObject);
                                cafFieldUpdateRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                                cafFieldUpdateRequest.device_os_id = 7;

                                console.log("[regenerateAndSubmitCAF] cafFieldUpdateRequest: ", cafFieldUpdateRequest)

                                queueWrapper.raiseActivityEvent(cafFieldUpdateEvent, cafFormActivityId, (err, resp) => {
                                    if (err) {
                                        global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                        global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                                    } else {
                                        global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                                        global.logger.write('conLog', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                                    }
                                });
                            }, waitTime * 2000);

                            waitTime += 2;
                        }
                    }

                } else {
                    console.log("[Failure] alterFormActivity: ", alterFormActivitySuccess);
                }


                //713 Entry onto the Workflow File
                /*let fire713OnWFFileRequest = Object.assign({}, request);
                    fire713OnWFFileRequest.activity_id = Number(newOrderFormActivityId); //newOrderFormActivityId is workflow activity id
                    fire713OnWFFileRequest.data_activity_id = Number(cafFormActivityId);
                    fire713OnWFFileRequest.form_transaction_id = Number(cafFormTransactionId);
                    fire713OnWFFileRequest.activity_timeline_collection = JSON.stringify(cafActivityTimelineCollectionData);                    
                    fire713OnWFFileRequest.activity_type_category_id = 9;
                    fire713OnWFFileRequest.activity_stream_type_id = 713;
                    fire713OnWFFileRequest.form_id = Number(CAF_FORM_ID);
                    fire713OnWFFileRequest.asset_message_counter = 0;
                    fire713OnWFFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
                    fire713OnWFFileRequest.activity_timeline_text = '';
                    fire713OnWFFileRequest.activity_timeline_url = '';
                    fire713OnWFFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                    fire713OnWFFileRequest.flag_timeline_entry = 1;
                    fire713OnWFFileRequest.service_version = '1.0';
                    fire713OnWFFileRequest.app_version = '2.8.16';
                    fire713OnWFFileRequest.device_os_id = 7;                    

                    let fire713OnWFFileRequestEvent = {
                        name: "addTimelineTransaction",
                        service: "activityTimelineService",
                        method: "addTimelineTransaction",
                        location: "456456456456456456456",
                        payload: fire713OnWFFileRequestEvent
                    };

                    queueWrapper.raiseActivityEvent(fire713OnWFFileRequestEvent, request.activity_id, (err, resp) => {
                        if (err) {
                            global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                            global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                        } else {
                            global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                            global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
                        }
                    });*/

            })
            .catch((error) => {
                console.log("[regenerateAndSubmitCAF] Promise Chain Error: ", error);
                callback(true, false);
                return;
            });

        callback(false, {
            newOrderFormActivityId,
            newOrderFormTransactionId,
            cafFormActivityId,
            cafFormTransactionId,
            cafFormData
        });
        return;
    };

    // [Vodafone] This is written to fetch the activity_id of the new order form 
    // given that the activity_id and form_transaction_id of a particular form
    // (such as, FR, CRM, HLD, etc.) is known.
    // 
    function fetchReferredFormActivityId(request, activityId, formTransactionId, formId) {
        return new Promise((resolve, reject) => {
            // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
            // IN p_activity_id BIGINT(20), IN p_form_id BIGINT(20), 
            // IN p_form_transaction_id BIGINT(20), IN p_start_from SMALLINT(6), 
            // IN p_limit_value smallint(6)
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
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err) ? reject(err): resolve(data);
                })
            }
        })
    }

    this.buildAndSubmitCafFormV1 = async function (request) {

        await sleep(2000);
        
        let workflowActivityData = [],
            formWorkflowActivityTypeId = 0;
        
        // Begin with the basic checks
        if (request.hasOwnProperty("workflow_activity_id")) {
            try {
                workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);
                if (workflowActivityData.length > 0) {
                    formWorkflowActivityTypeId = workflowActivityData[0].activity_type_id;
                }
            } catch (error) {
                console.log("buildAndSubmitCafFormV1 | getActivityDetailsPromise | Error: ", error)
                return [error, false];
            }
        } else {
            console.log("buildAndSubmitCafFormV1 | Error | workflow_activity_id NOT FOUND.")
            return [new Error("workflow_activity_id not found in the request."), false];
        }

        const TARGET_FORM_ID = global.vodafoneConfig[formWorkflowActivityTypeId].TARGET_FORM_ID;
        // Check if the target form generation request is from the target form generated (from this 
        // function: buildAndSubmitCafFormV1), itself. If yes, terminate the processing.
        if (Number(TARGET_FORM_ID) === Number(request.form_id) ||
            !(request.hasOwnProperty("non_dedicated_file") && Number(request.non_dedicated_file) === 1)
        ) {
            console.log("buildAndSubmitCafFormV1 | DuplicateTargetFormGenerationRequestFromGeneratedTargetForm")
            return [new Error("DuplicateTargetFormGenerationRequestFromGeneratedTargetForm"), []];
        }

        let targetFormExists = false;
        // Check if the target form is already submitted, if yes, move control to regenerateAndSubmitTargetForm
        await activityCommonService
            .getActivityTimelineTransactionByFormId713(request, request.workflow_activity_id, TARGET_FORM_ID)
            .then((formData) => {
                console.log("formData.length: ", formData.length);
                console.log("formData: ", formData.length)
                console.log("formData.length > 0: ", formData.length > 0);
                if (formData.length > 0) {
                    targetFormExists = true;
                }
            })
            .catch((error) => {
                return [error, false];
            });

        console.log("TargetFormExists", targetFormExists);
        if (targetFormExists &&
            request.hasOwnProperty("non_dedicated_file") &&
            Number(request.non_dedicated_file) === 1
        ) {
            request.form_id = Number(request.form_id || request.activity_form_id);
            console.log("TargetFormExists", targetFormExists);
            await self.regenerateAndSubmitTargetForm(request);
            return [new Error("TargetFormExists"), []];
        } else {
            console.log("TargetFormDoesNotExist", targetFormExists);
        }

        const requiredForms = global.vodafoneConfig[formWorkflowActivityTypeId].REQUIRED_FORMS;
        console.log("buildAndSubmitCafFormV1 | requiredForms: ", requiredForms);
        if (!requiredForms.includes(Number(request.form_id))) {
            return [new Error("[MISSION ABORT] Call to build the target forms is not from one of the required forms."), []];
        }
        
        // Check whether all the mandatory forms have been submitted or not
        let requiredFormsCheck = [];
        for (let i = 0; i < requiredForms.length; i++) {
            requiredFormsCheck.push(
                activityCommonService
                .getActivityTimelineTransactionByFormId713(request, request.workflow_activity_id, requiredForms[i])
            );
        }

        let allFormsExist = false;
        await Promise.all(requiredFormsCheck)
            .then((formEntries) => {
                // console.log("Promise.all | formEntries: ", formEntries);
                if (formEntries.length > 0) {
                    allFormsExist = formEntries.every((e) => {
                        return e.length > 0;
                    });
                } else {
                    throw new Error("ErrorCheckingProcessFormEntries");
                }
            })
            .catch((error) => {
                console.log("Promise.all | error: ", error);
            });
        console.log("allFormsExist: ", allFormsExist);

        // Do NOT PROCEED further, if all the required forms do not exist
        if (!allFormsExist) {
            return [new Error("allFormsExist is false, all requried forms have not been submitted."), []];
        }
        
        // If all the mandatory forms exist, proceed with the buildign the form
        // Fetch relevant source and target form field mappings
        const FORM_FIELD_MAPPING_DATA = global.vodafoneConfig[formWorkflowActivityTypeId].FORM_FIELD_MAPPING_DATA;
        
        // Source form IDs
        const sourceFormIDs = Object.keys(FORM_FIELD_MAPPING_DATA);
        console.log("sourceFormIDs: ", sourceFormIDs);

        // Fetch all source forms' latest entries for the process
        let targetFormData = [];
        
        const TARGET_FORM_ACTIVITY_TYPE_ID = global.vodafoneConfig[formWorkflowActivityTypeId].TARGET_FORM_ACTIVITY_TYPE_ID;

        for (const sourceFormID of sourceFormIDs) {
            let formExists = false;
            let sourceFormData = [];
            await activityCommonService
                .getActivityTimelineTransactionByFormId713(request, request.workflow_activity_id, sourceFormID)
                .then((formData) => {
                    if (formData.length > 0) {
                        let formDataCollection = JSON.parse(formData[0].data_entity_inline);
                        if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
                            sourceFormData = formDataCollection.form_submitted;
                        } else {
                            sourceFormData = JSON.parse(formDataCollection.form_submitted);
                        }
                        formExists = true;
                        console.log("formData[0].data_form_id: ", formData[0].data_form_id);
                        // console.log("sourceFormData: ", sourceFormData);
                    }
                })
            
            if (formExists && sourceFormData.length > 0) {
                console.log("*****formExists*****");
                const SOURCE_FORM_FIELD_MAP = FORM_FIELD_MAPPING_DATA[sourceFormID];
                for (const fieldEntry of sourceFormData) {

                    if (Object.keys(SOURCE_FORM_FIELD_MAP).includes(String(fieldEntry.field_id))) {
                        targetFormData.push({
                            "form_id": TARGET_FORM_ID,
                            "field_id": SOURCE_FORM_FIELD_MAP[fieldEntry.field_id],
                            "field_name": fieldEntry.field_name,
                            "field_data_type_id": fieldEntry.field_data_type_id,
                            "field_data_type_category_id": fieldEntry.field_data_type_category_id,
                            "data_type_combo_id": fieldEntry.data_type_combo_id,
                            "data_type_combo_value": fieldEntry.data_type_combo_value,
                            "field_value": fieldEntry.field_value,
                            "message_unique_id": fieldEntry.message_unique_id
                        });    
                    } else {
                        // Ignore all other entries
                    }
                }
            }
        }

        // Append Labels
        const LABELS = global.vodafoneConfig[formWorkflowActivityTypeId].LABELS;
        targetFormData = targetFormData.concat(LABELS);

        // Append default ROMS entries
        const ROMS =  global.vodafoneConfig[formWorkflowActivityTypeId].ROMS;
        targetFormData = targetFormData.concat(ROMS);

        // Magic
        const ROMS_ACTIONS = global.vodafoneConfig[formWorkflowActivityTypeId].ROMS_ACTIONS;
        const {TARGET_FORM_DATA, UPDATED_ROMS_FIELDS} = await performRomsCalculations(request, targetFormData, ROMS_ACTIONS);
        targetFormData = TARGET_FORM_DATA;

        // Fetch the target form's field sequence data
        let fieldSequenceIdMap = {};
        let targetFormName = '';
        await activityCommonService
            .getFormFieldMappings(request, TARGET_FORM_ID, 0, 500)
            .then((data) => {
                if (data.length > 0) {

                    data.forEach(formMappingEntry => {
                        fieldSequenceIdMap[formMappingEntry.field_id] = Number(formMappingEntry.field_sequence_id);
                    });

                    // Get the target form's name as well
                    targetFormName = data[0].form_name;
                }
            });

        // S O R T Target Form entries based on the 
        // field_id:field_seq_id data feteched above
        targetFormData.sort((a, b) => {
            let keyA = Number(fieldSequenceIdMap[a.field_id]),
                keyB = Number(fieldSequenceIdMap[b.field_id]);
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });

        // const fs = require("fs");
        // fs.writeFileSync('/Users/Bensooraj/Desktop/desker_api/server/vodafone/utils/data.json', JSON.stringify(targetFormData, null, 2) , 'utf-8');

        // return [false, {
        //     formWorkflowActivityTypeId,
        //     requiredForms
        // }];

        // Build the full and final CAF Form and submit the form data to the timeline of the form file
        const targetFormSubmissionRequest = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            asset_message_counter: 0,
            activity_title: targetFormName || "Digital CAF/CRF",
            activity_description: "",
            activity_inline_data: JSON.stringify(targetFormData),
            activity_datetime_start: util.getCurrentUTCTime(),
            activity_datetime_end: util.getCurrentUTCTime(),
            activity_type_category_id: 9,
            activity_sub_type_id: 0,
            activity_type_id: TARGET_FORM_ACTIVITY_TYPE_ID,
            activity_access_role_id: 21,
            asset_participant_access_id: 21,
            activity_parent_id: 0,
            flag_pin: 0,
            flag_priority: 0,
            activity_flag_file_enabled: -1,
            activity_form_id: TARGET_FORM_ID,
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(31993),
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
            device_os_id: 5,
            workflow_activity_id: Number(request.workflow_activity_id)
        };

        const makeRequestOptions = {
            form: targetFormSubmissionRequest
        };

        // 
        let targetFormActivityId = 0,
            targetFormTransactionId = 0;
        
        const addActivityAsync = nodeUtil.promisify(makeRequest.post);
        try {
            const response = await addActivityAsync(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', makeRequestOptions);
            // console.log("addActivityAsync | response: ", Object.keys(response));
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                targetFormActivityId = body.response.activity_id;
                targetFormTransactionId = body.response.form_transaction_id;
            }
        } catch (error) {
            console.log("addActivityAsync | Error: ", error);
        }
        // If an activity_id is returned, make an entry to the process's timeline
        if (Number(targetFormActivityId) !== 0 && Number(targetFormActivityId) !== 0) {
            console.log("targetFormActivityId: ", targetFormActivityId);
            console.log("targetFormTransactionId: ", targetFormTransactionId);

            let workflowFile713Request = Object.assign({}, targetFormSubmissionRequest);
            workflowFile713Request.activity_id = Number(request.workflow_activity_id);
            workflowFile713Request.data_activity_id = Number(targetFormActivityId);
            workflowFile713Request.form_transaction_id = Number(targetFormTransactionId);
            workflowFile713Request.activity_timeline_collection = JSON.stringify({
                "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                "subject": `${targetFormName} Form Submitted` || "Digital CAF/CRF Form Submitted",
                "content": 'Form Submitted',
                "asset_reference": [],
                "activity_reference": [],
                "form_approval_field_reference": [],
                "form_submitted": targetFormData,
                "attachments": []
            });
            // Append the incremental form data as well
            workflowFile713Request.form_id = TARGET_FORM_ID;
            workflowFile713Request.activity_type_category_id = 48;
            workflowFile713Request.activity_stream_type_id = 705;
            workflowFile713Request.flag_timeline_entry = 1;
            workflowFile713Request.message_unique_id = util.getMessageUniqueId(request.asset_id);
            workflowFile713Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            workflowFile713Request.device_os_id = 8;

            // const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
            try {
                // await addTimelineTransactionAsync(workflowFile713Request);
                let workflowFile713RequestEvent = {
                    name: "addTimelineTransaction",
                    service: "activityTimelineService",
                    method: "addTimelineTransaction",
                    payload: workflowFile713Request
                };

                queueWrapper.raiseActivityEvent(workflowFile713RequestEvent, workflowFile713Request.activity_id, (err, resp) => {
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

        return [false, {
            formWorkflowActivityTypeId,
            requiredForms
        }];
    }

    // performRomsCalculations
    async function performRomsCalculations(request, targetFormData, ROMS_ACTIONS) {
        // Convert targetFormData to an ES6 Map
        let targetFormDataMap = new Map();
        for (const field of targetFormData) {
            targetFormDataMap.set(Number(field.field_id), field);
        }

        // To keep track updated ROMS fields
        let updatedRomsFields = [];
        
        for (const action of ROMS_ACTIONS) {
            // sum
            if (action.ACTION === "sum") {
                // Iterate through each batch entry
                for (const batch of action.BATCH) {
                    // Iterate through each source field id 
                    // and accumulate the sum
                    let sum = 0;
                    for (const sourceFieldID of batch.SOURCE_FIELD_IDS) {
                        if (targetFormDataMap.has(Number(sourceFieldID))) {
                            if (isNaN(Number(targetFormDataMap.get(sourceFieldID).field_value))) {
                                continue;
                            }
                            sum += Number(targetFormDataMap.get(sourceFieldID).field_value);
                        }
                    }
                    // Update the value of the target field ID
                    let targetFieldID = batch.TARGET_FIELD_ID;
                    if (targetFormDataMap.has(Number(targetFieldID))) {
                        // Get the entire object
                        let targetFieldEntry = targetFormDataMap.get(Number(targetFieldID));
                        // Set the value
                        let oldValue = Number(targetFieldEntry.field_value);
                        targetFieldEntry.field_value = sum;
                        if (oldValue !== sum) {
                            updatedRomsFields.push(targetFieldEntry);
                        }
                        // Set the updated object as value for the target field ID
                        targetFormDataMap.set(Number(targetFieldID), targetFieldEntry);
                        console.log("sum: ", sum);
                    }
                }
            }

            // set_static_value
            if (action.ACTION === "set_static_value") {
                for (const batch of action.BATCH) {
                    // Update the value of the target field ID
                    let targetFieldID = batch.TARGET_FIELD_ID;
                    if (targetFormDataMap.has(Number(targetFieldID))) {
                        // Get the entire object
                        let targetFieldEntry = targetFormDataMap.get(Number(targetFieldID));
                        // Set the value
                        targetFieldEntry.field_value = batch.VALUE;
                        // Set the updated object as value for the target field ID
                        targetFormDataMap.set(Number(targetFieldID), targetFieldEntry);
                    }
                }
            }

            // set_date
            if (action.ACTION === "set_date") {
                for (const batch of action.BATCH) {
                    // Update the value of the target field ID
                    let targetFieldID = batch.TARGET_FIELD_ID;
                    if (targetFormDataMap.has(Number(targetFieldID))) {
                        // Get the entire object
                        let targetFieldEntry = targetFormDataMap.get(Number(targetFieldID));
                        // Set the value
                        targetFieldEntry.field_value = moment().utcOffset(String(batch.TZ_OFFSET)).format('YYYY-MM-DD HH:mm:ss');
                        // Set the updated object as value for the target field ID
                        targetFormDataMap.set(Number(targetFieldID), targetFieldEntry);
                    }
                }
            }

            // set_participant_name
            if (action.ACTION === "set_participant_name") {
                const newRequest = Object.assign({}, request);
                newRequest.activity_id = request.workflow_activity_id;

                let workflowParticipantsData = [];
                // Fetch participants data
                await activityCommonService
                    .getAllParticipantsPromise(newRequest)
                    .then((participantData) => {
                        if (participantData.length > 0) {
                            workflowParticipantsData = participantData;
                            // console.log("participantData: ", participantData)
                        }
                    });

                if (workflowParticipantsData.length > 0) {
                    for (const batch of action.BATCH) {
                        // Update the value of the target field ID
                        let targetFieldID = batch.TARGET_FIELD_ID;
                        for (const participant of workflowParticipantsData) {
                            if (Number(participant.asset_type_id) === batch.ASSET_TYPE_ID) {
                                // Get the entire object
                                let targetFieldEntry = targetFormDataMap.get(Number(targetFieldID));
                                // Set the value
                                let oldValue = Number(targetFieldEntry.field_value);
                                targetFieldEntry.field_value = participant.operating_asset_first_name;
                                if (oldValue !== participant.operating_asset_first_name) {
                                    updatedRomsFields.push(targetFieldEntry);
                                }
                                // Set the updated object as value for the target field ID
                                targetFormDataMap.set(Number(targetFieldID), targetFieldEntry);
                                console.log("participant.operating_asset_first_name: ", participant.operating_asset_first_name);
                            }
                        }
                    }

                }
            }

            // check_and_set_annexure_defaults
            if (action.ACTION === "check_and_set_annexure_defaults") {
                for (const batch of action.BATCH) {
                    const sourceFormID = Number(batch.SOURCE_FORM_ID);
                    const sourceFormFieldID = Number(batch.SOURCE_FIELD_ID);
                    let sourceFormActivityID = 0,
                        sourceFormTransactionID = 0,
                        isAnnexureUploaded = false;
                    // Check if the excel file has been uploaded or not
                    await activityCommonService
                        .getActivityTimelineTransactionByFormId713(request, request.workflow_activity_id, sourceFormID)
                        .then((formData) => {
                            if (formData.length > 0) {
                                sourceFormActivityID = formData[0].data_activity_id;
                                sourceFormTransactionID = formData[0].data_form_transaction_id;
                            }
                        });
                    
                    // Fetch the specific field (Excel Document) using the form transaction ID
                    if (Number(sourceFormTransactionID) !== 0) {
                        fieldValue = await getFieldValue({
                            form_transaction_id: sourceFormTransactionID,
                            form_id: sourceFormID,
                            field_id: sourceFormFieldID,
                            organization_id: request.organization_id
                        });
                        if (fieldValue.length > 0 && fieldValue[0].data_entity_text_1 !== '') {
                            isAnnexureUploaded = true;
                        }
                    }
                    // isAnnexureUploaded = true;
                    if (isAnnexureUploaded) {
                        for (const targetFieldID of batch.TARGET_FIELD_IDS) {
                            if (targetFormDataMap.has(Number(targetFieldID))) {
                                // Get the entire object
                                let targetFieldEntry = targetFormDataMap.get(Number(targetFieldID));
                                // Set the value
                                let oldValue = Number(targetFieldEntry.field_value);
                                targetFieldEntry.field_value = batch.VALUE;
                                if (oldValue !== batch.VALUE) {
                                    updatedRomsFields.push(targetFieldEntry);
                                }
                                // Set the updated object as value for the target field ID
                                targetFormDataMap.set(Number(targetFieldID), targetFieldEntry);
                            }
                        }
                    }
                    console.log("isAnnexureUploaded: ", isAnnexureUploaded);
                }
            }

            // check_multiselect_and_set_annexure_defaults
            if (action.ACTION === "check_multiselect_and_set_annexure_defaults") {
                for (const batch of action.BATCH) {
                    const sourceFormID = Number(batch.SOURCE_FORM_ID);
                    const sourceFormFieldID = Number(batch.SOURCE_FIELD_ID);
                    let sourceFormActivityID = 0,
                        sourceFormTransactionID = 0,
                        isAnnexureUploaded = false;
                    // Check if the excel file has been uploaded or not
                    await activityCommonService
                        .getActivityTimelineTransactionByFormId713(request, request.workflow_activity_id, sourceFormID)
                        .then((formData) => {
                            if (formData.length > 0) {
                                sourceFormActivityID = formData[0].data_activity_id;
                                sourceFormTransactionID = formData[0].data_form_transaction_id;
                            }
                        });

                    // Fetch the specific field (Excel Document) using the form transaction ID
                    if (Number(sourceFormTransactionID) !== 0) {
                        fieldValue = await getFieldValue({
                            form_transaction_id: sourceFormTransactionID,
                            form_id: sourceFormID,
                            field_id: sourceFormFieldID,
                            organization_id: request.organization_id
                        });
                        if (fieldValue.length > 0 && fieldValue[0].data_entity_text_1 !== '') {
                            isAnnexureUploaded = true;
                        }
                    }
                    // isAnnexureUploaded = true;
                    if (isAnnexureUploaded) {
                        // Target form field ID (single/multi-selection field) 
                        const targetFormSelectionFieldID = Number(batch.CHECK_FIELD_ID);
                        if (targetFormDataMap.has(Number(targetFormSelectionFieldID))) {
                            // Get the entire object
                            const multiSelectFieldEntry = targetFormDataMap.get(Number(targetFormSelectionFieldID));
                            const multiSelectFieldValue = multiSelectFieldEntry.field_value;
                            for (const selectBatch of batch.BATCH) {
                                if (String(multiSelectFieldValue).includes(selectBatch.COMBO_VALUE)) {
                                    for (const targetFieldID of selectBatch.TARGET_FIELD_IDS) {
                                        if (targetFormDataMap.has(Number(targetFieldID))) {
                                            // Get the entire object
                                            let targetFieldEntry = targetFormDataMap.get(Number(targetFieldID));
                                            // Set the value
                                            let oldValue = Number(targetFieldEntry.field_value);
                                            targetFieldEntry.field_value = batch.VALUE;
                                            if (oldValue !== batch.VALUE) {
                                                updatedRomsFields.push(targetFieldEntry);
                                            }
                                            // Set the updated object as value for the target field ID
                                            targetFormDataMap.set(Number(targetFieldID), targetFieldEntry);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    console.log("isAnnexureUploaded: ", isAnnexureUploaded);
                }
            }
        }

        // console.log("targetFormDataMap: ", targetFormDataMap);

        // Spread the map values, to form the targetFormData back
        targetFormData = [...targetFormDataMap.values()];
        
        return {
            TARGET_FORM_DATA: targetFormData,
            UPDATED_ROMS_FIELDS: updatedRomsFields
        };
    }

    this.regenerateAndSubmitTargetForm = async function (request) {
        // Fetch form's config data
        request.page_start = 0;
        const [formConfigError, formConfigData] = await activityCommonService.workforceFormMappingSelect(request);
        if (formConfigError !== false) {
            return [formConfigError, formConfigData];
        } else if (
            Number(formConfigData.length) === 0 ||
            Number(formConfigData[0].form_flag_workflow_enabled) !== 1
        ) {
            return [new Error("formConfigData Not Found Error"), []];
        }

        let workflowActivityId = 0,
            workflowActivityTypeId = 0;

        if (Number(formConfigData.length) > 0) {
            workflowActivityTypeId = formConfigData[0].form_workflow_activity_type_id;
            console.log("workflowActivityTypeId: ", workflowActivityTypeId);
        }

        // Get the corresponding workflow's activity_id
        if (request.hasOwnProperty("workflow_activity_id")) {
            workflowActivityId = Number(request.workflow_activity_id);

        } else {
            // If it doesn't exist in the request object, fetch it
            try {
                await fetchReferredFormActivityId(request, request.activity_id, request.form_transaction_id, request.form_id)
                    .then((workflowData) => {
                        if (workflowData.length > 0) {
                            workflowActivityId = Number(workflowData[0].activity_id);
                            request.workflow_activity_id = workflowActivityId;
                        } else {
                            return [new Error("workflowData Not Found Error"), []];
                        }
                    })
            } catch (error) {
                return [error, []];
            }
        }

        console.log("regenerateAndSubmitTargetForm | workflowActivityId: ", workflowActivityId);

        const TARGET_FORM_ID = global.vodafoneConfig[workflowActivityTypeId].TARGET_FORM_ID;
        const TARGET_FORM_ACTIVITY_TYPE_ID = global.vodafoneConfig[workflowActivityTypeId].TARGET_FORM_ACTIVITY_TYPE_ID;

        // Check if the target form already exists
        let targetForm = [],
            targetFormActivityId = 0,
            targetFormTransactionId = 0,
            targetFormName = '',
            targetFormData = [],
            targetFormDataMap = new Map();
        try {
            targetForm = await activityCommonService
                .getActivityTimelineTransactionByFormId713(request, workflowActivityId, TARGET_FORM_ID);

            if (
                targetForm.length > 0 &&
                Number(targetForm[0].data_activity_id) !== 0 &&
                targetForm[0].data_form_transaction_id !== 0
            ) {
                targetFormActivityId = targetForm[0].data_activity_id;
                targetFormTransactionId = targetForm[0].data_form_transaction_id;
                targetFormName = targetForm[0].data_form_name;
                let formDataCollection = JSON.parse(targetForm[0].data_entity_inline);
                if (Array.isArray(formDataCollection.form_submitted) === true || typeof formDataCollection.form_submitted === 'object') {
                    targetFormData = formDataCollection.form_submitted;
                } else {
                    targetFormData = JSON.parse(formDataCollection.form_submitted);
                }
                for (const field of targetFormData) {
                    targetFormDataMap.set(Number(field.field_id), field);
                }
            } else {
                throw new Error("TargetFormDoesNotExist");
            }
        } catch (error) {
            console.log("regenerateAndSubmitTargetForm | Error: ", error);
            return [error, []];
        }
        console.log("regenerateAndSubmitTargetForm | targetFormActivityId: ", targetFormActivityId);
        console.log("regenerateAndSubmitTargetForm | targetFormTransactionId: ", targetFormTransactionId);
        console.log("regenerateAndSubmitTargetForm | targetFormName: ", targetFormName);
        console.log("regenerateAndSubmitTargetForm | targetFormData.length: ", targetFormData.length);
        console.log("regenerateAndSubmitTargetForm | targetFormDataMap.size: ", targetFormDataMap.size);

        let sourceFieldsUpdated = [],
            sourceFieldsUpdatedMap = new Map();
        try {
            if (!request.hasOwnProperty('activity_inline_data')) {
                // Usually mobile apps send only activity_timeline_collection parameter in
                // the "/activity/timeline/entry/add" call
                const activityTimelineCollection = JSON.parse(request.activity_timeline_collection);
                sourceFieldsUpdated = activityTimelineCollection.form_submitted;
            } else {
                // The web app has been sending activity_inline_data, which contains the form
                // data, directly along with the activity_timeline_collection parameter
                sourceFieldsUpdated = JSON.parse(request.activity_inline_data);
            }
            // sourceFieldsUpdated = JSON.parse(request.activity_inline_data);
            // console.log("regenerateAndSubmitTargetForm | sourceFieldsUpdated: ", sourceFieldsUpdated);
            for (const field of sourceFieldsUpdated) {
                sourceFieldsUpdatedMap.set(Number(field.field_id), field);
            }
            // console.log("regenerateAndSubmitTargetForm | sourceFieldsUpdatedMap: ", sourceFieldsUpdatedMap);
        } catch (error) {
            console.log("regenerateAndSubmitTargetForm | sourceFieldsUpdated | error: ", error);
            return [error, []];
        }

        // Fetch relevant source and target form field mappings
        const SOURCE_FORM_FIELD_MAPPING_DATA = global.vodafoneConfig[workflowActivityTypeId].FORM_FIELD_MAPPING_DATA[request.form_id];
        console.log("SOURCE_FORM_FIELD_MAPPING_DATA | length: ", Object.keys(SOURCE_FORM_FIELD_MAPPING_DATA).length);
        
        let targetFieldsUpdated = [],
            REQUEST_FIELD_ID = 0;
        for (const sourceField of sourceFieldsUpdated) {
            let sourceFieldID = String(sourceField.field_id);
            if (Object.keys(SOURCE_FORM_FIELD_MAPPING_DATA).includes(sourceFieldID)) {
                console.log("Mapping Exists: ", sourceFieldID, " => ", SOURCE_FORM_FIELD_MAPPING_DATA[sourceFieldID]);

                let targetFieldID = Number(SOURCE_FORM_FIELD_MAPPING_DATA[sourceFieldID]);
                REQUEST_FIELD_ID = targetFieldID;
                if (targetFormDataMap.has(targetFieldID)) {
                    console.log(targetFormDataMap.get(targetFieldID));
                    // Get the entire object
                    let targetFieldEntry = targetFormDataMap.get(Number(targetFieldID));
                    if (String(targetFieldEntry.field_value) !== String(sourceField.field_value)) {
                        // Update the value
                        targetFieldEntry.field_value = sourceField.field_value;
                        // Set the updated object as value for the target field ID
                        targetFormDataMap.set(Number(targetFieldID), targetFieldEntry);
                        // Keep track of target fields updated
                        targetFieldsUpdated.push(
                            Object.assign({
                                form_id: TARGET_FORM_ID,
                                form_transaction_id: targetFormTransactionId,
                                form_name: targetFormName
                            }, targetFieldEntry)
                        );
                    }
                } else {
                    // If the field doesn't exist already, insert it
                    let targetFieldEntry = Object.assign({}, sourceField);
                    targetFieldEntry.form_id = TARGET_FORM_ID;
                    targetFieldEntry.field_id = targetFieldID;
                    targetFieldEntry.message_unique_id = util.getMessageUniqueId(Number(request.asset_id));
                    // Set the new object as value for the target field ID
                    targetFormDataMap.set(Number(targetFieldID), targetFieldEntry);
                    // Keep track of target fields updated
                    targetFieldsUpdated.push(
                        Object.assign({
                            form_id: TARGET_FORM_ID,
                            form_transaction_id: targetFormTransactionId,
                            form_name: targetFormName
                        }, targetFieldEntry)
                    );
                }
            }
        }

        // ROMS Recalculation
        const ROMS_ACTIONS = global.vodafoneConfig[workflowActivityTypeId].ROMS_ACTIONS;
        let {TARGET_FORM_DATA, UPDATED_ROMS_FIELDS} = await performRomsCalculations(request, [...targetFormDataMap.values()], ROMS_ACTIONS);
        // updatedRomsFields
        for (let i = 0; i < UPDATED_ROMS_FIELDS.length; i++) {
            UPDATED_ROMS_FIELDS[i].form_id = TARGET_FORM_ID;
            UPDATED_ROMS_FIELDS[i].form_transaction_id = targetFormTransactionId;
            UPDATED_ROMS_FIELDS[i].form_name = targetFormName;
        }

        console.log("***** ***** ***** ***** ***** ***** ***** *****");
        console.log("targetFieldsUpdated: ", targetFieldsUpdated);
        console.log("***** ***** ***** ***** ***** ***** ***** *****");

        console.log("UPDATED_ROMS_FIELDS: ", UPDATED_ROMS_FIELDS);

        // Final list of fields to be updated
        targetFieldsUpdated = targetFieldsUpdated.concat(UPDATED_ROMS_FIELDS);
        // If no fields have been updated, don't proceed
        if (targetFieldsUpdated.length === 0) {
            return [new Error("NoTargetFormFieldsUpdated"), []];
        }

        // Fire field alter
        let fieldsAlterRequest = Object.assign({}, request);
        fieldsAlterRequest.form_transaction_id = targetFormTransactionId;
        fieldsAlterRequest.form_id = TARGET_FORM_ID;
        fieldsAlterRequest.field_id = REQUEST_FIELD_ID;
        fieldsAlterRequest.activity_inline_data = JSON.stringify(targetFieldsUpdated);
        fieldsAlterRequest.activity_id = targetFormActivityId;
        fieldsAlterRequest.workflow_activity_id = workflowActivityId;

        const event = {
            name: "alterFormActivityFieldValues",
            service: "formConfigService",
            method: "alterFormActivityFieldValues",
            payload: fieldsAlterRequest
        };

        queueWrapper.raiseActivityEvent(event, fieldsAlterRequest.activity_id, (err, resp) => {
            if (err) {
                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
            } else {
                global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);
                global.logger.write('debug', 'Response from queueWrapper raiseActivityEvent: ' + JSON.stringify(resp), resp, request);
            }
        });

        return [true, false];
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}


module.exports = VodafoneService;
