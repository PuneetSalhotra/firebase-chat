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
                    lookupData.period_flag,
                    lookupData.widget_access_level_id,
                    lookupData.asset_id,
                    lookupData.activity_id,
                    lookupData.workforce_id,
                    lookupData.account_id,
                    lookupData.organization_id
                    );
            /*"ds_p1_1_widget_transaction_select_widget_flag
             IN p_widget_id BIGINT(20), IN p_form_submission_date DATE, IN p_period_flag TINYINT(4), IN p_widget_access_level_id SMALLINT(6), IN p_asset_id BIGINT(20), IN p_activity_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20)"*/
            /*"p_form_submission_date = DATE(IST(form_submission_datetime IN UTC))
             Asseme the widget timezone is IST
             p_period_flag = 0"*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_1_widget_transaction_select_widget_flag', paramsArr);
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
            var queryString = this.objCollection.util.getQueryString('ds_p1_1_widget_transaction_insert_single_dimension_aggregate', paramsArr);
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
                    data.widget_id,
                    data.widget_transaction_id,
                    data.date,
                    data.sum,
                    data.asset_id
                    );
            /* "ds_p1_widget_transaction_update_single_dimension_aggregate
             IN p_organization_id BIGINT(20), IN p_widget_transaction_id BIGINT(20), IN p_form_submission_date DATE, 
             IN p_submitted_field_value_sum DOUBLE(16,4)
             " */
            var queryString = this.objCollection.util.getQueryString('ds_p1_1_widget_transaction_update_single_dimension_aggregate', paramsArr);
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
                    lookupData[2].entity_id,
                    lookupData[0].period_flag,
                    lookupData[0].widget_access_level_id,
                    lookupData[0].asset_id,
                    lookupData[0].activity_id,
                    lookupData[0].workforce_id,
                    lookupData[0].account_id,
                    lookupData[0].organization_id
                    );
            /*"ds_p1_widget_transaction_select_widget_field_flag
             IN p_widget_id BIGINT(20), IN p_form_submission_date DATE, IN p_field_id1 BIGINT(20), 
             IN p_field_id2 BIGINT(20), IN p_period_flag TINYINT(4)
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_1_widget_transaction_select_widget_field_flag', paramsArr);
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
            var queryString = this.objCollection.util.getQueryString('ds_p1_1_widget_transaction_insert_multi_dimension_aggregate', paramsArr);
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
                    data.widget_id,
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
            var queryString = this.objCollection.util.getQueryString('ds_p1_1_widget_transaction_update_multi_dimension_aggregate', paramsArr);
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
            var queryString = this.objCollection.util.getQueryString('ds_p1_1_widget_transaction_insert_form_submission_count', paramsArr);
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
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            /* "ds_p1_widget_transaction_update_form_submission_count
             IN p_widget_transaction_id BIGINT(20), IN p_widget_id BIGINT(20), 
             IN p_form_submission_date DATE, IN p_widget_form_count BIGINT(20), IN p_log_datetime DATETIME
             "*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_1_widget_transaction_update_form_submission_count', paramsArr);
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
                    data.period_flag,
                    data.widget_access_level_id,
                    data.asset_id,
                    data.activity_id,
                    data.workforce_id,
                    data.account_id,
                    data.organization_id
                    );
            /*"ds_p1_widget_transaction_select_widget_choice_flag
             IN p_widget_id BIGINT(20), IN p_form_submission_date DATE, IN p_choice DOUBLE(16,4), IN p_period_flag TINYINT(4)"*/
            var queryString = this.objCollection.util.getQueryString('ds_p1_1_widget_transaction_select_widget_choice_flag', paramsArr);
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
                    data.aggr_value,
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
                    data.widget_id,
                    data.widget_transaction_id,
                    data.date,
                    data.choice,
                    data.aggr_value,
                    data.asset_id
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
    
    getWidgetByStatusPeriodFlag(lookupData) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    lookupData.widget_id,
                    lookupData.date,
                    lookupData.period_flag,
                    lookupData.widget_access_level_id,
                    lookupData.asset_id,
                    lookupData.activity_id,
                    lookupData.workforce_id,
                    lookupData.account_id,
                    lookupData.organization_id,
                    lookupData.activity_status_id
                    );

            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_select_file_status_flag', paramsArr);
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
    
    createFileStatusDistribution(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_id,
                    data.asset_id,
                    data.organization_id,
                    data.date,
                    data.count,
                    data.activity_status_id,
                    data.activity_status_name,
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            
            /* ds_p1_widget_transaction_insert_form_file_status_count
             IN p_widget_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_timezone_date DATE,
             IN p_status_count BIGINT(20), IN p_status_type_id SMALLINT(6), IN p_status_type_name VARCHAR(50),
             IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME */
            
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_insert_form_file_status_count', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject();
                return resolve();
            });
        });
    }
    
    updateFileStatusDistribution(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_transaction_id,
                    data.widget_id,
                    data.date,
                    data.count,
                    data.activity_status_id,
                    data.activity_status_name,
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            /* "ds_p1_widget_transaction_update_form_file_status_count
             IN p_widget_transaction_id BIGINT(20), IN p_widget_id BIGINT(20), IN p_timezone_date DATE,
             IN p_widget_form_count BIGINT(20), IN p_activity_status_type_id SMALLINT(6), IN p_activity_status_type_name VARCHAR(50),
             IN p_log_asset_id BIGINT(20),IN p_log_datetime DATETIME
                */
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_update_form_file_status_count', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }
    
    getWidgetByStatusPeriodAggrFlag(lookupData) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    lookupData.widget_id,
                    lookupData.date,
                    lookupData.period_flag,
                    lookupData.widget_access_level_id,
                    lookupData.asset_id,
                    lookupData.activity_id,
                    lookupData.workforce_id,
                    lookupData.account_id,
                    lookupData.organization_id,
                    lookupData.from_status_id
                    );

            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_select_file_status_aggr_flag', paramsArr);
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
    
    createFileStatusDuration(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_id,
                    data.asset_id,
                    data.organization_id,
                    data.date,
                    data.aggregate,
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            
            /* ds_p1_widget_transaction_insert_form_file_status_duration
              */
            
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_insert_form_file_status_duration', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject();
                return resolve();
            });
        });
    }
    
    updateFileStatusDuration(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_transaction_id,
                    data.widget_id,
                    data.date,
                    data.aggregate,
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            /* "ds_p1_widget_transaction_update_form_file_status_duration
             
                */
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_update_form_file_status_duration', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }
    
    createFileStatusTransition(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_id,
                    data.asset_id,
                    data.organization_id,
                    data.date,
                    data.aggregate,
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            
            /* ds_p1_widget_transaction_insert_form_file_status_duration
              */
            
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_insert_form_file_status_transition', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject();
                return resolve();
            });
        });
    }
    
    updateFileStatusTransition(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    data.widget_transaction_id,
                    data.widget_id,
                    data.date,
                    data.aggregate,
                    data.asset_id,
                    this.objCollection.util.getCurrentUTCTime()
                    );
            /* "ds_p1_widget_transaction_update_form_file_status_duration
             
                */
            var queryString = this.objCollection.util.getQueryString('ds_p1_widget_transaction_update_form_file_status_transition', paramsArr);
            if (queryString === '')
                return reject();
            this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
                if (err)
                    return reject(err);
                return resolve(data);
            });
        });
    }
    
    
    getWidgetTxnsOfAWidget(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
            		data.organization_id,
            		data.widget_id,
            		data.date                    
                    );
            /*"ds_v1_widget_transaction_select_widget_date
             */
            var queryString = this.objCollection.util.getQueryString('ds_v1_widget_transaction_select_widget_date', paramsArr);
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
}

module.exports = WidgetTransactionService;
//util.getCurrentUTCTime()