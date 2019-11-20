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

    this.getLedgerTransactionSummaryMonthly = async function name(request) {

        const [errOne, summaryData] = await self.activityMonthlySummaryTransactionSelectFlag(request);
        if (errOne) {
            return [errOne, []]
        }
        const filteredSummaryData = summaryData.map(summary => {
            return {
                monthly_summary_id: summary.monthly_summary_id,
                monthly_summary_name: summary.monthly_summary_name,
                data_type_id: summary.data_type_id,
                data_type_category_id: summary.data_type_category_id,
                credit_amount: summary.data_entity_decimal_1,
                debit_amount: summary.data_entity_decimal_2,
                net_amount: summary.data_entity_decimal_3,
                activity_id: summary.activity_id,
                activity_title: summary.activity_title,
                activity_type_name: summary.activity_type_name,
                activity_type_category_id: summary.activity_type_category_id,
                activity_type_category_name: summary.activity_type_category_name,
                asset_id: summary.asset_id,
                asset_first_name: summary.asset_first_name,
                operating_asset_id: summary.operating_asset_id,
                operating_asset_first_name: summary.operating_asset_first_name,
                log_datetime: summary.log_datetime
            };
        });

        return [false, filteredSummaryData];
    }

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

    this.getLedgerTransactionSummaryQuarterly = async function name(request) {

        const [errOne, summaryData] = await self.activityQuarterlySummaryTransactionSelectFlag(request);
        if (errOne) {
            return [errOne, []]
        }
        const filteredSummaryData = summaryData.map(summary => {
            return {
                quarterly_summary_id: summary.quarterly_summary_id,
                quarterly_summary_name: summary.quarterly_summary_name,
                data_type_id: summary.data_type_id,
                data_type_category_id: summary.data_type_category_id,
                credit_amount: summary.data_entity_decimal_1,
                debit_amount: summary.data_entity_decimal_2,
                net_amount: summary.data_entity_decimal_3,
                activity_id: summary.activity_id,
                activity_title: summary.activity_title,
                activity_type_name: summary.activity_type_name,
                activity_type_category_id: summary.activity_type_category_id,
                activity_type_category_name: summary.activity_type_category_name,
                asset_id: summary.asset_id,
                asset_first_name: summary.asset_first_name,
                operating_asset_id: summary.operating_asset_id,
                operating_asset_first_name: summary.operating_asset_first_name,
                log_datetime: summary.log_datetime
            };
        });

        return [false, filteredSummaryData];
    }

    this.activityQuarterlySummaryTransactionSelectFlag = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.organization_id,
            request.flag, // 1
            request.data_entity_date_1 || '',
            request.datetime_start || moment().startOf('quarter').format('YYYY-MM-DD'),
            request.datetime_end || util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_activity_quarterly_summary_transaction_select_flag', paramsArr);

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
