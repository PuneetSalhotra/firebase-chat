/**
 * author: SBK
 */
const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ = require('lodash');



class SingleDimensionalAggrWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.SINGLE_DIMENSIONAL_AGGR;
    }

    aggregateAndSaveTransaction(formSubmissionDate, data) {
        let activityQueryData = {
            start: formSubmissionDate.startDate,
            end: formSubmissionDate.endDate,
            entity_id: this.rule.widget_entity2_id,
            form_id: this.form.id,
            entity_data_type_id: this.rule.widget_entity2_data_type_id,
            widget_access_level_id: this.rule.widget_access_level_id,
            widget_aggregate_id: this.rule.widget_aggregate_id,
            asset_type_id: 0
        };
        activityQueryData = _.merge(activityQueryData, data);

        this.services.activityFormTransactionAnalytics.getAggregateByDateRange(activityQueryData)
            .then((result) => {
                const sum = result[0] ? result[0].aggr_value : undefined;
                let widgetData = {
                    date: formSubmissionDate.valueInRuleTimeZone,
                    sum: sum,
                    widget_id: this.rule.widget_id,
                    period_flag: this.getPeriodFlag(),
                    widget_access_level_id: this.rule.widget_access_level_id
                };
                widgetData = _.merge(widgetData, data);
                return this.createOrUpdateWidgetTransaction(widgetData);
            });
    }

    createOrUpdateWidgetTransaction(widgetData) {
        const widgetTransactionSvc = this.services.widgetTransaction;
        return widgetTransactionSvc.getByPeriodFlag(widgetData)
            .then((result) => {
                const widgetTransId = result[0] ? result[0].idWidgetTransaction : undefined;
                widgetData.widget_transaction_id = widgetTransId;
                if (widgetTransId) {
                    //Pubnub PUSH
                    var msg = {};
                    msg.type = "form_submited_show_widget_count";
                    msg.form_id = widgetData.form_id;
                    msg.widget_id = widgetData.widget_id;
                    this.objCollection.pubnubWrapper.push(widgetData.organization_id, msg);
                    ///////////////////////////////
                    return widgetTransactionSvc.update(widgetData);
                } else {
                    //Pubnub PUSH
                    var msg = {};
                    msg.type = "form_submited_show_widget_count";
                    msg.form_id = widgetData.form_id;
                    msg.widget_id = widgetData.widget_id;
                    this.objCollection.pubnubWrapper.push(widgetData.organization_id, msg);
                    ///////////////////////////////
                    return widgetTransactionSvc.create(widgetData);
                }
            })
    }
}

module.exports = SingleDimensionalAggrWidget;