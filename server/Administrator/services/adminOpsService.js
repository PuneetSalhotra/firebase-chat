const AdminListingService = require("../services/adminListingService");

function AdminOpsService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;
    const adminListingService = new AdminListingService(objCollection);
    const moment = require('moment');
    const nodeUtil = require('util');
    const self = this;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.setupOrganization = async function (request) {

        // Check if an organization exists with the same name
        const [errOne, orgCheck] = await adminListingService.organizationListSelectName(request);
        if (errOne || orgCheck.length > 0) {
            return [true, {
                message: "Error checking for organization or \
                an organization with the same name already exists!"
            }]
        }

        let organizationID = 0,
            accountID = 0;
        // Create the organization
        const [errTwo, orgData] = await organizationListInsert(request);
        if (errTwo || orgData.length === 0) {
            return [true, {
                message: "Error creating organization"
            }]

        } else if (orgData.length > 0) {
            organizationID = orgData[0].organization_id;

            // History insert
            organizationListHistoryInsert({
                organization_id: organizationID,
                update_type_id: 0
            });
        }

        if (Number(organizationID) !== 0) {

            if (request.organization_domain_name == '') {
                const domain = request.organization_email.split('@');
                request.organization_domain_name = domain[1];
            }
            const departments = request.departments || "Floor 1,Floor 2,Floor 3,Floor 4,Floor 5";
            const departments_list = departments.split(',');

            // Create the account
            const [errThree, accountData] = await accountListInsert(request, organizationID);
            if (errThree || accountData.length === 0) {
                return [true, {
                    message: "Error creating account"
                }]

            } else if (accountData.length > 0) {
                accountID = accountData[0].account_id;

                // History insert
                accountListHistoryInsert({
                    account_id: accountID,
                    organization_id: organizationID,
                    update_type_id: 1
                });
            }
        }

        if (Number(organizationID) !== 0 && Number(accountID) !== 0) {
            // Fetch generic workforces
            const [errFour, workforceTypes] = await adminListingService.workforceTypeMasterSelect({
                start_from: 0,
                limit_value: 3
            });
            if (errFour || workforceTypes.length === 0) {
                return [true, {
                    message: "Error fetching workforceTypes"
                }]
            }

            // Create Generic Workforces
            for (const workforceType of workforceTypes) {
                // Create the workforce
                let [errFive, workforceData] = await workforceListInsert({
                    workforce_name: workforceType.workforce_type_name,
                    workforce_type_id: workforceType.workforce_type_id
                }, organizationID, accountID);

                if (errFive || workforceTypes.length === 0) {
                    return [true, {
                        message: `Error creating workforce ${workforceType.workforce_type_name}`
                    }]
                }
                try {
                    // History insert
                    await workforceListHistoryInsert({
                        workforce_id: workforceData[0].workforce_id,
                        organization_id: organizationID
                    });
                } catch (error) {}

                let workforceID = workforceData[0].workforce_id;
                // Fetch workforce asset types
                const [errSix, assetTypes] = await adminListingService.assetTypeCategoryMasterSelect({
                    product_id: 1,
                    start_from: 0,
                    limit_value: 14
                });
                if (errSix || assetTypes.length === 0) {
                    return [true, {
                        message: `Error fetching assetTypes`
                    }]
                }
                // Create workforce asset types
                for (const assetType of assetTypes) {
                    const [errSeven, assetTypeData] = await workforceAssetTypeMappingInsert({
                        asset_type_name: assetType.asset_type_category_name,
                        asset_type_description: assetType.asset_type_category_description,
                        asset_type_category_id: assetType.asset_type_category_id
                    }, workforceID, organizationID, accountID);

                    if (errSeven || assetTypeData.length === 0) {
                        console.log(`Error creating assetType ${assetType.asset_type_category_name} for workforce ${workforceID}`);
                    }

                    if (assetTypeData.length > 0) {
                        let assetTypeID = assetTypeData[0].asset_type_id;
                        try {
                            // History insert
                            await workforceAssetTypeMappingHistoryInsert({
                                update_type_id: 0
                            }, assetTypeID, organizationID);
                        } catch (error) {}
                        // 
                    }
                }
            }

        }

        // 
        return [false, {}];
    }

    // Organization List Insert
    async function organizationListInsert(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_name,
            request.organization_domain_name,
            request.organization_image_path || '',
            request.organization_address || '',
            request.organization_phone_country_code || 0,
            request.organization_phone_number || 0,
            request.organization_email || '',
            request.contact_person || 'Admin',
            request.contact_phone_country_code || 0,
            request.contact_phone_number || 0,
            request.contact_email || '',
            1, // organization_type_id
            1, // log_asset_id
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_organization_list_insert', paramsArr);

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

    // Organization List History Insert
    async function organizationListHistoryInsert(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.update_type_id || 0, // Update Type ID => 0
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_organization_list_insert', paramsArr);

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

    // Account List Insert
    async function accountListInsert(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_name, // account_name
            request.organization_image_path || '', // account_image_path
            request.organization_phone_country_code || 0, // account_phone_country_code
            request.organization_phone_number || 0, // account_phone_number
            request.contact_email || '', // account_email
            request.organization_address || '', // account_address
            request.account_location_latitide || 0, // account_location_latitide
            request.account_location_longitude || 0, // account_location_longitude
            request.contact_person || 'Admin',
            request.contact_phone_country_code || 0,
            request.contact_phone_number || 0,
            request.contact_email || '',
            request.account_type_id || 1,
            request.manager_asset_id || 0,
            organizationID,
            1, // log_asset_id
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_account_list_insert', paramsArr);

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

    // Account List History Insert
    async function accountListHistoryInsert(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.account_id,
            request.organization_id,
            request.update_type_id || 0, // Update Type ID => 0
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_account_list_history_insert', paramsArr);

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

    // Workforce Insert
    async function workforceListInsert(request, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.workforce_name,
            request.workforce_image_path || '',
            request.workforce_type_id,
            accountID, // account_id
            organizationID, // organization_id
            0, // manager_asset_id,
            1, // log_asset_id
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_list_insert', paramsArr);

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

    // Workforce List History Insert
    async function workforceListHistoryInsert(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.workforce_id,
            request.organization_id,
            request.update_type_id || 0, // Update Type ID => 0
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_list_history_insert', paramsArr);

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

    // Workforce Asset Types Insert
    async function workforceAssetTypeMappingInsert(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_type_name,
            request.asset_type_description,
            request.asset_type_category_id, // Should be 1 when creating for the first time
            workforceID,
            accountID,
            organizationID,
            1, // log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_insert', paramsArr);

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

    // Workforce Asset Types History Insert
    async function workforceAssetTypeMappingHistoryInsert(request, assetTypeID, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            assetTypeID,
            organizationID,
            request.update_type_id || 0,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_history_insert', paramsArr);

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

module.exports = AdminOpsService;
