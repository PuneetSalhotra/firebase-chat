const ActivityTimelineService = require("../../services/activityTimelineService.js");

function DrsService(objectCollection) {  
  const db = objectCollection.db;  
  const util = objectCollection.util;  

  const activityTimelineService = new ActivityTimelineService(objectCollection);

  this.updateAccessToDocRepo = async (request) => {
    let responseData = [],
        error = true;

    //p_asset_doc_repo_access_type_id
      //0 No access
      //1 Super Admin
      //2 Admin
      //3 Viewer

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
                        request.access_type_id,
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
            request.organization_id,
            request.document_repository_id,
            request.tag_id,
            request.asset_id,
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
    };


    this.selectDRSAsset = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.organization_id,
            request.activity_type_id,
            request.document_repository_id,
            request.repository_sub_type_id,
            request.asset_id,
            request.flag,
            request.page_start,
            request.page_limit
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
    };


    this.selectDRSList = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.organization_id,
            request.activity_type_category_id,
            request.parent_repository_id,
            request.repository_sub_type_id,
            request.activity_type_id,
            request.flag,
            request.page_start,
            request.page_limit
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
    };


    this.selectDRSTypesAccessible = async (request) => {
        let responseData = [],
            error = true;
        let paramsArr = [
            request.organization_id,
            request.activity_type_id,
            request.document_repository_id,
            request.repository_sub_type_id,
            request.asset_id,
            1,
            request.page_start,
            request.page_limit
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
    };


    this.dRSListSearch = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.organization_id,
            request.activity_type_category_id,
            request.document_repository_id,
            request.repository_sub_type_id,
            request.activity_type_id,
            request.tag_id,
            request.search_string,
            request.flag,
            request.page_start,
            request.page_limit
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
    };


    this.resetAccessToDocRepo = async (request) => {
      let responseData = [],
          error = true;

      const paramsArr = [
                          request.organization_id,
                          request.document_repository_id,
                          request.target_asset_id,
                          request.asset_id,
                          util.getCurrentUTCTime()
                        ];

      const queryString = util.getQueryString('ds_p1_document_repository_asset_mapping_update_reset', paramsArr);
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

    this.repositoryAccessMasterSelect = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.page_start,
            request.page_limit
        ];
        const queryString = util.getQueryString('ds_v1_common_document_repository_access_master_select', paramsArr);
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

    this.repositoryFileFolderDelete = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.organization_id,
            request.document_repository_id,
            request.asset_id,
            util.getCurrentUTCTime()
        ];
        const queryString = util.getQueryString('ds_p1_document_repository_list_delete', paramsArr);
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
    }

    //get all roles who have access to repository
    this.listOfAccessableRoles = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.activity_type_id,
            request.asset_type_id||"",
            request.level_id,
            request.flag,
            request.page_start,
            request.page_limit
        ];
        const queryString = util.getQueryString('ds_p1_activity_type_asset_type_mapping_select', paramsArr);
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