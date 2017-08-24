const WidgetBase = require('./base');
const CONST = require('../../constants');


class MultiDimensionalAggrWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.MULTI_DIMENSIONAL_AGGR;
    }

    crunchDataAndSave(data) {
        var totalSum;
        this.form.normalizeData(data.formDataJson)
        .then((normalizedFormData) => {
            const entity1Data = normalizedFormData[this.rule.widget_entity2_id];
            const entity2Data = normalizedFormData[this.rule.widget_entity3_id];
            const startDateTime = convertUTCTimeToRuleTimeZone(normalizedFormData['startDateTime']);
            const endDateTime = convertUTCTimeToRuleTimeZone(normalizedFormData['endDateTime']);
            const formSubmissionDate = null;
            
            var promises = [
                this.getSumAggrByDateForAnEntity(entity1Data, formSubmissionDate),
                this.getSumAggrByDateForAnEntity(entity2Data, formSubmissionDate) 
            ];

            return Promise.all(promises);
            
        })
    }

}

module.exports = MultiDimensionalAggrWidget;