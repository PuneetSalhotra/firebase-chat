/**
 * author: SBK.
 */
const _ = require('lodash');
const widgetRuleSvc = new (require('../services/widgetRuleService'))();
const widgets = require('../widgets');

class FormBase {
    constructor(args) {
        this.objCollection = args.objCollection;
        this.args = args;
        this.id = args.id;
    }

    getWidgets(args) {
        const self = this;
        return new Promise((resolve, reject) => {
            widgetRuleSvc.getByForm({organizationId: args.organization_id, formId: this.id}, self.objCollection)
            .then((rules) => {
                resolve(rules.map((rule) => {
                    return widgets.get(rule.widget_type_id, {rule, form: self, objCollection: self.objCollection});
                }));
            })
            .catch(reject);
        })
    }

    normalizeData(data) {
        return new Promise((resolve, reject) => {
            const normalizedData = {};
            data.forEach(function(data){
                const fieldIdKey = data.field_id;
                normalizedData[fieldIdKey] = data;
            });
            resolve(normalizedData);
        });
    }
}
module.exports = FormBase;