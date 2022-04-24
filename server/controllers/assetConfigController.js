/*
 *author: Sri Sai Venkatesh 
 * 
 */

let AssetConfigService = require("../services/assetConfigService");


function AssetConfigController(objCollection) {

    let responseWrapper = objCollection.responseWrapper;
    let util = objCollection.util;
    let app = objCollection.app;

    const assetConfigService = new AssetConfigService();
    
    app.post('/' + global.config.version + '/asset_type/access/workforce/list', function (req, res) {
        assetConfigService.getAssetTypesList(req.body, (err, data, statusCode) => {

            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                //console.log('did not get proper response');
                //global.logger.write('debug', 'did not get proper response', err, req.body);
                util.logError(req.body,`getAssetTypesList debug did not get proper response Error %j`, { err,body : req.body });
                data = new Array();
                res.json(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });


    // Service to set/alter/reset suspension fields for a role 
    app.post('/' + global.config.version + '/asset/suspension/workforce-asset-type/set', async (req, res) => {
        const [err, data] = await assetConfigService.updateWorkforceAssetType(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });


    //Service to set/reset suspension for an asset
    app.post('/' + global.config.version + '/asset/list/suspension/alter', async (req, res) => {
        const [err, data] = await assetConfigService.updateAssetListSuspension(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });


    //Service to return reporting users with provision to filter following criteria
    app.post('/' + global.config.version + '/asset/manager/list', async (req, res) => {
        const [err, data] = await assetConfigService.selectAssetManager(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    });    

    app.post('/' + global.config.version + '/excel/upload_type/add', async (req, res) => {
        const [err, responseData] = await assetConfigService.inputTypeMasterInsert(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/excel/upload_type/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/excel/upload_type/delete', async (req, res) => {
        const [err, responseData] = await assetConfigService.inputTypeMasterDelete(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/excel/upload_type/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/excel/upload_type/list', async (req, res) => {
        const [err, responseData] = await assetConfigService.getInPutTypeMaster(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("excel/upload_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/excel/upload/add', async (req, res) => {
        const [err, responseData] = await assetConfigService.inputListInsert(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/excel/upload/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/excel/upload/add/V1', async (req, res) => {
        const [err, responseData] = await assetConfigService.inputListInsertV1(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/excel/upload/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/excel/upload/add/V2', async (req, res) => {
        const [err, responseData] = await assetConfigService.inputListInsertV2(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/excel/upload/add | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/excel/upload/update', async (req, res) => {
        const [err, responseData] = await assetConfigService.inputListUpdate(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/excel/upload/update | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/excel/upload/delete', async (req, res) => {
        const [err, responseData] = await assetConfigService.inputListDelete(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/excel/upload/delete | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/excel/upload/list', async (req, res) => {
        console.log("vijay")
        const [err, responseData] = await assetConfigService.getInputList(req.body);        
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/excel/upload/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err }, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/asset/arp/data/set', async (req, res) => {        

        let [err,result] = await assetConfigService.assetUpdateARPData(req.body);
        if(!err){
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });
}


module.exports = AssetConfigController;