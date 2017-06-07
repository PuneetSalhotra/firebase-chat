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
                request.page_limit
                );
        var queryString = util.getQueryString('ds_v1_workforce_asset_type_mapping_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, {data: data}, 200);
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
;
module.exports = AssetConfigService;