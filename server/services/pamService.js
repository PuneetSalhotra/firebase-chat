/*
 * author: Nani Kalyan V
 */
let fs = require('fs');
let uuid = require('uuid');
let AwsSns = require('../utils/snsWrapper');
let makingRequest = require('request');
const nodeUtil = require('util');
let TinyURL = require('tinyurl');
const XLSX = require('xlsx');
const AssetService = require('../services/assetService');

function PamService(objectCollection) {

    let db = objectCollection.db;
    let util = objectCollection.util;
    let forEachAsync = objectCollection.forEachAsync;
    let cacheWrapper = objectCollection.cacheWrapper;
    let queueWrapper = objectCollection.queueWrapper;
    let activityCommonService = objectCollection.activityCommonService;
    let sns = new AwsSns();
    // SMS
    // const smsEngine = require('../utils/smsEngine');

    const self = this;
    const supportContactNumber = "9154395728";
    const assetService = new AssetService(objectCollection);
          
    this.ivrService = function(request, callback) {
        console.log('Request params received for ivr Service : ' , request);
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime; 
        
        let response = {};
        let threshold = 0;
        let eventStartDateTime;
        let reservationCreatedDateTime;
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
            let txt = "Thank you for calling in today. As i was mentioning on the call, to become a member you need to be recommended by one of our existing members.";
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
                        let x = {};
                        x.country_code = request.country_code;
                        x.phone_number = request.phone_number;
                        
                        request.activity_inline_data = JSON.stringify(x);
                        
                        let event = {
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
                                  let nextAvailableDateTime;
                                  (response.called_before == 'true')?
                                       nextAvailableDateTime = util.addUnitsToDateTime(eventStartDateTime,6.5,'hours') :
                                       nextAvailableDateTime = util.addUnitsToDateTime(logDatetime,6.5,'hours');

                                  if(response.reservation_available == 'false') {
                                    let text = "Dear "+response.member_name+","+" Currently, there are no tables available for reservation. Please call us back after " + nextAvailableDateTime;
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
                                                let reservationCode = resp[0].activity_sub_type_name;
                                            
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
                                                    let inlineJson = JSON.parse(data[0].activity_inline_data);
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
    
     /*
     this.sendSms = function(request, callback) {
         util.pamSendSmsMvaayoo(request.text, request.country_code, request.phone_number, function(err,res){
                console.log(err,'\n',res);
                callback(false, {}, 200);
         });
     } */
    
    this.getWorkforceDifferential = function (request, callback) {
        let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.differential_datetime,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
                );
        let queryString = util.getQueryString('ds_p1_workforce_list_select_differential', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if(err === false){
                   if (data.length > 0) {
                    //console.log(data);
                    let responseData = new Array();
                    forEachAsync(data, function (next, row) {
                            let rowData = {
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

    let identifyCaller = function (request, callback) {
        let paramsArr = new Array(
                request.organization_id || 351, //,
                request.asset_type_category_id || 30, //,
                request.phone_number,
                request.country_code
                );
        let queryString = util.getQueryString('ds_v1_asset_list_select_phone_number_category', paramsArr);
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
    
    let getCalledTime = function (request, callback) {        
        getEventDatetime(request).then((resp)=>{
            if(resp.length > 0) {
                callback(false, resp);
            } else {
                console.log(util.getCurrentISTTime());
                console.log(util.getDayStartDatetimeIST());
                console.log(util.getDayEndDatetimeIST());

                let paramsArr1 = new Array(
                        request.organization_id || 351,
                        util.addUnitsToDateTime(util.getDayStartDatetimeIST(),-5.5,'hours'),
                        util.addUnitsToDateTime(util.getDayEndDatetimeIST(),-5.5,'hours')
                        );
                let queryString1 = util.getQueryString('ds_v1_activity_list_select_event_dt_between', paramsArr1);
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
            let paramsArr1 = new Array(
                request.organization_id || 351,
                request.account_id || 452,
                request.datetime_log
                );
            let queryString1 = util.getQueryString('ds_v1_activity_list_select_event_datetime', paramsArr1);
            if (queryString1 != '') {
                db.executeQuery(1, queryString1, request, function (err, data) {
                   console.log('getEventDatetime :', data);
                   (err === false) ? resolve(data) : reject(err);
                });
            }
        })        
    };
    
    let getReservationsCount = function (eventActivityId, callback) {
        let paramsArr = new Array(
                request.organization_id || 351,
                eventActivityId
                );
        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_reservation_count', paramsArr);
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
            let paramsArr = new Array(
                request.organization_id || 351, //
                request.account_id || 452, //,
                eventActivityId,
                memberAssetId
                );
            let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_reservation', paramsArr);
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
        let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.page_start,
                request.page_limit
                );
        let queryString = util.getQueryString('ds_p1_asset_list_select_all_admin_desks', paramsArr);
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
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;

        let paramsArr = new Array(
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

        let queryString = util.getQueryString('ds_p1_asset_access_mapping_insert', paramsArr);
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
        let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.element_asset_id,
                request.asset_id,//user_asset_id,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
                );
        let queryString = util.getQueryString('ds_v1_asset_access_mapping_select_asset_access', paramsArr);
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
        let paramsArr = new Array();
        let queryString = '';
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
        let activityArray = JSON.parse(request.menu_activity_array);
        request['len'] = activityArray.length;
        let response = new Array();
        let globalStationIds =  new Array();
        
        forEachAsync(activityArray, function (next, activityId) {
            //console.log(activityId);
            /*activityCommonService.inventoryCheck(request, activityId, function(err, resp, stationIds){
            if(err === false) {
                    //if(resp === true) {                    
                        response.push({menu_activity_id:activityId, status:resp})
                        globalStationIds.push({menu_activity_id:activityId, status:resp, station_ids: stationIds});
                    //}
                     next();
                  }
               });*/
            
            activityCommonService.getActivityDetails(request, activityId, function(err, data){
                if(err === false) {
                    if(data.length > 0) {
                        (data[0].activity_status_type_id == 91) ? response.push({menu_activity_id:activityId, status:true}) : response.push({menu_activity_id:activityId, status:false});
                    } else {
                        response.push({menu_activity_id:activityId, status:false})
                    }                    
                    next();
                } else {
                    next();
                }
            });
           }).then(()=>{
               if(request.is_check == 1 && request.is_status == 0 && request.is_assign ==0) {
                    callback(false, response, 200);
               } else if(request.is_check == 1 && request.is_status == 1 && request.is_assign == 0) {
                    
                    forEachAsync(response, function (next, index) {
                            //console.log(index.menu_activity_id);
                            let x = (index.status === true)? 1 : 0;
                            changeActivityStatus(request, index.menu_activity_id, x).then(()=>{
                                next();
                            });                            
                        }).then(()=>{
                            callback(false, response, 200);
                    });
                 } //else if(request.is_check == 0 && request.is_status == 0 && request.is_assign == 0) {
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
                //}
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
            let paramsArr = new Array(
               request.organization_id,
               request.account_id,
               request.workforce_id,
               request.activity_status_type_id
               );
            let queryString = util.getQueryString('ds_v1_workforce_activity_status_mapping_select_status', paramsArr);
              if (queryString != '') {
                  db.executeQuery(1, queryString, request, function (err, resp) {
                      if (err === false) {
                          if(request.activity_status_type_id != 103) {
                            //console.log('Response : ', resp);
                            request.activity_status_id = resp[0].activity_status_id;
                            request.activity_id = activityId;
                                                        
                            let event = {
                                name: "alterActivityStatus",
                                //service: "activityService",
                                service: "pamUpdateService",
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
    
     let formatAssetAccountDataLevel = function (data, callback) {
        let responseArr = new Array();
        forEachAsync(data, function (next, row) {
            let rowData = {
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
    
    /*this.updateOperatingAssetDetails = function (request, callback) {
        var logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        
        pamGetEmpStations(request).then((data)=>{        	
            if(data.length > 0) { 
            	
                forEachAsync(data, function (next, row) {                	
                    pamAssetListUpdateOperatingAsset(request, row.asset_id, 0).then(()=>{
                    	next();
                        pamAssetListHistoryInsert(request, 40, row.asset_id).then(()=>{ 
                            });
                        });                        
                }).then(()=>{                	
                    pamAssetListUpdateOperatingAssetUnoccupied(request).then((data)=>{
                       //getAssetDetails(request).then((resp)=>{
                    	  
                    	   console.log("2 :: "+data[0].asset_id+" :: 13 :: "+data[0].operating_asset_id);
                           callback(false, {"asset_id" : data[0].asset_id, "operating_asset_id" : data[0].operating_asset_id}, 200);
                        //});   
                      
                        pamAssetListHistoryInsert(request, 7, request.work_station_asset_id).then(()=>{ });
                    }).catch((err)=>{ callback(true, err, -9999);});
                });                
            } else {
            	//console.log("11");
                pamAssetListUpdateOperatingAssetUnoccupied(request).then((data)=>{
                	//console.log("12");
                       // getAssetDetails(request).then((resp)=>{
                        	console.log("3 :: "+data[0].asset_id+" :: 13 :: "+data[0].operating_asset_id);
                           callback(false, {"asset_id" : data[0].asset_id, "operating_asset_id" : data[0].operating_asset_id}, 200);
                       // });                        
                        pamAssetListHistoryInsert(request, 7, request.work_station_asset_id).then(()=>{ });                        
                    }).catch((err)=>{ callback(true, err, -9999); });                                
            }
        });        
               
    };*/
    
    
    this.updateOperatingAssetDetails = function (request, callback) {
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        
        pamGetEmpStations(request).then((data)=>{        	
            if(data.length > 0) { 
            	
                forEachAsync(data, function (next, row) {                	
                    pamAssetListUpdateOperatingAsset(request, row.asset_id, 0).then(()=>{
                    	next();
                        pamAssetListHistoryInsert(request, 40, row.asset_id).then(()=>{ 
                            });
                        });                        
                }).then(()=>{                	
                    pamAssetListUpdateOperatingAssetUnoccupied(request).then((data)=>{
                       //getAssetDetails(request).then((resp)=>{
                    	  
                    	   console.log("2 :: "+data[0].asset_id+" :: 13 :: "+data[0].operating_asset_id);
                           callback(false, {"asset_id" : data[0].asset_id, "operating_asset_id" : data[0].operating_asset_id}, 200);
                        //});   
                      
                        pamAssetListHistoryInsert(request, 7, request.work_station_asset_id).then(()=>{ });
                    }).catch((err)=>{ callback(true, err, -9999);});
                });                
            } else {            	
                pamAssetListUpdateOperatingAssetUnoccupied(request).then((data)=>{                	
                       // getAssetDetails(request).then((resp)=>{
                    console.log("3 :: "+data[0].asset_id+" :: 13 :: "+data[0].operating_asset_id);
                           callback(false, {"asset_id" : data[0].asset_id, "operating_asset_id" : data[0].operating_asset_id}, 200);
                       // });                        
                        pamAssetListHistoryInsert(request, 7, request.work_station_asset_id).then(()=>{ });                        
                    }).catch((err)=>{ callback(true, err, -9999); });                                
            }
        });        
               
    };
    
    function pamGetEmpStations(request) {
        return new Promise((resolve, reject)=>{
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.asset_id,
                0,
                50
                );
        let queryString = util.getQueryString('ds_v1_asset_list_select_employee_stations', paramsArr);
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
             let paramsArr = new Array(
                assetId,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                operatingAsstId,
                request.asset_id,
                request.datetime_log
                );

        let queryString = util.getQueryString('ds_v1_asset_list_update_operating_asset', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? resolve() : reject(err);
            });
            }
         });
    };
        
    function pamAssetListUpdateOperatingAssetUnoccupied(request) {
         return new Promise((resolve, reject)=>{
             let paramsArr = new Array(
                request.work_station_asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.asset_id,
                request.asset_id,
                request.datetime_log
                );

        let queryString = util.getQueryString('ds_v1_asset_list_update_operating_asset_unoccupied', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                (err === false) ? resolve(data) : reject(err);
            });
            }
         })
    };
    
    function pamAssetListHistoryInsert(request, updateTypeId, assetId) {
        return new Promise((resolve, reject)=>{
            let paramsArr = new Array(
                assetId, //request.work_station_asset_id,
                request.organization_id,
                updateTypeId,
                request.datetime_log
                );

        let queryString = util.getQueryString('ds_v1_asset_list_history_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
              (err === false) ?  resolve() : reject(err);
                });
            }
        });
    }
    
    function getAssetDetails(request) {
        return new Promise((resolve, reject)=>{
            let paramsArr = new Array(
                request.organization_id,
                request.work_station_asset_id
                );
            let queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
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
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        request['activity_type_category_id'] = 38;
        
        assignMinWaitTimeStation(request).then((data)=>{
           let minStationId = data;
           console.log('minStationId :',minStationId);
           let tempArray = new Array();
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
        let minTime = 9999999999;
        let minStationId;
        
        forEachAsync(stationAssetIds, function (next, row) {
            let paramsArr = new Array(
              request.organization_id,
              request.account_id,
              row
              );
            let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_station_waiting_mins', paramsArr);
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
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        console.log("pamAssignParticipant : " +JSON.stringify(request.activity_participant_collection, null, 2))
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
    let pamAssignCoworker = function (request, callback) { //Addparticipant Request

        let loopAddParticipant = function (participantCollection, index, maxIndex) {
            iterateAddParticipant(participantCollection, index, maxIndex, function (err, data) {});
        };

        let iterateAddParticipant = function (participantCollection, index, maxIndex, callback) {
            let participantData = participantCollection[index];
            isParticipantAlreadyAssigned(participantData, request.activity_id, request, function (err, alreadyAssignedStatus, newRecordStatus) {
                if ((err === false) && (!alreadyAssignedStatus)) {
                    //proceed and add a participant
                    addParticipant(request, participantData, newRecordStatus, function (err, data) {
                        if (err === false) {
                            //console.log("participant successfully added");
                            //global.logger.write('conLog', 'participant successfully added', {}, request)
                            util.logInfo(request,`addParticipant conLog participant successfully added %j`,{ request});
                            let nextIndex = index + 1;
                            if (nextIndex <= maxIndex) {
                                loopAddParticipant(participantCollection, nextIndex, maxIndex);
                            }
                            callback(false, true);
                        } else {
                            console.log(err);
                            //global.logger.write('serverError', '' + err, {}, request)
                            util.logError(request,`addParticipant serverError Error %j`, { err, request });
                            callback(true, err);
                        }
                    }.bind(this));
                } else {
                    if (alreadyAssignedStatus > 0) {
                        //global.logger.write('conLog', 'participant already assigned', {}, request)
                        util.logInfo(request,`isParticipantAlreadyAssigned participant already assigned %j`,{ request});
                        let nextIndex = index + 1;
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
        let activityStreamTypeId = 2; //Older 2:added participant
        let activityTypeCategroyId = 0;
        console.log('request.activity_type_category_id : ', request.activity_type_category_id);
        if (request.hasOwnProperty('activity_type_category_id')) {
            activityTypeCategroyId = Number(request.activity_type_category_id);
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
        let index = 0;       
        let activityParticipantCollection = JSON.parse(request.activity_participant_collection);
        let maxIndex = activityParticipantCollection.length - 1;
        //var maxIndex = request.activity_participant_collection.length - 1;
        iterateAddParticipant(activityParticipantCollection, index, maxIndex, function (err, data) {
	      	  if(activityTypeCategroyId == 37) {                    
	              let newRequest = Object.assign({}, request);
			  if(request.hasOwnProperty('is_non_queue')){
	              		sendSmsCodeParticipant(newRequest, function(err, data){});
				}
	          }
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
    
    let addParticipant = function (request, participantData, newRecordStatus, callback) {
        let activityTypeCategoryId = Number(request.activity_type_category_id);
        
        if (newRecordStatus) {
            activityAssetMappingInsertParticipantAssign(request, participantData, function (err, data) {
                if (err === false) {
                    console.log('In add participant function request.activity_streamtype_id : ', request.activity_streamtype_id);
                    activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {});
                    activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {});
                    activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 0, function (err, restult) {});
                    callback(false, true);
                    
                    //PAM
                    if(activityTypeCategoryId == 39 || activityTypeCategoryId == 38) {
                        assignUnassignParticipantPam(request, participantData,1,function(err, resp){}); //1 for assign
                    }
                    
                } else {
                    callback(true, err);
                }
            });
        } else {
            //console.log('re-assigining to the archived row');
            //global.logger.write('conLog', 're-assigining to the archived row', {}, request)
            util.logInfo(request,`addParticipant conLog re-assigining to the archived row %j`,{request});
            activityAssetMappingUpdateParticipantReAssign(request, participantData, function (err, data) {
                if (err === false) {
                    activityCommonService.assetActivityListHistoryInsert(request, participantData.asset_id, 502, function (err, restult) {
                        if (err === false) {
                            console.log('In else part add participant function request.activity_streamtype_id : ', request.activity_streamtype_id);
                            activityCommonService.assetTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {});
                            activityCommonService.activityTimelineTransactionInsert(request, participantData, request.activity_streamtype_id, function (err, data) {});                             
                        }                        
                    });
                        //PAM
                    if(activityTypeCategoryId == 39 || activityTypeCategoryId == 38) {
                        assignUnassignParticipantPam(request, participantData, 1, function(err, resp){}); //1 for assign
                    }
                    
                    callback(false, true);
                } else {
                    callback(true, err);
                }
            });
        }
    };
    
    let isParticipantAlreadyAssigned = function (assetCollection, activityId, request, callback) {
        let fieldId = 0;
        console.log('In isParticipantAlreadyAssigned - assetCollection : ', assetCollection);
        if (assetCollection.hasOwnProperty('field_id')) {
            fieldId = assetCollection.field_id;
        }
        let paramsArr = new Array(
                activityId,
                assetCollection.asset_id,
                assetCollection.organization_id,
                fieldId
                );
        let queryString = util.getQueryString("ds_v1_activity_asset_mapping_select_check_participant_appr", paramsArr);

        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false)
                {
                    //var queryStatus = (data.length > 0) ? (data[0]['log_state']< 3)?true:false : false;
                    let queryStatus = false;
                    let newRecordFalg = false;
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
                    //global.logger.write('serverError', err, err, request)
                    util.logError(request,`isParticipantAlreadyAssigned serverError Error %j`, { err, request });
                    return;
                }
            });
        }
    };
    
    let activityAssetMappingInsertParticipantAssign = function (request, participantData, callback) {
        let fieldId = 0;
        console.log('In function activityAssetMappingInsertParticipantAssign - participantData : ', participantData);
        let quantityUnitType = (request.hasOwnProperty('quantity_unit_type')) ? request.quantity_unit_type : '';
        let quantityUnitValue = (request.hasOwnProperty('quantity_unit_value')) ? request.quantity_unit_value : -1;
        let optionId = (request.hasOwnProperty('option_id')) ? request.option_id : -1;
        let optionName = (request.hasOwnProperty('option_name')) ? request.option_name : '';
        
        if (participantData.hasOwnProperty('field_id')) {
            fieldId = participantData.field_id;
        }
        let paramsArr = new Array(
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
        let queryString = util.getQueryString("ds_v1_activity_asset_mapping_insert_asset_assign_pam", paramsArr);
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
                    //global.logger.write('serverError','' + err, request)
                    util.logError(request,`activityAssetMappingInsertParticipantAssign serverError Error %j`, { err, request });
                    return;
                }
            });
        }
    };
    
    let activityAssetMappingUpdateParticipantReAssign = function (request, participantData, callback) {
        let fieldId = 0;
        if (participantData.hasOwnProperty('field_id')) {
            fieldId = participantData.field_id;
        }
        let paramsArr = new Array(
                request.activity_id,
                participantData.asset_id,
                participantData.organization_id,
                fieldId,
                request.asset_id,
                request.datetime_log
                );
        let queryString = util.getQueryString("ds_v1_activity_asset_mapping_update_reassign_participant_appr", paramsArr);

        if (queryString !== '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    //console.log(err);
                    //global.logger.write('serverError', err, err, request)
                    util.logError(request,`activityAssetMappingUpdateParticipantReAssign serverError Error %j`, { err, request });
                    return;
                }
            });
        }
    };
    
    //End Add Participant======================================================
    
    this.bulkStatusAlter = function(request, callback){
        let logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;
        let newRequest = new Array();
        let cnt = 0;
        
        let orderActivityCollection = JSON.parse(request.order_activity_collection);        
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
            let activityStreamTypeId;
            let activityStatusId = Number(request.activity_status_id);
            let activityStatusTypeId = Number(request.activity_status_type_id) || 103;
            
            if (request.hasOwnProperty('activity_type_category_id')) {
                let activityTypeCategroyId = Number(request.activity_type_category_id);
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
            let activityStreamTypeId;
            let activityStatusId = Number(request.activity_status_id);
            let activityStatusTypeId = Number(request.activity_status_type_id) || 103;
            
            if (request.hasOwnProperty('activity_type_category_id')) {
                let activityTypeCategroyId = Number(request.activity_type_category_id);
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
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                request.activity_status_id,
                request.activity_status_type_id,
                request.datetime_log,
                request.activity_sub_type_id
                );
            let queryString = util.getQueryString("ds_v1_activity_list_update_status_pam2", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                   (err === false)? resolve() : reject(err);                        
                });
            }
        })
    }
    
    function activityListUpdateStatusBulk(request) {
        return new Promise((resolve, reject)=>{
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                request.activity_status_id,
                request.activity_status_type_id,
                request.asset_id,
                request.datetime_log
                );
            let queryString = util.getQueryString("ds_v1_activity_list_update_status_pam", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                   (err === false)? resolve() : reject(err);                        
                });
            }
        })
    }
    
    function assetActivityListUpdateStatusBulk(request, activityStatusId, activityStatusTypeId){
        return new Promise((resolve, reject)=>{
            let paramsArr = new Array();
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
            let paramsArr = new Array();
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
            let logDatetime = util.getCurrentUTCTime();        
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
                                    response.male_covers = 0;
                                    response.female_covers = 0;
                                    response.activity_datetime_start_expected = null;
                                    response.activity_datetime_end_deferred = null;   

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
                              response.male_covers = resp[0].male_covers;
                              response.female_covers = resp[0].female_covers;
                              response.activity_datetime_start_expected = util.replaceDefaultDatetime(resp[0].activity_datetime_start_expected);
                              response.activity_datetime_end_deferred = util.replaceDefaultDatetime(resp[0].activity_datetime_end_deferred);

                              
                              if(resp[0].entered_covers == 0){
                                pamGetAssetDetails(request).then((data)=>{                                        
                                    let phoneNumber = util.replaceDefaultNumber(data[0].asset_phone_number);
                                    let countryCode = util.replaceDefaultNumber(data[0].asset_phone_country_code);

                                    let text = `Dear ${util.replaceDefaultString(resp[0].operating_asset_first_name)},\nYour first guest has arrived and the billing for this reservation is active. If the reservation code is being misused, please call us -GreneOS`;
                                                              
                                    self.sendSms(countryCode,phoneNumber,text);    
                                });
                              }
                              

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
        let isMember = 0;
        //Checking whether member exists
        checkingFourDgtUniqueCode(request, request.reservation_code, function(err1, data){ //err1 true - array; false - code
            //Member Exists
            if(Array.isArray(data) && data.length > 0 ) { //Adding member details to response
                isMember = 1;
                response.asset_id = data[0].asset_id;
                response.asset_first_name = data[0].asset_first_name;
                response.asset_last_name = data[0].asset_last_name;
                response.asset_phone_passcode = data[0].asset_phone_passcode;   
                response.asset_qrcode_image_path = data[0].asset_qrcode_image_path;
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
   


this.sendSms = async (countryCode, phoneNumber, smsMessage) =>{
    console.log("sendSms :: "+countryCode+" : "+phoneNumber)
    let domesticSmsMode = await cacheWrapper.getSmsMode('domestic_sms_mode');
        switch (parseInt(domesticSmsMode)) {
            case 1: // SinFini
                    console.log("sendSms :: "+domesticSmsMode)
                    util.pamSendSmsSinfini(smsMessage, countryCode, phoneNumber, function(err,res){
                        if(err === false) {
                            console.log('SinFini Message sent!',res);
                        }else{
                            console.log('SinFini Message Not sent!',res);
                        }
                    });
                    break;
            case 2: // mVayoo
                    util.pamSendSmsMvaayoo(text, countryCode, phoneNumber, function(err,res){
                        if(err === false) {
                            console.log('mVayoo Message sent!',res);
                        }
                    });
                    break;
            default:
                console.log('sendSms :: In default');
        }
};
   
 function assetStatusUpdate(request) {
     return new Promise((resolve, reject)=>{
        let paramsArr = new Array();
        let queryString = '';
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
        let paramsArr = new Array();
        let queryString = '';
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
        let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.item_activity_id,
                request.asset_type_category_id,
                0,
                1
                );

        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants_category', paramsArr);
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
                        let event = {
                            name: "assignParticipnt",
                            service: "activityParticipantService",
                            method: "assignCoworker",
                            payload: request
                        };
                        //console.log('Request before the queuewrapper : ', request);
                        queueWrapper.raiseActivityEvent(event, request.item_activity_id, (err, resp)=>{});
                        
                        let response = {};
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
        let logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;        
       console.log('Request parameters : ', request);
       
       activityCommonService.generateUniqueCode(request, (err, code)=>{
            if(err === false){
                let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.target_asset_id,
                code,
                request.asset_id,
                request.datetime_log
                );
                let queryString = util.getQueryString('ds_v1_asset_list_update_passcode_pam', paramsArr);
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
        let logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;
        
        let paramsArr = new Array(
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
                request.discount_percent || 0,
                request.asset_type_id
                );

        //var queryString = util.getQueryString('ds_v1_asset_list_update_pam', paramsArr);
        let queryString = util.getQueryString('ds_v1_2_asset_list_update_pam', paramsArr);
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
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        
        let assetTypeCtgId;
        (request.hasOwnProperty('asset_type_category_id')) ? assetTypeCtgId = request.asset_type_category_id : assetTypeCtgId = 0;
        
        if(assetTypeCtgId == 29 || assetTypeCtgId == 2 || assetTypeCtgId == 3) {
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
    
    let addAssetPamSubfn = function (request, callback) {
            let paramsArr = new Array(
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

        let queryString = util.getQueryString('ds_v1_asset_list_insert_pam', paramsArr);
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
                    
                    if(assetData[0].asset_type_category_id == 29 || assetData[0].asset_type_category_id == 2 || assetData[0].asset_type_category_id == 3) {
                        let authTokenCollection = {
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
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                0,
                50
                );
            let queryString = util.getQueryString('ds_v1_workforce_list_select_account', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }
    
    function createActivityTypeForAllWorkforces(request, workforceId) {
        return new Promise((resolve, reject)=>{
           let paramsArr = new Array(
            request.activity_type_name,
            request.activity_type_description,
            request.activity_type_category_id,
            request.level_id,
            workforceId,
            request.account_id,
            request.organization_id,
            request.log_asset_id,
            request.log_datetime,
            request.visibility_flag,
            request.activity_type_default_duration_days,
            request.activity_type_inline_data,
            request.flag_customer_creation,
            request.flag_enable_web_url,
            request.web_url
                // request.asset_first_name,
                // request.asset_description,
                // 39, //request.activity_type_category_id,
                // workforceId,
                // request.account_id,
                // request.organization_id,
                // request.ingredient_asset_id,
                // 41, //asset_type_category_id
                // request.asset_id,
                // request.datetime_log
                );
            // var queryString = util.getQueryString('ds_v1_workforce_activity_type_mapping_insert', paramsArr);
            let queryString = util.getQueryString('pm_v1_workforce_activity_type_mapping_insert', paramsArr);

            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }
    
    function workForceActivityTypeHistoryInsert(request) {
        return new Promise((resolve, reject)=>{
            let paramsArr = new Array(
                request.activity_type_id,
                request.organization_id,
                request.update_type_id || 0, //update type id
                request.datetime_log
                );
            let queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_history_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }
    
    let assetListHistoryInsert = function (request, assetId, organizationId, updateTypeId, datetimeLog, callback) {
        let paramsArr = new Array(
                assetId,
                organizationId,
                updateTypeId,
                datetimeLog
                );
        let queryString = util.getQueryString('ds_v1_asset_list_history_insert', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
               (err === false) ? callback(false, true): callback(err, false);                
            });
        }
    };
    
    this.updateInvtQty = function(request, callback) {
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        
        let paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                0,
                50
                );
        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_participants', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, participantData) {
               if(err === false) {                   
                    forEachAsync(participantData, function (next, row) {
                        console.log('participant asset_id : ', row.asset_id);
                        let participantAssetId = row.asset_id;
                        
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
             let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                participantAssetId,
                request.actual_quantity,
                request.asset_id,
                request.datetime_log
                );
        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_actual_quantity', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
               (err === false) ? resolve(): reject(err);                
            });
        }
        });
    };
    
    this.updateTitleDesc = function(request, callback) {
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        
        let paramsArr = new Array(
                request.activity_id,
                request.organization_id,
                request.activity_inline_data,
                request.activity_title,
                request.activity_description,
                request.asset_id,
                request.datetime_log
                );
        let queryString = util.getQueryString('ds_v1_activity_list_update_title_inline', paramsArr);
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
            let paramsArr = new Array(
                request.activity_id,
                participantAssetId,
                request.organization_id,
                request.activity_inline_data,
                request.activity_title,
                request.activity_description,
                request.asset_id,
                request.datetime_log
                );
        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_title_inline', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
               (err === false) ? resolve(): reject(err);                
            });
        }
        });
    };
    
    //PAM
    this.assetClockIn = function (request, callback) {
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        let response = {};
        let assetId;

        assetListSelectPasscode(request, function (err, resp) {
            if (err === false) {
                request['asset_assigned_status_id'] = 0;
                request['asset_session_status_id'] = 0;

                /*sns.createPlatformEndPoint(Number(request.device_os_id), request.asset_token_push, 1, function (err, endPointArn) {
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
                });*/          
                
                cacheWrapper.getAssetParity(resp.asset_id, (err, data) => {
                    if (err === false) {
                        //console.log(resp);
                        response = resp;
                        response.asset_message_counter = data;


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
        
        let dateTimeLog = util.getCurrentUTCTime();        
        request['datetime_log'] = dateTimeLog;
        request['asset_assigned_status_id'] = 0;
        request['asset_session_status_id'] = 0;
        
        let assetID;
        
        if(!request.hasOwnProperty('workstation_asset_id')) {
            request.workstation_asset_id = 0;
        }
        
        if(!request.hasOwnProperty('target_asset_id')) {
            request.target_asset_id = 0;
        }

        console.log('assetClockOut : \n', request);        
        
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
    let assetListSelectPasscode = function (request, callback) {
        let response = {};
        let paramsArr = new Array(
                request.organization_id,
                request.passcode
                );

        let queryString = util.getQueryString('ds_v1_asset_list_select_passcode', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, assetId) {
                if (err === false) {
                    //console.log('Asset Id : ' + JSON.stringify(assetId[0]));
                    if(assetId.length>0) {
                        //response.asset_id = assetId[0].asset_id;
                        //response.asset_encryption_token_id = assetId[0].asset_encryption_token_id;
                        response = assetId[0];
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
            let paramsArr = new Array(
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
        let queryString = util.getQueryString('ds_v1_asset_list_update_clocked_status_push', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, assetData) {
                (err === false)? resolve(false) : reject(err);
              });
            }
        });        
    };
    
    this.cancelItem = function(request, callback){
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        
        let activityStatusId;
        let activityStatusTypeId;
        let response = {};
        
        let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_id,
                request.activity_status_id,
                request.activity_status_type_id,
                request.asset_id,
                request.datetime_log
                );
            let queryString = util.getQueryString('ds_v1_activity_list_update_status_cancel', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, resp) {
                	activityCommonService.activityListHistoryInsert(request, 413, function (err, result) {});
                    if (err === false) {
                      	//activityCommonService.activityListHistoryInsert(request, 413, function (err, result) {});
                        getActivityDetailsMaster(request, 0, function(err, data){
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
            let paramsArr = new Array(
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
            let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_status_cancel', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, resp) {
                    (err === false)? resolve() : reject(err);
                });
            }
        });
    };
    
    this.preparingItem = function(request, callback){
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        let response = {};
        
        let paramsArr = new Array(
                request.activity_id,
                request.station_asset_id,            
                request.activity_status_id,
                request.activity_status_type_id,
                request.organization_id,
                request.asset_id,
                request.datetime_log
                );
        let queryString = util.getQueryString('ds_v1_activity_list_update_status_station', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, resp) {
            	activityCommonService.activityListHistoryInsert(request, 414, function (err, result) {});
                    if (err === false) {
                       	//activityCommonService.activityListHistoryInsert(request, 414, function (err, result) {});
                        getActivityDetailsMaster(request, 0, function(err, data){
                            if(err === false){                     
                                
                                response.activity_status_id = util.replaceDefaultNumber(data[0].activity_status_id);
                                response.activity_status_name = util.replaceDefaultString(data[0].activity_status_name);
                                response.activity_status_type_id = util.replaceDefaultNumber(data[0].activity_status_type_id);
                                response.activity_status_type_name = util.replaceDefaultString(data[0].activity_status_type_name);
                                response.activity_owner_asset_id = util.replaceDefaultNumber(data[0].activity_owner_asset_id);
                                response.activity_owner_asset_first_name = util.replaceDefaultString(data[0].activity_owner_asset_first_name);
                                response.activity_owner_asset_type_category_id = util.replaceDefaultNumber(data[0].activity_owner_asset_type_category_id);
                                
                                if((response.activity_owner_asset_id == request.station_asset_id) && (response.activity_status_type_id == 125)) {
                                    let x = {};
                                    x.asset_id = request.station_asset_id;
                                    x.workforce_id = request.workforce_id;
                                    x.account_id = request.account_id;
                                    x.organization_id = request.organization_id;
                                    x.access_role_id = 122;
                                    x.message_unique_id = request.message_unique_id;
                                    
                                    ////////////////////
                                    activityAssetMappingInsertParticipantAssign(request, x, function(err, resp){
                                       // if(err === false){
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
                                       /* } else {
                                            callback(true, err, -9999);
                                            return;
                                        }*/
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
            let servedAtBar = (request.hasOwnProperty('served_at_bar'))? request.served_at_bar : 0;            
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.activity_id,
                request.activity_status_type_id,
                servedAtBar,
                request.asset_id,
                request.datetime_log
                );
            let queryString = util.getQueryString('ds_v1_activity_list_update_order_status_datetime', paramsArr);
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
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.activity_id,
                assetId, //p_asset_id
                request.activity_status_type_id,
                servedAtBar,
                request.asset_id, //log_asset_id
                request.datetime_log
                );
            let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_order_status_datetime', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, resp) {
                    (err === false)? resolve() : reject(err);
                });
            }
        });
    }
    
    function updateStatusPreparing(request, assetId, activityStatusId, activityStatusTypeId){
        return new Promise((resolve, reject)=>{
            let paramsArr = new Array(
                request.activity_id,
                assetId, //p_asset_id
                request.station_asset_id,
                activityStatusId,
                activityStatusTypeId,
                request.organization_id,
                request.asset_id, //log_asset_id
                request.datetime_log
                );
            let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_status_station', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, resp) {
                    (err === false)? resolve() : reject(err);
                });
            }
        });
    };
    
    this.coverInlineAlter = function(request, callback) {
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        
        let paramsArr = new Array(
            request.target_asset_id,
            request.organization_id,
            request.asset_first_name,
            request.asset_description,
            request.asset_inline_data,
            request.asset_id,
            request.datetime_log
            );
        let queryString = util.getQueryString('ds_v1_asset_list_update_cover_inline_data', paramsArr);
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
            let reservationCode;
            let expiryDatetime;
            let tableNames = "";
            let noOfGuests;
            let cnt = 0;               
            
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
                         let text = "Hi "+request.member_name+","+" I have reserved table number "+tableNames+" for your group tonight, your reservation code is "+reservationCode+".";
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
       let logDatetime = util.getCurrentUTCTime();
       request['datetime_log'] = logDatetime;
        
        pamGetActivityDetails(request, request.event_id).then((activityData)=>{
           if(util.isDateBetween(util.replaceDefaultDatetime(activityData[0].activity_datetime_start_expected),
                              util.replaceDefaultDatetime(activityData[0].activity_datetime_end_deferred),
                              logDatetime)) {
                                  callback(false, activityData, 200);
            } else{ 
                let diff = util.differenceDatetimes(util.replaceDefaultDatetime(activityData[0].activity_datetime_start_expected) , logDatetime);
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
        let paramsArr;
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
        let queryString = util.getQueryString('ds_v1_activity_list_select_pam', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                (err === false) ? resolve(data) : reject(err);                
            });
        } 
       });
   }
   
   this.sendMemberPassCode = function(request, callback) {
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        console.log('Request params : ', request);
        //let supportNumber = "916309386175";
        //let entry = "parking garage @ Radisson Blu";
        //let operationalHours = "Tuesday-Sunday, 7 p.m. to 4 a.m";
        //let companyName = "Pudding n Mink";
        let link = "https://thepamapp.com/enter-mobile/"+request.organization_id;
        let start = request.operation_start || "8 p.m";
        let end = request.operation_end || "4 a.m";
        //let memberName = "Sravan";
        TinyURL.shorten(link, function(shortlink, err) {
            if (err){
                console.log("sendMemberPassCode "+err)                       
            }else{
                console.log("sendMemberPassCode "+shortlink); 
                if(request.hasOwnProperty('member_passcode')) {  
                    /*        
                     var text = "It gives us great pleasure to welcome you as a member at "+companyName+". Your personal code is "+request.member_passcode+".";
                                text += " This code is meant for your entry and billing only. Please keep your code private and do not share it with anybody else.";
                                text += " Should you wish to bring guests please whatsapp or message or call on "+supportNumber+" to make a reservation.";
                                text += " Remember the entry is only from the "+entry+".";
                                text += " Our operational hours are Tuesday-Sunday, 7 p.m. to 4 a.m. Thank you. "+companyName+" -GreneOS";
                                */
                     //let text = "It gives us great pleasure to welcome you as a member at "+companyName+". Your personal code is "+request.member_passcode+". This code is meant for your entry and billing only. Please keep your code private and do not share it with anybody else. Should you wish to bring guests please whatsapp or message or call on "+supportNumber+" to make a reservation. Remember the entry is only from the "+entry+". Our operational hours are "+operationalHours+". Thank you "+companyName+" -GreneOS";
                  
                     let text = `Dear ${request.member_name}, `
                     text = text + `You have been recommended for membership at Pudding & Mink by ${request.recommended_by}. ` 
                     text = text + `Pudding & Mink is the world's first Ayurvedic Cocktail Room that prides itself on bringing together the ultimate in luxury and intimacy. True luxury is not just about expensive interiors, but also about the quality of ingredients that go into your drinks. Your personal member code is ${request.member_passcode}. Please keep your code private and do not share it with anybody else. You can make a reservation using the link ${shortlink} and by verifying your mobile number. Remember the entry is only from the parking garage @ Radisson Blu Banjara Hills. Our operational hours are ${start}, ${end}. -GreneOS`;           
                        /*   
                        let text = `Dear ${memberName}, `
                        text = text + `You have been recommended for membership at Pudding & Mink by ${memberName}. ` 
                        text = text + `Pudding & Mink is the world's first Ayurvedic Cocktail Room that prides itself on bringing together the ultimate in luxury and intimacy. True luxury is not just about expensive interiors, but also about the quality of ingredients that go into your drinks. Your personal member code is ${memberName}. Please keep your code private and do not share it with anybody else. You can make a reservation using the link ${memberName} and by verifying your mobile number. Remember the entry is only from the parking garage @ Radisson Blu Banjara Hills. Our operational hours are ${memberName}, ${memberName}. -GreneOS`;           
        
                                    let text = `Dear ${request.member_name}, `
                                    text = text + `You have been recommended for membership at Pudding & Mink by ${request.member_name}. ` 
                                    text = text + `Pudding & Mink is the world's first Ayurvedic Cocktail Room that prides itself on bringing together the ultimate in luxury and intimacy. True luxury is not just about expensive interiors, but also about the quality of ingredients that go into your drinks. Your personal member code is ${request.member_name}. Please keep your code private and do not share it with anybody else. You can make a reservation using the link ${request.member_name} and by verifying your mobile number. Remember the entry is only from the parking garage @ Radisson Blu Banjara Hills. Our operational hours are ${request.member_name}, ${request.member_name}. -GreneOS`;           
                        */
                     console.log('sms Text : ' + text);
                     self.sendSms(request.asset_phone_country_code,request.asset_phone_number,encodeURIComponent(text));  
                     callback(false, {}, 200);
                } else {
                    generateUniqueCode(request, function(err, data){
                        if (err === false) {
                            updatePC(request, data).then(()=>{
                                /*
                                 var text = "It gives us great pleasure to welcome you as a member at Pudding & Mink. Your personal code is "+data+".";
                                     text += " This code is meant for your entry and billing only. Please keep your code private and do not share it with anybody else.";
                                     text += " Should you wish to bring guests please whatsapp or message or call on 916309386175 to make a reservation.";
                                     text += " Remember the entry is only from the parking garage @ Radisson Blu Banjara Hills.";
                                     text += " Our operational hours are Tuesday-Sunday, 7 p.m. to 4 a.m. Thank you. Pudding & Mink";
                                     */
                                // let text = "It gives us great pleasure to welcome you as a member at "+companyName+". Your personal code is "+data+". This code is meant for your entry and billing only. Please keep your code private and do not share it with anybody else. Should you wish to bring guests please whatsapp or message or call on "+supportNumber+" to make a reservation. Remember the entry is only from the "+entry+". Our operational hours are "+operationalHours+". Thank you "+companyName+" -GreneOS";
                                 let text = `Dear ${request.member_name}, `
                                 text = text + `You have been recommended for membership at Pudding & Mink by ${request.recommended_by}. ` 
                                 text = text + `Pudding & Mink is the world's first Ayurvedic Cocktail Room that prides itself on bringing together the ultimate in luxury and intimacy. True luxury is not just about expensive interiors, but also about the quality of ingredients that go into your drinks. Your personal member code is ${data}. Please keep your code private and do not share it with anybody else. You can make a reservation using the link ${shortlink} and by verifying your mobile number. Remember the entry is only from the parking garage @ Radisson Blu Banjara Hills. Our operational hours are ${start}, ${end}. -GreneOS`;           
                    
                                 console.log('sms Text : ' + text);
                                 self.sendSms(request.asset_phone_country_code,request.asset_phone_number,encodeURIComponent(text)); 
                                 callback(false, {}, 200);
                            });
                        } else {
                            callback(true, err, -9999);
                        }
        
                     });
                }                
            }
        })        

   };
   
   function updatePC(request, code) {
        return new Promise((resolve, reject)=>{
            console.log('Request : ', request);
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.target_asset_id,
                code,
                request.asset_id,
                request.datetime_log
                );
                let queryString = util.getQueryString('ds_v1_asset_list_update_passcode_pam', paramsArr);
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
                let phoneCode = util.randomInt(10001,49999).toString();                
                checkingFourDgtUniqueCode(request,phoneCode, (err, data)=>{
                    (err === false) ? callback(false, data) : generateCode();                    
                });
            }
            generateCode();
    };
    
    let checkingFourDgtUniqueCode = function(request, code, callback) {
        let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                code      
                );

        let queryString = util.getQueryString('ds_v1_asset_list_passcode_check_member', paramsArr);
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
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        
        pamAlterActivityStatus(request).then(()=>{
            callback(false, {}, 200);
        }).catch(()=>{
            callback(true, {}, -9999);
        })
    };
    
    let assignUnassignParticipantPam = function(request, participantData, status, callback) {
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
    
    let updateActivityListOwnerLeadPam = function(request, participantCollection, status, callback) {
        let flag = (status === 1) ? 1 : 0;
        let paramsArr = new Array(
                request.activity_id,
                participantCollection.asset_id,
                request.organization_id,
                request.activity_type_category_id,
                participantCollection.asset_category_id,
                flag, //unassign = 0 and assign 1
                request.asset_id,
                request.datetime_log
                );
        let queryString = util.getQueryString("ds_v1_activity_list_update_owner_lead_pam", paramsArr);
        if (queryString != '') {

            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    //console.log(err);
                    //global.logger.write('serverError', err, err, request)
                    util.logError(request,`updateActivityListOwnerLeadPam serverError Error %j`, { err, request });
                    return;
                }
            });
        }
    };
    
    this.insertAssetTimeline = function(request, callback) {
    	
    	let activityStreamTypeId = 323;
    	if(request.hasOwnProperty('stream_type_id')){
    		activityStreamTypeId = request.stream_type_id;
    	}
    	//var obj= request.activity_timeline_collection;
    	let obj= JSON.parse(request.activity_timeline_collection);
        let newAssetCollection = {
                 organization_id: obj.organization_id,
                 account_id: obj.account_id,
                 workforce_id: obj.workforce_id,
                 asset_id: obj.asset_id,
                 message_unique_id: obj.message_unique_id
             };
    	 
    	 console.log(newAssetCollection);
    	 assetTimelineInsert(request, newAssetCollection, activityStreamTypeId, function (err, data) {
        	callback(false, {}, 200);
        });
    };
    
    function assetTimelineInsert(request, participantData, streamTypeId, callback) {
        //console.log('vnk streamTypeId : ', streamTypeId);
        let assetId = request.asset_id;
        let organizationId = request.organization_id;
        let accountId = request.account_id;
        let workforceId = request.workforce_id;
        let messageUniqueId = request.message_unique_id;
        let entityTypeId = 0;
        let entityText1 = request.activity_timeline_text;
        let entityText2 = "";
        let entityText3 = "";
        let activityTimelineCollection = "{}"; //BETA
        let retryFlag = 0;
        let formTransactionId = 0;
        let dataTypeId = 0;
        let formId = 0;
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;
       
        if (participantData.asset_id > 0) {
            organizationId = participantData.organization_id;
            accountId = participantData.account_id;
            workforceId = participantData.workforce_id;
            assetId = participantData.asset_id;
            messageUniqueId = participantData.message_unique_id
        }
        console.log('participantData.length '+participantData+'   '+participantData.asset_id+' '+workforceId+' '+accountId+' '+organizationId);

        let paramsArr = new Array(
                request.activity_id,
                assetId,
                workforceId,
                accountId,
                organizationId,
                streamTypeId,
                entityTypeId, // entity type id
                entityText1, // entity text 1
                entityText2, // entity text 2
                entityText3, //Beta
                activityTimelineCollection, //BETA
                request.track_latitude,
                request.track_longitude,
                formTransactionId, //form_transaction_id
                formId, //form_id
                dataTypeId, //data_type_id  should be 37 static
                request.track_latitude, //location latitude
                request.track_longitude, //location longitude
                request.track_gps_accuracy,
                request.track_gps_status,
                request.track_gps_location,
                request.track_gps_datetime,
                "",
                "",
                request.device_os_id,
                "",
                "",
                request.app_version,
                request.service_version,
                request.asset_id,
                messageUniqueId,
                retryFlag,
                request.flag_offline,
                request.track_gps_datetime,
                request.datetime_log
                );
                let queryString = util.getQueryString("ds_v1_2_asset_timeline_transaction_insert", paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    //console.log(err);
                    //global.logger.write('serverError', err, err, request)
                    util.logError(request,`assetTimelineInsert serverError Error %j`, { err, request });
                    return;
                }
            });
        }
    };
    
    this.assetListUpdateDesc = function(request, callback) {
        let logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;
        
        let paramsArr = new Array(
                request.target_asset_id,
                request.organization_id,
                request.asset_qrcode_image_path,
                request.asset_id,
                request.datetime_log
                );

        let queryString = util.getQueryString('ds_v1_1_asset_list_update_desc_pam', paramsArr);
        if (queryString != '') {            
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {                    
                    pamAssetListHistoryInsert(request, 223, request.target_asset_id).then(()=>{});
                    callback(false, {}, 200);
                } else {                    
                    callback(true, err, -9999);
                    }
                });
            }     
    };
    
    this.deactivateAsset = function (request) {
    return new Promise((resolve, reject)=>{
    	let logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;
        let paramsArr = new Array(
                request.target_asset_id,
                request.organization_id,
                request.activate_flag,
                request.asset_id,
                request.datetime_log
                );

        let queryString = util.getQueryString('ds_v1_asset_list_update_activate_status', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, assetData) {
                if (err === false) {                    
                    pamAssetListHistoryInsert(request, 203, request.target_asset_id).then(()=>{
                    
                    	 resolve(true);
                    	
                    }).catch((err) => {
                    	console.log("errrrrrrrrrrrrrrr");
                    	reject(err);
                    	});
                   
                } else {                    
                    reject(err);
                    }
             });
        	}
    	});
     };
     
         this.insertActivityTimeline = function(request, callback) {
     	let obj= JSON.parse(request.activity_timeline_collection);
    	 let newAssetCollection = {
                 organization_id: obj.organization_id,
                 account_id: obj.account_id,
                 workforce_id: obj.workforce_id,
                 asset_id: obj.asset_id,
                 message_unique_id: obj.message_unique_id
             };
    	 
    	 console.log(newAssetCollection);
    	 activityTimelineInsert(request, newAssetCollection, function (err, data) {
        	callback(false, {}, 200);
        });
    };
    
     function activityTimelineInsert(request, participantData, callback) {
        //console.log('vnk streamTypeId : ', streamTypeId);
        let assetId = request.asset_id;
        let organizationId = request.organization_id;
        let accountId = request.account_id;
        let workforceId = request.workforce_id;
        let messageUniqueId = request.message_unique_id;
        let entityTypeId = 0;
        let entityText1 = request.activity_timeline_text;
        let entityText2 = "";
        let entityText3 = "";
        let activityTimelineCollection = "{}"; //BETA
        let retryFlag = 0;
        let formTransactionId = 0;
        let dataTypeId = 0;
        let formId = 0;
        let logDatetime = util.getCurrentUTCTime();
        request['datetime_log'] = logDatetime;
        
        if (Number(request.device_os_id) === 5)
            retryFlag = 1;
       
        if (participantData.asset_id > 0) {
            organizationId = participantData.organization_id;
            accountId = participantData.account_id;
            workforceId = participantData.workforce_id;
            assetId = participantData.asset_id;
            messageUniqueId = participantData.message_unique_id
        }
        console.log('participantData.length '+participantData+'   '+participantData.asset_id+' '+workforceId+' '+accountId+' '+organizationId);

        let paramsArr = new Array(
                request.activity_id,
                assetId,
                workforceId,
                accountId,
                organizationId,
                request.stream_type_id,
                entityTypeId, // entity type id
                entityText1, // entity text 1
                entityText2, // entity text 2
                entityText3, //Beta
                activityTimelineCollection, //BETA
                request.track_latitude,
                request.track_longitude,
                formTransactionId, //form_transaction_id
                formId, //form_id
                dataTypeId, //data_type_id  should be 37 static
                request.track_latitude, //location latitude
                request.track_longitude, //location longitude
                request.track_gps_accuracy,
                request.track_gps_status,
                request.track_gps_location,
                request.track_gps_datetime,
                "",
                "",
                request.device_os_id,
                "",
                "",
                request.app_version,
                request.service_version,
                request.asset_id,
                messageUniqueId,
                retryFlag,
                request.flag_offline,
                request.track_gps_datetime,
                request.datetime_log
                );
        let queryString = util.getQueryString("ds_v1_2_activity_timeline_transaction_insert", paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false)
                {
                    callback(false, true);
                    return;
                } else {
                    callback(err, false);
                    //console.log(err);
                    //global.logger.write('serverError', err, err, request)
                    util.logError(request,`activityTimelineInsert serverError Error %j`, { err, request });
                    return;
                }
            });
        }
    };
	
        function sendSmsCodeParticipant(request, callback){
    	
            let reservationCode;
            let expiryDatetime;
            let tableNames = "";
            let noOfGuests = 0;
            let cnt = 0;
            
            let memberName;
            let countryCode;
            let phoneNumber;                      
            let reservationCreatedDatetime;
            let reservationStartDatetime;
            
            let participantData = JSON.parse(request.activity_participant_collection);
                    forEachAsync(participantData, function (next, row) {
                        cnt++;                                              
                        if(row.asset_category_id == 30){
                            getActivityDetails(request).then((resp)=>{                               
                                reservationCode = resp[0].activity_sub_type_name;
                                expiryDatetime = util.replaceDefaultDatetime(resp[0].activity_datetime_end_estimated);
                                reservationStartDatetime = util.replaceDefaultDatetime(resp[0].activity_datetime_start_expected);
                                reservationCreatedDatetime = util.addUnitsToDateTime(util.replaceDefaultDatetime(resp[0].activity_datetime_created),5.5,'hours');
                                noOfGuests = resp[0].form_id;
                                console.log("reservationCreatedDatetime: "+reservationCreatedDatetime);
                                
                                request.work_station_asset_id = row.asset_id;
                                pamGetAssetDetails(request).then((data)=>{                                        
                                    phoneNumber = util.replaceDefaultNumber(data[0].asset_phone_number);
                                    countryCode = util.replaceDefaultNumber(data[0].asset_phone_country_code);
                                    memberName = util.replaceDefaultString(data[0].asset_first_name);
                                    next();
                                });                            
                            });                           
                                                     
                        } else if(row.asset_category_id == 31){
                                request.work_station_asset_id = row.asset_id;
                                    pamGetAssetDetails(request).then((data)=>{
                                        tableNames += data[0].asset_first_name + "-";
                                        
                                        console.log('data[0].asset_inline_data : ' , data[0].asset_inline_data);
                                        let inlineJson = JSON.parse(data[0].asset_inline_data);
                                        noOfGuests += util.replaceDefaultNumber(inlineJson.element_cover_capacity);
                                        next();
                                    });
                                                              
                        } else {
                            next();
                        }                       
                        
                    }).then(async() => {
                         //noOfGuests--;
                         let text;
                         console.log('memberName : ', memberName);
                         console.log('countryCode: ', countryCode);
                         console.log('phoneNumber : ', phoneNumber);
                         console.log('tableNames : ', tableNames);
                         
                         let expiryDateTime = util.addUnitsToDateTime(util.replaceDefaultDatetime(request.event_start_datetime),5.5,'hours');
                         //expiryDateTime = util.getDatewithndrdth(expiryDateTime);
                         expiryDateTime = util.getFormatedSlashDate(expiryDateTime);
                         
                         if(request.hasOwnProperty('reserv_at_item_order')) {
                            //text = "Dear "+memberName+","+" Your code was used to make an order a few minutes ago.";
			                /*text = "Dear "+memberName+","+" Your code was used to make an order at "+reservationCreatedDatetime+".";
                             text += " If you are not at Pudding \& Mink right now, please whatsapp / call us at 916309386175 immediately. Pudding & Mink";*/
                         }else if(request.hasOwnProperty('is_reservation_request')) {
                            //memberName = "Sravan";
                            //text = `Dear ${memberName},Your ${memberName} guest(s) reservation request has been received for ${memberName} at ${memberName}. The Pudding & Mink team will contact you shortly to confirm your reservation  -GreneOS`;
                            //text = `Dear Sravan, Your 10 guest(s) reservation request has been received for Friday, 27th August at 05:30 AM. The Pudding & Mink team will contact you shortly to confirm your reservation.`
                            let reservationStartDatetimeIST = util.UTCtoIST(reservationStartDatetime);
                            // text = `Dear ${memberName},Your ${noOfGuests} guest(s) reservation request has been received for ${util.convertDateFormat(reservationStartDatetimeIST,"dddd, Do MMMM")} at ${util.convertDateFormat(reservationStartDatetimeIST,"hh:mm A")}. The Pudding & Mink team will contact you shortly to confirm your reservation  -GreneOS`;
                            
                            // no need to send code when reservation is request from web
                            // reservation is getting into accepted state from mobile IOS/Android
                            // reservation is getting into requested state from web
                             let recipientData = {
                                 name: memberName,
                                 phone: countryCode.toString() + phoneNumber,
                             };
                             let memberData = {
                                 memberName: memberName,
                                 noOfGuests: noOfGuests,
                                 reservationStartDatetime: `${util.convertDateFormat(reservationStartDatetimeIST, "dddd, Do MMMM")}`,
                                 reservationtime: `${util.convertDateFormat(reservationStartDatetimeIST, "hh:mm A")}`,
                             };
                             let templateName = 'reservationrequest';
                             let [error, data] = await util.WhatsappNotification(request, memberData, recipientData, templateName);
                             return [false, {}]
                        } else {
                            let reservationStartDatetimeIST = util.UTCtoIST(reservationStartDatetime);
                            text = `Dear ${memberName},Your reservation on ${util.convertDateFormat(reservationStartDatetimeIST,"dddd, Do MMMM")} at ${util.convertDateFormat(reservationStartDatetimeIST,"hh:mm A")} for ${noOfGuests} is confirmed. Your reservation code is ${reservationCode}. You will need this code for valet, entry and ordering. Please share it only with the guests for this reservation. If any questions please call ${supportContactNumber}.`
                            //text = `Dear ${memberName},\nYour reservation on ${util.convertDateFormat(reservationStartDatetimeIST,"dddd, Do MMMM")} at ${util.convertDateFormat(reservationStartDatetimeIST,"hh:mm A")} for ${noOfGuests} is confirmed. Your reservation code is ${reservationCode}. You will need this code for valet, entry and ordering. Please share it only with the guests for this reservation. If any questions please call ${supportContactNumber}. -GreneOS`;
                            //text = `Dear Sravan, You have just placed an order for 2 items, if this is not valid please speak to our staff now. -GreneOS`;
                            //text = `Dear ${memberName},\nYour first guest has arrived and the billing for this reservation is active. If the reservation code is being misused, please call us -GreneOS`;
                         }
                         console.log('SMS text............. : \n'+ text);
                         
                            self.sendSms(countryCode,phoneNumber,encodeURIComponent(text));
                            self.sendSms(91,supportContactNumber,encodeURIComponent(text)); 
                            //self.sendSms(91,supportContactNumber,text);

                         return callback(false, 200);
                         });                             
   };
   
      function pamGetAssetDetails(request) {
        return new Promise((resolve, reject)=>{
            let paramsArr = new Array(
                request.organization_id || 351, //,
                request.work_station_asset_id
                );
            let queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {                    
                    (err === false)? resolve(data) : reject(err);
                });
            }
        });
    };
    
      function getActivityDetails(request){
        return new Promise((resolve, reject)=>{
            let paramsArr;
            paramsArr = new Array(
                        request.activity_id,
                        request.organization_id
                        );

            let queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false)? resolve(data) : reject(err);
                });
            }
        });        
    };
    
    this.eventReport = function (request) {
    	return new Promise((resolve, reject)=>{
    	//get the list of reservations (not cancelled)
    		let totalBill = 0;
    	this.getEventReservations(request,1).then((reservationList)=>{ // ArrayofArrays
			forEachAsync(reservationList, (next, reservation)=>{  
				console.log('reservation:'+reservation);
				forEachAsync(reservation, (next1, reservation1)=>{
					console.log('reservation1:'+reservation1.activity_id);
					this.processReservationBilling(request, reservation1.activity_id).then((reservationBill)=>{
						//console.log('Bill:'+reservationBill);
						totalBill = totalBill + reservationBill;
					}).then(()=>{
						next1();
					});
				}).then(()=>{
					next();
				});
			})
    	})
    	//for each reservation call the method in activity common service
    	resolve("");
    	});
    	
    };

    
    
    this.getEventReservations= function(request, is_recursive){
		return new Promise((resolve, reject)=>{       
	       
	       // if (queryString != '') {
	        	if(is_recursive == 1){
	        		let queryString = 'pm_v1_activity_list_select_event_reservations';
	    	        let paramsArr = new Array(
	    	        		request.organization_id,
	    	        		request.account_id,
	    	        		request.activity_id,
	    	        		37
	    	                );	 
		            db.executeRecursiveQuery(1, 0, 10, queryString, paramsArr, function (err, data) {
		            	//console.log("err "+err);
		               if(err === false) {
		               		resolve(data);        				        			      			  
	                    } else {
		                   reject(err);
		               }
		            });
	        	}else{
	    	        let paramsArr = new Array(
	    	        		request.organization_id,
	    	        		request.account_id,
	    	        		request.activity_id,
	    	        		37,
	    	        		request.page_start,
	    	        		request.page_limit
	    	                );	
	    	        let queryString = util.getQueryString('pm_v1_activity_list_select_event_reservations', paramsArr);
	        		db.executeQuery(1, queryString, request, function (err, data) {
	                    (err === false)? resolve(data) : reject(err);
	                });
	        	}
	   		//}
        });
    };
    
    this.processReservationBilling = function(request, idReservation){
    	return new Promise((resolve, reject)=>{
	    	if(request.hasOwnProperty('is_report')){
	    		//get the member of the reservation
	    		//get the discount of the member
	    		let start_from = 0;
	    		let limit_value = 50;
	    		let row_count = 0;
				getReservationMemberDiscount(request, idReservation).then((data)=>{
						console.log(data[0].memberDiscount); 
					//global.logger.write('debug','Discount '+ JSON.stringify(data), {},request);
                    util.logInfo(request,`processReservationBilling debug Discount %j`,{Discount : JSON.stringify(data), request});
					
					getReservationBilling(request, idReservation, data[0].nameReservation, data[0].idMember, data[0].nameMember, data[0].memberDiscount, data[0].serviceChargePercentage, data[0].memberEnabled).then((resevationBillAmount)=>{
						
						//global.logger.write('conLog', 'resevationBill ' + resevationBillAmount.total_price, {}, request);
                        util.logInfo(request,`processReservationBilling conLog resevationBill %j`,{resevationBillAmount_total_price : resevationBillAmount.total_price, request});
						
						if(request.hasOwnProperty('is_insert')){
							pamEventBillingInsert(request, data[0].idEvent, data[0].titleEvent, idReservation, data[0].nameReservation, data[0].idActivityStatusType, data[0].nameActivityStatusType, data[0].idMember, data[0].nameMember, resevationBillAmount.total_price);
						}
						resolve(resevationBillAmount);
						
					});
						
				});
				
	    	}
           else if(request.hasOwnProperty('is_cash_and_carry')){
	    		//get the member of the reservation
	    		//get the discount of the member
	    		let start_from = 0;
	    		let limit_value = 50;
	    		let row_count = 0;
				getReservationMemberDiscount(request, idReservation).then((data)=>{
						//console.log(data[0].memberDiscount); 
					//global.logger.write('debug','Discount '+ JSON.stringify(data), {},request);
                    util.logInfo(request,`getReservationMemberDiscount debug Discount %j`,{Discount : JSON.stringify(data), request});
					getCashAndCarryBilling(request, idReservation, data[0].nameReservation, data[0].idMember, data[0].nameMember, data[0].memberDiscount, data[0].serviceChargePercentage, data[0].memberEnabled).then((resevationBillAmount)=>{
						
						//global.logger.write('conLog', 'resevationBill ' + resevationBillAmount.total_price, {}, request);
                        util.logInfo(request,`getCashAndCarryBilling conLog resevationBill %j`,{resevationBillAmount_total_price : resevationBillAmount.total_price, request});
						
						if(request.hasOwnProperty('is_insert')){
							pamEventBillingInsert(request, data[0].idEvent, data[0].titleEvent, idReservation, data[0].nameReservation, data[0].idActivityStatusType, data[0].nameActivityStatusType, data[0].idMember, data[0].nameMember, resevationBillAmount.total_price);
						}
						resolve(resevationBillAmount);
						
					});
						
				});
				
	    	}
            else if (request.hasOwnProperty('is_menu_orders')) {
                //get the member of the reservation
                //get the discount of the member
                var start_from = 0;
                var limit_value = 50;
                var row_count = 0;
                getReservationMemberDiscount(request, idReservation).then((data) => {
                    //console.log(data[0].memberDiscount); 
                    global.logger.write('debug', 'Discount ' + JSON.stringify(data), {}, request);
                    getMenuItemOrderBilling(request, idReservation, data[0].nameReservation, data[0].idMember, data[0].nameMember, data[0].memberDiscount, data[0].serviceChargePercentage, data[0].memberEnabled).then((resevationBillAmount) => {

                        global.logger.write('conLog', 'resevationBill ' + resevationBillAmount.total_price, {}, request);

                        if (request.hasOwnProperty('is_insert')) {
                            pamEventBillingInsert(request, data[0].idEvent, data[0].titleEvent, idReservation, data[0].nameReservation, data[0].idActivityStatusType, data[0].nameActivityStatusType, data[0].idMember, data[0].nameMember, resevationBillAmount.total_price);
                        }
                        resolve(resevationBillAmount);

                    });

                });
            }
            else{    
	    		if(request.hasOwnProperty('is_room_posting'))
	    		pamEventBillingInsert(request, 0, '', idReservation, '', 0, '', 0, '', 0);
	    		resolve(true);
	    	}
    	});
    };
    
    function getReservationMemberDiscount(request, idReservation){
		return new Promise((resolve, reject)=>{
	        let paramsArr = new Array(
	        		request.organization_id,
	        		request.account_id,
	        		30,
	        		idReservation
	                );
	
	        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_reservation_member', paramsArr);
	        if (queryString != '') {
	            db.executeQuery(1, queryString, request, function (err, data) {
	            	//console.log("err "+err);
	               if(err === false) {	               		
	               		resolve(data);        				        			      			  
                    } else {
	                   reject(err);
	               }
	            });
	   		}
        });
    };
   
    function getReservationOrders(request, idReservation){
		return new Promise((resolve, reject)=>{
	        let paramsArr = new Array(
	        		request.organization_id,
	        		request.account_id,
	        		idReservation,
	        		38
	                );	        
	        let queryString = 'pm_v1_activity_list_select_reservation_orders';
	        if (queryString != '') {
	            db.executeRecursiveQuery(1, 0, 50, queryString, paramsArr, function (err, data) {
	               if(err === false) {
	               		resolve(data);        				        			      			  
                    } else {
	                   reject(err);
	               }
	            });
	   		}
        });
    };
    
    function getReservationBilling(request, idReservation, nameReservation, idMember, nameMember, discount, serviceChargePercentage, memberEnabled){
    	return new Promise((resolve, reject)=>{    		
			 let total_mrp = 0;
			 let total_discount = 0;
			 let total_tax = 0;
             let total_service_charge = 0;
             let total_item_tax = 0;
			 let total_price = 0;
			 let item_discount = 0;
			 let orderActivityId = 0;
			 let gst_percent = 18;
             console.log('memberEnabled', memberEnabled);
             let is_nc = memberEnabled == 4 ? 1 : 0;
			 getReservationOrders(request, idReservation).then((orderData)=>{
					// console.log(orderData,'orderData');
					
				forEachAsync(orderData, (next, rowData)=>{  
					// console.log(rowData,'*********************************rowData..................');
					forEachAsync(rowData, (next1, rowData1)=>{ 
						// console.log(JSON.parse(rowData1.activity_inline_data).activity_type_id,'activity_type_id');
						//reservation_id create
						let cost = 0;
                        let tax_percent = 0;
                        let dis_amount = 0;
						let tax_amount = 0;
                        let item_tax_amount = 0;
                        let service_charge_tax_amount = 0;
                        let price_after_discount = 0;
                        let final_price = 0;
                        let service_charge = 0;
                        let price_after_service_charge = 0;
                        let activity_type_name = '';
                        
					 	orderActivityId = rowData1.activity_id;
					 	
					 	if(JSON.parse(rowData1.activity_inline_data).activity_type_id == 52049){
					 		activity_type_name = 'Food';
					 	}else if(JSON.parse(rowData1.activity_inline_data).activity_type_id == 52050){
					 		activity_type_name = 'Spirits';
					 	}else if(JSON.parse(rowData1.activity_inline_data).activity_type_id == 52051){
					 		activity_type_name = 'Cocktails';
					 	}else{
					 		activity_type_name = 'Others';
					 	}
					 	
						if(JSON.parse(rowData1.activity_inline_data).is_full_bottle == 0) {
							cost = rowData1.activity_priority_enabled * JSON.parse(rowData1.activity_inline_data).item_price;
							//console.log("cost1", cost);
						}else if(JSON.parse(rowData1.activity_inline_data).is_full_bottle == 1){
							cost = rowData1.activity_priority_enabled * JSON.parse(rowData1.activity_inline_data).item_full_price;
							//console.log("cost2", cost);
						}
						
                        if(is_nc) {
                            cost = 0;
                        }

						if(rowData1.activity_status_type_id == 126 || rowData1.activity_status_type_id == 139 || rowData1.activity_status_type_id == 104){
							cost = 0;
						}
						
						item_discount = discount;
						
						if(rowData1.form_id == 1)
							item_discount = 0;
						
						dis_amount =  (cost * item_discount)/100;
						total_mrp = total_mrp + cost;
						                        
						price_after_discount = cost - dis_amount;
						tax_percent= JSON.parse(rowData1.activity_inline_data).tax;                        
						
                        service_charge = (price_after_discount * serviceChargePercentage)/100;

                        item_tax_amount = (cost * tax_percent)/100;
                        service_charge_tax_amount = (service_charge * gst_percent)/100
                        
                        total_service_charge = service_charge + total_service_charge;
                        total_item_tax = total_item_tax + item_tax_amount;

                        price_after_service_charge = cost + service_charge;
                        tax_amount = item_tax_amount + service_charge_tax_amount;
						final_price = price_after_service_charge + tax_amount;

						total_price = total_price + final_price;
						//console.log('total price '+total_price);
						total_tax = total_tax + tax_amount;
						total_discount = total_discount + dis_amount;
						
						//pam_order_list insert
						let attributeArray = {
								event_id: request.activity_id,
								reservation_id: idReservation,
								reservation_name: nameReservation,
								member_id: idMember,
								member_name: nameMember,
								order_status_type_id: rowData1.activity_status_type_id,
								order_status_type_name: rowData1.activity_status_type_name,
								order_type_id: JSON.parse(rowData1.activity_inline_data).activity_type_id,
								order_type_name:activity_type_name,
								order_id: rowData1.activity_id,
								menu_id: rowData1.channel_activity_id,
								order_name: rowData1.activity_title,
								order_quantity: rowData1.activity_priority_enabled,
								order_unit_price: JSON.parse(rowData1.activity_inline_data).item_price,
								is_full_bottle: JSON.parse(rowData1.activity_inline_data).is_full_bottle,
								full_bottle_price: JSON.parse(rowData1.activity_inline_data).item_full_price,
								choices: JSON.parse(rowData1.activity_inline_data).item_choices,
								choices_count:0,
								order_price:cost,
								service_charge_percent:serviceChargePercentage,
								service_charge:service_charge,                                
								discount_percent:item_discount,
								discount:dis_amount,
								price_after_discount:price_after_discount,
								tax_percent:tax_percent,
								tax:tax_amount,
								final_price:final_price,
								log_datetime:request.datetime_log,
								log_asset_id:rowData1.log_asset_id,
                                log_asset_first_name:rowData1.log_asset_first_name,
                                option_id: JSON.parse(rowData1.activity_inline_data).option_id
							};
						
						pamOrderInsert(request, attributeArray).then(()=>{
							//global.logger.write('conLog', 'OrderId cost: ' + cost+' service_charge: '+ service_charge+' item_tax_amount: '+ item_tax_amount+' service_charge_tax_amount:'+ service_charge_tax_amount+' orderId: '+rowData1.activity_id + '-menuId: ' + rowData1.channel_activity_id + ' : ' + final_price, {}, request);
                            util.logInfo(request,`pamOrderInsert conLog %j`,{OrderId_cost : cost, service_charge : service_charge, item_tax_amount : item_tax_amount, service_charge_tax_amount : service_charge_tax_amount, orderId : rowData1.activity_id, menuId : rowData1.channel_activity_id, final_price : final_price, request});
						if(JSON.parse(rowData1.activity_inline_data).hasOwnProperty('item_choice_price_tax'))
						{
							let arr = JSON.parse(rowData1.activity_inline_data).item_choice_price_tax;
							//for (key in arr)
							forEachAsync(arr, (next2, choiceData)=>{ 
								
								let choice_cost = 0;
								let dis_amount = 0;
                                let choice_tax_percent = 0;
								let choice_tax_amount = 0;
                                let choice_item_tax_amount = 0;
                                let choice_service_charge_tax_amount = 0;                                
								let choice_service_charge = 0;
							 	let choice_price_after_discount = 0;
							 	let choice_final_price = 0;
                                let choice_price_after_service_charge = 0;

								choice_cost = choiceData.quantity * choiceData.price;

                                if(is_nc) {
                                    choice_cost = 0;
                                }
                                
								total_mrp = total_mrp + choice_cost;
								
								if(rowData1.activity_status_type_id == 126 || rowData1.activity_status_type_id == 139 || rowData1.activity_status_type_id == 104){
									choice_cost = 0;
								}

								item_discount = discount;
								
								if(choiceData.hasOwnProperty('form_id')){
									if(choiceData.form_id == 1)
										item_discount = 0;
								}

								dis_amount =  (choice_cost * item_discount)/100;
								choice_price_after_discount = choice_cost - dis_amount;								
								
								choice_tax_percent= choiceData.tax;	
                                choice_service_charge = (choice_price_after_discount * serviceChargePercentage)/100;
                                choice_item_tax_amount = (choice_cost * choice_tax_percent)/100;
                                choice_service_charge_tax_amount = (choice_service_charge * gst_percent)/100;                                           
                                
                                total_service_charge = total_service_charge + choice_service_charge;
                                
                                choice_price_after_service_charge = choice_cost + choice_service_charge;
                                choice_tax_amount = choice_item_tax_amount + choice_service_charge_tax_amount;
								choice_final_price = choice_price_after_service_charge + choice_tax_amount;
        
								total_price = total_price + choice_final_price;
								//console.log('IN Choice total price '+total_price);
								total_tax = total_tax + choice_tax_amount;
								total_discount = total_discount + dis_amount;
								
								attributeArray.order_type_id=54536;
								attributeArray.order_type_name='Others';
								attributeArray.order_id=rowData1.activity_id;
								attributeArray.menu_id=choiceData.activity_id;
								attributeArray.order_name= choiceData.name;
								attributeArray.order_quantity= choiceData.quantity;
								attributeArray.order_unit_price= choiceData.price;
								attributeArray.is_full_bottle= 0;
								attributeArray.full_bottle_price= 0;
								attributeArray.choices= '';
								attributeArray.choices_count=0;
								attributeArray.order_price=choice_cost;
                                attributeArray.service_charge_percent=serviceChargePercentage;
								attributeArray.service_charge=choice_service_charge;                               
								attributeArray.discount_percent=item_discount;
								attributeArray.discount=dis_amount;
								attributeArray.price_after_discount=choice_price_after_discount;
								attributeArray.tax_percent=choice_tax_percent;
								attributeArray.tax=choice_tax_amount;
								attributeArray.final_price=choice_final_price;
								attributeArray.option_id=1;
								pamOrderInsert(request, attributeArray).then(()=>{
									//global.logger.write('conLog', 'OrderId choice_cost: ' + choice_cost+' choice_service_charge: '+ choice_service_charge+' choice_item_tax_amount: '+ choice_item_tax_amount+' choice_service_charge_tax_amount: '+ choice_service_charge_tax_amount+' orderId: '+rowData1.activity_id + '-menuId: ' + choiceData.activity_id + ' : ' + choice_final_price, {}, request);
                                    util.logInfo(request,`pamOrderInsert conLog %j`,{OrderId_choice_cost : choice_cost, choice_service_charge : choice_service_charge, choice_item_tax_amount : choice_item_tax_amount, choice_service_charge_tax_amount : choice_service_charge_tax_amount, orderId : rowData1.activity_id, menuId : choiceData.activity_id, choice_final_price : choice_final_price, request});
									next2();
									});
							}).then(()=>{
								next1();
							})							
							
						}else{							//console.log(request.activity_id+'-'+final_price);
							
							next1();
						}	
						
						});
						
					}).then(()=>{
						
						next();
					})
				}).then(()=>{
					// console.log("Reservation "+idReservation+" is done");
					//global.logger.write('conLog', 'Reservation ' + idReservation + ' is done', {}, request);
                    util.logInfo(request,`getReservationOrders conLog Reservation ${idReservation} is done %j`,{ request});
					resolve({total_price, total_discount, total_tax, gst_percent, total_mrp, total_service_charge});
				});
			 
			 }); 
    	});
    };

    function getCashAndCarryBilling(request, idReservation, nameReservation, idMember, nameMember, discount, serviceChargePercentage, memberEnabled) {
        return new Promise((resolve, reject) => {
            let total_mrp = 0;
            let total_discount = 0;
            let total_tax = 0;
            let total_service_charge = 0;
            let total_item_tax = 0;
            let total_price = 0;
            let item_discount = 0;
            let orderActivityId = 0;
            let gst_percent = 18;
            console.log("memberEnabled", memberEnabled);
            let is_nc = memberEnabled == 4 ? 1 : 0;
            // console.log("req1",typeof request.activity_inline_data);

            let inline_data = typeof request.activity_inline_data == 'string' ? JSON.parse(request.activity_inline_data) : request.activity_inline_data;
            // console.log('inl',inline_data)
            forEachAsync(inline_data, (next1, rowData1)=>{ 
                // console.log(JSON.parse(rowData1.activity_inline_data).activity_type_id,'activity_type_id');
                //reservation_id create
                let cost = 0;
                let tax_percent = 0;
                let dis_amount = 0;
                let tax_amount = 0;
                let item_tax_amount = 0;
                let service_charge_tax_amount = 0;
                let price_after_discount = 0;
                let final_price = 0;
                let service_charge = 0;
                let price_after_service_charge = 0;
                let activity_type_name = '';
                
                 orderActivityId = rowData1.activity_id;
                 let inlinDataParsed = rowData1.activity_inline_data;
                 if(inlinDataParsed.activity_type_id == 52049){
                     activity_type_name = 'Food';
                 }else if(inlinDataParsed.activity_type_id == 52050){
                     activity_type_name = 'Spirits';
                 }else if(inlinDataParsed.activity_type_id == 52051){
                     activity_type_name = 'Cocktails';
                 }else{
                     activity_type_name = 'Others';
                 }
                 
                if(inlinDataParsed.is_full_bottle == 0) {
                    cost = rowData1.activity_priority_enabled * inlinDataParsed.item_price;
                    //console.log("cost1", cost);
                }else if(inlinDataParsed.is_full_bottle == 1){
                    cost = rowData1.activity_priority_enabled * inlinDataParsed.item_full_price;
                    //console.log("cost2", cost);
                }
                
                if(is_nc) {
                    cost = 0;
                }

                if(rowData1.activity_status_type_id == 126 || rowData1.activity_status_type_id == 139 || rowData1.activity_status_type_id == 104){
                    cost = 0;
                }
                
                item_discount = discount;
                
                if(rowData1.form_id == 1)
                    item_discount = 0;
                
                dis_amount =  (cost * item_discount)/100;
                total_mrp = total_mrp + cost;
                                        
                price_after_discount = cost - dis_amount;
                tax_percent= inlinDataParsed.tax;                        
                
                service_charge = (price_after_discount * serviceChargePercentage)/100;

                item_tax_amount = (cost * tax_percent)/100;
                service_charge_tax_amount = (service_charge * gst_percent)/100
                
                total_service_charge = service_charge + total_service_charge;
                total_item_tax = total_item_tax + item_tax_amount;

                price_after_service_charge = cost + service_charge;
                tax_amount = item_tax_amount + service_charge_tax_amount;
                final_price = price_after_service_charge + tax_amount;

                total_price = total_price + final_price;
                //console.log('total price '+total_price);
                total_tax = total_tax + tax_amount;
                total_discount = total_discount + dis_amount;
                
                //pam_order_list insert
                let attributeArray = {
                        event_id: request.activity_id,
                        reservation_id: idReservation,
                        reservation_name: nameReservation,
                        member_id: idMember,
                        member_name: nameMember,
                        order_status_type_id: rowData1.activity_status_type_id,
                        order_status_type_name: rowData1.activity_status_type_name,
                        order_type_id: inlinDataParsed.activity_type_id,
                        order_type_name:activity_type_name,
                        order_id: rowData1.activity_id,
                        menu_id: rowData1.channel_activity_id,
                        order_name: rowData1.activity_title,
                        order_quantity: rowData1.activity_priority_enabled,
                        order_unit_price: inlinDataParsed.item_price,
                        is_full_bottle: inlinDataParsed.is_full_bottle,
                        full_bottle_price: inlinDataParsed.item_full_price,
                        choices: inlinDataParsed.item_choices,
                        choices_count:0,
                        order_price:cost,
                        service_charge_percent:serviceChargePercentage,
                        service_charge:service_charge,                                
                        discount_percent:item_discount,
                        discount:dis_amount,
                        price_after_discount:price_after_discount,
                        tax_percent:tax_percent,
                        tax:tax_amount,
                        final_price:final_price,
                        log_datetime:request.datetime_log,
                        log_asset_id:rowData1.log_asset_id,
                        log_asset_first_name:rowData1.log_asset_first_name,
                        option_id: inlinDataParsed.option_id
                    };
                
                pamOrderInsert(request, attributeArray).then(()=>{
                    //global.logger.write('conLog', 'OrderId cost: ' + cost+' service_charge: '+ service_charge+' item_tax_amount: '+ item_tax_amount+' service_charge_tax_amount:'+ service_charge_tax_amount+' orderId: '+rowData1.activity_id + '-menuId: ' + rowData1.channel_activity_id + ' : ' + final_price, {}, request);
                    util.logInfo(request,`pamOrderInsert conLog %j`,{OrderId_cost : cost, service_charge : service_charge, item_tax_amount : item_tax_amount, service_charge_tax_amount : service_charge_tax_amount, orderId : rowData1.activity_id, menuId : rowData1.channel_activity_id, final_price : final_price, request});
                if(inlinDataParsed.hasOwnProperty('item_choice_price_tax'))
                {
                    let arr = inlinDataParsed.item_choice_price_tax;
                    //for (key in arr)
                    forEachAsync(arr, (next2, choiceData)=>{ 
                        
                        let choice_cost = 0;
                        let dis_amount = 0;
                        let choice_tax_percent = 0;
                        let choice_tax_amount = 0;
                        let choice_item_tax_amount = 0;
                        let choice_service_charge_tax_amount = 0;                                
                        let choice_service_charge = 0;
                         let choice_price_after_discount = 0;
                         let choice_final_price = 0;
                        let choice_price_after_service_charge = 0;

                        choice_cost = choiceData.quantity * choiceData.price;

                        if(is_nc) {
                            choice_cost = 0;
                        }
                        
                        total_mrp = total_mrp + choice_cost;
                        
                        if(rowData1.activity_status_type_id == 126 || rowData1.activity_status_type_id == 139 || rowData1.activity_status_type_id == 104){
                            choice_cost = 0;
                        }

                        item_discount = discount;
                        
                        if(choiceData.hasOwnProperty('form_id')){
                            if(choiceData.form_id == 1)
                                item_discount = 0;
                        }

                        dis_amount =  (choice_cost * item_discount)/100;
                        choice_price_after_discount = choice_cost - dis_amount;								
                        
                        choice_tax_percent= choiceData.tax;	
                        choice_service_charge = (choice_price_after_discount * serviceChargePercentage)/100;
                        choice_item_tax_amount = (choice_cost * choice_tax_percent)/100;
                        choice_service_charge_tax_amount = (choice_service_charge * gst_percent)/100;                                           
                        
                        total_service_charge = total_service_charge + choice_service_charge;
                        
                        choice_price_after_service_charge = choice_cost + choice_service_charge;
                        choice_tax_amount = choice_item_tax_amount + choice_service_charge_tax_amount;
                        choice_final_price = choice_price_after_service_charge + choice_tax_amount;

                        total_price = total_price + choice_final_price;
                        //console.log('IN Choice total price '+total_price);
                        total_tax = total_tax + choice_tax_amount;
                        total_discount = total_discount + dis_amount;
                        
                        attributeArray.order_type_id=54536;
                        attributeArray.order_type_name='Others';
                        attributeArray.order_id=rowData1.activity_id;
                        attributeArray.menu_id=choiceData.activity_id;
                        attributeArray.order_name= choiceData.name;
                        attributeArray.order_quantity= choiceData.quantity;
                        attributeArray.order_unit_price= choiceData.price;
                        attributeArray.is_full_bottle= 0;
                        attributeArray.full_bottle_price= 0;
                        attributeArray.choices= '';
                        attributeArray.choices_count=0;
                        attributeArray.order_price=choice_cost;
                        attributeArray.service_charge_percent=serviceChargePercentage;
                        attributeArray.service_charge=choice_service_charge;                               
                        attributeArray.discount_percent=item_discount;
                        attributeArray.discount=dis_amount;
                        attributeArray.price_after_discount=choice_price_after_discount;
                        attributeArray.tax_percent=choice_tax_percent;
                        attributeArray.tax=choice_tax_amount;
                        attributeArray.final_price=choice_final_price;
                        attributeArray.option_id=1;
                        pamOrderInsert(request, attributeArray).then(()=>{
                            //global.logger.write('conLog', 'OrderId choice_cost: ' + choice_cost+' choice_service_charge: '+ choice_service_charge+' choice_item_tax_amount: '+ choice_item_tax_amount+' choice_service_charge_tax_amount: '+ choice_service_charge_tax_amount+' orderId: '+rowData1.activity_id + '-menuId: ' + choiceData.activity_id + ' : ' + choice_final_price, {}, request);
                            util.logInfo(request,`pamOrderInsert conLog %j`,{OrderId_choice_cost : choice_cost, choice_service_charge : choice_service_charge, choice_item_tax_amount : choice_item_tax_amount, choice_service_charge_tax_amount : choice_service_charge_tax_amount, orderId : rowData1.activity_id, menuId : choiceData.activity_id, choice_final_price : choice_final_price, request});
                            next2();
                            });
                    }).then(()=>{
                        next1();
                    })							
                    
                }else{							//console.log(request.activity_id+'-'+final_price);
                    
                    next1();
                }	
                
                });
                
            }).then(() => {
                //console.log("Reservation "+idReservation+" is done");
                //global.logger.write('conLog', 'Reservation ' + idReservation + ' is done', {}, request);
                util.logInfo(request,`getCashAndCarryBilling conLog Reservation ${idReservation} is done %j`,{request});
                resolve({
                    total_price,
                    total_discount,
                    total_tax,
                    gst_percent,
                    total_mrp,
                    total_service_charge
                });
            });


        });
    };
    function getMenuItemOrderBilling(request, idReservation, nameReservation, idMember, nameMember, discount, serviceChargePercentage, memberEnabled) {
        return new Promise((resolve, reject) => {
            var total_mrp = 0;
            var total_discount = 0;
            var total_tax = 0;
            let total_service_charge = 0;
            let total_item_tax = 0;
            var total_price = 0;
            var item_discount = 0;
            var orderActivityId = 0;
            let gst_percent = 18;
            console.log("memberEnabled", memberEnabled);
            let is_nc = memberEnabled == 4 ? 1 : 0;
            // console.log("req1",typeof request.activity_inline_data);
            let inline_data = typeof request.activity_inline_data == 'string' ? JSON.parse(request.activity_inline_data) : request.activity_inline_data;
            // console.log('inl',inline_data)
            forEachAsync(inline_data, (next1, rowData1) => {
                // console.log(JSON.parse(rowData1.activity_inline_data).activity_type_id,'activity_type_id');
                //reservation_id create
                let cost = 0;
                let tax_percent = 0;
                let dis_amount = 0;
                let tax_amount = 0;
                let item_tax_amount = 0;
                let service_charge_tax_amount = 0;
                let price_after_discount = 0;
                let final_price = 0;
                let service_charge = 0;
                let price_after_service_charge = 0;
                let activity_type_name = '';

                orderActivityId = rowData1.activity_id;
                let inlinDataParsed = rowData1.activity_inline_data;
                if (inlinDataParsed.activity_type_id == 52049) {
                    activity_type_name = 'Food';
                } else if (inlinDataParsed.activity_type_id == 52050) {
                    activity_type_name = 'Spirits';
                } else if (inlinDataParsed.activity_type_id == 52051) {
                    activity_type_name = 'Cocktails';
                } else {
                    activity_type_name = 'Others';
                }

                if (inlinDataParsed.is_full_bottle == 0) {
                    cost = rowData1.activity_priority_enabled * inlinDataParsed.item_price;
                    //console.log("cost1", cost);
                } else if (inlinDataParsed.is_full_bottle == 1) {
                    cost = rowData1.activity_priority_enabled * inlinDataParsed.item_full_price;
                    //console.log("cost2", cost);
                }

                if (is_nc) {
                    cost = 0;
                }

                if (rowData1.activity_status_type_id == 126 || rowData1.activity_status_type_id == 139 || rowData1.activity_status_type_id == 104) {
                    cost = 0;
                }

                item_discount = discount;

                if (rowData1.form_id == 1)
                    item_discount = 0;

                dis_amount = (cost * item_discount) / 100;
                total_mrp = total_mrp + cost;

                price_after_discount = cost - dis_amount;
                tax_percent = inlinDataParsed.tax;

                service_charge = (price_after_discount * serviceChargePercentage) / 100;

                item_tax_amount = (cost * tax_percent) / 100;
                service_charge_tax_amount = (service_charge * gst_percent) / 100

                total_service_charge = service_charge + total_service_charge;
                total_item_tax = total_item_tax + item_tax_amount;

                price_after_service_charge = cost + service_charge;
                tax_amount = item_tax_amount + service_charge_tax_amount;
                final_price = price_after_service_charge + tax_amount;

                total_price = total_price + final_price;
                //console.log('total price '+total_price);
                total_tax = total_tax + tax_amount;
                total_discount = total_discount + dis_amount;

                //pam_order_list insert
                var attributeArray = {
                    event_id: request.activity_id,
                    reservation_id: idReservation,
                    reservation_name: nameReservation,
                    member_id: idMember,
                    member_name: nameMember,
                    order_status_type_id: rowData1.activity_status_type_id,
                    order_status_type_name: rowData1.activity_status_type_name,
                    order_type_id: inlinDataParsed.activity_type_id,
                    order_type_name: activity_type_name,
                    order_id: rowData1.activity_id,
                    menu_id: rowData1.channel_activity_id,
                    order_name: rowData1.activity_title,
                    order_quantity: rowData1.activity_priority_enabled,
                    order_unit_price: inlinDataParsed.item_price,
                    is_full_bottle: inlinDataParsed.is_full_bottle,
                    full_bottle_price: inlinDataParsed.item_full_price,
                    choices: inlinDataParsed.item_choices,
                    choices_count: 0,
                    order_price: cost,
                    service_charge_percent: serviceChargePercentage,
                    service_charge: service_charge,
                    discount_percent: item_discount,
                    discount: dis_amount,
                    price_after_discount: price_after_discount,
                    tax_percent: tax_percent,
                    tax: tax_amount,
                    final_price: final_price,
                    log_datetime: request.datetime_log,
                    log_asset_id: rowData1.log_asset_id,
                    log_asset_first_name: rowData1.log_asset_first_name,
                    option_id: inlinDataParsed.option_id
                };

                pamOrderInsert(request, attributeArray).then(() => {
                    global.logger.write('conLog', 'OrderId cost: ' + cost + ' service_charge: ' + service_charge + ' item_tax_amount: ' + item_tax_amount + ' service_charge_tax_amount:' + service_charge_tax_amount + ' orderId: ' + rowData1.activity_id + '-menuId: ' + rowData1.channel_activity_id + ' : ' + final_price, {}, request);
                    if (inlinDataParsed.hasOwnProperty('item_choice_price_tax')) {
                        var arr = inlinDataParsed.item_choice_price_tax;
                        //for (key in arr)
                        forEachAsync(arr, (next2, choiceData) => {

                            let choice_cost = 0;
                            let dis_amount = 0;
                            let choice_tax_percent = 0;
                            let choice_tax_amount = 0;
                            let choice_item_tax_amount = 0;
                            let choice_service_charge_tax_amount = 0;
                            let choice_service_charge = 0;
                            let choice_price_after_discount = 0;
                            let choice_final_price = 0;
                            let choice_price_after_service_charge = 0;

                            choice_cost = choiceData.quantity * choiceData.price;

                            if (is_nc) {
                                choice_cost = 0;
                            }

                            total_mrp = total_mrp + choice_cost;

                            if (rowData1.activity_status_type_id == 126 || rowData1.activity_status_type_id == 139 || rowData1.activity_status_type_id == 104) {
                                choice_cost = 0;
                            }

                            item_discount = discount;

                            if (choiceData.hasOwnProperty('form_id')) {
                                if (choiceData.form_id == 1)
                                    item_discount = 0;
                            }

                            dis_amount = (choice_cost * item_discount) / 100;
                            choice_price_after_discount = choice_cost - dis_amount;

                            choice_tax_percent = choiceData.tax;
                            choice_service_charge = (choice_price_after_discount * serviceChargePercentage) / 100;
                            choice_item_tax_amount = (choice_cost * choice_tax_percent) / 100;
                            choice_service_charge_tax_amount = (choice_service_charge * gst_percent) / 100;

                            total_service_charge = total_service_charge + choice_service_charge;

                            choice_price_after_service_charge = choice_cost + choice_service_charge;
                            choice_tax_amount = choice_item_tax_amount + choice_service_charge_tax_amount;
                            choice_final_price = choice_price_after_service_charge + choice_tax_amount;

                            total_price = total_price + choice_final_price;
                            //console.log('IN Choice total price '+total_price);
                            total_tax = total_tax + choice_tax_amount;
                            total_discount = total_discount + dis_amount;

                            attributeArray.order_type_id = 54536;
                            attributeArray.order_type_name = 'Others';
                            attributeArray.order_id = rowData1.activity_id;
                            attributeArray.menu_id = choiceData.activity_id;
                            attributeArray.order_name = choiceData.name;
                            attributeArray.order_quantity = choiceData.quantity;
                            attributeArray.order_unit_price = choiceData.price;
                            attributeArray.is_full_bottle = 0;
                            attributeArray.full_bottle_price = 0;
                            attributeArray.choices = '';
                            attributeArray.choices_count = 0;
                            attributeArray.order_price = choice_cost;
                            attributeArray.service_charge_percent = serviceChargePercentage;
                            attributeArray.service_charge = choice_service_charge;
                            attributeArray.discount_percent = item_discount;
                            attributeArray.discount = dis_amount;
                            attributeArray.price_after_discount = choice_price_after_discount;
                            attributeArray.tax_percent = choice_tax_percent;
                            attributeArray.tax = choice_tax_amount;
                            attributeArray.final_price = choice_final_price;
                            attributeArray.option_id = 1;
                            pamOrderInsert(request, attributeArray).then(() => {
                                global.logger.write('conLog', 'OrderId choice_cost: ' + choice_cost + ' choice_service_charge: ' + choice_service_charge + ' choice_item_tax_amount: ' + choice_item_tax_amount + ' choice_service_charge_tax_amount: ' + choice_service_charge_tax_amount + ' orderId: ' + rowData1.activity_id + '-menuId: ' + choiceData.activity_id + ' : ' + choice_final_price, {}, request);
                                next2();
                            });
                        }).then(() => {
                            next1();
                        })

                    } else {							//console.log(request.activity_id+'-'+final_price);

                        next1();
                    }

                });

            }).then(() => {
                //console.log("Reservation "+idReservation+" is done");
                global.logger.write('conLog', 'Reservation ' + idReservation + ' is done', {}, request);
                resolve({
                    total_price,
                    total_discount,
                    total_tax,
                    gst_percent,
                    total_mrp,
                    total_service_charge
                });
            });


        });
    };
        
    function pamEventBillingInsert(request, idEvent, nameEvent, idReservation, nameReservation, idStatusType, nameStatusType, idMember, nameMember, billingAmount) {
        return new Promise((resolve, reject)=>{
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                idEvent,
                nameEvent,
                idReservation,
                nameReservation,
                idStatusType,
                nameStatusType,
                idMember,
                nameMember,
                billingAmount,
                request.datetime_log
                );
            let queryString = util.getQueryString("pm_v1_1_pam_event_billing_insert", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {                  
                   if(err === false){                	   
                	   resolve(data);
                   }else{
                	   reject(err);
                   }
                });
            }
        })
    };

   function pamOrderInsert(request, attributeArray){
    	return new Promise((resolve, reject)=>{
	    	if(request.hasOwnProperty('is_insert')){
	    		pamOrderListInsert(request, attributeArray).then(() => {
	    		    if (attributeArray.order_status_type_id != 126 && attributeArray.order_status_type_id != 139) {
	    		        insertOrderIngredients(request, attributeArray, attributeArray.menu_id).then(() => {
	    		            resolve();
	    		        });
	    		    } else {
	    		        resolve();
	    		    }

	    		})
	    	}else{
	    		resolve();
	    	}
    	});
    }
    
    function pamOrderListInsert(request, attributeArray){
        return new Promise((resolve, reject)=>{
        	
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                attributeArray.event_id,
                attributeArray.reservation_id,
                attributeArray.reservation_name,
                attributeArray.member_id,
                attributeArray.member_name,
                attributeArray.order_status_type_id,
                attributeArray.order_status_type_name,
                attributeArray.order_type_id,
                attributeArray.order_type_name,
                attributeArray.order_id,
                attributeArray.menu_id,
                attributeArray.order_name,
                attributeArray.order_quantity,
                attributeArray.order_unit_price,
                attributeArray.is_full_bottle,
                attributeArray.full_bottle_price,
                attributeArray.choices,
                attributeArray.choices_count,
                attributeArray.order_price,
                attributeArray.discount_percent,
                attributeArray.discount,
                attributeArray.price_after_discount,
                attributeArray.tax_percent,
                attributeArray.tax,
                attributeArray.service_charge_percent,
                attributeArray.service_charge,                 
                attributeArray.final_price,                
                request.datetime_log,
                attributeArray.log_asset_id,
                attributeArray.log_asset_first_name
                );
            
	            let queryString = util.getQueryString("pm_v1_3_pam_order_list_insert", paramsArr);
	            
	            if (queryString != '') {
	                db.executeQuery(0, queryString, request, function (err, data) {                  
	                   if(err === false){                	   
	                	   resolve();
	                   }else{
	                	   reject(err);
	                   }
	                });
	            }
        	
        });
        
    }
    
    function getActivityDetailsMaster(request, activityId, callback) {
        let paramsArr;
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
        let queryString = util.getQueryString('ds_v1_activity_list_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {                    
                    callback(false, data);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    function getActivityParticipantsCategory(request, activityId, assetTypeCategoryId, optionId) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array();
            let queryString = '';
            paramsArr = new Array(
                request.organization_id,
                request.account_id,
                activityId,
                assetTypeCategoryId,
                optionId
            );

            queryString = 'pm_v1_activity_asset_mapping_select_participants_category';
            db.executeRecursiveQuery(1, 0, 10, queryString, paramsArr, function (err, data) {
                //console.log("err "+err);
                if (err === false) {
                    resolve(data);
                } else {
                    reject(err);
                }
            });
        })

    }

    function insertOrderIngredients(request, attributeArray, menuActivityId) {
        return new Promise((resolve, reject) => {
            getActivityParticipantsCategory(request, menuActivityId, 41, attributeArray.option_id).then((ingredientObjectList) => { // ArrayofArrays
                forEachAsync(ingredientObjectList, (Objectnext, ingredientList) => {
                    forEachAsync(ingredientList, (Listnext, ingredientData) => {
                            console.log('OrderId: ' + attributeArray.order_id + '; menuActivityId : ' + menuActivityId + '; ingredientData:' + ingredientData.asset_id + ' : ' + ingredientData.asset_first_name);
                            pamOrderIngredientInsert(request, attributeArray, ingredientData).then(() => {
                                console.log('ingredientData: Captured');
                            }).then(() => {
                                Listnext();
                            });
                        })
                        .then(() => {
                            Objectnext();
                        });
                }).then(() => {
                    resolve();
                });
            });
        });
    }

    function pamOrderIngredientInsert(request, attributeArray, ingredientData) {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                attributeArray.event_id,
                '',
                null,
                attributeArray.order_id,
                attributeArray.menu_id,
                attributeArray.order_name,
                attributeArray.order_type_id,
                attributeArray.order_type_name,
                attributeArray.order_status_type_id,
                attributeArray.order_status_type_name,
                attributeArray.choices,
                attributeArray.order_quantity,
                ingredientData.asset_id,
                ingredientData.activity_sub_type_id,
                ingredientData.activity_sub_type_name,
                (attributeArray.order_quantity * ingredientData.activity_sub_type_id),
                request.datetime_log
            )

            let queryString = util.getQueryString("pm_v1_pam_order_ingredient_mapping_insert", paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }
    
    
    this.pamSendOrderSms = async (request) => {
        let err = true,res = [];
        try{
            if(Number(request.item_order_count)){
                request.work_station_asset_id = request.member_asset_id;
                let pamAssetDetails = await pamGetAssetDetails(request);                                        
                let phoneNumber = util.replaceDefaultNumber(pamAssetDetails[0].asset_phone_number);
                let countryCode = util.replaceDefaultNumber(pamAssetDetails[0].asset_phone_country_code);
                let memberName = util.replaceDefaultString(pamAssetDetails[0].asset_first_name);
                let link = "https://thepamapp.com/order-details/"+request.reservation_activity_id;
                request.long_url = link;
                request.member_name = memberName;
                request.phone_number = phoneNumber;
                request.country_code = countryCode;
                //let res = await self.getShortFirebaseURL(request);
                
                TinyURL.shorten(request.long_url, function(res, err) {
                    if (err){
                        console.log("getShortFirebaseURL "+err)                       
                    }else{
                        console.log("getShortFirebaseURL "+res);                        
                     let text = `Dear ${request.member_name}, there is an order placed on your reservation for the following items. Click on the link below to see your orders.`
                        text = text +`\n${res} if this is not valid please speak to a staff member or call pudding and mink now. -GreneOS`
                        console.log(text);
                        self.sendSms(request.country_code,request.phone_number,text);                          
                    }
                });
                /*
                console.log("RES "+res)
                let text = `Dear ${request.member_name}, there is an order placed on your reservation for the following items. Click on the link below to see your orders.`
                text = text +`\n${res} if this is not valid please speak to a staff member or call pudding and mink now. -GreneOS`
                 console.log(text);
                 self.sendSms(request.country_code,request.phone_number,text);   
                 */            
                //let text = `Dear ${memberName},\nYou have just placed an order for ${request.item_order_count} items, if this is not valid please speak to our staff now -GreneOS`
               // let text = `Dear ${memberName}, You have just placed an order for ${request.item_order_count} items, if this is not valid please speak to our staff now. -GreneOS`;

                err = false;
            }
        }catch(error){
            return [error,res];
        }
        return [err,res];
    };

    this.assetListSelectPhoneNumber = async(request) => {
        return new Promise((resolve, reject) => {
            // IN p_organization_id bigint(20), IN p_phone_number VARCHAR(20), IN p_country_code SMALLINT(6)
            let paramsArr = new Array(
                request.organization_id,
                request.phone_number,
                request.country_code,
            )

            let queryString = util.getQueryString("pm_v1_asset_list_select_phone_number", paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    } 
  
    

    // function assetMappingSelectMemberActivities(request,asset_id){
    //     return new Promise((resolve, reject) => {
    //         // IN p_organization_id BIGINT(20), IN p_account_id bigint(20), IN p_asset_id BIGINT(20), IN p_activity_type_category_id SMALLINT(6), IN p_start_from BIGINT(20), IN p_limit_value TINYINT(4)
             
    //         var paramsArr = new Array(
    //             request.organization_id,
    //             request.account_id,
    //             asset_id,
    //             request.activity_type_category_id,
    //             request.page_start,
    //             request.page_limit
    //         )

    //         var queryString = util.getQueryString("pm_v1_activity_asset_mapping_select_member_activities", paramsArr);
    //         if (queryString != '') {
    //             db.executeQuery(1, queryString, request, function (err, data) {
    //                 if (err === false) {
    //                     resolve(data);
    //                 } else {
    //                     console.log(err);
    //                     reject(err);
    //                 }
    //             });
    //         }
    //     });
    // }

    this.pamOrdersWithPhoneNumber = async(request) => {
            let err = true,response = [];
            try{
                let asset = await self.assetListSelectPhoneNumber(request)
                if(asset.length !== 0)
                {
                    let [error, responseData] = await self.assetMappingSelectMemberActivities(request,asset[0].asset_id)
                    err = false
                    
                }
            else{
               return  [ err , -9995];
            }
            }catch(error){
               return [err, -9999];
            }

        }

this.assetMappingSelectMemberActivities = async (request,asset_id) => {

    let responseData = [],
        error = true;
    
    let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            asset_id,
            request.activity_type_category_id,
            request.page_start,
            request.page_limit
        )

    const queryString = util.getQueryString('pm_v1_activity_asset_mapping_select_member_activities', paramsArr);
    if (queryString !== '') {
        await db.executeQueryPromise(1, queryString, request)
          .then((data) => {
              responseData = data;
              error = false;
          })
          .catch((err) => {
              error = err;
          })
    }
    return [error, responseData];
}
///get/activity/category/type
this.getActivityType = async (request) => {

    let responseData = [],
        error = true;
 
    let paramsArr = new Array(
        request.organization_id,
        request.account_id,
        request.workforce_id,
        request.activity_type_category_id,
    )
    const queryString = util.getQueryString('pm_v1_workforce_activity_type_mapping_select_category', paramsArr);
    if (queryString !== '') {
        await db.executeQueryPromise(1, queryString, request)
          .then((data) => {
              responseData = data;
              error = false;
			 
          })
          .catch((err) => {
              error = err;
          })
    }
	return [error, responseData];
   
}
//get First Status of an activityTypeCategory // /get/activity/category/status
this.getActivityStatusV1 = async (request) => {

    let responseData = [],
        error = true;
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_activity_type_category_id SMALLINT(6), IN p_activity_status_type_id SMALLINT(6)

    let paramsArr = new Array(
        request.organization_id,
        request.account_id,
        request.workforce_id,
        request.activity_type_category_id,
        request.activity_status_type_id
    )
    const queryString = util.getQueryString('pm_v1_workforce_activity_status_mapping_select_first_status', paramsArr);
    if (queryString !== '') {
        await db.executeQueryPromise(1, queryString, request)
          .then((data) => {
              responseData = data;
              error = false;
          })
          .catch((err) => {
              error = err;
          })
    }
    return [error, responseData];
}



const getPamActivityStatusId = () => {
    return new Promise((resolve, reject) => {
        // N p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_activity_type_category_id SMALLINT(6), IN p_activity_status_type_id SMALLINT(6)
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.activity_status_type_id
        )

        let queryString = util.getQueryString("pm_v1_workforce_activity_status_mapping_select_first_status", paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    resolve(data);
                } else {
                    reject(err);
                }
            });
        }
    });
}

