const TelcoService = require("../services/telcoService");

function TelcoController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    const util = objCollection.util;
    const cacheWrapper = objCollection.cacheWrapper;
    const queueWrapper = objCollection.queueWrapper;
    var telcoService = new TelcoService(objCollection);
    const activityCommonService = objCollection.activityCommonService;

    const moment = require('moment');


    app.post('/' + global.config.version + '/telco/test/1', async function (req, res) {
        const [err, orgData] = await telcoService.fireTelcoDemoTimelineLogic(
            req.body,
        );
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/telco/test/1 | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/sendEmail/demoTelco', function (req, res) {
        vodafoneService.demoTelcoSendEmail(req.body, 0).then((data) => {
            //console.log(data);
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });
    }); 

};

module.exports = TelcoController;
