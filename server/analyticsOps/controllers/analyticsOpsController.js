/*
    author: Puneet Salhotra
*/

let AnalyticsOpsService = require("../services/analyticsOpsService");

function AnalyticsOpsController (objCollection) {
    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    //const util = objCollection.util;
    //const cacheWrapper = objCollection.cacheWrapper;
    //const queueWrapper = objCollection.queueWrapper;
    //const activityCommonService = objCollection.activityCommonService;

    const analyticsOpsService = new AnalyticsOpsService(objCollection);

    app.post
        (
            '/' + global.config.version + '/analytics/application/master/insert',
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
        '/' + global.config.version + '/analytics/tag_type/list/insert',
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
        '/' + global.config.version + '/analytics/widget/filter/master/select',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.fetchWidgetTypeMaster(req.body);
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
        '/' + global.config.version + '/analytics/organization/tag_type/filter/insert',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.insertTagTypeFilterMapping(req.body);
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
        '/' + global.config.version + '/analytics/widget/drilldown/header/mapping/insert',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.insertWidgetDrilldownHeaderMapping(req.body);
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
        '/' + global.config.version + '/analytics/workforce/activity_type/mapping/update',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.updateWorkforceActivityTypeMapping(req.body);
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
        '/' + global.config.version + '/analytics/widget/drilldown/header/select',
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
                console.log("Error  in /analytics/widget/filter/master/select", err, err.stack);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );
}

module.exports = AnalyticsOpsController;
    