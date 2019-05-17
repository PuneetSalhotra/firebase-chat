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
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/organization/list/by_name | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Portal: workforceActivityTypeMappingSelect
    // DB Call: ds_p1_workforce_activity_type_mapping_select
    app.post('/' + global.config.version + '/admin/workforce/activity_type/list', async function (req, res) {
        const [err, orgData] = await adminListingService.workforceActivityTypeMappingSelect(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_type/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Portal: workforceActivityStatusMappingSelect
    // DB Call: ds_p1_workforce_activity_status_mapping_select
    app.post('/' + global.config.version + '/admin/workforce/activity_status/list', async function (req, res) {
        const [err, orgData] = await adminListingService.workforceActivityStatusMappingSelect(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_status/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Portal: activityAssetMappingSelectCategoryContacts
    // DB Call: ds_p1_activity_asset_mapping_select_category_contacts
    app.post('/' + global.config.version + '/admin/organization/coworker_contact/list', async function (req, res) {
        const [err, orgData] = await adminListingService.activityAssetMappingSelectCategoryContacts(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/organization/coworker_contact/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Portal: getUnreadActivityCount
    // DB Call: ds_p1_activity_asset_mapping_select_unrd_cnt_team_floor
    app.post('/' + global.config.version + '/admin/workforce/unread/count', async function (req, res) {
        const [err, orgData] = await adminListingService.workforceDesksUnreadCount(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/unread/count | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Portal: getAssetDetails
    // DB Call: ds_p1_asset_list_select
    app.post('/' + global.config.version + '/admin/asset/list', async function (req, res) {
        const [err, assetData] = await adminListingService.assetListSelect(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/asset/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Portal: assetListSelectAllDesks
    // DB Call: ds_p1_asset_list_select_all_desks
    app.post('/' + global.config.version + '/admin/workforce/desk_asset/list/all', async function (req, res) {
        const [err, assetData] = await adminListingService.assetListSelectAllDesks(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk_asset/list/all | Error: ", err);
            res.send(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Portal: workforce/asset/pending/count
    // DB Call: ds_p1_activity_asset_mapping_select_pending_count_team_floor
    app.post('/' + global.config.version + '/admin/workforce/asset/pending/count', async function (req, res) {
        const [err, countData] = await adminListingService.getWorkforceAssetsPendingCount(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, countData, 200, req.body));
        } else {
            console.log("/admin/workforce/asset/pending/count | Error: ", err);
            res.send(responseWrapper.getResponse(err, countData, -9999, req.body));
        }
    });

    // Portal: getSearchEmployeeRegisterData
    // DB Call: ds_p1_asset_list_search_asset_type_category
    app.post('/' + global.config.version + '/admin/asset/employee_desk/search', async function (req, res) {
        const [err, assetData] = await adminListingService.employeeOrEmployeeDeskSearch(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/asset/employee_desk/search | Error: ", err);
            res.send(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Portal: /activity/asset/id_card/cover
    // DB Call: ds_p1_activity_asset_mapping_select_asset_id_card
    app.post('/' + global.config.version + '/admin/asset/employee/id_card/cover', async function (req, res) {
        const [err, idCardData] = await adminListingService.getAssetIdCard(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, idCardData, 200, req.body));
        } else {
            console.log("/admin/asset/employee/id_card/cover | Error: ", err);
            res.send(responseWrapper.getResponse(err, idCardData, -9999, req.body));
        }
    });

    // Portal: workforceListSelectAccount1
    // DB Call: ds_p1_1_workforce_list_select_account
    app.post('/' + global.config.version + '/admin/account/workforce/list', async function (req, res) {
        const [err, workforceListData] = await adminListingService.workforceListSelectAccount(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, workforceListData, 200, req.body));
        } else {
            console.log("/admin/account/workforce/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, workforceListData, -9999, req.body));
        }
    });

    // Portal: workforceFormMappingSelectFormType
    // DB Call: ds_p1_workforce_form_mapping_select_form_type
    // Get forms list based on form type id
    app.post('/' + global.config.version + '/admin/workforce/form_type/form/list', async function (req, res) {
        const [err, formListData] = await adminListingService.workforceFormMappingSelectFormType(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formListData, 200, req.body));
        } else {
            console.log("/admin/workforce/form_type/form/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, formListData, -9999, req.body));
        }
    });

    // Portal: accountListSelectOrganization
    // DB Call: ds_p1_account_list_select_organization
    // Get accounts list in the organization
    app.post('/' + global.config.version + '/admin/organization/account/list', async function (req, res) {
        const [err, accountListData] = await adminListingService.accountListSelectOrganization(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, accountListData, 200, req.body));
        } else {
            console.log("/admin/organization/account/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, accountListData, -9999, req.body));
        }
    });

    // Portal: activityAssetUnreadUpdatesCountReset
    // DB Call: ds_p1_activity_asset_mapping_update_unread_updates_count_reset
    // To update Unread count and last Seen
    app.post('/' + global.config.version + '/admin/activity/unread_count/reset', async function (req, res) {
        const [err, assetData] = await adminListingService.activityAssetMappingUpdateUnreadUpdatesCountReset(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/activity/unread_count/reset | Error: ", err);
            res.send(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

};

module.exports = AdminListingController;
