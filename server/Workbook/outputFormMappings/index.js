const flvJSON = require("./flv.json");
const fldJSON = require("./fld.json");
const cloudJSON = require("./cloud.json");
const vsdmJSON = require("./vsdm.json");
const mobilityJSON = require("./mobility.json");

module.exports = {
    "Connectivity": {
        "Product - WAN Services": {
            "International Private Leased Line (IPLC)": fldJSON.bot_operations.map_workbook.mappings["2"].output
        }
    }
};