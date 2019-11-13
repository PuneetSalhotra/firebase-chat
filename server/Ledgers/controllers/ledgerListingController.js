const LedgerListingService = require("../services/ledgerListingService");

function LedgerListingController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const ledgerListingService = new LedgerListingService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

}

module.exports = LedgerListingController;
