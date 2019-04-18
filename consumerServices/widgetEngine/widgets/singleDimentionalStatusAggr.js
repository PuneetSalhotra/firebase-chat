/**
 * author: SBK
 */
const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ = require('lodash');
var forEachAsync = require('forEachAsync').forEachAsync;


class SingleDimensionalStatusAggrWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.SINGLE_DIMENSIONAL_STATUS_AGGR;
    }

    aggregateAndSaveTransaction(formSubmissionDate, data) {
        console.log(' data.source_id :: ' + data.source_id);

        if (data.source_id === 2 || data.source_id === 3) {

            let activityQueryData = {
                start: formSubmissionDate.startDate,
                end: formSubmissionDate.endDate,
                form_id: this.form.id,
                widget_access_level_id: this.rule.widget_access_level_id,
                asset_type_id: 0,
                widget_id: this.rule.widget_id,
                date: formSubmissionDate.valueInRuleTimeZone
            };

            activityQueryData = _.merge(activityQueryData, data);
            var array = [];
            var array2 = [];

            if (data.source_id == 2) {

                let activityQueryData = {
                    entity_id: this.rule.widget_entity2_id
                };
                activityQueryData = _.merge(activityQueryData, data);


                this.services.activityListService.wait(10000).then(() => {
                    console.log(' WAIT :: ', this.rule.widget_id);

                    this.services.activityFormTransactionAnalytics.getWorkflowActivityId(data)
                        .then((worlflowData) => {

                            console.log(' worlflowData Length :: ' + worlflowData.length);
                            console.log(' worlflowData :: ' + worlflowData[0].activity_id);

                        if(this.rule.widget_entity2_id > 0){

                            this.services.activityFormTransactionAnalytics.getFieldLatest(activityQueryData)
                                .then((fieldData) => {
                                    if (fieldData.length > 0) {
                                        let transactionValue = 0;

                                        if (fieldData[0].data_type_id == 5)
                                            transactionValue = fieldData[0] ? fieldData[0].data_entity_bigint_1 : undefined;
                                        else if (fieldData[0].data_type_id == 6)
                                            transactionValue = fieldData[0] ? fieldData[0].data_entity_double_1 : undefined;

                                        console.log(' transactionValue :: ' + transactionValue);
                                        let intermediateData = {
                                            widget_id: this.rule.widget_id,
                                            field_id: this.rule.widget_entity2_id,
                                            field_value: transactionValue,
                                            // activity_id: worlflowData[0].activity_id
                                        };
                                        data['workflow_activity_id'] = worlflowData[0].activity_id;


                                        intermediateData = _.merge(intermediateData, data);

                                        this.services.activityListService.insertUpdate(intermediateData)
                                            .then((statuses) => {

                                            });
                                    } else {
                                        global.logger.write('debug', 'NO DATA FOR : ' + this.rule.widget_id + ' Done', {}, data);
                                    }
                                })
                            }else{
                                    let transactionValue = -1;
                                    console.log('Field Id :: ', this.rule.widget_entity2_id);
                                    console.log(' transactionValue :: ', transactionValue);
                                    let intermediateData = {
                                        widget_id: this.rule.widget_id,
                                        field_id: this.rule.widget_entity2_id,
                                        field_value: transactionValue,
                                        // activity_id: worlflowData[0].activity_id
                                    };
                                    data['workflow_activity_id'] = worlflowData[0].activity_id;

                                    intermediateData = _.merge(intermediateData, data);

                                    this.services.activityListService.insertUpdate(intermediateData)
                                        .then((statuses) => {

                                        });
                            }
                        })

                });
                // })
            } // end of data_source_id == 2

        }
    }


    createOrUpdateWidgetTransaction(widgetData, msg, organizationId) {
        const widgetTransactionSvc = this.services.widgetTransaction;
        return widgetTransactionSvc.getWidgetByStatusPeriodFlag(widgetData)
            .then((result) => {
                const widgetTransId = result[0] ? result[0].idWidgetTransaction : undefined;
                widgetData.widget_transaction_id = widgetTransId;
                console.log("***singleDimensionalStatusAggr*** NEW COUNT: " + widgetData.count + "; " + "EXISTING COUNT: " + result[0].valueInteger + ": widgetTransId :" + widgetTransId);
                if (widgetData.count != result[0].valueInteger) {
                    if (widgetTransId > 0) {
                        //Pubnub PUSH
                        this.objCollection.pubnubWrapper.push(organizationId, msg);
                        return widgetTransactionSvc.updateFileStatusDistribution(widgetData);
                    } else {
                        //Pubnub PUSH
                        this.objCollection.pubnubWrapper.push(organizationId, msg);
                        return widgetTransactionSvc.createFileStatusDistribution(widgetData);
                    }
                }
            })
    }
}

module.exports = SingleDimensionalStatusAggrWidget;