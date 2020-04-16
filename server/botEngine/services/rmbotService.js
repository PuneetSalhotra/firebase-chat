const logger = require("../../logger/winstonLogger");
//var ActivityService = require('../../services/activityService.js');
//var ActivityParticipantService = require('../../services/activityParticipantService.js');
//var ActivityUpdateService = require('../../services/activityUpdateService.js');
//var ActivityTimelineService = require('../../services/activityTimelineService.js');
const moment = require('moment');
var makingRequest = require('request');
const nodeUtil = require('util');

function RMBotService(objectCollection) {

    const self = this;

    const util = objectCollection.util;
    const db = objectCollection.db;
    var forEachAsync = objectCollection.forEachAsync;
    const activityCommonService = objectCollection.activityCommonService;

    this.alterWorkflowLead = async function(request){
         request.global_array = [];
        try{

            request.global_array.push({"Unassignment_":request.activity_id+"_"+request.timeline_stream_type_id});
            let [err, data] = await self.getActivityDetailsPromiseAsync(request, request.activity_id);

            let ai_bot_transaction_id = 0;
            //request.global_array.push({"alterWorkflowLead":"Unassignment in process"})
            request.ai_trace_insert_location = "alterWorkflowLead, Unassignment in process";
            request.ai_bot_trigger_activity_id = request.activity_id;
            request.ai_bot_trigger_activity_status_id = data[0].activity_status_id?data[0].activity_status_id:0;
            request.ai_bot_trigger_key = "Unassignment_"+request.activity_id+"_"+request.ai_bot_trigger_activity_status_id+"_"+request.timeline_stream_type_id;
            let [errAI, responseDataAI] = await self.AIEventTransactionInsert(request);
            if(responseDataAI.length > 0){
                request.ai_bot_transaction_id = responseDataAI[0].ai_bot_transaction_id;
            }            
            
            let previous_status_lead_asset_id = 0;
            let previous_status_lead_asset_name = "";
            let previous_status_id = 0;
     
            let objReq = Object.assign({}, request);
            request.global_array.push({"timeline_stream_type_id":request.timeline_stream_type_id});
            if(request.timeline_stream_type_id == 720 || request.timeline_stream_type_id == 722){
                // Invaid assginment
                request.current_lead_asset_id = data[0].activity_lead_asset_id?data[0].activity_lead_asset_id:0;
                await self.RMStatusChangeTrigger(request);

            }else if(request.timeline_stream_type_id == 721){
                //Insufficient Data
                request.global_array.push({"InsufficientData":request.timeline_stream_type_id});

                objReq.current_activity_status_id = data[0].activity_status_id;
                let [error, responseData]  = await self.getPreviousActivityStatus(objReq);
                request.global_array.push({"PREVIOUS_STATUS_DATA":responseData.length});
                if(responseData.length > 0){
                    if(responseData[0].lead_asset_id > 0){
                        request.global_array.push({"PREVIOUS_STATUS_LEAD_DATA_EXISTS":responseData[0].lead_asset_id});
                        previous_status_lead_asset_id = responseData[0].lead_asset_id;
                        previous_status_lead_asset_name = responseData[0].lead_operating_asset_first_name;
                    }else{
                        request.global_array.push({"NO_PREVIOUS_STATUS_LEAD_DATA_EXISTS": "NO LEAD EXISTS FOR PREVIOUS STATUS, HENCE ASSIGNING CREATOR AS LEAD "+data[0].activity_creator_asset_id});
                        previous_status_lead_asset_id = data[0].activity_creator_asset_id;
                        previous_status_lead_asset_name = data[0].activity_creator_operating_asset_first_name;
                    }

                    logger.info("previous_status_lead_asset_id ::"+previous_status_lead_asset_id);
                    logger.info("previous_status_lead_asset_name ::"+previous_status_lead_asset_name);

                    previous_activity_status_id = responseData[0].from_activity_status_id;

                    logger.info("previous_activity_status_id"+previous_activity_status_id);
                    request.global_array.push({"previous_activity_status_id": previous_activity_status_id});

                    request.activity_status_lead_asset_id = previous_status_lead_asset_id;
                    request.target_status_lead_asset_id = previous_status_lead_asset_id;
                    request.target_status_lead_asset_name = previous_status_lead_asset_name;

                    logger.info("request.target_status_lead_asset_id ::"+request.target_status_lead_asset_id);
                    logger.info("request.target_status_lead_asset_name ::"+request.target_status_lead_asset_name);

                    if(previous_activity_status_id > 0){                  

                        //status rollback
                        request.activity_status_id = previous_activity_status_id;
                        request.global_array.push({"STATUS_ROLLBACK_TO":previous_activity_status_id});
                        let [error2, responseCode2] = await self.workforceActivityStatusMappingSelectStatusId(request);
                        let roleLinkedToStatus = 0;
                        let statusDuration = 0;
                        if(responseCode2.length > 0){
                            roleLinkedToStatus = responseCode2[0].asset_type_id;
                            statusDuration = responseCode2[0].activity_status_duration;
                            request.activity_status_name = responseCode2[0].activity_status_name
                        }
                        request.duration_in_minutes = statusDuration;
                        request.asset_type_id = roleLinkedToStatus;
                        request.activity_status_type_id = responseData[0].from_activity_status_type_id

                        let objReq2 = Object.assign({},request);
                        objReq2.timeline_stream_type_id = 718;
                        objReq2.lead_asset_id = previous_status_lead_asset_id;
                        objReq2.is_prior_update = 1;
                        self.activityListLeadUpdateV1(objReq2, previous_status_lead_asset_id);

                        request.is_status_rollback = 1;                
                        request.rm_flag = 1;  
                        self.activityListUpdateRMFlags(request);

                        logger.info("Alter Status :: "+JSON.stringify(request));
                        request.global_array.push({"alterStatusMakeRequest":previous_activity_status_id});
       
                        await self.alterStatusMakeRequest(request);

                    }else{
                        //make the creator as lead
                        request.global_array.push({"PREVIOUS STATUS DATA FOUND, BUT LEAD NOT FOUND, HENCE ASSIGNING CREATOR AS LEAD :: ":previous_status_lead_asset_id});
                        let objReq2 = Object.assign({},request);
                        objReq2.timeline_stream_type_id = 718;
                        objReq2.lead_asset_id = previous_status_lead_asset_id;
                        self.activityListLeadUpdateV1(objReq2, previous_status_lead_asset_id);
                    }
                }else{
                    request.global_array.push({"NO PREVIOUS STATUS DATA FOUND, HENCE ASSIGNING CREATOR AS LEAD :: ":previous_status_lead_asset_id});
                    previous_status_lead_asset_id = data[0].activity_creator_asset_id;
                    previous_status_lead_asset_name = data[0].activity_creator_operating_asset_first_name;

                    objReq.timeline_stream_type_id = 719;
                    objReq.lead_asset_id = 0;
                    await self.activityListLeadUpdateV1(objReq, 0);
                    request.global_array.push({"ADDING_PARTICIPANT":previous_status_lead_asset_id});
                    request.duration_in_minutes = 0;
                    request.target_status_lead_asset_id = previous_status_lead_asset_id;
                    request.target_status_lead_asset_name = previous_status_lead_asset_name;
                    self.callAddParticipant(request);
                    
                }
            }
        }catch(e){
            logger.info("Exception occured in alterWorkflowLead"+e);
            request.global_array.push({"Exception alterWorkflowLead":e});
            request.ai_trace_insert_location = "Exception alterWorkflowLead";
            self.AIEventTransactionInsert(request);
        }
    }

    this.callAddParticipant = async function(request){

        //request.global_array = [];
        if(request.hasOwnProperty("ai_bot_transaction_id") && !request.hasOwnProperty("global_array"))
        {   request.global_array = [];
            let [err, logData] = await self.getAIBotTransaction(request);
            request.global_array = JSON.parse(logData[0].activity_ai_bot_transaction_inline_data);
        }


        logger.info("callAddParticipant"+JSON.stringify(request,null,2));
        let timelineCollection = {};
        timelineCollection.content="Tony has assigned "+request.target_status_lead_asset_name+" as Lead";
        timelineCollection.subject="Tony has assigned "+request.target_status_lead_asset_name+" as Lead";
        timelineCollection.mail_body="Tony has assigned "+request.target_status_lead_asset_name+" as Lead";
        timelineCollection.attachments=[];
        timelineCollection.asset_reference=[];
        timelineCollection.activity_reference=[];
        timelineCollection.rm_bot_scores={};
        request.activity_lead_timeline_collection = JSON.stringify(timelineCollection);
        //console.log("Before Making Request ", JSON.stringify(request,null,2));
        request.res_account_id = 0;
        request.res_workforce_id = 0;
        request.res_asset_type_id = 0;
        request.res_asset_category_id = 0;
        request.res_asset_id = request.target_status_lead_asset_id;

        request.ai_bot_id = 1;
        request.ai_bot_status_id = 2;
        request.bot_mapping_inline_data = {};

        await self.unallocatedWorkflowInsert(request);

        self.addParticipantMakeRequest(request);
        request.target_asset_id = request.target_status_lead_asset_id;
        if(request.hasOwnProperty("duration_in_minutes")){
            if(request.duration_in_minutes > 0)
                await self.getWorkflowStatusDueDateBasedOnAssetBusinessHours(request, 1);
                request.ai_trace_insert_location = "callAddParticipant, after seeting status duedate";
                self.AIEventTransactionInsert(request);
        }else{
            request.ai_trace_insert_location = "No duration_in_minutes, hence no staus due date set";
            self.AIEventTransactionInsert(request);
        }
        return "";
    }

    this.RMOnAvailabilityOFAResource = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.lead_asset_type_id,
            request.end_due_datetime,
            request.due_date_flag,
            request.page_start||0,
            request.page_limit||500
        );

        const queryString = util.getQueryString('ds_v1_1_activity_ai_bot_mapping_select_worklows_role', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                    request.global_array.push({"RMOnAvailabilityOFAResource":"LENGTH :: "+responseData.length+" : "+queryString});
                    if(data.length>0){
                            responseData = data;
                            error = false; 
                    }else{

                        request.end_due_datetime = util.addDays(util.getCurrentUTCTime(), 15);
                        let paramsArr1 = new Array(
                            request.organization_id,
                            request.lead_asset_type_id,
                            request.end_due_datetime,
                            request.due_date_flag,
                            request.page_start||0,
                            request.page_limit||500
                        );
                        let queryString1 = util.getQueryString('ds_v1_1_activity_ai_bot_mapping_select_worklows_role', paramsArr1);

                        await db.executeQueryPromise(1, queryString1, request).then(async (data1) => { 
                            request.global_array.push({"RMOnAvailabilityOFAResource1":"LENGTH1 :: "+data1.length+" : "+queryString1});
                            if(data.length>0){
                                responseData = data1;
                                error = false; 
                            }else{
                                request.end_due_datetime = util.addDays(util.getCurrentUTCTime(), 30);
                                 let paramsArr2 = new Array(
                                    request.organization_id,
                                    request.lead_asset_type_id,
                                    request.end_due_datetime,
                                    request.due_date_flag,
                                    request.page_start||0,
                                    request.page_limit||500
                                );
                                let queryString2 = util.getQueryString('ds_v1_1_activity_ai_bot_mapping_select_worklows_role', paramsArr2);
                                await db.executeQueryPromise(1, queryString2, request).then(async (data2) => {
                                    request.global_array.push({"RMOnAvailabilityOFAResource2":"LENGTH2 :: "+data2.length+" : "+queryString2});
                                    if(data2.length > 0){
                                        responseData = data2;
                                        error = false; 
                                    }else{

                                        request.end_due_datetime = util.addDays(util.getCurrentUTCTime(), 60);
                                         let paramsArr3 = new Array(
                                            request.organization_id,
                                            request.lead_asset_type_id,
                                            request.end_due_datetime,
                                            request.due_date_flag,
                                            request.page_start||0,
                                            request.page_limit||500
                                        );
                                        let queryString3 = util.getQueryString('ds_v1_1_activity_ai_bot_mapping_select_worklows_role', paramsArr3);
                                        
                                        await db.executeQueryPromise(1, queryString3, request).then(async (data3) => {
                                            request.global_array.push({"RMOnAvailabilityOFAResource3":"LENGTH3 :: "+data3.length+" : "+queryString3});                                        
                                            if(data3.length > 0){
                                                responseData = data3;
                                                error = false; 
                                            }else{
                                                request.end_due_datetime = util.addDays(util.getCurrentUTCTime(), 60);
                                                request.due_date_flag = 1;
                                                 let paramsArr4 = new Array(
                                                    request.organization_id,
                                                    request.lead_asset_type_id,
                                                    request.end_due_datetime,
                                                    request.due_date_flag,
                                                    request.page_start||0,
                                                    request.page_limit||500
                                                );
                                                let queryString4 = util.getQueryString('ds_v1_1_activity_ai_bot_mapping_select_worklows_role', paramsArr4);
                                                await db.executeQueryPromise(1, queryString4, request).then(async (data4) => {
                                                    request.global_array.push({"RMOnAvailabilityOFAResource4":"LENGTH4 :: "+data4.length+" : "+queryString4});
                                                    logger.info("RMOnAvailabilityOFAResource4 LENGTH4 :: "+data4.length);   
                                                        responseData = data4;
                                                        error = false;
                                                        return [error, responseData];
                                                });
                                            }
                                        });
                                    }
                                });
                            }

                            logger.info("RMOnAvailabilityOFAResource LENGTH1 :: "+data1.length);   
                        });                     
                    }
                })
                .catch((err) => {
                    error = err;
                });            
        }

        return [error, responseData];
    }

    this.unallocatedWorkflowInsert = async function (request) {
        let responseData = [],
            error = true;
        console.log(" request.bot_mapping_inline_data :: "+ request.bot_mapping_inline_data);

        let paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.ai_bot_id,
            request.ai_bot_status_id,
            JSON.stringify(request.bot_mapping_inline_data),
            request.bot_id || 0,
            request.bot_operation_id || 0,
            util.getCurrentUTCTime()
        );


        const queryString = util.getQueryString('ds_v1_activity_ai_bot_mapping_insert', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    // record ai transaction insert
                    request.global_array.push({"unallocatedWorkflowInsert":queryString});

                    if(request.ai_bot_status_id == 3){
                        request.target_activity_status_id = data[0].activity_status_id;
                        self.sendPushtoSuitableUnAvailableResources(request);
                    }
                })
                .catch((err) => {
                    error = err;
                });            
        }

        return [error, responseData];
    } 

    this.AIEventTransactionInsert = async function (request) {

        let responseData = [],
        error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.ai_bot_id,
            request.ai_bot_status_id,
            JSON.stringify(request.global_array),
            request.bot_id,
            request.bot_operation_id,
            util.getCurrentUTCTime(),
            request.ai_bot_transaction_id || 0,
            request.ai_trace_insert_location || '',
            request.target_asset_id || 0,
            request.asset_id || 0,
            request.ai_bot_trigger_key || "",
            request.ai_bot_trigger_activity_id || 0,
            request.ai_bot_trigger_activity_status_id || 0,
            request.ai_bot_trigger_asset_id || 0
        );

        const queryString = util.getQueryString('ds_v1_activity_ai_bot_transaction_insert', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    //request.global_array.push({"AIEventTransactionInsert":queryString})
                })
                .catch((err) => {
                    error = err;
                });            
        }
        return [error, responseData];
    }       

  
   this.getWorkflowStatusDueDateBasedOnAssetBusinessHours = async function(request, flag){

    try{

        logger.silly("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        logger.silly("*******Generating Status Due Date for "+request.target_asset_id+" on workflow "+request.activity_id);
        logger.silly("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

        logger.silly("duration_in_minutes :: "+request.duration_in_minutes);
        let statusDuration = request.duration_in_minutes;
        let hours_array = [];
        let hours_array_map = {};
        let hours_array_endtime_map = {};
        var map1 = new Map(); 
        var map2 = new Map(); 
        var map3 = new Map(); 
        var map4 = new Map();
        const [err, assetData] = await self.assetListSelectAssetWorkforce(request); 
        //console.log("DATA ::"+assetData[0].asset_inline_data);
        let businessDays = [];
        let minutes_per_day = 0;

        let businessDaysExists = false;
        let workforceBusinessHoursExists = false;
        let assetBusinessHoursExists = false;
        let accountBusinessHoursExists = false;

        let remaining_mins_in_current_day = 0;
        let assetInlineData = assetData[0].asset_inline_data?JSON.parse(assetData[0].asset_inline_data):{};
        let workforceInlineData = assetData[0].workforce_inline_data?JSON.parse(assetData[0].workforce_inline_data):{};
        let accountInlineData = assetData[0].account_inline_data?JSON.parse(assetData[0].account_inline_data):{};

        if(workforceInlineData.hasOwnProperty("business_days")){
             //console.log("workforceInlineData2 :: "+workforceInlineData.business_days);
             workforceInlineData.business_days.map((day) => {
                //let temp = day.value;
                //console.log(day.value);
                businessDays.push(day.value);
                
             });
        }else if(accountInlineData.hasOwnProperty("business_days")){
             //console.log("workforceInlineData2 :: "+workforceInlineData.business_days);
             accountInlineData.business_days.map((day) => {
                //let temp = day.value;
                //console.log(day.value);
                businessDays.push(day.value);
                
             });
        }

        logger.info("BUSINESS DAYS "+JSON.stringify(businessDays));

        logger.info("CURRENT TIME IST:: "+util.getCurrentTimeHHmmIST_());
   
        if(assetInlineData.hasOwnProperty("business_hours")){
            //console.log("assetInlineData1 :: "+assetInlineData.business_hours);
            if(assetInlineData.business_hours.length > 0){
                logger.info("Specific workhours for asset exists, hence processing asset working hours");
                assetBusinessHoursExists = true;
                assetInlineData.business_hours.map((hours) => {
                    //console.log("assetInlineData business_hours_start_time ",hours.business_hour_start_time);
                    //console.log("assetInlineData business_hours_end_time ",hours.business_hour_end_time);

                    //hours_array.push(util.getCustomTimeHHmmNumber(hours.business_hour_start_time)+"-"+util.getCustomTimeHHmmNumber(hours.business_hour_end_time)+"-"+Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time)));
                    let temp = util.getCustomTimeHHmmNumber(hours.business_hour_start_time);
                    hours_array.push(Number(util.getCustomTimeHHmmNumber(hours.business_hour_start_time)));
                    //console.log("temp : "+Number(temp));
                    map1.set(Number(temp), Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time)));
                    map4.set(Number(temp), Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST_())));
                    map2.set(Number(temp), hours.business_hour_end_time);
                    map3.set(Number(temp), hours.business_hour_start_time);

                    //hours_array_map[temp] = Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST()));
                    //hours_array_endtime_map[temp] = hours.business_hour_end_time;

                    remaining_mins_in_current_day = remaining_mins_in_current_day + Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST()));
                    minutes_per_day = minutes_per_day + Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time));
                    // console.log("minutes_per_day : "+minutes_per_day);
                    // console.log("remaining_mins_in_current_day : "+remaining_mins_in_current_day);
                    // console.log("map1 :: "+map1.get(Number(temp)));
                    // console.log("map2 :: "+map2.get(Number(temp)));
                    // console.log("map3 :: "+map3.get(Number(temp)));
                    // console.log("map3 :: "+map4.get(Number(temp)));
                    
                })
            }else{
                if(workforceInlineData.hasOwnProperty("business_hours")){
                    logger.info("Asset business Hours length = 0 Hence going with workforce level working hours");
                 //console.log("workforceInlineData3 :: "+workforceInlineData.business_hours);
                    if(workforceInlineData.business_hours.length > 0){
                    	workforceBusinessHoursExists = true;
                        workforceInlineData.business_hours.map((hours) => {
                        //console.log("workforceInlineData business_hours_start_time ",hours.business_hour_start_time);
                        //console.log("workforceInlineData business_hours_end_time ",hours.business_hour_end_time);

                        //hours_array.push(util.getCustomTimeHHmmNumber(hours.business_hour_start_time)+"-"+util.getCustomTimeHHmmNumber(hours.business_hour_end_time)+"-"+Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time)));
                        let temp = util.getCustomTimeHHmmNumber(hours.business_hour_start_time);
                        hours_array.push(Number(util.getCustomTimeHHmmNumber(hours.business_hour_start_time)));
                        //console.log("temp : "+Number(temp));
                        map1.set(Number(temp), Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time)));
                        map4.set(Number(temp), Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST_())));
                        map2.set(Number(temp), hours.business_hour_end_time);
                        map3.set(Number(temp), hours.business_hour_start_time);

                        //hours_array_map[temp] = Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST()));
                        //hours_array_endtime_map[temp] = hours.business_hour_end_time;

                        remaining_mins_in_current_day = remaining_mins_in_current_day + Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST()));
                        minutes_per_day = minutes_per_day + Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time));
                        // console.log("minutes_per_day : "+minutes_per_day);
                        // console.log("remaining_mins_in_current_day : "+remaining_mins_in_current_day);
                        // console.log("map1 :: "+map1.get(Number(temp)));
                        // console.log("map2 :: "+map2.get(Number(temp)));
                        // console.log("map3 :: "+map3.get(Number(temp)));
                        // console.log("map4 :: "+map3.get(Number(temp)));
                        })
                    }
                };
            }
        }else{
            if(workforceInlineData.hasOwnProperty("business_hours")){
                logger.info("No Specific workhours for asset, hence going for workforce level working hours");
             //console.log("workforceInlineData3 :: "+workforceInlineData.business_hours);
                if(workforceInlineData.business_hours.length > 0){
                	workforceBusinessHoursExists = true;
                    workforceInlineData.business_hours.map((hours) => {
                    //console.log("workforceInlineData business_hours_start_time ",hours.business_hour_start_time);
                    //console.log("workforceInlineData business_hours_end_time ",hours.business_hour_end_time);

                    //hours_array.push(util.getCustomTimeHHmmNumber(hours.business_hour_start_time)+"-"+util.getCustomTimeHHmmNumber(hours.business_hour_end_time)+"-"+Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time)));
                    let temp = util.getCustomTimeHHmmNumber(hours.business_hour_start_time);
                    hours_array.push(Number(util.getCustomTimeHHmmNumber(hours.business_hour_start_time)));
                    //console.log("temp : "+Number(temp));
                    map1.set(Number(temp), Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time)));
                    map4.set(Number(temp), Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST_())));
                    map2.set(Number(temp), hours.business_hour_end_time);
                    map3.set(Number(temp), hours.business_hour_start_time);

                    //hours_array_map[temp] = Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST()));
                    //hours_array_endtime_map[temp] = hours.business_hour_end_time;

                    remaining_mins_in_current_day = remaining_mins_in_current_day + Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST()));
                    minutes_per_day = minutes_per_day + Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time));
                    // console.log("minutes_per_day : "+minutes_per_day);
                    // console.log("remaining_mins_in_current_day : "+remaining_mins_in_current_day);
                    // console.log("map1 :: "+map1.get(Number(temp)));
                    // console.log("map2 :: "+map2.get(Number(temp)));
                    // console.log("map3 :: "+map3.get(Number(temp)));
                    // console.log("map3 :: "+map4.get(Number(temp)));
                    })
                }
            }else if(accountInlineData.hasOwnProperty("business_hours")){
                console.log("No Specific workhours for asset and workforce, hence going for account level working hours");
                if(accountInlineData.business_hours.length > 0){
                    accountBusinessHoursExists = true;
                    accountInlineData.business_hours.map((hours) => {
                        // console.log("accountInlineData business_hours_start_time ",hours.business_hour_start_time);
                        // console.log("accountInlineData business_hours_end_time ",hours.business_hour_end_time);

                        //hours_array.push(util.getCustomTimeHHmmNumber(hours.business_hour_start_time)+"-"+util.getCustomTimeHHmmNumber(hours.business_hour_end_time)+"-"+Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time)));
                        let temp = util.getCustomTimeHHmmNumber(hours.business_hour_start_time);
                        hours_array.push(Number(util.getCustomTimeHHmmNumber(hours.business_hour_start_time)));
                        //console.log("temp : "+Number(temp));
                        map1.set(Number(temp), Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time)));
                        map4.set(Number(temp), Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST_())));
                        map2.set(Number(temp), hours.business_hour_end_time);
                        map3.set(Number(temp), hours.business_hour_start_time);

                        //hours_array_map[temp] = Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST()));
                        //hours_array_endtime_map[temp] = hours.business_hour_end_time;

                        remaining_mins_in_current_day = remaining_mins_in_current_day + Number(util.reminingTimeOfTheDay(hours.business_hour_start_time, hours.business_hour_end_time, util.getCurrentTimeHHmmIST()));
                        minutes_per_day = minutes_per_day + Number(util.getDiffAMPM(hours.business_hour_start_time, hours.business_hour_end_time));
                        // console.log("minutes_per_day : "+minutes_per_day);
                        // console.log("remaining_mins_in_current_day : "+remaining_mins_in_current_day);
                        // console.log("map1 :: "+map1.get(Number(temp)));
                        // console.log("map2 :: "+map2.get(Number(temp)));
                        // console.log("map3 :: "+map3.get(Number(temp)));
                        // console.log("map3 :: "+map4.get(Number(temp)));
                    })
                }
            }
        }

        if(businessDays.length == 0){
        	logger.info("@@@@@@@@@@@@@@@@@@@@ No Business Days Exists");
        	return '1970-01-01 00:00:00';
        }else if(hours_array.length == 0){
        	logger.info("@@@@@@@@@@@@@@@@@@@@ No Business Hours Exists");
        	return '1970-01-01 00:00:00';
        }else{
        	logger.info("#################### Business Hours and Working Hours Both Exists");
        }
        
        // console.log("101 Minutes per day : "+minutes_per_day);
        // console.log("102 (Number(statusDuration) : "+(Number(statusDuration)));
        let dueDate = "";
        let temp_current_datetime = util.getCurrentISTTime();
        let remianing_minutes_after_today = Number(statusDuration);

        if(businessDays.includes(util.getDayOfWeek(temp_current_datetime)))
            remianing_minutes_after_today = Number(statusDuration) - remaining_mins_in_current_day;

        let num_of_days = Math.floor(remianing_minutes_after_today/minutes_per_day);
        let unallocated_remaining_minutes = remianing_minutes_after_today%minutes_per_day;

        // console.log("103 Days :: "+num_of_days);
        // console.log("104 remianing_minutes_after_today:: "+remianing_minutes_after_today);
        // console.log("105 Remaining Minutes after day calculations:: "+remianing_minutes_after_today%minutes_per_day);
        // console.log("106 unallocated_remaining_minutes:: "+unallocated_remaining_minutes);

         for(let i = 0; i < num_of_days; ){
            if(businessDays.includes(util.getDayOfWeek(util.addDays(temp_current_datetime,1)))){
                temp_current_datetime = temp_current_datetime.substring(0,10)+" "+util.getCustomTimeHHmm24Hr(map3.get(hours_array[hours_array.length-1]));
                temp_current_datetime = util.addDays(temp_current_datetime,1);
                //console.log("106.1 Working Day :: "+temp_current_datetime+" "+util.getDayOfWeek(temp_current_datetime)); 
                i++
            }else{
                temp_current_datetime = util.addDays(temp_current_datetime,1); 
                //console.log("106.2 Non working Day :: "+temp_current_datetime+" "+util.getDayOfWeek(temp_current_datetime)); 
            }   
         }
         // console.log("107 Due Datetime :: "+temp_current_datetime);
         // console.log("108 Number(remaining_mins_in_current_day) :: "+Number(remaining_mins_in_current_day));
         // console.log("109 Number(unallocated_remaining_minutes) :: "+Number(unallocated_remaining_minutes));

         let current_datetime = util.getCurrentISTTime();
         let end_time = "";
         // console.log("110 hours array :: "+hours_array.sort(function(a, b){return a - b}));
         // console.log("111 unallocated_remaining_minutes :: "+unallocated_remaining_minutes);

         if(Number(num_of_days) <= 0){
            //console.log("111.1 num_of_days :: "+num_of_days);
            if(Number(unallocated_remaining_minutes) >= 0){
                //console.log("111.2 unallocated_remaining_minutes :: "+unallocated_remaining_minutes);
                let counter = 0;
                for(let i = 0; i < 1; ){
                    counter++;
                    //console.log("112.1 unallocated_remaining_minutes :: "+unallocated_remaining_minutes);
                    if(businessDays.includes(util.getDayOfWeek(util.addDays(temp_current_datetime,1)))){
                        //console.log("112.2 business days includes :: "+businessDays.includes(util.getDayOfWeek(util.addDays(temp_current_datetime,1))));
                        temp_current_datetime = util.addDays(temp_current_datetime,1);
                        // console.log("112 hours_array[0] :: "+hours_array[0]);
                        // console.log("113 map3.get(hours_array[0]) :: "+map3.get(hours_array[0]));
                        temp_current_datetime = temp_current_datetime.substring(0,10)+" "+util.getCustomTimeHHmm24Hr(map3.get(hours_array[0]));
                        for(let k = 0; k < hours_array.length;){ 
                            // console.log("114 hours_array[k] :: "+hours_array[k]);
                            //  console.log("115 map1.get(hours_array[k]) :: "+map1.get(hours_array[k]));
                            //  console.log("116 unallocated_remaining_minutes :: "+unallocated_remaining_minutes);
                       
                            if(Number(map1.get(hours_array[k])) <= Number(unallocated_remaining_minutes)){
                                end_time = util.getCustomTimeHHmm24Hr(map2.get(hours_array[k]));
                                unallocated_remaining_minutes = Number(unallocated_remaining_minutes) - Number(map1.get(hours_array[k]));
                                k++;
                                // console.log(k+" 117 if unallocated_remaining_minutes :: "+unallocated_remaining_minutes);
                                // console.log(k+" 118 if end_time :: "+end_time);
                            }else{
                                end_time = util.getCustomTimeHHmm24Hr(map2.get(hours_array[k]));
                                unallocated_remaining_minutes = Number(map1.get(hours_array[k]) - Number(unallocated_remaining_minutes));
                                k = hours_array.length;
                                // console.log(k+" 119 else unallocated_remaining_minutes :: "+unallocated_remaining_minutes);
                                // console.log(k+" 120 else end_time :: "+end_time);
                            } 
                        }
                        i++;
                    }else{
                        if(counter === 7)
                            i = 1;
                        temp_current_datetime = util.addDays(temp_current_datetime,1);
                        // console.log("112.3 Day not exists :: "+util.getDayOfWeek(util.addDays(temp_current_datetime,1)));
                    }
                }

                temp_current_datetime = util.substractMinutes(temp_current_datetime.substring(0,10)+" "+end_time, unallocated_remaining_minutes);
                // console.log("121 substractMinutes "+util.substractMinutes(temp_current_datetime.substring(0,10)+" "+end_time, unallocated_remaining_minutes))
                
            }else{
                 
                if(businessDays.includes(util.getDayOfWeek(temp_current_datetime))){
                    unallocated_remaining_minutes = minutes_per_day + unallocated_remaining_minutes;
                    temp_current_datetime = temp_current_datetime.substring(0,10)+" "+util.getCustomTimeHHmm24Hr(map3.get(hours_array[0]));
                    for(let k = 0; k < hours_array.length;){ 
                        // console.log("122 hours_array[k] :: "+hours_array[k]);
                        //  console.log("123 map1.get(hours_array[k]) :: "+map1.get(hours_array[k]));
                        //  console.log("124 unallocated_remaining_minutes :: "+unallocated_remaining_minutes);
                   
                        if(Number(map1.get(hours_array[k])) <= Number(unallocated_remaining_minutes)){
                            end_time = util.getCustomTimeHHmm24Hr(map2.get(hours_array[k]));
                            unallocated_remaining_minutes = Number(unallocated_remaining_minutes) - Number(map1.get(hours_array[k]));
                            k++;
                            // console.log(k+" 125 no of days = 0 if unallocated_remaining_minutes :: "+unallocated_remaining_minutes);
                            // console.log(k+" 126 no of days = 0 if end_time :: "+end_time);
                        }else{
                            end_time = util.getCustomTimeHHmm24Hr(map2.get(hours_array[k]));
                            unallocated_remaining_minutes = Number(map1.get(hours_array[k])) - Number(unallocated_remaining_minutes);
                            k = hours_array.length;
                            // console.log(k+" 127 no of days = 0 else unallocated_remaining_minutes :: "+unallocated_remaining_minutes);
                            // console.log(k+" 128 no of days = 0 else end_time :: "+end_time);
                        } 
                    }
                    
                }
                temp_current_datetime = util.substractMinutes(temp_current_datetime.substring(0,10)+" "+end_time, unallocated_remaining_minutes);
                // console.log("129 substractMinutes "+util.substractMinutes(temp_current_datetime.substring(0,10)+" "+end_time, unallocated_remaining_minutes))
                
               // request.status_due_datetime = temp_current_datetime;
               // self.updateStatusDueDate(request);
            }

         }else if(num_of_days > 0){
           // console.log("111.3 num_of_days :: "+num_of_days);
                let counter = 0;
                for(let i = 0; i < num_of_days; ){
                    counter++;
                    //console.log("111.4 num_of_days :: "+num_of_days);
                    if(businessDays.includes(util.getDayOfWeek(util.addDays(temp_current_datetime,1)))){
                        counter = 0;
                        temp_current_datetime = util.addDays(temp_current_datetime,1);
                        temp_current_datetime = temp_current_datetime.substring(0,10)+" "+util.getCustomTimeHHmm24Hr(map3.get(hours_array[0]));
                        for(let k = 0; k < hours_array.length;){ 
                            // console.log("130 hours_array[k] :: "+hours_array[k]);
                            //  console.log("131 map1.get(hours_array[k]) :: "+map1.get(hours_array[k]));
                            //  console.log("132 unallocated_remaining_minutes :: "+unallocated_remaining_minutes);
                       
                            if(Number(map1.get(hours_array[k])) <= Number(unallocated_remaining_minutes)){
                                end_time = util.getCustomTimeHHmm24Hr(map2.get(hours_array[k]));
                                unallocated_remaining_minutes = Number(unallocated_remaining_minutes) - Number(map1.get(hours_array[k]));
                                k++;
                                // console.log(k+" 133 if unallocated_remaining_minutes :: "+unallocated_remaining_minutes);
                                // console.log(k+" 134 if end_time :: "+end_time);
                            }else{
                                end_time = util.getCustomTimeHHmm24Hr(map2.get(hours_array[k]));
                                unallocated_remaining_minutes = Number(map1.get(hours_array[k])) - Number(unallocated_remaining_minutes);
                                k = hours_array.length;
                                // console.log(k+" 135 else unallocated_remaining_minutes :: "+unallocated_remaining_minutes);
                                // console.log(k+" 136 else end_time :: "+end_time);
                            } 
                        }
                        i++;
                    }else{
                        if(counter === 7)
                            i = num_of_days;
                        
                        temp_current_datetime = util.addDays(temp_current_datetime,1);
                        // console.log("112.3 Day not exists :: "+util.getDayOfWeek(util.addDays(temp_current_datetime,1)));
                    }
                }
                temp_current_datetime = util.substractMinutes(temp_current_datetime.substring(0,10)+" "+end_time, unallocated_remaining_minutes);
                // console.log("137 substractMinutes "+util.substractMinutes(temp_current_datetime.substring(0,10)+" "+end_time, unallocated_remaining_minutes))
                
         }

         //temp_current_datetime = temp_current_datetime.substring(0,10)+" "+map2.get(hours_array[hours_array.length-1]);
        temp_current_datetime = util.subtractUnitsFromDateTime(temp_current_datetime,5.5,'hours');
        logger.silly("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        logger.silly("*******Generated Status Due Date for "+request.target_asset_id+" is "+temp_current_datetime);
        logger.silly("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

        if(flag==1){
            logger.silly("########################### Updating Status Due Date for workflow "+request.activity_id);
            request.status_due_datetime = temp_current_datetime;
            self.updateStatusDueDate(request);
        }

        return temp_current_datetime;
    }catch(e){
        console.log(e);
    }
   }

    this.RMLoopInResoources = async function (request) {

        let [err, assetData] = await self.getAvailableResourcePool(request);
        let resources_exists = false;
        request.global_array.push({"RESOURCES_IN_POOL":assetData.length});
        if(assetData.length == 0){
            request.global_array.push({"END_OF_FLOW":"NO RESOURCES IN THE POOL, HENCE END OF FLOW"});
            request.ai_trace_insert_location = "RMLoopInResoources, No Resources Found";
            self.AIEventTransactionInsert(request);
            return "";
        }

        forEachAsync(assetData, async function (next, rowData) {
            let err, workflowData;
            request.page_start = 0;
            request.page_limit = 500;
            request.due_date_flag = 0;
            request.end_due_datetime = util.addDays(util.getCurrentUTCTime(), 7);
            request.lead_asset_type_id = rowData.asset_type_id;
            request.target_asset_id = rowData.asset_id;
            request.lead_asset_type_id = rowData.asset_type_id;
            request.res_account_id = rowData.account_id;
            request.res_workforce_id = rowData.workforce_id;
            request.res_asset_type_id = rowData.asset_type_id;
            request.res_asset_id = rowData.asset_id;
            request.res_asset_category_id = rowData.asset_type_category_id;
            request.target_asset_id = rowData.asset_id;
            request.target_asset_name = rowData.asset_first_name;
            request.target_operating_asset_id = rowData.operating_asset_id;
            request.target_operating_asset_name = rowData.operating_asset_first_name; 
            [err, workflowData] = await self.RMOnAvailabilityOFAResource(request);

            if(workflowData.length == 0){
                logger.debug("NO WORKFLOWS ", { type: "rm_bot", request_body: request });
                request.global_array.push({"NO_WORKFLOWS_EXISTS":"NO WORKFLOWS EXISTS FOR THE ASSET_TYPE "+rowData.asset_type_id+": END OF FLOW"});
                //request.bot_mapping_inline_data = request.proof;
                //self.AIEventTransactionInsert(request);
                next();
            }else{
                    resources_exists = true;
                    request.workflow_data = workflowData;
                    request.global_array.push({"FINALLY_WORKFLOWS_EXISTS":"ASSET "+rowData.asset_id+" WORKFLOW "+workflowData.length+" FINALLY WORKFLOWS EXISTS, HENCE GOING WITH AI TRIGGERED (RMResourceAvailabilityTrigger)"});
                    await self.RMResourceAvailabilityTrigger(request);
                    request.global_array.push({"COMPLETED":request.target_asset_id});
                    next();
             }
        }).then(()=>{
            request.global_array.push({"AFTER LOOPING THROUGH ALL THE RESOURCES":request.target_asset_id});
            request.ai_trace_insert_location = "RMLoopInResoources, After iterating through all the resources";
            logger.debug("END_OF_RESOURCE_POLL ", { type: "rm_bot", request_body: request });
            if(!resources_exists){
                logger.info("NO WORKFLOWS EXISTS FOR THE RESOURCES IN THE POOL")
                self.AIEventTransactionInsert(request);
            }
            return "";
        })
    }

    this.RMResourceAvailabilityTrigger = async function (request) {

        //request.page_start = 0;
        //request.page_limit = 500;
        let [error, responseData]= [false, request.workflow_data]; //await self.RMOnAvailabilityOFAResource(request);
        logger.info('Available Workflows :: '+responseData.length);

        let highest_score_workflow = -1;
        let highest_score = 0;
        let rm_bot_scores = [];

        let roleLinkedToStatus = 0;
        let statusDuration = 0;   

        let jsonArray = [];
 
        //generate score, find the top score asset
        for(let k = 0; k < responseData.length; k++){

            request.global_array.push({"LOOPING _THROUGH_WORKFLOWS":"ASSET :: "+request.target_asset_id+" ACTIVITY :: "+responseData[k].activity_id+" : "+responseData[k].activity_title});
            let jsonObj = {};
            request.activity_id = responseData[k].activity_id;
            request.activity_status_id = responseData[k].activity_status_id;
            request.target_activity_id = responseData[k].activity_id;
            jsonObj.target_activity_id = responseData[k].activity_id;
            let [error1, responseData1] = await self.workforceActivityStatusMappingSelectStatusId(request);

            if(responseData1.length > 0){
                roleLinkedToStatus = responseData1[0].asset_type_id;
                statusDuration = responseData1[0].activity_status_duration;
            }

            logger.info("request.target_asset_id : "+request.target_asset_id);
            logger.info("request.target_asset_name : "+request.target_asset_name);
            logger.info("request.target_operating_asset_id : "+request.target_operating_asset_id);
            logger.info("request.target_operating_asset_name : "+request.target_operating_asset_name);

            logger.info("roleLinkedToStatus ::"+roleLinkedToStatus+"", { type: 'rm_bot', responseData1, error: error1 });
            logger.info("statusDuration :: "+statusDuration, { type: 'rm_bot', responseData1, error: error1 });

            request.duration_in_minutes = statusDuration
            jsonObj.roleLinkedToStatus = roleLinkedToStatus;
            jsonObj.statusDuration = statusDuration;

            let [error2, data] = await self.generateResourceScore(request);
            logger.info("Generated Score data ::: "+JSON.stringify(data));
            logger.info("*****************************************Asset Score "+request.target_asset_id+" : "+data.total_score);
            request.global_array.push({"GENERATED_SCORE":"ASSET :: "+request.target_asset_id+" ACTIVITY :: "+responseData[k].activity_id+" : "+data.total_score});
            jsonObj.asset_id = request.target_asset_id;
            jsonObj.total_score = data.total_score;
            jsonObj.rm_bot_scores = data.rm_bot_scores;

            if(data.total_score >= highest_score){
                highest_score = data.total_score;
                highest_score_workflow = responseData[k].activity_id;
                rm_bot_scores = data.rm_bot_scores;
            }

            jsonObj.highest_score = highest_score;
            jsonObj.highest_score_workflow = highest_score_workflow;
            //jsonObj.highest_scores = rm_bot_scores;

            jsonArray.push(jsonObj);
        }

        request.global_array.push({"scores":jsonArray});

        if(responseData.length > 0 && highest_score_workflow >= 0){
            logger.info("Choosen workflow ::: "+highest_score_workflow+" :: Choosen Asset"+request.target_asset_id);
            //request.proof.choosen = "Choosen workflow ::: "+highest_score_workflow+" :: Choosen Asset"+request.target_asset_id;
            request.global_array.push({"choosen_workflow":"Choosen workflow ::: "+highest_score_workflow+" :: Choosen Asset"+request.target_asset_id});

            request.activity_id = highest_score_workflow;
            request.rm_bot_scores = rm_bot_scores;
            let timelineCollection = {};
            timelineCollection.content="Tony has assigned "+rm_bot_scores[0].operating_asset_name+" as Lead";
            timelineCollection.subject="Tony has assigned "+rm_bot_scores[0].operating_asset_name+" as Lead";
            timelineCollection.mail_body="Tony has assigned "+rm_bot_scores[0].operating_asset_name+" as Lead";
            timelineCollection.attachments=[];
            timelineCollection.asset_reference=[];
            timelineCollection.activity_reference=[];
            timelineCollection.rm_bot_scores=rm_bot_scores;
            request.activity_lead_timeline_collection = JSON.stringify(timelineCollection);
            //console.log("Before Making Request ", JSON.stringify(request,null,2));

            logger.info("ai_bot_transaction_id EXISTS :: "+request.hasOwnProperty("ai_bot_transaction_id"));
           
           /* if(request.hasOwnProperty("ai_bot_transaction_id"))
            {
                existing_array = [];
                let [err, logData] = await self.getAIBotTransaction(request);
                existing_array = JSON.parse(logData[0].activity_ai_bot_transaction_inline_data);
                request.global_array = existing_array.concat(request.global_array);
                await self.AIEventTransactionInsert(request);
            } else if(!request.hasOwnProperty("ai_bot_transaction_id")){
                request.ai_trace_insert_location = "addParticipantMakeRequest, before add particiapnt";
                let [err, responseData] = await self.AIEventTransactionInsert(request);
                if(responseData.length > 0){
                    request.ai_bot_transaction_id = responseData[0].ai_bot_transaction_id;
                } 
            } 

            logger.info("ai_bot_transaction_id:: "+request.ai_bot_transaction_id); */
            request.target_workflow_id = highest_score_workflow;
            let workflowErr, updatedWorkflowData;

            if(highest_score_workflow > 0)
                [workflowErr, updatedWorkflowData] = await self.assetListUpdateLeadWorkflow(request);

            if(updatedWorkflowData.length > 0){
                if(updatedWorkflowData[0].query_status == 0){

                    request.ai_bot_id = 1;
                    request.ai_bot_status_id = 2;
                    request.bot_mapping_inline_data = {};

                    request.global_array.push({"RESOURCE_AVAILABLE_AND_LOCKED":request.target_asset_id+" OCCUPIED BY "+updatedWorkflowData[0].occupied_workflow_id});

                    await self.unallocatedWorkflowInsert(request);
                    await self.AIEventTransactionInsert(request);
                    await self.addParticipantMakeRequest(request);
                    return [false, {}];
                }else{
                    request.global_array.push({"RESOURCE_ALREADY_OCUUPIED":request.target_asset_id+" OCCUPIED BY "+updatedWorkflowData[0].occupied_workflow_id});
                     await self.AIEventTransactionInsert(request);
                     return [false, {}];
                }
            }else{
                request.global_array.push({"RESOURCE_AVAILABLE_ISSUE":"SOMETHING WENT WRONG "});
                 await self.AIEventTransactionInsert(request);
                return [false, {}];
            }
            
        }else{
            request.global_array.push({"NO_WORKFLOW_CHOSEN_END_OF_FLOW":"Choosen workflow ::: "+highest_score_workflow+" :: Choosen Asset"+request.target_asset_id});
            request.ai_trace_insert_location = "RMResourceAvailabilityTrigger, NO_WORKFLOW_CHOSEN_END_OF_FLOW";
            self.AIEventTransactionInsert(request);
            return [false, {}];
        }
        //console.log('request '+JSON.stringify(request, null,2));
        
    };  

    this.assignResourceAsLead = async function (request, leadAssetId) {
        let error = true, responseData = [];
        
        if(request.hasOwnProperty("ai_bot_transaction_id") && !request.hasOwnProperty("global_array"))
        {
            request.global_array = [];
            let [err, logData] = await self.getAIBotTransaction(request);
            request.global_array = JSON.parse(logData[0].activity_ai_bot_transaction_inline_data);
        }

        request.timeline_stream_type_id = 718;
        await self.activityListLeadUpdateV1(request, leadAssetId);
        request.global_array.push({"leadUpdate":"UPDATING NEW LEAD "+leadAssetId+" ON WORKFLOW "+request.activity_id});

        request.target_asset_id = leadAssetId;
        console.log("duration_in_minutes :: "+request.duration_in_minutes);
        let status_due_date = await self.getWorkflowStatusDueDateBasedOnAssetBusinessHours(request, 1);
        request.global_array.push({"status_due_date":"DERIVED STATUS DUE DATE ON WORKFLOW "+request.activity_id+" FOR "+leadAssetId+" "+status_due_date});

        request.ai_bot_id = 1;
        request.ai_bot_status_id = 2;
        request.bot_mapping_inline_data = {};

        request.global_array.push({"RESOURCE_ALLOCATED":"RESOURCE "+leadAssetId+" ALLOCATED FOR "+request.activity_id});
        await self.unallocatedWorkflowInsert(request);

        if(request.activity_type_flag_persist_role == 1){
            self.RMLoopInResoources(request);
            request.activity_type_flag_persist_role = 0;
        }else{
            request.ai_trace_insert_location = "End of flow, assignResourceAsLead, without going into Resource pool loop again as there is no persistant flag";
            self.AIEventTransactionInsert(request);
        }
        return [error, responseData];
    } 


    this.addParticipantMakeRequest = async function (request) {
      /*  let ai_bot_transaction_id = 0;
        logger.info("ai_bot_transaction_id EXISTS :: "+request.hasOwnProperty("ai_bot_transaction_id"));
        if(!request.hasOwnProperty("ai_bot_transaction_id")){
            request.ai_trace_insert_location = "addParticipantMakeRequest, before add particiapnt";
            let [err, responseData] = await self.AIEventTransactionInsert(request);
            if(responseData.length > 0){
                request.ai_bot_transaction_id = responseData[0].ai_bot_transaction_id;
            } 
        } */

        let participantArray = [];

        let participantCollection = {
            organization_id: request.organization_id,
            account_id: request.res_account_id,
            workforce_id: request.res_workforce_id,
            asset_type_id: request.res_asset_type_id,
            asset_category_id:request.res_asset_category_id,
            asset_id:request.res_asset_id,
            access_role_id:0,
            message_unique_id:util.getMessageUniqueId(request.asset_id)
        }
        participantArray.push(participantCollection);
        const assignRequest = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: 100,
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            asset_message_counter: 0,
            activity_id: request.activity_id,
            activity_type_id: 0,  
            activity_type_category_id: 48, 
            activity_participant_collection: JSON.stringify(participantArray),
            activity_access_role_id: request.activity_access_role_id || 0,            
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(request.asset_id),
            track_latitude: 0.0,
            track_longitude: 0.0,
            track_altitude: 0,
            track_gps_datetime: util.getCurrentUTCTime(),
            track_gps_accuracy: 0.0,
            track_gps_status: 1,
            track_gps_location: '',
            service_version: "3.0",
            app_version: "3.0.0",
            device_os_id: 5,
            datetime_log: util.getCurrentUTCTime(),
            add_as_lead: 1,
            duration_in_minutes:request.duration_in_minutes,
            rm_bot_scores:request.rm_bot_scores,
            activity_lead_timeline_collection:request.activity_lead_timeline_collection,
            timeline_stream_type_id:718,
            ai_bot_transaction_id:request.ai_bot_transaction_id,
            ai_bot_trigger_key:request.ai_bot_trigger_key,
            ai_bot_trigger_activity_id:request.ai_bot_trigger_activity_id,
            ai_bot_trigger_activity_status_id:request.ai_bot_trigger_activity_status_id,
            ai_bot_trigger_asset_id:request.ai_bot_trigger_asset_id
            //global_array:request.global_array
        };
        //console.log("assignRequest :: "+JSON.stringify(assignRequest, null,2));
        //request.global_array.push({"participant_assign_request":JSON.stringify(assignRequest, null,2)})
        const assignActAsync = nodeUtil.promisify(makingRequest.post);
        //logger.info("assignRequest :: "+JSON.stringify(assignRequest, null,2));
        const makeRequestOptions1 = {
            form: assignRequest
        };
        try {
             //console.log("makeRequestOptions1 :: ",JSON.stringify(makeRequestOptions1, null,2));
            // global.config.mobileBaseUrl + global.config.version
            const response = await assignActAsync(global.config.mobileBaseUrl + global.config.version + '/activity/participant/access/set', makeRequestOptions1);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                console.log("Activity Mapping Assign | Body: ", body);
                return [false, {}];
            }else{
                console.log("Error ", body);
                return [true, {}];
            }
        } catch (error) {
            console.log("Activity Mapping Assign | Error: ", error);
            return [true, {}];
        } 
    }    

    this.alterStatusMakeRequest = async function (request) {
        
        let ai_bot_transaction_id = 0;
        request.ai_trace_insert_location = "alterStatusMakeRequest, before the status rollback";
        let [err, responseData] = await self.AIEventTransactionInsert(request);
        if(responseData.length > 0){
            ai_bot_transaction_id = responseData[0].ai_bot_transaction_id;
        } 

        let rollback_status_name = request.activity_status_name;

        let x = JSON.stringify({
                "activity_reference": [{
                    "activity_id": request.activity_id,
                    "activity_title": ""
                }],
                "asset_reference": [{}],
                "attachments": [],
                "content": "Status updated to "+rollback_status_name,
                "mail_body": "Status updated to "+rollback_status_name,
                "subject": "Status updated to "+rollback_status_name
            });

        const alterStatusRequest = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: 100,
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            asset_message_counter: 0,
            activity_id: request.activity_id,
            activity_type_id: 0,  
            activity_type_category_id: 48, 
            activity_access_role_id: request.activity_access_role_id || 0,   
            activity_status_id: request.activity_status_id,
            activity_status_type_id: request.activity_status_type_id || 0,
            activity_status_type_category_id: request.activity_status_type_category_id || 0,        
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(request.asset_id),
            track_latitude: 0.0,
            track_longitude: 0.0,
            track_altitude: 0,
            track_gps_datetime: util.getCurrentUTCTime(),
            track_gps_accuracy: 0.0,
            track_gps_status: 1,
            track_gps_location: '',
            service_version: request.service_version,
            app_version: request.app_version,
            device_os_id: 5,
            datetime_log: util.getCurrentUTCTime(),
            insufficient_data: true,
            is_status_rollback:1,
            activity_stream_type_id:704,
            timeline_stream_type_id:704,
            //global_array:request.global_array,
            target_status_lead_asset_id:request.target_status_lead_asset_id,
            target_status_lead_asset_name:request.target_status_lead_asset_name,
            ai_bot_transaction_id:request.ai_bot_transaction_id,
            ai_bot_trigger_key:request.ai_bot_trigger_key,
            ai_bot_trigger_activity_id:request.ai_bot_trigger_activity_id,
            ai_bot_trigger_activity_status_id:request.ai_bot_trigger_activity_status_id,
            ai_bot_trigger_asset_id:request.ai_bot_trigger_asset_id,
            push_message:"Status updated to "+rollback_status_name,
            activity_timeline_collection:x
        };
        //console.log("assignRequest :: ",JSON.stringify(assignRequest, null,2));
        const alterStatusActAsync = nodeUtil.promisify(makingRequest.post);
        //console.log("assignRequest :: ",JSON.stringify(assignRequest, null,2));
        const makeRequestOptions1 = {
            form: alterStatusRequest
        };
        try {
             //console.log("makeRequestOptions1 :: ",JSON.stringify(makeRequestOptions1, null,2));
            // global.config.mobileBaseUrl + global.config.version
            const response = await alterStatusActAsync(global.config.mobileBaseUrl + global.config.version + '/activity/status/alter', makeRequestOptions1);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                console.log("Activity Status Alter | Body: ", body);
                return [false, {}];
            }else{
                console.log("Error ", body);
                return [true, {}];
            }
        } catch (error) {
            console.log("Activity Status Alter | Error: ", error);
            return [true, {}];
        } 
    }     

    this.workforceActivityStatusMappingSelectStatusId = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_status_id,
            request.target_activity_id || 0
        );
        const queryString = util.getQueryString('ds_v1_workforce_activity_status_mapping_select_status_id', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    request.global_array.push({"workforceActivityStatusMappingSelectStatusId ":queryString});
                    if(responseData.length > 0){
                        request.global_array.push({"status_role_map":"activity_status_id "+responseData[0].activity_status_id+" - "+"asset_type_id "+responseData[0].asset_type_id+": Query : "+queryString});
                    }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    } 

    this.updateStatusDueDate = async function(request) {
        let responseData = [],
            error = true;
        
            let paramsArr = new Array(                
                request.organization_id, 
                request.activity_id, 
                request.status_due_datetime,
                request.asset_id,
                util.getCurrentUTCTime()
            );
        let queryString = util.getQueryString('ds_v1_activity_list_update_status_due_date',paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    request.global_array.push({"updateStatusDueDate ":queryString});
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };


    this.generateResourceScore = async function(request){
        logger.silly("************************************************************************************************");
        logger.info("******* Generating score for asset "+request.target_asset_id+" on workflow "+request.activity_id +"", { type: 'rm_bot', request, error: false });
        logger.silly("************************************************************************************************");

        let read_efficiency_percentage = 0;
        let work_efficiency_percentage = 0;
        let status_rollback_percentage = 0;
        let customer_exposure_percentage = 0;
        let industry_exposure_percentage = 0;
        let workflow_exposure_percentage = 0;
        //let workflow_type_exposure_percentage = 0;
        //let workflow_category_exposure_percentage = 0;

        let work_efficiency = 0;
        let we_activity_status_id = 0;
        let we_activity_status_name = "";
        let we_activity_type_id = 0;
        let we_activity_type_name = "";

        let read_efficiency = 0;
        let status_no_rollback = 0;
        let sor_activity_status_id = 0;
        let sor_activity_status_name = "";
        let sor_activity_type_id = 0;
        let sor_activity_type_name = "";

        let customer_asset_id = 0;
        let industry_id = 0;
        let workflow_id = 0;
        let workflow_type_id = 0;
        let workflow_category_id = 0;

        let workload_data = {};

        let industry_score = 0;
        let industry_name = "";
        let customer_score = 0;
        let customer_asset_name = "";
        let workflow_score = 0;
        let workflow_name = "";
        let workflow_type_score = 0;
        let workflow_category_score = 0;

        let total_score = 0;

        let score_details = {};
        let score_details_array = [];

        try{
        //retrieve the two rows from the asset_summary_transaction
        //get the organizaation level setting
        //get the work efficiency
        //calculate the remaining params
         let [error, responseCode]  = await self.organizationListSelect(request);

         let data_config = JSON.parse(responseCode[0].organization_inline_data).rm_bot_config;
        // console.log("org_level_scores :: "+JSON.parse(responseCode[0].organization_inline_data).rm_bot_config);
         read_efficiency_percentage = data_config.read_efficiency;
         work_efficiency_percentage = data_config.work_efficiency;
         status_rollback_percentage = data_config.status_rollback_percentage;
         customer_exposure_percentage = data_config.customer_exposure_percentage;
         industry_exposure_percentage = data_config.industry_exposure_percentage;
         workflow_exposure_percentage = data_config.workflow_exposure_percentage;
         //workflow_type_exposure_percentage = data_config.workflow_type_exposure_percentage;
         //workflow_category_exposure_percentage = data_config.workflow_category_exposure_percentage;

         logger.info("read_efficiency_percentage************ :: "+read_efficiency_percentage, { type: 'rm_bot', request, error: false });
         logger.info("work_efficiency_percentage************ :: "+work_efficiency_percentage, { type: 'rm_bot', request, error: false });
         logger.info("status_rollback_percentage************ :: "+status_rollback_percentage, { type: 'rm_bot', request, error: false });
         logger.info("customer_exposure_percentage********** :: "+customer_exposure_percentage, { type: 'rm_bot', request, error: false });
         logger.info("industry_exposure_percentage********** :: "+industry_exposure_percentage, { type: 'rm_bot', request, error: false });
         logger.info("workflow_exposure_percentage********** :: "+workflow_exposure_percentage, { type: 'rm_bot', request, error: false });
         //logger.info("workflow_category_exposure_percentage* :: "+workflow_category_exposure_percentage, { type: 'rm_bot', request, error: false });
         //logger.info("workflow_type_exposure_percentage***** :: "+workflow_type_exposure_percentage, { type: 'rm_bot', request, error: false });

        let [err, data] = await self.getActivityDetailsPromiseAsync(request, request.activity_id);

            if(data.length == 0){
                logger.info("No Activities exists, hence total_score = -1", { type: 'rm_bot', request, error: false });
                return[false, {"total_score":-1, "rm_bot_scores":[]}];
            }

            logger.info("industry_id**************** "+data[0].industry_id, { type: 'rm_bot', request, error: false });
            logger.info("customer_asset_id********** "+data[0].customer_asset_id, { type: 'rm_bot', request, error: false });
            logger.info("activity_type_id*********** "+data[0].activity_type_id, { type: 'rm_bot', request, error: false });
            //logger.info("activity_type_tag_id******* "+data[0].activity_type_tag_id, { type: 'rm_bot', request, error: false });
            //logger.info("tag_type_id**************** "+data[0].tag_type_id, { type: 'rm_bot', request, error: false });

            let reqObj = Object.assign({},request);
            reqObj.summary_id = 6;
            reqObj.flag = 0;
            let rmInlineData = {};

            let [summaryErr, summaryData] = await self.assetSummarytransactionSelect(reqObj);
            console.log("summary_data :: "+JSON.stringify(summaryData));

            if(summaryData.length > 0){
                rmInlineData = summaryData[0].data_entity_inline?JSON.parse(summaryData[0].data_entity_inline):{};
            }

            if(rmInlineData.hasOwnProperty("work_efficiency")){
                work_efficiency = rmInlineData.work_efficiency[data[0].activity_status_id]?rmInlineData.work_efficiency[data[0].activity_status_id].work_efficiency:0;
                // we_activity_type_id = rmInlineData.work_efficiency[data[0].activity_status_id]?rmInlineData.work_efficiency[data[0].activity_status_id].activity_type_id:data[0].activity_type_id;
                // we_activity_type_name = rmInlineData.work_efficiency[data[0].activity_status_id]?rmInlineData.work_efficiency[data[0].activity_status_id].activity_type_name:data[0].activity_type_name;
                // we_activity_status_id = rmInlineData.work_efficiency[data[0].activity_status_id]?rmInlineData.work_efficiency[data[0].activity_status_id].activity_status_id:data[0].activity_status_id;
                // we_activity_status_name = rmInlineData.work_efficiency[data[0].activity_status_id]?rmInlineData.work_efficiency[data[0].activity_status_id].activity_status_name:data[0].activity_status_name;
            }else{
                // we_activity_type_id = data[0].activity_type_id;
                // we_activity_type_name = data[0].activity_type_name;
                // we_activity_status_id = data[0].activity_status_id;
                // we_activity_status_name = data[0].activity_status_name;                
            }
                we_activity_type_id = data[0].activity_type_id;
                we_activity_type_name = data[0].activity_type_name;
                we_activity_status_id = data[0].activity_status_id;
                we_activity_status_name = data[0].activity_status_name;                

            if(rmInlineData.hasOwnProperty("read_efficiency")){
                read_efficiency = rmInlineData.read_efficiency?rmInlineData.read_efficiency:0;
            }
            if(rmInlineData.hasOwnProperty("customer_exposure")){
                customer_score = rmInlineData.customer_exposure[data[0].customer_asset_id]?rmInlineData.customer_exposure[data[0].customer_asset_id].customer_score:0;
                //customer_asset_name = rmInlineData.customer_exposure[data[0].customer_asset_id]?rmInlineData.customer_exposure[data[0].customer_asset_id].customer_asset_name:data[0].customer_asset_name;
            }else{
                //customer_asset_name = data[0].customer_asset_name;
            }
            customer_asset_name = data[0].customer_asset_first_name;

            if(rmInlineData.hasOwnProperty("industry_exposure")){
                industry_score = rmInlineData.industry_exposure[data[0].industry_id]?rmInlineData.industry_exposure[data[0].industry_id].industry_score:0;
                //industry_name = rmInlineData.industry_exposure[data[0].industry_id]?rmInlineData.industry_exposure[data[0].industry_id].industry_name:data[0].industry_name;
            }else{
                //industry_name = data[0].industry_name;
            }
            industry_name = data[0].industry_name;

            if(rmInlineData.hasOwnProperty("workflow_exposure")){
                workflow_score = rmInlineData.workflow_exposure[data[0].activity_type_id]?rmInlineData.workflow_exposure[data[0].activity_type_id].workflow_score:0;
                //workflow_name = rmInlineData.workflow_exposure[data[0].activity_type_id]?rmInlineData.workflow_exposure[data[0].activity_type_id].workflow_name:data[0].activity_type_name;
            }else{
                //workflow_name = data[0].activity_type_name;
            }
            workflow_name = data[0].activity_type_name;

            if(rmInlineData.hasOwnProperty("status_no_rollback")){
                status_no_rollback = rmInlineData.status_no_rollback[data[0].activity_status_id]?rmInlineData.status_no_rollback[data[0].activity_status_id].status_no_rollback_efficiency:0;
                // sor_activity_type_id = rmInlineData.status_no_rollback[data[0].activity_status_id]?rmInlineData.status_no_rollback[data[0].activity_status_id].activity_type_id:data[0].activity_type_id;
                // sor_activity_type_name = rmInlineData.status_no_rollback[data[0].activity_status_id]?rmInlineData.status_no_rollback[data[0].activity_status_id].activity_type_name:data[0].activity_type_name;
                // sor_activity_status_id = rmInlineData.status_no_rollback[data[0].activity_status_id]?rmInlineData.status_no_rollback[data[0].activity_status_id].activity_status_id:data[0].activity_status_id;
                // sor_activity_status_name = rmInlineData.status_no_rollback[data[0].activity_status_id]?rmInlineData.status_no_rollback[data[0].activity_status_id].activity_status_name:data[0].activity_status_name;                
            }else{
                // sor_activity_type_id = data[0].activity_type_id;
                // sor_activity_type_name = data[0].activity_type_name;
                // sor_activity_status_id = data[0].activity_status_id;
                // sor_activity_status_name = data[0].activity_status_name;                
            }

            sor_activity_type_id = data[0].activity_type_id;
            sor_activity_type_name = data[0].activity_type_name;
            sor_activity_status_id = data[0].activity_status_id;
            sor_activity_status_name = data[0].activity_status_name;                

            work_efficiency = work_efficiency?work_efficiency:0;
            read_efficiency = read_efficiency?read_efficiency:0;
            industry_score = industry_score?industry_score:0;
            customer_score = customer_score?customer_score:0;
            workflow_score = workflow_score?workflow_score:0;
            status_no_rollback = status_no_rollback?status_no_rollback:0;
            //workflow_type_score = workflow_type_score?workflow_type_score:0;
            //workflow_category_score = workflow_category_score?workflow_category_score:0;
            
            logger.info("work_efficiency********* "+work_efficiency, { type: 'rm_bot', request, error: false });
            logger.info("read_efficiency********* "+read_efficiency, { type: 'rm_bot', request, error: false });
            logger.info("industry_score********** "+industry_score, { type: 'rm_bot', request, error: false });
            logger.info("customer_score********** "+customer_score, { type: 'rm_bot', request, error: false });
            logger.info("workflow_score********** "+workflow_score, { type: 'rm_bot', request, error: false });
            logger.info("no_rollback************* "+status_no_rollback, { type: 'rm_bot', request, error: false });

            //logger.info("workflow_type_score***** "+workflow_type_score, { type: 'rm_bot', request, error: false });
            //logger.info("workflow_category_score* "+workflow_category_score, { type: 'rm_bot', request, error: false });

            total_score = ((read_efficiency * read_efficiency_percentage) + (work_efficiency * work_efficiency_percentage) + (industry_score * industry_exposure_percentage) + (customer_score * customer_exposure_percentage) + (workflow_score * workflow_exposure_percentage) + (status_no_rollback * status_rollback_percentage));
            logger.info("Total Score "+total_score, { type: 'rm_bot', request, error: false });
/*
            score_details.work_efficiency_score = work_efficiency * work_efficiency_percentage;
            //Delivered <Workflow Name> - <Status Name> statuses on time <Percentage> of time.
            score_details.read_efficiency_score =  read_efficiency * read_efficiency_percentage;
            //Read <Percentage> of workflow updates on time in the last 30 days.
            score_details.status_rollback_score = status_no_rollback * status_rollback_percentage;
            //Achieved <Percentage> of <Workflow Name> - <Status Name> statuses without rollbacks.
            score_details.customer_exposure_score = customer_score * customer_exposure_percentage;
            //Exposure to <Percentage> of the <Customer Name> workflows.
            score_details.industry_exposure_score = industry_score * industry_exposure_percentage;
            //Exposure to <Percentage> of <Industry Name> workflows.
            score_details.workflow_exposure_score = workflow_score * workflow_exposure_percentage;
            //Exposure to <Percentage> of <Workflow Name> workflows.
*/
            score_details.work_efficiency_score =  "Delivered "+we_activity_type_name+" - "+we_activity_status_name+" statuses on time "+(work_efficiency * work_efficiency_percentage).toFixed(2) +"% of time";
            score_details.read_efficiency_score =  "Read "+(read_efficiency * read_efficiency_percentage).toFixed(2)+"% percentage of workflow updates on time in the last 30 days";
            score_details.status_rollback_score = "Achieved "+(status_no_rollback * status_rollback_percentage).toFixed(2)+"% of  "+sor_activity_type_name+" - "+sor_activity_status_name+" statuses without rollbacks";
            score_details.customer_exposure_score = "Exposure to "+(customer_score * customer_exposure_percentage).toFixed(2)+"% of the "+customer_asset_name+" workflows";
            score_details.industry_exposure_score = "Exposure to "+(industry_score * industry_exposure_percentage).toFixed(2)+"% of "+industry_name+" workflows";
            score_details.workflow_exposure_score = "Exposure to "+(workflow_score * workflow_exposure_percentage).toFixed(2)+"% of "+workflow_name+" workflows";

            //score_details.workflow_type_exposure_score = workflow_type_score * workflow_type_exposure_percentage;
            //score_details.workflow_category_exposure_score = workflow_category_score * workflow_category_exposure_percentage;
            score_details.overall_score = total_score;
            score_details.asset_id = request.target_asset_id;
            score_details.asset_name = request.target_asset_name?request.target_asset_name:"";
            score_details.operating_asset_id = request.target_operating_asset_id?request.target_operating_asset_id:0;
            score_details.operating_asset_name = request.target_operating_asset_name?request.target_operating_asset_name:"";

            score_details_array.push(score_details);

            logger.silly("************************************************************************************************");
            logger.info("******* Generated score for asset "+request.target_asset_id+" on workflow "+request.activity_id+" is "+total_score, { type: 'rm_bot', request, error: false });
            logger.silly("************************************************************************************************");


        }catch(err){
            console.log('Error ',err);
        }
        console.log("Return :: "+total_score);

        return[false, {"total_score":total_score, "rm_bot_scores":score_details_array}]
    }

    this.organizationListSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id
        );
        const queryString = util.getQueryString('ds_p1_organization_list_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
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


    this.assetSummarytransactionSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.target_asset_id,
            request.flag,
            request.summary_id
        );
        const queryString = util.getQueryString('ds_v1_1_asset_summary_transaction_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
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


   this.RMStatusChangeTrigger = async function (request) {

        try{

            let roleLinkedToStatus = 0;
            let statusDuration = 0;

            request.ai_bot_id = 1;
            request.ai_bot_status_id = 3;
            request.bot_mapping_inline_data = {};
            request.timeline_stream_type_id = 719;
            
            request.global_array.push({"REMOVE_LEAD":"REMOVING LEAD FROM WORKFLOW"});
            await self.activityListLeadUpdateV1(request, 0);
            
            request.global_array.push({"UNALLOCATE_WORKFLOW ":"MAKING THE WORKLOW UNALLOCATED "});
            await self.unallocatedWorkflowInsert(request);

            request.global_array.push({"RESOURCE_POOL_TRIGGER":"TRIGGER THE RESOURCE POOL"});
            await self.RMLoopInResoources(request);

        }catch(error){
            console.log("error :: "+error);
        }
        console.log('request '+JSON.stringify(request, null,2));
        return [false, {}];
    };

    this.assetListSelectAssetWorkforce = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.target_asset_id
        );

        var queryString = util.getQueryString('ds_v1_asset_list_select_asset_workforce', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    //console.log("DD :: "+JSON.stringify(data));
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };   

    this.assetTaskParticipatedCount = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.target_asset_id,
            request.flag,
            request.entity_id
        );

        var queryString = util.getQueryString('ds_v1_activity_status_change_transaction_select_lead_stats', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    //console.log("Response :: "+JSON.stringify(data, null, 2));
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    }; 

    this.assetTaskLeadedCount = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.target_asset_id,
            request.flag,
            request.entity_id
        );

        var queryString = util.getQueryString('ds_v1_activity_status_change_transaction_select_intime_stats', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    //console.log("Response :: "+JSON.stringify(data, null, 2));
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };  

    this.getActivityDetailsPromiseAsync = async function (request, activityId) {

        let responseData = [],
            error = true;
       
        var paramsArr;
        if (Number(activityId > 0)) {
            paramsArr = new Array(
                activityId,
                request.organization_id
            );
        } else {
            paramsArr = new Array(
                request.activity_id,
                request.organization_id
            );
        }
        const queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
        if (queryString !== '') {
        await db.executeQueryPromise(1, queryString, request)
            .then((data) => {
                
                responseData = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            });
        }
        return [error, responseData];
    }; 

    this.getAssetMonthlySummary = async function (request) {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.target_asset_id,
            request.operating_asset_id,
            request.organization_id,
            request.monthly_summary_id,
            util.getStartDayOfPrevMonth(),
        );

        const queryString = util.getQueryString('ds_p1_asset_monthly_summary_transaction_select_timeline', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
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

    this.activityListHistoryInsertAsync = async (request, updateTypeId) => {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            updateTypeId,
            request.datetime_log // server log date time
        );

        const queryString = util.getQueryString('ds_v1_activity_list_history_insert', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });            
        }
        return [error, responseData];
    };

    this.assetSummaryTransactionInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.monthly_summary_id,
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.inline_data,
            request.entity_date_1,
            request.entity_datetime_1,
            request.entity_tinyint_1,
            request.entity_bigint_1,
            request.entity_double_1,
            request.entity_decimal_1,
            request.entity_decimal_2,
            request.entity_decimal_3,
            request.entity_text_1,
            request.entity_text_2,
            request.location_latitude,
            request.location_longitude,
            request.location_gps_accuracy,
            request.location_gps_enabled,
            request.location_address,
            request.location_datetime,
            request.device_manufacturer_name,
            request.device_model_name,
            request.device_os_id,
            request.device_os_name,
            request.device_os_version,
            request.device_app_version,
            request.device_api_version,
            request.asset_id,
            request.message_unique_id || 0,
            request.log_retry || 0,
            request.log_offline || 0,
            util.getCurrentUTCTime(), // transaction_datetime
            util.getCurrentUTCTime() // log_datetime
        );

        const queryString = util.getQueryString("ds_v1_asset_summary_transaction_insert", paramsArr);

        if(request.asset_id === 0) {
            console.log('Not making db call when the asset_id is 0', request.asset_id );
            return[error = false, []];
        }
        else {
            if (queryString !== "") {
                await db
                    .executeQueryPromise(0, queryString, request)
                    .then(data => {
                        responseData = data;
                        error = false;
                    })
                    .catch(err => {
                        error = err;
                    });
            }
            return [error, responseData];
        }
      
    };   

    this.activityListLeadUpdate = async function (request, lead_asset_id) {
        let responseData = [],
            error = true;
        try{
        let paramsArr = new Array(
            request.activity_id,
            lead_asset_id,
            request.organization_id,
            null,
            request.flag || 0,
            request.asset_id,
            request.datetime_log
        );

        var queryString = util.getQueryString('ds_v1_1_activity_list_update_lead', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {

                    responseData = data;
                    error = false;

                    request.datetime_log = util.getCurrentUTCTime();
                    self.activityListHistoryInsertAsync(request, 15);
                    // timeline transaction insert
                    if(request.timeline_stream_type_id == 720 || request.timeline_stream_type_id == 721 || request.timeline_stream_type_id == 722){
                        let timelineCollection = {};
                        timelineCollection.content=data[0].existing_lead_operating_asset_first_name+" removed himself as Lead";
                        timelineCollection.subject=data[0].existing_lead_operating_asset_first_name+" removed himself as Lead";
                        timelineCollection.mail_body=data[0].existing_lead_operating_asset_first_name+" removed himself as Lead";
                        timelineCollection.attachments=[];
                        timelineCollection.asset_reference=[];
                        timelineCollection.activity_reference=[];
                        timelineCollection.rm_bot_scores=[];
                        request.activity_lead_timeline_collection = JSON.stringify(timelineCollection);

                    }else if(request.timeline_stream_type_id == 718){
                         request.activity_timeline_collection = request.activity_lead_timeline_collection||'{}';
                    }else if(data[0].existing_lead_asset_id > 0 && lead_asset_id == 0){
                        request.timeline_stream_type_id = 718;

                        let timelineCollection = {};
                        timelineCollection.content="Tony has Unassigned "+data[0].existing_lead_operating_asset_first_name+" as Lead";
                        timelineCollection.subject="Tony has Unaassigned "+data[0].existing_lead_operating_asset_first_name+" as Lead";
                        timelineCollection.mail_body="Tony has Unaassigned "+data[0].existing_lead_operating_asset_first_name+" as Lead";
                        timelineCollection.attachments=[];
                        timelineCollection.asset_reference=[];
                        timelineCollection.activity_reference=[];
                        timelineCollection.rm_bot_scores=[];
                        request.activity_lead_timeline_collection = JSON.stringify(timelineCollection);
                    }else if(data[0].existing_lead_asset_id > 0){
                        request.timeline_stream_type_id = 2403;

                    }else if(lead_asset_id > 0){
                        request.timeline_stream_type_id = 2402;
                    }

                    if(data[0].existing_lead_asset_id > 0){
                        let leadRequest = Object.assign({},request);
                        leadRequest.asset_id = data[0].existing_lead_asset_id;

                        let assetData = await self.getAssetDetailsAsync(leadRequest);
                        if(assetData.length > 0){
                            request.lead_asset_type_id = data[0].activity_lead_asset_type_id;
                            request.res_account_id = request.account_id;
                            request.res_workforce_id = request.workforce_id;
                            request.res_asset_type_id = data[0].activity_lead_asset_type_id;
                            request.res_asset_id = data[0].activity_lead_asset_id;
                            request.res_asset_category_id = data[0].activity_lead_asset_type_category_id;
                            request.target_asset_id = data[0].activity_lead_asset_id;
                            request.target_asset_name = data[0].activity_lead_asset_first_name;
                            request.target_operating_asset_id = data[0].activity_lead_operating_asset_id;
                            request.target_operating_asset_name = data[0].activity_lead_operating_asset_first_name;
                            self.RMResourceAvailabilityTrigger(request);
                        }else{
                            logger.debug("Existing Lead Asset doesn't exist ", { type: "rm_bot", request_body: leadRequest });
                        }
                    }else{
                        logger.debug("No Existing Lead, hence no RMBot Triggered ", { type: "rm_bot", request_body: leadRequest });
                    }

                    request.track_gps_datetime = util.getCurrentUTCTime();
                    request.message_unique_id = util.getMessageUniqueId(request.asset_id);
                    
                    //console.log("activityListLeadUpdate :: "+JSON.stringify(request,null,2));
                    if(request.timeline_stream_type_id > 0)
                    activityCommonService.asyncActivityTimelineTransactionInsert(request, {}, Number(request.timeline_stream_type_id)); 

                    //calculate Stats
                    /*
                    let leadRequest = Object.assign({},request);
                    if(data[0].existing_lead_asset_id > 0){
                        leadRequest.asset_id = lead_asset_id;
                        self.calculateAssetSummary(leadRequest, data[0].existing_lead_asset_id);                
                    } */

                })
                .catch((err) => {
                    error = err;
                    console.log("error :: "+error);
                });
        }

        var queryString = util.getQueryString('ds_v1_1_activity_asset_mapping_update_lead', paramsArr);
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
        }catch(error){
            console.log("error :: "+error);
        } 

        return [error, responseData];
    };

    this.getLeadAssetWorkload = async (request) =>{
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,            
            request.asset_id,
            request.flag || 0,
            request.start_datetime, //Monday
            request.end_datetime, //Sunday
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_activity_list_select_asset_lead_tasks', paramsArr);

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
        return [error, responseData];
    };


    this.getAssetDetailsAsync = async function (request) {
        let assetData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.asset_id
        );
        const queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    assetData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, assetData];
    };

    this.triggerAIOnStatusChange = async function (request) {
        //request.proof.request_body = JSON.stringify(request,null,2);
        let data = [],
            error = true;
        try{

            let ai_bot_transaction_id = 0;
            request.ai_trace_insert_location = "triggerAIOnStatusChange, triggerAIOnStatusChange execution started";
            let [errAI, responseDataAI] = await self.AIEventTransactionInsert(request);
            if(responseDataAI.length > 0){
                request.ai_bot_transaction_id = responseDataAI[0].ai_bot_transaction_id;
            }

            let [err, response] = await self.workforceActivityStatusMappingSelectStatusId(request);
            //request.proof.i1_1_triggerAIOnStatusChange_workforceActivityStatusMappingSelectStatusId_response_length= response.length;
            //logger.info("triggerAIOnStatusChange :: "+JSON.stringify(request,null,2));
            if(response.length > 0){
                // request.bot_mapping_inline_data = request.proof;
                // self.AIEventTransactionInsert(request)            
                request.duration_in_minutes = response[0].activity_status_duration;
                request.global_array.push({"organization_ai_bot_enabled":response[0].organization_ai_bot_enabled});
                if(response[0].organization_ai_bot_enabled == 1){
                    request.global_array.push({"flag_trigger_resource_manager":request.flag_trigger_resource_manager});
                    if(request.flag_trigger_resource_manager == 1){

                        logger.info("AI TRIGGER FLAG RECEIVED FROM ALTER STATUS BOT");
                        let [formEditErr, formEditData] = await self.getFormEdidtedTimelineDetails(request);

                            request.global_array.push({"formEditData_length":formEditData.length});
                            if(formEditData.length == 0){
 
                                request.global_array.push({"activity_type_flag_persist_role":response[0].activity_type_flag_persist_role});
                                //request.activity_type_flag_persist_role = response[0].activity_type_flag_persist_role;
                                if(request.activity_type_flag_persist_role == 1){
                                    logger.info("PERSIST ROLE FLAG SET FOR THIS STATUS");
                                    
                                    let objReq = Object.assign({},request);
                                    objReq.asset_type_id = response[0].asset_type_id;
                                    let [err, roleAssetData] = await self.getAssetForAssetTypeID(objReq);
  
                                    request.global_array.push({"getAssetForAssetTypeID_roleAssetData_length":roleAssetData.length});
                                    if(roleAssetData.length > 0){
                                        request.global_array.push({"PARTICIPANT_EXISTS":"PARTICIPANT EXISTS, HENCE ADDING AS LEAD, HITTING assignResourceAsLead "+roleAssetData[0].asset_id+" : "+roleAssetData[0].operating_asset_first_name});
    
                                        logger.info("PARTICIPANT EXISTS, HENCE ADDING AS LEAD ", {type:"rm_bot",request_body:objReq});
                                        let timelineCollection = {};
                                        timelineCollection.content="Tony has assigned "+roleAssetData[0].operating_asset_first_name+" as Lead";
                                        timelineCollection.subject="Tony has assigned "+roleAssetData[0].operating_asset_first_name+" as Lead";
                                        timelineCollection.mail_body="Tony has assigned "+roleAssetData[0].operating_asset_first_name+" as Lead";
                                        timelineCollection.attachments=[];
                                        timelineCollection.asset_reference=[];
                                        timelineCollection.activity_reference=[];
                                        timelineCollection.rm_bot_scores={};
                                        request.activity_lead_timeline_collection = JSON.stringify(timelineCollection);
                                        request.timeline_stream_type_id = 718;

                                        await self.assignResourceAsLead(request, roleAssetData[0].asset_id);

                                    }else{
                                        logger.info("NO PARTICIPANT EXISTS WITH THIS ROLE ON THE WORKFLOW : HENCE EXECUTING RMStatusChangeTrigger");
                                        request.global_array.push({"NO_PARTICIPANT":"NO PARTICIPANT EXISTS WITH THIS ROLE ON THE WORKFLOW : HENCE EXECUTING RMStatusChangeTrigger"});
                                        request.ai_trace_insert_location = "NO_PARTICIPANT WITH THIS ROLE ON THE WORKFLOW : HENCE EXECUTING RMStatusChangeTrigger";
                                        await self.RMStatusChangeTrigger(request);
                                    }
                                }else{
                                    logger.info("NO PERSIST ROLE FLAG SET: HENCE EXECUTING RMStatusChangeTrigger");
                                    request.global_array.push({"NO_PERSIST_ROLE_FLAG_SET": "NO PERSIST ROLE FLAG SET, HENCE EXECUTING RMStatusChangeTrigger"});
                                    request.ai_trace_insert_location = "NO_PERSIST_ROLE_FLAG_SET, NO PERSIST ROLE FLAG SET, HENCE EXECUTING RMStatusChangeTrigger";
                                    await self.RMStatusChangeTrigger(request);
                                }
                            }else{
                                logger.info("FORM RESUBMISSION, HENCE NO RM BOT TRIGGER");
                                request.global_array.push({"FORM_RESUBMISSION": "FORM RESUBMISSION, HENCE NO RM BOT TRIGGER"});
                                request.ai_trace_insert_location = "FORM_RESUBMISSION, FORM RESUBMISSION, HENCE NO RM BOT TRIGGER";
                                self.AIEventTransactionInsert(request)                            
                            }
                    }else{
                        logger.info("AI TRIGGER FLAG NOT RECEIVED FROM ALTER STATUS BOT ");
                        request.global_array.push({"AI_TRIGGER_FLAG":"AI TRIGGER FLAG NOT RECEIVED FROM ALTER STATUS BOT"});
                        request.ai_trace_insert_location = "AI_TRIGGER_FLAG, AI TRIGGER FLAG NOT RECEIVED FROM ALTER STATUS BOT";
                        self.AIEventTransactionInsert(request)                    
                    }
                }else{
                    request.global_array.push({"ORGANIZATION_SETTING":"THIS ORGANIZATION WITH ID "+request.organization_id+" IS NOT ENABLED WITH AI, END OF FLOW"});
                    request.ai_trace_insert_location = "ORGANIZATION_SETTING, THIS ORGANIZATION WITH ID";
                    self.AIEventTransactionInsert(request)                
                    logger.info("THIS ORGANIZATION WITH ID "+request.organization_id+" IS NOT ENABLED WITH AI "+request.organization_id+" IS NOT ENABLED WITH AI, END OF FLOW");
                }
            }else{
                request.global_array.push({"STATUS_DOESNT_EXIST":"STATUS DOESNT EXIST, HENCE NO AI"});
                request.ai_trace_insert_location = "STATUS_DOESNT_EXIST, STATUS DOESNT EXIST, HENCE NO AI";
                self.AIEventTransactionInsert(request);
                logger.info("STATUS DOESNT EXIST, HENCE NO AI ");
            }
        }catch(e){
            request.global_array.push({"Exception triggerAIOnStatusChange":e});
            logger.info("Exception occured in  triggerAIOnStatusChange :: "+e);
            request.ai_trace_insert_location = "Exception occured in  triggerAIOnStatusChange";
            self.AIEventTransactionInsert(request);
        }
        return [error, data];
    };

    this.getFormEdidtedTimelineDetails = async function (request) {
        let formEditData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.trigger_form_id
        );
        const queryString = util.getQueryString('ds_v1_activity_timeline_transaction_select_field_edit', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    formEditData = data;
                    error = false;
                    request.global_array.push({"getFormEdidtedTimelineDetails":formEditData.length+" :: "+queryString});
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, formEditData];
    };

    this.getAvailableResourcePool = async function (request) {
        let assetData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.asset_type_id || 0,
            util.getCurrentUTCTime(),
            request.current_lead_asset_id || 0,
            0,
            500
        );
        const queryString = util.getQueryString('ds_v1_asset_list_select_resource_pool', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    assetData = data;
                    error = false;
                    request.global_array.push({"getAvailableResourcePool":assetData.length+" :: "+queryString});
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, assetData];
    };

    this.calculateAssetNewSummary = async function(request){

        let read_efficiency = 0;
        let work_efficiency = 0;
        let status_no_rollback_efficiency = 0;
        let customer_exposure = 0;
        let industry_exposure = 0;
        let workflow_exposure = 0;
        let workflow_type_exposure = 0;
        let workflow_category_exposure = 0;

        let industry_score = 0;
        let customer_score = 0;
        let workflow_score = 0;
        let workflow_type_score = 0;
        let workflow_category_score = 0;
        let status_no_rollback_score = 0;

        let idLeadAsset = request.lead_asset_id;

        let rmInlineData = {};
        rmInlineData.read_efficiency="";
        rmInlineData.work_efficiency={};
        rmInlineData.status_no_rollback={};
        rmInlineData.customer_exposure={}
        rmInlineData.industry_exposure={};
        rmInlineData.workflow_exposure={};

        console.log("rmInlineData :: ",rmInlineData);

        let [err, data] = await self.getActivityDetailsPromiseAsync(request, request.activity_id);

        if(data.length == 0){
            console.log("No Activities exists, hence total_score = -1");
            return[false, {"total_score":-1, "rm_bot_scores":[]}];
        }

        let reqObj = Object.assign({},request);
        reqObj.target_asset_id = idLeadAsset;
        request.target_asset_id = idLeadAsset;
        reqObj.summary_id = 6;
        reqObj.flag = 0;
        let inlineData = {};
        /*
            let [summaryErr, summaryData] = await self.assetSummarytransactionSelect(reqObj);
            console.log("summary_data :: "+JSON.stringify(summaryData));
            if(summaryData.length == 1){
                rmInlineData = summaryData[0].data_entity_inline?JSON.parse(summaryData[0].data_entity_inline):rmInlineData;
            }
        */
        console.log("Activity activity_type_id***** :: "+data[0].activity_type_id);
        console.log("Activity activity_status_id*** :: "+data[0].activity_status_id);
        console.log("Activity industry_id********** :: "+data[0].industry_id);
        console.log("Activity customer_asset_id**** :: "+data[0].customer_asset_id);

        request.flag = 1;
        request.entity_id = data[0].activity_type_id;
        let [error1, activityTypeStatusCount] = await self.assetTaskParticipatedCount(request);
        let [error2, activityTypeIntimeStatusCount] = await self.assetTaskLeadedCount(request);
        let activityTypeIntimeCount = 0;
        let activityTypeCount = 0;
        
        try{
            if(activityTypeStatusCount.length > 0)
            {
                if(activityTypeIntimeStatusCount.length > 0){
                    if(Number(activityTypeStatusCount[0].activity_type_count) > 0){
                        workflow_score = (Number(activityTypeIntimeStatusCount[0].activity_type_count)/Number(activityTypeStatusCount[0].activity_type_count)).toFixed(2);
                        activityTypeIntimeCount = Number(activityTypeIntimeStatusCount[0].activity_type_count);
                        activityTypeCount = Number(activityTypeStatusCount[0].activity_type_count);
                    }else{
                        workflow_score = 0;
                        activityTypeCount = Number(activityTypeStatusCount[0].activity_type_count);
                        activityTypeIntimeCount = Number(activityTypeIntimeStatusCount[0].activity_type_count);                        
                    }
                }else{
                    workflow_score = 0;
                    activityTypeCount = Number(activityTypeStatusCount[0].activity_type_count);
                    activityTypeIntimeCount = 0;
                }
            }else{
                workflow_score = 0;
            }
            
            console.log("rmInlineData.workflow_exposure :: "+JSON.stringify(rmInlineData));
            rmInlineData.workflow_exposure[data[0].activity_type_id] = {"intime":activityTypeIntimeCount,"total":activityTypeCount, "workflow_id":data[0].activity_type_id,"workflow_name":data[0].activity_type_name,"workflow_score":workflow_score};
            //JSON.parse(rmInlineData.workflow_exposure).dat=workflow_score;
        }catch(e){
            console.log(e);
        }

        request.flag = 4;
        request.entity_id = data[0].industry_id;
        let [error7, industryStatusCount] = await self.assetTaskParticipatedCount(request);
        let [error8, industryIntimeStatusCount] = await self.assetTaskLeadedCount(request);
        let industryIntimeCount = 0;
        let industryCount = 0;
        let industryJson = {};
        try{
            if(industryStatusCount.length > 0)
            {
                if(industryIntimeStatusCount.length > 0){
                    if(Number(industryStatusCount[0].industry_count) > 0){
                        industry_score = (Number(industryIntimeStatusCount[0].industry_count)/Number(industryStatusCount[0].industry_count)).toFixed(2);
                        industryIntimeCount = Number(industryIntimeStatusCount[0].industry_count);
                        industryCount = Number(industryStatusCount[0].industry_count); 
                    }else{
                        industry_score = 0;
                        industryCount = Number(industryStatusCount[0].industry_count);  
                        industryIntimeCount = 0;                          
                    }       
                }else{
                    industry_score = 0;
                    industryCount = Number(industryStatusCount[0].industry_count);  
                    industryIntimeCount = 0;    
                }
            }else{
                industry_score = 0;
            }

            rmInlineData.industry_exposure[data[0].industry_id]={"intime":industryIntimeCount,"total":industryCount, "industry_id":data[0].industry_id, "industry_name":data[0].industry_name, "industry_score":industry_score};
        }catch(e){
            console.log(e);
        }

        request.flag = 5;
        request.entity_id = data[0].customer_asset_id;
        let [error9, customerStatusCount] = await self.assetTaskParticipatedCount(request);
        let [error10, customerIntimeStatusCount] = await self.assetTaskLeadedCount(request);
        let customerIntimeCount = 0;
        let customerCount = 0;
        let customerJson = {};
        try{
            if(customerStatusCount.length > 0)
            {
                if(customerIntimeStatusCount.length > 0){
                    if(Number(customerStatusCount[0].customer_asset_count) > 0){
                        customer_score = (Number(customerIntimeStatusCount[0].customer_asset_count)/Number(customerStatusCount[0].customer_asset_count)).toFixed(2);
                        customerIntimeCount = Number(customerIntimeStatusCount[0].customer_asset_count);
                        customerCount = Number(customerStatusCount[0].customer_asset_count); 
                    }else{
                        customer_score = 0;
                        customerCount = Number(customerStatusCount[0].customer_asset_count);  
                        customerIntimeCount = Number(customerIntimeStatusCount[0].customer_asset_count);
                    }             
                }else{
                    customer_score = 0;
                    customerCount = Number(customerStatusCount[0].customer_asset_count);  
                    customerIntimeCount = 0;
                }
            }else{
                customer_score = 0;
            }
            rmInlineData.customer_exposure[data[0].customer_asset_id]={"intime":customerIntimeCount,"total":customerCount, "customer_asset_id":data[0].customer_asset_id, "customer_asset_name":data[0].customer_asset_first_name, "customer_score":customer_score};
        }catch(e){
            console.log(e);
        }
        //read efficiency
        //rollback
        request.flag = 6;
        request.entity_id = request.target_asset_id;
        let [error11, totalUpdateCount] = await self.assetTaskParticipatedCount(request);
        let [error12, totalIntimeUpdateCount] = await self.assetTaskLeadedCount(request);
        let totalUpdatesIntimeCount = 0;
        let totalUpdatesCount = 0;
        let totalUpdatesJson = {};

        try{
            if(totalUpdateCount.length > 0)
            {
                if(totalIntimeUpdateCount.length > 0){
                    if(Number(totalUpdateCount[0].update_count) > 0){
                        read_efficiency = (Number(totalIntimeUpdateCount[0].update_count)/Number(totalUpdateCount[0].update_count)).toFixed(2);
                        totalUpdatesIntimeCount = Number(totalIntimeUpdateCount[0].update_count);
                        totalUpdatesCount = Number(totalUpdateCount[0].update_count);
                    }else{
                        read_efficiency = 0;
                        totalUpdatesCount = Number(totalUpdateCount[0].update_count);  
                        totalUpdatesIntimeCount = Number(totalIntimeUpdateCount[0].update_count);
                    }            
                }else{
                    read_efficiency = 0;
                    totalUpdatesCount = Number(totalUpdateCount[0].update_count);  
                    totalUpdatesIntimeCount = 0;
                }
            }else{
                read_efficiency = 0;
            }
            console.log("totalUpdatesIntimeCount : "+totalUpdatesIntimeCount+" totalUpdatesCount"+totalUpdatesCount+" read_efficiency :"+read_efficiency);
            rmInlineData.read_efficiency=read_efficiency?read_efficiency:0;
        }catch(e){
            console.log(e);
        }

        request.flag = 7;
        
        request.entity_id = data[0].activity_status_id;
        let [error13, totalStatusCount] = await self.assetTaskParticipatedCount(request);
        let [error14, totalIntimeStatusCount] = await self.assetTaskLeadedCount(request);
        let totalIntimeCount = 0;
        let totalCount = 0;
        let totalJson = {};
        try{
            if(totalStatusCount.length > 0)
            {
                if(totalIntimeStatusCount.length > 0){
                    if(Number(totalStatusCount[0].activity_count) > 0){
                        work_efficiency = (Number(totalIntimeStatusCount[0].activity_count)/Number(totalStatusCount[0].activity_count)).toFixed(2);
                        totalIntimeCount = Number(totalIntimeStatusCount[0].activity_count);
                        totalCount = Number(totalStatusCount[0].activity_count);
                    }else{
                        work_efficiency = 0;
                        totalIntimeCount = Number(totalIntimeStatusCount[0].activity_count);
                        totalCount = Number(totalStatusCount[0].activity_count);                        
                    }               
                }else{
                    work_efficiency = 0;
                    totalIntimeCount = 0;
                    totalCount = Number(totalStatusCount[0].activity_count);  
                }
            }else{
                work_efficiency = 0;
            }
            rmInlineData.work_efficiency[data[0].activity_status_id]={"intime":totalIntimeCount,"total":totalCount, "activity_status_id":data[0].activity_status_id, "activity_status_name":data[0].activity_status_name, "activity_type_id":data[0].activity_type_id, "activity_type_name":data[0].activity_type_name, "work_efficiency":work_efficiency};;
        }catch(e){
            console.log(e);
        }

        request.flag = 8;
        
        request.entity_id = data[0].activity_status_id;
        let [error15, totalStatusCount1] = await self.assetTaskParticipatedCount(request);
        let [error16, totalRollbackStatusCount] = await self.assetTaskLeadedCount(request);
        let rollbackCount = 0;
        let overallCount = 0;
        let totalNoRollbackCount = 0;

        try{
            if(totalStatusCount1.length > 0)
            {
                if(totalRollbackStatusCount.length > 0){
                    if(Number(totalStatusCount1[0].activity_status_count) > 0){
                        status_no_rollback_efficiency = ((Number(totalStatusCount1[0].activity_status_count) - Number(totalRollbackStatusCount[0].status_rollback_count))/Number(totalStatusCount1[0].activity_status_count)).toFixed(2);
                        rollbackCount = Number(totalRollbackStatusCount[0].status_rollback_count);
                        overallCount = Number(totalStatusCount1[0].activity_status_count);      
                        totalNoRollbackCount =  Number(totalStatusCount1[0].activity_status_count) - Number(totalRollbackStatusCount[0].status_rollback_count);       
                    }else{
                        overallCount = Number(totalStatusCount1[0].activity_status_count);  
                        totalNoRollbackCount =  Number(totalStatusCount1[0].activity_status_count) - Number(totalRollbackStatusCount[0].status_rollback_count);       
                        overallCount = Number(totalStatusCount1[0].activity_status_count);
                        status_no_rollback_efficiency = 0;                        
                    }

                }else{
                    totalNoRollbackCount =  Number(totalStatusCount1[0].activity_status_count);
                    overallCount = Number(totalStatusCount1[0].activity_status_count);
                    status_no_rollback_efficiency = 1;
                }
            }else{
                status_no_rollback_efficiency = 0;
            }
            logger.info("status_no_rollback_efficiency"+status_no_rollback_efficiency+" :: rollbackCount"+rollbackCount+" :: totalNoRollbackCount"+totalNoRollbackCount)
            rmInlineData.status_no_rollback[data[0].activity_status_id]={"intime":totalNoRollbackCount,"total":overallCount, "activity_status_id":data[0].activity_status_id, "activity_status_name":data[0].activity_status_name, "activity_type_id":data[0].activity_type_id, "activity_type_name":data[0].activity_type_name, "status_no_rollback_efficiency":status_no_rollback_efficiency};;
        }catch(e){
            console.log(e);
        }

        console.log("rmInlineData ",rmInlineData);
        let objReq1 = Object.assign({}, request);
        objReq1.inline_data = JSON.stringify(rmInlineData);
        objReq1.asset_id = request.lead_asset_id;
        objReq1.monthly_summary_id = 6;
        self.assetSummaryTransactionInsert(objReq1);
        return rmInlineData;
    }

    this.activityListLeadUpdateV1 = async function (request, lead_asset_id) {
        let responseData = [],
            error = true;
        if(!request.hasOwnProperty("global_array"))
            request.global_array=[];

        try{
            let paramsArr = new Array(
                request.activity_id,
                lead_asset_id,
                request.organization_id,
                null,
                request.flag || 0,
                request.asset_id,
                util.getCurrentUTCTime()
            );

            var queryString = util.getQueryString('ds_v1_1_activity_list_update_lead', paramsArr);
            if (queryString !== '') {
                await db.executeQueryPromise(0, queryString, request)
                    .then(async (data) => {

                        responseData = data;
                        error = false;
                        request.global_array.push({"UPDATING_LEAD_IN_ACTIVITY_LIST":queryString});
                        logger.info();
                        request.datetime_log = util.getCurrentUTCTime();
                        self.activityListHistoryInsertAsync(request, 15);

                        request.global_array.push({"STREAM_TYPE_Id":request.timeline_stream_type_id});
                        logger.info();
                        if(Number(request.timeline_stream_type_id) == 718){
                            request.lead_asset_id = lead_asset_id;
                            await self.activityAssetMappingUpdateLead(request);

                            let objR = Object.assign({},request);
                            objR.target_asset_id = lead_asset_id;
                            objR.target_lead_asset_id = lead_asset_id;
                            logger.info("ROLLBACK:: LOGASSET "+request.asset_id+" PUSH_STATUS "+data[0].push_status);

                            if(data[0].push_status == 0){

                                objR.message = "Tony has assigned you as lead"; 
                                util.sendCustomPushNotification(objR,data); 

                                /*
                                if(Number(request.asset_id) === 100){
                                    objR.message = "Tony has assigned you as lead"; 
                                    util.sendCustomPushNotification(objR,data); 
                                }
                                if(Number(request.asset_id) !== 100){
                                    objR.message = " has assigned you as lead";  
                                    util.sendCustomPushNotification(objR,data); 
                                }
                               */
                            } 
                            self.assetListUpdatePoolEntry(objR);
                            self.calculateAssetNewSummary(objR);

                            if(data[0].existing_lead_asset_id > 0 && lead_asset_id != data[0].existing_lead_asset_id){
                                request.target_lead_asset_id = data[0].existing_lead_asset_id;
                                request.target_asset_id = data[0].existing_lead_asset_id;
                                self.calculateAssetNewSummary(request);
                                await self.assetListUpdatePoolEntry(request);
                            }

                            request.rm_flag = 2; 
                            request.is_lead_enabled = lead_asset_id; 
                            self.activityListUpdateRMFlags(request);

                            request.activity_timeline_collection = request.activity_lead_timeline_collection||'{}';
                        }

                        logger.info("EXISTING LEAD DATA"+JSON.stringify(data));
                        request.global_array.push({"EXISTING_LEAD_DATA":JSON.stringify(data)});

                        if(Number(request.timeline_stream_type_id) == 719){ 
                            request.global_array.push({"existing_lead_asset_id":data[0].existing_lead_asset_id});
                            logger.info("existing_lead_asset_id :: "+data[0].existing_lead_asset_id);

                            if(data[0].existing_lead_asset_id > 0){
                                request.global_array.push({"new_lead_asset_id":lead_asset_id});
                                logger.info("new_lead_asset_id:: "+lead_asset_id);
                                if(Number(lead_asset_id) == 0){

                                    logger.info("LEAD_UNASSIGNMENT"+request.lead_asset_id);;
                                    let timelineCollection = {};
                                    timelineCollection.content="Tony has Unassigned "+data[0].existing_lead_operating_asset_first_name+" as Lead";
                                    timelineCollection.subject="Tony has Unaassigned "+data[0].existing_lead_operating_asset_first_name+" as Lead";
                                    timelineCollection.mail_body="Tony has Unaassigned "+data[0].existing_lead_operating_asset_first_name+" as Lead";
                                    timelineCollection.attachments=[];
                                    timelineCollection.asset_reference=[];
                                    timelineCollection.activity_reference=[];
                                    timelineCollection.rm_bot_scores=[];
                                    request.activity_lead_timeline_collection = JSON.stringify(timelineCollection);

                                }else{
                                    request.global_array.push({"NO_LEAD_UNASSIGNMENT":lead_asset_id});
                                }
                                //request.target_lead_asset_id = data[0].existing_lead_asset_id;
                                let ObjReq = Object.assign({}, request);
                                ObjReq.lead_asset_id = 0;
                                ObjReq.target_lead_asset_id = data[0].existing_lead_asset_id;
                                self.activityAssetMappingUpdateLead(ObjReq);
                                self.assetListUpdatePoolEntry(ObjReq);
                               
                                request.rm_flag = 2; 
                                request.is_lead_enabled = 0; 
                                self.activityListUpdateRMFlags(request);

                                request.global_array.push({"calculateAssetNewSummary":""});
                                logger.info();
                                self.calculateAssetNewSummary(ObjReq);

                            }else{
                                request.global_array.push({"NO_LEAD_UNASSIGNMENT":"Exising Lead Asset Id is not greaterthan zero, hence no unassinment"});
                                logger.debug("Exising Lead Asset Id is not greaterthan zero, hence no unassinment ", { type: "rm_bot", request_body: request });
                            }
                        }  

                        if(Number(request.timeline_stream_type_id) == 326 || Number(request.timeline_stream_type_id) == 327){
                            request.lead_asset_id = lead_asset_id;
                            await self.activityAssetMappingUpdateLead(request);
                        }

                        request.track_gps_datetime = util.getCurrentUTCTime();
                        request.message_unique_id = util.getMessageUniqueId(request.asset_id);
                        
                        console.log("activityListLeadUpdate :: ",request.activity_lead_timeline_collection);
                        
                        if(Number(request.timeline_stream_type_id) > 0){
                            //request.global_array.push({"asyncActivityTimelineTransactionInsert":JSON.stringify(request,null,2)});
                            activityCommonService.asyncActivityTimelineTransactionInsert(request, {}, Number(request.timeline_stream_type_id)); 
                        }
                    });
                }

            }catch(error){
                request.global_array.push({"Error : activityListLeadUpdate":error});
                logger.error("Exception activityListLeadUpdate :: ", { type: "rm_bot", request, error: error });
            } 
        return [error, responseData];  
    }

    this.assetListUpdatePoolEntry = async function (request) {
        let responseData = [],
        error = true;
        try{
            let paramsArr = new Array(
                request.organization_id,
                request.target_lead_asset_id,
                util.getCurrentUTCTime()
            );

            var queryString = util.getQueryString('ds_v1_asset_list_update_pool_entry', paramsArr);
            request.global_array.push({"assetListUpdatePoolEntry":queryString});
            if (queryString !== '') {
                await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {

                responseData = data;
                error = false;
                });
            }
        }catch(error){
            console.log("error :: "+error);
        }    
    }      

    this.activityAssetMappingUpdateLead = async function (request) {
        let responseData = [],
        error = true;

        try{
                let paramsArr = new Array(
                    request.activity_id,
                    request.lead_asset_id,
                    request.organization_id,
                    null,
                    request.flag || 0,
                    request.asset_id,
                    request.datetime_log
                );

                var queryString = util.getQueryString('ds_v1_1_activity_asset_mapping_update_lead', paramsArr);
                request.global_array.push({"activityAssetMappingUpdateLead":queryString});
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
            }catch(error){
                console.log("error :: "+error);
            }    
    } 

    //Get the asset for a given asset_type_id(ROLE) - RM
    this.getAssetForAssetTypeID = async (request) =>{
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.asset_type_id,
            request.organization_id
        );
        const queryString = util.getQueryString('ds_p1_1_activity_asset_mapping_select_role_participant', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    request.global_array.push({"getAssetForAssetTypeID":queryString});
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    this.getPreviousActivityStatus = async function (request){
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.current_activity_status_id
        );
        const queryString = util.getQueryString('ds_v1_activity_status_change_transaction_select_previous_status', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    request.global_array.push({"getPreviousActivityStatus":queryString})
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    }; 

    this.activityListUpdateRMFlags = async function (request) {
        let responseData = [],
        error = true;

        try{
            let paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                request.is_status_rollback || 0,
                request.is_lead_enabled || 0,
                request.rm_flag,  // 1 - status rollback, 2 = lead enabled
                request.asset_id,
                request.datetime_log
            );

            var queryString = util.getQueryString('ds_v1_activity_list_update_rm_flags', paramsArr);
            request.global_array.push({"activityListUpdateRMFlags":queryString});
            if (queryString !== '') {
                await db.executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                        request.global_array.push({"activityListUpdateRMFlags":queryString+" : "+data.length})
                    })
                    .catch((err) => {
                        error = err;
                    });
            } 
        }catch(error){
            console.log("error :: "+error);
        }   
        return [error, responseData]; 
    }   


    this.getAIBotTransaction = async function (request) {
        let responseData = [],
        error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.ai_bot_transaction_id
        );

        const queryString = util.getQueryString('ds_v1_activity_ai_bot_transaction_select', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    request.global_array.push({"getAIBotTransaction":"LENGTH :: "+responseData.length+" : "+queryString});
                })
                .catch((err) => {
                    error = err;
                });            
        }

        return [error, responseData];
    }  

    this.assetListUpdateLeadWorkflow = async function (request) {
        let responseData = [],
        error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
            request.target_workflow_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_asset_list_update_lead_workflow', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    request.global_array.push({"assetListUpdateLeadWorkflow":"LENGTH :: "+responseData[0].query_status+" : "+queryString});
                })
                .catch((err) => {
                    error = err;
                });            
        }

        return [error, responseData];
    }  

    this.getUnallocatedWorkflowsOfAssetType = async function (request) {

        let responseData = {"data":[]},
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.lead_asset_type_id,
            request.end_due_datetime || '1970-01-01 00:00:00',
            request.due_date_flag || 1,
            request.page_start||0,
            request.page_limit||500
        );

        const queryString = util.getQueryString('ds_v1_1_activity_ai_bot_mapping_select_worklows_role', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData.data = data;
                    error = false;
                    }
                )   
            }

        return [error, responseData];
    }  

    this.getStatusByStatusId = async function (request) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.target_activity_status_id
        );
        let queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select_id', paramsArr);
        if (queryString != '') {
            return await db.executeQueryPromise(1, queryString, request);
        }
    }

    this.getSuitableUnAvailableResource = async function (request) {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.asset_type_id,
            util.getCurrentUTCTime(),
            request.page_start||0,
            request.page_limit||500
        );

        const queryString = util.getQueryString('ds_v1_asset_list_select_suitable_unavail_resources', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    }
                )   
            }

        return [error, responseData];
    }     

    this.sendPushtoSuitableUnAvailableResources = async function(request){
        let error = false,
            statusData = [], assetData = [];

       statusData = await self.getStatusByStatusId(request);

       if(statusData.length > 0){
            if(statusData[0].asset_type_id > 0){
                request.asset_type_id = statusData[0].asset_type_id;
                request.page_start = 0;
                request.page_limit = 500;
                [error, assetData] = self.getSuitableUnAvailableResource(request);
                for(let i = 0; i < assetData.length; i++){
                    request.target_asset_id = assetData[i].asset_id;
                    request.asset_push_arn = assetData[i].asset_push_arn;
                    util.sendPushToAsset(request);
                }
            }
       }
    }

}

module.exports = RMBotService;