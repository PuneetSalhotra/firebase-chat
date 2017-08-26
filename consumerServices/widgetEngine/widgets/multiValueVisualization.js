 const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ =require('lodash');


class MultiDimensionalAggrWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.MULTI_VALUE_VISUALIZATION;
    }

    aggregateAndSaveTransaction(formSubmissionDate, data) {
        const entity1Data = data.normalizedFormData[this.rule.widget_entity2_id];
        const entity2Data = data.normalizedFormData[this.rule.widget_entity3_id];
        let choice;
        let activityQueryData = {
            form_id: this.form.id,
            entity_id: entity1Data.field_id
        };
        activityQueryData = _.merge(activityQueryData, _.pick(data.payload, ['form_transaction_id']));
        this.services.activityFormTransaction.getByTransactionField(activityQueryData)
        .then((result) => {
            choice = result[0] ? result[0].data_entity_text : undefined;
            let activityQueryData = {
                form_id: this.form.id,
                entity_id: entity1Data.field_id,
                choice: choice,
                startOfDay: formSubmissionDate.startOfDay,
                endOfDay: formSubmissionDate.endOfDay
            };
            return this.services.activityFormTransaction.getFormTransactionsByChoice(activityQueryData);
        })
        .then((rows) => {
            var promises = [];
            rows.forEach((row) => promises.push(this.services.activityFormTransaction.getByTransactionField({
                form_id: this.form.id,
                entity_id: entity2Data.field_id,
                form_transaction_id: row.form_transaction_id
            })));
            return Promise.all(promises);
        })
        .then((results) => {
            const sum = results.map(function(res){ return res.field; }).reduce(function(a, b){ return a + b; }, 0);
            let widgetData = {
                date: formSubmissionDate.value,
                choice: choice,
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
        return widgetTransactionSvc.getByChoice(widgetData)
        .then((result) => {
            const widgetTransId = result[0] ? result[0].idWidgetTransaction : undefined;
            widgetData.widget_transaction_id = widgetTransId;
            if(widgetTransId) return widgetTransactionSvc.updateMultiValueVisualization(widgetData);
            else return widgetTransactionSvc.createMultiValueVisualization(widgetData);
        }) ;
    }

}

module.exports = MultiDimensionalAggrWidget;