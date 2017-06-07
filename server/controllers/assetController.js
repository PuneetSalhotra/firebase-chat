/*
 *author: Sri Sai Venkatesh 
 * 
 */

var AssetService = require("../services/assetService");
var ActivityCommonService = require("../services/activityCommonService");

function AssetController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;

    var activityCommonService = new ActivityCommonService(objCollection.db, objCollection.util);
    var assetService = new AssetService(objCollection.db, objCollection.util, objCollection.cacheWrapper, activityCommonService);

    app.put('/' + global.config.version + '/asset/passcode/alter', function (req, res) {
        
        assetService.getPhoneNumberAssets(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset/passcode/check', function (req, res) {
        
        assetService.checkAssetPasscode(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });


    });
    
    app.post('/' + global.config.version + '/asset/inline/collection', function (req, res) {
        req.body['module'] = 'asset';
        assetService.getAssetDetails(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });


    });

    app.put('/' + global.config.version + '/asset/link/set', function (req, res) {
        
        assetService.linkAsset(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response   

                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                return;
            } else {
                //console.log('did not get proper rseponse');
                data = {}
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });

    });  

}

module.exports = AssetController;