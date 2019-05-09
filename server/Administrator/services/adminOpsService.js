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
            console.log("createAssetBundle | assetListInsert | assetData: ", assetData);
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
            if (Number(request.activity_type_category_id) === 5) {
                // Co-Worker Contact Card
                activityInlineData.contact_asset_id = assetID;

            } else if (Number(request.activity_type_category_id) === 4) {
                // ID Card
                // QR Code
                const qrCode = organizationID + "|" + accountID + "|0|" + assetID + "|" + request.desk_asset_first_name + "|" + request.asset_first_name;
                activityInlineData.employee_qr_code = qrCode;
                activityInlineData.employee_asset_id = assetID;
            }
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
            const response = await addActivityAsync(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', makeRequestOptions);
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
        request.activity_type_category_id = 5; // Co-Worker Contact Card
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

                await assetTimelineTransactionInsert(assetTimelineTxnRequest, workforceID, organizationID, accountID);

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

    this.addNewEmployeeToExistingDesk = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        // Append some essential data
        request.stream_type_id = request.stream_type_id || 11006;
        request.log_asset_id = request.log_asset_id || request.asset_id;
        request.activity_type_category_id = 4; // ID Card
        request.activity_title = request.asset_first_name;
        request.activity_description = request.asset_first_name;
        request.activity_access_role_id = 8;
        request.activity_parent_id = 0;

        request.activity_inline_data = JSON.stringify({
            employee_profile_picture: "",
            employee_first_name: request.asset_first_name,
            employee_last_name: request.asset_last_name,
            employee_id: request.customer_unique_id,
            employee_designation: request.desk_asset_first_name || '',
            employee_department: request.workforce_name,
            employee_location: (request.account_city) ? request.account_city : '',
            employee_organization: request.organization_name,
            employee_qr_code: '',
            employee_date_joining: util.getCurrentUTCTime(),
            employee_id_card_date_expiry: util.getCurrentUTCTime(),
            employee_asset_id: '',
            employee_account_id: request.account_id,
            employee_workforce_id: request.workforce_id,
            employee_organization_id: request.organization_id,
            employee_home_city: '',
            employee_office_city: (request.account_city) ? request.account_city : '',
            employee_phone_number: request.phone_number,
            employee_phone_country_code: request.country_code,
            employee_email_id: request.email_id
        });

        // Create the asset
        const [errOne, assetData] = await createAssetBundle(request, workforceID, organizationID, accountID);
        if (errOne) {
            console.log("addNewEmployeeToExistingDesk | createAssetBundle | Error: ", errOne);
            return [true, {
                message: "Error creating a new employee in the workforce"
            }]
        }


        const deskAssetID = Number(request.desk_asset_id),
            operatingAssetID = Number(assetData.asset_id),
            idCardActivityID = Number(assetData.activity_id);

        request.operating_asset_id = Number(assetData.asset_id);
        // Add a new access mapping for employee asset to the desk asset 
        // if the desk type is employee desk
        try {
            await updateInsertEmployeeToDeskAccessMapping(
                request, deskAssetID,
                operatingAssetID, idCardActivityID,
                workforceID, organizationID, accountID
            );
        } catch (error) {
            console.log("addNewEmployeeToExistingDesk | updateInsertEmployeeToDeskAccessMapping | Error: ", error);
        }

        // Update ID Card of the Employee
        const [errTwo, deskAssetDataFromDB] = await adminListingService.assetListSelect({
            organization_id: organizationID,
            asset_id: deskAssetID
        });
        if (!errTwo && Number(deskAssetDataFromDB.length) > 0) {
            // Update Inline Data
            let activityInlineData = JSON.parse(request.activity_inline_data);
            activityInlineData.employee_designation = deskAssetDataFromDB[0].asset_first_name;
            request.activity_inline_data = JSON.stringify(activityInlineData);

            // Activity List
            try {
                await activityListUpdateInlineData({
                    activity_id: idCardActivityID,
                    activity_inline_data: request.activity_inline_data
                }, organizationID);
            } catch (error) {
                console.log("addNewEmployeeToExistingDesk | activityListUpdateInlineData | Error: ", error);
            }

            // Activity Asset Mapping
            try {
                await activityAssetMappingUpdateInlineData({
                    activity_id: idCardActivityID,
                    asset_id: operatingAssetID,
                    activity_inline_data: request.activity_inline_data,
                    pipe_separated_string: '',
                    log_asset_id: request.log_asset_id
                }, organizationID);
            } catch (error) {
                console.log("addNewEmployeeToExistingDesk | activityAssetMappingUpdateInlineData | Error: ", error);
            }
        }

        // Update ID Card status
        const [errThree, workforceActivityStatusMappingData] = await adminListingService.workforceActivityStatusMappingSelectStatus({
            organization_id: organizationID,
            account_id: accountID,
            workforce_id: workforceID,
            activity_status_type_id: 8
        });
        if (!errThree && Number(workforceActivityStatusMappingData.length) > 0) {
            // Update in Activity List
            try {
                await activityListUpdateStatus({
                    activity_id: idCardActivityID,
                    activity_status_id: workforceActivityStatusMappingData[0].activity_status_id,
                    activity_status_type_id: 8
                }, workforceID, organizationID, accountID);
            } catch (error) {
                console.log("addNewEmployeeToExistingDesk | activityListUpdateStatus | Error: ", error);
            }

            // Update Activity Asset Mapping
            try {
                await activityAssetMappingUpdateStatus({
                    activity_id: idCardActivityID,
                    asset_id: operatingAssetID,
                    activity_status_id: workforceActivityStatusMappingData[0].activity_status_id,
                    activity_status_type_id: 8
                }, workforceID, organizationID, accountID);
            } catch (error) {
                console.log("addNewEmployeeToExistingDesk | activityAssetMappingUpdateStatus | Error: ", error);
            }
        }

        // Fetch and update Co-Worker Contact Card of the asset
        let coWorkerContactCardActivityID = 0;
        const [errFour, coWorkerContactCardData] = await adminListingService.activityListSelectCategoryAsset({
            asset_id: deskAssetID,
            organization_id: organizationID,
            activity_type_category_id: 5
        });
        if (!errFour && Number(coWorkerContactCardData.length) > 0) {
            coWorkerContactCardActivityID = coWorkerContactCardData[0].activity_id;
            let contactCardInlineData = JSON.parse(coWorkerContactCardData[0].activity_inline_data);

            contactCardInlineData.contact_phone_country_code = request.country_code;
            contactCardInlineData.contact_phone_number = request.phone_number;
            contactCardInlineData.contact_operating_asset_name = request.asset_first_name;
            contactCardInlineData.contact_operating_asset_id = operatingAssetID;
            // 
            try {
                await activityListUpdateOperatingAssetData({
                    activity_id: coWorkerContactCardActivityID,
                    activity_inline_data: JSON.stringify(contactCardInlineData),
                    asset_id: deskAssetID,
                    operating_asset_id: operatingAssetID
                }, organizationID);
            } catch (error) {
                console.log("addNewEmployeeToExistingDesk | activityListUpdateOperatingAssetData | Error: ", error);
            }
            // History Insert
            try {
                await activityListHistoryInsert({
                    activity_id: coWorkerContactCardActivityID,
                    update_type_id: 405
                }, organizationID);
            } catch (error) {
                console.log("addNewEmployeeToExistingDesk | activityListUpdateOperatingAssetData | activityListHistoryInsert | Error: ", error);
            }
            // Activity Asset Mapping Update
            try {
                await activityAssetMappingUpdateInlineData({
                    activity_id: coWorkerContactCardActivityID,
                    asset_id: operatingAssetID,
                    activity_inline_data: JSON.stringify(contactCardInlineData),
                    pipe_separated_string: '',
                    log_asset_id: request.log_asset_id
                }, organizationID);
            } catch (error) {
                console.log("addNewEmployeeToExistingDesk | Co-Worker | activityAssetMappingUpdateInlineData | Error: ", error);
            }
            // Activity Asset Mapping Update Operating Asset Data
            try {
                await activityAssetMappingUpdateOperationAssetData({
                    activity_id: coWorkerContactCardActivityID,
                    activity_inline_data: JSON.stringify(contactCardInlineData),
                    asset_id: deskAssetID,
                    operating_asset_id: operatingAssetID
                }, organizationID);
            } catch (error) {
                console.log("addNewEmployeeToExistingDesk | Co-Worker | activityAssetMappingUpdateOperationAssetData | Error: ", error);
            }
            // History Insert
            try {
                await activityListHistoryInsert({
                    activity_id: coWorkerContactCardActivityID,
                    update_type_id: 407
                }, organizationID);
            } catch (error) {
                console.log("addNewEmployeeToExistingDesk | activityAssetMappingUpdateOperationAssetData | activityListHistoryInsert | Error: ", error);
            }
        }

        return [false, {
            desk_asset_id: deskAssetID,
            coworker_contact_card_activity_id: coWorkerContactCardActivityID,
            operating_asset_id: operatingAssetID,
            id_card_activity_id: idCardActivityID
        }];

    }

    async function updateInsertEmployeeToDeskAccessMapping(request, deskAssetID, operatingAssetID, idCardActivityID, workforceID, organizationID, accountID) {
        // Fetch desk asset details
        const [errOne, deskAssetData] = await adminListingService.assetListSelect({
            organization_id: organizationID,
            asset_id: deskAssetID
        });
        if (errOne || Number(deskAssetData.length) === 0) {
            console.log("updateInsertEmployeeToDeskAccessMapping | assetListSelect | Error: ", errOne);
            return [true, {
                message: "Error fetching desk asset details"
            }];
        }
        try {
            await assetListUpdateDesk({
                asset_id: deskAssetData[0].asset_id,
                asset_first_name: deskAssetData[0].asset_first_name,
                asset_last_name: deskAssetData[0].asset_last_name,
                asset_type_id: deskAssetData[0].asset_type_id,
                operating_asset_id: operatingAssetID,
                manager_asset_id: 0,
                log_asset_id: request.log_asset_id
            }, workforceID, organizationID, accountID);
        } catch (error) {
            console.log("updateInsertEmployeeToDeskAccessMapping | assetListUpdateDesk | Error: ", error);
        }
        // Update employee and desk asset statuses
        try {
            // Update desk asset status to employee assigned
            await assetListUpdateAssignedStatus({
                asset_id: deskAssetID,
                assigned_status_id: 6,
                log_asset_id: request.log_asset_id
            }, organizationID);

            // Update employee asset status to employee assigned
            await assetListUpdateAssignedStatus({
                asset_id: operatingAssetID,
                assigned_status_id: 6,
                log_asset_id: request.log_asset_id
            }, organizationID);

        } catch (error) {
            console.log("updateInsertEmployeeToDeskAccessMapping | assetListUpdateAssignedStatus | Error: ", error);
        }
        // Update relevant records
        // Asset List History Insert
        try {
            await assetListHistoryInsert({
                asset_id: deskAssetID,
                update_type_id: 210
            }, organizationID);
        } catch (error) {
            console.log("updateInsertEmployeeToDeskAccessMapping | Asset List History Insert | Error: ", error);
        }
        // Asset Timeline Transaction Insert
        try {
            let assetTimelineTxnRequest = Object.assign({}, request);
            assetTimelineTxnRequest.asset_id = deskAssetID;
            assetTimelineTxnRequest.stream_type_id = 11006;

            await assetTimelineTransactionInsert(assetTimelineTxnRequest, workforceID, organizationID, accountID);
        } catch (error) {
            console.log("updateInsertEmployeeToDeskAccessMapping | assetTimelineTransactionInsert | Error: ", error);
        }

        // Check for existing employee <==> desk asset access mappings
        const [errTwo, assetAccessMapData] = await adminListingService.assetAccessMappingSelectA2aMapping({
            organization_id: organizationID,
            account_id: accountID,
            workforce_id: workforceID,
            asset_id: deskAssetID,
            user_asset_id: operatingAssetID
        });
        if (errTwo) {
            console.log("updateInsertEmployeeToDeskAccessMapping | assetAccessMappingSelectA2aMapping | Error: ", errTwo);
            // return [true, {
            //     message: "Error fetching asset access mapping data"
            // }];
        }
        if (Number(assetAccessMapData.length) > 0 && Number(assetAccessMapData[0].log_state) === 3) {
            // Un-archive the archived record
            const userMappingID = assetAccessMapData[0].user_mapping_id;
            try {
                await assetAccessMappingUpdateLogState({
                    user_mapping_id: userMappingID,
                    log_state: 2,
                    user_asset_id: operatingAssetID,
                    workforce_id: workforceID,
                    organization_id: organizationID,
                    asset_id: deskAssetID
                });
            } catch (error) {
                console.log("updateInsertEmployeeToDeskAccessMapping | assetAccessMappingUpdateLogState | Error: ", error);
            }
            // History Insert
            try {
                await assetAccessMappingHistoryInsert({
                    user_mapping_id: userMappingID,
                    organization_id: organizationID,
                    update_type_id: 303
                });
            } catch (error) {
                console.log("updateInsertEmployeeToDeskAccessMapping | assetAccessMappingHistoryInsert | Error: ", error);
            }

        } else {
            // Make a new entry
            const [errThree, newAssetAccessMappingEntry] = await assetAccessMappingInsert({
                login_asset_id: operatingAssetID,
                asset_email_id: request.asset_email_id,
                asset_access_role_id: request.asset_access_role_id,
                asset_access_level_id: request.asset_access_level_id,
                asset_id: deskAssetID,
                asset_type_id: request.asset_type_id,
                activity_id: 0,
                activity_type_id: 0,
                log_asset_id: request.log_asset_id
            }, workforceID, organizationID, accountID);

            // History Insert
            try {
                await assetAccessMappingHistoryInsert({
                    user_mapping_id: newAssetAccessMappingEntry[0].user_mapping_id,
                    organization_id: organizationID,
                    update_type_id: 0
                });
            } catch (error) {
                console.log("updateInsertEmployeeToDeskAccessMapping | assetAccessMappingHistoryInsert | Error: ", error);
            }
        }
    }

    // Asset List Update Desk
    async function assetListUpdateDesk(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            workforceID,
            accountID,
            organizationID,
            request.asset_first_name,
            request.asset_last_name,
            request.asset_type_id,
            request.operating_asset_id,
            request.manager_asset_id,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_desk', paramsArr);

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

    // Asset List Update the Asset Status
    async function assetListUpdateAssignedStatus(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            organizationID,
            request.assigned_status_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_assigned_status', paramsArr);

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

    // If the asset mapping is currently archived (log_state = 3), then reactivate the asset mapping (log_state < 3)
    async function assetAccessMappingUpdateLogState(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.user_mapping_id,
            request.log_state,
            request.user_asset_id,
            request.workforce_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_access_mapping_update_log_state', paramsArr);

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

    // User Access Mapping History Insert
    async function assetAccessMappingHistoryInsert(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.user_mapping_id || 0,
            request.organization_id,
            request.update_type_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_access_mapping_history_insert', paramsArr);

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

    // User Access Mapping History Insert
    async function assetAccessMappingInsert(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.login_asset_id,
            request.asset_email_id,
            request.asset_access_role_id,
            request.asset_access_level_id,
            request.asset_id, // Desk Asset ID
            request.asset_type_id,
            request.activity_id,
            request.activity_type_id,
            workforceID,
            accountID,
            organizationID,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_access_mapping_insert', paramsArr);

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

    // Update the desk details in the inline data of the co-worker contact card or ID card 
    // activity of the operating employee
    async function activityListUpdateInlineData(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            organizationID,
            request.activity_inline_data,
            request.pipe_separated_string || '',
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_activity_list_update_inline_data', paramsArr);

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

    // Update the desk details in the inline data of the co-worker contact card 
    // or ID Card activity of the operating employee in all the collaborator mappings
    async function activityAssetMappingUpdateInlineData(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.asset_id,
            organizationID,
            request.activity_inline_data,
            request.pipe_separated_string,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_inline_data', paramsArr);

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

    // Update the desk details in the inline data of the co-worker contact card 
    // or ID Card activity of the operating employee in all the collaborator mappings
    async function activityListUpdateStatus(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.activity_id,
            request.activity_status_id,
            request.activity_status_type_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_activity_list_update_status', paramsArr);

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

    // Update the status of the co-worker contact card and ID Card activity of the 
    // employee asset to archived for all the collaborator mappings
    async function activityAssetMappingUpdateStatus(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.activity_id,
            request.asset_id,
            request.activity_status_id,
            request.activity_status_type_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_status', paramsArr);

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

    // Update operating asset information
    async function activityListUpdateOperatingAssetData(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            organizationID,
            request.activity_inline_data,
            request.pipe_separated_string || '',
            util.getCurrentUTCTime(),
            request.asset_id,
            request.operating_asset_id
        );
        const queryString = util.getQueryString('ds_p1_activity_list_update_operating_asset_data', paramsArr);

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

    // Update operating asset information
    async function activityListHistoryInsert(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            request.activity_id,
            request.update_type_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_activity_list_history_insert', paramsArr);

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

    // Update operating asset information in activity
    async function activityAssetMappingUpdateOperationAssetData(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            organizationID,
            request.activity_inline_data,
            request.pipe_separated_string || '',
            util.getCurrentUTCTime(),
            request.asset_id,
            request.operating_asset_id
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_operation_asset_data', paramsArr);

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

    this.removeEmployeeMappedToDesk = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id),
            deskAssetID = Number(request.desk_asset_id),
            operatingAssetID = Number(request.operating_asset_id);

        // Fetch desk asset details
        const [errOne, deskAssetDataFromDB] = await adminListingService.assetListSelect({
            organization_id: organizationID,
            asset_id: deskAssetID
        });
        if (errOne && Number(deskAssetDataFromDB.length) === 0) {
            console.log("removeEmployeeMappedToDesk | assetListSelect | Error: ", errOne);
            console.log("removeEmployeeMappedToDesk | assetListSelect | deskAssetDataFromDB | Length: ", deskAssetDataFromDB.length);

            return [true, {
                message: "Error fetching desk asset details"
            }];
        }
        // Reset operating asset details on the desk asset
        const [errTwo, _] = await assetListUpdateDesk({
            asset_id: deskAssetID,
            asset_first_name: deskAssetDataFromDB[0].asset_first_name,
            asset_last_name: deskAssetDataFromDB[0].asset_last_name,
            asset_type_id: deskAssetDataFromDB[0].asset_type_id,
            operating_asset_id: 0, // operatingAssetID
            manager_asset_id: 0,
            log_asset_id: request.log_asset_id
        }, workforceID, organizationID, accountID);

        if (errTwo) {
            console.log("removeEmployeeMappedToDesk | assetListUpdateDesk | Error: ", error);
            return [true, {
                message: "Error resetting operating asset details on the desk asset"
            }];
        }

        // Desk Asset List History Insert
        try {
            assetListHistoryInsert({
                asset_id: deskAssetID,
                update_type_id: 207
            }, organizationID);
        } catch (error) {
            console.log("removeEmployeeMappedToDesk | Desk Asset List History Insert | 1 | Error: ", error);
        }
        // Asset Timeline Transaction Insert
        try {
            let assetTimelineTxnRequest = Object.assign({}, request);
            assetTimelineTxnRequest.asset_id = deskAssetID;
            assetTimelineTxnRequest.stream_type_id = 11021;

            await assetTimelineTransactionInsert(assetTimelineTxnRequest, workforceID, organizationID, accountID);
        } catch (error) {
            console.log("removeEmployeeMappedToDesk | Desk Asset Timeline Transaction Insert | 1 | Error: ", error);
        }
        // Update Desk Asset Status to to employee access revoked
        try {
            await assetListUpdateAssetStatus({
                asset_id: deskAssetID,
                asset_type_category_id: deskAssetDataFromDB[0].asset_type_category_id,
                asset_status_id: 4,
                log_asset_id: request.log_asset_id
            }, organizationID)
        } catch (error) {
            console.log("removeEmployeeMappedToDesk | assetListUpdateAssetStatus | Error: ", error);
        }
        // Desk Asset List History Insert
        try {
            assetListHistoryInsert({
                asset_id: deskAssetID,
                update_type_id: 302
            }, organizationID);
        } catch (error) {
            console.log("removeEmployeeMappedToDesk | Desk Asset List History Insert | 2 | Error: ", error);
        }
        // Asset Timeline Transaction Insert
        try {
            let assetTimelineTxnRequest = Object.assign({}, request);
            assetTimelineTxnRequest.asset_id = deskAssetID;
            assetTimelineTxnRequest.stream_type_id = 11010;

            await assetTimelineTransactionInsert(assetTimelineTxnRequest, workforceID, organizationID, accountID);
        } catch (error) {
            console.log("removeEmployeeMappedToDesk | Desk Asset Timeline Transaction Insert | 2 | Error: ", error);
        }
        // Unlink User | Call Service: /asset/link/reset
        try {
            await assetLinkReset(request, deskAssetDataFromDB, workforceID, organizationID, accountID);
        } catch (error) {
            console.log("removeEmployeeMappedToDesk | Unlink User | /asset/link/reset | Error: ", error);
        }

        // Fetch Asset Access Mappings, if any
        const [errThree, assetAccessMappingData] = await adminListingService.assetAccessMappingSelectAssetLevelAll({
            organization_id: organizationID,
            account_id: accountID,
            workforce_id: workforceID,
            asset_id: deskAssetID,
            start_from: 0,
            limit_value: 1
        });
        if (!errThree && Number(assetAccessMappingData.length) > 0) {
            const userMappingID = assetAccessMappingData[0].user_mapping_id;
            try {
                await assetAccessMappingDeleteSingle({
                    user_mapping_id: userMappingID,
                    asset_id: deskAssetID,
                    log_asset_id: request.asset_id
                }, workforceID, organizationID, accountID);
            } catch (error) {
                console.log("removeEmployeeMappedToDesk | assetAccessMappingDeleteSingle | Error: ", error);
            }
            // Asset List History Insert
            try {
                assetListHistoryInsert({
                    asset_id: deskAssetID,
                    update_type_id: 302
                }, organizationID);
            } catch (error) {
                console.log("removeEmployeeMappedToDesk | assetAccessMappingDeleteSingle | Asset List History Insert | Error: ", error);
            }
            // Asset Timeline Transaction Insert
            try {
                let assetTimelineTxnRequest = Object.assign({}, request);
                assetTimelineTxnRequest.asset_id = deskAssetID;
                assetTimelineTxnRequest.stream_type_id = 11010;

                await assetTimelineTransactionInsert(assetTimelineTxnRequest, workforceID, organizationID, accountID);
            } catch (error) {
                console.log("removeEmployeeMappedToDesk | assetAccessMappingDeleteSingle | Asset Timeline Transaction Insert | Error: ", error);
            }
        }

        /**
         * Update the co-worker contact card activity of the operating asset, that is reset the desk details
         * in the inline data and also in the asset columns in the row data of the co-worker contact card
         * activity of the operating employee
         */
        // Fetch and update Co-Worker Contact Card of the asset
        let coWorkerContactCardActivityID = 0;
        const [errFour, coWorkerContactCardData] = await adminListingService.activityListSelectCategoryAsset({
            asset_id: deskAssetID,
            organization_id: organizationID,
            activity_type_category_id: 5
        });
        if (!errFour && Number(coWorkerContactCardData.length) > 0) {
            coWorkerContactCardActivityID = coWorkerContactCardData[0].activity_id;
            let contactCardInlineData = JSON.parse(coWorkerContactCardData[0].activity_inline_data);

            contactCardInlineData.contact_phone_country_code = 0;
            contactCardInlineData.contact_phone_number = 0;
            contactCardInlineData.contact_operating_asset_name = '';
            contactCardInlineData.contact_operating_asset_id = 0;

            // Reset Operating Asset Data in Desk Asset Data
            try {
                await activityListUpdateOperatingAssetData({
                    activity_id: coWorkerContactCardActivityID,
                    activity_inline_data: JSON.stringify(contactCardInlineData),
                    asset_id: deskAssetID,
                    operating_asset_id: 0
                }, organizationID);
            } catch (error) {
                console.log("removeEmployeeMappedToDesk | Co-Worker | activityListUpdateOperatingAssetData | Error: ", error);
            }
            // Activity Asset Mapping Reset Operating Asset Data
            try {
                await activityAssetMappingUpdateOperationAssetData({
                    activity_id: coWorkerContactCardActivityID,
                    activity_inline_data: JSON.stringify(contactCardInlineData),
                    asset_id: deskAssetID,
                    operating_asset_id: 0
                }, organizationID);
            } catch (error) {
                console.log("removeEmployeeMappedToDesk | Co-Worker | activityAssetMappingUpdateOperationAssetData | Error: ", error);
            }
            // Activity List History Insert
            try {
                await activityListHistoryInsert({
                    activity_id: coWorkerContactCardActivityID,
                    update_type_id: 405
                }, organizationID);
            } catch (error) {
                console.log("removeEmployeeMappedToDesk | Co-Worker | activityListHistoryInsert | Error: ", error);
            }
            // Activity Asset Mapping Reset Operating Asset Data in the Contact Card's Inline Data
            try {
                await activityAssetMappingUpdateInlineData({
                    activity_id: coWorkerContactCardActivityID,
                    asset_id: deskAssetID,
                    activity_inline_data: JSON.stringify(contactCardInlineData),
                    pipe_separated_string: '',
                    log_asset_id: request.log_asset_id
                }, organizationID);
            } catch (error) {
                console.log("removeEmployeeMappedToDesk | Co-Worker | activityAssetMappingUpdateInlineData | Error: ", error);
            }
            // Activity Timeline Transaction Insert
            try {
                let activityTimelineTxnRequest = Object.assign({}, request);
                activityTimelineTxnRequest.activity_id = coWorkerContactCardActivityID;
                activityTimelineTxnRequest.asset_id = deskAssetID;
                activityTimelineTxnRequest.stream_type_id = 11010;

                await activityTimelineTransactionInsert(activityTimelineTxnRequest, workforceID, organizationID, accountID);
            } catch (error) {
                console.log("removeEmployeeMappedToDesk | Co-Worker | activityTimelineTransactionInsert | Error: ", error);
            }
        }

        // Update Desk Asset Status to Employee Not Assigned
        try {
            await assetListUpdateAssignedStatus({
                asset_id: deskAssetID,
                assigned_status_id: 0,
                log_asset_id: request.log_asset_id
            }, organizationID);

        } catch (error) {
            console.log("removeEmployeeMappedToDesk | Desk Asset | assetListUpdateAssignedStatus | Error: ", error);
        }
        // Update Employee Asset Status to Employee Not Assigned
        try {
            await assetListUpdateAssignedStatus({
                asset_id: operatingAssetID,
                assigned_status_id: 0,
                log_asset_id: request.log_asset_id
            }, organizationID);

        } catch (error) {
            console.log("removeEmployeeMappedToDesk | Employee Asset | assetListUpdateAssignedStatus | Error: ", error);
        }

        // Fetch the ID Card
        let idCardActivityID = 0,
            idCardActivityStatusID = 0;
        const [errFive, idCardData] = await adminListingService.activityListSelectCategoryAsset({
            asset_id: operatingAssetID,
            organization_id: organizationID,
            activity_type_category_id: 4
        });
        if (!errFive && Number(idCardData.length) > 0) {
            idCardActivityID = idCardData[0].activity_id;
        }
        // Fetch the relevant inactive activity status
        const [errSix, workforceActivityStatusMappingData] = await adminListingService.workforceActivityStatusMappingSelectStatus({
            organization_id: organizationID,
            account_id: accountID,
            workforce_id: workforceID,
            activity_status_type_id: 9
        });
        if (!errSix && Number(workforceActivityStatusMappingData.length) > 0) {
            idCardActivityStatusID = workforceActivityStatusMappingData[0].activity_status_id;
        }
        // Update the ID Card to Inactive Status
        if (idCardActivityID !== 0 && idCardActivityStatusID !== 0) {
            // Update Status in Activity List
            try {
                await activityListUpdateStatus({
                    activity_id: idCardActivityID,
                    activity_status_id: idCardActivityStatusID,
                    activity_status_type_id: 9
                }, workforceID, organizationID, accountID);
            } catch (error) {
                console.log("removeEmployeeMappedToDesk | ID Card | activityListUpdateStatus | Error: ", error);
            }

            // Update Status in Activity Asset Mapping
            try {
                await activityAssetMappingUpdateStatus({
                    activity_id: idCardActivityID,
                    asset_id: operatingAssetID,
                    activity_status_id: idCardActivityStatusID,
                    activity_status_type_id: 9
                }, workforceID, organizationID, accountID);
            } catch (error) {
                console.log("addNewEmployeeToExistingDesk | ID Card | activityAssetMappingUpdateStatus | Error: ", error);
            }
        }

        return [false, {
            operating_asset_id: operatingAssetID,
            id_card_activity_id: idCardActivityID,
            desk_asset_id: deskAssetID,
            coworker_contact_card_activity_id: coWorkerContactCardActivityID
        }];
    }

    // Unlink User | Service: /asset/link/reset
    async function assetLinkReset(request, assetDataFromDB, workforceID, organizationID, accountID) {

        const assetLinkResetRequest = {
            organization_id: organizationID,
            account_id: accountID,
            workforce_id: workforceID,
            asset_id: assetDataFromDB[0].asset_id,
            operating_asset_id: assetDataFromDB[0].operating_asset_id,
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            asset_message_counter: 0,
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

        const assetLinkResetAsync = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form: assetLinkResetRequest
        };
        try {
            // global.config.mobileBaseUrl + global.config.version
            const response = await assetLinkResetAsync(global.config.mobileBaseUrl + global.config.version + '/asset/link/reset', makeRequestOptions);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                console.log("assetLinkReset | assetLinkResetAsync | Body: ", body);
                return [false, body];
            }
        } catch (error) {
            console.log("assetLinkReset | assetLinkResetAsync | Error: ", error);
            return [true, {}];
        }
    }

    // Archive the employee asset mapping
    async function assetAccessMappingDeleteSingle(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.user_mapping_id,
            organizationID,
            accountID,
            workforceID,
            request.asset_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_access_mapping_delete_single', paramsArr);

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

    // Archive the employee asset mapping
    async function activityTimelineTransactionInsert(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_id,
            request.asset_id,
            workforceID,
            accountID,
            organizationID,
            request.stream_type_id,
            request.entity_date_1 || '',
            util.getCurrentUTCTime(), // entity_datetime_1
            request.entity_tinyint_1 || '',
            request.entity_bigint_1 || '',
            request.entity_double_1 || '',
            request.entity_decimal_1 || '',
            request.entity_decimal_2 || '',
            request.entity_decimal_3 || '',
            request.entity_text_1 || '',
            request.entity_text_2 || '',
            request.location_latitude || '',
            request.location_longitude || '',
            request.location_gps_accuracy || '',
            request.location_gps_enabled || '',
            request.location_address || '',
            util.getCurrentUTCTime(),
            request.device_manufacturer_name || '',
            request.device_model_name || '',
            request.device_os_id || 0,
            request.device_os_name || '',
            request.device_os_version || '',
            request.app_version || '',
            request.api_version || '',
            request.log_asset_id || request.asset_id,
            util.getMessageUniqueId(Number(request.log_asset_id || request.asset_id)),
            request.log_retry || 0,
            request.log_offline || 0,
            util.getCurrentUTCTime(), // transaction_datetime
            util.getCurrentUTCTime() // updated datetime
        );
        const queryString = util.getQueryString('ds_p1_activity_timeline_transaction_insert', paramsArr);

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

    // 
    this.archiveDeskIfEmployeeNotMapped = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id),
            deskAssetID = Number(request.desk_asset_id),
            operatingAssetID = Number(request.operating_asset_id);

        // Fetch desk asset details
        const [errOne, deskAssetDataFromDB] = await adminListingService.assetListSelect({
            organization_id: organizationID,
            asset_id: deskAssetID
        });
        if (errOne && Number(deskAssetDataFromDB.length) === 0) {
            console.log("archiveDeskIfEmployeeNotMapped | assetListSelect | Error: ", errOne);
            console.log("archiveDeskIfEmployeeNotMapped | assetListSelect | deskAssetDataFromDB | Length: ", deskAssetDataFromDB.length);

            return [true, {
                message: "Error fetching desk asset details"
            }];
        }

        // Delete/archive the desk asset
        const [errTwo, _] = await assetListDelete({
            asset_id: deskAssetID,
            log_asset_id: request.log_asset_id
        }, organizationID);
        if (errTwo) {
            console.log("archiveDeskIfEmployeeNotMapped | assetListDelete | Error: ", error);
            return [true, {
                message: "Error archiving desk asset"
            }];
        }

        // Asset List History Insert
        try {
            await assetListHistoryInsert({
                asset_id: deskAssetID,
                update_type_id: 204
            }, organizationID);
        } catch (error) {
            console.log("archiveDeskIfEmployeeNotMapped | Desk Asset List History Insert | Error: ", error);
        }

        // Desk Asset Timeline Transaction Insert
        try {
            let assetTimelineTxnRequest = Object.assign({}, request);
            assetTimelineTxnRequest.asset_id = deskAssetID;
            assetTimelineTxnRequest.stream_type_id = 11020;

            await assetTimelineTransactionInsert(assetTimelineTxnRequest, workforceID, organizationID, accountID);
        } catch (error) {
            console.log("archiveDeskIfEmployeeNotMapped | assetTimelineTransactionInsert | Error: ", error);
        }

        // Fetch and archive Co-Worker Contact Card of the desk asset
        let coWorkerContactCardActivityID = 0,
            contactCardActivityStatusID = 0;
        const [errThree, coWorkerContactCardData] = await adminListingService.activityListSelectCategoryAsset({
            asset_id: deskAssetID,
            organization_id: organizationID,
            activity_type_category_id: 5
        });
        if (!errThree && Number(coWorkerContactCardData.length) > 0) {
            coWorkerContactCardActivityID = coWorkerContactCardData[0].activity_id;
        }

        // Fetch the relevant archive activity status
        const [errFour, workforceActivityStatusMappingData] = await adminListingService.workforceActivityStatusMappingSelectStatus({
            organization_id: organizationID,
            account_id: accountID,
            workforce_id: workforceID,
            activity_status_type_id: 11
        });
        if (!errFour && Number(workforceActivityStatusMappingData.length) > 0) {
            contactCardActivityStatusID = workforceActivityStatusMappingData[0].activity_status_id;

            // Update in Activity List
            try {
                await activityListUpdateStatus({
                    activity_id: coWorkerContactCardActivityID,
                    activity_status_id: contactCardActivityStatusID,
                    activity_status_type_id: 11
                }, workforceID, organizationID, accountID);
            } catch (error) {
                console.log("archiveDeskIfEmployeeNotMapped | activityListUpdateStatus | Error: ", error);
            }

            // Update Activity Asset Mapping
            try {
                await activityAssetMappingUpdateStatus({
                    activity_id: coWorkerContactCardActivityID,
                    asset_id: deskAssetID,
                    activity_status_id: contactCardActivityStatusID,
                    activity_status_type_id: 11
                }, workforceID, organizationID, accountID);
            } catch (error) {
                console.log("archiveDeskIfEmployeeNotMapped | activityAssetMappingUpdateStatus | Error: ", error);
            }

            // History Insert
            try {
                await activityListHistoryInsert({
                    activity_id: coWorkerContactCardActivityID,
                    update_type_id: 402
                }, organizationID);
            } catch (error) {
                console.log("archiveDeskIfEmployeeNotMapped | activityListHistoryInsert | Error: ", error);
            }
            // Activity Timeline Transaction Insert
            try {
                let activityTimelineTxnRequest = Object.assign({}, request);
                activityTimelineTxnRequest.activity_id = coWorkerContactCardActivityID;
                activityTimelineTxnRequest.asset_id = deskAssetID;
                activityTimelineTxnRequest.stream_type_id = 11020;

                await activityTimelineTransactionInsert(activityTimelineTxnRequest, workforceID, organizationID, accountID);
            } catch (error) {
                console.log("archiveDeskIfEmployeeNotMapped | Co-Worker | activityTimelineTransactionInsert | Error: ", error);
            }
        }

        return [false, {
            desk_asset_id: deskAssetID,
            coworker_contact_card_activity_id: coWorkerContactCardActivityID
        }];
    }

    // Archive the asset
    async function assetListDelete(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            organizationID,
            request.log_asset_id,
            util.getCurrentUTCTime() // Updated datetime
        );
        const queryString = util.getQueryString('ds_p1_asset_list_delete', paramsArr);

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

    // Move Employee Desk To Another Workforce
    this.moveEmployeeDeskToAnotherWorkforce = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id),
            newWorkforceID = Number(request.new_workforce_id),
            deskAssetID = Number(request.desk_asset_id);
        let newWorkforceName = '';

        let operatingAssetID = 0;

        // Fetch Desk Asset Details
        // const [errOne, deskAssetDataFromDB] = await adminListingService.assetListSelect({
        //     organization_id: organizationID,
        //     asset_id: deskAssetID
        // });
        // if (!errOne && Number(deskAssetDataFromDB.length) > 0) {

        // }

        // Check if the target workforce has exceeded the maximum number of desks allowed
        const [errTwo, workforceAssetCountData] = await adminListingService.assetListSelectCountAssetTypeWorkforce({
            organization_id: organizationID,
            account_id: accountID,
            workforce_id: newWorkforceID,
            asset_type_category_id: 3
        });
        if (!errTwo && Number(workforceAssetCountData.length) > 0) {
            if (Number(workforceAssetCountData[0].count) === 50) {
                return [true, {
                    message: "The target workforce has maximum number of desks"
                }];
            }
        }
        // Fetch asset type for the new workforce
        const [errThree, newWorkforceAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory({
            organization_id: organizationID,
            account_id: accountID,
            workforce_id: newWorkforceID,
            asset_type_category_id: 3
        });
        if (errThree || Number(newWorkforceAssetTypeData.length) === 0) {
            console.log("moveEmployeeDeskToAnotherWorkforce | workforceAssetTypeMappingSelectCategory | Error: ", errThree);
            return [true, {
                message: "Unable to fetch desk asset type ID for the new workforce"
            }];
        }
        const newWorkforceDeskAssetTypeID = newWorkforceAssetTypeData[0].asset_type_id;

        // Update the workforce
        const [errFour, _] = await assetListUpdateWorkforce({
            asset_id: deskAssetID,
            asset_type_id: newWorkforceDeskAssetTypeID,
            log_asset_id: request.log_asset_id
        }, newWorkforceID, organizationID, accountID);
        if (errFour) {
            console.log("moveEmployeeDeskToAnotherWorkforce | assetListUpdateWorkforce | Error: ", errFour);
            return [true, {
                message: "Error updating desk asset of the workforce"
            }];
        }

        // Desk Asset List History Insert
        try {
            await assetListHistoryInsert({
                asset_id: deskAssetID,
                update_type_id: 218
            }, organizationID);
        } catch (error) {
            console.log("moveEmployeeDeskToAnotherWorkforce | Desk Asset List History Insert | Error: ", error);
        }

        // Desk Asset Timeline Transaction Insert
        try {
            let assetTimelineTxnRequest = Object.assign({}, request);
            assetTimelineTxnRequest.asset_id = deskAssetID;
            assetTimelineTxnRequest.stream_type_id = 11024;

            await assetTimelineTransactionInsert(assetTimelineTxnRequest, newWorkforceID, organizationID, accountID);
        } catch (error) {
            console.log("moveEmployeeDeskToAnotherWorkforce | assetTimelineTransactionInsert | Error: ", error);
        }

        // Update workforce data in co-worker contact card activity associated with the employee asset
        // Fetch and update Co-Worker Contact Card of the asset
        let coWorkerContactCardActivityID = 0;
        const [errZero, coWorkerContactCardData] = await adminListingService.activityListSelectCategoryAsset({
            asset_id: deskAssetID,
            organization_id: organizationID,
            activity_type_category_id: 5
        });

        let deskAssetDataFromDB_Copy = [];
        if (!errZero && Number(coWorkerContactCardData.length) > 0) {
            coWorkerContactCardActivityID = coWorkerContactCardData[0].activity_id;
            let contactCardInlineData = JSON.parse(coWorkerContactCardData[0].activity_inline_data);

            // Fetch Desk Asset Details
            const [errSeven, deskAssetDataFromDB] = await adminListingService.assetListSelect({
                organization_id: organizationID,
                asset_id: deskAssetID
            });
            if (!errSeven && Number(deskAssetDataFromDB.length) > 0) {
                deskAssetDataFromDB_Copy = deskAssetDataFromDB;

                // Update workforce name
                newWorkforceName = deskAssetDataFromDB[0].workforce_name;

                // Update inline data
                contactCardInlineData.contact_department = deskAssetDataFromDB[0].workforce_name;
                contactCardInlineData.contact_asset_type_id = deskAssetDataFromDB[0].asset_type_id;
                contactCardInlineData.contact_workforce_id = newWorkforceID;

                // Co-Worker Contact Card: Activity List Update
                try {
                    await activityListUpdateOperatingAssetData({
                        activity_id: coWorkerContactCardActivityID,
                        activity_inline_data: JSON.stringify(contactCardInlineData),
                        asset_id: deskAssetID,
                        operating_asset_id: deskAssetDataFromDB[0].operating_asset_id
                    }, organizationID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherWorkforce | Co-Worker | activityListUpdateOperatingAssetData | Error: ", error);
                }
                // Co-Worker Contact Card: Activity Asset Mapping Update
                try {
                    await activityAssetMappingUpdateOperationAssetData({
                        activity_id: coWorkerContactCardActivityID,
                        activity_inline_data: JSON.stringify(contactCardInlineData),
                        asset_id: deskAssetID,
                        operating_asset_id: deskAssetDataFromDB[0].operating_asset_id
                    }, organizationID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherWorkforce | Co-Worker | activityAssetMappingUpdateOperationAssetData | Error: ", error);
                }
                // Co-Worker Contact Card: Activity Timeline Transaction Insert
                try {
                    let activityTimelineTxnRequest = Object.assign({}, request);
                    activityTimelineTxnRequest.activity_id = coWorkerContactCardActivityID;
                    activityTimelineTxnRequest.asset_id = deskAssetID;
                    activityTimelineTxnRequest.stream_type_id = 11024;

                    await activityTimelineTransactionInsert(activityTimelineTxnRequest, newWorkforceID, organizationID, accountID);
                } catch (error) {
                    console.log("removeEmployeeMappedToDesk | Co-Worker | activityTimelineTransactionInsert | Error: ", error);
                }
                // Co-Worker Contact Card: History Insert
                try {
                    await activityListHistoryInsert({
                        activity_id: coWorkerContactCardActivityID,
                        update_type_id: 407
                    }, organizationID);
                } catch (error) {
                    console.log("removeEmployeeMappedToDesk | Co-Worker | activityListHistoryInsert | Error: ", error);
                }
            }
        }

        // Check if the desk has operating asset assigned
        if (Number(deskAssetDataFromDB_Copy[0].operating_asset_id) > 0) {
            operatingAssetID = Number(deskAssetDataFromDB_Copy[0].operating_asset_id);

            // Fetch asset type for the new workforce
            const [errFive, newWorkforceEmpAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory({
                organization_id: organizationID,
                account_id: accountID,
                workforce_id: newWorkforceID,
                asset_type_category_id: 2
            });
            if (errFive || Number(newWorkforceEmpAssetTypeData.length) === 0) {
                console.log("moveEmployeeDeskToAnotherWorkforce | Employee | workforceAssetTypeMappingSelectCategory | Error: ", errFive);
                return [true, {
                    message: "Unable to fetch employee asset type ID for the new workforce"
                }];
            }
            const newWorkforceEmployeeAssetTypeID = newWorkforceEmpAssetTypeData[0].asset_type_id;

            const [errSix, _] = await assetListUpdateWorkforce({
                asset_id: operatingAssetID,
                asset_type_id: newWorkforceEmployeeAssetTypeID,
                log_asset_id: request.log_asset_id
            }, newWorkforceID, organizationID, accountID);
            if (!errSix) {
                console.log("moveEmployeeDeskToAnotherWorkforce | Employee | assetListUpdateWorkforce | Error: ", errSix);

                // Employee Asset List History Insert
                try {
                    await assetListHistoryInsert({
                        asset_id: operatingAssetID,
                        update_type_id: 218
                    }, organizationID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherWorkforce | Employee | Asset List History Insert | Error: ", error);
                }

                // Employee Asset Timeline Transaction Insert
                try {
                    let assetTimelineTxnRequest = Object.assign({}, request);
                    assetTimelineTxnRequest.asset_id = operatingAssetID;
                    assetTimelineTxnRequest.stream_type_id = 11024;

                    await assetTimelineTransactionInsert(assetTimelineTxnRequest, newWorkforceID, organizationID, accountID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherWorkforce | Employee | assetTimelineTransactionInsert | Error: ", error);
                }
            }

            // Update ID Card Activity Inline Data
            // Fetch the ID Card
            let idCardActivityID = 0;
            const [errEight, idCardData] = await adminListingService.activityListSelectCategoryAsset({
                asset_id: operatingAssetID,
                organization_id: organizationID,
                activity_type_category_id: 4
            });
            if (!errEight && Number(idCardData.length) > 0) {
                idCardActivityID = idCardData[0].activity_id;

                let idCardActivityInlineData = JSON.parse(idCardData[0].activity_inline_data);
                idCardActivityInlineData.workforce_name = newWorkforceName;
                idCardActivityInlineData.employee_workforce_id = newWorkforceID;

                // ID Card: Activity List Update
                try {
                    await activityListUpdateOperatingAssetData({
                        activity_id: idCardActivityID,
                        activity_inline_data: JSON.stringify(idCardActivityInlineData),
                        asset_id: operatingAssetID,
                        operating_asset_id: 0
                    }, organizationID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherWorkforce | ID Card | activityListUpdateOperatingAssetData | Error: ", error);
                }
                // ID Card: Activity Asset Mapping Update Operating Asset Data
                try {
                    await activityAssetMappingUpdateOperationAssetData({
                        activity_id: idCardActivityID,
                        activity_inline_data: JSON.stringify(idCardActivityInlineData),
                        asset_id: operatingAssetID,
                        operating_asset_id: 0
                    }, organizationID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherWorkforce | ID Card | activityAssetMappingUpdateOperationAssetData | Error: ", error);
                }
                // ID Card: History Insert
                try {
                    await activityListHistoryInsert({
                        activity_id: idCardActivityID,
                        update_type_id: 407
                    }, organizationID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherWorkforce | ID Card | activityListHistoryInsert | Error: ", error);
                }
                // ID Card: Activity Timeline Transaction Insert
                try {
                    let activityTimelineTxnRequest = Object.assign({}, request);
                    activityTimelineTxnRequest.activity_id = coWorkerContactCardActivityID;
                    activityTimelineTxnRequest.asset_id = deskAssetID;
                    activityTimelineTxnRequest.stream_type_id = 11010;

                    await activityTimelineTransactionInsert(activityTimelineTxnRequest, workforceID, organizationID, accountID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherWorkforce | ID Card | activityTimelineTransactionInsert | Error: ", error);
                }
            }

        } else {
            console.log("moveEmployeeDeskToAnotherWorkforce | deskAssetDataFromDB[0].operating_asset_id: No operating asset found.");
        }

        return [false, {
            message: "Desk (and Employee) moved to the new workforce"
        }];
    }


    // Relocate a employee desk from one floor workforce to another. If an employee is 
    // operating on the desk, then shift the employee asset to the target workforce
    async function assetListUpdateWorkforce(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.asset_type_id,
            workforceID,
            accountID,
            organizationID,
            request.log_asset_id,
            util.getCurrentUTCTime() // Updated datetime
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_workforce', paramsArr);

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
