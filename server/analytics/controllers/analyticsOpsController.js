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
                    res.json(responseWrapper.getResponse(false, result, 200, req.body));
                }
                catch (err) {
                    res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
                }
            }
        );

    app.post
    (
        '/' + global.config.version + '/analytics/tag_type/add',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.addTagTypeList(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/get/widget/filter',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.fetchWidgetTypeMaster(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/get/widget/filter", err, err.stack);
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/tag_type/filter/set',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.insertTagTypeFilterMapping(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/tag_type/filter/set", err, err.stack);
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/drilldown/header/set',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.insertWidgetDrilldownHeaderMapping(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/drilldown/header/set", err, err.stack);
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/value/contributor/set',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.updateWorkforceActivityTypeMapping(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/value/contributor/set", err, err.stack);
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/get/drilldown/header',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.selectWidgetDrilldownHeaderMapping(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/widget/filter/master/select", err, err.stack);
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post
    (
        '/' + global.config.version + '/analytics/report/filter/insert',
        async (req, res) => {
            try {
                let result = await analyticsOpsService.insertReportFilter(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            }
            catch (err) {
                console.log("Error  in /analytics/report/filter/insert", err, err.stack);
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post('/' + global.config.version + '/analytics/application/tag_type/list', async function (req, res) {
        const [err, resData] = await analyticsOpsService.getTagTypesBasedOnApplication(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/analytics/application/tag_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    //Get the dashboard fields filter list
    app.post('/' + global.config.version + '/analytics/dashboard/field/filter/list', async function (req, res) {
        const [err, resData] = await analyticsOpsService.getDashboardFiledsFilterList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/analytics/dashboard/field/filter/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    //UpdateWorforceFormFieldMappingFilters
    app.post('/' + global.config.version + '/analytics/dashboard/field/filter/set', async function (req, res) {
        const [err, resData] = await analyticsOpsService.UpdateWorforceFormFieldMappingFilters(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/analytics/dashboard/field/filter/set | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    //Get Reports Tag Type Mapping
    app.post('/' + global.config.version + '/report/filter/tag_type/mapping/select', async function (req, res) {
        const [err, resData] = await analyticsOpsService.getReportsTagTypeMapping(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/report/filter/tag_type/mapping/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    //Update Reports Tag Type Mapping
    app.post('/' + global.config.version + '/report/filter/tag_type/mapping/update', async function (req, res) {
        const [err, resData] = await analyticsOpsService.UpdateReportsTagTypeMapping(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/report/filter/tag_type/mapping/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

//Delete Reports Tag Type Mapping
app.post('/' + global.config.version + '/report/filter/tag_type/mapping/delete', async function (req, res) {
    const [err, resData] = await analyticsOpsService.DeleteReportsTagTypeMapping(req.body);
    if (!err) {
        res.json(responseWrapper.getResponse({}, resData, 200, req.body));
    } else {
        console.log("/report/filter/tag_type/mapping/delete | Error: ", err);
        res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
    }
});


//Insert Reports Tag Type Mapping
app.post('/' + global.config.version + '/report/filter/tag_type/mapping/insert', async function (req, res) {
    const [err, resData] = await analyticsOpsService.InsertReportsTagTypeMapping(req.body);
    if (!err) {
        res.json(responseWrapper.getResponse({}, resData, 200, req.body));
    } else {
        console.log("/report/filter/tag_type/mapping/insert | Error: ", err);
        res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
    }
});


//Select Widget Chart Master
app.post('/' + global.config.version + '/widget/chart/master/select', async function (req, res) {
    const [err, resData] = await analyticsOpsService.SelectWidgetChartMaster(req.body);
    if (!err) {
        res.json(responseWrapper.getResponse({}, resData, 200, req.body));
    } else {
        console.log("/widget/chart/master/select | Error: ", err);
        res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
    }
});

//Select Widget Type Master
app.post('/' + global.config.version + '/widget/type/master/select', async function (req, res) {
    const [err, resData] = await analyticsOpsService.SelectWidgetTypeMaster(req.body);
    if (!err) {
        res.json(responseWrapper.getResponse({}, resData, 200, req.body));
    } else {
        console.log("/widget/type/master/select | Error: ", err);
        res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
    }
});

}

module.exports = AnalyticsOpsController;
    