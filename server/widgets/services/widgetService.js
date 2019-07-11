/*
    author: bharat krishna masimukku
*/

function WidgetService(objectCollection) 
{
    const moment = require('moment');
    const makeRequest = require('request');
    const TinyURL = require('tinyurl');
    
    const cacheWrapper = objectCollection.cacheWrapper;
    //const queueWrapper = objectCollection.queueWrapper;
    //const activityPushService = objectCollection.activityPushService;
    
    const util = objectCollection.util;
    const db = objectCollection.db;    
    const widgetConfig = require('../utils/widgetConfig.js');

    //const activityCommonService = objectCollection.activityCommonService;    
    //const activityUpdateService = new ActivityUpdateService(objectCollection);
    //const activityParticipantService = new ActivityParticipantService(objectCollection);
    //const activityService = new ActivityService(objectCollection);
    //const activityListingService = new ActivityListingService(objectCollection);
    //const activityTimelineService = new ActivityTimelineService(objectCollection);

}

module.exports = WidgetService;