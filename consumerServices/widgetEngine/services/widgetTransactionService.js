/**
 * author: SBK
 */
class WidgetTransactionService {
    constructor(args) {
        this.objCollection = args.objCollection;
    }

    getByPeriodFlag(lookupData) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    lookupData.widget_id,
                    lookupData.date,
                    lookupData.period_flag
                    );
            /*"ds_p1_widget_transaction_select_widget_flag
             IN p_widget_id BIGINT(20), IN p_form_submission_date DATE, IN p_period_flag TINYINT(4)"*/
            /*"p_form_submission_date = DATE(IST(form_submission_datetime IN UTC))
             Asseme the widget timezone is IST
             p_period_flag = 0"*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_select_widget_flag', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(1, queryString, {}, function (err, data) {
                if (err)
                    return reject();
                /*idWidgetTransaction*/
                return resolve(data);
            });
        });
    }

    create(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_id,
                    data.asset_id,
                    data.organization_id,
                    data.date,
                    data.sum,
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            /* "ds_p1_widget_transaction_insert_single_dimension_aggregate
             IN p_widget_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), 
             IN p_form_submission_date DATE, IN p_submitted_field_value_sum DOUBLE(16,4), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_insert_single_dimension_aggregate', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject();
                return resolve();
            });
        });
    }

    update(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.organization_id,
                    data.widget_transaction_id,
                    data.date,
                    data.sum
                    );
            /* "ds_p1_widget_transaction_update_single_dimension_aggregate
             IN p_organization_id BIGINT(20), IN p_widget_transaction_id BIGINT(20), IN p_form_submission_date DATE, 
             IN p_submitted_field_value_sum DOUBLE(16,4)
             " */
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_update_single_dimension_aggregate', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject();
                return resolve();
            });
        });
    }

    getByDayAndFields(lookupData) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    lookupData[0].widget_id,
                    lookupData[0].date,
                    lookupData[0].entity_id,
                    lookupData[1].entity_id,
                    lookupData[0].period_flag
                    );
            /*"ds_p1_widget_transaction_select_widget_field_flag
             IN p_widget_id BIGINT(20), IN p_form_submission_date DATE, IN p_field_id1 BIGINT(20), 
             IN p_field_id2 BIGINT(20), IN p_period_flag TINYINT(4)
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_select_widget_field_flag', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(1, queryString, {}, function (err, data) {
                if (err)
                    return reject();
                return resolve(data);
            });
        });
    }

    createMultiDimAggregare(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_id,
                    data.asset_id,
                    data.organization_id,
                    data.date,
                    data.index,
                    data.sum,
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            /* "ds_p1_widget_transaction_insert_multi_dimension_aggregate
             IN p_widget_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_form_submission_date DATE,
             IN p_index_value TINYINT(4),  IN p_submitted_field_value_sum DOUBLE(16,4), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_insert_multi_dimension_aggregate', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject();
                return resolve();
            });
        });
    }

    updateMultiDimAggregate(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_transaction_id,
                    data.organization_id,
                    data.date,
                    data.index,
                    data.sum,
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            /* ""ds_p1_widget_transaction_update_multi_dimension_aggregate
             IN p_widget_transaction_id BIGINT(20),IN p_organization_id BIGINT(20), IN p_form_submission_date DATE, 
             IN p_index_value TINYINT(4),  IN p_sum_value DOUBLE(16,4), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_update_multi_dimension_aggregate', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject();
                return resolve();
            });
        });
    }

    createFrequencyDistribution(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_id,
                    data.asset_id,
                    data.organization_id,
                    data.date,
                    data.count,
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            /* "ds_p1_widget_transaction_insert_form_submission_count
             IN p_widget_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), 
             IN p_form_submission_date DATE, IN p_submitted_form_count BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_insert_form_submission_count', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject();
                return resolve();
            });
        });
    }

    updateFrequencyDistribution(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_transaction_id,
                    data.widget_id,
                    data.date,
                    data.count,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            /* "ds_p1_widget_transaction_update_form_submission_count
             IN p_widget_transaction_id BIGINT(20), IN p_widget_id BIGINT(20), 
             IN p_form_submission_date DATE, IN p_widget_form_count BIGINT(20), IN p_log_datetime DATETIME
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_update_form_submission_count', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }

    getByChoice(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_id,
                    data.date,
                    data.choice,
                    data.period_flag
                    );
            /*"ds_p1_widget_transaction_select_widget_choice_flag
             IN p_widget_id BIGINT(20), IN p_form_submission_date DATE, IN p_choice DOUBLE(16,4), IN p_period_flag TINYINT(4)"*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_select_widget_choice_flag', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(1, queryString, {}, function (err, data) {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }

    createMultiValueVisualization(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_id,
                    data.asset_id,
                    data.organization_id,
                    data.date,
                    data.sum,
                    data.choice,
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            /* ""ds_p1_widget_transaction_insert_multi_value_visualization
             IN p_widget_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_form_submission_date DATE, 
             IN p_submitted_field_value_sum DOUBLE(16,4),  IN p_submitted_choice VARCHAR(300), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_insert_multi_value_visualization', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }

    updateMultiValueVisualization(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.organization_id,
                    data.widget_transaction_id,
                    data.date,
                    data.choice,
                    data.sum
                    );
            /* "ds_p1_widget_transaction_update_multi_value_visualization
             IN p_organization_id BIGINT(20), IN p_widget_transaction_id BIGINT(20), 
             IN p_form_submission_date DATE, IN p_choice VARCHAR(300), IN p_sum_value DOUBLE(16,4)
             "
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_update_multi_value_visualization', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }
}

module.exports = WidgetTransactionService;
//util.getCurrentUTCTime()