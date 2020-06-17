var CommonDocusignService = require("../services/docusignService");

function docusignController(objCollection) {
  var responseWrapper = objCollection.responseWrapper;
  var app = objCollection.app;
  const xmlparser = require('express-xml-bodyparser');
app.use(xmlparser());
  const commonDocusignService = new CommonDocusignService(objCollection);

  app.post(
    '/' + global.config.version + '/docusign/document/add',
    async (req, res) => {
      try {
         let result = await commonDocusignService.addFile(req.body, res);
      } catch (err) {
        res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
      }
    })


    app.post(
      '/' + global.config.version + '/docusign/document/query',
      async (req, res) => {
        try {
          let result = await commonDocusignService.query(req.body, res);
        } catch (err) {
          res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
      })

    app.post(
      '/' + global.config.version + '/docusign/webhook',
      async (req, res) => {
        try {
          let result = await commonDocusignService.updateStatus(req.body, res);
          res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
          res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
      })

}

module.exports = docusignController;