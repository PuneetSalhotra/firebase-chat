const AdminListingService = require("../services/adminListingService");
const AssetService = require("../../services/assetService");
const logger = require('../../logger/winstonLogger');
const XLSX = require('xlsx');
const excelToJson = require('convert-excel-to-json');
const fs = require('fs');
const { serializeError } = require('serialize-error');

const RMBotService = require('../../botEngine/services/rmbotService');
let ActivityTimelineService = require('../../services/activityTimelineService.js');
let ActivityService = require('../../services/activityService.js');
let ActivityParticipantService = require('../../services/activityParticipantService.js');
let AnalyticsService = require('../../analytics/services/analyticsService');


const AWS_Cognito = require('aws-sdk');
AWS_Cognito.config.update({
    "accessKeyId": global.config.access_key_id,
    "secretAccessKey": global.config.secret_access_key,
    "region": global.config.cognito_region
});
const cognitoidentityserviceprovider = new AWS_Cognito.CognitoIdentityServiceProvider();

function AdminOpsService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const queueWrapper = objectCollection.queueWrapper;
    const activityCommonService = objectCollection.activityCommonService;
    const adminListingService = new AdminListingService(objectCollection);
    const assetService = new AssetService(objectCollection);
    const rmBotService = new RMBotService(objectCollection);
    const activityService = new ActivityService(objectCollection)
    const activityTimelineService = new ActivityTimelineService(objectCollection);
    const activityParticipantService = new ActivityParticipantService(objectCollection);
    const analyticsService = new AnalyticsService(objectCollection);
    const moment = require('moment');
    const makeRequest = require('request');
    const nodeUtil = require('util');
    const self = this;

    const cacheWrapper = objectCollection.cacheWrapper;

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
        let errTwo, orgData;

        if(!request.enterprise_feature_data) {
            [errTwo, orgData] = await organizationListInsert(request);
        } else {
            [errTwo, orgData] = await organizationListInsertV2(request);
        }
        
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

    this.updateOrganizationFlags = async function (request) {
        let responseData = [],
        error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.org_enterprise_feature_data,
            request.flag_email,
            request.flag_doc_repo,
            request.flag_ent_features,
            request.flag_ai_bot,
            request.flag_manager_proxy,
            request.flag_form_tag,
            request.flag_enable_sip_module,
            request.flag_enable_elasticsearch,
            request.flag_enable_calendar,
            request.flag_enable_grouping || 0,
            request.organization_flag_enable_timetracker || 0,
            request.organization_flag_timeline_access_mgmt || 0,
            request.flag_timeline_lead_mgmt || 0,
            request.flag_dashboard_onhold || 0,
            request.flag_enable_tag || 0,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_6_organization_list_update_flags', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
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
        const [errOne, assetData] = await assetListInsertV2(request, workforceID, organizationID, accountID);
        if (errOne || Number(assetData.length) === 0) {
            console.log("createAssetBundle | assetListInsertV2 | assetData: ", assetData);
            console.log("createAssetBundle | Error: ", errOne);
            return [true, {
                message: "Error at assetListInsertV2"
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
            if (Number(request.activity_type_category_id) === 5 || Number(request.activity_type_category_id) === 6) {
                // Co-Worker Contact Card
                activityInlineData.contact_asset_id = assetID;

            } else if (Number(request.activity_type_category_id) === 4 || Number(request.activity_type_category_id) === 6) {
                // ID Card
                // QR Code
                const qrCode = organizationID + "|" + accountID + "|0|" + assetID + "|" + request.desk_asset_first_name + "|" + request.asset_first_name;
                activityInlineData.employee_qr_code = qrCode;
                activityInlineData.employee_asset_id = assetID;
            }
            request.activity_inline_data = JSON.stringify(activityInlineData);

            if(Number(request.asset_type_category_id) != 13){
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
            }else{
                return [false, {
                    asset_id: assetID,
                    activity_id: 0
                }]
            }
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

    // Asset List Insert v2: With provision to add Aadhar and work location
    async function assetListInsertV2(request, workforceID, organizationID, accountID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_first_name || '',
            request.asset_last_name || '',
            request.asset_description || '',
            request.gender_id || 4,
            request.customer_unique_id || '',
            request.asset_image_path || '',
            request.activity_inline_data || '{}',
            request.country_code || 1,
            request.phone_number || 0,
            request.email_id || '',
            request.password || '',
            request.timezone_id || 22,
            request.asset_type_id||0,
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
            request.asset_flag_approval || 0,
            request.asset_master_data || "{}",
            request.asset_identification_number || "",
            request.asset_manual_work_location_address || ""
        );
        const queryString = util.getQueryString('ds_p1_4_asset_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    console.log("assetListInsertV2 : "+JSON.stringify(data,2,null));
                    request.created_asset_id = data[0].asset_id;
                   // roleAssetMappingInsert(request);
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
    async function createActivity(request, workforceID, organizationID, accountID,leadManager={}) {

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
            activity_form_id: request.activity_form_id||0,
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
            device_os_id: 5,
            ...leadManager
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

    // Create Activity Service
    async function createActivityV1(request, workforceID, organizationID, accountID,assetID,inline) {
        const activityID = await cacheWrapper.getActivityIdPromise();
        const formTransactionID = await cacheWrapper.getFormTransactionIdPromise();

        const addActivityRequest = {
            organization_id:organizationID,
            workforce_id:workforceID,
            account_id:accountID,
            activity_id: activityID,
            // activity_id: activityID,
            form_transaction_id: formTransactionID,
            form_id:request.form_id,
            activity_type_category_id: 60,
            activity_title:request.activity_title,
            asset_id:assetID,
            activity_type_id: request.activity_type_id,
            activity_type_name:"FOS Approval",
            auth_asset_id: 31993,
            asset_token_auth: "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95",
            asset_message_counter: 0,
            activity_inline_data: inline,
            // activity_timeline_collection: "",
            // is_child_order: true,
            // child_order_activity_parent_id: Number(options.parent_activity_id),
            activity_datetime_start: util.getCurrentUTCTime(),
            data_entity_inline:JSON.stringify(inline) ,
            activity_description:request.activity_title ,
            activity_form_id:request.form_id ,
            track_gps_datetime:util.getCurrentUTCTime() ,
            activity_datetime_end:util.getCurrentUTCTime(),
            activity_sub_type_id: 0,
            activity_status_type_category_id: 1,
            asset_participant_access_id: 0,
            activity_access_role_id: 21,
            activity_status_type_id: 22,
            activity_flag_file_enabled: 1,
            activity_parent_id: 0,
            asset_message_counter: 0,
            flag_pin: 0,
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(31993),
            track_latitude: "0.0",
            track_longitude: "0.0",
            track_altitude: 0,
            track_gps_accuracy: "0",
            activity_channel_id: 0,
            activity_channel_category_id: 0,
            activity_flag_response_required: 0,
            track_gps_status: 0,
            service_version: "3.0",
            app_version: "3.0.0",
            activity_timeline_collection :JSON.stringify({
                "mail_body": `Approval Form - ${moment().utcOffset('+05:30').format('LLLL')}`,
                "subject": `Approval Form`,
                "content": `Approval Form`,
                "form_submitted": inline,
                "attachments": []
            }),
            // api_version: 1,
            device_os_id: 5,
            activity_stream_type_id: 705,
            flag_timeline_entry: 1,
            is_mytony: 1,
            url: "/r1/activity/add/v1",
        };
        console.log(JSON.stringify(addActivityRequest))
        const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
        await addActivityAsync(addActivityRequest);
        // const childActivityID = await cacheWrapper.getActivityIdPromise();
        //          const createChildWorkflowRequest = Object.assign({}, addActivityRequest);
        //         createChildWorkflowRequest.activity_id = childActivityID;
        //         createChildWorkflowRequest.activity_type_category_id = 60;
        //         createChildWorkflowRequest.activity_stream_type_id = 701;
        //         createChildWorkflowRequest.activity_type_id = request.activity_type_id;
        //         createChildWorkflowRequest.activity_parent_id = activityID;
        //         createChildWorkflowRequest.activity_datetime_start= util.getCurrentUTCTime();
        //         createChildWorkflowRequest.track_gps_datetime=util.getCurrentUTCTime();
        //         createChildWorkflowRequest.activity_datetime_end=util.getCurrentUTCTime();
                // const addActivityAsync = nodeUtil.promisify(activityService.addActivity);
            // await addActivityAsync(createChildWorkflowRequest);
                //        let activityTimelineCollection =  JSON.stringify({                            
                //     "content": `Fos approval form is submitted at ${moment().utcOffset('+05:30').format('LLLL')}.`,
                //     "subject": `Note - ${util.getCurrentDate()}.`,
                //     "mail_body": `Fos approval form is submitted at ${moment().utcOffset('+05:30').format('LLLL')}.`,
                //     "activity_reference": [],
                //     "asset_reference": [],
                //     "attachments": [],
                //     "form_approval_field_reference": []
                // });
            const childWorkflow705Request = Object.assign({}, addActivityRequest);
            childWorkflow705Request.activity_id = activityID;
            childWorkflow705Request.data_activity_id = activityID;
            childWorkflow705Request.activity_type_category_id = 60;
            childWorkflow705Request.message_unique_id = util.getMessageUniqueId(31993);
            childWorkflow705Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
            childWorkflow705Request.device_os_id = 5;
            childWorkflow705Request.auth_asset_id = 100;
            childWorkflow705Request.asset_token_auth = "54188fa0-f904-11e6-b140-abfd0c7973d9";
            childWorkflow705Request.track_gps_datetime = util.getCurrentUTCTime();
            childWorkflow705Request.activity_datetime_end=util.getCurrentUTCTime();
            // childWorkflow705Request.activity_timeline_collection = activityTimelineCollection;
            console.log("timeline entry",childWorkflow705Request)
            // const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
            // await addTimelineTransactionAsync(childWorkflow705Request);
            
             activityTimelineService.addTimelineTransactionAsync(childWorkflow705Request);
            
            // request.activity_type_category_id=60;
            // request.organization_id=organizationID;
            // request.account_id=accountID;
            // request.workforce_id=workforceID;
            // await addParticipantasLead(request,activityID,39264,39264);
            // console.log(activityID,childActivityID);
            let reqDataForRemovingCreaterAsOwner = { 
                activity_id : activityID,
                target_asset_id : assetID,
                organization_id : organizationID,
                owner_flag : 0,
                asset_id:assetID
            };
           await removeAsOwner(request,reqDataForRemovingCreaterAsOwner)
          //add 325 timeline
          let details =`${request.asset_type_name} :\n
          Name : ${request.asset_first_name}
          Designation : ${request.desk_asset_first_name?request.desk_asset_first_name:""}
          Phone: ${request.phone_number}
          Email: ${request.email_id}
          CUID: ${request.customer_unique_id}
          Aadhar: ${request.asset_identification_number?request.asset_identification_number:""}
          Workforce Name: ${request.workforce_name}
          Account Name: ${request.account_name?request.account_name:""}`;
         let activityTimelineCollection =  JSON.stringify({                            
                    "content": details,
                    "subject": details,
                    "mail_body": details,
                    "activity_reference": [],
                    "asset_reference": [],
                    "attachments": [],
                    "form_approval_field_reference": []
                });
          const childWorkflow325Request = Object.assign({}, addActivityRequest);
          childWorkflow325Request.activity_id = activityID;
          childWorkflow325Request.data_activity_id = activityID;
          childWorkflow325Request.activity_type_category_id = 60;
          childWorkflow325Request.activity_stream_type_id = 325;
          childWorkflow325Request.data_entity_inline=activityTimelineCollection;
          childWorkflow325Request.activity_timeline_collection=activityTimelineCollection;
          childWorkflow325Request.activity_timeline_text=details;
          childWorkflow325Request.message_unique_id = util.getMessageUniqueId(31993);
          childWorkflow325Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
          childWorkflow325Request.device_os_id = 5;
          childWorkflow325Request.auth_asset_id = 100;
          childWorkflow325Request.asset_token_auth = "54188fa0-f904-11e6-b140-abfd0c7973d9";
          activityTimelineService.addTimelineTransactionAsync(childWorkflow325Request);
          await sleep(3500);
        // try {
        //     // global.config.mobileBaseUrl + global.config.version
        //     // const response = await addActivityAsync(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', makeRequestOptions);
        //     const body = JSON.parse(response.body);
        //     if (Number(body.status) === 200) {
        //         console.log("createActivityV1parent | addActivityAsync | Body: ", body);
        //         // const childActivityID = await cacheWrapper.getActivityIdPromise();
        //         const createChildWorkflowRequest = Object.assign({}, addActivityRequest);
        //         // createChildWorkflowRequest.activity_id = childActivityID;
        //         createChildWorkflowRequest.activity_type_category_id = 60;
        //         createChildWorkflowRequest.activity_type_id = request.activity_type_id;
        //         createChildWorkflowRequest.activity_parent_id = body.response.activity_id;
    
        //         // const addActivityAsyncChild = nodeUtil.promisify(makeRequest.post);
        //        const makeRequestOptionsChild = {
        //           form: createChildWorkflowRequest
        //           };
        //         //   console.log(createChildWorkflowRequest)
        //           const responseChild = await addActivityAsync(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', makeRequestOptionsChild);
        //           console.log("createActivityV1child | addActivityAsync | Body: ", JSON.parse(responseChild.body));
        //           let body1 = JSON.parse(responseChild.body);
        //         //   updateWorkflowSubType({organization_id: organizationID,
        //         //     account_id: accountID,
        //         //     workforce_id: workforceID,
        //         //     asset_id: assetID},body1.response.activity_id)
        //           let activityTimelineCollection =  JSON.stringify({                            
        //             "content": `Tony assigned shankar as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
        //             "subject": `Note - ${util.getCurrentDate()}.`,
        //             "mail_body": `Tony assigned shankar as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
        //             "activity_reference": [],
        //             "asset_reference": [],
        //             "attachments": [],
        //             "form_approval_field_reference": []
        //         });
        //           const childWorkflow705Request = Object.assign({}, addActivityRequest);
        //     childWorkflow705Request.activity_id = body1.response.activity_id;
        //     childWorkflow705Request.data_activity_id = body.response.activity_id;
        //     childWorkflow705Request.activity_type_category_id = 60;
        //     childWorkflow705Request.message_unique_id = util.getMessageUniqueId(31993);
        //     childWorkflow705Request.track_gps_datetime = moment().utc().format('YYYY-MM-DD HH:mm:ss');
        //     childWorkflow705Request.device_os_id = 5;
        //     childWorkflow705Request.auth_asset_id = assetID;
        //     childWorkflow705Request.asset_token_auth = "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95";
        //     childWorkflow705Request.track_gps_datetime = util.getCurrentUTCTime();
        //     childWorkflow705Request.activity_stream_type_id = 705;
        //     childWorkflow705Request.timeline_stream_type_id = 705;
        //     childWorkflow705Request.activity_timeline_collection = activityTimelineCollection;
        //    console.log(childWorkflow705Request)
        //     // const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
        //     // await addTimelineTransactionAsync(childWorkflow705Request);

        //     // await activityTimelineService.addTimelineTransactionAsync(childWorkflow705Request);
        //     await sleep(3000);
        //         return [false, body1];
        //     }
        // } catch (error) {
        //     console.log("createActivity | addActivityAsync | Error: ", error);
        //     return [true, {}];
        // }
        return [false,activityID]
    }

    async function removeAsOwner(request,data)  {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            data.activity_id,
            data.target_asset_id,
            data.organization_id,
            data.owner_flag || 0,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_owner_flag',paramsArr);
        if(queryString !== '') {
            try {
                const data = await db.executeQueryPromise(0,queryString,request);
                // await callAddTimelineEntry(request);
                responseData = data;
                error = false;
            } catch(e) {
                error = e;
            }
        }
        return [error,responseData];
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

    async function organizationListInsertV1(request) {
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
            request.enterprise_feature_data || '{}',
            request.flag_email || 0,
            request.flag_doc_repo || 0,
            request.flag_ent_features || 0,
            request.flag_ai_bot || 0,
            request.flag_manager_proxy || 0,
            request.organization_flag_enable_form_tag || 0,
            request.organization_type_id || 1,
            request.log_asset_id || 1,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_2_organization_list_insert', paramsArr);

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

    async function organizationListInsertV2(request) {
        let responseData = [],
            error = true;
            
        const paramsArr = new Array(
          request.organization_name,
          request.organization_domain_name,
          request.organization_image_path || "",
          request.organization_address || "",
          request.organization_phone_country_code || 0,
          request.organization_phone_number || 0,
          request.organization_email || "",
          request.contact_person || "Admin",
          request.contact_phone_country_code || 0,
          request.contact_phone_number || 0,
          request.contact_email || "",
          request.org_enterprise_feature_data || '{}',
          request.flag_email || 0,
          request.flag_doc_repo || 0,
          request.flag_ent_features || 0,
          request.flag_ai_bot || 0,
          request.flag_manager_proxy || 0,
          request.flag_enable_form_tag || 0,
          request.flag_enable_sip_module || 0,
          request.flag_enable_elasticsearch || 0,
          request.org_exchange_server_url || "",
          request.org_exchange_server_domain || "",
          request.flag_enable_calendar || "",
          request.flag_enable_grouping || 0,
          request.organization_flag_enable_timetracker || 0,
          request.organization_flag_timeline_access_mgmt || 0,
          request.flag_lead_mgmt || 0,
          request.flag_dashboard_onhold || 0,
            request.flag_enable_tag || 0,
          request.organization_type_id || 1,
          request.asset_id || 1,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_9_organization_list_insert', paramsArr);

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

        let assetTypeCategoryID = request.asset_type_category_id;
        if(request.asset_type_category_id == 3)
            request.activity_type_category_id = 5;
        else if(request.asset_type_category_id == 45)
            request.activity_type_category_id = 6;

        // request.asset_identification_number = "";
        //Get the asset_type_name i.e. Role Name        
        let [err, roleData] = await adminListingService.listRolesByAccessLevels(request);
        if (!err && roleData.length > 0) {
            request.asset_type_name = roleData[0].asset_type_name;
            console.log('ROLE NAME for ', request.asset_type_id, 'is : ', request.asset_type_name);
        }

//check if an Employee with the given Aadhar number exists
const [errZero_7, checkAadhar] = await assetListSelectAadharUniqueID({
    organization_id:request.organization_id,
    asset_identification_number: String(request.asset_identification_number),
}, request.organization_id);
console.log(checkAadhar)
if (errZero_7 || Number(checkAadhar.length) > 0) {
    console.log("addNewEmployeeToExistingDesk | assetListSelectAadharUniqueID | Error: ", errZero_7);
    return [true, {
        message: `An employee with the Aadhar ${request.asset_identification_number} already exists.`
    }]
}

        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        // Append some essential data
        request.stream_type_id = request.stream_type_id || 11018;
        request.log_asset_id = request.log_asset_id || request.asset_id;
        request.activity_type_category_id = request.activity_type_category_id || 5; // Co-Worker Contact Card
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
            contact_manager_asset_first_name: request.manager_asset_first_name || '',
            contact_identification_number: request.asset_identification_number || '',
            contact_manual_work_location_address: request.asset_manual_work_location_address || ''
        });

        // Create the asset
        let cloneRequest = {}; 
        Object.assign(cloneRequest, request);
        cloneRequest.customer_unique_id = null;
        const [errOne, assetData] = await createAssetBundle(cloneRequest, workforceID, organizationID, accountID);
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
            asset_type_category_id: assetTypeCategoryID
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

        if(request.asset_type_category_id == 2)
            request.activity_type_category_id = 4;
        else if(request.asset_type_category_id == 13)
            request.activity_type_category_id = 6;

        //Get the asset_type_name i.e. Role Name        
        let [err, roleData] = await adminListingService.listRolesByAccessLevels(request);
        if (!err && roleData.length > 0) {
            request.asset_type_name = roleData[0].asset_type_name;
            console.log('ROLE NAME for ', request.asset_type_id, 'is : ', request.asset_type_name);
        }

        //get the role details of desk
        let [err22, roleDataDesk] = await adminListingService.listRolesByAccessLevels({...request,asset_type_id:request.desk_asset_type_id});
        if (!err22 && roleDataDesk.length > 0) {
            // request.asset_type_name = roleData[0].asset_type_name;
            console.log('ROLE NAME for desk', roleDataDesk[0].asset_type_id, 'is : ', roleDataDesk[0].asset_type_name);
        }
        // console.log(roleDataDesk);

        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        // Append some essential data
        request.stream_type_id = request.stream_type_id || 11006;
        request.log_asset_id = request.log_asset_id || request.asset_id;
        request.activity_type_category_id = request.activity_type_category_id || 4; // ID Card
        request.activity_title = request.asset_first_name;
        request.activity_description = request.asset_first_name;
        request.activity_access_role_id = 8;
        request.activity_parent_id = 0;

        // Check if an Employee with the given phone nunmber exists
        const [errZero_1, checkPhoneNumberData] = await assetListSelectCategoryPhoneNumber({
            phone_number: Number(request.phone_number) || 0,
            country_code: Number(request.country_code) || 0,
            asset_type_category_id: request.asset_type_category_id || 2,
        }, organizationID);
        if (errZero_1 || Number(checkPhoneNumberData.length) > 0) {
            console.log("addNewEmployeeToExistingDesk | assetListSelectCategoryPhoneNumber | Error: ", errZero_1);
            return [true, {
                message: `An employee with the country code ${Number(request.country_code)} and phone number ${Number(request.phone_number)} already exists.`
            }]
        }

        // Check if an Employee with the given email exists
        const [errZero_13, checkEmailData] = await assetListSelectCategoryEmail({
            operating_asset_email: request.email_id
        }, organizationID);
        if (errZero_13 || Number(checkEmailData.length) > 0) {
            console.log("addNewEmployeeToExistingDesk | assetListSelectCategoryEmail | Error: ", errZero_13);
            return [true, {
                message: `An employee with this ${request.email_id} email already exists.`
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
                message: `An employee with the CUID ${request.customer_unique_id} already exists.`
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
            employee_manager_asset_first_name: request.manager_asset_first_name || '',
            employee_identification_number: request.asset_identification_number || '',
            employee_manual_work_location_address: request.asset_manual_work_location_address || ''
        });

        //Create the asset
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
        const [errTwo, deskAssetDataFromDB] = await adminListingService.assetListSelect({
            organization_id: organizationID,
            asset_id: deskAssetID
        });
        request.operating_asset_id = assetData.asset_id;
        request.desk_asset_first_name = deskAssetDataFromDB[0].asset_first_name;
        const [errApproval,approvalWorkflowData]=await addApprovalWorkflow(request,workforceID,organizationID,accountID,roleDataDesk,request.desk_asset_id)

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

        //Add the number to Cognito
        console.log("request.activity_type_category_id :: "+request.activity_type_category_id+' :: ' + request.country_code +':: '+request.phone_number)
        if(request.activity_type_category_id == 6){
            await addUser('+' + request.country_code +''+request.phone_number, global.config.customer_pool_id);
        }else{
            await addUser('+' + request.country_code +''+request.phone_number, global.config.user_pool_id);
            await addUser('+' + request.country_code +''+request.phone_number, global.config.user_web_pool_id);
            if(request.email_id) {
                await addUser(request.email_id, global.config.user_web_pool_id);
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

            const smsMessage = `Dear ${request.asset_first_name || ''} ${request.asset_last_name || ''}, you have been added as an '${deskAssetDataFromDB[0].asset_first_name}' by '${request.organization_name || ''}' to join their '${request.workforce_name || ''}' workforce. Please click on the link below to download the Grene Go App and get started.
        
            https://download.greneos.com`;

            /*util.sendSmsSinfiniV1(smsMessage, request.country_code || 91, request.phone_number || 0, senderID, function (err, response) {
                console.log('[addNewEmployeeToExistingDesk] Sinfini Response: ', response);
                console.log('[addNewEmployeeToExistingDesk] Sinfini Error: ', err);
            });*/
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
        await this.updateAssetsManagerDetails(newReq);

        const mode = global.mode;
        if (request.organization_id === 868 && (mode === "preprod" || mode === "prod")) {

            try {
                await triggerESMSIntegrationsService({
                    asset_id: deskAssetID
                }, {
                    mode: mode,
                    request_type: "CLMS_USER_SERVICE_ADD"
                });
            } catch (e) {
                console.log(e);
            }

        }

        return [false, {
            desk_asset_id: deskAssetID,
            coworker_contact_card_activity_id: coWorkerContactCardActivityID,
            operating_asset_id: operatingAssetID,
            id_card_activity_id: idCardActivityID
        }];

    }

    //Add Activity for approval workflow
    async function addApprovalWorkflow(request,workforceID,organizationID,accountID,roleData,assetID){
       let responseData = [];
       let error =false;
       request.asset_id = request.log_asset_id;
        //Check role has flag to add approval workflow
        if(roleData.length>0&&roleData[0].hasOwnProperty("asset_type_flag_enable_approval")&&roleData[0].asset_type_flag_enable_approval==1){
            console.log('role data321',JSON.stringify(roleData))
            request.activity_type_id = roleData[0].asset_type_approval_activity_type_id;
            request.activity_type_name = roleData[0].asset_type_approval_activity_type_name;
            request.form_id = roleData[0].asset_type_approval_origin_form_id;
            let activity_inline_data = [
                {
                    
                        "form_id": roleData[0].asset_type_approval_origin_form_id,
                        "field_id": roleData[0].asset_type_approval_field_id,
                        "field_name": "Asset Info",
                        "field_data_type_id": 59,
                        "field_data_type_category_id": 4,
                        "data_type_combo_id": 0,
                        "data_type_combo_value": 0,
                        "field_value": `${assetID} | ${request.asset_first_name} | ${request.operating_asset_id} | ${request.asset_type_name}`,
                        "message_unique_id": 1608213215926
                      
                }
                
            ];
            let activityInlineData = JSON.stringify(activity_inline_data)
            let [errAsset, creatorAssetData] = await activityCommonService.getAssetDetailsAsync({asset_id:request.log_asset_id,organization_id:organizationID});
            let managerAssetId = creatorAssetData[0].manager_asset_id;
            //add approval workflow activity
            let [errActivity,newActivityData] = await createActivityV1(request,workforceID,organizationID,accountID,request.log_asset_id,activityInlineData);
            let newActivity_id = newActivityData;
            //make manager as lead
            await addParticipantasLead(request,newActivity_id,managerAssetId,managerAssetId)
            
            //adding activity data for asset
            let paramsArrLead = new Array(
                organizationID,
                accountID,
                workforceID,
                assetID,
                0,
                util.getCurrentUTCTime(),
                newActivity_id
            );
    
            let queryStringLead = util.getQueryString('ds_p1_asset_list_update_flag_asset_approval',paramsArrLead);
            if(queryStringLead !== '') {
                try {
                    const data = await db.executeQueryPromise(0,queryStringLead,request);
                    // await callAddTimelineEntry(request);
                    
                } catch(e) {
                    console.log(e)
                }
            }
            //make user who is adding asset as creator
    
            }
            else{
                let paramsArr = new Array(
                    organizationID,
                    accountID,
                    workforceID,
                    assetID,
                    -1,
                    util.getCurrentUTCTime(),
                    0
                );
        
                let queryString = util.getQueryString('ds_p1_asset_list_update_flag_asset_approval',paramsArr);
                if(queryString !== '') {
                    try {
                        const data = await db.executeQueryPromise(0,queryString,request);
                        // await callAddTimelineEntry(request);
                        responseData = data;
                        error = false;
                    } catch(e) {
                        error = e;
                    }
                }
            }
            return[error,responseData]
    }

    async function addParticipantasLead(request,workflowActivityID,mangerAssetID,mangerAssetID){
        try {
            const [error, assetData] = await activityCommonService.getAssetDetailsAsync({
                organization_id: request.organization_id,
                asset_id: mangerAssetID
            });
            
            const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);
        let message = `${defaultAssetName} added ${assetData[0].operating_asset_first_name} to this Conversation`
            //adding participant
              let newParticipantParams = {
                "organization_id":request.organization_id,
                "account_id":request.account_id,
                "workforce_id":request.workforce_id,
                "asset_id":request.asset_id,
                "activity_id":workflowActivityID,
                "activity_participant_collection":JSON.stringify(assetData),
                "activity_type_category_id":request.activity_type_category_id,
                "activity_type_id":request.activity_type_id,
                "flag_pin":0,
                "flag_offline":0,
                "flag_retry":0,
                "message_unique_id":util.getMessageUniqueId(31993),
                "track_latitude":"0.0",
                "track_longitude":"0.0",
                "track_gps_datetime":util.getCurrentUTCTime(),
                "track_altitude":0,
                "datetime_log":util.getCurrentUTCTime(),
                "track_gps_accuracy":"0",
                "track_gps_status":0,
                "activity_timeline_collection":`{\"content\":${message},\"subject\":${message},\"mail_body\":${message},\"attachments\":[],\"participant_added\":${message},\"activity_reference\":[{\"activity_title\":\"\",\"activity_id\":\"\"}],\"asset_reference\":[{}],\"form_approval_field_reference\":[]}`
              }
             let addParticipantError =  await new Promise((resolve)=>{ activityParticipantService.assignCoworker(newParticipantParams,function (err,data){
                resolve(err)
             });
            })
        console.log(request)
        request.workflow_activity_id = workflowActivityID;
        request.activity_id = workflowActivityID;
        let newReq = {};
        newReq.organization_id = request.organization_id;
        newReq.account_id = request.account_id;
        newReq.workforce_id = request.workforce_id;
        newReq.asset_id = 100;
        newReq.activity_id = workflowActivityID;
        newReq.lead_asset_id = mangerAssetID;
        newReq.timeline_stream_type_id = 718;
        newReq.datetime_log = util.getCurrentUTCTime();
    
        await rmBotService.activityListLeadUpdateV2(newReq, mangerAssetID);
    
        let leadAssetFirstName = '';
        
    
            console.log('********************************');
            console.log('LEAD ASSET DATA - ', assetData[0]);
            console.log('********************************');
            // request.debug_info.push('LEAD ASSET DATA - '+ assetData[0]);
            leadAssetFirstName = assetData[0].operating_asset_first_name;
        
            const [log_error, log_assetData] = await activityCommonService.getAssetDetailsAsync({
                organization_id: request.organization_id,
                asset_id: request.log_asset_id
            });
            let logAssetFirstName = log_assetData[0].operating_asset_first_name;
        //Add a timeline entry
        let activityTimelineCollection =  JSON.stringify({                            
            "content": `${logAssetFirstName} assigned ${leadAssetFirstName} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
            "subject": `Note - ${util.getCurrentDate()}.`,
            "mail_body": `${logAssetFirstName} assigned ${leadAssetFirstName} as lead at ${moment().utcOffset('+05:30').format('LLLL')}.`,
            "activity_reference": [],
            "asset_reference": [],
            "attachments": [],
            "form_approval_field_reference": []
        });
        request.asset_id = request.asset_id;
        delete request.activity_type_category_id;
        let timelineReq = Object.assign({}, request);
            timelineReq.activity_type_id = request.activity_type_id;
            timelineReq.message_unique_id = util.getMessageUniqueId(100);
            timelineReq.track_gps_datetime = util.getCurrentUTCTime();
            timelineReq.activity_stream_type_id = 711;
            timelineReq.timeline_stream_type_id = 711;
            timelineReq.activity_timeline_collection = activityTimelineCollection;
            timelineReq.data_entity_inline = timelineReq.activity_timeline_collection;
        // console.log(JSON.stringify(timelineReq))
        await activityTimelineService.addTimelineTransactionAsync(timelineReq);
    } catch (error) {
        console.log(error);
    }
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

        let queryString = util.getQueryString('ds_p1_workforce_list_select', paramsArr);
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

    async function assetListSelectCategoryEmail(request, organizationID) {
        // IN p_organization_id bigint(20), IN p_phone_number VARCHAR(20), 
        // IN p_country_code SMALLINT(6), IN p_asset_type_category_id TINYINT(4)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            request.operating_asset_email,
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_email_all', paramsArr);

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

     // Fetch all assets with the given customer Aadhar ID
     async function assetListSelectAadharUniqueID(request, organizationID) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_customer_unique_id VARCHAR(50)
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            request.asset_identification_number,
            2
        );
        const queryString = util.getQueryString('ds_p1_asset_list_select_identification_number', paramsArr);

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
        
        //archive asset data
        try{
        const [erArchive,archiveDa]=await archiveAsset(request,3801);
        }
        catch(e){
            console.log(e)
        }

        // Reset operating asset details on the desk asset
        const [errTwo, _] = await assetListUpdateDesk({
            asset_id: deskAssetID,
            asset_first_name: deskAssetDataFromDB[0].asset_first_name,
            asset_last_name: deskAssetDataFromDB[0].asset_last_name,
            asset_type_id: deskAssetDataFromDB[0].asset_type_id,
            operating_asset_id: 0, // operatingAssetID
            manager_asset_id: deskAssetDataFromDB[0].manager_asset_id,
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

        //Remove User from Cognito
        await removeUser('+' + request.country_code +''+request.phone_number, global.config.user_pool_id);
        await removeUser('+' + request.country_code +''+request.phone_number, global.config.user_web_pool_id);

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

        const mode = global.mode;
        if (request.organization_id === 868 && (mode === "preprod" || mode === "prod")) {

            try {
                await triggerESMSIntegrationsService({
                    asset_id: deskAssetID
                }, {
                    mode: mode,
                    request_type: "CLMS_USER_SERVICE_DELETE"
                });

            } catch (e) {
                console.log(e);
            }

        }
        
        return [false, {
            operating_asset_id: operatingAssetID,
            id_card_activity_id: idCardActivityID,
            desk_asset_id: deskAssetID,
            coworker_contact_card_activity_id: coWorkerContactCardActivityID
        }];
    }

    async function archiveAsset (request,type){
        let paramsArr = new Array(
            request.desk_asset_id,
            request.organization_id,
            type,
            util.getCurrentUTCTime(),
            request.asset_id,
            util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('ds_v1_asset_archived_list_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    return[false, assetData];
                } else {
                    return[true, err];
                }
            });
        }
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

                    if(data.length > 0)
                    util.logInfo(request, "4.Timeline Transaction Id : "+data[0].id);
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

        //
        archiveAsset({...request,
            asset_id: deskAssetID
        },3803);

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
            if (Number(workforceAssetCountData[0].count) === 1000) {
                return [true, {
                    message: "The target workforce has maximum number of desks"
                }];
            }
        }
        let newWorkforceDeskAssetTypeID;
        if(request.hasOwnProperty('asset_type_id')){
            newWorkforceDeskAssetTypeID = request.asset_type_id;
        }
        else{
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
        newWorkforceDeskAssetTypeID = newWorkforceAssetTypeData[0].asset_type_id
       }
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

        try{
            const [erArchive,archiveDa]=await archiveAsset({...request,desk_asset_id:deskAssetID},3802);
            }
            catch(e){
                console.log(e)
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

                    if(responseData[0].push_status == 0 && responseData[0].asset_type_category_id == 3){

                        let newObject = Object.assign({},request);
                        newObject.target_workforce_id = workforceID;
                        newObject.push_title = "Resource Joined";
                        newObject.organization_id = organizationID;
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

                    if(!request.restrict_desk_creation){
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
                        if(!request.restrict_desk_creation){
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
                                    
                                    await assetService.updateFlagProcess({
                                        organization_id : request.organization_id,
                                        account_id: accountID,
                                        workforce_id: newUserDefinedWorkforceResponse.workforce_id,
                                        asset_id: deskAssetID,
                                        asset_flag_process_mgmt : 1
                                    })

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
            request.flag_ent_features || 1,
            1, // log_asset_id
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_2_account_list_insert', paramsArr);

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
    
    //adding aadhar and location updates
    async function assetListUpdateDetailsV1(request, employeeAssetID = 0, logAssetID = 0) {
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
            request.email_id,
            request.asset_identification_number,
            request.asset_manual_work_location_address
        );
        const queryString = util.getQueryString('ds_p1_6_asset_list_update_details', paramsArr);

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
        // console.log(deskAssetID,employeeAssetID)
        if(request.asset_identification_number){
            const [errZero_7, checkAadhar] = await assetListSelectAadharUniqueID({
                organization_id:request.organization_id,
                asset_identification_number: String(request.asset_identification_number),
            }, request.organization_id);
            console.log(checkAadhar);
            if ((errZero_7 || (Number(checkAadhar.length)) > 0 && (checkAadhar[0].asset_id!=deskAssetID&&checkAadhar[0].asset_id!=employeeAssetID))) {
                console.log("update employee | assetListSelectAadharUniqueID | Error: ", errZero_7);
                return [true, {
                    message: `An employee with the Aadhar ${request.asset_identification_number} already exists.`
                }]
            }
        }

        try {
            await workforceAssetTypeMappingHistoryInsert({
                update_type_id: 3
            }, request.asset_type_id, organizationID);
        } catch (error) { }
        //checking phone number or email changes to update in aws
        let [errassetData, assetDataOld] = await activityCommonService.getAssetDetailsAsync({...request,asset_id:request.employee_asset_id});
        if(request.email_id != assetDataOld[0].asset_email_id){
           await this.addUsersToCognitoManual({is_email_remove:1,email:assetDataOld[0].asset_email_id})// remove old email from web pool
           await this.addUsersToCognitoManual({is_email_add:1,email:request.email_id})// add new email from web pool
        }
        if(request.phone_number != assetDataOld[0].asset_phone_number){
            await this.addUsersToCognitoManual({is_mobile_remove:1,country_code:assetDataOld[0].asset_phone_country_code,phone_number:assetDataOld[0].asset_phone_number})// remove old phone from user pool
            await this.addUsersToCognitoManual({is_web_remove:1,country_code:assetDataOld[0].asset_phone_country_code,phone_number:assetDataOld[0].asset_phone_number})// remove old phone from web pool
            await this.addUsersToCognitoManual({...request,is_mobile_add:1})// add new email from user pool
            await this.addUsersToCognitoManual({...request,is_web_add:1})// add new email from web pool
        }

        if (employeeAssetID != 0) {
            // Update the Employee's details in the asset_list table
            const [errOne, employeeAssetData] = await assetListUpdateDetailsV1(request, employeeAssetID, Number(request.asset_id));
            if (errOne) {
                logger.error(`upateDeskAndEmployeeAsset.assetListUpdateDetailsV1_EMPLOYEE`, { type: 'admin_ops', request_body: request, error: errOne });
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
            idCardJSON.employee_asset_type_id = request.asset_type_id;
            idCardJSON.employee_asset_type_name = request.asset_type_name;
            idCardJSON.employee_manual_work_location_address = request.work_location_address;
            idCardJSON.employee_location = request.work_location_address;

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

            try {
                let newReq = {
                    activity_id: idCardActivityID,
                    activity_inline_data: JSON.stringify(idCardJSON),
                    asset_id: employeeAssetID,
                    operating_asset_id: 0
                };
                await activityAssetMappingUpdateOperationAssetData(newReq, organizationID);
                await activityListUpdateOperatingAssetData(newReq, organizationID);
            } catch (error) {
                logger.error(`upateDeskAndEmployeeAsset.activityAssetMappingUpdateOperationAssetData`, { type: 'admin_ops', request_body: request, error });
                logger.error(`upateDeskAndEmployeeAsset.activityListUpdateOperatingAssetData`, { type: 'admin_ops', request_body: request, error });
            }
        }

        if (deskAssetID !== 0) {
            // Update the Employee's details in the asset_list table
            const [errThree, employeeAssetData] = await assetListUpdateDetailsV4({

                ...request,
                description: request.desk_title,
                asset_first_name: request.desk_title,
                asset_last_name: "",
                operating_asset_first_name: request.asset_first_name,
                operating_asset_last_name: request.asset_last_name

            }, deskAssetID, Number(request.asset_id));
            if (errThree) {
                logger.error(`upateDeskAndEmployeeAsset.assetListUpdateDetailsV4_DESK`, { type: 'admin_ops', request_body: request, error: errThree });
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
            contactCardJSON.contact_manual_work_location_address = request.work_location_address;
            contactCardJSON.contact_location = request.work_location_address;
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

            // Update location for the desk asset
            try {
                await activityCommonService.updateAssetWorkLocation({
                    organization_id:request.organization_id,
                    asset_id:deskAssetID,
                    track_latitude:request.work_location_latitude,
                    track_longitude:request.work_location_longitude,
                    track_gps_accuracy:0,
                    track_gps_status:0,
                    track_gps_location:request.work_location_address,
                    track_gps_datetime:util.getCurrentUTCTime(),
                    datetime_log:util.getCurrentUTCTime()
                });
            } catch (error) {
                logger.error(`upateDeskAndEmployeeAsset.updateAssetLocationPromise [Desk]`, { type: 'admin_ops', request_body: request, error });
            }

            // Update location for the employee asset
            try {
                await activityCommonService.updateAssetWorkLocation({
                    organization_id:request.organization_id,
                    asset_id:employeeAssetID,
                    track_latitude:request.work_location_latitude,
                    track_longitude:request.work_location_longitude,
                    track_gps_accuracy:0,
                    track_gps_status:0,
                    track_gps_location:request.work_location_address,
                    track_gps_datetime:util.getCurrentUTCTime(),
                    datetime_log:util.getCurrentUTCTime()
                });
            } catch (error) {
                logger.error(`upateDeskAndEmployeeAsset.updateAssetLocationPromise [Employee]`, { type: 'admin_ops', request_body: request, error });
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

            try {
                let newReq = {
                    activity_id: contactCardActivityID,
                    activity_inline_data: JSON.stringify(contactCardJSON),
                    asset_id: deskAssetID,
                    operating_asset_id: employeeAssetID
                };
                await activityAssetMappingUpdateOperationAssetData(newReq, organizationID);
                await activityListUpdateOperatingAssetData(newReq, organizationID);
            } catch (error) {
                logger.error(`upateDeskAndEmployeeAsset.activityAssetMappingUpdateOperationAssetData`, { type: 'admin_ops', request_body: request, error });
                logger.error(`upateDeskAndEmployeeAsset.activityListUpdateOperatingAssetData`, { type: 'admin_ops', request_body: request, error });
            }
        }

        //Update Manager Details
        let newReq = Object.assign({}, request);
        newReq.asset_id = deskAssetID;
        await this.updateAssetsManagerDetails(newReq);

        const mode = global.mode;
        if (request.organization_id === 868 && (mode === "preprod" || mode === "prod")) {

            try {
                await triggerESMSIntegrationsService({
                    asset_id: deskAssetID
                }, {
                    mode: mode,
                    request_type: "CLMS_USER_SERVICE_UPDATE"
                });

            } catch (e) {
                console.log(e);
            }

        }

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
            request.email_id,
            request.asset_type_id,
            request.asset_identification_number,
            request.asset_manual_work_location_address
        );
        const queryString = util.getQueryString('ds_p1_4_asset_list_update_details', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    updateRoleINRoundRobinQueue(request);
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };

    // Asset List Insert For Employee Desk v4 with aadhar and location crud
    async function assetListUpdateDetailsV4(request, deskAssetID = 0, logAssetID = 0) {
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
            request.email_id,
            request.asset_type_id,
            request.asset_identification_number,
            request.asset_manual_work_location_address
        );
        const queryString = util.getQueryString('ds_p1_5_asset_list_update_details', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    updateRoleINRoundRobinQueue(request);
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

        for (iterator_x = 0; iterator_x < statusTags.length; iterator_x++) {
            let newReqObj = Object.assign({}, request);
            newReqObj.activity_status_tag_id = statusTags[iterator_x].status_tag_id;
            let [err, statusList] = await adminListingService.workforceActivityStatusMappingSelectFlag(newReqObj);

            if (err) {
                return [true, {
                    message: "Error retrieving the status ids based on status tag!"
                }]
            }

            console.log('statusList.length : ', statusList.length);

            for (iterator_y = 0; iterator_y < statusList.length; iterator_y++) {
                let temp = {};
                temp.activity_status_id = statusList[iterator_y].activity_status_id;
                console.log('statusList for ', statusTags[iterator_x].status_tag, ' ------ ', statusList[iterator_y].activity_status_id);
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
        ).then(() => {
            error = false;
        }).catch((err) => {
            error = true;
        });

        return [error, responseData];
    };

    this.uploadSmartForm = async (request) => {
        //let jsonFormat = await util.getJSONfromXcel(request);   

        let fileName = request.bucket_url;
        const result = excelToJson({ sourceFile: fileName });
        jsonFormat = JSON.stringify(result, null, 4)

        console.log('typeof jsonformat : ', typeof jsonFormat);
        let data = JSON.parse(jsonFormat);
        let sheetsData = data['Sheet1'];

        //console.log('typeof sheetsData : ', typeof sheetsData);
        console.log('sheetsData.length : ', sheetsData.length);
        request.form_id = sheetsData[1].J;

        for (iterator_x = 1; iterator_x < sheetsData.length; iterator_x++) {
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
        const [error, assetTypeData] = await workforceAssetTypeMappingInsertRoleV1(request, organizationID, accountID, workforceID);
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

    // Workforce Aseet Type Mapping Insert V1
    async function workforceAssetTypeMappingInsertRoleV1(request, organizationID, accountID, workforceID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_type_name || '',
            request.asset_type_description || '',
            request.asset_type_category_id || 0,
            request.asset_type_level_id || 0,
            request.asset_type_flag_organization_specific||0,
            request.asset_type_flag_enable_approval||0,
            request.asset_type_approval_max_levels||0,
            request.asset_type_approval_wait_duration||0 ,
            request.asset_type_approval_activity_type_id||0 ,
            request.asset_type_approval_activity_type_name||"" ,
            request.asset_type_approval_origin_form_id ||"0",
            request.asset_type_approval_field_id ||"0",
            request.asset_type_attendance_type_id || "0",
            request.asset_type_attendance_type_name ||"",
            request.asset_type_flag_enable_suspension||0,
            request.asset_type_suspension_activity_type_id||0,
            request.asset_type_suspension_activity_type_name||"",
            request.asset_type_suspension_wait_duration||0,
            request.asset_type_flag_hide_organization_details||"",
            request.asset_type_flag_enable_send_sms || 0,
            request.asset_type_flag_form_access || 0,
            request.asset_type_flag_email_login || 0,
            request.asset_type_flag_enable_dashboard || 0,
            request.asset_type_flag_enable_gamification || 0,
            request.asset_type_flag_enable_gantt_chart || 0,
            workforceID,
            accountID,
            organizationID,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_4_workforce_asset_type_mapping_insert', paramsArr);

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

        const [error, assetTypeData] = await workforceAssetTypeMappingUpdateRoleV1(request, organizationID, accountID, workforceID);
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

    // Workforce Aseet Type Mapping Update V1
    async function workforceAssetTypeMappingUpdateRoleV1(request, organizationID, accountID, workforceID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_type_id,
            request.asset_type_name,
            request.asset_type_flag_enable_approval ,
            request.asset_type_approval_max_levels ,
            request.asset_type_approval_wait_duration ,
            request.asset_type_approval_activity_type_id ,
            request.asset_type_approval_activity_type_name ,
            request.asset_type_approval_origin_form_id ,
            request.asset_type_approval_field_id ,
            request.asset_type_attendance_type_id ,
            request.asset_type_attendance_type_name||"" ,
            request.asset_type_flag_enable_suspension||0,
            request.asset_type_suspension_activity_type_id||0,
            request.asset_type_suspension_activity_type_name||"",
            request.asset_type_suspension_wait_duration||0,
            request.asset_type_flag_hide_organization_details||"",
            request.asset_type_flag_sip_enabled,
            request.asset_type_flag_enable_send_sms || 0,
            request.asset_type_flag_sip_admin_access || 0,
            organizationID,
            request.flag || 0,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p2_workforce_asset_type_mapping_update', paramsArr);

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
        //const queryString = util.getQueryString('ds_p1_tag_type_master_insert', paramsArr);
        const queryString = util.getQueryString('ds_p1_tag_type_list_insert', paramsArr);

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
            request.inline_data || '{}',
            organizationID,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        //const queryString = util.getQueryString('ds_p1_tag_list_insert', paramsArr);
        const queryString = util.getQueryString('ds_v1_tag_list_insert', paramsArr);

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
    this.setBusinessHoursAccountLevel = async (request) => {
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
    this.setBusinessHoursWorkforceLevel = async (request) => {
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
    this.setBusinessHoursDeskLevel = async (request) => {
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
    this.activityTypeTagDelete = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_id,
            request.asset_id,
            request.datetime_log || util.getCurrentUTCTime()
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
    this.tagListHistoryInsert = async (request, updateTypeId) => {
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
    this.tagTypeDelete = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_id,
            request.asset_id,
            request.datetime_log
        );

        //const queryString = util.getQueryString('ds_v1_tag_type_master_delete', paramsArr);
        const queryString = util.getQueryString('ds_v1_tag_type_list_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    console.log('error :: ' + error);
                })
        }
        return [error, responseData];
    }

    this.assetListUpdateAdminFlag = async function (request) {

        if (request.flag == 3) {
            const [error, responseData] = await checkManager(request, 0);
            if (responseData[0].count > 0) {
                const [error1, responseData1] = await checkManager(request, 2);
                if (responseData1[0].count > 0) {
                    request.is_manager = 2;
                    await updateAdminFlag(request);
                } else {
                    request.is_manager = 1;
                    await updateAdminFlag(request);
                }
            } else {
                request.is_manager = 0;
                await updateAdminFlag(request);
            }
        } else {
            await updateAdminFlag(request);
        }

        return [false, {}]
    }

    this.checkManagerDetails = async (request) => {
        request.target_asset_id = request.asset_id;
        return await checkManager(request, 3);
    }

    //check manager flag
    async function checkManager(request, checkFlag) {
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

    //Set Admin Flags on targetAssetId
    async function updateAdminFlag(request) {
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

    this.idProofUpload = async (request) => {

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
                if (request.id_proof_document_1 !== "") {
                    idCardJSON.employee_id_proof_document_1 = request.id_proof_document_1;
                }

                if (request.id_proof_document_2 !== "") {
                    idCardJSON.employee_id_proof_document_2 = request.id_proof_document_2;
                }

                if (request.id_proof_document_3 !== "") {
                    idCardJSON.employee_id_proof_document_3 = request.id_proof_document_3;
                }

                if (!idCardJSON.hasOwnProperty("employee_id_proof_verification_status_1")) {
                    idCardJSON.employee_id_proof_verification_status_1 = 0;
                }

                if (!idCardJSON.hasOwnProperty("employee_id_proof_verification_status_2")) {
                    idCardJSON.employee_id_proof_verification_status_2 = 0;
                }

                if (!idCardJSON.hasOwnProperty("employee_id_proof_verification_status_3")) {
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
                if (request.id_proof_document_1 !== "") {
                    contactCardJSON.employee_id_proof_document_1 = request.id_proof_document_1;
                }

                if (request.id_proof_document_2 !== "") {
                    contactCardJSON.employee_id_proof_document_2 = request.id_proof_document_2;
                }

                if (request.id_proof_document_3 !== "") {
                    contactCardJSON.employee_id_proof_document_3 = request.id_proof_document_3;
                }

                if (!contactCardJSON.hasOwnProperty("employee_id_proof_verification_status_1")) {
                    contactCardJSON.employee_id_proof_verification_status_1 = 0;
                }

                if (!contactCardJSON.hasOwnProperty("employee_id_proof_verification_status_2")) {
                    contactCardJSON.employee_id_proof_verification_status_2 = 0;
                }

                if (!contactCardJSON.hasOwnProperty("employee_id_proof_verification_status_3")) {
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
        if (assetData.length > 0) {
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


    this.organizationInlineDataUpdate = async function (request) {

        const [err, orgData] = await adminListingService.organizationListSelect(request);

        let org_config_data = orgData[0].organization_inline_data ? orgData[0].organization_inline_data : {};
        org_config_data = JSON.parse(org_config_data);
        //console.log("org_config_data :: "+JSON.stringify(org_config_data));
        //console.log("request.org_bot_config_data :: "+request.org_bot_config_data);
        org_config_data = JSON.parse(request.org_bot_config_data);

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


    this.updateOrganizationAIBot = async function (request) {
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

    this.updateOrganizationFeatureInlineData = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.enterprise_feature_data,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_organization_list_update_enterprise_feature_data', paramsArr);

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

    this.updateOrganizationFormTagFlag = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.flag_enable_form_tag,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_organization_list_update_flag_enable_form_tag', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [];
    }

    this.processSignup = async function (request) {
        let responseData = [],
            error = true;

        logger.info("country_code :: " + request.country_code);
        logger.info("phone_number :: " + request.asset_phone_number);
        logger.info("email :: " + request.asset_email_id);
        logger.info("fullname :: " + request.asset_full_name);
        logger.info("domain :: " + request.organziation_domain_name);
        logger.info("move_assets :: "+request.move_assets);
        logger.info("asset_id :: "+request.desk_asset_id);
        logger.info("operating_asset_id :: "+request.operating_asset_id);

        let domainIndex = request.asset_email_id.indexOf('@');
        request.organization_name = request.asset_email_id.substring(domainIndex + 1, request.asset_email_id.length);
        request.organization_phone_country_code = request.country_code;
        request.organization_phone_number = request.asset_phone_number;
        request.asset_id = 100;
        request.organization_domain_name = request.organization_name;
        request.organization_email = request.asset_email_id;

        let [orgErr, idOrganization] = await self.createOrganizationV1(request);

        request.organization_id = idOrganization;
        request.account_city = request.country_code + "" + request.asset_phone_number;

        let [accErr, idAccount] = await self.createAccountV1(request);

        request.account_id = idAccount;
        request.workforce_name = "CommonFloor";
        request.workforce_type_id = 16;

        let [workforceErr, workforceData] = await self.createWorkforceV1(request);

        logger.info("workforceData.length :: "+JSON.stringify(workforceData));

        if(request.move_assets == 1){

           if(workforceData.hasOwnProperty("workforce_id")){

            let ObjectRequest = Object.assign({},request);

            ObjectRequest.new_organization_id = workforceData.organization_id;
            ObjectRequest.new_account_id = workforceData.account_id;
            ObjectRequest.new_workforce_id = workforceData.workforce_id;
            ObjectRequest.new_desk_asset_type_id = workforceData.desk_asset_type_id;
            ObjectRequest.new_employee_asset_type_id = workforceData.employee_asset_type_id;
            ObjectRequest.workforce_id = request.temp_workforce_id;
            ObjectRequest.account_id = request.temp_account_id;
            ObjectRequest.organization_id = request.temp_organization_id;
            ObjectRequest.log_asset_id = 1;
            await  self.moveEmployeeDeskToAnotherOrganization(ObjectRequest);

           }
        }else{
            logger.info("move_assets is not 1, hence not moving any assets "+request.move_assets);
        }

        return [workforceErr, workforceData];
    }


    this.createOrganizationV1 = async function (request) {

        let organizationID = 0;
        let [orgErr, responseOrgData] = await adminListingService.organizationListSelectName(request);
        if (!orgErr) {
            if (responseOrgData.length > 0) {
                return [false, responseOrgData[0].organization_id];
            } else {
                const [err, orgData] = await organizationListInsert(request);
                if (err) {
                    return [true, err];
                } else {
                    if (orgData.length > 0) {
                        request.organization_id = orgData[0].organization_id;
                        request.update_type_id = 0;
                        organizationListHistoryInsert(request);
                        return [false, orgData[0].organization_id];
                    } else {
                        return [true, 0];
                    }

                }
            }
        } else {
            return [true, orgErr];
        }


    }

    // Get account bassed on country code
    this.createAccountV1 = async function (request) {
        let responseData = [],
            error = true;
        [error, responseData] = await adminListingService.accountListSelectCountryCode(request);
        if (!error) {
            if (responseData.length > 0) {

                return [false, responseData[0].account_id];

            } else {
                    request.account_type_id = 2;
                const [errOne, accountData] = await accountListInsert(request, request.organization_id);
                if (errOne) {

                    return [true, errOne];

                } else if (accountData.length > 0) {

                    request.account_id = accountData[0].account_id;
                    request.update_type_id = 0;
                    accountListHistoryInsert(request);
                    return [false, accountData[0].account_id];
                } else {
                    return [true, 0];
                }

            }
        } else {
            return [true, error];
        }
    }

    this.createWorkforceV1 = async function (request) {
        let responseData = [],
            error = true;
        let assetTypes = {};
        let activityTypes = {};
        [error, responseData] = await adminListingService.workforceListSelectWorkforceType(request);
        if (!error) {
            if (responseData.length > 0) {

                request.workforce_id = responseData[0].workforce_id;

                request.asset_type_category_id = 2;
                const [errEmp, empAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory(request);
                assetTypes[2] = empAssetTypeData[0].asset_type_id ? empAssetTypeData[0].asset_type_id : 0;

                request.asset_type_category_id = 3;
                const [errDesk, deskAssetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory(request);
                assetTypes[3] = deskAssetTypeData[0].asset_type_id ? deskAssetTypeData[0].asset_type_id : 0;

                request.activity_type_category_id = 4;
                const [errIdCard, idCardCData] = await adminListingService.workforceActivityTypeMappingSelectCategory(request);
                activityTypes[4] = idCardCData[0].activity_type_id ? idCardCData[0].activity_type_id : 0;

                request.activity_type_category_id = 5;
                const [errContactCard, contactCardCData] = await adminListingService.workforceActivityTypeMappingSelectCategory(request);
                activityTypes[5] = contactCardCData[0].activity_type_id ? contactCardCData[0].activity_type_id : 0;

                return [false, {
                    organization_id: request.organization_id,
                    account_id: request.account_id,
                    workforce_id: responseData[0].workforce_id,
                    asset_types: assetTypes,
                    employee_activity_type_id: activityTypes[4],
                    desk_activity_type_id: activityTypes[5],
                    employee_asset_type_id: assetTypes[2],
                    desk_asset_type_id: assetTypes[3]
                }];
            } else {
                let [err3, workforceData] = await self.createWorkforceWithDefaults(request);
                return [err3, workforceData];
            }
        } else {
            return [true, error];
        }
    }

    // Create a new workforce, department or a floor
    this.createWorkforceWithDefaults = async function (request) {

        let assetTypes = { "2": 0, "3": 0 };
        let activityTypes = { "4": 0, "5": 0 };

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
            } else {
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

            if (activityType.activity_type_category_id === 4) {
                activityTypes[4] = activityTypeID;
            } else if (activityType.activity_type_category_id === 5) {
                activityTypes[5] = activityTypeID;
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
                        console.log("Exception : " + error);
                    }
                    // 
                }
            }
        }

        return [false, {
            workforce_id: workforceID,
            account_id: request.account_id,
            organization_id: request.organization_id,
            asset_types: assetTypes,
            employee_activity_type_id: activityTypes[4],
            desk_activity_type_id: activityTypes[5],
            employee_asset_type_id: assetTypes[2],
            desk_asset_type_id: assetTypes[3]
        }]

    }

    this.createAssetTypesV1 = async function (request) {
        let responseData = [],
            error = true;
        [error, responseData] = await adminListingService.workforceAssetTypeMappingSelectCategory(request);
        if (!error) {
            if (responseData.length > 0) {

                return [false, responseData[0].account_id];

            } else {

                const [errOne, assetTypeData] = await workforceAssetTypeMappingInsert(request, request.workforce_id, request.organization_id, request.account_id);
                if (errOne) {

                    return [true, errOne];

                } else if (assetTypeData.length > 0) {

                    request.asset_type_id = assetTypeData[0].asset_type_id;
                    request.update_type_id = 0;
                    workforceAssetTypeMappingHistoryInsert(request, assetTypeData[0].asset_type_id, request.organization_id);
                    return [false, assetTypeData[0].asset_type_id];
                } else {
                    return [true, 0];
                }

            }
        } else {
            return [true, error];
        }
    }

    this.updateWorkbookMappingForWorkflow = async function (request) {
        const organizationID = Number(request.organization_id),
            workbookURL = request.workbook_url || "",
            isWorkbookMapped = Number(request.is_workbook_mapped);

        // Update workbook data in the activity_list table
        try {
            await activityListUpdateWorkbookBot({
                ...request,
                activity_id: request.activity_id,
                workbook_url: workbookURL,
                is_workbook_mapped: isWorkbookMapped
            }, organizationID);
        } catch (error) {
            logger.error("updateWorkbookMappingForWorkflow.activityListUpdateWorkbookBot | Error updating workbook data in the activity_list table", { type: 'admin_service', error: serializeError(error), request_body: request });
        }

        // Update the activity list history table
        try {
            await activityCommonService.activityListHistoryInsertAsync({
                ...request,
                activity_id: request.activity_id,
                datetime_log: util.getCurrentUTCTime()
            }, 419);
        } catch (error) {
            logger.error("updateWorkbookMappingForWorkflow activityListHistoryInsertAsync | Error updating workbook data in the activity_list_history table", { type: 'admin_service', error: serializeError(error), request_body: request });
        }

        // Update workbook data in the activity_list table
        try {
            await activityAssetMappingUpdateWorkbookBot({
                ...request,
                activity_id: request.activity_id,
                workbook_url: workbookURL,
                is_workbook_mapped: isWorkbookMapped
            }, organizationID);
        } catch (error) {
            logger.error("updateWorkbookMappingForWorkflow.activityAssetMappingUpdateWorkbookBot | Error updating workbook data in the activity_asset_mapping table", { type: 'admin_service', error: serializeError(error), request_body: request });
        }

        // return [new ClientInputError("Error fetching workflow's inline data", -9998), []];
        return [false, [{
            activity_id: request.activity_id,
            workbook_url: workbookURL,
            is_workbook_mapped: isWorkbookMapped
        }]];
    };

    // Asset List Update v1: update workbook URL
    async function activityListUpdateWorkbookBot(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            request.activity_id,
            request.workbook_url,
            request.is_workbook_mapped,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_activity_list_update_workbook_bot', paramsArr);

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

    // Asset Asset Mapping Update v1: update workbook URL
    async function activityAssetMappingUpdateWorkbookBot(request, organizationID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            request.activity_id,
            request.workbook_url,
            request.is_workbook_mapped,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_workbook_bot', paramsArr);

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


    this.tagTypeUpdate = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_id,
            request.tag_type_name,
            request.tag_type_description,
            request.asset_id,
            request.datetime_log || util.getCurrentUTCTime()
        );

        //const queryString = util.getQueryString('ds_v1_tag_type_master_update', paramsArr);
        const queryString = util.getQueryString('ds_v1_tag_type_list_update', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    console.log('error :: ' + error);
                })
        }
        return [error, responseData];
    }


    //Insert into Tag Entity Mapping Insert
    this.tagEntityMappingInsert = async (request) => {
        let responseData = [],
            error = false;

        //Workflow- tag_type_category_id: 1
        //Workforce- tag_type_category_id: 2
        //Resource- tag_type_category_id: 3
        //Status- tag_type_category_id: 4

        console.log('typeof request.entity_list : ', typeof request.entity_list);
        let entityList;
        if(typeof request.entity_list === 'string') {
            entityList = JSON.parse(request.entity_list);
        } else {
            entityList = request.entity_list;
        }        
        console.log(entityList);

        switch(Number(request.tag_type_category_id)) {
            case 1: for(let i = 0; i < entityList.length; i++) {
                        request.activity_type_id = entityList[i];
                        await this.tagEntityMappingInsertDBCall(request);
                    }
                    break;
            case 2: for(let i = 0; i < entityList.length; i++) {
                        request.tag_workforce_id = entityList[i];
                        await this.tagEntityMappingInsertDBCall(request);
                    }
                    break;
            case 3: for(let i = 0; i < entityList.length; i++) {
                        request.resource_id = entityList[i];
                        await this.tagEntityMappingInsertDBCall(request);
                    }
                    break;
            case 4: for(let i = 0; i < entityList.length; i++) {
                        request.activity_status_id = entityList[i];
                        await this.tagEntityMappingInsertDBCall(request);
                    }
                    break;
            case 5: for(let i = 0; i < entityList.length; i++) {
                        request.activity_type_id = entityList[i];
                        await this.tagEntityMappingInsertDBCall(request);
                    }
                    break;
            case 8: for(let i = 0; i < entityList.length; i++) {
                        request.activity_type_id = entityList[i];
                        await this.tagEntityMappingInsertDBCall(request);
                    }
                    break;
            default: break;
        }       
        
        return [error, responseData];
    }

    //Insert into Tag Entity Mapping DB Insert
    this.tagEntityMappingInsertDBCall = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_id,
            request.tag_type_category_id,
            request.activity_type_id || 0,
            request.resource_id || 0, //asset_id
            request.tag_workforce_id || 0,
            request.activity_status_id || 0,
            request.asset_id,
            request.datetime_log || util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_v1_tag_entity_mapping_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                    await createDefaultWidgets(request,data[0].tag_type_id)
                    //History Insert
                    tagEntityMappingHistoryInsert(request, 0);
                })
                .catch((err) => {
                    error = err;
                    console.log('error :: ' + error);
                })
        }
        return [error, responseData];
    }

    async function createDefaultWidgets (request,tag_type_id){
        let responseData = [],
        error = true;
        request.tag_type_id = tag_type_id;
       let data1 = await analyticsService.getManagementWidgetList(request);
    //    console.log(data1)
               let widgetData = require('../../utils/defaultWidgetMappings.json');
               let [actError,activity_type] = await adminListingService.workforceActivityTypeMappingSelectCategory({...request,activity_type_category_id:58,workforce_id:0});
               if(activity_type.length==0){
                   return [false,[]]
               }
            //    console.log(widgetData)
               for(let i=0;i<widgetData.length;i++){
                  let checkExistingWidgets = data1.length>0 ? data1.findIndex((item)=>item.widget_type_id==widgetData[i].widget_type_id):-1;
                  console.log(checkExistingWidgets)
                  if(checkExistingWidgets!=-1){
                      continue
                  }
                  
                  let widgetDataToSend = {
                    "filter_account_id": 0,
                    "filter_activity_status_id": 0,
                    "filter_activity_status_tag_id": 0,
                    "filter_activity_status_type_id": 0,
                    "filter_activity_type_id": 0,
                    "filter_asset_id": 0,
                    "filter_circle_id": 0,
                    "filter_field_id": 0,
                    "filter_form_id": 0,
                    "filter_is_datetime_considered": 1,
                    "filter_is_value_considered": 0,
                    "filter_reporting_manager_id": 0,
                    "filter_segment_id": 0,
                    "filter_tag_id": 0,
                    "filter_tag_type_id": `[{\"tag_type_id\":${tag_type_id}}]`,
                    "filter_timeline_name": -1,
                    "filter_workforce_id": 0,
                    "filter_workforce_type_id": 0,
                    "widget_aggregate_id": 1,
                    "widget_enabled_statuses": [
                        0,
                        1,
                        2
                    ],
                    "widget_id": -1,
                    "widget_target_value": "",
                    "widget_type_category_id": 3,
                    activity_type_category_id:58,
                    activity_type_id:activity_type[0].activity_type_id
                  }
                  widgetDataToSend = {...widgetDataToSend,...widgetData[i]};
                  let requestToSend = {...request,...widgetDataToSend};
                //   console.log(requestToSend)
                 let [errCreate,createdData] = await analyticsService.analyticsWidgetAddV1(requestToSend)
               }
            //    await new Promise((resolve)=>{
            //     setTimeout(()=>{
            //         return resolve();
            //     }, 3500);
            // });
            // console.log("returned")
               return [false,[]]
}

this.createWidgetsV1 = async (request)=>{
    //check entity mapping with activity_type_id 
    let responseData = [],
    error = true;
const paramsArr = new Array(
    request.organization_id,
    request.activity_type_id,
    request.flag ||0,
    0,
    50
);

const queryString = util.getQueryString('ds_v1_tag_entity_mapping_select_activity_type', paramsArr);

if (queryString !== '') {
    await db.executeQueryPromise(1, queryString, request)
        .then(async (data1) => {
            let [actError,activity_type] = await adminListingService.workforceActivityTypeMappingSelectCategory({...request,activity_type_category_id:58});
          if(data1.length>0){
            let tag_type_id = data1[0].tag_type_id;
            request.filter_tag_type_id = `[{\"tag_type_id\":${tag_type_id}}]`;
            request.activity_type_category_id = 58;
            request.activity_type_id = activity_type[0].activity_type_id;
            console.log(request)
            await analyticsService.analyticsWidgetAddV1(request)
          }
          else{
            let [err1,tagData] = await this.tagEntityMappingInsertDBCall({...request});
            request.filter_tag_type_id = `[{\"tag_type_id\":${tagData[0].tag_type_id}}]`;
            request.activity_type_category_id = 58;
            request.activity_type_id = activity_type[0].activity_type_id;
            await analyticsService.analyticsWidgetAddV1(request)

          }
        }).catch(err=>{
        return [true,[]] 
        })
    }
    return [false,[]]
    
}


    this.tagEntityMappingDelete = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_id,
            request.asset_id,
            request.datetime_log || util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_v1_tag_entity_mapping_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;

                    //History Insert
                    tagEntityMappingHistoryInsert(request, 2201);
                })
                .catch((err) => {
                    error = err;
                    console.log('error :: ' + error);
                })
        }
        return [error, responseData];
    }

    this.tagEntityMappingDeleteV1 = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_id,
            request.tag_type_category_id,
            request.activity_type_id || 0,
            request.tag_workforce_id || 0,
            request.tag_asset_id || 0,
            request.activity_status_id || 0,
            request.asset_id,
            request.datetime_log || util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_v1_1_tag_entity_mapping_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;

                    //History Insert
                    tagEntityMappingHistoryInsert(request, 2201);
                })
                .catch((err) => {
                    error = err;
                    console.log('error :: ' + error);
                })
        }
        return [error, responseData];
    }

    async function tagEntityMappingHistoryInsert(request, updateTypeID) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_id,
            updateTypeID,
            request.datetime_log || util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_v1_tag_entity_mapping_history_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    console.log('error :: ' + error);
                })
        }
        return [error, responseData];
    }

    this.assetAccessRoleMappingInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.target_asset_id,
            request.asset_email_id,
            request.asset_access_role_id,
            request.asset_access_level_id,
            request.sharing_asset_id,
            request.sharing_asset_type_id,
            request.sharing_activity_id,
            request.sharing_activity_type_id,
            request.sharing_workforce_id,
            request.sharing_account_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime(),
            request.asset_access_type_id || 2
        );
        const queryString = util.getQueryString('ds_p1_1_asset_access_mapping_insert', paramsArr);

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

    this.assetAccessRoleMappingUpdate = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.account_id,
          request.workforce_id,
          request.asset_id,
          request.access_level_id,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );


        const queryString = util.getQueryString('ds_p1_asset_access_mapping_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    // Move Employee Desk To Another Organization
    this.moveEmployeeDeskToAnotherOrganization = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id),
            newAccountID = Number(request.new_account_id),
            newWorkforceID = Number(request.new_workforce_id),
            newOrganizationID = Number(request.new_organization_id),
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

        const newWorkforceDeskAssetTypeID = request.new_desk_asset_type_id;

        // Update the workforce
        const [errFour, _] = await self.assetListUpdateNewOrganizationWorkforce({
            asset_id: deskAssetID,
            new_asset_type_id: newWorkforceDeskAssetTypeID,
            new_workforce_id: newWorkforceID,
            new_account_id: newAccountID,
            new_organization_id: newOrganizationID,
            workforce_id: workforceID,
            account_id: accountID,
            organization_id: organizationID,            
            log_asset_id: request.log_asset_id
        });
        if (errFour) {
            console.log("moveEmployeeDeskToAnotherOrganization | assetListUpdateNewOrganizationWorkforce | Error: ", errFour);
            return [true, {
                message: "Error updating desk asset of the workforce"
            }];
        }

        // Desk Asset List History Insert
        try {
            await assetListHistoryInsert({
                asset_id: deskAssetID,
                update_type_id: 218
            }, newOrganizationID);
        } catch (error) {
            console.log("moveEmployeeDeskToAnotherOrganization | Desk Asset List History Insert | Error: ", error);
        }

        // Desk Asset Timeline Transaction Insert
        try {
            let assetTimelineTxnRequest = Object.assign({}, request);
            assetTimelineTxnRequest.asset_id = deskAssetID;
            assetTimelineTxnRequest.stream_type_id = 11024;

            await assetTimelineTransactionInsert(assetTimelineTxnRequest, newWorkforceID, newOrganizationID, newAccountID);
        } catch (error) {
            console.log("moveEmployeeDeskToAnotherOrganization | assetTimelineTransactionInsert | Error: ", error);
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
                organization_id: newOrganizationID,
                asset_id: deskAssetID
            });

            if (!errSeven && Number(deskAssetDataFromDB.length) > 0) {
                deskAssetDataFromDB_Copy = deskAssetDataFromDB;

                // Update workforce name
                newWorkforceName = deskAssetDataFromDB[0].workforce_name;

                // Update inline data
                contactCardInlineData.contact_department = deskAssetDataFromDB[0].workforce_name;
                contactCardInlineData.contact_asset_type_id = deskAssetDataFromDB[0].asset_type_id;
                contactCardInlineData.contact_designation = deskAssetDataFromDB[0].asset_type_name;
                contactCardInlineData.contact_account_id = newAccountID;
                contactCardInlineData.contact_workforce_id = newWorkforceID;
                contactCardInlineData.contact_organization_id = newOrganizationID;
                contactCardInlineData.contact_organization = deskAssetDataFromDB[0].organization_name;

                // Co-Worker Contact Card: Activity List and ActivityAssetMapping Update
                try {
                    request.activity_inline_data = JSON.stringify(contactCardInlineData);
                    request.activity_id = coWorkerContactCardActivityID;
                    request.target_asset_id = deskAssetID;
                    request.activity_type_category_id = 5;
                    await activityListUpdateAssetData(request);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherOrganization | Co-Worker | activityListUpdateOperatingAssetData | Error: ", error);
                }

                // Co-Worker Contact Card: Activity Timeline Transaction Insert
                try {
                    let activityTimelineTxnRequest = Object.assign({}, request);
                    activityTimelineTxnRequest.activity_id = coWorkerContactCardActivityID;
                    activityTimelineTxnRequest.asset_id = deskAssetID;
                    activityTimelineTxnRequest.stream_type_id = 11024;

                    await activityTimelineTransactionInsert(activityTimelineTxnRequest, newWorkforceID, newOrganizationID, newAccountID);
                } catch (error) {
                    console.log("removeEmployeeMappedToDesk | Co-Worker | activityTimelineTransactionInsert | Error: ", error);
                }
                // Co-Worker Contact Card: History Insert
                try {
                    await activityListHistoryInsert({
                        activity_id: coWorkerContactCardActivityID,
                        update_type_id: 407
                    }, newOrganizationID);
                } catch (error) {
                    console.log("removeEmployeeMappedToDesk | Co-Worker | activityListHistoryInsert | Error: ", error);
                }
            }
        }

        // Check if the desk has operating asset assigned
        if (Number(deskAssetDataFromDB_Copy[0].operating_asset_id) > 0) {
            operatingAssetID = Number(deskAssetDataFromDB_Copy[0].operating_asset_id);

            const newWorkforceEmployeeAssetTypeID = request.new_employee_asset_type_id;

            const [errSix, _] = await self.assetListUpdateNewOrganizationWorkforce({
                asset_id: operatingAssetID,
                new_asset_type_id: newWorkforceDeskAssetTypeID,
                new_workforce_id: newWorkforceID,
                new_account_id: newAccountID,
                new_organization_id: newOrganizationID,
                workforce_id: workforceID,
                account_id: accountID,
                organization_id: organizationID,            
                log_asset_id: request.log_asset_id
                });
            if (!errSix) {
                console.log("moveEmployeeDeskToAnotherOrganization | Employee | assetListUpdateNewOrganizationWorkforce | Error: ", errSix);

                // Employee Asset List History Insert
                try {
                    await assetListHistoryInsert({
                        asset_id: operatingAssetID,
                        update_type_id: 218
                    }, newOrganizationID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherOrganization | Employee | Asset List History Insert | Error: ", error);
                }

                // Employee Asset Timeline Transaction Insert
                try {
                    let assetTimelineTxnRequest = Object.assign({}, request);
                    assetTimelineTxnRequest.asset_id = operatingAssetID;
                    assetTimelineTxnRequest.stream_type_id = 11024;

                    await assetTimelineTransactionInsert(assetTimelineTxnRequest, newWorkforceID, newOrganizationID, newAccountID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherOrganization | Employee | assetTimelineTransactionInsert | Error: ", error);
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
                idCardActivityInlineData.employee_account_id = newAccountID;
                idCardActivityInlineData.workforce_name = newWorkforceName;
                idCardActivityInlineData.employee_workforce_id = newWorkforceID;
                idCardActivityInlineData.employee_organization_id = newOrganizationID;
                idCardActivityInlineData.employee_organization = deskAssetDataFromDB_Copy[0].organization_name;
                idCardActivityInlineData.employee_qr_code = newOrganizationID+"|"+newAccountID+"|"+deskAssetDataFromDB_Copy[0].asset_id+"|"+deskAssetDataFromDB_Copy[0].operating_asset_id+"|"+deskAssetDataFromDB_Copy[0].asset_type_name+"|"+deskAssetDataFromDB_Copy[0].asset_first_name;
                // ID Card: Activity List Update and Activity Asset Mapping Update
                try {
                    request.activity_inline_data = JSON.stringify(idCardActivityInlineData);
                    request.activity_id = idCardActivityID; 
                    request.target_asset_id = operatingAssetID; 
                    request.activity_type_category_id = 4;                  
                    await activityListUpdateAssetData(request);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherOrganization | ID Card | activityListUpdateAssetData | Error: ", error);
                }

                // ID Card: History Insert
                try {
                    await activityListHistoryInsert({
                        activity_id: idCardActivityID,
                        update_type_id: 407
                    }, newOrganizationID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherOrganization | ID Card | activityListHistoryInsert | Error: ", error);
                }
                // ID Card: Activity Timeline Transaction Insert
                try {
                    let activityTimelineTxnRequest = Object.assign({}, request);
                    activityTimelineTxnRequest.activity_id = idCardActivityID;
                    activityTimelineTxnRequest.asset_id = operatingAssetID;
                    activityTimelineTxnRequest.stream_type_id = 11010;

                    await activityTimelineTransactionInsert(activityTimelineTxnRequest, newWorkforceID, newOrganizationID, newAccountID);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherOrganization | ID Card | activityTimelineTransactionInsert | Error: ", error);
                }

                // ID Card: Activity List Update and Activity Asset Mapping Update
                try {
                    let inlineData = {};
                    request.activity_inline_data = JSON.stringify(inlineData);
                    request.activity_id = 0; 
                    request.target_asset_id = deskAssetID; 
                    request.activity_type_category_id = 0;                  
                    await activityListUpdateAssetData(request);
                } catch (error) {
                    console.log("moveEmployeeDeskToAnotherOrganization | ID Card | activityListUpdateAssetData | Error: ", error);
                }

            }

        } else {
            console.log("moveEmployeeDeskToAnotherOrganization | deskAssetDataFromDB[0].operating_asset_id: No operating asset found.");
        }

        return [false, {
            message: "Desk (and Employee) moved to the new Organization",
            organization_id: newOrganizationID,
            account_id: newAccountID,
            workforce_id: newWorkforceID,
            desk_asset_id: deskAssetID,
            employee_asset_id: operatingAssetID
        }];
    }       

    this.assetListUpdateNewOrganizationWorkforce = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.new_asset_type_id,
            request.new_workforce_id,
            request.new_account_id,
            request.new_organization_id,            
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.log_asset_id,
            util.getCurrentUTCTime() // Updated datetime
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_organization', paramsArr);

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
    async function activityListUpdateAssetData(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.target_asset_id,
            request.activity_id,
            request.new_organization_id,
            request.organization_id,
            request.activity_inline_data,
            request.activity_type_category_id,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_activity_list_update_organization', paramsArr);

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

    this.addDottedManagerForAsset = async function (request) {
        let dottedManagersList = [],
            responseData = [],
            error = true;

        try {
            dottedManagersList = JSON.parse(request.dotted_managers_list);
        } catch (error) {
            logger.error("Error parsing the request parameter: dotted_managers_list", { type: 'admin_service', error: serializeError(error), request_body: request });
            return [error, {
                error: "Error parsing the request parameter: dotted_managers_list"
            }];
        }

        for (const dottedManager of dottedManagersList) {
            let isUpdateSuccessful = true;
            // Add the dotted manager
            try {
                const [error, dottedManagerData] = await assetManagerMappingInsert({
                    ...request,
                    manager_asset_id: dottedManager.asset_id,
                    flag_dotted_manager: 1
                });
                if (error && error.code === "ER_DUP_ENTRY") {
                    await assetManagerMappingHistoryUpdateLogState({
                        ...request,
                        manager_asset_id: dottedManager.asset_id,
                        log_state: 2
                    });
                } else {
                    throw error;
                }
                responseData.push(dottedManagerData);
            } catch (error) {
                isUpdateSuccessful = false;
                logger.error("Error updating dotted manager", { type: 'admin_service', error: serializeError(error), request_body: request, dotted_manager: dottedManager });
            }

            // History update
            if (isUpdateSuccessful) {
                try {
                    await assetManagerMappingHistoryInsert({
                        ...request,
                        manager_asset_id: dottedManager.asset_id,
                    }, 0);
                } catch (error) {
                    // Do nothing for now
                }
            }
        }

        return [false, responseData];
    }

    async function assetManagerMappingInsert(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.target_asset_id,
            request.manager_asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.flag_highest_level || 0,
            request.flag_lowest_level || 0,
            request.flag_dotted_manager,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_asset_manager_mapping_insert', paramsArr);

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

    async function assetManagerMappingHistoryInsert(request, updateTypeID = 0) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.target_asset_id,
            request.manager_asset_id,
            updateTypeID,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_asset_manager_mapping_history_insert', paramsArr);

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

    async function assetManagerMappingHistoryUpdateLogState(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.target_asset_id,
            request.manager_asset_id,
            request.log_state,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_asset_manager_mapping_update_log_state', paramsArr);

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

    this.removeDottedManagerForAsset = async function (request) {
        let dottedManagersList = [],
            responseData = [],
            error = true;

        try {
            dottedManagersList = JSON.parse(request.dotted_managers_list);
        } catch (error) {
            logger.error("Error parsing the request parameter: dotted_managers_list", { type: 'admin_service', error: serializeError(error), request_body: request });
            return [error, {
                error: "Error parsing the request parameter: dotted_managers_list"
            }];
        }

        for (const dottedManager of dottedManagersList) {
            // Archive the mapping
            try {
                const [_, dottedManagerData] = await assetManagerMappingHistoryUpdateLogState({
                    ...request,
                    manager_asset_id: dottedManager.asset_id,
                    log_state: 3
                });

                responseData.push(dottedManagerData[0]);
            } catch (error) {
                logger.error("Error removing dotted manager", { type: 'admin_service', error: serializeError(error), request_body: request, dotted_manager: dottedManager });
            }
            // History
            try {
                await assetManagerMappingHistoryInsert({
                    ...request,
                    manager_asset_id: dottedManager.asset_id,
                }, 1);
            } catch (error) {
                // Do nothing for now
            }
        }

        return [false, responseData]
    };
    
    this.listDottedManagerForAsset = async function (request) {
        const [error, assetManagersData] = await assetManagerMappingSelect({
            ...request,
            target_asset_id: request.target_asset_id
        });

        return [error, assetManagersData];
    };

    async function assetManagerMappingSelect(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
            request.manager_asset_id,
            request.flag || 0,
            request.start_from || 0,
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_asset_manager_mapping_select', paramsArr);

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

    this.sendInviteText = async function(request){
        let responseData = [],
            error = false;

        // Send SMS to the newly added employee
        try {

            //get Asset Data
            let reqObject = Object.assign({}, request);
            reqObject.asset_id = request.target_asset_id;
            let [errorOne, responseDataOne]  = await activityCommonService.getAssetDetailsAsync(reqObject);

            // Get the Org data
            let orgData = [], senderID = '';
            let orgDataQueryParams = new Array(1);
            orgDataQueryParams[0] = Number(request.organization_id);
            const queryString = util.getQueryString('ds_p1_organization_list_select', orgDataQueryParams);
            if (queryString != '') {
                orgData = await (db.executeQueryPromise(1, queryString, request));
            }
            (orgData.length > 0) ? senderID = orgData[0].organization_text_sender_name : senderID = 'MYTONY';

            const smsMessage = `Dear ${responseDataOne[0].operating_asset_first_name || ''} ${responseDataOne[0].operating_asset_last_name || ''}, you have been added as an '${responseDataOne[0].asset_first_name}' by '${responseDataOne[0].organization_name || ''}' to join their '${responseDataOne[0].workforce_name || ''}' workforce. Please click on the link below to download the Grene Go and get started.
        
            https://download.greneos.com`;

            util.sendSmsSinfiniV1(smsMessage, responseDataOne[0].operating_asset_phone_country_code || 91, responseDataOne[0].operating_asset_phone_number || 0, senderID, function (err, response) {
                console.log('[sendInviteText] Sinfini Response: ', response);
                console.log('[sendInviteText] Sinfini Error: ', err);
            });
        } catch (error) {
            console.log('[sendInviteText] SMS Block Error: ', error);
        }
        return [error, responseData];
    }


    //Dependent form Submitted?
    //All conditions satisfying in the bots?

    this.dependedFormCheckWrapper = async (request) => {

        let err = false, dependedFormCheckResult, result = 0, response  = [];
        request.bot_operation_type_id = 20;
        let formList = JSON.parse(request.form_id_list);

        for(let formId of formList) {
            request.form_id = formId;
            let [err, formEnable] = await adminListingService.botOperationMappingSelectOperationType(request);
            // [err, formEnable] = await adminListingService.botOperationMappingSelectID(request);
            if(err) {
                return [true, [{ message : "Something went wrong!"}]];
            }

            if(!formEnable.length) {
                response.push({
                    isActive : true,
                    form_id  : formId
                });
                continue;
            }

            let isNewStructure = 0;
            for(let mainRow of formEnable) {
                let botInlineDataParsed = JSON.parse(mainRow.bot_operation_inline_data);
                let condition = botInlineDataParsed.conditions;

                if(condition) {
                    let formEnableData = botInlineDataParsed.form_enable;
                    for(let row of formEnableData) {

                        for(let key in row) {
                            request.version = 2;
                            request.form_id = row[key].form_id;
                            request.botsData = [{
                                bot_operation_inline_data : JSON.stringify({ form_enable : [row[key]] })
                            }];

                            console.log("request for new structure", JSON.stringify(request));
                            [err, dependedFormCheckResult] = await this.dependedFormCheckV2(request);
                            if(err) {
                                console.log("Processing next got false from one");
                            }

                            eval('var ' + key + '=' + dependedFormCheckResult + ';' );
                            console.log('var ' + key + '=' + dependedFormCheckResult + ';');
                        }
                    }
                } else {
                    isNewStructure = 1;
                    break;
                }

                try {
                    console.log("condition", condition);
                    result = eval(condition);
                    console.log("result------------>", result);
                    response.push({
                        isActive : result == 1 ? true : false,
                        form_id  : formId
                    })
                } catch (err) {
                    console.log("Error occured while processing the expression ", err);
                    result = [{ message : "Error while processing expression", expression : condition }];
                }
            }

            if(isNewStructure) {
                let formJson = {};
                request.form_id = formId;
                formJson.form_id = request.form_id;
                console.log("request for old structure");
                let [err, responseData] = await self.dependedFormCheck(request);
                if(!err){
                    formJson.isActive = true;
                }else{
                    formJson.isActive = false;
                }
                response.push(formJson);
            }
        }

        return [err, response ]
        
    }
    
    //Dependent form Submitted?
    //All conditions satisfying in the bots?
    this.dependedFormCheck = async (request) => {
        let responseData = [],
            error = true;
        console.log('In dependedFormCheck Function')
        request.bot_operation_type_id = 20;
        const [err, botsData] = await adminListingService.botOperationMappingSelectOperationType(request);

        if(botsData.length > 0) {
            let inlineData,tempFormsArr,conditions,dependentFormTransactionData;
            let i, j, k , l;

            for(i=0;i< botsData.length;i++) { //Looping on all bots_enabled forms in a given process
                inlineData = JSON.parse(botsData[i].bot_operation_inline_data);
                //console.log(inlineData.form_enable);

                tempFormsArr = inlineData.form_enable?inlineData.form_enable:[];
                console.log('tempFormsArr : ', JSON.stringify(tempFormsArr));

                if(tempFormsArr.length == 0){
                    error = false;
                    responseData.push({"message": "No Dependent Forms defined for this Form!"});
                }

                for(let j=0; j<tempFormsArr.length; j++) { //Looping on the each form
                    console.log(tempFormsArr[j].form_id);
                    conditions = tempFormsArr[j].conditions;

                    console.log('Conditions: ', JSON.stringify(conditions));

                    if(Number(request.form_id) === Number(tempFormsArr[j].form_id)) { //Checking for the given specific form

                        for(k=0;k<conditions.length;k++) { //Conditions Array
                            try {
                                //Check whether the dependent form is submitted
                                console.log(`Checking the dependent form - ${conditions[k].form_id}`)
                                dependentFormTransactionData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                                    organization_id: request.organization_id,
                                    account_id: request.account_id
                                }, Number(request.workflow_activity_id), conditions[k].form_id);

                                //console.log(`Dependent form  - ${conditions[k].form_id} length : ${Number(dependentFormTransactionData.length)}`);
                                if (Number(dependentFormTransactionData.length) > 0) {
                                    dependentFormTransactionInlineData = JSON.parse(dependentFormTransactionData[0].data_entity_inline);
                                    //console.log('FORM DATA : ', dependentFormTransactionInlineData.form_submitted);
                                    let formData = dependentFormTransactionInlineData.form_submitted;
                                    formData = (typeof formData === 'string')? JSON.parse(formData) : formData;
                                    let breakFlag = 0; //to break the outer loop

                                    //Iterate on form data
                                    //for(k=0;k<conditions.length;k++) { //Conditions Array

                                    if(!conditions[k].hasOwnProperty('field_id')) {
                                        if(conditions[k].join_condition == 'OR') {
                                            error = false;
                                            console.log(`dependent form ${conditions[k].form_id} conditions passed!`);
                                            responseData.push({"message": "dependent form conditions passed!"});
                                            break;
                                        } else if (conditions[k].join_condition == 'AND') {
                                            continue;
                                        } else { // EOJ
                                            error = false;
                                            console.log(`dependent form ${conditions[k].form_id} conditions passed!`);
                                            responseData.push({"message": "dependent form conditions passed!"});
                                            break;
                                        }
                                    } else {
                                        for(l=0;l<formData.length;l++){ //Iterate on the retrieved dependent Form Data
                                            //console.log(Number(conditions[k].field_id), ' - ', Number(formData[l].field_id), ' - ', formData[l].field_id);

                                            if(Number(conditions[k].field_id) === Number(formData[l].field_id)) {

                                                let [err, proceed, conditionStatus] = await evaluateJoinCondition(conditions[k], formData[l]);

                                                console.log('PROCEED : ', proceed);
                                                console.log('conditionStatus : ', conditionStatus);

                                                //Reached either EOJ or one of the conditions failed
                                                if(proceed === 0 || conditionStatus === 0) {
                                                    if(conditionStatus === 1){
                                                        error = false;
                                                        responseData.push({"message": "dependent form conditions passed!"});
                                                        console.log(`dependent form ${conditions[k].form_id} conditions passed!`);

                                                        breakFlag = 1;
                                                        break;
                                                    } else {
                                                        if(conditions[k].join_condition == 'OR') {
                                                            responseData.push({"message": "dependent form conditions failed!"});
                                                            console.log('As the condition is OR proceeding to check the next form');
                                                        } else {
                                                            responseData.push({"message": "dependent form conditions failed!"});
                                                            console.log(`dependent form ${conditions[k].form_id} conditions failed!`);

                                                            breakFlag = 1;
                                                            break;
                                                        }
                                                    }
                                                }
                                            } else {
                                                //responseData.push({"message": `${conditions[k].field_id} is not present in dependent form - ${conditions[k].form_id}`});
                                            }
                                        } //End of for Loop - retrieved dependent Form data
                                    }

                                    if(breakFlag === 1) {
                                        break;
                                    }
                                    console.log('----------------------------------');
                                    //} //End of for Loop - Conditions Array
                                } else {
                                    console.log('Dependent form ', conditions[k].form_id, ' is not submitted');
                                    if(conditions[k].join_condition == 'OR') {
                                        console.log('As the condition is OR proceeding to check the next form');
                                        continue;
                                    }
                                }
                            } catch (error) {
                                console.log("Fetch Dependent Form Data | Error: ", error);
                                throw new Error(error);
                            }
                        } //End of Conditions Array
                    } else { //If the form_enable form is different from the request.form_id
                        responseData.push({"message": `No Dependent forms for form_id - ${request.form_id}`});
                    }
                } // Looping on a Single Form
            } //Looping on all the bot_enabled forms
        } else {
            error = false;
            console.log('No Dependent Forms defined for this Form!');
            responseData.push({"message": "No Dependent Forms defined for this Form!"});
        }
        return [error, responseData];
    }

    this.dependedFormCheckV2 = async (request) => {
        let responseData = [],
            error = true, botsData, err;
        console.log('In dependedFormCheck Function', request)
        request.bot_operation_type_id = 20;
        botsData = request.botsData;

        let responseFlag = 0;
        if(botsData.length > 0) {
            let inlineData,tempFormsArr,conditions,dependentFormTransactionData;
            let i, j, k , l;

            for(i=0;i< botsData.length;i++) { //Looping on all bots_enabled forms in a given process

                inlineData = JSON.parse(botsData[i].bot_operation_inline_data);
                //console.log(inlineData.form_enable);

                tempFormsArr = inlineData.form_enable ? inlineData.form_enable : [];
                console.log('tempFormsArr : ', tempFormsArr);

                if(tempFormsArr.length == 0){
                    error = false;
                    responseFlag = 1;
                    console.log("No Dependent Forms defined for this Form!");
                }

                for(let j=0; j<tempFormsArr.length; j++) { //Looping on the each form
                    console.log(tempFormsArr[j].form_id);
                    conditions = tempFormsArr[j].conditions;

                        console.log('Conditions: ', conditions, tempFormsArr[j].form_id);

                    if(Number(request.form_id) === Number(tempFormsArr[j].form_id)) { //Checking for the given specific form

                        for(k=0;k<conditions.length;k++) { //Conditions Array
                            try {
                                //Check whether the dependent form is submitted
                                console.log(`Checking the dependent form - ${conditions[k].form_id}`)
                                dependentFormTransactionData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                                    organization_id: request.organization_id,
                                    account_id: request.account_id
                                }, Number(request.workflow_activity_id), conditions[k].form_id);

                                //console.log(`Dependent form  - ${conditions[k].form_id} length : ${Number(dependentFormTransactionData.length)}`);
                                if (Number(dependentFormTransactionData.length) > 0) {
                                    dependentFormTransactionInlineData = JSON.parse(dependentFormTransactionData[0].data_entity_inline);
                                    //console.log('FORM DATA : ', dependentFormTransactionInlineData.form_submitted);
                                    let formData = dependentFormTransactionInlineData.form_submitted;
                                    formData = (typeof formData === 'string')? JSON.parse(formData) : formData;
                                    let breakFlag = 0; //to break the outer loop

                                    //Iterate on form data
                                    //for(k=0;k<conditions.length;k++) { //Conditions Array

                                    if(!conditions[k].hasOwnProperty('field_id')) {
                                        if(conditions[k].join_condition == 'OR') {
                                            error = false;
                                            responseFlag = 1;
                                            console.log(`dependent form ${conditions[k].form_id} conditions passed!`);
                                            // responseData.push({"message": "dependent form conditions passed!"});
                                            break;
                                        } else if (conditions[k].join_condition == 'AND') {
                                            continue;
                                        } else { // EOJ
                                            error = false;
                                            responseFlag = 1;
                                            console.log(`dependent form ${conditions[k].form_id} conditions passed!`);
                                            // responseData.push({"message": "dependent form conditions passed!"});
                                            break;
                                        }
                                    } else {
                                        for(l=0;l<formData.length;l++){ //Iterate on the retrieved dependent Form Data
                                            //console.log(Number(conditions[k].field_id), ' - ', Number(formData[l].field_id), ' - ', formData[l].field_id);

                                            // if(Number(conditions[k].field_id) === Number(formData[l].field_id)) {

                                            let [err, proceed, conditionStatus] = await evaluateJoinCondition(conditions[k], formData[l]);

                                            console.log('PROCEED : ', proceed);
                                            console.log('conditionStatus : ', conditionStatus);

                                            //Reached either EOJ or one of the conditions failed
                                            if(proceed === 0 || conditionStatus === 0) {
                                                if(conditionStatus === 1){
                                                    error = false;
                                                    responseFlag = 1;
                                                    // responseData.push({"message": "dependent form conditions passed!"});
                                                    console.log(`dependent form ${conditions[k].form_id} conditions passed!`);

                                                    breakFlag = 1;
                                                    break;
                                                } else {
                                                    if(conditions[k].join_condition == 'OR') {
                                                        error = false;
                                                        responseFlag = 1;
                                                        responseData = 0;
                                                        console.log('As the condition is OR proceeding to check the next form');
                                                    } else {
                                                        error = false;
                                                        responseFlag = 1;
                                                        responseData = 0;
                                                        console.log(`dependent form ${conditions[k].form_id} conditions failed!`);
                                                        breakFlag = 1;
                                                        break;
                                                    }
                                                }
                                            }
                                            // } else {
                                            //     //responseData.push({"message": `${conditions[k].field_id} is not present in dependent form - ${conditions[k].form_id}`});
                                            // }
                                        } //End of for Loop - retrieved dependent Form data
                                    }

                                    if(breakFlag === 1) {
                                        break;
                                    }
                                    console.log('----------------------------------');
                                    //} //End of for Loop - Conditions Array
                                } else {
                                    console.log('Dependent form ', conditions[k].form_id, ' is not submitted');
                                    if(conditions[k].join_condition == 'OR') {
                                        console.log('As the condition is OR proceeding to check the next form');
                                        continue;
                                    }
                                }
                            } catch (error) {
                                console.log("Fetch Dependent Form Data | Error: ", error);
                                // throw new Error(error);
                            }
                        } //End of Conditions Array
                    } else { //If the form_enable form is different from the request.form_id
                        console.log(`No Dependent forms for form_id - ${request.form_id}`);
                    }
                } // Looping on a Single Form
            } //Looping on all the bot_enabled forms
        } else {
            error = false;
            responseFlag = 1;
            console.log('No Dependent Forms defined for this Form!');
        }
        return [error, responseFlag];
    }

    this.tagupdate = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.tag_id,
            request.tag_name,
            request.inline_data || '{}',
            request.asset_id,
            request.datetime_log || util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_tag_list_update', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;

                    //self.tagListHistoryInsert(request, 2003);
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.getAssetAccessDetails = async function (request) {
        let assetData = [],
            error = true
            responseData = [];

        const paramsArr = new Array(
            request.organization_id,
            request.target_account_id,
            request.target_workforce_id,
            request.desk_asset_id || 0,
            request.manager_asset_id || request.asset_id,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_v1_asset_access_mapping_select_asset_access_all', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    responseData.push(data);
                    error = false;
                    assetData = await self.getAssetUnderAManagerInaWorforce(request);
                    responseData.push(assetData);

                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };

    this.getAssetUnderAManagerInaWorforce = async function (request) {
        let assetData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.target_account_id,
            request.target_workforce_id,
            request.manager_asset_id || request.asset_id,
            request.flag,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_asset_manager_mapping_select_workforce', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    assetData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return assetData;
    };     
    
    
    async function evaluateJoinCondition(conditionData, formData, request) {
        let proceed,
            conditionStatus,
            error = false;

        console.log('formData in evaluateJoinCondition: ', formData);

        console.log("conditionData--->", conditionData);
        switch(Number(conditionData.data_type_id)) {
            case 5: let operation = conditionData.field_value_condition_operator;
                    let ifStatement;
                    
                    switch(operation) {
                        case '<=': ifStatement = Number(formData.field_value) <= (Number(conditionData.field_value_threshold)) ? true : false;
                                    break;
                        case '>=': ifStatement = Number(formData.field_value) >= (Number(conditionData.field_value_threshold)) ? true : false;
                                    break;
                        case '<' : ifStatement = Number(formData.field_value) > (Number(conditionData.field_value_threshold)) ? true : false;
                                    break;
                        case '>' : ifStatement = Number(formData.field_value) > (Number(conditionData.field_value_threshold)) ? true : false;
                                    break;
                        case '==': ifStatement = Number(formData.field_value) == (Number(conditionData.field_value_threshold)) ? true : false;
                                    break;
                        case '!=': ifStatement = Number(formData.field_value) != (Number(conditionData.field_value_threshold)) ? true : false;
                                    break;
                    }                    
    
                    if(ifStatement) {
                        //Condition Passed
                        let [err, response] = await evaluationJoinOperation(conditionData.join_condition);
                        //response: 0 EOJ
                        //response: 1 OR
                        //response: 2 AND
    
                        (response === 2)? proceed = 1:proceed = 0;
                        conditionStatus = 1;
                      } else {
                        //condition failed
                        proceed = 0;
                        conditionStatus = 0;
                      }
    
                    break;
    
            case 33 :if(Number(conditionData.field_selection_index) === Number(formData.data_type_combo_id)) {
                        //Condition Passed                        
                        let [err, response] = await evaluationJoinOperation(conditionData.join_condition);
                        //response: 0 EOJ
                        //response: 1 OR
                        //response: 2 AND
                    
                        (response === 2)? proceed = 1:proceed = 0;
                        conditionStatus = 1;
                      } else {
                        //condition failed                        
                        proceed = 0;
                        conditionStatus = 0;
                      }
    
                    break;

            case 71 : fieldValue = (typeof formData.field_value === 'string')? JSON.parse(formData.field_value) : formData.field_value;
                      console.log('fieldValue case 71: ', fieldValue);
                      
                      let childActivities = fieldValue.cart_items;
                      console.log('conditionData.flag_check_product : ', conditionData.flag_check_product);
                      if(Number(conditionData.flag_check_product) === 1) {
                        if(Number(conditionData.product_activity_id) === Number(fieldValue.product_activity_id)) {
                            
                            //Condition Passed
                            let [err, response] = await evaluationJoinOperation(conditionData.join_condition);
                            //response: 0 EOJ
                            //response: 1 OR
                            //response: 2 AND
                            
                            (response === 2)? proceed = 1:proceed = 0;
                            conditionStatus = 1;
                        } else {
                            //condition failed
                            proceed = 0;
                            conditionStatus = 0;    
                        }
                      } //If product_variant_activity_id = 1 and cart_items are empty
                      else if(Number(conditionData.product_variant_activity_id) === -1 && childActivities.length === 0) {
                      
                        //Condition Passed                
                        let [err, response] = await evaluationJoinOperation(conditionData.join_condition);
                        //response: 0 EOJ
                        //response: 1 OR
                        //response: 2 AND
                        
                        (response === 2)? proceed = 1:proceed = 0;
                        conditionStatus = 1;

                      } else {
                        
                        for(const i_iterator of childActivities) {                     
                            if(Number(conditionData.product_variant_activity_id) === Number(i_iterator.product_variant_activity_id)) {
                                //Condition Passed                
                                let [err, response] = await evaluationJoinOperation(conditionData.join_condition);
                                //response: 0 EOJ
                                //response: 1 OR
                                //response: 2 AND
                                
                                (response === 2)? proceed = 1:proceed = 0;
                                conditionStatus = 1;
                            } else {
                                //condition failed
                                proceed = 0;
                                conditionStatus = 0;    
                            }
                          }

                      }
                    break;
            }
        //} //IF field_value exists
        /*else {
            //If field id is not there obvously data_type_id also wont be there then
            //Check whether the given form is submitted or not
            try {
                let formTransactionData = await activityCommonService.getActivityTimelineTransactionByFormId713({
                    organization_id: request.organization_id,
                    account_id: request.account_id
                }, request.workflow_activity_id, formData.form_id);

                if (Number(formTransactionData.length) > 0) {                    
                    //formTransactionData = Number(formTransactionData[0].activity_type_id);
                    //formTransactionData = Number(formTransactionData[0].data_form_transaction_id);
                    //formTransactionData = Number(formTransactionData[0].data_activity_id);
                    let [err, response] = await evaluationJoinOperation(conditionData.join_condition);
                    //response: 0 EOJ
                    //response: 1 OR
                    //response: 2 AND
                    
                    (response === 2)? proceed = 1:proceed = 0;
                    conditionStatus = 1;             
                } else {
                    proceed = 0;
                    conditionStatus = 0;
                }
            } catch (err) {
                console.log('In Catch err: ', err);
                proceed = 0;
                conditionStatus = 0;
            }
        }*/

        //proceed = 1 means continue iterating
        //proceed = 0 means stop iterating

        //conditionStatus =1 means condition passed
        //conditionStatus =0 means condition failed
        return [error, proceed, conditionStatus];
    }

    async function evaluationJoinOperation(joinCondition){
        let responseData,
            error =false;

        console.log('joinCondition : ', joinCondition);        
        //responseData = 0 means stop
        //responseData = 1 means OR
        //responseData = 2 means AND

        if(joinCondition === 'OR') {
            responseData = 1;
        } else if(joinCondition === 'AND') {
            responseData = 2;
        } else if(joinCondition === 'EOJ') {
            responseData = 0;
        }

        return [error, responseData];
    }

    this.dependencyFormsCheck = async (request) => {
        let error = false, finalResponse = [];

        try{
            //console.log('Form ID List : ', request.form_id_list);
            let formList = JSON.parse(request.form_id_list);
            console.log('formList : ', formList);            
            //console.log('formList.lenght : ', formList.length);

            for(let counter = 0; counter < formList.length; counter++){
                let formJson = {};
                request.form_id = formList[counter];
                formJson.form_id = request.form_id; 
                if(!request.hasOwnProperty("flag")){
                    request.flag = 0;
                }
                if(request.flag==0){              
                let [err, responseData] = await self.dependedFormCheck(request);                
                if(!err){
                    formJson.isActive = true;
                }else{               
                    formJson.isActive = false;
                }
            }
            else{
                formJson.isActive = true;
            }
                finalResponse.push(formJson);
            }
        }catch(e){
            error = e;
            let formJson = {};
            console.log(e)
        }

        console.log('finalResponse : ', finalResponse);
        return [error, finalResponse];
    }

    async function addUser(username, pool_id) {
       // console.log('Adding ', pool_id);
        console.log('*******************');
        console.log('Adding : ', username);

        let userAttr = [];
      
        if(username.toString().indexOf('@') > -1) {
            userAttr.push({
                Name: 'email', /* required */
                Value: username
            },{
                Name : "email_verified",
                Value : "true"
            });
            
        } else {
            userAttr.push({
                Name: 'phone_number', /* required */
                Value: username
              });
        }


        let params = {
            UserPoolId: pool_id, //global.config.user_pool_id,
            Username: username,
            
            //TemporaryPassword: 'STRING_VALUE',
            UserAttributes: userAttr,
            MessageAction : "SUPPRESS"          
          };

        await new Promise((resolve, reject)=>{
            cognitoidentityserviceprovider.adminCreateUser(params, (err, data) => {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                } else {
                console.log(data);           // successful response
                }
    
                //After 5 seconds get the added user from cognito and add it to the redis layer
                console.log('Beofre setTimeout 5 Seconds');
                setTimeout(()=>{ getUser(username, pool_id) }, 5000);
                resolve();
            });
        });
    
        return "success";	  
    }

    async function removeUser(username, pool_id) {
        let params = {
            UserPoolId: pool_id, //global.config.user_pool_id,
            Username: username /* required */
          };
          cognitoidentityserviceprovider.adminDeleteUser(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.log(data);

                //Delete the user from Redis as well
                cacheWrapper.delUserNameCognito(username);
            } 
          });
    
        return "success";	  
    }

    this.formAccessSegmentOrgLevel =  async (request)=>{
        
        // get all th forms under the process
      const [formErr, workflowFormsData] = await adminListingService.workforceFormMappingSelectWorkflowForms(request);

        // get all the workforces under the given account
       const [workforceErr, workforceData] = await adminListingService.workforceListSelectWorkforceTypeAll(request);
       if(!(formErr && workforceErr)){
            if(workflowFormsData.length > 0 && workforceData.length > 0){
                workforceData.forEach(workforceEle => {
                    workflowFormsData.forEach(formEle => {
                        // execute form entity mapping
                        request.target_form_id = formEle.form_id;
                        request.sharing_workforce_id = workforceEle.workforce_id;
                        request.sharing_account_id = workforceEle.account_id;
                        self.formEntityMappingInsert(request);
                    })
                })
            }else{
                return [true,"formData or workforceData Length = 0"]
            }
       }else{
            return [true,"error in retrieving form data or workforce data"]
       }
        return [false,"success"];
    }

    this.formEntityMappingInsert = async (request)=> {
        let formEntityData = [],
            error = true;

            let paramsArr = new Array(
                request.target_form_id,
                request.level_id || 3,
                request.target_asset_id || 0,
                request.sharing_workforce_id,
                request.sharing_account_id,
                request.organization_id,
                request.log_asset_id || request.asset_id,
                util.getCurrentUTCTime()
            );
        const [dupErr,dupData] = await this.formEntityAccessCheck({...request,workforce_id:request.sharing_workforce_id,account_id:request.sharing_account_id})
        
        if(dupData.length>0){
            return [true,{message:"this form is shared already"}]
        }
        const queryString = util.getQueryString('ds_p1_1_form_entity_mapping_insert', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    formEntityData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error,formEntityData];
    };  

    this.formEntityAccessCheck = async function (request) {

        let fieldData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id||0,
            request.target_asset_id,
            request.target_form_id,
            request.flag||0
        );
        const queryString = util.getQueryString('ds_p1_form_entity_mapping_select_check', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    fieldData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, fieldData];
    };

    async function getUser(username, pool_id) {
        let params = {
            UserPoolId: pool_id, //global.config.user_pool_id,
            Username: username
          };
          cognitoidentityserviceprovider.adminGetUser(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.log('data : ', data.Username);
                let userAttributes = data.UserAttributes;
                
                for(const i_iterator of userAttributes) {
                    console.log("i_iterator.Name", i_iterator.Name)
                    if(i_iterator.Name === 'phone_number' || i_iterator.Name === 'email') {
                        console.log('Phone Number: ', i_iterator.Value);

                        cacheWrapper.setUserNameFromAccessToken(data.Username, i_iterator.Value);
                    }
                }
            }
          });

        return "success";
    }

    this.getStatusBasedPreRequisiteMetFormsListV1 = async (request) => {
        let responseData = [],
            error = true;

        //Get the forms list based on status
        let [err, statusBasedFormsList] = await getStatusBasedFormsV1(request);        

        if(err) {
            return [error, responseData];
        } else {
            error = false;
        }
        
        let form_id_list = [];
        console.log('statusBasedFormsList.length : ', statusBasedFormsList.length);

        if(statusBasedFormsList.length > 0) {            
            for(const i_iterator of statusBasedFormsList){
                form_id_list.push(i_iterator.form_id);

                let newReq = Object.assign({}, request);
                    //newReq.organization_id = 0;
                    newReq.form_id = i_iterator.form_id;
                    newReq.field_id = 0;
                    newReq.start_from = 0;
                    newReq.limit_value = 1;
                let [err1, data] = await activityCommonService.workforceFormFieldMappingSelect(newReq);
                //console.log('DATA : ', data);
                (data.length> 0 && data[0].next_field_id > 0) ? i_iterator.is_smart = 1 : i_iterator.is_smart = 0;
            }
            
            let newReq = Object.assign({}, request);
                newReq.form_id_list = JSON.stringify(form_id_list);
            let [err1, dependencyFormsList] = await this.dependencyFormsCheck(newReq);
            
            console.log('dependencyFormsList.length : ', dependencyFormsList.length);
            
            if(err1) {
                error = true;
                return [error, responseData];
            } else {
                error = false;
            }

            
            //Appending which form is delegated to whom?
            let activityData = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);
            console.log('activityData.length : ', activityData.length);

            if(activityData.length > 0) {
                console.log('activityData[0].activity_master_data : ', activityData[0].activity_master_data);
                let activityMasterData;
                let delegationData;

                if(activityData[0].activity_master_data !== null) {
                    activityMasterData = JSON.parse(activityData[0].activity_master_data);
                    delegationData = activityMasterData.form_fill_request;

                    console.log('delegationData : ', delegationData);
                    //console.log('Array.isArray(delegationData) : ', Array.isArray(delegationData));

                    if(Array.isArray(delegationData)) {
                        for(const i_iterator of delegationData) {
                            for(const j_iterator of statusBasedFormsList) {
                                //console.log(i_iterator.form_id , ' === ', j_iterator.form_id);
                                if(Number(i_iterator.form_id) === Number(j_iterator.form_id)) {
                                    (j_iterator.delegated_to_assests).push(i_iterator);
                                }
                            }                     
                        }
                    }
                }
            }// End of Appending

            let finalFormsList = [];
            for(const i_iterator of dependencyFormsList) {
                for(const j_iterator of statusBasedFormsList) {
                    if(Number(i_iterator.form_id) === Number(j_iterator.form_id) && (i_iterator.isActive)) {
                        finalFormsList.push(j_iterator);
                        break;
                    }
                }       
            }

            responseData = finalFormsList;
        }

        return [error, responseData];
    }
    this.getStatusBasedPreRequisiteMetFormsList = async (request) => {
        let responseData = [],
            error = true;

        //Get the forms list based on status
        let [err, statusBasedFormsList] = await getStatusBasedForms(request);        

        if(err) {
            return [error, responseData];
        } else {
            error = false;
        }
        
        let form_id_list = [];
        console.log('statusBasedFormsList.length : ', statusBasedFormsList.length);

        if(statusBasedFormsList.length > 0) {            
            for(const i_iterator of statusBasedFormsList){
                form_id_list.push(i_iterator.form_id);

                let newReq = Object.assign({}, request);
                    //newReq.organization_id = 0;
                    newReq.form_id = i_iterator.form_id;
                    newReq.field_id = 0;
                    newReq.start_from = 0;
                    newReq.limit_value = 1;
                let [err1, data] = await activityCommonService.workforceFormFieldMappingSelect(newReq);
                //console.log('DATA : ', data);
                (data.length> 0 && data[0].next_field_id > 0) ? i_iterator.is_smart = 1 : i_iterator.is_smart = 0;
            }
            
            let newReq = Object.assign({}, request);
                newReq.form_id_list = JSON.stringify(form_id_list);
            
            let [err1, dependencyFormsList] = await this.dependencyFormsCheck(newReq);
            
            
            console.log('dependencyFormsList.length : ', dependencyFormsList.length);
            
            if(err1) {
                error = true;
                return [error, responseData];
            } else {
                error = false;
            }

            
            //Appending which form is delegated to whom?
            let activityData = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);
            console.log('activityData.length : ', activityData.length);

            if(activityData.length > 0) {
                console.log('activityData[0].activity_master_data : ', activityData[0].activity_master_data);
                let activityMasterData;
                let delegationData;

                if(activityData[0].activity_master_data !== null) {
                    activityMasterData = JSON.parse(activityData[0].activity_master_data);
                    delegationData = activityMasterData.form_fill_request;

                    console.log('delegationData : ', delegationData);
                    //console.log('Array.isArray(delegationData) : ', Array.isArray(delegationData));

                    if(Array.isArray(delegationData)) {
                        for(const i_iterator of delegationData) {
                            for(const j_iterator of statusBasedFormsList) {
                                //console.log(i_iterator.form_id , ' === ', j_iterator.form_id);
                                if(Number(i_iterator.form_id) === Number(j_iterator.form_id)) {
                                    (j_iterator.delegated_to_assests).push(i_iterator);
                                }
                            }                     
                        }
                    }
                }
            }// End of Appending

            let finalFormsList = [];
            for(const i_iterator of dependencyFormsList) {
                for(const j_iterator of statusBasedFormsList) {
                    if(Number(i_iterator.form_id) === Number(j_iterator.form_id) && (i_iterator.isActive)) {
                        finalFormsList.push(j_iterator);
                        break;
                    }
                }       
            }

            responseData = finalFormsList;
        }

        return [error, responseData];
    }

    async function getStatusBasedFormsV1(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_status_id,
            request.start_from || 0,
            request.limit_value || 10,
            request.activity_type_id
        );
        //const queryString = util.getQueryString('ds_v1_workflow_form_status_mapping_select', paramsArr);
        const queryString = util.getQueryString('ds_v1_1_workforce_form_mapping_select_status', paramsArr); 

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    for(const i_iterator of data) {
                        i_iterator.delegated_to_assests = [];
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

    async function getStatusBasedForms(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_status_id,
            request.start_from || 0,
            request.limit_value || 10
        );
        //const queryString = util.getQueryString('ds_v1_workflow_form_status_mapping_select', paramsArr);
        const queryString = util.getQueryString('ds_v1_workforce_form_mapping_select_status', paramsArr); 

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    for(const i_iterator of data) {
                        i_iterator.delegated_to_assests = [];
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

    async function updateRoleINRoundRobinQueue(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.asset_type_id,
            request.desk_asset_id
        );
        const queryString = util.getQueryString('ds_v1_asset_list_update_asset_type_index', paramsArr); 

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

    this.formConverter = async (request) => {
        let responseData = [], response,
            error = true;
        
        [error, response] = await getFormConverterData(request);

        if(error){
            return [error, response];
        }
        return [error, responseData];
    }

    async function getFormConverterData(request){
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.form_id,
          request.form_submission_type_id,
          request.log_asset_id,
          request.log_datetime
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_update_submission_type', paramsArr);

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

    this.assetAccessMappingUpdateState = async function(request){
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.user_mapping_id,
            request.user_asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_access_mapping_update_access_reset', paramsArr);

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

    this.updateApprovalDetails = async function(request){
        let responseData = [],
        error = true;

    const paramsArr = new Array(
        request.asset_type_id,
        request.asset_type_name,
        request.asset_type_flag_enable_approval,
        request.asset_type_approval_max_levels,
        request.asset_type_approval_wait_duration,
        request.asset_type_approval_activity_type_id,
        request.asset_type_approval_activity_type_name,
        request.asset_type_attendance_type_id ,
        request.asset_type_attendance_type_name,
        request.asset_type_flag_enable_send_sms || 0,
        request.organization_id,
        1,
        util.getCurrentUTCTime(),
        request.asset_id,
        
    );
    const queryString = util.getQueryString('ds_p2_workforce_asset_type_mapping_update', paramsArr);

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

    this.getUsersByManger = async function(request){
        let responseData = [],
        error = true;

    const paramsArr = new Array(
        request.organization_id,
        request.manager_asset_id,
        request.flag,
        request.start_from,
        request.limit_value 
    );
    const queryString = util.getQueryString('ds_p1_asset_list_select_manager', paramsArr);

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

    this.addAssetAsLead = async function(request){
        let activityData = await activityCommonService.getActivityDetailsPromise(request, request.activity_id);
        console.log('activityData.length : ', activityData.length);
        if(activityData.length>0){
        request.activity_type_category_id = activityData[0].activity_type_category_id;
        request.activity_type_id = activityData[0].activity_type_id;
        request.organization_id = activityData[0].organization_id;
        request.account_id = activityData[0].account_id;
        request.workforce_id = activityData[0].workforce_id;
        try{
        await addParticipantasLead(request,request.activity_id,request.target_asset_id,request.target_asset_id);
        return [false,[]]
        }
        catch(e){
            console.log(e);
            return [true,[]]
        }
        }
        else{
            return [true,[]]
        }
    }

    // Role asset Mapping Insert
    async function roleAssetMappingInsert(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.asset_type_id,
            request.created_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_role_asset_mapping_insert', paramsArr);

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
        console.log("roleAssetMappingInsert : "+JSON.stringify(responseData,2,null));
        return [error, responseData];
    }

    
    // Update Organization name
    this.updateOrganizationName = async function(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.organization_name,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_organization_list_update_name', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    console.log("update organization name : response = ");
                    console.log(data);
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    return [error, responseData];
                })
        }
        return [error, responseData];
    }

    // Update Building name
    this.updateBuildingName = async function(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.account_name,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_account_list_update_name', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    console.log("update building name : response = ");
                    console.log(data);
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    return [error, responseData];
                })
        }
        return [error, responseData];
    }

    // Update Asset Manager mapping flag
    this.updateAssetManagerMappingFlag = async function(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.asset_id,
            request.manager_asset_id,
            request.flag_dotted_manager,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_manager_mapping_update_flag_dotted_manager', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    console.log("Update Asset Manager mapping flag : response = ");
                    console.log(data);
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    return [error, responseData];
                })
        }
        return [error, responseData];
    }

    this.selectBotOnField = async function(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.flag,
            request.form_id,
            request.field_id,
            request.data_type_combo_id,
            request.page_start || 0,
            util.replaceQueryLimit(request.page_limit)
        );
        const queryString = util.getQueryString('ds_p1_bot_operation_mapping_select_field', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    return [error, responseData];
                })
        }
        return [error, responseData];
    }

    // Account check for dotted manager
    this.accountCheckForDottedManager = async function(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.asset_id,
            request.activity_id,
            request.activity_creator_asset_id,
            request.flag
        );
        const queryString = util.getQueryString('ds_p1_asset_manager_mapping_select_dotted_manager_account', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    console.log("accountCheckForDottedManager : response = ");
                    console.log(data);
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    console.log("accountCheckForDottedManager : error response = ");
                    console.log(err);
                    return [error, responseData];
                })
        }
        return [error, responseData];
    }

    /*
    Message Brodcasting : on level wise.
    Following levels to be supported while sending the broadcast
    1. Org
    2. Building
    3. Workforce
    4. Role
    5. Asset
    6. Workforce Tag
    using following parameters:
    flag : 1 or 2 or 3 or 4 or 5
    
    if 1. Org then request parameters contains
        flag : 1
        organization_id:906

    if 2. Building then request parameters contains
        flag:2
        organization_id:906
        account_ids:[1023,1046]

    if 3. Workforce then request parameters contains
        flag:3
        organization_id:906
        account_id:1046
        workforce_ids:[5781,5782,5783,5784]

    if 4. Role then request parameters contains
        flag:4
        organization_id:906
        asset_type_ids:[5781,5782,5783,5784]

    if 5. Asset then request parameters contains
        flag:5
        organization_id:906
        asset_ids:[51606,51607,5783,5784]

    if 6. WorkforceTag then request parameters contains
        flag:6
        organization_id:868
        tag_type_category_id:2
        workforce_tag_ids:[184,185,186]

    Note : If flag coming as 1 means Org. It must be integer value.
    other wise all flag must be an array.
    */
    this.messageBroadCast = async function(request) {
        logger.info("messageBroadCast()=> request = " + JSON.stringify(request));
        let err = false, 
            broadcast_id = 0;
        
        request.isBroadMessageInsert = false;
    
        if (!request.hasOwnProperty("flag")) {
            logger.error("error = " + 'missing parameter : `flag`');
            return [true, 'missing parameter : `flag`'];
        }
        
        switch (Number(request.flag)) {
        case 1: {
            await this.sendPushNotificationL1(request);
        }
        break;
        case 2: {
            await this.sendPushNotificationL2(request);
        }
        break;
        case 3: {
            await this.sendPushNotificationL3(request);
        }
        break;
        case 4: {
            await this.sendPushNotificationL4(request);
        }
        break;
        case 5: {
            await this.sendPushNotificationL5(request);
        }
        break;
            case 6: {
                await this.sendPushNotificationL6(request);
            } break;
        default: {
            logger.error("error = " + 'missing parameter : `flag`');
            return [true, 'missing parameter : `flag`'];
        }
        }
    
        if (err) {
            logger.error("error = " + err);
            return [true, err];
        }
        return [false, []];
    };

    //------------------------------------------------------
    //L1 : Organization : Send Push Notification to all assets which comes under the organization.
    this.sendPushNotificationL1 = async function(request) {
        logger.info("sendPushNotificationL1() : Organization :=>" +
            " organization_id = " + request.organization_id);

        let page_start = 0,
            page_limit = 50,
            responseData = [],
            organization_id = request.organization_id;
    
        //find out account list for specified organization.
        let [error, accountsData] = await this.getAccountList(
            request,
            organization_id,
            page_start,
            page_limit
        );
        if (accountsData.length > 0) {
            let account_ids = [];
            // iterate account list
            for (let i = 0; i < accountsData.length; i++) {
                let account_id = accountsData[i].account_id;
                account_ids.push(account_id);
            }
            request.account_ids = JSON.stringify(account_ids);
    
            //L2 : Building : Send Push Notification to all assets which comes under the account.
            await this.sendPushNotificationL2(request);
        } else {
            logger.info(
                "account details not available for organization_id = " + organization_id
            );
        }

        accountsData = null;
    };

    //------------------------------------------------------
    //L2 : Building : Send Push Notification to all assets which comes under the account.
    this.sendPushNotificationL2 = async function(request) {
        logger.info("sendPushNotificationL2() : Building :=>" +
            " organization_id = " + request.organization_id +
            " account_ids = " + request.account_ids);
    
        let organization_id = request.organization_id;
        let account_ids = request.account_ids;
        account_ids = JSON.parse(account_ids);
    
        let page_start = 0,
            page_limit = 50;
    
        if (account_ids.length > 0) {
            // iterate account list
            for (let i = 0; i < account_ids.length; i++) {
                let account_id = account_ids[i];
    
                //L3 : find out workforce list for specified organization-account.
                let [error, workforceData] = await this.getWorkforceList(
                    request,
                    organization_id,
                    account_id,
                    page_start,
                    page_limit
                );
                if (workforceData.length > 0) {
                    let workforce_ids = [];
    
                    //iterate workforce list
                    for (let i = 0; i < workforceData.length; i++) {
                        let workforce_id = workforceData[i].workforce_id;
                        workforce_ids.push(workforce_id);
                    }
    
                    request.workforce_ids = JSON.stringify(workforce_ids);
                    request.account_id = account_id;
    
                    //L3 : Workforce : Send Push Notification to all assets which comes under the workforce.
                    await this.sendPushNotificationL3(request);
                } else {
                    logger.info(
                        "workforce details not available for organization_id = " + organization_id + ", account_id = " + account_id
                    );
                }
                workforceData = null;
            }
            account_ids = null;
        } else {
            logger.info("Missing parameter : account_ids\n");
        }
    };

    //------------------------------------------------------
    //L3 : Workforce : Send Push Notification to all assets which comes under the workforce.
    this.sendPushNotificationL3 = async function(request) {
        logger.info("sendPushNotificationL3() : Workforce : =>" +
            " organization_id = " + request.organization_id +
            " account_id = " + request.account_id +
            " workforce_ids = " + request.workforce_ids);
        
        let workforce_ids = request.workforce_ids;
        
        workforce_ids = JSON.parse(workforce_ids);
    
        if (workforce_ids.length > 0) {
            request.page_start = 0;
            request.page_limit = 500;
            
            //iterate workforce list
            for (let i = 0; i < workforce_ids.length; i++) {
                let workforce_id = workforce_ids[i];
                request.target_workforce_id = workforce_id;
    
                //L5 : find out asset list for specified organization-account-workforce.
               let [error, assetsData] = await activityCommonService.getLinkedAssetsInWorkforceV1(request);
                if (assetsData.length > 0) {
                    //send push notification to each asset
                    await this.sendPushNotificationsToAssets(request, assetsData);
                } else {
                    logger.info(
                        "asset details not available for" +
                        " organization_id = " + request.organization_id +
                        " account_id = " + request.account_id +
                        " workforce_id = " + workforce_id +
                        "\n"
                    );
                }
            }
        } else {
            logger.info("Missing parameter : workforce_ids\n");
        }
    };

    //------------------------------------------------------
    //L4 : Role : Send Push Notification to all assets which comes under the asset_type.
    this.sendPushNotificationL4 = async function(request) {
        logger.info("sendPushNotificationL4() : Role : =>" +
            " organization_id = " + request.organization_id +
            " asset_type_ids = " + request.asset_type_ids);
        let organization_id = request.organization_id;
        let asset_type_ids = request.asset_type_ids;
        asset_type_ids = JSON.parse(asset_type_ids);
    
        let page_start = 0,
            page_limit = 100,
            responseData = [];
    
        if (asset_type_ids.length > 0) {
            //iterate asset_type_ids list
            for (let i = 0; i < asset_type_ids.length; i++) {
                let asset_type_id = asset_type_ids[i];
    
                //L5 : find out asset list for specified organization-account-workforce-asset_type.
                let [error, assetsData] = await this.getAssetListByUsingAssetTypeId(
                    request,
                    organization_id,
                    asset_type_id,
                    page_start,
                    page_limit
                );
                if (assetsData.length > 0) {
                    let asset_ids = [];
                    //send push notification to each asset
                    for (let i = 0; i < assetsData.length; i++) {
                        asset_ids.push(assetsData[i].asset_id);
                    }
    
                    request.asset_ids = JSON.stringify(asset_ids);
    
                    //L5 : Asset : Send Push Notification to all assets.
                    await this.sendPushNotificationL5(request, assetsData);
                } else {
                    logger.info(
                        "asset details not available for organization_id = " + organization_id + " and asset_type_id = " + asset_type_id + "\n"
                    );
                }
            }
        } else {
            logger.info("Missing parameter : asset_type_ids\n");
        }
    };

    //------------------------------------------------------
    //L5 : Asset : Send Push Notification to all assets.
    this.sendPushNotificationL5 = async function(request) {
        logger.info("sendPushNotificationL5() : Asset : =>" +
            " organization_id = " + request.organization_id +
            " asset_ids = " + request.asset_ids);
        let organization_id = request.organization_id;
        let asset_ids = request.asset_ids;
        asset_ids = JSON.parse(asset_ids);
        let page_start = 0,
            page_limit = 50,
            responseData = [];
    
        if (asset_ids.length > 0) {
            //iterate asset_ids list
            for (let i = 0; i < asset_ids.length; i++) {
                let asset_id = asset_ids[i];
    
                //find out asset details for specified organization-asset_ids.
                let [error, assetsData] = await activityCommonService.getAssetDetailsAsync({
                    organization_id: organization_id,
                    asset_id: asset_id,
                });
                if (assetsData.length > 0) {
                    //send push notification to each asset
                    await this.sendPushNotificationsToAssets(request, assetsData);
                } else {
                    logger.info(
                        "asset details not available for organization_id = " + organization_id + " and asset_id = " + asset_id + "\n"
                    );
                }
            }
        } else {
            logger.info("Missing parameter : asset_ids\n");
        }
    };
    //------------------------------------------------------

    //L6 : Workforce_Tag : Send Push Notification to all workforces which comes under the workforce tag.
    this.sendPushNotificationL6 = async function (request) {
        logger.info("sendPushNotificationL6() : WorkforceTag :=>" +
            " organization_id = " + request.organization_id
            + " tag_type_category_id = " + request.tag_type_category_id
            + " workforce_tag_ids = " + request.workforce_tag_ids);

        let organization_id = request.organization_id;

        let workforce_tag_ids = request.workforce_tag_ids;

        workforce_tag_ids = JSON.parse(workforce_tag_ids);

        if (workforce_tag_ids.length > 0) {
            request.page_start = 0;
            request.page_limit = 500;

            //iterate workforce tag list
            for (let i = 0; i < workforce_tag_ids.length; i++) {

                request.tag_id = workforce_tag_ids[i];

                //find out workforce list for specified tag.
                let [error, resultData] = await this.getListOfWorkforcesUnderWorkforceTag(request);
                if (resultData.length > 0) {
                    let workforce_ids = [];
                    // iterate workforce list
                    for (let i = 0; i < resultData.length; i++) {
                        let workforce_id = resultData[i].workforce_id;
                        workforce_ids.push(workforce_id);
                    }
                    request.workforce_ids = JSON.stringify(workforce_ids);
                    request.account_id = 0;
                    //L3 : Workforce : Send Push Notification to all assets which comes under the Workforce.
                    await this.sendPushNotificationL3(request);
                } else {
                    logger.info(
                        "workforce tag details not available for organization_id = " + organization_id
                    );
                };
            }
        } else {
            logger.info("Missing parameter : workforce_tag_ids\n");
        }

    };

    //------------------------------------------------------
    // send push notification to all list of assets.
    this.sendPushNotificationsToAssets = async function(request, assetsData) {
        
        for (let i = 0; i < assetsData.length; i++) {
    
            if(!request.isBroadMessageInsert) {

                //inserting 
                let [err, broadcast_id] = await this.storeBroadCastMessage(request);
                if (!err) {

                    request.isBroadMessageInsert = true;
                    if(request.is_send_push == 1) {
                        await this.sendPubNubNotification(request);
                    } else {
                        logger.info("is_send_push = " + request.is_send_push + " : Hence no pubnub Push");
                    }
                    await this.sendNotificationAsset(request, assetsData[i]);
                }
            } else {
                await this.sendNotificationAsset(request, assetsData[i]);
            }
            logger.info("\n");
        }
    };

    //send notification
    this.sendNotificationAsset = async function(request, assetsData) {
        //Store the broadcast message for each user (asset).
        let [err, responseAssetData] = await this.storeBroadCastMessageForEachAsset(
            request,
            request.broadcast_id,
            assetsData.asset_id,
            request.asset_id);
        if (!err) {

            if(responseAssetData[0].is_send_push == 1 && request.is_send_push == 1) {
                request.target_asset_id = assetsData.asset_id;
                request.asset_push_arn = assetsData.asset_push_arn;
                request.message = request.broadcast_content;
                request.push_title = request.broadcast_subject;
                request.push_message = request.broadcast_content;
                //sending push message to asset.
                let [error, responseData] = await util.sendPushToAsset(request);
                if (error) {
                    logger.error("error : target_asset_id = " + request.target_asset_id + " : error message : " + JSON.stringify(responseData));
                }
            }else{
                logger.info("is_send_push = " + responseAssetData[0].is_send_push+" : Hence no Push");
            }

        } else {
            logger.info("error : target_asset_id = " + request.target_asset_id + " : error message : " + JSON.stringify(responseData));
        }

        assetsData = null;

        return [false, []];
    }

    //------------------------------------------------------
    //get list of all accounts for the requested organization_id
    this.getAccountList = async function(
        request,
        organization_id,
        page_start,
        page_limit
    ) {
        logger.info("getAccountList() :=> : " +
            "organization_id = " + organization_id);
    
        let error = false,
            responseData = [];
        try {
            let paramsArr = new Array(organization_id, page_start, page_limit);
            let queryString = util.getQueryString(
                "ds_p1_account_list_select_organization",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        responseData = data;
                        logger.info("account list size = " + responseData.length);
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("getAccountList : query : Error " + err);
                    });
            }
        } catch (err) {
            error = err;
            logger.error("getAccountList : Error " + err);
        }
    
        return [error, responseData];
    };

    //------------------------------------------------------
    //get list of workforces for the requested account_id
    this.getWorkforceList = async function(
        request,
        organization_id,
        account_id,
        page_start,
        page_limit
    ) {
        logger.info("getWorkforceList()=> : " +
            "organization_id = " + organization_id +
            " account_id = " + account_id);
        let error = false,
            responseData = [];
        try {
            let paramsArr = new Array(
                organization_id,
                account_id,
                page_start,
                page_limit
            );
            let queryString = util.getQueryString(
                "ds_v1_workforce_list_select_account",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        responseData = data;
                        logger.info("workforce list size = " + responseData.length);
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("getWorkforceList : query : Error " + err);
                    });
            }
        } catch (err) {
            logger.error("getWorkforceList : Error " + err);
        }
    
        return [error, responseData];
    };

    //------------------------------------------------------
    //get asset list for provided asset_type_ids
    this.getAssetListByUsingAssetTypeId = async function(
        request,
        organization_id,
        asset_type_id,
        page_start,
        page_limit
    ) {
        logger.info("getAssetListByUsingAssetTypeId()=> : " +
            "organization_id = " + organization_id +
            " asset_type_id = " + asset_type_id);
        let error = false,
            responseData = [];
        try {
            let paramsArr = new Array(
                organization_id,
                asset_type_id,
                page_start,
                page_limit
            );
            let queryString = util.getQueryString(
                "ds_p1_asset_list_select_asset_type",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        responseData = data;
                        logger.info("asset list size  = " + responseData.length);
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_asset_list_select_asset_type : query : Error " + err);
                    });
            }
        } catch (err) {
            logger.error("getAssetListByUsingAssetTypeId : Error " + err);
        }
    
        return [error, responseData];
    };

    //----------------------------------------------
    //Store the broadcast message.
    this.storeBroadCastMessage = async function(request) {
        let error = false,
            broadcast_id = 0,
            broadcast_level = 0,
            broadcast_level_name = '';

        switch(Number(request.flag)) {
            case 1: {
                broadcast_level = 1;
                broadcast_level_name = 'Organization';
            }
            break;
            case 2: {
                broadcast_level = 2;
                broadcast_level_name = 'Building';
            }
            break;
            case 3: {
                broadcast_level = 3;
                broadcast_level_name = 'Workforce';
            }
            break;
            case 4: {
                broadcast_level = 4;
                broadcast_level_name = 'Role';
            }
            break;
            case 5: {
                broadcast_level = 5;
                broadcast_level_name = 'Asset';
            }
            break;
            case 6: {
                broadcast_level = 26;
                broadcast_level_name = 'WorkforceTag';
            }
                break;
        }
    
        try {
            let paramsArr = new Array(
                request.broadcast_name || '',
                request.broadcast_subject,
                request.broadcast_content,
                JSON.stringify({
                    "level": broadcast_level,
                    "level_name": broadcast_level_name,
                    "entity_level_mapping":request.entity_level_mapping || "{}",
                    "level_mappings": {asset_ids:request.asset_ids?request.asset_ids:[],
                        workforce_ids:request.workforce_ids?request.workforce_ids:[],
                        account_ids:request.account_ids?request.account_ids:[],
                        workforce_tag_ids:request.workforce_tag_ids?request.workforce_tag_ids:[],
                        asset_type_ids:request.asset_type_ids?request.asset_type_ids:[]
                        }
                }),
                request.organization_id,
                request.asset_id,
                util.getCurrentUTCTime()
            );
            let queryString = util.getQueryString("ds_p1_broadcast_list_insert", paramsArr);
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        broadcast_id = data[0].broadcast_id;
                        request.broadcast_id = data[0].broadcast_id;
                        request.is_send_push = data[0].is_send_push;
                        logger.info("broadcast_id = " + request.broadcast_id + " is_send_push = " + data[0].is_send_push);
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("storeBroadCastMessage : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("storeBroadCastMessage : Error " + err);
        }
    
        return [error, broadcast_id];
    }

    //send pubnub notification.
    this.sendPubNubNotification = async function (request) {
        
        request.push_title = request.broadcast_subject;
        request.push_message = request.broadcast_content;

        switch(Number(request.flag)) {
            case 1: {
                await util.sendPushToEntity(request);
            }
            break;
            case 2: {
                //Account
                let account_ids = request.account_ids;
                account_ids = JSON.parse(account_ids);
            
                if (account_ids.length > 0) {
                    // iterate account list
                    for (let i = 0; i < account_ids.length; i++) {
                        request.target_account_id = account_ids[i];
                        await util.sendPushToEntity(request);
                    }
                }
            }
            break;
            case 3: {
                //WorkForce
                let workforce_ids = request.workforce_ids;
                workforce_ids = JSON.parse(workforce_ids);
            
                if (workforce_ids.length > 0) {
                    // iterate workforce list
                    for (let i = 0; i < workforce_ids.length; i++) {
                        request.target_workforce_id = workforce_ids[i];
                        await util.sendPushToEntity(request);
                    }
                }
            }
            break;
            case 4: {
                //Role
                let asset_type_ids = request.asset_type_ids;
                asset_type_ids = JSON.parse(asset_type_ids);
            
                if (asset_type_ids.length > 0) {
                    // iterate asset_type list
                    for (let i = 0; i < asset_type_ids.length; i++) {
                        request.target_asset_type_id = asset_type_ids[i];
                        await util.sendPushToEntity(request);
                    }
                }
            }
            break;
            case 5: {
                //Asset
                let asset_ids = request.asset_ids;
                asset_ids = JSON.parse(asset_ids);
            
                if (asset_ids.length > 0) {
                    // iterate asset list
                    for (let i = 0; i < asset_ids.length; i++) {
                        request.target_asset_id = asset_ids[i];
                        await util.sendPushToEntity(request);
                    }
                }
            }
            break;
            case 6: {
                //WorkforceTag
                let workforce_tag_ids = request.workforce_tag_ids;
                workforce_tag_ids = JSON.parse(workforce_tag_ids);

                if (workforce_tag_ids.length > 0) {
                    // iterate workforce tag list
                    for (let i = 0; i < workforce_tag_ids.length; i++) {
                        request.target_workforce_tag_id = workforce_tag_ids[i];
                        await util.sendPushToEntity(request);
                    }
                }
            }
                break;
        }
        return [false, []];
    }

    //----------------------------------------------
    //Store the broadcast message for each user (asset).
    this.storeBroadCastMessageForEachAsset = async function(
        request,
        broadcast_id,
        asset_id,
        log_asset_id) {
    
        let error = true,
            responseData = [];
    
        try {
            let paramsArr = new Array(
                broadcast_id,
                asset_id,
                log_asset_id,
                util.getCurrentUTCTime()
            );
            let queryString = util.getQueryString("ds_p1_broadcast_transaction_insert",paramsArr);
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        logger.info("broadcast_id = " + request.broadcast_id + " broadcast_txn_id = " + data[0].broadcast_txn_id);
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_broadcast_transaction_insert : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("storeBroadCastMessageForEachAsset : Error " + err);
        }
    
        return [error, responseData];
    }

    //----------------------------------------------
    //Select the list of broadcast messages.
    this.getBroadCardList = async function(request) {
        logger.info("getBroadCardList: request : " + JSON.stringify(request));
    
        let error = false,
            responseData = [];
    
        try {
            let paramsArr = new Array(
                request.organization_id,
                request.start_from,
                request.limit_value
            );
            let queryString = util.getQueryString(
                "ds_p1_broadcast_list_select",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        responseData = data;
                        logger.info("ds_p1_broadcast_list_select : response");
                        logger.info("list size = " + responseData.length);
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_broadcast_list_select : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("getBroadCardList : Error " + err);
        }
    
        return [error, responseData];
    }

    //----------------------------------------------
    //Get the count who have read/unread the broadcast messages.
    this.getAssetCountWhoReadUnReadBroadMessage = async function(request) {
        logger.info("getAssetCountWhoReadUnReadBroadMessage: request : " + JSON.stringify(request));
    
        let error = false,
            responseData = [];
    
        try {
            let paramsArr = new Array(
                request.broadcast_id,
                request.organization_id
            );
            let queryString = util.getQueryString(
                "ds_p1_broadcast_transaction_select_count",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        responseData = data;
                        logger.info("ds_p1_broadcast_transaction_select_count : response : ");
                        logger.info(JSON.stringify(responseData));
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_broadcast_transaction_select_count : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("getAssetCountWhoReadUnReadBroadMessage : Error " + err);
        }
    
        return [error, responseData];
    }

    //----------------------------------------------
    //Get the list of user(asset) who have read / unread the broadcast message.
    this.getListOfAssetsWhoReadUnReadBroadMessage = async function(request) {
        logger.info("getListOfAssetsWhoReadUnReadBroadMessage: request : " + JSON.stringify(request));
    
        let error = false,
            responseData = [];
    
        try {
            let paramsArr = new Array(
                request.organization_id,
                request.broadcast_id,
                request.broadcast_flag,
                request.start_from,
                request.limit_value
            );
            let queryString = util.getQueryString(
                "ds_p1_broadcast_transaction_select",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        responseData = data;
                        logger.info("ds_p1_broadcast_transaction_select : response : ");
                        logger.info("asset list size = " + responseData.length);
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_broadcast_transaction_select : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("getListOfAssetsWhoReadUnReadBroadMessage : Error " + err);
        }
    
        return [error, responseData];
    }

    //----------------------------------------------
    //Update broadcast_flag_read for an asset.
    this.updateBroadCastMessageFlagForEachAsset = async function(request) {
        logger.info("updateBroadCastMessageFlagForEachAsset: request : " + JSON.stringify(request));
    
        let error = false,
            responseData = [];
    
        try {
            let paramsArr = new Array(
                request.broadcast_id,
                request.asset_id,
                request.broadcast_flag_read,
                util.getCurrentUTCTime()
            );
            let queryString = util.getQueryString(
                "ds_p1_broadcast_transaction_update_flag_read",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        logger.info("ds_p1_broadcast_transaction_update_flag_read : query : response :");
                        logger.info(responseData);
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_broadcast_transaction_update_flag_read : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("updateBroadCastMessageFlagForEachAsset : Error " + err);
        }
    
        return [error, responseData];
    }

    //----------------------------------------------
    //get All/Read/UnRead/Archive BroadCast Message For Asset
    this.getAllReadUnReadArchiveBroadCastMessageForAsset = async function(request) {
        logger.info("getAllReadUnReadArchiveBroadCastMessageForAsset: request : " + JSON.stringify(request));
    
        let error = false,
            responseData = [];
    
        try {
            let paramsArr = new Array(
                request.organization_id,
                request.asset_id,
                request.flag,
                request.start_from,
                request.limit_value
            );
            let queryString = util.getQueryString(
                "ds_p1_broadcast_transaction_select_asset",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_broadcast_transaction_select_asset : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("getAllReadUnReadArchiveBroadCastMessageForAsset : Error " + err);
        }
    
        return [error, responseData];
    }

    //getAdminAssetMappedList

    this.getAdminAssetMappedList = async function(request) {
        logger.info("getAdminAssetMappedList: request : " + JSON.stringify(request));
    
        let error = false,
            responseData = [];
    
        try {
            let paramsArr = new Array(
                request.asset_id,
                request.flag||0,
                request.organization_id,
                request.start_from||0,
                request.limit_value||50
            );
            let queryString = util.getQueryString(
                "ds_p1_activity_asset_search_mapping_select_asset",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(1, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_activity_asset_search_mapping_select_asset : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("getAdminAssetMappedList : Error " + err);
        }
    
        return [error, responseData];
    }

    this.updateOrganizationFormTagFlag = async function(request) {
        logger.info("updateOrganizationFormTagFlag: request : " + JSON.stringify(request));
    
        let error = false,
            responseData = [];
    
        try {
            let paramsArr = new Array(
                request.organization_id,
                request.org_enterprise_feature_data,
                request.flag_email,
                request.flag_doc_repo,
                request.flag_ent_features,
                request.flag_ai_bot,
                request.flag_manager_proxy, 
                request.flag_enable_form_tag, 
                util.getCurrentUTCTime()
            );
            let queryString = util.getQueryString(
                "ds_p1_1_organization_list_update_flags",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_activity_asset_search_mapping_select_asset : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("updateOrganizationFormTagFlag : Error " + err);
        }
    
        return [error, responseData];
    }

    this.updateOrganizationFormTagFlagV1 = async function(request) {
        logger.info("updateOrganizationFormTagFlag: request : " + JSON.stringify(request));
    
        let error = false,
            responseData = [];
    
        try {
            let paramsArr = new Array(
              request.organization_id,
              request.org_enterprise_feature_data,
              request.flag_email,
              request.flag_doc_repo,
              request.flag_ent_features,
              request.flag_ai_bot,
              request.flag_manager_proxy,
              request.flag_enable_form_tag,
              request.flag_enable_sip_module,
              request.flag_enable_elasticsearch,
              request.log_asset_id,
              util.getCurrentUTCTime()
            );
            let queryString = util.getQueryString(
                "ds_p1_1_organization_list_update_flags",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_activity_asset_search_mapping_select_asset : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("updateOrganizationFormTagFlag : Error " + err);
        }
    
        return [error, responseData];
    }

    this.addUsersToCognitoManual = async function(request) {
        let error = false,
            responseData = [];
        try{
            //Add the number to Cognito
            if(request.is_mobile_add == 1) {
                await addUser('+' + request.country_code +''+request.phone_number, global.config.user_pool_id);
                await addUser('+' + request.country_code +''+request.phone_number, global.config.customer_pool_id);
            }
            else if(request.is_web_add == 1)
                await addUser('+' + request.country_code +''+request.phone_number, global.config.user_web_pool_id);
            else if(request.is_mobile_remove == 1) {
                await removeUser('+' + request.country_code +''+request.phone_number, global.config.user_pool_id);
                await removeUser('+' + request.country_code +''+request.phone_number, global.config.customer_pool_id);
            }
            else if(request.is_web_remove == 1)
                await removeUser('+' + request.country_code +''+request.phone_number, global.config.user_web_pool_id);
            else if(request.is_email_add == 1){   
                await addUser(request.email, global.config.user_web_pool_id);
                await addUser(request.email, global.config.customer_pool_id);
            }
            else if(request.is_email_remove == 1){
                await removeUser(request.email, global.config.user_web_pool_id);
                await removeUser(request.email, global.config.customer_pool_id);
            }

        } catch (err) {
            logger.error("addUsersToCognitoManual : Error " + err);
        }

        return[error, responseData];
    }

    this.typeMappingUpdateFlagDraft = async function(request){
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_activity_type_id BIGINT(20), IN p_flag_enable_draft TINYINT(4), IN p_log_asset_id BIGINT(20), 
        // IN p_log_datetime DATETIME

        logger.info("typeMappingUpdateFlagDraft: request : " + JSON.stringify(request));
    
        let error = false,
            responseData = [];

        try {
            let paramsArr = new Array(      
                request.organization_id,      
                request.account_id,                 
                request.workforce_id,
                request.activity_type_id,
                request.flag_enable_draft,
                request.log_asset_id,
                util.getCurrentUTCTime()
            );

            let queryString = util.getQueryString(
                "ds_p1_workforce_activity_type_mapping_update_flag_draft",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_workforce_activity_type_mapping_update_flag_draft : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("typeMappingUpdateFlagDraft : Error " + err);
        }
    
        return [error, responseData];
    }

    this.updatePreviewEnabledFlag = async function(request){
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_activity_type_id BIGINT(20), IN p_flag_enable_draft TINYINT(4), IN p_log_asset_id BIGINT(20), 
        // IN p_log_datetime DATETIME

        logger.info("updatePreviewEnabledFlag: request : " + JSON.stringify(request));
    
        let error = false,
            responseData = [];

        try {
            let paramsArr = new Array(      
                request.field_id,      
                request.form_id,                 
                request.organization_id,
                request.field_preview_enabled,
                request.log_asset_id,
                util.getCurrentUTCTime()
            );

            let queryString = util.getQueryString(
                "ds_p1_workforce_form_field_mapping_update_preview_enabled",
                paramsArr
            );
    
            if (queryString != "") {
                await db
                    .executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                        logger.error("ds_p1_workforce_form_field_mapping_update_preview_enabled : query : Error " + error);
                    });
            }
        } catch (err) {
            logger.error("updatePreviewEnabledFlag : Error " + err);
        }
    
        return [error, responseData];
    }

    // To get the list of tags under category
    this.getListOfTagsUnderCategory = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_category_id,
            request.flag,
            request.start_from,
            request.limit_value
        );

        const queryString = util.getQueryString('ds_v1_tag_entity_mapping_select_tags_category', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    console.log("getListOfTagsUnderCategory : response = ");
                    console.log(data);
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    console.log("getListOfTagsUnderCategory : error response = ");
                    console.log(err);
                    return [error, responseData];
                })
        }
        return [error, responseData];
    }

    //To get the list of workforces under a workforce tag.
    this.getListOfWorkforcesUnderWorkforceTag = async function (request) {
        let responseData = [],
            error = true;

        request.start_from = 0;
        request.limit_value = 500;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_category_id,
            request.tag_id,
            request.flag,
            request.start_from,
            request.limit_value
        );

        const queryString = util.getQueryString('ds_v1_tag_entity_mapping_select_entities', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    console.log("getListOfWorkforcesUnderWorkforceTag : response = ");
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    console.log("getListOfWorkforcesUnderWorkforceTag : error response = ");
                    console.log(err);
                    return [error, responseData];
                })
        }
        return [error, responseData];
    }

    async function triggerESMSIntegrationsService(request = {}, options = {}) {
        logger.silly("ESMS Integrations User service trigger request : %j", request);
        let esmsIntegrationsTopicName = global.config.ESMS_INTEGRATIONS_TOPIC || "";

        try {
            if (esmsIntegrationsTopicName === "") { throw new Error("EsmsIntegrationsTopicNotDefinedForMode"); }

            await queueWrapper.raiseActivityEventToTopicPromise({
                type: "VIL_ESMS_IBMMQ_INTEGRATION",
                trigger_form_id: options.request_type,
                payload: request
            }, esmsIntegrationsTopicName, 0);
        } catch (error) {
            logger.error("[ESMS Integrations User service trigger] Error ", { type: 'user_creation', error: serializeError(error), request_body: request });
        }
    }
    
    this.assetTypeAccessMappingSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_type_id,
            request.access_level_id,
            request.workforce_id,
            request.account_id,
            request.organization_id
        );

        const queryString = util.getQueryString('ds_p1_asset_type_access_mapping_select', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    return [error, responseData];
                })
        }
        return [error, responseData];
    } 

    this.assetTypeAccessMappingDelete = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.asset_type_id,
          request.access_level_id,
          request.workforce_id,
          request.workforce_tag_id,
          request.account_id,
          request.organization_id,
          request.asset_id,
          util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_1_asset_type_access_mapping_delete', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    assetTypeAccessHistoryInsert(request,3702)
                })
                .catch((err) => {
                    error = err;
                    return [error, responseData];
                })
        }
        return [error, responseData];
    } 

    async function assetTypeAccessHistoryInsert(request,update_id){
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.access_level_id,
            update_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_asset_type_access_mapping_history_insert', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                    return [error, responseData];
                })
        }
        return [error, responseData];
    }
    
    this.organizationFilterTagTypeMappingInsert = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.tag_type_filter_label,
            request.tag_type_filter_name,
            request.tag_type_filter_options,
            request.tag_type_id,
            request.filter_id,
            request.filter_name,
            request.filter_type_id,
            request.filter_sequence_id,
            request.filter_inline_data,
            request.filter_access_flag,
            request.filter_dynamic_enabled,
            request.filter_dynamic_sequence_id,
            request.target_activity_type_id, 
            request.target_tag_type_id, 
            request.target_activity_status_type_id,
            request.target_asset_category_id,
            request.target_asset_type_id,
            request.organization_id, 
            request.log_asset_id, 
            request.log_datetime
        );
        const queryString = util.getQueryString('ds_p2_organization_filter_tag_type_mapping_insert', paramsArr);

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
    
    this.organizationFilterTagTypeMappingDelete = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.tag_type_mapping_id ,
            request.log_asset_id , 
            request.log_datetime 
        );
        const queryString = util.getQueryString('ds_p1_organization_filter_tag_type_mapping_delete', paramsArr);

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

    this.organizationFilterTagTypeMappingUpdate = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id , 
            request.tag_type_mapping_id ,
            request.tag_type_filter_label , 
            request.filter_sequence_id ,
            request.filter_dynamic_sequence_id ,
            request.log_asset_id , 
            request.log_datetime
        );
        const queryString = util.getQueryString('ds_p1_organization_filter_tag_type_mapping_update', paramsArr);

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

    this.getOrganizationFilterTagTypeMapping  = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.tag_type_id, 
            request.is_export, 
            request.report_type_id, 
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_v1_2_organization_filter_tag_type_mapping_select', paramsArr);

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

    this.applicationTagTypeMappingInsert  = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.application_id,
            request.tag_type_id,
            request.activity_type_category_id,
            request.index_value,
            request.is_export_enabled,
            request.is_dashboard_enabled,
            request.log_datetime         
            );
        const queryString = util.getQueryString('ds_v1_application_tag_type_mapping_insert', paramsArr);

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
    
    this.applicationMasterInsert  = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.application_name,
          request.application_visibility_enabled,
          request.application_label_name,
          request.tag_type_label_name,
          request.organization_id,
          util.getCurrentUTCTime(),
          request.sequence_id
        );
        const queryString = util.getQueryString('ds_p1_application_master_insert', paramsArr);

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
    

    this.applicationMasterSelect  = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id        
            );
        const queryString = util.getQueryString('ds_v1_application_master_select', paramsArr);

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

    this.applicationMasterDelete  = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.application_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()      
            );
        const queryString = util.getQueryString('ds_v1_application_master_delete', paramsArr);

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


    this.assetTypeAccessMappingInsert  = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.asset_type_id,
          request.access_level_id || 0,
          request.access_type_id || 0,
          request.activity_type_id || 0,
          request.workforce_id,
          request.account_id,
          request.organization_id,
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p2_asset_type_access_mapping_insert', paramsArr);

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
    
    this.assetListUpdateFlagExport  = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.account_id,
          request.workforce_id,
          request.asset_id,
          request.asset_flag_export
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_flag_export', paramsArr);

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

    this.applicationMasterUpdate = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.application_id,
            request.application_label_name,
            request.application_name,
            request.tag_type_label_name,
            request.sequence_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_application_master_update', paramsArr);


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

    this.widgetDrilldownHeaderMappingInsert = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.tag_type_id,
            request.header_id,
            request.sequence_id,
            request.conversion_format,
            request.organization_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_widget_drilldown_header_mapping_insert', paramsArr);


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

    this.widgetDrilldownHeaderMappingDelete = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.header_id,
            request.tag_type_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_widget_drilldown_header_mapping_delete', paramsArr);


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

    this.widgetDrilldownHeaderMappingUpdate = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.header_id,
            request.conversion_format || "",
            request.tag_type_id,
            request.sequence_id,
            request.header_name,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_1_widget_drilldown_header_mapping_update', paramsArr);


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

    this.widgetDrilldownHeaderMappingSelect = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.tag_type_id, 
            request.organization_id
        );
        const queryString = util.getQueryString('ds_v1_widget_drilldown_header_mapping_select', paramsArr);


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

    this.widgetDrilldownHeaderMasterSelect = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_widget_drilldown_header_master_select', paramsArr);


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

    this.assetTypeAccessMappingSelectActivityType = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.flag || 0,
          request.activity_type_id,
          request.workforce_id,
          request.account_id,
          request.organization_id
        );
        const queryString = util.getQueryString('ds_p2_asset_type_access_mapping_select_activity_type', paramsArr);


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

    this.assetTypeAccessMappingDeleteAdmin = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.asset_type_id,
          request.target_asset_id,
          request.access_level_id,
          request.activity_type_id,
          request.organization_id,
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p2_1_asset_type_access_mapping_delete', paramsArr);


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

    this.applicationTagTypeMappingUpdate = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.application_id,
            request.tag_type_id,
            request.index_value,
            request.is_export_enabled,
            request.is_dashboard_enabled,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_application_tag_type_mapping_update', paramsArr);


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

    this.applicationMasterSequenceUpdate = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.application_id,
            request.sequence_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_application_master_update_sequence', paramsArr);


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

    this.organizationFilterTagTypeMappingUpdateInline = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_mapping_id,
            request.filter_inline_data
        );
        const queryString = util.getQueryString('ds_p1_organization_filter_tag_type_mapping_update_inline', paramsArr);


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

     this.workforceActivityTypeMapiingDashboardUpdate = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_type_id,
            request.dashboard_config_fields,
            request.dashboard_config_enabled,
            request.asset_id, 
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_1_workforce_activity_type_mapping_update_dashboard', paramsArr);


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

    this.shareRoleToAnyLevel = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_type_id,
            request.access_level_id,
            request.access_type_id,
            request.activity_type_id,
            request.workforce_id,
            request.workforce_tag_id,
            request.account_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p3_asset_type_access_mapping_insert', paramsArr);


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

    this.reportTypeMasterSelect = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_report_type_master_select', paramsArr);


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

    this.reportTypeMasterInsert = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.report_type_name,
            request.report_type_description,
            request.report_type_flag_hide,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_report_type_master_insert', paramsArr);


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

    this.reportTypeMasterDelete = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.report_type_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_report_type_master_delete', paramsArr);


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

    this.reportTypeMasterDelete = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.report_type_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_report_type_master_delete', paramsArr);


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

    this.workforceAssetTypeMappingFlagSelect = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.flag,
            request.level_id,
            request.asset_type_id,
            request.asset_type_category_id,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.workforce_tag_id,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_1_workforce_asset_type_mapping_select_flag', paramsArr);


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

    this.assetTypeAccessMappingInsertV1 = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.target_asset_id,
            request.asset_type_id,
            request.access_level_id,
            request.access_type_id,
            request.activity_type_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p4_asset_type_access_mapping_insert', paramsArr);


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

    this.workforceFormFieldMappingGemificationScoreUpdate = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.field_id,
          request.form_id,
          request.organization_id,
          request.gamification_score,
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_update_gamification_score', paramsArr);


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

    this.assetGamificationTransactionSelect = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.flag,
            request.activity_id,
            request.form_id,
            request.form_transaction_id,
            request.asset_id,
            request.start_datetime,
            request.end_datetime,
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_v1_asset_gamification_transaction_select', paramsArr);


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

    this.assetSummaryTransactionSelect = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.account_id,
          request.workforce_id,
          request.asset_id,
          request.flag,
          request.summary_id
        );
        const queryString = util.getQueryString('ds_v1_1_asset_summary_transaction_select', paramsArr);


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

    this.assetMonthlySummaryTransactionFlagSelect = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.operating_asset_id,
            request.organization_id,
            request.flag,
            request.data_entity_date_1
        );
        const queryString = util.getQueryString('ds_p1_asset_monthly_summary_transaction_select_flag', paramsArr);


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

    this.workforceFormMappingRolebackFlagUpdate = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.form_id,
          request.flag_disable_rollback_refill,
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_mapping_update_flag_disable_rollback_refill', paramsArr);


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

    this.workforceActivityTypeMappingTagCategorySelect = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.level_id,
          request.organization_id,
          request.account_id,
          request.workforce_id,
          request.activity_type_category_id,
          request.tag_type_category_id,
          request.start_from,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_select_tag_category', paramsArr);


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

    this.workforceListDelete = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.workforce_id,
            request.organization_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_workforce_list_delete', paramsArr);

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

    this.assetSummaryTransactionManagerSelect = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.asset_id,
          request.flag,
          request.summary_id
        );
        const queryString = util.getQueryString('ds_v1_asset_summary_transaction_select_manager', paramsArr);

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

    this.triggerUpdateAccountIntegrations = async (request) => {
        let responseData = [],
            error = true;
        const mode = global.mode;

        try {
            if (request.request_type == "CLMS_ACCOUNT_UPDATE_SERVICE") {
                await triggerESMSIntegrationsService({
                    request
                }, {
                    mode: mode,
                    request_type: request.request_type
                });

                error = false;
            }
            else {
                error = true;
                responseData = [{ "message": "Invalid request type" }];
            }
        } catch (e) {
            console.log(e);
            error = true;
        }
        if (error) {
            error = true;
            responseData = [{ "message": "Trigger activity code integration failed" }];
        }
        else {
            error = false;
            responseData = [{ "message": "Message produced successfully" }];
        }

        return [error, responseData];
    };
}

module.exports = AdminOpsService;
