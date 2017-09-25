/**
 * author: Sri Sai Venkatesh
 */

function QueueWrapper(producer) {

    this.raiseActivityEvent = function (event, activityId) {
        var partition = Number(activityId) % 4;
        //var partition = 0;
        console.log("producing to partition id: " + partition);
        var payloads = [
            {topic: global.config.kafkaActivitiesTopic, messages: JSON.stringify((event)), partition: partition}
        ];
        producer.send(payloads, function (err, data) {
            if (err) {
                console.log('error in producing data');
                console.log(err);
            } else
                console.log('Producer success callback message ' + JSON.stringify(data));
            return true;
        });

        producer.on('error', function (err) {
            console.log('Producer send error message: ' + err);
            return false;
        });
    }

    this.raiseFormWidgetEvent = function (event, activityId) {
        var partition = Number(activityId) % 4;
        //var partition = 0;
        console.log("producing to partition id: " + partition);
        var payloads = [
            {topic: global.config.kafkaFormWidgetTopic, messages: JSON.stringify((event)), partition: partition}
        ];
        producer.send(payloads, function (err, data) {
            if (err) {
                console.log('error in producing data');
                console.log(err);
            } else
                console.log('Producer success callback message ' + JSON.stringify(data));
            return true;
        });

        producer.on('error', function (err) {
            console.log('Producer send error message: ' + err);
            return false;
        });
    }
}

module.exports = QueueWrapper;
