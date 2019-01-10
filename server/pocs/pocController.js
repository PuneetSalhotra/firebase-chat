function PocController(objCollection) {
    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;

    // HavMor
    const HavmorService = require("../pocs/havmorService");
    const havmorService = new HavmorService(objCollection);

    app.post('/' + global.config.version + '/poc/havmor/exception/test', async function (req, res) {

        const [err, data, statusCode] = await havmorService.checkAndSubimtExceptionForm(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
        }

    });
}
module.exports = PocController;