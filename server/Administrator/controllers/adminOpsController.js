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
        try {
            JSON.parse(req.body.status_tag_ids);
        } catch (err1) {
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

    // [Redundant] Set Persist Role Flag In The Workforce Activity Type Mapping Table
    // Use /admin/workforce/activity_type/flag_persist_role/update instead
    app.post('/' + global.config.version + '/admin/workforce/activity_type/flag_persist_role/set', async function (req, res) {
        const [err, responseData] = await adminOpsService.workflowUpdatePersistRoleFlag(req.body, 1);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_type/flag_persist_role/set | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // [Redundant] Reset Persist Role Flag In The Workforce Activity Type Mapping Table
    // Use /admin/workforce/activity_type/flag_persist_role/update instead
    app.post('/' + global.config.version + '/admin/workforce/activity_type/flag_persist_role/reset', async function (req, res) {
        const [err, responseData] = await adminOpsService.workflowUpdatePersistRoleFlag(req.body, 0);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce/activity_type/flag_persist_role/reset | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Update Persist Role Flag In The Workforce Activity Type Mapping Table
    app.post('/' + global.config.version + '/admin/workforce/activity_type/flag_persist_role/update', async function (req, res) {
        const [err, responseData] = await adminOpsService.workflowUpdatePersistRoleFlag(req.body, Number(req.body.activity_flag_persist_role) || 0);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            // console.log("/admin/workforce/activity_type/flag_persist_role/upate | Error: ", err);
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

    // Update the Asset Type
    app.post('/' + global.config.version + '/admin/asset_type/alter', async function (req, res) {
        const [err, responseData] = await adminOpsService.updateAssetType(req.body, 0);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/asset_type/alter | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    // Update the Asset's Manager Data
    app.post('/' + global.config.version + '/admin/asset_manager/alter', async function (req, res) {
        const [err, responseData] = await adminOpsService.updateAssetsManagerDetails(req.body, 0);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
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


    //Set Business Hours @Account Level
    app.post('/' + global.config.version + '/admin/account_level/business_hours/set', async function (req, res) {
        try {
            JSON.parse(req.body.account_inline_data);
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, "Invalid JSON - 'account_inline_data'", -3308, req.body));
            return;
        }

        const [err, responseData] = await adminOpsService.setBusinessHoursAccountLevel(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/account_level/business_hours/set | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    //Set Business Hours @Floor(Workforce) Level
    app.post('/' + global.config.version + '/admin/workforce_level/business_hours/set', async function (req, res) {
        try {
            JSON.parse(req.body.workforce_inline_data);
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, "Invalid JSON - 'workforce_inline_data'", -3308, req.body));
            return;
        }

        const [err, responseData] = await adminOpsService.setBusinessHoursWorkforceLevel(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/workforce_level/business_hours/set | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    //Set Business Hours @Individual(Desk) Level
    app.post('/' + global.config.version + '/admin/desk_level/business_hours/set', async function (req, res) {
        try {
            JSON.parse(req.body.asset_inline_data);
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, "Invalid JSON - 'desk_inline_data'", -3308, req.body));
            return;
        }
        const [err, responseData] = await adminOpsService.setBusinessHoursDeskLevel(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/desk_level/business_hours/set | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    // Manually generate the workflow activity for a given origin form
    app.post('/' + global.config.version + '/admin/organization/manual_trigger/workflow/generate', async function (req, res) {
        const [err, responseData] = await formConfigService.workflowEngine(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/organization/manual_trigger/workflow/generate | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/asset/access/set', async function (req, res) {
        const [err, responseData] = await adminOpsService.assetListUpdateAdminFlag(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/asset/access/set | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/activity_type_tag/delete', async function (req, res) {
        const [err, responseData] = await adminOpsService.activityTypeTagDelete(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/activity_type_tag/delete | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag_type/delete', async function (req, res) {
        const [err, responseData] = await adminOpsService.tagTypeDelete(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/tag_type/delete | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    //Upload the ID proof PAN/Adhaar/Passport
    app.post('/' + global.config.version + '/asset/id_proof/upload', async (req, res) => {
        const [err, data] = await adminOpsService.idProofUpload(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/asset/id_proof/upload | Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    ///organization/ai_bot/config/alter
    app.post('/' + global.config.version + '/organization/ai_bot/config/alter', async (req, res) => {
        try {
            let result = await adminOpsService.organizationInlineDataUpdate(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
            global.logger.write('conLog', err, {}, {});
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    //Check Manager Details
    app.post('/' + global.config.version + '/admin/manager/assets/list', async (req, res) => {
        const [err, data] = await adminOpsService.checkManagerDetails(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/admin/manager/assets/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/organization/ai_bot/set', async (req, res) => {
        try {
            let result = await adminOpsService.updateOrganizationAIBot(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
            global.logger.write('conLog', err, {}, {});
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/signup', async (req, res) => {
        try {
            let result = await adminOpsService.processSignup(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
            global.logger.write('conLog', err, err, err);
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    // Update workbook mapping for a workflow
    app.post('/' + global.config.version + '/admin/activity/workbook/update', async function (req, res) {
        const [err, responseData] = await adminOpsService.updateWorkbookMappingForWorkflow(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/activity/workbook/update: ", err);
            // res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag_type/alter', async (req, res) => {
        const [err, responseData] = await adminOpsService.tagTypeUpdate(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/tag_type/alter | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag/entity/mapping/map', async (req, res) => {
        const [err, responseData] = await adminOpsService.tagEntityMappingInsert(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/tag/entity/mapping/map | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag/entity/mapping/unmap', async (req, res) => {
        const [err, responseData] = await adminOpsService.tagEntityMappingDelete(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/tag/entity/mapping/unmap | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/asset/entity/mapping', async (req, res) => {
        const [err, responseData] = await adminOpsService.assetAccessRoleMappingInsert(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/asset/entity/mapping | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });    

    // To add dotted managers
    app.post('/' + global.config.version + '/admin/asset/manager/dotted/add', async (req, res) => {
        const [err, responseData] = await adminOpsService.addDottedManagerForAsset(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/admin/asset/manager/dotted/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });

    // To remove dotted managers
    app.post('/' + global.config.version + '/admin/asset/manager/dotted/remove', async (req, res) => {
        const [err, responseData] = await adminOpsService.removeDottedManagerForAsset(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/admin/asset/manager/dotted/remove | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, 200, req.body));
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
            res.send(responseWrapper.getResponse({}, responseData, 200, req.body));
        } else {
            console.log("/admin/asset/manager/dotted/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, 200, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/asset/move/organization', async (req, res) => {
        const [err, responseData] = await adminOpsService.moveEmployeeDeskToAnotherOrganization(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/move/asset/organization | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    }); 
    app.post('/' + global.config.version + '/admin/send/asset/invite', async (req, res) => {
        const [err, responseData] = await adminOpsService.sendInviteText(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/send/asset/invite | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/workflow/dependent_form/check', async (req, res) => {
        const [err, responseData] = await adminOpsService.dependedFormCheck(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/admin/workflow/dependent_form/check | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/admin/tag/update', async function (req, res) {
        const [err, responseData] = await adminOpsService.tagupdate(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/admin/tag/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

}

module.exports = AdminOpsController;
