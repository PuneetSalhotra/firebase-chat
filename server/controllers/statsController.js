const StatsService = require("../services/statsService");

function statsController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var statsService = new StatsService(objCollection);

    app.post('/' + global.config.version + '/stats/count/signup', function statsSignUpCountReqHandler(req, res) {
        statsService.getSignUpCountStats(req.body, function statsSignUpCountCallback(err, data, statusCode) {
            if (!err) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });
}

module.exports = statsController;