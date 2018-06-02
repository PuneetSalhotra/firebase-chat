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
                            request.datetime_log
                            );
            queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_sub_type', paramsArr);
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
    
    

}
;
module.exports = PamUpdateService;
