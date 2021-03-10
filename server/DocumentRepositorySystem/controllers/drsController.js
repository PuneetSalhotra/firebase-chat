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
    });


    //Service to share document repository to a specific role
    app.post('/' + global.config.version + '/drs/doc-repo/specific-role/access/set', async (req, res) => {
        const [err, data] = await drsService.shareDRSToASpecificRole(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });


    //Service to share document repository to a specific role
    app.post('/' + global.config.version + '/drs/doc-repo/workforce-role/access/set', async (req, res) => {
        const [err, data] = await drsService.shareDRSToASpecificWorkforceRole(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    }); 

    //Service to remove sharing of a document repository to a specific role
    app.post('/' + global.config.version + '/drs/doc-repo/specific-role/access/reset', async (req, res) => {
        const [err, data] = await drsService.removeDRSToASpecificRole(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    
    //Service to create a folder in document repository
    app.post('/' + global.config.version + '/drs/doc-repo/add', async (req, res) => {
        const [err, data] = await drsService.createFolder(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });


    //Service to update tag to a document repository folder
    app.post('/' + global.config.version + '/drs/doc-repo/tag/update', async (req, res) => {
        const [err, data] = await drsService.updateDRSForTag(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // Service to list document repository types accessible to the user
    app.post('/' + global.config.version + '/drs/doc-repo/user/access/list', async (req, res) => {
        const [err, data] = await drsService.selectDRSAsset(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // Service to list folders for a selected document repository type
    app.post('/' + global.config.version + '/drs/doc-repo/list/select', async (req, res) => {
        const [err, data] = await drsService.selectDRSList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // Service to list document repository types accessible to the user
    app.post('/' + global.config.version + '/drs/doc-repo/types/accessible/select', async (req, res) => {
        const [err, data] = await drsService.selectDRSTypesAccessible(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    //To search document repository list for specified type or tag
    app.post('/' + global.config.version + '/drs/doc-repo/list/search', async (req, res) => {
        const [err, data] = await drsService.dRSListSearch(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });
    

    //Service to update(reset) the access to document repository
    app.post('/' + global.config.version + '/drs/doc-repo/access/reset', async (req, res) => {        
        const [err, data] = await drsService.resetAccessToDocRepo(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/drs/doc-repo/access/master/list', async (req, res) => {
        const [err, data] = await drsService.repositoryAccessMasterSelect(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/drs/doc-repo/file/delete', async (req, res) => {
        const [err, data] = await drsService.repositoryFileFolderDelete(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/drs/doc-repo/roles/access/list', async (req, res) => {
        const [err, data] = await drsService.listOfAccessableRoles(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/drs/doc-repo/set/super-admin', async (req, res) => {
        const [err, data] = await drsService.updateDocSuperAdmin(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/drs/doc-repo/users/list', async (req, res) => {
        const [err, data] = await drsService.getDocsAssetList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/drs/doc-repo/add/user/access', async (req, res) => {
        const [err, data] = await drsService.shareDocToAsset(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/drs/doc-repo/remove/user/access', async (req, res) => {
        const [err, data] = await drsService.removeDocToAsset(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });


    //Update Doc Repo folder name
    app.post('/' + global.config.version + '/drs/doc-repo/folder/update', async (req, res) => {
        const [err, data] = await drsService.updateDocRepoFolderName(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

}

module.exports = DrsController;