/**
 * author: SBK.
 */
const _ = require('lodash');
const moment = require('moment');

const ActivityFormTransactionSvc = require('../services/activityFormTransactionService');
const WidgetTransactionSvc = require('../services/widgetTransactionService');

class WidgetBase {
    constructor(args) {
        this.objCollection = args.objCollection;
        this.rule = args.rule;
        this.args = args;
        this.form = args.form;
        this.services = {
            activityFormTransaction: new ActivityFormTransactionSvc(args),
            widgetTransaction: new WidgetTransactionSvc(args)

        }
    }

    convertUTCTimeToRuleTimeZone(time) {
        var ruleTime =  moment.utc(time).utcOffset(this.rule.widget_timezone_offset / (60 * 1000));
        return {
            startOfDay: moment(ruleTime).startOf('day').format("YYYY-MM-DD HH:mm:ss"), //TODOOOOOOOOO Correct to reflect timezone
            endOfDay: moment(ruleTime).endOf('day').format("YYYY-MM-DD HH:mm:ss"),
            startOfMonth: moment(ruleTime).startOf('month').format("YYYY-MM-DD HH:mm:ss"), //TODOOOOOOOOO Correct to reflect timezone
            endOfMonth: moment(ruleTime).endOf('month').format("YYYY-MM-DD HH:mm:ss"),
            value: moment(ruleTime).format("YYYY-MM-DD HH:mm:ss")
        };
    }

    getPeriodFlag() {
        if([1,2,3].indexOf(this.rule.widget_timeline_id) !== -1) return 0;
        else if([4,5,6].indexOf(this.rule.widget_timeline_id) !== -1) return 1;
        else if([7,8].indexOf(this.rule.widget_timeline_id) !== -1) return 2;
        return -1;
    }

    crunchDataAndSave(data) {
        this.form.normalizeData(data.formData)
        .then((normalizedFormData) => {
            data.normalizedFormData = normalizedFormData;
            const formSubmissionDate = this.convertUTCTimeToRuleTimeZone(data.payload.track_gps_datetime);
            return this.aggregateAndSaveTransaction(formSubmissionDate, data);
        });
    }

}
module.exports = WidgetBase;