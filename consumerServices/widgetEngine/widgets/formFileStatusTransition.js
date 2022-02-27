const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ = require('lodash');



class FormFileStatusTransitionWidget extends WidgetBase {
	constructor(args) {
		super(args);
		this.id = CONST.WIDGET_TYPE_IDS.FROM_FILE_STATUS_TRANSITION;
	}

	aggregateAndSaveTransaction(formSubmissionDate, data) {

		if (data.req_activity_status_id == this.rule.widget_entity3_id) {

			let activityQueryData = {
				start: formSubmissionDate.startDate,
				end: formSubmissionDate.endDate,
				form_id: this.form.id,
				widget_access_level_id: this.rule.widget_access_level_id,
				from_status_id: this.rule.widget_entity2_id,
				flag: 0,
				asset_type_id: 0
			};

			activityQueryData = _.merge(activityQueryData, data);

			this.services.activityStatusChangeTxnService.activityStatusChangeTxnActivityStatus(activityQueryData).then((min_result) => {

				let min_datetime = this.objCollection.util.replaceDefaultDatetime(min_result[0].min_from_status_datetime);

				activityQueryData.flag = 1;
				activityQueryData.to_status_id = this.rule.widget_entity3_id;

				this.services.activityStatusChangeTxnService.activityStatusChangeTxnActivityStatus(activityQueryData).then((max_result) => {

					let max_datetime = this.objCollection.util.replaceDefaultDatetime(max_result[0].max_to_status_datetime);

					let aggregate = 0;

					if (max_datetime != '1970-01-01 00:00:00' && min_datetime != '1970-01-01 00:00:00')
						aggregate = this.objCollection.util.differenceDatetimes(max_datetime, min_datetime) / 1000;

					//global.logger.write('conLog', 'Transition: WidgetId' + this.rule.widget_id + ' MAX DATETIME: ' + max_datetime, {}, data);
					util.logInfo({},`activityStatusChangeTxnActivityStatus Transition: %j`,{WidgetId : this.rule.widget_id,MAX_DATETIME : max_datetime, data});
					//global.logger.write('conLog', 'Transition: WidgetId' + this.rule.widget_id + ' MIN DATETIME: ' + min_datetime, {}, data);
					util.logInfo({},`activityStatusChangeTxnActivityStatus Transition: %j`,{WidgetId : this.rule.widget_id,MIN_DATETIME : min_datetime, data});

					activityQueryData.from_status_datetime = min_datetime;
					activityQueryData.to_status_datetime = max_datetime;
					activityQueryData.status_changed_flag = 2;

					this.services.activityStatusChangeTxnService.activityStatusChangeTxnInsert(activityQueryData, aggregate).then(() => {
						//global.logger.write('conLog', 'Transition: WidgetId ' + this.rule.widget_id + ' WAIT FOR 2 SECS START: ' + this.objCollection.util.getCurrentUTCTime(), {}, data);
						util.logInfo({},`activityStatusChangeTxnInsert Transition: %j`,{WidgetId : this.rule.widget_id,WAIT_FOR_2_SECS_START : this.objCollection.util.getCurrentUTCTime(), data});
						this.services.activityListService.wait(2000).then(() => {

							this.services.activityStatusChangeTxnService.activityStatusChangeTxnIntermediateAggr(activityQueryData).then((result) => {
								//global.logger.write('conLog', 'Transition: WidgetId ' + this.rule.widget_id + ' WAIT FOR 2 SECS END: ' + this.objCollection.util.getCurrentUTCTime(), {}, data);
								util.logInfo({},`activityStatusChangeTxnIntermediateAggr Transition: %j`,{WidgetId : this.rule.widget_id,WAIT_FOR_2_SECS_END : this.objCollection.util.getCurrentUTCTime(), data});
								aggregate = result[0].duration;

								let widgetData = {
									date: formSubmissionDate.valueInRuleTimeZone,
									aggregate: aggregate,
									widget_id: this.rule.widget_id,
									period_flag: this.getPeriodFlag(),
									widget_access_level_id: this.rule.widget_access_level_id,
									asset_id: data.asset_id,
									workforce_id: data.workforce_id,
									account_id: data.account_id,
									organization_id: data.organization_id,
									activity_id: data.activity_id
								};

								let msg = {};
								msg.type = "file_status_transition_widget_aggregate";
								msg.form_id = data.form_id;
								msg.widget_id = widgetData.widget_id;

								//global.logger.write('conLog', 'Transition: WidgetId : ' + this.rule.widget_id + ' AGGR TO WIDGET : ' + result[0].duration, {}, data);
								util.logInfo({},`activityStatusChangeTxnIntermediateAggr Transition: %j`,{WidgetId : this.rule.widget_id,AGGR_TO_WIDGET : result[0].duration, data});

								if (aggregate > 0) {
									return this.createOrUpdateWidgetTransaction(widgetData, msg, data.organization_id).then(() => {});
								}
							})
						})
					});

				})
			})
		} else {
			//global.logger.write('conLog', 'Transition: WidgetId : ' + this.rule.widget_id + ' : ' + data.req_activity_status_id + ' NOT EQUALS TO RULE STATUS ' + this.rule.widget_entity3_id, {}, data);
			util.logInfo({},`aggregateAndSaveTransaction Transition: %j`,{WidgetId : this.rule.widget_id,req_activity_status_id : data.req_activity_status_id, NOT_EQUALS_TO_RULE_STATUS : this.rule.widget_entity3_id, data});
		}
	}

	createOrUpdateWidgetTransaction(widgetData, msg, organizationId) {
		const widgetTransactionSvc = this.services.widgetTransaction;
		return widgetTransactionSvc.getByPeriodFlag(widgetData)
			.then((result) => {
				const widgetTransId = result[0] ? result[0].idWidgetTransaction : undefined;
				widgetData.widget_transaction_id = widgetTransId;
				console.log("NEW AGGR: " + widgetData.aggregate + "; " + "EXISTING AGGR: " + result[0].valueDecimal + 'widgetTransId ' + widgetTransId);
				if (widgetData.aggregate != result[0].valueDecimal) {
					if (widgetTransId > 0) {
						//Pubnub PUSH
						// this.objCollection.pubnubWrapper.push(organizationId, msg);
						return widgetTransactionSvc.updateFileStatusTransition(widgetData);
					} else {
						//Pubnub PUSH
						// this.objCollection.pubnubWrapper.push(organizationId, msg);
						return widgetTransactionSvc.createFileStatusTransition(widgetData);
					}
				}
			})
	}
};
module.exports = FormFileStatusTransitionWidget;