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
}

module.exports = ActivityStatusChangeTxnService;