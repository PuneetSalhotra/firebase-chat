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
		"flag_2": "Open Oppty Quantity",
		"flag_3": "Open Oppty Value",
		"flag_4": "Closed Oppty Count",
		"flag_5": "Closed Oppty Quantity",
		"flag_6": "Closed Oppty Value"
	},
	"129": {
		"vertical_name": "Vertical",
		"flag_1": "Identify Count",
		"flag_2": "Identify Quantity",
		"flag_3": "Identify  Value",
		"flag_4": "Qualify Count",
		"flag_5": "Qualify Quantity",
		"flag_6": "Qualify Value",
		"flag_7": "Proposal Count",
		"flag_8": "Proposal Quantity",
		"flag_9": "Proposal  Value",
		"flag_10": "Negotiate Count",
		"flag_11": "Negotiate Quantity",
		"flag_12": "Negotiate Value",
		"flag_13": "Closed won Count",
		"flag_14": "Closed won Quantity",
		"flag_15": "Closed won Value",
		"flag_16": "Closed lost Count",
		"flag_17": "Closed lost  Quantity",
		"flag_18": "Closed lost Value",
		"flag_19": "Closed NoDeal Count",
		"flag_20": "Closed NoDeal  Quantity",
		"flag_21": "Closed NoDeal Value",
		"flag_22": "Closed drop Count",
		"flag_23": "Closed drop  Quantity",
		"flag_24": "Closed drop Value"
	},
	"130": {
		"vertical_name": "Vertical",
		"flag_1": "Created Count",
		"flag_2": "Created Qty",
		"flag_3": "Created Value",
		"flag_4": "Closed Won Count",
		"flag_5": "Closed Won Qty",
		"flag_6": "Closed Won Value",
		"flag_7": "Closed Lost Count",
		"flag_8": "Closed lost quantity",
		"flag_9": "Closed lost value",
		"flag_10": "Closed NoDeal Count",
		"flag_11": "Closed NoDeal Quantity",
		"flag_12": "Closed NoDeal Value",
		"flag_13": "Closed drop Count",
		"flag_14": "Closed drop  Quantity",
		"flag_15": "Closed drop Value",
		"flag_16": "closing next month count",
		"flag_17": "closing next month quantity",
		"flag_18": "closing next month value",
		"flag_19": "closing Cur quarter count",
		"flag_20": "closing Cur quarter quantity",
		"flag_21": "closing Cur quarter value"
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
		"flag_2": "Open Oppty Quantity",
		"flag_3": "Open Oppty Value",
		"flag_4": "Closed Oppty Count",
		"flag_5": "Closed Oppty Quantity",
		"flag_6": "Closed Oppty Value"
	},
	"129": {
		"resource_name": "Resource",
		"flag_1": "Identify Count",
		"flag_2": "Identify Quantity",
		"flag_3": "Identify  Value",
		"flag_4": "Qualify Count",
		"flag_5": "Qualify Quantity",
		"flag_6": "Qualify Value",
		"flag_7": "Proposal Count",
		"flag_8": "Proposal Quantity",
		"flag_9": "Proposal  Value",
		"flag_10": "Negotiate Count",
		"flag_11": "Negotiate Quantity",
		"flag_12": "Negotiate Value",
		"flag_13": "Closed won Count",
		"flag_14": "Closed won Quantity",
		"flag_15": "Closed won Value",
		"flag_16": "Closed lost Count",
		"flag_17": "Closed lost  Quantity",
		"flag_18": "Closed lost Value",
		"flag_19": "Closed drop Count",
		"flag_20": "Closed drop  Quantity",
		"flag_21": "Closed drop Value",
		"flag_22": "Closed NoDeal Count",
		"flag_23": "Closed NoDeal  Quantity",
		"flag_24": "Closed NoDeal Value"
	},
	"130": {
		"resource_name": "Resource",
		"flag_1": "Created Count",
		"flag_2": "Created Qty",
		"flag_3": "Created Value",
		"flag_4": "Closed Won Count",
		"flag_5": "Closed Won Qty",
		"flag_6": "Closed Wol Value",
		"flag_7": "Closed Lost Count",
		"flag_8": "Closed lost quantity",
		"flag_9": "Closed lost value",
		"flag_10": "Closed drop Count",
		"flag_11": "Closed drop  Quantity",
		"flag_12": "Closed drop Value",
		"flag_13": "Closed NoDeal Count",
		"flag_14": "Closed NoDeal Quantity",
		"flag_15": "Closed NoDeal Value",
		"flag_16": "closing next month count",
		"flag_17": "closing next month quantity",
		"flag_18": "closing next month value",
		"flag_19": "closing Cur quarter count",
		"flag_20": "closing Cur quarter quantity",
		"flag_21": "closing Cur quarter value"
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