var CommonDocusignService = require("../services/docusignService");

function docusignController(objCollection) {
  var responseWrapper = objCollection.responseWrapper;
  // var app = objCollection.app;
  const xmlparser = require('express-xml-bodyparser');
  const express = require('express')
    , session = require('express-session') 
    , cookieParser = require('cookie-parser')
    , MemoryStore = require('memorystore')(session)
    , passport = require('passport') 
    , max_session_min = 180 ;
    var app = objCollection.app
    .use(cookieParser())
    .use(session({
    secret: config.sessionSecret,
    name: 'ds-authexample-session',
    cookie: {maxAge: max_session_min * 60000},
    saveUninitialized: true,
    resave: true,
    store: new MemoryStore({
        checkPeriod: 86400000 
  })}))
    .use(passport.initialize())
  .use(passport.session())

    passport.serializeUser  (function(user, done) {
      console.log("In serialize user");
      done(null, user)
  });
  passport.deserializeUser(function(obj,  done) {
      console.log("In de-serialize user");
      done(null, obj);
  });

  app.use(xmlparser());
  const commonDocusignService = new CommonDocusignService(objCollection);

  app.post(
    '/' + global.config.version + '/docusign/document/add',
    async (req, res) => {
      try {
         let result = await commonDocusignService.addFile(req.body, res,req);
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