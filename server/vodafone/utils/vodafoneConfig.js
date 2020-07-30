const digitalMplsCrfMappings = require("./digital_mpls_crf/digital_mpls_crf_mappings.json");
const digitalMplsCrfLabels = require("./digital_mpls_crf/labels.json");
const digitalMplsCrfRoms = require("./digital_mpls_crf/roms.json");
const digitalMplsCrfRomsActions = require("./digital_mpls_crf/roms_actions.json");
const digitalMplsCrfBulkOrderToOriginFormMappings = require("./digital_mpls_crf/bulk_order_to_origin_form_mappings.json");

// Digital ILL CAF
const digitalIllCafMappings = require("./digital_ill_caf/digital_ill_caf_mappings.json");
const digitalIllCafLabels = require("./digital_ill_caf/labels.json");
const digitalIllCafRoms = require("./digital_ill_caf/roms.json");
const digitalIllCafRomsActions = require("./digital_ill_caf/roms_actions.json");
const digitalIllCafBulkOrderToOriginFormMappings = require("./digital_ill_caf/bulk_order_to_origin_form_mappings.json");

// Digital ILL CRF
const digitalIllCrfMappings = require("./digital_ill_crf/digital_ill_crf_mappings.json");
const digitalIllCrfLabels = require("./digital_ill_crf/labels.json");
const digitalIllCrfRoms = require("./digital_ill_crf/roms.json");
const digitalIllCrfRomsActions = require("./digital_ill_crf/roms_actions.json");
const digitalIllCrfBulkOrderToOriginFormMappings = require("./digital_ill_crf/bulk_order_to_origin_form_mappings.json");

// Digital PRI CAF - 134576
const digitalPriCafMappings = require("./digital_pri_caf/digital_pri_caf_mappings.json");
const digitalPriCafLabels = require("./digital_pri_caf/labels.json");
const digitalPriCafRoms = require("./digital_pri_caf/roms.json");
const digitalPriCafRomsActions = require("./digital_pri_caf/roms_actions.json");
const digitalPriCafBulkOrderToOriginFormMappings = require("./digital_pri_caf/bulk_order_to_origin_form_mappings.json");

// Digital NPLC CAF - 134569
const digitalNplcCafMappings = require("./digital_nplc_caf/digital_nplc_caf_mappings.json");
const digitalNplcCafLabels = require("./digital_nplc_caf/labels.json");
const digitalNplcCafRoms = require("./digital_nplc_caf/roms.json");
const digitalNplcCafRomsActions = require("./digital_nplc_caf/roms_actions.json");
const digitalNplcCafBulkOrderToOriginFormMappings = require("./digital_nplc_caf/bulk_order_to_origin_form_mappings.json");

// Digital NPLC CRF - 134573
const digitalNplcCrfMappings = require("./digital_nplc_crf/digital_nplc_crf_mappings.json");
const digitalNplcCrfLabels = require("./digital_nplc_crf/labels.json");
const digitalNplcCrfRoms = require("./digital_nplc_crf/roms.json");
const digitalNplcCrfRomsActions = require("./digital_nplc_crf/roms_actions.json");
const digitalNplcCrfBulkOrderToOriginFormMappings = require("./digital_nplc_crf/bulk_order_to_origin_form_mappings.json");

// Digital IPLC CAF - 134574
const digitalIplcCafMappings = require("./digital_iplc_caf/digital_iplc_caf_mappings.json");
const digitalIplcCafLabels = require("./digital_iplc_caf/labels.json");
const digitalIplcCafRoms = require("./digital_iplc_caf/roms.json");
const digitalIplcCafRomsActions = require("./digital_iplc_caf/roms_actions.json");
const digitalIplcCafBulkOrderToOriginFormMappings = require("./digital_iplc_caf/bulk_order_to_origin_form_mappings.json");

// Modify FLV - PRI/SIP/IP CRF - Digital FLV - CRF - 134575
const digitalFlvCrfMappings = require("./digital_flv_pri_sip_ip_crf/mappings.json");
const digitalFlvCrfLabels = require("./digital_flv_pri_sip_ip_crf/labels.json");
const digitalFlvCrfRoms = require("./digital_flv_pri_sip_ip_crf/roms.json");
const digitalFlvCrfRomsActions = require("./digital_flv_pri_sip_ip_crf/roms_actions.json");

