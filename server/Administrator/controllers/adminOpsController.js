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

    // Update the desk asset
    app.post('/' + global.config.version + '/admin/workforce/desk_employee/update', async function (req, res) {
        const [err, assetData] = await adminOpsService.upateDeskAndEmployeeAsset(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/archive | Error: ", err);
            res.send(responseWrapper.getResponse(err, assetData, -9999, req.body));
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

    // Add a status tag
    app.post('/' + global.config.version + '/admin/status_tag/add', async function (req, res) {
        const [err, statusData] = await adminOpsService.addStatusTag(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, statusData, 200, req.body));
        } else {
            console.log("/admin/status_tag/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, statusData, -9999, req.body));
        }
    });

    // Update a status tag name
    app.post('/' + global.config.version + '/admin/status_tag/update_name', async function (req, res) {
        const [err, statusData] = await adminOpsService.updateStatusTagName(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, statusData, 200, req.body));
        } else {
            console.log("/admin/status_tag/update_name: ", err);
            res.send(responseWrapper.getResponse(err, statusData, -9999, req.body));
        }
    });

    // Delete a status tag
    app.post('/' + global.config.version + '/admin/status_tag/delete', async function (req, res) {
        const [err, statusData] = await adminOpsService.deleteStatusTag(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, statusData, 200, req.body));
        } else {
            console.log("/admin/status_tag/delete | Error: ", err);
            res.send(responseWrapper.getResponse(err, statusData, -9999, req.body));
        }
    });

    // To Grant or Revoke access to workforce - Building; asset can be wf, building, organization
    app.post('/' + global.config.version + '/admin/asset_flags/update', async function (req, res) {
        const [err, statusData] = await adminOpsService.updateAssetFlags(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(statusData, statusData, 200, req.body));
        } else {
            console.log("/admin/asset_flags/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, statusData, -9999, req.body));
        }
    });

    // Create Queue Mapping with Status_tag
    app.post('/' + global.config.version + '/admin/queue/status_tag/add', async function (req, res) {
        const [err, statusData] = await adminOpsService.queueWithStatusTag(req.body);
        try{
            JSON.parse(req.body.status_tag_ids);
        } catch(err1) {
            res.send(responseWrapper.getResponse(err1, {}, -3308, req.body));
        }
        if (!err) {
            res.send(responseWrapper.getResponse(statusData, statusData, 200, req.body));
        } else {
            console.log("/admin/queue/status_tag/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, statusData, -9999, req.body));
        }
    });


    //Upload the Smart Mi form
    app.post('/' + global.config.version + '/admin/smart_form/upload', async function (req, res) {
        const [err, responseData] = await adminOpsService.uploadSmartForm(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/smart_form/upload | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
        
    });

    // Set Persist Role Flag In The Workforce Activity Type Mapping Table
    app.post('/' + global.config.version + '/admin/workforce/activity_type/flag_persist_role/set', async function (req, res) {
        const [err, responseData] = await adminOpsService.workflowUpdatePersistRoleFlag(req.body, 1);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_type/flag_persist_role/set | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Reset Persist Role Flag In The Workforce Activity Type Mapping Table
    app.post('/' + global.config.version + '/admin/workforce/activity_type/flag_persist_role/reset', async function (req, res) {
        const [err, responseData] = await adminOpsService.workflowUpdatePersistRoleFlag(req.body, 0);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_type/flag_persist_role/reset | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Create a role
    app.post('/' + global.config.version + '/admin/workforce/asset_type/role/create', async function (req, res) {
        // asset_type_level_id:
        // 1: Organization
        // 2: Account
        // 3: WorkForce     
        const [err, responseData] = await adminOpsService.createRole(req.body, 0);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/asset_type/role/create | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Update a role's name
    app.post('/' + global.config.version + '/admin/workforce/asset_type/role/update_name', async function (req, res) {
        const [err, responseData] = await adminOpsService.updateRoleName(req.body, 0);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/asset_type/role/update_name | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Archive a role
    app.post('/' + global.config.version + '/admin/workforce/asset_type/role/archive', async function (req, res) {
        const [err, responseData] = await adminOpsService.archiveRole(req.body, 0);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/asset_type/role/archive | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Update the role mapped to a status along with the expected status duration and workflow percentage as well
    app.post('/' + global.config.version + '/admin/workforce/activity_status/role/update', async function (req, res) {
        // flag:
        // 0 => Update percentage, duration and role
        // 1 => Updagte percentage ONLY
        // 2 => Update duration ONLY
        // 3 => Update role ONLY
        const [err, responseData] = await adminOpsService.updateStatusRoleMapping(req.body, 0);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_status/role/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Update a workflow's value contributors
    app.post('/' + global.config.version + '/admin/workforce/activity_type/value_contributors/update', async function (req, res) {
        // flag:
        // 1 => Update the complete inline data
        // 2 => Add fields
        // 3 => Remove fields
        const [err, responseData] = await adminOpsService.updateWorkflowValueContributors(req.body, 0);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_type/value_contributors/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    // Add Tag Types
    app.post('/' + global.config.version + '/admin/organization/tag_type/add', async function (req, res) {
        const [err, responseData] = await adminOpsService.addTagType(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/organization/tag_type/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    // Add Tag
    app.post('/' + global.config.version + '/admin/organization/tag/add', async function (req, res) {
        const [err, responseData] = await adminOpsService.addTag(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/organization/tag/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    // Add (Workflow/Activity Type) to (Tag) mapping
    app.post('/' + global.config.version + '/admin/organization/activity_type/tag/map', async function (req, res) {
        const [err, responseData] = await adminOpsService.addActivityTypeToTagMapping(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/organization/tag/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

}

module.exports = AdminOpsController;
