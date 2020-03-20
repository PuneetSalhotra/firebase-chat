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

    const activityCommonService = objectCollection.activityCommonService;

    this.alterWorkflowLead = async function(request){

 		let [err, data] = await self.getActivityDetailsPromiseAsync(request, request.activity_id);

        if(data.length == 0){
            console.log("No Activities exists, hence total_score = -1");
            return[true, {"Activity doesnt exist":""}];
        }else{
			console.log("alterWorkflowLead :: else :: ",data[0].activity_status_id);
			let reqObj =  Object.assign({}, request);
			reqObj.activity_status_id = data[0].activity_status_id;
			reqObj.activity_status_type_id = data[0].activity_status_type_id;
			//console.log(JSON.stringify(reqObj,null,2));
			self.RMStatusChangeTrigger(reqObj);
        }
    	return [false,{}];
    }

    this.RMOnAvailabilityOFAResource = async function (request) {

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
                .then((data) => {
                    responseData = data;
                    error = false;
                    request.global_array.push({"RMOnAvailabilityOFAResource":"LENGTH :: "+responseData.length+" : "+queryString});
                })
                .catch((err) => {
                    error = err;
                });            
        }

        return [error, responseData];
    }

    this.unallocatedWorkflowInsert = async function (request) {

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
                    request.global_array.push({"unallocatedWorkflowInsert":queryString})
                })
                .catch((err) => {
                    error = err;
                });            
        }

        return [error, responseData];
    } 

    this.AIEventTransactionInsert = async function (request) {

        let paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.ai_bot_id,
            request.ai_bot_status_id,
            JSON.stringify(request.global_array),
            request.bot_id,
            request.bot_operation_id,
            util.getCurrentUTCTime()
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

    this.RMUnoccupiedResources = async function (request) {

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_type_id,
            request.existing_lead_asset_id || -1,
            request.flag,
            util.getCurrentUTCTime(),
            request.page_start,
            request.page_limit
        );

        const queryString = util.getQueryString('ds_p1_1_asset_list_select_role_flag', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    request.global_array.push({"RMUnoccupiedResources":queryString})
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
        let self = this;
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
        request.global_array.push({"RESOURCES_IN_POOL":assetData.length});
        if(assetData.length == 0){
            request.global_array.push({"END_OF_FLOW":"NO RESOURCES IN THE POOL, HENCE END OF FLOW"});
            self.AIEventTransactionInsert(request);
            return "";
        }

        assetData.forEach(async function (rowData, index) {
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

            request.global_array.push({"RETRIEVING_WORKFLOWS_BASED_ROLE_OF_ASSET": rowData.asset_id+" ASSET TYPE "+rowData.asset_type_id});

            [err, workflowData] = await self.RMOnAvailabilityOFAResource(request);
            //request.proof.i16__RMLoopInResoources_RMOnAvailabilityOFAResource = workflowData.length;
            //request.global_array.push({"WORK":workflowData.length});
            //request.bot_mapping_inline_data = request.proof;
            //self.AIEventTransactionInsert(request)
            if(workflowData.length == 0){
                logger.debug("NO WORKFLOWS ", { type: "rm_bot", request_body: request });
                request.global_array.push({"NO_WORKFLOWS_EXISTS":"NO WORKFLOWS EXISTS FOR THE ASSET_TYPE "+rowData.asset_type_id+": END OF FLOW"});
                //request.bot_mapping_inline_data = request.proof;
                self.AIEventTransactionInsert(request);
                return "";
               /* request.end_due_datetime = util.addDays(util.getCurrentUTCTime(), 15);
                [err, workflowData] = await self.RMOnAvailabilityOFAResource(request);
                if(workflowData.length == 0){
                    logger.debug("NO WORKFLOWS IN NEXT 15 DAYS ", { type: "rm_bot", request_body: request });
                    request.end_due_datetime = util.addDays(util.getCurrentUTCTime(), 30);
                    [err, workflowData] = await self.RMOnAvailabilityOFAResource(request);
                    if(workflowData.length == 0){
                        logger.debug("NO WORKFLOWS IN NEXT 30 DAYS ", { type: "rm_bot", request_body: request });
                        request.end_due_datetime = util.addDays(util.getCurrentUTCTime(), 60);
                        [err, workflowData] = await self.RMOnAvailabilityOFAResource(request);
                        if(workflowData.length == 0){
                            logger.debug("NO WORKFLOWS IN NEXT 60 DAYS ", { type: "rm_bot", request_body: request });
                            request.due_date_flag = 1;
                            request.end_due_datetime = util.addDays(util.getCurrentUTCTime(), 60);
                            [err, workflowData] = await self.RMOnAvailabilityOFAResource(request);
                            if(workflowData.length == 0){
                                logger.debug("NO WORKFLOWS AFTER 60 DAYS TOO", { type: "rm_bot", request_body: request });
                            }else{
                                logger.debug("WORKFLOWS EXIST AFTER 60 DAYS ", { type: "rm_bot", request_body: request });
                            }
                        }else{
                            logger.debug("WORKFLOWS EXIST BEFORE 60 DAYS ", { type: "rm_bot", request_body: request });
                        }
                    }else{
                        logger.debug("WORKFLOWS EXIST BEFORE 30 DAYS ", { type: "rm_bot", request_body: request });
                    }
                }else{
                    logger.debug("WORKFLOWS EXIST BEFORE 15 DAYS ", { type: "rm_bot", request_body: request });
                }*/
            }else{
                //logger.debug("WORKFLOWS EXIST BEFORE 7 DAYS ", { type: "rm_bot", request_body: request });
                //request.proof.i16__RMLoopInResoources_RMOnAvailabilityOFAResource_workflowsExist = workflowData.length;

                if(workflowData.length > 0){
                    logger.debug("FINALLY WORKFLOWS EXISTS, HENCE GOING WITH AI TRIGGERED (RMResourceAvailabilityTrigger)", { type: "rm_bot", request_body: request });
                    request.workflow_data = workflowData;
                    //request.proof.i16__RMLoopInResoources_RMResourceAvailabilityTrigger_Hit = ""+request.target_asset_id;
                    request.global_array.push({"FINALLY_WORKFLOWS_EXISTS":"FINALLY WORKFLOWS EXISTS, HENCE GOING WITH AI TRIGGERED (RMResourceAvailabilityTrigger) :: length :: "+workflowData.length});
                    //request.bot_mapping_inline_data = request.proof;
                    //self.AIEventTransactionInsert(request)
                    await self.RMResourceAvailabilityTrigger(request);
                }
            } 
        }, this);

        return "";
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

            logger.info("roleLinkedToStatus ::"+roleLinkedToStatus+"", { type: 'rm_bot', responseData1, error: error1 });
            logger.info("statusDuration :: "+statusDuration, { type: 'rm_bot', responseData1, error: error1 });

            request.duration_in_minutes = statusDuration
            jsonObj.roleLinkedToStatus = roleLinkedToStatus;
            jsonObj.statusDuration = statusDuration;

            let [error2, data] = await self.generateResourceScore(request);
            logger.info("Generated Score data ::: "+JSON.stringify(data));
            logger.info("*****************************************Asset Score "+request.target_asset_id+" : "+data.total_score);
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
            //request.proof.choosen_workflow = "Choosen workflow ::: "+highest_score_workflow+" :: Choosen Asset"+request.target_asset_id;
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
            self.addParticipantMakeRequest(request);
            return [false, {}];
        }else{
            request.global_array.push({"NO_WORKFLOW_CHOSEN_END_OF_FLOW":"Choosen workflow ::: "+highest_score_workflow+" :: Choosen Asset"+request.target_asset_id});
            self.AIEventTransactionInsert(request);
            return [false, {}];
        }
        //console.log('request '+JSON.stringify(request, null,2));
        
    };  

    this.assignResourceAsLead = async function (request, leadAssetId) {

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
            self.AIEventTransactionInsert(request);
        }
        return [error, responseData];
    } 


    this.addParticipantMakeRequest = async function (request) {

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
            track_gps_location: 'HYD',
            service_version: "3.0",
            app_version: "3.0.0",
            device_os_id: 5,
            datetime_log: util.getCurrentUTCTime(),
            add_as_lead: 1,
            duration_in_minutes:request.duration_in_minutes,
            rm_bot_scores:request.rm_bot_scores,
            activity_lead_timeline_collection:request.activity_lead_timeline_collection,
            timeline_stream_type_id:718,
            global_array:request.global_array
        };
        //console.log("assignRequest :: ",JSON.stringify(assignRequest, null,2));
        const assignActAsync = nodeUtil.promisify(makingRequest.post);
        //console.log("assignRequest :: ",JSON.stringify(assignRequest, null,2));
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
            }
        } catch (error) {
            console.
            log("Activity Mapping Assign | Error: ", error);
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
        let self = this;
        let read_efficiency_percentage = 0;
        let work_efficiency_percentage = 0;
        let status_rollback_percentage = 0;
        let customer_exposure_percentage = 0;
        let industry_exposure_percentage = 0;
        let workflow_exposure_percentage = 0;
        let workflow_type_exposure_percentage = 0;
        let workflow_category_exposure_percentage = 0;

        let work_efficiency = 0;
        let read_efficiency = 0;
        let no_rollback = 0;

        let customer_asset_id = 0;
        let industry_id = 0;
        let workflow_id = 0;
        let workflow_type_id = 0;
        let workflow_category_id = 0;

        let workload_data = {};

        let industry_score = 0;
        let customer_score = 0;
        let workflow_score = 0;
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
         workflow_type_exposure_percentage = data_config.workflow_type_exposure_percentage;
         workflow_category_exposure_percentage = data_config.workflow_category_exposure_percentage;

         logger.info("read_efficiency_percentage************ :: "+read_efficiency_percentage, { type: 'rm_bot', request, error: false });
         logger.info("work_efficiency_percentage************ :: "+work_efficiency_percentage, { type: 'rm_bot', request, error: false });
         logger.info("status_rollback_percentage************ :: "+status_rollback_percentage, { type: 'rm_bot', request, error: false });
         logger.info("customer_exposure_percentage********** :: "+customer_exposure_percentage, { type: 'rm_bot', request, error: false });
         logger.info("industry_exposure_percentage********** :: "+industry_exposure_percentage, { type: 'rm_bot', request, error: false });
         logger.info("workflow_exposure_percentage********** :: "+workflow_exposure_percentage, { type: 'rm_bot', request, error: false });
         logger.info("workflow_category_exposure_percentage* :: "+workflow_category_exposure_percentage, { type: 'rm_bot', request, error: false });
         logger.info("workflow_type_exposure_percentage***** :: "+workflow_type_exposure_percentage, { type: 'rm_bot', request, error: false });

         //request.summary_id = 1;
         //request.flag = 0;

        //self.getActivityDetailsPromise(request, request.activity_id).then(async (data) => {
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

            if(rmInlineData.hasOwnProperty("work_efficiency"))
                work_efficiency = rmInlineData.work_efficiency;
            if(rmInlineData.hasOwnProperty("read_efficiency"))
                read_efficiency = rmInlineData.read_efficiency;
            if(rmInlineData.hasOwnProperty("customer_exposure"))
                customer_score = rmInlineData.customer_exposure[data[0].customer_asset_id].customer_score;
            if(rmInlineData.hasOwnProperty("industry_exposure"))
                industry_score = rmInlineData.industry_exposure[data[0].industry_id].industry_score;
            if(rmInlineData.hasOwnProperty("workflow_exposure"))
                workflow_score = rmInlineData.workflow_exposure[data[0].activity_type_id].workflow_score;
            if(rmInlineData.hasOwnProperty("status_no_rollback"))
                   no_rollback = rmInlineData.no_rollback;

/*            
            request.flag = 1;
            request.entity_id = data[0].activity_type_id;
            let [error1, activityTypeStatusCount] = await self.assetTaskParticipatedCount(request);
            let [error2, activityTypeIntimeStatusCount] = await self.assetTaskLeadedCount(request);

            if(activityTypeStatusCount.length > 0)
            {
                if(activityTypeIntimeStatusCount.length > 0){
                    workflow_score = (Number(activityTypeIntimeStatusCount[0].activity_type_count)/Number(activityTypeStatusCount[0].activity_type_count));
                }else{
                    workflow_score = 0;
                }
            }else{
                workflow_score = 0;
            }

            request.flag = 2;
            request.entity_id = data[0].activity_type_tag_id;
            let [error3, activityTypeTagStatusCount] = await self.assetTaskParticipatedCount(request);
            let [error4, activityTypeTagIntimeStatusCount] = await self.assetTaskLeadedCount(request);

            if(activityTypeTagStatusCount.length > 0)
            {
                if(activityTypeTagIntimeStatusCount.length > 0){
                    workflow_type_score = (Number(activityTypeTagIntimeStatusCount[0].activity_type_tag_count)/Number(activityTypeTagStatusCount[0].activity_type_tag_count));
                }else{
                    workflow_type_score = 0;
                }
            }else{
                workflow_type_score = 0;
            }

            request.flag = 3;
            request.entity_id = data[0].tag_type_id;
            let [error5, tagTypeStatusCount] = await self.assetTaskParticipatedCount(request);
            let [error6, tagTypeIntimeStatusCount] = await self.assetTaskLeadedCount(request);

            if(tagTypeStatusCount.length > 0)
            {
                if(tagTypeIntimeStatusCount.length > 0){
                    workflow_category_score = (Number(tagTypeIntimeStatusCount[0].tag_type_count)/Number(tagTypeStatusCount[0].tag_type_count));
                }else{
                    workflow_category_score = 0;
                }
            }else{
                workflow_category_score = 0;
            }

            request.flag = 4;
            request.entity_id = data[0].industry_id;
            let [error7, industryStatusCount] = await self.assetTaskParticipatedCount(request);
            let [error8, industryIntimeStatusCount] = await self.assetTaskLeadedCount(request);

            if(industryStatusCount.length > 0)
            {
                if(industryIntimeStatusCount.length > 0){
                    industry_score = (Number(industryIntimeStatusCount[0].industry_count)/Number(industryStatusCount[0].industry_count));
                }else{
                    industry_score = 0;
                }
            }else{
                industry_score = 0;
            }


            request.flag = 5;
            request.entity_id = data[0].customer_asset_id;
            let [error9, customerStatusCount] = await self.assetTaskParticipatedCount(request);
            let [error10, customerIntimeStatusCount] = await self.assetTaskLeadedCount(request);

            if(customerStatusCount.length > 0)
            {
                if(customerIntimeStatusCount.length > 0){
                    customer_score = (Number(customerIntimeStatusCount[0].customer_asset_count)/Number(customerStatusCount[0].customer_asset_count));
                }else{
                    customer_score = 0;
                }
            }else{
                customer_score = 0;
            }

            //read efficiency
            //rollback

            request.flag = 6;
            request.entity_id = request.target_asset_id;
            let [error11, totalUpdateCount] = await self.assetTaskParticipatedCount(request);
            let [error12, totalIntimeUpdateCount] = await self.assetTaskLeadedCount(request);

            if(totalUpdateCount.length > 0)
            {
                if(totalIntimeUpdateCount.length > 0){
                    read_efficiency = (Number(totalIntimeUpdateCount[0].update_count)/Number(totalUpdateCount[0].update_count));
                }else{
                    read_efficiency = 0;
                }
            }else{
                read_efficiency = 0;
            }
 
            request.flag = 7;
            request.entity_id = request.target_asset_id;
            let [error13, totalStatusCount] = await self.assetTaskParticipatedCount(request);
            let [error14, totalIntimeStatusCount] = await self.assetTaskLeadedCount(request);

            if(totalStatusCount.length > 0)
            {
                if(totalIntimeStatusCount.length > 0){
                    work_efficiency = (Number(totalIntimeStatusCount[0].activity_count)/Number(totalStatusCount[0].activity_count));
                }else{
                    work_efficiency = 0;
                }
            }else{
                work_efficiency = 0;
            }
*/            

            work_efficiency = work_efficiency?work_efficiency:0;
            read_efficiency = read_efficiency?read_efficiency:0;
            industry_score = industry_score?industry_score:0;
            customer_score = customer_score?customer_score:0;
            workflow_score = workflow_score?workflow_score:0;
            no_rollback = no_rollback?no_rollback:0;
            //workflow_type_score = workflow_type_score?workflow_type_score:0;
            //workflow_category_score = workflow_category_score?workflow_category_score:0;
            
            logger.info("work_efficiency********* "+work_efficiency, { type: 'rm_bot', request, error: false });
            logger.info("read_efficiency********* "+read_efficiency, { type: 'rm_bot', request, error: false });
            logger.info("industry_score********** "+industry_score, { type: 'rm_bot', request, error: false });
            logger.info("customer_score********** "+customer_score, { type: 'rm_bot', request, error: false });
            logger.info("workflow_score********** "+workflow_score, { type: 'rm_bot', request, error: false });
            logger.info("no_rollback************* "+no_rollback, { type: 'rm_bot', request, error: false });

            //logger.info("workflow_type_score***** "+workflow_type_score, { type: 'rm_bot', request, error: false });
            //logger.info("workflow_category_score* "+workflow_category_score, { type: 'rm_bot', request, error: false });

            total_score = ((read_efficiency * read_efficiency_percentage) + (work_efficiency * work_efficiency_percentage) + (industry_score * industry_exposure_percentage) + (customer_score * customer_exposure_percentage) + (workflow_score * workflow_exposure_percentage) + (workflow_type_score * workflow_type_exposure_percentage) + (workflow_category_score * workflow_category_exposure_percentage));
            logger.info("Total Score "+total_score, { type: 'rm_bot', request, error: false });

            score_details.work_efficiency_score = work_efficiency * work_efficiency_percentage;
            score_details.read_efficiency_score =  read_efficiency * read_efficiency_percentage;
            score_details.status_rollback_score = no_rollback * status_rollback_percentage;
            score_details.customer_exposure_score = customer_score * customer_exposure_percentage;
            score_details.industry_exposure_score = industry_score * industry_exposure_percentage;
            score_details.workflow_exposure_score = workflow_score * workflow_exposure_percentage;
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

            /*
            let temp_status_due_datetime = await self.getWorkflowStatusDueDateBasedOnAssetBusinessHours(request, 0);
            
            let reqObj =  Object.assign({}, request);
            reqObj.asset_id = request.target_asset_id;
            let [err1, assetData] = await self.getAssetDetailsAsync(reqObj);

            let current_utc_datetime = util.getCurrentUTCTime();
            let availableDatetime = assetData[0].asset_datetime_available_till?util.replaceDefaultDatetime(assetData[0].asset_datetime_available_till):"1970-01-01 00:00:00";
            let t1 = availableDatetime.split(" ").join("").split(":").join("").split("-").join("");
            let t2 = current_utc_datetime.split(" ").join("").split(":").join("").split("-").join("");

            t1 = t1?t1:0;
            t2 = t2?t2:0;

            console.log("CURRENT DATETIME UTC "+current_utc_datetime);
            console.log("RESOURCE AVAILABLE TILL "+availableDatetime); //(availableDatetime.split(" ").join("").split(":").join("").split("-").join("")));
            //console.log("DERIVED STAUTS DUE DATE "+temp_status_due_datetime); //(temp_status_due_datetime.split(" ").join("").split(":").join("").split("-").join("")));
            console.log("TIME BETWEEN TWO DATES "+(t1-t2));

            let diff = Number(t1)-Number(t2);
            console.log("DIFF :: "+diff);

            if(diff < 0){
                console.log("RESOURCE AVAILABLE TIME IS LESS THAN THE CURRENT DATETIME, HENCE total_score = -1");
                total_score = -1;
            }else{
                console.log("DIFF GREATER THAN 0");
            } */

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
            //request.proof.i10__RMStatusChangeTrigger_unassigning_existing_lead = "activityListLeadUpdateV1";
            request.global_array.push({"REMOVE_LEAD":"REMOVING LEAD FROM WORKFLOW"});
            await self.activityListLeadUpdateV1(request, 0);
            //request.proof.i11__RMStatusChangeTrigger_make_workflow_as_unallocated = "unallocatedWorkflowInsert";
            request.global_array.push({"UNALLOCATE_WORKFLOW ":"MAKING THE WORKLOW UNALLOCATED "});
            await self.unallocatedWorkflowInsert(request);
            //request.proof.i11__RMStatusChangeTrigger_trigger_resource_pool = "RMLoopInResoources";
            request.global_array.push({"RESOURCE_POOL_TRIGGER":"TRIGGER THE RESOURCE POOL"});
            await self.RMLoopInResoources(request);

            //request.bot_mapping_inline_data = request.proof;
            //self.AIEventTransactionInsert(request)

        /*  await self.AIEventTransactionInsert(request);

            let [error, responseCode] = await self.workforceActivityStatusMappingSelectStatusId(request);

            if(responseCode.length > 0){
                roleLinkedToStatus = responseCode[0].asset_type_id;
                statusDuration = responseCode[0].activity_status_duration;
            }

            console.log("roleLinkedToStatus :: "+roleLinkedToStatus);
            console.log("statusDuration :: "+statusDuration);

            request.asset_type_id = roleLinkedToStatus;
            request.flag = -1;
            request.page_start = 0;
            request.page_limit = 500
            request.workforce_id = 0;
            request.account_id = 0;

            if(request.timeline_stream_type_id == 720 || request.timeline_stream_type_id == 721 || request.timeline_stream_type_id == 722)
            	request.existing_lead_asset_id = request.asset_id;

            let error1,responseCode1;
            if(roleLinkedToStatus > 0){
             	[error1, responseCode1] = await self.RMUnoccupiedResources(request);
         	}else
        	{
        		console.log("NO STATUS LINKED TO THE ROLE");
        		return [false, {}];
        	}
            let highest_score_asset = -1;
            let highest_score_asset_name = "";
            let highest_score_operating_asset_id = 0;
            let highest_score_operating_asset_name = "";
            let highest_score = 0;
            let rm_bot_scores = [];
            //generate score, find the top score asset
            for(let k = 0; k < responseCode1.length; k++){
                
                request.target_asset_id = responseCode1[k].asset_id;
                request.target_asset_name = responseCode1[k].asset_first_name;
                request.target_operating_asset_id = responseCode1[k].operating_asset_id;
                request.target_operating_asset_name = responseCode1[k].operating_asset_first_name;
                request.duration_in_minutes = statusDuration;
               let [err, data] = await self.generateResourceScore(request);
               console.log("Generated Score data ::: "+JSON.stringify(data));
               console.log("*****************************************Asset Score "+request.target_asset_id+" : "+data.total_score);
                
                if(data.total_score >= highest_score){
                    highest_score = data.total_score;
                    highest_score_asset = responseCode1[k].asset_id;
                    rm_bot_scores = data.rm_bot_scores;
                }
            }
            
            console.log("Highest Score :: "+highest_score_asset+" : "+highest_score);
            console.log("responseCode1 :: "+responseCode1.length);
            if(responseCode1.length > 0 && highest_score_asset > 0){

                let timelineCollection = {};
                timelineCollection.content="Tony has assigned "+rm_bot_scores[0].operating_asset_name+" as Lead";
                timelineCollection.subject="Tony has assigned "+rm_bot_scores[0].operating_asset_name+" as Lead";
                timelineCollection.mail_body="Tony has assigned "+rm_bot_scores[0].operating_asset_name+" as Lead";
                timelineCollection.attachments=[];
                timelineCollection.asset_reference=[];
                timelineCollection.activity_reference=[];
                timelineCollection.rm_bot_scores=rm_bot_scores;

                request.res_account_id = responseCode1[0].account_id;
                request.res_workforce_id = responseCode1[0].workforce_id;
                request.res_asset_type_id = responseCode1[0].asset_type_id;
                request.res_asset_category_id = responseCode1[0].asset_type_category_id;
                request.res_asset_id = highest_score_asset;
                request.duration_in_minutes = statusDuration;
                request.rm_bot_scores = rm_bot_scores;
                request.activity_lead_timeline_collection = JSON.stringify(timelineCollection);
                self.addParticipantMakeRequest(request);
            }
            */
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

        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_asset_task_stats', paramsArr);
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

        var queryString = util.getQueryString('ds_v1_activity_status_change_transaction_select_asset_task_stats', paramsArr);
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
/*
    this.calculateAssetSummary = async function(leadRequest, newLeadAssetId){
        
        let existingAssetWorkLoad = 0;
        let newAssetWorkload = 0;

        leadRequest.flag = -1;
        leadRequest.start_datetime = '1970-01-01 00:00:00';
        leadRequest.end_datetime = '2049-12-31 18:30:00';
        leadRequest.monthly_summary_id = 5;

       if(leadRequest.asset_id > 0){
            console.log("Existing Lead Asset GreaterThan 0")
            let [err3, exisitngAssetData] = await self.getLeadAssetWorkload(leadRequest);
            console.log("exisitngAssetData :: ", exisitngAssetData);
            existingAssetWorkLoad = (Number(exisitngAssetData[0].expected_duration)*60) - Number(exisitngAssetData[0].actual_duration);
            leadRequest.entity_decimal_1 = exisitngAssetData[0].expected_duration;
            leadRequest.entity_decimal_2 = Number(exisitngAssetData[0].actual_duration)/60;
            leadRequest.entity_decimal_3 = Number(existingAssetWorkLoad);

            console.log('After activityListLeadUpdate : ', leadRequest);
            //leadRequest.asset_id = leadRequest.asset_id;
            await self.assetSummaryTransactionInsert(leadRequest);
            console.log('After assetSummaryTransactionInsert : ');
        }else{
            console.log("Existing Lead Asset Not GreaterThan 0")
        }

        if(newLeadAssetId > 0){
            console.log("New Lead Asset GreaterThan 0")
            leadRequest.asset_id = newLeadAssetId;

            let [err2, newAssetData] = await self.getLeadAssetWorkload(leadRequest);
            console.log("newAssetData[0].query_status ", newAssetData[0].query_status)
            newAssetWorkload = (Number(newAssetData[0].expected_duration)*60) - Number(newAssetData[0].actual_duration);
            leadRequest.entity_decimal_1 = newAssetData[0].expected_duration;
            leadRequest.entity_decimal_2 = Number(newAssetData[0].actual_duration)/60;
            leadRequest.entity_decimal_3 = Number(newAssetWorkload);

            console.log("Expected Duration :: ", newAssetData[0].expected_duration);
            console.log("Actual Duration :: ", newAssetData[0].actual_duration);
            console.log("newAssetEfficiency :: ", newAssetWorkload);

            leadRequest.asset_id = newLeadAssetId;
            await self.assetSummaryTransactionInsert(leadRequest);

            console.log("existingAssetEfficiency ", existingAssetWorkLoad);
            console.log("newAssetEfficiency ", newAssetWorkload);
        }else{
            console.log("New Lead Asset Not GreaterThan 0")
        }
    }
*/
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
                    let self = this;
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
        let [err, response] = await self.workforceActivityStatusMappingSelectStatusId(request);
        //request.proof.i1_1_triggerAIOnStatusChange_workforceActivityStatusMappingSelectStatusId_response_length= response.length;
        //logger.info("triggerAIOnStatusChange :: "+JSON.stringify(request,null,2));
        if(response.length > 0){
            // request.bot_mapping_inline_data = request.proof;
            // self.AIEventTransactionInsert(request)            
            request.duration_in_minutes = response[0].activity_status_duration;
            //request.proof.i1_2__organization_ai_bot_enabled = response[0].organization_ai_bot_enabled;
            request.global_array.push({"organization_ai_bot_enabled":response[0].organization_ai_bot_enabled});
            if(response[0].organization_ai_bot_enabled == 1){
                //request.proof.i1_3__flag_trigger_resource_manager = request.flag_trigger_resource_manager;
                request.global_array.push({"flag_trigger_resource_manager":request.flag_trigger_resource_manager});
                if(request.flag_trigger_resource_manager == 1){

                    logger.info("AI TRIGGER FLAG RECEIVED FROM ALTER STATUS BOT");
                    let [formEditErr, formEditData] = await self.getFormEdidtedTimelineDetails(request);
                        //request.proof.i1_4__form_edit_length = formEditData.length;
                        request.global_array.push({"formEditData_length":formEditData.length});
                        if(formEditData.length == 0){
                            //request.proof.i1_5__activity_type_flag_persist_role = response[0].activity_type_flag_persist_role;
                            request.global_array.push({"activity_type_flag_persist_role":response[0].activity_type_flag_persist_role});
                            request.activity_type_flag_persist_role = response[0].activity_type_flag_persist_role;
                            if(request.activity_type_flag_persist_role == 1){
                                logger.info("PERSIST ROLE FLAG SET FOR THIS STATUS");
                                
                                let objReq = Object.assign({},request);
                                objReq.asset_type_id = response[0].asset_type_id;
                                let [err, roleAssetData] = await self.getAssetForAssetTypeID(objReq);
                                //request.proof.i1_6__getAssetForAssetTypeID_roleAssetData_length = roleAssetData.length;
                                request.global_array.push({"getAssetForAssetTypeID_roleAssetData_length":roleAssetData.length});
                                if(roleAssetData.length > 0){
                                    request.global_array.push({"PARTICIPANT_EXISTS":"PARTICIPANT EXISTS, HENCE ADDING AS LEAD, HITTING assignResourceAsLead "+roleAssetData[0].asset_id+" : "+roleAssetData[0].operating_asset_first_name});
                                    //request.proof.i1_7__participant_exists="Participant found : "+roleAssetData[0].asset_id+" : "+roleAssetData[0].operating_asset_first_name;
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

                                    // request.proof.i1_8__assignResourceAsLead = request.activity_lead_timeline_collection;
                                    // request.bot_mapping_inline_data = request.proof;
                                    // self.AIEventTransactionInsert(request)
                                    await self.assignResourceAsLead(request, roleAssetData[0].asset_id);

                                }else{
                                    //request.proof.i1_8__RMStatusChangeTrigger = "Persistant flag set but no participant found, hence triggering RMStatusChangeTrigger";
                                    logger.info("NO PARTICIPANT EXISTS WITH THIS ROLE ON THE WORKFLOW : HENCE EXECUTING RMStatusChangeTrigger");
                                    request.global_array.push({"NO_PARTICIPANT":"NO PARTICIPANT EXISTS WITH THIS ROLE ON THE WORKFLOW : HENCE EXECUTING RMStatusChangeTrigger"});
                                    //request.bot_mapping_inline_data = request.proof;
                                    //self.AIEventTransactionInsert(request)
                                    await self.RMStatusChangeTrigger(request);
                                }
                            }else{
                                //request.proof.i1_8__RMStatusChangeTrigger = "Persistant flag not set, hence triggering RMStatusChangeTrigger";
                                logger.info("NO PERSIST ROLE FLAG SET: HENCE EXECUTING RMStatusChangeTrigger");
                                request.global_array.push({"NO_PERSIST_ROLE_FLAG_SET": "NO PERSIST ROLE FLAG SET, HENCE EXECUTING RMStatusChangeTrigger"});
                                //request.bot_mapping_inline_data = request.proof;
                                //self.AIEventTransactionInsert(request)
                                await self.RMStatusChangeTrigger(request);
                            }
                        }else{
                            //request.proof.i1_5__resubmission = "Form resubmitted, hence end of flow";
                            logger.info("FORM RESUBMISSION, HENCE NO RM BOT TRIGGER");
                            request.global_array.push({"FORM_RESUBMISSION": "FORM RESUBMISSION, HENCE NO RM BOT TRIGGER"});
                            //request.bot_mapping_inline_data = request.proof;
                            self.AIEventTransactionInsert(request)                            
                        }
                }else{
                    logger.info("AI TRIGGER FLAG NOT RECEIVED FROM ALTER STATUS BOT ");
                    request.global_array.push({"AI_TRIGGER_FLAG":"AI TRIGGER FLAG NOT RECEIVED FROM ALTER STATUS BOT"});
                    //request.bot_mapping_inline_data = request.proof;
                    self.AIEventTransactionInsert(request)                    
                }
            }else{
                //request.proof.i1_2__organization_ai_bot_enabled = "THIS ORGANIZATION WITH ID "+request.organization_id+" IS NOT ENABLED WITH AI";
                request.global_array.push({"ORGANIZATION_SETTING":"THIS ORGANIZATION WITH ID "+request.organization_id+" IS NOT ENABLED WITH AI"});
                //request.bot_mapping_inline_data = request.proof;
                self.AIEventTransactionInsert(request)                
                logger.info("THIS ORGANIZATION WITH ID "+request.organization_id+" IS NOT ENABLED WITH AI");
            }
        }else{
            //request.proof.i1_2__Invalid_StatusId = "STATUS DOESNT EXIST, HENCE NO AI";
            request.global_array.push({"STATUS_DOESNT_EXIST":"STATUS DOESNT EXIST, HENCE NO AI"});
            //request.bot_mapping_inline_data = request.proof;
            self.AIEventTransactionInsert(request)
            logger.info("STATUS DOESNT EXIST, HENCE NO AI ");
        }

        //request.bot_mapping_inline_data = request.proof;
        //self.AIEventTransactionInsert(request)
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
        let status_no_rollback = 0;
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

        let idLeadAsset = request.lead_asset_id;

        let rmInlineData = {};
        rmInlineData.read_efficiency="";
        rmInlineData.work_efficiency="";
        rmInlineData.status_no_rollback=0;
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

        let [summaryErr, summaryData] = await self.assetSummarytransactionSelect(reqObj);
        console.log("summary_data :: "+JSON.stringify(summaryData));
        if(summaryData.length == 1){
            rmInlineData = summaryData[0].data_entity_inline?JSON.parse(summaryData[0].data_entity_inline):rmInlineData;
        }

        console.log("Activity activity_type_id***** :: "+data[0].activity_type_id);
        console.log("Activity activity_type_tag_id* :: "+data[0].activity_type_tag_id);
        console.log("Activity tag_type_id********** :: "+data[0].tag_type_id);
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
                    workflow_score = (Number(activityTypeIntimeStatusCount[0].activity_type_count)/Number(activityTypeStatusCount[0].activity_type_count));
                    activityTypeIntimeCount = Number(activityTypeIntimeStatusCount[0].activity_type_count);
                    activityTypeCount = Number(activityTypeStatusCount[0].activity_type_count);
                }else{
                    workflow_score = 0;
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
                    industry_score = (Number(industryIntimeStatusCount[0].industry_count)/Number(industryStatusCount[0].industry_count));
                    industryIntimeCount = Number(industryIntimeStatusCount[0].industry_count);
                    industryCount = Number(industryStatusCount[0].industry_count);               
                }else{
                    industry_score = 0;
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
                    customer_score = (Number(customerIntimeStatusCount[0].customer_asset_count)/Number(customerStatusCount[0].customer_asset_count));
                    customerIntimeCount = Number(customerIntimeStatusCount[0].customer_asset_count);
                    customerCount = Number(customerStatusCount[0].customer_asset_count);               
                }else{
                    customer_score = 0;
                }
            }else{
                customer_score = 0;
            }
            rmInlineData.customer_exposure[data[0].customer_asset_id]={"intime":customerIntimeCount,"total":customerCount, "customer_asset_id":data[0].customer_asset_id, "customer_asset_name":data[0].customer_operating_asset_first_name, "customer_score":customer_score};
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
                    read_efficiency = (Number(totalIntimeUpdateCount[0].update_count)/Number(totalUpdateCount[0].update_count));
                    totalUpdatesIntimeCount = Number(totalIntimeUpdateCount[0].update_count);
                    totalUpdatesCount = Number(totalUpdateCount[0].update_count);             
                }else{
                    read_efficiency = 0;
                }
            }else{
                read_efficiency = 0;
            }
     
            rmInlineData.read_efficiency=read_efficiency;
        }catch(e){
            console.log(e);
        }

        request.flag = 7;
        request.entity_id = request.target_asset_id;
        let [error13, totalStatusCount] = await self.assetTaskParticipatedCount(request);
        let [error14, totalIntimeStatusCount] = await self.assetTaskLeadedCount(request);
        let totalIntimeCount = 0;
        let totalCount = 0;
        let totalJson = {};
        try{
            if(totalStatusCount.length > 0)
            {
                if(totalIntimeStatusCount.length > 0){
                    work_efficiency = (Number(totalIntimeStatusCount[0].activity_count)/Number(totalStatusCount[0].activity_count));
                    totalIntimeCount = Number(totalIntimeStatusCount[0].activity_count);
                    totalCount = Number(totalStatusCount[0].activity_count);                 
                }else{
                    work_efficiency = 0;
                }
            }else{
                work_efficiency = 0;
            }
            rmInlineData.work_efficiency=work_efficiency;
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

                    request.datetime_log = util.getCurrentUTCTime();
                    self.activityListHistoryInsertAsync(request, 15);

                    if(request.timeline_stream_type_id == 718){
                         request.activity_timeline_collection = request.activity_lead_timeline_collection||'{}';
                    }

                    if(request.timeline_stream_type_id = 719){ 
                        if(data[0].existing_lead_asset_id > 0){
                            if(request.lead_asset_id == 0){
                                
                                let timelineCollection = {};
                                timelineCollection.content="Tony has Unassigned "+data[0].existing_lead_operating_asset_first_name+" as Lead";
                                timelineCollection.subject="Tony has Unaassigned "+data[0].existing_lead_operating_asset_first_name+" as Lead";
                                timelineCollection.mail_body="Tony has Unaassigned "+data[0].existing_lead_operating_asset_first_name+" as Lead";
                                timelineCollection.attachments=[];
                                timelineCollection.asset_reference=[];
                                timelineCollection.activity_reference=[];
                                timelineCollection.rm_bot_scores=[];
                                request.activity_lead_timeline_collection = JSON.stringify(timelineCollection);
                            }
                            request.target_lead_asset_id = data[0].existing_lead_asset_id;
                            await self.activityAssetMappingUpdateLead(request);
                            await self.assetListUpdatePoolEntry(request);
                            let ObjReq = Object.assign({}, request);
                            ObjReq.lead_asset_id = data[0].existing_lead_asset_id;
                            self.calculateAssetNewSummary(ObjReq);
                        }else{
                            logger.debug("Exising Lead Asset Id is not greaterthan zero ", { type: "rm_bot", request_body: request });
                        }
                    }  

                    request.track_gps_datetime = util.getCurrentUTCTime();
                    request.message_unique_id = util.getMessageUniqueId(request.asset_id);
                    
                    console.log("activityListLeadUpdate :: "+JSON.stringify(request,null,2));
                    if(request.timeline_stream_type_id > 0)
                        activityCommonService.asyncActivityTimelineTransactionInsert(request, {}, Number(request.timeline_stream_type_id)); 

                });
            }

        }catch(error){
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
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_role_participant', paramsArr);

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

}

module.exports = RMBotService;