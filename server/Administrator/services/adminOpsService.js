const AdminListingService = require("../services/adminListingService");

function AdminOpsService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;
    const adminListingService = new AdminListingService(objectCollection);
    const moment = require('moment');
    const makeRequest = require('request');
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

                    // Populate asset types to the new workflow created
                    workforceData = appendAssetTypesToWorkforceData(workforceData, assetType, assetTypeData);

                }
            }

        }

        // 
        return [false, {}];
    }

    // Create Asset Bundle
    async function createAssetBundle(request, workforceID, organizationID, accountID) {
        // Performs multiple steps
        // 1. Asset List Insert
        // 2. Asset List History Insert
        // 3. Asset Timeline Transaction Insert
        // 4. Fire Create Activity Service


        // 1. Asset List Insert
        const [errOne, assetData] = await assetListInsert(request, workforceID, organizationID, accountID);
        if (errOne || Number(assetData.length) === 0) {
            console.log("createAssetBundle | Error: ", errOne);
            return [true, {
                message: "Error at assetListInsert"
            }]
        }

        if (Number(assetData.length) > 0) {
            const assetID = assetData[0].asset_id;
            request.asset_id = assetID;

            // 2. Asset List History Insert

            try {
                assetListHistoryInsert({
                    asset_id: assetID,
                    update_type_id: 0
                }, organizationID);
            } catch (error) {
                console.log("createAssetBundle | Asset List History Insert | Error: ", error);
            }

            // 3. Asset Timeline Transaction Insert
            const [errTwo, assetTimelineData] = await assetTimelineTransactionInsert(request, workforceID, organizationID, accountID);
            if (errTwo) {
                console.log("createAssetBundle | Asset Timeline Transaction Insert | Error: ", errTwo);
            }

            // 4. Fire Create Activity Service
            // Fetch activity types
            const [errThree, activityTypeMappingData] = await adminListingService.workforceActivityTypeMappingSelectCategory(request);
            if (errThree || Number(activityTypeMappingData.length) === 0) {
                console.log("createAssetBundle | Error: ", errThree);
                return [true, {
                    message: "Error fetching activityTypeMappingData data"
                }]
            }
            if (activityTypeMappingData.length > 0) {
                request.activity_type_id = activityTypeMappingData[0].activity_type_id;
            }
            let activityInlineData = JSON.parse(request.activity_inline_data);
            activityInlineData.contact_asset_id = assetID;
            request.activity_inline_data = JSON.stringify(activityInlineData);

            const [errFour, activityData] = await createActivity(request, workforceID, organizationID, accountID);
            if (errFour) {
                console.log("createAssetBundle | createActivity | Error: ", errFour);
                return [true, {
                    message: "Error creating activity"
                }]
            }
            console.log("createAssetBundle | createActivity | activityData: ", activityData);

            return [false, {
                asset_id: assetID,
                activity_id: activityData.response.activity_id
            }]
        }
    }

    // Asset List Insert
    async function assetListInsert(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_first_name || '',
            request.asset_last_name || '',
            request.asset_description || '',
            request.gender_id || 4,
            request.customer_unique_id || '',
            request.asset_image_path || '',
            request.id_card_json || '{}',
            request.country_code || 1,
            request.phone_number || 0,
            request.email_id || '',
            request.password || '',
            request.timezone_id || 22,
            request.asset_type_id,
            request.operating_asset_id || 0,
            request.manager_asset_id || 0,
            workforceID,
            accountID,
            organizationID,
            request.log_asset_id || 1,
            util.getCurrentUTCTime(),
            request.joined_datetime || util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_1_asset_list_insert', paramsArr);

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

    // Asset List History Insert
    async function assetListHistoryInsert(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            organizationID,
            request.update_type_id || 0, // Update Type ID => 0
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_history_insert', paramsArr);

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

    // Asset Timeline Transaction Insert
    async function assetTimelineTransactionInsert(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            workforceID,
            accountID,
            organizationID,
            request.stream_type_id,
            request.entity_type_id || 0,
            request.entity_text_1 || '',
            request.entity_text_2 || '',
            request.location_latitude || 0,
            request.location_longitude || 0,
            request.track_gps_accuracy || 0,
            request.gps_enabled || 0,
            request.location_address || '',
            util.getCurrentUTCTime(), // location_datetime
            request.device_os_id || 5,
            request.device_os_name || '',
            request.device_os_version || 0,
            request.app_version || 0,
            request.api_version || 0,
            request.log_asset_id || 1,
            util.getMessageUniqueId(request.asset_id),
            request.log_retry || 0,
            request.log_offline || 0,
            util.getCurrentUTCTime(), // transaction_datetime,
            util.getCurrentUTCTime() // updated datetime 
        );
        const queryString = util.getQueryString('ds_p1_asset_timeline_transaction_insert', paramsArr);

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

    // Create Activity Service
    async function createActivity(request, workforceID, organizationID, accountID) {

        const addActivityRequest = {
            organization_id: organizationID,
            account_id: accountID,
            workforce_id: workforceID,
            asset_id: request.asset_id,
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            asset_message_counter: 0,
            activity_title: request.activity_title || '',
            activity_description: request.activity_description || '',
            activity_inline_data: request.activity_inline_data || '{}',
            activity_datetime_start: util.getCurrentUTCTime(),
            activity_datetime_end: util.getCurrentUTCTime(),
            activity_type_category_id: request.activity_type_category_id || 0,
            activity_sub_type_id: 0,
            activity_type_id: request.activity_type_id,
            activity_access_role_id: request.activity_access_role_id,
            asset_participant_access_id: 0,
            activity_parent_id: request.activity_parent_id || 0,
            flag_pin: 0,
            flag_priority: 0,
            activity_flag_file_enabled: -1,
            activity_form_id: 0,
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(31993),
            activity_channel_id: 0,
            activity_channel_category_id: 0,
            activity_flag_response_required: 0,
            track_latitude: 0.0,
            track_longitude: 0.0,
            track_altitude: 0,
            track_gps_datetime: util.getCurrentUTCTime(),
            track_gps_accuracy: 0,
            track_gps_status: 0,
            service_version: "3.0",
            app_version: "3.0.0",
            device_os_id: 5
        };

        const addActivityAsync = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form: addActivityRequest
        };
        try {
            // global.config.mobileBaseUrl + global.config.version
            const response = await addActivityAsync('https://stagingapi.worlddesk.cloud/r0' + '/activity/add/v1', makeRequestOptions);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                console.log("createActivity | addActivityAsync | Body: ", body);
                return [false, body];
            }
        } catch (error) {
            console.log("createActivity | addActivityAsync | Error: ", error);
            return [true, {}];
        }
    }

    // Append AssetTypes to WorkforceData
    function appendAssetTypesToWorkforceData(workforceData, assetType, assetTypeData) {
        switch (Number(assetType.asset_type_category_id)) {
            case 2: // Employee
                workforceData[0]['employee_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 3: // Employee Desk
                workforceData[0]['desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 4: // Team Floor Admin Desk
                workforceData[0]['team_floor_admin_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 5: // Server Room Desk
                workforceData[0]['server_room_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 6: // Storage Management Desk
                workforceData[0]['file_room_desk_asset_type_id'] = assetTypeData[0].asset_type_id; // REMOVE
                workforceData[0]['storage_management_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 7: // Access Management Desk
                workforceData[0]['reception_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 8: // Register Management
                workforceData[0]['situatuion_room_desk_asset_type_id'] = assetTypeData[0].asset_type_id; // REMOVE
                workforceData[0]['register_management_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 9: // Workflow Management
                workforceData[0]['tv_monitor_room_desk_asset_type_id'] = assetTypeData[0].asset_type_id; // REMOVE
                workforceData[0]['workflow_management_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 10: // Project Room Desk
                workforceData[0]['project_room_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 11: // PM Floor Admin Desk
                workforceData[0]['pm_floor_admin_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 12: // HR Administration desk
                workforceData[0]['hrm_floor_admin_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 16: // Data Collection Floor Admin Desk
                workforceData[0]['dc_floor_admin_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 17: // Exports Room Desk
                workforceData[0]['exports_room_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 18: // Operations Management Desk
                workforceData[0]['map_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 19: // Service Agents Desk
                workforceData[0]['service_agent_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 20: // CRM Floor Admin Desk
                workforceData[0]['crm_floor_admin_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 21: // Access Management Desk
                workforceData[0]['employee_reception_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 22: // Visitor Management Desk
                workforceData[0]['visitor_reception_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 23: // Building Management Desk
                workforceData[0]['lobby_floor_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 24: // 4 to 6 People Meeting Room
                workforceData[0]['employee_meeting_room_4to6'] = assetTypeData[0].asset_type_id;
                break;
            case 25: // 7 to 12 People Meeting Room
                workforceData[0]['employee_meeting_room_7to12'] = assetTypeData[0].asset_type_id;
                break;
            case 26: // 13 to 20 People Meeting Room
                workforceData[0]['employee_meeting_room_13to25'] = assetTypeData[0].asset_type_id; // REMOVE
                workforceData[0]['employee_meeting_room_13to20'] = assetTypeData[0].asset_type_id;
                break;
            case 27: // 20+ People Meeting Room
                workforceData[0]['employee_meeting_room_26plus'] = assetTypeData[0].asset_type_id; // REMOVE
                workforceData[0]['employee_meeting_room_20plus'] = assetTypeData[0].asset_type_id;
                break;
            case 42: // Consultants
                workforceData[0]['consultant_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
            case 43: // Mail Management Desk
                workforceData[0]['hrm_mail_management_desk_asset_type_id'] = assetTypeData[0].asset_type_id;
                break;
        }
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

    this.addNewDeskToWorkforce = async function (request) {

        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        // Append some essential data
        request.stream_type_id = request.stream_type_id || 11018;
        request.log_asset_id = request.log_asset_id || request.asset_id;
        request.activity_type_category_id = 5;
        request.activity_title = request.asset_first_name;
        request.activity_description = request.asset_first_name;
        request.activity_access_role_id = 10;
        request.activity_parent_id = 0;

        request.activity_inline_data = JSON.stringify({
            contact_profile_picture: '',
            contact_first_name: request.asset_first_name,
            contact_last_name: request.asset_last_name,
            contact_designation: request.asset_first_name,
            contact_location: '',
            contact_phone_country_code: 0,
            contact_phone_number: '',
            contact_department: request.workforce_name, // workforce name
            contact_email_id: '',
            contact_asset_type_id: request.asset_type_id,
            contact_organization: request.organization_name,
            contact_asset_id: 0,
            contact_workforce_id: request.workforce_id,
            contact_account_id: request.account_id,
            contact_organization_id: request.organization_id,
            contact_operating_asset_name: '',
            contact_operating_asset_id: ''
        });

        // Create the asset
        const [errOne, assetData] = await createAssetBundle(request, workforceID, organizationID, accountID);
        if (errOne) {
            return [true, {
                message: "Error creating a new desk on the workforce"
            }]
        }

        // Update Asset Status
        // Check if the desk is of type employee desk
        if (Number(request.asset_type_category_id) === 3) {
            try {
                request.asset_status_id = request.asset_status_id || 3;
                request.asset_id = assetData.asset_id;
                await assetListUpdateAssetStatus(request, organizationID)
            } catch (error) {
                console.log("addNewDeskToWorkforce | assetListUpdateAssetStatus | Error: ", error);
            }
        }

        // Asset List History Insert
        try {
            await assetListHistoryInsert({
                asset_id: assetData.asset_id,
                update_type_id: 207
            }, organizationID);
        } catch (error) {
            console.log("createAssetBundle | Asset List History Insert | Error: ", error);
        }

        // Update Desk Position
        const [errTwo, workforceAssetCountData] = await adminListingService.assetListSelectCountAssetTypeWorkforce({
            organization_id: organizationID,
            account_id: accountID,
            workforce_id: workforceID,
            asset_type_category_id: request.asset_type_category_id
        });
        if (errTwo) {
            console.log("createAssetBundle | workforceAssetCountData | Error: ", err);

        } else if (workforceAssetCountData.length > 0) {
            let count = workforceAssetCountData[0].count;
            try {
                await assetListUpdateAssetDeskPositionIndex({
                    asset_id: assetData.asset_id,
                    old_position: count,
                    position: parseInt(count) + 1,
                    log_asset_id: assetData.asset_id
                }, workforceID, organizationID, accountID);

                // Asset Timeline Transaction Insert
                let assetTimelineTxnRequest = Object.assign({}, request);
                assetTimelineTxnRequest.asset_id = assetData.asset_id;
                assetTimelineTxnRequest.stream_type_id = 11023;

                await assetTimelineTransactionInsert(request, workforceID, organizationID, accountID);

            } catch (error) {
                console.log("createAssetBundle | assetListUpdateAssetDeskPositionIndex | Error: ", error);
            }
        }

        return [false, assetData]
    }

    // Asset List Status Update
    async function assetListUpdateAssetStatus(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            organizationID,
            request.asset_type_category_id,
            request.asset_status_id,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_asset_status', paramsArr);

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

    // Asset List Status Update
    async function assetListUpdateAssetDeskPositionIndex(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            workforceID,
            accountID,
            organizationID,
            request.old_position,
            request.position,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_asset_desk_position_index', paramsArr);

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
