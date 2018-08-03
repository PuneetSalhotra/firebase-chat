/*
 * author: Sri Sai Venkatesh
 */

function ActivityUpdateService(objectCollection) {

    var db = objectCollection.db;
    var cacheWrapper = objectCollection.cacheWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var util = objectCollection.util;
    var activityPushService = objectCollection.activityPushService;
    var queueWrapper = objectCollection.queueWrapper;
    
    var makeRequest = require('request');

    var activityListUpdateInline = function (request, callback) {

        var paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                (request.activity_inline_data)
                );

        var queryString = util.getQueryString('ds_v1_activity_list_update_inline_data', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, false);
                    //console.log(err);
                    return;
                }
            });
        }
    };

    var activityListUpdateCover = function (request, callback) {
        var coverJson = JSON.parse(request.activity_cover_data);
        var paramsArr = new Array();
        var queryString = '';
        /*if(coverJson.hasOwnProperty('activity_owner_asset_id')) {
         paramsArr = new Array(
         request.activity_id,
         request.organization_id,
         coverJson.title.new,
         coverJson.description.new,
         coverJson.duedate.new,
         coverJson.activity_owner_asset_id.new,
         request.activity_inline_data,
         request.flag,
         request.asset_id,
         request.datetime_log
         );
         queryString = util.getQueryString('ds_v1_activity_list_update_owner_data', paramsArr);
         } else */

        if (coverJson.hasOwnProperty('start_date')) {
            paramsArr = new Array(
                    request.activity_id,
                    request.organization_id,
                    coverJson.title.new,
                    coverJson.description.new,
                    coverJson.start_date.new,
                    coverJson.duedate.new,
                    request.asset_id,
                    request.datetime_log
                    );
            queryString = util.getQueryString('ds_v1_activity_list_update_calender_cover', paramsArr);
        } else if (coverJson.hasOwnProperty('activity_completion_percentage')) {
            paramsArr = new Array(
                    request.activity_id,
                    request.organization_id,
                    coverJson.title.new,
                    coverJson.description.new,
                    coverJson.duedate.new,
                    coverJson.activity_completion_percentage.new,
                    request.asset_id,
                    request.datetime_log
                    );

            queryString = util.getQueryString('ds_v1_1_activity_list_update', paramsArr);
        } else {
            paramsArr = new Array(
                    request.activity_id,
                    request.organization_id,
                    coverJson.title.new,
                    coverJson.description.new,
                    coverJson.duedate.new,
                    request.asset_id,
                    request.datetime_log
                    );

            queryString = util.getQueryString('ds_v1_activity_list_update', paramsArr);
        }

        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, false);
                    //console.log(err);
                    return;
                }
            });
        }
        /*
         var coverJson = JSON.parse(request.activity_cover_data);
         
         if (coverJson.hasOwnProperty('title')) {
         //update activity title
         updateActivityTitle(request, coverJson.title.new, function (err, data) {
         if (err === false) {
         activityCommonService.activityListHistoryInsert(request, 12, function (err, result) {
         
         });
         assetActivityListUpdateCover(request, 12, coverJson.title.new, function (err, data) {
         
         });
         }
         });
         }
         
         if (coverJson.hasOwnProperty('description')) {
         //update activity title
         updateActivityDescription(request, coverJson.description.new, function (err, data) {
         if (err === false) {
         activityCommonService.activityListHistoryInsert(request, 13, function (err, result) {
         
         });
         assetActivityListUpdateCover(request, 13, function (err, data) {
         
         });
         }
         });
         }
         
         if (coverJson.hasOwnProperty('duedate')) {
         //update activity due-date
         updateActivityDuedate(request, coverJson.duedate.new, function (err, data) {
         if (err === false) {
         activityCommonService.activityListHistoryInsert(request, 14, function (err, result) {
         
         });
         
         assetActivityListUpdateCover(request, 14, coverJson.duedate.new, function (err, data) {
         
         });
         }
         });
         }
         callback(false, true);
         */
    };

    //BETA
    var activityListAlterOwner = function (request, callback) {
        paramsArr = new Array(
                request.activity_id,
                request.owner_asset_id,
                request.organization_id,
                request.activity_inline_data,
                request.flag,
                request.asset_id,
                request.datetime_log
                );
        queryString = util.getQueryString('ds_v1_activity_list_update_owner', paramsArr);

        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, false);
                    //console.log(err);
                    return;
                }
            });
        }
    };


    //BETA
    var assetActivityListUpdateOwner = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        activityCommonService.getAllParticipants(request, function (err, participantsData) {
            if (err === false && participantsData.length > 0) {
                participantsData.forEach(function (rowData, index) {
                    paramsArr = new Array(
                            request.activity_id,
                            rowData.asset_id,
                            request.owner_asset_id,
                            request.organization_id,
                            request.activity_inline_data,
                            request.flag,
                            request.asset_id,
                            request.datetime_log
                            );

                    queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_owner', paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                //callback(true, false);
                            } else {
                                // some thing is wrong and have to be dealt
                                //callback(true, false);
                            }
                        });
                    }
                }, this);
                callback(false, true);
            } else {
                callback(true, false);
            }
        });
    };

    //PAM
    var activityListUpdateChannel = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                request.channel_activity_id,
                request.channel_activity_type_category_id,
                request.asset_id,
                request.datetime_log
                );

        queryString = util.getQueryString('ds_v1_activity_list_update_channel', paramsArr);

        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, false);
                    //console.log(err);
                    return;
                }
            });
        }
    };

    //PAM
    function activityListUpdateSubtype(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array();
            var queryString = '';
            paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    request.activity_id,
                    request.activity_sub_type_id,
                    request.activity_sub_type_name,
                    request.asset_id,
                    request.datetime_log
                    );
            queryString = util.getQueryString('ds_v1_activity_list_update_sub_type', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve() : reject(err);
                });
            }
        });
    }
    ;

    var updateActivityTitle = function (request, newActivityTitle, callback) {

        var paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                newActivityTitle,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_activity_list_update_title', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, false);
                    //console.log(err);
                    return;
                }
            });
        }
    };

    var updateActivityDuedate = function (request, newDuedate, callback) {

        var paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                newDuedate,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_activity_list_update_deferred_datetime', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, false);
                    //console.log(err);
                    return;
                }
            });
        }
    };

    var updateActivityDescription = function (request, newDescription, callback) {

        var paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                newDescription,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_activity_list_update_description', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, false);
                    //console.log(err);
                    return;
                }
            });
        }
    };

    var assetActivityListUpdateCover = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        var dbCall = '';
        var coverJson = JSON.parse(request.activity_cover_data);
        activityCommonService.getAllParticipants(request, function (err, participantsData) {
            if (err === false && participantsData.length > 0) {
                participantsData.forEach(function (rowData, index) {
                    /*if(coverJson.hasOwnProperty('activity_owner_asset_id')) {
                     dbCall ='ds_v1_activity_asset_mapping_update_owner_data';
                     paramsArr = new Array(
                     request.activity_id,
                     rowData.asset_id,
                     request.organization_id,
                     coverJson.title.new,
                     coverJson.description.new,
                     coverJson.duedate.new,
                     coverJson.activity_owner_asset_id.new,
                     request.activity_inline_data,
                     request.flag,
                     request.asset_id,
                     request.datetime_log
                     );
                     } else */

                    if (coverJson.hasOwnProperty('start_date')) {
                        dbCall = 'ds_v1_activity_asset_mapping_update_calendar_cover';
                        paramsArr = new Array(
                                request.activity_id,
                                rowData.asset_id,
                                request.organization_id,
                                coverJson.title.new,
                                coverJson.description.new,
                                coverJson.start_date.new,
                                coverJson.duedate.new,
                                request.asset_id,
                                request.datetime_log
                                );
                    } else if (coverJson.hasOwnProperty('activity_completion_percentage')) {
                        dbCall = 'ds_v1_1_activity_asset_mapping_update';
                        paramsArr = new Array(
                                request.activity_id,
                                rowData.asset_id,
                                request.organization_id,
                                coverJson.title.new,
                                coverJson.description.new,
                                coverJson.duedate.new,
                                coverJson.activity_completion_percentage.new,
                                request.asset_id,
                                request.datetime_log
                                );
                    } else {
                        dbCall = 'ds_v1_activity_asset_mapping_update';
                        paramsArr = new Array(
                                request.activity_id,
                                rowData.asset_id,
                                request.organization_id,
                                coverJson.title.new,
                                coverJson.description.new,
                                coverJson.duedate.new,
                                request.asset_id,
                                request.datetime_log
                                );
                    }

                    //queryString = util.getQueryString('ds_v1_activity_asset_mapping_update', paramsArr);
                    queryString = util.getQueryString(dbCall, paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                //callback(true, false);
                            } else {
                                // some thing is wrong and have to be dealt
                                //callback(true, false);
                            }
                        });
                    }
                }, this);
                callback(false, true);
            } else {
                callback(true, false);
            }
        });
    };

    //PAM
    var assetActivityListUpdateChannel = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        activityCommonService.getAllParticipants(request, function (err, participantsData) {
            if (err === false && participantsData.length > 0) {
                participantsData.forEach(function (rowData, index) {
                    paramsArr = new Array(
                            request.organization_id,
                            request.account_id,
                            request.workforce_id,
                            request.activity_id,
                            rowData.asset_id,
                            request.channel_activity_id,
                            request.channel_activity_type_category_id,
                            request.asset_id,
                            request.datetime_log
                            );
                    queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_channel', paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                //callback(true, false);
                            } else {
                                // some thing is wrong and have to be dealt
                                //callback(true, false);
                            }
                        });
                    }
                }, this);
                callback(false, true);
            } else {
                callback(true, false);
            }
        });
    };

    //PAM
    function assetActivityListUpdateSubtype(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array();
            var queryString = '';
            activityCommonService.getAllParticipants(request, function (err, participantsData) {
                if (err === false && participantsData.length > 0) {
                    participantsData.forEach(function (rowData, index) {
                        paramsArr = new Array(
                                request.organization_id,
                                request.account_id,
                                request.workforce_id,
                                request.activity_id,
                                rowData.asset_id,
                                request.activity_sub_type_id,
                                request.activity_sub_type_name,
                                request.asset_id,
                                request.datetime_log
                                );
                        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_sub_type', paramsArr);
                        if (queryString != '') {
                            db.executeQuery(0, queryString, request, function (err, data) {
                                if (err === false) {
                                    //callback(true, false);
                                } else {
                                    // some thing is wrong and have to be dealt
                                    //callback(true, false);
                                }
                            });
                        }
                    }, this);
                    resolve();
                } else {
                    reject(err);
                }
            });
        })
    }
    ;

    //assetActivityListUpdateSubTaskCover
    var assetActivityListUpdateSubTaskCover = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        var coverJson = JSON.parse(request.activity_cover_data);
        paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                0, 50
                );
        queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_sub_tasks', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false && data.length > 0) {
                    //console.log(data);
                    data.forEach(function (rowData, index) {
                        paramsArr = new Array(
                                data.activity_id,
                                rowData.asset_id,
                                request.organization_id,
                                request.activity_id,
                                coverJson.title.new,
                                coverJson.description.new,
                                coverJson.duedate.new,
                                rowData.asset_id,
                                request.datetime_log
                                );
                        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_parent', paramsArr);
                        queryString = '';
                        if (queryString != '') {
                            db.executeQuery(0, queryString, request, function (err, data) {
                                if (err === false) {
                                    callback(true, false);
                                } else {
                                    // some thing is wrong and have to be dealt
                                    callback(true, false);
                                }
                            });
                        }
                    }, this);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, false);
                }
            });
        }
        callback(false, true);
    };

    var assetActivityListUpdateInline = function (request, callback) {

        var paramsArr = new Array();
        activityCommonService.getAllParticipants(request, function (err, participantsData) {
            if (err === false) {
                participantsData.forEach(function (rowData, index) {
                    paramsArr = new Array(
                            request.activity_id,
                            rowData['asset_id'],
                            request.organization_id,
                            request.activity_inline_data
                            );
                    queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_inline_data', paramsArr);
                    db.executeQuery(0, queryString, request, function (error, queryResponse) {

                    });
                }, this);
                callback(false, true);
                return;
            } else {
                // some thing is wrong and have to be dealt
                callback(true, false);
                return;
            }
        });
    };

    var assetActivityListUpdateParent = function (request, assetId, callback) {
        var paramsArr = new Array();
        var queryString = '';
        if (Number(assetId) > 0) {
            paramsArr = new Array(
                    request.activity_id,
                    assetId,
                    request.organization_id,
                    request.activity_parent_id,
                    request.asset_id,
                    request.datetime_log
                    );
            queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_parent_details', paramsArr);
            db.executeQuery(0, queryString, request, function (error, queryResponse) {
                if (error === false) {
                    callback(false, true);
                } else
                    callback(true, false);
            });
        } else {
            activityCommonService.getAllParticipants(request, function (err, participantsData) {
                if (err === false && participantsData.length > 0) {
                    participantsData.forEach(function (rowData, index) {
                        paramsArr = new Array(
                                request.activity_id,
                                rowData.asset_id,
                                request.organization_id,
                                request.activity_parent_id,
                                request.asset_id,
                                request.datetime_log
                                );
                        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_parent_details', paramsArr);
                        db.executeQuery(0, queryString, request, function (error, queryResponse) { });
                    }, this);
                    callback(false, true);
                } else {
                    callback(false, false);
                }
            });
        }
    };


    this.alterActivityInline = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id);

        activityCommonService.updateAssetLocation(request, function (err, data) {});

        activityListUpdateInline(request, function (err, data) {
            if (err === false) {
                assetActivityListUpdateInline(request, function (err, data) {
                    if (err === false) {
                        //Switch - Case Added by Nani Kalyan
                        switch (activityTypeCategoryId) {
                            case 4: //Id Card
                                activityStreamTypeId = 102;
                                // Call the edit name portal service
                                break;
                            case 5: //Co-worker Contact Card
                                activityStreamTypeId = 210; //Beta
                                break;
                            case 6: //Customer Contact Card
                                activityStreamTypeId = 1105;
                                break;
                            case 29: //Supplier Contact Card
                                activityStreamTypeId = 1205;
                                break;

                            case 8: // Mail
                                activityStreamTypeId = 1705;
                                break;
                            case 15: //Video Conference
                                activityStreamTypeId = 1607;
                                break;
                            case 28: //Post it
                                activityStreamTypeId = 904;
                                break;
                            case 31: //Calendar Event
                                activityStreamTypeId = 507;
                                break;
                            default:
                                activityStreamTypeId = 1705;   //by default so that we know
                                //console.log('adding streamtype id 1705');
                                global.logger.write('debug', 'adding streamtype id 1705', {}, request)
                                break;
                        }

                        activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });
                        activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });

                        //callback(false, {}, 200);
                        //callback(false, true);

                    } else {
                        //callback(false, {}, -9999);
                        //callback(false, true);
                    }
                });
                activityCommonService.activityListHistoryInsert(request, 404, function (err, result) { });
                activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) { });
                activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) { });
                
                if (Number(request.activity_type_category_id) === 4) {    // id card inline update
                    assetListUpdate(request, function (err, data) {});   //opearating asset id
                    
                    var empIdJson = JSON.parse(request.activity_inline_data);
                    //empIdJson.employee_asset_id = request.asset_id;                  
                    
                    var newRequest = {};
                    newRequest.asset_id = request.asset_id;
                    newRequest.organization_id =  request.organization_id;
                    newRequest.workforce_id =  request.workforce_id;
                    newRequest.account_id= request.account_id;
                    newRequest.asset_first_name=  empIdJson.employee_first_name;
                    newRequest.asset_last_name = empIdJson.employee_last_name; 
                    newRequest.description = empIdJson.employee_designation;
                    newRequest.old_phone_number = empIdJson.employee_phone_number;
                    newRequest.old_country_code = empIdJson.employee_phone_country_code;
                    newRequest.phone_number = empIdJson.employee_phone_number;
                    newRequest.country_code = empIdJson.employee_phone_country_code;
                    newRequest.location_latitude = request.track_latitude;
                    newRequest.location_longitude = request.track_longitude;
                    newRequest.location_address = request.track_gps_datetime;
                    newRequest.activity_id = request.activity_id;
                    newRequest.activity_inline_data = request.activity_inline_data;
                    newRequest.message_unique_id = request.message_unique_id; 
                    
                    console.log('newRequest: ', newRequest);
                    
                    var options = {
                        form : newRequest
                      }
                                  
                    makeRequest.post('https://portal.desker.cloud/r1/asset/update/details', options, function (error, response, body) {
                          console.log('body:', body);
                          body = JSON.parse(body);
                          console.log('error : ', error);
                          var resp = {
                              status: body.status,
                              service_id: body.service_id || 0,
                              gmt_time: body.gmt_time,
                              response: body.response
                          };
                          //res.send(resp);
                          console.log(resp);
                        });
                    
                    /*getCoWorkerActivityId(request, function (err, coworkerData) {
                        if (!err) {
                            try {
                                var inlineJson = JSON.parse(coworkerData[0].activity_inline_data);
                                assetListUpdateOperatingAsset(request, Number(coworkerData[0].asset_id), function (err, data) {});    // desk asset

                                newRequest.activity_id = coworkerData[0].activity_id;
                                newRequest.activity_type_category_id = coworkerData[0].activity_type_category_id;

                                inlineJson.contact_email_id = empIdJson.employee_email_id;
                                inlineJson.contact_profile_picture = empIdJson.employee_profile_picture;
                                newRequest.activity_inline_data = JSON.stringify(inlineJson);

                                //console.log('newRequest: ', newRequest)

                                var event = {
                                    name: "alterActivityInline",
                                    service: "activityUpdateService",
                                    method: "alterActivityInline",
                                    payload: newRequest
                                };

                                queueWrapper.raiseActivityEvent(event, data.activity_id, (err, resp) => {
                                    if (err) {
                                        console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                        //global.logger.write('serverError', "Error in queueWrapper raiseActivityEvent", err, request);
                                        //res.send(responseWrapper.getResponse(false, {}, -5999,req.body));
                                        throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                    } else {
                                    }
                                });
                            } catch (exception) {
                                console.log('Exception : ' + exception);
                                //res.send(responseWrapper.getResponse(false, {}, -3308,request.body));
                                return;
                            }
                        } else {
                            console.log(err)
                        }
                    }) */
                } //if category_id==4

            } else {
                //callback(err, {}, -9999);
                callback(false, true);
            }
        });
    }

    this.alterActivityCover = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        activityListUpdateCover(request, function (err, data) {
            if (err === false) {
                activityCommonService.activityListHistoryInsert(request, 403, function (err, result) {});
                assetActivityListUpdateCover(request, function (err, data) {
                    //Switch-CASE Added by Nani Kalyan
                    switch (activityTypeCategoryId) {
                        case 1:
                            activityStreamTypeId = 405;
                            break;
                        case 10: //File
                            activityStreamTypeId = 309;
                            break;
                        case 11: //Project
                            activityStreamTypeId = 1406;
                            break;
                        case 14: //Voice Call
                            activityStreamTypeId = 806;
                            break;
                        case 15: //Video Conference
                            activityStreamTypeId = 1606;
                            break;
                        case 31: //Calendar Event
                            activityStreamTypeId = 503;
                            break;
                        case 32: //Customer Request
                            activityStreamTypeId = 606;
                            break;
                        case 33: //Visitor Request
                            activityStreamTypeId = 1306;
                            break;
                        case 34: //Time Card
                            activityStreamTypeId = 1506;
                            break;
                            //PAM
                        case 36:    //Menu Item
                            activityStreamTypeId = 19003;
                            break;
                        case 37:    //Reservation
                            activityStreamTypeId = 18003;
                            break;
                        case 38:    //Item Order
                            activityStreamTypeId = 21003;
                            break;
                            //case 39:    //Inventory
                            //  activityStreamTypeId = 20001;
                            //break;
                        case 40:    //Payment
                            activityStreamTypeId = 22006;
                            break;
                        case 41:    //Event
                            activityStreamTypeId = 17003;
                            break;
                        default:
                            activityStreamTypeId = 1506;   //by default so that we know
                            //console.log('adding streamtype id 1506');
                            global.logger.write('debug', 'adding streamtype id 1506', {}, request)
                            break;
                    }
                    ;

                    activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });
                    activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });

                    //updating log differential datetime for only this asset
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {

                    });

                    //activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {

                    //});
                    //assetActivityListUpdateSubTaskCover(request, function (err, data) {}); facing some issues here, handle post alpha                    
                    activityPushService.sendPush(request, objectCollection, 0, function () {});
                    activityPushService.sendSMSNotification(request, objectCollection, request.asset_id, function () {});
                    
                    if (request.hasOwnProperty('activity_parent_id')) {
                        if (util.hasValidGenericId(request, 'activity_parent_id')) {
                            activityCommonService.getActivityDetails(request, Number(request.activity_parent_id), function (err, activityData) {
                                if (err === false) {
                                    switch (Number(activityData[0]['activity_type_category_id'])) {
                                        case 6:
                                        case 29:
                                        case 43:
                                        case 44:
                                            //update the p_parent_activity_id's end estimated datetime
                                            var coverAlterJson = {};
                                            coverAlterJson.title = {old: activityData[0]['activity_title'], new : activityData[0]['activity_title']};
                                            coverAlterJson.duedate = {old: activityData[0]['activity_title'], new : activityData[0]['activity_title']};
                                            // get the updated estimated datetime of project.
                                            var newParamsArr = new Array(
                                                    request.activity_parent_id,
                                                    request.workforce_id,
                                                    request.account_id,
                                                    request.organization_id,
                                                    0, 1
                                                    );
                                            var queryString = util.getQueryString('ds_p1_activity_list_select_project_tasks', newParamsArr);
                                            if (queryString != '') {
                                                db.executeQuery(1, queryString, request, function (err, result) {
                                                    if (err === false) {
                                                        var newEndEstimatedDatetime = result[0]['activity_datetime_end_estimated'];
                                                        console.log('setting new datetime for contact as ' + newEndEstimatedDatetime);
                                                        coverAlterJson.description = {old: activityData[0]['activity_datetime_end_estimated'], new : newEndEstimatedDatetime};

                                                        var event = {
                                                            name: "alterActivityCover",
                                                            service: "activityUpdateService",
                                                            method: "alterActivityCover",
                                                            payload: {
                                                                organization_id: request.organization_id,
                                                                account_id: request.account_id,
                                                                workforce_id: request.workforce_id,
                                                                asset_id: request.asset_id,
                                                                asset_token_auth: request.asset_token_auth,
                                                                activity_id: request.activity_parent_id,
                                                                activity_cover_data: JSON.stringify(coverAlterJson),
                                                                activity_type_category_id: activityData[0]['activity_type_category_id'],
                                                                activity_type_id: 1,
                                                                activity_access_role_id: 1,
                                                                activity_parent_id: 0,
                                                                flag_pin: 0,
                                                                flag_priority: 0,
                                                                flag_offline: 0,
                                                                flag_retry: 0,
                                                                message_unique_id: util.getMessageUniqueId(request.asset_id),
                                                                track_latitude: request.track_latitude,
                                                                track_longitude: request.track_longitude,
                                                                track_altitude: request.track_altitude,
                                                                track_gps_datetime: request.track_gps_datetime,
                                                                track_gps_accuracy: request.track_gps_accuracy,
                                                                track_gps_status: request.track_gps_status,
                                                                track_gps_location: request.track_gps_location,
                                                                service_version: request.service_version,
                                                                app_version: request.app_version,
                                                                device_os_id: request.device_os_id
                                                            }
                                                        };
                                                        queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
                                                            if (err) {
                                                                //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                                                global.logger.write('serverError', "Error in queueWrapper raiseActivityEvent", err, req);
                                                            }
                                                        });
                                                    }
                                                });
                                            }

                                            break;
                                    }

                                }
                            });
                        }

                    }// end parent activity id condition

                });

                callback(false, {}, 200);

                // if activity_type_category_id = 17 update asset image id also
                if (activityTypeCategoryId === 17 || activityTypeCategoryId === 12) {

                }

            } else {
                callback(err, {}, -9999);
            }
        });
        // call resource ranking...

    };

    //BETA
    this.alterActivityOwner = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        var activityStreamTypeId = 406;
        activityCommonService.updateAssetLocation(request, function (err, data) {});

        activityCommonService.getActivityDetails(request, 0, function (err, data) { //One
            if (err === false) {
                console.log('data[0].activity_owner_asset_id :' + data[0].activity_owner_asset_id);

                //creator asset id and lead asset id if it mathces 29 shouldn't be called
                
                var paramsArr = new Array(
                        request.activity_id,
                        data[0].activity_owner_asset_id,
                        request.organization_id,
                        29, //access_role_id,
                        request.asset_id,
                        request.datetime_log
                        );

                var queryString = util.getQueryString("ds_v1_activity_asset_mapping_update_asset_aceess", paramsArr);

                if (queryString != '') {
                    db.executeQuery(0, queryString, request, function (err, data) {
                        if (err === false) {
                            activityCommonService.assetActivityListHistoryInsert(request, 0, 503, function (err, result) {});
                        }
                    });
                    // checking if this is new row or an update
                    var participantData = {
                        asset_id: request.owner_asset_id,
                        organization_id: request.organization_id
                    };
                    var paramsArr1 = new Array();
                    var queryString1 = '';
                    activityCommonService.isParticipantAlreadyAssigned(participantData, request.activity_id, request, function (err, alreadyAssignedStatus, newRecordStatus) {
                        if ((err === false) && (newRecordStatus)) {
                            paramsArr1 = new Array(
                                    request.activity_id,
                                    request.owner_asset_id,
                                    request.workforce_id,
                                    request.account_id,
                                    request.organization_id,
                                    27, //request.participant_access_id,
                                    request.message_unique_id,
                                    request.flag_retry,
                                    request.flag_offline,
                                    request.asset_id,
                                    request.datetime_log,
                                    0, //Field Id
                                    '',
                                    -1
                                    );
                            queryString1 = util.getQueryString('ds_v1_activity_asset_mapping_insert_asset_assign_appr_ingre', paramsArr1);
                        }
                        if ((err === false) && (!newRecordStatus)) {
                            paramsArr1 = new Array(
                                    request.activity_id,
                                    participantData.asset_id,
                                    participantData.organization_id,
                                    0,
                                    request.asset_id,
                                    request.datetime_log
                                    );
                            queryString1 = util.getQueryString('ds_v1_activity_asset_mapping_update_reassign_participant_appr', paramsArr1);
                        }
                        if (queryString1 !== '') {
                            db.executeQuery(0, queryString1, request, function (err, data) {
                                //if(err === false) {
                                activityCommonService.assetActivityListHistoryInsert(request, 0, 0, function (err, restult) {});

                                activityListAlterOwner(request, function (err, data) {
                                    if (err === false) {
                                        activityCommonService.updateLeadAssignedDatetime(request, request.asset_id, function (err, data) {

                                        });
                                        activityCommonService.activityListHistoryInsert(request, 409, function (err, result) {});

                                        assetActivityListUpdateOwner(request, function (err, data) {

                                            activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });
                                            activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });
                                            //updating log differential datetime for only this asset
                                            activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {});
                                            //activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) { });
                                            //assetActivityListUpdateSubTaskCover(request, function (err, data) {}); facing some issues here, handle post alpha
                                            activityPushService.sendPush(request, objectCollection, 0, function () {});
                                            activityPushService.sendSMSNotification(request, objectCollection, request.owner_asset_id, function () {});
                                        })
                                        callback(false, {}, 200);
                                    }
                                })
                            });
                        }
                    });
                } //Two
            }
        });
    };

    //PAM
    this.alterActivityCoverChannelActivity = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        activityListUpdateChannel(request, function (err, data) {
            if (err === false) {
                activityCommonService.activityListHistoryInsert(request, 403, function (err, result) {});

                assetActivityListUpdateChannel(request, function (err, data) {
                    //Switch-CASE Added by Nani Kalyan
                    switch (activityTypeCategoryId) {
                        case 37: //Reservation
                            activityStreamTypeId = 18003;
                            break;
                        case 41: //Event
                            activityStreamTypeId = 17003;
                            break;
                        default:
                            activityStreamTypeId = 1;   //by default so that we know
                            //console.log('adding streamtype id 1506');
                            global.logger.write('debug', 'adding streamtype id 1', {}, request)
                            break;
                    }
                    ;

                    activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });
                    activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });
                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) { });
                });

                callback(false, {}, 200);

            } else {
                callback(err, {}, -9999);
            }
        });
    }

    //PAM
    this.alterCoverSubTypeActivity = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        activityListUpdateSubtype(request).then(() => {
            activityCommonService.activityListHistoryInsert(request, 411, function (err, result) {});
            assetActivityListUpdateSubtype(request).then(() => {
                switch (activityTypeCategoryId) {
                    case 38: //Reservation
                        activityStreamTypeId = 21005;
                        break;
                }
                ;
                activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });
                activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });
                activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});
                activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) { });
            });
            callback(false, {}, 200);
        }).catch(() => {
            callback(false, {}, -9999);
        })
    };

    var getCoWorkerActivityId = function (request, callback) {
        var paramsArr = new Array(
                request.asset_id,
                request.organization_id,
                5// activityTypeCategoryId is 5 for coworker activity
                //request.activity_type_category_id
                );
        var queryString = util.getQueryString('ds_v1_activity_list_select_category_contact', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, coworkerData) {
                if (err === false) {
                    callback(false, coworkerData);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    var assetListUpdate = function (request, callback) {
        var inlineJson = JSON.parse(request.activity_inline_data);
        var paramsArr = new Array(
                inlineJson.employee_asset_id,
                inlineJson.employee_organization_id,
                inlineJson.employee_email_id,
                inlineJson.employee_profile_picture,
                request.activity_inline_data,
                request.asset_id,
                request.datetime_log // server log date time
                );

        var queryString = util.getQueryString('ds_v1_asset_list_update', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    paramsArr = new Array(
                            inlineJson.employee_asset_id,
                            inlineJson.employee_organization_id,
                            205,
                            request.datetime_log // server log date time
                            );

                    queryString = util.getQueryString('ds_v1_asset_list_history_insert', paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            if (err === false) {
                                callback(false, true);

                            } else {
                                // some thing is wrong and have to be dealt
                                callback(err, false);
                            }
                        });
                    }

                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    var assetListUpdateOperatingAsset = function (request, deskAssetId, callback) {

        var paramsArr = new Array(
                deskAssetId,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.asset_id,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_asset_list_update_operating_asset', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, true);

                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    var activityListUpdateParent = function (request, callback) {

        activityCommonService.getActivityDetails(request, request.activity_parent_id, function (err, parentActivityData) {
            if (err === false) {
                var paramsArr = new Array(
                        request.activity_id,
                        request.organization_id,
                        request.activity_parent_id,
                        parentActivityData[0].activity_title,
                        parentActivityData[0].activity_type_id,
                        parentActivityData[0].activity_type_name,
                        parentActivityData[0].activity_type_category_id,
                        parentActivityData[0].activity_type_category_name,
                        request.asset_id,
                        request.datetime_log
                        );
                var queryString = util.getQueryString('ds_v1_activity_list_update_parent', paramsArr);
                db.executeQuery(0, queryString, request, function (error, queryResponse) {
                    if (err === false) {
                        callback(false, true);
                    } else {
                        callback(err, true);
                    }
                });
                return;
            } else {
                // some thing is wrong and have to be dealt
                callback(err, false);
                return;
            }
        });
    };


    this.alterActivityParent = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        var streamtypeId = 1302;
        switch (activityTypeCategoryId) {
            case 10:
                if (Number(request.activity_parent_id) === 0) {   // removed from a file
                    streamtypeId = 304;
                }
                if (Number(request.activity_parent_prev_id) === 0 && Number(request.activity_parent_id) !== 0) {  // added freshly to a project
                    streamtypeId = 302;
                }
                if (Number(request.activity_parent_prev_id) !== 0 && Number(request.activity_parent_id) !== 0) {  // moved from one project to another project
                    streamtypeId = 303;
                }
                break;
            case 11:
                break;
            default:
                break;
        }
        ;
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        if (activityTypeCategoryId === 6 || activityTypeCategoryId === 29) {  //altering parent for a contact card
            assetActivityListUpdateParent(request, request.asset_id, function (err, data) {
                if (err === false) {
                    activityCommonService.assetActivityListHistoryInsert(request, 0, 401, function (err, restult) {

                    });
                } else {
                    callback(err, false);
                    return;
                }
            });
        } else {
            activityListUpdateParent(request, function (err, data) {
                if (err === false) {
                    assetActivityListUpdateParent(request, 0, function (err, data) {

                    });
                    activityCommonService.activityListHistoryInsert(request, 401, function (err, restult) {

                    });
                    activityCommonService.activityTimelineTransactionInsert(request, {}, streamtypeId, function (err, data) {

                    });
                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {

                    });
                } else {
                    callback(err, false);
                    return;
                }
            });

        }
        activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {

        });
        activityCommonService.assetTimelineTransactionInsert(request, {}, streamtypeId, function (err, data) {

        });
        /*if (request.hasOwnProperty('device_os_id')) {
         if (Number(request.device_os_id) !== 5) {
         //incr the asset_message_counter
         cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
         if (err) {
         //console.log("error in setting in asset parity");
         global.logger.write('serverError','error in setting in asset parity - ' + err, request)
         } else
         //console.log("asset parity is set successfully")
         global.logger.write('debug','asset parity is set successfully', request)
         });
         }
         } */
    };


    this.resetUnreadUpdateCount = function (request, callback) {
               
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        
        if (activityTypeCategoryId === 8 && Number(request.device_os_id) != 5) {
            var pubnubMsg = {};
            pubnubMsg.type = 'activity_unread';
            pubnubMsg.organization_id = request.organization_id;
            pubnubMsg.desk_asset_id = request.asset_id;
            pubnubMsg.activity_type_category_id = request.activity_type_category_id || 0;
            console.log('PubNub Message : ', pubnubMsg);            
            activityPushService.pubNubPush(request, pubnubMsg, function(err, data){});            
        }

        activityCommonService.resetAssetUnreadCount(request, request.activity_id, function (err, data) {});
        activityCommonService.responseRateUnreadCount(request, request.activity_id, function (err, data) {});
        activityPushService.sendPush(request, objectCollection, 0, function () {});             
        callback(false, true);
        /*var activityArray = JSON.parse(request.activity_id_array);
        forEachAsync(activityArray, function (next, activityId) {
            activityCommonService.resetAssetUnreadCount(request, activityId, function (err, data) {});
            //console.log(activityId);
            next();
        }); */
    };
    
    this.alterActivityFlagFileEnabled = function(request, callback) {
      var paramsArr = new Array(
                request.activity_id,
                request.asset_id,
                request.organization_id,
                request.activity_flag_file_enabled,
                util.getCurrentUTCTime()
                );

        var queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_flag_file_enabled', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, {}, 200): callback(true, err, -9999);
            });
        }  
    };

    this.archiveAssetAndActivity = function (request, callback) {

        global.logger.write('debug', 'Inside the archiveAssetAndActivity service', {}, request);
        request.datetime_log = util.getCurrentUTCTime();

        // 1.3 => Insert entry in asset timeline
        // assetListTimelineTracsactionInsertToRemoveUserFromWorkforce(request, function () {});
        activityCommonService.assetTimelineTransactionInsert(request, {}, 11008, function (err, data) {
            if (!err) { // ******* CHANGE THIS ******* 

                // 2.4 => Insert entry into the activity timeline of the ID card activity
                // activityTimelineTracsactionInsertToRemoveUserFromWorkforce(request, function () {});
                activityCommonService.activityTimelineTransactionInsert(request, {}, 11008, function (err, data) {
                    if (!err) { // ******* CHANGE THIS ******* 
                        // 1 => Archive the asset
                        // IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), 
                        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
                        var paramsArr = new Array(
                            request.asset_id,
                            request.organization_id,
                            request.asset_id, // log_asset_id
                            util.getCurrentUTCTime()
                        );
                        var queryString = util.getQueryString('ds_p1_asset_list_delete', paramsArr);
                        if (queryString !== '') {
                            db.executeQuery(0, queryString, request, function (err, data) {
                                if (!err) {
                                    // 1.2 => Insert asset archive log in history
                                    // assetListHistoryInsertToRemoveUserFromWorkforce(request, function () {});
                                    assetListHistoryInsert(request, request.asset_id, request.organization_id, 204, util.getCurrentUTCTime(), function (err, data) {});
                                    callback(false, true);
                                }
                            });
                        }

                        // 2 => Archive ID card activity

                        // 2.1 => Update the status of the ID card activity 
                        //        of the employee asset to archived
                        // IN p_organization_id BIGINT(20), IN p_account_id SMALLINT(6), IN p_workforce_id BIGINT(20), 
                        // IN p_activity_id BIGINT(20), IN p_activity_status_id BIGINT(20), 
                        // IN p_activity_status_type_id SMALLINT(6), IN p_log_datetime DATETIME
                        paramsArr = new Array(
                            request.organization_id,
                            request.account_id,
                            request.workforce_id,
                            request.activity_id,
                            request.activity_status_id,
                            request.activity_status_type_id,
                            util.getCurrentUTCTime()
                        );
                        queryString = util.getQueryString('ds_p1_activity_list_update_status', paramsArr);
                        if (queryString !== '') {
                            db.executeQuery(0, queryString, request, function (err, data) {
                                if (!err) {
                                    // 2.2 => Insert ID card activity status alter log in history
                                    // acitivityHistoryInsertToRemoveUserFromWorkforce(request, function () {});
                                    activityCommonService.activityListHistoryInsert(request, 402, function (err, data) {});
                                }
                            });
                        }
                    }
                });
            }
        });

        // 2.3 => Update the status of the ID card activity of the 
        // employee asset to archived for all the collaborator mappings
        activityAssetMappingUpdateToRemoveUserFromWorkforce(request, function (err, data) {});


    };

    var activityAssetMappingUpdateToRemoveUserFromWorkforce = function (request, callback) {

        // IN p_organization_id BIGINT(20), IN p_account_id SMALLINT(6), IN p_workforce_id BIGINT(20),
        // IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20), IN p_activity_status_id BIGINT(20), 
        // IN p_activity_status_type_id SMALLINT(6), IN p_log_datetime DATETIME
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_id,
            request.asset_id,
            request.activity_status_id,
            request.activity_status_type_id,
            util.getCurrentUTCTime() // request.log_datetime
        );

        // var queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_status', paramsArr);
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_status', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (!err) ? callback(false, {}, 200): callback(true, err, -9998);
            });
        }
    };
    
    this.removeEmployeetoDeskMapping = function (request, callback) {

        // Revoke the access mapping of an employee asset from the desk asset
        // 
        global.logger.write('debug', 'Inside the removeEmployeetoDeskMapping service', {}, request);
        request.datetime_log = util.getCurrentUTCTime();
        if (request.hasOwnProperty('activity_inline_data')) {
            var inlineJson = JSON.parse(request.activity_inline_data);
            request.employee_asset_id = inlineJson.employee_asset_id;
            request.employee_first_name = inlineJson.employee_first_name;
            request.employee_last_name = inlineJson.employee_last_name;
        } else {
            request.activity_inline_data = "{'message': 'User leaves the organization'}";
        }
        var participantData;

        // 1 => Operating asset details of employee desk
        // 
        // 1.1 => Reset the operating asset details for the employee desk asset
        // 
        resetOperatingAssetDetailsForDeskAsset(request, function (err, data) {
            if (!err) {
                // 1.2 => Insert operating asset reset log in history
                // 
                assetListHistoryInsert(request, request.desk_asset_id, request.organization_id, 211, util.getCurrentUTCTime(), function (err, data) {
                    // 2 => Update status of employee desk
                    // 
                    // 2.1 => Update the status of the employee desk asset to employee access revoked
                    revokeEmployeeAccessFromDeskAsset(request, function (err, data) {
                        if (!err) {
                            // 2.2 => Insert asset status alter log in history
                            // 
                            assetListHistoryInsert(request, request.desk_asset_id, request.organization_id, 207, util.getCurrentUTCTime(), function (err, data) {});

                            // 2.3 => Insert entry in asset timeline of the employee desk asset
                            // 
                            participantData = {
                                organization_id: request.organization_id,
                                account_id: request.account_id,
                                workforce_id: request.workforce_id,
                                asset_id: request.desk_asset_id,
                                message_unique_id: request.message_unique_id
                            };
                            activityCommonService.assetTimelineTransactionInsert(request, participantData, 11010, function (err, data) {
                                if (!err) {

                                }
                            });
                        }
                    })
                });

                // 1.3 => Insert entry in asset timeline of the employee desk asset
                // 
                participantData = {
                    organization_id: request.organization_id,
                    account_id: request.account_id,
                    workforce_id: request.workforce_id,
                    asset_id: request.desk_asset_id,
                    message_unique_id: request.message_unique_id
                };
                activityCommonService.assetTimelineTransactionInsert(request, participantData, 11010, function (err, data) {
                    if (!err) {}
                });
            }
        });

        // 3 => Asset mapping for employee desk
        // 
        // Fetch user_mapping_id from the asset_access_mapping table.
        getUserMappingID(request, function (err, user_mapping_id) {
            if (!err) {
                request.user_mapping_id = user_mapping_id;

                // 3.1 => Archive the employee asset mapping of the employee desk asset
                // 
                archiveEmployeeAssetMappingForDeskAsset(request, function (err, data) {
                    // 3.2 => Insert asset mapping archive log in history
                    // 
                    assetAccessMappingHistoryInsert(request, 302, function (err, data) {
                        // 3.3 => Reset the operating asset details for the employee desk mappings to all 
                        //        the non employee desks
                        // 
                        assetAccessMappingUpdateOperatingAsset(request, function (err, data) {
                            // 3.4 => Record reset asset mapping log in the history table for the employee 
                            //        desk mapping for all the non employee desk mappings
                            // 
                            // assetAccessMappingHistoryInsert(request, 302, function (err, data) {});

                            // 3.5 => Insert entry in asset timeline of the employee desk asset
                            // 
                            participantData = {
                                organization_id: request.organization_id,
                                account_id: request.account_id,
                                workforce_id: request.workforce_id,
                                asset_id: request.desk_asset_id,
                                message_unique_id: request.message_unique_id
                            };
                            activityCommonService.assetTimelineTransactionInsert(request, participantData, 11010, function (err, data) {
                                if (!err) {

                                    // Raise another queue event for processing the next service in the sequel
                                    var event = {
                                        name: "activityUpdateService",
                                        service: "activityUpdateService",
                                        method: "archiveAssetAndActivity",
                                        payload: request
                                    };

                                    queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                                        if (err) {
                                            console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                            global.logger.write('serverError', "Error in queueWrapper raiseActivityEvent", err, request);
                                            throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                                        } else {
                                            console.log("archiveAssetAndActivity service raised: ", event);
                                            global.logger.write('debug', "archiveAssetAndActivity service raised: ", event, request);
                                        }
                                    });
                                }
                            });
                        })
                    });
                });


            }
        });

        // 4 => Update the co-worker contact card activity of the operating asset
        // 
        getCoWorkerActivityId(request, function (err, coWorkerData) {
            if (!err) {
                var coWorkerActivityData = {
                    activity_id: Number(coWorkerData[0].activity_id),
                    organization_id: Number(coWorkerData[0].organization_id),
                    account_id: Number(coWorkerData[0].account_id),
                    workforce_id: Number(coWorkerData[0].workforce_id),
                    asset_id: Number(coWorkerData[0].asset_id),
                    operating_asset_id: Number(coWorkerData[0].operating_asset_id),
                    datetime_log: util.getCurrentUTCTime(),
                    message_unique_id: Number(request.message_unique_id)
                };
                console.log("coWorkerActivityData: ", coWorkerActivityData);
                // 4.1 Reset the desk details in the inline data and also in the asset 
                // columns in the row data of the co-worker contact card activity of the operating employee
                // 
                activityListUpdateOperatingAssetData(request, coWorkerActivityData, function (err, data) {
                    if (!err) {
                        // 4.2 => Insert co-worker contact card desk details reset log in history
                        // 
                        activityCommonService.activityListHistoryInsert(coWorkerActivityData, 406, function (err, data) {});

                        // 4.3 => Reset the desk details in the inline data and also the asset columns in the row data of 
                        // the co-worker contact card activity of the operating employee in all the collaborator mappings
                        // 
                        activityAssetMappingUpdateOperationAssetData(request, coWorkerActivityData, function (err, data) {});

                        // 4.4 => Insert entry into the activity timeline of the co-worker contact card activity
                        // 
                        // Clone the request and update the activity_id to contact card's activity ID
                        var newRequest = Object.assign({}, request);
                        newRequest.activity_id = Number(coWorkerData[0].activity_id);

                        activityCommonService.activityTimelineTransactionInsert(request, coWorkerActivityData, 11010, function () {});
                    }

                });
            }

        });

        callback(false, true);

    };

    function activityAssetMappingUpdateOperationAssetData(request, coWorkerActivityData, callback) {
        // IN p_activity_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_activity_inline_data JSON, 
        // IN p_pipe_separated_string VARCHAR(1200), IN p_log_datetime DATETIME, IN p_asset_id BIGINT(20), 
        // IN p_operating_asset_id BIGINT(20)
        var paramsArr = new Array(
            coWorkerActivityData.activity_id,
            coWorkerActivityData.organization_id,
            request.activity_inline_data || '{}',
            "Pipe | Separated | Data",
            util.getCurrentUTCTime(),
            coWorkerActivityData.asset_id,
            coWorkerActivityData.operating_asset_id
        );

        var queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_operation_asset_data', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (!err) ? callback(false, {}, 200): callback(true, err, -9998);
            });
        };

    }

    function activityListUpdateOperatingAssetData(request, coWorkerActivityData, callback) {
        // IN p_activity_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_activity_inline_data JSON, 
        // IN p_pipe_separated_string VARCHAR(1200), IN p_log_datetime DATETIME, IN p_asset_id BIGINT(20), 
        // IN p_operating_asset_id BIGINT(20)
        var paramsArr = new Array(
            coWorkerActivityData.activity_id,
            coWorkerActivityData.organization_id,
            request.activity_inline_data || '{}',
            "Pipe | Separated | Data",
            util.getCurrentUTCTime(),
            coWorkerActivityData.asset_id,
            coWorkerActivityData.operating_asset_id
        );

        var queryString = util.getQueryString('ds_p1_activity_list_update_operating_asset_data', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (!err) ? callback(false, {}, 200): callback(true, err, -9998);
            });
        };

    }

    function assetAccessMappingUpdateOperatingAsset(request, callback) {
        // IN p_user_mapping_id  BIGINT(20),  IN p_user_asset_id BIGINT(20), IN p_log_datetime DATETIME
        var paramsArr = new Array(
            request.user_mapping_id,
            request.employee_asset_id,
            util.getCurrentUTCTime()
        );
        var queryString = util.getQueryString('ds_p1_asset_access_mapping_update_operating_asset', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (!err) ? callback(false, {}, 200): callback(true, err, -9998);
            });
        };
    }

    function assetAccessMappingHistoryInsert(request, updateTypeID, callback) {
        // IN p_user_mapping_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_update_type_id SMALLINT(6), IN p_update_datetime DATETIME
        var paramsArr = new Array(
            request.user_mapping_id,
            request.organization_id,
            updateTypeID,
            util.getCurrentUTCTime()
        );
        var queryString = util.getQueryString('ds_p1_asset_access_mapping_history_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (!err) ? callback(false, {}, 200): callback(true, err, -9998);
            });
        };
    }

    function getUserMappingID(request, callback) {

        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20), 
        // IN p_user_asset_id BIGINT(20)
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.desk_asset_id,
            request.employee_asset_id || request.asset_id
        );
        var queryString = util.getQueryString('ds_p1_asset_access_mapping_select_a2a_mapping', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, data[0].user_mapping_id)
                } else {
                    callback(true, false)
                }
            });
        };
    }

    function archiveEmployeeAssetMappingForDeskAsset(request, callback) {
        // IN p_user_mapping_id BIGINT(20), IN p_organization_id BIGINT(20), 
        // IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
        var paramsArr = new Array(
            request.user_mapping_id, // Remember to add this to the client requirement
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.desk_asset_id, // Remember to add this to the client requirement
            request.desk_asset_id, // Remember to add this to the client requirement
            util.getCurrentUTCTime() // request.log_datetime
        );

        // var queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_status', paramsArr);
        var queryString = util.getQueryString('ds_p1_asset_access_mapping_delete_single', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (!err) ? callback(false, {}, 200): callback(true, err, -9998);
            });
        }
    }

    function revokeEmployeeAccessFromDeskAsset(request, callback) {
        // IN p_asset_id BIGINT(20), IN p_organization_id BIGINT(20), IN p_asset_type_category_id BIGINT(21), 
        // IN p_asset_status_id BIGINT(21), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
        var paramsArr = new Array(
            request.desk_asset_id, // Remember to add this to the client requirement
            request.organization_id,
            request.desk_asset_type_category_id,
            request.desk_asset_status_id,
            request.desk_asset_id,
            util.getCurrentUTCTime() // request.log_datetime
        );

        // var queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_status', paramsArr);
        var queryString = util.getQueryString('ds_p1_asset_list_update_asset_status', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (!err) ? callback(false, {}, 200): callback(true, err, -9998);
            });
        }
    }

    function resetOperatingAssetDetailsForDeskAsset(request, callback) {

        if (request.hasOwnProperty('activity_inline_data')) {
            var inlineJson = JSON.parse(request.activity_inline_data);
            request.employee_asset_id = inlineJson.employee_asset_id;
            request.employee_first_name = inlineJson.employee_first_name;
            request.employee_last_name = inlineJson.employee_last_name;
        }

        // IN p_asset_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_organization_id BIGINT(20), IN p_asset_first_name VARCHAR(50), IN p_asset_last_name VARCHAR(50), 
        // IN p_asset_type_id BIGINT(20), IN p_operating_asset_id BIGINT(20), IN p_manager_asset_id BIGINT(20), 
        // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
        var paramsArr = new Array(
            request.desk_asset_id, // Remember to add this to the client requirement
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.desk_asset_first_name || '', // request.employee_first_name || '',
            request.desk_asset_last_name || '', // request.employee_last_name || '',
            request.desk_asset_type_id, // Remember to add this to the client requirement
            0, // request.employee_asset_id || request.asset_id,
            0, // request.manager_asset_id
            request.desk_asset_id,
            util.getCurrentUTCTime() // request.log_datetime
        );

        // var queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_status', paramsArr);
        var queryString = util.getQueryString('ds_p1_asset_list_update_desk', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (!err) ? callback(false, {}, 200): callback(true, err, -9998);
            });
        }
    }

    function assetListHistoryInsert(request, assetId, organizationId, updateTypeId, datetimeLog, callback) {

        var paramsArr = new Array(
            assetId,
            organizationId,
            updateTypeId,
            datetimeLog
        );

        var queryString = util.getQueryString('ds_v1_asset_list_history_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                //global.logger.write(queryString, request, 'asset', 'trace');
                if (err === false) {
                    callback(false, true);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    // Populate the ID Card details in the request body
    this.populateDataForRemovingUserFromOrg = function (request, callback) {
        // Get the ID Card Activity Details
        getIDCardActivityForEmployeeAsset(request, function (err, data) {
            if (!err) {
                request.activity_id = Number(data[0].activity_id);
                request.activity_inline_data = data[0].activity_inline_data;
                request.activity_type_category_id = Number(data[0].activity_type_category_id);
                request.activity_status_type_id = 9;
                request.desk_asset_status_id = 1;

                workforceActivityStatusMappingSelectStatus(request, function (err, data) {
                    if (!err) {
                        request.activity_status_id = Number(data[0].activity_status_id);
                        request.activity_status_type_id = Number(data[0].activity_status_type_id);
                        // Raise another queue event for processing the next service in the sequel
                        var event = {
                            name: "activityUpdateService",
                            service: "activityUpdateService",
                            method: "removeEmployeetoDeskMapping",
                            payload: request
                        };

                        queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
                            if (err) {
                                console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                global.logger.write('serverError', "Error in queueWrapper raiseActivityEvent", err, request);
                                throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                            } else {
                                console.log("removeEmployeetoDeskMapping service raised: ", event);
                                global.logger.write('debug', "removeEmployeetoDeskMapping service raised: ", event, request);
                                callback(false, request)
                            }
                        });

                        // callback(false, request)
                    }
                });
            }
        });

    };
};

module.exports = ActivityUpdateService;
