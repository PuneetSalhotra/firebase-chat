var DiffbotService = require("../services/diffbotService.js");

function DiffbotController(objCollection) 
{
    const diffbotService = new DiffbotService(objCollection);
    const cron = require("node-cron");
  
    cron.schedule("0 0 0 * * *",  function() {
         diffbotService.queryDiffbot({});
        diffbotService.getTendersFromTenderTigerWebsite({})
    });

}

module.exports = DiffbotController;