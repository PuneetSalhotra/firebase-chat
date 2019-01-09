const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ = require('lodash');

class FormFileDistributionWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.FORM_FILE_DISTRIBUTION;
    }
    
    aggregateAndSaveTransaction(formSubmissionDate, data) {
    	
    	console.log(formSubmissionDate.startDate+','+data);
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
            this.services.activityListService.getFileCount(activityQueryData)
            .then((result) => {
                const count = result[0] ? result[0].file_count: undefined;
                let widgetData = {
                    date: formSubmissionDate.valueInRuleTimeZone,
                    count: count,
                    widget_id: this.rule.widget_id,
                    period_flag: this.getPeriodFlag(),
    				widget_access_level_id: this.rule.widget_access_level_id
                };
                console.log("CALCULATED FILE COUNT "+count);
                widgetData = _.merge(widgetData, data);            
                //return count > 0 ? this.createOrUpdateWidgetTransaction(widgetData) : false;
                var msg = {};
                msg.type = "file_show_widget_count";
                msg.form_id = data.form_id;
                msg.widget_id = widgetData.widget_id;
                
                if(count > 0) {
                  return this.createOrUpdateWidgetTransaction(widgetData,msg,data.organization_id)
                } else {
                   //Pubnub PUSH
                   this.objCollection.pubnubWrapper.push(data.organization_id,msg);
                   return false;
                }
            });
    }
    
    createOrUpdateWidgetTransaction(widgetData,msg,organizationId) {
        const widgetTransactionSvc = this.services.widgetTransaction;
        return widgetTransactionSvc.getByPeriodFlag(widgetData)
        .then((result) => {
            const widgetTransId = result[0] ? result[0].idWidgetTransaction : undefined;
            widgetData.widget_transaction_id = widgetTransId;
            console.log("***formFileDistribution*** NEW COUNT: "+widgetData.count+"; "+"EXISTING COUNT: "+result[0].valueInteger+": widgetTransId :"+widgetTransId);
            if(widgetData.count != result[0].valueInteger){
                if(widgetTransId > 0) {
                    //Pubnub PUSH
                    this.objCollection.pubnubWrapper.push(organizationId,msg);
                    return widgetTransactionSvc.updateFileDistribution(widgetData);
                } else {
                    //Pubnub PUSH
                    this.objCollection.pubnubWrapper.push(organizationId,msg);
                    return widgetTransactionSvc.createFileDistribution(widgetData);
                }
            }             
        }) 
    }
};

module.exports = FormFileDistributionWidget;