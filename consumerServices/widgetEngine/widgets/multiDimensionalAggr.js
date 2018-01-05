/**
 * author: SBK
 */
const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ = require('lodash');

class MultiDimensionalAggrWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.MULTI_DIMENSIONAL_AGGR;
    }

    aggregateAndSaveTransaction(formSubmissionDate, data) {
        let activityQueryData = [{
                start: formSubmissionDate.startDate,
                end: formSubmissionDate.endDate,
                entity_id: this.rule.widget_entity2_id,
                form_id: this.form.id,
                entity_data_type_id: this.rule.widget_entity2_data_type_id,
                widget_access_level_id: this.rule.widget_access_level_id,
				widget_aggregate_id: this.rule.widget_aggregate_id,
                asset_type_id: 0
            }, {
                start: formSubmissionDate.startDate,
                end: formSubmissionDate.endDate,
                entity_id: this.rule.widget_entity3_id,
                form_id: this.form.id,
                entity_data_type_id: this.rule.widget_entity3_data_type_id,
                widget_access_level_id: this.rule.widget_access_level_id,
				widget_aggregate_id: this.rule.widget_aggregate_id,
                asset_type_id: 0
            }, {
                start: formSubmissionDate.startDate,
                end: formSubmissionDate.endDate,
                entity_id: this.rule.widget_entity4_id,
                form_id: this.form.id,
                entity_data_type_id: this.rule.widget_entity4_data_type_id,
                widget_access_level_id: this.rule.widget_access_level_id,
				widget_aggregate_id: this.rule.widget_aggregate_id,
                asset_type_id: 0
            }];
        activityQueryData[0] = _.merge(activityQueryData[0], data);
        activityQueryData[1] = _.merge(activityQueryData[1], data);
        activityQueryData[2] = _.merge(activityQueryData[2], data);
        
        var promises = [
            this.services.activityFormTransactionAnalytics.getAggregateByDateRange(activityQueryData[0]),
            this.services.activityFormTransactionAnalytics.getAggregateByDateRange(activityQueryData[1]),
            this.services.activityFormTransactionAnalytics.getAggregateByDateRange(activityQueryData[2]),
        ];
        Promise.all(promises)
                .then((result) => {
                    const sumEntity1 = result[0][0] ? result[0][0].aggr_value : undefined;
                    const sumEntity2 = result[1][0] ? result[1][0].aggr_value : undefined;
                    const sumEntity3 = result[2][0] ? result[2][0].aggr_value : undefined;
                    
                    let widgetData = [{
                            date: formSubmissionDate.valueInRuleTimeZone,
                            widget_id: this.rule.widget_id,
                            entity_id: this.rule.widget_entity2_id,
							widget_access_level_id: this.rule.widget_access_level_id,
                            index: 1,
                            sum: sumEntity1,
                            period_flag: this.getPeriodFlag(),
                        }, {
                            date: formSubmissionDate.valueInRuleTimeZone,
                            widget_id: this.rule.widget_id,
                            entity_id: this.rule.widget_entity3_id,
							widget_access_level_id: this.rule.widget_access_level_id,
                            index: 2,
                            sum: sumEntity2,
                            period_flag: this.getPeriodFlag()
                        }, {
                            date: formSubmissionDate.valueInRuleTimeZone,
                            widget_id: this.rule.widget_id,
                            entity_id: this.rule.widget_entity4_id,
							widget_access_level_id: this.rule.widget_access_level_id,
                            index: 3,
                            sum: sumEntity3,
                            period_flag: this.getPeriodFlag()
                        }];
                    widgetData[0] = _.merge(widgetData[0], data);
                    widgetData[1] = _.merge(widgetData[1], data);
                    widgetData[2] = _.merge(widgetData[2], data);
                    return this.createOrUpdateWidgetTransaction(widgetData);
                });
    }

    createOrUpdateWidgetTransaction(widgetData) {
        const widgetTransactionSvc = this.services.widgetTransaction;
        return widgetTransactionSvc.getByDayAndFields(widgetData)
                .then((result) => {
                    const widgetTrans1Id = result[0] ? result[0].idWidgetTransaction1 : undefined;
                    const widgetTrans2Id = result[0] ? result[0].idWidgetTransaction2 : undefined;
                    const widgetTrans3Id = result[0] ? result[0].idWidgetTransaction3 : undefined;
                    
                    widgetData[0].widget_transaction_id = widgetTrans1Id;
                    widgetData[1].widget_transaction_id = widgetTrans2Id;
                    widgetData[2].widget_transaction_id = widgetTrans3Id;
                    
                    var promises = [
                        widgetTrans1Id ? widgetTransactionSvc.updateMultiDimAggregate(widgetData[0]) : widgetTransactionSvc.createMultiDimAggregare(widgetData[0]),
                        widgetTrans2Id ? widgetTransactionSvc.updateMultiDimAggregate(widgetData[1]) : widgetTransactionSvc.createMultiDimAggregare(widgetData[1]),
                        widgetTrans3Id ? widgetTransactionSvc.updateMultiDimAggregate(widgetData[2]) : widgetTransactionSvc.createMultiDimAggregare(widgetData[2])
                    ];
                    //Pubnub PUSH
                    var msg = {};
                    msg.type = "form_submited_show_widget_count";
                    msg.form_id = widgetData[0].form_id;
                    msg.widget_id = widgetData[0].widget_id;
                    this.objCollection.pubnubWrapper.push(widgetData[0].organization_id,msg);
                    ///////////////////////////////
                    return Promise.all(promises);
                })
    }

}

module.exports = MultiDimensionalAggrWidget;