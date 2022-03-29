/*
    author: bharat krishna masimukku
*/

function AnalyticsService(objectCollection) 
{
    
    const makeRequest = require('request');    
    const nodeUtil = require('util');
    
    const AssetService = require('../../services/assetService');
    const AdminListingService = require('../../Administrator/services/adminListingService');
    const adminListingService = new AdminListingService(objectCollection);
    const assetService = new AssetService(objectCollection);

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
            //global.logger.write('conLog', "get Widget Chart Id | based on widget_type_id | Error: ", err, {});
            util.logError(request,`getwidgetStaticValueDetails get Widget Chart Id | based on widget_type_id | Error %j`, { err1 });
            return [true, {message: "Error creating Widget"}];
        }
        
        //global.logger.write('conLog', 'staticValues : ', {}, {});
        //global.logger.write('conLog', staticValues, {}, {});
        util.logInfo(request,`getwidgetStaticValueDetails  %j`,{staticValues : staticValues, request});

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
            //global.logger.write('conLog', "createAssetBundle | createActivity | Error: ", err, {});
            util.logError(request,`createActivity createAssetBundle | createActivity | Error : %j`, { err });
            return [true, {message: "Error creating activity"}];
        }
        //global.logger.write('conLog', "createAssetBundle | createActivity | activityData: " + activityData, {}, {});
        //console.log("createAssetBundle | createActivity | activityData: ", activityData);
        request.activity_id = activityData.response.activity_id;

        let [widgetErr, widgetResponse] = await this.widgetListInsert(request);
        if(widgetErr) {
            //global.logger.write('conLog', "createAssetBundle | createActivity | Error: ", err, {});
            util.logError(request,`widgetListInsert createAssetBundle | createActivity | Error: %j`, { err });
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

    this.analyticsWidgetAddV1 = async function(request) {
        // console.log(request);
        // console.log(request.widget_type_id)
        request.datetime_log = util.getCurrentUTCTime();
        let widgetId;

        let [actError,activity_type] = await adminListingService.workforceActivityTypeMappingSelectCategory({...request,activity_type_category_id:58})
        request.activity_type_id = activity_type[0].activity_type_id;
        request.activity_type_category_id = 58;
        //Update widget_aggregate_id and widget_chart_id
        //*******************************************************/
        let [err1, staticValues] = await self.getwidgetStaticValueDetails(request);
        
        if(err1) {
            //global.logger.write('conLog', "get Widget Chart Id | based on widget_type_id | Error: ", err, {});
            util.logError(request,`getwidgetStaticValueDetails get Widget Chart Id | based on widget_type_id | Error %j`, { err1 });
            return [true, {message: "Error creating Widget"}];
        }
        
        //global.logger.write('conLog', 'staticValues : ', {}, {});
        //global.logger.write('conLog', staticValues, {}, {});
        util.logInfo(request,`getwidgetStaticValueDetails  %j`,{staticValues : staticValues, request});

        request.widget_chart_id = staticValues[0].widget_type_chart_id;
        request.flag_app = staticValues[0].flag_mobile_enabled;
        request.widget_aggregate_id = 1;
        //********************************************************/

        //Get Asset Name
        await new Promise((resolve)=>{
            activityCommonService.getAssetDetails(request, (err, data, statusCode)=>{
                if(!err && Object.keys(data).length > 0) {
                    //console.log('DATA : ', data.operating_asset_first_name);
                    request.widget_owner_asset_id = data.asset_id;
                    request.widget_owner_asset_name = data.operating_asset_first_name;
                    request.asset_type_id = data.asset_type_id;
                }
                resolve();
            });
        });
        
        //Add Activity - you will get ActivityID
        const [err, activityData] = await createActivity(request);
        if (err) {
            //global.logger.write('conLog', "createAssetBundle | createActivity | Error: ", err, {});
            util.logError(request,`createActivity createAssetBundle | createActivity | Error: %j`, { err });
            return [true, {message: "Error creating activity"}];
        }
        
        //global.logger.write('conLog', "createAssetBundle | createActivity | activityData: " + activityData, {}, {});
        //console.log("createAssetBundle | createActivity | activityData: ", activityData);
        request.activity_id = activityData.response.activity_id;
        await new Promise((resolve)=>{
            setTimeout(()=>{
                return resolve();
            }, 2000);
        });
        updateWidgetsTagType(request);
        if(Number(request.form_id)>0 || Number(request.filter_form_id)>0){
            request.form_id = request.form_id || request.filter_form_id;
            request.field_id = request.field_id || request.filter_field_id;
            let [widgetErr, widgetResponse] = await this.widgetListInsert(request);
            if(widgetErr) {
                //global.logger.write('conLog', "createAssetBundle | createActivity | Error: ", err, {});
                util.logError(request,`widgetListInsert createAssetBundle | createActivity | Error: %j`, { err });
                return [true, {message: "Error creating Widget"}];
            }            

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
            response.message_unique_id = request.message_unique_id;
            response.activity_internal_id = request.activity_internal_id;
            return [false,response];
        }
        else {

        await updateWidgetDetailsInActListV1(request);
        
        }
        return [false,[]]
    };

    async function updateWidgetsTagType(request) {
        let responseData = [],
            error = true;

            let paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                request.tag_id,
                request.tag_type_id
            );

        let queryString = util.getQueryString('ds_p1_activity_list_update_tag', paramsArr);
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
      //  widgetInfo.widget_name = util.replaceDefaultString(request.widget_name);
        widgetInfo.widget_target_value = request.widget_target_value;
        widgetInfo.widget_type_id = util.replaceDefaultString(request.widget_type_id);
        widgetInfo.widget_type_category_id = 3; //util.replaceDefaultString(request.widget_type_category_id);
        widgetInfo.widget_chart_id = util.replaceDefaultNumber(request.widget_chart_id);       
       // widgetInfo.widget_aggregate_id = util.replaceDefaultNumber(request.widget_aggregate_id);      
        widgetInfo.filter_tag_type_id = request.filter_tag_type_id;        
        //widgetInfo.filter_tag_id = util.replaceDefaultNumber(request.filter_tag_id);
        widgetInfo.filter_activity_type_id = util.replaceDefaultNumber(request.filter_activity_type_id);       
        //widgetInfo.filter_activity_status_type_id = request.filter_activity_status_type_id;
        //widgetInfo.filter_activity_status_tag_id = util.replaceDefaultNumber(request.filter_activity_status_tag_id);
        widgetInfo.filter_activity_status_id = util.replaceDefaultNumber(request.filter_activity_status_id);
        widgetInfo.activity_status_id = request.activity_status_id;
        //widgetInfo.filter_account_id = util.replaceDefaultNumber(request.filter_account_id);
        //widgetInfo.filter_workforce_type_id = util.replaceDefaultNumber(request.filter_workforce_type_id);
        //widgetInfo.filter_workforce_id = util.replaceDefaultNumber(request.filter_workforce_id);
        //widgetInfo.filter_asset_id = util.replaceDefaultNumber(request.filter_asset_id);
        //widgetInfo.filter_date_type_id = util.replaceDefaultNumber(request.filter_date_type_id);
        widgetInfo.filter_timeline_id = util.replaceDefaultNumber(request.filter_timeline_id);
        //widgetInfo.filter_timeline_name = util.replaceDefaultNumber(request.filter_timeline_name); 
        widgetInfo.filter_form_id = util.replaceDefaultNumber(request.filter_form_id);
        widgetInfo.filter_field_id = util.replaceDefaultNumber(request.filter_field_id);
        widgetInfo.filter_is_value_considered  = util.replaceDefaultNumber(request.filter_is_value_considered);
        widgetInfo.filter_is_datetime_considered  = util.replaceDefaultNumber(request.filter_is_datetime_considered);
        widgetInfo.filter_tag_id  = util.replaceDefaultNumber(request.filter_tag_id);
        widgetInfo.filter_workforce_id  = util.replaceDefaultNumber(request.filter_workforce_id);
        widgetInfo.filter_workforce_type_id  = util.replaceDefaultNumber(request.filter_workforce_type_id);

      //  request.widget_detailed_info = request.widget_detailed_info || {};
      //  let widgetDetailedInfo = typeof request.widget_detailed_info == 'string' ? JSON.parse(request.widget_detailed_info):request.widget_detailed_info;
               
        activityInlineData.widget_info = widgetInfo;
       // activityInlineData.widget_detailed_info = widgetDetailedInfo;

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
            activity_type_category_id: request.activity_type_category_id || 52, //Widget
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
            // console.log(response)
            const body = JSON.parse(response.body);
            // console.log(body)
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

        const paramsArr = [request.widget_type_id];

        let queryString = util.getQueryString('ds_p1_widget_type_master_select_id', paramsArr);
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
            request.widget_description || "",
            request.activity_inline_data,
            request.flag_app,
            request.widget_type_id,
            request.widget_aggregate_id,
            request.widget_chart_id,
            request.widget_timeline_id || 0,
            util.replaceDefaultNumber(request.entity1_id || request.form_id),
            util.replaceDefaultNumber(request.entity2_id || request.field_id),
            util.replaceDefaultNumber(request.entity3_id),
            util.replaceDefaultNumber(request.entity4_id),
            util.replaceDefaultNumber(request.entity5_id),
            util.replaceDefaultNumber(request.timezone_id),
            1,
            request.widget_owner_asset_id,
            request.activity_id,
            request.activity_type_id,
            request.asset_id,
            request.asset_type_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.log_asset_id || request.asset_id,
            request.log_workforce_id || request.workforce_id,            
            request.datetime_log, //log_datetime
            request.widget_target_value
        );

        let queryString = util.getQueryString('ds_p1_1_widget_list_insert', paramsArr);
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

        let queryString = util.getQueryString('ds_p1_activity_list_update_widget_details', paramsArr);
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

    async function updateWidgetDetailsInActListV1 (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.activity_id,
            request.activity_widget_id || request.widget_id,
            request.widget_type_id,
            request.organization_id,
            request.datetime_log
        );

        let queryString = util.getQueryString('ds_p1_1_activity_list_update_widget_details', paramsArr);
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

    this.updateWidgetInline = async (request)=>{

            let paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                request.activity_inline_data
            );
    
            let queryString = util.getQueryString('ds_v1_activity_list_update_inline_data', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        
                        return [false,[]];
                    } else {
                        // some thing is wrong and have to be dealt
                        
                        //console.log(err);
                        return [true,[]];
                    }
                });
            }
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

        let queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_widget_details', paramsArr);
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
                //All Accounts
                case 0:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    
                    dbCall = "ds_p1_account_list_select_organization";
                    results[0] = await db.callDBProcedureR2(request, dbCall, paramsArray, 1);
                   // console.log(results)
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
            /*
            let idAsset = request.target_asset_id;
            if(idAsset == 0){
                idAsset = request.asset_id;
            } */

            paramsArray = 
            new Array
            (
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.tag_type_id,
                global.analyticsConfig.parameter_flag_sort,
                request.target_asset_id || 0,
                request.asset_id,
                request.page_start || 0,
                request.page_limit || 50
            );

            results[0] = await db.callDBProcedureR2(request, 'ds_p1_2_activity_list_select_management_widgets', paramsArray, 1);
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
            //console.log(JSON.parse(request.filter_tag_type_id).length);
            //arrayTagTypes = JSON.parse(request.filter_tag_type_id);

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
            // if(request.tag_type_id == 130)
            //     request.filter_asset_id = request.asset_id;

            //if([131,132,133,134].includes(request.widget_type_id))
             //   request.filter_asset_id = request.asset_id;

            console.log('request.filter_is_datetime_considered :: '+ request.filter_is_datetime_considered);

            try{
            
            //    for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
            //    {
                    console.log('request.tag_type_id '+request.tag_type_id);

                let params = new Array();
                params.push(parseInt(request.organization_id));
                let organization_List = await db.callDBProcedureR2(request, 'ds_p1_organization_list_select', params, 1);
                request.organization_onhold = organization_List[0].organization_flag_dashboard_onhold || 0;
                request.filter_date_type_id = request.filter_date_type_id && Number(request.filter_date_type_id) >0 ? Number(request.filter_date_type_id) : 1;
                request.filter_organization_id = Number(request.filter_organization_id) >=0 ? Number(request.filter_organization_id) : -1;
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
                        parseInt(request.tag_type_id),
                        parseInt(request.filter_tag_id),
                        parseInt(request.filter_activity_type_id),
                        global.analyticsConfig.activity_id_all, //Activity ID,
                        parseInt(request.filter_activity_status_type_id),
                        parseInt(request.filter_activity_status_tag_id),
                        // parseInt(request.filter_activity_status_id),
                        parseInt(arrayStatuses[0].activity_status_id),
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
                        request.filter_is_lead || 0,
                        request.filter_campaign_activity_id || 0,
                        request.filter_field_entity_1 || '',
                        request.filter_field_entity_2 || '',
                        request.filter_field_entity_3 || '',
                        request.filter_field_entity_4 || '',
                        request.filter_field_entity_5 || '',
                        request.organization_onhold || 0,
                        request.widget_activity_id || 0,
                        request.filter_organization_id,
                        request.filter_asset_tag_1 || 0,
                        request.filter_asset_tag_2 || 0,
                        request.filter_asset_tag_3 || 0,
                        request.filter_asset_tag_type_1 || 0,
                        request.filter_asset_tag_type_2 || 0,
                        request.filter_asset_tag_type_3 || 0,
                        request.asset_id,
                        parseInt(request.page_start) || 0,
                        parseInt(request.page_limit) || 50
                    );

                    let counter = 1; 
                    let responseArray = [];
                    if(request.widget_type_id == 45 || request.widget_type_id == 46){
                        counter = 5
                   
                        for(let iteratorM = 0; iteratorM < counter; iteratorM++){
                             paramsArray.push(iteratorM);
                            tempResult = await db.callDBProcedureR2(request, 'ds_v2_3_activity_search_list_select_widget_values', paramsArray, 1); 
                            paramsArray.pop();
                            responseArray.push(tempResult[0])
                        }
                        results[iterator] =
                            (
                                {
                                    "tag_type_id": request.tag_type_id,
                                    "result": responseArray,
                                }
                            );
                        iterator++
                    } else if ([128, 129, 130].includes(parseInt(request.widget_type_id))) {
                        request.verticalData = global.analyticsConfig.vertical;
                        //console.log("128 129 130 request.verticalData ",request.verticalData)
                        results = [];
                        results = await this.prepareWidgetData(request, paramsArray);
                    } else {
                        console.log(paramsArray);
                        paramsArray.push(0);
                        tempResult = await db.callDBProcedureR2(request, 'ds_v2_3_activity_search_list_select_widget_values', paramsArray, 1); paramsArray.pop();
                        console.log(tempResult);
                     //   let widgetTypes = [23,24,48,49,63,66,37,38,65,61,67,53,54, 39, 40, 41, 42];
                     //   if(widgetTypes.includes(request.widget_type_id)){
                        if(request.widget_type_id == 23 || request.widget_type_id == 24 || request.widget_type_id == 25 || request.widget_type_id == 37 || request.widget_type_id == 38
                         || request.widget_type_id == 48 || request.widget_type_id == 49 || request.widget_type_id == 65 || request.widget_type_id == 61 || request.widget_type_id == 34  || request.widget_type_id == 35
                         || request.widget_type_id == 63 || request.widget_type_id == 66 || request.widget_type_id == 67 || request.widget_type_id == 53 || request.widget_type_id == 54
                         || request.widget_type_id == 39 || request.widget_type_id == 40 || request.widget_type_id == 41 || request.widget_type_id == 42 || request.widget_type_id == 202 || request.widget_type_id == 203
                          
                          ){
                            results[iterator] =
                            (
                                {
                                    "tag_type_id": request.tag_type_id,
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
                                    "tag_type_id": request.tag_type_id,
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
                                    "tag_type_id": request.tag_type_id,
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
                                    "tag_type_id": request.tag_type_id,
                                    "status_type_id": request.filter_activity_status_type_id,
                                    "result": totalValue,
                                }
                            );
                        }
                    }
                    iterator++;
            //    }

            }catch(e){
                console.log('error ::', e);
            }

           // console.log("results :: ",results)
            return results;
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    this.prepareWidgetData = async (request, paramsArray) => {

        return new Promise((resolve) => {

            let requestObj = {
                "organization_id": request.organization_id,
                "account_id": request.account_id,
                "workforce_id": request.workforce_id,
                "segment_id": request.segment_id || 0,
                "target_asset_id": request.asset_id,
                "tag_type_id": request.tag_type_id || 0,
                "tag_id": request.tag_id || 0,
                "cluster_tag_id": request.cluster_tag_id || 0,
                "vertical_tag_id": request.vertical_tag_id || 0,
                "flag": 28,
                "page_start": request.page_start || 0,
                "page_limit": request.page_limit || 50
            };

            assetService.assetAccessLevelMappingSelectFlagV2(requestObj)
                .then(async (data) => {
                    console.log("1");
                    let verticalMap = new Map();

                    if (data !== undefined && data.length >= 2) {

                        let verticalsArray = data[1];
                        for (index = 0; index < verticalsArray.length; index++) {

                            let vertical = verticalsArray[index];
                            if (vertical !== undefined && vertical.hasOwnProperty('tag_id')) {

                                let tag_id = vertical.tag_id;
                                if (tag_id !== null && tag_id > 0) {

                                    let tag_name = verticalsArray[index].tag_name;
                                    if ("All" !== tag_name) {
                                        verticalMap.set(tag_id, tag_name);
                                    }

                                }

                            }

                        }
                    }
                    console.log("2");
                    
                    if (verticalMap.size == 0) {
                        console.log("3");
                        console.log("Vertical details not available, so need to prepare data for widget_type_id = " + request.widget_type_id);
                        let results = new Array();
                        results.push(request.verticalData[request.widget_type_id]);
                        resolve(results);

                    } else { 
                        console.log("4");
                        request.widget_type_id = Number(request.widget_type_id) || 0;
                        switch (request.widget_type_id) {
                            
                            case 128: {
                                console.log("128request.widget_type_id "+request.widget_type_id);
                                let results = new Array();
                                resolve(await this.prepareDataForWidgetType128(request, paramsArray, verticalMap));
                                break;
                            }
                            case 129: {
                                console.log("129request.widget_type_id "+request.widget_type_id);
                                resolve(await this.prepareDataForWidgetType129(request, paramsArray, verticalMap));
                                break;
                            }
                            case 130: {
                                console.log("130request.widget_type_id "+request.widget_type_id);
                                resolve(await this.prepareDataForWidgetType130(request, paramsArray, verticalMap));
                                break;
                            }
                            default:{
                                console.log("defaultrequest.widget_type_id "+request.widget_type_id);
                            }
                        }

                    }
                })
                .catch((error) => {
                    console.log("prepareWidgetData : Exception : ");
                    console.log(error);
                    resolve(request.verticalData.error_response);
                });
        });

    }

    this.prepareDataForWidgetType128 = async (request, paramsArray, verticalMap) => {

        try {
            console.log("prepareDataForWidgetType128 :: ");
            let results = new Array();
            let widgetFlags = new Array();
            let countTotal = new Array();
            let quantityTotal = new Array();
            let valueTotal = new Array();
            for (let i = 0; i < 2; i++) {
                widgetFlags[i] = i + 1;
                countTotal[i] = 0; quantityTotal[i] = 0; valueTotal[i] = 0;
            }
            let verticalResponseMap = new Map();
            let isError = false;
            results.push(request.verticalData[request.widget_type_id]);
            let verticalResponseAdditonalMap = new Map();

            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let responseJson = {};
                if (isError) {
                    break;
                }

                //paramsArray[18] = util.getFirstDayOfCurrentMonthToIST();
                //paramsArray[19] = util.getLastDayOfCurrentMonthToIST();
                paramsArray[15] = 0;
                paramsArray[16] = 0;
                paramsArray[1] = request.filter_date_type_id;
                if (widgetFlags[iteratorM] == 2) {
                    paramsArray[1] = 2;
                    paramsArray[15] = 1;
                    paramsArray[16] = 148;
                }
                paramsArray.push(widgetFlags[iteratorM]);
                paramsArray[10] = request.asset_id;

                responseJson.datetime_start = paramsArray[18];
                responseJson.datetime_end = paramsArray[19];
                responseJson.filter_activity_status_type_id = paramsArray[15];
                responseJson.filter_activity_status_tag_id = paramsArray[16];
                responseJson.filter_date_type_id = paramsArray[1];
                responseJson.filter_asset_id = paramsArray[10];
                responseJson.sequence_id = widgetFlags[iteratorM];
                verticalResponseAdditonalMap.set(iteratorM, responseJson);

                const queryString = util.getQueryString('ds_v2_3_activity_search_list_select_widget_values_oppty', paramsArray);
                if (queryString !== '') {

                    await db.executeQueryPromise(1, queryString, request)
                        .then((data) => {
                            
                            paramsArray.pop();
                            let responseMap = new Map();
                            for (index = 0; index < data.length; index++) {
                                let resData = {};
                                resData.count = data[index].count;
                                resData.quantity = data[index].quantity;
                                resData.value = data[index].value;
                                responseMap.set(data[index].vertical_tag_id, resData);
                            }
                            verticalResponseMap.set(iteratorM, responseMap);

                        })
                        .catch((err) => {
                            console.log("Error : ");
                            console.log(err);
                            isError = true;
                        })
                }
            }

            if (isError) {
                return Promise.resolve(request.verticalData.error_response);
            }
            let verticalValueFlgArray = new Array();

            for (let entry of verticalMap.entries()) {

                let vertical_tag_id = 0,
                    vertical_name = null;
                vertical_tag_id = entry[0];
                vertical_name = entry[1];
                let verticalValueArray = new Array();

                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    verticalValueArray[iteratorM] = 0; verticalValueFlgArray[iteratorM] = {};
                    let responseJson = Object.assign({}, verticalResponseAdditonalMap.get(iteratorM));
                    responseJson.vertical_tag_id = vertical_tag_id;
                    responseJson.vertical_name = vertical_name;

                    if (verticalResponseMap.has(iteratorM)) {

                        let map = verticalResponseMap.get(iteratorM);
                        if (map.has(vertical_tag_id)) {
                            verticalValueArray[iteratorM] = map.get(vertical_tag_id);
                        }

                    }

                    countTotal[iteratorM] = countTotal[iteratorM] + (verticalValueArray[iteratorM].count || 0);
                    quantityTotal[iteratorM] = quantityTotal[iteratorM] + (verticalValueArray[iteratorM].quantity || 0);
                    valueTotal[iteratorM] = valueTotal[iteratorM] + (verticalValueArray[iteratorM].value || 0);
                    verticalValueFlgArray[iteratorM] = responseJson;
                }

                let resultData = {};
                resultData.vertical_name = vertical_name;
                let cnt = 1;
                for (let j = 0; j < widgetFlags.length; j++) {
                    resultData["flag_" + cnt] = verticalValueArray[j].count || 0;
                    resultData["flag_" + cnt + "_1"] = verticalValueFlgArray[j]; cnt++;
                    resultData["flag_" + cnt] = verticalValueArray[j].quantity || 0;
                    resultData["flag_" + cnt + "_1"] = verticalValueFlgArray[j]; cnt++;
                    resultData["flag_" + cnt] = parseFloat(verticalValueArray[j].value || 0).toFixed(2);	
                    resultData["flag_" + cnt + "_1"] = verticalValueFlgArray[j]; cnt++;
                }
                results.push(resultData);
            }

            let verticalValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                verticalValueFlgArrayTotal[i] = {};
                verticalValueFlgArrayTotal[i] = Object.assign({}, verticalValueFlgArray[i]);
                verticalValueFlgArrayTotal[i].vertical_tag_id = 0;
                delete verticalValueFlgArrayTotal[i]['vertical_name'];
            }

            verticalResponseAdditonalMap.clear();

            let resultData = {};
            resultData.vertical_name = "Total";
            let cnt = 1;
            for (let j = 0; j < widgetFlags.length; j++) {
                resultData["flag_" + cnt] = countTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = quantityTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = parseFloat(valueTotal[j] || 0).toFixed(2);
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
            }
            results.push(resultData);
            return Promise.resolve(results);
        } catch (error) {
            console.log("error :; ", error);
            return Promise.resolve(request.verticalData.error_response);
        }
    }

    this.prepareDataForWidgetType129 = async (request, paramsArray, verticalMap) => {
        console.log("prepareDataForWidgetType129 :: ");
        try {

            let results = new Array();
            let countTotal = new Array();
            let quantityTotal = new Array();
            let activityStatusTypeIdArray = new Array(0, 0, 0, 0, 1, 1, 1, 1);
            let valueTotal = new Array();
            let widgetFlags = new Array();
            for (let i = 0; i < 8; i++) {
                widgetFlags[i] = i + 1;
                countTotal[i] = 0;
                quantityTotal[i] = 0;
                valueTotal[i] = 0;
            }
            let verticalResponseMap = new Map();
            let verticalResponseAdditonalMap = new Map();
            let isError = false;

            results.push(request.verticalData[request.widget_type_id]);
            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let responseJson = {};

                if (isError) {
                    break;
                }

                paramsArray[15] = activityStatusTypeIdArray[iteratorM];
                let status_tags = request.verticalData["status_tags"];
                let key = request.verticalData["status_tags_array"][iteratorM];
                paramsArray[16] = status_tags[key];
                paramsArray.push(widgetFlags[iteratorM]);
                paramsArray[10] = request.asset_id;

                responseJson.filter_activity_status_tag_id = paramsArray[16];
                responseJson.filter_asset_id = paramsArray[10];
                responseJson.sequence_id = widgetFlags[iteratorM];
                verticalResponseAdditonalMap.set(iteratorM, responseJson);

                const queryString = util.getQueryString('ds_v2_3_activity_search_list_select_widget_values_oppty', paramsArray);
                if (queryString !== '') {

                    await db.executeQueryPromise(1, queryString, request)
                        .then((data) => {

                            paramsArray.pop();
                            let responseMap = new Map();
                            for (index = 0; index < data.length; index++) {
                                let resData = {};
                                resData.count = data[index].count;
                                resData.quantity = data[index].quantity;    
                                resData.value = data[index].value;
                                responseMap.set(data[index].vertical_tag_id, resData);
                            }
                            verticalResponseMap.set(iteratorM, responseMap);

                        })
                        .catch((err) => {
                            console.log("Error : ");
                            console.log(err);
                            isError = true;
                        })
                }
            }

            if (isError) {
                return Promise.resolve(request.verticalData.error_response);
            }

            let verticalValueFlgArray = new Array();
            for (let entry of verticalMap.entries()) {

                let vertical_tag_id = 0,
                    vertical_name = null,
                    value = 0;
                vertical_tag_id = entry[0];
                vertical_name = entry[1];
                let verticalValueArray = new Array();
                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    verticalValueArray[iteratorM] = 0; verticalValueFlgArray[iteratorM] = {};
                    let responseJson = Object.assign({}, verticalResponseAdditonalMap.get(iteratorM));
                    responseJson.vertical_tag_id = vertical_tag_id;
                    responseJson.vertical_name = vertical_name;

                    if (verticalResponseMap.has(iteratorM)) {

                        let map = verticalResponseMap.get(iteratorM);
                        if (map.has(vertical_tag_id)) {
                            verticalValueArray[iteratorM] = map.get(vertical_tag_id);
                        }

                    }
                    countTotal[iteratorM] = countTotal[iteratorM] + (verticalValueArray[iteratorM].count || 0);
                    quantityTotal[iteratorM] = quantityTotal[iteratorM] + (verticalValueArray[iteratorM].quantity || 0);
                    valueTotal[iteratorM] = valueTotal[iteratorM] + (verticalValueArray[iteratorM].value || 0);
                    verticalValueFlgArray[iteratorM] = responseJson;
                }

                let resultData = {};
                resultData.vertical_name = vertical_name;
                let cnt = 1;
                for (let j = 0; j < widgetFlags.length; j++) {
                    resultData["flag_" + cnt] = verticalValueArray[j].count || 0;
                    resultData["flag_" + cnt + "_1"] = verticalValueFlgArray[j]; cnt++;
                    resultData["flag_" + cnt] = verticalValueArray[j].quantity || 0;
                    resultData["flag_" + cnt + "_1"] = verticalValueFlgArray[j]; cnt++;
                    resultData["flag_" + cnt] = parseFloat(verticalValueArray[j].value || 0).toFixed(2);
                    resultData["flag_" + cnt + "_1"] = verticalValueFlgArray[j]; cnt++;
                }
                results.push(resultData);

            }
            let verticalValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                verticalValueFlgArrayTotal[i] = {};
                verticalValueFlgArrayTotal[i] = Object.assign({}, verticalValueFlgArray[i]);
                verticalValueFlgArrayTotal[i].vertical_tag_id = 0;
                delete verticalValueFlgArrayTotal[i]['vertical_name'];
            }

            verticalResponseAdditonalMap.clear();

            let resultData = {};
            resultData.vertical_name = "Total";
            let cnt = 1;
            for (let j = 0; j < widgetFlags.length; j++) {
                resultData["flag_" + cnt] = countTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = quantityTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = parseFloat(valueTotal[j] || 0).toFixed(2);
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
            }
            results.push(resultData);
            return Promise.resolve(results);

        } catch (error) {
            console.log("error :; ", error);
            return Promise.resolve(request.verticalData.error_response);
        }
    }

    this.prepareDataForWidgetType130 = async (request, paramsArray, verticalMap) => {

        try {
            console.log("prepareDataForWidgetType130 :: ");
            let results = new Array();
            let total = new Array();
            let countTotal = new Array();
            let quantityTotal = new Array();
            let valueTotal = new Array();
            let widgetFlags = new Array();
            for (let i = 0; i < 7; i++) {
                widgetFlags[i] = i + 1;
                countTotal[i] = 0; quantityTotal[i] = 0; valueTotal[i] = 0;
            }
            let verticalFlags = new Array();
            let verticalResponseMap = new Map();
            let verticalResponseAdditonalMap = new Map();
            let isError = false;

            results.push(request.verticalData[request.widget_type_id]);
            let status_tags = request.verticalData["status_tags"];

            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let responseJson = {};
                if (isError) {
                    break;
                }

                if (widgetFlags[iteratorM] == 1) {
                    paramsArray[1] = 1;
                    paramsArray[15] = 2;
                    paramsArray[16] = 0;
                    paramsArray[18] = util.getFirstDayOfCurrentMonthToIST();
                    paramsArray[19] = util.getLastDayOfCurrentMonthToIST();
                }
                if (widgetFlags[iteratorM] >= 2 && widgetFlags[iteratorM] <= 5) {
                    paramsArray[1] = 2;
                    paramsArray[15] = 1;
                    paramsArray[18] = util.getFirstDayOfCurrentMonthToIST();
                    paramsArray[19] = util.getLastDayOfCurrentMonthToIST();
                    if (widgetFlags[iteratorM] == 2) {
                        let key = request.verticalData["status_tags_array"][4];
                        paramsArray[16] = status_tags[key];
                    }
                    if (widgetFlags[iteratorM] == 3) {
                        let key = request.verticalData["status_tags_array"][5];
                        paramsArray[16] = status_tags[key];
                    }
                    if (widgetFlags[iteratorM] == 4) {
                        let key = request.verticalData["status_tags_array"][6];
                        paramsArray[16] = status_tags[key];
                    }
                    if (widgetFlags[iteratorM] == 5) {
                        let key = request.verticalData["status_tags_array"][7];
                        paramsArray[16] = status_tags[key];
                    }
                }
                if (widgetFlags[iteratorM] == 6) {
                    paramsArray[1] = 3;
                    paramsArray[15] = 0;
                    paramsArray[16] = 0;
                    paramsArray[18] = util.getFirstDayOfNextMonthToIST();
                    paramsArray[19] = util.getLastDayOfNextMonthToIST();
                }
                if (widgetFlags[iteratorM] == 7) {
                    paramsArray[1] = 3;
                    paramsArray[15] = 0;
                    paramsArray[16] = 0;
                    paramsArray[18] = util.getFirstDayOfCurrentQuarterToIST();
                    paramsArray[19] = util.getLastDayOfCurrentQuarterToIST();
                }
                paramsArray.push(widgetFlags[iteratorM]);
                paramsArray[10] = request.asset_id;

                responseJson.filter_date_type_id = paramsArray[1];
                responseJson.filter_activity_status_type_id = paramsArray[15];
                responseJson.datetime_start = paramsArray[18];
                responseJson.datetime_end = paramsArray[19];
                responseJson.filter_asset_id = paramsArray[10];
                responseJson.sequence_id = widgetFlags[iteratorM];

                verticalResponseAdditonalMap.set(iteratorM, responseJson);

                const queryString = util.getQueryString('ds_v2_3_activity_search_list_select_widget_values_oppty', paramsArray);
                if (queryString !== '') {

                    await db.executeQueryPromise(1, queryString, request)
                        .then((data) => {

                            paramsArray.pop();
                            let responseMap = new Map();
                            for (index = 0; index < data.length; index++) {
                                let resData = {};
                                resData.count = data[index].count;
                                resData.quantity = data[index].quantity;
                                resData.value = data[index].value;
                                responseMap.set(data[index].vertical_tag_id, resData);
                            }
                            verticalResponseMap.set(iteratorM, responseMap);

                        })
                        .catch((err) => {
                            console.log("Error : ");
                            console.log(err);
                            isError = true;
                        })
                }
            }

            if (isError) {
                return Promise.resolve(request.verticalData.error_response);
            }
            let verticalValueFlgArray = new Array();
            for (let entry of verticalMap.entries()) {

                let vertical_tag_id = 0,
                    vertical_name = null,
                    value = 0;
                vertical_tag_id = entry[0];
                vertical_name = entry[1];
                let verticalValueArray = new Array();


                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    verticalValueArray[iteratorM] = 0; verticalValueFlgArray[iteratorM] = {};
                    let responseJson = Object.assign({}, verticalResponseAdditonalMap.get(iteratorM));
                    responseJson.vertical_tag_id = vertical_tag_id;
                    responseJson.vertical_name = vertical_name;

                    if (verticalResponseMap.has(iteratorM)) {

                        let map = verticalResponseMap.get(iteratorM);
                        if (map.has(vertical_tag_id)) {
                            verticalValueArray[iteratorM] = map.get(vertical_tag_id);
                        }

                    }
                    countTotal[iteratorM] = countTotal[iteratorM] + (verticalValueArray[iteratorM].count || 0);
                    quantityTotal[iteratorM] = quantityTotal[iteratorM] + (verticalValueArray[iteratorM].quantity || 0);
                    valueTotal[iteratorM] = valueTotal[iteratorM] + (verticalValueArray[iteratorM].value || 0);
                    verticalValueFlgArray[iteratorM] = responseJson;
                }

                let resultData = {};
                resultData.vertical_name = vertical_name;
                let cnt = 1;
                for (let j = 0; j < widgetFlags.length; j++) {
                    resultData["flag_" + cnt] = verticalValueArray[j].count || 0;
                    resultData["flag_" + cnt + "_1"] = verticalValueFlgArray[j]; cnt++;
                    resultData["flag_" + cnt] = verticalValueArray[j].quantity || 0;
                    resultData["flag_" + cnt + "_1"] = verticalValueFlgArray[j]; cnt++;
                    resultData["flag_" + cnt] = parseFloat(verticalValueArray[j].value || 0).toFixed(2);
                    resultData["flag_" + cnt + "_1"] = verticalValueFlgArray[j]; cnt++;
                }
                results.push(resultData);
            }

            let verticalValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                verticalValueFlgArrayTotal[i] = {};
                verticalValueFlgArrayTotal[i] = Object.assign({}, verticalValueFlgArray[i]);
                verticalValueFlgArrayTotal[i].vertical_tag_id = 0;
                delete verticalValueFlgArrayTotal[i]['vertical_name'];
            }

            verticalResponseAdditonalMap.clear();

            let resultData = {};
            resultData.vertical_name = "Total";
            let cnt = 1;
            for (let j = 0; j < widgetFlags.length; j++) {
                resultData["flag_" + cnt] = countTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = quantityTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = parseFloat(valueTotal[j] || 0).toFixed(2);
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
            }
            results.push(resultData);
            return Promise.resolve(results);

        } catch (error) {
            console.log("error :; ", error);
            return Promise.resolve(request.verticalData.error_response);
        }
    }


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
            //console.log(JSON.parse(request.filter_tag_type_id).length);
           // arrayTagTypes = JSON.parse(request.filter_tag_type_id);

            //Get the number of selections for status category
            console.log(JSON.parse(request.filter_activity_status_type_id).length);
            arrayStatusTypes = JSON.parse(request.filter_activity_status_type_id);

            console.log("request.activity_status_id :: "+request.activity_status_id);
            let activityStatusId = 0;
            let arrayStatuses = new Array();
            if(request.hasOwnProperty("activity_status_id")){
                //console.log(JSON.parse(request.activity_status_id).length);
                if(request.activity_status_id > 0){
                    activityStatusId = request.activity_status_id;
                }else if(request.activity_status_id != 0){
                    arrayStatuses = JSON.parse(request.activity_status_id);
                    activityStatusId = arrayStatuses[0].activity_status_id;
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

            //if(request.tag_type_id == 130)
            //request.filter_asset_id = request.asset_id;
            
            //if([131,132,133,134].includes(request.widget_type_id))
            //    request.filter_asset_id = request.asset_id;
            
          //  for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
          //  {
                console.log('request.tag_type_id '+request.tag_type_id);
            let params = new Array();
            params.push(parseInt(request.organization_id));
            let organization_List = await db.callDBProcedureR2(request, 'ds_p1_organization_list_select', params, 1);
            request.organization_onhold = organization_List[0].organization_flag_dashboard_onhold || 0;
            request.filter_date_type_id = request.filter_date_type_id && Number(request.filter_date_type_id) >0 ? Number(request.filter_date_type_id):1;
            request.filter_organization_id = Number(request.filter_organization_id) >=0 ? Number(request.filter_organization_id) : -1;
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
                    parseInt(request.filter_workforce_type_id) || 0,
                    parseInt(request.filter_workforce_id) || 0,
                    parseInt(request.filter_asset_id),
                    parseInt(request.tag_type_id),
                    parseInt(request.filter_tag_id) || 0,
                    parseInt(request.filter_activity_type_id),
                    global.analyticsConfig.activity_id_all, //Activity ID,
                    parseInt(request.filter_activity_status_type_id),
                    parseInt(request.filter_activity_status_tag_id),
                    //parseInt(arrayStatuses[0].activity_status_id),
                    parseInt(activityStatusId),
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
                    request.filter_is_lead || 0,
                    request.filter_campaign_activity_id || 0,
                    parseInt(request.page_start) || 0,
                     parseInt(request.page_limit) || 100,
                     request.filter_field_entity_1 || '',
                     request.filter_field_entity_2 || '',
                     request.filter_field_entity_3 || '',
                     request.filter_field_entity_4 || '',
                     request.filter_field_entity_5 || '',
                     request.organization_onhold || 0,
                     request.widget_activity_id || 0,
                     request.filter_organization_id,
                     request.filter_asset_tag_1 || 0,
                     request.filter_asset_tag_2 || 0,
                     request.filter_asset_tag_3 || 0,
                     request.filter_asset_tag_type_1 || 0,
                     request.filter_asset_tag_type_2 || 0,
                     request.filter_asset_tag_type_3 || 0,
                     request.asset_id
                 );
            
            let queryString = util.getQueryString('ds_v2_3_activity_search_list_select_widget_drilldown_search', paramsArray);
                if (queryString !== '') {
                    tempResult = await (db.executeQueryPromise(1, queryString, request));
                }
               // tempResult = await db.callDBProcedureR2(request, 'ds_v1_1_activity_search_list_select_widget_drilldown', paramsArray, 1);
                console.log(tempResult.length);

                results[iterator] =
                (
                    {
                        "tag_type_id": request.tag_type_id,
                        "status_type_id": request.filter_activity_status_type_id,
                        "result": tempResult,
                    }
                );

                iterator++; 

          //  }

            return results;
        }
        catch(error)
        {
            console.log("error :; ",error);
            return Promise.reject(error);
        }
    };

    this.getManagementWidgetDrilldownSA = async (request) => 
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
            //console.log(JSON.parse(request.filter_tag_type_id).length);
           // arrayTagTypes = JSON.parse(request.filter_tag_type_id);

            //Get the number of selections for status category
            console.log(JSON.parse(request.filter_activity_status_type_id).length);
            arrayStatusTypes = JSON.parse(request.filter_activity_status_type_id);

            console.log("request.activity_status_id :: "+request.activity_status_id);
            let activityStatusId = 0;
            let arrayStatuses = new Array();
            if(request.hasOwnProperty("activity_status_id")){
                //console.log(JSON.parse(request.activity_status_id).length);
                if(request.activity_status_id > 0){
                    activityStatusId = request.activity_status_id;
                }else if(request.activity_status_id != 0){
                    arrayStatuses = JSON.parse(request.activity_status_id);
                    activityStatusId = arrayStatuses[0].activity_status_id;
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

            //if(request.tag_type_id == 130)
            //request.filter_asset_id = request.asset_id;
            
            //if([131,132,133,134].includes(request.widget_type_id))
            //    request.filter_asset_id = request.asset_id;
            
          //  for (let iteratorX = 0, arrayLengthX = arrayTagTypes.length; iteratorX < arrayLengthX; iteratorX++) 
          //  {
                console.log('request.tag_type_id '+request.tag_type_id);
                request.filter_organization_id = Number(request.filter_organization_id) >=0 ? Number(request.filter_organization_id) : -1;
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
                    parseInt(request.tag_type_id),
                    parseInt(request.filter_tag_id),
                    parseInt(request.filter_activity_type_id),
                    global.analyticsConfig.activity_id_all, //Activity ID,
                    parseInt(request.filter_activity_status_type_id),
                    parseInt(request.filter_activity_status_tag_id),
                    //parseInt(arrayStatuses[0].activity_status_id),
                    parseInt(activityStatusId),
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
                    request.filter_is_lead || 0,
                    request.filter_campaign_activity_id || 0,
                    parseInt(request.vertical_tag_id) || 0,
                    parseInt(request.page_start) || 0,
                    parseInt(request.page_limit) || 100,
                     parseInt(request.sequence_id),
                     parseInt(request.target_asset_id) || 0,
                     request.filter_field_entity_1 || '',
                     request.filter_field_entity_2 || '',
                     request.filter_field_entity_3 || '',
                     request.filter_field_entity_4 || '',
                     request.filter_field_entity_5 || '',
                     request.organization_onhold || 0,
                     request.widget_activity_id || 0,
                     request.filter_organization_id,
                     request.filter_asset_tag_1 || 0,
                     request.filter_asset_tag_2 || 0,
                     request.filter_asset_tag_3 || 0,
                     request.filter_asset_tag_type_1 || 0,
                     request.filter_asset_tag_type_2 || 0,
                     request.filter_asset_tag_type_3 || 0,
                     request.asset_id
                    );
            
            let queryString = util.getQueryString('ds_v2_3_activity_search_list_select_widget_drilldown_oppty', paramsArray);
                if (queryString !== '') {
                    tempResult = await (db.executeQueryPromise(1, queryString, request));
                }
               // tempResult = await db.callDBProcedureR2(request, 'ds_v1_1_activity_search_list_select_widget_drilldown', paramsArray, 1);
                console.log(tempResult.length);

                results[iterator] =
                (
                    {
                        "tag_type_id": request.tag_type_id,
                        "status_type_id": request.filter_activity_status_type_id,
                        "result": tempResult,
                    }
                );

                iterator++; 

          //  }

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

        let queryString = "";
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
                
                queryString = util.getQueryString('ds_v1_application_tag_type_mapping_select', paramsArray);
                await db.executeQueryPromise(1, queryString, request)
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
                
                queryString = util.getQueryString('ds_v1_segment_activity_type_mapping_select', paramsArray);
                await db.executeQueryPromise(1, queryString, request)
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

    this.insertWidgetTypeV1 = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.widget_type_name,
          request.widget_type_description,
          request.widget_type_category_id,
          request.widget_type_chart_id,
          request.flag_mobile_enabled,
          request.widget_type_flag_target,
          request.widget_type_flag_sip_enabled,
          request.widget_type_flag_role_enabled,
          request.widget_type_flag_prediction_enabled,
          request.widget_type_sip_contribution_percentage,
          request.widget_type_inline_data,
          request.widget_type_measurement_id,
          request.widget_type_measurement_unit,
          request.widget_type_timeline_id,
          request.asset_tag_id,
          request.customer_account_type_id,
          request.period_type_id,
          request.widget_type_start_datetime,
          request.widget_type_end_datetime,
          request.asset_type_id,
          request.asset_type_sequence_id,
          request.activity_type_id,
          request.tag_id,
          request.level_id,
          request.data_entity_id_1,
          request.data_entity_name_1,
          request.data_entity_id_2,
          request.data_entity_name_2,
          request.data_entity_id_3,
          request.data_entity_name_3,
          request.data_entity_id_4,
          request.data_entity_name_4,
          request.data_entity_id_5,
          request.data_entity_name_5,
          request.widget_type_code,
          request.workforce_id,
          request.workforce_tag_id,
          request.workforce_type_id,
          request.account_id,
          request.organization_id,
          request.asset_id,
          util.getCurrentUTCTime(),
          request.non_product_id,
          request.gate_condition_id,
          request.payment_type_id
        );
        const queryString = util.getQueryString('ds_p3_widget_type_master_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    console.log(data)
                    responseData = data;
                    error = false;
                    const [err1,resData] = widgetTypeHistoryInsert({...request,...data[0]},3101)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [false, responseData];
    }

    this.widgetTypeMasterUpdate = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.widget_type_id,
            request.widget_type_name,
            request.flag_mobile_enabled,
            request.widget_type_flag_target,
            request.widget_type_flag_sip_enabled,
            request.widget_type_flag_role_enabled,
            request.widget_type_flag_prediction_enabled,
            request.widget_type_sip_contribution_percentage,
            request.widget_type_inline_data,
            request.organization_id,
            request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_widget_type_master_update', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    const [err1,resData] = widgetTypeHistoryInsert(request,3102)
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
                  const [err1,resData] = widgetTypeHistoryInsert(request,3103)
                  error = false;
              })
              .catch((err) => {
                  error = err;
              })
        }

        return [error, responseData]
    }

    async function widgetTypeHistoryInsert(request,id){
        let responseData = [],
        error = true;
    
    const paramsArr = [  
          request.organization_id,  
          request.widget_type_id,
          id,
          util.getCurrentUTCTime()
    ];

    const queryString = util.getQueryString('ds_p1_widget_type_master_history_insert', paramsArr);
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
                .then(async (data) => {

                    responseData = data;
                    error = false;

                    if (9 != request.report_type_id) {

                        request.report_id = data[0].report_id;
                        request.report_status_id = 1;
                        request.report_url = "";

                        let [err, responseData] = await this.insertAnalyticsReportTransaction(request);
                        if (err) {
                            error = err;
                            console.log("error = " + error);
                        }
                    }

                })
                .catch((err) => {
                    error = err;
                })
        }

        return [error, responseData]
    }

    this.addReportV1 = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.account_id,
          request.workforce_id,
          request.target_asset_id,
          request.report_type_id,
          request.report_name,
          request.report_inline_data,
          request.report_recursive_enabled || 0,
          request.report_notified_enabled || 1,
          request.report_recursive_type_id || 1,
          request.report_access_level_id || 1,
          request.activity_id || 0,
          request.report_start_time || '18:30:00',
          request.report_end_time || '18:29:00',
          request.report_next_start_datetime,
          request.report_next_end_datetime,
          request.period_type_id || 0,
          request.period_start_datetime || "",
          request.period_end_datetime || "",
          request.data_entity_1 || "",
          request.data_entity_2 || "",
          request.data_entity_3 || "",
          request.data_entity_4 || "",
          request.data_entity_5 || "",
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('dm_v1_1_report_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                    if (9 != request.report_type_id) {

                        request.report_id = data[0].report_id;
                        request.report_status_id = 1;
                        request.report_url = "";

                        let [err, responseData] = await this.insertAnalyticsReportTransaction(request);
                        if (err) {
                            error = err;
                            console.log("error = " + error);
                        }
                    }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
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
                        let sme = [69,70,71,72];
                        let non_sme = [69,70,71,72];
                        let total_target = 0;
                        let total_achieved = 0;
                        let total_percentage = 0;  
                        if(responseData[0].is_channel == 1){
                            for(let i = 0 ; i <responseData.length; i++ ){
                                console.log("responseData[i].channel_asset_id :: "+responseData[i].channel_asset_id);
                                request.channel_asset_id = responseData[i].channel_asset_id;

                                for(let j = 0; j < sme.length; j++){

                                    request.account_activity_id = 0;
                                    request.widget_type_id = sme[j];                                    
                                    
                                    let [widgetErr, widgetData] = await self.getAssetAccountTargetListV1(request);
                                    console.log('widgetData ',widgetData);

                                    if(widgetData.length > 0){
                                        total_target = widgetData[0].target + total_target;
                                        total_achieved = widgetData[0].achieved + total_achieved;

                                        widgetData[0].target = widgetData[0].target?widgetData[0].target.toFixed(2):0;
                                        widgetData[0].achieved = widgetData[0].achieved?widgetData[0].achieved.toFixed(2):0;
                                        widgetData[0].percentage = widgetData[0].percentage?widgetData[0].percentage.toFixed(2):0;
                                    }
                                    
                                    //responseData[i].widget_data.push(widgetData);
                                    if(sme[j] == 69)
                                    responseData[i].revenue_mobility = widgetData;
                                    if(sme[j] == 70)
                                    responseData[i].revenue_non_mobility = widgetData;
                                    if(sme[j] == 71)
                                    responseData[i].ob_mobility = widgetData;
                                    if(sme[j] == 72)
                                    responseData[i].ob_non_mobility = widgetData;  
                                }

                                responseData[i].target = total_target?total_target.toFixed(2):0;
                                responseData[i].achieved = total_achieved?total_achieved.toFixed(2):0;
                                responseData[i].percentage = total_target>0?((total_achieved/total_target)*100).toFixed(2):'NA';
                            }                            
                    
                        } else if(data[0].is_channel == 0){

                            for(let i = 0 ; i <responseData.length; i++ ){
                                request.account_activity_id = responseData[i].account_activity_id;
                                for(let j = 0; j < non_sme.length; j++){

                                    request.widget_type_id = non_sme[j];
                                    request.channel_asset_id = 0;
                                    
                                    let [widgetErr, widgetData] = await self.getAssetAccountTargetListV1(request);
                                    console.log('widgetData ',widgetData);

                                    if(widgetData.length > 0){
                                        total_target = widgetData[0].target + total_target;
                                        total_achieved = widgetData[0].achieved + total_achieved;

                                        widgetData[0].target = widgetData[0].target?widgetData[0].target.toFixed(2):0;
                                        widgetData[0].achieved = widgetData[0].achieved?widgetData[0].achieved.toFixed(2):0;
                                        widgetData[0].percentage = widgetData[0].percentage?widgetData[0].percentage.toFixed(2):0;                                        
                                    }

                                    if(non_sme[j] == 69)
                                    responseData[i].revenue_mobility = widgetData;
                                    if(non_sme[j] == 70)
                                    responseData[i].revenue_non_mobility = widgetData;
                                    if(non_sme[j] == 71)
                                    responseData[i].ob_mobility = widgetData;
                                    if(non_sme[j] == 72)
                                    responseData[i].ob_non_mobility = widgetData;  
                                }

                                responseData[i].target = total_target?total_target.toFixed(2):0;
                                responseData[i].achieved = total_achieved?total_achieved.toFixed(2):0;
                                responseData[i].percentage = total_target>0?((total_achieved/total_target)*100).toFixed(2):'NA';
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
              request.is_export || 0,
              request.report_type_id || 9,
              request.page_start || 0,
              request.page_limit || 100
        ];

        const queryString = util.getQueryString('ds_v1_2_organization_filter_tag_type_mapping_select', paramsArr);
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
            request.tag_id || 0,
            request.activity_type_id || 0,
            request.target_account_id || 0,
            request.search_string || '',
            request.is_export,
            request.page_start || 0,
            request.page_limit || 100
        ];

        const queryString = util.getQueryString('ds_v1_2_asset_report_mapping_select', paramsArr);
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
            console.log('responseData.length ', responseData.length);
            console.log('responseData ', responseData);
            if(responseData.length > 0){
                    responseData.push(
                    {
                    "asset_id": responseData[0].manager_asset_id,
                    "asset_first_name": responseData[0].manager_asset_first_name,
                    "operating_asset_id": responseData[0].manager_operating_asset_id,
                    "operating_asset_first_name": responseData[0].manager_operating_asset_first_name,
                    "operating_asset_last_name": ''
                    }
                );
            }
            console.log('responseData.length ', responseData.length);
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
                        widgetData[0].target = widgetData[0].target?widgetData[0].target.toFixed(2):0;
                        widgetData[0].achieved = widgetData[0].achieved?widgetData[0].achieved.toFixed(2):0;
                        widgetData[0].percentage = widgetData[0].percentage?widgetData[0].percentage.toFixed(2):0;
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
                responseData[i].target = total_target?total_target.toFixed(2):0;
                responseData[i].achieved = total_achieved?total_achieved.toFixed(2):0;
                responseData[i].percentage = total_target>0?((total_achieved/total_target)*100).toFixed(2):'NA';

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
            request.workforce_tag_id,
            request.flag,
            request.target_account_id,
            request.tag_id,
            request.tag_type_id,
            request.is_search,
            request.search_string,
            request.start_from || 0,
            request.limit_value || 50
        ];

        const queryString = util.getQueryString('ds_v1_1_tag_list_select_dashboard_filters', paramsArr);
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
                         loopKey = "account_id";   
                        break;
                case 6 : loopBase = JSON.parse(request.target_assets);
                         loopKey = "target_asset_id";
                        break;
                case 8 : loopBase = JSON.parse(request.activity_types);
                         loopKey = "activity_type_id";
                        break;
                case 20 : loopBase = JSON.parse(request.tag_types);
                         loopKey = "tag_type_id";   
                        break;
                case 21 : loopBase = JSON.parse(request.segments);
                         loopKey = "segment_id";   
                        break;
                case 22 : loopBase = JSON.parse(request.product_tags);
                         loopKey = "product_tag_id";   
                        break;
                case 25 : loopBase = JSON.parse(request.cluster_tags);
                         loopKey = "cluster_tag_id";   
                        break;
                case 26 : loopBase = JSON.parse(request.workforce_tags);
                         loopKey = "workforce_tag_id";   
                        break;
                case 27 : loopBase = JSON.parse(request.applications);
                         loopKey = "application_id";   
                        break;
            }           
            
            if(!parseInt(request.access_level_id)){
                let loopData = [
                    {key:"cluster_tags",value:"cluster_tag_id",access_level_id:25},
                    {key:"target_accounts",value:"account_id",access_level_id:2},
                    {key:"target_assets",value:"target_asset_id",access_level_id:6},
                    {key:"tag_types",value:"tag_type_id",access_level_id:20},
                    {key:"segments",value:"segment_id",access_level_id:21},
                    {key:"product_tags",value:"product_tag_id",access_level_id:22},
                    {key:"workforce_tags",value:"workforce_tag_id",access_level_id:26},
                    {key:"activity_types",value:"activity_type_id",access_level_id:8}
                ];
                let err1 = true, data = [];
                for(let i = 0 ; i < loopData.length; i++){
                    loopBase = JSON.parse(request[loopData[i].key]);
                    loopKey = loopData[i].value;
                    request.access_level_id = loopData[i].access_level_id;
                    if(request.access_level_id == 2){
                        if(loopBase.length == 1 && loopBase[0] == 0){
                            let clusterArray = JSON.parse(request.cluster_tags);
                            for(let k = 0; k < clusterArray.length; k++){
                                request.cluster_tag_id = clusterArray[k];
                                [err1,data] = await self.assetAccessLevelLoop(loopBase,loopKey,request);
                            }
                        }else{
                            [err1,data] = await self.assetAccessLevelLoop(loopBase,loopKey,request);
                        }
                    }else{
                        [err1,data] = await self.assetAccessLevelLoop(loopBase,loopKey,request);
                    }
                    
                    if(err1){
                        error = err1;
                    } else {
                        error = false;
                        responseData = [...responseData,...data];
                    }
                }
            } else {
                [error,responseData] = await self.assetAccessLevelLoop(loopBase,loopKey,request);
            }
        }
        catch(err1){
            return [err1, responseData];
        }
        
        return [error,responseData];
    }

    this.assetAccessLevelLoop = async (loopBase,loopKey,request) => {
        let responseData = [],
            error = true;
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
        request[loopKey] = 0;
        return [error, responseData];
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

/*    
    this.assetReportMapping = async (request) => {
        let responseData = [],
            error = true;
        try{
            
            let loopBase = [];
            let loopKey = "";
            switch(parseInt(request.access_level_id)){
                case 2 : loopBase = JSON.parse(request.target_accounts);
                         loopKey = "account_id";   
                        break;
                case 6 : loopBase = JSON.parse(request.target_assets);
                         loopKey = "target_asset_id";
                        break;
                case 8 : loopBase = JSON.parse(request.activity_types);
                         loopKey = "activity_type_id";
                        break;
                case 20 : loopBase = JSON.parse(request.tag_types);
                         loopKey = "tag_type_id";   
                        break;
                case 21 : loopBase = JSON.parse(request.segments);
                         loopKey = "segment_id";   
                        break;
                case 22 : loopBase = JSON.parse(request.product_tags);
                         loopKey = "product_tag_id";   
                        break;
                case 25 : loopBase = JSON.parse(request.cluster_tags);
                         loopKey = "cluster_tag_id";   
                        break;
                case 26 : loopBase = JSON.parse(request.workforce_tags);
                         loopKey = "workforce_tag_id";   
                        break;
                case 27 : loopBase = JSON.parse(request.applications);
                         loopKey = "application_id";   
                        break;
            }           
            
            if(!parseInt(request.access_level_id)){
                let loopData = [
                     {key:"cluster_tags",value:"cluster_tag_id",access_level_id:25},
                     {key:"target_accounts",value:"account_id",access_level_id:2},
                     {key:"target_assets",value:"target_asset_id",access_level_id:6},
                     {key:"tag_types",value:"tag_type_id",access_level_id:20},
                     {key:"segments",value:"segment_id",access_level_id:21},
                     {key:"product_tags",value:"product_tag_id",access_level_id:22},
                     {key:"workforce_tags",value:"workforce_tag_id",access_level_id:26},
                     {key:"activity_types",value:"activity_type_id",access_level_id:8}
                ];
                for(let i = 0 ; i < loopData.length; i++){
                    loopBase = JSON.parse(request[loopData[i].key]);
                    loopKey = loopData[i].value;
                    request.access_level_id = loopData[i].access_level_id;
                    let [err1,data] = await self.assetReportLoop(loopBase,loopKey,request);
                    if(err1){
                        error = err1;
                    } else {
                        error = false;
                        responseData = [...responseData,...data];
                    }
                }
                if(request.activity_types){
                    let activity_types = JSON.parse(request.activity_types);
                    for(let tags in activity_types){
                        loopBase = activity_types[tags];
                        loopKey = "activity_type_id";
                        request.access_level_id = 8;
                        request.tag_type_id = tags;
                        let [err1,data] = await self.assetReportLoop(loopBase,loopKey,request);
                        if(err1){
                            error = err1;
                        } else {
                            error = false;
                            responseData = [...responseData,...data];
                        }
                    }
                }
            } else {
                [error,responseData] = await self.assetReportLoop(loopBase,loopKey,request);
            }
        }
        catch(err1){
            return [err1, responseData];
        }
        
        return [error,responseData];
    }

*/    
    this.assetReportMapping = async (request) => {
        let responseData = [],
            error = true;
        try{
            let loopBase = [];
            let loopKey = "";
            switch(parseInt(request.access_level_id)){
                case 2 : loopBase = JSON.parse(request.target_accounts);
                         loopKey = "account_id";   
                        break;
                case 6 : loopBase = JSON.parse(request.target_assets);
                         loopKey = "target_asset_id";
                        break;
                case 8 : loopBase = JSON.parse(request.activity_types);
                         loopKey = "activity_type_id";
                        break;
                case 20 : loopBase = JSON.parse(request.tag_types);
                         loopKey = "tag_type_id";   
                        break;
                case 21 : loopBase = JSON.parse(request.segments);
                         loopKey = "segment_id";   
                        break;
                case 22 : loopBase = JSON.parse(request.product_tags);
                         loopKey = "product_tag_id";   
                        break;
                case 25 : loopBase = JSON.parse(request.cluster_tags);
                         loopKey = "cluster_tag_id";   
                        break;
                case 26 : loopBase = JSON.parse(request.workforce_tags);
                         loopKey = "workforce_tag_id";   
                        break;
                case 27 : loopBase = JSON.parse(request.applications);
                         loopKey = "application_id";   
                        break;
            }           
            
            if(!parseInt(request.access_level_id)){
                let loopData = [
                    {key:"cluster_tags",value:"cluster_tag_id",access_level_id:25},
                    {key:"target_accounts",value:"account_id",access_level_id:2},
                    {key:"target_assets",value:"target_asset_id",access_level_id:6},
                    {key:"tag_types",value:"tag_type_id",access_level_id:20},
                    {key:"segments",value:"segment_id",access_level_id:21},
                    {key:"product_tags",value:"product_tag_id",access_level_id:22},
                    {key:"workforce_tags",value:"workforce_tag_id",access_level_id:26},
                    {key:"activity_types",value:"activity_type_id",access_level_id:8}
                ];
                let err1 = true, data = [];
                //console.log("loopData :: ",loopData.length);
                for(let i = 0 ; i < loopData.length; i++){
                    loopBase = JSON.parse(request[loopData[i].key]);
                    loopKey = loopData[i].value;
                    request.access_level_id = loopData[i].access_level_id;
                   // console.log("request.access_level_id :: "+request.access_level_id);
                    if(request.access_level_id == 2){
                        if(loopBase.length == 1 && loopBase[0] == 0){
                            let clusterArray = JSON.parse(request.cluster_tags);
                            //console.log(clusterArray.length);
                            //console.log(JSON.stringify(clusterArray, null, 2));
                            for(let k = 0; k < clusterArray.length; k++){
                                //console.log(clusterArray[k]);
                                request.cluster_tag_id = clusterArray[k];
                                [err1,data] = await self.assetReportLoop(loopBase,loopKey,request);
                            }
                        }else{
                            [err1,data] = await self.assetReportLoop(loopBase,loopKey,request);
                        }
                    }else if(request.access_level_id == 8){
                        // activity_types:{"110":[149277,149278], "111":[152184]}
                        // console.log("request.access_level_id :: "+request.access_level_id);
                        loopBase = JSON.parse(request[loopData[i].key]);
                        loopKey = loopData[i].value;  
                        // console.log("    loopKey "+loopKey+ " :: loopBase :: " +loopBase);     
                        let activityTypes = JSON.parse(request.activity_types);
                        let tagTypeArray = Object.keys(activityTypes);
                        // console.log("activityTypes "+request.activity_types);
                        // console.log("tagTypeArray "+tagTypeArray);
                        // console.log("tagTypeArray.length "+tagTypeArray.length);
                        for(let k = 0; k < tagTypeArray.length; k++)
                         {
                         //   console.log("activityTypes.tagTypeArray "+activityTypes[tagTypeArray[k]]);
                            let activityTypeList = activityTypes[tagTypeArray[k]];
                         //   console.log("activityTypeList :: "+activityTypeList);
                            request.tag_type_id = tagTypeArray[k];
                            await self.assetReportLoop(activityTypeList,loopKey,request);

                            /*
                            for(let m = 0; m < activityTypeList.length ; m ++){
                                
                                request.tag_type_id = tagTypeArray[k];
                                request.activity_type_id = activityTypeList[m];
                                console.log("TagType : "+tagTypeArray[k]+" :: ActivityType : "+activityTypeList[m]);
                                //await self.assetReportLoop(loopBase,loopKey,request);
                                console.log(JSON.stringify(request,null,2));
                                self.assetReportLoop(loopBase,loopKey,request);
                            } */
                         }
 

                    }else{
                       // console.log("before else ");
                        [err1,data] = await self.assetReportLoop(loopBase,loopKey,request);
                    }
                    
                    if(err1){
                        error = err1;
                    } else {
                        error = false;
                        responseData = [...responseData,...data];
                    }
                }
            } else {
                [error,responseData] = await self.assetReportLoop(loopBase,loopKey,request);
            }
        }
        catch(err1){
            return [err1, responseData];
        }
        
        return [error,responseData];
    }
    this.assetReportLoop = async (loopBase,loopKey,request) => {
        console.log("assetReportLoop :: loopBase :: "+loopBase+ " :: loopKey  "+loopKey );
        let responseData = [],
            error = true;
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
        request[loopKey] = 0;
        return [error, responseData];
    }    

    this.assetReportMappingInsert = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
            request.organization_id,
            request.account_id||0,
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

    this.assetAccessLevelMappingDelete = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.user_asset_id,
              request.access_level_id,
              request.asset_id,
              util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_v1_asset_access_level_mapping_delete', paramsArr);
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

    this.assetReportMappingDelete = async (request) => {

        let responseData = [],
            error = true;
        
        const paramsArr = [     
              request.organization_id,
              request.user_asset_id,
              request.access_level_id,
              request.asset_id,
              util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_v1_asset_report_mapping_delete', paramsArr);
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

    // Insert new transaction for Analytics Report.
    this.insertAnalyticsReportTransaction = async (request) => {

        let responseData = [],
            error = true;

        const paramsArr = [
            request.organization_id,
            request.report_id,
            request.report_status_id,
            request.report_url,
            request.asset_id,
            util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_v1_report_transaction_insert', paramsArr);
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


    //----------------------------------------------------------------------
    //Mangesh S
    //analytics/management/widget/value/resource
    //Get resource details for specified vertical_tag_id
    this.getManagementWidgetValueResource = async (request) => {

        try {
            let results = new Array();
            let paramsArray;
            let tempResult;
            let timezoneOffset = 0;

            //Setting the activity_id in response
            results[0] =
            {
                activity_id: request.activity_id,
            };

            //Get the timezone of the account
            paramsArray =
                new Array
                    (
                        request.account_id
                    );

            console.log(request, null, 2);

            tempResult = await db.callDBProcedureR2(request, "ds_p1_account_list_select_timezone", paramsArray, 1);
            console.log(tempResult);
            timezoneID = tempResult[0].account_timezone_id;
            timezoneOffset = tempResult[0].account_timezone_offset;

            //Get the number of selections for status category
            console.log(JSON.parse(request.filter_activity_status_type_id).length);
            arrayStatusTypes = JSON.parse(request.filter_activity_status_type_id);

            console.log("request.activity_status_id :: " + request.activity_status_id);
            let arrayStatuses = new Array();
            if (request.hasOwnProperty("activity_status_id")) {
                //console.log(JSON.parse(request.activity_status_id).length);
                if (request.activity_status_id != 0) {
                    arrayStatuses = JSON.parse(request.activity_status_id);
                } else {
                    let json = { "activity_status_id": 0 };
                    arrayStatuses.push(json);
                    console.log("arrayStatuses2 :: " + JSON.stringify(arrayStatuses));
                }
            } else {

                let json = { "activity_status_id": 0 };
                arrayStatuses.push(json);
                console.log("arrayStatuses2 :: " + JSON.stringify(arrayStatuses));
            }

            console.log("filter_hierarchy " + request.filter_hierarchy);

            if (!request.hasOwnProperty("filter_hierarchy")) {
                request.filter_hierarchy = 0;
            }

            //if (request.tag_type_id == 130)
            //    request.filter_asset_id = request.asset_id;

            console.log('request.filter_is_datetime_considered :: ' + request.filter_is_datetime_considered);

            try {

                console.log('request.tag_type_id ' + request.tag_type_id);

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
                            parseInt(request.tag_type_id),
                            parseInt(request.filter_tag_id),
                            parseInt(request.filter_activity_type_id),
                            global.analyticsConfig.activity_id_all, //Activity ID,
                            parseInt(request.filter_activity_status_type_id),
                            parseInt(request.filter_activity_status_tag_id),
                            // parseInt(request.filter_activity_status_id),
                            parseInt(arrayStatuses[0].activity_status_id),
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
                            request.filter_is_lead || 0,
                            request.filter_campaign_activity_id || 0,
                            request.filter_field_entity_1 || '',
                            request.filter_field_entity_2 || '',
                            request.filter_field_entity_3 || '',
                            request.filter_field_entity_4 || '',
                            request.filter_field_entity_5 || '',
                            parseInt(request.page_start) || 0,
                            parseInt(request.page_limit) || 50
                        );

                if ([128, 129, 130].includes(parseInt(request.widget_type_id))) {
                    request.verticalData = global.analyticsConfig.vertical;
                    results = await this.prepareWidgetDataForResource(request, paramsArray);

                }

            } catch (e) {
                console.log('error ::', e);
            }
            //console.log("results "+results)
            return results;
        }
        catch (error) {
            console.log("Error========");
            console.log(error);
            return Promise.reject(error);
        }
    };

    this.prepareWidgetDataForResource = async (request, paramsArray) => {

        return new Promise((resolve) => {

            let requestObj = {
                "organization_id": request.organization_id,
                "account_id": request.account_id,
                "workforce_id": request.workforce_id,
                "segment_id": request.segment_id || 0,
                "target_asset_id": request.asset_id,
                "tag_type_id": request.tag_type_id || 0,
                "tag_id": request.tag_id || 0,
                "cluster_tag_id": request.cluster_tag_id || 0,
                "vertical_tag_id": request.vertical_tag_id || 0,
                "flag": 28,
                "page_start": request.page_start || 0,
                "page_limit": request.page_limit || 50
            };

            assetService.assetAccessLevelMappingSelectFlagV2(requestObj)
                .then(async (data) => {
                    console.log("1");
                    let resourceMap = new Map();

                    if (data !== undefined && data.length >= 2) {

                        let verticalsArray = data[1];
                        for (index = 0; index < verticalsArray.length; index++) {

                            let vertical = verticalsArray[index];
                            if (vertical !== undefined && vertical.hasOwnProperty('tag_id')) {

                                let tag_id = vertical.tag_id;
                                if (tag_id !== null && tag_id > 0) {

                                    let tag_name = verticalsArray[index].tag_name;
                                    if ("All" !== tag_name) {
                                        resourceMap.set(tag_id, tag_name);
                                    }
                                    if (Number(request.filter_tag_id) == tag_id) {
                                        break;
                                    }
                                }

                            }

                        }
                    }
                    console.log("2");
                    if (resourceMap.size == 0) {
                        console.log("3");
                        console.log("Vertical details not available, so need to prepare data for widget_type_id = " + request.widget_type_id);
                        let results = new Array();
                        results.push(request.verticalData[request.widget_type_id]);
                        resolve(results);

                    } else {
                        console.log("4");
                        let [err, assetsData] = await this.getResourcesListForSelectedVertical(request, new Array(request.organization_id, request.filter_tag_id, 0, 50));
                        if (err) {
                            console.log("getResourcesListForSelectedVertical : Exception : ");
                            console.log(err);
                            resolve(err);
                        } else {
                            request.widget_type_id = Number(request.widget_type_id) || 0;
                            switch (request.widget_type_id) {

                                case 128: {
                                    console.log("128request.widget_type_id " + request.widget_type_id);
                                    resolve(await this.prepareDataForWidgetType128ForResource(request, paramsArray, resourceMap, assetsData));
                                    break;
                                }
                                case 129: {
                                    console.log("129request.widget_type_id " + request.widget_type_id);
                                    resolve(await this.prepareDataForWidgetType129ForResource(request, paramsArray, resourceMap, assetsData));
                                    break;
                                }
                                case 130: {
                                    console.log("130request.widget_type_id " + request.widget_type_id);
                                    resolve(await this.prepareDataForWidgetType130ForResource(request, paramsArray, resourceMap, assetsData));
                                    break;
                                }
                                default: {
                                    console.log("defaultrequest.widget_type_id " + request.widget_type_id);
                                }
                            }
                        }
                    }
                })
                .catch((error) => {
                    console.log("prepareWidgetData : Exception : ");
                    console.log(error);
                    resolve(request.verticalData.error_response);
                });
        });

    }

    this.prepareDataForWidgetType128ForResource = async (request, paramsArray, resourceMap, assetsData) => {

        try {
            console.log("prepareDataForWidgetType128ForResource :: ");
            let results = new Array();
            let widgetFlags = new Array();
            let resourceValueFlgArray = new Array();
            let countTotal = new Array();
            let quantityTotal = new Array();
            let valueTotal = new Array();
            let resourceReporteesMappingMap = new Map();
            let finalResourceMap = new Map();
            for (let i = 0; i < 2; i++) {
                widgetFlags[i] = i + 1;
                resourceValueFlgArray[i] = {};
                countTotal[i] = 0; quantityTotal[i] = 0; valueTotal[i] = 0;
            }
            let resourceResponseAdditonalMap = new Map();
            let isError = false;

            let opptyVerticalMap = new Map();
            request.resourceData = global.analyticsConfig.resource;            
            let header = request.resourceData[request.widget_type_id];
            results.push(header);

            let vertical_tag_id = paramsArray[12];
            let assetMap = new Map();

            for (let idx = 0; idx < assetsData.length; idx++) {
                resourceReporteesMappingMap.set(assetsData[idx].asset_id, assetsData[idx].manager_asset_id);

                if (!assetMap.has(assetsData[idx].asset_id)) {
                    let map = new Map();
                    for (let i = 0; i < widgetFlags.length; i++) {
                        map.set("flag_" + (i + 1), 0);
                    }
                    assetMap.set(assetsData[idx].asset_id, map);
                }
                if (!finalResourceMap.has(assetsData[idx].manager_asset_id)) {
                    let newMap = new Map();
                    for (let i = 0; i < widgetFlags.length; i++) {
                        newMap.set("flag_" + (i + 1), 0);
                    }
                    newMap.set(assetsData[idx].manager_asset_id, assetsData[idx].manager_operating_asset_first_name);
                    finalResourceMap.set(assetsData[idx].manager_asset_id, newMap);
                }
            }

            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let responseJson = {};
                if (isError) {
                    break;
                }
                //paramsArray[18] = util.getFirstDayOfCurrentMonthToIST();
                //paramsArray[19] = util.getLastDayOfCurrentMonthToIST();
                paramsArray[15] = 0;
                paramsArray[16] = 0;
                paramsArray[1] = request.filter_date_type_id;
                if (widgetFlags[iteratorM] == 2) {
                    paramsArray[1] = 2;
                    paramsArray[15] = 1;
                    paramsArray[16] = 148;
                }
                paramsArray.push(widgetFlags[iteratorM]);
                paramsArray[10] = 0; //request.asset_id;

                responseJson.datetime_start = paramsArray[18];
                responseJson.datetime_end = paramsArray[19];
                responseJson.filter_activity_status_type_id = paramsArray[15];
                responseJson.filter_activity_status_tag_id = paramsArray[16];
                responseJson.filter_date_type_id = paramsArray[1];
                responseJson.filter_asset_id = paramsArray[10];
                responseJson.sequence_id = widgetFlags[iteratorM];
                resourceResponseAdditonalMap.set(iteratorM, responseJson);

                let [errr, opptydata] = await this.widgetValuesOpptyVertical(request, paramsArray);
                if (!errr) {
                    opptyVerticalMap.set(iteratorM, opptydata);
                }
            }

            if (isError) {
                return Promise.resolve(request.verticalData.error_response);
            }

            let vertical_name = null;

            for (let entry of resourceMap.entries()) {
                vertical_tag_id = entry[0];
                vertical_name = entry[1];
                if (paramsArray[12] == vertical_tag_id) {
                    break;
                }
            }
            console.log("opptyVerticalMap :: ",opptyVerticalMap);
            console.log("finalResourceMap :: ",finalResourceMap);
            console.log("-------------");
            console.log("resourceReporteesMappingMap :: ",resourceReporteesMappingMap);
            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let opptydata = opptyVerticalMap.get(iteratorM);
                for (let idx = 0; idx < opptydata.length; idx++) {
                    let asset_id = opptydata[idx].activity_creator_asset_id;
                    let isResource = false;
                    if (finalResourceMap.has(asset_id)) {
                        console.log("asset_id == manager_asset_id " + asset_id);
                        isResource = true;
                    }
                    if (resourceReporteesMappingMap.has(asset_id) || isResource) {
                        let manager_asset_id = null;
                        if (isResource) {
                            manager_asset_id = asset_id;
                            console.log("iteratorM= " + iteratorM + " : asset_id == manager_asset_id [" + asset_id + " == " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                        } else {
                            manager_asset_id = resourceReporteesMappingMap.get(asset_id);
                            console.log("iteratorM= " + iteratorM + " : asset_id != manager_asset_id [" + asset_id + " != " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                        }
                        let newMap = finalResourceMap.get(manager_asset_id);
                        let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                        let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                        let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                        count = count + opptydata[idx].count;
                        quantity = quantity + opptydata[idx].quantity;
                        value = value + opptydata[idx].value;
                        newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                        newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                        newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                        finalResourceMap.set(manager_asset_id, newMap);
                    }
                }
            }
            console.log("-------------");
            console.log("assetsData :: ",assetsData);
            for (let idx = 0; idx < assetsData.length; idx++) {
                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    let responseJson = Object.assign({}, resourceResponseAdditonalMap.get(iteratorM));
                    responseJson.vertical_tag_id = vertical_tag_id;
                    responseJson.vertical_name = vertical_name;
                    delete responseJson["filter_asset_id"];
                    responseJson.target_asset_id = assetsData[idx].asset_id;
                    resourceValueFlgArray[iteratorM] = responseJson;
                }
            }


            let resourceValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                resourceValueFlgArrayTotal[i] = {};
                resourceValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArray[i]);
            }
           
            for (let [key, value] of finalResourceMap) {
                let newMap = value;
                let manager_asset_id = key;
                let assetRspData = {};
                assetRspData.resource_name = newMap.get(manager_asset_id);
                let cnt = 1;
                for (let i = 0; i < widgetFlags.length; i++) {
                    let responseData = Object.assign({}, resourceValueFlgArrayTotal[i]);
                    responseData.target_asset_id = manager_asset_id;
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_count") || 0;
                    countTotal[i] = countTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_quantity") || 0;
                    quantityTotal[i] = quantityTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    let flagValue = parseFloat(newMap.get("flag_" + (i + 1) + "_value") || 0).toFixed(2);
                    assetRspData["flag_" + cnt] = flagValue;
                    valueTotal[i] = parseFloat(valueTotal[i]) + parseFloat(flagValue);
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                }
                results.push(assetRspData);
            }

            //For Total
            let verticalValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                verticalValueFlgArrayTotal[i] = {};
                verticalValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArrayTotal[i]);
                verticalValueFlgArrayTotal[i].vertical_tag_id = 0;
                delete verticalValueFlgArrayTotal[i]['vertical_name'];
            }
            let resultData = {};
            resultData.resource_name = "Total";
            let cnt = 1;
            for (let j = 0; j < widgetFlags.length; j++) {
                resultData["flag_" + cnt] = countTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = quantityTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = parseFloat(valueTotal[j] || 0).toFixed(2);
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
            }
            results.push(resultData);

            return Promise.resolve(results);

        } catch (error) {
            console.log("error :; ", error);
            return Promise.resolve(request.verticalData.error_response);
        }
    }

    this.prepareDataForWidgetType129ForResource = async (request, paramsArray, resourceMap, assetsData) => {

        try {
            console.log("prepareDataForWidgetType129ForResource :: ");
            let activityStatusTypeIdArray = new Array(0, 0, 0, 0, 1, 1, 1, 1);;
            let results = new Array();
            let widgetFlags = new Array();
            let resourceValueFlgArray = new Array();
            let countTotal = new Array();
            let quantityTotal = new Array();
            let valueTotal = new Array();
            let resourceReporteesMappingMap = new Map();
            let finalResourceMap = new Map();
            for (let i = 0; i < 8; i++) {
                widgetFlags[i] = i + 1;
                resourceValueFlgArray[i] = {};
                countTotal[i] = 0; quantityTotal[i] = 0; valueTotal[i] = 0;
            }
            let resourceResponseAdditonalMap = new Map();
            let isError = false;

            let opptyVerticalMap = new Map();
            request.resourceData = global.analyticsConfig.resource;            
            let header = request.resourceData[request.widget_type_id];
            results.push(header);

            let vertical_tag_id = paramsArray[12];
            let assetMap = new Map();

            for (let idx = 0; idx < assetsData.length; idx++) {
                resourceReporteesMappingMap.set(assetsData[idx].asset_id, assetsData[idx].manager_asset_id);

                if (!assetMap.has(assetsData[idx].asset_id)) {
                    let map = new Map();
                    for (let i = 0; i < widgetFlags.length; i++) {
                        map.set("flag_" + (i + 1), 0);
                    }
                    assetMap.set(assetsData[idx].asset_id, map);
                }
                if (!finalResourceMap.has(assetsData[idx].manager_asset_id)) {
                    let newMap = new Map();
                    for (let i = 0; i < widgetFlags.length; i++) {
                        newMap.set("flag_" + (i + 1), 0);
                    }
                    newMap.set(assetsData[idx].manager_asset_id, assetsData[idx].manager_operating_asset_first_name);
                    finalResourceMap.set(assetsData[idx].manager_asset_id, newMap);
                }
            }

            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let responseJson = {};
                if (isError) {
                    break;
                }
                paramsArray[15] = activityStatusTypeIdArray[iteratorM];
                let status_tags = request.verticalData["status_tags"];
                let key = request.verticalData["status_tags_array"][iteratorM];
                paramsArray[16] = status_tags[key];
                paramsArray.push(widgetFlags[iteratorM]);
                paramsArray[10] = 0; //request.asset_id;

                responseJson.filter_activity_status_tag_id = paramsArray[16];
                responseJson.filter_asset_id = paramsArray[10];
                responseJson.sequence_id = widgetFlags[iteratorM];
                resourceResponseAdditonalMap.set(iteratorM, responseJson);

                let [errr, opptydata] = await this.widgetValuesOpptyVertical(request, paramsArray);
                if (!errr) {
                    opptyVerticalMap.set(iteratorM, opptydata);
                }
            }

            if (isError) {
                return Promise.resolve(request.verticalData.error_response);
            }

            let vertical_name = null;

            for (let entry of resourceMap.entries()) {
                vertical_tag_id = entry[0];
                vertical_name = entry[1];
                if (paramsArray[12] == vertical_tag_id) {
                    break;
                }
            }

            console.log("-------------");
            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let opptydata = opptyVerticalMap.get(iteratorM);
                for (let idx = 0; idx < opptydata.length; idx++) {
                    let asset_id = opptydata[idx].activity_creator_asset_id;
                    let isResource = false;
                    if (finalResourceMap.has(asset_id)) {
                        console.log("asset_id == manager_asset_id " + asset_id);
                        isResource = true;
                    }
                    if (resourceReporteesMappingMap.has(asset_id) || isResource) {
                        let manager_asset_id = null;
                        if (isResource) {
                            manager_asset_id = asset_id;
                            console.log("iteratorM= " + iteratorM + " : asset_id == manager_asset_id [" + asset_id + " == " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                        } else {
                            manager_asset_id = resourceReporteesMappingMap.get(asset_id);
                            console.log("iteratorM= " + iteratorM + " : asset_id != manager_asset_id [" + asset_id + " != " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                        }
                        let newMap = finalResourceMap.get(manager_asset_id);
                        let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                        let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                        let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                        count = count + opptydata[idx].count;
                        quantity = quantity + opptydata[idx].quantity;
                        value = value + opptydata[idx].value;
                        newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                        newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                        newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                        finalResourceMap.set(manager_asset_id, newMap);
                    }
                }
            }
            console.log("-------------");

            for (let idx = 0; idx < assetsData.length; idx++) {
                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    let responseJson = Object.assign({}, resourceResponseAdditonalMap.get(iteratorM));
                    responseJson.vertical_tag_id = vertical_tag_id;
                    responseJson.vertical_name = vertical_name;
                    delete responseJson["filter_asset_id"];
                    responseJson.target_asset_id = assetsData[idx].asset_id;
                    resourceValueFlgArray[iteratorM] = responseJson;
                }
            }


            let resourceValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                resourceValueFlgArrayTotal[i] = {};
                resourceValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArray[i]);
            }

            for (let [key, value] of finalResourceMap) {
                let newMap = value;
                let manager_asset_id = key;
                let assetRspData = {};
                assetRspData.resource_name = newMap.get(manager_asset_id);
                let cnt = 1;
                for (let i = 0; i < widgetFlags.length; i++) {
                    let responseData = Object.assign({}, resourceValueFlgArrayTotal[i]);
                    responseData.target_asset_id = manager_asset_id;
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_count") || 0;
                    countTotal[i] = countTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_quantity") || 0;
                    quantityTotal[i] = quantityTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    let flagValue = parseFloat(newMap.get("flag_" + (i + 1) + "_value") || 0).toFixed(2);
                    assetRspData["flag_" + cnt] = flagValue;
                    valueTotal[i] = parseFloat(valueTotal[i]) + parseFloat(flagValue);
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                }
                results.push(assetRspData);
            }

            //For Total
            let verticalValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                verticalValueFlgArrayTotal[i] = {};
                verticalValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArrayTotal[i]);
                verticalValueFlgArrayTotal[i].vertical_tag_id = 0;
                delete verticalValueFlgArrayTotal[i]['vertical_name'];
            }
            let resultData = {};
            resultData.resource_name = "Total";
            let cnt = 1;
            for (let j = 0; j < widgetFlags.length; j++) {
                resultData["flag_" + cnt] = countTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = quantityTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = parseFloat(valueTotal[j] || 0).toFixed(2);
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
            }
            results.push(resultData);

            return Promise.resolve(results);

        } catch (error) {
            console.log("error :; ", error);
            return Promise.resolve(request.verticalData.error_response);
        }
    }

    this.prepareDataForWidgetType130ForResource = async (request, paramsArray, resourceMap, assetsData) => {

        try {
            console.log("prepareDataForWidgetType130 :: ");
            let results = new Array();
            let widgetFlags = new Array();
            let resourceValueFlgArray = new Array();
            let countTotal = new Array();
            let quantityTotal = new Array();
            let valueTotal = new Array();
            let resourceReporteesMappingMap = new Map();
            let finalResourceMap = new Map();
            for (let i = 0; i < 7; i++) {
                widgetFlags[i] = i + 1;
                resourceValueFlgArray[i] = {};
                countTotal[i] = 0; quantityTotal[i] = 0; valueTotal[i] = 0;
            }
            let resourceResponseAdditonalMap = new Map();
            let isError = false;

            let opptyVerticalMap = new Map();
            request.resourceData = global.analyticsConfig.resource;            
            let header = request.resourceData[request.widget_type_id];
            results.push(header);

            let vertical_tag_id = paramsArray[12];
            let assetMap = new Map();
            let status_tags = request.verticalData["status_tags"];

            for (let idx = 0; idx < assetsData.length; idx++) {
                resourceReporteesMappingMap.set(assetsData[idx].asset_id, assetsData[idx].manager_asset_id);

                if (!assetMap.has(assetsData[idx].asset_id)) {
                    let map = new Map();
                    for (let i = 0; i < widgetFlags.length; i++) {
                        map.set("flag_" + (i + 1), 0);
                    }
                    assetMap.set(assetsData[idx].asset_id, map);
                }
                if (!finalResourceMap.has(assetsData[idx].manager_asset_id)) {
                    let newMap = new Map();
                    for (let i = 0; i < widgetFlags.length; i++) {
                        newMap.set("flag_" + (i + 1), 0);
                    }
                    newMap.set(assetsData[idx].manager_asset_id, assetsData[idx].manager_operating_asset_first_name);
                    finalResourceMap.set(assetsData[idx].manager_asset_id, newMap);
                }
            }

            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let responseJson = {};
                if (isError) {
                    break;
                }
                if (widgetFlags[iteratorM] == 1) {
                    paramsArray[1] = 1;
                    paramsArray[15] = 2;
                    paramsArray[16] = 0;
                    paramsArray[18] = util.getFirstDayOfCurrentMonthToIST();
                    paramsArray[19] = util.getLastDayOfCurrentMonthToIST();
                }
                if (widgetFlags[iteratorM] >= 2 && widgetFlags[iteratorM] <= 5) {
                    paramsArray[1] = 2;
                    paramsArray[15] = 1;
                    paramsArray[18] = util.getFirstDayOfCurrentMonthToIST();
                    paramsArray[19] = util.getLastDayOfCurrentMonthToIST();
                    if (widgetFlags[iteratorM] == 2) {
                        let key = request.verticalData["status_tags_array"][4];
                        paramsArray[16] = status_tags[key];
                    }
                    if (widgetFlags[iteratorM] == 3) {
                        let key = request.verticalData["status_tags_array"][5];
                        paramsArray[16] = status_tags[key];
                    }
                    if (widgetFlags[iteratorM] == 4) {
                        let key = request.verticalData["status_tags_array"][6];
                        paramsArray[16] = status_tags[key];
                    }
                    if (widgetFlags[iteratorM] == 5) {
                        let key = request.verticalData["status_tags_array"][7];
                        paramsArray[16] = status_tags[key];
                    }
                }
                if (widgetFlags[iteratorM] == 6) {
                    paramsArray[1] = 3;
                    paramsArray[15] = 0;
                    paramsArray[16] = 0;
                    paramsArray[18] = util.getFirstDayOfNextMonthToIST();
                    paramsArray[19] = util.getLastDayOfNextMonthToIST();
                }
                if (widgetFlags[iteratorM] == 7) {
                    paramsArray[1] = 3;
                    paramsArray[15] = 0;
                    paramsArray[16] = 0;
                    paramsArray[18] = util.getFirstDayOfCurrentQuarterToIST();
                    paramsArray[19] = util.getLastDayOfCurrentQuarterToIST();
                }
                paramsArray.push(widgetFlags[iteratorM]);
                paramsArray[10] = 0; //request.asset_id;

                responseJson.filter_date_type_id = paramsArray[1];
                responseJson.filter_activity_status_type_id = paramsArray[15];
                responseJson.datetime_start = paramsArray[18];
                responseJson.datetime_end = paramsArray[19];
                responseJson.filter_asset_id = paramsArray[10];
                responseJson.sequence_id = widgetFlags[iteratorM];
                resourceResponseAdditonalMap.set(iteratorM, responseJson);

                let [errr, opptydata] = await this.widgetValuesOpptyVertical(request, paramsArray);
                if (!errr) {
                    opptyVerticalMap.set(iteratorM, opptydata);
                }
            }

            if (isError) {
                return Promise.resolve(request.verticalData.error_response);
            }

            let vertical_name = null;

            for (let entry of resourceMap.entries()) {
                vertical_tag_id = entry[0];
                vertical_name = entry[1];
                if (paramsArray[12] == vertical_tag_id) {
                    break;
                }
            }

            console.log("-------------");
            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let opptydata = opptyVerticalMap.get(iteratorM);
                for (let idx = 0; idx < opptydata.length; idx++) {
                    let asset_id = opptydata[idx].activity_creator_asset_id;
                    let isResource = false;
                    if (finalResourceMap.has(asset_id)) {
                        console.log("asset_id == manager_asset_id " + asset_id);
                        isResource = true;
                    }
                    if (resourceReporteesMappingMap.has(asset_id) || isResource) {
                        let manager_asset_id = null;
                        if (isResource) {
                            manager_asset_id = asset_id;
                            console.log("iteratorM= " + iteratorM + " : asset_id == manager_asset_id [" + asset_id + " == " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                        } else {
                            manager_asset_id = resourceReporteesMappingMap.get(asset_id);
                            console.log("iteratorM= " + iteratorM + " : asset_id != manager_asset_id [" + asset_id + " != " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                        }
                        let newMap = finalResourceMap.get(manager_asset_id);
                        let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                        let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                        let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                        count = count + opptydata[idx].count;
                        quantity = quantity + opptydata[idx].quantity;
                        value = value + opptydata[idx].value;
                        newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                        newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                        newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                        finalResourceMap.set(manager_asset_id, newMap);
                    }
                }
            }
            console.log("-------------");

            for (let idx = 0; idx < assetsData.length; idx++) {
                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    let responseJson = Object.assign({}, resourceResponseAdditonalMap.get(iteratorM));
                    responseJson.vertical_tag_id = vertical_tag_id;
                    responseJson.vertical_name = vertical_name;
                    delete responseJson["filter_asset_id"];
                    responseJson.target_asset_id = assetsData[idx].asset_id;
                    resourceValueFlgArray[iteratorM] = responseJson;
                }
            }


            let resourceValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                resourceValueFlgArrayTotal[i] = {};
                resourceValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArray[i]);
            }

            for (let [key, value] of finalResourceMap) {
                let newMap = value;
                let manager_asset_id = key;
                let assetRspData = {};
                assetRspData.resource_name = newMap.get(manager_asset_id);
                let cnt = 1;
                for (let i = 0; i < widgetFlags.length; i++) {
                    let responseData = Object.assign({}, resourceValueFlgArrayTotal[i]);
                    responseData.target_asset_id = manager_asset_id;
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_count") || 0;
                    countTotal[i] = countTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_quantity") || 0;
                    quantityTotal[i] = quantityTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    let flagValue = parseFloat(newMap.get("flag_" + (i + 1) + "_value") || 0).toFixed(2);
                    assetRspData["flag_" + cnt] = flagValue;
                    valueTotal[i] = parseFloat(valueTotal[i]) + parseFloat(flagValue);
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                }
                results.push(assetRspData);
            }

            //For Total
            let verticalValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                verticalValueFlgArrayTotal[i] = {};
                verticalValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArrayTotal[i]);
                verticalValueFlgArrayTotal[i].vertical_tag_id = 0;
                delete verticalValueFlgArrayTotal[i]['vertical_name'];
            }
            let resultData = {};
            resultData.resource_name = "Total";
            let assetRspDataV1 = {};
            let cnt = 1;
            for (let j = 0; j < widgetFlags.length; j++) {
                resultData["flag_" + cnt] = countTotal[j] || 0;
                countTotal[j] = countTotal[j] + assetRspDataV1["flag_" + cnt];
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = quantityTotal[j] || 0;
                quantityTotal[j] = quantityTotal[j] + assetRspDataV1["flag_" + cnt];
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = parseFloat(valueTotal[j] || 0).toFixed(2);
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
            }
            results.push(resultData);

            return Promise.resolve(results);   

        } catch (error) {
            console.log("error :; ", error);
            return Promise.resolve(request.verticalData.error_response);
        }
    }

    this.widgetValuesOpptyVertical = async (request, paramsArr) => {

        let responseData = [],
            error = true;

        const queryString = util.getQueryString('ds_v1_9_activity_search_list_select_widget_values_oppty_vertical', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    paramsArr.pop();
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }

        return [error, responseData];
    }

    this.getResourcesListForSelectedVertical = async (request, paramsArr) => {

        let responseData = [],
            error = true;

        const queryString = util.getQueryString('ds_v1_asset_manager_mapping_select_reportees_high_level', paramsArr);
        //const queryString = util.getQueryString('ds_v1_asset_list_select_vertical', paramsArr);
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
    //------------------------------------------------------------------------


    //------------------------------------------------------------------------
    //Mangesh S
    //Get resource and vertical details for specified vertical_tag_id and filter_asset_id
    this.getManagementWidgetValueResourceAndVertical = async (request) => {

        try {
            let results = new Array();
            let paramsArray;
            let tempResult;
            let timezoneOffset = 0;

            //Setting the activity_id in response
            results[0] =
            {
                activity_id: request.activity_id,
            };

            //Get the timezone of the account
            paramsArray =
                new Array
                    (
                        request.account_id
                    );

            console.log(request, null, 2);

            tempResult = await db.callDBProcedureR2(request, "ds_p1_account_list_select_timezone", paramsArray, 1);
            console.log(tempResult);
            timezoneID = tempResult[0].account_timezone_id;
            timezoneOffset = tempResult[0].account_timezone_offset;

            //Get the number of selections for status category
            console.log(JSON.parse(request.filter_activity_status_type_id).length);
            arrayStatusTypes = JSON.parse(request.filter_activity_status_type_id);

            console.log("request.activity_status_id :: " + request.activity_status_id);
            let arrayStatuses = new Array();
            if (request.hasOwnProperty("activity_status_id")) {
                //console.log(JSON.parse(request.activity_status_id).length);
                if (request.activity_status_id != 0) {
                    arrayStatuses = JSON.parse(request.activity_status_id);
                } else {
                    let json = { "activity_status_id": 0 };
                    arrayStatuses.push(json);
                    console.log("arrayStatuses2 :: " + JSON.stringify(arrayStatuses));
                }
            } else {

                let json = { "activity_status_id": 0 };
                arrayStatuses.push(json);
                console.log("arrayStatuses2 :: " + JSON.stringify(arrayStatuses));
            }

            console.log("filter_hierarchy " + request.filter_hierarchy);

            if (!request.hasOwnProperty("filter_hierarchy")) {
                request.filter_hierarchy = 0;
            }

            //if (request.tag_type_id == 130)
            //    request.filter_asset_id = request.asset_id;

            console.log('request.filter_is_datetime_considered :: ' + request.filter_is_datetime_considered);

            try {

                console.log('request.tag_type_id ' + request.tag_type_id);

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
                            parseInt(request.tag_type_id),
                            parseInt(request.filter_tag_id) || 0,
                            parseInt(request.filter_activity_type_id),
                            global.analyticsConfig.activity_id_all, //Activity ID,
                            parseInt(request.filter_activity_status_type_id),
                            parseInt(request.filter_activity_status_tag_id),
                            // parseInt(request.filter_activity_status_id),
                            parseInt(arrayStatuses[0].activity_status_id),
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
                            request.filter_is_lead || 0,
                            request.filter_campaign_activity_id || 0,
                            request.filter_field_entity_1 || '',
                            request.filter_field_entity_2 || '',
                            request.filter_field_entity_3 || '',
                            request.filter_field_entity_4 || '',
                            request.filter_field_entity_5 || '',
                            parseInt(request.page_start) || 0,
                            parseInt(request.page_limit) || 50
                        );

                if ([128, 129, 130].includes(parseInt(request.widget_type_id))) {
                    request.verticalData = global.analyticsConfig.vertical;
                    results = await this.prepareWidgetDataForResourceAndVertical(request, paramsArray);

                }

            } catch (e) {
                console.log('error ::', e);
            }
            //console.log("results "+results)
            return results;
        }
        catch (error) {
            console.log("Error========");
            console.log(error);
            return Promise.reject(error);
        }
    };

    this.prepareWidgetDataForResourceAndVertical = async (request, paramsArray) => {

        return new Promise((resolve) => {

            let requestObj = {
                "organization_id": request.organization_id,
                "account_id": request.account_id,
                "workforce_id": request.workforce_id,
                "segment_id": request.segment_id || 0,
                "target_asset_id": request.asset_id,
                "tag_type_id": request.tag_type_id || 0,
                "tag_id": request.tag_id || 0,
                "cluster_tag_id": request.cluster_tag_id || 0,
                "vertical_tag_id": request.vertical_tag_id || 0,
                "flag": 28,
                "page_start": request.page_start || 0,
                "page_limit": request.page_limit || 50
            };

            assetService.assetAccessLevelMappingSelectFlagV2(requestObj)
                .then(async (data) => {
                    console.log("1");
                    let resourceMap = new Map();

                    if (data !== undefined && data.length >= 2) {

                        let verticalsArray = data[1];
                        for (index = 0; index < verticalsArray.length; index++) {

                            let vertical = verticalsArray[index];
                            if (vertical !== undefined && vertical.hasOwnProperty('tag_id')) {

                                let tag_id = vertical.tag_id;
                                if (tag_id !== null && tag_id > 0) {

                                    let tag_name = verticalsArray[index].tag_name;
                                    if ("All" !== tag_name) {
                                        resourceMap.set(tag_id, tag_name);
                                    }
                                    if (Number(request.filter_tag_id) == tag_id) {
                                        break;
                                    }
                                }

                            }

                        }
                    }
                    console.log("2");
                    /*
                    if (resourceMap.size == 0) {
                        console.log("3");
                        console.log("Vertical details not available, so need to prepare data for widget_type_id = " + request.widget_type_id);
                        let results = new Array();
                        results.push(request.verticalData[request.widget_type_id]);
                        resolve(results);

                    } else { */
                        console.log("4");
                        let [err, assetsData] = await this.getResourcesListForSelectedVerticalAndAsset(request, new Array(request.organization_id, request.filter_tag_id, request.filter_asset_id, 0, 100));
                        let [err1, hierarchyAssetsData] = await this.getResourcesHierarchyOfDirectReportees(request, new Array(request.organization_id, request.filter_tag_id, request.filter_asset_id, 0, 100));
                        if (err) {
                            console.log("getResourcesListForSelectedVerticalAndAsset : Exception : ");
                            console.log(err);
                            resolve(err);
                        } else {
                            request.widget_type_id = Number(request.widget_type_id) || 0;
                            switch (request.widget_type_id) {

                                case 128: {
                                    console.log("128request.widget_type_id " + request.widget_type_id);
                                    resolve(await this.prepareDataForWidgetType128ForResourceAndVertical(request, paramsArray, resourceMap, assetsData, hierarchyAssetsData));
                                    break;
                                }
                                case 129: {
                                    console.log("129request.widget_type_id " + request.widget_type_id);
                                    resolve(await this.prepareDataForWidgetType129ForResourceAndVertical(request, paramsArray, resourceMap, assetsData, hierarchyAssetsData));
                                    break;
                                }
                                case 130: {
                                    console.log("130request.widget_type_id " + request.widget_type_id);
                                    resolve(await this.prepareDataForWidgetType130ForResourceAndVeritcal(request, paramsArray, resourceMap, assetsData, hierarchyAssetsData));
                                    break;
                                }
                                default: {
                                    console.log("defaultrequest.widget_type_id " + request.widget_type_id);
                                }
                            }
                        }
                   // }
                })
                .catch((error) => {
                    console.log("prepareWidgetData : Exception : ");
                    console.log(error);
                    resolve(request.verticalData.error_response);
                });
        });

    }

    this.prepareDataForWidgetType128ForResourceAndVertical = async (request, paramsArray, resourceMap, assetsData, hierarchyAssetsData) => {

        try {
            console.log("prepareDataForWidgetType128ForResourceAndVertical :: ");
            let results = new Array();
            let widgetFlags = new Array();
            let resourceValueFlgArray = new Array();
            let countTotal = new Array();
            let quantityTotal = new Array();
            let valueTotal = new Array();
            let resourceReporteesMappingMap = new Map();
            let resourceHierarchyReporteesMappingMap = new Map();
            let finalResourceMap = new Map();
            for (let i = 0; i < 2; i++) {
                widgetFlags[i] = i + 1;
                resourceValueFlgArray[i] = {};
                countTotal[i] = 0; quantityTotal[i] = 0; valueTotal[i] = 0;
            }
            let resourceResponseAdditonalMap = new Map();
            let isError = false;

            let opptyVerticalMap = new Map();
            request.resourceData = global.analyticsConfig.resource;
            let header = request.resourceData[request.widget_type_id];
            results.push(header);

            let vertical_tag_id = paramsArray[12];
            let assetMap = new Map();

            for( let counter = 0; counter < hierarchyAssetsData.length; counter ++){
                resourceHierarchyReporteesMappingMap.set(hierarchyAssetsData[counter].asset_id, hierarchyAssetsData[counter].manager_asset_id)
            }

            for (let idx = 0; idx < assetsData.length; idx++) {
                resourceReporteesMappingMap.set(assetsData[idx].asset_id, assetsData[idx].manager_asset_id);

                let map = new Map();
                for (let i = 0; i < widgetFlags.length; i++) {
                    map.set("flag_" + (i + 1), 0);
                }
                assetMap.set(assetsData[idx].asset_id, map);

                if (!finalResourceMap.has(assetsData[idx].asset_id)) {
                    let newMap = new Map();
                    for (let i = 0; i < widgetFlags.length; i++) {
                        newMap.set("flag_" + (i + 1), 0);
                    }
                    newMap.set(assetsData[idx].asset_id, assetsData[idx].operating_asset_first_name);
                    finalResourceMap.set(assetsData[idx].asset_id, newMap);
                }
            }

            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let responseJson = {};
                if (isError) {
                    break;
                }
                //paramsArray[18] = util.getFirstDayOfCurrentMonthToIST();
                //paramsArray[19] = util.getLastDayOfCurrentMonthToIST();
                paramsArray[15] = 0;
                paramsArray[16] = 0;
                paramsArray[1] = request.filter_date_type_id;
                if (widgetFlags[iteratorM] == 2) {
                    paramsArray[1] = 2;
                    paramsArray[15] = 1;
                    paramsArray[16] = 148;
                }
                paramsArray.push(widgetFlags[iteratorM]);
                paramsArray[10] = request.filter_asset_id;

                responseJson.datetime_start = paramsArray[18];
                responseJson.datetime_end = paramsArray[19];
                responseJson.filter_activity_status_type_id = paramsArray[15];
                responseJson.filter_activity_status_tag_id = paramsArray[16];
                responseJson.filter_date_type_id = paramsArray[1];
                responseJson.filter_asset_id = paramsArray[10];
                responseJson.sequence_id = widgetFlags[iteratorM];
                resourceResponseAdditonalMap.set(iteratorM, responseJson);
                resourceValueFlgArray[iteratorM] = responseJson;

                let [errr, opptydata] = await this.widgetValuesOpptyVerticalAndAsset(request, paramsArray);
                if (!errr) {
                    opptyVerticalMap.set(iteratorM, opptydata);
                    console.log("iterator = " + iteratorM + " : opptydata size = " + opptydata.length);
                } else {
                    console.log(errr);
                }
            }

            if (isError) {
                return Promise.resolve(request.verticalData.error_response);
            }

            let vertical_name = null;

            for (let entry of resourceMap.entries()) {
                vertical_tag_id = entry[0];
                vertical_name = entry[1];
                if (paramsArray[12] == vertical_tag_id) {
                    break;
                }
            }
            console.log("opptyVerticalMap", opptyVerticalMap)
            console.log("finalResourceMap",finalResourceMap)
            console.log("resourceHierarchyReporteesMappingMap",resourceHierarchyReporteesMappingMap)
            console.log("resourceReporteesMappingMap",resourceReporteesMappingMap)
            console.log("assetMap",assetMap)
            console.log("-------------");
            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let opptydata = opptyVerticalMap.get(iteratorM) || [];
                for (let idx = 0; idx < opptydata.length; idx++) {
                    console.log("ii "+JSON.stringify(opptydata[idx]))
                    let asset_id = opptydata[idx].activity_creator_asset_id;
                    let isResource = false;
                    if (resourceHierarchyReporteesMappingMap.has(asset_id)) {
                        console.log("asset_id == manager_asset_id " + asset_id);
                        isResource = true;
                    }
                    console.log("1. isResource-------------"+isResource);
                    console.log("2. asset_id-------------"+asset_id);
                    console.log("3. resourceReporteesMappingMap.has(asset_id) "+resourceReporteesMappingMap.has(asset_id))
                    console.log("4. assetMap.has(asset_id)"+assetMap.has(asset_id));
                    if (resourceReporteesMappingMap.has(asset_id) || isResource) {
                        
                        let manager_asset_id = null;
                        if (!isResource) {
                            manager_asset_id = asset_id;
                            console.log("iteratorM= " + iteratorM + " : asset_id == manager_asset_id [" + asset_id + " == " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                            // let newMap = finalResourceMap.get(manager_asset_id) || new Map();
                            // let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                            // let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                            // let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                            // count = count + opptydata[idx].count;
                            // quantity = quantity + opptydata[idx].quantity;
                            // value = value + opptydata[idx].value;
                            // // newMap.set(asset_id, opptydata[idx].activity_creator_operating_asset_first_name);
                            // newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                            // newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                            // newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                            // finalResourceMap.set(manager_asset_id, newMap);
                        } else {
                            manager_asset_id = resourceHierarchyReporteesMappingMap.get(asset_id);
                            console.log("iteratorM= " + iteratorM + " : asset_id != manager_asset_id [" + asset_id + " != " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                            // let newMap = finalResourceMap.get(manager_asset_id) || new Map();
                            // let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                            // let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                            // let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                            // count = count + opptydata[idx].count;
                            // quantity = quantity + opptydata[idx].quantity;
                            // value = value + opptydata[idx].value;
                            // newMap.set(asset_id, opptydata[idx].activity_creator_operating_asset_first_name);
                            // newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                            // newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                            // newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                            // finalResourceMap.set(asset_id, newMap);
                        }
                        console.log("manager_asset_id "+manager_asset_id)
                        let newMap = finalResourceMap.get(manager_asset_id) || new Map();
                        let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                        let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                        let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                        count = count + opptydata[idx].count;
                        quantity = quantity + opptydata[idx].quantity;
                        value = value + opptydata[idx].value;
                        newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                        newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                        newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                        finalResourceMap.set(manager_asset_id, newMap);
                    } else if (assetMap.has(asset_id)) {
                        console.log("5.assetMap.has(asset_id)"+assetMap.has(asset_id));
                        let newMap = assetMap.get(asset_id);
                       // let newMap = finalResourceMap.get(manager_asset_id);
                        let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                        let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                        let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                        count = count + opptydata[idx].count;
                        quantity = quantity + opptydata[idx].quantity;
                        value = value + opptydata[idx].value;
                        newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                        newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                        newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                        assetMap.set(asset_id, newMap);
                        console.log("asset_id != manager_asset_id [" + asset_id + " != " + resourceReporteesMappingMap.get(asset_id) + "]");
                        console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                    } else {
                        console.log("6. finalResourceMap.get(asset_id)"+finalResourceMap.has(asset_id));
                        console.log("6.1 assetMap.has(asset_id) "+assetMap.has(asset_id))
                        console.log("6.2 String(request.filter_asset_id) === String(asset_id) "+String(request.filter_asset_id) === String(asset_id))
                        if ((String(request.filter_asset_id) === String(asset_id))) {
                            //let opttyMap = new Map();
                            let opttyMap = finalResourceMap.get(asset_id) ||  new Map();
                            let count = opttyMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                            let quantity = opttyMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                            let value = opttyMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                            count = count + opptydata[idx].count;
                            quantity = quantity + opptydata[idx].quantity;
                            value = value + opptydata[idx].value;                            
                            opttyMap.set("flag_" + (iteratorM + 1) + "_count", opptydata[idx].count);
                            opttyMap.set("flag_" + (iteratorM + 1) + "_quantity", opptydata[idx].quantity);
                            opttyMap.set("flag_" + (iteratorM + 1) + "_value", opptydata[idx].value);
                            opttyMap.set(asset_id, opptydata[idx].activity_creator_operating_asset_first_name);
                            console.log("No reportees available. So adding oppty asset directly to response [" + asset_id + "]");
                            finalResourceMap.set(asset_id, opttyMap);
                        }else{
                            console.log("7. ")
                        }
                    }
                }
            }
            console.log("-------------");
            console.log("assetsData",assetsData)
            /*
            for (let idx = 0; idx < assetsData.length; idx++) {
                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    let responseJson = Object.assign({}, resourceResponseAdditonalMap.get(iteratorM));
                    responseJson.vertical_tag_id = vertical_tag_id;
                    responseJson.vertical_name = vertical_name;
                    delete responseJson["filter_asset_id"];
                    responseJson.target_asset_id = assetsData[idx].asset_id;
                    resourceValueFlgArray[iteratorM] = responseJson;
                }

                let assetRspData = {};
                assetRspData.resource_name = assetsData[idx].operating_asset_first_name;
                let cnt = 1;
                for (let i = 0; i < widgetFlags.length; i++) {
                    assetRspData["flag_" + cnt] = assetMap.get(assetsData[idx].asset_id).get("flag_" + (i + 1) + "_count") || 0;
                    assetRspData["flag_" + cnt + "_1"] = resourceValueFlgArray[i]; cnt++;
                    assetRspData["flag_" + cnt] = assetMap.get(assetsData[idx].asset_id).get("flag_" + (i + 1) + "_quantity") || 0;
                    assetRspData["flag_" + cnt + "_1"] = resourceValueFlgArray[i]; cnt++;
                    assetRspData["flag_" + cnt] = assetMap.get(assetsData[idx].asset_id).get("flag_" + (i + 1) + "_value") || 0;
                    assetRspData["flag_" + cnt + "_1"] = resourceValueFlgArray[i]; cnt++;
                }
                console.log("assetRspData",assetRspData)
                results.push(assetRspData);

            } */
            console.log("results",results)
            let resourceValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                resourceValueFlgArrayTotal[i] = {};
                resourceValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArray[i]);
            }
            /*
            if (results.length == 1 && finalResourceMap.size == 0) {
                let newMap = new Map();
                for (let i = 0; i < widgetFlags.length; i++) {
                    newMap.set("flag_" + (i + 1), 0);
                }
                request.asset_id = request.filter_asset_id;
                let [err, assetData] = await activityCommonService.getAssetDetailsAsync(request);
                newMap.set(request.filter_asset_id, assetData[0].operating_asset_first_name);
                finalResourceMap.set(request.filter_asset_id, newMap);
                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    let newMap = finalResourceMap.get(request.filter_asset_id) || new Map();
                    newMap.set("flag_" + (iteratorM + 1) + "_count", 0);
                    newMap.set("flag_" + (iteratorM + 1) + "_quantity", 0);
                    newMap.set("flag_" + (iteratorM + 1) + "_value", 0);
                    finalResourceMap.set(request.filter_asset_id, newMap);
                }
            }
           
            */
            console.log("finalResourceMap ", JSON.stringify(finalResourceMap));
            for (let [key, value] of finalResourceMap) {
                console.log("key:"+key+" value:"+JSON.stringify(value))
                let newMap = value;
                let manager_asset_id = key;
                let assetRspData = {};
                assetRspData.resource_name = newMap.get(manager_asset_id);
                let cnt = 1;
                for (let i = 0; i < widgetFlags.length; i++) {
                    let responseData = Object.assign({}, resourceValueFlgArrayTotal[i]);
                    responseData.target_asset_id = manager_asset_id;
                    delete responseData["filter_asset_id"];
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_count") || 0;
                    countTotal[i] = countTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_quantity") || 0;
                    quantityTotal[i] = quantityTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    let flagValue = parseFloat(newMap.get("flag_" + (i + 1) + "_value") || 0).toFixed(2);
                    assetRspData["flag_" + cnt] = flagValue;
                    valueTotal[i] = parseFloat(valueTotal[i]) + parseFloat(flagValue);
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                }
                results.push(assetRspData);
            } 

            //For Total
            let verticalValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                verticalValueFlgArrayTotal[i] = {};
                verticalValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArrayTotal[i]);
                verticalValueFlgArrayTotal[i].vertical_tag_id = 0;
                delete verticalValueFlgArrayTotal[i]['vertical_name'];
            }
            let resultData = {};
            resultData.resource_name = "Total";
            let cnt = 1;
            for (let j = 0; j < widgetFlags.length; j++) {
                resultData["flag_" + cnt] = countTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = quantityTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = parseFloat(valueTotal[j] || 0).toFixed(2);
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
            }
            results.push(resultData);

            return Promise.resolve(results);  

        } catch (error) {
            console.log("error :; ", error);
            return Promise.resolve(request.verticalData.error_response);
        }
    }

    this.prepareDataForWidgetType129ForResourceAndVertical = async (request, paramsArray, resourceMap, assetsData, hierarchyAssetsData) => {

        try {
            console.log("prepareDataForWidgetType129ForResourceAndVertical :: ");
            let activityStatusTypeIdArray = new Array(0, 0, 0, 0, 1, 1, 1, 1);
            let results = new Array();
            let widgetFlags = new Array();
            let resourceValueFlgArray = new Array();
            let countTotal = new Array();
            let quantityTotal = new Array();
            let valueTotal = new Array();
            let resourceReporteesMappingMap = new Map();
            let resourceHierarchyReporteesMappingMap = new Map();
            let finalResourceMap = new Map();
            for (let i = 0; i < 8; i++) {
                widgetFlags[i] = i + 1;
                resourceValueFlgArray[i] = {};
                countTotal[i] = 0; quantityTotal[i] = 0; valueTotal[i] = 0;
            }
            let resourceResponseAdditonalMap = new Map();
            let isError = false;

            let opptyVerticalMap = new Map();
            request.resourceData = global.analyticsConfig.resource;
            let header = request.resourceData[request.widget_type_id];
            results.push(header);

            let vertical_tag_id = paramsArray[12];
            let assetMap = new Map();

            for( let counter = 0; counter < hierarchyAssetsData.length; counter ++){
                resourceHierarchyReporteesMappingMap.set(hierarchyAssetsData[counter].asset_id, hierarchyAssetsData[counter].manager_asset_id)
            }            

            for (let idx = 0; idx < assetsData.length; idx++) {
                resourceReporteesMappingMap.set(assetsData[idx].asset_id, assetsData[idx].manager_asset_id);

                let map = new Map();
                for (let i = 0; i < widgetFlags.length; i++) {
                    map.set("flag_" + (i + 1), 0);
                }
                assetMap.set(assetsData[idx].asset_id, map);

                if (!finalResourceMap.has(assetsData[idx].asset_id)) {
                    let newMap = new Map();
                    for (let i = 0; i < widgetFlags.length; i++) {
                        newMap.set("flag_" + (i + 1), 0);
                    }
                    newMap.set(assetsData[idx].asset_id, assetsData[idx].operating_asset_first_name);
                    finalResourceMap.set(assetsData[idx].asset_id, newMap);
                }
            }

            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let responseJson = {};
                if (isError) {
                    break;
                }

                paramsArray[15] = activityStatusTypeIdArray[iteratorM];
                let status_tags = request.verticalData["status_tags"];
                let key = request.verticalData["status_tags_array"][iteratorM];
                paramsArray[16] = status_tags[key];
                paramsArray.push(widgetFlags[iteratorM]);
                paramsArray[10] = request.filter_asset_id;

                if (widgetFlags[iteratorM] > 4 && widgetFlags[iteratorM] < 8) {
                    paramsArray[1] = 2;
                }

                responseJson.filter_date_type_id = paramsArray[1];
                responseJson.filter_activity_status_tag_id = paramsArray[16];
                responseJson.filter_asset_id = paramsArray[10];
                responseJson.sequence_id = widgetFlags[iteratorM];
                resourceResponseAdditonalMap.set(iteratorM, responseJson);
                resourceValueFlgArray[iteratorM] = responseJson;

                let [errr, opptydata] = await this.widgetValuesOpptyVerticalAndAsset(request, paramsArray);
                if (!errr) {
                    opptyVerticalMap.set(iteratorM, opptydata);
                    console.log("iterator = " + iteratorM + " : opptydata size = " + opptydata.length);
                }
            }

            if (isError) {
                return Promise.resolve(request.verticalData.error_response);
            }

            let vertical_name = null;

            for (let entry of resourceMap.entries()) {
                vertical_tag_id = entry[0];
                vertical_name = entry[1];
                if (paramsArray[12] == vertical_tag_id) {
                    break;
                }
            }

            console.log("-------------");
            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let opptydata = opptyVerticalMap.get(iteratorM) || [];
                for (let idx = 0; idx < opptydata.length; idx++) {
                    console.log("ii "+JSON.stringify(opptydata[idx]))
                    let asset_id = opptydata[idx].activity_creator_asset_id;
                    let isResource = false;
                    if (resourceHierarchyReporteesMappingMap.has(asset_id)) {
                        console.log("asset_id == manager_asset_id " + asset_id);
                        isResource = true;
                    }
                    console.log("1. isResource-------------"+isResource);
                    console.log("2. asset_id-------------"+asset_id);
                    console.log("3. resourceReporteesMappingMap.has(asset_id) "+resourceReporteesMappingMap.has(asset_id))
                    console.log("4. assetMap.has(asset_id)"+assetMap.has(asset_id));
                    if (resourceReporteesMappingMap.has(asset_id) || isResource) {
                        
                        let manager_asset_id = null;
                        if (!isResource) {
                            manager_asset_id = asset_id;
                            console.log("iteratorM= " + iteratorM + " : asset_id == manager_asset_id [" + asset_id + " == " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                            // let newMap = finalResourceMap.get(manager_asset_id) || new Map();
                            // let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                            // let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                            // let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                            // count = count + opptydata[idx].count;
                            // quantity = quantity + opptydata[idx].quantity;
                            // value = value + opptydata[idx].value;
                            // // newMap.set(asset_id, opptydata[idx].activity_creator_operating_asset_first_name);
                            // newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                            // newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                            // newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                            // finalResourceMap.set(manager_asset_id, newMap);
                        } else {
                            manager_asset_id = resourceHierarchyReporteesMappingMap.get(asset_id);
                            console.log("iteratorM= " + iteratorM + " : asset_id != manager_asset_id [" + asset_id + " != " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                            // let newMap = finalResourceMap.get(manager_asset_id) || new Map();
                            // let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                            // let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                            // let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                            // count = count + opptydata[idx].count;
                            // quantity = quantity + opptydata[idx].quantity;
                            // value = value + opptydata[idx].value;
                            // newMap.set(asset_id, opptydata[idx].activity_creator_operating_asset_first_name);
                            // newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                            // newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                            // newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                            // finalResourceMap.set(asset_id, newMap);
                        }
                        console.log("manager_asset_id "+manager_asset_id)
                        let newMap = finalResourceMap.get(manager_asset_id) || new Map();
                        let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                        let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                        let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                        count = count + opptydata[idx].count;
                        quantity = quantity + opptydata[idx].quantity;
                        value = value + opptydata[idx].value;
                        newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                        newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                        newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                        finalResourceMap.set(manager_asset_id, newMap);
                    } else if (assetMap.has(asset_id)) {
                        console.log("5.assetMap.has(asset_id)"+assetMap.has(asset_id));
                        let newMap = assetMap.get(asset_id);
                       // let newMap = finalResourceMap.get(manager_asset_id);
                        let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                        let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                        let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                        count = count + opptydata[idx].count;
                        quantity = quantity + opptydata[idx].quantity;
                        value = value + opptydata[idx].value;
                        newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                        newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                        newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                        assetMap.set(asset_id, newMap);
                        console.log("asset_id != manager_asset_id [" + asset_id + " != " + resourceReporteesMappingMap.get(asset_id) + "]");
                        console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                    } else {
                        console.log("6. finalResourceMap.get(asset_id)"+finalResourceMap.has(asset_id));
                        console.log("6.1 assetMap.has(asset_id) "+assetMap.has(asset_id))
                        console.log("6.2 String(request.filter_asset_id) === String(asset_id) "+String(request.filter_asset_id) === String(asset_id))
                        if ((String(request.filter_asset_id) === String(asset_id))) {
                            //let opttyMap = new Map();
                            let opttyMap = finalResourceMap.get(asset_id) ||  new Map();
                            let count = opttyMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                            let quantity = opttyMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                            let value = opttyMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                            count = count + opptydata[idx].count;
                            quantity = quantity + opptydata[idx].quantity;
                            value = value + opptydata[idx].value;                            
                            opttyMap.set("flag_" + (iteratorM + 1) + "_count", opptydata[idx].count);
                            opttyMap.set("flag_" + (iteratorM + 1) + "_quantity", opptydata[idx].quantity);
                            opttyMap.set("flag_" + (iteratorM + 1) + "_value", opptydata[idx].value);
                            opttyMap.set(asset_id, opptydata[idx].activity_creator_operating_asset_first_name);
                            console.log("No reportees available. So adding oppty asset directly to response [" + asset_id + "]");
                            finalResourceMap.set(asset_id, opttyMap);
                        }else{
                            console.log("7. ")
                        }
                    }
                }
            }
            console.log("-------------");
/*
            for (let idx = 0; idx < assetsData.length; idx++) {

                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    let responseJson = Object.assign({}, resourceResponseAdditonalMap.get(iteratorM));
                    responseJson.vertical_tag_id = vertical_tag_id;
                    responseJson.vertical_name = vertical_name;
                    delete responseJson["filter_asset_id"];
                    responseJson.target_asset_id = assetsData[idx].asset_id;
                    resourceValueFlgArray[iteratorM] = responseJson;
                }

                let assetRspData = {};
                assetRspData.resource_name = assetsData[idx].operating_asset_first_name;

                let cnt = 1;
                for (let i = 0; i < widgetFlags.length; i++) {
                    assetRspData["flag_" + cnt] = assetMap.get(assetsData[idx].asset_id).get("flag_" + (i + 1) + "_count") || 0;
                    assetRspData["flag_" + cnt + "_1"] = resourceValueFlgArray[i]; cnt++;
                    assetRspData["flag_" + cnt] = assetMap.get(assetsData[idx].asset_id).get("flag_" + (i + 1) + "_quantity") || 0;
                    assetRspData["flag_" + cnt + "_1"] = resourceValueFlgArray[i]; cnt++;
                    assetRspData["flag_" + cnt] = assetMap.get(assetsData[idx].asset_id).get("flag_" + (i + 1) + "_value") || 0;
                    assetRspData["flag_" + cnt + "_1"] = resourceValueFlgArray[i]; cnt++;
                }
                results.push(assetRspData);

            } */

            let resourceValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                resourceValueFlgArrayTotal[i] = {};
                resourceValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArray[i]);
            }
            /*
            if (results.length == 1 && finalResourceMap.size == 0) {
                let newMap = new Map();
                for (let i = 0; i < widgetFlags.length; i++) {
                    newMap.set("flag_" + (i + 1), 0);
                }
                request.asset_id = request.filter_asset_id;
                let [err, assetData] = await activityCommonService.getAssetDetailsAsync(request);
                newMap.set(request.filter_asset_id, assetData[0].operating_asset_first_name);
                finalResourceMap.set(request.filter_asset_id, newMap);
                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    let newMap = finalResourceMap.get(request.filter_asset_id) || new Map();
                    newMap.set("flag_" + (iteratorM + 1) + "_count", 0);
                    newMap.set("flag_" + (iteratorM + 1) + "_quantity", 0);
                    newMap.set("flag_" + (iteratorM + 1) + "_value", 0);
                    finalResourceMap.set(request.filter_asset_id, newMap);
                }
            } */
            console.log("finalResourceMap ", JSON.stringify(finalResourceMap));

            for (let [key, value] of finalResourceMap) {
                console.log("key:" + key + " value:" + JSON.stringify(value))
                let newMap = value;
                let manager_asset_id = key;
                let assetRspData = {};
                assetRspData.resource_name = newMap.get(manager_asset_id);
                let cnt = 1;
                for (let i = 0; i < widgetFlags.length; i++) {
                    let responseData = Object.assign({}, resourceValueFlgArrayTotal[i]);
                    responseData.target_asset_id = manager_asset_id;
                    delete responseData["filter_asset_id"];
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_count") || 0;
                    countTotal[i] = countTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_quantity") || 0;
                    quantityTotal[i] = quantityTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    let flagValue = parseFloat(newMap.get("flag_" + (i + 1) + "_value") || 0).toFixed(2);
                    assetRspData["flag_" + cnt] = flagValue;
                    valueTotal[i] = parseFloat(valueTotal[i]) + parseFloat(flagValue);
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                }
                results.push(assetRspData);
            }

            //For Total
            let verticalValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                verticalValueFlgArrayTotal[i] = {};
                verticalValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArrayTotal[i]);
                verticalValueFlgArrayTotal[i].vertical_tag_id = 0;
                delete verticalValueFlgArrayTotal[i]['vertical_name'];
            }
            let resultData = {};
            resultData.resource_name = "Total";
            let cnt = 1;
            for (let j = 0; j < widgetFlags.length; j++) {
                resultData["flag_" + cnt] = countTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = quantityTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = parseFloat(valueTotal[j] || 0).toFixed(2);
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
            }
            results.push(resultData);

            return Promise.resolve(results);

        } catch (error) {
            console.log("error :; ", error);
            return Promise.resolve(request.verticalData.error_response);
        }
    }

    this.prepareDataForWidgetType130ForResourceAndVeritcal = async (request, paramsArray, resourceMap, assetsData, hierarchyAssetsData) => {

        try {
            console.log("prepareDataForWidgetType130ForResourceAndVeritcal :: ",JSON.stringify(assetsData));
            let results = new Array();
            let widgetFlags = new Array();
            let resourceValueFlgArray = new Array();
            let countTotal = new Array();
            let quantityTotal = new Array();
            let valueTotal = new Array();
            let resourceReporteesMappingMap = new Map();
            let resourceHierarchyReporteesMappingMap = new Map();
            let finalResourceMap = new Map();
            for (let i = 0; i < 7; i++) {
                widgetFlags[i] = i + 1;
                resourceValueFlgArray[i] = {};
                countTotal[i] = 0; quantityTotal[i] = 0; valueTotal[i] = 0;
            }

            let resourceResponseAdditonalMap = new Map();
            let isError = false;

            let opptyVerticalMap = new Map();
            request.resourceData = global.analyticsConfig.resource;
            let header = request.resourceData[request.widget_type_id];
            results.push(header);

            let vertical_tag_id = paramsArray[12];
            let assetMap = new Map();
            let status_tags = request.verticalData["status_tags"];

            for( let counter = 0; counter < hierarchyAssetsData.length; counter ++){
                resourceHierarchyReporteesMappingMap.set(hierarchyAssetsData[counter].asset_id, hierarchyAssetsData[counter].manager_asset_id)
            }                

            for (let idx = 0; idx < assetsData.length; idx++) {
                resourceReporteesMappingMap.set(assetsData[idx].asset_id, assetsData[idx].manager_asset_id);

                let map = new Map();
                for (let i = 0; i < widgetFlags.length; i++) {
                    map.set("flag_" + (i + 1), 0);
                }
                assetMap.set(assetsData[idx].asset_id, map);

                if (!finalResourceMap.has(assetsData[idx].asset_id)) {
                    let newMap = new Map();
                    for (let i = 0; i < widgetFlags.length; i++) {
                        newMap.set("flag_" + (i + 1), 0);
                    }
                    newMap.set(assetsData[idx].asset_id, assetsData[idx].operating_asset_first_name);
                    finalResourceMap.set(assetsData[idx].asset_id, newMap);
                }
            }

            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let responseJson = {};
                if (isError) {
                    break;
                }
                if (widgetFlags[iteratorM] == 1) {
                    paramsArray[1] = 1;
                    paramsArray[15] = 2;
                    paramsArray[16] = 0;
                    paramsArray[18] = util.getFirstDayOfCurrentMonthToIST();
                    paramsArray[19] = util.getLastDayOfCurrentMonthToIST();
                }
                if (widgetFlags[iteratorM] >= 2 && widgetFlags[iteratorM] <= 5) {
                    paramsArray[1] = 2;
                    paramsArray[15] = 1;
                    paramsArray[18] = util.getFirstDayOfCurrentMonthToIST();
                    paramsArray[19] = util.getLastDayOfCurrentMonthToIST();
                    if (widgetFlags[iteratorM] == 2) {
                        let key = request.verticalData["status_tags_array"][4];
                        paramsArray[16] = status_tags[key];
                    }
                    if (widgetFlags[iteratorM] == 3) {
                        let key = request.verticalData["status_tags_array"][5];
                        paramsArray[16] = status_tags[key];
                    }
                    if (widgetFlags[iteratorM] == 4) {
                        let key = request.verticalData["status_tags_array"][6];
                        paramsArray[16] = status_tags[key];
                    }
                    if (widgetFlags[iteratorM] == 5) {
                        let key = request.verticalData["status_tags_array"][7];
                        paramsArray[16] = status_tags[key];
                    }
                }
                if (widgetFlags[iteratorM] == 6) {
                    paramsArray[1] = 3;
                    paramsArray[15] = 0;
                    paramsArray[16] = 0;
                    paramsArray[18] = util.getFirstDayOfNextMonthToIST();
                    paramsArray[19] = util.getLastDayOfNextMonthToIST();
                }
                if (widgetFlags[iteratorM] == 7) {
                    paramsArray[1] = 3;
                    paramsArray[15] = 0;
                    paramsArray[16] = 0;
                    paramsArray[18] = util.getFirstDayOfCurrentQuarterToIST();
                    paramsArray[19] = util.getLastDayOfCurrentQuarterToIST();
                }
                paramsArray.push(widgetFlags[iteratorM]);
                paramsArray[10] = request.filter_asset_id;

                responseJson.filter_date_type_id = paramsArray[1];
                responseJson.filter_activity_status_type_id = paramsArray[15];
                responseJson.datetime_start = paramsArray[18];
                responseJson.datetime_end = paramsArray[19];
                responseJson.filter_asset_id = paramsArray[10];
                responseJson.sequence_id = widgetFlags[iteratorM];
                resourceResponseAdditonalMap.set(iteratorM, responseJson);
                resourceValueFlgArray[iteratorM] = responseJson;

                let [errr, opptydata] = await this.widgetValuesOpptyVerticalAndAsset(request, paramsArray);
                if (!errr) {
                    opptyVerticalMap.set(iteratorM, opptydata);
                    console.log("iterator = " + iteratorM + " : opptydata size = " + opptydata.length);
                }
            }

            if (isError) {
                return Promise.resolve(request.verticalData.error_response);
            }

            let vertical_name = null;

            for (let entry of resourceMap.entries()) {
                vertical_tag_id = entry[0];
                vertical_name = entry[1];
                if (paramsArray[12] == vertical_tag_id) {
                    break;
                }
            }
            console.log("0 finalResourceMap ",JSON.stringify(finalResourceMap))
            console.log("-------------");
            for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                let opptydata = opptyVerticalMap.get(iteratorM) || [];
                for (let idx = 0; idx < opptydata.length; idx++) {
                    console.log("ii "+JSON.stringify(opptydata[idx]))
                    let asset_id = opptydata[idx].activity_creator_asset_id;
                    let isResource = false;
                    if (resourceHierarchyReporteesMappingMap.has(asset_id)) {
                        console.log("asset_id == manager_asset_id " + asset_id);
                        isResource = true;
                    }
                    console.log("1. isResource-------------"+isResource);
                    console.log("2. asset_id-------------"+asset_id);
                    console.log("3. resourceReporteesMappingMap.has(asset_id) "+resourceReporteesMappingMap.has(asset_id))
                    console.log("4. assetMap.has(asset_id)"+assetMap.has(asset_id));
                    if (resourceReporteesMappingMap.has(asset_id) || isResource) {
                        
                        let manager_asset_id = null;
                        if (!isResource) {
                            manager_asset_id = asset_id;
                            console.log("iteratorM= " + iteratorM + " : asset_id == manager_asset_id [" + asset_id + " == " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                            // let newMap = finalResourceMap.get(manager_asset_id) || new Map();
                            // let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                            // let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                            // let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                            // count = count + opptydata[idx].count;
                            // quantity = quantity + opptydata[idx].quantity;
                            // value = value + opptydata[idx].value;
                            // // newMap.set(asset_id, opptydata[idx].activity_creator_operating_asset_first_name);
                            // newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                            // newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                            // newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                            // finalResourceMap.set(manager_asset_id, newMap);
                        } else {
                            manager_asset_id = resourceHierarchyReporteesMappingMap.get(asset_id);
                            console.log("iteratorM= " + iteratorM + " : asset_id != manager_asset_id [" + asset_id + " != " + manager_asset_id + "]");
                            console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                            // let newMap = finalResourceMap.get(manager_asset_id) || new Map();
                            // let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                            // let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                            // let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                            // count = count + opptydata[idx].count;
                            // quantity = quantity + opptydata[idx].quantity;
                            // value = value + opptydata[idx].value;
                            // newMap.set(asset_id, opptydata[idx].activity_creator_operating_asset_first_name);
                            // newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                            // newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                            // newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                            // finalResourceMap.set(asset_id, newMap);
                        }
                        console.log("manager_asset_id "+manager_asset_id)
                        let newMap = finalResourceMap.get(manager_asset_id) || new Map();
                        let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                        let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                        let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                        count = count + opptydata[idx].count;
                        quantity = quantity + opptydata[idx].quantity;
                        value = value + opptydata[idx].value;
                        newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                        newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                        newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                        finalResourceMap.set(manager_asset_id, newMap);
                    } else if (assetMap.has(asset_id)) {
                        console.log("5.assetMap.has(asset_id)"+assetMap.has(asset_id));
                        let newMap = assetMap.get(asset_id);
                       // let newMap = finalResourceMap.get(manager_asset_id);
                        let count = newMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                        let quantity = newMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                        let value = newMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                        count = count + opptydata[idx].count;
                        quantity = quantity + opptydata[idx].quantity;
                        value = value + opptydata[idx].value;
                        newMap.set("flag_" + (iteratorM + 1) + "_count", count);
                        newMap.set("flag_" + (iteratorM + 1) + "_quantity", quantity);
                        newMap.set("flag_" + (iteratorM + 1) + "_value", value);
                        assetMap.set(asset_id, newMap);
                        console.log("asset_id != manager_asset_id [" + asset_id + " != " + resourceReporteesMappingMap.get(asset_id) + "]");
                        console.log("count = " + opptydata[idx].count + " :: quantity = " + opptydata[idx].quantity + " :: value = " + opptydata[idx].value);
                    } else {
                        console.log("6. finalResourceMap.get(asset_id)"+finalResourceMap.has(asset_id));
                        console.log("6.1 assetMap.has(asset_id) "+assetMap.has(asset_id))
                        console.log("6.2 String(request.filter_asset_id) === String(asset_id) "+String(request.filter_asset_id) === String(asset_id))
                        if ((String(request.filter_asset_id) === String(asset_id))) {
                            //let opttyMap = new Map();
                            let opttyMap = finalResourceMap.get(asset_id) ||  new Map();
                            let count = opttyMap.get("flag_" + (iteratorM + 1) + "_count") || 0;
                            let quantity = opttyMap.get("flag_" + (iteratorM + 1) + "_quantity") || 0;
                            let value = opttyMap.get("flag_" + (iteratorM + 1) + "_value") || 0;
                            count = count + opptydata[idx].count;
                            quantity = quantity + opptydata[idx].quantity;
                            value = value + opptydata[idx].value;                            
                            opttyMap.set("flag_" + (iteratorM + 1) + "_count", opptydata[idx].count);
                            opttyMap.set("flag_" + (iteratorM + 1) + "_quantity", opptydata[idx].quantity);
                            opttyMap.set("flag_" + (iteratorM + 1) + "_value", opptydata[idx].value);
                            opttyMap.set(asset_id, opptydata[idx].activity_creator_operating_asset_first_name);
                            console.log("No reportees available. So adding oppty asset directly to response [" + asset_id + "]");
                            finalResourceMap.set(asset_id, opttyMap);
                        }else{
                            console.log("7. ")
                        }
                    }
                }
            }
            console.log("-------------");
/*
            for (let idx = 0; idx < assetsData.length; idx++) {

                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    let responseJson = Object.assign({}, resourceResponseAdditonalMap.get(iteratorM));
                    responseJson.vertical_tag_id = vertical_tag_id;
                    responseJson.vertical_name = vertical_name;
                    delete responseJson["filter_asset_id"];
                    responseJson.target_asset_id = assetsData[idx].asset_id;
                    resourceValueFlgArray[iteratorM] = responseJson;
                }

                let assetRspData = {};
                assetRspData.resource_name = assetsData[idx].operating_asset_first_name;

                let cnt = 1;
                for (let i = 0; i < widgetFlags.length; i++) {
                    assetRspData["flag_" + cnt] = assetMap.get(assetsData[idx].asset_id).get("flag_" + (i + 1) + "_count") || 0;
                    assetRspData["flag_" + cnt + "_1"] = resourceValueFlgArray[i]; cnt++;
                    assetRspData["flag_" + cnt] = assetMap.get(assetsData[idx].asset_id).get("flag_" + (i + 1) + "_quantity") || 0;
                    assetRspData["flag_" + cnt + "_1"] = resourceValueFlgArray[i]; cnt++;
                    assetRspData["flag_" + cnt] = assetMap.get(assetsData[idx].asset_id).get("flag_" + (i + 1) + "_value") || 0;
                    assetRspData["flag_" + cnt + "_1"] = resourceValueFlgArray[i]; cnt++;
                }
                results.push(assetRspData);

            } */

            let resourceValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                resourceValueFlgArrayTotal[i] = {};
                resourceValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArray[i]);
            }
            /*
            if (results.length == 1 && finalResourceMap.size == 0) {
                let newMap = new Map();
                for (let i = 0; i < widgetFlags.length; i++) {
                    newMap.set("flag_" + (i + 1), 0);
                }
                request.asset_id = request.filter_asset_id;
                let [err, assetData] = await activityCommonService.getAssetDetailsAsync(request);
                newMap.set(request.filter_asset_id, assetData[0].operating_asset_first_name);
                finalResourceMap.set(request.filter_asset_id, newMap);
                for (let iteratorM = 0; iteratorM < widgetFlags.length; iteratorM++) {
                    let newMap = finalResourceMap.get(request.filter_asset_id) || new Map();
                    newMap.set("flag_" + (iteratorM + 1) + "_count", 0);
                    newMap.set("flag_" + (iteratorM + 1) + "_quantity", 0);
                    newMap.set("flag_" + (iteratorM + 1) + "_value", 0);
                    finalResourceMap.set(request.filter_asset_id, newMap);
                }
            }*/
            console.log("finalResourceMap ",JSON.stringify(finalResourceMap));

            for (let [key, value] of finalResourceMap) {
                console.log("key:"+key+" value:"+JSON.stringify(value))
                let newMap = value;
                let manager_asset_id = key;
                let assetRspData = {};
                assetRspData.resource_name = newMap.get(manager_asset_id);
                let cnt = 1;
                for (let i = 0; i < widgetFlags.length; i++) {
                    let responseData = Object.assign({}, resourceValueFlgArrayTotal[i]);
                    responseData.target_asset_id = manager_asset_id;
                    delete responseData["filter_asset_id"];
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_count") || 0;
                    countTotal[i] = countTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    assetRspData["flag_" + cnt] = newMap.get("flag_" + (i + 1) + "_quantity") || 0;
                    quantityTotal[i] = quantityTotal[i] + assetRspData["flag_" + cnt];
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                    let flagValue = parseFloat(newMap.get("flag_" + (i + 1) + "_value") || 0).toFixed(2);
                    assetRspData["flag_" + cnt] = flagValue;
                    valueTotal[i] = parseFloat(valueTotal[i]) + parseFloat(flagValue);
                    assetRspData["flag_" + cnt + "_1"] = responseData; cnt++;
                }
                results.push(assetRspData);
            }

            //For Total
            let verticalValueFlgArrayTotal = new Array();
            for (let i = 0; i < widgetFlags.length; i++) {
                verticalValueFlgArrayTotal[i] = {};
                verticalValueFlgArrayTotal[i] = Object.assign({}, resourceValueFlgArrayTotal[i]);
                verticalValueFlgArrayTotal[i].vertical_tag_id = 0;
                delete verticalValueFlgArrayTotal[i]['vertical_name'];
            }
            let resultData = {};
            resultData.resource_name = "Total";
            let cnt = 1;
            for (let j = 0; j < widgetFlags.length; j++) {
                resultData["flag_" + cnt] = countTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = quantityTotal[j] || 0;
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
                resultData["flag_" + cnt] = parseFloat(valueTotal[j] || 0).toFixed(2);
                resultData["flag_" + cnt + "_1"] = verticalValueFlgArrayTotal[j]; cnt++;
            }
            results.push(resultData);

            return Promise.resolve(results);

        } catch (error) {
            console.log("error :; ", error);
            return Promise.resolve(request.verticalData.error_response);
        }
    }

    this.widgetValuesOpptyVerticalAndAsset = async (request, paramsArr) => {

        let responseData = [],
            error = true;

        const queryString = util.getQueryString('ds_v1_9_activity_search_list_select_widget_values_oppty_ver_res', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    paramsArr.pop();
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }

        return [error, responseData];
    }

    this.getResourcesListForSelectedVerticalAndAsset = async (request, paramsArr) => {

        let responseData = [],
            error = true;

        const queryString = util.getQueryString('ds_v1_asset_list_select_manager_vertical_resources', paramsArr);
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

    this.getResourcesHierarchyOfDirectReportees = async (request, paramsArr) => {

        let responseData = [],
            error = true;

        const queryString = util.getQueryString('ds_v1_asset_manager_mapping_select_reportees_hierarchy', paramsArr);
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
    //------------------------------------------------------------------------
    //Get SIP Widgets Dynamic Data
    this.getSipWidgets = async function (request) {
        let responseData = [], responseDataPersonal = []
            error = true,
            reporteeError = true, reporteeData = [],
            reporteeKpiDataError = true, reporteeKpiData = [];
            let paramsArr = [];
        

        // get the direct reportees
        // loop this procedure for all the 
        request.flag = 6;
        [reporteeError, reporteeData] = await self.getDirectReporteesByManagerSip(request);
        paramsArr = [
            request.organization_id,
            request.activity_type_category_id,
            0,
            request.page_start,
            request.page_limit,
            0,
            request.datetime_start,
            request.datetime_end
        ];
        for(let counter = 0; counter < reporteeData.length; counter ++){

            paramsArr[2]=reporteeData[counter].asset_id;
            let queryString = util.getQueryString('ds_v1_1_activity_list_select_sip_widgets', paramsArr);
            if (queryString !== '') {
                await db.executeQueryPromise(1, queryString, request)
                    .then(async (data) => {
                        //responseData = data;
                        error = false;
                        let formattedData = await self.formatData(data, reporteeData[counter].asset_id);
                        //console.log("formattedData ",formattedData);
                        responseData = responseData.concat(formattedData);
                    })
                    .catch((err) => {
                        error = err;
                    })
            }
        }

        console.log(responseData)
        //paramsArr.pop();
        //paramsArr.push(1);
        paramsArr[5]=1;
        paramsArr[2]=request.manager_asset_id;
        //console.log(paramsArr)
        //console.log("responseData ",responseData)
        queryString = util.getQueryString('ds_v1_activity_list_select_sip_widgets', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseDataPersonal = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }  
        
        let kpi_data = {};
        let reportee_kpi_data_array= [];
        let manager_kpi_data_array= [];

        reporteeData.push({"asset_id":request.manager_asset_id});

        for(let i = 0; i < reporteeData.length; i ++){
            request.is_manager = 0;
            request.target_asset_id = reporteeData[i].asset_id;
            kpi_data[request.target_asset_id] = {};

            if(request.target_asset_id == request.manager_asset_id)
            request.is_manager = 1;

            [reporteeKpiDataError, reporteeKpiData] = await self.getHierarchyReporteesByManager(request);

            for(let j = 0; j < reporteeKpiData.length; j++){

                let idAsset = request.target_asset_id;
                let idActivityType = reporteeKpiData[j].kpi_activity_type_id;

               // let target_base =kpi_data[idAsset];
               const [err2, activityData] = await self.getAssetKPIByActivityType(request, idAsset, idActivityType);
               // const activityData = await activityCommonService.getActivityDetailsPromise(request, reporteeKpiData[j].param1_activity_id);
                console.log("activityData ",activityData);
                if(activityData.length > 0 ){
                    console.log(JSON.parse(activityData[0].activity_inline_data).measurement_type_unit)
                }
                const [predictionError, predictionData] = await self.getPredictionDataOfAUser(request);
                let obj = {"target": reporteeKpiData[j].monthly_target,
                            "achieved":reporteeKpiData[j].monthly_ach,
                            "percentage":(reporteeKpiData[j].monthly_ach/reporteeKpiData[j].monthly_target)*100,
                            "asset_id":idAsset,
                            "activity_type_id":idActivityType,
                            "measurement_type_unit":activityData.length>0?JSON.parse(activityData[0].activity_inline_data).measurement_type_unit:'',
                            "measurement_type_id":activityData.length>0?JSON.parse(activityData[0].activity_inline_data).measurement_type_id:0,
                            "measurement_type_name":activityData.length>0?JSON.parse(activityData[0].activity_inline_data).measurement_type_name:'',
                            "predicted_achievement":predictionData[0]?predictionData[0].predicted_achievement:0,
                            "predicted_payout_percent":predictionData[0]?predictionData[0].predicted_percentage:0,
                            "activity_id":activityData.length>0?activityData[0].activity_id:0
                        }

               if(request.is_manager == 0)                  
               reportee_kpi_data_array.push(obj);
               else
               manager_kpi_data_array.push(obj);

               kpi_data[idAsset][idActivityType] = obj;
            }
        }

        let resp = {"manager_kpi":responseDataPersonal, "reportee_kpi":responseData, "reportee_data":reportee_kpi_data_array, "manager_data":manager_kpi_data_array};
        return [false, resp];
    }
    this.getDirectReporteesByManagerSip = async function(request){
        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.manager_asset_id,
            request.workforce_tag_id,
            request.timeline_flag,
            request.flag || 1,
            request.datetime_start || null,
            request.datetime_end || null,
            request.page_start || 0,
            request.page_limit || 500,
            request.is_manager || 0
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_direct_reportees_sip', paramsArr);

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
    this.getHierarchyReporteesByManager = async function(request){
        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
            request.month,
            request.year,
            request.page_start || 0,
            request.page_limit || 500,
            request.is_manager || 0
        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_select_manager', paramsArr);

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

    this.formatData = async function(data, idTargetAsset){
        let finalArray = [];
        for(let i = 0; i < data.length; i++){
            data[i].asset_id = idTargetAsset;
            finalArray.push(data[i]);
        }
        //console.log(finalArray);
        return data;
        //return Promise.resolve(finalArray);
    }
    this.getPredictionDataOfAUser = async function(request){
        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.manager_asset_id,
            request.datetime_start,
            request.datetime_end
        );
        const queryString = util.getQueryString('ds_v1_vil_sip_prediction_transaction_select_asset', paramsArr);

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
    //Get SIP Widgets Payout Data
    this.getSipPayoutWidgets = async function (request) {
        let responseData = [], responseDataPersonal = []
            error = true,
            reporteeError = true, reporteeData = [],
            reporteeKpiDataError = true, reporteeKpiData = [];
            let paramsArr = [];

        // get the direct reportees
        // loop this procedure for all the 
        request.flag = 7;
        [reporteeError, reporteeData] = await self.getDirectReporteesByManagerSip(request);
        paramsArr = [
            request.organization_id,
            request.activity_type_category_id,
            0,
            request.page_start,
            request.page_limit,
            0,
            request.datetime_start,
            request.datetime_end
        ];
        for(let counter = 0; counter < reporteeData.length; counter ++){

            paramsArr[2]=reporteeData[counter].asset_id;
            let queryString = util.getQueryString('ds_v1_1_activity_list_select_sip_widgets_payout', paramsArr);
            if (queryString !== '') {
                await db.executeQueryPromise(1, queryString, request)
                    .then(async (data) => {
                        //responseData = data;
                        error = false;
                        let formattedData = await self.formatData(data, reporteeData[counter].asset_id);
                        //console.log("formattedData ",formattedData);
                        responseData = responseData.concat(formattedData);
                    })
                    .catch((err) => {
                        error = err;
                    })
            }
        }

        console.log(responseData)
        //paramsArr.pop();
        //paramsArr.push(1);
        paramsArr[5]=1;
        paramsArr[2]=request.manager_asset_id;
        //console.log(paramsArr)
        //console.log("responseData ",responseData)
        queryString = util.getQueryString('ds_v1_activity_list_select_sip_widgets_payout', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseDataPersonal = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }  
        
        let kpi_data = {};
        let reportee_kpi_data_array= [];
        let manager_kpi_data_array= [];

        for(let i = 0; i < reporteeData.length; i ++){
            request.target_asset_id = reporteeData[i].asset_id;
            kpi_data[request.target_asset_id] = {};
            [reporteeKpiDataError, reporteeKpiData] = await self.getHierarchyReporteesByManagerSip(request);
            for(let j = 0; j < reporteeKpiData.length; j++){
                let idAsset = request.target_asset_id;
                let idActivityType = reporteeKpiData[j].kpi_activity_type_id;
               // let target_base =kpi_data[idAsset];
               //const activityData = await activityCommonService.getActivityDetailsPromise(request, reporteeKpiData[j].param1_activity_id);

                const activityData = await self.getAssetKPIByActivityType(request, idAsset, idActivityType);                       
                //const sipReporteeCount = await self.getSipReporteeCount(request, idAsset);
                //const sipQualifiedReporteeCount = await self.getSipQualifiedCount(request, idAsset);
                //const utilizationPercent = await self.getSipUtilizationPercent(request, idAsset);
                //const weightedSip = await self.getSipWeightedTargetVsAchievementPercent(request, idAsset);
                //console.log("sipReporteeCount ",sipReporteeCount);
                //console.log("sipQualifiedReporteeCount ",sipQualifiedReporteeCount);
                //console.log("utilizationPercent ",utilizationPercent);
                //console.log("weightedSip ",weightedSip);
                let obj = {"target": reporteeKpiData[j].monthly_target,
                            "achieved":reporteeKpiData[j].monthly_ach,
                            "percentage": (reporteeKpiData[j].monthly_ach/reporteeKpiData[j].monthly_target)*100,
                            "asset_id": idAsset,
                            "activity_type_id": idActivityType,
                            "measurement_type_unit": activityData[0]?activityData[0].activity_inline_data.measurement_type_unit:'',
                            "measurement_type_id": activityData[0]?activityData[0].activity_inline_data.measurement_type_id:0,
                            "measurement_type_name": activityData[0]?activityData[0].activity_inline_data.measurement_type_name:''
                        }                           

               reportee_kpi_data_array.push(obj);
               kpi_data[idAsset][idActivityType] = obj;
            }
        }       
        
        let resp = {"manager_kpi":responseDataPersonal, "reportee_kpi":responseData, "reportee_data":reportee_kpi_data_array, "manager_data":manager_kpi_data_array};
        return [false, resp];
    }
    this.getSipEmployeeData = async function(request){
        //get the list of direct reportees
        //for each reportee get their respective reportee count, reportee with sop count
        let reporteeError = true, reporteeData = [],
        reporteeError1 = true, reporteeData1 = [];
        let sipMap = new Map();
        request.flag = 7;
        [reporteeError, reporteeData] = await self.getDirectReporteesByManagerSip(request);
        
        /*if(reporteeData.length > 0){           
            request.flag = 5;
            reporteeData.manager_asset_id = reporteeData
            [reporteeError1, reporteeData1] = await self.getDirectReporteesByManagerSip(request);
            for(let i = 0; i < reporteeData1.length; i ++){
                sipMap.set((reporteeData1[i].manager_asset_id+"_"+reporteeData1[i].asset_flag_sip_enabled), reporteeData1[i].count);
            }
        }*/

        for(let i = 0; i < reporteeData.length; i ++){
            const sipReporteeCount = await self.getSipReporteeCount(request, reporteeData[i].asset_id);
            const sipQualifiedReporteeCount = await self.getSipQualifiedCount(request, reporteeData[i].asset_id);
            const utilizationPercent = await self.getSipUtilizationPercent(request, reporteeData[i].asset_id);
            const weightedSip = await self.getSipWeightedTargetVsAchievementPercent(request, reporteeData[i].asset_id);
            //reporteeData[i].reportee_count = reporteeCount;
            reporteeData[i].sip_reportee_count = sipReporteeCount;
            reporteeData[i].sip_qualified_reportee_count = sipQualifiedReporteeCount;
            reporteeData[i].penetration_percent = ((sipQualifiedReporteeCount/sipReporteeCount)*100).toFixed(2);
            reporteeData[i].utilization_percent = utilizationPercent;
            reporteeData[i].weighted_sip_target_ach_percent = weightedSip;
        }

        return reporteeData;
    }
    this.customerAccountMapping = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
            request.channel_flag,
            request.start_datetime,
            request.end_datetime,
            request.page_start,
            request.page_limit,

        );
        const queryString = util.getQueryString('ds_v1_asset_customer_account_mapping_select', paramsArr);

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
    this.getHierarchyReporteesByManagerSip = async function(request){
        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
            request.month,
            request.year,
            request.datetime_start,
            request.datetime_end,
            request.workforce_tag_id,
            request.timeline_flag,
            request.page_start || 0,
            request.page_limit || 500
        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_select_manager_sip', paramsArr);

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
    this.getSipQualifiedCount = async function (request, managerAssetId){
        let sipQualifiedCount = 0;

        const paramsArr = new Array(
            request.organization_id,
            managerAssetId,
            request.datetime_start,
            request.datetime_end,
            request.timeline_flag,
            request.year,
            request.workforce_tag_id,
            request.flag || 0
        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_analytics_select_sip_qualified', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    return sipQualifiedCount;
                })
        }
        if(responseData.length > 0)        
        sipQualifiedCount = responseData[0].sip_qualified_reportee_count;

        return sipQualifiedCount;
    }    
    this.getSipReporteeCount = async function (request, managerAssetId){
        let sipReporteeCount = 0;

        const paramsArr = new Array(
            request.organization_id,
            managerAssetId,
            request.datetime_start,
            request.datetime_end,
            request.timeline_flag,
            request.year,
            request.workforce_tag_id,
            request.flag || 0
        );
        const queryString = util.getQueryString('ds_v1_asset_customer_account_mapping_select_sip_emp', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    return sipReporteeCount;
                })
        }        
        if(responseData.length > 0)
        sipReporteeCount = responseData[0].sip_reportee_count;
        //console.log("sipReporteeCount "+sipReporteeCount)
        return sipReporteeCount;
    }
    this.getSipUtilizationPercent = async function (request, managerAssetId){

        let error= true, responseData = [];
        let sipUtilizationPercent = 0;

        const paramsArr = new Array(
            request.organization_id,
            managerAssetId,
            request.datetime_start,
            request.datetime_end,
            request.timeline_flag,
            request.year,
            request.workforce_tag_id,
            request.flag || 0
        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_analytics_utilization', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    return sipUtilizationPercent;
                })
        }        
        sipUtilizationPercent = responseData[0]?responseData[0].utilization_percent:0;
        return sipUtilizationPercent;
    }
    this.getSipWeightedTargetVsAchievementPercent = async function (request, managerAssetId){
        let sipTargetVsAchievementPercent = 0;

        const paramsArr = new Array(
            request.organization_id,
            managerAssetId,
            request.datetime_start,
            request.datetime_end,
            request.timeline_flag,
            request.year,
            request.workforce_tag_id
        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_analytics_select_trgt_ach_weight', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    return sipTargetVsAchievementPercent;
                })
        }        
        if(responseData.length > 0)
        sipTargetVsAchievementPercent = responseData[0].sip_target_achievement_weight;

        return sipTargetVsAchievementPercent;
    }  
    this.getAssetKPIByActivityType = async function(request, idAsset, idActivityType){

        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.organization_id,
            65,
            idActivityType,
            idAsset
        );
        const queryString = util.getQueryString('ds_p1_activity_list_select_category_asset_kpi', paramsArr);

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
    this.getEmployeeLeaderboard = async function(request){

        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.manager_asset_id,
            request.datetime_start,
            request.datetime_end,
            request.workforce_tag_id, 
            request.vertical_tag_id,
            request.cluster_tag_id,
            request.role_id_from_array,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_analytics_select_leaderboard', paramsArr);

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
        console.log("responseData ",responseData);
        return [error, responseData];
    }

    this.getLeaderBoard = async function (request){

        let roles = [];
        let responsedata = [], error = true, finalResponse = [];
        let rolesArray = [145326, 145327,145328,145329];
        try{
            if(request.asset_type_id > 0)
                roles.push(request.asset_type_id);
            else if (request.asset_type_id == 0)
                roles = rolesArray;

                console.log(roles) 
            for(let i = 0; i < roles.length; i ++){
                request.role_id_from_array = roles[i];
                [error, responsedata] = await self.getEmployeeLeaderboard(request);
                finalResponse = finalResponse.concat(responsedata);
            }
        }catch(e){
            console.log(e)
        }
        //console.log(finalResponse)
        return [error, finalResponse];
    }
   

    this.getSipEnabledRoles = async function(request){
        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_v1_workforce_asset_type_mapping_select_sip', paramsArr);

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

    this.getSipPeriodicOverallAchievedPercent = async function(request){
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.manager_asset_id,
            request.datetime_start,
            request.datetime_end,
            request.timeline_flag,
            request.year,
            request.workforce_tag_id,
            request.flag

        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_select_overall_ach_percent', paramsArr);

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
    this.getSipPeriodicAchievedPercent = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.manager_asset_id,
            request.datetime_start,
            request.datetime_end,
            request.timeline_flag,
            request.year,
            request.workforce_tag_id,
            request.flag

        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_select_achievement_percent', paramsArr);

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

    this.getSipPeriodicPayoutPercent = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.manager_asset_id,
            request.datetime_start,
            request.datetime_end,
            request.timeline_flag,
            request.year,
            request.workforce_tag_id,
            request.flag

        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_select_payout_percent', paramsArr);

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

    this.getSipPeriodicQualifiers = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.manager_asset_id,
            request.datetime_start,
            request.datetime_end,
            request.timeline_flag,
            request.year,
            request.workforce_tag_id,
            request.flag
        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_select_payout_qualifieres', paramsArr);

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

    this.getSipPeriodicSummaryRoleData = async function(request){
        // get list of roles 
        // get all the parameters 
    }  
    
    this.getSipPeriodicQualifiedCount = async function (request, managerAssetId){
        let sipQualifiedCount = 0;

        let error = true, responseData = [];

        const paramsArr = new Array(
            request.organization_id,
            managerAssetId,
            request.datetime_start,
            request.datetime_end,
            request.timeline_flag,
            request.year,
            request.workforce_tag_id,
            request.flag || 0
        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_analytics_select_sip_qualified', paramsArr);

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

        return [error,responseData];
    }    
    this.getSipPeriodicReporteeCount = async function (request, managerAssetId){
        let sipReporteeCount = 0;
        let error = true, responseData = [];
        const paramsArr = new Array(
            request.organization_id,
            managerAssetId,
            request.datetime_start,
            request.datetime_end,
            request.timeline_flag,
            request.year,
            request.workforce_tag_id,
            request.flag || 0
        );
        const queryString = util.getQueryString('ds_v1_asset_customer_account_mapping_select_sip_emp', paramsArr);

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
        return [error,responseData];
    }
    this.getSipPeriodicUtilizationPercent = async function (request, managerAssetId){

        let error= true, responseData = [];
        let sipUtilizationPercent = 0;

        const paramsArr = new Array(
            request.organization_id,
            managerAssetId,
            request.datetime_start,
            request.datetime_end,
            request.timeline_flag,
            request.year,
            request.workforce_tag_id,
            request.flag || 0
        );
        const queryString = util.getQueryString('ds_v1_sip_payout_report_analytics_utilization', paramsArr);

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
        return [error,responseData];
    }    
    
    this.getSipPeriodicSummary = async function(request){
        let finalresponse = {"role_summary":{},"vertical_summary":{}, "circle_summary":{}};
        let roleError = true, roleResponse = [],
        verticalError = true, verticalResponse = [],
        circleError = true, circleResponse = [];
        let managerAssetId = request.manager_asset_id;
        let error1 = true, responseData1 = [];
        let error2 = true, responseData2 = [];
        let error3 = true, responseData3 = [];
        let error4 = true, responseData4 = [];
        let error5 = true, responseData5 = [];
        let error6 = true, responseData6 = [];
        let error7 = true, responseData7 = [];

        let vcerror1 = true, vcresponseData1 = [];
        let vcerror2 = true, vcresponseData2 = [];
        let vcerror3 = true, vcresponseData3 = [];
        let vcerror4 = true, vcresponseData4 = [];
        let vcerror5 = true, vcresponseData5 = [];
        let vcerror6 = true, vcresponseData6 = [];
        let vcerror7 = true, vcresponseData7 = [];        

        //roles 
        [roleError, roleResponse] = await self.getSipEnabledRoles(request);
       // for(let roleCounter = 0; roleCounter < roleResponse.length; roleCounter++){
       //     finalresponse.role_summary[roleResponse[roleCounter].asset_type_id] = {"sip_employees":0, "sip_qualified_employees":0, "sip_utilization_percent":0, "sip_overall_target_achieved_percent":0,"sip_target_achieved_percent":{},"sip_payout_percent":{}, "sip_qualifiers":{}};
       // }
        
        /*
        {
        "sip_employees": 0,
        "sip_qualified_employees": 0,
        "sip_utilization_percent": 0,
        "sip_overall_target_achieved_percent": 0,
        "sip_target_achieved_percent": {},
        "sip_payout_percent": {},
        "sip_qualifiers": {}
        }
        */        
        request.flag = 1; // ROLE WISE 
        [error1,responseData1] = await self.getSipPeriodicReporteeCount(request, managerAssetId);
        [error2,responseData2] = await self.getSipPeriodicQualifiedCount(request, managerAssetId);
        [error3,responseData3] = await self.getSipPeriodicUtilizationPercent(request, managerAssetId);        
        [error4,responseData4] = await self.getSipPeriodicOverallAchievedPercent(request);
        [error5,responseData5] = await self.getSipPeriodicAchievedPercent(request);
        [error6,responseData6] = await self.getSipPeriodicPayoutPercent(request);
        [error7,responseData7] = await self.getSipPeriodicQualifiers(request);

        finalresponse.role_summary.roles = roleResponse;
        finalresponse.role_summary.sip_employees = responseData1;
        finalresponse.role_summary.sip_qualified_employees = responseData2;
        finalresponse.role_summary.sip_utilization_percent = responseData3;
        finalresponse.role_summary.sip_overall_achieved_percent = responseData4;
        finalresponse.role_summary.sip_target_achieved_percent = responseData5;
        finalresponse.role_summary.sip_payout_percent = responseData6;
        finalresponse.role_summary.sip_qualifiers = responseData7;

        if(request.workforce_tag_id == 341){
            // get verticals
            request.type_flag = 28;
            request.filter_is_search = 0;
            request.filter_search_string = '';
            [verticalError, verticalResponse] = await self.getTagListSelectDashobardFilters(request);
            //finalresponse.vertical_summary = verticalResponse;
            //for(let verticalCounter = 0; verticalCounter < verticalResponse.length; verticalCounter++){
            //    finalresponse.vertical_summary[verticalResponse[verticalCounter].tag_id] = {"sip_employees":0, "sip_qualified_employees":0, "sip_utilization_percent":0, "sip_overall_target_achieved_percent":0,"sip_target_achieved_percent":{},"sip_payout_percent":{}, "sip_qualifiers":{}};
            //}   

            request.flag = 2; // ROLE WISE 
            [vcerror1,vcresponseData1] = await self.getSipPeriodicReporteeCount(request, managerAssetId);
            [vcerror2,vcresponseData2] = await self.getSipPeriodicQualifiedCount(request, managerAssetId);
            [vcerror3,vcresponseData3] = await self.getSipPeriodicUtilizationPercent(request, managerAssetId);        
            [vcerror4,vcresponseData4] = await self.getSipPeriodicOverallAchievedPercent(request);
            [vcerror5,vcresponseData5] = await self.getSipPeriodicAchievedPercent(request);
            [vcerror6,vcresponseData6] = await self.getSipPeriodicPayoutPercent(request);
            [vcerror7,vcresponseData7] = await self.getSipPeriodicQualifiers(request);
    
            finalresponse.vertical_summary.verticals = verticalResponse;
            finalresponse.vertical_summary.sip_employees = vcresponseData1;
            finalresponse.vertical_summary.sip_qualified_employees = vcresponseData2;
            finalresponse.vertical_summary.sip_utilization_percent = vcresponseData3;
            finalresponse.vertical_summary.sip_overall_achieved_percent = responseData4;
            finalresponse.vertical_summary.sip_target_achieved_percent = vcresponseData5;
            finalresponse.vertical_summary.sip_payout_percent = vcresponseData6;
            finalresponse.vertical_summary.sip_qualifiers = vcresponseData7;          
 
        }else{


            request.filter_id = 0;
             circleResponse = await self.getFilterValues(request);
            //finalresponse.circle_summary = circleResponse;
           // for(let circleCounter = 0; circleCounter < circleResponse.length; circleCounter++){
           //     finalresponse.circle_summary[circleResponse[circleCounter].account_id] = {"sip_employees":0, "sip_qualified_employees":0, "sip_utilization_percent":0, "sip_overall_target_achieved_percent":0,"sip_target_achieved_percent":{},"sip_payout_percent":{}, "sip_qualifiers":{}};
            //}  
            request.flag = 3;

            [vcerror1,vcresponseData1] = await self.getSipPeriodicReporteeCount(request, managerAssetId);
            [vcerror2,vcresponseData2] = await self.getSipPeriodicQualifiedCount(request, managerAssetId);
            [vcerror3,vcresponseData3] = await self.getSipPeriodicUtilizationPercent(request, managerAssetId);        
            [vcerror4,vcresponseData4] = await self.getSipPeriodicOverallAchievedPercent(request);
            [vcerror5,vcresponseData5] = await self.getSipPeriodicAchievedPercent(request);
            [vcerror6,vcresponseData6] = await self.getSipPeriodicPayoutPercent(request);
            [vcerror7,vcresponseData7] = await self.getSipPeriodicQualifiers(request);
    
            finalresponse.circle_summary.circles = circleResponse;
            finalresponse.circle_summary.sip_employees = vcresponseData1;
            finalresponse.circle_summary.sip_qualified_employees = vcresponseData2;
            finalresponse.circle_summary.sip_utilization_percent = vcresponseData3;
            finalresponse.circle_summary.sip_overall_achieved_percent = responseData4;
            finalresponse.circle_summary.sip_target_achieved_percent = vcresponseData5;
            finalresponse.circle_summary.sip_payout_percent = vcresponseData6;
            finalresponse.circle_summary.sip_qualifiers = vcresponseData7;    
        }

        return [false, finalresponse];
    }
    
    this.reportTransactionUpdateDownloadCount = async function (request){

        let error= true, responseData = [];

        const paramsArr = new Array(
            request.organization_id,
            request.report_transaction_id,
            request.report_id,
            request.asset_id,
            request.log_datetime || util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_report_transaction_update_download_count', paramsArr);

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
        return [error,responseData];
    } 
    this.assetSummaryTransactionManagerSelectV1 = async (request) => {
        let responseData = [],
            error = false;

        let self = await assetSummaryTransactionSelectManager(request,1);
        let reportees = await assetSummaryTransactionSelectManager(request,2);
        responseData = {
            self:self[0],
            reportees : reportees
        }
        return [error, responseData];
    };
    async function assetSummaryTransactionSelectManager (request,flag){
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.asset_id,
          flag,
          request.summary_id
        );
        const queryString = util.getQueryString('ds_v1_asset_summary_transaction_select_manager', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    console.log(data)
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return responseData;
    }
    
}

module.exports = AnalyticsService;