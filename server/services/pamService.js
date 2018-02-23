/*
 * author: Nani Kalyan V
 */
var fs = require('fs');

function PamService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
    var cacheWrapper = objectCollection.cacheWrapper;
    var queueWrapper = objectCollection.queueWrapper;
    var activityCommonService = objectCollection.activityCommonService;
          
    this.ivrService = function(request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime; 
        
        var response = {};
        var threshold = 0;
        var eventStartDateTime;
        var reservationCreatedDateTime;
        response.member = 0;
        response.member_name = '';
        response.called_before = '';
        response.event_id = 0;
        response.reservation_available = '';
        response.next_possible_reservation_time = '';
        response.reservation_id = 0;
        
        fs.readFile('/home/nani/Desker-vnk-API/Bharat/server/utils/pamConfig.txt', function(err, data){
            if(err) {
             console.log(err)   
            } else{
             threshold = Number(data.toString());
            }
        });

        identifyCaller(request, function(err, data){
            if(err === false){
                if(data !== 0) {
                    response.member = data.asset_id;
                    response.member_name = data.asset_first_name;
                    
                    getCalledTime(request, function(err, data){
                        if(err === false){
                           if(data.length > 0) {
                              eventStartDateTime = util.replaceDefaultDatetime(data[0].activity_datetime_start_expected);
                              
                              (eventStartDateTime >= logDatetime) ? response.called_before = 'true' : response.called_before = 'false';
                              response.event_id = data[0].activity_id;                   
                              getReservationsCount(data[0].activity_id, function(err,data){
                                if(err === false){
                                  (data.length > 0) ? ((data[0].reservation_count < threshold) ? response.reservation_available ='true' : response.reservation_available = 'false') : response.reservation_available = -99;

                                  //SMS Logic
                                  var nextAvailableDateTime;
                                  (response.called_before == 'true')?
                                       nextAvailableDateTime = util.addUnitsToDateTime(eventStartDateTime,6.5,'hours') :
                                       nextAvailableDateTime = util.addUnitsToDateTime(logDatetime,6.5,'hours');

                                  if(response.reservation_available == 'false') {
var text = "Dear "+response.member_name+" , Currently, there are no tables available for reservation. Please call us back after " + nextAvailableDateTime;
text+= " to check if there are any tables available for reservation."
                                           console.log('SMS text : \n', text + "\n");
                                           util.sendSmsMvaayoo(text, request.country_code, request.phone_number, function(err,res){});
                                   }
                                   ////////////////////

                                   if(response.called_before == 'false' && response.reservation_available == 'true') {
                                     if(logDatetime <= util.addUnitsToDateTime(data[0].activity_datetime_start_expected,1,'hours')) {
                                          response.next_possible_reservation_time = util.addUnitsToDateTime(logDatetime,1,'hours');
                                      } else {
                                          response.next_possible_reservation_time = '1970-01-01 00:00:00';
                                      }
                                     
                                     getReservationDetails(response.event_id, response.member).then((resp)=>{
                                           if (resp.length > 0 ) {
                                               response.reservation_id = resp[0].activity_id;
                                               reservationCreatedDateTime = util.replaceDefaultDatetime(resp[0].activity_datetime_created);
                                                                                      
                                               (Math.sign(util.differenceDatetimes(eventStartDateTime ,reservationCreatedDateTime)) === 1) ? 
                                                   expiryDateTime = util.addUnitsToDateTime(eventStartDateTime,6.5,'hours') :
                                                   expiryDateTime = util.addUnitsToDateTime(reservationCreatedDateTime,6.5,'hours');
                                           
                                                expiryDateTime = util.getDatetimewithAmPm(expiryDateTime);
                                            
                                               console.log('Expiry DAte time : ', expiryDateTime);
var smsText = "Dear "+response.member_name+" , Your reservation for today is confirmed. Please use the following reservation code " + resp[0].activity_sub_type_name;
smsText+= " . Note that this reservation code is only valid till "+expiryDateTime+" .";                                      
                                               console.log('smsText : ', smsText);
                                               util.sendSmsMvaayoo(smsText, request.country_code, request.phone_number, function(err,res){
                                                   if(err) {
                                                       console.log('Error in sending sms : ', err);
                                                   } else {
                                                       console.log('Message status : ', res);
                                                   }
                                               });
                                           }
                                           callback(false, response, 200);
                                      }).catch((err)=>{
                                            console.log('In Catch : ', err);
                                            callback(false, response, 200);
                                      })                   
                                  } else {
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
                } else {
                    callback(false, response, 200);
                } 
            } else {
                response.member = -99;
                callback(false, response, -9999);
            }
         });         
        
     }
     
     this.sendSms = function(request, callback) {
         util.sendSmsMvaayoo(request.text, request.country_code, request.phone_number, function(err,res){
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
                    (data.length > 0) ? callback(false, data[0]) : callback(false,0);
                } else {
                    callback(true, err);
                }                
            });
        }
    };
    
    var getCalledTime = function (request, callback) {
        console.log(util.getCurrentUTCTime());
        console.log(util.getDayStartDatetime());
        console.log(util.getDayEndDatetime());
        
        var paramsArr1 = new Array(
                351, //request.organization_id,
                util.addDays(util.getDayStartDatetime()),
                util.addDays(util.getDayEndDatetime())
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
    
    function getReservationDetails(eventActivityId, memberAssetId) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                351, //request.organization_id,
                452, //request.account_id,
                eventActivityId,
                memberAssetId
                );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_reservation', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, eventActivityId, function (err, data) {
                    console.log('Reservation Details :', data);
                    (err === false)? resolve(data) : reject(err);
                  }
                );
            }
        });        
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
        var globalStationIds =  new Array();
        
        forEachAsync(activityArray, function (next, activityId) {
            //console.log(activityId);
            activityCommonService.inventoryCheck(request, activityId, function(err, resp, stationIds){
            if(err === false) {
                    //if(resp === true) {                    
                        response.push({menu_activity_id:activityId, status:resp})
                        globalStationIds.push({menu_activity_id:activityId, status:resp, station_ids: stationIds});
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
                 } else if(request.is_check == 0 && request.is_status == 0 && request.is_assign == 0) {
                    /*var assignResponse = new Array();
                    forEachAsync(globalStationIds, function (next, index) {
                         console.log(globalStationIds)
                         console.log(util.getUniqueValuesOfArray(index.station_ids));
                         if(util.getUniqueValuesOfArray(index.station_ids) > 0) {
                            getSumOpenOrderTimingsPerStation(request, util.getUniqueValuesOfArray(index.station_ids)).then((data)=>{
                             //assignResponse.push({menu_activity_id:index.menu_activity_id, status: index.status, station_id:data.station_id, minimum_time: data.time});
                             assignResponse.push({menu_activity_id:index.menu_activity_id, status: index.status,minimum_time: data});
                             next();
                            });
                         } else{
                             next();
                         }               
                     }).then(()=>{
                         console.log('assignResponse : ', assignResponse);
                        callback(false,assignResponse,200);
                     })          */
                }
            });
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
                          if(request.activity_status_type_id != 103) {
                            //console.log('Response : ', resp);
                            request.activity_status_id = resp[0].activity_status_id;
                            request.activity_id = activityId;
                                                        
                            var event = {
                                name: "alterActivityStatus",
                                service: "activityService",
                                method: "alterActivityStatus",
                                payload: request
                              };
                              queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp)=>{});
                             }
                            
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
    } */
    
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
            pamAssetListHistoryInsert(request, 212).then(()=>{ });
            callback(false, {}, 200);           
            }).catch(()=>{
                callback(false, {}, -9999);
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
                (err === false) ? resolve() : reject(err);
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
              (err === false) ?  resolve() : reject(err);
                });
            }
        });
    }
    
    //Main function
    this.stationAssignAlter = function(request, callback){
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        request['activity_type_category_id'] = 38;
        
        assignMinWaitTimeStation(request).then((data)=>{
           var minStationId = data;
           console.log('minStationId :',minStationId);
           var tempArray = new Array();
           tempArray.push({"asset_id":minStationId,"access_role_id":"123","message_unique_id": util.getMessageUniqueId(request.asset_id),"workforce_id":request.workforce_id,"organization_id":request.organization_id,"account_id":request.account_id});
           request['activity_participant_collection'] = JSON.stringify(tempArray);
           
           pamAssignCoworker(request, function(err, resp){
               if(err === false) {
                   request.activity_status_type_id = 103;
                   getActivityStatusId(request, request.activity_id).then((data)=>{
                       request.activity_status_id = data[0].activity_status_id;
                       
                       pamAlterActivityStatus(request).then(()=>{
                            callback(false, {}, 200);
                       });              
                   });
               } else {
                   callback(true, err, -9999);
               }
           });           
        }).catch((err)=>{
            callback(true, err, -9999);
        });
    };
    
    function assignMinWaitTimeStation(request){
        return new Promise((resolve, reject)=>{
            activityCommonService.inventoryCheck(request, request.menu_activity_id, function(err, resp, stationIds){
                if(err === false) {
                    if(stationIds.length > 0) {
                        stationIds = util.getUniqueValuesOfArray(stationIds);
                        console.log('stationIds :', stationIds);
                        getSumOpenOrderTimingsPerStation(request, stationIds)
                          .then((data)=>{
                              resolve(data);
                        });                                    
                    } else { reject('No Station Ids');}
                } else { reject(err); }
             });
         });
    }
    
    function getSumOpenOrderTimingsPerStation(request, stationAssetIds) {
      return new Promise((resolve, reject)=>{
        var minTime = 9999999999;
        var minStationId;
        
        forEachAsync(stationAssetIds, function (next, row) {
            var paramsArr = new Array(
              request.organization_id,
              request.account_id,
              row
              );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_station_waiting_mins', paramsArr);
            if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                console.log(data);
                if (err === false) {
                    if(data[0].waiting_time_in_minutes < minTime) {
                        minTime = data[0].waiting_time_in_minutes;
                        minStationId = row;
                    }
                    next();
                }                
            });
            }           
        }).then(()=>{
            resolve(minStationId);
        });
      });          
    };
    
    
    //Add Paritipant ==============================================================
    var pamAssignCoworker = function (request, callback) { //Addparticipant Request

        var loopAddParticipant = function (participantCollection, index, maxIndex) {
            iterateAddParticipant(participantCollection, index, maxIndex, function (err, data) {});
        };

        var iterateAddParticipant = function (participantCollection, index, maxIndex, callback) {
            var participantData = participantCollection[index];
            isParticipantAlreadyAssigned(participantData, request.activity_id, request, function (err, alreadyAssignedStatus, newRecordStatus) {
                if ((err === false) && (!alreadyAssignedStatus)) {
                    //proceed and add a participant
                    addParticipant(request, participantData, newRecordStatus, function (err, data) {
                        if (err === false) {
                            //console.log("participant successfully added");
                            global.logger.write('debug','participant successfully added', {},request)
                            var nextIndex = index + 1;
                            if (nextIndex <= maxIndex) {
                                loopAddParticipant(participantCollection, nextIndex, maxIndex);
                            }
                            callback(false, true);
                        } else {
                            console.log(err);
                            global.logger.write('serverError','' + err, {},request)
                            callback(true, err);
                        }
                    }.bind(this));
                } else {
                    if (alreadyAssignedStatus > 0) {
                        global.logger.write('debug','participant already assigned', {}, request)
                        var nextIndex = index + 1;
                        if (nextIndex <= maxIndex) {
                            loopAddParticipant(participantCollection, nextIndex, maxIndex);
                        }
                        callback(false, true);
                    } else {
                        callback(true, err);
                    }
                }
            });

        };
        activityCommonService.updateAssetLocation(request, function (err, data) {});
        var activityStreamTypeId = 2; //Older 2:added participant
        console.log('request.activity_type_category_id : ', request.activity_type_category_id);
        if (request.hasOwnProperty('activity_type_category_id')) {
            var activityTypeCategroyId = Number(request.activity_type_category_id);
            console.log('activityTypeCategroyId : ', activityTypeCategroyId);
            switch (activityTypeCategroyId) {
                //PAM
                case 36:    //Menu Item
                    activityStreamTypeId = 19002;
                    break;
                case 37:    //Reservation
                    activityStreamTypeId = 18002;
                    break;
                case 38:    //Item Order
                    activityStreamTypeId = 21002;
                    break;
                case 39:    //Inventory
                    activityStreamTypeId = 20002;
                    break;
                case 40:    //Payment
                    activityStreamTypeId = 22005;
                    break;
                case 41:    //Event
                    activityStreamTypeId = 17002;
                    break;                
            };
        }
        console.log('activityStreamTypeId : ', activityStreamTypeId);
        request['activity_streamtype_id'] = activityStreamTypeId;
        activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
        var index = 0;       
        var activityParticipantCollection = JSON.parse(request.activity_participant_collection);
        var maxIndex = activityParticipantCollection.length - 1;
        //var maxIndex = request.activity_participant_collection.length - 1;
        iterateAddParticipant(activityParticipantCollection, index, maxIndex, function (err, data) {
            if (err === false && data === true) {
                if (maxIndex === index) {
                    activityCommonService.updateAssetLastSeenDatetime(request, function (err, data) { });
                    callback(false, true);
              }
            } else {
                callback(true, err);
            }
        });
    };
    
    var addParticipant = function (request, participantData, newRecordStatus, callback) {
        if (newRecordStatus) {
            activityAssetMappingInsertParticipantAssign(request, participantData, function (err, data) {
                if (err === false) {
                    console.log('In add participant function request.activity_streamtype_id : ', request.activity_streamtype_id);
                    activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {});
                    activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {});
                    activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 0, function (err, restult) {});
                    callback(false, true);
                } else {
                    callback(true, err);
                }
            });
        } else {
            //console.log('re-assigining to the archived row');
            global.logger.write('debug','re-assigining to the archived row', {},request)
            activityAssetMappingUpdateParticipantReAssign(request, participantData, function (err, data) {
                if (err === false) {
                    activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 502, function (err, restult) {
                        if (err === false) {
                            console.log('In else part add participant function request.activity_streamtype_id : ', request.activity_streamtype_id);
                            activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {});
                            activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {});                             
                        }                        
                    });
                    callback(false, true);
                } else {
                    callback(true, err);
                }
            });
        }
    };
    
    var isParticipantAlreadyAssigned = function (assetCollection, activityId, request, callback) {
        var fieldId = 0;
        if (assetCollection.hasOwnProperty('field_id')) {
            fieldId = assetCollection.field_id;
        }
        var paramsArr = new Array(
                activityId,
                assetCollection.asset_id,
                assetCollection.organization_id,
                fieldId
                );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_select_check_participant_appr", paramsArr);

        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false)
                {
                    //var queryStatus = (data.length > 0) ? (data[0]['log_state']< 3)?true:false : false;
                    var queryStatus = false;
                    var newRecordFalg = false;
                    if (data.length > 0) {
                        if (data[0]['log_state'] < 3) {
                            queryStatus = true;
                        } else {
                            queryStatus = false;
                            newRecordFalg = false;
                        }
                    } else {
                        queryStatus = false;
                        newRecordFalg = true;
                    }
                    callback(false, queryStatus, newRecordFalg);
                    return;
                } else {
                    callback(true, err);
                    console.log('nani : ', err);
                    global.logger.write('serverError','' + err, request)
                    return;
                }
            });
        }
    };
    
        var activityAssetMappingInsertParticipantAssign = function (request, participantData, callback) {
        var fieldId = 0;
        var quantityUnitType = (request.hasOwnProperty('quantity_unit_type')) ? request.quantity_unit_type : '';
        var quantityUnitValue = (request.hasOwnProperty('quantity_unit_value')) ? request.quantity_unit_value : -1;
        
        if (participantData.hasOwnProperty('field_id')) {
            fieldId = participantData.field_id;
        }
        var paramsArr = new Array(
                request.activity_id,
                participantData.asset_id,
                participantData.workforce_id,
                participantData.account_id,
                participantData.organization_id,
                participantData.access_role_id,
                participantData.message_unique_id,
                request.flag_retry,
                request.flag_offline,
                request.asset_id,
                request.datetime_log,
                fieldId,
                quantityUnitType,
                quantityUnitValue
                );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_insert_asset_assign_appr_ingre", paramsArr);
        //var queryString = util.getQueryString("ds_v1_activity_asset_mapping_insert_asset_assign_appr", paramsArr);

        if (queryString !== '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    //console.log(err);
                    global.logger.write('serverError','' + err, request)
                    return;
                }
            });
        }
    };
    
    var activityAssetMappingUpdateParticipantReAssign = function (request, participantData, callback) {
        var fieldId = 0;
        if (participantData.hasOwnProperty('field_id')) {
            fieldId = participantData.field_id;
        }
        var paramsArr = new Array(
                request.activity_id,
                participantData.asset_id,
                participantData.organization_id,
                fieldId,
                request.asset_id,
                request.datetime_log
                );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_update_reassign_participant_appr", paramsArr);

        if (queryString !== '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    //console.log(err);
                    global.logger.write('serverError','' + err, request)
                    return;
                }
            });
        }
    };
    
    //End Add Participant======================================================
    
    this.bulkStatusAlter = function(request, callback){
        var logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;
        var newRequest = new Array();
        var cnt = 0;
        
        var orderActivityCollection = JSON.parse(request.order_activity_collection);        
        forEachAsync(orderActivityCollection, function (next, x) {
            newRequest[cnt] = Object.assign({}, request);
            newRequest[cnt].activity_id = x.activity_id;
            newRequest[cnt].activity_status_id = x.activity_status_id;
            newRequest[cnt].activity_status_type_id = x.activity_status_type_id;
            newRequest[cnt].activity_type_category_id = x.activity_type_category_id;
            newRequest[cnt].workforce_id = x.workforce_id;
                        
            console.log('=============================');
            pamBulkAlterActivityStatus(newRequest[cnt]).then(()=>{
                cnt++;
                next();
            }).catch(()=>{
                callback(false, {}, -9999);
            })
        }).then(()=>{
            callback(false, {}, 200);
        })
    };   
    
    //Alter Activity Status
    function pamAlterActivityStatus(request){
        return new Promise((resolve, reject)=>{
            var activityStreamTypeId;
            var activityStatusId = Number(request.activity_status_id);
            var activityStatusTypeId = Number(request.activity_status_type_id) || 103;
            
            if (request.hasOwnProperty('activity_type_category_id')) {
                var activityTypeCategroyId = Number(request.activity_type_category_id);
                switch (activityTypeCategroyId) {
                    //PAM
                    case 36:    //Menu Item
                        activityStreamTypeId = 19004;
                        break;
                    case 37:    //Reservation
                        activityStreamTypeId = 18004;
                        break;
                    case 38:    //Reservation
                        activityStreamTypeId = 21004;
                        break;
                    case 39:    //
                        activityStreamTypeId = 20004;
                        break;
                    case 40:    //Payment
                        activityStreamTypeId = 22007;
                        break;
                    case 41:    //Event
                        activityStreamTypeId = 17004;
                        break;
                    default:    //Event
                        activityStreamTypeId = 0;
                        break;
                };
                request.activity_stream_type_id = activityStreamTypeId;
            }
            activityCommonService.updateAssetLocation(request, function (err, data) {});
            activityListUpdateStatus(request).then(()=>{
                    assetActivityListUpdateStatus(request, activityStatusId, activityStatusTypeId).then(()=>{
                        activityCommonService.activityListHistoryInsert(request, 402, function (err, result) {});
                        activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});
                        activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});
                        activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {});
                        activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});
                        resolve();
                    });                
             });                
         });       
    };
    
        //Alter Activity Status
    function pamBulkAlterActivityStatus(request){
        return new Promise((resolve, reject)=>{
            var activityStreamTypeId;
            var activityStatusId = Number(request.activity_status_id);
            var activityStatusTypeId = Number(request.activity_status_type_id) || 103;
            
            if (request.hasOwnProperty('activity_type_category_id')) {
                var activityTypeCategroyId = Number(request.activity_type_category_id);
                switch (activityTypeCategroyId) {
                    //PAM
                    case 36:    //Menu Item
                        activityStreamTypeId = 19004;
                        break;
                    case 37:    //Reservation
                        activityStreamTypeId = 18004;
                        break;
                    case 38:    //Reservation
                        activityStreamTypeId = 21004;
                        break;
                    case 39:    //
                        activityStreamTypeId = 20004;
                        break;
                    case 40:    //Payment
                        activityStreamTypeId = 22007;
                        break;
                    case 41:    //Event
                        activityStreamTypeId = 17004;
                        break;
                    default:    //Event
                        activityStreamTypeId = 0;
                        break;
                };
                request.activity_stream_type_id = activityStreamTypeId;
            }
            activityCommonService.updateAssetLocation(request, function (err, data) {});
            activityListUpdateStatusBulk(request).then(()=>{
                    assetActivityListUpdateStatusBulk(request, activityStatusId, activityStatusTypeId).then(()=>{
                        activityCommonService.activityListHistoryInsert(request, 402, function (err, result) {
                            if(err === false) {
                                resolve();
                            }
                        });                       
                    });                
             });                
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
                request.datetime_log
                );
            var queryString = util.getQueryString("ds_v1_activity_list_update_status", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                   (err === false)? resolve() : reject(err);                        
                });
            }
        })
    }
    
    function activityListUpdateStatusBulk(request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                request.activity_status_id,
                request.activity_status_type_id,
                request.asset_id,
                request.datetime_log
                );
            var queryString = util.getQueryString("ds_v1_activity_list_update_status_pam", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                   (err === false)? resolve() : reject(err);                        
                });
            }
        })
    }
    
    function assetActivityListUpdateStatusBulk(request, activityStatusId, activityStatusTypeId){
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
                                activityStatusId,
                                activityStatusTypeId,
                                request.asset_id,
                                request.datetime_log
                                );
                        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_status_pam', paramsArr);
                        db.executeQuery(0, queryString, request, function (error, queryResponse) { });
                    }, this);
                    resolve();                
                } else {
                    reject(err);
                }
            });
        });      
    };
    
    function assetActivityListUpdateStatus(request, activityStatusId, activityStatusTypeId){
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
                                activityStatusId,
                                activityStatusTypeId,
                                request.datetime_log
                                );
                        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_status', paramsArr);
                        db.executeQuery(0, queryString, request, function (error, queryResponse) { });
                    }, this);
                    resolve();                
                } else {
                    reject(err);
                }
            });
        });      
    };
