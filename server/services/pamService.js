/*
 * author: Nani Kalyan V
 */
var fs = require('fs');
var uuid = require('uuid');
var AwsSns = require('../utils/snsWrapper');

function PamService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
    var cacheWrapper = objectCollection.cacheWrapper;
    var queueWrapper = objectCollection.queueWrapper;
    var activityCommonService = objectCollection.activityCommonService;
    var sns = new AwsSns();
          
    this.ivrService = function(request, callback) {
        console.log('Request params received for ivr Service : ' , request);
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
                } else {
                    //Send Sms                    
            var txt = "Thank you for calling in today. As i was mentioning on the call, to become a member you need to be recommended by one of our existing members.";
                txt += " Email me at pam@puddingandmink.com to get further details. -PAM";
                
                    console.log('SMS text : \n', txt);
                    util.pamSendSmsMvaayoo(txt, request.country_code, request.phone_number, function(err,res){
                        if(err === false) {
                            console.log('Message Sent! : ', res);
                        } else {
                            console.log('Error in sending SMS : ', err);
                        }
                        
                    });
                cacheWrapper.getActivityId(function (err, activityId) {
                    if (err) {
                        console.log(err);                        
                    } else {
                        request['activity_id'] = activityId;
                        request.organization_id = 351;
                        request.account_id = 452;
                        request.workforce_id = 2085;
                        request.activity_type_category_id = 42;
                        request.activity_type_id = 51734;
                        request.activity_title = request.phone_number;
                        var x = {};
                        x.country_code = request.country_code;
                        x.phone_number = request.phone_number;
                        
                        request.activity_inline_data = JSON.stringify(x);
                        
                        var event = {
                            name: "addActivity",
                            service: "activityService",
                            method: "addActivity",
                            payload: request
                            };
                        queueWrapper.raiseActivityEvent(event, activityId, (err, resp)=>{});
                        console.log("new activityId is : " + activityId);                        
                        }
                    });
                }
                    
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
var text = "Dear "+response.member_name+","+" Currently, there are no tables available for reservation. Please call us back after " + nextAvailableDateTime;
text+= " to check if there are any tables available for reservation.";
                                           console.log('SMS text : \n', text + "\n");
                                           util.pamSendSmsMvaayoo(text, request.country_code, request.phone_number, function(err,res){});
                                   }
                                   ////////////////////

                                   //if(response.called_before == 'false' && response.reservation_available == 'true') {
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
                                                var reservationCode = resp[0].activity_sub_type_name;
                                            
                                               console.log('Expiry DAte time : ', expiryDateTime);
