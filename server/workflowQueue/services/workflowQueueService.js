/*
    author: bharat krishna masimukku
*/

function WorkflowQueueService(objectCollection) 
{
    const moment = require('moment');
    const makeRequest = require('request');
    const TinyURL = require('tinyurl');
    
    const cacheWrapper = objectCollection.cacheWrapper;
    //const queueWrapper = objectCollection.queueWrapper;
    //const activityPushService = objectCollection.activityPushService;
    
    const util = objectCollection.util;
    const db = objectCollection.db;    
    const workflowQueueConfig = require('../utils/workflowQueueConfig.js');

    //const activityCommonService = objectCollection.activityCommonService;    
    //const activityUpdateService = new ActivityUpdateService(objectCollection);
    //const activityParticipantService = new ActivityParticipantService(objectCollection);
    //const activityService = new ActivityService(objectCollection);
    //const activityListingService = new ActivityListingService(objectCollection);
    //const activityTimelineService = new ActivityTimelineService(objectCollection);

    //Generic function for firing stored procedures
    //Bharat Masimukku
    //2019-01-20
    this.callDBProcedure = 
    async (request, procName, paramsArray, flagReadOperation) =>
    {
        try
        {
            let queryString = util.getQueryString(procName, paramsArray);

            if (queryString != '') 
            {                
                let result = await (db.executeQueryPromise(flagReadOperation, queryString, request));
                console.log(`DB SP Result:\n${JSON.stringify(result, null, 4)}`);
                console.log(`Query Status:\n${JSON.stringify(result[0].query_status, null, 4)}`);

                if (result[0].query_status === 0)
                {
                    return result;
                }
                else
                {
                    return Promise.reject(result);
                }            
            }
            else
            {
                return Promise.reject(`Invalid Query String`);
            }
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Add Workflow Queue definition
    //Bharat Masimukku
    //2019-01-21
    this.addWorkflowQueue = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;
            
            paramsArray = 
            new Array
            (
                request.queue_name,
                request.queue_type_id,
                request.queue_inline_data,
                request.activity_type_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.log_asset_id,
                request.log_datetime,
            );

            results[0] = await this.callDBProcedure(request, 'ds_p1_queue_list_insert', paramsArray, 0);

            paramsArray = 
            new Array
            (
                results[0][0].queue_id,
                global.workflowQueueConfig.queueAdded,
                request.log_asset_id,
                request.log_datetime,
            );

            results[1] = await this.callDBProcedure(request, 'ds_p1_queue_list_history_insert', paramsArray, 0);

            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Alter Workflow Queue definition
    //Bharat Masimukku
    //2019-01-21
    this.alterWorkflowQueue = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;
            
            paramsArray = 
            new Array
            (
                request.queue_id,
                request.queue_inline_data,
                request.organization_id,
                request.log_asset_id,
                request.log_datetime,
            );

            results[0] = await this.callDBProcedure(request, 'ds_p1_queue_list_update_inline_data', paramsArray, 0);

            paramsArray = 
            new Array
            (
                request.queue_id,
                global.workflowQueueConfig.queueAltered,
                request.log_asset_id,
                request.log_datetime,
            );

            results[1] = await this.callDBProcedure(request, 'ds_p1_queue_list_history_insert', paramsArray, 0);

            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Archive Workflow Queue definition
    //Bharat Masimukku
    //2019-01-21
    this.archiveWorkflowQueue = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;
            
            paramsArray = 
            new Array
            (
                request.queue_id,
                request.log_state,
                request.organization_id,
                request.log_asset_id,
                request.log_datetime,
            );

            results[0] = await this.callDBProcedure(request, 'ds_p1_queue_list_update_log_state', paramsArray, 0);

            paramsArray = 
            new Array
            (
                request.queue_id,
                global.workflowQueueConfig.queueArchived,
                request.log_asset_id,
                request.log_datetime,
            );

            results[1] = await this.callDBProcedure(request, 'ds_p1_queue_list_history_insert', paramsArray, 0);

            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Set Workflow Queue Access
    //Bharat Masimukku
    //2019-01-21
    this.setWorkflowQueueAccess = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;
            
            paramsArray = 
            new Array
            (
                request.queue_id,
                request.access_level_id,
                request.asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.log_asset_id,
                request.log_datetime,
            );

            results[0] = await this.callDBProcedure(request, 'ds_p1_queue_access_mapping_insert', paramsArray, 0);

            paramsArray = 
            new Array
            (
                results[0][0].queue_access_id,
                request.organization_id,
                global.workflowQueueConfig.queueAccessSet,
                request.log_asset_id,
                request.log_datetime,
            );

            results[1] = await this.callDBProcedure(request, 'ds_p1_queue_access_mapping_history_insert', paramsArray, 0);

            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Reset Workflow Queue Access
    //Bharat Masimukku
    //2019-01-21
    this.resetWorkflowQueueAccess = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;
            
            paramsArray = 
            new Array
            (
                request.queue_access_id,
                request.organization_id,
                request.log_state,
                request.log_asset_id,
                request.log_datetime,
            );

            results[0] = await this.callDBProcedure(request, 'ds_p1_queue_access_mapping_update_log_state', paramsArray, 0);

            paramsArray = 
            new Array
            (
                request.queue_access_id,
                request.organization_id,
                global.workflowQueueConfig.queueAccessReset,
                request.log_asset_id,
                request.log_datetime,
            );

            results[1] = await this.callDBProcedure(request, 'ds_p1_queue_access_mapping_history_insert', paramsArray, 0);

            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };
}

module.exports = WorkflowQueueService;