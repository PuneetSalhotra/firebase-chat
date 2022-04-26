const ArpService = require("../services/arpService");

function ArpController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const arpService = new ArpService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

    app.post('/' + global.config.version + '/arp/asset/setting/flag/alter', async function (req, res) {
        const [err, orgData] = await arpService.updateAssetFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/asset/setting/flag/alter | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/arp/asset/inline/alter', async function (req, res) {
        const [err, orgData] = await arpService.updateAssetBusinessHours(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/asset/inline/alter | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/arp/workforce/setting/flag/alter', async function (req, res) {
        const [err, orgData] = await arpService.updateFloorLevelFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/workforce/setting/flag/alter | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/arp/workforce/inline/alter', async function (req, res) {
        const [err, orgData] = await arpService.updateFloorLevelArpConfig(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/workforce/inline/alter | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/arp/account/inline/alter', async function (req, res) {
        const [err, orgData] = await arpService.updateBuildingLevelArpConfig(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/account/inline/alter | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/arp/persistant/flag/alter', async function (req, res) {
        const [err, orgData] = await arpService.updateFlagPersistRole(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/persistant/flag/alter | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/arp/filters/data', async function (req, res) {
        const [err, orgData] = await arpService.getARPDashboardFiltersData(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/filters/data | Error: ", err);
            res.json(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });    

}

module.exports = ArpController;