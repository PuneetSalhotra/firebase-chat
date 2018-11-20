const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ = require('lodash');
var forEachAsync = require('forEachAsync').forEachAsync;


class FormFileStatusDistributionWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.FORM_FILE_STATUS_DISTRIBUTION;
    }
    
    aggregateAndSaveTransaction(formSubmissionDate, data) {
    	
    	console.log(formSubmissionDate.startDate+','+data);
        let activityQueryData = {
                start: formSubmissionDate.startDate,
                end: formSubmissionDate.endDate,
                form_id: this.form.id,
                widget_access_level_id: this.rule.widget_access_level_id,
                asset_type_id: 0
            };
    		
            activityQueryData = _.merge(activityQueryData, data);
    	
    	this.services.activityListService.getStatusCounts(activityQueryData).then((result)=>{
    		
    		forEachAsync(result, (next, rowData)=>{  
	    		console.log(result);
	    		const count = rowData ? rowData.status_count: undefined;
	    		let widgetData = {
	                    date: formSubmissionDate.valueInRuleTimeZone,
	                    count: count,
	                    widget_id: this.rule.widget_id,
	                    period_flag: this.getPeriodFlag(),
	                    widget_access_level_id: this.rule.widget_access_level_id,
	                    activity_status_id: rowData.activity_status_id,
	                    activity_status_name: rowData.activity_status_name
	                };
	                console.log("CALCULATED FORM COUNT "+count);
	                widgetData = _.merge(widgetData, data);  
	                
	                var msg = {};
	                msg.type = "file_status_show_widget_count";
	                msg.form_id = data.form_id;
	                msg.widget_id = widgetData.widget_id;
	                
	                if(count > 0) {
	                  return this.createOrUpdateWidgetTransaction(widgetData,msg,data.organization_id).then(()=>{
	                	  next();
	                  })
	                }else{
	                	next();
	                }
    		});
    	});
    	
    }
        createOrUpdateWidgetTransaction(widgetData,msg,organizationId) {
            const widgetTransactionSvc = this.services.widgetTransaction;
            return widgetTransactionSvc.getWidgetByStatusPeriodFlag(widgetData)
            .then((result) => {
                const widgetTransId = result[0] ? result[0].idWidgetTransaction : undefined;
                widgetData.widget_transaction_id = widgetTransId;
                console.log("NEW COUNT: "+widgetData.count+"; "+"EXISTING COUNT: "+result[0].valueInteger)
                if(widgetData.count != result[0].valueInteger){
                    if(widgetTransId > 0) {
                        //Pubnub PUSH
                        this.objCollection.pubnubWrapper.push(organizationId,msg);
                        return widgetTransactionSvc.updateFileStatusDistribution(widgetData);
                    } else {
                        //Pubnub PUSH
                        this.objCollection.pubnubWrapper.push(organizationId,msg);
                        return widgetTransactionSvc.createFileStatusDistribution(widgetData);
                    }
                }             
            }) 
        }
    	//get the widget transaction id 
    	//get the status wise counts of a form within a date range
    
};
module.exports = FormFileStatusDistributionWidget;