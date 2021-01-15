const DrsService = require('../services/drsService');

function DrsController(objCollection) 
{
    const drsService = new DrsService(objCollection);   
    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;

    app.post('/' + global.config.version + '/drs/sample/api', async (req, res) => {        
        const [err, data] = await drsService.sampleFunc(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
        res.send(responseWrapper.getResponse({}, [], 200, req.body));
    });

}

module.exports = DrsController;