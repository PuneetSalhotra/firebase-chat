/*
 *author: Sri Sai Venkatesh
 *date: 1970:01:01 00:00:00
 * 
 */

var ActivityConfigService = require("../services/activityConfigService");

function ActivityConfigController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;

    var activityConfigService = new ActivityConfigService(objCollection.db,objCollection.util);

    app.post('/' + global.config.version + '/activity_type/access/workforce/list', function (req, res) {//Fetch activity types
        activityConfigService.getWorkforceActivityTypesList(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('response','did not get proper response - ' + err,req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });


    });

    app.post('/' + global.config.version + '/activity_status/access/workforce/list', function (req, res) {//Fetch activity status
        activityConfigService.getWorkforceActivityStatusList(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('response','did not get proper response - ' + err,req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });


    });
    
    app.post('/' + global.config.version + '/activity_participant_role/access/global/list', function (req, res) { // Fetch activity participant access global level
        activityConfigService.getActivityParticipantAccess(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                //console.log('did not get proper respone');
                global.logger.write('response','did not get proper response - ' + err,req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });

    });
}


module.exports = ActivityConfigController;