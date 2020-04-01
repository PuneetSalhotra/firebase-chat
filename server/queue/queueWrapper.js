/**
 * author: Sri Sai Venkatesh
 */
// This line must come before importing any instrumented module.
const tracer = require('dd-trace');
const tracerFormats = require('dd-trace/ext/formats')

const logger = require("../logger/winstonLogger");
const pubnubWrapper = new(require('../utils/pubnubWrapper'))();
const cacheWrapper = new(require('../utils/cacheWrapper'))();

function QueueWrapper(producer) {

    producer.on('brokersChanged', function (error) {        
        logger.error('Kafka Producer brokersChanged', { type: 'kafka', error });
        // global.logger.write('debug', 'brokersChanged : ' + error, {}, {});
    });

    producer.on('error', function (err) {
        logger.error('Kafka Producer Error', { type: 'kafka', error: err });
        // global.logger.write('serverError', 'Producer send error message : ' + err, err, {});                
    });

    this.raiseActivityEvent = function (event, activityId, callback) {
        // Get current SpanContext
        let kafkaProduceEventSpan = tracer.scope().active().context();
        const traceHeaders = {};
        let span = tracer.startSpan('kafka_producing_message', {
            childOf: kafkaProduceEventSpan
        });
        tracer.inject(span, tracerFormats.LOG, traceHeaders)
        logger.silly('traceHeaders: %j', traceHeaders, {type: 'trace_span'});
        // console.log("raiseActivityEvent | span | logHeaders: ", traceHeaders);
        event.log_trace_headers = traceHeaders;

        //event.payload.pubnub_push = 0;
        
        global.logger.write('conLog', 'producing to key: ' + activityId.toString(), {}, event.payload);        
        var payloads = [{
            topic: global.config.TOPIC_NAME,
            messages: JSON.stringify((event)),
            key: activityId.toString()
        }];

        producer.send(payloads, function (err, data) {
            if (err) {
                logger.error(`${payloads[0].topic} ${payloads[0].key} | Kafka Producer Send Error`, { type: 'kafka', data, payloads, error: err });
                // global.logger.write('serverError', 'error in producing data - ' + err, {}, event.payload);                
                callback(true, err);
            } else {                
                logger.info(`${payloads[0].topic} ${payloads[0].key} | Kafka Producer Send Success`, { type: 'kafka', data, payloads, error: err });
                // global.logger.write('debug', 'Producer success callback message' + JSON.stringify(data), JSON.stringify(data), event.payload);                
                callback(false, 'Producer success callback message');
            }
        });

    };

    this.raiseFormWidgetEvent = function (event, activityId, callback) {
        //var partition = Number(activityId) % 3;
        //var partition = 0;        
        //global.logger.write('debug', 'producing to partition id: ' + partition, {}, event.payload);
        global.logger.write('conLog', 'producing to key: ' + activityId.toString(), {}, event.payload);
        var payloads = [{
            topic: global.config.WIDGET_TOPIC_NAME,
            messages: JSON.stringify((event)),
            key: activityId.toString()
        }];
        producer.send(payloads, function (err, data) {
            if (err) {                
                global.logger.write('serverError', 'error in producing data : ' + err, err, event.payload);
                // callback(true, err);
            } else {
                global.logger.write('debug', 'Producer success callback message ' + JSON.stringify(data), JSON.stringify(data), event.payload);
                // callback(false, 'Producer success callback message');
            }            
        });        
    };    
    
    this.raiseLogEvent = async function(event) {         
                    
            var payloads = [{
                topic: global.config.LOGS_TOPIC_NAME,
                messages: JSON.stringify((event))                
            }];

            producer.send(payloads, function (err, data) {
                if (err) {
                    console.log('Error: Log message Production ', err);
                } else {
                    // console.log('Log Message Produced');

                }
            });           
        
    };
    
    this.raiseActivityEventPromise = function (event, activityId) {
        // Get current SpanContext
        let kafkaProduceEventSpan = tracer.scope().active().context();
        const traceHeaders = {};
        let span = tracer.startSpan('kafka_producer', {
            childOf: kafkaProduceEventSpan
        });
        tracer.inject(span, tracerFormats.LOG, traceHeaders)
        logger.silly('trace headers sent from kafka producer: %j', traceHeaders, {type: 'trace_span'});
        // console.log("raiseActivityEvent | span | traceHeaders: ", traceHeaders);
        event.log_trace_headers = traceHeaders;

        return new Promise((resolve, reject)=>{
            let obj;
            let channelId, newChannelId;
            event.payload.pubnub_push = 1;
            
            global.logger.write('conLog', 'producing to key: ' + activityId.toString(), {}, event.payload);        
            var payloads = [{
                topic: global.config.TOPIC_NAME,
                messages: JSON.stringify((event)),
                key: activityId.toString()
            }];

            producer.send(payloads, async function (err, data) {
                if (err) {
                    logger.error(`${payloads[0].topic} ${payloads[0].key} | Kafka Producer Send Error`, { type: 'kafka', data, payloads, error: err });
                    // global.logger.write('serverError', 'error in producing data - ' + err, {}, event.payload);                
                    reject(err);
                } else {             
                    logger.info(`${payloads[0].topic} ${payloads[0].key} | Kafka Producer Send Success`, { type: 'kafka', data, payloads, error: err });   
                    // global.logger.write('debug', 'Producer success callback message' + JSON.stringify(data), JSON.stringify(data), event.payload);
                                        
                    //Receive the response from Consumer
                    obj = data[global.config.TOPIC_NAME];
                    channelId = `${global.config.TOPIC_NAME}_${Object.keys(obj)[0]}_${Object.values(obj)[0]}`;
                    console.log(channelId);

                    newChannelId = `${Object.keys(obj)[0]}_${Object.values(obj)[0]}`;
                    
                    /*pubnubWrapper.subscribe(channelId).then((msg)=>{
                        console.log('msg.status : ', msg.status);
                        if(msg.status === 200) {
                            resolve(msg);
                        } else {
                            reject(msg.status);
                        }                        
                    }).catch((err)=>{
                        global.logger.write('serverError', err, {}, {});
                    });*/

                    await cacheWrapper.setOffset(global.config.TOPIC_NAME, newChannelId, 1); // 1 Means Open
                    await checkingWhetherMsgIsConsumed(newChannelId);
                    resolve();
                }
            });
        });        

    };

    async function checkingWhetherMsgIsConsumed(channelId) {
        setTimeout(async () => {
            let data = await cacheWrapper.getOffset(global.config.TOPIC_NAME, channelId);
            if(data === 0) {
                return "success";
            } else {
                checkingWhetherMsgIsConsumed();
            }
        }, 2000);
    }
    
}

module.exports = QueueWrapper;
