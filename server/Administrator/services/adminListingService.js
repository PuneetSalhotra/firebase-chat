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
            (request.organization_id).toString()
        );
        const queryString = util.getQueryString('ds_p1_organization_list_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    if(data.length > 0) {
                        let organizationInlineData = JSON.parse(data[0].organization_inline_data || '{}');
                        //console.log(organizationInlineData);

                        if(organizationInlineData.hasOwnProperty("rm_bot_config")) {
                            let rmBotConfig = organizationInlineData.rm_bot_config;
                            //console.log(rmBotConfig);

                            for(let fieldID of Object.keys(rmBotConfig)) {
                                //console.log('fieldID : ', fieldID);                                
                                switch(fieldID) {
                                    case "work_efficiency": if(rmBotConfig[fieldID] === "") {                                                                                                                            
                                                                rmBotConfig[fieldID] = 30;
                                                            }
                                                            break;
                                    case "read_efficiency": if(rmBotConfig[fieldID] === "") {
                                                                rmBotConfig[fieldID] = 10;
                                                            }
                                                            break;
                                    case "status_rollback_percentage": if(rmBotConfig[fieldID] === "") {
                                                                            rmBotConfig[fieldID] = 15;
                                                                        }
                                                                        break;
                                    case "customer_exposure_percentage": if(rmBotConfig[fieldID] === "") {
                                                                                rmBotConfig[fieldID] = 20;
                                                                            }
                                                                        break;
                                    case "industry_exposure": if(rmBotConfig[fieldID] === "") {
                                                                    rmBotConfig[fieldID] = 10;
                                                                }
                                                              break;
                                    case "workflow_exposure_percentage": if(rmBotConfig[fieldID] === "") {
                                                                            rmBotConfig[fieldID] = 15;
                                                                        }
                                                                         break;
                                    case "workflow_type_exposure_percentage": if(rmBotConfig[fieldID] === "") {
                                                                                    rmBotConfig[fieldID] = 0;
                                                                                }
                                                                              break;
                                    case "workflow_category_exposure_percentage": if(rmBotConfig[fieldID] === "") {
                                                                                    rmBotConfig[fieldID] = 0;
                                                                                }
                                                                                break;
                                }                                
                            }
                        } else {
                            organizationInlineData = {}
                            organizationInlineData.rm_bot_config = {
                                                "work_efficiency": 30,
                                                "read_efficiency": 10,
                                                "status_rollback_percentage": 15,
                                                "customer_exposure_percentage": 20,
                                                "industry_exposure Percentage'": 10,
                                                "workflow_exposure_percentage": 15,
                                                "workflow_type_exposure_percentage": 0,
                                                "workflow_category_exposure_percentage": 0
                                            };
                            
                        }
                        
                        data[0].organization_inline_data = JSON.stringify(organizationInlineData);
                    }
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

    this.assetTypeCategoryMasterSelectV1 = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.product_id || 1,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_2_asset_type_category_master_select_common', paramsArr);

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

    this.activityTypeCategoryMasterSelectV1 = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.product_id || 1,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_2_activity_type_category_master_select_common', paramsArr);

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
                    data[0].is_password_set = 'No';
                    for(const i of data) {
                        if((i.asset_email_password).length > 0) {
                            //Password is Set
                            data[0].is_password_set = 'Yes';
                            break;
                        }
                    }
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    this.workforceActivityTypeMappingSelectCategory = async (request) => {
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

    this.workforceActivityTypeMappingSelectCategoryV1 = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id||0,
            request.workforce_id||0,
            request.activity_type_category_id,
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p2_workforce_activity_type_mapping_select_category', paramsArr);

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

    this.getAllDesksOnFloor = async function (request) {
        let err = false, assetData = [];
        if (
            request.hasOwnProperty("workforce_type_id") &&
            Number(request.workforce_type_id) === 10
        ) {
            [err, assetData] = await self.assetListSelectAllCustomers(request);
        } else {
            [err, assetData] = await self.assetListSelectAllDesks(request);
        }

        return [err, assetData]
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

    this.assetListSelectAllCustomers = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_all_customers', paramsArr);

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

    this.getAssetIdCardV1 = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.target_asset_id,
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
        if(request.hasOwnProperty("flag")&&request.flag==1){
            const paramsArr = new Array(
                request.organization_id,
                request.asset_id
            );
            // const queryString = util.getQueryString('ds_p1_account_list_select_organization', paramsArr);
            const queryString = util.getQueryString('ds_p1_asset_access_mapping_select_account', paramsArr);
    
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
        }
        else{
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

    this.getListOfActivityStatusTags = async function (request) {
        let error, activityStatusTagsData = [];
        if (
            request.hasOwnProperty("is_status_mapped") &&
            Number(request.is_status_mapped) === 1
        ) {
            [error, activityStatusTagsData] = await self.workforceActivityStatusMappingSelectMappedTags(request);

        } else {
            [error, activityStatusTagsData] = await self.activityStatusTagListSelect(request);
        }

        return [error, activityStatusTagsData];
    }

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
                    responseData = data.map(statusTag => {
                        return {
                            query_status: statusTag.query_status,
                            activity_status_tag_id: statusTag.activity_status_tag_id,
                            activity_status_tag_name: statusTag.activity_status_tag_name,
                            activity_status_tag_level_name: statusTag.activity_status_tag_level_name
                        }
                    });
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    // Get the list of activity status tag IDs WHICH have activity statuses mapped
    this.workforceActivityStatusMappingSelectMappedTags = async function (request) {
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
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select_mapped_tags', paramsArr);

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

    // Get the list of assets/desks of a role/asset type
    this.assetListSelectRole = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_type_id,
            request.page_start || 0,
            request.page_limit || 10
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_role', paramsArr);

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

    // List statuses associated with this role
    this.workforceActivityStatusMappingSelectRole = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_type_id,
            request.page_start || 0,
            request.page_limit || 10
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select_role', paramsArr);

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

    // List roles by access levels
    this.listRolesByAccessLevels = async function (request) {
        let responseData = [],
            error = true;

        let asset_type_flag_sip_target = -1;
        if (request.hasOwnProperty('asset_type_flag_sip_target')) {
            asset_type_flag_sip_target = request.asset_type_flag_sip_target;
        }

        // NEEDS WORK
        const paramsArr = new Array(
            request.flag || 0,
            request.level_id || 0,
            request.asset_type_id,
            request.asset_type_category_id || 0,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_type_flag_frontline || 0,
            asset_type_flag_sip_target,
            request.page_start || 0,
            request.page_limit || 50
        );
        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_select_flag', paramsArr);

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

    this.workforceActivityTypeMappingSelectID = async function (request, activityTypeID) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            activityTypeID
        );

        let queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_select_id', paramsArr);
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

    this.workforceFormFieldMappingSelectWorkflowFields = async function (request, activityTypeID = 0) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            activityTypeID,
            request.form_id,
            request.field_id,
            request.data_type_id || 0,
            request.data_type_combo_id || 0,
            request.start_from || 0,
            request.limit_value || 50
        );

        let queryString = util.getQueryString('ds_p1_2_workforce_form_field_mapping_select_workflow_fields', paramsArr);
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

    this.tagListSelectTag = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.tag_id,
            request.start_from || 0,
            request.limit_value || 50
        );

        let queryString = util.getQueryString('ds_v1_activity_type_tag_mapping_select_tag', paramsArr);
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

    this.tagEntityMappingTagSelect = async function (request) {
        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_category_id,
            request.tag_type_id,
            request.cluster_tag_id,
            request.page_start || 0,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_tag_entity_mapping_select_tag', paramsArr);

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

    this.tagTypeTagMappingSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
                    request.organization_id,
                    request.tag_type_category_id || 1,
                    request.tag_type_id,
                    request.start_from || 0,
                    request.limit_value || 1
                );

        //var queryString = util.getQueryString('ds_v1_tag_list_select_tag_type', paramsArr);
        const queryString = util.getQueryString('ds_p1_tag_list_select_tag_type', paramsArr);
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

    this.botOperationMappingSelectID = async function (request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.bot_id,
            request.bot_operation_id,
            request.start_from || 0,
            request.limit_value || 50
        );

        let queryString = util.getQueryString('ds_p1_bot_operation_mapping_select_id', paramsArr);
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

    this.botOperationMappingSelectOperationType = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.activity_type_id || 0,
            request.bot_id || 0,
            request.bot_operation_type_id || 0,
            request.form_id || 0,
            request.field_id || 0,
            request.start_from || 0,
            request.limit_value || 50
        );

        let queryString = util.getQueryString('ds_p1_1_bot_operation_mapping_select_operation_type', paramsArr);
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

    // Get account bassed on country code
    this.accountListSelectCountryCode = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.country_code
        );
        const queryString = util.getQueryString('ds_v1_account_list_select_country_code', paramsArr);
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

    // Get workforce based on workforce_type_id
    this.workforceListSelectWorkforceType = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_type_id,
            0,
            1
        );
        const queryString = util.getQueryString('ds_p1_workforce_list_select_workforce_type', paramsArr);
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

    this.workforceActivityStatusMappingSelectStatusType = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.activity_type_id,
            request.activity_status_type_id,
            0,
            1
        );
        const queryString = util.getQueryString('ds_p1_2_workforce_activity_status_mapping_select', paramsArr);

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

    
    this.getTagTypesBasedOnCategory = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_category_id,
            request.start_from || 0,
            request.limit_value            
        );
        const queryString = util.getQueryString('ds_p1_tag_type_list_select_category', paramsArr);

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

    this.getTagTypesBasedOnCategoryV1 = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_category_id,
            request.start_from || 0,
            request.limit_value            
        );
        const queryString = util.getQueryString('ds_p1_1_tag_type_list_select_category', paramsArr);

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

    this.getTagEntityMappingsBasedOnCategory = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.tag_type_category_id,
            request.is_search || 0,
            request.search_string,
            request.start_from || 0,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_tag_entity_mapping_select_category', paramsArr);

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

    this.getTagEntityMappingsBasedOnID = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_id,
            request.start_from || 0,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_tag_entity_mapping_select', paramsArr);

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

    
    this.getLovDatatypeList = async (request) => {
        //2001 VIL - Account Type
        //2002 VIL - Corporate Class
        //2003 VIL - Circle
        //2004 VIL - State
        //2005 VIL - City
        //2006 VIL - Pincode
        //2007 VIL - Industry Type
        //2010 VIL - Feasibility City List

        let responseData = [],
            error = true, dbCall = 'ds_p1_lov_list_select';
        let paramsArr = new Array(
          request.type_id,
          request.entity_id,
          request.search_string,
          request.flag,
          request.sort_flag,
          request.page_start || 0,
          request.page_limit
        );

        if(request.type_id == 2010) {
            request.activity_id = request.workflow_activity_id;
            request.parent_activity_id = 0;
            [error, responseData] = await activityCommonService.activityActivityMappingSelect(request);
            if(error) {
                return [error, responseData];
            }

            console.log("responseData", JSON.stringify(responseData));
            responseData.reverse();
            let productActivityId = 0;
            for(let row of responseData) {
                if(row.parent_activity_type_category_id == 55) {
                    productActivityId = row.parent_activity_id; // parent activity id is the product activity id
                    break;
                }
            }

            
            paramsArr = new Array(
              productActivityId,
              request.type_id,
              request.entity_id,
              request.search_string,
              request.flag || 0,
              request.sort_flag || 0,
              request.page_start || 0,
              request.page_limit
            );
            dbCall = "ds_p1_city_feasibility_lov_list_select"
        }

        const queryString = util.getQueryString(dbCall, paramsArr);

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

    this.workforceTypeMasterSelectOrganization = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_workforce_type_master_select_organization', paramsArr);

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

        // Get workforce based on workforce_type_id
    this.workforceListSelectWorkforceTypeAll = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.target_account_id || 0,
            request.workforce_type_id || 0,
            request.page_start || 0,
            request.page_limit || 250
        );
        const queryString = util.getQueryString('ds_p1_workforce_list_select_workforce_type_strict', paramsArr);
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

    this.workforceFormMappingSelectWorkflowForms = async (request) => {

        let workflowFormsData = [],
            error = true;

        let paramsArr = new Array(
            request.flag || 0,
            request.organization_id,
            request.target_account_id,
            request.target_workforce_id,
            request.activity_type_id || 0,
            0, // request.access_level_id || 0,
            request.log_datetime || '1970-01-01 00:00:00',
            request.page_start || 0,
            request.page_limit || 250
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_select_workflow_forms_strict', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    workflowFormsData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, workflowFormsData];
    }  

    this.getLovDatatypeListV1 = async (request) => {
        //2001 VIL - Account Type
        //2002 VIL - Corporate Class
        //2003 VIL - Circle
        //2004 VIL - State
        //2005 VIL - City
        //2006 VIL - Pincode
        //2007 VIL - Industry Type
        //2010 VIL - Feasibility City List

        let responseData = [],
            error = true;
        
        const paramsArr = [              
              request.type_id,
              request.entity_id,
              request.search_string,
              request.flag || 0,
              request.sort_flag || 0,
              request.page_start || 0,
              request.page_limit || 50
        ];

        const queryString = util.getQueryString('ds_p1_lov_list_hierarchy_select', paramsArr);
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

    this.getStateAndCircleBasedOnCity = async (request) => {

        // flag = 1, Get state from city 
        // flag = 2, Get circle from city 
        let responseData = [],
            error = true;
        
        const paramsArr = [              
            request.type_id,
            request.entity_id,
            request.search_string || '',
            request.flag || 1,
            request.page_start || 0,
            request.page_limit || 50
        ];

        const queryString = util.getQueryString('ds_p1_lov_list_select_dependent', paramsArr);
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
    
    this.setSuperAdminFlag = async (request) => {

        let responseData = [],
            error = false;
        const paramsArr = [
          request.organization_id,
          request.account_id,
          request.workforce_id,
          request.asset_id,
          request.asset_flag_super_admin || 0
        ];

        const queryString = util.getQueryString('ds_p1_asset_list_update_flag_super_admin', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
              .then(() => {
                responseData = {'message': 'Updated Successfully'};
              })
              .catch((err) => {
                  error = true;
              })
        }

        return [error, responseData];
    }

    this.tagEntityMappingTagTypeSelect = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_category_id,
            request.tag_type_id,
            request.page_start || 0,
            request.page_limit || 50
        );
        const queryString = util.getQueryString('ds_p1_tag_entity_mapping_select_tag_type', paramsArr);
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

    this.rolesCountbySipFlag = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_select_sip_count', paramsArr);
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
    
    async function updateTagEntityMapping(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.tag_id, 
            request.tag_type_id, 
            request.tag_type_category_id, 
            request.tag_activity_type_id, 
            request.tag_asset_id, 
            request.log_asset_id, 
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_tag_entity_mapping_update_activity_type', paramsArr);
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

    this.updateTagEntitiesMapping = async (request) => {
        try {
            try {
                request.tag_activity_type_ids = JSON.parse(request.tag_activity_type_ids);
            } catch(e) {
                console.log("Error while parsing tag_activity_type_ids");
            }

            for(let tagActivityTypeId of request.tag_activity_type_ids) {
                request.tag_activity_type_id = tagActivityTypeId;
                let [error, response] = await updateTagEntityMapping(request);

                if(error) {
                    return [error, response];
                }
            }

            return [false, []];
        } catch(e) {
            console.log("Error updateTagEntitiesMapping", e, e.stack);
        }
    }
    this.selectCommonCurrency = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_common_currency_master_select', paramsArr);
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

    this.setCalenderProcessAsDefault = async (request) => {
        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.activity_type_id, 
            request.activity_type_category_id, 
            request.flag_default || 0, 
            request.log_asset_id, 
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_update_flag_default', paramsArr);
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

    this.selectDefaultCalenderFlag = async (request) => {
        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.account_id, 
            request.workforce_id, 
            request.activity_type_category_id
        );
        
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_select_flag_default', paramsArr);
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

    this.lovTypeList = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.lov_type_category_id,
          request.start_from,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_lov_type_list_select', paramsArr);

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

    this.getWorkflowFormFields = async (request) =>{
       let responseData = [],
           error = true;

       const paramsArr = new Array(
           request.organization_id,
           request.activity_type_id,
           request.form_id,
           request.data_type_id,
           request.start_from || 0,
           request.limit_value || 1
       );
       const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_select_workflow_fields', paramsArr);

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

    this.getAllOrganization = async (request) =>{
        let responseData = [],
            error = true;
 
        const paramsArr = new Array(
            request.is_search || 0,
            request.organization_name || ""
        );
        const queryString = util.getQueryString('ds_p1_organization_list_select_search_name', paramsArr);
 
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

     this.getOrgListSupportWorkflow = async (request) =>{
        let responseData = [],
            error = true;
 
        const paramsArr = new Array(
            request.form_id,
            request.form_activity_type_id,
            request.form_activity_type_category_id
        );
        const queryString = util.getQueryString('ds_v2_form_entity_mapping_select_form', paramsArr);
 
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

     this.applicationTagTypeMappingSelect = async (request) =>{
        let responseData = [],
            error = true;
 
        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_id
        );
        const queryString = util.getQueryString('ds_v1_application_tag_type_mapping_select_tag_type', paramsArr);
 
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

     this.adminRomsConfigListSelect = async (request) =>{
        let responseData = [],
            error = true;
 
        const paramsArr = [request.activity_type_id];
        const queryString = util.getQueryString('ds_p1_roms_config_list_select', paramsArr);
 
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