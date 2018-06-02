/*
 *author: V Nani Kalyan
 * 
 */

function PamUpdateController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var cacheWrapper = objCollection.cacheWrapper;
    var queueWrapper = objCollection.queueWrapper;
    var app = objCollection.app;
    var util = objCollection.util;
    var forEachAsync = objCollection.forEachAsync;

    //PAM
    app.put('/' + global.config.version + '/pam/activity/ingredient/alter', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedCoverUpdate = function () {
            var event = {
                name: "alterActivityIngredient",
                service: "pamUpdateService",
                method: "alterIngredientSubTypeActivity",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{});
            res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            return;
        };
        if (util.hasValidActivityId(req.body)) {
            if (deviceOsId === 5) {
                proceedCoverUpdate();
            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304,req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301,req.body));
        }
    });
}

module.exports = PamUpdateController;
