/*
 * author: Sri Sai Venkatesh
 */

var db = require("../utils/dbWrapper");
var Util = require('../utils/util');
var util = new Util();

function AssetConfigService() {

    this.getAssetTypesList = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_v1_workforce_asset_type_mapping_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, (err, data) => {
                let newData;
                if(request.hasOwnProperty('asset_type_category_id')) {                    
                    newData = [];
                    for(let i=0; i< data.length; i++) {                                
                        if(Number(request.asset_type_category_id) === Number(data[i].asset_type_category_id)) {                 
                            newData.push(data[i]);
                        }
                    }
                } else {
                    newData = data;
                }

                if (err === false) {
                    newData.forEach(function (rowData, index) {
                        
                        rowData.log_asset_first_name = util.replaceDefaultString(rowData.log_asset_first_name);
                        rowData.log_asset_last_name = util.replaceDefaultString(rowData.log_asset_last_name);
                        rowData.log_datetime = util.replaceDefaultDatetime(rowData.log_datetime);
                        rowData.asset_type_description = util.replaceDefaultString(rowData.asset_type_description);
                        rowData.workforce_default_module_id = util.replaceDefaultNumber(rowData['workforce_default_module_id']);
                        rowData.workforce_default_module_name = util.replaceDefaultString(rowData['workforce_default_module_name']);
                        rowData.account_default_module_id = util.replaceDefaultNumber(rowData['account_default_module_id']);
                        rowData.account_default_module_name = util.replaceDefaultString(rowData['account_default_module_name']);

                    }, this);
                    callback(false, {
                        data: newData
                    }, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };
}

module.exports = AssetConfigService;
