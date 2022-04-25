function ArpService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;
    const moment = require('moment');
    const nodeUtil = require('util');
    const self = this;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.updateAssetFlag = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.asset_flag_arp_settings_enabled
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_flag_arp_settings_enabled', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    this.updateAssetBusinessHours = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.asset_arp_data,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_arp_data', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    this.updateFloorLevelFlag = async function (request) {
        let responseData = [],
            error = true;
        for(let i=0;i<request.workforce_list.length;i++){
        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_list[i],
            request.flag_arp_settings_enabled,
            util.getCurrentUTCTime(),
            request.log_asset_id,
        );
        const queryString = util.getQueryString('ds_p1_workforce_list_update_flag_arp_settings_enabled', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
    }
        return [error, responseData];
    }

    this.updateFloorLevelArpConfig = async function (request) {
        let responseData = [],
            error = true;
            const paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.arp_data,
                util.getCurrentUTCTime(),
                request.log_asset_id,
            );
        const queryString = util.getQueryString('ds_p1_workforce_list_update_arp_data', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    this.updateBuildingLevelArpConfig = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.arp_data,
            util.getCurrentUTCTime(),
            request.log_asset_id,
        );
        const queryString = util.getQueryString('ds_p1_account_list_update_arp_data', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    this.updateFlagPersistRole = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.bot_operation_id,
            request.bot_id,
            request.bot_operation_flag_persist_role,
            request.organization_id,
            request.log_asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_bot_operation_mapping_update_flag_persist_role', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    this.getARPDashboardFiltersData = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.filter_id,
            request.target_asset_id,
            request.is_search,
            request.search_string,
            request.asset_id
        );
        const queryString = util.getQueryString('ds_v1_arp_filters_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

module.exports = ArpService;

