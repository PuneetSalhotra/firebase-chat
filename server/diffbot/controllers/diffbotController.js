var DiffbotService = require("../services/diffbotService.js");

function DiffbotController(objCollection) 
{
    const diffbotService = new DiffbotService(objCollection);
    //const cron = require("node-cron");
  
    //cron.schedule("0 0 0 * * *",  function() {
    //    diffbotService.queryDiffbot({});
    //    diffbotService.getTendersFromTenderTigerWebsite({});
    //});

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;

    app.post('/' + global.config.version + '/diffbot/tender-list/init', async (req, res) => {
        diffbotService.queryDiffbot({});
        diffbotService.getTendersFromTenderTigerWebsite({});
        //const [err, data] = await diffbotService.workforceListUpdateInlineData(req.body);
        //if (!err) {
        //    res.json(responseWrapper.getResponse({}, data, 200, req.body));
        //} else {
        //    res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        //}
        res.json(responseWrapper.getResponse({}, [], 200, req.body));
    });

}

module.exports = DiffbotController;