/*
 *author: Sri Sai Venkatesh 
 * 
 */

let AssetConfigService = require("../services/assetConfigService");


function AssetConfigController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;

    const assetConfigService = new AssetConfigService();
    
    app.post('/' + global.config.version + '/asset_type/access/workforce/list', function (req, res) {
        assetConfigService.getAssetTypesList(req.body, (err, data, statusCode) => {

            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                //console.log('did not get proper response');
                global.logger.write('debug', 'did not get proper response', err, req.body);
                data = new Array();
                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });


    // Service to set/alter/reset suspension fields for a role 
    app.post('/' + global.config.version + '/asset/suspension/workforce-asset-type/set', async (req, res) => {
        const [err, data] = await assetConfigService.updateWorkforceAssetType(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });


    //Service to set/reset suspension for an asset
    app.post('/' + global.config.version + '/asset/list/suspension/alter', async (req, res) => {
        const [err, data] = await assetConfigService.updateAssetListSuspension(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });


    //Service to return reporting users with provision to filter following criteria
    app.post('/' + global.config.version + '/asset/manager/list', async (req, res) => {
        const [err, data] = await assetConfigService.selectAssetManager(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    });    

}


module.exports = AssetConfigController;