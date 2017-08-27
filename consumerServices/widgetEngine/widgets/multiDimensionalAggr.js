/**
 * author: SBK
 */
const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ =require('lodash');

class MultiDimensionalAggrWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.MULTI_DIMENSIONAL_AGGR;
    }

    aggregateAndSaveTransaction(formSubmissionDate, data) {
        const entity1Data = data.normalizedFormData[this.rule.widget_entity2_id];
        const entity2Data = data.normalizedFormData[this.rule.widget_entity3_id];
        let activityQueryData = [{
            start: formSubmissionDate.startOfDayInUTC,
            end: formSubmissionDate.endOfDayInUTC,
            entity_id: entity1Data.field_id,
            form_id: this.form.id,
            entity_data_type_id: entity1Data.field_data_type_id,
            access_level_id: this.rule.access_level_id  || 5,
            asset_type_id: 0      
        }, {
            start: formSubmissionDate.startOfDayInUTC,
            end: formSubmissionDate.endOfDayInUTC,
            entity_id: entity2Data.field_id,
            form_id: this.form.id,
            entity_data_type_id: entity2Data.field_data_type_id,
            access_level_id: this.rule.access_level_id  || 5,
            asset_type_id: 0  
        }];
        activityQueryData[0] = _.merge(activityQueryData[0], _.pick(data.payload, ['asset_id', 'activity_id', 
        'organization_id', 'account_id', 'workforce_id', 'activity_type_category_id']));
        activityQueryData[1] = _.merge(activityQueryData[1], _.pick(data.payload, ['asset_id', 'activity_id', 
        'organization_id', 'account_id', 'workforce_id', 'activity_type_category_id']));

        var promises = [
            this.services.activityFormTransaction.getSumByDay(activityQueryData[0]),
            this.services.activityFormTransaction.getSumByDay(activityQueryData[1]),
        ];
        Promise.all(promises)
        .then((result) => {
            const sumEntity1 = result[0][0] ? result[0][0].total_sum : undefined;
            const sumEntity2 = result[1][0] ? result[1][0].total_sum : undefined;

            let widgetData = [{
                date: formSubmissionDate.valueInRuleTimeZone,
                widget_id: this.rule.widget_id,
                entity_id: this.rule.widget_entity2_id,
                index : 1,
                sum: sumEntity1,
                period_flag: this.getPeriodFlag(), 
            }, {
                date: formSubmissionDate.valueInRuleTimeZone,
                widget_id: this.rule.widget_id,
                entity_id: this.rule.widget_entity3_id,
                index: 2,
                sum: sumEntity2,
                period_flag: this.getPeriodFlag()
            }];
            widgetData[0] = _.merge(widgetData[0], _.pick(data.payload, ['asset_id', 'organization_id']));
            widgetData[1] = _.merge(widgetData[1], _.pick(data.payload, ['asset_id', 'organization_id']));
            return this.createOrUpdateWidgetTransaction(widgetData);
        });
    }

    createOrUpdateWidgetTransaction(widgetData) {
        const widgetTransactionSvc = this.services.widgetTransaction;
        return widgetTransactionSvc.getByDayAndFields(widgetData)
        .then((result) => {
            const widgetTrans1Id = result[0] ? result[0].idWidgetTransaction1 : undefined;
            const widgetTrans2Id = result[0] ? result[0].idWidgetTransaction2 : undefined;
            widgetData[0].widget_transaction_id = widgetTrans1Id;
            widgetData[1].widget_transaction_id = widgetTrans2Id;
            var promises = [
                widgetTrans1Id ?   widgetTransactionSvc.updateMultiDimAggregate(widgetData[0]) : widgetTransactionSvc.createMultiDimAggregare(widgetData[0]),
                widgetTrans2Id ?   widgetTransactionSvc.updateMultiDimAggregate(widgetData[1]) : widgetTransactionSvc.createMultiDimAggregare(widgetData[1])
            ];
            return Promise.all(promises);
        }) 
    }

}

module.exports = MultiDimensionalAggrWidget;