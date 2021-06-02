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

        req.body["log_uuid"] = util.getLogUUID();
        console.log("::START:: ",req.body["log_uuid"]," ::");
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedAddActivity = function () {
            global.logger.write('conLog', 'Came into proceedAddActivity() ', {}, req.body);

            if (util.hasValidGenericId(req.body, 'activity_type_category_id')) {
                if (util.hasValidGenericId(req.body, 'activity_type_id')) {
                    var activityTypeCategoryId = Number(req.body.activity_type_category_id);
                    var parentActivityId = util.replaceZero(req.body.activity_parent_id);
                    switch (activityTypeCategoryId) {
                        case 29: // Co-worker Contact Card - supplier
                        case 6: // Co-worker Contact Card - customer                                
                            assetService.addAsset(req.body, function (err, data, statusCode) {                          
                                if (err === false) {                                    
                                    if (statusCode === 200) { // go ahead and create a contact activity id
                                        var newAssetId = data.asset_id;                             
                                        var contactJson = eval('(' + req.body.activity_inline_data + ')');
                                        contactJson['contact_asset_id'] = newAssetId;
                                        req.body.activity_inline_data = JSON.stringify(contactJson);
                                        addActivity(req.body, function (err, activityId) {
                                            if (err === false) {
                                                var responseDataCollection = {
                                                    asset_id: newAssetId,
                                                    activity_id: activityId
                                                };
                                                res.send(responseWrapper.getResponse(false, responseDataCollection, 200, req.body));
                                            } else {
                                                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                                            }
                                        });
                                    } else {
                                        res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                                        return;
                                    }

                                } else {
                                    //console.log('did not get proper rseponse');

                                    res.send(responseWrapper.getResponse(err, {}, statusCode, req.body));
                                    return;
                                }
                            }.bind(this));
                            break;
                        case 8: // mail
                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {
                                        activity_id: activityId
                                    }, 200, req.body));
                                    return;
                                } else {
                                    (activityId === 0) ?
                                    res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0
                                        }, -7998, req.body)):
                                        res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0
                                        }, -5998, req.body));
                                    return;
                                }
                            });

                            break;
                        case 9: // form                        
                            //generate a form transaction id first and give it back to the client along with new activity id
                            cacheWrapper.getFormTransactionId(function (err, formTransactionId) {
                                if (err) {
                                    // console.log(err);
                                    global.logger.write('serverError', err, err, {});
                                    res.send(responseWrapper.getResponse(false, {
                                        activity_id: 0
                                    }, -7998, req.body));
                                    return;
                                } else {
                                    req.body['form_transaction_id'] = formTransactionId;
                                    addActivity(req.body, function (err, activityId) {
                                        if (err === false) {
                                            res.send(responseWrapper.getResponse(false, {
                                                activity_id: activityId,
                                                form_transaction_id: formTransactionId
                                            }, 200, req.body));
                                        } else {
                                            (activityId === 0) ?
                                            res.send(responseWrapper.getResponse(false, {
                                                    activity_id: 0
                                                }, -7998, req.body)):
                                                res.send(responseWrapper.getResponse(false, {
                                                    activity_id: 0
                                                }, -5998, req.body));
                                        }
                                    });
                                }
                            });
                            break;
                        case 10: //FILE and TASK LIST BETA
                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {
                                        activity_id: activityId,
                                        message_unique_id: req.body.message_unique_id
                                    }, 200, req.body));
                                } else {
                                    (activityId === 0) ?
                                    res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0,
                                            message_unique_id: req.body.message_unique_id
                                        }, -7998, req.body)):
                                        res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0,
                                            message_unique_id: req.body.message_unique_id
                                        }, -5998, req.body));
                                }
                            });
                            break;
                        case 37: //Reservation PAM                   
                            cacheWrapper.getActivityId(function (err, activityId) {
                                if (err) {
                                    // console.log(err);
                                    global.logger.write('debug', err, err, req.body);
                                    callback(true, 0);
                                    return;
                                } else {
                                    // console.log('Request Parameters : ' + req.body);
                                    global.logger.write('conLog', 'Request Parameters: ' + JSON.stringify(req.body, null, 2), {}, req.body);

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
                            fs.readFile(`${__dirname}/../utils/pamConfig.txt`, function (err, data) {
                                if (err) {
                                    // console.log(err)
                                    global.logger.write('debug', err, err, req);

                                } else {
                                    threshold = Number(data.toString());
                                    req.body.activity_sub_type_id = threshold;
                                    addActivity(req.body, function (err, activityId) {
                                        if (err === false) {
                                            res.send(responseWrapper.getResponse(false, {
                                                activity_id: activityId
                                            }, 200, req.body));
                                        } else {
                                            (activityId === 0) ?
                                            res.send(responseWrapper.getResponse(false, {
                                                    activity_id: 0
                                                }, -7998, req.body)):
                                                res.send(responseWrapper.getResponse(false, {
                                                    activity_id: 0
                                                }, -5998, req.body));
                                        }
                                    });
                                }
                            });

                            break;
                        default:
                            //console.log('generating activity id via default condition');
                            global.logger.write('conLog', 'Generating activity_id via default condition', {}, req.body);

                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {
                                        activity_id: activityId
                                    }, 200, req.body));
                                } else {
                                    (activityId === 0) ?
                                    res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0
                                        }, -7998, req.body)):
                                        res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0
                                        }, -5998, req.body));
                                }
                            });
                            break;
                    };
                    return;
                } else {
                    res.send(responseWrapper.getResponse(false, {
                        activity_id: 0
                    }, -3302, req.body));
                    return;
                }
                return;
            } else {
                res.send(responseWrapper.getResponse(false, {
                    activity_id: 0
                }, -3303, req.body));
                return;
            }
            //var parentActivityId = (req.body.activity_parent_id === 'undefined' || req.body.activity_parent_id === '' || req.body.activity_parent_id === null) ? 0 : Number(req.body.activity_parent_id);
        };

        try {
            JSON.parse(req.body.activity_inline_data);
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {
                activity_id: 0
            }, -3308, req.body));
            return;
        }

        if ((util.hasValidGenericId(req.body, 'asset_message_counter')) && deviceOsId !== 5 && deviceOsId !== 6) {
            cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                if (err) {
                    res.send(responseWrapper.getResponse(false, {
                        activity_id: 0
                    }, -7998, req.body));
                } else {
                    if (status) { // proceed
                        // console.log("calling proceedAddActivity");
                        global.logger.write('conLog', 'Calling proceedAddActivity', {}, req.body);

                        proceedAddActivity();
                    } else { // get the activity id using message unique id and send as response
                        cacheWrapper.getMessageUniqueIdLookup(req.body.message_unique_id, function (err, activityId) {
                            if (err) {
                                res.send(responseWrapper.getResponse(false, {
                                    activity_id: 0
                                }, -7998, req.body));
                            } else {
                                res.send(responseWrapper.getResponse(false, {
                                    activity_id: Number(activityId)
                                }, 200, req.body));
                            }
                        });
                    }
                }
            });
        } else if (deviceOsId === 5 || deviceOsId === 6) {
            proceedAddActivity();
        } else {
            res.send(responseWrapper.getResponse(false, {
                activity_id: 0
            }, -3304, req.body));
        }

    });


    //Add Activity New Version
    app.post('/' + global.config.version + '/activity/add/v1', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedAddActivity = function () {
            global.logger.write('conLog', 'Came into proceedAddActivity() ', {}, req.body);

            if (util.hasValidGenericId(req.body, 'activity_type_category_id')) {
                if (util.hasValidGenericId(req.body, 'activity_type_id')) {
                    var activityTypeCategoryId = Number(req.body.activity_type_category_id);
                    var parentActivityId = util.replaceZero(req.body.activity_parent_id);
                    switch (activityTypeCategoryId) {
                        case 29: // Co-worker Contact Card - supplier
                        case 6: // Co-worker Contact Card - customer                                 
                            assetService.addAsset(req.body, function (err, data, statusCode) {
                                if (err === false) {
                                    if (statusCode === 200) { // go ahead and create a contact activity id
                                        var newAssetId = data.asset_id;
                                        var newDeskAssetId = data.desk_asset_id;

                                        if (data.hasOwnProperty('activity_id')) {
                                            // Do not create the activity and return the existing details
                                            console.log('\x1b[36m Activity ID Exists \x1b[0m', );
                                            res.send(responseWrapper.getResponse(false, data, 200, req.body));
                                            return;
                                        }                                      
                                        
                                        // If no activity_id exists for this phone number
                                        var contactJson = eval('(' + req.body.activity_inline_data + ')');
                                        contactJson['contact_asset_id'] = newDeskAssetId;
                                        req.body.activity_inline_data = JSON.stringify(contactJson);
                                        addActivity(req.body, function (err, activityId) {
                                            if (err === false) {
                                                var responseDataCollection = {
                                                    asset_id: newAssetId,
                                                    desk_asset_id: newDeskAssetId,
                                                    activity_id: activityId
                                                };
                                                res.send(responseWrapper.getResponse(false, responseDataCollection, 200, req.body));
                                            } else {
                                                global.logger.write('debug', err, err, req);
                                                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                                            }
                                        });
                                    } else {
                                        res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
                                        return;
                                    }

                                } else {
                                    //console.log('did not get proper rseponse');
                                    global.logger.write('debug', err, err, req.body);

                                    res.send(responseWrapper.getResponse(err, {}, statusCode, req.body));
                                    return;
                                }
                            }.bind(this));
                            break;
                        case 8: // mail
                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {
                                        activity_id: activityId
                                    }, 200, req.body));
                                    return;
                                } else {
                                    (activityId === 0) ?
                                    res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0
                                        }, -7998, req.body)):
                                        res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0
                                        }, -5998, req.body));
                                    return;
                                }
                            });

                            break;
                        case 9: // form                        
                            //generate a form transaction id first and give it back to the client along with new activity id
                            cacheWrapper.getFormTransactionId((err, formTransactionId) => {
                                if (err) {                                    
                                    global.logger.write('serverError', err, err, req);
                                    res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998, req.body));
                                    return;
                                } else {
                                    req.body['form_transaction_id'] = formTransactionId;
                                    
                                    addActivity(req.body, (err, activityId) => {
                                        if (err === false) {
                                            res.send(responseWrapper.getResponse(false, {activity_id: activityId,
                                                                                         form_transaction_id: formTransactionId
                                                                                        }, 200, req.body));
                                        } else {
                                            (activityId === 0) ?
                                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -7998, req.body)):
                                                res.send(responseWrapper.getResponse(false, {activity_id: 0}, -5998, req.body));
                                        }
                                    });
                                }
                            });
                            break;
                        case 10: //FILE and TASK LIST BETA
                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {
                                        activity_id: activityId,
                                        message_unique_id: req.body.message_unique_id
                                    }, 200, req.body));
                                } else {
                                    (activityId === 0) ?
                                    res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0,
                                            message_unique_id: req.body.message_unique_id
                                        }, -7998, req.body)):
                                        res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0,
                                            message_unique_id: req.body.message_unique_id
                                        }, -5998, req.body));
                                }
                            });
                            break;

                        case 16: // Chats
                            // 
                            // req.body.asset_id       => Creator
                            // req.body.owner_asset_id => Owner
                            // 
                            // Sanity check
                            // 0. This service uses auth_asset_id for token authentication
                            // 
                            /*if (!req.body.hasOwnProperty('auth_asset_id')) {
                                let data = 'Please use the request parameter auth_asset_id for token authentication.';
                                res.send(responseWrapper.getResponse(true, data, -3206, req.body));
                                return;
                            }
                            // 1. The owner_asset_id must exist and must be non-zero
                            // 
                            if (!req.body.hasOwnProperty('owner_asset_id') || Number(req.body.owner_asset_id) === 0) {
                                let data = 'The request parameter owner_asset_id must exist and must be non-zero.';
                                res.send(responseWrapper.getResponse(true, data, -3206, req.body));
                                return;
                            }
                            // 2. Check if asset_id (Creator) is less than the owner_asset_id (Owner).
                            // 
                            if (Number(req.body.asset_id) > Number(req.body.owner_asset_id)) {
                                let data = 'The asset_id (Creator) must be less than the owner_asset_id (Owner).';
                                res.send(responseWrapper.getResponse(true, data, -3206, req.body));
                                return;
                            } */
                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {
                                        activity_id: activityId,
                                        message_unique_id: req.body.message_unique_id
                                    }, 200, req.body));
                                } else {
                                    global.logger.write('debug', err, err, req);

                                    (activityId === 0) ?
                                    res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0,
                                            message_unique_id: req.body.message_unique_id
                                        }, -7998, req.body)):
                                        res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0,
                                            message_unique_id: req.body.message_unique_id
                                        }, -5998, req.body));
                                }
                            });
                            break;

                        case 37: //Reservation PAM                   
                            cacheWrapper.getActivityId(function (err, activityId) {
                                if (err) {
                                    // console.log(err);
                                    global.logger.write('debug', err, err, req);

                                    callback(true, 0);
                                    return;
                                } else {
                                    // console.log('Request Parameters : ' + req.body);
                                    global.logger.write('conLog', 'Request Parameters: ' + JSON.stringify(req.body, null, 2), {}, req.body);

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
                            fs.readFile(`${__dirname}/../utils/pamConfig.txt`, function (err, data) {
                                if (err) {
                                    //  console.log(err)   
                                    global.logger.write('debug', err, err, req.body);

                                } else {
                                    threshold = Number(data.toString());
                                    req.body.activity_sub_type_id = threshold;
                                    addActivity(req.body, function (err, activityId) {
                                        if (err === false) {
                                            res.send(responseWrapper.getResponse(false, {
                                                activity_id: activityId
                                            }, 200, req.body));
                                        } else {
                                            (activityId === 0) ?
                                            res.send(responseWrapper.getResponse(false, {
                                                    activity_id: 0
                                                }, -7998, req.body)):
                                                res.send(responseWrapper.getResponse(false, {
                                                    activity_id: 0
                                                }, -5998, req.body));
                                        }
                                    });
                                }
                            });

                            break;
                        default:
                            //console.log('generating activity id via default condition');
                            global.logger.write('conLog', 'Generating activity_id via default condition', {}, req.body);

                            addActivity(req.body, function (err, activityId) {
                                if (err === false) {
                                    res.send(responseWrapper.getResponse(false, {
                                        activity_id: activityId
                                    }, 200, req.body));
                                } else {
                                    (activityId === 0) ?
                                    res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0
                                        }, -7998, req.body)):
                                        res.send(responseWrapper.getResponse(false, {
                                            activity_id: 0
                                        }, -5998, req.body));
                                }
                            });
                            break;
                    };
                    return;
                } else {
                    res.send(responseWrapper.getResponse(false, {
                        activity_id: 0
                    }, -3302, req.body));
                    return;
                }
                return;
            } else {
                res.send(responseWrapper.getResponse(false, {
                    activity_id: 0
                }, -3303, req.body));
                return;
            }
            //var parentActivityId = (req.body.activity_parent_id === 'undefined' || req.body.activity_parent_id === '' || req.body.activity_parent_id === null) ? 0 : Number(req.body.activity_parent_id);
        };

        try {
            JSON.parse(req.body.activity_inline_data);
        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {
                activity_id: 0
            }, -3308, req.body));
            return;
        }

        if ((util.hasValidGenericId(req.body, 'asset_message_counter')) && deviceOsId !== 5 && deviceOsId !== 6) {
            cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                if (err) {
                    global.logger.write('debug', err, err, req);

                    res.send(responseWrapper.getResponse(false, {
                        activity_id: 0
                    }, -7998, req.body));
                } else {
                    if (status) { // proceed
                        //console.log("calling proceedAddActivity");
                        global.logger.write('conLog', 'calling proceedAddActivity', {
                            status
                        }, req.body);

                        proceedAddActivity();
                    } else { // get the activity id using message unique id and send as response
                        cacheWrapper.getMessageUniqueIdLookup(req.body.message_unique_id, async function (err, activityId) {
                            if (err) {
                                res.send(responseWrapper.getResponse(false, {
                                    activity_id: 0
                                }, -7998, req.body));
                            } else {
                                let formTransactionID = 0;
                                try {
                                    if (Number(req.body.activity_type_category_id) === 9) {
                                        const activityData = await activityCommonService.getActivityDetailsPromise(req.body, Number(activityId));
                                        if (Number(activityData.length) > 0) {
                                            formTransactionID = activityData[0].form_transaction_id;
                                        }
                                    }
                                } catch (error) {
                                    // Nothing
                                }

                                res.send(responseWrapper.getResponse(false, {
                                    activity_id: Number(activityId),
                                    form_transaction_id: formTransactionID === 0 ? undefined : formTransactionID
                                }, 200, req.body));
                            }
                        });
                    }
                }
            });
        } else if (deviceOsId === 5 || deviceOsId === 6) {
            proceedAddActivity();
        } else {
            res.send(responseWrapper.getResponse(false, {
                activity_id: 0
            }, -3304, req.body));
        }

    });

    var addActivity = function (req, callback) {
        cacheWrapper.getActivityId(function (err, activityId) {
            if (err) {
                console.log(err);
                global.logger.write('conLog', err, err, req);

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
                queueWrapper.raiseActivityEvent(event, activityId, (err, resp) => {
                    if (err) {
                        // console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                        global.logger.write('serverError', 'Error in queueWrapper raiseActivityEvent', err, {});

                        callback(true, 1);

                    } else {
                        if (req.hasOwnProperty('device_os_id')) {
                            if (Number(req.device_os_id) !== 5) {
                                //incr the asset_message_counter                        
                                cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                    if (err) {
                                        //console.log("error in setting in asset parity");
                                        global.logger.write('serverError', 'error in setting asset parity', err, req);

                                    } else
                                        //console.log("asset parity is set successfully")
                                        global.logger.write('debug', "asset parity is set successfully", {}, req);

                                });
                            }
                        }
                        // console.log("new activityId is : " + activityId);
                        global.logger.write('debug', "New activityId is :" + activityId, {}, req);

                        callback(false, activityId);
                    }
                });

                /*console.log("new activityId is : " + activityId);
                global.logger.write('debug',"new activityId is :" + activityId,{},req);
                callback(false, activityId);*/
            }

        });
    };

    app.post('/' + global.config.version + '/activity/status/alter', function (req, res) {
        var assetMessageCounter = 0;
        var deviceOsId = 0;
        var activityData = {
            activity_id: req.body.activity_id,
            message_unique_id: req.body.message_unique_id
        }; //BETA
        
        //global.logger.write('DEBUG', 'Request Parameters: ' + JSON.stringify(req.body, null, 2), {}, req.body);
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
            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
                if (err) {
                    //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                    global.logger.write('serverError', "Error in queueWrapper raiseActivityEvent", err, req.body);

                    res.send(responseWrapper.getResponse(true, activityData, -5999, req.body));
                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                } else {
                    if (req.hasOwnProperty('device_os_id')) {
                        if (Number(req.device_os_id) !== 5) {
                            //incr the asset_message_counter                        
                            cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                if (err) {
                                    //console.log("error in setting in asset parity");
                                    global.logger.write('serverError', "error in setting asset parity", err, req.body);

                                } else
                                    //console.log("asset parity is set successfully")
                                    global.logger.write('debug', "asset parity is set successfully", {}, req.body);

                            });
                        }
                    }
                    res.send(responseWrapper.getResponse(false, activityData, 200, req.body));
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
                                res.send(responseWrapper.getResponse(false, activityData, -7998, req.body));
                            } else {
                                if (status) { // proceed
                                    proceedActivityStatusAlter();
                                } else { // this is a duplicate hit,
                                    res.send(responseWrapper.getResponse(false, activityData, 200, req.body));
                                }
                            }
                        });
                    } else if (deviceOsId === 5) {
                        proceedActivityStatusAlter();
                    } else {
                        res.send(responseWrapper.getResponse(false, activityData, -3304, req.body));
                    }
                } else {
                    res.send(responseWrapper.getResponse(false, activityData, -3306, req.body));
                }

            } else {
                res.send(responseWrapper.getResponse(false, activityData, -3301, req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, activityData, -3303, req.body));
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

    app.post('/' + global.config.version + '/activity/access/owner_rating/set', function (req, res) {
        activityService.updateOwnerRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/access/lead_rating/set', function (req, res) {
        activityService.updateLeadRating(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });    
    
    
    app.post('/' + global.config.version + '/activity/form/field/validation/set', function (req, res) {
   	 activityService.updateActivityFormFieldValidation(req.body).then((data)=>{   
   		global.logger.write('conLog', "VALIDATION SET : RESPONSE : " + data, {}, req);
   		//res.send(responseWrapper.getResponse({}, data, 200, req.body));
   	}).catch((err) => { 
   		data = {};
   		res.send(responseWrapper.getResponse(err, data, -999, req.body));
       	});
   	 
   	 	res.send(responseWrapper.getResponse({}, {}, 200, req.body));
   });
    
    // app.post('/' + global.config.version + '/test/workflow/queue/mapping/set', function (req, res) {
    //     activityService.updateWorkflowQueueMapping(req.body)
    //         .then((data) => {
    //             // console.log("Data: ", data)
    //             res.send(responseWrapper.getResponse({}, data, 200, req.body));
    //         })
    //         .catch((err) => {
    //             let data = {};
    //             res.send(responseWrapper.getResponse(err, data, -999, req.body));
    //         });

    //     // res.send(responseWrapper.getResponse({}, {}, 200, req.body));
    // });

    app.post('/' + global.config.version + '/activity/workflow/get_percentage', function (req, res) {
        activityService.getWorkflowPercentage(req.body)
            .then((data) => {
                // console.log("Data: ", data)
                res.send(responseWrapper.getResponse({}, data, 200, req.body));
            })
            .catch((err) => {
                let data = {};
                res.send(responseWrapper.getResponse(err, data, -999, req.body));
            });

        // res.send(responseWrapper.getResponse({}, {}, 200, req.body));
    });

    //Rollback Global Form
    app.post('/' + global.config.version + '/activity/status/roll_back', async function (req, res) {
        const [err, responseData] = await activityService.handleRollBackFormSubmissionV1(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/activity/status/roll_back | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });


    app.post('/' + global.config.version + '/activity/asset/mention/count/update', async (req, res) =>{
        const [err, responseData] = await activityService.updateMentionsCntArr(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/activity/asset/mention/count/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });
    
    
    app.post('/' + global.config.version + '/activity/calendar/event/update', async (req, res) =>{
        const [err, responseData] = await activityService.updateCalendarEventDates(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("/activity/calendar/event/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/expression/update', async (req, res) =>{
        const [err, responseData] = await activityService.activityUpdateExpression(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/expression/update | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.sqlMessage }, err.errno, req.body));
        }
    });
    
    app.post('/' + global.config.version + '/activity/bulk-summary/add', async (req, res) =>{
        const [err, responseData] = await activityService.addBulkSummary(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/bulk-summary/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, { message: err.sqlMessage }, err.errno, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/search/mapping/insert', async function (req, res) {
        
        const [err,result] = await activityService.activityTypeMappingInsert(req.body);
        if(!err){
        res.send(responseWrapper.getResponse(false, result, 200, req.body));
    }else{            
        res.send(responseWrapper.getResponse(err, {}, -9999, req.body));
    }        
   });

   app.post('/' + global.config.version + '/activity/search/mapping/delete', async function (req, res) {
        
    const [err,result] = await activityService.activityTypeMappingDelete(req.body);
    if(!err){
    res.send(responseWrapper.getResponse(false, result, 200, req.body));
     }else{            
    res.send(responseWrapper.getResponse(err, {}, -9999, req.body));
    }        
    });
   app.post('/' + global.config.version + '/activity/search/mapping/select', async function (req, res) {
        
    const [err,result] = await activityService.activityTypeMappingSearch(req.body);
    if(!err){
    res.send(responseWrapper.getResponse(false, result, 200, req.body));
    }else{            
    res.send(responseWrapper.getResponse(err, {}, -9999, req.body));
    }        
    });

    app.post('/' + global.config.version + '/activity/search/mapping/select/V1', async function (req, res) {
        
        const [err,result] = await activityService.activityTypeMappingSearchV1(req.body);
        if(!err){
        res.send(responseWrapper.getResponse(false, result, 200, req.body));
        }else{            
        res.send(responseWrapper.getResponse(err, {}, -9999, req.body));
        }        
        });

    app.post("/" + global.config.version + "/activity/form/insert",async function (req, res) {
        req.body.activity_inline_data = JSON.parse(req.body.activity_inline_data);
        const [err, result] = await activityService.activityFormListInsert(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9999, req.body));
        }
    });      
     
}


module.exports = ActivityController;
