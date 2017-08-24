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
    }

    getWidgets() {
        return new Promise((resolve, reject) => {
            widgetRuleSvc.getByForm(this.id)
            .then((rules) => {
                resolve(rules.map((rule) => widgets.get(rule.widget_type_id, {rule, form: this})));
            })
            .catch(reject);
        })
    }
}
module.exports = FormBase;