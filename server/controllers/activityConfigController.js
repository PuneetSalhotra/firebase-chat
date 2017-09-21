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
        req.body['module'] = 'activity';
        activityConfigService.getWorkforceActivityTypesList(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.send(responseWrapper.getResponse(err, data, statusCode));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode));
            }
        });


    });

    app.post('/' + global.config.version + '/activity_status/access/workforce/list', function (req, res) {//Fetch activity status
        req.body['module'] = 'activity';
        activityConfigService.getWorkforceActivityStatusList(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.send(responseWrapper.getResponse(err, data, statusCode));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode));
            }
        });


    });
    
    app.post('/' + global.config.version + '/activity_participant_role/access/global/list', function (req, res) { // Fetch activity participant access global level
        req.body['module'] = 'activity';
        activityConfigService.getActivityParticipantAccess(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.send(responseWrapper.getResponse(err, data, statusCode));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode));
            }
        });


    });

    
}


module.exports = ActivityConfigController;