const dataManagementService = require('../services/dataManagementService');


module.exports = function DataManagementController(params) {
    const responseWrapper = params.responseWrapper;
    const app = params.app;

    const dmService = new dataManagementService(params);

    app.post(`/${global.config.version}/datamanagement/export`,async (req,res) => {
        try {
            await dmService.exportFormsDataToPdf(req,res)
        } catch(err) {
            res.send(responseWrapper.getResponse(err,{},-9998,req.body));
        }
    });

}