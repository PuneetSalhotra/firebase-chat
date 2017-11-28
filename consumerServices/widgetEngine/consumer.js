/**
 * author: SBK
 */
const ConsumerBase = require('../../server/queue/consumerBase');
const forms = require('./forms');


class WidgetEngineConsumer extends ConsumerBase {
    constructor(opts) {
        super(opts);
    }

    validateMessage(message) {
        const messagePayload = (message || {}).payload;
        return new Promise((resolve, reject) => {
            if (!messagePayload.form_id)
                return reject("Invalid message for widgetEngine, Skipping message");
            return resolve(messagePayload);
        });
    }

    actOnMessage(message) {
        return new Promise((resolve, reject) => {
            const formInstance = forms.get(message.form_id, {objCollection: this.objCollection});
            formInstance.getWidgets(message)
                    .then((widgets) => {
                        const promises = widgets.map((widget) => widget && widget.crunchDataAndSave(message));
                        return Promise.all(promises);
                    })
                    .then(() => {
                        resolve(message);
                    })
                    .catch(reject);
        });
    }
}

module.exports = WidgetEngineConsumer;