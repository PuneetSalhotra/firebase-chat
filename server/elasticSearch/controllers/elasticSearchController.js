
var fs = require('fs')
var CommnElasticService = require("../services/elasticSearchService.js");

  function elasticSearchController(objCollection)
{
    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    const commnElasticService = new CommnElasticService(objCollection);

    app.post
    (
        '/' + global.config.version + '/elasticSearch/elasticsearch/create',
        async (req, res) =>
        {

          try
          {
              let result = await commnElasticService.addFile(req.body);
              res.send(responseWrapper.getResponse(false, result, 200, req.body));
          }
          catch(err)
          {
              res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
          }
  })

  app.post
    (
        '/' + global.config.version + '/elasticSearch/elasticsearch', 
        async (req, res) =>
        {
          try
          {
              let result = await commnElasticService.getResult(req.body);
              res.send( 200,result);
          }
          catch(err)
          {
              res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
          }
  })

  app.post
    (
        '/' + global.config.version + '/elasticSearch/elasticsearch/delete',
        async (req, res) =>
        {

          try
          {
              let result = await commnElasticService.deleteFile(req.body);
              res.send(responseWrapper.getResponse(false, result, 200, req.body));
          }
          catch(err)
          {
              res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
          }
  })

  app.post
    (
        '/' + global.config.version + '/elasticSearch/elasticsearch/test',
        async (req, res) =>
        {
          try
          {

            let result = await commnElasticService.test(req.body);

              res.send(responseWrapper.getResponse(false, result, 200, req.body));
          }
          catch(err)
          {
              res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
          }
  })
}

  module.exports = elasticSearchController;