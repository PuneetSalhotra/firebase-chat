/*
 * author: Nani Kalyan V
 */

function PerformanceStatsService(objectCollection) {

    let db = objectCollection.db;
    let util = objectCollection.util;
    let forEachAsync = objectCollection.forEachAsync;
    let cacheWrapper = objectCollection.cacheWrapper;
    let queueWrapper = objectCollection.queueWrapper;
    let activityCommonService = objectCollection.activityCommonService;
          
    
    this.employeeProductivityReport = function(request, callback){
       let paramsArr = new Array(
                request.viewee_asset_id,
                request.viewee_operating_asset_id,
                request.viewee_workforce_id,
                request.account_id,
                request.organization_id,
                util.getStartDateTimeOfMonth(),
                util.getStartDateTimeOfMonth(),
                util.getEndDateTimeOfMonth(),
                //'2018-02-01 00:00:00',
                //'2018-02-01 00:00:00',
                //'2018-02-28 23:59:59',
                request.flag
                );
        let queryString = util.getQueryString('ds_p1_activity_asset_mapping_select_analytic_counts', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log('DAta : ', data);
                //global.logger.write('conLog', 'Data : ' + JSON.stringify(data, null, 2), {}, request);
                util.logInfo(request,`conLog Data : %j`,{Data : JSON.stringify(data, null, 2), request});
                if (err === false) {
                    if(data.length > 0){
                        callback(false, data);                                                
                    } else {
                      callback(false, '');
                    }
                } else {
                    callback(true, err);
                }
            });
        }       
   };
   
   this.tasksRespTime = function(request, callback){
       let paramsArr = new Array(
                request.viewee_asset_id,
                request.viewee_operating_asset_id,
                request.organization_id,
                request.monthly_summary_id,
                util.getStartDayOfMonth()
                );
        let queryString = util.getQueryString('ds_p1_asset_monthly_summary_transaction_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log('Data : ', data);
                //global.logger.write('conLog', 'Data : ' + JSON.stringify(data, null, 2), {}, request);
                util.logInfo(request,`conLog Data : %j`,{Data : JSON.stringify(data, null, 2), request});
                if (err === false) {
                    if(data.length > 0){
                        callback(false, data,200); 
                    } else {
                      callback(false, {}, 200);
                    }
                } else {
                    callback(true, err, -9999);
                }
            });
        }
   };
   
   //Task List Analytics
    this.updateCreatorRating = function(request, callback){
            //Calculate Rating
            let paramsArr = new Array(
                request.activity_id,
                request.creator_asset_id,
                request.organization_id,
                request.activity_rating_creator,
                request.asset_id,
                util.getCurrentUTCTime()            
                );
            let queryString = util.getQueryString('ds_p1_activity_list_update_rating_creator', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? callback(false, data, 200) : callback(true, err, -9999);
                });
            }        
    };
    
    this.updateLeadRating = function(request, callback){
            //Calculate Rating
            let paramsArr = new Array(
                request.activity_id,
                request.lead_asset_id,
                request.organization_id,
                request.activity_rating_lead,
                request.asset_id,
                util.getCurrentUTCTime()         
                );
            let queryString = util.getQueryString('ds_p1_activity_list_update_rating_lead', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? callback(false, data, 200) : callback(true, err, -9999);
                });
            }        
    };
    
    this.updateCollaboratorRating = function(request, callback){
            //Calculate Rating
            let paramsArr = new Array(
                request.activity_id,
                request.collaborator_asset_id,
                request.organization_id,
                request.activity_rating_collaborator,
                request.asset_id,
                util.getCurrentUTCTime()            
                );
            let queryString = util.getQueryString('ds_p1_activity_list_update_rating_collaborator', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? callback(false, data, 200) : callback(true, err, -9999);
                });
            }
    };
    
    this.retrieveInmailCnt = function(request, callback){
        let paramsArr = new Array(
                request.asset_id,
                request.operating_asset_id,
                request.organization_id,
                util.getStartDayOfPrevWeek(), //request.previous_week_date,
                util.getStartDayOfWeek(), //request.current_week_date,
                util.getStartDayOfPrevMonth(), //request.previous_month_date,
                util.getStartDayOfMonth() //request.current_month_date
                );
            let queryString = util.getQueryString('ds_p1_asset_montly_summary_transaction_select_inmail_counts', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? callback(false, data, 200) : callback(true, err, -9999);
                });
            }
    };
    
   
};

module.exports = PerformanceStatsService;
