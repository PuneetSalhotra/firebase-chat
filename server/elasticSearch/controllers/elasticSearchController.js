let CommnElasticService = require("../services/elasticSearchService.js");

function elasticSearchController(objCollection) {
    let responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const activityCommonService = objCollection.activityCommonService;
    const commnElasticService = new CommnElasticService(objCollection);

    app.post('/' + global.config.version + '/document/add', async (req, res) => {
            try {
                let result = await commnElasticService.addFile(req.body, res);
            } catch (err) {
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        });

    app.post('/' + global.config.version + '/document/update', async (req, res) => {

            try {
                let result = await commnElasticService.updateFile(req.body, res);
            } catch (err) {
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        });

    app.post('/' + global.config.version + '/document/query', async (req, res) => {            
        const [err, data] = await commnElasticService.getResult(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse({}, data, 200, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, -9999, req.body));
            }
    });
  app.post('/' + global.config.version + '/activity/vidm-data/list', async (req, res) => {
        const [err, data] = await commnElasticService.getVidmData(req.body);
            if (!err) {
                res.json(responseWrapper.getResponse({}, data, 200, req.body));
            } else {
                res.json(responseWrapper.getResponse(err, data, -9999, req.body));
            }
    });

    app.post('/' + global.config.version + '/document/delete', async (req, res) => {
            try {
                let result = await commnElasticService.deleteFile(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        });
/*
    app.post('/' + global.config.version + '/elastic/activity/delete/add', async (req, res) => {
            try {
                let result = await activityCommonService.delteAndInsertInElastic(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        });
        app.post('/' + global.config.version + '/elastic/activity/delete/add/bulk', async (req, res) => {
            try {
                let result = await activityCommonService.delteAndInsertInElasticBulk(req.body);
                res.json(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        });
*/
    app.post('/' + global.config.version + '/elastic/activity/delete/add/multi', async (req, res) => {
        try {
            let result = await activityCommonService.delteAndInsertInElasticMulti(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });        

}

module.exports = elasticSearchController;
