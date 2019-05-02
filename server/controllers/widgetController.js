/*
 *author: Sri Sai Venkatesh 
 * 
 */

var WidgetService = require("../services/widgetService");

function WidgetController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    //const vodafoneCustomerServiceFlow = require('../utils/vodafoneCustomerServiceFlow');


    var widgetService = new WidgetService(objCollection);

    app.post('/' + global.config.version + '/widget/static/timecard/collection', function (req, res) {
        widgetService.getTimecardWidgetCollection(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/widget/access/asset/timeline/list', function (req, res) {
        widgetService.getAssetWidgetTimeline(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/widget/access/workforce/timeline/list', function (req, res) {
        widgetService.getWorkforceWidgetTimeline(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    /*app.post('/' + global.config.version + '/vodafone/workflow/customer_service', function (req, res) {

        vodafoneCustomerServiceFlow(req.body, objCollection.activityCommonService, objCollection, (err, data, statusCode) => {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, {
                    activity_id: data
                }, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });

    }); */


    app.post('/' + global.config.version + '/widget/access/level/list', function (req, res) {
        widgetService.widgetAccessLevelList(req.body, 0).then((data) => {
            //console.log(data);
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });

    });

    app.post('/' + global.config.version + '/widget/transaction/data/list', function (req, res) {
        widgetService.widgetTransactionSelectAll(req.body, 0).then((data) => {
            //console.log(data);
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });
    });

    app.post('/' + global.config.version + '/widget/access/list', function (req, res) {
        widgetService.widgetAccessList(req.body, 0).then((data) => {
            //console.log(data);
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });

    });

    app.post('/' + global.config.version + '/widget/transaction/collection', function (req, res) {
        widgetService.widgetTransactionSelectAll(req.body, 0).then((data) => {
            //console.log(data);
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });
    });

    app.post('/' + global.config.version + '/widget/add', async function (req, res) {
        const [err, data] = await widgetService.widgetListInsert(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/widget/mapping/delete', async function (req, res) {
        const [err, data] = await widgetService.widgetMappingDelete(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/widget/update', async function (req, res) {
        const [err, data] = await widgetService.widgetUpdate(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/widget/entity/share/level', async function (req, res) {
        const [err, data] = await widgetService.widgetEntityShareInsert(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/widget/access/level/entity/list', async function (req, res) {
        const [err, data] = await widgetService.widgetAccessLevelEntityList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/widget/delete', async function (req, res) {
        const [err, data] = await widgetService.widgetDelete(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/widget/asset/activity_type/list', async function (req, res) {
        const [err, data] = await widgetService.widgetEntityMappingSelectAssetActivityTypes(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/activity_type/widget/list', async function (req, res) {
        const [err, data] = await widgetService.widgetEntityMappingSelectAssetActivityTypeWidgets(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    //Get the count of files mapped to a specific activity type and that are set to a specific status type or status
    //Bharat Masimukku
    //2019-02-09
    app.post
    (
        '/' + global.config.version + '/widget/activities/activityType/status/count', 
        async (req, res) => 
        {        
            try 
            {
                let result = await widgetService.getActivitiesStatusCount(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Get the list of files mapped to a specific activity type and that are set to a specific status type or status
    //Bharat Masimukku
    //2019-02-09
    app.post
    (
        '/' + global.config.version + '/widget/activities/activityType/status/list', 
        async (req, res) => 
        {        
            try 
            {
                let result = await widgetService.getActivitiesStatusList(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    app.post(
        '/' + global.config.version + '/widget/organization/level/status/count',
        async (req, res) => {
            try {
                let result = await widgetService.getOrgLevelWorkflowStatusWiseCount(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                console.log('err :', err);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post(
        '/' + global.config.version + '/widget/organization/level/status/aggr',
        async (req, res) => {
            try {
                let result = await widgetService.getOrgLevelWorkflowStatusWiseAggr(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post('/' + global.config.version + '/widget/activity/field_transaction/average_time',async (req, res) => {
            try {
                let result = await widgetService.fieldTrxAvgTime(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );


    app.post(
        '/' + global.config.version + '/widget/organization/level/status/drilldown',
        async (req, res) => {
            try {
                let result = await widgetService.getOrgLevelWorkflowStatusWiseAggrDrilldown(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );
    
}

module.exports = WidgetController;