const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ =require('lodash');



class SingleDimensionalAggrWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.SINGLE_DIMENSIONAL_AGGR;
    }

    aggregateAndSaveTransaction(formSubmissionDate, data) {
        const entityData = data.normalizedFormData[this.rule.widget_entity2_id];
        this.services.activityFormTransaction.getSumByDay(formSubmissionDate, entityData, data.payload)
        .then((result) => {
            const sum = result[0] ? result[0].total_sum : undefined;
            let widgetData = {
                date: formSubmissionDate.value,
                sum: sum,
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
            if(widgetTransId) return widgetTransactionSvc.update(widgetData);
            else return widgetTransactionSvc.create(widgetData);
        }) 
    }
}

module.exports = SingleDimensionalAggrWidget;