// New FLD - SuperWiFi CAF - 134583
const digitalSuperWiFiCafMappings = require("./digital_super_wifi_caf/mappings.json");
const digitalSuperWiFiCafLabels = require("./digital_super_wifi_caf/labels.json");
const digitalSuperWiFiCafRoms = require("./digital_super_wifi_caf/roms.json");
const digitalSuperWiFiCafRomsActions = require("./digital_super_wifi_caf/roms_actions.json");
const digitalSuperWiFiCafBulkOrderToOriginFormMappings = require("./digital_super_wifi_caf/bulk_order_to_origin_form_mappings.json");

// New FLD - MPLS CAF - 134562
const digitalMplsCafMappings = require("./digital_mpls_caf/mappings.json");
const digitalMplsCafLabels = require("./digital_mpls_caf/labels.json");
const digitalMplsCafRoms = require("./digital_mpls_caf/roms.json");
const digitalMplsCafRomsActions = require("./digital_mpls_caf/roms_actions.json");
const digitalMplsCafBulkOrderToOriginFormMappings = require("./digital_mpls_caf/bulk_order_to_origin_form_mappings.json");

// New FLV - PRI SIP - 142431
const digitalPriSipMappings = require("./digital_pri_sip/mappings.json");
const digitalPriSipLabels = require("./digital_pri_sip/labels.json");
const digitalPriSipRoms = require("./digital_pri_sip/roms.json");
const digitalPriSipRomsActions = require("./digital_pri_sip/roms_actions.json");
const digitalPriSipBulkOrderToOriginFormMappings = require("./digital_pri_sip/bulk_order_to_origin_form_mappings.json");

// New FLV - PRI IPC - 142432
const digitalIpcMappings = require("./digital_ipc/mappings.json");
const digitalIpcLabels = require("./digital_ipc/labels.json");
const digitalIpcRoms = require("./digital_ipc/roms.json");
const digitalIpcRomsActions = require("./digital_ipc/roms_actions.json");
const digitalIpcBulkOrderToOriginFormMappings = require("./digital_ipc/bulk_order_to_origin_form_mappings.json");

// NFL - Digital ITFS - 133894
const digitalItfsMappings = require("./digital_itfs/mappings.json");
const digitalItfsLabels = require("./digital_itfs/labels.json");
const digitalItfsRoms = require("./digital_itfs/roms.json");
const digitalItfsRomsActions = require("./digital_itfs/roms_actions.json");
// const digitalItfsBulkOrderToOriginFormMappings = require("./digital_itfs/bulk_order_to_origin_form_mappings.json");

// NFL - Digital VLT CAF - 133895
const digitalVltCafMappings = require("./digital_vlt_caf/mappings.json");
const digitalVltCafLabels = require("./digital_vlt_caf/labels.json");
const digitalVltCafRoms = require("./digital_vlt_caf/roms.json");
const digitalVltCafRomsActions = require("./digital_vlt_caf/roms_actions.json");
// const digitalVltCafBulkOrderToOriginFormMappings = require("./digital_vlt_caf/bulk_order_to_origin_form_mappings.json");

// NFL - Digital NFL CRF - 133899
const digitalNflCrfMappings = require("./digital_nfl_crf/mappings.json");
const digitalNflCrfLabels = require("./digital_nfl_crf/labels.json");
const digitalNflCrfRoms = require("./digital_nfl_crf/roms.json");
const digitalNflCrfRomsActions = require("./digital_nfl_crf/roms_actions.json");
// const digitalVltCafBulkOrderToOriginFormMappings = require("./digital_nfl_crf/bulk_order_to_origin_form_mappings.json");

// NFL - Digital AC - 133892
const digitalAcMappings = require("./nfl_digital_ac/mappings.json");
const digitalAcLabels = require("./nfl_digital_ac/labels.json");
const digitalAcRoms = require("./nfl_digital_ac/roms.json");
const digitalAcRomsActions = require("./nfl_digital_ac/roms_actions.json");
// const digitalAcBulkOrderToOriginFormMappings = require("./nfl_digital_ac/bulk_order_to_origin_form_mappings.json");

