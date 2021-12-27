/*
    author: bharat krishna masimukku
*/

analyticsConfig = {};

//Analytics configs
analyticsConfig.widget_type_category_id_default = 3;
analyticsConfig.widget_type_id_tat = 20;
analyticsConfig.widget_type_id_volume_distribution = 28;
analyticsConfig.widget_type_id_value_distribution = 29;
analyticsConfig.widget_type_id_status_type_wise_tat = 27;
analyticsConfig.widget_type_id_status_tag_wise_tat = 26;
analyticsConfig.widget_type_id_status_wise_tat = 25;

analyticsConfig.activity_type_category_id_workflow = 48;
analyticsConfig.activity_id_all = 0;

analyticsConfig.activity_status_type_id_all = 0;
analyticsConfig.activity_status_tag_id_all = 0;

analyticsConfig.parameter_flag_status_tag = 1;
analyticsConfig.parameter_flag_status = 2;
analyticsConfig.parameter_flag_timeline = 1;
analyticsConfig.parameter_flag_sort = 0;
analyticsConfig.vertical = {
	"128": {
		"vertical_name": "Vertical",
		"flag_1": "Open Oppty Count",
		"flag_2": "Open Oppty Qty",
		"flag_3": "Open Oppty AOV",
		"flag_4": "Closed Won Count",
		"flag_5": "Closed Won Qty",
		"flag_6": "Closed Won AOV"
	},
	"129": {
		"vertical_name": "Vertical",
		"flag_1": "Identify Count",
		"flag_2": "Identify Qty",
		"flag_3": "Identify  AOV",
		"flag_4": "Qualify Count",
		"flag_5": "Qualify Qty",
		"flag_6": "Qualify AOV",
		"flag_7": "Proposal Count",
		"flag_8": "Proposal Qty",
		"flag_9": "Proposal  AOV",
		"flag_10": "Negotiate Count",
		"flag_11": "Negotiate Qty",
		"flag_12": "Negotiate AOV",
		"flag_13": "Closed won Count",
		"flag_14": "Closed won Qty",
		"flag_15": "Closed won AOV",
		"flag_16": "Closed lost Count",
		"flag_17": "Closed lost  Qty",
		"flag_18": "Closed lost AOV",
		"flag_19": "Closed NoDeal Count",
		"flag_20": "Closed NoDeal  Qty",
		"flag_21": "Closed NoDeal AOV",
		"flag_22": "Closed drop Count",
		"flag_23": "Closed drop  Qty",
		"flag_24": "Closed drop AOV"
	},
	"130": {
		"vertical_name": "Vertical",
		"flag_1": "Created Count",
		"flag_2": "Created Qty",
		"flag_3": "Created AOV",
		"flag_4": "Closed Won Count",
		"flag_5": "Closed Won Qty",
		"flag_6": "Closed Won AOV",
		"flag_7": "Closed Lost Count",
		"flag_8": "Closed lost qty",
		"flag_9": "Closed lost aov",
		"flag_10": "Closed NoDeal Count",
		"flag_11": "Closed NoDeal Qty",
		"flag_12": "Closed NoDeal AOV",
		"flag_13": "Closed drop Count",
		"flag_14": "Closed drop  Qty",
		"flag_15": "Closed drop AOV",
		"flag_16": "closing next month count",
		"flag_17": "closing next month qty",
		"flag_18": "closing next month aov",
		"flag_19": "closing current qtr count",
		"flag_20": "closing current qtr qty",
		"flag_21": "closing current qtr aov"
	},
	"status_tags": {
		"Identify": 143,
		"Qualify": 144,
		"Propose": 145,
		"Negotiate": 147,
		"Won": 148,
		"Lost": 160,
		"No Deal": 161,
		"Dropped": 162
	},
	"status_tags_array": [
		"Identify", "Qualify", "Propose", "Negotiate", "Won", "Lost", "No Deal", "Dropped"
	],
	"error_response": {
		"vertical_name": "",
		"flag_1": "",
		"flag_2": "",
		"flag_3": "",
		"flag_4": ""
	}
};

analyticsConfig.resource = {
	"128": {
		"resource_name": "Resource",
		"flag_1": "Open Oppty Count",
		"flag_2": "Open Oppty Qty",
		"flag_3": "Open Oppty AOV",
		"flag_4": "Closed Won Count",
		"flag_5": "Closed Won Qty",
		"flag_6": "Closed Won AOV"
	},
	"129": {
		"resource_name": "Resource",
		"flag_1": "Identify Count",
		"flag_2": "Identify Qty",
		"flag_3": "Identify  AOV",
		"flag_4": "Qualify Count",
		"flag_5": "Qualify Qty",
		"flag_6": "Qualify AOV",
		"flag_7": "Proposal Count",
		"flag_8": "Proposal Qty",
		"flag_9": "Proposal  AOV",
		"flag_10": "Negotiate Count",
		"flag_11": "Negotiate Qty",
		"flag_12": "Negotiate AOV",
		"flag_13": "Closed won Count",
		"flag_14": "Closed won Qty",
		"flag_15": "Closed won AOV",
		"flag_16": "Closed lost Count",
		"flag_17": "Closed lost  Qty",
		"flag_18": "Closed lost AOV",
		"flag_19": "Closed drop Count",
		"flag_20": "Closed drop  Qty",
		"flag_21": "Closed drop AOV",
		"flag_22": "Closed NoDeal Count",
		"flag_23": "Closed NoDeal  Qty",
		"flag_24": "Closed NoDeal AOV"
	},
	"130": {
		"resource_name": "Resource",
		"flag_1": "Created Count",
		"flag_2": "Created Qty",
		"flag_3": "Created AOV",
		"flag_4": "Closed Won Count",
		"flag_5": "Closed Won Qty",
		"flag_6": "Closed Wol AOV",
		"flag_7": "Closed Lost Count",
		"flag_8": "Closed lost qty",
		"flag_9": "Closed lost aov",
		"flag_10": "Closed drop Count",
		"flag_11": "Closed drop  Qty",
		"flag_12": "Closed drop AOV",
		"flag_13": "Closed NoDeal Count",
		"flag_14": "Closed NoDeal Qty",
		"flag_15": "Closed NoDeal AOV",
		"flag_16": "closing next month count",
		"flag_17": "closing next month qty",
		"flag_18": "closing next month aov",
		"flag_19": "closing current qtr count",
		"flag_20": "closing current qtr qty",
		"flag_21": "closing current qtr aov"
	},
	"status_tags": {
		"Identify": 143,
		"Qualify": 144,
		"Propose": 145,
		"Negotiate": 147
	},
	"error_response": {
		"resource_name": "",
		"flag_1": "",
		"flag_2": "",
		"flag_3": "",
		"flag_4": ""
	}
};