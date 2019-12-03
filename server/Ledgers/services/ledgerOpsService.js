const LedgerListingService = require("./ledgerListingService");
const logger = require('../../logger/winstonLogger');
const fs = require('fs');
const moment = require('moment');

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

    this.ledgerCreditDebitNetTransactionUpdate = async function (request) {
        logger.silly("Ledger Credit/Debit/Net Transactions Processing");
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        if (
            Number(request.activity_stream_type_id) === 705 &&
            Number(request.device_os_id) !== 5
        ) {
            request.activity_inline_data = JSON.parse(request.activity_timeline_collection).form_submitted;
        }

        let activityInlineData =
            (typeof request.activity_inline_data === 'string') ? JSON.parse(request.activity_inline_data) : request.activity_inline_data,

            accountTransactionFieldsMap = new Map();

        activityInlineData.map(field => {
            if (Number(field.field_data_type_id) === 62) {
                let fieldValue = (typeof field.field_value === 'string') ? JSON.parse(field.field_value) : field.field_value;
                accountTransactionFieldsMap.set(field.field_id, fieldValue)
            };
        });

        // Iterate through the map entries
        for (const [fieldID, fieldValue] of accountTransactionFieldsMap.entries()) {
            // Extract relevant details
            const ledgerActivityID = Number(fieldValue.transaction_data.activity_id),
                transactionTypeID = Number(fieldValue.transaction_data.transaction_type_id),
                transactionAmount = Number(fieldValue.transaction_data.transaction_amount);

            // Calculate month, quarter and year start date
            const startOfYear = moment().startOf('year').format('YYYY-MM-DD'),
                startOfQuarter = moment().startOf('quarter').format('YYYY-MM-DD'),
                startOfMonth = moment().startOf('month').format('YYYY-MM-DD');

            // Ledger timeline transaction insert
            let streamTypeID;
            if (transactionTypeID === 1) {
                streamTypeID = 27007;
            } else if (transactionTypeID === 2) {
                streamTypeID = 27008;
            }

            try {
                await activityTimelineTransactionInsertV6({
                    ...request,
                    activity_id: ledgerActivityID,
                    entity_decimal_1: transactionAmount,
                    data_type_id: 62
                }, streamTypeID, organizationID, accountID, workforceID)
            } catch (error) {
                logger.silly("activityTimelineTransactionInsertV6 | Error: %j", error);
            }

            // Calculate net
            let netAmountYearly = 0,
                netAmountQuarterly = 0,
                netAmountMonthly = 0;
            try {
                // Yearly
                const [errOne, creditDebitDataYearly] = await ledgerListingService.activityTimelineTransactionSelectLedgerTotals({
                    activity_id: ledgerActivityID,
                    datetime_start: startOfYear,
                    datetime_end: util.getCurrentUTCTime()
                });
                if (creditDebitDataYearly.length > 0) {
                    netAmountYearly = Number(creditDebitDataYearly[0].total_credit) - Number(creditDebitDataYearly[0].total_debit);
                }
                // console.log("netAmountYearly: ", netAmountYearly);

                // Quarterly
                const [errTwo, creditDebitDataQuarterly] = await ledgerListingService.activityTimelineTransactionSelectLedgerTotals({
                    activity_id: ledgerActivityID,
                    datetime_start: startOfQuarter,
                    datetime_end: util.getCurrentUTCTime()
                });
                if (creditDebitDataQuarterly.length > 0) {
                    netAmountQuarterly = Number(creditDebitDataQuarterly[0].total_credit) - Number(creditDebitDataQuarterly[0].total_debit);
                }
                // console.log("netAmountQuarterly: ", netAmountQuarterly);

                // Monthly
                const [errThree, creditDebitDataMonthly] = await ledgerListingService.activityTimelineTransactionSelectLedgerTotals({
                    activity_id: ledgerActivityID,
                    datetime_start: startOfMonth,
                    datetime_end: util.getCurrentUTCTime()
                });
                if (creditDebitDataMonthly.length > 0) {
                    netAmountMonthly = Number(creditDebitDataMonthly[0].total_credit) - Number(creditDebitDataMonthly[0].total_debit);
                }
                // console.log("netAmountMonthly: ", netAmountMonthly);

                // Update the master data column of the ledger
                const ledgerInlineData = {
                    monthly: {
                        credit_amount: Number(creditDebitDataMonthly[0].total_credit),
                        debit_amount: Number(creditDebitDataMonthly[0].total_debit),
                        net_amount: netAmountMonthly
                    },
                    quarterly: {
                        credit_amount: Number(creditDebitDataQuarterly[0].total_credit),
                        debit_amount: Number(creditDebitDataQuarterly[0].total_debit),
                        net_amount: netAmountQuarterly
                    },
                    yearly: {
                        credit_amount: Number(creditDebitDataYearly[0].total_credit),
                        debit_amount: Number(creditDebitDataYearly[0].total_debit),
                        net_amount: netAmountYearly
                    }
                };
                const [errFour, _] = await activityListUpdateMasterData({
                    activity_id: ledgerActivityID,
                    activity_master_data: JSON.stringify(ledgerInlineData)
                }, organizationID);
            } catch (error) {
                logger.silly("Error calculating net: %j", error);
            }

            // Monthly summary transaction insert
            try {
                await activityMonthlySummaryTransactionInsert({
                    ...request,
                    activity_id: ledgerActivityID,
                    entity_date_1: startOfMonth,
                    entity_decimal_1: (transactionTypeID === 1) ? transactionAmount : 0,
                    entity_decimal_2: (transactionTypeID === 2) ? transactionAmount : 0,
                    entity_decimal_3: netAmountMonthly
                }, organizationID, accountID, workforceID)
            } catch (error) {
                logger.silly("activityMonthlySummaryTransactionInsert | Error: %j", error);
            }

            // Quarterly summary transaction insert
            try {
                await activityQuarterlySummaryTransactionInsert({
                    ...request,
                    activity_id: ledgerActivityID,
                    entity_date_1: startOfQuarter,
                    entity_decimal_1: (transactionTypeID === 1) ? transactionAmount : 0,
                    entity_decimal_2: (transactionTypeID === 2) ? transactionAmount : 0,
                    entity_decimal_3: netAmountQuarterly
                }, organizationID, accountID, workforceID)
            } catch (error) {
                logger.silly("activityQuarterlySummaryTransactionInsert | Error: %j", error);
            }

            // Yearly summary transaction insert
            try {
                await activityYearlySummaryTransactionInsert({
                    ...request,
                    activity_id: ledgerActivityID,
                    entity_date_1: startOfYear,
                    entity_decimal_1: (transactionTypeID === 1) ? transactionAmount : 0,
                    entity_decimal_2: (transactionTypeID === 2) ? transactionAmount : 0,
                    entity_decimal_3: netAmountYearly
                }, organizationID, accountID, workforceID)
            } catch (error) {
                logger.silly("activityYearlySummaryTransactionInsert | Error: %j", error);
            }
        }
    }

    // Activity Monthly Summary Transaction Insert
    async function activityMonthlySummaryTransactionInsert(request, organizationID, accountID, workforceID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.monthly_summary_id || 38, // Monthly - 38 Account - Monthly Net
            request.activity_id,
            workforceID,
            accountID,
            organizationID,
            request.entity_date_1,
            request.entity_datetime_1,
            request.entity_tinyint_1,
            request.entity_bigint_1,
            request.entity_double_1,
            request.entity_decimal_1,
            request.entity_decimal_2,
            request.entity_decimal_3,
            request.entity_text_1 || '',
            request.entity_text_2 || '',
            request.location_latitude,
            request.location_longitude,
            request.location_gps_accuracy,
            request.location_gps_enabled,
            request.location_address || '',
            request.location_datetime || util.getCurrentUTCTime(),
            request.device_manufacturer_name || '',
            request.device_model_name || '',
            request.device_os_id,
            request.device_os_name || '',
            request.device_os_version || '',
            request.device_app_version || '',
            request.device_api_version || '',
            request.log_asset_id || request.asset_id,
            request.message_unique_id,
            request.log_retry || 0,
            request.log_offline || 0,
            util.getCurrentUTCTime(), // transaction datetime
            util.getCurrentUTCTime() // log datetime
        );
        const queryString = util.getQueryString('ds_v1_activity_monthly_summary_transaction_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    // Activity Quarterly Summary Transaction Insert
    async function activityQuarterlySummaryTransactionInsert(request, organizationID, accountID, workforceID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.quarterly_summary_id || 1, // Quarterly - 1 Account - Quarterly Net
            request.activity_id,
            workforceID,
            accountID,
            organizationID,
            request.entity_date_1,
            request.entity_datetime_1,
            request.entity_tinyint_1,
            request.entity_bigint_1,
            request.entity_double_1,
            request.entity_decimal_1,
            request.entity_decimal_2,
            request.entity_decimal_3,
            request.entity_text_1 || '',
            request.entity_text_2 || '',
            request.location_latitude,
            request.location_longitude,
            request.location_gps_accuracy,
            request.location_gps_enabled,
            request.location_address || '',
            request.location_datetime || util.getCurrentUTCTime(),
            request.device_manufacturer_name || '',
            request.device_model_name || '',
            request.device_os_id,
            request.device_os_name || '',
            request.device_os_version || '',
            request.device_app_version || '',
            request.device_api_version || '',
            request.log_asset_id || request.asset_id,
            request.message_unique_id,
            request.log_retry || 0,
            request.log_offline || 0,
            util.getCurrentUTCTime(), // transaction datetime
            util.getCurrentUTCTime() // log datetime
        );
        const queryString = util.getQueryString('ds_v1_activity_quarterly_summary_transaction_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    // Activity Yearly Summary Transaction Insert
    async function activityYearlySummaryTransactionInsert(request, organizationID, accountID, workforceID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.quarterly_summary_id || 1, // Yearly - 1 Account - Yearly Net
            request.activity_id,
            workforceID,
            accountID,
            organizationID,
            request.entity_date_1,
            request.entity_datetime_1,
            request.entity_tinyint_1,
            request.entity_bigint_1,
            request.entity_double_1,
            request.entity_decimal_1,
            request.entity_decimal_2,
            request.entity_decimal_3,
            request.entity_text_1 || '',
            request.entity_text_2 || '',
            request.location_latitude,
            request.location_longitude,
            request.location_gps_accuracy,
            request.location_gps_enabled,
            request.location_address || '',
            request.location_datetime || util.getCurrentUTCTime(),
            request.device_manufacturer_name || '',
            request.device_model_name || '',
            request.device_os_id,
            request.device_os_name || '',
            request.device_os_version || '',
            request.device_app_version || '',
            request.device_api_version || '',
            request.log_asset_id || request.asset_id,
            request.message_unique_id,
            request.log_retry || 0,
            request.log_offline || 0,
            util.getCurrentUTCTime(), // transaction datetime
            util.getCurrentUTCTime() // log datetime
        );
        const queryString = util.getQueryString('ds_v1_activity_yearly_summary_transaction_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    // Activity Timeline Transaction Insert
    async function activityTimelineTransactionInsertV6(request, streamTypeID, organizationID, accountID, workforceID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.asset_id,
            workforceID,
            accountID,
            organizationID,
            streamTypeID,
            request.entity_type_id,
            request.entity_datetime_1,
            request.entity_datetime_2,
            request.entity_text_1,
            request.entity_text_2,
            request.entity_text_3,
            request.data_entity_inline,
            request.entity_decimal_1,
            request.entity_decimal_2,
            request.entity_tinyint_1,
            request.entity_tinyint_2,
            request.entity_bigint_1,
            request.entity_bigint_2,
            request.form_transaction_id,
            request.form_id,
            request.data_type_id,
            request.location_latitude,
            request.location_longitude,
            request.location_gps_accuracy,
            request.location_gps_enabled,
            request.location_address,
            request.location_datetime,
            request.device_manufacturer_name,
            request.device_model_name,
            request.device_os_id,
            request.device_os_name,
            request.device_os_version,
            request.device_app_version,
            request.device_api_version,
            request.log_asset_id || request.asset_id,
            request.message_unique_id,
            request.log_retry || 0,
            request.log_offline || 0,
            util.getCurrentUTCTime(), // request.transaction_datetime
            util.getCurrentUTCTime(), // request.log_datetime
            request.data_activity_id || 0,
            request.trigger_bot_id,
            request.trigger_bot_operation_id,
            request.trigger_form_id || 0,
            request.trigger_form_transaction_id || 0,
        );
        const queryString = util.getQueryString('ds_v1_6_activity_timeline_transaction_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    // Update ledger inline data stored in the `master_data` in the `activity_list` table
    async function activityListUpdateMasterData(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            organizationID,
            request.activity_master_data
        );
        const queryString = util.getQueryString('ds_p1_activity_list_update_master_data', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

}

module.exports = LedgerOpsService;