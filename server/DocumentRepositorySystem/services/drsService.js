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

    this.updateDRSForTag = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.p_organization_id,
            request.p_document_repository_id,
            request.p_tag_id,
            request.p_log_asset_id,
            util.getCurrentUTCTime()
        ];
        const queryString = util.getQueryString('ds_p1_document_repository_list_update_tag', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    }

    this.selectDRSAsset = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.p_organization_id,
            request.p_activity_type_category_id,
            request.p_document_repository_id,
            request.p_repository_sub_type_id,
            request.p_asset_id,
            request.p_flag,
            request.p_start_from,
            request.p_limit_value
        ];
        const queryString = util.getQueryString('ds_p1_document_repository_asset_mapping_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    }

    this.selectDRSList = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.p_organization_id,
            request.p_activity_type_category_id,
            request.p_parent_repository_id,
            request.p_repository_sub_type_id,
            request.p_activity_type_id,
            request.p_flag,
            request.p_start_from,
            request.p_limit_value
        ];
        const queryString = util.getQueryString('ds_p1_document_repository_list_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    }

    this.selectDRSTypesAccessible = async (request) => {
        let responseData = [],
            error = true;
        let paramsArr = [
            request.p_organization_id,
            request.p_activity_type_category_id,
            request.p_document_repository_id,
            request.p_repository_sub_type_id,
            request.p_asset_id,
            1,
            request.p_start_from,
            request.p_limit_value
        ];
        const queryString = util.getQueryString('ds_p1_document_repository_asset_mapping_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    }

    this.dRSListSearch = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.p_organization_id,
            request.p_activity_type_category_id,
            request.p_document_repository_id,
            request.p_repository_sub_type_id,
            request.p_activity_type_id,
            request.p_tag_id,
            request.p_search_string,
            request.p_flag,
            request.p_start_from,
            request.p_limit_value
        ];
        const queryString = util.getQueryString('ds_p1_document_repository_list_search', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    }

    this.updateWorkforceAssetType = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.p_asset_type_id,
            request.p_asset_type_name,
            request.p_asset_type_flag_enable_approval,
            request.p_asset_type_approval_max_levels,
            request.p_asset_type_approval_wait_duration,
            request.p_asset_type_approval_activity_type_id,
            request.p_asset_type_approval_activity_type_name,
            request.p_asset_type_approval_origin_form_id,
            request.p_asset_type_approval_field_id,
            request.p_asset_type_attendance_type_id,
            request.p_asset_type_attendance_type_name,
            request.p_asset_type_flag_enable_suspension,
            request.p_asset_type_suspension_activity_type_id,
            request.p_asset_type_suspension_activity_type_name,
            request.p_asset_type_suspension_wait_duration,
            request.p_asset_type_flag_hide_organization_details,
            request.p_organization_id,
            request.p_flag,
            request.p_log_datetime,
            request.p_log_asset_id
        ];
        const queryString = util.getQueryString('ds_p2_workforce_asset_type_mapping_update', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    }

    this.updateAssetListSuspension = async (request) => {
        let responseData = [],
            error = true;
        let paramsArr = [
            request.p_asset_id,
            request.p_organization_id,
            request.p_asset_flag_suspended,
            request.p_asset_suspension_datetime,
            request.p_asset_suspension_activity_id,
            request.p_log_asset_id,
            util.getCurrentUTCTime()
        ];
        const queryString = util.getQueryString('ds_p1_asset_list_update_suspension', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    }

    this.selectAssetManager = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.p_organization_id,
            request.p_asset_id,
            request.p_manager_asset_id,
            request.p_flag,
            request.p_start_from,
            request.p_limit_value
        ];
        const queryString = util.getQueryString('ds_p2_asset_manager_mapping_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    }


}
module.exports = DrsService;