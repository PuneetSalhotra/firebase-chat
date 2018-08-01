const StatsService = require("../services/statsService");

function statsController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var statsService = new StatsService(objCollection);

    app.post('/' + global.config.version + '/stats/signup/count', function statsSignUpCountReqHandler(req, res) {
        statsService.getSignUpCountStats(req.body, function statsSignUpCountCallback(err, data, statusCode) {
            if (!err) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log("err: ", err);
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });

    app.post('/' + global.config.version + '/stats/signup/list', function statsSignUpCountReqHandler(req, res) {
        statsService.getListOfSignUps(req.body, function statsListOfSignUpsCallback(err, data, statusCode) {
            if (!err) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log("err: ", err);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });

    app.post('/' + global.config.version + '/stats/timeline/list', function statsSignUpCountReqHandler(req, res) {
        statsService.getTimelineList(req.body, function statsTimelineListCallback(err, data, statusCode) {
            if (!err) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log("err: ", err);
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });
}

module.exports = statsController;
