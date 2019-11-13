function UrlListingService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;
    const moment = require('moment');
    const nodeUtil = require('util');
    const self = this;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.urlParametersLookup = async function (request) {
        const [errOne, urlData] = await self.urlLookupTransactionSelect(request);
        if (errOne) {
            return [errOne, { message: "Error retrieving URL parameters" }];
        }
        return [false, urlData];
    }

    this.urlLookupTransactionSelect = async function (request) {
        // IN p_url_uuid VARCHAR(100), IN p_url_id BIGINT(20), IN p_organzation_id BIGINT(20)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.url_uuid,
            request.url_id || 0,
            request.organization_id
        );
        const queryString = util.getQueryString('ds_v1_url_lookup_transaction_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }
}

module.exports = UrlListingService;
