/*
 * author: Sri Sai Venkatesh
 */


function WidgetService(objCollection) {
    var db = objCollection.db;
    var util = objCollection.util;
    //var cacheWrapper = objCollection.cacheWrapper;
    this.getTimecardWidgetCollection = function (request, callback) {
        //IN p_organization_id BIGINT(20), IN p_form_id BIGINT(20), IN p_start_from INT(11), IN p_limit_value TINYINT(4)
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            19, //form_type_id
            9, //form_type_category_id
            5 //widget_access_level_id                
        );

        var queryString = util.getQueryString('ds_v1_widget_list_select_asset_form_type', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    formatWidgetListing(data, function (err, finalData) {
                        if (err === false) {
                            callback(false, {
                                data: finalData
                            }, 200);
                        }
                    });
                    return;
                    //callback(false, data, 200);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false);
                }
            });
        }
    };

    this.getAssetWidgetTimeline = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            19, //form_type_id is 19 by static
            9, //form_type_category_id is 9 by static
            5 //widget_access_level_id                
        );

        var queryString = util.getQueryString('ds_v1_widget_list_select_asset_form_type', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    //console.log('data[0]: length', data.length)
                    if (data.length > 0) {
                        widgetTransactionSelect(request, data[0], function (err, responseArr) {
                            if (!err && responseArr.length > 0) {
                                callback(false, responseArr, 200);
                            } else if (!err && responseArr.length === 0) {
                                callback(false, {}, 200);
                            } else {
                                callback(err, {}, -9998);
                            }
                        });
                    } else {
                        callback(false, {}, 200);
                    }
                }
            });
        }
    };

    this.getWorkforceWidgetTimeline = function (request, callback) {
        var responseArr = new Array();
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            19, //form_type_id is 19 by static
            9, //form_type_category_id is 9 by static
            5, //widget_access_level_id      
            2, //asset_type_category_id
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );

        var queryString = util.getQueryString('ds_v1_widget_list_select_workforce_form_type', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, widgetData) {
                if (err === false) {
                    objCollection.forEachAsync(widgetData, function (next, rowData) {
                        widgetTransactionSelect(request, rowData, function (err, widgetArr) {

                            if ((!err) && widgetArr.length > 0) {
                                var tmpCollection = {};
                                tmpCollection["asset_id"] = rowData.asset_id;
                                tmpCollection.widget_timeline = widgetArr;
                                responseArr.push(tmpCollection);
                                next();
                            } else if (err) {
                                callback(err, {}, -9998);
                                return;
                            } else {
                                next();
                            }

                            //console.log(widgetArr);
                            global.logger.write('conLog', widgetArr, {}, request);
                        });
                    }).then(function () {
                        callback(false, responseArr, 200);
                    });
                } else {
                    callback(err, {}, -9998);
                }

            });
        }
    };

    var widgetTransactionSelect = function (request, data, callback) {

        var responseArr = new Array();
        var paramsArr = new Array(
            request.organization_id,
            request.asset_id,
            data.widget_id,
            request.date_start,
            request.date_end,
            data.widget_entity2_data_type_id,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_v1_widget_transaction_select_sum_date_range', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, widgetData) {
                if (err === false && widgetData.length > 0) {
                    objCollection.forEachAsync(widgetData, function (next, rowData) {
                        var tmpResponse = {
                            total_hours: util.replaceDefaultNumber(rowData['total_hours']),
                            widget_axis_x_value_date: util.replaceDefaultDate(rowData['widget_axis_x_value_date']),
                        };
                        responseArr.push(tmpResponse);
                        next();
                    }).then(function () {
                        callback(false, responseArr);
                    });
                } else if (widgetData.length === 0) {
                    callback(false, {});
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, {});
                }
            });
        }
    };


    var formatWidgetListing = function (data, callback) {
        var responseData = new Array();
        data.forEach(function (rowData, index) {
            var rowDataArr = {
                "widget_mapping_id": util.replaceDefaultNumber(rowData['widget_mapping_id']),
                "widget_id": util.replaceDefaultNumber(rowData['widget_id']),
                "widget_name": util.replaceDefaultString(util.ucfirst(util.decodeSpecialChars(rowData['widget_name']))),
                "widget_description": util.replaceDefaultString(util.decodeSpecialChars(rowData['widget_description'])),
                "widget_type_id": util.replaceDefaultNumber(rowData['widget_type_id']),
                "widget_type_name": util.replaceDefaultString(rowData['widget_type_name']),
                "widget_type_category_id": util.replaceDefaultNumber(rowData['widget_type_category_id']),
                "widget_type_category_name": util.replaceDefaultString(rowData['widget_type_category_name']),
                "widget_aggregate_id": util.replaceDefaultNumber(rowData['widget_aggregate_id']),
                "widget_aggregate_name": util.replaceDefaultString(rowData['widget_aggregate_name']),
                "widget_chart_id": util.replaceDefaultNumber(rowData['widget_chart_id']),
                "widget_chart_name": util.replaceDefaultString(rowData['widget_chart_name']),
                "widget_timeline_id": util.replaceDefaultNumber(rowData['widget_timeline_id']),
                "widget_timeline_name": util.replaceDefaultString(rowData['widget_timeline_name']),
                "widget_timeline_interval": util.replaceDefaultNumber(rowData['widget_timeline_interval']),
                "widget_entity1_id": util.replaceDefaultNumber(rowData['widget_entity1_id']),
                "widget_entity1_name": util.replaceDefaultString(rowData['widget_entity1_name']),
                "widget_entity1_data_type_id": util.replaceDefaultNumber(rowData['widget_entity1_data_type_id']),
                "widget_entity1_data_type_name": util.replaceDefaultString(rowData['widget_entity1_data_type_name']),
                "widget_entity1_data_type_category_id": util.replaceDefaultNumber(rowData['widget_entity1_data_type_category_id']),
                "widget_entity1_data_type_category_name": util.replaceDefaultString(rowData['widget_entity1_data_type_category_name']),
                "widget_entity2_id": util.replaceDefaultNumber(rowData['widget_entity2_id']),
                "widget_entity2_name": util.replaceDefaultString(rowData['widget_entity2_name']),
                "widget_entity2_data_type_id": util.replaceDefaultNumber(rowData['widget_entity2_data_type_id']),
                "widget_entity2_data_type_name": util.replaceDefaultString(rowData['widget_entity2_data_type_name']),
                "widget_entity2_data_type_category_id": util.replaceDefaultNumber(rowData['widget_entity2_data_type_category_id']),
                "widget_entity2_data_type_category_name": util.replaceDefaultString(rowData['widget_entity2_data_type_category_name']),
                "widget_entity3_id": util.replaceDefaultNumber(rowData['widget_entity3_id']),
                "widget_entity3_name": util.replaceDefaultString(rowData['widget_entity3_name']),
                "widget_entity3_data_type_id": util.replaceDefaultNumber(rowData['widget_entity3_data_type_id']),
                "widget_entity3_data_type_name": util.replaceDefaultString(rowData['widget_entity3_data_type_name']),
                "widget_entity3_data_type_category_id": util.replaceDefaultNumber(rowData['widget_entity3_data_type_category_id']),
                "widget_entity3_data_type_category_name": util.replaceDefaultString(rowData['widget_entity3_data_type_category_name']),
                "widget_entity4_id": util.replaceDefaultNumber(rowData['widget_entity4_id']),
                "widget_entity4_name": util.replaceDefaultString(rowData['widget_entity4_name']),
                "widget_entity4_data_type_id": util.replaceDefaultNumber(rowData['widget_entity4_data_type_id']),
                "widget_entity4_data_type_name": util.replaceDefaultString(rowData['widget_entity4_data_type_name']),
                "widget_entity4_data_type_category_id": util.replaceDefaultNumber(rowData['widget_entity4_data_type_category_id']),
                "widget_entity4_data_type_category_name": util.replaceDefaultString(rowData['widget_entity4_data_type_category_name']),
                "widget_entity5_id": util.replaceDefaultNumber(rowData['widget_entity5_id']),
                "widget_entity5_name": util.replaceDefaultString(rowData['widget_entity5_name']),
                "widget_entity5_data_type_id": util.replaceDefaultNumber(rowData['widget_entity5_data_type_id']),
                "widget_entity5_data_type_name": util.replaceDefaultString(rowData['widget_entity5_data_type_name']),
                "widget_entity5_data_type_category_id": util.replaceDefaultNumber(rowData['widget_entity5_data_type_category_id']),
                "widget_entity5_data_type_category_name": util.replaceDefaultString(rowData['widget_entity5_data_type_category_name']),
                "activity_id": util.replaceDefaultNumber(rowData['activity_id']),
                "activity_type_id": util.replaceDefaultNumber(rowData['activity_type_id']),
                "activity_type_category_id": util.replaceDefaultNumber(rowData['activity_type_category_id']),
                "asset_id": util.replaceZero(rowData['asset_id']),
                "workforce_id": util.replaceZero(rowData['workforce_id']),
                "account_id": util.replaceZero(rowData['account_id']),
                "organization_id": util.replaceZero(rowData['organization_id']),
                "log_asset_id": util.replaceZero(rowData['log_asset_id'])
            };
            responseData.push(rowDataArr);
        }, this);
        callback(false, responseData);
    };


    this.widgetAccessLevelList = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_id,
                request.activity_id,
                request.form_id,
                request.entity_level_id,
                request.is_search,
                request.search_string,
                request.sort_flag,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );

            var queryString = util.getQueryString('ds_v1_widget_entity_mapping_select_level', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log("err "+err);
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.widgetTransactionSelectAll = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.widget_id,
                request.widget_timeline_id,
                request.widget_aggregate_id,
                request.start_date,
                request.end_date,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );

            var queryString = util.getQueryString('ds_v1_widget_transaction_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log("err "+err);
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };

    this.widgetAccessList = function (request) {
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_id,
                request.activity_id,
                request.form_id,
                request.activity_type_id,
                request.access_level_id,
                request.page_start,
                util.replaceQueryLimit(request.page_limit)
            );

            var queryString = util.getQueryString('ds_p1_widget_list_select_form_activity_type', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    //console.log("err "+err);
                    if (err === false) {
                        resolve(data);
                    } else {
                        reject(err);
                    }
                });
            }
        });
    };


    this.widgetListInsert = async function (request) {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.widget_name,
            request.widget_description,
            request.widget_type_id,
            request.widget_aggregate_id,
            request.widget_chart_id,
            request.widget_timeline_id,
            request.entity1_id,
            request.entity2_id,
            request.entity3_id,
            request.entity4_id,
            request.entity5_id,
            request.timezone_id,
            request.access_level_id,
            request.widget_owner_asset_id,
            request.activity_id,
            request.activity_type_id,
            request.asset_id,
            request.asset_type_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.log_asset_id,
            request.log_workforce_id,
            request.log_datetime
        );

        var queryString = util.getQueryString('ds_p1_widget_list_insert', paramsArr);
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

    this.widgetMappingDelete = async function (request) {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.widget_mapping_id,
            request.organization_id,
            3,
            request.asset_id,
            request.log_datetime
        );

        var queryString = util.getQueryString('ds_p1_widget_entity_mapping_update_log_state', paramsArr);
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

    this.widgetUpdate = async function (request) {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.widget_id,
            request.widget_name,
            request.asset_id,
            request.log_datetime
        );

        var queryString = util.getQueryString('ds_p1_1_widget_list_update_name', paramsArr);
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

    this.widgetEntityShareInsert = async function (request) {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.widget_id,
            request.access_level_id,
            request.activity_id,
            // request.activity_type_id||0,
            request.user_asset_id,
            request.asset_type_id,
            request.workforce_id,
            request.account_id,
            request.organization_id,
            request.asset_id,
            request.log_datetime
        );

        var queryString = util.getQueryString('ds_p1_widget_entity_mapping_insert', paramsArr);
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

    this.widgetAccessLevelEntityList = async function (request) {

        let responseData = [],
            error = true;

        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.user_asset_id,
            request.activity_id,
            request.activity_type_id,
            request.form_id,
            request.entity_level_id,
            request.is_search,
            request.search_string,
            request.sort_flag,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );

        var queryString = util.getQueryString('ds_v1_widget_entity_mapping_select_level_all', paramsArr);
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

    this.widgetDelete = async function (request) {

        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.widget_id,
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.log_datetime
        );

        var queryString = util.getQueryString('ds_p1_widget_list_delete', paramsArr);
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

    this.widgetEntityMappingSelectAssetActivityTypes = async function (request) {

        let responseData = [],
            error = true;

        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20), 
        // IN p_sort_flag TINYINT(4), IN p_start_from INT(11), 
        // IN p_limit_value TINYINT(4)
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.sort_flag || 0,
            Number(request.page_start) || 0,
            util.replaceQueryLimit(Number(request.page_limit))
        );

        var queryString = util.getQueryString('ds_p1_widget_entity_mapping_select_asset_activity_types', paramsArr);
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

    this.widgetEntityMappingSelectAssetActivityTypeWidgets = async function (request) {

        let responseData = [],
            error = true;

        // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), 
        // IN p_workforce_id BIGINT(20), IN p_asset_id BIGINT(20), 
        // IN p_activity_type_id BIGINT(20), IN p_sort_flag TINYINT(4), 
        // IN p_start_from INT(11), IN p_limit_value TINYINT(4)
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.asset_id,
            request.activity_type_id,
            request.sort_flag || 0,
            Number(request.page_start) || 0,
            util.replaceQueryLimit(Number(request.page_limit))
        );

        var queryString = util.getQueryString('ds_p1_widget_entity_mapping_select_asset_activity_type_widgets', paramsArr);
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

    //Get the count of files mapped to a specific activity type and that are set to a specific status type or status
    //Bharat Masimukku
    //2019-02-09
    this.getActivitiesStatusCount = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;

            paramsArray = 
            new Array
            (
                Number(request.flag),
                Number(request.organization_id),
                Number(request.activity_type_id),
                Number(request.activity_status_type_id),
                Number(request.activity_status_id),                
                request.date_start,
                request.date_end,
            );

            results[0] = db.callDBProcedure(request, 'ds_p1_activity_list_select_activity_type_status_counts', paramsArray, 1);
            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    //Get the list of files mapped to a specific activity type and that are set to a specific status type or status
    //Bharat Masimukku
    //2019-02-09
    this.getActivitiesStatusList = 
    async (request) => 
    {
        try
        {
            let results = new Array();
            let paramsArray;

            paramsArray = 
            new Array
            (
                Number(request.flag),
                Number(request.organization_id),
                Number(request.activity_type_id),
                Number(request.activity_status_type_id),
                Number(request.activity_status_id),                
                request.date_start,
                request.date_end,
                Number(request.flag_sort),
                Number(request.page_start),
                util.replaceQueryLimit(Number(request.page_limit)),
            );

            results[0] = db.callDBProcedure(request, 'ds_p1_activity_list_select_activity_type_status', paramsArray, 1);
            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };

    this.getOrgLevelWorkflowStatusWiseCount = async (request) => {
        try {
            let responseData = {},
                error = true;

            let paramsArray;

            paramsArray =
                new Array(
                    Number(request.organization_id),
                    Number(request.account_id),
                    Number(request.workforce_id),
                    Number(request.target_asset_id),
                    request.flag,
                    request.start_datetime,
                    request.end_datetime,
                    request.activity_type_id || 0,
                    request.activity_type_tag_id || 0,
                    request.tag_type_id || 0,
                    request.workforce_type_id || 0
                );

            // results = db.callDBProcedure(request, 'ds_p1_activity_list_select_count_workflow_status_date', paramsArray, 1);
            var queryString = util.getQueryString('ds_p1_3_activity_list_select_count_workflow_status_date', paramsArray);
            if (queryString !== '') {
                await db.executeQueryPromise(1, queryString, request)
                    .then((data) => {   
                    //responseData = data;
                       responseData.date_wise = data;
                        //console.log('responseData :: ',responseData);
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    })
            }
            
            paramsArray[4]=1;
            var queryString1 = util.getQueryString('ds_p1_3_activity_list_select_count_workflow_status_date', paramsArray);
            if (queryString !== '') {
                await db.executeQueryPromise(1, queryString1, request)
                    .then((monthlyData) => {
                       // responseData[0] = monthlyData[0].widget_axis_y_value_integer;
                        responseData.total = monthlyData[0];
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    })
            }  
            return responseData;
        } catch (error) {
            return Promise.reject(error);
        }
    };


 this.getOrgLevelWorkflowStatusWiseAggr = async (request) => {
        try {
            let responseData = {},
                error = true;

            let paramsArray;

            paramsArray =
                new Array(
                    Number(request.organization_id),
                    Number(request.account_id),
                    Number(request.workforce_id),
                    Number(request.target_asset_id),
                    request.flag,
                    request.start_datetime,
                    request.end_datetime,
                    request.activity_type_id || 0,
                    request.activity_type_tag_id || 0,
                    request.tag_type_id || 0,
                    request.workforce_type_id || 0
                );

            var queryString = util.getQueryString('ds_p1_3_widget_activity_field_transaction_select_sum_status_date', paramsArray);
            if (queryString !== '') {
                await db.executeQueryPromise(1, queryString, request)
                    .then((data) => {                       
                        //responseData = data;
                        responseData.date_wise = data;
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    });
            }
            
            paramsArray[4]=1;            
            if(request.flag == 6 || request.flag == 7){
                paramsArray[4]=10;
            }
            var queryString1 = util.getQueryString('ds_p1_3_widget_activity_field_transaction_select_sum_status_date', paramsArray);
            if (queryString !== '') {
                await db.executeQueryPromise(1, queryString1, request)
                    .then((monthlyData) => {
                         responseData.total = monthlyData[0];
                        error = false;
                    })
                    .catch((err) => {
                        error = err;
                    })
            } 
            return responseData;

        } catch (error) {
            return Promise.reject(error);
        }
    };
    
    this.fieldTrxAvgTime = async (request) => {            
        if(Number(request.flag) === 0) {            
            let i;
            let result;
            //let finalResult = 0;
            let response = [];
            //let resp = {};
            for(i=1;i<5;i++) {
                result = await retrievefieldTrxAvgTime(request, i);
                if(result.length > 0) {
                    //console.log(result[0].widget_axis_y_value_decimal);
                    //finalResult += result[0].widget_axis_y_value_decimal || 0;
                    //response.widget_axis_y_value_decimal_1 = result[0].widget_axis_y_value_decimal;
                    let resp = {};
                    switch(i) {
                        case 1: resp.key = 'po_order_submission_tat';
                                resp.value = result[0].widget_axis_y_value_decimal || 0;
                                resp.label = 'P.O to order submission';                                
                                response.push(resp);
                                break;
                        case 2: resp.key = 'order_submission_logged_tat';
                                resp.value = result[0].widget_axis_y_value_decimal || 0;
                                resp.label = 'Order Submission to order logged';                                
                                response.push(resp);
                                break;
                        /*case 3: resp.key = 'caf_approval_logged_tat';
                                resp.value = result[0].widget_axis_y_value_decimal || 0;
                                resp.label = 'CAF Approval Logged';
                                break;*/
                        case 4: resp.key = 'order_po_logged_tat';
                                resp.value = result[0].widget_axis_y_value_decimal || 0;
                                resp.label = 'P.O To order Logged';
                                response.push(resp);
                                break;
                    }
                    
                }
            }             
            return response;
        } else {
            let paramsArr = new Array(
                request.organization_id, 
                request.account_id, 
                request.workforce_id, 
                request.target_asset_id,            
                request.flag || 1, 
                request.start_datetime,
                request.end_datetime,
                request.activity_type_id, 
                request.activity_type_tag_id,
                request.tag_type_id, 
                request.workforce_type_id
            );
            let queryString = util.getQueryString('ds_p1_3_widget_activity_field_transaction_select_avg_time', paramsArr);
            if (queryString != '') {                
                return await (db.executeQueryPromise(1, queryString, request));
            }
        }        
    };

    async function retrievefieldTrxAvgTime(request, flag){
        let paramsArr = new Array(
            request.organization_id, 
            request.account_id, 
            request.workforce_id, 
            request.target_asset_id,            
            flag, 
            request.start_datetime,
            request.end_datetime,
            request.activity_type_id, 
            request.activity_type_tag_id,
            request.tag_type_id, 
            request.workforce_type_id
        );
        let queryString = util.getQueryString('ds_p1_3_widget_activity_field_transaction_select_avg_time', paramsArr);
        if (queryString != '') {                
            return await (db.executeQueryPromise(1, queryString, request));
        }
    }

 this.getOrgLevelWorkflowStatusWiseAggrDrilldown = async (request) => {
        try {
            let responseData = {},
                error = true;

            let paramsArray;

            paramsArray =
                new Array(
                    Number(request.organization_id),
                    Number(request.account_id),
                    Number(request.workforce_id),
                    Number(request.target_asset_id),
                    request.flag,
                    request.start_datetime,
                    request.end_datetime,
                    request.activity_type_id || 0,
                    request.activity_type_tag_id || 0,
                    request.tag_type_id || 0,
                    request.workforce_type_id || 0,
                    request.activity_status_type_id
                );

            var queryString = util.getQueryString('ds_p1_3_widget_activity_field_transaction_select_drilldown', paramsArray);
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
            return responseData;

        } catch (error) {
            return Promise.reject(error);
        }
    };
}

module.exports = WidgetService;