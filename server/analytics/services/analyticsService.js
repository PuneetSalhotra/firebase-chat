/*
    author: bharat krishna masimukku
*/

function AnalyticsService(objectCollection) 
{
    
    const makeRequest = require('request');    
    const nodeUtil = require('util');
    
    const cacheWrapper = objectCollection.cacheWrapper;
    const queueWrapper = objectCollection.queueWrapper;
    //const activityPushService = objectCollection.activityPushService;
    
    const util = objectCollection.util;
    const db = objectCollection.db;    
    const analyticsConfig = require('../utils/analyticsConfig.js');

    const activityCommonService = objectCollection.activityCommonService;    
    //const activityUpdateService = new ActivityUpdateService(objectCollection);
    //const activityParticipantService = new ActivityParticipantService(objectCollection);
    //const activityService = new ActivityService(objectCollection);
    //const activityListingService = new ActivityListingService(objectCollection);
    //const activityTimelineService = new ActivityTimelineService(objectCollection);

    //Get the list of filter labels for an organization
    //Bharat Masimukku
    //2019-07-11
    this.getFilterLabels = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;

            paramsArray = 
            new Array
            (
                request.organization_id,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );

            //results[0] = await db.callDBProcedureR2(request, 'ds_p1_organization_list_select', paramsArray, 1);
            results[0] = await db.callDBProcedureR2(request, 'ds_p1_organization_widget_filter_mapping_select', paramsArray, 1);
            
            /*
            console.log("======================================");
            console.log("getFilterLabels");
            console.log(JSON.parse(results[0][0].organization_inline_data).filter_labels);
            console.log("======================================");
            */
            
            //return JSON.parse(results[0][0].organization_inline_data).filter_labels;
            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    this.analyticsWidgetAdd = async function(request) {
        request.datetime_log = util.getCurrentUTCTime();
        let widgetId;
        
        //Update widget_aggregate_id and widget_chart_id
        //*******************************************************/
        let [err1, staticValues] = await getwidgetStaticValueDetails(request);
        if(err1) {
            global.logger.write('conLog', "get Widget Chart Id | based on widget_type_id | Error: ", err, {});
            return [true, {message: "Error creating Widget"}];
        }
        
        global.logger.write('conLog', 'staticValues : ', {}, {});
        global.logger.write('conLog', staticValues, {}, {});

        request.widget_chart_id = staticValues[0].widget_type_chart_id;
        request.flag_app = staticValues[0].flag_mobile_enabled;
        request.widget_aggregate_id = 1;
        //********************************************************/

        //Get Asset Name
        await new Promise((resolve)=>{
            activityCommonService.getAssetDetails(request, (err, data, statusCode)=>{
                if(!err && Object.keys(data).length > 0) {
                    //console.log('DATA : ', data.operating_asset_first_name);
                    request.widget_owner_asset_name = data.operating_asset_first_name;
                }
                resolve();
            });
        });
        
        //Add Activity - you will get ActivityID
        const [err, activityData] = await createActivity(request);
        if (err) {
            global.logger.write('conLog', "createAssetBundle | createActivity | Error: ", err, {});
            return [true, {message: "Error creating activity"}];
        }
        //global.logger.write('conLog', "createAssetBundle | createActivity | activityData: " + activityData, {}, {});
        //console.log("createAssetBundle | createActivity | activityData: ", activityData);
        request.activity_id = activityData.response.activity_id;

        let [widgetErr, widgetResponse] = await this.widgetListInsert(request);
        if(widgetErr) {
            global.logger.write('conLog', "createAssetBundle | createActivity | Error: ", err, {});
            return [true, {message: "Error creating Widget"}];
        }            
        //console.log('widgetResponse : ', widgetResponse);
        //console.log('Widget ID : ', widgetResponse[0].widget_id);
        widgetId = widgetResponse[0].widget_id;
        request.widget_id = widgetId;
            
        await new Promise((resolve)=>{
            setTimeout(()=>{
                return resolve();
            }, 2500);
        });

        //let timelineReqParams = Object.assign({}, request);        

        //Add timeline Entry
        //let activityTimelineCollectionFor26004 = {
        //    "content": 'New Widget ' + request.widget_name + ' has been added by ' + request.widget_owner_asset_id,
        //    "subject": 'New Widget ' + request.widget_name + ' has been added.',
        //    "mail_body": 'New Widget ' + request.widget_name + ' has been added by ' + request.widget_owner_asset_id,
        //    "attachments": [],
        //    "activity_reference": [],
        //    "asset_reference": [],            
        //    "form_approval_field_reference": [],                        
        //};
//
        //timelineReqParams.activity_timeline_collection = JSON.stringify(activityTimelineCollectionFor26004);
        //timelineReqParams.activity_stream_type_id = 26001;
        //timelineReqParams.flag_timeline_entry = 1;
        //timelineReqParams.device_os_id = 7;        
//
        //let displayFileEvent = {
        //    name: "addTimelineTransaction",
        //    service: "activityTimelineService",
        //    method: "addTimelineTransaction",
        //    payload: timelineReqParams
        //};
//
        //await queueWrapper.raiseActivityEventPromise(displayFileEvent, request.activity_id);
        
        await updateWidgetDetailsInActList(request);
        await updateWidgetDetailsInActAssetList(request);

        let response = {};
        response.widget_id = widgetId;
        response.widget_activity_id = request.activity_id;
        response.message_unique_id = request.message_unique_id;
        response.activity_internal_id = request.activity_internal_id;
        return response;
    };

    async function createActivity(request) {
        //let filterTagTypeId = request.filter_tag_type_id;
        //let filterActivityStatusTypeId = request.filter_activity_status_type_id;   
        
        let activityTimelineCollectionFor26004 = {
            "content": 'New Widget ' + request.widget_name + ' has been added by ' + request.widget_owner_asset_name,
            "subject": 'New Widget ' + request.widget_name + ' has been added.',
            "mail_body": 'New Widget ' + request.widget_name + ' has been added by ' + request.widget_owner_asset_name,
            "attachments": [],
            "activity_reference": [],
            "asset_reference": [],            
            "form_approval_field_reference": [],                        
        };
                
        let activityInlineData = {};
        let widgetInfo = {};        
        widgetInfo.widget_id = util.replaceDefaultNumber(request.widget_id);
        widgetInfo.widget_name = util.replaceDefaultString(request.widget_name);
        widgetInfo.widget_target_value = request.widget_target_value;
        widgetInfo.widget_type_id = util.replaceDefaultString(request.widget_type_id);
        widgetInfo.widget_type_category_id = 3; //util.replaceDefaultString(request.widget_type_category_id);
        widgetInfo.widget_chart_id = util.replaceDefaultNumber(request.widget_chart_id);       
        widgetInfo.widget_aggregate_id = util.replaceDefaultNumber(request.widget_aggregate_id);      
        widgetInfo.filter_tag_type_id = request.filter_tag_type_id;        
        widgetInfo.filter_tag_id = util.replaceDefaultNumber(request.filter_tag_id);
        widgetInfo.filter_activity_type_id = util.replaceDefaultNumber(request.filter_activity_type_id);       
        widgetInfo.filter_activity_status_type_id = request.filter_activity_status_type_id;
        widgetInfo.filter_activity_status_tag_id = util.replaceDefaultNumber(request.filter_activity_status_tag_id);
        widgetInfo.filter_activity_status_id = util.replaceDefaultNumber(request.filter_activity_status_id);
        widgetInfo.filter_account_id = util.replaceDefaultNumber(request.filter_account_id);
        widgetInfo.filter_workforce_type_id = util.replaceDefaultNumber(request.filter_workforce_type_id);
        widgetInfo.filter_workforce_id = util.replaceDefaultNumber(request.filter_workforce_id);
        widgetInfo.filter_asset_id = util.replaceDefaultNumber(request.filter_asset_id);
        widgetInfo.filter_date_type_id = util.replaceDefaultNumber(request.filter_date_type_id);
        widgetInfo.filter_timeline_id = util.replaceDefaultNumber(request.filter_timeline_id);
        widgetInfo.filter_timeline_name = util.replaceDefaultNumber(request.filter_timeline_name);  

        let widgetDetailedInfo = JSON.parse(request.widget_detailed_info) || {};
               
        activityInlineData.widget_info = widgetInfo;
        activityInlineData.widget_detailed_info = widgetDetailedInfo;

        const addActivityRequest = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: request.asset_id,
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            asset_message_counter: 0,
            activity_title: request.widget_name,
            activity_description: request.widget_name,
            activity_inline_data: JSON.stringify(activityInlineData),
            activity_datetime_start: util.getCurrentUTCTime(),
            activity_datetime_end: util.getCurrentUTCTime(),
            activity_type_category_id: 52, //Widget
            activity_sub_type_id: 0,
            activity_type_id: request.activity_type_id || 0,
            activity_access_role_id: request.activity_access_role_id || 0,
            asset_participant_access_id: 0,
            activity_parent_id: request.activity_parent_id || 0,
            flag_pin: 0,
            flag_priority: 0,
            activity_flag_file_enabled: -1,
            activity_form_id: 0,
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(31993),
            activity_channel_id: 0,
            activity_channel_category_id: 0,
            activity_flag_response_required: 0,
            track_latitude: 0.0,
            track_longitude: 0.0,
            track_altitude: 0,
            track_gps_datetime: request.datetime_log,
            track_gps_accuracy: 0,
            track_gps_status: 0,
            service_version: "3.0",
            app_version: "3.0.0",
            device_os_id: 5,
            activity_timeline_collection : JSON.stringify(activityTimelineCollectionFor26004)
        };

        
        const addActivityAsync = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form: addActivityRequest
        };
        
        try {
            // global.config.mobileBaseUrl + global.config.version
            const response = await addActivityAsync(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', makeRequestOptions);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                console.log("createActivity | addActivityAsync | Body: ", body);
                widgetInfo.activity_id = body.response.activity_id;
                
                activityInlineData.widget_info = widgetInfo;
                request.activity_inline_data = JSON.stringify(activityInlineData);
                return [false, body];
            }
        } catch (error) {
            console.log("createActivity | addActivityAsync | Error: ", error);
            return [true, {}];
        }
    }

    async function getwidgetStaticValueDetails(request){
        let responseData = [],
            error = true;

        let paramsArr = new Array(            
            request.widget_type_id,            
        );

        var queryString = util.getQueryString('ds_p1_widget_type_master_select_id', paramsArr);
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
    }
    
    this.widgetListInsert = async function (request) {        
        
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.widget_name,
            request.widget_description,
            request.activity_inline_data,
            request.flag_app,
            request.widget_type_id,
            request.widget_aggregate_id,
            request.widget_chart_id,
            request.widget_timeline_id,
            util.replaceDefaultNumber(request.entity1_id),
            util.replaceDefaultNumber(request.entity2_id),
            util.replaceDefaultNumber(request.entity3_id),
            util.replaceDefaultNumber(request.entity4_id),
            util.replaceDefaultNumber(request.entity5_id),
            util.replaceDefaultNumber(request.timezone_id),
            util.replaceDefaultNumber(request.access_level_id),
            request.widget_owner_asset_id,
            request.activity_id,
            request.activity_type_id,
            request.asset_id,
            request.asset_type_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.log_asset_id,
            request.log_workforce_id,            
            request.datetime_log, //log_datetime
            request.widget_target_value
        );

        var queryString = util.getQueryString('ds_p1_1_widget_list_insert', paramsArr);
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

    //Updating Widget Details in Activity List Table
    async function updateWidgetDetailsInActList (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.activity_id,
            request.widget_id,
            request.organization_id,
            request.datetime_log
        );

        var queryString = util.getQueryString('ds_p1_activity_list_update_widget_details', paramsArr);
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
    }

    //Updating Widget Details in Activity Asset Table
    async function updateWidgetDetailsInActAssetList (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.activity_id,
            request.widget_id,
            request.organization_id,
            request.datetime_log
        );

        var queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_widget_details', paramsArr);
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
    }

    this.analyticsWidgetAlter = async function(request) {
        request.datetime_log = util.getCurrentUTCTime();

        let activityTimelineCollectionFor26005 = {
            "content": 'Widget Deleted!',
            "subject": 'Widget Deleted!',
            "mail_body": 'Widget Deleted!',
            "attachments": [],
            "activity_reference": [],
            "asset_reference": [],            
            "form_approval_field_reference": [],                        
        };

        //Call delete Widget        
        const widgetRequest = {           
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: request.asset_id,
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            widget_id: request.widget_id,
            log_datetime: request.datetime_log,

            //Timeline Params
            activity_access_role_id: 27,
            activity_channel_category_id: 0,
            activity_channel_id: 0,
            activity_id: request.activity_id,
            activity_parent_id: 0,
            activity_stream_type_id: 26003,
            activity_sub_type_id: -1,
            activity_timeline_collection: JSON.stringify(activityTimelineCollectionFor26005),
            activity_timeline_text: "",
            activity_timeline_url: "",
            activity_type_category_id: 52,
            activity_type_id: request.activity_type_id || 0,
            app_version: 1,                                                
            data_entity_inline: JSON.stringify(activityTimelineCollectionFor26005),
            datetime_log: request.datetime_log,            
            flag_offline: 0,
            flag_pin: 0,
            flag_priority: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(request.asset_id),
            //operating_asset_first_name: "Nani kalyan",            
            service_version: 1,
            timeline_stream_type_id: 26003,
            //timeline_transaction_id: 1565290146815,
            track_altitude: 0,
            track_gps_accuracy: "0",
            track_gps_datetime: request.datetime_log,
            track_gps_status: 0,
            track_latitude: "0.0",
            track_longitude: "0.0",
            device_os_id: 5,
        };

        const widgetDeleteAsync = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form: widgetRequest
        };
        try {
            // global.config.mobileBaseUrl + global.config.version
            const response = await widgetDeleteAsync(global.config.mobileBaseUrl + global.config.version + '/widget/delete', makeRequestOptions);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                console.log("Widget Deleted | Delete Widget | Body: ", body);
                await unassignWidgdetActMapping(request);

                //Add Timeline Entry
                let deleteWidgetEvent = {
                    name: "addTimelineTransaction",
                    service: "activityTimelineService",
                    method: "addTimelineTransaction",
                    payload: widgetRequest
                };
        
                await queueWrapper.raiseActivityEventPromise(deleteWidgetEvent, request.activity_id);
                return 'Widget Deleted Successfully!';
            }
        } catch (error) {
            console.log("Widget Deleted | Delete Widget | Error: ", error);
            return [true, {}];
        }        
        
    };

    async function unassignWidgdetActMapping(request) {
        //Get Participants List
        const getParticipantsReq = {
            organization_id: request.organization_id,
            activity_id: request.activity_id,
            datetime_differential: "1970-01-01 00:00:00",
            page_start: 0,
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
        };
        const getParticipantsAsync = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form: getParticipantsReq
        };
        try {
            // global.config.mobileBaseUrl + global.config.version
            const response = await getParticipantsAsync(global.config.mobileBaseUrl + global.config.version + '/activity/participant/list', makeRequestOptions);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                //console.log("Get Activity Participant List | Body: ", body);
                let participantCollection = body.response.data;
                let activityParticipantCollection = [];

                for(let i=0; i<participantCollection.length; i++) {
                    let temp = {};
                    temp.organization_id = participantCollection[i].organization_id;
                    temp.account_id = participantCollection[i].account_id;
                    temp.workforce_id = participantCollection[i].workforce_id;
                    temp.asset_id = participantCollection[i].asset_id;
                    temp.asset_type_id = participantCollection[i].asset_type_id;
                    temp.asset_type_category_id = participantCollection[i].asset_type_category_id;
                    temp.message_unique_id = util.getMessageUniqueId(participantCollection[i].asset_id);
                    activityParticipantCollection.push(temp);
                }

                request.activity_participant_collection = activityParticipantCollection;
                console.log('activityParticipantCollection : ', activityParticipantCollection);
                //activity_creator_asset_id
            }
        } catch (error) {
            console.log("Widget Activity Mapping Unassign | Error: ", error);
            return [true, {}];
        }        

        //Call Alter Status
        const unassignRequest = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: request.asset_id,
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            asset_message_counter: 0,
            activity_id: request.activity_id,
            activity_type_id: 0,  
            activity_type_category_id: 52, //Widget
            activity_participant_collection: JSON.stringify(request.activity_participant_collection),
            activity_access_role_id: request.activity_access_role_id || 0,            
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(request.asset_id),
            track_latitude: 0.0,
            track_longitude: 0.0,
            track_altitude: 0,
            track_gps_datetime: request.datetime_log,
            track_gps_accuracy: 0.0,
            track_gps_status: 1,
            track_gps_location: 'HYD',
            service_version: "3.0",
            app_version: "3.0.0",
            device_os_id: 5,
            datetime_log: request.datetime_log
        };

        const unassignActAsync = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions1 = {
            form: unassignRequest
        };
        try {
            // global.config.mobileBaseUrl + global.config.version
            const response = await unassignActAsync(global.config.mobileBaseUrl + global.config.version + '/activity/participant/access/reset', makeRequestOptions1);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                console.log("Widget Activity Mapping Unassign | Body: ", body);
                return [false, {}];
            }
        } catch (error) {
            console.log("Widget Activity Mapping Unassign | Error: ", error);
            return [true, {}];
        }
    }

    //Get the list of filter values for an organization
    //Bharat Masimukku
    //2019-07-11
    this.getFilterValues = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;
            let dbCall;

            console.log();
            console.log(`======================================`);
            console.log("Filter ID");
            console.log(request.filter_id);
            console.log(`======================================`);
            console.log();

            switch (parseInt(request.filter_id))
            {
                //Tag Type (Workflow Category)
                case 6:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    
                    dbCall = "ds_p1_tag_type_master_select";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];

                    break;
                
                //Tag (Workflow Type)
                case 7:
                    /*
                    //tag_type_id: {"tag_types":[1,2]}
                    results[0] = [];
                    //console.log(JSON.parse(request.tag_type_id).tag_types);
                    let arrayTagTypes = JSON.parse(request.tag_type_id).tag_types;
                    //console.log(arrayTagTypes.length);

                    for (let iterator = 0, arrayLength = arrayTagTypes.length; iterator < arrayLength; iterator++) 
                    {
                        console.log(`[${iterator}] : ${arrayTagTypes[iterator]}`);

                        paramsArray = 
                        new Array
                        (
                            request.organization_id,
                            arrayTagTypes[iterator],
                            request.page_start,
                            util.replaceQueryLimit(request.page_limit)
                        );
                        
                        dbCall = "ds_p1_tag_list_select";
                        results[0] = results[0].concat(await db.callDBProcedureR2(request, dbCall, paramsArray, 1));
                        
                        console.log();
                        console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
                        console.log(await results[0]);
                        console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
                        console.log();
                    }

                    return results[0];
                    */

                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.tag_type_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    
                    dbCall = "ds_p1_tag_list_select";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];

                    break;

                //Activity Type (Workflow)
                case 9:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.tag_type_id,
                        request.activity_type_tag_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    dbCall = "ds_p1_activity_type_tag_mapping_select_flag";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];

                    break;

                //Widget Type
                case 17:
                    paramsArray = 
                    new Array
                    (
                        global.analyticsConfig.widget_type_category_id_default, //Widget Type Category ID
                        request.device_os_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                    dbCall = "ds_p1_widget_type_master_select";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];

                    break;

                //Account
                case 2:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    
                    dbCall = "ds_p1_account_list_select_organization";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];
                    
                    break;

                //Workforce Type
                case 3:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.target_account_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                    dbCall = "ds_p1_1_workforce_list_select_workforce_type";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];

                    break;

                //Workforce
                case 4:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.target_account_id,
                        request.target_workforce_type_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                    dbCall = "ds_p1_1_workforce_list_select_organization_enabled";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];

                    break;

                //Asset
                case 5:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.target_account_id,
                        request.target_workforce_type_id,
                        request.target_workforce_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                    dbCall = "ds_p1_1_asset_list_select_widget_filters";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];

                    break;

                //Status Type
                case 12:
                    paramsArray = 
                    new Array
                    (
                        global.analyticsConfig.activity_type_category_id_workflow, //Activity Type Category ID - Workflow
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                    dbCall = "ds_p1_activity_status_type_master_select_category";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    /*results[0]
                    .push
                    (
                        {
                            "query_status": 0,
                            "activity_status_type_id": 0,
                            "activity_status_type_name": "Past Due",
                            "activity_status_type_description": "Past Due",
                            "activity_status_type_category_id": 0,
                            "activity_status_type_category_name": "",
                            "activity_type_category_id": 0,
                            "activity_type_category_name": ""
                        }
                    );*/
                    return results[0];
                    
                    break;

                //Status Tag
                case 13:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        global.analyticsConfig.activity_type_category_id_workflow, //Activity Type Category ID - Workflow
                        request.tag_type_id,
                        request.activity_type_tag_id,
                        request.activity_type_id,
                        request.activity_status_type_id,
                        global.analyticsConfig.activity_status_tag_id_all, //Activity Status Tag - All
                        global.analyticsConfig.parameter_flag_status_tag, //Status Tags
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                    dbCall = "ds_p1_workforce_activity_status_mapping_select_widget_filters";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];

                    break;

                //Status
                case 14:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        global.analyticsConfig.activity_type_category_id_workflow, //Activity Type Category ID - Workflow
                        request.tag_type_id,
                        request.activity_type_tag_id,
                        request.activity_type_id,
                        request.activity_status_type_id,
                        request.activity_status_tag_id,
                        global.analyticsConfig.parameter_flag_status, //Status
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                    dbCall = "ds_p1_workforce_activity_status_mapping_select_widget_filters";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];

                    break;

                //Date Type
                case 15:
                    paramsArray = 
                    new Array
                    (
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                    dbCall = "ds_p1_widget_date_type_master_select";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];

                    break;

                //Timeline
                case 16:
                    /*
                    results[0] = 
                    `{
                        "1": "Today",
                        "2": "Week to Date",
                        "3": "Month to Date",
                        "4": "Quarter to Date",
                        "5": "Year to Date"
                    }`;
                    */

                    paramsArray = 
                    new Array
                    (
                        global.analyticsConfig.parameter_flag_timeline, //Flag
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                    dbCall = "ds_p1_1_widget_timeline_master_select";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];

                    break;
            }
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Get the list of widgets and corresponding targets
    //Bharat Masimukku
    //2019-07-16
    this.getWidgetList = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;

            paramsArray = 
            new Array
            (
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_id,
                global.analyticsConfig.parameter_flag_sort,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );

            results[0] = await db.callDBProcedureR2(request, 'ds_p1_activity_asset_mapping_select_mywidgets', paramsArray, 1);
            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Get specific widgets value
    //Bharat Masimukku
    //2019-07-16
    this.getWidgetValue = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;
            let arrayTagTypes;
            let arrayStatusTypes;
            let tempResult;
            let iterator = 0;
            let timezoneID = 0;
            let timezoneOffset = 0;

            //Setting the activity_id in response
            results[0] =
            {
                activity_id: request.activity_id,
            };
            iterator++;

            //Get the timezone of the account
            paramsArray = 
            new Array
            (
                request.account_id
            );

            tempResult = await db.callDBProcedureR2(request, "ds_p1_account_list_select_timezone", paramsArray, 1);
            console.log(tempResult);
            timezoneID = tempResult[0].account_timezone_id;
            timezoneOffset = tempResult[0].account_timezone_offset;

            //Get the number of selections for workflow category
            console.log(JSON.parse(request.filter_tag_type_id).length);
            arrayTagTypes = JSON.parse(request.filter_tag_type_id);

            //Get the number of selections for status category
            console.log(JSON.parse(request.filter_activity_status_type_id).length);
            arrayStatusTypes = JSON.parse(request.filter_activity_status_type_id);

            switch (parseInt(request.widget_type_id))
            {
                case 18: //Volume
                case 19: //Value
                case 20: //TAT
                case 28: //Volume Distribution
                case 29: //Value Distribution
                    for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
                    {
                        console.log(`Tag Type[${iteratorX}] : ${arrayTagTypes[iteratorX].tag_type_id}`);
        
                        for (let iteratorY = 0, arrayLengthY = arrayStatusTypes.length; iteratorY < arrayLengthY; iteratorY++) 
                        {
                            console.log(`Status Type[${iteratorY}] : ${arrayStatusTypes[iteratorY].activity_status_type_id}`);
        
                            paramsArray = 
                            new Array
                            (
                                parseInt(request.widget_type_id),
                                parseInt(request.filter_date_type_id),
                                parseInt(request.filter_timeline_id),
                                timezoneID,
                                timezoneOffset,
                                global.analyticsConfig.parameter_flag_sort, //Sort flag
                                parseInt(request.organization_id),
                                parseInt(request.filter_account_id),
                                parseInt(request.filter_workforce_type_id),
                                parseInt(request.filter_workforce_id),
                                parseInt(request.filter_asset_id),
                                parseInt(arrayTagTypes[iteratorX].tag_type_id),
                                parseInt(request.filter_tag_id),
                                parseInt(request.filter_activity_type_id),
                                global.analyticsConfig.activity_id_all, //Activity ID,
                                parseInt(arrayStatusTypes[iteratorY].activity_status_type_id),
                                parseInt(request.filter_activity_status_tag_id),
                                parseInt(request.filter_activity_status_id),
                                request.datetime_start,
                                request.datetime_end,
                                parseInt(request.page_start),
                                parseInt(util.replaceQueryLimit(request.page_limit))
                            );
        
                            tempResult = await db.callDBProcedureR2(request, 'ds_p1_activity_list_select_widget_values', paramsArray, 1);
                            console.log(tempResult);
                                
                            if (parseInt(request.widget_type_id) === global.analyticsConfig.widget_type_id_tat)
                            {
                                results[iterator] =
                                (
                                    {
                                        "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                        "status_type_id": arrayStatusTypes[iteratorY].activity_status_type_id,
                                        "result": tempResult[0].value,
                                        "sum": tempResult[0].sum,
                                        "count": tempResult[0].count,
                                    }
                                );
                            }
                            else if 
                            (
                                parseInt(request.widget_type_id) === global.analyticsConfig.widget_type_id_volume_distribution || 
                                parseInt(request.widget_type_id) === global.analyticsConfig.widget_type_id_value_distribution
                            )
                            {
                                results[iterator] =
                                (
                                    {
                                        "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                        "status_type_id": arrayStatusTypes[iteratorY].activity_status_type_id,
                                        "result": tempResult,
                                    }
                                );
                            } 
                            else 
                            {
                                results[iterator] =
                                (
                                    {
                                        "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                        "status_type_id": arrayStatusTypes[iteratorY].activity_status_type_id,
                                        "result": tempResult[0].value,
                                    }
                                );
                            }
                            
                            iterator++;
                        }
                    }

                    break;

                case 23: //Cumulated Volume
                case 24: //Cumulated Value
                case 34: //Cumulated Volume Distribution
                case 35: //Cumulated Value Distribution
                case 27: //Status Type Wise TAT
                case 26: //Status Tag Wise TAT
                case 25: //Status Wise TAT
                case 37: //Status Wise Cumulated Volume (Pie Chart)
                case 38: //Status Wise Cumulated Value (Pie Chart)
                case 39: //Workflow Reference Volume
                case 40: //Workflow Reference Value
                case 41: //Single Selection Reference Volume
                case 42: //Single Selection Reference Value
                    for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
                    {
                        console.log(`Tag Type[${iteratorX}] : ${arrayTagTypes[iteratorX].tag_type_id}`);
        
                        paramsArray = 
                        new Array
                        (
                            parseInt(request.widget_type_id),
                            parseInt(request.filter_date_type_id),
                            parseInt(request.filter_timeline_id),
                            timezoneID,
                            timezoneOffset,
                            global.analyticsConfig.parameter_flag_sort, //Sort flag
                            parseInt(request.organization_id),
                            parseInt(request.filter_account_id),
                            parseInt(request.filter_workforce_type_id),
                            parseInt(request.filter_workforce_id),
                            parseInt(request.filter_asset_id),
                            parseInt(arrayTagTypes[iteratorX].tag_type_id),
                            parseInt(request.filter_tag_id),
                            parseInt(request.filter_activity_type_id),
                            global.analyticsConfig.activity_id_all, //Activity ID,
                            parseInt(request.filter_activity_status_type_id),
                            parseInt(request.filter_activity_status_tag_id),
                            parseInt(request.filter_activity_status_id),
                            request.datetime_start,
                            request.datetime_end,
                            parseInt(request.page_start),
                            parseInt(util.replaceQueryLimit(request.page_limit))
                        );
    
                        tempResult = await db.callDBProcedureR2(request, 'ds_p1_activity_list_select_widget_values', paramsArray, 1);
                        console.log(tempResult);

                        results[iterator] =
                        (
                            {
                                "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                "result": tempResult,
                            }
                        );
                        
                        iterator++;
                    }

                    break;
            }

            return results;
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Get the drill down for a specific widget
    //Bharat Masimukku
    //2019-07-23
    this.getWidgetDrilldown = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;
            let arrayTagTypes;
            let arrayStatusTypes;
            let tempResult;
            let iterator = 0;
            let timezoneID = 0;
            let timezoneOffset = 0;

            //Setting the activity_id in response
            results[0] =
            {
                activity_id: request.activity_id,
            };
            iterator++;

            //Get the timezone of the account
            paramsArray = 
            new Array
            (
                request.account_id
            );

            tempResult = await db.callDBProcedureR2(request, "ds_p1_account_list_select_timezone", paramsArray, 1);
            console.log(tempResult);
            timezoneID = tempResult[0].account_timezone_id;
            timezoneOffset = tempResult[0].account_timezone_offset;

            //Get the number of selections for workflow category
            console.log(JSON.parse(request.filter_tag_type_id).length);
            arrayTagTypes = JSON.parse(request.filter_tag_type_id);

            //Get the number of selections for status category
            console.log(JSON.parse(request.filter_activity_status_type_id).length);
            arrayStatusTypes = JSON.parse(request.filter_activity_status_type_id);

            for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
            {
                console.log(`Tag Type[${iteratorX}] : ${arrayTagTypes[iteratorX].tag_type_id}`);

                for (let iteratorY = 0, arrayLengthY = arrayStatusTypes.length; iteratorY < arrayLengthY; iteratorY++) 
                {
                    console.log(`Status Type[${iteratorY}] : ${arrayStatusTypes[iteratorY].activity_status_type_id}`);

                    paramsArray = 
                    new Array
                    (
                        parseInt(request.widget_type_id),
                        parseInt(request.filter_date_type_id),
                        parseInt(request.filter_timeline_id),
                        timezoneID,
                        timezoneOffset,
                        global.analyticsConfig.parameter_flag_sort, //Sort flag
                        parseInt(request.organization_id),
                        parseInt(request.filter_account_id),
                        parseInt(request.filter_workforce_type_id),
                        parseInt(request.filter_workforce_id),
                        parseInt(request.filter_asset_id),
                        parseInt(arrayTagTypes[iteratorX].tag_type_id),
                        parseInt(request.filter_tag_id),
                        parseInt(request.filter_activity_type_id),
                        global.analyticsConfig.activity_id_all, //Activity ID,
                        parseInt(arrayStatusTypes[iteratorY].activity_status_type_id),
                        parseInt(request.filter_activity_status_tag_id),
                        parseInt(request.filter_activity_status_id),
                        request.datetime_start,
                        request.datetime_end
                        // parseInt(request.page_start),
                        // parseInt(util.replaceQueryLimit(request.page_limit))
                    );

                    // tempResult = await db.callDBProcedureR2(request, 'ds_p1_activity_list_select_widget_drilldown', paramsArray, 1);
                    tempResult = await db.callDBProcedureRecursive(request, 1, 0, 50, 'ds_p1_activity_list_select_widget_drilldown', paramsArray, []);
                    //console.log(tempResult);

                    results[iterator] =
                    (
                        {
                            "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                            "status_type_id": arrayStatusTypes[iteratorY].activity_status_type_id,
                            "result": tempResult,
                        }
                    );

                    iterator++;
                }
            }

            return results;
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };
}

module.exports = AnalyticsService;
