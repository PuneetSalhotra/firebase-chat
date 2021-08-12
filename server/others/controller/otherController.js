/*
 *author: Nani Kalyan V
 * 
 */

 var OtherService = require("../service/otherService");

 function OtherController(objCollection) {
 
     var responseWrapper = objCollection.responseWrapper;
     var app = objCollection.app;
     var otherService = new OtherService(objCollection);
     var util = objCollection.util;
     var cacheWrapper = objCollection.cacheWrapper;
     var queueWrapper = objCollection.queueWrapper;
     
        
     
     app.post('/' + global.config.version + '/other/meeting/duration/insert', async function (req, res) {
        const [err,responseData] = await otherService.meetingDurationInsert(req.body);
             if (err === false) {                
                 res.send(responseWrapper.getResponse(err, responseData, 200, req.body));
             } else {
                 //console.log('did not get proper response');
                 global.logger.write('response', 'did not get proper response', err, {});
                 res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
             }
     });

     app.post('/' + global.config.version + '/other/meeting/duration/delete', async function (req, res) {
        const [err,responseData] = await otherService.meetingDurationDelete(req.body);
             if (err === false) {                
                 res.send(responseWrapper.getResponse(err, responseData, 200, req.body));
             } else {
                 //console.log('did not get proper response');
                 global.logger.write('response', 'did not get proper response', err, {});
                 res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
             }
     });

     app.post('/' + global.config.version + '/other/meeting/duration/list', async function (req, res) {
        const [err,responseData] = await otherService.meetingDurationList(req.body);
             if (err === false) {                
                 res.send(responseWrapper.getResponse(err, responseData, 200, req.body));
             } else {
                 //console.log('did not get proper response');
                 global.logger.write('response', 'did not get proper response', err, {});
                 res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
             }
     });
     
 };
 module.exports = OtherController;
 