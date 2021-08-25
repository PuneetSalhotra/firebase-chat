/*
    author: bharat krishna masimukku
*/

var WorkflowQueueService = require("../services/workflowQueueService.js");

function WorkflowQueueController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    //const util = objCollection.util;
    //const cacheWrapper = objCollection.cacheWrapper;
    //const queueWrapper = objCollection.queueWrapper;
    //const activityCommonService = objCollection.activityCommonService;

    const workflowQueueService = new WorkflowQueueService(objCollection);

    //Add Workflow Queue definition
    //Bharat Masimukku
    //2019-01-21
    app.post(
        '/' + global.config.version + '/workflowQueue/add',
        async (req, res) => {
            try {
                let result = await workflowQueueService.addWorkflowQueue(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    //Alter Workflow Queue definition
    //Bharat Masimukku
    //2019-01-21
    app.post(
        '/' + global.config.version + '/workflowQueue/alter',
        async (req, res) => {
            try {
                let result = await workflowQueueService.alterWorkflowQueue(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    app.post(
        '/' + global.config.version + '/workflowQueue/access/update',
        async (req, res) => {
           
                let [err,result] = await workflowQueueService.updateWorkflowAccess(req.body);
                
                if(!err){
                    res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    //Archive Workflow Queue definition
    //Bharat Masimukku
    //2019-01-21
    app.post(
        '/' + global.config.version + '/workflowQueue/archive',
        async (req, res) => {
            try {
                let result = await workflowQueueService.archiveWorkflowQueue(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    //Set Workflow Queue access
    //Bharat Masimukku
    //2019-01-21
    app.post(
        '/' + global.config.version + '/workflowQueue/access/set',
        async (req, res) => {
            try {
                let result = await workflowQueueService.setMultipleAssetsQueueAccessV1(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                console.log("error ",err);
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );

    //Reset Workflow Queue access
    //Bharat Masimukku
    //2019-01-21
    app.post(
        '/' + global.config.version + '/workflowQueue/access/reset',
        async (req, res) => {
            try {
                let result = await workflowQueueService.resetWorkflowQueueAccess(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );
    app.post('/' + global.config.version + '/queue/user/mappings', async function (req, res) {
        const [err, data] = await workflowQueueService.getQueueMappingUsers(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });
}

module.exports = WorkflowQueueController;