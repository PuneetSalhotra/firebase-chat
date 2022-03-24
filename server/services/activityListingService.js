/*
 * author: Sri Sai Venkatesh
 */

const { serializeError } = require("serialize-error");
const logger = require("../logger/winstonLogger");

const AWS = require('aws-sdk');
AWS.config.update({
	"accessKeyId": "AKIAWIPBVOFRSFSVJZMF",
	"secretAccessKey": "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",
	"region": "ap-south-1"
});
const sqs = new AWS.SQS();
const uuidv4 = require('uuid/v4');

function ActivityListingService(objCollection) {

	let db = objCollection.db;
	let util = objCollection.util;
	let activityCommonService = objCollection.activityCommonService;
	let forEachAsync = objCollection.forEachAsync;
	const moment = require("moment");
	const XLSX = require("xlsx");
	const nodeUtil = require('util');
	const path = require('path');
	const self = this;

	const ActivityTimelineService = require('../services/activityTimelineService');
    const activityTimelineService = new ActivityTimelineService(objCollection);
	this.getActivityListDifferential = function (request, callback) {
		let paramsArr = new Array();
		let queryString = '';
		if (request.hasOwnProperty('activity_type_category_id') && Number(request.device_os_id) === 5) {
			switch (Number(request.activity_type_category_id)) {
				case 15: //Video Conference BETA
					paramsArr = new Array(
						request.asset_id,
						request.organization_id,
						request.account_id,
						request.workforce_id,
						request.activity_type_category_id,
						request.activity_sub_type_id,
						request.page_start,
						util.replaceQueryLimit(request.page_limit)
					);
					queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_category_sub_type', paramsArr);
					break;
				default:
					paramsArr = new Array(
						request.asset_id,
						request.organization_id,
						request.account_id,
						request.workforce_id,
						request.activity_type_category_id,
						request.datetime_differential,
						request.page_start,
						util.replaceQueryLimit(request.page_limit)
					);
					queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_category', paramsArr);
					break;
			}
		} else {
			paramsArr = new Array(
				request.organization_id,
				request.asset_id,
				request.datetime_differential,
				request.page_start,
				util.replaceQueryLimit(request.page_limit)
			);
			//queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_differential', paramsArr);
			queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_signup_differential', paramsArr);
		}
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				//console.log(data);
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	this.getActivityListDifferentialV2 = function (request, callback) {
		let paramsArr = new Array();
		let queryString = '';
		if (request.hasOwnProperty('activity_type_category_id') && Number(request.device_os_id) === 5) {
			switch (Number(request.activity_type_category_id)) {
				case 15: //Video Conference BETA
					paramsArr = new Array(
						request.asset_id,
						request.organization_id,
						request.account_id,
						request.workforce_id,
						request.activity_type_category_id,
						request.activity_sub_type_id,
						request.page_start,
						util.replaceQueryLimit(request.page_limit)
					);
					queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_category_sub_type', paramsArr);
					break;
				default:
					paramsArr = new Array(
						request.asset_id,
						request.organization_id,
						request.account_id,
						request.workforce_id,
						request.activity_type_category_id,
						request.datetime_differential,
						request.page_start,
						util.replaceQueryLimit(request.page_limit)
					);
					queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_category', paramsArr);
					break;
			}
		} else {
			paramsArr = new Array(
				request.organization_id,
				request.asset_id,
				request.datetime_differential,
				request.page_start,
				util.replaceQueryLimit(request.page_limit)
			);
			//queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_differential', paramsArr);
			queryString = util.getQueryString('ds_v1_1_activity_asset_mapping_select_asset_signup_differential', paramsArr);
		}
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				//console.log(data);
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	//PAM
	this.getActivityAssetAccountLevelDifferential = function (request, callback) {
		let paramsArr = new Array();
		let queryString = '';
		paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.asset_id,
			request.datetime_differential,
			request.page_start,
			util.replaceQueryLimit(request.page_limit)
		);
		queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_account_differential', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				//console.log(data);
				if (err === false) {
					formatActivityAccountListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	//BETA
	this.getAllFolders = function (request, callback) {
		let paramsArr = new Array();
		let queryString = '';
		let activityTypeCategoryId = Number(request.activity_type_category_id) || 0;
		if (activityTypeCategoryId === 28) {
			paramsArr = new Array(
				request.asset_id,
				request.organization_id,
				request.account_id,
				request.workforce_id,
				request.search_string,
				request.page_start,
				util.replaceQueryLimit(request.page_limit)
			);
			queryString = util.getQueryString('ds_p1_activity_asset_mapping_search_postit', paramsArr);
		} else {
			paramsArr = new Array(
				request.asset_id,
				request.organization_id,
				request.account_id,
				request.workforce_id,
				activityTypeCategoryId,
				request.activity_sub_type_id,
				request.is_unread,
				request.is_status,
				request.is_due_date,
				request.is_sort,
				request.is_search, //1 for searching
				request.search_string,
				request.flag,
				request.start_datetime,
				request.end_datetime,
				request.page_start,
				util.replaceQueryLimit(request.page_limit)
			);
			queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_folders_all', paramsArr);
		}
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				//console.log(data);
				if (err === false) {
					formatActivityAccountListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	//BETA
	this.getAllProjects = function (request, callback) {
		let paramsArr = new Array();
		let queryString = '';
		paramsArr = new Array(
			request.asset_id,
			request.parent_activity_id,
			request.organization_id,
			request.sub_task_category_type_id,
			request.activity_sub_type_id,
			request.page_start,
			util.replaceQueryLimit(request.page_limit)
		);
		queryString = util.getQueryString('ds_v1_1_activity_asset_mapping_select_asset_sub_tasks', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				//console.log(data);
				if (err === false) {
					formatActivityAccountListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9998);
					return;
				}
			});
		}

	};

	//PAM
	let formatActivityAccountListing = function (data, callback) {
		let responseData = new Array();
		data.forEach(function (rowData, index) {
			let rowDataArr = {
				"activity_id": util.replaceDefaultNumber(rowData['activity_id']),
				"activity_title": util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(rowData['activity_title']))),
				"activity_description": util.replaceDefaultString(util.decodeSpecialChars(rowData['activity_description'])),
				"activity_inline_data": JSON.parse(util.replaceDefaultString(rowData['activity_inline_data'])),
				"activity_type_id": util.replaceDefaultNumber(rowData['activity_type_id']),
				"activity_type_name": (util.replaceDefaultString(rowData['activity_type_id']) === 1) ? 'Personal ' : util.replaceDefaultString(rowData['activity_type_name']),
				"activity_type_category_id": util.replaceDefaultNumber(rowData['activity_type_category_id']),
				"activity_type_category_name": util.replaceDefaultString(rowData['activity_type_category_name']),
				"activity_sub_type_id": util.replaceDefaultNumber(rowData['activity_sub_type_id']),
				"activity_sub_type_name": util.replaceDefaultString(rowData['activity_sub_type_name']),
				"activity_datetime_created": util.replaceDefaultDatetime(rowData['activity_datetime_created']),
				"activity_datetime_start_expected": util.replaceDefaultDatetime(rowData['activity_datetime_start_expected']),
				"activity_datetime_end_expected": util.replaceDefaultDatetime(rowData['activity_datetime_end_expected']),
				"activity_datetime_end_deferred": util.replaceDefaultDatetime(rowData['activity_datetime_end_deferred']),
				"activity_datetime_end_estimated": util.replaceDefaultDatetime(rowData['activity_datetime_end_estimated']),
				"activity_datetime_closed": util.replaceDefaultDatetime(rowData['activity_datetime_closed']),
				"activity_datetime_last_updated": util.replaceDefaultDatetime(rowData['activity_datetime_last_updated']),
				"activity_status_id": util.replaceDefaultNumber(rowData['activity_status_id']),
				"activity_status_name": util.replaceDefaultString(rowData['activity_status_name']),
				"activity_status_type_id": util.replaceDefaultNumber(rowData['activity_status_type_id']),
				"activity_status_type_name": util.replaceDefaultString(rowData['activity_status_type_name']),
				"activity_status_type_category_id": util.replaceDefaultNumber(rowData['activity_status_type_category_id']),
				"activity_status_type_category_name": util.replaceDefaultString(rowData['activity_status_type_category_name']),
				"activity_pinned_enabled": util.replaceZero(rowData['activity_pinned_enabled']),
				"activity_priority_enabled": util.replaceZero(rowData['activity_priority_enabled']),
				"activity_participant_count": util.replaceZero(rowData['participant_count']),
				"activity_owner_asset_id": util.replaceDefaultNumber(rowData['activity_owner_asset_id']),
				"activity_owner_asset_first_name": util.replaceDefaultString(rowData['activity_owner_asset_first_name']),
				"activity_owner_asset_last_name": util.replaceDefaultString(rowData['activity_owner_asset_last_name']),
				"activity_owner_asset_image_path": util.replaceDefaultString(rowData['activity_owner_asset_image_path']),
				"activity_owner_asset_type_id": util.replaceDefaultNumber(rowData['activity_owner_asset_type_id']),
				"activity_owner_asset_type_name": util.replaceDefaultString(rowData['activity_owner_asset_type_name']),
				"activity_owner_asset_type_category_id": util.replaceDefaultNumber(rowData['activity_owner_asset_type_category_id']),
				"activity_owner_asset_type_category_name": util.replaceDefaultString(rowData['activity_owner_asset_type_category_name']),
				"activity_lead_asset_id": util.replaceDefaultNumber(rowData['activity_lead_asset_id']),
				"activity_lead_asset_first_name": util.replaceDefaultString(rowData['activity_lead_asset_first_name']),
				"activity_lead_asset_last_name": util.replaceDefaultString(rowData['activity_lead_asset_last_name']),
				"activity_lead_asset_image_path": util.replaceDefaultString(rowData['activity_lead_asset_image_path']),
				"activity_lead_asset_type_id": util.replaceDefaultNumber(rowData['activity_lead_asset_type_id']),
				"activity_lead_asset_type_name": util.replaceDefaultString(rowData['activity_lead_asset_type_name']),
				"activity_lead_asset_type_category_id": util.replaceDefaultNumber(rowData['activity_lead_asset_type_category_id']),
				"activity_lead_asset_type_category_name": util.replaceDefaultString(rowData['activity_lead_asset_type_category_name']),
				"parent_activity_id": util.replaceDefaultNumber(rowData['parent_activity_id']),
				"parent_activity_title": util.replaceDefaultString(util.decodeSpecialChars(rowData['parent_activity_title'])),
				"parent_activity_type_id": util.replaceDefaultNumber(rowData['parent_activity_type_id']),
				"parent_activity_type_name": util.replaceDefaultString(rowData['parent_activity_type_name']),
				"parent_activity_type_category_id": util.replaceDefaultNumber(rowData['parent_activity_type_category_id']),
				"parent_activity_type_category_name": util.replaceDefaultString(rowData['parent_activity_type_category_name']),
				//"parent_activity_total_count": util.replaceZero(rowData['parent_activity_total_count']),
				//"parent_activity_priority_count": util.replaceZero(rowData['parent_activity_priority_count']),
				"parent_activity_open_count": util.replaceZero(rowData['parent_activity_open_count']),
				"parent_activity_closed_count": util.replaceZero(rowData['parent_activity_closed_count']),
				//"parent_activity_asset_participation_count": util.replaceZero(rowData['parent_activity_asset_participation_count']),
				"asset_datetime_last_differential": util.replaceDefaultDatetime(rowData['asset_datetime_last_differential']),
				"asset_datetime_last_seen": util.replaceDefaultDatetime(rowData['asset_datetime_last_seen']),
				"asset_participant_access_id": util.replaceDefaultNumber(rowData['asset_participant_access_id']),
				"asset_participant_access_name": util.replaceDefaultString(rowData['asset_participant_access_name']),
				"asset_unread_updates_count": util.replaceZero(rowData['asset_unread_updates_count']),
				//"asset_unread_field_updates_count": util.replaceZero(rowData['asset_unread_field_updates_count']),
				"asset_notification_muted": util.replaceDefaultString(rowData['asset_notification_muted']),
				"asset_id": util.replaceDefaultNumber(rowData['asset_id']),
				"asset_first_name": util.replaceDefaultString(rowData['asset_first_name']),
				"asset_last_name": util.replaceDefaultString(rowData['asset_last_name']),
				"asset_image_path": util.replaceDefaultString(rowData['asset_image_path']),
				"asset_type_id": util.replaceDefaultNumber(rowData['asset_type_id']),
				"asset_type_name": util.replaceDefaultString(rowData['asset_type_name']),
				"asset_type_category_id": util.replaceDefaultNumber(rowData['asset_type_category_id']),
				"asset_type_category_name": util.replaceDefaultString(rowData['activity_sub_type_name']),
				"operating_asset_id": util.replaceZero(rowData['operating_asset_id']),
				"operating_asset_first_name": util.replaceDefaultString(rowData['operating_asset_first_name']),
				"operating_asset_last_name": util.replaceDefaultString(rowData['operating_asset_last_name']),
				"operating_asset_image_path": util.replaceDefaultString(rowData['operating_asset_image_path']),
				"operating_asset_type_id": util.replaceDefaultNumber(rowData['operating_asset_type_id']),
				"operating_asset_type_name": util.replaceDefaultString(rowData['operating_asset_type_name']),
				"operating_asset_type_category_id": util.replaceDefaultNumber(rowData['operating_asset_type_category_id']),
				"operating_asset_type_category_name": util.replaceDefaultString(rowData['operating_asset_type_category_name']),
				"operating_asset_phone_country_code": util.replaceDefaultString(rowData['operating_asset_phone_country_code']),
				"operating_asset_phone_number": util.replaceDefaultString(rowData['operating_asset_phone_number']),
				"operating_asset_email_id": util.replaceDefaultString(rowData['operating_asset_email_id']),
				"workforce_id": util.replaceZero(rowData['workforce_id']),
				"workforce_name": util.replaceDefaultString(rowData['workforce_name']),
				"workforce_image_path": util.replaceDefaultString(rowData['workforce_image_path']),
				"workforce_type_id": util.replaceDefaultNumber(rowData['workforce_type_id']),
				"workforce_type_name": util.replaceDefaultString(rowData['workforce_type_name']),
				"workforce_type_category_id": util.replaceDefaultNumber(rowData['workforce_type_category_id']),
				"workforce_type_category_name": util.replaceDefaultString(rowData['workforce_type_category_name']),
				"account_id": util.replaceZero(rowData['account_id']),
				"account_name": util.replaceDefaultString(rowData['account_name']),
				"account_image_path": util.replaceDefaultString(rowData['account_image_path']),
				"account_type_id": util.replaceDefaultNumber(rowData['account_type_id']),
				"account_type_name": util.replaceDefaultString(rowData['account_type_name']),
				"account_type_category_id": util.replaceDefaultNumber(rowData['account_type_category_id']),
				"account_type_category_name": util.replaceDefaultString(rowData['account_type_category_name']),
				"organization_id": util.replaceDefaultNumber(rowData['organization_id']),
				"organization_name": util.replaceDefaultString(rowData['organization_name']),
				"organization_image_path": util.replaceDefaultString(rowData['organization_image_path']),
				"organization_type_id": util.replaceDefaultNumber(rowData['organization_type_id']),
				"organization_type_name": util.replaceDefaultString(rowData['organization_type_name']),
				"organization_type_category_id": util.replaceDefaultNumber(rowData['organization_type_category_id']),
				"organization_type_category_name": util.replaceDefaultString(rowData['organization_type_category_name']),
				"form_transaction_id": util.replaceZero(rowData['form_transaction_id']),
				"form_id": util.replaceZero(rowData['form_id']),
				"field_id": util.replaceDefaultNumber(rowData['field_id']),
				//"activity_form_approval_status": util.replaceDefaultString(rowData['activity_form_approval_status']),
				//"activity_form_approval_datetime": util.replaceDefaultDatetime(rowData['activity_form_approval_datetime']),
				"channel_activity_id": util.replaceDefaultNumber(rowData['channel_activity_id']),
				"channel_activity_type_category_id": util.replaceDefaultNumber(rowData['channel_activity_type_category_id']),
				"log_message_unique_id": util.replaceDefaultNumber(rowData['log_message_unique_id']),
				"log_retry": util.replaceDefaultNumber(rowData['log_retry']),
				"log_offline": util.replaceDefaultNumber(rowData['log_offline']),
				"log_asset_id": util.replaceDefaultNumber(rowData['log_asset_id']),
				"log_asset_first_name": util.replaceDefaultString(rowData['log_asset_first_name']),
				"log_asset_last_name": util.replaceDefaultString(rowData['log_asset_last_name']),
				"log_asset_image_path": util.replaceDefaultString(rowData['log_asset_image_path']),
				"log_datetime": util.replaceDefaultDatetime(rowData['asset_datetime_last_differential']),
				"log_state": util.replaceDefaultNumber(rowData['log_state']),
				"log_active": util.replaceDefaultNumber(rowData['log_active']),
				"update_sequence_id": util.replaceDefaultNumber(rowData['log_asset_image_path']),
				"activity_creator_operating_asset_id": util.replaceDefaultNumber(rowData['activity_creator_operating_asset_id']),
				"activity_creator_operating_asset_first_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_first_name']),
				"activity_creator_operating_asset_last_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_last_name']),
				"activity_creator_asset_id": util.replaceDefaultNumber(rowData['activity_creator_asset_id']),
				"activity_creator_asset_first_name": util.replaceDefaultString(rowData['activity_creator_asset_first_name']),
				"activity_creator_asset_last_name": util.replaceDefaultString(rowData['activity_creator_asset_last_name'])
			};
			responseData.push(rowDataArr);
		}, this);
		callback(false, responseData);
	};

	this.getActivityInlineCollection = function (request, callback) {
		let logDatetime = util.getCurrentUTCTime();
		request['datetime_log'] = logDatetime;
		activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
		activityCommonService.getActivityDetails(request, 0, function (err, activityData) {
			if (err === false) {
				formatActivityInlineCollection(activityData, {}, function (err, responseData) {
					if (err === false) {
						callback(false, {
							data: responseData
						}, 200);
					} else {
						callback(false, {}, -9999)
					}
				});

				return;
			} else {
				// some thing is wrong and have to be dealt
				callback(err, false, -9999);
				return;
			}
		});
	};

	this.getActivityCoverCollection = function (request, callback) {
		let logDatetime = util.getCurrentUTCTime();
		request['datetime_log'] = logDatetime;
		activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
		let paramsArr = new Array(
			request.activity_id,
			request.asset_id,
			request.organization_id
		);
		let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					if (data.length > 0) {
						let coverCollection = {};
						coverCollection.activity_title = util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(data[0]['activity_title'])));
						coverCollection.activity_datetime_start = util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(data[0]['activity_datetime_start_expected'])));
						coverCollection.activity_duedate = util.replaceDefaultString(data[0]['activity_datetime_end_expected']);
						coverCollection.activity_description = util.replaceDefaultString(util.decodeSpecialChars(data[0]['activity_description']));
						coverCollection.activity_completion_percentage = util.replaceDefaultString(data[0]['activity_completion_percentage']); //BETA
						formatActivityInlineCollection(data, coverCollection, function (err, responseData) {
							if (err === false) {
								callback(false, {
									data: responseData
								}, 200);
							} else {
								callback(false, {}, -9999)
							}
						});
					} else {
						callback(false, {}, 200);
					}
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	this.getActivityCoverCollectionV1 = function (request, callback) {
		let logDatetime = util.getCurrentUTCTime();
		let monthly_summary = {};
		//monthly_summary.owned_tasks_response = -1;
		//monthly_summary.inmail_response_rate = -1;
		monthly_summary.completion_rate = -1;
		monthly_summary.unread_update_response_rate = -1;
		monthly_summary.average_value = -1;
		request['datetime_log'] = logDatetime;
		activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
		let paramsArr = new Array(
			request.activity_id,
			request.operating_asset_id,
			request.organization_id
		);
		let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							//callback(false, {data:{activity_cover: finalData, monthly_summary:{}}}, 200);
							paramsArr = new Array(
								request.asset_id,
								request.operating_asset_id,
								request.organization_id,
								1,
								//util.getStartDayOfMonth()
								util.getStartDayOfPrevMonth()
							);
							queryString = util.getQueryString('ds_p1_asset_monthly_summary_transaction_select_flag', paramsArr);
							if (queryString != '') {
								db.executeQuery(1, queryString, request, function (err, statsData) {
									if (err === false) {
										//console.log('statsData :', statsData);
										statsData.forEach(function (rowData, index) {
											switch (rowData.monthly_summary_id) {
												/*case 8:     //Response rate of owned tasks 
													monthly_summary.owned_tasks_response = util.replaceDefaultNumber(rowData['data_entity_decimal_1']);
													break;
												case 10:    //10	Response Rate - InMail
													monthly_summary.inmail_response_rate = util.replaceDefaultNumber(rowData['data_entity_decimal_1']);
													break;*/
												case 12: // 12	Completion rate - Lead
													monthly_summary.completion_rate = util.replaceDefaultNumber(rowData['data_entity_decimal_1']);
													break;
												case 22: // 22	unread update response rate
													monthly_summary.unread_update_response_rate = util.replaceDefaultNumber(rowData['data_entity_double_1']);
													break;
											}
										}, this);
										let denominator = 0;

										//(monthly_summary.owned_tasks_response > 0)? denominator++: monthly_summary.owned_tasks_response = 0;
										//(monthly_summary.inmail_response_rate > 0)? denominator++: monthly_summary.inmail_response_rate = 0;
										(monthly_summary.completion_rate > 0) ? denominator++ : monthly_summary.completion_rate = 0;
										(monthly_summary.unread_update_response_rate > 0) ? denominator++ : monthly_summary.unread_update_response_rate = 0;


										// console.log('Denominator after processing : ' + denominator);
										//console.log('monthly_summary.owned_tasks_response : ' + monthly_summary.owned_tasks_response);
										//console.log('monthly_summary.inmail_response_rate : ' + monthly_summary.inmail_response_rate);
										// console.log('monthly_summary.completion_rate : ' + monthly_summary.completion_rate);
										// console.log('monthly_summary.unread_update_response_rate : ' + monthly_summary.unread_update_response_rate);

										//global.logger.write('debug', 'Denominator after processing: ' + denominator, {}, {});
										util.logInfo(request,`formatActivityListing debug Denominator after processing: %j`,{denominator : denominator,request});
										//global.logger.write('debug', 'monthly_summary.completion_rate: ' + monthly_summary.completion_rate, {}, {});
										util.logInfo(request,`formatActivityListing debug monthly_summary.completion_rate %j`,{monthly_summary_completion_rate : monthly_summary.completion_rate,request});
										//global.logger.write('debug', 'monthly_summary.unread_update_response_rate: ' + monthly_summary.unread_update_response_rate, {}, {});
										util.logInfo(request,`formatActivityListing debug monthly_summary.unread_update_response_rate: %j`,{monthly_summary_unread_update_response_rate : monthly_summary.unread_update_response_rate, request});

										if (denominator == 0) {
											monthly_summary.average_value = -1;
										} else {
											//monthly_summary.average_value = (monthly_summary.owned_tasks_response + monthly_summary.inmail_response_rate + monthly_summary.completion_rate) / denominator;
											monthly_summary.average_value = (monthly_summary.completion_rate + monthly_summary.unread_update_response_rate) / denominator;
										}

										finalData[0].activity_inline_data.monthly_summary = monthly_summary;
										//console.log('finalData : ' + finalData);
										callback(false, {
											data: finalData
										}, 200);
									} else {
										callback(err, false, -9999);
									}
								});
							}
						} else {
							callback(err, false, -9999);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}
	};

	this.getCoworkers = function (request, callback) {

		let paramsArr = new Array(
			request.asset_id,
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.datetime_differential,
			request.page_start,
			request.page_limit
		);
		let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_category_coworker', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};
	//this function will search both contacts and coworkers
	this.searchSharedContacts = function (request, callback) {

		let paramsArr = new Array(
			request.asset_id,
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.contact_search_string,
			request.page_start,
			util.replaceQueryLimit(request.page_limit)
		);

		let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_coworker', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, coworkerData) {
				if (err === false) {
					if (coworkerData.length > 0) {
						formatActivityListing(coworkerData, function (err, finalCoworkerData) {
							if (err === false) {
								searchContacts(request, function (err, finalContactsData) {
									if (finalContactsData.length > 0) {
										callback(false, {
											data: finalCoworkerData.concat(finalContactsData)
										}, 200);
									} else {
										callback(false, {
											data: finalCoworkerData
										}, 200);
									}
								});
							}
						});
					} else {
						searchContacts(request, function (err, finalContactsData) {
							callback(false, {
								data: finalContactsData
							}, 200);
						});
					}
				} else {
					callback(err, false, -9999);
					return;

				}
			});
		}

	};

	this.listContacts = function (request, callback) {

		let paramsArr = new Array(
			request.asset_id,
			request.workforce_id,
			request.account_id,
			request.organization_id,
			request.flag_search,
			request.search_string,
			request.page_start,
			util.replaceQueryLimit(request.page_limit)
		);
		// IN p_is_search TINYINT(4), IN p_search_string VARCHAR(100), IN p_start_from BIGINT(20), IN p_limit_value TINYINT(4)

		let queryString = util.getQueryString('ds_p1_activity_asset_mapping_search_contact_inline', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, coworkerData) {
				console.log(coworkerData);
				//global.logger.write('debug', 'coworkerData' + JSON.stringify(coworkerData, null, 2), {}, {});
				util.logInfo(request,`listContacts debug coworkerData %j`,{coworkerData : JSON.stringify(coworkerData, null, 2),request});

				if (err === false) {
					if (coworkerData.length > 0) {
						formatActivityListing(coworkerData, function (err, finalCoworkerData) {
							if (err === false) {
								callback(false, {
									data: finalCoworkerData
								}, 200);
							} else {
								callback(false, {}, 200);
							}
						});
					} else {
						callback(false, {}, 200);
					}
				} else {
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	this.searchActivityByType = function (request, callback) {

		let paramsArr = new Array(
			request.asset_id,
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.activity_type_category_id,
			request.search_string,
			request.page_start,
			util.replaceQueryLimit(request.page_limit)
		);

		let paramsArrForCalendar = new Array(
			request.asset_id,
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.search_string,
			request.page_start,
			util.replaceQueryLimit(request.page_limit)
		);

		let queryString = '';
		switch (Number(request.activity_type_category_id)) {
			case 8: // mail
				queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_inline', paramsArr);
				break;
			case 10: //File BETA
				let paramsArrForFile = new Array(
					request.asset_id,
					request.organization_id,
					request.account_id,
					request.workforce_id,
					request.activity_type_category_id,
					request.search_string,
					request.activity_sub_type_id,
					request.page_start,
					util.replaceQueryLimit(request.page_limit)
				);
				queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_sub_type', paramsArrForFile);
				break;
			case 15: //Video Conference BETA
				let paramsArrForVideoConf = new Array(
					request.asset_id,
					request.organization_id,
					request.account_id,
					request.workforce_id,
					request.activity_type_category_id,
					request.activity_sub_type_id,
					request.search_string,
					request.page_start,
					util.replaceQueryLimit(request.page_limit)
				);
				queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_cat_sub_type_title', paramsArrForVideoConf);
				break;
			case 31: //calendar event
				queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_calendar', paramsArrForCalendar);
				break;
			default:
				queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_title', paramsArr);
				break;
		}

		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	let searchContacts = function (request, callback) {

		let paramsArr = new Array(
			request.asset_id,
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.contact_search_string,
			request.page_start,
			util.replaceQueryLimit(request.page_limit)
		);

		let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_contact', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, contactsData) {
				if (err === false) {
					formatActivityListing(contactsData, function (err, finalContactsData) {
						if (err === false) {
							callback(false, finalContactsData);
						}
					});

				} else {
					callback(err, false, -9999);
					return;

				}
			});
		}
	};

	this.searchMail = function (request, callback) {

		let paramsArr = new Array(
			request.asset_id,
			request.organization_id,
			request.account_id,
			request.workforce_id,
			5,
			request.contact_search_string,
			request.page_start,
			util.replaceQueryLimit(request.page_limit)
		);
		let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_search_category_inline', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {

					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	this.getDuevsTotal = function (request, callback) {
		let logDatetime = util.getCurrentUTCTime();
		request['datetime_log'] = logDatetime;

		let paramsArr = new Array(
			request.organization_id,
			request.activity_id,
			request.datetime_log // previously 0
		);
		//var queryString = util.getQueryString('ds_v1_activity_list_select_project_status_counts', paramsArr);
		let queryString = util.getQueryString('ds_p1_activity_list_select_project_status_counts', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
				if (err === false) {
					callback(false, {
						data: data
					}, 200);
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	this.getActivityListDateRange = function (request, callback) {

		let paramsArr = new Array(
			request.organization_id,
			request.asset_id,
			request.datetime_start, //00:00:00
			request.datetime_end // 23:59:59
		);
		let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_open_payroll_activity', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	this.getAllContactTypes = function (request, callback) {

		let paramsArr = new Array(
			request.workforce_id,
			request.account_id,
			request.organization_id,
			request.page_start,
			request.page_limit
		);
		let queryString = util.getQueryString('ds_p1_activity_list_select_contacts', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	this.searchAllContactTypes = function (request, callback) {

		let paramsArr = new Array(
			request.workforce_id,
			request.account_id,
			request.organization_id,
			request.search_string,
			request.page_start,
			request.page_limit
		);
		let queryString = util.getQueryString('ds_p1_activity_list_select_contact_search', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	//BETA
	this.getVideoConfSchedule = function (request, callback) {

		let paramsArr = new Array(
			request.asset_id,
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.activity_type_category_id,
			request.is_status,
			request.is_sort,
			request.is_search,
			request.search_string,
			request.start_datetime,
			request.end_datetime,
			request.page_start,
			util.replaceQueryLimit(request.page_limit)
		);
		let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_category_datetime', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	//BETA
	this.getOptimumMeetingRoom = function (request, callback) {

		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.meeting_workforce_id,
			request.participant_count,
			request.start_datetime,
			request.end_datetime
		);
		let queryString = util.getQueryString('ds_v1_asset_list_select_meeting_room', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	this.getAllPendingCounts = function (request, callback) {
		let taskCnt;
		let endDate = util.getCurrentDate() + " 23:59:59";
		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.operating_asset_id,
			request.activity_type_category_id,
			request.activity_sub_type_id,
			endDate //util.getCurrentUTCTime()
		);
		let queryString = util.getQueryString('ds_p1_activity_asset_maaping_select_task_pending_count', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					// console.log('Data of pending count : ', data);
					//global.logger.write('debug', 'Data of pending count: ' + JSON.stringify(data, null, 2), {}, {});
					util.logInfo(request,`getAllPendingCounts debug Data of pending count: %j`,{data : JSON.stringify(data, null, 2),request});

					(data.length > 0) ? taskCnt = data[0].count : taskCnt = 0;
					getCatGrpCts(request).then((resp) => {
						resp.push({
							count: taskCnt,
							activity_type_category_id: 101,
							activity_type_category_name: 'Task'
						});
						callback(false, resp, 200);
					}).catch((err) => {
						// console.log(err);
						//global.logger.write('debug', err, err, request);
						util.logError(request,`getAllPendingCounts debug Error %j`, { err,request });

						callback(err, false, -9999);
					})
				} else {
					callback(err, false, -9999);
				}
			});
		}
	}

	this.getAllPendingCountsV1 = function (request, callback) {
		let taskCnt;
		let responseArray = new Array();
		let projectCnt = 0;

		let startDatetime = util.getCurrentDate() + " 00:00:00";
		let endDatetime = util.getCurrentDate() + " 23:59:59";
		let currentDatetime = util.getCurrentUTCTime();
		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.operating_asset_id,
			request.activity_type_category_id,
			request.activity_sub_type_id,
			request.flag_filter,
			request.search_string,
			startDatetime,
			endDatetime,
			currentDatetime,
			request.coworker_asset_id || 0,
			request.parent_activity_id || 0
		);
		let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_task_list_filters_count', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					// console.log('Data of pending count : ', data);
					//global.logger.write('debug', 'Data of pending count: ' + JSON.stringify(data, null, 2), {}, {});
					util.logInfo(request,`getAllPendingCountsV1 debug Data of pending count: %j`,{data : JSON.stringify(data, null, 2),request});

					(data.length > 0) ? taskCnt = data[0].count : taskCnt = 0;
					getCatGrpCts(request).then((resp) => {

						forEachAsync(resp, (next, row) => {
							if (row.activity_type_category_id == 11) {
								projectCnt = row.count;
							}
							next();
						}).then(() => {
							forEachAsync(resp, (next, innerRow) => {
								if (innerRow.activity_type_category_id == 10) {
									innerRow.count = innerRow.count + projectCnt;
								}

								if (innerRow.activity_type_category_id != 11) {
									responseArray.push(innerRow);
								}

								next();
							}).then(() => {
								responseArray.push({
									count: taskCnt,
									activity_type_category_id: 10,
									activity_type_category_name: 'Task'
								});
								getProjectBadgeCounts(request).then((response) => {
									(response.length > 0) ? responseArray.push({
										count: response[0].count || 0,
										activity_type_category_id: 11,
										activity_type_category_name: 'Project'
									}) : taskCnt = 0;
									//resp.push(response);                            
									callback(false, responseArray, 200);
								}).catch((err) => {
									// console.log(err);
									//global.logger.write('debug', err, err, request);
									util.logError(request,`getProjectBadgeCounts debug Error %j`, { err,request });

									callback(err, false, -9999);
								});
							});
						});


					}).catch((err) => {
						// console.log(err);
						//global.logger.write('debug', err, err, request);
						util.logError(request,`getAllPendingCountsV1 debug Error %j`, { err,request });

						callback(err, false, -9999);
					})
				} else {
					callback(err, false, -9999);
				}
			});
		}
	}

	this.getTasks = function (request, callback) {
		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.operating_asset_id,
			request.activity_type_category_id,
			request.activity_sub_type_id,
			request.page_start || 0,
			util.replaceQueryLimit(request.page_limit)
		);
		let queryString = util.getQueryString('ds_p1_activity_asset_maaping_select_task_pending', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					callback(err, false, -9999);
				}
			});
		}
	};

	this.getTasksV1 = function (request, callback) {
		let currentDatetime = util.getCurrentUTCTime();
		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.operating_asset_id,
			request.activity_type_category_id,
			request.activity_sub_type_id,
			request.flag_filter,
			request.search_string,
			request.start_datetime,
			request.end_datetime,
			request.page_start || 0,
			util.replaceQueryLimit(request.page_limit),
			currentDatetime,
			request.coworker_asset_id || 0,
			request.parent_activity_id || 0
		);
		let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_task_list_filters', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					callback(err, false, -9999);
				}
			});
		}
	};

	this.pendingInmailCount = function (request, callback) {
		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.operating_asset_id,
			request.activity_type_category_id,
			request.activity_sub_type_id,
			request.start_datetime,
			request.end_datetime,
			util.getCurrentUTCTime()
		);
		let queryString = util.getQueryString('ds_p1_1_activity_asset_maaping_select_task_pending_count', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					// console.log('Inmail pending count : ', data);
					//global.logger.write('debug', 'Inmail pending count: ' + JSON.stringify(data, null, 2), {}, {});
					util.logInfo(request,`pendingInmailCount debug Inmail pending count: %j`,{data : JSON.stringify(data, null, 2),request});

					(data.length > 0) ? callback(false, data, 200) : callback(false, {}, 200);
				} else {
					callback(err, false, -9999);
				}
			});
		}
	};

	let getTaskListFilterCounts = function (request, filter, callback) {
		// if case 14 current date time = current date time - 24 hrs
		// if case 15 start datetime = current datetime, end date time = current datetime + 24 hrs
		let startDatetime, endDatetime, currentDatetime;
		switch (filter) {
			case 14:
				startDatetime = util.getCurrentDate() + " 00:00:00";
				endDatetime = util.getCurrentDate() + " 23:59:59";
				currentDatetime = util.subtractDays(util.getCurrentUTCTime(), 1);
				break;
			case 15:
				startDatetime = util.subtractDays(util.getCurrentUTCTime(), 1);
				endDatetime = util.getCurrentUTCTime();
				currentDatetime = util.getCurrentUTCTime();
				break;
			default:
				startDatetime = util.getCurrentDate() + " 00:00:00";
				endDatetime = util.getCurrentDate() + " 23:59:59";
				currentDatetime = util.getCurrentUTCTime();
				break;
		}
		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.operating_asset_id,
			request.activity_type_category_id,
			request.activity_sub_type_id,
			filter,
			request.search_string,
			startDatetime,
			endDatetime,
			currentDatetime,
			request.coworker_asset_id || 0,
			request.parent_activity_id || 0
		);

		let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_task_list_filters_count', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {

					if (filter !== 10) {
						callback(false, {
							count: data[0].count
						});
					} else {
						callback(false, {
							pending_count: data[0].pending_count,
							past_due_count: data[0].past_due_count,
							due_today_count: data[0].due_today_count
						});
					}
				} else {
					callback(err, false);
				}
			});
		}

	};


	this.getTaskListCounts = function (request, callback) {

		let flags = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17];
		let response = {};
		forEachAsync(flags, function (next, flagValue) {

			getTaskListFilterCounts(request, flagValue, function (err, data) {
				if (err) {
					callback(err, {}, -9998);
					return;
				}
				switch (flagValue) {
					case 0:
						response.all_count = data;
						break;
					case 1:
						response.pending_count = data;
						break;
					case 2:
						response.past_due_count = data;
						break;
					case 3:
						response.due_today_count = data;
						break;
					case 4:
						response.due_future_count = data;
						break;
					case 5:
						response.search_count = data;
						break;
					case 6:
						response.creator_count = data;
						break;
					case 7:
						response.lead_count = data;
						break;
					case 8:
						response.project_count = data;
						break;
					case 9:
						response.no_lead_count = data;
						break;
					case 11:
						response.non_project_count = data;
						break;
					case 12:
						response.co_worker_lead_count = data;
						break;
					case 13:
						response.project_all_count = data;
						break;
					case 14:
						response.pending_exceeding_24hr_count = data;
						break;
					case 15:
						response.pending_next_24hr_count = data;
						break;
					case 17:
						response.no_file = data;
						break;
				}
				next();
			});


		}).then(function () {
			callback(false, response, 200);
		});

	}

	function getCatGrpCts(request) {
		return new Promise((resolve, reject) => {
			const paramsArr = new Array(
				request.asset_id,
				request.workforce_id,
				request.account_id,
				request.organization_id
			);
			const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_asst_act_cat_grp_counts', paramsArr);
			if (queryString != '') {
				db.executeQuery(1, queryString, request, async (err, resp) => {
					if (err === false) {
						// console.log('Data of group counts : ', resp);
						//global.logger.write('debug', 'Data of group counts: ' + JSON.stringify(resp, null, 2), {}, {});
						util.logInfo(request,`getCatGrpCts Data of group counts: %j`,{data : JSON.stringify(resp, null, 2),request});

						let [err, data] = await getMentionsCount(request);
						for (let i = 0; i < resp.length; i++) {
							if (Number(resp[i].activity_type_category_id) === 48) {
								resp[i].mentions_count = (data.length > 0) ? data[0].count : 0;
							}
						}

						return resolve(resp);
						/*forEachAsync(resp, (next, row)=>{                            
							if(row.activity_type_category_id == 11) {
								   projectCnt = row.count;                                   
							   }
							next();
							}).then(()=>{                               
							   forEachAsync(resp, (next, innerRow)=>{
									if(innerRow.activity_type_category_id == 10) {
										   innerRow.count = innerRow.count + projectCnt;
									   }
									
									if(innerRow.activity_type_category_id != 11) {
										   responseArray.push(innerRow);
									   }
									   
									next();
									}).then(()=>{
										return resolve(responseArray);
									});                                    
							});*/
					} else {
						return reject(err);
					}
				});
			}
		});

	}

	function getProjectBadgeCounts(request) {
		return new Promise((resolve, reject) => {
			let paramsArr = new Array(
				request.organization_id,
				request.asset_id,
				util.getCurrentUTCTime()
			);
			let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_project_pending_count', paramsArr);
			if (queryString != '') {
				db.executeQuery(1, queryString, request, function (err, resp) {
					if (err === false) {
						// console.log('Badge Counts : ', resp);
						//global.logger.write('debug', 'Badge Counts: ' + JSON.stringify(resp, null, 2), {}, {});
						util.logInfo(request,`getProjectBadgeCounts debug Badge Counts: %j`,{data : JSON.stringify(resp, null, 2),request});

						return resolve(resp);
					} else {
						return reject(err);
					}
				});
			}
		});

	}

	let formatActivityInlineCollection = function (data, collection, callback) {

		let responseData = new Array();
		data.forEach(function (rowData, index) {
			let rowDataArr = {
				"activity_id": util.replaceDefaultNumber(rowData['activity_id']),
				"activity_title": util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(rowData['activity_title']))),
				//"activity_inline_data": JSON.parse(rowData['activity_inline_data']),
				"asset_id": util.replaceDefaultNumber(rowData['asset_id']),
				"asset_first_name": util.replaceDefaultString(rowData['asset_first_name']),
				"asset_last_name": util.replaceDefaultString(rowData['asset_last_name']),
				"workforce_id": util.replaceZero(rowData['workforce_id']),
				"workforce_name": util.replaceDefaultString(rowData['workforce_name']),
				"account_id": util.replaceZero(rowData['account_id']),
				"account_name": util.replaceDefaultString(rowData['account_name']),
				"organization_id": util.replaceZero(rowData['organization_id']),
				"organization_name": util.replaceDefaultString(rowData['organization_name'])
			};
			if (Object.keys(collection).length > 0) {
				rowDataArr.activity_cover_data = collection;
			} else
				rowDataArr.activity_inline_data = JSON.parse(rowData['activity_inline_data']);
			responseData.push(rowDataArr);
		}, this);
		callback(false, responseData);
	};

	let formatActivityListing = function (data, callback) {
		let responseData = new Array();
		data.forEach(function (rowData, index) {
			let activityCreatorAssetId;
			let activityCreatorAssetFirstName;
			let activityCreatorAssetLastName;
			let activityCreatorAssetImagePath;

			(util.replaceDefaultNumber(rowData['activity_creator_asset_id']) == 0) ?
				activityCreatorAssetId = util.replaceDefaultNumber(rowData['activity_lead_asset_id']) :
				activityCreatorAssetId = util.replaceDefaultNumber(rowData['activity_creator_asset_id']);

			(util.replaceDefaultString(rowData['activity_creator_asset_first_name']) == "") ?
				activityCreatorAssetFirstName = util.replaceDefaultString(rowData['activity_lead_asset_first_name']) :
				activityCreatorAssetFirstName = util.replaceDefaultString(rowData['activity_creator_asset_first_name']);

			(util.replaceDefaultString(rowData['activity_creator_asset_last_name']) == "") ?
				activityCreatorAssetLastName = util.replaceDefaultString(rowData['activity_lead_asset_last_name']) :
				activityCreatorAssetLastName = util.replaceDefaultString(rowData['activity_creator_asset_last_name']);

			(util.replaceDefaultString(rowData['activity_creator_asset_image_path']) == "") ?
				activityCreatorAssetImagePath = util.replaceDefaultString(rowData['activity_lead_asset_image_path']) :
				activityCreatorAssetImagePath = util.replaceDefaultString(rowData['activity_creator_asset_image_path']);

			let rowDataArr = {
				"organization_id": util.replaceDefaultNumber(rowData['organization_id']),
				"activity_id": util.replaceDefaultNumber(rowData['activity_id']),
				"activity_title": util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(rowData['activity_title']))),
				"activity_description": util.replaceDefaultString(util.decodeSpecialChars(rowData['activity_description'])),
				"activity_inline_data": JSON.parse(util.replaceDefaultJSON(rowData['activity_inline_data'])),
				"activity_type_id": util.replaceDefaultNumber(rowData['activity_type_id']),
				"activity_type_name": (util.replaceDefaultString(rowData['activity_type_id']) === 1) ? 'Personal ' : util.replaceDefaultString(rowData['activity_type_name']),
				"activity_type_category_id": util.replaceDefaultNumber(rowData['activity_type_category_id']),
				"activity_type_category_name": util.replaceDefaultString(rowData['activity_type_category_name']),
				"activity_datetime_start_expected": util.replaceDefaultDatetime(rowData['activity_datetime_start_expected']),
				"activity_datetime_end_expected": util.replaceDefaultString(rowData['activity_datetime_end_expected']),
				"activity_datetime_end_deferred": util.replaceDefaultString(rowData['activity_datetime_end_deferred']),
				"activity_datetime_end_estimated": util.replaceDefaultString(rowData['activity_datetime_end_estimated']),
				"activity_priority_enabled": util.replaceZero(rowData['activity_priority_enabled']),
				"activity_pinned_enabled": util.replaceZero(rowData['activity_pinned_enabled']),
				"activity_flag_active": util.replaceZero(rowData['is_active']),
				"activity_location_latitude": util.replaceZero(rowData['activity_location_latitude']),
				"activity_location_longitude": util.replaceZero(rowData['activity_location_longitude']),
				"activity_status_id": util.replaceDefaultNumber(rowData['activity_status_id']),
				"activity_status_name": util.replaceDefaultString(rowData['activity_status_name']),
				"activity_status_type_id": util.replaceDefaultNumber(rowData['activity_status_type_id']),
				"activity_status_type_name": util.replaceDefaultString(rowData['activity_status_type_name']),
				"activity_owner_asset_id": util.replaceDefaultNumber(rowData['activity_owner_asset_id']),
				"activity_owner_asset_first_name": util.replaceDefaultString(rowData['activity_owner_asset_first_name']),
				"activity_owner_asset_last_name": util.replaceDefaultString(rowData['activity_owner_asset_last_name']),
				"activity_owner_asset_image_path": util.replaceDefaultString(rowData['activity_owner_asset_image_path']),
				"activity_update_count": util.replaceDefaultNumber(rowData['asset_unread_updates_count']),
				"asset_unread_field_updates_count": util.replaceDefaultNumber(rowData['asset_unread_field_updates_count']),
				"asset_unread_updates_count": util.replaceDefaultNumber(rowData['asset_unread_updates_count']),
				"asset_id": util.replaceDefaultNumber(rowData['asset_id']),
				"workforce_id": util.replaceZero(rowData['workforce_id']),
				"workforce_name": util.replaceDefaultString(rowData['workforce_name']),
				"activity_image_path": util.replaceDefaultActivityImage(rowData['activity_image_path']),
				"log_asset_id": util.replaceDefaultNumber(rowData['log_asset_id']),
				"log_state": util.replaceDefaultNumber(rowData['log_state']),
				"log_active": util.replaceDefaultNumber(rowData['log_active']),
				"log_datetime": util.replaceDefaultDatetime(rowData['asset_datetime_last_differential']),
				"asset_participant_access_id": util.replaceDefaultNumber(rowData['asset_participant_access_id']),
				"asset_participant_access_name": util.replaceDefaultString(rowData['asset_participant_access_name']),
				"parent_activity_id": util.replaceDefaultNumber(rowData['parent_activity_id']),
				"parent_activity_title": util.replaceDefaultString(util.decodeSpecialChars(rowData['parent_activity_title'])),
				"parent_activity_datetime_start_expected": util.replaceDefaultDatetime(rowData['parent_activity_datetime_start_expected']),
				"parent_activity_datetime_end_expected": (util.replaceDefaultString(rowData['parent_activity_datetime_end_differed']) !== '') ? util.replaceDefaultDatetime(rowData['parent_activity_datetime_end_  ']) : util.replaceDefaultDatetime(rowData['parent_activity_datetime_end_expected']), //parentActivityEndDiffered,
				"parent_activity_type_id": util.replaceDefaultNumber(rowData['parent_activity_type_id']),
				"parent_activity_type_name": util.replaceDefaultString(rowData['parent_activity_type_name']),
				"parent_activity_type_category_id": util.replaceDefaultNumber(rowData['parent_activity_type_category_id']),
				"parent_activity_type_category_name": util.replaceDefaultString(rowData['parent_activity_type_category_name']),
				"parent_activity_open_count": util.replaceDefaultNumber(rowData['parent_activity_open_count']),
				"parent_activity_closed_count": util.replaceDefaultNumber(rowData['parent_activity_closed_count']),
				"activity_participant_count": util.replaceZero(rowData['activity_participant_count']),
				"account_id": util.replaceZero(rowData['account_id']),
				"account_name": util.replaceDefaultString(rowData['account_name']),
				"form_id": util.replaceZero(rowData['form_id']),
				"form_transaction_id": util.replaceZero(rowData['form_transaction_id']),
				"operating_asset_id": util.replaceZero(rowData['operating_asset_id']),
				"operating_asset_first_name": util.replaceDefaultString(rowData['operating_asset_first_name']),
				"operating_asset_last_name": util.replaceDefaultString(rowData['operating_asset_last_name']),
				"activity_sub_type_id": util.replaceDefaultNumber(rowData['activity_sub_type_id']),
				"activity_sub_type_name": util.replaceDefaultString(rowData['activity_sub_type_name']),
				//BETA
				//"activity_creator_asset_id": util.replaceDefaultNumber(rowData['activity_lead_asset_id']),
				//"activity_creator_asset_first_name": util.replaceDefaultString(rowData['activity_lead_asset_first_name']),
				//"activity_creator_asset_last_name": util.replaceDefaultString(rowData['activity_lead_asset_last_name']),
				//"activity_creator_asset_image_path": util.replaceDefaultString(rowData['activity_lead_asset_image_path']),
				"activity_creator_asset_id": activityCreatorAssetId,
				"activity_creator_asset_first_name": activityCreatorAssetFirstName,
				"activity_creator_asset_last_name": activityCreatorAssetLastName,
				"activity_creator_asset_image_path": activityCreatorAssetImagePath,
				"activity_creator_operating_asset_id": util.replaceDefaultNumber(rowData['activity_creator_operating_asset_id']),
				"activity_creator_operating_asset_first_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_first_name']),
				"activity_creator_operating_asset_last_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_last_name']),
				//Response Required Flag
				"activity_flag_delivery_ontime": util.replaceDefaultNumber(rowData['activity_flag_delivery_ontime']),
				"activity_flag_delivery_quality": util.replaceDefaultNumber(rowData['activity_flag_delivery_quality']),
				"activity_flag_response_required": util.replaceDefaultNumber(rowData['activity_flag_response_required']),
				"activity_flag_response_ontime": util.replaceDefaultNumber(rowData['activity_flag_response_ontime']),
				"activity_flag_creator_status": util.replaceDefaultNumber(rowData['activity_flag_creator_status']),
				"activity_flag_lead_status": util.replaceDefaultNumber(rowData['activity_flag_lead_status']),
				"activity_datetime_creator_status": util.replaceDefaultDatetime(rowData['activity_datetime_creator_status']),
				"activity_datetime_lead_assigned": util.replaceDefaultDatetime(rowData['activity_datetime_lead_assigned']),
				"activity_datetime_lead_status": util.replaceDefaultDatetime(rowData['activity_datetime_lead_status']),
				"activity_datetime_created": util.replaceDefaultDatetime(rowData['activity_datetime_created']),
				//"activity_creator_operating_asset_id": util.replaceDefaultNumber(rowData['activity_creator_operating_asset_id']),
				//"activity_creator_operating_asset_first_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_first_name']),
				//"activity_creator_operating_asset_last_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_last_name']),
				//"activity_creator_asset_id": util.replaceDefaultNumber(rowData['activity_creator_asset_id']),
				//"activity_creator_asset_first_name": util.replaceDefaultString(rowData['activity_creator_asset_first_name']),
				//"activity_creator_asset_last_name": util.replaceDefaultString(rowData['activity_creator_asset_last_name']),
				"activity_flag_rating_creator": util.replaceDefaultNumber(rowData['activity_rating_creator']),
				"activity_rating_creator_decision": util.replaceDefaultNumber(rowData['activity_rating_creator_decision']),
				"activity_rating_creator_planning": util.replaceDefaultNumber(rowData['activity_rating_creator_planning']),
				"activity_rating_creator_specification": util.replaceDefaultNumber(rowData['activity_rating_creator_specification']),
				"activity_flag_rating_lead": util.replaceDefaultNumber(rowData['activity_rating_lead']),
				"activity_rating_lead_ownership": util.replaceDefaultNumber(rowData['activity_rating_lead_ownership']),
				"activity_rating_lead_completion": util.replaceDefaultNumber(rowData['activity_rating_lead_completion']),
				"activity_rating_lead_timeliness": util.replaceDefaultNumber(rowData['activity_rating_lead_timeliness']),
				"activity_flag_file_enabled": util.replaceDefaultNumber(rowData['activity_flag_file_enabled']),
				"count": util.replaceDefaultNumber(rowData['count']),
				"activity_workflow_completion_percentage": parseInt(util.replaceDefaultNumber(rowData['activity_workflow_completion_percentage'])),
				"widget_id": parseInt(util.replaceDefaultNumber(rowData['widget_id'])),
				"widget_name": parseInt(util.replaceDefaultString(rowData['widget_name'])),
				"widget_type_id": parseInt(util.replaceDefaultNumber(rowData['widget_type_id'])),
				"widget_type_name": parseInt(util.replaceDefaultString(rowData['widget_type_name'])),
				"activity_status_description": util.replaceDefaultString(rowData['activity_status_description']),
				"activity_status_flag_tracking_enabled": parseInt(util.replaceDefaultNumber(rowData['activity_status_flag_tracking_enabled'])),
				"activity_lead_asset_id": parseInt(util.replaceDefaultNumber(rowData['activity_lead_asset_id'])),
				"activity_lead_asset_first_name": util.replaceDefaultString(rowData['activity_lead_asset_first_name']),
				"activity_lead_operating_asset_id": parseInt(util.replaceDefaultNumber(rowData['activity_lead_operating_asset_id'])),
				"activity_lead_operating_asset_first_name": util.replaceDefaultString(rowData['activity_lead_operating_asset_first_name']),
				"activity_lead_operating_asset_last_name": util.replaceDefaultString(rowData['activity_lead_operating_asset_last_name']),
				"activity_lead_operating_asset_phone_number": parseInt(util.replaceDefaultNumber(rowData['activity_lead_operating_asset_phone_number'])),
				"activity_lead_operating_asset_phone_country_code": parseInt(util.replaceDefaultNumber(rowData['activity_lead_operating_asset_phone_country_code'])),
				"activity_datetime_end_status": util.replaceDefaultString(rowData['activity_datetime_end_status']),
				"activity_flag_status_rollback": util.replaceDefaultNumber(rowData['activity_flag_status_rollback']),
				"activity_flag_lead_enabled": util.replaceDefaultNumber(rowData['activity_flag_lead_enabled']),
				"activity_datetime_participant_added": util.replaceDefaultDatetime(rowData['activity_datetime_participant_added']),
				"activity_type_flag_control_visibility": util.replaceDefaultNumber(rowData['activity_type_flag_control_visibility']),
				"activity_cuid_1": util.replaceDefaultString(rowData['activity_cuid_1']),
				"activity_cuid_2": util.replaceDefaultString(rowData['activity_cuid_2']),
				"activity_cuid_3": util.replaceDefaultString(rowData['activity_cuid_3']),
				"asset_unread_mention_count": util.replaceDefaultNumber(rowData['asset_unread_mention_count']),
				"parent_status_id": util.replaceDefaultNumber(rowData['parent_status_id']),
				"parent_status_name": util.replaceDefaultString(rowData['parent_status_name']),
				"activity_type_tag_id": util.replaceDefaultNumber(rowData['activity_type_tag_id']),
				"activity_type_tag_name": util.replaceDefaultString(rowData['activity_type_tag_name']),
				"tag_type_id": util.replaceDefaultNumber(rowData['tag_type_id']),
				"tag_type_name": util.replaceDefaultString(rowData['tag_type_name']),
				"asset_flag_is_owner": util.replaceDefaultNumber(rowData['asset_flag_is_owner'])
			};
			responseData.push(rowDataArr);
		}, this);
		callback(false, responseData);
	};

	this.getAssetTasksInProjCount = function (request, callback) {
		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.project_activity_id,
			request.activity_type_category_id,
			request.activity_sub_type_id
		);
		let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_project_sub_task_ount', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					callback(false, data, 200);
				} else {
					callback(true, err, -9999);
				}
			});
		}
	}

	this.getLatestPayrollActivity = function (request, callback) {
		let paramsArr = new Array(
			request.organization_id,
			request.asset_id
		);
		let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_latest_payroll_activity', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	this.searchActivityByCategory = function (request, callback) {
		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.operating_asset_id || 0,
			request.activity_type_category_id,
			request.activity_sub_type_id, // 0 if activity_type_category_id is not 10
			request.flag_filter, // p_flter_flag = 0 - all	// p_flter_flag = 1 - unread	// p_flter_flag = 2 - completed	// p_flter_flag = 3 - past due	// p_flter_flag = 4 - search
			request.search_string,
			request.datetime_differential,
			request.flag_sort,
			request.page_start,
			util.replaceQueryLimit(request.page_limit)
		);
		let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_project_task_filter', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, finalData) {
						if (err === false) {
							callback(false, {
								data: finalData
							}, 200);
						}
					});
					return;
				} else {
					// some thing is wrong and have to be dealt
					callback(err, false, -9999);
					return;
				}
			});
		}

	};

	this.getOrganizationsOfANumber = async function (requestHeaders, request, callback) {
		let queryString = '';
		let phoneNumber;
		let countryCode;
		let email;

		if ((Number(requestHeaders['x-grene-auth-flag']) === 1) || !(requestHeaders['x-grene-auth-flag'])) { //Redis			
			phoneNumber = request.phone_number;
			countryCode = request.country_code;
		} else {
			if (requestHeaders.hasOwnProperty('x-grene-p-code-flag') && (Number(requestHeaders['x-grene-p-code-flag']) === 1)) {
				phoneNumber = request.phone_number;
				countryCode = request.country_code;
			} else if(requestHeaders.hasOwnProperty('x-grene-e-flag') && (Number(requestHeaders['x-grene-e-flag']) === 1)) { // email OTP
				email = requestHeaders['x-grene-e'];
			} else {
				phoneNumber = requestHeaders['x-grene-p-code'];
				countryCode = requestHeaders['x-grene-c-code'];
			}
		}

		const paramsArr = new Array(
			request.organization_id || 0,
			phoneNumber, //request.phone_number,
			countryCode  //request.country_code
		);

		if(email) {
			const paramsArr = new Array(
				request.organization_id || 0,
				email
			);
			queryString = util.getQueryString('ds_p1_asset_list_select_email_all', paramsArr);
		} else if (request.hasOwnProperty("allow_temp_organization")) {
			queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all', paramsArr);
		} else {
			queryString = util.getQueryString('ds_p1_asset_list_select_phone_number_all_filter', paramsArr);
		}

		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					let organizationMap = {}, duplicateOrganization = false;
					if (Array.isArray(data)) {
						data = data.map((assetData) => {

							if(organizationMap[assetData.organization_id]) {
								duplicateOrganization = true;
							}
							delete assetData.asset_phone_passcode;
							delete assetData.asset_passcode_expiry_datetime;
							delete assetData.asset_passcode_expiry_datetime;
							delete assetData.asset_push_notification_id;
							organizationMap[assetData.organization_id] = 1;
							return assetData;
						});
					}

					if(requestHeaders.hasOwnProperty('x-grene-e-flag') && duplicateOrganization) 
						return callback({ message : "Your email is linked with more than one resource"}, {}, -3299);
					else 
						callback(false, data, 200);
				} else {
					callback(err, false, -9999);
				}
			});
		}
	};

	this.listMeetingsByDateRangeOrSearchString = function (request, callback) {
		// Parameters: 
		// IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
		// IN p_asset_id BIGINT(20), IN p_operating_asset_id BIGINT(20), IN p_activity_type_category_id 
		// SMALLINT(6), IN p_sub_type_id SMALLINT(6), IN p_flter_flag SMALLINT(6), IN p_search_string 
		// VARCHAR(100), IN p_datetime_start DATETIME, IN p_datetime_end DATETIME, IN p_datetime DATETIME, 
		// IN p_coworker_asset_id BIGINT(20), IN p_parent_activity_id BIGINT(20), IN p_start_from 
		// BIGINT(20), IN p_limit_value TINYINT(4)
		// 
		// p_flter_flag values:
		// 0 => all meetings in a date range 
		// 1 => meetings in a date range which are in progress or scheduled
		// 11 => search all meetings in a date range
		// 
		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.operating_asset_id,
			request.activity_type_category_id,
			request.sub_type_id || 0,
			request.flter_flag,
			request.search_string,
			request.datetime_start,
			request.datetime_end,
			request.datetime || '1970-01-01 00:00:00',
			request.coworker_asset_id || 0,
			request.parent_activity_id || 0,
			request.start_from,
			request.limit_value
		);
		let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_day_planner_filters', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					formatActivityListing(data, function (err, formattedlData) {
						if (err === false) {
							callback(false, formattedlData, 200);
						}
					});
				} else {
					callback(err, false, -9999);
				}
			});
		}
	};

	this.countOfMeetingsByDateRangeOrSearchString = function (request, callback) {
		// Parameters: 
		// IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
		// IN p_asset_id BIGINT(20), IN p_operating_asset_id BIGINT(20), IN p_activity_type_category_id 
		// SMALLINT(6), IN p_sub_type_id SMALLINT(6), IN p_flter_flag SMALLINT(6), IN p_search_string 
		// VARCHAR(100), IN p_datetime_start DATETIME, IN p_datetime_end DATETIME, IN p_datetime DATETIME, 
		// IN p_coworker_asset_id BIGINT(20), IN p_parent_activity_id BIGINT(20)
		// 
		// p_flter_flag values:
		// 0 => all meetings in a date range 
		// 1 => meetings in a date range which are in progress or scheduled
		// 11 => search all meetings in a date range
		// 
		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.operating_asset_id,
			request.activity_type_category_id,
			request.sub_type_id || 0,
			request.flter_flag,
			request.search_string,
			request.datetime_start,
			request.datetime_end,
			request.datetime || '1970-01-01 00:00:00',
			request.coworker_asset_id || 0,
			request.parent_activity_id || 0
		);
		let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_day_planner_filters_count', paramsArr);
		if (queryString != '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					callback(false, data, 200);
				} else {
					callback(err, false, -9999);
				}
			});
		}
	};

	this.checkIfChatExists = function (request, callback) {
		// Parameters: 
		// IN p_organization_id BIGINT(20), IN p_creator_asset_id BIGINT(20), 
		// IN p_owner_asset_id BIGINT(20)
		// 
		let paramsArr = new Array(
			request.organization_id,
			request.creator_asset_id,
			request.owner_asset_id
		);
		let queryString = util.getQueryString('ds_p1_activity_list_select_asset_chat', paramsArr);
		if (queryString !== '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					// Verify if a chat exists
					if (data.length > 0) {
						// Chat exists
						callback(false, {
							isChatExists: true,
							data: data
						}, 200);
					} else {
						// Chat doesn't exist
						callback(false, {
							isChatExists: false,
							data: data
						}, 200);
					}
				} else {
					// Error executing the query
					callback(err, false, -9999);
				}
			});
		}
	};

	this.fetchRecentChatList = function (request, callback) {
		// Parameters: 
		// IN p_organization_id BIGINT(20), IN p_asset_id BIGINT(20), 
		// IN p_start_from BIGINT(20), IN p_limit_value SMALLINT(6)
		// 
		let paramsArr = new Array(
			request.organization_id,
			request.asset_id,
			request.start_from || 0,
			request.limit_value || 50
		);
		// Replaced 'ds_p1_activity_list_select_asset_recent_chats' 
		// with 'ds_p1_activity_asset_mapping_select_recent_chats'
		let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_recent_chats', paramsArr);
		if (queryString !== '') {
			db.executeQuery(1, queryString, request, function (err, data) {
				if (err === false) {
					callback(false, data, 200);
				} else {
					// Error executing the query
					callback(err, false, -9999);
				}
			});
		}
	};


	this.getActivityFormFieldValidationData = function (request) {
		return new Promise((resolve, reject) => {
			activityCommonService.getActivityByFormTransaction(request).then((data) => {
				if (data.length > 0) {
					processFormInlineDataV1(request, data).then(async (finalData) => {
						//console.log("finalData : "+finalData);									
						resolve(finalData);
					});
				} else {
					resolve(data);
				}
			});
		});
	};

	this.downloadZipFile = async (request) => {
		try {
			let inlineData = request.attachments;
			//let inlineData = JSON.parse(request.attachments);		
			//console.log('inlineDAta : ', inlineData);
			let files = [];
			for (let i = 0; i < inlineData.length; i++) {
				console.log(inlineData[i]);
				let fileName = await util.downloadS3Object(request, inlineData[i]);
				files.push(fileName);
			}

			await new Promise((resolve) => {
				setTimeout(() => {
					resolve();
				}, 2000);
			});

			let zipFile = await util.zipTheFiles(request, files);
			let url = await util.uploadS3Object(request, zipFile);
			return [false, url];
		} catch (err) {
			console.log(err);
			return [true, err];
		}

	};

	/* 
	 this.getActivityFormFieldValidationData = function (request) {
		 return new Promise((resolve, reject)=>{
			 var paramsArr = new Array(	        		
					 request.activity_id,
					 request.form_transaction_id,
					 request.organization_id
					 );
 	
			 var queryString = util.getQueryString('ds_v1_activity_list_select_form_transaction', paramsArr);
			 if (queryString != '') {
				 db.executeQuery(0, queryString, request, function (err, data) {
					 //console.log("err "+err);
					if(err === false) {
								 //console.log('data: '+data.length);
								 if(data.length > 0)
									 {
										 processFormInlineData(request, data).then((finalData)=>{
												 //console.log("finalData : "+finalData);
												 resolve(finalData);
											 });
									 }else{
									 	
										 resolve(data);
									 }
																							   
					 } else {
						reject(err);
					}
				 });
			   }
		 });
	 }; */

	function processFormInlineData(request, data) {
		return new Promise(async (resolve, reject) => {
			let array = [];
			let inlineData = JSON.parse(data[0].activity_inline_data);
			//console.log('inline DATA : ', inlineData);

			for (let i = 0; i < inlineData.length; i++) {
				let fieldData = await activityCommonService.getFormFieldDefinition(request, inlineData[i]);
				if (fieldData !== true) {
					if (fieldData.length > 0) {
						//console.log('fieldData : ', fieldData[0].field_value_edit_enabled);
						inlineData[i].field_value_edit_enabled = fieldData[0].field_value_edit_enabled;
					} else {
						inlineData[i].field_value_edit_enabled = 1;
					}
				} else {
					inlineData[i].field_value_edit_enabled = 1;
				}

				if (JSON.parse(JSON.stringify(inlineData[i])).hasOwnProperty("field_validated")) {
					array.push(inlineData[i]);
				}
				else {
					inlineData[i].field_validated = 0;
					array.push(inlineData[i]);
				}
			}

			data[0].activity_inline_data = array;
			resolve(data);

			//forEachAsync(JSON.parse(data[0].activity_inline_data), function (next, fieldData) {
			//	//console.log('fieldData : '+JSON.stringify(fieldData));
			//	if(JSON.parse(JSON.stringify(fieldData)).hasOwnProperty("field_validated")){
			//		//.log("HAS FIELD VALIDATED : "+fieldData.field_id);
			//		array.push(fieldData);
			//			next();
			//	}else{		    				
			//		//console.log("FIELD NOT VALIDATED : "+fieldData.field_id);
			//		fieldData.field_validated = 0;
			//		//console.log("FIELD NOT VALIDATED : "+fieldData.field_validated);
			//		array.push(fieldData);		    				
			//		next();
			//		
			//	}              
			//
			//}).then(()=>{
			//	//console.log("DATA : "+JSON.stringify(data));
			//	data[0].activity_inline_data = array;
			//	resolve(data);
			//});	    		
		});
	};

	this.getFormList = function (request) {
		return new Promise((resolve, reject) => {
			let paramsArr = new Array(
				request.organization_id,
				request.account_id,
				request.workforce_id,
				0,
				0,
				50
			);

			let queryString = util.getQueryString('ds_v1_workforce_form_mapping_select_organization', paramsArr);
			if (queryString != '') {
				db.executeQuery(1, queryString, request, function (err, data) {
					//console.log("err "+err);
					if (err === false) {
						//console.log('data: '+data.length);
						if (data.length > 0) {
							processFormListData(request, data).then((finalData) => {
								//console.log("finalData : "+finalData);
								resolve(finalData);
							});
						} else {

							resolve(data);
						}
					} else {
						reject(err);
					}
				});
			}
		});
	};

	function processFormListData(request, data) {
		return new Promise((resolve, reject) => {
			let obj = {};
			forEachAsync(data, function (next, fieldData) {
				//console.log('fieldData : '+JSON.stringify(fieldData));
				obj[fieldData.form_name] = fieldData.form_id;
				next();
			}).then(() => {
				console.log(obj);
				resolve(obj);
			});
		});
	};


	this.getMyQueueActivities = function (request) {
		return new Promise((resolve, reject) => {

			let paramsArr = new Array(
				request.organization_id,
				request.account_id,
				request.workforce_id,
				request.target_asset_id,
				request.page_start,
				request.page_limit
			);
			let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_myqueue_activities', paramsArr);
			if (queryString != '') {
				db.executeQuery(1, queryString, request, function (err, data) {
					//console.log('queryString : '+queryString+ "err "+err+ ": data.length "+data.length);
					if (err === false) {
						resolve(data);
					} else {
						reject(err);
					}
				});
			}
		});
	};

	this.getMyQueueActivitiesV2 = function (request) {
		//flag - 0 && activity_status_id = 0
		// -->you will get all orders

		//flag - 0 && activity_status_id = some value
		// -->you will get the orders based on the status id value

		//flag - 3 && activity_status_id = 0
		// -->you will get all the statuses
		return new Promise((resolve, reject) => {
			// IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
			// IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20), 
			// IN p_flag TINYINT(4), IN p_sort_flag TINYINT(4), 
			// IN p_start_from INT(11), IN p_limit_value TINYINT(4)
			const paramsArr = new Array(
				request.organization_id,
				request.account_id,
				request.workforce_id,
				request.target_asset_id,

				request.activity_type_id || 0,
				request.activity_status_id || 0,
				request.activity_status_type_id || 0,

				request.sort_flag || 0, // 0 => Ascending | 1 => Descending
				//Flag = -1 (After removing the Join between activity asset Mapping and MyQueue)
				request.flag || 0, // 0 => Due date | 1 => Created date
				request.page_start,
				request.page_limit
			);
			//const queryString = util.getQueryString('ds_v1_1_activity_asset_mapping_select_myqueue', paramsArr);
			const queryString = util.getQueryString('ds_v1_4_activity_asset_mapping_select_myqueue', paramsArr);
			if (queryString !== '') {
				db.executeQuery(1, queryString, request, async function (err, data) {
					if (err === false) {
						try {
							if (Number(request.flag) == -1 || Number(request.flag) == -2) {
								let finalObj = {};
								let tempObj = {};

								for (let i = 0; i < data.length; i++) {
									finalObj = {};
									tempObj = {};
									tempObj.current_status_id = data[i].activity_status_id;
									tempObj.file_creation_time = "";
									tempObj.queue_mapping_time = "";
									tempObj.current_status_name = data[i].activity_status_name;
									tempObj.last_status_alter_time = "";
									tempObj.caf_completion_percentage = data[i].activity_workflow_completion_percentage;

									finalObj.queue_sort = tempObj;

									data[i].queue_activity_mapping_inline_data = JSON.stringify(finalObj);
									data[i].queue_id = 0;
								}
							}

							if (Number(request.flag) === 3) {
								resolve(data);
							} else {
								let dataWithParticipant = await appendParticipantList(request, data);
								resolve(dataWithParticipant);
							}
						} catch (error) {
							console.log("getMyQueueActivitiesV2 | Error", error);
							resolve(data);
						}
					} else {
						reject(err);
					}
				});
			}
		});
	};

	this.getQueueActivitiesWithUserFilter = async function (request) {
		// IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
		// IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20),
		// IN p_activity_type_id BIGINT(20), IN p_activity_status_id BIGINT(20),
		// IN p_activity_status_type_id BIGINT(20), IN p_sort_flag TINYINT(4),
		// IN p_flag TINYINT(4), IN p_queue_id BIGINT(20), IN p_start_from INT(11),
		// IN p_limit_value TINYINT(4)

		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,

			request.activity_type_id || 0,
			request.activity_status_id || 0,
			request.activity_status_type_id || 0,

			request.sort_flag || 0, // 0 => Ascending | 1 => Descending
			request.flag || 0, // 0 => Due date | 1 => Created date
			request.queue_id || 0,
			request.page_start || 0,
			request.page_limit || 50
		);
		const queryString = util.getQueryString('ds_v1_3_activity_asset_mapping_select_myqueue', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					try {
						let dataWithParticipant = await appendParticipantList(request, data);
						responseData = dataWithParticipant;
					} catch (error) {
						console.log("getQueueActivitiesWithUserFilter | appendParticipantList | Error: ", error);
						// Do nothing
					}
					error = false;
				})
				.catch((err) => {
					error = err;
				})
		}
		return [error, responseData];
	}

	this.fetchActivitiesMappedToQueueWithParticipants = function (request) {
		return new Promise((resolve, reject) => {
			activityCommonService
				.fetchActivitiesMappedToQueue(request)
				.then(async (data) => {
					try {
						let dataWithParticipant = await appendParticipantList(request, data);
						resolve(dataWithParticipant);
					} catch (error) {
						console.log("fetchActivitiesMappedToQueueWithParticipants | resolve | Error", error);
						resolve(data);
					}
				})
				.catch((err) => {
					console.log("fetchActivitiesMappedToQueueWithParticipants | reject | Error", error);
					reject(err);
				});
		});
	};

	async function appendParticipantList(request, activityList) {
		// Inits!
		let participantMap = new Map();
		// Build the promises array for concurrent processing
		let fetchParticipantListPromises = [];

		// Iterate through each entry
		for (const activity of activityList) {
			participantMap.set(Number(activity.activity_id), activity);
			// participantMap.set(Number(activity.activity_id), {});

			fetchParticipantListPromises.push(
				activityCommonService
					.getAllParticipantsPromise({
						organization_id: request.organization_id,
						activity_id: activity.activity_id
					})
					.then((participantData) => {
						// Iterate through each participant and filter out the data you need
						if (participantData.length > 0) {
							let formattedParticipantList = [];
							for (const participant of participantData) {
								formattedParticipantList.push({
									'asset_id': participant.asset_id,
									'asset_first_name': participant.asset_first_name,
									'asset_last_name': participant.asset_last_name,
									'asset_phone_number': participant.asset_phone_number,
									'asset_phone_number_code': participant.asset_phone_country_code,
									'operating_asset_phone_number': participant.operating_asset_phone_number,
									'operating_asset_phone_country_code': participant.operating_asset_phone_country_code,
									'operating_asset_id': participant.operating_asset_id,
									'operating_asset_first_name': participant.operating_asset_first_name,
									'operating_asset_last_name': participant.operating_asset_last_name,
									'activity_creator_operating_asset_first_name': participant.activity_creator_operating_asset_first_name,
									'asset_datetime_last_seen': participant.asset_datetime_last_seen
								});
							}
							activity.participant_list = formattedParticipantList;
							participantMap.set(Number(activity.activity_id), activity);
							// participantMap.set(Number(activity.activity_id), formattedParticipantList);
						} else {
							activity.participant_list = [];
						}

						// Formatting date time to YYYY-MM-DD HH:mm:ss format
						// console.log("activity.activity_datetime_created: ", activity.activity_datetime_created);
						activity.activity_datetime_created = moment(activity.activity_datetime_created).format("YYYY-MM-DD HH:mm:ss");
						activity.activity_datetime_end_deferred = activity.activity_datetime_end_deferred == null ? null : moment(activity.activity_datetime_end_deferred).format("YYYY-MM-DD HH:mm:ss");
						activity.activity_datetime_end_expected = moment(activity.activity_datetime_end_expected).format("YYYY-MM-DD HH:mm:ss");
						activity.activity_datetime_start_expected = moment(activity.activity_datetime_start_expected).format("YYYY-MM-DD HH:mm:ss");
						activity.log_datetime = moment(activity.log_datetime).format("YYYY-MM-DD HH:mm:ss");

						return {
							success: true,
							activity_id: Number(activity.activity_id)
						};
					})
					.catch((error) => {
						console.log(`appendParticipantList | Error fetching participants for ${activity.activity_id}: `, error)
					})
			);
		}
		await Promise.all(fetchParticipantListPromises)
			.then((result) => {
				console.log("appendParticipantList | Promise.all | Result: ", result);
			})
			.catch((error) => {
				console.log("appendParticipantList | Promise.all | Error: ", error);
			});

		return [...participantMap.values()];
	}

	this.getMyQueueActivitiesDifferential = function (request) {
		return new Promise((resolve, reject) => {

			// IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
			// IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20), 
			// IN p_flag TINYINT(4), IN p_sort_flag TINYINT(4), 
			// IN p_start_from INT(11), IN p_limit_value TINYINT(4), 
			// IN p_datetime DATETIME.
			let paramsArr = new Array(
				request.organization_id,
				request.account_id,
				request.workforce_id,
				request.target_asset_id,
				request.sort_flag || 0, // 0 => Ascending | 1 => Descending
				request.flag || 0, // 0 => Due date | 1 => Created date
				request.page_start,
				request.page_limit,
				request.datetime_differential
			);
			// ds_v1_activity_asset_mapping_select_myqueue_diff
			let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_myqueue_diff', paramsArr);
			if (queryString != '') {
				db.executeQuery(1, queryString, request, function (err, data) {
					//console.log('queryString : '+queryString+ "err "+err+ ": data.length "+data.length);
					if (err === false) {
						// processMyQueueData(request, data).then((queueData) => {
						// 	resolve(queueData);
						// });
						resolve(data);
					} else {
						reject(err);
					}
				});
			}
		});
	};

	function processMyQueueData(request, data) {
		return new Promise((resolve, reject) => {
			let array = [];
			forEachAsync(data, function (next, newOrderData) {
				getQueueActivity(request, newOrderData.activity_id).then((queueData) => {
					if (queueData.length > 0) {
						queueData[0].asset_unread_updates_count = newOrderData.asset_unread_updates_count;
						queueData[0].activity_datetime_end_deferred = newOrderData.activity_datetime_end_deferred;
						queueData[0].activity_datetime_start_expected = newOrderData.activity_datetime_start_expected;
						queueData[0].activity_datetime_created = newOrderData.activity_datetime_created;
						array.push(queueData[0]);
					}
				}).then(() => {
					next();
				});

			}).then(() => {
				//console.log(array);
				resolve(array);
			});
		});
	}

	function getQueueActivity(request, idActivity) {
		return new Promise((resolve, reject) => {

			let paramsArr = new Array(
				request.organization_id,
				request.account_id,
				request.workforce_id,
				idActivity
			);
			let queryString = util.getQueryString('ds_v1_queue_activity_mapping_select_activity', paramsArr);
			if (queryString != '') {
				db.executeQuery(1, queryString, request, function (err, data) {
					//console.log('queryString : '+queryString+ "err "+err+ ": data.length "+data.length);
					if (err === false) {
						resolve(data);
					} else {
						reject(err);
					}
				});
			}
		});
	}


	this.fetchActivityDetails = function (request) {
		return new Promise((resolve, reject) => {
			let paramsArr = new Array(
				request.organization_id,
				request.activity_id
			);
			const queryString = util.getQueryString('ds_p1_queue_activity_mapping_select_activity', paramsArr);
			if (queryString !== '') {
				db.executeQuery(1, queryString, request, function (err, data) {
					(err) ? reject(err) : resolve(data);
				});
			}
		});
	};

	this.getEntityQueueMapping = function (request) {
		let flag = 2;
		if (request.hasOwnProperty("flag")) {
			flag = request.flag;
		}
		return new Promise((resolve, reject) => {
			// IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
			// IN p_workforce_id BIGINT(20), IN p_activity_type_id BIGINT(20), 
			// IN p_flag SMALLINT(6), IN p_start_from BIGINT(20), IN p_limit_value SMALLINT(6)
			let paramsArr = new Array(
				request.organization_id,
				request.account_id,
				request.workforce_id,
				request.activity_type_id,
				flag,
				request.page_start || 0,
				request.page_limit || 50 // util.replaceQueryLimit(request.page_limit),
			);

			let queryString = util.getQueryString('ds_p1_1_queue_list_select', paramsArr);
			if (queryString != '') {
				db.executeQuery(1, queryString, request, function (err, data) {
					//console.log("err "+err);
					if (err === false) {
						//global.logger.write('conLog', 'data: ', data.length, {});
						util.logInfo(request,`getEntityQueueMapping data %j`,{data_length : data.length,request});
						resolve(data);
					} else {
						reject(err);
					}
				});
			}
		});
	};

	this.getQueueActivitiesAllFilters = function (request) {
		//IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20),
		// IN p_asset_id BIGINT(20),  IN p_sort_flag TINYINT(4), IN p_flag TINYINT(4), IN p_queue_id BIGINT(20),
		// IN p_is_active TINYINT(4), IN p_is_due TINYINT(4), IN p_current_datetime DATETIME,
		// IN p_is_unread TINYINT(4), IN p_is_search TINYINT(4), IN p_search_string VARCHAR(100),
		// IN p_status_type_id SMALLINT(6), IN p_start_from INT(11), IN p_limit_value TINYINT(4)
		return new Promise((resolve, reject) => {
			const paramsArr = new Array(
				request.organization_id,
				request.account_id,
				request.workforce_id,
				request.target_asset_id,
				request.sort_flag || 0, // 0 => Ascending | 1 => Descending
				request.flag || 0, // 0 => Due date | 1 => Created date
				request.queue_id || 0,
				request.is_active,
				request.is_due,
				request.current_datetime,
				request.is_unread,
				request.is_search,
				request.search_string,
				request.status_type_id,
				request.page_start,
				request.page_limit
			);
			const queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_myqueue_all_filter', paramsArr);
			if (queryString !== '') {
				db.executeQuery(1, queryString, request, async function (err, data) {
					if (err === false) {
						try {
							let dataWithParticipant = await appendParticipantList(request, data);
							resolve(dataWithParticipant);
						} catch (error) {
							console.log("getQueueActivitiesAllFilters | Error", error);
							resolve(data);
						}
					} else {
						reject(err);
					}
				});
			}
		});
	};


	this.activityListSelectChildOrders = async function (request) {
		// IN p_organization_id BIGINT(20), IN p_parent_activity_id BIGINT(20), 
		// IN p_flag TINYINT(4), IN p_sort_flag TINYINT(4), IN p_datetime_start DATETIME, 
		// IN p_datetime_end DATETIME, IN p_start_from SMALLINT(6), IN p_limit_value SMALLINT(6)
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.parent_activity_id,
			request.flag || 1,
			request.sort_flag,
			request.datetime_start || '1970-01-01 00:00:00',
			request.datetime_end || util.getCurrentUTCTime(),
			request.start_from || 0,
			request.limit_value || 50
		);
		const queryString = util.getQueryString('ds_p1_activity_list_select_child_orders', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					try {
						let dataWithParticipant = await appendParticipantList(request, data);
						responseData = dataWithParticipant;
					} catch (error) {
						console.log("activityListSelectChildOrders | appendParticipantList | Error: ", error);
						// Do nothing
					}
					error = false;
				})
				.catch((err) => {
					error = err;
				})
		}
		return [error, responseData];
	}

	this.activityListSelectChildOrdersForGanttChart = async function (request) {
		// IN p_organization_id BIGINT(20), IN p_parent_activity_id BIGINT(20), 
		// IN p_flag TINYINT(4), IN p_sort_flag TINYINT(4), IN p_datetime_start DATETIME, 
		// IN p_datetime_end DATETIME, IN p_start_from SMALLINT(6), IN p_limit_value SMALLINT(6)
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.parent_activity_id,
			request.flag || 1,
			request.sort_flag,
			request.datetime_start || '1970-01-01 00:00:00',
			request.datetime_end || util.getCurrentUTCTime(),
			request.start_from || 0,
			request.limit_value || 50
		);

		const queryString = util.getQueryString('ds_p1_activity_list_select_child_orders', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					try {
						let dataWithParticipant = await appendParticipantList(request, data);
						responseData = dataWithParticipant;
					} catch (error) {
						console.log("activityListSelectChildOrders | appendParticipantList | Error: ", error);
						// Do nothing
					}
					error = false;
				})
				.catch((err) => {
					error = err;
				})
		}

		if (responseData.length > 0) {
			for (let activity of responseData) {
				let parentActivityId = activity.activity_id;
				if (parentActivityId != null && parentActivityId > 0) {
					let requestForChild = Object.assign({}, request);
					requestForChild.parent_activity_id = parentActivityId;
					const [errorZero, childWorkflows] = await this.activityListSelectChildOrders(requestForChild);
					activity.child_workflows = childWorkflows;
				}
			}
		}

		return [error, responseData];
	}

	this.activityListSelectChildOrdersBasedOnAssetAccess = async function (request) {
		// IN p_organization_id BIGINT(20), IN p_parent_activity_id BIGINT(20), 
		// IN p_flag TINYINT(4), IN p_sort_flag TINYINT(4), IN p_datetime_start DATETIME, 
		// IN p_datetime_end DATETIME, IN p_start_from SMALLINT(6), IN p_limit_value SMALLINT(6)
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.parent_activity_id,
			request.asset_id,
			request.flag || 1,
			request.sort_flag,
			request.datetime_start || '1970-01-01 00:00:00',
			request.datetime_end || util.getCurrentUTCTime(),
			request.start_from || 0,
			request.limit_value || 50
		);
		const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_child_orders', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					try {
						let dataWithParticipant = await appendParticipantList(request, data);
						responseData = dataWithParticipant;
					} catch (error) {
						console.log("activityListSelectChildOrders | appendParticipantList | Error: ", error);
						// Do nothing
					}
					error = false;
				})
				.catch((err) => {
					error = err;
				})
		}
		return [error, responseData];
	}

	this.getQueueActivitiesAllFiltersV1 = function (request) {
		// IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20),
		// IN p_asset_id BIGINT(20),  IN p_sort_flag TINYINT(4), IN p_flag TINYINT(4), IN p_queue_id BIGINT(20),
		// IN p_is_active TINYINT(4), IN p_is_due TINYINT(4), IN p_current_datetime DATETIME,
		// IN p_is_unread TINYINT(4), IN p_is_search TINYINT(4), IN p_search_string VARCHAR(100),
		// IN p_status_type_id SMALLINT(6), IN p_start_from INT(11), IN p_limit_value TINYINT(4)
		return new Promise((resolve, reject) => {
			const paramsArr = new Array(
				request.organization_id,
				request.account_id,
				request.workforce_id,
				request.target_asset_id,
				request.sort_flag || 0, // 0 => Ascending | 1 => Descending
				request.flag || 0, // 0 => Due date | 1 => Created date
				request.queue_id || 0,
				request.is_active,
				request.is_due,
				request.current_datetime,
				request.is_unread,
				request.is_search,
				request.search_string,
				request.status_type_id,
				request.page_start,
				request.page_limit
			);
			// const queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_myqueue_all_filter_v1', paramsArr);

			let queryString = '';
			if(request.flag != 10)
				queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_myqueue_all_filter_v1', paramsArr);
		    else if(request.flag == 10){
			    paramsArr.pop();
				paramsArr.pop();
				paramsArr.push(request.activity_status_id);
				paramsArr.push(request.activity_type_id);
				paramsArr.push(request.activity_type_category_id);
				paramsArr.push(request.tag_type_id || 0);
				paramsArr.push(request.tag_id || 0);
				paramsArr.push(request.page_start);
				paramsArr.push(request.page_limit);
				queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_myqueue_all_filter_v4', paramsArr);
		    }

			if (queryString !== '') {
				db.executeQuery(1, queryString, request, async function (err, data) {
					if (err === false) {
						try {
							let dataWithParticipant = await appendParticipantList(request, data);
							resolve(dataWithParticipant);
						} catch (error) {
							console.log("getQueueActivitiesAllFilters | Error", error);
							resolve(data);
						}
					} else {
						reject(err);
					}
				});
			}
		});
	};


	this.getWidgetValues = async (request) => {

		console.log("request :: ", JSON.stringify(request, null, 2));
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.widget_type_id,
			request.flag_datetime,
			request.timeline_id,
			request.timezone_id,
			request.timezone_offset || 0,
			request.flag_sort || 0,
			request.organization_id,
			request.filter_account_id,
			request.filter_workforce_type_id,
			request.filter_workforce_id,
			request.filter_asset_id,
			request.tag_type_id,
			request.tag_id,
			request.activity_type_id,
			request.activity_id || 0,
			request.activity_status_type_id,
			request.activity_status_tag_id,
			request.activity_status_id,
			request.bot_id || 0,
			request.bot_operation_id || 0,
			request.form_id,
			request.field_id,
			request.data_type_combo_id,
			request.datetime_start,
			request.datetime_end,
			request.page_start,
			request.page_limit
		);
		const queryString = util.getQueryString('ds_p1_1_activity_list_select_widget_values', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then((data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	this.getWorkflowReferenceBots = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.activity_type_id,
			request.operation_type_id,
			request.start_from || 0,
			request.limit_value || 50
		);
		const queryString = util.getQueryString('ds_p1_bot_operation_mapping_select_operation_type', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then((data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	this.getParticipantsList = async (request) => {
		return new Promise((resolve, reject) => {
			const paramsArr = new Array(
				request.organization_id,
				request.activity_id,
				request.datetime_differential,
				request.page_start,
				util.replaceQueryLimit(request.page_limit)
			);
			const queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants_differential', paramsArr);
			if (queryString != '') {
				db.executeQuery(1, queryString, request, function (err, data) {
					if (err === false) {
						formatParticipantList(data, function (err, response) {
							(err === false) ? resolve(response) : reject();
						});
					} else {
						reject();
					}
				});
			}
		});
	};

	let formatParticipantList = function (data, callback) {
		let responseData = new Array();
		data.forEach(function (rowData, index) {
			let rowDataArr = {
				'activity_id': util.replaceDefaultNumber(rowData['activity_id']),
				'asset_id': util.replaceDefaultNumber(rowData['asset_id']),
				'account_id': util.replaceDefaultNumber(rowData['account_id']),
				'organization_id': util.replaceDefaultNumber(rowData['organization_id']),
				'workforce_id': util.replaceDefaultNumber(rowData['workforce_id']),
				'workforce_name': util.replaceDefaultString(rowData['workforce_name']),
				'account_name': util.replaceDefaultString(rowData['account_name']),
				'asset_first_name': util.replaceDefaultString(rowData['asset_first_name']),
				'asset_last_name': util.replaceDefaultString(rowData['asset_last_name']),
				'asset_type_id': util.replaceDefaultNumber(rowData['asset_type_id']),
				'asset_type_name': util.replaceDefaultString(rowData['asset_type_name']),
				'asset_type_category_id': util.replaceDefaultNumber(rowData['asset_type_category_id']),
				'field_id': util.replaceDefaultNumber(rowData['field_id']),
				'asset_type_category_name': util.replaceDefaultString(rowData['asset_type_category_name']),
				'asset_image_path': (util.replaceDefaultString(rowData['asset_image_path']) !== ''),
				'asset_phone_number': util.replaceDefaultString(rowData['asset_phone_number']),
				'asset_phone_number_code': util.replaceDefaultString(rowData['asset_phone_country_code']),
				'operating_asset_phone_number': util.replaceDefaultString(rowData['operating_asset_phone_number']),
				'operating_asset_phone_country_code': util.replaceDefaultString(rowData['operating_asset_phone_country_code']),
				'log_asset_id': util.replaceDefaultNumber(rowData['log_asset_id']),
				'log_state': util.replaceDefaultNumber(rowData['log_state']),
				'log_active': util.replaceDefaultNumber(rowData['log_active']),
				"operating_asset_id": util.replaceZero(rowData['operating_asset_id']),
				"operating_asset_first_name": util.replaceDefaultString(rowData['operating_asset_first_name']),
				"operating_asset_last_name": util.replaceDefaultString(rowData['operating_asset_last_name']),
				"activity_creator_operating_asset_first_name": util.replaceDefaultString(rowData['activity_creator_operating_asset_first_name']),
				"asset_datetime_last_seen": util.replaceDefaultDatetime(rowData['asset_datetime_last_seen']),
				"activity_creator_asset_id": util.replaceDefaultNumber(rowData['activity_creator_asset_id']),
				"activity_owner_asset_image_path": util.replaceDefaultString(rowData['activity_owner_asset_image_path']),
				"operating_asset_image_path": util.replaceDefaultString(rowData['operating_asset_image_path'])
			};
			responseData.push(rowDataArr);
		}, this);
		callback(false, responseData);
	};

	//Get the asset_type_id(ROLE) for a given status_id - RM
	this.getAssetTypeIDForAStatusID = async (request, activityStatusId) => {
		let responseData = [],
			error = true;

		let paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			activityStatusId
		);
		let queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select_id', paramsArr);
		if (queryString != '') {
			//return await db.executeQueryPromise(1, queryString, request);
			await db.executeQueryPromise(1, queryString, request)
				.then((data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}

		return [error, responseData];
	};

	//Get the asset for a given asset_type_id(ROLE) - RM
	this.getAssetForAssetTypeID = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.activity_id,
			request.asset_type_id,
			request.organization_id
		);
		const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_role_participant', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then((data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	//Set the rollback count for a given asset_id
	this.setAssetRollBackCnt = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.activity_id,
			request.asset_id,
			request.organization_id
		);
		const queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_rollback_count', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(0, queryString, request)
				.then((data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	//Get the rollback count for a given asset_id
	this.getAssetRollBackCnt = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.activity_type_id,
			request.activity_type_category_id,
			request.flag || 0,
			request.start_datetime, //Monday
			request.end_datetime, //Sunday
			request.start_from || 0,
			request.limit_value || 50
		);
		const queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_asset_rollback', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then((data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};


	//Get the workload of lead asset
	//IF p_flag = 0 THEN RETURNS COUNT of OPEN workflows which are lead by the owner in the given duration
	//IF p_flag = 1 THEN RETURNS LIST of OPEN workflows which are lead by the owner in the given duration
	this.getLeadAssetWorkload = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.asset_id,
			request.flag || 0,
			request.start_datetime, //Monday
			request.end_datetime, //Sunday
			request.start_from || 0,
			request.limit_value || 50
		);
		const queryString = util.getQueryString('ds_p1_activity_list_select_asset_lead_tasks', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then((data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};


	async function processFormInlineDataV1(request, data) {
		let array = [];
		let inlineData = JSON.parse(data[0].activity_inline_data);
		//console.log('inline DATA : ', inlineData);

		for (let i = 0; i < inlineData.length; i++) {
			let fieldData;
			try {
				fieldData = await activityCommonService.getFormFieldDefinition(request, inlineData[i]);
			} catch (err) {
				console.log('err in processFormInlineDataV1 : ', err);
			}

			if (fieldData !== true) {
				if (fieldData.length > 0) {
					//console.log('fieldData : ', fieldData[0].field_value_edit_enabled);
					inlineData[i].field_value_edit_enabled = fieldData[0].field_value_edit_enabled;
					inlineData[i].field_inline_data = fieldData[0].field_inline_data;
				} else {
					inlineData[i].field_value_edit_enabled = 1;
					inlineData[i].field_inline_data = '{}';
				}
			} else {
				inlineData[i].field_value_edit_enabled = 1;
				inlineData[i].field_inline_data = '{}';
			}

			if (JSON.parse(JSON.stringify(inlineData[i])).hasOwnProperty("field_validated")) {
				array.push(inlineData[i]);
			}
			else {
				inlineData[i].field_validated = 0;
				array.push(inlineData[i]);
			}
		}

		data[0].activity_inline_data = array;
		return data;

	}

	async function getMentionsCount(request) {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.asset_id,
			request.workforce_id,
			request.account_id,
			request.organization_id
		);
		const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_asst_act_cat_grp_mcounts', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then((data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	}

	this.getActivitySubStatuses = async (request) => {
		let responseData = [],
			error = true, finalResponse = [];

		const paramsArr = new Array(
			request.organization_id,
			request.activity_id,
			request.activity_status_id,
			request.page_start,
			request.page_limit
		);
		const queryString = util.getQueryString('ds_v1_activity_sub_status_mapping_select_activity', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
					let self = this;
					console.log('responseData :: ' + JSON.stringify(responseData));
					let [error1, configData] = await self.getSubStatusUsingParentStatus(request);
					console.log('configData :: ' + JSON.stringify(configData));
					finalResponse = await self.formatSubStatusData(responseData, configData);
					console.log('finalResponse :: ' + JSON.stringify(finalResponse));
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, finalResponse];
	};


	this.getSubStatusUsingParentStatus = async function (request) {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.activity_status_id,
			request.page_start,
			request.page_limit
		);
		const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_select_sub_status', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	this.formatSubStatusData = async function (data, configData) {
		let responseData = new Array();
		let dataJson = {};
		console.log("data1 :" + JSON.stringify(data));

		for (let j = 0; j < data.length; j++) {
			dataJson[data[j].sub_status_id] = { "sub_status_name": data[j].sub_status_name, "triggered_datetime": data[j].sub_status_trigger_time, "achieved_datetime": data[j].sub_status_achieved_time };
		}
		console.log('dataJson ::: ' + JSON.stringify(dataJson));

		configData.forEach(function (rowData, index) {
			let statusId = rowData['activity_status_id'];
			console.log('dataJson.statusId.triggered_datetime :: ' + util.replaceDefaultDatetime(dataJson[statusId] ? dataJson[statusId].triggered_datetime : '1970-01-01 00:00:00'));
			let triggerDatetime = util.replaceDefaultDatetime(dataJson[statusId] ? dataJson[statusId].triggered_datetime : '1970-01-01 00:00:00');
			let achievedDatetime = util.replaceDefaultDatetime(dataJson[statusId] ? dataJson[statusId].achieved_datetime : '1970-01-01 00:00:00');
			let rowDataArr = {
				"activity_status_id": util.replaceDefaultNumber(rowData['activity_status_id']),
				"activity_status_name": util.replaceDefaultString(rowData['activity_status_name']),
				"parent_status_id": util.replaceDefaultNumber(rowData['parent_status_id']),
				"parent_status_name": util.replaceDefaultString(rowData['parent_status_name']),
				"triggered_datetime": triggerDatetime,
				"achieved_datetime": achievedDatetime,
				"trigger_flag": dataJson[statusId] ? 1 : 0
			};
			responseData.push(rowDataArr);
		}, this);

		console.log('responseData :::2 ' + JSON.stringify(responseData));
		return responseData;
	};


	this.getActActChildActivities = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.workflow_activity_id,
			request.activity_type_id,
			request.activity_type_category_id,
			request.organization_id,
			request.flag,
			request.page_start || 0,
			request.page_limit
		);
		const queryString = util.getQueryString('ds_p1_activity_activity_mapping_select_child_activities', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};


	this.actAssetMappingNewFiltersList = async (request) => {
		//p_flag = 1 -- MY FOCUS
		//p_flag = 2 -- MY UPDATES
		//p_flag = 3 -- MY WORKFLOWS
		//p_flag = 4 -- MY TASKS
		//p_flag = 5 -- MY CONVERSATIONS
		//p_flag = 6 -- MY DASHBOARD

		//p_is_all = 0 -- ALL
		//p_is_all = 1 -- created by me
		//p_is_all = 2 -- lead byme

		//p_is_sort = 1 -- due datetime
		//p_is_sort = 2 -- created datetime
		//p_is_sort = 3 -- last updated datetime
		//p_is_sort = 4 -- log_datetime

		//p_next_datetime = current_datetime + 2 days (used only in flag = 1)

		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.flag,
			request.is_all_flag,
			request.is_search,
			request.search_string,
			request.is_status,
			request.is_sort,
			request.next_datetime,
			request.is_process,
			request.activity_type_id,
			request.is_tag,
			request.tag_id,
			request.is_tag_type,
			request.tag_type_id,
			request.page_start || 0,
			request.page_limit
		);
		const queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_new_filters', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	this.getActivityDetails = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.activity_id,
			request.activity_type_id,
			request.organization_id
		);
		const queryString = util.getQueryString('ds_v1_1_activity_list_select', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	this.getActReferenceList = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.account_id,
			request.workforce_id,
			request.asset_id,
			request.activity_type_id,
			request.activity_type_category_id,
			request.tag_id,
			request.tag_type_id,
			request.search_string,
			request.flag_status,
			request.flag_participating,
			request.start_from,
			request.limit_value
		);
		const queryString = util.getQueryString('ds_p1_activity_list_select_product_reference', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	this.getChildProductsList = async (request) => {
		//flag = 0 - Count
		//flag = 1 - Data

		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.parent_activity_id,
			request.flag,
			request.sort_flag,
			request.datetime_start || '1970-01-01 00:00:00',
			request.datetime_end || util.getCurrentUTCTime(),
			request.start_from,
			request.limit_value
		);
		const queryString = util.getQueryString('ds_p1_activity_list_select_child_products', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	}

	this.getActivityCategorySearch = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.target_asset_id,
			request.target_account_id,
			request.segment_id,
			request.activity_type_category_id,
			request.activity_type_id,
			request.is_search,
			request.search_string,
			request.page_start,
			request.page_limit
		);
		const queryString = util.getQueryString('ds_v1_activity_list_select_category_search', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};


	this.getActActChildActivitiesV1 = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.workflow_activity_id,
			request.activity_type_id,
			request.activity_type_category_id,
			request.tag_id,
			request.tag_type_id,
			request.organization_id,
			request.flag,
			request.page_start || 0,
			request.page_limit
		);
		const queryString = util.getQueryString('ds_p1_1_activity_activity_mapping_select_child_activities', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	this.getActivityFocusList = async (request) => {
		let responseData = [],
			error = true;
		const paramsArr = new Array(
			request.asset_id,
			request.organization_id,
			request.datetime_start || '1970-01-01 00:00:00',
			request.datetime_end || util.getCurrentUTCTime(),
			request.flag || 2,
			request.is_sort || 1,
			request.page_start || 0,
			request.page_limit
		);
		const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_focus_list', paramsArr);
		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	this.getActivityFocusListV1 = async (request) => {
		let responseData = [],
			error = true;
		/*
		 due asc = 0
		 create asc = 1
		 last update = 2 // ignore this
		 due dsc = 3
		 create asc = 4
		 */
		const paramsArr = new Array(
			request.asset_id,
			request.organization_id,
			request.datetime_start || '1970-01-01 00:00:00',
			request.datetime_end || util.getCurrentUTCTime(),
			request.flag || 0,
			request.flag_search || 0,
			request.search_string || '',
			request.sort_flag || 0,
			request.start_from || 0,
			request.limit_value || 50
		);
		const queryString = util.getQueryString('ds_p1_1_activity_asset_mapping_select_focus_list', paramsArr);
		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	this.getActivitySearchList = async (request) => {
		let responseData = [],
			error = true;
		const paramsArr = new Array(
			request.organization_id,
			request.tag_type_id,
			request.tag_id,
			request.activity_type_category_id,
			request.activity_type_id,
			request.search_string,
			request.flag || 1,
			request.start_from || 0,
			request.limit_value || 50
		);
		const queryString = util.getQueryString('ds_p1_activity_search_list_select', paramsArr);
		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	this.getQueueActMappingAssetFlag = async (request) => {
		//IF flag = 1 THEN get ALL activities which are currently mapped to a queue
		//IF flag = 2 THEN get PARTICIPATING activities which are currently mapped to a queue
		//IF flag = 2 THEN get NON PARTICIPATING activities which are currently mapped to a queue

		//IN sort_flag = 1 THEN due date DESC
		//IN sort_flag = 2 THEN created date DESC

		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.asset_id,
			request.activity_type_category_id || 0,
			request.queue_id || 0,
			request.is_search,
			request.search_string,
			request.flag || 0, // 0 => Due date | 1 => Created date
			request.sort_flag || 0, // 0 => Ascending | 1 => Descending			
			request.page_start || 0,
			request.page_limit || 50
		);

		const queryString = util.getQueryString('ds_p1_1_queue_activity_mapping_select_queue_asset_flag', paramsArr);
		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					//console.log('DATA : ', data);
					for (const i of data) {
						let queueActMapInlineData = JSON.parse(i.queue_activity_mapping_inline_data);

						i.activity_status_id = queueActMapInlineData.queue_sort.current_status_id;
						i.activity_status_name = queueActMapInlineData.queue_sort.current_status_name;
					}

					try {
						let dataWithParticipant = await appendParticipantList(request, data);
						data = dataWithParticipant;
					} catch (error) {
						console.log("getQueueActivitiesAllFilters | Error", error);
						// resolve(data);
					}

					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}

		return [error, responseData];
	};

	this.getChatWithAResource = async (request) => {
		let responseData = [],
			error = true;
		const paramsArr = new Array(
			request.organization_id,
			request.activity_type_category_id,
			request.asset_id,
			request.target_asset_id
		);
		const queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_target_chat', paramsArr);
		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};

	this.getActBulkSummaryData = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = [request.parent_activity_id];
		const queryString = util.getQueryString('ds_p1_activity_bulk_summary_list_select', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					for (eachResponse of responseData) {
						eachResponse.activity_feasibility_data = eachResponse.activity_feasibility_data == null ? "{}" : eachResponse.activity_feasibility_data;
						eachResponse.activity_summary_data = eachResponse.activity_summary_data == null ? "{}" : eachResponse.activity_summary_data;
					}
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		return [error, responseData];
	};
	
	function isObject(obj) {
		return obj !== undefined && obj !== null && !Array.isArray(obj) && obj.constructor == Object;
	}

	this.getActivityBulkSummaryDataV1 = async (request) => {
		error = false;
		let opportunityId = ""; 
		// Get the summary data
		const [errorZero, summaryData] = await self.getActBulkSummaryData(request);
		if (errorZero) { error = errorZero };

		let finalSummaryData = [];
		for (rowData of summaryData) {
			let activitySummaryData = JSON.parse(rowData.activity_summary_data);
			let activityFeasibilityData = JSON.parse(rowData.activity_feasibility_data);

			if (activitySummaryData.hasOwnProperty("primary")) {

				let mergedObject = { ...activitySummaryData.primary, ...activityFeasibilityData };
				opportunityId = rowData.parent_activity_cuid_1;
				mergedObject["parent_opportunity_id"] = rowData.parent_activity_cuid_1;
				mergedObject["child_opportunity_id"] = rowData.activity_cuid_1;
				mergedObject["secondary_standard"] = "";
				mergedObject["feasibility_secondary_status"] = "";
				mergedObject["feasibility_secondary_description"] = "";

				finalSummaryData.push(mergedObject);

				if ((activitySummaryData.hasOwnProperty("secondary") && Object.keys(activitySummaryData.secondary).length > 0) || (activityFeasibilityData.hasOwnProperty("secondary_standard"))) {
					mergedObject = { ...activitySummaryData.secondary || {}, ...activityFeasibilityData };
					mergedObject["parent_opportunity_id"] = rowData.parent_activity_cuid_1;
					mergedObject["child_opportunity_id"] = rowData.activity_cuid_1;
					mergedObject["primary_standard"] = "";
					mergedObject["feasibility_primary_status"] = "";
					mergedObject["feasibility_primary_description"] = "";

					if(!mergedObject.hasOwnProperty("offnetPartnetInfo")){
						mergedObject["offnetPartnetInfo"] = [{
							offnetPartnet: "",
							feasibilitystatusAEnd: "",
							feasibilitystatusBEnd: "",
							cftARemarks: "",
							cftBRemarks: "",
							otcA: "",
							otcB: "",
							arcA: "",
							arcB: "",
							salesCapexEndA: "",
							salesCapexEndB: ""
						}];
					}
					finalSummaryData.push(mergedObject);
				}
			}
			else {
				activityFeasibilityData["parent_opportunity_id"] = rowData.parent_activity_cuid_1;
				activityFeasibilityData["child_opportunity_id"] = rowData.activity_cuid_1;
				activityFeasibilityData["offnetPartnetInfo"] = [{
					offnetPartnet: "",
					feasibilitystatusAEnd: "",
					feasibilitystatusBEnd: "",
					cftARemarks: "",
					cftBRemarks: "",
					otcA: "",
					otcB: "",
					arcA: "",
					arcB: "",
					salesCapexEndA: "",
					salesCapexEndB: ""
				}];

				let primaryRow = {...activityFeasibilityData};
				primaryRow["secondary_standard"] = "";
				primaryRow["feasibility_secondary_status"] = "";
				primaryRow["feasibility_secondary_description"] = "";
				finalSummaryData.push(primaryRow);

				if(activityFeasibilityData.hasOwnProperty("secondary_standard")){
					let seconadryRow = {...activityFeasibilityData};
					seconadryRow["primary_standard"] = "";
					seconadryRow["feasibility_primary_status"] = "";
					seconadryRow["feasibility_primary_description"] = "";
					finalSummaryData.push(seconadryRow);
				}
			}
		}

		let keyCount = 0;
		let positionsofOffnet = [];

		function getIncrementedCount(storeNumberInArray = false) {
			let currentNumber = keyCount++;
			if (storeNumberInArray)
				positionsofOffnet.push(currentNumber);
			return currentNumber;
		}

		const headerContent = [["Parent Oppty Id", "Child Oppty ID", "Primary FR ID", "Primary FR ID status", "feasibility_primary_description", "Secondary FR ID", "Secondary FR ID status", "feasibility_secondary_description",
			"Onnet Feasibility Info", "", "", "", "", "", "", "", "", "", "",
			"Stage 2 UBR Feasibility Info", "", "", "", "", "", "", "", "", "", "",
			"Stage 2 3G Feasibility Info", "", "", "", "", "", "", "",
			"Offnet Partnet Info", "", "", "", "", "", "", "", "", "", "",
			"Stage 2 Microwave Feasibility Info", "", "", "", "", "", "", "", "", "", "",
			"Super WiFi Feasibility Info", "", "", "", "", "", ""],
			["", "", "", "", "", "", "", "", "Feasibility Status A end", "Feasibility Status B end", "Circle Remarks A end", "Circle Remarks B end", "CFT Remarks A end", "CFT Remarks B end", "Sales Capex A End", "Sales Capex B End", "Network Capex",
			"Progress Status", "Feasibility Close Date", "Feasibility Status A end", "Feasibility Status B end", "Circle Remarks A end", "Circle Remarks B end", "CFT Remarks A End", "CFT Remarks B End", "Sales Capex A End","Sales Capex B End", "Network Capex", "Progress Status", "Feasibility Close Date", 
			"Feasibility Status A end", "Feasibility Status B end", "Circle Remarks A End", "Circle Remarks B End", "CFT Remarks A End",
			"CFT Remarks B End", "Progress Status", "Feasibility Close Date",			
			"Off-net Partner Name", "Feasibility Status A end", "Feasibility Status B end", "CFT Remarks A end", "CFT Remarks B end", "OTC A End", "OTC B End", "ARC A End",
			"ARC B End", "Sales Capex A End", "Sales Capex B End",
			"Feasibility Status A end", "Feasibility Status B end", "Circle Remarks A end", "Circle Remarks B end", "CFT Remarks A end", "CFT Remarks B end",
			"Sales Capex A End", "Sales Capex B End", "Network Capex", "Progress Status", "Feasibility Close Date", 
			"Wifi flavor", "Site Survery Status", "Total Sales Opex", "Total Capex",
			"No.of access points", "Progress Status", "Feasibility Close Date"]];

		const ws = XLSX.utils.aoa_to_sheet(headerContent)

		const contentSequence = {
			parent_opportunity_id: getIncrementedCount(),
			child_opportunity_id: getIncrementedCount(),
			primary_standard: getIncrementedCount(),
			feasibility_primary_status: getIncrementedCount(),
			feasibility_primary_description: getIncrementedCount(),
			secondary_standard: getIncrementedCount(),
			feasibility_secondary_status: getIncrementedCount(),
			feasibility_secondary_description: getIncrementedCount(),
			onnetFeasibilityInfo: {
				feasibilitystatusAEnd: getIncrementedCount(),
				feasibilitystatusBEnd: getIncrementedCount(),
				circleARemarks: getIncrementedCount(),
				circleBRemarks: getIncrementedCount(),
				cftARemarks: getIncrementedCount(),
				cftBRemarks: getIncrementedCount(),
				salesCapexEndA: getIncrementedCount(),
				salesCapexEndB: getIncrementedCount(),
				networkCapex: getIncrementedCount(),
				progressStatus: getIncrementedCount(),
				closeDate: getIncrementedCount(),
			},
			stage2UBRFeasibilityInfo: {
				feasibilitystatusAEnd: getIncrementedCount(),
				feasibilitystatusBEnd: getIncrementedCount(),
				circleRemarksA: getIncrementedCount(),
				circleRemarksB: getIncrementedCount(),
				cftRemarksA: getIncrementedCount(),
				cftRemarksB: getIncrementedCount(),
				salesCapexEndA: getIncrementedCount(),
				salesCapexEndB: getIncrementedCount(),
				networkCapex: getIncrementedCount(),
				progressStatus: getIncrementedCount(),
				closeDate: getIncrementedCount()
			},
			stage23gFeasibilityInfo: {
				feasibilitystatusAEnd: getIncrementedCount(),
				feasibilitystatusBEnd: getIncrementedCount(),
				circleRemarksA: getIncrementedCount(),
				circleRemarksB: getIncrementedCount(),
				cftRemarksA: getIncrementedCount(),
				cftRemarksB: getIncrementedCount(),
				progressStatus: getIncrementedCount(),
				closeDate: getIncrementedCount()
			},
			offnetPartnetInfo: {
				offnetPartnet: getIncrementedCount(true),
				feasibilitystatusAEnd: getIncrementedCount(true),
				feasibilitystatusBEnd: getIncrementedCount(true),
				cftARemarks: getIncrementedCount(true),
				cftBRemarks: getIncrementedCount(true),
				otcA: getIncrementedCount(true),
				otcB: getIncrementedCount(true),
				arcA: getIncrementedCount(true),
				arcB: getIncrementedCount(true),
				salesCapexEndA: getIncrementedCount(true),
				salesCapexEndB: getIncrementedCount(true)
			},
			stage2MicrowaveFeasibilityInfo: {
				feasibilitystatusAEnd: getIncrementedCount(),
				feasibilitystatusBEnd: getIncrementedCount(),
				circleRemarksA: getIncrementedCount(),
				circleRemarksB: getIncrementedCount(),
				cftRemarksA: getIncrementedCount(),
				cftRemarksB: getIncrementedCount(),
				salesCapexEndA: getIncrementedCount(),
				salesCapexEndB: getIncrementedCount(),
				networkCapex: getIncrementedCount(),
				progressStatus: getIncrementedCount(),
				closeDate: getIncrementedCount()
			},
			superWifiFeasibilityInfo: {
				wifiFlavor: getIncrementedCount(),
				siteSurveryStatus: getIncrementedCount(),
				totalSalesOpex: getIncrementedCount(),
				totalCapex: getIncrementedCount(),
				noOfAccessPoints: getIncrementedCount(),
				progressStatus: getIncrementedCount(),
				closeDate: getIncrementedCount()
			}
		}

		ws["!merges"] = [];

		//merge header row
		ws["!merges"].push({ s: { c: 0, r: 0 }, e: { c: 0, r: 1 } });
		ws["!merges"].push({ s: { c: 1, r: 0 }, e: { c: 1, r: 1 } });
		ws["!merges"].push({ s: { c: 2, r: 0 }, e: { c: 2, r: 1 } });
		ws["!merges"].push({ s: { c: 3, r: 0 }, e: { c: 3, r: 1 } });
		ws["!merges"].push({ s: { c: 4, r: 0 }, e: { c: 4, r: 1 } });
		ws["!merges"].push({ s: { c: 5, r: 0 }, e: { c: 5, r: 1 } });
		ws["!merges"].push({ s: { c: 6, r: 0 }, e: { c: 6, r: 1 } });
		ws["!merges"].push({ s: { c: 7, r: 0 }, e: { c: 7, r: 1 } });

		// Merge column 
		ws["!merges"].push({ s: { c: 8, r: 0 }, e: { c: 18, r: 0 } });
		ws["!merges"].push({ s: { c: 19, r: 0 }, e: { c: 29, r: 0 } });
		ws["!merges"].push({ s: { c: 30, r: 0 }, e: { c: 37, r: 0 } });
		ws["!merges"].push({ s: { c: 38, r: 0 }, e: { c: 48, r: 0 } });
		ws["!merges"].push({ s: { c: 49, r: 0 }, e: { c: 59, r: 0 } });
		ws["!merges"].push({ s: { c: 60, r: 0 }, e: { c: 66, r: 0 } });

		for (const rowData of finalSummaryData) {
			let placeholder = Array(keyCount).fill("");

			const oldRange = XLSX.utils.decode_range(ws["!ref"]);
			for (const contentKey of Object.keys(contentSequence)) {
				// regular
				if (!isObject(contentSequence[contentKey])) {
					placeholder[contentSequence[contentKey]] = rowData[contentKey] || "";

				} else if (contentKey !== "offnetPartnetInfo") {
					for (const childContentKey of Object.keys(contentSequence[contentKey])) {
						if (rowData.hasOwnProperty(contentKey)) {
							placeholder[contentSequence[contentKey][childContentKey]] = rowData[contentKey][childContentKey];
						}
						else {
							placeholder[contentSequence[contentKey][childContentKey]] = "";
						}

					}
				}
			}

			const aoaData = [];

			// offnetPartnetInfo
			const offnetVendors = rowData.offnetPartnetInfo || [];
			for (let i = 0; i < offnetVendors.length; i++) {
				if (i === 0) {
					for (const offnetKey of Object.keys(offnetVendors[i])) {
						placeholder[contentSequence["offnetPartnetInfo"][offnetKey]] = offnetVendors[i][offnetKey]
					}
					aoaData.push(placeholder)
				} else {
					let childPlaceholder = Array(keyCount).fill("");
					for (const offnetKey of Object.keys(offnetVendors[i])) {
						childPlaceholder[contentSequence["offnetPartnetInfo"][offnetKey]] = offnetVendors[i][offnetKey]
					}
					aoaData.push(childPlaceholder);
				}

			}
			XLSX.utils.sheet_add_aoa(ws, aoaData, { origin: -1 });

			const newRange = XLSX.utils.decode_range(ws["!ref"]);

			// Merge the relevant rows
			for (let i = 0; i < keyCount; i++) {
				if (!positionsofOffnet.includes(i)) {
					ws["!merges"].push({ s: { c: i, r: oldRange.e.r + 1 }, e: { c: i, r: newRange.e.r } });
				}
			}

		}

		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "sheet_1");

		let fileBuffer = XLSX.write(wb, { type: 'buffer', bookType: "xlsx" });
		const timestampIST = moment().utcOffset("+05:30").format("DD_MM_YYYY-hh_mm_A");
		let fileName = "bulk_summary_sheet_"+opportunityId+"_"+timestampIST+".xlsx";
		let s3Url = await util.uploadXLSXToS3(fileBuffer,fileName);

		let attachmentsList = [];
        attachmentsList.push(s3Url);
		let addCommentRequest = Object.assign(request, {});
        const [error1, defaultAssetName] = await activityCommonService.fetchCompanyDefaultAssetName(request);

        addCommentRequest.asset_id = 100;
        addCommentRequest.device_os_id = 7;
        addCommentRequest.activity_type_category_id = 48;
        addCommentRequest.activity_type_id = request.parent_activity_id;
        addCommentRequest.activity_id = request.parent_activity_id;
        addCommentRequest.activity_timeline_collection = JSON.stringify({
            "content": `${defaultAssetName} has added Bulk Summary Data attachment(s).`,
            "subject": `${defaultAssetName} has added Bulk Summary Data attachment(s).`,
            "mail_body": `${defaultAssetName} has added Bulk Summary Data attachment(s).`,
            "attachments": attachmentsList
        });
        addCommentRequest.activity_stream_type_id = 325;
        addCommentRequest.timeline_stream_type_id = 325;
        addCommentRequest.activity_timeline_text = "";
        addCommentRequest.activity_access_role_id = 27;
        addCommentRequest.operating_asset_first_name = defaultAssetName;
        addCommentRequest.datetime_log = util.getCurrentUTCTime();
        addCommentRequest.track_gps_datetime = util.getCurrentUTCTime();
        addCommentRequest.flag_timeline_entry = 1;
        addCommentRequest.log_asset_id = 100;
        addCommentRequest.attachment_type_id = 17;
        addCommentRequest.attachment_type_name = path.basename(attachmentsList[0]);

		const addTimelineTransactionAsync = nodeUtil.promisify(activityTimelineService.addTimelineTransaction);
		
        try {
            await addTimelineTransactionAsync(addCommentRequest);
        } catch (error) {
            console.log("addPdfFromHtmlTemplate | addCommentRequest | addTimelineTransactionAsync | Error: ", error);
            throw new Error(error);
		}
		
		return [error, finalSummaryData];

	};

	this.getActivityFormList = async (request) => {

		let responseData = [],
			error = true;
		const paramsArr = new Array(
			request.organization_id,
			request.activity_id, 
			request.form_transaction_id,
			request.workflow_activity_id
		);
		const queryString = util.getQueryString('ds_v1_activity_form_list_select', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then(async (data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				});
		}
		
		return [error, responseData];
	};
	
	this.getActivityUserParticipatingStatus = async (request) => {
    let responseData = [],
      error = true;
    const paramsArr = new Array(
      request.organization_id,
      request.account_id,
      request.workforce_id,
      request.asset_id,
      request.flag,
      request.is_active,
      request.is_due,
      util.getCurrentUTCTime(),
      request.is_unread,
      request.start_from,
      request.limit_value
    );
    const queryString = util.getQueryString(
      "ds_v1_activity_asset_mapping_select_myqueue_status",
      paramsArr
    );

    if (queryString !== "") {
      await db
        .executeQueryPromise(1, queryString, request)
        .then(async (data) => {
          responseData = data;
          error = false;
        })
        .catch((err) => {
          error = err;
        });
    }

    return [error, responseData];
  };

  this.getWorkflowBaseOnStatus = async (request) => {
    let responseData = [],
      error = true;
    const paramsArr = new Array(
      request.organization_id,
      request.account_id,
      request.workforce_id,
      request.asset_id,

      request.activity_status_id,
      request.activity_type_id,
      request.flag,
      request.start_from,
      request.limit_value
    );
    const queryString = util.getQueryString(
      "ds_v1_activity_asset_mapping_select_status",
      paramsArr
    );

    if (queryString !== "") {
      await db
        .executeQueryPromise(1, queryString, request)
        .then(async (data) => {
          responseData = data;
          error = false;
        })
        .catch((err) => {
          error = err;
        });
    }

    return [error, responseData];
  };

  this.getCountForFilters = async (request) => {
    let responseData = [],
      error = true;
    const paramsArr = new Array(
      request.organization_id,
      request.account_id,
      request.workforce_id,
      request.asset_id,
      request.flag,
      request.start_from,
      request.limit_value
    );
    const queryString = util.getQueryString(
      "ds_v1_activity_asset_mapping_select_filter_count",
      paramsArr
    );

    if (queryString !== "") {
      await db
        .executeQueryPromise(1, queryString, request)
        .then(async (data) => {
          responseData = data;
          error = false;
        })
        .catch((err) => {
          error = err;
        });
    }

    return [error, responseData];
  };	

	this.emailSummary = async function (request) {

		try {
			console.log("request ", request);

			let requestForBotInline = Object.assign({}, request);
			requestForBotInline.bot_operation_type_id = 7;
			requestForBotInline.form_id = 0;
			requestForBotInline.field_id = 0;

			let [err, botInlineResult] = await getBotInlineJson(requestForBotInline);
			if (botInlineResult.length > 0) {
				const botInlineData =
					(typeof botInlineResult[0].bot_operation_inline_data === 'string') ? JSON.parse(botInlineResult[0].bot_operation_inline_data) : botInlineResult[0].bot_operation_inline_data;
				let isAllFlag = botInlineData.bot_operations.fire_email.participants.is_all || 0;
				if (isAllFlag == 0) {
					this.generateSummary(request);
					return;
				} else {
					let header = "Meeting Id - ";
					let wfActivityDetails = await activityCommonService.getActivityDetailsPromise(request, 0);
					if (wfActivityDetails.length > 0) {
						header += wfActivityDetails[0].activity_cuid_3 + " - MOM Points Update!!!";
					}
					let participantReq = Object.assign({}, request);
					participantReq.is_all_flag = isAllFlag;
					let [err, participantsList] = await getParticipantsAsync(participantReq);
					let [htmlString, attachmentPath] = await generateMOMOrdersHtmlCode(request, participantsList, wfActivityDetails);
					console.log("htmlString ", htmlString);
					
					let emailList = [];
					for (const asset of participantsList) {
						let [error, assetDetails] = await getParticipantDetails({ assetID: asset.asset_id });
						if (assetDetails.length > 0) {
							if (assetDetails[0].operating_asset_email_id !== null && assetDetails[0].operating_asset_email_id !== "") {
								emailList.push(assetDetails[0].operating_asset_email_id);
							} else {
								console.log("No Email ID to send email");
							}
						}

					}
					let [err123, activityTypeConfigData] = await activityCommonService.getWorkflowFieldsBasedonActTypeId(request, request.activity_type_id);

					if (err123 || activityTypeConfigData.length == 0 || activityTypeConfigData[0].activity_type_inline_data == "") {
						util.logInfo(request, "Exiting due to missing config settings");
						await util.sendEmailV4ews(request, emailList, header, htmlString, "", 1, 0, "", attachmentPath);
					}
					else {
						let activity_type_inline_data = typeof activityTypeConfigData[0].activity_type_inline_data == 'string' ? JSON.parse(activityTypeConfigData[0].activity_type_inline_data) : activityTypeConfigData[0].activity_type_inline_data;
						let emailProviderDetails = {
							email: activity_type_inline_data.activity_type_email_id,
							password: activity_type_inline_data.activity_type_email_password,
							username: activity_type_inline_data.activity_type_email_username
						}
						util.logInfo(request, "came into config settings");
						console.log(emailProviderDetails);
						// util.sendEmailV4ews(request, request.email_id, emailSubject, Template, 1);
						util.sendEmailV4ewsV1(
							request,
							emailList,
							header,
							htmlString,
							attachmentPath,
							emailProviderDetails
						);
					}

				}

			}

		} catch (e) {
			logger.info(e)
			logger.info(e.stack);
			logger.error("Error Generating Summary ", { error: e });
		}

		return true;
	}

	let generateMOMOrdersHtmlCode = async (request, participantsList, wfActivityDetails) => {

		let htmlString = "";
		let attachmentPath = "";
		let activityTypeId = Number(request.activity_type_id) || 0;
		const [errorZero, childMOM] = await this.activityListSelectChildOrders({
			organization_id: request.organization_id,
			parent_activity_id: request.activity_id,
			flag: 5
		});

		if (errorZero || childMOM.length === 0) {
			return [htmlString, attachmentPath];
		}

		let meetingRequestFormId = 50816;
		let scheduledTimeFieldId = 312542;
		let nsr1FieldId = 316536;
		let nsr2FieldId = 316535;
		if(activityTypeId === 197905) {
			meetingRequestFormId = 51493;
			scheduledTimeFieldId = 318525;
			nsr1FieldId = 318631;
		}

		const formTimelineDataOfMeeting = await activityCommonService.getActivityTimelineTransactionByFormId713({
			organization_id: request.organization_id,
			account_id: request.account_id
		}, request.activity_id, meetingRequestFormId);

		let meetingDate = "";

		let formTransactionID = 0, formActivityID = 0;
		if (formTimelineDataOfMeeting.length > 0) {
			formTransactionID = Number(formTimelineDataOfMeeting[0].data_form_transaction_id);
			formActivityID = Number(formTimelineDataOfMeeting[0].data_activity_id);
		}

		if (formTransactionID > 0) {

			const fieldData = await getFieldValue({
				form_transaction_id: formTransactionID,
				form_id: meetingRequestFormId,
				field_id: scheduledTimeFieldId,
				organization_id: request.organization_id
			});

			let fieldDataOfAttachment = await getFieldValue({
				form_transaction_id: formTransactionID,
				form_id: meetingRequestFormId,
				field_id: nsr1FieldId,
				organization_id: request.organization_id
			});

			if (fieldDataOfAttachment.length > 0) {
				attachmentPath = fieldDataOfAttachment[0].data_entity_text_1;
			}

			if (attachmentPath == null || attachmentPath == "") {
				fieldDataOfAttachment = await getFieldValue({
					form_transaction_id: formTransactionID,
					form_id: meetingRequestFormId,
					field_id: nsr2FieldId,
					organization_id: request.organization_id
				});

				if (fieldDataOfAttachment.length > 0) {
					attachmentPath = fieldDataOfAttachment[0].data_entity_text_1;
				}

			}

			if (fieldData.length > 0) {
				let entityInlineJSON = JSON.parse(fieldData[0].data_entity_inline || "{}");
				if (entityInlineJSON.hasOwnProperty("start_date_time")) {
					meetingDate = entityInlineJSON.start_date_time;
					if (meetingDate) {
						console.log(meetingDate);
						meetingDate = moment(meetingDate);
						meetingDate = `${meetingDate.format('DD')}-${meetingDate.format("MMMM")}`;
					}
				}
			}
		}

		let finalSummaryData = [];
		let momFieldMappingsForSummary = {
			"190797": {
				"form_id": 50821,
				"fields": {
					"Discussion_Point": 312417,
					"Description": [
						312418,
						312419,
						312420,
						312421,
						312422,
						312423,
						312424,
						312425,
						312426,
						312427,
						312246
					],
					"Responsible_Person_Email_ID": 312428,
					"Responsibility_Holder": 312429,
					"Category_ID": 312430,
					"Assigned_To": 312431,
					"Assigned_Date": 312432,
					"Due_Date": 312767,
					"Comments": 312433
				}
			},
			"191879": {
				"form_id": 50997,
				"fields": {
					"Discussion_Point": 313556,
					"Description": 313557,
					"Responsible_Person_Email_ID": 313561,
					"Responsibility_Holder": 313560,
					"Category_ID": 0,
					"Assigned_To": 313559,
					"Assigned_Date": 313563,
					"Due_Date": 313562,
					"Comments": 313566
				}
			},
			"197905": {
				"form_id": 51568,
				"fields": {
					"Discussion_Point": 318882,
					"Description": 318883,
					"Responsible_Person_Email_ID": 318884,
					"Responsibility_Holder": 318885,
					"Category_ID": 318886,
					"Assigned_To": 318888,
					"Assigned_Date": 318888,
					"Target_Closure_Date": 318889,
					"Comments": 318890
				}
			},
			"field_order": {
				"190797": [
					"SL_NO",
					"Meeting_ID",
					"MOM_Point_ID",
					"Discussion_Point",
					"Description",
					"Responsible_Person_Email_ID",
					"Responsibility_Holder",
					"Category_ID",
					"Assigned_To",
					"Assigned_Date",
					"Due_Date",
					"Comments",
					"Status"
				],
				"191879": [
					"SL_NO",
					"Meeting_ID",
					"MOM_Point_ID",
					"Discussion_Point",
					"Description",
					"Responsible_Person_Email_ID",
					"Responsibility_Holder",
					"Category_ID",
					"Assigned_To",
					"Assigned_Date",
					"Due_Date",
					"Comments",
					"Status"
				],
				"197905": [
					"SL_NO",
					"Meeting_ID",
					"MOM_Point_ID",
					"Discussion_Point",
					"Description",
					"Responsible_Person_Email_ID",
					"Responsibility_Holder",
					"Category_ID",
					"Assigned_To",
					"Assigned_Date",
					"Target_Closure_Date",
					"Comments",
					"Status"
				]
			},
			"date_fields": [
				312767,
				312432,
				313563,
				313562,
				318888,
				318889
			]
		};

		let MOMFIELDMAPPINGSFORSUMMARY = momFieldMappingsForSummary[String(request.activity_type_id)];
		let formID = MOMFIELDMAPPINGSFORSUMMARY["form_id"];
		let fields = Object.keys(MOMFIELDMAPPINGSFORSUMMARY["fields"]);
		let dateFields = momFieldMappingsForSummary["date_fields"];

		for (let i = 0; i < childMOM.length; i++) {
			let child = childMOM[i];
			let fieldIDValue = {};
			let inlineJSON = [];
			let activityID = child["activity_id"];
			const formTimelineData = await activityCommonService.getActivityTimelineTransactionByFormId713({
				organization_id: request.organization_id,
				account_id: request.account_id
			}, activityID, formID);

			if (formTimelineData.length > 0) {
				const dataActivityInline = JSON.parse(formTimelineData[0].data_entity_inline);
				inlineJSON = (typeof dataActivityInline.form_submitted === 'string') ? JSON.parse(dataActivityInline.form_submitted) : dataActivityInline.form_submitted;
			}

			for (let fieldData of inlineJSON) {
				fieldIDValue[String(fieldData.field_id)] = fieldData.field_value;
			}

			let data = {};
			data["SL_NO"] = i + 1;
			data["Meeting_ID"] = child["activity_cuid_3"];
			data["MOM_Point_ID"] = child["activity_cuid_2"];
			data["Status"] = child["activity_status_tag_name"];

			for (let field of fields) {
				let value = "";
				let fieldID = MOMFIELDMAPPINGSFORSUMMARY["fields"][field];
				logger.info('fieldID : %j', fieldID);
				if (isArray(fieldID)) {
					for (let subFieldID of fieldID) {
						if (fieldIDValue.hasOwnProperty(String(subFieldID))) {
							value = fieldIDValue[String(subFieldID)];
							break;
						}
					}
				} else {
					if (fieldIDValue.hasOwnProperty(String(fieldID))) {
						value = fieldIDValue[String(fieldID)];
					}
				}

				if (dateFields.includes(fieldID)) {
					try {
						let date = moment(value)
						if (date.isValid()) {
							value = date.format("DD-MM-YYYY");
						}
					} catch (e) { }
				}
				data[field] = value;
			}
			finalSummaryData.push(data);
		}

		htmlString = `<p>Hi,</p><p>Greetings from Vi&trade;</p><p>The mail is to inform you that Based on Meeting Id:${wfActivityDetails[0].activity_cuid_3} on ${meetingDate} with ${wfActivityDetails[0].activity_title}, the updated discussion points are the following point(s).</p><br><table width="100%" border="1" cellspacing="0"><thead><tr>`;

		for (const key of momFieldMappingsForSummary["field_order"][String(request.activity_type_id)]) {
			htmlString += '<th>' + key + '</th>';
		}
		htmlString += '</tr></thead><tbody>';

		for (let child of finalSummaryData) {
			htmlString += '<tr>';
			for (const key of momFieldMappingsForSummary["field_order"][String(request.activity_type_id)]) {
				htmlString += '<td>' + child[key] + '</td>';
			}
			htmlString += '</tr>';
		}

		htmlString += '</tbody></table><br><br><p>Thanks,</p><p>Vi&trade; Business</p>';
		return [htmlString, attachmentPath];
	}

	async function getParticipantDetails(request) {
		let responseData = [];
		let error = true;

		const paramsArr = [request.assetID];

		const queryString = util.getQueryString('ds_p1_asset_list_select_asset', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then
				(
					(data) => {
						responseData = data;
						error = false;
					}
				)
				.catch
				(
					(err) => {
						error = err;
					}
				)
		}

		return [error, responseData];
	}

	let getParticipantsAsync = async (request) => {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.activity_id,
			request.organization_id,
			request.is_all_flag,
			0,
			50
		);

		const queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_participants_org', paramsArr);
		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then((data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					//error = true;
					console.log("Error in function 'getParticipantsAsync' : ", err);
				});
		}
		return [error, responseData];
	};


	async function getBotInlineJson(request) {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.organization_id,
			request.activity_type_id,
			request.bot_operation_type_id,
			0,
			request.form_id,
			request.field_id,
			request.start_from || 0,
			request.limit_value || 50
		);

		const queryString = util.getQueryString('ds_p1_bot_operation_mapping_select_form_field', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(1, queryString, request)
				.then((data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				})
		}

		return [error, responseData];
	}

	function isArray(obj) {
		return obj !== undefined && obj !== null && Array.isArray(obj) && obj.constructor == Array;
	}

	this.generateSummary = async (request) => {
		try {
			// const kafka = new Kafka({
			// 	clientId: 'child-order-creation',
			// 	brokers: global.config.BROKER_HOST.split(",")
			// })

			// const producer = kafka.producer()

			// await producer.connect()
			// await producer.send({
			// 	topic: global.config.CHILD_ORDER_TOPIC_NAME,
			// 	messages: [
			// 		{
			//			value: JSON.stringify({
			//				...request,
			//				requestType: "summary_mom_child_orders"
			//			})
			// 		},
			// 	],
			// })
			// producer.disconnect();

			sqs.sendMessage({
				// DelaySeconds: 5,
				MessageBody: JSON.stringify({
					...request,
					requestType: "summary_mom_child_orders"
				}),
				QueueUrl: global.config.ChildOrdersSQSqueueUrl,
				MessageGroupId: `mom-creation-queue-v1`,
				MessageDeduplicationId: uuidv4(),
				MessageAttributes: {
					"Environment": {
						DataType: "String",
						StringValue: global.mode
					},
				}
			}, (error, data) => {
				if (error) {
					logger.error("Error sending excel job to SQS queue", { type: 'bot_engine', error: serializeError(error)});
					console.log("Error sending excel job to SQS queue", { type: 'bot_engine', error: serializeError(error)})
				} else {
					logger.info("Successfully sent excel job to SQS queue: %j", data);    
					console.log("Successfully sent excel job to SQS queue: %j", data);                                    
				}                                    
			});


		} catch (e) {
			console.log(e)
		}
	}

	//Get the field value based on form id and form_transaction_id
	async function getFieldValue(request) {
		let paramsArr = new Array(
			request.form_transaction_id || 0,
			request.form_id,
			request.field_id,
			request.organization_id
		);
		let queryString = util.getQueryString('ds_p1_activity_form_transaction_select_field_sequence_id', paramsArr);
		if (queryString != '') {
			return await (db.executeQueryPromise(1, queryString, request));
		}
	}

	// Update Widget Details
	this.UpdateWidgetDetails = async function (request) {
		let responseData = [],
			error = true;

		const paramsArr = new Array(
			request.activity_id,
			request.sequence_id,
			request.widget_name,
			request.flag,
			request.organization_id,
			util.getCurrentUTCTime()
		);
		const queryString = util.getQueryString('ds_p2_activity_list_update_widget_details', paramsArr);

		if (queryString !== '') {
			await db.executeQueryPromise(0, queryString, request)
				.then((data) => {
					responseData = data;
					error = false;
				})
				.catch((err) => {
					error = err;
				})
		}
		return [error, responseData];
	}

	// Activity Reference Add
	this.activityReferenceAdd = async function (request) {
		let responseData = [],
			error = true;
		let activityReferenceId = request.refrence_activity_id;
		request.datetime_log = util.getCurrentUTCTime();
		[error, responseData] = await activityCommonService.activityActivityMappingInsertV1(request, activityReferenceId);

		if (error) {
			error = true;
			responseData = [{ "message": "Activity refrence addition failed" }];
		}
		else {
			error = false;
			responseData = [{ "message": "Activity refrence added successfully" }];
		}

		return [error, responseData];
	}

	// Activity Reference Delete
	this.activityReferenceDelete = async function (request) {
		let responseData = [],
			error = true;
		let activityReferenceId = request.refrence_activity_id;
		[error, responseData] = await activityCommonService.activityActivityMappingArchive(request, activityReferenceId);
		if (error) {
			error = true;
			responseData = [{ "message": "Activity refrence deletion failed" }];
		}
		else {
			error = false;
			responseData = [{ "message": "Activity refrence deleted successfully" }];
		}

		return [error, responseData];
	}

	// Activity Reference Update
	this.activityReferenceUpdate = async function (request) {
		let responseData = [],
			error = true;
		let oldActivityReferenceId = request.old_refrence_activity_id;
		let activityReferenceId = request.refrence_activity_id;
		request.datetime_log = util.getCurrentUTCTime();
		[error, responseData] = await activityCommonService.activityActivityMappingArchive(request, oldActivityReferenceId);

		if (error) {
			error = true;
			responseData = [{ "message": "Activity refrence updation failed" }];
		}
		else {
			[error, responseData] = await activityCommonService.activityActivityMappingInsertV1(request, activityReferenceId);
			if (error) {
				error = true;
				responseData = [{ "message": "Activity refrence updation failed" }];
			}
			else {
				error = false;
				responseData = [{ "message": "Activity refrence updated successfully" }];
			}

		}


		return [error, responseData];
	}


}

module.exports = ActivityListingService;

