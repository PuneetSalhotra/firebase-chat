/*
 *author: Nani Kalyan V
 * 
 */

let PerformanceStatsService = require("../services/performanceStatsService");

function PerformanceStatsController(objCollection) {

    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    let performanceStatsService = new PerformanceStatsService(objCollection);
    let util = objCollection.util;    
    
    //BETA Task List Counts
    app.post('/' + global.config.version + '/asset/access/task/counts', function (req, res) {
        performanceStatsService.employeeProductivityReport(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    // To get Response time < 24 hrs 
    app.post('/' + global.config.version + '/asset/tasks/response_time/list', function (req, res) {
        performanceStatsService.tasksRespTime(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // To update ratings
    app.post('/' + global.config.version + '/asset/task_creator/rating/alter', function (req, res) {
        performanceStatsService.updateCreatorRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    // To update ratings
    app.post('/' + global.config.version + '/asset/task_lead/rating/alter', function (req, res) {
        performanceStatsService.updateLeadRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    // To update ratings
    app.post('/' + global.config.version + '/asset/task_collaborator/rating/alter', function (req, res) {
        performanceStatsService.updateCollaboratorRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    // To Get inmail performance
    app.post('/' + global.config.version + '/asset/access/inmail/count', function (req, res) {
        performanceStatsService.retrieveInmailCnt(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
}
;
module.exports = PerformanceStatsController;
