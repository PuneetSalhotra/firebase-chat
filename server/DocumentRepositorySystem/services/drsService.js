const ActivityTimelineService = require("../../services/activityTimelineService.js");

function DrsService(objectCollection) {  
  const db = objectCollection.db;  
  const util = objectCollection.util;  

  const activityTimelineService = new ActivityTimelineService(objectCollection);

  this.updateAccessToDocRepo = async (request) => {
    let responseData = [],
        error = true;

    const paramsArr = [
                        request.target_asset_id,
                        request.organization_id,
                        request.access_type_id,
                        request.asset_id,
                        util.getCurrentUTCTime()
                      ];

    const queryString = util.getQueryString('ds_v1_asset_list_update_doc_repo_access', paramsArr);
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

  
  //Service to share document repository to a specific role
  this.shareDRSToASpecificRole = async (request) => {
    let responseData = [],
        error = true;
    
    const paramsArr = [
                        request.activity_type_id,
                        request.asset_type_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,
                        request.asset_id,
                        util.getCurrentUTCTime()
                      ];

    const queryString = util.getQueryString('ds_p1_activity_type_asset_type_mapping_insert', paramsArr);
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

  
  //Service to remove sharing of a document repository to a specific role
  this.removeDRSToASpecificRole = async (request) => {
    let responseData = [],
        error = true;

    const paramsArr = [
                        request.organization_id,
                        request.activity_type_id,
                        request.asset_type_id,
                        3, //request.log_state,
                        request.asset_id,                        
                        util.getCurrentUTCTime()
                      ];

    const queryString = util.getQueryString('ds_p1_activity_type_asset_type_mapping_update_log_state', paramsArr);
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


  //Service to create a folder in document repository
  this.createFolder = async (request) => {
    let responseData = [],
        error = true;

    const paramsArr = [
                        request.document_repository_name,
                        request.document_repository_sub_type_id,
                        request.document_repository_sub_type_name,
                        request.document_repository_folder_url,
                        request.parent_document_repository_id,
                        request.activity_type_id,
                        request.tag_id,
                        request.asset_id,
                        request.workforce_id,
                        request.account_id,
                        request.organization_id,                        
                        request.asset_id,          
                        util.getCurrentUTCTime()
                      ];

    const queryString = util.getQueryString('ds_p1_document_repository_list_insert', paramsArr);
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

}
module.exports = DrsService;