const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ = require('lodash');



class FormFileStatusDurationWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.FORM_FILE_STATUS_DISTRIBUTION;
    }

    aggregateAndSaveTransaction(formSubmissionDate, data) {

        let activityQueryData = {
            start: formSubmissionDate.startDate,
            end: formSubmissionDate.endDate,
            form_id: this.form.id,
            widget_access_level_id: this.rule.widget_access_level_id,
            from_status_id: this.rule.widget_entity2_id,
            flag: 0,
            asset_type_id: 0
        };

        activityQueryData = _.merge(activityQueryData, data);

        this.services.activityStatusChangeTxnService.activityStatusChangeTxnSelectAverage(activityQueryData).then((result) => {
            console.log(result);
            const aggregate = result ? result[0].average_duration : undefined;
            let widgetData = {
                date: formSubmissionDate.valueInRuleTimeZone,
                aggregate: aggregate,
                widget_id: this.rule.widget_id,
                period_flag: this.getPeriodFlag(),
                widget_access_level_id: this.rule.widget_access_level_id,
                from_status_id: this.rule.widget_entity2_id
            };

            console.log("CALCULATED STATUS DURATION AGGREGATE : " + aggregate);
            widgetData = _.merge(widgetData, data);

            var msg = {};
            msg.type = "file_status_show_widget_aggregate";
            msg.form_id = data.form_id;
            msg.widget_id = widgetData.widget_id;

            if (aggregate > 0) {

                return this.createOrUpdateWidgetTransaction(widgetData, msg, data.organization_id).then(() => {

                });
            }
        });
    }

    createOrUpdateWidgetTransaction(widgetData, msg, organizationId) {
        const widgetTransactionSvc = this.services.widgetTransaction;
        return widgetTransactionSvc.getWidgetByStatusPeriodAggrFlag(widgetData)
            .then((result) => {
                const widgetTransId = result[0] ? result[0].idWidgetTransaction : undefined;
                widgetData.widget_transaction_id = widgetTransId;
                console.log("NEW AGGR: " + widgetData.aggregate + "; " + "EXISTING AGGR: " + result[0].valueDecimal)
                if (widgetData.aggregate != result[0].valueDecimal) {
                    if (widgetTransId > 0) {
                        //Pubnub PUSH
                        // this.objCollection.pubnubWrapper.push(organizationId, msg);
                        return widgetTransactionSvc.updateFileStatusDuration(widgetData);
                    } else {
                        //Pubnub PUSH
                        // this.objCollection.pubnubWrapper.push(organizationId, msg);
                        return widgetTransactionSvc.createFileStatusDuration(widgetData);
                    }
                }
            })
    }


};
module.exports = FormFileStatusDurationWidget;