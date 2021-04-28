const ArpService = require("../services/arpService");

function ArpController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const arpService = new ArpService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

    app.post('/' + global.config.version + '/arp/setting/update/asset/flag', async function (req, res) {
        const [err, orgData] = await arpService.updateAssetFlag(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/setting/update/asset/flag | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/arp/update/asset/businesshours', async function (req, res) {
        const [err, orgData] = await arpService.updateAssetBusinessHours(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/update/asset/businesshours | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/arp/update/floor/level/flag', async function (req, res) {
        const [err, orgData] = await arpService.updateFloorLevelFlag(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/update/floor/level/flag | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/arp/update/floor/level/businesshours', async function (req, res) {
        const [err, orgData] = await arpService.updateAssetBusinessHours(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/update/floor/level/businesshours | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/arp/update/building/level/businesshours', async function (req, res) {
        const [err, orgData] = await arpService.updateFloorLevelFlag(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, orgData, 200, req.body));
        } else {
            console.log("/arp/update/building/level/businesshours | Error: ", err);
            res.send(responseWrapper.getResponse(err, orgData, -9999, req.body));
        }
    });

}

module.exports = ArpController;