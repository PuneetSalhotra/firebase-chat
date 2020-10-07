function Utils() {

    const nodeUtil = require('util');
    const self = this;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const normalizeACosArg = (val) => {
        if (val > 1) {
            return 1;
        }
        if (val < -1) {
            return -1;
        }
        return val;
    };
    const toRad = (value) => (value * Math.PI) / 180;
    // 
    this.getFieldExecutiveDistance = function (origin, destination) {
        const earthRadius = 6378137;

        const fromLat = origin.latitude;
        const fromLon = origin.longitude;
        const toLat = destination.latitude;
        const toLon = destination.longitude;

        accuracy = typeof accuracy !== 'undefined' && !isNaN(accuracy) ? accuracy : 1;

        const distance =
                Math.acos(
                  normalizeACosArg(
                    Math.sin(toRad(toLat)) * Math.sin(toRad(fromLat)) +
                    Math.cos(toRad(toLat)) *
                    Math.cos(toRad(fromLat)) *
                    Math.cos(toRad(fromLon) - toRad(toLon))
                  )
                ) * earthRadius;

        const accDistance = Math.round(distance / accuracy) * accuracy;
        console.log("accDistance: ", accDistance);

        return {
            metres: accDistance
        };
    }

    this.filterFieldExecutiveAssetData = function (assetData) {
        return {
            "asset_id": assetData.asset_id,
            "asset_first_name": assetData.asset_first_name,
            "asset_last_name": assetData.asset_last_name,
            "asset_description": assetData.asset_description,
            "asset_image_path": assetData.asset_image_path,
            "asset_phone_country_code": assetData.asset_phone_country_code,
            "asset_phone_number": assetData.asset_phone_number,
            "asset_last_seen_datetime": assetData.asset_last_seen_datetime,
            "asset_type_name": assetData.asset_type_name,
            "asset_type_category_id": assetData.asset_type_category_id,
            "asset_type_category_name": assetData.asset_type_category_name,
            "operating_asset_id": assetData.operating_asset_id,
            "operating_asset_first_name": assetData.operating_asset_first_name,
            "operating_asset_last_name": assetData.operating_asset_last_name,
            "operating_asset_image_path": assetData.operating_asset_image_path,
            "operating_asset_type_name": assetData.operating_asset_type_name,
            "operating_asset_type_category_id": assetData.operating_asset_type_category_id,
            "operating_asset_type_category_name": assetData.operating_asset_type_category_name,
            "operating_asset_phone_country_code": assetData.operating_asset_phone_country_code,
            "operating_asset_phone_number": assetData.operating_asset_phone_number,
            "operating_asset_customer_unique_id": assetData.operating_asset_customer_unique_id,
            "asset_gender_id": assetData.asset_gender_id,
            "asset_gender_name": assetData.asset_gender_name,
            "operating_asset_gender_id": assetData.operating_asset_gender_id,
            "operating_asset_gender_name": assetData.operating_asset_gender_name,
            "asset_work_location_address": assetData.asset_work_location_address,
            "asset_work_location_latitude": assetData.asset_work_location_latitude,
            "asset_work_location_longitude": assetData.asset_work_location_longitude
        }
    }

}

module.exports = Utils;
