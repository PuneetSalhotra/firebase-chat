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
        console.log(' data.source_id :: '+data.source_id);
        
        if(data.source_id === 2 || data.source_id === 3){

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
        const widgetTransactionSvc1 = this.services.widgetTransaction;
        widgetTransactionSvc1.getWidgetTxnsOfAWidget(activityQueryData).then((txns) => {
            console.log('txns :: '+txns);
            forEachAsync(txns, (next, row) => {
                array.push(row.widget_axis_x_index);
                next();
            }).then(() => {
                let activityQueryData = {            
                    entity_id: this.rule.widget_entity2_id
                };
                activityQueryData = _.merge(activityQueryData, data);


                this.services.activityListService.wait(500);

                this.services.activityFormTransactionAnalytics.getByTransactionField(activityQueryData)
                .then((fieldData) => {

                    const transactionValue = fieldData[0] ? fieldData[0].data_entity_bigint_1 : undefined;
                    console.log(' transactionValue :: '+transactionValue);
                    let intermediateData = {      
                                widget_id: this.rule.widget_id,      
                                field_id: this.rule.widget_entity2_id,
                                field_value: transactionValue,
                         };
                    intermediateData = _.merge(intermediateData, data);
                
                    this.services.activityListService.insertUpdate(intermediateData)
                      .then((statuses) => {
                        forEachAsync(statuses, (next2, rowData2) => {
                            array2.push(rowData2.activity_status_id);
                            next2();
                        }).then(() => {
                            var diffArray = [];
                            forEachAsync(array, (n, x) => {
                            global.logger.write('debug', 'Distribution: WidgetId : ' + this.rule.widget_id + " : " + x + " includes" + array2.includes(x), {}, data);
                            if (array2.includes(x) == false) {
                                diffArray.push(x);
                                var obj = {};
                                obj.aggr_value = 0;
                                obj.activity_status_id = x;
                                obj.activity_status_name = '';
                                statuses.push(obj);
                                n();
                            } else {
                                n();
                            }

                        }).then(() => {
                            //global.logger.write('debug', 'Distribution: WidgetId : ' + this.rule.widget_id + " StatusJsonData: " + JSON.stringify(result), {}, data);
                            forEachAsync(statuses, (next, rowData) => {
                                console.log(rowData)
                                const aggr_value = rowData ? rowData.aggr_value : 0;
                                let widgetData = {
                                    date: formSubmissionDate.valueInRuleTimeZone,
                                    count: aggr_value,
                                    widget_id: this.rule.widget_id,
                                    period_flag: this.getPeriodFlag(),
                                    widget_access_level_id: this.rule.widget_access_level_id,
                                    activity_status_id: rowData.activity_status_id,
                                    activity_status_name: rowData.activity_status_name
                                };
                                //array2.push(rowData.activity_status_id);

                                //console.log("Distribution: WidgetId: " + this.rule.widget_id + " : StatusId: " + rowData.activity_status_id + " : StatusName: " + rowData.activity_status_name + " : " + aggr_value);

                                widgetData = _.merge(widgetData, data);

                                var msg = {};
                                msg.type = "file_status_show_widget_count";
                                msg.form_id = data.form_id;
                                msg.widget_id = widgetData.widget_id;

                                console.log(' aggr_value '+aggr_value);

                                if (aggr_value >= 0) {
                                    return this.createOrUpdateWidgetTransaction(widgetData, msg, data.organization_id).then(() => {
                                        next();
                                    })
                                } else {
                                    next();
                                }
                            }).then(() => {

                                global.logger.write('debug', 'Distribution: WidgetId : ' + this.rule.widget_id + ' Done', {}, data);
                            });

                        })
                    });  

                })
})
})
})
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