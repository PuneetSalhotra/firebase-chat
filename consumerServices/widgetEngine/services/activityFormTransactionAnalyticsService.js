/**
 * author: SBK
 */
class ActivityFormTransactionAnalytics {
    constructor(args) {
        this.objCollection = args.objCollection;
    }

    getAggregateByDateRange(data) {
        /*"ds_p1_activity_form_transaction_select_field_sum_datetime
         IN p_form_id BIGINT(20), IN p_field_id BIGINT(20),  IN p_data_type_id SMALLINT(6), IN p_access_level_id SMALLINT(6), 
         IN p_start_datetime DATETIME, IN p_end_datetime DATETIME, IN p_activity_id BIGINT(20), IN p_activity_type_id BIGINT(20), 
         IN p_asset_id BIGINT(20), IN p_asset_type_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), 
         IN p_organization_id BIGINT(20)"*/
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.form_id,
                    data.entity_id,
                    data.entity_data_type_id,
                    data.widget_access_level_id,
                    data.widget_aggregate_id,
                    data.start,
                    data.end,
                    data.activity_id,
                    data.activity_type_category_id,
                    data.asset_id,
                    data.asset_type_id,
                    data.workforce_id,
                    data.account_id,
                    data.organization_id
                    );
            var queryString = this.objCollection.util.getQueryString('ds_p1_activity_form_transaction_select_field_aggr_dt', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(1, queryString, {}, function (err, data) {
                if (err)
                    return reject();
                /**total_sum */
                return resolve(data);
            });
        });
    }

    getCountForMonth(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.form_id,
                    data.widget_access_level_id,
                    data.start,
                    data.end,
                    data.activity_id,
                    data.activity_type_category_id,
                    data.asset_id,
                    data.asset_type_id,
                    data.workforce_id,
                    data.account_id,
                    data.organization_id
                    );
            /*"    "ds_p1_activity_form_transaction_analytics_select_form_count_dt
             IN p_form_id BIGINT(20), IN p_access_level_id TINYINT(4), IN p_start_datetime DATETIME, IN p_end_datetime DATETIME, I
             N p_activity_id BIGINT(20),
             IN p_activity_type_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_asset_type_id BIGINT(20), 
             IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20)
             "
             */
            var queryString = this.objCollection.util.getQueryString('ds_p1_activity_form_transaction_select_form_count_dt', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(1, queryString, {}, function (err, data) {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }

    getByTransactionField(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.organization_id,
                    data.form_transaction_id,
                    data.form_id,
                    data.entity_id
                    );
            /*"ds_p1_activity_form_transaction_analytics_select_trans_field
             IN p_form_transaction_id BIGINT(20), IN p_form_id BIGINT(20), IN p_field_id1 BIGINT(20)
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_activity_form_transaction_select_trans_field', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(1, queryString, {}, function (err, data) {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }

    getFormTransactionsByChoice(data) {
        return new Promise((resolve, reject) => {
            const limit = 50;
            let rows = [];
            var self = this;
            function loop(opts) {
                var paramsArr = new Array(
                        data.form_id,
                        data.entity_id,
                        data.choice,
                        data.start,
                        data.end,
                        data.widget_access_level_id,
                        data.asset_id,
                        data.activity_id,
                        data.workforce_id,
                        data.account_id,
                        data.organization_id,
                        opts.startFrom,
                        limit
                        );

                var queryString = self.objCollection.util.getQueryString('ds_p1_activity_form_transaction_select_fld_choice', paramsArr);
                if (queryString === '')
                    return reject();
                self.objCollection.db.executeQuery(1, queryString, {}, function (err, data) {
                    if (err)
                        return reject(err);
                    rows = rows.concat(data);
                    if (data.length < limit)
                        return resolve(rows);
                    loop({startFrom: rows.length + 1});
                });
            }

            loop({startFrom: 0});

            /* "ds_p1_activity_form_transaction_analytics_select_fld_choice
             IN p_form_id BIGINT(20), IN p_field_id1 BIGINT(20), IN p_choice VARCHAR(300), IN p_start_datetime DATETIME, 
             IN p_end_datetime DATETIME, IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
             " */

        });
    }

    getCountByTransactionFieldChoice(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.organization_id,
                    data.account_id,
                    data.workforce_id,
                    data.asset_id,
                    data.activity_id,
                    data.widget_access_level_id,
                    data.form_id,
                    data.entity_id,
                    data.choice,
                    data.start,
                    data.end
                    );
            /*"ds_p1_activity_form_transaction_analytics_select_fld_choice_cnt
             IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
             IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20), 
             IN p_activity_id BIGINT(20), IN p_access_level_id BIGINT(20),
             IN p_form_id BIGINT(20), IN p_field_id BIGINT(20),
             IN p_choice VARCHAR(300), IN p_start_datetime DATETIME, 
             IN p_end_datetime DATETIME
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_activity_form_transaction_select_fld_choice_cnt', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(1, queryString, {}, function (err, data) {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }

}

module.exports = ActivityFormTransactionAnalytics;