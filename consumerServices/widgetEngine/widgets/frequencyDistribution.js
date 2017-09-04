/**
 * author: SBK
 */
const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ =require('lodash');

class FrequencyDistributionWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.FREQUENCY_DISTRIBUTION;
    }
    aggregateAndSaveTransaction(formSubmissionDate, data) {
        let activityQueryData = {
            start: formSubmissionDate.startOfMonthInUTC,
            end: formSubmissionDate.endOfMonthInUTC,
            form_id: this.form.id,
            access_level_id: this.rule.access_level_id || 5,
            asset_type_id: 0
        };
        activityQueryData = _.merge(activityQueryData, data);
        this.services.activityFormTransactionAnalytics.getCountForMonth(activityQueryData)
        .then((result) => {
            const count = result[0] ? result[0].form_count : undefined;
            let widgetData = {
                date: formSubmissionDate.valueInRuleTimeZone,
                count: count,
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
            if(widgetTransId) return widgetTransactionSvc.updateFrequencyDistribution(widgetData);
            else return widgetTransactionSvc.createFrequencyDistribution(widgetData);
        }) 
    }

}

module.exports = FrequencyDistributionWidget;