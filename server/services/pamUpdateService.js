/*
 * author: V Nani Kalyan
 */

function PamUpdateService(objectCollection) {

    var db = objectCollection.db;
    var activityCommonService = objectCollection.activityCommonService;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
    
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
                    global.logger.write('conLog', 'something is not wright in unassign a participant', {}, request)
                }
            });
        };

        var iterateUnassignParticipant = function (participantCollection, index, maxIndex, callback) {
            var participantData = participantCollection[index];
            unassignAssetFromActivity(request, participantData, function (err, data) {
                if (err === false) {
                    //console.log("participant successfully un-assigned");
                    global.logger.write('conLog', 'participant successfully un-assigned', {}, request)
                    var nextIndex = index + 1;
                    if (nextIndex <= maxIndex) {
                        loopUnassignParticipant(participantCollection, nextIndex, maxIndex);
                    }
                    callback(false, true);
                } else {
                    //console.log(err);
                    global.logger.write('serverError', err, err, request)
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
                    global.logger.write('conLog', 'adding streamtype id 3', {}, request)
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
                global.logger.write('conLog', 'something is not wright in adding a participant', {}, request)
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
    
    
    this.alterActivityStatus = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;

        var activityStreamTypeId = 11;
        var activityStatusTypeCategoryId = Number(request.activity_status_type_category_id);
        var activityStatusId = Number(request.activity_status_id);
        var activityStatusTypeId = Number(request.activity_status_type_id);
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        var assetParticipantAccessId = Number(request.asset_participant_access_id);
        if (request.hasOwnProperty('activity_type_category_id')) {
            var activityTypeCategroyId = Number(request.activity_type_category_id);
            switch (activityTypeCategroyId) {                
                case 33: //Visitor Request 
                    activityStreamTypeId = 1302;
                    break;
                    //Added by Nani Kalyan
                case 34: //Time Card 
                    activityStreamTypeId = 1502;
                    break;
                    //PAM
                case 36:    //Menu Item
                    activityStreamTypeId = 19004;
                    break;
                case 37:    //Reservation
                    activityStreamTypeId = 18004;
                    break;
                    /*case 38:    //Item Order
                     activityStreamTypeId = 21001;
                     break;
                     case 39:    //Inventory
                     activityStreamTypeId = 20001;
                     break;*/
                case 40:    //Payment
                    activityStreamTypeId = 22007;
                    break;
                case 41:    //Event
                    activityStreamTypeId = 17004;
                    break;
                default:
                    activityStreamTypeId = 11; //by default so that we know
                    //console.log('adding streamtype id 11');
                    global.logger.write('conLog', 'adding streamtype id 11', {}, request)
                    break;
            }
            ;
            request.activity_stream_type_id = activityStreamTypeId;
        }
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        activityListUpdateStatus(request).then(()=>{
            if(activityTypeCategroyId == 38) {
            	console.log('request.activity_status_type_id: '+request.activity_status_type_id );
                    switch(Number(request.activity_status_type_id)) {                    	
                        case 106: if (request.served_at_bar == 1) {
                            			itemOrderAlterStatus(request).then(() => {});
                        			}
                        case 125: updateStatusDateTimes(request).then(()=>{});
                        		  break;		
                        case 105: itemOrderAlterStatus(request).then(()=>{});
                                  updateStatusDateTimes(request).then(()=>{});
                                  break;                        
                        case 139: sendRemovedFromBillingSMS(request);
                                  break;  
                        
                    }
                }               

		//if(request.hasOwnProperty('is_room_posting')){
		     if(activityTypeCategroyId == 37) {
		         if(request.activity_status_type_id == 99 || request.activity_status_type_id == 150 || request.activity_status_type_id == 151 || request.activity_status_type_id == 152) {                    	
		            	activityCommonService.pamEventBillingUpdate(request, request.activity_id).then(()=>{});
		          }
		       }
	        // }
		
		     if(activityTypeCategroyId == 38) {            		
            		//console.log('pamOrderListUpdate:'+activityTypeCategroyId);
		        activityCommonService.pamOrderListUpdate(request, request.activity_id).then(()=>{});            		
            	}
		
                assetActivityListUpdateStatus(request, activityStatusId, activityStatusTypeId, function (err, data) { });
                activityCommonService.activityListHistoryInsert(request, 402, function (err, result) { });
                activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});
                activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});
                activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {});
                activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});              
                
                callback(false, {}, 200);
        }).catch((err)=>{
            callback(err, {}, -9998);
        });        
    };
    
    function activityListUpdateStatus(request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                request.activity_status_id,
                request.activity_status_type_id,
                request.datetime_log,
                request.asset_id
                );        
            var queryString = util.getQueryString("ds_v1_1_activity_list_update_status", paramsArr);
            //var queryString = util.getQueryString("ds_v1_activity_list_update_status", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false)? resolve() : reject(err);
                });
            }
        });        
    };
    
    function itemOrderAlterStatus(request) {
        return new Promise((resolve, reject) => {
            //activityCommonService.getActivityDetails(request,0,function(err, data){
            getItemOrderStation(request).then((data) => {
                console.log('menu_activity_id : ', data[0].channel_activity_id);
                console.log('station_id : ', data[0].asset_id);
                request.menu_activity_id = data[0].channel_activity_id;
                request.station_id = data[0].asset_id;
                getAllIngrediants(request).then((ingredients) => {
                    if (ingredients.length > 0) {
                        console.log('Ingredients : ', ingredients)
                        console.log('============================')
                        forEachAsync(ingredients, function (next, row) {
                            getAllInventoriesOfIngre(request, row).then((updatedInvs) => {
                                console.log('===========================');
                                console.log('Temp Array : ', updatedInvs);
                                if(updatedInvs.length > 0){
	                                updateIngrInvQty(request, updatedInvs).then(() => {
	                                    updateIngrInvQtyAllParticipants(request, updatedInvs).then(() => {
	                                    });
	                                    next();
	                                });
                                }else{
                                	console.log("****NO Inventory for Ingredient: "+row.ingredient_asset_id)
                                	next();
                                }
                               
                            });
                        });
                    }
                });
            })
        });
    }

    function getAllIngrediants(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array();
            var queryString = '';
            paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.activity_id,
                    41, //request.asset_type_category_id,
                    request.page_start || 0,
                    util.replaceQueryLimit(request.page_limit)
                    );
            queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants_category', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        //console.log('DAta in ingredients : ', data);
                        if (data.length > 0) {
                            var ingredients = new Array();
                            forEachAsync(data, function (next, x) {
                            	var requiredInventory=x.activity_sub_type_id*x.activity_priority_enabled;
                                var items = {
                                    'ingredient_asset_id': x.asset_id,
                                    'channel_activity_type_category_id': x.channel_activity_type_category_id,
                                    'activity_sub_type_id': requiredInventory
                                };
                                ingredients.push(items);
                                next();
                            }).then(() => {
                                if (ingredients.length > 0) {
                                    ingredients = util.getUniqueValuesOfArray(ingredients);
                                }
                                resolve(ingredients);
                            });
                        }
                    }
                });
            }
        });
    }

    function getAllInventoriesOfIngre(request, ingredients) {
        return new Promise((resolve, reject) => {
            var inventories = new Array();
            var requiredQuantity;
            var inventoryQuantity;
            var result;
            console.log('ingredients.ingredient_asset_id : ', ingredients.ingredient_asset_id);
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    request.station_id,
                    ingredients.ingredient_asset_id
                    );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_inventory', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        requiredQuantity = ingredients.activity_sub_type_id;
                        inventoryQuantity = inventories.inventory_quantity_total_value;
                        //Here you have to write the logic
                        console.log('inventories data: ', data);
                        if (data.length > 0) {
                            updatingInventoryQtys(ingredients.activity_sub_type_id, data).then((updatedInv) => {
                                resolve(updatedInv);
                            }).catch(()=>{
                                console.log('Error occurred in performing the deductions of inventory quantity');
                                reject('Error occurred in performing the deductions of inventory quantity');
                            });
                        } else {
                        	resolve('');
                        }

                    } else {
                        reject(err);
                    }
                });
            }
        })
    }

    function updatingInventoryQtys(requiredQty, inventories) {
        return new Promise((resolve, reject) => {
            var x;
            var tempArray = new Array();
            console.log('ingredients.activity_sub_type_id : ', requiredQty);
            forEachAsync(inventories, function (next, j) {
                x = JSON.parse(j.activity_inline_data);
                console.log('x : ', x.inventory_quantity_total_value);
                if (Math.sign(x.inventory_quantity_total_value - requiredQty) === -1) {
                    x.inventory_quantity_total_value = requiredQty - x.inventory_quantity_total_value;
                    console.log('Demo purpose basically 0: ', x.inventory_quantity_total_value);
                    requiredQty = x.inventory_quantity_total_value;
                    x.inventory_quantity_total_value = 0;
                    x.inventory_quantity = 0;
                    j.activity_sub_type_id = 0;
                    j.activity_inline_data = JSON.stringify(x);
                    tempArray.push(j)
                    next();
                } else if (Math.sign(x.inventory_quantity_total_value - requiredQty) === 1) {
                    x.inventory_quantity_total_value -= requiredQty;
                    x.inventory_quantity = Math.ceil(x.inventory_quantity_total_value / x.inventory_quantity_unit_value);
                    j.activity_sub_type_id = x.inventory_quantity_total_value;
                    j.activity_inline_data = JSON.stringify(x);
                    tempArray.push(j)
                    return resolve(tempArray);
                } else if (Math.sign(x.inventory_quantity_total_value - requiredQty) === 0) {
                    x.inventory_quantity_total_value -= requiredQty;
                    x.inventory_quantity = Math.ceil(x.inventory_quantity_total_value / x.inventory_quantity_unit_value);
                    j.activity_sub_type_id = x.inventory_quantity_total_value;
                    j.activity_inline_data = JSON.stringify(x);
                    tempArray.push(j)
                    return resolve(tempArray);
                }
            });
        });
    }

    function updateIngrInvQty(request, updatedIngrInv) {
        return new Promise((resolve, reject) => {
            forEachAsync(updatedIngrInv, function (next, row) {
                var paramsArr = new Array(
                        row.activity_id, //menu_activity_id??
                        request.organization_id,
                        row.activity_inline_data, //request.activity_inline_data,
                        row.activity_sub_type_id, //total_inventory_quantity,
                        request.asset_id,
                        request.datetime_log
                        );
                var queryString = util.getQueryString('ds_v1_activity_list_update_inventory', paramsArr);
                if (queryString != '') {
                    db.executeQuery(0, queryString, request, function (err, data) {
                        if (err === false) {
                        	request.activity_id = row.activity_id;
                        	activityCommonService.activityListHistoryInsert(request, 416, function (err, restult) {

                            });
                            next();
                        } else {
                            reject(err);
                        }
                    });
                }

            }).then(() => {
                resolve();
            })

        });
    }

    function updateIngrInvQtyAllParticipants(request, updatedIngrInv) {
        return new Promise((resolve, reject) => {
            forEachAsync(updatedIngrInv, function (nextR, row) {
                var newRequest = {};
                newRequest.activity_id = row.activity_id;
                newRequest.organization_id = request.organization_id;
                activityCommonService.getAllParticipants(newRequest, function (err, participantData) {
                    if (err === false) {
                        //console.log('participantData : ', participantData);

                        forEachAsync(participantData, function (nextX, x) {
                            var paramsArr = new Array(
                                    row.activity_id, //menu_activity_id?
                                    x.asset_id,
                                    request.organization_id,
                                    row.activity_inline_data,
                                    row.activity_sub_type_id,
                                    request.asset_id,
                                    request.datetime_log
                                    );
                            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_inventory', paramsArr);
                            if (queryString != '') {
                                db.executeQuery(0, queryString, request, function (err, inventories) {
                                    if (err === false) {
                                        nextX();
                                    } else {
                                        reject(err);
                                    }
                                });
                            }
                        }).then(() => {
                            nextR();
                        })
                    }
                    ;
                });
            }).then(() => {
                resolve();
            })
        });
    }

    function getItemOrderStation(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.activity_id
                    );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_item_order_station', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        (data.length > 0) ? resolve(data) : resolve(err);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }
    
    function updateStatusDateTimes(request) {
        return new Promise((resolve, reject)=>{
            var servedAtBar = (request.hasOwnProperty('served_at_bar'))? request.served_at_bar : 0;            
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.activity_id,
                request.activity_status_type_id,
                servedAtBar,
                request.asset_id,
                request.datetime_log
                );
            var queryString = util.getQueryString('ds_v1_activity_list_update_order_status_datetime', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, resp) {
                    if (err === false) {
                        activityCommonService.getAllParticipants(request, function(err, participantData){
                            if(err === false){
                                forEachAsync(participantData, function (next, x) {
                                    updateStatusDttmsParticipants(request, x.asset_id, servedAtBar).then(()=>{
                                        next();
                                    });                                    
                                    }).then(()=>{
                                        resolve();
                                    });
                            } else {
                                reject(err);
                            }                            
                        });
                    } else {                    
                        callback(err, false);
                    }
                });
            }
        });
        
    };
    
    
    function updateStatusDttmsParticipants(request, assetId, servedAtBar){
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.activity_id,
                assetId, //p_asset_id
                request.activity_status_type_id,
                servedAtBar,
                request.asset_id, //log_asset_id
                request.datetime_log
                );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_order_status_datetime', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, resp) {
                    (err === false)? resolve() : reject(err);
                });
            }
        });
    };
    
    var assetActivityListUpdateStatus = function (request, activityStatusId, activityStatusTypeId, callback) {
        var paramsArr = new Array();
        activityCommonService.getAllParticipants(request, function (err, participantsData) {
            if (err === false) {
                participantsData.forEach(function (rowData, index) {
                    paramsArr = new Array(
                            request.organization_id,
                            request.account_id,
                            request.workforce_id,
                            request.activity_id,
                            rowData['asset_id'],
                            activityStatusId,
                            activityStatusTypeId,
                            request.datetime_log
                            );
                    queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_status', paramsArr);
                    db.executeQuery(0, queryString, request, function (error, queryResponse) { });
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
    
    this.activityListUpdateEventCovers = function (request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                request.male_covers,
                request.female_covers,
                request.datetime_log,
                request.asset_id
                );
            var queryString = util.getQueryString("ds_v1_activity_list_update_event_covers", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {                  
                   if(err === false){
                	   activityCommonService.activityListHistoryInsert(request, 415, function(err, resp){});
                	   resolve();
                   }else{
                	   reject(err);
                   }
                });
            }
        })
    }
    
    this.activityAssetMappingUpdateEventCovers = function (request){
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array();
            activityCommonService.getAllParticipants(request, function (err, participantsData) {
                if (err === false) {
                    participantsData.forEach(function (rowData, index) {
                        paramsArr = new Array(   
                                request.organization_id,
                                request.account_id,
                                request.workforce_id,
                                request.activity_id,
                                rowData['asset_id'],
                                request.male_covers,
                                request.female_covers,
                                request.datetime_log,
                                request.asset_id
                                );
                        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_event_covers', paramsArr);
                        db.executeQuery(0, queryString, request, function (error, queryResponse) {
                        	//console.log("*******************error in service "+error);
                        	if(error == false){
                        		//reject(err);
                        	}else{
                        		console.log("*******************error in service"+err);
                        		reject(err);
                        	}
                        });
                    }, this);
                    resolve();                
                } else {
                    reject(err);
                }
            });
        });      
    };

    function sendRemovedFromBillingSMS(request) {
        return new Promise((resolve, reject) => {
            console.log("IN sendRemovedFromBillingSMS :: ");
            var employeeName = "Sravan";
            var removedTime = util.addUnitsToDateTime(util.replaceDefaultDatetime(request.track_gps_datetime), 5.5, 'hours');
            var text = "";
            var phoneNumber = '7680000368';
            var countryCode = '91';
            console.log("IN sendRemovedFromBillingSMS before getPamSMSConfig:: ");
            getPamSMSConfig("1").then((configData) => {
                console.log("IN sendRemovedFromBillingSMS getPamSMSConfig:: ");
                if (configData.length > 0) {
                    console.log("IN sendRemovedFromBillingSMS getPamSMSConfig configData:: " + configData);
                    employeeName = configData[0].receiver_first_name;
                    phoneNumber = configData[0].receiver_phone_number;
                    countryCode = configData[0].receiver_country_code;

                    getActivityDetails(request).then((res) => {

                        console.log("IN sendRemovedFromBillingSMS getPamSMSConfig getActivityDetails:: " + res);
                        request.work_station_asset_id = request.asset_id;
                        //Dear XXXX, Item XXXX removed by XXXX from reservation XXXX at XXXX.
                        pamGetAssetDetails(request).then((assetData) => {
                            console.log("IN sendRemovedFromBillingSMS getPamSMSConfig pamGetAssetDetails:: " + assetData);
                            text = "Dear " + employeeName + "," + " Item " + res[0].activity_title + " deleted by " + assetData[0].asset_first_name + " from Reservation: " + res[0].parent_activity_title + " at " + removedTime + ". "
                            text = text + " Pudding n Mink";
                        }).then(() => {
                            console.log('SMS text : \n', text);

                            util.sendSmsSinfiniV1(text, countryCode, phoneNumber, 'PUDMNK', function (err, res) {
                                if (err === false) {
                                    console.log('Message sent to Admin!', res);
                                }
                            });
                        })
                    });
                } else {
                    console.log('Cannot send SMS! config invalid ');
                }
            });
            resolve();
        })
    }
    function pamGetAssetDetails(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                351, //request.organization_id,
                request.asset_id
            );
            var queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    function getActivityDetails(request) {
        return new Promise((resolve, reject) => {
            var paramsArr;
            paramsArr = new Array(
                request.activity_id,
                request.organization_id
            );

            var queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    function getPamSMSConfig(smsTypeId) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                smsTypeId
            );
            var queryString = util.getQueryString('pm_v1_pam_sms_type_config_master_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, {}, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

}
;
module.exports = PamUpdateService;
