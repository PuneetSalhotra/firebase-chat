/*
 * author: Sri Sai Venkatesh
 */
const AdminOpsService = require('../Administrator/services/adminOpsService');
const BotService = require('../botEngine/services/botService');
const elasticSearchService = require('../elasticSearch/services/elasticSearchService');

const logger = require('../logger/winstonLogger');

const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    hosts: [global.config.elastiSearchNode]
});

function ActivityConfigService(db,util,objCollection) {
    const adminOpsService = new AdminOpsService(objCollection);
    const botService = new BotService(objCollection);
    const activityCommonService = objCollection.activityCommonService;
    const cacheWrapper = objCollection.cacheWrapper;
    const elasticService = new elasticSearchService(objCollection);
    const self = this;

    this.getWorkforceActivityTypesList = function (request,callback) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_v1_workforce_activity_type_mapping_select',paramsArr);

        if(queryString != '') {
            db.executeQuery(1,queryString,request,function (err,data) {
                if(err === false) {
                    // got data now parse it..                    

                    formatActivityTypesList(data,function (err,data) {
                        if(err === false)
                            callback(false,{
                                data: data
                            },200);
                    });
                    //callback(false, data, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err,false,-9999);
                    return;
                }
            });
        }

    };

    this.getWorkforceActivityStatusList = function (request,callback) {

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_v1_workforce_activity_status_mapping_select',paramsArr);

        //console.log(queryString);
        if(queryString != '') {
            db.executeQuery(1,queryString,request,function (err,data) {
                if(err === false) {
                    // got data now parse it..                    

                    formatActivityStatusList(data,function (err,data) {
                        if(err === false)
                            callback(false,{
                                data: data
                            },200);
                    });
                    //callback(false, data, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err,false,-9999);
                    return;
                }
            });
        };
    };

    this.getActivityParticipantAccess = function (request,callback) {
        let productId = (request.hasOwnProperty('product_id')) ? request.product_id : 1;
        let paramsArr = new Array(
            request.page_start,
            util.replaceQueryLimit(request.page_limit),
            productId
        );
        let queryString = util.getQueryString('ds_v1_1_activity_participant_access_master_select',paramsArr);

        //console.log(queryString);
        if(queryString != '') {
            db.executeQuery(1,queryString,request,function (err,data) {
                if(err === false) {
                    // got data now parse it..                    
                    callback(false,{
                        data: data
                    },200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err,false,-9999);
                    return;
                }
            });
        };
    };

    let formatActivityTypesList = function (data,callback) {
        let responseData = new Array();
        data.forEach(function (rowData,index) {

            let rowDataArr = {
                'activity_type_id': util.replaceDefaultNumber(rowData['activity_type_id']),
                'activity_type_name': util.replaceDefaultString(rowData['activity_type_name']),
                'activity_type_category_id': util.replaceDefaultNumber(rowData['activity_type_category_id']),
                'activity_type_category_name': util.replaceDefaultString(rowData['activity_type_category_name']),
                'workforce_id': util.replaceDefaultNumber(rowData['workforce_id']),
                'workforce_name': util.replaceDefaultString(rowData['workforce_name']),
                'account_id': util.replaceDefaultNumber(rowData['account_id']),
                'account_name': util.replaceDefaultString(rowData['account_name']),
                'organization_id': util.replaceDefaultNumber(rowData['organization_id']),
                'organization_name': util.replaceDefaultString(rowData['organization_name']),
                'update_sequence_id': util.replaceDefaultNumber(rowData['update_sequence_id']),
                'log_state': util.replaceDefaultNumber(rowData['log_state']),
                'log_active': util.replaceDefaultNumber(rowData['log_active']),
                'log_datetime': util.replaceDefaultDatetime(rowData['log_datetime']),
                'log_asset_first_name': util.replaceDefaultString(rowData['log_asset_first_name']),
                'log_asset_last_name': util.replaceDefaultString(rowData['log_asset_last_name']),
                'log_asset_id': util.replaceDefaultNumber(rowData['log_asset_id']),
                'asset_id': util.replaceDefaultNumber(rowData['asset_id']),
                'asset_type_category_id': util.replaceDefaultNumber(rowData['asset_type_category_id'])
            };
            responseData.push(rowDataArr);
        },this);
        callback(false,responseData);

    };

    let formatActivityStatusList = function (data,callback) {
        let responseData = new Array();
        if(Object.prototype.toString.call(data[0]) === '[object Array]' || Object.prototype.toString.call(data[0]) === '[object Object]') {
            data.forEach(function (rowData,index) {
                let rowDataArr = {
                    "activity_status_id": util.replaceDefaultNumber(rowData['activity_status_id']),
                    "activity_status_name": util.replaceDefaultString(rowData['activity_status_name']),
                    "activity_status_type_id": util.replaceDefaultNumber(rowData['activity_status_type_id']),
                    "activity_status_type_name": util.replaceDefaultString(rowData['activity_status_type_name']),
                    "activity_status_type_category_id": util.replaceDefaultNumber(rowData['activity_status_type_category_id']),
                    "activity_status_type_category_name": util.replaceDefaultString(rowData['activity_status_type_category_name']),
                    "activity_type_id": util.replaceDefaultNumber(rowData['activity_type_id']),
                    "activity_type_name": util.replaceDefaultString(rowData['activity_type_name']),
                    "activity_type_category_id": util.replaceDefaultNumber(rowData['activity_type_category_id']),
                    "activity_type_category_name": util.replaceDefaultString(rowData['activity_type_category_name']),
                    "workforce_id": util.replaceDefaultNumber(rowData['workforce_id']),
                    "workforce_name": util.replaceDefaultString(rowData['workforce_name']),
                    "account_id": util.replaceDefaultNumber(rowData['account_id']),
                    "account_name": util.replaceDefaultString(rowData['account_name']),
                    "organization_id": util.replaceDefaultNumber(rowData['organization_id']),
                    "organization_name": util.replaceDefaultString(rowData['organization_name']),
                    "update_sequence_id": util.replaceDefaultNumber(rowData['update_sequence_id']),
                    "log_asset_id": util.replaceDefaultNumber(rowData['log_asset_id']),
                    'log_asset_first_name': util.replaceDefaultString(rowData['log_asset_first_name']),
                    'log_asset_last_name': util.replaceDefaultString(rowData['log_asset_last_name']),
                    "log_datetime": util.replaceDefaultDatetime(rowData['log_datetime']),
                    "log_state": util.replaceDefaultNumber(rowData['log_state']),
                    "log_active": util.replaceDefaultNumber(rowData['log_active'])

                };
                responseData.push(rowDataArr);
            },this);
        }
        callback(false,responseData);
    };

    this.workForceActivityTypeInsert = (request) => {
        return new Promise((resolve,reject) => {
            const paramsArr = new Array(
                request.activity_type_name,
                request.activity_type_description,
                request.activity_type_category_id,
                request.access_level_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.asset_id,
                request.datetime_log || util.getCurrentUTCTime(),
                request.activity_type_flag_control_visibility || 0,
                request.duration,
                request.activity_type_inline_data||'{}'
            );
            //var queryString = util.getQueryString('ds_p1_1_workforce_activity_type_mapping_insert', paramsArr);
            const queryString = util.getQueryString('ds_p1_4_workforce_activity_type_mapping_insert',paramsArr);
            if(queryString != '') {
                db.executeQuery(0,queryString,request,function (err,data) {
                    if(err === false) {
                        request['activity_type_id'] = data[0].activity_type_id;
                        request['update_type_id'] = 0;
                        workForceActivityTypeHistoryInsert(request).then(() => {});

                        self.workforceActivityTypeMappingUpdateTag(request);

                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.workForceActivityTypeUpdate = (request) => {
        return new Promise((resolve,reject) => {
            const paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_type_id,
                request.activity_type_name,
                request.activity_type_description,
                request.access_level_id,
                request.asset_id,
                request.datetime_log,
                request.activity_type_flag_control_visibility || 0,
                request.activity_type_inline_data || '{}'
            );
            //var queryString = util.getQueryString('ds_p1_1_workforce_activity_type_mapping_update', paramsArr);
            const queryString = util.getQueryString('ds_p1_4_workforce_activity_type_mapping_update',paramsArr);
            if(queryString != '') {
                db.executeQuery(0,queryString,request,async (err,data) => {
                    if(err === false) {
                        // Update the default workflow duration as well
                        try {
                            await adminOpsService.updateActivityTypeDefaultDuration(request);
                        } catch(error) {
                            console.log("[ERROR] workForceActivityTypeUpdate | updateActivityTypeDefaultDuration: ",error);
                        }
                        //update the activity_type_flag_control_visibility
                        try {
                            await activityListUpdateVisibilityFlag(request);
                            await activityAssetUpdateVisibilityFlag(request);
                        } catch(error) {
                            console.log("[ERROR] workForceActivityTypeUpdate | updateActivityTypeDefaultDuration: ",error);
                        }
                        //update the activity_type_name
                        try{
                            const paramsArr1 = new Array(
                                request.organization_id,
                                request.account_id,
                                request.workforce_id,
                                request.activity_type_id,
                                request.activity_type_name,
                               
                                request.asset_id,
                                request.datetime_log,
                                
                            );
                            const queryString1 = util.getQueryString('ds_p1_workforce_activity_type_name_update',paramsArr1);
                            if(queryString1 != '') {
                                db.executeQuery(0,queryString1,request,async (err,data) => {
                                    if(err){
                                        reject(err)
                                    }
                                })
                            }
                        } catch(error){
                         console.log("[ERROR] update name")
                        }

                        try {
                            if(request.tag_id && Number(request.tag_id) >= 0) {
                                try {
                                    self.workforceActivityTypeMappingUpdateTag(request);
                                } catch(error) {
                                    console.log("workForceActivityTypeUpdate | workforceActivityTypeMappingUpdateTag | Error: ",error);
                                }
                            }
                        } catch(error) {
                            console.log("[ERROR] workForceActivityTypeUpdate | updateActivityTypeDefaultDuration: ",error);
                        }
                        request['update_type_id'] = 901;
                        workForceActivityTypeHistoryInsert(request).then(() => {});
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.workForceActivityTypeDelete = function (request) {
        return new Promise((resolve,reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_type_id,
                request.asset_id,
                request.datetime_log
            );
            let queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_delete',paramsArr);
            if(queryString != '') {
                db.executeQuery(0,queryString,request,function (err,data) {
                    if(err === false) {
                        request['update_type_id'] = 902;
                        workForceActivityTypeHistoryInsert(request).then(() => {});
                        workForceActivityTypeMappingUpdateLogState(request).then(() => {});
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    function workForceActivityTypeHistoryInsert(request) {
        return new Promise((resolve,reject) => {
            let paramsArr = new Array(
                request.activity_type_id,
                request.organization_id,
                request.update_type_id,
                request.datetime_log || util.getCurrentUTCTime()
            );
            let queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_history_insert',paramsArr);
            if(queryString != '') {
                db.executeQuery(0,queryString,request,function (err,data) {
                    (err === false) ? resolve(data) : resolve(err);
                });
            }
        });
    }

    function workForceActivityTypeMappingUpdateLogState(request) {
        return new Promise((resolve,reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.activity_type_id,
                0,
                3,
                request.asset_id,
                request.datetime_log || util.getCurrentUTCTime()
            );
            let queryString = util.getQueryString(`ds_p1_activity_type_asset_type_mapping_update_log_state`,paramsArr);
            if(queryString != '') {
                db.executeQuery(0,queryString,request,function (err,data) {
                    (err === false) ? resolve(data) : resolve(err);
                });
            }
        });
    }

    this.listProcessesByAccessLevel = async function (request) {
        let error = false;

        let tagMappingDataMap = new Map();
        const [errorOne,tagMappingData] = await activityTypeTagMappingSelect(request);
        for(const mapping of tagMappingData) {
            tagMappingDataMap.set(Number(mapping.activity_type_id),mapping);
        }

        let activityTypeData = await self.getAccessLevelActivityTypeList(request);
        try {
            activityTypeData = activityTypeData.map(activityType => {
                if(tagMappingDataMap.has(Number(activityType.activity_type_id))) {
                    activityTypeTagMappingData = tagMappingDataMap.get(Number(activityType.activity_type_id))
                    return {
                        ...activityType,
                        tag_id: activityTypeTagMappingData.tag_id,
                        tag_name: activityTypeTagMappingData.tag_name,
                        tag_type_id: activityTypeTagMappingData.tag_type_id,
                        tag_type_name: activityTypeTagMappingData.tag_type_name
                    }
                }
                return activityType
            });
        } catch(error) {
            logger.error("Error appending tag mapping data to process list",{type: "ActivityConfigService",request_body: request,error});
        }
        return [error,activityTypeData];
    }

    this.getAccessLevelActivityTypeList = function (request) {
        return new Promise((resolve,reject) => {
            let paramsArr = new Array(
                request.access_level_id,
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_type_category_id,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );

            let queryString = util.getQueryString('ds_p1_1_workforce_activity_type_mapping_select',paramsArr);
            if(queryString != '') {
                db.executeQuery(1,queryString,request,function (err,data) {
                    //console.log("err "+err);
                    if(err === false) {
                        console.log('data: ' + data.length);
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    async function activityTypeTagMappingSelect(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_id || 0,
            request.tag_id || 0,
            request.activity_type_id || 0,
            request.flag || 1,
            request.start_from || 0,
            request.limit_value || 50,
        );
        const queryString = util.getQueryString('ds_p1_activity_type_tag_mapping_select',paramsArr);

        if(queryString !== '') {
            await db.executeQueryPromise(1,queryString,request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error,responseData];
    }

    this.getEntityActivityStatusList = function (request) {
        // IN p_organization_id bigint(20), IN p_account_id bigint(20), IN p_workforce_id bigint(20), 
        // IN p_activity_type_category_id SMALLINT(6), IN p_activity_type_id BIGINT(20), IN p_flag TINYINT(4), 
        // IN p_log_datetime DATETIME, IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
        //flag = 1 - Only parent statuses
        //flag = 2 - Both parent and substatus
        return new Promise((resolve,reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_type_category_id,
                request.activity_type_id,
                request.flag || 1,
                request.datetime_log,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );

            let queryString = util.getQueryString('ds_p1_1_workforce_activity_status_mapping_select',paramsArr);
            if(queryString != '') {
                db.executeQuery(1,queryString,request,function (err,data) {
                    //console.log("err "+err);
                    if(err === false) {
                        console.log('data: ' + data.length);
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.getCommunicationList = function (request) {
        return new Promise((resolve,reject) => {
            let paramsArr = new Array(
                request.flag,
                request.communication_id,
                request.communication_type_id,
                request.communication_type_category_id,
                request.activity_type_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );

            let queryString = util.getQueryString('ds_p1_communication_list_select',paramsArr);
            if(queryString != '') {
                db.executeQuery(1,queryString,request,function (err,data) {
                    //console.log("err "+err);
                    if(err === false) {
                        console.log('data: ' + data.length);
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.workForceActivityStatusDelete = function (request) {
        return new Promise((resolve,reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_status_id,
                request.asset_id,
                request.datetime_log
            );
            let queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_delete',paramsArr);
            if(queryString != '') {
                db.executeQuery(0,queryString,request,function (err,data) {
                    if(err === false) {
                        request['update_type_id'] = 1502;
                        workForceActivityStatusHistoryInsert(request).then(() => {});
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }

    function workForceActivityStatusHistoryInsert(request) {
        return new Promise((resolve,reject) => {
            let paramsArr = new Array(
                request.activity_status_id,
                request.organization_id,
                request.update_type_id,
                request.datetime_log
            );
            let queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_history_insert',paramsArr);
            if(queryString != '') {
                db.executeQuery(0,queryString,request,function (err,data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }

    this.workForceActivityStatusInsert = function (request) {
        return new Promise((resolve,reject) => {
            let paramsArr = new Array(
                request.activity_status_name,
                request.activity_status_description || 0,
                request.status_sequence_id,
                request.activity_status_type_id,
                request.is_customer_exposed,
                request.activity_type_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                request.asset_id,
                request.datetime_log,
                request.previous_status_id || 0,
                request.parent_status_id || 0
            );
            // var queryString = util.getQueryString('ds_p1_1_workforce_activity_status_mapping_insert', paramsArr);
            const queryString = util.getQueryString('ds_p1_2_workforce_activity_status_mapping_insert',paramsArr);
            if(queryString != '') {
                db.executeQuery(0,queryString,request,function (err,data) {
                    if(err === false) {
                        request['activity_status_id'] = data[0].activity_status_id;
                        request['update_type_id'] = 0;
                        workForceActivityStatusHistoryInsert(request).then(() => {});

                        // Update the status tag mapping
                        // >0 => Map
                        // 0 => Unmap
                        if(request.activity_status_tag_id && Number(request.activity_status_tag_id) >= 0) {
                            try {
                                workforceActivityStatusMappingUpdateTag(request,request.organization_id,request.account_id,request.workforce_id);
                            } catch(error) {
                                console.log("workForceActivityStatusInsert | workforceActivityStatusMappingUpdateTag | Error: ",error);
                            }
                        }

                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }
    // Update Status Tag for an activity status
    async function workforceActivityStatusMappingUpdateTag(request,organizationID,accountID,workforceID) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_activity_status_id BIGINT(20), IN p_status_tag_id BIGINT(20), IN p_log_asset_id BIGINT(20), 
        // IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.activity_status_id,
            request.activity_status_tag_id,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_update_tag',paramsArr);

        if(queryString !== '') {
            await db.executeQueryPromise(0,queryString,request)
                .then((data) => {
                    responseData = data;
                    error = false;

                    let reqObj = Object.assign({},request);

                    reqObj.tag_id = request.activity_status_tag_id;
                    reqObj.tag_type_category_id = 4;
                    if(request.activity_status_tag_id > 0) {
                        adminOpsService.tagEntityMappingInsertDBCall(reqObj);
                    } else {
                        adminOpsService.tagEntityMappingDeleteV1(reqObj);
                    }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error,responseData];
    }

    this.workForceActivityStatusUpdate = function (request) {
        return new Promise((resolve,reject) => {
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_status_id,
                request.activity_status_name,
                request.activity_status_sequence_id,
                request.is_cusotmer_exposed,
                request.asset_id,
                request.datetime_log,
                request.parent_status_id || 0
            );
            let queryString = util.getQueryString('ds_p1_1_workforce_activity_status_mapping_update',paramsArr);
            if(queryString != '') {
                db.executeQuery(0,queryString,request,function (err,data) {
                    if(err === false) {
                        request['update_type_id'] = 1501;

                        // Update the status tag mapping
                        // >0 => Map
                        // 0 => Unmap
                        if(request.activity_status_tag_id && Number(request.activity_status_tag_id) >= 0) {
                            try {
                                workforceActivityStatusMappingUpdateTag(request,request.organization_id,request.account_id,request.workforce_id);
                            } catch(error) {
                                console.log("workForceActivityStatusUpdate | workforceActivityStatusMappingUpdateTag | Error: ",error);
                            }
                        }

                        workForceActivityStatusHistoryInsert(request).then(() => {});
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }

    this.getSubStatusedMappedToWorkflow = async function (request) {
        const organizationID = Number(request.organization_id),
            accountID = Number(request.account_id),
            workforceID = Number(request.workforce_id);

        let [error,subStatusData] = await activitySubStatusMappingSelect(request,organizationID,accountID,workforceID);
        return [error,subStatusData];
    }

    // List sub-statuses mapped to an activity
    async function activitySubStatusMappingSelect(request,organizationID,accountID,workforceID) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_activity_status_id BIGINT(20), IN p_status_tag_id BIGINT(20), IN p_log_asset_id BIGINT(20), 
        // IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            organizationID,
            accountID,
            workforceID,
            request.activity_id,
            request.activity_sub_status_id || 0,
            request.flag || 0,
            request.start_from || 0,
            request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_v1_activity_sub_status_mapping_select',paramsArr);

        if(queryString !== '') {
            await db.executeQueryPromise(1,queryString,request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error,responseData];
    }


    async function activityListUpdateVisibilityFlag(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_type_category_id,
            request.activity_type_id || 0,
            request.activity_type_flag_control_visibility || 0,
            request.datetime_log
        );
        const queryString = util.getQueryString('ds_p1_activity_list_update_visibility_flag',paramsArr);

        if(queryString !== '') {
            await db.executeQueryPromise(0,queryString,request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error,responseData];
    }

    async function activityAssetUpdateVisibilityFlag(request) {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_type_category_id,
            request.activity_type_id || 0,
            request.activity_type_flag_control_visibility || 0,
            request.datetime_log
        );
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_visibility_flag',paramsArr);

        if(queryString !== '') {
            await db.executeQueryPromise(0,queryString,request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error,responseData];
    }

    this.checkDuplicate = async function (request) {
        let error = true,
            responseData = [],
            finalResponse = {"account_exists": true,"expression": "","check_with": ""},
            botError,
            botData = [],
            panNumberField = 0,
            panNumber = "";

        try {
            // get the bot
            request.bot_operation_type_id = 22;
            request.start_from = 0;
            request.limit_value = 1;
            [botError,botData] = await self.botOperationMappingSelectOperationType(request);

            if(botData.length > 0) {
                panNumberField = JSON.parse(botData[0].bot_operation_inline_data).dedupe.pan_number;
            }

            request.pan_number_field = panNumberField;

            console.log("panNumberField :: ",request.pan_number_field);

            panNumber = await self.getFieldValueUsingFieldId(request);

            console.log("panNumber :: ",panNumber);

            let customerTitle = request.customer_title;
            customerTitle = customerTitle.toLowerCase().replace(/pvt/gi,'private').replace(/ltd/gi,'limited').replace(/\s+/gi,'');
            customerTitle = customerTitle.split(' ').join('')
            console.log("customerTitle :: " + customerTitle);

            finalResponse.expression = customerTitle;

            if(panNumber.trim() != "") {
                //check on pan number
                finalResponse.check_with = "pan_number";
                request.search_string = panNumber.trim();
                request.flag = 0;
                [error,responseData] = await self.searchDuplicateWorkflow(request);
            }/*else{
                //check on title
                finalResponse.check_with = "customer_title";
                request.search_string = customerTitle;
                request.flag = 4;
                [error, responseData] = await self.searchDuplicateWorkflow(request);
            }*/
            if(responseData.length > 0) {
                finalResponse.account_exists = true;
            } else {
                finalResponse.account_exists = false;
            }
        } catch(e) {
            console.log("[ERROR] checkDuplicate: ",e);
        }
        return [error,finalResponse];
    }


    this.searchDuplicateWorkflow = async function (request) {
        let error = true,
            responseData = [];

        if (request.activity_type_category_id == 48 && global.config.cuid_search_from == "elastic") {
            [error, responseData] = await activityCommonService.searchCuidFromElastic(request);
        } else {
            const paramsArr = new Array(
                request.organization_id,
                request.activity_type_category_id,
                request.activity_type_id || 0,
                request.flag || 0,
                request.search_string,
                request.page_start || 0,
                request.page_limit || 50
            );
            const queryString = util.getQueryString('ds_v1_activity_list_search_cuid', paramsArr);

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
        }

        return [error, responseData];
    }


    this.botOperationMappingSelectOperationType = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.activity_type_id,
            request.bot_id || 0,
            request.bot_operation_type_id || 0,
            request.form_id || 0,
            request.field_id || 0,
            request.start_from || 0,
            request.limit_value || 50
        );

        let queryString = util.getQueryString('ds_p1_1_bot_operation_mapping_select_operation_type',paramsArr);
        if(queryString !== '') {
            await db.executeQueryPromise(1,queryString,request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error,responseData];
    };

    this.getFieldValueUsingFieldId = async (request) => {

        let fieldValue = "";

        let inlineData = JSON.parse(request.activity_inline_data);
        for(let i = 0; i < inlineData.length; i++) {
            //console.log(inlineData[i].field_id+" : "+request.pan_number_field);
            if(inlineData[i].field_id == request.pan_number_field) {
                fieldValue = inlineData[i].field_value;
            }
        }

        return fieldValue;
    }
    // Update Status Tag for an activity status
    this.workforceActivityTypeMappingUpdateTag = async function (request) {
        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), 
        // IN p_activity_type_id BIGINT(20), IN p_activity_type_tag_id BIGINT(20), IN p_log_asset_id BIGINT(20), 
        // IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id,
            request.tag_id,
            request.log_asset_id || request.asset_id,
            util.getCurrentUTCTime(),
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_update_tag',paramsArr);

        if(queryString !== '') {
            await db.executeQueryPromise(0,queryString,request)
                .then((data) => {
                    responseData = data;
                    error = false;

                    let reqObj = Object.assign({},request);

                    reqObj.tag_type_category_id = 1;
                    if(request.tag_id > 0) {
                        adminOpsService.tagEntityMappingInsertDBCall(reqObj);
                    } else {
                        adminOpsService.tagEntityMappingDeleteV1(reqObj);
                    }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error,responseData];
    }

    this.getActivityConfigs = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.target_asset_id,
            request.flag,
            request.page_start || 0,
            request.page_limit || 50
        );

        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_configs',paramsArr);
        if(queryString !== '') {
            await db.executeQueryPromise(1,queryString,request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error,responseData];
    };


    this.checkAcctDuplicity = async (request) => {
        //DB CALL
        //IF p_flag = 0 THEN search all CUID 1/2/3
        //IF p_flag = 1 THEN search only CUID 1 - Has pan number in this context
        //IF p_flag = 2 THEN search only CUID 2 - GST Number
        //IF p_flag = 3 THEN search only CUID 3 - Account Code
        //IF p_flag = 4 THEN search only expression - Account Name
        request.activity_type_category_id = request.activity_type_category_id ? request.activity_type_category_id : 48;

        let error = false,
            finalResponse = {
                account_title_exists: "",
                account_pan_exists: "",
                account_gst_exists: "",
                message: "",
                account_title_expression: ""
            },
            panNumber = request.pan_number || null;
        gstNumber = request.gst_number || null;

        let workflowTitle;

        if(Number(request.flag_check) === 1) { //Check Workflow Title
            workflowTitle = request.workflow_title;
            workflowTitle = workflowTitle.toLowerCase().replace(/pvt/gi,'private').replace(/ltd/gi,'limited').replace(/\s+/gi,'');
            workflowTitle = workflowTitle.split(' ').join('');
            console.log("workflowTitle : ",workflowTitle);

            request.search_string = workflowTitle;
            request.flag = 4;

            let [err,response] = await self.searchDuplicateWorkflow(request);
            if(err) {
                error = true;
            }

            (response.length > 0) ?
                finalResponse.account_title_exists = true :
                finalResponse.account_title_exists = false
        }
        //else if(Number(flag) === 2) { //Check for PAN
        //    request.search_string = gstNumber.trim();
        //    request.flag = 1;
        //
        //} else if(Number(flag) === 2) { //Check for GST
        //    request.search_string = panNumber.trim();
        //    request.flag = 2;
        //} 
        else {
            if(panNumber !== null && gstNumber !== null) {
                //If both are given Check for 
                let extractedPanNumber = gstNumber.substring(2,12);
                console.log('extractedPanNumber : ',extractedPanNumber);

                if(extractedPanNumber !== panNumber) {
                    finalResponse.message = "Extracted Pan Number from GST is different from the given PAN Number";
                    error = true;
                } else {
                    //Check for the PAN Number uniqueness                    
                    let panExists = await checkForPanNumberExistence(request,panNumber);
                    (panExists) ?
                        finalResponse.account_pan_exists = true :
                        finalResponse.account_pan_exists = false;
                }
            } else if(panNumber !== null) {
                let panExists = await checkForPanNumberExistence(request,panNumber);
                (panExists) ?
                    finalResponse.account_pan_exists = true :
                    finalResponse.account_pan_exists = false;

            } else if(gstNumber !== null) {
                let panExists = await checkForPanNumberExistence(request,gstNumber.substring(2,12));
                (panExists) ?
                    finalResponse.account_gst_exists = true :
                    finalResponse.account_gst_exists = false;
            }

        }

        finalResponse.account_title_expression = workflowTitle;
        return [error,finalResponse];
    }

    async function checkForPanNumberExistence(request,panNumber) {
        let error = true,
            dataExists = false;

        request.search_string = panNumber.trim();
        request.flag = 1;

        let [err,response] = await self.searchDuplicateWorkflow(request);
        if(response.length > 0) {
            dataExists = true;
        }

        return dataExists;
    }

    this.generateAcctCode = async (request) => {
        let error = false,
            responseData = [];

        let is_from_integrations = 0;

        if(request.hasOwnProperty('workflow_activity_id') && Number(request.workflow_activity_id) > 0){
            is_from_integrations = 1;
        }

        request.bot_operation_type_id = 22;
        request.start_from = 0;
        request.limit_value = 1;
        [botError,botData] = await self.botOperationMappingSelectOperationType(request);

        //console.log('botData', botData);

        let botInlineData;

        if(botData.length > 0) {
            botInlineData = JSON.parse(botData[0].bot_operation_inline_data).bot_operations.account_code_dependent_fields;
            console.log('Account Code Dependent Fields: ',botInlineData);
        } else {
            error = true;
            responseData.push({'message': 'Bot not defined on the field ID'});
            return [error,responseData];
        }

        let generatedAccountData;
        try{
            generatedAccountData = await generateAccountCode(request,botInlineData);
        } catch(err) {
            responseData.push({'message': 'Error generating Account Code'});
            return[true, responseData];
        }
        
        console.log('Generated Account data : ',generatedAccountData);

        let hasSeqNo = generatedAccountData.has_sequence_number;
        let accountCode = generatedAccountData.account_code;
        let panNumber = generatedAccountData.panNumber;
        let gstNumber = generatedAccountData.gstNumber;
        let hasAccountCode = generatedAccountData.hasAccountCode;
        let accountTitle = generatedAccountData.account_title;
        let isPanDedupeRequired = generatedAccountData.is_pan_dedupe_required;
        let isCodeDedupeRequired = generatedAccountData.is_code_dedupe_required;
        let isNameDedupeRequired = generatedAccountData.is_name_dedupe_required;

        accountTitle = accountTitle.toLowerCase().replace(/pvt/gi, 'private').replace(/ltd/gi, 'limited').replace(/\s+/gi, '').replace(/[^a-zA-Z0-9]/g, '');
        accountTitle = accountTitle.split(' ').join('')
        let checkPan = "";
        if(panNumber!=null||panNumber!=""){
          checkPan = panNumber.toUpperCase();
        }
        else if(gstNumber!=null||gstNumber!=""){
         checkPan = gstNumber.substring(2,12).toUpperCase();
        }
        else{
            checkPan =""
        }
        //Check the uniqueness of the account title
        if (isNameDedupeRequired) {
            let isAccountPresent = await duplicateAccountNameElasticSearch(request,accountTitle);
            if (isAccountPresent) {
                console.log("Account name already exists!")
                responseData.push({ 'message': 'Account Name already exists!' });
                return [true, responseData];
            }
        }

        if (isPanDedupeRequired) {
            //Check the uniqueness of the pan number
            let [errpa, panresponse] = await checkForPanNumberExistenceElasticServer(request, checkPan);

            if (errpa) {
                responseData.push({ 'message': 'Error in checking pan card' });
                return [true, responseData];
            }
            if (panresponse.length > 0) {
                responseData.push({ 'message': 'The entered Pan already exists in the account '+panresponse[0].account_code });
                return [true, responseData];
            }
        }


        if (hasAccountCode && (isCodeDedupeRequired || isPanDedupeRequired)) {
            //Check the generated code is unique or not?
            let [err1, accountData] = await checkWhetherAccountCodeExists(request,accountCode);
            if (err1) {
                responseData.push({ 'message': 'Error in Checking Acount Code!' });
                return [true, responseData];
            }

            //1) If it is not unique then check if there is a sequential number as part of the account code.
            //If it is not there then throw error "Account already exists".
            if (accountData.length > 0 && Number(hasSeqNo) === 0) {
                responseData.push({ 'message': 'Account already exists!' });
                return [true, responseData];

            } else if (accountData.length > 0 && Number(hasSeqNo) === 1) {
                //2) If sequential number is there as part of the account code, 
                //increment the sequential number by 1 and reverify the uniqueness of account code.

                let tempObj;
                let newAccountCode;

                while (true) { //Runs until it finds a unique account code               

                    //Increment the sequential ID
                    tempObj = await generateAccountCode(request, botInlineData);
                    newAccountCode = tempObj.account_code;
                    console.log('*******************');
                    console.log('New Account Code : ', newAccountCode);

                    //Check the uniqueness of the account code
                    let [err, accountData] = await checkWhetherAccountCodeExists(request,newAccountCode);
                    console.log('**********', accountData);

                    if (err) {
                        responseData.push({ 'message': 'Error in Checking Acount Code!' });
                        return [true, responseData];
                    }

                    if (accountData.length === 0 || cnt === 5) {
                        break;
                    }
                } //End while loop

                accountCode = newAccountCode
            }

            console.log('Final Account Code : ', accountCode);
        }
        let activity_title = ""
        //let activityTitleExpression = request.activity_title.replace(/\s/g, '').toLowerCase();
        //responseData.push({'generated_account_code' : accountCode, 'activity_title_expression': activityTitleExpression});
        responseData.push({'generated_account_code' : accountCode,'pan_number':panNumber.toUpperCase(),'gst_number':gstNumber.toUpperCase()});
         if(!hasAccountCode){
            let activityData = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);
            if(activityData.length>0){
            accountCode = activityData[0].activity_cuid_3;
            activity_title = activityData[0].activity_title;
            activity_title = activity_title.toLowerCase().replace(/pvt/gi, 'private').replace(/ltd/gi, 'limited').replace(/\s+/gi, '').replace(/[^a-zA-Z0-9]/g, '');
        activity_title = activity_title.split(' ').join('');
            }
         }
        if(Number(is_from_integrations) === 1) {
            //Update the generated Account code in two places
            //1) CUID3 of Workflow
            logger.silly("Updating CUID3 Value of workflow");
            logger.silly("Update CUID Bot Request: ",request);
            let objToSend = {"CUID3": accountCode};
            if(checkPan!=""){
                objToSend = {...objToSend,"CUID1":checkPan}
            }
            if(gstNumber!=null && gstNumber!=""){
                objToSend = {...objToSend,"CUID2":gstNumber}
               }

            try {
                request.account_code_update = true;
                request.datetime_log = util.getCurrentUTCTime();
                await botService.updateCUIDBotOperationMethod(request,{},objToSend);
            } catch(error) {
                logger.error("Error running the CUID update bot - CUID3",{type: 'bot_engine',error: serializeError(error),request_body: request});
            }

            //Update the same in ElastiSearch
            console.log('hasAccountCode - ', hasAccountCode);
            if(!hasAccountCode) {
                console.log("elastic data",{
                    "activity_cuid_1":panNumber,
                    "activity_cuid_2":gstNumber,
                    "activity_cuid_3": accountCode,
                    "activity_type_id": Number(request.activity_type_id),
                    "workforce_id": Number(request.workforce_id),
                    "account_id": Number(request.account_id),
                    "activity_id": Number(request.workflow_activity_id),
                    "asset_id": Number(request.asset_id),
                    "activity_title_expression":activity_title
                })
                client.updateByQuery({
                    index: global.config.elasticCrawlingAccountTable,
                    "body": {
                        "query": {
                            "match": {
                                "activity_id": Number(request.workflow_activity_id)
                            }
                        },
                        "script": {
                            "source": "ctx._source = params",
                            "lang": "painless",
                            "params": {
                                "activity_cuid_1":panNumber,
                                "activity_cuid_2":gstNumber,
                                "activity_cuid_3": accountCode,
                                "activity_type_id": Number(request.activity_type_id),
                                "workforce_id": Number(request.workforce_id),
                                "account_id": Number(request.account_id),
                                "activity_id": Number(request.workflow_activity_id),
                                "asset_id": Number(request.asset_id),
                                "activity_title_expression":activity_title
                            }
                        }
                    }
                });
            } else {
                client.index({
                    index: global.config.elasticCrawlingAccountTable,
                    body: {
                        activity_cuid_3: accountCode,
                        activity_type_id: Number(request.activity_type_id),
                        workforce_id: Number(request.workforce_id),
                        account_id: Number(request.account_id),
                        activity_id: Number(request.workflow_activity_id),
                        asset_id: Number(request.asset_id)
                        //operating_asset_first_name: "Sagar Pradhan",
                        //activity_title: "GALAXY MEDICATION",
                        //activity_type_name: "Account Management - SME",
                        //asset_first_name: "Channel Head",
                        //operating_asset_id: 44574,
                    }
                });
             }

            //2) Update in one of the target Fields? I dont what is it? //Target field take it from Ben
        }       

        return [error,responseData];
    }



    this.checkTitleDedupe = async (request) => {
        let error = false,
            responseData = [];

        request.bot_operation_type_id = 22;
        request.start_from = 0;
        request.limit_value = 1;
        [botError, botData] = await self.botOperationMappingSelectOperationType(request);

        let accountTitle = request.activity_title

        //console.log('botData', botData);
        accountTitle = accountTitle.toLowerCase().replace(/pvt/gi, 'private').replace(/ltd/gi, 'limited').replace(/\s+/gi, '').replace(/[^a-zA-Z0-9]/g, '');
        accountTitle = accountTitle.split(' ').join('')

        let botInlineData;

        if (botData.length > 0) {
            botInlineData = JSON.parse(botData[0].bot_operation_inline_data).bot_operations.account_code_dependent_fields;
            console.log('Account Code Dependent Fields: ', botInlineData);
        } else {
            error = true;
            responseData.push({ 'message': 'Bot not defined on the field ID' });
            return [error, responseData];
        }

        let checkAccountTitleDedupeData;
        try {
            checkAccountTitleDedupeData = await checkAccountTitleDedupe(request, botInlineData);
        } catch (err) {
            responseData.push({ 'message': 'Error generating Account Code' });
            return [true, responseData];
        }

        console.log('Check Title Dedupe Data: ', checkAccountTitleDedupeData);

        let isNameDedupeRequired = checkAccountTitleDedupeData.is_name_dedupe_required;

        let activityData = await activityCommonService.getActivityDetailsPromise(request, request.workflow_activity_id);
        console.log('activityData.length : ', activityData.length);

        //check the account enlistment
        if (activityData.length > 0) {
            if (activityData[0].activity_status_type_id === 162) {
                console.log("Account enlistment already completed!")
                error = true
                responseData.push({ 'message': 'Account name change is not allowed.Account is already enlisted' });
                return [error, responseData];
            }
        }


        //Check the uniqueness of the account title
        if (isNameDedupeRequired) {
            let isAccountPresent = await duplicateAccountNameElasticSearch(request, accountTitle);
            if (isAccountPresent) {
                console.log("Account name already exists!")
                error = true
                responseData.push({ 'message': 'Account Name already exists!' });
                return [error, responseData];
            } else {
                console.log("No issues you can procced")
                error = false
                responseData.push({ 'message': 'No issues you can procced' });
                return [error, responseData];
            }
        }

        return [error, responseData];
    }


    this.checkAccountNameForDuplicate = async (request) => {
        let error = false,
            responseData = [];
        let accountTitle = request.activity_title || "";
        accountTitle = accountTitle.toLowerCase().replace(/pvt/gi, 'private').replace(/ltd/gi, 'limited').replace(/\s+/gi, '').replace(/[^a-zA-Z0-9]/g, '');
        accountTitle = accountTitle.split(' ').join('')

        let isAccountPresent = await duplicateAccountNameElasticSearch(request,accountTitle);
        if (isAccountPresent) {
            console.log("Account name already exists!")
            responseData.push({ 'message': 'Account Name already exists!' });
            return [true, responseData];
        }
        responseData.push({ 'message': 'Account Name verified successfully!' });
        return [error, responseData];
    }

    this.dedupePanCHeck = async (request)=>{
        let error = false;
        let activityData=[];
        let activities = [];
        console.log('Searching elastisearch for pan number : ',request.pan_number);
        const response = await client.search({
            index: global.config.elasticCrawlingAccountTable,
            body: {
                query: {
                    match: {activity_cuid_1: request.pan_number}
                    //"constant_score" : { 
                    //    "filter" : {
                    //        "term" : { 
                    //            "activity_cuid_3": accountCode
                    //        }
                    //    }
                    // }
                }
            }
        })

        console.log('response from ElastiSearch: ',response);
        let totalRetrieved = (response.hits.hits).length;
        console.log('Number of Matched Results : ',totalRetrieved);

        for(const i_iterator of response.hits.hits) {
            console.log(i_iterator._source.activity_cuid_1);
            if(i_iterator._source.activity_cuid_1 === request.pan_number) {
                
                console.log('found a Match!');
                activities.push(i_iterator._source.activity_id)
            }
        }
        
       if(activities.length>0){
         activityData = await activityCommonService.getActivityDetailsPromise(request, activities[0]);
       }

       return [error,activityData]
       
    }

    async function checkForPanNumberExistenceElasticServer(request,panNumber) {
        let error = false;
        
        let responseData=[]

            console.log('Searching elastisearch for pan number : ',panNumber);
            const response = await client.search({
                index: global.config.elasticCrawlingAccountTable,
                body: {
                    query: {
                        match: {activity_cuid_1: panNumber}
                        //"constant_score" : { 
                        //    "filter" : {
                        //        "term" : { 
                        //            "activity_cuid_3": accountCode
                        //        }
                        //    }
                        // }
                    }
                }
            })
    
            console.log('response from ElastiSearch: ',response);
            let totalRetrieved = (response.hits.hits).length;
            console.log('Number of Matched Results : ',totalRetrieved);
            // console.log(request)
            for(const i_iterator of response.hits.hits) {
                console.log(i_iterator._source.activity_cuid_1.toUpperCase() +" " + panNumber.toUpperCase()+" "+ i_iterator._source.activity_id +' '+ request.workflow_activity_id);
                // console.log(i_iterator._source.activity_cuid_1.toUpperCase() == panNumber.toUpperCase());
                // console.log(panNumber)
                // console.log(Number(i_iterator._source.activity_id) !== Number(request.workflow_activity_id))
                if((Number(i_iterator._source.log_state) != 3 && i_iterator._source.activity_cuid_1.toUpperCase() === panNumber.toUpperCase()) && (Number(i_iterator._source.activity_id) !== Number(request.workflow_activity_id))) {
                    
                    responseData.push({'message': 'Found a Match!', "account_code" : i_iterator._source.activity_cuid_3});
                    console.log('found a Match!');
                }
            }

            return [error,responseData];

        
    }

    let duplicateAccountNameElasticSearch = async function (request,title) { 
        let workFlowActivityID = request.workflow_activity_id || 0;
        let isAccountPresent = false;
        console.log('Searching elastisearch for Accounyt title : ',title);
        let altQuery = `/${global.config.elasticCrawlingAccountTable}/_search?q=activity_title_expression:${title}`;
                    // util.logInfo(request,"QUERY V1"+altQuery)
                    let queryToPass = encodeURI(altQuery);
        let resultData = await client.transport.request({
            method: "GET",
            path: queryToPass,
        })
        // let resultData = await client.search({
        //     index: global.config.elasticCrawlingAccountTable,
        //     body: {
        //         query: {
        //             bool: {
        //                 must: [
        //                     {
        //                         match_phrase: {
        //                             activity_title_expression: title
        //                         }
        //                     },
        //                     {
        //                       "range" : {"log_state" : {"lt" : 3}}
        //                     }
        //                 ],

        //             }
        //         }
        //     }
        // });

        console.log('response from ElastiSearch: ',JSON.stringify(resultData));

        for(const i_iterator of resultData.hits.hits) {
            if(i_iterator._source.log_state != 3 && i_iterator._source.activity_title_expression === title && (Number(i_iterator._source.activity_id) !== Number(workFlowActivityID))) {
                isAccountPresent = true;
                break;
            }
        }
        return isAccountPresent;
    }

    async function generateAccountCode(request,botInlineData) {
        let responseData = {};

        let activityTypeID = Number(request.activity_type_id);
        let accountCode = "";
        let gstNumber = "";
        let panNumber = "";
        let accountTitle = "";
        let isPanDedupeRequired = false, isCodeDedupeRequired = false, isNameDedupeRequired = false;
        let hasAccountCode =true;
        let formID = Number(request.activity_form_id) || Number(request.form_id);
        let hasSeqNo = 0;

        switch(activityTypeID) {
            case 149277://LA - Large Account                     
                const laCompanyNameFID = Number(botInlineData.name_of_the_company);
                const laGroupCompanyNameFID = Number(botInlineData.name_of_the_group_company);

                const laPanFID = Number(botInlineData.pan_number);
                const laGstFID = Number(botInlineData.gst_number);
              
                const laPanNumber = await getFieldValueUsingFieldIdV1(request,formID,laPanFID);
                const laGstNumber = await getFieldValueUsingFieldIdV1(request,formID,laGstFID);
                console.log("pan and gst numbers",laPanNumber,laGstNumber)
                let laCompanyName = await getFieldValueUsingFieldIdV1(request,formID,laCompanyNameFID);
                //const laGroupCompanyName = await getFieldValueUsingFieldIdV1(request,formID,laGroupCompanyNameFID);
                laCompanyName = await util.removeSpecialCharecters(laCompanyName);
                // laCompanyName = laCompanyName.toLowerCase().replace(/pvt/gi,'private').replace(/ltd/gi,'limited').replace(/\s+/gi,'').replace(/[^a-zA-Z0-9]/g, '');
                // laCompanyName = laCompanyName.split(' ').join('')
                accountTitle = laCompanyName;
                const laGroupCompany = await getFieldValueUsingFieldIdV2(request,formID,laGroupCompanyNameFID);
                
                console.log('laGroupCompany - ', laGroupCompany);

                let laTempVar = laGroupCompany.split('|');
                let laActivityID = laTempVar[0];
                const laGroupCompanyName = laTempVar[1];
                
                panNumber = laPanNumber;
                gstNumber = laGstNumber;
                console.log('LA company Name : ',laCompanyName);
                console.log('LA Group company Name : ',laGroupCompanyName);               

                accountCode += 'C-';
                accountCode += ((laCompanyName.substring(0,11)).padEnd(11,'0')).toUpperCase();
                accountCode += '-';
                //accountCode += ((laGroupCompanyName.substring(0,6)).padEnd(6,'0')).toUpperCase();

                let laNewGroupCompanyName = laGroupCompanyName.replace(/\s/g, '').toLowerCase();
                console.log('laNewGroupCompanyName - ',laNewGroupCompanyName);

                let laGenericparentgroupActId;
                if(global.mode == 'staging') {
                    laGenericparentgroupActId = 3155254;
                } else if(global.mode == 'preprod') {
                    laGenericparentgroupActId = 284427;
                } else if(global.mode == 'prod') {
                    laGenericparentgroupActId = 3053964;
                }
                
                //if(laNewGroupCompanyName === 'genericparentgroup') {
                if(laActivityID == laGenericparentgroupActId) {
                    //then take the name from the group account name
                    accountCode += ((laCompanyName.substring(0,6)).padEnd(6,'0')).toUpperCase();    
                } else {
                   
                    laNewGroupCompanyName = laNewGroupCompanyName.split(" ").join('');
                    accountCode += ((laNewGroupCompanyName.substring(0,6)).padEnd(6,'0')).toUpperCase();    
                }
                if (botInlineData.hasOwnProperty("is_pan_dedupe_required") && Number(botInlineData.is_pan_dedupe_required) === 1) {
                    isPanDedupeRequired = true;
                }
                if (botInlineData.hasOwnProperty("is_code_dedupe_required") && Number(botInlineData.is_code_dedupe_required) === 1) {
                    isCodeDedupeRequired = true;
                }
                if (botInlineData.hasOwnProperty("is_name_dedupe_required") && Number(botInlineData.is_name_dedupe_required) === 1) {
                    isNameDedupeRequired = true;
                }
                break;

            case 150442://GE - VGE Segment
            
                const geCompanyNameFID = Number(botInlineData.name_of_the_company);
                const geGroupCompanyNameFID = Number(botInlineData.name_of_the_group_company);

                const gePanFID = Number(botInlineData.pan_number);
                const geGstFID = Number(botInlineData.gst_number);
                
                const getPanNumber = await getFieldValueUsingFieldIdV1(request,formID,gePanFID);
                const getGstNumber = await getFieldValueUsingFieldIdV1(request,formID,geGstFID);
                console.log("pan and gst numbers",getPanNumber,getGstNumber)
                let geCompanyName = await getFieldValueUsingFieldIdV1(request,formID,geCompanyNameFID);
                //const geGroupCompanyName = await getFieldValueUsingFieldIdV1(request,formID,geGroupCompanyNameFID);
                geCompanyName = await util.removeSpecialCharecters(geCompanyName);
                // geCompanyName = geCompanyName.toLowerCase().replace(/pvt/gi,'private').replace(/ltd/gi,'limited').replace(/\s+/gi,'').replace(/[^a-zA-Z0-9]/g, '');
                // geCompanyName = geCompanyName.split(' ').join('')
                accountTitle = geCompanyName;
                const geGroupCompany = await getFieldValueUsingFieldIdV2(request,formID,geGroupCompanyNameFID);
                
                console.log('geGroupCompany - ', geGroupCompany);

                let geTempVar = geGroupCompany.split('|');
                let geActivityID = geTempVar[0];
                const geGroupCompanyName = geTempVar[1];

                panNumber = getPanNumber;
                gstNumber = getGstNumber;
                
                accountCode += 'V-';
                accountCode += ((geCompanyName.substr(0,11)).padEnd(11,'0')).toUpperCase();
                accountCode += '-'
                //accountCode += ((geGroupCompanyName.substr(0,6)).padEnd(6,'0')).toUpperCase();

                let geNewGroupCompanyName = geGroupCompanyName.replace(/\s/g, '').toLowerCase();
                console.log('geNewGroupCompanyName - ',geNewGroupCompanyName);

                let geGenericparentgroupActId;
                if(global.mode == 'staging') {
                    geGenericparentgroupActId = 3155254;
                } else if(global.mode == 'preprod') {
                    geGenericparentgroupActId = 284427;
                } else if(global.mode == 'prod') {
                    geGenericparentgroupActId = 3053964;
                }

                //if(geNewGroupCompanyName === 'genericparentgroup') {
                if(geActivityID == geGenericparentgroupActId) {
                    //then take the name from the group account name
                    accountCode += ((geCompanyName.substring(0,6)).padEnd(6,'0')).toUpperCase();    
                } else {
                    geNewGroupCompanyName = geNewGroupCompanyName.split(" ").join("");
                    accountCode += ((geNewGroupCompanyName.substr(0,6)).padEnd(6,'0')).toUpperCase();
                }

                if (botInlineData.hasOwnProperty("is_pan_dedupe_required") && Number(botInlineData.is_pan_dedupe_required) === 1) {
                    isPanDedupeRequired = true;
                }
                if (botInlineData.hasOwnProperty("is_code_dedupe_required") && Number(botInlineData.is_code_dedupe_required) === 1) {
                    isCodeDedupeRequired = true;
                }
                if (botInlineData.hasOwnProperty("is_name_dedupe_required") && Number(botInlineData.is_name_dedupe_required) === 1) {
                    isNameDedupeRequired = true;
                }
                break;

            case 149809: //SME                         
                /*{
                    "dedupe": {
                        "pan_number": 61867,
                        "account_name_field": 54156
                    },
                    "account_code_dependent_fields": [
                            {"field_name": "name_of_the_company", "name_of_the_company": 223744, "form_id": 4651},
                            {"field_name": "micro_segment_turn_over", "micro_segment_turn_over": 223698, "form_id": 3781},
                            {"field_name": "sub_industry", "sub_industry": 223697, "form_id": 3781}    
                    ]
                    }*/
                 //This will be triggerred on 3781

                hasSeqNo = 1;

                let smeCompanyNameFID;
                let smeCompanyName;

                let smeSubIndustryFID;
                let smeSubIndustryName;

                let smeSubIndustrySubID;
                let smeTurnOverFID;
                let smeTurnOver;
                let smePanNumber;
                let smeGstNumber;
                
                for(const i of botInlineData){
                    //console.log(i);
                    switch(i.field_name){
                        case 'name_of_the_company': console.log(i.name_of_the_company);
                                                    smeCompanyNameFID = Number(i.name_of_the_company);
                                                    smeCompanyName = await getFieldValueUsingFieldIdV1(request,i.form_id,smeCompanyNameFID);
                                                    smeCompanyName = await util.removeSpecialCharecters(smeCompanyName);
                                                    // smeCompanyName = smeCompanyName.toLowerCase().replace(/pvt/gi,'private').replace(/ltd/gi,'limited').replace(/\s+/gi,'').replace(/[^a-zA-Z0-9]/g, '');
                                                    // smeCompanyName = smeCompanyName.split(' ').join('')
                                                    accountTitle = smeCompanyName;
                                                    if (i.hasOwnProperty("is_code_dedupe_required") && Number(i.is_code_dedupe_required) === 1) {
                                                        isCodeDedupeRequired = true;
                                                    }
                                                    if (i.hasOwnProperty("is_name_dedupe_required") && Number(i.is_name_dedupe_required) === 1) {
                                                        isNameDedupeRequired = true;
                                                    }
                                                    break;
                        
                        case 'sub_industry': console.log(i.sub_industry);
                                             smeSubIndustryFID = Number(i.sub_industry);
                                             smeSubIndustrySubID = await getFieldDataComboIdUsingFieldIdV1(request,i.form_id,smeSubIndustryFID);
                                             
                                             smeSubIndustrySubFID = i.sub_industry_field_values[`${smeSubIndustrySubID}`];
                                             smeSubIndustryName = await getFieldValueUsingFieldIdV1(request,i.form_id,smeSubIndustrySubFID);
                                             console.log("sme sub ind",smeSubIndustryName)
                                             smeSubIndustryName = await util.removeSpecialCharecters(smeSubIndustryName);
                                             break;
                        case 'pan_number': console.log(i.pan_number);
                                           smePanNumber = i.pan_number;
                                           panNumber = await getFieldValueUsingFieldIdV1(request,i.form_id,smePanNumber);
                                            if (i.hasOwnProperty("is_pan_dedupe_required") && Number(i.is_pan_dedupe_required) === 1) {
                                                isPanDedupeRequired = true;
                                            }
                                           break;      
                        case 'gst_number': console.log(i.gst_number);
                                           smeGstNumber = i.gst_number;
                                           gstNumber = await getFieldValueUsingFieldIdV1(request,i.form_id,smeGstNumber);
                                            
                                           break;                 
                        
                        case 'micro_segment_turn_over': console.log(i.micro_segment_turn_over);
                                                        smeTurnOverFID = Number(i.micro_segment_turn_over);
                                                        smeTurnOver = await getFieldValueUsingFieldIdV1(request,i.form_id,smeTurnOverFID);
                                                        console.log('smeTurnOver --- ', smeTurnOver);
                                                      break;
                    }
                }                
                 
                if (isCodeDedupeRequired || isPanDedupeRequired) {
                    console.log('smeSubIndustryName - ', smeSubIndustryName);
                    console.log('smeTurnOver : ', smeTurnOver);

                    //1 SME-Emerging Enterprises (51 - 100 Cr)
                    //2 SME-Medium Enterprises (101 - 250 Cr)
                    //3 SME-Small Enterprises (10 - 50 Cr)

                    //smeTurnOver = smeTurnOver.toLowerCase();
                    console.log('smeTurnOver : ', smeTurnOver);
                    //if(smeTurnOver === 'sme-emergingenterprises(51-100cr)') {
                    //    smeTurnOver = 1;
                    //} else if(smeTurnOver === 'sme-emergingenterprises(101-250cr)') {
                    //    smeTurnOver = 2;
                    //} else if(smeTurnOver === 'sme-emergingenterprises(10-50cr)') {
                    //    smeTurnOver = 3;
                    //}
                    if (panNumber != "") {
                        hasAccountCode = false;
                    }
                    accountCode += 'S-';
                    accountCode += ((smeCompanyName.substr(0, 7)).padEnd(7, '0')).toUpperCase();

                    //4 digit sequential number, gets reset to 0000 after 9999
                    let smeSeqNumber = await cacheWrapper.getSmeSeqNumber();
                    console.log('smeSeqNumber : ', smeSeqNumber);

                    if (Number(smeSeqNumber) === 9999) {
                        await cacheWrapper.setSmeSeqNumber(0);
                        accountCode += '0000';
                    } else {
                        accountCode += (smeSeqNumber.toString()).padStart(4, '0');
                    }

                    accountCode += '-'
                    accountCode += smeTurnOver // turnover

                    console.log('sme Sub Industry Name : ', smeSubIndustryName);
                    if (smeSubIndustryName.toLowerCase() === 'others') {
                        accountCode += 'OTHERS'
                    } else {
                        accountCode += ((smeSubIndustryName.substr(0, 3)).padEnd(5, '0')).toUpperCase(); //subindustry
                    }
                }

                break;

            case 150443: //Regular Govt/Govt SI Segment
                accountCode += 'G-';
                const govtAccounTypeFID = Number(botInlineData.account_type);
                const govtAccounType = await getFieldValueUsingFieldIdV1(request,formID,govtAccounTypeFID);

                console.log('Account Type : ',govtAccounType);

                const govtCompanyNameFID = Number(botInlineData.name_of_the_company);
                const govtGroupCompanyNameFID = Number(botInlineData.name_of_the_group_company);
                const govtPanId = Number(botInlineData.pan_number);

                const govtPanNumber = await getFieldValueUsingFieldIdV1(request,formID,govtPanId);
                let govtCompanyName = await getFieldValueUsingFieldIdV1(request,formID,govtCompanyNameFID);
                const govtGroupCompanyName = await getFieldValueUsingFieldIdV1(request,formID,govtGroupCompanyNameFID);
                govtCompanyName = await util.removeSpecialCharecters(govtCompanyName);
                // govtCompanyName = govtCompanyName.toLowerCase().replace(/pvt/gi,'private').replace(/ltd/gi,'limited').replace(/\s+/gi,'').replace(/[^a-zA-Z0-9]/g, '');
                // govtCompanyName = govtCompanyName.split(' ').join('');
                accountTitle = govtCompanyName;
                if(govtAccounType === 'SI') { //SI
                    //console.log('Inside SI');

                    const siNameFID = Number(botInlineData.si_name); //61956
                    const siName = await getFieldValueUsingFieldIdV1(request,formID,siNameFID);

                    const departmentNameFID = Number(botInlineData.department_name);
                    let departmentName = await getFieldValueUsingFieldIdV1(request,formID,departmentNameFID);
                    departmentName = await util.removeSpecialCharecters(departmentName);
                    accountCode += ((siName.substr(0,3)).padEnd(3,'0')).toUpperCase();
                    accountCode += '-';
                    accountCode += ((departmentName.substr(0,7)).padEnd(7,'0')).toUpperCase();
                    accountCode += '-';
                } else { //Govt Regular
                    //console.log('Inside ELSE');

                    accountCode += ((govtCompanyName.substr(0,11)).padEnd(11,'0')).toUpperCase();
                    accountCode += '-';
                    //accountCode += nameofgrouppcompany.padEnd(6, '0');
                }

                //Center or State
                const centerOrStateFID = Number(botInlineData.state_central); //61954
                const centerOrStateName = await getFieldValueUsingFieldIdV1(request,formID,centerOrStateFID);
                console.log('Center or State : ',centerOrStateName);
                accountCode += ((centerOrStateName.substr(0,3)).padEnd(3,'0')).toUpperCase();

                //Circle
                const circleFID = Number(botInlineData.circle); //61958
                const circleName = await getFieldValueUsingFieldIdV1(request,formID,circleFID);
                console.log('Circle : ',circleName);
                accountCode += ((circleName.substr(0,3)).padEnd(3,'0')).toUpperCase();
                panNumber = govtPanNumber;
                if (botInlineData.hasOwnProperty("is_pan_dedupe_required") && Number(botInlineData.is_pan_dedupe_required) === 1) {
                    isPanDedupeRequired = true;
                }
                if (botInlineData.hasOwnProperty("is_code_dedupe_required") && Number(botInlineData.is_code_dedupe_required) === 1) {
                    isCodeDedupeRequired = true;
                }
                if (botInlineData.hasOwnProperty("is_name_dedupe_required") && Number(botInlineData.is_name_dedupe_required) === 1) {
                    isNameDedupeRequired = true;
                }
                break;

            case 150254: //VICS - Carrier partner addition
                hasSeqNo = 1;
                const vicsCompanyNameFID = Number(botInlineData.name_of_the_company);
                let vicsCompanyName = await getFieldValueUsingFieldIdV1(request,formID,vicsCompanyNameFID);
                vicsCompanyName = await util.removeSpecialCharecters(vicsCompanyName)
                // vicsCompanyName = vicsCompanyName.toLowerCase().replace(/pvt/gi,'private').replace(/ltd/gi,'limited').replace(/\s+/gi,'').replace(/[^a-zA-Z0-9]/g, '');
                // vicsCompanyName = vicsCompanyName.split(' ').join('')
                accountTitle = vicsCompanyName;
                const vicsAccountTypeFID = Number(botInlineData.account_type);
                const vicsAccountType = await getFieldValueUsingFieldIdV1(request,formID,vicsAccountTypeFID);
                const vicsPanFID = Number(botInlineData.pan_number);
                const vicsGstFID = Number(botInlineData.gst_number);
              
                const vicsPanNumber = await getFieldValueUsingFieldIdV1(request,formID,vicsPanFID);
                const vicsGstNumber = await getFieldValueUsingFieldIdV1(request,formID,vicsGstFID);
                console.log("vics pan--------vics gst",vicsPanNumber,vicsGstNumber)
                if(vicsAccountType=="ISP"){
                    vicsCompanyName = "ISP"+vicsCompanyName;
                }
                accountCode += 'W-';
                accountCode += ((vicsCompanyName.substr(0,11)).padEnd(11,'0')).toUpperCase();
                accountCode += '-';

                //6 digit sequential number, gets reset to 000000 after 999999
                let vicsSeqNumber = await cacheWrapper.getVICSSeqNumber();
                console.log('from cache vicsSeqNumber : ',vicsSeqNumber);

                if(Number(vicsSeqNumber) === 999999) {
                    await cacheWrapper.setVICSSeqNumber(0);
                    accountCode += '000000';
                } else {
                    accountCode += (vicsSeqNumber.toString()).padStart(6,'0');
                }
                panNumber = vicsPanNumber;
                gstNumber = vicsGstNumber;
                console.log('from cache vicsSeqNumber : ',vicsSeqNumber);
                if (botInlineData.hasOwnProperty("is_pan_dedupe_required") && Number(botInlineData.is_pan_dedupe_required) === 1) {
                    isPanDedupeRequired = true;
                }
                if (botInlineData.hasOwnProperty("is_code_dedupe_required") && Number(botInlineData.is_code_dedupe_required) === 1) {
                    isCodeDedupeRequired = true;
                }
                if (botInlineData.hasOwnProperty("is_name_dedupe_required") && Number(botInlineData.is_name_dedupe_required) === 1) {
                    isNameDedupeRequired = true;
                }
                break;

            case 150444: //SOHO
                /*{
                    "dedupe": {
                        "pan_number": 61867,
                        "account_name_field": 54156
                    },
                    "account_code_dependent_fields": [
                        {"field_name": "name_of_the_company", "name_of_the_company": 223887, "form_id": 4679},
                        {"field_name": "micro_segment_turn_over", "micro_segment_turn_over": 223877, "form_id": 3782}
                    ]
                    }
                */
                hasSeqNo = 1;

                let sohoCompanyNameFID;
                let sohoCompanyName;
                let sohoSubIndustryFID;
                let sohoSubIndustrySubID;
                let sohoSubIndustrySubFID;
                let sohoSubIndustryName;
                let sohoTurnOverFID;
                let sohoTurnOver;
                let sohoGstNumber;
                let sohoPanNumber;
                 
                for(const i of botInlineData){
                    //console.log(i);
                    switch(i.field_name){
                        case 'name_of_the_company': console.log(i.name_of_the_company);
                                                    sohoCompanyNameFID = Number(i.name_of_the_company);
                                                    sohoCompanyName = await getFieldValueUsingFieldIdV1(request,i.form_id,sohoCompanyNameFID);
                                                    sohoCompanyName = await util.removeSpecialCharecters(sohoCompanyName);
                                                    // sohoCompanyName = sohoCompanyName.toLowerCase().replace(/pvt/gi,'private').replace(/ltd/gi,'limited').replace(/\s+/gi,'').replace(/[^a-zA-Z0-9]/g, '');
                                                    // sohoCompanyName = sohoCompanyName.split(' ').join('')
                                                    accountTitle = sohoCompanyName;
                                                    if (i.hasOwnProperty("is_code_dedupe_required") && Number(i.is_code_dedupe_required) === 1) {
                                                        isCodeDedupeRequired = true;
                                                    }
                                                    if (i.hasOwnProperty("is_name_dedupe_required") && Number(i.is_name_dedupe_required) === 1) {
                                                        isNameDedupeRequired = true;
                                                    }
                                                    break;
                        
                        case 'sub_industry': console.log(i.sub_industry);
                                             sohoSubIndustryFID = Number(i.sub_industry);
                                             sohoSubIndustrySubID = await getFieldDataComboIdUsingFieldIdV1(request,i.form_id,sohoSubIndustryFID);
                                             
                                             sohoSubIndustrySubFID = i.sub_industry_field_values[`${sohoSubIndustrySubID}`];
                                             sohoSubIndustryName = await getFieldValueUsingFieldIdV1(request,i.form_id,sohoSubIndustrySubFID);
                                             sohoSubIndustryName = await util.removeSpecialCharecters(sohoSubIndustryName);
                                             break;
                        case 'pan_number': console.log(i.pan_number);
                                           sohoPanNumber = i.pan_number;
                                           panNumber = await getFieldValueUsingFieldIdV1(request,i.form_id,sohoPanNumber);
                                            if (i.hasOwnProperty("is_pan_dedupe_required") && Number(i.is_pan_dedupe_required) === 1) {
                                                isPanDedupeRequired = true;
                                            }
                                           break;      
                        case 'gst_number': console.log(i.gst_number);
                                           sohoGstNumber = i.gst_number;
                                           gstNumber = await getFieldValueUsingFieldIdV1(request,i.form_id,sohoGstNumber);
                                            
                                           break;                 
                        
                        case 'micro_segment_turn_over': console.log(i.micro_segment_turn_over);
                                                        sohoTurnOverFID = Number(i.micro_segment_turn_over);
                                                        sohoTurnOver = await getFieldValueUsingFieldIdV1(request,i.form_id,sohoTurnOverFID);
                                                        console.log('sohoTurnOver --- ', sohoTurnOver);
                                                      break;
                    }
                }

                if (isCodeDedupeRequired || isPanDedupeRequired) {
                    console.log("pan number", panNumber)
                    if (panNumber != "") {
                        hasAccountCode = false;
                    }
                    accountCode += 'D-';
                    accountCode += ((sohoCompanyName.substr(0, 7)).padEnd(7, '0')).toUpperCase();

                    //4 digit sequential number, gets reset to 0000 after 9999
                    let sohoSeqNumber = await cacheWrapper.getSohoSeqNumber();
                    console.log('sohoSeqNumber : ', sohoSeqNumber);

                    if (Number(sohoSeqNumber) === 9999) {
                        await cacheWrapper.setSohoSeqNumber(0);
                        accountCode += '0000';
                    } else {
                        accountCode += (sohoSeqNumber.toString()).padStart(4, '0');
                    }

                    accountCode += '-'
                    accountCode += sohoTurnOver // turnover

                    console.log('soho Sub Industry Name : ', sohoSubIndustryName);
                    if (sohoSubIndustryName.toLowerCase() === 'others') {
                        accountCode += 'OTHERS'
                    } else {
                        accountCode += ((sohoSubIndustryName.substr(0, 3)).padEnd(5, '0')).toUpperCase(); //subindustry
                    }
                }

                break;
        }

        responseData.has_sequence_number = hasSeqNo;
        responseData.account_code = accountCode;
        responseData.panNumber = panNumber;
        responseData.gstNumber = gstNumber;
        responseData.hasAccountCode = hasAccountCode;
        responseData.account_title = accountTitle;
        responseData.is_name_dedupe_required = isNameDedupeRequired;
        responseData.is_code_dedupe_required = isCodeDedupeRequired;
        responseData.is_pan_dedupe_required = isPanDedupeRequired;

        return responseData;
    }


    async function checkAccountTitleDedupe(request, botInlineData) {
        let responseData = {};

        let activityTypeID = Number(request.activity_type_id);
        let isNameDedupeRequired = false;

        switch (activityTypeID) {
            case 149277://LA - Large Account                     
            case 150442://GE - VGE Segment
            case 150443: //Regular Govt/Govt SI Segment
            case 150254: //VICS - Carrier partner addition

                if (botInlineData.hasOwnProperty("is_name_dedupe_required") && Number(botInlineData.is_name_dedupe_required) === 1) {
                    isNameDedupeRequired = true;
                }
                break;


            case 149809: //SME
            case 150444: //SOHO                         

                for (const i of botInlineData) {
                    if (i.hasOwnProperty("is_name_dedupe_required") && Number(i.is_name_dedupe_required) === 1) {
                        isNameDedupeRequired = true;
                    }

                }
                break;

        }

        responseData.is_name_dedupe_required = isNameDedupeRequired;

        return responseData;
    }


    async function getFieldValueUsingFieldIdV1(request,formID,fieldID) {
        console.log(' ');
        console.log('*************************');
        console.log('request.form_id - ', request.form_id);
        console.log('formID - ', formID);
        console.log('fieldID - ', fieldID);

        let fieldValue = "";
        let formData;
      
            // console.log(request.form_id,formID)
        //Based on the workflow Activity Id - Fetch the latest entry from 713
        if(request.hasOwnProperty('workflow_activity_id') && Number(request.workflow_activity_id) > 0 && request.form_id != formID){
          try{
            formData = await getFormInlineData({
                organization_id: request.organization_id,
                account_id: request.account_id,
                workflow_activity_id: request.workflow_activity_id,
                form_id: formID
            },2);
        }
        catch(err){
            formData=[]
        }

        } else {
            //Take the inline data from the request
            formData = (typeof request.activity_inline_data === 'string') ? JSON.parse(request.activity_inline_data): request.activity_inline_data;
        }    

        // console.log('formData - ', formData);

        for(const fieldData of formData) {
            
            if(Number(fieldData.field_id) === fieldID) {
               
                console.log('fieldData.field_data_type_id : ',fieldData.field_data_type_id);
                switch(Number(fieldData.field_data_type_id)) {
                    //Need Single selection and Drop Down
                    //circle/ state

                    case 57: //Account
                        fieldValue = fieldData.field_value;
                        fieldValue = fieldValue.split('|')[1];
                        break;
                    //case 68: break;
                    default: fieldValue = fieldData.field_value;
                }
                break;
            }
        }
    
        console.log('Field Value B4: ',fieldValue);
        fieldValue = fieldValue.split(" ").join("");
        console.log('Field Value After: ',fieldValue);
        console.log('*************************');
        return fieldValue;
    }

    async function getFieldDataComboIdUsingFieldIdV1(request,formID,fieldID,sme) {
        console.log(' ');
        console.log('*************************');
        console.log('request.form_id - ', request.form_id);
        console.log('formID - ', formID);
        console.log('fieldID - ', fieldID);

        let fieldValue = "";
        let formData;
        
        //Based on the workflow Activity Id - Fetch the latest entry from 713
        if(request.hasOwnProperty('workflow_activity_id') && Number(request.workflow_activity_id) > 0 && request.form_id != formID){
            formData = await getFormInlineData({
                organization_id: request.organization_id,
                account_id: request.account_id,
                workflow_activity_id: request.workflow_activity_id,
                form_id: formID
            },2);
        } else {
            //Take the inline data from the request
            formData = (typeof request.activity_inline_data === 'string') ? JSON.parse(request.activity_inline_data): request.activity_inline_data;
        }    

        //console.log('formData - ', formData);

        for(const fieldData of formData) {
            if(Number(fieldData.field_id) === fieldID) {
               
                console.log('fieldData.field_data_type_id : ',fieldData);
                switch(Number(fieldData.field_data_type_id)) {
                    //Need Single selection and Drop Down
                    //circle/ state

                    case 57: //Account
                        fieldValue = fieldData.field_value;
                        fieldValue = fieldValue.split('|')[1];
                        break;
                    //case 68: break;
                    default: fieldValue=fieldData.data_type_combo_id;
                }
                break;
            }
        }
    

        console.log('Field Value B4: ',fieldValue);
        // fieldValue = fieldValue.split(" ").join("");
        // console.log('Field Value After: ',fieldValue);
        // console.log('*************************');
        return fieldValue;
    }

    async function getFormInlineData(request,flag) {
        //flag 
        // 1. Send the entire formdata 713
        // 2. Send only the submitted form_data
        //3. Send both

        let formData = [];
        let formDataFrom713Entry = await activityCommonService.getActivityTimelineTransactionByFormId713(request,request.workflow_activity_id,request.form_id);
        if(!formDataFrom713Entry.length > 0) {
            responseData.push({'message': `${i_iterator.form_id} is not submitted`});
            console.log('responseData : ',responseData);
            return [true,responseData];
        }

        //console.log('formDataFrom713Entry[0] : ', formDataFrom713Entry[0]);
        let formTransactionInlineData = JSON.parse(formDataFrom713Entry[0].data_entity_inline);
        //console.log('formTransactionInlineData form Submitted: ', formTransactionInlineData.form_submitted);
        formData = formTransactionInlineData.form_submitted;
        formData = (typeof formData === 'string') ? JSON.parse(formData) : formData;

        switch(Number(flag)) {
            case 1: return formDataFrom713Entry[0];
            case 2: return formData;
            case 3: break;
            default: return formData;
        }
    }

    async function checkWhetherAccountCodeExists(request,accountCode) {
        let error = false,
            responseData = [];
            let workFlowActivityID = request.workflow_activity_id || 0; 
        //accountCode = 'S-CCMOTO17317-2HARDW';
        console.log('Searching elastisearch for account-code : ',accountCode);
        const response = await client.search({
            index: global.config.elasticCrawlingAccountTable,
            body: {
                query: {
                    match: {activity_cuid_3: accountCode}
                    //"constant_score" : { 
                    //    "filter" : {
                    //        "term" : { 
                    //            "activity_cuid_3": accountCode
                    //        }
                    //    }
                    // }
                }
            }
        })

        console.log('response from ElastiSearch: ',response);
        let totalRetrieved = (response.hits.hits).length;
        console.log('Number of Matched Results : ',totalRetrieved);

        for(const i_iterator of response.hits.hits) {

            if(i_iterator._source.activity_cuid_3 === accountCode  && (Number(i_iterator._source.activity_id) !== Number(workFlowActivityID))) {
                responseData.push({'message': 'Found a Match!'});
                console.log('found a Match!');
            }
        }

        return [error,responseData];
    }

    this.setAtivityOwnerFlag = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.activity_id,
            request.target_asset_id,
            request.organization_id,
            request.owner_flag || 0,
            request.asset_id,
            util.getCurrentUTCTime()
        );

        let queryString = util.getQueryString('ds_v1_activity_asset_mapping_update_owner_flag',paramsArr);

        if(queryString !== '') {
            try {
                const data = await db.executeQueryPromise(0,queryString,request);
                await activityCommonService.insertAssetMappingsinElastic({...request,asset_id:request.target_asset_id})
                await botService.callAddTimelineEntry(request);
                
                responseData = data;
                error = false;
            } catch(e) {
                error = e;
            }
        }
        return [error,responseData];
    }

    this.groupAccountName = async (request) => {
        let error = false,
            //responseData = { 'message' : 'Something went wrong. Please try again later'}, 
            responseData = [],
            response = [];
        request.activityTitleExpression = request.activity_title.replace(/\s/g, '').toLowerCase();
        console.log('activityTitleExpression - ', request.activityTitleExpression);
        [error, response] = await elasticService.getAccountName({ activityTitleExpression : request.activityTitleExpression });

        console.log(response.hits.hits);

        let flagFound = 0;
        for(const i_iterator of response.hits.hits) {
            console.log(request.activityTitleExpression, '-' ,i_iterator._source.activity_title_expression);
            if(i_iterator._source.activity_title_expression === request.activityTitleExpression) {
                error = true;
                responseData.push({'message': `Found a Match! ${request.activityTitleExpression}`});
                flagFound = 1;
                console.log('found a Match!');
                break;
            }
        }

        if(flagFound === 0) {
            responseData.push({'generated_group_account_name': request.activityTitleExpression});
        }

        /*if(!error) {
            if(response.hits.hits.length){
                console.log(response);
                error = true;
                //responseData = {'message': 'Found a Match!'};
                responseData.push({'message': `Found a Match! ${request.activityTitleExpression}`});
            } else {
                //[error, response] = await elasticService.insertAccountName(request);
                if(!error) {
                    request.expression = request.activityTitleExpression;
                    //activityCommonService.activityUpdateExpression(request);
                    //responseData = {'generated_group_account_name': request.activityTitleExpression};
                    responseData.push({'generated_group_account_name': request.activityTitleExpression});
                } else {
                    error = true;
                }
            }
        } else {
            error = true;
        }*/

        return [error,responseData];
    }

    async function getFieldValueUsingFieldIdV2(request,formID,fieldID) {
        console.log(' ');
        console.log('*************************');
        console.log('request.form_id - ', request.form_id);
        console.log('formID - ', formID);
        console.log('fieldID - ', fieldID);

        let fieldValue = "";
        let formData;
      
            // console.log(request.form_id,formID)
        //Based on the workflow Activity Id - Fetch the latest entry from 713
        if(request.hasOwnProperty('workflow_activity_id') && Number(request.workflow_activity_id) > 0 && request.form_id != formID){
          try{
            formData = await getFormInlineData({
                organization_id: request.organization_id,
                account_id: request.account_id,
                workflow_activity_id: request.workflow_activity_id,
                form_id: formID
            },2);
        }
        catch(err){
            formData=[]
        }

        } else {
            //Take the inline data from the request
            formData = (typeof request.activity_inline_data === 'string') ? JSON.parse(request.activity_inline_data): request.activity_inline_data;
        }    

        // console.log('formData - ', formData);

        for(const fieldData of formData) {
            
            if(Number(fieldData.field_id) === fieldID) {
               
                console.log('fieldData.field_data_type_id : ',fieldData.field_data_type_id);
                switch(Number(fieldData.field_data_type_id)) {
                    //Need Single selection and Drop Down
                    //circle/ state

                    case 57: //Account
                        fieldValue = fieldData.field_value;
                        //console.log('57 - fieldValue: ', fieldValue);
                        //fieldValue = fieldValue.split('|')[1];
                        break;
                    //case 68: break;
                    default: fieldValue = fieldData.field_value;
                }
                break;
            }
        }
    
        console.log('Field Value : ',fieldValue);
        //fieldValue = fieldValue.split(" ").join("");
        //console.log('Field Value After: ',fieldValue);
        console.log('*************************');
        return fieldValue;
    }
    

    this.panElasticEntry = async (request) => {
       await client.index({
            index: global.config.elasticCrawlingAccountTable,
            body: {
                activity_cuid_3: '',
                activity_type_id: Number(request.activity_type_id),
                workforce_id: Number(request.workforce_id),
                account_id: Number(request.account_id),
                activity_id: Number(request.workflow_activity_id),
                asset_id: Number(request.asset_id),
                activity_cuid_1:request.pan_number
                //operating_asset_first_name: "Sagar Pradhan",
                //activity_title: "GALAXY MEDICATION",
                //activity_type_name: "Account Management - SME",
                //asset_first_name: "Channel Head",
                //operating_asset_id: 44574,
            }
        });

        return [true,[]]
    }

    this.getActivityPreviousStatusList = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_id,
            request.current_activity_status_id,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_v2_activity_status_change_txn_select_previous_status', paramsArr);
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
    
    this.workforceActivityTypeMappingUpdateFlag = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_id,
            request.activity_type_arp_lead_setting_enabled,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_update_arp_flag', paramsArr);
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

}

module.exports = ActivityConfigService;
