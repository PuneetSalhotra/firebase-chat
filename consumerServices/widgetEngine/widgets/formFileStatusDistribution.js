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
                asset_type_id: 0,
                widget_id: this.rule.widget_id,             
                date: formSubmissionDate.valueInRuleTimeZone
            };
    		
            activityQueryData = _.merge(activityQueryData, data);
            var array = [];
            var array2 = [];
            const widgetTransactionSvc1 = this.services.widgetTransaction;
            widgetTransactionSvc1.getWidgetTxnsOfAWidget(activityQueryData).then((txns)=>{
            	
            	// widget_transaction_id, widget_axis_x_index, widget_axis_x_value_varchar,widget_axis_y_value_integer
            	forEachAsync(txns, (next, row)=>{
            		/*var statuses = {};
                	statuses.status_count = row.widget_axis_y_value_integer;
                	statuses.activity_status_id = row.widget_axis_x_index;
                	statuses.activity_status_name = row.widget_axis_x_value_varchar;*/
                	array.push(row.widget_axis_x_index);
                	next();
            	});
            });
    	
            this.services.activityListService.getStatusCounts(activityQueryData).then((result)=>{
            	var myArr = [];
            	forEachAsync(result, (next2, rowData2)=>{
            		array2.push(rowData2.activity_status_id);
            		next2();
            	}).then(()=>{
            		var diffArray = [];
            		forEachAsync(array, (n, x)=>{ 
	    				console.log("EXISTS :: "+JSON.stringify(array2).indexOf(x));
	    				if(JSON.stringify(array2).indexOf(x) == -1){
	    					diffArray.push(x);
	    					var obj = {};
	    					obj.status_count = 0;
	    					obj.activity_status_id = x
	    					obj.activity_status_name = '';
	    					result.push(obj);
	    					n();
	    				}else{
	    					n();
	    				}
	    				
	    			}).then(()=>{
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
				    			//array2.push(rowData.activity_status_id);
				    			
				                console.log("CALCULATED FORM COUNT "+count);
				                widgetData = _.merge(widgetData, data);  
				                
				                var msg = {};
				                msg.type = "file_status_show_widget_count";
				                msg.form_id = data.form_id;
				                msg.widget_id = widgetData.widget_id;
				                
				                if(count >= 0) {
				                  return this.createOrUpdateWidgetTransaction(widgetData,msg,data.organization_id).then(()=>{
				                	  next();
				                  })
				                }else{
				                	next();
				                }
			    		}).then(()=>{
			    			console.log("ACTIVITY: AFTER THE EXCECUTION SEARCHING FOR REMAINING :::"+JSON.stringify(array2));
			    			console.log("WIDGET: AFTER THE EXCECUTION SEARCHING FOR REMAINING :::"+JSON.stringify(array));

			    		});
	    			})
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
        
    
    
};
module.exports = FormFileStatusDistributionWidget;