function TasiService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;
    const moment = require('moment');
    const nodeUtil = require('util');
    const self = this;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.organizationListUpdateFlag = async function (request) {
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
            request.flag_enable_form_tag,
            request.flag_enable_sip_module,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_2_organization_list_update_flags', paramsArr);

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

    this.organizationListInsert = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_name,
          request.organization_domain,
          request.organization_image_path,
          request.organization_address,
          request.organization_phone_country_code,
          request.organization_phone_number,
          request.organization_email,
          request.contact_person,
          request.contact_phone_country_code,
          request.contact_phone_number,
          request.contact_email,
          request.org_enterprise_feature_data,
          request.flag_email,
          request.flag_doc_repo,
          request.flag_ent_features,
          request.flag_ai_bot,
          request.flag_manager_proxy,
          request.flag_enable_form_tag,
          request.flag_enable_sip_module,
          request.organization_type_id,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_3_organization_list_insert', paramsArr);

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

    this.assetUpdateSipAdminFlag = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.asset_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.asset_flag_sip_admin_access
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_flag_sip_admin_access', paramsArr);

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

    this.assetUpdateFlagFrontline = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.asset_id,
          request.workforce_id,
          request.account_id,
          request.organization_id,
          request.asset_flag_frontline
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_flag_frontline', paramsArr);

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

    this.assetTypeSipAdminRoleUpdate = async function (request) {
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
            request.asset_type_approval_origin_form_id,
            request.asset_type_approval_field_id,
            request.asset_type_attendance_type_id,
            request.asset_type_attendance_type_name,
            request.asset_type_flag_enable_suspension,
            request.asset_type_suspension_activity_type_id,
            request.asset_type_suspension_activity_type_name,
            request.asset_type_suspension_wait_duration,
            request.asset_type_flag_hide_organization_details,
            request.asset_type_flag_sip_enabled,
            request.asset_type_flag_enable_send_sms,
            request.asset_type_flag_sip_admin_access,
            request.organization_id,
            request.flag,
            util.getCurrentUTCTime(),
            request.log_asset_id
        );
        const queryString = util.getQueryString('ds_p3_workforce_asset_type_mapping_update', paramsArr);

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

    this.customerAccountTypeListInsert = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.account_type_name,
          request.account_type_description,
          request.account_type_inline_json,
          request.timeline_id,
          request.template_url,
          request.organization_id,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_customer_account_type_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    let [historyInsertErr,historyInsertData] = customerAccountTypeHistoryInsert({...request,customer_account_type_id:data[0].customer_account_type_id},2501)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.customerAccountTypeListDelete = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.customer_account_type_id,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_customer_account_type_list_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    let [historyInsertErr,historyInsertData] = customerAccountTypeHistoryInsert(request,2504)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.customerAccountTypeNameUpdate = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.customer_account_type_id,
          request.customer_account_type_name,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_customer_account_type_list_update_name', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    let [historyInsertErr,historyInsertData] = customerAccountTypeHistoryInsert(request,2502)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.customerAccountTypeEntityMappingUpdate = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.customer_account_type_id,
          request.account_type_inline_json,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_customer_account_type_list_update_inline', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    let [historyInsertErr,historyInsertData] = customerAccountTypeHistoryInsert(request,2503)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.customerAccountTypeEntityMappingUpdate = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.customer_account_type_id,
          request.account_type_inline_json,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_customer_account_type_list_update_inline', paramsArr);

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

    async function customerAccountTypeHistoryInsert(request,id){
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.customer_account_type_id,
          id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_customer_account_type_list_history_insert', paramsArr);

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
    this.customerAccountTypeList = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.customer_account_type_id,
          request.start_from,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_customer_account_type_list_select', paramsArr);

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

    this.assetCustomerAccountMappingInsert = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.customer_account_type_id, 
            request.asset_id, 
            request.organization_id, 
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_customer_account_mapping_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    const [err1,resData] = assetCustomerAccountMappingHistoryInsert(request,2601)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.assetCustomerAccountMappingDelete = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id, 
            request.customer_account_type_id, 
            request.asset_id, 
            
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_customer_account_mapping_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    const [err1,resData] = assetCustomerAccountMappingHistoryInsert(request,2602)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.assetCustomerAccountMappingList = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id, 
            request.customer_account_type_id, 
            request.asset_id, 
            request.flag,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_customer_account_mapping_select', paramsArr);

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

    async function assetCustomerAccountMappingHistoryInsert(request,id){
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.customer_account_type_id,
          request.asset_id,
          id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_customer_account_mapping_history_insert', paramsArr);

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

    this.payoutListInsert = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.payout_name,
          request.payout_type_id,
          request.payout_inline_data,
          request.payout_policy_document_url,
          request.payout_matrix_document_url,
          request.payout_accelerator_document_url,
          request.payout_flag_enable_penetration,
          request.payout_flag_enable_utilization,
          request.organization_id,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_payout_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    const [err1,resData] = payoutHistoryInsert(request,2701)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.payoutListDelete = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.payout_id,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_payout_list_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    const [err1,resData] = payoutHistoryInsert(request,2702)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.payoutListUpdateInline = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.payout_id,
          request.payout_inline_data,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_payout_list_update_inline', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    const [err1,resData] = payoutHistoryInsert(request,2703)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    async function payoutHistoryInsert(request,id){
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.payout_id,
          id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_payout_list_history_insert', paramsArr);

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

    this.widgetTypeMasterSipSelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.widget_type_category_id, 
            request.asset_type_id,
            request.flag,
            request.device_os_id,
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_widget_type_master_select_sip', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    const [err1,resData] = payoutHistoryInsert(request,2703)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.widgetTypeMasterSipInsert = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.widget_type_name,
          request.widget_type_description,
          request.widget_type_category_id,
          request.widget_type_chart_id,
          request.flag_mobile_enabled,
          request.widget_type_flag_target,
          request.widget_type_flag_sip_enabled,
          request.widget_type_flag_role_enabled,
          request.widget_type_flag_prediction_enabled,
          request.widget_type_sip_contribution_percentage,
          request.widget_type_inline_data,
          request.widget_type_measurement_id,
          request.widget_type_timeline_id,
          request.asset_tag_id,
          request.customer_account_type_id,
          request.widget_type_start_datetime,
          request.widget_type_end_datetime,
          request.asset_type_id,
          request.asset_type_sequence_id,
          request.activity_type_id,
          request.tag_id,
          request.workforce_type_id,
          request.organization_id,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p2_widget_type_master_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    const [err1,resData] = payoutHistoryInsert(request,2703)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.commonMeasurementCatagoryMasterList = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_common_measurement_category_master_select', paramsArr);

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

    this.commonMeasurementMasterList = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.measurement_category_id,
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_common_measurement_master_select', paramsArr);

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

    this.addSpecificAdminUserAccess = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.admin_access_type_id,
          request.asset_access_flag,
          request.asset_id,
          request.organization_id,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_admin_access_mapping_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    const [err1,resData] = assetAdminAccessHistoryInsert(request,2901)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.assetAdminAccessList = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id, 
            request.admin_access_type_id, 
            request.asset_id, 
            request.flag,
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_asset_admin_access_mapping_select', paramsArr);

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

    this.removeSpecificAdminUserAccess = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.admin_access_type_id,
          request.asset_access_flag,
          request.asset_id,
          
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_admin_access_mapping_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    const [err1,resData] = assetAdminAccessHistoryInsert(request,2902)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    async function assetAdminAccessHistoryInsert(request,id){
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.admin_access_type_id,
          request.asset_id,
          id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_admin_access_mapping_history_insert', paramsArr);

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

    this.addEntityTargetMapping = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.tag_id_1,
            request.target_value_1,
            request.tag_id_2,
            request.target_value_2,
            request.tag_id_3,
            request.target_value_3,
            request.tag_id_4,
            request.target_value_4,
            request.tag_id_5,
            request.target_value_5,
            request.total_target_value,
            request.asset_id,
            request.customer_account_type_id,
            request.customer_account_code,
            request.customer_account_name,
            request.activity_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_entity_target_mapping_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    const [err1,resData] = entityTargetMappingHistoryInsert({...request,entity_target_mapping_id:data[0].entity_target_mapping_id},3001)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.removeEntityTargetMapping = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.entity_target_mapping_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_entity_target_mapping_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    const [err1,resData] = entityTargetMappingHistoryInsert(request,3002)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.entityTargetMappingList = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.asset_id,
          request.customer_account_type_id,
          request.start_from,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_entity_target_mapping_select', paramsArr);

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

    async function entityTargetMappingHistoryInsert(request,id){
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.entity_target_mapping_id,
            id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_entity_target_mapping_history_insert', paramsArr);

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

    this.payoutList = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id, 
            request.payout_type_id, 
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_payout_list_select', paramsArr);

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

module.exports = TasiService;






