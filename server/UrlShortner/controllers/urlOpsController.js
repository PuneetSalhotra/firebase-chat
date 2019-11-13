const UrlOpsService = require('../services/urlOpsService');

function UrlOpsController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    // const util = objCollection.util;
    const urlOpsService = new UrlOpsService(objCollection);

    // Shorten the URL parameters
    app.post('/' + global.config.version + '/url/parameters/shorten', async function (req, res) {
        const [err, urlData] = await urlOpsService.urlParametersShorten(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, urlData, 200, req.body));
        } else {
            console.log("/url/parameters/shorten | Error: ", err);
            res.send(responseWrapper.getResponse(err, urlData, -9999, req.body));
        }
    });

}

module.exports = UrlOpsController;
