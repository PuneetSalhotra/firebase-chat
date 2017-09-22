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
            start: formSubmissionDate.startOfDayInUTC,
            end: formSubmissionDate.endOfDayInUTC,
            entity_id: this.rule.widget_entity2_id,
            form_id: this.form.id,
            entity_data_type_id: this.rule.widget_entity2_data_type_id,
            access_level_id: this.rule.access_level_id || 5,
            asset_type_id: 0
        };
        activityQueryData = _.merge(activityQueryData, data);

        this.services.activityFormTransactionAnalytics.getSumByDay(activityQueryData)
                .then((result) => {
                    const sum = result[0] ? result[0].total_sum : undefined;
                    let widgetData = {
                        date: formSubmissionDate.valueInRuleTimeZone,
                        sum: sum,
                        widget_id: this.rule.widget_id,
                        period_flag: this.getPeriodFlag()
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
                    if (widgetTransId)
                        return widgetTransactionSvc.update(widgetData);
                    else
                        return widgetTransactionSvc.create(widgetData);
                })
    }
}

module.exports = SingleDimensionalAggrWidget;