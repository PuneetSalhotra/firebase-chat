/*
 * author: Sri Sai Venkatesh
 */


function WidgetService(db, util, cacheWrapper) {

    this.getTimecardWidgetCollection = function (request, callback) {
        //IN p_organization_id BIGINT(20), IN p_form_id BIGINT(20), IN p_start_from INT(11), IN p_limit_value TINYINT(4)
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.asset_id,
                19, //form_type_id
                9,  //form_type_category_id
                5   //widget_access_level_id                
                );

        var queryString = util.getQueryString('ds_v1_widget_list_select_asset_form_type', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {                    
                    formatWidgetListing(data, function (err, finalData) {
                        if (err === false) {
                            callback(false, {data: finalData}, 200);
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
    
    this.getWidgetTimeline = function (request, callback) {
        
        var paramsArr = new Array(
                request.organization_id,
                request.asset_id,
                request.widget_id,
                request.date_start,
                request.date_end,
                request.widget_datatype_id,
                request.page_start,
                request.page_limit
                );

        var queryString = util.getQueryString('ds_v1_widget_transaction_select_sum_date_range', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                //console.log(data[0]['query_status']);
                if (err === false && Number(data[0]['query_status']) !== -1) {  
                    var responseArr = {
                        total_hours: util.replaceDefaultNumber(data[0]['total_hours']),
                        widget_axis_x_value_date: util.replaceDefaultDatetime(data[0]['widget_axis_x_value_date']),
                    };
                    callback(false, responseArr, 200);
                } else if(Number(data[0]['query_status']) === -1) {
                    callback(false, {}, 200);
                }else{
                    // some thing is wrong and have to be dealt
                    callback(err, {},-9998);
                }
            });
        }
    };


    var formatWidgetListing = function (data, callback) {
        var responseData = new Array();
        data.forEach(function (rowData, index) {
            var rowDataArr = {
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
}
;

module.exports = WidgetService;