// NFL - Digital TFS - 133893
const digitalTfsMappings = require("./nfl_digital_tfs/mappings.json");
const digitalTfsLabels = require("./nfl_digital_tfs/labels.json");
const digitalTfsRoms = require("./nfl_digital_tfs/roms.json");
const digitalTfsRomsActions = require("./nfl_digital_tfs/roms_actions.json");
// const digitalTfsBulkOrderToOriginFormMappings = require("./nfl_digital_tfs/bulk_order_to_origin_form_mappings.json");

// NFL - Digital VC - 133896
const digitalVcMappings = require("./nfl_digital_vc/mappings.json");
const digitalVcLabels = require("./nfl_digital_vc/labels.json");
const digitalVcRoms = require("./nfl_digital_vc/roms.json");
const digitalVcRomsActions = require("./nfl_digital_vc/roms_actions.json");
// const digitalVcBulkOrderToOriginFormMappings = require("./nfl_digital_vc/bulk_order_to_origin_form_mappings.json");

// NFL - Digital BulkSMS - 133897
const digitalBulkSMSMappings = require("./nfl_digital_bulksms/mappings.json");
const digitalBulkSMSLabels = require("./nfl_digital_bulksms/labels.json");
const digitalBulkSMSRoms = require("./nfl_digital_bulksms/roms.json");
const digitalBulkSMSRomsActions = require("./nfl_digital_bulksms/roms_actions.json");
// const digitalBulkSMSBulkOrderToOriginFormMappings = require("./nfl_digital_bulksms/bulk_order_to_origin_form_mappings.json");

// NFL - Digital VSDM - 133898
const digitalVsdmMappings = require("./nfl_digital_vsdm/mappings.json");
const digitalVsdmLabels = require("./nfl_digital_vsdm/labels.json");
const digitalVsdmRoms = require("./nfl_digital_vsdm/roms.json");
const digitalVsdmRomsActions = require("./nfl_digital_vsdm/roms_actions.json");
// const digitalVsdmBulkOrderToOriginFormMappings = require("./nfl_digital_vsdm/bulk_order_to_origin_form_mappings.json");

// NFL - Digital MSS - 145268
const digitalMssMappings = require("./digital_mss_caf/mappings.json");
const digitalMssLabels = require("./digital_mss_caf/labels.json");
const digitalMssRoms = require("./digital_mss_caf/roms.json");
const digitalMssRomsActions = require("./digital_mss_caf/roms_actions.json");
const digitalMSSBulkOrderToOriginFormMappings = require("./digital_mss_caf/bulk_order_to_origin_form_mappings.json");

