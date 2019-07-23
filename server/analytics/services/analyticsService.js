/*
    author: bharat krishna masimukku
*/

function AnalyticsService(objectCollection) 
{
    const moment = require('moment');
    const makeRequest = require('request');
    const TinyURL = require('tinyurl');
    const nodeUtil = require('util');
    
    const cacheWrapper = objectCollection.cacheWrapper;
    //const queueWrapper = objectCollection.queueWrapper;
    //const activityPushService = objectCollection.activityPushService;
    
    const util = objectCollection.util;
    const db = objectCollection.db;    
    const analyticsConfig = require('../utils/analyticsConfig.js');

    //const activityCommonService = objectCollection.activityCommonService;    
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
        
        await updateWidgetDetailsInActList(request);
        await updateWidgetDetailsInActAssetList(request);

        let response = {};
        response.widget_id = widgetId;
        response.widget_activity_id = request.activity_id;
        return response;
    };

    async function createActivity(request) {
        
        let activityInlineData = {};
        let widgetInfo = {};        
        widgetInfo.widget_type_id = util.replaceDefaultString(request.widget_type_id);
        widgetInfo.widget_type_name = util.replaceDefaultString(request.widget_type_name);
        widgetInfo.widget_timeline_id = util.replaceDefaultNumber(request.widget_timeline_id);
        widgetInfo.widget_timline_name = util.replaceDefaultString(request.widget_timline_name);
        widgetInfo.widget_aggregate_id = util.replaceDefaultNumber(request.widget_aggregate_id);
        widgetInfo.widget_aggregate_name = util.replaceDefaultString(request.widget_aggregate_name);
        widgetInfo.widget_chart_id = util.replaceDefaultNumber(request.widget_chart_id);
        widgetInfo.widget_chart_name = util.replaceDefaultString(request.widget_chart_name);

        widgetInfo.widget_owner_asset_id = request.widget_owner_asset_id;
        widgetInfo.widget_owner_asset_first_name = "";
        widgetInfo.widget_owner_operating_asset_id = "";
        widgetInfo.widget_owner_operating_asset_first_name = "";
        widgetInfo.asset_id = request.asset_id;
        widgetInfo.asset_first_name = "";
        widgetInfo.operating_asset_id = "";
        widgetInfo.operating_asset_first_name = "";
        widgetInfo.workforce_id = request.workforce_id;
        widgetInfo.workforce_name = "";
        widgetInfo.account_id = request.account_id;
        widgetInfo.account_name = "";
        widgetInfo.organization_id = request.organization_id;
        widgetInfo.organization_name = "";

        widgetInfo.activity_id = "";
        widgetInfo.activity_title = request.widget_name;
        widgetInfo.activity_type_id = util.replaceDefaultNumber(request.activity_type_id);
        widgetInfo.activity_type_name = util.replaceDefaultString(request.activity_type_name);
        widgetInfo.activity_type_category_id = 52;
        widgetInfo.activity_type_category_name = util.replaceDefaultString(request.activity_type_category_name);
        widgetInfo.activity_status_id = util.replaceDefaultNumber(request.activity_status_id);
        widgetInfo.activity_status_name = util.replaceDefaultString(request.activity_status_name);
        widgetInfo.activity_status_type_id = util.replaceDefaultNumber(request.activity_status_type_id);
        widgetInfo.activity_status_type_name = util.replaceDefaultString(request.activity_status_type_name);
        widgetInfo.activity_status_tag_id = util.replaceDefaultNumber(request.activity_status_tag_id);
        widgetInfo.activity_status_tag_name = util.replaceDefaultString(request.activity_status_tag_name);
        
        activityInlineData.widget_info = widgetInfo;

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
            device_os_id: 5
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
            request.entity1_id,
            request.entity2_id,
            request.entity3_id,
            request.entity4_id,
            request.entity5_id,
            request.timezone_id,
            request.access_level_id,
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

        //Call delete Widget        
        const widgetRequest = {           
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: request.asset_id,
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            widget_id: request.widget_id,
            log_datetime: request.datetime_log
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
                return 'Widget Deleted Successfully!'
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
                        3, //Widget Type Category ID
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
                        48, //Activity Type Category ID - Workflow
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );

                    dbCall = "ds_p1_activity_status_type_master_select_category";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    results[0]
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
                    );
                    return results[0];
                    
                    break;

                //Status Tag
                case 13:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        48, //Activity Type Category ID - Workflow
                        request.tag_type_id,
                        request.activity_type_tag_id,
                        request.activity_type_id,
                        request.activity_status_type_id,
                        0, //Activity Status Tag
                        1, //Status Tags
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
                        48, //Activity Type Category ID - Workflow
                        request.tag_type_id,
                        request.activity_type_tag_id,
                        request.activity_type_id,
                        request.activity_status_type_id,
                        request.activity_status_tag_id,
                        2, //Status
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
                        1, //Flag
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

    //Get the list of widget values for mobile based clients
    //Bharat Masimukku
    //2019-07-16
    this.getWidgetList = 
    async (request) => 
    {
        try
        {
            
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Get specific widgets value for web based clients
    //Bharat Masimukku
    //2019-07-16
    this.getWidgetValue = 
    async (request) => 
    {
        try
        {
            
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Get specific widgets value for web based clients
    //Bharat Masimukku
    //2019-07-23
    this.getWidgetDrilldown = 
    async (request) => 
    {
        try
        {
            
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };
}

module.exports = AnalyticsService;