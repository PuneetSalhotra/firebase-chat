/**
 * author: Sri Sai Venkatesh
 */

function QueueWrapper(producer) {

    producer.on('brokersChanged', function (error) {        
        global.logger.write('debug', 'brokersChanged : ' + error, {}, {});
    });

    producer.on('error', function (err) {
        global.logger.write('serverError', 'Producer send error message : ' + err, err, {});                
    });

    this.raiseActivityEvent = function (event, activityId, callback) {
        ////var partition = Number(activityId) % 3;
        //var partition = 0;        
        global.logger.write('debug', 'producing to key: ' + activityId.toString(), {}, event.payload);
        //global.logger.write('debug', 'producing to partition id: ' + partition, {}, event.payload);
        var payloads = [{
            topic: global.config.TOPIC_NAME,
            messages: JSON.stringify((event)),
            key: activityId.toString()
        }];

        producer.send(payloads, function (err, data) {
            if (err) {
                global.logger.write('serverError', 'error in producing data - ' + err, {}, event.payload);
                //console.log('error in producing data', err);
                callback(true, err);
            } else {
                //console.log('Producer success callback message ' + JSON.stringify(data));
                global.logger.write('debug', 'Producer success callback message' + JSON.stringify(data), JSON.stringify(data), event.payload)
                callback(false, 'Producer success callback message');
            }
            //return true;
        });

    };

    this.raiseFormWidgetEvent = function (event, activityId) {
        //var partition = Number(activityId) % 3;
        //var partition = 0;        
        //global.logger.write('debug', 'producing to partition id: ' + partition, {}, event.payload);
        global.logger.write('debug', 'producing to key: ' + activityId.toString(), {}, event.payload);
        var payloads = [{
            topic: global.config.kafkaFormWidgetTopic,
            messages: JSON.stringify((event)),
            key: activityId.toString()
        }];
        producer.send(payloads, function (err, data) {
            if (err) {                
                global.logger.write('serverError', 'error in producing data : ' + err, err, event.payload)
            } else {
                global.logger.write('debug', 'Producer success callback message ' + JSON.stringify(data), JSON.stringify(data), event.payload)                
            }
            return true;
        });

        producer.on('error', function (err) {
            global.logger.write('serverError', 'Producer send error message : ' + err, err, event.payload)            
            return false;
        });
    }
}

module.exports = QueueWrapper;
