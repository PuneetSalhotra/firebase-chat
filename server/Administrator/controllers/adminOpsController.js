const AdminOpsService = require('../services/adminOpsService');
const FormConfigService = require("../../services/formConfigService");

function AdminOpsController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const adminOpsService = new AdminOpsService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

    const formConfigService = new FormConfigService(objCollection);

    // Add a desk to floor
    app.post('/' + global.config.version + '/admin/workforce/desk/add', async function (req, res) {
        const [err, orgData] = await adminOpsService.addNewDeskToWorkforce(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Add an employee to an existing desk on a floor
    app.post('/' + global.config.version + '/admin/workforce/desk/employee/add', async function (req, res) {
        const [err, orgData] = await adminOpsService.addNewEmployeeToExistingDesk(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/employee/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Add an employee to an existing desk on a floor
    app.post('/' + global.config.version + '/admin/workforce/desk/employee/remove', async function (req, res) {
        const [err, orgData] = await adminOpsService.removeEmployeeMappedToDesk(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/employee/remove | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Update the desk asset
    app.post('/' + global.config.version + '/admin/workforce/desk_employee/update', async function (req, res) {
        const [err, assetData] = await adminOpsService.upateDeskAndEmployeeAsset(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/archive | Error: ", err);
            res.json(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Archive the desk asset from the floor/workforce provided no employee is mapped to it
    app.post('/' + global.config.version + '/admin/workforce/desk/archive', async function (req, res) {
        const [err, orgData] = await adminOpsService.archiveDeskIfEmployeeNotMapped(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/archive | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Relocate a employee desk from one floor/workforce to another. If an employee is operating 
    // on the desk, then shift the employee asset to the target floor workforce
    app.post('/' + global.config.version + '/admin/workforce/desk/update_workforce', async function (req, res) {
        const [err, orgData] = await adminOpsService.moveEmployeeDeskToAnotherWorkforce(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/workforce/desk/update_workforce | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    // Create a new workforce, department or a floor
    app.post('/' + global.config.version + '/admin/workforce/add', async function (req, res) {
        const [err, workforceData] = await adminOpsService.createWorkforce(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, workforceData, 200, req.body));
        } else {
            console.log("/admin/workforce/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, workforceData, -9999, req.body));
        }
    });

    // Alter or update an existing workforce
    app.post('/' + global.config.version + '/admin/workforce/alter', async function (req, res) {
        const [err, workforceData] = await adminOpsService.alterWorkforce(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, workforceData, 200, req.body));
        } else {
            console.log("/admin/workforce/alter | Error: ", err);
            res.json(responseWrapper.getResponse(err, workforceData, -9999, req.body));
        }
    });

    // Create a new organization
    app.post('/' + global.config.version + '/admin/organization/add', async function (req, res) {
        const [err, workforceData] = await adminOpsService.createOrganization(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, workforceData, 200, req.body));
        } else {
            console.log("/admin/organization/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, workforceData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/organization/flags/alter', async function (req, res) {
        const [err, workforceData] = await adminOpsService.updateOrganizationFlags(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, workforceData, 200, req.body));
        } else {
            console.log("/admin/organization/flags/alter | Error: ", err);
            res.json(responseWrapper.getResponse(err, workforceData, -9999, req.body));
        }
    });

    // Create a new organization
    app.post('/' + global.config.version + '/admin/account/add', async function (req, res) {
        const [err, workforceData] = await adminOpsService.createAccount(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, workforceData, 200, req.body));
        } else {
            console.log("/admin/account/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, workforceData, -9999, req.body));
        }
    });

    // Create a new organization
    app.post('/' + global.config.version + '/admin/asset/details/update', async function (req, res) {
        const [err, assetData] = await adminOpsService.updateAssetDetails(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/asset/details/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Update default duration of a workflow
    app.post('/' + global.config.version + '/admin/activity_type/default_duration/update', async function (req, res) {
        const [err, assetData] = await adminOpsService.updateActivityTypeDefaultDuration(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, assetData, 200, req.body));
        } else {
            console.log("/admin/asset/details/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, assetData, -9999, req.body));
        }
    });

    // Add a status tag
    app.post('/' + global.config.version + '/admin/status_tag/add', async function (req, res) {
        const [err, statusData] = await adminOpsService.addStatusTag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, statusData, 200, req.body));
        } else {
            console.log("/admin/status_tag/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, statusData, -9999, req.body));
        }
    });

    // Update a status tag name
    app.post('/' + global.config.version + '/admin/status_tag/update_name', async function (req, res) {
        const [err, statusData] = await adminOpsService.updateStatusTagName(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, statusData, 200, req.body));
        } else {
            console.log("/admin/status_tag/update_name: ", err);
            res.json(responseWrapper.getResponse(err, statusData, -9999, req.body));
        }
    });

    // Delete a status tag
    app.post('/' + global.config.version + '/admin/status_tag/delete', async function (req, res) {
        const [err, statusData] = await adminOpsService.deleteStatusTag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, statusData, 200, req.body));
        } else {
            console.log("/admin/status_tag/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, statusData, -9999, req.body));
        }
    });

    // To Grant or Revoke access to workforce - Building; asset can be wf, building, organization
    app.post('/' + global.config.version + '/admin/asset_flags/update', async function (req, res) {
        const [err, statusData] = await adminOpsService.updateAssetFlags(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(statusData, statusData, 200, req.body));
        } else {
            console.log("/admin/asset_flags/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, statusData, -9999, req.body));
        }
    });

    // Create Queue Mapping with Status_tag
    app.post('/' + global.config.version + '/admin/queue/status_tag/add', async function (req, res) {
        const [err, statusData] = await adminOpsService.queueWithStatusTag(req.body);
        try {
            JSON.parse(req.body.status_tag_ids);
        } catch (err1) {
            res.json(responseWrapper.getResponse(err1, {}, -3308, req.body));
        }
        if (!err) {
            res.json(responseWrapper.getResponse(statusData, statusData, 200, req.body));
        } else {
            console.log("/admin/queue/status_tag/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, statusData, -9999, req.body));
        }
    });


    //Upload the Smart Mi form
    app.post('/' + global.config.version + '/admin/smart_form/upload', async function (req, res) {
        const [err, responseData] = await adminOpsService.uploadSmartForm(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/smart_form/upload | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }

    });

    // [Redundant] Set Persist Role Flag In The Workforce Activity Type Mapping Table
    // Use /admin/workforce/activity_type/flag_persist_role/update instead
    app.post('/' + global.config.version + '/admin/workforce/activity_type/flag_persist_role/set', async function (req, res) {
        const [err, responseData] = await adminOpsService.workflowUpdatePersistRoleFlag(req.body, 1);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_type/flag_persist_role/set | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // [Redundant] Reset Persist Role Flag In The Workforce Activity Type Mapping Table
    // Use /admin/workforce/activity_type/flag_persist_role/update instead
    app.post('/' + global.config.version + '/admin/workforce/activity_type/flag_persist_role/reset', async function (req, res) {
        const [err, responseData] = await adminOpsService.workflowUpdatePersistRoleFlag(req.body, 0);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_type/flag_persist_role/reset | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Update Persist Role Flag In The Workforce Activity Type Mapping Table
    app.post('/' + global.config.version + '/admin/workforce/activity_type/flag_persist_role/update', async function (req, res) {
        const [err, responseData] = await adminOpsService.workflowUpdatePersistRoleFlag(req.body, Number(req.body.activity_flag_persist_role) || 0);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            // console.log("/admin/workforce/activity_type/flag_persist_role/upate | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
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
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/asset_type/role/create | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Update a role's name
    app.post('/' + global.config.version + '/admin/workforce/asset_type/role/update_name', async function (req, res) {
        const [err, responseData] = await adminOpsService.updateRoleName(req.body, 0);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/asset_type/role/update_name | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Archive a role
    app.post('/' + global.config.version + '/admin/workforce/asset_type/role/archive', async function (req, res) {
        const [err, responseData] = await adminOpsService.archiveRole(req.body, 0);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/asset_type/role/archive | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Update the Asset Type
    app.post('/' + global.config.version + '/admin/asset_type/alter', async function (req, res) {
        const [err, responseData] = await adminOpsService.updateAssetType(req.body, 0);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/asset_type/alter | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Update the Asset's Manager Data
    app.post('/' + global.config.version + '/admin/asset_manager/alter', async function (req, res) {
        const [err, responseData] = await adminOpsService.updateAssetsManagerDetails(req.body, 0);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/asset_manager/alter | Error: ", err);
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
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_status/role/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
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
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_type/value_contributors/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    // Add Tag Types
    app.post('/' + global.config.version + '/admin/organization/tag_type/add', async function (req, res) {
        const [err, responseData] = await adminOpsService.addTagType(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/organization/tag_type/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    // Add Tag
    app.post('/' + global.config.version + '/admin/organization/tag/add', async function (req, res) {
        const [err, responseData] = await adminOpsService.addTag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/organization/tag/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    // Add (Workflow/Activity Type) to (Tag) mapping
    app.post('/' + global.config.version + '/admin/organization/activity_type/tag/map', async function (req, res) {
        const [err, responseData] = await adminOpsService.addActivityTypeToTagMapping(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/organization/tag/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });


    //Set Business Hours @Account Level
    app.post('/' + global.config.version + '/admin/account_level/business_hours/set', async function (req, res) {
        try {
            JSON.parse(req.body.account_inline_data);
        } catch (exeption) {
            res.json(responseWrapper.getResponse(false, "Invalid JSON - 'account_inline_data'", -3308, req.body));
            return;
        }

        const [err, responseData] = await adminOpsService.setBusinessHoursAccountLevel(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/account_level/business_hours/set | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    //Set Business Hours @Floor(Workforce) Level
    app.post('/' + global.config.version + '/admin/workforce_level/business_hours/set', async function (req, res) {
        try {
            JSON.parse(req.body.workforce_inline_data);
        } catch (exeption) {
            res.json(responseWrapper.getResponse(false, "Invalid JSON - 'workforce_inline_data'", -3308, req.body));
            return;
        }

        const [err, responseData] = await adminOpsService.setBusinessHoursWorkforceLevel(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce_level/business_hours/set | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    //Set Business Hours @Individual(Desk) Level
    app.post('/' + global.config.version + '/admin/desk_level/business_hours/set', async function (req, res) {
        try {
            JSON.parse(req.body.asset_inline_data);
        } catch (exeption) {
            res.json(responseWrapper.getResponse(false, "Invalid JSON - 'desk_inline_data'", -3308, req.body));
            return;
        }
        const [err, responseData] = await adminOpsService.setBusinessHoursDeskLevel(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/desk_level/business_hours/set | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    // Manually generate the workflow activity for a given origin form
    app.post('/' + global.config.version + '/admin/organization/manual_trigger/workflow/generate', async function (req, res) {
        const [err, responseData] = await formConfigService.workflowEngine(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/organization/manual_trigger/workflow/generate | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/asset/access/set', async function (req, res) {
        const [err, responseData] = await adminOpsService.assetListUpdateAdminFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/asset/access/set | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/activity_type_tag/delete', async function (req, res) {
        const [err, responseData] = await adminOpsService.activityTypeTagDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/activity_type_tag/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag_type/delete', async function (req, res) {
        const [err, responseData] = await adminOpsService.tagTypeDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/tag_type/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    //Upload the ID proof PAN/Adhaar/Passport
    app.post('/' + global.config.version + '/asset/id_proof/upload', async (req, res) => {
        const [err, data] = await adminOpsService.idProofUpload(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/asset/id_proof/upload | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    ///organization/ai_bot/config/alter
    app.post('/' + global.config.version + '/organization/ai_bot/config/alter', async (req, res) => {
        try {
            let result = await adminOpsService.organizationInlineDataUpdate(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
            //global.logger.write('conLog', err, {}, {});
            util.logError(req.body,`organization/ai_bot/config/alter Error %j`, { err });
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    //organization/config/update
    app.post('/' + global.config.version + '/organization/config/update', async (req, res) => {
        try {
            let result = await adminOpsService.updateOrganizationFeatureInlineData(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
            //global.logger.write('conLog', err, {}, {});
            util.logError(req.body,`organization/config/update Error %j`, { err });
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });
     
    //organization/form-tag/update
    app.post('/' + global.config.version + '/organization/form-tag/update', async (req, res) => {
        try {
            let result = await adminOpsService.updateOrganizationFormTagFlag(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
            //global.logger.write('conLog', err, {}, {});
            util.logError(req.body,`organization/form-tag/update Error %j`, { err });
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });
     
    //Check Manager Details
    app.post('/' + global.config.version + '/admin/manager/assets/list', async (req, res) => {
        const [err, data] = await adminOpsService.checkManagerDetails(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/manager/assets/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/organization/ai_bot/set', async (req, res) => {
        try {
            let result = await adminOpsService.updateOrganizationAIBot(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
            //global.logger.write('conLog', err, {}, {});
            util.logError(req.body,`organization/ai_bot/set Error %j`, { err });
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/signup', async (req, res) => {
        try {
            let result = await adminOpsService.processSignup(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
            //global.logger.write('conLog', err, err, err);
            util.logError(req.body,`/asset/signup Error %j`, { err });
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    // Update workbook mapping for a workflow
    app.post('/' + global.config.version + '/admin/activity/workbook/update', async function (req, res) {
        const [err, responseData] = await adminOpsService.updateWorkbookMappingForWorkflow(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/activity/workbook/update: ", err);
            // res.json(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });
    

    app.post('/' + global.config.version + '/admin/tag_type/alter', async (req, res) => {
        const [err, responseData] = await adminOpsService.tagTypeUpdate(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/tag_type/alter | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag/entity/mapping/map', async (req, res) => {
        const [err, responseData] = await adminOpsService.tagEntityMappingInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/tag/entity/mapping/map | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag/entity/mapping/unmap', async (req, res) => {
        const [err, responseData] = await adminOpsService.tagEntityMappingDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/tag/entity/mapping/unmap | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/asset/entity/mapping', async (req, res) => {
        const [err, responseData] = await adminOpsService.assetAccessRoleMappingInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/asset/entity/mapping | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });    

    app.post('/' + global.config.version + '/admin/asset/entity-mapping/set', async (req, res) => {
        const [err, responseData] = await adminOpsService.assetAccessRoleMappingUpdate(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/asset/entity/mapping | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });    

    // To add dotted managers
    app.post('/' + global.config.version + '/admin/asset/manager/dotted/add', async (req, res) => {
        const [err, responseData] = await adminOpsService.addDottedManagerForAsset(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/admin/asset/manager/dotted/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });

    // To remove dotted managers
    app.post('/' + global.config.version + '/admin/asset/manager/dotted/remove', async (req, res) => {
        const [err, responseData] = await adminOpsService.removeDottedManagerForAsset(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/admin/asset/manager/dotted/remove | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });

    // To list dotted managers
    // If flag = 0 then select a check mapping for a particular asset and manager
    // If flag = 1 THEN select all managers (direct / indirect / dotted) for a given asset
    // If flag = 2 then select all managers ( dotted) for a given asset
    // If flag = 3 then select all managers (direct / indirect ) for a given asset
    // If flag = 4 then select all employees reporting (direct / indirect / dotted) to a given asset 
    // If flag = 5 then select all employees reporting ( dotted) to a given asset 
    // If flag = 6 then select all employees reporting (direct / indirect d) to a given asset 
    app.post('/' + global.config.version + '/admin/asset/manager/dotted/list', async (req, res) => {
        const [err, responseData] = await adminOpsService.listDottedManagerForAsset(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/admin/asset/manager/dotted/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/asset/move/organization', async (req, res) => {
        const [err, responseData] = await adminOpsService.moveEmployeeDeskToAnotherOrganization(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/move/asset/organization | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    }); 
    app.post('/' + global.config.version + '/admin/send/asset/invite', async (req, res) => {
        const [err, responseData] = await adminOpsService.sendInviteText(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/send/asset/invite | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/workflow/dependent_form/check', async (req, res) => {
        const [err, responseData] = await adminOpsService.dependedFormCheck(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/workflow/dependent_form/check | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag/update', async function (req, res) {
        const [err, responseData] = await adminOpsService.tagupdate(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/tag/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/get/asset/access', async (req, res) => {
        const [err, responseData] = await adminOpsService.getAssetAccessDetails(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/get/asset/access | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/workflow/dependent_form/check/v1', async (req, res) => {
        //const err = false, responseData = [];
        const [err, responseData] = await adminOpsService.dependencyFormsCheck(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/workflow/dependent_form/check/v1 | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/workflow/dependent_form/check/v2', async (req, res) => {
        const [err, responseData] = await adminOpsService.dependedFormCheckWrapper(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/workflow/dependent_form/check | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });
    
    app.post('/' + global.config.version + '/admin/form/access/share', async (req, res) => {
        //const err = false, responseData = [];
        const [err, responseData] = await adminOpsService.formAccessSegmentOrgLevel(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/form/access/share | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });  
    
    //to get the status based and prerequisite met Forms List
    app.post('/' + global.config.version + '/form/access/status/list/v1', async (req, res) => {        
        const [err, responseData] = await adminOpsService.getStatusBasedPreRequisiteMetFormsList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/form/access/share | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/access/status/list/v2', async (req, res) => {        
        const [err, responseData] = await adminOpsService.getStatusBasedPreRequisiteMetFormsListV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/form/access/share | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/submission-type/alter', async (req, res) => {
        const [err, responseData] = await adminOpsService.formConverter(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/form/access/share | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/asset/access/reset', async function (req, res) {
        const [err, responseData] = await adminOpsService.assetAccessMappingUpdateState(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/asset/access/reset | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/asset/role/approval/update', async function (req, res) {
        const [err, responseData] = await adminOpsService.updateApprovalDetails(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/asset/access/reset | Error: ", err);
            res.json(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/manger/assets/list/V1', async (req, res) => {
        const [err, data] = await adminOpsService.getUsersByManger(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/manager/assets/list/V1 | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/form/access/share/V1', async (req, res) => {
        const [err, data] = await adminOpsService.formEntityMappingInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/form/access/shareV1 | Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/activity/lead/set', async (req, res) => {
        const [err, data] = await adminOpsService.addAssetAsLead(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/activity/lead/set| Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

        // Organization name update
    app.post('/' + global.config.version + '/organization/cover/alter', async (req, res) => {
        const [err, data] = await adminOpsService.updateOrganizationName(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/organization/cover/alter| Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // Building name update
    app.post('/' + global.config.version + '/account/cover/alter', async (req, res) => {
        const [err, data] = await adminOpsService.updateBuildingName(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/account/cover/alter| Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // Update asset manager mapping flag
    app.post('/' + global.config.version + '/dottedmanager/flag/alter', async (req, res) => {
        const [err, data] = await adminOpsService.updateAssetManagerMappingFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/dottedmanager/flag/alter| Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // bot on field list
    app.post('/' + global.config.version + '/admin/field/bot/select', async (req, res) => {
        const [err, data] = await adminOpsService.selectBotOnField(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/bot/field/list| Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // Account check for dotted manager
    app.post('/' + global.config.version + '/dottedmanager/access/account/check', async (req, res) => {
        const [err, data] = await adminOpsService.accountCheckForDottedManager(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/dottedmanager/access/account/check| Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    //--------------------------------------
	//send broadcast messages.
    app.post('/' + global.config.version + '/admin/send/broadcastmessage', async function (req, res) {
        const [err, orgData] = await adminOpsService.messageBroadCast(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/send/broadcastmessage | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    
    //--------------------------------------
	//Select the list of broadcast messages.
    app.post('/' + global.config.version + '/admin/broadcast/list', async function (req, res) {
        const [err, orgData] = await adminOpsService.getBroadCardList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/broadcast/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    
    //--------------------------------------
	//Get the count who have read/unread the broadcast messages.
    app.post('/' + global.config.version + '/admin/broadcast/asset/count', async function (req, res) {
        const [err, orgData] = await adminOpsService.getAssetCountWhoReadUnReadBroadMessage(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/broadcast/asset/count | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });


    //--------------------------------------
    //Get the list of user(asset) who have read / unread the broadcast message.
    app.post('/' + global.config.version + '/admin/broadcast/asset/list', async function (req, res) {
        const [err, orgData] = await adminOpsService.getListOfAssetsWhoReadUnReadBroadMessage(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/broadcast/asset/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });


    //--------------------------------------
    //Update broadcast_flag_read for an asset.
    app.post('/' + global.config.version + '/admin/broadcast/updateflag', async function (req, res) {
        const [err, orgData] = await adminOpsService.updateBroadCastMessageFlagForEachAsset(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/broadcast/updateflag | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    //--------------------------------------
    //get All/Read/UnRead/Archive BroadCast Message For Asset
    app.post('/' + global.config.version + '/admin/asset/broadcastlist', async function (req, res) {
        const [err, orgData] = await adminOpsService.getAllReadUnReadArchiveBroadCastMessageForAsset(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/asset/broadcastlist | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/asset/account/mapped/list', async function (req, res) {
        const [err, accData] = await adminOpsService.getAdminAssetMappedList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, accData, 200, req.body));
        } else {
            console.log("/admin/asset/account/mapped/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, accData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/organization/form-tag/flag/update', async function (req, res) {
        const [err, accData] = await adminOpsService.updateOrganizationFormTagFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, accData, 200, req.body));
        } else {
            console.log("/organization/form-tag/flag/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, accData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/organization/form-tag/flag/update/v1', async function (req, res) {
        const [err, accData] = await adminOpsService.updateOrganizationFormTagFlagV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, accData, 200, req.body));
        } else {
            console.log("/organization/form-tag/flag/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, accData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/cognito/user/add', async function (req, res) {
        const [err, orgData] = await adminOpsService.addUsersToCognitoManual(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/admin/cognito/user/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/admin/workflow/activity-type/draft/update', async function (req, res) {
        const [err, flagData] = await adminOpsService.typeMappingUpdateFlagDraft(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, flagData, 200, req.body));
        } else {
            console.log("/admin/workflow/activity-type/draft/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, flagData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/workflow/preview_enabled/flag/update', async function (req, res) {
        const [err, flagData] = await adminOpsService.updatePreviewEnabledFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, flagData, 200, req.body));
        } else {
            console.log("/admin/workflow/preview_enabled/flag/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, flagData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/retrieve/workforce/tags', async function (req, res) {
        const [err, flagData] = await adminOpsService.getListOfTagsUnderCategory(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, flagData, 200, req.body));
        } else {
            console.log("/retrieve/workforce/tags | Error: ", err);
            res.json(responseWrapper.getResponse(err, flagData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/admin/asset/access/mapping/list', async function (req, res) {
        const [err, flagData] = await adminOpsService.assetTypeAccessMappingSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, flagData, 200, req.body));
        } else {
            console.log("/retrieve/workforce/tags | Error: ", err);
            res.json(responseWrapper.getResponse(err, flagData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/admin/asset/access/mapping/delete', async function (req, res) {
        const [err, flagData] = await adminOpsService.assetTypeAccessMappingDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, flagData, 200, req.body));
        } else {
            console.log("/retrieve/workforce/tags | Error: ", err);
            res.json(responseWrapper.getResponse(err, flagData, -9999, req.body));
        }
    });


        //  add new filter for organization
        app.post("/" + global.config.version + "/organization/filter/tag/type/mapping/insert", async function (req, res) {
            const [err, result] = await adminOpsService.organizationFilterTagTypeMappingInsert(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/organization/filter/tag/type/mapping/insert | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });
    
        //  delete filter for organization
        app.post("/" + global.config.version + "/organization/filter/tag/type/mapping/delete", async function (req, res) {
            const [err, result] = await adminOpsService.organizationFilterTagTypeMappingDelete(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/organization/filter/tag/type/mapping/delete | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });
    
        // update filter for organization
        app.post("/" + global.config.version + "/organization/filter/tag/type/mapping/update", async function (req, res) {
            const [err, result] = await adminOpsService.organizationFilterTagTypeMappingUpdate(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/organization/filter/tag/type/mapping/update | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });
    
        // get all filters for organization
        app.post("/" + global.config.version + "/organization/filter/tag/type/mapping/get", async function (req, res) {
            const [err, result] = await adminOpsService.getOrganizationFilterTagTypeMapping(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/organization/filter/tag/type/mapping/get | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });
    
        // add tag_type for application 
        app.post("/" + global.config.version + "/application/tag/type/mapping/insert", async function (req, res) {
            const [err, result] = await adminOpsService.applicationTagTypeMappingInsert(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/application/tag/type/mapping/insert | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/application/master/insert", async function (req, res) {
            const [err, result] = await adminOpsService.applicationMasterInsert(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/application/master/insert | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/application/master/select", async function (req, res) {
            const [err, result] = await adminOpsService.applicationMasterSelect(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/application/master/select | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/application/master/delete", async function (req, res) {
            const [err, result] = await adminOpsService.applicationMasterDelete(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/application/master/delete | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/asset/type/mapping/insert", async function (req, res) {
            const [err, result] = await adminOpsService.assetTypeAccessMappingInsertV1(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/asset/type/mapping/insert | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/asset/list/update/export/flag", async function (req, res) {
            const [err, result] = await adminOpsService.assetListUpdateFlagExport(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/asset/list/update/export/flag | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/application/master/update", async function (req, res) {
            const [err, result] = await adminOpsService.applicationMasterUpdate(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/application/master/update | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/widget/drilldown/header/mapping/insert", async function (req, res) {
            const [err, result] = await adminOpsService.widgetDrilldownHeaderMappingInsert(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/widget/drilldown/header/mapping/insert | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/widget/drilldown/header/mapping/delete", async function (req, res) {
            const [err, result] = await adminOpsService.widgetDrilldownHeaderMappingDelete(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/widget/drilldown/header/mapping/delete | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/widget/drilldown/header/mapping/update", async function (req, res) {
            const [err, result] = await adminOpsService.widgetDrilldownHeaderMappingUpdate(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/widget/drilldown/header/mapping/update | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/widget/drilldown/header/mapping/select", async function (req, res) {
            const [err, result] = await adminOpsService.widgetDrilldownHeaderMappingSelect(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/widget/drilldown/header/mapping/select | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/widget/drilldown/header/master/select", async function (req, res) {
            const [err, result] = await adminOpsService.widgetDrilldownHeaderMasterSelect(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/widget/drilldown/header/master/select | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/asset_type/access/mapping/select/activity_type", async function (req, res) {
            const [err, result] = await adminOpsService.assetTypeAccessMappingSelectActivityType(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/asset_type/access/mapping/select/activity_type | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/asset_type/access/mapping/delete", async function (req, res) {
            const [err, result] = await adminOpsService.assetTypeAccessMappingDeleteAdmin(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/asset_type/access/mapping/delete | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/application/tag_type/mapping/update", async function (req, res) {
            const [err, result] = await adminOpsService.applicationTagTypeMappingUpdate(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/application/tag_type/mapping/update | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/application/master/sequence/update", async function (req, res) {
            const [err, result] = await adminOpsService.applicationMasterSequenceUpdate(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/application/tag_type/mapping/update | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/org/filter/tag/mapping/inline/update", async function (req, res) {
            const [err, result] = await adminOpsService.organizationFilterTagTypeMappingUpdateInline(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/application/tag_type/mapping/update | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/activity_type/mapping/dashboard/update", async function (req, res) {
            const [err, result] = await adminOpsService.workforceActivityTypeMapiingDashboardUpdate(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/activity_type/mapping/dashboard/update | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/role/access/share", async function (req, res) {
            const [err, result] = await adminOpsService.shareRoleToAnyLevel(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/activity_type/mapping/dashboard/update | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/report/type/master/list", async function (req, res) {
            const [err, result] = await adminOpsService.reportTypeMasterSelect(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/report/type.master/list | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/report/type/master/insert", async function (req, res) {
            const [err, result] = await adminOpsService.reportTypeMasterInsert(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/activity_type/mapping/dashboard/update | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/report/type/master/delete", async function (req, res) {
            const [err, result] = await adminOpsService.reportTypeMasterDelete(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/report/type.master/list | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/workforce/asset_type/mapping/select", async function (req, res) {
            const [err, result] = await adminOpsService.workforceAssetTypeMappingFlagSelect(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/workforce/asset_type/mapping/select | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/asset_type/access/mapping/insert/v1", async function (req, res) {
            const [err, result] = await adminOpsService.assetTypeAccessMappingInsertV1(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("//admin/asset_type/access/mapping/insert/v1 | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/form/field/gemification/score/update", async function (req, res) {
            const [err, result] = await adminOpsService.workforceFormFieldMappingGemificationScoreUpdate(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/form/field/gemification/score/update | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/asset/gamification/transaction/list", async function (req, res) {
            const [err, result] = await adminOpsService.assetGamificationTransactionSelect(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/asset/gamification/transaction/list | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/asset/summary/transaction/list", async function (req, res) {
            const [err, result] = await adminOpsService.assetSummaryTransactionSelect(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/asset/summary/transaction/list | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/asset/monthly/summary/transaction/list", async function (req, res) {
            const [err, result] = await adminOpsService.assetMonthlySummaryTransactionFlagSelect(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/asset/monthly/summary/transaction/list | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/workforce/form/mapping/roleback/flag/update", async function (req, res) {
            const [err, result] = await adminOpsService.workforceFormMappingRolebackFlagUpdate(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/workforce/form/mapping/roleback/flag/update | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/workforce/activity_type/tag/category/select", async function (req, res) {
            const [err, result] = await adminOpsService.workforceActivityTypeMappingTagCategorySelect(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/workforce/activity_type/tag/category/select | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

        app.post("/" + global.config.version + "/admin/asset/summary/transaction/manager/select", async function (req, res) {
            const [err, result] = await adminOpsService.assetSummaryTransactionManagerSelect(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                console.log("/admin/asset/summary/transaction/manager/select | Error: ", err);
                res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
            }
        });

    app.post("/" + global.config.version + "/admin/workforce/list/delete", async function (req, res) {
        const [err, result] = await adminOpsService.workforceListDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            console.log("/admin/workforce/list/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9999, req.body));
        }
    });

}

module.exports = AdminOpsController;
