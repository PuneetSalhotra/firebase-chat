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
        } else if(coverJson.hasOwnProperty('activity_completion_percentage')) {
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
    var activityAlterOwner = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
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
                        
                    if(coverJson.hasOwnProperty('start_date')) {
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
                    } else if(coverJson.hasOwnProperty('activity_completion_percentage')) {
                         dbCall ='ds_v1_1_activity_asset_mapping_update';
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
                         dbCall ='ds_v1_activity_asset_mapping_update';
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

                        callback(false, {}, 200);

                    } else {
                        callback(false, {}, -9999);
                    }
                });
                activityCommonService.activityListHistoryInsert(request, 404, function (err, result) { });
                activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) { });
                activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) { });

                if (Number(request.activity_type_category_id) === 4) {    // id card inline update
                    assetListUpdate(request, function (err, data) {});   //opearating asset id

                    var empIdJson = JSON.parse(request.activity_inline_data);
                    var newRequest = Object.assign({}, request);

                    getCoWorkerActivityId(request, function (err, coworkerData) {
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
                                        //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                                        global.logger.write('serverError', "Error in queueWrapper raiseActivityEvent", err, request);
                                    } else {
                                    }
                                });
                            } catch (exception) {
                                console.log('Exception vnk : ' + exception);
                                //res.send(responseWrapper.getResponse(false, {}, -3308,request.body));
                                return;
                            }
                        } else {
                            console.log(err)
                        }
                    })
                } //if category_id==4

            } else {
                callback(err, {}, -9999);
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

                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {

                    });
                    //assetActivityListUpdateSubTaskCover(request, function (err, data) {}); facing some issues here, handle post alpha
                    activityPushService.sendPush(request, objectCollection, 0, function () {});

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
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        
        var paramsArr1 = new Array(
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
                                0 //Field Id
                                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_insert_asset_assign_appr', paramsArr1);
        if (queryString !== '') {
               db.executeQuery(0, queryString, request, function (err, data) {});
        } 
                          
        activityAlterOwner(request, function (err, data) {
            if (err === false) {
                activityCommonService.activityListHistoryInsert(request, 409, function (err, result) {});
                assetActivityListUpdateOwner(request, function (err, data) {
                    var activityStreamTypeId = 406;
                    
                    activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });
                    activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) { });

                    //updating log differential datetime for only this asset
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {});

                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) { });
                    //assetActivityListUpdateSubTaskCover(request, function (err, data) {}); facing some issues here, handle post alpha
                    activityPushService.sendPush(request, objectCollection, 0, function () {});

                }); 

                callback(false, {}, 200);
            } else {
                callback(err, {}, -9999);
            }
        });
        // call resource ranking...
        
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

                    //updating log differential datetime for only this asset
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) { });

                    //assetActivityListUpdateSubTaskCover(request, function (err, data) {}); facing some issues here, handle post alpha
                    activityPushService.sendPush(request, objectCollection, 0, function () {});

                });

                callback(false, {}, 200);

            } else {
                callback(err, {}, -9999);
            }
        });

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
    }

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
        //var activityTypeCategoryId = Number(request.activity_type_category_id);

        var activityArray = JSON.parse(request.activity_id_array);
        forEachAsync(activityArray, function (next, activityId) {
            activityCommonService.resetAssetUnreadCount(request, activityId, function (err, data) {});
            //console.log(activityId);
            next();
        });
    };

}
;
module.exports = ActivityUpdateService;
