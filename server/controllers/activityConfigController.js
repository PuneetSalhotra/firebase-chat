/*
 *author: Sri Sai Venkatesh
 *date: 1970:01:01 00:00:00
 * 
 */

var ActivityConfigService = require("../services/activityConfigService");

function ActivityConfigController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;

    var activityConfigService = new ActivityConfigService(objCollection.db, objCollection.util, objCollection);

    app.post('/' + global.config.version + '/activity_type/access/workforce/list', function (req, res) {//Fetch activity types
        activityConfigService.getWorkforceActivityTypesList(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('conLog', err, {}, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });


    });

    app.post('/' + global.config.version + '/activity_status/access/workforce/list', function (req, res) {//Fetch activity status
        activityConfigService.getWorkforceActivityStatusList(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('conLog', err, {}, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });


    });
    
    app.post('/' + global.config.version + '/activity_participant_role/access/global/list', function (req, res) { // Fetch activity participant access global level
        activityConfigService.getActivityParticipantAccess(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                //console.log('did not get proper respone');
                global.logger.write('conLog', err, {}, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });

    });
    
    app.post('/' + global.config.version + '/activity_type/add', function (req, res) {
    	activityConfigService.workForceActivityTypeInsert(req.body).then((data)=>{    		
    		res.send(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.send(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/activity_type/alter', function (req, res) {
    	activityConfigService.workForceActivityTypeUpdate(req.body).then((data)=>{    		
    		res.send(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.send(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/activity_type/archive', function (req, res) {
    	activityConfigService.workForceActivityTypeDelete(req.body).then((data)=>{    		
    		res.send(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.send(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/activity_type/access/list', async function (req, res) {
        const [err, data] = await activityConfigService.listProcessesByAccessLevel(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });
    
    app.post('/' + global.config.version + '/activity_status/mapping/activity_type/list', function (req, res) {
    	activityConfigService.getEntityActivityStatusList(req.body).then((data)=>{    		
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));     	
    	}).catch((err) => {        	
        	res.send(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/activtity_type/communication/list', function (req, res) {
    	activityConfigService.getCommunicationList(req.body).then((data)=>{    		
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));     	
    	}).catch((err) => {        	
        	res.send(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });

    app.post('/' + global.config.version + '/activity_status/add', function (req, res) {
        activityConfigService.workForceActivityStatusInsert(req.body).then((data) => {
            res.send(responseWrapper.getResponse(data, data, 200, req.body));
        }).catch((err) => {
            res.send(responseWrapper.getResponse(err, {}, -999, req.body));
        });
    });
    
    app.post('/' + global.config.version + '/activity_status/archive', function (req, res) {
    	activityConfigService.workForceActivityStatusDelete(req.body).then((data)=>{    		
    		res.send(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.send(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/activity_status/alter', function (req, res) {
    	activityConfigService.workForceActivityStatusUpdate(req.body).then((data)=>{    		
    		res.send(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.send(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });

    app.post('/' + global.config.version + '/activity/sub_status/mapping/list', async function (req, res) {
        const [err, data] = await activityConfigService.getSubStatusedMappedToWorkflow(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });
}


module.exports = ActivityConfigController;