this.addParticipantMakeRequest = async function (request) {
    let participantArray = [];
    //console.log("addParticipantMakeRequest1 "+JSON.stringify(request,null,2));
    let memberCollection = {
        organization_id: request.organization_id,
        account_id: request.account_id,
        workforce_id: request.workforce_id,
        asset_type_id: 0,
        asset_category_id:30,
        asset_id:request.member_asset_id,
        access_role_id:0,
        message_unique_id:util.getMessageUniqueId(request.asset_id)
    }
    let tableCollection = {
        organization_id: request.organization_id,
        account_id: request.account_id,
        workforce_id: request.workforce_id,
        asset_type_id: 0,
        asset_category_id:31,
        asset_id:request.table_asset_id||0,
        access_role_id:0,
        message_unique_id:util.getMessageUniqueId(request.asset_id)
    }

    participantArray.push(memberCollection);
    participantArray.push(tableCollection);

    request.activity_participant_collection=JSON.stringify(participantArray);
    request.url = '/pam/activity/participant/access/set'
    //console.log("addParticipantMakeRequest2 "+JSON.stringify(request,null,2));
	const assignActAsync = nodeUtil.promisify(makingRequest.post);
	const makeRequestOptions1 = {
		form: request,
	};
	try {
		const response = await assignActAsync(
			global.config.mobileBaseUrl +
				global.config.version +
				"/pam/activity/participant/access/set",
			makeRequestOptions1,
		);
		const body = JSON.parse(response.body);
		if (Number(body.status) === 200) {
			console.log("Activity Mapping Assign | Body: "+ body);
			return [false, {}];
		} else {
			console.log("Error "+ body);
			return [true, {}];
		}
	} catch (error) {
		console.log("Activity Mapping Assign | Error: "+ error);
		return [true, {}];
	}
};

