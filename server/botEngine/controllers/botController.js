/*
 *author: Nani Kalyan V
 * 
 */

var BotService = require("../services/botService");

function BotController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    //const util = objCollection.util;
    //const cacheWrapper = objCollection.cacheWrapper;
    //const queueWrapper = objCollection.queueWrapper;
    //const activityCommonService = objCollection.activityCommonService;
    let botService = new BotService(objCollection);
    
    //Retrieve the supported trigger types for defining a new bot
    //Bharat Masimukku
    //2019-01-17
    app.post
    (
        '/' + global.config.version + '/bot/trigger_types/list', 
        async (req, res) => 
        {        
            try 
            {
                let result = await botService.getBotTriggerTypes(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Retrieve the supported operation types for defining a new bot
    //Bharat Masimukku
    //2019-01-17
    app.post
    (
        '/' + global.config.version + '/bot/operation_types/list', 
        async (req, res) => 
        {        
            try 
            {
                let result = await botService.getBotOperationTypes(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Insert a new bot definition which includes the type of trigger and the supporting info for the trigger
    //Bharat Masimukku
    //2019-01-17
    app
    .post
    (
        '/' + global.config.version + '/bot/add', 
        async (req, res) => 
        {        
            try 
            {
                let result = await botService.addBot(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Alter bot definition
    //Bharat Masimukku
    //2019-01-18
    app
    .post
    (
        '/' + global.config.version + '/bot/alter',
        async (req, res) => 
        {        
            try 
            {
                let result = await botService.alterBot(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    )

    //Archive bot definition
    //Bharat Masimukku
    //2019-01-18
    app
    .post
    (
        '/' + global.config.version + '/bot/archive',
        async (req, res) => 
        {        
            try 
            {
                let result = await botService.archiveBot(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    )

    //Insert a new bot operation mapping
    //Bharat Masimukku
    //2019-01-17
    app
    .post
    (
        '/' + global.config.version + '/bot/mapping/workflow_step/add', 
        async (req, res) => 
        {        
            try 
            {
                let result = await botService.addBotWorkflowStep(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Alter bot operation mapping
    //Bharat Masimukku
    //2019-01-17
    app
    .post
    (
        '/' + global.config.version + '/bot/mapping/workflow_step/alter', 
        async (req, res) => 
        {        
            try 
            {
                let result = await botService.alterBotWorkflowStep(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                console.log(err);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Archive bot operation mapping
    //Bharat Masimukku
    //2019-01-17
    app
    .post
    (
        '/' + global.config.version + '/bot/mapping/workflow_step/archive', 
        async (req, res) => 
        {        
            try 
            {
                let result = await botService.archiveBotWorkflowStep(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );
    
    //Retrieve the bots based mapped to a specific activity_type
    app.post('/' + global.config.version + '/bot/mapping/activity_type/list', async (req, res) => {        
        try {
            let result = await botService.getBotsMappedToActType(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });
    
    //Retrieve the workflow steps of a specific bot
    app.post('/' + global.config.version + '/bot/mapping/workflow_step/list', async (req, res) => {
        try {            
            global.logger.write('conLog', req.body, {}, {});
            let result = await botService.getBotworkflowSteps(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    //Initiate the Bot Engine
    app.post('/' + global.config.version + '/engine/bot/init', async (req, res) => {
        try {
            let result = await botService.initBotEngine(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {            
            global.logger.write('conLog', err, {}, {});
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    //app.post('/' + global.config.version + '/bot/workflow_references/list', async (req, res) => {
    //    const [err, result] = await botService.getWorkflowReferenceBots(req.body);
    //    if (!err) {
    //        res.send(responseWrapper.getResponse(false, result, 200, req.body));
    //    } else {
    //        console.log("/bot/workflow_references/list | Error: ", err);
    //        res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
    //    } 
    //});
    
}

module.exports = BotController;