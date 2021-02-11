/*
 *author: Rajendra Solanki
 * 
 */

function PortalService(objectCollection) {
    const util = objectCollection.util;
    const db = objectCollection.db;
    const ClientCapability = objectCollection.ClientCapability;
    const query_string = objectCollection.query_string;

    /*
     * @description - Get Activity Statuses
     * @param {type} request
     * @returns {undefined}
     */
    this.workforceActivityStatusMappingSelect = async (request) => {
        let responseData = [],
            error = true;

        let paramsArray = [
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.log_datetime,
            request.start_from,
            request.limit_value
        ];

        let queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select', paramsArray);

        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };


    /*
     * @description - Workforce list select
     * @param {type} request
     * @created {by} Rajendra
     * @modified {by}  {date} 
     */
    this.workforceListSelectAccount1 = async (request) => {
        let responseData = [],
            error = true;

        let paramsArray = [
            request.organization_id,
            request.account_id,
            request.start_from,
            request.limit_value
        ];

        let queryString = util.getQueryString('ds_p1_1_workforce_list_select_account', paramsArray);

        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    /*
     * @description - Seach by employee desk name to retrieve the cover data of the employee
     * @param {type} request
     * @created {by} Rajendra
     * @modified {by}  {date} 
     */
    this.assetListSearchAssetTypeCategory = async (request) => {
        let responseData = [],
            error = true;

        let paramsArray = [
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_type_category_id,
            request.search_string,
            request.start_from,
            request.limit_value
        ];

        let queryString = util.getQueryString('ds_p1_asset_list_search_asset_type_category', paramsArray);

        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    /*
    * @description - Get employee desk information
    * @param {type} request
    * @returns {undefined}
    */
    this.assetListSelectOperatingAsset = async (request) => {
        let responseData = [],
            error = true;

        let paramsArray = [
            request.organization_id,
            request.operating_asset_id
        ];

        let queryString = util.getQueryString('ds_p1_asset_list_select_operating_asset', paramsArray);

        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    /*
     * @description - Get assets in the workforce
     * @param {type} request
     * @returns {undefined}
     */
    this.assetListSelectAllDesks = async (request) => {
        let responseData = [],
            error = true;

        let paramsArray = [
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.start_from,
            request.limit_value
        ];

        let queryString = util.getQueryString('ds_p1_asset_list_select_all_desks', paramsArray);

        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

}

module.exports = PortalService;