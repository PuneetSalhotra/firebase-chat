/*
 * author: V Nani Kalyan
 */

function PamUpdateService(objectCollection) {

    var db = objectCollection.db;
    var activityCommonService = objectCollection.activityCommonService;
    var util = objectCollection.util;  
    
    //PAM
    function assetActivityListUpdateSubtypeSingleParticipant(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array();
            var queryString = '';
            
            paramsArr = new Array(
                            request.organization_id,
                            request.account_id,
                            request.workforce_id,
                            request.activity_id,
                            request.target_asset_id,
                            request.activity_sub_type_id,
                            request.activity_sub_type_name,
                            request.asset_id,
                            request.datetime_log,
                            request.field_id || 0
                            );
            //queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_sub_type', paramsArr);
            queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_ingredient', paramsArr);
                    if (queryString != '') {
                        db.executeQuery(0, queryString, request, function (err, data) {
                            (err === false) ? resolve() : reject();
                        });
                    }
        });
    };
    
    this.alterIngredientSubTypeActivity = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        
        assetActivityListUpdateSubtypeSingleParticipant(request)
                .then(()=>{})
                .catch((err)=>{
                    console.log('Error Occurred : ' + err);
                });
        activityCommonService.assetActivityListHistoryInsert(request, request.asset_id, 411, function(err, data){});
        
        callback(false, true);
    };
    
    
    this.unassignParticicpant = function (request, callback) {

        var loopUnassignParticipant = function (participantCollection, index, maxIndex) {
            iterateUnassignParticipant(participantCollection, index, maxIndex, function (err, data) {
                if (err === false) {
                    if (index === maxIndex) {
                        //updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) { });
                        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                    }
                } else {
                    //console.log("something is not wright in unassign a participant");
                    global.logger.write('serverError','something is not wright in unassign a participant', {},request)
                }
            });
        };

        var iterateUnassignParticipant = function (participantCollection, index, maxIndex, callback) {
            var participantData = participantCollection[index];
            unassignAssetFromActivity(request, participantData, function (err, data) {
                if (err === false) {
                    //console.log("participant successfully un-assigned");
                    global.logger.write('debug','participant successfully un-assigned', {},request)
                    var nextIndex = index + 1;
                    if (nextIndex <= maxIndex) {
                        loopUnassignParticipant(participantCollection, nextIndex, maxIndex);
                    }
                    callback(false, true);
                } else {
                    //console.log(err);
                    global.logger.write('serverError','',err, request)
                    callback(true, false);
                }
            }.bind(this));
        };
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        var activityStreamTypeId = 3;
        if (request.hasOwnProperty('activity_type_category_id')) {
            var activityTypeCategroyId = Number(request.activity_type_category_id);
            switch (activityTypeCategroyId) {
                case 36:    //Menu
                    activityStreamTypeId = 2000;
                    break;                 
                default:
                    activityStreamTypeId = 2000;   //by default so that we know
                    //console.log('adding streamtype id 3');
                    global.logger.write('debug','adding streamtype id 3', {},request)
                    break;

            }
            ;
        }
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        request['activity_streamtype_id'] = activityStreamTypeId;
        var index = 0;
        var activityParticipantCollection = JSON.parse(request.activity_participant_collection);
        var maxIndex = activityParticipantCollection.length - 1;
        //var maxIndex = request.activity_participant_collection.length - 1;        
        iterateUnassignParticipant(activityParticipantCollection, index, maxIndex, function (err, data) {
            if (err === false && data === true) {
                //callback(false, {}, 200);
                if (maxIndex === index) {
                    //updateParticipantCount(request.activity_id, request.organization_id, request, function (err, data) { });
                    activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                }
            } else {
                //console.log("something is not wright in adding a participant");
                global.logger.write('serverError','something is not wright in adding a participant', {},request)
            }
        });
    };
    
    
    var unassignAssetFromActivity = function (request, participantData, callback) {
        var fieldId = 0;        
        if (participantData.hasOwnProperty('field_id')) {
            fieldId = participantData.field_id;
        }
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        activityAssetMappingInsertParticipantUnassign(request, participantData, function (err, data) {
            if (err === false) {

                activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 501, function (err, restult) {
                    if (err === false) {
                        activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {});
                        
                        //PAM
                    if(activityTypeCategoryId == 39 || activityTypeCategoryId == 38) {
                        assignUnassignParticipantPam(request, participantData,0,function(err, resp){}); //1 for unassign
                    }
                    }
                });

                callback(false, true);
            } else {
                callback(false, false);
            }
        });
    };
    
    var assignUnassignParticipantPam = function(request, participantData, status, callback) {
        updateActivityListOwnerLeadPam(request, participantData, status, function(err, data){
                            if(err === false) { //You will get it from participant collection
                                if(participantData.asset_category_id == 32 || 
                                        participantData.asset_category_id == 33 || 
                                            participantData.asset_category_id == 34 ||
                                                participantData.asset_category_id == 35
                                        ) {
                                            activityCommonService.activityListHistoryInsert(request,409, function(){});
                                        }
                                else if(participantData.asset_category_id == 41) {
                                    activityCommonService.activityListHistoryInsert(request,410, function(){});
                                }
                            }
                                
                        })
                        
                        activityCommonService.getAllParticipants(request, function(err, participantsData){
                            if(err === false) {
                                    if(participantsData.length > 0){
                                            if(status === 0) {
                                                participantData.asset_id = 0;
                                               }
                                            participantsData.forEach(function (rowData, index) {
                                                    
                                                    paramsArr = new Array(
                                                            request.activity_id,
                                                            rowData['asset_id'], 
                                                            participantData.asset_id, //have to take from participant collection
                                                            request.organization_id,
                                                            request.activity_type_category_id,
                                                            participantData.asset_category_id, // have to take from participant collection
                                                            0, //request.flag
                                                            request.asset_id,
                                                            request.datetime_log
                                                            );
                                                    queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_owner_lead_pam', paramsArr);
                                                    db.executeQuery(0, queryString, request, function (error, queryResponse) { });
                                                }, this);
                                            callback(false, true);
                                }
                            }
                            
                        });
    };
    
    
    var activityAssetMappingInsertParticipantUnassign = function (request, participantData, callback) {
        var paramsArr = new Array(
                request.activity_id,
                participantData.asset_id,
                request.organization_id,
                request.asset_id,
                request.datetime_log,
                request.field_id || 0
                );
        //var queryString = util.getQueryString("ds_v1_activity_asset_mapping_update_asset_unassign", paramsArr);
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_update_asset_unassign_pam", paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, true) : callback(err, false);
            });
        }
    };
    
    
    var updateActivityListOwnerLeadPam = function(request, participantCollection, status, callback) {
        var flag = (status === 1) ? 1 : 0;
        var paramsArr = new Array(
                request.activity_id,
                participantCollection.asset_id,
                request.organization_id,
                request.activity_type_category_id,
                participantCollection.asset_category_id,
                flag, //unassign = 0 and assign 1
                request.asset_id,
                request.datetime_log
                );
        var queryString = util.getQueryString("ds_v1_activity_list_update_owner_lead_pam", paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? callback(false, true) : callback(err, false);
            });
        }
    }

}
;
module.exports = PamUpdateService;
