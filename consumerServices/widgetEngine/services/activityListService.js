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
                data.form_id,
                data.widget_access_level_id,
                data.start,
                data.end
                );
        /*IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20),
         *  IN p_activity_id BIGINT(20), IN p_form_id BIGINT(20), IN p_access_level_id TINYINT(4), IN p_start_datetime DATETIME,
         *   IN p_end_datetime DATETIME
         */
        var queryString = this.objCollection.util.getQueryString('ds_p1_activity_list_select_file_count_level', paramsArr);
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

module.exports = ActivityListService;