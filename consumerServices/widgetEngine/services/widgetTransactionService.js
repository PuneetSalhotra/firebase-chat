class WidgetTransactionService {
    constructor() {

    }

    getByDay(request){
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.form_id
            );
            /*"ds_p1_widget_transaction_select_widget_flag
IN p_widget_id BIGINT(20), IN p_form_submission_date DATE, IN p_period_flag TINYINT(4)"*/
/*"p_form_submission_date = DATE(IST(form_submission_datetime IN UTC))
Asseme the widget timezone is IST
p_period_flag = 0"*/
            var queryString = util.getQueryString('ds_p1_widget_transaction_select_widget_flag', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                /*idWidgetTransaction*/
                return resolve(data);
            });
        });
    }

    create(reuest) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.form_id
            );
            /* "ds_p1_widget_transaction_insert_single_dimension_aggregate
IN p_widget_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_form_submission_date DATE, IN p_submitted_field_value_sum DOUBLE(16,4), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
"*/
            var queryString = util.getQueryString('ds_p1_widget_transaction_insert_single_dimension_aggregate', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                return resolve();
            });
        });
    }

    update(reuest) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.form_id
            );
            /* "ds_p1_widget_transaction_update_single_dimension_aggregate
IN p_organization_id BIGINT(20), IN p_widget_transaction_id BIGINT(20), IN p_form_submission_date DATE, IN p_submitted_field_value_sum DOUBLE(16,4)
" */
            var queryString = util.getQueryString('ds_p1_widget_transaction_update_single_dimension_aggregate', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                return resolve();
            });
        });
    }

    createMultiDimAggregare(reuest) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.form_id
            );
            /* "ds_p1_widget_transaction_insert_multi_dimension_aggregate
IN p_widget_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_form_submission_date DATE,
IN p_index_value TINYINT(4),  IN p_submitted_field_value_sum DOUBLE(16,4), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
"*/
            var queryString = util.getQueryString('ds_p1_widget_transaction_insert_multi_value_visualization', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                return resolve();
            });
        });
    }

    updateMultiDimAggregate(reuest) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.form_id
            );
            /* ""ds_p1_widget_transaction_update_multi_dimension_aggregate
IN p_widget_transaction_id BIGINT(20),IN p_organization_id BIGINT(20), IN p_form_submission_date DATE, IN p_index_value TINYINT(4),  IN p_sum_value DOUBLE(16,4), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
"*/
            var queryString = util.getQueryString('ds_p1_widget_transaction_update_multi_dimension_aggregate', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                return resolve();
            });
        });
    }

    getByChoice(request){
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.form_id
            );
            /*"ds_p1_widget_transaction_select_widget_choice_flag
IN p_widget_id BIGINT(20), IN p_form_submission_date DATE, IN p_choice DOUBLE(16,4), IN p_period_flag TINYINT(4)"*/
            var queryString = util.getQueryString('ds_p1_widget_transaction_select_widget_choice_flag', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                return resolve();
            });
        });
    }

    createMultiValueVisualization(reuest) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.form_id
            );
            /* ""ds_p1_widget_transaction_insert_multi_value_visualization
IN p_widget_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_form_submission_date DATE, IN p_submitted_field_value_sum DOUBLE(16,4),  IN p_submitted_choice VARCHAR(300), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
"*/
            var queryString = util.getQueryString('ds_p1_widget_transaction_insert_multi_value_visualization', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                return resolve();
            });
        });
    }

    updateMultiValueVisualization(reuest) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.form_id
            );
            /* "ç
IN p_organization_id BIGINT(20), IN p_widget_transaction_id BIGINT(20), IN p_form_submission_date DATE, IN p_choice VARCHAR(300), IN p_sum_value DOUBLE(16,4)
"*/
            var queryString = util.getQueryString('ds_p1_widget_transaction_insert_multi_value_visualization', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                return resolve();
            });
        });
    }
}