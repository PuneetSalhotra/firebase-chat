/*
 * author: Nani Kalyan V
 */

function BotService(objectCollection) {

    const queueWrapper = objectCollection.queueWrapper;
    const util = objectCollection.util;
    const db = objectCollection.db;
    const forEachAsync = objectCollection.forEachAsync;
    const activityPushService = objectCollection.activityPushService;
    const activityCommonService = objectCollection.activityCommonService;
    const cacheWrapper = objectCollection.cacheWrapper;
    
    
    this.getBotsMappedToActType = async (request) => {            
            let paramsArr = new Array(
                request.flag || 1, 
                request.organization_id, 
                request.account_id, 
                request.workforce_id, 
                request.activity_type_id, 
                request.field_id, 
                request.form_id, 
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );
            let queryString = util.getQueryString('ds_p1_bot_list_select', paramsArr);
            if (queryString != '') {                
                return await (db.executeQueryPromise(1, queryString, request));
            }
    };
    
    this.getBotworkflowSteps = async (request) => {        
            let paramsArr = new Array(                
                request.bot_id, 
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );
            let queryString = util.getQueryString('ds_p1_bot_operation_mapping_select', paramsArr);
            if (queryString != '') {
                return await (db.executeQueryPromise(1, queryString, request));                
            }        
    };
    
};


module.exports = BotService;
