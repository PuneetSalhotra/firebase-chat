/*
    author: bharat krishna masimukku
*/

function AnalyticsService(objectCollection) 
{
    
    const makeRequest = require('request');    
    const nodeUtil = require('util');
    
    //const cacheWrapper = objectCollection.cacheWrapper;
    const queueWrapper = objectCollection.queueWrapper;
    //const activityPushService = objectCollection.activityPushService;
    
    const util = objectCollection.util;
    const db = objectCollection.db;    
    const analyticsConfig = require('../utils/analyticsConfig.js');

    const activityCommonService = objectCollection.activityCommonService;   
    
    const self = this;
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

    // Add filter label for the organization
    this.addFilterLabel =
        async (request) => {
            try {
                let results = new Array();
                let paramsArray;

                paramsArray =
                    new Array
                        (
                            request.organization_widget_filter_name,
                            request.widget_filter_id,
                            request.widget_filter_sequence_id,
                            request.widget_filter_flag_enable_all,
                            request.organization_id,
                            request.asset_id,
                            util.getCurrentUTCTime()
                        );

                results[0] = await db.callDBProcedureR2(request, 'ds_p1_organization_widget_filter_mapping_insert', paramsArray, 0);

                return results[0];
            }
            catch (error) {
                return Promise.reject(error);
            }
        };

    // Update filter label for the organization
    this.updateFilterLabel =
        async (request) => {
            try {
                let results = new Array();
                let paramsArray;

                paramsArray =
                    new Array
                        (
                            request.organization_widget_filter_mapping_id,
                            request.organization_widget_filter_name,
                            request.widget_filter_sequence_id,
                            request.organization_id,
                            request.widget_filter_id,
                            util.getCurrentUTCTime(),
                            request.asset_id
                        );

                results[0] = await db.callDBProcedureR2(request, 'ds_p1_organization_widget_filter_mapping_update', paramsArray, 0);

                return results[0];
            }
            catch (error) {
                return Promise.reject(error);
            }
        };

    // Delete filter label for the organization
    this.deleteFilterLabel =
        async (request) => {
            try {
                let results = new Array();
                let paramsArray;

                paramsArray =
                    new Array
                        (
                            request.organization_widget_filter_mapping_id,
                            request.organization_id,
                            request.widget_filter_id,
                            3, // request.log_state
                            util.getCurrentUTCTime(),
                            request.asset_id
                        );

                results[0] = await db.callDBProcedureR2(request, 'ds_p1_organization_widget_filter_mapping_update_log_state', paramsArray, 0);

                return results[0];
            }
            catch (error) {
                return Promise.reject(error);
            }
        };

    this.analyticsWidgetAdd = async function(request) {
        request.datetime_log = util.getCurrentUTCTime();
        let widgetId;
        
        //Update widget_aggregate_id and widget_chart_id
        //*******************************************************/
        let [err1, staticValues] = await self.getwidgetStaticValueDetails(request);
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
        widgetInfo.activity_status_id = request.activity_status_id;
        widgetInfo.filter_account_id = util.replaceDefaultNumber(request.filter_account_id);
        widgetInfo.filter_workforce_type_id = util.replaceDefaultNumber(request.filter_workforce_type_id);
        widgetInfo.filter_workforce_id = util.replaceDefaultNumber(request.filter_workforce_id);
        widgetInfo.filter_asset_id = util.replaceDefaultNumber(request.filter_asset_id);
        widgetInfo.filter_date_type_id = util.replaceDefaultNumber(request.filter_date_type_id);
        widgetInfo.filter_timeline_id = util.replaceDefaultNumber(request.filter_timeline_id);
        widgetInfo.filter_timeline_name = util.replaceDefaultNumber(request.filter_timeline_name); 
        widgetInfo.filter_form_id = util.replaceDefaultNumber(request.filter_form_id);
        widgetInfo.filter_field_id = util.replaceDefaultNumber(request.filter_field_id);


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

    this.getwidgetStaticValueDetails = async function(request){
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
                    
                    dbCall = "ds_p1_tag_type_list_select";
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

                case 18:
                    paramsArray = 
                    new Array
                    (
                        1,
                        request.organization_id,
                        request.account_id,
                        request.workforce_id,
                        request.activity_type_id ,
                        0,
                        '1970-01-01 00:00:00', //Status
                        request.page_start,
                        request.page_limit
                    );

                    dbCall = "ds_p1_workforce_form_mapping_select_workflow_forms";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];                

                    break;
                case 19:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.form_id,
                        request.data_type_id,
                        request.page_start,
                        request.page_limit
                    );

                    dbCall = "ds_p1_workforce_form_field_mapping_select_data_type";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                    return results[0];                

                    break; 
                case 20:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.account_id,
                        request.workforce_id,
                        request.activity_status_id,
                        request.page_start,
                        request.page_limit
                    );

                    dbCall = "ds_p1_workforce_activity_status_mapping_select_sub_status";
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

    //Get the list of management widgets
    //Sravankumar
    //2020-08-28
    this.getManagementWidgetList = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;

            let idAsset = request.target_asset_id;
            if(idAsset == 0){
                idAsset = request.asset_id;
            }

            paramsArray = 
            new Array
            (
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.tag_type_id,
                global.analyticsConfig.parameter_flag_sort,
                idAsset,
                request.page_start || 0,
                request.page_limit || 50
            );

            results[0] = await db.callDBProcedureR2(request, 'ds_p1_1_activity_list_select_management_widgets', paramsArray, 1);
            if(request.is_kpi_value_required == 1){
                console.log('results[0].length '+results[0].length);
                
                for(let i = 0; i < results[0].length; i ++){               
                    request.target_asset_id = results[0][i].asset_id;
                    request.widget_type_id  = results[0][i].widget_type_id;                
                    request.resource_level_id = 0;
                    //results[0][i] =  await self.getAssetTargetList(request);
                    let kpiValue = await self.getAssetTargetList(request);
                    if(!kpiValue[0]){
                        results[0][i].kpivalue = kpiValue[1][0]
                    } 
                }
            }

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

            console.log(request,null,2);

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

            console.log("request.activity_status_id :: "+request.activity_status_id);
            let arrayStatuses = new Array();
            if(request.hasOwnProperty("activity_status_id")){
                //console.log(JSON.parse(request.activity_status_id).length);
                if(request.activity_status_id != 0){
                    arrayStatuses = JSON.parse(request.activity_status_id);
                }else{
                    let json = {"activity_status_id": 0};
                    arrayStatuses.push(json); 
                    console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
                }
            }else{
               
                let json = {"activity_status_id": 0};
                arrayStatuses.push(json); 
                console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
            }
            console.log("filter_hierarchy "+request.filter_hierarchy);

            if(!request.hasOwnProperty("filter_hierarchy")){
                request.filter_hierarchy = 0;
            }

            if(request.filter_hierarchy > 0){
                    try{
                    
                        for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
                        {
                                console.log(`Tag Type[${iteratorX}] : ${arrayTagTypes[iteratorX].tag_type_id}`);

                            for (let iteratorY = 0, arrayLengthY = arrayStatusTypes.length; iteratorY < arrayLengthY; iteratorY++) 
                            {
                                console.log(`Status Type[${iteratorY}] : ${arrayStatusTypes[iteratorY].activity_status_type_id}`);

                                for (let iteratorZ = 0, arrayLengthZ = arrayStatuses.length; iteratorZ < arrayLengthZ; iteratorZ++) 
                                {
                                    console.log(`Statuses [${iteratorZ}] : ${arrayStatuses[iteratorZ].activity_status_id}`);

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
                                        parseInt(request.filter_circle_id),
                                        parseInt(request.filter_workforce_type_id),
                                        parseInt(request.filter_workforce_id),
                                        parseInt(request.filter_asset_id),
                                        parseInt(arrayTagTypes[iteratorX].tag_type_id),
                                        parseInt(request.filter_tag_id),
                                        parseInt(request.filter_activity_type_id),
                                        global.analyticsConfig.activity_id_all, //Activity ID,
                                        parseInt(arrayStatusTypes[iteratorY].activity_status_type_id),
                                        request.filter_activity_status_tag_id,
                                        parseInt(arrayStatuses[iteratorZ].activity_status_id),
                                        //parseInt(filter_activity_status_id),
                                        request.datetime_start,
                                        request.datetime_end,
                                        parseInt(request.filter_segment_id),
                                        parseInt(request.filter_reporting_manager_id),
                                        parseInt(request.page_start) || 0,
                                        parseInt(request.page_limit) || 50
                                    );

                                    let counter = 1; 
                                    let responseArray = [];
                                    if(request.widget_type_id == 45 || request.widget_type_id == 46){
                                        counter = 5
                                   
                                        for(let iteratorM = 0; iteratorM < counter; iteratorM++){
                                             paramsArray.push(iteratorM)
                                            tempResult = await db.callDBProcedureR2(request, 'ds_p1_2_activity_list_select_widget_values_hierarchy', paramsArray, 1);
                                            paramsArray.pop();
                                            responseArray.push(tempResult[0])
                                        }
                                        results[iterator] =
                                            (
                                                {
                                                    "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                                    "result": responseArray,
                                                }
                                            );
                                        iterator++
                                    }else{
                                    tempResult = await db.callDBProcedureR2(request, 'ds_p1_activity_list_select_widget_values_hierarchy', paramsArray, 1);
                                    console.log(tempResult);
                                    if(request.widget_type_id == 23 || request.widget_type_id == 24 || request.widget_type_id == 37 || request.widget_type_id == 38
                                     || request.widget_type_id == 48 || request.widget_type_id == 49){
                                        results[iterator] =
                                        (
                                            {
                                                "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                                "result": tempResult,
                                            }
                                        );

                                    }else{
                                        let totalValue = 0;
                                         //console.log("request.widget_type_id :: "+request.widget_type_id);
                                        if(parseInt(request.widget_type_id) === 44){
                                            //console.log("request.widget_type_id :: "+request.widget_type_id);
                                            for(let i = 0; i < tempResult.length; i++){
                                                //console.log('value ' +tempResult[i].value)
                                                totalValue = totalValue + tempResult[i].value
                                            }
                                        }else{
                                            totalValue = tempResult[0].value
                                        }          

                                        results[iterator] =
                                        (
                                            {
                                                "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                                "status_type_id": arrayStatusTypes[iteratorY].activity_status_type_id,
                                                "result": totalValue,
                                            }
                                        );
                                    }
                                }
                                iterator++;
                                }
                            }

                        }

                    }catch(e){
                        console.log('error ::', e);
                    }

            }else{
                console.log("else "+request.widget_type_id);
                switch (parseInt(request.widget_type_id))
                {
                    case 18: //Volume
                    case 19: //Value
                    case 20: //TAT
                    case 28: //Volume Distribution
                    case 29: //Value Distribution
                    case 62:
                    case 64: //participating single
                    case 66: //avg sales bar chart     
                    case 67: //active fos users bar chart  
                    case 68: //any field Value            
                        for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
                        {
                            console.log(`Tag Type[${iteratorX}] : ${arrayTagTypes[iteratorX].tag_type_id}`);
            
                            for (let iteratorY = 0, arrayLengthY = arrayStatusTypes.length; iteratorY < arrayLengthY; iteratorY++) 
                            {
                                console.log(`Status Type[${iteratorY}] : ${arrayStatusTypes[iteratorY].activity_status_type_id}`);
            
                                for (let iteratorZ = 0, arrayLengthZ = arrayStatuses.length; iteratorZ < arrayLengthZ; iteratorZ++) 
                                {
                                    console.log(`Statuses [${iteratorZ}] : ${arrayStatuses[iteratorZ].activity_status_id}`);
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
                                        parseInt(arrayStatuses[iteratorZ].activity_status_id),
                                        //parseInt(filter_activity_status_id),
                                        request.datetime_start,
                                        request.datetime_end,
                                        request.filter_product_category_id || 0,
                                        request.filter_product_family_id || 0,
                                        request.filter_product_activity_id || 0,
                                        request.filter_segment_id || 0,
                                        request.filter_account_activity_id || 0,
                                        request.filter_asset_type_id || 0,
                                        request.filter_form_id || 0,
                                        request.filter_field_id || 0
                                    );
                
                                    tempResult = await db.callDBProcedureR2(request, 'ds_p1_4_activity_list_select_widget_values', paramsArray, 1);
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
                                    else if
                                    (
                                        parseInt(request.widget_type_id) === 66 ||
                                        parseInt(request.widget_type_id) === 67
                                    )
                                    {
                                        results[iterator] =
                                        (
                                            {
                                            "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
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
                    case 61:
                    case 63:
                    case 65://product category wise pie chart
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
                                request.filter_product_category_id || 0,
                                request.filter_product_family_id || 0,
                                request.filter_product_activity_id || 0,
                                request.filter_segment_id || 0,
                                request.filter_account_activity_id || 0,
                                request.filter_asset_type_id || 0,
                                request.filter_form_id || 0,
                                request.filter_field_id || 0                                
                            );
        
                            tempResult = await db.callDBProcedureR2(request, 'ds_p1_4_activity_list_select_widget_values', paramsArray, 1);
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
            }
            return results;
        }
        catch(error)
        {
            console.log("error ",error)
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

            console.log("request.activity_status_id :: "+request.activity_status_id);

            let arrayStatuses = new Array();
            if(request.hasOwnProperty("activity_status_id")){
                //console.log(JSON.parse(request.activity_status_id).length);
                if(request.activity_status_id != 0){
                    arrayStatuses = JSON.parse(request.activity_status_id);
                }else{
                    let json = {"activity_status_id": 0};
                    arrayStatuses.push(json); 
                    console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
                }
                 //console.log("arrayStatuses1 :: "+JSON.stringify(arrayStatuses))
            }else{
               
                let json = {"activity_status_id": 0};
                arrayStatuses.push(json); 
                console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
            }

            // YTD widget's start date should be the Unix epoch
            // if (parseInt(request.filter_timeline_id) === 8) {
            //     request.datetime_start = '1970-01-01 00:00:00';
            // }
            if(!request.hasOwnProperty("filter_hierarchy")){
                request.filter_hierarchy = 0;
            }
            if(!request.hasOwnProperty("filter_reporting_manager_id")){
                request.filter_reporting_manager_id = 0;
            }            

            if(request.filter_hierarchy > 0){
                for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
                {
                    console.log(`Tag Type[${iteratorX}] : ${arrayTagTypes[iteratorX].tag_type_id}`);

                    for (let iteratorY = 0, arrayLengthY = arrayStatusTypes.length; iteratorY < arrayLengthY; iteratorY++) 
                    {
                        console.log(`Status Type[${iteratorY}] : ${arrayStatusTypes[iteratorY].activity_status_type_id}`);

                        for (let iteratorZ = 0, arrayLengthZ = arrayStatuses.length; iteratorZ < arrayLengthZ; iteratorZ++) 
                        {
                            console.log(`Statuses [${iteratorZ}] : ${arrayStatuses[iteratorZ].activity_status_id}`);

                             paramsArray = 
                             new Array(
                                request.flag || 0,
                                parseInt(request.widget_type_id),
                                parseInt(request.filter_date_type_id),                        
                                parseInt(request.filter_timeline_id),
                                timezoneID,
                                timezoneOffset,
                                global.analyticsConfig.parameter_flag_sort, //Sort flag                        
                                parseInt(request.organization_id),
                                parseInt(request.filter_circle_id),
                                parseInt(request.filter_workforce_type_id),
                                parseInt(request.filter_workforce_id),
                                parseInt(request.filter_asset_id),                        
                                parseInt(arrayTagTypes[iteratorX].tag_type_id),
                                parseInt(request.filter_tag_id),                        
                                parseInt(request.filter_activity_type_id),
                                global.analyticsConfig.activity_id_all, //Activity ID,
                                parseInt(arrayStatusTypes[iteratorY].activity_status_type_id),
                                request.filter_activity_status_tag_id,
                                parseInt(arrayStatuses[iteratorZ].activity_status_id),                        
                                request.bot_id || 0,
                                request.bot_operation_id || 0,
                                request.filter_form_id || 0,
                                request.filter_field_id || 0,
                                request.data_type_combo_id || 0,
                                request.datetime_start,
                                request.datetime_end,
                                parseInt(request.filter_segment_id),
                                parseInt(request.filter_reporting_manager_id)
                                //parseInt(request.page_start),
                                //parseInt(util.replaceQueryLimit(request.page_limit))
                            );



                            tempResult = await db.callDBProcedureRecursive(request, 1, 0, 100, 'ds_p1_1_activity_list_select_widget_drilldown_hierarchy', paramsArray, []);
                            console.log(tempResult);

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
                }
            }else{
                for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
                {
                    console.log(`Tag Type[${iteratorX}] : ${arrayTagTypes[iteratorX].tag_type_id}`);

                    for (let iteratorY = 0, arrayLengthY = arrayStatusTypes.length; iteratorY < arrayLengthY; iteratorY++) 
                    {
                        console.log(`Status Type[${iteratorY}] : ${arrayStatusTypes[iteratorY].activity_status_type_id}`);

                        for (let iteratorZ = 0, arrayLengthZ = arrayStatuses.length; iteratorZ < arrayLengthZ; iteratorZ++) 
                        {
                            console.log(`Statuses [${iteratorZ}] : ${arrayStatuses[iteratorZ].activity_status_id}`);

                            paramsArray = 
                            new Array
                            (
                                request.flag || 0,
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
                                parseInt(arrayStatuses[iteratorZ].activity_status_id),                        
                                request.bot_id || 0,
                                request.bot_operation_id || 0,
                                request.filter_form_id || 0,
                                request.filter_field_id || 0,
                                request.data_type_combo_id || 0,
                                request.datetime_start,
                                request.datetime_end,
                                request.filter_product_category_id || 0,
                                request.filter_product_family_id || 0,
                                request.filter_product_activity_id || 0,
                                request.filter_segment_id || 0,
                                request.filter_account_activity_id || 0,
                                request.filter_asset_type_id || 0
                            );

                            // tempResult = await db.callDBProcedureR2(request, 'ds_p1_activity_list_select_widget_drilldown', paramsArray, 1);
                            //tempResult = await db.callDBProcedureRecursive(request, 1, 0, 50, 'ds_p1_activity_list_select_widget_drilldown', paramsArray, []);
                            tempResult = await db.callDBProcedureRecursive(request, 1, 0, 50, 'ds_p1_3_activity_list_select_widget_drilldown', paramsArray, []);
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
                }
            }
            return results;
        }
        catch(error)
        {
            console.log(error);
            return Promise.reject(error);
        }
    };

    ///////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////
    //////// Management Dashboard Start ///////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    //Get specific widgets value
    //Sravankumar
    //2020-07-01
    this.getManagementWidgetValue = 
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

            console.log(request,null,2);

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

            console.log("request.activity_status_id :: "+request.activity_status_id);
            let arrayStatuses = new Array();
            if(request.hasOwnProperty("activity_status_id")){
                //console.log(JSON.parse(request.activity_status_id).length);
                if(request.activity_status_id != 0){
                    arrayStatuses = JSON.parse(request.activity_status_id);
                }else{
                    let json = {"activity_status_id": 0};
                    arrayStatuses.push(json); 
                    console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
                }
            }else{
               
                let json = {"activity_status_id": 0};
                arrayStatuses.push(json); 
                console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
            }
            console.log("filter_hierarchy "+request.filter_hierarchy);

            if(!request.hasOwnProperty("filter_hierarchy")){
                request.filter_hierarchy = 0;
            }

            
                try{
                
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
                            parseInt(request.filter_circle_id),
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
                            //parseInt(filter_activity_status_id),
                            request.datetime_start,
                            request.datetime_end,
                            parseInt(request.filter_segment_id),
                            parseInt(request.filter_reporting_manager_id),
                            parseInt(request.filter_product_category_id),
                            parseInt(request.filter_product_family_id),
                            parseInt(request.filter_product_activity_id),
                            parseInt(request.filter_account_activity_id),
                            parseInt(request.filter_is_value_considered),
                            parseInt(request.page_start) || 0,
                            parseInt(request.page_limit) || 50
                        );

                        let counter = 1; 
                        let responseArray = [];
                        if(request.widget_type_id == 45 || request.widget_type_id == 46){
                            counter = 5
                       
                            for(let iteratorM = 0; iteratorM < counter; iteratorM++){
                                 paramsArray.push(iteratorM)
                                tempResult = await db.callDBProcedureR2(request, 'ds_v1_1_activity_search_list_select_widget_values', paramsArray, 1);
                                paramsArray.pop();
                                responseArray.push(tempResult[0])
                            }
                            results[iterator] =
                                (
                                    {
                                        "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                        "result": responseArray,
                                    }
                                );
                            iterator++
                        }else{
                            paramsArray.push(0)
                            tempResult = await db.callDBProcedureR2(request, 'ds_v1_1_activity_search_list_select_widget_values', paramsArray, 1);
                            console.log(tempResult);
                            if(request.widget_type_id == 23 || request.widget_type_id == 24 || request.widget_type_id == 37 || request.widget_type_id == 38
                             || request.widget_type_id == 48 || request.widget_type_id == 49 || request.widget_type_id == 65){
                                results[iterator] =
                                (
                                    {
                                        "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                        "result": tempResult,
                                    }
                                );

                            }else{
                                let totalValue = 0;
                                 //console.log("request.widget_type_id :: "+request.widget_type_id);
                                if(parseInt(request.widget_type_id) === 44){
                                    //console.log("request.widget_type_id :: "+request.widget_type_id);
                                    for(let i = 0; i < tempResult.length; i++){
                                        //console.log('value ' +tempResult[i].value)
                                        totalValue = totalValue + tempResult[i].value
                                    }
                                }else{
                                    totalValue = tempResult[0].value
                                }          

                                results[iterator] =
                                (
                                    {
                                        "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                        "status_type_id": request.filter_activity_status_type_id,
                                        "result": totalValue,
                                    }
                                );
                            }
                        }
                        iterator++;
                    }

                }catch(e){
                    console.log('error ::', e);
                }


            return results;
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Get the drill down for a specific widget
    //Sravankumar
    //2020-07-01
    this.getManagementWidgetDrilldown = 
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

            console.log("request.activity_status_id :: "+request.activity_status_id);

            let arrayStatuses = new Array();
            if(request.hasOwnProperty("activity_status_id")){
                //console.log(JSON.parse(request.activity_status_id).length);
                if(request.activity_status_id != 0){
                    arrayStatuses = JSON.parse(request.activity_status_id);
                }else{
                    let json = {"activity_status_id": 0};
                    arrayStatuses.push(json); 
                    console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
                }
                 //console.log("arrayStatuses1 :: "+JSON.stringify(arrayStatuses))
            }else{
               
                let json = {"activity_status_id": 0};
                arrayStatuses.push(json); 
                console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
            }

            // YTD widget's start date should be the Unix epoch
            // if (parseInt(request.filter_timeline_id) === 8) {
            //     request.datetime_start = '1970-01-01 00:00:00';
            // }
            if(!request.hasOwnProperty("filter_hierarchy")){
                request.filter_hierarchy = 0;
            }
            if(!request.hasOwnProperty("filter_reporting_manager_id")){
                request.filter_reporting_manager_id = 0;
            }            

            
            for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
            {
                console.log(`Tag Type[${iteratorX}] : ${arrayTagTypes[iteratorX].tag_type_id}`);

                 paramsArray = 
                 new Array(
                    parseInt(request.widget_type_id),
                    parseInt(request.filter_date_type_id),
                    parseInt(request.filter_timeline_id),
                    timezoneID,
                    timezoneOffset,
                    global.analyticsConfig.parameter_flag_sort, //Sort flag
                    parseInt(request.organization_id),
                    parseInt(request.filter_circle_id),
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
                    //parseInt(filter_activity_status_id),
                    request.datetime_start,
                    request.datetime_end,
                    parseInt(request.filter_segment_id),
                    parseInt(request.filter_reporting_manager_id),
                    parseInt(request.filter_product_category_id),
                    parseInt(request.filter_product_family_id),
                    parseInt(request.filter_product_activity_id),
                    parseInt(request.filter_account_activity_id),
                    parseInt(request.filter_is_value_considered),
                    //parseInt(request.page_start) || 0,
                    //parseInt(request.page_limit) || 50
                    );
            
                tempResult = await db.callDBProcedureRecursive(request, 1, 0, 100, 'ds_v1_1_activity_search_list_select_widget_drilldown', paramsArray, []);
                console.log(tempResult);

                results[iterator] =
                (
                    {
                        "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                        "status_type_id": request.filter_activity_status_type_id,
                        "result": tempResult,
                    }
                );

                iterator++; 

            }

            return results;
        }
        catch(error)
        {
            console.log("error :; ",error);
            return Promise.reject(error);
        }
    };

    //Get specific widgets value
    //Sravankumar
    //2020-07-01
    this.getManagementWidgetValueV1 = async (request) => 
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

            console.log(request,null,2);

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

            console.log("request.activity_status_id :: "+request.activity_status_id);
            let arrayStatuses = new Array();
            if(request.hasOwnProperty("activity_status_id")){
                //console.log(JSON.parse(request.activity_status_id).length);
                if(request.activity_status_id != 0){
                    arrayStatuses = JSON.parse(request.activity_status_id);
                }else{
                    let json = {"activity_status_id": 0};
                    arrayStatuses.push(json); 
                    console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
                }
            }else{
               
                let json = {"activity_status_id": 0};
                arrayStatuses.push(json); 
                console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
            }
            console.log("filter_hierarchy "+request.filter_hierarchy);

            if(!request.hasOwnProperty("filter_hierarchy")){
                request.filter_hierarchy = 0;
            }

            console.log('request.filter_is_datetime_considered :: '+ request.filter_is_datetime_considered);

            try{
            
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
                        parseInt(request.filter_circle_id),
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
                        //parseInt(filter_activity_status_id),
                        request.datetime_start,
                        request.datetime_end,
                        parseInt(request.filter_segment_id),
                        parseInt(request.filter_reporting_manager_id),
                        parseInt(request.filter_product_category_id),
                        parseInt(request.filter_product_family_id),
                        parseInt(request.filter_product_activity_id),
                        parseInt(request.filter_account_activity_id),
                        parseInt(request.filter_is_value_considered),
                        parseInt(request.filter_cluster_tag_id) || 0,
                        parseInt(request.filter_is_direct_report),
                        parseInt(request.filter_is_datetime_considered),
                        parseInt(request.filter_asset_type_id),
                        parseInt(request.workforce_tag_id) || 0,
                        parseInt(request.filter_form_id) || 0,
                        parseInt(request.filter_field_id) || 0,
                        request.filter_timescale || '',
                        parseInt(request.page_start) || 0,
                        parseInt(request.page_limit) || 50
                    );

                    let counter = 1; 
                    let responseArray = [];
                    if(request.widget_type_id == 45 || request.widget_type_id == 46){
                        counter = 5
                   
                        for(let iteratorM = 0; iteratorM < counter; iteratorM++){
                             paramsArray.push(iteratorM)
                            tempResult = await db.callDBProcedureR2(request, 'ds_v1_6_activity_search_list_select_widget_values', paramsArray, 1);
                            paramsArray.pop();
                            responseArray.push(tempResult[0])
                        }
                        results[iterator] =
                            (
                                {
                                    "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                    "result": responseArray,
                                }
                            );
                        iterator++
                    }else{
                        console.log(paramsArray);
                        paramsArray.push(0)
                        tempResult = await db.callDBProcedureR2(request, 'ds_v1_6_activity_search_list_select_widget_values', paramsArray, 1);
                        console.log(tempResult);
                     //   let widgetTypes = [23,24,48,49,63,66,37,38,65,61,67,53,54, 39, 40, 41, 42];
                     //   if(widgetTypes.includes(request.widget_type_id)){
                        if(request.widget_type_id == 23 || request.widget_type_id == 24 || request.widget_type_id == 37 || request.widget_type_id == 38
                         || request.widget_type_id == 48 || request.widget_type_id == 49 || request.widget_type_id == 65 || request.widget_type_id == 61
                         || request.widget_type_id == 63 || request.widget_type_id == 66 || request.widget_type_id == 67 || request.widget_type_id == 53 || request.widget_type_id == 54
                         || request.widget_type_id == 39 || request.widget_type_id == 40 || request.widget_type_id == 41 || request.widget_type_id == 42
                          ){
                            results[iterator] =
                            (
                                {
                                    "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                    "result": tempResult,
                                }
                            );

                        } else if 
                        (
                            parseInt(request.widget_type_id) === global.analyticsConfig.widget_type_id_volume_distribution || 
                            parseInt(request.widget_type_id) === global.analyticsConfig.widget_type_id_value_distribution
                        )
                        {
                            results[iterator] =
                            (
                                {
                                    "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                    "status_type_id": request.filter_activity_status_type_id,
                                    "result": tempResult,
                                }
                            );
                        } else if 
                        (
                            parseInt(request.widget_type_id) >= 69 && parseInt(request.widget_type_id)<= 122
                        )
                        {
                            results[iterator] =
                            (
                                {
                                    "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                    "status_type_id": request.filter_activity_status_type_id,
                                    "result": tempResult[0].value,
                                    "target": tempResult[0].target,
                                    "data":tempResult
                                }
                            );
                        }else{
                            let totalValue = 0;
                             //console.log("request.widget_type_id :: "+request.widget_type_id);
                            if(parseInt(request.widget_type_id) === 44){
                                //console.log("request.widget_type_id :: "+request.widget_type_id);
                                for(let i = 0; i < tempResult.length; i++){
                                    //console.log('value ' +tempResult[i].value)
                                    totalValue = totalValue + tempResult[i].value
                                }
                            }else{
                                totalValue = tempResult[0].value
                            }          

                            results[iterator] =
                            (
                                {
                                    "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                                    "status_type_id": request.filter_activity_status_type_id,
                                    "result": totalValue,
                                }
                            );
                        }
                    }
                    iterator++;
                }

            }catch(e){
                console.log('error ::', e);
            }


            return results;
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };    

    //Get the drill down with limit for a specific widget
    //Sravankumar
    //2020-07-01
    this.getManagementWidgetDrilldownLimit = async (request) => 
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

            console.log("request.activity_status_id :: "+request.activity_status_id);

            let arrayStatuses = new Array();
            if(request.hasOwnProperty("activity_status_id")){
                //console.log(JSON.parse(request.activity_status_id).length);
                if(request.activity_status_id != 0){
                    arrayStatuses = JSON.parse(request.activity_status_id);
                }else{
                    let json = {"activity_status_id": 0};
                    arrayStatuses.push(json); 
                    console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
                }
                 //console.log("arrayStatuses1 :: "+JSON.stringify(arrayStatuses))
            }else{
               
                let json = {"activity_status_id": 0};
                arrayStatuses.push(json); 
                console.log("arrayStatuses2 :: "+JSON.stringify(arrayStatuses));
            }

            // YTD widget's start date should be the Unix epoch
            // if (parseInt(request.filter_timeline_id) === 8) {
            //     request.datetime_start = '1970-01-01 00:00:00';
            // }
            if(!request.hasOwnProperty("filter_hierarchy")){
                request.filter_hierarchy = 0;
            }
            if(!request.hasOwnProperty("filter_reporting_manager_id")){
                request.filter_reporting_manager_id = 0;
            }            
            console.log('request.filter_is_datetime_considered :: '+ request.filter_is_datetime_considered);
            console.log('request.filter_search_string :: '+ request.filter_search_string);
            console.log('request.filter_mapping_activity_id :: '+ request.filter_mapping_activity_id);

            
            for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
            {
                console.log(`Tag Type[${iteratorX}] : ${arrayTagTypes[iteratorX].tag_type_id}`);

                 paramsArray = 
                 new Array(
                    parseInt(request.widget_type_id),
                    parseInt(request.filter_date_type_id),
                    parseInt(request.filter_timeline_id),
                    timezoneID,
                    timezoneOffset,
                    global.analyticsConfig.parameter_flag_sort, //Sort flag
                    parseInt(request.organization_id),
                    parseInt(request.filter_circle_id),
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
                    //parseInt(filter_activity_status_id),
                    request.datetime_start,
                    request.datetime_end,
                    parseInt(request.filter_segment_id),
                    parseInt(request.filter_reporting_manager_id),
                    parseInt(request.filter_product_category_id),
                    parseInt(request.filter_product_family_id),
                    parseInt(request.filter_product_activity_id),
                    parseInt(request.filter_account_activity_id),
                    parseInt(request.filter_is_value_considered),
                    parseInt(request.filter_cluster_tag_id) || 0,
                    parseInt(request.filter_is_direct_report),
                    parseInt(request.filter_is_datetime_considered), 
                    parseInt(request.filter_asset_type_id),     
                    parseInt(request.filter_is_count) || 0,
                    parseInt(request.filter_is_search) || 0,
                    request.filter_search_string || '',  
                    parseInt(request.workforce_tag_id) || 0, 
                    parseInt(request.filter_form_id) || 0,
                    parseInt(request.filter_field_id) || 0,
                    parseInt(request.filter_mapping_activity_id) || 0,                    
                    request.filter_mapping_combo_value || '',
                    request.filter_timescale || '',
                    parseInt(request.page_start) || 0,
                    parseInt(request.page_limit) || 100
                    );
            
                var queryString = util.getQueryString('ds_v1_6_activity_search_list_select_widget_drilldown_search', paramsArray);
                if (queryString !== '') {
                    tempResult = await (db.executeQueryPromise(1, queryString, request));
                }
               // tempResult = await db.callDBProcedureR2(request, 'ds_v1_1_activity_search_list_select_widget_drilldown', paramsArray, 1);
                console.log(tempResult.length);

                results[iterator] =
                (
                    {
                        "tag_type_id": arrayTagTypes[iteratorX].tag_type_id,
                        "status_type_id": request.filter_activity_status_type_id,
                        "result": tempResult,
                    }
                );

                iterator++; 

            }

            return results;
        }
        catch(error)
        {
            console.log("error :; ",error);
            return Promise.reject(error);
        }
    };

    this.getWidgetMappings = async function (request) {

        let responseData = [],
            error = true, dbCall;

        switch (parseInt(request.flag))
        {
            //Tag Type (Workflow Category)
            case 1:
                paramsArray = 
                new Array
                (
                    request.application_id,
                    request.organization_id
                );
                
                var queryString = util.getQueryString('ds_v1_application_tag_type_mapping_select', paramsArray);
                await db.executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    })
                return responseData;

                break;

            case 2:
                paramsArray = 
                new Array
                (
                    request.segment_id,
                    request.organization_id
                );
                
                var queryString = util.getQueryString('ds_v1_segment_activity_type_mapping_select', paramsArray);
                await db.executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    })
                return responseData;

            break;
        }

    };
    this.insertWidgetType = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [              
              request.widget_type_name,
              request.widget_type_description,
              request.widget_type_category_id,
              request.widget_type_chart_id,
              request.flag_mobile_enabled,
              request.widget_type_flag_target,
              request.widget_type_flag_sip_enabled,
              request.widget_type_flag_role_enabled,
              request.widget_type_sip_contribution_percentage,
              request.asset_type_id,
              request.activity_type_id,
              request.tag_id,
              request.workforce_type_id,
              request.organization_id,
              request.log_asset_id ,
              request.log_datetime
        ];

        const queryString = util.getQueryString('ds_p1_widget_type_master_insert', paramsArr);
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

    this.selectWidgetType = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,         
              request.widget_type_category_id,
              request.asset_type_id,
              request.activity_type_id,
              request.workforce_type_id,
              request.tag_id,
              request.tag_type_id,
              request.flag||0,
              request.device_os_id,
              request.start_from,
              request.limit_value || 50
   
        ];

        const queryString = util.getQueryString('ds_p1_1_widget_type_master_select', paramsArr);
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

    this.deleteWidgetType = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [  
              request.widget_type_id,   
              request.organization_id,         
              request.asset_id,
              util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_p1_widget_type_master_delete', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
              .then((data) => {
                  responseData = responseData = {'message': 'widget type deleted successfully!'};;
                  error = false;
              })
              .catch((err) => {
                  error = err;
              })
        }

        return [error, responseData]
    }

    this.addReport = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [  
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.target_asset_id,
            request.report_type_id,
            request.report_inline_data,
            request.report_recursive_enabled || 0,
            request.report_notified_enabled || 1,
            request.report_recursive_type_id || 1,
            request.report_access_level_id || 1,
            request.activity_id || 0,
            request.report_start_time || '18:30:00',
            request.report_end_time || '18:29:00',
            request.report_start_datetime,
            request.report_end_datetime,
            request.asset_id,
            util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('dm_v1_report_list_insert', paramsArr);
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

        return [error, responseData]
    }

    this.retrieveReportList = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,         
              request.account_id,
              request.workforce_id,
              request.asset_id,
              request.flag_report_type,
              request.page_start,
              request.page_limit || 50   
        ];

        const queryString = util.getQueryString('ds_v1_report_list_select', paramsArr);
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

    this.getOrganizationApplications = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id   
        ];

        const queryString = util.getQueryString('ds_v1_application_master_select', paramsArr);
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
    
    this.getAssetTargetList = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id,
              request.widget_type_id,
              request.widget_timescale,
              request.resource_level_id
        ];

        const queryString = util.getQueryString('ds_v1_asset_target_mapping_select', paramsArr);
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

    this.getDrilldownMappingList = async (request) => {
        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.tag_type_id,
              request.organization_id
        ];

        const queryString = util.getQueryString('ds_v1_widget_drilldown_header_mapping_select', paramsArr);
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

    //Functionality to modify the target at product level
    this.updateWidgetTargetValue = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = [
            request.organization_id,
            request.activity_id,
            request.target_asset_id,
            request.widget_type_id,
            request.year_month,
            request.is_target,
            request.entity_value, 
            request.asset_id,
            util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_v1_vil_asset_target_mapping_update_value', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                    const activityData = await activityCommonService.getActivityDetailsPromise(request, request.activity_id);
                    //console.log("activityData ",activityData);
                    let entity = "";

                    if(request.is_target == 1)
                        entity = "Target";
                    else
                        entity = "Achieved Value";

                    request.message = "Your "+entity+" for the month "+request.year_month+" is revised to "+request.entity_value;
                    util.sendCustomPushNotification(request, activityData);

                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    //Functionality to get asset account target list          
    this.getAssetAccountTargetList = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id,
              request.widget_timescale || '',
              request.page_start || 0,
              request.page_limit || 100
        ];

        const queryString = util.getQueryString('ds_v1_vil_asset_account_target_mapping_select', paramsArr);
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

    //Functionality to get asset account target list          
    this.getAssetAccountTargetListV1 = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id || 0,
              request.widget_timescale || '',
              request.channel_asset_id,
              request.account_activity_id || 0,
              request.widget_type_id,
              request.page_start || 0,
              request.page_limit || 100
        ];

        const queryString = util.getQueryString('ds_v1_vil_asset_account_target_mapping_select_widget_type', paramsArr);
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

        //Functionality to get asset account target list   v1        
    this.getAssetAccountChannelTargetList = async (request) => {

            let responseData = [],
                error = true, widgetErr = true, widgetData = [];

            try{
            const paramsArr = [     
                  request.organization_id,
                  request.target_asset_id,
                  request.widget_timescale || '',
                  request.page_start || 0,
                  request.page_limit || 100
            ];
    
            const queryString = util.getQueryString('ds_v1_vil_asset_account_target_mapping_select_list', paramsArr);
            if (queryString !== '') {
                await db.executeQueryPromise(1, queryString, request)
                  .then(async (data) => {
                      responseData = data;
                      error = false;

                      if(data.length > 0){

                        let sme = [69,70,71];
                        let non_sme = [69,70,71,72];
                        if(data[0].workforce_type_id == 13){
                    
                        } else if(data[0].workforce_type_id != 13){

                            for(let i = 0 ; i <responseData.length; i++ ){
                                request.account_activity_id = responseData[i].account_activity_id;
                                for(let j = 0; j < non_sme.length; j++){

                                    request.widget_type_id = non_sme[j];
                                    request.channel_asset_id = 0;
                                    
                                    let [widgetErr, widgetData] = await self.getAssetAccountTargetListV1(request);
                                    console.log('widgetData ',widgetData);
                                    //responseData[i].widget_data.push(widgetData);
                                    if(non_sme[j] == 69)
                                    responseData[i].revenue_mobility = widgetData;
                                    if(non_sme[j] == 70)
                                    responseData[i].revenue_non_mobility = widgetData;
                                    if(non_sme[j] == 71)
                                    responseData[i].ob_mobility = widgetData;
                                    if(non_sme[j] == 72)
                                    responseData[i].ob_non_mobility = widgetData;  
                                }
                            }
                        }

                    }

                  })
                  .catch((err) => {
                      error = err;
                  })
            }
        }catch(e){
            console.log(e);
        }
            return [error, responseData];
        }
        
    //Functionality to get report transaction list          
    this.getReportTransactionList = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id,
              request.page_start || 0,
              request.page_limit || 100
        ];

        const queryString = util.getQueryString('ds_v1_report_transaction_select', paramsArr);
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

    //Functionality to get tag type          
    this.getTagTypeFilters = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.tag_type_id,
              request.page_start || 0,
              request.page_limit || 100
        ];

        const queryString = util.getQueryString('ds_v1_organization_filter_tag_type_mapping_select', paramsArr);
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

    //Functionality to get Asset Report Mapping          
    this.getAssetReportMapping = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id,
              request.is_export,
              request.page_start || 0,
              request.page_limit || 100
        ];

        const queryString = util.getQueryString('ds_v1_asset_report_mapping_select', paramsArr);
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

    //Functionality to get Asset Report Mapping V1         
    this.getAssetReportMappingV1 = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.account_id,
              request.access_level_id,
              request.target_asset_id,
              request.tag_type_id,
              request.is_export,
              request.page_start || 0,
              request.page_limit || 100
        ];

        const queryString = util.getQueryString('ds_v1_1_asset_report_mapping_select', paramsArr);
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
    
    this.getAssetReporteeTargetValues = async (request) => {

            let responseData = [],
            error = true, responseData1 = [],
            error1 = true, responseData2 = [],
            error2 = true;
            let resCount = 0;
            let qualifiedResCount = 0;
            let percentage = 0;

            let widgetData = [], widgetErr = true;

        try{

            [error, responseData] = await self.getAssetsReportingToSameManager(request);
            console.log('responseData ', responseData);

            for(let i = 0; i < responseData.length; i ++){
                //responseData[i].widget_data = [];
                let total_target = 0;
                let total_achieved = 0;
                let total_percentage = 0;    
                request.target_asset_id = responseData[i].asset_id;  
                request['is_qualified'] = 0;
                [error1, responseData1] = await self.getAssetsReporteeCount(request);

                console.log('responseData1 ',responseData1)

                request['is_qualified'] = 1;
                [error2, responseData2] = await self.getAssetsReporteeCount(request);            
                console.log('responseData2 ',responseData2)
                for(let j = 69; j <= 72; j ++){
                    request.widget_type_id = j;
                    request.target_asset_id = responseData[i].asset_id;
                
                    [widgetErr, widgetData] = await self.getAssetTargetListV1(request);
                    console.log('widgetData ',widgetData);
                    //responseData[i].widget_data.push(widgetData);
                    if(widgetData.length > 0){
                        total_target = widgetData[0].target + total_target;
                        total_achieved = widgetData[0].achieved + total_achieved;
                    }
                    //   responseData[i][j] = widgetData;
                    if(j == 69)
                    responseData[i].revenue_mobility = widgetData;
                    if(j == 70)
                    responseData[i].revenue_non_mobility = widgetData;
                    if(j == 71)
                    responseData[i].ob_mobility = widgetData;
                    if(j == 72)
                    responseData[i].ob_non_mobility = widgetData;       
                }

                resCount = responseData1[0]?responseData1[0].reportee_count:0;
                qualifiedResCount = responseData2[0]?responseData2[0].qualified_reportee_count:0;            
                percentage = (qualifiedResCount/ resCount)*100;

                responseData[i].sip_qualified_emp_count = qualifiedResCount
                responseData[i].sip_emp_count = resCount;
                responseData[i].sip_qualified_percentage = percentage?percentage.toFixed(2):0;
                responseData[i].target = total_target;
                responseData[i].achieved = total_achieved.toFixed(2);
                responseData[i].percentage = ((total_achieved/total_target)*100).toFixed(2);

            }

            responseData1 = null;
            responseData2 = null;
            widgetData = null;
            resCount = null;
            qualifiedResCount = null;
            percentage = null;
        }catch(e){
            console.log(e);
            return [true, responseData];
        }

        return [error, responseData];
    }   
    
    this.getAssetsReportingToSameManager = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
            request.target_asset_id,
            request.page_start || 0,
            request.page_limit || 100            
        );

        const queryString = util.getQueryString('ds_v1_asset_list_select_manager', paramsArr);
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

    this.getAssetTargetListV1 = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id,
              request.widget_type_id,
              request.widget_timescale
        ];

        const queryString = util.getQueryString('ds_v1_1_asset_target_mapping_select', paramsArr);
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

    this.assetListUpdateLastHierarchy = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id,
              request.asset_last_hierarchy_enabled,
              request.asset_id,
              util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_v1_asset_list_update_last_hierarchy', paramsArr);
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

    this.reportFilterListInsert = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id,
              request.report_filter_name,
              request.report_inline_data,
              request.report_timescale_id,
              request.report_timescale,
              request.report_start_datetime,
              request.report_end_datetime,
              request.asset_id,
              util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_v1_report_filter_list_insert', paramsArr);
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

    this.getReportFilterListSelect = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id,
              request.page_start || 0,
              request.page_limit || 50
        ];

        const queryString = util.getQueryString('ds_v1_report_filter_list_select', paramsArr);
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

    this.reportFilterListDelete = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.target_asset_id,
              request.report_filter_id,
              request.asset_id,
              util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_v1_report_filter_list_delete', paramsArr);
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

    this.getTagListSelectDashobardFilters = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.account_id,
              request.type_flag,
              request.tag_type_id,
              request.filter_is_search,
              request.filter_search_string,
              request.page_start || 0,
              request.page_limit || 50
        ];

        const queryString = util.getQueryString('ds_v1_tag_list_select_dashobard_filters', paramsArr);
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

    
    this.assetAccessLevelMapping = async (request) => {
        let responseData = [],
            error = true;
        try{
            let loopBase = [];
            let loopKey = "";
            switch(parseInt(request.access_level_id)){
                case 2 : loopBase = JSON.parse(request.target_accounts);
                         loopKey = account_id;   
                        break;
                case 6 : loopBase = JSON.parse(request.target_assets);
                         loopKey = target_asset_id;
                         request.account_id = (JSON.parse(request.target_accounts))[0];
                        break;
                case 8 : loopBase = JSON.parse(request.activity_types);
                         loopKey = activity_type_id;
                         request.tag_type_id = (JSON.parse(request.tag_types))[0];   
                        break;
                case 20 : loopBase = JSON.parse(request.tag_types);
                         loopKey = tag_type_id;   
                        break;
                case 21 : loopBase = JSON.parse(request.segments);
                         loopKey = segment_id;   
                        break;
                case 22 : loopBase = JSON.parse(request.product_tags);
                         loopKey = product_tag_id;   
                        break;
                case 25 : loopBase = JSON.parse(request.cluster_tags);
                         loopKey = cluster_tag_id;   
                        break;
                case 26 : loopBase = JSON.parse(request.workforce_tags);
                         loopKey = workforce_tag_id;   
                        break;
                case 27 : loopBase = JSON.parse(request.applications);
                         loopKey = application_id;   
                        break;
            }
            for(let i = 0 ; i < loopBase.length ; i++){
                request[loopKey]= loopBase[i];
                let [err1,data] = await self.assetAccessLevelMappingInsert(request);
                if(err1){
                    error = err1;
                } else {
                    error = false;
                    responseData.push(data[0]);
                }
            }
        }
        catch(err1){
            return [err1, response];
        }
        
        return [error,response];
    }

    this.assetAccessLevelMappingInsert = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.account_id || 0,
              request.user_asset_id,
              request.target_asset_id || 0,
              request.activity_type_id || 0,
              request.tag_type_id || 0,
              request.segment_id || 0,
              request.product_tag_id || 0,
              request.cluster_tag_id || 0,
              request.workforce_tag_id || 0,
              request.application_id || 0,
              request.access_level_id,
              request.asset_id,
              util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_v1_asset_access_level_mapping_insert', paramsArr);
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

    
    this.assetReportMapping = async (request) => {
        let responseData = [],
            error = true;
        try{
            let loopBase = [];
            let loopKey = "";
            switch(parseInt(request.access_level_id)){
                case 8 : loopBase = JSON.parse(request.activity_types);
                         loopKey = activity_type_id;
                         request.tag_type_id = (JSON.parse(request.tag_types))[0];   
                        break;
                case 20 : loopBase = JSON.parse(request.tag_types);
                         loopKey = tag_type_id;   
                        break;
            }
            for(let i = 0 ; i < loopBase.length ; i++){
                request[loopKey]= loopBase[i];
                let [err1,data] = await self.assetReportMappingInsert(request);
                if(err1){
                    error = err1;
                } else {
                    error = false;
                    responseData.push(data[0]);
                }
            }
        }
        catch(err1){
            return [err1, response];
        }
        
        return [error,response];
    }    

    this.assetReportMappingInsert = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
            request.organization_id,
            request.account_id,
            request.user_asset_id,
            request.target_asset_id||0,
            request.report_type_id ||0,
            request.activity_type_id || 0,
            request.tag_type_id || 0,
            request.segment_id||0,
            request.product_tag_id||0,
            request.cluster_tag_id||0,
            request.workforce_tag_id||0,
            request.application_id||0,
            request.access_level_id,
            request.asset_id,
            util.getCurrentUTCTime()
      ];

        const queryString = util.getQueryString('ds_v1_asset_report_mapping_insert', paramsArr);
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
    this.getAssetsReporteeCount = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
            request.target_asset_id,
            request.widget_timescale,
            request.is_qualified          
        );

        const queryString = util.getQueryString('ds_v1_asset_manager_mapping_select_reportee_count', paramsArr);
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

    this.getAssetAccessLevelMapping = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
            request.access_level_id,
            request.page_start,
            request.page_limit          
        );

        const queryString = util.getQueryString('ds_v1_asset_access_level_mapping_select', paramsArr);
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

    this.getAssetReportMappingSelectAsset = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.organization_id,
            request.access_level_id,
            request.target_asset_id,
            request.is_export,
            request.page_start || 0,
            request.page_limit || 50         
        ]

        const queryString = util.getQueryString('ds_v1_asset_report_mapping_select_asset', paramsArr);
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



}

module.exports = AnalyticsService;
