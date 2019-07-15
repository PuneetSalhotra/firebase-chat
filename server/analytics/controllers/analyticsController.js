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

    app.post('/' + global.config.version + '/analytics/widget/add', async (req, res) => {        
        try {
            
            //try {
            //    JSON.parse(req.body.widget_inline_data);
            //} catch (exeption) {
            //    res.send(responseWrapper.getResponse(false, 'Invalid Inline JSON', -3308, req.body));
            //    return;
            //}

            let result = await analyticsService.analyticsWidgetAdd(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            //global.logger('conLog', 'Error : ', err, {});
            console.log('Error : ', err);
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
    });

    app.post('/' + global.config.version + '/analytics/widget/alter', async (req, res) => {        
        try {
            let result = await analyticsService.analyticsWidgetAlter(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
    });
    
}

module.exports = AnalyticsController;