// IPLC - Digital IPLC CRF - 152451
const digitalIPLCMappings = require("./digital_iplc_crf/mappings.json");
const digitalIPLCLabels = require("./digital_iplc_crf/labels.json");
const digitalIPLCRoms = require("./digital_iplc_crf/roms_actions.json");
const digitalIPLCRomsActions = require('./digital_iplc_crf/roms_actions.json');

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
            "SOURCE_FIELD_ID": 11182,
            "TARGET_FIELD_IDS": [7010,7011,7012,7013,7014,7015,7016,7017,7018,7496,7030,7007,7019,7020,7021,7032,7035,7076,7086,7088,7093,7143,7144,7145,7146,7196,7197,7248,7200]
        }
    },
    "134564": {
        "REQUIRED_FORMS": [1073],
        "TARGET_FORM_ID": 1109,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalMplsCrfMappings,
        "LABELS": digitalMplsCrfLabels,
        "ROMS": digitalMplsCrfRoms,
        "ROMS_ACTIONS": digitalMplsCrfRomsActions,
        "ORIGIN_FORM_ID": 1073,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalMplsCrfBulkOrderToOriginFormMappings
    },
    "134565": {
        "REQUIRED_FORMS": [1104],
        "TARGET_FORM_ID": 1119,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalIllCafMappings,
        "LABELS": digitalIllCafLabels,
        "ROMS": digitalIllCafRoms,
        "ROMS_ACTIONS": digitalIllCafRomsActions,
        "ORIGIN_FORM_ID": 1104,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalIllCafBulkOrderToOriginFormMappings
    },
    "134566": {
        "REQUIRED_FORMS": [1136],
        "TARGET_FORM_ID": 1229,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalIllCrfMappings,
        "LABELS": digitalIllCrfLabels,
        "ROMS": digitalIllCrfRoms,
        "ROMS_ACTIONS": digitalIllCrfRomsActions,
        "ORIGIN_FORM_ID": 1136,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalIllCrfBulkOrderToOriginFormMappings
    },
    "134576": {
        "REQUIRED_FORMS": [1317],
        "TARGET_FORM_ID": 1316,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalPriCafMappings,
        "LABELS": digitalPriCafLabels,
        "ROMS": digitalPriCafRoms,
        "ROMS_ACTIONS": digitalPriCafRomsActions,
        "ORIGIN_FORM_ID": 1317,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalPriCafBulkOrderToOriginFormMappings
    },
    "134569": {
        "REQUIRED_FORMS": [1144],
        "TARGET_FORM_ID": 1230,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalNplcCafMappings,
        "LABELS": digitalNplcCafLabels,
        "ROMS": digitalNplcCafRoms,
        "ROMS_ACTIONS": digitalNplcCafRomsActions,
        "ORIGIN_FORM_ID": 1144,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalNplcCafBulkOrderToOriginFormMappings
    },
    "134573": {
        "REQUIRED_FORMS": [1264],
        "TARGET_FORM_ID": 1234,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalNplcCrfMappings,
        "LABELS": digitalNplcCrfLabels,
        "ROMS": digitalNplcCrfRoms,
        "ROMS_ACTIONS": digitalNplcCrfRomsActions,
        "ORIGIN_FORM_ID": 1264,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalNplcCrfBulkOrderToOriginFormMappings
    },
    "134574": {
        "REQUIRED_FORMS": [1270],
        "TARGET_FORM_ID": 1337,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalIplcCafMappings,
        "LABELS": digitalIplcCafLabels,
        "ROMS": digitalIplcCafRoms,
        "ROMS_ACTIONS": digitalIplcCafRomsActions,
        "ORIGIN_FORM_ID": 1270,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalIplcCafBulkOrderToOriginFormMappings
    },
    "134575": {
        "REQUIRED_FORMS": [1281],
        "TARGET_FORM_ID": 1277,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalFlvCrfMappings,
        "LABELS": digitalFlvCrfLabels,
        "ROMS": digitalFlvCrfRoms,
        "ROMS_ACTIONS": digitalFlvCrfRomsActions
    },
    "134583": {
        "REQUIRED_FORMS": [1351],
        "TARGET_FORM_ID": 1347,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalSuperWiFiCafMappings,
        "LABELS": digitalSuperWiFiCafLabels,
        "ROMS": digitalSuperWiFiCafRoms,
        "ROMS_ACTIONS": digitalSuperWiFiCafRomsActions,
        "ORIGIN_FORM_ID": 1351,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalSuperWiFiCafBulkOrderToOriginFormMappings
    },
    "134562": {
        "REQUIRED_FORMS": [1059],
        "TARGET_FORM_ID": 1058,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalMplsCafMappings,
        "LABELS": digitalMplsCafLabels,
        "ROMS": digitalMplsCafRoms,
        "ROMS_ACTIONS": digitalMplsCafRomsActions,
        "ORIGIN_FORM_ID": 1059,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalMplsCafBulkOrderToOriginFormMappings
    },
    "142431": {
        "REQUIRED_FORMS": [1558],
        "TARGET_FORM_ID": 1557,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalPriSipMappings,
        "LABELS": digitalPriSipLabels,
        "ROMS": digitalPriSipRoms,
        "ROMS_ACTIONS": digitalPriSipRomsActions,
        "ORIGIN_FORM_ID": 1558,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalPriSipBulkOrderToOriginFormMappings
    },
    "142432": {
        "REQUIRED_FORMS": [1567],
        "TARGET_FORM_ID": 1566,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalIpcMappings,
        "LABELS": digitalIpcLabels,
        "ROMS": digitalIpcRoms,
        "ROMS_ACTIONS": digitalIpcRomsActions,
        "ORIGIN_FORM_ID": 1567,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalIpcBulkOrderToOriginFormMappings
    },
    "133894": {
        "REQUIRED_FORMS": [1701],
        "TARGET_FORM_ID": 1700,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalItfsMappings,
        "LABELS": digitalItfsLabels,
        "ROMS": digitalItfsRoms,
        "ROMS_ACTIONS": digitalItfsRomsActions,
        "ORIGIN_FORM_ID": 1701
    },
    "133895": {
        "REQUIRED_FORMS": [1708],
        "TARGET_FORM_ID": 1707,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalVltCafMappings,
        "LABELS": digitalVltCafLabels,
        "ROMS": digitalVltCafRoms,
        "ROMS_ACTIONS": digitalVltCafRomsActions,
        "ORIGIN_FORM_ID": 1708
    },
    "133899": {
        "REQUIRED_FORMS": [1734],
        "TARGET_FORM_ID": 1733,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalNflCrfMappings,
        "LABELS": digitalNflCrfLabels,
        "ROMS": digitalNflCrfRoms,
        "ROMS_ACTIONS": digitalNflCrfRomsActions,
        "ORIGIN_FORM_ID": 1734
    },
    "133892": {
        "REQUIRED_FORMS": [1688],
        "TARGET_FORM_ID": 1687,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalAcMappings,
        "LABELS": digitalAcLabels,
        "ROMS": digitalAcRoms,
        "ROMS_ACTIONS": digitalAcRomsActions,
        "ORIGIN_FORM_ID": 1688
    },
    "133893": {
        "REQUIRED_FORMS": [1694],
        "TARGET_FORM_ID": 1693,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalTfsMappings,
        "LABELS": digitalTfsLabels,
        "ROMS": digitalTfsRoms,
        "ROMS_ACTIONS": digitalTfsRomsActions,
        "ORIGIN_FORM_ID": 1694
    },
    "133896": {
        "REQUIRED_FORMS": [1714],
        "TARGET_FORM_ID": 1713,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalVcMappings,
        "LABELS": digitalVcLabels,
        "ROMS": digitalVcRoms,
        "ROMS_ACTIONS": digitalVcRomsActions,
        "ORIGIN_FORM_ID": 1714
    },
    "133897": {
        "REQUIRED_FORMS": [1720],
        "TARGET_FORM_ID": 1719,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalBulkSMSMappings,
        "LABELS": digitalBulkSMSLabels,
        "ROMS": digitalBulkSMSRoms,
        "ROMS_ACTIONS": digitalBulkSMSRomsActions,
        "ORIGIN_FORM_ID": 1720
    },
    "133898": {
        "REQUIRED_FORMS": [1878],
        "TARGET_FORM_ID": 1726,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalVsdmMappings,
        "LABELS": digitalVsdmLabels,
        "ROMS": digitalVsdmRoms,
        "ROMS_ACTIONS": digitalVsdmRomsActions,
        "ORIGIN_FORM_ID": 1878
    },
    "145268": {
        "REQUIRED_FORMS": [2185],
        "TARGET_FORM_ID": 2184,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 134492,
        "FORM_FIELD_MAPPING_DATA": digitalMssMappings,
        "LABELS": digitalMssLabels,
        "ROMS": digitalMssRoms,
        "ROMS_ACTIONS": digitalMssRomsActions,
        "ORIGIN_FORM_ID": 2185,
        "BULK_ORDER_ORIGIN_FORM_MAPPING_DATA": digitalMSSBulkOrderToOriginFormMappings
    },
    "152451": {
        "REQUIRED_FORMS": [4379],
        "TARGET_FORM_ID": 4405,
        "TARGET_FORM_ACTIVITY_TYPE_ID": 152451,
        "FORM_FIELD_MAPPING_DATA": digitalIpcMappings,
        "LABELS": digitalIPLCLabels,
        "ROMS": digitalIPLCRoms,
        "ROMS_ACTIONS": digitalIPLCRomsActions,
        "ORIGIN_FORM_ID": 2185,
    }
};