const AdminOpsService = require('../services/adminOpsService');

function AdminOpsController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const adminOpsService = new AdminOpsService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

    // Add a desk to floor
    app.post('/' + global.config.version + '/admin/workforce/desk/add', async function (req, res) {
        const [err, orgData] = await adminOpsService.addNewDeskToWorkforce(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Add an employee to an existing desk on a floor
    app.post('/' + global.config.version + '/admin/workforce/desk/employee/add', async function (req, res) {
        const [err, orgData] = await adminOpsService.addNewEmployeeToExistingDesk(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/employee/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Add an employee to an existing desk on a floor
    app.post('/' + global.config.version + '/admin/workforce/desk/employee/remove', async function (req, res) {
        const [err, orgData] = await adminOpsService.removeEmployeeMappedToDesk(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/employee/remove | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Archive the desk asset from the floor/workforce provided no employee is mapped to it
    app.post('/' + global.config.version + '/admin/workforce/desk/archive', async function (req, res) {
        const [err, orgData] = await adminOpsService.archiveDeskIfEmployeeNotMapped(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/archive | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Relocate a employee desk from one floor/workforce to another. If an employee is operating 
    // on the desk, then shift the employee asset to the target floor workforce
    app.post('/' + global.config.version + '/admin/workforce/desk/update_workforce', async function (req, res) {
        const [err, orgData] = await adminOpsService.moveEmployeeDeskToAnotherWorkforce(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/update_workforce | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Create a new workforce, department or a floor
    app.post('/' + global.config.version + '/admin/workforce/add', async function (req, res) {
        const [err, workforceData] = await adminOpsService.createWorkforce(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, workforceData, 200, req.body));
        } else {
            console.log("/admin/workforce/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, workforceData, -9999, req.body));
        }
    });

    // Alter or update an existing workforce
    app.post('/' + global.config.version + '/admin/workforce/alter', async function (req, res) {
        const [err, workforceData] = await adminOpsService.alterWorkforce(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, workforceData, 200, req.body));
        } else {
            console.log("/admin/workforce/alter | Error: ", err);
            res.send(responseWrapper.getResponse(err, workforceData, -9999, req.body));
        }
    });

    // Create a new organization
    app.post('/' + global.config.version + '/admin/organization/add', async function (req, res) {
        const [err, workforceData] = await adminOpsService.createOrganization(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, workforceData, 200, req.body));
        } else {
            console.log("/admin/organization/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, workforceData, -9999, req.body));
        }
    });

    // Create a new organization
    app.post('/' + global.config.version + '/admin/account/add', async function (req, res) {
        const [err, workforceData] = await adminOpsService.createAccount(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, workforceData, 200, req.body));
        } else {
            console.log("/admin/account/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, workforceData, -9999, req.body));
        }
    });

    // Create a new organization
    app.post('/' + global.config.version + '/admin/asset/details/update', async function (req, res) {
        const [err, assetData] = await adminOpsService.updateAssetDetails(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/asset/details/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Update default duration of a workflow
    app.post('/' + global.config.version + '/admin/activity_type/default_duration/update', async function (req, res) {
        const [err, assetData] = await adminOpsService.updateActivityTypeDefaultDuration(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/asset/details/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

};

module.exports = AdminOpsController;
