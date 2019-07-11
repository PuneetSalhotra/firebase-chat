/*
    author: bharat krishna masimukku
*/

let AnalyticsService = require("../services/analyticsService.js");

function AnalyticsController(objCollection) 
{
    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    //const util = objCollection.util;
    //const cacheWrapper = objCollection.cacheWrapper;
    //const queueWrapper = objCollection.queueWrapper;
    //const activityCommonService = objCollection.activityCommonService;

    const analyticsService = new AnalyticsService(objCollection);

    //Get the list of filter labels for the organization
    //Bharat Masimukku
    //2019-07-11
    app.post
    (
        '/' + global.config.version + '/analytics/organization/filters/labels/list', 
        async (req, res) => 
        {        
            try 
            {
                let result = await analyticsService.getFilterLabels(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Get the list of filter values for the organization
    //Bharat Masimukku
    //2019-07-11
    app.post
    (
        '/' + global.config.version + '/analytics/organization/filters/values/list', 
        async (req, res) => 
        {        
            try 
            {
                let result = await analyticsService.getFilterValues(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );
}

module.exports = AnalyticsController;