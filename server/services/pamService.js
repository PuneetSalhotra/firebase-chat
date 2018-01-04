/*
 * author: Nani Kalyan V
 */

function PamService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
    //var cacheWrapper = objectCollection.cacheWrapper;
    //var activityCommonService = objectCollection.activityCommonService;

    this.identifyCaller = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.asset_type_category_id,
                request.phone_number,
                request.country_code
                );
        var queryString = util.getQueryString('ds_v1_asset_list_select_phone_number_category', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    //formatAssetCoverData(data, function (error, data) {
                      //  if (error === false)
                            callback(false, {data: data}, 200);
                    //});
                } else {
                    callback(false, {}, -3202);
                }
            });
        }
    };
    
    /*this.getNonMembersCallLog = function (request, callback) {
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
    };*/
    
    this.getCalledTime = function (request, callback) {
        var paramsArr = new Array(
                request.asset_id,
                request.organization_id,
                //request.account_id,
                request.date_start,
                request.date_end,
                request.call_received_datetime
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_before_event_start', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    //formatAssetCoverData(data, function (error, data) {
                      //  if (error === false)
                            callback(false, {response: 'true'}, 200);
                    //});
                } else {
                    callback(false, {response: 'false'}, 200);
                }
            });
        }
    };
    
    
    this.getReservationsCount = function (request, callback) {
        var paramsArr = new Array(
                request.asset_id,
                request.organization_id,
                request.event_activity_id
                );
        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_reservation_count', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data[0].reservation_count);
                    //formatAssetCoverData(data, function (error, data) {
                      //  if (error === false)
                      if(data[0].reservation_count >= 50){
                          util.sendSmsMvaayoo('Dear Customer, No reservation available at this moment. Please contact us again at '+ request.next_datetime, 
                          request.country_code, request.phone_number, function(err,res){});
                          callback(false, {response: 'false'}, 200);
                      } else {
                          callback(false, {response: 'true'}, 200);
                      }
                       //callback(false, {data: data}, 200);
                    //});
                } else {
                    callback(false, {}, 200);
                }
            });
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

}
;

module.exports = PamService;
