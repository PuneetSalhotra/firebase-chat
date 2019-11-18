const LedgerListingService = require("./ledgerListingService");
const logger = require('../../logger/winstonLogger');
const fs = require('fs');

function LedgerOpsService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;
    const ledgerListingService = new LedgerListingService(objectCollection);
    // const moment = require('moment');
    // const makeRequest = require('request');
    // const nodeUtil = require('util');
    const self = this;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

module.exports = LedgerOpsService;