/*
 * author: Nani Kalyan V
 */

function BotService(objectCollection) {

    const queueWrapper = objectCollection.queueWrapper;
    const util = objectCollection.util;
    const db = objectCollection.db;    
    const activityPushService = objectCollection.activityPushService;
    const activityCommonService = objectCollection.activityCommonService;
    const cacheWrapper = objectCollection.cacheWrapper;
    //const fetch = require('node-fetch');
    //const { URLSearchParams } = require('url');
    const moment = require('moment');
    
    this.getBotsMappedToActType = async (request) => {            
            let paramsArr = new Array(
                request.flag || 1, 
                request.organization_id, 
                request.account_id, 
                request.workforce_id, 
                request.activity_type_id, 
                request.field_id, 
                request.form_id, 
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );
            let queryString = util.getQueryString('ds_p1_bot_list_select', paramsArr);
            if (queryString != '') {                
                return await (db.executeQueryPromise(1, queryString, request));
            }
    };
    
    this.getBotworkflowSteps = async (request) => {        
            let paramsArr = new Array(                
                request.bot_id, 
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );
            let queryString = util.getQueryString('ds_p1_bot_operation_mapping_select', paramsArr);
            if (queryString != '') {
                return await (db.executeQueryPromise(1, queryString, request));                
            }        
    };    


    this.initBotEngine = async (request) =>{        
        request['datetime_log'] = util.getCurrentUTCTime();
        let botOperationsJson = JSON.parse(request.inline_data);        
        let botSteps = Object.keys(botOperationsJson.bot_operations);
        global.logger.write('conLog', botSteps, {}, {});

        for(let i of botSteps) {
            switch(i) {                
                case 'status_alter': 
                    global.logger.write('conLog', 'STATUS ALTER', {}, {});                    
                    try {                    
                        await changeStatus(request, botOperationsJson.bot_operations.status_alter);
                    } catch(err) {
                        global.logger.write('serverError', err, {}, {});
                        global.logger.write('serverError', 'Error in executing changeStatus Step', {}, {});                        
                        return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                case 'form_field_copy':                     
                    global.logger.write('conLog', 'FORM FIELD', {}, {});
                    try {                        
                        await copyFields(request, botOperationsJson.bot_operations.form_field_copy);
                    } catch(err) {
                        global.logger.write('serverError', 'Error in executing copyFields Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                case 'participant_add':                     
                    global.logger.write('conLog', 'PARTICIPANT ADD', {}, {}); 
                    try {
                        await addParticipant(request, botOperationsJson.bot_operations.participant_add);
                    } catch(err) {
                        global.logger.write('serverError', 'Error in executing addParticipant Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                case 'fire_email':                 
                    global.logger.write('conLog', 'FIRE EMAIL', {}, {}); 
                    try {
                        await fireEmail(request, botOperationsJson.bot_operations.fire_email);
                    } catch(err) {
                        global.logger.write('serverError', 'Error in executing fireEmail Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                case 'fire_text': 
                    global.logger.write('conLog', 'FIRE TEXT', {}, {}); 
                    try {
                        await fireTextMsg(request, botOperationsJson.bot_operations.fire_text);
                    } catch(err) {
                        global.logger.write('serverError', 'Error in executing fireTextMsg Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                case 'fire_api': 
                    global.logger.write('conLog', 'FIRE API', {}, {}); 
                    try {
                        await fireApi(request, botOperationsJson.bot_operations.fire_api);
                    } catch(err) {
                        global.logger.write('serverError', 'Error in executing fireApi Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;

                case 'workflow_percentage_alter': 
                    global.logger.write('conLog', 'WF PERCENTAGE ALTER', {}, {}); 
                    try {
                        await alterWFCompletionPercentage(request, botOperationsJson.bot_operations.workflow_percentage_alter);
                    } catch(err) {
                        global.logger.write('serverError', 'Error in executing alterWFCompletionPercentage Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;
                
            }
            
            //botOperationTxnInsert(request);            
            
        }
        
        return {};

    };    
    
    async function botOperationTxnInsert(request) {        
        let paramsArr = new Array(                
            request.bot_operation_id, 
            request.bot_id, 
            request.inline_data, 
            request.bot_operation_status_id, 
            request.workforce_id, 
            request.account_id, 
            request.organization_id, 
            request.asset_id, 
            request.datetime_log            
        );
        let queryString = util.getQueryString('ds_p1_bot_operation_transaction_insert', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));                
        }        
    };

    //Bot Step to change the status
    async function changeStatus(request, inlineData) {
        let newReq = Object.assign({}, request);
        global.logger.write('debug', inlineData, {}, {});
        newReq.activity_status_id = inlineData.activity_status_id;
        //newRequest.activity_status_type_id = inlineData.activity_status_id; 
        //newRequest.activity_status_type_category_id = ""; 
        newReq.message_unique_id = util.getMessageUniqueId(request.asset_id);

        var event = {
            name: "alterActivityStatus",
            service: "activityService",
            method: "alterActivityStatus",
            payload: newReq
        };

        return await queueWrapper.raiseActivityEventPromise(event, newReq.activity_id);
    };

    //Bot Step Copying the fields
    async function copyFields(request, inlineData) {
        let newReq = Object.assign({}, request);        
        //console.log(inlineData);
        let resp;
        let fieldValue;
        let tempObj;
        tempObj.organization_id = newReq.organization_id;
        tempObj.form_transaction_id = newReq.source_form_transaction_id;
        let finalArr = new Array();
        
        for(i of inlineData) {         
            tempObj = i.source_form_id;
            tempObj = i.source_field_id;
            resp = await getFieldValue(tempObj);
            fieldValue = resp[0].data_entity_text_1;

            //insert in new formId field id with the value retrieved i.e. resp[0].data_entity_text_1
            let rowDataArr = {
                form_id : i.target_form_id,
                field_id : i.target_field_id,
                field_value: fieldValue,
                form_transaction_id: request.target_form_transaction_id
            }            
            finalArr.push(rowDataArr);
        }
        console.log('Final Json : ', finalArr);
        newReq.activity_inline_data = finalArr;
        //return await alterFormActivity(request, newReq);
    };

    //Bot Step Adding a participant
    async function addParticipant(request, inlineData) {
        let newReq = Object.assign({}, request);
        global.logger.write('conLog', inlineData, {}, {});
        newReq.message_unique_id = util.getMessageUniqueId(request.asset_id);

        let type = Object.keys(inlineData);
        console.log(type);

        if(type[0] === 'static') {                
            newReq.flag_asset = inlineData[type[0]].flag_asset;
            newReq.desk_asset_id = inlineData[type[0]].desk_asset_id;
            newReq.phone_number = inlineData[type[0]].phone_number;
        } else if(type[0] === 'dynamic') {            
            newReq.form_id = inlineData[type[0]].form_id;
            newReq.field_id = inlineData[type[0]].field_id;

            let resp = await getFieldValue(newReq);            
            newReq.phone_number = resp[0].data_entity_text_1
            //console.log(newReq.email_id);      
        }
        
        //return await queueWrapper.raiseActivityEventPromise(event, newReq.activity_id);
        return await addParticipantStep(newReq);

    }

    //Bot Step Firing an eMail
    async function fireEmail(request, inlineData) {
        let newReq = Object.assign({}, request);        

        console.log(inlineData);
        let type = Object.keys(inlineData);
        console.log(type);

        if(type[0] === 'static') {            
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.email_id = inlineData[type[0]].email;
        } else if(type[0] === 'dynamic') {
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.form_id = inlineData[type[0]].form_id;
            newReq.field_id = inlineData[type[0]].field_id;

            let resp = await getFieldValue(newReq);            
            newReq.email_id = resp[0].data_entity_text_1            
        }
        
        let dbResp = await getCommTemplates(newReq);
        let retrievedCommInlineData = JSON.parse(dbResp[0].communication_inline_data);
        console.log(retrievedCommInlineData.communication_template.email);
        
        return await sendEmail(newReq, retrievedCommInlineData.communication_template.email);
    };

    //Bot Step Firing a Text Message
    async function fireTextMsg(request, inlineData) {       
        let newReq = Object.assign({}, request);
        
        console.log(inlineData);
        let type = Object.keys(inlineData);
        console.log(type);

        if(type[0] === 'static') {    
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.country_code = inlineData[type[0]].phone_country_code;
            newReq.phone_number = inlineData[type[0]].phone_number;
        } else if(type[0] === 'dynamic') {
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.form_id = inlineData[type[0]].form_id;
            newReq.field_id = inlineData[type[0]].field_id;
            newReq.country_code = 91;

            let resp = await getFieldValue(newReq);         
            newReq.phone_number = resp[0].data_entity_text_1;            
        }

        let dbResp = await getCommTemplates(newReq);
        let retrievedCommInlineData = JSON.parse(dbResp[0].communication_inline_data);
        newReq.smsText = retrievedCommInlineData.communication_template.text.message;
        console.log(newReq.smsText);

        //return await activityCommonService.makeRequest(newReq, "send/smshorizon/sms", 1);

        util.sendSmsHorizon(newReq.smsText, newReq.country_code, newReq.phone_number, function (err, data) {
            if (err === false) {
                global.logger.write('debug', 'SMS HORIZON RESPONSE: '+JSON.stringify(data), {}, {});
                return data.response ;
            } else {                
                return data.response;
            }
        });
    };

    //Bot Step Firing an API
    async function fireApi(request, inlineData) {
        let newReq = Object.assign({}, request);
        
        console.log(inlineData);
        let type = Object.keys(inlineData);
        console.log(type);

        if(type[0] === 'static') {
            newReq.endpoint = inlineData[type[0]].endpoint;
            newReq.method = inlineData[type[0]].method;
            newReq.protocol = inlineData[type[0]].protocol;
            newReq.parameters = inlineData[type[0]].parameters;            
        } else if(type[0] === 'dynamic') {          
            newReq.endpoint = inlineData[type[0]].endpoint;
            newReq.method = inlineData[type[0]].method;
            newReq.protocol = inlineData[type[0]].protocol;
            newReq.parameters = inlineData[type[0]].parameters;

            let resp = await getFieldValue(newReq);            
            newReq.phone_number = resp[0].data_entity_text_1;            
        }
        
        //let response =  await makeAPIRequest(newReq, newReq.parameters);
        //return (response[0] === 'false') ? response : Promise.reject(response);        

        let response =  await activityCommonService.makeRequest(newReq, newReq.endpoint, 1);
        return (response.status === 200)? response : Promise.reject(response);        
    };

    //Bot Step Altering workflow completion percentage
    async function alterWFCompletionPercentage(request, inlineData) {
        console.log(inlineData.workflow_percentage_contribution);
        request.workflow_completion_percentage = inlineData.workflow_percentage_contribution;
        return await workflowPercentageUpdate(request);
    };

    function sendEmail (request, emailJson) {
        return new Promise((resolve, reject)=>{
            console.log("\x1b[35m [Log] Inside SendEmail \x1b[0m");            
            const emailSubject = emailJson.subject;
            const Template = emailJson.body;

            request.email_sender = 'OMT.IN1@vodafoneidea.com'; 
            request.email_sender_name = 'Vodafoneidea';

            console.log(emailSubject);
            console.log(Template);
                    
            util.sendEmailV3(request,
                request.email_id,
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
    };
    
    //Get the email, sms template
    async function getCommTemplates(request) {
            let paramsArr = new Array(
                request.flag || 2,
                request.communication_id, 
                request.communication_type_id || 0, 
                request.communication_type_category_id || 0, 
                request.activity_type_id || 0, 
                request.workforce_id, 
                request.account_id, 
                request.organization_id,                 
                request.page_start || 0,
                util.replaceQueryLimit(request.page_limit)
            );
            let queryString = util.getQueryString('ds_p1_communication_list_select', paramsArr);
            if (queryString != '') {                
                return await (db.executeQueryPromise(1, queryString, request));
            }        
    };

    //Get the field value based on form id and form_transaction_id
    async function getFieldValue(request) {
        let paramsArr = new Array(
            request.form_transaction_id, 
            request.form_id, 
            request.field_id, 
            request.organization_id            
        );
        let queryString = util.getQueryString('ds_p1_activity_form_transaction_select_field_sequence_id', paramsArr);
        if (queryString != '') {                
            return await (db.executeQueryPromise(1, queryString, request));
        }
    };

    function generateReqParams(parametersJson) {
        return new Promise((resolve, reject)=>{
            console.log(parametersJson);            
            for(let i of parametersJson) {
                console.log(i.parameter_key);
                finalJson[i.parameter_key] =  i.parameter_value;
            }            
            console.log(finalJson);
            resolve(finalJson);
        });        
    }

    async function addParticipantStep(request) {
    
        let dataResp  = await checkServiceDeskBasedOnPhNo(request);
        if(dataResp.length > 0) { //status is true means service desk exists
             
            let sdResp = dataResp[0];
            let deskAssetId = sdResp.asset_id;   
            console.log('deskAssetId : ', deskAssetId);
                
            if(Number(sdResp.operating_asset_phone_number) !== Number(customerData.contact_phone_number)) {
                
                console.log('operating asset phone number is different from authorised_signatory_contact_number');
                                      
                //Unmap the operating Asset from service desk
                activityCommonService.assetListUpdateOperatingAsset(request, deskAssetId, 0, (err, data)=>{});
                           
                var newRequest = Object.assign({}, request);
                newRequest.activity_title = 'Adding Co-Worker Contact Card';
                newRequest.activity_description = 'Adding Co-Worker Contact Card';
                newRequest.activity_type_id = "";
                newRequest.activity_inline_data = JSON.stringify({
                     "activity_id": 0,
                     "activity_ineternal_id": -1,
                     "activity_type_category_id": 6,
                     "contact_account_id": request.account_id,
                     "contact_asset_id": 0,
                     "contact_asset_type_id": request.asset_type_id,
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
                let operatingAssetId = await createAsset(newRequest);
                
                //Map the newly created operating asset with service desk asset
                activityCommonService.assetListUpdateOperatingAsset(request, deskAssetId, operatingAssetId, (err, data)=>{});
                
                //Add Service Desk as Participant to form file
                addDeskAsParticipant(request, customerData, deskAssetId);
                
            } else { 
                    //When authorized_signatory_phone_number is equal to the retrieved operating asset
                    console.log('operating asset phone number is same as authorised_signatory_contact_number');
                    
                    //Add Service Desk as Participant to form file
                    addDeskAsParticipant(request, customerData, deskAssetId);
                            
            }                        
//When Service desk not exists
        } else {
            console.log('In else part');
            //Create Customer Operating Asset
            //Create Customer Contact file
            //Create Customer Desk Asset                            
            let resp  = await createAssetContactDesk(request, customerData);
                                             
            let assetId = resp.response.asset_id;
            let deskAssetId = resp.response.desk_asset_id;
            let contactfileActId = resp.response.activity_id;
            
            //Map the operating Asset to the contact file
            addCustomerAsParticipantToContFile(newRequest, contactfileActId, customerData, assetId).then(()=>{});
            
            //Add Service Desk as Participant to form file
            addDeskAsParticipant(request, customerData, deskAssetId);
        }
    }

    function createAssetContactDesk(request, customerData) {
        return new Promise((resolve, reject)=>{                     

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
                    reject('Status is ' + Number(body.status) +' while creating Service Desk');
                }
            });
        });
    };

   function addDeskAsParticipant(request, customerData, deskAssetId) {
    return new Promise((resolve, reject)=>{
         
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
                     global.logger.write('debug',"\x1b[35m [ERROR] Raising queue activity raised for adding Service Desk as a participant. \x1b[0m",{},request);
                     reject('Error while raising queue activity for adding service desk as a participant');
                 } else {                        
                     global.logger.write('debug',"\x1b[35m Queue activity raised for adding Service Desk as a participant. \x1b[0m",{},request);
                     resolve();
                 }
             });
            
         });
    };

    async function checkServiceDeskBasedOnPhNo(request) {        
        let paramsArr = new Array(
            request.asset_type_id || 45, 
            request.asset_type_category_id, 
            request.workforce_id, 
            request.account_id, 
            request.organization_id, 
            request.phone_number, 
            request.country_code
        );            
        let queryString = util.getQueryString('ds_p1_1_asset_list_select_customer_unique_id', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
        }
    };

    async function makeAPIRequest(request, parametersJson){
        /*const params = new URLSearchParams();
        
        params.append('asset_id', request.asset_id);
        params.append('asset_token_auth', request.asset_token_auth);

        for(let i of parametersJson) {            
            params.append(i.parameter_key, i.parameter_value);
        }        

        console.log('PARAMS : ', params);
        let res = await fetch('http://localhost:' +  + global.config.servicePort + "/" + global.config.version + "/" + request.endpoint, { method: 'POST', body: params }); 
        let result = await res.json(); */

        const body = { a: 1 };
        body['asset_id'] = request.asset_id;
        body['asset_token_auth'] = request.asset_token_auth

        for(let i of parametersJson) {            
            body[i.parameter_key] =  i.parameter_value;
        }        
 
        console.log('BODY : ', body);
        let res = await fetch('http://localhost:' +  + global.config.servicePort + "/" + global.config.version + "/" + request.endpoint, 
                    {
                        method: 'post',
                        body:    body, //JSON.stringify(body),
                        headers: { 'Content-Type': 'x-www-form-urlencoded' },
                    });
        let result = await res.json();

        if(result.status == 200){
            return Promise.resolve(['false', result]);
        } else {
            return Promise.reject(['true', result]);
        }
    };

    this.nanikalyan = async (request)=> {
        return await alterFormActivity(request);
    };

    async function alterFormActivity(request) {
        var logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;

        let oldFieldValue,
            newFieldValue,
            data;
            inline_data_present = 1;
        
        var activityInlineData = JSON.parse(request.activity_inline_data);       
        var newData = activityInlineData;
        console.log('newData from Request: ', newData);

        data = await activityCommonService.getActivityByFormTransaction({   "activity_id" : 1,
                                                                            "form_transaction_id": request.target_form_transaction_id,
                                                                            "organization_id": request.organization_id
                                                                        });

        console.log('Data from activity_list: ', data);
        var retrievedInlineData = [];        

        if(data.length > 0){
            request['activity_id'] = data[0].activity_id;            
            retrievedInlineData = JSON.parse(data[0].activity_inline_data);
            
            if(!retrievedInlineData.length > 0) {
               inline_data_present = 0; 
            }            
        } else {
            inline_data_present = 0;
        }
        
        //Iterating through all the target objects
        for(let i of newData) {            
            newFieldValue = i.field_value;            
                        
            if(inline_data_present === 1) {
                for(let row of retrievedInlineData) {
                    if(Number(row.field_id) === Number(i.field_id)) {
                        oldFieldValue = row.field_value;
                        row.field_value = i.field_value;
                        //i.field_name = row.field_name;                        
                    }
                }
            } else {
                i.update_sequence_id = 1;
                retrievedInlineData.push(i);
                oldFieldValue = i.field_value;
            }         
            
            let respData = await getLatestUpdateSeqId({ "form_transaction_id" : request.target_form_transaction_id,
                                                        "form_id" : i.form_id,
                                                        "field_id" : i.field_id,
                                                        "organization_id" : request.organization_id
                                                     });
            console.log('respData : ', respData);
            
            if (respData.length > 0) {
                    let x = respData[0];
                    console.log('update_sequence_id : ', x.update_sequence_id);
                    request.update_sequence_id = ++x.update_sequence_id;
            } else {
                request.update_sequence_id = 1;
                
                await putLatestUpdateSeqId(request, activityInlineData);
            }
        }

        /*request.activity_inline_data = JSON.stringify(retrievedInlineData)
        let content = '';
        if (String(oldFieldValue).trim().length === 0) {
            content = `In the ${i.form_name}, the field ${i.field_name} was updated to ${newFieldValue}`;
        } else {
            content = `In the ${i.form_name}, the field ${i.field_name} was updated from ${oldFieldValue} to ${newFieldValue}`
        }
        
        let activityTimelineCollection = {
            form_submitted: retrievedInlineData,
            subject: `Field Updated for ${i.form_name}`,
            content: content,
            mail_body: `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
            attachments: [],
            asset_reference: [],
            activity_reference: [],
            form_approval_field_reference: []
        }
        
        request.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
        var event = {
            name: "alterActivityInline",
            service: "activityUpdateService",
            method: "alterActivityInline",
            payload: request
        }
        await queueWrapper.raiseActivityEventPromise(event, request.activity_id);*/

        return {};
    };
    
    async function getLatestUpdateSeqId(request) {
        let paramsArr = new Array(
            request.form_transaction_id,
            request.form_id,
            request.field_id,
            request.organization_id
        );
        queryString = util.getQueryString('ds_p1_activity_form_transaction_select_field_sequence_id', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(1, queryString, request));           
        }
    };

    async function putLatestUpdateSeqId(request, activityInlineData){
        
        for(let row of activityInlineData) {
            var params = new Array(
                request.form_transaction_id, //0
                request.form_id, //1
                request.field_id || row.field_id, //2
                request.data_type_combo_id || 0, //3
                request.activity_id, //4
                request.asset_id, //5
                request.workforce_id, //6
                request.account_id, //7
                request.organization_id, //8
                '', //IN p_entity_date_1 DATE                                   9
                request.entity_datetime_1 || '', //IN p_entity_datetime_1 DATETIME            10
                '', //IN p_entity_tinyint_1 TINYINT(4)                          11
                '', //IN p_entity_tinyint_2 TINYINT(4)                          12 BETA
                '', //IN p_entity_bigint_1 BIGINT(20)                           13
                '', //IN p_entity_double_1 DOUBLE(16,4),                        14
                '', //IN p_entity_decimal_1 DECIMAL(14,2)                       15
                '', //IN p_entity_decimal_2 DECIMAL(14,8)                       16
                '', //IN p_entity_decimal_3 DECIMAL(14,8)                       17
                '', //IN p_entity_text_1 VARCHAR(1200)                          18
                '', //IN p_entity_text_2 VARCHAR(4800)                          19
                '', //IN p_entity_text_3 VARCHAR(100)                           20 BETA
                '', //IN p_location_latitude DECIMAL(12,8)                      21
                '', // IN p_location_longitude DECIMAL(12,8)                    22
                '', //IN p_location_gps_accuracy DOUBLE(16,4)                   23
                '', //IN p_location_gps_enabled TINYINT(1)                      24
                '', //IN p_location_address VARCHAR(300)                        25
                '',  //IN p_location_datetime DATETIME                          26                    
                );

                var dataTypeId = Number(row.field_data_type_id);
                console.log('dataTypeId : ', dataTypeId);
                switch (dataTypeId) {
                    case 1:     // Date
                    case 2:     // future Date
                    case 3:     // past Date
                        params[9] = row.field_value;
                        break;
                    case 4:     // Date and time
                        params[10] = row.field_value;
                        break;
                    case 5:     //Number
                        //params[12] = row.field_value;
                        params[13] = row.field_value;
                        break;
                    case 6:     //Decimal
                        //params[13] = row.field_value;
                        params[14] = row.field_value;
                        break;
                    case 7:     //Scale (0 to 100)
                    case 8:     //Scale (0 to 5)
                        params[11] = row.field_value;
                        break;
                    case 9:     // Reference - Organization
                    case 10:    // Reference - Building
                    case 11:    // Reference - Floor
                    case 12:    // Reference - Person
                    case 13:    // Reference - Vehicle
                    case 14:    // Reference - Room
                    case 15:    // Reference - Desk
                    case 16:    // Reference - Assistant
                        //params[12] = row.field_value;
                        params[13] = row.field_value;
                        break;
                    case 50:    // Reference - File
                        params[13] = Number(JSON.parse(row.field_value).activity_id); // p_entity_bigint_1
                        params[18] = row.field_value; // p_entity_text_1
                        break;
                    case 17:    //Location
                        var location = row.field_value.split('|');
                        params[16] = location[0];
                        params[17] = location[1];
                        break;
                    case 18:    //Money with currency name
                        var money = row.field_value.split('|');
                        params[15] = money[0];
                        params[18] = money[1];
                        break;
                    case 19:    //Short Text
                        params[18] = request.new_field_value;
                        break;
                    case 20:    //Long Text
                        params[19] = row.field_value;
                        break;
                    case 21:    //Label
                        params[18] = row.field_value;
                        break;
                    case 22:    //Email ID
                        params[18] = row.field_value;
                        break;
                    case 23:    //Phone Number with Country Code
                        var phone = row.field_value.split('|');
                        params[13] = phone[0];  //country code
                        params[18] = phone[1];  //phone number
                        break;
                    case 24:    //Gallery Image
                    case 25:    //Camera Front Image
                    case 26:    //Video Attachment
                        params[18] = row.field_value;
                        break;
                    case 27:    //General Signature with asset reference
                    case 28:    //General Picnature with asset reference
                        var signatureData = row.field_value.split('|');
                        params[18] = signatureData[0];  //image path
                        params[13] = signatureData[1];  // asset reference
                        params[11] = signatureData[1];  // accepted /rejected flag
                        break;
                    case 29:    //Coworker Signature with asset reference
                    case 30:    //Coworker Picnature with asset reference
                        approvalFields.push(row.field_id);
                        var signatureData = row.field_value.split('|');
                        params[18] = signatureData[0];  //image path
                        params[13] = signatureData[1];  // asset reference
                        params[11] = signatureData[1];  // accepted /rejected flag
                        break;
                    case 31:    //Cloud Document Link
                        params[18] = row.field_value;
                        break;
                    case 32:    // PDF Document
                    case 51:    // PDF Scan
                        params[18] = row.field_value;
                        break;
                    case 33:    //Single Selection List
                        params[18] = row.field_value;
                        break;
                    case 34:    //Multi Selection List
                        params[18] = row.field_value;
                        break;
                    case 35:    //QR Code
                    case 36:    //Barcode
                        params[18] = row.field_value;
                        break;
                    case 38:    //Audio Attachment
                        params[18] = row.field_value;
                        break;
                    case 39:    //Flag
                        params[11] = row.field_value;
                }
                ;

                params.push('');                                                    //IN p_device_manufacturer_name VARCHAR(50)
                params.push('');                                                    // IN p_device_model_name VARCHAR(50)
                params.push(request.device_os_id);                                  // IN p_device_os_id TINYINT(4)
                params.push('');                                                    // IN p_device_os_name VARCHAR(50),
                params.push('');                                                    // IN p_device_os_version VARCHAR(50)
                params.push(request.app_version);                                   // IIN p_device_app_version VARCHAR(50)
                params.push(request.api_version);                                   // IN p_device_api_version VARCHAR(50)
                params.push(request.asset_id);                                      // IN p_log_asset_id BIGINT(20)
                params.push(request.message_unique_id);                             // IN p_log_message_unique_id VARCHAR(50)
                params.push(request.flag_retry || 0);                               // IN p_log_retry TINYINT(1)
                params.push(request.flag_offline || 0);                             // IN p_log_offline TINYINT(1)
                params.push(request.datetime_log);                                  // IN p_transaction_datetime DATETIME
                params.push(request.datetime_log);                                  // IN p_log_datetime DATETIME
                params.push(request.datetime_log);                                  // IN p_entity_datetime_2 DATETIME            
                params.push(request.update_sequence_id);            

                global.logger.write('debug', '\x1b[32m addFormEntries params - \x1b[0m' + JSON.stringify(params), {}, request);
                
                queryString = util.getQueryString('ds_p1_activity_form_transaction_insert_field_update', params);
                if (queryString != '') {
                    try {
                        await db.executeQueryPromise(0, queryString, request);
                    } catch(err) {
                        global.logger.write('debug', err,{},{});
                    }                    
                }
        }
        return {};   
    };

};


module.exports = BotService;
