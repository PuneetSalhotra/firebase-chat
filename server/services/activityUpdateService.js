/*
 * author: Sri Sai Venkatesh
 */

function ActivityUpdateService(objectCollection) {

    var db = objectCollection.db;
    var cacheWrapper = objectCollection.cacheWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var util = objectCollection.util;
    var activityPushService = objectCollection.activityPushService;

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
        var coverJson = JSON.parse(request.activity_cover_data);

        activityCommonService.getAllParticipants(request, function (err, participantsData) {

            if (err === false && participantsData.length > 0) {

                participantsData.forEach(function (rowData, index) {

                    paramsArr = new Array(
                            request.activity_id,
                            rowData.asset_id,
                            request.organization_id,
                            coverJson.title.new,
                            coverJson.description.new,
                            coverJson.duedate.new,
                            rowData.asset_id,
                            request.datetime_log
                            );
                    queryString = util.getQueryString('ds_v1_activity_asset_mapping_update', paramsArr);

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
                0, 100
                );

        queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_sub_tasks', paramsArr);

        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false && data.length > 0) {
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
                        switch(activityTypeCategoryId) {
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
                                console.log('adding streamtype id 1705');
                                break;
                        }
                        
                        activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                        });
                        activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                        });
                        if (request.hasOwnProperty('device_os_id')) {
                            if (Number(request.device_os_id) !== 5) {
                                //incr the asset_message_counter                        
                                cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                                    if (err) {
                                        console.log("error in setting in asset parity");
                                    } else
                                        console.log("asset parity is set successfully")

                                });
                            }
                        }
                        callback(false, {}, 200);

                    } else {
                        callback(false, {}, -9999);
                    }
                });
                activityCommonService.activityListHistoryInsert(request, 404, function (err, result) {

                });

                activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {

                });

                activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {

                });

                if (Number(request.activity_type_category_id) === 4) {    // id card inline update
                    activityCommonService.assetListUpdateImagePath(request, function (err, data) {

                    });
                }

            } else {
                callback(err, {}, -9999);
            }
        });
        // call resource ranking...

    };

    this.alterActivityCover = function (request, callback) {

        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        var activityTypeCategoryId = request.activity_type_category_id;
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        activityListUpdateCover(request, function (err, data) {
            if (err === false) {
                activityCommonService.activityListHistoryInsert(request, 403, function (err, result) {

                });
                assetActivityListUpdateCover(request, function (err, data) {
                    //Switch-CASE Added by Nani Kalyan
                    switch (activityTypeCategoryId) {
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
                        default:
                            activityStreamTypeId = 1506;   //by default so that we know
                            console.log('adding streamtype id 1506');
                            break;
                        }

                    activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {

                    });
                    activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {
                    });
                    //updating log differential datetime for only this asset
                    activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {

                    });

                    activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {

                    });
                    assetActivityListUpdateSubTaskCover(request, function (err, data) {

                    });
                    activityPushService.sendPush(request, objectCollection, 0, function () {});

                });
                if (request.hasOwnProperty('device_os_id')) {
                    if (Number(request.device_os_id) !== 5) {
                        //incr the asset_message_counter                        
                        cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                            if (err) {
                                console.log("error in setting in asset parity");
                            } else
                                console.log("asset parity is set successfully")

                        });
                    }
                }
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
                    activityCommonService.activityTimelineTransactionInsert(request, {}, 1302, function (err, data) {

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
        activityCommonService.assetTimelineTransactionInsert(request, {}, 1302, function (err, data) {

        });
        if (request.hasOwnProperty('device_os_id')) {
            if (Number(request.device_os_id) !== 5) {
                //incr the asset_message_counter                        
                cacheWrapper.setAssetParity(request.asset_id, request.asset_message_counter, function (err, status) {
                    if (err) {
                        console.log("error in setting in asset parity");
                    } else
                        console.log("asset parity is set successfully")

                });
            }
        }
    };



}
;
module.exports = ActivityUpdateService;


