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
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/organization/list/update/flag | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/organization/list/insert', async function (req, res) {
        const [err, resData] = await tasiService.organizationListInsert(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/organization/list/insert | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/update/sip/admin/flag', async function (req, res) {
        const [err, resData] = await tasiService.assetUpdateSipAdminFlag(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/update/sip/admin/flag | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/update/flag/frontline', async function (req, res) {
        const [err, resData] = await tasiService.assetUpdateFlagFrontline(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/update/flag/frontline | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset_type/sip/admin/role/update', async function (req, res) {
        const [err, resData] = await tasiService.assetTypeSipAdminRoleUpdate(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset_type/sip/admin/role/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/customer/account_type/insert', async function (req, res) {
        const [err, resData] = await tasiService.customerAccountTypeListInsert(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/customer/account_type/insert | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/customer/account_type/delete', async function (req, res) {
        const [err, resData] = await tasiService.customerAccountTypeListDelete(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/customer/account_type/delete | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/customer/account_type/name/update', async function (req, res) {
        const [err, resData] = await tasiService.customerAccountTypeNameUpdate(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/customer/account_type/name/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/customer/account_type/entity_mapping/update', async function (req, res) {
        const [err, resData] = await tasiService.customerAccountTypeEntityMappingUpdate(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/customer/account_type/entity_mapping/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/customer/account_type/list', async function (req, res) {
        const [err, resData] = await tasiService.customerAccountTypeList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/customer/account_type/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/customer/account_mapping/insert', async function (req, res) {
        const [err, resData] = await tasiService.assetCustomerAccountMappingInsert(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/customer/account_mapping/insert | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/asset/customer/account_mapping/delete', async function (req, res) {
        const [err, resData] = await tasiService.assetCustomerAccountMappingDelete(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/customer/account_mapping/delete | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/customer/account_mapping/list', async function (req, res) {
        const [err, resData] = await tasiService.assetCustomerAccountMappingList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/customer/account_mapping/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/payout/insert', async function (req, res) {
        const [err, resData] = await tasiService.payoutListInsert(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/insert | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/payout/delete', async function (req, res) {
        const [err, resData] = await tasiService.payoutListDelete(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/delete | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/payout/inline/update', async function (req, res) {
        const [err, resData] = await tasiService.payoutListUpdateInline(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/inline/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/widget/type/master/sip/list', async function (req, res) {
        const [err, resData] = await tasiService.widgetTypeMasterSipSelect(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/widget/type/master/sip/select | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/widget/type/master/insert', async function (req, res) {
        const [err, resData] = await tasiService.widgetTypeMasterSipInsert(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/widget/type/master/insert | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/common/measurement/category/master/select', async function (req, res) {
        const [err, resData] = await tasiService.commonMeasurementCatagoryMasterList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/common/measurement/category/master/select | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/common/measure/master/list', async function (req, res) {
        const [err, resData] = await tasiService.commonMeasurementMasterList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/common/measure/master/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/asset/admin/access/mapping/insert', async function (req, res) {
        const [err, resData] = await tasiService.addSpecificAdminUserAccess(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/admin/access/mapping/insert | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/admin/access/mapping/select', async function (req, res) {
        const [err, resData] = await tasiService.assetAdminAccessList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/admin/access/mapping/select | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/asset/admin/access/mapping/delete', async function (req, res) {
        const [err, resData] = await tasiService.removeSpecificAdminUserAccess(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/asset/admin/access/mapping/delete | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/tasi/entity/target/mapping/insert', async function (req, res) {
        const [err, resData] = await tasiService.addEntityTargetMapping(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/mapping/insert | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/entity/target/mapping/delete', async function (req, res) {
        const [err, resData] = await tasiService.removeEntityTargetMapping(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/mapping/delete | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/entity/target/mapping/list', async function (req, res) {
        const [err, resData] = await tasiService.entityTargetMappingList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/entity/target/mapping/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/tasi/payout/list', async function (req, res) {
        const [err, resData] = await tasiService.payoutList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, resData, 200, req.body));
        } else {
            console.log("/tasi/payout/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, resData, -9999, req.body));
        }
    });


}

module.exports = TasiController;