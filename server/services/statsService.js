function StatsService(objCollection) {
    let db = objCollection.db;
    // var cacheWrapper = objCollection.cacheWrapper;
    // var activityCommonService = objCollection.activityCommonService;
    let util = objCollection.util;
    // var forEachAsync = objCollection.forEachAsync;
    // var queueWrapper = objCollection.queueWrapper;
    // var activityPushService = objCollection.activityPushService;
    // var responseactivityData = {}

    this.getSignUpCountStats = function (request, callback) {

        request.date_start = util.replaceDefaultDatetime(request.date_start);

        request.hasOwnProperty('date_end') ?
            request.date_end = util.getFormatedLogDatetime(request.date_end) : request.date_end = util.getCurrentUTCTime();

        // flag = 0  => total count of assets created, for the given date range
        // flag = 11 => total count of assets created GROUP BY country code, for the given date range
        // flag = 12 => total count of assets created GROUP BY OS, for the given date range
        // flag = 13 => total count of assets created GROUP BY Date, for the given date range
        let flag = 0; // Default

        request.flag_breakup_country = Number(request.flag_breakup_country) || 0;
        request.flag_breakup_os = Number(request.flag_breakup_os) || 0;
        request.flag_breakup_date = Number(request.flag_breakup_date) || 0;

        // Do not allow the client to set multiple errors
        if (request.flag_breakup_country + request.flag_breakup_os + request.flag_breakup_date > 1) {
            // console.log("Sum: ", request.flag_breakup_country + request.flag_breakup_os + request.flag_breakup_date);
            let errorMessage = "You can only set one flag_breakup_* at a time."
            return callback(new Error("Client attempting to set multiple 'flag_breakup_*' flags"), {
                errorMessage
            }, -3601);
        }

        // Set flag
        // 11 => total assets count GROUPed BY COUNTRY CODE
        // 12 => total assets count GROUPed BY OS
        // 13 => total assets count GROUPed BY DATE

        if (request.flag_breakup_country === 1) flag = 11;
        else if (request.flag_breakup_os === 1) flag = 12;
        else if (request.flag_breakup_date === 1) flag = 13;


        // Set sort flag
        // 0 => asset_id
        // 1 => asset_first_name | Default
        // 2 => operating_asset_first_name
        // 3 => operating_asset_phone_country_code
        let sort_flag = 1

        // 
        assetListSelectWorldDeskStats(request, flag, sort_flag)
            .then(function (data) {
                callback(false, data, 200);

            }, function (err) {
                callback(err, false, -9998);

            });
    };

    this.getListOfSignUps = function (request, callback) {
        // Start date
        request.date_start = util.replaceDefaultDatetime(request.date_start);
        // End date
        request.hasOwnProperty('date_end') ?
            request.date_end = util.getFormatedLogDatetime(request.date_end) : request.date_end = util.getCurrentUTCTime();

        // Set flag
        // 101 => asset list in [A]scending order based on  p_sort_flag
        // 102 => asset list in [D]escending order based on p_sort_flag
        let flag = 102 // Default

        // Set sort flag
        // 0 => asset_id
        // 1 => asset_first_name | Default
        // 2 => operating_asset_first_name
        // 3 => operating_asset_phone_country_code
        // 4 => asset_linked_status_datetime
        // 5 => asset_created_datetime
        let sort_flag = 5

        // 
        assetListSelectWorldDeskStats(request, flag, sort_flag)
            .then(function (data) {
                callback(false, data, 200);

            }, function (err) {
                callback(err, false, -9998);

            });

    }

    // Route: /stats/timeline/list
    this.getTimelineList = function (request, callback) {
        request.date_start = util.replaceDefaultDatetime(request.date_start);

        request.hasOwnProperty('date_end') ?
            request.date_end = util.getFormatedLogDatetime(request.date_end) : request.date_end = util.getCurrentUTCTime();

        // Set flag to list timeline txn data in 
        // 0 => [A]scending order based on the field set in sort_flag
        // 1 => [D]escending order based on the field set in sort_flag
        let flag = 1 // Default

        // Set sort flag
        // 0 => timeline_transaction_id
        let sort_flag = 0

        // Ensure that only one of flag_timeline_activity and flag_timeline_asset is set
        request.flag_timeline_activity = Number(request.flag_timeline_activity) || 0;
        request.flag_timeline_asset = Number(request.flag_timeline_asset) || 0;

        // Do not allow the client to set multiple errors
        if (request.flag_timeline_activity + request.flag_timeline_asset > 1) {
            let errorMessage = "You can only set one flag_timeline_* at a time."
            return callback(new Error("Client attempting to set multiple 'flag_timeline_*' flags"), {
                errorMessage
            }, -3601);
        }
        // If none of flag_timeline_*'s set, set `asset_timeline_transaction` as the default
        if ((request.flag_timeline_activity + request.flag_timeline_asset) === 0) {
            request.flag_timeline_asset = 1;
        }

        // Fetch data
        if (request.flag_timeline_asset === 1) {
            assetTimelineTransactionSelectAssetDates(request, flag, sort_flag)
                .then(function (data) {
                    callback(false, data, 200);

                }, function (err) {
                    callback(err, false, -9998);

                });

        } else if (request.flag_timeline_activity === 1) {
            activityTimelineTransactionSelectAssetDates(request, flag, sort_flag)
                .then(function (data) {
                    callback(false, data, 200);

                }, function (err) {
                    callback(err, false, -9998);

                });

        }

    }

    // Utility functions | DB queries
    // 
    function assetListSelectWorldDeskStats(request, flag, sort_flag) {
        return new Promise((resolve, reject) => {

            // IN p_flag TINYINT(4), IN p_sort_flag TINYINT(4), IN p_datetime_start DATETIME, 
            // IN p_datetime_end DATETIME, IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
            let paramsArr = new Array(
                flag,
                sort_flag,
                request.date_start,
                request.date_end,
                request.page_start || 0, // p_start_from
                request.page_limit || 50 // p_limit_value
            );
            let queryString = util.getQueryString('ds_p1_asset_list_select_worlddesk_stats', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (!err) ? resolve(data): reject(err);
                });
            }
        });
    }

    // [1] Retrieving an asset's asset_timeline_transaction data for a given date range
    function assetTimelineTransactionSelectAssetDates(request, flag, sort_flag) {
        return new Promise((resolve, reject) => {

            // IN p_asset_id bigint(20), IN p_datetime_start DATETIME, IN p_datetime_end DATETIME, 
            // IN p_flag TINYINT(4), IN p_sort_flag TINYINT(4), IN p_start_from SMALLINT(6), 
            // IN p_limit_value TINYINT(4)
            let paramsArr = new Array(
                request.asset_id,
                request.date_start,
                request.date_end,
                flag,
                sort_flag,
                request.page_start || 0, // p_start_from
                request.page_limit || 50 // p_limit_value
            );
            let queryString = util.getQueryString('ds_p1_asset_timeline_transaction_select_asset_dates', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (!err) ? resolve(data): reject(err);
                });
            }
        });
    };

    // [2] Retrieving an asset's activity_timeline_transaction data for a given date range
    function activityTimelineTransactionSelectAssetDates(request, flag, sort_flag) {
        return new Promise((resolve, reject) => {

            // IN p_asset_id bigint(20), IN p_datetime_start DATETIME, IN p_datetime_end DATETIME, 
            // IN p_flag TINYINT(4), IN p_sort_flag TINYINT(4), IN p_start_from SMALLINT(6), 
            // IN p_limit_value TINYINT(4)
            let paramsArr = new Array(
                request.asset_id,
                request.date_start,
                request.date_end,
                flag,
                sort_flag,
                request.page_start || 0, // p_start_from
                request.page_limit || 50 // p_limit_value
            );
            let queryString = util.getQueryString('ds_p1_activity_timeline_transaction_select_asset_dates', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (!err) ? resolve(data): reject(err);
                });
            }
        });
    };

    // [VODAFONE] Get breakdown for count of orders on the basis of status of the order
    this.activityListSelectFormCountActivityStatus = function (request, callback) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_form_id BIGINT(20), IN p_start_datetime DATETIME, IN p_end_datetime DATETIME

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id,
            request.date_start,
            request.date_end
        );
        let queryString = util.getQueryString('ds_p1_1_activity_list_select_form_count_activity_status', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data, 200): callback(true, {}, -9998);
            });
        }
    };

    // [VODAFONE] Get breakdown for count of orders on the basis of status of the order
    this.activityFormTransactionSelectVodafoneFormValue = function (request, callback) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_form_id BIGINT(20), IN p_start_datetime DATETIME, IN p_end_datetime DATETIME
        
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id,
            request.date_start,
            request.date_end
        );
        let queryString = util.getQueryString('ds_p1_1_activity_form_transaction_select_vodafone_form_value', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data, 200): callback(true, {}, -9998);
            });
        }
    };

    // [VODAFONE] Get the breakdown for order value summation on the basis of order 
    // status and order creation datetime
    this.activityFormTransactionSelectVodafoneFormValueDay = function (request, callback) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_form_id BIGINT(20), IN p_start_datetime DATETIME, IN p_end_datetime DATETIME
        
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id,
            request.date_start,
            request.date_end
        );
        let queryString = util.getQueryString('ds_p1_1_activity_form_transaction_select_vodafone_form_value_day', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data, 200): callback(true, {}, -9998);
            });
        }
    };

    // [VODAFONE] Get the breakdown for order value summation on the basis of order 
    // status and order creation datetime
    this.activityListSelectFormCountActivityStatusDay = function (request, callback) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_form_id BIGINT(20), IN p_start_datetime DATETIME, IN p_end_datetime DATETIME

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_id,
            request.date_start,
            request.date_end
        );
        let queryString = util.getQueryString('ds_p1_1_activity_list_select_form_count_activity_status_day', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data, 200): callback(true, {}, -9998);
            });
        }
    };
    
    // [VODAFONE] Get month on month values for the array of summary ids
    this.assetMonthlySummaryTransactionSelectFlag = function (request, flag, callback) {
        // IN p_asset_id BIGINT(20), IN p_operating_asset_id BIGINT(20), IN p_organization_id 
        // BIGINT(20), IN p_flag SMALLINT(6), IN p_data_entity_date_1 DATETIME

        let paramsArr = new Array(
            request.asset_id || 0,
            request.operating_asset_id || 0,
            request.organization_id,
            flag, // p_flag
            request.month_start_date // p_data_entity_date_1 => YYYY-MM-DD
        );
        let queryString = util.getQueryString('ds_p1_asset_monthly_summary_transaction_select_flag', paramsArr);
        if (queryString !== '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? callback(false, data, 200): callback(true, {}, -9998);
            });
        }
    };
}

module.exports = StatsService;
