// 

const vilBulkLOVs = {
    "vendorsList": [
        "Gemini",
        "HFCL",
        "TTML",
        "Vodafone",
        "TCL",
        "TTSL",
        "Airtel",
        "Reliance",
        "Sify",
        "Citycom",
        "Idea",
        "Aircel",
        "PGCIL",
        "Railtel",
        "DigiCable",
        "C and W",
        "GAIL",
        "Indian Cable net",
        "Meghbala",
        "MTS",
        "RK Infratel",
        "Fiber Tech",
        "DDC",
        "INDUSIND",
        "GTPL",
        "USHA Services",
        "Tikona",
        "Quadrant Televenture",
        "MUKAND SYSTEMS",
        "Ten dot net cable",
        "SIKKA INFRATECH PRIVATE LIMITED",
        "4D telecom",
        "Asianet",
        "SKY TELE VENTURES",
        "Synoptics",
        "You broadband",
        "Flag Telecom",
        "Power links",
        "KINGS BROADBAND PVT",
        "Mars",
        "Auspice Infratel",
        "Smartlink Solutions",
        "Ishan Netsol",
        "Optimal Telenet",
        "RPWORLD",
        "Aksh Optifibre",
        "Ortel Comm Ltd",
        "Spiderlink Networks",
        "Skynet Broadband Pvt. Ltd.",
        "Pioneer E Labs Limited",
        "Micronova",
        "Bell Tele",
        "LK Telecom",
        "Khushi Enterprises",
        "Bombay Gas",
        "Shristi Tele Enterprises",
        "VIREN TELECOM PRIVATE LIMITED",
        "EVISIONS TELEINFRA PVT LTD",
        "Vilite Multimedia",
        "Star Broadband Services (India) P.Ltd",
        "Gigatel Solutions Private Limited",
        "Srestha",
        "aarya Trenchless Services Private Limited",
        "Greentech",
        "Airtel Wireless",
        "Airgeine",
        "FUSIONNET WEB SERVICES PRIVATE LIMITED",
        "Texes Telecom Private Limited",
        "INDUS TOWERS LTD",
        "SHREY CABLES AND WIRELESS",
        "TRIPLE PLAY BROADBAND PVT. LTD",
        "KCCL",
        "Peak Air",
        "Diamond Constructions",
        "Posidon Infratel Solutions",
        "Divine network",
        "SOLITON NETLINK PRIVATE LIMITED",
        "Total communication",
        "Synoptics Broadband",
        "NEsecure Broadband",
        "SHIV KRISHNA ENTERPRISES",
        "Prime Multitask Private Limited",
        "TEJAYS INDUSTRIES PRIVATE LIMITED",
        "M/s Monstar Optical Fibre",
        "M/s Budhaa Automation"
    ],
    "LastMileList": [
        "Stage2",
        "Stage2Offnet",
        "Stage2Ubr",
        "Stage23g",
        "Stage2Microwave",
        "Desktop"
    ],
    "RejectionRemarksList": [
        "Modification Required",
        "Need Revised Feasibility",
        "Circle/CFT request",
        "Need revised solution",
        "Capex revalidation required"
    ],
    "ReasonForCloningList": [
        "Change in Bandwidth",
        "Service addition",
        "Parameter change",
        "Feasibility Rejected",
        "Feasibility has expired"
    ],
    "checksForBulkUpload": {
        "mandatory": {
            "cloning": ["LastMileName", "ReasonForCloning", { "VendorName": { "LastMileName": "Stage2Offnet" } }],
            "refeasibility_rejected_by_am": ["LastMileName", "RejectionRemarks", { "VendorName": { "LastMileName": "Stage2Offnet" } }],
            "refeasibility_rejected_by_fes": ["LastMileName", "ReSubmissionRemarksEndA", "ReSubmissionRemarksEndB", "SalesRemarks", { "VendorName": { "LastMileName": "Stage2Offnet" } }],
            "Existing_Feasibility": ["UpgradeOrDowngrade", "OrderID", "CircuitID"]
        },
        "char_limit": {
            "SearchCityEndA": 50,
            "SearchAreaEndA": 250,
            "SearchBuildingIdEndA": 500,
            "StreetFloorNameEndA": 100,
            "AddressEndA": 500,
            "CustomerNameEndA": 125,
            "SpecialInstructionsBySalesEndA": 1000,
            "SearchCityEndB": 50,
            "SearchAreaEndB": 250,
            "SearchBuildingIdEndB": 500,
            "StreetFloorNameEndB": 100,
            "AddressEndB": 500,
            "CustomerNameEndB": 125,
            "SpecialInstructionsBySalesEndB": 1000,
            "RackNoEndA" : 50,
            "CageNoEndA" : 50,
            "RackNoEndB" : 50,
            "CageNoEndB" : 50
        },
        "email_validation" : [
            "ContactPersonEmailIdEndA",
            "ContactPersonEmailIdEndB"
        ]
    },
    "product_fb_form_mapping": {
        "50326": "SuperWiFi",
        "50327": "SuperWiFi",
        "50350": "SuperWiFi",
        "50351": "SuperWiFi",
        "2843": "SuperWiFi",
        "2965": "SuperWiFi",
        "2964": "SuperWiFi",
        "4637": "SuperWiFi",

        "50324": "SIPT",
        "50325": "SIPT",
        "50348": "SIPT",
        "50349": "SIPT",
        "2852": "SIPT",
        "2957": "SIPT",
        "2956": "SIPT",
        "4636": "SIPT",

        "50322": "SIP Central",
        "50323": "SIP Central",
        "50346": "SIP Central",
        "50347": "SIP Central",
        "2846": "SIP Central",
        "4587": "SIP Central",
        "4588": "SIP Central",
        "4623": "SIP Central",

        "50320": "PRI",
        "50321": "PRI",
        "50344": "PRI",
        "50345": "PRI",
        "2841": "PRI",
        "2969": "PRI",
        "2968": "PRI",
        "4639": "PRI",

        "50318": "NPLC",
        "50319": "NPLC",
        "50342": "NPLC",
        "50343": "NPLC",
        "3616": "NPLC",
        "3617": "NPLC",
        "4522": "NPLC",
        "4635": "NPLC",

        "50316": "MPLS-L3",
        "50317": "MPLS-L3",
        "50340": "MPLS-L3",
        "50341": "MPLS-L3",
        "2840": "MPLS-L3",
        "2970": "MPLS-L3",
        "2971": "MPLS-L3",
        "4633": "MPLS-L3",

        "50314": "IPVPN",
        "50315": "IPVPN",
        "50338": "IPVPN",
        "50339": "IPVPN",
        "2818": "IPVPN",
        "2954": "IPVPN",
        "2955": "IPVPN",
        "4631": "IPVPN",

        "50312": "MPLS-L2",
        "50313": "MPLS-L2",
        "50336": "MPLS-L2",
        "50337": "MPLS-L2",
        "2839": "MPLS-L2",
        "2973": "MPLS-L2",
        "2972": "MPLS-L2",
        "4632": "MPLS-L2",

        "50310": "IPLC",
        "50311": "IPLC",
        "50334": "IPLC",
        "50335": "IPLC",
        "2838": "IPLC",
        "2974": "IPLC",
        "2975": "IPLC",
        "4638": "IPLC",

        "50308": "Internet",
        "50309": "Internet",
        "50332": "Internet",
        "50333": "Internet",
        "2842": "Internet",
        "2966": "Internet",
        "2967": "Internet",
        "4630": "Internet",

        "50305": "Global IPT",
        "50306": "Global IPT",
        "50330": "Global IPT",
        "50331": "Global IPT",
        "2845": "Global IPT",
        "2962": "Global IPT",
        "2963": "Global IPT",
        "4627": "Global IPT"
    },
    "posting_circle_mapping": {
        "149058": {
            "form_id": 50849,
            "field_id": 312612
        },
        "149752": {
            "form_id": 50850,
            "field_id": 312613
        },
        "150229": {
            "form_id": 50851,
            "field_id": 312614
        },
        "149818": {
            "form_id": 50852,
            "field_id": 312615
        },
        "151728": {
            "form_id": 50854,
            "field_id": 312617
        },
        "151729": {
            "form_id": 50853,
            "field_id": 312616
        },
        "151730": {
            "form_id": 50855,
            "field_id": 312618
        }
    },
    "third_party_opex": {
        "149058": {
            form_id: 50668,
            business_case_type_field: 312682,
            bulk_upload_field: 311412,
            single_case: {
                first_case: {
                    current_fr_field: 312683,
                    existing_fr_field: 312685,
                    lastmile_field: 312684,
                    service_provider_field: 312686
                },
                is_second_case_needed: 312687,
                second_case: {
                    current_fr_field: 312688,
                    existing_fr_field: 312719,
                    lastmile_field: 312720,
                    service_provider_field: 312721
                }
            }
        }
    }
};


module.exports = vilBulkLOVs;