/*var smsText = "Dear "+response.member_name+" , Your reservation for today is confirmed. Please use the following reservation code " + resp[0].activity_sub_type_name;
smsText+= " . Note that this reservation code is only valid till "+expiryDateTime+" .";                                      
                                              console.log('smsText : ', smsText);
                                              util.pamSendSmsMvaayoo(smsText, request.country_code, request.phone_number, function(err,res){
                                                   if(err) {
                                                       console.log('Error in sending sms : ', err);
                                                   } else {
                                                       console.log('Message status : ', res);
                                                   }
                                               }); */
                                            
                                            request.activity_id = response.reservation_id;
                                            request.organization_id = 351;
                                            request.member_name = response.member_name;

                                            activityCommonService.getActivityDetails(request, 0, function(err, data){
                                                if(err === false) {
                                                    //console.log('Activity Details : ' , data);
                                                    var inlineJson = JSON.parse(data[0].activity_inline_data);
                                                    request.no_of_guests = util.replaceDefaultNumber(inlineJson.party_size);
                                                    activityCommonService.sendSmsCode(request).then(()=>{});
                                                 } else {
                                                        callback(false, response, -9999);
                                                    }
                                                });
                                           }
                                           callback(false, response, 200);
                                      }).catch((err)=>{
                                            console.log('In Catch : ', err);
                                            callback(false, response, 200);
                                      })                   
                                  /*} else {
                                      callback(false, response, 200);
                                  }*/
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
                /*} else {
                    callback(false, response, 200);
                } */
            } else {
                response.member = -99;
                callback(false, response, -9999);
            }
         });         
        
     }
     
     this.sendSms = function(request, callback) {
         util.pamSendSmsMvaayoo(request.text, request.country_code, request.phone_number, function(err,res){
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
        getEventDatetime(request).then((resp)=>{
            if(resp.length > 0) {
                callback(false, resp);
            } else {
                console.log(util.getCurrentISTTime());
                console.log(util.getDayStartDatetimeIST());
                console.log(util.getDayEndDatetimeIST());

                var paramsArr1 = new Array(
                        351, //request.organization_id,
                        util.addUnitsToDateTime(util.getDayStartDatetimeIST(),-5.5,'hours'),
                        util.addUnitsToDateTime(util.getDayEndDatetimeIST(),-5.5,'hours')
                        );
                var queryString1 = util.getQueryString('ds_v1_activity_list_select_event_dt_between', paramsArr1);
                if (queryString1 != '') {
                    db.executeQuery(1, queryString1, request, function (err, data) {
                       console.log('getCalledTime :', data);
                       (err === false) ? callback(false, data) : callback(true, err); 
                    });
                }
            }
        }).catch((err)=>{
            callback(true, err);
        });    
    };

     function getEventDatetime (request){
        return new Promise((resolve, reject)=>{
            var paramsArr1 = new Array(
                351, //request.organization_id,
                452, //request.account_id,
                request.datetime_log
                );
            var queryString1 = util.getQueryString('ds_v1_activity_list_select_event_datetime', paramsArr1);
            if (queryString1 != '') {
                db.executeQuery(1, queryString1, request, function (err, data) {
                   console.log('getEventDatetime :', data);
                   (err === false) ? resolve(data) : reject(err);
                });
            }
        })        
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
        
        pamGetEmpStations(request).then((data)=>{
            if(data.length > 0) {                
                forEachAsync(data, function (next, row) {                    
                    pamAssetListUpdateOperatingAsset(request, row.asset_id, 0).then(()=>{
                        pamAssetListHistoryInsert(request, 40, row.asset_id).then(()=>{ 
                            next();
                            });
                        });                        
                }).then(()=>{
                    pamAssetListUpdateOperatingAssetUnoccupied(request).then(()=>{
                       getAssetDetails(request).then((resp)=>{
                           callback(false, {"asset_id" : resp[0].asset_id, "operating_asset_id" : resp[0].operating_asset_id}, 200);
                        });                       
                        pamAssetListHistoryInsert(request, 7, request.work_station_asset_id).then(()=>{ });
                    }).catch((err)=>{ callback(true, err, -9999);});
                });                
            } else {
                pamAssetListUpdateOperatingAssetUnoccupied(request).then(()=>{
                        getAssetDetails(request).then((resp)=>{
                           callback(false, {"asset_id" : resp[0].asset_id, "operating_asset_id" : resp[0].operating_asset_id}, 200);
                        });                        
                        pamAssetListHistoryInsert(request, 7, request.work_station_asset_id).then(()=>{ });                        
                    }).catch((err)=>{ callback(true, err, -9999); });                                
            }
        });
        
               
    };
    
    function pamGetEmpStations(request) {
        return new Promise((resolve, reject)=>{
             var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.asset_id,
                0,
                50
                );
        var queryString = util.getQueryString('ds_v1_asset_list_select_employee_stations', paramsArr);
        if (queryString != '') {            
            db.executeQuery(1, queryString, request, function (err, data) {
                console.log('Getemp stations: ' + JSON.stringify(data));
                (err === false) ? resolve(data) : reject(err);
            });
            }
         })
    };
    
    function pamAssetListUpdateOperatingAsset(request, assetId, operatingAsstId) {
         return new Promise((resolve, reject)=>{
             var paramsArr = new Array(
                assetId,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                operatingAsstId,
                request.asset_id,
                request.datetime_log
                );

        var queryString = util.getQueryString('ds_v1_asset_list_update_operating_asset', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? resolve() : reject(err);
            });
            }
         });
    };
        
    function pamAssetListUpdateOperatingAssetUnoccupied(request) {
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

        var queryString = util.getQueryString('ds_v1_asset_list_update_operating_asset_unoccupied', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? resolve() : reject(err);
            });
            }
         })
    };
    
    function pamAssetListHistoryInsert(request, updateTypeId, assetId) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                assetId, //request.work_station_asset_id,
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
    
    function getAssetDetails(request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.organization_id,
                request.work_station_asset_id
                );
            var queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log('get Asset Details : ' + JSON.stringify(data));
                    (err === false)? resolve(data) : reject(err);
                });
            }
        });
    };
    
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
    
    this.pamAssignParticipant = function(request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        
        pamAssignCoworker(request, function(err, resp){
               if(err === false) {
                   request.activity_status_type_id = 103;
                   getActivityStatusId(request, request.activity_id).then((data)=>{
                       request.activity_status_id = data[0].activity_status_id;
                       callback(false, true);
                       /*pamAlterActivityStatus(request).then(()=>{                            
                            callback(false, true);
                       });*/
                   });
               } else {
                   callback(true, false);
               }
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
        console.log('In isParticipantAlreadyAssigned - assetCollection : ', assetCollection);
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
        console.log('In function activityAssetMappingInsertParticipantAssign - participantData : ', participantData);
        var quantityUnitType = (request.hasOwnProperty('quantity_unit_type')) ? request.quantity_unit_type : '';
        var quantityUnitValue = (request.hasOwnProperty('quantity_unit_value')) ? request.quantity_unit_value : -1;
        var optionId = (request.hasOwnProperty('option_id')) ? request.option_id : -1;
        var optionName = (request.hasOwnProperty('option_name')) ? request.option_name : '';
        
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
                quantityUnitValue,
                optionId,
                optionName
                );
        var queryString = util.getQueryString("ds_v1_activity_asset_mapping_insert_asset_assign_pam", paramsArr);
        //var queryString = util.getQueryString("ds_v1_activity_asset_mapping_insert_asset_assign_appr_ingre", paramsArr);
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
            //activityCommonService.updateAssetLocation(request, function (err, data) {});
            activityListUpdateStatus(request).then(()=>{
                    assetActivityListUpdateStatus(request, activityStatusId, activityStatusTypeId).then(()=>{
                        activityCommonService.activityListHistoryInsert(request, 402, function (err, result) {});
                        //activityCommonService.assetTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});
                        //activityCommonService.activityTimelineTransactionInsert(request, {}, activityStreamTypeId, function (err, data) {});
                        //activityCommonService.updateActivityLogDiffDatetime(request, request.asset_id, function (err, data) {});
                        //activityCommonService.updateActivityLogLastUpdatedDatetime(request, Number(request.asset_id), function (err, data) {});
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
                request.datetime_log,
                request.activity_sub_type_id
                );
            var queryString = util.getQueryString("ds_v1_activity_list_update_status_pam2", paramsArr);
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
                                request.datetime_log,
                                request.activity_sub_type_id
                                );
                        queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_status_pam2', paramsArr);
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
     console.log('Request Params : ', request);
     
     if(request.app_code == 1 || request.app_code == 2) {
        if(request.hasOwnProperty('track_gps_datetime')){
            request.datetime_log = request.track_gps_datetime;
        }  else {
            var logDatetime = util.getCurrentUTCTime();        
            request['datetime_log'] = logDatetime;
        }
        getCalledTime(request, function(err, data){
                if(err === false){
                   if(data.length > 0){
                      request.activity_parent_id = data[0].activity_id;
                      response.event_activity_id = request.activity_parent_id;
                      activityCommonService.checkingUniqueCode(request, request.reservation_code, function(err, resp){
                         if(err === false){
                             //Check the member with the same code                            
                            checkingFourDgtUniqueCode(request, request.reservation_code, function(err1, data){ //err1 true - array; false - code
                                //Member Exists
                                if(Array.isArray(data) && data.length > 0 ) { //Adding member details to response
                                    response.asset_id = data[0].asset_id;
                                    response.asset_first_name = data[0].asset_first_name;
                                    response.asset_last_name = data[0].asset_last_name;
                                    response.asset_phone_passcode = data[0].asset_phone_passcode;
                                    
                                    assetStatusUpdate(request).then(()=>{
                                        pamAssetListHistoryInsert(request, 207, request.asset_id).then(()=>{});
                                    });
                                    callback(true, response, -995);
                                } else {
                                    callback(true, 'Invalid Reservation Code', -991);
                                }
                            });
                              
                         } else {
                             
                              assetStatusUpdate(request).then(()=>{
                                        pamAssetListHistoryInsert(request, 207, request.asset_id).then(()=>{});
                                    });
                              response.reservation_activity_id = resp[0].activity_id;
                              response.activity_status_type_id = (resp[0].activity_status_type_id) ? resp[0].activity_status_type_id : 0;
                              response.activity_status_type_name = util.replaceDefaultString(resp[0].activity_status_type_name);
                              response.asset_image_path = util.replaceDefaultString(resp[0].asset_image_path);

                              /*Checking Expiry datetime
                              var expirtyDatetime = util.replaceDefaultDatetime(resp[0].activity_datetime_end_estimated);                          
            if((Math.sign(util.differenceDatetimes(util.getCurrentISTTime(),expirtyDatetime)) === 1) && (request.app_code == 1) && (response.activity_status_type_id == 95)) {
                                      response.expiry_datetime = expirtyDatetime;
                                      response.message = "Reservation Code Expired";
                                      callback(true, response, -993);
                              } else {*/
                            getMemberAssetId(request, resp[0].activity_id).then((result)=>{ 
                                   response.asset_id = result[0].asset_id;
                                   response.asset_first_name = result[0].asset_first_name;

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
                              //}
                         }
                      });
                  } else {
                      callback(true, 'No events available', -992);
                  }
           } else {
               callback(true,{}, -9999);
           }
       });
   } else if(request.app_code == 3){
        var isMember = 0;
        //Checking whether member exists
        checkingFourDgtUniqueCode(request, request.reservation_code, function(err1, data){ //err1 true - array; false - code
            //Member Exists
            if(Array.isArray(data) && data.length > 0 ) { //Adding member details to response
                isMember = 1;
                response.asset_id = data[0].asset_id;
                response.asset_first_name = data[0].asset_first_name;
                response.asset_last_name = data[0].asset_last_name;
                response.asset_phone_passcode = data[0].asset_phone_passcode;                
                response.is_personal_code = 1;
            }
                
            //Checking Reservation exists
            activityCommonService.checkingUniqueCode(request, request.reservation_code, function(err, resp){ //err true - array; false - code
                //Reservation exists
                if(Array.isArray(resp) && resp.length > 0 ) {
                    if(isMember === 0) {
                        response.asset_id = resp[0].asset_id;
                        response.asset_first_name = resp[0].asset_first_name;
                        response.asset_last_name = resp[0].asset_last_name;
                        response.reservation_activity_id = resp[0].activity_id;
                        response.activity_status_type_id = resp[0].activity_status_type_id;
                        response.activity_status_type_name = resp[0].activity_status_type_name;
                        response.is_personal_code = 0;
                        
                        callback(false, response, 200); // CASE - 3  Not Member and reservation code exists
                    } else {
                        response.activity_status_type_id = resp[0].activity_status_type_id;
                        response.activity_status_type_name = resp[0].activity_status_type_name;
                        response.reservation_activity_id = resp[0].activity_id;
                        callback(false, response, 200); // CASE - 1  Member and reservation code exists
                    }
                } else { //Reservation doesn't exist
                    if(isMember === 1) {
                        callback(false, response, -995); //// CASE - 2  Member and reservation code does not exists
                    } else {
                        callback(false, 'Invalid Member Code', -994); //// CASE - 4  Not Member and reservation code does not exists
                    }
                }
            });
        });                   
       }
   };
   
 function assetStatusUpdate(request) {
     return new Promise((resolve, reject)=>{
        var paramsArr = new Array();
        var queryString = '';
        paramsArr = new Array(
                request.asset_id,
                request.organization_id,
                30, //request.asset_type_category_id,
                13, //request.asset_type_category_status_id,
                request.asset_id,
                request.datetime_log                
                );
        queryString = util.getQueryString('ds_v1_asset_list_update_asset_status', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? resolve() : reject(err);
                });
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
                        //console.log('Request before the queuewrapper : ', request);
                        queueWrapper.raiseActivityEvent(event, request.item_activity_id, (err, resp)=>{});
                        
                        var response = {};
                        activityCommonService.getActivityDetails(request, 0, function(err, data){
                            if(err == false) {
                                response.asset_id = Number(request.station_asset_id);
                                response.activity_status_type_id = data[0].activity_status_type_id;
                                response.activity_status_type_name = data[0].activity_status_type_name;
                                callback(false, response, 200);
                            } else {
                                callback(false, err, -9999);
                            }
                        });               
                    }
                } else {
                    callback(true, {}, -9999);
                }                
            });
        }        
    };
    
    this.reservationSet = function(request, callback){
        if(request.activity_id != 0){
            sendSmsCode(request).then((request)=>{});
            callback(false,{},200);
        } else {
            callback(false,{},-3309);
        }
    };
   
   this.updatePhonePasscode = function(request, callback) {
        var logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;        
       console.log('Request parameters : ', request);
       
       activityCommonService.generateUniqueCode(request, (err, code)=>{
            if(err === false){
                var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.target_asset_id,
                code,
                request.asset_id,
                request.datetime_log
                );
                var queryString = util.getQueryString('ds_v1_asset_list_update_passcode_pam', paramsArr);
                if (queryString != '') {
                    db.executeQuery(0, queryString, request, function (err, data) {
                        if (err === false) {
                            request.work_station_asset_id = request.target_asset_id;
                            pamAssetListHistoryInsert(request, 21, request.work_station_asset_id).then(()=>{});
                            callback(false, code, 200);
                        } else {                            
                            callback(true, err, -9999);
                        }
                    });
                } 
            } else {
                callback(true, err, -9999);
            }
        });     
    };
    
    this.assetListUpdate = function(request, callback) {
        var logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;
        
        var paramsArr = new Array(
                request.target_asset_id,
                request.organization_id,
                request.asset_first_name,
                request.asset_last_name,
                request.asset_description,
                request.customer_unique_id,
                request.phone_country_code,
                request.asset_phone_number,
                request.asset_email_id,
                request.asset_inline_data,
                request.asset_id,
                request.datetime_log,
                request.is_member || 0,
                request.invite_sent || 0,
                request.discount_percent || 0
                );

        //var queryString = util.getQueryString('ds_v1_asset_list_update_pam', paramsArr);
        var queryString = util.getQueryString('ds_v1_1_asset_list_update_pam', paramsArr);
        if (queryString != '') {
            //global.logger.write(queryString, request, 'asset', 'trace');
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    request.work_station_asset_id = request.target_asset_id;
                    pamAssetListHistoryInsert(request, 43, request.work_station_asset_id).then(()=>{});
                    callback(false, {}, 200);
                } else {                    
                    callback(true, err, -9999);
                    }
                });
            }     
    };
    
    this.assetAddForPAM = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        
        var assetTypeCtgId;
        (request.hasOwnProperty('asset_type_category_id')) ? assetTypeCtgId = request.asset_type_category_id : assetTypeCtgId = 0;
        
        if(assetTypeCtgId == 29) {
            activityCommonService.generateUniqueCode(request, function(err, code){
                if(err === false){
                    request.code = code;
                    request.enc_token = uuid.v1();                                          
                    addAssetPamSubfn(request, callback);
                } else {
                    callback(true,err,-9999);
                }
            });
        } else {
            request.code = '';
            request.enc_token = '';
            addAssetPamSubfn(request, callback);
        }
    };
    
    var addAssetPamSubfn = function (request, callback) {
            var paramsArr = new Array(
                request.asset_first_name,
                request.asset_last_name,
                request.asset_description,
                request.customer_unique_id,
                request.asset_profile_picture,
                request.asset_inline_data,
                request.phone_country_code,
                request.asset_phone_number,
                request.asset_email_id,
                request.asset_timezone_id,
                request.asset_type_id,
                request.operating_asset_id,
                request.manager_asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.asset_id,
                request.datetime_log,
                request.code,
                request.enc_token,
                request.is_member || 0,
                request.invite_sent || 0,
                request.discount_percent || 0
                );

        var queryString = util.getQueryString('ds_v1_asset_list_insert_pam', paramsArr);
        if (queryString != '') {
            //global.logger.write(queryString, request, 'asset', 'trace');
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {
                    assetListHistoryInsert(request, assetData[0]['asset_id'], request.organization_id, 0, request.datetime_log, function (err, data) {});
                    request.ingredient_asset_id = assetData[0]['asset_id'];
                    //sss.createAssetBucket(request, function(){});
                    
                    if(assetData[0].asset_type_category_id == 41) {
                        retrieveAccountWorkforces(request).then((data)=>{
                            //console.log('Workforces : ', data);
                            forEachAsync(data, function (next, x) {
                                    createActivityTypeForAllWorkforces(request, x.workforce_id).then((resp)=>{
                                        request.activity_type_id = resp[0].activity_type_id;
                                        workForceActivityTypeHistoryInsert(request).then(()=>{})
                                        next();
                                     })
                            }).then(()=>{});
                        });
                    }
                    
                    if(assetData[0].asset_type_category_id == 29) {
                        var authTokenCollection = {
                            "asset_id": assetData[0]['asset_id'],
                            "workforce_id": request.workforce_id,
                            "account_id": request.account_id,
                            "organization_id": request.organization_id,
                            "asset_token_push": "",
                            "asset_push_arn": "",
                            "asset_auth_token": request.enc_token
                        };

                        cacheWrapper.setTokenAuth(assetData[0]['asset_id'], JSON.stringify(authTokenCollection), function (err, reply) {
                            if (!err) {
                                console.log('Sucessfully data created in Redis');
                            }
                        });
                    }
                    
                    callback(false, {"asset_id": assetData[0]['asset_id']}, 200);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(true, err, -9999);
                    }
                });
            }        
    };
    
    function retrieveAccountWorkforces(request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                0,
                50
                );
            var queryString = util.getQueryString('ds_v1_workforce_list_select_account', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }
    
    function createActivityTypeForAllWorkforces(request, workforceId) {
        return new Promise((resolve, reject)=>{
           var paramsArr = new Array(
                request.asset_first_name,
                request.asset_description,
                39, //request.activity_type_category_id,
                workforceId,
                request.account_id,
                request.organization_id,
                request.ingredient_asset_id,
                41, //asset_type_category_id
                request.asset_id,
                request.datetime_log
                );
            var queryString = util.getQueryString('ds_v1_workforce_activity_type_mapping_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }
    
    function workForceActivityTypeHistoryInsert(request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.activity_type_id,
                request.organization_id,
                0, //update type id
                request.datetime_log
                );
            var queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_history_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }
    
    var assetListHistoryInsert = function (request, assetId, organizationId, updateTypeId, datetimeLog, callback) {
        var paramsArr = new Array(
                assetId,
                organizationId,
                updateTypeId,
                datetimeLog
                );
        var queryString = util.getQueryString('ds_v1_asset_list_history_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
               (err === false) ? callback(false, true): callback(err, false);                
            });
        }
    };
    
    this.updateInvtQty = function(request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        
        var paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                0,
                50
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, participantData) {
               if(err === false) {                   
                    forEachAsync(participantData, function (next, row) {
                        console.log('participant asset_id : ', row.asset_id);
                        var participantAssetId = row.asset_id;
                        
                        updateActQuantity(request, participantAssetId).then(()=>{}).catch(()=>{ 
                                callback(true, err, -9999);
                            });
                        next();       
                    }).then(()=>{
                        callback(false, {}, 200);
                       });
               } else {
                    callback(true, err, -9999);
               }
            });
        }
    };
    
    function updateActQuantity(request, participantAssetId) {
        return new Promise((resolve, reject)=>{
             var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                participantAssetId,
                request.actual_quantity,
                request.asset_id,
                request.datetime_log
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_actual_quantity', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
               (err === false) ? resolve(): reject(err);                
            });
        }
        });
    };
    
    this.updateTitleDesc = function(request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        
        var paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                request.activity_inline_data,
                request.activity_title,
                request.activity_description,
                request.asset_id,
                request.datetime_log
                );
        var queryString = util.getQueryString('ds_v1_activity_list_update_title_inline', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
               if(err === false) {
                   activityCommonService.activityListHistoryInsert(request, 412, function(err, resp){});
                    activityCommonService.getAllParticipants(request, function(err, participantData){
                        if(err === false){
                            forEachAsync(participantData, function (next, row) {
                                updateActInline(request, row.asset_id).then(()=>{                                    
                                    next();
                                });                                   
                            }).then(() => {
                                callback(false, {}, 200);
                            });
                    }
                else {
                   callback(true, err, -9999);
               }
            });
        } else {
           callback(true, err, -9999);               
        }
    });
    }
    }
    
    function updateActInline(request, participantAssetId) {
        return new Promise((resolve, reject)=>{
             var paramsArr = new Array(
                request.activity_id,
                participantAssetId,
                request.organization_id,
                request.activity_inline_data,
                request.activity_title,
                request.activity_description,
                request.asset_id,
                request.datetime_log
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_title_inline', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
               (err === false) ? resolve(): reject(err);                
            });
        }
        });
    };
    
    //PAM
    this.assetClockIn = function (request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        var response = {};
        var assetId;

        assetListSelectPasscode(request, function (err, resp) {
            if (err === false) {
                request['asset_assigned_status_id'] = 0;
                request['asset_session_status_id'] = 0;

                global.logger.writeSession(request.body);
                             
                sns.createPlatformEndPoint(Number(request.device_os_id), request.asset_token_push, function (err, endPointArn) {
                if (!err) {
                    //console.log('success in creating platform end point : ' + endPointArn);
                    global.logger.write('debug', 'success in creating platform end point', {}, request);
                    request.push_notification_id = request.asset_token_push;
                    request.asset_push_arn = endPointArn;
                    assetListUpdateStatusPush(request, resp.asset_id).then(()=>{});
                } else {
                    console.log('problem in creating platform end point');
                    global.logger.write('serverError', 'problem in creating platform end point', err, request);                    
                    }
                });          
                
                cacheWrapper.getAssetParity(resp.asset_id, (err, data) => {
                    if (err === false) {
                        response.asset_id = resp.asset_id;
                        response.asset_message_counter = data;
                        response.asset_encryption_token_id = resp.asset_encryption_token_id;
                        
                        request.asset_id = response.asset_id;
                        pamGetEmpStations(request).then((data)=>{
                            if(data.length > 0) { 
                                forEachAsync(data, function (next, row) {
                                    assetId = row.asset_id;
                                    pamAssetListUpdateOperatingAsset(request, assetId, 0).then(()=>{
                                        pamAssetListHistoryInsert(request, 40, assetId).then(()=>{});
                                            next();
                                    });                                       
                                });
                            } 
                          }).then(()=>{
                              callback(false, response, 200);
                          }).catch((err)=>{
                              callback(true, err, -9999);
                          });                        
                    } else {
                        callback(false, {}, -7998);
                    }
                });

            }else {
                if(resp === 'wrongPasscode') {
                    callback(err, {}, -3701);
                }else {
                    callback(err, {}, -9998);
                }
                
            }
        });
    };
    
    //PAM
    this.assetClockOut = function (request, callback) {
        console.log('Before assetClockOut : \n', request);
        
        var dateTimeLog = util.getCurrentUTCTime();        
        request['datetime_log'] = dateTimeLog;
        request['asset_assigned_status_id'] = 0;
        request['asset_session_status_id'] = 0;
        
        var assetID;
        
        if(!request.hasOwnProperty('workstation_asset_id')) {
            request.workstation_asset_id = 0;
        }
        
        if(!request.hasOwnProperty('target_asset_id')) {
            request.target_asset_id = 0;
        }

        console.log('assetClockOut : \n', request);
        global.logger.writeSession(request.body);
        
        request.push_notification_id = '';
        request.asset_push_arn = '';
        
        (request.target_asset_id > 0) ? assetID = request.target_asset_id : assetID = request.asset_id;
            
        assetListUpdateStatusPush(request, assetID).then(()=>{
                if(request.workstation_asset_id != 0) {
                        activityCommonService.pamAssetListUpdateOperatingAsset(request).then(()=>{
                            assetListHistoryInsert(request, request.workstation_asset_id, request.organization_id, 211, dateTimeLog, function (err, data) {});
                        });
                }
                callback(request.asset_id, {}, 200);
            }).catch((err)=>{
                callback(err, {}, -9998);
            });              
    };
     
    //PAM
    var assetListSelectPasscode = function (request, callback) {
        var response = {};
        var paramsArr = new Array(
                request.organization_id,
                request.passcode
                );

        var queryString = util.getQueryString('ds_v1_asset_list_select_passcode', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, assetId) {
                if (err === false) {
                    //console.log('Asset Id : ' + JSON.stringify(assetId[0]));
                    if(assetId.length>0) {
                        response.asset_id = assetId[0].asset_id;
                        response.asset_encryption_token_id = assetId[0].asset_encryption_token_id;
                        callback(false, response);
                    } else {
                        callback(true, 'wrongPasscode');
                    }
                } else {
                    callback(true, err);
                }
            });
        }
    };
    
    //PAM
    function assetListUpdateStatusPush(request, assetId){
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                assetId,
                request.organization_id,
                request.asset_clocked_status_id,
                request.asset_assigned_status_id,
                request.asset_session_status_id,
                request.track_gps_datetime,
                request.track_latitude,
                request.track_longitude,
                request.track_gps_accuracy,
                request.track_gps_status,
                request.track_gps_location,
                request.asset_id,
                request.datetime_log,
                request.logout_datetime,
                request.push_notification_id,
                request.asset_push_arn
                );
        var queryString = util.getQueryString('ds_v1_asset_list_update_clocked_status_push', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, assetData) {
                (err === false)? resolve(false) : reject(err);
              });
            }
        });        
    };
    
    this.cancelItem = function(request, callback){
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        
        var activityStatusId;
        var activityStatusTypeId;
        var response = {};
        
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
            var queryString = util.getQueryString('ds_v1_activity_list_update_status_cancel', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, resp) {
                    if (err === false) {
                        activityCommonService.getActivityDetails(request, 0, function(err, data){
                            if(err === false){
                                activityStatusId = data[0].activity_status_id;
                                activityStatusTypeId = data[0].activity_status_type_id;
                                
                                response.activity_status_id = activityStatusId;
                                response.activity_status_type_id = activityStatusTypeId;
                                response.activity_status_type_name = data[0].activity_status_type_name;
                                
                                if(activityStatusTypeId == 126) {
                                    activityCommonService.getAllParticipants(request, function(err, participantData){
                                        if(err === false){
                                            forEachAsync(participantData, function (next, x) {
                                                updateStatusCancel(request, x.asset_id, activityStatusId, activityStatusTypeId).then(()=>{
                                                    next();
                                                });                                    
                                                }).then(()=>{
                                                    callback(false,response, 200);
                                                    return;
                                                });
                                        } else {
                                            callback(true, err, -9999);
                                            return;
                                        }  
                                    });
                                } else {
                                    callback(false,response, 200);
                                    return;
                                }               
                                
                            } else {
                                callback(true, err, -9999);
                                return;
                            }
                        });                
                    } else {                    
                        callback(true, err, -9999);
                    }
                });
            }        
    };
    
    
    function updateStatusCancel(request, assetId, activityStatusId, activityStatusTypeId){
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                assetId, //p_asset_id
                activityStatusId,
                activityStatusTypeId,
                request.asset_id, //log_asset_id
                request.datetime_log
                );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_status_cancel', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, resp) {
                    (err === false)? resolve() : reject(err);
                });
            }
        });
    };
    
    this.preparingItem = function(request, callback){
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        var response = {};
        
        var paramsArr = new Array(
                request.activity_id,
                request.station_asset_id,            
                request.activity_status_id,
                request.activity_status_type_id,
                request.organization_id,
                request.asset_id,
                request.datetime_log
                );
        var queryString = util.getQueryString('ds_v1_activity_list_update_status_station', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, resp) {
                    if (err === false) {
                        activityCommonService.getActivityDetails(request, 0, function(err, data){
                            if(err === false){                     
                                
                                response.activity_status_id = util.replaceDefaultNumber(data[0].activity_status_id);
                                response.activity_status_name = util.replaceDefaultString(data[0].activity_status_name);
                                response.activity_status_type_id = util.replaceDefaultNumber(data[0].activity_status_type_id);
                                response.activity_status_type_name = util.replaceDefaultString(data[0].activity_status_type_name);
                                response.activity_owner_asset_id = util.replaceDefaultNumber(data[0].activity_owner_asset_id);
                                response.activity_owner_asset_first_name = util.replaceDefaultString(data[0].activity_owner_asset_first_name);
                                response.activity_owner_asset_type_category_id = util.replaceDefaultNumber(data[0].activity_owner_asset_type_category_id);
                                
                                if((response.activity_owner_asset_id == request.station_asset_id) && (response.activity_status_type_id == 125)) {
                                    var x = {};
                                    x.asset_id = request.station_asset_id;
                                    x.workforce_id = request.workforce_id;
                                    x.account_id = request.account_id;
                                    x.organization_id = request.organization_id;
                                    x.access_role_id = 122;
                                    x.message_unique_id = request.message_unique_id;
                                    
                                    ////////////////////
                                    activityAssetMappingInsertParticipantAssign(request, x, function(err, resp){
                                        if(err === false){
                                            updateStatusDateTimes(request).then(()=>{});
                                            ///////////////////////
                                            activityCommonService.getAllParticipants(request, function(err, participantData){
                                                if(err === false){
                                                    forEachAsync(participantData, function (next, x) {
                                                        updateStatusPreparing(request, x.asset_id, response.activity_status_id, response.activity_status_type_id).then(()=>{
                                                            next();
                                                        });                                    
                                                        }).then(()=>{
                                                            setTimeout(function(){
                                                                console.log('Delayed for 500ms');
                                                                callback(false,response, 200);   
                                                                return;
                                                            }, 500);
                                                        });
                                                } else {
                                                    callback(true, err, -9999);
                                                    return;
                                                }  
                                            });
                                            ///////////////////
                                        } else {
                                            callback(true, err, -9999);
                                            return;
                                        }
                                    });
                                    ///////////////////                                 
                                    
                                } else {
                                    //callback(false,response, 200);
                                    setTimeout(function(){
                                        console.log('Delayed for 500ms');
                                        callback(false,response, 200);   
                                        return;
                                        }, 500);
                                }
                                
                            } else {
                                callback(true, err, -9999);
                                return;
                            }
                        });                
                    } else {                    
                        callback(true, err, -9999);
                    }
                });
            }
    };
    
    
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
    }
    
    function updateStatusPreparing(request, assetId, activityStatusId, activityStatusTypeId){
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.activity_id,
                assetId, //p_asset_id
                request.station_asset_id,
                activityStatusId,
                activityStatusTypeId,
                request.organization_id,
                request.asset_id, //log_asset_id
                request.datetime_log
                );
            var queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_status_station', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, resp) {
                    (err === false)? resolve() : reject(err);
                });
            }
        });
    };
    
    this.coverInlineAlter = function(request, callback) {
        var dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        
        var paramsArr = new Array(
            request.target_asset_id,
            request.organization_id,
            request.asset_first_name,
            request.asset_description,
            request.asset_inline_data,
            request.asset_id,
            request.datetime_log
            );
        var queryString = util.getQueryString('ds_v1_asset_list_update_cover_inline_data', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, resp) {
                if(err === false){
                    pamAssetListHistoryInsert(request, 221, request.target_asset_id).then(()=>{});
                    callback(false, resp, 200);
                } else {
                  callback(true, err, -9999);  
                } 
            });
        }
    };
    
    
    function sendSmsCode(request) {
        return((resolve, reject)=>{
            var reservationCode;
            var expiryDatetime;
            var tableNames = "";
            var noOfGuests;
            var cnt = 0;               
            
            activityCommonService.getAllParticipants(request, function(err, participantData){
                if(err === false){                    
                    forEachAsync(participantData, function (next, row) {
                        cnt++;            
                        if(row.asset_type_category_id == 30){
                            reservationCode = row.activity_sub_type_name;
                            expiryDatetime = util.replaceDefaultDatetime(row.activity_datetime_end_estimated);                          
                        } else if(row.asset_type_category_id == 31){
                                tableNames += row.asset_first_name + "-";
                        }                       
                        next();
                        
                    }).then(() => {
                         noOfGuests = request.no_of_guest - 1;                         
                         var text = "Hi "+request.member_name+","+" I have reserved table number "+tableNames+" for your group tonight, your reservation code is "+reservationCode+".";
                             text += " Feel free to forward this message to your other "+noOfGuests+" guests, they can use the same code to enter.";
                             text += " Remember the entry is only from the parking garage @ Radisson Blu Banjara Hills. Looking forward to hosting your group tonight.";
                             text += " PS - I will be forced to release the table block if no one shows up before "+expiryDatetime+"."+" -PAM";
                             console.log('SMS text : \n', text);
                             util.pamSendSmsMvaayoo(text, request.country_code, request.phone_number, function(err,res){
                                    if(err === false) {
                                         console.log('Message sent!');
                                     }
                                });
                            return resolve();
                             });
                }
            });
        });            
   };
   
   
   this.getEventDetails = function(request, callback) {
       var logDatetime = util.getCurrentUTCTime();
       request['datetime_log'] = logDatetime;
        
        pamGetActivityDetails(request, request.event_id).then((activityData)=>{
           if(util.isDateBetween(util.replaceDefaultDatetime(activityData[0].activity_datetime_start_expected),
                              util.replaceDefaultDatetime(activityData[0].activity_datetime_end_deferred),
                              logDatetime)) {
                                  callback(false, activityData, 200);
            } else{ 
                var diff = util.differenceDatetimes(util.replaceDefaultDatetime(activityData[0].activity_datetime_start_expected) , logDatetime);
                if(Math.sign(diff) === 1) {
                    console.log('diff1 : ', diff);
                    diff = diff / 3600000;
                    console.log('diff2 : ', diff);
                    (diff <= 24) ? callback(false, activityData, 200) : callback(false, activityData, -999);
                } else {
                    callback(false, activityData, -999);
                }
            }
        }).catch((err)=>{
            callback(true, err, -9999);
        });
        
   };
   
   function pamGetActivityDetails(request, activityId) {
       return new Promise((resolve, reject)=>{
        var paramsArr;
        if (Number(activityId > 0)) {
            paramsArr = new Array(
                    activityId,
                    request.organization_id
                    );
        } else {
            paramsArr = new Array(
                    request.activity_id,
                    request.organization_id
                    );
        }
        var queryString = util.getQueryString('ds_v1_activity_list_select_pam', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? resolve(data) : reject(err);                
            });
        } 
       });
   }
   
   this.sendMemberPassCode = function(request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        console.log('Request params : ', request);
        
        if(request.hasOwnProperty('member_passcode')) {          
             var text = "It gives us great pleasure to welcome you as a member at Pudding & Mink. Your personal code is "+request.member_passcode+".";
                        text += " This code is meant for your entry and billing only. Please keep your code private and do not share it with anybody else.";
                        text += " Should you wish to bring guests please whatsapp or message or call on 916309386175 to make a reservation.";
                        text += " Remember the entry is only from the parking garage @ Radisson Blu Banjara Hills.";
                        text += " Our operational hours are Tuesday-Sunday, 7 p.m. to 4 a.m. Thank you. Pudding & Mink";
                    
             console.log('sms Text : ' + text);
             util.pamSendSmsMvaayoo(text, request.asset_phone_country_code, request.asset_phone_number, function(err,res){
                if(err === false) {
                    console.log('Message sent!', res, err);
                    }
                });
             callback(false, {}, 200);
        } else {
            generateUniqueCode(request, function(err, data){
                if (err === false) {
                    updatePC(request, data).then(()=>{
                         var text = "It gives us great pleasure to welcome you as a member at Pudding & Mink. Your personal code is "+data+".";
                             text += " This code is meant for your entry and billing only. Please keep your code private and do not share it with anybody else.";
                             text += " Should you wish to bring guests please whatsapp or message or call on 916309386175 to make a reservation.";
                             text += " Remember the entry is only from the parking garage @ Radisson Blu Banjara Hills.";
                             text += " Our operational hours are Tuesday-Sunday, 7 p.m. to 4 a.m. Thank you. Pudding & Mink";

                         console.log('sms Text : ' + text);
                         util.pamSendSmsMvaayoo(text, request.asset_phone_country_code, request.asset_phone_number, function(err,res){
                              if(err === false) {
                                 console.log('Message sent!', res, err);
                                }
                             });
                         callback(false, {}, 200);
                    });
                } else {
                    callback(true, err, -9999);
                }

             });
        }
   };
   
   function updatePC(request, code) {
        return new Promise((resolve, reject)=>{
            console.log('Request : ', request);
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.target_asset_id,
                code,
                request.asset_id,
                request.datetime_log
                );
                var queryString = util.getQueryString('ds_v1_asset_list_update_passcode_pam', paramsArr);
                if (queryString != '') {
                    db.executeQuery(0, queryString, request, function (err, data) {
                        if (err === false) {
                            request.work_station_asset_id = request.target_asset_id;
                            pamAssetListHistoryInsert(request, 21, request.work_station_asset_id).then(()=>{});
                            //callback(false, code, 200);
                            resolve();
                        } else {                            
                            //callback(true, err, -9999);
                            reject();
                        }
                    });
                }
        });
    }
   
   
    generateUniqueCode = function(request, callback) {
          function generateCode() { //personal code
                var phoneCode = util.randomInt(1000,5000).toString();                
                checkingFourDgtUniqueCode(request,phoneCode, (err, data)=>{
                    (err === false) ? callback(false, data) : generateCode();                    
                });
            }
            generateCode();
    };
    
    var checkingFourDgtUniqueCode = function(request, code, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                code      
                );

        var queryString = util.getQueryString('ds_v1_asset_list_passcode_check_member', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {                
                console.log('data : ', data);
                if (data.length > 0) {
                    callback(true, data);
                } else {
                    callback(false, code);
                }
            });
        }        
    };
    
    this.paymentStatusAlter = function(request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        
        pamAlterActivityStatus(request).then(()=>{
            callback(false, {}, 200);
        }).catch(()=>{
            callback(true, {}, -9999);
        })
    };
    
}
;

module.exports = PamService;
