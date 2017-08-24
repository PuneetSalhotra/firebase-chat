const WidgetBase = require('./base');
const CONST = require('../../constants');

class FrequencyDistributionWidget extends WidgetBase {
    constructor(args) {
        super(args);
        this.id = CONST.WIDGET_TYPE_IDS.FREQUENCY_DISTRIBUTION;
    }

    crunchDataAndSave(data) {
        var totalSum;
        this.form.normalizeData(data.formDataJson)
        .then((normalizedFormData) => {
            const startDateTime = convertUTCTimeToRuleTimeZone(normalizedFormData['startDateTime']);
            const endDateTime = convertUTCTimeToRuleTimeZone(normalizedFormData['endDateTime']);
            const formSubmissionMonth = null;

            return this.getSumAggrByDateForAnEntity(formSubmissionMonth),          
        })
    }

}

module.exports = FrequencyDistributionWidget;