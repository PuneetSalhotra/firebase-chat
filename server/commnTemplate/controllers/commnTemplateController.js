/*
    author: bharat krishna masimukku
*/

var CommnTemplateService = require("../services/commnTemplateService.js");

function CommnTemplateController(objCollection) 
{

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    //const util = objCollection.util;
    //const cacheWrapper = objCollection.cacheWrapper;
    //const queueWrapper = objCollection.queueWrapper;
    //const activityCommonService = objCollection.activityCommonService;

    const commnTemplateService = new CommnTemplateService(objCollection);

    //Get the list of communication channels
    //Bharat Masimukku
    //2019-01-21
    app.post
    (
        '/' + global.config.version + '/commnTemplate/commnChannels/list', 
        async (req, res) => 
        {        
            try 
            {
                let result = await commnTemplateService.getCommnChannels(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Add Communication Template
    //Bharat Masimukku
    //2019-01-21
    app.post
    (
        '/' + global.config.version + '/commnTemplate/add', 
        async (req, res) => 
        {        
            try 
            {
                let result = await commnTemplateService.addCommnTemplate(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Alter Communication Template
    //Bharat Masimukku
    //2019-01-21
    app.post
    (
        '/' + global.config.version + '/commnTemplate/alter', 
        async (req, res) => 
        {        
            try 
            {
                let result = await commnTemplateService.alterCommnTemplate(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Archive Communication Template
    //Bharat Masimukku
    //2019-01-21
    app.post
    (
        '/' + global.config.version + '/commnTemplate/archive', 
        async (req, res) => 
        {        
            try 
            {
                let result = await commnTemplateService.archiveCommnTemplate(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

}

module.exports = CommnTemplateController;