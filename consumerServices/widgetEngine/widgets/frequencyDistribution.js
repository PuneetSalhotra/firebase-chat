/**
 * author: SBK
 */
const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ = require('lodash');

class FrequencyDistributionWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.FREQUENCY_DISTRIBUTION;
    }
    aggregateAndSaveTransaction(formSubmissionDate, data) {
        let activityQueryData = {
            start: formSubmissionDate.startDate,
            end: formSubmissionDate.endDate,
            form_id: this.form.id,
            widget_access_level_id: this.rule.widget_access_level_id,
            asset_type_id: 0
        };

        activityQueryData = _.merge(activityQueryData, data);
        this.services.activityFormTransactionAnalytics.getCountForMonth(activityQueryData)
            .then((result) => {
                const count = result[0] ? result[0].form_count : undefined;
                let widgetData = {
                    date: formSubmissionDate.valueInRuleTimeZone,
                    count: count,
                    widget_id: this.rule.widget_id,
                    period_flag: this.getPeriodFlag(),
                    widget_access_level_id: this.rule.widget_access_level_id
                };
                console.log("CALCULATED FORM COUNT " + count);
                widgetData = _.merge(widgetData, data);
                //return count > 0 ? this.createOrUpdateWidgetTransaction(widgetData) : false;
                var msg = {};
                msg.type = "form_submited_show_widget_count";
                msg.form_id = data.form_id;
                msg.widget_id = widgetData.widget_id;

                if (count > 0) {
                    return this.createOrUpdateWidgetTransaction(widgetData, msg, data.organization_id)
                } else {
                    //Pubnub PUSH
                    // this.objCollection.pubnubWrapper.push(data.organization_id, msg);
                    return false;
                }
            });
    }

    createOrUpdateWidgetTransaction(widgetData, msg, organizationId) {
        const widgetTransactionSvc = this.services.widgetTransaction;
        return widgetTransactionSvc.getByPeriodFlag(widgetData)
            .then((result) => {
                const widgetTransId = result[0] ? result[0].idWidgetTransaction : undefined;
                widgetData.widget_transaction_id = widgetTransId;
                console.log("NEW COUNT: " + widgetData.count + "; " + "EXISTING COUNT: " + result[0].valueInteger)
                if (widgetData.count != result[0].valueInteger) {
                    if (widgetTransId > 0) {
                        //Pubnub PUSH
                        // this.objCollection.pubnubWrapper.push(organizationId, msg);
                        return widgetTransactionSvc.updateFrequencyDistribution(widgetData);
                    } else {
                        //Pubnub PUSH
                        // this.objCollection.pubnubWrapper.push(organizationId, msg);
                        return widgetTransactionSvc.createFrequencyDistribution(widgetData);
                    }
                }
            })
    }

}

module.exports = FrequencyDistributionWidget;