/*
 *author: Sri Sai Venkatesh 
 * 
 */

var AssetConfigService = require("../services/assetConfigService");


function AssetConfigController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;

    var assetConfigService = new AssetConfigService();
    
    app.post('/' + global.config.version + '/asset_type/access/workforce/list', function (req, res) {
        assetConfigService.getAssetTypesList(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                console.log('did not get proper response');
                data = new Array();
                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });

    });    

}


module.exports = AssetConfigController;