const logger = require('../../logger/winstonLogger');
const moment = require('moment');

function LedgerListingService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    // const activityCommonService = objectCollection.activityCommonService;
    // const moment = require('moment');
    // const nodeUtil = require('util');
    const self = this;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.workflowAccountCatList = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.flag,
            request.sort_flag,
            util.getCurrentUTCTime(),
            request.page_start || 0,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_accounts_flag', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    this.activityTimelineTransactionSelectLedgerTotals = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.datetime_start,
            request.datetime_end
        );
        const queryString = util.getQueryString('ds_p1_activity_timeline_transaction_select_ledger_totals', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    this.activityMonthlySummaryTransactionSelectFlag = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.organization_id,
            request.flag, // 1
            request.data_entity_date_1 || '',
            request.datetime_start || moment().startOf('month').format('YYYY-MM-DD'),
            request.datetime_end || util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_activity_monthly_summary_transaction_select_flag', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

}

module.exports = LedgerListingService;
