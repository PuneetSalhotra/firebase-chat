const UrlListingService = require("../services/urlListingService");

function UrlListingController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    // const util = objCollection.util;
    const urlListingService = new UrlListingService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

    app.post('/' + global.config.version + '/url/parameters/lookup', async function (req, res) {
        const [err, urlData] = await urlListingService.urlParametersLookup(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, urlData, 200, req.body));
        } else {
            console.log("/url/parameters/shorten | Error: ", err);
            res.send(responseWrapper.getResponse(err, urlData, -9999, req.body));
        }
    });
}

module.exports = UrlListingController;
