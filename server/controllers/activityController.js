/*
 *author: Sri Sai Venkatesh 
 * 
 */

var ActivityService = require("../services/activityService");
//var ActivityCommonService = require("../services/activityCommonService");
var AssetService = require("../services/assetService");
var fs = require('fs');

function ActivityController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var cacheWrapper = objCollection.cacheWrapper;
    var queueWrapper = objCollection.queueWrapper;
    var activityCommonService = objCollection.activityCommonService;
    var app = objCollection.app;
    var util = objCollection.util;

    var assetService = new AssetService(objCollection);
    var activityService = new ActivityService(objCollection); //PAM

    app.post('/' + global.config.version + '/activity/add', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedAddActivity = function () {
            global.logger.write('debug','came into proceed add activity ',{},req.body);
            if (util.hasValidGenericId(req.body, 'activity_type_category_id')) {
                if (util.hasValidGenericId(req.body, 'activity_type_id')) {
                    var activityTypeCategoryId = Number(req.body.activity_type_category_id);
                    var parentActivityId = util.replaceZero(req.body.activity_parent_id);
                    switch (activityTypeCategoryId) {
                        case 29: // Co-worker Contact Card - supplier
                        case 6: // Co-worker Contact Card - customer                            
                            assetService.addAsset(req.body, function (err, data, statusCode) {
                                if (err === false) {
                                    if (statusCode === 200) {   // go ahead and create a contact activity id
                                        var newAssetId = data.asset_id;
                                        var contactJson = eval('(' + req.body.activity_inline_data + ')');
                                        contactJson['contact_asset_id'] = newAssetId;
                                        req.body.activity_inline_data = JSON.stringify(contactJson);
                                        addActivity(req.body, function (err, activityId) {
                                            if (err === false) {
                                                var responseDataCollection = {asset_id: newAssetId, activity_id: activityId};
                                                res.send(responseWrapper.getResponse(false, responseDataCollection, 200, req.body));
                                            } else {
                                                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
                                            }
                                        });
                                    } else {
                                        res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
                                        return;
                                    }

                                } else {
                                    //console.log('did not get proper rseponse');
                                    
                                    res.send(responseWrapper.getResponse(err, {}, statusCode,req.body));
                                    return;
                                }
                            }.bind(this));
                            break;
                        case 8:     // mail
                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {activity_id: activityId}, 200,req.body));
                                    return;
                                } else {
                                    (activityId === 0 ) ? 
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998,req.body)):
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0}, -5998,req.body));                                            
                                    return;
                                }
                            });

                            break;
                        case 9:     // form                        
                            //generate a form transaction id first and give it back to the client along with new activity id
                            cacheWrapper.getFormTransactionId(function (err, formTransactionId) {
                                if (err) {
                                    console.log(err);
                                    global.logger.write('serverError','',err,req.body);
                                    res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998,req.body));
                                    return;
                                } else {
                                    req.body['form_transaction_id'] = formTransactionId;
                                    addActivity(req.body, function (err, activityId) {
                                        if (err === false) {
                                            res.send(responseWrapper.getResponse(false, {activity_id: activityId, form_transaction_id: formTransactionId}, 200,req.body));
                                        } else {
                                            (activityId === 0 ) ?
                                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998,req.body)):
                                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -5998,req.body));
                                        }
                                    });
                                }
                            });
                            break;
                        case 10: //FILE and TASK LIST BETA
                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {activity_id: activityId, message_unique_id: req.body.message_unique_id}, 200, req.body));
                                } else {
                                    (activityId === 0 ) ?
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0, message_unique_id: req.body.message_unique_id}, -7998, req.body)):
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0, message_unique_id: req.body.message_unique_id}, -5998, req.body));
                                }
                            });
                            break;
                        case 37: //Reservation PAM                   
                            cacheWrapper.getActivityId(function (err, activityId) {
                                   if (err) {
                                        console.log(err);
                                        global.logger.write('debug','',err,req.body);
                                        callback(true, 0);
                                        return;
                                    } else { 
                                        console.log('Request Parameters : ' + req.body);
                                        req.body.activity_id = activityId;
                                    activityService.addActivity(req.body, function (err, data, statusCode) {
                                         if (err === false) {
                                             res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                                             return;
                                         } else {
                                             data = {};
                                             res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                                             return;
                                            }
                                        });
                                    }
                                 });
                            
                            break;
                        case 41: //Event Creating PAM
                            //fs.readFile('/var/node/Bharat/server/utils/pamConfig.txt', function(err, data){
                            fs.readFile(`${__dirname}/../utils/pamConfig.txt`, function(err, data){
                                if(err) {
                                 console.log(err)   
                                } else{
                                    threshold = Number(data.toString());
                                    req.body.activity_sub_type_id = threshold;                                    
                                    addActivity(req.body, function (err, activityId) {
                                           if (err === false) {
                                               res.send(responseWrapper.getResponse(false, {activity_id: activityId}, 200, req.body));
                                           } else {
                                               (activityId === 0 ) ?
                                               res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998, req.body)):
                                               res.send(responseWrapper.getResponse(false, {activity_id: 0}, -5998, req.body));
                                           }
                                    });
                                }
                            });
                            
                            break;
                        default:
                            //console.log('generating activity id via default condition');
                            global.logger.write('debug','generating activity id via default condition',{},req.body);
                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {activity_id: activityId}, 200, req.body));
                                } else {
                                    (activityId === 0 ) ?
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998, req.body)):
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0}, -5998, req.body));
                                }
                            });
                            break;
                    }
                    ;
                    return;
                } else {
                    res.send(responseWrapper.getResponse(false, {activity_id: 0}, -3302,req.body));
                    return;
                }
                return;
            } else {
                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -3303,req.body));
                return;
            }
            //var parentActivityId = (req.body.activity_parent_id === 'undefined' || req.body.activity_parent_id === '' || req.body.activity_parent_id === null) ? 0 : Number(req.body.activity_parent_id);
        };

        try {
            JSON.parse(req.body.activity_inline_data);
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {activity_id: 0}, -3308,req.body));
            return;
        }

        if ((util.hasValidGenericId(req.body, 'asset_message_counter')) && deviceOsId !== 5 && deviceOsId !== 6) {
            cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                if (err) {
                    res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998,req.body));
                } else {
                    if (status) {     // proceed
                        //console.log("calling proceedAddActivity");
                        global.logger.write('debug','calling proceedAddActivity',{},req.body);
                        proceedAddActivity();
                    } else {  // get the activity id using message unique id and send as response
                        cacheWrapper.getMessageUniqueIdLookup(req.body.message_unique_id, function (err, activityId) {
                            if (err) {
                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998,req.body));
                            } else {
                                res.send(responseWrapper.getResponse(false, {activity_id: Number(activityId)}, 200,req.body));
                            }
                        });
                    }
                }
            });
        } else if (deviceOsId === 5 || deviceOsId === 6) {
            proceedAddActivity();
        } else {
            res.send(responseWrapper.getResponse(false, {activity_id: 0}, -3304,req.body));
        }

    });
    
    
    //Add Activity New Version
    app.post('/' + global.config.version + '/activity/add/v1', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedAddActivity = function () {
            global.logger.write('debug','came into proceed add activity ',{},req.body);
            if (util.hasValidGenericId(req.body, 'activity_type_category_id')) {
                if (util.hasValidGenericId(req.body, 'activity_type_id')) {
                    var activityTypeCategoryId = Number(req.body.activity_type_category_id);
                    var parentActivityId = util.replaceZero(req.body.activity_parent_id);
                    switch (activityTypeCategoryId) {
                        case 29: // Co-worker Contact Card - supplier
                        case 6: // Co-worker Contact Card - customer                            
                            assetService.addAsset(req.body, function (err, data, statusCode) {
                                if (err === false) {
                                    if (statusCode === 200) {   // go ahead and create a contact activity id
                                        var newAssetId = data.asset_id;
                                        var contactJson = eval('(' + req.body.activity_inline_data + ')');
                                        contactJson['contact_asset_id'] = newAssetId;
                                        req.body.activity_inline_data = JSON.stringify(contactJson);
                                        addActivity(req.body, function (err, activityId) {
                                            if (err === false) {
                                                var responseDataCollection = {asset_id: newAssetId, activity_id: activityId};
                                                res.send(responseWrapper.getResponse(false, responseDataCollection, 200, req.body));
                                            } else {
                                                res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
                                            }
                                        });
                                    } else {
                                        res.send(responseWrapper.getResponse(err, data, statusCode,req.body));
                                        return;
                                    }

                                } else {
                                    //console.log('did not get proper rseponse');
                                    
                                    res.send(responseWrapper.getResponse(err, {}, statusCode,req.body));
                                    return;
                                }
                            }.bind(this));
                            break;
                        case 8:     // mail
                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {activity_id: activityId}, 200,req.body));
                                    return;
                                } else {
                                    (activityId === 0 ) ? 
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998,req.body)):
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0}, -5998,req.body));                                            
                                    return;
                                }
                            });

                            break;
                        case 9:     // form                        
                            //generate a form transaction id first and give it back to the client along with new activity id
                            cacheWrapper.getFormTransactionId(function (err, formTransactionId) {
                                if (err) {
                                    console.log(err);
                                    global.logger.write('serverError','',err,req.body);
                                    res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998,req.body));
                                    return;
                                } else {
                                    req.body['form_transaction_id'] = formTransactionId;
                                    addActivity(req.body, function (err, activityId) {
                                        if (err === false) {
                                            res.send(responseWrapper.getResponse(false, {activity_id: activityId, form_transaction_id: formTransactionId}, 200,req.body));
                                        } else {
                                            (activityId === 0 ) ?
                                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998,req.body)):
                                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -5998,req.body));
                                        }
                                    });
                                }
                            });
                            break;
                        case 10: //FILE and TASK LIST BETA
                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {activity_id: activityId, message_unique_id: req.body.message_unique_id}, 200, req.body));
                                } else {
                                    (activityId === 0 ) ?
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0, message_unique_id: req.body.message_unique_id}, -7998, req.body)):
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0, message_unique_id: req.body.message_unique_id}, -5998, req.body));
                                }
                            });
                            break;
                        case 37: //Reservation PAM                   
                            cacheWrapper.getActivityId(function (err, activityId) {
                                   if (err) {
                                        console.log(err);
                                        global.logger.write('debug','',err,req.body);
                                        callback(true, 0);
                                        return;
                                    } else { 
                                        console.log('Request Parameters : ' + req.body);
                                        req.body.activity_id = activityId;
                                    activityService.addActivity(req.body, function (err, data, statusCode) {
                                         if (err === false) {
                                             res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                                             return;
                                         } else {
                                             data = {};
                                             res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                                             return;
                                            }
                                        });
                                    }
                                 });
                            
                            break;
                        case 41: //Event Creating PAM
                            //fs.readFile('/var/node/Bharat/server/utils/pamConfig.txt', function(err, data){
                            fs.readFile(`${__dirname}/../utils/pamConfig.txt`, function(err, data){
                                if(err) {
                                 console.log(err)   
                                } else{
                                    threshold = Number(data.toString());
                                    req.body.activity_sub_type_id = threshold;                                    
                                    addActivity(req.body, function (err, activityId) {
                                           if (err === false) {
                                               res.send(responseWrapper.getResponse(false, {activity_id: activityId}, 200, req.body));
                                           } else {
                                               (activityId === 0 ) ?
                                               res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998, req.body)):
                                               res.send(responseWrapper.getResponse(false, {activity_id: 0}, -5998, req.body));
                                           }
                                    });
                                }
                            });
                            
                            break;
                        default:
                            //console.log('generating activity id via default condition');
                            global.logger.write('debug','generating activity id via default condition',{},req.body);
                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {activity_id: activityId}, 200, req.body));
                                } else {
                                    (activityId === 0 ) ?
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998, req.body)):
                                        res.send(responseWrapper.getResponse(false, {activity_id: 0}, -5998, req.body));
                                }
                            });
                            break;
                    }
                    ;
                    return;
                } else {
                    res.send(responseWrapper.getResponse(false, {activity_id: 0}, -3302,req.body));
                    return;
                }
                return;
            } else {
                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -3303,req.body));
                return;
            }
            //var parentActivityId = (req.body.activity_parent_id === 'undefined' || req.body.activity_parent_id === '' || req.body.activity_parent_id === null) ? 0 : Number(req.body.activity_parent_id);
        };

        try {
            JSON.parse(req.body.activity_inline_data);
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {activity_id: 0}, -3308,req.body));
            return;
        }

        if ((util.hasValidGenericId(req.body, 'asset_message_counter')) && deviceOsId !== 5 && deviceOsId !== 6) {
            cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                if (err) {
                    res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998,req.body));
                } else {
                    if (status) {     // proceed
                        //console.log("calling proceedAddActivity");
                        global.logger.write('debug','calling proceedAddActivity',{},req.body);
                        proceedAddActivity();
                    } else {  // get the activity id using message unique id and send as response
                        cacheWrapper.getMessageUniqueIdLookup(req.body.message_unique_id, function (err, activityId) {
                            if (err) {
                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998,req.body));
                            } else {
                                res.send(responseWrapper.getResponse(false, {activity_id: Number(activityId)}, 200,req.body));
                            }
                        });
                    }
                }
            });
        } else if (deviceOsId === 5 || deviceOsId === 6) {
            proceedAddActivity();
        } else {
            res.send(responseWrapper.getResponse(false, {activity_id: 0}, -3304,req.body));
        }

    });

    var addActivity = function (req, callback) {
        cacheWrapper.getActivityId(function (err, activityId) {
            if (err) {
                console.log(err);
                global.logger.write('debug','',err,req);
                callback(true, 0);
                return;
            } else {
                req['activity_id'] = activityId;
                var event = {
                    name: "addActivity",
                    service: "activityService",
                    method: "addActivity",
                    payload: req
                    };
                queueWrapper.raiseActivityEvent(event, activityId, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError','Error in queueWrapper raiseActivityEvent',resp,req);
                            callback(true, 1);
                            
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            global.logger.write('serverError','error in setting in asset parity',err,req);
                                        } else
                                            //console.log("asset parity is set successfully")
                                            global.logger.write('debug',"asset parity is set successfully",{},req);

                                    });
                                }
                            }
                            console.log("new activityId is : " + activityId);
                            global.logger.write('debug',"new activityId is :" + activityId,{},req);
                            callback(false, activityId);
                        }
                });
                
                /*console.log("new activityId is : " + activityId);
                global.logger.write('debug',"new activityId is :" + activityId,{},req);
                callback(false, activityId);*/
                }

        });
    };

    app.put('/' + global.config.version + '/activity/status/alter', function (req, res) {
        var assetMessageCounter = 0;
        var deviceOsId = 0;
        var activityData = {activity_id: req.body.activity_id, message_unique_id: req.body.message_unique_id}; //BETA
        if (req.body.hasOwnProperty('asset_message_counter'))
            assetMessageCounter = Number(req.body.asset_message_counter);
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);
        var activityTypeCategoryId = Number(req.body.activity_type_category_id);

        var proceedActivityStatusAlter = function () {

            var event = {
                name: "alterActivityStatus",
                service: "activityService",
                method: "alterActivityStatus",
                payload: req.body
            };
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp)=>{
                        if(err) {
                            //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                            //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req.body);
                            res.send(responseWrapper.getResponse(true, activityData, -5999,req.body));
                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                        } else {
                            if (req.hasOwnProperty('device_os_id')) {
                                if (Number(req.device_os_id) !== 5) {
                                    //incr the asset_message_counter                        
                                    cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                        if (err) {
                                            //console.log("error in setting in asset parity");
                                            global.logger.write('serverError',"error in setting in asset parity",err,req.body);
                                        } else
                                            //console.log("asset parity is set successfully")
                                        global.logger.write('debug',"asset parity is set successfully",{},req.body);

                                    });
                                }
                            }
                            res.send(responseWrapper.getResponse(false, activityData, 200,req.body));
                        }
                });
            //res.send(responseWrapper.getResponse(false, activityData, 200,req.body));
            //return;
        };
        if (util.hasValidGenericId(req.body, 'activity_type_category_id')) {
            if (util.hasValidGenericId(req.body, 'activity_id')) {
                if (util.hasValidGenericId(req.body, 'activity_status_type_id')) {
                    if ((util.hasValidGenericId(req.body, 'asset_message_counter')) && deviceOsId !== 5) {
                        cacheWrapper.checkAssetParity(req.body.asset_id, (assetMessageCounter), function (err, status) {
                            if (err) {
                                res.send(responseWrapper.getResponse(false, activityData, -7998,req.body));
                            } else {
                                if (status) {     // proceed
                                    proceedActivityStatusAlter();
                                } else {  // this is a duplicate hit,
                                    res.send(responseWrapper.getResponse(false, activityData, 200,req.body));
                                }
                            }
                        });
                    } else if (deviceOsId === 5) {
                        proceedActivityStatusAlter();
                    } else {
                        res.send(responseWrapper.getResponse(false, activityData, -3304,req.body));
                    }
                } else {
                    res.send(responseWrapper.getResponse(false, activityData, -3306,req.body));
                }

            } else {
                res.send(responseWrapper.getResponse(false, activityData, -3301,req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, activityData, -3303,req.body));
            return;
        }

    });
      
   app.post('/' + global.config.version + '/activity/inmail/resp_req/set', function (req, res) {
        activityService.inmailResReqSet(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/activity/access/owner_rating/set', function (req, res) {
        activityService.updateOwnerRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.put('/' + global.config.version + '/activity/access/lead_rating/set', function (req, res) {
        activityService.updateLeadRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
 
}
;


module.exports = ActivityController;
