/*
 * author: Nani Kalyan V
 */

function PamService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
    //var cacheWrapper = objectCollection.cacheWrapper;
    var queueWrapper = objectCollection.queueWrapper;
    var activityCommonService = objectCollection.activityCommonService;
          
    this.ivrService = function(request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime; 
        
        var response = {};
        var threshold = 50;
        response.member = '';
        response.called_before = '';
        response.event_id = 0;
        response.reservation_available = '';
        response.next_possible_reservation_time = '';
        
        identifyCaller(request, function(err, data){
            (err === false) ? response.member = data : response.member = -99;
         });
           
        getCalledTime(request, function(err, data){
             if(err === false){
                if(data.length > 0) {
                   (data[0].activity_datetime_start_expected >= logDatetime) ? response.called_before = 'true' : response.called_before = 'false';
                   response.event_id = data[0].activity_id;
                   getReservationsCount(data[0].activity_id, function(err,data){
                     if(err === false){
                       (data.length > 0) ? ((data[0].reservation_count < threshold) ? response.reservation_available ='true' : response.reservation_available = 'false') : response.reservation_available = -99;
                       
                       if(response.called_before == 'false' && response.reservation_available == 'true') {
                          if(logDatetime <= util.addUnitsToDateTime(data[0].activity_datetime_start_expected,1,'hours')) {
                               response.next_possible_reservation_time = util.addUnitsToDateTime(logDatetime,1,'hours');
                           } else {
                               response.next_possible_reservation_time = '1970-01-01 00:00:00';
                           }
                          callback(false, response, 200);
                       }
                     } else {
                         response.reservation_available = -99;
                         callback(false, response, 200);
                     }
                 });
                } else {
                    response.called_before = -99;
                    callback(false, response, 200);
                }           
             } else{
                 callback(false, response, -9999);
             }
             
        });
     }
     
     this.sendSms = function(request, callback) {
         //util.sendSmsMvaayoo(request.text, request.country_code, request.phone_number, function(err,res){
          util.sendSmsBulk(request.text, request.country_code, request.phone_number, function(err,res){
                console.log(err,'\n',res);
                callback(false, {}, 200);
         });
     }
    
    this.getWorkforceDifferential = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.differential_datetime,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
                );
        var queryString = util.getQueryString('ds_p1_workforce_list_select_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if(err === false){
                   if (data.length > 0) {
                    //console.log(data);
                    var responseData = new Array();
                    forEachAsync(data, function (next, row) {
                            var rowData = {
                            "workforce_id": util.replaceDefaultNumber(row['workforce_id']),
                            "workforce_name": util.replaceDefaultString(row['workforce_name']),
                            "workforce_image_path": util.replaceDefaultString(row['workforce_image_path']),
                            "workforce_type_id": util.replaceDefaultNumber(row['workforce_type_id']),
                            "workforce_type_name": util.replaceDefaultString(row['workforce_type_name']),
                            "workforce_type_category_id": util.replaceDefaultNumber(row['workforce_type_category_id']),
                            "workforce_type_category_name": util.replaceDefaultString(row['workforce_type_category_name']),
                            "account_id": util.replaceDefaultNumber(row['account_id']),
                            "account_name": util.replaceDefaultString(row['account_name']),
                            "account_image_path": util.replaceDefaultString(row['account_image_path']),
                            "account_type_id": util.replaceDefaultNumber(row['account_type_id']),
                            "account_type_name": util.replaceDefaultString(row['account_type_name']),
                            "account_type_category_id": util.replaceDefaultNumber(row['account_type_category_id']),
                            "account_type_category_name": util.replaceDefaultString(row['account_type_category_name']),
                            "organization_id": util.replaceDefaultNumber(row['organization_id']),
                            "organization_name": util.replaceDefaultString(row['organization_name']),
                            "organization_image_path": util.replaceDefaultString(row['organization_image_path']),
                            "organization_type_id": util.replaceDefaultNumber(row['organization_type_id']),
                            "organization_type_name": util.replaceDefaultString(row['organization_type_name']),
                            "organization_type_category_id": util.replaceDefaultNumber(row['organization_type_category_id']),
                            "organization_type_category_name": util.replaceDefaultString(row['organization_type_category_name']),
                            "manager_asset_id": util.replaceDefaultNumber(row['manager_asset_id']),
                            "manager_asset_first_name": util.replaceDefaultString(row['manager_asset_first_name']),
                            "manager_asset_last_name": util.replaceDefaultString(row['manager_asset_last_name']),
                            "manager_asset_image_path": util.replaceDefaultString(row['manager_asset_image_path']),
                            "manager_asset_type_id": util.replaceDefaultNumber(row['manager_asset_type_id']),
                            "manager_asset_type_name": util.replaceDefaultString(row['manager_asset_type_name']),
                            "manager_asset_type_category_id": util.replaceDefaultNumber(row['manager_asset_type_category_id']),
                            "manager_asset_type_category_name": util.replaceDefaultString(row['manager_asset_type_category_name']),
                            "log_asset_id": util.replaceDefaultNumber(row['log_asset_id']),
                            "log_asset_first_name": util.replaceDefaultString(row['log_asset_first_name']),
                            "log_asset_last_name": util.replaceDefaultString(row['log_asset_last_name']),
                            "log_asset_image_path": util.replaceDefaultString(row['log_asset_image_path']),
                            "log_datetime": util.replaceDefaultDatetime(row['log_datetime']),
                            "log_state": util.replaceDefaultString(row['log_state']),
                            "log_active": util.replaceDefaultString(row['log_active']),
                            "update_sequence_id": util.replaceDefaultNumber(row['update_sequence_id'])
                         }
                            responseData.push(rowData);
                            next();
                        }).then(function () {
                               callback(false, {data: responseData}, 200);
                        });
                  } else {
                    callback(false, {}, 200);
                    } 
                } else {
                    callback(true, {}, -9999);
                }  
             });
        }
    };

    var identifyCaller = function (request, callback) {
        var paramsArr = new Array(
                351, //request.organization_id,
                30, //request.asset_type_category_id,
                request.phone_number,
                request.country_code
                );
        var queryString = util.getQueryString('ds_v1_asset_list_select_phone_number_category', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if(err === false) {
                    //console.log(data);
                    (data.length > 0) ? callback(false, data[0].asset_id) : callback(false,0);
                } else {
                    callback(true, err);
                }                
            });
        }
    };
    
    var getCalledTime = function (request, callback) {
        console.log(util.getCurrentUTCTime())
        console.log(util.getDayStartDatetime());
        console.log(util.getDayEndDatetime());
        
        var paramsArr1 = new Array(
                351, //request.organization_id,
                util.addDays(util.getDayStartDatetime(),1),
                util.addDays(util.getDayEndDatetime(),1)
                );
        var queryString1 = util.getQueryString('ds_v1_activity_list_select_event_dt_between', paramsArr1);
        if (queryString1 != '') {
            db.executeQuery(1, queryString1, request, function (err, data) {
               console.log('getCalledTime :', data);
               (err === false) ? callback(false, data) : callback(true, err); 
            });
        }
    };
    
    
    var getReservationsCount = function (eventActivityId, callback) {
        var paramsArr = new Array(
                351, //request.organization_id,
                eventActivityId
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_reservation_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, eventActivityId, function (err, data) {
                console.log('getReservationsCount :', data);
                (err === false)? callback(false, data) : callback(true, err);
              }
            );
        }
    };
    
    this.generatePasscode = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.page_start,
                request.page_limit
                );
        var queryString = util.getQueryString('ds_p1_asset_list_select_all_admin_desks', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    //formatAssetCoverData(data, function (error, data) {
                      //  if (error === false)
                            callback(false, {data: data}, 200);
                    //});
                } else {
                    callback(false, {}, 200);
                }
            });
        }
    };
    
    this.assetAccessAdd = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        var paramsArr = new Array(
                request.user_asset_id,
                request.asset_email_id,
                request.asset_access_role_id,
                request.asset_access_level_id,
                request.target_asset_id,
                request.asset_type_id,
                request.activity_id,
                request.activity_type_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_p1_asset_access_mapping_insert', paramsArr);
        if (queryString != '') {
            //global.logger.write(queryString, request, 'asset', 'trace');
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    //callback(false, {"asset_id": assetData[0]['asset_id']}, 200);
                    callback(false, {}, 200);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, err, -9999);
                }
            });
        }
    }
    
    this.getUserAccessDetails = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.element_asset_id,
                request.asset_id,//user_asset_id,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
                );
        var queryString = util.getQueryString('ds_v1_asset_access_mapping_select_asset_access', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if(err === false){
                   if (data.length > 0) {
                    //console.log(data);
                    formatAssetAccountDataLevel(data, function (err, finalData) {
                        if (err === false) {
                            callback(false, {data: finalData}, 200);
                        }
                    });                    
                  } else {
                    callback(false, {}, 200);
                    } 
                } else {
                    callback(true, {}, -9999);
                }  
             });
        }
    };
    
    this.getAssetAccessAccountLevelDifferential = function (request, callback) {
        var paramsArr = new Array();
        var queryString = '';
        paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.asset_id,
                request.datetime_differential,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
                );
        queryString = util.getQueryString('ds_v1_asset_access_mapping_select_account_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    //console.log(data);
                    formatAssetAccountDataLevel(data, function (err, finalData) {
                        if (err === false) {
                            callback(false, {data: finalData}, 200);
                        }
                    });
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }

    };
    
   this.getMenuItemIngredients = function(request, callback) {
        var activityArray = JSON.parse(request.menu_activity_array);
        request['len'] = activityArray.length;
        var response = new Array();
        
        forEachAsync(activityArray, function (next, activityId) {
            //console.log(activityId);
            inventoryCheck(request, activityId, function(err, resp){
                if(err === false) {
                    //if(resp === true) {
                        response.push({menu_activity_id:activityId, status:resp})
                    //}
                     next();
                  }
               });         
           }).then(()=>{
               if(request.is_check == 1 && request.is_status == 0 && request.is_assign ==0) {
                    callback(false, response, 200);
               } else if(request.is_check == 1 && request.is_status == 1 && request.is_assign == 0) {
                    
                    forEachAsync(response, function (next, index) {
                            //console.log(index.menu_activity_id);
                            var x = (index.status === true)? 1 : 0;
                            changeActivityStatus(request, index.menu_activity_id, x).then(()=>{
                                next();
                            });                            
                        }).then(()=>{
                            callback(false, response, 200);
                    });
                    
                    
                 //} else if(request.is_check == 1 && request.is_status == 1 && request.is_assign ==1) {
                    //callback(false, {});
                 }
            });
    }
    
    var inventoryCheck = function (request, activityId, callback) {
        var paramsArr = new Array();
        var responseArray = new Array();
        var queryString = '';
        paramsArr = new Array(
                request.organization_id,
                request.account_id,
                activityId,
                request.asset_type_category_id,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
                );
        queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants_category', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    if(data.length > 0) {
                        var ingredients = new Array();
                        forEachAsync(data, function (next, x) {
                        var items = {
                                'ingredient_asset_id':x.asset_id,
                                'channel_activity_type_category_id': x.channel_activity_type_category_id,
                                'activity_sub_type_id' : x.activity_sub_type_id
                            };
                            
                            ingredients.push(items);
                            next();
                        }).then(()=>{
                            if(ingredients.length > 0) {
                                    ingredients = util.getUniqueValuesOfArray(ingredients);
                                    //console.log('Ingredients : ')
                                    //console.log(ingredients);
                                    //console.log('=============================')
                                    var stationIdArrays = new Array();
                                    var tempArray = new Array();
                                    forEachAsync(ingredients, function (next, x) {
                                        getArrayOfStationIds(request, x).then((data)=>{ 
                                                data = util.getUniqueValuesOfArray(data);
                                                stationIdArrays.push(data);
                                                tempArray = tempArray.concat(data);
                                                next();
                                            });
                                            
                                    }).then(()=>{
                                        console.log('stationIdArrays: ', stationIdArrays);
                                        //console.log(tempArray);
                                        tempArray.forEach(function(item, index){
                                            //console.log('util.getFrequency(item'+item+',tempArray) : ' , util.getFrequency(item, tempArray))
                                            //console.log('stationIdArrays.length : ', stationIdArrays.length)
                                            if(util.getFrequency(item, tempArray) == stationIdArrays.length) {
                                                responseArray.push(item);
                                            }
                                        });
                                        
                                        (responseArray.length > 0) ? callback(false, true) : callback(false, false);
                                       });
                                    
                                    }
                                 });
                                            
            }                                                                
               } else {
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };
    
    function getArrayOfStationIds (request, ingredients) {
        return new Promise((resolve, reject)=>{
            var response = new Array();
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                0, //request.station_asset_id,
                ingredients.ingredient_asset_id,//request.ingredient_asset_id,
                ingredients.channel_activity_type_category_id,
                ingredients.activity_sub_type_id,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
                );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_inventory_check', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if(err === false){
                        //console.log('DATA : ', data);
                        if(data.length > 0 ) {
                                forEachAsync(data, function (next, x) {
                                    response.push(x.activity_owner_asset_id);
                                    next();
                                }).then(()=>{
                                    resolve(response);
                                })
                        } else { resolve([]);}                                                
                    } else {
                        reject(err);
                    }                      
                });
            }
        
    })
    }   
    
    function changeActivityStatus(request, activityId, stockStatus) {
        return new Promise((resolve, reject)=>{
           activityCommonService.getActivityDetails(request, activityId, function(err, data){
            if(err === false) {
               request.workforce_id = data[0].workforce_id;
                             
               //console.log('stockStatus : ', stockStatus)
               //console.log(request.workforce_id);
               //console.log('data[0].activity_status_type_id:', data[0].activity_status_type_id);
               
               if(stockStatus === 1 && data[0].activity_status_type_id !=91) {
                   request.activity_status_type_id = 91;
                   getActivityStatusId(request,activityId).then(()=>{resolve(true)});                     
               } else if(stockStatus === 0 && data[0].activity_status_type_id !=93) {
                   request.activity_status_type_id = 93;
                   getActivityStatusId(request,activityId).then(()=>{resolve(true)})
               } else {
                   resolve(true);
               }
               //console.log(request.activity_status_type_id);
            } else {
                reject(err);
            }
        });
        });
    }
    
    function getActivityStatusId(request, activityId) {
       return new Promise((resolve, reject)=>{
           var paramsArr = new Array(
               request.organization_id,
               request.account_id,
               request.workforce_id,
               request.activity_status_type_id
               );
            var queryString = util.getQueryString('ds_v1_workforce_activity_status_mapping_select_status', paramsArr);
              if (queryString != '') {
                  db.executeQuery(0, queryString, request, function (err, resp) {
                      if (err === false) {
                          //console.log('Response : ', resp);
                          request.activity_status_id = resp[0].activity_status_id;
                          request.activity_id = activityId;
                          //activityService.alterActivityStatus(request, function(err, resp){});
                          var event = {
                                name: "alterActivityStatus",
                                service: "activityService",
                                method: "alterActivityStatus",
                                payload: request
                            };
                          queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp)=>{});                       
                          resolve(resp);
                        } else {
                          reject(err);
                      }
                  });
              }
       });
    }
    
    /*var getStations = function(request, ingredients, callback) {
        var paramsArr = new Array();
        var queryString = '';
        var stationAssetIds = new Array();
        forEachAsync(ingredients, function (next, x) {
            paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    x.channel_activity_type_category_id,
                    request.page_start,
                    util.replaceQueryLimit(request.page_limit)
                    );
            queryString = util.getQueryString('ds_v1_asset_list_select_category_status', paramsArr);
            if (queryString != '') {
                    db.executeQuery(1, queryString, request, function (err, data) {
                            if (err === false) {
                                forEachAsync(data, function (next, x) {
                                    //console.log(data);
                                    stationAssetIds.push(x.asset_id);
                                    next();
                                }).then(()=>{
                                    next();
                                })
                            }
                        });                    
            }         
         }).then(()=>{
             callback(false, stationAssetIds)
         })
    }
    
    var checkIngredientsInStation = function(request, stationAssetId, ingredients, callback) {
        var paramsArr = new Array();
        var queryString = '';
        var status;
        forEachAsync(ingredients, function (next, x) {
            paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    stationAssetId,
                    x.ingredient_asset_id,
                    request.page_start,
                    util.replaceQueryLimit(request.page_limit)
                    );
            queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_inventory_quantity', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        //console.log(data);
                        //console.log('x.activity_sub_type_id :', x.activity_sub_type_id);
                        //console.log('util.replaceZero(data.exisitng_inventory_quantity) :', data[0].exisitng_inventory_quantity);
                        status = (x.activity_sub_type_id <= util.replaceZero(data[0].exisitng_inventory_quantity)) ? 1 : 0;
                        next();
                    } else {
                        callback(true, err);
                        return;
                    }
                });
            }        
         }).then(()=>{
             callback(false, status);
         })
    }
    

    
    
    var getSumOpenOrderTimingsPerStation = function(request, stationAssetId, callback) {
      var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                stationAssetId                
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_station_waiting_mins', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, data);
                } else {
                    callback(err, false);
                }
            });
        }  
    };*/    
    
    var formatAssetAccountDataLevel = function (data, callback) {
        var responseArr = new Array();
        forEachAsync(data, function (next, row) {
            var rowData = {
                'user_mapping_id': util.replaceDefaultNumber(row['user_mapping_id']),
                'user_asset_id': util.replaceDefaultNumber(row['user_asset_id']),
                'user_asset_first_name': util.replaceDefaultString(row['user_asset_first_name']),
                'user_asset_last_name': util.replaceDefaultString(row['user_asset_last_name']),
                'user_asset_email_id': util.replaceDefaultString(row['user_asset_email_id']),
                'user_asset_access_role_id': util.replaceDefaultNumber(row['user_asset_access_role_id']),
                'user_asset_access_role_name': util.replaceDefaultString(row['user_asset_access_role_name']),
                'user_asset_access_level_id': util.replaceDefaultNumber(row['user_asset_access_level_id']),
                'user_asset_access_level_name': util.replaceDefaultString(row['user_asset_access_level_name']),
                'activity_id': util.replaceDefaultNumber(row['activity_id']),
                'activity_title': util.replaceDefaultString(row['activity_title']),
                'activity_type_id': util.replaceDefaultNumber(row['activity_type_id']),
                'activity_type_name': util.replaceDefaultString(row['activity_type_name']),
                'activity_type_category_id': util.replaceDefaultNumber(row['activity_type_category_id']),
                'activity_type_category_name': util.replaceDefaultString(row['activity_type_category_name']),
                'asset_id': util.replaceDefaultNumber(row['asset_id']),
                'asset_first_name': util.replaceDefaultString(row['asset_first_name']),
                'asset_last_name': util.replaceDefaultString(row['asset_last_name']),
                'asset_image_path': util.replaceDefaultString(row['asset_image_path']),
                'asset_type_id': util.replaceDefaultNumber(row['asset_type_id']),
                'asset_type_name': util.replaceDefaultString(row['asset_type_name']),
                'asset_type_category_id': util.replaceDefaultNumber(row['asset_type_category_id']),
                'asset_type_category_name': util.replaceDefaultString(row['asset_type_category_name']),
                'workforce_id': util.replaceDefaultNumber(row['workforce_id']),
                'workforce_name': util.replaceDefaultString(row['workforce_name']),
                'workforce_image_path': util.replaceDefaultString(row['workforce_image_path']),
                'workforce_type_id': util.replaceDefaultNumber(row['workforce_type_id']),
                'workforce_type_name': util.replaceDefaultString(row['workforce_type_name']),
                'workforce_type_category_id': util.replaceDefaultNumber(row['workforce_type_category_id']),
                'workforce_type_category_name': util.replaceDefaultString(row['workforce_type_category_name']),
                'account_id': util.replaceDefaultNumber(row['account_id']),
                'account_name': util.replaceDefaultString(row['account_name']),
                'account_image_path': util.replaceDefaultString(row['account_image_path']),
                'account_type_id': util.replaceDefaultNumber(row['account_type_id']),
                'account_type_name': util.replaceDefaultString(row['account_type_name']),
                'account_type_category_id': util.replaceDefaultNumber(row['account_type_category_id']),
                'account_type_category_name': util.replaceDefaultString(row['account_type_category_name']),
                'organization_id': util.replaceDefaultNumber(row['organization_id']),
                'organization_name': util.replaceDefaultString(row['organization_name']),
                'organization_image_path': util.replaceDefaultString(row['organization_image_path']),
                'organization_type_id': util.replaceDefaultNumber(row['organization_type_id']),
                'organization_type_name': util.replaceDefaultString(row['organization_type_name']),
                'organization_type_category_id': util.replaceDefaultNumber(row['organization_type_category_id']),
                'organization_type_category_name': util.replaceDefaultString(row['organization_type_category_name']),
                'workforce_view_map_enabled': util.replaceDefaultNumber(row['workforce_view_map_enabled']),
                'log_asset_id': util.replaceDefaultNumber(row['log_asset_id']),
                'log_asset_first_name': util.replaceDefaultString(row['log_asset_first_name']),
                'log_asset_last_name': util.replaceDefaultString(row['log_asset_first_name']),
                'log_asset_image_path': util.replaceDefaultString(row['log_asset_image_path']),
                'log_datetime': util.replaceDefaultDatetime(row['log_datetime']),
                'log_state': util.replaceDefaultNumber(row['log_state']),
                'log_active': util.replaceDefaultNumber(row['log_active']),
                'update_sequence_id': util.replaceDefaultNumber(row['update_sequence_id'])
            };
            responseArr.push(rowData);
            next();
        }).then(() => {
            callback(false, responseArr);
        });
    };
    
    this.updateOperatingAssetDetails = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        
        pamAssetListUpdateOperatingAsset(request).then(()=>{
            pamAssetListHistoryInsert(request, 212).then(()=>{
                callback(false, {}, 200);
            }).catch(()=>{
                callback(false, {}, -9999);
            });
        });
        
    }
        
    function pamAssetListUpdateOperatingAsset(request) {
         return new Promise((resolve, reject)=>{
             var paramsArr = new Array(
                request.work_station_asset_id,
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
                (err === false) ? resolve(true) : reject(err);
            });
            }
         })
    };
    
    function pamAssetListHistoryInsert(request, updateTypeId) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.work_station_asset_id,
                request.organization_id,
                updateTypeId,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_asset_list_history_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
              (err === false) ?  resolve(true) : reject(err);
                });
            }
        });
    }
        
}
;

module.exports = PamService;
