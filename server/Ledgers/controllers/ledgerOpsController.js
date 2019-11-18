const LedgerOpsService = require('../services/ledgerOpsService');

function LedgerOpsController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const ledgerOpsService = new LedgerOpsService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

}

module.exports = LedgerOpsController;
