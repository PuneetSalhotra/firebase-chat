const flvJSON = require("./flv.json");
const fldJSON = require("./fld.json");
const mobilityCloudVsdmJSON = require("./mobilityCloudVsdm.json");

module.exports = {
    "Connectivity": {
        "Product - WAN Services": {
            "International Private Leased Line (IPLC)": fldJSON.bot_operations.map_workbook.mappings["2"].output
        }
    },
    getActivityTypeIDToFieldMapping: function (activityTypeID) {
        return ActivityTypeIDToFieldMapping[activityTypeID];
    },
    getProductToOutputMapping: function (productActivityID) {
        return ProductToOutputMapping[global.mode][productActivityID];
    },
    ifProductToOutputMappingExists: function (productActivityID) {
        return Object.keys(ProductToOutputMapping[global.mode]).includes(String(productActivityID));
    }
};

const ActivityTypeIDToFieldMapping = {
    // Enterprise Opportunity
    149058: {
        ProductCartSelectionField: {
            form_id: 2753,
            field_id: 218716
        }
    },
    // Tender/RFP
    149752: {
        ProductCartSelectionField: {
            form_id: 3565,
            field_id: 218717
        }
    },
    // New Business Case - BC Approval
    152184: {
        OpportunityReferenceField: {
            form_id: 4353,
            field_id: 218728
        }
    }
};

const ProductToOutputMapping = {
    ["local" || "staging"]: {
        // Internet Leased Lines (ILL)
        3126816: { OutputMapping: fldJSON.bot_operations.map_workbook.mappings["2"].output },
        // MPLS VPN- Domestic - SD WAN
        3126818: { OutputMapping: fldJSON.bot_operations.map_workbook.mappings["2"].output },
        // MPLS VPN- Domestic
        3126820: { OutputMapping: fldJSON.bot_operations.map_workbook.mappings["2"].output },
        // MPLS VPN- International - Global MPLS VPN
        3126834: { OutputMapping: fldJSON.bot_operations.map_workbook.mappings["2"].output },
        // Layer 2 VPN - Managed L2 MPLS VPN
        3126836: { OutputMapping: fldJSON.bot_operations.map_workbook.mappings["2"].output },
        // Layer 2 VPN - Un Managed L2 MPLS VPN
        3126838: { OutputMapping: fldJSON.bot_operations.map_workbook.mappings["2"].output },
        // National Private Leased Line (NPLC)
        3126840: { OutputMapping: fldJSON.bot_operations.map_workbook.mappings["2"].output },
        // International Private Leased Line (IPLC)
        3126842: { OutputMapping: fldJSON.bot_operations.map_workbook.mappings["2"].output }
    }
};