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

    this.assetListSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select', paramsArr);

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

    this.workforceActivityTypeMappingSelectCategory = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.start_from || 0,
            request.limit_value || 1
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_select_category', paramsArr);

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

    this.assetListSelectCountAssetTypeWorkforce = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_type_category_id
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_count_asset_type_workforce', paramsArr);

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

    this.assetAccessMappingSelectA2aMapping = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id, // Desk Asset ID
            request.user_asset_id // Employee Desk Asset ID
        );
        const queryString = util.getQueryString('ds_p1_asset_access_mapping_select_a2a_mapping', paramsArr);

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

    this.workforceActivityStatusMappingSelectStatus = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_status_type_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select_status', paramsArr);

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

    // Get activity list of an asset
    this.activityListSelectCategoryAsset = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            request.activity_type_category_id
        );
        const queryString = util.getQueryString('ds_p1_activity_list_select_category_asset', paramsArr);

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

    // Get the list of assets having access to the floor admin desk asset
    this.assetAccessMappingSelectAssetLevelAll = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_asset_access_mapping_select_asset_level_all', paramsArr);

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

    // Get asset types of a workforce
    this.workforceAssetTypeMappingSelectCategory = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_type_category_id,
            request.start_from || 0,
            request.limit_value || 1
        );
        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_select_category', paramsArr);

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

    this.workforceActivityTypeMappingSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.log_datetime || '1970-01-01 00:00:00',
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_select', paramsArr);

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

    this.workforceActivityStatusMappingSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.log_datetime || '1970-01-01 00:00:00',
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select', paramsArr);

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

    this.activityAssetMappingSelectCategoryContacts = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.is_search,
            request.search_string || '',
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_category_contacts', paramsArr);

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

    this.workforceDesksUnreadCount = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.sort_flag,
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_unrd_cnt_team_floor', paramsArr);

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

    this.assetListSelectAllDesks = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_all_desks', paramsArr);

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

    this.getWorkforceAssetsPendingCount = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.sort_flag,
            request.datetime_start || '1970-01-01 00:00:00',
            request.start_from || 0,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_pending_count_team_floor', paramsArr);

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

    this.employeeOrEmployeeDeskSearch = async function (request) {
        const [errOne, assetListSearchData] = await self.assetListSearchAssetTypeCategory(request);
        if (errOne) {
            return [true, {
                message: "Error fetching data"
            }];     
        }
        // for (const [assetIndex, asset] of Array.from(assetListSearchData).entries()) {
        //     console.log(`${assetIndex} asset_id: ${asset.asset_id} | asset_first_name: ${asset.asset_first_name} | operating_asset_id: ${asset.operating_asset_id} | operating_asset_first_name: ${asset.operating_asset_first_name}`);
        // }
        return [false, assetListSearchData];
    }


    this.assetListSearchAssetTypeCategory = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_type_category_id,
            request.search_string || '',
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_asset_list_search_asset_type_category', paramsArr);

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
