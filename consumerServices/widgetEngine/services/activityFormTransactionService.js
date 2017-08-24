class ActivityFormTransaction {
    constructor() {

    }

    getSumByDay(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.form_id,
                request.field_id,
                request.data_type_id

            );
            /*"ds_p1_activity_form_transaction_select_field_sum_datetime
IN p_form_id BIGINT(20), IN p_field_id BIGINT(20),  IN p_data_type_id SMALLINT(6), IN p_access_level_id SMALLINT(6), IN p_start_datetime DATETIME, IN p_end_datetime DATETIME, IN p_activity_id BIGINT(20), IN p_activity_type_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_asset_type_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20)"*/
/*"field_id = widget_entity2_id,
data_type_id = widget_entity2_data_type_id
p_access_level_id = 5 (Asset Level)
p_start_datetime = Start datetime of the day based on the widget timezone
p_end_datetime  = End datetime of the day based on the widget timezone
(Form Submission Datetime is in UTC. Calculate the start datetime and end datetime on the widget timezone)
Ex: Say widget timezone is IST )UTC+5.30 Hrs)
Form_submission_datetime = '2017-08-08 18:31:00' IN UTC
StartDatetime = '2017-08-08 18:30:00'
EndDatetime = '2017-08-09 18:29:59'
activity_id = 0
activity_type_id = 0
asset_id = AssetId from the request
asset_type_id = 0
workforce_id = workforce_id from the request
account_id = account_id from the request
organization_id  = organization_id from the request
"*/
            var queryString = util.getQueryString('ds_p1_activity_form_transaction_select_field_sum_datetime', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                /**total_sum */
                return resolve(data);
            });
        });
    }

    getCountByMonth(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.form_id,
                request.field_id,
                request.data_type_id

            );
            /*"    "ds_p1_activity_form_transaction_select_form_count_level_dt
IN p_form_id BIGINT(20), IN p_access_level_id TINYINT(4), IN p_start_datetime DATETIME, IN p_end_datetime DATETIME, IN p_activity_id BIGINT(20),
IN p_activity_type_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_asset_type_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20)
"
*/
            var queryString = util.getQueryString('ds_p1_activity_form_transaction_select_form_count_level_dt', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                return resolve();
            });
        });
    }

    getTransactionField(request){
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.form_id
            );
            /*"ds_p1_activity_form_transaction_select_transaction_field
IN p_form_transaction_id BIGINT(20), IN p_form_id BIGINT(20), IN p_field_id1 BIGINT(20)
" */
            var queryString = util.getQueryString('ds_p1_activity_form_transaction_select_transaction_field', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                return resolve();
            });
        });
    }

    getByField(request){
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.form_id
            );
            /* "ds_p1_activity_form_transaction_select_field_choice_transactions
IN p_form_id BIGINT(20), IN p_field_id1 BIGINT(20), IN p_choice VARCHAR(300), IN p_start_datetime DATETIME, IN p_end_datetime DATETIME, IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
" */
            var queryString = util.getQueryString('ds_p1_activity_form_transaction_select_field_choice_transactions', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                return resolve();
            });
        });
    }
    
}