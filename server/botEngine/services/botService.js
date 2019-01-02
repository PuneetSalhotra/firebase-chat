/*
 * author: Nani Kalyan V
 */

var ActivityService = require('../../services/activityService.js');
var ActivityParticipantService = require('../../services/activityParticipantService.js');
var ActivityUpdateService = require('../../services/activityUpdateService.js');
var ActivityTimelineService = require('../../services/activityTimelineService.js');
//var ActivityListingService = require('../../services/activityListingService.js');


function BotService(objectCollection) {

    const moment = require('moment');
    const makeRequest = require('request');
    const cacheWrapper = objectCollection.cacheWrapper;
    //const queueWrapper = objectCollection.queueWrapper;
    //const activityPushService = objectCollection.activityPushService;
    const util = objectCollection.util;
    const db = objectCollection.db;    
    const activityCommonService = objectCollection.activityCommonService;    
    const activityUpdateService = new ActivityUpdateService(objectCollection);
    const activityParticipantService = new ActivityParticipantService(objectCollection);
    const activityService = new ActivityService(objectCollection);
    //const activityListingService = new ActivityListingService(objectCollection);
    const activityTimelineService = new ActivityTimelineService(objectCollection);
    
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
        
        let wfSteps;

        /*if(request.hasOwnProperty(bot_operation_id)) {
            wfSteps = request.inline_data;
        } else {
            wfSteps = await this.getBotworkflowSteps({
                "bot_id": request.bot_id,
                "page_start": 0,
                "page_limit": 50
            });
        }*/
        
        wfSteps = await this.getBotworkflowSteps({
            "bot_id": request.bot_id,
            "page_start": 0,
            "page_limit": 50
        });
        
        //console.log('WFSTEPS : ', wfSteps);

        let botOperationsJson,
            botSteps;

        for(let i of wfSteps) {
            global.logger.write('conLog', i.bot_operation_type_id, {}, {});            

            botOperationsJson = JSON.parse(i.bot_operation_inline_data);
            botSteps = Object.keys(botOperationsJson.bot_operations);
            global.logger.write('conLog', botSteps, {}, {});

            switch(i.bot_operation_type_id) {
                //case 'participant_add':
                case 1:  // Add Participant                 
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

                //case 'status_alter': 
                case 2:  // Alter Status
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

                //case 'form_field_copy':
                case 3: //Copy Form field
                    global.logger.write('conLog', 'FORM FIELD', {}, {});
                    try {                        
                        global.logger.write('conLog', 'Request Params received by BOT ENGINE', request, {});
                        await copyFields(request, botOperationsJson.bot_operations.form_field_copy);
                    } catch(err) {
                        global.logger.write('serverError', 'Error in executing copyFields Step', {}, {});
                        global.logger.write('serverError', err, {}, {});
                        return Promise.reject(err);
                    }
                    global.logger.write('conLog', '****************************************************************', {}, {});
                    break;                

                //case 'workflow_percentage_alter': 
                case 4: //Update Workflow Percentage
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

                //case 'fire_api': 
                case 5: // External System Integration
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

                //case 'fire_text': 
                case 6: // Send Text Message
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

                //case 'fire_email':           
                case 7: // Send email
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
        }
        
        botOperationTxnInsert(request, i);
    }    
    
    return {};
    };    
    
    async function botOperationTxnInsert(request, botData) {        
        let paramsArr = new Array(                
            botData.bot_operation_id, 
            botData.bot_id, 
            botData.bot_operation_inline_data, 
            botData.bot_operation_status_id, 
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
    }

    //Bot Step to change the status
    async function changeStatus(request, inlineData) {
        let newReq = Object.assign({}, request);
        global.logger.write('debug', inlineData, {}, {});
        newReq.activity_status_id = inlineData.activity_status_id;
        //newRequest.activity_status_type_id = inlineData.activity_status_id; 
        //newRequest.activity_status_type_category_id = ""; 
        newReq.message_unique_id = util.getMessageUniqueId(request.asset_id);
        
        activityService.alterActivityStatus(newReq, (err, resp)=>{
            return (err === false) ? {} : Promise.reject(err);
        });
    }

    //Bot Step Copying the fields
    async function copyFields(request, inlineData) {        
        let newReq = Object.assign({}, request);      
        newReq.activity_id = request.workflow_activity_id;
        //console.log(inlineData);
        let resp,
            fieldValue,
            txn_id,
            targetFormTxnId,
            targetActId,
            fieldDataTypeId;
        
        let tempObj = {};        
            tempObj.organization_id = newReq.organization_id;
            tempObj.form_transaction_id = newReq.form_transaction_id;

        let finalArr = new Array();        

        for(let i of inlineData) {         
            tempObj.form_id = i.source_form_id;
            tempObj.field_id = i.source_field_id;
            //console.log(tempObj);
            
            resp = await getFieldValue(tempObj);            
                fieldDataTypeId = resp[0].data_type_id;
                fieldValue = resp[0].data_entity_text_1;

            txn_id = await activityCommonService.getActivityTimelineTransactionByFormId713(newReq, newReq.activity_id, i.target_form_id);
            global.logger.write('conLog',txn_id,{},{});
            (txn_id.length > 0) ?
                targetFormTxnId = txn_id[0].data_form_transaction_id:
                targetFormTxnId = 0;
            
            //If txn id is not there then add activity and get the txn id
            if(targetFormTxnId === 0 ) {
                await new Promise(async (resolve, reject)=>{
                    let newReqForActCreation = Object.assign({}, newReq);
                    targetActId = await cacheWrapper.getActivityIdPromise();
                    targetFormTxnId = await cacheWrapper.getFormTransactionIdPromise();                    
                    
                    newReqForActCreation.activity_id = targetActId;
                    newReqForActCreation.activity_title = "Bot created new activity Id";
                    newReqForActCreation.activity_description = "Bot created new activity Id";
                    newReqForActCreation.activity_datetime_start = util.getCurrentUTCTime();
                    newReqForActCreation.activity_datetime_end = util.getCurrentUTCTime();
                    newReqForActCreation.message_unique_id = util.getMessageUniqueId(request.asset_id);
                    newReqForActCreation.form_transaction_id = targetFormTxnId;
                    newReqForActCreation.activity_inline_data = JSON.stringify({
                                                                    "form_id": i.target_form_id,
                                                                    "field_id": i.target_field_id,
                                                                    "field_value": fieldValue,
                                                                    "form_transaction_id": targetFormTxnId,
                                                                    "field_data_type_id": fieldDataTypeId        
                                                                });

                    newReqForActCreation.activity_type_id = request.activity_type_id;
                    newReqForActCreation.activity_form_id = i.target_form_id;

                    activityService.addActivity(newReqForActCreation, (err, resp)=>{
                            //return (err === false) ? resolve() : reject();

                            if(err === false) {
                                /*let fire713OnNewOrderFileRequest = Object.assign({}, newReqForActCreation);
                                fire713OnNewOrderFileRequest.activity_id = request.activity_id;
                                fire713OnNewOrderFileRequest.form_transaction_id = targetFormTxnId;
                                fire713OnNewOrderFileRequest.activity_timeline_collection = newReqForActCreation.activity_inline_data;
                                fire713OnNewOrderFileRequest.activity_stream_type_id = 713;
                                fire713OnNewOrderFileRequest.form_id = i.target_form_id;
                                fire713OnNewOrderFileRequest.asset_message_counter = 0;
                                fire713OnNewOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
                                fire713OnNewOrderFileRequest.activity_timeline_text = '';
                                fire713OnNewOrderFileRequest.activity_timeline_url = '';
                                fire713OnNewOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                                fire713OnNewOrderFileRequest.flag_timeline_entry = 1;
                                fire713OnNewOrderFileRequest.service_version = '1.0';
                                fire713OnNewOrderFileRequest.app_version = '2.8.16';
                                fire713OnNewOrderFileRequest.device_os_id = 7;
                                fire713OnNewOrderFileRequest.data_activity_id = request.activity_id;
                               
                                activityTimelineService.addTimelineTransaction(fire713OnNewOrderFileRequest, (err, resp)=>{
                                    return (err === false)? resolve() : reject();
                                });*/

                                timeine713Entry(newReq, i.target_form_id, targetFormTxnId, i.target_field_id, fieldValue, fieldDataTypeId);
                            } else {
                                return reject();
                            }
                    });                    
                });
            } else {               

                targetFormTxnId = request.target_form_transaction_id;
                targetActId = request.target_activity_id;

                let actDetails = await activityCommonService.getActivityDetailsPromise(newReq, targetActId);
                let activityInlineData = JSON.parse(actDetails[0].activity_inline_data);

                if(activityInlineData.length > 0 ){
                    for(let x in activityInlineData) {
                        if(x.field_id === i.target_field_id) {
                            x.field_value = fieldValue;
                        }
                    }                    
                    activityInlineData = JSON.stringify(activityInlineData);
                } else {
                    activityInlineData = JSON.stringify({
                        "form_id": i.target_form_id,
                        "field_id": i.target_field_id,
                        "field_value": fieldValue,
                        "form_transaction_id": targetFormTxnId,
                        "field_data_type_id": fieldDataTypeId        
                    });
                }

                await timeine713Entry(newReq, i.target_form_id, targetFormTxnId, i.target_field_id, fieldValue, fieldDataTypeId);
            }           

            //insert in new formId field id with the value retrieved i.e. resp[0].data_entity_text_1
            let rowDataArr = {
                form_id : i.target_form_id,
                field_id : i.target_field_id,
                field_value: fieldValue,
                form_transaction_id: targetFormTxnId,
                field_data_type_id: fieldDataTypeId
            };
            finalArr.push(rowDataArr);
        }        
        global.logger.write('conLog', 'Final Json : ',{},{});
        global.logger.write('conLog', finalArr,{},{});
        newReq.target_form_transaction_id = targetFormTxnId;
        newReq.target_activity_id = targetActId;
        newReq.activity_inline_data = finalArr;
        return await alterFormActivity(newReq);
    }

    //Bot Step Adding a participant
    async function addParticipant(request, inlineData) {
        let newReq = Object.assign({}, request);
        let resp;
        global.logger.write('conLog', inlineData, {}, {});
        newReq.message_unique_id = util.getMessageUniqueId(request.asset_id);

        let type = Object.keys(inlineData);        
        global.logger.write('conLog', type,{},{});

        if(type[0] === 'static') {                
            newReq.flag_asset = inlineData[type[0]].flag_asset;      

            if(newReq.flag_asset === 1){
                //Use Asset Id
                newReq.desk_asset_id = inlineData[type[0]].desk_asset_id;    
                newReq.phone_number = 0;
            } else {
                //Use Phone Number
                newReq.desk_asset_id = 0;    
                newReq.phone_number = inlineData[type[0]].phone_number;
            }            
            
        } else if(type[0] === 'dynamic') {
            newReq.desk_asset_id = 0;
            newReq.form_id = inlineData[type[0]].form_id;
            newReq.field_id = inlineData[type[0]].field_id;            

            resp = await getFieldValue(newReq);
            newReq.phone_country_code = String(resp[0].data_entity_text_1).split('|')[0];
            newReq.phone_number = String(resp[0].data_entity_text_1).split('|')[1];
        }       
        
        return await addParticipantStep(newReq);
    }

    //Bot Step Firing an eMail
    async function fireEmail(request, inlineData) {
        let newReq = Object.assign({}, request);        
        let resp;

        global.logger.write('conLog', inlineData,{},{});
        let type = Object.keys(inlineData);        
        global.logger.write('conLog', type,{},{});

        if(type[0] === 'static') {            
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.email_id = inlineData[type[0]].email;
        } else if(type[0] === 'dynamic') {
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.form_id = inlineData[type[0]].form_id;
            newReq.field_id = inlineData[type[0]].field_id;

            resp = await getFieldValue(newReq);            
            newReq.email_id = resp[0].data_entity_text_1;       
        }
        
        let dbResp = await getCommTemplates(newReq);
        let retrievedCommInlineData = JSON.parse(dbResp[0].communication_inline_data);        
        global.logger.write('conLog', retrievedCommInlineData.communication_template.email,{},{});
        
        await sendEmail(newReq, retrievedCommInlineData.communication_template.email);

        //Make a 715 timeline entry - (715 streamtypeid is for email)
        let activityTimelineCollection = {
            email: retrievedCommInlineData.communication_template.email            
        };

        let fire715OnWFOrderFileRequest = Object.assign({}, newReq);
            fire715OnWFOrderFileRequest.activity_id = newReq.activity_id;
            fire715OnWFOrderFileRequest.form_transaction_id = newReq.form_transaction_id;
            fire715OnWFOrderFileRequest.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
            fire715OnWFOrderFileRequest.activity_stream_type_id = 715;
            fire715OnWFOrderFileRequest.form_id = 0;
            fire715OnWFOrderFileRequest.asset_message_counter = 0;
            fire715OnWFOrderFileRequest.activity_type_category_id = 48;
            fire715OnWFOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
            fire715OnWFOrderFileRequest.activity_timeline_text = '';
            fire715OnWFOrderFileRequest.activity_timeline_url = '';
            fire715OnWFOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            fire715OnWFOrderFileRequest.flag_timeline_entry = 1;
            fire715OnWFOrderFileRequest.service_version = '1.0';
            fire715OnWFOrderFileRequest.app_version = '2.8.16';
            fire715OnWFOrderFileRequest.device_os_id = 7;
            fire715OnWFOrderFileRequest.data_activity_id = request.activity_id;
        
        return new Promise((resolve, reject)=>{
            activityTimelineService.addTimelineTransaction(fire715OnWFOrderFileRequest, (err, resp)=>{
                (err === false)? resolve() : reject(err);
            });
        });
    }

    //Bot Step Firing a Text Message
    async function fireTextMsg(request, inlineData) {       
        let newReq = Object.assign({}, request);
        let resp;

        global.logger.write('conLog', inlineData,{},{});
        let type = Object.keys(inlineData);
        global.logger.write('conLog', type,{},{});

        if(type[0] === 'static') {    
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.country_code = inlineData[type[0]].phone_country_code;
            newReq.phone_number = inlineData[type[0]].phone_number;
        } else if(type[0] === 'dynamic') {
            newReq.communication_id = inlineData[type[0]].template_id;
            newReq.form_id = inlineData[type[0]].form_id;
            newReq.field_id = inlineData[type[0]].field_id;
            newReq.country_code = 91;

            resp = await getFieldValue(newReq);         
            newReq.phone_number = resp[0].data_entity_text_1;            
        }

        let dbResp = await getCommTemplates(newReq);
        let retrievedCommInlineData = JSON.parse(dbResp[0].communication_inline_data);
        newReq.smsText = retrievedCommInlineData.communication_template.text.message;        
        global.logger.write('conLog', newReq.smsText,{},{});        

        util.sendSmsHorizon(newReq.smsText, newReq.country_code, newReq.phone_number, function (err, data) {
            if (err === false) {
                global.logger.write('debug', 'SMS HORIZON RESPONSE: '+JSON.stringify(data), {}, {});
                global.logger.write('conLog', data.response, {}, {});                
            } else {                
                global.logger.write('conLog', data.response, {}, {});                
            }
        });

        //Make a 716 timeline entry - (716 streamtypeid is for email)
        let activityTimelineCollection = {
            email: retrievedCommInlineData.communication_template.text            
        };

        let fire716OnWFOrderFileRequest = Object.assign({}, newReq);
            fire716OnWFOrderFileRequest.activity_id = newReq.activity_id;
            fire716OnWFOrderFileRequest.form_transaction_id = newReq.form_transaction_id;
            fire716OnWFOrderFileRequest.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
            fire716OnWFOrderFileRequest.activity_stream_type_id = 716;
            fire716OnWFOrderFileRequest.form_id = 0;
            fire716OnWFOrderFileRequest.asset_message_counter = 0;
            fire716OnWFOrderFileRequest.activity_type_category_id = 48;
            fire716OnWFOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
            fire716OnWFOrderFileRequest.activity_timeline_text = '';
            fire716OnWFOrderFileRequest.activity_timeline_url = '';
            fire716OnWFOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            fire716OnWFOrderFileRequest.flag_timeline_entry = 1;
            fire716OnWFOrderFileRequest.service_version = '1.0';
            fire716OnWFOrderFileRequest.app_version = '2.8.16';
            fire716OnWFOrderFileRequest.device_os_id = 7;
            fire716OnWFOrderFileRequest.data_activity_id = request.activity_id;
        
        return new Promise((resolve, reject)=>{
            activityTimelineService.addTimelineTransaction(fire716OnWFOrderFileRequest, (err, resp)=>{
                (err === false)? resolve() : reject(err);
            });
        });
    }

    //Bot Step Firing an API
    async function fireApi(request, inlineData) {
        let newReq = Object.assign({}, request);
        let resp;        
        
        global.logger.write('conLog', inlineData,{},{});
        let type = Object.keys(inlineData);        
        global.logger.write('conLog', type,{},{});

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

            for(let i of newReq.parameters) {                
                resp = await getFieldValue({
                                            "form_transaction_id": newReq.form_transaction_id,
                                            "form_id": i.parameter_value.form_id,
                                            "field_id": i.parameter_value.field_id,
                                            "organization_id": newReq.organization_id
                                        });                
                global.logger.write('conLog', resp,{},{});
                i.parameter_value = resp[0].data_entity_text_1;
            }
        }
        
        let response = await makeAPIRequest(newReq, newReq.parameters);
        
        //Make a timeline entry
        let activityTimelineCollection = {
            type: type[0],
            endpoint: newReq.endpoint,
            method: newReq.method,
            protocol: newReq.protocol,
            parameters: newReq.parameters,
            response: response           
        };
                
        let fire714OnNewOrderFileRequest = Object.assign({}, newReq);
            fire714OnNewOrderFileRequest.activity_id = newReq.activity_id;
            fire714OnNewOrderFileRequest.form_transaction_id = newReq.form_transaction_id;
            fire714OnNewOrderFileRequest.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
            fire714OnNewOrderFileRequest.activity_stream_type_id = 714;
            fire714OnNewOrderFileRequest.form_id = 0;
            fire714OnNewOrderFileRequest.asset_message_counter = 0;
            fire714OnNewOrderFileRequest.activity_type_category_id = 48;
            fire714OnNewOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
            fire714OnNewOrderFileRequest.activity_timeline_text = '';
            fire714OnNewOrderFileRequest.activity_timeline_url = '';
            fire714OnNewOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            fire714OnNewOrderFileRequest.flag_timeline_entry = 1;
            fire714OnNewOrderFileRequest.service_version = '1.0';
            fire714OnNewOrderFileRequest.app_version = '2.8.16';
            fire714OnNewOrderFileRequest.device_os_id = 7;
            fire714OnNewOrderFileRequest.data_activity_id = request.activity_id;
        
        return new Promise((resolve, reject)=>{
            activityTimelineService.addTimelineTransaction(fire714OnNewOrderFileRequest, (err, resp)=>{
                (err === false)? resolve() : reject(err);
            });
        });
    }

    //Bot Step Altering workflow completion percentage
    async function alterWFCompletionPercentage(request, inlineData) {
        let newrequest = Object.assign({},request);            

        global.logger.write('conLog', inlineData.workflow_percentage_contribution,{},{});
        newrequest.workflow_completion_percentage = inlineData.workflow_percentage_contribution;
        let wfCompletionPercentage = newrequest.workflow_completion_percentage;
        let resp = await getQueueActivity(newrequest, newrequest.activity_id);        
        global.logger.write('conLog', resp,{},{});

        if(Number(wfCompletionPercentage) !== 0) {
            
            //Adding to OMT Queue                
            newrequest.start_from = 0;
            newrequest.limit_value = 1;               
            
            //Checking the queuemappingid
            let queueActivityMappingData = await (activityCommonService.fetchQueueActivityMappingId(newrequest, resp[0].queue_id));            
            global.logger.write('conLog', 'queueActivityMappingData : ',{},{});
            global.logger.write('conLog', queueActivityMappingData,{},{});
            
            if(queueActivityMappingData.length > 0){
                let queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;  
                let queueActMapInlineData = JSON.parse(queueActivityMappingData[0].queue_activity_mapping_inline_data);
                
                queueActMapInlineData.queue_sort.caf_completion_percentage += wfCompletionPercentage;                
                global.logger.write('conLog', 'Updated Queue JSON : ',{},{});
                global.logger.write('conLog', queueActMapInlineData,{},{});
                
                let data = await (activityCommonService.queueActivityMappingUpdateInlineData(newrequest, queueActivityMappingId, JSON.stringify(queueActMapInlineData)));                
                global.logger.write('conLog', 'Updating the Queue Json : ',{},{});
                global.logger.write('conLog', data,{},{});
                
                activityCommonService.queueHistoryInsert(newrequest, 1402, queueActivityMappingId).then(()=>{});                
            }
        }
    }

    function sendEmail (request, emailJson) {
        return new Promise((resolve, reject)=>{            
            global.logger.write('conLog', "\x1b[35m [Log] Inside SendEmail \x1b[0m",{},{});
            const emailSubject = emailJson.subject;
            const Template = emailJson.body;

            request.email_sender = 'OMT.IN1@vodafoneidea.com'; 
            request.email_sender_name = 'Vodafoneidea';
            
            global.logger.write('conLog', emailSubject,{},{});
            global.logger.write('conLog', Template,{},{});
                    
            util.sendEmailV3(request,
                request.email_id,
                emailSubject,
                "IGNORE",
                Template,
                (err, data) => {
                    if (err) {                        
                        global.logger.write('conLog', "[Send Email On Form Submission | Error]: ",{},{});
                        global.logger.write('conLog', err,{},{});
                    } else {                        
                        global.logger.write('conLog', "[Send Email On Form Submission | Response]: " + "Email Sent",{},{});
                        global.logger.write('conLog', data,{},{});
                    }

                    resolve();
                });
        });        
    }
    
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
    }

    //Get the field value based on form id and form_transaction_id
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

    async function addParticipantStep(request) {
        let dataResp,
            deskAssetData;
        let assetData = {};

        if(request.desk_asset_id === 0) {
            dataResp  = await getAssetDetailsOfANumber(request);
            
            for(let i of dataResp){
                if(i.asset_type_category_id === 3) {
                    deskAssetData = i;
                }
            }
        } else {            
            dataResp = await getAssetDetails({
                                                "organization_id": request.organization_id,
                                                "asset_id": request.desk_asset_id
                                            });                                       
            deskAssetData = dataResp[0];
        }        
        global.logger.write('conLog', 'Desk Asset Details : ',{},{});           
        global.logger.write('conLog', deskAssetData,{},{});           
            
        assetData.desk_asset_id = deskAssetData.asset_id;
        assetData.first_name = deskAssetData.operating_asset_first_name;
        assetData.contact_phone_number = deskAssetData.operating_asset_phone_number;
        assetData.contact_phone_country_code = deskAssetData.operating_asset_phone_country_code;
        assetData.asset_type_id = deskAssetData.asset_type_id;

        return await addDeskAsParticipant(request, assetData);
        
        /*if(dataResp.length > 0) { //status is true means service desk exists
             
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
        }*/
    }

    /*function createAssetContactDesk(request, customerData) {
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
            };
            
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
    }*/

    async function addDeskAsParticipant(request, assetData) {
        let addParticipantRequest = {
             organization_id: request.organization_id,
             account_id: request.account_id,
             workforce_id: request.workforce_id,
             asset_id: request.asset_id,             
             asset_message_counter: 0,
             activity_id: Number(request.activity_id),
             activity_access_role_id: 29,
             activity_type_category_id: 48,
             activity_type_id: 0,
             activity_participant_collection: JSON.stringify([{
                 "access_role_id": 29,
                 "account_id": request.account_id,
                 "activity_id": Number(request.activity_id),
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
             service_version: 1.0,
             app_version: "2.5.5",
             device_os_id: 7
             };
             
             return await new Promise((resolve, reject)=>{
                activityParticipantService.assignCoworker(addParticipantRequest, (err, resp)=>{
                    (err === false)? resolve() : reject(err);
                 });
             });

    }

    async function makeAPIRequest(request, parametersJson){
        let url;
        let formParams = {};
        if(request.method === 'GET') {
            url = `${request.protocol}://${request.endpoint}`;            
            makeRequest(url, function (error, response, body) {           
                global.logger.write('conLog', error,{},{});
                global.logger.write('conLog', response && response.statusCode,{},{});
                global.logger.write('conLog', body,{},{});
            });
        } else if(request.method === 'POST') {

            for(let i of parametersJson) {                
                formParams[i.parameter_key] =  i.parameter_value;
            }

            global.logger.write('conLog', 'formParams : ',{},{});
            global.logger.write('conLog', formParams,{},{});
            url = `${request.protocol}://${request.endpoint}`;            
            
            return new Promise((resolve, reject)=>{
                makeRequest.post({url:url, form: formParams}, (err,httpResponse,body)=>{
                    //global.logger.write('conLog', httpResponse,{},{});                    
                    global.logger.write('conLog', 'error:',{},{});
                    global.logger.write('conLog', err,{},{});
                    global.logger.write('conLog', body,{},{});
                    
                    (err === null)? resolve(body) : reject(err);
                });
            });            
        }
    }

    async function alterFormActivity(request) {
        var logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;

        let //newFieldValue,
            oldFieldValue,            
            data,
            inline_data_present = 1;
        
        
        var activityInlineData = request.activity_inline_data;
        var newData = activityInlineData;        
        global.logger.write('conLog', 'newData from Request: ',{},{});
        global.logger.write('conLog', newData,{},{});

        data = await activityCommonService.getActivityByFormTransaction({   "activity_id" : 1,
                                                                            "form_transaction_id": request.target_form_transaction_id,
                                                                            "organization_id": request.organization_id
                                                                        });

        global.logger.write('conLog', 'Data from activity_list: ',{},{});
        global.logger.write('conLog', data,{},{});
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
            //newFieldValue = i.field_value;            
                        
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
                global.logger.write('conLog', 'VALUE of i : ' + i,{},{});
                global.logger.write('conLog', 'retrievedInlineData : ', retrievedInlineData,{});                
                Array.from(retrievedInlineData).push(i);
                //retrievedInlineData.push(i);
                oldFieldValue = i.field_value;
            }         
            
            let respData = await getLatestUpdateSeqId({ "form_transaction_id" : request.target_form_transaction_id,
                                                        "form_id" : i.form_id,
                                                        "field_id" : i.field_id,
                                                        "organization_id" : request.organization_id
                                                     });
            
            global.logger.write('conLog', 'respData : ', respData,{});            
            
            if (respData.length > 0) {
                    let x = respData[0];                    
                    global.logger.write('conLog', 'update_sequence_id : ', x.update_sequence_id,{});                    
                    request.update_sequence_id = ++x.update_sequence_id;
            } else {
                request.update_sequence_id = 1;
            }

            await putLatestUpdateSeqId(request, activityInlineData);
        }

        request.activity_inline_data = JSON.stringify(retrievedInlineData);
        let content = '';
        if (String(oldFieldValue).trim().length === 0) {
            //content = `In the ${i.form_name}, the field ${i.field_name} was updated to ${newFieldValue}`;
        } else {
            //content = `In the ${i.form_name}, the field ${i.field_name} was updated from ${oldFieldValue} to ${newFieldValue}`;
        }
        
        let activityTimelineCollection = {
            form_submitted: retrievedInlineData,
            subject: 'Field Updated', //`Field Updated for ${i.form_name}`,
            content: content,
            mail_body: `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
            attachments: [],
            asset_reference: [],
            activity_reference: [],
            form_approval_field_reference: []
        };
        
        request.activity_timeline_collection = JSON.stringify(activityTimelineCollection);
        let reqForInlineAlter = Object.assign({}, request);
            reqForInlineAlter.form_id = newData[0].form_id;
            reqForInlineAlter.form_transaction_id = request.target_form_transaction_id;
        
        activityUpdateService.alterActivityInline(reqForInlineAlter, (err, resp)=>{
            return (err === false) ? {} : Promise.reject(err);
        });

        //return {};
    }
    
    async function getLatestUpdateSeqId(request) {
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
    }

    async function putLatestUpdateSeqId(request, activityInlineData){
        
        for(let row of activityInlineData) {
            var params = new Array(
                request.target_form_transaction_id, //0
                row.form_id || 0, //1
                row.field_id || 0, //2
                request.data_type_combo_id || 0, //3
                request.target_activity_id, //4
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
                global.logger.write('conLog', 'dataTypeId : '+ dataTypeId,{},{});
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
                        params[18] = row.field_value;
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
                        //approvalFields.push(row.field_id);
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
                
                let queryString = util.getQueryString('ds_p1_activity_form_transaction_insert_field_update', params);
                if (queryString != '') {
                    try {
                        await db.executeQueryPromise(0, queryString, request);
                    } catch(err) {
                        global.logger.write('debug', err,{},{});
                    }                    
                }
        }
        return {};   
    }

    async function getQueueActivity(request, idActivity) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            idActivity	            
        );
        let queryString = util.getQueryString('ds_v1_queue_activity_mapping_select_activity', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
            }
    }

    async function getAssetDetailsOfANumber(request) {
        var paramsArr = new Array(
            request.organization_id || 0,
            request.phone_number,
            request.country_code || 91
        );
        var queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);                
        }
    }

    async function getAssetDetails(request) {
        var paramsArr = new Array(
            request.organization_id,
            request.asset_id
        );
        var queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
        }
    }

    async function timeine713Entry(request, formId, formTxnId, fieldId, fieldValue, fieldDataTypeId) {       
        let actDetails = await activityCommonService.getActivityDetailsPromise(request, request.target_activity_id);
        let activityInlineData = JSON.parse(actDetails[0].activity_inline_data);
        
        if(activityInlineData.length > 0 ){
            for(let x in activityInlineData) {
                if(x.field_id === fieldId) {
                    x.field_value = fieldValue;
                }
            }                    
            activityInlineData = JSON.stringify(activityInlineData);
        } else {
            activityInlineData = JSON.stringify({
                "form_id": formId,
                "field_id": fieldId,
                "field_value": fieldValue,
                "form_transaction_id": formTxnId,
                "field_data_type_id": fieldDataTypeId
            });
        }
        
        let fire713OnWFOrderFileRequest = Object.assign({},request);
            fire713OnWFOrderFileRequest.activity_id = request.workflow_activity_id;
            fire713OnWFOrderFileRequest.form_transaction_id = formTxnId;
            fire713OnWFOrderFileRequest.activity_stream_type_id = 713;
            fire713OnWFOrderFileRequest.form_id = formId;
            fire713OnWFOrderFileRequest.asset_message_counter = 0;
            fire713OnWFOrderFileRequest.message_unique_id = util.getMessageUniqueId(request.asset_id);
            fire713OnWFOrderFileRequest.activity_timeline_text = '';
            fire713OnWFOrderFileRequest.activity_timeline_url = '';
            fire713OnWFOrderFileRequest.activity_timeline_collection = JSON.stringify({
                "mail_body": `Form Updated at ${moment().utcOffset('+05:30').format('LLLL')}`,
                "subject": "Form Name",
                "content": `Form Name`,
                "asset_reference": [],
                "activity_reference": [],
                "form_approval_field_reference": [],
                "form_submitted": JSON.parse(activityInlineData),
                "attachments": []
            });
            fire713OnWFOrderFileRequest.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            fire713OnWFOrderFileRequest.flag_timeline_entry = 1;
            fire713OnWFOrderFileRequest.service_version = '1.0';
            fire713OnWFOrderFileRequest.app_version = '2.8.16';
            fire713OnWFOrderFileRequest.device_os_id = 7;
            fire713OnWFOrderFileRequest.data_activity_id = request.activity_id;
        
        activityTimelineService.addTimelineTransaction(fire713OnWFOrderFileRequest, (err, resp)=>{
            return (err === false)? Promise.resolve() : Promise.reject(err);
        });
    }

}


module.exports = BotService;
