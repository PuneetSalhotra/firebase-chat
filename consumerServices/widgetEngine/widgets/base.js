/**
 * author: SBK.
 */
const _ = require('lodash');
const activityFormTransactionSvc = new (require('../services/activityFormTransactionService'))();
const widgetTransactionSvc = new (require('../services/widgetTransactionService'))();

class WidgetBase {
    constructor(args) {
        this.objCollection = args.objCollection;
        this.rule = args.rule;
        this.args = args;
        this.form = args.form;
    }

    convertUTCTimeToRuleTimeZone(time) {

    }

    getSumAggrByDateForAnEntity(entityData, formSubmissionDate) {
        return activityFormTransactionSvc.getSumByDay({})
        .then((totalSum) => {
            widgetData = {
                date: formSubmissionDate,
                sum: totalSum
            };
            return this.createOrUpdateWidgetTransaction('date', widgetData);
        });
    }

    getCountAggregateByMonth(formSubmissionMonth) {
        return activityFormTransactionSvc.getCountByMonth({})
        .then((totalSum) => {
            widgetData = {
                date: formSubmissionDate,
                count: count
            };
            return this.createOrUpdateWidgetTransaction('date', widgetData);
        });
    }

    createOrUpdateWidgetTransaction(lookupField, data) {
        return widgetTransactionSvc.getByDay()
        .then((widgetId) => {
            if(widgetId) return widgetTransactionSvc.update();
            else return widgetTransactionSvc.create();
        }) 
    }

    crunchDataAndSave(data) {

    }

}
module.exports = WidgetBase;