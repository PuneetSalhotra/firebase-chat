var CommonDocusignService = require("../services/docusignService");

function docusignController(objCollection) {
  var responseWrapper = objCollection.responseWrapper;
  var app = objCollection.app;
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

}

module.exports = docusignController;