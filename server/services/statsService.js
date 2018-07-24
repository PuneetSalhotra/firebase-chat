function StatsService(objCollection) {
    var db = objCollection.db;
    // var cacheWrapper = objCollection.cacheWrapper;
    // var activityCommonService = objCollection.activityCommonService;
    var util = objCollection.util;
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
        let flag = 101 // Default

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

    }

    // Route: /stats/timeline/list
    this.getTimelineList = function (request, callback) {
        request.date_start = util.replaceDefaultDatetime(request.date_start);

        request.hasOwnProperty('date_end') ?
            request.date_end = util.getFormatedLogDatetime(request.date_end) : request.date_end = util.getCurrentUTCTime();



    }

    // Utility functions | DB queries
    // 
    function assetListSelectWorldDeskStats(request, flag, sort_flag) {
        return new Promise((resolve, reject) => {

            // IN p_flag TINYINT(4), IN p_sort_flag TINYINT(4), IN p_datetime_start DATETIME, 
            // IN p_datetime_end DATETIME, IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
            var paramsArr = new Array(
                flag,
                sort_flag,
                request.date_start,
                request.date_end,
                request.page_start || 0, // p_start_from
                request.page_limit || 50 // p_limit_value
            );
            var queryString = util.getQueryString('ds_p1_asset_list_select_worlddesk_stats', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (!err) ? resolve(data): reject(err);
                });
            }
        });
    }

    // Retrieving an asset's timeline_transaction data for a given date range
    function assetTimelineTransactionSelectAssetDates (request, flag, sort_flag) {
        return new Promise((resolve, reject) => {

            // IN p_asset_id bigint(20), IN p_datetime_start DATETIME, IN p_datetime_end DATETIME, 
            // IN p_flag TINYINT(4), IN p_sort_flag TINYINT(4), IN p_start_from SMALLINT(6), 
            // IN p_limit_value TINYINT(4)
            var paramsArr = new Array(
                request.asset_id,
                request.datetime_start,
                request.datetime_end,
                flag,
                sort_flag,
                request.page_start || 0, // p_start_from
                request.page_limit || 50 // p_limit_value
            );
            var queryString = util.getQueryString('ds_p1_asset_timeline_transaction_select_asset_dates', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (!err) ? resolve(data): reject(err);
                });
            }
        });
    };
}

module.exports = StatsService;