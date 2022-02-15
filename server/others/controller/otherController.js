/*
 *author: Nani Kalyan V
 * 
 */

 let OtherService = require("../service/otherService");

 function OtherController(objCollection) {
 
     let responseWrapper = objCollection.responseWrapper;
     let app = objCollection.app;
     let otherService = new OtherService(objCollection);
     let util = objCollection.util;
     let cacheWrapper = objCollection.cacheWrapper;
     let queueWrapper = objCollection.queueWrapper;
     
        
     
     app.post('/' + global.config.version + '/other/meeting/duration/insert', async function (req, res) {
        const [err,responseData] = await otherService.meetingDurationInsert(req.body);
             if (err === false) {                
                 res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
             } else {
                 //console.log('did not get proper response');
                 //global.logger.write('response', 'did not get proper response', err, {});
                 util.logError(req,`response did not get proper response Error %j`, { err });
                 res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
             }
     });

     app.post('/' + global.config.version + '/other/meeting/duration/delete', async function (req, res) {
        const [err,responseData] = await otherService.meetingDurationDelete(req.body);
             if (err === false) {                
                 res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
             } else {
                 //console.log('did not get proper response');
                 //global.logger.write('response', 'did not get proper response', err, {});
                 util.logError(req,`response did not get proper response Error %j`, { err });
                 res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
             }
     });

     app.post('/' + global.config.version + '/other/meeting/duration/list', async function (req, res) {
        const [err,responseData] = await otherService.meetingDurationList(req.body);
             if (err === false) {                
                 res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
             } else {
                 //console.log('did not get proper response');
                 //global.logger.write('response', 'did not get proper response', err, {});
                 util.logError(req,`response did not get proper response Error %j`, { err });
                 res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
             }
     });
     
 };
 module.exports = OtherController;
 