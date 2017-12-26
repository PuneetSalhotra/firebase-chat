/*
 * author: Sri Sai Venkatesh
 */
var AssetService = require("../services/assetService");
function AccountService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var forEachAsync = objectCollection.forEachAsync;
    var assetService = new AssetService(objectCollection);
    //var cacheWrapper = objectCollection.cacheWrapper;
    //var activityCommonService = objectCollection.activityCommonService;

    this.getAdminAssets = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.page_start,
                request.page_limit
                );
        var queryString = util.getQueryString('ds_p1_asset_list_select_all_admin_desks', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    assetService.formatAssetCoverData(data, function (error, data) {
                        if (error === false)
                            callback(false, {data: data}, 200);
                    });
                } else {
                    callback(false, {}, 200);
                }
            });
        }
    };

    this.getDeskMappingAssets = function (request, callback) {
        var paramsArr = new Array(
                request.organization_id,
                request.asset_id,
                5,// static value
                request.page_start,
                request.page_limit
                );
        var queryString = util.getQueryString('ds_p1_asset_access_mapping_select_user_level_all', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (data.length > 0) {
                    //console.log(data);
                    assetService.formatAssetAccountDataLevel(data, function (error, data) {
                        if (error === false)
                            callback(false, {data: data}, 200);
                    });
                } else {
                    callback(false, {}, 200);
                }
            });
        }
    };

}
;

module.exports = AccountService;