//Alter Activity Status===============================================================

 this.checkingReservationCode = function(request, callback){
     response = {};
     getCalledTime(request, function(err, data){
             if(err === false){
                if(data.length > 0){
                   request.activity_parent_id = data[0].activity_id;
                   response.event_activity_id = request.activity_parent_id;
                   activityCommonService.checkingUniqueCode(request, request.reservation_code, function(err, resp){
                      if(err === false){
                          callback(true, 'Invalid Reservation Code', -991)
                      } else {
                           response.reservation_activity_id = resp[0].activity_id;
                           
                           getMemberAssetId(request, resp[0].activity_id).then((result)=>{ 
                               response.asset_id = result[0].asset_id;
                               response.asset_first_name = result[0].asset_first_name;
                               
                               response.asset_image_path = util.replaceDefaultString(resp[0].asset_image_path);
                               response.activity_status_type_id = (resp[0].activity_status_type_id) ? resp[0].activity_status_type_id : 0;
                               response.activity_status_type_name = util.replaceDefaultString(resp[0].activity_status_type_name);
                               
                               if(response.activity_status_type_id == 0 || response.activity_status_type_id == 95) {
                                   if(request.app_code == 1) {
                                       request.activity_status_type_id = 97;
                                       getActivityStatusId(request, response.reservation_activity_id).then((res)=>{});
                                   }
                               } else if (response.activity_status_type_id == 97) {
                                   if(request.app_code == 2) {
                                       request.activity_status_type_id = 98;
                                       getActivityStatusId(request, response.reservation_activity_id).then((res)=>{});
                                   }                                   
                               }                             
                               
                               cacheWrapper.getTokenAuth(result[0].asset_id, function(err, resp){
                                   if(resp !== false) {
                                       response.asset_auth_token = resp;
                                       callback(false, response, 200);
                                   } else {
                                       callback(false, response, 200);
                                   }
                               })                               
                           }).catch(()=>{
                               callback(true, {}, -9999);
                           })
                      }
                   });
               } else {
                   callback(true, 'No events available', -992);
               }
           } else {
               callback(true,{}, -9999);
           }
       })
 }
 
 function getMemberAssetId(request, activityId) {
     return new Promise((resolve, reject)=>{
        var paramsArr = new Array();
        var queryString = '';
        paramsArr = new Array(
                request.organization_id,
                request.account_id,
                activityId,
                30, //request.asset_type_category_id
                0,
                1
                );
        queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants_category', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                console.log('getMemberAssetId data: ', data);
                (err === false) ? resolve(data) : reject(err);                    
                });
            } 
     })   
        
   }
   
  this.itemOrderWsCheck = function(request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.item_activity_id,
                request.asset_type_category_id,
                0,
                1
                );

        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants_category', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if(err === false) {
                    console.log('data : ', data);
                    if (data.length > 0) {
                        callback(true, data[0], 200);
                    } else {
                        //then assign
                        request.activity_id = request.item_activity_id;
                        request.activity_type_category_id = 38;
                        var event = {
                            name: "assignParticipnt",
                            service: "activityParticipantService",
                            method: "assignCoworker",
                            payload: request
                        };
                        console.log('Request before the queuewrapper : ', request);
                        //queueWrapper.raiseActivityEvent(event, request.item_activity_id, (err, resp)=>{});
                        var response = {};
                        response.asset_id = Number(request.station_asset_id);
                        response.activity_status_type_id = 102;
                        response.activity_status_type_name = "Ordered";
                        callback(false, response, 200);
                    }
                } else {
                    callback(true, {}, -9999);
                }                
            });
        }        
    };
     
}
;

module.exports = PamService;
