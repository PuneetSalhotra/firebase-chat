function HavmorService(objectCollection) {
    const queueWrapper = objectCollection.queueWrapper;
    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;

    const moment = require('moment');
    const geolib = require("geolib");
    const makeRequest = require('request');

    this.checkAndSubimtExceptionForm = async function (request) {
        let activityInlineData = JSON.parse(request.activity_inline_data)
        let freezerAssetId = 0,
            freezerLocation = {
                lat: 0,
                long: 0
            };
        // console.log(activityInlineData);
        for (const field of activityInlineData) {
            // Extract the freezer asset_id
            if (Number(field.field_id) === 6873) {
                let fieldValue = JSON.parse(field.field_value);
                freezerAssetId = Number(fieldValue.activity_internal_id);
            }

            // Extract the freezer's new asset_id
            if (Number(field.field_id) === 6875) {
                let latAndLong = String(field.field_value).split("|")[1].split(",");
                freezerLocation.lat = parseFloat(latAndLong[0]);
                freezerLocation.long = parseFloat(latAndLong[1]);
            }
        }

        console.log("freezerAssetId: ", freezerAssetId)
        console.log()
        console.log("freezerLocation: ", freezerLocation)

        if (
            freezerAssetId !== 0 &&
            freezerLocation.lat !== 0 &&
            freezerLocation.long !== 0
        ) {
            console.log("HERE 1")
            try {
                let newRequest = Object.assign({}, request);
                newRequest.asset_id = freezerAssetId;
                const freezerAssetDetails = await activityCommonService.getAssetDetailsPromise(newRequest);
                if (freezerAssetDetails.length > 0) {
                    let latFromDB = parseFloat(freezerAssetDetails[0].asset_last_location_latitude),
                        longFromDB = parseFloat(freezerAssetDetails[0].asset_last_location_longitude);

                    console.log("\nlatFromDB: %s | longFromDB: %s", latFromDB, longFromDB);
                    // console.log("freezerAssetDetails: ", freezerAssetDetails)
                    // Calculate distance
                    let distance;
                    distance = geolib.getDistance({
                        latitude: freezerLocation.lat,
                        longitude: freezerLocation.long
                    }, {
                        latitude: latFromDB,
                        longitude: longFromDB
                    });

                    console.log("Calculated distance: ", distance);

                    if (distance >= 500) {
                        // Submit the exception form
                        let exceptionFormRequest = Object.assign({}, request);
                        exceptionFormRequest.activity_title = "Havmor Exception Form";
                        exceptionFormRequest.activity_inline_data = JSON.stringify([{
                            "form_id": 1032,
                            "field_id": 6874,
                            "field_name": "Dealer Name",
                            "field_value": "Test Dealer",
                            "message_unique_id": "319181546790573177885",
                            "data_type_combo_id": 0,
                            "field_data_type_id": 19,
                            "data_type_combo_value": "",
                            "field_data_type_category_id": 7
                        }, {
                            "form_id": 1032,
                            "field_id": 6874,
                            "field_name": "Dealer Name",
                            "field_value": "Test Dealer",
                            "message_unique_id": "319181546790573177885",
                            "data_type_combo_id": 0,
                            "field_data_type_id": 19,
                            "data_type_combo_value": "",
                            "field_data_type_category_id": 7
                        }]);
                        const requestOptions = {
                            form: exceptionFormRequest
                        };
                        makeRequest.post(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', requestOptions, async function (error, response, body) {
                            body = JSON.parse(body);

                            if (Number(body.status) === 200) {
                                // 
                                // If the success, map the file to queue
                                // 
                                // 
                                exceptionFormRequest.activity_id = 0000000;
                                let queueId = 000000;
                                await activityCommonService
                                    .mapFileToQueue(request, queueId, '{}')
                                    .then((queueActivityMappingData) => {
                                        console.log("updateWorkflowQueueMapping | mapFileToQueue | queueActivityMapping: ", queueActivityMappingData)
                                    })
                                    .catch((error) => {

                                        console.log("updateWorkflowQueueMapping | mapFileToQueue | Error: ", error);
                                        console.log("Object.keys(error): ", Object.keys(error));
                                    })
                            } else {
                                // 
                            }
                        });

                    }
                }
            } catch (error) {
                console.log("freezerAssetDetails | error: ", error);
            }
        }
        return [false, {
            data: "data"
        }, 200]
    }
}

module.exports = HavmorService;