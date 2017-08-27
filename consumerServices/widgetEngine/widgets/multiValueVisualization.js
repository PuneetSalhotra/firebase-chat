/**
 * author: SBK
 */
const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ =require('lodash');


class MultiDimensionalAggrWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.MULTI_VALUE_VISUALIZATION;
    }

    retrievFormTransactionId() {
        return new Promise((resolve, reject) => {
            this.objCollection.cacheWrapper.retrieveFormTransactionId((err, id) => {
                if(err) return reject(err);
                else return resolve(id);
            });
        });
    }

    getChoiceSumField() {
        var field;
        switch(this.rule.widget_entity3_data_type_id) {
            case 5:
                field = 'data_entity_bigint_1';
            break;
            case 6:
                field = 'data_entity_double_1';
            break;
            case 7:
                field = 'data_entity_tinyint_1';
            break;
            case 8:
                field = 'data_entity_tinyint_1';
            break;
            default:
                field = '';
            break;
        }
        return field;
    }

    aggregateAndSaveTransaction(formSubmissionDate, data) {
        const entity1Data = data.normalizedFormData[this.rule.widget_entity2_id];
        const entity2Data = data.normalizedFormData[this.rule.widget_entity3_id];
        let choice;
        let activityQueryData = {
            form_id: this.form.id,
            entity_id: entity1Data.field_id
        };
        this.retrievFormTransactionId()
        .then((id) => {
            activityQueryData.form_transaction_id = id;
            return this.services.activityFormTransaction.getByTransactionField(activityQueryData);
        })
        .then((result) => {
            choice = result[0] ? result[0].data_entity_text_1 : undefined;
            let activityQueryData = {
                form_id: this.form.id,
                entity_id: entity1Data.field_id,
                choice: choice,
                start: formSubmissionDate.startOfDayInUTC,
                end: formSubmissionDate.endOfDayInUTC
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
            const field = this.getChoiceSumField();
            const sum = results.map((res) =>  res[field]).filter((val) => !_.isUndefined(val)).reduce((a, b) => { return a + b; }, 0);
            let widgetData = {
                date: formSubmissionDate.valueInRuleTimeZone,
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