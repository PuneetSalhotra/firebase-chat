class ActivityStatusChangeTxnService {
    constructor(args) {
        this.objCollection = args.objCollection;
    }
    
    activityStatusChangeTxnSelectAverage(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
            		data.from_status_id,
            		data.to_status_id,
            		data.form_id,
            		data.organization_id,
            		data.account_id,
            		data.workforce_id,
            		data.asset_id,
            		data.flag,
            		data.activity_id,
            		data.widget_access_level_id,
            		data.start,
            		data.end
            );
            var queryString = this.objCollection.util.getQueryString('ds_p1_activity_status_change_transaction_select_aggregate', paramsArr);
            if (queryString !== '') {
            	this.objCollection.db.executeQuery(1, queryString, data, function (err, result) {
                    (err === false) ? resolve(result): reject(err);
                });
            }
        });
    };
    
    
    
    
    activityStatusChangeTxnSelectAggrDt(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
            		data.from_status_id,
            		data.to_status_id,
            		data.form_id,
            		data.organization_id,
            		data.account_id,
            		data.workforce_id,
            		data.asset_id,
            		data.flag,
            		data.activity_id,
            		data.widget_access_level_id,
            		data.start,
            		data.end
            );
            var queryString = this.objCollection.util.getQueryString('ds_p1_activity_status_change_transaction_select_aggr_datetime', paramsArr);
            if (queryString !== '') {
            	this.objCollection.db.executeQuery(1, queryString, data, function (err, result) {
                    (err === false) ? resolve(result): reject(err);
                });
            }
        });
    };
    
    activityStatusChangeTxnActivityStatus(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
            		data.from_status_id,
            		data.to_status_id,
            		data.form_id,
            		data.organization_id,
            		data.account_id,
            		data.workforce_id,
            		data.asset_id,
            		data.flag,
            		data.activity_id,
            		data.widget_access_level_id,
            		data.start,
            		data.end
            );
            var queryString = this.objCollection.util.getQueryString('ds_p1_activity_status_change_txn_select_aggr_activity_dt', paramsArr);
            if (queryString !== '') {
            	this.objCollection.db.executeQuery(1, queryString, data, function (err, result) {
                    (err === false) ? resolve(result): reject(err);
                });
            }
        });
    };
    
    activityStatusChangeTxnInsert(request, aggregate) {
        // IN p_organization_id BIGINT(20), IN p_activity_id BIGINT(20), IN p_from_status_id BIGINT(20), 
        // IN p_to_status_id BIGINT(20), IN p_from_status_datetime DATETIME, IN p_to_status_datetime 
        // DATETIME, IN p_duration DECIMAL(16,4), IN p_log_datetime DATETIME, IN p_log_asset_id BIGINT(20)
        // IN status_changed_flag TINYINT(4)
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.activity_id,
                request.from_status_id,
                request.to_status_id,
                request.from_status_datetime,
                request.to_status_datetime,
                aggregate,
                this.objCollection.util.getCurrentUTCTime(),
                request.asset_id,
                request.status_changed_flag
            );
            var queryString =  this.objCollection.util.getQueryString('ds_v1_activity_status_change_transaction_insert', paramsArr);
            if (queryString !== '') {
            	 this.objCollection.db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    }; 
    
    activityStatusChangeTxnIntermediateAggr(data) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
            		data.from_status_id,
            		data.to_status_id,
            		data.form_id,
            		data.organization_id,
            		data.account_id,
            		data.workforce_id,
            		data.asset_id,
            		data.flag,
            		data.activity_id,
            		data.widget_access_level_id,
            		data.start,
            		data.end
            );
            var queryString = this.objCollection.util.getQueryString('ds_v1_activity_status_change_txn_select_aggr_intermediate', paramsArr);
            if (queryString !== '') {
            	this.objCollection.db.executeQuery(1, queryString, data, function (err, result) {
                    (err === false) ? resolve(result): reject(err);
                });
            }
        });
    };
}

module.exports = ActivityStatusChangeTxnService;