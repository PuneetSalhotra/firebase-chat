const StatsService = require("../services/statsService");

function statsController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var statsService = new StatsService(objCollection);

    app.post('/' + global.config.version + '/stats/count/signup', function statsSignUpCountReqHandler(req, res) {
        res.send('test');
    });
}

module.exports = statsController;