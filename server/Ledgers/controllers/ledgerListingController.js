const LedgerListingService = require("../services/ledgerListingService");

function LedgerListingController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const ledgerListingService = new LedgerListingService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

    // Unified service for listing and differentials of activities of both workflow and account categories
    app.post('/' + global.config.version + '/accounts/list', async function (req, res) {
        const [err, statusTagData] = await ledgerListingService.workflowAccountCatList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, statusTagData, 200, req.body));
        } else {
            console.log("/accounts/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, statusTagData, -9999, req.body));
        }
    });

}

module.exports = LedgerListingController;
