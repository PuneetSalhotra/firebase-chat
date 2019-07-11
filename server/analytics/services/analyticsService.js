/*
    author: bharat krishna masimukku
*/

function AnalyticsService(objectCollection) 
{
    const moment = require('moment');
    const makeRequest = require('request');
    const TinyURL = require('tinyurl');
    
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
                request.organization_id
            );

            results[0] = await db.callDBProcedure(request, 'ds_p1_organization_list_select', paramsArray, 1);
            
            /*
            console.log("======================================");
            console.log("getFilterLabels");
            console.log(JSON.parse(results[0][0].organization_inline_data).filter_labels);
            console.log("======================================");
            */
            
            return JSON.parse(results[0][0].organization_inline_data).filter_labels;
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

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

            console.log("Filter Sequnce ID");
            console.log(request.filter_sequence_id);

            switch (parseInt(request.filter_sequence_id))
            {
                //Tag Type (Workflow Category)
                case 1:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    dbCall = "ds_p1_tag_type_master_select";
                    break;
                
                //Tag (Workflow Type)
                case 2:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.tag_type_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    dbCall = "ds_p1_tag_list_select";
                    break;

                //Activity Type (Workflow)
                case 3:
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
                    break;

                //Widget Type
                case 4:
                    paramsArray = 
                    new Array
                    (
                        3, //Widget Type Category ID
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    dbCall = "ds_p1_widget_type_master_select";
                    break;

                //Account
                case 5:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    dbCall = "ds_p1_account_list_select_organization";
                    break;

                //Workforce Type
                case 6:
                    paramsArray = 
                    new Array
                    (
                        request.organization_id,
                        request.target_account_id,
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    dbCall = "ds_p1_1_workforce_list_select_workforce_type";
                    break;

                //Workforce
                case 7:
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
                    break;

                //Asset
                case 8:
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
                    break;

                //Status Type
                case 9:
                    paramsArray = 
                    new Array
                    (
                        48, //Activity Type Category ID - Workflow
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    dbCall = "ds_p1_activity_status_type_master_select_category";
                    break;

                //Status Tag
                case 10:
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
                        1, //Status Tags
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    dbCall = "ds_p1_workforce_activity_status_mapping_select_widget_filters";
                    break;

                //Status
                case 11:
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
                    break;

                //Date Type
                case 12:
                    paramsArray = 
                    new Array
                    (
                        request.page_start,
                        util.replaceQueryLimit(request.page_limit)
                    );
                    dbCall = "ds_p1_widget_date_type_master_select";
                    break;

                //Timeline
                case 13:
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
                    break;
            }

            results[0] = await db.callDBProcedure(request, dbCall, paramsArray, 1);
            
            console.log("======================================");
            console.log("getFilterValues");
            console.log(results[0]);
            console.log("======================================");
            
            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };
}

module.exports = AnalyticsService;