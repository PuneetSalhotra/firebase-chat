function HavmorService(objectCollection) {
    const queueWrapper = objectCollection.queueWrapper;
    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;

    const moment = require('moment');
    const geolib = require("geolib");
    const makeRequest = require('request');
    const uuid = require('uuid');

    this.checkAndSubimtExceptionForm = async function (request) {
        let activityInlineData = JSON.parse(request.activity_inline_data),
            activityStreamTypeId = 705;
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
                let activityTimelineCollectionFor705 = {
                    "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
                    "subject": "Freezer Survey Form",
                    "content": 'Freezer Survey Form',
                    "asset_reference": [],
                    "activity_reference": [],
                    "form_approval_field_reference": [],
                    "form_submitted": JSON.parse(request.activity_inline_data),
                    "attachments": []
                };
                newRequest.activity_timeline_collection = JSON.stringify(activityTimelineCollectionFor705);
                const freezerAssetDetails = await activityCommonService.getAssetDetailsPromise(newRequest);
                if (freezerAssetDetails.length > 0) {
                    // Asset Timeline Transaction insert for the freezer
                    activityCommonService.assetTimelineTransactionInsert(newRequest, {}, activityStreamTypeId, function (err, data) {});
                    // Activity Asset Mapping insert for the freezer
                    try {
                        await activityAssetMappingInsert(newRequest);
                        activityCommonService.assetActivityListHistoryInsert(newRequest, newRequest.asset_id, 0, function (err, restult) {});
                    } catch (error) {
                        console.log("Freezer Survey Form | activityAssetMappingInsert | Error ", error)
                    }

                    // Distance Threshold Trigger
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

                    if (distance >= 100) {
                        // Submit the exception form
                        let exceptionFormRequest = Object.assign({}, request);
                        exceptionFormRequest.activity_title = "Havmor Exception Form";
                        exceptionFormRequest.activity_description = "Havmor Exception Form";
                        exceptionFormRequest.activity_form_id = 1044;
                        exceptionFormRequest.freezer_asset_id = freezerAssetId;
                        exceptionFormRequest.activity_inline_data = JSON.stringify([{
                            "form_id": 1044,
                            "field_id": 6908,
                            "field_name": "Freezer Serial Number",
                            "field_value": uuid.v1(),
                            "message_unique_id": "319181546790573177885",
                            "data_type_combo_id": 0,
                            "field_data_type_id": 19,
                            "data_type_combo_value": "",
                            "field_data_type_category_id": 7
                        }, {
                            "form_id": 1044,
                            "field_id": 6909,
                            "field_name": "Base Location",
                            "field_value": `${latFromDB},${longFromDB}`,
                            "message_unique_id": "319181546790573177885",
                            "data_type_combo_id": 0,
                            "field_data_type_id": 17,
                            "data_type_combo_value": "",
                            "field_data_type_category_id": 5
                        }, {
                            "form_id": 1044,
                            "field_id": 6910,
                            "field_name": "Latest Location",
                            "field_value": `${freezerLocation.lat},${freezerLocation.long}`,
                            "message_unique_id": "319181546790573177885",
                            "data_type_combo_id": 0,
                            "field_data_type_id": 17,
                            "data_type_combo_value": "",
                            "field_data_type_category_id": 5
                        }, {
                            "form_id": 1044,
                            "field_id": 6911,
                            "field_name": "Distance",
                            "field_value": Number(distance),
                            "message_unique_id": "319181546790573177885",
                            "data_type_combo_id": 0,
                            "field_data_type_id": 5,
                            "data_type_combo_value": "",
                            "field_data_type_category_id": 2
                        }]);
                        const requestOptions = {
                            form: exceptionFormRequest
                        };
                        makeRequest.post(global.config.mobileBaseUrl + global.config.version + '/activity/add/v1', requestOptions, async function (error, response, body) {
                            body = JSON.parse(body);

                            if (Number(body.status) === 200) {
                                const exceptionFormActivityId = body.response.activity_id;
                                const exceptionFormTransactionId = body.response.form_transaction_id;
                                // 
                                // If the success, map the file to queue
                                // 
                                // 
                                exceptionFormRequest.activity_id = exceptionFormActivityId;
                                exceptionFormRequest.form_transaction_id = exceptionFormTransactionId;
                                let queueId = 23;
                                setTimeout(async () => {
                                    await activityCommonService
                                        .mapFileToQueue(exceptionFormRequest, queueId, JSON.stringify({
                                            "queue_sort": {
                                                "current_status_id": 281873,
                                                "file_creation_time": moment().utc().format('YYYY-MM-DD HH:mm:ss'),
                                                "queue_mapping_time": moment().utc().format('YYYY-MM-DD HH:mm:ss'),
                                                "current_status_name": "Location Exception",
                                                "last_status_alter_time": moment().utc().format('YYYY-MM-DD HH:mm:ss'),
                                                "caf_completion_percentage": 0
                                            }
                                        }))
                                        .then((queueActivityMappingData) => {
                                            console.log("updateWorkflowQueueMapping | mapFileToQueue | queueActivityMapping: ", queueActivityMappingData)
                                        })
                                        .catch((error) => {

                                            console.log("updateWorkflowQueueMapping | mapFileToQueue | Error: ", error);
                                            console.log("Object.keys(error): ", Object.keys(error));
                                        })
                                }, 2000);
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

    this.exceptionFormProcess = async function (request) {
        console.log("*Inside exceptionFormProcess*");
        let newRequest = Object.assign({}, request);
        newRequest.asset_id = request.freezer_asset_id;
        let activityTimelineCollectionFor705 = {
            "mail_body": `Form Submitted at ${moment().utcOffset('+05:30').format('LLLL')}`,
            "subject": "Havmor Exception Form",
            "content": 'Havmor Exception Form',
            "asset_reference": [],
            "activity_reference": [],
            "form_approval_field_reference": [],
            "form_submitted": JSON.parse(request.activity_inline_data),
            "attachments": []
        };
        newRequest.activity_timeline_collection = JSON.stringify(activityTimelineCollectionFor705);
        let activityStreamTypeId = 705;
        activityCommonService.assetTimelineTransactionInsert(newRequest, {}, activityStreamTypeId, function (err, data) {});

        // activityAssetMappingInsert
        try {
            await activityAssetMappingInsert(newRequest);
            activityCommonService.assetActivityListHistoryInsert(newRequest, newRequest.asset_id, 0, function (err, restult) {});
        } catch (error) {
            console.log("Exception Form | activityAssetMappingInsert | Error ", error)
        }
    }


    const activityAssetMappingInsert = function (request) {
        return new Promise((resolve, reject) => {
            const activityInlineData = JSON.parse(request.activity_inline_data);
            const activityTypeCategoryId = Number(request.activity_type_category_id);
            const paramsArr = new Array(
                request.activity_id,
                request.asset_id,
                request.workforce_id,
                request.account_id,
                request.organization_id,
                26, // request.participant_access_id,
                request.message_unique_id,
                request.flag_retry,
                request.flag_offline,
                request.asset_id,
                util.getCurrentUTCTime(),
                0 // Field ID
            );
            const queryString = util.getQueryString('ds_v1_activity_asset_mapping_insert_asset_assign_appr', paramsArr);
            if (queryString !== '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data): reject(err);
                });
            }
        });
    };
}

module.exports = HavmorService;