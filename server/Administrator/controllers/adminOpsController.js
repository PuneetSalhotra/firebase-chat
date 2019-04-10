const AdminOpsService = require('../services/adminOpsService');

function AdminOpsController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const adminOpsService = new AdminOpsService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

    app.post('/' + global.config.version + '/admin/organization/setup', async function (req, res) {
        const [err, orgData] = await adminOpsService.setupOrganization(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/organization/setup | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/workforce/desk/add', async function (req, res) {
        const [err, orgData] = await adminOpsService.addNewDeskToWorkforce(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/organization/setup | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

};

module.exports = AdminOpsController;
