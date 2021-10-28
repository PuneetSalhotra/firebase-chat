const TasiService = require("../services/tasiService");

function TasiController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const tasiService = new TasiService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

    app.post('/' + global.config.version + '/tasi/organization/list/update/flag', async function (req, res) {
        const [err, resData] = await tasiService.organizationListUpdateFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/organization/list/update/flag | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/organization/list/insert', async function (req, res) {
        const [err, resData] = await tasiService.organizationListInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/organization/list/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/update/sip/admin/flag', async function (req, res) {
        const [err, resData] = await tasiService.assetUpdateSipAdminFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/update/sip/admin/flag | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/update/flag/frontline', async function (req, res) {
        const [err, resData] = await tasiService.assetUpdateFlagFrontline(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/update/flag/frontline | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset_type/sip/admin/role/update', async function (req, res) {
        const [err, resData] = await tasiService.assetTypeSipAdminRoleUpdate(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset_type/sip/admin/role/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    
    app.post('/' + global.config.version + '/tasi/admin/frontline/role/update', async function (req, res) {
        const [err, resData] = await tasiService.updateFrontlineFlagForRole(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset_type/sip/admin/role/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/admin/frontline/role/select', async function (req, res) {
        const [err, resData] = await tasiService.selectFrontlineRoles(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset_type/sip/admin/role/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/customer/account_type/insert', async function (req, res) {
        const [err, resData] = await tasiService.customerAccountTypeListInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/customer/account_type/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/customer/account_type/delete', async function (req, res) {
        const [err, resData] = await tasiService.customerAccountTypeListDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/customer/account_type/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/customer/account_type/name/update', async function (req, res) {
        const [err, resData] = await tasiService.customerAccountTypeNameUpdate(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/customer/account_type/name/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/customer/account_type/entity_mapping/update', async function (req, res) {
        const [err, resData] = await tasiService.customerAccountTypeEntityMappingUpdate(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/customer/account_type/entity_mapping/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/customer/account_type/list', async function (req, res) {
        const [err, resData] = await tasiService.customerAccountTypeList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/customer/account_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/customer/account_mapping/insert', async function (req, res) {
        const [err, resData] = await tasiService.assetCustomerAccountMappingInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/customer/account_mapping/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/asset/customer/account_mapping/delete', async function (req, res) {
        const [err, resData] = await tasiService.assetCustomerAccountMappingDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/customer/account_mapping/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/customer/account_mapping/list', async function (req, res) {
        const [err, resData] = await tasiService.assetCustomerAccountMappingList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/customer/account_mapping/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/payout/insert', async function (req, res) {
        const [err, resData] = await tasiService.payoutListInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/payout/delete', async function (req, res) {
        const [err, resData] = await tasiService.payoutListDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/payout/inline/update', async function (req, res) {
        const [err, resData] = await tasiService.payoutListUpdateInline(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/inline/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/widget/type/master/sip/list', async function (req, res) {
        const [err, resData] = await tasiService.widgetTypeMasterSipSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/widget/type/master/sip/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/widget/type/master/insert', async function (req, res) {
        const [err, resData] = await tasiService.widgetTypeMasterSipInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/widget/type/master/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/common/measurement/category/master/select', async function (req, res) {
        const [err, resData] = await tasiService.commonMeasurementCatagoryMasterList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/common/measurement/category/master/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/common/measure/master/list', async function (req, res) {
        const [err, resData] = await tasiService.commonMeasurementMasterList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/common/measure/master/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/asset/admin/access/mapping/insert', async function (req, res) {
        const [err, resData] = await tasiService.addSpecificAdminUserAccess(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/admin/access/mapping/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/admin/access/mapping/select', async function (req, res) {
        const [err, resData] = await tasiService.assetAdminAccessList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/admin/access/mapping/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/admin/access/mapping/delete', async function (req, res) {
        const [err, resData] = await tasiService.removeSpecificAdminUserAccess(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/admin/access/mapping/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/entity/target/mapping/insert', async function (req, res) {
        const [err, resData] = await tasiService.addEntityTargetMapping(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/mapping/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/entity/target/mapping/delete', async function (req, res) {
        const [err, resData] = await tasiService.removeEntityTargetMapping(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/mapping/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/entity/target/mapping/list', async function (req, res) {
        const [err, resData] = await tasiService.entityTargetMappingList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/mapping/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/payout/list', async function (req, res) {
        const [err, resData] = await tasiService.payoutList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/admin/access/type/category/list', async function (req, res) {
        const [err, resData] = await tasiService.adminAccessTypeCategorySelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/admin/access/type/category/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/admin/access/type/list', async function (req, res) {
        const [err, resData] = await tasiService.adminAccessTypesSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/admin/access/type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/payout/entity/mapping/insert', async function (req, res) {
        const [err, resData] = await tasiService.payoutEntityMappingInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/entity/mapping/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/payout/entity/mapping/delete', async function (req, res) {
        const [err, resData] = await tasiService.payoutEntityMappingDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/entity/mapping/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/payout/entity/mapping/list', async function (req, res) {
        const [err, resData] = await tasiService.payoutEntityMappingSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/entity/mapping/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/period/type/master/list', async function (req, res) {
        const [err, resData] = await tasiService.periodTypeMasterSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/period/type/master/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/payout/type/master/list', async function (req, res) {
        const [err, resData] = await tasiService.payoutTypeMasterSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/type/master/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/payout/type/master/insert', async function (req, res) {
        const [err, resData] = await tasiService.payoutTypeMasterInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/type/master/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/payout/type/master/delete', async function (req, res) {
        const [err, resData] = await tasiService.payoutTypeMasterDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/type/master/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/payout/category/master/list', async function (req, res) {
        const [err, resData] = await tasiService.payoutCategoryMasterList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/category/master/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/widget/timeline/master/list', async function (req, res) {
        const [err, resData] = await tasiService.widetTimelineMasterSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/widget/timeline/master/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/tag/entity/mapping/workforce/list', async function (req, res) {
        const [err, resData] = await tasiService.tagEntityMappingSelectWorkforce(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/tag/entity/mapping/workforce/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/report/final/flag/update', async function (req, res) {
        const [err, resData] = await tasiService.reportListUpdateFlafFinal(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/report/final/flag/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/report/list', async function (req, res) {
        const [err, resData] = await tasiService.reportListSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/report/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/payout/report/insert', async function (req, res) {
        const [err, resData] = await tasiService.payoutReportInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/report/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/report/list/delete', async function (req, res) {
        const [err, resData] = await tasiService.reportListdelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/report/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/target/type/master/select', async function (req, res) {
        const [err, resData] = await tasiService.targetTypeMasterSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/target/type/master/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/tasi/frontline/history/select', async function (req, res) {
        const [err, resData] = await tasiService.targetFrontlineHistorySelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/frontline/history/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/validation/select', async function (req, res) {
        const [err, resData] = await tasiService.validationSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/validation/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/validation/insert', async function (req, res) {
        const [err, resData] = await tasiService.validationInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/validation/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/validation/delete', async function (req, res) {
        const [err, resData] = await tasiService.validationDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/validation/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/inputList/insert', async function (req, res) {
        const [err, resData] = await tasiService.inputListInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/inputList/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/lov/product_list/select', async function (req, res) {
        const [err, resData] = await tasiService.lovTasiProductListSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/lov/product_list/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/validation_list/update', async function (req, res) {
        const [err, resData] = await tasiService.validationListUpdateTarget(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/validation_list/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/validation_list/entity/select', async function (req, res) {
        const [err, resData] = await tasiService.validationListSelectEntity(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/validation_list/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/freeze/flag/update', async function (req, res) {
        const [err, resData] = await tasiService.updateFreezeFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/freeze/flag/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/entity/target/setting/select/freeze', async function (req, res) {
        const [err, resData] = await tasiService.entityTargetSettingSelectFreeze(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/setting/select/freeze | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/entity/target/setting/select', async function (req, res) {
        const [err, resData] = await tasiService.entityTargetSettingSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/setting/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/entity/target/setting/update/freeze', async function (req, res) {
        const [err, resData] = await tasiService.entityTargetSettingUpdateFlagFreeze(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/setting/update/freeze | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/entity/target/setting/insert', async function (req, res) {
        const [err, resData] = await tasiService.entityTargetSettingInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/setting/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/entity/target/setting/delete', async function (req, res) {
        const [err, resData] = await tasiService.entityTargetSettingDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/outlier/flag/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/entity/target/mapping/update/target', async function (req, res) {
        const [err, resData] = await tasiService.entityTargetMappingUpdateTarget(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/mapping/update/target | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/report/list/select/payout', async function (req, res) {
        const [err, resData] = await tasiService.reportListSelectPayout(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("tasi/report/list/select/payout | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/validation/list/history/select', async function (req, res) {
        const [err, resData] = await tasiService.validationListHistorySelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/validation/list/history/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/entity/target/setting/select/target', async function (req, res) {
        const [err, resData] = await tasiService.entityTargetSettingSelectTarget(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/setting/select/target | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/tasi/entity/target/mapping/history/select', async function (req, res) {
        const [err, resData] = await tasiService.entityTargetMappingHistorySelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/mapping/history/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/input/list/history/list', async function (req, res) {
        const [err, resData] = await tasiService.inputListHistorySelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/input/list/history/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/report/list/update/flagValidated', async function (req, res) {
        const [err, resData] = await tasiService.reportListUpdateFlagValidated(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/report/list/update/flagValidated | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/asset/list/flag-simulation/update', async function (req, res) {
        const [err, resData] = await tasiService.assetListUpdateFlagSimulation(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/list/flag-simulation/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/payout/audit/log/list', async function (req, res) {
        const [err, resData] = await tasiService.payoutAuditLogListing(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/audit/log/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/customer/account/type/list', async function (req, res) {
        const [err, resData] = await tasiService.customerAccountTypeHistoryListing(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/customer/account/type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/period/account/mapping/list', async function (req, res) {
        const [err, resData] = await tasiService.accountMappingByPeriodList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/period/account/mapping/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/payout/report/override/insert', async function (req, res) {
        const [err, resData] = await tasiService.payoutReportOverrideLog(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/report/override | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/payout/report/override/list', async function (req, res) {
        const [err, resData] = await tasiService.overrideLogList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/report/override/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/input/filter/list', async function (req, res) {
        const [err, resData] = await tasiService.inputListSelectFilter(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/input/filter/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/report/simulation/list', async function (req, res) {
        const [err, resData] = await tasiService.reportListSimulationSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/report/simulation/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/entity/target/mapping/list/V1', async function (req, res) {
        const [err, resData] = await tasiService.entityTargetMappingListV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/mapping/list/V1 | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/widget/type/category/select', async function (req, res) {
        const [err, resData] = await tasiService.widgetTypeCategoryMasterSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/widget/type/category/select | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/account/target/setting/insert', async function (req, res) {
        const [err, resData] = await tasiService.accountTargetSettingInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/account/target/setting/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/account/target/setting/delete', async function (req, res) {
        const [err, resData] = await tasiService.accountTargetSettingDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/account/target/setting/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/account/target/setting/list', async function (req, res) {
        const [err, resData] = await tasiService.accountTargetSettingSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/account/target/setting/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/account/coverage/insert', async function (req, res) {
        const [err, resData] = await tasiService.accountCoverageListInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/account/coverage/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/productive/infra/insert', async function (req, res) {
        const [err, resData] = await tasiService.productiveInfraListInsert(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/productive/infra/insert | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/account/coverage/delete', async function (req, res) {
        const [err, resData] = await tasiService.accountCoverageListDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/account/coverage/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/productive/infra/delete', async function (req, res) {
        const [err, resData] = await tasiService.productiveInfraListDelete(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/productive/infra/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/account/coverage/list', async function (req, res) {
        const [err, resData] = await tasiService.accountCoverageListSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/account/coverage/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/productive/infra/list', async function (req, res) {
        const [err, resData] = await tasiService.productiveInfraListSelect(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/productive/infra/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

}

module.exports = TasiController;
