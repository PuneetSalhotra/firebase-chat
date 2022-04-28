const AdminListingService = require("../services/adminListingService");

function AdminListingController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const adminListingService = new AdminListingService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

    app.post('/' + global.config.version + '/admin/organization/list/by_name', async function (req, res) {
        const [err, orgData] = await adminListingService.organizationListSelectName(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/organization/list/by_name | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Portal: workforceActivityTypeMappingSelect
    // DB Call: ds_p1_workforce_activity_type_mapping_select
    app.post('/' + global.config.version + '/admin/workforce/activity_type/list', async function (req, res) {
        const [err, orgData] = await adminListingService.workforceActivityTypeMappingSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Portal: workforceActivityStatusMappingSelect
    // DB Call: ds_p1_workforce_activity_status_mapping_select
    app.post('/' + global.config.version + '/admin/workforce/activity_status/list', async function (req, res) {
        const [err, orgData] = await adminListingService.workforceActivityStatusMappingSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_status/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Portal: activityAssetMappingSelectCategoryContacts
    // DB Call: ds_p1_activity_asset_mapping_select_category_contacts
    app.post('/' + global.config.version + '/admin/organization/coworker_contact/list', async function (req, res) {
        const [err, orgData] = await adminListingService.activityAssetMappingSelectCategoryContacts(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/organization/coworker_contact/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Portal: getUnreadActivityCount
    // DB Call: ds_p1_activity_asset_mapping_select_unrd_cnt_team_floor
    app.post('/' + global.config.version + '/admin/workforce/unread/count', async function (req, res) {
        const [err, orgData] = await adminListingService.workforceDesksUnreadCount(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/unread/count | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Portal: getAssetDetails
    // DB Call: ds_p1_asset_list_select
    app.post('/' + global.config.version + '/admin/asset/list', async function (req, res) {
        const [err, assetData] = await adminListingService.assetListSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/asset/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Portal: assetListSelectAllDesks
    // DB Call: ds_p1_asset_list_select_all_desks
    app.post('/' + global.config.version + '/admin/workforce/desk_asset/list/all', async function (req, res) {
        const [err, assetData] = await adminListingService.getAllDesksOnFloor(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk_asset/list/all | Error: ", err);
            res.json(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Portal: workforce/asset/pending/count
    // DB Call: ds_p1_activity_asset_mapping_select_pending_count_team_floor
    app.post('/' + global.config.version + '/admin/workforce/asset/pending/count', async function (req, res) {
        const [err, countData] = await adminListingService.getWorkforceAssetsPendingCount(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, countData, 200, req.body));
        } else {
            console.log("/admin/workforce/asset/pending/count | Error: ", err);
            res.json(responseWrapper.getResponse(err, countData, -9999, req.body));
        }
    });

    // Portal: getSearchEmployeeRegisterData
    // DB Call: ds_p1_asset_list_search_asset_type_category
    app.post('/' + global.config.version + '/admin/asset/employee_desk/search', async function (req, res) {
        const [err, assetData] = await adminListingService.employeeOrEmployeeDeskSearch(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/asset/employee_desk/search | Error: ", err);
            res.json(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Portal: /activity/asset/id_card/cover
    // DB Call: ds_p1_activity_asset_mapping_select_asset_id_card
    app.post('/' + global.config.version + '/admin/asset/employee/id_card/cover', async function (req, res) {
        const [err, idCardData] = await adminListingService.getAssetIdCard(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, idCardData, 200, req.body));
        } else {
            console.log("/admin/asset/employee/id_card/cover | Error: ", err);
            res.json(responseWrapper.getResponse(err, idCardData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/asset/employee/id_card/cover/v1', async function (req, res) {
        const [err, idCardData] = await adminListingService.getAssetIdCardV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, idCardData, 200, req.body));
        } else {
            console.log("/admin/asset/employee/id_card/cover | Error: ", err);
            res.json(responseWrapper.getResponse(err, idCardData, -9999, req.body));
        }
    });

    // Portal: workforceListSelectAccount1
    // DB Call: ds_p1_1_workforce_list_select_account
     app.post('/' + global.config.version + '/admin/account/workforce/list', async function (req, res) {
        const [err, workforceListData] = await adminListingService.workforceListSelectAccount(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, workforceListData, 200, req.body));
        } else {
            console.log("/admin/account/workforce/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, workforceListData, -9999, req.body));
        }
    });

    // Portal: workforceFormMappingSelectFormType
    // DB Call: ds_p1_workforce_form_mapping_select_form_type
    // Get forms list based on form type id
    app.post('/' + global.config.version + '/admin/workforce/form_type/form/list', async function (req, res) {
        const [err, formListData] = await adminListingService.workforceFormMappingSelectFormType(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, formListData, 200, req.body));
        } else {
            console.log("/admin/workforce/form_type/form/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, formListData, -9999, req.body));
        }
    });

    // Portal: accountListSelectOrganization
    // DB Call: ds_p1_account_list_select_organization
    // Get accounts list in the organization
    app.post('/' + global.config.version + '/admin/organization/account/list', async function (req, res) {
        const [err, accountListData] = await adminListingService.accountListSelectOrganization(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, accountListData, 200, req.body));
        } else {
            console.log("/admin/organization/account/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, accountListData, -9999, req.body));
        }
    });

    // Check self sign up flag 
    app.post('/' + global.config.version + '/admin/organization/self_signup_flag/check', async function (req, res) {
        const [err, accountListData] = await adminListingService.checkSelfSignUpFlagForOrganization(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, accountListData, 200, req.body));
        } else {
            console.log("/admin/organization/self_signup_flag/check | Error: ", err);
            res.json(responseWrapper.getResponse(err, err, -9999, req.body));
        }
    });

    // Portal: activityAssetUnreadUpdatesCountReset
    // DB Call: ds_p1_activity_asset_mapping_update_unread_updates_count_reset
    // To update Unread count and last Seen
    app.post('/' + global.config.version + '/admin/activity/unread_count/reset', async function (req, res) {
        const [err, assetData] = await adminListingService.activityAssetMappingUpdateUnreadUpdatesCountReset(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/activity/unread_count/reset | Error: ", err);
            res.json(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Portal: getWidgetsList
    // DB Call: ds_p1_widget_list_select_level
    // Get the list of widgets
    app.post('/' + global.config.version + '/admin/widget/list', async function (req, res) {
        const [err, widgetData] = await adminListingService.widgetListSelectLevel(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, widgetData, 200, req.body));
        } else {
            console.log("/admin/widget/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, widgetData, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/admin/activity_type/list', async function (req, res) {
        const [err, activityTypeData] = await adminListingService.workforceActivityTypeMappingSelectCategory(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, activityTypeData, 200, req.body));
        } else {
            console.log("/admin/activity_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, activityTypeData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/activity_type/list/V1', async function (req, res) {
        const [err, activityTypeData] = await adminListingService.workforceActivityTypeMappingSelectCategoryV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, activityTypeData, 200, req.body));
        } else {
            console.log("/admin/activity_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, activityTypeData, -9999, req.body));
        }
    });

    // List activity status tags
    app.post('/' + global.config.version + '/admin/status_tag/list', async function (req, res) {
        const [err, activityStatusTagData] = await adminListingService.getListOfActivityStatusTags(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, activityStatusTagData, 200, req.body));
        } else {
            console.log("/admin/status_tag/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, activityStatusTagData, -9999, req.body));
        }
    });

    // List asset(s) for a given customer unique ID
    app.post('/' + global.config.version + '/admin/cuid/asset/list', async function (req, res) {
        const [err, assetData] = await adminListingService.listAssetsByCUID(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/cuid/asset/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Retrieve the list of activity statuses
    app.post('/' + global.config.version + '/admin/activity_type/mapping/list', async function (req, res) {
        const [err, assetData] = await adminListingService.workforceActivityStatusMappingSelectFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/activity_type/mapping/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Retrieve the list of activity statuses mapped to a Status Tag
    app.post('/' + global.config.version + '/admin/status_tag/mapping/list', async function (req, res) {
        const [err, statusTagData] = await adminListingService.workforceActivityStatusMappingSelectStatusTag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, statusTagData, 200, req.body));
        } else {
            console.log("/admin/status_tag/mapping/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, statusTagData, -9999, req.body));
        }
    });    

    // List all activity status type IDs filtered by activity_type_category_id (DEFAULT: 48)
    app.post('/' + global.config.version + '/admin/activity_status_type/list', async function (req, res) {
        const [err, data] = await adminListingService.listActivityStatusTypeByActivityTypeCategoryID(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/activity_status_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // List all roles, asset types at various access levels
    app.post('/' + global.config.version + '/admin/workforce/asset_type/role/list', async function (req, res) {
        // flag: 
        // 0 => all asset types mapped at organization level or mapped at account level or mapped at workforce level
        // 1 => Organization level 
        // 2 => Account level
        // 3 => Workforce level
        const [err, data] = await adminListingService.listRolesByAccessLevels(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/workforce/asset_type/role/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });


    //List all the assets mapped to a Role
    app.post('/' + global.config.version + '/admin/asset/role/list', async function (req, res) {
        const [err, data] = await adminListingService.assetListSelectRole(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/asset/role/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });


    // List statuses associated with this role
    app.post('/' + global.config.version + '/admin/asset/role/statuses/list', async function (req, res) {
        const [err, data] = await adminListingService.workforceActivityStatusMappingSelectRole(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/asset/role/statuses/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // List processes associated with the Tag
    app.post('/' + global.config.version + '/admin/tag/mappings/list', async function (req, res) {
        const [err, data] = await adminListingService.tagListSelectTag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/tag/mappings/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });


    // List Tags associated with the TagType
    app.post('/' + global.config.version + '/admin/tag_type/mappings/list', async function (req, res) {
        const [err, data] = await adminListingService.tagTypeTagMappingSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/tag_type/mappings/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });
    
    app.post('/' + global.config.version + '/admin/organization/ai_bot/config/list', async function (req, res) {
        const [err, orgData] = await adminListingService.organizationListSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/organization/ai_bot/config/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/organization/list', async function (req, res) {
        console.log('req.body : ', req.body);
        const [err, orgData] = await adminListingService.organizationListSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/organization/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/activity_type/status/list', async function (req, res) {
        const [err, orgData] = await adminListingService.workforceActivityStatusMappingSelectStatusType(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/activity_type/status/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });  

    app.post('/' + global.config.version + '/admin/asset_category/asset_type/list', async function (req, res) {
        const [err, assetTypeData] = await adminListingService.workforceAssetTypeMappingSelectCategory(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, assetTypeData, 200, req.body));
        } else {
            console.log("/admin/asset_category/asset_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, assetTypeData, -9999, req.body));
        }
    });  

    app.post('/' + global.config.version + '/admin/workflow/bots_enabled/form/list', async (req, res) => {
        req.body.bot_operation_type_id = 20;
        const [err, botsData] = await adminListingService.botOperationMappingSelectOperationType(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, botsData, 200, req.body));
        } else {
            console.log("/admin/workflow/bots_enabled/form/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, botsData, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/admin/tag_type/list', async (req, res) => {        
        const [err, botsData] = await adminListingService.getTagTypesBasedOnCategory(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, botsData, 200, req.body));
        } else {
            console.log("/admin/tag_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, botsData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag_type/list/v1', async (req, res) => {        
        const [err, botsData] = await adminListingService.getTagTypesBasedOnCategoryV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, botsData, 200, req.body));
        } else {
            console.log("/admin/tag_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, botsData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/asset/type/master/list', async (req, res) => {        
        const [err, botsData] = await adminListingService.assetTypeCategoryMasterSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, botsData, 200, req.body));
        } else {
            console.log("/admin/asset/type/master/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, botsData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag/entity/mapping/list', async (req, res) => {        
        const [err, botsData] = await adminListingService.getTagEntityMappingsBasedOnCategory(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, botsData, 200, req.body));
        } else {
            console.log("/admin/tag/entity/mapping/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, botsData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag/entity-mappings/list', async (req, res) => {
        const [err, data] = await adminListingService.getTagEntityMappingsBasedOnID(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/tag_type/mappings/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/lov-datatype/list', async (req, res) => {
        const [err, data] = await adminListingService.getLovDatatypeList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/lov-datatype/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/activity_type/entry', async function (req, res) {
        const [err, activityTypeData] = await adminListingService.workforceActivityTypeMappingSelectID(req.body, req.body.activity_type_id);
        if (!err) {
            res.json(responseWrapper.getResponse({}, activityTypeData, 200, req.body));
        } else {
            console.log("/admin/activity_type/entry | Error: ", err);
            res.json(responseWrapper.getResponse(err, activityTypeData, -9999, req.body));
        }
    });    

    app.post('/' + global.config.version + '/admin/workforce_type/list', async function (req, res) {
        const [err, workforceTypeData] = await adminListingService.workforceTypeMasterSelectOrganization(req.body, req.body.activity_type_id);
        if (!err) {
            res.json(responseWrapper.getResponse({}, workforceTypeData, 200, req.body));
        } else {
            console.log("/admin/workforce_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, workforceTypeData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/lov-datatype/list/v1', async (req, res) => {
        const [err, data] = await adminListingService.getLovDatatypeListV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/lov-datatype/list/v1 | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/lov/dependent/list', async (req, res) => {
        const [err, data] = await adminListingService.getStateAndCircleBasedOnCity(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/lov/dependent/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/super-admin/flag/set', async (req, res) => {
        const [err, data] = await adminListingService.setSuperAdminFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/lov-datatype/list/v1 | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

     app.post('/' + global.config.version + '/admin/category/tagtype/list', async (req, res) => {        
        const [err, tagTypeData] = await adminListingService.tagEntityMappingTagTypeSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, tagTypeData, 200, req.body));
        } else {
            console.log("/admin/category/tagtype/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, tagTypeData, -9999, req.body));
        }
    });    
    
    app.post('/' + global.config.version + '/admin/workforce/roles/countbySip', async (req, res) => {        
        const [err, tagTypeData] = await adminListingService.rolesCountbySipFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, tagTypeData, 200, req.body));
        } else {
            console.log("/admin/workforce/roles/countbySip | Error: ", err);
            res.json(responseWrapper.getResponse(err, tagTypeData, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/admin/activity-type/tag/mapping/update', async (req, res) => {        
        const [err, tagTypeData] = await adminListingService.updateTagEntitiesMapping(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, tagTypeData, 200, req.body));
        } else {
            console.log("/admin/activity-type/tag/mapping/update | Error: ", err);
          res.json(responseWrapper.getResponse(err, tagTypeData, -9999, req.body));
        }
    });
  
    app.post('/' + global.config.version + '/admin/tag-entity/mapping/list', async (req, res) => {        
        const [err, tagTypeData] = await adminListingService.tagEntityMappingTagSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, tagTypeData, 200, req.body));
        } else {
            console.log("/admin/tag-entity/mapping/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, tagTypeData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/common/currency/select', async (req, res) => {        
        const [err, commonCurrency] = await adminListingService.selectCommonCurrency(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, commonCurrency, 200, req.body));
        } else {
            console.log("/admin/tag-entity/mapping/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, commonCurrency, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/admin/workforce/activity-type/mapping/flag/update', async (req, res) => {        
        const [err, commonCurrency] = await adminListingService.setCalenderProcessAsDefault(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, commonCurrency, 200, req.body));
        } else {
            console.log("/admin/workforce/activity-type/mapping/flag/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, commonCurrency, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/workforce/activity-type/mapping/flag/select', async (req, res) => {        
        const [err, commonCurrency] = await adminListingService.selectDefaultCalenderFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, commonCurrency, 200, req.body));
        } else {
            console.log("/admin/workforce/activity-type/mapping/flag/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, commonCurrency, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/lov/type/list', async function (req, res) {
        const [err, resData] = await adminListingService.lovTypeList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/admin/lov/type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/workflow/form/fields', async (req, res) => {        
        const [err, botsData] = await adminListingService.getWorkflowFormFields(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, botsData, 200, req.body));
        } else {
            console.log("/admin/workflow/form/fields | Error: ", err);
            res.json(responseWrapper.getResponse(err, botsData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/organization/list/all', async (req, res) => {        
        const [err, botsData] = await adminListingService.getAllOrganization(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, botsData, 200, req.body));
        } else {
            console.log("/admin/organization/list/all | Error: ", err);
            res.json(responseWrapper.getResponse(err, botsData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/organization/list/support/workflow', async (req, res) => {        
        const [err, botsData] = await adminListingService.getOrgListSupportWorkflow(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, botsData, 200, req.body));
        } else {
            console.log("/admin/organization/list/support/workflow | Error: ", err);
            res.json(responseWrapper.getResponse(err, botsData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag_type/org/mapped/list', async (req, res) => {        
        const [err, botsData] = await adminListingService.applicationTagTypeMappingSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, botsData, 200, req.body));
        } else {
            console.log("/admin/organization/list/support/workflow | Error: ", err);
            res.json(responseWrapper.getResponse(err, botsData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/roms/config/list', async (req, res) => {        
        const [err, botsData] = await adminListingService.adminRomsConfigListSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, botsData, 200, req.body));
        } else {
            console.log("/admin/roms/config/list| Error: ", err);
            res.json(responseWrapper.getResponse(err, botsData, -9999, req.body));
        }
    });


}

module.exports = AdminListingController;