const addActivity = async (request) => {
    request.url = '/activity/add';
	const assignActAsync = nodeUtil.promisify(makingRequest.post);
	const makeRequestOptions1 = {
		form: request,
	};
	try {
		const response = await assignActAsync(
			global.config.mobileBaseUrl + global.config.version + "/activity/add",
			makeRequestOptions1,
		);
		const body = JSON.parse(response.body);
		if (Number(body.status) === 200) {
			console.log("Activity Add | Body: ", body);
			return [false, body];
		} else {
			console.log("Error ", body);
			return [true, {}];
		}
	} catch (error) {
		console.log("Activity Add | Error: ", error);
		return [true, {}];
	}
};

this.getEvent = async (request) => {

	let responseData = [],
		error = true;

	let paramsArr = new Array(
		request.organization_id,
		request.account_id,
		util.getCurrentUTCTime(),
	);
	const queryString = util.getQueryString(
		"ds_v2_activity_list_select_event_datetime",
		paramsArr,
	);
	if (queryString !== "") {
		await db
			.executeQueryPromise(1, queryString, request)
			.then((data) => {
				responseData = data;
				error = false;
			})
			.catch((err) => {
				error = err;
			});
	}
	return [error, responseData];
};

this.addAssetPamSubfnV1 = async function (request) {
	err = true ,responseData = [];
	let dateTimeLog = util.getCurrentUTCTime();
	request['datetime_log'] = dateTimeLog;

	let assetTypeCtgId;
	(request.hasOwnProperty('asset_type_category_id')) ? assetTypeCtgId = request.asset_type_category_id : assetTypeCtgId = 0;

		request.code = (request.code||'');
		request.enc_token =(request.enc_token|| '');
		let paramsArr = new Array(
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

	let queryString = util.getQueryString('ds_v1_asset_list_insert_pam', paramsArr);
	if (queryString != '') {
        await db.executeQueryPromise(0, queryString, request)
        .then(async(assetData) => {
           await assetListHistoryInsert(request, assetData[0]['asset_id'], request.organization_id, 0, request.datetime_log, function (err, data) {});
            responseData = assetData;
            error = false;
        })
        .catch((err) => {
            error = err;
        })
		}
		return [err, responseData]       
};


this.addPamReservationViaPhoneNumber = async (request) => {

	(err = true), (responseData = -9999);

    let member_asset_type_category_id = 30;
    try{
	let assetData = await self.assetListSelectPhoneNumber(request);
    if(assetData.length > 0){
        request.member_asset_id = assetData[0].asset_id;
		request.asset_first_name = assetData[0].asset_first_name 
	}
    else{
        const [assetTypeError, assetType] = await self.workforceAssetTypeMappingSelectCategoryAsync(request, 30);
            // create the asset
			request.asset_first_name = request.phone_number;
			request.asset_last_name = "";
			request.asset_description = "";
			request.customer_unique_id = 0;
			request.asset_profile_picture = "";
			request.asset_inline_data = '{}';
			request.phone_country_code = request.country_code;
			request.asset_phone_number = request.phone_number;
			request.asset_email_id = "";
			request.asset_timezone_id = 0;
			request.asset_type_id = assetType[0].asset_type_id;
			request.asset_type_category_id = 30;
			request.asset_type_name = "Member";
			request.operating_asset_id = 0;
			request.manager_asset_id = 0;
			request.code = "";
			request.enc_token = "";
			request.is_member = 1;
			request.invite_sent = 0;
			request.discount_percent = 0;

			const [error,newAssetData] = await self.addAssetPamSubfnV1(request);
			if(newAssetData.length>0){
				request.member_asset_id = newAssetData[0].asset_id
			}
        } 
    const [eventErr, eventData] = await self.getEvent(request);
   
    if(!eventErr && eventData.length === 0){
            // No Event Exists
            console.log("No Event exists, hence no reservation created");
          //  activityData.response.message = "No Event exists, hence no reservation created";
                     
            return [false,"No Event exists, hence no reservation created"];
    }else{

        request.activity_parent_id = eventData[0].activity_id;
        request.activity_type_category_id = 37;
        const [err1, activityType] = await self.getActivityType(request);
        request.activity_type_id = activityType[0].activity_type_id;
        request.activity_status_type_id = 150;
        const [err2, activityStatus] = await self.getActivityStatusV1(request);
        request.activity_status_id = activityStatus[0].activity_status_id;

        request.activity_title = request.asset_first_name + (request.table_name||'');
        request.activity_description = request.activity_title;
		request.activity_access_role_id=117;
		request.activity_channel_category_id= 0;
		request.activity_channel_id=0;
        
        if(!request.hasOwnProperty("activity_datetime_end"))
		request.activity_datetime_end=util.addUnitsToDateTime(util.getCurrentISTTime(),2,"hours");
        if(!request.hasOwnProperty("activity_datetime_start"))
		request.activity_datetime_start=util.getCurrentISTTime(); 

        request.owner_asset_id=request.asset_id;
		request.activity_form_id=0;
		request.activity_inline_data=JSON.stringify({table_asset_id:request.table_asset_id, member_asset_id:request.member_asset_id, phone_number:request.phone_number,country_code:request.country_code,item_count:request.item_count});
		request.activity_sub_type_id=request.activity_sub_type_id || 0;
		request.activity_sub_type_name=''
		request.app_version=1
		request.asset_message_counter=0
		request.channel_activity_categeory_id=0
		request.device_os_id=5;
		request.flag_offline=0;
		request.flag_pin=0;
		request.flag_priority=0
		request.flag_retry=0
		request.message_unique_id=util.getMessageUniqueId(request.asset_id)	
		request.product_id=2
		request.service_version=1
		request.track_altitude=0
		request.track_gps_accuracy=0
		request.track_gps_datetime=util.getCurrentUTCTime()
		request.track_gps_location=''
		request.track_gps_status=1
		request.track_latitude=0
		request.track_longitude=0
		//request.member_code = '0'         
        
        const [error, activityData] = await addActivity(request);
            console.log("activityData "+activityData.response.activity_id)
            request.activity_id = activityData.response.activity_id;
            activityData.response.member_asset_id = request.member_asset_id;
            const [error1, response] = await self.addParticipantMakeRequest(request);             
            return [false,activityData.response];
    }

}
catch(e){
	console.log(e);
}
	return [err, responseData];
}

this.whatsappAccessToken = async() =>{
	let client_id = "PRPCLIENTID"
	let client_secret="PRPCLIENTSECRET";
	let password = "7669933483";
	let user_name = "20048"
		url = `https://wa.chatmybot.in/gateway/auth/v1/oauth/token?username=${user_name}&password=${password}&grant_type=password&client_secret=${client_secret}&client_id=${client_id}`;
		const assignActAsync = nodeUtil.promisify(makingRequest.post);
		const makeRequestOptions1 = {
			headers:{authorization:"Basic UFJQQ0xJRU5USUQ6UFJQQ0xJRU5UU0VDUkVU"},
		};
		try {
			const response = await assignActAsync(url,makeRequestOptions1);
			const body = JSON.parse(response.body);
			if (body.hasOwnProperty("access_token")) {
				console.log("Activity Add | Body: ", body);
				return [false, body];
			} else {
				console.log("Error ", body);
				return [true, {}];
			}
		} catch (error) { 
			console.log("Activity Add | Error: ", error);
			return [true, {}];
		}
}

this.sendWhatsAppTemplateMessage = async(request)=>{
	request.url = `https://wa.chatmybot.in/gateway/wabuissness/v1/message/batch`;
	const assignActAsync = nodeUtil.promisify(makingRequest.post);
	let [error,access] =  await self.whatsappAccessToken();
	
	if(!error){
		request.access_token = access["access_token"];
		request.token_type = access["token_type"]
	}
	request.template_id = "d5cce67c-d65b-444e-8818-8b80d1b9ecd2";
	request.account_id = 20048;
	request.namespace = "60c813f1_bf7f_4aee_afa4_2a87cc648e98";
	request.campaing_id = 118
	request.template_name ="reserve2"
	request.parameters.length< 3 ? request.parameters = ["","",""]:null; // [no_of_people,time,date] 
	request.parameters = JSON.parse(request.parameters)
	
	 try {
	 if(request.phone_number.length<10){
		let pamAssetDetails = await pamGetAssetDetails(request); 
			console.log("pamAssetDetails",pamAssetDetails)
		 	request.phone_number = pamAssetDetails[0].operating_asset_phone_number
			request.country_code = pamAssetDetails[0].operating_asset_phone_country_code
	}
	request.form_data = [
		{
		   "template":{
			  "id":request.template_id,
			  "status":true,
			  "namespace":request.namespace,
			  "name":request.template_name,
			  "language":{
				 "policy":"deterministic",
				 "code":"en"
			  },
			  "components":[
				 {
					"type":"body",
					"parameters":[
					   {
						  "type":"text",
						  "text":request.parameters[
							 0
						  ],
						  "caption":null,
						  "link":null,
						  "payload":null,
						  "currency":{
							 "fallback_value":0,
							 "code":"USD",
							 "amount_1000":0
						  },
						  "date_time":{
							 "fallback_value":0,
							 "day_of_week":0,
							 "day_of_month":1,
							 "year":1,
							 "month":1,
							 "hour":1,
							 "minute":1
						  },
						  "document":{
							 "link":0,
							 "filename":0
						  },
						  "video":{
							 "link":0,
							 "filename":0
						  },
						  "image":{
							 "link":0,
							 "filename":0
						  },
						  "nameOfParams":"{{1}}"
					   },
					   {
						  "type":"text",
						  "text":request.parameters[
							 1
						  ],
						  "caption":null,
						  "link":null,
						  "payload":null,
						  "currency":{
							 "fallback_value":0,
							 "code":"USD",
							 "amount_1000":0
						  },
						  "date_time":{
							 "fallback_value":0,
							 "day_of_week":0,
							 "day_of_month":1,
							 "year":1,
							 "month":1,
							 "hour":1,
							 "minute":1
						  },
						  "document":{
							 "link":0,
							 "filename":0
						  },
						  "video":{
							 "link":0,
							 "filename":0
						  },
						  "image":{
							 "link":0,
							 "filename":0
						  },
						  "nameOfParams":"{{2}}"
					   },
                       {
                        "type":"text",
                        "text":request.parameters[
                           2
                        ],
                        "caption":null,
                        "link":null,
                        "payload":null,
                        "currency":{
                           "fallback_value":0,
                           "code":"USD",
                           "amount_1000":0
                        },
                        "date_time":{
                           "fallback_value":0,
                           "day_of_week":0,
                           "day_of_month":1,
                           "year":1,
                           "month":1,
                           "hour":1,
                           "minute":1
                        },
                        "document":{
                           "link":0,
                           "filename":0
                        },
                        "video":{
                           "link":0,
                           "filename":0
                        },
                        "image":{
                           "link":0,
                           "filename":0
                        },
                        "nameOfParams":"{{3}}"
                     }
					]
				 }
			  ],
			  "application":null,
			  "accountId":request.account_id
		   },
		   "to":request.country_code+request.phone_number,
		   "type":"template",
		   "campaingId":request.campaing_id,
		   "date":0,
		   "dlrTime":0,
		   "viewTime":0,
		   "messageId":"SENT",
		   "messageStatus":"SENT",
		   "chatSide":"User",
		   "text":null,
		   "image":null,
		   "video":null,
		   "document":null,
		   "audio":null
		}
	 ]
	const makeRequestOptions1 = {
		headers:{
			authorization:`Bearer ${request.access_token}`,
			"Content-type": "application/json",
		},
		json:request.form_data
	}
	
		const response = await assignActAsync(request.url,makeRequestOptions1);
		const body = response.body;
		if (body.hasOwnProperty("status")) {
			console.log("Activity Add | Body: ", body);
			body.to = request.country_code+request.phone_number;
			return [false, body];
		} else {
			console.log("Error ", body);
			return [true, -9995];
		}
	} catch (error) {
		console.log("Activity Add | Error: ", error);
		return [true,-9999];
	}
}

this.getCoupanDetails = async (request) => {

    let responseData = [],
        error = true;
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_activity_type_category_id SMALLINT(6), IN p_activity_status_type_id SMALLINT(6)

    let paramsArr = new Array(
        request.organization_id,
        request.coupan_code,
        util.getCurrentUTCTime(),
        request.page_start,
        request.page_limit
    )
    const queryString = util.getQueryString('pm_v1_pam_coupan_list_select_code', paramsArr);
    if (queryString !== '') {
        await db.executeQueryPromise(1, queryString, request)
          .then((data) => {
              responseData = data;
              error = false;
          })
          .catch((err) => {
              error = err;
          })
    }
    return [error, responseData];
}

this.updateActivityInlineData = async (request) => {

    let responseData = [],
        error = true;
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_activity_type_category_id SMALLINT(6), IN p_activity_status_type_id SMALLINT(6)

    let paramsArr = new Array(
        request.organization_id,
        request.activity_id,
        request.activity_inline_data
    )
    const queryString = util.getQueryString('ds_v1_activity_list_update_inline_data_both', paramsArr);
    if (queryString !== '') {
        await db.executeQueryPromise(0, queryString, request)
          .then((data) => {
              responseData = data;
              error = false;
          })
          .catch((err) => {
              error = err;
          })
    }
    return [error, responseData];
}

// Fetching the Asset Type ID for a given organisation/workforce and asset type category ID
this.workforceAssetTypeMappingSelectCategoryAsync  = async (request, idAssetTypeCategory) => {

    let responseData = [],
    error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            idAssetTypeCategory,
            0,
            1
        );
        let queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_select_category', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];      
};

