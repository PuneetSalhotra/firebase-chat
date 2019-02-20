const digitalMplsCrfMappings = require("./digital_mpls_crf/digital_mpls_crf_mappings.json");
const digitalMplsCrfLabels = require("./digital_mpls_crf/labels.json");
const digitalMplsCrfRoms = require("./digital_mpls_crf/roms.json");
const digitalMplsCrfRomsActions = require("./digital_mpls_crf/roms_actions.json");

// Digital ILL CAF
const digitalIllCafMappings = require("./digital_ill_caf/digital_ill_caf_mappings.json");
const digitalIllCafLabels = require("./digital_ill_caf/labels.json");
const digitalIllCafRoms = require("./digital_ill_caf/roms.json");
const digitalIllCafRomsActions = require("./digital_ill_caf/roms_actions.json");

vodafoneConfig = {
    "860": {
        "NAME": "Vodafone Idea | Production | BETA",
        "BOT": {
            "ASSET_ID": 31347,
            "WORKFORCE_ID": 5355,
            "ACCOUNT_ID": 975,
            "ENC_TOKEN": "05986bb0-e364-11e8-a1c0-0b6831833754"
        },
        "STATUS": {
            "HLD_PENDING": 280031,
            "VALIDATION_PENDING": 280032,
            "APPROVAL_PENDING": 280033,
            "ORDER_CLOSED": 280034
        },
        "FORM_ID": {
            "NEW_ORDER": 873,
            "ORDER_SUPPLEMENTARY": 874,
            "HLD": 869,
            "ACCOUNT_MANAGER_APPROVAL": 875,
            "NEW_CUSTOMER": 880,
            "EXISTING_CUSTOMER": 881,
            "CUSTOMER_APPROVAL": 882,
            "OMT_APPROVAL": 883,
            "FR": 871,
            "CRM": 870,
            "CAF": 872,
            "CRM_ACKNOWLEDGEMENT": 868,
            "BC_HLD": 889,
            "CUSTOMER_IT_APPROVAL": 885,
            "CUSTOMER_AUTHORISED_SIGNATORY_APPROVAL": 887,
            "CAF_REVISE": 982
        },
        "CUSTOMER": {
            "ACCOUNT_ID": 976,
            "WORKFORCE_ID": 5364,
            "ASSET_TYPE_ID": 126352,
            "DESK_ASSET_TYPE_ID": 126355
        },
        "ACTIVITY_TYPE_IDS": {
            "FORM_ACTIVITY_TYPE_ID": 133472,
            "CONTACT_CARD_ACTIVITY_TYPE_ID": 133471,
            "5355": 133250,
            "5358": 133325,
            "5359": 133350,
            "5360": 133375,
            "5363": 133450,
            "5364": 133475
        },
        "SOLUTIONS_REP": {
            "NAME": "Bharat",
            "EMAIL": "bharat@masimukku.com"
        },
        "CRM_FIELDVALUES": {
            "Company_Name": 5771,
            "Contact_Company_Name": 5772,
            "Contact_Number": 5773,
            "Email": 5774,
            "Contact_Person_Name": 5775,
            "Contact_Designation": 5776,
            "Contact_Email_Id": 5784,
            "Account_Code": 6099 //This we have in new order not in CRM
        }
    },
    "858": {
        "NAME": "Vodafone Idea | Testing | LIVE",
        "BOT": {
            "ASSET_ID": 31298,
            "WORKFORCE_ID": 5345,
            "ACCOUNT_ID": 973,
            "ENC_TOKEN": "3dc16b80-e338-11e8-a779-5b17182fa0f6"
        },
        "STATUS": {
            "HLD_PENDING": 279437,
            "VALIDATION_PENDING": 279438,
            "APPROVAL_PENDING": 279439,
            "ORDER_CLOSED": 279440
        },
        "FORM_ID": {
            "NEW_ORDER": 856,
            "ORDER_SUPPLEMENTARY": 857,
            "HLD": 864,
            "ACCOUNT_MANAGER_APPROVAL": 858,
            "NEW_CUSTOMER": 876,
            "EXISTING_CUSTOMER": 877,
            "CUSTOMER_APPROVAL": 878,
            "OMT_APPROVAL": 879,
            "FR": 866,
            "CRM": 865,
            "CAF": 867,
            "CRM_ACKNOWLEDGEMENT": 863,
            "BC_HLD": 888,
            "CUSTOMER_IT_APPROVAL": 884,
            "CUSTOMER_AUTHORISED_SIGNATORY_APPROVAL": 886
        },
        "CUSTOMER": {
            "ACCOUNT_ID": 974,
            "WORKFORCE_ID": 5354,
            "ASSET_TYPE_ID": 126082,
            "DESK_ASSET_TYPE_ID": 126085
        },
        "ACTIVITY_TYPE_IDS": {
            "FORM_ACTIVITY_TYPE_ID": 133472,
            "CONTACT_CARD_ACTIVITY_TYPE_ID": 133471,
            "5345": 133000,
            "5348": 133075,
            "5349": 133100,
            "5350": 133125,
            "5353": 133200,
            "5354": 133225
        },
        "SOLUTIONS_REP": {
            "NAME": "",
            "EMAIL": ""
        },
        "CRM_FIELDVALUES": {
            "Company_Name": 5503,
            "Contact_Company_Name": 5504,
            "Contact_Number": 5505,
            "Email": 5506,
            "Contact_Person_Name": 5507,
            "Contact_Designation": 5508,
            "Contact_Email_Id": 5516,
            "Account_Code": 5371 //This we have in new order not in CRM
        }
    },
    "868": {
        "NAME": "PLATFORM",
        "BOT": {
            "ASSET_ID": 31993,
            "WORKFORCE_ID": 5400,
            "ACCOUNT_ID": 983,
            "ENC_TOKEN": "c15f6fb0-14c9-11e9-8b81-4dbdf2702f95"
        },
        "STATUS": {
            "CAF_UPDATION": 282554,	
            "VALIDATION_PENDING": 282555,	
            "CUSTOMER_APPROVAL": 282556,	
            "ORDER_LOGGED": 282557	
        },
        "FORM_ID": {
            "ORDER_CLOSURE": 1054,
            "HLD": 1055,
            "CRM": 1056,
            "FR": 1057,  
            "CAF": 1058,  
            "NEW_ORDER": 1059,  
            "ORDER_SUPPLEMENTARY": 1060,  
            "CAF_APPROVAL_ACCOUNT_MANAGER": 1061,  
            "DOCUMENTS_NEW_CUSTOMER": 1062,  
            "DOCUMENTS_EXISTING_CUSTOMER": 1063,  
            "AUTHORISED_SIGNATORY_SIGN_AND_SEAL": 1064,  
            "OMT_APPROVAL": 1065,  
            "CUSTOMER_IT_COMMERCIAL_APPROVAL": 1066,  
            "CUSTOMER_APPROVAL": 1064,  
            "ORDER_DOCUMENTS": 1068,  
            "CAF_REVISION_COMMENTS_CUSTOMER": 1069  
        },
        "CUSTOMER": {
            "ACCOUNT_ID": 983,
            "WORKFORCE_ID": 5405,
            "ASSET_TYPE_ID": 127470,
            "DESK_ASSET_TYPE_ID": 127473
        },
        "ACTIVITY_TYPE_IDS": {
            "FORM_ACTIVITY_TYPE_ID": 133472,
            "CONTACT_CARD_ACTIVITY_TYPE_ID": 133471,
            "5400": 134414            
        },
        "SOLUTIONS_REP": {
            "NAME": "Bharat",
            "EMAIL": "bharat@masimukku.com"
        },
        "CRM_FIELDVALUES": {
            "Company_Name": 5771,
            "Contact_Company_Name": 5772,
            "Contact_Number": 5773,
            "Email": 5774,
            "Contact_Person_Name": 5775,
            "Contact_Designation": 5776,
            "Contact_Email_Id": 5784,
            "Account_Code": 6099 //This we have in new order not in CRM
        },
        "ANNEXURE_DEFAULTS": {
            "SOURCE_FORM_ID": 1068,
            "SOURCE_FIELD_ID": 9764,
            "TARGET_FIELD_IDS": [7010, 7011, 7012, 7013, 7014, 7015, 7016, 7017, 7018, 7496, 7030, 7007, 7019, 7020, 7021, 7032, 7035, 7076, 7086, 7088, 7093]
        }
    },
    "134564": {
        "REQUIRED_FORMS": [1142],
        "TARGET_FORM_ID": 1109,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalMplsCrfMappings,
        "LABELS": digitalMplsCrfLabels,
        "ROMS": digitalMplsCrfRoms,
        "ROMS_ACTIONS": digitalMplsCrfRomsActions
    },
    "134565": {
        "REQUIRED_FORMS": [1104 , 1105, 1106, 1107, 1108, 1115],
        "TARGET_FORM_ID": 1119,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalIllCafMappings,
        "LABELS": digitalIllCafLabels,
        "ROMS": digitalIllCafRoms,
        "ROMS_ACTIONS": digitalIllCafRomsActions
    }
};