function AdminListingService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;
    const moment = require('moment');
    const nodeUtil = require('util');
    const self = this;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.organizationListSelectName = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_name
        );
        const queryString = util.getQueryString('ds_p1_organization_list_select_name', paramsArr);

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

    this.workforceTypeMasterSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_workforce_type_master_select', paramsArr);

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

    this.assetTypeCategoryMasterSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.product_id || 1,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_1_asset_type_category_master_select', paramsArr);

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


module.exports = AdminListingService;
