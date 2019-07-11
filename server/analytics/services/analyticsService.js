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
    this.getFilterlabels = 
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

            results[0] = db.callDBProcedure(request, 'ds_p1_organization_list_select', paramsArray, 1);
            
            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };
}

module.exports = AnalyticsService;