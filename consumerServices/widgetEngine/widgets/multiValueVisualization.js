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
        console.log('In multi visualization')
        let choice;
        let activityQueryData = {
            form_id: this.form.id,
            entity_id: this.rule.widget_entity2_id
        };
        activityQueryData = _.merge(activityQueryData, data);
        this.services.activityFormTransactionAnalytics.getByTransactionField(activityQueryData)
        .then((result) => {
        choice = result[0] ? result[0].data_entity_text_1 : undefined;
        switch(this.rule.widget_aggregate_id) {
            case 1:
                return this.getMultiValueAggregateCount(formSubmissionDate,data, choice);
            break;
            default:
                return this.getMultiValueAggregate(formSubmissionDate,data, choice);
            break;
        }
    });
    }
    
    getMultiValueAggregate(formSubmissionDate, data, choice){
         
        let activityQueryData = {
            form_id: this.form.id,
            entity_id: this.rule.widget_entity2_id,
            choice: choice,
            start: formSubmissionDate.startDate,
            end: formSubmissionDate.endDate,
            widget_access_level_id: this.rule.widget_access_level_id
        };
        activityQueryData = _.merge(activityQueryData, data);
        this.services.activityFormTransactionAnalytics.getFormTransactionsByChoice(activityQueryData)
        .then((rows) => {
            var promises = [];
            rows.forEach((row) => promises.push(this.services.activityFormTransactionAnalytics.getByTransactionField({
				organization_id: data.organization_id,
                form_id: this.form.id,
                entity_id: this.rule.widget_entity3_id,
                form_transaction_id: row.form_transaction_id
            })));
            return Promise.all(promises);
        })
        .then((results) => {
            console.log('RESULTS in multivaluevisualization :', results)
            if(results.length > 0) {
                const field = this.getChoiceSumField();
                const aggr_value = results.map((res) =>  res[0][field]).filter((val) => !_.isUndefined(val)).reduce((a, b) => { 
			
			switch(this.rule.widget_aggregate_id){
				case 2: return a + b; break;
				case 3: return (a + b)/2; break;
				case 4: return a < b ? a : b; break;
				case 5: return a > b ? a : b; break;
				default : return 0; break;
			}
		});
            let widgetData = {
                date: formSubmissionDate.valueInRuleTimeZone,
                choice: choice,
                aggr_value: aggr_value,
                widget_id: this.rule.widget_id,
                period_flag: this.getPeriodFlag(),
		widget_access_level_id: this.rule.widget_access_level_id
            };
            widgetData = _.merge(widgetData, data);
            return this.createOrUpdateWidgetTransaction(widgetData);
            } else {
                let widgetData = {
                date: formSubmissionDate.valueInRuleTimeZone,
                choice: choice,
                aggr_value: 0,
                widget_id: this.rule.widget_id,
                period_flag: this.getPeriodFlag(),
		widget_access_level_id: this.rule.widget_access_level_id
            };
            widgetData = _.merge(widgetData, data);
            return this.createOrUpdateWidgetTransaction(widgetData);
            }
        })
         .catch((err)=>{
             console.log('Error in multiValueVisualization :', err);
             return reject(err);
         })
    }
    
    getMultiValueAggregateCount(formSubmissionDate, data, choice){

        let activityQueryData = {
            form_id: this.form.id,
            entity_id: this.rule.widget_entity2_id,
            choice: choice,
            start: formSubmissionDate.startDate,
            end: formSubmissionDate.endDate,
            widget_access_level_id: this.rule.widget_access_level_id
        };
        activityQueryData = _.merge(activityQueryData, data);
        this.services.activityFormTransactionAnalytics.getCountByTransactionFieldChoice(activityQueryData)
       .then((result) => {
            const choice_count = result[0] ? result[0].choice_count: undefined;    
            let widgetData = {
                date: formSubmissionDate.valueInRuleTimeZone,
                choice: choice,
                aggr_value: choice_count,
                widget_id: this.rule.widget_id,
                period_flag: this.getPeriodFlag(),
                widget_access_level_id: this.rule.widget_access_level_id
            };
            widgetData = _.merge(widgetData, data);
            return this.createOrUpdateWidgetTransaction(widgetData);
        })
    }

    createOrUpdateWidgetTransaction(widgetData) {
        const widgetTransactionSvc = this.services.widgetTransaction;
        return widgetTransactionSvc.getByChoice(widgetData)
        .then((result) => {
            const widgetTransId = result[0] ? result[0].idWidgetTransaction : undefined;
            widgetData.widget_transaction_id = widgetTransId;
            if(widgetTransId) {
                //Pubnub PUSH
                    var msg = {};
                    msg.type = "form_submited_show_widget_count";
                    msg.form_id = widgetData[0].form_id;
                    msg.widget_id = widgetData[0].widget_id;
                    this.objCollection.pubnubWrapper.push(widgetData[0].organization_id,msg);
                    ///////////////////////////////
                return widgetTransactionSvc.updateMultiValueVisualization(widgetData);
            } else {
                //Pubnub PUSH
                    var msg = {};
                    msg.type = "form_submited_show_widget_count";
                    msg.form_id = widgetData[0].form_id;
                    msg.widget_id = widgetData[0].widget_id;
                    this.objCollection.pubnubWrapper.push(widgetData[0].organization_id,msg);
                    ///////////////////////////////
                return widgetTransactionSvc.createMultiValueVisualization(widgetData);
            }
            
        }) ;
    }

}

module.exports = MultiDimensionalAggrWidget;