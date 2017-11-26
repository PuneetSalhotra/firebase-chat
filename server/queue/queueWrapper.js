/**
 * author: Sri Sai Venkatesh
 */

function QueueWrapper(producer) {

    this.raiseActivityEvent = function (event, activityId) {
        //var partition = Number(activityId) % 4;
        var partition = 0;
        console.log("producing to partition id: " + partition);
        global.logger.write('debug','producing to partition id: ' + partition, event.payload)
        var payloads = [
            {topic: global.config.kafkaActivitiesTopic, messages: JSON.stringify((event)), partition: partition}
        ];
        producer.send(payloads, function (err, data) {
            if (err) {
                global.logger.write('serverError','error in producing data : ' + err, event.payload)
                //console.log('error in producing data');
                //console.log(err);
            } else
                console.log('Producer success callback message ' + JSON.stringify(data));
                global.logger.write('debug','Producer success callback message ' + JSON.stringify(data), event.payload)
            return true;
        });

        producer.on('error', function (err) {
            global.logger.write('serverError','Producer send error message: ' + err, event.payload)
            //console.log('Producer send error message: ' + err);
            return false;
        });
    }

    this.raiseFormWidgetEvent = function (event, activityId) {
        //var partition = Number(activityId) % 4;
        var partition = 0;
        //console.log("producing to partition id: " + partition);
        global.logger.write('debug','producing to partition id: ' + partition, event.payload)
        var payloads = [
            {topic: global.config.kafkaFormWidgetTopic, messages: JSON.stringify((event)), partition: partition}
        ];
        producer.send(payloads, function (err, data) {
            if (err) {
                //console.log('error in producing data');
                //console.log(err);
                global.logger.write('serverError','error in producing data: ' + err, event.payload)
            } else {
                global.logger.write('debug','Producer success callback message ' + JSON.stringify(data), event.payload)
                //console.log('Producer success callback message ' + JSON.stringify(data));
            }
            return true;
        });

        producer.on('error', function (err) {
            global.logger.write('serverError','Producer send error message: ' + err, event.payload)
            //console.log('Producer send error message: ' + err);
            return false;
        });
    }
}

module.exports = QueueWrapper;
