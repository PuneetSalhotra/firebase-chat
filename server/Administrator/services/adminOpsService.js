const AdminListingService = require("../services/adminListingService");
const logger = require('../../logger/winstonLogger');
const XLSX = require('xlsx');
const excelToJson = require('convert-excel-to-json');
const fs = require('fs');

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

    class ClientInputError extends Error {
        constructor(message, code) {
            super(message); // (1)
            this.name = "ClientInputError"; // (2)
            this.code = code; // (2)
        }

        getErrorCode() {
            return this.code;
        }

        getMessage() {
            return this.message;
        }
    }

    this.createOrganization = async function (request) {

        // Check if an organization exists with the same name
        const [errOne, orgCheck] = await adminListingService.organizationListSelectName(request);
        if (errOne || orgCheck.length > 0) {
            return [true, {
                message: "Error checking for organization or \
                an organization with the same name already exists!"
            }]
        }

        let organizationID = 0;
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

        // Response
        if (Number(organizationID) !== 0) {
            return [false, {
                message: `Organization ${request.organization_name} with ID ${organizationID}.`,
                organization_id: organizationID
            }];
        } else {
            return [false, {
                message: `Error creating organization ${request.organization_name}.`
            }];
        }
    }

    // Create Asset Bundle
    async function createAssetBundle(request, workforceID, organizationID, accountID) {
        // Performs multiple steps
        // 1. Asset List Insert
        // 2. Asset List History Insert
        // 3. Asset Timeline Transaction Insert
        // 4. Fire Create Activity Service


        // 1. Asset List Insert
        // const [errOne, assetData] = await assetListInsert(request, workforceID, organizationID, accountID);
        const [errOne, assetData] = await assetListInsertV1(request, workforceID, organizationID, accountID);
        if (errOne || Number(assetData.length) === 0) {
            console.log("createAssetBundle | assetListInsertV1 | assetData: ", assetData);
            console.log("createAssetBundle | Error: ", errOne);
            return [true, {
                message: "Error at assetListInsertV1"
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
            let newReq = Object.assign({}, request);
                newReq.account_id = 0;
            const [errThree, activityTypeMappingData] = await adminListingService.workforceActivityTypeMappingSelectCategory(newReq);
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
            request.joined_datetime || util.getCurrentUTCTime(),
            request.asset_flag_account_admin || 0,
            request.asset_flag_organization_admin || 0
        );
        // const queryString = util.getQueryString('ds_p1_1_asset_list_insert', paramsArr);
        const queryString = util.getQueryString('ds_p1_2_asset_list_insert', paramsArr);

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

    // Asset List Insert v1: With provision to add industry and work location
    async function assetListInsertV1(request, workforceID, organizationID, accountID) {
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
            request.asset_id || 1,
            util.getCurrentUTCTime(),
            request.joined_datetime || util.getCurrentUTCTime(),
            request.asset_flag_account_admin || 0,
            request.asset_flag_organization_admin || 0,
            request.industry_id || 0,
            request.work_location_latitude || 0,
            request.work_location_longitude || 0,
            request.work_location_address || '',
        );
        const queryString = util.getQueryString('ds_p1_3_asset_list_insert', paramsArr);

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
        const queryString = util.getQueryString('ds_p1_organization_list_history_insert', paramsArr);

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

        //Get the asset_type_name i.e. Role Name        
        let [err, roleData] = await adminListingService.listRolesByAccessLevels(request);
        if(!err && roleData.length > 0) {
            request.asset_type_name = roleData[0].asset_type_name;
            console.log('ROLE NAME for ', request.asset_type_id, 'is : ', request.asset_type_name);
        }
        
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
            contact_asset_type_name: request.asset_type_name,
            contact_organization: request.organization_name,
            contact_asset_id: 0,
            contact_workforce_id: request.workforce_id,
            contact_account_id: request.account_id,
            contact_organization_id: request.organization_id,
            contact_operating_asset_name: '',
            contact_operating_asset_id: '',
            contact_manager_asset_id: request.manager_asset_id || 0,
            contact_manager_asset_first_name: request.manager_asset_first_name || ''
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

        //Get the asset_type_name i.e. Role Name        
        let [err, roleData] = await adminListingService.listRolesByAccessLevels(request);
        if(!err && roleData.length > 0) {
            request.asset_type_name = roleData[0].asset_type_name;
            console.log('ROLE NAME for ', request.asset_type_id, 'is : ', request.asset_type_name);
        }

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

        // Check if an Employee with the given phone nunmber exists
        const [errZero_1, checkPhoneNumberData] = await assetListSelectCategoryPhoneNumber({
            phone_number: Number(request.phone_number) || 0,
            country_code: Number(request.country_code) || 0,
            asset_type_category_id: 2,
        }, organizationID);
        if (errZero_1 || Number(checkPhoneNumberData.length) > 0) {
            console.log("addNewEmployeeToExistingDesk | assetListSelectCategoryPhoneNumber | Error: ", errZero_1);
            return [true, {
                message: `An employee with the country code ${Number(request.country_code)} and phone number ${Number(request.phone_number)} already exists.`
            }]
        }

        // Check if an Employee with the given phone nunmber exists
        const [errZero_2, checkCUIDData] = await assetListSelectCustomerUniqueID({
            account_id: 0,
            workforce_id: 0,
            customer_unique_id: String(request.customer_unique_id),
        }, organizationID);
        if (errZero_2 || Number(checkCUIDData.length) > 0) {
            console.log("addNewEmployeeToExistingDesk | assetListSelectCustomerUniqueID | Error: ", errZero_2);
            return [true, {
                message: `An employee with the CUID ${Number(request.customer_unique_id)} already exists.`
            }]
        }

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
            employee_email_id: request.email_id,
            employee_asset_type_id: request.asset_type_id,
            employee_asset_type_name: request.asset_type_name,
            employee_manager_asset_id: request.manager_asset_id || 0,
            employee_manager_asset_first_name: request.manager_asset_first_name || ''
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

        // Send SMS to the newly added employee
        try {
            // Get the Org data
            let orgData = [], senderID = '';
            let orgDataQueryParams = new Array(1);
            orgDataQueryParams[0] = Number(request.organization_id);
            const queryString = util.getQueryString('ds_p1_organization_list_select', orgDataQueryParams);
            if (queryString != '') {
                orgData = await (db.executeQueryPromise(1, queryString, request));
            }
            (orgData.length > 0) ? senderID = orgData[0].organization_text_sender_name : senderID = 'MYTONY';

            const smsMessage = `Dear ${request.asset_first_name || ''} ${request.asset_last_name || ''}, you have been added as an '${deskAssetDataFromDB[0].asset_first_name}' by '${request.organization_name || ''}' to join their '${request.workforce_name || ''}' workforce. Please click on the link below to download the Tony App and get started.
        
            https://download.mytony.app`;

            util.sendSmsSinfiniV1(smsMessage, request.country_code || 91, request.phone_number || 0, senderID, function (err, response) {
                console.log('[addNewEmployeeToExistingDesk] Sinfini Response: ', response);
                console.log('[addNewEmployeeToExistingDesk] Sinfini Error: ', err);
            });
        } catch (error) {
            console.log('[addNewEmployeeToExistingDesk] SMS Block Error: ', error);
        }

        // [VODAFONE] Give the Account Manager access to the Order Logged Queue
        try {
            // Fetch the workforce's workforce type ID
            let workforceTypeID = 0;
            const [_, workforceData] = await workforceListSelect({}, workforceID, organizationID, accountID);
            if (Number(workforceData.length) > 0) {
                workforceTypeID = Number(workforceData[0].workforce_type_id);
            }
            if (
                organizationID === 868 &&
                workforceTypeID !== 0 &&
                (
                    workforceTypeID === 12 ||
                    workforceTypeID === 13 ||
                    workforceTypeID === 14 ||
                    workforceTypeID === 15
                )
            ) {
                // Give the Account Manager access to the Order Logged Queue
                const [queueError, queueData] = await queueAccessMappingInsert({
                    queue_id: 79,
                    access_level_id: 6,
                    asset_id: deskAssetID,
                    log_asset_id: request.log_asset_id || request.asset_id
                }, workforceID, organizationID, accountID);

                console.log("addNewEmployeeToExistingDesk | queueAccessMappingInsert | queueError: ", queueError);

                if (
                    queueError.hasOwnProperty("code") &&
                    queueError.code === "ER_DUP_ENTRY"
                ) {
                    console.log("addNewEmployeeToExistingDesk | queueAccessMappingInsert | queueError: ", "Duplicate Entry Attempt Yet To Be Handled ");
                }
            }
        } catch (error) {
            console.log("addNewEmployeeToExistingDesk | queueAccessMappingInsert | Error: ", error);
        }

        //Update Manager Details
        let newReq = Object.assign({}, request);
            newReq.asset_id = deskAssetID;
        this.updateAssetsManagerDetails(newReq);

        return [false, {
            desk_asset_id: deskAssetID,
            coworker_contact_card_activity_id: coWorkerContactCardActivityID,
            operating_asset_id: operatingAssetID,
            id_card_activity_id: idCardActivityID
        }];

    }

    // Give access to a specific queue
    async function queueAccessMappingInsert(request, workforceID, organizationID, accountID) {
        // IN p_queue_id BIGINT(20), IN p_access_level_id SMALLINT(6), IN p_asset_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.queue_id,
            request.access_level_id,
            request.asset_id,
            workforceID,
            accountID,
            organizationID,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_queue_access_mapping_insert', paramsArr);

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

    // Fetch an asset's access to a specific queue
    async function queueAccessMappingSelectQueueAsset(request, workforceID, organizationID, accountID) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_asset_id BIGINT(20), IN p_queue_id BIGINT(20)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.asset_id,
            request.queue_id
        );
        const queryString = util.getQueryString('ds_p1_queue_access_mapping_select_queue_asset', paramsArr);

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

    // Call to get differential data for a workforce
    async function workforceListSelect(request, workforceID, organizationID, accountID) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_flag TINYINT(4), 
        // IN p_differential_datetime DATETIME, IN p_start_from SMALLINT(6), 
        // IN p_limit_value TINYINT(4)

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.flag || 0,
            request.differential_datetime || '1970-01-01 00:00:00',
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit)
        );

        var queryString = util.getQueryString('ds_p1_workforce_list_select', paramsArr);
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

    // Fetch all assets with the given country code and phone number
    async function assetListSelectCategoryPhoneNumber(request, organizationID) {
        // IN p_organization_id bigint(20), IN p_phone_number VARCHAR(20), 
        // IN p_country_code SMALLINT(6), IN p_asset_type_category_id TINYINT(4)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            request.phone_number,
            request.country_code,
            request.asset_type_category_id
        );
        const queryString = util.getQueryString('ds_v1_asset_list_select_category_phone_number', paramsArr);

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

    // Fetch all assets with the given customer unique ID
    async function assetListSelectCustomerUniqueID(request, organizationID) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_customer_unique_id VARCHAR(50)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            request.account_id,
            request.workforce_id,
            request.customer_unique_id
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_customer_unique_id', paramsArr);

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


        // [VODAFONE] Revoke access to the Order Logged Queue for the Account Manager
        try {
            // Fetch the workforce's workforce type ID
            let workforceTypeID = 0;
            const [_, workforceData] = await workforceListSelect({}, workforceID, organizationID, accountID);
            if (Number(workforceData.length) > 0) {
                workforceTypeID = Number(workforceData[0].workforce_type_id);
            }
            if (
                organizationID === 868 &&
                workforceTypeID !== 0 &&
                (
                    workforceTypeID === 12 ||
                    workforceTypeID === 13 ||
                    workforceTypeID === 14 ||
                    workforceTypeID === 15
                )
            ) {
                // Get the queue_access_id for the Account Manager
                // [PENDING]
                const [queueError, queueData] = await queueAccessMappingSelectQueueAsset({
                    asset_id: deskAssetID,
                    queue_id: 79
                }, workforceID, organizationID, accountID);
                if (
                    queueError ||
                    !(Number(queueData.length) > 0)
                ) {
                    throw new Error("queueAccessMappingSelectQueueAsset:Error:Error Fetching queue_access_id");
                }
                // Revoke access to the Order Logged Queue for the Account Manager
                const [queueUpdateError, queueUpdateData] = await queueAccessMappingUpdateLogState({
                    queue_access_id: Number(queueData[0].queue_access_id),
                    log_state: 3,
                    log_asset_id: request.log_asset_id || request.asset_id
                }, organizationID);

                // console.log("removeEmployeeMappedToDesk | queueAccessMappingUpdateLogState | queueError: ", queueError);
            }
        } catch (error) {
            console.log("removeEmployeeMappedToDesk | queueAccessMappingUpdateLogState | Error: ", error);
        }

        return [false, {
            operating_asset_id: operatingAssetID,
            id_card_activity_id: idCardActivityID,
            desk_asset_id: deskAssetID,
            coworker_contact_card_activity_id: coWorkerContactCardActivityID
        }];
    }

    // Archive the employee asset mapping
    async function queueAccessMappingUpdateLogState(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.queue_access_id,
            organizationID,
            request.log_state,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_queue_access_mapping_update_log_state', paramsArr);

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
            // asset_message_counter: 0,
            track_latitude: 0.0,
            track_longitude: 0.0,
            track_altitude: 0,
            track_gps_datetime: util.getCurrentUTCTime(),
            track_gps_accuracy: 0,
            track_gps_status: 0,
            service_version: "3.0",
            app_version: "3.0.0",
            device_os_id: 5,
            message_unique_id: util.getMessageUniqueId(Number(request.asset_id))
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
            newAccountID = Number(request.new_account_id),
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
            account_id: newAccountID || accountID,
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
            account_id: newAccountID || accountID,
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
        }, newWorkforceID, organizationID, newAccountID || accountID);
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

            await assetTimelineTransactionInsert(assetTimelineTxnRequest, newWorkforceID, organizationID, newAccountID || accountID);
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
                contactCardInlineData.contact_account_id = newAccountID || newAccountID;
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

                    await activityTimelineTransactionInsert(activityTimelineTxnRequest, newWorkforceID, organizationID, newAccountID || accountID);
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
                account_id: newAccountID || accountID,
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
            }, newWorkforceID, organizationID, newAccountID || accountID);
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

                    await assetTimelineTransactionInsert(assetTimelineTxnRequest, newWorkforceID, organizationID, newAccountID || accountID);
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
                idCardActivityInlineData.employee_department = newWorkforceName;
                idCardActivityInlineData.employee_account_id = newAccountID || newAccountID;
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

                    await activityTimelineTransactionInsert(activityTimelineTxnRequest, workforceID, organizationID, newAccountID || accountID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherWorkforce | ID Card | activityTimelineTransactionInsert | Error: ", error);
                }
            }

            // Unlink User | Call Service: /asset/link/reset
            try {
                await assetLinkReset(request, [{
                    asset_id: deskAssetID,
                    operating_asset_id: operatingAssetID
                }], newWorkforceID || workforceID, organizationID, newAccountID || accountID);
            } catch (error) {
                console.log("removeEmployeeMappedToDesk | Unlink User | /asset/link/reset | Error: ", error);
            }

        } else {
            console.log("moveEmployeeDeskToAnotherWorkforce | deskAssetDataFromDB[0].operating_asset_id: No operating asset found.");
        }

        return [false, {
            message: "Desk (and Employee) moved to the new workforce",
            organization_id: organizationID,
            account_id: newAccountID || accountID,
            workforce_id: newWorkforceID || workforceID,
            desk_asset_id: deskAssetID
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

                    if(responseData[0].push_status == 0){

                        let newObject = Object.assign({},request);
                        newObject.target_workforce_id = workforceID;
                        newObject.push_title = "Resource Joined";
                        newObject.push_message = responseData[0].operating_asset_first_name +" has joined our team from "+responseData[0].existing_workforce_name;
                        activityCommonService.sendPushToWorkforceAssets(newObject);

                    }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    // Create a new workforce, department or a floor
    this.createWorkforce = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            // workforceID = Number(request.workforce_id),
            assetID = Number(request.asset_id),
            workforceName = String(request.workforce_name),
            workforceTypeID = (request.workforce_type_id) ? Number(request.workforce_type_id) : 1;

        // Create the workforce
        let [errOne, workforceData] = await workforceListInsert({
            workforce_name: workforceName,
            workforce_type_id: workforceTypeID
        }, organizationID, accountID);
        if (errOne) {
            return [true, {
                message: "Couldn't create the workforce."
            }]
        }

        const workforceID = Number(workforceData[0].workforce_id);

        // Workforce List History insert
        try {
            await workforceListHistoryInsert({
                workforce_id: workforceData[0].workforce_id,
                organization_id: organizationID
            });
        } catch (error) { }

        // Fetch workforce asset types
        const [errTwo, workforceAssetTypes] = await adminListingService.assetTypeCategoryMasterSelect({
            product_id: 1,
            start_from: 0,
            limit_value: 50
        });
        if (errTwo || workforceAssetTypes.length === 0) {
            return [true, {
                message: `[createWorkforce] Error fetching workforceAssetTypes`
            }]
        }

        // Create workforce asset types
        for (const assetType of workforceAssetTypes) {

            const [errThree, assetTypeData] = await workforceAssetTypeMappingInsert({
                asset_type_name: assetType.asset_type_category_name,
                asset_type_description: assetType.asset_type_category_description,
                asset_type_category_id: assetType.asset_type_category_id
            }, workforceID, organizationID, accountID);

            if (errThree || assetTypeData.length === 0) {
                console.log(`[createWorkforce] Error creating assetType ${assetType.asset_type_category_name} for workforce ${workforceID}`);
            }

            // Workforce asset types history insert
            if (assetTypeData.length > 0) {
                let assetTypeID = assetTypeData[0].asset_type_id;
                try {
                    await workforceAssetTypeMappingHistoryInsert({
                        update_type_id: 0
                    }, assetTypeID, organizationID);
                } catch (error) { }
                // 
            }
        }

        // Fetch workforce activity types
        const [errFour, workforceActivityTypes] = await adminListingService.activityTypeCategoryMasterSelect({
            product_id: 1,
            start_from: 0,
            limit_value: 50
        });
        if (errFour || workforceActivityTypes.length === 0) {
            return [true, {
                message: `[createWorkforce] Error fetching workforceActivityTypes`
            }]
        }

        // Create workforce activity types
        for (const activityType of workforceActivityTypes) {

            const [errFive, activityTypeData] = await workforceActivityTypeMappingInsert({
                activity_type_name: activityType.activity_type_category_name,
                activity_type_description: activityType.activity_type_category_description,
                activity_type_category_id: activityType.activity_type_category_id
            }, workforceID, organizationID, accountID);

            if (errFive || activityTypeData.length === 0) {
                console.log(`[createWorkforce] Error creating activityType ${activityType.asset_type_category_name} for workforce ${workforceID}`);
            }

            // Activity types history insert
            let activityTypeID = activityTypeData[0].activity_type_id;
            if (activityTypeData.length > 0) {
                try {
                    await workforceActivityTypeMappingHistoryInsert({
                        update_type_id: 0
                    }, activityTypeID, organizationID);
                } catch (error) { }
                // 
            }

            // Once the activity type for the workforce is created, the corresponding statuses
            // need to be created as well. First, fetch the statuses for the activity_type_category_id
            // Fetch workforce activity types
            const [errSix, activityStatusTypes] = await adminListingService.activityStatusTypeMasterSelectCategory({
                activity_type_category_id: activityType.activity_type_category_id,
                start_from: 0,
                limit_value: 50
            });
            if (errSix || activityStatusTypes.length === 0) {
                // Do nothing, just skip
                continue;
            }

            for (const activityStatusType of activityStatusTypes) {

                const [errSeven, activityStatusTypeData] = await workforceActivityStatusMappingInsert({
                    activity_status_name: activityStatusType.activity_status_type_name,
                    activity_status_description: activityStatusType.activity_status_type_description,
                    activity_status_sequence_id: 0,
                    activity_status_type_id: activityStatusType.activity_status_type_id,
                    log_asset_id: request.log_asset_id || request.asset_id
                }, activityTypeID, workforceID, organizationID, accountID);

                if (errSeven || activityStatusTypeData.length === 0) {
                    console.log(`[createWorkforce] Error creating activityStatusType ${activityStatusType.activity_status_type_name} for the activity ${activityType.activity_type_category_name} workforce ${workforceID}`);
                }

                if (activityStatusTypeData.length > 0) {
                    const activityStatusID = activityStatusTypeData[0].activity_status_id;
                    try {
                        await workforceActivityStatusMappingHistoryInsert({
                            update_type_id: 0
                        }, activityStatusID, organizationID);
                    } catch (error) { }
                    // 
                }
            }
        }

        return [false, {
            workforce_id: workforceID,
            message: `Workforce, asset types, activity types created with workforce_id: ${workforceID}`
        }]

    }

    // Alter/update an existin workforce
    this.alterWorkforce = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id),
            newWorkforceName = request.workforce_name,
            assetID = Number(request.asset_id),
            logDateTime = moment().utc().format('YYYY-MM-DD HH:mm:ss');

        // Upadte the name of the workforce
        const [errOne, _] = await workforceListUpdateName(request, workforceID, organizationID, accountID);
        if (errOne) {
            logger.error(`alterWorkforce.workforceListUpdateName`, { type: 'admin_ops', request_body: request, error: errOne });
            return [errOne, []]
        }

        // Update workforce name in the workforce_asset_type_mapping table
        try {
            await workforceAssetTypeMappingUpdate(request, workforceID, organizationID, accountID);
        } catch (error) {
            logger.error(`alterWorkforce.workforceAssetTypeMappingUpdate`, { type: 'admin_ops', request_body: request, error });
        }

        // Update workforce name in the workforce_activity_type_mapping table
        try {
            await workforceActivityTypeMappingUpdateWorkforceName(request, workforceID, organizationID, accountID);
        } catch (error) {
            logger.error(`alterWorkforce.workforceActivityTypeMappingUpdateWorkforceName`, { type: 'admin_ops', request_body: request, error });
        }

        // Workforce Activity Status Mapping Update Workforce Name
        try {
            await workforceActivityStatusMappingUpdateWorkforceName(request, workforceID, organizationID, accountID);
        } catch (error) {
            logger.error(`alterWorkforce.workforceActivityStatusMappingUpdateWorkforceName`, { type: 'admin_ops', request_body: request, error });
        }

        // Asset List Update Workforce Name
        const [errTwo, assetData] = await adminListingService.assetListSelectAllDesks(request);
        if (errTwo) {
            logger.error(`alterWorkforce.assetListSelectAllDesks`, { type: 'admin_ops', request_body: request, error: errTwo });
            return [errTwo, []]
        }
        // const promises = widgets.map((widget) => widget && widget.crunchDataAndSave(message));
        const assetListUpdateWorkforceNamePromises = assetData.map(asset => assetListUpdateWorkforceName(request, asset.asset_id, workforceID, organizationID, accountID));
        try {
            await Promise.all(assetListUpdateWorkforceNamePromises);
        } catch (error) {
            logger.error(`alterWorkforce.assetListUpdateWorkforceNamePromises`, { type: 'admin_ops', request_body: request, error });
        }

        // Note to self: Apart from the above tables, you will have to update inline data for 
        // ID Card activity and Contact card activity for all the assets in the workforce.

        logger.silly()
        logger.silly("🔥 🔥 🔥 🔥 🔥 🔥  Updating workforce name in all the ID Cards 🔥 🔥 🔥 🔥 🔥 🔥");
        logger.silly()
        // Fetch all ID cards => Update inline data
        const [errThree, idCardData] = await adminListingService.activityListSelectWorkforceCategory({
            activity_type_category_id: 4,
            start_from: 0,
            limit_value: 50,
        }, workforceID, organizationID, accountID);
        if (errThree) {
            logger.error(`alterWorkforce.activityListSelectWorkforceCategory_IDCard`, { type: 'admin_ops', request_body: request, error: errThree });
            return [errThree, []]
        }

        let idCardsUpdateActivityAssetMappingPromises = [];
        const idCardsUpdateWorkforceNamePromises = idCardData.map(idCard => {
            // Update Inline Data
            let inlineJSON = JSON.parse(idCard.activity_inline_data)
            inlineJSON.employee_department = newWorkforceName;

            idCardsUpdateActivityAssetMappingPromises.push(
                activityAssetMappingUpdateInlineData({
                    ...request,
                    activity_id: idCard.activity_id,
                    activity_inline_data: JSON.stringify(inlineJSON),
                    asset_id: idCard.asset_id,
                    log_asset_id: request.asset_id
                }, organizationID)
            );

            return activityListUpdateInlineData({
                activity_id: idCard.activity_id,
                activity_inline_data: JSON.stringify(inlineJSON)
            }, organizationID);
        });
        try {
            await Promise.all(idCardsUpdateWorkforceNamePromises.concat(idCardsUpdateActivityAssetMappingPromises));
        } catch (error) {
            logger.error(`alterWorkforce.idCardsUpdateWorkforceNamePromises`, { type: 'admin_ops', request_body: request, error });
        }

        logger.silly()
        logger.silly("🔥 🔥 🔥 🔥 🔥 🔥  Updating workforce name in all the Contact Cards 🔥 🔥 🔥 🔥 🔥 🔥");
        logger.silly()
        // Fetch all Contact cards => Update inline data
        const [errFour, contactCardData] = await adminListingService.activityListSelectWorkforceCategory({
            activity_type_category_id: 5,
            start_from: 0,
            limit_value: 50,
        }, workforceID, organizationID, accountID);
        if (errFour) {
            logger.error(`alterWorkforce.activityListSelectWorkforceCategory_ContactCCard`, { type: 'admin_ops', request_body: request, error: errFour });
            return [errFour, []]
        }
        const contactCardsUpdateWorkforceNamePromises = contactCardData.map(contactCard => {
            // Update Inline Data
            let inlineJSON = JSON.parse(contactCard.activity_inline_data)
            inlineJSON.contact_department = newWorkforceName;

            return activityListUpdateInlineData({
                activity_id: contactCard.activity_id,
                activity_inline_data: JSON.stringify(inlineJSON)
            }, organizationID);
        });
        try {
            await Promise.all(contactCardsUpdateWorkforceNamePromises);
        } catch (error) {
            logger.error(`alterWorkforce.contactCardsUpdateWorkforceNamePromises`, { type: 'admin_ops', request_body: request, error });
        }

        return [false, []]
    };

    // Workforce List Update
    async function workforceListUpdateName(request, workforceID, organizationID, accountID) {
        // IN p_workforce_name VARCHAR(50), IN p_workforce_image_path VARCHAR(300), 
        // IN p_workforce_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), 
        // IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.workforce_name,
            request.workforce_image_path || '',
            workforceID,
            organizationID,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_list_update', paramsArr);

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

    // Workforce Asset Type Mapping Update
    async function workforceAssetTypeMappingUpdate(request, workforceID, organizationID, accountID) {
        // IN p_asset_type_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_log_datetime DATETIME, IN p_log_asset_id BIGINT(20)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_type_id || 0,
            workforceID,
            accountID,
            organizationID,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_update_workforce_name', paramsArr);

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

    // Workforce Activity Type Mapping Update Workforce Name
    async function workforceActivityTypeMappingUpdateWorkforceName(request, workforceID, organizationID, accountID) {
        // IN p_activity_type_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_account_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_log_datetime DATETIME, IN p_log_asset_id BIGINT(20)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_type_id || 0,
            workforceID,
            accountID,
            organizationID,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_update_workforce_name', paramsArr);

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

    // Workforce Activity Status Mapping Update Workforce Name
    async function workforceActivityStatusMappingUpdateWorkforceName(request, workforceID, organizationID, accountID) {
        // IN p_activity_status_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_organization_id BIGINT(20), IN p_log_datetime DATETIME, IN p_log_asset_id BIGINT(20)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_status_id || 0,
            workforceID,
            accountID,
            organizationID,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_update_workforce_name', paramsArr);

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

    // Asset List Update Workforce Name
    async function assetListUpdateWorkforceName(request, assetID, workforceID, organizationID, accountID) {
        // IN p_asset_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_organization_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            assetID || 0,
            workforceID,
            accountID,
            organizationID,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_workforce_name', paramsArr);

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

    // Workforce Activity Types Insert
    async function workforceActivityTypeMappingInsert(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_type_name,
            request.activity_type_description,
            request.activity_type_category_id, // Should be 1 when creating for the first time
            workforceID,
            accountID,
            organizationID,
            1, // log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_insert', paramsArr);

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

    // Workforce Activity Types History Insert
    async function workforceActivityTypeMappingHistoryInsert(request, activityTypeID, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            activityTypeID,
            organizationID,
            request.update_type_id || 0,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_history_insert', paramsArr);

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

    // Create Workforce Activity Status Mapping
    async function workforceActivityStatusMappingInsert(request, activityTypeID, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_status_name,
            request.activity_status_description,
            request.activity_status_sequence_id,
            request.activity_status_type_id,
            activityTypeID,
            workforceID,
            accountID,
            organizationID,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_insert', paramsArr);

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

    // Create Workforce Activity Status Mapping
    async function workforceActivityStatusMappingHistoryInsert(request, activityStatusID, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            activityStatusID,
            organizationID,
            request.update_type_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_history_insert', paramsArr);

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

    this.createAccount = async function (request) {
        const organizationID = Number(request.organization_id);

        let departmentsList = String(request.departments) || "Floor 1";
        departmentsList = departmentsList.split(',');

        // Create the account
        let accountID = 0;
        const [errOne, accountData] = await accountListInsert(request, organizationID);
        if (errOne || accountData.length === 0) {
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

        // Create Workforces
        let workforces = [];
        if (Number(organizationID) !== 0 && Number(accountID) !== 0) {
            // Fetch generic workforces
            const [errTwo, workforceTypes] = await adminListingService.workforceTypeMasterSelect({
                start_from: 0,
                limit_value: 3
            });
            if (errTwo || workforceTypes.length === 0) {
                return [true, {
                    message: "Error fetching workforceTypes"
                }]
            }

            // Create Generic/Default Workforces
            for (const workforceType of workforceTypes) {
                if (Number(workforceType.workforce_type_id) !== 2) {
                    continue;
                }
                // Lobby is the only workforce to be created as of now
                const [errThree, newWorkforceResponse] = await self.createWorkforce({
                    workforce_name: workforceType.workforce_type_name,
                    workforce_type_id: workforceType.workforce_type_id,
                    log_asset_id: request.asset_id || request.auth_asset_id,
                    asset_id: request.asset_id,
                    account_id: accountID,
                    organization_id: organizationID
                })
                if (errThree || Number(newWorkforceResponse.workforce_id) === 0) {
                    console.log("[createAccount | newWorkforceResponse] Error creating workforce: ", errThree);
                    continue;
                }
                workforces.push({
                    workforce_id: newWorkforceResponse.workforce_id,
                    workforce_name: workforceType.workforce_type_name
                });

                // Create default desks in the lobby
                // Access Management
                // Building Management
                let genericWorkforceAssetTypeIDs = [];
                if (Number(workforceType.workforce_type_id) === 2) {
                    genericWorkforceAssetTypeIDs = [
                        7, // Access Management Desk
                        23 // Building Management Desk
                    ];
                }
                for (const genericWorkforceAssetTypeID of genericWorkforceAssetTypeIDs) {
                    // Fetch workforce asset type ID
                    const [errNine, workforceGenericAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory({
                        organization_id: organizationID,
                        account_id: accountID,
                        workforce_id: newWorkforceResponse.workforce_id,
                        asset_type_category_id: genericWorkforceAssetTypeID
                    });
                    if (errNine || Number(workforceGenericAssetTypeData.length) === 0) {
                        console.log("createAccount | Create Generic Desks | workforceAssetTypeMappingSelectCategory | Error: ", errNine);
                        continue;
                    }
                    const workforceGenericAssetTypeID = workforceGenericAssetTypeData[0].asset_type_id;
                    const workforceGenericAssetTypeName = workforceGenericAssetTypeData[0].asset_type_name;

                    try {
                        // Create the Generic Desks
                        const [errTen, deskAssetID, contactCardActivityID] = await fireDeskAssetCreationService(
                            request,
                            { emp_designation: workforceGenericAssetTypeName },
                            workforceGenericAssetTypeID,
                            newWorkforceResponse.workforce_id,
                            workforceGenericAssetTypeName,
                            accountID,
                            organizationID
                        );
                        if (errTen !== false) {
                            throw new Error(errTen);
                        }
                        console.log("Generic Desk Asset ID: ", deskAssetID);
                        console.log("Generic Contact Card Activity ID: ", contactCardActivityID);
                    } catch (error) {
                        console.log("Create the Generic Desk Asset Error: ", error);
                        continue;
                    }
                }

            }

            // Create user-defined workforces
            for (const [index, userDefinedWorkforceName] of Array.from(departmentsList).entries()) {
                // continue;
                const [errFour, newUserDefinedWorkforceResponse] = await self.createWorkforce({
                    workforce_name: userDefinedWorkforceName,
                    workforce_type_id: 1,
                    log_asset_id: request.asset_id || request.auth_asset_id,
                    asset_id: request.asset_id,
                    account_id: accountID,
                    organization_id: organizationID
                })
                if (errFour || Number(newUserDefinedWorkforceResponse.workforce_id) === 0) {
                    console.log("[createAccount | newUserDefinedWorkforceResponse] Error creating workforce: ", errFour);
                    continue;
                }
                workforces.push({
                    workforce_id: newUserDefinedWorkforceResponse.workforce_id,
                    workforce_name: userDefinedWorkforceName
                });
                // Create the employees/administrator only on the first floor
                if (Number(index) == 0) {
                    const employeeList = JSON.parse(request.employee_list);

                    for (const employee of employeeList) {
                        // check if + is appended to string
                        if (String(employee.emp_coutry_code).indexOf('+') > -1) {
                            employee.emp_coutry_code = employee.emp_coutry_code.substring(1);
                        }

                        // Fetch workforce desk asset type ID
                        const [errFive, workforceAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory({
                            organization_id: organizationID,
                            account_id: accountID,
                            workforce_id: newUserDefinedWorkforceResponse.workforce_id,
                            asset_type_category_id: 3
                        });
                        if (errFive || Number(workforceAssetTypeData.length) === 0) {
                            console.log("createAccount | Create Desk | workforceAssetTypeMappingSelectCategory | Error: ", errFive);
                            continue;
                        }
                        const workforceDeskAssetTypeID = workforceAssetTypeData[0].asset_type_id;

                        // Fetch workforce desk asset type ID
                        const [errSeven, workforceEmployeeAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory({
                            organization_id: organizationID,
                            account_id: accountID,
                            workforce_id: newUserDefinedWorkforceResponse.workforce_id,
                            asset_type_category_id: 2
                        });
                        if (errSeven || Number(workforceEmployeeAssetTypeData.length) === 0) {
                            console.log("createAccount | Create Employee | workforceAssetTypeMappingSelectCategory | Error: ", errSeven);
                            continue;
                        }
                        const workforceEmployeeAssetTypeID = workforceEmployeeAssetTypeData[0].asset_type_id;

                        try {
                            // Create the Desk Asset
                            const [errSix, deskAssetID, contactCardActivityID] = await fireDeskAssetCreationService(
                                request,
                                employee,
                                workforceDeskAssetTypeID,
                                newUserDefinedWorkforceResponse.workforce_id,
                                userDefinedWorkforceName,
                                accountID,
                                organizationID
                            );
                            if (errSix !== false) {
                                throw new Error(errSix);
                            }
                            console.log("Desk Asset ID: ", deskAssetID);
                            console.log("Contact Card Activity ID: ", contactCardActivityID);
                            // Update admin flags for the desk asset
                            try {
                                await self.updateAssetFlags({
                                    ...request,
                                    account_id: accountID,
                                    workforce_id: newUserDefinedWorkforceResponse.workforce_id,
                                    asset_id: deskAssetID,
                                    flag: 0,
                                    set_admin_flag: 1,
                                    set_organization_admin_flag: request.asset_flag_organization_admin || 1
                                });
                            } catch (error) {
                                logger.error(`Error setting Admin accesses for the desk asset`, { type: 'admin_ops', request_body: request, error });
                            }

                            // Create the Employee Asset
                            const [errEight, employeeAssetID, idCardActivityID] = await fireEmployeeAssetCreationService(
                                request,
                                employee,
                                workforceEmployeeAssetTypeID,
                                newUserDefinedWorkforceResponse.workforce_id,
                                userDefinedWorkforceName,
                                accountID,
                                organizationID,
                                deskAssetID
                            );
                            if (errEight !== false) {
                                throw new Error(errEight);
                            }
                            console.log("Employee Asset ID: ", employeeAssetID);
                            console.log("ID Card Activity ID: ", idCardActivityID);

                            // Update admin flags for the employee asset
                            try {
                                await self.updateAssetFlags({
                                    ...request,
                                    account_id: accountID,
                                    workforce_id: newUserDefinedWorkforceResponse.workforce_id,
                                    asset_id: employeeAssetID,
                                    flag: 0,
                                    set_admin_flag: 1,
                                    set_organization_admin_flag: request.asset_flag_organization_admin || 1
                                });
                            } catch (error) {
                                logger.error(`Error setting Admin accesses for the employee asset`, { type: 'admin_ops', request_body: request, error });
                            }

                        } catch (error) {
                            console.log("Create the Desk/Employee Asset Error: ", error);
                            continue;
                        }
                    }
                }
            }
        
            // Create Customer Floor
            const [errFour, customerWorkforceResponse] = await self.createWorkforce({
                workforce_name: "Customer Floor",
                workforce_type_id: 10,
                log_asset_id: request.asset_id || request.auth_asset_id,
                asset_id: request.asset_id,
                account_id: accountID,
                organization_id: organizationID
            })
            if (errFour || Number(customerWorkforceResponse.workforce_id) === 0) {
                console.log("[createAccount | customerWorkforceResponse] Error creating workforce: ", errFour);
            }
            workforces.push({
                workforce_id: customerWorkforceResponse.workforce_id,
                workforce_name: "Customer Floor"
            });
        
        }

        return [false, {
            message: "Created account and workforces.",
            account_id: accountID,
            workforces
        }]
    }

    async function fireDeskAssetCreationService(request, employee, workforceDeskAssetTypeID, workforceID, workforceName, accountID, organizationID) {
        const addDeskAssetRequest = {
            asset_id: request.auth_asset_id,
            asset_token_auth: request.asset_token_auth,
            asset_first_name: employee.emp_designation,
            asset_last_name: "",
            asset_description: employee.emp_designation,
            customer_unique_id: 0,
            asset_image_path: "",
            id_card_json: JSON.stringify({}),
            country_code: Number(request.contact_phone_country_code),
            phone_number: Number(request.contact_phone_number),
            email_id: request.contact_email || "",
            timezone_id: 0,
            asset_type_id: workforceDeskAssetTypeID || 0,
            operating_asset_id: 0,
            manager_asset_id: 0,
            workforce_id: workforceID,
            workforce_name: workforceName,
            account_id: accountID,
            organization_name: request.organization_name,
            organization_id: organizationID,
            log_asset_id: 31981,
            stream_type_id: 11018,
            asset_type_category_id: 3,
            asset_status_id: 3
        };
        const addDeskAssetAsync = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form: addDeskAssetRequest
        };
        let deskAssetID = 0, contactCardActivityID = 0;
        try {
            // global.config.mobileBaseUrl + global.config.version
            // https://stagingapi.worlddesk.cloud/r0
            const response = await addDeskAssetAsync(global.config.mobileBaseUrl + global.config.version + '/admin/workforce/desk/add', makeRequestOptions);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                console.log("createAccount | createWorkforce | fireDeskAssetCreationService | Body: ", body);
                deskAssetID = body.response.asset_id;
                contactCardActivityID = body.response.activity_id;
            }
        } catch (error) {
            console.log("createAccount | createWorkforce | fireDeskAssetCreationService | Error: ", error);
            return [error, deskAssetID, contactCardActivityID];
        }

        return [false, deskAssetID, contactCardActivityID];
    }

    async function fireEmployeeAssetCreationService(request, employee, workforceEmployeeAssetTypeID, workforceID, workforceName, accountID, organizationID, deskAssetID) {
        const addEmployeeAssetRequest = {
            asset_id: request.auth_asset_id,
            asset_token_auth: request.asset_token_auth,
            asset_first_name: employee.emp_first_name,
            asset_last_name: employee.emp_last_name,
            customer_unique_id: employee.emp_id,
            gender_id: 4,
            asset_image_path: "",
            id_card_json: JSON.stringify({}),
            country_code: employee.emp_coutry_code,
            phone_number: employee.emp_phone,
            email_id: employee.emp_email,
            timezone_id: 0,
            asset_type_id: workforceEmployeeAssetTypeID,
            operating_asset_id: 0,
            manager_asset_id: 0,
            workforce_id: workforceID,
            account_id: accountID,
            organization_id: organizationID,
            log_asset_id: request.auth_asset_id,
            stream_type_id: 11006,
            workforce_name: workforceName,
            account_city: request.account_city,
            organization_name: request.organization_name,
            joined_datetime: util.getCurrentUTCTime(),
            desk_asset_id: deskAssetID,
            asset_access_role_id: 1,
            asset_access_level_id: 5
        };
        const addEmployeeAssetAsync = nodeUtil.promisify(makeRequest.post);
        const makeRequestOptions = {
            form: addEmployeeAssetRequest
        };
        let employeeAssetID = 0, idCardActivityID = 0;
        try {
            // global.config.mobileBaseUrl + global.config.version
            // https://stagingapi.worlddesk.cloud/r0
            const response = await addEmployeeAssetAsync(global.config.mobileBaseUrl + global.config.version + '/admin/workforce/desk/employee/add', makeRequestOptions);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                console.log("createAccount | createWorkforce | fireEmployeeAssetCreationService | Body: ", body);
                employeeAssetID = body.response.operating_asset_id;
                idCardActivityID = body.response.id_card_activity_id;
            }
        } catch (error) {
            console.log("createAccount | createWorkforce | fireEmployeeAssetCreationService | Error: ", error);
            return [error, employeeAssetID, idCardActivityID];
        }

        return [false, employeeAssetID, idCardActivityID];
    }

    // Account List Insert
    async function accountListInsert(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.account_city, // account_name
            request.account_image_path || '', // account_image_path
            request.account_phone_country_code || request.organization_phone_country_code || 0, // account_phone_country_code
            request.account_phone_number || request.organization_phone_number || 0, // account_phone_number
            request.account_email || '', // account_email
            request.account_address || '', // account_address
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

    this.updateAssetDetails = async function (request) {
        const [err, assetData] = await assetListUpdateDetails(request)
        return [err, assetData]
    }

    // Account List History Insert
    async function assetListUpdateDetails(request, employeeAssetID = 0, logAssetID = 0) {
        // IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_asset_first_name VARCHAR(50), IN p_asset_last_name VARCHAR(50), 
        // IN p_description VARCHAR(150), IN p_cuid VARCHAR(50), 
        // IN p_old_phone_number VARCHAR(20), IN p_old_country_code SMALLINT(6), 
        // IN p_phone_number VARCHAR(20), IN p_country_code SMALLINT(6), IN p_log_asset_id BIGINT(20), 
        // IN p_log_datetime DATETIME, IN p_joining_datetime DATETIME, IN p_gender_id TINYINT(4)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            employeeAssetID || request.asset_id,
            request.organization_id,
            request.asset_first_name,
            request.asset_last_name,
            request.description || "",
            request.cuid,
            request.old_phone_number,
            request.old_country_code,
            request.phone_number,
            request.country_code,
            logAssetID || request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime(),
            request.joining_datetime,
            request.gender_id,
            request.email_id
        );
        const queryString = util.getQueryString('ds_p1_2_asset_list_update_details', paramsArr);

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

    this.updateActivityTypeDefaultDuration = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        const [errOne, workforceActivityTypeMappingData] = await workforceActivityTypeMappingUpdateDuration({
            activity_type_id: request.activity_type_id,
            duration: request.duration,
            log_asset_id: request.log_asset_id || request.asset_id,
        }, organizationID, accountID, workforceID);

        if (errOne) {
            console.log("updateActivityTypeDefaultDuration | workforceActivityTypeMappingUpdateDuration | Error", errOne);

        } else {
            // History insert
            try {
                await workforceActivityTypeMappingHistoryInsert({
                    update_type_id: 0
                }, request.activity_type_id, organizationID);
            } catch (error) {
                console.log("updateActivityTypeDefaultDuration | workforceActivityTypeMappingHistoryInsert | Error", error);
            }
        }

        const [errTwo, workforceFormMappingData] = await workforceFormMappingUpdateActivityDuration({
            activity_type_id: request.activity_type_id,
            duration: request.duration,
            log_asset_id: request.log_asset_id || request.asset_id,
        }, organizationID);

        if (errTwo) {
            console.log("updateActivityTypeDefaultDuration | workforceFormMappingUpdateActivityDuration | Error", errTwo);
        }

        const [errThree, formEntityMappingData] = await formEntityMappingUpdateActivityDuration({
            activity_type_id: request.activity_type_id,
            duration: request.duration,
            log_asset_id: request.log_asset_id || request.asset_id,
        }, organizationID);

        if (errThree) {
            console.log("updateActivityTypeDefaultDuration | formEntityMappingUpdateActivityDuration | Error", errThree);
        }

        return [false, {
            message: "done",
        }]
    }

    // Workforce Activity Type Mapping Update Duration
    async function workforceActivityTypeMappingUpdateDuration(request, organizationID, accountID, workforceID) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_activity_type_id BIGINT(20), 
        // IN p_duration SMALLINT(6), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.activity_type_id,
            request.duration,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_update_duration', paramsArr);

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

    // Workforce Form Mapping Update Activity Duration
    async function workforceFormMappingUpdateActivityDuration(request, organizationID) {
        // IN p_organization_id BIGINT(20), IN p_activity_type_id BIGINT(20), 
        // IN p_duration BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            request.activity_type_id,
            request.duration,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_update_activity_duration', paramsArr);

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

    // Workforce Form Mapping Update Duration
    async function workforceFormMappingHistoryInsert(request, organizationID) {
        // IN p_form_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_update_type_id SMALLINT(6), IN p_update_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.form_id,
            organizationID,
            request.update_type_id || 0,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_history_insert', paramsArr);

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

    // Form Entity Mapping Update Duration
    async function formEntityMappingUpdateActivityDuration(request, organizationID) {
        // IN p_organization_id BIGINT(20), IN p_activity_type_id BIGINT(20), 
        // IN p_duration BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            request.activity_type_id,
            request.duration,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_form_entity_mapping_update_activity_duration', paramsArr);

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

    this.addStatusTag = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        const [errOne, activityStatusTagListData] = await activityStatusTagListInsert(request, organizationID, accountID, workforceID);

        if (errOne) {
            console.log("addStatusTag | activityStatusTagListInsert | Error", errOne);
        }
        return [errOne, activityStatusTagListData];
    }

    // Status Tag List Insert
    async function activityStatusTagListInsert(request, organizationID, accountID, workforceID) {
        // IN p_activity_status_tag_name VARCHAR(50), IN p_level_id SMALLINT(6), 
        // N p_activity_type_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_account_id  BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.activity_status_tag_name,
            request.level_id || 1,
            request.activity_type_id,
            workforceID,
            accountID,
            organizationID,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_activity_status_tag_list_insert', paramsArr);

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

    this.deleteStatusTag = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id),
            activityStatusTagID = Number(request.activity_status_tag_id);

        // Delete the Status Tag
        const [errOne, activityStatusTagListData] = await activityStatusTagListDelete(request, organizationID, accountID, workforceID);
        if (errOne) {
            return [errOne, []]
        }

        // Fetch activity statuses to status tag mappings
        const [errTwo, activityStatusMappingData] = await adminListingService.workforceActivityStatusMappingSelectFlag(request);
        if (errTwo) {
            return [errTwo, []]
        }

        // Unset status tag for each activity status mapping entry
        for (const activityStatusMapping of activityStatusMappingData) {
            const [errThree, _] = await workforceActivityStatusMappingUpdateTag({
                activity_status_id: activityStatusMapping.activity_status_id,
                activity_status_tag_id: 0,
                asset_id: request.asset_id
            }, organizationID, accountID, workforceID);
        }

        return [false, []]
    };

    // Status Tag List Delete
    async function activityStatusTagListDelete(request, organizationID, accountID, workforceID) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_activity_status_tag_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.activity_status_tag_id,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_activity_status_tag_list_delete', paramsArr);

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

    // Update Status Tag for an activity status
    async function workforceActivityStatusMappingUpdateTag(request, organizationID, accountID, workforceID) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_activity_status_id BIGINT(20), IN p_status_tag_id BIGINT(20), IN p_log_asset_id BIGINT(20), 
        // IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.activity_status_id,
            request.activity_status_tag_id,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_update_tag', paramsArr);

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

    this.upateDeskAndEmployeeAsset = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id),
            employeeAssetID = Number(request.employee_asset_id),
            deskAssetID = Number(request.desk_asset_id);

        if (employeeAssetID != 0) {
            // Update the Employee's details in the asset_list table
            const [errOne, employeeAssetData] = await assetListUpdateDetails(request, employeeAssetID, Number(request.asset_id));
            if (errOne) {
                logger.error(`upateDeskAndEmployeeAsset.assetListUpdateDetails_EMPLOYEE`, { type: 'admin_ops', request_body: request, error: errOne });
                return [errOne, []]
            }

            // Fetch the Employee's ID card
            const [errTwo, idCardData] = await adminListingService.activityAssetMappingSelectAssetIdCard({
                asset_id: employeeAssetID
            }, organizationID);
            if (errTwo || Number(idCardData.length) === 0
            ) {
                logger.error(`upateDeskAndEmployeeAsset.activityAssetMappingSelectAssetIdCard`, { type: 'admin_ops', request_body: request, error: errOne });
                return [errTwo, []]
            }
            const idCardActivityID = Number(idCardData[0].activity_id);
            let idCardJSON = JSON.parse(idCardData[0].activity_inline_data);
            idCardJSON.employee_first_name = request.asset_first_name;
            idCardJSON.employee_last_name = request.asset_last_name;
            (request.desk_title && String(request.desk_title) !== '') ? idCardJSON.employee_designation = request.desk_title : null;
            idCardJSON.employee_id = request.cuid;
            idCardJSON.employee_email_id = request.email_id;
            idCardJSON.employee_date_joining = request.joining_datetime;
            idCardJSON.employee_phone_country_code = request.country_code;
            idCardJSON.employee_phone_number = request.phone_number;

            // Update the ID Card's Activity List table
            try {
                await activityListUpdateInlineData({
                    activity_id: idCardActivityID,
                    activity_inline_data: JSON.stringify(idCardJSON)
                }, organizationID);
            } catch (error) {
                logger.error(`upateDeskAndEmployeeAsset.activityListUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
            }

            // Update the ID Card's Activity Asset Mapping table
            try {
                await activityAssetMappingUpdateInlineData({
                    activity_id: idCardActivityID,
                    asset_id: employeeAssetID,
                    activity_inline_data: JSON.stringify(idCardJSON),
                    pipe_separated_string: '',
                    log_asset_id: request.asset_id
                }, organizationID);
            } catch (error) {
                logger.error(`upateDeskAndEmployeeAsset.activityAssetMappingUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
            }

            try{
                let newReq = {
                    activity_id: idCardActivityID,
                    activity_inline_data: JSON.stringify(idCardJSON),
                    asset_id: employeeAssetID,
                    operating_asset_id: 0
                };                
                await activityAssetMappingUpdateOperationAssetData(newReq, organizationID);
                await activityListUpdateOperatingAssetData(newReq, organizationID);
            } catch(error){
                logger.error(`upateDeskAndEmployeeAsset.activityAssetMappingUpdateOperationAssetData`, { type: 'admin_ops', request_body: request, error });
                logger.error(`upateDeskAndEmployeeAsset.activityListUpdateOperatingAssetData`, { type: 'admin_ops', request_body: request, error });
            }          
        }

        if (deskAssetID !== 0) {
            // Update the Employee's details in the asset_list table
            const [errThree, employeeAssetData] = await assetListUpdateDetailsV3({

                ...request,
                description: request.desk_title,
                asset_first_name: request.desk_title,
                asset_last_name: "",
                operating_asset_first_name: request.asset_first_name,
                operating_asset_last_name: request.asset_last_name

            }, deskAssetID, Number(request.asset_id));
            if (errThree) {
                logger.error(`upateDeskAndEmployeeAsset.assetListUpdateDetailsV3_DESK`, { type: 'admin_ops', request_body: request, error: errThree });
                return [errThree, []]
            }

            // Fetch the desk's contact card
            // Fetch the Employee's ID card
            const [errFour, contactCardData] = await adminListingService.activityListSelectCategoryContact({
                asset_id: deskAssetID
            }, organizationID);
            if (errFour || Number(contactCardData.length) === 0
            ) {
                logger.error(`upateDeskAndEmployeeAsset.activityListSelectCategoryContact`, { type: 'admin_ops', request_body: request, error: errFour });
                return [errFour, []]
            }
            const contactCardActivityID = Number(contactCardData[0].activity_id);
            let contactCardJSON = JSON.parse(contactCardData[0].activity_inline_data);

            contactCardJSON.contact_designation = request.desk_title;
            contactCardJSON.contact_first_name = request.desk_title;
            contactCardJSON.contact_operating_asset_name = request.asset_first_name;
            contactCardJSON.contact_phone_country_code = request.country_code;
            contactCardJSON.contact_phone_number = request.phone_number;

            // Update the Contact Card's Activity List table
            try {
                await activityListUpdateInlineData({
                    activity_id: contactCardActivityID,
                    activity_inline_data: JSON.stringify(contactCardJSON)
                }, organizationID);
            } catch (error) {
                logger.error(`upateDeskAndEmployeeAsset.activityListUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
            }

            // Update the Contact Card's Activity Asset Mapping table
            try {
                await activityAssetMappingUpdateInlineData({
                    activity_id: contactCardActivityID,
                    asset_id: deskAssetID,
                    activity_inline_data: JSON.stringify(contactCardJSON),
                    pipe_separated_string: '',
                    log_asset_id: request.asset_id
                }, organizationID);
            } catch (error) {
                logger.error(`upateDeskAndEmployeeAsset.activityAssetMappingUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
            }

            // Update admin flags for the desk asset
            try {
                await self.updateAssetFlags({
                    ...request,
                    asset_id: deskAssetID,
                    flag: 0,
                    set_admin_flag: request.asset_flag_account_admin,
                    set_organization_admin_flag: request.asset_flag_organization_admin
                });
            } catch (error) {
                logger.error(`upateDeskAndEmployeeAsset.updateAssetFlags [Desk]`, { type: 'admin_ops', request_body: request, error });
            }

            // Update admin flags for the employee asset
            try {
                await self.updateAssetFlags({
                    ...request,
                    asset_id: employeeAssetID,
                    flag: 0,
                    set_admin_flag: request.asset_flag_account_admin,
                    set_organization_admin_flag: request.asset_flag_organization_admin
                });
            } catch (error) {
                logger.error(`upateDeskAndEmployeeAsset.updateAssetFlags [Employee]`, { type: 'admin_ops', request_body: request, error });
            }

            try{
                let newReq = {
                    activity_id: contactCardActivityID,
                    activity_inline_data: JSON.stringify(contactCardJSON),
                    asset_id: deskAssetID,
                    operating_asset_id: employeeAssetID
                };                
                await activityAssetMappingUpdateOperationAssetData(newReq, organizationID);
                await activityListUpdateOperatingAssetData(newReq, organizationID);
            } catch(error){
                logger.error(`upateDeskAndEmployeeAsset.activityAssetMappingUpdateOperationAssetData`, { type: 'admin_ops', request_body: request, error });
                logger.error(`upateDeskAndEmployeeAsset.activityListUpdateOperatingAssetData`, { type: 'admin_ops', request_body: request, error });
            }
        }

        //Update Manager Details
        let newReq = Object.assign({}, request);
            newReq.asset_id = deskAssetID;
        this.updateAssetsManagerDetails(newReq);

        return [false, []];
    }

    // Asset List Insert For Employee Desk
    async function assetListUpdateDetailsV3(request, deskAssetID = 0, logAssetID = 0) {
        // IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_asset_first_name VARCHAR(50), 
        // IN p_asset_last_name VARCHAR(50), IN p_operating_asset_first_name VARCHAR(50), 
        // IN p_operating_asset_last_name VARCHAR(50), IN p_description VARCHAR(150), IN p_cuid VARCHAR(50), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME, IN p_joining_datetime DATETIME, 
        // IN p_gender_id TINYINT(4), IN p_email VARCHAR(100)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            deskAssetID || request.asset_id,
            request.organization_id,
            request.asset_first_name || request.description || "",
            request.asset_last_name || "",
            request.operating_asset_first_name || "",
            request.operating_asset_last_name || "",
            request.description || "",
            request.cuid,
            logAssetID || request.asset_id,
            util.getCurrentUTCTime(),
            request.joining_datetime,
            request.gender_id,
            request.email_id
        );
        const queryString = util.getQueryString('ds_p1_3_asset_list_update_details', paramsArr);
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
    };

    this.updateAssetFlags = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id),
            assetId = Number(request.asset_id),
            flag = Number(request.flag),
            flag_admin = Number(request.set_admin_flag),
            flag_organization_admin = Number(request.set_organization_admin_flag);

        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            assetId,
            flag,
            flag_admin,
            flag_organization_admin,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_admin_flags', paramsArr);

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
    };

    this.queueWithStatusTag = async function (request) {             
        let responseData = [],
            error = true;            
        
        let statusTags = JSON.parse(request.status_tag_ids);
        let finalStatusIdsArray = new Array;
        let iterator_x;
        let iterator_y;

        console.log('statusTags : ', statusTags);

        for(iterator_x=0; iterator_x < statusTags.length; iterator_x++) {
            let newReqObj = Object.assign({}, request);
            newReqObj.activity_status_tag_id = statusTags[iterator_x].status_tag_id;
            let [err, statusList] = await adminListingService.workforceActivityStatusMappingSelectFlag(newReqObj);

            if (err) {
                return [true, {
                    message: "Error retrieving the status ids based on status tag!"
                }]
            }

            console.log('statusList.length : ', statusList.length);

            for(iterator_y=0; iterator_y < statusList.length; iterator_y++) {
                let temp = {};
                temp.activity_status_id = statusList[iterator_y].activity_status_id;
                console.log('statusList for ', statusTags[iterator_x].status_tag , ' ------ ' ,statusList[iterator_y].activity_status_id);
                finalStatusIdsArray.push(temp);
            }                        

            console.log('*******************************************');
            console.log('finalStatusIdsArray : ', finalStatusIdsArray);
        }

        request.queue_inline_data = JSON.stringify(finalStatusIdsArray);
        request.log_asset_id = request.asset_id;
        request.log_datetime = util.getCurrentUTCTime();
        await activityCommonService.makeRequest(
            request,
            'workflowQueue/add',
            1
        ).then(()=>{
            error = false;
        }).catch((err)=>{
            error = true;
        });        
        
        return [error, responseData];
    };

    this.uploadSmartForm = async (request) => {       
        //let jsonFormat = await util.getJSONfromXcel(request);   
        
        let fileName = request.bucket_url;
        const result = excelToJson({sourceFile: fileName});
        jsonFormat = JSON.stringify(result, null, 4)
        
        console.log('typeof jsonformat : ', typeof jsonFormat);
        let data = JSON.parse(jsonFormat);
        let sheetsData = data['Sheet1'];

        //console.log('typeof sheetsData : ', typeof sheetsData);
        console.log('sheetsData.length : ', sheetsData.length);
        request.form_id = sheetsData[1].J;

        for(iterator_x = 1; iterator_x < sheetsData.length; iterator_x++) {
            //sheetsData[iterator_x].A //field_id
            //sheetsData[iterator_x].F //next_field_id

            //console.log('sheetsData[iterator_x].A : ', sheetsData[iterator_x].A);
            //console.log('sheetsData[iterator_x].F : ', sheetsData[iterator_x].F);

            const [updateError, updateStatus] = await workforceFormFieldMappingNextFieldIdUpdate(request, {
                field_id: sheetsData[iterator_x].A,
                data_type_combo_id: sheetsData[iterator_x].E,
                field_name: sheetsData[iterator_x].B,
                field_description: '',
                data_type_combo_value: sheetsData[iterator_x].G,
                field_sequence_id: sheetsData[iterator_x].C,
                field_mandatory_enabled: sheetsData[iterator_x].D,
                field_preview_enabled: '0',
                next_field_id: sheetsData[iterator_x].F
            });
        }

        /*let form_fields = new Array();        

        let iterator_x;
        let formName = sheetsData[0].K;
        let prevFieldId = 0;
        let prevDataTypeId = 0;
        
        let dataValue_33 = [];        
        let dataValue_34 = [];           

        for(iterator_x = 1; iterator_x < sheetsData.length; iterator_x++) {            
            //console.log(sheetsData[iterator_x]);

            let temp = {};
                temp.placeholder = "";
                temp.label = sheetsData[iterator_x].B;
                temp.title = sheetsData[iterator_x].B;
                temp.datatypeid = sheetsData[iterator_x].H;
                temp.datatypecategoryid = "";

            let data = {};
                data.values = [];
                data.json = "";
                data.url = "",
                data.resource = "",
                data.custom = "";
            temp.data = data;

            let validate = {};
                validate.required = (Number(sheetsData[iterator_x].D) === 1) ? true : false;
                validate.minLength = "";
                validate.maxLength = "";
                validate.pattern = "";
                validate.custom = "";
                validate.customPrivate = false;
            temp.validate = validate;

            let conditional = {};
                conditional.show = false;
                conditional.when = null;
                conditional.eq = "";
            temp.conditional = conditional;

            if(sheetsData[iterator_x].H === 33) { //Single Selection                
                
                let optionObj = {};
                    optionObj.label = sheetsData[iterator_x].G;
                    optionObj.value = sheetsData[iterator_x].G;
                    
                dataValue_33.push(optionObj);
            } else if(sheetsData[iterator_x].H === 34) { //Multi Selection

                let optionObj = {};
                    optionObj.label = sheetsData[iterator_x].G;
                    optionObj.value = sheetsData[iterator_x].G;
                    
                dataValue_34.push(optionObj);

            } else { //Create a new row
                if(prevDataTypeId === 33) {
                    let temp_33 = {};
                        temp_33.placeholder = "";
                        temp_33.label = sheetsData[iterator_x-1].B;
                        temp_33.title = sheetsData[iterator_x-1].B;
                        temp_33.datatypeid = sheetsData[iterator_x-1].H;
                        temp_33.datatypecategoryid = "";

                    let data_33 = {};
                        data_33.values = dataValue_33;
                        data_33.json = "";
                        data_33.url = "",
                        data_33.resource = "",
                        data_33.custom = "";
                    temp_33.data = data_33;
        
                    let validate_33 = {};
                        validate_33.required = (Number(sheetsData[iterator_x-1].D) === 1) ? true : false;
                        validate_33.minLength = "";
                        validate_33.maxLength = "";
                        validate_33.pattern = "";
                        validate_33.custom = "";
                        validate_33.customPrivate = false;
                    temp_33.validate = validate;

                    dataValue_33 = [];
                    form_fields.push(temp_33);
                } else if(prevDataTypeId === 34) {
                    let temp_34 = {};
                        temp_34.placeholder = "";
                        temp_34.label = sheetsData[iterator_x-1].B;
                        temp_34.title = sheetsData[iterator_x-1].B;
                        temp_34.datatypeid = sheetsData[iterator_x-1].H;
                        temp_34.datatypecategoryid = "";

                    let data_34 = {};
                        data_34.values = dataValue_33;
                        data_34.json = "";
                        data_34.url = "",
                        data_34.resource = "",
                        data_34.custom = "";
                    temp_34.data = data_34;
        
                    let validate_34 = {};
                        validate_34.required = (Number(sheetsData[iterator_x-1].D) === 1) ? true : false;
                        validate_34.minLength = "";
                        validate_34.maxLength = "";
                        validate_34.pattern = "";
                        validate_34.custom = "";
                        validate_34.customPrivate = false;
                    temp_34.validate = validate;

                    dataValue_34 = [];
                    form_fields.push(temp_34);
                }

                form_fields.push(temp);
            }

            if(iterator_x === 15) {
                break;
            }
            //prevFieldId = sheetsData[iterator_x].A;
            prevDataTypeId = sheetsData[iterator_x].H;
        }
        
        console.log('form_fields : ', form_fields);
        console.log('*****************');   

        //Add Form
        let formRequestParams = {};
            formRequestParams.account_id = request.account_id;
            formRequestParams.activity_id = 0;
            formRequestParams.activity_type_id = 0;
            formRequestParams.add_default_widget = true;
            formRequestParams.auth_asset_id = request.asset_id;       
            formRequestParams.asset_id = 100;       
            formRequestParams.asset_token_auth = request.asset_token_auth;
            formRequestParams.entity_level_id = 3;
            formRequestParams.form_activity_type_id = 142427;
            formRequestParams.form_description = "";
            formRequestParams.form_fields = JSON.stringify(form_fields);
            formRequestParams.form_name = formName;
            formRequestParams.form_type_id = 23;
            formRequestParams.group_id = 0;
            formRequestParams.is_workflow = 1;
            formRequestParams.is_workflow_origin = 0;
            formRequestParams.organization_id = request.organization_id;
            formRequestParams.timezone_id = 0;
            formRequestParams.track_gps_accuracy = 0;
            formRequestParams.track_gps_datetime = util.getCurrentUTCTime();
            formRequestParams.track_gps_location = 0;
            formRequestParams.track_gps_status = 0;
            formRequestParams.track_latitude = 0;
            formRequestParams.track_longitude = 0;
            formRequestParams.workflow_percentage = 0;
            formRequestParams.workforce_id = request.workforce_id;

        await activityCommonService.makeRequest(
            formRequestParams,
            'form/add',
            1
        );*/

        return [false, 'success'];
        
    };

    async function workforceFormFieldMappingNextFieldIdUpdate(request, fieldOptions) {
        // IN p_field_id BIGINT(20), IN p_data_type_combo_id SMALLINT(6), 
        // IN p_form_id BIGINT(20), IN p_field_name VARCHAR(1200), 
        // IN p_field_description VARCHAR(300), IN p_data_type_combo_value VARCHAR(1200), 
        // IN p_field_sequence_id BIGINT(20), IN p_field_mandatory_enabled TINYINT(4), 
        // IN p_field_preview_enabled TINYINT(4), IN p_organization_id BIGINT(20), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let fieldUpdateStatus = [],
            error = false; // true;

        let paramsArr = new Array(
            fieldOptions.field_id,
            fieldOptions.data_type_combo_id,
            request.form_id,                        
            fieldOptions.field_sequence_id,
            fieldOptions.field_mandatory_enabled,
            fieldOptions.field_preview_enabled,
            fieldOptions.next_field_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_update_next_field', paramsArr);
        if (queryString !== '') {
            // console.log(queryString)
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    fieldUpdateStatus = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, fieldUpdateStatus];
    }

    this.updateStatusTagName = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id),
            activityStatusTagID = Number(request.activity_status_tag_id);

        // Delete the Status Tag
        const [errOne, activityStatusTagListData] = await activityStatusTagListUpdateName(request, organizationID, accountID, workforceID);
        if (errOne) {
            return [errOne, []]
        }

        return [false, activityStatusTagListData]
    };

    // Status Tag List Name Update
    async function activityStatusTagListUpdateName(request, organizationID, accountID, workforceID) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_activity_status_tag_id BIGINT(20), IN p_activity_status_tag_name VARCHAR(100), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.activity_status_tag_id,
            request.activity_status_tag_name,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_activity_status_tag_list_update', paramsArr);

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

    this.workflowUpdatePersistRoleFlag = async function (request, persistRoleFlag) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        const [error, responseData] = await workforceActivityTypeMappingPersistRoleFlagUpdate({
            ...request,
            activity_flag_persist_role: persistRoleFlag
        }, organizationID, accountID, workforceID);
        if (error) {
            return [error, { message: "Error updating role flag" }];
        }
        return [error, responseData];
    }

    // Workforce Activity Type Mapping Persist Role Flag Update
    async function workforceActivityTypeMappingPersistRoleFlagUpdate(request, organizationID, accountID, workforceID) {
        // organization_id, account_id, workforce_id, activity_type_id, activity_type_name, activity_type_description, 
        // activity_flag_persist_role, access_level_id, log_asset_id, log_datetime
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.activity_type_id,
            request.activity_type_name,
            request.activity_type_description,
            request.activity_flag_persist_role,
            request.access_level_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_2_workforce_activity_type_mapping_update', paramsArr);

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

    this.createRole = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);
        const [error, assetTypeData] = await workforceAssetTypeMappingInsertRole(request, organizationID, accountID, workforceID);
        if (error) {
            return [error, { message: "Error creating role" }];
        }
        return [error, assetTypeData];
    }

    // Workforce Aseet Type Mapping Insert
    async function workforceAssetTypeMappingInsertRole(request, organizationID, accountID, workforceID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_type_name || '',
            request.asset_type_description || '',
            request.asset_type_category_id || 0,
            request.asset_type_level_id || 0,
            request.asset_type_flag_organization_specific,
            workforceID,
            accountID,
            organizationID,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_1_workforce_asset_type_mapping_insert', paramsArr);

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

    this.updateRoleName = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        const [error, assetTypeData] = await workforceAssetTypeMappingUpdateRoleName(request, organizationID, accountID, workforceID);
        if (error) {
            return [error, { message: "Error updating role's name" }];
        }
        return [error, assetTypeData];
    }

    // Workforce Aseet Type Mapping Update Role's Name
    async function workforceAssetTypeMappingUpdateRoleName(request, organizationID, accountID, workforceID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_type_id,
            request.asset_type_name,
            workforceID,
            accountID,
            organizationID,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_update', paramsArr);

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

    this.archiveRole = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        // Check if there are assets/desks with this role
        const [errOne, assetData] = await adminListingService.assetListSelectRole(request);
        if (errOne) {
            return [errOne, { message: "Error checking if there are assets with this role" }];
        } else if (assetData.length > 0) {
            return [true, { message: "Cannot archive role; delete assets with this role before archiving" }];
        }

        // Check for status-role bindings
        const [errTwo, statusData] = await adminListingService.workforceActivityStatusMappingSelectRole(request);
        if (errTwo) {
            return [errTwo, { message: "Error checking if there are statuses associated with this role" }];
        } else if (statusData.length > 0) {
            return [true, { message: "Cannot archive role; delete statuses associated with this role before archiving" }];
        }

        try {
            await workforceAssetTypeMappingDelete(request, organizationID, accountID, workforceID);
        } catch (error) {
            return [error, { message: `Error archiving role ${request.asset_type_id}` }]
        }

        return [false, { message: `Role ${request.asset_type_id} archived successfully` }];
    }

    // Workforce Aseet Type Mapping Delete Role
    async function workforceAssetTypeMappingDelete(request, organizationID, accountID, workforceID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_type_id,
            workforceID,
            accountID,
            organizationID,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_delete', paramsArr);

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

    //Update the Asset Type
    this.updateAssetType = async (request) => {
        //async function updateAssetType(request){
            const paramsArr = new Array(
                request.asset_id,
                request.asset_type_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.log_asset_id || request.asset_id,
                util.getCurrentUTCTime()
            );
            const queryString = util.getQueryString('ds_p1_asset_list_update_asset_type', paramsArr);
            if (queryString != '') {
                return await (db.executeQueryPromise(0, queryString, request));
            }
    }
    
    //Update the Asset's Manager Data
    this.updateAssetsManagerDetails = async (request) => {
        let responseData = [],
            error = false;
        //async function updateAssetsManagerDetails(request){
        //1.Update in asset_list
        //2.Update Contact Card
        //3.Update ID Card 
        let deskAssetID = request.asset_id;
        let organizationID = request.organization_id;
        const paramsArr = new Array(
                deskAssetID, //desk_asset_id
                request.manager_asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.log_asset_id || request.asset_id,
                util.getCurrentUTCTime()
            );
            const queryString = util.getQueryString('ds_p1_asset_list_update_manager', paramsArr);
            if (queryString != '') {
                await (db.executeQueryPromise(0, queryString, request));
            }

        //STEP 2. Get Contact Card - AND - Update the data
        // Fetch the desk's contact card
        // Fetch the Employee's ID card
        const [errOne, contactCardData] = await adminListingService.activityListSelectCategoryContact({
            asset_id: deskAssetID
        }, organizationID);

        if (errOne || Number(contactCardData.length) === 0
        ) {
            logger.error(`upateDeskAndEmployeeAsset.activityListSelectCategoryContact`, { type: 'admin_ops', request_body: request, error: errOne });
            return [errOne, []]
        }
        
        //console.log('contactCardData : ', contactCardData);

        const contactCardActivityID = Number(contactCardData[0].activity_id);
        let contactCardJSON = JSON.parse(contactCardData[0].activity_inline_data);
            contactCardJSON.contact_manager_asset_id = request.manager_asset_id;

        let employeeAssetID = Number(contactCardJSON.contact_operating_asset_id);
        
        // Update the Contact Card's Activity List table
        try {
            await activityListUpdateInlineData({
                activity_id: contactCardActivityID,
                activity_inline_data: JSON.stringify(contactCardJSON)
            }, organizationID);
        } catch (error) {
            logger.error(`upateDeskAndEmployeeAsset.activityListUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
        }

        // Update the Contact Card's Activity Asset Mapping table
        try {
            await activityAssetMappingUpdateInlineData({
                activity_id: contactCardActivityID,
                asset_id: deskAssetID,
                activity_inline_data: JSON.stringify(contactCardJSON),
                pipe_separated_string: '',
                log_asset_id: request.asset_id
            }, organizationID);
        } catch (error) {
            logger.error(`upateDeskAndEmployeeAsset.activityAssetMappingUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
        }

        //STEP 3. Get ID Card - AND - Update the data
        // Fetch the Employee's ID card
        const [errTwo, idCardData] = await adminListingService.activityAssetMappingSelectAssetIdCard({
            asset_id: employeeAssetID
        }, organizationID);
        if (errTwo || Number(idCardData.length) === 0
        ) {
            logger.error(`upateDeskAndEmployeeAsset.activityAssetMappingSelectAssetIdCard`, { type: 'admin_ops', request_body: request, error: errOne });
            return [errTwo, []]
        }
        const idCardActivityID = Number(idCardData[0].activity_id);
        let idCardJSON = JSON.parse(idCardData[0].activity_inline_data);
            idCardJSON.employee_manager_asset_id = request.manager_asset_id;

        // Update the ID Card's Activity List table
        try {
            await activityListUpdateInlineData({
                activity_id: idCardActivityID,
                activity_inline_data: JSON.stringify(idCardJSON)
            }, organizationID);
        } catch (error) {
            logger.error(`upateDeskAndEmployeeAsset.activityListUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
        }

        // Update the ID Card's Activity Asset Mapping table
        try {
            await activityAssetMappingUpdateInlineData({
                activity_id: idCardActivityID,
                asset_id: employeeAssetID,
                activity_inline_data: JSON.stringify(idCardJSON),
                pipe_separated_string: '',
                log_asset_id: request.asset_id
            }, organizationID);
        } catch (error) {
            logger.error(`upateDeskAndEmployeeAsset.activityAssetMappingUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
        }
     
    return [error, responseData];
    }

    this.updateStatusRoleMapping = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        const [error, statusData] = await workforceActivityStatusMappingUpdateRole(request, organizationID, accountID, workforceID);
        if (error) {
            return [error, { message: "Error updating role mapping, duration and percentage of a status" }];
        }
        return [error, statusData];
    }

    // Workforce Aseet Type Mapping Delete Role
    async function workforceActivityStatusMappingUpdateRole(request, organizationID, accountID, workforceID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.activity_status_id,
            request.flag,
            request.asset_type_id,
            request.percentage,
            request.duration,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_update_role', paramsArr);

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

    this.updateWorkflowValueContributors = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id),
            workflowActivityTypeID = Number(request.activity_type_id);

        const [errOne, workflowData] = await adminListingService.workforceActivityTypeMappingSelectID(request, workflowActivityTypeID);
        if (errOne) {
            return [new ClientInputError("Error fetching workflow's inline data", -9998), []];
        }

        if (workflowData.length > 0) {
            let workflowInlineData = JSON.parse(workflowData[0].activity_type_inline_data) || {};
            let existingWorkflowFieldsInlineData = workflowInlineData.hasOwnProperty("workflow_fields") ? workflowInlineData.workflow_fields : {};
            let newWorkflowFieldsInlineData = JSON.parse(request.workflow_fields);

            switch (Number(request.flag)) {
                case 1: // Update the complete inline data
                    if (Object.keys(newWorkflowFieldsInlineData).length > 5) {
                        return [new ClientInputError("A workflow can only have upto 5 value contributors", -3001), []];
                    }
                    workflowInlineData.workflow_fields = newWorkflowFieldsInlineData;
                    break;
                
                case 2: // Add fields
                    if (
                        (
                            Object.keys(newWorkflowFieldsInlineData).length +
                            Object.keys(existingWorkflowFieldsInlineData).length
                        ) > 5
                    ) {
                        return [new ClientInputError("A workflow can only have upto 5 value contributors", -3001), []];
                    }
                    workflowInlineData.workflow_fields = {
                        ...existingWorkflowFieldsInlineData,
                        ...newWorkflowFieldsInlineData
                    };
                    try {
                        await updateFormFieldValueContributorFlag(request, newWorkflowFieldsInlineData, 1);
                    } catch (error) {
                        // 
                        console.log(error);
                    }
                    break;
                
                case 3: // Remove fields
                    for (const fieldID of Object.keys(newWorkflowFieldsInlineData)) {
                        delete existingWorkflowFieldsInlineData[fieldID];
                    }
                    workflowInlineData.workflow_fields = existingWorkflowFieldsInlineData;
                    try {
                        await updateFormFieldValueContributorFlag(request, newWorkflowFieldsInlineData, 0);
                    } catch (error) {
                        // 
                        // console.log(error);
                    }
                    break;

                default:
                    return [new ClientInputError("Value of flag is invalid", -3001), []];
            }

            try {
                await workforceActivityTypeMappingUpdateInline({
                    ...request,
                    activity_type_id: workflowActivityTypeID,
                    inline_data: JSON.stringify(workflowInlineData)
                }, organizationID, accountID, workforceID)
                return [false, [workflowInlineData]];
            } catch (error) {
                return [new ClientInputError("Error updating the workflow's inline data", -9998), []];
            }
        }
        return [false, []]
    }

    async function updateFormFieldValueContributorFlag(request, workflowFieldsInlineData, value) {
        for (const fieldID of Object.keys(workflowFieldsInlineData)) {
            await workforceFormFieldMappingUpdateValueContibutorFlag({
                ...request,
                form_id: workflowFieldsInlineData[fieldID].form_id,
                field_id: fieldID,
                data_type_combo_id: 0,
                flag_value_contributor: value
            }, request.organization_id);
        }
    }

    async function workforceActivityTypeMappingUpdateInline(request, organizationID, accountID, workforceID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.activity_type_id,
            request.inline_data,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_update_inline', paramsArr);

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

    async function workforceFormFieldMappingUpdateValueContibutorFlag(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.field_id,
            request.data_type_combo_id || 0,
            request.form_id,
            organizationID,
            request.flag_value_contributor,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_update_value_contibutor_flag', paramsArr);

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

    this.addTagType = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        const [errOne, tagTypeData] = await tagTypeMasterInsert(request, organizationID);
        if (errOne) {
            return [new ClientInputError("Error adding a new Tag Type to the organization", -9998), []];
        }

        return [errOne, tagTypeData];
    }

    async function tagTypeMasterInsert(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.tag_type_name,
            request.tag_type_description,
            request.tag_type_category_id || 1,
            organizationID,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_tag_type_master_insert', paramsArr);

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

    this.addTag = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        if (
            !request.hasOwnProperty("tag_type_id") || 
            Number(request.tag_type_id) <= 0
        ) {
            return [new ClientInputError("tag_type_id missing or 0. Tags must be associated with a Tag Type.", -3001), []];
        }

        const [errOne, tagTypeData] = await tagListInsert(request, organizationID);
        if (errOne) {
            return [new ClientInputError("Error adding a new Tag to the organization", -9998), []];
        }

        return [errOne, tagTypeData];
    }

    async function tagListInsert(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.tag_name,
            request.tag_type_id,
            organizationID,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_tag_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    
                    request.tag_id = data[0].tag_id;
                    self.tagListHistoryInsert(request, 2001);
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.addActivityTypeToTagMapping = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        if (
            !request.hasOwnProperty("tag_id") ||
            Number(request.tag_id) <= 0 ||
            !request.hasOwnProperty("activity_type_id") ||
            Number(request.activity_type_id) <= 0
        ) {
            return [new ClientInputError("tag_id and activity_type_id must be a non-zero positive value. An activity_type_id is mapped to single tag_id.", -3001), []];
        }

        const [errOne, activityTypeTagMappingData] = await activityTypeTagMappingInsert(request, organizationID);
        if (errOne) {
            return [new ClientInputError("Error mapping an activity_type_id to a tag_id", -9998), []];
        }

        return [errOne, activityTypeTagMappingData];
    }

    async function activityTypeTagMappingInsert(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.tag_id,
            request.activity_type_id,
            organizationID,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_activity_type_tag_mapping_insert', paramsArr);

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

    
    //Set Business Hours @Account Level
    this.setBusinessHoursAccountLevel = async (request) =>{
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.account_inline_data,
            request.flag_enable_desk_workhours,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_account_list_update_inline_data', paramsArr);

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

    //Set Business Hours @Floor(Workforce) Level
    this.setBusinessHoursWorkforceLevel = async (request) =>{
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.workforce_inline_data,
            //request.flag_enable_desk_workhours,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_list_update_inline_data', paramsArr);

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

    //Set Business Hours @Individual(Desk) Level
    this.setBusinessHoursDeskLevel = async (request) =>{
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            request.flag_custom_workhours,
            request.asset_inline_data,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_inline_data', paramsArr);

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

    // Set form field's inline data
    this.workforceFormFieldMappingUpdateInline = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.field_id,
            request.data_type_combo_id || 0,
            request.form_id,
            request.field_name,
            request.inline_data,
            request.flag_value_contributor,
            request.flag_bot_dependency,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_update_inline', paramsArr);

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

    //Deletiing ActivityType Tag Id
    this.activityTypeTagDelete = async (request) =>{
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_id,
            request.asset_id,
            request.datetime_log
        );

        const queryString = util.getQueryString('ds_v1_tag_list_delete', paramsArr);
        
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;

                    self.tagListHistoryInsert(request, 2003);
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }    

    //tag history insert
    this.tagListHistoryInsert = async (request, updateTypeId) =>{
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_id,
            updateTypeId,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_tag_list_history_insert', paramsArr);

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

   //Delete tag type
    this.tagTypeDelete = async (request) =>{
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_id,
            request.asset_id,
            request.datetime_log
        );

        const queryString = util.getQueryString('ds_v1_tag_type_master_delete', paramsArr);
        
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    console.log('error :: '+error);
                })
        }
        return [error, responseData];
    }   

    this.assetListUpdateAdminFlag = async function (request) {

        if(request.flag == 3){
          const [error, responseData] = await checkManager(request, 0);
            if(responseData[0].count > 0){
                const [error1, responseData1] = await checkManager(request, 2);
                if(responseData1[0].count > 0){
                    request.is_manager = 2;
                    await updateAdminFlag(request);
                }else{
                    request.is_manager = 1;
                    await updateAdminFlag(request);
                }
            }else{
                request.is_manager = 0;
                await updateAdminFlag(request);
            }
        }else{
            await updateAdminFlag(request);
        }

        return [false,{}]
    }

    this.checkManagerDetails = async (request) => {
        request.target_asset_id = request.asset_id;
        return await checkManager(request, 3);
    }
    
    //check manager flag
    async function checkManager(request, checkFlag){
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.target_asset_id,
            checkFlag
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_manager_flag', paramsArr);

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

    //Set Admin Flags on targetAssetId
    async function updateAdminFlag(request){
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.target_asset_id,
            request.flag,
            request.is_admin,
            request.is_manager,
            request.is_org_admin,
            request.datetime_log
        );
        const queryString = util.getQueryString('ds_p1_1_asset_list_update_admin_flags', paramsArr);

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

    this.idProofUpload = async(request) => {

        //id_proof_document_1 - Adhaar Card
        //id_proof_document_2 - Pan Card
        //id_proof_document_3 - Passport

        let responseData = [],
            error = true;
    
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id),
            employeeAssetID = Number(request.employee_asset_id) || Number(request.asset_id),
            deskAssetID = Number(request.desk_asset_id);
    
        //1.Update in ID Card - If it exists
        //2.Update in contact Card - If it exists
        //3.Update in asset_list inline data
        //4.Make an entry in asset timeline entry
    
        
    //1.Update in ID Card - If it exists
        if (employeeAssetID != 0) {    
            // Fetch the Employee's ID card
            const [errTwo, idCardData] = await adminListingService.activityAssetMappingSelectAssetIdCard({
                                                    asset_id: employeeAssetID
                                                }, organizationID);
            
            if (errTwo || Number(idCardData.length) === 0) {
                logger.error(`idProofUpload.activityAssetMappingSelectAssetIdCard idCardData doesn't exist`, { type: 'admin_ops', request_body: request, error: errTwo });
                //return [errTwo, []]
            } else {
                const idCardActivityID = Number(idCardData[0].activity_id);
                let idCardJSON = JSON.parse(idCardData[0].activity_inline_data);
                    if(request.id_proof_document_1 !== "") {
                        idCardJSON.employee_id_proof_document_1 = request.id_proof_document_1;
                    }
                    
                    if(request.id_proof_document_2 !== "") {
                        idCardJSON.employee_id_proof_document_2 = request.id_proof_document_2;
                    } 

                    if(request.id_proof_document_3 !== "") {
                        idCardJSON.employee_id_proof_document_3 = request.id_proof_document_3;
                    }
                    
                    if(!idCardJSON.hasOwnProperty("employee_id_proof_verification_status_1")) {
                        idCardJSON.employee_id_proof_verification_status_1 = 0;
                    }

                    if(!idCardJSON.hasOwnProperty("employee_id_proof_verification_status_2")) {
                        idCardJSON.employee_id_proof_verification_status_2 = 0;
                    }

                    if(!idCardJSON.hasOwnProperty("employee_id_proof_verification_status_3")) {
                        idCardJSON.employee_id_proof_verification_status_3 = 0;
                    }
        
                // Update the ID Card's Activity List table
                try {
                    await activityListUpdateInlineData({
                        activity_id: idCardActivityID,
                        activity_inline_data: JSON.stringify(idCardJSON)
                    }, organizationID);
                } catch (error) {
                    logger.error(`idProofUpload.activityListUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
                }
        
                // Update the ID Card's Activity Asset Mapping table
                try {
                    await activityAssetMappingUpdateInlineData({
                        activity_id: idCardActivityID,
                        asset_id: employeeAssetID,
                        activity_inline_data: JSON.stringify(idCardJSON),
                        pipe_separated_string: '',
                        log_asset_id: request.asset_id
                    }, organizationID);
                } catch (error) {
                    logger.error(`idProofUpload.activityAssetMappingUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
                }         
            }
        }
            
    
    //2.Update in contact Card - If it exists
        if (deskAssetID !== 0) {
            // Fetch the desk's contact card
            // Fetch the Employee's ID card
            const [errFour, contactCardData] = await adminListingService.activityListSelectCategoryContact({
                                                    asset_id: deskAssetID
                                                }, organizationID);
            if (errFour || Number(contactCardData.length) === 0) {
                logger.error(`idProofUpload.activityListSelectCategoryContact contactCardData doesn't exist`, { type: 'admin_ops', request_body: request, error: errFour });
                //return [errFour, []]
            } else {
                const contactCardActivityID = Number(contactCardData[0].activity_id);
                let contactCardJSON = JSON.parse(contactCardData[0].activity_inline_data);                    
                    if(request.id_proof_document_1 !== "") {
                        contactCardJSON.employee_id_proof_document_1 = request.id_proof_document_1;
                    }

                    if(request.id_proof_document_2 !== "") {
                        contactCardJSON.employee_id_proof_document_2 = request.id_proof_document_2;
                    }
                    
                    if(request.id_proof_document_3 !== "") {
                        contactCardJSON.employee_id_proof_document_3 = request.id_proof_document_3;
                    }
                    
                    if(!contactCardJSON.hasOwnProperty("employee_id_proof_verification_status_1")) {
                        contactCardJSON.employee_id_proof_verification_status_1 = 0;
                    }

                    if(!contactCardJSON.hasOwnProperty("employee_id_proof_verification_status_2")) {
                        contactCardJSON.employee_id_proof_verification_status_2 = 0;
                    }

                    if(!contactCardJSON.hasOwnProperty("employee_id_proof_verification_status_3")) {
                        contactCardJSON.employee_id_proof_verification_status_3 = 0;
                    }
        
                // Update the Contact Card's Activity List table
                try {
                    await activityListUpdateInlineData({
                        activity_id: contactCardActivityID,
                        activity_inline_data: JSON.stringify(contactCardJSON)
                    }, organizationID);
                } catch (error) {
                    logger.error(`idProofUpload.activityListUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
                }
        
                // Update the Contact Card's Activity Asset Mapping table
                try {
                    await activityAssetMappingUpdateInlineData({
                        activity_id: contactCardActivityID,
                        asset_id: deskAssetID,
                        activity_inline_data: JSON.stringify(contactCardJSON),
                        pipe_separated_string: '',
                        log_asset_id: request.asset_id
                    }, organizationID);
                } catch (error) {
                    logger.error(`idProofUpload.activityAssetMappingUpdateInlineData_IDCard`, { type: 'admin_ops', request_body: request, error });
                }
            }
    }

    //3.Update in asset_list inline data
    //Fetch inlineData first and assign the value accordingly
    let [err, assetData] = await activityCommonService.getAssetDetailsAsync(request);
    //console.log('ASSETDATA : ', assetData);
    let assetInlineData;    
    if(assetData.length > 0){
        assetInlineData = JSON.parse(assetData[0].asset_inline_data);
        //console.log('assetInlineData : ', assetInlineData);
    }
    await updateAssetInlineData(request, {
        id_proof_document_1: (request.id_proof_document_1 !== "") ? request.id_proof_document_1 : assetInlineData.id_proof_document_1,
        id_proof_document_2: (request.id_proof_document_2 !== "") ? request.id_proof_document_2 : assetInlineData.id_proof_document_2,
        id_proof_document_3: (request.id_proof_document_3 !== "") ? request.id_proof_document_3 : assetInlineData.id_proof_document_3,
        id_proof_verification_status: 0
    });

    //4.Make an entry in asset timeline entry
        request.stream_type_id = 325;
        request.entity_text_1 = "ID Proof Document is uploaded";
        const [errTwo, assetTimelineData] = await assetTimelineTransactionInsert(request, workforceID, organizationID, accountID);
        if (errTwo) {
            console.log("idProofUpload | Asset Timeline Transaction Insert | Error: ", errTwo);
        }

    return [false, responseData];

    }


    async function updateAssetInlineData(request, assetInlineData) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.organization_id,
            JSON.stringify(assetInlineData),
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_1_asset_list_update_inline_data', paramsArr);

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

    
    this.organizationInlineDataUpdate = async function(request) {

        const [err, orgData] = await adminListingService.organizationListSelect(request);

        let org_config_data = orgData[0].organization_inline_data?orgData[0].organization_inline_data:{};
        org_config_data = JSON.parse(org_config_data);
        //console.log("org_config_data :: "+JSON.stringify(org_config_data));
        //console.log("request.org_bot_config_data :: "+request.org_bot_config_data);
        org_config_data.rm_bot_config = JSON.parse(request.org_bot_config_data);

        let paramsArr = new Array(
            request.organization_id,
            JSON.stringify(org_config_data),
            request.asset_id,
            util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('ds_p1_organization_list_update_inline_data', paramsArr);
        if (queryString != '') {
            return await (db.executeQueryPromise(0, queryString, request));
        }
    } 


    this.updateOrganizationAIBot = async function(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.organization_ai_bot,         
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_organization_list_update_ai_bot', paramsArr);

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

    this.processSignup = async function(request){
        let responseData = [],
            error = true;

        logger.info("country_code :: "+request.country_code);
        logger.info("phone_number :: "+request.asset_phone_number);
        logger.info("email :: "+request.asset_email_id);
        logger.info("fullname :: "+request.asset_full_name);
        logger.info("domain :: "+request.organziation_domain_name);

        let domainIndex = request.asset_email_id.indexOf('@');
        request.organization_name = request.asset_email_id.substring(domainIndex+1,request.asset_email_id.length);
        request.organization_phone_country_code = request.country_code;
        request.organization_phone_number = request.asset_phone_number;
        request.asset_id = 100;
        request.organization_domain_name = request.organization_name;
        request.organization_email = request.asset_email_id;

        let [orgErr, idOrganization] = await self.createOrganizationV1(request);

        request.organization_id = idOrganization;
        request.account_city = request.country_code+""+request.asset_phone_number;

        let [accErr, idAccount] = await self.createAccountV1(request);

        request.account_id = idAccount;
        request.workforce_name = "CommonFloor";
        request.workforce_type_id = 16;

        let [workforceErr, idWorkforce] = await self.createWorkforceV1(request);


        //create employee and desk(employee and contact card)

        return [workforceErr, idWorkforce];
    }


    this.createOrganizationV1 = async function (request) {

        let organizationID = 0;
        let [orgErr, responseOrgData] = await adminListingService.organizationListSelectName(request);
        if(!orgErr){
            if(responseOrgData.length > 0){
                return [false,responseOrgData[0].organization_id];
            }else{
                const [err, orgData] = await organizationListInsert(request);
                if(err){
                    return[true, err];
                }else{
                    if(orgData.length > 0){
                        request.organization_id = orgData[0].organization_id;
                        request.update_type_id = 0;
                        organizationListHistoryInsert(request);
                        return[false, orgData[0].organization_id];
                    }else{
                        return[true, 0];
                    }
                   
                }                
            }
        }else{
            return[true,orgErr];
        }      

        
    }

    // Get account bassed on country code
    this.createAccountV1 = async function (request) {
        let responseData = [],
            error = true;
        [error, responseData] = await adminListingService.accountListSelectCountryCode(request);
        if(!error){
            if(responseData.length > 0){

                return [false, responseData[0].account_id];

            }else{

                const [errOne, accountData] = await accountListInsert(request, request.organization_id);
                if (errOne) {

                    return [true, errOne];

                } else if (accountData.length > 0) {

                    request.account_id = accountData[0].account_id;
                    request.update_type_id = 0;
                    accountListHistoryInsert(request);
                    return [false, accountData[0].account_id];
                }else{
                    return [true, 0];
                }

            }
        }else{
            return [true, error];
        }
    } 

    this.createWorkforceV1 = async function (request) {
        let responseData = [],
            error = true;
        let assetTypes = {};
        let activityTypes = {};
        [error, responseData] = await adminListingService.workforceListSelectWorkforceType(request);
        if(!error){
            if(responseData.length > 0){
                
                request.workforce_id = responseData[0].workforce_id;

                request.asset_type_category_id = 2;
                const [errEmp, empAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory(request);
                assetTypes[2]= empAssetTypeData[0].asset_type_id?empAssetTypeData[0].asset_type_id:0;

                request.asset_type_category_id = 3;
                const [errDesk, deskAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory(request);                
                assetTypes[3]= deskAssetTypeData[0].asset_type_id?deskAssetTypeData[0].asset_type_id:0;

                request.activity_type_category_id = 4;
                const [errIdCard, idCardCData] = await adminListingService.workforceActivityTypeMappingSelectCategory(request);                
                activityTypes[4]= idCardCData[0].activity_type_id?idCardCData[0].activity_type_id:0;

                request.activity_type_category_id = 5;
                const [errContactCard, contactCardCData] = await adminListingService.workforceActivityTypeMappingSelectCategory(request);                
                activityTypes[5]= contactCardCData[0].activity_type_id?contactCardCData[0].activity_type_id:0;

                return [false, {organization_id:request.organization_id,
                                account_id: request.account_id,
                                workforce_id: responseData[0].workforce_id,
                                asset_types:assetTypes,
                                employee_activity_type_id:activityTypes[4],
                                desk_activity_type_id:activityTypes[5],
                                employee_asset_type_id:assetTypes[2],
                                desk_asset_type_id:assetTypes[3]}];
            }else{
                let [err3,workforceData] = await self.createWorkforceWithDefaults(request);
                return [err3,workforceData];
            }
        }else{
            return [true, error];
        }
    } 

    // Create a new workforce, department or a floor
    this.createWorkforceWithDefaults = async function (request) {

        let assetTypes = {"2":0,"3":0};
        let activityTypes = {"4":0,"5":0};

        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            // workforceID = Number(request.workforce_id),
            assetID = Number(request.asset_id),
            workforceName = String(request.workforce_name),
            workforceTypeID = (request.workforce_type_id) ? Number(request.workforce_type_id) : 1;

        // Create the workforce
        let [errOne, workforceData] = await workforceListInsert({
            workforce_name: workforceName,
            workforce_type_id: workforceTypeID
        }, organizationID, accountID);
        if (errOne) {
            return [true, {
                message: "Couldn't create the workforce."
            }]
        }

        const workforceID = Number(workforceData[0].workforce_id);

        // Workforce List History insert
        try {
            await workforceListHistoryInsert({
                workforce_id: workforceData[0].workforce_id,
                organization_id: organizationID
            });
        } catch (error) { }

        // Fetch workforce asset types
        const [errTwo, workforceAssetTypes] = await adminListingService.assetTypeCategoryMasterSelectV1({
            product_id: 1,
            start_from: 0,
            limit_value: 50
        });
        if (errTwo || workforceAssetTypes.length === 0) {
            return [true, {
                message: `[createWorkforce] Error fetching workforceAssetTypes`
            }]
        }

        // Create workforce asset types
        for (const assetType of workforceAssetTypes) {

            const [errThree, assetTypeData] = await workforceAssetTypeMappingInsert({
                asset_type_name: assetType.asset_type_category_name,
                asset_type_description: assetType.asset_type_category_description,
                asset_type_category_id: assetType.asset_type_category_id
            }, workforceID, organizationID, accountID);

            if (errThree || assetTypeData.length === 0) {
                console.log(`[createWorkforce] Error creating assetType ${assetType.asset_type_category_name} for workforce ${workforceID}`);
            }else{
                let category = assetType.asset_type_category_id;
                assetTypes[category] = assetTypeData[0].asset_type_id;
            }

            // Workforce asset types history insert
            if (assetTypeData.length > 0) {
                let assetTypeID = assetTypeData[0].asset_type_id;
                try {
                    await workforceAssetTypeMappingHistoryInsert({
                        update_type_id: 0
                    }, assetTypeID, organizationID);
                } catch (error) { }
                // 
            }
        }

        // Fetch workforce activity types
        const [errFour, workforceActivityTypes] = await adminListingService.activityTypeCategoryMasterSelectV1({
            product_id: 1,
            start_from: 0,
            limit_value: 50
        });
        if (errFour || workforceActivityTypes.length === 0) {
            return [true, {
                message: `[createWorkforce] Error fetching workforceActivityTypes`
            }]
        }

        // Create workforce activity types
        for (const activityType of workforceActivityTypes) {

            const [errFive, activityTypeData] = await workforceActivityTypeMappingInsert({
                activity_type_name: activityType.activity_type_category_name,
                activity_type_description: activityType.activity_type_category_description,
                activity_type_category_id: activityType.activity_type_category_id
            }, workforceID, organizationID, accountID);

            if (errFive || activityTypeData.length === 0) {
                console.log(`[createWorkforce] Error creating activityType ${activityType.asset_type_category_name} for workforce ${workforceID}`);
            }

            // Activity types history insert
            let activityTypeID = activityTypeData[0].activity_type_id;

            if(activityType.activity_type_category_id === 4){
                activityTypes[4]=activityTypeID;
            }else if(activityType.activity_type_category_id === 5){
                 activityTypes[5]=activityTypeID;
            }

            if (activityTypeData.length > 0) {
                try {
                    await workforceActivityTypeMappingHistoryInsert({
                        update_type_id: 0
                    }, activityTypeID, organizationID);
                } catch (error) { }
                // 
            }

            // Once the activity type for the workforce is created, the corresponding statuses
            // need to be created as well. First, fetch the statuses for the activity_type_category_id
            // Fetch workforce activity types
            const [errSix, activityStatusTypes] = await adminListingService.activityStatusTypeMasterSelectCategory({
                activity_type_category_id: activityType.activity_type_category_id,
                start_from: 0,
                limit_value: 50
            });
            if (errSix || activityStatusTypes.length === 0) {
                // Do nothing, just skip
                continue;
            }

            for (const activityStatusType of activityStatusTypes) {

                const [errSeven, activityStatusTypeData] = await workforceActivityStatusMappingInsert({
                    activity_status_name: activityStatusType.activity_status_type_name,
                    activity_status_description: activityStatusType.activity_status_type_description,
                    activity_status_sequence_id: 0,
                    activity_status_type_id: activityStatusType.activity_status_type_id,
                    log_asset_id: request.log_asset_id || request.asset_id
                }, activityTypeID, workforceID, organizationID, accountID);

                if (errSeven || activityStatusTypeData.length === 0) {
                    console.log(`[createWorkforce] Error creating activityStatusType ${activityStatusType.activity_status_type_name} for the activity ${activityType.activity_type_category_name} workforce ${workforceID}`);
                }

                if (activityStatusTypeData.length > 0) {
                    const activityStatusID = activityStatusTypeData[0].activity_status_id;
                    try {
                        await workforceActivityStatusMappingHistoryInsert({
                            update_type_id: 0
                        }, activityStatusID, organizationID);
                    } catch (error) {
                        console.log("Exception : "+error);
                     }
                    // 
                }
            }
        }

        return [false, {
            workforce_id: workforceID,
            account_id:request.account_id,
            organization_id:request.organization_id,
            asset_types: assetTypes,
            employee_activity_type_id:activityTypes[4],
            desk_activity_type_id:activityTypes[5],
            employee_asset_type_id:assetTypes[2],
            desk_asset_type_id:assetTypes[3]
        }] 

    }

    this.createAssetTypesV1 = async function (request) {
        let responseData = [],
            error = true;
        [error, responseData] = await adminListingService.workforceAssetTypeMappingSelectCategory(request);
        if(!error){
            if(responseData.length > 0){

                return [false, responseData[0].account_id];

            }else{

                const [errOne, assetTypeData] = await workforceAssetTypeMappingInsert(request, request.workforce_id, request.organization_id, request.account_id);
                if (errOne) {

                    return [true, errOne];

                } else if (assetTypeData.length > 0) {

                    request.asset_type_id = assetTypeData[0].asset_type_id;
                    request.update_type_id = 0;
                    workforceAssetTypeMappingHistoryInsert(request,assetTypeData[0].asset_type_id,request.organization_id);
                    return [false, assetTypeData[0].asset_type_id];
                }else{
                    return [true, 0];
                }

            }
        }else{
            return [true, error];
        }
    } 


}

module.exports = AdminOpsService;