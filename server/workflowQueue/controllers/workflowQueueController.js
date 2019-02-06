/*
    author: bharat krishna masimukku
*/

var WorkflowQueueService = require("../services/workflowQueueService.js");

function WorkflowQueueController(objCollection) 
{

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
    app.post
    (
        '/' + global.config.version + '/workflowQueue/add', 
        async (req, res) => 
        {        
            try 
            {
                let result = await workflowQueueService.addWorkflowQueue(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Alter Workflow Queue definition
    //Bharat Masimukku
    //2019-01-21
    app.post
    (
        '/' + global.config.version + '/workflowQueue/alter', 
        async (req, res) => 
        {        
            try 
            {
                let result = await workflowQueueService.alterWorkflowQueue(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Archive Workflow Queue definition
    //Bharat Masimukku
    //2019-01-21
    app.post
    (
        '/' + global.config.version + '/workflowQueue/archive', 
        async (req, res) => 
        {        
            try 
            {
                let result = await workflowQueueService.archiveWorkflowQueue(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Set Workflow Queue access
    //Bharat Masimukku
    //2019-01-21
    app.post
    (
        '/' + global.config.version + '/workflowQueue/access/set', 
        async (req, res) => 
        {        
            try 
            {
                let result = await workflowQueueService.setWorkflowQueueAccess(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Reset Workflow Queue access
    //Bharat Masimukku
    //2019-01-21
    app.post
    (
        '/' + global.config.version + '/workflowQueue/access/reset', 
        async (req, res) => 
        {        
            try 
            {
                let result = await workflowQueueService.resetWorkflowQueueAccess(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );
}

module.exports = WorkflowQueueController;