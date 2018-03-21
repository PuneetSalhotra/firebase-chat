/*
 *author: Nani Kalyan V
 * 
 */

var PerformanceStatsService = require("../services/performanceStatsService");

function PerformanceStatsController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var performanceStatsService = new PerformanceStatsService(objCollection);
    var util = objCollection.util;    
    
    //BETA Task List Counts
    app.post('/' + global.config.version + '/asset/access/task/counts', function (req, res) {
        performanceStatsService.employeeProductivityReport(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    // To get Response time < 24 hrs 
    app.post('/' + global.config.version + '/asset/tasks/response_time/list', function (req, res) {
        performanceStatsService.tasksRespTime(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // To update ratings
    app.put('/' + global.config.version + '/asset/task_creator/rating/alter', function (req, res) {
        performanceStatsService.updateCreatorRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    // To update ratings
    app.put('/' + global.config.version + '/asset/task_lead/rating/alter', function (req, res) {
        performanceStatsService.updateLeadRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    // To update ratings
    app.put('/' + global.config.version + '/asset/task_collaborator/rating/alter', function (req, res) {
        performanceStatsService.updateCollaboratorRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
}
;
module.exports = PerformanceStatsController;
