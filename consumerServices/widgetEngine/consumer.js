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
            return resolve({message, formDataJson});
        });
    }

    actOnMessage(message) {
        return new Promise((resolve, reject) => {
            const formInstance = forms.get(formDataJson[0].form_id, {objCollection: this.objCollection});
            formInstance.getWidgets()
            .then((widgets) => {
                const promises = widgets.map((widget) => widget.crunchDataAndSave(message));
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