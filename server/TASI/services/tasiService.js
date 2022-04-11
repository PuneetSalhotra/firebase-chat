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
            request.asset_id,
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
          request.asset_id,
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
            request.asset_type_flag_enable_dashboard || 0,
            request.asset_type_flag_enable_gamification || 0,
            request.asset_type_flag_enable_gantt_chart || 0,
            request.organization_id,
            request.flag,
            util.getCurrentUTCTime(),
            request.asset_id
        );
        const queryString = util.getQueryString('ds_p1_1_workforce_asset_type_mapping_update', paramsArr);

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

    this.updateFrontlineFlagForRole = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.asset_type_id,
            request.asset_type_flag_frontline || 0,
            request.asset_type_flag_sip_target || 0,
            request.asset_type_flag_omit_consolidation || 0,
            request.asset_type_ta_notes || "",
            request.asset_type_ta_applicable_date,
            request.flag,
            util.getCurrentUTCTime(),
            request.log_asset_id
        );
        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_update_ta', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    if (request.flag == 1) {
                        // 3401 if asset_type_flag_frontline  = 1 
                        // if asset_type_flag_frontline  = 0 , 3402
                        // if 3403 if fla g == 2
                        if (request.asset_type_flag_frontline == 0) {
                            request.update_type_id = 3401;
                        } else if (request.asset_type_flag_frontline == 1) {
                            request.update_type_id = 3402;
                        } else if (request.asset_type_flag_frontline == 2) {
                            request.update_type_id = 3403;
                        } else {
                            request.update_type_id = 3403;
                        }
                        //request.update_type_id = request.asset_type_flag_frontline == 1 ? 3401 : 3402;
                        this.targetFrontlineHistoryInsert(request,
                            request.asset_type_id,
                            request.organization_id
                        );
                    }   
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.selectFrontlineRoles = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_type_category_id,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_select_frontline', paramsArr);

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

    this.customerAccountTypeListInsert = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.account_type_name,
            request.account_type_description,
            request.account_type_inline_json,
            request.level_id,
            request.timeline_id,
            request.template_url,
            request.workforce_id,
            request.workforce_tag_id,
            request.account_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_customer_account_type_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                     customerAccountTypeHistoryInsert({...request,customer_account_type_id:data[0].customer_account_type_id},2501)
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
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_customer_account_type_list_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                   customerAccountTypeHistoryInsert(request,2504)
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
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_customer_account_type_list_update_name', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                     customerAccountTypeHistoryInsert(request,2502)
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
          request.description,
          request.asset_id,
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
          request.target_asset_id,
          request.period_type_id,
          request.period_start_datetime,
          request.period_end_datetime,
          request.organization_id,
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_customer_account_mapping_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    assetCustomerAccountMappingHistoryInsert(request,2601)
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
            request.target_asset_id, 
            
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_customer_account_mapping_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                     assetCustomerAccountMappingHistoryInsert(request,2602)
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
            request.target_asset_id, 
            request.flag,
            request.asset_id,
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
            error = false;
        const paramsArr = new Array(
            request.payout_name,
            request.payout_description,
            request.payout_type_id,
            request.payout_inline_data,
            request.timeline_id,
            request.payout_policy_document_url,
            request.payout_matrix_document_url,
            request.payout_accelerator_document_url,
            request.payout_flag_enable_penetration,
            request.payout_flag_enable_utilization,
            request.period_type_id,
            request.period_start_datetime,
            request.period_end_datetime, 
            request.financial_year,
            request.customer_account_type_id,
            request.commission_start_datetime,
            request.commission_end_datetime,
            request.organization_id, 
            request.workforce_tag_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_1_payout_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                   
                    error = false;
                   payoutHistoryInsert({...request,payout_id:data[0].payout_id},2701)
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
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_payout_list_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                     payoutHistoryInsert(request,2702)
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
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_payout_list_update_inline', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                     payoutHistoryInsert(request,2703)
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
            request.widget_type_id,
            request.asset_type_id,
            request.flag,
            request.search_flag,
            request.device_os_id,
            request.customer_account_type_id,
            request.widget_type_level_id,
            request.widget_type_timeline_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.is_parent_widget_type,
            request.parent_widget_type_id,
            request.payout_type_id,
            request.workforce_tag_id,
            request.product_id,
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_1_widget_type_master_select_sip', paramsArr);

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
            request.widget_type_measurement_unit,
            request.widget_type_timeline_id,
            request.asset_tag_id,
            request.customer_account_type_id,
            request.period_type_id,
            request.widget_type_start_datetime,
            request.widget_type_end_datetime,
            request.asset_type_id,
            request.asset_type_sequence_id,
            request.activity_type_id,
            request.tag_id,
            request.level_id,
            request.data_entity_id_1,
            request.data_entity_name_1,
            request.data_entity_id_2,
            request.data_entity_name_2,
            request.data_entity_id_3,
            request.data_entity_name_3,
            request.data_entity_id_4,
            request.data_entity_name_4,
            request.data_entity_id_5,
            request.data_entity_name_5,
            request.widget_type_code,
            request.is_parent_widget_type,
            request.parent_widget_type_id,
            request.payout_type_id,
            request.workforce_id,
            request.workforce_tag_id,
            request.workforce_type_id,
            request.account_id,
            request.organization_id,
            request.log_asset_id,
            util.getCurrentUTCTime(),
            request.non_product_id,
            request.gate_condition_id,
            request.payment_type_id,          
        );
        const queryString = util.getQueryString('ds_p3_1_widget_type_master_insert', paramsArr);

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

    this.commonMeasurementCatagoryMasterList = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_common_measurement_category_master_select', paramsArr);

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
          request.target_asset_id,
          request.organization_id,
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_admin_access_mapping_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    assetAdminAccessHistoryInsert(request,2901)
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
            request.target_asset_id, 
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
          request.target_asset_id,
          
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_asset_admin_access_mapping_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                     assetAdminAccessHistoryInsert(request,2902)
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
          request.target_asset_id,
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
            request.level_id,
            request.total_target_value,
            request.entity_target_inline,
            request.flag_is_outlier,
            request.flag_is_bulk,
            request.flag_type,
            request.timeline_id,
            request.period_type_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.asset_id,
            request.asset_type_id,
            request.customer_account_type_id,
            request.customer_account_code,
            request.customer_account_name,
            request.widget_type_id,
            request.widget_type_name,
            request.activity_id, 
            request.product_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.workforce_tag_id,
            request.cluster_tag_id,
            request.asset_tag_id_1,
            request.asset_tag_id_2,
            request.asset_tag_id_3,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        console.log("addEntityTargetMapping :");
        console.log(paramsArr);
        const queryString = util.getQueryString('ds_p2_1_entity_target_mapping_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                     entityTargetMappingHistoryInsert({...request,entity_target_mapping_id:data[0].entity_target_mapping_id},3001)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.addEntityTargetMappingV1 = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.level_id,
          request.total_target_value,
          request.jan_total_target_value,
          request.feb_total_target_value,
          request.mar_total_target_value,
          request.apr_total_target_value,
          request.may_total_target_value,
          request.jun_total_target_value,
          request.jul_total_target_value,
          request.aug_total_target_value,
          request.sep_total_target_value,
          request.oct_total_target_value,
          request.nov_total_target_value,
          request.dec_total_target_value,
          request.entity_target_inline,
          request.flag_is_outlier,
          request.flag_is_bulk,
          request.flag_type,
          request.timeline_id,
          request.period_type_id,
          request.period_start_datetime,
          request.period_end_datetime,
          request.financial_year,
          request.asset_id,
          request.asset_type_id,
          request.customer_account_type_id,
          request.customer_account_code,
          request.customer_account_name,
          request.widget_type_id,
          request.widget_type_name,
          request.activity_id,
          request.product_id,
          request.workforce_id,
          request.account_id,
          request.organization_id,
          request.workforce_tag_id,
          request.cluster_tag_id,
          request.asset_tag_id_1,
          request.asset_tag_id_2,
          request.asset_tag_id_3,
          request.log_asset_id,
          util.getCurrentUTCTime()
        );
        console.log("addEntityTargetMapping V1:");
        console.log(paramsArr);
        const queryString = util.getQueryString('ds_p2_2_entity_target_mapping_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                     entityTargetMappingHistoryInsert({...request,entity_target_mapping_id:data[0].entity_target_mapping_id},3001)
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
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_entity_target_mapping_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                     entityTargetMappingHistoryInsert(request,3002)
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
            request.p_manager_asset_id,
            request.flag,
            request.is_freeze,
            request.start_datetime,
            request.end_datetime,
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
            request.flag,
            request.period_type_id,
            request.timeline_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.customer_account_type_id,
            request.workforce_tag_id,
            request.start_from,
            request.limit_value,
        );
        const queryString = util.getQueryString('ds_p1_1_payout_list_select', paramsArr);

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
    
    this.inputListInsert = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.input_name,
            request.input_type_id,
            request.input_url1,
            request.input_url2,
            request.input_url3,
            request.input_url4,
            request.input_url5,
            request.input_text,
            request.input_data,
            request.input_upload_datetime,
            request.period_type_id,
            request.data_entity_id,
            request.data_entity_name,
            request.data_entity_type_id,
            request.data_entity_type_name,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.workforce_tag_id,
            request.level_id,
            request.product_id,
            request.widget_type_id,
            request.asset_id,
            request.asset_type_id,
            request.cluster_tag_id,
            request.asset_tag_id_1,
            request.asset_tag_id_2,
            request.asset_tag_id_3,
            request.organization_id, 
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p2_1_input_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                    await inputListHistoryInsert({...request,input_id:data[0].input_id},2801)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }
    async function inputListHistoryInsert(request,update_type_id) {

        let responseData = [],
            error = true;
            
            // IN p_organization_id BIGINT(20), IN p_input_id BIGINT(20), IN p_update_type_id INT(11), IN p_update_datetime DATETIME)
        let paramsArr = new Array(
            request.organization_id,
            request.input_id,
            update_type_id,
            util.getCurrentUTCTime(),
        )
        const queryString = util.getQueryString('ds_p1_input_list_history_insert', paramsArr);
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

    this.reportListInsert = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.account_id,
          request.workforce_id,
          request.target_asset_id,
          request.report_type_id,
          request.report_name,
          request.report_inline_data,
          request.report_recursive_enabled,
          request.report_notified_enabled,
          request.report_recursive_type_id,
          request.report_access_level_id,
          request.activity_id,
          request.report_start_time,
          request.report_end_time,
          request.report_next_start_datetime,
          request.report_next_end_datetime,
          request.period_type_id,
          request.period_start_datetime,
          request.period_end_datetime,
          request.data_entity_bigint_1,
          request.data_entity_bigint_2,
          request.data_entity_bigint_3,
          request.data_entity_bigint_4,
          request.data_entity_bigint_5,
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('dm_v1_1_report_list_insert', paramsArr);

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
    this.updatePayoutReportAsFinal = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.report_transaction_id,
          request.report_id,
          request.report_flag_final,
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('dm_v1_report_transaction_update_flag_final', paramsArr);

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

    this.adminAccessTypeCategorySelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.start_from,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_admin_access_type_category_master_select', paramsArr);

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

    this.adminAccessTypesSelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.admin_access_type_category_id,
          request.start_from,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_admin_access_type_master_select', paramsArr);

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

    this.payoutEntityMappingInsert = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.payout_id, 
            request.widget_type_id, 
            request.customer_account_type_id, 
            request.organization_id, 
            request.asset_id,
            util.getCurrentUTCTime() 
        );
        const queryString = util.getQueryString('ds_p1_payout_entity_mapping_insert', paramsArr);

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

    this.payoutEntityMappingDelete = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id, 
            request.payout_entity_mapping_id,
            request.asset_id,
            util.getCurrentUTCTime() 
        );
        const queryString = util.getQueryString('ds_p1_payout_entity_mapping_delete', paramsArr);

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

    this.payoutEntityMappingSelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.payout_id,
          request.widget_type_id,
          request.customer_account_type_id,
          request.flag,
          request.start_from,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_payout_entity_mapping_select', paramsArr);

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

    this.periodTypeMasterSelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.period_type_category_id,
          request.start_from,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_period_type_master_select', paramsArr);

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

    this.payoutTypeMasterSelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id, 
            request.flag,
            request.payout_type_category_id, 
            request.timeline_id,
            request.level_id,
            request.workforce_tag_id,
            request.start_from, 
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_1_payout_type_master_select', paramsArr);

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

    this.payoutTypeMasterInsert = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = [
            request.payout_type_name,
            request.payout_type_description,
            request.payout_type_category_id,
            request.timeline_id,
            request.level_id,
            request.organization_id,
            request.workforce_tag_id_1,
            request.workforce_tag_name_1,
            request.workforce_tag_id_2,
            request.workforce_tag_name_2,
            request.workforce_tag_id_3,
            request.workforce_tag_name_3,
            request.log_asset_id,
            util.getCurrentUTCTime()
        ];
        const queryString = util.getQueryString('ds_p1_2_payout_type_master_insert', paramsArr);

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

    this.payoutTypeMasterDelete = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.payout_type_id,
            request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_payout_type_master_delete', paramsArr);

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

    this.payoutCategoryMasterList = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_payout_type_category_master_select', paramsArr);

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

    this.widetTimelineMasterSelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.flag,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_1_widget_timeline_master_select', paramsArr);

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

    this.tagEntityMappingSelectWorkforce = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.tag_type_category_id,
          request.flag,
          request.tag_id,
          request.account_id,
          request.workforce_id,
          request.start_from,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_v1_tag_entity_mapping_select_workforce', paramsArr);

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

    this.reportListUpdateFlafFinal = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.report_id, 
            request.flag_final, 
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_m1_report_list_update_flag_final', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    reportListHistoryInsert(request,3301)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.reportListSelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.account_list,
          request.workforce_id,
          request.report_flag,
          request.report_type_id,
          request.start_form,
          request.limit_value
        );
        const queryString = util.getQueryString('ds_v1_report_list_select_type', paramsArr);

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

    this.payoutReportInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.report_type_id,
            request.report_name,
            request.report_inline_data,
            request.report_start_time,
            request.report_end_time,
            request.report_description,
            request.level_id,
            request.widget_type_code,
            request.widget_type_name,
            request.workforce_tag_id,
            request.asset_tag_id_1,
            request.asset_tag_id_2,
            request.asset_tag_id_3,
            request.cluster_tag_id,
            request.period_type_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.data_entity_bigint_1,
            request.data_entity_bigint_2,
            request.data_entity_bigint_3,
            request.data_entity_bigint_4,
            request.data_entity_bigint_5,
            request.data_entity_url_1,
            request.data_entity_url_2,
            request.product_id,
            request.widget_type_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_v1_1_report_list_insert', paramsArr);

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

    this.reportListdelete = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.report_id,
            request.log_state,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('dm_v1_report_list_update_log_state', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    reportListHistoryInsert(request,3302)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

     async function reportListHistoryInsert(request,update_id) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.report_id,
            update_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('dm_v1_report_list_history_insert', paramsArr);

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

    this.targetTypeMasterSelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.target_type_category_id,
            request.start_form,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_target_type_master_select', paramsArr);

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


        // Workforce Asset Types History Insert
    this.targetFrontlineHistoryInsert = async function (request, assetTypeID, organizationID) {
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

    this.targetFrontlineHistorySelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.asset_type_id,
            request.start_from,
            request.limit_value
        );
        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_history_select_frontline', paramsArr);

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


    this.validationInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.validation_name,
            request.validation_description,
            request.validation_type_id,
            request.validation_inline_json,
            request.entity_1_level_id,
            request.entity_2_level_id,
            request.entity_1_id,
            request.entity_2_id,
            request.total_target,
            request.target_variance,
            request.year,
            request.target_asset_id,
            request.timeline_id,
            request.period_type_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.validation_flag_is_bulk,
            request.validation_file_upload_url,
            request.product_id,
            request.widget_type_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_validation_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    if(!request.hasOwnProperty('validation_id')){
                        request.validation_id = data[0].validation_id;
                    }
                    try {
                        this.validationHistoryInsert({...request, update_type_id : 3501 });
                    } catch(e) {
                        console.log("Error while validationHistoryInsert", e, e.stack);
                    }

                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.validationHistoryInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.validation_id,
            request.update_type_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_validation_list_history_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;

                    // try {
                    //     this.validationHistoryInsert({...request, update_type_id : 3501 });
                    // } catch(e) {
                    //     console.log("Error while validationHistoryInsert", e, e.stack);
                    // }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.validationSelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.organization_id,
          request.validation_type_id,
          request.flag,
          request.widget_type_id,
          request.widget_type_category_id,
          request.timeline_id,
          request.period_type_id,
          request.period_start_datetime,
          request.period_end_datetime,
            request.financial_year,
          request.workforce_tag_id,
          request.product_id,
          request.start_from,
          request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_validation_list_select', paramsArr);

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

    this.validationDelete = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.validation_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_validation_list_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = [];
                    try {
                        this.validationHistoryInsert({...request, update_type_id : 3503 });
                    } catch(e) {
                        console.log("Error while validationHistoryInsert", e, e.stack);
                    }
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.lovTasiProductListSelect = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.start_from,
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_lov_tasi_product_list_select', paramsArr);

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

    this.validationListUpdateTarget = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.validation_id,
            request.total_target,
            request.target_variance,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_validation_list_update_target', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = [];
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.updateFreezeFlag = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.entity_target_mapping_id,
            request.flag_is_freeze,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_entity_target_mapping_update_flag_freeze', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = [];
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.updateOutlierFlag = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.entity_target_mapping_id,
            request.flag_is_outlier,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_entity_target_mapping_update_flag_outlier', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = [];
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.validationListSelectEntity = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.validation_type_id,
            request.entity_1_id,
            request.entity_2_id,
            request.year,
            request.start_from,
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_validation_list_select_entity', paramsArr);

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


    this.entityTargetSettingInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.entity_target_setting_inline,
            request.level_id,
            request.flag_is_freeze,
            request.timeline_id,
            request.period_type_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.asset_id,
            request.asset_type_id,
            request.widget_type_id,
            request.widget_type_code,
            request.product_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.workforce_tag_id,
            request.cluster_tag_id,
            request.asset_tag_id_1,
            request.asset_tag_id_2,
            request.asset_tag_id_3,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_1_entity_target_setting_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    try {
                        this.entityTargetSettingHistoryInsert({...request, entity_target_setting_id : data[0].entity_target_setting_id, update_type_id : 3601 });
                    } catch(e) {
                        console.log("Error while validationHistoryInsert", e, e.stack);
                    }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.entityTargetSettingUpdateFlagFreeze = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.entity_target_setting_id,
            request.flag_is_freeze,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_entity_target_setting_update_flag_freeze', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = [];
                    error = false;

                    try {
                        this.entityTargetSettingHistoryInsert({...request, update_type_id : 3602 });
                    } catch(e) {
                        console.log("Error while validationHistoryInsert", e, e.stack);
                    }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.entityTargetSettingSelectFreeze = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.flag,
          request.is_freeze,
          request.level_id,
          request.asset_id,
          request.asset_type_id,
            request.account_id,
          request.widget_type_id,
          request.workforce_tag_id,
          request.cluster_tag_id,
          request.vertical_tag_id,
          request.start_datetime,
          request.end_datetime,
          request.timeline_id,
          request.period_type_id,
          request.financial_year,
          request.start_from || 0,
          request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_2_entity_target_setting_select_freeze', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    console.log(data)
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.entityTargetSettingSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.flag,
            request.is_freeze,
            request.level_id,
            request.asset_id,
            request.asset_type_id,
            request.workforce_tag_id,
            request.asset_tag_id_1,
            request.asset_tag_id_2,
            request.asset_tag_id_3,
            request.cluster_tag_id,
            request.account_id,
            request.widget_type_id,
            request.widget_type_category_id,
            request.widget_type_code,
            request.product_id,
            request.timeline_id,
            request.period_type_id,
            request.start_datetime,
            request.end_datetime,
            request.financial_year,
            request.start_from,
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_entity_target_setting_select', paramsArr);

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

    this.entityTargetSettingHistoryInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.entity_target_setting_id,
            request.update_type_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_entity_target_setting_history_insert', paramsArr);

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
    
    this.entityTargetSettingDelete = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.entity_target_setting_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_entity_target_setting_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = [];
                    error = false;

                    try {
                        this.entityTargetSettingHistoryInsert({...request, update_type_id : 3603 });
                    } catch(e) {
                        console.log("Error while validationHistoryInsert", e, e.stack);
                    }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.entityTargetMappingUpdateTarget = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.entity_target_setting_id,
            request.target,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_entity_target_mapping_update_target', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;

                    try {
                        this.entityTargetSettingHistoryInsert({...request, update_type_id : 3003 });
                    } catch(e) {
                        console.log("Error while validationHistoryInsert", e, e.stack);
                    }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.reportListSelectPayout = async function (request) {
        let responseData = [],
            error = true;
        
        const paramsArr = new Array(
          request.organization_id,
          request.flag,
          request.report_type_id,
          request.payout_id,
          request.period_type_id,
          request.period_start_datetime,
          request.period_end_datetime,
          request.customer_account_type_id,
          request.level_id,
          request.workforce_tag_id,
          request.workforce_id,
          request.account_id,
          request.start_form || 0,
          request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_v1_report_list_select_payout', paramsArr);

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

    this.validationListHistorySelect = async function (request) {
        let responseData = [],
            error = true;
        
        const paramsArr = new Array(
            request.organization_id,
            request.validation_id,
            request.start_form || 0,
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_validation_list_history_select', paramsArr);

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
    
    this.entityTargetSettingSelectTarget = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.entity_target_setting_id,
            request.start_form || 0,
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_entity_target_setting_history_select', paramsArr);

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

    this.entityTargetMappingHistorySelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.entity_target_mapping_id,
            request.start_form || 0,
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_entity_target_mapping_history_select', paramsArr);

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

    this.inputListHistorySelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.input_id, 
            request.start_from || 0, 
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_input_list_history_select', paramsArr);

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

    this.reportListUpdateFlagValidated = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.report_id, 
            request.flag_validated, 
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_m1_report_list_update_flag_validated', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    reportListHistoryInsert(request,3301)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.assetListUpdateFlagSimulation = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.asset_id,
          request.workforce_id,
          request.account_id,
          request.organization_id,
          request.asset_flag_simulation
        );

        const queryString = util.getQueryString('ds_p1_asset_list_update_flag_simulation', paramsArr);

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

    this.payoutAuditLogListing = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.payout_id, 
            request.start_from || 0, 
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_payout_list_history_select', paramsArr);

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

    this.customerAccountTypeHistoryListing = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.customer_account_type_id, 
            request.start_from || 0, 
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_customer_account_type_list_history_select', paramsArr);

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

    this.accountMappingByPeriodList = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.input_type_id,
            request.flag,
            request.period_start_datetime,
            request.period_end_datetime,
            request.input_period_type_id,
            request.financial_year,
            request.data_entity_id,
            request.workforce_tag_id,
            request.start_from || 0,
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p2_input_list_select_sip', paramsArr);

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

    this.payoutReportOverrideLog = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.override_name,
          request.override_description,
          request.override_type_id,
          request.override_inline_data,
          request.override_datetime,
          request.override_upload_url_1,
          request.override_upload_url_2,
          request.data_entity_id,
          request.period_type_id,
          request.period_start_datetime,
          request.period_end_datetime,
          request.customer_account_type_id,
          request.organization_id,
          request.asset_id,
          util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_override_list_insert', paramsArr);

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

    this.overrideLogList = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.override_type_id, 
            request.flag,
            request.data_entity_id,
            request.period_type_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.customer_account_type_id,
            request.start_from || 0, 
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_override_list_select', paramsArr);

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

    this.inputListSelectFilter = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.input_type_id,
            request.flag,
            request.period_start_datetime,
            request.period_end_datetime,
            request.input_period_type_id,
            request.financial_year,
            request.widget_type_id,
            request.widget_type_category_id,
            request.product_id,
            request.level_id,
            request.asset_id,
            request.asset_type_id,
            request.asset_tag_id_1,
            request.asset_tag_id_2,
            request.asset_tag_id_3,
            request.workforce_tag_id,
            request.cluster_tag_id,
            request.log_asset_id,
            request.start_from,
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_3_input_list_select_filter', paramsArr);

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

    this.reportListSimulationSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.flag, 
            request.is_search,
            request.report_type_id, 
            request.period_type_id,
            request.period_start_datetime, 
            request.period_end_datetime,
            request.financial_year,
            request.level_id,
            request.workforce_tag_id,
            request.asset_tag_id_1,
            request.asset_tag_id_2,
            request.asset_tag_id_3,
            request.product_id,
            request.widget_type_id,
            request.widget_type_category_id,
            request.workforce_id,
            request.account_id,
            request.cluster_tag_id,
            request.widget_type_name,
            request.log_asset_id,
            request.start_form, 
            request.limit_value
        );

        const queryString = util.getQueryString('ds_v1_2_report_list_select_simulation', paramsArr);

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

    this.entityTargetMappingListV1 = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.asset_id, 
            request.manager_asset_id, 
            request.asset_type_id, 
            request.flag,
            request.flag_type,
            request.asset_tag_id,
            request.level_id,
            request.timeline_id,
            request.period_type_id,
            request.period_start_datetime, 
            request.period_end_datetime,
            request.financial_year,
            request.cluster_tag_id,
            request.account_id,
            request.workforce_tag_id,
            request.widget_type_id,
            request.widget_type_category_id,
            request.product_id,
            request.start_from, 
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p3_1_entity_target_mapping_select', paramsArr);

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

    this.widgetTypeCategoryMasterSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.start_from,
          request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_widget_type_category_master_select', paramsArr);

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

    this.accountTargetSettingInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.target_setting_name,
            request.target_setting_description,
            request.target_setting_inline,
            request.timeline_id,
            request.period_type_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.product_id,
            request.target_setting_flag_channel,
            request.workforce_tag_id,
            request.organization_id,
            request.log_asset_id,
            util.getCurrentUTCTime()            
        );

        const queryString = util.getQueryString('ds_p1_account_target_setting_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    this.insertAccountTargetSettingHistory({ ...request, target_setting_id: data[0].target_setting_id, update_type_id: 3901 });
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.accountTargetSettingDelete = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_target_setting_id,
            request.asset_id,
            util.getCurrentUTCTime()            
        );

        const queryString = util.getQueryString('ds_p1_account_target_setting_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    this.insertAccountTargetSettingHistory({ ...request, target_setting_id: request.account_target_setting_id, update_type_id: 3903 });
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.accountTargetSettingSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.flag,
          request.timeline_id,
          request.period_type_id,
          request.period_start_datetime,
          request.period_end_datetime,
          request.financial_year,
          request.product_id,
          request.start_from,
          request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_account_target_setting_select_filter', paramsArr);

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

    this.accountCoverageListInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.account_coverage_name,
            request.account_coverage_description,
            request.account_coverage_inline,
            request.policy_1_url,
            request.policy_2_url,
            request.timeline_id,
            request.period_type_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.product_id,
            request.organization_id,
            request.widget_type_id,
            request.widget_type_code,
            request.workforce_tag_id,
            request.log_asset_id,
            util.getCurrentUTCTime()  
        );

        const queryString = util.getQueryString('ds_p1_1_account_coverage_list_insert', paramsArr);

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

    this.productiveInfraListInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.productive_infra_name,
            request.productive_infra_description,
            request.productive_infra_inline,
            request.policy_1_url,
            request.policy_2_url,
            request.timeline_id,
            request.period_type_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.product_id,
            request.organization_id,
            request.widget_type_id,
            request.widget_type_code,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_1_productive_infra_list_insert', paramsArr);

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

    this.accountCoverageListDelete = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.account_coverage_id,
          request.asset_id,
          util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_account_coverage_list_delete', paramsArr);

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

    this.productiveInfraListDelete = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.productive_infra_id,
          request.asset_id,
          util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_productive_infra_list_delete', paramsArr);

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

    this.accountCoverageListSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.flag,
            request.timeline_id,
            request.period_type_id,
            request.period_start_datetime, 
            request.period_end_datetime,
            request.financial_year,
            request.workforce_tag_id,
            request.start_from, 
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_1_account_coverage_list_select_filter', paramsArr);

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

    this.productiveInfraListSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.flag,
            request.timeline_id,
            request.period_type_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.start_from,
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_1_productive_infra_list_select_filter', paramsArr);

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

    this.widgetTypeMasterCodeSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.widget_type_code
        );

        const queryString = util.getQueryString('ds_p1_widget_type_master_select_code', paramsArr);

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

    this.lovTasiNonProductList = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.start_from,
          request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_lov_tasi_non_product_list_select', paramsArr);

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

    //Add parameter mapping details
    this.addParameterMappingDetails = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.parameter_mapping_name,
            request.parameter_mapping_desc,
            request.parameter_mapping_url,
            request.parameter_mapping_inline,
            request.financial_year,
            request.timeline_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.workforce_tag_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_parameter_mapping_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    this.insertParameterMappingHistory({ ...request, parameter_mapping_id: data[0].parameter_mapping_id, update_type_id: 4001 });
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    //Remove parameter mapping details
    this.deleteParameterMappingDetails = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.parameter_mapping_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_parameter_mapping_delete', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    this.insertParameterMappingHistory({ ...request, update_type_id: 4003 });
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    //List parameter mapping details
    this.listParameterMappingDetails = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.timeline_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.workforce_tag_id,
            request.start_from,
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_parameter_mapping_select', paramsArr);

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

    //Add Organization level module details
    this.addOrganiztionLevelModuleDetails = async function (request) {
        let responseData = [],
            error = true;
     let adminAccessTypes = typeof request.admin_access_type_id == 'string' ? JSON.parse(request.admin_access_type_id) :request.admin_access_type_id;
     for(let i=0;i<adminAccessTypes.length;i++){
        addEachOrganiztionLevelModuleDetails({...request,admin_access_type_id:adminAccessTypes[i]})
     }
        return [error, responseData];
    }

   async function addEachOrganiztionLevelModuleDetails(request){
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.admin_access_type_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_admin_access_mapping_insert', paramsArr);

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

    //Remove Organization level module details
    this.deleteOrganiztionLevelModuleDetails = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.admin_access_type_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_admin_access_mapping_delete', paramsArr);

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

    //Get Organization level module details
    this.listOrganiztionLevelModuleDetails = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.admin_access_type_id,
            request.organization_id
        );

        const queryString = util.getQueryString('ds_p1_admin_access_mapping_select', paramsArr);

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

    //TASI Report List Insert
    this.tasiReportListInsert = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.report_type_id,
            request.report_name,
            request.report_inline_data,
            request.report_start_time,
            request.report_end_time,
            request.report_description,
            request.level_id,
            request.widget_type_code,
            request.widget_type_name,
            request.workforce_tag_id,
            request.asset_tag_id_1,
            request.asset_tag_id_2,
            request.asset_tag_id_3,
            request.cluster_tag_id,
            request.period_type_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.data_entity_bigint_1,
            request.data_entity_bigint_2,
            request.data_entity_bigint_3,
            request.data_entity_bigint_4,
            request.data_entity_bigint_5,
            request.data_entity_url_1,
            request.data_entity_url_2,
            request.product_id,
            request.widget_type_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_v1_1_report_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    reportListHistoryInsert({...request,report_id:data[0].report_id},3301)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    //New listing call for SIP Payout type history
    this.listSipPayoutTypeHistory = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.payout_type_id,
            request.start_from,
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_payout_type_master_history_select', paramsArr);

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

    //New Add call for SIP Payout type history
    this.addSipPayoutTypeHistory = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.payout_type_id,
            request.update_type_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_payout_type_master_history_insert', paramsArr);

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

    //New call for SIP payout type update
    this.updateSipPayoutType = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.payout_type_id,
            request.payout_type_name,
            request.payout_type_description,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_payout_type_master_update_inline', paramsArr);

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

    this.updateAccountTargetSettings = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.target_setting_id,
            request.target_setting_name,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_account_target_setting_update', paramsArr);

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

    this.assetTypeFlagSipTargetSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.flag || 0,
          request.level_id || 0,
          request.asset_type_id,
          request.asset_type_category_id || 0,
          request.organization_id,
          request.account_id,
          request.workforce_id,
          request.asset_type_flag_frontline || 0,
          request.asset_type_flag_sip_target || 0,
          request.start_from,
          request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_select_flag_sip_target', paramsArr);

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

    this.widgetTypeAssetTypeMappingAssetList = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.flag,
            request.asset_id,
            request.organization_id,
            request.widget_type_id,
            request.widget_type_category_id,
            request.timeline_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.asset_type_id,
            request.workforce_tag_id,
            request.product_id,
            request.start_from,
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_widget_type_asset_type_mapping_select_asset', paramsArr);

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

    this.widgetTypeAssetTypeMappingAssetListV1 = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.asset_id,
            request.organization_id, 
            request.period_start_datetime,
            request.datetime_end,
            request.financial_year,
            request.widget_type_id,
            request.widget_type_category_id,
            request.asset_tag_id_1,
            request.workforce_tag_id,
            request.product_id,
            request.account_id,
            request.start_from, 
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_2_widget_type_asset_type_mapping_select_asset', paramsArr);

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

    this.accountTargetSettingSelectAssetList = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.asset_id,
            request.timeline_id,
            request.period_start_datetime, 
            request.period_end_datetime,
            request.financial_year,
            request.product_id,
            request.workforce_tag_id,
            request.workforce_id,
            request.account_id,
            request.start_from, 
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_account_target_setting_select_asset', paramsArr);

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

    this.tasiEntityTargetMappingSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.asset_id,
          request.manager_asset_id,
          request.asset_type_id,
          request.flag,
          request.flag_type,
          request.asset_tag_id_1,
          request.level_id,
          request.timeline_id,
          request.period_type_id,
          request.period_start_datetime,
          request.period_end_datetime,
          request.financial_year,
          request.cluster_tag_id,
          request.account_id,
          request.workforce_tag_id,
          request.widget_type_id,
          request.widget_type_category_id,
          request.product_id,
          request.start_from,
          request.limit_value
        );

        const queryString = util.getQueryString('ds_p3_2_entity_target_mapping_select', paramsArr);

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

    this.tasiEntityTargetMappingSelectV1 = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id, 
            request.asset_id, 
            request.manager_asset_id, 
            request.asset_type_id, 
            request.flag,
            request.flag_type,
            request.asset_tag_id_1,
            request.asset_tag_type_id_1,
            request.level_id,
            request.timeline_id,
            request.period_type_id,
            request.period_start_datetime, 
            request.period_end_datetime,
            request.financial_year,
            request.cluster_tag_id,
            request.account_id,
            request.workforce_tag_id,
            request.widget_type_id,
            request.widget_type_category_id,
            request.product_id,
            request.start_from, 
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p3_4_entity_target_mapping_select', paramsArr);

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

    this.entityTargetMappingTargetUpdate = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.entity_target_mapping_id,
            request.flag_type,
            request.jan_total_target_value,
            request.feb_total_target_value,
            request.mar_total_target_value,
            request.apr_total_target_value,
            request.may_total_target_value,
            request.jun_total_target_value,
            request.jul_total_target_value,
            request.aug_total_target_value,
            request.sep_total_target_value,
            request.oct_total_target_value,
            request.nov_total_target_value,
            request.dec_total_target_value,
            request.organization_id,
            request.asset_id,
            request.widget_type_id,
            request.customer_account_code,
            request.period_start_datetime,
            request.period_end_datetime,
            request.period_type_id,
            request.target,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_4_entity_target_mapping_update_target', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                    entityTargetMappingHistoryInsert({ ...request }, 3003)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.widgetTypeAssetTypeMappingCodeSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.flag,
            request.organization_id, 
            request.widget_type_id, 
            request.widget_type_category_id,
            request.timeline_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.asset_type_id, 
            request.workforce_tag_id,
            request.product_id || 0,
            request.start_from, 
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_widget_type_asset_type_mapping_select_code', paramsArr);

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

    this.widgetTypeAssetTypeMappingRoleSelect = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.flag,
            request.organization_id,
            request.widget_type_id,
            request.widget_type_category_id,
            request.timeline_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.financial_year,
            request.asset_type_id,
            request.workforce_tag_id,
            request.start_from,
            request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_widget_type_asset_type_mapping_select_role', paramsArr);

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

    this.entitytargetMappingHistorySelectV1 = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.asset_type_id,
          request.asset_id,
          request.widget_type_id,
          request.start_from,
          request.limit_value
        );

        const queryString = util.getQueryString('ds_p1_1_entity_target_mapping_history_select', paramsArr);

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

    this.entityTargetMappingOutlierFlagUpdate = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.target_asset_id,
            request.flag_type,
            request.timeline_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.flag_is_outlier,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_1_entity_target_mapping_update_flag_outlier', paramsArr);

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

    this.getParentListWidgetTypeMaster = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.widget_type_category_id,
            request.is_parent_widget_type
        );

        const queryString = util.getQueryString('ds_p1_widget_type_master_select_parent', paramsArr);

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

    this.insertWidgetTypeForSip = async function (request) {
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
            request.widget_type_measurement_unit,
            request.widget_type_timeline_id,
            request.asset_tag_id,
            request.customer_account_type_id,
            request.period_type_id,
            request.widget_type_start_datetime,
            request.widget_type_end_datetime,
            request.payout_type_id,
            request.asset_type_id,
            request.asset_type_sequence_id,
            request.activity_type_id,
            request.tag_id,
            request.level_id,
            request.data_entity_id_1,
            request.data_entity_name_1,
            request.data_entity_id_2,
            request.data_entity_name_2,
            request.data_entity_id_3,
            request.data_entity_name_3,
            request.data_entity_id_4,
            request.data_entity_name_4,
            request.data_entity_id_5,
            request.data_entity_name_5,
            request.widget_type_code,
            request.workforce_id,
            request.workforce_tag_id,
            request.workforce_type_id,
            request.account_id,
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime(),
            request.non_product_id,
            request.gate_condition_id,
            request.payment_type_id
        );
        const queryString = util.getQueryString('ds_p3_widget_type_master_insert_sip', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    console.log(data)
                    responseData = data;
                    error = false;
                    const [err1, resData] = widgetTypeHistoryInsert({ ...request, ...data[0] }, 3101)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [false, responseData];
    }

    async function widgetTypeHistoryInsert(request, id) {
        let responseData = [],
            error = true;

        const paramsArr = [
            request.organization_id,
            request.widget_type_id,
            id,
            util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_p1_widget_type_master_history_insert', paramsArr);
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

        return [error, responseData]
    }

    this.getSipList = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.input_type_id,
            request.flag,
            request.input_flag_is_processed,
            request.asset_id,
            request.period_start_datetime,
            request.period_end_datetime,
            request.input_period_type_id,
            request.financial_year,
            request.data_entity_id,
            request.workforce_tag_id,
            request.start_from || 0,
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p3_input_list_select_sip', paramsArr);

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

    this.selectReportListHistory = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.report_id,
            request.start_from || 0,
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_report_list_history_select', paramsArr);

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

    this.insertAccountTargetSettingHistory = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.target_setting_id,
            request.update_type_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_account_target_setting_history_insert', paramsArr);

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
        return [false, responseData];
    }

    this.selectAccountTargetSettingHistory = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.target_setting_id,
            request.start_from || 0,
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_account_target_setting_history_select', paramsArr);

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

    this.insertParameterMappingHistory = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.organization_id,
            request.parameter_mapping_id,
            request.update_type_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_parameter_mapping_history_insert', paramsArr);

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
        return [false, responseData];
    }

    this.selectParameterMappingHistory = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.parameter_mapping_id,
            request.start_from || 0,
            request.limit_value || 50
        );

        const queryString = util.getQueryString('ds_p1_parameter_mapping_history_select', paramsArr);

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

    this.entityTargetMappingArchiveV1 = async function (request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.target_asset_id,
          request.customer_account_code,
          request.widget_type_id,
          request.period_start_datetime,
          request.period_end_datetime,
          request.asset_id,
          util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_1_entity_target_mapping_archive', paramsArr);

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

module.exports = TasiService;
