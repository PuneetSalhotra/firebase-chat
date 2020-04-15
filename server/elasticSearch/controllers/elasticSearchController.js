const elasticsearch = require('elasticsearch');
var fs = require('fs')
var CommnElasticService = require("../services/elasticSearchService.js");

function elasticSearchController(objCollection) {
  const client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
  });
  var responseWrapper = objCollection.responseWrapper;
  var app = objCollection.app;
  const commnElasticService = new CommnElasticService(objCollection);

  app.post(
    '/' + global.config.version + '/document/add',
    async (req, res) => {

      try {
        let result = await commnElasticService.addFile(req.body, res);
      } catch (err) {
        res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
      }
    })

  app.post(
    '/' + global.config.version + '/document/update',
    async (req, res) => {

      try {
        let result = await commnElasticService.updateFile(req.body, res);
      } catch (err) {
        res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
      }
    })

  app.post(
    '/' + global.config.version + '/document/query',
    async (req, res) => {
      try {
        let result = await commnElasticService.getResult(req.body);
        res.send(200, result);
      } catch (err) {
        res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
      }
    })

  app.post(
    '/' + global.config.version + '/document/delete',
    async (req, res) => {

      try {
        let result = await commnElasticService.deleteFile(req.body);
        res.send(responseWrapper.getResponse(false, result, 200, req.body));
      } catch (err) {
        res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
      }
    })
}

module.exports = elasticSearchController;