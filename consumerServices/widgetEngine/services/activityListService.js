class ActivityListService {
    constructor(args) {
        this.objCollection = args.objCollection;
    }

getStatusCounts(data) {
    return new Promise((resolve, reject) => {
        var paramsArr = new Array(
                data.organization_id,
                data.account_id,
                data.workforce_id,
                data.asset_id,
                data.activity_id,
                data.activity_type_id,
                data.form_id,
                data.widget_access_level_id,
                data.start,
                data.end
                );
        /*IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20),
         *  IN p_activity_id BIGINT(20), IN p_form_id BIGINT(20), IN p_access_level_id TINYINT(4), IN p_start_datetime DATETIME,
         *   IN p_end_datetime DATETIME
         */
        var queryString = this.objCollection.util.getQueryString('ds_p1_1_activity_list_select_file_count_level', paramsArr);
        if (queryString === '')
            return reject();
        this.objCollection.db.executeQuery(1, queryString, {}, function (err, data) {
            if (err)
                return reject(err);
            return resolve(data);
        });
    });
}

wait(milliseconds) {
	return new Promise(resolve => setTimeout(resolve, milliseconds));
}

getFileCount(data) {
    return new Promise((resolve, reject) => {
        var paramsArr = new Array(
                data.organization_id,
                data.account_id,
                data.workforce_id,
                data.asset_id,
                data.activity_id,
                data.form_id,
                data.widget_access_level_id,
                data.start,
                data.end
                );
        var queryString = this.objCollection.util.getQueryString('ds_p1_activity_list_select_file_count_datetime', paramsArr);
        if (queryString === '')
            return reject();
        this.objCollection.db.executeQuery(1, queryString, {}, function (err, data) {
            if (err)
                return reject(err);
            return resolve(data);
        });
    });
}

insertUpdate(data){
    return new Promise((resolve, reject) => {
// IN p_widget_id BIGINT(20), IN p_activity_id BIGINT(20), IN p_field_id BIGINT(20), IN p_field_value DECIMAL(16,4), 
// IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_log_datetime DATETIME
        var paramsArr = new Array(
                data.widget_id,
                data.workflow_activity_id,
                data.activity_id,
                data.form_id,
                data.form_transaction_id,
                data.field_id,
                data.field_value,
                data.workforce_id,
                data.account_id,
                data.organization_id,
                this.objCollection.util.getCurrentUTCTime()
                );
        
        let temp ={};
        let newReq = Object.assign({}, data);

        var queryString = this.objCollection.util.getQueryString('ds_p1_widget_activity_field_transaction_insert', paramsArr);
        if (queryString === '')
            return reject();
        this.objCollection.db.executeQuery(0, queryString, {}, function (err, data) {
            if (err){                                
                temp.err = err;
                newReq.inline_data = temp;
                this.objCollection.activityCommonService.widgetLogTrx(newReq, 1);
                reject(err);
            } else {
                temp.data = data;                
                newReq.inline_data = temp;
                this.objCollection.activityCommonService.widgetLogTrx(newReq, 2);
                resolve(data);
            }
        });

    });
}

/*//Widget Log transaction
widgetLogTrx(request, statusId) {
    return new Promise((resolve, reject)=>{
        let paramsArr = new Array(                
            request, 
            request.inline_data || '{}', 
            request.workflow_activity_id, 
            request.form_activity_id, 
            request.form_transaction_id, 
            request.activity_status_id || 0, 
            request.widget_id, 
            statusId, 
            request.workforce_id, 
            request.account_id, 
            request.organization_id, 
            request.asset_id, 
            this.objCollection.util.getCurrentUTCTime()  
        );
        let queryString = this.objCollection.util.getQueryString('ds_p1_1_widget_log_transaction_insert', paramsArr);
        if (queryString != '') {
            this.objCollection.db.executeQuery(0, queryString, {}, function(err, data){
                if(err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }
    });    
}*/

}

module.exports = ActivityListService;