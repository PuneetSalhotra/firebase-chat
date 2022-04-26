/*
 *author: Sri Sai Venkatesh
 *date: 1970:01:01 00:00:00
 * 
 */

let ActivityConfigService = require("../services/activityConfigService");

function ActivityConfigController(objCollection) {

    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    let util = objCollection.util;
    let activityConfigService = new ActivityConfigService(objCollection.db, objCollection.util, objCollection);

    app.post('/' + global.config.version + '/activity_type/access/workforce/list', function (req, res) {//Fetch activity types
        activityConfigService.getWorkforceActivityTypesList(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.json(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                //console.log('did not get proper rseponse');
                //global.logger.write('conLog', err, {}, req.body);
                util.logError(req.body,`getWorkforceActivityTypesList Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });


    });

    app.post('/' + global.config.version + '/activity_status/access/workforce/list', function (req, res) {//Fetch activity status
        activityConfigService.getWorkforceActivityStatusList(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.json(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                //console.log('did not get proper rseponse');
                //global.logger.write('conLog', err, {}, req.body);
                util.logError(req.body,`getWorkforceActivityStatusList Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });


    });
    
    app.post('/' + global.config.version + '/activity_participant_role/access/global/list', function (req, res) { // Fetch activity participant access global level
        activityConfigService.getActivityParticipantAccess(req.body, function (err, data, statusCode) {

            if (err === false) {
                // got positive response    

                res.json(responseWrapper.getResponse(err, data, statusCode,req.body));

            } else {
                //console.log('did not get proper respone');
                //global.logger.write('conLog', err, {}, req.body);
                util.logError(req.body,`getActivityParticipantAccess Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode,req.body));
            }
        });

    });
    
    app.post('/' + global.config.version + '/activity_type/add', function (req, res) {
    	activityConfigService.workForceActivityTypeInsert(req.body).then((data)=>{    		
    		res.json(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/activity_type/alter', function (req, res) {
    	activityConfigService.workForceActivityTypeUpdate(req.body).then((data)=>{    		
    		res.json(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/activity_type/archive', function (req, res) {
    	activityConfigService.workForceActivityTypeDelete(req.body).then((data)=>{    		
    		res.json(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/activity_type/access/list', async function (req, res) {
        const [err, data] = await activityConfigService.listProcessesByAccessLevel(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });
    
    app.post('/' + global.config.version + '/activity_status/mapping/activity_type/list', function (req, res) {
    	activityConfigService.getEntityActivityStatusList(req.body).then((data)=>{    		
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));     	
    	}).catch((err) => {        	
        	res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/activtity_type/communication/list', function (req, res) {
    	activityConfigService.getCommunicationList(req.body).then((data)=>{    		
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));     	
    	}).catch((err) => {        	
        	res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });

    app.post('/' + global.config.version + '/activity_status/add', function (req, res) {
        activityConfigService.workForceActivityStatusInsert(req.body).then((data) => {
            res.json(responseWrapper.getResponse(data, data, 200, req.body));
        }).catch((err) => {
            res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        });
    });
    
    app.post('/' + global.config.version + '/activity_status/archive', function (req, res) {
    	activityConfigService.workForceActivityStatusDelete(req.body).then((data)=>{    		
    		res.json(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/activity_status/alter', function (req, res) {
    	activityConfigService.workForceActivityStatusUpdate(req.body).then((data)=>{    		
    		res.json(responseWrapper.getResponse(data, {}, 200, req.body));    	
    	}).catch((err) => {        	
        	res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });

    app.post('/' + global.config.version + '/activity/sub_status/mapping/list', async function (req, res) {
        const [err, data] = await activityConfigService.getSubStatusedMappedToWorkflow(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/check/duplicity', async (req, res) => {
        const [err, data] = await activityConfigService.checkDuplicate(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log('Error - /activity/check/duplicity : ', err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/asset/configs', async function (req, res) {
        const [err, data] = await activityConfigService.getActivityConfigs(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });    

    app.post('/' + global.config.version + '/account-activity/check/duplicity', async (req, res) => {
        const [err, data] = await activityConfigService.checkAcctDuplicity(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log('Error - /account/check/duplicity : ', err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/account-code/bot', async (req, res) => {
        const [err, data] = await activityConfigService.generateAcctCode(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log('Error - /activity/account-code/bot : ', err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/title/edit/dedupe', async (req, res) => {
        const [err, data] = await activityConfigService.checkTitleDedupe(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log('Error - /activity/title/edit/dedupe:', err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/owner/flag/set', async (req, res) => {
        const [err, data] = await activityConfigService.setAtivityOwnerFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log('Error - /activity/owner/flag/set : ', err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/group-account-name/bot', async (req, res) => {
        const [err, data] = await activityConfigService.groupAccountName(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log('Error - /activity/owner/flag/set : ', err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/pan/dedupe/check', async (req, res) => {
        const [err, data] = await activityConfigService.dedupePanCHeck(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log('Error - /activity/pan/dedupe/check : ', err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    //adding pan and activity details to elastic 
    app.post('/' + global.config.version + '/activity/pan/elastic/entry', async (req, res) => {
        const [err, data] = await activityConfigService.panElasticEntry(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log('Error - /activity/pan/elastic/entry : ', err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/account-activity/account-name/check', async (req, res) => {
        const [err, data] = await activityConfigService.checkAccountNameForDuplicate(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log('Error - /account-activity/account-name/check : ', err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/previous/status/list', async (req, res) => {
        const [err, data] = await activityConfigService.getActivityPreviousStatusList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log('Error - /activity/previous/status/list : ', err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity_type/arp/flag/set', async (req, res) => {
        const [err, data] = await activityConfigService.workforceActivityTypeMappingUpdateFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log('Error - /activity_type/arp/flag/set : ', err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });
}


module.exports = ActivityConfigController;