const DrsService = require('../services/drsService');

function DrsController(objCollection) 
{
    const drsService = new DrsService(objCollection);   
    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;

    
    //Service to update the access to document repository
    app.post('/' + global.config.version + '/drs/doc-repo/access/set', async (req, res) => {        
        const [err, data] = await drsService.updateAccessToDocRepo(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });


    //Service to share document repository to a specific role
    app.post('/' + global.config.version + '/drs/doc-repo/specific-role/access/set', async (req, res) => {
        const [err, data] = await drsService.shareDRSToASpecificRole(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });

    //Service to remove sharing of a document repository to a specific role
    app.post('/' + global.config.version + '/drs/doc-repo/specific-role/access/reset', async (req, res) => {
        const [err, data] = await drsService.removeDRSToASpecificRole(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });

    
    //Service to create a folder in document repository
    app.post('/' + global.config.version + '/drs/doc-repo/add', async (req, res) => {
        const [err, data] = await drsService.createFolder(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });


    //Service to update tag to a document repository folder
    app.post('/' + global.config.version + '/drs/doc-repo/tag/update', async (req, res) => {
        const [err, data] = await drsService.updateDRSForTag(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });

    // Service to list document repository types accessible to the user
    app.post('/' + global.config.version + '/drs/doc-repo/accessible', async (req, res) => {
        const [err, data] = await drsService.selectDRSAsset(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });

    // Service to list folders for a selected document repository type
    app.post('/' + global.config.version + '/drs/doc-repo/list/select', async (req, res) => {
        const [err, data] = await drsService.selectDRSList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });

    // Service to list document repository types accessible to the user
    app.post('/' + global.config.version + '/drs/doc-repo/types/accessible/select', async (req, res) => {
        const [err, data] = await drsService.selectDRSTypesAccessible(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });

    //To search document repository list for specified type or tag
    app.post('/' + global.config.version + '/drs/doc-repo/list/search', async (req, res) => {
        const [err, data] = await drsService.dRSListSearch(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });

    // Service to set/alter/reset suspension fields for a role 
    app.post('/' + global.config.version + '/drs/doc-repo/WorkforceAssetType/update', async (req, res) => {
        const [err, data] = await drsService.updateWorkforceAssetType(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });

    //Service to set/reset suspension for an asset
    app.post('/' + global.config.version + '/drs/doc-repo/asset-list/suspension/update', async (req, res) => {
        const [err, data] = await drsService.updateAssetListSuspension(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });

    //Service to return reporting users with provision to filter following criteria
    app.post('/' + global.config.version + '/drs/doc-repo/asset-manager/select', async (req, res) => {
        const [err, data] = await drsService.selectAssetManager(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });

}

module.exports = DrsController;