this.checkingReservationCodeV1 = async (request) => {
    let responseData = [],
        error = true,
        responseObject = {};
    request.datetime_log = util.getCurrentUTCTime();
    const [eventErr, eventData] = await self.getEvent(request);  
    console.log(eventData,'eventData');
    if(!eventErr){
        if(eventData.length > 0){
            for (let i = 0; i < eventData.length; i++) {
            request.parent_activity_id = eventData[i].activity_id;
            request.activity_type_category_id = 37;
            request.page_start = 0;
            request.page_limit = 1;
            [error, responseData] = await self.getChildOfAParent(request);
            if (responseData.length > 0) {
                responseObject = responseData.length > 0 ? responseData[0] : {};
                break;
            }       
            }
        } else {
            return([true, ['No events available']]);
        }
    }else {
            return([true, ['Error getting Event']]);
    }
    return [error, responseObject];
};


this.getChildOfAParent = async (request) => {

    let responseData = [],
        error = true;
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_activity_type_category_id SMALLINT(6), IN p_activity_status_type_id SMALLINT(6)

    let paramsArr = new Array(
        request.organization_id,
        request.parent_activity_id,
        request.activity_type_category_id,
        request.reservation_code,
        request.page_start,
        request.page_limit
    )
    const queryString = util.getQueryString('ds_v1_activity_search_list_select_parent', paramsArr);
    if (queryString !== '') {
        await db.executeQueryPromise(1, queryString, request)
          .then((data) => {
              responseData = data;
              error = false;
          })
          .catch((err) => {
              error = err;
          })
    }
    return [error, responseData];
}

    //Checking Reservation For Orders
    this.checkingReservationCodeV2 = async (request) => {
        let responseData = [],
            error = true,
            responseObject = {};
        request.datetime_log = util.getCurrentUTCTime();
        const [eventErr, eventData] = await self.getEvent(request);
        if (!eventErr) {
            if (eventData.length > 0) {
                request.parent_activity_id = eventData[0].activity_id;
                request.activity_type_category_id = 37;
                request.page_start = 0;
                request.page_limit = 100;
                [error, responseData] = await self.getChildOfAParent(request);
                responseObject = responseData.length > 0 ? responseData[0] : {};
            } else {
                return ([true, ['No events available']]);
            }
        } else {
            return ([true, ['Error getting Event']]);
        }
        return [error, responseObject];
    };

    //Get Orders Using Reservation Code
    this.getOrdersUsingReservationCode = async (request) => {

        let responseData = [],
            error = true;

        const [eventErr, reservationData] = await self.checkingReservationCodeV2(request);
        if (!eventErr) {
            if (reservationData !== {}) {
                request.parent_activity_id = reservationData.activity_id;
                request.activity_type_category_id = 38;
                [error, responseData] = await self.getOrders(request);
            } else {
                return ([true, ['No events available']]);
            }
        } else {
            return ([true, ['Error getting Orders']]);
        }
        return [error, responseData];
    }

    //Get Orders
    this.getOrders = async (request) => {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.parent_activity_id,
            request.activity_type_category_id,
            request.page_start,
            request.page_limit
        )
        const queryString = util.getQueryString('pm_v1_activity_list_select_reservation_orders', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

     //Get Upcoming Events based On Reservation
     this.getUpcomingEvents = async (request) => {

        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.organization_id ,
            request.group_size ,
            request.date,
            request.page_start,
            request.page_limit 
        )
        const queryString = util.getQueryString('pm_v1_activity_list_select_upcoming_events', paramsArr);
        
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then(async(data) => {
                    if(data.length>0 ){ 
                        for(let i=0 ;i<data.length;i++){
                            let paramsArr1 = new Array(
                                request.organization_id ,
                                data[i].activity_id,
                                request.group_size ,
                                data[i].capacity,
                            )
                            const queryString1 = util.getQueryString('pm_v1_activity_list_select_open_reservation_covers', paramsArr1);
                        
                            if (queryString1 !== '') {
                                await db.executeQueryPromise(1, queryString1, request)
                                    .then((eventdata) => {
                                        console.log(eventdata[0].current_covers+request.group_size);
                                        if(Number(request.group_size)+Number(eventdata[0].current_covers)<=data[i].capacity)
                                        {
                                            responseData.push(data[i]);
                                        }

                                    })
                                }  
                        }
                    }
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.sendReservationSMS = async (request) => {
        let responseData = [],
        error = false;
        let text = "";
        getReservationMemberDiscount(request, request.reservation_activity_id).then((data)=>{
            text = `Dear ${data[0].nameMember} \nYour ${data[0].noOfGuests} people reservation on ${util.convertDateFormat(data[0].datetimeStart,"dddd, Do MMMM")} for Dinner (8PM-11PM) is confirmed. Your reservation code is ${data[0].nameActivitySubType}. You will need this code for valet, entry and ordering. Please share it only with the guests for this reservation. If any questions please call ${supportContactNumber} \n-Pudding &amp; Mink Reservation Desk. -GreneOS`;
            console.log("SMS :: "+text);
            console.log("ENCODED SMS :: "+encodeURIComponent(text));
            self.sendSms(data[0].memberPhoneCountryCode,data[0].memberPhoneNumber,encodeURIComponent(text));
        });
        
        //text = "Dear test Your test people reservation on test, test for Dinner (8PM-11PM) is confirmed. Your reservation code is test. You will need this code for valet, entry and ordering. Please share it only with the guests for this reservation. If any questions please call test -Pudding &amp; Mink Reservation Desk. -GreneOS";
       // text = `Dear ${memberName} \nYour test people reservation on ${memberName}, ${memberName} for Dinner (8PM-11PM) is confirmed. Your reservation code is ${memberName}. You will need this code for valet, entry and ordering. Please share it only with the guests for this reservation. If any questions please call ${memberName} \n-Pudding &amp; Mink Reservation Desk. -GreneOS`;
       // self.sendSms(countryCode,phoneNumber,encodeURIComponent(text));

        return [error, responseData];
    }

    //Get Trending Orders
    this.getTrendingOrders = async (request) => {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.page_start,
            request.page_limit
        )
        const queryString = util.getQueryString('pm_v1_activity_list_select_trending_orders', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }    

    this.sendTestSMS = async (request) => {

        let responseData = [],
            error = false;
            let memberName = "Sravan";
            let reservationStartDatetimeIST = util.UTCtoIST("2021-08-27");
            let noOfGuests = 10;
            let supportContactNumber = "9010819966";
            let reservationCode = "25874";
            let countryCode = "91";
            let phoneNumber = "7680000368";
            let link = "thepam.page.link/6eZ4";

/*
            let memberName = "Sravan";
            let link = "https://thepamapp.com/order-details/"+request.reservation_activity_id;

            let text = `Dear ${memberName}, there is an order placed on your reservation for the following items. Click on the link below to see your orders.`
            text = text +`\n${link} if this is not valid please speak to a staff member or call pudding and mink now. -GreneOS`
*/

/*
            let text = `Dear ${memberName},your bill of ${memberName} for your reservation number ${memberName} has been generated and your reservation is closed.`
            text = text+`Click on the link below to see your bill `
            text = text+`${link} -GreneOS`;
*/
/*
            TinyURL.shorten('https://thepamapp.com/order-details/10000010', function(res, err) {
            if (err)
                console.log(err)
                console.log(res);
            });
*/
/*
            let text = `Dear ${memberName} `
            text = text + `\nYou have been recommended for membership at Pudding & Mink by ${memberName}.`
            text = text + `\nPudding & Mink is the world's first Ayurvedic Cocktail Room that prides itself on bringing together the ultimate in luxury and intimacy. True luxury is not just about expensive interiors, but also about the quality of ingredients that go into your drinks, the range of your conversations and connections, and the sense of always being welcomed and feeling safe. From Ayurvedic cocktails made from organic fresh fruit and vegetables, to jazz and comedy nights, and personalized service, we strive to always give you the best. Starting from 1st  September.`
            text = text + `\nAs a member, you can make a reservation by clicking on the link below`
            text = text + `\n${link}`
            text = text + `\nWe look forward to having a drink with you.`
            text = text + `\nThank you. Pudding & Mink -GreneOS`
            console.log('SMS text : \n'+ text);
*/
/*
            var verificationCode;
            verificationCode = util.getVerificationCode();
            let text = `OTP ${verificationCode} is for your member code validation at Pudding & Mink. Valid only for 30mins. Do not share OTP for security reasons -GreneOS`;           
*/
            //let text = `Dear ${memberName},Your ${memberName} guest(s) reservation request has been received for ${memberName} at ${memberName}. The Pudding & Mink team will contact you shortly to confirm your reservation  -GreneOS`;
            let text = `Dear ${memberName},Your ${memberName} guest(s) reservation request has been received for ${memberName} at ${memberName}. The Pudding & Mink team will contact you shortly to confirm your reservation  -GreneOS`

/*
            let text = "";
            /*`Dear ${memberName}`
            text = text + `\nYour ${memberName} people reservation on ${memberName}, ${memberName} for Dinner (8PM-11PM) is confirmed. Your reservation code is ${memberName}. You will need this code for valet, entry and ordering. Please share it only with the guests for this reservation. If any questions please call ${memberName}`
            text = text + `\n-Pudding & Mink Reservation Desk. -GreneOS`
            */
            //encodeURI(text);
            //text = "Dear test Your test people reservation on test, test for Dinner (8PM-11PM) is confirmed. Your reservation code is test. You will need this code for valet, entry and ordering. Please share it only with the guests for this reservation. If any questions please call test -Pudding &amp; Mink Reservation Desk. -GreneOS";
            
           // text = `Dear ${memberName} \nYour test people reservation on ${memberName}, ${memberName} for Dinner (8PM-11PM) is confirmed. Your reservation code is ${memberName}. You will need this code for valet, entry and ordering. Please share it only with the guests for this reservation. If any questions please call ${memberName} \n-Pudding & Mink Reservation Desk. -GreneOS`;
/*            
            let text = `Dear ${memberName}, `
            text = text + `You have been recommended for membership at Pudding & Mink by ${memberName}. ` 
            text = text + `Pudding & Mink is the world's first Ayurvedic Cocktail Room that prides itself on bringing together the ultimate in luxury and intimacy. True luxury is not just about expensive interiors, but also about the quality of ingredients that go into your drinks. Your personal member code is ${memberName}. Please keep your code private and do not share it with anybody else. You can make a reservation using the link ${memberName} and by verifying your mobile number. Remember the entry is only from the parking garage @ Radisson Blu Banjara Hills. Our operational hours are ${memberName}, ${memberName}. -GreneOS`;           
            console.log(text);
*/            
            self.sendSms(countryCode,phoneNumber,encodeURIComponent(text));


        return [error, responseData];       
    
    }

    //Get Member Reservation in an event
    this.getMemberReservationDetails = async (request) => {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id || 351, //
            request.account_id || 452, //,
            request.event_activity_id,
            request.member_asset_id 
            );
        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_reservation', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }        
        return [error, responseData];
    }

    this.getReservationSerialNumber = async (request) => {
        return new Promise((resolve, reject)=>{
            let responseData = [],
                error = true;

            pamEventBillingInsert(request, request.event_id, request.event_name, request.reservation_id, request.reservation_name, request.activity_status_type_id, request.activity_status_type_name, request.member_asset_id, request.member_asset_name, request.reservation_bill).then((response)=>{
                resolve([false,response]);
            }).catch((err) => {
                error = err;
                reject([true,response]);
            })
        })
    };    

     //Get event summary
     this.emailEventSummary = async (request) => {

        if(!request.email) {
            return [true, []];
        }
        
        const Current_Date = util.getTimestamp();
        let responseData = [],
            error = true;
            let fileName = "";
            let SaleReportType='';
            let start_date='';
            let end_date='';
        // //HANDLE THE PATHS in STAGING and PREPROD AND PRODUCTION
        switch(global.mode) {            
            case 'staging': fileName = '/apistaging-data/';
                            break;
            case 'preprod': fileName = '/data/';
                            break;
            case 'prod': fileName = '/api-data/';
                         break;            
            default: fileName = '/api-data/'; 
                     break;
        }
        const header = [
            [["Most Ordered Food", "Count"]],
            [["Most Ordered Spirit:", "Count"]],
            [["Most Ordered Cocktail:", "Count"]],
            [
                [
                    "SNo",
                    "ReservationId",
                    "Reservation Name",
                    "Amount",
                    "card",
                    "cash",
                    "unpaid",
                    "Date",
                ],
            ],
            [
                [
                    "ReservationId",
                    "ReservationName",
                    "Status",
                    "Order Type.",
                    "Order Id",
                    "Order Name",
                    "Quantity",
                    "Unit Price",
                    "Is Full Bottle",
                    "Full Bottle Price",
                    "Choices",
                    "Choice Count",
                    "Order Price",
                    "Service Charge Percent",
                    "Service Charge",
                    "Discount%",
                    "Discount",
                    "PriceAfterDiscount",
                    "Tax%",
                    "Tax",
                    "Final Price",
                    "Date",
                    "Ordered Time",
                ],
            ],
            [
                [
                    "LogUser",
                    "Reservation Id",
                    "Reservation Name",
                    "Status",
                    "Order Type",
                    "Order Id",
                    "Order Name",
                    "Quantity",
                    "Unit Price",
                    "Is Full Bottle",
                    "Full Bottle Price",
                    "Choices",
                    "Choices Count",
                    "Order Price",
                    "Service Charge%",
                    "Service Charge",
                    "Discount%",
                    "Discount",
                    "PriceAfterDiscount",
                    "Tax%",
                    "Tax",
                    "Final Price",
                    "Date",
                    "Ordered Datetime",
                ],
            ],
            [
                [
                    "IngredientAssetId",
                    "IngredientName",
                    "Unit Quantity",
                    "Consumed Quantity in ml",
                    "Consumption(in bottles)",
                    "Extra in ml",
                ],
            ],
            [
                [
                    "Item Name",
                    "Quantity",
                    "item_price",
                    "discount",
                    "tax",
                    "service charge",
                    "Bill",
                    "Type",
                ],
            ],
            [
                [
                    "Item Name",
                    "FullBottle",
                    "item_price",
                    "discount",
                    "tax",
                    "service charge",
                    "Bill",
                    "Type",
                ],
            ],
            [
                [
                    "ReservationId",
                    "ReservationName",
                    "MemberId",
                    "MemberName",
                    "Discount %",
                    "Discount",
                ],
            ],
          [  ["Total Cover Charges"]],
        ];
        for (let i = 1; i <= 14; i++) {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.event_activity_id,
                request.start_date,
                request.end_date,
                request.flag = i,
                request.type_flag
            );
            let queryString = util.getQueryString(
                "pm_v2_pam_order_list_select_event_summary",
                paramsArr
            );
            if (queryString != "") {
                await db
                    .executeQueryPromise(1, queryString, request)
                    .then(async (data) => {
                        responseData = data;
                        error = false;

                        let responseDataValues = [];

                        //monthly checks
                        if(request.type_flag==1){
                            SaleReportType="MonthlyReport";
                            start_date=Current_Date;
                            end_date=(request.end_date).split(" ")[0];
                        }
                        else{
                            SaleReportType="EventReport",
                            start_date=Current_Date;
                            end_date=(request.start_date).split(" ")[0]; 
                        };

                        fs.stat(
                            `${fileName}${SaleReportType}_${request.event_activity_id}_${start_date}_${end_date}.xlsx`,
                            function (err, stat) {
                                if (err == null) {
                                    let wb = XLSX.readFile(
                                        `${fileName}${SaleReportType}_${request.event_activity_id}_${start_date}_${end_date}.xlsx`, {
                                            cellText: false,
                                            cellDates: true,
                                            cellStyles: true,
                                        }
                                    );                                
                                    salesReoprt(wb, responseData);
                                } else if (err.code === "ENOENT") {
                                    let nwb = XLSX.utils.book_new();
                                    let ws_name = [
                                        "Summary",
                                        "Reservation Wise Report",
                                        "Group By Quantity-item",
                                        "Item wise Report",
                                        "Inventory Report",
                                        "Detailed Inventory Report",
                                        "Wasted&Removed from billing",
                                        "Discount Report",
                                    ];
                                    /* make worksheet */
                                    for (let i = 0; i < ws_name.length; i++) {
                                        let ws_data = [
                                            [""]
                                        ];
                                        let ws = XLSX.utils.aoa_to_sheet(ws_data);

                                        /* Add the worksheet to the workbook */
                                        XLSX.utils.book_append_sheet(nwb, ws, ws_name[i]);
                                    }
                                    XLSX.writeFile(
                                        nwb,
                                        `${fileName}${SaleReportType}_${request.event_activity_id}_${start_date}_${end_date}.xlsx`, {
                                            cellStyles: true,
                                            compression:true
                                        }
                                    );
                                    let wb = XLSX.readFile(
                                        `${fileName}${SaleReportType}_${request.event_activity_id}_${start_date}_${end_date}.xlsx`, {
                                            cellText: false,
                                            cellDates: true,
                                            cellStyles: true,
                                        }
                                    );
                                    salesReoprt(wb, responseData);
                                } else {
                                    //    console.log("Some other error: ", err.code);
                                }
                            }
                        );

                        function salesReoprt(wb, responseData) {
                            //Total Liquor Sale
                            wb.Sheets["Summary"]["B18"] = {
                                f: "SUM(B15:B16)",
                            };
                            wb.Sheets["Summary"]["C18"] = {
                                f: "SUM(C15:C16)",
                            };
                            wb.Sheets["Summary"]["D18"] = {
                                f: "SUM(D15:D16)",
                            };
                            wb.Sheets["Summary"]["E18"] = {
                                f: "SUM(E15:E16)",
                            };


                            //Total Sale sum
                            wb.Sheets["Summary"]["B19"] = {
                                f: "SUM(B14:B17)",
                            };
                            wb.Sheets["Summary"]["C19"] = {
                                f: "SUM(C14:C17)",
                            };
                            wb.Sheets["Summary"]["D19"] = {
                                f: "SUM(D14:D17)",
                            };
                            wb.Sheets["Summary"]["E19"] = {
                                f: "SUM(E14:E17)",
                            };

                            wb.Sheets["Summary"]["B20"] = {
                                f: "B19-C19",
                            };
                            wb.Sheets["Summary"]["D20"] = {
                                f: "D19-E19",
                            };

                            //Total bill
                            wb.Sheets["Summary"]["D7"] = {
                                f: "SUM(C2:C7)",
                            };
                            wb.Sheets["Summary"]["C8"] = {
                                f: "SUM(C2:C7)",
                            };

                            // let ws =  wb.Sheets['Summary']
                            switch (i) {
                                //MOST ORDERED FOOD
                                case 1:
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets["Summary"],
                                        header[0],
                                        { origin: "G12" }
                                    );
                                    let responseData1 = responseData[0] || 0;
                                    XLSX.utils.sheet_add_json(
                                        wb.Sheets.Summary,
                                        [responseData1], {
                                        origin: "G13",
                                        skipHeader: true,
                                        dateNF: 'dd"."mm"."yyyy',
                                    }
                                    );
                                    break;
                                // MOST ORDERED SPIRITS
                                case 2:
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets["Summary"],
                                        header[1],
                                        { origin: "G16" }
                                    );
                                    let responseData2 = responseData[0] || 0;
                                    XLSX.utils.sheet_add_json(
                                        wb.Sheets.Summary,
                                        [responseData2], {
                                        origin: "G17",
                                        skipHeader: true,
                                        dateNF: 'dd"."mm"."yyyy',
                                    }
                                    );
                                    break;
                                //MOST ORDERED COCKTAILS
                                case 3:
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets["Summary"],
                                        header[2],
                                        { origin: "G19" }
                                    );
                                    let responseData3 = responseData[0] || 0;
                                    XLSX.utils.sheet_add_json(
                                        wb.Sheets.Summary,
                                        [responseData3], {
                                        origin: "G20",
                                        skipHeader: true,
                                        dateNF: 'dd"."mm"."yyyy',
                                    }
                                    );
                                    break;
                                    //RESERVATION WISE BILLING
                                case 4:
                                    console.log(responseData,'responseDataresponseData case-4')
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets["Reservation Wise Report"],
                                        header[3]
                                    );
                                    XLSX.utils.sheet_add_json(
                                        wb.Sheets["Reservation Wise Report"],
                                        responseData, {
                                            origin: "A2",
                                            skipHeader: true,
                                            dateNF: 'd"."mm"."yyyy',
                                        }
                                    );

                                    break;
                                    //Sale without/with Tax MTD
                                case 5:
                                    responseData.map((i) => {
                                        return responseDataValues.push({
                                            "MTD with Tax": i.billing_amount,
                                            "MTD removing Tax": i.bill_without_tax,
                                        });
                                    });

                                    ws = XLSX.utils.sheet_add_json(
                                        wb.Sheets.Summary,
                                        responseDataValues, {
                                            origin: "D13",
                                        }
                                    );

                                    break;
                                    //Sale without/with Tax for the given event
                                case 6:
                                    let column = [{
                                            "Daily Sale": "Total Food Sale",
                                        },
                                        {
                                            "Daily Sale": "Total Spirit Sale",
                                        },
                                        {
                                            "Daily Sale": "Total Cocktail Sale",
                                        },
                                        {
                                            "Daily Sale": "Total Other Sale",
                                        },
                                        {
                                            "Daily Sale": "Total Liquor Sale",
                                        },
                                        {
                                            "Daily Sale": "Total Sale",
                                        },
                                    ];
                                    ws = XLSX.utils.sheet_add_json(wb.Sheets.Summary, column, {
                                        origin: "A13",
                                    });

                                    responseData.map((i) => {
                                        return responseDataValues.push({
                                            "with Tax": i.billing_amount,
                                            "Without Tax": i.bill_without_tax,
                                        });
                                    });

                                    ws = XLSX.utils.sheet_add_json(
                                        wb.Sheets.Summary,
                                        responseDataValues, {
                                            origin: "B13",
                                        }
                                    );

                                    break;
                                    //ITEM WISE REPORT
                                case 7:
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets["Item wise Report"],
                                        header[4]
                                    );
                                    XLSX.utils.sheet_add_json(
                                        wb.Sheets["Item wise Report"],
                                        responseData, {
                                            origin: "A2",
                                            skipHeader: true,
                                            dateNF: "yyyy.mm.dd",
                                        }
                                    );

                                    break;
                                    //WASTED, REMOVED FROM BILLING, CANCELLED
                                case 8:
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets["Wasted&Removed from billing"],
                                        header[5]
                                    );
                                    XLSX.utils.sheet_add_json(
                                        wb.Sheets["Wasted&Removed from billing"],
                                        responseData, {
                                            origin: "A2",
                                            skipHeader: true,
                                            dateNF: 'dd"."mm"."yyyy',
                                        }
                                    );

                                    break;
                                    //ITEM STATUS WISE billing_transaction
                                case 9:
                                    let Heading = [
                                        ["Item Status", "Count", "Bill"]
                                    ];
                                    let columns_ = [{
                                            "": "Total",
                                        },
                                        {
                                            "": " Wasted",
                                        },
                                        {
                                            "": " Removed from Billing",
                                        },
                                        {
                                            "": " Cancelled",
                                        },
                                    ];
                                    ws = XLSX.utils.sheet_add_json(wb.Sheets.Summary, columns_, {
                                        origin: "A7",
                                    });

                                    responseData.map((i) => {
                                        return responseDataValues.push({
                                            "Item Status": i.order_status_type_name,
                                            Count: i.order_count,
                                            Bill: i.final_price,
                                        });
                                    });

                                    XLSX.utils.sheet_add_aoa(wb.Sheets.Summary, Heading);

                                    XLSX.utils.sheet_add_json(wb.Sheets.Summary, responseData, {
                                        origin: "A2",
                                        skipHeader: true,
                                        cellStyles: true,
                                    });

                                    break;
                                    //INGREDIENT CONSUMPTION
                                case 10:
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets["Inventory Report"],
                                        header[6]
                                    );
                                    XLSX.utils.sheet_add_json(
                                        wb.Sheets["Inventory Report"],
                                        responseData, {
                                            origin: "A2",
                                            skipHeader: true,
                                            dateNF: 'dd"."mm"."yyyy',
                                        }
                                    );

                                    break;
                                    //ITEM GROUP BY report
                                case 11:
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets["Group By Quantity-item"],
                                        header[7]
                                    );
                                    XLSX.utils.sheet_add_json(
                                        wb.Sheets["Group By Quantity-item"],
                                        responseData, {
                                            origin: "A2",
                                            skipHeader: true,
                                            dateNF: 'dd"."mm"."yyyy',
                                        }
                                    );
                                    break;
                                    //Full Bottles
                                case 12:
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets["Group By Quantity-item"],
                                        header[8], {
                                            origin: "J1",
                                        }
                                    );
                                    XLSX.utils.sheet_add_json(
                                        wb.Sheets["Group By Quantity-item"],
                                        responseData, {
                                            origin: "J2",
                                            skipHeader: true,
                                            dateNF: 'dd"."mm"."yyyy',
                                        }
                                    );
                                    break;
                                    //Discount Report
                                case 13:
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets["Discount Report"],
                                        header[9]
                                    );

                                    XLSX.utils.sheet_add_json(
                                        wb.Sheets["Discount Report"],
                                        responseData, {
                                            origin: "A2",
                                            skipHeader: true,
                                            dateNF: 'dd"."mm"."yyyy',
                                        }
                                    );
                                case 14:
                                    let totalCoverCharge = responseData.map(item => JSON.parse(item.activity_inline_data).paid_amount || 0).reduce((prev, curr) => Number(prev) + Number(curr), 0);
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets["Summary"],
                                        header[10],
                                        { origin: "D31" }
                                    );
                                    XLSX.utils.sheet_add_aoa(
                                        wb.Sheets.Summary,
                                        [[totalCoverCharge]], {
                                        origin: "D32",
                                        skipHeader: true,
                                        dateNF: 'dd"."mm"."yyyy',
                                    }
                                    );

                                    break;
                            }
                            XLSX.writeFile(
                                wb,
                                `${fileName}${SaleReportType}_${request.event_activity_id}_${start_date}_${end_date}.xlsx`, {
                                    cellDates: true,
                                    cellStyles: true,
                                    compression:true
                                }
                            );
                        }

                    })
                    .catch((err) => {
                        error = err;
                    });
            }
        }
        let path = `${fileName}${SaleReportType}_${request.event_activity_id}_${start_date}_${end_date}.xlsx`;

        request.email_receiver_name="";
        request.email_sender_name="greneOS";
        //request.email_id = request.email_id;
        request.email_sender="support@greneos.com";
        
        const bucketName = await util.getS3BucketNameV1();
        const prefixPath = await util.getS3PrefixPath(request);
        const s3UploadUrlObj = await util.uploadReadableStreamToS3(request, {
            Bucket: bucketName,
            Key: `${prefixPath}/` + Date.now() + '.xlsx',
            Body: fs.createReadStream(path),
            ContentType: 'application/pdf',
            ACL: 'public-read'
        }, path);
        request.attachment = s3UploadUrlObj.Location

        util.sendEmailV3(request,
            request.email,
            "Summary Report",
            "greneOS",
            "<html></html>",
            (err, data) => {
                if (err) {
                    //global.logger.write('conLog', "[Send Email On Form Submission | Error]: ", {}, {});
                    //global.logger.write('conLog', err, {}, {});
                    util.logError(request,`sendEmailV3 conLog [Send Email On Form Submission | Error]: %j`, { err, request });
                } else {
                    //global.logger.write('conLog', "[Send Email On Form Submission | Response]: " + "Email Sent", {}, {});
                    //global.logger.write('conLog', data, {}, {});
                    util.logInfo(request,`sendEmailV3 conLog [Send Email On Form Submission | Response]: Email Sent %j`,{data, request});
                }                        
            });
        if(process.env == 'pamProd') {
            util.sendEmailV3(request,
                "accounts@puddingandmink.com",
                "Summary Report",
                "greneOS",
                "<html></html>",
                (err, data) => {
                    if (err) {
                        //global.logger.write('conLog', "[Send Email On Form Submission | Error]: ", {}, {});
                        //global.logger.write('conLog', err, {}, {});
                        util.logError(request,`sendEmailV3 conLog [Send Email On Form Submission | Error]: %j`, { err, request });
                    } else {
                        //global.logger.write('conLog', "[Send Email On Form Submission | Response]: " + "Email Sent", {}, {});
                        //global.logger.write('conLog', data, {}, {});
                        util.logInfo(request,`sendEmailV3 conLog [Send Email On Form Submission | Response]: Email Sent %j`,{data, request});
                    }                        
            });
        }
    
        return [error, []];

    };    
    //PAM Workforce Aseet Type Mapping Insert
    this.addPamWorkforceAssetTypeMapping = async (request) => {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.asset_type_name,
            request.asset_type_description,
            request.asset_type_category_id,
            request.asset_type_level_id,
            request.asset_type_flag_organization_specific,
            request.asset_type_flag_enable_approval,
            request.asset_type_approval_max_levels,
            request.asset_type_approval_wait_duration,
            request.asset_type_approval_activity_type_id,
            request.asset_type_approval_activity_type_name,
            request.asset_type_approval_origin_form_id,
            request.asset_type_approval_field_id,
            request.asset_type_attendance_type_id,
            request.asset_type_attendance_type_name,
            request.asset_type_flag_enable_suspension,
            request.asset_type_suspension_activity_type_id,
            request.asset_type_suspension_activity_type_name,
            request.asset_type_suspension_wait_duration,
            request.asset_type_flag_hide_organization_details,
            request.asset_type_flag_enable_send_sms,
            request.asset_type_flag_form_access,
            request.asset_type_flag_email_login,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
            );
        let queryString = util.getQueryString('ds_p1_3_workforce_asset_type_mapping_insert', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }        
        return [error, responseData];
    };
    //PAM workforce Asset Type Mapping Delete
    this.removePamWorkforceAssetTypeMapping = async (request) => {
        let responseData = [],
        error = true;
    const paramsArr = new Array(
        request.asset_type_id,
        request.workforce_id,
        request.account_id,
        request.organization_id,
        util.getCurrentUTCTime(),
        request.log_asset_id
    );
    const queryString = util.getQueryString('ds_p1_workforce_asset_type_mapping_delete', paramsArr);
    if (queryString !== '') {
        await db.executeQueryPromise(0, queryString, request)
            .then((data) => {
                responseData = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            })
    }
    return [error, responseData];
    };
    //PAM WorkforceAssetTypeMapping updating
    this.updatePamWorkforceAssetTypeMapping = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
            request.asset_type_id,
            request.asset_type_name,
            request.asset_type_flag_enable_approval,
            request.asset_type_approval_max_levels,
            request.asset_type_approval_wait_duration,
            request.asset_type_approval_activity_type_id,
            request.asset_type_approval_activity_type_name,
            request.asset_type_approval_origin_form_id,
            request.asset_type_approval_field_id,
            request.asset_type_attendance_type_id,
            request.asset_type_attendance_type_name,
            request.asset_type_flag_enable_suspension,
            request.asset_type_suspension_activity_type_id,
            request.asset_type_suspension_activity_type_name,
            request.asset_type_suspension_wait_duration,
            request.asset_type_flag_hide_organization_details,
            request.asset_type_flag_sip_enabled,
            request.asset_type_flag_enable_send_sms,
            request.asset_type_flag_sip_admin_access,
            request.asset_type_flag_frontline,
            request.asset_type_flag_email_login ,
            request.asset_type_flag_form_access,
            request.organization_id,
            request.flag,
            util.getCurrentUTCTime(),
            request.log_asset_id,
        );
        const queryString = util.getQueryString('ds_p5_workforce_asset_type_mapping_update', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };
    //Get Pam Module Master Details
    this.getPamModuleMaster = async (request) => {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.start_from,
            request.limit_value 
            );
        let queryString = util.getQueryString('ds_p1_pam_module_master_select', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }        
        return [error, responseData];
    };
    this.getPamRoleMappingLogState=async (request)=>{
        let responseData = [],
        error = true;
    let paramsArr = new Array(
        request.organization_id
    );
    let queryString = util.getQueryString('pm_pam_module_role_mapping_get_log_state', paramsArr);
    if (queryString != '') {
        await db.executeQueryPromise(1, queryString, request)
            .then((data) => {
                responseData = data;
                console.log(responseData,'responseData');
                error = false;
            })
            .catch((err) => {
                error = err;
            })
    }        
    return [error, responseData];
    };
     this.updatePamRoleModuleMappingLogState=async (request)=>{
        let responseData = [],
        error = true;
    let paramsArr = new Array(
        request.module_id_asset_type_id,
        request.organization_id,
        util.getCurrentUTCTime()
    );
    let queryString = util.getQueryString('pm_pam_module_role_mapping_update_log_state', paramsArr);
    if (queryString != '') {
        await db.executeQueryPromise(0, queryString, request)
            .then((data) => {
                responseData = data;
                console.log(responseData,'responseData');
                error = false;
            })
            .catch((err) => {
                error = err;
            })
    }        
    return [error, responseData];
    };
    //PAM Module Role Mapping Insert
    this.addRoleModulMapping = async (request) => {
        let responseData = [],
            error = true;
            let [errr, LogState] = await self.getPamRoleMappingLogState(request);
            if(LogState.length>0){
             let [errrr, updatelogstate] = await self.updatePamRoleModuleMappingLogState(request);
            }
        let paramsArr = new Array(
            request.module_id_asset_type_id ,
            request.account_id,
            request.organization_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
            );
        let queryString = util.getQueryString('pm_pam_module_role_mapping_multiple_insert', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }     
      
        return [error, responseData];
    };
     //Get PAM Role Module Mapping Details 
     this.getPamRoleModuleMapping = async function (request) {
        let responseData = [],
        error = true;     
    let paramsArr = new Array(
        request.module_id ,
        request.asset_type_id,
        request.asset_type_category_id,
        request.account_id,
        request.organization_id,
        1,
        1
        );
    let queryString = util.getQueryString('pm_pam_module_role_mapping_select', paramsArr);
    if (queryString != '') {
        await db.executeQueryPromise(1, queryString, request)
            .then(async(data) => {
                responseData = data;
                let [err, LogState] = await self.getPamRoleMappingLogState(request);
                responseData.push(LogState);
                error = false;
            })
            .catch((err) => {
                error = err;
            })
    }        
    responseData=responseData.flat();
    return [error,responseData];
    };
    //remove PAM Role Module Mapping Details
    this.removePamRoleModuleMapping =async function (request) {
        let responseData = [],
        error = true;
    let paramsArr = new Array(
        request.module_id_asset_type_id ,
        request.organization_id,
        request.log_asset_id,
        util.getCurrentUTCTime()
        );
    let queryString = util.getQueryString('pm_pam_module_role_mapping_multiple_delete', paramsArr);
    if (queryString != '') {
        await db.executeQueryPromise(0, queryString, request)
            .then((data) => {
                responseData = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            })
    }        
    return [error, responseData];
    };
      this.getPamOrderReportSummary =async function (request) {
        let responseData = [],
        error = true;
    let paramsArr = new Array(
        request.start_date,
        request.end_date,
        request.flag,
        request.type_flag
        );
    let queryString = util.getQueryString('pm_v1_pam_order_list_select_report_summary', paramsArr);
    if (queryString != '') {
        await db.executeQueryPromise(1, queryString, request)
            .then((data) => {
                responseData = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            })
    }        
    return [error, responseData];
    };
     this.PamAnalyticsReporteChecks = async (request) => {
       util.logInfo(request, `PamAnalyticsReporteChecks::START:::::`);
       if (!request.email) {
         return [true, []];
       }
       const timeStamp = util.getTimestamp();
       let responseData = [],
         error = true;
       let fileName = "";
       let SaleReportType = "";
       let start_date = "";
       let end_date = "";
       // //HANDLE THE PATHS in STAGING and PREPROD AND PRODUCTION
       switch (global.mode) {
         case "staging":
           fileName = "/apistaging-data/";
           break;
         case "preprod":
           fileName = "/data/";
           break;
         case "prod":
           fileName = "/api-data/";
           break;
         default:
           fileName = "/api-data/";
           break;
       }
       for (let i = 1; i <= 8; i++) {
         let paramsArr = new Array(
           request.start_date,
           request.end_date,
           (request.flag = i),
           request.type_flag
         );
         let queryString = util.getQueryString(
           "pm_v1_pam_order_list_select_report_summary",
           paramsArr
         );
         if (queryString != "") {
           await db
             .executeQueryPromise(1, queryString, request)
             .then(async (data) => {
               responseData = data;
               error = false;
               // monthly and daily checks
               util.logInfo(
                 request.type_flag,
                 `DailyAnalyticsReport AND MonthlyAnalyticsReport CHECK:::`
               );
               if (request.type_flag == 1) {
                 SaleReportType = "DailyAnalyticsReport";
                 start_date = timeStamp;
                 end_date = request.end_date.split(" ")[0];
               } else {
                 (SaleReportType = "MonthlyAnalyticsReport"),
                   (start_date = timeStamp);
                 end_date = request.start_date.split(" ")[0];
               }
               fs.stat(
                 `${fileName}${SaleReportType}_${start_date}_${end_date}.xlsx`,
                 function (err, stat) {
                   if (err == null) {
                     let wb = XLSX.readFile(
                       `${fileName}${SaleReportType}_${start_date}_${end_date}.xlsx`,
                       {
                         cellText: false,
                         cellDates: true,
                         cellStyles: true,
                       }
                     );
                     salesReoprt(wb, responseData);
                   } else if (err.code === "ENOENT") {
                     let nwb = XLSX.utils.book_new();
                     let ws_name = [
                       "FinancialReporting",
                       "CountofmembersDayMonthwise",
                       "MembersListByVisit",
                       "TotalBillingamount",
                       "Listoftopsolditems",
                       "NoofOrdersByTime",
                       "AverageServedDatetime",
                       "AveragePreparationDatetime",
                     ];
                     /* make worksheet */
                     for (let i = 0; i < ws_name.length; i++) {
                       let ws_data = [[""]];
                       let ws = XLSX.utils.aoa_to_sheet(ws_data);
                       /* Add the worksheet to the workbook */
                       XLSX.utils.book_append_sheet(nwb, ws, ws_name[i]);
                     }
                     XLSX.writeFile(
                       nwb,
                       `${fileName}${SaleReportType}_${start_date}_${end_date}.xlsx`,
                       {
                         cellStyles: true,
                       }
                     );
                     let wb = XLSX.readFile(
                       `${fileName}${SaleReportType}_${start_date}_${end_date}.xlsx`,
                       {
                         cellText: false,
                         cellDates: true,
                         cellStyles: true,
                       }
                     );
                     salesReoprt(wb, responseData);
                   } else {
                     console.log("Some other error: ", err.code);
                   }
                 }
               );
               function salesReoprt(wb, responseData) {
                 util.logInfo(i, `Checking Flag:::`);
                 switch (i) {
                   //Financial Reporting
                   case 1:
                     XLSX.utils.sheet_add_json(
                       wb.Sheets["FinancialReporting"],
                       responseData,
                       {
                         dateNF: 'd"."mm"."yyyy',
                       }
                     );
                     break;
                   //Count of members Day & Month wise
                   case 2:
                     XLSX.utils.sheet_add_json(
                       wb.Sheets["CountofmembersDayMonthwise"],
                       responseData,
                       {
                         dateNF: 'd"."mm"."yyyy',
                       }
                     );
                     break;
                   //List of members who visited more than once in the given time period
                   case 3:
                     XLSX.utils.sheet_add_json(
                       wb.Sheets["MembersListByVisit"],
                       responseData,
                       {
                         dateNF: 'd"."mm"."yyyy',
                       }
                     );
                     break;
                   //Total Billing amount/ Total No of Orders
                   case 4:
                     XLSX.utils.sheet_add_json(
                       wb.Sheets["TotalBillingamount"],
                       responseData,
                       {
                         dateNF: 'd"."mm"."yyyy',
                       }
                     );
                     break;
                   //List of top sold items under food and Liquor separately.
                   case 5:
                     XLSX.utils.sheet_add_json(
                       wb.Sheets["Listoftopsolditems"],
                       responseData,
                       {
                         dateNF: 'd"."mm"."yyyy',
                       }
                     );
                     break;
                   //No of Orders in the given time period
                   case 6:
                     XLSX.utils.sheet_add_json(
                       wb.Sheets["NoofOrdersByTime"],
                       responseData,
                       {
                         dateNF: 'd"."mm"."yyyy',
                       }
                     );
                     break;
                   //Average of difference between Ordered time and Served Datetime
                   case 7:
                     XLSX.utils.sheet_add_json(
                       wb.Sheets["AverageServedDatetime"],
                       responseData,
                       {
                         dateNF: 'd"."mm"."yyyy',
                       }
                     );
                     break;
                   //Average of difference between Ordered time and preparation started time
                   case 8:
                     XLSX.utils.sheet_add_json(
                       wb.Sheets["AveragePreparationDatetime"],
                       responseData,
                       {
                         dateNF: 'd"."mm"."yyyy',
                       }
                     );
                     break;
                 }
                 XLSX.writeFile(
                   wb,
                   `${fileName}${SaleReportType}_${start_date}_${end_date}.xlsx`,
                   {
                     cellDates: true,
                     cellStyles: true,
                   }
                 );
               }
             })
             .catch((err) => {
               error = err;
             });
         }
       }
       let path = `${fileName}${SaleReportType}_${start_date}_${end_date}.xlsx`;
       request.attachment = path;
       request.sendRegularEmail = 1;
       request.email_receiver_name = "";
       request.email_sender_name = "greneOS";
       //request.email_id = request.email_id;
       request.email_sender = "support@greneos.com";

       util.sendEmailV3(
         request,
         request.email,
         "Analytics Report",
         "greneOS",
         "<html></html>",
         (err, data) => {
           if (err) {
            //  global.logger.write(
            //    "conLog",
            //    "[Send Email On Form Submission | Error]: ",
            //    {},
            //    {}
            //  );
            //  global.logger.write("conLog", err, {}, {});
             util.logError(request,`sendEmailV3 conLog [Send Email On Form Submission | Error]: %j`, { err, request });
           } else {
            //  global.logger.write(
            //    "conLog",
            //    "[Send Email On Form Submission | Response]: " + "Email Sent",
            //    {},
            //    {}
            //  );
            //  global.logger.write("conLog", data, {}, {});
             util.logInfo(request,`sendEmailV3 conLog [Send Email On Form Submission | Response]: Email Sent %j`,{data, request});
           }
         }
       );
       if (process.env == "pamProd") {
         util.sendEmailV3(
           request,
           "parameshwar@grenerobotics.com",
           "Analytics Report",
           "greneOS",
           "<html></html>",
           (err, data) => {
             if (err) {
            //    global.logger.write(
            //      "conLog",
            //      "[Send Email On Form Submission | Error]: ",
            //      {},
            //      {}
            //    );
            //    global.logger.write("conLog", err, {}, {});
               util.logError(request,`sendEmailV3 conLog [Send Email On Form Submission | Error]: %j`, { err, request });
             } else {
            //    global.logger.write(
            //      "conLog",
            //      "[Send Email On Form Submission | Response]: " + "Email Sent",
            //      {},
            //      {}
            //    );
            //    global.logger.write("conLog", data, {}, {});
               util.logInfo(request,`sendEmailV3 conLog [Send Email On Form Submission | Response]: Email Sent %j`,{data, request});
             }
           }
         );
       }
       return [error, []];
     };
     this.discountPromotionCodeAdd = async function (request) {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.promo_code,
            request.promo_title,
            request.promo_description,
            request.discount_maximum_value,
            request.promo_minimum_bill,
            request.promo_start_datetime,
            request.promo_end_datetime,
            request.promo_level_id,
            request.promo_value,
            request.promo_code_image_url,
            request.discount_type_id,
            request.discount_type_name,
            request.discountable_menu_items,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.log_asset_id,
            request.log_operating_asset_first_name,
            request.log_datetime = util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('pm_v1_discount_promotion_code_insert', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };
    this.updateMinimumCountAssetlist = async function (request) {
        let responseData = [],
            error = true;
        let [error1, responseData1] = await self.assetInlineDataGetUserprofile(request, request.asset_id);
        let data = JSON.parse(responseData1[0].asset_inline_data);
        data.asset_storage_limit = request.asset_storage_limit;
        data = JSON.stringify(data);
        let [err, res] = await self.coverInlineAlterV1(request, request.asset_id, data);
        let paramsArr = new Array(
            request.organization_id,
            request.asset_id,
            request.asset_storage_limit,
            request.log_asset_id,
            request.log_datetime = util.getCurrentUTCTime(),
        );
        let queryString = util.getQueryString('pm_v1_asset_list_update_minimum_count', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };
    this.getInventoryCurrentQuantity = async function (request) {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.activity_type_category_id,
            request.asset_type_category_id,
            request.asset_first_name
        );
        let queryString = util.getQueryString('pm_v1_inventory_current_quantity_select', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };
    this.getMinimumCountAssetlist = async function (request) {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.asset_type_category_id
        );
        let queryString = util.getQueryString('pm_v1_asset_list_select_minimum_count', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    let [err, res] = await this.getInventoryCurrentQuantity(request);
                    res.filter(function (objectOne) {
                        return data.some(function (objectTwo) {
                            if (objectOne.asset_id === objectTwo.asset_id) {
                                if (objectOne.count < objectTwo.asset_storage_limit) {
                                    return responseData = [...responseData, objectOne]
                                }
                            }
                        });
                    });
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };
    this.productWiseSale = async function (request) {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.event_activity_id,
            request.start_date,
            request.end_date,
            request.flag = 7,
            request.type_flag
        );
        let queryString = util.getQueryString('pm_v2_pam_order_list_select_event_summary', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    let result = [];
                    data.forEach(function (a) {
                        if (!this[a.order_name]) {
                            this[a.order_name] = { item_name: a.order_name, item_count: 0 };
                            result.push(this[a.order_name]);
                        }
                        this[a.order_name].item_count += a.order_quantity;
                    }, Object.create(null));
                    responseData = result;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };

    this.setChefRecommendedMenu = async function (request) {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.recommend_flag,
            request.asset_id,
            util.getCurrentUTCTime()
        );
        let queryString = util.getQueryString('pm_v1_activity_list_update_chef_recommended', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    };
    this.pamEditProfileWithPhoneNumber = async (request) => {
        let err = true, response = [];
        try {
            let asset = await self.assetListSelectPhoneNumber(request);
            if (asset.length !== 0) {
                let [error, responseData] = await self.assetInlineDataUpdateUserProfile(request, asset[0].asset_id);
                err = false;
                return [error, responseData];
            }
            else {
                return [err, -9995];
            }
        } catch (error) {

            return [err, -9999];
        }
    };
    this.pamGetProfileWithPhoneNumber = async (request) => {
        let err = true, response = [];
        try {
            let asset = await self.assetListSelectPhoneNumber(request);
            if (asset.length !== 0) {
                let [error, responseData] = await self.assetInlineDataGetUserprofile(request, asset[0].asset_id);
                err = false;
                return [error, responseData];
            }
            else {
                return [err, -9995];
            }
        } catch (error) {
            return [err, -9999];
        }
    };
    this.assetInlineDataUpdateUserProfile = async function (request, asset_id) {
        let responseData = [],
            error = true;
            let paramsArr = new Array(
                asset_id,
                request.organization_id,
                request.asset_inline_data,
                request.log_asset_id,
                util.getCurrentUTCTime(),                
            );
            const queryString = util.getQueryString('ds_p1_1_asset_list_update_inline_data', paramsArr);
            if (queryString !== '') {
                await db.executeQueryPromise(0, queryString, request)
                    .then((data) => {
                        responseData = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    });
            }
        return [error, responseData];
    };
    this.assetInlineDataGetUserprofile = async function (request, asset_id) {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.organization_id,
            asset_id,
        );
        const queryString = util.getQueryString('pm_asset_inline_data_select_user_profile', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };
    this.assetAddRatingAndCommentToMenu = async function (request) {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.activity_id,
            request.activity_type_category_id,
            request.comments,
            request.rating,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('pm_activity_asset_mapping_update_ratings_comment', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };
    this.pamOrderListGetSelectDetailes = async function (request) {
        /* flag = 1 => Rating based on each menu item
         flag = 2 => My orders history
         flag = 3 => filter by status: all, in process, completed, cancelled
         flag = 4 => search in orders 
         flag = 5 => Order Based on Reservation
         */
        let responseData = [],
            error = true;
        try {
            let asset = await self.assetListSelectPhoneNumber(request);
            if (asset.length !== 0) {
                let paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    asset[0].asset_id,
                    request.start_date,
                    request.end_date,
                    request.name,
                    request.flag || 1,
                    request.type ,
                    request.activity_status_type_id,
                    request.start_from || 0,
                    request.limit_value
                );
                const queryString = util.getQueryString('pm_pam_order_list_get_select_details', paramsArr);
                if (queryString !== '') {
                    await db.executeQueryPromise(1, queryString, request)
                        .then(async (data) => {
                            responseData = data;
                            if (request.flag == 5) {
                                for (i = 0; i < data.length; i++) {
                                    let [errr, ResData] = await this.getOrdersV1(request, data[i].activity_id);
                                    data[i]['reservationOrder'] = ResData;
                                }
                            }
                            error = false;
                        })
                        .catch((err) => {
                            error = err;
                        });
                }
                return [error, responseData];
            }
            else {
                return [err, -9995];
            }
        } catch (error) {
            return [err, -9999];
        }
    };  
    this.coverInlineAlterV1 = async function (request, target_asset_id, data) {
        let responseData = [],
            error = true;
        let dateTimeLog = util.getCurrentUTCTime();
        request['datetime_log'] = dateTimeLog;
        let paramsArr = new Array(
            target_asset_id,
            request.organization_id,
            request.asset_first_name,
            request.asset_description,
            data,
            request.asset_id,
            request.datetime_log
        );
        let queryString = util.getQueryString('ds_v1_asset_list_update_cover_inline_data', paramsArr);
        if (queryString != '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    pamAssetListHistoryInsert(request, 221, target_asset_id).then(() => { });
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, {}];
    };
    this.notifyVendor=  function (request) {
        let responseData = [],
            error = true;
            let paramsArr = new Array(
                request.vendor_id,
                request.vendor_name,
                request.ingredient_id   ,
                request.ingredeint_name,
                request.ingredeint_unit ,
                request.quantity,
                request.vendor_phone_number ,
                request.vendor_email
            );
            error=false;
        return [error, responseData];
    };
    this.addPamAsset = async (request) => {
        let phoneNumber;
        let countryCode;
        (err = true), (responseData = -9999);

        try {
            let assetData = await self.assetListSelectPhoneNumber(request);
            if (assetData.length > 0) {
                request.member_asset_id = assetData[0].asset_id;
                request.asset_first_name = assetData[0].asset_first_name;
                phoneNumber = util.cleanPhoneNumber(assetData[0].asset_phone_number);
                countryCode = util.cleanPhoneNumber(assetData[0].asset_phone_country_code);
            } else {
                const [assetTypeError, assetType] = await self.workforceAssetTypeMappingSelectCategoryAsync(request, 30);
                // create the asset
                request.asset_first_name = request.asset_first_name;
                request.asset_last_name = "";
                request.asset_description = "";
                request.customer_unique_id = 0;
                request.asset_profile_picture = "";
                request.asset_inline_data = '{}';
                request.phone_country_code = request.country_code;
                request.asset_phone_number = request.phone_number;
                request.asset_email_id = "";
                request.asset_timezone_id = 0;
                request.asset_type_id = assetType[0].asset_type_id;
                request.asset_type_category_id = 30;
                request.asset_type_name = "Member";
                request.operating_asset_id = 0;
                request.manager_asset_id = 0;
                request.code = "";
                request.enc_token = "";
                request.is_member = 1;
                request.invite_sent = 0;
                request.discount_percent = 0;
                request.asset_id = '0'

                phoneNumber = await util.cleanPhoneNumber(request.asset_phone_number);
                countryCode = await util.cleanPhoneNumber(request.phone_country_code);
                const [error,newAssetData] = await self.addAssetPamSubfnV1(request);
                console.log(newAssetData)
                if(newAssetData.length>0){
                    request.member_asset_id = newAssetData[0].asset_id
                }
            }
            console.log("phoneNumber", phoneNumber);
            console.log("countryCode", countryCode);
            await self.updateAssetPasscode(request, request.member_asset_id, countryCode, phoneNumber);
            responseData = {},
                err = false;

        } catch (e) {
            console.log(e);
        }
        return [err, responseData];
    }
    this.verifyPhoneNumber = async (request) => {
        (err = true), (responseData = -9999);
        
        try {
            let assetData = await self.assetListSelectPhoneNumber(request);
            if(assetData.length > 0){
                request.member_asset_id = assetData[0].asset_id;
                request.asset_first_name = assetData[0].asset_first_name ;
                request.asset_phone_number=assetData[0].asset_phone_number
            }

            let [e,passcode] = await self.selectAssetPasscode({
                asset_id: assetData[0].asset_id,
                asset_phone_number:assetData[0].asset_phone_number,
                asset_phone_country_code:assetData[0].asset_phone_country_code
            });
            
            if(passcode.length && passcode[0].asset_phone_passcode !==  request.passcode) {
                return [true, "Passcode is not matched"]
            }

            self.updateAssetPhoneVerified({
                asset_id : request.member_asset_id,
                asset_phone_number : request.asset_phone_number,
                workforce_id : request.workforce_id,
                account_id : request.account_id
            });

            return [false, assetData];


        } catch(e) {
            console.log("Error ", e, e.stack);
        
        }

        return [err, responseData];
    }
    this.updateAssetPhoneVerified = async function (request) {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.asset_id,
            request.asset_phone_number,
            request.workforce_id,
            request.account_id,
            1
        );
        const queryString = util.getQueryString('ds_p1_asset_list_update_phone_number_verified', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };
    this.selectAssetPasscode = async function (request) {
        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.asset_id,
            request.asset_phone_number,
            request.asset_phone_country_code
        );
        const queryString = util.getQueryString('ds_p1_asset_phone_passcode_select', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };
    this.updateAssetPasscode = async function (request,member_asset_id,countryCode,phoneNumber) {
        let responseData = [],
            error = true;
        let verificationCode = util.getVerificationCode();
        let pwdValidDatetime = util.addDays(util.getCurrentUTCTime(), 1);
        let paramsArr = new Array(
            member_asset_id,
            request.organization_id,
            verificationCode,
            pwdValidDatetime
        );
        let updateQueryString = util.getQueryString('ds_v1_asset_list_update_passcode', paramsArr);
        db.executeQuery(0, updateQueryString, request, function (err, data) {
            assetListHistoryInsert(request,member_asset_id, request.organization_id, 208, util.getCurrentUTCTime(), function (err, data) {
            error=false;
            responseData=data;
            
            });
        });

        await assetService.sendCallOrSmsV1(1, countryCode, phoneNumber, verificationCode, request);
        return [error, responseData];
    };

    this.getOrdersV1 = async (request,idReservation) => {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            idReservation,
            38,
            0,
            50
        )
        const queryString = util.getQueryString('pm_v1_activity_list_select_reservation_orders', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

};

module.exports = PamService;