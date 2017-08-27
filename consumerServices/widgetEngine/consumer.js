/**
 * author: SBK
 */
const ConsumerBase = require('../../server/queue/consumerBase');
const forms = require('./forms');


class WidgetEngineConsumer extends ConsumerBase {
    constructor(opts) {
        super(opts);
    }

    validateMessage(message){
        const messagePayload = (message || {}).payload;
        var formDataJson = JSON.parse((messagePayload.activity_timeline_collection || '[]'));
        return new Promise((resolve, reject) => {
            if(!formDataJson[0] || !formDataJson[0].form_id)  return reject("Invalid message for widgetEngine, Skipping message");
            return resolve({payload: message.payload, formData: formDataJson});
        });
    }

    actOnMessage(message) {
        return new Promise((resolve, reject) => {
            var formData = message.formData;
            const formInstance = forms.get(formData[0].form_id, {objCollection: this.objCollection});
            formInstance.getWidgets(message.payload)
            .then((widgets) => {
                const promises = widgets.map((widget) => widget && widget.crunchDataAndSave(message));
                return Promise.all(promises);
            })
            .then(() => {
                resolve(message.formData);
            })
            .catch(reject);
        });     
    }
}

module.exports = WidgetEngineConsumer;