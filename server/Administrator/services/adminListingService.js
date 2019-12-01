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

    this.checkSelfSignUpFlagForOrganization = async function (request) {
        const [err, orgData] = await self.organizationListSelect(request);
        if (err || Number(orgData.length) === 0) {
            return [err || "Organization does not exist", []]
        }

        return [false, orgData.map(row => {
            return {
                organization_id: row.organization_id,
                organization_name: row.organization_name,
                organization_self_signup_enabled: row.organization_self_signup_enabled,
            }
        })]
    }

    this.organizationListSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id
        );
        const queryString = util.getQueryString('ds_p1_organization_list_select', paramsArr);

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

    this.activityTypeCategoryMasterSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.product_id || 1,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_1_activity_type_category_master_select', paramsArr);

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

    this.listActivityStatusTypeByActivityTypeCategoryID = async function (request) {
        const [errOne, activityStatusTypes] = await self.activityStatusTypeMasterSelectCategory({
            ...request,
            activity_type_category_id: request.activity_type_category_id || 48,
            start_from: 0,
            limit_value: 50
        });
        return [errOne, activityStatusTypes];
    }

    this.activityStatusTypeMasterSelectCategory = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_type_category_id,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_activity_status_type_master_select_category', paramsArr);

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
                });
        }
        return [error, responseData];
    };

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
                });
        }
        return [error, responseData];
    };

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
                    responseData = data.map(desk => {
                        return {
                            ...desk,
                            asset_flag_account_admin: desk.asset_flag_admin,
                        }
                    });
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

    this.getAssetIdCard = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.organization_id
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_asset_id_card', paramsArr);

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

    // Get complete workforce list in the account
    this.workforceListSelectAccount = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.start_from || 0,
            request.limit_value || 15
        );
        const queryString = util.getQueryString('ds_p1_1_workforce_list_select_account', paramsArr);

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

    // Get forms list based on form type id
    this.workforceFormMappingSelectFormType = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.form_type_id,
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_select_form_type', paramsArr);

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

    // Get forms list based on form type id
    this.accountListSelectOrganization = async function (request) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_account_name VARCHAR(50), IN p_flag_search TINYINT(4), 
        // IN p_sort_flag TINYINT(4), IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id || 0,
            request.account_name || '',
            request.flag_search || 0,
            request.sort_flag || 0,
            request.start_from || 0,
            request.limit_value || 50
        );
        // const queryString = util.getQueryString('ds_p1_account_list_select_organization', paramsArr);
        const queryString = util.getQueryString('ds_v1_account_list_select_organization', paramsArr);

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

    // To update Unread count and last Seen
    this.activityAssetMappingUpdateUnreadUpdatesCountReset = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.asset_id,
            request.organization_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_unread_updates_count_reset', paramsArr);

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

    // Get the list of widgets
    this.widgetListSelectLevel = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.level_flag,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.form_id,
            request.activity_id,
            request.widget_id,
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_widget_list_select_level', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
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

    // Get the list of activity statuses
    this.workforceActivityStatusMappingSelectFlag = async function (request) {
        // IN p_organization_id bigint(20), IN p_account_id bigint(20), IN p_workforce_id bigint(20), 
        // IN p_activity_type_category_id SMALLINT(6), IN p_activity_type_id BIGINT(20), 
        // IN p_tag_type_id SMALLINT(6), IN p_tag_id BIGINT(20), IN p_activity_status_type_id BIGINT(20), 
        // IN p_activity_status_tag_id BIGINT(20), IN p_flag TINYINT(4), IN p_log_datetime DATETIME, 
        // IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id || 0,
            request.workforce_id || 0,
            request.activity_type_category_id || 48,
            request.activity_type_id || 0,
            request.tag_type_id || 0,
            request.tag_id || 0,
            request.activity_status_type_id || 0,
            request.activity_status_tag_id || 0,
            request.flag || 0,
            util.getCurrentUTCTime(),
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select_flag', paramsArr);

        if (queryString !== '') {
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

    // Get the list of activity status tag IDs
    this.activityStatusTagListSelect = async function (request) {
        // IN p_organization_id BIGINT(20), IN p_activity_type_category_id SMALLINT(6), 
        // IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_type_category_id,
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_activity_status_tag_list_select', paramsArr);

        if (queryString !== '') {
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

    this.listAssetsByCUID = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);
        const [err, assetData] = await assetListSelectCustomerUniqueID(request, organizationID, accountID, workforceID);

        const filteredAssetData = assetData.map(x => {
            return {
                organization_id: x.organization_id,
                organization_name: x.organization_name,
                account_id: x.account_id,
                account_name: x.account_name,
                workforce_id: x.workforce_id,
                workforce_name: x.workforce_name,
                asset_id: x.asset_id,
                asset_first_name: x.asset_first_name
            }
        })

        return [err, filteredAssetData]
    }

    // Fetch all assets with the given customer unique ID
    async function assetListSelectCustomerUniqueID(request, organizationID, accountID, workforceID) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_customer_unique_id VARCHAR(50), 
        // IN p_asset_type_category_id BIGINT(20))
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.customer_unique_id,
            request.asset_type_category_id
        );
        const queryString = util.getQueryString('ds_p1_1_asset_list_select_customer_unique_id', paramsArr);

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

    // Activity List Select Workforce Category
    this.activityListSelectWorkforceCategory = async function (request, workforceID, organizationID, accountID) {
        // IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_activity_type_category_id SMALLINT(6), IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            workforceID,
            accountID,
            organizationID,
            request.activity_type_category_id,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_activity_list_select_workforce_category', paramsArr);

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

    // Get the employee asset's ID card activity details
    this.activityAssetMappingSelectAssetIdCard = async function (request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            organizationID
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_asset_id_card', paramsArr);

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

    // Get the desk asset's contact card activity details
    this.activityListSelectCategoryContact = async function (request, organizationID, activityTypeCategoryID = 5) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            organizationID,
            activityTypeCategoryID
        );
        const queryString = util.getQueryString('ds_v1_activity_list_select_category_contact', paramsArr);

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

    // Get the list of activity statuses mapped to a status tag
    this.workforceActivityStatusMappingSelectStatusTag = async function (request) {
        // IN p_organization_id bigint(20), IN p_account_id bigint(20), IN p_workforce_id bigint(20), 
        // IN p_activity_type_category_id SMALLINT(6), IN p_activity_type_id BIGINT(20), 
        // IN p_tag_type_id SMALLINT(6), IN p_tag_id BIGINT(20), IN p_activity_status_type_id BIGINT(20), 
        // IN p_activity_status_tag_id BIGINT(20), IN p_flag TINYINT(4), IN p_log_datetime DATETIME, 
        // IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
                request.organization_id,                                                                       
                request.account_id,
                request.workforce_id,
                request.activity_status_tag_id,
                request.page_start,
                request.page_limit
            );
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select_status_tag', paramsArr);

        if (queryString !== '') {
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

module.exports = AdminListingService;
