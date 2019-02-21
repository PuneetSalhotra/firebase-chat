/*
    author: bharat krishna masimukku
*/

function CommnTemplateService(objectCollection) 
{
    const moment = require('moment');
    const makeRequest = require('request');
    const TinyURL = require('tinyurl');
    
    const cacheWrapper = objectCollection.cacheWrapper;
    //const queueWrapper = objectCollection.queueWrapper;
    //const activityPushService = objectCollection.activityPushService;
    
    const util = objectCollection.util;
    const db = objectCollection.db;    
    const commnTemplateConfig = require('../utils/commnTemplateConfig.js');

    //const activityCommonService = objectCollection.activityCommonService;    
    //const activityUpdateService = new ActivityUpdateService(objectCollection);
    //const activityParticipantService = new ActivityParticipantService(objectCollection);
    //const activityService = new ActivityService(objectCollection);
    //const activityListingService = new ActivityListingService(objectCollection);
    //const activityTimelineService = new ActivityTimelineService(objectCollection);

    //Get the list of communication channels
    //Bharat Masimukku
    //2019-01-21
    this.getCommnChannels = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;

            paramsArray = 
            new Array
            (
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );

            results[0] = db.callDBProcedure(request, 'ds_p1_communication_type_master_select', paramsArray, 1);
            
            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Add Communication Template
    //Bharat Masimukku
    //2019-01-21
    this.addCommnTemplate = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;

            paramsArray = 
            new Array
            (
                request.commn_template_name,
                request.commn_template_description,
                request.commn_template_inline_data,
                request.commn_type_id,
                request.activity_type_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.log_asset_id,
                request.log_datetime,
            );

            results[0] = await db.callDBProcedure(request, 'ds_p1_communication_list_insert', paramsArray, 0);
            
            paramsArray = 
            new Array
            (
                results[0][0].communication_id,
                request.organization_id,
                global.commnTemplateConfig.commnTemplateAdded,
                request.log_asset_id,
                request.log_datetime,
            );

            results[1] = await db.callDBProcedure(request, 'ds_p1_communication_list_history_insert', paramsArray, 0);

            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Alter Communication Template
    //Bharat Masimukku
    //2019-01-21
    this.alterCommnTemplate = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;

            paramsArray = 
            new Array
            (
                request.communication_id,
                request.commn_template_inline_data,
                request.commn_template_name,
                request.activity_type_id,
                request.organization_id,
                request.log_asset_id,
                request.log_datetime,
            );

            results[0] = await db.callDBProcedure(request, 'ds_p1_communication_list_update', paramsArray, 0);
            
            paramsArray = 
            new Array
            (
                request.communication_id,
                request.organization_id,
                global.commnTemplateConfig.commnTemplateAltered,
                request.log_asset_id,
                request.log_datetime,
            );

            results[1] = await db.callDBProcedure(request, 'ds_p1_communication_list_history_insert', paramsArray, 0);

            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Archive Communication Template
    //Bharat Masimukku
    //2019-01-21
    this.archiveCommnTemplate = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;

            paramsArray = 
            new Array
            (
                request.communication_id,
                request.organization_id,
                request.log_state,
                request.log_asset_id,
                request.log_datetime,
            );

            results[0] = await db.callDBProcedure(request, 'ds_p1_communication_list_update_log_state', paramsArray, 0);
            
            paramsArray = 
            new Array
            (
                request.communication_id,
                request.organization_id,
                global.commnTemplateConfig.commnTemplateArchived,
                request.log_asset_id,
                request.log_datetime,
            );

            results[1] = await db.callDBProcedure(request, 'ds_p1_communication_list_history_insert', paramsArray, 0);

            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };
}

module.exports = CommnTemplateService;