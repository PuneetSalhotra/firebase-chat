/* eslint-disable no-case-declarations */
/* 
 * author: Sri Sai Venkatesh
 */

function ActivityService(objectCollection) {

    var db = objectCollection.db;
    var cacheWrapper = objectCollection.cacheWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
    var queueWrapper = objectCollection.queueWrapper;
    // var activityPushService = objectCollection.activityPushService;
    var responseactivityData = {};
    const suzukiPdfEngine = require('../utils/suzukiPdfGenerationEngine');
    const moment = require('moment');

    const ActivityListingService = require("../services/activityListingService");
    const activityListingService = new ActivityListingService(objectCollection);

    const ActivityPushService = require('../services/activityPushService');
    const activityPushService = new ActivityPushService(objectCollection);

    const fridsJson = require('../vodafone/utils/frids');

    const logger = require("../logger/winstonLogger");
    const self = this;

    this.addActivity = function (request, callback) {

        request.flag_retry = request.flag_retry || 0;
        request.flag_offline = request.flag_offline || 0;

        var logDatetime = util.getCurrentUTCTime();
        responseactivityData = {
            activity_id: request.activity_id
        };
        request['datetime_log'] = logDatetime;
        var activityTypeCategroyId = Number(request.activity_type_category_id);
        new Promise((resolve, reject) => {
            if (activityTypeCategroyId !== 8)
                return resolve();
            updateMailInlineJson(request, function (err, updatedJson) {
                if (err === false) {
                    request.activity_inline_data = updatedJson;
                    return resolve();
                } else {
                    callback(true, false);
                    //return reject();
                }
            });
            //kafkaProducer.on('ready', resolve);
        }).then(() => {
            activityListInsert(request, function (err, boolResult) {
                activityCommonService.updateAssetLocation(request, (err, data) =>{});
                if (err === false) {

                    var activityStreamTypeId = 1;
                    var activityAssetMappingAsset = Number(request.asset_id);
                    var updateTypeId = 0;
                    switch (activityTypeCategroyId) {
                        case 1: // to-do
                            activityStreamTypeId = 401;
                            break;
                        case 2: // notepad 
                            activityStreamTypeId = 501;
                            break;
                        case 3: //plant
                            break;
                        case 4: //employee id card
                            activityStreamTypeId = 101;
                            var employeeJson = JSON.parse(request.activity_inline_data);
                            activityAssetMappingAsset = employeeJson.employee_asset_id;
                            break;
                        case 5: //Co-worker Contact Card
                            activityStreamTypeId = 203;
                            break;
                        case 6: //  External Contact Card - Customer
                            activityStreamTypeId = 1103;
                            break;
                        case 7: //  speed Dial Contact 
                            activityStreamTypeId = 1;
                            break;
                        case 8: //  Mail
                            activityStreamTypeId = 1701;
                            break;
                        case 50: //Support
                            activityStreamTypeId = 2201;
                            break;
                        case 51: //Feedback
                            activityStreamTypeId = 2301;
                            break;
                        case 48:
                        case 9: //form
                            activityStreamTypeId = 701;
                            break;
                        case 10: //document
                            activityStreamTypeId = 301;
                            break;
                        case 11: //folder
                            activityStreamTypeId = 1401;
                            break;
                        case 14: //voice call
                            activityStreamTypeId = 801;
                            break;
                        case 15: //video conference
                            activityStreamTypeId = 1601;
                            break;
                        case 16: //video conference
                            activityStreamTypeId = 23001;
                            break;
                        case 28: // post-it
                            activityStreamTypeId = 901;
                            break;
                        case 29: // External Contact Card - Supplier
                            activityStreamTypeId = 1203;
                            break;
                        case 30: //contact group
                            activityStreamTypeId = 1301;
                            break;
                            //Added by Nani Kalyan
                        case 31: //Calendar Event
                            activityStreamTypeId = 501;
                            break;
                            //Added by Nani Kalyan
                        case 32: //Customer Request
                            activityStreamTypeId = 601;
                            break;
                            //Added by Nani Kalyan
                        case 33: //Visitor Request
                            activityStreamTypeId = 1301;
                            break;
                            //Added by Nani Kalyan
                        case 34: //Time Card
                            activityStreamTypeId = 1501;
                            break;
                            /////////////////////////////////
                            //PAM
                        case 36: //Menu Item
                            activityStreamTypeId = 19001;
                            break;
                        case 37: //Reservation
                            activityStreamTypeId = 18001;
                            break;
                        case 38: //Item Order
                            activityStreamTypeId = 21001;
                            break;
                        case 39: //Inventory
                            activityStreamTypeId = 20001;
                            break;
                        case 40: //Payment
                            activityStreamTypeId = 22004;
                            break;
                        case 41: //Event
                            activityStreamTypeId = 17001;
                            break;
                        case 42: //PAM Enquiry
                            activityStreamTypeId = 1801;
                            var inlineJson = JSON.parse(request.activity_inline_data);
                            util.pamSendSmsMvaayoo('Dear Sir/Madam, Our executive will contact you soon.', inlineJson.country_code, inlineJson.phone_number, function (err, res) {});
                            break;
                        case 52: activityStreamTypeId = 26001;
                                 break;
                        default:
                            activityStreamTypeId = 1; //by default so that we know
                            //console.log('adding streamtype id 1');
                            global.logger.write('conLog', 'adding streamtype id 1', {}, request);
                            break;
                    }
                    //console.log('streamtype id is: ' + activityStreamTypeId)
                    global.logger.write('conLog', 'streamtype id is: ' + activityStreamTypeId, {}, request);
                    assetActivityListInsertAddActivity(request, async function (err, status) {
                        if (err === false) {

                            /*alterActivityFlagFileEnabled(request).then(() => {});
                            activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});
                            activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});*/

                            await alterActivityFlagFileEnabled(request);
                            await activityCommonService.assetTimelineTransactionInsertAsync(request, {}, activityStreamTypeId);
                            await activityCommonService.activityTimelineTransactionInsertAsync(request, {}, activityStreamTypeId);

                            let activityTitle = "Form Submitted";

                            if (activityTypeCategroyId === 9) {

                                if (Number(request.organization_id) === 860 || Number(request.organization_id) === 858 ||
                                    Number(request.organization_id) === 868) {

                                    switch (Number(request.activity_form_id)) {
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER:
                                            activityTitle = "New Order";
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.ORDER_SUPPLEMENTARY:
                                            activityTitle = "Order Supplementary";
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.FR:
                                            activityTitle = "Feasibility Report";
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.CRM:
                                            activityTitle = "Customer Details";
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.HLD:
                                            activityTitle = "HLD Form";
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.BC_HLD:
                                            activityTitle = "BC_HLD Form";
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.NEW_CUSTOMER:
                                            activityTitle = "New Customer Form";
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.EXISTING_CUSTOMER:
                                            activityTitle = "Existing Customer Form";
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.OMT_APPROVAL:
                                            activityTitle = "OMT Approval Form";
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.ACCOUNT_MANAGER_APPROVAL:
                                            activityTitle = "Account Manager Approval Form";
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.CUSTOMER_APPROVAL:
                                            activityTitle = "Customer Approval Form";
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.CAF:
                                            activityTitle = "CAF Form";
                                            break;
                                        default:
                                            activityTitle = "Form Submitted";
                                    }

                                }

                                let newRequest = Object.assign({}, request);

                                // Fire a 705 request for this activity
                                let activityTimelineCollectionFor705 = {
                                    "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                                    "subject": activityTitle,
                                    //"content": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                                    "content": 'Form Submitted',
                                    "asset_reference": [],
                                    "activity_reference": [],
                                    "form_approval_field_reference": [],
                                    "form_submitted": JSON.parse(request.activity_inline_data),
                                    "attachments": []
                                };

                                newRequest.data_activity_id = Number(request.activity_id);
                                newRequest.activity_timeline_collection = JSON.stringify(activityTimelineCollectionFor705);
                                newRequest.activity_stream_type_id = 705;
                                newRequest.flag_timeline_entry = 1;
                                newRequest.device_os_id = 7;
                                newRequest.form_id = request.activity_form_id;

                                let displayFileEvent = {
                                    name: "addTimelineTransaction",
                                    service: "activityTimelineService",
                                    //method: "addTimelineTransaction",
                                    method: "addTimelineTransactionAsync",
                                    payload: newRequest
                                };

                                await queueWrapper.raiseActivityEventPromise(displayFileEvent, request.activity_id);
                                await addValueToWidgetForAnalytics(request);

                                //Grene Account - update FRID Timeline
                                /*let i;
                                for(i=0; i<fridsJson.length; i++) {
                                    if(Number(request.activity_form_id) === fridsJson[i].form_id) {
                                        //fridsJson[i].field_id
                                        //let requestFormData = JSON.parse(request.activity_inline_data);
                                    }
                                }*/
                            }

                            if (activityTypeCategroyId === 10 && request.hasOwnProperty('owner_asset_id')) {
                                if (request.owner_asset_id !== request.asset_id) {
                                    activityPushService.sendPush(request, objectCollection, 0, function () {});
                                    activityCommonService.updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) {});
                                }
                            }

                            if (activityTypeCategroyId === 10 && Number(request.activity_sub_type_id) === 1) {
                                updateTaskCreatedCnt(request).then(() => {});
                            }

                            // do the timeline transactions here..                    
                            if (activityTypeCategroyId === 38) {
                                addIngredients(request);
                            }

                            if (activityTypeCategroyId === 40) {
                                //if(request.hasOwnProperty('is_room_posting'))
                                activityCommonService.processReservationBilling(request, request.activity_parent_id).then(() => {});
                            }

                            //Submitted Rollback Form
                            if (activityTypeCategroyId === 9 && 
                                (
                                    Number(request.activity_form_id) === 803 || 
                                    Number(request.form_id) === 803
                                )
                                ) {
                                handleRollBackFormSubmission(request);
                            }

                            if (request.activity_type_category_id == 48) {
                                global.logger.write('conLog', '*****ADD ACTIVITY :HITTING WIDGET ENGINE*******', {}, request);
                                request['source_id'] = 1;
                                //sendRequesttoWidgetEngine(request);

                                //updateChannelActivity(request, 9, request.activity_id, 48).then((result)=>{                        // get the widget against the workflow type                                    
//
                                //});
                                await updateChannelActivity(request, 9, request.activity_id, 48);

                                let totalvalue = 0;
                                let finalValue = 0;
                                request['dedicated_activity_id'] = 0; //result[0].activity_id;
                                let requestFormData = JSON.parse(request.activity_inline_data);
                                let otc_1 = 0, arc_1 = 0, otc_2= 0, arc_2 = 0;
                                
                                let widgetRow = await activityCommonService.getWidgetByActivityType(request);                                
                                console.log('WIDGET ROW :: ', widgetRow.length);
                                const widgetFieldsStatusesData = util.widgetFieldsStatusesData();
                                let creditDebitFields = widgetFieldsStatusesData.CREDIT_DEBIT_FIELDS;

                                if(widgetRow.length > 0){
                                    console.log('WIDGET ROW EXISTIS ::'+widgetRow[0].widget_id);
                                    request['widget_id'] = widgetRow[0].widget_id;
                                            
                                    if(widgetRow[0].widget_entity2_id > 0){                                               
                                        forEachAsync(requestFormData, function (next, fieldObj) {
                                            console.log('LOOP ::' + request.activity_type_id + ' ' + fieldObj.field_id);
                                            if (widgetRow[0].widget_entity2_id == fieldObj.field_id) {
                                                let temp_value = isNaN(fieldObj.field_value) ? 0 : fieldObj.field_value;
                                                otc_1 = temp_value;
                                                request['otc_1'] = temp_value;
                                            } else if (widgetRow[0].widget_entity3_id == fieldObj.field_id) {
                                                let temp_value = isNaN(fieldObj.field_value) ? 0 : fieldObj.field_value;
                                                arc_1 = temp_value;
                                                request['arc_1'] = temp_value;
                                            } else if (widgetRow[0].widget_entity4_id == fieldObj.field_id) {
                                                let temp_value = isNaN(fieldObj.field_value) ? 0 : fieldObj.field_value;
                                                otc_2 = temp_value;
                                                request['otc_2'] = temp_value;
                                            } else if (widgetRow[0].widget_entity5_id == fieldObj.field_id) {
                                                let temp_value = isNaN(fieldObj.field_value) ? 0 : fieldObj.field_value;
                                                arc_2 = temp_value;
                                                request['arc_2'] = temp_value;
                                            }

                                            totalvalue = Number(otc_1) + Number(arc_1) + Number(otc_2) + Number(arc_2);

                                            if(Number(request.activity_type_id) === 134564 || //MPLS CRF
                                                Number(request.activity_type_id) === 134566 || //ILL CRF
                                                Number(request.activity_type_id) === 134573 || //NPLC CRF
                                                Number(request.activity_type_id) === 134575) { 
                                                
                                                (Number(arc_1) > Number(arc_2)) ?
                                                    finalValue = Number(otc_1) +(Number(arc_1) - Number(arc_2)) :
                                                    finalValue = Number(otc_1);

                                            } else {
                                                finalValue = totalvalue;
                                            }                                                    

                                                console.log('Intermediate values ::' + otc_1 + ' : ' + arc_1 + ' : ' + otc_2 + ' : ' + arc_2);
                                                next();
                                            }).then(async () => {
                                                    console.log('totalvalue :: ' + totalvalue);
                                                    console.log('finalValue :: ' + finalValue);
                                                    request['field_id'] = 0;
                                                    request['field_value'] = totalvalue;
                                                    widgetActivityFieldTransactionInsert(request);
                                                    
                                                    await activityCommonService.analyticsUpdateWidgetValue(request, request.activity_id, 1, otc_1);
                                                    await activityCommonService.analyticsUpdateWidgetValue(request, request.activity_id, 2, arc_1);
                                                    await activityCommonService.analyticsUpdateWidgetValue(request, request.activity_id, 3, otc_2);
                                                    await activityCommonService.analyticsUpdateWidgetValue(request, request.activity_id, 4, arc_2);
                                                    await activityCommonService.analyticsUpdateWidgetValue(request, request.activity_id, 0, finalValue);
                                                });
                                            }else{
                                                 request['field_value'] = -1;
                                                 request['field_id'] = -1;
                                                 widgetActivityFieldTransactionInsert(request);                                                 
                                            }
                                        } else {
                                                await addValueToWidgetForAnalyticsWF(request, request.activity_id, request.activity_type_id, 1); //Widget final value
                                                
                                                forEachAsync(requestFormData, function (next, fieldObj) {
                                                    console.log('LOOP ELSE ::' + request.activity_type_id + ' ' + fieldObj.field_id);
                                                    if(Object.keys(creditDebitFields).includes(String(fieldObj.field_id))){
                                                        let creditDebitValue = 0;
                                                        console.log("fieldObj.field_value.transaction_data.transaction_type_id :: "+fieldObj.field_value.transaction_data.transaction_type_id);
                                                        fieldObj.field_value.transaction_data.transaction_type_id == 1? creditDebitValue = fieldObj.field_value.transaction_data.transaction_amount: creditDebitValue = fieldObj.field_value.transaction_data.transaction_amount;

                                                        activityCommonService.analyticsUpdateWidgetValue(request, request.activity_id, 0, creditDebitValue);
                                                        next();
                                                    }else{
                                                        next();
                                                    }

                                                });
                                            
                                        }                                    
                            }

                            // Workflow Trigger
                            logger.verbose(`Workflow Trigger Condition`, {
                                type: 'workflow_trigger_condition',
                                request_body: request, error: null,

                                activity_type_categroy_id: activityTypeCategroyId,
                                device_os_id: request.device_os_id,
                                number_device_os_id: Number(request.device_os_id),
                                condition_1: `activityTypeCategroyId === 9 && request.device_os_id !== 9: ${activityTypeCategroyId === 9 && request.device_os_id !== 9}`,
                                condition_2: `Number(request.device_os_id) === 5 && !request.hasOwnProperty('is_mytony'): ${Number(request.device_os_id) === 5 && !request.hasOwnProperty('is_mytony')}`
                            });
                            if (activityTypeCategroyId === 9 && request.device_os_id !== 9) {

                                if (Number(request.device_os_id) === 5 && !request.hasOwnProperty('is_mytony')) {
                                                                            
                                    let workflowEngineRequest = Object.assign({}, request);

                                    let workflowEngineEvent = {
                                        name: "workflowEngine",
                                        service: "formConfigService",
                                        //method: "workflowEngine",
                                        method: "workflowEngineAsync",
                                        payload: workflowEngineRequest
                                    };

                                    await queueWrapper.raiseActivityEventPromise(workflowEngineEvent, request.activity_id);
                                    
                                    //queueWrapper.raiseActivityEvent(workflowEngineEvent, request.activity_id, (err, resp) => {
                                    //    if(err) {
                                    //        global.logger.write('conLog', '\x1b[35m [ERROR] Raising queue activity raised for workflow engine. \x1b[0m', {}, {});
                                    //    } else {
                                    //        global.logger.write('conLog', '\x1b[35m Queue activity raised for workflow engine. \x1b[0m', {}, {});
                                    //    }
                                    //});
                                }
                            }

                            // Bot Engine Trigger
                            if (activityTypeCategroyId === 9 && request.device_os_id !== 9) {
                                // Moved to ActivityTimelineService => addTimelineTransaction => fireBotEngineInitForm
                                // Do nothing
                            }

                            //  Trigger Bot Engine
                            /*if (
                                (activityTypeCategroyId === 48 ||
                                    activityTypeCategroyId === 50 ||
                                    activityTypeCategroyId === 51) &&
                                request.device_os_id !== 9
                            ) {
                                // Moved to ActivityTimelineService => addTimelineTransaction => fireBotEngineInitWorkflow
                                // Do nothing
                            }*/

                            if(activityTypeCategroyId === 48 || activityTypeCategroyId === 9) { 
                                //Listener
                                //Form Submission - When the form has data type reference type
                                console.log('Listener: Form Submission - When the form has data type reference type');
                                let formInlineData = JSON.parse(request.activity_inline_data);
                                console.log('formInlineData : ', formInlineData);
                                let fieldData;
                                for(let i=0; i<formInlineData.length;i++){                                    
                                    fieldData = formInlineData[i];
                                    switch(Number(fieldData.field_data_type_id)) {
                                        case 57: //Fire the Bot                                                 
                                                await fireBotInsertIntTables(request, fieldData);
                                                break;
                                        case 33: //Fire the Bot                                                 
                                                await fireBotInsertIntTables(request, fieldData);
                                                break;
                                        default: break;
                                    }
                                }

                                //addValueToWidgetForAnalyticsWF(request, request.activity_id, request.activity_type_id, 0); //0 - Non-Widget
                            }

                            if(activityTypeCategroyId === 48) { 
                                await addValueToWidgetForAnalyticsWF(request, request.activity_id, request.activity_type_id, 0); //0 - Non-Widget
                            }
                            
                            //activityCommonService.activityListHistoryInsert(request, updateTypeId, (err, restult)=>{});
                            //activityCommonService.assetActivityListHistoryInsert(request, activityAssetMappingAsset, 0, (err, restult)=>{});

                            await activityCommonService.activityListHistoryInsertAsync(request, updateTypeId);
                            await activityCommonService.assetActivityListHistoryInsertAsync(request, activityAssetMappingAsset, 0);

                            // alterActivityFlagFileEnabled(request).then(() => {});

                            updateProjectStatusCounts(request).then(() => {});
                            if (request.hasOwnProperty('activity_parent_id')) {
                                if (util.hasValidGenericId(request, 'activity_parent_id')) {
                                    activityCommonService.getActivityDetails(request, Number(request.activity_parent_id), function (err, activityData) {
                                        if (err === false) {
                                            switch (Number(activityData[0]['activity_type_category_id'])) {
                                                case 11:
                                                    //Updating the due date of the project                                                    
                                                    activityCommonService.updateProjectEndDateTime(request, (err, oldDateTime, newDateTime) => {
                                                        if (err === false) {
                                                            var coverAlterJson = {};
                                                            coverAlterJson.title = {
                                                                old: activityData[0]['activity_title'],
                                                                new: activityData[0]['activity_title']
                                                            };
                                                            coverAlterJson.description = {
                                                                old: activityData[0]['activity_description'],
                                                                new: activityData[0]['activity_description']
                                                            };
                                                            coverAlterJson.duedate = {
                                                                old: oldDateTime,
                                                                new: newDateTime
                                                            };
                                                            callAlterActivityCover(request, coverAlterJson, activityData[0]['activity_type_category_id']).then(() => {}).catch(() => {});
                                                        }
                                                    });
                                                    break;
                                                case 6:
                                                case 29:
                                                case 43:
                                                case 44:
                                                    //update the p_parent_activity_id's end estimated datetime
                                                    var coverAlterJson = {};
                                                    coverAlterJson.title = {
                                                        old: activityData[0]['activity_title'],
                                                        new: activityData[0]['activity_title']
                                                    };
                                                    coverAlterJson.duedate = {
                                                        old: activityData[0]['activity_title'],
                                                        new: activityData[0]['activity_title']
                                                    };
                                                    // get the updated estimated datetime of project.
                                                    var newParamsArr = new Array(
                                                        request.activity_parent_id,
                                                        request.workforce_id,
                                                        request.account_id,
                                                        request.organization_id,
                                                        0, 1
                                                    );
                                                    var queryString = util.getQueryString('ds_p1_activity_list_select_project_tasks', newParamsArr);
                                                    if (queryString != '') {
                                                        db.executeQuery(1, queryString, request, function (err, result) {
                                                            if (err === false) {
                                                                var newEndEstimatedDatetime = result[0]['activity_datetime_end_estimated'];
                                                                // console.log('setting new datetime for contact as ' + newEndEstimatedDatetime);
                                                                global.logger.write('conLog', 'setting new datetime for contact as ' + newEndEstimatedDatetime, {}, request);

                                                                coverAlterJson.description = {
                                                                    old: activityData[0]['activity_datetime_end_estimated'],
                                                                    new: newEndEstimatedDatetime
                                                                };
                                                                callAlterActivityCover(request, coverAlterJson, activityData[0]['activity_type_category_id']).then(() => {}).catch(() => {});
                                                                /*var event = {
                                                                    name: "alterActivityCover",
                                                                    service: "activityUpdateService",
                                                                    method: "alterActivityCover",
                                                                    payload: {
                                                                        organization_id: request.organization_id,
                                                                        account_id: request.account_id,
                                                                        workforce_id: request.workforce_id,
                                                                        asset_id: request.asset_id,
                                                                        asset_token_auth: request.asset_token_auth,
                                                                        activity_id: request.activity_parent_id,
                                                                        activity_cover_data: JSON.stringify(coverAlterJson),
                                                                        activity_type_category_id: activityData[0]['activity_type_category_id'],
                                                                        activity_type_id: 1,
                                                                        activity_access_role_id: 1,
                                                                        activity_parent_id: 0,
                                                                        flag_pin: 0,
                                                                        flag_priority: 0,
                                                                        flag_offline: 0,
                                                                        flag_retry: 0,
                                                                        message_unique_id: util.getMessageUniqueId(request.asset_id),
                                                                        track_latitude: request.track_latitude,
                                                                        track_longitude: request.track_longitude,
                                                                        track_altitude: request.track_altitude,
                                                                        track_gps_datetime: request.track_gps_datetime,
                                                                        track_gps_accuracy: request.track_gps_accuracy,
                                                                        track_gps_status: request.track_gps_status,
                                                                        track_gps_location: request.track_gps_location,
                                                                        service_version: request.service_version,
                                                                        app_version: request.app_version,
                                                                        device_os_id: request.device_os_id
                                                                    }
                                                                };
                                                                queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                                                                    if (err) {
                                                                        //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                                                        //global.logger.write('serverError', "Error in queueWrapper raiseActivityEvent", err, request);
                                                                        throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                                                    }
                                                                });*/
                                                            }
                                                        });
                                                    }

                                                    break;
                                            }

                                        }
                                    });
                                }

                            } // end parent activity id condition

                            // console.log('request - ', request);
                            //global.logger.write('debug', 'request - ' + JSON.stringify(request, null, 2), {}, request);

                            if (request.activity_parent_id == 95670) { //For Marketing Manager reference //PROD - 95670 ; Staging - 93256
                                //Create a timeline entry on this task
                                setTimeout(function () {
                                    // console.log('Delayed for 2s');
                                    global.logger.write('debug', 'Delayed for 2s', {}, request);

                                    createTimelineEntry(request).then(() => {});
                                }, 2000);
                            }

                            //Submit leave Form
                            /*if (activityTypeCategroyId === 9 && request.activity_form_id == 807) {
                                submitLeaveForms(request).then(() => {});
                            }*/

                            //setTimeout(() => {
                            //    callback(false, responseactivityData, 200);
                            //}, 10000);
                            
                            callback(false, responseactivityData, 200);

                            cacheWrapper.setMessageUniqueIdLookup(request.message_unique_id, request.activity_id, function (err, status) {
                                if (err) {
                                    //console.log("error in setting in message unique id look up");
                                    global.logger.write('debug', 'error in setting in message unique id look up', err, request);
                                } else
                                    //console.log("message unique id look up is set successfully")
                                    global.logger.write('debug', 'message unique id look up is set successfully', {}, request);
                            });
                            //return;
                        } else {
                            // console.log("not inserted to asset activity list");
                            global.logger.write('conLog', "not inserted to asset activity list", {}, request);

                            //setTimeout(() => {
                            //    callback(false, responseactivityData, 200);
                            //}, 10000);

                            callback(false, responseactivityData, 200);
                        }

                    }); //End of Asset List Insert Add

                    // Suzuki Form Submissions PDF Generation Logic
                    // 
                    // 
                    if (activityTypeCategroyId === 9 && (
                            Number(request.activity_form_id) === 815 ||
                            Number(request.activity_form_id) === 816 ||
                            Number(request.activity_form_id) === 817 ||
                            Number(request.activity_form_id) === 818 ||
                            Number(request.activity_form_id) === 819 ||
                            Number(request.activity_form_id) === 820
                        )) {
                        // Fetch Contact Card information
                        activityCommonService.getActivityDetails(request, request.activity_parent_id, (err, data) => {
                            if (!err) {

                                var contactCardInlineData = JSON.parse(data[0].activity_inline_data);

                                request.contact_reference_name = data[0].activity_title;
                                request.contact_reference_address = contactCardInlineData.contact_location;
                                request.contact_reference_contact_number = contactCardInlineData.contact_phone_number;
                                request.contact_reference_email = contactCardInlineData.contact_email_id;
                                request.invoice_date = data[0].activity_datetime_created;

                                // Fetch contact file's first collaborator (non-creator):
                                // 
                                activityCommonService.fetchContactFileFirstCollaborator(request, request.activity_parent_id, (err, collaboratorData) => {
                                    if (collaboratorData.length > 0) {
                                        // console.log("collaboratorData: ", collaboratorData);
                                        request.contact_executive_name = collaboratorData[0].operating_asset_first_name;
                                        request.contact_executive_contact_number = '+ ' + collaboratorData[0].operating_asset_phone_country_code + ' ' + collaboratorData[0].operating_asset_phone_number;
                                        // request.log_datetime = util.getCurrentUTCTime();

                                    } else {
                                        console.log("No sales executive");
                                    }

                                    // Generate PDF Proforma Invoice and Upload to AWS S3
                                    suzukiPdfEngine(request, request.activity_form_id, JSON.parse(request.activity_inline_data), data[0].activity_master_data, (err, activityMasterData, reportURL) => {
                                        activityCommonService.updateActivityMasterData(request, request.activity_parent_id, activityMasterData, () => {});

                                        // Update contact_report_url in the Contact Card activity's inline data

                                        contactCardInlineData.contact_report_url = reportURL;

                                        // Fire the Inline Alter service
                                        var newRequest = Object.assign(request);
                                        newRequest.activity_id = request.activity_parent_id;
                                        newRequest.activity_inline_data = JSON.stringify(contactCardInlineData);
                                        newRequest.activity_type_category_id = 6;

                                        const event = {
                                            name: "alterActivityInline",
                                            service: "activityUpdateService",
                                            method: "alterActivityInline",
                                            payload: newRequest
                                        };

                                        queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                                            if (err) {
                                                console.log('Error in queueWrapper raiseActivityEvent : ', err);
                                                console.log('Response from queueWrapper raiseActivityEvent : ', resp);

                                                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                            }
                                        });
                                    });
                                });
                            }
                        });
                        callback(false, responseactivityData, 200);
                    }

                    // Tirggering BOT 1
                    /*if (activityTypeCategroyId === 9 && (Number(request.activity_form_id) === Number(global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER))) {
                        global.logger.write('debug', "\x1b[35m [Log] Triggering the BOT 1 \x1b[0m", {}, request);
                        
                        //makeRequest to /vodafone/neworder_form/queue/add
                        let newRequest = Object.assign(request);
                        newRequest.activity_inline_data = {};
                        activityCommonService.makeRequest(newRequest, "vodafone/neworder_form/queue/add", 1).then((resp)=>{
                               global.logger.write('debug', resp, {}, request);
                        });
                        
                        /*request.worflow_trigger_url = util.getWorkFlowUrl(request.url);
                        global.logger.write('debug', 'worflow_trigger_url: ' + request.worflow_trigger_url, {}, request);

                        activityCommonService.getWorkflowForAGivenUrl(request).then((data)=>{
                            global.logger.write('debug', 'workflow_execution_url: ' + data[0].workflow_execution_url, {}, request);
                            activityCommonService.makeRequest(request, data[0].workflow_execution_url, 1).then((resp)=>{
                               global.logger.write('debug', resp, {}, request);
                            });
                        });
                    }*/
                    // 
                    // 

                    //callback(false, responseactivityData, 200);                    
                } else { //This is activityList Insert if(err === false) else part
                    //setTimeout(() => {
                    //    callback(err, responseactivityData, -9999);
                    //}, 5000);
                    callback(err, responseactivityData, -9999);
                    //return;
                }
            });
        }).catch((err) => {
            //console.log(err);
            global.logger.write('serverError', err, err, request);
        });
    };

    /*function submitLeaveForms(request) {
        return new Promise((resolve, reject) => {
            var days = util.getNoOfDays(request.activity_datetime_end, request.activity_datetime_start);
            days++;
            console.log('Number of days leave applied : ', days);
            var startDate = request.activity_datetime_start;
            var cnt = 0;

            function submitForms() {
                new Promise((resolve, reject) => {
                    if (cnt > 0) {
                        cacheWrapper.getFormTransactionId(function (err, formTransactionId) {
                            if (err) {
                                console.log(err);
                                global.logger.write('serverError', '', err, request);
                                return reject();
                            } else {
                                return resolve(formTransactionId);
                            }
                        });
                    } else {
                        var formTransactionId = request.form_transaction_id;
                        return resolve(formTransactionId);
                    }
                }).then((formTransactionId) => {
                    var newReqObj = Object.assign({}, request);
                    newReqObj.activity_stream_type_id = 705;
                    newReqObj.form_transaction_id = formTransactionId;

                    newReqObj.activity_timeline_collection = JSON.stringify([{
                            "form_id": Number(request.activity_form_id),
                            "form_transaction_id": formTransactionId,
                            "field_id": 4637,
                            "field_data_type_id": 21,
                            "field_data_type_category_id": 8,
                            "data_type_combo_id": 0,
                            "data_type_combo_value": "",
                            "field_value": "Leave Form",
                            "message_unique_id": util.getMessageUniqueId(request.asset_id)
                        },
                        {
                            "form_id": Number(request.activity_form_id),
                            "form_transaction_id": formTransactionId,
                            "field_id": 4638,
                            "field_data_type_id": 4,
                            "field_data_type_category_id": 1,
                            "data_type_combo_id": 0,
                            "data_type_combo_value": "",
                            "field_value": startDate,
                            "message_unique_id": util.getMessageUniqueId(request.asset_id)
                        },
                        {
                            "form_id": Number(request.activity_form_id),
                            "form_transaction_id": formTransactionId,
                            "field_id": 4639,
                            "field_data_type_id": 4,
                            "field_data_type_category_id": 1,
                            "data_type_combo_id": 0,
                            "data_type_combo_value": "",
                            "field_value": util.getGivenDayEndDatetime(startDate),
                            "message_unique_id": util.getMessageUniqueId(request.asset_id)
                        },
                        {
                            "form_id": Number(request.activity_form_id),
                            "form_transaction_id": formTransactionId,
                            "field_id": 4640,
                            "field_data_type_id": 6,
                            "field_data_type_category_id": 2,
                            "data_type_combo_id": 0,
                            "data_type_combo_value": "",
                            "field_value": 24,
                            "message_unique_id": util.getMessageUniqueId(request.asset_id)
                        }
                    ]);

                    console.log('*************************************************************************');
                    console.log('Activity Timeline Collections : ', newReqObj.activity_timeline_collection);
                    console.log('*************************************************************************');

                    var event = {
                        name: "addTimelineTransaction",
                        service: "activityTimelineService",
                        method: "addTimelineTransaction",
                        payload: newReqObj
                    };
                    queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                        if (err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError', "Error in queueWrapper raiseActivityEvent", err, request);
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        }

                        startDate = util.addDays(startDate, 1);
                        cnt++;
                        if (cnt < days) {
                            submitForms();
                        } else if (cnt === days) {
                            resolve();
                        }
                    });

                });
            }
            submitForms();
        });
    } */

    function callAlterActivityCover(request, coverAlterJson, activityTypeCategoryId) {
        return new Promise((resolve, reject) => {
            // console.log('coverAlterJson : ', coverAlterJson);
            global.logger.write('debug', 'coverAlterJson: ' + JSON.stringify(coverAlterJson, null, 2), {}, request);

            var event = {
                name: "alterActivityCover",
                service: "activityUpdateService",
                method: "alterActivityCover",
                payload: {
                    organization_id: request.organization_id,
                    account_id: request.account_id,
                    workforce_id: request.workforce_id,
                    asset_id: request.asset_id,
                    asset_token_auth: request.asset_token_auth,
                    activity_id: request.activity_parent_id,
                    activity_cover_data: JSON.stringify(coverAlterJson),
                    activity_type_category_id: activityTypeCategoryId,
                    activity_type_id: request.activity_type_id || 1,
                    activity_access_role_id: 1,
                    activity_parent_id: 0,
                    flag_pin: 0,
                    flag_priority: 0,
                    flag_offline: 0,
                    flag_retry: 0,
                    message_unique_id: util.getMessageUniqueId(request.asset_id),
                    track_latitude: request.track_latitude,
                    track_longitude: request.track_longitude,
                    track_altitude: request.track_altitude,
                    track_gps_datetime: request.track_gps_datetime,
                    track_gps_accuracy: request.track_gps_accuracy,
                    track_gps_status: request.track_gps_status,
                    track_gps_location: request.track_gps_location,
                    service_version: request.service_version,
                    app_version: request.app_version,
                    device_os_id: request.device_os_id
                }
            };
            queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                if (err) {
                    //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                    //global.logger.write('serverError', "Error in queueWrapper raiseActivityEvent", err, request);
                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                }
                resolve();
            });
        });
    }

    var updateMailInlineJson = function (request, callback) {
        var mailJson = JSON.parse(request.activity_inline_data);
        var finalJson = {};
        forEachAsync(Object.keys(mailJson), function (next, mailData, index) {
            if (index === 'activity_reference') {
                //if (mailJson[mailData] !== null && typeof mailJson[mailData] === 'object') {
                var tempRefernceArr = new Array();
                forEachAsync(mailJson[mailData], function (next, referenceData) {
                    activityCommonService.getActivityDetails(request, Number(referenceData.activity_id), function (err, activityData) {
                        if (err === false) {
                            referenceData.organization_id = activityData[0]['organization_id'];
                            referenceData.account_id = activityData[0]['account_id'];
                            referenceData.workforce_id = activityData[0]['workforce_id'];
                            referenceData.asset_id = activityData[0]['asset_id'];
                            tempRefernceArr.push(referenceData);
                            next();
                        }
                    });
                }).then(function () {
                    finalJson[mailData] = tempRefernceArr;
                    next();
                });
            } else {
                finalJson[mailData] = mailJson[mailData];
                next();
            }
        }).then(function () {
            callback(false, JSON.stringify(finalJson));
        });
    };
    var activityListInsert = function (request, callback) {
        // console.log("Request | activityListInsert: ", request);
        var paramsArr = new Array();
        var activityInlineData;

        try {
            activityInlineData = JSON.parse(request.activity_inline_data);
        } catch (err) {
            console.log(err);
        }

        var activityTypeCategoryId = Number(request.activity_type_category_id);
        var activityChannelId = 0;
        var activityChannelCategoryId = 0;
        var activityStatusId = 0;
        var activityFormId = 0;

        if (request.hasOwnProperty('activity_channel_id'))
            activityChannelId = request.activity_channel_id;
        if (request.hasOwnProperty('activity_channel_category_id'))
            activityChannelCategoryId = request.activity_channel_category_id;
        if (request.hasOwnProperty('activity_status_id'))
            activityStatusId = request.activity_status_id;
        if (request.hasOwnProperty('activity_form_id'))
            activityFormId = request.activity_form_id;
        if (request.hasOwnProperty('workflow_activity_id') && activityTypeCategoryId === 9)
            activityChannelId = request.workflow_activity_id;
        //BETA
        var activitySubTypeId = (request.hasOwnProperty('activity_sub_type_id')) ? request.activity_sub_type_id : 0;
        //PAM
        var activitySubTypeName = (request.hasOwnProperty('activity_sub_type_name')) ? request.activity_sub_type_name : '';
        var expiryDateTime = (request.hasOwnProperty('expiry_datetime')) ? request.expiry_datetime : '';
        var itemOrderCount = (request.hasOwnProperty('item_order_count')) ? request.item_order_count : '0';

        if (activityTypeCategoryId === 38) {
            // console.log('Inside sendPush');
            global.logger.write('conLog', 'Inside sendPush', {}, request);

            sendPushPam(request).then(() => {});
        }

        new Promise((resolve, reject) => {
            if (activityTypeCategoryId === 37 && !request.hasOwnProperty('member_code')) { //PAM
                var reserveCode;

                function generateUniqueCode() {
                    reserveCode = util.randomInt(50001, 99999).toString();
                    activityCommonService.checkingUniqueCode(request, reserveCode, (err, data) => {
                        if (err === false) {
                            // console.log('activitySubTypeName : ' + data);
                            global.logger.write('conLog', 'activitySubTypeName : ' + JSON.stringify(data, null, 2), {}, request);

                            activitySubTypeName = data;
                            responseactivityData.reservation_code = data;
                            activityCommonService.getActivityDetails(request, request.activity_parent_id, function (err, resp) {
                                if (err === false) {
                                    var eventStartDateTime = util.replaceDefaultDatetime(resp[0].activity_datetime_start_expected);
                                    (Math.sign(util.differenceDatetimes(eventStartDateTime, request.datetime_log)) === 1) ?
                                    expiryDateTime = util.addUnitsToDateTime(eventStartDateTime, 6.5, 'hours'):
                                        expiryDateTime = util.addUnitsToDateTime(request.datetime_log, 6.5, 'hours');
                                    return resolve();
                                } else {
                                    return resolve();
                                }
                            });
                        } else {
                            generateUniqueCode();
                        }
                    });
                }
                generateUniqueCode();
            } else if (activityTypeCategoryId === 37 && request.hasOwnProperty('member_code')) {
                activitySubTypeName = request.member_code;
                responseactivityData.reservation_code = request.member_code;
                activityCommonService.getActivityDetails(request, request.activity_parent_id, function (err, resp) {
                    if (err === false) {
                        var eventStartDateTime = util.replaceDefaultDatetime(resp[0].activity_datetime_start_expected);
                        (Math.sign(util.differenceDatetimes(eventStartDateTime, request.datetime_log)) === 1) ?
                        expiryDateTime = util.addUnitsToDateTime(eventStartDateTime, 6.5, 'hours'):
                            expiryDateTime = util.addUnitsToDateTime(request.datetime_log, 6.5, 'hours');
                        return resolve();
                    } else {
                        return resolve();
                    }
                });
            } else {
                return resolve();
            }

        }).then(() => {
            switch (activityTypeCategoryId) {
                case 2: // notepad
                    /*
                     * 
                     * 
                     * 
                     IN p_channel_activity_id BIGINT(20), IN p_channel_activity_type_category_id TINYINT(4)
                     */
                    paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        activityInlineData.asset_id,
                        activityInlineData.workforce_id,
                        activityInlineData.account_id,
                        activityInlineData.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                    );
                    break;
                case 3: // plant activity            
                case 4: // id card            
                    paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        activityInlineData.employee_asset_id,
                        activityInlineData.employee_workforce_id,
                        activityInlineData.employee_account_id,
                        activityInlineData.employee_organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                    );
                    break;
                case 5: // coworker card
                    paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        activityInlineData.contact_asset_id,
                        activityInlineData.contact_workforce_id,
                        activityInlineData.contact_account_id,
                        activityInlineData.contact_organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                    );
                    break;
                case 29: // contact supplier
                case 6: // contact customer
                    paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        activityInlineData.contact_asset_id, //contact asset id
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                    );
                    break;
                case 8: // mail
                    paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                    );
                    break;
                case 48:
                case 9: // form
                    let activityDescription = request.activity_description;
                    let activityTitle = request.activity_title;
                    if (typeof request.activity_description === 'object') {
                        activityDescription = JSON.stringify(request.activity_description);
                    }
                    if (typeof request.activity_title === 'object') {
                        activityTitle = JSON.stringify(request.activity_title);
                    }
                    paramsArr = new Array(
                        request.activity_id,
                        activityTitle, //request.activity_title,
                        activityDescription,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry || 0,
                        request.flag_offline || 0,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        request.form_transaction_id,
                        activityChannelId,
                        activityChannelCategoryId
                    );
                    break;
                case 28: //post it
                    paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                    );
                    break;
                case 10:
                case 11:
                    var ownerAssetID;
                    if (request.hasOwnProperty('owner_asset_id')) {
                        (request.owner_asset_id == 0) ? ownerAssetID = request.asset_id: ownerAssetID = request.owner_asset_id;
                    } else {
                        ownerAssetID = request.asset_id;
                    }

                    paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        ownerAssetID,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                    );
                    break;
                case 16: // Chat
                    var ownerAssetID = request.owner_asset_id;

                    paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        ownerAssetID,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                    );
                    break;

                    //PAM
                case 37:
                    activitySubTypeId = 0;
                    paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        "",
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        0,
                        activityChannelId,
                        activityChannelCategoryId
                    );
                    break;
                default:
                    paramsArr = new Array(
                        request.activity_id,
                        request.activity_title,
                        request.activity_description,
                        (request.activity_inline_data),
                        itemOrderCount, //"",PAM
                        0,
                        request.activity_datetime_start,
                        request.activity_datetime_end,
                        activityStatusId,
                        request.activity_type_id,
                        request.activity_parent_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.message_unique_id, //request.asset_id + new Date().getTime() + getRandomInt(), //message unique id
                        request.flag_retry,
                        request.flag_offline,
                        request.asset_id,
                        request.datetime_log, // server log date time   
                        activityFormId,
                        request.form_transaction_id || 0,
                        activityChannelId,
                        activityChannelCategoryId
                    );
                    break;
            }
            paramsArr.push(request.track_latitude);
            paramsArr.push(request.track_longitude);
            paramsArr.push(activitySubTypeId);
            paramsArr.push(activitySubTypeName); //PAM
            paramsArr.push(expiryDateTime); //PAM

            var queryString = util.getQueryString('ds_v1_activity_list_insert_pam', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        //BETA                            
                        if ((activityTypeCategoryId === 10 || activityTypeCategoryId === 11) && (request.asset_id !== ownerAssetID)) {
                            var paramsArr1 = new Array(
                                request.activity_id,
                                request.asset_id,
                                request.workforce_id,
                                request.account_id,
                                request.organization_id,
                                26, //request.participant_access_id,
                                request.message_unique_id,
                                request.flag_retry || 0,
                                request.flag_offline || 0,
                                request.asset_id,
                                request.datetime_log,
                                0 //Field Id
                                //'',
                                //-1
                            );
                            //var queryString = util.getQueryString('ds_v1_activity_asset_mapping_insert_asset_assign_appr_ingre', paramsArr1);
                            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_insert_asset_assign_appr', paramsArr1);
                            if (queryString !== '') {
                                db.executeQuery(0, queryString, request, function (err, data) {
                                    if (err === false) {
                                        activityCommonService.updateLeadAssignedDatetime(request, request.asset_id, function (err, data) {

                                        });
                                        callback(false, true);
                                        return;
                                    } else {
                                        callback(err, false);
                                        return;
                                    }
                                });
                            }
                        } else if ((activityTypeCategoryId === 16) && (request.asset_id !== ownerAssetID)) {
                            // Chats
                            // 
                            // Handle the owner's activity_asset_mapping entry in this block. The creator's 
                            // activity_asset_mapping entry will be handled in the next activity_asset_mapping 
                            // insert call inside the assetActivityListInsertAddActivity() function.
                            // 
                            let paramsArr = new Array(
                                request.activity_id,
                                ownerAssetID,
                                request.owner_workforce_id || request.workforce_id,
                                request.account_id,
                                request.organization_id,
                                56, // request.participant_access_id: Owner
                                request.message_unique_id,
                                request.flag_retry,
                                request.flag_offline,
                                request.asset_id,
                                request.datetime_log,
                                0 //Field Id
                                //'',
                                //-1
                            );
                            //var queryString = util.getQueryString('ds_v1_activity_asset_mapping_insert_asset_assign_appr_ingre', paramsArr);
                            let queryString = util.getQueryString('ds_v1_activity_asset_mapping_insert_asset_assign_appr', paramsArr);
                            if (queryString !== '') {
                                db.executeQuery(0, queryString, request, function (err, data) {
                                    if (err === false) {
                                        activityCommonService.updateLeadAssignedDatetime(request, request.asset_id, function (err, data) {

                                        });
                                        callback(false, true);
                                        return;
                                    } else {
                                        callback(err, false);
                                        return;
                                    }
                                });
                            }

                        } else {

                            // TimeCard Form Submission for Swipe In
                            var isTimeCardFormSubmission = (Number(request.activity_form_id) === 800) || (Number(request.activity_form_id) === 801) || (Number(request.activity_form_id) === 325);
                            if (activityTypeCategoryId === 9 && Number(request.swipe_flag) === 0 && isTimeCardFormSubmission) {
                                submitFormActivityForOfficePresenceSwipeIn(request);
                            }

                            callback(false, true);
                            return;
                        }

                    } else {
                        // some thing is wrong and have to be dealt
                        callback(err, false);
                        return;
                    }
                });
            }
        });
    };

    function submitFormActivityForOfficePresenceSwipeIn(request) {
        // Form ID logic to decide between (request.activity_form_id)
        // 325 => Timecard - Manual 
        // 800 => Timecard - Automated - Mobile 
        // 801 => Timecard - Automated - Web
        // Calculate field IDs
        var clientSignInTime;
        var serverSignInTime;
        // On the other hand, if the form_id is either 800 or 801,
        // calculate the field_ids
        if (Number(request.activity_form_id) === 800) {
            clientSignInTime = 4605;
            serverSignInTime = 4606;

        } else if (Number(request.activity_form_id) === 801) {
            clientSignInTime = 4611;
            serverSignInTime = 4612;

        } else if (Number(request.activity_form_id) === 325) {
            clientSignInTime = 2549;
            serverSignInTime = 2550;
        }

        var activityTimelineCollectionJSON = JSON.stringify([{
                "form_id": Number(request.activity_form_id),
                "field_id": clientSignInTime,
                "field_data_type_id": 4,
                "field_data_type_category_id": 1,
                "data_type_combo_id": 0,
                "data_type_combo_value": "",
                "field_value": request.swipe_in_datetime,
                "message_unique_id": util.getMessageUniqueId(request.asset_id)
            },
            {
                "form_id": Number(request.activity_form_id),
                "field_id": serverSignInTime,
                "field_data_type_id": 4,
                "field_data_type_category_id": 1,
                "data_type_combo_id": 0,
                "data_type_combo_value": "",
                "field_value": util.getCurrentUTCTime(),
                "message_unique_id": util.getMessageUniqueId(request.asset_id)
            }
        ]);
        var event = {
            name: "addTimelineTransaction",
            service: "activityTimelineService",
            method: "addTimelineTransaction",
            payload: {
                organization_id: request.organization_id,
                account_id: request.account_id,
                workforce_id: request.workforce_id,
                asset_id: request.asset_id,
                asset_token_auth: request.asset_token_auth,
                asset_message_counter: request.asset_message_counter,
                activity_id: request.activity_id,
                activity_type_category_id: 9, // 9 for forms
                activity_stream_type_id: 705,
                form_transaction_id: request.form_transaction_id,
                activity_timeline_text: 'SWIPE IN',
                activity_timeline_url: '',
                activity_timeline_collection: activityTimelineCollectionJSON,
                message_unique_id: util.getMessageUniqueId(request.asset_id),
                flag_offline: request.flag_offline,
                flag_timeline_entry: 0,
                track_latitude: request.track_latitude,
                track_longitude: request.track_longitude,
                track_altitude: request.track_altitude,
                track_gps_datetime: request.track_gps_datetime,
                track_gps_accuracy: request.track_gps_accuracy,
                track_gps_status: request.track_gps_status,
                track_gps_location: request.track_gps_location,
                service_version: request.service_version,
                app_version: request.app_version,
                device_os_id: request.device_os_id,
                entity_datetime_1: request.swipe_in_datetime,
                entity_datetime_2: request.swipe_out_datetime
            }
        };
        queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
            if (err) {
                // console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                global.logger.write('debug', err, err, request);
                global.logger.write('conLog', 'Error in queueWrapper raiseActivityEvent : ' + JSON.stringify(resp, null, 2), err, request);

                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
            } else {
                // console.log('\x1b[36m%s\x1b[0m', 'Successfullly raised SWIPE IN activity event.');
                global.logger.write('conLog', 'Successfullly raised SWIPE IN activity event.', {}, request);
            }
        });
    }

    function alterActivityFlagFileEnabled(request) {
        return new Promise((resolve, reject) => {
            var activityFlagFileEnabled;
            (request.url.includes('v1')) ? activityFlagFileEnabled = request.activity_flag_file_enabled: activityFlagFileEnabled = 1;

            var paramsArr = new Array(
                request.activity_id,
                request.asset_id,
                request.organization_id,
                activityFlagFileEnabled,
                request.datetime_log
            );

            var queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_flag_file_enabled', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(): reject(err);
                });
            }
        });
    }


    function sendPushPam(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                0,
                request.activity_channel_category_id,
                0,
                50
            );
            var queryString = util.getQueryString('ds_v1_asset_list_select_category', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, pushArns) {
                    if (err === false) {
                        var data = new Array();
                        forEachAsync(pushArns, function (next, rowData) {
                            if (rowData.asset_push_arn != null) {
                                data.push(rowData.asset_push_arn);
                            }
                            next();
                        }).then(() => {
                            // console.log('ARNS : ', data);
                            global.logger.write('debug', 'ARNS: ' + JSON.stringify(data, null, 2), {}, request);

                            if (data.length > 0) {
                                activityPushService.pamSendPush(request, data, objectCollection, function (err, resp) {});
                            } else {
                                global.logger.write('conLog', 'No arns', {}, request);
                            }

                            resolve();
                        });
                    }
                });
            }
        });
    }
    var assetActivityListInsertAddActivity = function (request, callback) {

        var activityInlineData = JSON.parse(request.activity_inline_data);
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        var organisationId = 0;
        switch (activityTypeCategoryId) {
            case 2: // notepad
                organisationId = activityInlineData.organization_id;
                break;
            case 3: // plant activity            
            case 4: // id card            
                organisationId = activityInlineData.employee_organization_id;
                break;
            case 5: // coworker card
                organisationId = activityInlineData.contact_organization_id;
                break;
            case 6: // contact
                organisationId = request.organization_id;
                break;
            case 9: // form
                organisationId = request.organization_id;
                break;
            default:
                organisationId = request.organization_id;
                break;
        }
        var paramsArr = new Array(
            request.activity_id,
            organisationId,
            request.activity_access_role_id,
            request.datetime_log // server log date time
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_insert', paramsArr);
        if (queryString != '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                    return;
                }
            });
        }
    };
    /*var checkActivityStatusChangeEligibility = function (request, calback) {
     var paramsArr = new Array(
     request.organization_id,
     request.form_id,
     30
     );
     var queryString = util.getQueryString("ds_v1_workforce_form_field_mapping_select_approval_field_count", paramsArr);
     if (queryString != '') {
     db.executeQuery(1, queryString, request, function (err, data) {
     if (err === false)
     {
     queryString = util.getQueryString("ds_v1_activity_form_transaction_select_approval_field_count", paramsArr);
     if (queryString != '') {
     db.executeQuery(1, queryString, request, function (err, countData) {
     if (err === false)
     {
     
     return;
     } else {
     callback(err, false);
     console.log(err);
     return;
     }
     });
     }
     return;
     } else {
     callback(err, false);
     console.log(err);
     return;
     }
     });
     }
     
     
     };
     */

    var activityListUpdateStatus = function (request, callback) {

        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_id,
            request.activity_status_id,
            request.activity_status_type_id,
            request.datetime_log,
            request.asset_id
        );
        var queryString = util.getQueryString("ds_v1_1_activity_list_update_status", paramsArr);
        //var queryString = util.getQueryString("ds_v1_activity_list_update_status", paramsArr);
        if (queryString != '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, data);
                    return;
                } else {
                    callback(err, data);
                    //console.log(err);
                    global.logger.write('serverError', err, err, request);
                    return;
                }
            });
        }
    };
    var assetActivityListUpdateStatus = function (request, activityStatusId, activityStatusTypeId, callback) {
        var paramsArr = new Array();
        activityCommonService.getAllParticipants(request, function (err, participantsData) {
            if (err === false) {
                participantsData.forEach(function (rowData, index) {
                    paramsArr = new Array(
                        request.organization_id,
                        request.account_id,
                        request.workforce_id,
                        request.activity_id,
                        rowData['asset_id'],
                        activityStatusId,
                        activityStatusTypeId || 0,
                        request.datetime_log
                    );
                    queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_status', paramsArr);
                    db.executeQuery(0, queryString, request, function (error, queryResponse) {});
                }, this);
                callback(false, true);
                return;
            } else {
                // some thing is wrong and have to be dealt
                callback(true, false);
                return;
            }
        });
    };
    var getFormTransactionRecords = function (request, formTransactionId, formId, callback) {
        var paramsArr = new Array(
            formTransactionId,
            formId,
            request.organization_id
        );
        queryString = util.getQueryString('ds_v1_activity_form_transaction_select', paramsArr);
        db.executeQuery(1, queryString, request, function (err, data) {
            if (err === false) {
                callback(false, data);
            }
        });
    };
    var duplicateFormTransactionData = function (request, callback) {

        activityCommonService.getActivityDetails(request, 0, function (err, activityData) { // get activity form_id and form_transaction id
            var formTransactionId = activityData[0].form_transaction_id;
            var formId = activityData[0].form_id;
            getFormTransactionRecords(request, formTransactionId, formId, function (err, formTransactionData) { // get all form transaction data
                if (err === false) {
                    var finalFormTransactionData = {};
                    forEachAsync(formTransactionData, function (next, rowData) {
                        var objectKey = rowData['field_id'] + '' + rowData['data_type_combo_id'];
                        finalFormTransactionData[objectKey] = rowData;
                        next();
                    }).then(function () {
                        var finalFormTransactionKeys = (Object.keys(finalFormTransactionData));
                        forEachAsync(finalFormTransactionKeys, function (next, keyValue) {
                            var paramsArr = new Array(
                                finalFormTransactionData[keyValue].form_transaction_id,
                                finalFormTransactionData[keyValue].form_id,
                                finalFormTransactionData[keyValue].field_id,
                                finalFormTransactionData[keyValue].data_type_combo_id,
                                finalFormTransactionData[keyValue].activity_id,
                                finalFormTransactionData[keyValue].asset_id,
                                finalFormTransactionData[keyValue].workforce_id,
                                finalFormTransactionData[keyValue].account_id,
                                finalFormTransactionData[keyValue].organization_id,
                                util.replaceDefaultDate(finalFormTransactionData[keyValue].data_entity_date_1),
                                util.replaceDefaultDatetime(finalFormTransactionData[keyValue].data_entity_datetime_1),
                                finalFormTransactionData[keyValue].data_entity_tinyint_1,
                                finalFormTransactionData[keyValue].data_entity_tinyint_2, //BETA
                                finalFormTransactionData[keyValue].data_entity_bigint_1,
                                finalFormTransactionData[keyValue].data_entity_double_1,
                                finalFormTransactionData[keyValue].data_entity_decimal_1,
                                finalFormTransactionData[keyValue].data_entity_decimal_2,
                                finalFormTransactionData[keyValue].data_entity_decimal_3,
                                finalFormTransactionData[keyValue].data_entity_text_1,
                                '', //  p_entity_text_2 VARCHAR(4800)
                                '', //  p_entity_text_3 VARCHAR(100) BETA
                                request.track_latitude,
                                request.track_longitude,
                                request.track_gps_accuracy,
                                request.track_gps_status,
                                '',
                                '',
                                '',
                                '',
                                request.device_os_id,
                                '',
                                '',
                                request.app_version,
                                request.service_version,
                                finalFormTransactionData[keyValue].log_asset_id,
                                finalFormTransactionData[keyValue].log_message_unique_id,
                                0,
                                request.flag_offline,
                                util.replaceDefaultDatetime(finalFormTransactionData[keyValue].form_transaction_datetime),
                                request.datetime_log
                            );
                            //var queryString = util.getQueryString('ds_v1_activity_form_transaction_analytics_insert', paramsArr);
                            var queryString = util.getQueryString('ds_v1_1_activity_form_transaction_analytics_insert', paramsArr); //BETA
                            if (queryString != '') {
                                db.executeQuery(0, queryString, request, function (err, data) {
                                    next();
                                    if (err === false) {
                                        //callback(false, true);
                                        //return;
                                    } else {
                                        // some thing is wrong and have to be dealt
                                        //callback(err, false);
                                        //return;
                                    }
                                });
                            }
                        }).then(function () {
                            callback(false, {
                                formTransactionId: formTransactionId,
                                formId: formId
                            });
                        });
                    });
                } else {
                    //console.log('error while fetching from transaction data');
                    global.logger.write('conLog', 'error while fetching from transaction data', {}, request);
                }
            });
        });
    };

    this.alterActivityStatus = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityStreamTypeId = 11;
        //var activityStatusTypeCategoryId = Number(request.activity_status_type_category_id);
        var activityStatusId = Number(request.activity_status_id);
        var activityStatusTypeId = Number(request.activity_status_type_id);
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        var assetParticipantAccessId = Number(request.asset_participant_access_id);
        const widgetFieldsStatusesData = util.widgetFieldsStatusesData();

        if (request.hasOwnProperty('activity_type_category_id')) {
            var activityTypeCategroyId = Number(request.activity_type_category_id);
            switch (activityTypeCategroyId) {
                case 1: // to-do 
                    activityStreamTypeId = 404;
                    break;
                case 2: // notepad 
                    //activityStreamTypeId = 504;
                    break;
                case 3: //plant
                    break;
                case 4: //employee id card
                    activityStreamTypeId = 11; // nothing defined yet
                    break;
                case 5: //Co-worker Contact Card
                    activityStreamTypeId = 208;
                    break;
                case 6: //  External Contact Card - Customer
                    activityStreamTypeId = 1108;
                    break;
                    //Added by Nani Kalyan
                case 8: //Mail 
                    activityStreamTypeId = 1702;
                    break;
                    ////////////////////////////////
                case 50: 
                    activityStreamTypeId = 2204;
                    break;
                case 51: 
                    activityStreamTypeId = 2304;
                    break;
                case 48:
                case 9: //form
                    activityStreamTypeId = 704;
                    break;
                case 10: //document
                    activityStreamTypeId = 305;
                    break;
                case 11: //folder
                    activityStreamTypeId = 1402;
                    break;
                case 14: //voice call
                    activityStreamTypeId = 802; //Added by Nani Kalyan
                    break;
                case 15: //video conference
                    activityStreamTypeId = 1602; //Added by Nani Kalyan
                    break;
                case 28: // post-it
                    activityStreamTypeId = 903;
                    break;
                case 29: // External Contact Card - Supplier
                    activityStreamTypeId = 1208;
                    break;
                case 30: //contact group
                    activityStreamTypeId = 11; // non existent now 
                    break;
                    //Added by Nani Kalyan
                case 31: //Calendar Event 
                    activityStreamTypeId = 502;
                    break;
                    //Added by Nani Kalyan
                case 32: //Customer Request
                    activityStreamTypeId = 602;
                    break;
                    //Added by Nani Kalyan
                case 33: //Visitor Request 
                    activityStreamTypeId = 1302;
                    break;
                    //Added by Nani Kalyan
                case 34: //Time Card 
                    activityStreamTypeId = 1502;
                    break;
                    //PAM
                case 36: //Menu Item
                    activityStreamTypeId = 19004;
                    break;
                case 37: //Reservation
                    activityStreamTypeId = 18004;
                    break;
                    /*case 38:    //Item Order
                     activityStreamTypeId = 21001;
                     break;
                     case 39:    //Inventory
                     activityStreamTypeId = 20001;
                     break;*/
                case 40: //Payment
                    activityStreamTypeId = 22007;
                    break;
                case 41: //Event
                    activityStreamTypeId = 17004;
                    break;
                default:
                    activityStreamTypeId = 11; //by default so that we know
                    //console.log('adding streamtype id 11');
                    global.logger.write('conLog', 'adding streamtype id 11', {}, request);
                    break;
            }
            request.activity_stream_type_id = activityStreamTypeId;
        }
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        activityListUpdateStatus(request, async function (err, data) {
            if (err === false) {

                console.log("*****STATUS CHANGE | activityTypeCategroyId: ", activityTypeCategroyId);
                updateWidgetAggrStatus(request);               
                
                if(activityTypeCategoryId === 48){

                    let order_caf_approval_statuses, order_logged_statuses;
                    order_caf_approval_statuses = widgetFieldsStatusesData.ORDER_CAF_APPROVAL_STATUSES; //new Array(282556, 282586, 282640, 282622, 282669); //
                    order_logged_statuses = widgetFieldsStatusesData.ORDER_LOGGED_STATUSES;//new Array(282624, 282642, 282671, 282557, 282588);//

                    global.logger.write('conLog', '*****order_caf_approval_statuses*******'+Object.keys(order_caf_approval_statuses)+' '+String(request.activity_status_id), {}, request);
                    global.logger.write('conLog', '*****order_logged_statuses*******'+Object.keys(order_logged_statuses)+' '+String(request.activity_status_id), {}, request);

                    if(Object.keys(order_caf_approval_statuses).includes(String(request.activity_status_id))) {

                        global.logger.write('conLog', '*****ALTER CAF APPROVAL STATUS DATETIME*******', {}, request);
                        request['workflow_activity_id'] = request.activity_id;
                        request['order_caf_approval_datetime'] = util.addUnitsToDateTime(util.replaceDefaultDatetime(util.getCurrentUTCTime()), 5.5, 'hours');
                        request['order_caf_approval_log_diff'] = 0;
                        request['flag'] = 2;
                        request['datetime_log'] = util.getCurrentUTCTime();
                        activityCommonService.widgetActivityFieldTxnUpdateDatetime(request);

                    }else if(Object.keys(order_logged_statuses).includes(String(request.activity_status_id))){

                        global.logger.write('conLog', '*****ALTER ORDER LOGGED STATUS DATETIME*******', {}, request);
                        request['workflow_activity_id'] = request.activity_id;
                        request['order_logged_datetime'] = util.addUnitsToDateTime(util.replaceDefaultDatetime(util.getCurrentUTCTime()), 5.5, 'hours');
                        request['order_trigger_log_diff'] = 0;
                        request['order_caf_approval_log_diff'] = 0;
                        request['order_po_log_diff'] = 0;
                        request['flag'] = 3;
                        request['datetime_log'] = util.getCurrentUTCTime();
                        activityCommonService.widgetActivityFieldTxnUpdateDatetime(request);
                    }

                    /*Listener - Populate the data in Intermediate Tables for Reference, Combo fields
                    let activity_id = request.activity_id;
                    let activity_status_id = request.activity_status_id;
                    let activity_status_type_id = request.activity_status_type_id;
                    
                    let newRequest = Object.assign({}, request);
                        newRequest.operation_type_id = 16;
                    
                    const [err, respData] = await activityListingService.getWorkflowReferenceBots(newRequest);
                    console.log('Workflow Reference Bots for this activity_type : ', respData.length);
                    if(respData.length > 0) {
                        activityCommonService.activityEntityMappingUpdateStatus(request, {
                            activity_id,
                            activity_status_id,
                            activity_status_type_id
                        }, 1);
                    }
                    
                    newRequest.operation_type_id = 17;
                    const [err1, respData1] = await activityListingService.getWorkflowReferenceBots(newRequest);
                    console.log('Combo Field Reference Bots for this activity_type : ', respData1);
                    if(respData1.length > 0) {
                        activityCommonService.activityEntityMappingUpdateStatus(request, {
                            activity_id,
                            activity_status_id,
                            activity_status_type_id
                        }, 2);
                    }
                    */////////////////////////////////////////////////////////////////
                 }
                
                if (Number(request.device_os_id) === 9) {
                    global.logger.write('conLog', '*****ALTER STATUS : HITTING WIDGET ENGINE*******', {}, request);
                    request['source_id'] = 3;
                    //sendRequesttoWidgetEngine(request);
                }

                //if ((activityTypeCategroyId === 9 || activityTypeCategroyId === 48) && Number(request.device_os_id) !== 9) {
                if (activityTypeCategroyId === 9 || activityTypeCategroyId === 48) {

                    global.logger.write('conLog', '*****ALTER STATUS : STATUS CHANGE TXN INSERT*******', {}, request);

                    if (Number(request.activity_status_id) === Number(data[0].idExistingActivityStatus)) {
                        request.status_changed_flag = 0;
                    } else {
                        request.status_changed_flag = 1;
                    }

                    try {
                        let botEngineRequest = Object.assign({}, request);
                        botEngineRequest.form_id = request.activity_status_id;
                        botEngineRequest.field_id = 0;
                        botEngineRequest.flag = 4;

                        const [formConfigError, formConfigData] = await activityCommonService.workforceFormMappingSelect(botEngineRequest);
                        if (
                            (formConfigError === false) &&
                            (Number(formConfigData.length) > 0) &&
                            (Number(formConfigData[0].form_flag_workflow_enabled) === 1)
                        ) {
                            // Proceeding because there was no error found, there were records returned
                            // and form_flag_workflow_enabled is set to 1
                            let botsListData = await activityCommonService.getBotsMappedToActType(botEngineRequest);
                            if (botsListData.length > 0) {
                                botEngineRequest.bot_id = botsListData[0].bot_id;
                                await activityCommonService.makeRequest(botEngineRequest, "engine/bot/init", 1)
                                    .then((resp) => {
                                        global.logger.write('debug', "Bot Engine Trigger Response: " + JSON.stringify(resp), {}, request);
                                    });
                            }
                        }
                    } catch (botInitError) {
                        global.logger.write('error', botInitError, botInitError, request);
                    }

                    global.logger.write('conLog', '*****STATUS CHANGE FLAG : ' + request.status_changed_flag, {}, request);
                    
                    var timeDuration = util.differenceDatetimes(util.getCurrentUTCTime(), util.replaceDefaultDatetime(data[0].datetimeExistingActivityStatusUpdated));
                    if (Number(data[0].idExistingActivityStatus) > 0 && Number(request.activity_status_id) > 0) {

                        await activityCommonService.activityStatusChangeTxnInsertV2(request, Number(timeDuration) / 1000, {
                            from_status_id: Number(data[0].idExistingActivityStatus),
                            to_status_id: Number(request.activity_status_id),
                            from_status_datetime: util.replaceDefaultDatetime(data[0].datetimeExistingActivityStatusUpdated),
                            to_status_datetime: util.replaceDefaultDatetime(data[0].updatedDatetime)
                        }).then(() => {
                            console.log("*****activityService WORKLOAD UPDATE | data: ", JSON.stringify(data));
                            activityCommonService.activityLeadUpdate(request, {}, true);
                            global.logger.write('conLog', '*****ALTER STATUS : HITTING WIDGET ENGINE*******', {}, request);
                            request['source_id'] = 3;
                            //sendRequesttoWidgetEngine(request);
                        }).catch((err)=>{
                            global.logger.write('conLog', '*****ERROR INSERT : activityStatusChangeTxnInsertV2' + err, {}, request);
                        })

                        // Capture workflow, customer and industry exposure for a desk asset
                        await captureWorkExperienceForDeskAsset(request);
                    }
                }

                //Remote Analytics
                if (activityTypeCategroyId == 28 || activityTypeCategroyId == 8) {
                    if (request.activity_status_type_id == 74 || request.activity_status_type_id == 19) {
                        avgTotRespTimePostItsInmailsSummaryInsert(request).then(() => {});
                    }
                }

                //TaskList Analytics
                if (activityTypeCategroyId == 10 || request.activity_sub_type_id == 1) {
                    switch (Number(request.activity_status_type_id)) {
                        case 26: //Closed 
                            updateFlagOntime(request).then(() => {

                                activityCommonService.getActivityDetails(request, 0, function (err, resultData) {
                                    if (err === false) {
                                        var newRequest = Object.assign({}, request);
                                        newRequest.asset_id = resultData[0].activity_owner_asset_id;

                                        getTaskAcceptanceStats(newRequest, 2).then((acceptanceStats) => { // weekly and monthly stats here    
                                            acceptanceStatsSummaryInsert(newRequest, acceptanceStats, {
                                                weekly: 5,
                                                monthly: 12
                                            }, function () {});
                                        });
                                    }
                                });

                                getTaskAcceptanceStats(request, 2).then((acceptanceStats) => { // weekly and monthly stats here    
                                    acceptanceStatsSummaryInsert(request, acceptanceStats, {
                                        weekly: 5,
                                        monthly: 12
                                    }, function () {});
                                });

                            });

                            if (request.hasOwnProperty('activity_parent_id')) {
                                if (util.hasValidGenericId(request, 'activity_parent_id')) {
                                    activityCommonService.getActivityDetails(request, Number(request.activity_parent_id), function (err, activityData) {
                                        if (err === false) {
                                            switch (Number(activityData[0]['activity_type_category_id'])) {
                                                case 11:
                                                    //Updating the due date of the project                                                    
                                                    activityCommonService.updateProjectEndDateTime(request, (err, oldDateTime, newDateTime) => {
                                                        if (err === false) {
                                                            var coverAlterJson = {};
                                                            coverAlterJson.title = {
                                                                old: activityData[0]['activity_title'],
                                                                new: activityData[0]['activity_title']
                                                            };
                                                            coverAlterJson.description = {
                                                                old: activityData[0]['activity_description'],
                                                                new: activityData[0]['activity_description']
                                                            };
                                                            coverAlterJson.duedate = {
                                                                old: oldDateTime,
                                                                new: newDateTime
                                                            };
                                                            callAlterActivityCover(request, coverAlterJson, activityData[0]['activity_type_category_id']).then(() => {}).catch(() => {});
                                                        }
                                                    });
                                            }
                                        }
                                    });
                                }
                            }

                            break;
                        case 130: //Accepted 
                            //updateFlagOntime(request).then(()=>{});
                            break;
                        case 134: //Certified
                            updateFlagQuality(request).then(() => {});
                            break;
                        case 135: //Not Certified
                            //updateFlagOntime(request).then(()=>{});
                            break;
                        default:
                            request.set_flag = 0; //
                            updateFlagOntime(request).then(() => {});
                            break;
                    }
                }

                //Inmail response < 24 hours
                if (activityTypeCategoryId === 8 && assetParticipantAccessId === 19) { //18 Sender //19 Receiver
                    respReqinMail(request).then(() => {
                        inMailMonthlySummaryTransInsert(request).then(() => {});
                    });
                }
                switch (activityStatusTypeId) {

                    case 26: //completed // flag value is 2
                    case 24:
                    case 155:
                        updateActivityClosedDatetime(request);
                        /*activityCommonService.getActivityDetails(request, 0, function (err, resultData) {
                            if (err === false) {
                                var newRequest = Object.assign({}, request);
                                newRequest.asset_id = resultData[0].activity_owner_asset_id;

                                getTaskAcceptanceStats(newRequest, 2).then((acceptanceStats) => { // weekly and monthly stats here    
                                    acceptanceStatsSummaryInsert(newRequest, acceptanceStats, {
                                        weekly: 5,
                                        monthly: 12
                                    }, function () {});
                                });
                            }
                        });

                        getTaskAcceptanceStats(request, 2).then((acceptanceStats) => { // weekly and monthly stats here    
                            acceptanceStatsSummaryInsert(request, acceptanceStats, {
                                weekly: 5,
                                monthly: 12
                            }, function () {});
                        });
                        break;*/
                        break;
                    case 130: // flag value is 1 //accepted
                        activityCommonService.updateLeadStatus(request, 1, function (err, result) {
                            if (err === false) {
                                activityCommonService.updateOwnerStatus(request, 1, function (err, result) {
                                    if (err === false) {
                                        getTaskAcceptanceStats(request, 1).then((acceptanceStats) => { // weekly and monthly stats here   
                                            acceptanceStatsSummaryInsert(request, acceptanceStats, {
                                                weekly: 4,
                                                monthly: 11
                                            }, function () {});
                                        });

                                        getTaskAcceptanceStats(request, 6).then((acceptanceStats) => { // weekly and monthly stats here            
                                            acceptanceStatsSummaryInsert(request, acceptanceStats, {
                                                weekly: 8,
                                                monthly: 8
                                            }, function () {});
                                        });
                                    } else {}
                                });
                            } else {}
                        });
                        break;

                        //rejected
                    case 131:
                        activityCommonService.updateLeadStatus(request, 2, function (err, result) {
                            if (err === false) {
                                activityCommonService.updateOwnerStatus(request, 2, function (err, result) {
                                    if (err === false) {
                                        getTaskAcceptanceStats(request, 3).then((acceptanceStats) => { // weekly and monthly stats here    
                                            acceptanceStatsSummaryInsert(request, acceptanceStats, {
                                                weekly: 6,
                                                monthly: 13
                                            }, function () {});
                                        });
                                        getTaskAcceptanceStats(request, 4).then((acceptanceStats) => { //there is a gray area here     
                                            acceptanceStatsSummaryInsert(request, acceptanceStats, {
                                                weekly: 7,
                                                monthly: 15
                                            }, function () {});
                                        });
                                        getTaskAcceptanceStats(request, 6).then((acceptanceStats) => { // weekly and monthly stats here     
                                            acceptanceStatsSummaryInsert(request, acceptanceStats, {
                                                weekly: 8,
                                                monthly: 8
                                            }, function () {});
                                        });
                                    } else {}
                                });

                            } else {}
                        });
                        break;

                        //discussion
                    case 132:
                        activityCommonService.updateLeadStatus(request, 3, function (err, result) {
                            if (err === false) {
                                activityCommonService.updateOwnerStatus(request, 3, function (err, result) {
                                    if (err === false) {
                                        getTaskAcceptanceStats(request, 5).then((acceptanceStats) => { // weekly and monthly stats here            
                                            acceptanceStatsSummaryInsert(request, acceptanceStats, {
                                                weekly: 8,
                                                monthly: 8
                                            }, function () {});
                                        });
                                    } else {}
                                });
                            } else {}
                        });
                        break;
                }

                assetActivityListUpdateStatus(request, activityStatusId, activityStatusTypeId, function (err, data) {

                });
                activityCommonService.activityListHistoryInsert(request, 402, function (err, result) {

                });
                activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                });
                activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});
                activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {

                });
                // activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {

                // });
                // 
                global.logger.write('conLog', "Calling updateActivityLogLastUpdatedDatetime", {}, request);
                try {
                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {

                    });

                } catch (error) {
                    global.logger.write('debug', error, {}, request);
                }
                global.logger.write('conLog', "DONE with updateActivityLogLastUpdatedDatetime", {}, request);
                // 
                // 
                // 
                // Send a PubNub push
                // var pubnubMsg = {};
                // pubnubMsg.type = 'activity_unread';
                // pubnubMsg.organization_id = request.organization_id;
                // pubnubMsg.desk_asset_id = request.asset_id;
                // pubnubMsg.activity_type_category_id = 9;
                // global.logger.write('debug', 'PubNub Message: ' + JSON.stringify(pubnubMsg, null, 2), {}, request);

                // activityPushService.pubNubPush(request, pubnubMsg, function (err, data) {
                //     global.logger.write('debug', 'PubNub Push sent.', {}, request);
                //     global.logger.write('debug', data, {}, request);
                // });
                // 
                //
                // global.logger.write('debug', JSON.stringify(activityTypeCategoryId), {}, request);
                // global.logger.write('debug', JSON.stringify(activityStatusId), {}, request);
                // global.logger.write('debug', 'OUTSIDE Calling vodafoneStatusUpdate...', {}, request);

                // activityFormId === 837
                if (activityStatusId === 278416 || activityStatusId === 278417 || activityStatusId === 278418 || activityStatusId === 278419 || activityStatusId === 278420 || activityStatusId === 278421) {
                    // Call the VODAFONE logic method (in a separate file)
                    // activityCommonService.activityTimelineTransactionInsert(request, {}, 305, function (err, data) {
                    //     console.log('\x1b[36mCalling the vodafoneStatusUpdate file.\x1b[0m');
                    //     vodafoneStatusUpdate(request, activityCommonService, objectCollection);
                    // });
                    global.logger.write('debug', 'Calling vodafoneStatusUpdate...', {}, request);
                    //vodafoneStatusUpdate(request, activityCommonService, objectCollection);

                    //makeRequest to /vodafone/feasibility_checker/update BOT4
                    request.worflow_trigger_url = util.getWorkFlowUrl(request.url);
                    global.logger.write('debug', 'worflow_trigger_url: ' + request.worflow_trigger_url, {}, request);

                    activityCommonService.getWorkflowForAGivenUrl(request).then((data) => {
                        global.logger.write('debug', 'workflow_execution_url: ' + data[0].workflow_execution_url, {}, request);
                        activityCommonService.makeRequest(request, data[0].workflow_execution_url, 1).then((resp) => {
                            global.logger.write('debug', resp, {}, request);
                        });
                    });
                }


                // }
                // 
                // 
                updateProjectStatusCounts(request).then(() => {});
                // activityPushService.sendPush(request, objectCollection, 0, function () {});
                try {
                    if (
                        (request.hasOwnProperty("is_child_order") && Boolean(request.is_child_order) === true) &&
                        (
                            Number(request.activity_type_category_id) === 9 ||
                            Number(request.activity_type_category_id) === 48
                        )
                    ) {
                        throw new Error("ChildOrder::NoPush")
                    }
                    activityPushService.sendPush(request, objectCollection, 0, function () {});
                } catch (error) {
                    console.log("[WARNING] No Push Sent: ", error);
                }

                /*               if (activityTypeCategoryId === 9 && activityStatusTypeId === 23) { //form and submitted state                    
                                   duplicateFormTransactionData(request, function (err, data) {
                                       var widgetEngineQueueMessage = {
                                           form_id: data.formId,
                                           form_transaction_id: data.formTransactionId,
                                           organization_id: request.organization_id,
                                           account_id: request.account_id,
                                           workforce_id: request.workforce_id,
                                           asset_id: request.asset_id,
                                           activity_id: request.activity_id,
                                           activity_type_category_id: request.activity_type_category_id,
                                           activity_stream_type_id: request.activity_stream_type_id,
                                           track_gps_location: request.track_gps_location,
                                           track_gps_datetime: request.track_gps_datetime,
                                           track_gps_accuracy: request.track_gps_accuracy,
                                           track_gps_status: request.track_gps_status,
                                           device_os_id: request.device_os_id,
                                           service_version: request.service_version,
                                           app_version: request.app_version,
                                           api_version: request.api_version
                                       };
                                       var event = {
                                           name: "Form Based Widget Engine",
                                           payload: widgetEngineQueueMessage
                                       };
                                       queueWrapper.raiseFormWidgetEvent(event, request.activity_id);
                                   });
                               } */

                callback(false, {}, 200);
                return;
            } else {
                callback(err, {}, -9998);
                return;
            }

        });

        // Post-It Productivity Score Logic
        if (activityTypeCategoryId === 28 && (activityStatusTypeId === 73 || activityStatusTypeId === 74)) {
            updatePostItProductivityScore(request).then(() => {});
        }
    };

    async function captureWorkExperienceForDeskAsset(request) {
        let summaryInlineData = {
            workload_data: {}
        };
        let totalExpectedWorkHours = 0,
            totalActualWorkHours = 0,
            workflowActivityTypeID = 0,
            activityOwnerAssetID = 0,
            activityLeadAssetID = 0;

        try {
            const workflowActivityData = await activityCommonService.getActivityDetailsPromise(request, Number(request.activity_id));
            if (Number(workflowActivityData.length) > 0) {
                workflowActivityTypeID = Number(workflowActivityData[0].activity_type_id);
                activityLeadAssetID = Number(workflowActivityData[0].activity_lead_asset_id);
                activityOwnerAssetID = Number(workflowActivityData[0].activity_owner_asset_id);
            }
        } catch (error) {
            logger.error("captureWorkExperienceForDeskAsset | No Workflow Data Found in DB", {type: "summary_update", error});
        }

        for (const workExperienceFlag of [1, 2, 3, 4, 5, 6, 7, 8]) {
            const [err, workExpData] = await activityStatusChangeTransactionSelectAssetWorkExp({
                ...request,
                asset_id: activityLeadAssetID || activityOwnerAssetID,
                flag: workExperienceFlag
            });
            switch (workExperienceFlag) {
                case 0:
                    totalActualWorkHours = workExpData[0].actual_duration;
                    totalExpectedWorkHours = workExpData[0].expected_duration;
                    break;
                
                case 1:
                    summaryInlineData.workload_data.workflow_category_workload_data = workExpData.map(work => {
                        return {
                            workflow_category_name: work.tag_type_name,
                            workflow_category_id: work.tag_type_id,
                            workflow_category_workload_hours: work.actual_duration
                        };
                    });
                    break;

                case 2:
                    summaryInlineData.workload_data.workflow_type_workload_data = workExpData.map(work => {
                        return {
                            workflow_type_name: work.activity_type_tag_name,
                            workflow_type_id: work.activity_type_tag_id,
                            workflow_type_workload_hours: work.actual_duration
                        };
                    });
                    break;

                case 3:
                    summaryInlineData.workload_data.workflow_workload_data = workExpData.map(work => {
                        return {
                            workflow_name: work.activity_type_name,
                            workflow_id: work.activity_type_id,
                            workflow_workload_hours: work.actual_duration
                        };
                    });
                    break;

                case 4:
                    summaryInlineData.workload_data.industry_workload_data = workExpData.map(work => {
                        return {
                            industry_name: work.industry_name,
                            industry_id: work.industry_id,
                            industry_workload_hours: work.actual_duration
                        };
                    });
                    break;

                case 5:
                    summaryInlineData.workload_data.customer_workload_data = workExpData.map(work => {
                        return {
                            customer_name: work.customer_asset_first_name,
                            customer_asset_id: work.customer_asset_id,
                            customer_workload_hours: work.actual_duration
                        };
                    });
                    break;

                case 6:
                    summaryInlineData.workload_data.role_workload_data = workExpData.map(work => {
                        return {
                            role_name: work.lead_asset_type_name,
                            role_id: work.lead_asset_type_id,
                            role_workload_hours: work.actual_duration
                        };
                    });
                    break;

                case 7:
                    summaryInlineData.workload_data.status_workload_data = workExpData.map(work => {
                        return {
                            status_name: work.from_activity_status_name,
                            status_id: work.from_activity_status_id,
                            status_workload_hours: work.actual_duration,
                            status_expected_hours: work.expected_duration
                        };
                    });
                    break;
                
                case 8:
                    summaryInlineData.workload_data.rollback_data = {
                        rollback_count: workExpData[0].rollback_data
                    };
                    break;

                default:
                    // Do nothing
                    break;
            }
        }

        try {
            await activityCommonService.assetSummaryTransactionInsert({
                ...request,
                asset_id: activityLeadAssetID || activityOwnerAssetID,
                monthly_summary_id: 1,
                entity_decimal_1: totalExpectedWorkHours,
                entity_decimal_2: totalActualWorkHours,
                inline_data: JSON.stringify(summaryInlineData)
            });
        } catch (error) {
            logger.error("captureWorkExperienceForDeskAsset | Error updating asset summary", {type: "summary_update", error});
        }

        return;
    }

    // Set Business Hours @Individual(Desk) Level
    async function activityStatusChangeTransactionSelectAssetWorkExp(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.flag,
            "1970-01-01 00:00:00", // request.datetime_start
            util.getCurrentUTCTime() // datetime_end
            
        );
        const queryString = util.getQueryString('ds_p1_activity_status_change_transaction_select_asset_work_exp', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    // To calculate productivity scores for Post-Its
    function updatePostItProductivityScore(request) {
        return new Promise((resolve, reject) => {
            var creationDate;

            //Get activity Details
            activityCommonService.getActivityDetails(request, 0, function (err, activityData) {
                if (err === false) {
                    creationDate = util.replaceDefaultDatetime(activityData[0].activity_datetime_end_deferred);

                    //Get the Config Value
                    activityCommonService.retrieveAccountList(request, (err, data) => {
                        if (err === false) {
                            var configRespHours = data[0].account_config_response_hours;

                            //diff will be in milli seconds
                            var diff = util.differenceDatetimes(request.datetime_log, util.replaceDefaultDatetime(creationDate));
                            diff = diff / 3600000;
                            diff = Number(diff);
                            (diff <= configRespHours) ? onTimeFlag = 1: onTimeFlag = 0;

                            //Update the flag
                            activityCommonService.updateInMailResponse(request, onTimeFlag, (err, data) => {
                                if (err === false) {

                                    // Get the inmail Counts | Monthly Summary Insert
                                    activityCommonService.getPostItCounts(request, 1, (err, countsData) => {
                                        if (err === false) {
                                            let percentage = 0;
                                            let noOfReceivedPostits = countsData[0].countReceivedPostits;
                                            let noOfRespondedPostits = countsData[0].countOntimeRespondedPostits;

                                            if (noOfReceivedPostits !== 0) {
                                                percentage = (noOfRespondedPostits / noOfReceivedPostits) * 100;
                                            }

                                            global.logger.write('conLog', 'Number Of ReceivedPostits : ' + noOfReceivedPostits, {}, request);
                                            global.logger.write('conLog', 'Number Of RespondedPostits : ' + noOfRespondedPostits, {}, request);
                                            global.logger.write('conLog', 'Percentage : ' + percentage, {}, request);

                                            //Insert into monthly summary table
                                            var monthlyCollection = {};
                                            monthlyCollection.summary_id = 29;
                                            monthlyCollection.asset_id = request.asset_id;
                                            monthlyCollection.entity_bigint_1 = noOfReceivedPostits; //denominator
                                            monthlyCollection.entity_double_1 = percentage; //percentage value
                                            monthlyCollection.entity_decimal_1 = percentage; //percentage value
                                            monthlyCollection.entity_decimal_3 = noOfRespondedPostits; //numerator

                                            activityCommonService.monthlySummaryInsert(request, monthlyCollection, (err, data) => {});

                                            resolve();
                                        }
                                    }); // getInmailCounts for the Month

                                    // Get the inmail Counts | Weekly Summary Insert
                                    activityCommonService.getPostItCounts(request, 2, (err, countsData) => {
                                        if (err === false) {
                                            let percentage = 0;
                                            let noOfReceivedPostits = countsData[0].countReceivedPostits;
                                            let noOfRespondedPostits = countsData[0].countOntimeRespondedPostits;

                                            if (noOfReceivedPostits !== 0) {
                                                percentage = (noOfRespondedPostits / noOfReceivedPostits) * 100;
                                            }

                                            global.logger.write('conLog', 'Number Of ReceivedPostits : ' + noOfReceivedPostits, {}, request);
                                            global.logger.write('conLog', 'Number Of RespondedPostits : ' + noOfRespondedPostits, {}, request);
                                            global.logger.write('conLog', 'Percentage : ' + percentage, {}, request);

                                            //Insert into weekly summary table
                                            var weeklyCollection = {};
                                            weeklyCollection.summary_id = 16;
                                            weeklyCollection.asset_id = request.asset_id;
                                            weeklyCollection.entity_bigint_1 = noOfReceivedPostits;
                                            weeklyCollection.entity_double_1 = percentage;
                                            weeklyCollection.entity_decimal_1 = percentage;
                                            weeklyCollection.entity_decimal_3 = noOfRespondedPostits;

                                            activityCommonService.weeklySummaryInsert(request, weeklyCollection, (err, data) => {});

                                        }
                                    }); // getInmailCounts for the Week
                                }
                            }); // updateInmailResponse                            
                        }
                    }); // retrieveAccountList
                }
            }); // getActivityDetails
        }); // updateInmailPS Promise
    }

    function createTimelineEntry(request) {
        return new Promise((resolve, reject) => {
            var newRequest = Object.assign({}, request);

            var mailBody = "Title: " + request.activity_title + "<br>";
            //mailBody += "Description: <br>";
            mailBody += "Organization Name : " + request.signedup_asset_organization_name + "<br>";
            mailBody += "Workfore Name : " + request.signedup_asset_workforce_name + "<br>";
            //mailBody += "Asset Id : " + request.signedup_asset_id + "<br>";
            mailBody += "Asset Name : " + request.signedup_asset_organization_name + "<br>";
            mailBody += "Asset Phone Country Code : " + request.signedup_asset_phone_country_code + "<br>";
            mailBody += "Asset Phone Number : " + request.signedup_asset_phone_number + "<br>";
            mailBody += "Asset Email Id : " + request.signedup_asset_email_id;

            var activityTimelineCollection = {};
            activityTimelineCollection.content = mailBody;
            activityTimelineCollection.subject = "Added : " + util.getCurrentDate();
            activityTimelineCollection.mail_body = mailBody;
            activityTimelineCollection.attachments = [];
            activityTimelineCollection.asset_reference = [];
            activityTimelineCollection.activity_reference = [];
            activityTimelineCollection.form_approval_field_reference = [];

            // console.log("activityTimelineCollection : ", JSON.stringify(activityTimelineCollection));
            global.logger.write('debug', 'activityTimelineCollection' + JSON.stringify(activityTimelineCollection, null, 2), {}, request);

            newRequest.activity_stream_type_id = 325;
            newRequest.signedup_asset_id = request.signedup_asset_id;
            newRequest.track_gps_datetime = util.getCurrentUTCTime();
            newRequest.activity_timeline_collection = JSON.stringify(activityTimelineCollection);

            var event = {
                name: "addTimelineTransaction",
                service: "activityTimelineService",
                method: "addTimelineTransaction",
                payload: newRequest
            };

            queueWrapper.raiseActivityEvent(event, newRequest.activity_id, (err, resp) => {
                if (err) {
                    // console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                    global.logger.write('debug', 'Error in queueWrapper raiseActivityEvent: ' + JSON.stringify(err), err, request);

                    //res.send(responseWrapper.getResponse(false, {}, -5999,req.body));
                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                } else {}

                resolve();
            });
        });
    }

    function updateProjectStatusCounts(request) {
        return new Promise((resolve, reject) => {
            activityCommonService.getActivityDetails(request, 0, function (err, resp) { //If parent Id > 0 then only he is calling these calls
                if (err === false) {
                    var parentActivityId;

                    if (resp.length > 0) {
                        parentActivityId = (Number(resp[0].parent_activity_id) > 0) ? resp[0].parent_activity_id : 0;
                    } else {
                        parentActivityId = 0;
                    }

                    if (parentActivityId > 0) {
                        var paramsArr = new Array(
                            request.organization_id,
                            parentActivityId,
                            request.datetime_log
                        );
                        var queryString = util.getQueryString('ds_p1_activity_list_select_project_status_counts', paramsArr);
                        if (queryString != '') {
                            db.executeQuery(1, queryString, request, function (err, countsData) {
                                if (err === false) {
                                    //resolve();
                                    paramsArr = new Array(
                                        parentActivityId,
                                        request.organization_id,
                                        countsData[0].countOpen,
                                        countsData[0].countClosed,
                                        request.asset_id,
                                        request.datetime_log
                                    );
                                    queryString = util.getQueryString('ds_p1_activity_list_update_parent_task_counts', paramsArr);
                                    if (queryString != '') {
                                        db.executeQuery(0, queryString, request, function (err, data) {
                                            if (err === false) {
                                                queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_parent_task_counts', paramsArr);
                                                if (queryString != '') {
                                                    db.executeQuery(0, queryString, request, function (err, data) {
                                                        (err === false) ? resolve(): reject(err);
                                                    });
                                                }
                                            } else {
                                                reject(err);
                                            }
                                        });
                                    }

                                } else {
                                    reject(err);
                                }
                            });
                        }
                    } else {
                        resolve();
                    }
                } else {
                    reject(err);
                }
            });
        });
    }

    function respReqinMail(request) {
        return new Promise((resolve, reject) => {
            var activityFlagResponseRequired;
            var diff;
            activityCommonService.getActivityDetails(request, 0, function (err, resp) {
                if (err === false) {

                    //console.log('request.datetime_log : ',request.datetime_log);
                    //console.log('resp[0].activity_datetime_end_expected : ', util.replaceDefaultDatetime(resp[0].activity_datetime_end_expected));

                    //diff will be in milli seconds
                    diff = util.differenceDatetimes(request.datetime_log, util.replaceDefaultDatetime(resp[0].activity_datetime_end_expected));
                    diff = diff / 3600000;
                    diff = Number(diff);
                    (diff <= 24) ? activityFlagResponseRequired = 1: activityFlagResponseRequired = 0;
                    //console.log('DIFF : ', typeof diff);
                    //console.log('activityFlagResponseRequired : ', activityFlagResponseRequired);

                    var paramsArr = new Array(
                        request.organization_id,
                        request.account_id,
                        request.workforce_id,
                        request.activity_id,
                        request.asset_id,
                        activityFlagResponseRequired,
                        request.datetime_log
                    );
                    var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_inmail_response', paramsArr);
                    if (queryString !== '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                return resolve(false, true);
                            } else {
                                return reject(err, false);
                            }
                        });
                    }

                } else {
                    reject(err);
                }
            });
        });
    }
    //For inMails
    function inMailMonthlySummaryTransInsert(request) {
        return new Promise((resolve, reject) => {
            activityCommonService.getInmailCounts(request, function (err, data) {
                if (err === false) {
                    var percent = 0;
                    if (Number(data[0].countToBeRespondedInmails) !== 0) {
                        percent = (data[0].countOntimeRespondedInmails / data[0].countToBeRespondedInmails) * 100;
                    }

                    request.weekly_summary_id = 3;
                    request.entity_bigint_1 = data[0].countOntimeRespondedInmails; //entity_bigint_1, //ontimecount
                    request.entity_double_1 = data[0].countReceivedInmails; //entity_double_1, //total count
                    request.entity_decimal_1 = percent; //entity_decimal_1, //percentage
                    request.entity_decimal_2 = data[0].countToBeRespondedInmails; //entity_decimal_2, //toberesponsded                    
                    request.entity_text_1 = data[0].totalHours; //entity_text_1, 

                    //insert
                    var paramsArr = new Array(
                        10, //request.monthly_summary_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        util.getStartDayOfMonth(), //entity_date_1,    //Monthly Month start Date
                        "", //entity_datetime_1, 
                        "", //entity_tinyint_1, 
                        request.entity_bigint_1, //entity_bigint_1, //ontimecount
                        request.entity_double_1, //entity_double_1, //total count
                        request.entity_decimal_1, //entity_decimal_1, //percentage
                        request.entity_decimal_2, //entity_decimal_2, //toberesponsded
                        "", //entity_decimal_3, 
                        request.entity_text_1, //entity_text_1, 
                        "", //entity_text_2
                        request.track_latitude,
                        request.track_longitude,
                        request.track_gps_accuracy,
                        request.track_gps_status,
                        request.track_gps_location,
                        request.track_gps_datetime,
                        request.device_manufacturer_name,
                        request.device_model_name,
                        request.device_os_id,
                        request.device_os_name,
                        request.device_os_version,
                        request.app_version,
                        request.api_version,
                        request.asset_id,
                        request.message_unique_id,
                        request.flag_retry || 0,
                        request.flag_offline || 0,
                        request.track_gps_datetime,
                        request.datetime_log
                    );
                    var queryString = util.getQueryString('ds_v1_asset_monthly_summary_transaction_insert', paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                //Inserting the Response Rate
                                avgTotRespTimeSummaryInsert(request).then(() => {});
                                resolve(data);
                            } else {
                                reject(err);
                            }
                        });
                    }
                }
            });
        });
    }

    function updateFlagOntime(request) {
        return new Promise((resolve, reject) => {
            activityCommonService.getActivityDetails(request, 0, function (err, data) {
                if (err === false) {
                    var dueDate = util.replaceDefaultDatetime(data[0].activity_datetime_end_deferred);

                    // console.log('util.getCurrentUTCTime() : ', util.getCurrentUTCTime());
                    // console.log('dueDate : ', dueDate);

                    global.logger.write('debug', 'util.getCurrentUTCTime(): ' + util.getCurrentUTCTime(), {}, request);
                    global.logger.write('debug', 'dueDate: ' + dueDate, {}, request);

                    if (request.hasOwnProperty('set_flag')) {
                        if (request.set_flag == 0) {
                            var paramsArr = new Array(
                                request.activity_id,
                                request.organization_id,
                                0, //activity_flag_delivery_ontime,
                                request.asset_id,
                                request.datetime_log
                            );
                            var queryString = util.getQueryString('ds_v1_activity_list_update_flag_ontime', paramsArr);
                            if (queryString != '') {
                                db.executeQuery(0, queryString, request, function (err, data) {
                                    (err === false) ? resolve(data): reject(err);
                                });
                            }
                        }
                    } else {
                        if (util.getCurrentUTCTime() <= dueDate) {
                            var paramsArr = new Array(
                                request.activity_id,
                                request.organization_id,
                                1, //activity_flag_delivery_ontime,
                                request.asset_id,
                                request.datetime_log
                            );
                            var queryString = util.getQueryString('ds_v1_activity_list_update_flag_ontime', paramsArr);
                            if (queryString != '') {
                                db.executeQuery(0, queryString, request, function (err, data) {
                                    (err === false) ? resolve(data): reject(err);
                                });
                            }
                        }
                    }

                } else {
                    reject(err);
                }
            });

        });
    }

    function updateFlagQuality(request) {
        return new Promise((resolve, reject) => {
            activityCommonService.getActivityDetails(request, 0, function (err, data) {
                if (err === false) {
                    var dueDate = util.replaceDefaultDatetime(data[0].activity_datetime_end_expected);
                    if (util.getCurrentDate() <= dueDate) {
                        var paramsArr = new Array(
                            request.activity_id,
                            request.organization_id,
                            1, //activity_flag_delivery_quality,
                            request.asset_id,
                            request.datetime_log
                        );
                        var queryString = util.getQueryString('ds_p1_activity_list_update_flag_quality', paramsArr);
                        if (queryString != '') {
                            db.executeQuery(0, queryString, request, function (err, data) {
                                (err === false) ? resolve(data): reject(err);
                            });
                        }
                    }
                }
            });
        });
    }

    //Remote Analytics    Weekly
    function avgTotRespTimePostItsInmailsSummaryInsert(request) {
        return new Promise((resolve, reject) => {
            var creationDate;
            request.weekly_summary_id = (request.activity_type_category_id == 28) ? 1 : 2;
            activityCommonService.getActivityDetails(request, 0, function (err, data) {
                if (err === false) {
                    creationDate = util.replaceDefaultDatetime(data[0].activity_datetime_start_expected);
                    assetWeeklySummaryTrans(request, creationDate).then((result) => {
                        if (result.length > 0) {
                            request.entity_bigint_1 = result[0].data_entity_bigint_1 + 1;
                            request.entity_text_1 = Number(result[0].data_entity_text_1); //total duration of time
                            request.entity_text_1 += (util.differenceDatetimes(request.datetime_log, creationDate)) / 1000;
                            request.entity_double_1 = (request.entity_text_1) / request.entity_bigint_1; //avg response time;
                        } else {
                            request.entity_bigint_1 = 1;
                            request.entity_text_1 = (util.differenceDatetimes(request.datetime_log, creationDate)) / 1000; //postit creation_datetime - logdatetime 
                            request.entity_double_1 = request.entity_text_1; //Average REsponse time                                          
                        }

                        avgTotRespTimeSummaryInsert(request).then(() => {
                            resolve();
                        });
                    });
                } else {
                    reject(err);
                }
            });
        });
    }
    //get the current total number of hours to respond and current number of post its / inmails
    function assetWeeklySummaryTrans(request, creationDatetime) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.asset_id,
                request.operating_asset_id,
                request.organization_id,
                request.weekly_summary_id,
                util.getFormatedLogDate(creationDatetime)
            );
            var queryString = util.getQueryString('ds_p1_asset_weekly_summary_transaction_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log('assetWeeklySummaryTrans : \n', data, "\n");
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    }

    function avgTotRespTimeSummaryInsert(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.weekly_summary_id,
                request.asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                util.getStartDayOfWeek(), //entity_date_1, //WEEK
                request.entity_datetime_1,
                request.entity_tinyint_1,
                request.entity_bigint_1,
                request.entity_double_1,
                request.entity_decimal_1,
                request.entity_decimal_2,
                request.entity_decimal_3,
                request.entity_text_1, //request.asset_frist_name
                request.entity_text_2, //request.asset_last_name
                request.track_latitude,
                request.track_longitude,
                request.track_gps_accuracy,
                request.track_gps_enabled,
                request.track_gps_location,
                request.location_datetime,
                request.device_manufacturer_name,
                request.device_model_name,
                request.device_os_id,
                request.device_os_name,
                request.device_os_version,
                request.device_app_version,
                request.device_api_version,
                request.asset_id,
                request.message_unique_id,
                request.flag_retry || 0,
                request.falg_retry_offline || 0,
                request.transaction_datetime,
                request.datetime_log
            );
            var queryString = util.getQueryString('ds_v1_asset_weekly_summary_transaction_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    }

    this.inmailResReqSet = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_id,
            request.asset_id,
            request.activity_flag_response_required,
            util.getCurrentUTCTime()
        );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_inmail_response_req_flag', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, {}, 200);
                    return;
                } else {
                    callback(true, err, -9999);
                    return;
                }
            });
        }
    };

    this.updateOwnerRating = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var flag = 1;
        if (Number(request.owner_specification_rating) === -1 || Number(request.owner_decision_rating) === -1 || Number(request.owner_planning_rating) === -1) {
            flag = 2;
        }
        var paramsArr = new Array(
            request.activity_id,
            request.owner_asset_id,
            request.organization_id,
            flag,
            request.owner_specification_rating,
            request.owner_decision_rating,
            request.owner_planning_rating,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        var queryString = util.getQueryString('ds_p1_activity_list_update_creator_rating', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_creator_rating', paramsArr);
                    if (queryString !== '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                callback(false, {}, 200);
                                var collection = {};
                                collection.flag_filter = 1;
                                collection.asset_id = request.owner_asset_id;
                                collection.operating_asset_id = request.owner_operating_asset_id;
                                collection.datetime_start = util.getStartDayOfWeek();
                                collection.datetime_end = util.getEndDayOfWeek(); // getting weekly data
                                if (flag === 1) {
                                    activityCommonService.getAssetAverageRating(request, collection).then((assetAverageRating) => {
                                        //console.log(assetAverageRating);
                                        /*
                                         * weekly
                                         9	Creator Rating - Specification
                                         10	Creator Rating - Decision
                                         11	Creator Rating - Planning
                                         */
                                        var weeklySummaryCollection = {};
                                        weeklySummaryCollection.summary_id = 9;
                                        weeklySummaryCollection.asset_id = request.owner_asset_id;
                                        weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_creator_specification;
                                        activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {
                                            weeklySummaryCollection.summary_id = 10;
                                            weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_creator_decision;
                                            //activity_rating_lead_ownership
                                            activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {
                                                weeklySummaryCollection.summary_id = 11;
                                                weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_creator_planning;
                                                activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {

                                                });
                                            });
                                        });
                                        /* monthly
                                         16	Creator Rating - Specification
                                         17	Creator Rating - Decision
                                         18	Creator Rating - Planning
                                         */
                                        collection.datetime_start = util.getStartDateTimeOfMonth();
                                        collection.datetime_end = util.getEndDateTimeOfMonth(); // getting monthly data
                                        activityCommonService.getAssetAverageRating(request, collection).then((monthlyAssetAverageRating) => {
                                            var monthlySummaryCollection = {};
                                            monthlySummaryCollection.summary_id = 16;
                                            monthlySummaryCollection.asset_id = request.owner_asset_id;
                                            monthlySummaryCollection.entity_decimal_1 = monthlyAssetAverageRating[0].activity_rating_creator_specification;
                                            activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {
                                                monthlySummaryCollection.summary_id = 17;
                                                monthlySummaryCollection.entity_decimal_1 = monthlyAssetAverageRating[0].activity_rating_creator_decision;
                                                //activity_rating_lead_ownership
                                                activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {
                                                    monthlySummaryCollection.summary_id = 18;
                                                    monthlySummaryCollection.entity_decimal_1 = monthlyAssetAverageRating[0].activity_rating_creator_planning;
                                                    activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {

                                                    });
                                                });
                                            });

                                        });
                                    });
                                }
                                return;
                            } else {
                                callback(true, err, -9999);
                                return;
                            }
                        });
                    }
                } else {
                    callback(true, err, -9999);
                    return;
                }
            });
        }
    };

    this.updateLeadRating = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var flag = 1;
        if (Number(request.lead_ownership_rating) === -1 || Number(request.lead_completion_rating) === -1 || Number(request.lead_timeliness_rating) === -1) {
            flag = 2;
        }
        var paramsArr = new Array(
            request.activity_id,
            request.lead_asset_id,
            request.organization_id,
            flag, // flag that sets that rating is set to lead
            request.lead_ownership_rating,
            request.lead_completion_rating,
            request.lead_timeliness_rating,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        var queryString = util.getQueryString('ds_p1_activity_list_update_lead_rating', paramsArr);
        if (queryString !== '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_lead_rating', paramsArr);
                    if (queryString !== '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                callback(false, {}, 200);
                                var collection = {};
                                collection.flag_filter = 0;
                                collection.asset_id = request.lead_asset_id;
                                collection.operating_asset_id = request.lead_operating_asset_id;
                                collection.datetime_start = util.getStartDayOfWeek();
                                collection.datetime_end = util.getEndDayOfWeek(); // getting weekly data
                                if (flag === 1) {
                                    activityCommonService.getAssetAverageRating(request, collection).then((assetAverageRating) => {
                                        /*
                                         * weekly
                                         12	Lead Rating - Completeness
                                         13	Lead Rating - Ownership
                                         14	Lead Rating - Timeliness
                                         */
                                        var weeklySummaryCollection = {};
                                        weeklySummaryCollection.summary_id = 12;
                                        weeklySummaryCollection.asset_id = request.lead_asset_id;
                                        weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_completion;
                                        activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {
                                            weeklySummaryCollection.summary_id = 13;
                                            weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_ownership;
                                            activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {
                                                weeklySummaryCollection.summary_id = 14;
                                                weeklySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_timeliness;
                                                activityCommonService.weeklySummaryInsert(request, weeklySummaryCollection).then((data) => {

                                                });
                                            });
                                        });
                                        /* monthly
                                         19	Lead Rating - Completeness
                                         20	Lead Rating - Ownership
                                         21	Lead Rating - Timeliness
                                         */
                                        collection.datetime_start = util.getStartDateTimeOfMonth();
                                        collection.datetime_end = util.getEndDateTimeOfMonth(); // getting monthly data
                                        activityCommonService.getAssetAverageRating(request, collection).then((assetAverageRating) => {
                                            console.log(assetAverageRating);
                                            global.logger.write('debug', 'assetAverageRating' + assetAverageRating, {}, request);

                                            var monthlySummaryCollection = {};
                                            monthlySummaryCollection.summary_id = 19;
                                            monthlySummaryCollection.asset_id = request.lead_asset_id;
                                            monthlySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_completion;
                                            activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {
                                                monthlySummaryCollection.summary_id = 20;
                                                monthlySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_ownership;
                                                //activity_rating_lead_ownership
                                                activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {
                                                    monthlySummaryCollection.summary_id = 21;
                                                    monthlySummaryCollection.entity_decimal_1 = assetAverageRating[0].activity_rating_lead_timeliness;
                                                    activityCommonService.monthlySummaryInsert(request, monthlySummaryCollection).then((data) => {

                                                    });
                                                });
                                            });

                                        });
                                    });
                                }
                                return;
                            } else {
                                callback(true, err, -9999);
                                return;
                            }
                        });
                    }
                } else {
                    callback(true, err, -9999);
                    return;
                }
            });
        }
    };



    function getTaskAcceptanceStats(request, flag) {
        return new Promise((resolve, reject) => {
            var response = {};
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_id,
                request.operating_asset_id || 0,
                flag,
                util.getStartDayOfWeek(),
                util.getEndDayOfWeek()
            );
            var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_task_acceptance_stats', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, weeklyAcceptanceStats) { // weekly stats
                    if (err === false) {
                        response.weekly_acceptance_stats = weeklyAcceptanceStats;
                        paramsArr = new Array(
                            request.organization_id,
                            request.account_id,
                            request.workforce_id,
                            request.asset_id,
                            request.operating_asset_id || 0,
                            flag,
                            util.getStartDateTimeOfMonth(),
                            util.getEndDateTimeOfMonth()
                        );
                        var queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_task_acceptance_stats', paramsArr);
                        db.executeQuery(1, queryString, request, function (err, monthlyAcceptanceStats) { //monthly stats
                            if (err === false) {
                                response.monthly_acceptance_stats = monthlyAcceptanceStats;
                                resolve(response);
                            } else {
                                reject(err);
                            }
                        });
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }

    var acceptanceStatsSummaryInsert = function (request, acceptanceStats, summaryIds, callback) {
        var collection = {};
        var totalCount = Number(acceptanceStats.weekly_acceptance_stats[0].total_count);
        var count = Number(acceptanceStats.weekly_acceptance_stats[0].count);
        var percentage = (totalCount > 0) ? (count / totalCount) * 100 : 0;

        // console.log('weekly Count : ', count);
        // console.log('weekly Total Count : ', totalCount);
        // console.log('weekly Percentage : ', percentage);

        global.logger.write('debug', 'weekly Count: ' + count, {}, request);
        global.logger.write('debug', 'weekly Total Count: ' + totalCount, {}, request);
        global.logger.write('debug', 'weekly Percentage: ' + percentage, {}, request);

        collection.summary_id = summaryIds.weekly;
        collection.asset_id = request.asset_id;
        collection.entity_bigint_1 = totalCount;
        collection.entity_decimal_2 = count;
        collection.entity_decimal_1 = percentage;
        collection.entity_double_1 = percentage;
        activityCommonService.weeklySummaryInsert(request, collection).then((data) => {

            //monthly_acceptance_stats
            totalCount = Number(acceptanceStats.monthly_acceptance_stats[0].total_count);
            count = Number(acceptanceStats.monthly_acceptance_stats[0].count);
            percentage = (totalCount > 0) ? (count / totalCount) * 100 : 0;

            // console.log('monthly Count : ', count);
            // console.log('monthly Total Count : ', totalCount);
            // console.log('monthly Percentage : ', percentage);

            global.logger.write('debug', 'monthly Count: ' + count, {}, request);
            global.logger.write('debug', 'monthly Total Count: ' + totalCount, {}, request);
            global.logger.write('debug', 'monthly Percentage: ' + percentage, {}, request);

            collection.summary_id = summaryIds.monthly;
            collection.entity_bigint_1 = totalCount;
            collection.entity_decimal_2 = count;
            collection.entity_decimal_1 = percentage;
            collection.entity_double_1 = percentage;
            activityCommonService.monthlySummaryInsert(request, collection).then((data) => {
                callback(false, true);
            });
        });
    };

    function updateTaskCreatedCnt(request) {
        return new Promise((resolve, reject) => {
            updateTaskCreatedCntFn(request, request.asset_id).then(() => {});
            activityCommonService.getAssetDetails(request, function (err, data) {
                if (err === false) {
                    updateTaskCreatedCntFn(request, data.operating_asset_id).then(() => {});
                    resolve();
                }
            });
        });
    }

    function updateTaskCreatedCntFn(request, assetId) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                assetId
            );

            var queryString = util.getQueryString('ds_v1_asset_list_update_task_created_count', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    //global.logger.write(queryString, request, 'asset', 'trace');
                    (err === false) ? resolve(): reject(err);
                });
            }
        });
    }

    function addIngredients(request) {

        //new Promise(resolve,reject){
        //activityCommonService.getActivityDetails(request, 0, function (err, activityData) {
        // console.log('data ' + request.activity_inline_data);
        global.logger.write('conLog', 'data ' + request.activity_inline_data, {}, request);

        var option_id = JSON.parse(request.activity_inline_data).option_id;

        activityCommonService.getAllParticipantsforField(request, request.activity_channel_id, option_id).then((participantData) => {

            forEachAsync(participantData, function (next, x) {
                x.access_role_id = 123;
                x.field_id = option_id;
                x.option_id = request.item_order_count; //  	    	
                activityCommonService.orderIngredientsAssign(request, x).then(() => {
                    next();
                });

            }).then(() => {
                // console.log("IN THEN");
                global.logger.write('conLog', 'IN THEN', {}, request);

                if (JSON.parse(request.activity_inline_data).hasOwnProperty('item_choice_price_tax')) {
                    var arr = JSON.parse(request.activity_inline_data).item_choice_price_tax;

                    // console.log('arr' + arr[0].activity_id);
                    global.logger.write('conLog', 'arr: ' + arr[0].activity_id, {}, request);

                    var choice_option = 2;
                    forEachAsync(arr, function (next, x1) {

                        // console.log('arr[key1].activity_id ' + x1.activity_id);
                        global.logger.write('conLog', 'arr[key1].activity_id: ' + x1.activity_id, {}, request);

                        choice_option++;
                        //var quantity = x1.quantity;
                        activityCommonService.getAllParticipantsforField(request, x1.activity_id, 1).then((rows) => {

                            forEachAsync(rows, function (next, x2) {
                                x2.access_role_id = 123;
                                x2.field_id = choice_option;
                                x2.option_id = x1.quantity; //

                                // console.log('parent_activity_title ' + x2.parent_activity_title);
                                // console.log('choice quantity: ' + x2.option_id);

                                global.logger.write('conLog', 'parent_activity_title: ' + x2.parent_activity_title, {}, request);
                                global.logger.write('conLog', 'choice quantity: ' + x2.option_id, {}, request);

                                activityCommonService.orderIngredientsAssign(request, x2).then(() => {
                                    next();
                                });

                            }).then(() => {
                                next();
                            });

                        });

                    });
                }

            });

        });



        // });
        //}
    }



    var activityAssetMappingInsertParticipantAssign = function (request, participantData, callback) {

        //console.log('In function activityAssetMappingInsertParticipantAssign - participantData : ', participantData);

        var fieldId = 0;
        var paramsArr = new Array(
            request.activity_id,
            participantData.asset_id,
            participantData.workforce_id,
            participantData.account_id,
            participantData.organization_id,
            participantData.access_role_id,
            participantData.message_unique_id,
            request.flag_retry,
            request.flag_offline,
            request.asset_id,
            request.datetime_log,
            participantData.field_id,
            participantData.activity_sub_type_id,
            participantData.activity_sub_type_name,
            participantData.option_id,
            participantData.parent_activity_title
        );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_insert_asset_assign_pam", paramsArr);

        if (queryString !== '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    //  console.log(data);
                } else {
                    // console.log(err);
                    global.logger.write('serverError', err, err, request);

                }
            });
        }

    };


    function sendRequesttoWidgetEngine(request) {

        global.logger.write('conLog', '********IN HITTING WIDGET *********************************************: ', {}, request);
        if (request.activity_type_category_id == 48) { //form and submitted state  

            activityCommonService.getActivityCollection(request).then((activityData) => { // get activity form_id and form_transaction id
                console.log('activityData:' + activityData[0]);
                console.log('activityData[0].form_transaction_id :: '+activityData[0].form_transaction_id);
                //activityCommonService.getWorkflowOfForm(request, activityData[0].form_id)
                //.then((formData)=>{            
                var widgetEngineQueueMessage = {
                    form_id: activityData[0].form_id,
                    form_transaction_id: activityData[0].form_transaction_id,
                    organization_id: request.organization_id,
                    account_id: request.account_id,
                    workforce_id: request.workforce_id,
                    asset_id: request.asset_id,
                    activity_id: request.activity_id,
                    activity_type_id: activityData[0].activity_type_id,
                    req_activity_status_id: request.activity_status_id,
                    activity_type_category_id: request.activity_type_category_id,
                    activity_stream_type_id: request.activity_stream_type_id,
                    track_gps_location: request.track_gps_location,
                    track_gps_datetime: util.replaceDefaultDatetime(activityData[0].activity_datetime_created),
                    track_gps_accuracy: request.track_gps_accuracy,
                    track_gps_status: request.track_gps_status,
                    device_os_id: request.device_os_id,
                    service_version: request.service_version,
                    app_version: request.app_version,
                    api_version: request.api_version,
                    widget_type_category_id: 2,
                    source_id: request.source_id
                };
                var event = {
                    name: "File Based Widget Engine",
                    payload: widgetEngineQueueMessage
                };
                global.logger.write('conLog', 'Hitting Widget Engine with request:' + event, {}, request);

                queueWrapper.raiseFormWidgetEvent(event, request.activity_id);
            //});
            });
        }
    }

    this.updateActivityFormFieldValidation = function (request) {
        return new Promise((resolve, reject) => {
            console.log("IN PROMISE");
            activityCommonService.getActivityByFormTransaction(request).then((activityData) => {
                if (activityData.length > 0) {

                    request['activity_id'] = activityData[0].activity_id;
                    //console.log("IN ACTIVITY COLLECTION: "+request.activity_id);
                    //resolve();
                    processFormInlineData(request, activityData).then((finalData) => {
                        console.log("IN PROCESS INLINE DATA " + finalData);
                        this.activityListUpdateFieldValidated(request, JSON.stringify(finalData)).then(() => {
                            console.log("IN ACTIVITY LIST UPDATE ");
                            this.activityMappingListUpdateFieldValidated(request).then(() => {
                                console.log("IN ACTIVITY ASSET MAPPING UPDATE ");
                                request['datetime_log'] = util.getCurrentUTCTime();
                                activityCommonService.activityListHistoryInsert(request, 417, function (err, result) {});
                                activityCommonService.assetTimelineTransactionInsert(request, {}, 712, function (err, data) {});
                                activityCommonService.activityTimelineTransactionInsert(request, {}, 712, function (err, data) {});
                                activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {});
                                activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});

                            });
                            resolve();
                        });
                    });

                } else {
                    resolve();
                }

            });


        });
    };

    function processFormInlineData(request, data) {
        return new Promise((resolve, reject) => {
            var array = [];
            forEachAsync(JSON.parse(data[0].activity_inline_data), function (next, fieldData) {
                //console.log('fieldData : '+JSON.stringify(fieldData));
                if (parseInt(Number(fieldData.field_id)) === parseInt(Number(request.field_id))) {
                    console.log("HAS FIELD VALIDATED : " + fieldData.field_id + ' ' + request.field_id);
                    fieldData.field_validated = 1;
                    array.push(fieldData);
                    next();
                } else {
                    console.log("FIELD NOT VALIDATED : " + fieldData.field_id + ' ' + request.field_id);
                    array.push(fieldData);
                    next();

                }

            }).then(() => {
                //console.log("DATA : "+JSON.stringify(data));
                //data.activity_inline_data = array;
                resolve(array);
            });
        });
    }

    this.activityListUpdateFieldValidated = function (request, inlineData) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                request.activity_type_category_id,
                request.is_field_validated,
                inlineData,
                request.asset_id,
                util.getCurrentUTCTime()
            );
            var queryString = util.getQueryString("ds_v1_activity_list_update_form_field_validated", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.activityMappingListUpdateFieldValidated = function (request) {
        return new Promise((resolve, reject) => {
            activityCommonService.getAllParticipants(request, function (err, participantsData) {
                if (err === false) {
                    forEachAsync(participantsData, function (next, rowData) {
                        var paramsArr = new Array(
                            request.organization_id,
                            request.account_id,
                            request.workforce_id,
                            request.activity_id,
                            rowData['asset_id'],
                            request.activity_type_category_id,
                            request.is_field_validated,
                            request.asset_id,
                            util.getCurrentUTCTime()
                        );
                        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_update_form_field_validated", paramsArr);
                        if (queryString != '') {
                            db.executeQuery(0, queryString, request, function (err, data) {
                                if (err === false) {
                                    next();
                                } else {
                                    reject(err);
                                }
                            });
                        }
                    }).then(() => {
                        resolve();
                    });
                }
            });

        });
    };

    this.updateWorkflowQueueMapping = async function name(request) {
        request.flag = 0;
        let workflowActivityPercentage = 0, workflowActivityCreationTime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        try {
            await activityCommonService
                .getActivityDetailsPromise(request, request.activity_id)
                .then((workflowActivityData) => {
                    if (workflowActivityData.length > 0) {
                        workflowActivityPercentage = Number(workflowActivityData[0].activity_workflow_completion_percentage);
                        workflowActivityCreationTime = moment(workflowActivityData[0].activity_datetime_created).format('YYYY-MM-DD HH:mm:ss');
                    }
                })
                .catch((error) => {
                    console.log("updateWorkflowQueueMapping | getActivityDetailsPromise | error: ", error);
                });
        } catch (error) {
            console.log("updateWorkflowQueueMapping | Activity Details Fetch Error | error: ", error);
        }
        try {
            request.page_limit = 100;
            const queueMap = await activityListingService.getEntityQueueMapping(request);
            if (queueMap.length > 0) {
                // Iterate through each queue mapped to the activity type
                for (const queue of queueMap) {
                    let queueId = Number(queue.queue_id);
                    let queueInlineData = JSON.parse(queue.queue_inline_data);
                    let isStatusMapped = false;
                    console.log("queueId: ", queueId);
                    console.log("queueInlineData: ", queueInlineData);
                    // Loop through each object of the queue's inline data and check
                    // whether the incoming activity status ID exists
                    for (const activityStatus of queueInlineData) {
                        if (Number(activityStatus.activity_status_id) === Number(request.activity_status_id)) {
                            isStatusMapped = true;
                        }
                    }
                    console.log("isStatusMapped: ", isStatusMapped);
                    if (isStatusMapped) {
                        // console.log("isStatusMapped: ", isStatusMapped)
                        await activityCommonService
                            .fetchQueueActivityMappingIdV1(request, queueId)
                            .then(async (queueActivityMappingData) => {
                                console.log('queueActivityMappingData : ', queueActivityMappingData);

                                // If the mapping exists, set log state to 3, thereby archiving the mapping
                                if (queueActivityMappingData.length > 0) {
                                    let newRequest = Object.assign(request);
                                    // Set log state to 2, to re-enable an existing (archived) mapping.
                                    newRequest.set_log_state = 2;
                                    let queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;
                                    await activityCommonService
                                        .unmapFileFromQueue(request, queueActivityMappingId)
                                        .then((queueActivityMappingData) => {
                                            console.log("updateWorkflowQueueMapping | unmapFileToQueue | queueActivityMapping: ", queueActivityMappingData);
                                        })
                                        .catch((error) => {
                                            console.log("updateWorkflowQueueMapping | Re-Enable | Error: ", error);
                                        });
                                } else {
                                    // Insert activity to the queue in the queue_activity_mapping table
                                    await activityCommonService
                                        .mapFileToQueue(request, queueId, JSON.stringify({
                                            "queue_sort": {
                                                "current_status_id": 0,
                                                "file_creation_time": workflowActivityCreationTime,
                                                "queue_mapping_time": moment().utc().format('YYYY-MM-DD HH:mm:ss'),
                                                "current_status_name": "",
                                                "last_status_alter_time": "",
                                                "caf_completion_percentage": workflowActivityPercentage || 0
                                            }
                                        }))
                                        .then((queueActivityMappingData) => {
                                            console.log("updateWorkflowQueueMapping | mapFileToQueue | queueActivityMapping: ", queueActivityMappingData);
                                            activityCommonService.queueHistoryInsert(request, 1401, queueActivityMappingData[0].queue_activity_mapping_id).then(() => {});
                                        })
                                        .catch((error) => {

                                            console.log("updateWorkflowQueueMapping | mapFileToQueue | Error: ", error);
                                            console.log("Object.keys(error): ", Object.keys(error));
                                        });
                                }
                            });

                    } else {
                        // Check if there is an existing mapping
                        await activityCommonService
                            .fetchQueueActivityMappingIdV1(request, queueId)
                            .then(async (queueActivityMappingData) => {
                                console.log('queueActivityMappingData : ', queueActivityMappingData);

                                // If the mapping exists, set log state to 3, thereby archiving the mapping
                                if (
                                    queueActivityMappingData.length > 0 &&
                                    (
                                        queueActivityMappingData[0].log_state === 1 ||
                                        queueActivityMappingData[0].log_state === 2
                                    )
                                ) {
                                    let queueActivityMappingId = queueActivityMappingData[0].queue_activity_mapping_id;
                                    let newRequest = Object.assign({}, request);
                                    newRequest.set_log_state = 3;
                                    await activityCommonService
                                        .unmapFileFromQueue(newRequest, queueActivityMappingId)
                                        .then((queueActivityMappingData) => {
                                            console.log("updateWorkflowQueueMapping | unmapFileToQueue | queueActivityMapping: ", queueActivityMappingData)
                                        })
                                        .catch((error) => {
                                            console.log("updateWorkflowQueueMapping | unmapFileToQueue | Error: ", error);
                                        });
                                }
                            });
                    }
                }

                await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    }, 3000);
                });

                return queueMap;

            } else {
                return [];
            }
        } catch (error) {
            console.log("updateWorkflowQueueMapping | queueMap | Error: ", error);
            return [];
        }
    };

    this.getWorkflowPercentage = async function (request) {
        let queuesData = await getAllQueuesBasedOnActId(request, request.activity_id);
        let responseObject = [];

        if (queuesData.length > 0) {
            let queueActivityMappingInlineData = JSON.parse(queuesData[0].queue_activity_mapping_inline_data);
            let workflowCompletionPercentage = queueActivityMappingInlineData.queue_sort.caf_completion_percentage;
            // console.log("queueActivityMappingInlineData.queue_sort: ", queueActivityMappingInlineData.queue_sort);
            // console.log("workflowCompletionPercentage: ", workflowCompletionPercentage);

            queuesData[0].workflow_completion_percentage = workflowCompletionPercentage;
            // console.log("queuesData: ", queuesData)

            for (const queueData of queuesData) {
                responseObject.push({
                    queue_activity_mapping_id: queueData.queue_activity_mapping_id,
                    queue_activity_mapping_inline_data: queueData.queue_activity_mapping_inline_data,
                    queue_id: queueData.queue_id,
                    queue_name: queueData.queue_name,
                    workflow_completion_percentage: workflowCompletionPercentage,
                });
            }

        } else {
            responseObject = [{
                workflow_completion_percentage: 0
            }];
        }

        return responseObject;
    }
    async function getAllQueuesBasedOnActId(request, activityId) {
        let paramsArr = new Array(
            request.organization_id,
            activityId
        );
        let queryString = util.getQueryString('ds_p1_1_queue_activity_mapping_select_activity', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
        }
    }

    function updateWidgetAggrStatus(request) {
        return new Promise((resolve, reject) => {
            global.logger.write('DEBUG', '::: UPDATING WIDGET AGGR STATUS :::', {}, request);
            let paramsArr = new Array(
                request.activity_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                util.getCurrentUTCTime()
            );
            
            let temp = {};
            let newReq = Object.assign({}, request);
            newReq.workflow_activity_id = request.activity_id;
            
            let queryString = util.getQueryString('ds_p1_widget_activity_field_transaction_update', paramsArr);
            if (queryString != '') {
               db.executeQuery(0, queryString, request, function (err, data) {                    
                    console.log('AS ERRRRRRRRRRRRRRROR : ', err);
                    console.log('AS DAAAAAAAAAAAAAAATA : ', data);
                    if (err === false) {
                        if(data.length>0) {
                            newReq.widget_id = data[0].widget_id;
                        }            
                        temp.data = data;
                        newReq.inline_data = temp;
                        if (Number(newReq.widget_id) > 0) {
                            activityCommonService.widgetLogTrx(newReq, 1);
                        }
                        resolve();
                    } else {                        
                        temp.err = err;
                        newReq.inline_data = temp;
                        if (Number(newReq.widget_id) > 0) {
                            activityCommonService.widgetLogTrx(newReq, 2);
                        }
                        reject(err);
                    }
                });
            }
        });
    }

    function updateChannelActivity(request, idActivityTypeCategory, idChannelActivity, idChannelActivityCategory) {
        return new Promise((resolve, reject) => {
            global.logger.write('DEBUG', '::: UPDATING WORKFLOW OF FORM  :::', {}, request);
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.form_transaction_id,
                idActivityTypeCategory,
                idChannelActivity,
                idChannelActivityCategory,
                request.asset_id,
                util.getCurrentUTCTime()
            );
            let queryString = util.getQueryString('ds_v1_activity_list_update_channel_form_txn', paramsArr);
            if (queryString != '') {
               db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        })
    }

    function widgetActivityFieldTransactionInsert(request) {
        return new Promise((resolve, reject) => {
            global.logger.write('DEBUG', '::: widgetActivityFieldTransactionInsert  :::', {}, request);
            let paramsArr = new Array(
                request.widget_id||0,
                request.activity_id,
                request.dedicated_activity_id||0,
                request.activity_form_id,
                request.form_transaction_id,
                request.field_id,
                request.field_value,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                util.getCurrentUTCTime(),
                request.otc_1 || 0,
                request.arc_1 || 0,
                request.otc_2 || 0,
                request.arc_2 || 0
            );
            let queryString = util.getQueryString('ds_p1_3_widget_activity_field_transaction_insert', paramsArr);
            if (queryString != '') {
               db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }

    //To update the Closed datetime of an activity
    async function updateActivityClosedDatetime(request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_id,
            request.activity_status_id || 0,
            request.activity_status_type_id || 0,
            request.asset_id,
            request.datetime_log //log_datetime
        );

        var queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_closed_datetime', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        var queryString1 = util.getQueryString('ds_p1_activity_list_update_closed_datetime', paramsArr);
        if (queryString1 !== '') {
            await db.executeQueryPromise(0, queryString1, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        let paramsArr2 = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_id,
            //request.activity_status_id || 0,
            //request.activity_status_type_id || 0,
            request.asset_id,
            request.datetime_log //log_datetime
        );

        var queryString2 = util.getQueryString('ds_p1_activity_status_change_transaction_update_closed', paramsArr2);
        if (queryString2 !== '') {
            await db.executeQueryPromise(0, queryString2, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    }

    // Update Workflow values in Activity_List for Workflow Form (For origin form putting delay is not good idea)
    async function addValueToWidgetForAnalyticsWF(requestObj, workflowActivityId, workflowActivityTypeID, flag) {
        let request = Object.assign({}, requestObj);

        let [err, inlineData] = await activityCommonService.getWorkflowFieldsBasedonActTypeId(request, workflowActivityTypeID);
        if (err || inlineData.length === 0) {
            return err;
        }

        //console.log('inlineData : ', inlineData[0]);        
        console.log('inlineData[0].activity_type_inline_data : ', inlineData[0].activity_type_inline_data);

        if(inlineData[0].activity_type_inline_data === null) {
            return "";
        }

        let finalInlineData = JSON.parse(inlineData[0].activity_type_inline_data);

        console.log('finalInlineData.hasOwnProperty(workflow_fields) : ', finalInlineData.hasOwnProperty('workflow_fields'));

        if (finalInlineData.hasOwnProperty('workflow_fields')) {
            let i, fieldId;
            let workflowFields = finalInlineData.workflow_fields;
            let activityInlineData = JSON.parse(request.activity_inline_data);

            console.log('workflowFields : ', workflowFields);
            console.log('activityInlineData : ', activityInlineData);
            console.log('activityInlineData.length : ', activityInlineData.length);

            let finalValue = 0;
            let flagExecuteFinalValue = 0;
            for (i = 0; i < activityInlineData.length; i++) {
                for (fieldId in workflowFields) {
                    if (fieldId === activityInlineData[i].field_id) {
                        const fieldValue = await getFieldValueByDataTypeID(
                            Number(activityInlineData[i].field_data_type_id),
                            activityInlineData[i].field_value
                        );
                        await activityCommonService.analyticsUpdateWidgetValue(request,
                            workflowActivityId,
                            workflowFields[fieldId].sequence_id,
                            fieldValue);


                        flagExecuteFinalValue = 1;
                        finalValue += Number(fieldValue);
                        break;
                    }
                }
            }

            if (flag === 1 && flagExecuteFinalValue === 1) {
                await activityCommonService.analyticsUpdateWidgetValue(request,
                    workflowActivityId,
                    0,
                    finalValue);
            }

        }

        return "success";
    }

    function getFieldValueByDataTypeID(fieldDataTypeID, fieldValue) {
        switch (fieldDataTypeID) {
            case 62: // Credit/Debit Data Type
                fieldValue = (typeof fieldValue === 'string') ? JSON.parse(fieldValue) : fieldValue;
                const transactionTypeID = Number(fieldValue.transaction_data.transaction_type_id),
                    // ledgerActivityID = Number(fieldValue.transaction_data.activity_id),
                    transactionAmount = Number(fieldValue.transaction_data.transaction_amount);
                if (transactionTypeID === 1) {
                    return Number(transactionAmount);
                } else if (transactionTypeID === 2) {
                    return -Number(transactionAmount);
                }
            default:
                return Number(fieldValue);
        }
    }
    
    //Update Workflow values in Activity_List for all non-origin Forms
    async function addValueToWidgetForAnalytics(requestObj) {
        let request = Object.assign({}, requestObj);

        request.form_id = Number(requestObj.activity_form_id);

        // Fetch form's config data
        const [formConfigError, formConfigData] = await activityCommonService.workforceFormMappingSelect(request);
        if (formConfigError !== false) {
            return [formConfigError, formConfigData];
        }

        if (Number(formConfigData.length) > 0) {
            let originFlagSet = Number(formConfigData[0].form_flag_workflow_origin),
                isWorkflowEnabled = Number(formConfigData[0].form_flag_workflow_enabled);

            if(isWorkflowEnabled && originFlagSet) {
                console.log('ITS AN ORIGIN FORM!!');
                return "success";
            }
        }

        let [err, workflowData] = await activityCommonService.fetchReferredFormActivityIdAsync(request, request.activity_id, request.form_transaction_id, request.form_id);        
        console.log('workflowData : ', workflowData);

        if(err || workflowData.length === 0) {
            return err;
        }
        try {
            const workflowActivityId = Number(workflowData[0].activity_id);
            const workflowActivityTypeID = Number(workflowData[0].activity_type_id);
            
            console.log("workflowActivityId: ", workflowActivityId);
            console.log("workflowActivityTypeID: ", workflowActivityTypeID);
            
            let [err1, inlineData] = await activityCommonService.getWorkflowFieldsBasedonActTypeId(request, workflowActivityTypeID);
            if(err1 || inlineData.length === 0) {
                return err;
            }        
            //console.log('inlineData : ', inlineData[0]);        
            console.log('inlineData.activity_type_inline_data : ', inlineData[0].activity_type_inline_data);
            
            let finalInlineData = JSON.parse(inlineData[0].activity_type_inline_data);
    
            console.log('finalInlineData.hasOwnProperty(workflow_fields) : ', finalInlineData.hasOwnProperty('workflow_fields'));
    
            if(finalInlineData.hasOwnProperty('workflow_fields')) {
                let i, fieldId;
                let workflowFields = finalInlineData.workflow_fields;
                let activityInlineData = JSON.parse(request.activity_inline_data);
    
                console.log('workflowFields : ', workflowFields);
                console.log('activityInlineData : ', activityInlineData);
                console.log('activityInlineData.length : ', activityInlineData.length);
    
                for(i=0; i<activityInlineData.length; i++) {
                    for(fieldId in workflowFields){
                        if(fieldId === activityInlineData[i].field_id) {
                            await activityCommonService.analyticsUpdateWidgetValue(request, 
                                                                                   workflowActivityId, 
                                                                                   workflowFields[fieldId].sequence_id, 
                                                                                   activityInlineData[i].field_value);
                            break;
                        }
                    }   
                }
            }
    
            return "success";
        }
        catch(error) {
            return error;
        }
    }

    function sleep(ms){
        return new Promise(resolve=>{
            setTimeout(resolve,ms);
        });
    }

    //Insert in the Intermediate tables - For workflow Reference, Combo Field data types
    async function fireBotInsertIntTables(request, fieldData) {
        let workflowActivityId = request.activity_id; //workflow activity id
        if(Number(request.activity_type_category_id) === 9) {
            //await sleep(2000); 
            const [workflowError, workflowData] = await activityCommonService.fetchReferredFormActivityIdAsync(request, request.activity_id, request.form_transaction_id, request.form_id);
            if (workflowError !== false || workflowData.length === 0) {
                console.log('workflowError : ', workflowError);
                console.log('workflowData : ', workflowData);
                return [workflowError, workflowData];
            }
            workflowActivityId = Number(workflowData[0].activity_id);
        }
        

        let botIsDefined = 0;
        let botEngineRequest = Object.assign({}, request);
            botEngineRequest.form_id = Number(fieldData.form_id);
            botEngineRequest.field_id = Number(fieldData.field_id);
            botEngineRequest.flag = 5;

        try{            
            let botsListData = await activityCommonService.getBotsMappedToActType(botEngineRequest);
            if (botsListData.length > 0) {                
                botEngineRequest.bot_id = botsListData[0].bot_id;
                let botOperationsData = await activityCommonService.getBotworkflowSteps(botEngineRequest);
                botEngineRequest.bot_operation_id = botOperationsData[0].bot_operation_id;
                botIsDefined = 1;
            } else {
                console.log('Bot is not defined');
            }
        } catch (botInitError) {
            global.logger.write('error', botInitError, botInitError, request);
        }

      let newRequest = Object.assign({}, request);          
          //newRequest.activity_id = request.activity_id; //workflow activity id
          newRequest.activity_id = workflowActivityId;
          newRequest.mapping_activity_id = 0;
          newRequest.bot_operation_id = botEngineRequest.bot_operation_id;
          newRequest.form_transaction_id = request.form_transaction_id;
          newRequest.form_id = fieldData.form_id;
          newRequest.field_id = fieldData.field_id;
          newRequest.data_type_combo_id = fieldData.data_type_combo_id;
          //newRequest.asset_id = request.asset_id;
          //newRequest.workforce_id = ;
          //newRequest.account_id = "";
          //newRequest.organization_id = "";
          newRequest.participant_access_id = 0;
          newRequest.log_asset_id = request.asset_id;
          newRequest.log_datetime = util.getCurrentUTCTime();
          newRequest.flag_due_date_impact = 0;

      if(botIsDefined === 1) {
        switch(Number(fieldData.field_data_type_id)) {
            //Workflow Reference
            case 57: let fieldValue = fieldData.field_value.split('|');
                     newRequest.entity_type_id = 1;
                     newRequest.entity_level_id = 9;
                     newRequest.mapping_activity_id = fieldValue[0];
                     await activityCommonService.activityEntityMappingInsert(newRequest, 1); //1 - activity_entity_mapping
                     break;

            //Combo field
            case 33: newRequest.entity_type_id = 2;
                     newRequest.entity_level_id = 18;
                     await activityCommonService.activityEntityMappingInsert(newRequest, 2); //2 - activity_form_field_mapping
                     break;
        }        
      } 
        
      return "success";      
    }

    async function handleRollBackFormSubmission(request) {
        console.log('Inside handleRollBackFormSubmission');
        //if(request.workflow_activity_id)
        //let workflowActivityId = 0;
        //await sleep(2000); 
        //const [workflowError, workflowData] = await activityCommonService.fetchReferredFormActivityIdAsync(request, request.activity_id, request.form_transaction_id, request.form_id);
        //console.log('HERE IAM');
        //if (workflowError !== false || workflowData.length === 0) {
        //    console.log('workflowError : ', workflowError);
        //    console.log('workflowData : ', workflowData);
        //    //return [workflowError, workflowData];
        //} else {
            //workflowActivityId = Number(workflowData[0].activity_id);
            workflowActivityId = Number(request.workflow_activity_id);
            //Perform status alter
            let newReq = Object.assign({}, request);
            newReq.activity_id = workflowActivityId;
            let formInlineData = JSON.parse(request.activity_inline_data);
            console.log('formInlineData: ', formInlineData);
            let fieldData;
            let fieldValue;
            for(let i=0; i<formInlineData.length;i++){                                    
                fieldData = formInlineData[i];
                if(Number(fieldData.field_data_type_id) === 63) {   
                    console.log('typeof fieldData : ', typeof fieldData);
                    (typeof fieldData.field_value === 'string') ?
                        fieldValue = JSON.parse(fieldData.field_value):
                        fieldValue = fieldData.field_value;
                    console.log('fieldValue : ', fieldValue);
                    newReq.activity_status_id = fieldValue.activity_status_id;
                    newReq.activity_status_type_id = fieldValue.activity_status_type_id;
                    newReq.activity_status_name = fieldValue.activity_status_name;
                    newReq.activity_status_type_name = fieldValue.activity_status_type_name;
                    //console.log('fieldValue.activity_status_id: ', fieldValue.activity_status_id);
                    //console.log('fieldValue.activity_status_type_id ', fieldValue.activity_status_type_id);  
                    
                    //self.alterActivityStatus(newReq, (err, data)=>{});

                    await activityCommonService.makeRequest(newReq, "bot_step/status/alter", 1)
                    .then((resp) => {
                        global.logger.write('debug', "bot_step/status/alter Response: " + JSON.stringify(resp), {}, request);
                    });              
                    break;
                }
            }

        await sleep(3000);

        //Need to get the asset(Role) -- Mapped to that status
        let [err, roleData] = await activityListingService.getAssetTypeIDForAStatusID(request, newReq.activity_status_id);
        console.log('ROLEDATA : ', roleData[0]);
        newReq.asset_type_id = (!err && roleData.length > 0) ? Number(roleData[0].asset_type_id) : 0;
        newReq.activity_status_workflow_percentage = (!err && roleData.length > 0) ? Number(roleData[0].activity_status_workflow_percentage) : 0;
        
        console.log('newReq.activity_status_workflow_percentage) : ', newReq.activity_status_workflow_percentage);

        //await self.updateWorkflowQueueMapping(newReq);

        //Update the percentage as well
        if(newReq.activity_status_workflow_percentage > 0) {            
            await activityCommonService.makeRequest(newReq, "bot_step/wf_percentage/alter", 1)
            .then((resp) => {
                global.logger.write('debug', "bot_step/wf_percentage/alter Response: " + JSON.stringify(resp), {}, request);
            });
        }
            
        let [err1, assetData] = await activityListingService.getAssetForAssetTypeID(newReq);
        let assetID = (!err1 && assetData.length > 0) ? Number(assetData[0].asset_id) : 0;

        console.log('ASSET TYPE ID(ROLE) for the Status:', newReq.activity_status_name, ' is : ', newReq.asset_type_id);
        console.log('ASSET ID for the ROLE:', newReq.asset_type_id, ' is : ', assetID);

        //Increment the Roll Back count
        newReq.asset_id = assetID;
        await activityListingService.setAssetRollBackCnt(newReq);

        await sleep(1000);
        //Get Weekly roll back count
        newReq.start_datetime = util.getStartDateTimeOfWeek();
        newReq.end_datetime = util.getEndDateTimeOfWeek();
        newReq.flag = 0;
        newReq.activity_type_category_id = 48;
        let [err2, weeklyCount] = await activityListingService.getAssetRollBackCnt(newReq);
        let weeklyRollBackCnt = 0;
        let weeklyTotalCnt = 0;
        let weeklyPercentage = 0;
        if(!err2 && weeklyCount.length > 0) {
            weeklyRollBackCnt = weeklyCount[0].rollback_count;
            weeklyTotalCnt = weeklyCount[0].total_count;
            weeklyPercentage = (weeklyRollBackCnt/ weeklyTotalCnt) * 100;
        }        
        let weeklyObj = {
                summary_id: 27,
                asset_id: assetID,
                entity_decimal_2: weeklyRollBackCnt,//numerator
                entity_bigint_1: weeklyTotalCnt, //denominator
                entity_double_1: weeklyPercentage, //Percentage
                entity_decimal_1: weeklyPercentage //Percentage
            };
       if(assetID > 0) {
        await activityCommonService.weeklySummaryInsert(newReq, weeklyObj);
       }

        //Get Monthly roll back count
        newReq.start_datetime =  util.getStartDateTimeOfMonth();
        newReq.end_datetime = util.getEndDateTimeOfMonth();
        newReq.flag = 0;
        newReq.activity_type_category_id = 48;
        let [err3, monthlyCount] = await activityListingService.getAssetRollBackCnt(newReq);
        let monthlyRollBackCnt = 0;
        let monthlyTotalCnt = 0;
        let monthlyPercentage = 0;
        if(!err3 && monthlyCount.length > 0) {
            monthlyRollBackCnt = monthlyCount[0].rollback_count;
            monthlyTotalCnt = monthlyCount[0].total_count;
            monthlyPercentage = (monthlyRollBackCnt/ monthlyTotalCnt) * 100;
        }
        let monthlyObj = {
                summary_id: 40,
                asset_id: assetID,
                entity_decimal_2: monthlyRollBackCnt,//numerator
                entity_bigint_1: monthlyTotalCnt, //denominator
                entity_double_1: monthlyPercentage, //Percentage
                entity_decimal_1: monthlyPercentage //Percentage
            };
        if(assetID > 0) {
            await activityCommonService.monthlySummaryInsert(newReq, monthlyObj);
        }

        return "success";
    }


    this.handleRollBackFormSubmissionV1  = async function (request) {
        let responseData = [],
            error = false;

        //Perform status alter
        request.activity_id = request.workflow_activity_id;
        request.activity_status_id = request.new_activity_status_id;
        request.activity_status_type_id = request.new_activity_status_type_id;
        request.message_unique_id = util.getMessageUniqueId(request.asset_id);
        request.track_gps_datetime = util.getCurrentUTCTime();
        this.alterActivityStatus(request, ()=>{});
        await sleep(2000);

        //Need to get the asset(Role) -- Mapped to that status
        let [err, roleData] = await activityListingService.getAssetTypeIDForAStatusID(request, request.new_activity_status_id);
        request.asset_type_id = (!err && roleData[0].length > 0) ? roleData[0].asset_type_id : 0;
        
        let [err1, assetData] = await activityListingService.getAssetForAssetTypeID(request);
        let assetID = (!err1 && assetData[0].length > 0) ? assetData[0].asset_id : 0;

        //Increment the Roll Back count
        request.asset_id = assetID;
        await activityListingService.setAssetRollBackCnt(request);

        await sleep(1000);
        //Get Weekly roll back count
        request.start_datetime = util.getStartDateTimeOfWeek();
        request.end_datetime = util.getEndDateTimeOfWeek();
        request.flag = 0;
        request.activity_type_category_id = 48;
        let [err2, weeklyCount] = await activityListingService.getAssetRollBackCnt(request);
        let weeklyRollBackCnt = 0;
        let weeklyTotalCnt = 0;
        let weeklyPercentage = 0;
        if(!err2 && weeklyCount.length > 0) {
            weeklyRollBackCnt = weeklyCount[0].rollback_count;
            weeklyTotalCnt = weeklyCount[0].total_count;
            weeklyPercentage = (weeklyRollBackCnt/ weeklyTotalCnt) * 100;
        }        
        let weeklyObj = {
                summary_id: 27,
                asset_id: assetID,
                entity_decimal_2: weeklyRollBackCnt,//numerator
                entity_bigint_1: weeklyTotalCnt, //denominator
                entity_double_1: weeklyPercentage, //Percentage
                entity_decimal_1: weeklyPercentage //Percentage
            };
        if(assetID > 0) await activityCommonService.weeklySummaryInsert(request, weeklyObj);        

        //Get Monthly roll back count
        request.start_datetime =  util.getStartDateTimeOfMonth();
        request.end_datetime = util.getEndDateTimeOfMonth();
        request.flag = 0;
        request.activity_type_category_id = 48;
        let [err3, monthlyCount] = await activityListingService.getAssetRollBackCnt(request);
        let monthlyRollBackCnt = 0;
        let monthlyTotalCnt = 0;
        let monthlyPercentage = 0;
        if(!err3 && monthlyCount.length > 0) {
            monthlyRollBackCnt = monthlyCount[0].rollback_count;
            monthlyTotalCnt = monthlyCount[0].total_count;
            monthlyPercentage = (monthlyRollBackCnt/ monthlyTotalCnt) * 100;
        }
        let monthlyObj = {
                summary_id: 40,
                asset_id: assetID,
                entity_decimal_2: monthlyRollBackCnt,//numerator
                entity_bigint_1: monthlyTotalCnt, //denominator
                entity_double_1: monthlyPercentage, //Percentage
                entity_decimal_1: monthlyPercentage //Percentage
            };
        if(assetID > 0) await activityCommonService.monthlySummaryInsert(request, monthlyObj);
        
        return [error, responseData];
    }

}

module.exports = ActivityService;