const DoaService = require('../services/doaService');

function doaController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const doaService = new DoaService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

    //const formConfigService = new FormConfigService(objCollection);

    
    //app.post('/' + global.config.version + '/hello', async function (req, res) {
    //    console.log('In hello');
    //    const [err, orgData] = await doaService.hello(req.body);
    //    if (!err) {
    //        res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
    //    } else {
    //        console.log("/admin/workforce/desk/add | Error: ", err);
    //        res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
    //    }
    //});

}

module.exports = doaController;
