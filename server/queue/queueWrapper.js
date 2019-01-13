/**
 * author: Sri Sai Venkatesh
 */

const pubnubWrapper = new(require('../utils/pubnubWrapper'))();

function QueueWrapper(producer) {

    producer.on('brokersChanged', function (error) {        
        global.logger.write('debug', 'brokersChanged : ' + error, {}, {});
    });

    producer.on('error', function (err) {
        global.logger.write('serverError', 'Producer send error message : ' + err, err, {});                
    });

    this.raiseActivityEvent = function (event, activityId, callback) {
        //event.payload.pubnub_push = 0;
        
        global.logger.write('debug', 'producing to key: ' + activityId.toString(), {}, event.payload);        
        var payloads = [{
            topic: global.config.TOPIC_NAME,
            messages: JSON.stringify((event)),
            key: activityId.toString()
        }];

        producer.send(payloads, function (err, data) {
            if (err) {
                global.logger.write('serverError', 'error in producing data - ' + err, {}, event.payload);                
                callback(true, err);
            } else {                
                global.logger.write('debug', 'Producer success callback message' + JSON.stringify(data), JSON.stringify(data), event.payload);                
                callback(false, 'Producer success callback message');
            }
        });

    };

    this.raiseFormWidgetEvent = function (event, activityId, callback) {
        //var partition = Number(activityId) % 3;
        //var partition = 0;        
        //global.logger.write('debug', 'producing to partition id: ' + partition, {}, event.payload);
        global.logger.write('debug', 'producing to key: ' + activityId.toString(), {}, event.payload);
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
        return new Promise((resolve, reject)=>{
            let obj;
            let channelId;
            event.payload.pubnub_push = 1;
            
            global.logger.write('debug', 'producing to key: ' + activityId.toString(), {}, event.payload);        
            var payloads = [{
                topic: global.config.TOPIC_NAME,
                messages: JSON.stringify((event)),
                key: activityId.toString()
            }];

            producer.send(payloads, function (err, data) {
                if (err) {
                    global.logger.write('serverError', 'error in producing data - ' + err, {}, event.payload);                
                    reject(err);
                } else {                
                    global.logger.write('debug', 'Producer success callback message' + JSON.stringify(data), JSON.stringify(data), event.payload);
                                        
                    //Receive the response from Consumer
                    obj = data[global.config.TOPIC_NAME];
                    channelId = `${global.config.TOPIC_NAME}_${Object.keys(obj)[0]}_${Object.values(obj)[0]}`;
                    console.log(channelId);
                    
                    pubnubWrapper.subscribe(channelId).then((msg)=>{
                        console.log('msg.status : ', msg.status);
                        if(msg.status === 200) {
                            resolve(msg);
                        } else {
                            reject(msg.status);
                        }                        
                    }).catch((err)=>{
                        global.logger.write('serverError', err, {}, {});
                    });
                    
                }            
            });
        });        

    };
    
    
}

module.exports = QueueWrapper;
