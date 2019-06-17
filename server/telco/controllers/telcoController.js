const TelcoService = require("../services/telcoService");

function TelcoController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    const util = objCollection.util;
    const cacheWrapper = objCollection.cacheWrapper;
    const queueWrapper = objCollection.queueWrapper;
    var telcoService = new TelcoService(objCollection);
    const activityCommonService = objCollection.activityCommonService;

    const moment = require('moment');

    
    
};

module.exports = TelcoController;
