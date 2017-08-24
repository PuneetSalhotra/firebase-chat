const WidgetBase = require('./base');
const CONST = require('../../constants');
const _ =require('lodash');

class SingleDimensionalAggrWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.SINGLE_DIMENSIONAL_AGGR;
    }

    crunchDataAndSave(data) {
        var totalSum;
        this.form.normalizeData(data.formDataJson)
        .then((normalizedFormData) => {
            const entityData = normalizedFormData[this.rule.widget_entity2_id];
            const startDateTime = convertUTCTimeToRuleTimeZone(normalizedFormData['startDateTime']);
            const endDateTime = convertUTCTimeToRuleTimeZone(normalizedFormData['endDateTime']);
            const formSubmissionDate = null;
            return this.getSumAggrByDateForAnEntity(entityData, formSubmissionDate);
        })
    }
}

module.exports = SingleDimensionalAggrWidget;