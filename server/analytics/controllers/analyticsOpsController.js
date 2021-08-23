/*
    author: Puneet Salhotra
*/

let AnalyticsOpsService = require("../services/analyticsOpsService");

function AnalyticsOpsController (objCollection) {
    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    const util = objCollection.util;
    //const cacheWrapper = objCollection.cacheWrapper;
    //const queueWrapper = objCollection.queueWrapper;
    //const activityCommonService = objCollection.activityCommonService;

    const analyticsOpsService = new AnalyticsOpsService(objCollection);

    app.post
        (
            '/' + global.config.version + '/analytics/application/add',
            async (req, res) => {
                try {
                    let result = await analyticsOpsService.addApplicationMaster(req.body);
                    res.send(responseWrapper.getResponse(false, result, 200, req.body));
                }
                catch (err) {
                    res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
                }
            }
        );

    app.post
    (
        '/' + global.config.version + '/analytics/tag_type/add',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.addTagTypeList(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/get/widget/filter',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.fetchWidgetTypeMaster(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/get/widget/filter", err, err.stack);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/tag_type/filter/set',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.insertTagTypeFilterMapping(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/tag_type/filter/set", err, err.stack);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/drilldown/header/set',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.insertWidgetDrilldownHeaderMapping(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/drilldown/header/set", err, err.stack);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/value/contributor/set',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.updateWorkforceActivityTypeMapping(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/value/contributor/set", err, err.stack);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/get/drilldown/header',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.selectWidgetDrilldownHeaderMapping(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/widget/filter/master/select", err, err.stack);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/report/filter/insert',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.insertReportFilter(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/report/filter/insert", err, err.stack);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post('/' + global.config.version + '/analytics/application/tag_type/list', async function (req, res) {
        const [err, resData] = await analyticsOpsService.getTagTypesBasedOnApplication(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/analytics/application/tag_type/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });   

}

module.exports = AnalyticsOpsController;
    