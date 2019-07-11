/*
    author: bharat krishna masimukku
*/

let WidgetService = require("../services/widgetService.js");

function WidgetController(objCollection) 
{
    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    //const util = objCollection.util;
    //const cacheWrapper = objCollection.cacheWrapper;
    //const queueWrapper = objCollection.queueWrapper;
    //const activityCommonService = objCollection.activityCommonService;

    const widgetService = new WidgetService(objCollection);
}

module.exports = WidgetController;