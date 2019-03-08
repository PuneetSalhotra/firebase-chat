/**
 * author: SBK.
 */
const _ = require('lodash');
const moment = require('moment');
const ActivityFormTransactionAnalyticsSvc = require('../services/activityFormTransactionAnalyticsService');
const ActivityListSvc = require('../services/activityListService');
const WidgetTransactionSvc = require('../services/widgetTransactionService');
const ActivityStatusChangeTxnService = require('../services/activityStatusChangeTxnService');
class WidgetBase {
    constructor(args) {
        this.objCollection = args.objCollection;
        this.rule = args.rule;
        this.args = args;
        this.form = args.form;
        this.services = {
            activityFormTransactionAnalytics: new ActivityFormTransactionAnalyticsSvc(args),
            widgetTransaction: new WidgetTransactionSvc(args),
            activityListService: new ActivityListSvc(args),
            activityStatusChangeTxnService: new ActivityStatusChangeTxnService(args)
        }
    }

    convertUTCTimeToRuleTimeZone(time) {
        var ruleTime = moment.utc(time).utcOffset(this.rule.widget_timezone_offset / (60 * 1000));
        return {
            startOfDayInUTC: moment(ruleTime).startOf('day').utc().format("YYYY-MM-DD HH:mm:ss"),
            endOfDayInUTC: moment(ruleTime).endOf('day').utc().format("YYYY-MM-DD HH:mm:ss"),
            startOfMonthInUTC: moment(ruleTime).startOf('month').utc().format("YYYY-MM-DD HH:mm:ss"),
            endOfMonthInUTC: moment(ruleTime).endOf('month').utc().format("YYYY-MM-DD HH:mm:ss"),
            valueInRuleTimeZone: moment(ruleTime).format("YYYY-MM-DD HH:mm:ss")
        };
    }

    getPeriodFlag() {
        if ([0,1, 2].indexOf(this.rule.widget_timeline_id) !== -1)
            return 0;
        else if ([3].indexOf(this.rule.widget_timeline_id) !== -1)
            return 1;
        else if ([4].indexOf(this.rule.widget_timeline_id) !== -1)
            return 2;
        return -1;
    }

    convertUTCTimeToRuleTimeZoneByTimeline(time) {
        var ruleTime = moment.utc(time).utcOffset(this.rule.widget_timezone_offset / (60 * 1000));
        if ([0, 1, 2].indexOf(this.rule.widget_timeline_id) !== -1) {
            let startEnd = {
                startDate: moment(ruleTime).startOf('day').utc().format("YYYY-MM-DD HH:mm:ss"),
                endDate: moment(ruleTime).endOf('day').utc().format("YYYY-MM-DD HH:mm:ss"),
                valueInRuleTimeZone: moment(ruleTime).format("YYYY-MM-DD HH:mm:ss")
            };
            return startEnd;
        } else if ([3].indexOf(this.rule.widget_timeline_id) !== -1) {
            let startEnd = {
                startDate: moment(ruleTime).startOf('month').utc().format("YYYY-MM-DD HH:mm:ss"),
                endDate: moment(ruleTime).endOf('month').utc().format("YYYY-MM-DD HH:mm:ss"),
                valueInRuleTimeZone: moment(ruleTime).format("YYYY-MM-DD HH:mm:ss")
            };
            return startEnd;
        } else if ([4].indexOf(this.rule.widget_timeline_id) !== -1) {
            let startEnd = {
                startDate: moment(ruleTime).startOf('year').utc().format("YYYY-MM-DD HH:mm:ss"),
                endDate: moment(ruleTime).endOf('year').utc().format("YYYY-MM-DD HH:mm:ss"),
                valueInRuleTimeZone: moment(ruleTime).format("YYYY-MM-DD HH:mm:ss")
            };
            return startEnd;
        }
        return -1;
    }

    crunchDataAndSave(data) {
        const formSubmissionDate = this.convertUTCTimeToRuleTimeZoneByTimeline(data.track_gps_datetime);
        return this.aggregateAndSaveTransaction(formSubmissionDate, data);
    }
}
module.exports = WidgetBase;