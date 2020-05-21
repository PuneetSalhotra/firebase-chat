/*
 * author: Sri Sai Venkatesh
 */
const AdminOpsService = require('../Administrator/services/adminOpsService');
const logger = require('../logger/winstonLogger');

function ActivityConfigService(db, util, objCollection) {
    const adminOpsService = new AdminOpsService(objCollection);
    const self = this;

    this.getWorkforceActivityTypesList = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_v1_workforce_activity_type_mapping_select', paramsArr);

        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    // got data now parse it..                    

                    formatActivityTypesList(data, function (err, data) {
                        if (err === false)
                            callback(false, {
                                data: data
                            }, 200);
                    });
                    //callback(false, data, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }

    };

    this.getWorkforceActivityStatusList = function (request, callback) {

        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_v1_workforce_activity_status_mapping_select', paramsArr);

        //console.log(queryString);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    // got data now parse it..                    

                    formatActivityStatusList(data, function (err, data) {
                        if (err === false)
                            callback(false, {
                                data: data
                            }, 200);
                    });
                    //callback(false, data, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        };
    };

    this.getActivityParticipantAccess = function (request, callback) {
        var productId = (request.hasOwnProperty('product_id')) ? request.product_id : 1;
        var paramsArr = new Array(
            request.page_start,
            util.replaceQueryLimit(request.page_limit),
            productId
        );
        var queryString = util.getQueryString('ds_v1_1_activity_participant_access_master_select', paramsArr);

        //console.log(queryString);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    // got data now parse it..                    
                    callback(false, {
                        data: data
                    }, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        };
    };

    var formatActivityTypesList = function (data, callback) {
        var responseData = new Array();
        data.forEach(function (rowData, index) {

            var rowDataArr = {
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
        }, this);
        callback(false, responseData);

    };

    var formatActivityStatusList = function (data, callback) {
        var responseData = new Array();
        if (Object.prototype.toString.call(data[0]) === '[object Array]' || Object.prototype.toString.call(data[0]) === '[object Object]') {
            data.forEach(function (rowData, index) {
                var rowDataArr = {
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
            }, this);
        }
        callback(false, responseData);
    };

    this.workForceActivityTypeInsert = (request) => {
        return new Promise((resolve, reject) => {
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
                request.activity_type_flag_control_visibility || 0
            );
            //var queryString = util.getQueryString('ds_p1_1_workforce_activity_type_mapping_insert', paramsArr);
            const queryString = util.getQueryString('ds_p1_3_workforce_activity_type_mapping_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        request['activity_type_id'] = data[0].activity_type_id;
                        request['update_type_id'] = 0;
                        workForceActivityTypeHistoryInsert(request).then(() => { });

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
        return new Promise((resolve, reject) => {
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
                request.activity_type_flag_control_visibility || 0
            );
            //var queryString = util.getQueryString('ds_p1_1_workforce_activity_type_mapping_update', paramsArr);
            const queryString = util.getQueryString('ds_p1_3_workforce_activity_type_mapping_update', paramsArr);            
            if (queryString != '') {
                db.executeQuery(0, queryString, request, async (err, data) => {
                    if (err === false) {
                        // Update the default workflow duration as well
                        try {
                            await adminOpsService.updateActivityTypeDefaultDuration(request);
                        } catch (error) {
                            console.log("[ERROR] workForceActivityTypeUpdate | updateActivityTypeDefaultDuration: ", error);
                        }
                        //update the activity_type_flag_control_visibility
                        try {
                            await activityListUpdateVisibilityFlag(request);
                            await activityAssetUpdateVisibilityFlag(request);
                        } catch (error) {
                            console.log("[ERROR] workForceActivityTypeUpdate | updateActivityTypeDefaultDuration: ", error);
                        }

                        try {
                            if (request.tag_id && Number(request.tag_id) >= 0) {
                                try {
                                    self.workforceActivityTypeMappingUpdateTag(request);
                                } catch (error) {
                                    console.log("workForceActivityTypeUpdate | workforceActivityTypeMappingUpdateTag | Error: ", error);
                                }
                            }
                        } catch (error) {
                            console.log("[ERROR] workForceActivityTypeUpdate | updateActivityTypeDefaultDuration: ", error);
                        }                            
                        request['update_type_id'] = 901;
                        workForceActivityTypeHistoryInsert(request).then(() => { });
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.workForceActivityTypeDelete = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_type_id,
                request.asset_id,
                request.datetime_log
            );
            var queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_delete', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        request['update_type_id'] = 902;
                        workForceActivityTypeHistoryInsert(request).then(() => { });
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    function workForceActivityTypeHistoryInsert(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.activity_type_id,
                request.organization_id,
                request.update_type_id,
                request.datetime_log || util.getCurrentUTCTime()
            );
            var queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_history_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : resolve(err);
                });
            }
        });
    }

    this.listProcessesByAccessLevel = async function (request) {
        let error = false;

        let tagMappingDataMap = new Map();
        const [errorOne, tagMappingData] = await activityTypeTagMappingSelect(request);
        for (const mapping of tagMappingData) {
            tagMappingDataMap.set(Number(mapping.activity_type_id), mapping);
        }

        let activityTypeData = await self.getAccessLevelActivityTypeList(request);
        try {
            activityTypeData = activityTypeData.map(activityType => {
                if (tagMappingDataMap.has(Number(activityType.activity_type_id))) {
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
        } catch (error) {
            logger.error("Error appending tag mapping data to process list", { type: "ActivityConfigService", request_body: request, error });
        }
        return [error, activityTypeData];
    }

    this.getAccessLevelActivityTypeList = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.access_level_id,
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_type_category_id,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );

            var queryString = util.getQueryString('ds_p1_1_workforce_activity_type_mapping_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log("err "+err);
                    if (err === false) {
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
        const queryString = util.getQueryString('ds_p1_activity_type_tag_mapping_select', paramsArr);

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

    this.getEntityActivityStatusList = function (request) {
        // IN p_organization_id bigint(20), IN p_account_id bigint(20), IN p_workforce_id bigint(20), 
        // IN p_activity_type_category_id SMALLINT(6), IN p_activity_type_id BIGINT(20), IN p_flag TINYINT(4), 
        // IN p_log_datetime DATETIME, IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
        //flag = 1 - Only parent statuses
        //flag = 2 - Both parent and substatus
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
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

            var queryString = util.getQueryString('ds_p1_1_workforce_activity_status_mapping_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log("err "+err);
                    if (err === false) {
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
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
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

            var queryString = util.getQueryString('ds_p1_communication_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log("err "+err);
                    if (err === false) {
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
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_status_id,
                request.asset_id,
                request.datetime_log
            );
            var queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_delete', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        request['update_type_id'] = 1502;
                        workForceActivityStatusHistoryInsert(request).then(() => { });
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    }

    function workForceActivityStatusHistoryInsert(request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.activity_status_id,
                request.organization_id,
                request.update_type_id,
                request.datetime_log
            );
            var queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_history_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }

    this.workForceActivityStatusInsert = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
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
            const queryString = util.getQueryString('ds_p1_2_workforce_activity_status_mapping_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        request['activity_status_id'] = data[0].activity_status_id;
                        request['update_type_id'] = 0;
                        workForceActivityStatusHistoryInsert(request).then(() => { });

                        // Update the status tag mapping
                        // >0 => Map
                        // 0 => Unmap
                        if (request.activity_status_tag_id && Number(request.activity_status_tag_id) >= 0) {
                            try {
                                workforceActivityStatusMappingUpdateTag(request, request.organization_id, request.account_id, request.workforce_id);
                            } catch (error) {
                                console.log("workForceActivityStatusInsert | workforceActivityStatusMappingUpdateTag | Error: ", error);
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
    async function workforceActivityStatusMappingUpdateTag(request, organizationID, accountID, workforceID) {
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
        const queryString = util.getQueryString('ds_p1_workforce_activity_status_mapping_update_tag', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;

                    let reqObj = Object.assign({},request);

                    reqObj.tag_id = request.activity_status_tag_id;
                    reqObj.tag_type_category_id = 4;
                    if(request.activity_status_tag_id > 0){
                        adminOpsService.tagEntityMappingInsertDBCall(reqObj);
                    }else{
                        adminOpsService.tagEntityMappingDeleteV1(reqObj);
                    }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.workForceActivityStatusUpdate = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_status_id,
                request.activity_status_name,
                request.activity_status_sequence_id,
                request.is_cusotmer_exposed,
                request.asset_id,
                request.datetime_log
            );
            var queryString = util.getQueryString('ds_p1_1_workforce_activity_status_mapping_update', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        request['update_type_id'] = 1501;

                        // Update the status tag mapping
                        // >0 => Map
                        // 0 => Unmap
                        if (request.activity_status_tag_id && Number(request.activity_status_tag_id) >= 0) {
                            try {
                                workforceActivityStatusMappingUpdateTag(request, request.organization_id, request.account_id, request.workforce_id);
                            } catch (error) {
                                console.log("workForceActivityStatusUpdate | workforceActivityStatusMappingUpdateTag | Error: ", error);
                            }
                        }

                        workForceActivityStatusHistoryInsert(request).then(() => { });
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

        let [error, subStatusData] = await activitySubStatusMappingSelect(request, organizationID, accountID, workforceID);
        return [error, subStatusData];
    }

    // List sub-statuses mapped to an activity
    async function activitySubStatusMappingSelect(request, organizationID, accountID, workforceID) {
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
        const queryString = util.getQueryString('ds_v1_activity_sub_status_mapping_select', paramsArr);

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
        const queryString = util.getQueryString('ds_p1_activity_list_update_visibility_flag', paramsArr);

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
        const queryString = util.getQueryString('ds_p1_activity_asset_mapping_update_visibility_flag', paramsArr);

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

     this.checkDuplicate = async function(request){
        let error = true,
            responseData = [], 
            finalResponse = {"account_exists": true, "expression": "", "check_with": ""},
            botError, 
            botData = [],
            panNumberField = 0,
            panNumber = "";

        try{
            // get the bot
            request.bot_operation_type_id = 22;
            request.start_from = 0;
            request.limit_value = 1;
            [botError, botData] = await self.botOperationMappingSelectOperationType(request);

            if(botData.length > 0){
                panNumberField = JSON.parse(botData[0].bot_operation_inline_data).dedupe.pan_number;
            }

            request.pan_number_field = panNumberField;

            console.log("panNumberField :: " , request.pan_number_field);

            panNumber = await self.getFieldValueUsingFieldId(request);

            console.log("panNumber :: ", panNumber);

            let customerTitle = request.customer_title;
                customerTitle = customerTitle.toLowerCase().replace(/pvt/gi,'private').replace(/ltd/gi, 'limited').replace(/\s+/gi, '');
                customerTitle = customerTitle.split(' ').join('')
                console.log("customerTitle :: "+customerTitle);
            
            finalResponse.expression =  customerTitle;

            if(panNumber.trim() != ""){
                //check on pan number
                finalResponse.check_with = "pan_number";
                request.search_string = panNumber.trim();
                request.flag = 0;
                [error, responseData] = await self.searchDuplicateWorkflow(request);
            }/*else{
                //check on title
                finalResponse.check_with = "customer_title";
                request.search_string = customerTitle;
                request.flag = 4;
                [error, responseData] = await self.searchDuplicateWorkflow(request);
            }*/
            if(responseData.length > 0){
                finalResponse.account_exists = true; 
            }else{
                finalResponse.account_exists = false;
            }
        }catch(e){
           console.log("[ERROR] checkDuplicate: ", e);
        }
        return [error, finalResponse];
    }


    this.searchDuplicateWorkflow = async function(request){
        let error = true,
         responseData = [];

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

        var queryString = util.getQueryString('ds_p1_1_bot_operation_mapping_select_operation_type', paramsArr);
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

    this.getFieldValueUsingFieldId = async (request) => {

        let fieldValue = "";

        let inlineData = JSON.parse(request.activity_inline_data);
        for(let i=0; i<inlineData.length;i++) {
            //console.log(inlineData[i].field_id+" : "+request.pan_number_field);
            if(inlineData[i].field_id == request.pan_number_field){
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
        const queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_update_tag', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;

                    let reqObj = Object.assign({},request);

                    reqObj.tag_type_category_id = 1;
                    if(request.tag_id > 0){
                        adminOpsService.tagEntityMappingInsertDBCall(reqObj);
                    }else{
                        adminOpsService.tagEntityMappingDeleteV1(reqObj);
                    }
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
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

        var queryString = util.getQueryString('ds_v1_activity_asset_mapping_select_configs', paramsArr);
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

}

module.exports = ActivityConfigService;
