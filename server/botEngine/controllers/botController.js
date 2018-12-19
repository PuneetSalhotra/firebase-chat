/*
 *author: Nani Kalyan V
 * 
 */

var BotService = require("../services/botService");

function BotController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    const util = objCollection.util;
    //const cacheWrapper = objCollection.cacheWrapper;
    //const queueWrapper = objCollection.queueWrapper;
    //const activityCommonService = objCollection.activityCommonService;
    let botService = new BotService(objCollection);    
    
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
            let result = await botService.getBotworkflowSteps(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });    
    
};

module.exports = BotController;
