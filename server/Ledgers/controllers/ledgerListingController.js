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

    // Monthly Summary Transaction
    app.post('/' + global.config.version + '/ledger/transaction/summary/monthly', async function (req, res) {
        const [err, summaryData] = await ledgerListingService.getLedgerTransactionSummaryMonthly(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, summaryData, 200, req.body));
        } else {
            console.log("/ledger/transaction/summary/monthly | Error: ", err);
            res.send(responseWrapper.getResponse(err, summaryData, -9999, req.body));
        }
    });

    // Quarterly Summary Transaction
    app.post('/' + global.config.version + '/ledger/transaction/summary/quarterly', async function (req, res) {
        const [err, summaryData] = await ledgerListingService.getLedgerTransactionSummaryQuarterly(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, summaryData, 200, req.body));
        } else {
            console.log("/ledger/transaction/summary/quarterly | Error: ", err);
            res.send(responseWrapper.getResponse(err, summaryData, -9999, req.body));
        }
    });

    // Yearly Summary Transaction
    app.post('/' + global.config.version + '/ledger/transaction/summary/yearly', async function (req, res) {
        const [err, summaryData] = await ledgerListingService.getLedgerTransactionSummaryYearly(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, summaryData, 200, req.body));
        } else {
            console.log("/ledger/transaction/summary/yearly | Error: ", err);
            res.send(responseWrapper.getResponse(err, summaryData, -9999, req.body));
        }
    });

}

module.exports = LedgerListingController;
