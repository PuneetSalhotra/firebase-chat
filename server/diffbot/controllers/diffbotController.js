var DiffbotService = require("../services/diffbotService.js");

function DiffbotController(objCollection) 
{
    const diffbotService = new DiffbotService(objCollection);
    const cron = require("node-cron");

    cron.schedule("* * * * *",  async function() {
        let result = await diffbotService.queryDiffbot({});
    });

}

module.exports = DiffbotController;