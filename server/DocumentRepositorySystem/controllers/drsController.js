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

    //Service to create a new folder in s3 and save it into document repository

}

module.exports = DrsController;