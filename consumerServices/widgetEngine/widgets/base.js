/**
 * author: SBK.
 */
const _ = require('lodash');
const moment = require('moment');

const ActivityFormTransactionAnalyticsSvc = require('../services/activityFormTransactionAnalyticsService');
const WidgetTransactionSvc = require('../services/widgetTransactionService');

class WidgetBase {
    constructor(args) {
        this.objCollection = args.objCollection;
        this.rule = args.rule;
        this.args = args;
        this.form = args.form;
        this.services = {
            activityFormTransactionAnalytics: new ActivityFormTransactionAnalyticsSvc(args),
            widgetTransaction: new WidgetTransactionSvc(args)

        }
    }

    convertUTCTimeToRuleTimeZone(time) {
        var ruleTime =  moment.utc(time).utcOffset(this.rule.widget_timezone_offset / (60 * 1000));
        return {
            startOfDayInUTC: moment(ruleTime).startOf('day').utc().format("YYYY-MM-DD HH:mm:ss"), 
            endOfDayInUTC: moment(ruleTime).endOf('day').utc().format("YYYY-MM-DD HH:mm:ss"),
            startOfMonthInUTC: moment(ruleTime).startOf('month').utc().format("YYYY-MM-DD HH:mm:ss"), 
            endOfMonthInUTC: moment(ruleTime).endOf('month').utc().format("YYYY-MM-DD HH:mm:ss"),
            valueInRuleTimeZone: moment(ruleTime).format("YYYY-MM-DD HH:mm:ss")
        };
    }

    getPeriodFlag() {
        if([1,2,3].indexOf(this.rule.widget_timeline_id) !== -1) return 0;
        else if([4,5,6].indexOf(this.rule.widget_timeline_id) !== -1) return 1;
        else if([7,8].indexOf(this.rule.widget_timeline_id) !== -1) return 2;
        return -1;
    }

    crunchDataAndSave(data) {
        const formSubmissionDate = this.convertUTCTimeToRuleTimeZone(data.track_gps_datetime);
        return this.aggregateAndSaveTransaction(formSubmissionDate, data);
    }

}
module.exports = WidgetBase;