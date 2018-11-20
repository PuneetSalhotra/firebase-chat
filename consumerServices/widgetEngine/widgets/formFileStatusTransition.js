const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ = require('lodash');



class FormFileStatusTransitionWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.FROM_FILE_STATUS_TRANSITION;
    }
    
    aggregateAndSaveTransaction(formSubmissionDate, data) {
    	
        let activityQueryData = {
                start: formSubmissionDate.startDate,
                end: formSubmissionDate.endDate,
                form_id: this.form.id,
                widget_access_level_id: this.rule.widget_access_level_id,
                from_status_id:this.rule.widget_entity2_id,
                flag:0,
                asset_type_id: 0
            };
    		
            activityQueryData = _.merge(activityQueryData, data);
            
            this.services.activityStatusChangeTxnService.activityStatusChangeTxnSelectAggrDt(activityQueryData).then((min_result)=>{
            	
            	var min_datetime = this.objCollection.util.replaceDefaultDatetime(min_result[0].min_from_status_datetime);
            	
            	activityQueryData.flag = 1;
            	activityQueryData.to_status_id = this.rule.widget_entity3_id;
            	
            	this.services.activityStatusChangeTxnService.activityStatusChangeTxnSelectAggrDt(activityQueryData).then((max_result)=>{  
            		
            		var max_datetime = this.objCollection.util.replaceDefaultDatetime(max_result[0].max_to_status_datetime);
            		
            		var aggregate = 0;
            		
            		if(max_datetime != '1970-01-01 00:00:00' && min_datetime != '1970-01-01 00:00:00')            		
            			aggregate = this.objCollection.util.differenceDatetimes(max_datetime, min_datetime)/1000;
            		
            		global.logger.write('debug', 'MAX DATETIME: '+max_datetime, {}, data);
            		global.logger.write('debug', 'MIN DATETIME: '+min_datetime, {}, data);
    	    		
            		let widgetData = {
    	                    date: formSubmissionDate.valueInRuleTimeZone,
    	                    aggregate: aggregate,
    	                    widget_id: this.rule.widget_id,
    	                    period_flag: this.getPeriodFlag(),
    	                    widget_access_level_id: this.rule.widget_access_level_id,
    	                    asset_id:data.asset_id,
    	                    workforce_id:data.workforce_id,
    	                    account_id:data.account_id,
    	                    organization_id:data.organization_id,
    	                    activity_id:data.activity_id
    	                };
    	    		
            		var msg = {};
 	                msg.type = "file_status_transition_widget_aggregate";
 	                msg.form_id = data.form_id;
 	                msg.widget_id = widgetData.widget_id;
  	                
 	                if(aggregate > 0) {
 	                	
 	                	return this.createOrUpdateWidgetTransaction(widgetData,msg,data.organization_id).then(()=>{
 	                	  
 	                  });
 	                }
            		
                })
            })
    }
    
    
    createOrUpdateWidgetTransaction(widgetData,msg,organizationId) {
        const widgetTransactionSvc = this.services.widgetTransaction;
        return widgetTransactionSvc.getByPeriodFlag(widgetData)
        .then((result) => {
            const widgetTransId = result[0] ? result[0].idWidgetTransaction : undefined;
            widgetData.widget_transaction_id = widgetTransId;
            console.log("NEW AGGR: "+widgetData.aggregate+"; "+"EXISTING AGGR: "+result[0].valueDecimal)
            if(widgetData.aggregate != result[0].valueDecimal){
                if(widgetTransId > 0) {
                    //Pubnub PUSH
                    this.objCollection.pubnubWrapper.push(organizationId,msg);
                    return widgetTransactionSvc.updateFileStatusTransition(widgetData);
                } else {
                    //Pubnub PUSH
                    this.objCollection.pubnubWrapper.push(organizationId,msg);
                    return widgetTransactionSvc.createFileStatusTransition(widgetData);
                }
            }             
        }) 
    }
};
module.exports = FormFileStatusTransitionWidget;