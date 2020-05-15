
function doaService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;
    const moment = require('moment');
    const makeRequest = require('request');
    const nodeUtil = require('util');
    const self = this;

    //function sleep(ms) {
    //    return new Promise(resolve => setTimeout(resolve, ms));
    //}

    /*this.getAssetAccessDetails = async function (request) {
        let assetData = [],
            error = true
            responseData = [];

        const paramsArr = new Array(
            request.organization_id,
            request.target_account_id,
            request.target_workforce_id,
            request.desk_asset_id || 0,
            request.manager_asset_id || request.asset_id,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_v1_asset_access_mapping_select_asset_access_all', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    responseData.push(data);
                    error = false;
                    assetData = await self.getAssetUnderAManagerInaWorforce(request);
                    responseData.push(assetData);

                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };*/

    this.hello = async(request) => {
        return [false, "nani"];
    };

}

module.exports = doaService;