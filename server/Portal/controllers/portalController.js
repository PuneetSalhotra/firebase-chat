/*
 *author: Rajendra Solanki
 * 
 */

let PortalService = require("../services/portalServices.js");

function PortalController(objCollection) {

    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    let portalService = new PortalService(objCollection);
    const util = objCollection.util;

    /*
     * Get Activity Status Types
     */
    app.post('/' + global.config.version + '/workforceActivityStatusMappingSelect', async (req, res) => {
        let string = "workforceActivityStatusMappingSelect - " + JSON.stringify(req.body);
        objCollection.util.writeLogs(string);

        let [err, result] = await portalService.workforceActivityStatusMappingSelect(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }

    });

    /*
     * Get complete workforce list in the account
     */
    app.post('/' + global.config.version + '/workforceListSelectAccount1', async (req, res) => {
        let string = "workforceListSelectAccount1 - " + JSON.stringify(req.body);
        objCollection.util.writeLogs(string);

        let [err, result] = await portalService.workforceListSelectAccount1(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }

    });

    /*
     * Get employee register information by employee search
     * @param organization_id, account_id, workforce_id, asset_type_category_id, search_string, start_from, limit_value﻿
     */
    app.post('/' + global.config.version + '/getSearchEmployeeRegisterData', async (req, res) => {
        let string = "getSearchEmployeeRegisterData - " + JSON.stringify(req.body);
        objCollection.util.writeLogs(string);

        let dataString = {
            organization_id: req.body.organization_id,
            account_id: req.body.account_id,
            workforce_id: req.body.workforce_id,
            asset_type_category_id: req.body.asset_type_category_id,
            search_string: req.body.search_string,
            start_from: req.body.start_from,
            limit_value: req.body.limit_value
        };
        let [err, data] = await portalService.assetListSearchAssetTypeCategory(dataString);
        if (err === false && data.length > 0) {
            let k = 0;
            recursiveGetDeskInfo(k);
            async function recursiveGetDeskInfo(k) {
                let eData = data[k];
                // To ge the desk asset of operating asset
                let dataString1 = {
                    organization_id: eData.organization_id,
                    operating_asset_id: eData.asset_id
                };
                let [err1, data1] = await portalService.assetListSelectOperatingAsset(dataString1);
                if (err1 === false && data1.length > 0) {
                    data[k].desk_asset_id = data1[0].asset_id;
                    data[k].desk_asset_first_name = data1[0].asset_first_name;
                } else {
                    data[k].desk_asset_id = 0;
                    data[k].desk_asset_first_name = "";
                }
                k++;
                if (k < data.length) {
                    recursiveGetDeskInfo(k);
                } else {
                    res.send(responseWrapper.getResponse(err, [], -9998, req.body));
                }
            }
        } else {
            res.send(responseWrapper.getResponse(false, { data: [] }, 200, req.body));
        }
    });

    /*
     * Get assets in the workforce
     */
    app.post('/' + global.config.version + '/assetListSelectAllDesks', async (req, res) => {
        var string = "assetListSelectAllDesks - " + JSON.stringify(req.body);
        objCollection.util.writeLogs(string);

        let [err, result] = await portalService.assetListSelectAllDesks(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }

    });
}

module.exports = PortalController;