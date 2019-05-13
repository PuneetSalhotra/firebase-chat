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

};

module.exports = AdminListingController;
