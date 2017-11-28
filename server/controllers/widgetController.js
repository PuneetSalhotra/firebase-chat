/*
 *author: Sri Sai Venkatesh 
 * 
 */

var WidgetService = require("../services/widgetService");

function WidgetController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    
    var widgetService = new WidgetService(objCollection);
    
    app.post('/' + global.config.version + '/widget/static/timecard/collection', function (req, res) {
        widgetService.getTimecardWidgetCollection(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });    
    
    app.post('/' + global.config.version + '/widget/access/asset/timeline/list', function (req, res) {        
        widgetService.getAssetWidgetTimeline(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/widget/access/workforce/timeline/list', function (req, res) {        
        widgetService.getWorkforceWidgetTimeline(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response   
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });


}

module.exports = WidgetController;