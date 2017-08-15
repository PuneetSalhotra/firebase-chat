const ConsumerBase = require('../../server/queue/consumerBase');

class WidgetEngineConsumer extends ConsumerBase {
    constructor(opts) {
        super(opts);
    }

    validateMessage(message){
        const messagePayload = (message || {}).payload;
        var formDataJson = JSON.parse((messagePayload.activity_timeline_collection || '[]'));
        return new Promise((resolve, reject) => {
            if(formDataJson[0] && formDataJson[0].form_) return resolve({message, formDataJson});
            return reject("Invalid message for widgetEngine, Skipping message");
        });
    }

    actOnMessage(message) {
        return new Promise((resolve, reject) => {
            resolve(message.formData);
        });     
    }
}

module.exports = WidgetEngineConsumer;