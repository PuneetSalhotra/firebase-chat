const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ =require('lodash');

class FrequencyDistributionWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.FREQUENCY_DISTRIBUTION;
    }
    aggregateAndSaveTransaction(formSubmissionDate, data) {
        const entityData = data.normalizedFormData[this.rule.widget_entity2_id];
        let activityQueryData = {
            startOfMonth: formSubmissionDate.startOfMonth,
            endOfMonth: formSubmissionDate.endOfMonth,
            form_id: this.form.id
        };
        activityQueryData = _.merge(activityQueryData, _.pick(data.payload, ['activity_id', 'asset_id', 'organization_id',
                'activity_type_id', 'asset_type_id', 'worforce_id', 'account_id', 'field_id', 'data_type_id']));
        this.services.activityFormTransaction.getCountForMonth(activityQueryData)
        .then((result) => {
            const count = result[0] ? result[0].form_count : undefined;
            let widgetData = {
                date: formSubmissionDate.value,
                count: count,
                widget_id: this.rule.widget_id,
                period_flag: this.getPeriodFlag()
            };
            widgetData = _.merge(widgetData, _.pick(data.payload, ['asset_id', 'organization_id']));
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